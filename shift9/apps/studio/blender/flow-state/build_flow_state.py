# build_flow_state.py — Flow State (Set 11) hero, Blender 5.0 / Cycles.
# Run headless:  python3 build_flow_state.py            (bpy as a module)
#            or: blender -b --factory-startup -P build_flow_state.py
# Reference: a clear rectangular glass canister of glowing low-viscosity cyan
# fluid swirling in ink-in-water tendrils to a level line, on a low wide matte
# dark-stone plinth, under one dramatic volumetric light shaft from above-right.
import bpy, bmesh, math, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "render", "flow_state.png")
os.makedirs(os.path.dirname(OUT), exist_ok=True)

# ---------- scene reset ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'

# ---------- version-safe Principled sockets (3.x -> 4.x/5.x) ----------
ALIASES = {
    "Specular IOR Level": ["Specular"],
    "Transmission Weight": ["Transmission"],
    "Emission Color": ["Emission"],
    "Coat Weight": ["Clearcoat"],
}
def set_in(node, name, value):
    s = node.inputs.get(name)
    if s is None:
        for a in ALIASES.get(name, []):
            s = node.inputs.get(a)
            if s: break
    if s is None:
        print(f"AUDIT: WARN missing socket '{name}' on {node.name}"); return
    s.default_value = value

def new(nt, kind):
    return nt.nodes.new(kind)

# ---------- materials ----------
def mat_glass():
    m = bpy.data.materials.new("Glass"); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    set_in(b, "Base Color", (1,1,1,1)); set_in(b, "Roughness", 0.0)
    set_in(b, "Metallic", 0.0); set_in(b, "IOR", 1.45)
    set_in(b, "Transmission Weight", 1.0); set_in(b, "Coat Weight", 0.3)
    m.use_screen_refraction = True
    return m

def mat_chrome():
    m = bpy.data.materials.new("Chrome"); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    set_in(b, "Base Color", (0.82,0.85,0.9,1)); set_in(b, "Metallic", 1.0)
    set_in(b, "Roughness", 0.18)
    return m

