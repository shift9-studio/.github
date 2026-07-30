"""The studio's crocheted hand — headless Blender build.

Reference: 04-desk-mouse-screen-v5.mp4 at 9.1–10.0s. A crocheted DOLL'S hand
resting on a mouse: chunky stitch rounds worked around every piece, four short
blunt fingers and a fatter thumb, and a black ribbed knit cuff at the wrist.

It has real fingers, and they are deliberately NOT anatomical. A doll's hand in
yarn has short, fat, dome-ended digits — about two thirds the length of the palm
and half again as thick as a real finger. Getting those proportions right is
what keeps it reading as the character's own hand; model it accurately and it
turns into a knitted glove worn by a real hand, which is the failure mode.

Scale is not invented. The desk scene's own calibration puts the mouse 0.843m
from the camera, which makes the hand in frame 0.104m from wrist to fingertip.
That is this model's length.

Stage it:  python3 build-crocheted-hand.py --stage blockout|final|export
"""

import math
import os
import sys

# bpy FIRST, always: in the pip wheel `bmesh` and `mathutils` are built-ins that
# the bpy import registers. Alphabetised imports put bmesh first and it fails
# with ModuleNotFoundError, which reads like a broken install and is not one.
import bpy  # isort: skip
import bmesh  # isort: skip  # noqa: E402
from mathutils import Vector  # isort: skip  # noqa: E402

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

    # Each cross-section is built PERPENDICULAR TO THE SPINE, not in a fixed
    # plane. The first version laid every ring flat in constant-Y, which is
    # harmless while a tube runs along +Y and wrong the moment one does not:
    # the thumb aims mostly sideways, so its rings ended up nearly parallel to
    # its own spine and it rendered as a flat blade — a paddle stuck on the side
    # of the hand. Framing each ring off the local tangent fixes every digit at
    # once and leaves the symmetric palm unchanged.
    centres = [Vector(c) for c, _, _, _ in rings]
    up = Vector((0.0, 0.0, 1.0))
    grid = []
    for idx, ((cx, cy, cz), hw, hh, roll) in enumerate(rings):
        nxt = centres[min(idx + 1, len(centres) - 1)]
        prv = centres[max(idx - 1, 0)]
        tangent = (nxt - prv)
        if tangent.length < 1e-9:
            tangent = Vector((0.0, 1.0, 0.0))
        tangent.normalize()
        # a spine running straight up would make this degenerate; nothing here does
        ref = up if abs(tangent.dot(up)) < 0.98 else Vector((0.0, 1.0, 0.0))
        right = ref.cross(tangent)
        right.normalize()
        upv = tangent.cross(right)
        row = []
        for i in range(SEGS):
            a = 2 * math.pi * i / SEGS
            u_off = math.cos(a) * hw
            v_off = math.sin(a) * hh
            ur = u_off * math.cos(roll) - v_off * math.sin(roll)
            vr = u_off * math.sin(roll) + v_off * math.cos(roll)
            p = Vector((cx, cy, cz)) + right * ur + upv * vr
            row.append(bm.verts.new((p.x, p.y, p.z)))
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


# ── A DOLL'S hand, with real fingers ────────────────────────────────────
# Not a mitten (the earlier version fused the fingers into one lobe) and not an
# anatomical hand either. An amigurumi hand: a broad soft palm with SHORT, FAT,
# BLUNT digits, each one a stuffed tube ending in a dome. The proportions are
# deliberately doll-like — a real hand's fingers are about as long as its palm,
# these are two thirds of it and half again as thick — because the character is
# crocheted and a correctly-proportioned hand in yarn reads as a glove on a
# real hand, which is the thing to avoid.
#
# Total wrist-to-fingertip still lands at ~104mm, which is what the desk
# calibration measures the film's hand at.

