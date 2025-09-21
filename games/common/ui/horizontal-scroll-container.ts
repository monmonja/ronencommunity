import Phaser from 'phaser';

export class HorizontalScrollContainer extends Phaser.GameObjects.Container {
  private visibleWidth: number;
  private heightValue: number;
  private readonly innerContainer: Phaser.GameObjects.Container;
  private isDragging: boolean = false;
  private startOX: number;
  private innerWidth: number;
  private items: Array<Phaser.GameObjects.Container>;
  private dragStartX: number;
  private dragThreshold: number;
  private maybeClick: boolean;
  private currentPointer: Phaser.Input.Pointer | null | undefined;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    this.scene = scene;
    this.visibleWidth = width;
    this.heightValue = height;
    this.dragStartX = 0;
    this.startOX = 0;
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

    this.innerWidth = 0; // tracks total inner width
    this.items = [];
  }

    private initDraggingEvents(scene:Phaser.Scene, width: number, height: number) {
    // Drag variables
    this.isDragging = false;
    this.dragStartX = 0;
    this.startOX = 0;

    // Enable input on the mask area
    const dragZone = scene.add.zone(0, 0, width, height).setOrigin(0)
      .setInteractive({ useHandCursor: true });
    this.add(dragZone);

    dragZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragStartX = pointer.x;
      this.startOX = this.innerContainer.x;
      this.maybeClick = true;
      // save pointer for later use
      this.currentPointer = pointer;
    });

    dragZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.currentPointer) {
        return;
      }

      const dx = pointer.x - this.dragStartX;

      if (Math.abs(dx) > this.dragThreshold) {
        this.isDragging = true;
        this.maybeClick = false; // cancel click if dragged
      }

      if (this.isDragging) {
        let dx = pointer.x - this.dragStartX;
        let newX = this.startOX + dx;

        // clamp newX so content doesn't go out of bounds
        const minX = Math.min(0, this.visibleWidth - this.innerContainer.width);
        const maxX = 0;
        if (newX < minX) newX = minX;
        if (newX > maxX) newX = maxX;

        this.innerContainer.x = newX;
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

  addItem(item: Phaser.GameObjects.Container, spacing: number = 10) {
    // Position item at the end of innerContainer
    item.x = this.innerWidth;
    item.y = this.heightValue / 2 - item.height / 2;

    this.innerContainer.add(item);

    this.items.push(item);

    this.innerWidth += item.width + spacing;
    this.innerContainer.width = this.innerWidth;
  }
}
