"""The studio's crocheted hand — headless Blender build.

Reference: 04-desk-mouse-screen-v5.mp4 at 9.1–10.0s. A crocheted mitten in
ochre yarn resting on a mouse: stitch rows running AROUND the hand, a separate
thumb gusset with a deep notch between it and the finger mass, and a chunky
black ribbed cuff at the wrist. No individual fingers — it is a mitten.

Scale is not invented. The desk scene's own calibration puts the mouse 0.843m
from the camera, which makes the hand in frame 0.104m from wrist to fingertip.
That is this model's length.

Stage it:  python3 build_hand.py --stage blockout|final
"""

import math
import os
import sys

# bpy FIRST, always: in the pip wheel `bmesh` and `mathutils` are built-ins that
# the bpy import registers. Alphabetised imports put bmesh first and it fails
# with ModuleNotFoundError, which reads like a broken install and is not one.
import bpy  # isort: skip
import bmesh  # isort: skip  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
RENDERS = os.path.join(HERE, "renders")


def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


STAGE = arg("--stage", "blockout")

# ── scene reset ──────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"

# ── version-safe Principled sockets (3.x names -> 4.x/5.x) ───────────────
ALIASES = {
    "Specular IOR Level": ["Specular"],
    "Subsurface Weight": ["Subsurface"],
    "Transmission Weight": ["Transmission"],
    "Emission Color": ["Emission"],
    "Coat Weight": ["Clearcoat"],
    "Sheen Weight": ["Sheen"],
}


def set_input(node, name, value):
    sock = node.inputs.get(name)
    if sock is None:
        for legacy in ALIASES.get(name, []):
            sock = node.inputs.get(legacy)
            if sock:
                break
    if sock is None:
        print(f"AUDIT: WARN missing socket '{name}' on {node.name}")
        return
    sock.default_value = value


# ── the shape ────────────────────────────────────────────────────────────
# A mitten is a lofted tube: rings of quads threaded along a spine. Built that
# way rather than from booleaned primitives for two reasons — the topology
# stays quad-dominant so it subdivides cleanly, and the ring/spine grid IS the
# UV grid, which is what lets the crochet rows run around the hand instead of
# being sprayed on as noise.

SEGS = 24  # points around each ring


def loft(name, rings, close_start=True, close_end=True):
    """Build a quad tube through `rings` — each a (centre, half_width,
    half_height, roll) cross-section. Returns the object, UV-mapped with
    u around the ring and v along the spine."""
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    grid = []
    for (cx, cy, cz), hw, hh, roll in rings:
        row = []
        for i in range(SEGS):
            a = 2 * math.pi * i / SEGS
            x, z = math.cos(a) * hw, math.sin(a) * hh
            xr = x * math.cos(roll) - z * math.sin(roll)
            zr = x * math.sin(roll) + z * math.cos(roll)
            row.append(bm.verts.new((cx + xr, cy, cz + zr)))
        grid.append(row)
    bm.verts.ensure_lookup_table()

    # walls — one quad per (ring gap x segment)
    for r in range(len(grid) - 1):
        for i in range(SEGS):
            j = (i + 1) % SEGS
            f = bm.faces.new((grid[r][i], grid[r][j], grid[r + 1][j], grid[r + 1][i]))
            # u wraps without a modulo so the seam face tiles cleanly; v is the
            # spine, which is the direction crochet rows stack in.
            for loop, (u, v) in zip(
                f.loops,
                [(i, r), (i + 1, r), (i + 1, r + 1), (i, r + 1)],
            ):
                loop[uv_layer].uv = (u / SEGS, v / (len(grid) - 1))
    # Caps get the UVs of the ring they close, so the stitch pattern carries on
    # over the fingertip instead of collapsing to a single texel there.
    if close_start:
        cap = bm.faces.new(list(reversed(grid[0])))
        for k, loop in enumerate(cap.loops):
            loop[uv_layer].uv = ((SEGS - k) / SEGS, 0.0)
    if close_end:
        cap = bm.faces.new(grid[-1])
        for k, loop in enumerate(cap.loops):
            loop[uv_layer].uv = (k / SEGS, 1.0)

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    return obj


