import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const $ = (s) => document.querySelector(s);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, .1, 240);
const renderer = new THREE.WebGLRenderer({ antialias:false, powerPreference:'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.35));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
$('#game').appendChild(renderer.domElement);

const clock = new THREE.Clock();
if (document.body.dataset.mode === 'planet') {
  runPlanetScene();
} else {
  runVoxelGame();
}

function runPlanetScene() {
  const name = document.body.dataset.planet || 'earth';
  scene.background = new THREE.Color(0x030817);
  scene.fog = new THREE.Fog(0x030817, 130, 360);
  scene.add(new THREE.AmbientLight(0x8194b5, .55));
  const keyLight = new THREE.PointLight(0xffffff, 2.5, 500); keyLight.position.set(35,25,40); scene.add(keyLight);
  const settings = {earth:[0x2875c7,13],moon:[0x999999,9],sun:[0xff9b21,18]};
  const [color,radius] = settings[name] || settings.earth;
  const planet = new THREE.Mesh(new THREE.SphereGeometry(radius,56,40),new THREE.MeshStandardMaterial({color,roughness:name==='sun'?1:.95,emissive:name==='sun'?0xff5a00:0x000000,emissiveIntensity:name==='sun'?1.1:0}));
  scene.add(planet);
  if(name==='earth'){
    const moon = new THREE.Mesh(new THREE.SphereGeometry(3.1,24,18),new THREE.MeshStandardMaterial({color:0xb8bdc5}));
    moon.position.set(35,3,-10);scene.add(moon);scene.userData.orbitMoon=moon;
    const ring=new THREE.Mesh(new THREE.TorusGeometry(35,.045,6,120),new THREE.MeshBasicMaterial({color:0x647d9c}));
    ring.rotation.x=Math.PI/2;scene.add(ring);
    const clouds=new THREE.Mesh(new THREE.SphereGeometry(radius*1.018,40,28),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.08,wireframe:true}));scene.add(clouds);
  }
  const starPositions=[];for(let i=0;i<1400;i++)starPositions.push((Math.random()-.5)*700,(Math.random()-.5)*500,(Math.random()-.5)*700);
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
  scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xffffff,size:.7})));
  let yaw=0,pitch=.1,dist=radius*3.8,drag=false,px=0,py=0;
  function updateCamera(){pitch=Math.max(-1.35,Math.min(1.35,pitch));camera.position.set(Math.sin(yaw)*Math.cos(pitch)*dist,Math.sin(pitch)*dist,Math.cos(yaw)*Math.cos(pitch)*dist);camera.lookAt(0,0,0)}
  renderer.domElement.addEventListener('pointerdown',e=>{drag=true;px=e.clientX;py=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId)});
  renderer.domElement.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-px)*.005;pitch+=(e.clientY-py)*.005;px=e.clientX;py=e.clientY;updateCamera()});
  renderer.domElement.addEventListener('pointerup',()=>drag=false);
  renderer.domElement.addEventListener('pointercancel',()=>drag=false);
  renderer.domElement.addEventListener('wheel',e=>{dist=Math.max(radius*1.8,Math.min(radius*8,dist+e.deltaY*.025));updateCamera()},{passive:true});
  updateCamera();
  function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05);planet.rotation.y+=dt*.035;if(scene.userData.orbitMoon)scene.userData.orbitMoon.position.applyAxisAngle(new THREE.Vector3(0,1,0),dt*.09);renderer.render(scene,camera)}
  loop();
  window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
  return;
}

