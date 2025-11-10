import fs from 'fs';
import path from 'path';
import {fileURLToPath} from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base folder where your CSS lives
const cssFolder = path.join(__dirname, '..', '..','..','public', 'dist', 'css');

export function inlineCSS(filename) {
  try {
    const cssPath = path.join(cssFolder, filename + '.css');
    const content = fs.readFileSync(cssPath, 'utf8');

    return `<style>\n${content}\n</style>`;
  } catch (err) {
    console.error(`CSS file not found: ${filename}`);
    return '';
  }
}
