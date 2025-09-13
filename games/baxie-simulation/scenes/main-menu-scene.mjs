import Phaser from 'phaser';
import {createButton, createCircleButton} from "../../common/buttons.mjs";
import constants from "../../common/constants.mjs";
import {useEnergy} from "../../common/energies.mjs";
import commonConstant from "../../common/constants.mjs";

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    this.world = this.add.container(0, 0);

    this.backgroundDay = this.add
      .image(0, 0, 'level-bg')
      .setOrigin(0, 0)
      .setInteractive();
    this.world.add(this.backgroundDay);

    this.scene.launch('MainPanelScene');

    const locations = [
      { x: 115, y: 240, level: 1, activated: true},
      { x: 220, y: 295, level: 2, activated: false},
      { x: 325, y: 355, level: 3, activated: false},
    ]

    locations.forEach((item) => {
      let colors = {};

      if (!item.activated) {
        colors = {
          topHighlightColor: 0x666666,
          innerBaseColor: 0x999999,
          borderColor: 0x444444,
        }
      }

      createCircleButton({
        scene: this,
        x: item.x,
        y: item.y,
        radius: 30,
        text: item.level,
        ...colors,
        onPointerDown: () => {
          const energy = this.registry.get(constants.registry.energy);

          if (energy.available > 0) {
            useEnergy({
              scene: this,
              gameId: this.game.customConfig.gameId,
            }).then((result) => {
              if (result.available > 0) {
                this.scene.start('GameScene', {
                  level: item.level - 1
                });
                this.scene.start('UIScene');
                this.scene.stop(commonConstant.scenes.mainPanel);
              }
            })
          } else {
            this.scene.launch('EnergiesScene');
          }
        }
      });
    });
  }
}