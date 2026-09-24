import * as T from 'three';
import { GLTFLoader } from './assets/vendor/three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from './assets/vendor/three/addons/environments/RoomEnvironment.js';
import { furnishStudio } from './room-furniture.js?v=room-clear-20260923';
import { makeAtmosphere } from './room-atmosphere.js?v=room-clear-20260923';
import { buildCraftedExterior } from './room-crafted-exterior.js?v=crafted-20260924';
import { buildExterior } from './room-exterior.js?v=room-wide-20260923';
import { CABIN, BOOKCASE, INDOOR_PROPS } from './room-layout.js?v=room-clear-20260923';

const v = (x, y, z) => new T.Vector3(x, y, z);

// A finite cutaway studio on an island; app anchors use this unchanged world origin.
export async function createRoom(apps = [], renderer, { exterior: exteriorStyle = 'crafted' } = {}) {
    const loader = new T.TextureLoader();
    const sources = {
        oak: 'assets/room-oak.webp', desktop: 'assets/atlas-map-desktop.webp',
        linen: 'assets/room-linen.webp', landscape: 'assets/room-evening.webp',
        ...Object.fromEntries(apps.map(app => [app.dataset.app, app.querySelector('img').getAttribute('src')])),
    };
    const textures = {};
    await Promise.all(Object.entries(sources).map(async ([id, url]) => {
        const texture = await loader.loadAsync(url);
        texture.colorSpace = T.SRGBColorSpace;
        texture.anisotropy = 4;
        textures[id] = texture;
    }));
    const root = new T.Group(); root.name = 'small-personal-room';
    const objects = {}, anchors = {}, materials = new Map();
    const mat = (color, roughness = .8, metalness = 0) => {
        const key = `${color}/${roughness}/${metalness}`;
        if (!materials.has(key)) materials.set(key, new T.MeshStandardMaterial({ color, roughness, metalness }));
        return materials.get(key);
    };
    const oak = new T.MeshStandardMaterial({ color: '#d7be9e', map: textures.oak, roughness: .82 });
    const paleOak = new T.MeshStandardMaterial({ color: '#e7cda7', map: textures.oak, roughness: .88 });
    const group = (name, parent = root) => { const g = new T.Group(); g.name = name; parent.add(g); return g; };
    function mesh(parent, name, geometry, material, x = 0, y = 0, z = 0) {
        const m = new T.Mesh(geometry, typeof material === 'string' ? mat(material) : material);
        m.name = name; m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
    }
    const box = (p, name, color, x, y, z, w, h, d) => mesh(p, name, new T.BoxGeometry(w, h, d), color, x, y, z);
    function rounded(p, name, material, x, y, z, w, h, d, radius = .055) {
        const r = Math.min(radius, w / 3, h / 3), s = new T.Shape();
        s.moveTo(-w / 2 + r, -h / 2);
        s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
        s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
        s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
        s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
        const geometry = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .012, bevelThickness: .012, curveSegments: 6 });
        geometry.translate(0, 0, -d / 2);
        return mesh(p, name, geometry, material, x, y, z);
    }
    const cylinder = (p, name, color, x, y, z, rTop, rBottom, height) => mesh(p, name, new T.CylinderGeometry(rTop, rBottom, height, 24), color, x, y, z);
    function beam(p, name, color, start, end, radius = .025) {
        const m = cylinder(p, name, color, 0, 0, 0, radius, radius, start.distanceTo(end));
        m.position.copy(start).add(end).multiplyScalar(.5);
        m.quaternion.setFromUnitVectors(v(0, 1, 0), end.clone().sub(start).normalize()); return m;
    }
    function face(p, name, texture, x, y, z, w, h, crop) {
        let map = texture;
        if (crop) { map = texture.clone(); map.repeat.set(crop[2], crop[3]); map.offset.set(crop[0], crop[1]); map.needsUpdate = true; }
        return mesh(p, name, new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map, roughness: .85 }), x, y, z);
    }
    const shell = group('walls-and-floor');
    box(shell, 'raised-cabin-floor', oak, 0, -.13, CABIN.centerZ, CABIN.width, .27, CABIN.depth);
    const plankCount = Math.ceil(CABIN.width / .52), plankWidth = CABIN.width / plankCount;
    for (let i = 0; i < plankCount; i++) {
        const plank = box(shell, `oak-floorboard-${i}`, i % 3 ? paleOak : oak, -CABIN.width / 2 + (i + .5) * plankWidth, .024, CABIN.centerZ, plankWidth - .005, .045, CABIN.depth - .03);
        plank.receiveShadow = true;
    }
    // A full-size cabinet stands beside the desk against the back wall. Only app
    // models are small: each is a freestanding, directly selectable icon tile.
    const bookcase = group('back-app-bookcase');
    bookcase.position.set(BOOKCASE.x, BOOKCASE.bottom, BOOKCASE.z); bookcase.rotation.y = BOOKCASE.yaw;
    bookcase.userData.collection = true;
    const cabinetWood = new T.MeshStandardMaterial({ color: '#bba486', map: textures.oak, roughness: .95 });
    box(bookcase, 'bookcase-back', '#b7a38a', 0, 1.27, -.205, 1.78, 2.14, .04);
    for (const x of [-.89, .89]) box(bookcase, 'bookcase-side', cabinetWood, x, 1.27, 0, .07, 2.14, .46);
    const shelfLevels = [.18, .71, 1.24, 1.77, 2.32];
    for (const y of shelfLevels) box(bookcase, 'bookcase-shelf', cabinetWood, 0, y, 0, 1.85, .06, .46);
    for (const x of [-.80, .80]) for (const z of [-.15, .15]) box(bookcase, 'bookcase-foot', cabinetWood, x, .09, z, .07, .18, .07);
    apps.forEach((entry, i) => {
        const id = entry.dataset.app, row = Math.floor(i / 4), column = i % 4;
        const rowCount = Math.min(4, apps.length - row * 4);
        const icon = group(`app-${id}`, bookcase);
        icon.position.set((column - (rowCount - 1) / 2) * .43, shelfLevels[3 - row] + .19, .18);
        icon.userData.appId = id; objects[id] = icon;
        rounded(icon, 'small-app-icon-body', '#e6e0d2', 0, 0, 0, .29, .29, .07, .045);
        const faceShape = new T.Shape(), r = .034, half = .139;
        faceShape.moveTo(-half + r, -half);
        faceShape.lineTo(half - r, -half); faceShape.quadraticCurveTo(half, -half, half, -half + r);
        faceShape.lineTo(half, half - r); faceShape.quadraticCurveTo(half, half, half - r, half);
        faceShape.lineTo(-half + r, half); faceShape.quadraticCurveTo(-half, half, -half, half - r);
        faceShape.lineTo(-half, -half + r); faceShape.quadraticCurveTo(-half, -half, -half + r, -half);
        const geometry = new T.ShapeGeometry(faceShape, 6), positions = geometry.attributes.position;
        const uv = geometry.attributes.uv;
        for (let n = 0; n < positions.count; n++) uv.setXY(n, (positions.getX(n) + half) / (half * 2), (positions.getY(n) + half) / (half * 2));
        const art = new T.MeshStandardMaterial({ map: textures[id], roughness: .85 });
        mesh(icon, 'original-app-icon-art', geometry, art, 0, 0, .049);
    });
    // One ordinary landscape replaces the two full-width app display shelves.
    rounded(root, 'landscape-frame', oak, -.14, 2.98, -2.095, .98, .68, .07, .014);
    face(root, 'quiet-landscape-print', textures.landscape, -.14, 2.98, -2.045, .86, .56);

    const board = group('single-snowboard-with-two-bindings');
    let customBoard, boardEnvironment;
    try {
        const gltf = await new GLTFLoader().loadAsync(new URL('./assets/models/snowboard-web.glb?v=20260923', import.meta.url).href);
        customBoard = gltf.scene;
    } catch (error) {
        console.warn('The custom snowboard could not load; using the lightweight board.', error);
    }
    if (customBoard) {
        board.add(customBoard); board.userData.source = 'user-glb';
        if (renderer) {
            const studio = new RoomEnvironment(), pmrem = new T.PMREMGenerator(renderer);
            boardEnvironment = pmrem.fromScene(studio, .04);
            studio.dispose(); pmrem.dispose();
        }
        customBoard.traverse(object => {
            if (!object.isMesh) return;
            object.castShadow = object.receiveShadow = true;
            for (const material of [].concat(object.material)) {
                if (boardEnvironment) { material.envMap = boardEnvironment.texture; material.envMapIntensity = .7; }
            }
        });
        // The web asset is upright, 1.88 units tall, with its pivot on the floor.
        board.rotation.set(-.02, .75, .06);
        const bounds = new T.Box3().setFromObject(board, true);
        board.position.set(INDOOR_PROPS.snowboard.x, .052 - bounds.min.y, INDOOR_PROPS.snowboard.z);
    } else {
        board.userData.source = 'fallback';
        board.position.set(INDOOR_PROPS.snowboard.x, .99, INDOOR_PROPS.snowboard.z); board.rotation.set(0, .18, -.06);
        rounded(board, 'single-coral-deck', '#c37c58', 0, 0, 0, .41, 1.88, .045, .20);
        for (const y of [-.35, .35]) {
            rounded(board, 'binding-base', '#36413e', 0, y, .048, .28, .19, .035, .045);
            const binding = mesh(board, 'binding-strap', new T.TorusGeometry(.094, .024, 8, 16, Math.PI), '#323d39', 0, y, .082); binding.rotation.x = Math.PI / 2;
            rounded(board, 'binding-highback', '#4a524a', -.01, y + .085, .11, .24, .17, .046, .045).rotation.x = -.4;
        }
    }
    const plant = group('leafy-floor-plant'); plant.position.set(INDOOR_PROPS.plant.x, 0, INDOOR_PROPS.plant.z);
    cylinder(plant, 'terracotta-pot', '#b7896d', 0, .25, 0, .29, .20, .48);
    cylinder(plant, 'pot-rim', '#c49d80', 0, .48, 0, .303, .303, .09);
    cylinder(plant, 'soil', '#5b5140', 0, .521, 0, .262, .262, .015);
    for (let i = 0; i < 11; i++) {
        const a = i * 2.399, h = .80 + (i % 4) * .16, reach = .27 + (i % 3) * .09;
        const tip = v(Math.cos(a) * reach, h, Math.sin(a) * reach);
        beam(plant, 'plant-stem', '#687551', v(0, .50, 0), tip, .012);
        const leaf = mesh(plant, 'volumetric-leaf', new T.SphereGeometry(1, 10, 7), i % 2 ? '#83926a' : '#657f5c', tip.x, tip.y, tip.z);
        leaf.scale.set(.12, .28, .035); leaf.rotation.set(.55, -a, -.65);
    }
    const furniture = furnishStudio({ group, mesh, box, rounded, cylinder, beam, mat, oak, paleOak, textures });
    const coffee = group('desk-coffee-cup', furniture.desk); coffee.position.set(1.45, 1.18, .49);
    cylinder(coffee, 'ceramic-cup', '#eee6d3', 0, .105, 0, .083, .067, .21);
    cylinder(coffee, 'coffee-surface', '#76624d', 0, .21, 0, .069, .069, .006);
    mesh(coffee, 'cup-handle', new T.TorusGeometry(.069, .017, 8, 20), '#eee6d3', .097, .11, 0);
    makeAtmosphere({ root, group, mesh, box, rounded, cylinder, beam, mat, oak, paleOak, textures, bookcase, desk: furniture.desk });
    const exterior = await (exteriorStyle === 'original' ? buildExterior : buildCraftedExterior)({ group, mesh, box, cylinder, oak, paleOak });
    root.userData.exterior = exteriorStyle;
    // Wall-mounted decor follows the corresponding wall during a camera cutaway.
    if (exteriorStyle === 'crafted') root.getObjectByName('linen-curtains').position.z += .75;
    root.updateMatrixWorld(true);
    exterior.walls.left.attach(root.getObjectByName('linen-curtains'));
    for (const name of ['landscape-frame', 'quiet-landscape-print']) exterior.walls.back.attach(root.getObjectByName(name));

    root.updateMatrixWorld(true);
    const shelfAnchor = bookcase.localToWorld(v(0, 2.45, .25));
    for (const [id, icon] of Object.entries(objects)) anchors[id] = icon.localToWorld(v(0, 0, .055));
    return {
        root, anchors, objects, shelfAnchor, bookcase,
        setInterior: exterior.setInterior,
        updateCutaway: exterior.updateCutaway,
        // Icons stay still, with names shown only on hover/focus.
        highlight() {},
        update() { return false; },
        dispose() {
            const geometries = new Set(), usedMaterials = new Set(), usedTextures = new Set(Object.values(textures));
            root.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) { const list = Array.isArray(object.material) ? object.material : [object.material]; list.forEach(m => { usedMaterials.add(m); for (const value of Object.values(m)) if (value?.isTexture && value !== boardEnvironment?.texture) usedTextures.add(value); }); } if (object.isLight) object.dispose(); });
            geometries.forEach(g => g.dispose()); usedMaterials.forEach(m => m.dispose()); usedTextures.forEach(t => t.dispose());
            boardEnvironment?.dispose();
        },
    };
}
