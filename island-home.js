const appData = {
    divejournal: { title: '潜水日记', icon: 'divejournal-icon.png', status: '测试中', description: '用文字、照片和录音留住潜水回忆，AI 协助整理。', href: 'divejournal/' },
    sudoku: { title: '数独', icon: 'sudoku-icon.jpg', status: 'App Store', description: '从容易到进阶，在九宫格里专心解一道题。', href: 'https://apps.apple.com/us/app/id1591771209' },
    trip: { title: '旅行清单', icon: 'trip-note-icon.jpg', status: 'App Store', description: '收好行前清单、路上的见闻，和旅途中的花销。', href: 'https://apps.apple.com/us/app/id6465693593' },
    ledger: { title: '导游账本', icon: 'guide-ledger.png', status: '无需注册', description: '按行程记录收支、整理报账。带好团，也把账记清楚。', href: 'guide-ledger/' },
    aquatrue: { title: '潜彩', icon: 'aquatrue-icon.png', status: '即将推出', description: '还原水下视频的偏绿、偏蓝，让真实的色彩重新浮现。', href: 'aquatrue/' },
    imagesize: { title: '拍尺', icon: 'imagesize-icon.png', status: '准备上架', description: '拍下平面物体，把尺寸留在照片上。适用于 LiDAR iPhone。', href: 'imagesize/' },
    yixu: { title: '衣序', icon: 'yixu-icon.png', status: '内部测试', description: '整理自己的衣橱，用数字人预览更多穿搭。', href: 'yixu/' },
};
const stage = document.getElementById('world-stage');
const canvas = document.getElementById('world-canvas');
const dockLinks = [...document.querySelectorAll('.dock-app')];
const hotspotLayer = document.getElementById('world-hotspots');
const appShelf = document.getElementById('app-shelf');
const selectedPanel = document.getElementById('selected-app');
function syncShelf() {
    selectedPanel.hidden = !appShelf.open;
    hotspotLayer.hidden = !appShelf.open || stage.dataset.state !== 'ready';
}
appShelf.addEventListener('toggle', syncShelf);
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && appShelf.open && !about.open) {
        appShelf.open = false;
        document.getElementById('shelf-toggle').focus({ preventScroll: true });
    }
});
let selectedApp = 'divejournal';
const markerButtons = new Map();
function selectApp(id) {
    const app = appData[id];
    if (!app) return;
    selectedApp = id;
    const icon = document.getElementById('selected-icon'); icon.src = `assets/${app.icon}`;
    document.getElementById('selected-title').textContent = app.title;
    document.getElementById('selected-status').textContent = app.status;
    document.getElementById('selected-description').textContent = app.description;
    const destination = document.getElementById('app-destination'); destination.href = app.href;
    destination.querySelector('span').textContent = app.href.startsWith('https:') ? '前往 App Store' : '了解应用';
    dockLinks.forEach(link => {
        if (link.dataset.app === id) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
    });
    markerButtons.forEach((button, key) => button.setAttribute('aria-pressed', String(key === id)));
}
dockLinks.forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault(); selectApp(link.dataset.app);
}));
const about = document.getElementById('about');
const aboutTrigger = document.getElementById('about-trigger');
aboutTrigger.addEventListener('click', event => { event.preventDefault(); about.showModal(); });
about.querySelector('.dialog-close').addEventListener('click', () => about.close());
about.addEventListener('click', event => {
    if (event.target !== about) return;
    const rect = about.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) about.close();
});
about.addEventListener('close', () => aboutTrigger.focus({ preventScroll: true }));