def profile(points, t):
    """Smoothly interpolate a list of (t, *values) control points.

    Control points rather than analytic curves: the first pass built the
    silhouette out of sines and eases, and tuning it meant guessing which term
    to nudge. These are the actual measurements off the reference, in the units
    the model is built in, and each one can be moved on its own."""
    for i in range(len(points) - 1):
        t0, *v0 = points[i]
        t1, *v1 = points[i + 1]
        if t <= t1 or i == len(points) - 2:
            k = 0.0 if t1 == t0 else min(max((t - t0) / (t1 - t0), 0.0), 1.0)
            k = k * k * (3 - 2 * k)  # smoothstep, so joints don't crease
            return [a + (b - a) * k for a, b in zip(v0, v1)]
    return points[-1][1:]


# (t, half-width, half-height, z-offset) from wrist to fingertip.
# A hand is 84mm across the knuckles and 34mm thick — the first pass came out
# 53mm thick, which read as a bread roll.
HAND_PROFILE = [
    (0.00, 0.0235, 0.0135, 0.0000),
    (0.15, 0.0305, 0.0158, 0.0028),
    (0.35, 0.0392, 0.0170, 0.0046),
    (0.55, 0.0420, 0.0163, 0.0032),   # knuckles — widest
    (0.75, 0.0408, 0.0139, -0.0030),
    (0.88, 0.0352, 0.0108, -0.0098),
    (1.00, 0.0170, 0.0055, -0.0175),  # rounded tip, dipped over the mouse
]

# The thumb gusset: shorter and fatter than the first pass, and swung further
# out to the side so the notch between it and the fingers actually opens.
# Fatter and blunter than pass 2, which tapered to a spike and read as a beak.
# Crocheted thumbs are stuffed tubes — they round off, they do not come to a point.
THUMB_PROFILE = [
    (0.00, 0.0150),
    (0.30, 0.0178),
    (0.65, 0.0172),
    (0.88, 0.0140),
    (1.00, 0.0092),
]

# Slimmer than pass 2, where the cuff was nearly as wide as the mitten and took
# over the frame. A knitted cuff is a shade wider than the wrist, not a bolster.
# Slimmer than the pass that first ran to 200mm. The forearm runs TOWARD the
# camera, so perspective already makes it the largest thing in the shot; at
# 32mm it came out visibly thicker than the hand, which the film's forearm is
# not. These are read off the film, where cuff and mitten are about equal.
CUFF_PROFILE = [
    (0.00, 0.0232),
    (0.20, 0.0246),
    (0.45, 0.0256),
    (1.00, 0.0278),  # the sleeve widens a little toward the elbow
]


def hand_rings():
    """Wrist -> fingertip, along +Y."""
    rings = []
    N = 26
    for i in range(N):
        t = i / (N - 1)
        hw, hh, dz = profile(HAND_PROFILE, t)
        rings.append(((0.0, -0.030 + t * 0.108, dz), hw, hh, 0.0))
    return rings


def thumb_rings():
    """A separate gusset, the way a crocheted mitten actually has one. Rooted
    on the palm's left flank near the wrist and reaching forward-left, which is
    what leaves the notch the mouse shows through in the reference."""
    rings = []
    N = 12
    ax, ay, az = -0.024, -0.002, 0.000
    for i in range(N):
        t = i / (N - 1)
        reach = 0.056 * t
        (r,) = profile(THUMB_PROFILE, t)
        rings.append(
            (
                (ax - reach * 0.80, ay + reach * 0.60, az + 0.004 * math.sin(math.pi * t) - 0.012 * t * t),
                r,
                r * 0.88,
                0.0,
            )
        )
    return rings


