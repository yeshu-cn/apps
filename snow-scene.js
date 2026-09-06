const host = document.getElementById('snow-scene');
const toggle = document.querySelector('.snow-toggle');

// The inline illustration remains available if modules or WebGL cannot load.
if (host) {
    const probe = document.createElement('canvas');
    const context = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (context) {
        try {
            const THREE = await import('./assets/vendor/three/three.module.min.js');
            mountMountain(THREE, probe, context);
        } catch {
            context.getExtension('WEBGL_lose_context')?.loseContext();
            host.dataset.state = 'fallback';
            toggle.hidden = true;
        }
    }
}

function mountMountain(T, canvas, context) {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const smallScreen = matchMedia('(max-width: 600px)');
    const finePointer = matchMedia('(pointer: fine)');
    const renderer = new T.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, smallScreen.matches ? 1.25 : 1.6));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const scene = new T.Scene();
    const camera = new T.OrthographicCamera(-5.2, 5.2, 4, -4, .1, 80);
    camera.position.set(6, 5.6, 8.5);
    camera.lookAt(0, 1, 0);
    scene.add(new T.HemisphereLight(0xfffdf3, 0x778972, 1.8));
    const sunlight = new T.DirectionalLight(0xfffdf0, 2.2);
    sunlight.position.set(-4, 8, 5);
    scene.add(sunlight);
    const world = new T.Group();
    world.rotation.y = -.14;
    scene.add(world);
    const material = (color) => new T.MeshStandardMaterial({ color, roughness: 1, flatShading: true });
    const rock = material(0xb0bda6);
    const snow = new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 });
    const segments = smallScreen.matches ? 36 : 56;
    const rings = smallScreen.matches ? 18 : 25;

    function height(x, z) {
        const r = Math.min(1, Math.hypot(x / 3.7, z / 2.8));
        const peak = (cx, cz, sx, sz, h) => h * Math.exp(-(((x - cx) / sx) ** 2) - ((z - cz) / sz) ** 2);
        const ridge = peak(-1.25, -1.05, 1.05, 1.1, 3.5) + peak(1.45, -1.15, 1, 1.1, 2.5);
        const slope = peak(.2, -.1, 2.4, 2.9, 1.15);
        const edge = T.MathUtils.smoothstep(Math.abs(x), .7, 1.3);
        const valley = .35 + 1.65 * (2.8 - z) / 3.85;
        return .1 + T.MathUtils.lerp(valley, ridge + slope, edge) * (1 - r ** 3)
            + Math.sin(x * 3 + z * 2) * .035 * (1 - r) * edge;
    }

    // A single connected triangulated surface, including the skiable valley.
    const vertices = [0, height(0, 0), 0];
    const indices = [];
    for (let ring = 1; ring <= rings; ring++) {
        for (let j = 0; j < segments; j++) {
            const a = j / segments * Math.PI * 2;
            const r = ring / rings;
            const x = 3.7 * r * Math.cos(a);
            const z = 2.8 * r * Math.sin(a);
            vertices.push(x, height(x, z), z);
            const current = 1 + (ring - 1) * segments + j;
            const next = 1 + (ring - 1) * segments + (j + 1) % segments;
            if (ring === 1) indices.push(0, next, current);
            else {
                const previous = current - segments;
                const previousNext = next - segments;
                indices.push(previous, next, current, previous, previousNext, next);
            }
        }
    }
    const surface = new T.BufferGeometry();
    surface.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    surface.setIndex(indices);
    surface.computeVertexNormals();
    const colors = [];
    for (let i = 0; i < vertices.length; i += 3) {
        const y = vertices[i + 1];
        const color = new T.Color(y > 2.2 ? 0xfaf9ed : y < .2 ? 0xdbe2d2 : 0xf0f2e5);
        colors.push(color.r, color.g, color.b);
    }
    surface.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    const mountain = new T.Mesh(surface, snow);
    world.add(mountain);
    const base = new T.Mesh(new T.CylinderGeometry(1, .98, .24, segments), rock);
    base.scale.set(3.7, 1, 2.8);
    base.position.y = -.025;
    world.add(base);
    const shadow = new T.Mesh(new T.CircleGeometry(1, 48), new T.MeshBasicMaterial({ color: 0x52624b, transparent: true, opacity: .065, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(3.9, 2.95, 1);
    shadow.position.set(.12, -.16, .12);
    world.add(shadow);

    // Match the visible triangles rather than an approximate height function.
    const ray = new T.Raycaster();
    const down = new T.Vector3(0, -1, 0);
    // Sample before adding the presentation rotation to the mesh's world matrix.
    mountain.updateMatrixWorld();
    function onSnow(x, z, lift = .018) {
        ray.set(new T.Vector3(x, 10, z), down);
        return new T.Vector3(x, (ray.intersectObject(mountain)[0]?.point.y ?? height(x, z)) + lift, z);
    }

    const treePositions = [[-2.45,.6,.62],[-2.8,1.1,.45],[-2.05,1.35,.5],[-2.5,-.2,.46],[2.45,.4,.6],[2.75,.95,.47],[2,1.65,.58],[1.55,2.1,.42],[-1.1,2.1,.4],[-2.8,-.8,.4],[2.5,-.6,.44],[-1.9,1.85,.38]];
    const trees = smallScreen.matches ? treePositions.slice(0, 8) : treePositions;
    const leaves = new T.InstancedMesh(new T.ConeGeometry(1, 1, 5), material(0x52745a), trees.length * 3);
    const trunks = new T.InstancedMesh(new T.CylinderGeometry(.035, .045, 1, 5), material(0x756e54), trees.length);
    const caps = new T.InstancedMesh(new T.ConeGeometry(1, 1, 5), material(0xf4f3e7), trees.length);
    const dummy = new T.Object3D();
    trees.forEach(([x, z, size], i) => {
        const p = onSnow(x, z, 0);
        dummy.position.copy(p).y += size * .24;
        dummy.scale.set(1, size * .48, 1);
        dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
        for (let level = 0; level < 3; level++) {
            const radius = size * (.39 - level * .075);
            dummy.position.set(x, p.y + size * (.36 + level * .23), z);
            dummy.scale.set(radius, size * .65, radius);
            dummy.rotation.y = i * .77;
            dummy.updateMatrix(); leaves.setMatrixAt(i * 3 + level, dummy.matrix);
        }
        dummy.position.set(x, p.y + size * .95, z);
        dummy.scale.set(size * .12, size * .27, size * .12);
        dummy.updateMatrix(); caps.setMatrixAt(i, dummy.matrix);
    });
    world.add(leaves, trunks, caps);

    // A slow, downhill S-turn. Both ski tracks use this same sampled route.
    const steps = 360;
    const route = [];
    const trackCoordinates = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = .1 + Math.sin(t * Math.PI * 3) * (.36 + t * .2);
        const z = -1.05 + t * 3.25;
        route.push(onSnow(x, z, .035));
    }
    for (let i = 0; i < steps; i++) {
        const direction = route[i + 1].clone().sub(route[i]).normalize();
        const side = new T.Vector3(direction.z, 0, -direction.x).normalize().multiplyScalar(.044);
        for (const sign of [-1, 1]) {
            for (const p of [route[i], route[i + 1]]) {
                const point = onSnow(p.x + side.x * sign, p.z + side.z * sign, .02);
                trackCoordinates.push(point.x, point.y, point.z);
            }
        }
    }
    const trackGeometry = new T.BufferGeometry();
    trackGeometry.setAttribute('position', new T.Float32BufferAttribute(trackCoordinates, 3));
    const tracks = new T.LineSegments(trackGeometry, new T.LineBasicMaterial({ color: 0x9cae96, transparent: true, opacity: .63 }));
    world.add(tracks);

    const skier = new T.Group();
    const jacket = material(0xb57755);
    const dark = material(0x304b3a);
    const helmet = material(0xebe8d7);
    function part(geometry, mat, x, y, z) {
        const mesh = new T.Mesh(geometry, mat);
        mesh.position.set(x, y, z);
        skier.add(mesh);
        return mesh;
    }
    for (const side of [-1, 1]) {
        part(new T.BoxGeometry(.035, .018, .37), dark, side * .053, .018, .015);
        part(new T.BoxGeometry(.043, .035, .075), dark, side * .05, .043, 0);
        const leg = part(new T.CylinderGeometry(.018, .022, .12, 5), dark, side * .048, .104, -.015);
        leg.rotation.x = -.45;
        const arm = part(new T.CylinderGeometry(.013, .016, .11, 5), jacket, side * .09, .18, .045);
        arm.rotation.z = side * -.55;
        const pole = part(new T.CylinderGeometry(.004, .004, .22, 4), dark, side * .12, .105, .09);
        pole.rotation.x = -.32;
    }
    const torso = part(new T.CylinderGeometry(.043, .038, .13, 6), jacket, 0, .19, .012);
    torso.rotation.x = .24;
    part(new T.SphereGeometry(.042, 8, 6), helmet, 0, .294, .035);
    part(new T.BoxGeometry(.06, .018, .016), dark, 0, .298, .071);
    skier.scale.setScalar(1.45);
    world.add(skier);

    let progress = .43;
    let elapsed = progress * 26;
    let lastTime = 0;
    let lastFrame = 0;
    let paused = false;
    let visible = true;
    let disposed = false;
    let lost = false;
    const pointer = new T.Vector2();
    const view = new T.Vector2();
    const direction = new T.Vector3();
    const position = new T.Vector3();
    function updateSkier(t) {
        const index = Math.min(steps - 1, Math.floor(t * steps));
        const fraction = t * steps - index;
        position.lerpVectors(route[index], route[index + 1], fraction);
        direction.subVectors(route[index + 1], route[index]);
        skier.position.copy(position);
        skier.rotation.set(-Math.atan2(direction.y, Math.hypot(direction.x, direction.z)), Math.atan2(direction.x, direction.z), Math.sin(t * Math.PI * 3) * -.15, 'YXZ');
        // Fade the skier out at the valley edge and back in at the next descent.
        skier.scale.setScalar(1.45 * Math.min(1, t / .035, (1 - t) / .035));
        trackGeometry.setDrawRange(0, index * 4);
    }
    function draw() {
        world.rotation.y = -.14 + view.x * .12;
        world.rotation.x = view.y * .045;
        renderer.render(scene, camera);
    }
    function frame(time) {
        if (time - lastFrame < (smallScreen.matches ? 1000 / 30 : 1000 / 45)) return;
        const dt = lastTime ? Math.min((time - lastTime) / 1000, .08) : 0;
        lastTime = lastFrame = time;
        elapsed += dt;
        progress = (elapsed % 26) / 26;
        updateSkier(progress);
        view.lerp(pointer, 1 - Math.exp(-dt * 5));
        draw();
    }
    function syncPlayback() {
        if (disposed || lost) return;
        lastTime = lastFrame = 0;
        const running = visible && !document.hidden && !paused && !reducedMotion.matches;
        host.dataset.motion = running ? 'running' : 'paused';
        toggle.hidden = reducedMotion.matches;
        toggle.setAttribute('aria-pressed', String(paused));
        toggle.textContent = paused ? '播放动画' : '暂停动画';
        renderer.setAnimationLoop(running ? frame : null);
        if (reducedMotion.matches) {
            pointer.set(0, 0); view.set(0, 0);
        }
        draw();
    }
    function resize() {
        if (disposed || lost) return;
        const { width, height } = host.getBoundingClientRect();
        if (!width || !height) return;
        const aspect = width / height;
        const halfWidth = Math.max(4.6, 3.4 * aspect);
        camera.left = -halfWidth;
        camera.right = halfWidth;
        camera.top = halfWidth / aspect;
        camera.bottom = -halfWidth / aspect;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(devicePixelRatio, smallScreen.matches ? 1.25 : 1.6));
        renderer.setSize(width, height, false);
        draw();
    }
    const onPointer = (event) => {
        if (reducedMotion.matches || paused || !finePointer.matches || event.pointerType !== 'mouse') return;
        const rect = host.getBoundingClientRect();
        pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1);
    };
    const onLeave = () => pointer.set(0, 0);
    const onToggle = () => { paused = !paused; syncPlayback(); };
    const onVisibility = () => syncPlayback();
    const onLost = (event) => {
        event.preventDefault(); lost = true;
        renderer.setAnimationLoop(null);
        host.dataset.state = 'fallback';
        toggle.hidden = true;
    };
    const onRestored = () => {
        lost = false; resize();
        host.dataset.state = 'ready';
        syncPlayback();
    };
    canvas.setAttribute('aria-hidden', 'true');
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    host.addEventListener('pointermove', onPointer);
    host.addEventListener('pointerleave', onLeave);
    toggle.addEventListener('click', onToggle);
    reducedMotion.addEventListener('change', syncPlayback);
    document.addEventListener('visibilitychange', onVisibility);
    const sizing = new ResizeObserver(resize);
    sizing.observe(host);
    const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncPlayback(); }, { threshold: 0 });
    visibility.observe(host);
    host.append(canvas);
    updateSkier(progress);
    resize();
    host.dataset.state = 'ready';
    syncPlayback();

    function dispose(event) {
        // A page retained in the back/forward cache is suspended, not destroyed.
        if (event.persisted) { renderer.setAnimationLoop(null); return; }
        disposed = true;
        renderer.setAnimationLoop(null);
        sizing.disconnect(); visibility.disconnect();
        host.removeEventListener('pointermove', onPointer);
        host.removeEventListener('pointerleave', onLeave);
        toggle.removeEventListener('click', onToggle);
        reducedMotion.removeEventListener('change', syncPlayback);
        document.removeEventListener('visibilitychange', onVisibility);
        canvas.removeEventListener('webglcontextlost', onLost);
        canvas.removeEventListener('webglcontextrestored', onRestored);
        const geometries = new Set();
        const materials = new Set();
        scene.traverse((object) => {
            if (object.geometry) geometries.add(object.geometry);
            if (object.material) materials.add(object.material);
        });
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((mat) => mat.dispose());
        renderer.dispose();
    }
    window.addEventListener('pagehide', dispose);
    window.addEventListener('pageshow', syncPlayback);
}
