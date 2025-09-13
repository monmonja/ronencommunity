// Game canvas dimensions
export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 576;
// Tile dimensions
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 64;
// Gameplay rules
export const NUM_MATCHES_REQUIRED = 3;
export const SLOT_CAPACITY = 7;
// Player abilities
export const INITIAL_SHUFFLES = 3;
export const INITIAL_UNDOS = 3;
export const INITIAL_RESTARTS = 3;
// Available icons for tiles
export const ICON_SET = [
  '{{config.cdnLink}}/game-assets/flappy-baxie/images/baxie-gronke.png',
  '{{config.cdnLink}}/game-assets/flappy-baxie/images/baxie-pink.png',
  '{{config.cdnLink}}/game-assets/flappy-baxie/images/baxie-blue.png',
  '{{config.cdnLink}}/game-assets/flappy-baxie/images/baxie-orange.png',
  '{{config.cdnLink}}/game-assets/flappy-baxie/images/baxie-green.png',
  '{{config.cdnLink}}/game-assets/flappy-baxie/images/baxie-yellow.png',
  '{{config.cdnLink}}/game-assets/flappy-baxie/images/baxie-purple.png',
  '{{config.cdnLink}}/game-assets/flappy-baxie/images/ronen.png',
];

const level1 =   {
  uniqueIcons: 5,
  gridSize: { width: 6, height: 6 },
  step: { x: TILE_WIDTH / 2, y: TILE_HEIGHT / 2 },
  layout: [
    // Layer 0 (9 tiles)
    { x: 1, y: 1, z: 0 }, { x: 1, y: 3, z: 0 }, { x: 1, y: 5, z: 0 },
    { x: 3, y: 1, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 3, y: 5, z: 0 },
    { x: 5, y: 1, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 5, y: 5, z: 0 },
    // Layer 1 (4 tiles)
    { x: 2, y: 2, z: 1 }, { x: 2, y: 4, z: 1 },
    { x: 4, y: 2, z: 1 }, { x: 4, y: 4, z: 1 },
    // Layer 2 (2 tiles)
    { x: 3, y: 2, z: 2 }, { x: 3, y: 4, z: 2 }
  ]
};

const level2 = {
  uniqueIcons: 6,
  gridSize: { width: 8, height: 6 },
  step: { x: TILE_WIDTH / 2, y: TILE_HEIGHT / 2 },
  layout: [
    // Layer 0 (12 tiles)
    { x: 1, y: 1, z: 0 }, { x: 1, y: 3, z: 0 }, { x: 1, y: 5, z: 0 },
    { x: 3, y: 1, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 3, y: 5, z: 0 },
    { x: 5, y: 1, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 5, y: 5, z: 0 },
    { x: 7, y: 1, z: 0 }, { x: 7, y: 3, z: 0 }, { x: 7, y: 5, z: 0 },
    // Layer 1 (6 tiles)
    { x: 2, y: 2, z: 1 }, { x: 2, y: 4, z: 1 },
    { x: 4, y: 2, z: 1 }, { x: 4, y: 4, z: 1 },
    { x: 6, y: 2, z: 1 }, { x: 6, y: 4, z: 1 },
  ]
};