async function startWorld() {
    let renderer, world, controls, resizeObserver, animationId;
    function fallback(message) {
        cancelAnimationFrame(animationId);
        animationId = undefined;
        stage.dataset.state = 'fallback';
        hotspotLayer.hidden = true;
        document.getElementById('scene-tools').hidden = true;
        document.getElementById('scene-message').textContent = message;
    }
    try {
        const [T, { OrbitControls }, { createPortfolioWorld }] = await Promise.all([
            import('three'), import('three/addons/controls/OrbitControls.js'), import('./island-model.js'),
        ]);
        const narrow = matchMedia('(max-width: 700px)');
        const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
        renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(devicePixelRatio, narrow.matches ? 1.5 : 1.75));
        renderer.outputColorSpace = T.SRGBColorSpace;
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.10;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = T.PCFShadowMap;
        const scene = new T.Scene(); scene.background = new T.Color('#e4ece5');
        const camera = new T.OrthographicCamera(-7, 7, 5, -5, .1, 80);
        const initialPosition = new T.Vector3(7.6, 10.4, 15), initialTarget = new T.Vector3(0, 1.0, 0);
        camera.position.copy(initialPosition); camera.lookAt(initialTarget);
        controls = new OrbitControls(camera, canvas);
        controls.target.copy(initialTarget);
        controls.enableDamping = true; controls.dampingFactor = .085;
        controls.enablePan = false; controls.enableZoom = false;
        controls.minPolarAngle = .40; controls.maxPolarAngle = 1.30;
        controls.rotateSpeed = .50;
        // Leave vertical touch movement to page scrolling; a horizontal swipe orbits the miniature.
        controls.touches.ONE = T.TOUCH.ROTATE; controls.touches.TWO = T.TOUCH.DOLLY_ROTATE;
        canvas.style.touchAction = 'pan-y';
        const hemi = new T.HemisphereLight('#f5f7e9', '#bdc7ae', 2.15); scene.add(hemi);
        const sun = new T.DirectionalLight('#fff2d4', 3.15); sun.position.set(-3, 12, 7); sun.castShadow = true;
        sun.shadow.mapSize.set(narrow.matches ? 1024 : 1536, narrow.matches ? 1024 : 1536);
        Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 32 });
        sun.shadow.normalBias = .035; sun.shadow.bias = -.0002; sun.shadow.radius = 3;
        scene.add(sun);
        const fill = new T.DirectionalLight('#daede5', .55); fill.position.set(5, 4, -5); scene.add(fill);
        const floor = new T.Mesh(new T.PlaneGeometry(200, 200), new T.MeshBasicMaterial({ color: '#e4ece5', toneMapped: false }));
        floor.rotation.x = -Math.PI / 2; floor.position.y = -1.22; scene.add(floor);
        const groundShadow = new T.Mesh(new T.PlaneGeometry(40, 40), new T.ShadowMaterial({ color: '#526e60', opacity: .16 }));
        groundShadow.rotation.x = -Math.PI / 2; groundShadow.position.y = -1.21; groundShadow.receiveShadow = true; scene.add(groundShadow);
        world = createPortfolioWorld(); scene.add(world.root); world.update(0);
        for (const [id, app] of Object.entries(appData)) {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'world-pin'; button.dataset.app = id;
            button.setAttribute('aria-label', `查看${app.title}`); button.setAttribute('aria-pressed', String(id === selectedApp));
            const label = document.createElement('span'); label.textContent = app.title; button.append(label);
            button.addEventListener('click', () => selectApp(id)); markerButtons.set(id, button); hotspotLayer.append(button);
        }
        const projection = new T.Vector3(); let width = 0, height = 0;
        function updatePins() {
            for (const [id, button] of markerButtons) {
                projection.copy(world.anchors[id]).project(camera);
                const x = (projection.x + 1) / 2 * width, y = (1 - projection.y) / 2 * height;
                button.style.transform = `translate(${x - 16}px, ${y - 16}px)`;
                button.hidden = projection.z < -1 || projection.z > 1 || x < 16 || x > width - 16 || y < 16 || y > height - 16;
                button.style.zIndex = id === selectedApp ? 3 : 1;
            }
        }
        function resize() {
            width = stage.clientWidth; height = stage.clientHeight;
            if (!width || !height) return;
            renderer.setSize(width, height, false);
            const aspect = width / height;
            // Fit both the alpine peak and the entire irregular plinth in narrow and wide views.
            const viewHeight = Math.max(8.4, 12.5 / aspect);
            camera.left = -viewHeight * aspect / 2; camera.right = viewHeight * aspect / 2;
            camera.top = viewHeight / 2; camera.bottom = -viewHeight / 2; camera.updateProjectionMatrix();
            renderOnce();
        }
        function renderOnce() { renderer.render(scene, camera); updatePins(); }
        resizeObserver = new ResizeObserver(resize); resizeObserver.observe(stage);
        controls.update(); resize();
        stage.dataset.state = 'ready'; syncShelf(); document.getElementById('scene-tools').hidden = false;
        const motionButton = document.getElementById('toggle-motion');
        let time = 0, moving = !reduceMotion.matches, previous = 0, lastFrame = 0;
        function syncMotion() { motionButton.setAttribute('aria-pressed', String(!moving)); motionButton.querySelector('span').textContent = moving ? '暂停动画' : '播放动画'; }
        syncMotion();
        motionButton.addEventListener('click', () => { moving = !moving; syncMotion(); requestRender(); });
        reduceMotion.addEventListener('change', () => { moving = !reduceMotion.matches; syncMotion(); requestRender(); });
        document.getElementById('reset-view').addEventListener('click', () => {
            controls.enableDamping = false; controls.update(); camera.position.copy(initialPosition); controls.target.copy(initialTarget); camera.zoom = 1;
            camera.updateProjectionMatrix(); controls.update(); controls.enableDamping = true; renderOnce(); requestRender();
        });
        function frame(now) {
            // Keep the pending flag set during controls.update(), whose change event can request a frame.
            if (document.hidden || about.open || stage.dataset.state !== 'ready') { animationId = undefined; previous = 0; return; }
            const delta = previous ? Math.min((now - previous) / 1000, .08) : 0; previous = now;
            if (moving) time += delta;
            if (now - lastFrame >= 1000 / 30) {
                lastFrame = now; world.update(time); const changed = controls.update(delta); renderOnce();
                if (!moving && !changed) { animationId = undefined; previous = 0; return; }
            }
            animationId = requestAnimationFrame(frame);
        }
        function requestRender() { if (animationId === undefined && !document.hidden && !about.open && stage.dataset.state === 'ready') animationId = requestAnimationFrame(frame); }
        controls.addEventListener('change', requestRender);
        controls.addEventListener('start', requestRender);
        document.addEventListener('visibilitychange', () => { previous = 0; requestRender(); });
        about.addEventListener('close', requestRender);
        requestRender();
        // Click real geometry as well as its accessible HTML markers. Drags never activate apps.
        const ray = new T.Raycaster(), pointer = new T.Vector2(); let down = null;
        canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
        canvas.addEventListener('pointercancel', () => { down = null; });
        canvas.addEventListener('pointerup', e => {
            if (!appShelf.open || !down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { down = null; return; }
            down = null; const rect = canvas.getBoundingClientRect();
            pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1); ray.setFromCamera(pointer, camera);
            const hit = ray.intersectObject(world.root, true)[0];
            if (hit) { let object = hit.object; while (object && !object.userData.appId) object = object.parent; if (object?.userData.appId) selectApp(object.userData.appId); }
        });
        canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fallback('场景暂时休息，先看看这片山海。'); });
        canvas.addEventListener('webglcontextrestored', () => { stage.dataset.state = 'ready'; syncShelf(); document.getElementById('scene-tools').hidden = false; resize(); requestRender(); });
        addEventListener('pagehide', event => {
            cancelAnimationFrame(animationId); animationId = undefined; previous = 0;
            if (event.persisted) return;
            resizeObserver.disconnect(); controls.dispose(); world.dispose(); renderer.dispose();
        });
        addEventListener('pageshow', event => { if (event.persisted) { resize(); requestRender(); } });
    } catch (error) {
        console.warn('The 3D scene is unavailable; app navigation remains available.', error);
        resizeObserver?.disconnect(); controls?.dispose(); world?.dispose(); renderer?.dispose();
        fallback('当前显示静态景观。');
    }
}
startWorld();
