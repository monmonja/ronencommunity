// server.mjs
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ejs from 'ejs';

const app = express();
const port = process.env.PORT || 3000;

// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// setup view engine
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, '..', 'html'));

// Serve static files in /public
app.use('/css', express.static(path.join(__dirname, '..', '..', 'public', 'dist', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', '..', 'public', 'dist', 'js')));
app.use('/img', express.static(path.join(__dirname, '..', '..', 'public', 'img')));

app.get(['/', '/:path'], (req, res) => {
  res.render('index');
});

app.get(['/wiki/:path'], (req, res) => {
  const baseDir = path.join(__dirname, '..', 'html', 'wiki');
  const safePath = path.join(baseDir, req.params.path, 'index.html');
  const normalizedPath = path.normalize(safePath);

  // Ensure the normalized path starts with the base directory
  if (!normalizedPath.startsWith(baseDir)) {
    return res.status(403).send('Access Denied');
  }

  if (fs.existsSync(normalizedPath)) {
    // send partial when its via ajax
    if (req.xhr) {
      res.send(fs.readFileSync(normalizedPath, 'utf-8'));
    } else {
      res.render('wiki/template', {
        content: path.join('..', 'wiki', req.params.path, 'index.html'),
        selectedWiki: req.params.path,
      });
    }
  } else {
    res.status(404).send('Page not found');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
