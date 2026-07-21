/* SHIFT-9 shell — stage machine (entrance → win → studio), HUD, idle dossier overlay,
   ALL SETS shortcut row, full-screen dossier pages, reduced-motion static grid, and
   the dev tweaks panel. 1:1 port of the reference HTML shell logic; the CSS grain
   overlay is superseded by the real FilmPass in the post stack. */
import { SCENE_CONSTANTS, TWEAKS } from '../constants';
import { PROJECTS, type Project } from '../projects';
import type { StudioScene, HudDetail } from '../engine/scene';
import type { AudioEngine } from '../audio/engine';
import { Entrance } from '../entrance/entrance';
import { WinScreen } from './windows';

type Stage = 'entrance' | 'win' | 'studio';

export class Shell {
  private app: HTMLElement;
  private audio: AudioEngine;
  private studio: StudioScene;
  private stage: Stage = 'entrance';
  private entrance: Entrance | null = null;
  private win: WinScreen | null = null;
  private open: Project | null = null;
  private setsOpen = false;
  private lastHud: HudDetail | null = null;
  private wasIdle = false;

  // live element refs
  private hudBottom!: HTMLDivElement;
  private hudIndex!: HTMLSpanElement;
  private hudStatus!: HTMLSpanElement;
  private hudName!: HTMLDivElement;
  private progressFill!: HTMLDivElement;
  private idleWrap!: HTMLDivElement;
  private idleTag!: HTMLDivElement;
  private idleSpec!: HTMLDivElement;
  private setsToggle!: HTMLDivElement;
  private setsRow!: HTMLDivElement;
  private detailHost!: HTMLDivElement;
  private skipBtn!: HTMLDivElement;
  private entranceHost!: HTMLDivElement;
  private winHost!: HTMLDivElement;
  private letterTop!: HTMLDivElement;
  private letterBottom!: HTMLDivElement;
  private audioBtn!: HTMLDivElement;
  private tweaksPanel: HTMLDivElement | null = null;

