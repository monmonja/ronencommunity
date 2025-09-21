import Phaser from 'phaser';
import MainMenuScene from './scenes/main-menu-scene.mjs';
import GameScene from "./scenes/game-scene.ts";
import PreloaderScene from "./scenes/preloader-scene.mjs";
import RoomsScene from "../common/scene/rooms-scene.mjs";
import UIScene from "./scenes/ui-scene.mjs";
import {createGame} from "../common/utils/game.mjs";
import TestScene from "./scenes/test-scene.mjs";

createGame({
  gameScenesArray: [
    PreloaderScene,
    TestScene,
    MainMenuScene,
    GameScene,
    UIScene,
    RoomsScene,
  ],
  customConfig: {
    gameId: 'baxie-simulation',
    bgImage: 'bg.webp',
  }
});
