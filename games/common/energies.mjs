import Phaser from "phaser";
import constants from "./constants.mjs";
import {interactiveBoundsChecker} from "./rotate-utils.mjs";
import FetchUrl from "./utils/fetch-url.mjs";

export function fetchEnergy(scene) {
  scene.load.addFile(new FetchUrl(scene.load, 'energies', `/energy/get/${scene.game.customConfig.gameId}`, (energies) => {
    scene.registry.set(constants.registry.energy, energies);
    scene.game.events.emit(constants.events.energyChanged, energies);
  }));
}

export function useEnergy({ scene, gameId } = {}) {
  return new Promise((resolve, reject) => {
    fetch(`/energy/use/${gameId}`, {
      headers: {
        "Content-Type": "application/json",
      }
    })
      .then((res) => res.json())
      .then((result) => {
        scene.registry.set(constants.registry.energy, result);
        scene.game.events.emit(constants.events.energyChanged, result);
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function createEnergyUI({ scene, x, y, width } = {}) {
  const height = 33;
  let drawn = false;
  const container = scene.add.container(x, y)
    .setSize(width, height)
    .setName('Energy Container')
    .setInteractive(
      new Phaser.Geom.Rectangle(width / 2, height / 2, width, height),
      interactiveBoundsChecker,
    );
  container.on("pointerover", () => {
    scene.input.manager.canvas.style.cursor = "pointer"; // or custom image: url("assets/cursor.png"), pointer
  });
  container.on("pointerout", () => {
    scene.input.manager.canvas.style.cursor = "default";
  });
  container.on("pointerdown", () => {
    scene.scene.launch("EnergiesScene");
    scene.scene.bringToTop("EnergiesScene");
  });

  const bg = scene.add.graphics();

  bg.fillStyle(0x9dfd90, 0.3);
  bg.fillRoundedRect(10, 1, width - 10, 31, 6);
  container.add(bg);

  const energy = scene.registry.get(constants.registry.energy);

  const energyTxt = scene.add.text(49, 18, energy.available, {
    fontSize: "16px",
    fontFamily: constants.fonts.pressStart2P,
    color: "#ffffff",
    fontWeight: "bold"
  }).setOrigin(0.5, 0.5);

  container.add(energyTxt);

  const image = scene.add.image(18, 0, "energy-icon")
    .setOrigin(0.5, 0);

  container.add(image);

  scene.game.events.on(constants.events.energyChanged, (energy) => {
    if (energyTxt && energyTxt.scene) {
      energyTxt.setText(energy.available);
    }
  });
}

