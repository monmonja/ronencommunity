import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @typedef {Object} GameObject
 * @property {string} name - Display name of the game
 * @property {number} dailyEnergy - Number of daily lives/plays allowed
 * @property {string} slug - Unique identifier for the game
 * @property {object[]} changeLog - List of changes
 */
export default class Games {
  /**
   * @type {Array<GameObject>}
   * @static
   */
  static games = [];

  /**
   * Get all available games
   * @static
   * @returns {Array<GameObject>} Array of game objects
   */
  static getGames() {
    if (Games.games.length > 0) {
      return Games.games;
    }

    const gamesDir = path.resolve(__dirname, "../../../games");

    // list all folders in ../../games
    const entries = fs.readdirSync(gamesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pkgPath = path.join(gamesDir, entry.name, "package.json");

        if (fs.existsSync(pkgPath)) {
          try {
            const data = fs.readFileSync(pkgPath, "utf-8");
            const json = JSON.parse(data);

            Games.games.push(json);
          } catch (err) {
            // ignore if no package.json or JSON parse fails
            console.warn(`Skipping ${entry.name}: ${err.message}`);
          }
        }
      }
    }

    return Games.games;
  }

  /**
   * Get a specific game by its ID
   * @static
   * @param {string} key - The unique identifier of the game
   * @returns {GameObject|undefined} The game object or undefined if not found
   */
  static getGame(key) {
    if (Games.games.length === 0) {
      Games.getGames();
    }

    return Games.games.filter((game) => game.slug === key)[0];
  }

  static getDailyEnergy(gameId) {
    const game = this.getGame(gameId);

    return game ? game.dailyEnergy : 0;
  }
}
