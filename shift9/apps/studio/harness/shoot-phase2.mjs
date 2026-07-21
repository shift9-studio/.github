/* Phase 2 evidence — production stills at the same camera z as the Phase 1
   reference baseline (compare/ref/ref-z*.png), a mid-tunnel frame, the
   reduced-motion gate, and a recorded video of a real driven dolly run. */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

mkdirSync('shots', { recursive: true });
mkdirSync('video', { recursive: true });

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

// stills at every reference z
const page = await browser.newPage({ viewportSize: { width: 1600, height: 900 } });
await page.goto('http://127.0.0.1:8802/?skip-intro', { waitUntil: 'load' });
await page.waitForTimeout(2000);
for (const z of [20, -3, -26, -49, -72, -95, -118, -141, -164, -187, -210, -233]) {
  await page.evaluate((zz) => window.__S9_SET_Z(zz), z);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `shots/app-z${z}.png` });
  console.log(`shot z=${z}`);
}
await page.close();

// tunnel intro frame
const tunnel = await browser.newPage({ viewportSize: { width: 1600, height: 900 } });
await tunnel.goto('http://127.0.0.1:8802/', { waitUntil: 'load' });
await tunnel.waitForTimeout(1100); // mid-dive
await tunnel.screenshot({ path: 'shots/app-tunnel-mid.png' });
await tunnel.waitForTimeout(3000);
await tunnel.screenshot({ path: 'shots/app-after-tunnel.png' });
await tunnel.close();

// reduced-motion hard gate
const reduced = await browser.newPage({
  viewportSize: { width: 1600, height: 900 },
  reducedMotion: 'reduce',
});
await reduced.goto('http://127.0.0.1:8802/', { waitUntil: 'load' });
await reduced.waitForTimeout(1200);
await reduced.screenshot({ path: 'shots/app-reduced-motion.png' });
await reduced.close();

// video: tunnel dive, wheel-driven dolly through the run, a glide back
const ctx = await browser.newContext({
  viewportSize: { width: 1280, height: 720 },
  recordVideo: { dir: 'video', size: { width: 1280, height: 720 } },
});
const v = await ctx.newPage();
await v.goto('http://127.0.0.1:8802/', { waitUntil: 'load' });
await v.waitForTimeout(4200); // tunnel 2.6s + settle
// drive forward with wheel pulses (reference convention: negative deltaY = forward)
for (let i = 0; i < 26; i++) {
  await v.evaluate(() => {
    for (let j = 0; j < 4; j++)
      dispatchEvent(new WheelEvent('wheel', { deltaY: -240, cancelable: true }));
  });
  await v.waitForTimeout(600);
}
await v.waitForTimeout(2000); // coast to rest at the far rail
await v.evaluate(() => window.__S9_GLIDE(-49 + 13)); // cinematic glide to set 09
await v.waitForTimeout(3600);
await v.evaluate(() => window.__S9_GLIDE(20 + 13)); // and home to set 12
await v.waitForTimeout(3600);
await v.close();
await ctx.close();
await browser.close();
console.log('done');
