import constants from "../constants.mjs";
import {createCloseButton} from "../buttons.mjs";
import {fetchEnergy} from "../energies.mjs";

export default class EnergiesScene extends Phaser.Scene {
  windowWidth = 410;
  buttonWidth = 184;
  buttonHeight = 98;
  constructor() {
    super("EnergiesScene");
  }

  createTopBg() {
    this.add.container(0, 0);
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, constants.colors.blocker, constants.colors.blockerAlpha)
      .setOrigin(0, 0)
      .setInteractive();

    this.panel = this.add.container((this.scale.width / 2 - this.windowWidth / 2) + (constants.mainMenu.panelWidth / 2), 20);
    const bg = this.add.graphics();

    bg.fillStyle(0x222222, 1);
    bg.fillRoundedRect(0, 0, this.windowWidth, this.scale.height - 40, 4);
    this.panel.add([bg]);
  }

  createHeader() {
    const header = this.add.text( 15, 15, "Energy", {
      fontFamily: constants.fonts.troika,
      fontSize: "40px",
      color: "#FFF"
    }).setOrigin(0, 0);

    this.panel.add(header);
  }

  createItem({ x, y, energy, ronen, adjustX = 0, ron, item, selected }) {
    const itemContainer = this.add.container(x, y);
    const radius = 6;
    const bg = this.add.graphics();

    itemContainer.name = "energy-item";

    bg.fillStyle(0x9dfd90, 0.4);
    bg.fillRoundedRect(0, 0, this.buttonWidth, this.buttonHeight, radius);
    itemContainer.add(bg);

    // Top strip with rounded top corners, flat bottom
    const strip = this.add.graphics();
    const stripSize = 74;
    strip.fillStyle(0xCCCCCC, 1);
    strip.fillRoundedRect(this.buttonWidth - stripSize, 0, stripSize, this.buttonHeight, {
      tl: 0, tr: radius, br: radius, bl: 0
    });
    itemContainer.add(strip);

    const labelTxt = this.add.text(this.buttonWidth - 36,  this.buttonHeight / 2, `${ronen}\nRONEN\nor\n${ron}\nRON`, {
      fontSize: "15px",
      align: "center",
      fontFamily: constants.fonts.newsreader,
      color: "#1f4213",
      fontStyle: "bold"
    }).setOrigin(0.5, 0.5);

    itemContainer.add(labelTxt);

    const energyContainer = this.add.container(59 - adjustX, (this.buttonHeight / 2));
    const energyTxt = this.add.text(0, 0, energy, {
      fontFamily: constants.fonts.troika,
      fontSize: "40px",
      color: "#FFF"
    }).setOrigin(1, 0.5);

    energyTxt.setShadow(2, 2, "#222", 4, false, true);
    energyTxt.setDepth(30);
    energyContainer.add(energyTxt);

    const image = this.add.image(35, -1, "energy-icon")
      .setOrigin(1, 0.5);

    energyContainer.add(image);
    itemContainer.add(energyContainer);
    itemContainer.setSize(this.buttonWidth, this.buttonHeight);
    itemContainer.setInteractive(
      new Phaser.Geom.Rectangle(this.buttonWidth / 2, this.buttonHeight / 2, this.buttonWidth, this.buttonHeight),
      Phaser.Geom.Rectangle.Contains
    );
    itemContainer.on("pointerover", () => {
      this.input.manager.canvas.style.cursor = "pointer"; // or custom image: url("assets/cursor.png"), pointer
    });
    itemContainer.on("pointerout", () => {
      this.input.manager.canvas.style.cursor = "default";
    });
    itemContainer.on("pointerdown", () => {
      this.selectedItem = item;

      this.panel.iterate((energyItem) => {
        if (energyItem.name === "energy-item") {
          energyItem.iterate((child) => {
            if (child.name === "border") {
              child.visible = false;
            }
          });
        }
      });
      border.visible = true;
    });

    const border = this.add.graphics();

    border.name = "border";
    border.lineStyle(4, 0x8aff5c);
    border.strokeRoundedRect(0, 0, this.buttonWidth, this.buttonHeight, radius);
    border.visible = selected;
    itemContainer.add(border);

    if (selected) {
      this.selectedItem = item;
    }

    return itemContainer;
  }

  createTokenButton({ x, y, token, label, width, height }) {
    const tokenContainer = this.add.container(x, y);
    const radius = 6;
    const bg = this.add.graphics();

    tokenContainer.name = "token-button";

    bg.fillStyle(0x9dfd90, 0.4);
    bg.fillRoundedRect(0, 0, width, height, radius);
    tokenContainer.add(bg);

    const labelTxt = this.add.text(width / 2, height / 2, label, {
      fontFamily: constants.fonts.troika,
      fontSize: "30px",
      color: "#FFF"
    }).setOrigin(0.5, 0.5);

    labelTxt.setShadow(2, 2, "#222", 4, false, true);
    labelTxt.setDepth(30);
    tokenContainer.add(labelTxt);

    tokenContainer.setSize(width, height);
    tokenContainer.setInteractive(
      new Phaser.Geom.Rectangle(width / 2, height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    tokenContainer.on("pointerover", () => {
      this.input.manager.canvas.style.cursor = "pointer"; // or custom image: url("assets/cursor.png"), pointer
    });
    tokenContainer.on("pointerout", () => {
      this.input.manager.canvas.style.cursor = "default";
    });
    tokenContainer.on("pointerdown", () => {
      let amount = this.selectedItem.ronen.toString();

      if (token === "RON") {
        amount = this.selectedItem.ron.toString();
      }

      window.purchaseEnergy(amount, token)
        .then((result) => {
          if (result?.txHash?.length > 0) {
            this.verifyOverlay.visible = true;
            window.verifyEnergyTx(result?.txHash)
              .then((verifyResult) => {
                this.verifyTxt.setText("Purchase complete. Thank you for supporting us.");
                fetchEnergy(this, this.game.customConfig.gameId)
                  .then(() => {
                    setTimeout(() => {
                      this.tweens.add({
                        targets: this.panel,
                        y: this.scale.height,
                        duration: 500,
                        ease: "Cubic.easeIn",
                        onComplete: () => {
                          this.scene.stop();   // remove SettingsScene
                        }
                      });
                    }, 2000);
                  });
              })
          }
        });
    });

    return tokenContainer;
  }

  createVerifyingOverlay({ startY } = {}) {
    const width = this.windowWidth - 20;
    const height = 310;

    this.verifyOverlay = this.add.container(this.windowWidth / 2 - width / 2, startY)
      .setInteractive();

    const blocker = this.add.zone(this.windowWidth / 2, startY + height / 2, width, height)
      .setInteractive({ useHandCursor: false }) // captures clicks
      .setScrollFactor(0);

    this.verifyOverlay.add(blocker);

    const bg = this.add.graphics();

    bg.fillStyle(0x333333, 1);
    bg.fillRoundedRect(0, 0, width, height, 3);
    this.verifyOverlay.add(bg);

    this.verifyTxt = this.add.text(width / 2, height / 2,
      "Verifying purchase. Please wait...",
      {
        fontSize: "16px",
        fontFamily: constants.fonts.newsreader,
        color: "#ffffff",
        fontWeight: "bold",
        wordWrap: { width: 400, useAdvancedWrap: true }
      }
    ).setOrigin(0.5, 0.5);
    this.verifyOverlay.add(this.verifyTxt);

    this.verifyOverlay.visible = false;

    return this.verifyOverlay;
  }

  create() {
    this.cameras.main.setScroll(0, -this.scale.height);

    // Slide down tween
    this.tweens.add({
      targets: this.cameras.main,
      scrollY: 0,
      duration: 500,
      ease: "Cubic.easeOut"
    });

    this.createTopBg();
    this.createHeader();
    const startX = 16;
    const startY = 75;

    this.panel.add(this.add.text(startX, startY,
      "Purchased energy can be used in any games.",
      {
        fontSize: "16px",
        fontFamily: constants.fonts.newsreader,
        color: "#ffffff",
        fontWeight: "bold",
        wordWrap: { width: 400, useAdvancedWrap: true }
      }
    ));

    const energy = this.registry.get(constants.registry.energy);
    for (let i = 0; i < energy.config.length; i++) {
      const item = energy.config[i];

      this.panel.add(this.createItem({
        x: startX + ((i % 2) * (this.buttonWidth + 10)),
        y: startY + 35 + (Math.floor(i / 2) * (this.buttonHeight + 10)),
        item,
        ...item,
        adjustX: item.energy.toString().length >= 3 ? -8: 0,
        selected: i === 0,
      }));
    }

    const buyWith = this.add.text(startX, startY + 285, 'Buy with:', {
      fontFamily: constants.fonts.troika,
      fontSize: "20px",
      color: "#FFF"
    }).setOrigin(0, 0.5);

    buyWith.setShadow(2, 2, "#222", 4, false, true);
    buyWith.setDepth(30);
    this.panel.add(buyWith);

    this.panel.add(this.createTokenButton({
      x: startX + 100,
      y: startY + 260,
      label: "RONEN",
      token: "RONEN",
      width: 110,
      height: 50
    }))
    this.panel.add(this.createTokenButton({
      x: startX + 220,
      y: startY + 260,
      label: "RON",
      token: "RON",
      width: 110,
      height: 50
    }))

    this.panel.add(createCloseButton({
      scene: this,
      x: this.windowWidth - 44,
      y: 15,
    }));
    this.panel.add(this.createVerifyingOverlay({
      startX,
      startY,
    }));

  }
}