  constructor(app: HTMLElement, studio: StudioScene, audio: AudioEngine) {
    this.app = app;
    this.studio = studio;
    this.audio = audio;
    this.build();
    studio.onHud = d => this.applyHud(d);
    studio.onOpen = id => this.openDetail(id);
    studio.onFrame = () => {
      const s = studio.state;
      this.audio.setDollyVelocity(s.glide ? 1.2 : s.vel);
      if (this.lastHud && this.stage === 'studio' && !s.intro) this.audio.setRoom(this.roomFor(this.lastHud.id));
    };
    addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (this.open) this.closeDetail();
        else if (this.win?.handleEscape()) { /* folder closed */ }
      }
      if (e.key === '`') this.toggleTweaks();
    });
    // autoplay policy: resume audio on the first real gesture
    const unlock = () => { this.audio.unlock(); removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock); };
    addEventListener('pointerdown', unlock); addEventListener('keydown', unlock);
    this.startEntrance();
  }

  private roomFor(id: string): string {
    const p = PROJECTS.find(x => x.id === id);
    switch (p?.kind) {
      case 'kitchen': return 'kitchen';
      case 'forge': return 'forge';
      case 'corridor': return 'corridor';
      case 'arcade': return 'arcade';
      case 'datacenter': return 'datacenter';
      case 'fluid': return 'fluid';
      default: return 'generic';
    }
  }

  private build() {
    const a = this.app;
    // vignette
    const vig = document.createElement('div'); vig.className = 's9-vignette'; a.appendChild(vig);
    // letterbox bars
    this.letterTop = document.createElement('div'); this.letterTop.className = 's9-letterbox-top';
    this.letterBottom = document.createElement('div'); this.letterBottom.className = 's9-letterbox-bottom';
    a.append(this.letterTop, this.letterBottom);
    // HUD top
    const hudTop = document.createElement('div'); hudTop.className = 's9-hud-top';
    const logo = document.createElement('div'); logo.className = 's9-logo'; logo.textContent = 'SHIFT-9';
    const tag = document.createElement('div'); tag.className = 's9-tagline'; tag.textContent = 'THE UNCUT SOUNDSTAGE';
    hudTop.append(logo, tag); a.appendChild(hudTop);
    // HUD bottom
    const fade = document.createElement('div'); fade.className = 's9-hud-fade'; a.appendChild(fade);
    this.hudBottom = document.createElement('div'); this.hudBottom.className = 's9-hud-bottom';
    const left = document.createElement('div'); left.className = 's9-hud-left';
    const meta = document.createElement('div'); meta.className = 's9-hud-meta';
    this.hudIndex = document.createElement('span'); this.hudIndex.className = 's9-hud-index';
    this.hudIndex.textContent = `12 / ${String(PROJECTS.length).padStart(2, '0')}`;
    this.hudStatus = document.createElement('span'); this.hudStatus.className = 's9-hud-status';
    this.hudStatus.textContent = 'LIVE'; this.hudStatus.style.color = '#8a8a92';
    meta.append(this.hudIndex, this.hudStatus);
    this.hudName = document.createElement('div'); this.hudName.className = 's9-hud-name'; this.hudName.textContent = 'Just a Pinch';
    left.append(meta, this.hudName);
    const right = document.createElement('div'); right.className = 's9-hud-right';
    const scroll = document.createElement('div'); scroll.className = 's9-hud-scroll'; scroll.textContent = 'SCROLL TO DOLLY';
    const prog = document.createElement('div'); prog.className = 's9-progress';
    this.progressFill = document.createElement('div'); this.progressFill.className = 's9-progress-fill'; this.progressFill.style.width = '0%';
    prog.appendChild(this.progressFill);
    this.audioBtn = document.createElement('div'); this.audioBtn.className = 's9-audio-toggle';
    this.audioBtn.textContent = 'SOUND ON';
    this.audioBtn.addEventListener('click', () => this.audio.toggleMute());
    this.audio.onMuteChange = m => { this.audioBtn.textContent = m ? 'SOUND OFF' : 'SOUND ON'; };
    right.append(scroll, prog, this.audioBtn);
    this.hudBottom.append(left, right);
    a.appendChild(this.hudBottom);
    // idle overlay
    this.idleWrap = document.createElement('div'); this.idleWrap.className = 's9-idle'; this.idleWrap.style.opacity = '0';
    const scrim = document.createElement('div'); scrim.className = 's9-dossier-scrim';
    this.idleTag = document.createElement('div'); this.idleTag.className = 's9-idle-tag';
    this.idleSpec = document.createElement('div'); this.idleSpec.className = 's9-idle-spec';
    const cta = document.createElement('div'); cta.className = 's9-idle-cta'; cta.textContent = 'CLICK THE SET FOR THE FULL DOSSIER';
    scrim.append(this.idleTag, this.idleSpec, cta);
    this.setsToggle = document.createElement('div'); this.setsToggle.className = 's9-sets-toggle';
    this.setsToggle.textContent = '▸ ALL SETS 01–12';
    this.setsToggle.addEventListener('click', () => {
      this.setsOpen = !this.setsOpen;
      this.audio.uiTick();
      this.setsToggle.textContent = this.setsOpen ? '▾ HIDE SETS' : '▸ ALL SETS 01–12';
      this.setsRow.style.display = this.setsOpen ? 'flex' : 'none';
    });
    this.setsRow = document.createElement('div'); this.setsRow.className = 's9-sets-row'; this.setsRow.style.display = 'none';
    for (const p of [...PROJECTS].sort((x, y) => x.id.localeCompare(y.id))) {
      const chip = document.createElement('div'); chip.className = 's9-set-chip';
      const num = document.createElement('div'); num.className = 's9-set-chip-num'; num.textContent = p.id.slice(0, 2);
      const name = document.createElement('div'); name.className = 's9-set-chip-name'; name.textContent = p.n;
      chip.append(num, name);
      chip.addEventListener('click', () => { this.audio.uiTick(); this.studio.glideTo(p.z + 13); });
      this.setsRow.appendChild(chip);
    }
    const standby = document.createElement('div'); standby.className = 's9-idle-standby';
    standby.textContent = 'STANDING BY — CLICK A SET OR SCROLL TO DOLLY';
    this.idleWrap.append(scrim, this.setsToggle, this.setsRow, standby);
    a.appendChild(this.idleWrap);
    // detail host
    this.detailHost = document.createElement('div'); a.appendChild(this.detailHost);
    // entrance + win hosts (above everything)
    this.entranceHost = document.createElement('div');
    this.entranceHost.style.cssText = 'position:absolute;inset:0;';
    this.winHost = document.createElement('div');
    this.winHost.style.cssText = 'position:absolute;inset:0;display:none;';
    a.append(this.entranceHost, this.winHost);
    // SKIP INTRO — visible through stages 1–3
    this.skipBtn = document.createElement('div'); this.skipBtn.className = 's9-skip'; this.skipBtn.textContent = 'SKIP INTRO';
    this.skipBtn.addEventListener('click', () => this.enterStudio(true));
    a.appendChild(this.skipBtn);
    this.applyTweaks();
  }

  /* ── stage machine ── */
  private startEntrance() {
    this.stage = 'entrance';
    this.entrance = new Entrance(this.entranceHost, this.audio);
    this.entrance.onOpen = () => this.showWin();
  }

  private showWin() {
    if (this.stage !== 'entrance') return;
    this.stage = 'win';
    this.entrance?.dispose(); this.entrance = null;
    this.entranceHost.style.display = 'none';
    this.win = new WinScreen(this.audio);
    this.win.onLaunch = () => this.enterStudio(false);
    this.winHost.style.display = 'block';
    this.winHost.appendChild(this.win.el);
  }

  private enterStudio(skip: boolean) {
    if (this.stage === 'studio') return;
    this.stage = 'studio';
    this.entrance?.dispose(); this.entrance = null;
    this.win?.dispose(); this.win = null;
    this.entranceHost.style.display = 'none';
    this.winHost.style.display = 'none';
    this.skipBtn.style.display = 'none';
    if (!skip) this.audio.tunnelDive();
    this.studio.playIntro(skip);
  }

  /* ── HUD ── */
  private applyHud(h: HudDetail) {
    this.lastHud = h;
    this.hudIndex.textContent = `${h.index} / ${String(PROJECTS.length).padStart(2, '0')}`;
    this.hudStatus.textContent = h.status;
    this.hudStatus.style.color = h.status !== 'LIVE' ? '#0033FF' : '#8a8a92';
    this.hudName.textContent = h.name;
    this.hudName.style.opacity = h.dist < 22 ? '1' : '0.25';
    this.progressFill.style.width = (h.progress * 100).toFixed(1) + '%';
    const idle = h.idle && h.progress > 0.01;
    this.idleWrap.style.opacity = idle ? '1' : '0';
    this.idleWrap.style.pointerEvents = idle ? '' : 'none';
    this.setsToggle.style.pointerEvents = idle ? 'auto' : 'none';
    this.setsRow.style.pointerEvents = idle ? 'auto' : 'none';
    this.hudBottom.style.opacity = idle ? '0.12' : '1';
    this.idleTag.textContent = h.tag;
    this.idleSpec.textContent = h.spec;
    if (idle && !this.wasIdle) this.audio.idleTick();  // idle-dossier fade-in tick
    this.wasIdle = idle;
  }

  /* ── dossier pages ── */
  private openDetail(id: string) {
    const p = PROJECTS.find(x => x.id === id);
    if (!p || this.open) return;
    this.open = p;
    this.studio.setLocked(true);
    this.audio.uiTick();
    const d = document.createElement('div'); d.className = 's9-detail';
    d.setAttribute('aria-label', 'Project dossier');
    const inner = document.createElement('div'); inner.className = 's9-detail-inner';
    const back = document.createElement('div'); back.className = 's9-detail-back';
    back.innerHTML = '<span>←</span><span>BACK TO STAGE — ESC</span>';
    back.addEventListener('click', () => this.closeDetail());
    const meta = document.createElement('div'); meta.className = 's9-detail-meta';
    const set = document.createElement('div'); set.className = 's9-detail-set';
    set.textContent = `SET ${p.id.slice(0, 2)} / ${String(PROJECTS.length).padStart(2, '0')}`;
    const status = document.createElement('div'); status.className = 's9-detail-status';
    status.textContent = p.status;
    status.style.color = p.status === 'LIVE' ? '#E0E0E0' : '#4d6bff';
    meta.append(set, status);
    const name = document.createElement('div'); name.className = 's9-detail-name'; name.textContent = p.n;
    const tagEl = document.createElement('div'); tagEl.className = 's9-detail-tag'; tagEl.textContent = p.tag;
    const rule = document.createElement('div'); rule.className = 's9-detail-rule';
    const desc = document.createElement('div'); desc.className = 's9-detail-desc'; desc.textContent = p.desc;
    const facts = document.createElement('div'); facts.className = 's9-detail-facts';
    for (const [k, v] of p.facts) {
      const f = document.createElement('div'); f.className = 's9-fact';
      const fk = document.createElement('div'); fk.className = 's9-fact-k'; fk.textContent = k;
      const fv = document.createElement('div'); fv.className = 's9-fact-v'; fv.textContent = v;
      f.append(fk, fv); facts.appendChild(f);
    }
    inner.append(back, meta, name, tagEl, rule, desc, facts);
    if (p.link) {
      const link = document.createElement('a'); link.className = 's9-detail-link';
      link.href = p.link; link.target = '_blank'; link.rel = 'noreferrer';
      link.textContent = 'VISIT LIVE BUILD ↗';
      inner.appendChild(link);
    }
    d.appendChild(inner);
    this.detailHost.appendChild(d);
  }

  private closeDetail() {
    this.open = null;
    this.studio.setLocked(false);
    this.audio.uiTick();
    this.detailHost.innerHTML = '';
  }

  /* ── tweaks: letterbox, grain, damping, sensitivity, fogFar, forceStaticGrid ── */
  private applyTweaks() {
    SCENE_CONSTANTS.VELOCITY_DAMPING = TWEAKS.damping;
    SCENE_CONSTANTS.SCROLL_SENSITIVITY = TWEAKS.sensitivity;
    this.studio.setFogFar(TWEAKS.fogFar);
    this.studio.post?.setGrain(TWEAKS.grain);
    const lb = TWEAKS.letterbox ? '' : 'none';
    this.letterTop.style.display = lb; this.letterBottom.style.display = lb;
  }

  private toggleTweaks() {
    if (this.tweaksPanel) { this.tweaksPanel.remove(); this.tweaksPanel = null; return; }
    const p = document.createElement('div'); p.className = 's9-tweaks';
    const title = document.createElement('div'); title.textContent = 'TWEAKS'; title.style.letterSpacing = '0.25em';
    p.appendChild(title);
    const range = (label: string, min: number, max: number, step: number, get: () => number, set: (v: number) => void) => {
      const l = document.createElement('label');
      const s = document.createElement('span'); s.textContent = label;
      const i = document.createElement('input'); i.type = 'range';
      i.min = String(min); i.max = String(max); i.step = String(step); i.value = String(get());
      i.addEventListener('input', () => { set(parseFloat(i.value)); this.applyTweaks(); });
      l.append(s, i); p.appendChild(l);
    };
    const check = (label: string, get: () => boolean, set: (v: boolean) => void) => {
      const l = document.createElement('label');
      const s = document.createElement('span'); s.textContent = label;
      const i = document.createElement('input'); i.type = 'checkbox'; i.checked = get();
      i.addEventListener('change', () => { set(i.checked); this.applyTweaks(); });
      l.append(s, i); p.appendChild(l);
    };
    check('LETTERBOX', () => TWEAKS.letterbox, v => { TWEAKS.letterbox = v; });
    range('GRAIN', 0, 0.2, 0.01, () => TWEAKS.grain, v => { TWEAKS.grain = v; });
    range('DAMPING', 0.01, 0.3, 0.01, () => TWEAKS.damping, v => { TWEAKS.damping = v; });
    range('SENSITIVITY', 0.0002, 0.004, 0.0002, () => TWEAKS.sensitivity, v => { TWEAKS.sensitivity = v; });
    range('FOG FAR', 25, 120, 5, () => TWEAKS.fogFar, v => { TWEAKS.fogFar = v; });
    check('FORCE STATIC GRID', () => TWEAKS.forceStaticGrid, v => { TWEAKS.forceStaticGrid = v; if (v) { location.search = '?static=1'; } });
    this.tweaksPanel = p;
    this.app.appendChild(p);
  }
}

