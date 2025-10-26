import Phaser from 'phaser';
import {createButton, createCircleButton} from "../../common/buttons.mjs";
import {createCpuGameRoom, createGameRoom, joinGameRoom} from "../../common/scene/rooms-scene.mjs";
import constants from "../../common/constants.mjs";
import Dropdown from "../../common/ui/dropdown.mjs";
import {interactiveBoundsChecker} from "../../common/rotate-utils.mjs";
import {createEnergyUI, fetchEnergy} from "../../common/energies.mjs";

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
    this.selectedBaxies = data.selectedBaxies ?? [
      {
        "_id": "68dbddfa96eb8e86151ff2ca",
        "nftId": "1250",
        "network": "ronin",
        "nftTokenId": "baxies",
        "createdAt": "2025-09-30T13:41:13.968Z",
        "data": {
          "name": "Baxie Ethernity #1250",
          "external_url": "https://baxieethernity.com/",
          "image": "https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1250.png",
          "attributes": [
            {
              "display_type": "string",
              "trait_type": "Status",
              "value": "Finalized"
            },
            {
              "display_type": "string",
              "trait_type": "Class",
              "value": "Electric"
            },
            {
              "display_type": "string",
              "trait_type": "Gender",
              "value": "Male"
            },
            {
              "display_type": "string",
              "trait_type": "Tail",
              "value": "Fairy #3"
            },
            {
              "display_type": "string",
              "trait_type": "Ears",
              "value": "Fire #3"
            },
            {
              "display_type": "string",
              "trait_type": "Mouth",
              "value": "Electric #4"
            },
            {
              "display_type": "string",
              "trait_type": "Eyes",
              "value": "Plant #3"
            },
            {
              "display_type": "string",
              "trait_type": "Forehead",
              "value": "Electric #1"
            },
            {
              "display_type": "number",
              "trait_type": "Attack",
              "value": "66"
            },
            {
              "display_type": "number",
              "trait_type": "Defense",
              "value": "67"
            },
            {
              "display_type": "number",
              "trait_type": "Stamina",
              "value": "78"
            },
            {
              "display_type": "number",
              "trait_type": "Skill",
              "value": "2"
            },
            {
              "display_type": "string",
              "trait_type": "Mystic",
              "value": "0/5"
            },
            {
              "display_type": "string",
              "trait_type": "Purity",
              "value": "3/6"
            },
            {
              "display_type": "number",
              "trait_type": "Breed Count",
              "value": "0"
            },
            {
              "display_type": "number",
              "trait_type": "Reroll Count",
              "value": "3"
            },
            {
              "display_type": "date",
              "trait_type": "Birthdate",
              "value": 1757173635
            }
          ]
        },
        "tokenId": "1250",
        "hp": 101,
        "stamina": 78,
        "image": "https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1250.png",
        "skills": [
          {
            "func": "voltOverload",
            "cost": 40,
            "cooldown": 7.6923076923076925,
            "image": "electric-volt-overload"
          },
          {
            "func": "chargeUp",
            "cost": 30,
            "cooldown": 7.6923076923076925,
            "image": "electric-charge-up"
          },
          {
            "func": "stormBreaker",
            "cost": 10,
            "cooldown": 7.6923076923076925,
            "image": "electric-storm-breaker"
          }
        ],
        "purity":"1/6",
        "position": "back"
      },
      {
        "_id": "68dbddfa96eb8e86151ff2cb",
        "nftTokenId": "baxies",
        "network": "ronin",
        "nftId": "1251",
        "createdAt": "2025-09-30T13:41:13.972Z",
        "data": {
          "name": "Baxie Ethernity #1251",
          "external_url": "https://baxieethernity.com/",
          "image": "https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1251.png",
          "attributes": [
            {
              "display_type": "string",
              "trait_type": "Status",
              "value": "Finalized"
            },
            {
              "display_type": "string",
              "trait_type": "Class",
              "value": "Plant"
            },
            {
              "display_type": "string",
              "trait_type": "Gender",
              "value": "Male"
            },
            {
              "display_type": "string",
              "trait_type": "Tail",
              "value": "Plant #1"
            },
            {
              "display_type": "string",
              "trait_type": "Ears",
              "value": "Plant #2"
            },
            {
              "display_type": "string",
              "trait_type": "Mouth",
              "value": "Demon #3"
            },
            {
              "display_type": "string",
              "trait_type": "Eyes",
              "value": "Plant #2"
            },
            {
              "display_type": "string",
              "trait_type": "Forehead",
              "value": "Plant #1"
            },
            {
              "display_type": "number",
              "trait_type": "Attack",
              "value": "88"
            },
            {
              "display_type": "number",
              "trait_type": "Defense",
              "value": "99"
            },
            {
              "display_type": "number",
              "trait_type": "Stamina",
              "value": "87"
            },
            {
              "display_type": "number",
              "trait_type": "Skill",
              "value": "3"
            },
            {
              "display_type": "string",
              "trait_type": "Mystic",
              "value": "0/5"
            },
            {
              "display_type": "string",
              "trait_type": "Purity",
              "value": "5/6"
            },
            {
              "display_type": "number",
              "trait_type": "Breed Count",
              "value": "0"
            },
            {
              "display_type": "number",
              "trait_type": "Reroll Count",
              "value": "3"
            },
            {
              "display_type": "date",
              "trait_type": "Birthdate",
              "value": 1757173647
            }
          ]
        },
        "tokenId": "1251",
        "hp": 149,
        "stamina": 87,
        "image": "https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1251.png",
        "skills": [
          {
            "func": "naturesResurgence",
            "cost": 30,
            "cooldown": 6.896551724137931,
            "image": "plant-natures-resurgence"
          },
          {
            "func": "thornGuard",
            "cost": 25,
            "cooldown": 6.896551724137931,
            "image": "plant-thorn-guard"
          },
          {
            "func": "bloomOvergrowth",
            "cost": 40,
            "cooldown": 6.896551724137931,
            "image": "plant-bloom-overgrowth"
          }
        ],
        "purity":"3/6",
        "position": "back"
      },
      {
        "_id": "68dbddfa96eb8e86151ff2cc",
        "nftTokenId": "baxies",
        "network": "ronin",
        "nftId": "1252",
        "createdAt": "2025-09-30T13:41:13.971Z",
        "data": {
          "name": "Baxie Ethernity #1252",
          "external_url": "https://baxieethernity.com/",
          "image": "https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1252.png",
          "attributes": [
            {
              "display_type": "string",
              "trait_type": "Status",
              "value": "Finalized"
            },
            {
              "display_type": "string",
              "trait_type": "Class",
              "value": "Electric"
            },
            {
              "display_type": "string",
              "trait_type": "Gender",
              "value": "Male"
            },
            {
              "display_type": "string",
              "trait_type": "Tail",
              "value": "Electric #3"
            },
            {
              "display_type": "string",
              "trait_type": "Ears",
              "value": "Fairy #3"
            },
            {
              "display_type": "string",
              "trait_type": "Mouth",
              "value": "Fairy #1"
            },
            {
              "display_type": "string",
              "trait_type": "Eyes",
              "value": "Aqua #3"
            },
            {
              "display_type": "string",
              "trait_type": "Forehead",
              "value": "Aqua #1"
            },
            {
              "display_type": "number",
              "trait_type": "Attack",
              "value": "56"
            },
            {
              "display_type": "number",
              "trait_type": "Defense",
              "value": "58"
            },
            {
              "display_type": "number",
              "trait_type": "Stamina",
              "value": "68"
            },
            {
              "display_type": "number",
              "trait_type": "Skill",
              "value": "1"
            },
            {
              "display_type": "string",
              "trait_type": "Mystic",
              "value": "0/5"
            },
            {
              "display_type": "string",
              "trait_type": "Purity",
              "value": "2/6"
            },
            {
              "display_type": "number",
              "trait_type": "Breed Count",
              "value": "0"
            },
            {
              "display_type": "number",
              "trait_type": "Reroll Count",
              "value": "3"
            },
            {
              "display_type": "date",
              "trait_type": "Birthdate",
              "value": 1757173654
            }
          ]
        },
        "tokenId": "1252",
        "hp": 87,
        "stamina": 68,
        "image": "https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28_1252.png",
        "skills": [
          {
            "func": "voltOverload",
            "cost": 40,
            "cooldown": 8.823529411764707,
            "image": "electric-volt-overload"
          },
          {
            "func": "chargeUp",
            "cost": 30,
            "cooldown": 8.823529411764707,
            "image": "electric-charge-up"
          },
          {
            "func": "stormBreaker",
            "cost": 10,
            "cooldown": 8.823529411764707,
            "image": "electric-storm-breaker"
          }
        ],
        "purity":"5/6",
        "position": "back"
      }
    ];
  }

  preload() {
    this.load.image("energy-icon", "{{config.cdnLink}}/game-assets/common/images/energy.png");
    fetchEnergy(this);
    this.preload2();
  }

  preload2() {
    for (let i = 0; i < this.selectedBaxies.length; i++) {
      const baxie = this.selectedBaxies[i];
      const key = `baxie-${baxie.tokenId}`;
      this.load.image(key, baxie.image);
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

    let currentY = 30; // padding from the top


    // === Input Field ===
    const inputWidth = panelWidth - 40;
    const inputHeight = 50;

    container.add(this.createInputBg(panelWidth, currentY, inputWidth, inputHeight));

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

    currentY += inputHeight + 20;

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
        const response = await createGameRoom({
          scene: this,
          gameId: this.game.customConfig.gameId,
          gameMode: 'autoBattler',
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
          }
        };
      },
    });
    container.add(startBtn);

    return container;
  }

  createJoinRoomContainer(x, y) {
    const container = this.add.container(x, y);
    const panelWidth = 300;

    container.add(this.createPanelBg(panelWidth, panelHeight));

    let currentY = 30; // start with some padding from the top

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

    let currentY = 30; // Start padding top

    // === Title ===
    const title = this.add.text(panelWidth / 2, currentY, 'Practice Mode', {
      fontFamily: constants.fonts.Newsreader,
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    container.add(title);

    currentY += 50;


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
            }
          });
        });
      },
    })
    container.add(btnBg);

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
      x: 820, // center horizontally
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
    })
  }

  create() {
    this.backgroundDay = this.add
      .image(0, 0, 'bg')
      .setOrigin(0, 0)
      .setInteractive();
    this.world = this.add.container(0, 0);
    this.renderSelectedBaxies();

    const label = this.add.text(20, 20, `Room selection`, {
      fontSize: "30px",
      fontFamily: constants.fonts.troika,
      color: "#FFF",
      fontStyle: "bold"
    }).setOrigin(0, 0);
    label.setShadow(2, 2, '#000', 4, true, true);

    document.fonts.load('16px troika').then(() => {
      let center = this.cameras.main.width / 2;
      const panelWidth = 300;
      const halfPanelWidth = panelWidth / 2;
      const padding = 20;

      const startY = 370;
      this.createARoomContainer(center - halfPanelWidth - panelWidth - padding, startY);
      this.createJoinRoomContainer(center - halfPanelWidth, startY);
      this.createPracticeModeContainer(center + halfPanelWidth + padding, startY);
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