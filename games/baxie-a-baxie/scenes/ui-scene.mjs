import 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  SLOT_CAPACITY,
  INITIAL_SHUFFLES,
  INITIAL_UNDOS,
  INITIAL_RESTARTS,
  TILE_WIDTH, TILE_HEIGHT
} from '../constants.mjs';
import {useEnergy} from "../../common/energies.mjs";
import {createButton, createCircleButton} from "../../common/buttons.mjs";
import constants from "../../common/constants.mjs";
import {interactiveBoundsChecker} from "../../common/rotate-utils.mjs";
export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene', active: false });
    this.shufflesLeft = INITIAL_SHUFFLES;
    this.undosLeft = INITIAL_UNDOS;
    this.restartsLeft = INITIAL_RESTARTS;
    console.log(11)
    this.offsetY = 64 + 20;
  }
  create() {
    this.createCollectionSlot();
    this.createControls();
    this.createGameOverModal();
    this.createScoreBoard({
      scene: this,
      x: 15,
      y: 15,
      eventType: "update-tile-count",
      label: "tiles"
    });
    this.createScoreBoard({
      scene: this,
      x: 15,
      y: 120,
      eventType: "update-current-level",
      label: "level"
    });

    const gameScene = this.scene.get('GameScene');

    gameScene.events.on('tile-collected', (tiles) => this.updateCollectionSlot(tiles));
    gameScene.events.on('match-found', this.handleMatch, this);
    gameScene.events.on('undo-performed', (tiles) => this.updateCollectionSlot(tiles));
    gameScene.events.on('game-restarted', (data) => {
      this.shufflesLeft = INITIAL_SHUFFLES;
      this.undosLeft = INITIAL_UNDOS;
      // this.restartsLeft = INITIAL_RESTARTS;

      this.updateButtonStates();
      this.updateCollectionSlot(data.collectedTiles);
      this.gameOverModal.setVisible(false);
    });
    gameScene.events.on('game-over', (status, isFinalLevel) => this.showGameOverModal(status, isFinalLevel));
  }

  createScoreBoard({ scene, x, y, eventType, label, text } = {}) {
    // this.game.events.emit('addMainPanelItem', ({ scene }) => {
      const container = this.add.container(x, y);
      const width = constants.scoreBoard.width;
      const height = 80;
      const bg = scene.add.graphics();

      container.setSize(width, height);
      bg.fillStyle(0xffffff, 0.8);
      bg.fillRoundedRect(0, 0, width, height, 6);

      // Top strip with rounded top corners, flat bottom
      const topStrip = this.add.graphics();
      topStrip.fillStyle(0x000000, 0.3); // border color
      topStrip.fillRoundedRect(0, 0, width, 25, { tl: 4, tr: 4, br: 0, bl: 0 });

      const labelTxt = this.add.text(width / 2,  14, label, {
        fontSize: '18px',
        fontFamily: 'troika',
        color: '#1f4213'
      }).setOrigin(0.5, 0.5);

      const valueText = scene.add.text(width / 2, (height / 2) + 15, '0', {
        fontFamily: 'troika',
        fontSize: '26px',
        color: '#1f4213'
      }).setOrigin(0.5, 0.5);
      valueText.setShadow(2, 2, '#fff', 4, false, true);
      valueText.setDepth(30);

      if (text) {
        valueText.setText(text);
      }

      const gameScene = this.scene.get('GameScene');
      gameScene.events.on(eventType, (newScore) => {
        valueText.setText(newScore);
      });

      container.add([bg, topStrip, labelTxt, valueText]);
      return container;
    // })
  }


  getSlotPosition(index) {
    const startY = -(this.offsetY * (SLOT_CAPACITY - 1)) / 2;
    const slotY = startY + index * 74;
    const worldMatrix = this.collectionSlotContainer.getWorldTransformMatrix();
    return new Phaser.Math.Vector2(worldMatrix.tx, worldMatrix.ty + slotY);
  }
  createCollectionSlot() {
    const slotHeight = this.offsetY * SLOT_CAPACITY + 20;
    const background = this.add.graphics();
    background.fillStyle(0xffffff, 0.8);
    background.fillRoundedRect(-45, -slotHeight / 2, 90, slotHeight - 65, 16);
    this.collectionSlotContainer = this.add.container(GAME_WIDTH - 80, GAME_HEIGHT / 2 + 30, [background]);
    const startY = -(this.offsetY * (SLOT_CAPACITY - 1)) / 2;
    for (let i = 0; i < SLOT_CAPACITY; i++) {
      const slotY = startY + i * 74;
      const slotBg = this.add.graphics();
      slotBg.fillStyle(0x000000, 0.2);
      slotBg.lineStyle(2, 0xffffff, 0.2);
      slotBg.fillRoundedRect(-34, slotY - 34, 66, 66, 8);
      slotBg.strokeRoundedRect(-34, slotY - 34, 66, 66, 8);
      this.collectionSlotContainer.add(slotBg);
    }
  }
  updateCollectionSlot(tiles) {
    this.collectionSlotContainer.list.filter(item => item instanceof Phaser.GameObjects.Image).forEach(item => item.destroy());
    const startY = -(this.offsetY * (SLOT_CAPACITY - 1)) / 2;
    tiles.forEach((tile, index) => {
      const icon = this.add.image(0, startY + index * 74, tile.icon).setOrigin(0.5);
      icon.setDisplaySize(50, 50);
      this.collectionSlotContainer.add(icon);
    });
  }
  handleMatch(data) {
    const { updatedTiles, matchedIcon } = data;
    const iconsToAnimate = this.collectionSlotContainer.list.filter(item => item instanceof Phaser.GameObjects.Image && item.texture.key === matchedIcon);
    if (iconsToAnimate.length > 0) {
      this.tweens.add({
        targets: iconsToAnimate,
        scale: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          iconsToAnimate.forEach(icon => icon.destroy());
          this.updateCollectionSlot(updatedTiles);
        }
      });
    }
    else {
      this.updateCollectionSlot(updatedTiles);
    }
  }
  createControls() {
    const controlY = GAME_HEIGHT - 85;
    // shuffle button
    const shuffleX = GAME_WIDTH / 2 - 140;
    createButton({
      scene: this,
      x: shuffleX,
      y: controlY,
      width: 60,
      height: 60,
      image: this.add.image(30, 30, 'shuffle')
        .setScale(1.5)
        .setOrigin(0.5, 0.5),
      onPointerDown: () => {
        if (this.shufflesLeft > 0) {
          this.scene.get('GameScene').events.emit('shuffle-clicked');
          this.shufflesLeft--;
          this.updateButtonStates();
        }
      }
    })
    this.shuffleButton = createCircleButton({
      scene: this,
      x: shuffleX + 40,
      y: controlY - 15,
      radius: 18,
      height: 60,
      text: this.shufflesLeft
    });

    // undo button
    const undoX = GAME_WIDTH / 2 - 40;
    createButton({
      scene: this,
      x: undoX,
      y: controlY,
      width: 60,
      height: 60,
      image: this.add.image(30, 30, 'undo')
        .setScale(1.5)
        .setOrigin(0.5, 0.5),
      onPointerDown: () => {
        if (this.undosLeft > 0) {
          this.scene.get('GameScene').events.emit('undo-clicked');
          this.undosLeft--;
          this.updateButtonStates();
        }
      }
    })
    this.undoButton = createCircleButton({
      scene: this,
      x: undoX + 40,
      y: controlY - 15,
      radius: 18,
      height: 60,
      text: this.restartsLeft
    });

    // restart button
    const restartX = GAME_WIDTH / 2 + 60;
    createButton({
      scene: this,
      x: restartX,
      y: controlY,
      width: 60,
      height: 60,
      image: this.add.image(30, 30, 'restart')
        .setScale(1.5)
        .setOrigin(0.5, 0.5),
      onPointerDown: () => {
        if (this.restartsLeft > 0) {
          this.scene.get('GameScene').events.emit('new-game-clicked');
          this.restartsLeft--;
          this.updateButtonStates();
        }
      }
    })
    this.restartButton = createCircleButton({
      scene: this,
      x: restartX + 40,
      y: controlY - 15,
      radius: 18,
      height: 60,
      text: this.restartsLeft
    });

    this.updateButtonStates();
  }
  updateButtonStates() {
    this.shuffleButton.getAt(1).setText(`${this.shufflesLeft}`);
    this.shuffleButton.setAlpha(this.shufflesLeft > 0 ? 1 : 0.5).setInteractive(this.shufflesLeft > 0);
    this.undoButton.getAt(1).setText(`${this.undosLeft}`);
    this.undoButton.setAlpha(this.undosLeft > 0 ? 1 : 0.5).setInteractive(this.undosLeft > 0);
    this.restartButton.getAt(1).setText(`${this.restartsLeft}`);
    this.restartButton.setAlpha(this.restartsLeft > 0 ? 1 : 0.5).setInteractive(this.restartsLeft > 0);
  }
  createButton(x, y, text, callback, color = 0x1E90FF) {
    const buttonBG = this.add.graphics();
    buttonBG.fillStyle(color, 1);
    buttonBG.fillRoundedRect(-90, -28, 180, 56, 16);
    const buttonText = this.add.text(0, 0, text, { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const buttonContainer = this.add.container(x, y, [buttonBG, buttonText]);
    buttonContainer.setSize(180, 56)
      .setInteractive(
        new Phaser.Geom.Rectangle(0, 0, 180, 56),
        interactiveBoundsChecker,
      );
    buttonContainer.setData("offsetX", 180 / 2);
    buttonContainer.setData("offsetY", 56 / 2);
    buttonContainer.on('pointerdown', callback);
    return buttonContainer;
  }
  createGameOverModal() {
    const background = this.add.graphics();
    background.fillStyle(0x000000, 0.7);
    background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    const panel = this.add.graphics();
    panel.fillStyle(0xffffff, 1);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 220, GAME_HEIGHT / 2 - 135, 440, 270, 16);
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, '', { fontSize: '40px', color: '#333333', fontStyle: 'bold' }).setOrigin(0.5);
    const message = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', { fontSize: '20px', color: '#555555', align: 'center', wordWrap: { width: 380 } }).setOrigin(0.5);
    const actionButton = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 75, 'Play Again', () => { });
    actionButton.setVisible(false);
    this.gameOverModal = this.add.container(0, 0, [background, panel, title, message, actionButton]).setDepth(100).setVisible(false);
  }
  showGameOverModal(status, isFinalLevel) {
    const title = this.gameOverModal.getAt(2);
    const message = this.gameOverModal.getAt(3);
    const button = this.gameOverModal.getAt(4);
    const buttonText = button.getAt(1);
    const buttonBg = button.getAt(0);
    button.off('pointerdown'); // Remove previous listeners
    if (status === 'won') {
      if (isFinalLevel) {
        title.setText('You Win!').setColor('#FFD700');
        message.setText('Congratulations! You have completed all the levels!');
        buttonText.setText('Play Again?');
        buttonBg.fillStyle(0x228B22, 1).fillRoundedRect(-90, -28, 180, 56, 16);
        button.on('pointerdown', () => this.scene.get('GameScene').events.emit('restart-game-clicked'));
      } else {
        title.setText('Level Complete!').setColor('#228B22');
        message.setText('Great job! Ready for the next challenge?');
        buttonText.setText('Next Level');
        buttonBg.fillStyle(0x1E90FF, 1).fillRoundedRect(-90, -28, 180, 56, 16);
        button.on('pointerdown', () => this.scene.get('GameScene').events.emit('next-level-clicked'));
      }
    }
    else {
      title.setText('Game Over').setColor('#DC143C');
      message.setText('The collection slot is full. Don\'t give up!');
      buttonText.setText('Try Again');
      buttonBg.fillStyle(0xDC143C, 1).fillRoundedRect(-90, -28, 180, 56, 16);
      button.on('pointerdown', () => {
        useEnergy({
          scene: this,
          gameId: this.game.customConfig.gameId,
        }).then((result) => {
          if (result.available > 0) {
            this.scene.get('GameScene').events.emit('new-game-clicked');
          } else {
            this.scene.launch('EnergiesScene');
          }
        });
      });
    }
    button.setVisible(true);
    this.gameOverModal.setVisible(true);
  }
}
