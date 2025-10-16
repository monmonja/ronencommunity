import {addBgMusic} from "../../common/settings.mjs";
import {fetchEnergy, useEnergy} from "../../common/energies.mjs";
import {createProgressBar} from "../../common/progres.mjs";

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
      // launchScreen: 'SyncMenuScene',
      // launchScreen: 'PositionSlotsScene',
      launchScreen: 'RoomSelectionScene',
    });

    document.fonts.load('16px troika').then(() => {
      const gameName = 'Baxie Simulation';
      const logo = this.add.text(this.scale.width / 2, this.scale.height / 2 - 40, gameName, {
        fontFamily: 'troika',
        fontSize: '42px',
        color: '#dda23e'
      }).setOrigin(0.5, 0);

      logo.setShadow(2, 2, '#000', 4, true, true);
    });

    this.load.image('level-bg', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/level-bg.webp`)
    this.load.image('battle-bg', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/bg/stadium-bg.webp`)
    this.load.image('shadow', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/shadow.webp`)
    this.load.image('restart', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/restart.png`)
    this.load.image('undo', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/undo.png`)
    this.load.image('shuffle', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/shuffle.png`)
    this.load.audio('bgm', '{{config.cdnLink}}/game-assets/match-3-baxies/audio/bg.mp3');

    this.load.image('electric-charge-up', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/electric-charge-up.png`);
    this.load.image('electric-storm-breaker', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/electric-storm-breaker.png`);
    this.load.image('electric-volt-overload', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/electric-volt-overload.png`);

    this.load.image('fairy-arcane-blessing', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/fairy-arcane-blessing.png`);
    this.load.image('fairy-celestial-harmony', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/fairy-celestial-harmony.png`);
    this.load.image('fairy-pixie-veil', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/fairy-pixie-veil.png`);

    this.load.image('fire-blazing-burst', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/fire-blazing-burst.png`);
    this.load.image('fire-inferno-wave', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/fire-inferno-wave.png`);
    this.load.image('fire-phoenix-reign', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/fire-phoenix-reign.png`);

    this.load.image('plant-bloom-overgrowth', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/plant-bloom-overgrowth.png`);
    this.load.image('plant-natures-resurgence', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/plant-natures-resurgence.png`);
    this.load.image('plant-thorn-guard', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/plant-thorn-guard.png`);

    this.load.image('shadow-cursed-chains', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/shadow-cursed-chains.png`);
    this.load.image('shadow-shadow-strike', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/shadow-shadow-strike.png`);
    this.load.image('shadow-soul-feast', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/shadow-soul-feast.png`);

    this.load.image('water-bubble-trap', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/water-bubble-trap.png`);
    this.load.image('water-oceans-embrace', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/water-oceans-embrace.png`);
    this.load.image('water-tidal-shield', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/water-tidal-shield.png`);
  }

  create() {
    addBgMusic(this);
  }
}