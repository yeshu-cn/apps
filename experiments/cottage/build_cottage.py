"""Author an editable stylized seaside cottage; bake and export a web asset.
Run: blender --background --python experiments/cottage/build_cottage.py
World design uses Three.js coordinates (x, up, front); export is glTF Y-up.
"""
import bpy, bmesh, math, random, json
from pathlib import Path
from mathutils import Vector
random.seed(24)
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/cottage-experiment'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'; scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.unit_settings.system = 'METRIC'

def rgb(h):
    h=h.lstrip('#'); c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(v/12.92 if v<.04045 else ((v+.055)/1.055)**2.4 for v in c)+(1,)

def material(name, color, rough=.75, grain=False):
    m=bpy.data.materials.new(name); m.diffuse_color=rgb(color);m.use_nodes=True
    nodes=m.node_tree.nodes; links=m.node_tree.links; bs=nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=rgb(color);bs.inputs['Roughness'].default_value=rough
    if grain:
        tex=nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=3.5;tex.inputs['Detail'].default_value=2
        coord=nodes.new('ShaderNodeTexCoord'); mapping=nodes.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(2,22,3)
        links.new(coord.outputs['Generated'],mapping.inputs[0]);links.new(mapping.outputs[0],tex.inputs['Vector'])
        ramp=nodes.new('ShaderNodeValToRGB'); base=rgb(color)
        ramp.color_ramp.elements[0].position=.15;ramp.color_ramp.elements[0].color=tuple(v*.65 for v in base[:3])+(1,)
        ramp.color_ramp.elements[1].position=.85;ramp.color_ramp.elements[1].color=tuple(min(v*1.13,1) for v in base[:3])+(1,)
        links.new(tex.outputs['Fac'],ramp.inputs[0]);links.new(ramp.outputs[0],bs.inputs['Base Color'])
    return m
wood=material('Honey oak - fine grain','#b8793d',.72,True)
lightwood=material('Cut timber edges','#d4a162',.8,True)
darkwood=material('Dark oak endgrain','#705037',.85,True)
plaster=material('Warm lime plaster','#eee2c4',.96,True)
stone=material('Sandstone foundation','#ada792',.98,True)
metal=material('Oxidized bronze hardware','#605e4b',.43)
brass=material('Aged brass','#bd9a50',.45)
glass=material('Sea glass','#81b8bd',.24)
shadow=material('Window recess','#314d53',.92)
linen=material('Linen behind glass','#e8d6ad',.96)
shutter=material('Painted teal shutters','#5c8b7b',.8,True)
terracotta=material('Terracotta','#b67557',.9)
leafmats=[material('Leaf '+str(i),c,.85) for i,c in enumerate(['#3d7450','#668744','#93a65c'])]
flower=material('Warm ivory flowers','#f2db9e',.86)
roofmats=[material('Glazed cedar teal '+str(i),c,.66,True) for i,c in enumerate(['#3f7775','#4b8580','#558b83','#477e7a','#65968b','#3e7472'])]
objects=[]
def finish(o,name,mat,bevel=0):
    o.name=name;o.data.materials.append(mat);objects.append(o)
    if bevel:
        mod=o.modifiers.new('Crafted edge bevel','BEVEL');mod.width=bevel;mod.segments=1
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    return o

def box(name,p,size,mat=wood,bevel=.025):
    x,y,z=p;w,h,d=size
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y));o=bpy.context.object;o.scale=(w,d,h)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,mat,min(bevel,min(size)*.23))

def webmesh(name,verts,faces,mat,bevel=0):
    me=bpy.data.meshes.new(name);me.from_pydata([(x,-z,y) for x,y,z in verts],[],faces);me.update()
    bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free()
    o=bpy.data.objects.new(name,me);scene.collection.objects.link(o);return finish(o,name,mat,bevel)

def beam(name,a,b,width=.15,depth=None,mat=wood):
    a=Vector((a[0],-a[2],a[1]));b=Vector((b[0],-b[2],b[1]));delta=b-a
    bpy.ops.mesh.primitive_cube_add(size=1,location=(a+b)/2);o=bpy.context.object;o.scale=(width,depth or width,delta.length)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.rotation_euler=delta.to_track_quat('Z','Y').to_euler();return finish(o,name,mat,.025)

