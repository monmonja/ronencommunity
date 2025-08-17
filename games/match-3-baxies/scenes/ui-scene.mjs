import Phaser from 'phaser';

// src/scenes/UIScene.js
export default class UiScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  createScore() {
    const button = this.add.container(243, 32);

    const buttonWidth = 100;
    const buttonHeight = 24;
    const bg = this.add.graphics();

    bg.fillStyle(0x603415, 1);
    bg.fillRoundedRect(0, 0, buttonWidth, buttonHeight, 6);

    bg.lineStyle(2, 0x1d0a07);
    bg.strokeRoundedRect(0, 0, buttonWidth, buttonHeight, 6);


    this.scoreText = this.add.text(buttonWidth / 2, 13, "0", {
      fontFamily: "troika",
      fontSize: 22,
      color: "#ffffff",
    }).setOrigin(0.5, 0.5);

    // Listen for score updates from GameScene
    this.gameScene.events.on("scoreChanged", (newScore) => {
      this.scoreText.setText(newScore);
    });

    button.add([bg, this.scoreText]);
  }

  createTopMenu() {
    const buttonWidth = 350;
    const buttonHeight = 50;

    const button = this.add.container(10, 20);

    const bg = this.add.graphics();

    // Optional: fake inset shadow - smaller, inside shape
    bg.fillStyle(0xab7750, 1);
    bg.fillRoundedRect(0, 0, buttonWidth, buttonHeight / 2, 6);
    bg.fillStyle(0x59311a, 1);
    bg.fillRoundedRect(0, 6, buttonWidth, buttonHeight - 6, 6);

    // Draw base background
    bg.fillStyle(0x8b4c20, 1);
    bg.fillRoundedRect(2, 4, buttonWidth - 4, buttonHeight - 8, 6);

    // Draw border
    bg.lineStyle(3, 0x1d0a07);
    bg.strokeRoundedRect(0, 0, buttonWidth, buttonHeight, 6);

    const label = this.add.text(10, buttonHeight / 2, 'Match 3 Baxies', {
      fontSize: '30px',
      fontFamily: 'troika',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    button.add([bg, label]);

    button.setSize(buttonWidth, buttonHeight);

    return button;
  }


  create() {
    // Reference to the GameScene
    this.gameScene = this.scene.get("GameScene");

    document.fonts.load('16px troika').then(() => {
      this.createTopMenu();
      this.createScore();
    });
  }
}
