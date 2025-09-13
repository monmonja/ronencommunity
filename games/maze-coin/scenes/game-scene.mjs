import 'phaser';
import { LEVELS } from '../levels.mjs';
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.spawnPoints = [];
    this.currentLevelIndex = 0;
    this.TILE_SIZE = 32;
    this.isPlayerPoweredUp = false;
    this.dpadState = {
      up: false,
      down: false,
      left: false,
      right: false
    };
    this.isMoving = false;
  }
  init(data) {
    this.currentLevelIndex = data.levelIndex || 0;
  }
  create() {
    this.isMoving = false;
    this.isPlayerPoweredUp = false;
    this.spawnPoints = [];
    const levelConfig = LEVELS[this.currentLevelIndex];
    this.createMap(levelConfig);
    this.createPlayer(levelConfig);
    this.createEnemies(levelConfig);
    this.setupCollisions();
    this.cursors = this.input.keyboard.createCursorKeys();
    const mapWidth = this.map.widthInPixels;
    const mapHeight = this.map.heightInPixels;
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    // Center the map on the screen
    const offsetX = (this.cameras.main.width - mapWidth) / 2;
    const offsetY = (this.cameras.main.height - mapHeight) / 2;
    this.cameras.main.setPosition(offsetX, offsetY);
    this.events.emit('updateScore', { score: 0, text: '' });
    this.listenForDpad();
  }
  listenForDpad() {
    const dpadScene = this.scene.get('DPadScene');
    dpadScene.events.on('dpad_down', (direction) => {
      this.dpadState[direction] = true;
    });
    dpadScene.events.on('dpad_up', (direction) => {
      this.dpadState[direction] = false;
    });
  }
  update() {
    if (!this.isMoving) {
      let direction = null;
      if (this.cursors.up.isDown || this.dpadState.up) {
        direction = 'up';
      }
      else if (this.cursors.down.isDown || this.dpadState.down) {
        direction = 'down';
      }
      else if (this.cursors.left.isDown || this.dpadState.left) {
        direction = 'left';
      }
      else if (this.cursors.right.isDown || this.dpadState.right) {
        direction = 'right';
      }
      if (direction) {
        this.movePlayer(direction);
      }
    }
    this.updateEnemies();
  }
  createMap(levelConfig) {
    // Convert string layout to tile index data for the tilemap, handling walls separately
    const tileData = levelConfig.layout.map(row => row.split('').map(char => (char === '#' ? -1 : -1)));
    this.map = this.make.tilemap({ data: tileData, tileWidth: this.TILE_SIZE, tileHeight: this.TILE_SIZE });
    // Create textures for map elements if they don't exist
    if (!this.textures.exists('wall_pixel')) {
      const wallGraphics = this.make.graphics();
      wallGraphics.fillStyle(0x00ffff, 1);
      wallGraphics.fillRect(0, 0, 1, 1);
      wallGraphics.generateTexture('wall_pixel', 1, 1);
      wallGraphics.destroy();
    }
    if (!this.textures.exists('fence')) {
      const fenceGraphics = this.make.graphics();
      fenceGraphics.fillStyle(0x008888, 1);
      fenceGraphics.fillRect(0, 0, this.TILE_SIZE, this.TILE_SIZE);
      fenceGraphics.generateTexture('fence', this.TILE_SIZE, this.TILE_SIZE);
      fenceGraphics.destroy();
    }
    if (!this.textures.exists('gate')) {
      const gateGraphics = this.make.graphics();
      gateGraphics.fillStyle(0xff00ff, 1);
      gateGraphics.fillRect(4, this.TILE_SIZE / 2 - 2, this.TILE_SIZE - 8, 4);
      gateGraphics.generateTexture('gate', this.TILE_SIZE, this.TILE_SIZE);
      gateGraphics.destroy();
    }
    this.walls = this.physics.add.staticGroup();
    const WALL_THICKNESS = 6;
    const layout = levelConfig.layout;
    layout.forEach((row, y) => {
      row.split('').forEach((char, x) => {
        if (char !== '#')
          return;
        const tileX = x * this.TILE_SIZE;
        const tileY = y * this.TILE_SIZE;
        const centerX = tileX + this.TILE_SIZE / 2;
        const centerY = tileY + this.TILE_SIZE / 2;
        const hasNeighbor = {
          up: y > 0 && layout[y - 1][x] === '#',
          down: y < layout.length - 1 && layout[y + 1][x] === '#',
          left: x > 0 && layout[y][x - 1] === '#',
          right: x < row.length - 1 && layout[y][x + 1] === '#'
        };
        const connections = Object.values(hasNeighbor).filter(Boolean).length;
        if (connections > 1 || connections === 0) {
          this.walls.create(centerX, centerY, 'wall_pixel')
            .setDisplaySize(WALL_THICKNESS, WALL_THICKNESS)
            .refreshBody();
        }
        if (hasNeighbor.up) {
          this.walls.create(centerX, tileY + this.TILE_SIZE / 4, 'wall_pixel')
            .setDisplaySize(WALL_THICKNESS, this.TILE_SIZE / 2)
            .refreshBody();
        }
        if (hasNeighbor.down) {
          this.walls.create(centerX, tileY + (this.TILE_SIZE * 3 / 4), 'wall_pixel')
            .setDisplaySize(WALL_THICKNESS, this.TILE_SIZE / 2)
            .refreshBody();
        }
        if (hasNeighbor.left) {
          this.walls.create(tileX + this.TILE_SIZE / 4, centerY, 'wall_pixel')
            .setDisplaySize(this.TILE_SIZE / 2, WALL_THICKNESS)
            .refreshBody();
        }
        if (hasNeighbor.right) {
          this.walls.create(tileX + (this.TILE_SIZE * 3 / 4), centerY, 'wall_pixel')
            .setDisplaySize(this.TILE_SIZE / 2, WALL_THICKNESS)
            .refreshBody();
        }
      });
    });
    this.dots = this.physics.add.group();
    this.powerUps = this.physics.add.group();
    this.fences = this.physics.add.staticGroup();
    this.gates = this.physics.add.staticGroup();
    if (!this.textures.exists('dot')) {
      const dotGraphics = this.make.graphics();
      dotGraphics.fillStyle(0xffff00, 1);
      dotGraphics.fillCircle(this.TILE_SIZE / 2, this.TILE_SIZE / 2, 4);
      dotGraphics.generateTexture('dot', this.TILE_SIZE, this.TILE_SIZE);
      dotGraphics.destroy();
    }
    if (!this.textures.exists('fruit')) {
      const fruitGraphics = this.make.graphics();
      fruitGraphics.fillStyle(0xff00ff, 1);
      fruitGraphics.fillCircle(this.TILE_SIZE / 2, this.TILE_SIZE / 2, 10);
      fruitGraphics.generateTexture('fruit', this.TILE_SIZE, this.TILE_SIZE);
      fruitGraphics.destroy();
    }
    levelConfig.layout.forEach((row, y) => {
      row.split('').forEach((char, x) => {
        const tileX = x * this.TILE_SIZE + this.TILE_SIZE / 2;
        const tileY = y * this.TILE_SIZE + this.TILE_SIZE / 2;
        if (char === '.') {
          const dot = this.dots.create(tileX, tileY, 'dot');
          dot.body.setSize(8, 8);
        }
        else if (char === 'F') {
          this.powerUps.create(tileX, tileY, 'fruit');
        }
        else if (char === 'H') {
          this.fences.create(tileX, tileY, 'fence');
        }
        else if (char === '-') {
          this.gates.create(tileX, tileY, 'gate');
        }
        else if (char === 'S') {
          this.spawnPoints.push(new Phaser.Math.Vector2(tileX, tileY));
        }
      });
    });
  }
  getTilePosition(char, layout) {
    for (let y = 0; y < layout.length; y++) {
      for (let x = 0; x < layout[y].length; x++) {
        if (layout[y][x] === char) {
          return new Phaser.Math.Vector2(x * this.TILE_SIZE + this.TILE_SIZE / 2, y * this.TILE_SIZE + this.TILE_SIZE / 2);
        }
      }
    }
    return null;
  }
  createPlayer(levelConfig) {
    const playerPos = this.getTilePosition('P', levelConfig.layout);
    if (!playerPos) {
      console.error("Player start position 'P' not found in level layout.");
      return;
    }
    this.player = this.physics.add.sprite(playerPos.x, playerPos.y, 'player_down');
    this.player.body.setSize(this.TILE_SIZE * 0.8, this.TILE_SIZE * 0.8);
  }
  createEnemies(levelConfig) {
    this.enemies = this.physics.add.group();
    this.spawnPoints.forEach((pos, index) => {
      const enemyConfig = levelConfig.enemies[index % levelConfig.enemies.length];
      const enemy = this.enemies.create(pos.x, pos.y, `enemy_${this.currentLevelIndex}_${index % levelConfig.enemies.length}`);
      enemy.setCollideWorldBounds(true);
      enemy.setScale(enemyConfig.scaleX, enemyConfig.scaleY);
      enemy.setData('speed', enemyConfig.speed);
      enemy.setData('startX', pos.x);
      enemy.setData('startY', pos.y);
      enemy.body.setSize(this.TILE_SIZE * 0.8, this.TILE_SIZE * 0.8);
    });
  }
  setupCollisions() {
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.enemies, this.fences);
    // Enemies do NOT collide with gates
    this.physics.add.overlap(this.player, this.dots, this.collectDot, undefined, this);
    this.physics.add.overlap(this.player, this.powerUps, this.collectPowerUp, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, undefined, this);
  }
  movePlayer(direction) {
    const currentTileX = Math.floor(this.player.x / this.TILE_SIZE);
    const currentTileY = Math.floor(this.player.y / this.TILE_SIZE);
    let targetTileX = currentTileX;
    let targetTileY = currentTileY;
    let textureKey;
    switch (direction) {
      case 'up':
        targetTileY--;
        textureKey = 'player_up';
        break;
      case 'down':
        targetTileY++;
        textureKey = 'player_down';
        break;
      case 'left':
        targetTileX--;
        textureKey = 'player_left';
        break;
      case 'right':
        targetTileX++;
        textureKey = 'player_right';
        break;
      default:
        return;
    }
    const levelLayout = LEVELS[this.currentLevelIndex].layout;
    if (targetTileY < 0 || targetTileY >= levelLayout.length ||
      targetTileX < 0 || targetTileX >= levelLayout[targetTileY].length) {
      return; // Out of bounds
    }
    const targetTileChar = levelLayout[targetTileY][targetTileX];
    // Check for collidable tiles
    if (targetTileChar === '#' || targetTileChar === 'H' || targetTileChar === '-') {
      return;
    }
    this.player.setTexture(textureKey);
    this.isMoving = true;
    const targetX = targetTileX * this.TILE_SIZE + this.TILE_SIZE / 2;
    const targetY = targetTileY * this.TILE_SIZE + this.TILE_SIZE / 2;
    this.tweens.add({
      targets: this.player,
      x: targetX,
      y: targetY,
      duration: 200,
      ease: 'Linear',
      onComplete: () => {
        this.isMoving = false;
      }
    });
  }
  updateEnemies() {
    this.enemies.children.each((enemy) => {
      const enemySprite = enemy;
      if (!enemySprite.body.enable)
        return true;
      const speed = enemySprite.getData('speed');
      const dx = this.player.x - enemySprite.x;
      const dy = this.player.y - enemySprite.y;
      const angle = Math.atan2(dy, dx);
      if (this.isPlayerPoweredUp) {
        // Flee from player
        enemySprite.setVelocity(Math.cos(angle) * -speed * 0.75, Math.sin(angle) * -speed * 0.75);
        enemySprite.setTint(0x00aaff);
      }
      else {
        // Chase player
        enemySprite.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        enemySprite.clearTint();
      }
      return true;
    });
  }
  collectDot(player, dot) {
    dot.disableBody(true, true);
    this.events.emit('addScore', 10);
    if (this.dots.countActive(true) === 0) {
      this.levelComplete();
    }
  }
  collectPowerUp(player, powerUp) {
    powerUp.disableBody(true, true);
    this.events.emit('addScore', 50);
    this.isPlayerPoweredUp = true;
    this.player.setTint(0xff00ff);
    this.time.delayedCall(10000, () => {
      this.isPlayerPoweredUp = false;
      this.player.clearTint();
    }, [], this);
  }
  hitEnemy(player, enemy) {
    const enemySprite = enemy;
    if (this.isPlayerPoweredUp) {
      this.events.emit('addScore', 200);
      const startX = enemySprite.getData('startX');
      const startY = enemySprite.getData('startY');
      enemySprite.body.enable = false;
      enemySprite.setVisible(false);
      this.tweens.add({
        targets: enemySprite,
        x: startX,
        y: startY,
        duration: 1000,
        ease: 'Power2',
        onStart: () => {
          enemySprite.setAlpha(0.5);
          enemySprite.setVisible(true);
        },
        onComplete: () => {
          enemySprite.setAlpha(1);
          enemySprite.body.enable = true;
          enemySprite.setVelocity(0, 0);
        }
      });
    }
    else {
      this.gameOver();
    }
  }
  levelComplete() {
    this.events.emit('updateScore', { text: 'Level Complete!' });
    this.physics.pause();
    this.player.setTint(0x00ff00);
    this.time.delayedCall(2000, () => {
      this.scene.restart({ levelIndex: (this.currentLevelIndex + 1) % LEVELS.length });
    });
  }
  gameOver() {
    this.events.emit('updateScore', { text: 'Game Over' });
    this.physics.pause();
    this.player.setTint(0xff0000);
    this.time.delayedCall(2000, () => {
      this.scene.stop('UIScene');
      this.scene.stop('DPadScene');
      this.scene.start('MenuScene');
    });
  }
}