const level3 = { // Level 2: Twin Peaks (30 tiles)
  uniqueIcons: 7,
  gridSize: { width: 14, height: 8 },
  step: { x: TILE_WIDTH / 2, y: TILE_HEIGHT / 2 },
  layout: [
    // Layer 0: Left & Right bases
    { x: 0, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 4, y: 2, z: 0 },
    { x: 0, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 4, y: 4, z: 0 },
    { x: 8, y: 2, z: 0 }, { x: 10, y: 2, z: 0 }, { x: 12, y: 2, z: 0 },
    { x: 8, y: 4, z: 0 }, { x: 10, y: 4, z: 0 }, { x: 12, y: 4, z: 0 },
    // Layer 1: Left & Right mid-sections
    { x: 0.5, y: 2.5, z: 1 }, { x: 2.5, y: 2.5, z: 1 }, { x: 4.5, y: 2.5, z: 1 },
    { x: 0.5, y: 4.5, z: 1 }, { x: 2.5, y: 4.5, z: 1 }, { x: 4.5, y: 4.5, z: 1 },
    { x: 8.5, y: 2.5, z: 1 }, { x: 10.5, y: 2.5, z: 1 }, { x: 12.5, y: 2.5, z: 1 },
    { x: 8.5, y: 4.5, z: 1 }, { x: 10.5, y: 4.5, z: 1 }, { x: 12.5, y: 4.5, z: 1 },
    // Layer 2: Connecting tops
    { x: 3, y: 1.5, z: 2 }, { x: 5, y: 1.5, z: 2 }, { x: 7, y: 1.5, z: 2 }, { x: 9, y: 1.5, z: 2 },
    { x: 6, y: 3.5, z: 2 }, { x: 6, y: 5.5, z: 2 }
  ],
};

const level4 =   {
  uniqueIcons: 7,
  gridSize: { width: 12, height: 10 },
  step: { x: TILE_WIDTH / 2, y: TILE_HEIGHT / 2 },
  layout: [
    // Layer 0 (16 tiles, 4x4)
    { x: 1, y: 1, z: 0 }, { x: 1, y: 3, z: 0 }, { x: 1, y: 5, z: 0 }, { x: 1, y: 7, z: 0 },
    { x: 3, y: 1, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 3, y: 5, z: 0 }, { x: 3, y: 7, z: 0 },
    { x: 5, y: 1, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 5, y: 5, z: 0 }, { x: 5, y: 7, z: 0 },
    { x: 9, y: 1, z: 0 }, { x: 9, y: 3, z: 0 }, { x: 9, y: 5, z: 0 }, { x: 9, y: 7, z: 0 },
    // Layer 1 (9 tiles, 3x3)
    { x: 2, y: 2, z: 1 }, { x: 2, y: 4, z: 1 }, { x: 2, y: 6, z: 1 },
    { x: 4, y: 2, z: 1 }, { x: 4, y: 4, z: 1 }, { x: 4, y: 6, z: 1 },
    { x: 6, y: 2, z: 1 }, { x: 6, y: 4, z: 1 }, { x: 6, y: 6, z: 1 },
    // Layer 2 (4 tiles, 2x2)
    { x: 3, y: 3, z: 2 }, { x: 3, y: 5, z: 2 },
  ]
};

const level5 =   {
  uniqueIcons: 7,
  gridSize: { width: 12, height: 10 },
  step: { x: TILE_WIDTH / 2, y: TILE_HEIGHT / 2 },
  layout: [
    // Layer 0 (16 tiles, 4x4)
    { x: 1, y: 1, z: 0 }, { x: 1, y: 2, z: 1 }, { x: 1, y: 3, z: 2 }, { x: 1, y: 4, z: 3 }, { x: 1, y: 5, z: 4 },

    { x: 4, y: 1, z: 0 }, { x: 4, y: 3, z: 1 }, { x: 4, y: 5, z: 2 }, { x: 4, y: 7, z: 3 },
    { x: 8, y: 1, z: 0 }, { x: 8, y: 3, z: 1 }, { x: 8, y: 5, z: 2 }, { x: 8, y: 7, z: 3 },

    { x: 11, y: 1, z: 0 }, { x: 11, y: 2, z: 1 }, { x: 11, y: 3, z: 2 }, { x: 11, y: 4, z: 3 }, { x: 11, y: 5, z: 4 },
    // Layer 1 (9 tiles, 3x3)
    { x: 5, y: 2, z: 4 }, { x: 5, y: 4, z: 4 }, { x: 5, y: 6, z: 4 },
    { x: 7, y: 2, z: 4 }, { x: 7, y: 4, z: 4 }, { x: 7, y: 6, z: 4 },
  ]
};

