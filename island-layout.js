// Shared world dimensions keep the rendered shore and the walking boundary together.
export const ISLAND = { x: 7, z: 2, radiusX: 22, radiusZ: 17 };
export const FOOTBALL_ISLAND = { x: 40, z: -23, radiusX: 17, radiusZ: 13 };
export const DOCK = { x: 8, start: 15.7, end: 22.55, width: 1.8, top: -.2575 };
export const FOOTBALL_DOCK = { x: 40, start: -13.7, end: -6.8, width: 1.8, top: -.2575 };
export const FOOTBALL_PALMS = [[32, -31.8, 4.8, -.25], [47.3, -32.3, 5.1, .3], [53.5, -27, 4.2, .2]];
export const FERRY_STOPS = {
    home: { label: '小屋岛', dock: DOCK, berth: [10, 21.65], mooring: [8.8, 20.3] },
    football: { label: '足球岛', dock: FOOTBALL_DOCK, berth: [38, -7.7], mooring: [39.2, -9.05] },
};
export function coastPoint(angle, scale = 1, island = ISLAND) {
    const r = 1 + .035 * Math.sin(3 * angle + .6) + .035 * Math.cos(5 * angle - .4) + .016 * Math.sin(9 * angle);
    return { x: island.x + Math.cos(angle) * island.radiusX * r * scale, z: island.z + Math.sin(angle) * island.radiusZ * r * scale };
}
export const PALMS = [[-6.5, -3.8, 5.25, -.25], [-9, 6.8, 5.8, -.4], [12.5, -7.8, 6.8, .7], [16.1, -7.0, 5.6, -.3], [22.4, 1.7, 6.3, .5], [19.1, 4.2, 5.1, -.4], [7.0, 12.0, 5.3, -.5], [-4.0, 12.0, 4.8, .4]];
export const ROCKS = [[-11, 1.2, .8], [-11.7, 2.3, .55], [21, -7.2, 1.6], [22.9, -6.8, 1.1], [20.1, -9.1, .9], [24.0, 6.3, 1.0], [-4.0, 14.1, .8], [-5.3, 13.9, .6], [13.8, 13.0, .8], [16.5, 12.8, 1.1]];
export function islandTerrain(island = ISLAND) {
    const count = 96, rings = [[0, -.285], [.80, -.285], [.89, -.39], [.96, -.76], [1, -1.09], [1.04, -1.38]];
    const positions = [], uvs = [], indices = [];
    for (const [radius, y] of rings) for (let i = 0; i <= count; i++) {
        const point = coastPoint(i / count * Math.PI * 2, radius, island);
        positions.push(point.x, y, point.z); uvs.push(point.x / 4, point.z / 4);
    }
    for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < count; i++) {
        const a = r * (count + 1) + i, b = a + count + 1;
        if (r) indices.push(a, a + 1, b);
        indices.push(a + 1, b + 1, b);
    }
    return { positions: new Float32Array(positions), uvs: new Float32Array(uvs), indices: new Uint32Array(indices) };
}
