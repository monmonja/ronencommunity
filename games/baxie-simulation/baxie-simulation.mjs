import Phaser from 'phaser';
import SyncMenuScene from './scenes/sync-menu-scene.mjs';
import SelectionScene from './scenes/selection-scene.mjs';
import RoomSelectionScene from './scenes/room-selection-scene.mjs';
import GameScene from "./scenes/game-scene.mjs";
import PreloaderScene from "./scenes/preloader-scene.mjs";
import RoomsScene from "../common/scene/rooms-scene.mjs";
import UIScene from "./scenes/ui-scene.mjs";
import {createGame} from "../common/utils/game.mjs";
import PositionSlotsScene from "./scenes/position-slots-scene.mjs";
import GameModesScene from "./scenes/game-modes-scene.mjs";
import EndGameScene from "./scenes/end-game-scene.mjs";

createGame({
  gameScenesArray: [
    PreloaderScene,
    // TestScene,
    SyncMenuScene,
    SelectionScene,
    RoomSelectionScene,
    PositionSlotsScene,
    GameScene,
    UIScene,
    RoomsScene,
    GameModesScene,
    EndGameScene,
  ],
  customConfig: {
    gameId: 'baxie-simulation',
    bgImage: 'bg.webp',
  }
});
