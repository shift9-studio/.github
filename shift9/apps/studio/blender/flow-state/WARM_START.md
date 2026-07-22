# WARM START — Flow State (Set 11) cinema render, refinement & polish phase

Read this in full, then continue. You are picking up mid-refinement on a
**Blender 5.0 / Cycles film-quality hero render** of the Flow State stage. This
is the user's chosen path ("I always want the film quality path", binding).
Everything you need is in this folder + the notes below.

## Mission & done-definition

Produce a photoreal Blender/Cycles hero image of the Flow State set that matches
the user's reference plate **so closely the user can't tell the difference**.
Refine in Blender using the **3d-master-modeler** skill method (staged pipeline,
verify-by-eye loop). "Fix X" reopens it. Plain language to the user; the user is
the sole judge; you render and show, they never run anything.

**The user's standing rules (do not relearn the hard way):**
- Film-quality path always. Do NOT ship stock/lazy substitutions — if a proper
  method (e.g. the real Blender compositor) breaks, FIX it, don't swap in a
  cheaper stand-in. (I got told off for replacing the Blender Glare with a numpy
  bloom — undo/avoid that; the real compositor Glare is wired and working now.)
- Cinema/AAA quality on the FIRST pass — that's why we upgraded the skill (see
  `CINEMA_DOCTRINE.md`). Apply that doctrine by default for any visual build.

## The reference plate (the target)

The user's reference is a Gemini/AI-Studio render (they pasted it into chat — it
is NOT saved as a file; **ask the user to re-share the Flow State reference image
at the start**, or scroll the prior thread). Exact look:

> A pristine **clear-glass rectangular canister** (rounded-corner cube body, an
> **angled shoulder**, a short **chrome neck/cap**) standing on a **low, wide,
> flat matte dark-stone plinth** that reads "SHIFT-9 / 02 Flow State" on its
> front face. The canister is filled to a **clean level line** with **glowing,
> low-viscosity cyan-blue fluid** swirling in **intricate, high-contrast
> white-cyan ink tendrils** (ink-in-water). One dramatic **volumetric light
> shaft from top-right**, dust in the beam, blue caustic spill on the plinth,
> heavy black negative space, bloom on the glow. Hyper-cinematic chiaroscuro.

