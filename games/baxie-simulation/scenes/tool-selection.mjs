import Phaser from 'phaser';
import {createButton, createCircleButton} from "../../common/buttons.mjs";
import InputText from 'phaser3-rex-plugins/plugins/inputtext.js';
import {createGameRoom, joinGameRoom} from "../../common/scene/rooms-scene.mjs";
import { SimpleTextBox } from 'phaser3-rex-plugins/templates/ui/ui-components.js';
import constants from "../../common/constants.mjs";
import {interactiveBoundsChecker} from "../../common/rotate-utils.mjs";
import {addBgMusic} from "../../common/settings.mjs";

export default class ToolSelection extends Phaser.Scene {
  constructor() {
    super('ToolSelection');
  }

  createItem({ x, y, width, height, label, imageKey, onPointerDown, description } = {}) {
    const button = this.add.container(x, y);
    const bg = this.add.graphics();

    // Draw base background
    bg.fillStyle(constants.colors.mainPanelBg, 0.8);
    bg.fillRoundedRect(0, 0, width, height, 6);
    bg.lineStyle(1, constants.colors.mainPanelStoke);
    bg.strokeRoundedRect(0, 0, width, height, 6);
    button.add(bg);

    const labelTxt = this.add.text(width / 2, 30, label, {
      fontSize: '30px',
      fontFamily: 'troika',
      color: '#FFF'
    }).setOrigin(0.5, 0.5);

    button.add(labelTxt);

    const targetWidth = width - 24;
    const targetHeight = 150;
    const image = this.add.image(12, 64, imageKey)
      .setOrigin(0, 0);
    const texture = this.textures.get(imageKey).getSourceImage();
    const iw = texture.width;
    const ih = texture.height;
    const scale = Math.max(targetWidth / iw, targetHeight / ih);
    image.setScale(scale);
    image.setCrop(0, 0, targetWidth / scale, targetHeight / scale);
    button.add(image);

    const descriptionText = this.add.text(12, 240, description, {
      fontSize: '20px',
      fontFamily: constants.fonts.Newsreader,
      color: '#FFF',
      wordWrap: { width: width - 24, useAdvancedWrap: true }
    }).setOrigin(0, 0);
    button.add(descriptionText);

    button.setSize(width, height);
    button.setInteractive(
      new Phaser.Geom.Rectangle(width / 2, height / 2, width, height),
      interactiveBoundsChecker,
    );
    button.on("pointerover", () => {
      this.input.manager.canvas.style.cursor = "pointer";
    });
    button.on("pointerout", () => {
      this.input.manager.canvas.style.cursor = "default";
    });
    button.on("pointerdown", () => {
      onPointerDown();
    });

    return button;
  }


  create() {
    this.world = this.add.container(0, 0);
    addBgMusic(this);

    this.backgroundDay = this.add
      .image(0, 0, 'bg')
      .setOrigin(0, 0)
      .setInteractive();
    this.world.add(this.backgroundDay);

    const panelWidth = 360;
    const panelHeight = 400;

    this.createItem({
      x: (this.game.scale.width / 2) - panelWidth,
      y: (this.game.scale.height / 2) - (panelHeight / 2),
      width: panelWidth,
      height: panelHeight,
      label: 'Game Simulation',
      imageKey: 'game-simulation',
      description: 'This is a simulation of the game that will be release in phase 1, it is based from our understanding of the whitepaper',
      onPointerDown: () => {
        let selectedBaxies = localStorage.getItem('selectedBaxies');

        if (selectedBaxies) {
          try {
            selectedBaxies = JSON.parse(selectedBaxies);
            selectedBaxies = selectedBaxies.slice(0, 3);

            // background task to fetch baxies
            fetch('/list/baxies/false')
              .then((res) => res.json())
              .then((results) => {
                this.registry.set(constants.registry.baxies, results);
              });
            this.scene.start("RoomSelectionScene", {
              selectedBaxies,
            });
          } catch (e) {
            this.scene.start("SyncMenuScene");
          }
        } else {
          this.scene.start("SyncMenuScene");
        }
      }
    });
    this.createItem({
      x: (this.game.scale.width / 2) + 20,
      y: (this.game.scale.height / 2) - (panelHeight / 2),
      width: panelWidth,
      height: panelHeight,
      label: 'Breeding Simulation',
      imageKey: 'under-construction',
      description: 'Breed your baxie and what you can breed. This tool is still in development',
      onPointerDown: () => {
        // this.scene.start("SyncMenuScene");
      }
    });
  }
}