def cuff_rings():
    """The chunky black knit — a shade wider than the wrist, running back off
    frame. The first pass made it 62mm across, which swamped the hand."""
    # 200mm, not 78mm. The forearm has to run off the edge of frame the way it
    # does in the film — at 78mm it stopped in mid-air on the desk, and once
    # the subdivision came off for export its flat end cap was the most
    # noticeable thing in the render.
    rings = []
    N = 14
    for i in range(N):
        t = i / (N - 1)
        (r,) = profile(CUFF_PROFILE, t)
        rings.append(((0.0, -0.024 - t * 0.200, -0.001 - t * 0.010), r, r * 0.93, 0.0))
    return rings


# Subdivision is for the beauty renders, not for the shipped asset. The loft is
# already 24 segments around and 26 rings long; at the ~180px the prop covers in
# the room, one subdivision level cost 200 KB of vertex data to smooth a
# silhouette that was not visibly faceted to begin with.
SUBSURF = 2 if STAGE != "export" else 0


def smooth_stack(obj, levels=SUBSURF):
    """Non-destructive: subdivision for the organic form, weighted normals to
    keep the shading clean. No bevel — yarn has no hard edges to protect."""
    if levels:
        sub = obj.modifiers.new("Subdivision", "SUBSURF")
        sub.levels = sub.render_levels = levels
    wn = obj.modifiers.new("WeightedNormal", "WEIGHTED_NORMAL")
    wn.keep_sharp = True
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_auto_smooth(angle=math.radians(45))


root = bpy.data.objects.new("Hand_root", None)
scene.collection.objects.link(root)

hand = loft("Hand", hand_rings())
thumb = loft("Thumb", thumb_rings())
cuff = loft("Cuff", cuff_rings(), close_start=False, close_end=True)
for part in (hand, thumb, cuff):
    part.parent = root
    smooth_stack(part)


# ── mesh audit ───────────────────────────────────────────────────────────
def audit_mesh(obj):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    tris = sum(1 for f in bm.faces if len(f.verts) == 3)
    quads = sum(1 for f in bm.faces if len(f.verts) == 4)
    ngons = sum(1 for f in bm.faces if len(f.verts) > 4)
    nonman = sum(1 for e in bm.edges if not e.is_manifold)
    loose = sum(1 for v in bm.verts if not v.link_edges)
    bm.free()
    d = obj.dimensions
    print(
        f"AUDIT: {obj.name} tris={tris} quads={quads} ngons={ngons} "
        f"non_manifold_edges={nonman} loose_verts={loose} "
        f"dims={d.x:.3f}x{d.y:.3f}x{d.z:.3f}m"
    )


for part in (hand, thumb, cuff):
    audit_mesh(part)


# ── materials ────────────────────────────────────────────────────────────
def make_grey(name, value=0.5):
    mat = bpy.data.materials.new(name)
    if mat.node_tree is None:
        mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    set_input(bsdf, "Base Color", (value, value, value, 1.0))
    set_input(bsdf, "Roughness", 0.65)
    return mat


PI = math.pi


def srgb(hex_str):
    """A hex token -> the LINEAR RGBA Blender actually wants.

    Blender's colour inputs are linear. Feeding them sRGB components straight
    off a hex value renders everything washed out and pale — pass 1 turned
    #c07243 ochre into pale peach exactly this way."""
    h = hex_str.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i : i + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