function runVoxelGame() {
const hemi = new THREE.HemisphereLight(0xd7efff, 0x65704d, 1.25); scene.add(hemi);
const sunLight = new THREE.DirectionalLight(0xffe4b4, 1.45); sunLight.position.set(-30,55,25); scene.add(sunLight);

// Voxel terrain: only nearby chunks are generated and kept in memory.
const CHUNK=12, VIEW=3, cubeGeo=new THREE.BoxGeometry(1,1,1);
const chunks=new Map(), edits=new Map();
const mats={
 grass:new THREE.MeshLambertMaterial({color:0x68a64a}),
 dirt:new THREE.MeshLambertMaterial({color:0x80512e}),
 stone:new THREE.MeshLambertMaterial({color:0x858b91}),
 wood:new THREE.MeshLambertMaterial({color:0x79502e}),
 sand:new THREE.MeshLambertMaterial({color:0xd8c27d}),
 leaf:new THREE.MeshLambertMaterial({color:0x347b39})
};
const k3=(x,y,z)=>`${x},${y},${z}`, kc=(x,z)=>`${x},${z}`;
function hash(x,z){const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n)}
function terrain(x,z){return Math.max(2,Math.min(14,Math.floor(6+Math.sin(x*.055)*2.1+Math.cos(z*.047)*2+(hash(Math.floor(x/4),Math.floor(z/4))-.5)*2)))}
function baseBlock(x,y,z){const h=terrain(x,z);if(y>h)return null;if(y===h)return h<4?'sand':'grass';if(y>h-3)return'dirt';return'stone'}
function blockAt(x,y,z){const k=k3(x,y,z);return edits.has(k)?edits.get(k):baseBlock(x,y,z)}
function buildChunk(cx,cz){
 const id=kc(cx,cz);if(chunks.has(id))return;
 const groups={grass:[],dirt:[],stone:[],sand:[],wood:[],leaf:[]};
 for(let lx=0;lx<CHUNK;lx++)for(let lz=0;lz<CHUNK;lz++){
  const x=cx*CHUNK+lx,z=cz*CHUNK+lz,h=terrain(x,z);
  for(let y=Math.max(0,h-5);y<=h;y++){const t=blockAt(x,y,z);if(t)groups[t].push([x,y,z])}
  if(hash(x+900,z-300)>.988&&h>5){
   for(let y=h+1;y<=h+4;y++)groups.wood.push([x,y,z]);
   for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=2;dy<=5;dy++)
    if(Math.abs(dx)+Math.abs(dz)+Math.abs(dy-3)<=4&&hash(x+dx,z+dz+dy)>.12)groups.leaf.push([x+dx,h+dy,z+dz]);
  }
 }
 const group=new THREE.Group();group.userData.chunk=id;
 for(const [type,positions] of Object.entries(groups)){
  if(!positions.length)continue;
  const mesh=new THREE.InstancedMesh(cubeGeo,mats[type],positions.length),obj=new THREE.Object3D();
  positions.forEach((p,i)=>{obj.position.set(p[0],p[1],p[2]);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix)});
  mesh.instanceMatrix.needsUpdate=true;mesh.userData={cx,cz,type};group.add(mesh);
 }
 scene.add(group);chunks.set(id,group);
}
function removeChunk(cx,cz){const id=kc(cx,cz),g=chunks.get(id);if(g){scene.remove(g);chunks.delete(id)}}
function rebuildChunk(cx,cz){removeChunk(cx,cz);buildChunk(cx,cz)}
const player={x:0,y:9,z:0,vy:0,yaw:0,pitch:0,onGround:false};
let lastChunk='',selected='grass',locked=false;
const keys={};
function updateChunks(){
 const px=Math.floor(player.x/CHUNK),pz=Math.floor(player.z/CHUNK),wanted=new Set();
 for(let x=-VIEW;x<=VIEW;x++)for(let z=-VIEW;z<=VIEW;z++){const cx=px+x,cz=pz+z,id=kc(cx,cz);wanted.add(id);buildChunk(cx,cz)}
 for(const [id] of chunks)if(!wanted.has(id)){const [cx,cz]=id.split(',').map(Number);removeChunk(cx,cz)}
}

// Simple voxel character model, visible in third-person.
const avatar=new THREE.Group();
const skin=new THREE.MeshLambertMaterial({color:0xe0ad83}), shirt=new THREE.MeshLambertMaterial({color:0x315d9a}), pants=new THREE.MeshLambertMaterial({color:0x303847});
function part(w,h,d,mat,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);avatar.add(m);return m}
part(.65,.75,.38,shirt,0,1.25,0);part(.48,.48,.42,skin,0,1.88,0);
part(.22,.7,.25,pants,-.17,.55,0);part(.22,.7,.25,pants,.17,.55,0);
part(.2,.65,.22,skin,-.44,1.28,0);part(.2,.65,.22,skin,.44,1.28,0);
scene.add(avatar);

// Rocket model next to spawn point.
const rocket=new THREE.Group();
const metal=new THREE.MeshStandardMaterial({color:0xe7edf2,metalness:.45,roughness:.35});
const red=new THREE.MeshStandardMaterial({color:0xd94b3f,metalness:.15,roughness:.5});
const glass=new THREE.MeshStandardMaterial({color:0x4e9dc7,metalness:.4,roughness:.2});
const body=new THREE.Mesh(new THREE.CylinderGeometry(.48,.58,4.8,10),metal);body.position.y=2.4;rocket.add(body);
const nose=new THREE.Mesh(new THREE.ConeGeometry(.48,1.25,10),red);nose.position.y=5.42;rocket.add(nose);
const windowMesh=new THREE.Mesh(new THREE.SphereGeometry(.25,12,10),glass);windowMesh.position.set(0,3.6,.47);rocket.add(windowMesh);
for(let i=0;i<3;i++){const fin=new THREE.Mesh(new THREE.BoxGeometry(.12,1.1,.8),red);fin.position.set(Math.cos(i*2.094)*.48,.75,Math.sin(i*2.094)*.48);fin.rotation.y=-i*2.094;rocket.add(fin)}
const flame=new THREE.Mesh(new THREE.ConeGeometry(.34,1.1,8),new THREE.MeshBasicMaterial({color:0xffa12b}));flame.position.y=-.55;flame.rotation.z=Math.PI;rocket.add(flame);
rocket.position.set(5,terrain(5,0)+.5,0);scene.add(rocket);
const rocketBase=rocket.position.clone();
let launching=false,launchTime=0;
const fireLight=new THREE.PointLight(0xff8c36,0,10);rocket.add(fireLight);

