import { assets } from "../constants.mjs";
import {addSettingsIcon} from "../../common/settings.mjs";
import {useEnergy} from "../../common/energies.mjs";
import constants from "../../common/constants.mjs";
import Phaser from "phaser";
import {interactiveBoundsChecker} from "../../common/rotate-utils.mjs";

const baxies = {
  'gronke': 'baxie-gronke',
  'pink': 'baxie-pink',
  'green': 'baxie-green',
  'blue': 'baxie-blue',
  'purple': 'baxie-purple',
  'orange': 'baxie-orange',
  'yellow': 'baxie-yellow',
}

export default class  MainMenuScene extends Phaser.Scene {
  constructor() {
    super({key: 'MainMenuScene'});
  }

  create() {
    this.add.image(0, 0, 'bg').setOrigin(0, 0)
      .setInteractive()

    if (this.scene.isActive('MainPanelScene')) {
      this.game.events.emit('clearMainPanelItem');
    } else {
      this.scene.launch('MainPanelScene');
    }

    document.fonts.load('16px troika').then(() => {
      const logo = this.add.text(0, 84, 'Flappy Baxie', {
        fontFamily: 'troika',
        fontSize: '50px',
        color: '#dda23e'
      }).setOrigin(0.5, 0);

      logo.setShadow(2, 2, '#000', 4, true, true);

      const selectText = this.add.text(0, 140, 'Select your baxie', {
        fontFamily: 'troika',
        fontSize: '30px',
        color: '#dda23e'
      }).setOrigin(0.5, 0);
      selectText.setShadow(2, 2, '#000', 4, true, true);

      const containerItems = [logo, selectText];
      const startX = -90;
      const startY = 255;
      const spaceX = 90;
      const spaceY = 100;

      Object.keys(baxies).forEach((key, index) => {
        const row = index < 3 ? 0 : 1;
        const col = row === 0 ? index : index - 3;
        const x = startX + col * spaceX - (row === 1 ? spaceX / 2 : 0);

        const baxie = this.add.image(x, startY + row * spaceY, baxies[key])
          .setScale(1.2);

        baxie.setData("offsetX", 38);
        baxie.setData("offsetY", 40);
        baxie.setInteractive(
          new Phaser.Geom.Rectangle(0, 0, 75, 82),
          interactiveBoundsChecker,
        );
        baxie.on("pointerover", () => {
          this.input.manager.canvas.style.cursor = "pointer"; // or custom image: url("assets/cursor.png"), pointer
        });
        baxie.on("pointerout", () => {
          this.input.manager.canvas.style.cursor = "default";
        });
        baxie.on('pointerdown', () => {
          const energy = this.registry.get(constants.registry.energy);

          if (energy.available > 0) {
            useEnergy({
              scene: this,
              gameId: this.game.customConfig.gameId,
            }).then((result) => {
              if (result.available > 0) {
                this.scene.start('GameScene', {selectedBaxie: baxies[key]});
              }
            })
          } else {
            this.scene.launch('EnergiesScene');
          }
        });
        containerItems.push(baxie);
      });

      const center = this.scale.width / 2;
      const container = this.add.container(center + (constants.mainMenu.panelWidth / 2), 0, containerItems);

      container.setDepth(30);
      container.visible = true;
    });
  }
}