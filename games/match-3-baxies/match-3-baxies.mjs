import Phaser from "phaser";
import MainMenuScene from './scenes/main-menu-scene.mjs';
import GameScene from './scenes/game-scene.mjs';
import UiScene from './scenes/ui-scene.mjs';
import GameOverScene from "./scenes/game-over-scene.mjs";

const config = {
  type: Phaser.AUTO,
  width: 370,
  height: 512,
  parent: 'game-wrapper',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    }
  },
  scene: [MainMenuScene, GameScene, UiScene, GameOverScene],
};

new Phaser.Game(config);