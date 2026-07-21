/* PROJECT REGISTRY — single source of truth, ported 1:1 from reference/shift9-scene.js.
   ADD a project: append ONE object here. `id` = 'NN_slug' (NN drives HUD +
   shortcut-row order). Reuse an existing `kind` for its set look, or add a
   new kind + builder wired in buildSet(). Space `z` ~23 apart inside
   (CAMERA_END_Z, CAMERA_START_Z). CHANGE a status: edit `status` here —
   HUD, idle dossier, shortcut row, detail page and the reduced-motion grid
   all read from this array automatically.
   `tag`/`spec` = the two idle-dossier lines. `desc` + `facts` (+ optional
   `link`) fill the static portfolio detail page opened by clicking the set. */

export type SetKind =
  | 'whiteroom'
  | 'warehouse'
  | 'datacenter'
  | 'synth'
  | 'forge'
  | 'workbench'
  | 'corridor'
  | 'arcade'
  | 'lumen'
  | 'floatcube'
  | 'fluid'
  | 'kitchen';

export interface Project {
  id: string;
  n: string;
  status: string;
  z: number;
  accent: string;
  kind: SetKind;
  tag: string;
  spec: string;
  desc: string;
  facts: [string, string][];
  link?: string;
}

export const PROJECTS: Project[] = [
  { id: '01_winfix', n: 'WinFix', status: 'IN DEV', z: -233, accent: '#E0E0E0', kind: 'whiteroom',
    tag: 'Tell it what is broken in plain English. Restore point first, then the fix runs in order.',
    spec: 'SFC · DISM · CHKDSK · update-cache reset — streamed live, dry-run by default',
    desc: 'A native Windows repair utility with a real GUI. Describe the problem in your own words and it builds an ordered repair plan — always starting with a safety restore point — then drives the built-in Windows tools asynchronously, streaming their output live so the window never freezes. Includes a one-click in-place upgrade for out-of-support builds and a media tool for bootable USB or ISO.',
    facts: [['STACK', 'Python · Flet (Flutter desktop) · asyncio'], ['SAFETY', 'Safe Mode dry-run default · restore point first · UAC-aware'], ['REPAIRS', 'Windows Update reset · SFC · DISM · CHKDSK · network stack'], ['SHIP', 'Standalone .exe via flet pack — two clicks']] },
  { id: '02_omni3d', n: 'Omni-3D', status: 'IN DEV', z: -210, accent: '#0033FF', kind: 'warehouse',
    tag: 'Text, image, or phone video in — rigged, retopologized, engine-ready 3D out.',
    spec: '6-stage pipeline, all real providers: carve → retopo → rig → retarget → EITL gate',
    desc: 'A video-native 3D production studio with automated rigging. Three closed loops rebuild an object in 3D, drop a working skeleton inside it, copy motion from a second video, then validate the result against real game-engine rules — repairing its own mistakes on failure and live-syncing the finished asset into Unreal or Unity over WebSocket.',
    facts: [['STACK', 'TypeScript · Fastify · Zod schemas · meshoptimizer WASM'], ['LOOPS', 'A Structural · B Auto-Rig/Mocap · C Engine-in-the-Loop compiler'], ['ENGINES', 'UE5 SK_Mannequin · Unity Humanoid — live-sync bridge'], ['SELF-REPAIR', 'EITL gate E = w1·manifold + w2·intersections + w3·tear → auto micro-repair']] },
  { id: '03_auto', n: 'Automation Sys', status: 'IN DEV', z: -187, accent: '#0033FF', kind: 'datacenter',
    tag: 'Sterile pipelines that never sleep.',
    spec: 'Zero-touch orchestration — schedule, run, verify, repeat',
    desc: 'An automation control plane: schedulers, queues and self-healing jobs behind one observability wall. Built as the studio’s quiet backbone — everything that should run without a human, runs here.',
    facts: [['FOCUS', 'Orchestration · monitoring · self-healing jobs'], ['SET', 'Sterile data-center soundstage'], ['STATUS', 'Concept in development']] },
  { id: '04_instrument', n: 'INSTRUMENT', status: 'IN DEV', z: -164, accent: '#0033FF', kind: 'synth',
    tag: 'One monolith. Every sound.',
    spec: 'Brutalist performance-synth study — 9 knobs, 6 sliders, one slab',
    desc: 'An industrial-design study for a performance instrument: a single brutalist slab where every control earns its place. Sound design as architecture — nothing decorative, everything playable.',
    facts: [['FOCUS', 'Industrial design · sound UX'], ['FORM', 'Monolithic console · tactile controls'], ['STATUS', 'Design study in development']] },
  { id: '05_forge', n: 'Titanium Forge', status: 'V2 IN DEV', z: -141, accent: '#FF2400', kind: 'forge',
    tag: 'Tune the physics live, edit the TSX in place, pull it from the CLI.',
    spec: '4 motion models · hand-written 626-line JSX linter · motion profiler with real spring math',
    desc: 'A motion workbench for React developers. Drag stiffness, damping and mass and the curve redraws live across four motion models; the generated motion props regenerate as you drag. Edit the TSX in place with a real linter that auto-fixes mistakes, then take the code — copy it, export a themed zip, or install it from your terminal via the CLI daemon.',
    facts: [['STACK', 'React 19 · Vite 6 · Tailwind 4 · motion 12 · TS 5.7 · Express 5'], ['INSTRUMENT', 'Euler spring solver · damping ratio ζ = c / 2√(km) · live FPS'], ['EXTRAS', 'Web Audio soundscapes · Figma import · SSE co-presence · registry store'], ['VERSION', 'v6.5-PRO — lint and build clean']],
    link: 'https://hidden-glow-736.higgsfield.app' },
  { id: '06_gamedev', n: 'Game Design Forge', status: 'IN DEV', z: -118, accent: '#0033FF', kind: 'workbench',
    tag: 'A sandbox for game systems.',
    spec: 'Prototype a mechanic before lunch — keep what survives playtesting',
    desc: 'A gaming design sandbox: an R&D workbench for prototyping mechanics, systems and feel in isolation before they earn a place in a real project. Messy on purpose — the clutter is the process.',
    facts: [['FOCUS', 'Mechanics prototyping · systems design'], ['METHOD', 'Build small · playtest fast · discard freely'], ['REPO', 'Kariimc/game-design-forge']] },
  { id: '07_midnight', n: 'Midnight Return', status: 'IN DEV', z: -95, accent: '#0033FF', kind: 'corridor',
    tag: 'A metroidvania descent.',
    spec: 'Interconnected map · ability-gated backtracking · saturated hazard light',
    desc: 'A moody metroidvania. One interconnected world that keeps folding back on itself — new abilities reopen old corridors, and the deeper you go, the more the light misbehaves.',
    facts: [['GENRE', 'Metroidvania'], ['MOOD', 'Industrial dark · blue/orange hazard palette'], ['REPO', 'Kariimc/Midnight-return-']] },
  { id: '08_arcade', n: 'Voxel Arcade BB', status: 'IN DEV', z: -72, accent: '#FF00AA', kind: 'arcade',
    tag: 'Drop-in voxel arcade.',
    spec: 'Attract mode always on — pick up, play, pass the controller',
    desc: 'A retro-futuristic arcade cabinet study: voxel basketball built for instant pick-up-and-play. Descended from the Bball and Hoopclone experiments — the fun survived, the friction did not.',
    facts: [['LINEAGE', 'Bball · Hoopclone'], ['FORM', 'Cabinet build · attract mode · one-button onboarding'], ['STATUS', 'In development']] },
  { id: '09_lumen', n: 'Lumen Mapper', status: 'IN DEV', z: -49, accent: '#FFFFFF', kind: 'lumen',
    tag: 'Point your projector at anything. Drag four dots with your phone. Done.',
    spec: 'Electron desktop + phone remote over Wi-Fi — QR pair, corner-pin, play',
    desc: 'Projection mapping for everyone. Plug in a projector and a black fullscreen output appears on it automatically; scan the QR with your phone and drag four dots to pin the image onto any surface. Corner-pinning runs on a matrix3d warp with automated tests covering the real mapping math.',
    facts: [['STACK', 'Electron · WebSocket · plain HTML/JS remote — no framework'], ['FLOW', 'QR pair → drag 4 corners → mapped'], ['SHIP', 'Windows installer (Lumen Setup .exe)'], ['V1 LIMITS', 'Single projector · same-Wi-Fi control by design']] },
  { id: '10_learning', n: 'Learning App', status: 'IN DEV', z: -26, accent: '#0033FF', kind: 'floatcube',
    tag: 'Six lands, from recognizing pictures to reading storybooks alone.',
    spec: 'ReadingLand — mastery unlocks the next land; mistakes are never punished',
    desc: 'ReadingLand: a premium-feeling, fully offline, monetization-free early-literacy app for Android tablets, iPads and touch PCs. Six staged lands with guide characters take a child from visual recognition to independent reading; three correct answers master an item, mastering a land unlocks the next, and a wrong tap only ever asks gently to try again.',
    facts: [['STACK', 'Python · Kivy · SQLite — core engine has zero UI imports'], ['JOURNEY', 'Look & Learn → Letters → Sounds → Words → Sentences → Story Sky'], ['PRINCIPLES', 'Audio-first · toddler-usable · offline & private · never punish'], ['PARENTS', 'Progress dashboard · adaptive difficulty · spaced practice']] },
  { id: '11_flow', n: 'Flow State', status: 'IN DEV', z: -3, accent: '#0033FF', kind: 'fluid',
    tag: 'Hold Ctrl+Win. Speak. It types.',
    spec: '100% local dictation — nothing ever leaves the PC · 122 tests',
    desc: 'Local voice dictation for Windows. Hold or tap the hotkey, speak, and the text lands in whatever window you are using — filler words removed, spoken punctuation understood. A recovery inbox saves interrupted sessions, a delivery queue guards against misdirected text, and an accuracy lab learns your corrections. Everything runs on-device.',
    facts: [['STACK', 'Python · sherpa-onnx (Moonshine / Whisper engines)'], ['PRIVACY', 'Fully offline — audio and transcripts never leave the machine'], ['RELIABILITY', 'Recovery inbox · delivery queue · clipboard shield · scoped undo'], ['LEARNING', 'Dictionary · vocabulary · reviewed correction pairs']] },
  { id: '12_pinch', n: 'Just a Pinch', status: 'LIVE', z: 20, accent: '#FFFFFF', kind: 'kitchen',
    tag: 'Save a recipe from a link, a photo, pasted text, or a prompt — then cook it hands-free.',
    spec: 'iOS + Android · offline-first · one-tap shopping list',
    desc: 'A recipe app for iOS and Android. Capture recipes from anywhere — a URL, a photo of a handwritten card, pasted text, or an AI prompt — then cook them hands-free, plan your week, and generate a shopping list in one tap. Recipes sync to the cloud when signed in and always mirror locally, so it works offline and signed-out.',
    facts: [['STACK', 'Expo · React Native · TypeScript · Supabase edge functions'], ['CAPTURE', 'URL import · photo OCR · text parse · AI generate'], ['AI', 'Claude via server-side proxy — the key never leaves the backend'], ['STATUS', 'LIVE — closed testing → Play production track']] },
];
