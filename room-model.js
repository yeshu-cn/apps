import * as T from 'three';
import { furnishStudio } from './room-furniture.js';
import { makeAtmosphere } from './room-atmosphere.js';
import { buildExterior } from './room-exterior.js';

const v = (x, y, z) => new T.Vector3(x, y, z);

// A finite cutaway studio on an island; app anchors use this unchanged world origin.
export async function createRoom() {
    const loader = new T.TextureLoader();
    const sources = {
        oak: 'assets/room-oak.webp', divejournal: 'assets/divejournal-icon.png',
        sudoku: 'assets/sudoku-icon.jpg',
        trip: 'assets/trip-note-icon.jpg', tripScreen: 'assets/trip-note-screen.jpg',
        ledger: 'assets/guide-ledger.png', aquatrue: 'assets/aquatrue-icon.png',
        yixu: 'assets/yixu-icon.png',
        desktop: 'assets/atlas-map-desktop.webp',
        linen: 'assets/room-linen.webp',
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
    box(shell, 'raised-cabin-floor', oak, 0, -.13, .70, 8.35, .27, 6.1);
    for (let i = 0; i < 16; i++) {
        const plank = box(shell, `oak-floorboard-${i}`, i % 3 ? paleOak : oak, -3.89 + i * .519, .024, .70, .514, .045, 6.07);
        plank.receiveShadow = true;
    }
    box(shell, 'back-plaster-wall', '#d1c5ae', 0, 2.13, -2.26, 8.35, 4.26, .18);
    // Four solid wall pieces leave an actual window opening, with no opaque pane painted on a wall.
    const wx = -4.10, wz = -.05, windowWidth = 2.35, sill = 1.22, windowHeight = 2.40;
    box(shell, 'left-wall-below-window', '#d8cbb2', wx, sill / 2, .70, .18, sill, 6.1);
    box(shell, 'left-wall-above-window', '#d8cbb2', wx, (sill + windowHeight + 4.26) / 2, .70, .18, 4.26 - sill - windowHeight, 6.1);
    box(shell, 'left-wall-back-pier', '#d8cbb2', wx, sill + windowHeight / 2, -1.7875, .18, windowHeight, 1.125);
    box(shell, 'left-wall-front-pier', '#d8cbb2', wx, sill + windowHeight / 2, 2.4375, .18, windowHeight, 2.625);
    box(shell, 'back-baseboard', oak, 0, .16, -2.14, 8.2, .23, .09);
    box(shell, 'left-baseboard', oak, -3.98, .16, .70, .09, .23, 6.0);
    box(shell, 'back-wall-timber-cap', oak, 0, 4.28, -2.26, 8.46, .13, .28);
    box(shell, 'left-wall-timber-cap', oak, -4.10, 4.28, .70, .28, .13, 6.16);
    // A short cantilever supports the pendant without closing the overhead cutaway.
    box(shell, 'pendant-support', oak, -.55, 4.28, -1.0, .09, .09, 2.66);
    const window = group('wood-framed-window');
    const glass = mesh(window, 'glass-overlooking-the-sea', new T.PlaneGeometry(windowWidth, windowHeight), new T.MeshStandardMaterial({ color: '#bddcd1', transparent: true, opacity: .10, roughness: .2, side: T.DoubleSide, depthWrite: false }), -4.145, sill + windowHeight / 2, wz);
    glass.rotation.y = Math.PI / 2; glass.castShadow = false;
    for (const y of [sill, sill + windowHeight]) box(window, 'window-horizontal-frame', oak, -3.96, y, wz, .16, .11, windowWidth + .17);
    for (const z of [wz - windowWidth / 2, wz, wz + windowWidth / 2]) box(window, 'window-upright', oak, -3.96, sill + windowHeight / 2, z, .16, windowHeight, .075);
    box(window, 'window-crossbar', oak, -3.95, sill + windowHeight / 2, wz, .15, .065, windowWidth);
    box(window, 'deep-window-sill', paleOak, -3.86, sill - .04, wz, .39, .10, windowWidth + .24);

    const shelves = group('two-floating-shelves');
    for (const y of [3.27, 2.24]) {
        rounded(shelves, 'oak-display-shelf', oak, .22, y, -1.87, 6.98, .13, .70, .04);
        for (const x of [-2.6, 2.7]) {
            box(shelves, 'shelf-bracket-upright', '#a28a69', x, y - .17, -2.10, .045, .30, .07);
            beam(shelves, 'shelf-bracket-diagonal', '#a28a69', v(x, y - .30, -2.10), v(x, y - .07, -1.63), .019);
        }
    }
    function app(id, x, y, z = -1.69) {
        const g = group(`app-${id}`); g.position.set(x, y, z); g.userData.appId = id; objects[id] = g;
        anchors[id] = v(x, y - .03, z + .24);
        return g;
    }
    function book(parent, texture, color, w = .64, h = .87, d = .13, crop) {
        rounded(parent, 'book-pages', '#e4dbc3', 0, h / 2, 0, w - .03, h - .045, d);
        for (const z of [-d / 2 - .016, d / 2 + .016]) rounded(parent, 'book-cover', color, 0, h / 2, z, w, h, .024);
        rounded(parent, 'bound-spine', color, -w / 2 + .027, h / 2, 0, .065, h, d + .034);
        if (texture) face(parent, 'cover-art', texture, 0, h / 2, d / 2 + .047, w - .027, h - .04, crop);
        for (let i = 0; i < 7; i++) box(parent, 'page-edge', '#cfc5ad', w / 2 - .006, .09 + i * h / 8, 0, .008, .004, d * .88);
    }
    const journal = app('divejournal', -2.25, 2.60); journal.rotation.z = .025;
    book(journal, textures.divejournal, '#294a5d', .71, .96, .15, [.24, .17, .53, .72]);
    box(journal, 'cloth-bookmark', '#8ea9b2', -.19, -.075, .11, .055, .20, .016);
    const sudoku = app('sudoku', .03, 2.60);
    rounded(sudoku, 'puzzle-tablet', '#eee7d5', 0, .49, 0, .87, .97, .095, .075);
    face(sudoku, 'real-sudoku-icon', textures.sudoku, 0, .50, .064, .75, .75);
    const pencil = cylinder(sudoku, 'pencil', '#cd9b54', .58, .30, .08, .018, .018, .61); pencil.rotation.z = -.2;
    const trip = app('trip', 2.25, 2.60);
    book(trip, null, '#9dbaa8', .83, .83, .13);
    const phone = group('travel-phone', trip); phone.position.set(.03, .06, .13);
    rounded(phone, 'phone-body', '#3e4742', 0, .44, 0, .47, .87, .055, .052);
    face(phone, 'real-travel-screen', textures.tripScreen, 0, .445, .042, .413, .75, [.185, .025, .67, .67]);
    const tag = rounded(trip, 'luggage-tag', '#c97d50', .49, .17, .17, .22, .31, .028); tag.rotation.z = -.14;
    mesh(trip, 'tag-eyelet', new T.TorusGeometry(.022, .006, 6, 12), '#795c3c', .47, .275, .194);

    const ledger = app('ledger', -2.42, 1.29);
    book(ledger, textures.ledger, '#348d84', .61, .73, .13);
    for (let i = 0; i < 6; i++) { const ring = mesh(ledger, 'ledger-spiral', new T.TorusGeometry(.035, .008, 6, 12), mat('#a69568', .5, .55), -.30, .11 + i * .102, .025); ring.rotation.y = Math.PI / 2; }
    const aqua = app('aquatrue', -.69, 1.29);
    rounded(aqua, 'wave-display-base', oak, 0, .045, 0, .69, .09, .29, .025);
    const disc = cylinder(aqua, 'wave-disc', '#3faba7', 0, .44, 0, .36, .36, .11); disc.rotation.x = Math.PI / 2;
    mesh(aqua, 'real-wave-art', new T.CircleGeometry(.358, 48), new T.MeshStandardMaterial({ map: textures.aquatrue, roughness: .55 }), 0, .44, .062);
    const measure = app('imagesize', 1.05, 1.29);
    rounded(measure, 'camera-body', '#394245', 0, .32, 0, .71, .57, .27, .10);
    rounded(measure, 'camera-top', '#4b5555', -.16, .64, 0, .28, .095, .18, .022);
    const lens = cylinder(measure, 'machined-lens-barrel', mat('#889798', .37, .72), .055, .34, .20, .205, .205, .15); lens.rotation.x = Math.PI / 2;
    mesh(measure, 'lens-ring', new T.TorusGeometry(.166, .021, 8, 36), mat('#c1c9c5', .28, .75), .055, .34, .283);
    mesh(measure, 'lens-glass', new T.CircleGeometry(.145, 36), mat('#1b454b', .22, .45), .055, .34, .286);
    box(measure, 'flash', '#beded4', -.24, .50, .147, .13, .047, .016);
    box(measure, 'ruler', paleOak, .49, .33, -.02, .082, .66, .028);
    for (let i = 0; i < 12; i++) box(measure, 'ruler-mark', '#796a4b', .50, .035 + .051 * i, -.001, i % 3 ? .023 : .042, .005, .007);
    const clothes = app('yixu', 2.80, 1.29);
    for (let i = 0; i < 2; i++) rounded(clothes, 'folded-cloth', i ? '#ded6bf' : '#eae4d5', 0, .085 + i * .10, -.005, .75 - i * .04, .095, .43, .05);
    rounded(clothes, 'wardrobe-tile', '#365e4b', 0, .46, .085, .55, .55, .06, .075);
    face(clothes, 'real-hanger-art', textures.yixu, 0, .46, .129, .515, .515);

    // App objects become small keepsakes above the two functional work surfaces.
    for (const [id, object] of Object.entries(objects)) {
        object.scale.setScalar(.64);
        object.position.y = object.position.y > 2 ? 3.34 : 2.31;
        anchors[id].y = object.position.y - .02;
        anchors[id].z = object.position.z + .17;
    }

    const board = group('single-snowboard-with-two-bindings'); board.position.set(-3.76, .98, -.79); board.rotation.set(0, .64, -.13);
    rounded(board, 'single-coral-deck', '#c37c58', 0, 0, 0, .41, 1.88, .045, .20);
    for (const y of [-.35, .35]) {
        rounded(board, 'binding-base', '#36413e', 0, y, .048, .28, .19, .035, .045);
        const binding = mesh(board, 'binding-strap', new T.TorusGeometry(.094, .024, 8, 16, Math.PI), '#323d39', 0, y, .082); binding.rotation.x = Math.PI / 2;
        rounded(board, 'binding-highback', '#4a524a', -.01, y + .085, .11, .24, .17, .046, .045).rotation.x = -.4;
    }
    const plant = group('leafy-floor-plant'); plant.position.set(-3.42, 0, .80);
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
    const stool = group('low-stool-and-cup'); stool.position.set(-2.24, 0, 2.70); stool.scale.setScalar(.82);
    cylinder(stool, 'stool-seat', paleOak, 0, .64, 0, .38, .39, .10);
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; beam(stool, 'stool-leg', oak, v(Math.cos(a) * .27, .06, Math.sin(a) * .27), v(Math.cos(a) * .21, .63, Math.sin(a) * .21), .047); }
    cylinder(stool, 'ceramic-cup', '#eee6d3', .05, .795, 0, .083, .067, .21);
    cylinder(stool, 'coffee-surface', '#76624d', .05, .90, 0, .069, .069, .006);
    mesh(stool, 'cup-handle', new T.TorusGeometry(.069, .017, 8, 20), '#eee6d3', .147, .80, 0);
    const stack = group('small-stack-of-books'); stack.position.set(3.33, .11, 1.30);
    for (let i = 0; i < 3; i++) rounded(stack, 'stacked-book', ['#a2a88b', '#e3d2b0', '#b77f61'][i], 0, i * .12, 0, .61, .11, .45, .025).rotation.y = i * .08;

    furnishStudio({ group, mesh, box, rounded, cylinder, beam, mat, oak, paleOak, textures });
    makeAtmosphere({ root, group, mesh, box, rounded, cylinder, beam, mat, oak, paleOak, textures });
    const exterior = buildExterior({ group, mesh, box, cylinder, oak, paleOak });

    root.updateMatrixWorld(true);
    const initial = Object.fromEntries(Object.entries(objects).map(([id, g]) => [id, { position: g.position.clone(), rotation: g.rotation.z }]));
    let selected = null;
    return {
        root, anchors, objects,
        setInterior: exterior.setInterior,
        highlight(id) { selected = id; },
        update(delta, reduced = false) {
            let changed = false;
            const step = reduced ? 1 : 1 - Math.exp(-delta * 14);
            for (const [id, object] of Object.entries(objects)) {
                const target = initial[id].position.y + (selected === id ? .08 : 0);
                if (Math.abs(object.position.y - target) > .0002) { object.position.y = T.MathUtils.lerp(object.position.y, target, step); changed = true; }
            }
            return changed;
        },
        dispose() {
            const geometries = new Set(), usedMaterials = new Set(), usedTextures = new Set(Object.values(textures));
            root.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) { const list = Array.isArray(object.material) ? object.material : [object.material]; list.forEach(m => { usedMaterials.add(m); for (const key of ['map', 'bumpMap', 'emissiveMap']) if (m[key]) usedTextures.add(m[key]); }); } if (object.isLight) object.dispose(); });
            geometries.forEach(g => g.dispose()); usedMaterials.forEach(m => m.dispose()); usedTextures.forEach(t => t.dispose());
        },
    };
}
