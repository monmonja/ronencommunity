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

  const startBtn = createButton({
    scene,
    x: (scene.scale.width / 2) - (width / 2) + 33,
    y: (scene.scale.height / 2) + 44,
    width: 160,
    height: 50,
    text: 'Start Game',
    onPointerDown: () => {
      const isFullscreen = localStorage.getItem("fullscreen-mode") ?? 'true';

      if (isFullscreen === "true") {
        scene.scale.startFullscreen();
        document.body.classList.add("fullscreen");
      }

      progressBar.destroy();
      progressBox.destroy();
      scene.scene.stop();
      scene.scene.launch(launchScreen);
    }
  });
  startBtn.visible = false;

  scene.load.on("complete", () => {
    startBtn.visible = true;
  });

  scene.scale.on("leavefullscreen", () => {
    document.body.classList.remove("fullscreen");
  });
}
