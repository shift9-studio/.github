/* Builds apps/studio (Vite, base /studio/) and stages its dist into
   public/studio so shift9.dev/studio serves the Uncut Soundstage without any
   Vercel routing config. Runs as part of this app's build. */
import { execSync } from 'node:child_process';
import { rmSync, cpSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const studio = path.resolve(here, '../../studio');
const dest = path.resolve(here, '../public/studio');

execSync('pnpm build', { cwd: studio, stdio: 'inherit' });
rmSync(dest, { recursive: true, force: true });
cpSync(path.join(studio, 'dist'), dest, { recursive: true });
console.log('[build-studio] staged studio dist → public/studio');