def make_crochet(
    name, base_color, rows, stitches, bump=0.0016, rough=(0.72, 0.90), offset=0.5,
    sheen=0.08, rib=False,
):
    """Crocheted fabric, built out of the mesh's own UV grid.

    The rows are the point. Crochet is a spiral of stitches worked round and
    round, so the surface is a lattice, not a noise field — and the loft's UVs
    already run u around the hand and v along it, which is exactly the
    direction real rows stack in. Every stitch dome is placed, not sampled:

        row      = v * rows            -> which round we are on
        stitch   = u * stitches + floor(row) * offset
        height   = sin(pi * frac(row)) * sin(pi * frac(stitch))

    The `floor(row) * offset` term is what makes it read as crochet rather than
    as a grid of pimples: each round is shifted half a stitch against the one
    below, the way a real stitch sits in the gap between the two beneath it.

    A noise texture would have given "bumpy fabric" from any angle. It would
    not have given rows that follow the thumb around its gusset.
    """
    mat = bpy.data.materials.new(name)
    if mat.node_tree is None:
        mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]

    def node(kind, **kw):
        n = nt.nodes.new(kind)
        for k, v in kw.items():
            setattr(n, k, v)
        return n

    def math(op, a=None, b=None, va=None, vb=None):
        n = node("ShaderNodeMath", operation=op)
        if va is not None:
            n.inputs[0].default_value = va
        if vb is not None:
            n.inputs[1].default_value = vb
        if a is not None:
            nt.links.new(a, n.inputs[0])
        if b is not None:
            nt.links.new(b, n.inputs[1])
        return n.outputs[0]

    uv = node("ShaderNodeUVMap")
    sep = node("ShaderNodeSeparateXYZ")
    nt.links.new(uv.outputs["UV"], sep.inputs["Vector"])
    u, v = sep.outputs["X"], sep.outputs["Y"]

    rowf = math("MULTIPLY", a=v, vb=rows)
    row_index = math("FLOOR", a=rowf)
    row_frac = math("FRACT", a=rowf)

    stitchf = math("ADD", a=math("MULTIPLY", a=u, vb=stitches), b=math("MULTIPLY", a=row_index, vb=offset))
    stitch_frac = math("FRACT", a=stitchf)

    dome_row = math("SINE", a=math("MULTIPLY", a=row_frac, vb=PI))
    dome_st = math("SINE", a=math("MULTIPLY", a=stitch_frac, vb=PI))
    if rib:
        # A knitted cuff is RIBBED — columns running along the tube, with only
        # a faint course between them. Multiplying the two domes (which is
        # right for crochet) gave the cuff a quilted grid that read as a puffer
        # jacket, not knitwear.
        height = math("ADD", a=math("MULTIPLY", a=dome_st, vb=0.86), b=math("MULTIPLY", a=dome_row, vb=0.14))
    else:
        height = math("POWER", a=math("MULTIPLY", a=dome_row, b=dome_st), vb=0.62)

    # a little fibre fuzz over the stitch lattice, so the yarn is not plastic
    fuzz = node("ShaderNodeTexNoise")
    fuzz.inputs["Scale"].default_value = 420.0
    fuzz.inputs["Detail"].default_value = 3.0
    surface = math("ADD", a=height, b=math("MULTIPLY", a=fuzz.outputs["Fac"], vb=0.22))

    bump_node = node("ShaderNodeBump")
    bump_node.inputs["Strength"].default_value = 0.85
    bump_node.inputs["Distance"].default_value = bump
    nt.links.new(surface, bump_node.inputs["Height"])
    nt.links.new(bump_node.outputs["Normal"], bsdf.inputs["Normal"])

    # colour: the valleys between stitches sit in their own shadow, so the yarn
    # is darker where the lattice dips. Driven by the same height field.
    ramp = node("ShaderNodeValToRGB")
    dark = [c * 0.58 for c in base_color[:3]] + [1.0]
    ramp.color_ramp.elements[0].color = dark
    ramp.color_ramp.elements[1].color = base_color
    nt.links.new(height, ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])

    # roughness: never a bare constant — wool is matte, and the crowns of the
    # stitches catch a touch more light than the valleys.
    rramp = node("ShaderNodeValToRGB")
    rramp.color_ramp.elements[0].color = (rough[1],) * 3 + (1,)
    rramp.color_ramp.elements[1].color = (rough[0],) * 3 + (1,)
    nt.links.new(height, rramp.inputs["Fac"])
    nt.links.new(rramp.outputs["Color"], bsdf.inputs["Roughness"])

    set_input(bsdf, "Metallic", 0.0)
    # Wool has a soft rim, but sheen is a WHITE scattering lobe: at 0.35 it
    # desaturated the ochre to peach and lifted the near-black cuff to mid-grey.
    set_input(bsdf, "Sheen Weight", sheen)
    return mat


