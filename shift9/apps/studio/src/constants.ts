// Asset Manifest #2 — GLOBAL SCENE CONSTANTS (verbatim from ORIGINAL_PROMPT.md)
export const SCENE_CONSTANTS = {
  CAMERA_START_Z: 50,        // Positioned far back (at project 12)
  CAMERA_END_Z: -250,        // Positioned just past project 1
  VELOCITY_DAMPING: 0.05,    // 0 (no friction) to 1 (instant stop)
  SCROLL_SENSITIVITY: 0.001, // Multiplier for wheel delta
  MAX_VELOCITY: 3.0,         // Prevents tunneling through sets
  LOAD_RADIUS: 50,           // Distance from camera to trigger load (N, N+1)
  UNLOAD_RADIUS: 100,        // Distance from camera to trigger unload (N-2)
  COLOR_ACCENT_BLUE: '#0033FF',
  COLOR_DARK_BG: '#000000',
  COLOR_UI_FG: '#E0E0E0'
};

// Dev/debug tweaks (reference exposed these as editor props)
export const TWEAKS = {
  letterbox: true,
  grain: 0.07,       // 0–0.2
  damping: 0.05,     // 0.01–0.3 → SCENE_CONSTANTS.VELOCITY_DAMPING
  sensitivity: 0.001,// 0.0002–0.004 → SCENE_CONSTANTS.SCROLL_SENSITIVITY
  fogFar: 55,        // 25–120
  forceStaticGrid: false
};

// Asset Manifest #1 — fluid type clamps
export const TYPE = {
  h1: 'clamp(1rem, 0.85rem + 0.75vw, 1.25rem)',
  body: 'clamp(0.875rem, 0.825rem + 0.25vw, 1rem)',
  ui: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)'
};

export const isCoarsePointer = () =>
  matchMedia('(pointer: coarse)').matches || innerWidth < 820;