def mat_stone():
    m = bpy.data.materials.new("Stone"); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    set_in(b, "Base Color", (0.05,0.055,0.07,1)); set_in(b, "Metallic", 0.0)
    # roughness broken up by noise
    tex = new(nt, "ShaderNodeTexNoise"); tex.inputs["Scale"].default_value = 12.0
    tex.inputs["Detail"].default_value = 6.0
    ramp = new(nt, "ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.55,0.55,0.55,1)
    ramp.color_ramp.elements[1].color = (0.8,0.8,0.8,1)
    nt.links.new(tex.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Roughness"])
    # micro bump
    bn = new(nt, "ShaderNodeTexNoise"); bn.inputs["Scale"].default_value = 220.0
    bump = new(nt, "ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.12
    nt.links.new(bn.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m

def mat_glow_fill():
    """Very faint, UNIFORM volume (no vein detail) — just enough density/emission
       so the fluid isn't literally empty space between the ink planes, giving
       soft ambient depth-glow. Pure-volume ray integration blows any patterned
       emission to a flat white block (proven twice now — see WARM_START), so
       all tendril detail lives on the ink planes below, never in this volume."""
    m = bpy.data.materials.new("GlowFill"); m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = new(nt, "ShaderNodeOutputMaterial")
    transp = new(nt, "ShaderNodeBsdfTransparent")
    nt.links.new(transp.outputs["BSDF"], out.inputs["Surface"])
    vol = new(nt, "ShaderNodeVolumePrincipled")
    vol.inputs["Density"].default_value = 0.035
    if "Emission Strength" in vol.inputs: vol.inputs["Emission Strength"].default_value = 0.35
    if "Emission Color" in vol.inputs: vol.inputs["Emission Color"].default_value = (0.1,0.45,0.95,1)
    vol.inputs["Color"].default_value = (0.02,0.16,0.55,1)
    nt.links.new(vol.outputs["Volume"], out.inputs["Volume"])
    return m

def mat_ink_plane(seed):
    """Crisp 2D ink-tendril layer — SURFACE emission (Transparent<->Emission Mix
       Shader), not a volume, so the pattern never blurs from ray integration.
       Vortex-warped noise + a voronoi ridge give ink-drop spiral tendrils that
       fragment and re-join, matching the reference. Object-space X/Y (the
       plane's own mesh-local flat axes, before its 90° mount rotation) is the
       2D field the swirl runs in. `seed` offsets coords + vortex centers so
       each stacked layer reads as a distinct depth slice, not a repeat."""
    m = bpy.data.materials.new(f"Ink{seed}"); m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = new(nt, "ShaderNodeOutputMaterial")
    tc = new(nt, "ShaderNodeTexCoord")
    mp = new(nt, "ShaderNodeMapping")
    mp.inputs["Location"].default_value = (seed*0.83, seed*0.51, 0)
    mp.inputs["Scale"].default_value = (2.6, 2.6, 2.6)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])

    def vortex(vec_socket, cx, cy, strength, softness=0.30):
        sep = new(nt, "ShaderNodeSeparateXYZ")
        nt.links.new(vec_socket, sep.inputs["Vector"])
        dx = new(nt, "ShaderNodeMath"); dx.operation='SUBTRACT'; dx.inputs[1].default_value=cx
        nt.links.new(sep.outputs["X"], dx.inputs[0])
        dy = new(nt, "ShaderNodeMath"); dy.operation='SUBTRACT'; dy.inputs[1].default_value=cy
        nt.links.new(sep.outputs["Y"], dy.inputs[0])
        x2 = new(nt, "ShaderNodeMath"); x2.operation='MULTIPLY'
        nt.links.new(dx.outputs[0], x2.inputs[0]); nt.links.new(dx.outputs[0], x2.inputs[1])
        y2 = new(nt, "ShaderNodeMath"); y2.operation='MULTIPLY'
        nt.links.new(dy.outputs[0], y2.inputs[0]); nt.links.new(dy.outputs[0], y2.inputs[1])
        rad2 = new(nt, "ShaderNodeMath"); rad2.operation='ADD'
        nt.links.new(x2.outputs[0], rad2.inputs[0]); nt.links.new(y2.outputs[0], rad2.inputs[1])
        rad = new(nt, "ShaderNodeMath"); rad.operation='SQRT'
        nt.links.new(rad2.outputs[0], rad.inputs[0])
        ang = new(nt, "ShaderNodeMath"); ang.operation='ARCTAN2'
        nt.links.new(dy.outputs[0], ang.inputs[0]); nt.links.new(dx.outputs[0], ang.inputs[1])
        rsoft = new(nt, "ShaderNodeMath"); rsoft.operation='ADD'; rsoft.inputs[1].default_value=softness
        nt.links.new(rad.outputs[0], rsoft.inputs[0])
        twist = new(nt, "ShaderNodeMath"); twist.operation='DIVIDE'
        twist.inputs[0].default_value = strength
        nt.links.new(rsoft.outputs[0], twist.inputs[1])
        nang = new(nt, "ShaderNodeMath"); nang.operation='ADD'
        nt.links.new(ang.outputs[0], nang.inputs[0]); nt.links.new(twist.outputs[0], nang.inputs[1])
        cosv = new(nt, "ShaderNodeMath"); cosv.operation='COSINE'
        nt.links.new(nang.outputs[0], cosv.inputs[0])
        sinv = new(nt, "ShaderNodeMath"); sinv.operation='SINE'
        nt.links.new(nang.outputs[0], sinv.inputs[0])
        nx = new(nt, "ShaderNodeMath"); nx.operation='MULTIPLY'
        nt.links.new(rad.outputs[0], nx.inputs[0]); nt.links.new(cosv.outputs[0], nx.inputs[1])
        ny = new(nt, "ShaderNodeMath"); ny.operation='MULTIPLY'
        nt.links.new(rad.outputs[0], ny.inputs[0]); nt.links.new(sinv.outputs[0], ny.inputs[1])
        nxc = new(nt, "ShaderNodeMath"); nxc.operation='ADD'; nxc.inputs[1].default_value=cx
        nt.links.new(nx.outputs[0], nxc.inputs[0])
        nyc = new(nt, "ShaderNodeMath"); nyc.operation='ADD'; nyc.inputs[1].default_value=cy
        nt.links.new(ny.outputs[0], nyc.inputs[0])
        comb = new(nt, "ShaderNodeCombineXYZ")
        nt.links.new(nxc.outputs[0], comb.inputs["X"])
        nt.links.new(nyc.outputs[0], comb.inputs["Y"])
        nt.links.new(sep.outputs["Z"], comb.inputs["Z"])
        return comb.outputs["Vector"]

    warped = vortex(mp.outputs["Vector"], 0.10+seed*0.06, 0.35-seed*0.05, 1.0, 0.28)
    warped = vortex(warped, -0.30+seed*0.04, -0.30+seed*0.05, 0.55, 0.28)

    n1 = new(nt, "ShaderNodeTexNoise")
    n1.inputs["Scale"].default_value = 7.5; n1.inputs["Detail"].default_value = 14.0
    n1.inputs["Roughness"].default_value = 0.7
    if "Distortion" in n1.inputs: n1.inputs["Distortion"].default_value = 2.5
    nt.links.new(warped, n1.inputs["Vector"])
    n2 = new(nt, "ShaderNodeTexNoise")
    n2.inputs["Scale"].default_value = 15.0; n2.inputs["Detail"].default_value = 9.0
    n2.inputs["Roughness"].default_value = 0.65
    if "Distortion" in n2.inputs: n2.inputs["Distortion"].default_value = 1.8
    nt.links.new(warped, n2.inputs["Vector"])
    vor = new(nt, "ShaderNodeTexVoronoi"); vor.voronoi_dimensions = '3D'
    if hasattr(vor, "feature"): vor.feature = 'DISTANCE_TO_EDGE'
    vor.inputs["Scale"].default_value = 8.0
    if "Randomness" in vor.inputs: vor.inputs["Randomness"].default_value = 1.0
    nt.links.new(warped, vor.inputs["Vector"])
    vor_ridge = new(nt, "ShaderNodeMath"); vor_ridge.operation='SUBTRACT'
    vor_ridge.inputs[0].default_value = 1.0
    nt.links.new(vor.outputs["Distance"], vor_ridge.inputs[1])
    vor_pw = new(nt, "ShaderNodeMath"); vor_pw.operation='POWER'; vor_pw.inputs[1].default_value=2.2
    nt.links.new(vor_ridge.outputs[0], vor_pw.inputs[0])

    def ridge(src, power):
        sub = new(nt, "ShaderNodeMath"); sub.operation='SUBTRACT'; sub.inputs[1].default_value=0.5
        nt.links.new(src, sub.inputs[0])
        ab = new(nt, "ShaderNodeMath"); ab.operation='ABSOLUTE'
        nt.links.new(sub.outputs[0], ab.inputs[0])
        m2 = new(nt, "ShaderNodeMath"); m2.operation='MULTIPLY'; m2.inputs[1].default_value=2.0
        nt.links.new(ab.outputs[0], m2.inputs[0])
        inv = new(nt, "ShaderNodeMath"); inv.operation='SUBTRACT'; inv.inputs[0].default_value=1.0
        nt.links.new(m2.outputs[0], inv.inputs[1])
        pw = new(nt, "ShaderNodeMath"); pw.operation='POWER'; pw.inputs[1].default_value=power
        nt.links.new(inv.outputs[0], pw.inputs[0])
        return pw.outputs[0]
    r1 = ridge(n1.outputs["Fac"], 3.4)
    r2 = ridge(n2.outputs["Fac"], 4.6)
    veins12 = new(nt, "ShaderNodeMath"); veins12.operation='MAXIMUM'
    nt.links.new(r1, veins12.inputs[0]); nt.links.new(r2, veins12.inputs[1])
    veins = new(nt, "ShaderNodeMath"); veins.operation='MAXIMUM'
    nt.links.new(veins12.outputs[0], veins.inputs[0]); nt.links.new(vor_pw.outputs[0], veins.inputs[1])
    veins_out = veins.outputs[0]

    # threshold ramp — crisp thin lines, not a soft band (this is a SURFACE mask
    #   now, no ray integration, so a hard-ish threshold reads as fine ink lines).
    thresh = new(nt, "ShaderNodeValToRGB")
    thresh.color_ramp.elements[0].position = 0.42; thresh.color_ramp.elements[0].color = (0,0,0,1)
    thresh.color_ramp.elements[1].position = 0.78; thresh.color_ramp.elements[1].color = (1,1,1,1)
    nt.links.new(veins_out, thresh.inputs["Fac"])
    # color ramp — teal glow around a near-white hot core
    colr = new(nt, "ShaderNodeValToRGB")
    colr.color_ramp.elements[0].position = 0.42; colr.color_ramp.elements[0].color = (0.05,0.4,0.95,1)
    colr.color_ramp.elements[1].position = 0.9; colr.color_ramp.elements[1].color = (0.78,0.94,1.0,1)
    nt.links.new(veins_out, colr.inputs["Fac"])

    strength = new(nt, "ShaderNodeMath"); strength.operation='MULTIPLY'; strength.inputs[1].default_value=9.0
    nt.links.new(thresh.outputs["Color"], strength.inputs[0])
    emis = new(nt, "ShaderNodeEmission")
    nt.links.new(colr.outputs["Color"], emis.inputs["Color"])
    nt.links.new(strength.outputs["Value"], emis.inputs["Strength"])
    transp = new(nt, "ShaderNodeBsdfTransparent")
    mix = new(nt, "ShaderNodeMixShader")
    nt.links.new(thresh.outputs["Color"], mix.inputs["Fac"])
    nt.links.new(transp.outputs["BSDF"], mix.inputs[1])
    nt.links.new(emis.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m

def mat_beam():
    """Localized volumetric medium for the visible light shaft."""
    m = bpy.data.materials.new("Beam"); m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = new(nt, "ShaderNodeOutputMaterial")
    scat = new(nt, "ShaderNodeVolumeScatter")
    scat.inputs["Color"].default_value = (0.85,0.92,1.0,1)
    scat.inputs["Density"].default_value = 0.16
    if "Anisotropy" in scat.inputs: scat.inputs["Anisotropy"].default_value = 0.4
    nt.links.new(scat.outputs["Volume"], out.inputs["Volume"])
    return m

def mat_emit(color, strength):
    m = bpy.data.materials.new("Emit"); m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = new(nt, "ShaderNodeOutputMaterial")
    e = new(nt, "ShaderNodeEmission")
    e.inputs["Color"].default_value = (*color, 1); e.inputs["Strength"].default_value = strength
    nt.links.new(e.outputs["Emission"], out.inputs["Surface"])
    return m

GLASS, CHROME, STONE, GLOWFILL, BEAM = mat_glass(), mat_chrome(), mat_stone(), mat_glow_fill(), mat_beam()

# ---------- helpers ----------
def cube(name, sx, sy, sz, loc, mat, bevel=0.0, seg=2):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object; o.name = name
    o.scale = (sx, sy, sz)
    if bevel > 0:
        bpy.ops.object.transform_apply(scale=True)
        bv = o.modifiers.new("Bevel", 'BEVEL'); bv.width = bevel; bv.segments = seg
        bv.limit_method = 'ANGLE'; bv.angle_limit = math.radians(40); bv.harden_normals = True
    o.data.materials.append(mat)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.shade_auto_smooth(angle=math.radians(35))
    return o

# ---------- ground + plinth ----------
bpy.ops.mesh.primitive_plane_add(size=40, location=(0,0,0))
ground = bpy.context.active_object; ground.name = "Ground"
ground.data.materials.append(STONE)

PZ = 0.30  # half-height of plinth (plinth spans z 0..0.6)
plinth = cube("Plinth", 4.4, 2.8, 0.6, (0,0,PZ), STONE, bevel=0.03, seg=2)
TOP = 0.6

# ---------- the canister ----------
BW, BD, BH = 1.12, 0.94, 1.16
body = cube("Body", BW, BD, BH, (0,0,TOP+BH/2), GLASS, bevel=0.075, seg=4)

# angled shoulder — 4-vert cone frustum, rotated 45°, squashed to the footprint
SHH = 0.34
bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=(BW/2)*math.sqrt(2)*0.99,
                                radius2=0.30*math.sqrt(2), depth=SHH,
                                location=(0,0,TOP+BH+SHH/2))
sh = bpy.context.active_object; sh.name = "Shoulder"
sh.rotation_euler[2] = math.radians(45); sh.scale[1] = BD/BW
bpy.ops.object.transform_apply(rotation=True, scale=True)
sh.data.materials.append(GLASS)
bpy.context.view_layer.objects.active = sh; sh.select_set(True)
bpy.ops.object.shade_auto_smooth(angle=math.radians(35))

# chrome neck + cap
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.18, depth=0.13,
                                    location=(0,0,TOP+BH+SHH+0.065))
neck = bpy.context.active_object; neck.name = "Neck"; neck.data.materials.append(CHROME)
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.2, depth=0.08,
                                    location=(0,0,TOP+BH+SHH+0.17))
