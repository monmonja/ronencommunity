import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getGames() {
  const gamesDir = path.resolve(__dirname, "../../../games");

  // list all folders in ../../games
  const entries = await fs.readdir(gamesDir, { withFileTypes: true });

  const games = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const pkgPath = path.join(gamesDir, entry.name, "package.json");

      try {
        const data = await fs.readFile(pkgPath, "utf-8");
        const json = JSON.parse(data);
        games.push(json);
      } catch (err) {
        // ignore if no package.json or JSON parse fails
        console.warn(`Skipping ${entry.name}: ${err.message}`);
      }
    }
  }

  return games;
}

export async function getGame(key) {
  const gameDir = path.resolve(__dirname, "../../../games", key);
  const pkgPath = path.join(gameDir, "package.json");

  try {
    const data = await fs.readFile(pkgPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error(`Could not load game ${key}: ${err.message}`);
    return null; // or throw err if you want
  }
}
