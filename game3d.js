(()=>{
"use strict";
const root=document.querySelector("#mapleGame .game-world");
if(!root||!window.THREE)return;
const host=document.getElementById("maple3d");
if(!host)return;
host.innerHTML="";

const T=THREE,scene=new T.Scene(),world=new T.Group();
scene.add(world);
world.scale.setScalar(1);
scene.background=new T.Color(0xc4d7a2);
const camera=new T.PerspectiveCamera(48,1,.1,6000);camera.position.set(0,1500,1100);
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
host.appendChild(renderer.domElement);
const skyLight=new T.HemisphereLight(0xffffff,0x82966b,2.1);world.add(skyLight);
const sun=new T.DirectionalLight(0xffffff,1.8);sun.position.set(-260,420,180);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);sun.shadow.camera.left=-300;sun.shadow.camera.right=300;sun.shadow.camera.top=300;sun.shadow.camera.bottom=-300;sun.shadow.camera.near=1;sun.shadow.camera.far=1200;sun.shadow.bias=-0.00018;world.add(sun);
const nightFill=new T.AmbientLight(0x536b9a,0);world.add(nightFill);
const daySky=new T.Color(0xc4d7a2),nightSky=new T.Color(0x101b38),duskSky=new T.Color(0x9b7890);
const daySun=new T.Color(0xffffff),nightSun=new T.Color(0x8296cf);
const clockEl=document.getElementById("gameClock");
const saskatoonFormatter=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Regina",hour:"numeric",minute:"2-digit",hour12:true});
const saskatoonParts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Regina",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric",hourCycle:"h23"});
function solarElevation(date){
 const parts=Object.fromEntries(saskatoonParts.formatToParts(date).map(p=>[p.type,Number(p.value)]));
 const dayOfYear=Math.floor((Date.UTC(parts.year,parts.month-1,parts.day)-Date.UTC(parts.year,0,0))/86400000);
 const hour=parts.hour+parts.minute/60+parts.second/3600;
 const gamma=2*Math.PI/365*(dayOfYear-1+(hour-12)/24);
 const eq=229.18*(0.000075+0.001868*Math.cos(gamma)-0.032077*Math.sin(gamma)-0.014615*Math.cos(2*gamma)-0.040849*Math.sin(2*gamma));
 const decl=0.006918-0.399912*Math.cos(gamma)+0.070257*Math.sin(gamma)-0.006758*Math.cos(2*gamma)+0.000907*Math.sin(2*gamma)-0.002697*Math.cos(3*gamma)+0.00148*Math.sin(3*gamma);
 const solarMinutes=hour*60+eq+4*(-106.67)+360;
 const ha=(solarMinutes/4-180)*Math.PI/180,lat=52.1332*Math.PI/180;
 return Math.asin(Math.sin(lat)*Math.sin(decl)+Math.cos(lat)*Math.cos(decl)*Math.cos(ha))*180/Math.PI;
}
function updateSaskatoonLighting(){
 const now=new Date(),elevation=solarElevation(now);
 const daylight=T.MathUtils.clamp((elevation+6)/12,0,1);
 const sunLevel=T.MathUtils.clamp((elevation+2)/32,0,1);
 const dusk=T.MathUtils.clamp(1-Math.abs(elevation+1)/7,0,1);
 const night=1-daylight;
 const timeText=saskatoonFormatter.format(now)||now.toLocaleTimeString("en-CA",{timeZone:"America/Regina",hour:"numeric",minute:"2-digit"});
 if(clockEl){clockEl.textContent=(elevation>-6?"☀️ ":"🌙 ")+timeText+" · "+(elevation>0?"DAYTIME":elevation>-6?"TWILIGHT":"NIGHT");clockEl.dataset.phase=elevation>0?"day":elevation>-6?"twilight":"night";}
 scene.background=daySky.clone().lerp(duskSky,dusk*.42).lerp(nightSky,night*.92);
 skyLight.intensity=.28+daylight*1.85;
 skyLight.color.set(0x9eb4d5).lerp(new T.Color(0xffffff),daylight);
 skyLight.groundColor.set(0x17213b).lerp(new T.Color(0x82966b),daylight);
 sun.intensity=.08+sunLevel*1.85;
 sun.color.copy(nightSun).lerp(daySun,sunLevel);
 sun.position.set(-45+Math.cos((elevation+10)*Math.PI/180)*30,Math.max(5,15+elevation*2),35);
 nightFill.intensity=.12+night*.48;
 renderer.toneMappingExposure=.48+daylight*.58;
}
updateSaskatoonLighting();
setInterval(updateSaskatoonLighting,15000);
const mat=c=>new T.MeshLambertMaterial({color:c});
const M={
land:mat(0x86c96b),grass:mat(0x86c96b),grass2:mat(0x86c96b),road:mat(0x59636a),
roadEdge:mat(0xe5dfc9),water:mat(0x258fca),waterLight:mat(0x72d0e5),
path:mat(0xe8dfc8),roof:mat(0x46515b),roof2:mat(0x786b61),
wall:mat(0xe6dfc9),white:mat(0xf4efdf),glass:mat(0x8bb9c4),
brick:mat(0xb66e50),dark:mat(0x343c40),tree:mat(0x368b58),
tree2:mat(0x68a66d),trunk:mat(0x82664a),sign:mat(0x18252b),
bridge:mat(0xb9b7a8),parking:mat(0x9da39b)
};
const unit=new T.BoxGeometry(1,1,1);
function cube(parent,x,y,z,w,h,d,m){const o=new T.Mesh(unit,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function slab(x,z,w,d,m,y=-.25,h=.5){return cube(world,x,y,z,w,h,d,m);}
// Compact Saskatoon-inspired playable footprint: approximately 9 km x 6.5 km.
// Buildings, roads, residents and vehicles retain their existing density.
const WORLD_W=300,WORLD_D=310,UNIT_METRES=10;
const terrain=slab(0,0,WORLD_W,WORLD_D,mat(0x929b8c),-.6,1);terrain.receiveShadow=true;
const localRoad=mat(0x41494e),arterialRoad=mat(0x343c42),curb=mat(0xc4c4bc);
const sidewalkMat=mat(0xb8b7ae),markingMat=mat(0xece8d8),grassMat=mat(0x7da66c);
const roadXs=[-130,-100,-70,-40,-10,20,50,80];
const roadZs=[-130,-100,-70,-40,-10,20,50,80,110,140];
// Downtown's familiar rectangular street grid: numbered east-west streets and north-south avenues.
for(const x of roadXs){
 const major=[-100,-10,80].includes(x);
 slab(x,0,major?5.2:3.8,WORLD_D-8,major?arterialRoad:localRoad,-.08,.2);
 for(const side of [-1,1]){
  slab(x+side*(major?4.1:3.2),0,2.1,WORLD_D-8,sidewalkMat,.015,.16);
  slab(x+side*(major?5.45:4.45),0,.35,WORLD_D-8,curb,.09,.12);
 }
}
for(const z of roadZs){
 const major=[-100,-10,80].includes(z);
 slab(0,z,WORLD_W-8,major?5.2:3.8,major?arterialRoad:localRoad,-.08,.2);
 for(const side of [-1,1]){
  slab(0,z+side*(major?4.1:3.2),WORLD_W-8,2.1,sidewalkMat,.015,.16);
  slab(0,z+side*(major?5.45:4.45),WORLD_W-8,.35,curb,.09,.12);
 }
}
// South Saskatchewan River runs along the east edge of the downtown core.
slab(128,0,40,WORLD_D,M.water,-.04,.28);
slab(106,0,.9,WORLD_D,M.waterLight,.08,.08);
slab(149,0,.9,WORLD_D,M.waterLight,.08,.08);
// Meewasin riverbank trail and landscaped River Landing / Kiwanis green spaces.
slab(101,0,5,WORLD_D-10,M.path,.08,.16);
slab(96,-91,19,48,grassMat,-.02,.12);
slab(96,91,18,42,grassMat,-.02,.12);
for(const z of [-105,-5,95]){
 slab(128,z,48,9,M.bridge,.2,.55);
 for(let x=108;x<=148;x+=7)cube(world,x,.52,z,3.6,.12,9.5,M.white);
 for(const side of [-1,1])cube(world,128,.95,z+side*5.2,48,.25,.25,mat(0x747d80));
}
// Street furniture, crosswalks and signals make intersections read like real city streets.
for(const x of [-100,-10,80])for(const z of [-100,-10,80]){
 for(let k=-2;k<=2;k++){
  slab(x+k*1.35,z-7.4, .72,3.4,markingMat,.045,.05);
  slab(x+k*1.35,z+7.4, .72,3.4,markingMat,.045,.05);
 }
 const pole=new T.Group();pole.position.set(x+7.2,0,z+7.2);world.add(pole);
 cube(pole,0,3.4,0,.22,6.8,.22,M.dark);
 cube(pole,0,6.1,0,.85,1.8,.55,mat(0x283238));
 for(let j=0;j<3;j++){const lamp=new T.Mesh(new T.SphereGeometry(.22,8,8),mat([0xc94b42,0xd6b24a,0x4a9c5e][j]));lamp.position.set(0,6.7-j*.58,.3);pole.add(lamp);}
}
function building(x,z,w,d,h,color,roofColor=0x59616b,style="block"){
 const g=new T.Group();g.position.set(x,0,z);world.add(g);
 const wallMat=mat(color),roofMat=mat(roofColor),glass=new T.MeshStandardMaterial({color:0x83b8c6,roughness:.24,metalness:.22});
 cube(g,0,h/2,0,w,h,d,wallMat);
 cube(g,0,h+.18,0,w+1,.36,d+1,roofMat);
 const rows=Math.max(1,Math.floor(h/3.4)),cols=Math.max(2,Math.floor(w/2.8));
 for(let row=0;row<rows;row++){
  const yy=2+row*(h-2.5)/rows;
  for(let col=0;col<cols;col++){
   const xx=-w/2+(col+.5)*w/cols;
   const ww=Math.min(1.55,w/cols*.58),hh=Math.min(1.8,h/rows*.58);
   cube(g,xx,yy,d/2+.035,ww,hh,.08,style==="glass"?glass:M.glass);
   cube(g,xx,yy,-d/2-.035,ww,hh,.08,style==="glass"?glass:M.glass);
  }
  const sideCols=Math.max(2,Math.floor(d/3));
  for(let col=0;col<sideCols;col++){
   const zz=-d/2+(col+.5)*d/sideCols;
   cube(g,w/2+.035,yy,zz,.08,Math.min(1.8,h/rows*.58),Math.min(1.5,d/sideCols*.55),style==="glass"?glass:M.glass);
   cube(g,-w/2-.035,yy,zz,.08,Math.min(1.8,h/rows*.58),Math.min(1.5,d/sideCols*.55),style==="glass"?glass:M.glass);
  }
 }
 // Ground-floor storefront band and a recessed entrance.
 cube(g,0,1.45,d/2+.07,w*.76,2.7,.12,mat(0x34454a));
 cube(g,0,2.9,d/2+.16,w*.42,.28,.22,roofMat);
 if(style==="tower"||style==="glass")cube(g,0,h+.9,0,w*.48,1.3,d*.48,roofMat);
 return g;
}
function label(text,x,z,emoji=""){
 const c=document.createElement("canvas");c.width=512;c.height=128;
 const ctx=c.getContext("2d");ctx.clearRect(0,0,512,128);
 const title=emoji?emoji+"  "+text:text;
 ctx.font="bold 35px Arial";const width=Math.min(490,Math.max(180,ctx.measureText(title).width+54));
 const left=(512-width)/2;ctx.fillStyle="#17242b";ctx.beginPath();ctx.roundRect(left,23,width,82,38);ctx.fill();
 ctx.strokeStyle="#4e5b5d";ctx.lineWidth=4;ctx.stroke();
 ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(title,256,65,width-30);
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 const sprite=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthTest:false}));
 sprite.position.set(x,7,z);sprite.scale.set(17,4.25,1);sprite.renderOrder=20;world.add(sprite);
 return sprite;
}
// Ten recognizable downtown landmarks, positioned around a walkable street grid.
const places=[
 {id:"bessborough",name:"Delta Bessborough",short:"Bessborough",x:95,z:125,emoji:"🏰",type:"hotel"},
 {id:"midtown",name:"Midtown Plaza",short:"Midtown Plaza",x:-25,z:-25,emoji:"🛍",type:"shopping"},
 {id:"nutrien",name:"Nutrien Tower",short:"Nutrien Tower",x:20,z:5,emoji:"🏙️",type:"tower"},
 {id:"tcu",name:"TCU Place",short:"TCU Place",x:-55,z:-85,emoji:"🎭",type:"venue"},
 {id:"cityhall",name:"Saskatoon City Hall",short:"City Hall",x:-85,z:95,emoji:"🏛️",type:"civic"},
 {id:"library",name:"Frances Morrison Library",short:"Public Library",x:-119,z:95,emoji:"📚",type:"library"},
 {id:"drinkle",name:"Drinkle Building",short:"Drinkle Building",x:-85,z:-25,emoji:"🏢",type:"heritage"},
 {id:"senator",name:"Hotel Senator",short:"Hotel Senator",x:-85,z:-55,emoji:"🏨",type:"heritage"},
 {id:"alt",name:"Alt Hotel Saskatoon",short:"Alt Hotel",x:65,z:-85,emoji:"🏨",type:"hotel"},
 {id:"remai",name:"Remai Modern",short:"Remai Modern",x:95,z:-115,emoji:"🎨",type:"museum"}
];
for(const p of places){
 if(p.id==="bessborough"){
  const g=building(p.x,p.z,20,19,27,0xd7c7a8,0x425b4b,"heritage");
  for(const [dx,dz] of [[-9,-6],[9,-6],[-9,6],[9,6]]){
   const shaft=new T.Mesh(new T.CylinderGeometry(1.7,2,14,8),mat(0xd8c7a8));shaft.position.set(dx,25,dz);shaft.castShadow=true;g.add(shaft);
   const roof=new T.Mesh(new T.ConeGeometry(2.8,6,4),mat(0x405849));roof.position.set(dx,35,dz);roof.rotation.y=Math.PI/4;g.add(roof);
  }
  const crown=new T.Mesh(new T.ConeGeometry(5,7,4),mat(0x405849));crown.position.set(0,31,0);crown.rotation.y=Math.PI/4;g.add(crown);
 }else if(p.id==="remai"){
  const g=building(p.x,p.z,20,18,9,0x9a6349,0x514e4b,"modern");
  cube(g,3,8,0,25,3,20,mat(0xb67850));
  cube(g,-3,11,-1,20,2.2,17,mat(0xc58a5c));
  cube(g,0,2,11.7,25,3,.35,M.glass);
  cube(g,12,5,0,.4,10,19,M.glass);
 }else if(p.id==="midtown"){
  const g=building(p.x,p.z,24,20,9,0xd8d7d0,0x666d70,"modern");
  cube(g,0,7,13.8,30,4,.4,M.glass);
  cube(g,-2,10,0,22,1.4,19,mat(0xe8e5dc));
  cube(g,0,1.1,14.2,16,2.1,.3,mat(0x4c5558));
 }else if(p.id==="nutrien"){
  const g=building(p.x,p.z,18,16,47,0x9daeb2,0x58666d,"glass");
  for(let y=5;y<44;y+=4)cube(g,0,y,9.16,17,.22,.12,mat(0x55717c));
  cube(g,0,49,0,6,2,6,mat(0x53636b));
 }else if(p.id==="tcu"){
  const g=building(p.x,p.z,24,18,13,0xc9c7bf,0x5a6064,"modern");
  cube(g,0,8,11.2,26,7,.5,mat(0x59676e));
  cube(g,0,3,11.55,20,3,.25,M.glass);
 }else if(p.id==="cityhall"){
  const g=building(p.x,p.z,20,18,12,0xc7c8c1,0x606b70,"modern");
  cube(g,0,14,0,10,2,9,mat(0x6c7778));
  cube(g,0,1.5,9.2,16,2.8,.3,M.glass);
 }else if(p.id==="library"){
  const g=building(p.x,p.z,19,17,10,0xc5bba7,0x5c6261,"modern");
  cube(g,0,7,8.7,14,4,.35,mat(0x7f9ca0));
 }else if(p.id==="drinkle"){
  const g=building(p.x,p.z,15,13,18,0x9a5d45,0x4b4947,"heritage");
  for(let y=4;y<16;y+=4)cube(g,0,y,6.65,13,.22,.12,mat(0xeee1cc));
 }else if(p.id==="senator"){
  const g=building(p.x,p.z,15,13,15,0xb98a68,0x4c4e4b,"heritage");
  const cupola=new T.Mesh(new T.ConeGeometry(3.2,4,8),mat(0x4b514c));cupola.position.set(0,18,0);g.add(cupola);
 }else if(p.id==="alt"){
  const g=building(p.x,p.z,19,17,24,0x9baeb2,0x4e5c64,"glass");
  cube(g,0,24,0,13,1.5,12,mat(0x46575e));
 }
 label(p.short,p.x,p.z-22,p.emoji);
}
// Physical work stations around downtown. Walk close and press E to interact.
const workStations=[
 {id:"retail_stock",x:-7,z:-25,emoji:"📦"},{id:"retail_customer",x:-25,z:-7,emoji:"🛍️"},{id:"retail_till",x:-43,z:-25,emoji:"💳"},
 {id:"cafe_prep",x:-65,z:-55,emoji:"☕"},{id:"cafe_serve",x:-85,z:-35,emoji:"🥤"},{id:"cafe_clean",x:-105,z:-55,emoji:"🧽"},
 {id:"office_documents",x:40,z:5,emoji:"📄"},{id:"office_computer",x:20,z:26,emoji:"💻"},{id:"office_mail",x:0,z:5,emoji:"📬"},
 {id:"delivery_pickup",x:-85,z:95,emoji:"📦"},{id:"delivery_drop1",x:95,z:125,emoji:"🚲"},{id:"delivery_drop2",x:95,z:-115,emoji:"📦"}
];
for(const station of workStations){
 const stand=new T.Group();stand.position.set(station.x,0,station.z);world.add(stand);
 cube(stand,0,.55,0,2.8,1.1,2.1,mat(0x526c62));
 cube(stand,0,1.25,0,2.4,.25,1.8,mat(0xe3d8bd));
 const marker=new T.Mesh(new T.CylinderGeometry(.72,.72,.16,12),mat(0xf0c45d));marker.position.set(0,1.55,0);stand.add(marker);
 const c=document.createElement("canvas");c.width=256;c.height=96;const ctx=c.getContext("2d");
 ctx.fillStyle="#17242b";ctx.fillRect(0,0,256,96);ctx.fillStyle="#fff";ctx.font="bold 34px Arial";ctx.textAlign="center";ctx.fillText(station.emoji,128,64);
 const tex=new T.CanvasTexture(c);const sign=new T.Mesh(new T.PlaneGeometry(2.2,.85),new T.MeshBasicMaterial({map:tex,transparent:true}));
 sign.position.set(0,2.35,0);stand.add(sign);
}
// Small public squares, street planters and a continuous riverside promenade.
for(const [x,z,w,d] of [[-35,48,22,18],[65,-45,20,24],[91,62,18,28]]){
 slab(x,z,w,d,grassMat,-.02,.12);
 for(let i=-1;i<=1;i++)slab(x+i*5,z,1,d-4,M.path,.06,.12);
}
// A downtown sign and named avenue markers.
function roadSign(x,z,txt){
 const g=new T.Group();g.position.set(x,0,z);world.add(g);
 cube(g,0,1.1,0,.25,2.2,.25,M.dark);cube(g,0,2.2,0,6.8,1.35,.22,M.sign);
 const c=document.createElement("canvas");c.width=512;c.height=128;const ctx=c.getContext("2d");
 ctx.fillStyle="#eaf0d9";ctx.fillRect(0,0,512,128);ctx.fillStyle="#263a35";ctx.font="bold 48px Arial";ctx.textAlign="center";ctx.fillText(txt,256,82);
 const tex=new T.CanvasTexture(c);const face=new T.Mesh(new T.PlaneGeometry(6.4,1.25),new T.MeshBasicMaterial({map:tex}));face.position.set(0,2.2,.13);g.add(face);
}
roadSign(-43,-38,"21ST STREET");
roadSign(53,39,"SPADINA CRESCENT");
roadSign(-112,22,"2ND AVENUE");
const iTreeMats=[mat(0x398653),mat(0x579c5d),mat(0x78ad68),mat(0x2f754c)];
function streetTree(x,z,scale=1){
 const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(scale);world.add(g);
 const trunk=new T.Mesh(new T.CylinderGeometry(.16,.22,1.35,6),M.trunk);trunk.position.y=.68;trunk.castShadow=true;g.add(trunk);
 const crown=new T.Mesh(new T.IcosahedronGeometry(1.2,1),iTreeMats[Math.floor(Math.abs(x+z))%iTreeMats.length]);crown.position.y=2.05;crown.castShadow=true;crown.receiveShadow=true;g.add(crown);
 const crown2=new T.Mesh(new T.IcosahedronGeometry(.82,1),iTreeMats[Math.floor(Math.abs(x-z)+1)%iTreeMats.length]);crown2.position.set(.48,2.42,.12);crown2.castShadow=true;g.add(crown2);
}
// Exactly fifty trees, spread along downtown sidewalks and the riverfront.
const treeXs=[-132,-108,-45,72,108],treeZs=[-132,-102,-72,-42,-12,18,48,78,108,138];
for(const x of treeXs)for(const z of treeZs)streetTree(x,z,.8);
// Streetlights on the main downtown avenues.
for(const [x,z] of [[-100,-118],[-100,-48],[-100,42],[-10,-118],[-10,42],[80,-48],[80,118],[102,-30],[102,30]]){
 const lamp=new T.Group();lamp.position.set(x,0,z);world.add(lamp);
 cube(lamp,0,3,0,.18,6,.18,M.dark);
 const arm=cube(lamp,.9,5.7,0,1.9,.12,.12,M.dark);
 const bulb=new T.Mesh(new T.SphereGeometry(.35,8,8),mat(0xffe4a8));bulb.position.set(1.75,5.55,0);lamp.add(bulb);
}
// Twenty residents walking along downtown sidewalks.
const pedestrianMats=[mat(0x397bb0),mat(0xc46d4c),mat(0x8a6bb0),mat(0x4e9564),mat(0xd1a34d),mat(0x53616c)];
const skinMats=[mat(0xc98f6b),mat(0x8f5d43),mat(0xe0b28c),mat(0x6f4636),mat(0xb87959)];
const pedestrians=[];
function addPedestrian(x,z,index,dx,dz){
 const g=new T.Group();g.position.set(x,0,z);g.rotation.y=Math.atan2(dx,dz);g.scale.setScalar(1.35);world.add(g);
 const shirt=pedestrianMats[index%pedestrianMats.length],skin=skinMats[index%skinMats.length],pants=mat(index%2?0x39475c:0x45413b);
 cube(g,0,1.05,0,.48,.68,.28,shirt);cube(g,0,1.62,0,.34,.38,.34,skin);cube(g,0,1.82,-.015,.35,.12,.35,mat(0x40352f));
 const leftArm=cube(g,-.31,1.05,0,.16,.56,.17,shirt),rightArm=cube(g,.31,1.05,0,.16,.56,.17,shirt);
 const leftLeg=cube(g,-.13,.42,0,.18,.65,.2,pants),rightLeg=cube(g,.13,.42,0,.18,.65,.2,pants);
 pedestrians.push({group:g,leftArm,rightArm,leftLeg,rightLeg,phase:index*.9,homeX:x,homeZ:z,dx,dz});
}
const walkingRoutes=[
 [-122,-118,0,1],[-92,-118,1,0],[-48,-118,0,1],[-5,-118,1,0],[42,-118,0,1],
 [-122,-48,0,-1],[-88,-48,1,0],[-45,-48,0,1],[45,-48,-1,0],[100,-48,0,1],
 [-122,42,0,1],[-88,42,-1,0],[-45,42,0,-1],[-5,42,1,0],[62,42,0,-1],
 [-122,118,0,-1],[-88,118,1,0],[-45,118,0,-1],[45,118,-1,0],[100,118,0,-1]
];
walkingRoutes.forEach((p,i)=>addPedestrian(p[0],p[1],i,p[2]*(.012+(i%3)*.003),p[3]*(.012+(i%3)*.003)));
// Five cars follow the downtown avenue grid.
const carPaint=[0xc64f43,0x397da5,0xe1e0d5,0x343f4a,0xd39a3f,0x57916c,0x8b6ca4],cars=[],tireMat=mat(0x202428);
const carWindow=new T.MeshStandardMaterial({color:0x9dcbd3,roughness:.22,metalness:.12});
function addCar(axis,fixed,position,direction,index){
 const g=new T.Group();g.scale.setScalar(1.35);world.add(g);const paint=mat(carPaint[index%carPaint.length]);
 cube(g,0,.52,0,1.25,.62,2.35,paint);cube(g,0,.98,-.12,.98,.55,1.18,carWindow);cube(g,0,.92,.83,1.05,.24,.42,paint);
 for(const side of [-1,1])for(const end of [-.72,.72]){const wheel=new T.Mesh(new T.CylinderGeometry(.24,.24,.16,10),tireMat);wheel.rotation.z=Math.PI/2;wheel.position.set(side*.66,.27,end);wheel.castShadow=true;g.add(wheel);}
 for(const side of [-1,1]){cube(g,side*.43,.55,1.19,.22,.16,.05,mat(0xffefbd));cube(g,side*.43,.55,-1.19,.2,.15,.05,mat(0xb73b32));}
 cars.push({group:g,axis,fixed:fixed+(direction>0?-.58:.58),position,direction,speed:2.2+(index%4)*.35});
}
[-100,-40,20,50,80].forEach((road,i)=>addCar("z",road,-140+(i%3)*70,i%2?1:-1,i));

