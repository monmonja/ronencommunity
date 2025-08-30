import Phaser from 'phaser';
import {assets} from "../../flappy-baxie/constants.mjs";
import {createButton} from "../../common/buttons.mjs";
import {addBgMusic, addSettingsIcon} from "../../common/settings.mjs";
import constants from "../../common/constants.mjs";
import {useEnergy} from "../../common/energies.mjs";

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    this.backgroundDay = this.add
      .image(0, 0, 'bg')
      .setOrigin(0, 0)
      .setInteractive();

    this.scene.launch('MainPanelScene');

    document.fonts.load('16px troika').then(() => {
      const match = this.add.text(this.sys.game.config.width / 2, 100, 'Match', {
        fontSize: '90px',
        fontFamily: 'troika',
        color: '#2f8011',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);
      match.setStroke('#112704', 3);
      match.setShadow(2, 2, '#222', 4, false, true);

      const threeBaxies = this.add.text(this.sys.game.config.width / 2, 160, '3 BAXIES', {
        fontSize: '50px',
        fontFamily: 'troika',
        color: '#2f8011',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);

      threeBaxies.setStroke('#112704', 3);

      // createButton({
      //   scene: this,
      //   x: this.sys.game.config.width / 2 - (160 / 2),
      //   y: 230,
      //   width: 160,
      //   height: 50,
      //   text: "Campaign",
      //   onPointerDown: () => {
      //     this.scene.start('ScoreGameScene');
      //   }
      // })

      createButton({
        scene: this,
        x: this.sys.game.config.width / 2 - (160 / 2),
        y: 250,
        // y: 290,
        width: 160,
        height: 50,
        text: "Score based",
        onPointerDown: () => {
          const energy = this.registry.get(constants.registry.energy);

          if (energy.available > 0) {
            useEnergy({
              scene: this,
              gameId: this.game.customConfig.gameId,
            }).then((result) => {
              if (result.available > 0) {
                this.scene.start('ScoreGameScene');
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