/* Procedural Web Audio engine for the Shift-9 studio experience.
   Implements the StudioAudio contract in ./types.ts. All sound is synthesized
   (oscillators + one shared filtered-noise buffer + envelopes); the only asset
   ever fetched is the optional user-droppable /assets/entrance-music.mp3.

   Cinematic and restrained: everything sits well below full scale, and the
   master bus runs through a gentle compressor. */

import type { StudioAudio } from './types';

/* ------------------------------------------------------------------ helpers */

const dB = (v: number): number => Math.pow(10, v / 20);

interface RoomBed {
  /** Crossfade input for the whole bed. */
  gain: GainNode;
  /** Scales the per-room idle-detail layer (0..1). */
  setIdle(k: number): void;
  /** Hard stop + disconnect everything (called only if we ever tear down). */
  dispose(): void;
}

/** A periodic pattern scheduled against context.currentTime with a lookahead
    timer — no setInterval drift, events are sample-accurate. */
class Pattern {
  private nextTime = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;

  constructor(
    private readonly ctx: AudioContext,
    /** Schedule one event at time t; return the delay (sec) until the next. */
    private readonly scheduleOne: (t: number) => number,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private tick = (): void => {
    if (!this.running) return;
    const LOOKAHEAD = 0.4; // seconds of events scheduled ahead
    while (this.nextTime < this.ctx.currentTime + LOOKAHEAD) {
      const interval = this.scheduleOne(this.nextTime);
      this.nextTime += Math.max(0.02, interval);
    }
    this.timer = setTimeout(this.tick, 120);
  };
}

/* ------------------------------------------------------------------- engine */

class Engine implements StudioAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private _muted = false;

  // entrance music
  private entranceNodes: AudioNode[] = [];
  private entrancePatterns: Pattern[] = [];
  private entranceGain: GainNode | null = null;
  private entranceToken = 0;

  // rooms
  private beds = new Map<string, RoomBed>();
  private activeRoom: string | null = null;

  // dolly wind (persistent, gain-driven)
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // ui rate limiting
  private lastUi = new Map<string, number>();

  /* ---------------------------------------------------------- lifecycle */

  get muted(): boolean {
    return this._muted;
  }

