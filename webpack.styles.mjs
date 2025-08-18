// webpack.styles.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { RemoveJSPlugin } from './webpack/remove-js-plugin.js';
import config from "./src/backend/config/default.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isProduction = argv.mode === 'production';

  const scssFiles = {};
  const distVersion = config.distVersion;

  // --- Handle ./src/scss/*.scss ---
  const scssDir = "./src/scss";

  fs.readdirSync(scssDir).forEach(file => {
    if (file.endsWith(".scss")) {
      const name = path.basename(file, ".scss");

      scssFiles[`${name}-${distVersion}`] = "./" + path.join(scssDir, file);
    }
  });

  return {
    entry: scssFiles,
    output: {
      path: path.resolve(__dirname, 'public/dist'),
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'sass-loader',
          ],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'css/[name].css',
      }),
      new RemoveJSPlugin(),
    ],
    mode: isProduction ? 'production' : 'development',
  };
}
