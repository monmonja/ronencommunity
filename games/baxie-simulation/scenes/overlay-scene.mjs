import * as Phaser from 'phaser';
import constants from "../../common/constants.mjs";

export default class OverlayScene extends Phaser.Scene {
  constructor() {
    super('OverlayScene');
  }

  create() {
    // Store references to active overlays
    this.activeOverlays = [];

    // Listen for global events
    this.game.events.on('show-overlay', this.showOverlay, this);
    this.game.events.on('hide-overlay', this.hideOverlay, this);
  }

  showOverlay({ text, x = 0, y = 0, style = {} }) {
    const containerWidth = 340;
    const padding = 10;

    // Default text style
    const textStyle = {
      fontFamily: constants.fonts.Newsreader,
      fontSize: '16px',
      color: '#ffffff',
      wordWrap: { width: containerWidth - padding * 2, useAdvancedWrap: true },
      align: 'center',
      ...style,
    };

    // Create text first (to measure height)
    const overlayText = this.add.text(containerWidth / 2, 0, text, textStyle)
      .setOrigin(0.5, 0) // centered horizontally, top-aligned vertically
      .setScrollFactor(0);

    // Calculate background height based on text
    const bgHeight = overlayText.height + padding * 2;

    // Create background rectangle
    const bg = this.add.rectangle(0, 0, containerWidth, bgHeight, 0x000000, 0.6)
      .setOrigin(0) // top-left origin
      .setScrollFactor(0);

    // Offset text down by padding (so it's not glued to the top)
    overlayText.y = padding;

    // Create container with top-left origin
    const container = this.add.container(x, y, [bg, overlayText])
      .setScrollFactor(0)
      .setDepth(9999);

    this.activeOverlays.push(container);
  }

  hideOverlay() {
    // Destroy all overlays
    this.activeOverlays.forEach(t => t.destroy());
    this.activeOverlays = [];
  }

  shutdown() {
    // Clean up event listeners
    this.game.events.off('show-overlay', this.showOverlay, this);
    this.game.events.off('hide-overlay', this.hideOverlay, this);
  }
}
