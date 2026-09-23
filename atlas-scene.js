import * as THREE from 'three';

/** A 2.5D enhancement of the authored map: paper relief, small parallax and moving sea. */
export async function startAtlasScene({ atlas, image, world }) {
    const canvas = document.getElementById('map-canvas');
    const toggle = document.getElementById('motion-toggle');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const portrait = matchMedia('(max-width: 700px), (max-aspect-ratio: 1/1)');
    let renderer, material, geometry, currentTexture, resizeObserver;
    let animationId, previous = 0, lastDraw = 0, time = 0;
    let moving = !reducedMotion.matches, modalOpen = !!document.querySelector('dialog[open]');
    let disposed = false, sourceVersion = 0, source = '';
    const target = new THREE.Vector2(), offset = new THREE.Vector2();
    const events = new AbortController();
    const uniforms = {
        uMap: { value: null }, uCrop: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 }, uPointer: { value: new THREE.Vector2() },
        uRelief: { value: new THREE.Vector2(.55, .74) },
    };
    function resetOffset() {
        target.set(0, 0); offset.set(0, 0); uniforms.uPointer.value.set(0, 0);
        world.style.setProperty('--map-x', '0px'); world.style.setProperty('--map-y', '0px');
    }
    function fallback(error) {
        cancelAnimationFrame(animationId); animationId = undefined; previous = 0;
        atlas.dataset.renderer = 'fallback'; toggle.hidden = true; resetOffset();
        if (error) console.warn('Map motion is unavailable; illustration and links remain usable.', error);
    }
    function syncToggle() {
        toggle.setAttribute('aria-pressed', String(!moving));
        toggle.querySelector('span').textContent = moving ? '暂停动效' : '播放动效';
        toggle.querySelector('img').src = `assets/vendor/bootstrap-icons/${moving ? 'pause' : 'play'}.svg`;
    }
    try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 2);
        camera.position.z = 1;
        geometry = new THREE.PlaneGeometry(2, 2);
        material = new THREE.ShaderMaterial({
            uniforms, depthTest: false, depthWrite: false, toneMapped: false,
            vertexShader: `varying vec2 vUv;
                void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
            fragmentShader: `
                uniform sampler2D uMap;
                uniform vec2 uCrop;
                uniform vec2 uPointer;
                uniform vec2 uRelief;
                uniform float uTime;
                varying vec2 vUv;
                void main() {
                    vec2 uv = (vUv - 0.5) * uCrop + 0.5;
                    vec4 base = texture2D(uMap, uv);
                    float sea = smoothstep(0.028, 0.08, min(base.g, base.b) - base.r)
                        * (1.0 - smoothstep(0.6, 0.8, base.g));
                    vec2 hill = (uv - uRelief) / vec2(0.24, 0.28);
                    float relief = exp(-dot(hill, hill) * 2.0) * (1.0 - sea);
                    uv += uPointer * relief * 0.0010;
                    vec2 wave = vec2(sin(uv.y * 145.0 + uTime * 0.5), cos(uv.x * 137.0 + uTime * 0.35));
                    uv += wave * sea * 0.00028;
                    vec4 color = texture2D(uMap, uv);
                    float shimmer = sin(uv.x * 280.0 + uv.y * 230.0 + uTime * 0.55);
                    color.rgb *= 1.0 + shimmer * sea * 0.008;
                    gl_FragColor = vec4(color.rgb, 1.0);
                    #include <colorspace_fragment>
                }`,
        });
        scene.add(new THREE.Mesh(geometry, material));
        function draw() {
            if (currentTexture && !disposed) renderer.render(scene, camera);
        }
        function resize() {
            const width = atlas.clientWidth, height = atlas.clientHeight;
            if (!width || !height) return;
            renderer.setSize(width, height, false);
            if (currentTexture) {
                const aspect = currentTexture.image.width / currentTexture.image.height;
                const viewportAspect = width / height;
                uniforms.uCrop.value.set(Math.min(1, viewportAspect / aspect), Math.min(1, aspect / viewportAspect));
                uniforms.uRelief.value.set(...(portrait.matches ? [.58, .56] : [.55, .74]));
                draw();
            }
        }
        function frame(now) {
            if (disposed || document.hidden || modalOpen || atlas.dataset.renderer !== 'ready') {
                animationId = undefined; previous = 0; return;
            }
            const delta = previous ? Math.min((now - previous) / 1000, .08) : 0;
            previous = now;
            if (moving) time += delta;
            if (now - lastDraw > 1000 / 30) {
                lastDraw = now;
                offset.lerp(target, .075);
                uniforms.uPointer.value.copy(offset);
                uniforms.uTime.value = time;
                world.style.setProperty('--map-x', `${(offset.x * 5).toFixed(2)}px`);
                world.style.setProperty('--map-y', `${(offset.y * 3).toFixed(2)}px`);
                draw();
            }
            if (moving || offset.distanceTo(target) > .001) animationId = requestAnimationFrame(frame);
            else { animationId = undefined; previous = 0; }
        }
        function requestFrame() {
            if (animationId === undefined && !disposed && !document.hidden && !modalOpen && atlas.dataset.renderer === 'ready') {
                animationId = requestAnimationFrame(frame);
            }
        }
        async function loadArtwork() {
            const url = image.currentSrc || image.src;
            if (!url || source === url) return;
            const version = ++sourceVersion; source = url;
            atlas.dataset.renderer = 'loading';
            try {
                const texture = await new THREE.TextureLoader().loadAsync(url);
                if (disposed || version !== sourceVersion) { texture.dispose(); return; }
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
                texture.generateMipmaps = false;
                currentTexture?.dispose(); currentTexture = texture; uniforms.uMap.value = texture;
                resize(); atlas.dataset.renderer = 'ready'; toggle.hidden = false; syncToggle(); requestFrame();
            } catch (error) { if (version === sourceVersion) fallback(error); }
        }
        resizeObserver = new ResizeObserver(resize); resizeObserver.observe(atlas);
        image.addEventListener('load', loadArtwork, { signal: events.signal });
        await loadArtwork();
        atlas.addEventListener('pointermove', event => {
            if (!moving || !finePointer.matches || event.pointerType === 'touch') return;
            const rect = atlas.getBoundingClientRect();
            target.set((event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1);
            requestFrame();
        }, { signal: events.signal, passive: true });
        atlas.addEventListener('pointerleave', () => { target.set(0, 0); requestFrame(); }, { signal: events.signal });
        toggle.addEventListener('click', () => {
            moving = !moving;
            if (!moving) resetOffset();
            syncToggle(); draw(); requestFrame();
        }, { signal: events.signal });
        reducedMotion.addEventListener('change', () => {
            moving = !reducedMotion.matches;
            if (!moving) resetOffset();
            syncToggle(); draw(); requestFrame();
        }, { signal: events.signal });
        document.addEventListener('atlas:modal', event => { modalOpen = event.detail.open; previous = 0; requestFrame(); }, { signal: events.signal });
        document.addEventListener('visibilitychange', () => { previous = 0; requestFrame(); }, { signal: events.signal });
        canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fallback(); }, { signal: events.signal });
        canvas.addEventListener('webglcontextrestored', () => { atlas.dataset.renderer = 'ready'; toggle.hidden = false; resize(); requestFrame(); }, { signal: events.signal });
        addEventListener('pagehide', event => {
            cancelAnimationFrame(animationId); animationId = undefined; previous = 0;
            if (event.persisted) return;
            disposed = true; events.abort(); resizeObserver.disconnect();
            currentTexture?.dispose(); material.dispose(); geometry.dispose(); renderer.dispose();
        }, { signal: events.signal });
        addEventListener('pageshow', event => { if (event.persisted) { resize(); requestFrame(); } }, { signal: events.signal });
    } catch (error) {
        events.abort(); resizeObserver?.disconnect(); currentTexture?.dispose();
        material?.dispose(); geometry?.dispose(); renderer?.dispose(); fallback(error);
    }
}
