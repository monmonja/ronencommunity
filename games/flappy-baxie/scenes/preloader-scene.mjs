import { assets } from "../constants.mjs";
import {createButton} from "../utils/buttons.mjs";
import {addBgMusic} from "../../common/utils/settings.mjs";

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

  progressBar(width, height) {
    // Create graphics for the bar
    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();

    progressBox.fillStyle(0x2f8011, 1);
    progressBox.fillRoundedRect((this.scale.width / 2) - (width / 2), this.scale.height / 2 + 10, width, height, 6);

    // Listen for load progress
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x8aff5c, 1);
      console.log(value)
      progressBar.fillRect((this.scale.width / 2) - (width / 2) + 5, (this.scale.height / 2) + 15,  (width - 10) * value, height - 10);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      createButton({
        scene: this,
        x: (this.scale.width / 2) - (100 / 2),
        y: this.scale.height / 2 + 10,
        width: 100,
        height: 30,
        text: "Start",
        onPointerDown: () => {
          const isFullscreen = localStorage.getItem("fullscreen-mode");

          if (isFullscreen === "true") {
            this.scale.startFullscreen();
            document.body.classList.add('fullscreen');

            this.scale.once('enterfullscreen', () => {
              this.scene.launch('MainMenuScene');
            });
          } else {
            this.scene.launch('MainMenuScene');
          }
        }
      })
    });
  }
  preload() {
    this.load.image('bg', '{{config.cdnLink}}/game-assets/flappy-baxie/images/bg.webp')
    this.load.image('settings', '{{config.cdnLink}}/game-assets/common/settings.png')

    this.add.image(0, 0, "bg")
      .setOrigin(0, 0);
    this.progressBar(200, 16);

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
    this.load.image(assets.obstacle.pipe.green.top, '{{config.cdnLink}}/game-assets/flappy-baxie/images/pipe-green-top.png')
    this.load.image(assets.obstacle.pipe.green.bottom, '{{config.cdnLink}}/game-assets/flappy-baxie/images/pipe-green-bottom.png')
    this.load.image(assets.obstacle.pipe.red.top, '{{config.cdnLink}}/game-assets/flappy-baxie/images/pipe-red-top.png')
    this.load.image(assets.obstacle.pipe.red.bottom, '{{config.cdnLink}}/game-assets/flappy-baxie/images/pipe-red-bottom.png')

    this.load.audio('bgm', '{{config.cdnLink}}/game-assets/flappy-baxie/audio/bg.mp3');

    this.load.image(assets.scene.background.day, '{{config.cdnLink}}/game-assets/flappy-baxie/images/day-2.webp')
    this.load.image(assets.scene.background.night, '{{config.cdnLink}}/game-assets/flappy-baxie/images/night.webp')

    // baxies
    Object.keys(baxies).forEach((key) => {
      this.load.spritesheet(baxies[key], `{{config.cdnLink}}/game-assets/flappy-baxie/images/${baxies[key]}.png`, {
        frameWidth: 61,
        frameHeight: 70,
      });
    });
  }

  create() {
    addBgMusic(this);
  }
}