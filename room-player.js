import RAPIER from './assets/vendor/rapier/rapier.mjs';
import { coastPoint, islandTerrain, ISLAND, FOOTBALL_ISLAND, DOCK, FOOTBALL_DOCK, FOOTBALL_PALMS, PALMS, ROCKS } from './island-layout.js?v=ferry-20260923';

import { CABIN, CABIN_DOOR, BED, BOOKCASE, ENTRY_POTS, INDOOR_PROPS, DESK, WORKBENCH } from './room-layout.js?v=room-clear-20260923';

let initialization;
export async function createPlayer() {
    await (initialization ||= RAPIER.init());
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    for (const island of [ISLAND, FOOTBALL_ISLAND]) {
        const terrain = islandTerrain(island);
        world.createCollider(RAPIER.ColliderDesc.trimesh(terrain.positions, terrain.indices));
    }
    function box(name, x, y, z, w, h, d, yaw = 0) {
        const collider = world.createCollider(RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setTranslation(x, y, z).setRotation({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) }));
        collider.userData = { name }; return collider;
    }
    function cylinder(name, x, z, radius, height) {
        const collider = world.createCollider(RAPIER.ColliderDesc.cylinder(height / 2, radius).setTranslation(x, -.285 + height / 2, z));
        collider.userData = { name };
    }
    // One closed shell with a real 1.35-unit doorway, independent of roof visibility.
    box('room-floor', 0, -.1065, CABIN.centerZ, CABIN.width, .307, CABIN.depth);
    box('back-wall', 0, CABIN.height / 2, CABIN.backZ, CABIN.width, CABIN.height, CABIN.wallThickness);
    for (const x of [-CABIN.sideX, CABIN.sideX]) box('side-wall', x, CABIN.height / 2, CABIN.centerZ, CABIN.wallThickness, CABIN.height, CABIN.depth);
    for (const [name, left, right] of [['front-left-wall', -CABIN.width / 2, CABIN_DOOR.left], ['front-right-wall', CABIN_DOOR.right, CABIN.width / 2]]) {
        box(name, (left + right) / 2, CABIN.height / 2, CABIN.frontZ, right - left, CABIN.height, CABIN.wallThickness);
    }
    box('door-lintel', .7, 3.505, 3.74, 1.35, 1.51, .18);
    box('open-door-leaf', 1.375, 1.34, 3.025, .075, 2.62, 1.27);
    for (let i = 0; i < 3; i++) box('entry-step', .7, -.08 - i * .10, 3.85 + i * .23, 1.6, .13, .34);
    box('desk', DESK.x, DESK.height / 2, DESK.z, DESK.width, DESK.height, DESK.depth);
    box('workbench', WORKBENCH.x, WORKBENCH.height / 2, WORKBENCH.z, WORKBENCH.width, WORKBENCH.height, WORKBENCH.depth, WORKBENCH.yaw);
    cylinder('desk-chair', INDOOR_PROPS.chair.x, INDOOR_PROPS.chair.z, .43, 1.31);
    cylinder('floor-plant', INDOOR_PROPS.plant.x, INDOOR_PROPS.plant.z, .32, 1.25);
    cylinder('floor-lamp', INDOOR_PROPS.lamp.x, INDOOR_PROPS.lamp.z, .27, 2.6);
    box('back-bookcase', BOOKCASE.x, BOOKCASE.bottom + BOOKCASE.height / 2, BOOKCASE.z, BOOKCASE.width, BOOKCASE.height, BOOKCASE.depth, BOOKCASE.yaw);
    box('single-bed', BED.x, BED.height / 2, BED.z, BED.width, BED.height, BED.length, BED.yaw);
    const headOffset = -BED.length / 2 + .035;
    box('bed-headboard', BED.x + Math.sin(BED.yaw) * headOffset, BED.headHeight / 2, BED.z + Math.cos(BED.yaw) * headOffset, BED.width, BED.headHeight, .10, BED.yaw);
    for (const [x, z] of ENTRY_POTS) cylinder('clay-pot', x, z, .29, .6);
    box('garden-bench', 17.5, .32, 8.8, 2.0, 1.2, .8, -.42);
    cylinder('garden-table', 16.745, 9.755, .46, .52);
    box('hammock', -4.25, .35, 9.15, 3.6, 1.25, 1.0, -.24);
    PALMS.forEach(([x, z]) => cylinder('palm-trunk', x, z, .27, 6));
    ROCKS.forEach(([x, z, size]) => box('rock', x, -.30 + size * .26, z, size * 2.5, size * 1.5, size * 1.8));
    FOOTBALL_PALMS.forEach(([x, z]) => cylinder('football-palm-trunk', x, z, .27, 6));
    for (const x of [37, 43]) box('football-bench', x, .02, -31.14, 2.5, .6, .48);
    box('football-pitch', 40, -.276, -23, 23, .056, 14.375);
    for (const side of [-1, 1]) {
        const x = 40 + side * 10.78125;
        for (const z of [-24.35, -21.65]) cylinder('goalpost', x, z, .075, 1.75);
        box('goal-net-back', x + side * .93, .4, -23, .08, 1.45, 2.7);
        for (const z of [-24.35, -21.65]) box('goal-net-side', x + side * .465, .4, z, .93, 1.45, .08);
    }
    // Both shores remain closed to walking, with a narrow opening onto each pier.
    for (const [island, dock] of [[ISLAND, DOCK], [FOOTBALL_ISLAND, FOOTBALL_DOCK]]) {
      const left = dock.x - .88, right = dock.x + .88;
      for (let i = 0; i < 128; i++) {
        const a = coastPoint(i / 128 * Math.PI * 2, .956, island), b = coastPoint((i + 1) / 128 * Math.PI * 2, .956, island);
        const cuts = [0, 1];
        if (Math.min(a.z, b.z) > dock.start && Math.abs(b.x - a.x) > .0001) {
            for (const edge of [left, right]) { const t = (edge - a.x) / (b.x - a.x); if (t > 0 && t < 1) cuts.push(t); }
        }
        cuts.sort((x, y) => x - y);
        for (let j = 0; j < cuts.length - 1; j++) {
            const t0 = cuts[j], t1 = cuts[j + 1], mid = (t0 + t1) / 2;
            const x = a.x + (b.x - a.x) * mid, z = a.z + (b.z - a.z) * mid;
            if (x > left && x < right && z > dock.start) continue;
            box('shore-boundary', x, .5, z, Math.hypot(b.x - a.x, b.z - a.z) * (t1 - t0) + .08, 4, .20, -Math.atan2(b.z - a.z, b.x - a.x));
        }
      }
      box('dock-floor', dock.x, -.30, (dock.start + dock.end) / 2, dock.width, .085, dock.end - dock.start + .23);
      for (const x of [left, right]) box('dock-edge', x, .60, (dock.start + dock.end) / 2, .12, 2, dock.end - dock.start + .25);
      box('dock-end', dock.x, .60, dock.end + .12, 1.9, 2, .12);
    }

    const halfHeight = .74;
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(3.5, halfHeight - .25, 5.6));
    const collider = world.createCollider(RAPIER.ColliderDesc.capsule(.50, .24), body);
    const controller = world.createCharacterController(.012);
    controller.enableAutostep(.18, .10, false); controller.enableSnapToGround(.3);
    controller.setMaxSlopeClimbAngle(Math.PI / 4); controller.setMinSlopeSlideAngle(Math.PI / 3);
    world.step();
    const state = { x: 3.5, y: -.25, z: 5.6, dx: 0, dz: 0, moving: false, indoors: false, island: 'home', aboard: false };
    function sync() {
        const p = body.translation(); state.x = p.x; state.y = p.y - halfHeight; state.z = p.z;
        state.indoors = Math.abs(state.x) < CABIN.sideX - CABIN.wallThickness / 2 && state.z > CABIN.backZ + .12 && state.z < CABIN.frontZ - .17;
    }
    function place(x, y, z) {
        body.setTranslation({ x, y: y + halfHeight, z }, true);
        body.setNextKinematicTranslation(body.translation());
        sync(); state.dx = state.dz = 0; state.moving = false;
    }
    return {
        state,
        update(delta, direction) {
            if (state.aboard) return false;
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
            if (state.island !== 'home' || state.aboard) return;
            place(.7, indoors ? .10 : -.22, indoors ? 2.95 : 4.8); world.step(); sync();
        },
        ride(position, heading) { state.aboard = true; place(position.x, position.y, position.z); state.heading = heading; },
        disembark(island, dock) { state.aboard = false; state.island = island; state.heading = undefined; place(dock.x, dock.top + .045, dock.end - .9); world.step(); sync(); },
        dispose() { world.free(); },
    };
}
