import Phaser from 'phaser';

// src/scenes/UIScene.js
export default class UiScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
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

    const label = this.add.text(buttonWidth / 2, buttonHeight / 2, 'Baxie Builder', {
      fontSize: '30px',
      fontFamily: 'troika',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);

    button.add([bg, label]);

    button.setSize(buttonWidth, buttonHeight);

    return button;
  }


  create() {
    // Reference to the GameScene
    this.gameScene = this.scene.get("GameScene");

    document.fonts.load('16px troika').then(() => {
      this.createTopMenu();
    });
  }
}
