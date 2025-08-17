export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({key: 'GameOverScene'});
  }

  createRestartButton() {
    const center = this.sys.game.config.width / 2;
    const buttonWidth = 150;
    const buttonHeight = 50;

    const button = this.add.container(center - (buttonWidth / 2), 240);

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
      Phaser.Geom.Rectangle.Contains
    );
    button.on('pointerdown', () => {
      this.scene.stop('GameScene');    // stop game scene
      this.scene.stop();
      this.scene.start('MainMenuScene');
    });

    return button;
  }

  create() {
    const center = this.sys.game.config.width / 2;

    const gameOver = this.add.text(center, 186, 'Game Over', {
      fontFamily: 'troika',
      fontSize: '42px',
      color: '#f99502'
    }).setOrigin(0.5, 0.2);

    gameOver.setShadow(2, 2, '#000', 4, true, true);

    const restartButton = this.createRestartButton();

    restartButton.setDepth(20);

    const container = this.add.container(0, 0, [gameOver, restartButton]);

    container.setDepth(20);

  }
}