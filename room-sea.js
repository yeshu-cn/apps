import * as T from 'three';
import { DOCK, FERRY_STOPS, coastPoint } from './island-layout.js?v=ferry-20260923';

// The ferry controller owns horizontal travel; sea details add the water motion.
export function createSeaDetails(root, wood) {
    const seaLevel = -1.075;
    const boat = new T.Group(); boat.name = 'moored-little-boat';
    boat.userData.ferry = true;
    boat.position.set(DOCK.x + 2.0, seaLevel + .03, DOCK.end - .9);
    boat.rotation.y = -.13; root.add(boat);
    const paint = new T.MeshStandardMaterial({ color: '#dce5d5', roughness: .72, side: T.DoubleSide });
    const trim = new T.MeshStandardMaterial({ color: '#a65d42', roughness: .85 });
    const add = (name, geometry, material, parent = boat) => {
        const mesh = new T.Mesh(geometry, material); mesh.name = name;
        mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
    };
    // Broad stern, a hollow cockpit and a tapered bow with a raised gunwale.
    const outline = [[-.49, 1.23], [-.68, .69], [-.66, -.28], [-.43, -1.13], [0, -1.66], [.43, -1.13], [.66, -.28], [.68, .69], [.49, 1.23]];
    const hullPositions = [], hullIndices = [];
    for (const [x, z] of outline) hullPositions.push(x * .64, -.15, z * .86, x, .38 + Math.max(0, -z - .8) * .18, z);
    for (let i = 0; i < outline.length; i++) {
        const a = i * 2, b = ((i + 1) % outline.length) * 2;
        hullIndices.push(a, b, a + 1, a + 1, b, b + 1);
    }
    const hull = new T.BufferGeometry(); hull.setAttribute('position', new T.Float32BufferAttribute(hullPositions, 3)); hull.setIndex(hullIndices); hull.computeVertexNormals();
    add('painted-boat-hull', hull, paint);
    const floorShape = new T.Shape(outline.map(([x, z]) => new T.Vector2(x * .71, -z * .91)));
    const floor = add('wooden-boat-floor', new T.ShapeGeometry(floorShape), wood); floor.rotation.x = -Math.PI / 2; floor.position.y = .005;
    const edgePoints = outline.map(([x, z]) => new T.Vector3(x, .40 + Math.max(0, -z - .8) * .18, z)); edgePoints.push(edgePoints[0].clone());
    add('terracotta-gunwale', new T.TubeGeometry(new T.CatmullRomCurve3(edgePoints, true, 'centripetal'), 64, .046, 6, true), trim);
    for (const z of [-.61, .57]) {
        const seat = add('wooden-rowing-bench', new T.BoxGeometry(1.07, .075, .30), wood); seat.position.set(0, .31, z);
    }
    for (const side of [-1, 1]) {
        const oar = new T.Group(); oar.position.set(side * .43, .46, .18); oar.rotation.set(.04, side * .21, side * -.07); boat.add(oar);
        const shaft = add('oar-shaft', new T.CylinderGeometry(.024, .03, 2.18, 8), wood, oar); shaft.rotation.x = Math.PI / 2;
        const blade = add('oar-blade', new T.BoxGeometry(.14, .045, .46), trim, oar); blade.position.z = 1.06;
    }
    const ring = add('lifebuoy', new T.TorusGeometry(.19, .055, 8, 24), trim); ring.rotation.x = Math.PI / 2; ring.position.set(.03, .13, .93);
    const tetherGeometry = new T.BufferGeometry();
    tetherGeometry.setAttribute('position', new T.BufferAttribute(new Float32Array(25 * 3), 3));
    const tether = new T.Line(tetherGeometry, new T.LineBasicMaterial({ color: '#c4b28d' })); tether.name = 'boat-mooring-line'; root.add(tether);
    const cleat = new T.Vector3(.0, .45, -1.5), worldCleat = new T.Vector3();
    const mooring = new T.Vector3(DOCK.x + .8, -.03, 20.3);
    let sailing = false;

    const waves = [], segments = 144;
    for (let band = 0; band < 4; band++) {
        const geometry = new T.BufferGeometry();
        geometry.setAttribute('position', new T.BufferAttribute(new Float32Array((segments + 1) * 6), 3));
        const colors = [];
        for (let i = 0; i <= segments; i++) {
            const angle = i / segments * Math.PI * 2;
            const alpha = T.MathUtils.clamp(.45 + Math.sin(angle * 7 + band * 1.7) * .42 + Math.cos(angle * 19 - band) * .25, 0, 1);
            for (let side = 0; side < 2; side++) colors.push(1, 1, 1, alpha);
        }
        geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 4));
        const indices = [];
        for (let i = 0; i < segments; i++) { const k = i * 2; indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
        geometry.setIndex(indices);
        const material = new T.MeshBasicMaterial({ color: '#eef8e8', transparent: true, opacity: 0, vertexColors: true, side: T.DoubleSide, depthWrite: false });
        const mesh = new T.Mesh(geometry, material); mesh.name = `rolling-shore-foam-${band}`; mesh.frustumCulled = false; root.add(mesh);
        waves.push(mesh);
    }
    const ripple = add('boat-water-ripple', new T.RingGeometry(.88, .905, 64), new T.MeshBasicMaterial({ color: '#dbece2', transparent: true, opacity: .28, side: T.DoubleSide, depthWrite: false }), root);
    ripple.rotation.x = -Math.PI / 2; ripple.scale.set(1.12, 1.9, 1); ripple.position.set(boat.position.x, seaLevel + .008, boat.position.z); ripple.castShadow = false;
    function update(time, reduced, weather = 'sunny', daylight = 1) {
        const t = reduced ? 0 : time, strength = weather === 'rainy' ? 1.5 : 1;
        boat.position.y = seaLevel + .03 + Math.sin(t * 1.4) * .055 * strength;
        boat.rotation.z = Math.sin(t * 1.05) * .026 * strength;
        boat.rotation.x = Math.sin(t * .85 + .8) * .02 * strength;
        ripple.position.set(boat.position.x, seaLevel + .008, boat.position.z); ripple.rotation.z = -boat.rotation.y;
        ripple.scale.set(1.12, sailing ? 2.65 : 1.9, 1);
        boat.updateMatrixWorld(); worldCleat.copy(cleat).applyMatrix4(boat.matrixWorld);
        const tetherPositions = tetherGeometry.attributes.position;
        for (let i = 0; i <= 24; i++) {
            const u = i / 24;
            tetherPositions.setXYZ(i, T.MathUtils.lerp(mooring.x, worldCleat.x, u), T.MathUtils.lerp(mooring.y, worldCleat.y, u) - Math.sin(u * Math.PI) * .15, T.MathUtils.lerp(mooring.z, worldCleat.z, u));
        }
        tetherPositions.needsUpdate = true; tetherGeometry.computeBoundingSphere();
        waves.forEach((wave, band) => {
            const phase = (t * .10 + band / waves.length) % 1;
            const radius = 1.09 - phase * .097;
            const pos = wave.geometry.attributes.position;
            for (let i = 0; i <= segments; i++) {
                const angle = i / segments * Math.PI * 2;
                const offset = Math.sin(angle * 15 + t * .45) * .0015;
                const width = (.0018 + Math.sin(phase * Math.PI) * .003) * (1 + .36 * Math.sin(angle * 23 + band));
                for (let side = 0; side < 2; side++) {
                    const p = coastPoint(angle, radius + offset + side * width);
                    pos.setXYZ(i * 2 + side, p.x, seaLevel + .027 + band * .002, p.z);
                }
            }
            pos.needsUpdate = true;
            wave.material.opacity = Math.pow(Math.sin(phase * Math.PI), 1.3) * .56 * (.30 + daylight * .70);
        });
        ripple.material.opacity = (.20 + Math.sin(t * 1.1) * .07) * (.3 + daylight * .7);
    }
    update(0, true);
    return {
        update, boat,
        setMooring(stop) {
            sailing = !stop; tether.visible = Boolean(stop);
            if (stop) { const [x, z] = FERRY_STOPS[stop].mooring; mooring.set(x, -.03, z); }
        },
    };
}
