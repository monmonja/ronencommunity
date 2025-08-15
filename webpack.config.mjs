// webpack.config.mjs
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: {
      app: './src/ts/app.ts',
      games: './src/ts/games.ts',
      raffle: './src/ts/raffle.ts',
      "flappy-baxie": './games/flappy-baxie/flappy-baxie.mjs',
      "match-3-baxies": './games/match-3-baxies/match-3-baxies.mjs',
    },
    output: {
      path: path.resolve(__dirname, 'public/dist/js'),
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    mode: isProduction ? 'production' : 'development',
  };
}
