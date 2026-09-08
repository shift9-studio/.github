import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

// Execute the actual effect with deterministic canvas, clock and pointer fixtures.
// No browser, live accounts, or user screen is touched by this regression test.
const source = await readFile(new URL("../app/_components/AsciiWallpaper.tsx", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;

function fixture({ reduced = false, fine = true } = {}) {
  let effect, cleanup, now = 0, serial = 0;
  let rect = { left: 0, top: 0, width: 360, height: 780 };
  let box = { left: 0, top: 110, width: 360, height: 620 };
  const frames = new Map(), events = new Map(), draws = [], clears = [];
  const context = { setTransform() {}, clearRect(...a) { clears.push(a); }, drawImage(...a) { draws.push(a.slice(5)); } };
  const canvas = { getContext: () => context, getBoundingClientRect: () => rect };
  const media = { matches: reduced, addEventListener() {}, removeEventListener() {} };
  let observer;
  class Element { closest() { return null; } }
  const document = { hidden: false, createElement: () => ({ getContext: () => ({ setTransform() {}, fillText() {} }) }),
    addEventListener: (n, f) => events.set(n, f), removeEventListener: n => events.delete(n) };
  const exports = {};
  vm.runInNewContext(code, {
    exports, Element, document, performance: { now: () => now },
    window: { devicePixelRatio: 1, matchMedia: q => q.includes("pointer") ? { matches: fine } : media,
      addEventListener: (n, f) => events.set(n, f), removeEventListener: n => events.delete(n) },
    requestAnimationFrame: f => { frames.set(++serial, f); return serial; },
    cancelAnimationFrame: id => frames.delete(id),
    ResizeObserver: class { constructor(f) { observer = f; } observe() {} disconnect() {} },
    require: id => {
      if (id === "react") return { useRef: () => ({ current: canvas }), useEffect: f => { effect = f; } };
      if (id === "react/jsx-runtime") return { jsx() {} };
      if (id === "./ascii-art-data") return { ASCII_RAMP: " .#", BANNER_ASCII: {
        cols: 6, rows: 4, grid: Array(4).fill("######"), tone: Array(4).fill("111111"),
        flow: Array(4).fill("000000"), palette: ["#000", "#fff"],
      } };
      throw new Error(`Unexpected import ${id}`);
    },
  }, { timeout: 1000 });
  exports.AsciiWallpaper({ fitTo: { current: { getBoundingClientRect: () => box } } });
  cleanup = effect();
  return {
    canvas, frames, events, draws, clears, document,
    frame(t) { now = t; draws.length = 0; for (const [id, f] of [...frames]) { frames.delete(id); f(t); } },
    pointer(t, x = 170, y = 300) { now = t; events.get("pointermove")?.({ type: "pointermove", buttons: 0, pointerType: "mouse", clientX: x, clientY: y, target: new Element() }); },
    unfold() { rect = { left: 0, top: 0, width: 860, height: 900 }; box = { left: 220, top: 110, width: 640, height: 744 }; observer(); },
    cleanup,
  };
}

for (const fine of [true, false]) {
  const f = fixture({ fine });
  f.frame(1000);
  assert.equal(Math.min(...f.draws.map(a => a[1])), 110, "Wallpaper must start at the visible desktop top");
  assert.equal(Math.max(...f.draws.map(a => a[1] + a[3])), 730, "Wallpaper must fill tall phone height");
  f.unfold(); f.frame(1100);
  assert.equal(f.canvas.width, 860, "Unfold must resize the canvas");
  assert.equal(Math.min(...f.draws.map(a => a[0])), 220, "Unfold must account for the sidebar");
  assert.equal(Math.max(...f.draws.map(a => a[1] + a[3])), 854, "Unfold must refit the full height");
  f.cleanup();
  assert.equal(f.frames.size, 0); assert.equal(f.events.size, 0);
}
const idle = fixture(), hover = fixture();
idle.frame(1000); hover.frame(1000);
hover.pointer(1100); idle.frame(1200); hover.frame(1200);
assert(hover.draws.some(a => a[0] % 60 !== 0 || (a[1] - 110) % 155 !== 0), "Hover without buttons must displace characters");
hover.frame(2600);
assert(hover.draws.every(a => a[0] % 60 === 0 && (a[1] - 110) % 155 === 0), "Expired ripples must restore the grid");
hover.document.hidden = true; hover.events.get("visibilitychange")();
assert.equal(hover.frames.size, 0, "Hidden pages must stop scheduling animation");
idle.cleanup(); hover.cleanup();
const still = fixture({ reduced: true });
assert(still.draws.length > 0, "Reduced motion must render complete artwork");
still.pointer(1000); assert.equal(still.frames.size, 0, "Reduced motion must ignore hover");
still.cleanup();
console.log("ASCII wallpaper: phone/unfold geometry, hover, expiry, hidden-page pause and cleanup pass");
