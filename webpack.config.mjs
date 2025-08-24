// webpack.config.mjs
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import config from "./src/backend/config/default.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isProduction = argv.mode === 'production';

  const jsFiles = {};
  const distVersion = config.distVersion;

  // --- Handle ./src/ts/*.ts ---
  const tsDir = "./src/ts";

  fs.readdirSync(tsDir).forEach(file => {
    if (file.endsWith(".ts")) {
      const name = path.basename(file, ".ts");

      jsFiles[`${name}-${distVersion}`] = "./" + path.join(tsDir, file);
    }
  });

  // --- Handle ./games/*/*.mjs ---
  const gamesDir = "./games";

  fs.readdirSync(gamesDir).forEach(subDir => {
    const gamePath = path.join(gamesDir, subDir);

    if (fs.statSync(gamePath).isDirectory()) {
      const mjsFile = `${subDir}.mjs`; // folder name = filename
      const mjsPath = path.join(gamePath, mjsFile);

      if (fs.existsSync(mjsPath)) {
        jsFiles[`${subDir}-${distVersion}`] = "./" + mjsPath;
      }
    }
  });

  return {
    entry: jsFiles,
    output: {
      path: path.resolve(__dirname, 'public/dist/js'),
    },
    resolve: {
      extensions: ['.ts', '.js', '.mjs'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            'ts-loader',
            {
              loader: path.resolve(__dirname, 'webpack', 'replace-config.js'),
            }
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.mjs$/,
          use: [
            {
              loader: path.resolve(__dirname, 'webpack', 'replace-config.js'),
            }
          ],
          exclude: /node_modules/,
        },
      ],
    },
    mode: isProduction ? 'production' : 'development',
    externals: {
      phaser: "Phaser",
    },
  };
}
