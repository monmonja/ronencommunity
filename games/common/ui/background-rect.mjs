import Phaser from 'phaser';
import {interactiveBoundsChecker} from "../rotate-utils.mjs";
import constants from "../constants.mjs";

export default class BackgroundRect extends Phaser.GameObjects.Container {
  constructor(scene, {
    x, y, width, height,
    radius = 6,
    topBgColor = 0x4f9f44,
    bottomBgColor = 0x556853,
    innerBaseColor = 0x537a4e,
    borderColor = 0x223220,
  }) {
    super(scene, x, y);

    const bg = scene.add.graphics();

    // top
    bg.fillStyle(topBgColor, 1);
    bg.fillRoundedRect(0, 0, width, height / 2, radius);
    // below
    bg.fillStyle(bottomBgColor, 1);
    bg.fillRoundedRect(0, 6, width, height - 6, radius);

    // Draw base background
    bg.fillStyle(innerBaseColor, 1);
    bg.fillRoundedRect(2, 4, width - 4, height - 8, radius);

    // Draw border
    bg.lineStyle(2, borderColor);
    bg.strokeRoundedRect(0, 0, width, height, radius);
    this.add(bg);
  }
}
