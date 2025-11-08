import {VerticalScrollContainer} from "../../common/ui/vertical-scroll-container.mjs";
import constants from "../../common/constants.mjs";

export default class LoggerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoggerScene' });
  }

  create() {
    const width = 350;
    const height = 150;
    const x = 0;
    const y = this.game.scale.height - height;

    // Container for background and scroll
    this.container = this.add.container(x, y);

    // Background
    const bg = this.add.rectangle(
      0,
      0,
      width,
      height,
      0x000000,
      0.9
    ).setOrigin(0);
    this.container.add(bg);

    // Scrollable area
    this.logContainer = new VerticalScrollContainer(this, 0, 0, width, height);
    this.container.add(this.logContainer);
  }

  /**
   * Add a new log message to the log container.
   * @param {string} message
   */
  addLog(message) {
    const container = this.add.container(0, 0);

    const text = this.add.text(0, 0, message, {
      fontSize: '19px',
      fontFamily: constants.fonts.Newsreader,
      fill: "#ffffff",
      wordWrap: { width: 300 - 10 }
    }).setOrigin(0);

    container.add(text);
    this.logContainer.prependItem(container, 22, 0);
  }
}
