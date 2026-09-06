/* Stage 3 — interactive Windows 11 Pro screen (DOM). 1:1 port of the reference
   shell's win state: b&w galaxy live wallpaper, desktop icons with folder windows,
   glass taskbar with view/theme toggles and a live clock. */
import type { AudioEngine } from '../audio/engine';

const FILES: Record<string, [string, string][]> = {
  projects: [['WinFix.s9set', 'IN DEV'], ['Omni-3D.s9set', 'IN DEV'], ['Automation Sys.s9set', 'IN DEV'], ['INSTRUMENT.s9set', 'IN DEV'], ['Titanium Forge.s9set', 'V2 IN DEV'], ['Game Design Forge.s9set', 'IN DEV'], ['Midnight Return.s9set', 'IN DEV'], ['Voxel Arcade BB.s9set', 'IN DEV'], ['Lumen Mapper.s9set', 'IN DEV'], ['Learning App.s9set', 'IN DEV'], ['Flow State.s9set', 'IN DEV'], ['Just a Pinch.s9set', 'LIVE']],
  labs: [['xavier-agentic-os', 'private repo'], ['relay', 'repo'], ['claude-eyes', 'private repo'], ['agentkit', 'private repo'], ['second-brain', 'private repo']],
  renders: [['01_winfix_whiteroom.png', '8K'], ['05_forge_press.png', '8K'], ['07_midnight_corridor.png', '8K'], ['09_lumen_boxstack.png', '8K'], ['12_pinch_kitchen.png', '8K']]
};
const FOLDERS = [
  { id: 'projects', label: 'Projects' },
  { id: 'labs', label: 'Labs' },
  { id: 'renders', label: 'Renders' }
];

export class WinScreen {
  el: HTMLDivElement;
  onLaunch: () => void = () => {};
  private dark = true;
  private grid = true;
  private selected: string | null = null;
  private folder: string | null = null;
  private clockTimer = 0;
  private audio: AudioEngine;

  constructor(audio: AudioEngine) {
    this.audio = audio;
    this.el = document.createElement('div');
    this.el.className = 's9-win';
    this.el.setAttribute('aria-label', 'Windows 11');
    this.render();
    this.clockTimer = window.setInterval(() => this.updateClock(), 15000);
  }

  handleEscape(): boolean {
    if (this.folder) { this.folder = null; this.render(); return true; }
    return false;
  }

  dispose() { clearInterval(this.clockTimer); this.el.remove(); }