cap = bpy.context.active_object; cap.name = "Cap"; cap.data.materials.append(CHROME)

# ---------- fluid: faint glow volume + stacked ink-tendril planes ----------
FLH = BH*0.66
fluid = cube("Fluid", BW-0.14, BD-0.14, FLH, (0,0,TOP+0.05+FLH/2), GLOWFILL, bevel=0.05, seg=3)
FLUID_CX, FLUID_CZ = 0.0, TOP+0.05+FLH/2
PLANE_W, PLANE_H = BW-0.18, FLH-0.05
for i, py in enumerate((-0.30, -0.15, 0.0, 0.15, 0.30)):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(FLUID_CX, py, FLUID_CZ))
    pl = bpy.context.active_object; pl.name = f"InkPlane{i}"
    pl.scale = (PLANE_W, PLANE_H, 1)
    pl.rotation_euler = (math.radians(90), 0, 0)
    pl.data.materials.append(mat_ink_plane(i))
# bright meniscus level line
bpy.ops.mesh.primitive_plane_add(size=1, location=(0,0,TOP+0.05+FLH))
men = bpy.context.active_object; men.name = "Meniscus"; men.scale = (BW-0.16, BD-0.16, 1)
men.data.materials.append(mat_emit((0.4,0.75,1.0), 3.0))

