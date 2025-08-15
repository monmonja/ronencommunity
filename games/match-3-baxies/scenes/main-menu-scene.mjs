import Phaser from 'phaser';
import {assets} from "../../flappy-baxie/constants.mjs";

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const baxies = {
      'gronke': 'baxie-gronke',
      'pink': 'baxie-pink',
      'green': 'baxie-green',
      'blue': 'baxie-blue',
      'purple': 'baxie-purple',
      'orange': 'baxie-orange',
      'yellow': 'baxie-yellow',
    };
    this.load.image(assets.scene.background.day, '/game-assets/flappy-baxie/images/day.png');
    this.load.image('gronke', '/game-assets/flappy-baxie/images/baxie-gronke.png'); // path must be correct

    for (const key in baxies) {
      this.load.image(key, `/game-assets/flappy-baxie/images/${baxies[key]}.png`);
    }
  }

  create() {
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }
}