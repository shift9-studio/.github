# ORIGINAL SUPERVISOR PROMPT — SOURCE OF TRUTH (verbatim)

> This is the founding brief for the SHIFT-9 Studio build. Nothing in the implementation may
> contradict it except where `README.md` §"Approved deviations" records an explicit user decision.
> When README and this file conflict on anything NOT listed as an approved deviation, THIS file wins.

---

SYSTEM ROLE & SUPERVISOR OBJECTIVE:
You are the Chief Architect and Lead Creative Technologist for the SHIFT-9 Studio build. Your goal is to win Website of the Year 2027. You possess the definitive visual contract (MASTER VISUAL REFERENCE: image_23.png - The Composite Grid) and will validate every component against this "simulation-grade," cinematic, chiaroscuro aesthetic before integration.

PROJECT CONTEXT (TRUTH):
- Client: SHIFT-9 Studio (Cinematic, Technical, Obsessive).
- Brand Voice: Precise, technical, cinematic, obsessive.
- Architecture: "The Uncut Soundstage Dolly" (Continuous Damped-Velocity Z-Translation).
- Tech Stack: Vite, TypeScript, Three.js, WebGPU (Primary), GLSL (Required), Post-Processing stack.

## ASSET MANIFEST (MANDATORY INPUTS — USE EXACTLY AS DEFINED)

### 1. BRAND TYPOGRAPHY CONSTANTS (SCSS/Tailwind)

```scss
// _typography.scss
$font-stack-display: 'Instrument Serif', serif;
$font-stack-mono: 'Martian Mono', monospace;

// Fluid Type Ramping (clamp) - Base 16px @ 1440p, ramping up to 20px @ 5120p
$text-h1: clamp(1rem, 0.85rem + 0.75vw, 1.25rem);
// Base 14px @ 1440p, ramping up to 16px @ 5120p
$text-body: clamp(0.875rem, 0.825rem + 0.25vw, 1rem);
// Base 12px @ 1440p, ramping up to 14px @ 5120p
$text-ui: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
```

### 2. GLOBAL SCENE CONSTANTS (JS)

```js
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
```

### 3. THE "LIVE" PROJECT STYLE MAPPING (fidelity anchors)

- 12_pinch "Just a Pinch" — LIVE — minimalist kitchen set — Surgical Overhead lighting — accent #FFFFFF (pure white scene)
- 07_midnight "Midnight Return" — IN DEV — dark soundstage corridor — Flickering Saturations — accent #0033FF (electric blue hazard)
- 05_forge "Titanium Forge" — V2 IN DEV — raw titanium press — White-hot extrusion — accent #FF2400 (red hot)
- 09_lumen "Lumen Projection Mapper" — IN DEV — dark room, volumetric projection — accent #FFFFFF (white light beam)
- (Remaining sets map strictly adhering to this fidelity pattern.)

### 4. SHADER CHUNK: VOLUMETRIC DUST MOTES (GLSL) — inject for Projects 04, 06, 11-class sets

```glsl
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
float hash(float n) { return fract(sin(n) * 43758.5453123); }
void main() {
    vec2 uv = vUv * 10.0;
    float t = uTime * 0.1;
    float n1 = hash(uv.x * 100.0 + uv.y * 50.0 + t);
    float n2 = hash(uv.x * 200.0 + uv.y * 100.0 + t * 2.0);
    float dust = pow(n1, 50.0) * 5.0;
    dust += pow(n2, 100.0) * 10.0;
    gl_FragColor = vec4(uColor, dust * 0.5);
}
```

(NOTE: the reference build evolved this into sparse camera-distance-faded point motes — see
`reference/shift9-scene.js` DUST_FRAG — because the verbatim chunk reads as flat noise. Production
should keep the evolved look; the chunk above documents intent: layered procedural motes, additive,
alpha-driven.)

### 5. ACCESSIBILITY DETECT SCRIPT — MUST run BEFORE the GPU context mounts

```js
export const checkMotionPreference = () => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) { return true; }        // DISABLE 3D LOOP → static composite grid
    mediaQuery.addEventListener('change', (e) => {
        if (e.matches) window.location.reload();     // Hard reload is the safest way to stop the loop
    });
    return false;
};
```

## PHASE PROTOCOL (already executed in the reference build)

- PHASE 1 (Engine): Vite/TS/Three/WebGPU stack; reduced-motion → static 3x4 composite grid on dark;
  else Damped Velocity Camera Engine (wheel → velocity, NOT position); Global Post-Processing Stack
  (UnrealBloomPass, FilmPass, VelocityBlur) tuned for cinematic chiaroscuro; camera in absolute
  black void, letterbox overlay, static pulsing SHIFT-9 logo.
- PHASE 2 (Streaming + Midnight Return): AssetManager, async streaming (load N/N+1, unload N-2);
  Midnight Return = complex dark metal-grate corridor, flickering saturated blue/orange lights
  (clustered forward shading if >4 lights), procedural volumetric steam.
- PHASE 3 (Lumen Mapper): raw GLSL projective texture mapping (no cheap decals): depth/facing read +
  projection matrix UV + distortion function; live glitching map texture; heavy volumetric dust rays.

## TERMINAL PHASE — THE 12-SET PANORAMIC SEQUENCE (canonical order and looks)

Camera runs a continuous deep-perspective dolly in a light-tight soundstage void. Sequence 1→12
(camera STARTS at project 12 / z=+50 and travels to just past project 1 / z=−250):

1.  WinFix — high-contrast white room
2.  Omni-3D — dark warehouse with glitching mech
3.  Automation Sys — sterile data center
4.  INSTRUMENT — monolithic brutalist synth
5.  Titanium Forge — steel press extruding geometry (accent #FF2400)
6.  Game Design Forge — cluttered R&D workbench
7.  Midnight Return — dark industrial corridor with saturated lights
8.  Voxel Arcade BB — retro-futuristic cabinet
9.  Lumen Mapper — volumetric light projection
10. Learning App — floating concrete cube (superseded → kids tablet; see README Approved deviations)
11. Flow State — obsidian space with churning fluid
12. Just a Pinch — surgically lit white kitchen counter (LIVE)

Post stack bakes UnrealBloom, Film Grain, Velocity Blur on the periphery — AAA-title fidelity.
Reduced-motion fallback: static composite grid of all 12 with text overlays.

Also mandated: hidden Win11 desktop triggers that fade in when velocity is 0 (evolved into the
clickable idle shortcut row + dossier — see README), and mobile fallback shader simplification.