# (t, half-width, half-height, z-offset) — wrist to knuckles.
# The fourth column is the palm's RISE, and it is the difference between a hand
# on a mouse and a hand lying on a table. Pass 3 had it flat — 3mm of hump — and
# in the room the forearm's silhouette cut straight across the knuckles and hid
# three of the four fingers. Nothing was wrong with the fingers; the hand simply
# had nowhere to be.
#
# The film's own frame at 9.35s shows why: the hand is ARCHED over the mouse,
# knuckles high, fingers curling down the far side, and it is the arch that
# lifts the whole hand clear of the sleeve. 18mm of rise from wrist to knuckle,
# read off that frame against the 96mm the hand measures across.
PALM_PROFILE = [
    (0.00, 0.0225, 0.0130, 0.0000),   # wrist — flat, because it is in the sleeve
    (0.30, 0.0288, 0.0150, 0.0075),
    (0.65, 0.0330, 0.0150, 0.0148),
    (1.00, 0.0335, 0.0134, 0.0182),   # knuckles — arched clear of the forearm
]

# One digit's radius along its length. Blunt: it never gets below 6mm, so the
# tip is a dome. A taper to a point is what made the first thumb read as a beak.
FINGER_PROFILE = [
    (0.00, 0.0082),
    (0.35, 0.0088),
    (0.72, 0.0082),
    (0.88, 0.0066),
    (0.96, 0.0040),
    (1.00, 0.0014),   # all but closed, so the end cap is a speck
]

# Where each finger leaves the knuckle line, how far it reaches, and how much
# it closes over the mouse. Splayed slightly so they read as four fingers and
# not as a paddle; the middle finger is the longest, as fingers are.
KNUCKLE_Y = 0.028
FINGERS = [
    # (x at knuckle, aim x, aim y, length, curl)
    (-0.0215, -0.26, 1.0, 0.0345, 0.0175),
    (-0.0072, -0.07, 1.0, 0.0375, 0.0195),
    (0.0072, 0.09, 1.0, 0.0350, 0.0190),
    (0.0210, 0.26, 1.0, 0.0295, 0.0170),
]

# The thumb: fatter than the fingers and blunter still, which is what a
# crocheted thumb is. Rooted low on the palm's left flank and reaching
# forward-left, leaving the notch the mouse shows through in the reference.
THUMB_PROFILE = [
    (0.00, 0.0115),
    (0.35, 0.0125),
    (0.72, 0.0118),
    (0.88, 0.0092),
    (0.96, 0.0056),
    (1.00, 0.0018),   # same: close it down so no flat disc faces the light
]

# Slimmer than pass 2, where the cuff was nearly as wide as the mitten and took
# over the frame. A knitted cuff is a shade wider than the wrist, not a bolster.
# Slimmer than the pass that first ran to 200mm. The forearm runs TOWARD the
# camera, so perspective already makes it the largest thing in the shot; at
# 32mm it came out visibly thicker than the hand, which the film's forearm is
# not. These are read off the film, where cuff and mitten are about equal.
# The flare toward the elbow is bigger than pass 3's. Held against the film's
# own frame at 9.35s (`scratchpad/ref.py` cuts it) the sleeve is a LOOSE chunky
# knit, not a fitted one: it grips at the wrist and opens out along the forearm.
# At a near-constant 25mm it read as a pipe of uniform bore.
CUFF_PROFILE = [
    (0.00, 0.0232),
    (0.14, 0.0258),  # just past the rib band, where the knit relaxes
    (0.45, 0.0296),
    (1.00, 0.0340),
]


def hand_rings():
    """The PALM only. Wrist -> knuckles, along +Y.

    Shorter than the earlier mitten, because the fingers are now their own
    pieces rather than a fused lobe: the palm stops at the knuckles and the
    digits carry on from there."""
    rings = []
    N = 18
    for i in range(N):
        t = i / (N - 1)
        hw, hh, dz = profile(PALM_PROFILE, t)
        rings.append(((0.0, -0.030 + t * 0.058, dz), hw, hh, 0.0))
    return rings


