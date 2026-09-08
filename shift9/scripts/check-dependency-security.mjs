import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nextPackage = require.resolve('next/package.json');
for (const app of ['shift9-dev', 'just-a-pinch']) {
  const appRequire = createRequire(new URL(`../apps/${app}/package.json`, import.meta.url));
  assert.equal(appRequire.resolve('next/package.json'), nextPackage, `${app} must resolve the tested Next runtime`);
}
const nextRequire = createRequire(nextPackage);
const sharp = nextRequire('sharp');
const { optimizeImage } = nextRequire('./dist/server/image-optimizer.js');

function atLeast(actual, minimum, label) {
  const current = actual.split('.').map(Number);
  const floor = minimum.split('.').map(Number);
  assert(current.length === 3 && current.every(Number.isInteger), `${label}: invalid version ${actual}`);
  const comparison = current.reduce((result, part, index) => result || Math.sign(part - floor[index]), 0);
  assert(comparison >= 0, `${label} ${actual} is below patched ${minimum}`);
}

atLeast(nextRequire('./package.json').version, '16.2.11', 'Next.js');
const tailwindRequire = createRequire(require.resolve('@tailwindcss/postcss'));
for (const [name, parentRequire] of [['Next', nextRequire], ['Tailwind', tailwindRequire]]) {
  const postcssRequire = createRequire(parentRequire.resolve('postcss/package.json'));
  atLeast(postcssRequire('./package.json').version, '8.5.23', `${name} PostCSS`);
  atLeast(postcssRequire('nanoid/package.json').version, '3.3.18', `${name} PostCSS Nanoid`);
}
atLeast(sharp.versions.sharp, '0.35.4', 'Sharp');
atLeast(sharp.versions.vips, '8.18.3', 'libvips');

const source = await sharp({ create: { width: 32, height: 20, channels: 4, background: '#336699' } }).png().toBuffer();
for (const [mime, format] of [['image/png', 'png'], ['image/jpeg', 'jpeg'], ['image/webp', 'webp'], ['image/avif', 'heif']]) {
  const output = await optimizeImage({ buffer: source, contentType: mime, quality: 75, width: 16, concurrency: 1, timeoutInSeconds: 7 });
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.width, 16, `${mime} width`);
  assert.equal(metadata.height, 10, `${mime} height`);
  assert.equal(metadata.format, format, `${mime} encoded format`);
  console.log(`PASS Next optimizer ${mime}: ${output.length} bytes, 16x10`);
}
console.log('PASS patched dependency floors and native Next image optimizer');
