import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const mount = document.querySelector('#game');
const mode = document.body.dataset.mode || 'world';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 260);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.35));
renderer.outputColorSpace = THREE.SRGBColorSpace;
mount.appendChild(renderer.domElement);

const clock = new THREE.Clock();
scene.add(new THREE.HemisphereLight(0xd7efff, 0x65704d, 1.6));
const sunLight = new THREE.DirectionalLight(0xfff0d2, 1.8);
sunLight.position.set(-35, 65, 25); scene.add(sunLight);

if (mode === 'planet') {
  makePlanetScene();
} else {
  makeVoxelWorld();
}

function makePlanetScene() {
  const planet = document.body.dataset.planet || 'earth';
  scene.background = new THREE.Color(0x030817);
  scene.fog = new THREE.Fog(0x030817, 90, 220);
  const configs = {
    earth: [0x2875c7, 7], moon: [0x999999, 5.5], sun: [0xffa51e, 10]
  };
  const [color, radius] = configs[planet] || configs.earth;
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32),
    new THREE.MeshStandardMaterial({ color, roughness: planet === 'sun' ? 1 : .92, emissive: planet === 'sun' ? 0xff6a00 : 0x000000, emissiveIntensity: planet === 'sun' ? 1.2 : 0 }));
  scene.add(sphere);
  if (planet === 'earth') {
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.012, 32, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .09, wireframe: true }));
    scene.add(clouds);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1.7, 20, 16), new THREE.MeshStandardMaterial({ color: 0xb8b8b8 }));
    moon.position.set(19, 2, -7); scene.add(moon);
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(19, .035, 5, 100), new THREE.MeshBasicMaterial({ color: 0x7795ba }));
    orbit.rotation.x = Math.PI / 2; scene.add(orbit);
    scene.userData.moon = moon;
  }
  const starGeo = new THREE.BufferGeometry(), pts = [];
  for (let i=0;i<900;i++) pts.push((Math.random()-.5)*400,(Math.random()-.5)*300,(Math.random()-.5)*400);
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts,3));
  scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xffffff,size:.55})));
  camera.position.set(0, 3, radius * 3.3);
  camera.lookAt(0,0,0);
  document.querySelector('#help').textContent = 'Sichqoncha yoki sensor bilan qarang · Yer sahifasida Oy orbitada aylanadi';
  document.querySelector('#coords').textContent = planet.toUpperCase() + ' — kosmik ko‘rinish';
  document.querySelector('#space-btn').textContent = '← Asosiy dunyo';
  document.querySelector('#space-btn').onclick = () => location.href = 'index.html';
  document.querySelector('#hotbar').style.display = 'none';
  document.querySelector('#mobile-controls').style.display = 'none';
  document.querySelector('#space-btn').style.pointerEvents = 'auto';
  window.addEventListener('pointermove', e => {
    if (e.buttons) { camera.position.applyAxisAngle(new THREE.Vector3(0,1,0), -e.movementX*.002); }
  });
  window.addEventListener('keydown', e => { if(e.key==='Escape') location.href='index.html'; });
  animatePlanet();
}

