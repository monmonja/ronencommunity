export function createButton({ scene, x, y, width, height, text, onPointerDown } = {}) {
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

  const label = scene.add.text(width / 2, height / 2, text, {
    fontSize: '24px',
    fontFamily: 'troika',
    color: '#ffffff'
  }).setOrigin(0.5, 0.5);

  button.add([bg, label]);

  button.setSize(width, height);
  button.setInteractive(
    new Phaser.Geom.Rectangle(width / 2, height / 2, width, height),
    Phaser.Geom.Rectangle.Contains
  );
  button.on('pointerdown', () => {
    onPointerDown();
  });

  return button;
}
