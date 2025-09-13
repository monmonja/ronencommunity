import Phaser from 'phaser';
import MainMenuScene from './scenes/main-menu-scene.mjs';
import GameScene from "./scenes/game-scene.mjs";
import GameOverScene from "./scenes/game-over-scene.mjs";
import PreloaderScene from "./scenes/preloader-scene.mjs";
import BootScene from "./scenes/boot-scene.mjs";
import CommonScenes from "../common/common-scenes.mjs";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 1024,
  height: 576,
  parent: 'game-content',
  backgroundColor: '#111',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        y: 0
      },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    orientation: Phaser.Scale.LANDSCAPE
  },
  scene: [
    BootScene,
    PreloaderScene,
    MainMenuScene,
    GameScene,
    GameOverScene,
    ...CommonScenes,
  ]
});

game.customConfig = {
  gameId: 'maze-coin',
};