/* Screenshot harness — drives reference prototype AND production build in
   headless Chromium, jumps the camera to a given z, screenshots.
   Usage: node shoot.mjs <url> <outPrefix> [z1,z2,...]
   For the reference page, unpkg CDN requests are rewritten to the local
   three@0.160.0 install (egress-safe, version-exact). */
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const [url, prefix, zList = ''] = process.argv.slice(2);
if (!url || !prefix) {
  console.error('usage: node shoot.mjs <url> <outPrefix> [z1,z2,...]');
  process.exit(1);
}
const zs = zList ? zList.split(',').map(Number) : [];

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewportSize: { width: 1600, height: 900 } });

const cdnMap = [
  ['three@0.160.0/build/three.module.js', 'node_modules/three/build/three.module.js'],
  ['react@18.3.1/umd/react.production.min.js', 'node_modules/react/umd/react.production.min.js'],
  ['react-dom@18.3.1/umd/react-dom.production.min.js', 'node_modules/react-dom/umd/react-dom.production.min.js'],
  ['@babel/standalone@7.29.0/babel.min.js', 'node_modules/@babel/standalone/babel.min.js'],
];
await page.route('**/unpkg.com/**', (route) => {
  const u = route.request().url();
  const hit = cdnMap.find(([frag]) => u.includes(frag));
  if (hit) {
    route.fulfill({
      contentType: 'application/javascript',
      body: readFileSync(resolve(here, hit[1]), 'utf8'),
    });
  } else {
    route.abort();
  }
});

page.on('console', (m) => {
  if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 300));
});
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));

await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(4000);
await page.screenshot({ path: `${prefix}-initial.png` });

if (process.env.SKIP_INTRO) {
  const skip = page.getByText('SKIP INTRO', { exact: true });
  if (await skip.count()) {
    await skip.first().click();
    await page.waitForTimeout(5000); // tunnel is 2.6s + settle
    await page.screenshot({ path: `${prefix}-after-skip.png` });
  }
}

for (const z of zs) {
  await page.evaluate((zz) => {
    const el = document.querySelector('shift9-scene');
    const anyEl = el;
    if (anyEl && anyEl.state) {
      anyEl.state.intro = null;
      anyEl.state.glide = null;
      anyEl.state.vel = 0;
      anyEl.state.z = zz;
    } else if (window.__S9_SET_Z) {
      window.__S9_SET_Z(zz);
    }
  }, z);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${prefix}-z${z}.png` });
  console.log(`shot z=${z}`);
}

await browser.close();
console.log('done');
