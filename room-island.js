import * as T from 'three';
import { ENTRY_POTS } from './room-layout.js?v=room-clear-20260923';
import { createSeaDetails } from './room-sea.js';
import { createFootballIsland } from './room-football-island.js?v=football-20260923';
import { ISLAND, DOCK, coastPoint, islandTerrain, PALMS, ROCKS } from './island-layout.js';

const v = (x, y, z) => new T.Vector3(x, y, z);

// A continuous shoreline wraps the studio; no rectangular ocean platform or copied island layout.
export async function createIsland() {
    const root = new T.Group(); root.name = 'studio-island';
    const loader = new T.TextureLoader();
    const [sandMap, waterMap, woodMap] = await Promise.all(['island-sand.webp', 'island-water.webp', 'room-oak.webp'].map(file => loader.loadAsync(`assets/${file}`)));
    for (const texture of [sandMap, waterMap, woodMap]) { texture.colorSpace = T.SRGBColorSpace; texture.wrapS = texture.wrapT = T.RepeatWrapping; texture.anisotropy = 4; }
    waterMap.repeat.set(54, 54);
    const material = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: .9, ...extra });
    const sand = material('#efe3c4', { map: sandMap });
    const wood = material('#ccb189', { map: woodMap });
    const foliage = ['#477c60', '#65916a', '#7da074'].map(color => material(color));
    const rockMats = ['#a9b3a3', '#c5c5ad', '#96a699'].map(color => material(color, { flatShading: true }));
    function mesh(name, geometry, mat, x = 0, y = 0, z = 0, parent = root) {
        const object = new T.Mesh(geometry, mat); object.name = name; object.position.set(x, y, z);
        object.castShadow = object.receiveShadow = true; parent.add(object); return object;
    }
    const box = (name, x, y, z, w, h, d, mat = wood, parent = root) => mesh(name, new T.BoxGeometry(w, h, d), mat, x, y, z, parent);
    function beam(name, start, end, radius, mat, parent = root) {
        const result = mesh(name, new T.CylinderGeometry(radius, radius, start.distanceTo(end), 8), mat, 0, 0, 0, parent);
        result.position.copy(start).add(end).multiplyScalar(.5); result.quaternion.setFromUnitVectors(v(0, 1, 0), end.clone().sub(start).normalize()); return result;
    }
    function shore(angle, scale = 1, y = -1.06) {
        const point = coastPoint(angle, scale); return v(point.x, y, point.z);
    }
    const { positions, uvs, indices } = islandTerrain();
    const terrain = new T.BufferGeometry(); terrain.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); terrain.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2)); terrain.setIndex(new T.BufferAttribute(indices, 1)); terrain.computeVertexNormals();
    mesh('soft-sand-island', terrain, sand);

    // A low, irregular meadow leaves a broad sandy margin and a clear front beach.
    const meadowPoints = [ISLAND.x, -.266, ISLAND.z], meadowUVs = [0, 0], meadowIndices = [];
    for (let i = 0; i <= 80; i++) {
        const a = i / 80 * Math.PI * 2, r = 1 + .055 * Math.sin(a * 5) + .032 * Math.cos(a * 9);
        const x = ISLAND.x + Math.cos(a) * 17.7 * r, z = ISLAND.z + Math.sin(a) * 11.4 * r;
        meadowPoints.push(x, -.266, z); meadowUVs.push(x / 6, z / 6);
        if (i < 80) meadowIndices.push(0, i + 2, i + 1);
    }
    const meadow = new T.BufferGeometry(); meadow.setAttribute('position', new T.Float32BufferAttribute(meadowPoints, 3)); meadow.setAttribute('uv', new T.Float32BufferAttribute(meadowUVs, 2)); meadow.setIndex(meadowIndices); meadow.computeVertexNormals();
    mesh('soft-island-meadow', meadow, material('#a8b782', { map: sandMap }));
    function gardenPath(name, points, width) {
        const curve = new T.CatmullRomCurve3(points.map(([x, z]) => v(x, -.252, z)));
        const vertices = [], uv = [], triangles = [];
        for (let i = 0; i <= 72; i++) {
            const t = i / 72, point = curve.getPoint(t), tangent = curve.getTangent(t);
            for (const side of [-1, 1]) { vertices.push(point.x + tangent.z * width / 2 * side, point.y, point.z - tangent.x * width / 2 * side); uv.push(t * 8, (side + 1) / 2); }
            if (i < 72) { const k = i * 2; triangles.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
        }
        const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geometry.setIndex(triangles); geometry.computeVertexNormals();
        mesh(name, geometry, material('#e5d6b2', { map: sandMap, side: T.DoubleSide }));
    }
    gardenPath('path-from-door-to-sea', [[.7, 4.45], [1.5, 6.2], [4.6, 8.3], [8.4, 9.2], [9.3, 12.4], [8.0, 15.8]], 1.03);
    gardenPath('western-garden-walk', [[.7, 5.2], [-3.2, 5.8], [-6.0, 7.4], [-6.9, 10.2], [-4.6, 11.3], [1.4, 10.3], [4.6, 8.3]], .82);
    gardenPath('long-island-trail', [[4.6, 8.3], [9.3, 6.7], [14.7, 7.2], [18.4, 5.8], [19.0, 1.1], [16.9, -3.5], [10.2, -5.7], [5.2, -6.2], [.7, -4.8], [-5.8, -4.1], [-7.0, 1.1], [-6.0, 7.4]], .78);

    const waterMaterial = material('#a6d2c8', { map: waterMap, roughness: .75, metalness: .02 });
    // Keep generated caustics visible but quiet enough to leave the room as the focal point.
    waterMaterial.onBeforeCompile = shader => {
        shader.uniforms.waterTint = { value: new T.Color('#599eab') };
        shader.fragmentShader = `uniform vec3 waterTint;\n${shader.fragmentShader}`.replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb = mix(waterTint, diffuseColor.rgb, 0.55);');
    };
    const water = mesh('quiet-open-sea', new T.PlaneGeometry(800, 800), waterMaterial, 0, -1.075, 0);
    water.rotation.x = -Math.PI / 2; water.castShadow = false;
    // The shallow seabed gives the coast a lighter turquoise margin under the real water surface.
    const shallow = mesh('shallow-lagoon', new T.CircleGeometry(1, 96), material('#a3d3c2', { transparent: true, opacity: .24, depthWrite: false }), ISLAND.x, -1.062, ISLAND.z);
    const shallowPos = shallow.geometry.attributes.position;
    for (let i = 1; i < shallowPos.count; i++) {
        const angle = Math.atan2(shallowPos.getY(i), shallowPos.getX(i)), point = shore(angle, 1.14, -1.062);
        shallowPos.setXYZ(i, point.x - ISLAND.x, -(point.z - ISLAND.z), 0);
    }
    shallow.geometry.computeVertexNormals(); shallow.rotation.x = -Math.PI / 2; shallow.castShadow = false;
    const sea = createSeaDetails(root, wood);

    // Small steps and a weathered dock establish the relationship between home and beach.
    for (let i = 0; i < 3; i++) box('cabin-entry-step', .7, -.08 - i * .10, 3.85 + i * .23, 1.6, .13, .34);
    for (let i = 0; i < 29; i++) box('dock-plank', DOCK.x, -.30, DOCK.start + i * .245, DOCK.width, .085, .226);
    for (const z of [15.8, 18.0, 20.3, 22.5]) for (const x of [7.2, 8.8]) {
        mesh('dock-timber-post', new T.CylinderGeometry(.075, .095, 1.2, 9), wood, x, -.60, z);
        mesh('post-cap', new T.CylinderGeometry(.091, .091, .05, 9), wood, x, .025, z);
    }
    const rope = material('#d2c5a3');
    for (const x of [7.2, 8.8]) {
        const points = [v(x, .02, 15.8), v(x, -.16, 16.9), v(x, .02, 18.0), v(x, -.16, 19.15), v(x, .02, 20.3), v(x, -.16, 21.4), v(x, .02, 22.5)];
        mesh('dock-rope', new T.TubeGeometry(new T.CatmullRomCurve3(points), 30, .018, 5, false), rope);
    }
    for (let i = 0; i < 5; i++) {
        const stone = mesh('stepping-stone', new T.CylinderGeometry(.22, .25, .024, 6), rockMats[1], .78 + i * .13, -.232, 4.68 + i * .29); stone.rotation.y = i * .7;
    }

    function palm(x, z, height, lean) {
        const palmRoot = new T.Group(); palmRoot.name = 'island-palm'; palmRoot.position.set(x, -.40, z); root.add(palmRoot);
        const trunkMat = material('#a68a63');
        const path = new T.CatmullRomCurve3([v(0, 0, 0), v(lean * .1, height * .34, .07), v(lean * .45, height * .7, .02), v(lean, height, 0)]);
        mesh('curved-palm-trunk', new T.TubeGeometry(path, 16, .095, 8, false), trunkMat, 0, 0, 0, palmRoot);
        for (let i = 1; i < 15; i++) {
            const point = path.getPoint(i / 15), ring = mesh('palm-trunk-ring', new T.TorusGeometry(.097, .009, 4, 10), material('#bda078'), point.x, point.y, point.z, palmRoot);
            ring.quaternion.setFromUnitVectors(v(0, 0, 1), path.getTangent(i / 15));
        }
        for (let leaf = 0; leaf < 9; leaf++) {
            const a = leaf / 9 * Math.PI * 2, length = 1.75 + (leaf % 3) * .24;
            const leafPositions = [], leafIndices = [];
            for (let i = 0; i <= 18; i++) {
                const t = i / 18, r = t * length, y = .65 * Math.sin(t * Math.PI * .90) - .72 * t * t;
                const width = Math.sin(Math.PI * t) * (i % 2 ? .21 : .39);
                for (const side of [-1, 0, 1]) leafPositions.push(Math.cos(a) * r + Math.sin(a) * width * side, y - Math.abs(side) * .09, Math.sin(a) * r - Math.cos(a) * width * side);
                if (i < 18) { const k = i * 3; leafIndices.push(k, k + 3, k + 1, k + 1, k + 3, k + 4, k + 1, k + 4, k + 2, k + 2, k + 4, k + 5); }
            }
            const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.Float32BufferAttribute(leafPositions, 3)); geometry.setIndex(leafIndices); geometry.computeVertexNormals();
            const frondMat = foliage[leaf % 3]; frondMat.side = T.DoubleSide;
            mesh('palm-frond', geometry, frondMat, lean, height, 0, palmRoot);
        }
        for (let i = 0; i < 3; i++) mesh('coconut', new T.IcosahedronGeometry(.12, 1), trunkMat, lean + Math.cos(i * 2.1) * .13, height - .12, Math.sin(i * 2.1) * .13, palmRoot);
    }
    PALMS.forEach(args => palm(...args));
    const footballIsland = createFootballIsland({ sand, sandMap, wood, palm });
    root.add(footballIsland.root);

    for (const [x, z, scale] of ROCKS) {
        const rock = mesh('coastal-rock', new T.DodecahedronGeometry(scale, 0), rockMats[Math.abs(Math.round(x)) % 3], x, -.30 + scale * .26, z); rock.scale.set(1.3, .73, .87); rock.rotation.set(.15, x, .07);
    }
    for (const [x, z] of [[-9.2, -.5], [-8.3, 5.3], [12.9, -7], [21.2, 3.8], [3.2, -7.3], [-5.8, 12.3], [-4.8, -5.0], [11.5, 12.1], [22.3, -5.5], [17.5, 10.9]]) {
        for (let i = 0; i < 5; i++) {
            const bush = mesh('coastal-shrub', new T.IcosahedronGeometry(.32, 1), foliage[i % 3], x + Math.cos(i * 2.4) * .27, -.18 + (i % 2) * .10, z + Math.sin(i * 2.4) * .20); bush.scale.set(1, .72, 1);
        }
        for (let i = 0; i < 6; i++) {
            const a = i * 2.4; beam('beach-grass', v(x + .5, -.35, z), v(x + .5 + Math.cos(a) * .16, .15 + i % 3 * .06, z + Math.sin(a) * .16), .012, foliage[i % 3]);
        }
    }

    // A quiet outdoor corner, offset from the path so the resident never walks through it.
    const garden = new T.Group(); garden.name = 'garden-bench-and-table'; garden.position.set(17.5, -.27, 8.8); garden.rotation.y = -.42; root.add(garden);
    for (let i = 0; i < 4; i++) box('bench-seat-slat', 0, .48, -.28 + i * .18, 1.90, .085, .15, wood, garden);
    for (const x of [-.73, .73]) {
        for (const z of [-.25, .25]) box('bench-leg', x, .22, z, .09, .44, .09, wood, garden);
        box('bench-back-upright', x, .83, -.32, .09, .86, .09, wood, garden);
    }
    for (const y of [.85, 1.07]) box('bench-back-slat', 0, y, -.32, 1.90, .16, .075, wood, garden);
    mesh('garden-round-table', new T.CylinderGeometry(.46, .46, .07, 24), wood, -.3, .42, 1.18, garden);
    for (let i = 0; i < 3; i++) { const a = i * 2.094; beam('garden-table-leg', v(-.3 + Math.cos(a) * .26, 0, 1.18 + Math.sin(a) * .26), v(-.3 + Math.cos(a) * .21, .42, 1.18 + Math.sin(a) * .21), .035, wood, garden); }
    mesh('garden-teacup', new T.CylinderGeometry(.07, .053, .16, 16), material('#eee5cc'), -.36, .54, 1.18, garden);
    for (const [x, z] of ENTRY_POTS) {
        mesh('outside-clay-pot', new T.CylinderGeometry(.28, .19, .42, 12), material('#bc9574'), x, -.06, z);
        for (let i = 0; i < 7; i++) { const leaf = mesh('potted-leaf', new T.SphereGeometry(1, 8, 6), foliage[i % 3], x + Math.cos(i * 2.4) * .21, .28 + i % 3 * .14, z + Math.sin(i * 2.4) * .21); leaf.scale.set(.13, .30, .08); leaf.rotation.set(.45, i, .4); }
    }
    // A woven hammock hangs low between its own supports, beyond the house's left wall.
    const hammock = new T.Group(); hammock.name = 'garden-hammock'; hammock.position.set(-4.25, -.27, 9.15); hammock.rotation.y = -.24; root.add(hammock);
    for (const side of [-1, 1]) beam('hammock-post', v(side * 1.62, 0, 0), v(side * 1.72, 1.63, 0), .065, wood, hammock);
    const cloth = new T.PlaneGeometry(2.92, .91, 20, 8), clothPos = cloth.attributes.position;
    for (let i = 0; i < clothPos.count; i++) { const x = clothPos.getX(i), z = clothPos.getY(i); clothPos.setXYZ(i, x, .54 + .74 * Math.pow(x / 1.46, 2) + .16 * Math.pow(z / .455, 2), z); }
    cloth.computeVertexNormals();
    mesh('hammock-canvas', cloth, material('#ecdfbd', { map: sandMap, side: T.DoubleSide }), 0, 0, 0, hammock);
    for (const side of [-1, 1]) for (const z of [-.43, 0, .43]) beam('hammock-rope', v(side * 1.46, 1.28 + (z ? .16 : 0), z), v(side * 1.72, 1.58, 0), .013, rope, hammock);
    const palms = root.children.filter(object => object.name === 'island-palm');
    return {
        root,
        updateCutaway(camera, indoors) {
            // Cut foreground palms with the near walls so leaves cannot cover the room.
            const dx = camera.position.x, dz = camera.position.z - .70;
            for (const palm of palms) palm.visible = !indoors || palm.position.x * dx + (palm.position.z - .70) * dz <= 0;
        },
        update(time, reduced, weather, daylight) {
            sea.update(time, reduced, weather, daylight);
            waterMap.offset.set(reduced ? 0 : time * .0007, reduced ? 0 : time * .00035);
        },
        dispose() {
            footballIsland.dispose();
            const geometry = new Set(), materials = new Set();
            root.traverse(object => { if (object.geometry) geometry.add(object.geometry); if (object.material) materials.add(object.material); });
            geometry.forEach(item => item.dispose()); materials.forEach(item => item.dispose());
            [sandMap, waterMap, woodMap].forEach(texture => texture.dispose());
        },
    };
}
