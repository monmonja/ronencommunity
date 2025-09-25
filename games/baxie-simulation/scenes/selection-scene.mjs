import Phaser from 'phaser';
import constants from "../../common/constants.mjs";
import {HorizontalScrollContainer} from "../../common/ui/horizontal-scroll-container.ts";
import {interactiveBoundsChecker} from "../../common/rotate-utils.mjs";
import {createButton} from "../../common/buttons.mjs";

export default class SelectionScene extends Phaser.Scene {
  constructor() {
    super('SelectionScene');
    this.selectedBaxies = [];

  }

  preload() {
    this.load.image('reference', `{{config.cdnLink}}/game-assets/baxie-simulation/images/1270.png`);
  }

  createSlots(recreate = false) {
    const slotSize = 140;
    const slotSpacing = 20;
    const startX = 20;
    const startY = 20;
    let container = this.children.getByName('slots-container');

    if (container) {
      container.destroy(true); // destroy container + all children
    }

    container = this.add.container(this.scale.width - slotSize - 40, 0);
    container.setName('slots-container');
    container.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, slotSize + 40, this.scale.height),
      interactiveBoundsChecker,
    );

    const bg = this.add.rectangle(0, 0, slotSize + 40, this.scale.height, 0x000000, 0.5);
    bg.setOrigin(0);
    container.add(bg);

    for (let i = 0; i < 3; i++) {
      const x = startX ;
      const y = startY + (i * (slotSize + slotSpacing));

      const slotContainer = this.add.container(x, y);
      slotContainer.setName(`slot-${i + 1}`);
      slotContainer.setSize(slotSize, slotSize);
      slotContainer.setInteractive(
        new Phaser.Geom.Rectangle(slotSize / 2, slotSize / 2, slotSize, slotSize),
        interactiveBoundsChecker,
      );
      slotContainer.on("pointerdown", () => {
        const baxie = this.selectedBaxies[i];

        if (baxie && this.selectedBaxies.includes(baxie)) {
          this.selectedBaxies.splice(this.selectedBaxies.indexOf(baxie), 1);

          this.horizontalScrollContainer.getByName("innerContainer").getByName(`container-baxie-${baxie.tokenId}`).getByName("border").visible = false;
          this.createSlots();
        }
      });
      slotContainer.on("pointerover", () => {
        this.input.manager.canvas.style.cursor = "pointer"; // or custom image: url("assets/cursor.png"), pointer
      });
      slotContainer.on("pointerout", () => {
        this.input.manager.canvas.style.cursor = "default";
      });

      const slotBg = this.add.rectangle(0, 0, slotSize, slotSize, 0x000000, 0.5)
        .setOrigin(0);
      slotContainer.add(slotBg);

      if (this.selectedBaxies[i]) {
        const key = `baxie-${this.selectedBaxies[i].tokenId}`;
        const sprite = this.add.image(slotSize / 2, slotSize / 2, key)
          .setOrigin(0.5)
          .setScale(0.075);
        slotContainer.add(sprite);
      } else {
        const slotLabel = this.add.text(slotSize / 2, slotSize / 2, `Slot ${i + 1}`, {
          fontSize: "16px",
          fontFamily: constants.fonts.troika,
          color: "#FFF",
          fontStyle: "bold"
        }).setOrigin(0.5);
        slotLabel.setShadow(2, 2, '#000', 4, true, true);
        slotContainer.add(slotLabel);
      }

      container.add(slotContainer);
    }

    container.add(createButton({
      scene: this,
      x: 20,
      y: this.scale.height - 80,
      width: slotSize,
      height: 50,
      text: 'Rooms',
      onPointerDown: async () => {
        // if (this.selectedBaxies.length === 3) {
        if (this.selectedBaxies.length === 1) {
          this.scene.start('RoomSelectionScene', { selectedBaxies: this.selectedBaxies });
        } else {
          const warningText = this.add.text(this.scale.width - slotSize - 100 + 20, this.scale.height - 100, `Select 3 baxies to start`, {
            fontSize: "16px",
            fontFamily: constants.fonts.troika,
            color: "#FFF",
            fontStyle: "bold",
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 10, y: 5 },
            align: 'center',
          }).setOrigin(0, 0.5);
          warningText.setShadow(2, 2, '#000', 4, true, true);

          this.time.delayedCall(2000, () => {
            warningText.destroy();
          });
        }
      },
    }));
  }

  async loadBaxiesSequentially(baxies, width, height, gridSpacing, horizontalScrollContainer) {
    let index = 0;

    const loadNext = () => {
      if (index >= baxies.length) return; // done

      const baxie = baxies[index];
      const xPos = (width + gridSpacing) * Math.floor(index / 2);
      const yPos = height * Math.floor(index % 2) + (index % 2 === 1 ? gridSpacing : 0);

      const container = this.add.container(xPos, yPos);
      container.setName(`container-baxie-${baxie.tokenId}`);
      container.setSize(width, height);
      container.setInteractive(
        new Phaser.Geom.Rectangle(width / 2, height / 2, width, height),
        interactiveBoundsChecker,
      );
      container.on("pointerdown", () => {
        if (this.selectedBaxies.includes(baxie)) {
          this.selectedBaxies.splice(this.selectedBaxies.indexOf(baxie), 1);
          container.getByName("border").visible = false;
          this.createSlots();
        } else if (this.selectedBaxies.length < 3 && !this.selectedBaxies.includes(baxie)) {
          this.selectedBaxies.push(baxie);
          container.getByName("border").visible = true;
          this.createSlots();
        }
      });

      const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0);
      container.add(bg);

      const border = this.add.rectangle(0, 0, width, height)
        .setOrigin(0)
        .setStrokeStyle(3, 0xAC022F);
      border.setName("border");
      border.visible = false;
      container.add(border);

      const label = this.add.text(width / 2, 20, `#${baxie.tokenId}`, {
        fontSize: "20px",
        fontFamily: constants.fonts.troika,
        color: "#FFF",
        fontStyle: "bold",
      }).setOrigin(0.5, 0);
      label.setShadow(2, 2, "#000", 4, true, true);
      container.add(label);

      horizontalScrollContainer.addItem(container, gridSpacing, xPos, yPos);

      // queue this baxie's image
      fetch(`/list/baxie-info/${baxie.tokenId}`)
        .then((res) => res.json())
        .then((response) => {

          const key = `baxie-${baxie.tokenId}`;
          this.load.image(key, response.image);

          // listen for this file only
          this.load.once(Phaser.Loader.Events.FILE_COMPLETE, (loadedKey) => {
            if (loadedKey === key) {
              const sprite = this.add.image(width / 2, height / 2 + 10, key)
                .setOrigin(0.5)
                .setScale(0.12);
              container.add(sprite);

              index++;       // move to next
              loadNext();    // trigger the next load
            }
          });

          this.load.start();
        }).catch((e) => {
          console.log(e)
        });
    };

    loadNext(); // kick it off
  }

  createGrid() {
    const label = this.add.text(20, 20, `Your baxies`, {
      fontSize: "30px",
      fontFamily: constants.fonts.troika,
      color: "#FFF",
      fontStyle: "bold"
    }).setOrigin(0, 0);
    label.setShadow(2, 2, '#000', 4, true, true);

    const baxies = this.registry.get(constants.registry.baxies);

    const width = 200;
    const height = 235;
    const gridSpacing = 20;

    this.horizontalScrollContainer = new HorizontalScrollContainer(this, 20, 60, 800, (height * 2) + gridSpacing);

    this.loadBaxiesSequentially(baxies, width, height, gridSpacing, this.horizontalScrollContainer);

    this.add.existing(this.horizontalScrollContainer);
  }

  create() {
    this.world = this.add.container(0, 0);

    this.backgroundDay = this.add
      .image(0, 0, 'bg')
      .setOrigin(0, 0)
      .setInteractive();
    this.world.add(this.backgroundDay);

    this.createGrid();
    this.createSlots();
  }
}