function makeVoxelWorld() {
  scene.background = new THREE.Color(0x83c8f2);
  scene.fog = new THREE.Fog(0x83c8f2, 38, 112);
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(3.5, 12, 8), new THREE.MeshBasicMaterial({color:0xffe9a0}));
  sunBall.position.set(-65,75,-100); scene.add(sunBall);
  const mats = {
    grass: new THREE.MeshLambertMaterial({color:0x68a64a}),
    dirt: new THREE.MeshLambertMaterial({color:0x80512e}),
    stone: new THREE.MeshLambertMaterial({color:0x858b91}),
    wood: new THREE.MeshLambertMaterial({color:0x79502e}),
    sand: new THREE.MeshLambertMaterial({color:0xd8c27d}),
    leaf: new THREE.MeshLambertMaterial({color:0x347b39})
  };
  const cube = new THREE.BoxGeometry(1,1,1), CHUNK=12, RENDER=3;
  const chunks = new Map(), edits = new Map();
  const blockKey=(x,y,z)=>`${x},${y},${z}`, chunkKey=(x,z)=>`${x},${z}`;
  function hash(x,z){const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n)}
  function heightAt(x,z){return Math.max(2,Math.min(14,Math.floor(6+Math.sin(x*.055)*2.1+Math.cos(z*.047)*2+(hash(Math.floor(x/4),Math.floor(z/4))-.5)*2)))}
  function base(x,y,z){const h=heightAt(x,z);if(y>h)return null;if(y===h)return h<4?'sand':'grass';if(y>h-3)return 'dirt';return 'stone'}
  function blockAt(x,y,z){const k=blockKey(x,y,z);return edits.has(k)?edits.get(k):base(x,y,z)}
  function buildChunk(cx,cz){
    const id=chunkKey(cx,cz);if(chunks.has(id))return;
    const buckets={grass:[],dirt:[],stone:[],sand:[],wood:[],leaf:[]};
    for(let lx=0;lx<CHUNK;lx++)for(let lz=0;lz<CHUNK;lz++){
      const x=cx*CHUNK+lx,z=cz*CHUNK+lz,h=heightAt(x,z);
      for(let y=Math.max(0,h-5);y<=h;y++){const t=blockAt(x,y,z);if(t)buckets[t].push([x,y,z]);}
      if(hash(x+900,z-300)>.988 && h>5){
        for(let y=h+1;y<=h+4;y++)buckets.wood.push([x,y,z]);
        for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=2;dy<=5;dy++)
          if(Math.abs(dx)+Math.abs(dz)+Math.abs(dy-3)<=4 && hash(x+dx,z+dz+dy)>.12)buckets.leaf.push([x+dx,h+dy,z+dz]);
      }
    }
    const group=new THREE.Group();group.userData.chunk=id;
    for(const [type,positions] of Object.entries(buckets)){
      if(!positions.length)continue;
      const mesh=new THREE.InstancedMesh(cube,mats[type],positions.length),o=new THREE.Object3D();
      positions.forEach((p,i)=>{o.position.set(...p);o.updateMatrix();mesh.setMatrixAt(i,o.matrix)});
      mesh.instanceMatrix.needsUpdate=true;mesh.userData={cx,cz,positions,type};group.add(mesh);
    }
    scene.add(group);chunks.set(id,group);
  }
  function removeChunk(cx,cz){const id=chunkKey(cx,cz),g=chunks.get(id);if(g){scene.remove(g);g.traverse(o=>{if(o.geometry!==cube)o.geometry?.dispose?.()});chunks.delete(id)}}
  function rebuild(cx,cz){removeChunk(cx,cz);buildChunk(cx,cz)}
  const player={x:0,y:10,z:0,vy:0,yaw:0,pitch:0,onGround:false};
  function updateChunks(){
    const px=Math.floor(player.x/CHUNK),pz=Math.floor(player.z/CHUNK),wanted=new Set();
    for(let x=-RENDER;x<=RENDER;x++)for(let z=-RENDER;z<=RENDER;z++){const cx=px+x,cz=pz+z,id=chunkKey(cx,cz);wanted.add(id);buildChunk(cx,cz)}
    for(const [id] of chunks)if(!wanted.has(id)){const [cx,cz]=id.split(',').map(Number);removeChunk(cx,cz)}
  }
  const keys={};let selected='grass',locked=false,lastChunk='';
  document.addEventListener('keydown',e=>{keys[e.code]=true;if(/^Digit[1-5]$/.test(e.code)){const b=document.querySelectorAll('.slot')[Number(e.code.slice(5))-1];b?.click()}});
  document.addEventListener('keyup',e=>keys[e.code]=false);
  renderer.domElement.addEventListener('click',()=>{if(innerWidth>700)renderer.domElement.requestPointerLock?.()});
  document.addEventListener('pointerlockchange',()=>locked=document.pointerLockElement===renderer.domElement);
  document.addEventListener('mousemove',e=>{if(locked){player.yaw-=e.movementX*.0022;player.pitch=Math.max(-1.4,Math.min(1.4,player.pitch-e.movementY*.0022))}});
  document.querySelectorAll('.slot').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.slot').forEach(x=>x.classList.remove('active'));b.classList.add('active');selected=b.dataset.block}));
  const ray=new THREE.Raycaster();ray.far=7;
  function findTarget(){ray.setFromCamera(new THREE.Vector2(0,0),camera);const all=[];chunks.forEach(g=>g.children.forEach(m=>all.push(m)));const hit=ray.intersectObjects(all,false)[0];if(!hit)return null;const p=hit.point.clone().addScaledVector(hit.face.normal,-.02);return {x:Math.round(p.x),y:Math.round(p.y),z:Math.round(p.z),n:hit.face.normal.clone()}}
  function edit(place){const b=findTarget();if(!b)return;if(place){const x=Math.round(b.x+b.n.x),y=Math.round(b.y+b.n.y),z=Math.round(b.z+b.n.z);edits.set(blockKey(x,y,z),selected);rebuild(Math.floor(x/CHUNK),Math.floor(z/CHUNK))}else{edits.set(blockKey(b.x,b.y,b.z),null);rebuild(Math.floor(b.x/CHUNK),Math.floor(b.z/CHUNK))}}
  document.addEventListener('mousedown',e=>{if(e.button===0)edit(false);if(e.button===2)edit(true)});document.addEventListener('contextmenu',e=>e.preventDefault());
  document.querySelector('#mine').onclick=()=>edit(false);document.querySelector('#place').onclick=()=>edit(true);
  document.querySelector('#jump').onclick=()=>{if(player.onGround)player.vy=8};
  document.querySelectorAll('[data-move]').forEach(b=>{const code={forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD'}[b.dataset.move];b.addEventListener('pointerdown',e=>{e.preventDefault();keys[code]=true});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>keys[code]=false))});
  document.querySelector('#space-btn').onclick=()=>document.querySelector('#space-menu').classList.remove('hidden');
  document.querySelector('#close-space').onclick=()=>document.querySelector('#space-menu').classList.add('hidden');
  function animateWorld(){
    requestAnimationFrame(animateWorld);const dt=Math.min(clock.getDelta(),.04);
    const f=(keys.KeyW?1:0)-(keys.KeyS?1:0),s=(keys.KeyD?1:0)-(keys.KeyA?1:0),speed=keys.ShiftLeft?8:5;
    player.x+=(Math.sin(player.yaw)*f+Math.cos(player.yaw)*s)*speed*dt;
    player.z+=(Math.cos(player.yaw)*f-Math.sin(player.yaw)*s)*speed*dt;
    player.vy-=19*dt;player.y+=player.vy*dt;
    const floor=heightAt(Math.round(player.x),Math.round(player.z))+1.8;
    if(player.y<floor){player.y=floor;player.vy=0;player.onGround=true}else player.onGround=false;
    if((keys.Space||keys.KeyE)&&player.onGround){player.vy=8;keys.Space=false;keys.KeyE=false}
    camera.position.set(player.x,player.y+.3,player.z);camera.rotation.order='YXZ';camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;
    const ck=chunkKey(Math.floor(player.x/CHUNK),Math.floor(player.z/CHUNK));if(ck!==lastChunk){lastChunk=ck;updateChunks()}
    document.querySelector('#coords').textContent=`X: ${Math.floor(player.x)} · Y: ${Math.floor(player.y)} · Z: ${Math.floor(player.z)}`;
    renderer.render(scene,camera);
  }
  updateChunks();player.y=heightAt(0,0)+2;animateWorld();
}

function animatePlanet(){
  requestAnimationFrame(animatePlanet);
  const dt=Math.min(clock.getDelta(),.05);
  const p=scene.children.find(o=>o.isMesh && o.geometry.type==='SphereGeometry');
  if(p)p.rotation.y+=dt*.04;
  if(scene.userData.moon){const m=scene.userData.moon;m.position.applyAxisAngle(new THREE.Vector3(0,1,0),dt*.12)}
  renderer.render(scene,camera);
}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.35))});
setTimeout(()=>{const el=document.querySelector('#loading');if(el){el.style.opacity='0';setTimeout(()=>el.remove(),500)}},800);
