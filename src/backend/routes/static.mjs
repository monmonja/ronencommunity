import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initStaticRoutes(app, express) {
  app.use("/css", express.static(path.join(__dirname, "..", "..", "..", "public", "dist", "css")));
  app.use("/js", express.static(path.join(__dirname, "..", "..", "..", "public", "dist", "js")));
  app.use("/img", express.static(path.join(__dirname, "..", "..", "..", "public", "img")));
  app.use("/fonts", express.static(path.join(__dirname, "..", "..", "..", "public", "fonts")));
  app.use("/game-assets", express.static(path.join(__dirname, "..","..", "..", "games")));
}
