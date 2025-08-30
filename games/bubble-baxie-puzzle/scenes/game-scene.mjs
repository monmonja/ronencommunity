// Phaser 3 – Puzzle Bobble core gameplay (hex grid)
// Added:
//  - Scoring (pops: +100 each, drops: +50 each)
//  - Proper side-wall bounces, ceiling snap
//  - Robust collision → snap-to-grid
//  - Game over when bubbles cross the loss line (near bottom)
//  - Game over when there are no potential matches left
//
// Usage example:
//   import PuzzleBobbleScene from './PuzzleBobbleScene.js';
//   const game = new Phaser.Game({
//     type: Phaser.AUTO,
//     width: 480,
//     height: 720,
//     backgroundColor: '#0b0f1a',
//     physics: { default: 'arcade' },
//     scene: [new PuzzleBobbleScene({ rows: 7, radius: 16 })]
//   });

export default class GameScene extends Phaser.Scene {
  constructor(options = {}) {
    super('GameScene');
    this.opts = {
      rows: options.rows ?? 3,
      radius: options.radius ?? 20,
      colors: options.colors ?? [0xff5252, 0xffc857, 0x00c2ff, 0x7c4dff, 0x2dd4bf, 0xff7ab6],
      marginTop: options.marginTop ?? 100,
      marginSide: options.marginSide ?? 8,
      marginBottom: options.marginBottom ?? 84,
      speed: options.speed ?? 640,
      aimMin: Phaser.Math.DegToRad(10),
      aimMax: Phaser.Math.DegToRad(170),
    };

    // Grid state
    this.grid = [];
    this.gridRows = 0;
    this.gridColsEven = 0;
    this.gridColsOdd = 0;

    // Shooter + flight
    this.shooter = null;
    this.aimAngle = -Math.PI / 2;
    this.currentBubble = null; // sprite waiting in shooter
    this.movingBubble = null;  // physics sprite flying
    this.queue = [];
    this.nextColor = null;

    // UI/score
    this.score = 0;
    this.ui = {};
    this.gameOver = false;

    this._texturesMadeForRadius = null;
  }

  // -------------------------------------------------------------------------
  init(data) {
    if (data) Object.assign(this.opts, data);
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0b0f1a);
    this._computeGridMetrics();
    this._ensureBubbleTextures(this.opts.radius, this.opts.colors, true);

