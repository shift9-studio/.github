# Cinema / AAA doctrine — 3d-master-modeler upgrade

This is the upgrade the user asked for: bake it into the **3d-master-modeler**
skill (`Kariimc/my-skills/skills/3d-master-modeler/SKILL.md`) as "Phase 3.5 —
Cinema / AAA quality" so future first-pass Blender output is cinema-grade without
many refinement rounds. (It has already been appended to the local clone of that
skill this session; re-apply it to the real repo — that repo belongs to another
owner, so this session couldn't push it.)

The base pipeline yields "clean stylized." Cinema/AAA is a different bar and must
be built in on the FIRST pass. If the ask is beautiful/photoreal/hero, EVERY item
below is default-on. A-vs-B against the reference plate is the only definition of
done: a viewer can't tell which is the render.

- **Sampling & clean image.** Cycles; 256+ adaptive samples (threshold ~0.01);
  OpenImageDenoise with Albedo+Normal (`denoising_input_passes='RGB_ALBEDO_NORMAL'`,
  prefilter ACCURATE). Light Tree on. Bounces: total ≥16, transmission ≥12,
  volume 3. Volumetrics: `volume_step_rate` 0.4. Render ≥1080p.
- **Color management — deliberate, never default.** Neon/emissive heroes: `Filmic`
  (rolls off highlights → bright colour keeps hue with white cores). `Standard`
  clips emissive to a white block; `AgX` pastels neon. Realistic product/interior:
  AgX. Set exposure so highlights blow to white *cores* while mids keep saturation.
  A/B the transform against the plate first.
- **Compositor finish (the cinema layer).** Glare `Fog Glow` (bloom halo) on any
  glow — the single biggest tell. `Streaks` for beams/speculars. Then vignette,
  faint chromatic aberration on the outer ~20%, film grain ≤0.03, mild S-curve.
- **Lighting — motivated, ratioed, volumetric.** 3-point with real ratios (fill
  ≈¼ key; rim cuts the subject off black). Practicals are real lights. Softboxes =
  Area lights sized to the subject. Light shafts = a Volume Scatter medium
  (density 0.05–0.2) in the beam. Near-black world so the rig does the work.
- **Textures / materials — realism IS imperfection.** No clean surface: edge-wear
  (Pointiness → ramp → roughness/albedo), micro-roughness breakup, dust/smudge on
  glass & metal, per-part tint. Photo PBR under procedural construction. Metallic
  0/1 only; clearcoat on lacquer, sheen on fabric, subsurface on skin/wax.
- **Emissive volumes (fluid, smoke, energy).** Ridged curl-noise, NOT soft noise:
  `ridge = 1−|2n−1|` powered 3–4 → thin bright filaments; union two octaves;
  density THIN (0.02–0.08 body) so emission stays crisp and doesn't blur to a
  uniform glow; emission ONLY on the veins (a uniform body-emission blows the deep
  centre to white because emission integrates along the ray). Domain-warp coords.
- **Glass / liquid / refraction.** transmission=1, roughness ~0, IOR 1.45–1.52,
  real `thickness`, ≥12 transmission bounces, screen refraction on. Back-light
  through it. Real caustics = MNEE (light `use_caustics`, glass caster, floor
  receiver).
- **Particles / atmosphere.** Dust motes in every beam — instanced sub-mm emissive
  specks, slow drift, low count, catching the key. Subtle = production value.
- **Camera — reference-locked.** Match focal length + framing to the plate FIRST;
  real DOF (f/2.8–5.6); heavy negative space; thirds, never dead-center-flat.
- **Verify against the plate every pass.** Fix highest-impact first: composition →
  value/light → material → micro-detail → grade.
