import Phaser from 'phaser';
import {assets} from "../../flappy-baxie/constants.mjs";
import {createButton} from "../utils/buttons.mjs";

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
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
    this.load.image('bg', '{{config.cdnLink}}/game-assets/match-3-baxies/images/main-bg.webp');

    for (const key in baxies) {
      this.load.image(key, `{{config.cdnLink}}/game-assets/flappy-baxie/images/${baxies[key]}.png`);
    }

    this.load.audio('bgm', '/game-assets/match-3-baxies/audio/bg.mp3');
  }

  startBgAudio() {
    if (!this.bgm) {
      this.bgm = this.sound.add('bgm', {loop: true, volume: 1});
    }

    this.input.once('pointerdown', () => {
      if (!this.bgm.isPlaying) {
        if (!this.sound.unlock) {
          this.sound.unlock();
        }

        const isPlaying = localStorage.getItem("match-3-baxies-music-muted");
        if (isPlaying !== 'false') {
          this.bgm.play();
        }
      }
    });

    this.events.on('bgAudioChange', (isOn) => {
      if (isOn) {
        this.bgm.stop();
      } else {
        this.bgm.play();
      }
    });
  }

  create() {
    this.startBgAudio();

    this.backgroundDay = this.add
      .image(0, 0, 'bg')
      .setOrigin(0, 0)
      .setInteractive();

    document.fonts.load('16px troika').then(() => {
      const match = this.add.text(this.sys.game.config.width / 2, 100, 'Match', {
        fontSize: '90px',
        fontFamily: 'troika',
        color: '#2f8011',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);
      match.setStroke('#112704', 3);
      match.setShadow(2, 2, '#222', 4, false, true);

      const threeBaxies = this.add.text(this.sys.game.config.width / 2, 160, '3 BAXIES', {
        fontSize: '50px',
        fontFamily: 'troika',
        color: '#2f8011',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);

      threeBaxies.setStroke('#112704', 3);

      createButton({
        scene: this,
        x: this.sys.game.config.width / 2 - (160 / 2),
        y: 230,
        width: 160,
        height: 50,
        text: "Campaign",
        onPointerDown: () => {
          this.scene.start('ScoreGameScene');
          this.scene.start('UIScene');
        }
      })

      createButton({
        scene: this,
        x: this.sys.game.config.width / 2 - (160 / 2),
        y: 290,
        width: 160,
        height: 50,
        text: "Score based",
        onPointerDown: () => {
          this.scene.start('ScoreGameScene');
          this.scene.launch('UIScene');
        }
      })
      createButton({
        scene: this,
        x: this.sys.game.config.width / 2 - (160 / 2),
        y: 350,
        width: 160,
        height: 50,
        text: "Options",
        onPointerDown: () => {
          this.scene.launch('OptionsScene');
          // this.scene.launch('UIScene');
        }
      })
    });
  }
}