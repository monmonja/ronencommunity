import Phaser from 'phaser';
import {assets} from "../../flappy-baxie/constants.mjs";
import {createButton} from "../utils/buttons.mjs";

export const levels = [
  {
    maxScore: 300,
    baxieKeys: ['gronke', 'pink', 'green'],
    cellSize: 70,
    offsetY: 170,
    imageScale: 0.8,
    columns: 4,
    rows: 4,
  },
  {
    maxScore: 600,
    baxieKeys: ['gronke', 'pink', 'green'],
    cellSize: 70,
    imageScale: 0.8,
    offsetY: 130,
    columns: 4,
    rows: 5,
  },
  {
    maxScore: 1000,
    baxieKeys: ['gronke', 'pink', 'green', 'blue'],
    cellSize: 70,
    imageScale: 0.8,
    offsetY: 130,
    columns: 4,
    rows: 5,
  },
  {
    maxScore: 1500,
    baxieKeys: ['gronke', 'pink', 'green', 'blue'],
    cellSize: 70,
    imageScale: 0.8,
    offsetY: 130,
    columns: 5,
    rows: 5,
  },
  {
    maxScore: 2000,
    baxieKeys: ['gronke', 'pink', 'green', 'blue', 'purple'],
    cellSize: 70,
    imageScale: 0.8,
    offsetY: 130,
    columns: 5,
    rows: 5,
  },
  {
    maxScore: 2700,
    baxieKeys: ['gronke', 'pink', 'green', 'blue', 'purple', 'orange'],
    cellSize: 70,
    imageScale: 0.8,
    offsetY: 130,
    columns: 5,
    rows: 5,
  },
  {
    maxScore: 3600,
    baxieKeys: ['gronke', 'pink', 'green', 'blue', 'purple', 'orange'],
    cellSize: 63,
    imageScale: 0.7,
    offsetY: 120,
    columns: 5,
    rows: 6,
  },
  {
    maxScore: 5000,
    baxieKeys: ['gronke', 'pink', 'green', 'blue', 'purple', 'orange', 'yellow'],
    cellSize: 63,
    imageScale: 0.7,
    offsetY: 120,
    columns: 5,
    rows: 6,
  },
  {
    maxScore: 6500,
    baxieKeys: ['gronke', 'pink', 'green', 'blue', 'purple', 'orange', 'yellow'],
    cellSize: 63,
    imageScale: 0.7,
    offsetY: 120,
    columns: 6,
    rows: 6,
  },
  {
    maxScore: Infinity, // anything above 6500
    baxieKeys: ['gronke', 'pink', 'green', 'blue', 'purple', 'orange', 'yellow'],
    cellSize: 52,
    imageScale: 0.6,
    offsetY: 125,
    columns: 7, // 6x6
    rows: 7, // 6x6
  }
];



export default class ScoreGameScene extends Phaser.Scene {
  constructor() {
    super("ScoreGameScene");
  }

  init() {
    this.score = 0;
    this.setLevel();
    this.board = this.makeEmptyBoard();
    this.sprites = this.makeEmptyBoard();
    this.isBusy = false;
  }

  setLevel(emitEvent = true) {
    for (let i = 0; i < levels.length; i++) {
      if (this.score < levels[i].maxScore) {
        const level = levels[i];

        this.cellSize = level.cellSize;
        this.imageScale = level.imageScale;
        this.offsetY = level.offsetY;
        this.columns = level.columns;
        this.rows = level.rows;
        this.baxieKeys = level.baxieKeys;

        this.level = i + 1;

        if (emitEvent) {
          setTimeout(() => {
            this.events.emit("targetChanged", level.maxScore);
          }, 50);
        }

        break;
      }
    }
  }

  create() {
    this.cameras.main.setBackgroundColor("#101018");

    this.backgroundDay = this.add
      .image(0, 0, 'bg')
      .setOrigin(0, 0)
      .setInteractive();
    this.gridGraphics = this.add.graphics();

    this.randomizeBoard();
    this.drawBoard();
    this.drawGrid();

    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointerup", this.onPointerUp, this);

  }