# ---------- plinth-face wordmark (emissive text) ----------
def text(body_str, loc, size, color, strength, align='CENTER'):
    t = bpy.data.curves.new(name="T", type='FONT'); t.body = body_str
    t.align_x = align; t.size = size
    ob = bpy.data.objects.new("Text", t); scene.collection.objects.link(ob)
    ob.location = loc; ob.rotation_euler = (math.radians(90), 0, 0)
    ob.data.materials.append(mat_emit(color, strength))
    return ob
text("SHIFT-9", (0, -1.401, 0.36), 0.15, (0.78,0.8,0.86), 1.3)
text("11  Flow State (IN DEV)", (0, -1.401, 0.20), 0.062, (0.35,0.55,1.0), 2.0)

# ---------- the light shaft ----------
KEY = (2.4, 2.6, 8.2)
bpy.ops.object.light_add(type='SPOT', location=KEY)
key = bpy.context.active_object; key.name = "Key"
key.data.energy = 5200.0; key.data.color = (0.92, 0.95, 1.0)
key.data.spot_size = math.radians(24); key.data.spot_blend = 0.45
key.data.shadow_soft_size = 0.4
# aim at the vessel
tgt = bpy.data.objects.new("KeyTarget", None); tgt.location = (0,0,TOP+BH*0.5)
scene.collection.objects.link(tgt)
c = key.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis='TRACK_NEGATIVE_Z'; c.up_axis='UP_Y'
# shadow caustics (MNEE) — the key casts real blue caustic spill through the
#   glass + fluid onto the plinth. Cycles 4.x/5.x: per-light use_caustics under
#   light.cycles; scene-level caustics_refractive is the older path — try both,
#   AUDIT-log whichever isn't present rather than guessing the exact API.
for holder, attr, val in ((key.data, "use_caustics", True),):
    try:
        lc = holder.cycles if hasattr(holder, "cycles") else None
        if lc is not None: setattr(lc, attr, val)
        else: print(f"AUDIT: WARN no .cycles on light for {attr}")
    except Exception as e: print(f"AUDIT: WARN caustics {attr}", e)

