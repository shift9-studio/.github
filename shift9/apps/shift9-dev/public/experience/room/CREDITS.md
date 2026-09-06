# Room Explore asset credits (Pass-3)

Hero furniture mixes Meshy clean-still meshes with Poly Haven / Khronos CC0.

## Environment
- HDRI: Poly Haven `studio_small_09` (CC0) — `studio_small_09_1k.hdr` (real file, not LFS pointer)
- Floor: Poly Haven `concrete_floor_worn_001` (CC0) — albedo + normal + roughness
- Wall: Poly Haven `painted_plaster_wall` (CC0) — albedo + normal + roughness
- Desk wood PBR: Poly Haven `wood_table_001` (CC0)
- Metal PBR: Poly Haven `metal_plate` (CC0)

## Hero furniture
- Desk / monitors / printer GLBs: Meshy.ai image-to-3D (`meshy-2`) from **clean isolated product stills** (white bg), not film crops.
  - Stills: `stills/{desk,monitors,printer}.png` (HF fal-ai FLUX schnell; Google image quota was 429)
  - Outputs: `{desk,monitors,printer}.glb` (Draco + WebP)
  - Tasks: desk `01a07788-af7d-7572-b831-37658a24cef1`, monitors `01a07788-b172-7011-9a8a-4d65305d1116`, printer `01a07788-b34e-727f-a85e-ac2aadfadd8a`
  - Credits this pass: **90** (30 each). Balance 3025 → 2935.
  - HF Gradio i2-3d tried first (space resets) → Meshy fallback per PLAYBOOK P-42.
- Desk CC0 fallbacks: Open Robotics Fuel `Desk` → `office_desk.glb` (CC-BY); Poly Haven `wooden_table_02`
- Printer bay cabinet: Poly Haven `drawer_cabinet` (CC0)
- Chair: Khronos `SheenChair` → `office_chair.glb` (CC0)
- Succulents: Poly Haven `potted_plant_04` (CC0)
- Prior melted Meshy film-crop jobs (~45 credits) are **not** mounted.

## Notes
- Printer Meshy GLB is gantry/frame-forward; cabinet/bench/pegboard + nozzle/mark hooks stay for film match + souvenir print.
- Lumen whitebox cubes stay procedural (film product).
