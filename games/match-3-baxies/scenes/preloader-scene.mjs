import {addBgMusic} from "../../common/settings.mjs";
import {fetchEnergy} from "../../common/energies.mjs";
import {createProgressBar} from "../../common/progres.mjs";
import {createButton} from "../../common/buttons.mjs";


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
      const match = this.add.text(this.sys.game.config.width / 2, 110, 'Match', {
        fontSize: '90px',
        fontFamily: 'troika',
        color: '#ddc33e',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);
      match.setStroke('#112704', 3);
      match.setShadow(2, 2, '#222', 4, false, true);

      const threeBaxies = this.add.text(this.sys.game.config.width / 2, 170, '3 BAXIES', {
        fontSize: '50px',
        fontFamily: 'troika',
        color: '#ddc33e',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);

      threeBaxies.setStroke('#112704', 3);
    });


    const baxies = {
      'gronke': 'baxie-gronke',
      'pink': 'baxie-pink',
      'green': 'baxie-green',
      'blue': 'baxie-blue',
      'purple': 'baxie-purple',
      'orange': 'baxie-orange',
      'yellow': 'baxie-yellow',
    };


    for (const key in baxies) {
      this.load.image(key, `{{config.cdnLink}}/game-assets/flappy-baxie/images/${baxies[key]}.png`);
    }

    this.load.audio('bgm', '{{config.cdnLink}}/game-assets/match-3-baxies/audio/bg.mp3');
  }

  create() {
    addBgMusic(this);
  }
}