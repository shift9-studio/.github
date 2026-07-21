/* SHIFT-9 audio — full Web Audio redo (Known Open Item, owned here).
   Cinematic and restrained: procedural score + SFX, no samples required.
   - Entrance music replacement: the video plays MUTED and a synced score is layered
     over it. Drop a file at /assets/entrance-score.mp3 to replace the procedural
     score — the engine prefers the file when it exists (swappable by design).
   - Master bus with gentle compression; mute toggle in the HUD; autoplay-safe
     (context resumes on first user gesture). */

type RoomKind = string | null;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private comp!: DynamicsCompressorNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private roomBus!: GainNode;
  private windGain!: GainNode;
  private windFilter!: BiquadFilterNode;
  private muted = false;
  private roomNodes: AudioNode[] = [];
  private roomTimers: number[] = [];
  private currentRoom: RoomKind = null;
  private entranceEl: HTMLAudioElement | null = null;
  private entranceNodes: AudioNode[] = [];
  private noiseBuf: AudioBuffer | null = null;
  onMuteChange: (muted: boolean) => void = () => {};

  /* Autoplay policy: call from any user-gesture handler. Safe to call repeatedly. */
  unlock() {
    if (!this.ctx) {
      const ctx = this.ctx = new AudioContext();
      this.master = ctx.createGain(); this.master.gain.value = 0.9;
      this.comp = ctx.createDynamicsCompressor();      // gentle glue on the master bus
      this.comp.threshold.value = -18; this.comp.knee.value = 24;
      this.comp.ratio.value = 2.5; this.comp.attack.value = 0.02; this.comp.release.value = 0.3;
      this.comp.connect(this.master); this.master.connect(ctx.destination);
      this.musicBus = ctx.createGain(); this.musicBus.gain.value = 0.7; this.musicBus.connect(this.comp);
      this.sfxBus = ctx.createGain(); this.sfxBus.gain.value = 0.8; this.sfxBus.connect(this.comp);
      this.roomBus = ctx.createGain(); this.roomBus.gain.value = 0.5; this.roomBus.connect(this.comp);
      // velocity-linked dolly wind: looping noise through a lowpass, gain follows |vel|
      this.windFilter = ctx.createBiquadFilter(); this.windFilter.type = 'bandpass';
      this.windFilter.frequency.value = 320; this.windFilter.Q.value = 0.6;
      this.windGain = ctx.createGain(); this.windGain.gain.value = 0;
      const wind = this.noiseSource(true);
      wind.connect(this.windFilter); this.windFilter.connect(this.windGain); this.windGain.connect(this.comp);
      wind.start();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  get isMuted() { return this.muted; }
  toggleMute() {
    this.unlock();
    this.muted = !this.muted;
    const t = this.ctx!.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.linearRampToValueAtTime(this.muted ? 0 : 0.9, t + 0.15);
    this.onMuteChange(this.muted);
  }

  private noise(): AudioBuffer {
    const ctx = this.ctx!;
    if (!this.noiseBuf) {
      const len = ctx.sampleRate * 2;
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return this.noiseBuf;
  }
  private noiseSource(loop: boolean) {
    const s = this.ctx!.createBufferSource(); s.buffer = this.noise(); s.loop = loop; return s;
  }
  private env(bus: AudioNode, peak: number, a: number, d: number, when = 0) {
    const ctx = this.ctx!, g = ctx.createGain();
    const t = ctx.currentTime + when;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    g.connect(bus);
    return { g, t };
  }
  private tone(freq: number, type: OscillatorType, peak: number, a: number, d: number, bus?: AudioNode, when = 0, glideTo?: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const { g, t } = this.env(bus ?? this.sfxBus, peak, a, d, when);
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glideTo !== undefined) o.frequency.exponentialRampToValueAtTime(glideTo, t + a + d);
    o.connect(g); o.start(t); o.stop(t + a + d + 0.05);
  }
  private hiss(peak: number, a: number, d: number, freq: number, q: number, bus?: AudioNode, when = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const { g, t } = this.env(bus ?? this.sfxBus, peak, a, d, when);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const n = this.noiseSource(false); n.connect(f); f.connect(g);
    n.start(t); n.stop(t + a + d + 0.05);
  }

  /* ── entrance score (music replacement over the muted video) ── */
  startEntranceScore(_video: HTMLVideoElement) {
    this.unlock();
    const el = new Audio('/assets/entrance-score.mp3');   // user drop-in wins
    el.loop = false;
    el.addEventListener('canplaythrough', () => {
      if (this.entranceEl !== el) return;
      const src = this.ctx!.createMediaElementSource(el);
      src.connect(this.musicBus);
      this.entranceNodes.push(src);
      void el.play();
    }, { once: true });
    el.addEventListener('error', () => { if (this.entranceEl === el) this.proceduralEntranceScore(); }, { once: true });
    this.entranceEl = el;
    el.load();
  }
  private proceduralEntranceScore() {
    // restrained monochrome pad: slow detuned drone + airy shimmer, ends on black with the video
    const ctx = this.ctx!; if (!ctx) return;
    const g = ctx.createGain(); g.gain.value = 0;
    g.connect(this.musicBus); this.entranceNodes.push(g);
    const t = ctx.currentTime;
    g.gain.linearRampToValueAtTime(0.22, t + 3);
    for (const [f, det] of [[55, 0], [110, 3], [164.8, -4], [220, 6]] as const) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 0.4;
      o.connect(lp); lp.connect(g); o.start();
      this.entranceNodes.push(o, lp);
    }
    const airF = ctx.createBiquadFilter(); airF.type = 'bandpass'; airF.frequency.value = 2400; airF.Q.value = 2;
    const airG = ctx.createGain(); airG.gain.value = 0.03;
    const n = this.noiseSource(true); n.connect(airF); airF.connect(airG); airG.connect(g); n.start();
    this.entranceNodes.push(n, airF, airG);
  }
  endEntranceScore() {
    if (!this.ctx) { this.entranceEl = null; return; }
    const t = this.ctx.currentTime;
    if (this.entranceEl) { const el = this.entranceEl; this.entranceEl = null; try { el.pause(); } catch { /* noop */ } }
    for (const n of this.entranceNodes) {
      if (n instanceof GainNode) { n.gain.cancelScheduledValues(t); n.gain.linearRampToValueAtTime(0, t + 0.9); }
      if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) { try { n.stop(t + 1); } catch { /* already stopped */ } }
    }
    this.entranceNodes = [];
  }

  /* ── desk scene foley ── */
  lidFoley() { // soft hinge creak + felt thud
    this.hiss(0.10, 0.05, 0.5, 900, 3);
    this.tone(120, 'sine', 0.10, 0.01, 0.22, this.sfxBus, 0.55);
  }
  bootChime() { // soft two-note boot
    this.tone(523.25, 'sine', 0.07, 0.02, 0.5);
    this.tone(783.99, 'sine', 0.05, 0.02, 0.7, this.sfxBus, 0.18);
  }

  /* ── Windows screen UI ── */
  uiTick() { this.tone(1600, 'square', 0.025, 0.002, 0.05); }
  uiHover() { this.tone(2200, 'sine', 0.012, 0.002, 0.04); }

  /* ── tunnel dive: rising whoosh + bass drop ── */
  tunnelDive() {
    this.unlock();
    const ctx = this.ctx!;
    const { g, t } = this.env(this.sfxBus, 0.5, 2.0, 0.9);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(150, t); f.frequency.exponentialRampToValueAtTime(4200, t + 2.2);
    const n = this.noiseSource(false); n.connect(f); f.connect(g);
    n.start(t); n.stop(t + 3);
    this.tone(72, 'sine', 0.5, 0.02, 1.6, this.sfxBus, 2.35, 34); // the drop lands as the tunnel ends
  }

  /* ── idle dossier fade-in tick ── */
  idleTick() { this.tone(1180, 'sine', 0.02, 0.004, 0.09); }

  /* ── velocity-linked dolly wind ── */
  setDollyVelocity(v: number) {
    if (!this.ctx || this.muted) return;
    const a = Math.min(Math.abs(v) / 3, 1);
    const t = this.ctx.currentTime;
    this.windGain.gain.setTargetAtTime(a * a * 0.35, t, 0.12);
    this.windFilter.frequency.setTargetAtTime(240 + a * 900, t, 0.15);
  }

  /* ── low room-tone per set ── */
  setRoom(kind: RoomKind) {
    if (kind === this.currentRoom || !this.ctx) return;
    this.currentRoom = kind;
    const ctx = this.ctx, t = ctx.currentTime;
    for (const n of this.roomNodes) {
      if (n instanceof GainNode) { n.gain.cancelScheduledValues(t); n.gain.linearRampToValueAtTime(0, t + 0.8); }
      if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) { try { n.stop(t + 1); } catch { /* stopped */ } }
    }
    for (const id of this.roomTimers) clearInterval(id);
    this.roomNodes = []; this.roomTimers = [];
    if (!kind) return;
    const bed = ctx.createGain(); bed.gain.value = 0;
    bed.gain.linearRampToValueAtTime(1, t + 1.2);
    bed.connect(this.roomBus); this.roomNodes.push(bed);
    const drone = (freq: number, type: OscillatorType, lvl: number, lpf = 600) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = lpf;
      const gg = ctx.createGain(); gg.gain.value = lvl;
      o.connect(lp); lp.connect(gg); gg.connect(bed); o.start();
      this.roomNodes.push(o, lp, gg);
    };
    const wash = (freq: number, q: number, lvl: number) => {
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
      const gg = ctx.createGain(); gg.gain.value = lvl;
      const n = this.noiseSource(true); n.connect(f); f.connect(gg); gg.connect(bed); n.start();
      this.roomNodes.push(n, f, gg);
    };
    const every = (ms: number, fn: () => void) => { this.roomTimers.push(window.setInterval(fn, ms)); };
    switch (kind) {
      case 'kitchen':    drone(120, 'sine', 0.05); wash(3800, 6, 0.008); break;                       // fridge hum + air
      case 'forge':      drone(49, 'sawtooth', 0.06, 180); wash(700, 2, 0.02);                        // press bed
        every(2618, () => { this.hiss(0.16, 0.01, 0.35, 500, 1.5, this.roomBus);                      // press hit (~sin 1.2Hz cycle)
          for (let i = 0; i < 4; i++) this.hiss(0.03, 0.005, 0.12, 3000 + Math.random() * 4000, 8, this.roomBus, Math.random() * 0.3); }); // spark crackle
        break;
      case 'corridor':   drone(55, 'triangle', 0.05); wash(1600, 3, 0.015);                           // steam hiss
        every(1900, () => { if (Math.random() < 0.6) this.tone(3200, 'square', 0.012, 0.002, 0.06, this.roomBus); }); // flicker buzz
        break;
      case 'arcade': {   // attract-mode chiptune bed, quiet and looping
        const seq = [523.25, 659.25, 783.99, 659.25, 880, 783.99, 659.25, 523.25];
        let i = 0;
        every(280, () => { this.tone(seq[i++ % seq.length], 'square', 0.015, 0.004, 0.16, this.roomBus); });
        drone(65, 'sine', 0.04); break;
      }
      case 'datacenter': wash(900, 0.7, 0.045); wash(2400, 1.2, 0.012); break;                        // fan wash
      case 'fluid':      drone(41, 'sine', 0.09, 120);                                                // sub-bass swells
        every(3400, () => this.tone(41, 'sine', 0.12, 1.2, 1.6, this.roomBus)); break;
      default:           drone(60, 'sine', 0.035); wash(500, 1, 0.008); break;                        // generic low room tone
    }
  }
}