  private th() {
    const dark = this.dark;
    return {
      wpBase: dark ? 'radial-gradient(ellipse at 32% 36%,#1c1f26 0%,#0b0c10 52%,#020204 100%)' : 'radial-gradient(ellipse at 32% 36%,#ffffff 0%,#e2e5ea 55%,#c6cad2 100%)',
      wpBlobA: dark ? 'radial-gradient(circle,rgba(255,255,255,0.30),transparent 70%)' : 'radial-gradient(circle,rgba(90,96,108,0.32),transparent 70%)',
      wpBlobB: dark ? 'radial-gradient(circle,rgba(175,185,200,0.22),transparent 70%)' : 'radial-gradient(circle,rgba(40,44,52,0.24),transparent 70%)',
      starOpacity: dark ? '0.95' : '0.3',
      wpBand: dark ? 'linear-gradient(rgba(255,255,255,0.0),rgba(235,240,250,0.14),rgba(255,255,255,0.0))' : 'linear-gradient(rgba(40,44,52,0.0),rgba(40,44,52,0.12),rgba(40,44,52,0.0))',
      wBar: dark ? 'rgba(15,18,28,0.82)' : 'rgba(242,246,252,0.85)',
      wWin: dark ? '#1d2130' : '#ffffff',
      wText: dark ? '#e8eaf2' : '#1b1d24',
      wBorder: dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.12)',
      wHover: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
      wIconShadow: dark ? '0 1px 4px rgba(0,0,0,0.8)' : '0 1px 3px rgba(255,255,255,0.7)',
      wSelect: dark ? 'rgba(77,150,255,0.28)' : 'rgba(0,90,200,0.18)'
    };
  }

  private hover(el: HTMLElement, bg: string) {
    el.addEventListener('mouseenter', () => { el.style.background = bg; this.audio.uiHover(); });
    el.addEventListener('mouseleave', () => { el.style.background = el.dataset.baseBg ?? 'transparent'; });
  }

  private render() {
    const t = this.th();
    this.el.innerHTML = '';
    this.el.style.background = t.wpBase;

    const blobs = document.createElement('div'); blobs.className = 's9-win-blobs';
    const bA = document.createElement('div'); bA.className = 's9-win-blob-a'; bA.style.background = t.wpBlobA;
    const bB = document.createElement('div'); bB.className = 's9-win-blob-b'; bB.style.background = t.wpBlobB;
    const band = document.createElement('div'); band.className = 's9-win-band'; band.style.background = t.wpBand;
    blobs.append(bA, bB, band);
    const stars = document.createElement('div'); stars.className = 's9-win-stars'; stars.style.opacity = t.starOpacity;
    this.el.append(blobs, stars);

    // desktop icons (top-left, Windows-style column flow)
    const icons = document.createElement('div'); icons.className = 's9-win-icons';
    const items = [...FOLDERS.map(f => ({ ...f, app: false })), { id: 's9', label: 'SHIFT-9 Studio', app: true }];
    for (const it of items) {
      const d = document.createElement('div');
      d.className = 's9-win-icon';
      d.style.flexDirection = this.grid ? 'column' : 'row';
      d.style.gap = this.grid ? '6px' : '12px';
      d.style.width = this.grid ? '96px' : '280px';
      const baseBg = this.selected === it.id ? t.wSelect : 'transparent';
      d.style.background = baseBg; d.dataset.baseBg = baseBg;
      this.hover(d, this.selected === it.id ? t.wSelect : t.wHover);
      if (it.app) {
        const img = document.createElement('img');
        img.src = '/assets/shift-9icon.png'; img.alt = 'SHIFT-9'; img.className = 's9-win-app-icon';
        d.appendChild(img);
      } else {
        const glyph = document.createElement('div'); glyph.className = 's9-win-folder-glyph';
        const tab = document.createElement('div'); tab.className = 's9-win-folder-tab';
        const body = document.createElement('div'); body.className = 's9-win-folder-body';
        glyph.append(tab, body); d.appendChild(glyph);
      }
      const label = document.createElement('div');
      label.className = 's9-win-icon-label'; label.textContent = it.label;
      label.style.color = t.wText; label.style.textShadow = t.wIconShadow;
      d.appendChild(label);
      d.addEventListener('click', () => {
        this.audio.uiTick();
        if (it.app) { this.onLaunch(); return; }
        this.selected = it.id; this.render();
      });
      d.addEventListener('dblclick', () => {
        if (it.app) { this.onLaunch(); return; }
        this.folder = it.id; this.selected = it.id; this.render();
      });
      icons.appendChild(d);
    }
    this.el.appendChild(icons);

    // folder window
    if (this.folder) {
      const win = document.createElement('div'); win.className = 's9-win-window';
      win.style.background = t.wWin; win.style.borderColor = t.wBorder;
      const head = document.createElement('div'); head.className = 's9-win-window-head';
      head.style.borderBottom = `1px solid ${t.wBorder}`;
      const title = document.createElement('div'); title.className = 's9-win-window-title';
      title.textContent = FOLDERS.find(f => f.id === this.folder)?.label ?? '';
      title.style.color = t.wText;
      const close = document.createElement('div'); close.className = 's9-win-close';
      close.textContent = '✕'; close.style.color = t.wText;
      close.addEventListener('click', () => { this.audio.uiTick(); this.folder = null; this.render(); });
      head.append(title, close);
      const list = document.createElement('div'); list.className = 's9-win-files';
      for (const [name, meta] of FILES[this.folder] ?? []) {
        const row = document.createElement('div'); row.className = 's9-win-file';
        row.style.color = t.wText; row.dataset.baseBg = 'transparent';
        this.hover(row, t.wHover);
        const n = document.createElement('span'); n.textContent = name;
        const m = document.createElement('span'); m.textContent = meta;
        row.append(n, m); list.appendChild(row);
      }
      win.append(head, list);
      this.el.appendChild(win);
    }

    // taskbar (48px, blurred glass)
    const bar = document.createElement('div'); bar.className = 's9-win-taskbar';
    bar.style.background = t.wBar; bar.style.borderTop = `1px solid ${t.wBorder}`;
    const os = document.createElement('div'); os.className = 's9-win-oslabel';
    os.textContent = 'SHIFT-9 OS · Win 11 Pro'; os.style.color = t.wText;
    const center = document.createElement('div'); center.className = 's9-win-center';
    const start = document.createElement('div'); start.className = 's9-win-start';
    for (let i = 0; i < 4; i++) start.appendChild(document.createElement('div'));
    const search = document.createElement('div'); search.className = 's9-win-search';
    search.textContent = 'Search'; search.style.background = t.wHover; search.style.borderColor = t.wBorder; search.style.color = t.wText;
    const tbIcon = document.createElement('img');
    tbIcon.src = '/assets/shift-9icon.png'; tbIcon.alt = 'SHIFT-9'; tbIcon.className = 's9-win-tb-icon';
    tbIcon.addEventListener('click', () => { this.audio.uiTick(); this.onLaunch(); });
    center.append(start, search, tbIcon);
    const tray = document.createElement('div'); tray.className = 's9-win-tray'; tray.style.color = t.wText;
    const viewBtn = document.createElement('div'); viewBtn.className = 's9-win-tray-btn';
    viewBtn.textContent = this.grid ? 'LIST VIEW' : 'ICON VIEW'; viewBtn.style.borderColor = t.wBorder;
    viewBtn.dataset.baseBg = 'transparent'; this.hover(viewBtn, t.wHover);
    viewBtn.addEventListener('click', () => { this.audio.uiTick(); this.grid = !this.grid; this.render(); });
    const themeBtn = document.createElement('div'); themeBtn.className = 's9-win-tray-btn';
    themeBtn.textContent = this.dark ? 'LIGHT' : 'DARK'; themeBtn.style.borderColor = t.wBorder;
    themeBtn.dataset.baseBg = 'transparent'; this.hover(themeBtn, t.wHover);
    themeBtn.addEventListener('click', () => { this.audio.uiTick(); this.dark = !this.dark; this.render(); });
    const clock = document.createElement('div'); clock.className = 's9-win-clock';
    this.clockEl = clock; this.updateClock();
    tray.append(viewBtn, themeBtn, clock);
    bar.append(os, center, tray);
    this.el.appendChild(bar);
  }

  private clockEl: HTMLDivElement | null = null;
  private updateClock() {
    if (!this.clockEl) return;
    const now = new Date();
    this.clockEl.innerHTML = '';
    this.clockEl.append(
      now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      document.createElement('br'),
      now.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' })
    );
  }
}