def sphere(name,p,scale,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=6,radius=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.scale=(scale[0],scale[2],scale[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    for f in o.data.polygons:f.use_smooth=True
    return finish(o,name,mat)

# The same 10 by 6.1 metre shell as the existing cottage. Front has real openings.
for row in range(2):
    for j in range(17):
        x=-4.75+j*.595+(row%2)*.11
        box('Foundation dressed stone',(x,-.07+row*.19,3.77),(.575,.175,.32),stone,.025)
box('Raised floor',(0,-.12,.70),(10,.24,6.1),darkwood)
for z in [-2.27,3.74]:
    if z<0:box('Back plaster wall',(0,2.13,z),(10,4.26,.22),plaster)
def plaster_wall(name,width,height,center_z,holes,side=0):
    xs=sorted(set([-width/2,width/2]+[x for hole in holes for x in hole[:2]]))
    ys=sorted(set([0,height]+[y for hole in holes for y in hole[2:]]))
    cells=set()
    for i in range(len(xs)-1):
        for j in range(len(ys)-1):
            mx=(xs[i]+xs[i+1])/2;my=(ys[j]+ys[j+1])/2
            if not any(a<mx<b and c<=my<d for a,b,c,d in holes):cells.add((i,j))
    vertices=[];faces=[];lookup={}
    def idx(i,j,k):
        key=(i,j,k)
        if key not in lookup:
            u,y,d=xs[i],ys[j],(-.13 if k==0 else .13)
            v=(side*(4.91+d),y,.7-side*u) if side else (u,y,center_z+d)
            lookup[key]=len(vertices);vertices.append(v)
        return lookup[key]
    for i,j in cells:
        for k in [0,1]:faces.append(tuple(idx(ii,jj,k) for ii,jj in [(i,j),(i+1,j),(i+1,j+1),(i,j+1)]))
        for neighbor,edge in [((i-1,j),[(i,j),(i,j+1)]),((i+1,j),[(i+1,j),(i+1,j+1)]),((i,j-1),[(i,j),(i+1,j)]),((i,j+1),[(i,j+1),(i+1,j+1)])]:
            if neighbor not in cells:
                (a,b),(c,d)=edge;faces.append((idx(a,b,0),idx(c,d,0),idx(c,d,1),idx(a,b,1)))
    return webmesh(name,vertices,faces,plaster,.018)
plaster_wall('Continuous front plaster',10,4.26,3.74,[(-3.4,-1.02,1.17,3.04),(.025,1.375,0,2.75),(2.02,3.56,1.3,2.95)])
for side in [-1,1]:
    x=side*4.91
    plaster_wall('Continuous side plaster',6.1,4.26,0,[(-1.15,1.15,1.22,3.29)],side)
    webmesh('Gable plaster',[(x-.12,4.24,-2.35),(x-.12,4.24,3.75),(x-.12,6.12,.7),(x+.12,4.24,-2.35),(x+.12,4.24,3.75),(x+.12,6.12,.7)],[(0,2,1),(3,4,5),(0,1,4,3),(1,2,5,4),(2,0,3,5)],plaster,.018)
    for z in [-2.31,3.78]:box('Corner structural oak post',(x,2.14,z),(.23,4.28,.27),wood,.05)
    box('Side wall foot beam',(x,.21,.7),(.30,.23,6.25),wood)
    for z in [-2.32,3.74]:beam('Gable barge timber',(x*1.014,4.23,z),(x*1.014,6.20,.7),.21,mat=wood)
    beam('Gable king post',(x*1.015,4.25,.7),(x*1.015,6.10,.7),.17,mat=lightwood)
    for sign in [-1,1]:beam('Gable diagonal brace',(x*1.016,4.3,.7),(x*1.016,5.12,.7+sign*1.7),.115,mat=wood)
for z in [-2.29,3.81]:
    box('Long eave beam',(0,4.17,z),(10.35,.29,.32),wood,.05)
    box('Wall lower oak rail',(0,.24,z),(10.0,.17,.15),lightwood)

# Layered shingles: individually shaped, overlapping, rounded tips, mild variation.
span=3.77;rise=2.05;ridge=6.33
for side in [-1,1]:
    for x in [-5.28,5.28]:beam('Thick roof fascia',(x,ridge,.7),(x,ridge-rise,.7+side*span),.24,.24,lightwood)
    beam('Eave drip edge',(-5.38,ridge-rise,.7+side*span),(5.38,ridge-rise,.7+side*span),.20,.23,wood)
    for i in range(19):
        x=-5.05+i*.56
        beam('Visible rafter',(x,6.14,.7),(x,4.20,.7+side*3.9),.115,.17,wood)
        if i%3==0:beam('Oak eave corbel',(x,3.84,.7+side*3.04),(x,4.18,.7+side*3.57),.10,.12,lightwood)
    # Under-roof dark skin provides dark seams without holes into the room.
    verts=[(-5.36,ridge-.11,.7),(5.36,ridge-.11,.7),(5.36,ridge-rise-.11,.7+side*span),(-5.36,ridge-rise-.11,.7+side*span)]
    webmesh('Roof backing',verts,[(0,1,2,3)],darkwood)
    for row in range(10):
        start=row*.368
        for col in range(22):
            x=-5.27+col*.49+(row%2)*.10
            if x>5.30:continue
            width=.476+random.uniform(-.015,.008);length=.61+random.uniform(-.015,.025)
            outline=[(-width/2,0),(width/2,0),(width/2,length-.085),(width*.34,length),(0,length+.025),(-width*.34,length),(-width/2,length-.085)]
            vs=[]
            for thick in [0,.063]:
                for u,t in outline:
                    distance=start+t
                    vs.append((x+u,ridge-distance*rise/span+.065*(t/length)**2+thick,.7+side*distance))
            n=len(outline);faces=[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n)]
            webmesh('Hand shaped roof shingle',vs,faces,random.choice(roofmats),.012)
    # Small dowels on the visible fascia.
    for x in [-4.7,-2.4,0,2.4,4.7]:sphere('Fascia dowel',(x,4.28,.7+side*3.83),(.037,.037,.022),darkwood)
for i in range(22):
    x=-5.25+i*.49
    # A shallow curved ridge cap with a visible joint at each segment.
    verts=[]
    for xx in [x-.25,x+.25]:
        for j in range(7):
            a=j/6*math.pi;verts.append((xx,6.38+math.sin(a)*.15,.7+math.cos(a)*.22))
    webmesh('Curved ridge cap',verts,[(j,j+1,j+8,j+7) for j in range(6)],roofmats[2])

# Window assemblies share a local plane; side facades rotate the entire assembly.
def window(cx,cy,cz,w,h,side=0):
    def pos(u,y,d):
        if side:return (cx+side*d,cy+y,cz-side*u)
        return (cx+u,cy+y,cz+d)
    def part(name,u,y,d,width,height,depth,mat=wood,bev=.02):
        size=(depth,height,width) if side else (width,height,depth)
        return box(name,pos(u,y,d),size,mat,bev)
    part('Deep window recess',0,h/2,-.04,w+.06,h+.06,.08,shadow)
    # Recessed panes, linen inset, and a narrow reflective strip.
    for col in [-1,1]:
        for row in range(2):
            u=col*w*.24;y=h*(.25+row*.50)
            part('Window glass pane',u,y,.005,w*.43,h*.44,.04,glass,.007)
            part('Linen curtain edge',u+col*w*.13,y,.034,w*.085,h*.43,.018,linen,.006)
    for u in [-w/2,0,w/2]:part('Bevelled window mullion',u,h/2,.13,.10,h+.13,.22,lightwood)
    for y in [0,h/2,h]:part('Window transom',0,y,.13,w+.18,.105,.22,lightwood)
    for u in [-w/2-.09,w/2+.09]:part('Outer window architrave',u,h/2,.14,.115,h+.35,.25,wood)
    part('Window header molding',0,h+.12,.17,w+.47,.17,.30,lightwood,.035)
    part('Thick sill with overhang',0,-.08,.22,w+.5,.18,.55,lightwood,.035)
    part('Window lower apron',0,-.23,.14,w+.13,.13,.20,wood)
    for sign in [-1,1]:
        sx=sign*(w/2+.43)
        part('Shutter backing',sx,h/2,.10,.46,h,.075,shutter)
        for y in [.12,h-.12]:part('Shutter crossrail',sx,y,.17,.43,.10,.07,wood,.015)
        for j in range(8):part('Layered shutter louvre',sx,.24+j*(h-.40)/8,.19,.39,.085,.10,shutter,.012)
        for y in [.20,h-.20]:part('Black shutter hinge',sx-sign*.13,y,.255,.17,.046,.025,metal,.005)
    # Bracketed timber flower box under the front windows only.
    if not side:
        for u in [-w*.30,w*.30]:part('Flower box bracket',u,-.57,.28,.10,.50,.44,wood)
        part('Flower box dark soil',0,-.46,.52,w+.11,.14,.40,darkwood)
        for y in [-.61,-.43]:part('Flower box slatted front',0,y,.77,w+.25,.15,.075,wood)
        for u in [-w/2-.1,w/2+.1]:part('Flower box end cap',u,-.50,.54,.09,.38,.53,lightwood)
        for i in range(6):
            p=pos(-w*.4+i*w*.16,-.32,.56)
            for k in range(3):
                a=k*2.1+i;tip=(p[0]+math.cos(a)*.16,p[1]+.22+(i%2)*.06,p[2]+math.sin(a)*.13)
                beam('Plant stem',p,tip,.025,mat=leafmats[i%3]);sphere('Leaf or blossom',tip,(.11,.09,.09),flower if k==0 else leafmats[i%3])
window(-2.21,1.17,3.78,2.38,1.87)
window(2.79,1.30,3.78,1.54,1.65)
window(4.96,1.22,.7,2.30,2.07,1)
window(-4.96,1.22,.7,2.30,2.07,-1)

# Doorway has a deep reveal, inset panels, hardware, and a modest entrance canopy.
for x in [-.055,1.455]:box('Door frame oak jamb',(x,1.40,3.92),(.17,2.92,.34),wood,.035)
box('Door carved lintel',(.70,2.83,3.95),(1.72,.20,.38),lightwood,.04)
box('Door dark reveal',(.70,1.34,3.72),(1.35,2.72,.12),shadow)
for j in range(6):box('Door individual planks',(.146+j*.22,1.34,3.80),(.208,2.65,.075),shutter,.014)
for y in [.19,1.30,2.52]:box('Door panel crossrail',(.70,y,3.855),(1.21,.115,.06),wood,.018)
box('Door upper glass',(.70,1.97,3.85),(.86,.84,.055),glass)
for x in [.24,.70,1.16]:box('Door glass upright',(x,1.98,3.90),(.05,.94,.055),lightwood,.01)
for y in [1.51,1.98,2.45]:box('Door glass transom',(.70,y,3.90),(.96,.05,.055),lightwood,.01)
box('Door handle backplate',(1.17,1.22,3.91),(.085,.23,.033),metal,.02)
sphere('Brass door handle',(1.17,1.23,3.965),(.065,.065,.05),brass)
for x in [.16,1.22]:
    for y in [.21,1.30,2.52]:sphere('Door iron nail',(x,y,3.90),(.021,.021,.018),metal)
# Deliberately restrained sign and pair of hanging porch lights.
box('Studio sign',(.70,3.33,3.96),(1.7,.39,.10),darkwood,.045)
bpy.ops.object.text_add(location=(.70,-4.024,3.235),rotation=(math.pi/2,0,0));text=bpy.context.object;text.name='YESHU carved sign';text.data.body='Y E S H U';text.data.align_x='CENTER';text.data.size=.21;text.data.extrude=.002;text.data.materials.append(linen)
bpy.ops.object.convert(target='MESH');objects.append(bpy.context.object)
for x in [-.35,1.75]:
    beam('Lantern bracket',(x,2.7,3.85),(x,2.7,4.13),.045,mat=metal)
    box('Lantern warm pane',(x,2.38,4.15),(.19,.29,.19),linen,.02)
    for y in [2.18,2.58]:box('Lantern cap',(x,y,4.15),(.29,.075,.29),metal,.03)
    for dx in [-.115,.115]:
        for dz in [-.115,.115]:beam('Lantern corner',(x+dx,2.20,4.15+dz),(x+dx,2.56,4.15+dz),.025,mat=metal)
# A small plank porch gives the entrance a finished connection to the ground.
for j in range(12):box('Porch floorboard',(-.83+j*.28,.055,4.42),(.263,.13,1.45),lightwood,.018)
for y,z,w in [(-.08,5.24,2.7),(-.19,5.59,3.0)]:box('Porch rounded step',(.70,y,z),(w,.14,.37),wood,.03)
for x in [-.93,2.33]:
    box('Porch end beam',(x,-.055,4.42),(.15,.25,1.60),wood,.025)
# Chimney: separate staggered stone courses and a dark cap.
box('Chimney body',(-2.55,6.0,.07),(.63,1.25,.57),stone)
for row in range(5):
    for col in range(2):box('Chimney front brick',(-2.72+col*.34+(row%2)*.025,5.52+row*.23,.38),(.32,.215,.105),lightwood if row%3==0 else stone,.018)
box('Chimney cap',(-2.55,6.69,.07),(.90,.18,.82),darkwood,.035)
box('Chimney lip',(-2.55,6.55,.07),(.73,.09,.65),stone)

# Keep the source fully editable; only the export mesh is joined and atlased.
scene.world.color=(.2,.2,.2)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'cottage-source.blend'))
print('SOURCE_SAVED',len(objects),flush=True)
bpy.ops.object.select_all(action='DESELECT')
detail_prefixes=('Leaf or blossom','Plant stem','YESHU','Lantern','Brass','Door iron nail','Black shutter hinge','Fascia dowel','Window glass pane','Door upper glass','Door handle backplate','Linen curtain edge')
details=[o for o in objects if o.name.startswith(detail_prefixes)]
for o in objects:o.select_set(o not in details)
bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();house=bpy.context.object;house.name='Cottage_Exterior_Study'
bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
# Align export origin to the existing island's world origin.
scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
# Smart atlas for all authored surfaces. Texel allocation follows face area.
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.001);bpy.ops.object.mode_set(mode='OBJECT')
house.data.uv_layers.active.name='BakedUV'
scene.render.bake.margin=3;scene.render.bake.use_clear=True
scene.render.bake.use_pass_direct=False;scene.render.bake.use_pass_indirect=False;scene.render.bake.use_pass_color=True
baked={}
for name,kind in [('basecolor','DIFFUSE'),('occlusion','AO'),('roughness','ROUGHNESS')]:
    image=bpy.data.images.new('Cottage_'+name,width=2048,height=2048,alpha=False)
    image.colorspace_settings.name='sRGB' if name=='basecolor' else 'Non-Color'
    for mat in house.data.materials:
        node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;mat.node_tree.nodes.active=node
    print('BAKING',name,flush=True);bpy.ops.object.bake(type=kind)
    image.filepath_raw=str(OUT/(name+'.png'));image.file_format='PNG';image.save();baked[name]=image
