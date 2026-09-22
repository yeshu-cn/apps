import * as T from 'three';

export function createFallbackResident() {
    const root = new T.Group(); root.name = 'island-resident';
    const body = new T.Group(); body.name = 'walking-rig'; root.add(body);
    const materials = new Map();
    const mat = color => {
        if (!materials.has(color)) materials.set(color, new T.MeshStandardMaterial({ color, roughness: .94 }));
        return materials.get(color);
    };
    function mesh(parent, name, geometry, color, x, y, z) {
        const object = new T.Mesh(geometry, mat(color)); object.name = name; object.position.set(x, y, z); object.castShadow = object.receiveShadow = true; parent.add(object); return object;
    }
    function ellipsoid(parent, name, color, x, y, z, sx, sy, sz) {
        const object = mesh(parent, name, new T.SphereGeometry(1, 12, 8), color, x, y, z); object.scale.set(sx, sy, sz); return object;
    }
    const skin = '#d3a17b', sweater = '#c98056', trousers = '#476369';
    ellipsoid(body, 'soft-rust-sweater', sweater, 0, .86, 0, .225, .29, .15);
    ellipsoid(body, 'trouser-hips', trousers, 0, .585, 0, .185, .13, .133);
    mesh(body, 'sweater-hem', new T.CylinderGeometry(.18, .18, .052, 14), '#b87350', 0, .632, 0).scale.z = .72;
    mesh(body, 'neck', new T.CylinderGeometry(.068, .075, .12, 12), skin, 0, 1.105, 0);
    const head = new T.Group(); head.name = 'resident-head'; head.position.set(0, 1.285, .013); body.add(head);
    ellipsoid(head, 'face', skin, 0, 0, 0, .192, .205, .179);
    ellipsoid(head, 'short-hair', '#443d32', 0, .084, -.02, .202, .156, .179);
    for (const side of [-1, 1]) {
        ellipsoid(head, 'ear', skin, side * .184, -.008, 0, .036, .060, .035);
        ellipsoid(head, 'eye', '#353c35', side * .069, .014, .166, .014, .020, .009);
    }
    ellipsoid(head, 'nose', '#c89672', 0, -.036, .18, .026, .025, .025);
    mesh(head, 'sage-cap', new T.SphereGeometry(.209, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#869578', 0, .097, -.005);
    ellipsoid(head, 'cap-brim', '#75876d', 0, .10, .166, .196, .025, .145);
    const limbs = [];
    for (const side of [-1, 1]) {
        const leg = new T.Group(); leg.name = side < 0 ? 'left-leg' : 'right-leg'; leg.position.set(side * .094, .59, 0); body.add(leg);
        mesh(leg, 'trouser-leg', new T.CapsuleGeometry(.072, .33, 3, 8), trousers, 0, -.215, 0);
        ellipsoid(leg, 'cream-sneaker', '#e7dec8', 0, -.505, .045, .090, .068, .145);
        const arm = new T.Group(); arm.name = side < 0 ? 'left-arm' : 'right-arm'; arm.position.set(side * .204, 1.005, 0); body.add(arm);
        mesh(arm, 'sweater-sleeve', new T.CapsuleGeometry(.064, .24, 3, 8), sweater, side * .017, -.135, 0);
        ellipsoid(arm, 'hand', skin, side * .017, -.335, .006, .052, .073, .046);
        limbs.push({ leg, arm, side });
    }
    let gait = 0, yaw = 0, amplitude = 0;
    function pose(swing, bob) {
        body.position.y = bob;
        for (const limb of limbs) { limb.leg.rotation.x = swing * limb.side; limb.arm.rotation.x = -swing * limb.side * .72; }
    }
    return {
        root,
        update(delta, state, reduced = false) {
            root.position.set(state.x, state.y, state.z);
            if (state.moving) {
                const targetYaw = Math.atan2(state.dx, state.dz);
                yaw += Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw)) * (1 - Math.exp(-delta * 16));
                body.rotation.y = yaw;
            }
            const targetAmplitude = state.moving ? .40 : 0;
            amplitude += (targetAmplitude - amplitude) * Math.min(1, delta * 18);
            gait += Math.hypot(state.dx, state.dz) * 10;
            pose(Math.sin(gait) * amplitude, reduced ? 0 : Math.abs(Math.sin(gait)) * amplitude * .024);
            return Math.abs(amplitude - targetAmplitude) > .001;
        },
        dispose() {
            const geometries = new Set(); root.traverse(object => { if (object.geometry) geometries.add(object.geometry); });
            geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
        },
    };
}
