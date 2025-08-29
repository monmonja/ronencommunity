import {createButton} from "../../common/buttons.mjs";

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({key: 'GameOverScene'});
  }

  create() {
    const center = this.sys.game.config.width / 2;

    const gameOver = this.add.text(center, 186, 'Game Over', {
      fontFamily: 'troika',
      fontSize: '42px',
      color: '#f99502'
    }).setOrigin(0.5, 0.2);

    gameOver.setShadow(2, 2, '#000', 4, true, true);

    const restartButton = createButton({
      scene: this,
      x: center - (150 / 2),
      y: 240,
      width: 150,
      height: 50,
      text: "Restart",
      onPointerDown: () => {
        this.scene.stop('GameScene');    // stop game scene
        this.scene.stop();
        this.scene.start('MainMenuScene');
      }
    });

    restartButton.setDepth(20);

    const container = this.add.container(0, 0, [gameOver, restartButton]);

    container.setDepth(20);

  }
}