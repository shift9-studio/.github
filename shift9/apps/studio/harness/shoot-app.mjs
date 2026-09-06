import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

const normal = await browser.newPage({ viewportSize: { width: 1600, height: 900 } });
await normal.goto('http://127.0.0.1:8802/', { waitUntil: 'load' });
await normal.waitForTimeout(2500);
await normal.screenshot({ path: 'shots/app-phase1-void.png' });

const reduced = await browser.newPage({
  viewportSize: { width: 1600, height: 900 },
  reducedMotion: 'reduce',
});
await reduced.goto('http://127.0.0.1:8802/', { waitUntil: 'load' });
await reduced.waitForTimeout(1500);
await reduced.screenshot({ path: 'shots/app-phase1-reduced-motion.png' });

await browser.close();
console.log('done');
