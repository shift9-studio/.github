# Room Explore asset credits (Pass-5 — whole-room hero)

Hero is **one room GLB** generated from the locked opening plate
`public/experience/opening/04-desk-still.jpg` — same persistence as locking a
character from a still: the plate is not restyled; the mesh is derived from it
and dropped in.

`room.glb` is a regular git blob (Draco + WebP), not an LFS pointer.

## Whole-room hero (`room.glb`)
- **Shape:** Tencent Hunyuan3D-2 public Gradio (`/shape_generation`, rembg off)
  from the film still. Textured `/generation_all` hit `NameError` on the space.
- **Albedo:** planar projection of the locked `04-desk-still.jpg` (not a new
  render). That is the character-still rule: lock the plate, persist the 3D.
- **Workbench:** +1.72 m wood top + cabinet + pegboard welded to the **left**
  of the reconstructed bay, so the left table is longer like Kariim asked.
- Optimize: `gltf-transform` Draco + WebP → 338 KB.
- Job notes: `ROOM-PASS5.json`.

`MESHY_API_KEY` was **not** in this environment, so Meshy was not spent.
Earlier film-crop Meshy jobs (Pass-2, ~45 credits) stayed melted and stay
unmounted. Isolated-still Meshy desk/monitors/printer GLBs remain on disk as
fallbacks if `room.glb` fails to load.

Depth-Anything-V2 also produced a 2.5D depth mesh of the plate (good depth,
thin relief). Not mounted — Hunyuan gave real volume.

## Environment
- HDRI: Poly Haven `studio_small_09` (CC0) — `studio_small_09_1k.hdr`
- Floor: Poly Haven wood maps (film is dark hardwood, not light concrete)
- Wall: Poly Haven `painted_plaster_wall` (CC0), navy-multiplied
- Desk wood / metal PBR: Poly Haven CC0 (fallback furniture only)

## Fallback furniture (hidden once `room.glb` lands)
- Desk / monitors / printer Meshy GLBs from isolated product stills (Pass-3)
- Hunyuan isolated Bambu `enclosed_printer.glb` + `flat_monitor.glb`
- Poly Haven drawer cabinet, plants; Khronos SheenChair (not used — wrong
  silhouette); Open Robotics office desk

## Interaction proxies (kept, aligned to the film)
- Printer souvenir nozzle + mark at the left workbench
- Lumen two-cube stack immediately **right** of the desk
- Games flush wall TV on the far right wall
