import * as T from 'three';
import { CABIN, CABIN_WINDOWS, CABIN_DOOR } from './room-layout.js?v=room-clear-20260923';

// One physical cottage: the roof and camera-side walls/windows cut away indoors.
export function buildExterior({ group, mesh, box, cylinder, oak, paleOak }) {
    const exterior = group('complete-cabin-exterior');
    const halfWidth = CABIN.width / 2, extraWidth = CABIN.width - 8.35;
    const plaster = '#e5d9bc', trim = '#ecdfc3';
    const roofMat = new T.MeshStandardMaterial({ color: '#4c7e78', roughness: .78 });
    const seamMat = new T.MeshStandardMaterial({ color: '#67928a', roughness: .8 });
    const glassMat = new T.MeshStandardMaterial({ color: '#b4cfbb', emissive: '#f3c27b', emissiveIntensity: .23, roughness: .3, transparent: true, opacity: .22, side: T.DoubleSide, depthWrite: false });
    // Front wall sections leave real openings for the windows and the walk-through door.
    const front = group('front-facade'); front.position.z = 3.74;
    const openings = [
        ...CABIN_WINDOWS.filter(w => w.id.startsWith('front')).map(w => ({ left: w.x - w.width / 2, right: w.x + w.width / 2, sill: w.sill, top: w.sill + w.height })),
        CABIN_DOOR,
    ].sort((a, b) => a.left - b.left);
    let edge = -halfWidth;
    for (const opening of openings) {
        const { left, right, sill, top, door } = opening, x = (left + right) / 2, w = right - left;
        box(front, 'front-wall-pier', plaster, (edge + left) / 2, 2.13, 0, left - edge, 4.26, .18);
        if (sill) box(front, 'wall-below-window', plaster, x, sill / 2, 0, w, sill, .18);
        box(front, 'wall-above-opening', plaster, x, (top + 4.26) / 2, 0, w, 4.26 - top, .18);
        if (door) {
            for (const side of [left, right]) box(front, 'door-timber-upright', oak, side, top / 2, .105, .11, top + .13, .14);
            box(front, 'door-timber-lintel', oak, x, top, .105, w + .20, .12, .14);
        }
        if (!door) {
            for (const side of [-1, 1]) {
                const shutterX = x + side * (w / 2 + .30);
                box(front, 'sage-window-shutter', '#899d7c', shutterX, (sill + top) / 2, .12, .42, top - sill, .075);
                for (let i = 0; i < 8; i++) box(front, 'shutter-slat', '#a6b18a', shutterX, sill + .12 + i * (top - sill - .20) / 8, .166, .37, .035, .032);
            }
        }
        edge = right;
    }
    box(front, 'front-corner-pier', plaster, (edge + halfWidth) / 2, 2.13, 0, halfWidth - edge, 4.26, .18);
    box(front, 'front-timber-eave', oak, 0, 4.20, .12, CABIN.width + .15, .17, .22);
    for (const x of [-CABIN.sideX + .01, CABIN.sideX - .01]) box(front, 'front-corner-post', oak, x, 2.15, .12, .15, 4.30, .18);
    // An open leaf sits against the inside right wall of the doorway, clear of the walking path.
    const door = group('open-cottage-door', front); door.position.set(1.375, 0, -.08); door.rotation.y = -Math.PI / 2;
    box(door, 'door-leaf', '#93a48a', -.635, 1.34, 0, 1.27, 2.62, .075);
    box(door, 'door-inset-panel', '#aab597', -.635, .70, -.043, 1.02, .96, .025);
    box(door, 'door-window', glassMat, -.635, 1.89, -.047, .89, .83, .02);
    cylinder(door, 'brass-door-handle', '#b69355', -1.09, 1.16, -.088, .042, .042, .11).rotation.x = Math.PI / 2;
    const lantern = group('entry-lantern', front); lantern.position.set(1.72, 2.85, .28);
    box(lantern, 'lantern-glow', new T.MeshStandardMaterial({ color: '#ffe0a0', emissive: '#ffc779', emissiveIntensity: .9 }), 0, 0, 0, .17, .26, .17);
    for (const y of [-.17, .17]) box(lantern, 'lantern-cap', '#576653', 0, y, 0, .24, .06, .24);

    // Right wall has a genuine window recess; the gable above it gives the house its silhouette.
    const right = group('right-facade'); right.position.set(CABIN.sideX, 0, .70); right.rotation.y = Math.PI / 2;
    const rightOpening = CABIN_WINDOWS.find(w => w.id === 'right');
    const rightTop = rightOpening.sill + rightOpening.height;
    box(right, 'right-wall-below-window', plaster, 0, rightOpening.sill / 2, 0, 6.1, rightOpening.sill, .18);
    box(right, 'right-wall-above-window', plaster, 0, (rightTop + 4.26) / 2, 0, 6.1, 4.26 - rightTop, .18);
    const pierWidth = (6.1 - rightOpening.width) / 2;
    for (const sign of [-1, 1]) box(right, 'right-wall-pier', plaster, sign * (rightOpening.width + pierWidth) / 2, rightOpening.sill + rightOpening.height / 2, 0, pierWidth, rightOpening.height, .18);
    for (const x of [-3.0, 3.0]) box(right, 'right-corner-post', oak, x, 2.13, .1, .15, 4.26, .17);
    for (const x of [-CABIN.sideX, CABIN.sideX]) {
        const gableShape = new T.Shape(); gableShape.moveTo(-3.07, 0); gableShape.lineTo(3.07, 0); gableShape.lineTo(0, 1.67); gableShape.closePath();
        const gable = mesh(exterior, 'timber-gable', new T.ExtrudeGeometry(gableShape, { depth: .14, bevelEnabled: false }), plaster, x, 4.26, .70); gable.rotation.y = Math.PI / 2;
        for (let i = -7; i <= 7; i++) {
            const z = .7 + i * .38, h = 1.67 * (1 - Math.abs(i * .38) / 3.07);
            box(exterior, 'gable-board-joint', '#d0c4a8', x + (x > 0 ? .151 : -.01), 4.26 + h / 2, z, .012, h, .018);
        }
    }
    const roof = group('pitched-standing-seam-roof', exterior);
    const halfSpan = 3.46, rise = 1.88, length = Math.hypot(halfSpan, rise), angle = Math.atan2(rise, halfSpan);
    for (const side of [-1, 1]) {
        const panel = group('roof-slope', roof); panel.position.set(0, 5.01, .70 + side * halfSpan / 2); panel.rotation.x = side * angle;
        box(panel, 'teal-metal-roof', roofMat, 0, 0, 0, 9.02 + extraWidth, .12, length);
        const seamCount = Math.ceil((8.82 + extraWidth) / .49);
        for (let i = 0; i <= seamCount; i++) box(panel, 'raised-roof-seam', seamMat, -(8.82 + extraWidth) / 2 + i * (8.82 + extraWidth) / seamCount, .084, 0, .035, .055, length + .04);
        for (const x of [-4.50 - extraWidth / 2, 4.50 + extraWidth / 2]) box(panel, 'roof-edge-timber', oak, x, -.03, 0, .13, .22, length + .12);
        box(panel, 'eave-fascia', trim, 0, -.065, side * length / 2, 9.09 + extraWidth, .19, .12);
    }
    box(roof, 'roof-ridge-cap', seamMat, 0, 5.99, .70, 9.15 + extraWidth, .15, .18);
    // A small chimney and its flashing interrupt the roof without turning it into a display platform.
    box(roof, 'chimney-flashing', '#62766c', -2.50, 5.71, .12, .88, .12, .77);
    box(roof, 'cream-brick-chimney', '#c5b799', -2.50, 6.20, .12, .62, 1.10, .54);
    for (const y of [5.83, 6.10, 6.37]) box(roof, 'chimney-brick-course', '#e1d1b2', -2.50, y, .405, .64, .023, .014);
    box(roof, 'chimney-cap', '#747b68', -2.50, 6.79, .12, .83, .14, .73);
    // All four facades share the same wider footprint; the back wall has no windows.
    const back = group('back-facade');
    box(back, 'back-plaster-wall', '#d1c5ae', 0, 2.13, -2.26, CABIN.width, 4.26, .18);
    box(back, 'back-baseboard', oak, 0, .16, -2.14, CABIN.width - .15, .23, .09);
    box(back, 'back-wall-timber-cap', oak, 0, 4.28, -2.26, CABIN.width + .11, .13, .28);
    const left = group('left-facade');
    const leftWindow = CABIN_WINDOWS.find(w => w.wall === 'left');
    const { x: wx, z: wz, width: windowWidth, sill, height: windowHeight } = leftWindow;
    box(left, 'left-wall-below-window', '#d8cbb2', wx, sill / 2, .70, .18, sill, 6.1);
    box(left, 'left-wall-above-window', '#d8cbb2', wx, (sill + windowHeight + 4.26) / 2, .70, .18, 4.26 - sill - windowHeight, 6.1);
    const backEnd = .70 - 6.1 / 2, frontEnd = .70 + 6.1 / 2, windowBack = wz - windowWidth / 2, windowFront = wz + windowWidth / 2;
    box(left, 'left-wall-back-pier', '#d8cbb2', wx, sill + windowHeight / 2, (backEnd + windowBack) / 2, .18, windowHeight, windowBack - backEnd);
    box(left, 'left-wall-front-pier', '#d8cbb2', wx, sill + windowHeight / 2, (windowFront + frontEnd) / 2, .18, windowHeight, frontEnd - windowFront);
    box(left, 'left-baseboard', oak, -CABIN.sideX + .12, .16, .70, .09, .23, 6.0);
    box(left, 'left-wall-timber-cap', oak, -CABIN.sideX, 4.28, .70, .28, .13, 6.16);
    const walls = { front, right, back, left };
    for (const [id, wall] of Object.entries(walls)) wall.userData.wallId = id;
    // Each window follows its physical wall, preserving the same position in both views.
    const windows = group('shared-cabin-windows');
    for (const opening of CABIN_WINDOWS) {
        const window = group(`window-${opening.id}`, windows);
        window.position.set(opening.x, opening.sill, opening.z); window.rotation.y = opening.yaw;
        window.userData.windowId = opening.id; window.userData.wallId = opening.wall;
        const { width: w, height: h } = opening;
        const pane = mesh(window, 'window-glass', new T.PlaneGeometry(w - .09, h - .09), glassMat, 0, h / 2, 0);
        pane.castShadow = false;
        for (const x of [-w / 2, 0, w / 2]) box(window, 'window-upright', oak, x, h / 2, 0, .075, h + .08, .25);
        for (const y of [0, h / 2, h]) box(window, 'window-horizontal', oak, 0, y, 0, w + .15, .075, .25);
        box(window, 'window-sill', paleOak, 0, -.04, 0, w + .24, .10, .36);
    }
    // Low cut edges preserve all four boundaries while near walls are hidden.
    const wallTrace = group('cutaway-wall-footprint');
    const traces = Object.fromEntries(Object.keys(walls).map(id => [id, group(`${id}-cut-edge`, wallTrace)]));
    for (const [left, right] of [[-halfWidth, CABIN_DOOR.left], [CABIN_DOOR.right, halfWidth]]) box(traces.front, 'front-wall-footprint', plaster, (left + right) / 2, .10, 3.74, right - left, .20, .18);
    box(traces.right, 'right-wall-footprint', plaster, CABIN.sideX, .10, .70, .18, .20, 6.1);
    box(traces.back, 'back-wall-footprint', plaster, 0, .10, -2.26, CABIN.width, .20, .18);
    box(traces.left, 'left-wall-footprint', plaster, -CABIN.sideX, .10, .70, .18, .20, 6.1);
    wallTrace.visible = false;
    return createExteriorCutaway({ exterior, walls, windows, wallTrace, traces });
}

