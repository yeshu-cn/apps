import * as T from 'three';
import { FERRY_STOPS } from './island-layout.js?v=ferry-20260923';

// The route skirts the cottage's southern and eastern shore before reaching the other pier.
export const FERRY_ROUTE = [[10, 21.65], [11, 25.5], [23, 26], [33, 17], [35, 4], [38, -3], [38, -7.7]];

export function createFerry({ sea, player }) {
    const route = new T.CatmullRomCurve3(FERRY_ROUTE.map(([x, z]) => new T.Vector3(x, 0, z)));
    const state = { phase: 'moored', at: 'home', to: null, progress: 0 };
    let elapsed = 0, start = new T.Vector3();
    const position = new T.Vector3();
    const aboard = () => state.phase !== 'moored';
    const nearby = () => {
        const dock = FERRY_STOPS[state.at].dock;
        return !player.state.indoors && player.state.island === state.at && Math.hypot(player.state.x - dock.x, player.state.z - (dock.end - .9)) < 1.65;
    };
    function seat() { return position.copy(sea.boat.position).add(new T.Vector3(0, .055, -.06)); }
    function interact() {
        if (state.phase === 'moored' && nearby()) {
            start.set(player.state.x, player.state.y, player.state.z);
            state.to = state.at === 'home' ? 'football' : 'home'; state.phase = 'boarding'; state.progress = 0; elapsed = 0;
            player.ride(start, sea.boat.rotation.y + Math.PI); return true;
        }
        if (state.phase === 'arrived') {
            start.set(player.state.x, player.state.y, player.state.z); state.phase = 'landing'; elapsed = 0; return true;
        }
        return false;
    }
    function update(delta, paused) {
        if (!aboard() || paused) return false;
        elapsed += delta;
        if (state.phase === 'boarding') {
            const t = Math.min(1, elapsed / .65);
            const target = seat().clone(); position.copy(start).lerp(target, T.MathUtils.smoothstep(t, 0, 1)); position.y += Math.sin(t * Math.PI) * .16;
            player.ride(position, sea.boat.rotation.y + Math.PI);
            if (t === 1) { state.phase = 'sailing'; elapsed = 0; sea.setMooring(null); }
        } else if (state.phase === 'sailing') {
            state.progress = Math.min(1, elapsed / 14);
            const t = T.MathUtils.smoothstep(state.progress, 0, 1), u = state.to === 'football' ? t : 1 - t;
            const point = route.getPointAt(u), tangent = route.getTangentAt(u).multiplyScalar(state.to === 'football' ? 1 : -1);
            sea.boat.position.x = point.x; sea.boat.position.z = point.z;
            sea.boat.rotation.y = Math.atan2(-tangent.x, -tangent.z);
            player.ride(seat(), sea.boat.rotation.y + Math.PI);
            if (state.progress === 1) { state.at = state.to; state.phase = 'arrived'; sea.setMooring(state.at); }
        } else if (state.phase === 'arrived') {
            player.ride(seat(), sea.boat.rotation.y + Math.PI);
        } else if (state.phase === 'landing') {
            const dock = FERRY_STOPS[state.at].dock, t = Math.min(1, elapsed / .65);
            position.copy(start).lerp(new T.Vector3(dock.x, dock.top + .045, dock.end - .9), T.MathUtils.smoothstep(t, 0, 1)); position.y += Math.sin(t * Math.PI) * .16;
            player.ride(position, sea.boat.rotation.y + Math.PI);
            if (t === 1) { player.disembark(state.at, dock); state.phase = 'moored'; state.to = null; state.progress = 0; }
        }
        return state.phase !== 'arrived' && state.phase !== 'moored';
    }
    return { state, nearby, interact, update, get aboard() { return aboard(); }, get stop() { return FERRY_STOPS[state.at]; }, get destination() { return FERRY_STOPS[state.to || (state.at === 'home' ? 'football' : 'home')]; } };
}
