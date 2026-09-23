import * as T from 'three';
import { FOOTBALL_ISLAND, FOOTBALL_DOCK, FOOTBALL_PALMS, coastPoint, islandTerrain } from './island-layout.js?v=ferry-20260923';

// A neighbouring scenic island shares the main island's sand and shoreline profile.
export function createFootballIsland({ sand, sandMap, wood, palm }) {
    const root = new T.Group(); root.name = 'football-island';
    const { x, z } = FOOTBALL_ISLAND;
    const material = color => new T.MeshStandardMaterial({ color, roughness: .92 });
    function mesh(name, geometry, mat, px = 0, py = 0, pz = 0, parent = root) {
        const object = new T.Mesh(geometry, mat); object.name = name; object.position.set(px, py, pz);
        object.castShadow = object.receiveShadow = true; parent.add(object); return object;
    }
    const { positions, uvs, indices } = islandTerrain(FOOTBALL_ISLAND);
    const terrain = new T.BufferGeometry();
    terrain.setAttribute('position', new T.BufferAttribute(positions, 3));
    terrain.setAttribute('uv', new T.BufferAttribute(uvs, 2));
    terrain.setIndex(new T.BufferAttribute(indices, 1)); terrain.computeVertexNormals();
    mesh('football-island-beach', terrain, sand);

    function shoreSurface(name, scale, y, mat) {
        const outline = Array.from({ length: 96 }, (_, i) => {
            const point = coastPoint(i / 96 * Math.PI * 2, scale, FOOTBALL_ISLAND);
            return new T.Vector2(point.x - x, -(point.z - z));
        });
        const geometry = new T.ShapeGeometry(new T.Shape(outline));
        const uv = geometry.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 4, uv.getY(i) / 4);
        const surface = mesh(name, geometry, mat, x, y, z); surface.rotation.x = -Math.PI / 2; surface.castShadow = false;
    }
    shoreSurface('football-island-shallows', 1.13, -1.062, new T.MeshStandardMaterial({ color: '#a3d3c2', transparent: true, opacity: .24, depthWrite: false }));
    shoreSurface('football-island-meadow', .80, -.266, new T.MeshStandardMaterial({ color: '#a8b782', map: sandMap, roughness: 1 }));

    // Paint the markings once onto a local texture: clear at overview scale, no extra draw calls.
    const canvas = document.createElement('canvas'); canvas.width = 1536; canvas.height = 960;
    const ctx = canvas.getContext('2d');
    for (let stripe = 0; stripe < 12; stripe++) {
        ctx.fillStyle = stripe % 2 ? '#6b965e' : '#749f66';
        ctx.fillRect(stripe * 128, 0, 128, 960);
    }
    for (let i = 0; i < 18000; i++) {
        ctx.fillStyle = i % 2 ? '#ffffff07' : '#183b2208';
        ctx.fillRect((i * 751) % 1536, (i * 433 + Math.floor(i / 1536) * 17) % 960, 2, 3);
    }
    ctx.strokeStyle = '#f5f2de'; ctx.fillStyle = '#f5f2de'; ctx.lineWidth = 5;
    const left = 48, right = 1488, top = 48, bottom = 912, middle = 480;
    const line = (a, b, c, d) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); };
    const arc = (cx, cy, r, a = 0, b = Math.PI * 2) => { ctx.beginPath(); ctx.arc(cx, cy, r, a, b); ctx.stroke(); };
    const dot = (cx, cy) => { ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill(); };
    ctx.strokeRect(left, top, right - left, bottom - top);
    line(768, top, 768, bottom); arc(768, middle, 126); dot(768, middle);
    for (const side of [-1, 1]) {
        const goalX = side < 0 ? left : right;
        const inner = side < 0 ? 1 : -1;
        ctx.strokeRect(goalX, middle - 270, inner * 225, 540);
        ctx.strokeRect(goalX, middle - 122, inner * 75, 244);
        const spotX = goalX + inner * 150; dot(spotX, middle);
        const theta = Math.acos(75 / 126);
        arc(spotX, middle, 126, side < 0 ? -theta : Math.PI - theta, side < 0 ? theta : Math.PI + theta);
    }
    arc(left, top, 21, 0, Math.PI / 2); arc(right, top, 21, Math.PI / 2, Math.PI);
    arc(left, bottom, 21, -Math.PI / 2, 0); arc(right, bottom, 21, Math.PI, Math.PI * 1.5);
    const pitchTexture = new T.CanvasTexture(canvas); pitchTexture.colorSpace = T.SRGBColorSpace; pitchTexture.anisotropy = 8;
    const pitchLength = 23, pitchWidth = 14.375;
    const pitch = mesh('striped-football-pitch', new T.PlaneGeometry(pitchLength, pitchWidth), new T.MeshStandardMaterial({ map: pitchTexture, roughness: 1 }), x, -.248, z);
    pitch.rotation.x = -Math.PI / 2; pitch.castShadow = false;

    const white = material('#f4f0db'), flagMat = material('#d68e61');
    function bar(start, end, radius, parent) {
        const a = new T.Vector3(...start), b = new T.Vector3(...end);
        const pole = mesh('goal-frame', new T.CylinderGeometry(radius, radius, a.distanceTo(b), 8), white, 0, 0, 0, parent);
        pole.position.copy(a).add(b).multiplyScalar(.5); pole.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.sub(a).normalize());
    }
    for (const side of [-1, 1]) {
        const goal = new T.Group(); goal.name = side < 0 ? 'west-football-goal' : 'east-football-goal';
        goal.position.set(x + side * (right - 768) / 1536 * pitchLength, -.242, z); root.add(goal);
        const back = side * .93, half = 1.35, height = 1.70;
        for (const edge of [-half, half]) {
            bar([0, 0, edge], [0, height, edge], .052, goal);
            bar([0, height, edge], [back, height * .72, edge], .027, goal);
            bar([back, 0, edge], [back, height * .72, edge], .027, goal);
            bar([0, .02, edge], [back, .02, edge], .027, goal);
        }
        bar([0, height, -half], [0, height, half], .052, goal);
        const threads = [];
        const thread = (a, b) => threads.push(...a, ...b);
        for (let i = 0; i <= 16; i++) {
            const gz = -half + i / 16 * half * 2;
            thread([back, 0, gz], [back, height * .72, gz]);
            thread([0, height, gz], [back, height * .72, gz]);
        }
        for (let i = 0; i <= 9; i++) {
            const gy = i / 9 * height * .72;
            thread([back, gy, -half], [back, gy, half]);
            for (const edge of [-half, half]) thread([0, i / 9 * height, edge], [back, gy, edge]);
        }
        for (let i = 0; i <= 5; i++) {
            const t = i / 5;
            thread([back * t, height * (1 - t * .28), -half], [back * t, height * (1 - t * .28), half]);
            for (const edge of [-half, half]) thread([back * t, 0, edge], [back * t, height * (1 - t * .28), edge]);
        }
        const netGeometry = new T.BufferGeometry(); netGeometry.setAttribute('position', new T.Float32BufferAttribute(threads, 3));
        const net = new T.LineSegments(netGeometry, new T.LineBasicMaterial({ color: '#f4f1e1', transparent: true, opacity: .58 })); net.name = 'football-goal-net'; goal.add(net);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const fx = x + sx * 10.92, fz = z + sz * 6.57;
        mesh('corner-flag-pole', new T.CylinderGeometry(.025, .025, 1.05, 6), white, fx, .277, fz);
        mesh('corner-flag', new T.BoxGeometry(.36, .24, .012), flagMat, fx + .18, .68, fz);
    }
    // Keep the planting beyond the touchlines so the whole pitch remains readable.
    FOOTBALL_PALMS.forEach(args => palm(...args));
    for (let i = 0; i < 29; i++) mesh('football-dock-plank', new T.BoxGeometry(FOOTBALL_DOCK.width, .085, .226), wood, FOOTBALL_DOCK.x, -.30, FOOTBALL_DOCK.start + i * .245);
    for (const dz of [FOOTBALL_DOCK.start + .1, -11.4, -9.1, FOOTBALL_DOCK.end]) for (const dx of [-.8, .8]) {
        mesh('football-dock-post', new T.CylinderGeometry(.075, .095, 1.2, 9), wood, FOOTBALL_DOCK.x + dx, -.60, dz);
        mesh('football-dock-cap', new T.CylinderGeometry(.091, .091, .05, 9), wood, FOOTBALL_DOCK.x + dx, .025, dz);
    }
    for (const bx of [x - 3, x + 3]) {
        for (let i = 0; i < 3; i++) mesh('pitch-side-bench-seat', new T.BoxGeometry(2.5, .075, .14), wood, bx, .24, z - 8.3 + i * .16);
        for (const dx of [-.95, .95]) mesh('pitch-side-bench-leg', new T.BoxGeometry(.10, .49, .45), wood, bx + dx, -.01, z - 8.14);
    }
    for (const scale of [1.035, 1.065]) {
        const points = Array.from({ length: 145 }, (_, i) => {
            const p = coastPoint(i / 144 * Math.PI * 2, scale, FOOTBALL_ISLAND); return new T.Vector3(p.x, -1.045, p.z);
        });
        const foam = new T.Line(new T.BufferGeometry().setFromPoints(points), new T.LineBasicMaterial({ color: '#eef8e8', transparent: true, opacity: .22, depthWrite: false }));
        foam.name = 'football-island-shore-foam'; root.add(foam);
    }
    return { root, dispose: () => pitchTexture.dispose() };
}