export function createExteriorCutaway({ exterior, walls, windows, wallTrace, traces }) {
    let indoors = false, initializeCutaway = true;
    const outward = { front: [0, 1], right: [1, 0], back: [0, -1], left: [-1, 0] };
    const pendingSince = Object.fromEntries(Object.keys(walls).map(id => [id, null]));
    // A 22-degree dead band plus a short dwell prevents jitter at a wall's edge.
    // Entering the room initializes immediately so the front never blocks the view.
    function updateCutaway(camera, now = performance.now()) {
        const dx = camera.position.x, dz = camera.position.z - .70, length = Math.hypot(dx, dz) || 1;
        let pending = false;
        for (const [id, wall] of Object.entries(walls)) {
            const [nx, nz] = outward[id];
            const facing = (dx * nx + dz * nz) / length;
            if (!indoors || initializeCutaway) {
                wall.visible = !indoors || facing <= .16;
                pendingSince[id] = null;
            } else {
                const shouldChange = wall.visible ? facing > .32 : facing < -.06;
                if (!shouldChange) pendingSince[id] = null;
                else {
                    pendingSince[id] ??= now;
                    if (now - pendingSince[id] >= 180) {
                        wall.visible = !wall.visible;
                        pendingSince[id] = null;
                    } else pending = true;
                }
            }
            traces[id].visible = indoors && !wall.visible;
        }
        initializeCutaway = false;
        for (const window of windows.children) window.visible = walls[window.userData.wallId].visible;
        return pending;
    }
    return {
        setInterior(value) {
            indoors = value; exterior.visible = !indoors; wallTrace.visible = indoors;
            initializeCutaway = true;
            Object.keys(pendingSince).forEach(id => { pendingSince[id] = null; });
            if (!indoors) {
                Object.values(walls).forEach(wall => { wall.visible = true; });
                windows.children.forEach(window => { window.visible = true; });
            }
        },
        updateCutaway, walls, root: exterior, windows,
    };
}
