import Phaser from "phaser";
import MainMenuScene from './scenes/main-menu-scene.mjs';
import ScoreGameScene from './scenes/score-game-scene.mjs';
import GameOverScene from "./scenes/game-over-scene.mjs";
import {SettingsScene} from "../common/settings.mjs";
import BootScene from "./scenes/boot-scene.mjs";
import PreloaderScene from "./scenes/preloader-scene.mjs";
import {MainPanelScene} from "../common/main-panel.mjs";
import EnergiesScene from "../common/scene/energies-scene.mjs";

const game = new Phaser.Game({
  gameId: 'match-3-baxies',
  type: Phaser.AUTO,
  width: 1024,
  height: 576,
  parent: 'game-content',
  backgroundColor: '#111',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
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
    ScoreGameScene,
    GameOverScene,
    SettingsScene,
    MainPanelScene,
    EnergiesScene,
  ],
});

game.customConfig = {
  gameId: 'match-3-baxies',
};