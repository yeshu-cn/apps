import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
const palette = { grass: ['#9cad7c', '#a4b582', '#adb989', '#96a578'], stone: ['#a7ac95', '#bec0a5', '#c6c8b2', '#969f8c'], wood: '#b99869', dark: '#355348', snow: '#f2f3e8' };

/** An original alpine/coastal miniature, with deterministic geometry and named app locations. */
export function createPortfolioWorld() {
    let seed = 2116;
    const random = (a = 0, b = 1) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return a + seed / 4294967296 * (b - a); };
    const pick = (values) => values[Math.floor(random(0, values.length))];
    const materials = new Map();
    const material = (color) => {
        if (!materials.has(color)) materials.set(color, new T.MeshStandardMaterial({ color, roughness: .9, flatShading: true }));
        return materials.get(color);
    };
    const root = new T.Group(); root.name = '山海小世界';
    const anchors = {};
    const assembly = (name, appId, parent = root) => {
        const group = new T.Group(); group.name = name; parent.add(group);
        if (appId) group.userData.appId = appId;
        return group;
    };
    function mesh(parent, geometry, color, x = 0, y = 0, z = 0) {
        const object = new T.Mesh(geometry, typeof color === 'string' ? material(color) : color);
        object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
    }
    const box = (p, c, x, y, z, w, h, d) => mesh(p, new T.BoxGeometry(w, h, d), c, x, y, z);
    const cylinder = (p, c, x, y, z, top, bottom, h, sides = 8) => mesh(p, new T.CylinderGeometry(top, bottom, h, sides), c, x, y, z);
    const beam = (p, c, a, b, radius = .04, sides = 6) => {
        const object = cylinder(p, c, 0, 0, 0, radius, radius, a.distanceTo(b), sides);
        object.position.copy(a).add(b).multiplyScalar(.5); object.quaternion.setFromUnitVectors(V(0, 1), b.clone().sub(a).normalize()); return object;
    };
    function polygon(p, c, vertices, indices) {
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(vertices.flat(), 3)); geo.setIndex(indices); geo.computeVertexNormals();
        return mesh(p, geo, c);
    }
    function stone(p, x, y, z, size, c = pick(palette.stone)) {
        const s = mesh(p, new T.IcosahedronGeometry(1, 0), c, x, y, z);
        s.scale.set(size * random(.8, 1.3), size * random(.65, 1.1), size); s.rotation.set(random(0, 1), random(0, 6), random(0, 1)); return s;
    }
    const boundary = (angle) => 1 + .06 * Math.sin(angle * 3 + .4) + .025 * Math.cos(angle * 7);
    const bayDistance = (x, z) => Math.hypot((x - 2.1) / 2.14, (z - 1.65) / 1.62);
    function ground(x, z) {
        const plain = .44 + .13 * Math.cos(x * .6) + .10 * Math.sin(z * .7);
        return T.MathUtils.lerp(-.18, plain, T.MathUtils.smoothstep(bayDistance(x, z), .88, 1.20));
    }
    const land = assembly('岩层与草甸');
    // Concentric, irregular rings keep the cliffs volumetric from every view.
    const ringRadii = [.80, .94, 1.015, 1, 1], ringHeights = [-1.04, -.87, -.38, .06, null];
    const sideVertices = [], sideColors = [], sideIndices = [], segments = 78;
    for (let ring = 0; ring < ringRadii.length; ring++) {
        for (let i = 0; i <= segments; i++) {
            const angle = i / segments * Math.PI * 2, r = boundary(angle) * ringRadii[ring];
            const x = Math.cos(angle) * 4.9 * r, z = Math.sin(angle) * 3.65 * r;
            const y = ringHeights[ring] ?? ground(x, z);
            sideVertices.push(x, y + (ring === 4 ? 0 : random(-.10, .10)), z);
            const c = new T.Color(pick(ring > 2 ? ['#d5d1b5', '#ded7bc', '#c8cbb2'] : ['#b8baa4', '#c9c6ab', '#d2cdb1'])); sideColors.push(c.r, c.g, c.b);
            if (ring < 4 && i < segments) { const n = ring * (segments + 1) + i; sideIndices.push(n, n + 1, n + segments + 1, n + 1, n + segments + 2, n + segments + 1); }
        }
    }
    const sideGeo = new T.BufferGeometry(); sideGeo.setAttribute('position', new T.Float32BufferAttribute(sideVertices, 3)); sideGeo.setAttribute('color', new T.Float32BufferAttribute(sideColors, 3)); sideGeo.setIndex(sideIndices); sideGeo.computeVertexNormals();
    const terrainMaterial = new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true, side: T.DoubleSide }); mesh(land, sideGeo, terrainMaterial);
    const vertices = [], colors = [], indices = [], rings = 24;
    for (let j = 0; j <= rings; j++) for (let i = 0; i <= segments; i++) {
        const angle = i / segments * Math.PI * 2, r = j / rings * boundary(angle), x = Math.cos(angle) * 4.9 * r, z = Math.sin(angle) * 3.65 * r;
        vertices.push(x, ground(x, z), z);
        const d = bayDistance(x, z), c = new T.Color(pick(d < 1.17 ? ['#dfd9b4', '#e4ddbe', '#d8d3b1'] : palette.grass)); c.multiplyScalar(random(.97, 1.03)); colors.push(c.r, c.g, c.b);
        if (j < rings && i < segments) { const n = j * (segments + 1) + i; indices.push(n, n + segments + 1, n + 1, n + 1, n + segments + 1, n + segments + 2); }
    }
    const topGeo = new T.BufferGeometry(); topGeo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); topGeo.setAttribute('color', new T.Float32BufferAttribute(colors, 3)); topGeo.setIndex(indices); topGeo.computeVertexNormals(); mesh(land, topGeo, terrainMaterial);

    // Alpine ridge and its ski run are a continuous sculpted surface, not stacked cones.
    const ridge = assembly('雪山与滑雪道');
    function mountainHeight(x, z) {
        const peak = Math.max(0, 1 - Math.hypot((x + 2.28) / 1.77, (z + 1.52) / 1.60));
        const shoulder = Math.max(0, 1 - Math.hypot((x + 3.10) / 1.30, (z + .16) / 1.70));
        return ground(x, z) + Math.max(Math.min(3.08, 3.55 * peak ** .78), 1.75 * shoulder ** 1.12);
    }
    const mVertices = [], mColors = [], mIndices = [], mRings = 12, mSegments = 36;
    for (let j = 0; j <= mRings; j++) for (let i = 0; i <= mSegments; i++) {
        const a = i / mSegments * Math.PI * 2, r = j / mRings;
        const jitter = j > 0 && j < mRings ? random(.92, 1.08) : 1;
        const x = -2.58 + Math.cos(a) * 2.02 * r * jitter, z = -.72 + Math.sin(a) * 2.64 * r * jitter;
        const y = mountainHeight(x, z) + (j === 0 ? 0 : random(-.045, .045)); mVertices.push(x, y, z);
        const snow = y > 2.58 + .27 * Math.sin(a * 3), c = new T.Color(snow ? pick(['#f3f4ec', '#e5e9e1', '#f7f6ef']) : pick(['#a2ab97', '#aeb49e', '#929f8e', '#bec2ab'])); mColors.push(c.r, c.g, c.b);
        if (j < mRings && i < mSegments) { const n = j * (mSegments + 1) + i; mIndices.push(n, n + mSegments + 1, n + 1, n + 1, n + mSegments + 1, n + mSegments + 2); }
    }
    const mountainGeo = new T.BufferGeometry(); mountainGeo.setAttribute('position', new T.Float32BufferAttribute(mVertices, 3)); mountainGeo.setAttribute('color', new T.Float32BufferAttribute(mColors, 3)); mountainGeo.setIndex(mIndices); mountainGeo.computeVertexNormals(); const mountainSurface = mesh(ridge, mountainGeo, terrainMaterial);
    const surfaceRay = new T.Raycaster(V(), V(0, -1, 0));
    function slopeHeight(x, z) {
        surfaceRay.ray.origin.set(x, 12, z);
        const hit = surfaceRay.intersectObject(mountainSurface, false)[0];
        return Math.max(ground(x, z), hit?.point.y ?? ground(x, z));
    }
    function skiPoint(t) { const x = -2.3 - t * .72 + Math.sin(t * Math.PI * 2) * .44, z = -1.22 + t * 2.9; return V(x, slopeHeight(x, z) + .07, z); }
    const snowVertices = [], snowIndices = [];
    const snowColumns = 12;
    for (let i = 0; i <= 65; i++) {
        const t = i / 65, p = skiPoint(t), half = (.23 + .24 * Math.sin(t * Math.PI * .8)) * Math.sqrt(1 - T.MathUtils.smoothstep(t, .88, 1));
        // Subdivide across the run as well as along it so the snow follows the convex ridge.
        for (let j = 0; j <= snowColumns; j++) {
            const x = p.x + (j / snowColumns * 2 - 1) * half;
            snowVertices.push(x, slopeHeight(x, p.z) + .045, p.z);
            if (i < 65 && j < snowColumns) { const n = i * (snowColumns + 1) + j; snowIndices.push(n, n + snowColumns + 1, n + 1, n + 1, n + snowColumns + 1, n + snowColumns + 2); }
        }
    }
    polygon(ridge, palette.snow, Array.from({ length: snowVertices.length / 3 }, (_, i) => snowVertices.slice(i * 3, i * 3 + 3)), snowIndices).material.side = T.DoubleSide;
    // One broad, curving snowboard track instead of a pair of ski tracks.
    const trackPoints = Array.from({ length: 75 }, (_, i) => {
        const p = skiPoint(i / 74 * .90); p.y = slopeHeight(p.x, p.z) + .06; return p;
    });
    mesh(ridge, new T.TubeGeometry(new T.CatmullRomCurve3(trackPoints), 90, .014, 4, false), '#c9d6d1');
    const skiTrail = new T.CatmullRomCurve3(Array.from({ length: 151 }, (_, i) => skiPoint(i / 150)));
    const snowboarder = assembly('单板玩家');
    snowboarder.userData.sport = 'snowboarding';
    const board = assembly('一块单板', null, snowboarder);
    const boardVertices = [], boardIndices = [], outline = [];
    for (let i = 0; i < 24; i++) {
        const a = i / 24 * Math.PI * 2;
        const x = Math.cos(a) * .105, z = Math.sin(a) * .34;
        outline.push([x, .055 + T.MathUtils.smoothstep(Math.abs(z), .23, .34) * .055, z]);
    }
    for (const depth of [0, -.028]) for (const [x,y,z] of outline) boardVertices.push([x,y+depth,z]);
    for (let i = 1; i < 23; i++) { boardIndices.push(0,i+1,i,24,24+i,24+i+1); }
    for (let i = 0; i < 24; i++) { const next=(i+1)%24; boardIndices.push(i,next,24+i,next,24+next,24+i); }
    polygon(board, '#346c70', boardVertices, boardIndices).name = 'single-snowboard-deck';
    for (const side of [-1,1]) {
        const boot = box(snowboarder, '#3b4746', 0,.115,side*.13,.17,.085,.10); boot.rotation.y = side*.18;
        beam(snowboarder, '#3a5760', V(0,.14,side*.13), V(.08,.265,side*.12), .043);
        beam(snowboarder, '#3a5760', V(.08,.265,side*.12), V(-.015,.36,side*.045), .05);
        box(board, '#debe7d', 0,.086,side*.13,.19,.016,.11);
    }
    beam(snowboarder, '#d7814f', V(-.015,.335,0), V(.015,.53,.02), .095, 8);
    mesh(snowboarder, new T.SphereGeometry(.082,10,7), '#e8ecdf', .02,.63,.035);
    box(snowboarder, '#304e51', .057,.635,.082,.10,.045,.052);
    beam(snowboarder, '#d7814f', V(.015,.485,.02), V(.18,.39,.18), .032);
    beam(snowboarder, '#d7814f', V(.015,.485,.02), V(-.17,.42,-.17), .032);
    mesh(snowboarder, new T.SphereGeometry(.036,6,4), '#405956', .18,.39,.18);
    mesh(snowboarder, new T.SphereGeometry(.036,6,4), '#405956', -.17,.42,-.17);

    const forest = assembly('松林与岩石');
    function pine(x, z, size, snowy = false) {
        const y = Math.max(ground(x, z), mountainHeight(x, z));
        cylinder(forest, '#796e4f', x, y + size * .35, z, .038 * size, .06 * size, size * .72, 6);
        for (let tier = 0; tier < 4; tier++) {
            const width = size * (.34 - tier * .063), h = size * .44;
            const crown = mesh(forest, new T.ConeGeometry(width, h, 7), pick(['#47634b', '#57774e', '#6f8958', '#5e7953']), x, y + size * (.39 + tier * .18), z); crown.rotation.y = random(0, 6);
            if (snowy && tier < 3) { const cap = mesh(forest, new T.ConeGeometry(width * .72, h * .64, 7), '#e8eadd', x, crown.position.y + h * .15, z); cap.rotation.copy(crown.rotation); }
        }
    }
    for (const [x,z,s,snow] of [[-3.8,-1.5,1.03,1],[-3.35,-2.6,.85,1],[-1.20,-2.4,1.02,1],[-.80,-1.5,.72,0],[-4.0,-.20,.88,0],[-3.62,1.0,.66,0],[-1.1,.70,.52,0],[-.90,2.77,.67,0],[3.5,-1.8,.96,0],[2.9,-2.55,.78,0],[3.95,-.52,.63,0],[.32,-2.65,.77,0],[-3.15,2.1,.5,0]]) pine(x,z,s,!!snow);
    for (let i=0;i<58;i++) {
        const a=random(0,Math.PI*2),r=random(.85,.99),x=Math.cos(a)*4.6*r,z=Math.sin(a)*3.5*r;
        if(bayDistance(x,z)<1.1)continue;
        stone(forest,x,Math.max(ground(x,z),mountainHeight(x,z))+.05,z,random(.11,.30));
    }
    // Narrow stone path connects the studio, tent and waterfront.
    const garden=assembly('石径和花草');
    const pathCurve=new T.CatmullRomCurve3([V(-2.8,0,1.4),V(-1.4,0,1.25),V(-.3,0,.62),V(.4,0,-.15),V(1,0,-.30)]);
    for(let i=0;i<19;i++){const p=pathCurve.getPoint(i/18);const tile=stone(garden,p.x,ground(p.x,p.z)+.055,p.z,random(.11,.15),'#d4d6bd');tile.scale.y=.055;}
    for(let i=0;i<180;i++){
        const x=random(-4.1,4.1),z=random(-3,3);
        if((x/4.5)**2+(z/3.2)**2>1||bayDistance(x,z)<1.24||mountainHeight(x,z)>ground(x,z)+.12||x>.05&&x<2.6&&z<.1)continue;
        const y=ground(x,z);
        for(let k=0;k<3;k++){const a=random(0,6.28),h=random(.04,.11);polygon(garden,pick(['#739062','#8da478','#698d60']),[[x-.014,y,z],[x+.014,y,z],[x+Math.cos(a)*.04,y+h,z+Math.sin(a)*.04]],[0,1,2]).material.side=T.DoubleSide;}
        if(i%7===0)mesh(garden,new T.IcosahedronGeometry(.025,0),'#e9dfac',x,y+.10,z);
    }

    // Modern open A-frame workspace: deep roof, warm frame, readable interior.
    const studio=assembly('开发工作室','ledger'); studio.position.set(.8,ground(.8,-1.3),-1.3); studio.rotation.y=.32;
    const W=1.22,H=2.40,D=1.08;
    box(studio,'#a78b63',0,.16,0,2.72,.22,2.65);
    for(let i=0;i<18;i++)box(studio,pick(['#c6ac7e','#d3bb8e','#bfa275']),-1.26+i*.148,.292,0,.136,.044,2.57);
    polygon(studio,'#c4b28b',[[-W,.3,-D],[W,.3,-D],[0,H+.3,-D]],[0,1,2]);
    for(let i=0;i<13;i++){const x=-1.08+i*.18,maxY=H*(1-Math.abs(x)/W);if(maxY>.2)box(studio,'#ac9167',x,.3+maxY/2,-D+.02,.028,maxY,.07);}
    for(const sign of [-1,1]){
        polygon(studio,'#3e5550',[[sign*(W+.18),.26,-D-.16],[sign*(W+.18),.26,D+.22],[0,H+.4,-D-.16],[0,H+.4,D+.22]],[0,1,2,1,3,2]).material.side=T.DoubleSide;
        for(let i=0;i<11;i++){const z=-D-.13+i*.235;beam(studio,'#50655b',V(sign*(W+.18),.28,z),V(0,H+.43,z),.016,4);}
        beam(studio,'#d1ae73',V(sign*W,.3,D+.17),V(0,H+.28,D+.17),.074,4);
    }
    beam(studio,'#9caa8e',V(0,H+.43,-D-.19),V(0,H+.43,D+.27),.042,5);
    box(studio,'#bf9d65',0,1.28,.91,1.25,.10,.10);
    for(const x of [-.62,.62])box(studio,'#ba9b69',x,.77,.92,.07,.96,.07);
    box(studio,'#b59768',0,.77,.2,1.40,.075,.59);
    for(const x of [-.57,.57])for(const z of [-.05,.43])box(studio,'#776f4e',x,.49,z,.055,.50,.055);
    const laptop=assembly('写代码的电脑',null,studio);laptop.position.set(-.16,.83,.16);
    box(laptop,'#b7c0b3',0,0,0,.52,.026,.34);
    const screen=box(laptop,'#3d5850',0,.19,-.13,.54,.37,.031);screen.rotation.x=-.12;
    const screenMat=new T.MeshStandardMaterial({color:'#25544e',emissive:'#477267',emissiveIntensity:.3,roughness:.6});
    const display=mesh(laptop,new T.PlaneGeometry(.46,.29),screenMat,0,.19,-.106);display.rotation.x=-.12;
    for(let i=0;i<6;i++)box(laptop,i%2?'#c6bd86':'#8bbbaa',-.085+(i%2)*.03,.29-i*.04,-.086,.21-i*.016,.01,.008);
    box(studio,'#ddd9bd',.43,.827,.19,.19,.022,.26); // ledger notebook
    for(let i=0;i<4;i++)box(studio,'#929e83',.43,.841,.12+i*.04,.12,.004,.006);
    cylinder(studio,'#e5d9b7',.51,.9,-.03,.055,.044,.12,10);
    for(let i=0;i<3;i++)box(studio,'#c2a071',0,.23-i*.085,1.42+i*.16,.86,.08,.18);
    cylinder(studio,'#40574d',.76,2.10,-.72,.072,.072,1.47,8);cylinder(studio,'#506158',.76,2.86,-.72,.12,.12,.06,8);
    const shelf=box(studio,'#ac8d60',-.82,.78,-.77,.48,.055,.30);
    for(let i=0;i<5;i++)box(studio,pick(['#b66f51','#798971','#d0bf8e']),-.98+i*.078,.94,-.75,.055,.28,.17);
    anchors.ledger=V(.6,1.50,-.4);

    const camp=assembly('旅行营地','trip');camp.position.set(-2.73,ground(-2.73,1.35),1.35);camp.rotation.y=.18;
    const tentMat=material('#dba35f');tentMat.side=T.DoubleSide;
    polygon(camp,tentMat,[[-.69,.04,-.50],[-.69,.04,.62],[0,1.05,-.5],[0,1.05,.62],[.69,.04,-.50],[.69,.04,.62]],[0,1,2,1,3,2,2,3,4,3,5,4]);
    polygon(camp,'#b98451',[[-.68,.04,-.51],[.68,.04,-.51],[0,1.05,-.51]],[0,1,2]);
    polygon(camp,'#ecd0a0',[[-.69,.04,.63],[-.28,.04,.63],[0,1.05,.63],[.69,.04,.63],[.28,.04,.63]],[0,1,2,2,4,3]);
    box(camp,'#a08662',0,.05,.02,1.33,.055,1.15);
    for(const side of [-1,1]){beam(camp,'#ecd8ad',V(0,1.05,side*.56),V(0,.02,side*1.05),.007,4);cylinder(camp,'#685f45',0,.035,side*1.05,.025,.018,.11,5);}
    cylinder(camp,'#687e68',-.93,.17,.32,.12,.12,.28,8);box(camp,'#d5bd8b',.82,.13,.45,.28,.25,.30);anchors.trip=V(-2.85,1.00,1.80);

    const puzzle=assembly('数独小桌','sudoku');puzzle.position.set(-.65,ground(-.65,1.55),1.55);
    box(puzzle,'#bfa574',0,.42,0,.63,.065,.62);
    for(const x of [-.24,.24])for(const z of [-.24,.24])box(puzzle,'#8c7c55',x,.20,z,.045,.42,.045);
    box(puzzle,'#efead6',0,.468,0,.43,.024,.43);
    for(let i=0;i<4;i++){box(puzzle,'#637f70',-.215+i*.143,.483,0,.008,.004,.43);box(puzzle,'#637f70',0,.483,-.215+i*.143,.43,.004,.008);}
    for(const [x,z] of [[-.14,-.14],[0,.14],[.14,0]])box(puzzle,'#698d7a',x,.489,z,.045,.006,.048);anchors.sudoku=V(-.65,1.30,1.55);

    const workbench=assembly('拍尺工作台','imagesize');workbench.position.set(.76,ground(.76,.63),.63);workbench.rotation.y=.09;
    box(workbench,'#c9ae7f',0,.60,0,.94,.07,.58);
    for(const x of [-.36,.36])for(const z of [-.20,.20])box(workbench,'#a48d65',x,.30,z,.055,.60,.055);
    box(workbench,'#ebe6cc',-.06,.646,.01,.60,.015,.38);box(workbench,'#d6b561',.09,.662,.10,.56,.016,.064);
    for(let i=0;i<13;i++)box(workbench,'#746d50',-.16+i*.04,.673,.10,.009,.004,i%3?.03:.05);
    box(workbench,'#667f77',-.25,.668,-.09,.11,.027,.18);anchors.imagesize=V(.58,1.45,.68);

    const wardrobe=assembly('衣序衣架','yixu');wardrobe.position.set(2.56,ground(2.56,-.47),-.47);wardrobe.rotation.y=-.2;
    for(const x of [-.52,.52]){beam(wardrobe,'#a88b5c',V(x,0,-.19),V(x,1.2,0),.026);beam(wardrobe,'#a88b5c',V(x,0,.19),V(x,1.2,0),.026);}
    beam(wardrobe,'#bf9f70',V(-.59,1.19,0),V(.59,1.19,0),.031);
    for(let i=0;i<3;i++){
        const x=-.32+i*.32,color=['#d9ceb0','#56716a','#72898a'][i];
        beam(wardrobe,'#8c7b58',V(x,1.18,0),V(x,1.05,0),.009);
        polygon(wardrobe,color,[[x-.13,1.00,.02],[x-.19,.84,.02],[x-.13,.80,.02],[x-.09,.91,.02],[x-.10,.48,.02],[x+.10,.48,.02],[x+.09,.91,.02],[x+.13,.80,.02],[x+.19,.84,.02],[x+.13,1.00,.02]],[0,1,2,0,2,3,0,3,4,0,4,5,0,5,9,9,5,6,9,6,7,9,7,8]).material.side=T.DoubleSide;
    }anchors.yixu=V(2.58,1.91,-.55);

    const cameraSpot=assembly('潜彩相机','aquatrue');cameraSpot.position.set(2.89,ground(2.89,-.03),-.03);
    for(let i=0;i<3;i++){const a=i/3*Math.PI*2;beam(cameraSpot,'#596d62',V(0,.70,0),V(Math.cos(a)*.23,.02,Math.sin(a)*.23),.014);}
    box(cameraSpot,'#3c5651',0,.79,0,.35,.23,.18);box(cameraSpot,'#607b70',-.06,.93,0,.15,.075,.13);
    const lens=cylinder(cameraSpot,'#284644',0,.79,.16,.078,.079,.19,12);lens.rotation.x=Math.PI/2;
    const glass=mesh(cameraSpot,new T.CircleGeometry(.060,12),new T.MeshStandardMaterial({color:'#579a9c',metalness:.3,roughness:.22}),0,.79,.263);
    anchors.aquatrue=V(3.18,1.46,-.02);

    const waterGroup=assembly('潜水海湾','divejournal');
    const waterMaterial=new T.ShaderMaterial({uniforms:{uTime:{value:0},uDeep:{value:new T.Color('#328e94')},uShallow:{value:new T.Color('#83c7bd')}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform float uTime;uniform vec3 uDeep;uniform vec3 uShallow;void main(){vec2 p=vUv*2.-1.;float r=length(p);float wave=sin(p.x*38.+sin(p.y*27.+uTime*.6))*sin(p.y*35.-uTime*.45);vec3 col=mix(uDeep,uShallow,smoothstep(.1,1.,r));col+=pow(max(0.,wave),12.)*.09;col+=sin(p.x*9.+p.y*12.+uTime*.4)*.017;gl_FragColor=vec4(col,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`,side:T.DoubleSide});
    // Shader directives need a line boundary for GLSL preprocessing.
    waterMaterial.fragmentShader=waterMaterial.fragmentShader.replace(';#include',';\n#include');
    const water=mesh(waterGroup,new T.CircleGeometry(1,84),waterMaterial,2.1,.035,1.65);water.rotation.x=-Math.PI/2;water.scale.set(2.04,1.55,1);water.castShadow=false;
    for(let k=0;k<3;k++){
        const points=Array.from({length:81},(_,i)=>{const a=i/80*Math.PI*2,r=1+k*.025;return V(2.1+Math.cos(a)*2.04*r,.044,1.65+Math.sin(a)*1.55*r);});
        const foam=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:'#e4edd9',transparent:true,opacity:.40-k*.08}));waterGroup.add(foam);
    }
    // Pale seabed stones and the diving fins make the cove more than a plain water disk.
    for(let i=0;i<20;i++){const a=random(0,6.28),x=2.1+Math.cos(a)*2.18,z=1.65+Math.sin(a)*1.7;if(x>4.05)continue;stone(waterGroup,x,ground(x,z)+.07,z,random(.12,.25));}
    for(const side of [-1,1]){
        const fin=box(waterGroup,'#426b6c',.76+side*.09,ground(.76,1.18)+.075,1.18,.13,.045,.39);fin.rotation.y=-.35;
        const heel=mesh(waterGroup,new T.TorusGeometry(.035,.012,5,10),'#2e5658',.76+side*.09,fin.position.y+.036,1.01);heel.rotation.x=Math.PI/2;
    }
    const buoy=assembly('潜水浮标','divejournal');buoy.position.set(2.78,.035,2.12);
    cylinder(buoy,'#df8359',0,.11,0,.09,.15,.22,12);cylinder(buoy,'#f0eddb',0,.20,0,.086,.095,.075,12);cylinder(buoy,'#dc794e',0,.26,0,.025,.085,.10,10);beam(buoy,'#ae7959',V(0,.27,0),V(0,.52,0),.009);
    anchors.divejournal=V(2.6,.55,2.1);

    // Batch static geometry by material within each named assembly; app hit targets remain separate.
    function compact(group) {
        group.updateWorldMatrix(true,true); const inverse=group.matrixWorld.clone().invert(); const buckets=new Map(),remove=[];
        group.traverse(object=>{if(object.isMesh&&!Array.isArray(object.material)&&!object.material.isShaderMaterial){const geometry=object.geometry.clone();geometry.deleteAttribute('uv');geometry.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,object.matrixWorld));const key=object.material; if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(geometry);remove.push(object);}});
        for(const [mat,geometries] of buckets){const geometry=mergeGeometries(geometries,false);if(geometry){const combined=new T.Mesh(geometry,mat);combined.name=group.name;combined.castShadow=true;combined.receiveShadow=true;group.add(combined);}geometries.forEach(g=>g.dispose());}
        remove.forEach(object=>{object.removeFromParent();object.geometry.dispose();});
    }
    for(const group of [land,ridge,forest,garden,studio,camp,puzzle,workbench,wardrobe,cameraSpot,buoy])compact(group);
    root.userData.description='Original alpine/coastal developer landscape; no tropical island reconstruction.';
    return {root,anchors,update(time){waterMaterial.uniforms.uTime.value=time;buoy.position.y=.035+Math.sin(time*1.1)*.025;buoy.rotation.z=Math.sin(time*.7)*.04;const t=.32+.018*Math.sin(time*.3);const p=skiTrail.getPoint(t),ahead=skiTrail.getPoint(t+.01);snowboarder.position.copy(p);snowboarder.rotation.y=Math.atan2(ahead.x-p.x,ahead.z-p.z)+.24;snowboarder.rotation.z=Math.sin(time*.65)*.055;},dispose(){const geos=new Set(),mats=new Set();root.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)mats.add(o.material);});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());}};
}