    this._createGrid(this.opts.rows);
    this._createShooter();
    this._initQueue();
    this._loadNextBubble();
    this._createUI();
    this._setupInput();
  }

  update(_, dtMs) {
    if (this.gameOver) {
      return;
    }

    const dt = dtMs / 1000;
    if (this.movingBubble) {
      this._updateMovingBubble(dt);
    }

    this._updateAiming();
  }

  // -------------------------------------------------------------------------
  // Grid Management
  // -------------------------------------------------------------------------
  _computeGridMetrics() {
    const r = this.opts.radius;
    this.hex = {
      r,
      w: r * 2,
      h: Math.sqrt(3) * r,
      rowStep: Math.sqrt(3) * r,
    };
    this.gridColsEven = this._countCols(false);
    this.gridColsOdd = this._countCols(true);
  }

  _countCols(offset) {
    const { radius, marginSide } = this.opts;
    const startX = marginSide + radius + (offset ? radius : 0);
    const maxX = this.scale.width - marginSide - radius;
    let n = 0;
    for (let x = startX; x <= maxX + 0.5; x += 2 * radius) n++;
    return n;
  }

  _createGrid(rows) {
    this.grid = [];
    this.gridRows = rows;

    for (let row = 0; row < rows; row++) {
      const cols = (row % 2 === 0) ? this.gridColsEven : this.gridColsOdd;
      const arr = new Array(cols).fill(null);
      this.grid.push(arr);
    }

    // Seed first N rows randomly
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < this.grid[row].length; col++) {
        const color = Phaser.Utils.Array.GetRandom(this.opts.colors);
        const { x, y } = this._gridToWorld(row, col);
        const key = this._textureKey(color, this.opts.radius);
        const sprite = this.add.image(x, y, key).setDepth(1);

        this.grid[row][col] = { color, sprite };
      }
    }
  }

  _gridToWorld(row, col) {
    const { marginTop, marginSide, radius } = this.opts;
    const offset = row % 2 === 1;
    const x = marginSide + radius + (offset ? radius : 0) + col * (2 * radius);
    const y = marginTop + row * this.hex.rowStep;

    return { x, y };
  }

  _worldToApproxGrid(x, y) {
    const { marginTop, marginSide, radius } = this.opts;
    const row = Math.round((y - marginTop) / this.hex.rowStep);
    const rClamped = Math.max(0, row);
    const offset = rClamped % 2 === 1;
    const startX = marginSide + radius + (offset ? radius : 0);
    const col = Math.round((x - startX) / (2 * radius));
    return { row: rClamped, col: Math.max(0, col) };
  }

  _nearestFreeCell(x, y) {
    let { row, col } = this._worldToApproxGrid(x, y);
    const candidates = [];
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const rr = row + dr;
        if (rr < 0) {
          continue;
        }

        const cols = (rr % 2 === 0) ? this.gridColsEven : this.gridColsOdd;
        const cc = col + dc;
        if (cc < 0 || cc >= cols) {
          continue;
        }

        if (!this.grid[rr]) {
          this.grid[rr] = new Array(cols).fill(null);
        }

        if (this.grid[rr][cc]) {
          continue;
        }
        const p = this._gridToWorld(rr, cc);
        candidates.push({ rr, cc, x: p.x, y: p.y });
      }
    }

    if (!candidates.length) {
      return null;
    }

    candidates.sort((a, b) => (a.x - x) ** 2 + (a.y - y) ** 2 - ((b.x - x) ** 2 + (b.y - y) ** 2));
    return { row: candidates[0].rr, col: candidates[0].cc };
  }

  _placeBubbleAt(row, col, color) {
    const { x, y } = this._gridToWorld(row, col);
    const key = this._textureKey(color, this.opts.radius);
    const sprite = this.add.image(x, y, key).setDepth(1);
    if (!this.grid[row]) {
      const cols = (row % 2 === 0) ? this.gridColsEven : this.gridColsOdd;
      this.grid[row] = new Array(cols).fill(null);
    }
    this.grid[row][col] = { color, sprite };
    return this.grid[row][col];
  }

  // -------------------------------------------------------------------------
  // Shooter + Queue
  // -------------------------------------------------------------------------
  _createShooter() {
    const x = this.scale.width / 2;
    const y = this.scale.height - this.opts.marginBottom;

    const key = 'shooter';
    if (!this.textures.exists(key)) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x1e293b, 1);
      g.fillRoundedRect(14, 20, 20, 36, 8);
      g.fillStyle(0x94a3b8, 1);
      g.fillTriangle(0, 38, 48, 24, 48, 52);
      g.generateTexture(key, 56, 72);
      g.destroy();
    }

    this.shooter = this.add.image(x, y, key).setDepth(3).setOrigin(0.5, 0.8);
    this.aimGraphics = this.add.graphics({ x: 0, y: 0 }).setDepth(2);

    // Loss line (visual)
    this.lossLineY = y - 16; // if any bubble crosses this → game over
    this.add.line(0, 0, 8, this.lossLineY, this.scale.width - 8, this.lossLineY, 0xff4d4d, 0.15)
      .setOrigin(0, 0)
      .setDepth(0);
  }

  _initQueue() {
    // Bag of colors for decent distribution
    this.queue = Phaser.Utils.Array.Shuffle([
      ...this.opts.colors,
      ...this.opts.colors,
      ...this.opts.colors,
    ]);
  }

  _drawNextPreview() {
    if (this.nextPreview) this.nextPreview.destroy();
    const key = this._textureKey(this.nextColor, Math.max(8, Math.round(this.opts.radius * 0.8)));
    this.nextPreview = this.add.image(this.shooter.x + 48, this.shooter.y + 6, key).setDepth(2);
  }

  _loadNextBubble() {
    if (this.currentBubble) this.currentBubble.destroy();
    if (this.nextColor == null) this.nextColor = this._nextQueueColor();

    const color = this.nextColor;
    this.nextColor = this._nextQueueColor();

    const key = this._textureKey(color, this.opts.radius);
    this.currentBubble = this.add.image(this.shooter.x, this.shooter.y - 18, key).setDepth(2);
    this.currentBubble.setData('color', color);

    this._drawNextPreview();
  }

  _nextQueueColor() {
    if (!this.queue.length) this._initQueue();
    return this.queue.pop();
  }

  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.input.on('pointermove', (p) => this._aimAt(p.worldX, p.worldY));
    this.input.on('pointerdown', () => this._tryShoot());
    this.spaceKey.on('down', () => this._tryShoot());
  }

  _updateAiming() {
    const speed = 3; // rad/s via keyboard
    if (this.cursors.left.isDown) this.aimAngle -= speed * this.game.loop.delta / 1000;
    if (this.cursors.right.isDown) this.aimAngle += speed * this.game.loop.delta / 1000;
    this.aimAngle = Phaser.Math.Clamp(this.aimAngle, this.opts.aimMin, this.opts.aimMax);

    this.shooter.setRotation(this.aimAngle + Math.PI / 2);

    // Aim guide
    this.aimGraphics.clear();
    this.aimGraphics.lineStyle(2, 0x94a3b8, 0.5);
    const sx = this.shooter.x;
    const sy = this.shooter.y - 18;
    const ex = sx + Math.cos(this.aimAngle) * 56;
    const ey = sy + Math.sin(this.aimAngle) * 56;
    this.aimGraphics.strokeLineShape(new Phaser.Geom.Line(sx, sy, ex, ey));
  }

  _aimAt(x, y) {
    const a = Phaser.Math.Angle.Between(this.shooter.x, this.shooter.y - 18, x, y);
    this.aimAngle = Phaser.Math.Clamp(a, this.opts.aimMin, this.opts.aimMax);
  }

  _tryShoot() {
    if (this.gameOver || this.movingBubble || !this.currentBubble) {
      return;
    }

    const vx = Math.cos(this.aimAngle) * this.opts.speed;
    const vy = Math.sin(this.aimAngle) * this.opts.speed;

    const color = this.currentBubble.getData('color');
    const key = this._textureKey(color, this.opts.radius);

    const b = this.physics.add.image(this.currentBubble.x, this.currentBubble.y, key);
    b.setDepth(2);
    b.setCircle(this.opts.radius);
    b.setImmovable(true);
    b.setVelocity(-vx, -vy);
    b.setData('color', color);

    this.currentBubble.destroy();
    this.currentBubble = null;
    this.movingBubble = b;
  }

  // -------------------------------------------------------------------------
  // Flight + Collision + Snap
  // -------------------------------------------------------------------------
  _updateMovingBubble(dt) {
    const r = this.opts.radius;
    const left = this.opts.marginSide + r;
    const right = this.scale.width - this.opts.marginSide - r;
    const ceilingY = this.opts.marginTop + r - 2;

    // Side-wall bounce
    if (this.movingBubble.x <= left && this.movingBubble.body.velocity.x < 0) {
      this.movingBubble.setX(left);
      this.movingBubble.setVelocityX(-this.movingBubble.body.velocity.x);
    }
    if (this.movingBubble.x >= right && this.movingBubble.body.velocity.x > 0) {
      this.movingBubble.setX(right);
      this.movingBubble.setVelocityX(-this.movingBubble.body.velocity.x);
    }

    // Ceiling
    if (this.movingBubble.y <= ceilingY) {
      this._landMovingBubble();
      return;
    }

    // Collision with nearby bubbles
    const approx = this._worldToApproxGrid(this.movingBubble.x, this.movingBubble.y);
    const neighbors = this._gridNeighborsAround(approx.row, approx.col, 2);
    for (const { row, col, cell } of neighbors) {
      if (!cell) continue;
      const p = this._gridToWorld(row, col);
      const dx = p.x - this.movingBubble.x;
      const dy = p.y - this.movingBubble.y;
      const minDist = 2 * r - 2;
      if (dx * dx + dy * dy <= minDist * minDist) {
        this._landMovingBubble();
        return;
      }
    }
  }

  _gridNeighborsAround(row, col, radius = 1) {
    const out = [];
    for (let dr = -radius; dr <= radius; dr++) {
      const rr = row + dr;
      if (rr < 0) continue;
      const cols = (rr % 2 === 0) ? this.gridColsEven : this.gridColsOdd;
      if (!this.grid[rr]) continue;
      for (let dc = -radius; dc <= radius; dc++) {
        const cc = col + dc;
        if (cc < 0 || cc >= cols) continue;
        out.push({ row: rr, col: cc, cell: this.grid[rr][cc] });
      }
    }
    return out;
  }

  _landMovingBubble() {
    const b = this.movingBubble;
    this.movingBubble = null;

    const pos = this._nearestFreeCell(b.x, b.y) || { row: 0, col: 0 };
    const color = b.getData('color');
    b.destroy();

    this._placeBubbleAt(pos.row, pos.col, color);
    this._afterPlacement(pos.row, pos.col);
    this._loadNextBubble();
  }

  // -------------------------------------------------------------------------
  // Matching & Floating & Scoring
  // -------------------------------------------------------------------------
  _afterPlacement(row, col) {
    const cell = this.grid[row]?.[col];
    if (!cell) return;

    const cluster = this._sameColorCluster(row, col, cell.color);
    let popped = 0;
    if (cluster.length >= 3) {
      popped = this._removeCluster(cluster);
      this._addScore(popped * 100);
    }
    const dropped = this._dropFloatingClusters();
    if (dropped > 0) this._addScore(dropped * 50);

    // End conditions
    if (this._bubblesCrossLossLine()) return this._endGame('Bubbles reached the bottom!');
    if (!this._hasPotentialMatch()) return this._endGame('No more moves!');
  }

  _sameColorCluster(startRow, startCol, color) {
    const visited = new Set();
    const stack = [[startRow, startCol]];
    const res = [];

    const keyOf = (r, c) => r + ':' + c;

    while (stack.length) {
      const [r, c] = stack.pop();
      const key = keyOf(r, c);
      if (visited.has(key)) continue;
      visited.add(key);

      const cell = this.grid[r]?.[c];
      if (!cell || cell.color !== color) continue;
      res.push([r, c]);

      for (const [nr, nc] of this._neighbors(r, c)) {
        const ncell = this.grid[nr]?.[nc];
        if (ncell && ncell.color === color) stack.push([nr, nc]);
      }
    }
    return res;
  }

  _neighbors(row, col) {
    const odd = row % 2 === 1;
    const deltas = odd
      ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]
      : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];

    const res = [];
    for (const [dr, dc] of deltas) {
      const rr = row + dr;
      const cols = (rr % 2 === 0) ? this.gridColsEven : this.gridColsOdd;
      const cc = col + dc;
      if (rr >= 0 && this.grid[rr] && cc >= 0 && cc < cols) res.push([rr, cc]);
    }
    return res;
  }

  _removeCluster(cluster) {
    let count = 0;
    for (const [r, c] of cluster) {
      const cell = this.grid[r]?.[c];
      if (!cell) continue;
      cell.sprite.destroy();
      this.grid[r][c] = null;
      count++;
    }
    return count;
  }

  _dropFloatingClusters() {
    // Mark ceiling-connected
    const connected = new Set();
    const keyOf = (r, c) => r + ':' + c;

    const visit = (r, c) => {
      const key = keyOf(r, c);
      if (connected.has(key)) return;
      connected.add(key);
      for (const [nr, nc] of this._neighbors(r, c)) {
        if (this.grid[nr]?.[nc]) visit(nr, nc);
      }
    };

    if (this.grid[0]) {
      for (let c = 0; c < this.grid[0].length; c++) {
        if (this.grid[0][c]) visit(0, c);
      }
    }

    // Drop the rest
    let dropped = 0;
    for (let r = 0; r < this.grid.length; r++) {
      const row = this.grid[r];
      if (!row) continue;
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (!cell) continue;
        const key = keyOf(r, c);
        if (!connected.has(key)) {
          const sprite = cell.sprite;
          this.grid[r][c] = null;
          dropped++;
          this.tweens.add({
            targets: sprite,
            y: sprite.y + 240,
            alpha: 0.15,
            duration: 600,
            ease: 'Cubic.easeIn',
            onComplete: () => sprite.destroy(),
          });
        }
      }
    }
    return dropped;
  }

  _bubblesCrossLossLine() {
    for (let r = 0; r < this.grid.length; r++) {
      const row = this.grid[r];
      if (!row) continue;
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (cell && cell.sprite.y + this.opts.radius >= this.lossLineY) return true;
      }
    }
    return false;
  }

  _hasPotentialMatch() {
    // If there are no bubbles, there are no moves needed (treat as win state elsewhere)
    const presentColors = new Set();
    let anyBubble = false;
    for (let r = 0; r < this.grid.length; r++) {
      const row = this.grid[r];
      if (!row) continue;
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (cell) { presentColors.add(cell.color); anyBubble = true; }
      }
    }
    if (!anyBubble) return true; // nothing to match means you can always shoot

    // Check each empty cell: if placing any present color there makes a cluster >= 3
    for (let r = 0; r < this.grid.length; r++) {
      const row = this.grid[r];
      if (!row) continue;
      for (let c = 0; c < row.length; c++) {
        if (row[c]) continue; // occupied
        for (const color of presentColors) {
          const size = this._clusterSizeHypo(r, c, color);
          if (size >= 3) return true;
        }
      }
    }
    return false;
  }

  _clusterSizeHypo(row, col, color) {
    // BFS as if a bubble of `color` is at (row,col)
    const visited = new Set();
    const stack = [[row, col]];
    const keyOf = (r, c) => r + ':' + c;
    let count = 0;

    while (stack.length) {
      const [r, c] = stack.pop();
      const key = keyOf(r, c);
      if (visited.has(key)) continue;
      visited.add(key);

      const sameColorHere = (r === row && c === col) ? true : (this.grid[r]?.[c]?.color === color);
      if (!sameColorHere) continue;
      count++;
      for (const [nr, nc] of this._neighbors(r, c)) {
        const ncell = this.grid[nr]?.[nc];
        if ((nr === row && nc === col) || (ncell && ncell.color === color)) stack.push([nr, nc]);
      }
    }
    return count;
  }

  // -------------------------------------------------------------------------
  // Score + UI + Endgame
  // -------------------------------------------------------------------------
  _createUI() {
    const style = { fontFamily: 'monospace', fontSize: '14px', color: '#cbd5e1' };
    this.ui.score = this.add.text(8, 8, 'Score: 0', style).setDepth(10);
    this.ui.cols = this.add.text(8, 26, `cols e/o: ${this.gridColsEven}/${this.gridColsOdd}`, style).setDepth(10);
  }

  _addScore(n) {
    this.score += n;
    this.ui.score?.setText('Score: ' + this.score);
  }

  _endGame(msg) {
    this.gameOver = true;
    const w = this.scale.width, h = this.scale.height;
    const panel = this.add.rectangle(w/2, h/2, w * 0.78, 160, 0x000000, 0.6).setDepth(20);
    const txt = this.add.text(w/2, h/2 - 16, 'Game Over', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setDepth(21);
    const reason = this.add.text(w/2, h/2 + 12, msg, { fontFamily: 'monospace', fontSize: '14px', color: '#94a3b8' }).setOrigin(0.5).setDepth(21);

    // Restart hint
    this.input.once('pointerdown', () => {
      this.gameOver = false;
      this.scene.restart();
    });
    this.input.keyboard.once('keydown-SPACE', () => {
      this.gameOver = false;
      this.scene.restart()
    });
  }

  // -------------------------------------------------------------------------
  // Textures
  // -------------------------------------------------------------------------
  _ensureBubbleTextures(radius, colors, force = false) {
    if (!force && this._texturesMadeForRadius === radius) return;
    this._texturesMadeForRadius = radius;
    colors.forEach((color) => {
      const key = this._textureKey(color, radius);
      if (this.textures.exists(key)) this.textures.remove(key);
      this._drawBubbleTexture(key, color, radius);
    });
  }

  _textureKey(color, radius) { return `bubble:${radius}:${color}`; }

  _drawBubbleTexture(key, color, r) {
    const d = r * 2;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(color, 1);
    g.fillCircle(r, r, r - 1);

    g.lineStyle(2, 0x000000, 0.25);
    g.strokeCircle(r, r, r - 1);

    g.lineStyle(2, 0xffffff, 0.12);
    g.strokeCircle(r, r, r - 4);

    g.fillStyle(0xffffff, 0.35);
    g.beginPath();
    g.arc(r - r * 0.35, r - r * 0.35, r * 0.42, Math.PI * 1.15, Math.PI * 1.85, false);
    g.closePath();
    g.fillPath();

    g.fillStyle(0x000000, 0.12);
    g.beginPath();
    g.arc(r, r + r * 0.25, r * 0.9, Math.PI * 0.15, Math.PI * 0.85, false);
    g.closePath();
    g.fillPath();

    g.generateTexture(key, d, d);
    g.destroy();
  }
}
