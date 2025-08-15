import { assets } from "../constants.mjs";

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

  preload() {
    // Backgrounds
    this.load.image(assets.scene.background.day, '/game-assets/flappy-baxie/images/day.png')
    this.load.image(assets.scene.background.night, '/game-assets/flappy-baxie/images/night.png')

    // baxies
    Object.keys(baxies).forEach((key) => {
      this.load.spritesheet(baxies[key], `/game-assets/flappy-baxie/images/${baxies[key]}.png`, {
        frameWidth: 61,
        frameHeight: 70,
      });
    });
  }

  create() {
    this.backgroundDay = this.add.image(0, 0, assets.scene.background.day).setOrigin(0, 0).setInteractive()

    const center = this.sys.game.config.width / 2;
    const logo = this.add.text(center, 84, 'Flappy Baxie', {
      fontFamily: 'troika',
      fontSize: '42px',
      color: '#f99502'
    }).setOrigin(0.5, 0);

    logo.setShadow(2, 2, '#000', 4, true, true);

    const selectText = this.add.text(center, 134, 'Select your baxie', {
      fontFamily: 'troika',
      fontSize: '20px',
      color: '#fff'
    }).setOrigin(0.5, 0);

    const containerItems = [logo, selectText];
    const startX = 110;
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
  }
}