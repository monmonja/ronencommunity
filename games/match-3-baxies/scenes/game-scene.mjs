import Phaser from 'phaser';
import {assets} from "../../flappy-baxie/constants.mjs";

// src/scenes/GameScene.js
const BOARD_SIZE = 7;
const TILE_SIZE = 50;
const BAXIE_KEYS = ["gronke","pink","green","blue","purple","orange","yellow"];
const BOARD_OFFSET = { x: 9, y: 115 };

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init() {
    this.board = this.makeEmptyBoard();
    this.sprites = this.makeEmptyBoard();
    this.isBusy = false;
    this.score = 0;
  }

  create() {
    this.cameras.main.setBackgroundColor("#101018");

    this.backgroundDay = this.add.image(0, 0, assets.scene.background.day).setOrigin(0, 0).setInteractive()

    // Draw static grid background
    const g = this.add.graphics();
    g.lineStyle(2, 0xffffff, 0.2);
    g.fillStyle(0x000000, 0.5);
    g.fillRoundedRect(
      BOARD_OFFSET.x - 8,
      BOARD_OFFSET.y - 8,
      BOARD_SIZE * TILE_SIZE + 16,
      BOARD_SIZE * TILE_SIZE + 16,
      12
    );
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        g.strokeRect(BOARD_OFFSET.x + c * TILE_SIZE, BOARD_OFFSET.y + r * TILE_SIZE, TILE_SIZE, TILE_SIZE);

    this.randomizeBoard();
    this.drawBoard();

    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointerup", this.onPointerUp, this);
  }

  makeEmptyBoard() {
    return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
  }

  inBounds(r, c) {
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
  }

  randomizeBoard() {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        let t;
        do {
          t = Phaser.Math.Between(0, BAXIE_KEYS.length - 1);
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

  drawBoard() {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.sprites[r][c]) {
          this.sprites[r][c].destroy();
          this.sprites[r][c] = null;
        }
        const t = this.board[r][c];
        const key = BAXIE_KEYS[t];
        const x = BOARD_OFFSET.x + c * TILE_SIZE + TILE_SIZE / 2;
        const y = BOARD_OFFSET.y + r * TILE_SIZE + TILE_SIZE / 2;
        const spr = this.add.image(x, y, key).setScale(0.55);
        spr.setData({ r, c, t });
        this.sprites[r][c] = spr;
      }
    }
  }

  toWorld(r, c) {
    return { x: BOARD_OFFSET.x + c * TILE_SIZE + TILE_SIZE / 2, y: BOARD_OFFSET.y + r * TILE_SIZE + TILE_SIZE / 2 };
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
    const c = Math.floor((x - BOARD_OFFSET.x) / TILE_SIZE);
    const r = Math.floor((y - BOARD_OFFSET.y) / TILE_SIZE);
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
    for (let r = 0; r < BOARD_SIZE; r++) {
      let runStart = 0;
      for (let c = 1; c <= BOARD_SIZE; c++) {
        if (c === BOARD_SIZE || this.board[r][c] !== this.board[r][c - 1]) {
          if (c - runStart >= 3 && this.board[r][c - 1] !== null) {
            for (let k = runStart; k < c; k++) matches.push({ r, c: k });
          }
          runStart = c;
        }
      }
    }
    // Vertical
    for (let c = 0; c < BOARD_SIZE; c++) {
      let runStart = 0;
      for (let r = 1; r <= BOARD_SIZE; r++) {
        if (r === BOARD_SIZE || this.board[r][c] !== this.board[r - 1][c]) {
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

  clearMatches(cells) {
    return new Promise(resolve => {
      this.score += cells.length * 10;
      this.events.emit("scoreChanged", this.score);
      let remaining = 0;
      cells.forEach(({ r, c }) => {
        const s = this.sprites[r][c];
        if (!s) { this.board[r][c] = null; return; }
        remaining++;
        this.tweens.add({
          targets: s, scale: 0, alpha: 0, duration: 120, ease: "Back.easeIn",
          onComplete: () => { s.destroy(); this.sprites[r][c] = null; this.board[r][c] = null; remaining--; if (remaining === 0) resolve(); }
        });
      });
      if (remaining === 0) resolve();
    });
  }

  dropTiles() {
    return new Promise(resolve => {
      let remaining = 0;
      for (let c = 0; c < BOARD_SIZE; c++) {
        let write = BOARD_SIZE - 1;
        for (let r = BOARD_SIZE - 1; r >= 0; r--) {
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
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const t = this.board[r][c];
        // check swap right
        if (c < BOARD_SIZE - 1) {
          this.swapBoard(r, c, r, c + 1);
          if (this.findAllMatches().length > 0) { this.swapBoard(r, c, r, c + 1); return true; }
          this.swapBoard(r, c, r, c + 1);
        }
        // check swap down
        if (r < BOARD_SIZE - 1) {
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
      for (let c = 0; c < BOARD_SIZE; c++) {
        for (let r = 0; r < BOARD_SIZE; r++) {
          if (this.board[r][c] === null) {
            const t = Phaser.Math.Between(0, BAXIE_KEYS.length - 1);
            this.board[r][c] = t;
            const key = BAXIE_KEYS[t];
            console.log(key)
            const p = this.toWorld(r, c);
            const s = this.add.image(p.x, p.y - TILE_SIZE * 1.5, key).setScale(0).setAlpha(0);
            s.setData({ r, c, t }); this.sprites[r][c] = s;
            remaining++;
            this.tweens.add({ targets: s, alpha: 1, duration: 60, onComplete: () => {
                this.tweens.add({ targets: s, y: p.y, duration: 160, ease: "Sine.easeOut", onComplete: () => {
                    this.tweens.add({ targets: s, scale: 0.55, duration: 100, ease: "Back.out", onComplete: () => {
                        remaining--;
                        if (remaining === 0) {
                          resolve();
                          // check if any moves left
                          if (!this.hasValidMove() || this.score > 100) {
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
