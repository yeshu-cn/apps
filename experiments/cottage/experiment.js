import * as T from 'three';
import { OrbitControls } from '../../assets/vendor/three/addons/controls/OrbitControls.js';
import { MeshoptDecoder } from './vendor/meshopt_decoder.mjs';
import { GLTFLoader } from '../../assets/vendor/three/addons/loaders/GLTFLoader.js';
import { createRoom } from '../../room-model.js?v=room-clear-20260923';
import { createIsland } from '../../room-island.js?v=lagoon-20260924';

const stage = document.getElementById('experiment');
const canvas = document.getElementById('experiment-canvas');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const dialog = document.getElementById('process');
const processButton = document.getElementById('process-button');
processButton.addEventListener('click', () => dialog.showModal());
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => processButton.focus());
dialog.addEventListener('click', event => { if (event.target !== dialog) return; const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close(); });
document.getElementById('retry').addEventListener('click', () => location.reload());

async function start() {
    const renderer = new T.WebGLRenderer({ canvas, antialias:true, powerPreference:'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
    const scene=new T.Scene();scene.background=new T.Color('#bed8cf');scene.fog=new T.Fog('#bed8cf',100,300);
    const camera=new T.PerspectiveCamera(42,1,.1,500);
    const controls=new OrbitControls(camera,canvas);controls.enableDamping=!reduced.matches;controls.dampingFactor=.10;controls.enablePan=false;
    controls.minPolarAngle=.35;controls.maxPolarAngle=1.43;controls.minDistance=4;controls.maxDistance=65;controls.target.set(0,2.5,.7);
    const ambient=new T.HemisphereLight('#f0f6ff','#93997b',1.35);scene.add(ambient);
    const sun=new T.DirectionalLight('#fff0d5',2.30);sun.position.set(26,37,21);sun.target.position.set(0,1,.7);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-17,right:17,top:17,bottom:-15,near:.1,far:100});sun.shadow.bias=-.0001;sun.shadow.normalBias=.025;sun.shadow.radius=3;scene.add(sun,sun.target);
    const fill=new T.DirectionalLight('#c7cedf',.45);fill.position.set(4,4,8);scene.add(fill);
    const homepage=await fetch('./').then(r=>{if(!r.ok)throw Error('Homepage unavailable');return r.text()});
    const links=[...new DOMParser().parseFromString(homepage,'text/html').querySelectorAll('.room-object')];
    const [original,island,craftedGLTF]=await Promise.all([createRoom(links,renderer,{exterior:'original'}),createIsland({craftedPorch:false}),new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('experiments/cottage/cottage.glb')]);
    original.setInterior(false);
    const crafted=craftedGLTF.scene;crafted.name='crafted-cottage';
    const materialRestore=new Map();
    for(const root of [original.root,crafted])root.traverse(object=>{
        if(object.isMesh){object.castShadow=object.receiveShadow=true;materialRestore.set(object,object.material);if(root===crafted){const mats=Array.isArray(object.material)?object.material:[object.material];mats.forEach(m=>{if(m.aoMap)m.aoMapIntensity=.5});}}
    });
    const clay=new T.MeshStandardMaterial({color:'#d8cdb5',roughness:.85});
    scene.add(island.root,original.root,crafted);original.root.visible=false;
    const views={
        whole:{target:[0,2.5,.7],offset:[13,10,18]},
        roof:{target:[0,5.2,.7],offset:[9,7,10]},
        window:{target:[-2.2,2,3.8],offset:[2,1.1,6.8]},
        porch:{target:[.7,1.9,4.0],offset:[3.4,1.7,7.0]},
    };
    let view='whole',sideLight=false,clayMode=false,frame=0,timer=0,disposed=false;
    const observer=new ResizeObserver(resize);observer.observe(stage);
    function frameView(){
        const preset=views[view],aspect=canvas.clientWidth/canvas.clientHeight;
        const scale=Math.max(1,.83/aspect);
        controls.target.fromArray(preset.target);camera.position.copy(controls.target).add(new T.Vector3(...preset.offset).multiplyScalar(scale));camera.zoom=1;camera.updateProjectionMatrix();
        const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=damping;requestFrame();
    }
    function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();frameView();}
    function draw(time){
        frame=0;if(disposed||document.hidden)return;
        controls.update();island.update(time/1000,reduced.matches,'sunny',1);renderer.render(scene,camera);
        if(!reduced.matches&&!frame)timer=setTimeout(()=>{timer=0;requestFrame()},1000/24);
    }
    function requestFrame(){clearTimeout(timer);timer=0;if(!frame&&!disposed&&!document.hidden)frame=requestAnimationFrame(draw);}
    controls.addEventListener('change',requestFrame);
    document.querySelectorAll('[data-model]').forEach(button=>{
        if(button.tagName!=='BUTTON')return;
        button.addEventListener('click',()=>{
            const isCrafted=button.dataset.model==='crafted';stage.dataset.model=button.dataset.model;
            original.root.visible=!isCrafted;crafted.visible=isCrafted;
            document.querySelectorAll('button[data-model]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
            document.getElementById('model-number').textContent=isCrafted?'B / 细节版':'A / 原版';
            document.getElementById('model-note').textContent=isCrafted?'逐片屋瓦、厚屋檐、凹入的门窗，\n再把材质与缝隙暗部烘焙进贴图。':'现有网页小屋，\n以基础几何体和简单材质搭建。';requestFrame();
        });
    });
    document.querySelectorAll('button[data-view]').forEach(button=>button.addEventListener('click',()=>{view=button.dataset.view;stage.dataset.view=view;document.querySelectorAll('button[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));frameView();}));
    document.getElementById('clay').addEventListener('click',event=>{clayMode=!clayMode;event.currentTarget.setAttribute('aria-pressed',String(clayMode));event.currentTarget.textContent=clayMode?'恢复材质':'只看造型';materialRestore.forEach((mat,object)=>{object.material=clayMode?clay:mat});stage.dataset.clay=String(clayMode);requestFrame();});
    document.getElementById('lighting').addEventListener('click',event=>{sideLight=!sideLight;event.currentTarget.setAttribute('aria-pressed',String(sideLight));event.currentTarget.textContent=sideLight?'恢复晴天':'换成侧光';sun.position.set(...(sideLight?[-22,14,24]:[26,37,21]));sun.color.set(sideLight?'#ffdb9d':'#fff0d5');sun.intensity=sideLight?2.1:2.30;ambient.intensity=sideLight?1.1:1.35;requestFrame();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);timer=0;cancelAnimationFrame(frame);frame=0}else requestFrame();});
    reduced.addEventListener('change',()=>{controls.enableDamping=!reduced.matches;requestFrame();});
    dialog.addEventListener('toggle',()=>{controls.enabled=!dialog.open;requestFrame();});
    addEventListener('pagehide',event=>{if(event.persisted)return;disposed=true;clearTimeout(timer);cancelAnimationFrame(frame);observer.disconnect();controls.dispose();materialRestore.forEach((mat,o)=>{o.material=mat});original.dispose();island.dispose();
        const geometries=new Set(),materials=new Set(),textures=new Set();crafted.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{materials.add(m);Object.values(m).forEach(v=>{if(v?.isTexture)textures.add(v)})})}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());clay.dispose();renderer.dispose();
    });
    resize();stage.dataset.state='ready';document.querySelector('.experiment-controls').inert=false;requestFrame();
}
start().catch(error=>{console.error('Cottage experiment failed:',error);stage.dataset.state='error';document.getElementById('error').hidden=false;});
