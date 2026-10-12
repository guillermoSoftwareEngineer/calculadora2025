import { cp, copyFile, mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const build = path.join(root, 'dist/calculadora-electrica');
const docs = path.join(root, 'docs');
await mkdir(docs, { recursive: true });
// Retira solamente bundles generados; conserva archivos ajenos al build.
for (const entry of await readdir(docs)) {
  if (/^(main|polyfills|styles)-[\w-]+\.(js|css)$/.test(entry)) {
    await unlink(path.join(docs, entry));
  }
}
await cp(path.join(build, 'browser'), docs, { recursive: true });
await copyFile(path.join(build, '3rdpartylicenses.txt'), path.join(docs, '3rdpartylicenses.txt'));
await copyFile(path.join(docs, 'index.html'), path.join(docs, '404.html'));
await writeFile(path.join(docs, '.nojekyll'), '');
console.log('Build de GitHub Pages preparado en docs/');
