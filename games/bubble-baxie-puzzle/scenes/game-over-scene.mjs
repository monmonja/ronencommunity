import Phaser from 'phaser';
import {assets} from "../../flappy-baxie/constants.mjs";
import {interactiveBoundsChecker} from "../../common/rotate-utils.mjs";

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  init(data) {
    this.score = data.score || 0;
  }

  createRestartButton() {
    const center = this.game.scale.width / 2;
    const buttonWidth = 150;
    const buttonHeight = 50;

    const button = this.add.container(center - (buttonWidth / 2), 280);

    const bg = this.add.graphics();

    // Optional: fake inset shadow - smaller, inside shape
    bg.fillStyle(0x718ff0, 1);
    bg.fillRoundedRect(0, 0, buttonWidth, buttonHeight / 2, 6);
    bg.fillStyle(0x2d4eb3, 1);
    bg.fillRoundedRect(0, 6, buttonWidth, buttonHeight - 6, 6);

    // Draw base background
    bg.fillStyle(0x406fff, 1);
    bg.fillRoundedRect(2, 4, buttonWidth - 4, buttonHeight - 8, 6);

    // Draw border
    bg.lineStyle(2, 0x000000);
    bg.strokeRoundedRect(0, 0, buttonWidth, buttonHeight, 6);

    const label = this.add.text(buttonWidth / 2, buttonHeight / 2, 'Restart', {
      fontSize: '24px',
      fontFamily: 'troika',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);

    button.add([bg, label]);

    button.setSize(buttonWidth, buttonHeight);
    button.setInteractive(
      new Phaser.Geom.Rectangle(buttonWidth / 2, buttonHeight / 2, buttonWidth, buttonHeight),
      interactiveBoundsChecker,
    );
    button.on('pointerdown', () => {
      this.events.emit("scoreChanged", 0);
      this.scene.start("GameScene");
    });

    return button;
  }


  create() {
    this.cameras.main.setBackgroundColor("#101018");
    this.backgroundDay = this.add.image(0, 0, assets.scene.background.day).setOrigin(0, 0).setInteractive()

    const gameOver = this.add.text(this.scale.width / 2, 150, "Game Over", {
      fontFamily: "troika",
      fontSize: 48,
      color: "#ffffff",
    }).setOrigin(0.5);
    gameOver.setShadow(2, 2, '#000', 4, true, true);

    const score = this.add.text(this.scale.width / 2, 200, `Score: ${this.score}`, {
      fontFamily: "troika",
      fontSize: 32,
      color: "#ffffff",
    }).setOrigin(0.5);
    score.setShadow(2, 2, '#000', 4, true, true);

    this.createRestartButton();
  }
}
