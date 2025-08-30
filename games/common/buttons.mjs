import constants from "./constants.mjs";

export function createButton({
  scene, x, y, width, height, text,
  onPointerDown, image
} = {}) {
  const button = scene.add.container(x, y);

  const bg = scene.add.graphics();

  // Optional: fake inset shadow - smaller, inside shape
  bg.fillStyle(0x718ff0, 1);
  bg.fillRoundedRect(0, 0, width, height / 2, 6);
  bg.fillStyle(0x2d4eb3, 1);
  bg.fillRoundedRect(0, 6, width, height - 6, 6);

  // Draw base background
  bg.fillStyle(0x406fff, 1);
  bg.fillRoundedRect(2, 4, width - 4, height - 8, 6);

  // Draw border
  bg.lineStyle(2, 0x000000);
  bg.strokeRoundedRect(0, 0, width, height, 6);

  if (text) {
    const label = scene.add.text(width / 2, height / 2, text, {
      fontSize: '24px',
      fontFamily: 'troika',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);

    button.add([bg, label]);
  } else {
    button.add([bg, image]);
  }

  button.setSize(width, height);
  button.setInteractive(
    new Phaser.Geom.Rectangle(width / 2, height / 2, width, height),
    Phaser.Geom.Rectangle.Contains
  );
  button.on("pointerover", () => {
    scene.input.manager.canvas.style.cursor = "pointer"; // or custom image: url("assets/cursor.png"), pointer
  });
  button.on("pointerout", () => {
    scene.input.manager.canvas.style.cursor = "default";
  });
  button.on("pointerdown", () => {
    onPointerDown();
  });

  return button;
}

export function createCloseButton({ scene, x, y } = {}) {
  const closeButton = scene.add.container(x, y)
    .setInteractive();
  const width = 32;
  const height = 32;
  const radius = 6;
  const bg = scene.add.graphics();

  bg.fillStyle(0x9dfd90, 0.2);
  bg.fillRoundedRect(0, 0, width, height, radius);
  closeButton.add(bg);

  const labelTxt = scene.add.text(width / 2,  height / 2 + 1, "X", {
    fontSize: "28px",
    fontFamily: constants.fonts.troika,
    color: "#FFF",
    fontStyle: "bold"
  }).setOrigin(0.5, 0.5);

  closeButton.add(labelTxt);

  closeButton.setSize(width, height);
  closeButton.setInteractive(
    new Phaser.Geom.Rectangle(width / 2, height / 2, width, height),
    Phaser.Geom.Rectangle.Contains
  );
  closeButton.on("pointerover", () => {
    scene.input.manager.canvas.style.cursor = "pointer"; // or custom image: url("assets/cursor.png"), pointer
  });
  closeButton.on("pointerout", () => {
    scene.input.manager.canvas.style.cursor = "default";
  });
  closeButton.on("pointerdown", () => {
    scene.tweens.add({
      targets: scene.panel,
      y: scene.scale.height,
      duration: 500,
      ease: "Cubic.easeIn",
      onComplete: () => {
        scene.scene.stop();   // remove SettingsScene
      }
    });
  });

  return closeButton;
}
