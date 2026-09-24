import * as T from 'three';
import { ISLAND, FOOTBALL_ISLAND } from './island-layout.js';

// Use the same coast profile as terrain and collisions. Distances are in world units,
// so both islands get the same continuous beach / lagoon / open-sea transition.
export function createOcean(root, waterMap) {
    const uniforms = {
        seaTime: { value: 0 },
        homeCoast: { value: new T.Vector4(ISLAND.x, ISLAND.z, ISLAND.radiusX, ISLAND.radiusZ) },
        awayCoast: { value: new T.Vector4(FOOTBALL_ISLAND.x, FOOTBALL_ISLAND.z, FOOTBALL_ISLAND.radiusX, FOOTBALL_ISLAND.radiusZ) },
        lagoonColor: { value: new T.Color('#39caba') },
        shelfColor: { value: new T.Color('#148fa8') },
        oceanColor: { value: new T.Color('#076187') },
    };
    const material = new T.MeshStandardMaterial({ map: waterMap, roughness: .48, metalness: .025, transparent: true, depthWrite: false });
    material.onBeforeCompile = shader => {
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = `varying vec2 seaPosition;\n${shader.vertexShader}`.replace('#include <begin_vertex>', '#include <begin_vertex>\nseaPosition = (modelMatrix * vec4(position, 1.0)).xz;');
        shader.fragmentShader = `
            varying vec2 seaPosition;
            uniform float seaTime;
            uniform vec4 homeCoast, awayCoast;
            uniform vec3 lagoonColor, shelfColor, oceanColor;
            float coastDistance(vec2 p, vec4 coast) {
                vec2 q = (p - coast.xy) / coast.zw;
                float a = atan(q.y, q.x);
                float r = 1.0 + .035 * sin(3.0*a+.6) + .035 * cos(5.0*a-.4) + .016 * sin(9.0*a);
                return (length(q) - r) * min(coast.z, coast.w);
            }
            float seaNoise(vec2 p) {
                return sin(p.x*.37+sin(p.y*.29))*sin(p.y*.43+cos(p.x*.19));
            }
            ${shader.fragmentShader}`.replace('#include <map_fragment>', `
                float shoreDistance = min(coastDistance(seaPosition, homeCoast), coastDistance(seaPosition, awayCoast));
                float depth = max(0.0, shoreDistance + seaNoise(seaPosition)*.65);
                vec3 seaColor = mix(lagoonColor, shelfColor, smoothstep(.3, 8.0, depth));
                seaColor = mix(seaColor, oceanColor, smoothstep(5.0, 22.0, depth));
                vec2 rippleUV = vMapUv + vec2(seaTime*.003, seaTime*.0018);
                float caustic = texture2D(map, rippleUV + .008*vec2(sin(seaPosition.y*.8+seaTime*.3), cos(seaPosition.x*.7-seaTime*.2))).g;
                float causticStrength = mix(.045, .75, 1.0-smoothstep(1.0, 10.0, depth));
                seaColor += vec3(.65, 1.0, .91) * (caustic-.42) * causticStrength;
                seaColor *= 1.0 + seaNoise(seaPosition*.42+seaTime*.012)*.035;
                // Broken, soft wash at the waterline, rather than concentric outlines.
                float wash = (1.0-smoothstep(.03, .23, abs(shoreDistance-.12-.10*sin(seaTime*.7+seaPosition.x*.5))))
                    * smoothstep(-.3, .65, seaNoise(seaPosition*3.0)) * .20;
                diffuseColor.rgb = mix(seaColor, vec3(.80,.95,.86), wash);
                diffuseColor.a = mix(.58, 1.0, smoothstep(.5, 11.0, depth));
            `);
    };
    const water = new T.Mesh(new T.PlaneGeometry(800, 800), material);
    water.name = 'depth-colored-open-sea'; water.rotation.x = -Math.PI/2;
    water.position.y = -1.075; water.receiveShadow = true; root.add(water);
    return { update(time, reduced) { uniforms.seaTime.value = reduced ? 0 : time; } };
}