# Export the supported PBR channels. Keep AO separate so the sun stays dynamic.
mat=bpy.data.materials.new('Cottage_Baked_PBR');mat.use_nodes=True;nodes=mat.node_tree.nodes;links=mat.node_tree.links;bs=nodes.get('Principled BSDF')
for name,socket in [('basecolor','Base Color'),('roughness','Roughness')]:
    node=nodes.new('ShaderNodeTexImage');node.image=baked[name];links.new(node.outputs['Color'],bs.inputs[socket])
group=bpy.data.node_groups.new('glTF Material Output','ShaderNodeTree');group.interface.new_socket(name='Occlusion',in_out='INPUT',socket_type='NodeSocketFloat')
gn=nodes.new('ShaderNodeGroup');gn.node_tree=group;ao=nodes.new('ShaderNodeTexImage');ao.image=baked['occlusion'];links.new(ao.outputs['Color'],gn.inputs['Occlusion'])
house.data.materials.clear();house.data.materials.append(mat)
for poly in house.data.polygons:poly.material_index=0

# Join native small details by material, preserving clean colors without subpixel UV islands.
detail_groups={}
for o in details:detail_groups.setdefault(o.data.materials[0],[]).append(o)
for detail_mat,group_objects in detail_groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in group_objects:o.select_set(True)
    bpy.context.view_layer.objects.active=group_objects[0];bpy.ops.object.join()
    bpy.context.object.name='Detail_'+detail_mat.name
bpy.ops.object.select_all(action='SELECT')
scene.render.engine='CYCLES';bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'cottage-baked.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'cottage-raw.glb'),export_format='GLB',use_selection=True,export_yup=True,export_materials='EXPORT',export_animations=False,export_cameras=False,export_lights=False)
house.data.calc_loop_triangles()
metadata={'source_objects':len(objects),'triangles':len(house.data.loop_triangles),'vertices':len(house.data.vertices),'source':'cottage-source.blend','lighting':'Baked AO and material detail; dynamic sunlight. No directional shadow baked into basecolor.','scope':'Exterior visual study only; no collision proxy or indoor cutaway. Existing homepage unaffected.'}
(OUT/'asset-report.json').write_text(json.dumps(metadata,indent=2))
print('COMPLETE',json.dumps(metadata),flush=True)
