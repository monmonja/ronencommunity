import Phaser from 'phaser';
import constants from "../../common/constants.mjs";
import {HorizontalScrollContainer} from "../../common/ui/horizontal-scroll-container.ts";
import {interactiveBoundsChecker} from "../../common/rotate-utils.mjs";
import {createButton} from "../../common/buttons.mjs";

export default class SelectionScene extends Phaser.Scene {
  constructor() {
    super('SelectionScene');

    this.selectedBaxiesId = [];
    this.selectedBaxies = [];
  }

  init(data) {
    this.selectedBaxiesId = [];
    this.selectedBaxies = [];

    if (data.selectedBaxies) {
      this.selectedBaxies = data.selectedBaxies;
    } else if (localStorage.getItem('selectedBaxies')) {
      this.selectedBaxies = JSON.parse(localStorage.getItem('selectedBaxies'));
    }

    this.selectedBaxiesId = this.selectedBaxies.map((b) => b.tokenId);
  }

  preload() {
    this.load.image('reference', `{{config.cdnLink}}/game-assets/baxie-simulation/images/1270.png`);

    for (const baxie of this.selectedBaxies) {
      this.load.image(`baxie-${baxie.tokenId}`, baxie.data.image);
    }
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
        const baxie = this.selectedBaxiesId[i];

        if (baxie && this.selectedBaxiesId.includes(baxie)) {
          this.selectedBaxiesId.splice(this.selectedBaxiesId.indexOf(baxie), 1);

          this.horizontalScrollContainer.getByName("innerContainer").getByName(`container-baxie-${baxie}`).getByName("border").visible = false;
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

      if (this.selectedBaxiesId[i]) {
        const key = `baxie-${this.selectedBaxiesId[i]}`;
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
      text: 'Slots',
      onPointerDown: async () => {
        if (this.selectedBaxiesId.length === 3) {
          let selectedBaxies = this.selectedBaxies
            .filter((baxie, index, self) => index === self.findIndex((b) => b.tokenId === baxie.tokenId))
            .filter((b) => this.selectedBaxiesId.includes(b.tokenId));
          selectedBaxies = selectedBaxies.slice(0, 3);

          localStorage.setItem('selectedBaxies', JSON.stringify(selectedBaxies));

          this.scene.start('PositionSlotsScene', {
            selectedBaxiesId: this.selectedBaxiesId,
            selectedBaxies,
          });
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

  makeStatItemContainer(statName, statValue, x, width) {
    const container = this.add.container(x, 0);

    const bg = this.add.rectangle(0, 0, width, 40, 0x000000, 0.5).setOrigin(0);
    container.add(bg);

    const nameText = this.add.text(width / 2, 5, statName, {
      fontSize: "12px",
      fontFamily: constants.fonts.Newsreader,
      color: "#FFF",
      fontStyle: "bold",
    }).setOrigin(0.5, 0);
    nameText.setShadow(2, 2, "#000", 4, true, true);
    container.add(nameText);

    const valueText = this.add.text(width / 2, 20, statValue, {
      fontSize: "16px",
      fontFamily: constants.fonts.Newsreader,
      color: "#FFF",
      fontStyle: "bold",
    }).setOrigin(0.5, 0);
    valueText.setShadow(2, 2, "#000", 4, true, true);
    container.add(valueText);

    return container;
  }

  async loadBaxiesSequentially(baxies, width, height, gridSpacing, horizontalScrollContainer) {
    let index = 0;

    const loadBaxieData = (baxie, nftData, container) => {
      const key = `baxie-${baxie.tokenId}`;
      this.load.image(key, nftData.data.image);

      container.on("pointerdown", () => {
        if (this.selectedBaxiesId.includes(baxie.tokenId)) {
          this.selectedBaxiesId.splice(this.selectedBaxiesId.indexOf(baxie.tokenId), 1);
          container.getByName("border").visible = false;
          this.createSlots();
        } else if (this.selectedBaxiesId.length < 3 && !this.selectedBaxiesId.includes(baxie)) {
          this.selectedBaxiesId.push(baxie.tokenId);
          console.log(190)
          this.selectedBaxies.push(nftData);
          container.getByName("border").visible = true;
          this.createSlots();
        }
      });

      // listen for this file only
      if (this.textures.exists(key)) {
        // Just reuse the existing texture
        const sprite = this.add.image(width / 2, height / 2 - 10, key)
          .setOrigin(0.5)
          .setScale(0.1);
        container.add(sprite);

        index++;
        loadNext();
      } else {
        this.load.once(Phaser.Loader.Events.FILE_COMPLETE, (loadedKey) => {
          if (loadedKey === key) {
            const sprite = this.add.image(width / 2, height / 2 - 10, key)
              .setOrigin(0.5)
              .setScale(0.1);
            container.add(sprite);

            index++;       // move to next
            loadNext();    // trigger the next load
          }
        });
        this.load.start();
      }
    }

    const loadNext = () => {
      if (index >= baxies.length) return; // done

      try {
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

        const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0);
        container.add(bg);

        const border = this.add.rectangle(0, 0, width, height)
          .setOrigin(0)
          .setStrokeStyle(3, 0xAC022F);
        border.setName("border");
        border.visible = false;
        container.add(border);

        if (this.selectedBaxiesId.includes(baxie.tokenId)) {
          border.visible = true;
        }

        const label = this.add.text(20, 10, `#${baxie.tokenId}`, {
          fontSize: "20px",
          fontFamily: constants.fonts.Newsreader,
          color: "#FFF",
          fontStyle: "bold",
        }).setOrigin(0, 0);
        label.setShadow(2, 2, "#000", 4, true, true);
        container.add(label);

        if (baxie.nft) {
          const purity = this.add.text(width - 20, 10, `${baxie.nft.purity}`, {
            fontSize: "16px",
            fontFamily: constants.fonts.Newsreader,
            color: "#FFF",
            fontStyle: "bold",
          }).setOrigin(1, 0);
          purity.setShadow(2, 2, "#000", 4, true, true);
          container.add(purity);

          const statsContainer = this.add.container(0, height - 40);
          statsContainer.setName("stats-container");
          container.add(statsContainer);

          statsContainer.add(this.makeStatItemContainer('HP', baxie.nft.hp, 0, 40));
          statsContainer.add(this.makeStatItemContainer('SP', baxie.nft.sp, 40, 40));

          let statX = 80;

          for (const attribute of baxie.nft.data.attributes) {
            if (['attack', 'defense', 'stamina'].includes(attribute.trait_type.toLowerCase())) {
              if (attribute.trait_type.toLowerCase() === 'attack') {
                statsContainer.add(this.makeStatItemContainer('ATK', attribute.value, statX, 40));
                statX += 40;
              } else if (attribute.trait_type.toLowerCase() === 'defense') {
                statsContainer.add(this.makeStatItemContainer('DEF', attribute.value, statX, 40));
                statX += 40;
              } else if (attribute.trait_type.toLowerCase() === 'stamina') {
                statsContainer.add(this.makeStatItemContainer('STA', attribute.value, statX, 40));
                statX += 40;
              }
            }
          }
        }

        horizontalScrollContainer.addItem(container, gridSpacing, xPos, yPos);

        // queue this baxie's image
        if (baxie.nft) {
          loadBaxieData(baxie, baxie.nft, container);
        } else {
          fetch(`/list/baxie-info/${baxie.tokenId}`)
            .then((res) => res.json())
            .then((response) => {
              loadBaxieData(baxie, response, container);

            }).catch((e) => {
              console.log(e)
            });
          }
      } catch (e) {
        console.log('Error',e)
      }
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