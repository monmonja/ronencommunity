import Phaser from 'phaser';
import MainMenuScene from './scenes/main-menu-scene.mjs';
import GameScene from "./scenes/game-scene.mjs";
import GameOverScene from "./scenes/game-over-scene.mjs";
import PreloaderScene from "./scenes/preloader-scene.mjs";
import BootScene from "./scenes/boot-scene.mjs";
import {SettingsScene} from "../common/utils/settings.mjs";

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  parent: 'game-content',
  backgroundColor: '#111',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        y: 300
      },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,       // keep aspect ratio, fit screen
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, PreloaderScene, MainMenuScene, GameScene, GameOverScene, SettingsScene]
});
