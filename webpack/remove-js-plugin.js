// RemoveJSPlugin.js
import { rmSync, existsSync } from 'fs';
import path from 'path';

export class RemoveJSPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('RemoveJSPlugin', (compilation) => {
      for (const asset of Object.keys(compilation.assets)) {
        if (asset.endsWith('.js')) {
          const filePath = path.resolve(compiler.options.output.path, asset);
          if (existsSync(filePath)) {
            rmSync(filePath);
            console.log(`🧹 Removed JS: ${asset}`);
          }
        }
      }
    });
  }
}
