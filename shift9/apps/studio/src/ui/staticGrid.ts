/* Reduced-motion path — static composite of all 12 sets. No GPU, no Three. */
import './shell.css';
import { PROJECTS } from '../projects';

export function mountStaticGrid(root: HTMLElement): void {
  const wrap = document.createElement('div');
  wrap.className = 's9-static';

  const head = document.createElement('div');
  head.className = 's9-static-head';
  const logo = document.createElement('div');
  logo.className = 's9-static-logo';
  logo.textContent = 'SHIFT-9';
  const note = document.createElement('div');
  note.className = 's9-static-note';
  note.textContent = 'REDUCED MOTION — STATIC COMPOSITE';
  head.append(logo, note);
  wrap.appendChild(head);

  const grid = document.createElement('div');
  grid.className = 's9-static-grid';
  for (const p of PROJECTS.slice().sort((a, b) => a.id.localeCompare(b.id))) {
    const card = document.createElement('div');
    card.className = 's9-static-card';

    const top = document.createElement('div');
    top.className = 's9-static-card-top';
    const index = document.createElement('span');
    index.textContent = p.id.slice(0, 2);
    const status = document.createElement('span');
    status.textContent = p.status;
    status.style.color = p.status === 'LIVE' ? '#E0E0E0' : '#0033FF';
    top.append(index, status);

    const name = document.createElement('div');
    name.className = 's9-static-card-name';
    name.textContent = p.n;

    card.append(top, name);
    grid.appendChild(card);
  }
  wrap.appendChild(grid);
  root.appendChild(wrap);
}
