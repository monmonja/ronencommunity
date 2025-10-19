import {addBgMusic} from "../../common/settings.mjs";
import {fetchEnergy, useEnergy} from "../../common/energies.mjs";
import {createProgressBar} from "../../common/progres.mjs";
import {HorizontalScrollContainer} from "../../common/ui/horizontal-scroll-container.ts";
import constants from "../../common/constants.mjs";

export default class GameModesScene extends Phaser.Scene {
  constructor() {
    super({key: 'GameModesScene'});
  }

  createGameMode(x, y, header) {
    const width = 200;
    const height = this.game.scale.height - 200;
    const container = this.add.container(x, y);
    const border = this.add.rectangle(0, 0, width, height)
      .setOrigin(0)
      .setStrokeStyle(3, 0xAC022F);
    border.setName("border");
    border.visible = false;
    container.add(border);

    const label = this.add.text(width / 2, 20, header, {
      fontSize: "20px",
      fontFamily: constants.fonts.troika,
      color: "#FFF",
      fontStyle: "bold",
    }).setOrigin(0.5, 0);
    label.setShadow(2, 2, "#000", 4, true, true);
    container.add(label);

    return container;
  }

  create() {
    const label = this.add.text(20, 20, `Game Modes`, {
      fontSize: "30px",
      fontFamily: constants.fonts.troika,
      color: "#FFF",
      fontStyle: "bold"
    }).setOrigin(0, 0);
    label.setShadow(2, 2, '#000', 4, true, true);

    this.horizontalScrollContainer = new HorizontalScrollContainer(this, 20, 60, 800, this.game.scale.height - 100);

    this.horizontalScrollContainer.addItem(this.createGameMode(0, 0, 'Adventure'));
    this.add.existing(this.horizontalScrollContainer);
  }
}