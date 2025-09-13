import { ICON_SET, TILE_WIDTH, TILE_HEIGHT, GAME_WIDTH, GAME_HEIGHT, NUM_MATCHES_REQUIRED } from './constants.mjs';
export const generateTiles = (levelConfig) => {
  const totalTiles = levelConfig.layout.length;
  if (totalTiles % NUM_MATCHES_REQUIRED !== 0) {
    console.error(`Total tiles (${totalTiles}) must be a multiple of ${NUM_MATCHES_REQUIRED}`);
    return [];
  }
  const numMatches = totalTiles / NUM_MATCHES_REQUIRED;
  const availableIcons = ICON_SET.slice(0, levelConfig.uniqueIcons);
  if (availableIcons.length === 0) {
    console.error('No available icons to generate tiles for this level.');
    return [];
  }
  // 1. Determine which icon to use for each match, cycling through available icons.
  const matchIcons = [];
  for (let i = 0; i < numMatches; i++) {
    matchIcons.push(availableIcons[i % availableIcons.length]);
  }
  // 2. Create the full pool of icons by adding NUM_MATCHES_REQUIRED of each match icon.
  const iconPool = [];
  matchIcons.forEach(icon => {
    for (let i = 0; i < NUM_MATCHES_REQUIRED; i++) {
      iconPool.push(icon);
    }
  });
  // 3. Shuffle the icon pool for random placement on the board.
  for (let i = iconPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [iconPool[i], iconPool[j]] = [iconPool[j], iconPool[i]];
  }
  // 4. Calculate grid's top-left position to center it
  const gridPixelWidth = levelConfig.gridSize.width * levelConfig.step.x;
  const gridPixelHeight = levelConfig.gridSize.height * levelConfig.step.y;
  const startX = (GAME_WIDTH - gridPixelWidth) / 2;
  const startY = (GAME_HEIGHT / 2) - (gridPixelHeight / 2) - 60; // Position above vertical center
  // 5. Create tiles from the layout and assign shuffled icons
  const tiles = [];
  levelConfig.layout.forEach((pos, index) => {
    tiles.push({
      id: index,
      icon: iconPool[index],
      layer: pos.z,
      position: {
        x: startX + pos.x * levelConfig.step.x,
        y: startY + pos.y * levelConfig.step.y,
      },
      isCollected: false,
      isMatched: false,
      isCovered: false,
    });
  });
  return tiles;
};
export const checkCoverage = (allTiles) => {
  const uncollectedTiles = allTiles.filter(t => !t.isCollected && !t.isMatched);
  return allTiles.map(tile => {
    if (tile.isCollected || tile.isMatched) {
      // Ensure collected or matched tiles are not marked as covered
      return tile.isCovered ? Object.assign(Object.assign({}, tile), { isCovered: false }) : tile;
    }
    let isCovered = false;
    for (const otherTile of uncollectedTiles) {
      if (tile.id === otherTile.id || otherTile.layer <= tile.layer)
        continue;
      const rect1 = { x: tile.position.x, y: tile.position.y, width: TILE_WIDTH, height: TILE_HEIGHT };
      const rect2 = { x: otherTile.position.x, y: otherTile.position.y, width: TILE_WIDTH, height: TILE_HEIGHT };
      // Manual rectangle intersection check
      if (rect1.x < rect2.x + TILE_WIDTH &&
        rect1.x + TILE_WIDTH > rect2.x &&
        rect1.y < rect2.y + TILE_HEIGHT &&
        rect1.y + TILE_HEIGHT > rect2.y) {
        isCovered = true;
        break;
      }
    }
    if (tile.isCovered !== isCovered) {
      return Object.assign(Object.assign({}, tile), { isCovered });
    }
    return tile;
  });
};
