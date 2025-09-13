import 'phaser';
import { TILE_WIDTH, TILE_HEIGHT } from './constants.mjs';
import {interactiveBoundsChecker} from "../common/rotate-utils.mjs";
export default class Tile extends Phaser.GameObjects.Container {
  constructor(scene, data) {
    super(scene, data.position.x, data.position.y);
    this.tileData = data;
    this.setSize(TILE_WIDTH, TILE_HEIGHT);
    this.setDepth(data.layer);
    this.background = scene.add.rectangle(0, 0, TILE_WIDTH, TILE_HEIGHT, 0xf0e68c)
      .setStrokeStyle(2, 0xbdb76b);
    this.icon = scene.add.image(0, 0, data.icon).setOrigin(0.5);
    this.icon.setDisplaySize(52, 55);
    this.add([this.background, this.icon]);
    scene.add.existing(this);
    this.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, TILE_WIDTH, TILE_HEIGHT),
      interactiveBoundsChecker,
    );
    this.setData("offsetX", TILE_WIDTH / 2);
    this.setData("offsetY", TILE_HEIGHT / 2);
  }
  setCovered(isCovered) {
    this.tileData.isCovered = isCovered;
    if (isCovered) {
      this.background.setFillStyle(0xaaaaaa);
      this.icon.setTint(0x888888);
      this.disableInteractive();
    }
    else {
      this.background.setFillStyle(0xf0e68c);
      this.icon.clearTint();
      this.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, TILE_WIDTH, TILE_HEIGHT),
        interactiveBoundsChecker,
      );
    }
  }
  collect() {
    this.tileData.isCollected = true;
    this.setVisible(false);
    this.disableInteractive();
  }
  uncollect() {
    this.tileData.isCollected = false;
    this.setVisible(true);
    this.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, TILE_WIDTH, TILE_HEIGHT),
      interactiveBoundsChecker,
    );
  }
  updateIcon(newIcon) {
    this.tileData.icon = newIcon;
    this.icon.setTexture(newIcon);
    this.icon.setDisplaySize(52, 55);
  }
}
