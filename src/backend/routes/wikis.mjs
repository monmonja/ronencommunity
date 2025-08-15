import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initWikisRoutes(app) {
  app.get(["/wiki/:path"], rateLimiterMiddleware, (req, res) => {
    const baseDir = path.join(__dirname, "..", "..", "html", "wiki");
    const safePath = path.join(baseDir, req.params.path, "index.html");
    const normalizedPath = path.normalize(safePath);

    // Ensure the normalized path starts with the base directory
    if (!normalizedPath.startsWith(baseDir)) {
      return res.status(403).send("Access Denied");
    }

    if (fs.existsSync(normalizedPath)) {
      // send partial when its via ajax
      if (req.xhr) {
        res.send(fs.readFileSync(normalizedPath, "utf-8"));
      } else {
        res.render("wiki/template", {
          content: path.join("..", "wiki", req.params.path, "index.html"),
          selectedWiki: req.params.path,
        });
      }
    } else {
      res.status(404).send("Page not found");
    }
  });
}