# Sampled from the film at 9.35s; the same hex values are tokens in
# @shift9/theme (--s9-yarn-ochre, --s9-yarn-cuff), converted to linear here.
YARN = srgb("#c07243")
CUFF = srgb("#131214")

if STAGE == "blockout":
    for part in (hand, thumb):
        part.data.materials.append(make_grey("Blockout", 0.55))
    cuff.data.materials.append(make_grey("BlockoutDark", 0.12))
else:  # noqa: PLR5501 — 'final' and 'export' share the real materials
    # ~3.5mm per stitch: 30 rounds up a 108mm mitten, 46 stitches around it.
    # Pass 1 used 22x34 and the stitches read as pineapple scales — too few,
    # too proud. Real crochet at this size is finer than it looks.
    hand.data.materials.append(make_crochet("Yarn", YARN, rows=30, stitches=46, bump=0.0011))
    # the thumb is a smaller tube worked at the same stitch size, so its counts
    # scale with its dimensions rather than matching the palm's
    thumb.data.materials.append(make_crochet("YarnThumb", YARN, rows=15, stitches=20, bump=0.0011))
    # the cuff is knitted, not crocheted: ribbed columns, coarser yarn, no sheen
    cuff.data.materials.append(
        make_crochet("Cuff", CUFF, rows=9, stitches=26, bump=0.0022,
                     rough=(0.80, 0.95), offset=0.0, sheen=0.0, rib=True)
    )

# ground for scale
bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0, -0.021))
ground = bpy.context.active_object
ground.name = "Ground"
ground.data.materials.append(make_grey("GroundMat", 0.20))

# ── lighting: 3-point, aimed at the hand ─────────────────────────────────
target = bpy.data.objects.new("CamTarget", None)
target.location = (0, 0.015, 0.0)
scene.collection.objects.link(target)


def aim(ob):
    c = ob.constraints.new("TRACK_TO")
    c.target, c.track_axis, c.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"


def add_light(name, kind, loc, energy, color, size=0.5):
    data = bpy.data.lights.new(name, kind)
    data.energy, data.color = energy, color
    if kind == "AREA":
        data.size = size
    ob = bpy.data.objects.new(name, data)
    ob.location = loc
    scene.collection.objects.link(ob)
    aim(ob)
    return ob


# Energies for a 10cm subject at ~30cm. The first pass used film-set numbers
# (28W key) on a doll-sized object and blew every surface to pure white — the
# blockout render carried no shape information at all.
add_light("Key", "AREA", (-0.22, -0.18, 0.30), 5.0, (1.0, 0.95, 0.85), 0.30)
add_light("Fill", "AREA", (0.25, -0.14, 0.12), 1.2, (0.75, 0.85, 1.0), 0.40)
add_light("Rim", "AREA", (0.06, 0.28, 0.22), 3.5, (1.0, 1.0, 1.0), 0.12)

world = bpy.data.worlds.new("World")
scene.world = world
if world.node_tree is None:
    world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.03, 0.03, 0.035, 1.0)

# ── camera ───────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 50
cam = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
aim(cam)


# Cycles CPU, not EEVEE, and not as a fallback — as the choice.
#
# EEVEE needs a GL context. On this box it assigns fine (so a try/except around
# the assignment proves nothing) and then SIGABRTs mid-render with
# "Couldn't open libEGL.so.1", which kills the process rather than raising
# something catchable. Tried once, killed the run; switching engine class
# rather than retrying it.
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.render.resolution_x = scene.render.resolution_y = 900
scene.render.image_settings.file_format = "PNG"

