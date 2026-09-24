import * as T from 'three';
import { GLTFLoader } from './assets/vendor/three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from './assets/vendor/meshoptimizer/meshopt_decoder.mjs';
import { createExteriorCutaway } from './room-exterior.js?v=crafted-20260924';
import { CABIN, CABIN_DOOR, cabinThresholdSurface } from './room-layout.js?v=crafted-20260924';

// The accepted Blender asset is split by facade, retaining one shared baked atlas.
export async function buildCraftedExterior({ group, box, paleOak }) {
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
        .loadAsync(new URL('./assets/cottage/cottage.glb', import.meta.url).href);
    const exterior = group('complete-cabin-exterior');
    const base = group('crafted-cabin-base');
    const threshold = cabinThresholdSurface();
    const thresholdGeometry = new T.BufferGeometry();
    thresholdGeometry.setAttribute('position', new T.BufferAttribute(threshold.positions, 3));
    thresholdGeometry.setAttribute('uv', new T.Float32BufferAttribute([0,0, 1,0, 1,1, 0,1], 2));
    thresholdGeometry.setIndex(new T.BufferAttribute(threshold.indices, 1)); thresholdGeometry.computeVertexNormals();
    const sill = new T.Mesh(thresholdGeometry, paleOak); sill.name = 'sloped-timber-threshold'; sill.receiveShadow = true; base.add(sill);
    const walls = Object.fromEntries(['front', 'right', 'back', 'left'].map(id => {
        const wall = group(`${id}-facade`); wall.userData.wallId = id; return [id, wall];
    }));
    const windows = group('shared-cabin-windows');
    gltf.scene.updateMatrixWorld(true);
    // Quantized geometry may have transforms on parent nodes; attach preserves them.
    const parts = [];
    gltf.scene.traverse(object => { if (object.userData.cottagePart) parts.push(object); });
    if (!parts.length) throw new Error('Cottage asset has no facade metadata');
    for (const part of parts) {
        const id = part.userData.cottagePart;
        const target = id === 'roof' ? exterior : id === 'base' ? base : walls[id];
        if (!target) throw new Error(`Unknown cottage part: ${id}`);
        target.attach(part);
        part.traverse(object => {
            if (!object.isMesh) return;
            object.castShadow = object.receiveShadow = true;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const material of materials) {
                if (material.aoMap) material.aoMapIntensity = .5;
                if (material.name === 'Sea glass') {
                    material.transparent = true; material.opacity = .34;
                    material.depthWrite = false; material.side = T.DoubleSide;
                    material.emissive.set('#f3c27b'); material.emissiveIntensity = .12;
                    object.castShadow = false;
                }
            }
        });
    }
    const wallTrace = group('cutaway-wall-footprint');
    const traces = Object.fromEntries(Object.keys(walls).map(id => [id, group(`${id}-cut-edge`, wallTrace)]));
    const plaster = '#eee2c4';
    for (const [left, right] of [[-CABIN.width / 2, CABIN_DOOR.left], [CABIN_DOOR.right, CABIN.width / 2]]) {
        box(traces.front, 'front-wall-footprint', plaster, (left + right) / 2, .10, CABIN.frontZ, right - left, .20, .26);
    }
    box(traces.back, 'back-wall-footprint', plaster, 0, .10, CABIN.backZ, CABIN.width, .20, .22);
    for (const id of ['left', 'right']) box(traces[id], `${id}-wall-footprint`, plaster, (id === 'left' ? -1 : 1) * CABIN.sideX, .10, CABIN.centerZ, .26, .20, CABIN.depth);
    wallTrace.visible = false;
    return createExteriorCutaway({ exterior, walls, windows, wallTrace, traces });
}