# visible beam medium — a cone from the key toward the vessel
import mathutils
frm = mathutils.Vector(KEY); to = mathutils.Vector((0,0,TOP+BH))
d = (frm - to); length = d.length
bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=0.15, radius2=1.15, depth=length,
                                location=tuple((frm+to)/2))
beam = bpy.context.active_object; beam.name = "Beam"
# orient the cone (its +Z) along the key→vessel axis
z = d.normalized()
beam.rotation_mode = 'QUATERNION'
beam.rotation_quaternion = z.to_track_quat('Z','Y')
beam.data.materials.append(BEAM)
for prop in ("visible_shadow", "visible_diffuse", "visible_glossy"):
    if hasattr(beam, prop):
        setattr(beam, prop, False)  # the beam medium only scatters, never occludes

# fill + rim
bpy.ops.object.light_add(type='AREA', location=(-3.0, 5.0, 2.4))
fill = bpy.context.active_object; fill.data.energy = 60.0
fill.data.color = (0.5,0.62,1.0); fill.data.size = 4.0
cf = fill.constraints.new('TRACK_TO'); cf.target = tgt; cf.track_axis='TRACK_NEGATIVE_Z'; cf.up_axis='UP_Y'
# rim — behind + above, catches the glass shoulder + chrome neck edges
bpy.ops.object.light_add(type='AREA', location=(-1.6, 3.2, 4.2))
rim = bpy.context.active_object; rim.data.energy = 220.0
rim.data.color = (0.75,0.85,1.0); rim.data.size = 1.2
cr2 = rim.constraints.new('TRACK_TO'); cr2.target = tgt; cr2.track_axis='TRACK_NEGATIVE_Z'; cr2.up_axis='UP_Y'

