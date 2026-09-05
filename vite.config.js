import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'copy-devotional-assets',
      closeBundle() {
        console.log('Copying static audio and image assets to dist...');
        copyDir(path.resolve(__dirname, 'song'), path.resolve(__dirname, 'dist/song'));
        copyDir(path.resolve(__dirname, 'images'), path.resolve(__dirname, 'dist/images'));
        console.log('Assets copied successfully to dist!');
      }
    }
  ],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        creator: path.resolve(__dirname, 'creator.html')
      }
    }
  }
});