// Player marker with simple blocky avatar
const player={x:-35,z:-35,yaw:0};const avatar=new T.Group();world.add(avatar);
const skin=mat(0xc9906d),shirt=mat(0x368dc4),pants=mat(0x35415d),hair=mat(0x302b29);
cube(avatar,0,1.35,0,.72,1.05,.42,shirt);
cube(avatar,0,2.15,0,.62,.68,.62,skin);
cube(avatar,0,2.52,-.04,.66,.22,.66,hair);
cube(avatar,-.46,1.38,0,.22,.88,.24,shirt);cube(avatar,.46,1.38,0,.22,.88,.24,shirt);
cube(avatar,-.22,.48,0,.27,.86,.32,pants);cube(avatar,.22,.48,0,.27,.86,.32,pants);
cube(avatar,-.22,.04,.08,.3,.16,.48,mat(0x252b31));cube(avatar,.22,.04,.08,.3,.16,.48,mat(0x252b31));
const locationById=Object.fromEntries(places.map(p=>[p.id,p]));
const placeLabels=[],placeHitAreas=[];
for(const p of places){
 const labelSprite=world.children.find(o=>o.isSprite && o.position.x===p.x && o.position.z===p.z-22);
 if(labelSprite){labelSprite.material.opacity=0;labelSprite.material.transparent=true;labelSprite.scale.set(0,0,1);placeLabels.push({place:p,sprite:labelSprite,active:false});}
 const hit=new T.Mesh(new T.PlaneGeometry(48,42),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));
 hit.rotation.x=-Math.PI/2;hit.position.set(p.x,.18,p.z);hit.userData.placeId=p.id;world.add(hit);placeHitAreas.push(hit);
}
const hoverRaycaster=new T.Raycaster(),pointerNdc=new T.Vector2();
let hoveredPlace=null,pointerX=0,pointerY=0,viewOffsetX=0,viewOffsetZ=0,cameraAngle=0;
let orbitYaw=0,orbitPitch=Math.atan2(.8,.6),orbitDistance=900,orbitBaseDistance=900,dragging=false,lastPointerX=0,lastPointerY=0;
const canvas=renderer.domElement;
canvas.style.touchAction="none";
canvas.style.cursor="grab";
function updateOrbitCamera(){
 const radius=orbitBaseDistance/camera.zoom;
 const horizontal=Math.cos(orbitPitch)*radius;
 camera.position.set(Math.sin(orbitYaw)*horizontal,Math.sin(orbitPitch)*radius,Math.cos(orbitYaw)*horizontal);
 camera.lookAt(0,0,0);
}
canvas.style.cursor="crosshair";
// Track the pointer at window level so looking continues when it reaches the edge
// of the 3D canvas. Clamp to the canvas bounds instead of resetting on pointerleave.
canvas.addEventListener("pointerdown",e=>{
 if(e.button!==0&&e.pointerType!=="touch")return;
 dragging=true;lastPointerX=e.clientX;lastPointerY=e.clientY;canvas.setPointerCapture?.(e.pointerId);canvas.style.cursor="grabbing";
});
window.addEventListener("pointerup",()=>{dragging=false;canvas.style.cursor=hoveredPlace?"pointer":"grab";});
window.addEventListener("pointercancel",()=>{dragging=false;canvas.style.cursor="grab";});
window.addEventListener("pointermove",e=>{
 if(dragging){
  const dx=e.clientX-lastPointerX,dy=e.clientY-lastPointerY;lastPointerX=e.clientX;lastPointerY=e.clientY;
  orbitYaw-=dx*.006;orbitPitch=T.MathUtils.clamp(orbitPitch+dy*.006,-1.48,1.48);updateOrbitCamera();
 }
 const rect=canvas.getBoundingClientRect();
 if(!rect.width||!rect.height)return;
 pointerX=T.MathUtils.clamp(((e.clientX-rect.left)/rect.width-.5)*2,-1,1);
 pointerY=T.MathUtils.clamp(((e.clientY-rect.top)/rect.height-.5)*2,-1,1);
 if(Math.abs(pointerX)>.08||Math.abs(pointerY)>.08)document.getElementById("gameCursorHint")?.classList.add("is-hidden");
 const inside=e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom;
 if(inside){
  pointerNdc.set(pointerX,-pointerY);
  hoverRaycaster.setFromCamera(pointerNdc,camera);
  const hit=hoverRaycaster.intersectObjects(placeHitAreas,false)[0];
  hoveredPlace=hit?places.find(p=>p.id===hit.object.userData.placeId)||null:null;
  if(!dragging)canvas.style.cursor=hoveredPlace?"pointer":"grab";
 }else{
  hoveredPlace=null;
 }
});
window.addEventListener("blur",()=>{
 pointerX=0;pointerY=0;hoveredPlace=null;canvas.style.cursor="crosshair";
});