  makeEmptyBoard() {
    return Array.from({ length: this.rows }, () =>
      Array(this.columns).fill(null)
    );
  }

  inBounds(r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.columns;
  }

  randomizeBoard() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        let t;
        do {
          t = Phaser.Math.Between(0, this.baxieKeys.length - 1);
        } while (this.causesImmediateMatch(r, c, t));
        this.board[r][c] = t;
      }
    }
  }

  causesImmediateMatch(r, c, t) {
    const left1 = this.inBounds(r, c - 1) ? this.board[r][c - 1] : -1;
    const left2 = this.inBounds(r, c - 2) ? this.board[r][c - 2] : -1;
    if (left1 === t && left2 === t) return true;

    const up1 = this.inBounds(r - 1, c) ? this.board[r - 1][c] : -1;
    const up2 = this.inBounds(r - 2, c) ? this.board[r - 2][c] : -1;
    if (up1 === t && up2 === t) return true;

    return false;
  }

  drawGrid() {
    const offsetX = (this.sys.game.config.width / 2) - ((this.columns * this.cellSize) / 2);
    const offsetY = this.offsetY;

    // clear previous grid
    this.gridGraphics.clear();
    this.gridGraphics.fillStyle(0x316180, 0.7); // background color
    this.gridGraphics.fillRoundedRect(
      offsetX,
      offsetY,
      this.columns * this.cellSize,
      this.rows * this.cellSize,
      2
    );

    this.gridGraphics.lineStyle(2, 0xffffff, 0.3);

    for (let row = 0; row <= this.rows; row++) {
      const y = offsetY + row * this.cellSize;
      this.gridGraphics.moveTo(offsetX, y);
      this.gridGraphics.lineTo(offsetX + this.columns * this.cellSize, y);
    }

    for (let col = 0; col <= this.columns; col++) {
      const x = offsetX + col * this.cellSize;
      this.gridGraphics.moveTo(x, offsetY);
      this.gridGraphics.lineTo(x, offsetY + this.rows * this.cellSize);
    }

    this.gridGraphics.strokePath();
  }

  drawBoard() {
    const offsetX = (this.sys.game.config.width / 2) - ((this.columns * this.cellSize) / 2);
    const offsetY = this.offsetY;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        if (this.sprites[r][c]) {
          this.sprites[r][c].destroy();
          this.sprites[r][c] = null;
        }
        const t = this.board[r][c];
        const key = this.baxieKeys[t];
        const x = offsetX + c * this.cellSize + this.cellSize / 2;
        const y = offsetY + r * this.cellSize + this.cellSize / 2;
        const spr = this.add.image(x, y, key).setScale(this.imageScale);
        spr.setData({ r, c, t });
        this.sprites[r][c] = spr;
      }
    }
  }

  toWorld(r, c) {
    const offsetX = (this.sys.game.config.width / 2) - ((this.columns * this.cellSize) / 2);
    const offsetY = this.offsetY;

    return { x: offsetX + c * this.cellSize + this.cellSize / 2, y: offsetY + r * this.cellSize + this.cellSize / 2 };
  }

  onPointerDown(pointer) {
    if (this.isBusy) return;
    const pos = this.screenToCell(pointer.x, pointer.y);
    if (!pos) return;
    this.selectCell = pos;
  }

  onPointerUp(pointer) {
    if (this.isBusy || !this.selectCell) return;
    const end = this.screenToCell(pointer.x, pointer.y);
    if (!end) { this.selectCell = null; return; }

    const { r: r1, c: c1 } = this.selectCell;
    const { r: r2, c: c2 } = end;

    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) { this.selectCell = null; return; }

    this.swapAndResolve(r1, c1, r2, c2);
    this.selectCell = null;
  }

  screenToCell(x, y) {
    const offsetX = (this.sys.game.config.width / 2) - ((this.columns * this.cellSize) / 2);
    const offsetY = this.offsetY;

    const c = Math.floor((x - offsetX) / this.cellSize);
    const r = Math.floor((y - offsetY) / this.cellSize);
    if (!this.inBounds(r, c)) return null;
    return { r, c };
  }

  async swapAndResolve(r1, c1, r2, c2) {
    if (this.isBusy) return;
    this.isBusy = true;

    this.swapBoard(r1, c1, r2, c2);
    await this.tweenSwap(r1, c1, r2, c2);

    let matches = this.findAllMatches();
    if (matches.length === 0) {
      this.swapBoard(r1, c1, r2, c2);
      await this.tweenSwap(r1, c1, r2, c2);
      this.isBusy = false;
      return;
    }

    do {
      await this.clearMatches(matches);
      await this.dropTiles();
      await this.refillTiles();
      matches = this.findAllMatches();
    } while (matches.length > 0);

    this.isBusy = false;
  }

  swapBoard(r1, c1, r2, c2) {
    const t = this.board[r1][c1];
    this.board[r1][c1] = this.board[r2][c2];
    this.board[r2][c2] = t;

    const s = this.sprites[r1][c1];
    this.sprites[r1][c1] = this.sprites[r2][c2];
    this.sprites[r2][c2] = s;

    this.sprites[r1][c1].setData({ r: r1, c: c1, t: this.board[r1][c1] });
    this.sprites[r2][c2].setData({ r: r2, c: c2, t: this.board[r2][c2] });
  }

  tweenSwap(r1, c1, r2, c2) {
    const s1 = this.sprites[r1][c1];
    const s2 = this.sprites[r2][c2];
    const p1 = this.toWorld(r1, c1);
    const p2 = this.toWorld(r2, c2);

    return new Promise(resolve => {
      this.tweens.add({ targets: s1, x: p1.x, y: p1.y, duration: 120, ease: "Sine.easeInOut" });
      this.tweens.add({ targets: s2, x: p2.x, y: p2.y, duration: 120, ease: "Sine.easeInOut", onComplete: resolve });
    });
  }

  findAllMatches() {
    const matches = [];
    // Horizontal
    for (let r = 0; r < this.rows; r++) {
      let runStart = 0;
      for (let c = 1; c <= this.columns; c++) {
        if (c === this.columns || this.board[r][c] !== this.board[r][c - 1]) {
          if (c - runStart >= 3 && this.board[r][c - 1] !== null) {
            for (let k = runStart; k < c; k++) matches.push({ r, c: k });
          }
          runStart = c;
        }
      }
    }
    // Vertical
    for (let c = 0; c < this.columns; c++) {
      let runStart = 0;
      for (let r = 1; r <= this.rows; r++) {
        if (r === this.rows || this.board[r][c] !== this.board[r - 1][c]) {
          if (r - runStart >= 3 && this.board[r - 1][c] !== null) {
            for (let k = runStart; k < r; k++) matches.push({ r: k, c });
          }
          runStart = r;
        }
      }
    }

    const seen = new Set();
    return matches.filter(cell => {
      const key = `${cell.r},${cell.c}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  showLevelUpScreen() {
    return new Promise((resolve) => {
      // Create semi-transparent overlay
      const overlay = this.add.rectangle(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        this.cameras.main.width,
        this.cameras.main.height,
        0x000000,
        0.7
      );

      // Create a Level Up text
      const levelText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        `LEVEL ${this.level - 1} cleared`,
        { fontSize: "40px", color: "#ffffff", fontStyle: "bold", fontFamily: 'troika', }
      ).setOrigin(0.5);
      levelText.setShadow(2, 2, '#000', 4, true, true);

      // Create a button
      const btn = createButton({
        scene: this,
        x: this.cameras.main.centerX - 75,
        y: this.cameras.main.centerY + 40,
        width: 150,
        height: 40,
        text: "Continue",
        onPointerDown: () => {
          this.setLevel();
          overlay.destroy();
          levelText.destroy();
          btn.destroy();
          resolve();
        }
      })
    });
  }

  clearMatches(cells) {
    return new Promise((resolve) => {
      this.score += cells.length * 10;
      this.events.emit("scoreChanged", this.score);

      const oldLevel = this.level;
      this.setLevel(false);

      if (this.level !== oldLevel) {
        this.showLevelUpScreen()
          .then(() => {
            this.resetForNewLevel();
            resolve();
          });

        return;
      }

      let remaining = 0;
      cells.forEach(({ r, c }) => {
        const s = this.sprites[r][c];
        if (!s) {
          this.board[r][c] = null;
          return;
        }
        remaining++;
        this.tweens.add({
          targets: s,
          scale: 0,
          alpha: 0,
          duration: 120,
          ease: "Back.easeIn",
          onComplete: () => {
            s.destroy();
            this.sprites[r][c] = null;
            this.board[r][c] = null;
            remaining--;
            if (remaining === 0) resolve();
          },
        });
      });
      if (remaining === 0) resolve();
    });
  }

  resetForNewLevel() {
    // destroy current sprites
    this.sprites.flat().forEach((s) => s && s.destroy());

    // rebuild with new settings
    this.board = this.makeEmptyBoard();
    this.sprites = this.makeEmptyBoard();
    this.randomizeBoard();
    this.drawBoard();
    this.drawGrid();
  }

  dropTiles() {
    return new Promise(resolve => {
      let remaining = 0;
      for (let c = 0; c < this.columns; c++) {
        let write = this.rows - 1;
        for (let r = this.rows - 1; r >= 0; r--) {
          if (this.board[r][c] !== null) {
            if (write !== r) {
              const t = this.board[r][c], s = this.sprites[r][c];
              this.board[write][c] = t; this.board[r][c] = null;
              this.sprites[write][c] = s; this.sprites[r][c] = null;
              const p = this.toWorld(write, c);
              remaining++;
              this.tweens.add({ targets: s, x: p.x, y: p.y, duration: 150, ease: "Sine.easeIn",
                onComplete: () => { s.setData({ r: write, c, t }); remaining--; if (remaining === 0) resolve(); }
              });
            }
            write--;
          }
        }
      }
      if (remaining === 0) resolve();
    });
  }

  hasValidMove() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        const t = this.board[r][c];
        // check swap right
        if (c < this.columns - 1) {
          this.swapBoard(r, c, r, c + 1);
          if (this.findAllMatches().length > 0) { this.swapBoard(r, c, r, c + 1); return true; }
          this.swapBoard(r, c, r, c + 1);
        }
        // check swap down
        if (r < this.rows - 1) {
          this.swapBoard(r, c, r + 1, c);
          if (this.findAllMatches().length > 0) { this.swapBoard(r, c, r + 1, c); return true; }
          this.swapBoard(r, c, r + 1, c);
        }
      }
    }
    return false;
  }

  async refillTiles() {
    return new Promise(resolve => {
      let remaining = 0;
      for (let c = 0; c < this.columns; c++) {
        for (let r = 0; r < this.rows; r++) {
          if (this.board[r][c] === null) {
            const t = Phaser.Math.Between(0, this.baxieKeys.length - 1);
            this.board[r][c] = t;
            const key = this.baxieKeys[t];
            const p = this.toWorld(r, c);
            const s = this.add.image(p.x, p.y - this.cellSize * 1.5, key).setScale(0).setAlpha(0);

            s.setData({ r, c, t }); this.sprites[r][c] = s;
            remaining++;

            this.tweens.add({ targets: s, alpha: 1, duration: 60, onComplete: () => {
                this.tweens.add({ targets: s, y: p.y, duration: 160, ease: "Sine.easeOut", onComplete: () => {
                    this.tweens.add({ targets: s, scale: this.imageScale, duration: 100, ease: "Back.out", onComplete: () => {
                        remaining--;
                        if (remaining === 0) {
                          resolve();
                          // check if any moves left
                          if (!this.hasValidMove()) {
                            this.events.emit("scoreChanged", 0);
                            this.scene.launch("GameOverScene", { score: this.score });
                            this.score = 0;
                            this.isBusy = true;
                          }
                        }
                      }});
                  }});
              }});
          }
        }
      }
      if (remaining === 0) {
        resolve();
        if (!this.hasValidMove()) {
          this.scene.launch("GameOverScene", { score: this.score });
          this.isBusy = true;
        }
      }
    });
  }
}
