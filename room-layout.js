// One footprint drives the interior, exterior and walking boundaries.
export const CABIN = { width: 10, depth: 6.1, sideX: 4.91, frontZ: 3.74, backZ: -2.26, centerZ: .70, height: 4.26, wallThickness: .18 };
// Shared architecture: the two front windows flank the actual entry door.
export const CABIN_WINDOWS = [
    { id: 'front-left', wall: 'front', x: -2.21, z: 3.74, width: 2.38, sill: 1.17, height: 1.87, yaw: 0 },
    { id: 'front-right', wall: 'front', x: 2.79, z: 3.74, width: 1.54, sill: 1.30, height: 1.65, yaw: 0 },
    { id: 'right', wall: 'right', x: CABIN.sideX, z: .70, width: 2.30, sill: 1.28, height: 2.06, yaw: Math.PI / 2 },
    { id: 'left', wall: 'left', x: -CABIN.sideX, z: -.05, width: 2.35, sill: 1.22, height: 2.40, yaw: -Math.PI / 2 },
];
export const CABIN_DOOR = { left: .025, right: 1.375, sill: 0, top: 2.75, door: true };
export const DESK = { x: -1.63, z: -1.54, width: 3.36, height: 1.18, depth: 1.19 };
export const WORKBENCH = { x: CABIN.sideX - .93, z: .55, width: 2.88, height: 1.10, depth: 1.62, yaw: -Math.PI / 2 };
export const BOOKCASE = { x: 1.62, z: -1.88, bottom: .05, width: 1.85, height: 2.35, depth: .46, yaw: 0 };
// The bed turns counterclockwise into the front-left corner, beside the door wall.
export const BED = { x: -CABIN.sideX + 1.57, z: CABIN.frontZ - .95, width: 1.65, length: 2.85, height: .70, headHeight: 1.18, yaw: Math.PI / 2 };
export const ENTRY_POTS = [[-CABIN.sideX - .75, 3.8], [CABIN.sideX + .70, 3.5]];
export const INDOOR_PROPS = {
    chair: { x: -1.56, z: -.10 },
    plant: { x: CABIN.sideX - .62, z: -1.69 },
    lamp: { x: CABIN.sideX - .62, z: 2.65 },
    snowboard: { x: -CABIN.sideX + .46, z: -.60 },
};
export const ROOM_VIEW = {
    target: [0, 1.65, .70], home: [5.8, 6.6, 10.4],
    halfHeight: 4.65, halfWidth: 6.45, minDistance: 9, maxDistance: 20,
};
