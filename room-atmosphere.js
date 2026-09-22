import * as T from 'three';

const v = (x, y, z) => new T.Vector3(x, y, z);

// Tactile materials and working luminaires belong to the room, not to its HTML UI.
export function makeAtmosphere({ root, group, mesh, box, rounded, cylinder, beam, mat, oak, paleOak, textures }) {
    function fabric(color, repeats = 3) {
        const map = textures.linen.clone(); map.wrapS = map.wrapT = T.RepeatWrapping; map.repeat.set(repeats, repeats);
        return new T.MeshStandardMaterial({ color, map, bumpMap: map, bumpScale: .014, roughness: 1, side: T.DoubleSide });
    }
    const cream = fabric('#dfd4b6'), terra = fabric('#b88768', 5), sage = fabric('#7d8770');
    const brass = mat('#8d7351', .42, .55);
    const lit = new T.MeshStandardMaterial({ color: '#ffddb0', emissive: '#ffbd68', emissiveIntensity: 1.8, roughness: .8 });
    const pendant = group('paper-pendant'); pendant.position.set(-.55, 3.69, .30);
    beam(pendant, 'pendant-cord', '#615443', v(0, .37, 0), v(0, .59, 0), .010);
    const paper = new T.MeshStandardMaterial({ color: '#efdbb5', map: textures.linen, emissive: '#ffce88', emissiveIntensity: .48, roughness: 1 });
    const lantern = mesh(pendant, 'glowing-paper-lantern', new T.SphereGeometry(1, 48, 32), paper); lantern.scale.set(.43, .35, .43); lantern.castShadow = false;
    for (let i = 1; i < 12; i++) {
        const theta = i / 12 * Math.PI, y = Math.cos(theta) * .351, radius = Math.sin(theta) * .431;
        const rib = mesh(pendant, 'lantern-bamboo-rib', new T.TorusGeometry(radius, .0035, 4, 48), '#bca984', 0, y, 0); rib.rotation.x = Math.PI / 2;
    }
    const pendantLight = new T.PointLight('#ffe1b6', 4, 6, 2); pendantLight.position.set(-.55, 3.30, .30); root.add(pendantLight);
    const curtains = group('linen-curtains');
    beam(curtains, 'curtain-rail', brass, v(-3.76, 3.86, -1.57), v(-3.76, 3.86, 1.49), .031);
    for (const side of [-1, 1]) {
        const geometry = new T.PlaneGeometry(.65, 3.10, 32, 32);
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const u = positions.getX(i), y = positions.getY(i);
            const gather = .8 + .2 * Math.cos((y + .5) * 1.1);
            positions.setXYZ(i, u * gather + side * .11 * Math.cos(y * .9), y, Math.sin(u * 37) * .055 + .035 * Math.cos(y * 2));
        }
        geometry.computeVertexNormals();
        const curtain = mesh(curtains, 'soft-gathered-curtain', geometry, cream, -3.72, 2.23, -.05 + side * 1.20);
        curtain.rotation.y = Math.PI / 2;
        for (let i = 0; i < 6; i++) {
            const ring = mesh(curtains, 'curtain-ring', new T.TorusGeometry(.044, .01, 6, 14), brass, -3.76, 3.81, -.05 + side * 1.20 - .27 + i * .10); ring.rotation.y = Math.PI / 2;
        }
    }

    // A broad woven rug and narrow stitched border soften the continuous floor.
    const rug = rounded(root, 'woven-rust-rug', terra, -.1, .066, 1.90, 4.25, 2.9, .025, .18); rug.rotation.x = -Math.PI / 2;
    for (const z of [.52, 3.28]) box(root, 'rug-cream-border', cream, -.1, .087, z, 3.91, .012, .045);
    for (const x of [-2.10, 1.90]) box(root, 'rug-cream-border', cream, x, .087, 1.90, .045, .012, 2.80);
    for (let i = 0; i < 50; i++) for (const z of [.39, 3.41]) box(root, 'rug-tassel', '#c4a47e', -2.08 + i * .08, .07, z, .020, .014, .15);

    const seat = group('reading-armchair'); seat.position.set(-3.04, 0, 2.31); seat.rotation.y = .53;
    for (const x of [-.49, .49]) for (const z of [-.40, .40]) cylinder(seat, 'armchair-leg', oak, x, .22, z, .045, .037, .36);
    rounded(seat, 'upholstered-base', sage, 0, .43, 0, 1.18, .24, 1.02, .1);
    rounded(seat, 'seat-cushion', cream, 0, .61, .045, 1.02, .24, .86, .10);
    rounded(seat, 'curved-chair-back', sage, 0, .96, -.40, 1.22, .91, .23, .20).rotation.x = -.10;
    for (const x of [-.57, .57]) rounded(seat, 'soft-armrest', sage, x, .77, 0, .17, .27, .96, .08);
    const pillow = rounded(seat, 'cushion', fabric('#b9916b'), -.17, 1.04, -.20, .60, .50, .20, .12); pillow.rotation.set(-.22, .12, -.14);
    const throwGeometry = new T.PlaneGeometry(.47, 1.15, 16, 28);
    const pos = throwGeometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), u = (pos.getY(i) + .575) / 1.15;
        pos.setXYZ(i, x + .38, .83 - .68 * Math.max(0, u - .4), -.28 + Math.min(u * 1.1, .70) + Math.sin(x * 31) * .021);
    }
    throwGeometry.computeVertexNormals(); mesh(seat, 'draped-linen-throw', throwGeometry, fabric('#d5b887'));

    const lamp = group('warm-reading-lamp'); lamp.position.set(-3.04, 0, 1.26);
    cylinder(lamp, 'lamp-weighted-foot', brass, 0, .09, 0, .25, .29, .07);
    cylinder(lamp, 'lamp-stem', brass, 0, 1.17, 0, .025, .030, 2.15);
    const shadeMaterial = new T.MeshStandardMaterial({ color: '#e7cb98', map: textures.linen, emissive: '#ffc478', emissiveIntensity: .36, roughness: 1, side: T.DoubleSide });
    const shade = mesh(lamp, 'linen-lampshade', new T.CylinderGeometry(.23, .46, .54, 48, 1, true), shadeMaterial, 0, 2.24, 0); shade.castShadow = false;
    mesh(lamp, 'warm-bulb', new T.SphereGeometry(.065, 12, 8), lit, 0, 2.13, 0).castShadow = false;
    for (const [y, radius] of [[1.97, .46], [2.51, .23]]) { const rim = mesh(lamp, 'shade-edge', new T.TorusGeometry(radius, .012, 6, 48), '#cfb17c', 0, y, 0); rim.rotation.x = Math.PI / 2; }
    const lampLight = new T.PointLight('#ffca8e', 8, 6, 2); lampLight.position.set(-3.04, 2.05, 1.26); root.add(lampLight);

    const taskLamp = group('desk-task-lamp'); taskLamp.position.set(-.40, 1.19, -1.11);
    cylinder(taskLamp, 'lamp-base', '#7b8470', 0, .026, 0, .13, .16, .05);
    beam(taskLamp, 'lamp-lower-arm', brass, v(0, .04, 0), v(.02, .48, -.05), .018);
    beam(taskLamp, 'lamp-upper-arm', brass, v(.02, .48, -.05), v(-.17, .65, .04), .018);
    const hood = mesh(taskLamp, 'task-lamp-shade', new T.ConeGeometry(.16, .19, 32, 1, true), '#707e67', -.18, .60, .06); hood.rotation.z = -.2;
    mesh(taskLamp, 'task-light-diffuser', new T.SphereGeometry(.09, 16, 8), lit, -.18, .525, .06).scale.y = .15;
    const deskLight = new T.PointLight('#ffd5a1', 2, 2.4, 2); deskLight.position.set(-.59, 1.72, -.95); root.add(deskLight);

    // Hidden warm strips bounce off the rear wall and illuminate the small app objects.
    for (const y of [2.24, 3.27]) {
        box(root, 'shelf-light-diffuser', lit, .22, y - .071, -1.75, 6.76, .013, .045).castShadow = false;
        for (const x of [-1.9, .2, 2.3]) { const glow = new T.PointLight('#ffd9b0', 1.2, 3, 2); glow.position.set(x, y - .14, -1.87); root.add(glow); }
    }

    const hanging = group('trailing-shelf-plant'); hanging.position.set(-1.12, 3.34, -1.73);
    cylinder(hanging, 'small-pot', '#b67f61', 0, .12, 0, .13, .09, .23);
    cylinder(hanging, 'soil', '#584b37', 0, .24, 0, .116, .116, .014);
    for (let strand = 0; strand < 3; strand++) {
        let previous = v(0, .22, 0);
        for (let i = 0; i < 7; i++) {
            const point = v(.10 * Math.sin(i * .9 + strand) + strand * .07, .23 - i * .087, .10 + i * .035);
            beam(hanging, 'trailing-stem', '#657149', previous, point, .009); previous = point;
            const leaf = mesh(hanging, 'heart-leaf', new T.SphereGeometry(1, 10, 7), i % 2 ? '#7e8d59' : '#677c50', point.x + (i % 2 ? .06 : -.06), point.y, point.z);
            leaf.scale.set(.10, .06, .025); leaf.rotation.z = i * .6;
        }
    }
    // Everyday books break up the evenly spaced app silhouettes without adding new destinations.
    for (let i = 0; i < 4; i++) rounded(root, 'well-used-reference-book', ['#8b7059', '#9ca58a', '#c3b39b', '#725f51'][i], 1.21 + i * .095, 3.55 + (i % 2) * .025, -1.85, .078, .41 + (i % 2) * .05, .27, .015).rotation.z = -.09;
    const smallVase = group('ceramic-vase'); smallVase.position.set(-3.05, 3.34, -1.80);
    mesh(smallVase, 'stoneware-vase', new T.SphereGeometry(.15, 20, 16), '#b29277', 0, .16, 0).scale.y = 1.18;
    cylinder(smallVase, 'vase-neck', '#b29277', 0, .33, 0, .067, .080, .13);
    for (let i = 0; i < 3; i++) beam(smallVase, 'dried-grass', '#a58b5d', v(0, .37, 0), v(-.10 + i * .07, .66 + i * .07, .025), .007);
}
