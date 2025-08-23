import Phaser from 'phaser';
import {createButton} from "../../utils/buttons.mjs";
import {createOverlay} from "../../utils/overlay.mjs";

const partsMax = {
  eyes: 25,
  mouth: 24,
  forehead: 24,
}
export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init() {
    this.bodyType = 'orange';
    this.eye = `eye-${Math.floor(Math.random() * partsMax.eyes) + 1}`;
    console.log(this.eye)
    this.mouth = `mouth-${Math.floor(Math.random() * partsMax.mouth) + 1}`;
    console.log(this.mouth)
    this.forehead = `forehead-${Math.floor(Math.random() * partsMax.forehead) + 1}`;
  }

  create() {
    this.bg = this.add
      .image(0, 0, 'bg')
      .setOrigin(0, 0);
    this.add
      .image(this.sys.game.config.width /2, 180, this.bodyType)
      .setScale(0.5)
      .setOrigin(0.5, 0);
    // this.add
    //   .image(this.sys.game.config.width /2, 128, 'reference')
    //   .setScale(3.21)
    //   .setOrigin(0.5, 0)
    //   .visible = !false;
    this.selectedEye = this.add
      .image((this.sys.game.config.width / 2) - 1, 249, this.eye)
      .setScale(0.43)
      .setOrigin(0.5, 0.5);
    this.selectedMouth = this.add
      .image((this.sys.game.config.width / 2) - 1, 285, this.mouth)
      .setScale(0.25)
      .setOrigin(0.5, 0.5);
    this.selectedForehead = this.add
      .image((this.sys.game.config.width / 2) - 1, 180, this.forehead)
      .setScale(0.35)
      .setOrigin(0.5, 0.5);

    this.createButtons();

  }

  createButtons() {
    const buttonHeight = 46;
    const widthHeight = 75;

    const eyeImage = this.add.image(widthHeight / 2, buttonHeight / 2, this.eye)
      .setScale(0.2)
      .setOrigin(0.5, 0.5);
    createButton({
      scene: this,
      x: 23,
      y: 400,
      width: 75,
      height: buttonHeight,
      image: eyeImage,
      onPointerDown: () => {
        this.openOverlay('eye', partsMax.eyes, (key) => {
          this.selectedEye.setTexture(key);
          eyeImage.setTexture(key);
        });
      }
    });

    const mouthImage = this.add.image(widthHeight / 2, buttonHeight / 2, this.mouth)
      .setScale(0.2)
      .setOrigin(0.5, 0.5);
    createButton({
      scene: this,
      x: 104,
      y: 400,
      width: 75,
      height: buttonHeight,
      image: mouthImage,
      onPointerDown: () => {
        this.openOverlay('mouth', partsMax.mouth,(key) => {
          this.selectedMouth.setTexture(key);
          mouthImage.setTexture(key);
        });
      }
    });

    const foreheadImage = this.add.image(widthHeight / 2, buttonHeight / 2, this.forehead)
      .setScale(0.2)
      .setOrigin(0.5, 0.5);
    createButton({
      scene: this,
      x: 185,
      y: 400,
      width: 75,
      height: buttonHeight,
      image: foreheadImage,
      onPointerDown: () => {
        this.openOverlay('forehead', partsMax.forehead,(key) => {
          this.selectedForehead.setTexture(key);
          foreheadImage.setTexture(key);
        });
      }
    });
    createButton({
      scene: this,
      x: 23,
      y: 452,
      width: 75,
      height: buttonHeight,
      text: 'ears',
      onPointerDown: () => {
        this.openOverlay('eye', 25);
      }
    });

    createButton({
      scene: this,
      x: 104,
      y: 452,
      width: 75,
      height: buttonHeight,
      text: 'tails',
      onPointerDown: () => {
        this.openOverlay('mouth', 3, () => {

        });
      }
    });
    createButton({
      scene: this,
      x: 185,
      y: 452,
      width: 75,
      height: buttonHeight,
      text: 'ears',
      onPointerDown: () => {
        this.openOverlay();
      }
    });
    createButton({
      scene: this,
      x: 185,
      y: 452,
      width: 75,
      height: buttonHeight,
      text: 'body',
      onPointerDown: () => {
        this.openOverlay();
      }
    });


    createButton({
      scene: this,
      x: 267,
      y: 400,
      width: 75,
      height: buttonHeight * 2 + 7,
      text: 'save',
      onPointerDown: () => {
        this.openOverlay();
      }
    });

  }

  openOverlay(type, maxNumber, selectedFunc) {
    const overlay = createOverlay({
      scene: this,
      x: 13,
      y: 80,
      width: 343,
      height: 420,
    });
    overlay.setDepth(100);

    const closeBtn = this.createCloseButton(overlay);
    const items = [closeBtn];

    for (let i = 0; i < maxNumber; i++) {
      const item = this.add.image((i % 4) * 81 + 50, Math.floor(i / 4) * 52 + 80, `${type}-${i + 1}`);
      item.setInteractive();
      item.on('pointerdown', () => {
        selectedFunc(`${type}-${i + 1}`);
        overlay.visible = false;
      });
      item.setScale(0.25);
      items.push(item);
    }

    overlay.add(items)
  }

  createCloseButton(overlay) {
    const container = this.add.container(290, 10);
    const bg = this.add.graphics();
    bg.fillStyle(0x406fff, 1);
    bg.fillRoundedRect(2, 4, 35, 35, 6);
    const label = this.add.text(19, 23, 'X', {
      fontSize: '24px',
      fontFamily: 'troika',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    container.setInteractive(
      new Phaser.Geom.Rectangle(0, 5, 35, 35),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerdown', () => {
      overlay.visible = false;
    });

    container.add([bg, label]);

    return container;
  }
}
