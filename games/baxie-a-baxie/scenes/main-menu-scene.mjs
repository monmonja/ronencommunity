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

    const gameProfile = this.registry.get(constants.registry.gameProfile);
    let userLevel = gameProfile?.level ?? 0;
    console.log('userLevel', userLevel)
    const locations = [
      { x: 115, y: 240, level: 1, activated: userLevel >= 0},
      { x: 220, y: 295, level: 2, activated: userLevel >= 1},
      { x: 325, y: 355, level: 3, activated: userLevel >= 2},
      { x: 425, y: 408, level: 4, activated: userLevel >= 3},
      { x: 525, y: 442, level: 5, activated: userLevel >= 4},
      { x: 625, y: 452, level: 6, activated: userLevel >= 5},
      { x: 715, y: 432, level: 7, activated: userLevel >= 6},
      { x: 755, y: 352, level: 8, activated: userLevel >= 7},
      { x: 700, y: 282, level: 9, activated: userLevel >= 7},
      { x: 625, y: 232, level: 10, activated: userLevel >= 7},
      { x: 535, y: 192, level: 11, activated: userLevel >= 7},
      { x: 525, y: 120, level: 12, activated: userLevel >= 7},
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

      const btn = createCircleButton({
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

      if (!item.activated) {
        btn.disableInteractive();
      }
    });
  }
}