function resize(){
 const r=host.getBoundingClientRect();if(!r.width||!r.height)return;
 renderer.setSize(r.width,r.height,false);
 const aspect=r.width/r.height;
 camera.aspect=aspect;
 const projectedMapHeight=Math.max(WORLD_D*.8,WORLD_W*.8/aspect)*1.2;
 const distance=projectedMapHeight/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)));
 orbitBaseDistance=distance;
 updateOrbitCamera();
 camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(host);resize();
function nearest(){
 let best=null,d=1e9;
 for(const p of places){const n=Math.hypot(player.x-p.x,player.z-p.z);if(n<d){d=n;best=p;}}
 return d<23?best:null;
}
let workShiftActive=false;
document.addEventListener("maple:work-shift-state",e=>{workShiftActive=!!e.detail?.active;});
function interact(){
 let station=null,distance=1e9;
 for(const item of workStations){const d=Math.hypot(player.x-item.x,player.z-item.z);if(d<distance){distance=d;station=item;}}
 if(workShiftActive&&station&&distance<9){document.dispatchEvent(new CustomEvent("maple:workstation-interact",{detail:{id:station.id}}));return;}
 const p=nearest();
 if(p){document.dispatchEvent(new CustomEvent("maple:interact",{detail:{id:p.id}}));return;}
 if(station&&distance<9){document.dispatchEvent(new CustomEvent("maple:workstation-interact",{detail:{id:station.id}}));return;}
 document.dispatchEvent(new CustomEvent("maple:game-toast",{detail:{message:"Move closer to a building or marked work station."}}));
}
let keys={},walk=0,last=performance.now();
window.addEventListener("keydown",e=>{
 if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)){
  keys[e.code]=true;if(!e.target.closest("input,textarea,select"))e.preventDefault();
 }
 if(e.code==="KeyE"&&!e.repeat)interact();
 if(/^Digit[1-5]$/.test(e.code))document.querySelector('[data-hotbar="'+["phone","eat","coffee","rest","inventory"][Number(e.code.slice(-1))-1]+'"]')?.click();
});
window.addEventListener("keyup",e=>keys[e.code]=false);window.addEventListener("blur",()=>keys={});
renderer.domElement.addEventListener("wheel",e=>{
 e.preventDefault();camera.zoom=T.MathUtils.clamp(camera.zoom+(e.deltaY<0?.12:-.12),.65,2.3);camera.updateProjectionMatrix();
},{passive:false});
document.querySelectorAll("[data-move]").forEach(b=>{
 const k={up:"KeyW",down:"KeyS",left:"KeyA",right:"KeyD"}[b.dataset.move];
 b.addEventListener("pointerdown",e=>{e.preventDefault();keys[k]=true;});
 ["pointerup","pointerleave","pointercancel"].forEach(n=>b.addEventListener(n,()=>keys[k]=false));
});

