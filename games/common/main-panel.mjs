import Phaser from "phaser";
import {addSettingsIcon} from "./settings.mjs";
import {createEnergyUI} from "./energies.mjs";
import constants from "./constants.mjs";

function createBg({
  scene,
  x = 0,
  y = 0,
  width,
  height,
  padding = 4,
  color = 0x111,
  bgAlpha = 1,
  strokeColor ,
} = {}) {
  const startY = y + (padding * 2);
  const endY = height - (padding * 2);
  const bg = scene.add.graphics();

  const offset = 15;

  bg.fillStyle(color, bgAlpha);

  if (strokeColor) {
    bg.lineStyle(2, strokeColor, 1);
  }

  bg.beginPath();
  bg.moveTo(x, startY);
  bg.lineTo(width - 10, startY + offset - 10);
  bg.lineTo(width, startY + offset );

  bg.lineTo(width, endY - offset);
  bg.lineTo(width - 10, endY - offset + 10);
  bg.lineTo(x, endY);               // bottom-left
  bg.closePath();
  bg.fillPath();
  bg.strokePath();

  return bg;
}

export function createMainPanelBg ({ scene } = {}) {
  const container = scene.add.container(-2, 0);

  container.add(createBg({
    scene,
    x: 0,
    y: 0,
    width: constants.mainMenu.panelWidth + 5,
    color: 0x121212,
    bgAlpha: 0.3,
    height: scene.scale.height,
    padding: 2,
  }));

  container.add(createBg({
    scene,
    x: 0,
    y: 0,
    width: constants.mainMenu.panelWidth,
    bgAlpha: 0.9,
    strokeColor: 0x9dfd90,
    height: scene.scale.height,
  }));
}

export class MainPanelScene extends Phaser.Scene {
  constructor() {
    super("MainPanelScene");
  }

  preload() {
    this.load.image("energy-icon", "{{config.cdnLink}}/game-assets/common/images/energy.png");
    this.load.image("profile-frame", "{{config.cdnLink}}/game-assets/common/images/profile-frame.png");
    this.load.image("settings", "{{config.cdnLink}}/game-assets/common/images/settings.png");
    this.load.image("profile-pic", `{{config.cdnLink}}/game-assets/flappy-baxie/images/baxie-gronke.png`);
  }

  create() {
    createMainPanelBg({
      scene: this,
    });

    createEnergyUI({
      scene: this,
      x: 4,
      y: this.scale.height - 60,
      width: constants.mainMenu.panelWidth - 13
    });

    addSettingsIcon({
      scene: this,
    });

    this.gameItems = this.add.container(7, 100);
    this.game.events.on("clearMainPanelItem", () => {
      console.log('here')
      this.gameItems.removeAll(true);
    });
    this.game.events.on("addMainPanelItem", (uiFunc) => {
      this.gameItems.add(uiFunc({
        scene: this,
      }));
    });
  }
}
