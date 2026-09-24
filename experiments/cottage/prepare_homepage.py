"""Segment the accepted baked study without changing its atlas or silhouette.
Run after build_cottage.py: blender --background --python experiments/cottage/prepare_homepage.py
Uses exact source face positions to recover logical parts from the baked mesh.
"""
import bpy, bmesh, json, math
from pathlib import Path
from mathutils import Vector, Matrix
from mathutils.kdtree import KDTree
ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT/'output/cottage-experiment'
OUT = ROOT/'output/cottage-homepage'
OUT.mkdir(parents=True, exist_ok=True)

def key(obj, poly):
    center = sum((obj.matrix_world @ obj.data.vertices[i].co for i in poly.vertices), Vector()) / len(poly.vertices)
    return tuple(round(v, 5) for v in center)

def classify(obj):
    n=obj.name
    center=sum((obj.matrix_world @ v.co for v in obj.data.vertices),Vector())/len(obj.data.vertices)
    x,minus_z,y=center; z=-minus_z
    if n.startswith(('Raised floor','Door dark reveal','Deep window recess')): return 'omit'
    if n.startswith('Foundation dressed stone'):
        return 'omit' if -.3 < x < 1.7 else 'base'
    if n.startswith('Wall lower oak rail'): return 'omit' if z > 0 else 'back'
    if n.startswith('Porch'): return 'base'
    if n.startswith(('Gable','Thick roof','Eave drip','Visible rafter','Oak eave','Roof backing','Hand shaped','Fascia dowel','Curved ridge','Chimney','Long eave')): return 'roof'
    if n.startswith('Back plaster'): return 'back'
    if n.startswith(('Continuous side','Corner structural','Side wall foot')): return 'right' if x > 0 else 'left'
    if n.startswith('Continuous front'): return 'front'
    if n.startswith(('Door individual','Door panel','Door upper','Door glass','Door handle','Brass door','Door iron')): return 'door'
    if n.startswith(('Door frame','Door carved','Studio sign','YESHU','Lantern')): return 'front'
    # Window frames, shutters, panes, curtains, and flower boxes are authored on each facade.
    center=sum((obj.matrix_world @ v.co for v in obj.data.vertices),Vector())/len(obj.data.vertices)
    if center.x > 4.4: return 'right'
    if center.x < -4.4: return 'left'
    return 'front'

bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'cottage-source.blend'))
source_faces={}
for obj in bpy.context.scene.objects:
    if obj.type!='MESH':continue
    part=classify(obj)
    for poly in obj.data.polygons:
        k=key(obj,poly)
        if k in source_faces and source_faces[k]!=part:raise RuntimeError(f'Ambiguous face: {obj.name}')
        source_faces[k]=part
face_keys=list(source_faces)
tree=KDTree(len(face_keys))
for i,k in enumerate(face_keys):tree.insert(k,i)
tree.balance()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'cottage-baked.blend'))
counts={}; unmatched=[]
for obj in list(bpy.context.scene.objects):
    if obj.type!='MESH':continue
    groups={}
    for poly in obj.data.polygons:
        part=source_faces.get(key(obj,poly))
        if part is None:
            _,i,distance=tree.find(key(obj,poly))
            if distance < .0001:part=source_faces[face_keys[i]]
            else:unmatched.append((obj.name,poly.index,distance));continue
        groups.setdefault(part,set()).add(poly.index)
    if unmatched:raise RuntimeError(f'Unmatched baked faces: {unmatched[:5]}')
    for part,faces in groups.items():
        if part=='omit':continue
        mesh=obj.data.copy(); bm=bmesh.new();bm.from_mesh(mesh);bm.faces.ensure_lookup_table()
        bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.index not in faces],context='FACES')
        bm.to_mesh(mesh);bm.free();mesh.update()
        new=bpy.data.objects.new(f'{part}__{obj.name}',mesh);bpy.context.scene.collection.objects.link(new);new.matrix_world=obj.matrix_world.copy()
        if part=='door':
            pivot=Vector((1.375,-3.80,0)); hinge=Vector((1.375,-3.66,0))
            new.matrix_world=Matrix.Translation(hinge) @ Matrix.Rotation(-math.pi/2,4,'Z') @ Matrix.Translation(-pivot) @ new.matrix_world
        new['cottagePart']='front' if part=='door' else part
        counts[part]=counts.get(part,0)+len(mesh.polygons)
    bpy.data.objects.remove(obj,do_unlink=True)
# The existing room owns the floor and furnishings. The porch stays outside the cutaway.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'cottage-homepage.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'cottage-homepage-raw.glb'),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_animations=False,export_cameras=False,export_lights=False)
(OUT/'segmentation-report.json').write_text(json.dumps({'faces_by_part':counts,'unmatched_faces':len(unmatched),'source':'../cottage-experiment/cottage-baked.blend'},indent=2))
print('SEGMENTED',counts,flush=True)
