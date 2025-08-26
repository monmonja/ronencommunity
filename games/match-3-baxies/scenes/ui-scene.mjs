import Phaser from 'phaser';

// src/scenes/UIScene.js
export default class UiScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  createButtonUI({ x, y, width, height, label, eventType } = {}) {
    const button = this.add.container(x, y);
    const bg = this.add.graphics();

    // Optional: fake inset shadow - smaller, inside shape
    bg.fillStyle(0xFFFFFF, 1);
    bg.fillRoundedRect(0, 0, width, height / 2, 4);
    button.add(bg);

    // Top strip with rounded top corners, flat bottom
    const topStrip = this.add.graphics();
    topStrip.fillStyle(0xCCCCCC, 1); // border color
    topStrip.fillRoundedRect(0, 0, width, 25, { tl: 4, tr: 4, br: 0, bl: 0 });
    button.add(topStrip);

    const labelTxt = this.add.text(width / 2,  14, label, {
      fontSize: '20px',
      fontFamily: 'troika',
      color: '#1f4213'
    }).setOrigin(0.5, 0.5);
    button.add(labelTxt);

    const valueText = this.add.text(width / 2 , 52, "0", {
      fontFamily: "troika",
      fontSize: '30px',
      color: "#2f8011",
    }).setOrigin(0.5, 0.5);

    this.gameScene.events.on(eventType, (newScore) => {
      valueText.setText(newScore);
    });
    button.add(valueText);
  }

  createTopBg() {
    const topBg = this.add.container(0, 0);

    const bg = this.add.graphics();
    bg.fillStyle(0x2f8011, 1);
    bg.fillRoundedRect(0, 0, 117, this.sys.game.config.height, 0);
    topBg.add([bg]);
  }

  createLogo() {
    const topBg = this.add.container(53, 25);
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(-35, -16, 80, 80, 40);
    bg.lineStyle(2, 0x123008);
    bg.strokeRoundedRect(-35, -16, 80, 80, 40);

    const gronke1 = this.add.image(-10, 10, 'gronke').setOrigin(0.5, 0.5);
    gronke1.setScale(0.5)
    const gronke2 = this.add.image(20, 10, 'gronke').setOrigin(0.5, 0.5);
    gronke2.setScale(0.5)
    const gronke3 = this.add.image(5, 40, 'gronke').setOrigin(0.5, 0.5);
    gronke3.setScale(0.5)


    topBg.add([bg, gronke1, gronke2, gronke3]);
  }

  create() {
    // Reference to the GameScene
    this.gameScene = this.scene.get("ScoreGameScene");
    this.createTopBg();
    this.createLogo();

    document.fonts.load('16px troika').then(() => {
      this.createButtonUI({
        x: 8,
        y: 112,
        width: 100,
        height: 150,
        label: "Target",
        eventType: "targetChanged"
      });
      this.createButtonUI({
        x: 8,
        y: 200,
        width: 100,
        height: 150,
        label: "Score",
        eventType: "scoreChanged"
      });
    });
  }
}
