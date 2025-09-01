import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import expressStatic from "express";

export function initStaticRoutes(app) {
  // Helper to resolve absolute paths
  const resolvePath = (...segments) => path.resolve(__dirname, ...segments);

  // Serve CSS with cache and extension filtering
  app.use(
    "/css",
    expressStatic.static(resolvePath("../../../public/dist/css"), {
      extensions: ["css"],
      maxAge: "1d"
    })
  );

  // Serve JS
  app.use(
    "/js",
    expressStatic.static(resolvePath("../../../public/dist/js"), {
      extensions: ["js", "map"],
      maxAge: "1d"
    })
  );

  // Serve Images
  app.use(
    "/img",
    expressStatic.static(resolvePath("../../../public/img"), {
      extensions: ["png", "jpg", "jpeg", "gif", "svg", "webp"],
      maxAge: "7d"
    })
  );
  app.use(
    "/ugc",
    expressStatic.static(resolvePath("../../../public/ugc"), {
      extensions: ["png", "jpg", "jpeg", "gif", "svg", "webp"],
      maxAge: "7d"
    })
  );

  // Serve Fonts
  app.use(
    "/fonts",
    expressStatic.static(resolvePath("../../../public/fonts"), {
      extensions: ["woff", "woff2", "ttf", "eot", "otf"],
      maxAge: "30d"
    })
  );

  // Serve game assets (public only)
  app.use(
    "/game-assets",
    expressStatic.static(resolvePath("../../../games"), {
      extensions: ["png", "jpg", "json", "mp3", "wav"],
      maxAge: "7d"
    })
  );
}

