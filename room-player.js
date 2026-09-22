import RAPIER from './assets/vendor/rapier/rapier.mjs';
import { coastPoint, islandTerrain, DOCK, PALMS, ROCKS } from './island-layout.js';

let initialization;
export async function createPlayer() {
    await (initialization ||= RAPIER.init());
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    const terrain = islandTerrain();
    world.createCollider(RAPIER.ColliderDesc.trimesh(terrain.positions, terrain.indices));
    function box(name, x, y, z, w, h, d, yaw = 0) {
        const collider = world.createCollider(RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setTranslation(x, y, z).setRotation({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) }));
        collider.userData = { name }; return collider;
    }
    function cylinder(name, x, z, radius, height) {
        const collider = world.createCollider(RAPIER.ColliderDesc.cylinder(height / 2, radius).setTranslation(x, -.285 + height / 2, z));
        collider.userData = { name };
    }
    // One closed shell with a real 1.35-unit doorway, independent of roof visibility.
    box('room-floor', 0, -.1065, .70, 8.35, .307, 6.1);
    box('back-wall', 0, 2.13, -2.26, 8.35, 4.26, .18);
    for (const x of [-4.10, 4.10]) box('side-wall', x, 2.13, .7, .18, 4.26, 6.1);
    box('front-left-wall', -2.075, 2.13, 3.74, 4.20, 4.26, .18);
    box('front-right-wall', 2.775, 2.13, 3.74, 2.80, 4.26, .18);
    box('door-lintel', .7, 3.505, 3.74, 1.35, 1.51, .18);
    box('open-door-leaf', 1.375, 1.34, 3.025, .075, 2.62, 1.27);
    for (let i = 0; i < 3; i++) box('entry-step', .7, -.08 - i * .10, 3.85 + i * .23, 1.6, .13, .34);
    box('rug', -.1, .064, 1.90, 4.25, .036, 2.9);
    box('desk', -1.63, .59, -.95, 3.36, 1.18, 1.19);
    box('workbench', 2.16, .55, -.36, 2.88, 1.10, 1.62);
    cylinder('desk-chair', -1.56, .45, .43, 1.31);
    box('reading-chair', -3.04, .68, 2.31, 1.30, 1.4, 1.1, .53);
    cylinder('low-stool', -2.24, 2.70, .33, .58);
    cylinder('floor-plant', -3.42, .8, .32, 1.25);
    cylinder('floor-lamp', -3.04, 1.26, .27, 2.6);
    box('book-stack', 3.33, .22, 1.30, .66, .44, .49);
    for (const [x, z] of [[-4.85, 3.8], [4.8, 3.5]]) cylinder('clay-pot', x, z, .29, .6);
    box('garden-bench', 17.5, .32, 8.8, 2.0, 1.2, .8, -.42);
    cylinder('garden-table', 16.745, 9.755, .46, .52);
    box('hammock', -4.25, .35, 9.15, 3.6, 1.25, 1.0, -.24);
    PALMS.forEach(([x, z]) => cylinder('palm-trunk', x, z, .27, 6));
    ROCKS.forEach(([x, z, size]) => box('rock', x, -.30 + size * .26, z, size * 2.5, size * 1.5, size * 1.8));
    // The beach edge is a closed physical boundary, with a gap aligned to the dock.
    for (let i = 0; i < 128; i++) {
        const a = coastPoint(i / 128 * Math.PI * 2, .956), b = coastPoint((i + 1) / 128 * Math.PI * 2, .956);
        const cuts = [0, 1];
        if (Math.min(a.z, b.z) > DOCK.start && Math.abs(b.x - a.x) > .0001) {
            for (const edge of [7.12, 8.88]) { const t = (edge - a.x) / (b.x - a.x); if (t > 0 && t < 1) cuts.push(t); }
        }
        cuts.sort((x, y) => x - y);
        for (let j = 0; j < cuts.length - 1; j++) {
            const t0 = cuts[j], t1 = cuts[j + 1], mid = (t0 + t1) / 2;
            const x = a.x + (b.x - a.x) * mid, z = a.z + (b.z - a.z) * mid;
            if (x > 7.12 && x < 8.88 && z > DOCK.start) continue;
            box('shore-boundary', x, .5, z, Math.hypot(b.x - a.x, b.z - a.z) * (t1 - t0) + .08, 4, .20, -Math.atan2(b.z - a.z, b.x - a.x));
        }
    }
    box('dock-floor', DOCK.x, -.30, (DOCK.start + DOCK.end) / 2, DOCK.width, .085, DOCK.end - DOCK.start + .23);
    for (const x of [7.12, 8.88]) box('dock-edge', x, .60, (DOCK.start + DOCK.end) / 2, .12, 2, DOCK.end - DOCK.start + .25);
    box('dock-end', DOCK.x, .60, DOCK.end + .12, 1.9, 2, .12);

    const halfHeight = .74;
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(3.5, halfHeight - .25, 5.6));
    const collider = world.createCollider(RAPIER.ColliderDesc.capsule(.50, .24), body);
    const controller = world.createCharacterController(.012);
    controller.enableAutostep(.18, .10, false); controller.enableSnapToGround(.3);
    controller.setMaxSlopeClimbAngle(Math.PI / 4); controller.setMinSlopeSlideAngle(Math.PI / 3);
    world.step();
    const state = { x: 3.5, y: -.25, z: 5.6, dx: 0, dz: 0, moving: false, indoors: false };
    function sync() {
        const p = body.translation(); state.x = p.x; state.y = p.y - halfHeight; state.z = p.z;
        state.indoors = state.x > -4 && state.x < 4 && state.z > -2.14 && state.z < 3.57;
    }
    return {
        state,
        update(delta, direction) {
            const dt = Math.min(delta, .05), length = Math.hypot(direction.x, direction.z), scale = Math.min(length, 1) / (length || 1);
            const speed = state.indoors ? 1.65 : 3.15;
            controller.computeColliderMovement(collider, { x: direction.x * scale * speed * dt, y: -3 * dt, z: direction.z * scale * speed * dt });
            const move = controller.computedMovement(), p = body.translation();
            body.setNextKinematicTranslation({ x: p.x + move.x, y: p.y + move.y, z: p.z + move.z });
            world.timestep = dt; world.step();
            state.dx = move.x; state.dz = move.z; state.moving = Math.hypot(move.x, move.z) > .0003;
            sync(); return state.moving || Math.abs(move.y) > .0003;
        },
        relocate(indoors) {
            body.setTranslation({ x: .7, y: halfHeight + (indoors ? .10 : -.22), z: indoors ? 2.95 : 4.8 }, true);
            body.setNextKinematicTranslation(body.translation()); world.step(); sync(); state.moving = false;
        },
        dispose() { world.free(); },
    };
}
