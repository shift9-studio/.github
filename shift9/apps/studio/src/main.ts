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
  // Motion allowed → entrance sequence + engine (built out in Phases 2–7).
  const { startExperience } = await import('./engine/experience');
  await startExperience(app);
}

void boot();
