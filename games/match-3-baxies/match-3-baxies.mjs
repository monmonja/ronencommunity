import Phaser from "phaser";
import MainMenuScene from './scenes/main-menu-scene.mjs';
import ScoreGameScene from './scenes/score-game-scene.mjs';
import UiScene from './scenes/ui-scene.mjs';
import GameOverScene from "./scenes/game-over-scene.mjs";
import OptionsScene from "./scenes/options-scene.mjs";

const config = {
  type: Phaser.AUTO,
  width: 380,
  height: 512,
  parent: 'game-wrapper',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    }
  },
  scene: [MainMenuScene, ScoreGameScene, UiScene, GameOverScene, OptionsScene],
};

new Phaser.Game(config);