import * as T from 'three';
import { ISLAND, FOOTBALL_ISLAND, PALMS, FOOTBALL_PALMS, ROCKS, coastPoint } from './island-layout.js';

// Shared instanced geometry keeps the richer coast inexpensive on phones.
export function createCoastalDetails(root, sandMap) {
    const batches = new Map(), transform = new T.Object3D();
    const leafGeometry = new T.SphereGeometry(1, 8, 5);
    const stoneGeometry = new T.IcosahedronGeometry(1, 1);
    const broadLeaf = new T.BufferGeometry();
    broadLeaf.setAttribute('position', new T.Float32BufferAttribute([
        0,0,0, -.36,.46,0, 0,.52,.16, .36,.46,0, 0,1.15,-.05,
    ],3));
    broadLeaf.setIndex([0,1,2,0,2,3,1,4,2,2,4,3]); broadLeaf.computeVertexNormals();
    const stemGeometry = new T.CylinderGeometry(.65, 1, 1, 6);
    function instance(kind, geometry, color, position, scale, rotation = [0, 0, 0]) {
        // Keep the entire low planting envelope outside the cottage walls.
        if ((kind.startsWith('garden-') || kind === 'broad-coastal-leaf') && Math.abs(position[0]) < 6.3 && position[2] > -3.7 && position[2] < 5.1) return;
        const key = `${kind}/${color}`;
        if (!batches.has(key)) batches.set(key, { kind, geometry, color, items: [] });
        batches.get(key).items.push({ position, scale, rotation });
    }
    const greens = ['#327940', '#549943', '#80b448'];
    const beds = [...PALMS.map(([x,z]) => [x,z]), ...FOOTBALL_PALMS.map(([x,z]) => [x,z]),
        [-7.4,-2.7], [-7.5,1], [7.8,-4.0], [21,-5.9], [18.8,11.2], [-6,12.5], [12.8,13.5]];
    beds.forEach(([x,z], n) => {
        for (let j=0;j<4;j++) {
            const a=j*2.4+n, bx=x+Math.cos(a)*(.35+j*.23), bz=z+Math.sin(a)*(.35+j*.23);
            const size=.55+(n+j)%3*.16;
            instance('garden-shrub', leafGeometry, greens[(n+j)%3], [bx,-.12+size*.27,bz], [size*.75,size*.45,size*.65]);
            for (let k=0;k<5;k++) {
                const angle=k*Math.PI*2/5+n;
                instance('broad-coastal-leaf',broadLeaf,greens[k%3],
                    [bx,-.2,bz], [1.45,1.18+(k%3)*.18,1.45], [.65,angle,.12*Math.sin(k)]);
            }
            if ((n+j)%3===0) for(let k=0;k<3;k++) {
                instance('garden-flower-stem',stemGeometry,'#4d8455',
                    [bx+Math.cos(k*2.1)*.26,.20+size*.125,bz+Math.sin(k*2.1)*.26],[.022,.74+size*.25,.022]);
                instance('garden-flower',leafGeometry, ['#efae72','#f0d989','#da8095'][n%3],
                    [bx+Math.cos(k*2.1)*.26,.57+size*.25,bz+Math.sin(k*2.1)*.26],[.13,.10,.13]);
            }
        }
    });
    // Small stones collect around existing boulders, away from the walking paths.
    ROCKS.forEach(([x,z,s],n)=>{
        for(let j=0;j<3;j++) instance('beach-pebbles',stoneGeometry,'#c3c6a9',
            [x+Math.cos(j*2.2+n)*s*1.4,-.25,z+Math.sin(j*2.2+n)*s], [.18+j*.06,.12+j*.04,.22+j*.06]);
    });
    function distanceToCoast(x,z,island) {
        const dx=(x-island.x)/island.radiusX,dz=(z-island.z)/island.radiusZ;
        const a=Math.atan2(dz,dx);
        const r=1+.035*Math.sin(3*a+.6)+.035*Math.cos(5*a-.4)+.016*Math.sin(9*a);
        return (Math.hypot(dx,dz)-r)*Math.min(island.radiusX,island.radiusZ);
    }
    function seaDepth(x,z) {
        return Math.max(0,Math.min(distanceToCoast(x,z,ISLAND),distanceToCoast(x,z,FOOTBALL_ISLAND)));
    }
    const seabedY=(x,z)=>-1.2-seaDepth(x,z)*.36;
    // One continuous seabed avoids overlapping island aprons and their visible seams.
    const floorGeometry=new T.PlaneGeometry(220,220,220,220);
    floorGeometry.rotateX(-Math.PI/2); floorGeometry.translate(20,0,-10);
    const positions=floorGeometry.attributes.position, uv=floorGeometry.attributes.uv, colors=[];
    const sandColor=new T.Color('#d7dfb8'), deepColor=new T.Color('#438e91');
    for(let i=0;i<positions.count;i++) {
        const x=positions.getX(i),z=positions.getZ(i),depth=seaDepth(x,z);
        positions.setY(i,seabedY(x,z));uv.setXY(i,x/5,z/5);
        const color=sandColor.clone().lerp(deepColor,T.MathUtils.smoothstep(depth,0,16));
        colors.push(color.r,color.g,color.b);
    }
    floorGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));floorGeometry.computeVertexNormals();
    const floor=new T.Mesh(floorGeometry,new T.MeshStandardMaterial({map:sandMap,vertexColors:true,roughness:1}));
    floor.name='continuous-lagoon-seabed';floor.receiveShadow=true;root.add(floor);
    const rand=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
    [ISLAND,FOOTBALL_ISLAND].forEach((island,islandIndex)=>{
        const patches=[.13,.47,.91,1.97,2.35,2.94,3.35,4.08,4.36,5.3,5.85];
        patches.forEach((angle,n)=>{
            for(let cluster=0;cluster<3+n%4;cluster++) {
                const seed=n*37+cluster*7+islandIndex*1000;
                const a=angle+(rand(seed)-.5)*.21;
                const radius=1.08+rand(seed+1)*.30;
                const p=coastPoint(a,radius,island), y=seabedY(p.x,p.z);
                const scale=.45+rand(seed+2)*.8;
                instance('reef-rock',stoneGeometry,'#649b91',[p.x,y+.15,p.z],[scale,.24,scale*.72],[0,n,0]);
                for(let j=0;j<4;j++) {
                    const bx=p.x+Math.cos(j*2.4+n)*scale*.6,bz=p.z+Math.sin(j*2.4+n)*scale*.6;
                    const base=seabedY(bx,bz), h=Math.min(.35+rand(seed+j)*.35,-1.14-base);
                    const color=['#438da8','#bc709c','#cca46b','#388e80'][(n+j)%4];
                    if(j%2===0) {
                        instance('plate-coral',leafGeometry,color,[bx,base+h*.5,bz],[scale*.55,.09,scale*.45]);
                        instance('plate-coral',leafGeometry,color,[bx+.12,base+h*.7,bz+.07],[scale*.35,.07,scale*.3]);
                    } else for(let k=0;k<4;k++) {
                        instance('coral-finger',stemGeometry,color,[bx+(k-1.5)*.13,base+h*.5,bz+(k%2)*.14],
                            [.07,h-(k%2)*.08,.07],[.1*Math.sin(n+k),0,.12*Math.cos(j+k)]);
                    }
                }
            }
        });
    });
    for(const batch of batches.values()) {
        const material=new T.MeshStandardMaterial({color:batch.color,roughness:.88,flatShading:batch.geometry===stoneGeometry,side:batch.geometry===broadLeaf?T.DoubleSide:T.FrontSide});
        const mesh=new T.InstancedMesh(batch.geometry,material,batch.items.length);mesh.name=batch.kind;
        batch.items.forEach((item,i)=>{transform.position.set(...item.position);transform.scale.set(...item.scale);transform.rotation.set(...item.rotation);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);});
        mesh.castShadow=!batch.kind.includes('coral');mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);
    }
}