const level6 =   {
  uniqueIcons: 7,
  gridSize: { width: 12, height: 10 },
  step: { x: TILE_WIDTH / 2, y: TILE_HEIGHT / 2 },
  layout: [
    // Layer 0 (16 tiles, 4x4)
    { x: 1, y: 1, z: 0 }, { x: 1, y: 2, z: 1 }, { x: 1, y: 3, z: 2 }, { x: 1, y: 4, z: 3 }, { x: 1, y: 5, z: 4 },

    { x: 4, y: 1, z: 0 }, { x: 4, y: 3, z: 1 }, { x: 4, y: 5, z: 2 }, { x: 4, y: 7, z: 3 },
    { x: 8, y: 1, z: 0 }, { x: 8, y: 3, z: 1 }, { x: 8, y: 5, z: 2 }, { x: 8, y: 7, z: 3 },

    { x: 11, y: 1, z: 0 }, { x: 11, y: 2, z: 1 }, { x: 11, y: 3, z: 2 }, { x: 11, y: 4, z: 3 }, { x: 11, y: 5, z: 4 },
    // Layer 1 (9 tiles, 3x3)
    { x: 5, y: 2, z: 4 }, { x: 5, y: 4, z: 4 }, { x: 5, y: 6, z: 4 },
    { x: 7, y: 2, z: 4 }, { x: 7, y: 4, z: 4 }, { x: 7, y: 6, z: 4 },

    { x: 6, y: 2, z: 2 }, { x: 6, y: 4, z: 2 }, { x: 6, y: 6, z: 2 },
  ]
};

const level7 =   {
  uniqueIcons: 7,
  gridSize: { width: 12, height: 10 },
  step: { x: TILE_WIDTH / 2, y: TILE_HEIGHT / 2 },
  layout: [
    // Layer 0 (16 tiles, 4x4)
    { x: 1, y: 1, z: 0 }, { x: 1, y: 2, z: 1 }, { x: 1, y: 3, z: 2 }, { x: 1, y: 4, z: 3 },
    { x: 4, y: 1, z: 0 }, { x: 4, y: 2, z: 1 }, { x: 4, y: 3, z: 2 },
    { x: 8, y: 1, z: 0 }, { x: 8, y: 2, z: 1 }, { x: 8, y: 3, z: 2 },


    { x: 11, y: 1, z: 0 }, { x: 11, y: 2, z: 1 }, { x: 11, y: 3, z: 2 }, { x: 11, y: 4, z: 3 },
    // Layer 1 (9 tiles, 3x3)
    { x: 5, y: 2, z: 3 }, { x: 5, y: 4, z: 3 }, { x: 5, y: 6, z: 3 },
    { x: 7, y: 2, z: 3 }, { x: 7, y: 4, z: 3 }, { x: 7, y: 6, z: 3 },

    { x: 1, y: 9, z: 0 }, { x: 2, y: 9, z: 1 }, { x: 3, y: 9, z: 2 }, { x: 4, y: 9, z: 4 },
  ]
};

