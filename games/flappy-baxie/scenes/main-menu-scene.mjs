import { assets } from "../constants.mjs";
import {addSettingsIcon} from "../../common/settings.mjs";
import {useEnergy} from "../../common/energies.mjs";
import constants from "../../common/constants.mjs";

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

    this.scene.launch('MainPanelScene');

    document.fonts.load('16px troika').then(() => {
      const center = this.sys.game.config.width / 2;
      const logo = this.add.text(center, 84, 'Flappy Baxie', {
        fontFamily: 'troika',
        fontSize: '42px',
        color: '#dda23e'
      }).setOrigin(0.5, 0);

      logo.setShadow(2, 2, '#000', 4, true, true);

      const selectText = this.add.text(center, 134, 'Select your baxie', {
        fontFamily: 'troika',
        fontSize: '25px',
        color: '#dda23e'
      }).setOrigin(0.5, 0);
      selectText.setShadow(2, 2, '#000', 4, true, true);

      const containerItems = [ selectText];
      const startX = 320;
      const startY = 235;
      const spaceX = 80;
      const spaceY = 90;

      Object.keys(baxies).forEach((key, index) => {
        const row = index < 3 ? 0 : 1;
        const col = row === 0 ? index : index - 3;
        const x = startX + col * spaceX - (row === 1 ? spaceX / 2 : 0);

        const baxie = this.add.image(x, startY + row * spaceY, baxies[key]);

        baxie.setInteractive();
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
              gameId: 'flappy-baxie',
            }).then((result) => {
              if (result.available > 0) {
                this.scene.start('GameScene', {selectedBaxie: baxies[key]});
              }
            })
          }
        });
        containerItems.push(baxie);
      });

      const container = this.add.container(0, 0, containerItems);
      container.setDepth(30);
      container.visible = true;
    });
  }
}