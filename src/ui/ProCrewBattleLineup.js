// R591 — drag-complex crew lineup: standard dialogue, controls and safe re-selection.
// Reuses the already loaded race car renderer and permanent crew identities.
// All payments, saved fixtures and racing remain in proSeason/ProSeasonPanel.
import {cars} from '../data/cars.js?v=20261017-r565';
import {getCharacterVisualAsset,getCharacterAssetUrl} from '../data/characters.js?v=20261017-r578';
import {createCharacterProfile} from '../characters/CharacterProfileRenderer.js?v=20261017-r578';
import {
  preloadCarAppearanceAssets,preloadCarWheel,ensureDerivedModularCarTextures,getCarPaintColor,
} from '../vehicles/CarAppearance.js?v=20261014-stock';

const W=1560,H=840;
const PIXEL='"Silkscreen", monospace', BODY='"Rajdhani", sans-serif';
const RED=0xe55467,BLUE=0x27c8eb;
const room=s=>String(s.worldPhase||'night').toLowerCase()==='day'?'day':'night';
const roomKey=phase=>'proCrewRegoZoomed'+(phase==='day'?'Day':'Night');
const formatName=f=>({DUEL:'HEAD TO HEAD',RELAY:'TEAM RELAY',
  TECHNICAL:'CONSISTENCY',FOUR_WIDE:'FOUR-WIDE'})[f]||String(f||'CREW BATTLE');
const normaliseDrive=d=>({FF:'FWD',FR:'RWD'})[String(d).toUpperCase()]||String(d||'RWD').toUpperCase();

export function getProCrewHeatAdvice(fixture,units){
  const format=fixture?.format||'DUEL';
  const ordered=[...units].filter(u=>u.validAssignment)
    .sort((a,b)=>(b.performance||0)-(a.performance||0));
  const names=ordered.slice(0,3).map(u=>u.name.split(' ')[0]);
  const leaders=names.length?'YOUR STRONGEST OPTIONS: '+names.join(', ')+'.':'CHECK YOUR CREW GARAGE BEFORE THIS RACE.';
  const rule=format==='RELAY'
    ?'COMBINED ELAPSED TIME DECIDES THIS RELAY. PICK THREE FAST, RELIABLE CARS.'
    :format==='TECHNICAL'
    ?'THE SMALLEST SPREAD ACROSS THREE CLEAN RUNS WINS. FAVOUR CONSISTENCY OVER PEAK POWER.'
    :format==='FOUR_WIDE'
    ?'PLACING POINTS COUNT IN ALL THREE FOUR-LANE HEATS. MIX STRONG LAUNCHES WITH TOP-END SPEED.'
    :'YOU NEED TWO HEAT WINS. PAIR YOUR QUICKEST CARS WITH DRIVERS YOU CONTROL CONSISTENTLY.';
  return rule+' '+leaders;
}

function loadAssets(s,units){
  let count=0;
  const phase=room(s),key=roomKey(phase);
  if(!s.textures.exists(key)){
    s.load.image(key,'assets/CentralTokyo/dragcomplex/regozoomed_'+phase+'.png?v=20261018-r589');
    count++;
  }
  for(const [key,path] of [
    ['proCrewSayaka','assets/Characters/Main/race_sayaka_fujieda_idle.png'],
    ['proCrewHiroshi','assets/Characters/Central/hiroshi_sato_focus.png'],
  ]) if(!s.textures.exists(key)){
    s.load.image(key,getCharacterAssetUrl(path));count++;
  }
  const id=s.registry.get('playerCharacterId')||'renMizuno';
  for(const u of units){
    const asset=getCharacterVisualAsset(u.id,'idle',{playerCharacterId:id});
    if(asset?.key&&asset.path&&!s.textures.exists(asset.key)){
      s.load.image(asset.key,getCharacterAssetUrl(asset.path));count++;
    }
  }
  const state=s.registry.get('carStates')||{};
  const unique=Object.fromEntries(units.filter(u=>cars[u.carId]).map(u=>[u.carId,cars[u.carId]]));
  count+=preloadCarAppearanceAssets(s,unique,'20261018-r589');
  for(const [id,car] of Object.entries(unique))
    count+=preloadCarWheel(s,car,state[id]||{});
  return count;
}

