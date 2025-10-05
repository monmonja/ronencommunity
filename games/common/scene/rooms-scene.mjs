import constants from "../constants.mjs";
import {createCloseButton} from "../buttons.mjs";
import {fetchEnergy} from "../energies.mjs";
import {interactiveBoundsChecker} from "../rotate-utils.mjs";


export function createGameRoom({ gameId } = {}) {
  return new Promise((resolve, reject) => {
    fetch(`/game-rooms/create/${gameId}`, {
      headers: {
        "Content-Type": "application/json",
      }
    })
      .then((res) => res.json())
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function createCpuGameRoom({ gameId } = {}) {
  return new Promise((resolve, reject) => {
    fetch(`/game-rooms/create-cpu/${gameId}`, {
      headers: {
        "Content-Type": "application/json",
      }
    })
      .then((res) => res.json())
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function joinGameRoom({ scene, gameId, roomId } = {}) {
  return new Promise((resolve, reject) => {
    fetch(`/game-rooms/join/${gameId}/${roomId}`, {
      headers: {
        "Content-Type": "application/json",
      }
    })
      .then((res) => res.json())
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export default class RoomsScene extends Phaser.Scene {
  windowWidth = 410;
  buttonWidth = 184;
  buttonHeight = 98;
  constructor() {
    super("RoomsScene");
  }

  createTopBg() {
    this.add.container(0, 0);
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, constants.colors.blocker, constants.colors.blockerAlpha)
      .setOrigin(0, 0)
      .setInteractive();

    this.panel = this.add.container((this.scale.width / 2 - this.windowWidth / 2) + (constants.mainMenu.panelWidth / 2), 20);
    const bg = this.add.graphics();

    bg.fillStyle(0x222222, 1);
    bg.fillRoundedRect(0, 0, this.windowWidth, this.scale.height - 40, 4);
    this.panel.add([bg]);
  }

  createHeader() {
    const header = this.add.text( 15, 15, "Energy", {
      fontFamily: constants.fonts.troika,
      fontSize: "40px",
      color: "#FFF"
    }).setOrigin(0, 0);

    this.panel.add(header);
  }


  create() {
    this.cameras.main.setScroll(0, -this.scale.height);

    // Slide down tween
    this.tweens.add({
      targets: this.cameras.main,
      scrollY: 0,
      duration: 500,
      ease: "Cubic.easeOut"
    });
  }
}