const ray=new THREE.Raycaster();ray.far=7;
function targetBlock(){ray.setFromCamera(new THREE.Vector2(0,0),camera);const meshes=[];chunks.forEach(g=>g.children.forEach(m=>meshes.push(m)));const hit=ray.intersectObjects(meshes,false)[0];if(!hit)return null;const p=hit.point.clone().addScaledVector(hit.face.normal,-.02);return{x:Math.round(p.x),y:Math.round(p.y),z:Math.round(p.z),normal:hit.face.normal.clone()}}
function editBlock(place){if(launching)return;const b=targetBlock();if(!b)return;if(place){const x=Math.round(b.x+b.normal.x),y=Math.round(b.y+b.normal.y),z=Math.round(b.z+b.normal.z);edits.set(k3(x,y,z),selected);rebuildChunk(Math.floor(x/CHUNK),Math.floor(z/CHUNK))}else{edits.set(k3(b.x,b.y,b.z),null);rebuildChunk(Math.floor(b.x/CHUNK),Math.floor(b.z/CHUNK))}}
function selectBlock(el){document.querySelectorAll('.slot').forEach(x=>x.classList.remove('active'));el.classList.add('active');selected=el.dataset.block}
document.querySelectorAll('.slot').forEach((b)=>b.addEventListener('click',()=>selectBlock(b)));
document.addEventListener('keydown',e=>{keys[e.code]=true;if(/^Digit[1-5]$/.test(e.code))document.querySelectorAll('.slot')[Number(e.code.slice(5))-1]?.click();if(e.code==='KeyE')tryLaunch()});
document.addEventListener('keyup',e=>keys[e.code]=false);
document.addEventListener('pointerlockchange',()=>locked=document.pointerLockElement===renderer.domElement);
renderer.domElement.addEventListener('click',()=>{if(innerWidth>700&&!locked)renderer.domElement.requestPointerLock?.()});
document.addEventListener('mousemove',e=>{if(locked){player.yaw-=e.movementX*.0025;player.pitch=Math.max(-.55,Math.min(.55,player.pitch-e.movementY*.002))}});
let touchLook=null;
renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touchLook={x:e.clientX,y:e.clientY,id:e.pointerId}});
renderer.domElement.addEventListener('pointermove',e=>{if(touchLook&&e.pointerType==='touch'&&e.pointerId===touchLook.id){const dx=e.clientX-touchLook.x,dy=e.clientY-touchLook.y;player.yaw-=dx*.006;player.pitch=Math.max(-.55,Math.min(.55,player.pitch-dy*.004));touchLook.x=e.clientX;touchLook.y=e.clientY}});
['pointerup','pointercancel','pointerleave'].forEach(ev=>renderer.domElement.addEventListener(ev,()=>touchLook=null));
document.addEventListener('mousedown',e=>{if(e.button===0)editBlock(false);if(e.button===2)editBlock(true)});
document.addEventListener('contextmenu',e=>e.preventDefault());
$('#mine').onclick=()=>editBlock(false);$('#place').onclick=()=>editBlock(true);
$('#jump').onclick=()=>{if(player.onGround)player.vy=8};
document.querySelectorAll('[data-move]').forEach(b=>{const code={forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD'}[b.dataset.move];b.addEventListener('pointerdown',e=>{e.preventDefault();keys[code]=true});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>keys[code]=false))});

function tryLaunch(){
 if(launching)return;
 const dist=Math.hypot(player.x-rocket.position.x,player.z-rocket.position.z);
 if(dist>5.5){toast('Raketaga yaqinroq boring');return}
 launching=true;launchTime=0;$('#launch-overlay').classList.remove('hidden');$('#rocket-btn').disabled=true;
 toast('Raketa dvigateli ishga tushdi!');
}
$('#rocket-btn').addEventListener('click',tryLaunch);
$('#close-space').addEventListener('click',()=>$('#space-menu').classList.add('hidden'));
function toast(msg){const el=$('#toast');el.textContent=msg;el.style.opacity='1';clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.style.opacity='.72',2600)}

// Slow day/night cycle: 8 minutes of daylight, 2 minutes of night.
const DAY_LENGTH=600, DAY_RATIO=.8;
const skyDay=new THREE.Color(0x83c8f2),skySunset=new THREE.Color(0xf0a16f),skyNight=new THREE.Color(0x101a35);
const sunOrb=new THREE.Mesh(new THREE.SphereGeometry(3.3,14,10),new THREE.MeshBasicMaterial({color:0xffe9a0}));scene.add(sunOrb);
const moonOrb=new THREE.Mesh(new THREE.SphereGeometry(1.7,12,8),new THREE.MeshBasicMaterial({color:0xdce6f2}));scene.add(moonOrb);
let dayTime=0.28; // start at morning
function updateSky(dt){
 dayTime=(dayTime+dt/DAY_LENGTH)%1;
 const angle=dayTime*Math.PI*2-Math.PI/2;
 const sunY=Math.sin(angle);
 sunOrb.position.set(Math.cos(angle)*85,sunY*72,-65);
 moonOrb.position.set(-sunOrb.position.x,-sunOrb.position.y,70);
 const daylight=THREE.MathUtils.smoothstep(sunY,-.22,.18);
 const sunset=1-THREE.MathUtils.smoothstep(Math.abs(sunY),.12,.65);
 const sky=skyNight.clone().lerp(skyDay,daylight).lerp(skySunset,sunset*.65);
 scene.background.copy(sky);scene.fog.color.copy(sky);
 sunLight.intensity=.12+daylight*1.55+sunset*.35;
 hemi.intensity=.28+daylight*1.1;
 sunLight.position.copy(sunOrb.position);
 sunOrb.visible=sunY>-.18;moonOrb.visible=sunY<.05;
 $('#clock').textContent=`${String(Math.floor(dayTime*24)).padStart(2,'0')}:${String(Math.floor((dayTime*24%1)*60)).padStart(2,'0')}`;
}

// Camera follows behind the character; mouse/touch can rotate a full 360 degrees.
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.04);
 if(!launching){
  const f=(keys.KeyW?1:0)-(keys.KeyS?1:0),s=(keys.KeyD?1:0)-(keys.KeyA?1:0);
  const speed=keys.ShiftLeft?7.2:4.5;
  player.x+=(Math.sin(player.yaw)*f+Math.cos(player.yaw)*s)*speed*dt;
  player.z+=(Math.cos(player.yaw)*f-Math.sin(player.yaw)*s)*speed*dt;
  player.vy-=19*dt;player.y+=player.vy*dt;
  const floor=terrain(Math.round(player.x),Math.round(player.z))+1.8;
  if(player.y<floor){player.y=floor;player.vy=0;player.onGround=true}else player.onGround=false;
  if(keys.Space&&player.onGround){player.vy=8;player.onGround=false}
  avatar.position.set(player.x,player.y-1.8,player.z);avatar.rotation.y=player.yaw;
  const camDist=7,camHeight=3.1;
  const horizontalDist=camDist*Math.cos(player.pitch);
  const desired=new THREE.Vector3(player.x-Math.sin(player.yaw)*horizontalDist,player.y+camHeight+Math.sin(player.pitch)*camDist,player.z-Math.cos(player.yaw)*horizontalDist);
  camera.position.lerp(desired,1-Math.exp(-8*dt));
  const lookAt=new THREE.Vector3(player.x,player.y+1.1,player.z);
  camera.lookAt(lookAt);
  const ck=kc(Math.floor(player.x/CHUNK),Math.floor(player.z/CHUNK));if(ck!==lastChunk){lastChunk=ck;updateChunks()}
  const near=Math.hypot(player.x-rocket.position.x,player.z-rocket.position.z)<5.5;
  $('#rocket-btn').style.opacity=near?'1':'.72';
  $('#rocket-btn').querySelector('b').textContent=near?'RAKETAGA CHIQISH':'RAKETA UZOQDA';
  $('#coords').textContent=`X: ${Math.floor(player.x)} · Z: ${Math.floor(player.z)}`;
 } else {
  launchTime+=dt;
  flame.scale.y=1+Math.sin(launchTime*25)*.25;fireLight.intensity=4;
  rocket.position.y+=dt*(launchTime<1?0:launchTime<2?5:12);
  camera.position.lerp(new THREE.Vector3(rocket.position.x+9,rocket.position.y+6,rocket.position.z+13),.035);
  camera.lookAt(rocket.position);
  if(launchTime>4.5){location.href='earth.html';return}
 }
 updateSky(dt);
 renderer.render(scene,camera);
}
updateChunks();player.y=terrain(0,0)+1.8;avatar.position.set(player.x,player.y-1.8,player.z);
camera.position.set(0,player.y+3.1,-7);camera.lookAt(0,player.y+1,0);
animate();

}

window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.35))});
