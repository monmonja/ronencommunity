import Phaser from 'phaser';
import {interactiveBoundsChecker} from "../rotate-utils.mjs";
import constants from "../constants.mjs";

export default class Dropdown extends Phaser.GameObjects.Container {
  constructor(scene, x, y, {
    options = [],
    defaultLabel = 'Select',
    bgColor = 0x333366,
    strokeColor = 0xFFFFFF,
    width = 160,
    height = 40,
    fontColor = 0xffffff,
  } = {}) {
    super(scene, x, y);

    this.scene = scene;
    this.options = options; // [{ label, value }]
    this.selected = { label: defaultLabel, value: null };
    this.isOpen = false;
    this.optionObjects = [];
    this.bgColor = bgColor;
    this.fontColor = fontColor
    this.strokeColor = strokeColor;
    this.width = width;
    this.height = height;

    // Button background
    this.buttonBg = scene.add.graphics();
    this.drawRoundedRect(this.buttonBg, 0, 0, width, height, 6, bgColor, strokeColor);

    // Label text
    this.label = scene.add.text(-(width / 2) + 15, 0, defaultLabel, {
      fontSize: '18px',
      color: this.fontColor,
      fontFamily: constants.fonts.troika,
    }).setOrigin(0, 0.5);

    // Overlay container (options list)
    this.overlay = scene.add.container(0, 25);
    this.overlay.visible = false;

    // Add to parent container
    this.add([this.buttonBg, this.label, this.overlay]);

    // Toggle dropdown on button click
    this.buttonBg.setInteractive(new Phaser.Geom.Rectangle(-(width / 2), -(height / 2), width, height), interactiveBoundsChecker);
    this.buttonBg.on('pointerdown', () => this.toggleDropdown());

    // Add container to scene
    scene.add.existing(this);
  }

  drawRoundedRect(graphics, x, y, width, height, radius, fillColor, strokeColor) {
    graphics.clear();
    if (strokeColor) {
      graphics.lineStyle(3, strokeColor);
    }
    graphics.fillStyle(fillColor);
    graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
    graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius);
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    this.overlay.visible = this.isOpen;

    if (this.isOpen) {
      this.showOptions();
    } else {
      this.clearOptions();
    }
  }

  showOptions() {
    this.clearOptions();

    this.options.forEach((opt, i) => {
      const yOffset = i * this.height + 4;

      // Background
      const bg = this.scene.add.graphics();
      this.drawRoundedRect(bg, 0, yOffset + 20, this.width, this.height, 0, this.bgColor);
      bg.setInteractive(new Phaser.Geom.Rectangle(-(this.width / 2), yOffset, this.width, this.height), interactiveBoundsChecker);

      // Label text
      const text = this.scene.add.text(-(this.width / 2) + 15, yOffset + 20, opt.label, {
        fontSize: '16px',
        color: '#ffffff',
      }).setOrigin(0, 0.5);

      // Hover effects
      // bg.on('pointerover', () => this.drawRoundedRect(bg, 0, yOffset + 20, this.width, this.height, 0, 0x444488));
      // bg.on('pointerout', () => this.drawRoundedRect(bg, 0, yOffset + 20, this.width, this.height, 0, 0x222244));

      // Selection
      bg.on('pointerdown', () => {
        this.selected = opt;
        this.label.setText(opt.label);
        this.toggleDropdown();
      });

      this.overlay.add([bg, text]);
      this.optionObjects.push(bg, text);
    });
  }

  clearOptions() {
    this.optionObjects.forEach(o => o.destroy());
    this.optionObjects = [];
  }

  getValue() {
    return this.selected.value;
  }

  getLabel() {
    return this.selected.label;
  }
}
