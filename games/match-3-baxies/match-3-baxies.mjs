import Phaser from "phaser";
import MainMenuScene from './scenes/main-menu-scene.mjs';
import ScoreGameScene from './scenes/score-game-scene.mjs';
import UiScene from './scenes/ui-scene.mjs';
import GameOverScene from "./scenes/game-over-scene.mjs";
import {SettingsScene} from "../common/utils/settings.mjs";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  parent: 'game-content',
  backgroundColor: '#111',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,       // keep aspect ratio, fit screen
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MainMenuScene, ScoreGameScene, UiScene, GameOverScene, SettingsScene],
};

new Phaser.Game(config);