/* Production UI shell — recreates the reference DCLogic component in vanilla TS.
   Stage machine: 'entrance' → 'win' → 'studio'. The <shift9-scene> element is
   mounted immediately so the studio is live behind the entrance layers. */
import './shell.css';
import '../engine/scene';
import '../entrance/entrance';
import type { Shift9Scene } from '../engine/scene';
import { PROJECTS, type Project } from '../projects';
import { TWEAKS } from '../constants';
import { audio } from '../audio/engine';

type Stage = 'entrance' | 'win' | 'studio';

interface HudDetail {
  id: string;
  name: string;
  status: string;
  accent: string;
  index: string;
  progress: number;
  idle: boolean;
  dist: number;
  tag: string;
  spec: string;
}

interface WinFile { name: string; meta: string }

const WIN_FILES: Record<string, WinFile[]> = {
  projects: [
    ['WinFix.s9set', 'IN DEV'], ['Omni-3D.s9set', 'IN DEV'],
    ['Automation Sys.s9set', 'IN DEV'], ['INSTRUMENT.s9set', 'IN DEV'],
    ['Titanium Forge.s9set', 'V2 IN DEV'], ['Game Design Forge.s9set', 'IN DEV'],
    ['Midnight Return.s9set', 'IN DEV'], ['Voxel Arcade BB.s9set', 'IN DEV'],
    ['Lumen Mapper.s9set', 'IN DEV'], ['Learning App.s9set', 'IN DEV'],
    ['Flow State.s9set', 'IN DEV'], ['Just a Pinch.s9set', 'LIVE']
  ].map(([name, meta]) => ({ name, meta })),
  labs: [
    ['xavier-agentic-os', 'private repo'], ['relay', 'repo'],
    ['claude-eyes', 'private repo'], ['agentkit', 'private repo'],
    ['second-brain', 'private repo']
  ].map(([name, meta]) => ({ name, meta })),
  renders: [
    ['01_winfix_whiteroom.png', '8K'], ['05_forge_press.png', '8K'],
    ['07_midnight_corridor.png', '8K'], ['09_lumen_boxstack.png', '8K'],
    ['12_pinch_kitchen.png', '8K']
  ].map(([name, meta]) => ({ name, meta }))
};

const WIN_FOLDERS = [
  { id: 'projects', label: 'Projects' },
  { id: 'labs', label: 'Labs' },
  { id: 'renders', label: 'Renders' }
];

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K, className?: string, text?: string
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