export function showProCrewHeatSelection(s,options){
  if(s._proCrewLineupLoading)return;
  const units=options.units||[];
  const pending=options._loaded?0:loadAssets(s,units);
  if(pending){
    s._proOverlayClose?.();
    s._proCrewLineupLoading=true;
    const v=s.add.rectangle(W/2,H/2,W,H,0x07111d,.99).setDepth(200).setInteractive();
    const t=s.add.text(W/2,H/2,'PREPARING CREW PADDOCK',{
      fontFamily:PIXEL,fontSize:'18px',color:'#f6f5f6',
    }).setOrigin(.5).setDepth(201);
    const cleanup=()=>{s._proCrewLineupLoading=false;v.destroy();t.destroy();};
    const shutdown=()=>{s.load.off('complete',done);cleanup();};
    const done=()=>{
      s.events.off('shutdown',shutdown);
      cleanup();
      if(!s.sys?.isActive?.())return;
      ensureDerivedModularCarTextures(s,Object.fromEntries(
        units.filter(u=>cars[u.carId]).map(u=>[u.carId,cars[u.carId]])));
      showProCrewHeatSelection(s,{...options,_loaded:true});
    };
    s.events.once('shutdown',shutdown);
    s.load.once('complete',done);
    s.load.start();
    return;
  }
  draw(s,options);
}

