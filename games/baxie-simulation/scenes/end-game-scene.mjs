import * as Phaser from 'phaser';
import BaxieUi from "../../common/baxie/baxie-ui.mjs";
import {createButton} from "../../common/buttons.mjs";
import {GameModes} from "../../common/baxie/baxie-simulation.mjs";
import constants from "../../common/constants.mjs";
import {interactiveBoundsChecker} from "../../common/rotate-utils.mjs";

export default class EndGameScene extends Phaser.Scene {
  constructor() {
    super('EndGameScene');
  }

  init(data) {
    this.youWin = data.youWin ?? false;
    this.selectedBaxies = data.selectedBaxies ?? {};
  }

  preload() {
  }

  create() {
    this.game.events.emit('hide-overlay');


    this.backgroundDay = this.add
      .image(0, 0, 'bg')
      .setOrigin(0, 0)
      .setInteractive();

    const bg = this.add.rectangle(
      0,
      0,
      this.game.scale.width,
      this.game.scale.height,
      0x000000,
      0.6
    ).setOrigin(0);

    let startY = 80;
    const gameOver = this.add.text(this.scale.width / 2, startY, 'Game Over', {
      fontFamily: constants.fonts.troika,
      fontSize: '60px',
      color: '#dda23e'
    }).setOrigin(0.5, 0);

    gameOver.setShadow(2, 2, '#000', 4, true, true);

    startY += 100;

    const youWin = this.add.text(this.scale.width / 2, startY, this.youWin ? 'Congratulations, you win!': 'You lose, try again?', {
      fontFamily: constants.fonts.Newsreader,
      fontSize: '42px',
      color: '#FFF'
    }).setOrigin(0.5, 0);

    youWin.setShadow(2, 2, '#000', 4, true, true);
    startY += 100;

    createButton({
      scene: this,
      x: (this.scale.width / 2) - 220 - 20,
      y: startY,
      width: 220,
      height: 60,
      text: 'Baxie Selection',
      onPointerDown: async () => {
        this.scene.stop('LoggerScene');
        this.scene.start('SelectionScene');
      },
    });
    createButton({
      scene: this,
      x: (this.scale.width / 2) + 20,
      y: startY,
      width: 220,
      height: 60,
      text: 'Rooms',
      onPointerDown: async () => {
        this.scene.stop('LoggerScene');
        this.scene.start('RoomSelectionScene', {
          selectedBaxies: this.selectedBaxies,
        });
      },
    });
  }
}
