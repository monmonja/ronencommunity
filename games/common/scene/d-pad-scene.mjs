import 'phaser';

export default class DPadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DPadScene' });
  }

  create() {
    console.log('Dpag')
    if (this.sys.game.device.os.desktop) {
      // Don't show D-pad on desktop devices
      this.scene.setVisible(false);
      return;
    }

    const { width, height } = this.cameras.main;

    const buttonSize = 50;
    const buttonPadding = 10;
    const dpadRadius = buttonSize + buttonPadding;

    const dpadX = dpadRadius + buttonPadding * 2;
    const dpadY = height - dpadRadius - buttonPadding * 2;

    this.createButton(dpadX, dpadY - dpadRadius, '▲', 'up', buttonSize);
    this.createButton(dpadX, dpadY + dpadRadius, '▼', 'down', buttonSize);
    this.createButton(dpadX - dpadRadius, dpadY, '◄', 'left', buttonSize);
    this.createButton(dpadX + dpadRadius, dpadY, '►', 'right', buttonSize);
  }

  createButton(x, y, text, direction, size) {
    const gameScene = this.scene.get('GameScene');

    const buttonCircle = this.add.circle(0, 0, size / 2, 0x888888, 0.5);
    const buttonText = this.add.text(0, 0, text, {
      fontSize: `${size * 0.6}px`,
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [buttonCircle, buttonText])
      .setSize(size, size)
      .setInteractive()
      .setScrollFactor(0);

    container.on('pointerdown', () => {
      buttonCircle.setFillStyle(0xbbbbbb, 0.7);
      gameScene.events.emit('dpad_down', direction);
    });

    container.on('pointerup', () => {
      buttonCircle.setFillStyle(0x888888, 0.5);
      gameScene.events.emit('dpad_up', direction);
    });

    container.on('pointerout', () => {
      // Check if the pointer was down before it went out
      if ((buttonCircle.fillColor & 0xffffff) === 0xbbbbbb) {
        buttonCircle.setFillStyle(0x888888, 0.5);
        gameScene.events.emit('dpad_up', direction);
      }
    });

    return container;
  }
}