const level8 = {
  uniqueIcons: 8,
  gridSize: { width: 14, height: 6 },
  step: { x: TILE_WIDTH / 2, y: TILE_HEIGHT / 2 },
  layout: [
    // Layer 0 (12 tiles)
    { x: 1, y: 1, z: 0 }, { x: 1, y: 3, z: 0 }, { x: 1, y: 5, z: 0 },
    { x: 3, y: 1, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 3, y: 5, z: 0 },
    { x: 5, y: 1, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 5, y: 5, z: 0 },
    { x: 7, y: 1, z: 0 }, { x: 7, y: 3, z: 0 }, { x: 7, y: 5, z: 0 },
    // Layer 1 (6 tiles)
    { x: 2, y: 2, z: 1 }, { x: 2, y: 4, z: 1 },
    { x: 4, y: 2, z: 1 }, { x: 4, y: 4, z: 1 },
    { x: 6, y: 2, z: 1 }, { x: 6, y: 4, z: 1 },
    // layer 2
    { x: 5, y: 2, z: 2 }, { x: 5, y: 4, z: 2 }, { x: 3, y: 3, z: 2 },

    // Layer 0 (12 tiles)
    { x: 9, y: 1, z: 0 }, { x: 9, y: 3, z: 0 }, { x: 9, y: 5, z: 0 },
    { x: 11, y: 1, z: 0 }, { x: 11, y: 3, z: 0 }, { x: 11, y: 5, z: 0 },
    { x: 13, y: 1, z: 0 }, { x: 13, y: 3, z: 0 }, { x: 13, y: 5, z: 0 },
    { x: 15, y: 1, z: 0 }, { x: 15, y: 3, z: 0 }, { x: 15, y: 5, z: 0 },
// Layer 1 (6 tiles)
    { x: 10, y: 2, z: 1 }, { x: 10, y: 4, z: 1 },
    { x: 12, y: 2, z: 1 }, { x: 12, y: 4, z: 1 },
    { x: 14, y: 2, z: 1 }, { x: 14, y: 4, z: 1 },
    // layer 2
    { x: 13, y: 2, z: 2 }, { x: 13, y: 4, z: 2 }, { x: 11, y: 3, z: 2 },
  ]
};

const level9 = {
  uniqueIcons: 8,
  gridSize: { width: 14, height: 6 },
  step: { x: TILE_WIDTH / 2, y: TILE_HEIGHT / 2 },
  layout: [
    { x: 1, y: 1, z: 0 }, { x: 1, y: 2, z: 1 }, { x: 1, y: 3, z: 2 }, { x: 1, y: 4, z: 3 },
    { x: 4, y: 1, z: 0 }, { x: 4, y: 2, z: 1 }, { x: 4, y: 3, z: 2 },
    { x: 8, y: 1, z: 0 }, { x: 8, y: 2, z: 1 }, { x: 8, y: 3, z: 2 },


    { x: 11, y: 1, z: 0 }, { x: 11, y: 2, z: 1 }, { x: 11, y: 3, z: 2 }, { x: 11, y: 4, z: 3 },
    // Layer 1 (9 tiles, 3x3)

    { x: 1, y: 9, z: 0 }, { x: 2, y: 9, z: 1 }, { x: 3, y: 9, z: 2 }, { x: 4, y: 9, z: 4 },
    { x: 13, y: 9, z: 0 }, { x: 12, y: 9, z: 1 }, { x: 11, y: 9, z: 2 },
  ]
};

const level10 = {
  uniqueIcons: 8,
  gridSize: { width: 14, height: 10 },
  step: { x: TILE_WIDTH / 2, y: TILE_HEIGHT / 2 },
  layout: [
    { x: 1, y: 1, z: 0 }, { x: 1, y: 2, z: 1 }, { x: 1, y: 3, z: 2 }, { x: 1, y: 4, z: 3 },
    { x: 4, y: 1, z: 0 }, { x: 4, y: 2, z: 1 }, { x: 4, y: 3, z: 2 }, { x: 4, y: 4, z: 3 },
    { x: 8, y: 1, z: 0 }, { x: 8, y: 2, z: 1 }, { x: 8, y: 3, z: 2 }, { x: 8, y: 4, z: 3 },

    { x: 11, y: 1, z: 0 }, { x: 11, y: 2, z: 1 }, { x: 11, y: 3, z: 2 }, { x: 11, y: 4, z: 3 },
    { x: 5, y: 7, z: 0 }, { x: 6, y: 7, z: 1 }, { x: 7, y: 7, z: 2 }, { x: 8, y: 7, z: 3 },

    { x: 1, y: 9, z: 0 }, { x: 2, y: 9, z: 1 }, { x: 3, y: 9, z: 2 }, { x: 4, y: 9, z: 4 },
    { x: 13, y: 9, z: 0 }, { x: 12, y: 9, z: 1 }, { x: 11, y: 9, z: 2 },
  ]
};

// Level configurations
export const LEVELS = [
  level10,
  level1,
  level2,
  level3,
  level4,
  level5,
  level6,
  level7,
  level8,
  level9,
];
