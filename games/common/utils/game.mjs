import Phaser from "phaser";
import BootScenes from "../scene/boot-scene.mjs";
import CommonScenes from "../common-scenes.mjs";

export function createGame({ gameScenesArray, gravityY = 0, customConfig } = {}) {
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
          y: gravityY
        },
        debug: false
      }
    },
    dom: {
      createContainer: true
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      orientation: Phaser.Scale.LANDSCAPE
    },
    scene: [
      BootScenes,
      ...gameScenesArray,
      ...CommonScenes,
    ],
  });

  game.customConfig = customConfig;
}