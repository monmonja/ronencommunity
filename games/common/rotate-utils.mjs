export function isCanvasRotated() {
  const canvasBounds = document.querySelector("#game-content canvas").getBoundingClientRect();
  return document.body.classList.contains("fullscreen") && canvasBounds.height > canvasBounds.width;
}

export function getRotatedCoordinate(scene, x, y) {
  if (isCanvasRotated()) {
    const canvas = scene.game.canvas;
    const percentX = (x / canvas.width);
    const percentY = 1 - (y / canvas.height);
    return {
      x: percentY * canvas.width,
      y: percentX * canvas.height,
    }
  } else {
    return {
      x, y
    }
  }
}
export function interactiveBoundsChecker(hitArea,x,y, gameObject) {
  if (isCanvasRotated()) {
    const originX = gameObject instanceof Phaser.GameObjects.Text ? gameObject.originX: 0;
    const originY = gameObject instanceof Phaser.GameObjects.Text ? gameObject.originY: 0;
    const offsetX = gameObject.getData("offsetX") ?? 0;
    const offsetY = gameObject.getData("offsetY") ?? 0;

    let rotatedBounds = new Phaser.Geom.Rectangle(
      gameObject.getWorldTransformMatrix().tx - (originX * hitArea.width) - offsetX,
      gameObject.getWorldTransformMatrix().ty - (originY * hitArea.height) - offsetY,
      hitArea.width,
      hitArea.height,
    );

    if (!gameObject.drawn && "{{config.isProd}}" === "false") {
      gameObject.drawn = true;
      let debug = gameObject.scene.add.graphics();
      debug.fillStyle(0x000000, 0.3);
      debug.fillRoundedRect(rotatedBounds.x, rotatedBounds.y, rotatedBounds.width, rotatedBounds.height, 6);
    }

    const pointer = gameObject.scene.input.activePointer;
    const canvas = gameObject.scene.game.canvas;
    const percentX = (pointer.x / canvas.width);
    const percentY = 1 - (pointer.y / canvas.height);

    return Phaser.Geom.Rectangle.Contains(rotatedBounds, percentY * canvas.width, percentX * canvas.height);
  } else {
    // if (!gameObject.drawn && "{{config.isProd}}" === "false") {
    //   gameObject.drawn = true;
    //   let debug = gameObject.scene.add.graphics();
    //   debug.fillStyle(0x000000, 0.3);
    //   debug.fillRoundedRect(x, y, hitArea.width, hitArea.height, 6);
    // }

    return Phaser.Geom.Rectangle.Contains(hitArea, x, y);
  }

}
