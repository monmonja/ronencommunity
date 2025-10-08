import Phaser from 'phaser';
import {createButton, createCircleButton} from "../../common/buttons.mjs";
import {createCpuGameRoom, createGameRoom, joinGameRoom} from "../../common/scene/rooms-scene.mjs";
import constants from "../../common/constants.mjs";
import Dropdown from "../../common/ui/dropdown.mjs";
import {interactiveBoundsChecker} from "../../common/rotate-utils.mjs";

const panelHeight = 400;

export default class RoomSelectionScene extends Phaser.Scene {
  constructor() {
    super('RoomSelectionScene');
    this.dropdownOptions = [
      { label: 'Skill Countdown', value: 'skillCountdown' },
      { label: 'Turn Based SP', value: 'turnBasedSP' },
      { label: 'Turn Based One Char', value: 'turnBasedOneChar' },
    ];
  }

  init(data) {
    this.selectedBaxies = data.selectedBaxies || new URLSearchParams(location.search).get("baxies").split(',').map(tokenId => ({ tokenId }));
    console.log('this.selectedBaxies', this.selectedBaxies)
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

    let currentY = 20; // padding from the top

    // === Title ===
    const title = this.add.text(panelWidth / 2, currentY, 'Create a Room', {
      fontFamily: constants.fonts.Newsreader,
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0); // center horizontally, top aligned
    container.add(title);

    currentY += 50;

    // === Description ===
    const desc = this.add.text(panelWidth / 2, currentY, 'Start a new game and invite a friend.', {
      fontFamily: constants.fonts.Newsreader,
      fontSize: '16px',
      color: '#ccccff',
    }).setOrigin(0.5, 0);
    container.add(desc);

    currentY += 50;

    // === Label: Your Room ID ===
    const label = this.add.text(20, currentY, 'Your Room ID:', {
      fontFamily: constants.fonts.Newsreader,
      fontSize: '14px',
      color: '#ccccff',
    }).setOrigin(0, 0.5);
    container.add(label);

    currentY += 20;

    // === Input Field ===
    const inputWidth = panelWidth - 40;
    const inputHeight = 50;

    container.add(this.createInputBg(panelWidth, currentY, inputWidth, inputHeight));

    const roomId = ''; // initially empty
    const inputText = this.add.text(
      panelWidth / 2 - inputWidth / 2 + 15,
      currentY + inputHeight / 2,
      roomId || 'Click Start Game',
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

    currentY += inputHeight + 30;

    const gameMode = this.add.text(20, currentY, 'Game mode:', {
      fontFamily: constants.fonts.Newsreader,
      fontSize: '14px',
      color: '#ccccff',
    }).setOrigin(0, 0.5);
    container.add(gameMode);

    currentY += 45;

    const dropdown = new Dropdown(this, panelWidth / 2, currentY, {
      options: this.dropdownOptions,
      bgColor: 0x101022,
      strokeColor: 0x2d2d55,
      width: inputWidth,
      height: inputHeight,
      fontColor: '#9292c9',
      defaultLabel: 'Skill Countdown',
    })
      .setDepth(12);

    currentY +=  50;

    // === Start Game Button ===
    const startBtn = createButton({
      scene: this,
      x: (panelWidth - (panelWidth - 40)) / 2, // center horizontally
      y: currentY,
      width: panelWidth - 40,
      height: 50,
      text: 'Start Game',
      topBgColor: 0x6A6AFF,
      bottomBgColor: 0x6A6AFF,
      innerBaseColor: 0x6A6AFF,
      borderColor: 0x6A6AFF,
      onPointerDown: async () => {
        const response = await createGameRoom({
          scene: this,
          gameId: this.game.customConfig.gameId,
          gameMode: dropdown.getValue() ?? 'skillCountdown',
        });

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
              selectedBaxies: this.selectedBaxies.map((b) => b.tokenId),
            })
          );
        });

        this.ws.onmessage = (msg) => {
          const data = JSON.parse(msg.data);
          if (data.type === 'startGame') {
            this.scene.start('GameScene', {
              ws: this.ws,
              roomId: response.roomId,
              player: data.player,
              enemy: data.enemy,
              isYourTurn: data.isYourTurn,
              turnIndex: data.turnIndex,
              gameMode: data.gameMode,
            });
          }
        };
      },
    });
    container.add(startBtn);
    container.add(dropdown);

    return container;
  }

  createJoinRoomContainer(x, y) {
    const container = this.add.container(x, y);
    const panelWidth = 300;

    container.add(this.createPanelBg(panelWidth, panelHeight));

    let currentY = 20; // start with some padding from the top

    // === Title ===
    const title = this.add.text(panelWidth / 2, currentY, 'Join a Room', {
      fontFamily: constants.fonts.Newsreader,
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0); // center horizontally, top align vertically
    container.add(title);

    currentY += 50;

    // === Description ===
    const desc = this.add.text(panelWidth / 2, currentY, 'Enter a Room ID to join a game.', {
      fontFamily: constants.fonts.Newsreader,
      fontSize: '16px',
      color: '#ccccff',
    }).setOrigin(0.5, 0);
    container.add(desc);

    currentY += 40;

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

    currentY += inputHeight + 20;

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
      onPointerDown: async () => {
        joinGameRoom({
          scene: this,
          gameId: this.game.customConfig.gameId,
          roomId: inputText.text,
        }).then((response) => {
          this.ws = new WebSocket(response.wsUrl);

          this.ws.onopen = () => {
            this.ws.send(JSON.stringify({
              type: 'joinRoom',
              gameId: this.game.customConfig.gameId,
              roomId: response.roomId,
              selectedBaxies: this.selectedBaxies.map((b) => b.tokenId),
            }));
          };

          this.ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data.type === 'startGame') {
              this.scene.start('GameScene', {
                ws: this.ws,
                roomId: response.roomId,
                player: data.player,
                enemy: data.enemy,
                isYourTurn: data.isYourTurn,
                turnIndex: data.turnIndex,
                gameMode: data.gameMode,
              });
            }
          };
        });
      },
    });
    container.add(joinBtn);

    return container;
  }

  createPracticeModeContainer(x, y) {
    const container = this.add.container(x, y);
    const panelWidth = 300;

    container.add(this.createPanelBg(panelWidth, panelHeight));

    let currentY = 20; // Start padding top

    // === Title ===
    const title = this.add.text(panelWidth / 2, currentY, 'Practice Mode', {
      fontFamily: constants.fonts.Newsreader,
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    container.add(title);

    currentY += 50;

    // === Description ===
    const desc = this.add.text(panelWidth / 2, currentY, 'Hone your skills against our AI.', {
      fontFamily: constants.fonts.Newsreader,
      fontSize: '16px',
      color: '#ccccff',
    }).setOrigin(0.5, 0);
    container.add(desc);
    currentY += 50;

    // === Input Field ===
    const inputWidth = panelWidth - 40;
    const inputHeight = 50;
    const inputBg = this.createInputBg(panelWidth, currentY + 20  , inputWidth, inputHeight);
    container.add(inputBg);

    const characterIdLabel = this.add.text(20, currentY, 'Character Id (Optional):', {
      fontFamily: constants.fonts.Newsreader,
      fontSize: '14px',
      color: '#ccccff',
    }).setOrigin(0, 0.5);
    container.add(characterIdLabel);

    currentY += 20;

    const inputPlaceholder = '1,3,4';
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
      const current = prompt('Enter character id separated by comma:');
      if (current) {
        inputText.setText(current);
        inputText.setColor('#ffffff');
      }
    });
    container.add(inputText);
    currentY += inputHeight + 30;

    const gameMode = this.add.text(20, currentY, 'Game mode:', {
      fontFamily: constants.fonts.Newsreader,
      fontSize: '14px',
      color: '#ccccff',
    }).setOrigin(0, 0.5);
    container.add(gameMode);

    currentY += 45;


    const dropdown = new Dropdown(this, panelWidth / 2, currentY, {
      options: this.dropdownOptions,
      bgColor: 0x101022,
      strokeColor: 0x2d2d55,
      width: inputWidth,
      height: inputHeight,
      fontColor: '#9292c9',
      defaultLabel: 'Skill Countdown',
    })
      .setDepth(12);


    currentY +=  50;

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
        createCpuGameRoom({
          scene: this,
          gameId: this.game.customConfig.gameId,
          gameMode: dropdown.getValue() ?? 'skillCountdown',
          characterIds: inputText.text && inputText.text !== inputPlaceholder ? inputText.text : undefined,
        }).then((response) => {
          this.ws = new WebSocket(response.wsUrl);

          this.ws.addEventListener("open", (event) => {
            this.ws.send(JSON.stringify({
              type: 'joinRoom',
              gameId: this.game.customConfig.gameId,
              roomId: response.roomId,
              selectedBaxies: this.selectedBaxies.map((b) => b.tokenId),
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
            if (data.type === 'startGame') {
              this.scene.start('GameScene', {
                ws: this.ws,
                roomId: response.roomId,
                player: data.player,
                enemy: data.enemy,
                isYourTurn: data.isYourTurn,
                turnIndex: data.turnIndex,
                gameMode: data.gameMode,
              });
            }
          });
        });
      },
    })
    container.add(btnBg);
    container.add(dropdown);

    return container;
  }



  create() {
    this.world = this.add.container(0, 0);

    // this.backgroundDay = this.add
    //   .image(0, 0, 'level-bg')
    //   .setOrigin(0, 0)
    //   .setInteractive();
    // this.world.add(this.backgroundDay);

    document.fonts.load('16px troika').then(() => {
      let center = this.cameras.main.width / 2;
      const panelWidth = 300;
      const halfPanelWidth = panelWidth / 2;
      const padding = 20;

      this.createARoomContainer(center - halfPanelWidth - panelWidth - padding, 100);
      this.createJoinRoomContainer(center - halfPanelWidth, 100);
      this.createPracticeModeContainer(center + halfPanelWidth + padding, 100);
    });
  }
}