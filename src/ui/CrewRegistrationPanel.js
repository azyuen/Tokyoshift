// R581 — professional paddock crew registration. Purely presentational:
// the authoritative selection, eligibility and payment remain in ProSeasonPanel.
import { cars } from '../data/cars.js?v=20261017-r565';
import { getCharacterVisualAsset, getCharacterAssetUrl } from '../data/characters.js?v=20261017-r578';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261017-r578';
import {
  preloadCarAppearanceAssets, preloadCarWheel, ensureDerivedModularCarTextures,
  getCarPaintColor,
} from '../vehicles/CarAppearance.js?v=20261014-stock';
import { preloadVisualModSelectionAssets } from '../data/visualMods.js?v=20261014-r501';

const W=1560, H=840, RED=0xde4759, PANEL=0x07121e, WHITE='#f5f2f3';
const BODY='"Rajdhani", sans-serif', PIXEL='"Silkscreen", monospace';
const money=n=>'¥'+Number(n||0).toLocaleString('en-US');
const getPhase=s=>String(s.worldPhase||'night').toLowerCase()==='day'?'day':'night';

// The background is already used by Chapter 09. Reusing its texture key
// avoids a second 4-MB image when the establishing scene ran first.
function roomAsset(s) {
  const phase=getPhase(s);
  return {key:'chapter09RegoRoom'+(phase==='day'?'Day':'Night'),
    path:'assets/CentralTokyo/dragcomplex/regoroom_'+phase+'.png?v=20261018-r581'};
}

function preload(s,units) {
  let queued=0;
  const room=roomAsset(s);
  if(!s.textures.exists(room.key)){s.load.image(room.key,room.path);queued++;}
  const player=s.registry.get('playerCharacterId')||'renMizuno';
  const people=[
    ['sayakaFujieda','track'],['daichiSakamoto','idle'],
    [player,'idle'],['hiroshiSato','focus'],
    ...units.map(u=>[u.id,'idle']),
  ];
  for(const [id,pose] of people) {
    const asset=getCharacterVisualAsset(id,pose,{playerCharacterId:player});
    if(asset?.key&&asset?.path&&!s.textures.exists(asset.key)){
      s.load.image(asset.key,getCharacterAssetUrl(asset.path));queued++;
    }
  }
  const state=s.registry.get('carStates')||{};
  const unique=Object.fromEntries(units.filter(u=>cars[u.carId]).map(u=>[u.carId,cars[u.carId]]));
  queued+=preloadCarAppearanceAssets(s,unique,'20261018-r581');
  for(const [id,car] of Object.entries(unique)){
    queued+=preloadCarWheel(s,car,state[id]||{});
    queued+=preloadVisualModSelectionAssets(s,id,state[id]||{},'20261018-r581');
  }
  return queued;
}

export function showCrewRegistrationScreen(s,options) {
  const units=options.units||[];
  if(s._crewRegistrationLoading)return;
  const queued=preload(s,units);
  if(queued){
    s._proOverlayClose?.();
    s._crewRegistrationLoading=true;
    const blocker=s.add.rectangle(W/2,H/2,W,H,0x050b14,.96).setDepth(200).setInteractive();
    const status=s.add.text(W/2,H/2,'PREPARING THE PADDOCK // '+queued+' ASSETS',{
      fontFamily:PIXEL,fontSize:'15px',color:WHITE,
    }).setOrigin(.5).setDepth(201);
    const clear=()=>{blocker.destroy();status.destroy();s._crewRegistrationLoading=false;};
    const onDone=()=>{
      s.events.off('shutdown',onShutdown);
      clear();
      if(!s.sys?.isActive?.())return;
      ensureDerivedModularCarTextures(s,Object.fromEntries(
        units.filter(u=>cars[u.carId]&&s.textures.exists(cars[u.carId].visual?.bodyKey||''))
          .map(u=>[u.carId,cars[u.carId]])
      ));
      showCrewRegistrationScreen(s,options);
    };
    const onShutdown=()=>{s.load.off('complete',onDone);clear();};
    s.events.once('shutdown',onShutdown);
    s.load.once('complete',onDone);
    s.load.start();
    return;
  }
  drawScreen(s,options);
}

