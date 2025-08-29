export default class BootScene extends Phaser.Scene {
  constructor() {
    super({key: 'BootScene'});
  }
  preload() {
    this.load.image('bg', '{{config.cdnLink}}/game-assets/match-3-baxies/images/bg-2.webp');
  }

  create() {
    this.scene.start('PreloaderScene');
  }
}