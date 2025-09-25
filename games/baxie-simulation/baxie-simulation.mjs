import Phaser from 'phaser';
import SyncMenuScene from './scenes/sync-menu-scene.mjs';
import SelectionScene from './scenes/selection-scene.mjs';
import RoomSelectionScene from './scenes/room-selection-scene.mjs';
import GameScene from "./scenes/game-scene.ts";
import PreloaderScene from "./scenes/preloader-scene.mjs";
import RoomsScene from "../common/scene/rooms-scene.mjs";
import UIScene from "./scenes/ui-scene.mjs";
import {createGame} from "../common/utils/game.mjs";
import TestScene from "./scenes/test-scene.mjs";

createGame({
  gameScenesArray: [
    PreloaderScene,
    // TestScene,
    SyncMenuScene,
    SelectionScene,
    RoomSelectionScene,
    GameScene,
    UIScene,
    RoomsScene,
  ],
  customConfig: {
    gameId: 'baxie-simulation',
    bgImage: 'bg.webp',
  }
});
