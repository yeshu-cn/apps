import * as T from 'three';

const WEATHER = {
    sunny: { label: '晴天', symbol: '☀', dim: 1, clouds: 2 },
    cloudy: { label: '多云', symbol: '☁', dim: .63, clouds: 7 },
    rainy: { label: '小雨', symbol: '☂', dim: .42, clouds: 9 },
};
const localMinute = () => { const now = new Date(); return now.getHours() * 60 + now.getMinutes(); };
const clockText = minute => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(Math.floor(minute % 60)).padStart(2, '0')}`;
const palettes = [
    [0, '#152d48', '#adc6ed', '#617689', '#b1c9ff'],
    [5, '#283d5b', '#a9a3bf', '#465163', '#b9caff'],
    [6, '#d4b5a0', '#ffe0b5', '#92907e', '#ffb975'],
    [8, '#bed8cf', '#f7ecd7', '#819f8d', '#ffe4bb'],
    [15.5, '#bed8cf', '#f7ecd7', '#819f8d', '#ffe4bb'],
    [18, '#bd9390', '#f8c7a6', '#91756c', '#ffab6e'],
    [19, '#596880', '#b5b6d6', '#57607b', '#c7cbff'],
    [20.5, '#152d48', '#adc6ed', '#617689', '#b1c9ff'],
    [24, '#152d48', '#adc6ed', '#617689', '#b1c9ff'],
].map(([hour, ...colors]) => ({ hour, colors: colors.map(color => new T.Color(color)) }));

export function createWeather({ scene, renderer, ambient, sun, fill, room, stage, requestFrame }) {
    const panel = document.getElementById('island-weather');
    const slider = document.getElementById('island-time');
    const reset = document.getElementById('island-time-reset');
    const clock = document.getElementById('island-clock');
    const timeLabel = document.getElementById('island-time-label');
    const listeners = [];
    function listen(target, name, handler) { target.addEventListener(name, handler); listeners.push(() => target.removeEventListener(name, handler)); }
    let weather = 'sunny', manualMinute = null, renderedState = '', disposed = false;
    const sky = new T.Color(), cloudTint = new T.Color(), cloudDay = new T.Color('#fff5df'), gray = new T.Color('#879ba5');
    const root = new T.Group(); root.name = 'island-weather'; scene.add(root);
    const cloudMaterial = new T.MeshStandardMaterial({ color: '#fff5dd', roughness: 1, transparent: true, opacity: .83, depthWrite: false });
    const cloudGeometry = new T.SphereGeometry(1, 12, 8), clouds = [];
    // Peripheral clouds leave the cottage and walking route open to view.
    const cloudLocations = [[-18, 11, -11], [46, 13, -43], [-18, 14, 12], [28, 15, 17], [3, 16, -22], [39, 13, -1], [-23, 17, -4], [17, 18, -21], [3, 16, 27]];
    cloudLocations.forEach(([x, y, z], i) => {
        const group = new T.Group(); group.position.set(x, y, z); group.name = `weather-cloud-${i}`;
        for (let j = 0; j < 5; j++) {
            const puff = new T.Mesh(cloudGeometry, cloudMaterial);
            puff.position.set((j - 2) * 1.02, j % 2 * .38, Math.sin(j * 2) * .35);
            puff.scale.set(1.48, .60 + j % 2 * .30, .93); group.add(puff);
        }
        root.add(group); clouds.push(group);
    });
    const count = 440, rainVertices = new Float32Array(count * 6), seeds = [];
    // Deterministic positions avoid a different rain pattern on every reload.
    for (let i = 0; i < count; i++) seeds.push({ x: -18 + ((i * .61803398875) % 1) * 51, z: -17 + ((i * .41421356237) % 1) * 46, y: ((i * .73205080757) % 1) * 18 });
    const rainGeometry = new T.BufferGeometry(); rainGeometry.setAttribute('position', new T.BufferAttribute(rainVertices, 3));
    const rain = new T.LineSegments(rainGeometry, new T.LineBasicMaterial({ color: '#d3e5eb', transparent: true, opacity: .40, depthWrite: false }));
    rain.name = 'island-rain'; rain.frustumCulled = false; root.add(rain);
    const lamps = [], emissives = new Map();
    room.root.traverse(object => {
        if (object.isPointLight) lamps.push([object, object.intensity]);
        const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
        for (const material of materials) if (material.emissiveIntensity && material.emissive?.getHex()) emissives.set(material, material.emissiveIntensity);
    });
    function syncUI(minute) {
        const text = clockText(minute), state = `${text}/${weather}/${manualMinute === null}`;
        if (state === renderedState) return; renderedState = state;
        clock.textContent = text; clock.dateTime = text; timeLabel.textContent = text;
        slider.value = String(minute); slider.setAttribute('aria-valuetext', text);
        document.getElementById('weather-current').textContent = WEATHER[weather].label;
        panel.querySelector('.weather-symbol').textContent = weather === 'sunny' && (minute < 360 || minute >= 1140) ? '☾' : WEATHER[weather].symbol;
        document.getElementById('island-time-mode').textContent = manualMinute === null ? '跟随本地时间' : '正在预览';
        reset.hidden = manualMinute === null;
        panel.querySelectorAll('[data-weather]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.weather === weather)));
        stage.dataset.weather = weather; stage.dataset.time = text;
    }
    panel.querySelectorAll('[data-weather]').forEach(button => listen(button, 'click', () => { weather = button.dataset.weather; requestFrame(); }));
    listen(slider, 'input', () => { manualMinute = Number(slider.value); requestFrame(); });
    listen(reset, 'click', () => { manualMinute = null; slider.focus({ preventScroll: true }); requestFrame(); });
    listen(panel, 'toggle', () => document.dispatchEvent(new CustomEvent('room:environment', { detail: { open: panel.open } })));
    listen(document, 'pointerdown', event => { if (panel.open && !panel.contains(event.target)) panel.open = false; });
    listen(panel, 'keydown', event => { if (event.key === 'Escape') { panel.open = false; panel.querySelector('summary').focus(); event.stopPropagation(); } });
    const timer = setInterval(() => { if (manualMinute === null && !document.hidden && !disposed) requestFrame(); }, 15000);
    function update(time, reduced, indoors) {
        const minute = manualMinute ?? localMinute(), hour = minute / 60;
        syncUI(minute);
        const next = palettes.findIndex(palette => palette.hour > hour), a = palettes[next - 1], b = palettes[next];
        const mix = T.MathUtils.smoothstep(hour, a.hour, b.hour);
        sky.copy(a.colors[0]).lerp(b.colors[0], mix);
        if (weather !== 'sunny') sky.lerp(gray, weather === 'rainy' ? .38 : .20);
        ambient.color.copy(a.colors[1]).lerp(b.colors[1], mix);
        ambient.groundColor.copy(a.colors[2]).lerp(b.colors[2], mix);
        sun.color.copy(a.colors[3]).lerp(b.colors[3], mix);
        const altitude = Math.sin((hour - 6) / 12 * Math.PI);
        const daylight = T.MathUtils.smoothstep(altitude, -.23, .55), dim = WEATHER[weather].dim;
        ambient.intensity = (.85 + daylight * .95) * (indoors ? .76 : 1) * (.8 + dim * .2);
        sun.intensity = (Math.max(0, altitude) * 2.05 + Math.max(0, -altitude) * .42) * dim * (indoors ? .65 : 1);
        sun.position.set(7 - Math.cos((hour - 6) / 12 * Math.PI) * 38, Math.max(8, Math.abs(altitude) * 43), 21);
        fill.intensity = .35 + daylight * .30; fill.color.set(daylight > .3 ? '#c7cedf' : '#adcaff');
        renderer.setClearColor(sky, 1); scene.fog.color.copy(sky);
        renderer.toneMappingExposure = .91 + daylight * .14;
        stage.dataset.night = String(daylight < .27);
        for (const [light, base] of lamps) light.intensity = base * (.45 + (1 - daylight) * .8);
        emissives.forEach((base, material) => { material.emissiveIntensity = base * (.55 + (1 - daylight) * 2.2); });
        cloudTint.set('#91a3bd').lerp(cloudDay, daylight);
        if (weather === 'rainy') cloudTint.lerp(gray, .55);
        cloudMaterial.color.copy(cloudTint);
        clouds.forEach((cloud, i) => {
            cloud.visible = !indoors && i < WEATHER[weather].clouds;
            cloud.position.x = cloudLocations[i][0] + (reduced ? 0 : Math.sin(time * .025 + i) * 2.1);
        });
        rain.visible = weather === 'rainy' && !indoors;
        if (rain.visible) {
            const t = reduced ? 0 : time;
            seeds.forEach((seed, i) => {
                const y = ((seed.y - t * 8.5) % 18 + 18) % 18;
                rainVertices.set([seed.x, y, seed.z, seed.x + .10, y - .42, seed.z + .03], i * 6);
            });
            rainGeometry.attributes.position.needsUpdate = true;
        }
        return { weather, daylight };
    }
    panel.hidden = false;
    return {
        update,
        get open() { return panel.open; },
        setAvailable(available) { panel.hidden = !available; if (!available) panel.open = false; },
        dispose() {
            disposed = true; clearInterval(timer); listeners.forEach(remove => remove());
            root.removeFromParent(); cloudGeometry.dispose(); cloudMaterial.dispose(); rainGeometry.dispose(); rain.material.dispose(); panel.hidden = true;
        },
    };
}
