import 'phaser';
import Tile from '../tile.mjs';
import { generateTiles, checkCoverage } from '../game-logic.mjs';
import { SLOT_CAPACITY, NUM_MATCHES_REQUIRED, LEVELS } from '../constants.mjs';
import {getCookie} from '../../common/utils/cookies.mjs';
import {updateGameProfile} from "../../common/game-profiles.mjs";
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.tiles = [];
    this.collectedTiles = [];
    this.moveHistory = [];
    this.gameState = 'playing';
    this.currentLevelIndex = 0;
    this.isAnimating = false;
  }

  init(data) {
    this.currentLevelIndex = data.level;
  }

  create() {
    this.add.image(0, 0, 'bg').setOrigin(0);
    this.startGame(this.currentLevelIndex);
    this.input.on('gameobjectdown', this.onTileClicked, this);
    this.events.on('undo-clicked', this.handleUndo, this);
    this.events.on('shuffle-clicked', this.handleShuffle, this);
    this.events.on('new-game-clicked', () => this.startGame(this.currentLevelIndex), this);
    this.events.on('next-level-clicked', this.handleNextLevel, this);
    this.events.on('restart-game-clicked', () => this.startGame(0), this);
  }
  handleNextLevel() {
    if (this.currentLevelIndex < LEVELS.length - 1) {
      updateGameProfile({
        scene: this,
        label: 'level',
        value: this.currentLevelIndex + 1
      }).then((res) => {
        console.log(res)
        this.startGame(this.currentLevelIndex + 1);
      });
    }
  }
  startGame(levelIndex) {
    if (levelIndex >= LEVELS.length) {
      console.log("All levels completed!");
      this.events.emit('game-over', 'won', true);
      return;
    }
    this.gameState = 'playing';
    this.isAnimating = false;
    this.tiles.forEach(tile => tile.destroy());
    this.tiles = [];
    this.collectedTiles = [];
    this.moveHistory = [];
    this.currentLevelIndex = levelIndex;
    this.currentLevelConfig = LEVELS[this.currentLevelIndex];
    const tileDataList = generateTiles(this.currentLevelConfig);
    tileDataList.forEach(data => {
      const tile = new Tile(this, data);
      this.tiles.push(tile);
    });
    this.updateAllTileCoverage();
    setTimeout(() => {
      this.updateUICounts();
      this.events.emit('update-current-level', this.currentLevelIndex + 1);
    }, 200)

    this.events.emit('game-restarted', {
      collectedTiles: this.collectedTiles,
      level: this.currentLevelIndex + 1,
    });

  }
  onTileClicked(_pointer, gameObject) {
    if (!(gameObject instanceof Tile) || this.gameState !== 'playing' || this.isAnimating || this.collectedTiles.length >= SLOT_CAPACITY) {
      return;
    }
    const tile = gameObject;
    this.isAnimating = true;
    const uiScene = this.scene.get('UIScene');
    const targetPos = uiScene.getSlotPosition(this.collectedTiles.length);
    this.moveHistory.push(tile.tileData.id);
    this.tweens.add({
      targets: tile,
      x: targetPos.x,
      y: targetPos.y,
      scale: 0.8,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        tile.collect(); // Hides it and disables interaction
        tile.setPosition(tile.tileData.position.x, tile.tileData.position.y).setScale(1); // Reset for undo
        this.collectedTiles.push(tile.tileData);
        this.collectedTiles.sort((a, b) => a.icon.localeCompare(b.icon)); // Group matches
        this.events.emit('tile-collected', this.collectedTiles);
        this.updateAllTileCoverage();
        this.updateUICounts();
        this.time.delayedCall(100, this.checkMatches, [], this);
      }
    });
  }
  checkMatches() {
    const iconCounts = {};
    this.collectedTiles.forEach(tile => {
      if (!iconCounts[tile.icon])
        iconCounts[tile.icon] = [];
      iconCounts[tile.icon].push(tile);
    });
    for (const icon in iconCounts) {
      if (iconCounts[icon].length >= NUM_MATCHES_REQUIRED) {
        const matchedIds = iconCounts[icon].slice(0, 3).map(t => t.id);
        this.tiles.forEach(t => {
          if (matchedIds.includes(t.tileData.id)) {
            t.tileData.isMatched = true;
          }
        });
        const newCollectedTiles = this.collectedTiles.filter(t => !matchedIds.includes(t.id));
        this.events.emit('match-found', { updatedTiles: newCollectedTiles, matchedIcon: icon });
        this.collectedTiles = newCollectedTiles;
        // Wait for UI animation to finish
        this.time.delayedCall(500, () => {
          this.updateAllTileCoverage();
          this.checkWinLoss();
          if (this.gameState === 'playing') {
            this.isAnimating = false;
          }
        }, [], this);
        return; // Exit after finding one match
      }
    }
    // If no matches found
    this.checkWinLoss();
    if (this.gameState === 'playing') {
      this.isAnimating = false;
    }
  }
  handleUndo() {
    if (this.moveHistory.length === 0 || this.gameState !== 'playing' || this.isAnimating)
      return;
    const lastTileId = this.moveHistory.pop();
    const tileToRestore = this.tiles.find(t => t.tileData.id === lastTileId);
    if (tileToRestore) {
      this.collectedTiles = this.collectedTiles.filter(t => t.id !== lastTileId);
      tileToRestore.uncollect();
      this.updateAllTileCoverage();
      this.events.emit('undo-performed', this.collectedTiles);
      this.updateUICounts();
    }
  }
  handleShuffle() {
    if (this.gameState !== 'playing' || this.isAnimating)
      return;
    const uncollectedTiles = this.tiles.filter(t => !t.tileData.isCollected && !t.tileData.isMatched);
    const iconsToShuffle = uncollectedTiles.map(t => t.tileData.icon);
    for (let i = iconsToShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [iconsToShuffle[i], iconsToShuffle[j]] = [iconsToShuffle[j], iconsToShuffle[i]];
    }
    uncollectedTiles.forEach((tile, index) => {
      this.tweens.add({
        targets: tile,
        scale: 0,
        duration: 150,
        ease: 'Power2',
        yoyo: true,
        onYoyo: () => {
          tile.updateIcon(iconsToShuffle[index]);
        }
      });
    });
  }
  updateAllTileCoverage() {
    const tileDataArray = this.tiles.map(t => t.tileData);
    const updatedTileDataArray = checkCoverage(tileDataArray);
    this.tiles.forEach(tile => {
      const updatedData = updatedTileDataArray.find(d => d.id === tile.tileData.id);
      if (updatedData && tile.tileData.isCovered !== updatedData.isCovered) {
        tile.setCovered(updatedData.isCovered);
      }
    });
  }
  checkWinLoss() {
    if (this.gameState !== 'playing')
      return;
    const uncollectedTiles = this.tiles.filter(t => !t.tileData.isCollected && !t.tileData.isMatched).length;
    if (uncollectedTiles === 0 && this.collectedTiles.length === 0) {
      this.gameState = 'won';
      this.events.emit('game-over', 'won', this.currentLevelIndex >= LEVELS.length - 1);
    }
    else if (this.collectedTiles.length >= SLOT_CAPACITY) {
      this.gameState = 'lost';
      this.events.emit('game-over', 'lost', false);
    }
  }
  updateUICounts() {
    const remainingOnBoard = this.tiles.filter(t => !t.tileData.isCollected && !t.tileData.isMatched).length;
    console.log('remainingOnBoard', remainingOnBoard)
    this.events.emit('update-tile-count', remainingOnBoard);
  }
}
