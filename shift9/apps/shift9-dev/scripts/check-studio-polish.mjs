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
  rail,
  railStyles,
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
  read("../app/_components/RailWindows.tsx"),
  read("../app/_components/RailWindows.module.css"),
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
assert.match(entrance, /useState<"gate" \| "film" \| "desk">\("gate"\)/, "A new visit must start at the yarn entrance, not autoplay the film");
assert.match(entrance, /if \(reducedMotion \|\| introAlreadySeen\(\)\)\s*\{\s*enterDesk\(\)/, "Returning visitors must reach the desktop without replaying the film");
assert.match(entrance, /const enterDesk[\s\S]{0,80}markIntroSeen\(\)/, "Every desktop arrival must be remembered");
assert.match(entranceStyles, /--entry-seam-light:\s*#20c0e0/, "The entrance seam must keep its cyan light independently of the monochrome theme");
assert.doesNotMatch(rail, /index="[ABCD]"|s\.panelNo|these switches are real/, "Settings must not expose chat markers or internal implementation notes");
assert.match(entrance, /setLoading\(true\);[\s\S]{0,80}setMode\("film"\)/, "Enter must hand directly from the static plate to the film");
assert.doesNotMatch(entrance, /curtainDone|curtainOpening|YarnCurtain/, "The rejected curtain animation state must stay removed");
assert.match(entranceStyles, /stageVideo[\s\S]{0,520}01-exterior-approach-poster\.jpg/, "The film stage must preload a frame behind the immediate curtain");
assert.doesNotMatch(entranceStyles, /gateApertureOpen|curtainLeft|curtainRight|gatePlateAdvance/, "The yarn asset must stay static");
assert.match(entranceStyles, /\.item\s*\{[\s\S]{0,240}background:\s*var\(--w-panel\)/, "Folder rows must use the active theme panel");
assert.doesNotMatch(entranceStyles, /\.item:nth-child\(even\)/, "Folder rows must not override the active theme by position");
assert.doesNotMatch(entranceStyles, /--w-light-row/, "Retired light-stripe tokens must not override the active theme");
assert.match(entranceStyles, /\.tag\s*\{[^}]*color:\s*var\(--w-txt\)[^}]*background:\s*var\(--w-quiet\)/s, "Project tags must use readable active-theme tokens");
const devBadge = entranceStyles.match(/\.dev\s*\{[^}]*color:\s*(#[0-9a-f]{6})[^}]*background:\s*(#[0-9a-f]{6})/i);
assert.ok(devBadge, "The IN DEV badge must define explicit foreground and background colors");
const luminance = (hex) => {
  const channels = hex.slice(1).match(/../g).map((value) => parseInt(value, 16) / 255);
  const [red, green, blue] = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};
const devLuminance = [luminance(devBadge[1]), luminance(devBadge[2])];
const devContrast = (Math.max(...devLuminance) + 0.05) / (Math.min(...devLuminance) + 0.05);
assert.ok(devContrast >= 4.5, `IN DEV badge contrast must reach 4.5:1; measured ${devContrast.toFixed(2)}:1`);
assert.match(entrance, /data-devlog=\{openWin === "devlog" \? true : undefined\}/, "Journal theme overrides must stay scoped to the dev log");
assert.match(entranceStyles, /\.wbody\[data-devlog\] \.item\s*\{[^}]*color:\s*var\(--w-txt\)/, "Journal rows must follow the current desktop text theme");
assert.match(entrance, /className=\{s\.stackLauncher\}/, "The core stack must be visible from the desktop instead of buried in project tags");
assert.match(entrance, /openWindowNow\("stack"\)/, "The stack launcher must open the stack window");
assert.match(entrance, /\/stack\/typescript\.svg/, "The stack must use locally served official technology marks");
assert.doesNotMatch(entrance, /src=\{?['"]https?:\/\//, "Stack logos must not depend on third-party runtime hosts");
assert.match(entrance, /n:\s*"Bring Up Desk"/, "The current private-draft media pipeline must appear in Tools");
assert.match(entrance, /private-draft upload/, "Bring Up Desk copy must state the human-gated private-draft boundary");
assert.match(entrance, /name:\s*"Tools",\s*count:\s*"6 items"/s, "The Tools folder count must match its six entries");
assert.doesNotMatch(entrance, /&#9993;|✉/, "Desktop mail icons must not depend on a platform font glyph");
for (const [platform, href, icon] of [
  ["Instagram", "https://www.instagram.com/shift9_studios/", "/social/instagram.svg"],
  ["Facebook", "https://www.facebook.com/profile.php?id=61591094140424", "/social/facebook.svg"],
  ["LinkedIn", "https://www.linkedin.com/company/shift9-studios/", "/social/linkedin.svg"],
  ["TikTok", "https://www.tiktok.com/@shift9studio", "/social/tiktok.svg"],
  ["GitHub", "https://github.com/shift9-studio", "/social/github.svg"],
]) {
  assert.match(rail, new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${platform} must link to the official Shift-9 account`);
  assert.match(rail, new RegExp(icon.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${platform} must use its locally served official mark`);
}
assert.match(rail, /className=\{s\.socialLink\}[\s\S]{0,180}target="_blank"[\s\S]{0,120}rel="noreferrer"/, "Social accounts must open safely in a new tab");
assert.doesNotMatch(rail, /src=\{?['"]https?:\/\//, "Contact logos must not depend on third-party runtime hosts");
const posterFocus = railStyles.match(/\.poster\s*\{[^}]*--poster-focus:\s*(#[0-9a-f]{6})/i);
assert.ok(posterFocus, "The black Contacts poster must define its own focus color");
assert.match(
  railStyles,
  /\.socialLink:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--poster-focus\)/s,
  "Social links must use the contrast-safe Contacts focus color",
);
const posterFocusLuminance = [luminance(posterFocus[1]), luminance("#05070c")];
const posterFocusContrast =
  (Math.max(...posterFocusLuminance) + 0.05) / (Math.min(...posterFocusLuminance) + 0.05);
assert.ok(
  posterFocusContrast >= 3,
  `Contacts focus outline must reach 3:1; measured ${posterFocusContrast.toFixed(2)}:1`,
);

for (const [name, page] of [
  ["start", start],
  ["flow-state", flow],
  ["instrument", instrument],
]) {
  assert.match(page, /s9-pearl-ghost/, `${name} must use the shared ghost-pearl return control`);
}
assert.match(pearl, /\.s9-pearl-dark\.s9-pearl-ghost/, "The ghost-pearl material must stay shared");

console.log("Studio loops, invitation, entrance, and ghost controls: pass");
await import("./check-ascii-wallpaper.mjs");