  ensureStarted(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    if (ctx.state === 'suspended') void ctx.resume();

    const master = ctx.createGain();
    master.gain.value = this._muted ? 0 : 1;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 24;
    comp.ratio.value = 3;
    comp.attack.value = 0.01;
    comp.release.value = 0.25;
    master.connect(comp);
    comp.connect(ctx.destination);
    this.master = master;
    this.compressor = comp;

    // one shared 2s white-noise buffer for every noisy sound
    const len = Math.floor(ctx.sampleRate * 2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;
  }

  toggleMute(): boolean {
    this._muted = !this._muted;
    if (this.ctx && this.master) {
      const g = this.master.gain;
      g.cancelScheduledValues(this.ctx.currentTime);
      g.setTargetAtTime(this._muted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
    return this._muted;
  }

  /* ------------------------------------------------------ node helpers */

  private live(): { ctx: AudioContext; master: GainNode } | null {
    return this.ctx && this.master && this.noiseBuffer
      ? { ctx: this.ctx, master: this.master }
      : null;
  }

  /** Looped noise source through an optional filter into a new gain node. */
  private noiseLoop(
    filterType: BiquadFilterType,
    freq: number,
    q: number,
    gain: number,
    dest: AudioNode,
  ): { src: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } {
    const ctx = this.ctx as AudioContext;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start();
    return { src, filter, gain: g };
  }

  /** One-shot noise burst with an envelope through a filter. */
  private noiseBurst(
    t: number,
    dur: number,
    filterType: BiquadFilterType,
    freq: number,
    q: number,
    peak: number,
    dest: AudioNode,
    attack = 0.005,
  ): BiquadFilterNode {
    const ctx = this.ctx as AudioContext;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(freq, t);
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start(t);
    src.stop(t + dur + 0.05);
    return filter;
  }

  /** One-shot oscillator blip. */
  private blip(
    t: number,
    type: OscillatorType,
    freq: number,
    dur: number,
    peak: number,
    dest: AudioNode,
    endFreq?: number,
    attack = 0.002,
  ): void {
    const ctx = this.ctx as AudioContext;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + dur);
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  /* --------------------------------------------------- entrance music */

  playEntranceMusic(video: HTMLVideoElement): void {
    const live = this.live();
    if (!live) return;
    this.stopEntranceMusic();
    const token = ++this.entranceToken;
    const { ctx } = live;

    fetch(`${import.meta.env.BASE_URL}assets/entrance-music.mp3`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.arrayBuffer();
      })
      .then((ab) => ctx.decodeAudioData(ab))
      .then((buffer) => {
        if (token !== this.entranceToken || !this.master) return;
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = buffer.duration < video.duration;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.6);
        src.connect(g);
        g.connect(this.master);
        const offset = Number.isFinite(video.currentTime)
          ? video.currentTime % buffer.duration
          : 0;
        src.start(ctx.currentTime, offset);
        this.entranceNodes = [src, g];
        this.entranceGain = g;
      })
      .catch(() => {
        if (token !== this.entranceToken) return;
        this.startProceduralBed();
      });
  }

  /** Procedural cinematic bed: layered detuned low pad through a slow-LFO'd
      lowpass + a very quiet airy noise shimmer. ~-18 dB overall. */
  private startProceduralBed(): void {
    const live = this.live();
    if (!live) return;
    const { ctx, master } = live;
    const t = ctx.currentTime;

    const bed = ctx.createGain();
    bed.gain.setValueAtTime(0, t);
    bed.gain.linearRampToValueAtTime(dB(-18), t + 4); // slow attack
    bed.connect(master);
    this.entranceGain = bed;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    lp.Q.value = 0.5;
    lp.connect(bed);

    // slow LFO on cutoff (300..700 Hz, ~20s period)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 200;
    lfo.connect(lfoAmt);
    lfoAmt.connect(lp.frequency);
    lfo.start(t);

    const nodes: AudioNode[] = [bed, lp, lfo, lfoAmt];
    const voices: Array<{ type: OscillatorType; freq: number; detune: number; level: number }> = [
      { type: 'sine', freq: 55, detune: 0, level: 0.5 },
      { type: 'triangle', freq: 82.4, detune: -7, level: 0.35 },
      { type: 'sine', freq: 110, detune: 6, level: 0.28 },
    ];
    for (const v of voices) {
      const osc = ctx.createOscillator();
      osc.type = v.type;
      osc.frequency.value = v.freq;
      osc.detune.value = v.detune;
      const g = ctx.createGain();
      g.gain.value = v.level;
      osc.connect(g);
      g.connect(lp);
      osc.start(t);
      nodes.push(osc, g);
    }

    // airy shimmer: very quiet high bandpassed noise, slowly breathing
    const shimmer = this.noiseLoop('bandpass', 3200, 1.2, 0.03, bed);
    const breath = ctx.createOscillator();
    breath.type = 'sine';
    breath.frequency.value = 0.08;
    const breathAmt = ctx.createGain();
    breathAmt.gain.value = 0.015;
    breath.connect(breathAmt);
    breathAmt.connect(shimmer.gain.gain);
    breath.start(t);
    nodes.push(shimmer.src, shimmer.filter, shimmer.gain, breath, breathAmt);

    this.entranceNodes = nodes;
  }

  stopEntranceMusic(): void {
    this.entranceToken++;
    if (!this.ctx) return;
    const nodes = this.entranceNodes;
    const g = this.entranceGain;
    this.entranceNodes = [];
    this.entranceGain = null;
    for (const p of this.entrancePatterns) p.stop();
    this.entrancePatterns = [];
    if (!nodes.length) return;
    const t = this.ctx.currentTime;
    if (g) {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + 0.9);
    }
    setTimeout(() => {
      for (const n of nodes) {
        try {
          if (n instanceof AudioBufferSourceNode || n instanceof OscillatorNode) n.stop();
          n.disconnect();
        } catch {
          /* already stopped */
        }
      }
    }, 1000);
  }