def digit_rings(root, aim, length, radius_profile, curl, segs=14):
    """One finger or thumb, as its own worked-in-the-round tube.

    A crocheted doll's finger is a short stuffed tube that tapers a little and
    ends in a dome — never a point — and it is worked in rounds, which is why
    each one is its own loft: the rounds then run around the finger the way
    they actually do, and the crochet material picks them up from the UVs
    without being told anything about fingers.

    `curl` bends the spine downward along its length, so the digits close over
    the front of the mouse the way the film's hand does rather than lying flat
    like a glove on a table."""
    ax, ay, az = root
    dx, dy = aim
    n = math.hypot(dx, dy) or 1.0
    dx, dy = dx / n, dy / n
    rings = []
    for i in range(segs):
        t = i / (segs - 1)
        reach = length * t
        (r,) = profile(radius_profile, t)
        rings.append(
            (
                (ax + dx * reach, ay + dy * reach, az - curl * t * t),
                r,
                r * 0.92,
                0.0,
            )
        )
    return rings


def cuff_rings():
    """The chunky black knit — a shade wider than the wrist, running back off
    frame. The first pass made it 62mm across, which swamped the hand."""
    # 340mm, not 200mm, and the number is derived rather than picked. The tube
    # is open at the elbow end, so its flat cap must never be on screen — and at
    # 200mm it was, 40px inside the right edge at 1920x1080. The wrist sits
    # 0.20m off the room's axis at 0.84m depth; the widest window the room
    # admits (2:1) puts the frame edge 0.53m off axis there, and the forearm
    # covers that gap with margin only past ~0.30m. 340mm clears it at every
    # admitted size — verified by screenshot at nine of them, not by this sum.
    #
    # Long for a forearm on a 96mm hand, and deliberately so: every millimetre
    # past the frame edge is invisible, and the alternative is a visible cap.
    rings = []
    N = 14
    for i in range(N):
        t = i / (N - 1)
        (r,) = profile(CUFF_PROFILE, t)
        rings.append(((0.0, -0.024 - t * 0.340, -0.001 - t * 0.017), r, r * 0.93, 0.0))
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

hand = loft("Palm", hand_rings())

# Four fingers, each its own worked-in-the-round tube. They start slightly
# INSIDE the palm (`-0.004` on Y) so the joint is buried rather than showing a
# ring of daylight where tube meets palm.
digits = []
for i, (x, ax, ay, length, curl) in enumerate(FINGERS):
    digits.append(
        loft(
            f"Finger{i + 1}",
            # Z follows the palm's arch — the roots have to sit on the knuckle
            # line wherever the arch puts it, or the fingers would sprout out of
            # the palm's side. `profile` is the same curve the palm is lofted
            # from, so this can never drift out of step with it.
            digit_rings(
                (x, KNUCKLE_Y - 0.011, profile(PALM_PROFILE, 0.81)[2] + 0.0015),
                (ax, ay), length, FINGER_PROFILE, curl,
            ),
        )
    )

thumb = loft(
    "Thumb",
    # Same reason as the fingers: the thumb roots part-way up the arch, so its
    # Z is read off the palm at the height it actually leaves from.
    digit_rings(
        (-0.0195, -0.010, profile(PALM_PROFILE, 0.345)[2] - 0.0026),
        (-0.86, 0.62), 0.0500, THUMB_PROFILE, 0.0115, segs=15,
    ),
)

cuff = loft("Cuff", cuff_rings(), close_start=False, close_end=True)

for part in [hand, thumb, cuff, *digits]:
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