function drawScreen(s,options) {
  s._proOverlayClose?.();
  const selected=(options.selection||[]).filter(id=>options.units.some(u=>u.id===id)).slice(0,5);
  const units=options.units, nodes=[], masks=[];
  let closed=false;
  const add=item=>{nodes.push(item);return item;};
  const txt=(x,y,value,size=17,color=WHITE,extra={})=>add(s.add.text(x,y,String(value),{
    fontFamily:BODY,fontSize:size+'px',fontStyle:'600',color,...extra,
  }).setDepth(222));
  const rect=(x,y,w,h,fill=PANEL,a=1,stroke=0x264557,depth=208)=>
    add(s.add.rectangle(x,y,w,h,fill,a).setStrokeStyle(1,stroke).setDepth(depth));
  const shapeMask=(x,y,w,h)=>{
    const g=s.make.graphics({add:false});
    g.fillStyle(0xffffff,1).fillRect(x,y,w,h);
    masks.push(g);
    return g.createGeometryMask();
  };
  const close=()=>{
    if(closed)return;
    closed=true;
    s.events.off('shutdown',close);
    for(const o of nodes)try{o?.destroy?.();}catch(_){}
    for(const m of masks)try{m.destroy();}catch(_){}
    if(s._proOverlayClose===close)s._proOverlayClose=null;
  };
  s._proOverlayClose=close;
  s.events.once('shutdown',close);
  const refresh=next=>{
    close();
    showCrewRegistrationScreen(s,{...options,selection:next});
  };
  const click=(x,y,w,h,label,fn,{enabled=true,emphasis=false}={})=>{
    const b=rect(x,y,w,h,enabled?(emphasis?0x672330:0x102331):0x242a31,
      1,enabled?(emphasis?0xef6875:0x345b72):0x4c555c,224);
    if(enabled)b.setInteractive({useHandCursor:true}).on('pointerdown',fn);
    const title=txt(x,y,label,17,enabled?'#fff2ee':'#929fa7',{fontStyle:'700'});
    title.setOrigin(.5);
    if(title.width>w-12)title.setScale((w-12)/title.width);
    return b;
  };

  // Dark standard UI shell, cinematic background restricted to the left stage.
  rect(W/2,H/2,W,H,0x030b14,1,0x030b14,200).setInteractive();
  const key=roomAsset(s).key;
  if(s.textures.exists(key)) {
    const image=add(s.add.image(W/2,H/2,key).setDepth(201));
    image.setDisplaySize(W,H);
    s.textures.get(key).setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    image.setMask(shapeMask(22,83,980,512));
  }
  rect(511,339,978,512,0x020815,.19,0x2c4b62,203);
  // Establish a professional circuit graphic language without baking any UI
  // into the background PNG.
  rect(W/2,39,W,78,0x060e1b,.98,0x30516b,214);
  rect(19,39,38,78,0xd14054,.92,0xd14054,215).setAngle(19);
  txt(64,18,'PRO DRAG CIRCUIT',28,WHITE,{fontFamily:PIXEL});
  txt(450,15,'CREW CLUB SPRINT',19,WHITE,{fontFamily:PIXEL});
  txt(450,46,'REGISTRATION  //  TOKYO DRAG COMPLEX',14,'#f47d89',{fontFamily:PIXEL});
  rect(254,151,449,116,0x06111c,.89,0xd54b62,220);
  txt(48,102,options.trophyId?'MINOR TROPHY // CREW ENTRY':'CREW CLUB SPRINT',21,'#ff7e8d',{fontFamily:PIXEL});
  txt(48,143,'REGISTER 3–5 CREW CARS. YOU DRIVE EACH HEAT.',17,WHITE);
  txt(48,172,'UPGRADE YOUR CREW CARS BETWEEN FIXTURES.',16,'#d5e0e7');

  // Cast art stays independent of the environment, so any avatar and day/night
  // phase will display the same scene. Hiroshi is the strict chief starter.
  const protagonist=s.registry.get('playerCharacterId')||'renMizuno';
  const cast=[
    {id:'sayakaFujieda',pose:'track',x:150,height:236,label:'SAYAKA'},
    {id:'daichiSakamoto',pose:'idle',x:372,height:222,label:'DAICHI'},
    {id:protagonist,pose:'idle',x:588,height:235,label:'YOU'},
    {id:'hiroshiSato',pose:'focus',x:818,height:252,label:'CHIEF STARTER'},
  ];
  for(const person of cast) {
    const asset=getCharacterVisualAsset(person.id,person.pose,{playerCharacterId:protagonist});
    if(!asset?.key||!s.textures.exists(asset.key))continue;
    const tex=s.textures.get(asset.key), source=tex.getSourceImage();
    tex.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    const scale=Math.min(person.height/Math.max(1,source.height),
      196/Math.max(1,source.width));
    add(s.add.ellipse(person.x,573,115,18,0x000000,.4).setDepth(207));
    add(s.add.image(person.x,575,asset.key).setOrigin(.5,1)
      .setScale(scale).setDepth(211));
    rect(person.x,581,157,25,0x05111e,.83,0x294458,216);
    txt(person.x,570,person.label,12,'#dceaf4',{fontFamily:PIXEL}).setOrigin(.5,0);
  }

  // Scroll-free seven-driver registry; entire rows are tappable. Portraits
  // use the game's canonical face-anchor renderer and modular car previews.
  rect(1272,433,536,704,0x051522,.97,0x376079,210);
  txt(1027,101,'SELECT CREW DRIVERS',19,WHITE,{fontFamily:PIXEL});
  txt(1520,105,'SELECT 3–5',14,'#ef788b').setOrigin(1,0);
  const carStates=s.registry.get('carStates')||{};
  units.slice(0,7).forEach((u,i)=>{
    const y=151+i*79,chosen=selected.includes(u.id);
    const row=rect(1271,y+30,509,74,chosen?0x213443:0x081e2d,.98,
      chosen?0xf26072:0x315165,215);
    row.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
      if(chosen)refresh(selected.filter(id=>id!==u.id));
      else if(selected.length<5)refresh([...selected,u.id]);
    });
    rect(1035,y+30,24,24,chosen?0xc33c51:0x08131f,1,0xe45768,218);
    if(chosen)txt(1026,y+15,'✓',24,'#fff3f3');
    rect(1104,y+30,71,65,0x152334,1,0x314962,217);
    const p=createCharacterProfile(s,{
      characterId:u.id,pose:'idle',x:1104,y:y+30,
      frameWidth:69,frameHeight:63,depth:218,playerCharacterId:protagonist,
    });
    if(p)add(p);
    const c=cars[u.carId];
    const carLabel=c?.shortName||u.carId;
    const who=txt(1150,y+2,u.name,18,WHITE,{fontStyle:'700'});
    if(who.width>172)who.setScale(172/who.width);
    const short=txt(1150,y+27,carLabel,15,'#d7e3e9');
    if(short.width>174)short.setScale(174/short.width);
    txt(1150,y+48,String(u.drivetrain||'RWD').toUpperCase()+'  ·  '+Math.round(u.powerKW||0)+' kW',
      14,'#b5d2dd');
    const thumb=rect(1438,y+30,163,63,0x040d17,.5,0x244255,217);
    if(c&&typeof s.createCarDisplay==='function'){
      const parts=s.createCarDisplay(c,1396,y+11,232,218,
        getCarPaintColor(carStates[u.carId]||{}),null,false,carStates[u.carId]||{});
      const carMask=shapeMask(1357,y,161,63);
      for(const part of parts){if(part?.setMask)part.setMask(carMask);add(part);}
    }
    txt(1510,y+5,chosen?'IN':'',12,'#f5abb2',{fontFamily:PIXEL}).setOrigin(1,0);
  });

  // Reclaim the lower-left blank space for the actual submitted five-car squad.
  rect(511,694,978,184,0x061320,.99,0x345b74,214);
  txt(38,613,'YOUR CREW REGISTRATION',18,WHITE,{fontFamily:PIXEL});
  txt(965,615,selected.length+' / 5',16,'#ef8592').setOrigin(1,0);
  const chosenUnits=selected.map(id=>units.find(u=>u.id===id)).filter(Boolean);
  for(let i=0;i<5;i++){
    const x=102+i*142, u=chosenUnits[i];
    rect(x,710,134,126,u?0x152534:0x0b111e,.98,u?0xe65b70:0x65404c,218);
    txt(x-56,655,String(i+1).padStart(2,'0'),13,'#eb6275',{fontFamily:PIXEL});
    if(!u)txt(x,691,'+',37,'#81909c').setOrigin(.5);
    else {
      const p=createCharacterProfile(s,{characterId:u.id,pose:'idle',
        x:x,y:698,frameWidth:67,frameHeight:57,depth:220,playerCharacterId:protagonist});
      if(p)add(p);
      const name=txt(x,736,u.name.split(' ')[0].toUpperCase(),13,'#f5d9df');
      name.setOrigin(.5);if(name.width>122)name.setScale(122/name.width);
      const id=txt(x,754,String(cars[u.carId]?.shortName||u.carId).toUpperCase(),10,'#9db6c5');
      id.setOrigin(.5);if(id.width>120)id.setScale(120/id.width);
    }
  }
  rect(859,710,264,126,0x071923,.96,0x34617b,218);
  txt(740,656,'CREW INFO',15,WHITE,{fontFamily:PIXEL});
  txt(740,684,'CARS REGISTERED',14,'#bad3e1');
  txt(951,684,selected.length+' / 5',15,'#eff7fa').setOrigin(1,0);
  txt(740,710,'TOTAL POWER',14,'#bad3e1');
  txt(951,710,Math.round(chosenUnits.reduce((sum,u)=>sum+(u.powerKW||0),0))+' kW',
    15,'#eff7fa').setOrigin(1,0);
  txt(740,736,'DRIVETRAINS',14,'#bad3e1');
  txt(951,736,[...new Set(chosenUnits.map(u=>String(u.drivetrain||'RWD').toUpperCase()))].join(' / ')||'—',
    13,'#eff7fa').setOrigin(1,0);
  const reason=options.getReason(selected);
  const ready=selected.length>=3&&!reason;
  txt(1026,740,reason||'READY FOR SCRUTINEERING',15,ready?'#a9e4cb':'#ed9cab',
    {wordWrap:{width:490}});

  // Wide, thumb-friendly actions match the main Drag Complex control rhythm.
  click(170,810,286,45,'BACK',close);
  click(493,810,312,45,'AUTO SELECT (BEST)',()=>{
    const pick=[...units].sort((a,b)=>(b.performance||0)-(a.performance||0)||
      (b.powerKW||0)-(a.powerKW||0)||a.id.localeCompare(b.id)).slice(0,5).map(u=>u.id);
    refresh(pick);
  });
  click(830,810,320,45,'CLEAR ALL',()=>refresh([]),{enabled:selected.length>0});
  click(1299,810,455,45,'REGISTER  ·  '+money(options.fee),
    ()=>options.onRegister(selected,close),{enabled:ready,emphasis:true});
}
