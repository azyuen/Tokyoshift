// R587 — standard three-panel professional crew registration. Purely presentational:
// the authoritative selection, eligibility and payment remain in ProSeasonPanel.
import { cars } from '../data/cars.js';
import { getCharacterVisualAsset, getCharacterAssetUrl } from '../data/characters.js';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js';
import {
  preloadCarAppearanceAssets, preloadCarWheel, ensureDerivedModularCarTextures,
  getCarPaintColor,
} from '../vehicles/CarAppearance.js';
import { preloadVisualModSelectionAssets } from '../data/visualMods.js';

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
    const asset=getCharacterVisualAsset(id,pose,{playerCharacterId:player,proCircuit:true});
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
  const queued=options._attemptedLoad?0:preload(s,units);
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
        units.filter(u=>cars[u.carId])
          .map(u=>[u.carId,cars[u.carId]])
      ));
      showCrewRegistrationScreen(s,{...options,_attemptedLoad:true});
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
  const units=options.units||[];
  const selected=(options.selection||[]).filter(id=>units.some(u=>u.id===id)).slice(0,5);
  const nodes=[], masks=[];
  const STAGE={x:24,y:92,w:1138,h:528};
  const SIDE={x:1180,y:92,w:356,h:724};
  const CARDS={x:24,y:636,w:1138,h:180};
  let closed=false;
  const add=item=>{nodes.push(item);return item;};
  // Match MeetScene / CentralTokyoScene font families and their post-zoom sizes.
  const txt=(x,y,value,size=17,color=WHITE,extra={})=>add(s.add.text(x,y,String(value),{
    fontFamily:BODY,fontSize:size+'px',fontStyle:'600',color,...extra,
  }).setDepth(230).setFontSize(size));
  const caption=(x,y,value,size=12,color=WHITE,extra={})=>
    txt(x,y,value,size,color,{fontFamily:PIXEL,...extra});
  const rect=(x,y,w,h,fill=PANEL,a=1,stroke=0x264557,depth=208,lineWidth=1)=>
    add(s.add.rectangle(x,y,w,h,fill,a).setStrokeStyle(lineWidth,stroke).setDepth(depth));
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
    const b=rect(x,y,w,h,enabled?(emphasis?0x5c1b25:0x102138):0x17202b,
      1,enabled?(emphasis?0xd54a54:0x55b8ff):0x53616e,225,2);
    if(enabled)b.setInteractive({useHandCursor:true}).on('pointerdown',fn);
    const t=caption(x,y,label,10,enabled?'#eef8ff':'#99a4af',{fontStyle:'600'});
    t.setOrigin(.5);
    if(t.width>w-14)t.setScale((w-14)/t.width);
    return b;
  };

  // The exact standard three rectangles, borders and gap geometry shared by
  // MeetScene and CentralTokyoScene. Keep the usual 1560×840 game canvas.
  rect(W/2,H/2,W,H,0x050912,1,0x050912,200).setInteractive();
  rect(STAGE.x+STAGE.w/2,STAGE.y+STAGE.h/2,STAGE.w,STAGE.h,
    0x08121d,1,0x24475f,201,2);
  rect(SIDE.x+SIDE.w/2,SIDE.y+SIDE.h/2,SIDE.w,SIDE.h,
    0x07111d,.99,0x17354d,209,2);
  rect(CARDS.x+CARDS.w/2,CARDS.y+CARDS.h/2,CARDS.w,CARDS.h,
    0x07111d,.99,0x17354d,209,2);

  // The room used to stretch to the entire 1560×840 window and only show a
  // 980px crop. Cover-scale it into the STANDARD main panel: ~27% zoom-out
  // for the 1536×864 source while keeping every edge filled.
  const stageMask=shapeMask(STAGE.x,STAGE.y,STAGE.w,STAGE.h);
  const key=roomAsset(s).key;
  if(s.textures.exists(key)) {
    const tex=s.textures.get(key),source=tex.getSourceImage();
    tex.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    const room=add(s.add.image(STAGE.x+STAGE.w/2,STAGE.y+STAGE.h/2,key)
      .setDepth(202));
    room.setScale(Math.max(STAGE.w/Math.max(1,source.width),
      STAGE.h/Math.max(1,source.height)));
    room.setMask(stageMask);
  }
  rect(STAGE.x+STAGE.w/2,STAGE.y+STAGE.h/2,STAGE.w,STAGE.h,
    0x020812,.11,0x020812,203).setMask(stageMask);

  // Standard top-of-screen title treatment (rather than an oversized banner).
  caption(34,29,'TOKYO DRAG COMPLEX',19,'#f0e9e9');
  caption(531,28,options.trophyId?'CREW TROPHY REGISTRATION':'CREW CLUB SPRINT',14,'#e78690');
  txt(532,51,'OFFICIAL TEAM REGISTRATION',14,'#b8cad6');
  caption(1197,34,'SQUAD SELECTION',12,'#b9d2e0');

  // Room briefing is subtle; leave the characters as part of the environment.
  rect(356,149,624,92,0x05111c,.77,0x29445b,211);
  caption(56,108,options.trophyId?'CREW TROPHY // REGISTRATION':'CREW CLUB SPRINT',15,'#ff9ca5');
  txt(56,142,options.trophyId==='triDrive'
    ?'FIELD ONE FWD, ONE RWD AND ONE AWD DRIVER.'
    :'REGISTER 3–5 CREW DRIVERS. YOU DRIVE EVERY HEAT.',18,WHITE);
  txt(56,167,'CREW CARS CAN BE UPGRADED BETWEEN FIXTURES.',15,'#d2e1e9');

  // Unlabelled cast, distributed naturally across room depth/foreground.
  // Feet positions and differing heights avoid the original police-lineup look.
  const protagonist=s.registry.get('playerCharacterId')||'renMizuno';
  const cast=[
    {id:'sayakaFujieda',pose:'track',x:161,feetY:568,height:237},
    {id:'daichiSakamoto',pose:'idle',x:413,feetY:602,height:218},
    {id:protagonist,pose:'idle',x:689,feetY:580,height:234},
    {id:'hiroshiSato',pose:'focus',x:991,feetY:607,height:249},
  ];
  for(const person of cast) {
    const asset=getCharacterVisualAsset(person.id,person.pose,{playerCharacterId:protagonist,proCircuit:true});
    if(!asset?.key||!s.textures.exists(asset.key))continue;
    const tex=s.textures.get(asset.key),source=tex.getSourceImage();
    tex.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    const scale=Math.min(person.height/Math.max(1,source.height),
      193/Math.max(1,source.width));
    add(s.add.ellipse(person.x,person.feetY-3,111,15,0x000000,.36)
      .setDepth(210).setMask(stageMask));
    add(s.add.image(person.x,person.feetY,asset.key).setOrigin(.5,1)
      .setScale(scale).setDepth(212).setMask(stageMask));
  }
  // Border redraw keeps all actor silhouettes inside their standard window.
  rect(STAGE.x+STAGE.w/2,STAGE.y+STAGE.h/2,STAGE.w,STAGE.h,
    0x000000,0,0x24475f,232,2);

  // Side list is unchanged in content: checkbox, face, driver, car spec, and
  // cropped front bonnet/window artwork. It is compacted to SIDE.w = 356.
  caption(SIDE.x+17,SIDE.y+18,'SELECT CREW DRIVERS',12,WHITE);
  txt(SIDE.x+18,SIDE.y+47,'SELECT 3–5',15,'#f3a0a8');
  const carStates=s.registry.get('carStates')||{};
  units.slice(0,7).forEach((u,i)=>{
    const y=SIDE.y+106+i*76,chosen=selected.includes(u.id);
    const rowX=SIDE.x+SIDE.w/2;
    const row=rect(rowX,y,324,70,chosen?0x213443:0x081e2d,.98,
      chosen?0xe86174:0x315165,214);
    row.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
      if(chosen)refresh(selected.filter(id=>id!==u.id));
      else if(selected.length<5)refresh([...selected,u.id]);
    });
    rect(SIDE.x+33,y,19,19,chosen?0xc33c51:0x08131f,1,0xe45768,217);
    if(chosen)txt(SIDE.x+22,y-13,'✓',23,'#fff3f3');
    rect(SIDE.x+75,y,53,59,0x152334,1,0x314962,216);
    const p=createCharacterProfile(s,{
      characterId:u.id,pose:'idle',x:SIDE.x+75,y,
      frameWidth:51,frameHeight:57,depth:218,playerCharacterId:protagonist,proCircuit:true,
    });
    if(p)add(p);
    const car=cars[u.carId],start=SIDE.x+106;
    const who=txt(start,y-29,u.name,16,WHITE,{fontStyle:'700'});
    if(who.width>121)who.setScale(121/who.width);
    const model=txt(start,y-7,car?.shortName||u.carId,13,'#d7e3e9');
    if(model.width>121)model.setScale(121/model.width);
    const spec=txt(start,y+15,
      String(u.drivetrain||'RWD').toUpperCase()+' · '+Math.round(u.powerKW||0)+' kW',
      12,'#b5d2dd');
    if(spec.width>123)spec.setScale(123/spec.width);
    rect(SIDE.x+SIDE.w-65,y,114,56,0x040d17,.5,0x244255,216);
    if(car&&typeof s.createCarDisplay==='function'){
      // Preserve the genuine body/paint/wheels renderer, cropping only the
      // front of the side-profile car, as in the approved mockup.
      const parts=s.createCarDisplay(car,SIDE.x+SIDE.w-93,y-15,170,218,
        getCarPaintColor(carStates[u.carId]||{}),null,false,carStates[u.carId]||{});
      const carMask=shapeMask(SIDE.x+SIDE.w-120,y-27,109,54);
      for(const part of parts){if(part?.setMask)part.setMask(carMask);add(part);}
    }
  });
  const reason=options.getReason(selected),ready=selected.length>=3&&!reason;
  txt(SIDE.x+19,SIDE.y+660,reason||'READY FOR SCRUTINEERING',15,
    ready?'#a9e4cb':'#ed9cab',{wordWrap:{width:SIDE.w-38}});
  txt(SIDE.x+19,SIDE.y+686,selected.length+' OF 5 REGISTERED',14,'#d0dfeb');

  // Five cards only. The old redundant "CREW INFO" square is removed.
  caption(CARDS.x+18,CARDS.y+13,'YOUR CREW REGISTRATION',14,WHITE);
  caption(CARDS.x+CARDS.w-25,CARDS.y+15,selected.length+' / 5',11,'#e88492')
    .setOrigin(1,0);
  const chosenUnits=selected.map(id=>units.find(u=>u.id===id)).filter(Boolean);
  for(let i=0;i<5;i++){
    const x=CARDS.x+18+i*222+104,u=chosenUnits[i];
    rect(x,CARDS.y+75,206,79,u?0x152534:0x0b111e,.98,
      u?0xe65b70:0x65404c,216);
    caption(x-90,CARDS.y+43,String(i+1).padStart(2,'0'),10,'#e97788');
    if(!u)txt(x,CARDS.y+59,'+',36,'#81909c').setOrigin(.5);
    else {
      const p=createCharacterProfile(s,{characterId:u.id,pose:'idle',
        x:x-53,y:CARDS.y+73,frameWidth:60,frameHeight:63,
        depth:219,playerCharacterId:protagonist,proCircuit:true});
      if(p)add(p);
      const first=txt(x-9,CARDS.y+47,u.name.split(' ')[0].toUpperCase(),14,'#f5d9df');
      if(first.width>94)first.setScale(94/first.width);
      const model=txt(x-9,CARDS.y+71,String(cars[u.carId]?.shortName||u.carId),12,'#a3bac9');
      if(model.width>98)model.setScale(98/model.width);
    }
  }

  // Normal Meet-style bottom action band, inside the CARDS panel.
  click(168,789,252,38,'BACK',close);
  click(450,789,252,38,'AUTO SELECT (BEST)',()=>{
    const pick=[...units].sort((a,b)=>(b.performance||0)-(a.performance||0)||
      (b.powerKW||0)-(a.powerKW||0)||a.id.localeCompare(b.id)).slice(0,5).map(u=>u.id);
    refresh(pick);
  });
  click(732,789,252,38,'CLEAR ALL',()=>refresh([]),{enabled:selected.length>0});
  click(1014,789,252,38,'REGISTER  ·  '+money(options.fee),
    ()=>options.onRegister(selected,close),{enabled:ready,emphasis:true});
}
