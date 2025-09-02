import { assets } from "../constants.mjs";
import {addBgMusic} from "../../common/settings.mjs";
import {fetchEnergy} from "../../common/energies.mjs";
import {createProgressBar} from "../../common/progres.mjs";

const baxies = {
  'gronke': 'baxie-gronke',
  'pink': 'baxie-pink',
  'green': 'baxie-green',
  'blue': 'baxie-blue',
  'purple': 'baxie-purple',
  'orange': 'baxie-orange',
  'yellow': 'baxie-yellow',
}

export default class PreloaderScene extends Phaser.Scene {
  constructor() {
    super({key: 'PreloaderScene'});
  }

  preload() {
    fetchEnergy(this);

    this.add.image(0, 0, "bg")
      .setOrigin(0, 0);

    createProgressBar({
      scene: this,
      width: 220,
      height: 14,
      launchScreen: 'MainMenuScene',
    });

    document.fonts.load('16px troika').then(() => {
      const logo = this.add.text(this.scale.width / 2, this.scale.height / 2 - 40, 'Flappy Baxie', {
        fontFamily: 'troika',
        fontSize: '42px',
        color: '#dda23e'
      }).setOrigin(0.5, 0);

      logo.setShadow(2, 2, '#000', 4, true, true);
    });

    this.load.image(assets.scene.ronenCoin, '{{config.cdnLink}}/game-assets/flappy-baxie/images/ronen.png')

    this.load.image(assets.scene.floor, '{{config.cdnLink}}/game-assets/flappy-baxie/images/floor-2.webp')
    // this.load.spritesheet(assets.scene.floor, '{{config.cdnLink}}/game-assets/flappy-baxie/images/floor.webp', {
    //   frameWidth: 370,
    //   frameHeight: 112
    // })

    // Pipes
    this.load.image(assets.obstacle.pipe.green.top, '{{config.cdnLink}}/game-assets/flappy-baxie/images/pipe-green-top-2.png')
    this.load.image(assets.obstacle.pipe.green.bottom, '{{config.cdnLink}}/game-assets/flappy-baxie/images/pipe-green-bottom-2.png')
    this.load.image(assets.obstacle.pipe.red.top, '{{config.cdnLink}}/game-assets/flappy-baxie/images/pipe-red-top-2.png')
    this.load.image(assets.obstacle.pipe.red.bottom, '{{config.cdnLink}}/game-assets/flappy-baxie/images/pipe-red-bottom-2.png')

    this.load.audio('bgm', '{{config.cdnLink}}/game-assets/flappy-baxie/audio/bg.mp3');

    this.load.image(assets.scene.background.day, '{{config.cdnLink}}/game-assets/flappy-baxie/images/day-2.webp')
    this.load.image(assets.scene.background.night, '{{config.cdnLink}}/game-assets/flappy-baxie/images/night-2.webp')

    // baxies
    Object.keys(baxies).forEach((key) => {
      this.load.image(baxies[key], `{{config.cdnLink}}/game-assets/flappy-baxie/images/${baxies[key]}.png`);
    });
  }

  create() {
    addBgMusic(this);
  }
}