import * as T from 'three';
import { ROOM_VIEW } from './room-layout.js?v=room-clear-20260923';
import { OrbitControls } from './assets/vendor/three/addons/controls/OrbitControls.js';
import { createRoom } from './room-model.js?v=crafted-20260924';
import { createIsland } from './room-island.js?v=crafted-20260924';
import { createResident } from './room-resident.js?v=dialog-default-20260923';
import { createPlayer } from './room-player.js?v=crafted-20260924';
import { createFerry } from './room-ferry.js?v=ferry-20260923';
import { createWalkInput } from './room-input.js';
import { createWeather } from './room-weather.js?v=lagoon-20260924';
import { createCharacterPicker } from './room-character-picker.js?v=dialog-default-20260923';

export async function startRoomScene({ stage, canvas, links, onSelect, onBrowse }) {
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
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const narrow = matchMedia('(max-width: 700px)');
    const islandTarget = new T.Vector3(19.5, .5, -7.5);
    const islandHome = islandTarget.clone().add(new T.Vector3(narrow.matches ? -72 : 72, 84, 90));
    const roomTarget = new T.Vector3(...ROOM_VIEW.target), roomHome = new T.Vector3(...ROOM_VIEW.home);
    let camera = islandCamera;
    camera.position.copy(islandHome); camera.lookAt(islandTarget);
    const ambient = new T.HemisphereLight('#f7ecd7', '#819f8d', 1.8); scene.add(ambient);
    const sun = new T.DirectionalLight('#ffe4bb', 2.05);
    sun.position.set(-20, 35, 25); sun.target.position.set(7, 0, 2);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -64, right: 64, top: 54, bottom: -44, near: 1, far: 150 });
    sun.shadow.bias = -.0003; sun.shadow.normalBias = .025;
    sun.shadow.radius = 4; scene.add(sun, sun.target);
    const fill = new T.DirectionalLight('#c7cedf', .65); fill.position.set(4, 4, 8); scene.add(fill);
    let room, island, player, resident;
    try { room = await createRoom(links, renderer); island = await createIsland(); player = await createPlayer(); resident = await createResident(renderer); } catch (error) { room?.dispose(); island?.dispose(); player?.dispose(); resident?.dispose(); renderer.dispose(); throw error; }
    stage.dataset.resident = resident.source;
    stage.dataset.cottage = room.root.userData.exterior;
    scene.add(room.root, island.root, resident.root);
    const ferry = createFerry({ sea: island.sea, player });
    const ferryMarker = document.getElementById('ferry-marker'), ferryPanel = document.getElementById('ferry-panel');
    const ferryAction = document.getElementById('ferry-action'), ferryStatus = document.getElementById('ferry-status');
    let ferryUIState = '';

    const controls = new OrbitControls(camera, canvas);
    controls.target.copy(islandTarget); controls.enableDamping = true; controls.dampingFactor = .12;
    controls.enablePan = false; controls.enableZoom = true; controls.minZoom = 1; controls.maxZoom = 3; controls.zoomSpeed = .6;
    controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity;
    controls.minPolarAngle = .74; controls.maxPolarAngle = 1.12;
    controls.rotateSpeed = .22; controls.autoRotate = false; controls.update(); controls.saveState();
    controls.enableDamping = !reduced.matches;
    const walkControls = document.getElementById('walk-controls');
    const marker = document.getElementById('resident-marker');
    const shelfMarker = document.getElementById('bookcase-marker');
    const appLabel = document.getElementById('app-hover-label');
    let following = false, wasInside = false;
    const forward = new T.Vector3(), right = new T.Vector3(), direction = new T.Vector3();
    const raycaster = new T.Raycaster(), pointer = new T.Vector2();
    const labels = new Map(links.map(link => [link.dataset.app, link]));
    const projected = new T.Vector3();
    let width = 0, height = 0, frame = 0, lastTime = 0, settle = 0, modalOpen = Boolean(document.querySelector('dialog[open]')), lost = false, disposed = false, hovered = null, down = null;
    let ambientTimer = 0, ambientTime = 0;
    const environment = createWeather({ scene, renderer, ambient, sun, fill, room, stage, requestFrame });
    let browseOpen = stage.dataset.showApps === 'true';
    controls.enabled = !modalOpen && !browseOpen;
    const picker = createCharacterPicker({ stage, getCurrent: () => resident.source, select: async id => {
        const next = await createResident(renderer, id, { allowFallback: false, heading: resident.heading });
        if (disposed) { next.dispose(); return; }
        next.update(0, { ...player.state, moving: false }, reduced.matches);
        const previous = resident; resident = next; scene.add(next.root); scene.remove(previous.root); previous.dispose();
        stage.dataset.resident = next.source; requestFrame();
    } });
    const input = createWalkInput({
        joystick: document.getElementById('walk-joystick'), knob: document.querySelector('.joystick-knob'), requestFrame,
        canMove: () => !ferry.aboard && !modalOpen && !browseOpen && !environment.open && !lost && !disposed,
    });
    function placeLabels() {
        camera.updateMatrixWorld(); room.root.updateMatrixWorld();
        projected.set(player.state.x, player.state.y + 1.85, player.state.z).project(camera);
        marker.style.left = `${(projected.x * .5 + .5) * width}px`;
        marker.style.top = `${(-projected.y * .5 + .5) * height}px`;
        marker.hidden = camera === roomCamera || Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1;
        projected.copy(room.shelfAnchor).project(camera);
        shelfMarker.style.left = `${(projected.x * .5 + .5) * width}px`;
        shelfMarker.style.top = `${(-projected.y * .5 + .5) * height}px`;
        shelfMarker.hidden = camera !== roomCamera || Math.abs(projected.x) > .95 || Math.abs(projected.y) > .95;
        appLabel.hidden = camera !== roomCamera || !room.anchors[hovered] || modalOpen || browseOpen;
        if (!appLabel.hidden) {
            projected.copy(room.anchors[hovered]).project(camera);
            appLabel.style.left = `${(projected.x * .5 + .5) * width}px`;
            appLabel.style.top = `${(-projected.y * .5 + .5) * height - 15}px`;
            appLabel.textContent = labels.get(hovered).querySelector('.object-name').textContent;
        }
        const dock = ferry.stop.dock, near = ferry.nearby();
        projected.set(dock.x, .25, dock.end).project(camera);
        ferryMarker.style.left = `${(projected.x * .5 + .5) * width}px`;
        ferryMarker.style.top = `${(-projected.y * .5 + .5) * height}px`;
        ferryMarker.hidden = !near || camera === roomCamera || ferry.aboard || modalOpen || browseOpen || environment.open || Math.abs(projected.x) > .95 || Math.abs(projected.y) > .86;
        ferryMarker.disabled = !near;
        ferryPanel.hidden = camera === roomCamera || !(near || ferry.aboard) || modalOpen || browseOpen || environment.open;
        const key = `${ferry.state.phase}/${player.state.island}/${near}`;
        if (key !== ferryUIState) {
            ferryUIState = key; stage.dataset.ferry = ferry.state.phase; stage.dataset.shore = player.state.island;
            const destination = ferry.destination.label;
            ferryStatus.textContent = ferry.state.phase === 'moored' ? `小船已在${ferry.stop.label}靠岸` : ferry.state.phase === 'boarding' ? '正在上船' : ferry.state.phase === 'sailing' ? `正在前往${destination}` : ferry.state.phase === 'arrived' ? `已抵达${ferry.stop.label}` : '正在下船';
            ferryAction.textContent = ferry.state.phase === 'moored' ? `上船去${destination}` : ferry.state.phase === 'arrived' ? `下船到${ferry.stop.label}` : ferry.state.phase === 'sailing' ? '航行中…' : '请稍候…';
            ferryAction.disabled = !['moored', 'arrived'].includes(ferry.state.phase);
            ferryPanel.querySelector('.ferry-key-hint').hidden = ferryAction.disabled;
            ferryMarker.textContent = `上船去${destination}`;
            viewButton.hidden = ferry.aboard || player.state.island !== 'home';
            if (camera === islandCamera) {
                updateHint();
                document.querySelector('.room-hint span').textContent = ferry.aboard ? (ferry.state.phase === 'arrived' ? '已经靠岸，按 E 或点击下船。' : `乘船前往${destination}，靠岸后即可下船。`) : player.state.island === 'home' ? '走到码头乘船，去隔壁的足球岛。' : '走上足球场，回程仍在码头乘船。';
            }
        }
    }

    function draw(time) {
        frame = 0;
        if (disposed || lost || document.hidden) return;
        const frameDelta = lastTime ? Math.max(0, (time - lastTime) / 1000) : 1 / 60;
        const delta = Math.min(frameDelta, .05); lastTime = time;
        const intent = input.read();
        camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
        right.set(-forward.z, 0, forward.x);
        direction.copy(right).multiplyScalar(intent.x).addScaledVector(forward, -intent.y);
        // Travel uses elapsed time; the smaller physics timestep must not slow the boat on a busy GPU.
        const sailing = ferry.update(Math.min(frameDelta, .5), modalOpen || browseOpen || environment.open);
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
        if (!reduced.matches && !modalOpen) ambientTime += delta;
        const { weather, daylight } = environment.update(ambientTime, reduced.matches, camera === roomCamera);
        if (camera === islandCamera) island.update(ambientTime, reduced.matches, weather, daylight);
        const cutawayPending = room.updateCutaway(camera, time); island.updateCutaway(camera, camera === roomCamera);
        placeLabels(); renderer.render(scene, camera);
        if (!modalOpen && (sailing || intent.active || walking || posed || changed || followed || moved || cutawayPending || settle > 0)) { settle = Math.max(0, settle - 1); requestFrame(); }
        else if (!modalOpen && !reduced.matches && camera === islandCamera) {
            // Idle sea/weather frames are limited to 24 fps; deliberate movement stays responsive.
            ambientTimer = setTimeout(() => { ambientTimer = 0; requestFrame(); }, 1000 / 24);
        } else lastTime = 0;
    }
    function requestFrame() { clearTimeout(ambientTimer); ambientTimer = 0; if (!frame && !disposed && !document.hidden && !lost) frame = requestAnimationFrame(draw); }
    function resize() {
        const bounds = canvas.getBoundingClientRect(); width = bounds.width; height = bounds.height;
        renderer.setSize(width, height, false);
        const aspect = width / height;
        const viewHeight = narrow.matches ? Math.max(65, 55 / aspect) : Math.max(53, 88 / aspect);
        islandCamera.left = -viewHeight * aspect / 2; islandCamera.right = viewHeight * aspect / 2;
        islandCamera.top = viewHeight / 2; islandCamera.bottom = -viewHeight / 2;
        islandCamera.updateProjectionMatrix();
        roomCamera.aspect = aspect;
        roomCamera.fov = T.MathUtils.radToDeg(2 * Math.atan(Math.max(ROOM_VIEW.halfHeight, ROOM_VIEW.halfWidth / aspect) / roomHome.distanceTo(roomTarget)));
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
            if (node.userData.ferry) return 'ferry';
            if (node === resident.root) return 'resident';
            if (stage.dataset.view === 'island') { if (node === room.root) return 'house'; }
            else if (node.userData.appId) return node.userData.appId;
            else if (node.userData.collection) return 'bookcase';
        }
        return null;
    }
    function highlight(id) {
        if (hovered === id) return;
        shelfMarker.classList.toggle('is-hovered', id === 'bookcase');
        hovered = id; room.highlight(id === 'house' || id === 'resident' ? null : id);
        labels.forEach((link, key) => link.classList.toggle('is-hovered', key === id));
        canvas.style.cursor = id ? 'pointer' : 'grab'; settle = reduced.matches ? 1 : 18; requestFrame();
    }
    const listeners = [], touchPointers = new Set();
    function listen(element, type, callback, options) { element.addEventListener(type, callback, options); listeners.push(() => element.removeEventListener(type, callback, options)); }
    listen(canvas, 'pointerdown', event => {
        if (event.pointerType === 'touch') touchPointers.add(event.pointerId);
        if (touchPointers.size > 1) { down = null; return; }
        if (event.isPrimary) down = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    });
    listen(canvas, 'pointermove', event => { if (event.pointerType !== 'touch' && !event.buttons) highlight(hit(event)); });
    listen(canvas, 'pointerleave', () => highlight(null));
    listen(canvas, 'pointercancel', event => { touchPointers.delete(event.pointerId); down = null; });
    listen(canvas, 'pointerup', event => {
        touchPointers.delete(event.pointerId);
        if (!down || down.pointerId !== event.pointerId) return;
        const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y); down = null;
        if (moved > 6 || document.querySelector('dialog[open]') || event.button !== 0) return;
        const id = hit(event);
        if (id === 'house') setView(true, true);
        else if (id === 'ferry') useFerry();
        else if (id === 'resident') greet();
        else if (id === 'bookcase') onBrowse();
        else if (id) onSelect(id, shelfMarker);
    });
    function greet() {
        if (ferry.aboard || modalOpen || browseOpen || environment.open) return;
        if (resident.greet(Math.atan2(camera.position.x - player.state.x, camera.position.z - player.state.z))) requestFrame();
    }
    listen(marker, 'click', greet);
    function useFerry() {
        if (modalOpen || browseOpen || environment.open || lost || !ferry.interact()) return;
        input.clear();
        if (ferry.state.phase === 'boarding') setFollow(true);
        settle = 18; requestFrame();
    }
    listen(ferryAction, 'click', useFerry); listen(ferryMarker, 'click', useFerry);
    listen(document, 'keydown', event => {
        if (event.code !== 'KeyE' || event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.target.closest?.('input,textarea,select,[contenteditable="true"],dialog')) return;
        event.preventDefault(); useFerry();
    });
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
    listen(document, 'visibilitychange', () => { lastTime = 0; if (document.hidden) { cancelAnimationFrame(frame); clearTimeout(ambientTimer); frame = 0; } else requestFrame(); });
    listen(document, 'room:modal', event => { modalOpen = event.detail.open; controls.enabled = !modalOpen && !browseOpen && !environment.open; if (modalOpen) { input.clear(); highlight(null); } requestFrame(); });
    listen(document, 'room:browse', event => { browseOpen = event.detail.open; controls.enabled = !modalOpen && !browseOpen && !environment.open; input.clear(); requestFrame(); });
    listen(document, 'room:environment', event => { controls.enabled = !modalOpen && !browseOpen && !environment.open; input.clear(); requestFrame(); });
    listen(canvas, 'webglcontextlost', event => { event.preventDefault(); lost = true; cancelAnimationFrame(frame); clearTimeout(ambientTimer); frame = 0; environment.setAvailable(false); stage.dataset.renderer = 'fallback'; document.getElementById('room-controls').hidden = true; walkControls.hidden = true; marker.hidden = true; shelfMarker.hidden = true; appLabel.hidden = true; input.clear(); });
    listen(canvas, 'webglcontextrestored', () => { lost = false; environment.setAvailable(true); stage.dataset.renderer = 'ready'; document.getElementById('room-controls').hidden = false; walkControls.hidden = false; lastTime = 0; resize(); });
    const observer = new ResizeObserver(resize); observer.observe(stage);
    const onNarrowChange = () => {
        islandHome.copy(islandTarget).add(new T.Vector3(narrow.matches ? -72 : 72, 84, 90));
        if (camera === islandCamera && !following) {
            camera.position.copy(islandHome); controls.target.copy(islandTarget);
            controls.update(); controls.saveState();
        }
        updateHint();
        resize();
    }; listen(narrow, 'change', onNarrowChange);
    const reset = document.getElementById('reset-view');
    listen(reset, 'click', () => { if (camera === islandCamera) setFollow(!following); else { controls.reset(); settle = 18; requestFrame(); } });
    const viewButton = document.getElementById('toggle-view');
    function updateHint() {
        document.querySelector('.room-hint').firstChild.textContent = ferry.aboard ? '拖动看四周 · 可切换全岛视角' : narrow.matches ? (stage.dataset.view === 'room' ? '左下摇杆移动 · 拖动 360° 环视 · 双指缩放' : '左下摇杆移动 · 双指缩放') : (stage.dataset.view === 'room' ? '拖动 360° 环视 · 滚轮缩放 · WASD 移动' : 'WASD / 方向键移动 · G 打招呼 · 拖动看四周');
    }
    function setFollow(value) {
        following = value;
        stage.dataset.following = String(value);
        if (value) {
            const originalHeight = Math.max(43, 53.5 / (width / height));
            camera.zoom = (narrow.matches ? 2.3 : 1.85) * (camera.top - camera.bottom) / originalHeight;
            camera.updateProjectionMatrix();
        }
        else controls.reset();
        reset.textContent = value ? '看全岛' : '跟随人物';
        settle = 18; requestFrame();
    }
    function setView(indoors, relocate = false, clearInput = true) {
        if (ferry.aboard || relocate && player.state.island !== 'home') return;
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
        controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity;
        controls.minPolarAngle = indoors ? .60 : .74; controls.maxPolarAngle = indoors ? 1.43 : 1.12;
        controls.minDistance = indoors ? ROOM_VIEW.minDistance : 0; controls.maxDistance = indoors ? ROOM_VIEW.maxDistance : Infinity;
        controls.rotateSpeed = indoors ? .75 : .22;
        controls.update(); controls.saveState(); controls.enableDamping = !reduced.matches;
        stage.dataset.view = indoors ? 'room' : 'island';
        room.setInterior(indoors); room.updateCutaway(camera); controls.enableZoom = true;
        reset.textContent = indoors ? '回到原位' : '跟随人物';
        viewButton.textContent = indoors ? '回到小岛' : '走进小屋'; viewButton.setAttribute('aria-pressed', String(indoors));
        document.querySelector('.intro h1').textContent = indoors ? '欢迎来坐坐。' : '在小岛上，慢慢做。';
        updateHint();
        document.querySelector('.room-hint span').textContent = indoors ? '书桌右侧书架上的每个 App 都可以点开。' : '走到码头乘船，去隔壁的足球岛。';
        scene.fog.near = indoors ? 30 : 145; scene.fog.far = indoors ? 85 : 340;
        settle = 1; lastTime = 0; resize();
    }
    listen(viewButton, 'click', () => setView(stage.dataset.view !== 'room', true));
    const dispose = () => {
        if (disposed) return; disposed = true; cancelAnimationFrame(frame); clearTimeout(ambientTimer); observer.disconnect(); listeners.forEach(remove => remove());
        picker.dispose(); environment.dispose(); input.dispose(); controls.dispose(); room.dispose(); island.dispose(); resident.dispose(); player.dispose(); sun.dispose(); renderer.dispose();
    };
    listen(window, 'pagehide', event => { if (!event.persisted) dispose(); });
    stage.dataset.renderer = 'ready';
    document.getElementById('room-controls').hidden = false;
    walkControls.hidden = false;
    onNarrowChange();
    return { dispose };
}
