import { ICON_SET } from "../constants.mjs";
import {addBgMusic} from "../../common/settings.mjs";
import {fetchEnergy} from "../../common/energies.mjs";
import {createProgressBar} from "../../common/progres.mjs";
import {fetchGameProfile} from "../../common/game-profiles.mjs";

export default class PreloaderScene extends Phaser.Scene {
  constructor() {
    super({key: 'PreloaderScene'});
  }

  preload() {
    fetchEnergy(this);
    fetchGameProfile(this);

    this.add.image(0, 0, "bg")
      .setOrigin(0, 0);

    createProgressBar({
      scene: this,
      width: 220,
      height: 14,
      launchScreen: 'MainMenuScene',
    });

    document.fonts.load('16px troika').then(() => {
      const gameName = 'Baxie a Baxie';
      const logo = this.add.text(this.scale.width / 2, this.scale.height / 2 - 40, gameName, {
        fontFamily: 'troika',
        fontSize: '42px',
        color: '#dda23e'
      }).setOrigin(0.5, 0);

      logo.setShadow(2, 2, '#000', 4, true, true);
    });

    this.load.image('level-bg', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/level-bg.webp`)
    this.load.image('restart', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/restart.png`)
    this.load.image('undo', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/undo.png`)
    this.load.image('shuffle', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/shuffle.png`)
    this.load.audio('bgm', '{{config.cdnLink}}/game-assets/match-3-baxies/audio/bg.mp3');

    // Load tile icons
    const uniqueIcons = [...new Set(ICON_SET)];
    uniqueIcons.forEach(iconUrl => {
      this.load.image(iconUrl, iconUrl);
    });
  }

  create() {
    addBgMusic(this);
  }
}