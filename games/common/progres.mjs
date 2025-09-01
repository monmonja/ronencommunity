import {createButton} from "./buttons.mjs";

export function createProgressBar({ scene, width, height, launchScreen } = {}) {
    // Create graphics for the bar
    const progressBox = scene.add.graphics();
    const progressBar = scene.add.graphics();

    progressBox.fillStyle(0x111, 0.8);
    progressBox.fillRoundedRect((scene.scale.width / 2) - (width / 2), scene.scale.height / 2 + 10, width, height, 6);

    // Listen for load progress
    scene.load.on("progress", (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x9dfd90, 1);
      progressBar.fillRect((scene.scale.width / 2) - (width / 2) + 4, (scene.scale.height / 2) + 14,  (width - 8) * value, height - 8);
    });

    scene.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      scene.scene.stop();
      scene.scene.launch(launchScreen);
    });
}
