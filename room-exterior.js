import * as T from 'three';

// The exterior is one removable shell. Interior furniture keeps its own world coordinates.
export function buildExterior({ group, mesh, box, cylinder, oak, paleOak }) {
    const exterior = group('complete-cabin-exterior');
    const plaster = '#e5d9bc', trim = '#ecdfc3';
    const roofMat = new T.MeshStandardMaterial({ color: '#4c7e78', roughness: .78 });
    const seamMat = new T.MeshStandardMaterial({ color: '#67928a', roughness: .8 });
    const glassMat = new T.MeshStandardMaterial({ color: '#b4cfbb', emissive: '#f3c27b', emissiveIntensity: .23, roughness: .3 });
    // Front wall sections leave real openings for the windows and the walk-through door.
    const front = group('front-facade', exterior); front.position.z = 3.74;
    const openings = [
        { left: -3.40, right: -1.02, sill: 1.17, top: 3.04 },
        { left: .025, right: 1.375, sill: 0, top: 2.75, door: true },
        { left: 2.02, right: 3.56, sill: 1.30, top: 2.95 },
    ];
    let edge = -4.175;
    for (const opening of openings) {
        const { left, right, sill, top, door } = opening, x = (left + right) / 2, w = right - left;
        box(front, 'front-wall-pier', plaster, (edge + left) / 2, 2.13, 0, left - edge, 4.26, .18);
        if (sill) box(front, 'wall-below-window', plaster, x, sill / 2, 0, w, sill, .18);
        box(front, 'wall-above-opening', plaster, x, (top + 4.26) / 2, 0, w, 4.26 - top, .18);
        for (const side of [left, right]) box(front, 'opening-timber-upright', oak, side, (sill + top) / 2, .105, .11, top - sill + .13, .14);
        box(front, 'opening-timber-lintel', oak, x, top, .105, w + .20, .12, .14);
        if (!door) {
            box(front, 'warm-window-glass', glassMat, x, (sill + top) / 2, .008, w - .08, top - sill - .10, .028);
            box(front, 'window-deep-sill', paleOak, x, sill, .18, w + .26, .12, .36);
            box(front, 'window-mullion', oak, x, (sill + top) / 2, .075, .065, top - sill, .09);
            box(front, 'window-crossbar', oak, x, (sill + top) / 2, .08, w, .062, .08);
            for (const side of [-1, 1]) {
                const shutterX = x + side * (w / 2 + .30);
                box(front, 'sage-window-shutter', '#899d7c', shutterX, (sill + top) / 2, .12, .42, top - sill, .075);
                for (let i = 0; i < 8; i++) box(front, 'shutter-slat', '#a6b18a', shutterX, sill + .12 + i * (top - sill - .20) / 8, .166, .37, .035, .032);
            }
        }
        edge = right;
    }
    box(front, 'front-corner-pier', plaster, (edge + 4.175) / 2, 2.13, 0, 4.175 - edge, 4.26, .18);
    box(front, 'front-timber-eave', oak, 0, 4.20, .12, 8.50, .17, .22);
    for (const x of [-4.09, 4.09]) box(front, 'front-corner-post', oak, x, 2.15, .12, .15, 4.30, .18);
    // An open leaf sits against the inside right wall of the doorway, clear of the walking path.
    const door = group('open-cottage-door', exterior); door.position.set(1.375, 0, 3.66); door.rotation.y = -Math.PI / 2;
    box(door, 'door-leaf', '#93a48a', -.635, 1.34, 0, 1.27, 2.62, .075);
    box(door, 'door-inset-panel', '#aab597', -.635, .70, -.043, 1.02, .96, .025);
    box(door, 'door-window', glassMat, -.635, 1.89, -.047, .89, .83, .02);
    cylinder(door, 'brass-door-handle', '#b69355', -1.09, 1.16, -.088, .042, .042, .11).rotation.x = Math.PI / 2;
    const lantern = group('entry-lantern', front); lantern.position.set(1.72, 2.85, .28);
    box(lantern, 'lantern-glow', new T.MeshStandardMaterial({ color: '#ffe0a0', emissive: '#ffc779', emissiveIntensity: .9 }), 0, 0, 0, .17, .26, .17);
    for (const y of [-.17, .17]) box(lantern, 'lantern-cap', '#576653', 0, y, 0, .24, .06, .24);

    // Right wall has a genuine window recess; the gable above it gives the house its silhouette.
    const right = group('right-facade', exterior); right.position.set(4.10, 0, .70); right.rotation.y = Math.PI / 2;
    box(right, 'right-wall-below-window', plaster, 0, .64, 0, 6.1, 1.28, .18);
    box(right, 'right-wall-above-window', plaster, 0, 3.80, 0, 6.1, .92, .18);
    for (const x of [-2.10, 2.10]) box(right, 'right-wall-pier', plaster, x, 2.31, 0, 1.90, 2.06, .18);
    box(right, 'right-window-pane', glassMat, 0, 2.31, .045, 2.30, 2.06, .025);
    for (const x of [-1.15, 0, 1.15]) box(right, 'right-window-upright', oak, x, 2.31, .115, .09, 2.17, .13);
    for (const y of [1.28, 2.31, 3.34]) box(right, 'right-window-horizontal', oak, 0, y, .115, 2.45, .09, .13);
    box(right, 'right-window-sill', paleOak, 0, 1.25, .17, 2.55, .13, .36);
    for (const x of [-3.0, 3.0]) box(right, 'right-corner-post', oak, x, 2.13, .1, .15, 4.26, .17);
    for (const x of [-4.10, 4.10]) {
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
        box(panel, 'teal-metal-roof', roofMat, 0, 0, 0, 9.02, .12, length);
        for (let i = 0; i < 19; i++) box(panel, 'raised-roof-seam', seamMat, -4.41 + i * .49, .084, 0, .035, .055, length + .04);
        for (const x of [-4.50, 4.50]) box(panel, 'roof-edge-timber', oak, x, -.03, 0, .13, .22, length + .12);
        box(panel, 'eave-fascia', trim, 0, -.065, side * length / 2, 9.09, .19, .12);
    }
    box(roof, 'roof-ridge-cap', seamMat, 0, 5.99, .70, 9.15, .15, .18);
    // A small chimney and its flashing interrupt the roof without turning it into a display platform.
    box(roof, 'chimney-flashing', '#62766c', -2.50, 5.71, .12, .88, .12, .77);
    box(roof, 'cream-brick-chimney', '#c5b799', -2.50, 6.20, .12, .62, 1.10, .54);
    for (const y of [5.83, 6.10, 6.37]) box(roof, 'chimney-brick-course', '#e1d1b2', -2.50, y, .405, .64, .023, .014);
    box(roof, 'chimney-cap', '#747b68', -2.50, 6.79, .12, .83, .14, .73);
    return { setInterior(indoors) { exterior.visible = !indoors; }, root: exterior };
}