  /* ------------------------------------------------------------ foley */

  lidFoley(): void {
    const live = this.live();
    if (!live) return;
    const t = live.ctx.currentTime;
    // scrape: bandpass sweeping ~900 -> 300 Hz over 0.35s
    const f = this.noiseBurst(t, 0.35, 'bandpass', 900, 2.5, dB(-22), live.master, 0.03);
    f.frequency.exponentialRampToValueAtTime(300, t + 0.35);
    // faint click near the end of travel
    this.blip(t + 0.3, 'sine', 1800, 0.02, dB(-26), live.master, 700);
  }

  bootChime(): void {
    const live = this.live();
    if (!live) return;
    const { ctx, master } = live;
    const t = ctx.currentTime;

    // touch of feedback-delay shimmer shared by both notes
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(master);
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.28;
    const fb = ctx.createGain();
    fb.gain.value = 0.3;
    const wet = ctx.createGain();
    wet.gain.value = 0.25;
    bus.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wet);
    wet.connect(master);

    for (const [i, freq] of [660, 990].entries()) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      const t0 = t + i * 0.22;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(dB(-18), t0 + 0.06); // gentle attack
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);
      osc.connect(g);
      g.connect(bus);
      osc.start(t0);
      osc.stop(t0 + 1.3);
    }
    setTimeout(() => {
      for (const n of [bus, delay, fb, wet]) n.disconnect();
    }, 3500);
  }

  /* --------------------------------------------------------------- ui */

  private uiAllowed(key: string): boolean {
    const now = performance.now();
    const last = this.lastUi.get(key) ?? -Infinity;
    if (now - last < 40) return false;
    this.lastUi.set(key, now);
    return true;
  }

  uiTick(): void {
    const live = this.live();
    if (!live || !this.uiAllowed('tick')) return;
    this.noiseBurst(live.ctx.currentTime, 0.015, 'highpass', 2000, 0.8, dB(-26), live.master, 0.001);
  }

  uiHover(): void {
    const live = this.live();
    if (!live || !this.uiAllowed('hover')) return;
    this.blip(live.ctx.currentTime, 'sine', 1000, 0.01, dB(-32), live.master, undefined, 0.001);
  }

  dossierOpen(): void {
    const live = this.live();
    if (!live || !this.uiAllowed('dossier')) return;
    this.blip(live.ctx.currentTime, 'sine', 200, 0.08, dB(-22), live.master, 160, 0.01);
  }

  /* ------------------------------------------------------ tunnel dive */

  tunnelDive(durationSec: number): void {
    const live = this.live();
    if (!live) return;
    const { ctx, master } = live;
    const t = ctx.currentTime;
    const rise = Math.max(0.4, durationSec * 0.8);

    // rising whoosh
    const f = this.noiseBurst(t, rise + 0.4, 'bandpass', 200, 1.5, dB(-16), master, rise);
    f.frequency.exponentialRampToValueAtTime(6000, t + rise);
    f.Q.value = 2;

    // bass drop at ~85% through
    const tDrop = t + durationSec * 0.85;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, tDrop);
    osc.frequency.exponentialRampToValueAtTime(30, tDrop + 1.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, tDrop);
    g.gain.linearRampToValueAtTime(dB(-6), tDrop + 0.03); // strong; compressor tames it
    g.gain.exponentialRampToValueAtTime(0.0001, tDrop + 1.5);
    osc.connect(g);
    g.connect(master);
    osc.start(tDrop);
    osc.stop(tDrop + 1.6);
  }

  /* ------------------------------------------------------- dolly wind */

  setDollyVelocity(v: number): void {
    const live = this.live();
    if (!live) return;
    const { ctx } = live;
    if (!this.windGain) {
      const { filter, gain } = this.noiseLoop('bandpass', 400, 0.8, 0, live.master);
      this.windGain = gain;
      this.windFilter = filter;
    }
    const speed = Math.min(Math.abs(v), 3);
    const target = Math.pow(speed / 3, 1.5) * dB(-20);
    this.windGain.gain.setTargetAtTime(target, ctx.currentTime, 0.08);
    if (this.windFilter) {
      this.windFilter.frequency.setTargetAtTime(400 + speed * 300, ctx.currentTime, 0.1);
    }
  }

  /* ------------------------------------------------------------ rooms */

  setRoom(kind: string | null, idleK: number): void {
    const live = this.live();
    if (!live) return;
    const t = live.ctx.currentTime;
    const XFADE = 1.2;

    if (this.activeRoom !== kind) {
      const prev = this.activeRoom ? this.beds.get(this.activeRoom) : undefined;
      if (prev) {
        prev.gain.gain.cancelScheduledValues(t);
        prev.gain.gain.setValueAtTime(prev.gain.gain.value, t);
        prev.gain.gain.linearRampToValueAtTime(0, t + XFADE);
      }
      this.activeRoom = kind;
      if (kind !== null) {
        const bed = this.beds.get(kind) ?? this.buildBed(kind);
        bed.gain.gain.cancelScheduledValues(t);
        bed.gain.gain.setValueAtTime(bed.gain.gain.value, t);
        bed.gain.gain.linearRampToValueAtTime(1, t + XFADE);
      }
    }
    if (kind !== null) {
      const bed = this.beds.get(kind);
      if (bed) bed.setIdle(Math.max(0, Math.min(1, idleK)));
    }
  }

  /** Lazily build one room bed. Output gain starts at 0 (crossfaded in). */
  private buildBed(kind: string): RoomBed {
    const ctx = this.ctx as AudioContext;
    const master = this.master as GainNode;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(master);

    const idle = ctx.createGain(); // idle-detail layer bus
    idle.gain.value = 0;
    idle.connect(out);

    const nodes: AudioNode[] = [out, idle];
    const patterns: Pattern[] = [];
    const keep = (...n: AudioNode[]): void => {
      nodes.push(...n);
    };
    const loop = (
      type: BiquadFilterType,
      freq: number,
      q: number,
      gain: number,
      dest: AudioNode = out,
    ): ReturnType<Engine['noiseLoop']> => {
      const r = this.noiseLoop(type, freq, q, gain, dest);
      keep(r.src, r.filter, r.gain);
      return r;
    };
    const osc = (
      type: OscillatorType,
      freq: number,
      gain: number,
      dest: AudioNode = out,
      detune = 0,
    ): { osc: OscillatorNode; gain: GainNode } => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = gain;
      o.connect(g);
      g.connect(dest);
      o.start();
      keep(o, g);
      return { osc: o, gain: g };
    };

    switch (kind) {
      case 'kitchen': {
        osc('sine', 120, dB(-30));
        loop('lowpass', 1200, 0.5, dB(-34)); // soft broadband air
        break;
      }
      case 'forge': {
        // periodic low press thuds every ~2.6s (idle-scaled crackle on top)
        patterns.push(
          new Pattern(ctx, (t) => {
            this.blip(t, 'sine', 60, 0.5, dB(-24), out, 40, 0.01);
            return 2.6;
          }),
        );
        // sparse spark crackle — tiny random noise ticks, on the idle bus
        patterns.push(
          new Pattern(ctx, (t) => {
            this.noiseBurst(t, 0.03, 'highpass', 4000, 1, dB(-28), idle, 0.001);
            return 0.15 + Math.random() * 0.8;
          }),
        );
        break;
      }
      case 'corridor': {
        const hiss = loop('lowpass', 1000, 0.6, dB(-30)); // steam hiss
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.15;
        const amt = ctx.createGain();
        amt.gain.value = dB(-30) * 0.5;
        lfo.connect(amt);
        amt.connect(hiss.gain.gain);
        lfo.start();
        keep(lfo, amt);
        // electrical flicker: 100 Hz saw, randomly gated, on idle bus
        const buzz = osc('sawtooth', 100, 0, idle);
        patterns.push(
          new Pattern(ctx, (t) => {
            const on = Math.random() < 0.5;
            buzz.gain.gain.setTargetAtTime(on ? dB(-32) : 0, t, 0.02);
            return 0.1 + Math.random() * 0.5;
          }),
        );
        break;
      }
      case 'arcade': {
        // attract-mode chiptune: two-bar square arpeggio through a lowpass
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2200;
        lp.connect(out);
        keep(lp);
        const seq = [261.6, 329.6, 392, 523.3, 392, 329.6, 261.6, 196,
                     220, 261.6, 329.6, 440, 329.6, 261.6, 220, 164.8];
        let step = 0;
        patterns.push(
          new Pattern(ctx, (t) => {
            this.blip(t, 'square', seq[step % seq.length], 0.14, dB(-28), lp, undefined, 0.005);
            step++;
            return 0.16;
          }),
        );
        break;
      }
      case 'datacenter': {
        loop('lowpass', 800, 0.4, dB(-27)); // steady fan wash
        break;
      }
      case 'fluid': {
        const sub = osc('sine', 45, 0);
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 1 / 8; // 8s swell
        const amt = ctx.createGain();
        amt.gain.value = dB(-24) * 0.5;
        const off = ctx.createConstantSource();
        off.offset.value = dB(-24) * 0.5;
        lfo.connect(amt);
        amt.connect(sub.gain.gain);
        off.connect(sub.gain.gain);
        lfo.start();
        off.start();
        keep(lfo, amt, off);
        break;
      }
      case 'whiteroom':
      case 'lumen': {
        loop('lowpass', 600, 0.5, dB(-40)); // near-silent room tone
        break;
      }
      case 'warehouse': {
        loop('lowpass', 200, 0.7, dB(-28)); // low rumble
        // occasional distant metallic ping, on idle bus
        patterns.push(
          new Pattern(ctx, (t) => {
            const f = 1200 + Math.random() * 1600;
            this.blip(t, 'sine', f, 1.4, dB(-32), idle, f * 0.98, 0.003);
            return 4 + Math.random() * 8;
          }),
        );
        break;
      }
      case 'synth': {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 320;
        lp.Q.value = 0.7;
        lp.connect(out);
        keep(lp);
        osc('sawtooth', 110, dB(-32), lp, -6);
        osc('sawtooth', 110, dB(-32), lp, 7);
        break;
      }
      case 'workbench': {
        osc('sine', 100, dB(-36)); // tiny electronics hum
        // rare pencil-scratch tick, on idle bus
        patterns.push(
          new Pattern(ctx, (t) => {
            this.noiseBurst(t, 0.09, 'bandpass', 2600, 3, dB(-30), idle, 0.02);
            return 5 + Math.random() * 9;
          }),
        );
        break;
      }
      case 'floatcube': {
        // sparse music-box pentatonic plucks, on idle bus (base stays subtle air)
        loop('lowpass', 900, 0.5, dB(-38));
        const penta = [523.3, 587.3, 659.3, 784, 880, 1046.5];
        patterns.push(
          new Pattern(ctx, (t) => {
            const f = penta[Math.floor(Math.random() * penta.length)];
            this.blip(t, 'sine', f, 1.1, dB(-30), idle, undefined, 0.003);
            return 2.5 + Math.random() * 4;
          }),
        );
        break;
      }
      default: {
        loop('lowpass', 600, 0.5, dB(-40)); // unknown kind → quiet room tone
        break;
      }
    }

    for (const p of patterns) p.start();

    const bed: RoomBed = {
      gain: out,
      setIdle: (k: number): void => {
        idle.gain.setTargetAtTime(k, (this.ctx as AudioContext).currentTime, 0.3);
      },
      dispose: (): void => {
        for (const p of patterns) p.stop();
        for (const n of nodes) {
          try {
            if (n instanceof AudioBufferSourceNode || n instanceof OscillatorNode ||
                n instanceof ConstantSourceNode) n.stop();
            n.disconnect();
          } catch {
            /* already stopped */
          }
        }
      },
    };
    this.beds.set(kind, bed);
    return bed;
  }
}

export const audio: StudioAudio = new Engine();
