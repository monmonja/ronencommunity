import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const games = [];

export function getGames() {
  if (games.length > 0) {
    return games;
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
          games.push(json);
        } catch (err) {
          // ignore if no package.json or JSON parse fails
          console.warn(`Skipping ${entry.name}: ${err.message}`);
        }
      }
    }
  }

  return games;
}

export function getGame(key) {
  if (games.length === 0) {
    getGames();
  }

  return games.filter((game) => game.slug === key)[0];
}
