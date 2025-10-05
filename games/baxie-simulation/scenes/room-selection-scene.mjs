import Phaser from 'phaser';
import {createButton, createCircleButton} from "../../common/buttons.mjs";
import {createCpuGameRoom, createGameRoom, joinGameRoom} from "../../common/scene/rooms-scene.mjs";
import constants from "../../common/constants.mjs";

export default class RoomSelectionScene extends Phaser.Scene {
  constructor() {
    super('RoomSelectionScene');
  }

  init(data) {
    this.selectedBaxies = data.selectedBaxies || new URLSearchParams(location.search).get("baxies").split(',').map(tokenId => ({ tokenId }));
    console.log('this.selectedBaxies', this.selectedBaxies)
  }

  createARoomContainer(x, y) {
    const container = this.add.container(x, y);
    const panelWidth = 350;
    const panelHeight = 420;

    // === Background Panel ===
    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x191933, 0.9)
      .setStrokeStyle(2, 0x323267)
      .setOrigin(0); // top-left
    container.add(bg);

    let currentY = 20; // padding from the top

    // === Title ===
    const title = this.add.text(panelWidth / 2, currentY, 'Create a Room', {
      fontFamily: constants.fonts.Newsreader,
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0); // center horizontally, top aligned
    container.add(title);

    currentY += 45;

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

    currentY += 25;

    // === Input Field ===
    const inputWidth = panelWidth - 40;
    const inputHeight = 50;

    const inputBg = this.add.rectangle(panelWidth / 2, currentY, inputWidth, inputHeight, 0x101022)
      .setStrokeStyle(2, 0x323267)
      .setOrigin(0.5, 0);
    container.add(inputBg);

    const roomId = ''; // initially empty
    const inputText = this.add.text(
      panelWidth / 2 - inputWidth / 2 + 15,
      currentY + inputHeight / 2,
      roomId || 'Click Start Game',
      {
        fontFamily: 'Courier New',
        fontSize: '18px',
        color: roomId ? '#ffffff' : '#9292c9',
      }
    ).setOrigin(0, 0.5);
    container.add(inputText);

    // === Copy Button ===
    const copyButton = this.add.rectangle(
      panelWidth / 2 + inputWidth / 2 - 30,
      currentY + inputHeight / 2,
      40,
      40,
      0x323267
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
    copyButton.on('pointerout', () => copyButton.setFillStyle(0x323267));

    currentY += inputHeight + 40;

    // === Start Game Button ===
    const startBtn = createButton({
      scene: this,
      x: (panelWidth - (panelWidth - 40)) / 2, // center horizontally
      y: currentY,
      width: panelWidth - 40,
      height: 60,
      text: 'Start Game',
      onPointerDown: async () => {
        const response = await createGameRoom({
          scene: this,
          gameId: this.game.customConfig.gameId,
        });

        inputText.text = response.roomId;
        inputText.setColor('#ffffff');
        startBtn.getByName('label').text = 'Waiting for opponent...';

        this.ws = new WebSocket(response.wsUrl);

        this.ws.onopen = () => {
          this.ws.send(
            JSON.stringify({
              type: 'joinRoom',
              gameId: this.game.customConfig.gameId,
              roomId: response.roomId,
              selectedBaxies: this.selectedBaxies.map((b) => b.tokenId),
            })
          );
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
    const panelHeight = 245;

    // === Background Panel ===
    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x191933, 0.9)
      .setStrokeStyle(2, 0x323267)
      .setOrigin(0); // top-left corner
    container.add(bg);

    let currentY = 20; // start with some padding from the top

    // === Title ===
    const title = this.add.text(panelWidth / 2, currentY, 'Join a Room', {
      fontFamily: constants.fonts.Newsreader,
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0); // center horizontally, top align vertically
    container.add(title);

    currentY += 40; // spacing below title

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
    const inputBg = this.add.rectangle(panelWidth / 2, currentY, inputWidth, inputHeight, 0x101022)
      .setStrokeStyle(2, 0x323267)
      .setOrigin(0.5, 0);
    container.add(inputBg);

    const inputPlaceholder = 'Enter Room ID';
    const inputText = this.add.text(panelWidth / 2 - inputWidth / 2 + 15, currentY + inputHeight / 2, inputPlaceholder, {
      fontFamily: constants.fonts.troika,
      fontSize: '18px',
      color: '#9292c9',
    }).setOrigin(0, 0.5);
    container.add(inputText);

    inputBg.setInteractive({ useHandCursor: true });
    inputBg.on('pointerdown', () => {
      const current = prompt('Enter Room ID:');
      if (current) {
        inputText.setText(current);
        inputText.setColor('#ffffff');
      }
    });

    currentY += inputHeight + 20;

    // === Join Button ===
    const joinBtn = createButton({
      scene: this,
      x: (panelWidth - (panelWidth - 60)) / 2, // center horizontally
      y: currentY,
      width: panelWidth - 60,
      height: 50,
      text: 'Join Room',
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
    const panelHeight = 155;

    // === Background (rounded panel style) ===
    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x191933)
      .setStrokeStyle(2, 0x232348)
      .setOrigin(0)
      .setAlpha(0.95);
    container.add(bg);

    let currentY = 20; // Start padding top

    // === Title ===
    const title = this.add.text(panelWidth / 2, currentY, 'Practice Mode', {
      fontFamily: constants.fonts.Newsreader,
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    container.add(title);
    currentY += 30;

    // === Description ===
    const desc = this.add.text(panelWidth / 2, currentY, 'Hone your skills against our AI.', {
      fontFamily: constants.fonts.Newsreader,
      fontSize: '16px',
      color: '#ccccff',
    }).setOrigin(0.5, 0);
    container.add(desc);
    currentY += 30;

    // === Button ===
    const btnBg = createButton({
      scene: this,
      x: (panelWidth - (panelWidth - 60)) / 2, // center horizontally
      y: currentY,
      width: panelWidth - 60,
      height: 50,
      text: 'VS CPU',
      onPointerDown: async () => {
        createCpuGameRoom({
          scene: this,
          gameId: this.game.customConfig.gameId,
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
              });
            }
          };
        });
      },
    })
    container.add(btnBg);

    return container;
  }



  create() {
    this.world = this.add.container(0, 0);

    this.backgroundDay = this.add
      .image(0, 0, 'level-bg')
      .setOrigin(0, 0)
      .setInteractive();
    this.world.add(this.backgroundDay);

    document.fonts.load('16px troika').then(() => {
      this.createARoomContainer(155, 100);
      this.createJoinRoomContainer(525, 100);
      this.createPracticeModeContainer(525, 365);
    });
  }
}