/* Reduced-motion fallback: static composite grid of all 12 with text overlays. */
export function renderStaticGrid(app: HTMLElement) {
  const wrap = document.createElement('div'); wrap.className = 's9-static';
  const head = document.createElement('div'); head.className = 's9-static-head';
  const logo = document.createElement('div'); logo.className = 's9-static-logo'; logo.textContent = 'SHIFT-9';
  const note = document.createElement('div'); note.className = 's9-static-note'; note.textContent = 'REDUCED MOTION — STATIC COMPOSITE';
  head.append(logo, note);
  const grid = document.createElement('div'); grid.className = 's9-static-grid';
  for (const p of [...PROJECTS].sort((a, b) => a.id.localeCompare(b.id))) {
    const card = document.createElement('div'); card.className = 's9-static-card';
    const top = document.createElement('div'); top.className = 's9-static-card-top';
    const idx = document.createElement('span'); idx.textContent = p.id.slice(0, 2);
    const st = document.createElement('span'); st.textContent = p.status;
    st.style.color = p.status === 'LIVE' ? '#E0E0E0' : '#0033FF';
    top.append(idx, st);
    const name = document.createElement('div'); name.className = 's9-static-card-name'; name.textContent = p.n;
    card.append(top, name); grid.appendChild(card);
  }
  wrap.append(head, grid);
  app.appendChild(wrap);
}
