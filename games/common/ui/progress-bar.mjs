import Phaser from 'phaser';

// ProgressBar.js
// ProgressBar.js
export default class ProgressBar extends Phaser.GameObjects.Container {
  constructor(scene, {
    x = 0,
    y = 0,
    width = 200,
    height = 20,
    max = 100,
    current = 100,
    backgroundColor = 0x333333,
    barColor = 0xff0000,
    borderSize = 2,
    borderColor = 0xffffff
  } = {}) {
    super(scene, x, y);

    this.width = width;
    this.height = height;
    this.max = max;
    this.current = current;

    // Background
    this.bg = scene.add.rectangle(0, 0, width, height, backgroundColor).setOrigin(0, 0);

    // Border
    if (borderSize > 0) {
      this.border = scene.add.rectangle(
        -borderSize,
        -borderSize,
        width + borderSize * 2,
        height + borderSize * 2
      )
        .setOrigin(0, 0)
        .setStrokeStyle(borderSize, borderColor);
      this.add(this.border);
    }

    // Progress bar
    this.bar = scene.add.rectangle(0, 0, this.getBarWidth(), height, barColor).setOrigin(0, 0);

    this.add([this.bg, this.bar]);
    scene.add.existing(this);
  }

  getBarWidth() {
    return (this.current / this.max) * this.width;
  }

  setValue(value) {
    this.current = Phaser.Math.Clamp(value, 0, this.max);
    this.bar.width = this.getBarWidth();
  }

  setMaxValue(max) {
    this.max = max;
    this.setValue(this.current);
  }

  setColors({ backgroundColor, barColor, borderColor }) {
    if (backgroundColor !== undefined) this.bg.fillColor = backgroundColor;
    if (barColor !== undefined) this.bar.fillColor = barColor;
    if (borderColor !== undefined && this.border) this.border.strokeColor = borderColor;
  }
}