export function mountShell(root: HTMLElement): void {
  const projects = PROJECTS.slice().sort((a, b) => a.id.localeCompare(b.id));
  const projectCount = String(projects.length).padStart(2, '0');

  const shell = el('div', 's9-root');
  root.appendChild(shell);

  // Live scene, mounted immediately behind everything.
  const scene = document.createElement('shift9-scene') as Shift9Scene;
  shell.appendChild(scene);

  // Frame layers.
  const vignette = el('div', 's9-vignette');
  const grain = el('div', 's9-grain');
  grain.setAttribute('aria-hidden', 'true');
  const lbTop = el('div', 's9-letterbox-top');
  const lbBottom = el('div', 's9-letterbox-bottom');
  shell.append(vignette, grain, lbTop, lbBottom);

  // ---- HUD ---------------------------------------------------------------
  const hudTop = el('div', 's9-hud-top');
  hudTop.append(
    el('div', 's9-hud-logo', 'SHIFT-9'),
    el('div', 's9-hud-strap', 'THE UNCUT SOUNDSTAGE')
  );
  const hudFade = el('div', 's9-hud-fade');

  const hudRun = el('div', 's9-hud-run');
  const hudLeft = el('div', 's9-hud-left');
  const hudMeta = el('div', 's9-hud-meta');
  const hudIndex = el('span', 's9-hud-index', `12 / ${projectCount}`);
  const hudStatus = el('span', 's9-hud-status', 'LIVE');
  hudStatus.style.color = '#8a8a92';
  hudMeta.append(hudIndex, hudStatus);
  const hudName = el('div', 's9-hud-name', 'Just a Pinch');
  hudName.style.opacity = '0.25';
  hudLeft.append(hudMeta, hudName);
  const hudRight = el('div', 's9-hud-right');
  const progress = el('div', 's9-progress');
  const progressFill = el('div', 's9-progress-fill');
  progress.appendChild(progressFill);
  hudRight.append(el('div', 's9-hud-scroll', 'SCROLL TO DOLLY'), progress);
  hudRun.append(hudLeft, hudRight);

  // ---- idle overlay ------------------------------------------------------
  const idle = el('div', 's9-idle');
  const idleCard = el('div', 's9-idle-card');
  const idleTag = el('div', 's9-idle-tag');
  const idleSpec = el('div', 's9-idle-spec');
  idleCard.append(idleTag, idleSpec, el('div', 's9-idle-cta', 'CLICK THE SET FOR THE FULL DOSSIER'));
  const setsToggle = el('div', 's9-sets-toggle', '▸ ALL SETS 01–12');
  const setsRow = el('div', 's9-sets-row');
  setsRow.hidden = true;
  for (const p of projects) {
    const chip = el('div', 's9-set-chip');
    chip.append(
      el('div', 's9-set-chip-index', p.id.slice(0, 2)),
      el('div', 's9-set-chip-name', p.n)
    );
    chip.addEventListener('click', () => scene.glideTo(p.z + 13));
    setsRow.appendChild(chip);
  }
  let setsOpen = false;
  setsToggle.addEventListener('click', () => {
    setsOpen = !setsOpen;
    setsRow.hidden = !setsOpen;
    setsToggle.textContent = setsOpen ? '▾ HIDE SETS' : '▸ ALL SETS 01–12';
  });
  idle.append(idleCard, setsToggle, setsRow,
    el('div', 's9-idle-standby', 'STANDING BY — CLICK A SET OR SCROLL TO DOLLY'));

  shell.append(hudTop, hudFade, hudRun, idle);

  // ---- HUD updates (targeted, no re-render) ------------------------------
  let lastHud: HudDetail | null = null;
  document.addEventListener('shift9-hud', (e: Event) => {
    const h = (e as CustomEvent<HudDetail>).detail;
    const prev = lastHud;
    lastHud = h;
    if (!prev || prev.index !== h.index || prev.status !== h.status || prev.name !== h.name) {
      hudIndex.textContent = `${h.index} / ${projectCount}`;
      hudStatus.textContent = h.status;
      hudStatus.style.color = h.status !== 'LIVE' ? '#0033FF' : '#8a8a92';
      hudName.textContent = h.name;
    }
    hudName.style.opacity = h.dist < 22 ? '1' : '0.25';
    progressFill.style.width = `${(h.progress * 100).toFixed(1)}%`;
    const idleOn = h.idle && h.progress > 0.01;
    idle.style.opacity = idleOn ? '1' : '0';
    idle.style.pointerEvents = idleOn ? '' : 'none';
    hudRun.style.opacity = idleOn ? '0.12' : '1';
    if (!prev || prev.tag !== h.tag) idleTag.textContent = h.tag;
    if (!prev || prev.spec !== h.spec) idleSpec.textContent = h.spec;
  });

  // ---- dossier page ------------------------------------------------------
  let dossier: HTMLElement | null = null;
  const closeDossier = (): void => {
    if (!dossier) return;
    dossier.remove();
    dossier = null;
    scene.setLocked(false);
  };
  const openDossier = (p: Project): void => {
    closeDossier();
    const page = el('div', 's9-dossier');
    const inner = el('div', 's9-dossier-inner');
    const back = el('div', 's9-dossier-back');
    back.append(el('span', undefined, '←'), el('span', undefined, 'BACK TO STAGE — ESC'));
    back.addEventListener('click', closeDossier);
    const meta = el('div', 's9-dossier-meta');
    const status = el('div', 's9-dossier-status', p.status);
    status.style.color = p.status === 'LIVE' ? '#E0E0E0' : '#4d6bff';
    meta.append(el('div', 's9-dossier-set', `SET ${p.id.slice(0, 2)} / ${projectCount}`), status);
    const facts = el('div', 's9-dossier-facts');
    for (const [k, v] of p.facts) {
      const card = el('div', 's9-fact-card');
      card.append(el('div', 's9-fact-k', k), el('div', 's9-fact-v', v));
      facts.appendChild(card);
    }
    inner.append(back, meta,
      el('div', 's9-dossier-name', p.n),
      el('div', 's9-dossier-tag', p.tag),
      el('div', 's9-dossier-rule'),
      el('div', 's9-dossier-desc', p.desc),
      facts);
    if (p.link) {
      const a = el('a', 's9-dossier-link', 'VISIT LIVE BUILD ↗');
      a.href = p.link;
      a.target = '_blank';
      a.rel = 'noreferrer';
      inner.appendChild(a);
    }
    page.appendChild(inner);
    shell.appendChild(page);
    dossier = page;
    scene.setLocked(true);
    audio.dossierOpen();
  };
  document.addEventListener('shift9-open', (e: Event) => {
    const id = (e as CustomEvent<{ id: string }>).detail.id;
    const p = projects.find((x) => x.id === id);
    if (p) openDossier(p);
  });

  // ---- stage machine -----------------------------------------------------
  let stage: Stage = 'entrance';
  let entrance: HTMLElement | null = document.createElement('shift9-entrance');
  entrance.setAttribute('src', `${import.meta.env.BASE_URL}assets/entrance-video.mp4`);
  shell.appendChild(entrance);

  const skip = el('div', 's9-skip', 'SKIP INTRO');
  shell.appendChild(skip);

  let win: HTMLElement | null = null;
  let clockTimer = 0;

  const enter = (skipIntro: boolean): void => {
    if (stage === 'studio') return;
    stage = 'studio';
    entrance?.remove();
    entrance = null;
    win?.remove();
    win = null;
    skip.remove();
    if (clockTimer) { window.clearInterval(clockTimer); clockTimer = 0; }
    scene.playIntro(skipIntro);
  };
  skip.addEventListener('click', () => enter(true));

  document.addEventListener('entrance-open', () => {
    if (stage !== 'entrance') return;
    stage = 'win';
    entrance?.remove();
    entrance = null;
    win = buildWinScreen(enter);
    shell.insertBefore(win, skip);
    // restart the 15s clock for the win screen
    clockTimer = window.setInterval(() => updateClock(win), 15000);
    updateClock(win);
  });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    if (dossier) { closeDossier(); return; }
    win?.querySelector<HTMLElement>('.s9-folder-window')?.remove();
  });

  // ---- audio wiring ------------------------------------------------------
  const unlock = (): void => audio.ensureStarted();
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);

  const mute = el('button', 's9-mute', 'SOUND ON');
  mute.type = 'button';
  mute.addEventListener('click', () => {
    const muted = audio.toggleMute();
    mute.textContent = muted ? 'SOUND OFF' : 'SOUND ON';
  });
  shell.appendChild(mute);

  // ---- debug panel -------------------------------------------------------
  if (location.search.includes('debug')) {
    shell.appendChild(buildDebugPanel(scene, shell, grain));
  }
}

