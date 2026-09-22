import * as T from 'three';
import { OrbitControls } from './assets/vendor/three/addons/controls/OrbitControls.js';
import { createRoom } from './room-model.js';
import { createIsland } from './room-island.js';
import { createResident } from './room-resident.js?v=snowboarder-20260922';
import { createPlayer } from './room-player.js';
import { createWalkInput } from './room-input.js';

export async function startRoomScene({ stage, canvas, links, onSelect }) {
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setClearColor('#bed8cf', 1);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    const scene = new T.Scene();
    scene.fog = new T.Fog('#bed8cf', 145, 340);
    const islandCamera = new T.OrthographicCamera(-10, 10, 8, -8, .1, 500);
    const roomCamera = new T.PerspectiveCamera(42, 1, .1, 300);
    // A distant orthographic camera keeps the entire portrait frustum above sea level.
    const islandTarget = new T.Vector3(7, .5, 2), islandHome = new T.Vector3(79, 84.5, 92);
    const roomTarget = new T.Vector3(-.1, 1.95, -.45), roomHome = new T.Vector3(4.1, 4.15, 8.9);
    let camera = islandCamera;
    camera.position.copy(islandHome); camera.lookAt(islandTarget);
    const ambient = new T.HemisphereLight('#f7ecd7', '#819f8d', 1.8); scene.add(ambient);
    const sun = new T.DirectionalLight('#ffe4bb', 2.05);
    sun.position.set(-20, 35, 25); sun.target.position.set(7, 0, 2);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 105 });
    sun.shadow.bias = -.0003; sun.shadow.normalBias = .025;
    sun.shadow.radius = 4; scene.add(sun, sun.target);
    const fill = new T.DirectionalLight('#c7cedf', .65); fill.position.set(4, 4, 8); scene.add(fill);
    let room, island, player, resident;
    try { room = await createRoom(); island = await createIsland(); player = await createPlayer(); resident = await createResident(renderer); } catch (error) { room?.dispose(); island?.dispose(); player?.dispose(); resident?.dispose(); renderer.dispose(); throw error; }
    stage.dataset.resident = resident.source;
    scene.add(room.root, island.root, resident.root);

    const controls = new OrbitControls(camera, canvas);
    controls.target.copy(islandTarget); controls.enableDamping = true; controls.dampingFactor = .12;
    controls.enablePan = false; controls.enableZoom = true; controls.minZoom = 1; controls.maxZoom = 3; controls.zoomSpeed = .6;
    controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity;
    controls.minPolarAngle = .74; controls.maxPolarAngle = 1.12;
    controls.rotateSpeed = .22; controls.autoRotate = false; controls.update(); controls.saveState();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const narrow = matchMedia('(max-width: 700px)');
    controls.enableDamping = !reduced.matches;
    const walkControls = document.getElementById('walk-controls');
    const marker = document.getElementById('resident-marker');
    let following = false, wasInside = false;
    const forward = new T.Vector3(), right = new T.Vector3(), direction = new T.Vector3();
    const raycaster = new T.Raycaster(), pointer = new T.Vector2();
    const labels = new Map(links.map(link => [link.dataset.app, link]));
    const projected = new T.Vector3();
    let width = 0, height = 0, frame = 0, lastTime = 0, settle = 0, modalOpen = Boolean(document.querySelector('dialog[open]')), lost = false, disposed = false, hovered = null, down = null;
    let browseOpen = stage.dataset.showApps === 'true';
    controls.enabled = !modalOpen && !browseOpen;
    const input = createWalkInput({
        joystick: document.getElementById('walk-joystick'), knob: document.querySelector('.joystick-knob'), requestFrame,
        canMove: () => !modalOpen && !browseOpen && !lost && !disposed,
    });
    function placeLabels() {
        camera.updateMatrixWorld(); room.root.updateMatrixWorld();
        projected.set(player.state.x, player.state.y + 1.85, player.state.z).project(camera);
        marker.style.left = `${(projected.x * .5 + .5) * width}px`;
        marker.style.top = `${(-projected.y * .5 + .5) * height}px`;
        marker.hidden = camera === roomCamera || Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1;
        if (narrow.matches) return;
        for (const [id, anchor] of Object.entries(room.anchors)) {
            projected.copy(anchor).project(camera);
            const link = labels.get(id);
            link.style.left = `${(projected.x * .5 + .5) * width}px`;
            link.style.top = `${(-projected.y * .5 + .5) * height + 9}px`;
        }
    }
    function draw(time) {
        frame = 0;
        if (disposed || lost || document.hidden) return;
        const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 1 / 60; lastTime = time;
        const intent = input.read();
        camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
        right.set(-forward.z, 0, forward.x);
        direction.copy(right).multiplyScalar(intent.x).addScaledVector(forward, -intent.y);
        const walking = !modalOpen && player.update(delta, direction);
        if (player.state.indoors !== wasInside) {
            wasInside = player.state.indoors; setView(wasInside, false, false);
        }
        if (narrow.matches && intent.active && camera === islandCamera && !following) setFollow(true);
        const posed = resident.update(delta, player.state, reduced.matches);
        const changed = modalOpen ? false : room.update(delta, reduced.matches);
        let followed = false;
        if (following && camera === islandCamera) {
            const target = new T.Vector3(player.state.x, 1.0, player.state.z);
            const shift = target.sub(controls.target).multiplyScalar(reduced.matches ? 1 : 1 - Math.exp(-delta * 7));
            if (shift.lengthSq() > .000001) { controls.target.add(shift); camera.position.add(shift); followed = true; }
        }
        const moved = modalOpen ? false : controls.update();
        placeLabels(); renderer.render(scene, camera);
        if (!modalOpen && (intent.active || walking || posed || changed || followed || moved || settle > 0)) { settle = Math.max(0, settle - 1); requestFrame(); }
        else lastTime = 0;
    }
    function requestFrame() { if (!frame && !disposed && !document.hidden && !lost) frame = requestAnimationFrame(draw); }
    function resize() {
        const bounds = canvas.getBoundingClientRect(); width = bounds.width; height = bounds.height;
        renderer.setSize(width, height, false);
        const aspect = width / height;
        const viewHeight = Math.max(43.0, 53.5 / aspect);
        islandCamera.left = -viewHeight * aspect / 2; islandCamera.right = viewHeight * aspect / 2;
        islandCamera.top = viewHeight / 2; islandCamera.bottom = -viewHeight / 2;
        islandCamera.updateProjectionMatrix();
        roomCamera.aspect = aspect;
        roomCamera.fov = T.MathUtils.radToDeg(2 * Math.atan(Math.max(3.85, 4.7 / aspect) / roomHome.distanceTo(roomTarget)));
        roomCamera.updateProjectionMatrix();
        placeLabels(); requestFrame();
    }
    function hit(event) {
        const bounds = canvas.getBoundingClientRect();
        pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        // Include walls and furnishings so an occluded app cannot be clicked through them.
        const first = raycaster.intersectObjects([room.root, island.root, resident.root], true).find(intersection => {
            for (let node = intersection.object; node; node = node.parent) if (!node.visible) return false;
            return true;
        });
        for (let node = first?.object; node; node = node.parent) {
            if (node === resident.root) return 'resident';
            if (stage.dataset.view === 'island') { if (node === room.root) return 'house'; }
            else if (node.userData.appId) return node.userData.appId;
        }
        return null;
    }
    function highlight(id) {
        if (hovered === id) return;
        hovered = id; room.highlight(id === 'house' || id === 'resident' ? null : id);
        labels.forEach((link, key) => link.classList.toggle('is-hovered', key === id));
        canvas.style.cursor = id ? 'pointer' : 'grab'; settle = reduced.matches ? 1 : 18; requestFrame();
    }
    const listeners = [];
    function listen(element, type, callback, options) { element.addEventListener(type, callback, options); listeners.push(() => element.removeEventListener(type, callback, options)); }
    listen(canvas, 'pointerdown', event => { if (event.isPrimary) down = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }; });
    listen(canvas, 'pointermove', event => { if (event.pointerType !== 'touch' && !event.buttons) highlight(hit(event)); });
    listen(canvas, 'pointerleave', () => highlight(null));
    listen(canvas, 'pointercancel', () => { down = null; });
    listen(canvas, 'pointerup', event => {
        if (!down || down.pointerId !== event.pointerId) return;
        const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y); down = null;
        if (moved > 6 || modalOpen || event.button !== 0) return;
        const id = hit(event);
        if (id === 'house') setView(true, true);
        else if (id === 'resident') greet();
        else if (id) onSelect(id, labels.get(id));
    });
    function greet() {
        if (modalOpen || browseOpen) return;
        if (resident.greet(Math.atan2(camera.position.x - player.state.x, camera.position.z - player.state.z))) requestFrame();
    }
    listen(marker, 'click', greet);
    listen(document, 'keydown', event => {
        if (event.code !== 'KeyG' || event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.target.closest?.('input,textarea,select,[contenteditable="true"],dialog')) return;
        greet();
    });
    links.forEach(link => {
        listen(link, 'pointerenter', () => highlight(link.dataset.app));
        listen(link, 'pointerleave', () => highlight(null));
        listen(link, 'focus', () => highlight(link.dataset.app));
        listen(link, 'blur', () => highlight(null));
    });
    controls.addEventListener('change', requestFrame);
    controls.addEventListener('start', () => { highlight(null); canvas.classList.add('is-dragging'); });
    controls.addEventListener('end', () => { canvas.classList.remove('is-dragging'); settle = 18; requestFrame(); });
    listen(reduced, 'change', () => { controls.enableDamping = !reduced.matches; lastTime = 0; requestFrame(); });
    listen(document, 'visibilitychange', () => { lastTime = 0; if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else requestFrame(); });
    listen(document, 'room:modal', event => { modalOpen = event.detail.open; controls.enabled = !modalOpen && !browseOpen; if (modalOpen) { input.clear(); highlight(null); } requestFrame(); });
    listen(document, 'room:browse', event => { browseOpen = event.detail.open; controls.enabled = !modalOpen && !browseOpen; input.clear(); requestFrame(); });
    listen(canvas, 'webglcontextlost', event => { event.preventDefault(); lost = true; cancelAnimationFrame(frame); frame = 0; stage.dataset.renderer = 'fallback'; document.getElementById('room-controls').hidden = true; walkControls.hidden = true; marker.hidden = true; input.clear(); });
    listen(canvas, 'webglcontextrestored', () => { lost = false; stage.dataset.renderer = 'ready'; document.getElementById('room-controls').hidden = false; walkControls.hidden = false; lastTime = 0; resize(); });
    const observer = new ResizeObserver(resize); observer.observe(stage);
    const onNarrowChange = () => {
        updateHint();
        resize();
    }; listen(narrow, 'change', onNarrowChange);
    const reset = document.getElementById('reset-view');
    listen(reset, 'click', () => { if (camera === islandCamera) setFollow(!following); else { controls.reset(); settle = 18; requestFrame(); } });
    const viewButton = document.getElementById('toggle-view');
    function updateHint() {
        document.querySelector('.room-hint').firstChild.textContent = narrow.matches ? (stage.dataset.view === 'room' ? '左下摇杆移动 · 拖动看四周' : '左下摇杆移动 · 双指缩放') : 'WASD / 方向键移动 · G 打招呼 · 拖动看四周';
    }
    function setFollow(value) {
        following = value;
        stage.dataset.following = String(value);
        if (value) { camera.zoom = narrow.matches ? 2.3 : 1.85; camera.updateProjectionMatrix(); }
        else controls.reset();
        reset.textContent = value ? '看全岛' : '跟随人物';
        settle = 18; requestFrame();
    }
    function setView(indoors, relocate = false, clearInput = true) {
        if (clearInput) input.clear();
        if (relocate) { player.relocate(indoors); wasInside = player.state.indoors; }
        following = false;
        stage.dataset.following = 'false';
        highlight(null);
        controls.enableDamping = false; controls.reset();
        camera = indoors ? roomCamera : islandCamera; controls.object = camera;
        camera.zoom = 1; camera.updateProjectionMatrix();
        camera.position.copy(indoors ? roomHome : islandHome);
        controls.target.copy(indoors ? roomTarget : islandTarget);
        controls.minAzimuthAngle = indoors ? -.05 : -Infinity; controls.maxAzimuthAngle = indoors ? .67 : Infinity;
        controls.minPolarAngle = indoors ? 1.22 : .74; controls.maxPolarAngle = indoors ? 1.45 : 1.12;
        controls.update(); controls.saveState(); controls.enableDamping = !reduced.matches;
        stage.dataset.view = indoors ? 'room' : 'island';
        room.setInterior(indoors); controls.enableZoom = !indoors;
        reset.textContent = indoors ? '回到原位' : '跟随人物';
        viewButton.textContent = indoors ? '回到小岛' : '走进小屋'; viewButton.setAttribute('aria-pressed', String(indoors));
        document.querySelector('.intro h1').textContent = indoors ? '欢迎来坐坐。' : '在小岛上，慢慢做。';
        updateHint();
        document.querySelector('.room-hint span').textContent = indoors ? '架上的小物件也可以点开。' : '沿着小路走走，也可以走进小屋。';
        ambient.intensity = indoors ? 1.2 : 1.8; sun.intensity = indoors ? 1.25 : 2.05;
        scene.fog.near = indoors ? 30 : 145; scene.fog.far = indoors ? 85 : 340;
        settle = 1; lastTime = 0; resize();
    }
    listen(viewButton, 'click', () => setView(stage.dataset.view !== 'room', true));
    const dispose = () => {
        if (disposed) return; disposed = true; cancelAnimationFrame(frame); observer.disconnect(); listeners.forEach(remove => remove());
        input.dispose(); controls.dispose(); room.dispose(); island.dispose(); resident.dispose(); player.dispose(); sun.dispose(); renderer.dispose();
    };
    listen(window, 'pagehide', event => { if (!event.persisted) dispose(); });
    stage.dataset.renderer = 'ready';
    document.getElementById('room-controls').hidden = false;
    walkControls.hidden = false;
    onNarrowChange();
    return { dispose };
}
