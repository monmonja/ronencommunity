import Phaser from 'phaser';
import MainMenuScene from './scenes/main-menu-scene.mjs';
import GameScene from "./scenes/game-scene.mjs";
import PreloaderScene from "./scenes/preloader-scene.mjs";
import CommonScenes from "../common/common-scenes.mjs";
import BootScenes from "../common/scene/boot-scene.mjs";
import UIScene from "./scenes/ui-scene.mjs";
import {createGame} from "../common/utils/game.mjs";

createGame({
  gameScenesArray: [
    PreloaderScene,
    MainMenuScene,
    GameScene,
    UIScene,
  ],
  customConfig: {
    gameId: 'baxie-a-baxie',
    bgImage: 'bg.webp',
  }
});
