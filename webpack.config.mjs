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

  // --- Handle ./src/jsx/*.jsx ---
  const jsxDir = "./src/jsx";

  fs.readdirSync(jsxDir).forEach(file => {
    if (file.endsWith(".js")) {
      const name = path.basename(file, ".js");

      jsFiles[`${name}-${distVersion}`] = "./" + path.join(jsxDir, file);
    }
  });

  // --- Handle ./games/*/*.mjs ---
  const mainGameDir = "./games";

  fs.readdirSync(mainGameDir).forEach((dirName) => {
    const gamePath = path.join(mainGameDir, dirName);

    if (fs.statSync(gamePath).isDirectory()) {
      const mjsPath = path.join(gamePath, `${dirName}.mjs`);

      if (fs.existsSync(mjsPath)) {
        jsFiles[`${dirName}-${distVersion}`] = "./" + mjsPath;
      }

      fs.readdirSync(gamePath).forEach((subDirName) => {
        const subGamePath = path.join(mainGameDir, dirName, subDirName);

        if (fs.statSync(subGamePath).isDirectory()) {
          const subMjsPath = path.join(subGamePath, `${subDirName}.mjs`);
          console.log(subMjsPath)
          if (fs.existsSync(subMjsPath)) {
            jsFiles[`${subDirName}-${distVersion}`] = "./" + subMjsPath;
          }
        }
      });
    }
  });

console.log(fs.existsSync(path.join(path.resolve(__dirname), 'node_modules/@abstract-foundation/agw-react/dist/esm/exports/index.js')))
  return {
    entry: jsFiles,
    output: {
      path: path.resolve(__dirname, 'public/dist/js'),
    },
    resolve: {
      extensions: ['.ts', '.js', '.mjs', '.jsx'],
      fullySpecified: false,
      extensionAlias: {
        '.ts': ['.ts', '.tsx'],
        '.js': ['.js', '.mjs', '.ts', '.tsx'],
        '.mjs': ['.mjs', '.mts', '.ts']
      },
      alias: {
        '@': path.join(path.resolve(__dirname, './src')),
        '@abstract-foundation/agw-react': path.join(path.resolve(__dirname), 'node_modules/@abstract-foundation/agw-react/dist/esm/exports/index.js'),
      },
      // alias: {
      //   '../../actions/createSession': path.resolve(__dirname, 'node_modules/@abstract-foundation/agw-client/dist/esm/actions/createSession.js'),
      //   '../../actions/getLinkedAgw': path.resolve(__dirname, 'node_modules/@abstract-foundation/agw-client/dist/esm/actions/getLinkedAgw.js'),
      //   '../../actions/linkToAgw': path.resolve(__dirname, 'node_modules/@abstract-foundation/agw-client/dist/esm/actions/linkToAgw.js'),
      //   '../../actions/getLinkedAccounts': path.resolve(__dirname, 'node_modules/@abstract-foundation/agw-client/dist/esm/actions/getLinkedAccounts.js'),
      //   '@abstract-foundation/agw-client/sessions': path.resolve(__dirname, 'node_modules/@abstract-foundation/agw-client/dist/esm/sessions.js'),
      //   '@abstract-foundation/agw-client/constants': path.resolve(__dirname, 'node_modules/@abstract-foundation/agw-client/dist/esm/constants.js'),
      //
      // },
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false,
          },
          use: [
            {
              loader: path.resolve(__dirname, 'webpack', 'replace-config.js'),
            },
          ]
        },
        {
          test: /\.(js|mjs|mts|ts|jsx|tsx)$/,
          include: [
            // /node_modules/,
            path.resolve(__dirname, 'src'),
          ],
          resolve: {
            fullySpecified: false,  // Add this here
          },
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  ['@babel/preset-env', {
                    targets: {
                      esmodules: true,   // ✅ keep modern syntax
                    },
                    exclude: [
                      'transform-regenerator',
                      'transform-async-to-generator',
                      'transform-template-literals',
                      'transform-arrow-functions'
                    ]
                  }], '@babel/preset-react', '@babel/preset-typescript'],
              },
            },
            {
              loader: path.resolve(__dirname, 'webpack', 'replace-config.js'),
            },
          ],
        },
      ],
    },
    mode: isProduction ? 'production' : 'development',
    externals: {
      phaser: "Phaser",
    },
  };
}
