// webpack.styles.mjs
import path from 'path';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { RemoveJSPlugin } from './webpack/remove-js-plugin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: {
      index: './src/scss/index.scss',
      wiki: './src/scss/wiki.scss',
    },
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
