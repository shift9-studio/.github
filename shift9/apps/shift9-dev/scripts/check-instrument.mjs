import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../app/instrument/page.tsx", import.meta.url), "utf8");
const projects = await readFile(
  new URL("../app/instrument/instrument-projects.ts", import.meta.url),
  "utf8",
);
const reference = await readFile(
  new URL("../app/instrument/reference/page.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../app/instrument/case-study.module.css", import.meta.url),
  "utf8",
);
const referenceStyles = await readFile(
  new URL("../app/instrument/instrument.module.css", import.meta.url),
  "utf8",
);
const labSurface = await readFile(
  new URL("../app/instrument/LabSurface.tsx", import.meta.url),
  "utf8",
);
const studioDolly = await readFile(
  new URL("../app/_components/studio-dolly-data.ts", import.meta.url),
  "utf8",
);
const desktopCatalog = await readFile(
  new URL("../app/_components/EnterTheStudio.tsx", import.meta.url),
  "utf8",
);

function objectContaining(source, marker) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `Missing catalog marker: ${marker}`);
  const start = source.lastIndexOf("{", markerIndex);
  assert.notEqual(start, -1, `Missing object start for: ${marker}`);
  const lineStart = source.lastIndexOf("\n", start) + 1;
  const indent = source.slice(lineStart, start);
  const end = source.indexOf(`\n${indent}},`, markerIndex);
  assert.notEqual(end, -1, `Missing object end for: ${marker}`);
  return source.slice(start, end);
}

assert.match(page, /working design lab/i, "Instrument must identify itself as the studio's working lab");
assert.match(page, /instrumentProjects\.map/, "Instrument specimens must come from the project registry");
assert.match(projects, /Shift-9 Studio/, "Instrument must register the studio surface");
assert.match(projects, /Flow State/, "Instrument must register Flow State");
assert.match(projects, /Just a Pinch/, "Instrument must register Just a Pinch");
assert.match(projects, /Add one entry here/i, "The project registry must explain the one-entry extension path");
assert.match(projects, /no page or CSS edit/i, "The registry must keep future projects config-only");
assert.match(page, /Titanium Forge is the separate[\s\S]{0,80}component workbench/, "Instrument must distinguish itself from Titanium Forge in client-facing language");
assert.match(page, /href="\/instrument\/reference"/, "Instrument must link to its technical reference");
assert.match(page, /<LabSurface/, "Instrument must expose the pointer-driven inspection surface");
assert.match(page, /scanBeam/, "Instrument must keep the focused bench scan");
assert.doesNotMatch(page, /<WaveField/, "Instrument must keep its own room instead of copying the invitation page");
assert.doesNotMatch(page, /CopyRow/, "The public case study must not expose copyable implementation rows");
assert.doesNotMatch(
  `${page}\n${projects}`,
  /prototype|\bTODO\b|\bdraft\b|review note|automated test suite/i,
  "The public Instrument page must not expose prototype or review notes",
);
assert.equal(
  [...page.matchAll(/Start a project/gi)].length,
  1,
  "Instrument must reserve Start a project for its final conversion point",
);

assert.match(reference, /CopyRow/, "The technical reference must preserve copyable implementation rows");
assert.match(reference, /Instrument case study/, "The technical reference must link back to the public case study");
assert.match(reference, /route: "\/flow-state"/, "The technical reference must include the current Flow State room");
assert.match(reference, /route: "\/instrument"/, "The technical reference must include its public case-study room");
assert.doesNotMatch(reference, /four rooms/i, "The technical reference must not keep the stale room count");
assert.match(reference, /SET_PIECES\.map/, "The technical reference must render the canonical project register");
assert.match(reference, /Twelve builds\. One living archive\./, "The project register must explain the full studio roster");
assert.equal(
  [...studioDolly.matchAll(/\n\s+n: "\d{2}",/g)].length,
  12,
  "The canonical studio register must keep all twelve current projects",
);

assert.match(styles, /:focus-visible/, "Instrument links must keep a visible focus treatment");
assert.match(styles, /prefers-reduced-motion: reduce/, "Instrument must define a reduced-motion state");
assert.match(styles, /--probe-x/, "Instrument must keep the lab inspection light");
assert.match(styles, /@keyframes benchScan/, "Instrument must keep the single bench scan motion");
assert.match(referenceStyles, /projectScan[\s\S]*backdrop-filter:\s*brightness/, "The project archive must use an optical inspection wash");
assert.doesNotMatch(referenceStyles, /projectScan[\s\S]{0,180}height:\s*1px/, "The project archive must not restore a hard laser scan line");
assert.match(labSurface, /\(pointer: fine\)/, "The lab probe must run only for fine pointers");
assert.match(labSurface, /prefers-reduced-motion: reduce/, "The lab probe must respect reduced motion");
assert.match(labSurface, /requestAnimationFrame/, "The lab probe must batch pointer updates");
assert.match(styles, /09-instrument\.png/, "Instrument must use its current live studio scene");
assert.match(projects, /01-just-a-pinch\.png/, "Instrument must use the current Pinch studio scene");
assert.match(projects, /02-flow-state\.png/, "Instrument must use the current Flow State studio scene");

const dollyTitanium = objectContaining(studioDolly, 'title: "Titanium Forge Pro"');
const dollyInstrument = objectContaining(studioDolly, 'title: "INSTRUMENT"');
assert.match(dollyTitanium, /Component Library/, "The reel must identify Titanium Forge as a component library");
assert.match(dollyTitanium, /href: "\/soon\?from=08"/, "The reel must preserve Titanium Forge's destination");
assert.match(dollyInstrument, /Shift-9's production design system/, "The reel must identify Instrument as Shift-9's production system");
assert.match(dollyInstrument, /href: "\/instrument"/, "The reel must link Instrument to its case study");

const desktopTitanium = objectContaining(desktopCatalog, 'n: "Titanium Forge Pro"');
const desktopInstrument = objectContaining(desktopCatalog, 'n: "INSTRUMENT"');
assert.match(desktopTitanium, /Component Library/, "The desktop must identify Titanium Forge as a component library");
assert.match(desktopTitanium, /h: "\/soon"/, "The desktop must preserve Titanium Forge's destination");
assert.match(desktopInstrument, /Shift-9's production design system/, "The desktop must identify Instrument as Shift-9's production system");
assert.match(desktopInstrument, /h: "\/instrument"/, "The desktop must link Instrument to its case study");

console.log("Instrument case-study contract: pass");
