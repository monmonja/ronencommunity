export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CommonBootScene', active: true });
  }
  preload() {
    this.load.image('bg', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/${this.game.customConfig.bgImage ?? 'bg.webp'}`)
  }

  create() {
     this.scene.start('PreloaderScene');
  }
}