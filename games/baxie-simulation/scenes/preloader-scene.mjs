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
      launchScreen: 'ToolSelection',
      // launchScreen: 'SyncMenuScene',
      // launchScreen: 'GameModesScene',
      // launchScreen: 'PositionSlotsScene',
      // launchScreen: 'RoomSelectionScene',
      // launchScreen: 'EndGameScene',
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
    this.load.image('battle-bg', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/bg/stadium.webp`)
    this.load.image('shadow', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/shadow.webp`)


    this.load.image('game-simulation', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/game-simulation.png`);
    this.load.image('under-construction', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/under-construction.jpg`);

    this.load.image('electric-charge-up', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/electric-charge-up-big.png`);
    this.load.image('electric-storm-breaker', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/electric-storm-breaker-big.png`);
    this.load.image('electric-volt-overload', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/electric-volt-overload-big.png`);

    this.load.image('fairy-arcane-blessing', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/fairy-arcane-blessing-big.png`);
    this.load.image('fairy-celestial-harmony', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/fairy-celestial-harmony-big.png`);
    this.load.image('fairy-pixie-veil', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/fairy-pixie-veil-big.png`);

    this.load.image('fire-blazing-burst', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/fire-blazing-burst-big.png`);
    this.load.image('fire-inferno-wave', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/fire-inferno-wave-big.png`);
    this.load.image('fire-phoenix-reign', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/fire-phoenix-reign-big.png`);

    this.load.image('plant-bloom-overgrowth', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/plant-bloom-overgrowth-big.png`);
    this.load.image('plant-natures-resurgence', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/plant-natures-resurgence-big.png`);
    this.load.image('plant-thorn-guard', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/plant-thorn-guard-big.png`);

    this.load.image('shadow-cursed-chains', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/shadow-cursed-chains-big.png`);
    this.load.image('shadow-shadow-strike', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/shadow-shadow-strike-big.png`);
    this.load.image('shadow-soul-feast', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/shadow-soul-feast-big.png`);

    this.load.image('water-bubble-trap', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/water-bubble-trap-big.png`);
    this.load.image('water-oceans-embrace', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/water-oceans-embrace-big.png`);
    this.load.image('water-tidal-shield', `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/skills/water-tidal-shield-big.png`);

    const effectsPath = `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/images/effects`;
    this.load.image('effects-stunned', `${effectsPath}/stun-debuff.png`);
    this.load.image('effects-silence', `${effectsPath}/silence-debuff.png`);
    this.load.image('effects-shield', `${effectsPath}/shield-buff.png`);
    this.load.image('effects-defenseBoost', `${effectsPath}/def-buff.png`);
    this.load.image('effects-extraDamageTaken', `${effectsPath}/def-decrease-debuff.png`);
    this.load.image('effects-reduceDamageTaken', `${effectsPath}/reduce-damage-taken-buff.png`);
    this.load.image('effects-attackBoost', `${effectsPath}/atk-buff.png`);
    this.load.image('effects-skillDamageBoost', `${effectsPath}/skill-damage-buff.png`);
    this.load.image('effects-burn', `${effectsPath}/burn-debuff.png`);
    this.load.image('effects-reflect', `${effectsPath}/thorn-buff.png`);
    this.load.image('effects-attackDebuff', `${effectsPath}/atk-decrease-debuff.png`);

    const audioPath = `{{config.cdnLink}}/game-assets/${this.game.customConfig.gameId}/audio`;
    this.load.audio('sfx-hit', `${audioPath}/hit-sound-effect-12445.mp3`);
    this.load.audio('sfx-buff', `${audioPath}/level-up-08-402152.mp3`);
    this.load.audio('sfx-crit', `${audioPath}/heavy-cineamtic-hit-166888.mp3`);
    this.load.audio('sfx-lightning-magic', `${audioPath}/lightning-spell-386163.mp3`);
    this.load.audio('sfx-water-magic', `${audioPath}/water-magic-3-378618.mp3`);
    this.load.audio('sfx-plant-magic', `${audioPath}/plant-magic-5-378630.mp3`);
    this.load.audio('sfx-healing-magic', `${audioPath}/healing-magic-4-378668.mp3`);
    this.load.audio('sfx-fire-magic', `${audioPath}/fire-magic-5-378639.mp3`);
    this.load.audio('sfx-dark-magic', `${audioPath}/dark-magic-1-378650.mp3`);
    this.load.audio('bgm', `${audioPath}/bg-music.mp3`);
  }

  create() {
    addBgMusic(this);
  }
}