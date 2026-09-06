/* Phase 2 gate — headless verification of the dolly physics contract:
   1. wheel NEVER moves position directly (only velocity, same-tick)
   2. exponential damping pow(1-0.05, dt*60) on velocity
   3. |vel| clamped to 3.0
   4. z clamped to [-250, 50], vel zeroed at the rails
   5. glideTo eases to target; ANY manual input cancels it
   6. keyboard arrows add velocity
   Prints PASS/FAIL per check + a JSON transcript for the evidence record. */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';

const URL = 'http://127.0.0.1:8802/?skip-intro';
const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`);
};

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewportSize: { width: 1600, height: 900 } });
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(1500);

const state = () => page.evaluate(() => window.__S9_STATE());
const wheel = (dy) =>
  page.evaluate((d) => dispatchEvent(new WheelEvent('wheel', { deltaY: d, cancelable: true })), dy);

// 1. skip-intro boots settled at CAMERA_START_Z
{
  const s = await state();
  check('boot: z=50, vel=0, no intro', s.z === 50 && s.vel === 0 && !s.intro, JSON.stringify(s));
}

// 2. wheel adds VELOCITY, never position (read back synchronously, same tick)
{
  const r = await page.evaluate(() => {
    const before = window.__S9_STATE();
    dispatchEvent(new WheelEvent('wheel', { deltaY: -120, cancelable: true }));
    const after = window.__S9_STATE(); // same JS task — no rAF has run
    return { before, after };
  });
  check(
    'wheel: same-tick z unchanged, vel changed',
    r.after.z === r.before.z && r.after.vel !== r.before.vel,
    `z ${r.before.z}→${r.after.z}, vel ${r.before.vel.toFixed(4)}→${r.after.vel.toFixed(4)}`,
  );
}

// 3. velocity decays exponentially with damping 0.05 (per-frame factor 0.95 @60fps)
{
  await page.waitForTimeout(120);
  for (let i = 0; i < 6; i++) await wheel(-360);
  const a = await state();
  await page.waitForTimeout(500);
  const b = await state();
  // pow(0.95, 30 frames @60fps over 0.5s) ≈ 0.2146
  const expected = Math.abs(a.vel) * Math.pow(1 - 0.05, 30);
  const ratioOk =
    Math.abs(b.vel) < Math.abs(a.vel) &&
    Math.abs(Math.abs(b.vel) - expected) < Math.abs(a.vel) * 0.12;
  check(
    'damping: |vel| after 0.5s ≈ pow(0.95, 30)·|vel₀|',
    ratioOk,
    `|vel₀|=${Math.abs(a.vel).toFixed(4)} expected≈${expected.toFixed(4)} got=${Math.abs(b.vel).toFixed(4)}`,
  );
  await page.waitForTimeout(2500);
  const c = await state();
  check('damping: settles to rest, z stable', Math.abs(c.vel) < 0.005, `vel=${c.vel.toFixed(5)}`);
}

// 4. max velocity clamp 3.0
{
  const vel = await page.evaluate(() => {
    for (let i = 0; i < 200; i++)
      dispatchEvent(new WheelEvent('wheel', { deltaY: -10000, cancelable: true }));
    return window.__S9_STATE().vel;
  });
  check('max velocity: |vel| ≤ 3.0', Math.abs(vel) <= 3.0, `vel=${vel.toFixed(3)}`);
}

// 5. z clamp: ride max velocity to the far rail, vel zeroed there
{
  await page.evaluate(() => {
    const drive = () => {
      for (let i = 0; i < 50; i++)
        dispatchEvent(new WheelEvent('wheel', { deltaY: -10000, cancelable: true }));
    };
    window.__driveInterval = setInterval(drive, 100);
  });
  let minZ = 50;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(100);
    const s = await state();
    if (s.z < minZ) minZ = s.z;
    if (s.z <= -250) break;
  }
  await page.evaluate(() => clearInterval(window.__driveInterval));
  await page.waitForTimeout(300);
  const s = await state();
  check('z clamp far rail: z never < -250, rests there', minZ >= -250 && s.z === -250, `minZ=${minZ.toFixed(2)} rest=${s.z}`);
  check('rail zeroes velocity', Math.abs(s.vel) < 0.001, `vel=${s.vel.toFixed(5)}`);
}

// 6. near rail: z never exceeds 50
{
  await page.evaluate(() => window.__S9_SET_Z(45));
  await page.evaluate(() => {
    for (let i = 0; i < 200; i++)
      dispatchEvent(new WheelEvent('wheel', { deltaY: 10000, cancelable: true }));
  });
  await page.waitForTimeout(1200);
  const s = await state();
  check('z clamp near rail: z ≤ 50, rests there', s.z === 50, `z=${s.z}`);
}

// 7. glideTo: ease-in-out to target, duration capped
{
  await page.evaluate(() => window.__S9_SET_Z(50));
  await page.evaluate(() => window.__S9_GLIDE(-233 + 13));
  await page.waitForTimeout(200);
  const mid = await state();
  await page.waitForTimeout(3400); // dur = min(3.2, 0.9 + 270/90) = 3.2s
  const end = await state();
  check(
    'glideTo: glide active mid-flight, lands on target, vel=0',
    mid.glide && !end.glide && Math.abs(end.z - -220) < 0.01 && end.vel === 0,
    `mid.glide=${mid.glide} end z=${end.z.toFixed(2)} vel=${end.vel}`,
  );
}

// 8. any manual input cancels a glide
{
  await page.evaluate(() => window.__S9_GLIDE(50));
  await page.waitForTimeout(150);
  const r = await page.evaluate(() => {
    const before = window.__S9_STATE();
    dispatchEvent(new WheelEvent('wheel', { deltaY: -120, cancelable: true }));
    const after = window.__S9_STATE();
    return { before, after };
  });
  check('input cancels glide', r.before.glide && !r.after.glide, JSON.stringify(r.after));
}

// 9. keyboard arrows add velocity
{
  await page.evaluate(() => window.__S9_SET_Z(0));
  await page.waitForTimeout(100);
  const r = await page.evaluate(() => {
    const before = window.__S9_STATE();
    dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    const after = window.__S9_STATE();
    return { before, after };
  });
  check(
    'keyboard: ArrowDown adds -0.4 velocity, not position',
    Math.abs(r.after.vel - (r.before.vel - 0.4)) < 1e-9 && r.after.z === r.before.z,
    `vel ${r.before.vel.toFixed(3)}→${r.after.vel.toFixed(3)}`,
  );
}

writeFileSync('physics-report.json', JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
await browser.close();
process.exit(failed ? 1 : 0);
