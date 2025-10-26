import Phaser from 'phaser';
import {createButton, createCircleButton} from "../../common/buttons.mjs";
import InputText from 'phaser3-rex-plugins/plugins/inputtext.js';
import {createGameRoom, joinGameRoom} from "../../common/scene/rooms-scene.mjs";
import { SimpleTextBox } from 'phaser3-rex-plugins/templates/ui/ui-components.js';
import constants from "../../common/constants.mjs";

export default class SyncMenuScene extends Phaser.Scene {
  constructor() {
    super('SyncMenuScene');
  }

  preload() {
    this.load.image('reference', `{{config.cdnLink}}/game-assets/baxie-simulation/images/1270.png`);

  }

  create() {
    if (!this.game.registry.get('bgMusic')) {
      const bgMusic = this.sound.add('bgm', {
        volume: 0.2,
        loop: true
      });
      bgMusic.play();

      // Store in game registry so all scenes can access it
      this.game.registry.set('bgMusic', bgMusic);
    }

    this.world = this.add.container(0, 0);

    this.backgroundDay = this.add
      .image(0, 0, 'bg')
      .setOrigin(0, 0)
      .setInteractive();
    this.world.add(this.backgroundDay);


    this.add.image(this.scale.width / 2, 210, 'reference').setScale(0.25);

    const btnWidth = 300;

    const labelTxt = this.add.text(this.scale.width / 2,  465, "Syncing. please wait.", {
      fontSize: "32px",
      fontFamily: constants.fonts.troika,
      color: "#FFF",
      fontStyle: "bold"
    }).setOrigin(0.5, 0.5);
    labelTxt.setShadow(2, 2, '#000', 4, true, true);
    labelTxt.visible = false;

    const syncBtn = createButton({
      scene: this,
      x: this.scale.width / 2 - (btnWidth / 2),
      y: 430,
      width: btnWidth,
      height: 80,
      text: 'Sync your baxies',
      onPointerDown: async () => {
        syncBtn.visible = false;
        labelTxt.visible = true;

        fetch('/list/baxies/false')
          .then((res) => res.json())
          .then((results) => {
            this.registry.set(constants.registry.baxies, results);
            this.scene.start('SelectionScene');
          }).catch(() => {
            labelTxt.visible = false;
            syncBtn.visible = true;
          });
      }
    });

  }
}