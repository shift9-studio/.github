/* SHIFT-9 Studio — boot.
   Order is a hard contract (ORIGINAL_PROMPT §5): the reduced-motion check runs
   BEFORE any GPU context mounts. Reduce → static composite grid, no 3D loop. */
import './styles.css';
import { checkMotionPreference } from './accessibility';
import { PROJECTS } from './projects';

const app = document.getElementById('app')!;

function renderStaticGrid(): void {
  const grid = document.createElement('div');
  grid.className = 's9-static-grid';

  const h1 = document.createElement('h1');
  h1.textContent = 'SHIFT-9';
  const sub = document.createElement('div');
  sub.className = 's9-sub';
  sub.textContent = 'THE UNCUT SOUNDSTAGE';
  grid.append(h1, sub);

  const cards = document.createElement('div');
  cards.className = 's9-cards';
  for (const p of [...PROJECTS].sort((a, b) => b.z - a.z)) {
    const card = document.createElement('article');
    card.className = 's9-card';
    const idx = document.createElement('div');
    idx.className = 's9-idx';
    idx.textContent = `SET ${p.id.slice(0, 2)} / 12`;
    const name = document.createElement('div');
    name.className = 's9-name';
    name.textContent = p.n;
    const status = document.createElement('div');
    status.className = `s9-status${p.status === 'LIVE' ? ' live' : ''}`;
    status.textContent = p.status;
    card.append(idx, name, status);
    cards.append(card);
  }
  grid.append(cards);
  app.append(grid);
}

async function boot(): Promise<void> {
  if (checkMotionPreference()) {
    renderStaticGrid();
    return;
  }
  // Motion allowed → engine + HUD. Boot dives straight through the tunnel
  // into the studio; the full entrance sequence (video → desk → Windows 11)
  // goes in front of it in Phase 5. `?skip-intro` jumps to CAMERA_START_Z
  // (used by the screenshot harness; the visible SKIP INTRO control returns
  // with the entrance stages in Phase 5).
  const [{ startExperience }, { mountHud }] = await Promise.all([
    import('./engine/experience'),
    import('./ui/hud'),
  ]);
  const engine = await startExperience(app);
  mountHud(app); // overlays mount above the canvas, as in the reference shell
  engine.playIntro(new URLSearchParams(location.search).has('skip-intro'));
}

void boot();
