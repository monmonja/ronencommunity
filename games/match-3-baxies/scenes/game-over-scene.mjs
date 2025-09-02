import Phaser from 'phaser';
import {assets} from "../../flappy-baxie/constants.mjs";
import {createOverlay} from "../../common/overlay.mjs";
import constants from "../../common/constants.mjs";
import {createButton, createCloseButton} from "../../common/buttons.mjs";

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  init(data) {
    this.score = data.score || 0;
  }

  create() {
    this.cameras.main.setScroll(0, -this.scale.height);

    // Slide down tween
    this.tweens.add({
      targets: this.cameras.main,
      scrollY: 0,
      duration: 500,
      ease: "Cubic.easeOut"
    });


    const overlayWidth = 403;
    this.panel = createOverlay({
      scene: this,
      x: ((this.scale.width - constants.mainMenu.panelWidth) / 2 + constants.mainMenu.panelWidth) - (overlayWidth / 2),
      y: (this.scale.height / 2) - (420 / 2),
      width: overlayWidth,
      height: 420,
    });
    this.panel.setDepth(100);

    const closeBtn = createCloseButton({
      scene: this,
      x: overlayWidth - 10 - 32,
      y: 10,
    });
    const items = [closeBtn];

    const gameOver = this.add.text(overlayWidth / 2, 150, "Game Over", {
      fontFamily: "troika",
      fontSize: 48,
      color: "#ffffff",
    }).setOrigin(0.5);
    gameOver.setShadow(2, 2, '#000', 4, true, true);
    this.panel.add(gameOver);

    const score = this.add.text(overlayWidth / 2, 200, `Score: ${this.score}`, {
      fontFamily: "troika",
      fontSize: 32,
      color: "#ffffff",
    }).setOrigin(0.5);
    score.setShadow(2, 2, '#000', 4, true, true);
    this.panel.add(score);
    this.panel.add(items);

    const restartBtn = createButton({
      scene: this,
      x: (overlayWidth / 2) - (150 / 2),
      y: 260,
      width: 150,
      height: 50,
      text: 'Restart',
      onPointerDown: () => {
        this.game.events.emit("scoreChanged", 0);
        this.scene.start("ScoreGameScene");
      }
    });
    this.panel.add(restartBtn);
  }
}
