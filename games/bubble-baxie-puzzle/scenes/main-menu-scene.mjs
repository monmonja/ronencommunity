import Phaser from 'phaser';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.image('reference', `{{config.cdnLink}}/game-assets/flappy-baxie/images/baxie-blue.png`);
    const baxies = {
      // 'gronke': 'baxie-gronke',
      // 'pink': 'baxie-pink',
      // 'green': 'baxie-green',
      // 'blue': 'baxie-blue',
      // 'purple': 'baxie-purple',
      'orange': 'body-orange',
      // 'yellow': 'baxie-yellow',
    };
    this.load.image('bg', '{{config.cdnLink}}/game-assets/baxie-builder/images/bg.webp');

    for (const key in baxies) {
      this.load.image(key, `{{config.cdnLink}}/game-assets/baxie-builder/images/${baxies[key]}.png`);
    }
    for (let i = 0; i < 25; i++) {
      this.load.image(`eye-${i + 1}`, `{{config.cdnLink}}/game-assets/baxie-builder/images/eyes/${i + 1}.png`);
    }
    for (let i = 0; i < 24; i++) {
      this.load.image(`mouth-${i + 1}`, `{{config.cdnLink}}/game-assets/baxie-builder/images/mouth/${i + 1}.png`);
    }
    for (let i = 0; i < 1; i++) {
      this.load.image(`forehead-${i + 1}`, `{{config.cdnLink}}/game-assets/baxie-builder/images/forehead/${i + 1}.png`);
    }
  }

  create() {
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }
}