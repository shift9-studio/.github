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
assert.match(entrance, /setMode\("desk"\)[\s\S]{0,180}setLoading\(false\)/, "Every terminal intro path must canonicalize desktop state");
assert.match(entrance, /curtainFallback/, "Curtain cancellation must have a bounded completion fallback");
assert.match(entrance, /onPlaying[\s\S]{0,180}runtimeBail = setTimeout\(enterDesk, 26000\)/, "The intro runtime must begin when playback begins");
assert.match(entrance, /let cancelled = false[\s\S]*?beatB[\s\S]*?\.then\(\(\) => \{[\s\S]{0,120}if \(cancelled\) return/, "Late intro media promises must not mutate a cleaned-up scene");
assert.match(entrance, /beatB[\s\S]*?\.play\(\)[\s\S]*?\.then\([\s\S]*?beatB\.classList\.add/, "Beat B must play before it is revealed");
assert.match(mark, /shift9-mark-light/, "The Shift-9 mark must expose its light half");
assert.match(mark, /shift9-mark-grey/, "The Shift-9 mark must expose its grey half");
assert.match(entranceStyles, /shift9-mark-light[\s\S]*translateY\(-1\.5px\)/, "The light half must lift on approach");
assert.match(entranceStyles, /shift9-mark-grey[\s\S]*translateY\(1\.5px\)/, "The grey half must settle on approach");
assert.match(entrance, /gateCurtainLeft/, "The entrance must render the opening curtain halves");
assert.match(entrance, /setCurtainOpening\(true\)[\s\S]{0,100}setMode\("film"\)/, "The curtain must begin on the visitor's click without a playback pause");
assert.doesNotMatch(entrance, /mode === "gate" \|\| loading \|\| !curtainDone/, "Loading must not hold the curtain over the ready poster");
assert.match(entranceStyles, /stageVideo[\s\S]{0,520}01-exterior-approach-poster\.jpg/, "The film stage must preload a frame behind the immediate curtain");
assert.match(entranceStyles, /@keyframes curtainLeft/, "The entrance must part the left curtain");
assert.match(entranceStyles, /@keyframes curtainRight/, "The entrance must part the right curtain");
assert.match(entranceStyles, /gateCurtainLeft[\s\S]*mask-image:\s*linear-gradient/, "The left curtain edge must feather instead of exposing a clipped seam");
assert.match(entranceStyles, /gateCurtainRight[\s\S]*mask-image:\s*linear-gradient/, "The right curtain edge must feather instead of exposing a clipped seam");
assert.match(entranceStyles, /--curtain-seam:\s*30%/, "The curtain must part at the photographed aperture");
assert.match(entranceStyles, /background-blend-mode:\s*multiply/, "Moving fabric must not carry the photographed aperture light");
assert.doesNotMatch(entranceStyles, /gateCurtainLeft[\s\S]{0,160}clip-path/, "The curtain must not restore a hard clipped center edge");
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

console.log("Studio loops, invitation, entrance, and ghost controls: pass");
