/* GLOBAL SCENE CONSTANTS — ported verbatim from ORIGINAL_PROMPT.md §2.
   Values are the visual contract; do not tune without a recorded user decision. */
export const SCENE_CONSTANTS = {
  CAMERA_START_Z: 50, // Positioned far back (at project 12)
  CAMERA_END_Z: -250, // Positioned just past project 1
  VELOCITY_DAMPING: 0.05, // 0 (no friction) to 1 (instant stop)
  SCROLL_SENSITIVITY: 0.001, // Multiplier for wheel delta
  MAX_VELOCITY: 3.0, // Prevents tunneling through sets
  LOAD_RADIUS: 50, // Distance from camera to trigger load (N, N+1)
  UNLOAD_RADIUS: 100, // Distance from camera to trigger unload (N-2)
  COLOR_ACCENT_BLUE: '#0033FF',
  COLOR_DARK_BG: '#000000',
  COLOR_UI_FG: '#E0E0E0',
} as const;

export type SceneConstants = typeof SCENE_CONSTANTS;
