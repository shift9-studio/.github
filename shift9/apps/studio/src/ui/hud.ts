/* HUD chrome — the consumer of the engine's `shift9-hud` event plumbing.
   Markup and values ported 1:1 from the reference shell
   (handoff/reference/SHIFT-9 Studio.dc.html): letterbox 6.5vh, grain overlay,
   radial vignette, pulsing SHIFT-9 brand row, bottom-left set index/status/
   name (name dims beyond 22 units), bottom-right progress bar (#0033FF).
   The idle dossier overlay, shortcut row and detail pages land in Phase 6;
   the CSS grain/letterbox are superseded by the real post stack in Phase 7. */
import { PROJECTS } from '../projects';
import type { HudDetail } from '../engine/experience';

const el = (cls: string, text?: string): HTMLDivElement => {
  const d = document.createElement('div');
  d.className = cls;
  if (text != null) d.textContent = text;
  return d;
};

export function mountHud(root: HTMLElement): void {
  const count = String(PROJECTS.length).padStart(2, '0');
  // default readout = the set nearest CAMERA_START_Z (12 Just a Pinch)
  const first = [...PROJECTS].sort((a, b) => b.z - a.z)[0];

  const vignette = el('s9-vignette');
  const grain = el('s9-grain');
  const boxTop = el('s9-letterbox s9-letterbox-top');
  const boxBottom = el('s9-letterbox s9-letterbox-bottom');

  const top = el('s9-hud-top');
  top.append(el('s9-brand', 'SHIFT-9'), el('s9-tagline', 'THE UNCUT SOUNDSTAGE'));

  const bottomGrad = el('s9-bottom-grad');

  const run = el('s9-run-hud');
  const left = el('s9-run-left');
  const meta = el('s9-run-meta');
  const index = document.createElement('span');
  index.className = 's9-run-index';
  index.textContent = `${first.id.slice(0, 2)} / ${count}`;
  const status = document.createElement('span');
  status.className = 's9-run-status';
  status.textContent = first.status;
  meta.append(index, status);
  const name = el('s9-run-name', first.n);
  left.append(meta, name);
  const right = el('s9-run-right');
  const bar = el('s9-progress');
  const fill = el('s9-progress-fill');
  bar.append(fill);
  right.append(el('s9-scroll-hint', 'SCROLL TO DOLLY'), bar);
  run.append(left, right);

  root.append(vignette, grain, boxTop, boxBottom, top, bottomGrad, run);

  document.addEventListener('shift9-hud', (e) => {
    const h: HudDetail = e.detail;
    index.textContent = `${h.index} / ${count}`;
    status.textContent = h.status;
    status.style.color = h.status !== 'LIVE' ? '#0033FF' : '#8a8a92';
    name.textContent = h.name;
    name.style.opacity = h.dist < 22 ? '1' : '0.25';
    fill.style.width = `${(h.progress * 100).toFixed(1)}%`;
  });
}
