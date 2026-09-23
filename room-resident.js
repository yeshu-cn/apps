import * as T from 'three';
import { GLTFLoader } from './assets/vendor/three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from './assets/vendor/three/addons/environments/RoomEnvironment.js';
import { createFallbackResident } from './room-resident-fallback.js';

export const RESIDENT_MODELS = [
    { id: 'snowboarder', label: '轻装滑雪者', description: '熟悉的山系伙伴', file: 'snowboarder-web.glb?v=20260922', preview: 'snowboarder-preview.webp' },
    { id: 'alpine', label: '雪山探索者', description: '冰蓝雪服 · 橙色雪镜 · 登山背包', file: 'alpine-explorer-web.glb?v=gait-20260923', preview: 'alpine-preview.webp' },
];
const DEFAULT_RESIDENT_ID = 'alpine';
export function savedResident() {
    try { const id = localStorage.getItem('yeshu-resident'); if (RESIDENT_MODELS.some(model => model.id === id)) return id; } catch {}
    return DEFAULT_RESIDENT_ID;
}
const HEIGHT = 1.5;

export async function createResident(renderer, id = savedResident(), { allowFallback = true, heading = 0 } = {}) {
    const choice = RESIDENT_MODELS.find(model => model.id === id) || RESIDENT_MODELS.find(model => model.id === DEFAULT_RESIDENT_ID);
    let gltf;
    try {
        gltf = await new GLTFLoader().loadAsync(new URL(`./assets/models/${choice.file}`, import.meta.url).href);
    } catch (error) {
        if (!allowFallback) throw error;
        console.warn('The custom resident could not load; using the lightweight character.', error);
        return { ...createFallbackResident(), source: 'fallback', get heading() { return heading; }, greet: () => false };
    }
    const root = new T.Group(); root.name = 'island-resident';
    const visual = new T.Group(); visual.name = 'resident-heading'; root.add(visual);
    const model = gltf.scene; model.name = `${choice.id}-character`; visual.add(model);
    // The supplied PBR materials need reflected light, especially the helmet.
    const studio = new RoomEnvironment(), pmrem = new T.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(studio, .04);
    studio.dispose(); pmrem.dispose();
    const bounds = new T.Box3().setFromObject(model);
    const scale = HEIGHT / (bounds.max.y - bounds.min.y);
    model.scale.setScalar(scale);
    model.position.y = -bounds.min.y * scale;
    model.traverse(object => {
        if (!object.isMesh) return;
        object.castShadow = object.receiveShadow = true;
        for (const material of [].concat(object.material)) {
            material.envMap = environment.texture; material.envMapIntensity = .7;
            if (material.specularColor) material.specularColor.setRGB(1, 1, 1);
        }
        // The waving hand can move outside a skinned mesh's initial bounds.
        if (object.isSkinnedMesh) object.frustumCulled = false;
    });
    const mixer = new T.AnimationMixer(model);
    const actions = Object.fromEntries(gltf.animations.map(clip => [clip.name, mixer.clipAction(clip)]));
    let current = null, fading = 0, moving = false, yaw = heading, greetingYaw = null, wasReduced = null;
    function play(name) {
        const next = actions[name];
        if (!next || (current === next && next.isRunning())) return;
        next.reset().setEffectiveWeight(1).setEffectiveTimeScale(1);
        next.setLoop(name === 'Walk' ? T.LoopRepeat : T.LoopOnce, name === 'Walk' ? Infinity : 1);
        next.clampWhenFinished = true;
        if (current && current !== next) { current.fadeOut(.18); next.fadeIn(.18); }
        next.play(); current = next; fading = .18;
        root.userData.motion = name;
    }
    function rest(reduced) {
        play('Idle');
        if (reduced && current) { current.time = 0; current.paused = true; mixer.update(0); }
    }
    function finished(event) {
        if (event.action === actions.Wave && current === actions.Wave) { greetingYaw = null; rest(wasReduced); }
    }
    mixer.addEventListener('finished', finished);
    rest(false); mixer.update(0);
    return {
        root, source: choice.id,
        get heading() { return yaw; },
        greet(facing) {
            if (moving || current === actions.Wave && current.isRunning()) return false;
            greetingYaw = facing ?? yaw; play('Wave'); return true;
        },
        update(delta, state, reduced = false) {
            root.position.set(state.x, state.y, state.z);
            if (state.moving) {
                if (!moving) { greetingYaw = null; play('Walk'); }
                const distance = Math.hypot(state.dx, state.dz);
                actions.Walk.setEffectiveTimeScale(T.MathUtils.clamp(distance / Math.max(delta, .001) / 1.4, .4, 2.4));
            } else if (moving || wasReduced !== reduced && current === actions.Idle) rest(reduced);
            moving = state.moving; wasReduced = reduced;
            const targetYaw = state.aboard ? state.heading : moving ? Math.atan2(state.dx, state.dz) : greetingYaw ?? yaw;
            const turn = Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw));
            yaw += turn * (1 - Math.exp(-delta * 16)); visual.rotation.y = yaw;
            mixer.update(delta);
            if (fading > 0) {
                fading = Math.max(0, fading - delta);
                if (!fading) Object.values(actions).forEach(action => { if (action !== current) action.stop(); });
            }
            // Ambient breathing completes one cycle after an interaction, then rendering can sleep.
            return fading > 0 || Math.abs(turn) > .001 || Boolean(current?.isRunning());
        },
        dispose() {
            mixer.removeEventListener('finished', finished); mixer.stopAllAction(); mixer.uncacheRoot(model);
            const geometries = new Set(), materials = new Set(), textures = new Set(), images = new Set(), skeletons = new Set();
            model.traverse(object => {
                if (object.geometry) geometries.add(object.geometry);
                if (object.skeleton) skeletons.add(object.skeleton);
                for (const material of object.material ? [].concat(object.material) : []) materials.add(material);
            });
            materials.forEach(material => { Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); }); material.dispose(); });
            textures.delete(environment.texture); environment.dispose();
            textures.forEach(texture => { if (texture.image?.close) images.add(texture.image); texture.dispose(); });
            images.forEach(bitmap => bitmap.close()); geometries.forEach(geometry => geometry.dispose()); skeletons.forEach(skeleton => skeleton.dispose());
        },
    };
}
