import Phaser from "phaser";
import {createButton, createCloseButton} from "./buttons.mjs";
import constants from "./constants.mjs";

export function fetchEnergy(scene) {
  return new Promise((resolve, reject) => {
    console.log(scene.game.customConfig)
    fetch(`/energy/get/${scene.game.customConfig.gameId}`, {
      headers: {
        "Content-Type": "application/json",
      }
    })
      .then((res) => res.json())
      .then((result) => {
        console.log('----------', JSON.stringify(result), result.config)
        scene.registry.set(constants.registry.energy, result);
        scene.game.events.emit(constants.events.energyChanged, result);
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
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
  const container = scene.add.container(x, y)
    .setSize(width, height)
    .setInteractive(
      new Phaser.Geom.Rectangle(width / 2, height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
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
  console.log('energy', energy)
  const energyTxt = scene.add.text(49, 18, energy.available, {
    fontSize: "16px",
    fontFamily: constants.fonts.newsreader,
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