function draw(s,opts){
  s._proOverlayClose?.();
  const units=opts.units||[],selected=(opts.selected||[]).slice(0,3);
  while(selected.length<3)selected.push(null);
  const objects=[],maskShapes=[];
  const add=o=>{objects.push(o);return o;};
  const rect=(x,y,w,h,color=0x091726,alpha=1,outline=0x38546a,depth=210)=>
    add(s.add.rectangle(x,y,w,h,color,alpha).setStrokeStyle(2,outline).setDepth(depth));
  const text=(x,y,str,size=18,color='#f5f3f3',pixel=false,depth=230)=>{
    const obj=add(s.add.text(x,y,String(str),{fontFamily:pixel?PIXEL:BODY,
      fontSize:size+'px',color,fontStyle:'600',wordWrap:{width:750}})
      .setDepth(depth).setFontSize(size));
    return obj;
  };
  const mask=(x,y,w,h)=>{
    const shape=s.make.graphics({add:false});
    shape.fillStyle(0xffffff,1).fillRect(x,y,w,h);
    maskShapes.push(shape);
    return shape.createGeometryMask();
  };
  const polygon=(x,y,w,h,slant,fill,stroke,depth)=>{
    const poly=add(s.add.polygon(x,y,[slant,0,w,0,w-slant,h,0,h],fill,.95)
      .setOrigin(0,0).setStrokeStyle(3,stroke).setDepth(depth));
    return poly;
  };
  let closed=false;
  const close=()=>{
    if(closed)return;
    closed=true;s.events.off('shutdown',close);
    objects.forEach(x=>{try{x.destroy();}catch(_){}});
    maskShapes.forEach(x=>{try{x.destroy();}catch(_){}});
    if(s._proOverlayClose===close)s._proOverlayClose=null;
  };
  s._proOverlayClose=close;s.events.once('shutdown',close);
  const reopen=(next,other={})=>{
    close();
    showProCrewHeatSelection(s,{...opts,selected:next,_loaded:true,...other});
  };
  const btn=(x,y,w,h,label,callback,red=false,disabled=false,depth=246)=>{
    const hit=rect(x,y,w,h,disabled?0x1b2330:red?0x6f1b30:0x11283b,
      1,disabled?0x546474:red?RED:BLUE,depth);
    if(!disabled)hit.setInteractive({useHandCursor:true}).on('pointerdown',callback);
    const c=text(x,y,label,12,disabled?'#8494a3':'#f6fbff',true,depth+1).setOrigin(.5);
    if(c.width>w-12)c.setScale((w-12)/c.width);
    return hit;
  };
  const phase=room(s),key=roomKey(phase);
  rect(W/2,H/2,W,H,0x030a14,1,0x030a14,200).setInteractive();
  if(s.textures.exists(key)){
    const src=s.textures.get(key).getSourceImage();
    const image=add(s.add.image(W/2,H/2,key).setDepth(201));
    image.setScale(Math.max(W/Math.max(1,src.width),H/Math.max(1,src.height)));
    s.textures.get(key).setFilter?.(Phaser.Textures.FilterMode.NEAREST);
  }
  rect(W/2,H/2,W,H,0x020714,.12,0x020714,202);
  // Keep faces at their original vertical level while enlarging sprites 75%.
  // Their torsos extend below the screen, ready for a foreground table overlay.
  for(const p of [
    {key:'proCrewSayaka',x:1056,feet:720,height:548,flip:false},
    {key:'proCrewHiroshi',x:1366,feet:740,height:580,flip:true},
  ]){
    if(!s.textures.exists(p.key))continue;
    const source=s.textures.get(p.key).getSourceImage();
    s.textures.get(p.key).setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    const scale=1.75*Math.min(p.height/Math.max(1,source.height),
      335/Math.max(1,source.width));
    // Enlarging down from the original top keeps the face in quadrant two.
    const feet=p.feet+p.height*.75;
    add(s.add.ellipse(p.x,feet-7,260,28,0,.42).setDepth(210));
    add(s.add.image(p.x,feet,p.key).setOrigin(.5,1)
      .setFlipX(p.flip).setScale(scale).setDepth(212));
  }

  // EXACT regional Crew Battle typography and framing from MeetScene.
  // Only event/format and heat rules differ.
  const f=opts.fixture||{},e=opts.event||{};
  const meetHeader=(x,y,w,h,fill,alpha=1)=>{
    const g=add(s.add.graphics().setDepth(218));
    g.fillStyle(fill,alpha);
    g.fillPoints([{x:x+15,y},{x:x+w,y},{x:x+w-15,y:y+h},{x,y:y+h}],true);
    return g;
  };
  const meetText=(x,y,value,size,color='#ffffff')=>add(s.add.text(x,y,String(value),{
    fontFamily:'"Exo 2", sans-serif',fontSize:size+'px',
    fontStyle:'italic 900',color,stroke:'#090d16',
    strokeThickness:size>=24?5:1,
  }).setDepth(229));
  const pixelText=(x,y,value,size,color)=>add(s.add.text(x,y,String(value),{
    fontFamily:PIXEL,fontSize:size+'px',color,
  }).setDepth(229));
  meetHeader(52,40,245,43,0x03070c,.96);
  meetText(72,48,e.openCircuit===false?'PRO SEASON':'OPEN CIRCUIT',19,'#48d9ff');
  const shortEventTitle={RELAY:'CREW RELAY',TECHNICAL:'CREW TECHNICAL',
    FOUR_WIDE:'CREW FOUR-WIDE',DUEL:'CREW CLUB SPRINT'};
  const eventTitle=String(e.trophyId||!e.short?e.label:
    shortEventTitle[f.format]||e.label||'CREW CLUB SPRINT').toUpperCase();
  meetText(58,85,eventTitle,38,'#ffffff');
  meetHeader(54,151,620,41,0x081522,.73);
  const heatRule=f.heatRule||f.raceRule||
    (f.format==='RELAY'?'1/4 MI // STANDING START // RELAY':
     f.format==='TECHNICAL'?'1/4 MI // STANDING START // CONSISTENCY':
     f.format==='FOUR_WIDE'?'1/4 MI // STANDING START // FOUR-WIDE':
     '1/4 MI // STANDING START // THREE HEATS');
  pixelText(74,163,String(heatRule).toUpperCase(),13,'#a8c4d7');
  // Professional crew fixtures have no general power cap, but require three
  // distinct registered crew cars. Tri-Drive uniquely requires FWD/RWD/AWD.
  pixelText(74,202,e.trophyId==='triDrive'?
    'CAR RULE: ONE FWD + ONE RWD + ONE AWD':
    'CAR RULE: THREE DISTINCT CREW CARS // NO POWER CAP',11,'#c8d9e7');

  // Standard Tokyo SHIFT confirmation modal (centre-screen, matching the
  // existing rectangular popup/button language). Advice is a paid-event
  // resource; ProSeasonPanel passes the persisted cooldown status.
  const adviceUsed=Boolean(e.adviceUsed);
  const adviceRemaining=Math.max(0,Number(opts.adviceStatus?.remaining||0));
  const canAsk=!adviceUsed&&adviceRemaining===0;
  btn(1055,617,235,43,'ASK FOR ADVICE',()=>{
    if(!canAsk)return;
    rect(W/2,H/2,W,H,0x020812,.76,0x020812,270).setInteractive();
    rect(780,420,850,332,0xfffcf1,1,0x111111,271);
    const headline=text(404,281,'ASK SAYAKA FOR STRATEGIC ADVICE',21,'#111111',false,272);
    headline.setFontStyle?.('800');
    const body=text(405,347,
      'Ask Sayaka for strategic advice.\n'+
      'Sayaka can advise you on ways to win this event. If you ask for her help, you can ask her again after two more professional events.',
      21,'#111111',false,272);
    body.setWordWrapWidth?.(745);
    body.setLineSpacing?.(7);
    const modalButton=(x,label,action)=>{
      const hit=rect(x,515,294,52,0x172636,1,0x566b7e,273);
      hit.setInteractive({useHandCursor:true}).on('pointerdown',action);
      text(x,515,label,11,'#ffffff',true,274).setOrigin(.5);
    };
    modalButton(614,'MAYBE NEXT TIME',()=>reopen(selected,{popupSlot:null}));
    modalButton(946,'ASK FOR ADVICE',()=>{
      close();
      opts.onAdvice?.(selected);
    });
  },false,!canAsk);
  if(!canAsk){
    const remainingLabel=adviceUsed?'ADVICE USED FOR THIS EVENT':
      'AVAILABLE AFTER '+adviceRemaining+' MORE PROFESSIONAL EVENTS';
    text(938,654,remainingLabel,13,'#d3e4ef',false,241);
  }

  if(adviceUsed){
    // Reuse MangaCutscene's cream card, 6px black trim and black speaker tab.
    // The pointer is on the RIGHT vertical edge, facing visible Sayaka.
    const boxX=402,boxY=308,boxW=728,boxH=187;
    rect(boxX,boxY,boxW,boxH,0xfffcf1,1,0x111111,235)
      .setStrokeStyle(6,0x111111,1);
    const bubble=add(s.add.graphics().setDepth(236));
    bubble.fillStyle(0xfffcf1,1);
    bubble.lineStyle(5,0x111111,1);
    const edge=boxX+boxW/2;
    bubble.fillTriangle(edge-4,boxY-28,edge+53,boxY+5,edge-4,boxY+33);
    bubble.strokeTriangle(edge-4,boxY-28,edge+53,boxY+5,edge-4,boxY+33);
    // Retouch the white base across the triangle seam without obscuring
    // its black outer trim; same placement logic as MangaCutscene pointer.
    rect(186,boxY-boxH/2-14,248,34,0x111111,1,0x111111,237);
    text(79,boxY-boxH/2-27,'SAYAKA',13,'#ffffff',true,238);
    const adviceText=text(77,boxY-54,opts.advice||'NO ADVICE AVAILABLE.',
      20,'#111111',false,238);
    adviceText.setWordWrapWidth?.(654);
    adviceText.setLineSpacing?.(5);
  }

  // Exact Crew Battle left-side panel geometry, colours, font sizes and
  // character/car arrangement copied from MeetScene regional battle renderer.
  const framePoints=(x,y,w,h,skew=32)=>[
    {x:x+skew,y},{x:x+w+skew,y},
    {x:x+w-skew,y:y+h},{x:x-skew,y:y+h},
  ];
  const graphicPanel=(x,y,w,h,fill,border,alpha=1,skew=17,depth=221)=>{
    const pts=framePoints(x,y,w,h,skew);
    const g=add(s.add.graphics().setDepth(depth));
    g.fillStyle(fill,alpha);g.fillPoints(pts,true);
    g.lineStyle(3,border,1);g.strokePoints(pts,true);
    return pts;
  };
  const clipPoly=(obj,pts)=>{
    const g=s.make.graphics({add:false});
    g.fillStyle(0xffffff,1);g.fillPoints(pts,true);
    maskShapes.push(g);obj.setMask(g.createGeometryMask());
  };
  const frame=framePoints(24,399,730,405,32);
  const fg=add(s.add.graphics().setDepth(219));
  fg.fillStyle(0x030b16,.77);fg.fillPoints(frame,true);
  fg.lineStyle(5,0x35d6ff,1);fg.strokePoints(frame,true);
  meetText(85,409,'YOUR LINEUP',26,'#35d6ff');
  const state=s.registry.get('carStates')||{};
  const player=s.registry.get('playerCharacterId')||'renMizuno';
  selected.forEach((id,index)=>{
    const x=[63,292,521][index],y=463;
    const u=units.find(v=>v.id===id);
    const portrait=graphicPanel(x,y,211,168,0x165578,0x050a10,.65,13,222);
    const carX=x-30;
    const carPanel=graphicPanel(carX,y+228,211,98,0x0a2b48,BLUE,.78,8,222);
    if(u){
      const profile=createCharacterProfile(s,{
        characterId:u.id,pose:'idle',x:x+105,y:y+84,
        frameWidth:226,frameHeight:171,side:'center',depth:225,
        mask:false,playerCharacterId:player,
      });
      if(profile?.image){add(profile.image);clipPoly(profile.image,portrait);}
      const car=cars[u.carId];
      if(car&&typeof s.createCarDisplay==='function'){
        // Correct CentralTokyoScene.createCarDisplay signature. R590 passed
        // false as paintColor and a colour string as flipX; selecting an
        // existing driver then redrawing could throw and leave a black veil.
        const pieces=s.createCarDisplay(car,carX+105,y+277,200,225,
          getCarPaintColor(state[u.carId]||{}),null,false,state[u.carId]||{});
        for(const piece of pieces){add(piece);if(piece?.setMask)clipPoly(piece,carPanel);}
      }
    }
    const name=u?String(u.name||u.id).toUpperCase():'SELECT DRIVER';
    const model=u?String(cars[u.carId]?.shortName||u.carId).toUpperCase():'TAP TO ASSIGN';
    add(s.add.text(x+105,y+176,name,{
      fontFamily:PIXEL,fontSize:'10px',color:'#ffffff',align:'center',
    }).setOrigin(.5,0).setDepth(229));
    add(s.add.text(carX+105,y+199,model,{
      fontFamily:PIXEL,fontSize:'9px',color:'#cbd8e5',align:'center',
    }).setOrigin(.5,0).setDepth(229));
    add(s.add.rectangle(x+105,y+163,211,326,0xffffff,0)
      .setInteractive({useHandCursor:true}).setDepth(231)
      .on('pointerdown',()=>reopen(selected,{popupSlot:index})));
  });
  const missing=selected.filter(Boolean).length!==3;
  const triDrive=e.trophyId==='triDrive'&&new Set(selected.map(id=>
    normaliseDrive(units.find(u=>u.id===id)?.drivetrain))).size!==3;
  // Same bottom action styling as MeetScene: 49px buttons, Silkscreen 10px,
  // standard navy/green surfaces. Three controls have 20px equal gaps.
  const footerButton=(x,w,label,onClick,{primary=false,disabled=false}={})=>{
    const fill=disabled?0x242a31:primary?0x143e38:0x192333;
    const outline=disabled?0x53616e:primary?0x65e7bf:0x8ba1b5;
    const hit=rect(x,779,w,49,fill,1,outline,246);
    if(!disabled)hit.setInteractive({useHandCursor:true}).on('pointerdown',onClick);
    const caption=text(x,779,label,10,disabled?'#94a2ac':'#ffffff',true,247)
      .setOrigin(.5);
    if(caption.width>w-22)caption.setScale((w-22)/caption.width);
    return hit;
  };
  footerButton(987,190,'RACE LATER',close);
  footerButton(1197,190,'CLEAR LINEUP',()=>reopen([null,null,null],{popupSlot:null}));
  footerButton(1422,220,'CONFIRM LINEUP',()=>{
    close();opts.onConfirm?.(selected);
  },{primary:true,disabled:missing||triDrive});

  // One-column roster only appears when an empty or filled lineup card is tapped.
  if(Number.isInteger(opts.popupSlot)){
    const slot=opts.popupSlot;
    rect(W/2,H/2,W,H,0x030915,.61,0x030915,249).setInteractive()
      .on('pointerdown',()=>reopen(selected,{popupSlot:null}));
    rect(1192,413,704,745,0x061421,.985,RED,250);
    text(872,61,'SELECT CREW DRIVERS',17,'#fff4f2',true,251);
    text(1457,64,'7 TEAM MEMBERS',12,'#edb4c1',true,251);
    units.slice(0,7).forEach((u,i)=>{
      const y=119+i*85,active=selected[slot]===u.id,used=selected.includes(u.id)&&!active;
      const row=rect(1192,y+28,666,77,active?0x27384c:0x0a1d2e,1,
        active?RED:0x31556c,251);
      if(!used)row.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
        const next=selected.map((v,j)=>j===slot?u.id:v);
        reopen(next,{popupSlot:null});
      });
      rect(889,y+28,25,25,active?0x813c50:0x091725,1,RED,253);
      if(active)text(880,y+10,'✓',25,'#fff2f2',false,254);
      rect(957,y+28,83,68,0x12283d,1,0x31566e,252);
      const p=createCharacterProfile(s,{characterId:u.id,pose:'idle',
        x:957,y:y+28,frameWidth:81,frameHeight:66,depth:253,playerCharacterId:player});
      if(p)add(p);
      const name=text(1011,y-1,u.name,18,used?'#85919f':'#f4f3f3',false,254);
      if(name.width>200)name.setScale(200/name.width);
      const model=text(1011,y+22,cars[u.carId]?.shortName||u.carId,14,'#c0dce8',false,254);
      if(model.width>200)model.setScale(200/model.width);
      text(1011,y+44,normaliseDrive(u.drivetrain)+' · '+Math.round(u.powerKW||0)+' kW',
        14,'#99bfce',false,254);
      rect(1412,y+28,213,68,0x040e19,.8,0x32556b,252);
      const car=cars[u.carId];
      if(car&&typeof s.createCarDisplay==='function'){
        const all=s.createCarDisplay(car,1406,y+11,166,253,
          getCarPaintColor(state[u.carId]||{}),null,false,state[u.carId]||{});
        const crop=mask(1308,y-4,207,65);
        for(const obj of all){if(obj?.setMask)obj.setMask(crop);add(obj);}
      }
      if(used)text(1467,y+44,'IN LINEUP',11,'#f0b4be',true,254);
    });
    btn(1418,758,200,40,'CLOSE',()=>reopen(selected,{popupSlot:null}),false,false,260);
  }
}
