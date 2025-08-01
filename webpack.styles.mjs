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
    entry: './src/scss/index.scss',
    output: {
      path: path.resolve(__dirname, 'public/dist'),
      // no JS output
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
        filename: 'css/styles.css',
      }),
      new RemoveJSPlugin(),
    ],
    mode: isProduction ? 'production' : 'development',
  };
}