# Standard, not AgX. Blender 4+/5 defaults to the AgX view transform, which
# rolls saturated colour off hard in the highlights — it turned this model's
# #c07243 ochre into pale peach for two passes while the material was correct
# all along. It also matters beyond the preview: this asset gets baked and
# shipped, and judging albedo through a film-emulation curve bakes the wrong
# colour into the texture.
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "None"

# ── bake + export ────────────────────────────────────────────────────────
# glTF carries PBR TEXTURES, not shader graphs. Every stitch in this model is a
# node network, so exporting the mesh alone would ship a plain orange blob.
# The lattice has to be baked down to maps first — that is what makes it
# survive the trip into the browser.
BAKE_PX = 512  # the prop covers ~180 screen px in the room; 512 is already 3x


def bake_and_export(parts, out_glb):
    ground.select_set(False)
    ground.hide_render = True

    # 1. Apply the modifier stack — baking and glTF both want real geometry.
    for obj in parts:
        bpy.context.view_layer.objects.active = obj
        for mod in list(obj.modifiers):
            bpy.ops.object.modifier_apply(modifier=mod.name)

    # 2. One object, keeping all three material slots.
    bpy.ops.object.select_all(action="DESELECT")
    for obj in parts:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    merged = bpy.context.active_object
    merged.name = "CrochetedHand"

    # 3. A SECOND uv layer for the bake target.
    #    The ring UVs stay exactly as they are — the crochet material reads
    #    them, and they overlap between the three parts, which is fine for a
    #    procedural texture and fatal for a bake. smart_project gives the bake
    #    its own non-overlapping layout; island_margin keeps islands from
    #    touching, which is what stamps square blemishes when they do.
    bake_uv = merged.data.uv_layers.new(name="Bake")
    merged.data.uv_layers.active = bake_uv
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.02)
    bpy.ops.object.mode_set(mode="OBJECT")

    scene.render.engine = "CYCLES"
    scene.cycles.samples = 24
    scene.render.bake.margin = 8
    scene.render.bake.use_selected_to_active = False

    def new_image(name, non_color, fill):
        img = bpy.data.images.new(name, BAKE_PX, BAKE_PX, alpha=False,
                                  float_buffer=False, is_data=non_color)
        if non_color:
            img.colorspace_settings.name = "Non-Color"
        img.generated_color = fill
        return img

    # Two maps, not three. Roughness on wool runs 0.80–0.95 — a range narrow
    # enough that a whole 512² map was being spent on a variation nobody can
    # see at this size. It ships as a constant on the material instead, and the
    # third of the file it was costing goes away.
    images = {
        "albedo": new_image("hand_albedo", False, (0.5, 0.5, 0.5, 1)),
        "normal": new_image("hand_normal", True, (0.5, 0.5, 1.0, 1)),
    }

    def target(img):
        """Point every material's bake output at this image."""
        nodes = []
        for slot in merged.material_slots:
            nt = slot.material.node_tree
            n = nt.nodes.new("ShaderNodeTexImage")
            n.image = img
            n.select = True
            nt.nodes.active = n
            nodes.append((nt, n))
        return nodes

    def clear(nodes):
        for nt, n in nodes:
            nt.nodes.remove(n)

    bpy.ops.object.select_all(action="DESELECT")
    merged.select_set(True)
    bpy.context.view_layer.objects.active = merged

    # Base colour via an EMIT pass, not DIFFUSE: an emission bake returns the
    # raw node value with no lighting baked into it, so the albedo map holds
    # the material's own colour rather than this scene's key light.
    saved = []
    for slot in merged.material_slots:
        nt = slot.material.node_tree
        bsdf = nt.nodes["Principled BSDF"]
        src = bsdf.inputs["Base Color"].links[0].from_socket
        emit = nt.nodes.new("ShaderNodeEmission")
        nt.links.new(src, emit.inputs["Color"])
        out = nt.nodes["Material Output"]
        saved.append((nt, emit, out, out.inputs["Surface"].links[0].from_socket))
        nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])

    nodes = target(images["albedo"])
    bpy.ops.object.bake(type="EMIT")
    clear(nodes)
    for nt, emit, out, original in saved:
        nt.links.new(original, out.inputs["Surface"])
        nt.nodes.remove(emit)
    print("AUDIT: baked albedo (EMIT pass — no scene lighting in the map)")

    nodes = target(images["normal"])
    bpy.ops.object.bake(type="NORMAL")
    clear(nodes)
    print("AUDIT: baked normal (carries every stitch — the geometry does not)")

    # 4. One clean texture-driven material replacing all three graphs.
    mat = bpy.data.materials.new("CrochetedHand")
    if mat.node_tree is None:
        mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    uvn = nt.nodes.new("ShaderNodeUVMap")
    uvn.uv_map = "Bake"

    def tex(img, out_socket, in_socket, through=None):
        n = nt.nodes.new("ShaderNodeTexImage")
        n.image = img
        nt.links.new(uvn.outputs["UV"], n.inputs["Vector"])
        if through is not None:
            nt.links.new(n.outputs[out_socket], through.inputs["Color"])
            nt.links.new(through.outputs["Normal"], bsdf.inputs[in_socket])
        else:
            nt.links.new(n.outputs[out_socket], bsdf.inputs[in_socket])
        return n

    tex(images["albedo"], "Color", "Base Color")
    nmap = nt.nodes.new("ShaderNodeNormalMap")
    nmap.uv_map = "Bake"
    tex(images["normal"], "Color", "Normal", through=nmap)
    set_input(bsdf, "Metallic", 0.0)
    set_input(bsdf, "Roughness", 0.88)  # wool, matte — see the note on the map

    merged.data.materials.clear()
    merged.data.materials.append(mat)

    # Drop the ring UVs. They were the input to the crochet lattice and that
    # lattice is now a baked map, so they are dead weight the browser would
    # download and never read — 8 bytes on every vertex.
    for layer in [layer for layer in merged.data.uv_layers if layer.name != "Bake"]:
        merged.data.uv_layers.remove(layer)

    # 5. glTF — deliberately NOT Draco-compressed.
    #
    #    Draco took this file from 190 KB to 116 KB, and then cost more than it
    #    saved: a Draco mesh needs a decoder, and three's loader fetches that
    #    decoder from a Google CDN at runtime. On this box that fails outright;
    #    on the live site it would be a third-party request on the critical
    #    path of the entrance, and it would break behind any strict CSP.
    #    Self-hosting the decoder is the usual answer and costs ~90 KB of wasm
    #    — more than the 74 KB the compression saved on a mesh this small.
    #
    #    So: no compression, no decoder, no external request. The saving only
    #    starts paying on a much heavier mesh than an 8.8k-triangle prop.
    bpy.ops.object.select_all(action="DESELECT")
    merged.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=out_glb, export_format="GLB", use_selection=True,
        export_apply=True, export_image_format="JPEG", export_jpeg_quality=82,
    )
    audit_mesh(merged)
    print(f"AUDIT: exported {out_glb} ({os.path.getsize(out_glb) / 1024:.0f} KB)")
    return merged


if STAGE == "export":
    bake_and_export([hand, thumb, cuff], os.path.join(HERE, "crocheted-hand.glb"))
    raise SystemExit(0)

# ── three verification angles ────────────────────────────────────────────
ANGLES = {
    "front34": (-0.20, -0.22, 0.16),
    "side": (0.28, 0.01, 0.06),
    "top": (0.001, 0.001, 0.34),
}
for tag, loc in ANGLES.items():
    cam.location = loc
    scene.render.filepath = os.path.join(RENDERS, f"{STAGE}_{tag}.png")
    bpy.ops.render.render(write_still=True)
    print(f"AUDIT: rendered {scene.render.filepath}")
