import * as Phaser from 'phaser';
import BaxieUi from "../../common/baxie/baxie-ui.mjs";
import {createButton} from "../../common/buttons.mjs";
import {GameModes} from "../../common/baxie/baxie-simulation.mjs";
import constants from "../../common/constants.mjs";
import BackgroundRect from "../../common/ui/background-rect.mjs";
import {formatSkillName} from "../../common/utils/baxie.mjs";
import {EFFECTS} from "../../../src/backend/games/baxies/effects.mjs";
import {createEnergyUI, fetchEnergy} from "../../common/energies.mjs";
import {addSettingsIcon} from "../../common/settings.mjs";
import {interactiveBoundsChecker} from "../../common/rotate-utils.mjs";

export default class BreedingScene extends Phaser.Scene {
  enemyTeam;
  playerTeam;
  isPlayerTurn;
  skillContainer;
  status = 'loading';

  constructor() {
    super('BreedingScene');
    this.isPlayerTurn = true;
  }


  init(data) {
  }

  preload() {
    this.load.image("energy-icon", "{{config.cdnLink}}/game-assets/common/images/energy.png");
    this.load.image("settings", "{{config.cdnLink}}/game-assets/common/images/settings.png");
    fetchEnergy(this);

    fetch('/baxies/false')
      .then((res) => res.json())
      .then((results) => {
        this.registry.set(constants.registry.baxies, results);
      });
  }

  createSlot({ x, y, width, height, gender } = {}) {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0);
    container.add(bg);

    const label = this.add.text(75, 20, gender, {
      fontSize: '24px',
      fontFamily: constants.fonts.Newsreader,
      color: '#FFFFFF',
    }).setOrigin(0.5, 0.5);
    container.add(label);

    const sprite = this.add.image(width / 2, height / 2 - 10, `baxie-`)
      .setName('sprite')
      .setOrigin(0.5)
      .setScale(0.1);
    sprite.visible = false;
    container.add(sprite);

    container.setSize(width, height);
    container.setInteractive(
      new Phaser.Geom.Rectangle(width / 2, height / 2, width, height),
      interactiveBoundsChecker,
    );
    container.on("pointerdown", () => {
      this.scene.launch('SelectionScene', {
        showSlot: false,
        filterByGender: gender,
        onSelect: (baxie) => {
          this.femaleBaxie = baxie;

          sprite.setTexture(`baxie-${baxie.tokenId}`);
          sprite.visible = true;
        }
      });
      this.scene.bringToTop('SelectionScene');
    });
  }

  createBreedingResult(x, y, width) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, width, 300, 0x000000, 0.5).setOrigin(0);
    container.add(bg);

    container.add(createButton({
      scene: this,
      x: width / 2 - 100,
      y: 120,
      width: 200,
      height: 50,
      text: 'Start Breeding',
      onPointerDown: async () => {
        if (this.selectedBaxiesId.length === 3) {
          console.log(this.selectedBaxies)
          console.log(this.selectedBaxies
            .filter((baxie, index, self) => index === self.findIndex((b) => b.tokenId === baxie.tokenId)))
          let selectedBaxies = this.selectedBaxies
            .filter((baxie, index, self) => index === self.findIndex((b) => b.tokenId === baxie.tokenId))
            .filter((b) => this.selectedBaxiesId.includes(b.tokenId));
          console.log(selectedBaxies)
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
    }))
  }

  create() {
    this.backgroundDay = this.add
      .image(0, 0, 'bg')
      .setOrigin(0, 0)
      .setInteractive();


    document.fonts.load('16px troika').then(() => {
      addSettingsIcon({
        scene: this,
        width: 32,
      });

      createEnergyUI({
        scene: this,
        x: this.game.scale.width - 100,
        y: 22,
        width: 80,
        height: 40,
        fontSize: "24px",
        textColor: "#000000",
        imageScale: 1.3,
        imageX: 0,
        imageY: 0,
        textX: 44,
        textY: 22
      });

      const padding = 20;
      this.createSlot({
        x: this.game.scale.width / 2 - 150 - 300 - padding,
        y: 100,
        width: 300,
        height: 300,
        gender: 'Male',
      });
      this.createSlot({
        x: this.game.scale.width / 2 + 150 + padding, y: 100,
        width: 300,
        height: 300,
        gender: 'Female'
      });
      this.createBreedingResult(this.game.scale.width / 2 - (300 / 2) , 100, 300);
    });
  }

}