Text brief (from the user's reference library, verbatim): *"A dark, obsidian
studio space containing a perfectly clear vessel with glowing, low-viscosity blue
fluid. Lit to emphasize refraction and complex laminar flow patterns."*

Our project data (use OUR labels, not the reference's "02/SHIPPING"): id
`11_flow`, **Flow State**, status **IN DEV**, accent **#0033FF**, kind `fluid`.

## Current state (what's in this folder)

- `build_flow_state.py` — the full Blender build (run it; see below). Standalone.
- `current_render.png` — the latest render (this session's stopping point).
- `CINEMA_DOCTRINE.md` — the skill upgrade; apply to the real skill repo.

**What already works (keep it):** composition & negative space; the rectangular
glass canister with angled shoulder + chrome neck; real Cycles glass refraction;
the low wide plinth + emissive "SHIFT-9 / 11 Flow State (IN DEV)" text; the
visible volumetric light shaft from top-right; dust motes in the beam; DOF; the
**real Blender compositor Glare (Fog Glow + Streaks)** bloom; Filmic + exposure
so the fluid is vivid cyan (not blown white).

**THE OPEN PROBLEM (your #1 job):** the fluid interior still reads as a fairly
**uniform cyan block** — the reference's intricate, high-contrast ink tendrils
are NOT there yet. The emissive-volume approach keeps integrating to a soft
uniform glow. Approaches tried: soft noise (too uniform) → wave bands (too
regular/striped) → ridged curl-noise `1−|2n−1|` powered, union of two octaves,
emission only on veins, near-zero-density body, higher frequency. Current best is
subtle-but-not-enough.

**Next ideas to try (in order):**
1. **Stacked emissive "ink planes" inside the fluid** — 3–5 camera-facing
   subdivided planes carrying a high-detail 2D ridged/curl swirl EMISSION texture,
   stacked front-to-back for parallax. Surface emission is crisp (no volume
   blur) and the glass refracts them → most likely to nail the reference's
   near-planar intricate tendrils. Keep the faint volume behind them for depth/glow.
2. **True curl-noise** (compute a divergence-free vector field: cross of two noise
   gradients) to advect the tendrils — more organic than domain-warp.
3. If staying pure-volume: push frequency higher still + much higher vein
   emission contrast + `volume_step_rate` 0.2, and lower exposure for headroom;
   verify tendrils aren't lost to Filmic compression.
4. Consider a baked **Mantaflow** smoke/ink sim domain for the ultimate look
   (heavier, but it's the "real" ink-in-water).
Then: real **MNEE caustics** onto the plinth; a subtle **vignette + grain + faint
chromatic aberration** finish (the compositor has no Mix node in 5.0 — see gotchas);
bump to **1080p, 256 samples** for the final; add a shoulder rim so the top glass
isn't so black.

## Environment & how to render (this runs fully headless — you render, don't ask)

- Blender is the **`bpy` PyPI wheel**, already the method here: `pip install bpy`
  (installs Blender 5.0.1 as a Python module; needs **Python 3.11**). The user
  also has Blender on their laptop, so the script must also run under
  `blender -b --factory-startup -P build_flow_state.py`.
- Run: `python3 build_flow_state.py` → writes `render/flow_state.png` next to the
  script. **Read the PNG yourself** and A/B it against the reference every pass.
- Cost: ~**2.5–4 min/frame** on CPU at 1280×720 / ~200 samples with the glass +
  volumetrics. Run it in the BACKGROUND and poll (`grep "AUDIT: done" render.log`),
  and fail-fast on `Traceback`. Don't block a foreground call on it.

## Blender 5.0 API gotchas (already solved — don't rediscover)

- Object ray visibility: `obj.visible_shadow` (NOT `obj.cycles_visibility.shadow`).
- **Scene compositor is a node GROUP**: `tr = bpy.data.node_groups.new(name,
  'CompositorNodeTree'); scene.compositing_node_group = tr`. Add an interface
  OUTPUT socket `tr.interface.new_socket("Image", in_out='OUTPUT',
  socket_type='NodeSocketColor')`, feed a **`NodeGroupOutput`** node — there is
  **no `CompositorNodeComposite`** and **no Mix/MixRGB node** in the 5.0
  compositor. `CompositorNodeRLayers` is the render source.
- **Glare node is all input sockets**, enum values are DISPLAY names:
  `Type ∈ {'Bloom','Ghosts','Streaks','Fog Glow','Simple Star','Sun Beams',
  'Kernel'}`, `Quality ∈ {'High','Medium','Low'}`; `Threshold/Size/Strength/
  Streaks` are numeric input sockets. Set via `node.inputs['Type'].default_value`.
- `Material.use_nodes` is deprecated (harmless warning).
- Principled sockets are 4.x/5.x names — go through the `set_input` resolver in
  the script ("Transmission Weight", "Emission Color", "Coat Weight", …).
- Cycles `denoiser='OPENIMAGEDENOISE'`, `denoising_input_passes='RGB_ALBEDO_NORMAL'`
  set defensively (try/except) — all present in 5.0.

## Script anatomy (build_flow_state.py)

`mat_glass / mat_chrome / mat_stone / mat_fluid / mat_beam / mat_emit` →
`cube()` helper (bevel + auto-smooth) → ground + plinth + emissive wordmark text
→ caustic-ready plinth → the canister (RoundedBox body + 4-vert-cone shoulder +
chrome neck/cap) → the fluid volume (`mat_fluid`, the RIDGE nodes are the tendril
field — tune here) → light shaft (SPOT + a Volume-Scatter cone) → fill/back →
dust motes → DOF → Cycles settings + Filmic + exposure → **compositor Glare
group** → render. Key fluid params to tune live in `mat_fluid` (noise scale/detail/
distortion, `ridge()` powers, vein density ×, vein emission ×, body density/emission)
and `scene.view_settings.exposure`.

## Git / handoff

- Branch: `claude/flow-state-set-11-bxzo2p` (this session's branch; supersedes the
  studio PR #31). Blender work + this handoff are committed here.
- The Three.js studio set (`src/engine/sets/fluid.ts`) is a **canister+plinth WIP**
  that BUILDS but does NOT yet match the reference — it's on hold. The plan: nail
  the look in Blender first, then port materials/composition to the Three.js set
  (or decide with the user whether Flow State ships as a pre-rendered hero plate
  vs. real-time). Do not treat the Three.js set as done.
- Nothing is merged/shipped; the user approves the look before anything advances.

## First moves for the next session

1. Get on the branch (`git fetch origin && git checkout -B <your-branch>
   origin/claude/flow-state-set-11-bxzo2p`), `pip install bpy` if needed.
2. Say hello, say you're continuing the Flow State cinema render, and ask the user
   to re-share the reference image (it isn't a file).
3. Attack the fluid tendrils (idea #1 above) — render, read, A/B, iterate to
   indistinguishable. Then caustics → finish grade → 1080p/256 final.
4. Deliver the render(s) to the user; iterate on "fix X" until they pass.
