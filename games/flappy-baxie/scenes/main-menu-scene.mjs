import { assets } from "../constants.mjs";
import {addSettingsIcon} from "../../common/utils/settings.mjs";

const baxies = {
  'gronke': 'baxie-gronke',
  'pink': 'baxie-pink',
  'green': 'baxie-green',
  'blue': 'baxie-blue',
  'purple': 'baxie-purple',
  'orange': 'baxie-orange',
  'yellow': 'baxie-yellow',
}

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({key: 'MainMenuScene'});
  }

  create() {
    this.add.image(0, 0, 'bg').setOrigin(0, 0)
      .setInteractive()

    addSettingsIcon(this);

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

        baxie.setInteractive().on('pointerdown', () => {
          this.scene.start('GameScene', { selectedBaxie: baxies[key] });
        });
        containerItems.push(baxie);
      });

      const container = this.add.container(0, 0, containerItems);
      container.setDepth(30);
      container.visible = true;
    });
  }
}