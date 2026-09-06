import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const [
  dolly,
  dollyStyles,
  entrance,
  entranceStyles,
  mark,
  pearl,
  start,
  flow,
  instrument,
] = await Promise.all([
  read("../app/_components/StudioDolly.tsx"),
  read("../app/_components/StudioDolly.module.css"),
  read("../app/_components/EnterTheStudio.tsx"),
  read("../app/_components/EnterTheStudio.module.css"),
  read("../app/_components/Shift9Mark.tsx"),
  read("../../../packages/theme/pearl.css"),
  read("../app/start/page.tsx"),
  read("../app/flow-state/page.tsx"),
  read("../app/instrument/page.tsx"),
]);

assert.match(dolly, /function SeamlessLoopVideo/, "Studio clips must use the seamless player");
assert.match(dolly, /requestAnimationFrame\(watch\)/, "The seamless player must anticipate the clip ending");
assert.match(dolly, /cancelAnimationFrame/, "The seamless loop must stop offscreen");
assert.match(dolly, /clearTimeout/, "The crossfade completion timer must be cleaned up");
assert.doesNotMatch(dolly, /<video[\s\S]{0,220}\bloop\b/, "Studio clips must not use hard native loops");
assert.match(dollyStyles, /\.loopLayer[\s\S]*transition:\s*opacity/, "Studio loops must crossfade on the compositor");
assert.match(dolly, /useReducedMotionSafe/, "Studio media must react to reduced-motion changes");
assert.match(dolly, /Math\.abs\(i - warmCenter\) <= 1/, "Studio media must keep only a bounded warm neighborhood");
assert.match(dolly, /next[\s\S]*?\.play\(\)[\s\S]*?\.then\([\s\S]*?next\.style\.opacity = "1"/, "A crossfade must wait for incoming playback");
assert.match(dolly, /let cancelled = false[\s\S]*?\.then\(\(\) => \{[\s\S]{0,120}if \(cancelled\) return/, "Late media promises must not revive a cleaned-up studio loop");

assert.match(dolly, /invitationCard/, "The studio outro must render a physical invitation object");
assert.match(dolly, /bookendTrack/, "The studio opening must render the twelve-stop dolly track");
assert.match(dolly, /SET_PIECES\.map[\s\S]{0,160}piece\.n/, "The opening track must come from the canonical project roster");
assert.match(dolly, /Open your invitation/, "The invitation must name its action clearly");
assert.match(dollyStyles, /\.invitationCard/, "The invitation object must have a finished material");
assert.match(dollyStyles, /prefers-reduced-motion: reduce/, "Studio motion must have a reduced-motion state");
assert.match(dollyStyles, /bookendTrack i[\s\S]*animation:\s*none/, "The opening track must stop under reduced motion");

assert.doesNotMatch(entrance, /prototype note/i, "The studio desktop must not expose internal notes");
assert.doesNotMatch(entrance, /INTRO_RUNTIME_SHORT|enterCount/, "The redundant visible 20s label must stay removed");
assert.doesNotMatch(
  entrance,
  /data-tip="(?:Grid|Icon) view"/,
  "The Grid and Icons controls must not show redundant hover tips",
);
assert.match(entrance, /setMode\("desk"\)[\s\S]{0,180}setLoading\(false\)/, "Every terminal intro path must canonicalize desktop state");
/* The safety net still arms on `playing` and not a frame earlier — that part
   of the original rule is untouched. What changed on 2026-08-23 is what the
   net measures. A flat 26s stopwatch against a 20.1s film cut the film off
   part-way through on any line too slow to stream it in real time, which is
   the fault Kariim reported: the intro "not playing" and the site jumping to
   the desktop. It now watches film actually shown, so a slow line is allowed
   to finish and only a genuinely stuck one gives up. */
assert.match(entrance, /onPlaying[\s\S]{0,220}stallWatch = setInterval\(/, "The intro safety net must arm when playback begins");
assert.match(entrance, /vid\.currentTime \+ \(videoBRef\.current\?\.currentTime \?\? 0\)/, "The safety net must measure film shown across both beats, not wall-clock time");
assert.doesNotMatch(entrance, /setTimeout\(enterDesk, 26000\)/, "The flat 26s stopwatch that cut the film short must stay removed");
assert.match(entrance, /let cancelled = false[\s\S]*?beatB[\s\S]*?\.then\(\(\) => \{[\s\S]{0,120}if \(cancelled\) return/, "Late intro media promises must not mutate a cleaned-up scene");
assert.match(entrance, /beatB[\s\S]*?\.play\(\)[\s\S]*?\.then\([\s\S]*?beatB\.classList\.add/, "Beat B must play before it is revealed");
assert.match(mark, /shift9-mark-light/, "The Shift-9 mark must expose its light half");
assert.match(mark, /shift9-mark-grey/, "The Shift-9 mark must expose its grey half");
assert.match(entranceStyles, /shift9-mark-light[\s\S]*translateY\(-1\.5px\)/, "The light half must lift on approach");
assert.match(entranceStyles, /shift9-mark-grey[\s\S]*translateY\(1\.5px\)/, "The grey half must settle on approach");
assert.match(entranceStyles, /\.titlerow,[\s\S]{0,80}\.taskbar\s*\{[\s\S]{0,120}z-index:\s*1;[\s\S]{0,60}\.titlerow\s*\{\s*z-index:\s*2;/, "The title-row tooltips must paint above the controls below them");
assert.match(entrance, /mode === "gate"[\s\S]{0,180}<img className=\{s\.gatePlate\}/, "The entrance must render the original static yarn plate");
assert.match(entrance, /setLoading\(true\);[\s\S]{0,80}setMode\("film"\)/, "Enter must hand directly from the static plate to the film");
assert.doesNotMatch(entrance, /curtainDone|curtainOpening|YarnCurtain/, "The rejected curtain animation state must stay removed");
assert.match(entranceStyles, /stageVideo[\s\S]{0,520}01-exterior-approach-poster\.jpg/, "The film stage must preload a frame behind the immediate curtain");
assert.doesNotMatch(entranceStyles, /gateApertureOpen|curtainLeft|curtainRight|gatePlateAdvance/, "The yarn asset must stay static");
assert.match(entranceStyles, /--w-light-row-text/, "Light folder rows must define readable title text");
assert.match(entranceStyles, /\.item:nth-child\(even\)[\s\S]*color:\s*var\(--w-light-row-text\)/, "Light folder rows must apply their dark text token");
assert.match(entranceStyles, /\.item:nth-child\(even\) h3[\s\S]{0,120}color:\s*var\(--w-light-row-text\)/, "Light folder titles must explicitly keep readable dark text");

for (const [name, page] of [
  ["start", start],
  ["flow-state", flow],
  ["instrument", instrument],
]) {
  assert.match(page, /s9-pearl-ghost/, `${name} must use the shared ghost-pearl return control`);
}
assert.match(pearl, /\.s9-pearl-dark\.s9-pearl-ghost/, "The ghost-pearl material must stay shared");


const room = await read("../app/_components/RoomExplore.tsx");
assert.match(room, /WebGLRenderer/, "Room explore must use WebGL");
assert.match(room, /printer/, "Room explore must include the 3D printer prop");
assert.match(room, /lumen/i, "Room explore must include the Lumen prop");
assert.match(room, /onSitDown/, "Room explore must offer a way back to the desktop");
assert.match(room, /ACESFilmicToneMapping/, "Room explore must keep ACES tone mapping");
assert.match(room, /studio_small_09_1k\.hdr/, "Room explore must load the Poly Haven studio HDRI");
assert.match(room, /office_desk\.glb|wooden_table_02/, "Room explore must mount a real desk GLB");
assert.match(room, /office_chair\.glb/, "Room explore must mount the Khronos chair GLB");
assert.match(room, /drawer_cabinet/, "Room explore must mount the Poly Haven printer-bay cabinet");
assert.match(room, /wood_table_diff\.jpg/, "Room explore must use Poly Haven wood PBR, not a gray box");
assert.match(entrance, /ROOM_WALK_PLAYBACK_RATE/, "Only the room-walk (desk) beat is sped up");
assert.match(entrance, /vid\.playbackRate = 1/, "Approach/entry beat stays at natural 1x");
assert.match(entrance, /SKIP_PREF_KEY/, "Intro must remember skip preference after a full watch");
assert.match(entrance, /standUp/, "Desktop must expose Stand up into room explore");
assert.match(entrance, /mode === "room"/, "Entrance must mount room explore mode");
assert.match(entrance, /Skip to desk/, "Film skip control must clearly jump to the desk");

console.log("Studio loops, invitation, entrance, and ghost controls: pass");
