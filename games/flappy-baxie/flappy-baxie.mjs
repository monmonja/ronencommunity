import Phaser from 'phaser';
import MainMenuScene from './scenes/main-menu-scene.mjs';
import GameScene from "./scenes/game-scene.mjs";
import GameOverScene from "./scenes/game-over-scene.mjs";

new Phaser.Game({
  type: Phaser.AUTO,
  width: 370,
  height: 512,
  parent: 'game-wrapper',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        y: 300
      },
      debug: false
    }
  },
  scene: [MainMenuScene, GameScene, GameOverScene]
});