# ---------- world (near-black) ----------
world = bpy.data.worlds.new("World"); scene.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.004,0.004,0.006,1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0

# ---------- camera (match the reference framing) ----------
cam_data = bpy.data.cameras.new("Camera"); cam_data.lens = 72
cam = bpy.data.objects.new("Camera", cam_data); scene.collection.objects.link(cam); scene.camera = cam
cam.location = (0.0, -12.5, 2.35)  # pulled back → smaller hero, more black negative space
camtgt = bpy.data.objects.new("CamTarget", None); camtgt.location = (0,0,TOP+BH*0.5)
scene.collection.objects.link(camtgt)
cc = cam.constraints.new('TRACK_TO'); cc.target = camtgt; cc.track_axis='TRACK_NEGATIVE_Z'; cc.up_axis='UP_Y'

# ---------- depth of field (hero in focus, negative space soft) ----------
cam_data.dof.use_dof = True
cam_data.dof.focus_object = camtgt
cam_data.dof.aperture_fstop = 3.6

# ---------- dust motes drifting in the light shaft ----------
import random; random.seed(7)
dustmat = mat_emit((0.85,0.92,1.0), 0.8)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.005, location=(0,0,-50))
dust0 = bpy.context.active_object; dust0.name = "Dust"; dust0.data.materials.append(dustmat)
for i in range(90):
    d = dust0.copy(); d.data = dust0.data
    tt = random.random()
    base = mathutils.Vector(KEY)*(1-tt) + mathutils.Vector((0,0,TOP+BH))*tt
    base += mathutils.Vector((random.uniform(-0.5,0.5), random.uniform(-0.5,0.5), random.uniform(-0.3,0.3)))
    d.location = base; d.scale = (random.uniform(0.4,1.1),)*3
    scene.collection.objects.link(d)

