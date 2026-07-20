/* Builds apps/studio (Vite, base /studio/) and stages its dist into
   public/studio so shift9.dev/studio serves the Uncut Soundstage without any
   Vercel routing config. Runs as part of this app's build.

   Invokes vite directly via node — shelling out to `pnpm build` here resolves
   to the workspace ROOT manifest under Vercel's build env (inherited
   npm_config_* vars) and recurses into `turbo run build`. */
import { execFileSync } from 'node:child_process';
import { rmSync, cpSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const studio = path.resolve(here, '../../studio');
const dest = path.resolve(here, '../public/studio');

// vite's exports map hides bin/, so resolve the entry module and walk to bin/
const viteEntry = createRequire(path.join(studio, 'package.json')).resolve('vite');
const vite = path.resolve(path.dirname(viteEntry), '../../bin/vite.js');
execFileSync(process.execPath, [vite, 'build'], { cwd: studio, stdio: 'inherit' });
rmSync(dest, { recursive: true, force: true });
cpSync(path.join(studio, 'dist'), dest, { recursive: true });
console.log('[build-studio] staged studio dist → public/studio');