function updateClock(win: HTMLElement | null): void {
  if (!win) return;
  const now = new Date();
  const time = win.querySelector('.s9-clock-time');
  const date = win.querySelector('.s9-clock-date');
  if (time) time.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (date) date.textContent = now.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' });
}

function buildWinScreen(enter: (skip: boolean) => void): HTMLElement {
  const win = el('div', 's9-win');

  // wallpaper
  const blobs = el('div', 's9-win-blobs');
  blobs.append(el('div', 's9-win-blob-a'), el('div', 's9-win-blob-b'), el('div', 's9-win-band'));
  win.append(blobs, el('div', 's9-win-stars'));

  // desktop icons
  const desk = el('div', 's9-win-desk');
  let folderWindow: HTMLElement | null = null;
  const closeFolder = (): void => { folderWindow?.remove(); folderWindow = null; };
  const openFolder = (id: string, label: string): void => {
    closeFolder();
    const w = el('div', 's9-folder-window');
    const title = el('div', 's9-folder-title');
    const close = el('div', 's9-folder-close', '✕');
    close.addEventListener('click', () => { audio.uiTick(); closeFolder(); });
    title.append(el('div', 's9-folder-name', label), close);
    const list = el('div', 's9-folder-files');
    for (const f of WIN_FILES[id] ?? []) {
      const row = el('div', 's9-folder-file');
      row.append(el('span', undefined, f.name), el('span', 's9-folder-file-meta', f.meta));
      list.appendChild(row);
    }
    w.append(title, list);
    win.insertBefore(w, win.querySelector('.s9-taskbar'));
    folderWindow = w;
  };

  const selectItem = (item: HTMLElement): void => {
    desk.querySelectorAll('.s9--selected').forEach((n) => n.classList.remove('s9--selected'));
    item.classList.add('s9--selected');
  };

  for (const f of WIN_FOLDERS) {
    const item = el('div', 's9-desk-item');
    item.append(el('div', 's9-folder-icon'), el('div', 's9-desk-label', f.label));
    item.addEventListener('click', () => selectItem(item));
    item.addEventListener('dblclick', () => { selectItem(item); openFolder(f.id, f.label); });
    desk.appendChild(item);
  }
  const appItem = el('div', 's9-desk-item');
  const appIcon = el('img', 's9-app-icon');
  appIcon.src = `${import.meta.env.BASE_URL}assets/shift-9icon.png`;
  appIcon.alt = 'SHIFT-9';
  appItem.append(appIcon, el('div', 's9-desk-label', 'SHIFT-9 Studio'));
  appItem.addEventListener('click', () => enter(false));
  desk.appendChild(appItem);
  win.appendChild(desk);

  // taskbar
  const bar = el('div', 's9-taskbar');
  bar.appendChild(el('div', 's9-taskbar-brand', 'SHIFT-9 OS · Win 11 Pro'));
  const center = el('div', 's9-taskbar-center');
  const start = el('div', 's9-start');
  for (let i = 0; i < 4; i++) start.appendChild(el('span'));
  const barApp = el('img', 's9-taskbar-app');
  barApp.src = `${import.meta.env.BASE_URL}assets/shift-9icon.png`;
  barApp.alt = 'SHIFT-9';
  barApp.addEventListener('click', () => enter(false));
  center.append(start, el('div', 's9-search', 'Search'), barApp);
  bar.appendChild(center);
  const tray = el('div', 's9-tray');
  const viewToggle = el('div', 's9-tray-toggle', 'LIST VIEW');
  viewToggle.addEventListener('click', () => {
    const list = win.classList.toggle('s9-win--list');
    viewToggle.textContent = list ? 'ICON VIEW' : 'LIST VIEW';
  });
  const themeToggle = el('div', 's9-tray-toggle', 'LIGHT');
  themeToggle.addEventListener('click', () => {
    const light = win.classList.toggle('s9-win--light');
    themeToggle.textContent = light ? 'DARK' : 'LIGHT';
  });
  const clock = el('div', 's9-clock');
  clock.append(el('span', 's9-clock-time'), el('br'), el('span', 's9-clock-date'));
  tray.append(viewToggle, themeToggle, clock);
  bar.appendChild(tray);
  win.appendChild(bar);

  // audio: clicks tick, hovers blip (throttled ~80ms)
  win.addEventListener('click', () => audio.uiTick());
  let lastHover = 0;
  win.addEventListener('mouseover', (e: MouseEvent) => {
    const t = e.target as HTMLElement | null;
    if (!t?.closest('.s9-desk-item, .s9-tray-toggle, .s9-start, .s9-taskbar-app, .s9-folder-close, .s9-folder-file')) return;
    const now = performance.now();
    if (now - lastHover < 80) return;
    lastHover = now;
    audio.uiHover();
  });

  return win;
}