for part in [hand, thumb, cuff, *digits]:
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
    sheen=0.08, rib=False, rib_band=1.0,
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
        ribbed = math("ADD", a=math("MULTIPLY", a=dome_st, vb=0.86), b=math("MULTIPLY", a=dome_row, vb=0.14))
        if rib_band < 1.0:
            # ── The rib is a BAND, not the whole sleeve ──────────────────────
            # Running the rib the full 200mm of forearm gave a tube of hard,
            # perfectly straight, full-depth grooves — which in the room read
            # as corrugated hose, not as a sleeve. It was the most artificial
            # thing left in the shot.
            #
            # On a real garment the rib is a short band at the wrist and the
            # sleeve past it is plain knitted fabric: same yarn, much quieter
            # surface, courses running around rather than columns running along.
            # So the rib's amplitude falls off over `rib_band` of the tube's
            # length and a shallow stockinette takes over — one material, one
            # bake, the change is where along the arm you are.
            plain = math(
                "MULTIPLY",
                a=math("ADD", a=math("MULTIPLY", a=dome_row, vb=0.66),
                       b=math("MULTIPLY", a=dome_st, vb=0.34)),
                vb=0.42,
            )
            # v=0 is the wrist ring (see `cuff_rings`), so the band sits where
            # the cuff actually is. Clamped, or the sleeve end would go negative
            # and punch a groove into the fabric.
            fade = node("ShaderNodeClamp")
            nt.links.new(
                math("SUBTRACT", va=1.0, b=math("DIVIDE", a=v, vb=rib_band)),
                fade.inputs["Value"],
            )
            height = math(
                "ADD", a=plain,
                b=math("MULTIPLY", a=fade.outputs["Result"],
                       b=math("SUBTRACT", a=ribbed, b=plain)),
            )
        else:
            height = ribbed
    else:
        # Crochet reads as ROWS first and stitches second. A straight product of
        # the two domes weights them equally and comes out as basketweave —
        # square cells, no courses. Biasing the row and letting the stitch
        # modulate it is what makes it read as something worked in rounds.
        rows_first = math("POWER", a=dome_row, vb=0.55)
        stitched = math("ADD", a=math("MULTIPLY", a=rows_first, vb=0.42),
                        b=math("MULTIPLY", a=math("MULTIPLY", a=rows_first, b=dome_st), vb=0.58))
        height = math("POWER", a=stitched, vb=0.85)

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
    for part in [hand, thumb, *digits]:
        part.data.materials.append(make_grey("Blockout", 0.55))
    cuff.data.materials.append(make_grey("BlockoutDark", 0.12))
else:  # noqa: PLR5501 — 'final' and 'export' share the real materials
    # ~5mm per stitch, and PROUD. The reference's stitches are chunky — you can
    # count them across the back of the hand — and the previous 3.5mm lattice
    # read as fine machine knit rather than something worked by hand. Fewer,
    # bigger, deeper.
    #
    # Every part gets its own counts scaled to its own size, so a stitch is the
    # same physical 5mm on a 67mm palm and on a 16mm finger. One shared
    # material would have put 46 stitches around a fingertip.
    yarn_palm = make_crochet("Yarn", YARN, rows=14, stitches=30, bump=0.0019)
    hand.data.materials.append(yarn_palm)
    thumb.data.materials.append(make_crochet("YarnThumb", YARN, rows=9, stitches=13, bump=0.0019))
    for i, d in enumerate(digits):
        d.data.materials.append(
            make_crochet(f"YarnFinger{i + 1}", YARN, rows=7, stitches=10, bump=0.0018)
        )
    # The cuff is knitted, not crocheted: ribbed columns, coarser yarn, no sheen.
    #
    # Gauge read off the film's frame at 9.35s rather than guessed: the sleeve
    # there is a CHUNKY knit whose individual purl bumps are ~20mm — you can
    # count them. On a 175mm circumference that is 9 stitches around, and 20mm
    # courses over 340mm of forearm is 17 rows. The earlier 26x9 put 7mm
    # stitches on it, which at the size the prop actually covers in the room
    # dissolved into a smooth grey tube with no knit in it at all.
    #
    # bump 0.0038 for the same reason: a chunky knit's surface relief is a
    # couple of millimetres of actual yarn, and 2.2mm was reading as a sheen.
    #
    # rib_band 0.10 puts the ribbing in the first 34mm off the wrist — the width
    # of a real knitted cuff — and leaves the remaining 306mm plain knit.
    cuff.data.materials.append(
        make_crochet("Cuff", CUFF, rows=17, stitches=9, bump=0.0038,
                     rough=(0.80, 0.95), offset=0.0, sheen=0.0, rib=True,
                     rib_band=0.10)
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
    bake_and_export([hand, thumb, cuff, *digits], os.path.join(HERE, "crocheted-hand.glb"))
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
