import * as T from 'three';
import { BED, DESK, WORKBENCH, INDOOR_PROPS } from './room-layout.js?v=room-clear-20260923';

const v = (x, y, z) => new T.Vector3(x, y, z);

// Furniture is separate from app destinations: moving equipment never changes the app links.
export function furnishStudio({ group, mesh, box, rounded, cylinder, beam, mat, oak, paleOak, textures }) {
    const graphite = mat('#424e4d', .65, .2);
    const aluminium = mat('#a9b6b2', .45, .65);
    const bed = group('single-bed'); bed.position.set(BED.x, 0, BED.z); bed.rotation.y = BED.yaw;
    const linen = color => new T.MeshStandardMaterial({ color, map: textures.linen, bumpMap: textures.linen, bumpScale: .012, roughness: 1 });
    for (const x of [-BED.width / 2 + .13, BED.width / 2 - .13]) for (const z of [-BED.length / 2 + .16, BED.length / 2 - .16]) {
        box(bed, 'bed-oak-foot', oak, x, .20, z, .11, .31, .11);
    }
    rounded(bed, 'bed-oak-frame', oak, 0, .36, 0, BED.width, .22, BED.length, .06);
    rounded(bed, 'bed-headboard', paleOak, 0, .73, -BED.length / 2 + .035, BED.width, .90, .10, .07);
    rounded(bed, 'linen-mattress', linen('#eee6d4'), 0, .555, .025, BED.width - .11, .21, BED.length - .15, .09);
    rounded(bed, 'sage-duvet', linen('#a6b59b'), 0, .655, .34, BED.width - .06, .09, BED.length - .79, .04);
    rounded(bed, 'folded-duvet-edge', linen('#c5ceba'), 0, .699, -.59, BED.width - .08, .055, .22, .025);
    rounded(bed, 'linen-pillow', linen('#f3eddf'), 0, .70, -1.00, 1.10, .18, .49, .08);
    const throwMaterial = linen('#c8ae89');
    rounded(bed, 'sand-bed-throw', throwMaterial, 0, .72, .96, BED.width - .04, .04, .47, .018);
    rounded(bed, 'hanging-bed-throw', throwMaterial, BED.width / 2 - .018, .55, .96, .04, .36, .47, .012);

    const desk = group('computer-desk'); desk.position.set(DESK.x, 0, DESK.z);
    rounded(desk, 'oak-desktop', paleOak, 0, 1.10, 0, 3.36, .13, 1.19, .055);
    for (const x of [-1.48, 1.48]) {
        box(desk, 'desk-front-leg', '#c6c1ae', x, .55, .44, .075, 1.05, .075);
        box(desk, 'desk-back-leg', '#c6c1ae', x, .55, -.43, .075, 1.05, .075);
        box(desk, 'desk-foot', '#b3b6a6', x, .08, 0, .11, .07, 1.06);
    }
    rounded(desk, 'desk-drawer-unit', '#dcded0', -1.01, .67, -.06, .69, .75, .89, .035);
    for (const y of [.43, .68, .91]) {
        rounded(desk, 'drawer-front', '#e9e8da', -1.01, y, .401, .64, .22, .025, .018);
        box(desk, 'drawer-pull', '#9aa697', -1.01, y + .01, .427, .19, .017, .026);
    }
    const monitor = group('desktop-monitor', desk); monitor.position.set(-.11, 1.19, -.24);
    rounded(monitor, 'monitor-foot', aluminium, 0, .018, .05, .49, .035, .31, .025);
    box(monitor, 'monitor-stem', aluminium, 0, .185, -.04, .074, .34, .065);
    rounded(monitor, 'monitor-housing', graphite, 0, .51, -.025, 1.35, .78, .069, .035);
    mesh(monitor, 'wallpaper-from-existing-site', new T.PlaneGeometry(1.25, .687), new T.MeshBasicMaterial({ map: textures.desktop, color: '#ccd6d0' }), 0, .529, .027);
    box(monitor, 'monitor-chin', aluminium, 0, .151, .025, 1.30, .035, .018);
    const keyboard = group('keyboard', desk); keyboard.position.set(-.14, 1.187, .27);
    rounded(keyboard, 'keyboard-case', '#e7e8df', 0, .018, 0, .72, .035, .28, .022);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 11; col++) {
        box(keyboard, 'keycap', row === 0 && col === 0 ? '#b28260' : '#cad2c8', -.315 + col * .06, .045, -.097 + row * .057, .048, .016, .045);
    }
    box(keyboard, 'space-bar', '#b7c4b5', 0, .047, .102, .32, .016, .044);
    rounded(desk, 'mouse-pad', '#b0bbaa', .67, 1.184, .22, .34, .008, .34, .045);
    const mouse = mesh(desk, 'mouse', new T.SphereGeometry(1, 16, 10), '#eeeadd', .67, 1.222, .22); mouse.scale.set(.056, .039, .094);
    box(desk, 'mouse-scroll-wheel', '#9da79e', .67, 1.257, .19, .012, .012, .029);
    const notebook = rounded(desk, 'desk-notebook', '#799184', -1.19, 1.19, .11, .38, .043, .49, .023); notebook.rotation.y = -.12;
    beam(desk, 'notebook-pencil', '#bb8a56', v(-1.30, 1.225, -.03), v(-1.10, 1.225, .22), .013);
    cylinder(desk, 'pencil-cup', '#cab28f', 1.18, 1.28, -.29, .075, .061, .23);
    for (let i = 0; i < 3; i++) beam(desk, 'pencil-in-cup', ['#6c8674', '#bc865d', '#ddd5b6'][i], v(1.14 + i * .04, 1.28, -.29), v(1.11 + i * .07, 1.60, -.3), .012);

    const chair = group('desk-chair'); chair.position.set(INDOOR_PROPS.chair.x, 0, INDOOR_PROPS.chair.z); chair.rotation.y = 0;
    rounded(chair, 'chair-seat', '#72866f', 0, .62, 0, .72, .12, .66, .08);
    rounded(chair, 'chair-back', '#80917a', 0, .99, .29, .70, .64, .095, .085); 
    for (const x of [-.25, .25]) beam(chair, 'back-support', '#515e50', v(x, .58, .24), v(x, .87, .31), .026);
    cylinder(chair, 'chair-stem', graphite, 0, .33, 0, .045, .06, .51);
    for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2, x = Math.cos(a) * .39, z = Math.sin(a) * .39;
        beam(chair, 'chair-base-spoke', graphite, v(0, .11, 0), v(x, .065, z), .025);
        const wheel = cylinder(chair, 'chair-caster', '#3b4541', x, .048, z, .048, .048, .055); wheel.rotation.z = Math.PI / 2;
    }

    const bench = group('maker-workbench'); bench.position.set(WORKBENCH.x, 0, WORKBENCH.z); bench.rotation.y = WORKBENCH.yaw;
    rounded(bench, 'workbench-top', oak, 0, 1.00, 0, 2.88, .14, 1.62, .035);
    for (const x of [-1.28, 1.28]) for (const z of [-.64, .64]) box(bench, 'bench-leg', '#60776d', x, .5, z, .11, .98, .11);
    box(bench, 'bench-front-apron', '#718479', 0, .82, .69, 2.69, .21, .07);
    rounded(bench, 'bench-lower-shelf', paleOak, 0, .27, 0, 2.63, .075, 1.39, .02);
    for (const [i, color] of ['#b6bea6', '#c0a582'].entries()) {
        rounded(bench, 'parts-storage-box', color, -.72 + i * 1.29, .48, .12, .88, .36, .88, .035);
        rounded(bench, 'parts-box-lid', '#d7ceb8', -.72 + i * 1.29, .67, .12, .92, .043, .92, .025);
        box(bench, 'box-handle', '#758176', -.72 + i * 1.29, .50, .57, .22, .051, .033);
    }
    const printer = group('desktop-3d-printer', bench); printer.position.set(-.58, 1.079, -.15);
    rounded(printer, 'printer-base', '#b9c2b9', 0, .075, 0, .90, .15, .94, .045);
    for (const x of [-.39, .39]) {
        box(printer, 'vertical-gantry-column', graphite, x, .65, -.18, .069, 1.05, .078);
        box(printer, 'gantry-silver-rail', aluminium, x, .65, -.128, .022, 1.0, .023);
        cylinder(printer, 'rubber-printer-foot', '#4d5c55', x, -.029, .32, .055, .055, .048);
    }
    rounded(printer, 'gantry-top-beam', '#c6cec3', 0, 1.17, -.18, .95, .085, .13, .024);
    box(printer, 'moving-x-rail', aluminium, 0, .76, -.105, .83, .055, .059);
    box(printer, 'drive-belt', '#394641', 0, .721, -.054, .81, .013, .015);
    rounded(printer, 'print-head', '#485f55', .11, .755, .015, .22, .25, .19, .029);
    mesh(printer, 'print-head-fan', new T.CircleGeometry(.062, 20), graphite, .11, .795, .126);
    cylinder(printer, 'brass-nozzle', mat('#c3a86c', .4, .55), .11, .593, .012, .034, .015, .075);
    box(printer, 'y-axis-track', graphite, 0, .17, .03, .15, .055, .73);
    rounded(printer, 'print-bed', '#485751', 0, .222, .05, .74, .051, .67, .012);
    rounded(printer, 'build-plate', '#b5aa7d', 0, .255, .05, .70, .011, .64, .012);
    const vaseProfile = [[0, 0], [.075, 0], [.098, .04], [.11, .13], [.073, .20], [.063, .25]].map(([r, y]) => new T.Vector2(r, y));
    mesh(printer, 'small-printed-vase', new T.LatheGeometry(vaseProfile, 24), '#79a69a', .11, .273, .012);
    for (let i = 0; i < 9; i++) { const r = .086 + Math.sin(i / 9 * Math.PI) * .025; const layer = mesh(printer, 'visible-print-layer', new T.TorusGeometry(r, .003, 4, 24), '#69998d', .11, .30 + i * .017, .012); layer.rotation.x = Math.PI / 2; }
    const spool = group('filament-spool', printer); spool.position.set(.55, .77, -.20); spool.rotation.y = .2;
    const roll = cylinder(spool, 'filament-coil', '#80a899', 0, 0, 0, .208, .208, .13); roll.rotation.x = Math.PI / 2;
    for (const z of [-.085, .085]) mesh(spool, 'spool-flange', new T.TorusGeometry(.212, .023, 8, 32), '#46584e', 0, 0, z);
    beam(printer, 'spool-holder', aluminium, v(.38, .59, -.20), v(.61, .59, -.20), .027);
    const filamentPath = new T.CatmullRomCurve3([v(.55, .90, -.13), v(.5, 1.27, -.12), v(.10, 1.25, -.10), v(.11, .90, .02)]);
    mesh(printer, 'feed-filament', new T.TubeGeometry(filamentPath, 24, .006, 5, false), '#7c9e8d');
    const panel = rounded(printer, 'printer-control-panel', '#4e6157', .24, .134, .495, .25, .15, .028, .02); panel.rotation.x = -.30;
    const screen = box(printer, 'printer-display', new T.MeshStandardMaterial({ color: '#b7d0bb', emissive: '#7f9c85', emissiveIntensity: .23 }), .215, .146, .516, .135, .075, .008); screen.rotation.x = -.30;
    mesh(printer, 'control-knob', new T.SphereGeometry(.022, 12, 8), '#d3d6c0', .315, .14, .529);

    // Stylized DJI Avata 2: low central battery, four integrated guards, paired rotors and front camera.
    const drone = group('dji-avata-2', bench); drone.position.set(.79, 1.10, .20); drone.rotation.y = -.32;
    rounded(drone, 'avata-central-body', '#747e7b', 0, .12, 0, .29, .19, .63, .075);
    rounded(drone, 'avata-top-battery', '#969e95', 0, .23, -.015, .25, .115, .47, .05);
    rounded(drone, 'battery-latch', '#59645e', 0, .23, -.273, .14, .065, .022, .015);
    for (const x of [-.255, .255]) for (const z of [-.245, .245]) {
        const rotor = group('guarded-rotor', drone); rotor.position.set(x, .085, z);
        const guard = mesh(rotor, 'integrated-propeller-guard', new T.TorusGeometry(.237, .028, 8, 40), '#434d49'); guard.rotation.x = Math.PI / 2;
        const lowGuard = mesh(rotor, 'lower-guard-rim', new T.TorusGeometry(.227, .012, 6, 32), '#636e66', 0, -.038, 0); lowGuard.rotation.x = Math.PI / 2;
        for (let i = 0; i < 3; i++) {
            const a = i / 3 * Math.PI * 2;
            beam(rotor, 'motor-support-strut', '#5d685f', v(0, -.017, 0), v(Math.cos(a) * .229, -.026, Math.sin(a) * .229), .012);
        }
        cylinder(rotor, 'motor-hub', '#9aa69a', 0, -.003, 0, .047, .043, .068);
        const propeller = group('two-blade-propeller', rotor); propeller.rotation.y = (x + z) * 3 + .4;
        for (const sign of [-1, 1]) { const blade = mesh(propeller, 'propeller-blade', new T.SphereGeometry(1, 10, 6), '#303c37', sign * .106, .026, 0); blade.scale.set(.102, .008, .03); blade.rotation.y = sign * .18; }
    }
    rounded(drone, 'front-gimbal-housing', '#57655c', 0, .147, .356, .185, .16, .15, .032);
    mesh(drone, 'avata-front-lens', new T.CircleGeometry(.053, 24), mat('#182f33', .17, .3), 0, .148, .443);
    mesh(drone, 'lens-metal-ring', new T.TorusGeometry(.057, .01, 8, 24), '#b0b8ab', 0, .148, .444);
    for (const x of [-.086, .086]) mesh(drone, 'rear-position-sensor', new T.SphereGeometry(.020, 10, 7), '#344942', x, .13, -.32);
    for (let i = 0; i < 4; i++) box(drone, 'battery-status-light', '#b8c8a6', -.047 + i * .031, .291, -.105, .019, .006, .009);
    rounded(bench, 'small-cutting-mat', '#7c998d', .71, 1.081, .14, 1.29, .012, 1.16, .032);
    // Other small tools sit at the edges; the work surface stays legible from the default camera.
    beam(bench, 'precision-screwdriver-shaft', aluminium, v(.15, 1.105, .59), v(.56, 1.105, .59), .014);
    beam(bench, 'precision-screwdriver-handle', '#bd885c', v(.55, 1.105, .59), v(.78, 1.105, .59), .032);
    rounded(bench, 'closed-parts-tray', '#bfae8f', 1.13, 1.14, -.50, .36, .12, .27, .022);
    return { desk, bench, printer, drone };
}
