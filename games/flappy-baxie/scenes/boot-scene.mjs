import { assets } from "../constants.mjs";


export default class BootScene extends Phaser.Scene {
  constructor() {
    super({key: 'BootScene'});
  }
  preload() {
    this.load.image('bg', '{{config.cdnLink}}/game-assets/flappy-baxie/images/bg2.webp')
  }

  create() {
    this.scene.start('PreloaderScene');
  }
}