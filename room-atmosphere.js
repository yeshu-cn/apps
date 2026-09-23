import * as T from 'three';
import { CABIN, INDOOR_PROPS } from './room-layout.js?v=room-clear-20260923';

const v = (x, y, z) => new T.Vector3(x, y, z);

// Tactile materials and working luminaires belong to the room, not to its HTML UI.
export function makeAtmosphere({ root, group, mesh, box, rounded, cylinder, beam, mat, oak, paleOak, textures, bookcase, desk }) {
    function fabric(color, repeats = 3) {
        const map = textures.linen.clone(); map.wrapS = map.wrapT = T.RepeatWrapping; map.repeat.set(repeats, repeats);
        return new T.MeshStandardMaterial({ color, map, bumpMap: map, bumpScale: .014, roughness: 1, side: T.DoubleSide });
    }
    const cream = fabric('#dfd4b6');
    const brass = mat('#8d7351', .42, .55);
    const lit = new T.MeshStandardMaterial({ color: '#ffddb0', emissive: '#ffbd68', emissiveIntensity: 1.8, roughness: .8 });
    const curtains = group('linen-curtains');
    curtains.position.x = -CABIN.sideX + 4.10;
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

    const lamp = group('warm-reading-lamp'); lamp.position.set(INDOOR_PROPS.lamp.x, 0, INDOOR_PROPS.lamp.z);
    cylinder(lamp, 'lamp-weighted-foot', brass, 0, .09, 0, .25, .29, .07);
    cylinder(lamp, 'lamp-stem', brass, 0, 1.17, 0, .025, .030, 2.15);
    const shadeMaterial = new T.MeshStandardMaterial({ color: '#e7cb98', map: textures.linen, emissive: '#ffc478', emissiveIntensity: .36, roughness: 1, side: T.DoubleSide });
    const shade = mesh(lamp, 'linen-lampshade', new T.CylinderGeometry(.23, .46, .54, 48, 1, true), shadeMaterial, 0, 2.24, 0); shade.castShadow = false;
    mesh(lamp, 'warm-bulb', new T.SphereGeometry(.065, 12, 8), lit, 0, 2.13, 0).castShadow = false;
    for (const [y, radius] of [[1.97, .46], [2.51, .23]]) { const rim = mesh(lamp, 'shade-edge', new T.TorusGeometry(radius, .012, 6, 48), '#cfb17c', 0, y, 0); rim.rotation.x = Math.PI / 2; }
    const lampLight = new T.PointLight('#ffca8e', 8, 6, 2); lampLight.position.set(INDOOR_PROPS.lamp.x, 2.05, INDOOR_PROPS.lamp.z); root.add(lampLight);

    const taskLamp = group('desk-task-lamp', desk); taskLamp.position.set(1.23, 1.19, -.16);
    cylinder(taskLamp, 'lamp-base', '#7b8470', 0, .026, 0, .13, .16, .05);
    beam(taskLamp, 'lamp-lower-arm', brass, v(0, .04, 0), v(.02, .48, -.05), .018);
    beam(taskLamp, 'lamp-upper-arm', brass, v(.02, .48, -.05), v(-.17, .65, .04), .018);
    const hood = mesh(taskLamp, 'task-lamp-shade', new T.ConeGeometry(.16, .19, 32, 1, true), '#707e67', -.18, .60, .06); hood.rotation.z = -.2;
    mesh(taskLamp, 'task-light-diffuser', new T.SphereGeometry(.09, 16, 8), lit, -.18, .525, .06).scale.y = .15;
    const deskLight = new T.PointLight('#ffd5a1', 2, 2.4, 2); deskLight.position.set(1.04, 1.72, 0); desk.add(deskLight);

    const hanging = group('trailing-shelf-plant', bookcase); hanging.position.set(-.72, 2.36, -.06); hanging.scale.setScalar(.62);
    cylinder(hanging, 'small-pot', '#b67f61', 0, .12, 0, .13, .09, .23);
    cylinder(hanging, 'soil', '#584b37', 0, .24, 0, .116, .116, .014);
    for (let strand = 0; strand < 3; strand++) {
        let previous = v(0, .22, 0);
        for (let i = 0; i < 7; i++) {
            const point = v(.10 * Math.sin(i * .9 + strand) + strand * .07, .23 - i * .087, .02 - i * .025);
            beam(hanging, 'trailing-stem', '#657149', previous, point, .009); previous = point;
            const leaf = mesh(hanging, 'heart-leaf', new T.SphereGeometry(1, 10, 7), i % 2 ? '#7e8d59' : '#677c50', point.x + (i % 2 ? .06 : -.06), point.y, point.z);
            leaf.scale.set(.10, .06, .025); leaf.rotation.z = i * .6;
        }
    }
    const smallVase = group('ceramic-vase', desk); smallVase.position.set(-1.40, 1.18, -.35); smallVase.scale.setScalar(.70);
    mesh(smallVase, 'stoneware-vase', new T.SphereGeometry(.15, 20, 16), '#b29277', 0, .16, 0).scale.y = 1.18;
    cylinder(smallVase, 'vase-neck', '#b29277', 0, .33, 0, .067, .080, .13);
    for (let i = 0; i < 3; i++) beam(smallVase, 'dried-grass', '#a58b5d', v(0, .37, 0), v(-.10 + i * .07, .66 + i * .07, .025), .007);
}