function buildDebugPanel(scene: Shift9Scene, shell: HTMLElement, grain: HTMLElement): HTMLElement {
  const panel = el('div', 's9-debug');
  panel.appendChild(el('div', undefined, 'TWEAKS'));

  const tweaks: Partial<typeof TWEAKS> = {};
  const range = (
    label: string, key: 'grain' | 'damping' | 'sensitivity' | 'fogFar',
    min: number, max: number, step: number, value: number,
    onChange?: (v: number) => void
  ): void => {
    const row = el('label', undefined, label);
    const input = el('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.addEventListener('input', () => {
      const v = Number(input.value);
      tweaks[key] = v;
      scene.applyTweaks(tweaks);
      onChange?.(v);
    });
    row.appendChild(input);
    panel.appendChild(row);
  };

  let domGrain = false;
  range('GRAIN', 'grain', 0, 0.2, 0.01, TWEAKS.grain, (v) => {
    if (domGrain) grain.style.opacity = String(v);
  });
  range('DAMPING', 'damping', 0.01, 0.3, 0.01, TWEAKS.damping);
  range('SENSITIVITY', 'sensitivity', 0.0002, 0.004, 0.0002, TWEAKS.sensitivity);
  range('FOG FAR', 'fogFar', 25, 120, 5, TWEAKS.fogFar);

  const check = (label: string, value: boolean, onChange: (v: boolean) => void): void => {
    const row = el('label', undefined, label);
    const input = el('input');
    input.type = 'checkbox';
    input.checked = value;
    input.addEventListener('change', () => onChange(input.checked));
    row.appendChild(input);
    panel.appendChild(row);
  };
  check('LETTERBOX', TWEAKS.letterbox, (v) => {
    tweaks.letterbox = v;
    shell.classList.toggle('s9--no-letterbox', !v);
    scene.applyTweaks(tweaks);
  });
  check('DOM GRAIN', false, (v) => {
    domGrain = v;
    grain.style.opacity = v ? String(tweaks.grain ?? TWEAKS.grain) : '0';
  });

  return panel;
}