function frame(t){
 requestAnimationFrame(frame);const dt=Math.min(.04,(t-last)/1000);last=t;
 let dx=0,dz=0;if(keys.KeyW||keys.ArrowUp)dz-=1;if(keys.KeyS||keys.ArrowDown)dz+=1;
 if(keys.KeyA||keys.ArrowLeft)dx-=1;if(keys.KeyD||keys.ArrowRight)dx+=1;
 const len=Math.hypot(dx,dz);
 if(len){dx/=len;dz/=len;const speed=keys.ShiftLeft||keys.ShiftRight?34:22;
 player.x=T.MathUtils.clamp(player.x+dx*speed*dt,-145,112);
 player.z=T.MathUtils.clamp(player.z+dz*speed*dt,-145,145);walk+=dt*speed;
 player.yaw=Math.atan2(dx,dz);
 }
 avatar.position.set(player.x,0,player.z);avatar.rotation.y=player.yaw;
 avatar.position.y=Math.abs(Math.sin(walk*1.6))*.06;

 // Orbit camera stays focused on the centre of the town while the player moves.
 for(const item of placeLabels){
  const active=!!hoveredPlace&&hoveredPlace.id===item.place.id;
  if(active!==item.active)item.active=active;
  const target=active?1:0;
  const current=item.sprite.material.opacity;
  item.sprite.material.opacity+= (target-current)*Math.min(1,dt*12);
  const scale=31*item.sprite.material.opacity;
  item.sprite.scale.set(scale,9.5*item.sprite.material.opacity,1);
  if(active){item.sprite.position.y=32+Math.sin(t*.006)*1.2;}
  else item.sprite.position.y=29;
 }
 // Animate the residents and traffic independently of player movement.
 for(const p of pedestrians){
  p.phase+=dt*5.2;p.group.position.x+=p.dx*dt*60;p.group.position.z+=p.dz*dt*60;
  if(Math.hypot(p.group.position.x-p.homeX,p.group.position.z-p.homeZ)>13){p.dx*=-1;p.dz*=-1;p.group.rotation.y=Math.atan2(p.dx,p.dz);}
  const swing=Math.sin(p.phase)*.32;p.leftLeg.rotation.x=swing;p.rightLeg.rotation.x=-swing;p.leftArm.rotation.x=-swing*.7;p.rightArm.rotation.x=swing*.7;
  p.group.position.y=Math.abs(Math.sin(p.phase*2))*.025;
 }
 for(const car of cars){
  car.position+=car.direction*car.speed*dt;
  if(car.position>150)car.position=-150;if(car.position< -150)car.position=150;
  if(car.axis==="z"){car.group.position.set(car.fixed,0,car.position);car.group.rotation.y=car.direction>0?Math.PI:0;}
  else{car.group.position.set(car.position,0,car.fixed);car.group.rotation.y=car.direction>0?Math.PI/2:-Math.PI/2;}
 }
 renderer.render(scene,camera);
 const near=nearest(),hint=document.getElementById("gameInteract");
 if(hint){hint.classList.toggle("visible",!!near);hint.innerHTML=near?"Press <b>E</b> to explore "+near.name:"";}
 const loc=document.getElementById("gameLocation");
 if(loc)loc.textContent="📍 "+(near?near.name:"SASKATOON · SASKATCHEWAN")+"  ·  DOWNTOWN SASKATOON";

}
requestAnimationFrame(frame);
})();