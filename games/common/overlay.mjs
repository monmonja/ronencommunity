export function createOverlay({
  scene, x, y, width, height,
  onPointerDown } = {}) {
  const button = scene.add.container(x, y);

  const bg = scene.add.graphics();

  // Optional: fake inset shadow - smaller, inside shape
  bg.fillStyle(0xab7750, 1);
  bg.fillRoundedRect(0, 0, width, height / 2, 6);
  bg.fillStyle(0x59311a, 1);
  bg.fillRoundedRect(0, 6, width, height - 6, 6);

  // Draw base background
  bg.fillStyle(0x8b4c20, 1);
  bg.fillRoundedRect(2, 4, width - 4, height - 8, 6);

  // Draw border
  bg.lineStyle(3, 0x1d0a07);
  bg.strokeRoundedRect(0, 0, width, height, 6);

  button.setSize(width, height);

  button.removeAll(true);

  button.add([bg]);

  return button;
}
