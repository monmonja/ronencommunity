import Phaser from 'phaser';
import {createButton} from "../../common/buttons.mjs";
import {createCpuGameRoom, createGameRoom, joinGameRoom, watchGameRoom} from "../../common/utils/room-utils.mjs";
import constants from "../../common/constants.mjs";
import {interactiveBoundsChecker} from "../../common/rotate-utils.mjs";
import {createEnergyUI, fetchEnergy} from "../../common/energies.mjs";
import {addSettingsIcon} from "../../common/settings.mjs";

const panelHeight = 180;

export default class RoomSelectionScene extends Phaser.Scene {
  constructor() {
    super('RoomSelectionScene');
    this.dropdownOptions = [
      { label: 'Auto Battler', value: 'autoBattler' },
      // { label: 'Skill Countdown', value: 'skillCountdown' },
      { label: 'Turn Based SP', value: 'turnBasedSP' },
      // { label: 'Turn Based One Char', value: 'turnBasedOneChar' },
    ];
  }

  init(data) {
    this.selectedBaxies = data.selectedBaxies ?? localStorage.getItem('selectedBaxies');
  }

  preload() {
    this.load.image("energy-icon", "{{config.cdnLink}}/game-assets/common/images/energy.png");
    this.load.image("settings", "{{config.cdnLink}}/game-assets/common/images/settings.png");
    fetchEnergy(this);

    for (let i = 0; i < this.selectedBaxies.length; i++) {
      const baxie = this.selectedBaxies[i];
      const key = `baxie-${baxie.tokenId}`;

      if (!this.textures.exists(key)) {
        this.load.image(key, baxie.image);
      }
    }
  }

  createPanelBg(panelWidth, panelHeight) {
    const bg = this.add.graphics();

// Draw filled rounded rectangle
    bg.fillStyle(0x191933, 0.9);
    bg.lineStyle(2, 0x05df72, 0.3);
    bg.fillRoundedRect(0, 0, panelWidth, panelHeight, 12); // 12 = radius
    bg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 12);

