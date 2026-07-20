/* Contract for the studio-wide Web Audio engine (implemented in ./engine.ts).
   All methods are safe to call before the context is unlocked — the engine
   queues/ignores until ensureStarted() has run inside a user gesture. */
export interface StudioAudio {
  /** Call from any user gesture handler; idempotent. Unlocks the AudioContext. */
  ensureStarted(): void;
  readonly muted: boolean;
  /** Returns the new muted state. */
  toggleMute(): boolean;
  /** Entrance video plays muted; this layers the replacement music, synced to it.
      Looks for /assets/entrance-music.mp3 first (user-droppable swap file),
      falls back to a procedural cinematic bed. */
  playEntranceMusic(video: HTMLVideoElement): void;
  stopEntranceMusic(): void;
  lidFoley(): void;       // laptop lid opening
  bootChime(): void;      // soft boot chime when the screen powers on
  uiTick(): void;         // Windows screen clicks
  uiHover(): void;        // Windows screen hover blips
  tunnelDive(durationSec: number): void; // rising whoosh + bass drop
  /** Low room-tone per set kind (null = silence). idleK 0..1 scales idle layers. */
  setRoom(kind: string | null, idleK: number): void;
  /** Velocity-linked dolly wind — gain follows |vel| (0..3). Call per frame. */
  setDollyVelocity(v: number): void;
  dossierOpen(): void;    // idle-dossier fade-in tick
}
