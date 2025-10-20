import Phaser from 'phaser';

export class VerticalScrollContainer extends Phaser.GameObjects.Container {
  private visibleHeight: number;
  private widthValue: number;
  private readonly innerContainer: Phaser.GameObjects.Container;
  private isDragging: boolean = false;
  private startOY: number;
  private innerHeight: number;
  private items: Array<Phaser.GameObjects.Container>;
  private dragStartY: number;
  private dragThreshold: number;
  private maybeClick: boolean;
  private currentPointer: Phaser.Input.Pointer | null | undefined;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    this.scene = scene;
    this.visibleHeight = height;
    this.widthValue = width;
    this.dragStartY = 0;
    this.startOY = 0;
    this.dragThreshold = 10; // pixels
    this.maybeClick = false;

    this.innerContainer = scene.add.container(0, 0); // holds all items
    this.add(this.innerContainer);

    scene.events.once('postupdate', () => {
      const matrix = this.getWorldTransformMatrix();
      const worldX = matrix.tx;
      const worldY = matrix.ty;

      // Now you can create a mask at the global position
      const maskShape = scene.add.graphics();
      maskShape.fillStyle(0xffffff);
      maskShape.fillRect(worldX, worldY, width, height);
      maskShape.setVisible(false)

      const mask = maskShape.createGeometryMask();
      this.innerContainer.setMask(mask);
    });

    this.initDraggingEvents(scene, width, height);

    this.innerHeight = 0; // tracks total inner width
    this.items = [];
  }

    private initDraggingEvents(scene:Phaser.Scene, width: number, height: number) {
    // Drag variables
    this.isDragging = false;
    this.dragStartY = 0;
    this.startOY = 0;

    // Enable input on the mask area
    const dragZone = scene.add.zone(0, 0, width, height).setOrigin(0)
      .setInteractive({ useHandCursor: true });
    this.add(dragZone);

    dragZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragStartY = pointer.y;
      this.startOY = this.innerContainer.y;
      this.maybeClick = true;
      // save pointer for later use
      this.currentPointer = pointer;
    });

    dragZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.currentPointer) {
        return;
      }

      const dy = pointer.y - this.dragStartY;

      if (Math.abs(dy) > this.dragThreshold) {
        this.isDragging = true;
        this.maybeClick = false; // cancel click if dragged
      }

      if (this.isDragging) {
        let dy = pointer.y - this.dragStartY;
        let newY = this.startOY + dy;

        // clamp newX so content doesn't go out of bounds
        const minY = Math.min(0, this.visibleHeight - this.innerContainer.height);
        const maxY = 0;
        if (newY < minY) newY = minY;
        if (newY > maxY) newY = maxY;

        this.innerContainer.y = newY;
      }
    });

    dragZone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.maybeClick) {
        // Iterate over children to see if pointer is inside any of them
        for (const child of this.innerContainer.list) {
          // Only consider children that are interactive and visible
          if ('getBounds' in child && child.input && child.input.enabled) {
            const bounds = (child as Phaser.GameObjects.GameObject & {
              getBounds(): Phaser.Geom.Rectangle
            }).getBounds();

            if (bounds.contains(pointer.worldX, pointer.worldY)) {
              child.emit('pointerdown', pointer);
              this.isDragging = false;
              this.maybeClick = false;

              this.currentPointer = null;
              return;
            }
          }
        }
      }

      this.isDragging = false;
      this.maybeClick = false;
      this.currentPointer = null;
    });

    dragZone.on('pointerout', () => {
      this.isDragging = false;
      this.maybeClick = false;
      this.currentPointer = null;
    });
  }

  addItem(item: Phaser.GameObjects.Container, spacing: number = 10, x: number|null) {
    // Position item at the end of innerContainer
    item.y = this.innerHeight;
    item.x = x ?? this.widthValue / 2 - item.width / 2;

    this.innerContainer.add(item);

    this.items.push(item);

    this.innerHeight += item.height + spacing;
    this.innerContainer.height = this.innerHeight;
  }

  prependItem(item: Phaser.GameObjects.Container, spacing: number = 10, x: number | null) {
    // Position item at the TOP
    item.y = 0;
    item.x = x ?? this.widthValue / 2 - item.width / 2;

    // Shift all existing items down
    for (const existing of this.items) {
      existing.y += item.height + spacing;
    }

    // Add to container visually
    this.innerContainer.addAt(item, 0); // put at the top of the display list
    this.items.unshift(item);

    // Update inner height
    this.innerHeight += item.height + spacing;
    this.innerContainer.height = this.innerHeight;
  }
}