    return bg;
  }

  createInputBg(panelWidth, currentY, inputWidth, inputHeight) {
    const inputBg = this.add.graphics();

// Draw filled rounded rectangle
    inputBg.fillStyle(0x101022, 1); // background color
    inputBg.lineStyle(3, 0x2d2d55, 1); // border color
    inputBg.fillRoundedRect(
      panelWidth / 2 - inputWidth / 2, // x (top-left)
      currentY,                        // y (top-left)
      inputWidth,                       // width
      inputHeight,                      // height
      12                                 // corner radius
    );
    inputBg.strokeRoundedRect(
      panelWidth / 2 - inputWidth / 2,
      currentY,
      inputWidth,
      inputHeight,
      8
    );
    return inputBg;
  }

  createARoomContainer(x, y) {
    const container = this.add.container(x, y);
    const panelWidth = 300;

    container.add(this.createPanelBg(panelWidth, panelHeight));

    let currentY = 40; // padding from the top


    // === Input Field ===
    const inputWidth = panelWidth - 40;
    const inputHeight = 50;

    container.add(this.createInputBg(panelWidth, currentY, inputWidth, inputHeight));

    container.add(this.add.text(
      panelWidth - 20,
      20,
      'Uses 5 energy',
      {
        fontFamily: constants.fonts.Newsreader,
        fontSize: '12px',
        color: '#ffffff',
      }
    ).setOrigin(1, 0.5));

    const roomId = ''; // initially empty
    const inputText = this.add.text(
      panelWidth / 2 - inputWidth / 2 + 15,
      currentY + inputHeight / 2,
      roomId || 'Your room Id',
      {
        fontFamily: constants.fonts.troika,
        fontSize: '17px',
        color: roomId ? '#ffffff' : '#9292c9',
      }
    ).setOrigin(0, 0.5);
    container.add(inputText);

    // === Copy Button ===
    const copyButton = this.add.rectangle(
      panelWidth / 2 + inputWidth / 2 - 20,
      currentY + inputHeight / 2,
      40,
      40,
      0x111827
    )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    container.add(copyButton);

    const copyIcon = this.add.text(copyButton.x, copyButton.y, '📋', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add(copyIcon);

    copyButton.on('pointerdown', () => {
      if (inputText.text && inputText.text !== 'Generating ID...') {
        navigator.clipboard.writeText(inputText.text);
        copyIcon.setText('✅');
        this.time.delayedCall(1000, () => copyIcon.setText('📋'));
      }
    });

    copyButton.on('pointerover', () => copyButton.setFillStyle(0x444488));
    copyButton.on('pointerout', () => copyButton.setFillStyle(0x111827));

    currentY += inputHeight + 15;

    // === Start Game Button ===
    const startBtn = createButton({
      scene: this,
      x: (panelWidth - (panelWidth - 40)) / 2, // center horizontally
      y: currentY,
      width: panelWidth - 40,
      height: 50,
      text: 'Create Room',
      topBgColor: 0x6A6AFF,
      bottomBgColor: 0x6A6AFF,
      innerBaseColor: 0x6A6AFF,
      borderColor: 0x6A6AFF,
      onPointerDown: async () => {
        if (!startBtn.clicked) {
          const energy = this.registry.get(constants.registry.energy);

          if (energy.available >= 5) {
            try {
              createGameRoom({
                scene: this,
                gameId: this.game.customConfig.gameId,
                gameMode: 'autoBattler',
              })
                .then((response) => {
                  inputText.text = response.roomId;
                  inputText.setColor('#ffffff');
                  startBtn.getByName('label').text = 'Waiting...';

                  this.ws = new WebSocket(response.wsUrl);

                  this.ws.addEventListener('open', () => {
                    this.ws.send(
                      JSON.stringify({
                        type: 'joinRoom',
                        gameId: this.game.customConfig.gameId,
                        roomId: response.roomId,
                        selectedBaxies: this.selectedBaxies,
                      })
                    );
                  });

                  this.ws.onmessage = (msg) => {
                    const data = JSON.parse(msg.data);
                    if (data.type === 'initGame') {
                      this.scene.start('GameScene', {
                        ws: this.ws,
                        roomId: response.roomId,
                        player: data.player,
                        enemy: data.enemy,
                        isYourTurn: data.isYourTurn,
                        turnIndex: data.turnIndex,
                        gameMode: data.gameMode,
                        selectedBaxies: this.selectedBaxies,
                      });
                      startBtn.clicked = false;
                    }
                  };
                })
                .catch((e) => {
                  startBtn.clicked = false;
                  alert('Someone went wrong creating the room. Please try again.');
                });
            } catch (e) {
              console.error('Error creating game room:', e);
            }
          } else {
            this.scene.launch('EnergiesScene');
          }
        }
      },
    });
    container.add(startBtn);

    return container;
  }

  createJoinRoomContainer(x, y) {
    const container = this.add.container(x, y);
    const panelWidth = 300;

    container.add(this.createPanelBg(panelWidth, panelHeight));

    let currentY = 40; // start with some padding from the top

    container.add(this.add.text(
      panelWidth - 20,
      20,
      'Uses 5 energy',
      {
        fontFamily: constants.fonts.Newsreader,
        fontSize: '12px',
        color: '#ffffff',
      }
    ).setOrigin(1, 0.5));

    // === Input Field ===
    const inputWidth = panelWidth - 40;
    const inputHeight = 50;
    const inputBg = this.createInputBg(panelWidth, currentY, inputWidth, inputHeight);
    container.add(inputBg);

    const inputPlaceholder = 'Enter Room ID';
    const inputText = this.add.text(panelWidth / 2 - inputWidth / 2 + 15, currentY + inputHeight / 2, inputPlaceholder, {
      fontFamily: constants.fonts.troika,
      fontSize: '18px',
      color: '#9292c9',
    }).setOrigin(0, 0.5);
    inputBg.setInteractive(
      new Phaser.Geom.Rectangle(
        panelWidth / 2 - inputWidth / 2,
        currentY,
        inputWidth,
        inputHeight
      ),
      interactiveBoundsChecker,
    );
    inputBg.on('pointerdown', () => {
      const current = prompt('Enter Room ID:');
      if (current) {
        inputText.setText(current);
        inputText.setColor('#ffffff');
      }
    });
    container.add(inputText);

    currentY += inputHeight + 15;

    // === Join Button ===
    const joinBtn = createButton({
      scene: this,
      x: (panelWidth - (panelWidth - 40)) / 2, // center horizontally
      y: currentY,
      width: panelWidth - 40,
      height: 50,
      text: 'Join Room',
      topBgColor: 0x6A6AFF,
      bottomBgColor: 0x6A6AFF,
      innerBaseColor: 0x6A6AFF,
      borderColor: 0x6A6AFF,
      onPointerDown: () => {
        if (!joinBtn.clicked) {
          const energy = this.registry.get(constants.registry.energy);

          if (energy.available >= 5) {
            joinBtn.clicked = true;

            joinGameRoom({
              scene: this,
              gameId: this.game.customConfig.gameId,
              roomId: inputText.text,
            })
              .then((response) => {
                this.ws = new WebSocket(response.wsUrl);

                this.ws.onopen = () => {
                  joinBtn.getByName('label').text = 'Waiting...';

                  this.ws.send(JSON.stringify({
                    type: 'joinRoom',
                    gameId: this.game.customConfig.gameId,
                    roomId: response.roomId,
                    selectedBaxies: this.selectedBaxies,
                  }));
                };

                this.ws.onmessage = (msg) => {
                  const data = JSON.parse(msg.data);

                  if (data.type === 'initGame') {
                    this.scene.start('GameScene', {
                      ws: this.ws,
                      roomId: response.roomId,
                      player: data.player,
                      enemy: data.enemy,
                      isYourTurn: data.isYourTurn,
                      turnIndex: data.turnIndex,
                      gameMode: data.gameMode,
                      selectedBaxies: this.selectedBaxies,
                    });
                    joinBtn.clicked = false;
                  }
                };
              })
              .catch((e) => {
                joinBtn.clicked = false;
                alert('Failed to join the room. Please check the Room ID and try again.');
              });
          } else {
            this.scene.launch('EnergiesScene');
          }
        }
      },
    });
    container.add(joinBtn);

    return container;
  }

  createPracticeModeContainer(x, y) {
    const container = this.add.container(x, y);
    const panelWidth = 300;

    container.add(this.createPanelBg(panelWidth, panelHeight));

    let currentY = 40; // Start padding top

    container.add(this.add.text(
      panelWidth - 20,
      20,
      'Uses 3 energy',
      {
        fontFamily: constants.fonts.Newsreader,
        fontSize: '12px',
        color: '#ffffff',
      }
    ).setOrigin(1, 0.5));

    // === Button ===
    const btnBg = createButton({
      scene: this,
      x: (panelWidth - (panelWidth - 40)) / 2, // center horizontally
      y: currentY,
      width: panelWidth - 40,
      height: 50,
      text: 'VS CPU',
      topBgColor: 0x6A6AFF,
      bottomBgColor: 0x6A6AFF,
      innerBaseColor: 0x6A6AFF,
      borderColor: 0x6A6AFF,
      onPointerDown: async () => {
        if (!btnBg.clicked) {
          const energy = this.registry.get(constants.registry.energy);

          if (energy.available >= 3) {
            btnBg.clicked = true;
            createCpuGameRoom({
              scene: this,
              gameId: this.game.customConfig.gameId,
              gameMode: 'autoBattler',
            }).then((response) => {
              this.ws = new WebSocket(response.wsUrl);

              this.ws.addEventListener("open", (event) => {
                this.ws.send(JSON.stringify({
                  type: 'joinRoom',
                  gameId: this.game.customConfig.gameId,
                  roomId: response.roomId,
                  selectedBaxies: this.selectedBaxies,
                }));
              });

              this.ws.addEventListener("error", (msg) => {
                console.log("WebSocket error:", msg)
              });
              this.ws.addEventListener("close", (msg) => {
                console.log("WebSocket close:", msg)
              });
              this.ws.addEventListener("message", (msg) => {
                const data = JSON.parse(msg.data);
                if (data.type === 'initGame') {
                  this.scene.start('GameScene', {
                    ws: this.ws,
                    roomId: response.roomId,
                    player: data.player,
                    enemy: data.enemy,
                    isYourTurn: data.isYourTurn,
                    turnIndex: data.turnIndex,
                    gameMode: data.gameMode,
                    selectedBaxies: this.selectedBaxies,
                  });
                  btnBg.clicked = false;
                }
              });
            });
          } else {
            this.scene.launch('EnergiesScene');
          }
        }
      },
    })
    container.add(btnBg);

    currentY += 65;

    const spectatorBtn = createButton({
      scene: this,
      x: (panelWidth - (panelWidth - 40)) / 2, // center horizontally
      y: currentY,
      width: panelWidth - 40,
      height: 50,
      text: 'Spectator Mode',
      topBgColor: 0x6A6AFF,
      bottomBgColor: 0x6A6AFF,
      innerBaseColor: 0x6A6AFF,
      borderColor: 0x6A6AFF,
      onPointerDown: async () => {
        const current = prompt('Enter Room ID:');
        if (current) {
          watchGameRoom({
            scene: this,
            gameId: this.game.customConfig.gameId,
            roomId: current,
            gameMode: 'autoBattler',
          }).then((response) => {
            this.ws = new WebSocket(response.wsUrl);
            spectatorBtn.getByName('label').text = 'Waiting...';

            this.ws.addEventListener("open", (event) => {
              this.ws.send(JSON.stringify({
                type: 'watchRoom',
                gameId: this.game.customConfig.gameId,
                roomId: response.roomId,
              }));
            });

            this.ws.addEventListener("error", (msg) => {
              console.log("WebSocket error:", msg)
            });
            this.ws.addEventListener("close", (msg) => {
              console.log("WebSocket close:", msg)
            });
            this.ws.addEventListener("message", (msg) => {
              const data = JSON.parse(msg.data);
              if (data.type === 'initGame') {
                this.scene.start('GameScene', {
                  ws: this.ws,
                  roomId: response.roomId,
                  player: data.player,
                  enemy: data.enemy,
                  isYourTurn: data.isYourTurn,
                  turnIndex: data.turnIndex,
                  gameMode: data.gameMode,
                });
                btnBg.clicked = false;
              }
            });
          });

        }
      },
    })
    container.add(spectatorBtn);

    return container;
  }

  renderSelectedBaxies() {
    this.selectedBaxies.forEach((baxie, index) => {
      const key = `baxie-${baxie.tokenId}`;
      const sprite = this.add.image((this.game.scale.width / 2) - 200 + (index * 200), 200, key)
        .setOrigin(0.5)
        .setScale(0.15);
      this.world.add(sprite);
    });

    createButton({
      scene: this,
      x: 830, // center horizontally
      y: 280,
      width: 120,
      height: 40,
      text: 'Change Team',
      topBgColor: 0x6A6AFF,
      bottomBgColor: 0x6A6AFF,
      innerBaseColor: 0x6A6AFF,
      borderColor: 0x6A6AFF,
      fontSize: '18px',
      onPointerDown: () => {
        this.scene.start('SelectionScene');
      },
    });

    createButton({
      scene: this,
      x: 830, // center horizontally
      y: 220,
      width: 120,
      height: 40,
      text: 'Sync Baxies',
      topBgColor: 0x6A6AFF,
      bottomBgColor: 0x6A6AFF,
      innerBaseColor: 0x6A6AFF,
      borderColor: 0x6A6AFF,
      fontSize: '18px',
      onPointerDown: () => {
        this.scene.start('SyncMenuScene');
      },
    });
  }

  create() {
    this.backgroundDay = this.add
      .image(0, 0, 'bg')
      .setOrigin(0, 0)
      .setInteractive();
    this.world = this.add.container(0, 0);
    this.renderSelectedBaxies();

    document.fonts.load('16px troika').then(() => {
      let center = this.cameras.main.width / 2;
      const panelWidth = 300;
      const halfPanelWidth = panelWidth / 2;
      const padding = 20;

      const startY = 370;
      this.createARoomContainer(center - halfPanelWidth - panelWidth - padding, startY);
      this.createJoinRoomContainer(center - halfPanelWidth, startY);
      this.createPracticeModeContainer(center + halfPanelWidth + padding, startY);

      addSettingsIcon({
        scene: this,
        width: 32,
      });

      createEnergyUI({
        scene: this,
        x: this.game.scale.width - 100,
        y: 22,
        width: 80,
        height: 40,
        fontSize: "24px",
        textColor: "#000000",
        imageScale: 1.3,
        imageX: 0,
        imageY: 0,
        textX: 44,
        textY: 22
      })
    });
  }
}