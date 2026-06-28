import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const version = manifest.version;
const pluginId = manifest.id;

const distDir = path.join(root, 'dist');
const releaseDir = path.join(distDir, pluginId);
const zipPath = path.join(distDir, `${pluginId}-${version}.zip`);

const releaseFiles = ['main.js', 'manifest.json', 'styles.css'];

console.log(`Building release for ${pluginId} v${version}...\n`);

console.log('[1/3] Running production build...');
execSync('node esbuild.config.mjs production', { cwd: root, stdio: 'inherit' });

console.log('\n[2/3] Copying release files...');
if (fs.existsSync(releaseDir)) {
  fs.rmSync(releaseDir, { recursive: true, force: true });
}
fs.mkdirSync(releaseDir, { recursive: true });

for (const file of releaseFiles) {
  const src = path.join(root, file);
  if (!fs.existsSync(src)) {
    console.warn(`  Warning: ${file} not found, skipping`);
    continue;
  }
  fs.copyFileSync(src, path.join(releaseDir, file));
  console.log(`  + ${file}`);
}

console.log('\n[3/3] Creating zip archive...');
if (fs.existsSync(zipPath)) {
  fs.rmSync(zipPath, { force: true });
}
execSync(`zip -j "${zipPath}" ${releaseFiles.map(f => `"${path.join(releaseDir, f)}"`).join(' ')}`, {
  cwd: root,
  stdio: 'inherit'
});

const stats = fs.statSync(zipPath);
const size = (stats.size / 1024).toFixed(2);

console.log(`\nDone!`);
console.log(`  Directory: ${path.relative(root, releaseDir)}/`);
console.log(`  Archive:   ${path.relative(root, zipPath)} (${size} KB)`);