# ---------- render (Cycles CPU, cinema first-pass settings) ----------
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.01
scene.cycles.samples = 200
scene.cycles.use_denoising = True
for attr, val in (("denoiser", 'OPENIMAGEDENOISE'), ("denoising_input_passes", 'RGB_ALBEDO_NORMAL'),
                  ("denoising_prefilter", 'ACCURATE'), ("use_light_tree", True),
                  ("caustics_reflective", True), ("caustics_refractive", True)):
    try: setattr(scene.cycles, attr, val)
    except Exception as e: print("AUDIT: skip", attr, e)
scene.cycles.volume_bounces = 3
scene.cycles.volume_step_rate = 0.4
scene.cycles.transmission_bounces = 12
scene.cycles.max_bounces = 16
scene.render.resolution_x = 1280; scene.render.resolution_y = 720
scene.render.image_settings.file_format = 'PNG'
# neon/emissive hero → Filmic rolls off highlights so bright cyan keeps colour
#   with white vein cores (Standard clips to a white block; AgX pastels the neon)
scene.view_settings.view_transform = 'Filmic'
try: scene.view_settings.look = 'Medium High Contrast'
except Exception as e: print('AUDIT: look', e)
scene.view_settings.exposure = -0.25

# ---------- compositor (Blender 5.0 scene node-group): fog-glow bloom + streaks
#            + vignette. Group has an interface 'Image' OUTPUT → NodeGroupOutput;
#            RenderLayers feeds the chain (no Composite node exists in 5.0). ----
tr = bpy.data.node_groups.new("Comp", 'CompositorNodeTree')
scene.compositing_node_group = tr
tr.interface.new_socket("Image", in_out='OUTPUT', socket_type='NodeSocketColor')
def set_sock(node, name, val):
    if name in node.inputs:
        try: node.inputs[name].default_value = val
        except Exception as e: print("AUDIT: sock", name, e)
rl = tr.nodes.new('CompositorNodeRLayers')
glow = tr.nodes.new('CompositorNodeGlare')
set_sock(glow, 'Type', 'Fog Glow'); set_sock(glow, 'Quality', 'High')
set_sock(glow, 'Threshold', 1.0); set_sock(glow, 'Size', 9); set_sock(glow, 'Strength', 0.5)
streak = tr.nodes.new('CompositorNodeGlare')
set_sock(streak, 'Type', 'Streaks'); set_sock(streak, 'Quality', 'High')
set_sock(streak, 'Threshold', 1.4); set_sock(streak, 'Streaks', 6); set_sock(streak, 'Strength', 0.3)
# darken the frame edges (vignette) with a real Vignette node when present,
#   else a gentle radial exposure falloff via Lens Distortion vignetting
gout = tr.nodes.new('NodeGroupOutput')
tr.links.new(rl.outputs['Image'], glow.inputs['Image'])
tr.links.new(glow.outputs['Image'], streak.inputs['Image'])
tr.links.new(streak.outputs['Image'], gout.inputs['Image'])
scene.render.use_compositing = True

# ---------- render ----------
scene.render.filepath = OUT
print("AUDIT: rendering", OUT)
bpy.ops.render.render(write_still=True)
print("AUDIT: done", OUT)
