// R610 — Centre selected-crew roster cars vertically within each row.
// Reuses the already loaded race car renderer and permanent crew identities.
// All payments, saved fixtures and racing remain in proSeason/ProSeasonPanel.
import {cars} from '../data/cars.js?v=20261017-r565';
import {getCharacterVisualAsset,getCharacterAssetUrl} from '../data/characters.js?v=20261017-r578';
import {addProGlowingHotspot,addProHeatSubtitle,renderStewardBriefing,renderPagedStewardBriefing,showProSayakaAdviceConfirm} from './ProBriefingChrome.js?v=20261019-r612';
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

// Spoken, context-specific strategy from Sayaka, using the actual roster,
// car models, race format and driver strengths rather than generic all-caps.
export function getProCrewHeatAdvice(fixture,units){
  const format=fixture?.format||'DUEL';
  const best=[...(units||[])].filter(u=>u.validAssignment)
    .sort((a,b)=>format==='TECHNICAL'
      ? (b.skill||0)-(a.skill||0)||(b.performance||0)-(a.performance||0)
      : (b.performance||0)-(a.performance||0)||(b.skill||0)-(a.skill||0))
    .slice(0,3);
  const lineup=best.map(u=>u.name.split(' ')[0]+' ('+
    String(cars[u.carId]?.shortName||u.carId||'car')+')');
  const recommendations=lineup.length===3?
    'I would try '+lineup[0]+', '+lineup[1]+', and '+lineup[2]+'.':
    'Check which three crew cars are available before you line up.';
  const note=format==='TECHNICAL'?
    'Hrmmm, this race is technical. Consistency beats peak power. ':
    format==='RELAY'?
    'Hrmmm, a relay. Your three times add up, so clean starts and reliable shifts matter. ':
    format==='FOUR_WIDE'?
    'Hrmmm, four-wide. Every placing counts, so strong launches and smooth shifts will help. ':
    'Hrmmm, you need two heat wins. Pair quick cars with drivers you can launch cleanly. ';
  return note+recommendations;
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
    const t=s.add.text(W/2,H/2,'PREPARING RACE BRIEFING',{
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
  const unpaid=Boolean(opts.unpaid),locked=Boolean(opts.locked),fee=Number(opts.entryFee||0);
  while(selected.length<3)selected.push(null);
  const objects=[],maskShapes=[];
  let dialogueNodes=[],activeDialogue=null;
  const dialogueAdd=o=>{dialogueNodes.push(o);return add(o);};
  const clearDialogue=()=>{dialogueNodes.forEach(o=>{try{o?.destroy?.();}catch(_){}});
    dialogueNodes=[];activeDialogue=null;};
  let scopedObjects=null,scopedMasks=null;
  const add=o=>{objects.push(o);if(scopedObjects)scopedObjects.push(o);return o;};
  const clearGroup=(nodes,masks=[])=>{
    nodes.forEach(o=>{try{o?.destroy?.();}catch(_){}});
    masks.forEach(o=>{try{o?.destroy?.();}catch(_){}});
  };
  const scope=(nodes,masks=null)=>{scopedObjects=nodes;scopedMasks=masks;};
  const unscope=()=>{scopedObjects=null;scopedMasks=null;};
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
    maskShapes.push(shape);if(scopedMasks)scopedMasks.push(shape);
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
    clearDialogue();
    s._proSayakaClose?.();
    objects.forEach(x=>{try{s.tweens?.killTweensOf?.(x);x.destroy();}catch(_){}});
    maskShapes.forEach(x=>{try{x.destroy();}catch(_){}});
    if(s._proOverlayClose===close)s._proOverlayClose=null;
  };
  s._proOverlayClose=close;s.events.once('shutdown',close);
  // R594 jumped the shared Silkscreen button labels from 10–12px to 16px.
  // 13px is the midpoint, applied uniformly to Ask, footer, close and modal actions.
  const BUTTON_FONT=13;
  const btn=(x,y,w,h,label,callback,red=false,disabled=false,depth=246)=>{
    const hit=rect(x,y,w,h,disabled?0x1b2330:red?0x6f1b30:0x11283b,
      1,disabled?0x546474:red?RED:BLUE,depth);
    if(!disabled)hit.setInteractive({useHandCursor:true}).on('pointerdown',callback);
    const c=text(x,y,label,BUTTON_FONT,disabled?'#8494a3':'#f6fbff',true,depth+1).setOrigin(.5);
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
    const baseScale=Math.min(p.height/Math.max(1,source.height),
      335/Math.max(1,source.width));
    const scale=(p.key==='proCrewHiroshi'?1.75*.85:1.75)*baseScale;
    // Preserve the exact ORIGINAL top of the rendered sprite, even when the
    // source was width-limited rather than height-limited.
    const feet=p.feet+source.height*(scale-baseScale);
    add(s.add.ellipse(p.x,feet-7,260,28,0,.42).setDepth(210));
    add(s.add.image(p.x,feet,p.key).setOrigin(.5,1)
      .setFlipX(p.flip).setScale(scale).setDepth(212));
  }

  // EXACT regional Crew Battle typography and framing from MeetScene.
  // Only event/format and heat rules differ.
  const f=opts.fixture||{},e=opts.event||{};
  const heatIndex=Math.min(2,Math.max(0,Number(f.prepared?.revealed||0)));
  const meetHeader=(x,y,w,h,fill,alpha=1)=>{
    const g=add(s.add.graphics().setDepth(218));
    g.fillStyle(fill,alpha);
    g.fillPoints([{x:x+15,y},{x:x+w,y},{x:x+w-15,y:y+h},{x,y:y+h}],true);
    return g;
  };
  const meetText=(x,y,value,size,color='#ffffff')=>add(s.add.text(x,y,String(value),{
    fontFamily:'"Exo 2", sans-serif',fontSize:size+'px',
    fontStyle:'italic 900',color,stroke:'#090d16',
    strokeThickness:size>=24?5:3,
  }).setDepth(229));
  const pixelText=(x,y,value,size,color)=>add(s.add.text(x,y,String(value),{
    fontFamily:PIXEL,fontSize:size+'px',color,
  }).setDepth(229));
  meetHeader(52,40,245,43,0x03070c,.96);
  meetText(72,48,e.openCircuit===false?'PRO SEASON':'OPEN CIRCUIT',19,
    e.openCircuit===false?'#48d9ff':'#f06e88');
  const shortEventTitle={RELAY:'CREW RELAY',TECHNICAL:'CREW TECHNICAL',
    FOUR_WIDE:'CREW FOUR-WIDE',DUEL:'CREW CLUB SPRINT'};
  const eventTitle=String(e.trophyId||!e.short?e.label:
    shortEventTitle[f.format]||e.label||'CREW CLUB SPRINT').toUpperCase();
  meetText(58,85,eventTitle,38,'#ffffff');
  addProHeatSubtitle(s,add,{heat:heatIndex+1,total:3});
  // Official details now live exclusively in Hiroshi's toggleable briefing.
  // No grey rule text competes with the CREW TECHNICAL / CREW RELAY heading.
  const heatRule=f.heatRule||f.raceRule||
    (f.format==='RELAY'?'1/4 MI // STANDING START // RELAY':
     f.format==='TECHNICAL'?'1/4 MI // STANDING START // CONSISTENCY':
     f.format==='FOUR_WIDE'?'1/4 MI // STANDING START // FOUR-WIDE':
     '1/4 MI // STANDING START // THREE HEATS');
  const crewRule=e.trophyId==='triDrive'?'ONE FWD + ONE RWD + ONE AWD':
    'THREE DISTINCT CREW CARS';
  const nextOpponent=f.opponent?.drivers?.[heatIndex];
  const crewRows=[
    ['EVENT',eventTitle],
    ['FORMAT',formatName(f.format)],
    ['NEXT DRIVER',String(f.opponent?.name||'OPPOSING CREW')+' #'+(heatIndex+1)],
    ['NEXT CAR',String(cars[nextOpponent?.carId]?.shortName||nextOpponent?.carId||'TBA').toUpperCase()],
    ['CAR RULE',crewRule],
    ['POWER / NOS','NO GENERAL CAP / NOS ALLOWED'],
  ];
  // Keep the legacy trophy briefings unchanged pending the separate trophy
  // design pass. Ordinary Pro Crew sprints receive format + technical pages.
  const fixtureText=e.short?'SINGLE FIXTURE':'FIXTURE '+(Number(f.round||0)+1)+' OF 3';
  const crewFormatText={
    DUEL:'3V3 HEAD-TO-HEAD',
    RELAY:'3-LEG TEAM RELAY',
    TECHNICAL:'THREE-DRIVER CONSISTENCY',
    FOUR_WIDE:'THREE FOUR-WIDE HEATS',
  }[f.format]||formatName(f.format);
  const crewExplanations={
    DUEL:{
      work:'Three separate 1/4-mile drag races. Select three different crew drivers and cars; each races one opposing driver.',
      win:e.short?'Win at least two of the three heats to claim the fixture. All three results affect your reward.':
        'Win at least two of the three heats to claim this fixture. Results from all three fixtures determine the series.',
    },
    RELAY:{
      work:'Three drivers each complete a 1/4-mile run. Their elapsed times are added together for the crew total.',
      win:'The crew with the lowest combined time wins. All three drivers must complete their runs cleanly.',
    },
    TECHNICAL:{
      work:'Three drivers each make one run. The spread between your fastest and slowest times measures consistency.',
      win:'The smallest time spread wins. All three runs must be completed cleanly.',
    },
    FOUR_WIDE:{
      work:'Each of your three drivers enters a four-car heat. Your team earns points from each finishing position.',
      win:'1st = 3 pts, 2nd = 2, 3rd = 1, 4th = 0. Reach 8–9 total points for the top reward tier.',
    },
  };
  const crewExplainer=crewExplanations[f.format]||crewExplanations.DUEL;
  const crewPages=[
    {sections:[
      {text:crewFormatText+' · '+fixtureText,large:true},
      {label:'HOW IT WORKS',paragraphs:[crewExplainer.work,crewExplainer.win]},
    ]},
    {rows:[
      ['OPPOSING CREW',String(f.opponent?.name||'OPPOSING CREW').toUpperCase()],
      ['NEXT CAR',String(cars[nextOpponent?.carId]?.shortName||nextOpponent?.carId||'TBA').toUpperCase()],
      ['RACE',heatRule],
      ['CAR RULE',crewRule],
      ['POWER LIMIT','NO GENERAL CAP'],
      ['NOS','ALLOWED'],
      ['ENTRY FEE','¥'+Number(e.entryFee||0).toLocaleString('en-US')],
    ]},
  ];
  const toggleSteward=()=>{
    if(activeDialogue==='hiroshi'){clearDialogue();return;}
    clearDialogue();activeDialogue='hiroshi';
    if(e.trophyId){
      renderStewardBriefing(s,dialogueAdd,crewRows,{anchorX:1366,height:218});
    }else{
      renderPagedStewardBriefing(s,dialogueAdd,crewPages,{anchorX:1366});
    }
  };
  const crewGlow=(x,y,w,label,action,disabled=false)=>
    addProGlowingHotspot(s,add,{x,y,w,h:44,label,onClick:action,disabled});

  // Both support characters now have workshop-style breathing cyan controls
  // at the same height (their belt/waist). The two bubbles never overlap.
  const adviceUsed=Boolean(e.adviceUsed);
  const adviceRemaining=Math.max(0,Number(opts.adviceStatus?.remaining||0));
  const canAsk=!adviceUsed&&adviceRemaining===0;
  const askAdvice=()=>{
    if(!canAsk)return;
    clearDialogue();
    showProSayakaAdviceConfirm(s,{
      message:'Advice applies to every heat of this event. The cooldown covers this event and the next two professional events.',
      onConfirm:()=>{close();opts.onAdvice?.([...selected]);},
    });
  };
  const toggleSayaka=()=>{
    if(activeDialogue==='sayaka'){clearDialogue();return;}
    clearDialogue();activeDialogue='sayaka';
    const x=427,y=285,w=480,h=136,edge=x+w;
    const triangleBase=36,tipX=edge+Math.sqrt(3)*triangleBase/2;
    const centerY=y+42,halfBase=triangleBase/2;
    const points=[
      {x,y},{x:edge,y},{x:edge,y:centerY-halfBase},
      {x:tipX,y:centerY},{x:edge,y:centerY+halfBase},
      {x:edge,y:y+h},{x,y:y+h},
    ];
    const bubble=dialogueAdd(s.add.graphics().setDepth(235));
    bubble.fillStyle(0xfffcf1,1);bubble.fillPoints(points,true);
    bubble.lineStyle(5,0x111111,1);bubble.strokePoints(points,true);
    dialogueAdd(s.add.text(x+19,y+9,'Sayaka',{
      fontFamily:BODY,fontSize:'15px',color:'#252227',fontStyle:'700',
    }).setDepth(238));
    const spoken=dialogueAdd(s.add.text(x+19,y+36,opts.advice||'What do you think?',{
      fontFamily:BODY,fontSize:'16px',color:'#111111',
      fontStyle:'600',wordWrap:{width:w-38},
    }).setDepth(238));
    spoken.setLineSpacing?.(1);
    const maxHeight=h-43;
    if(spoken.height>maxHeight)spoken.setScale(maxHeight/spoken.height);
  };
  crewGlow(1055,502,235,adviceUsed?'VIEW ADVICE':
    canAsk?'ASK FOR ADVICE':adviceRemaining+' EVENT COOLDOWN',
    adviceUsed?toggleSayaka:askAdvice,!adviceUsed&&!canAsk);
  crewGlow(1366,502,220,'RACE BRIEFING',toggleSteward);

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
    maskShapes.push(g);if(scopedMasks)scopedMasks.push(g);
    obj.setMask(g.createGeometryMask());
  };
  const frame=framePoints(24,399,730,405,32);
  const fg=add(s.add.graphics().setDepth(219));
  fg.fillStyle(0x030b16,.77);fg.fillPoints(frame,true);
  fg.lineStyle(5,0x35d6ff,1);fg.strokePoints(frame,true);
  meetText(85,409,'YOUR LINEUP',26,'#35d6ff');
  const state=s.registry.get('carStates')||{};
  const player=s.registry.get('playerCharacterId')||'renMizuno';
  let lineupNodes=[],lineupMasks=[],footerNodes=[];
  let popupNodes=[],popupMasks=[],popupVisible=false;
  // Never destroy and reconstruct the entire race room for a single checkbox.
  // In particular, preserve the loaded background and character textures.
  function renderLineup(){
    clearGroup(lineupNodes,lineupMasks);lineupNodes=[];lineupMasks=[];
    scope(lineupNodes,lineupMasks);
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
          try{
            const pieces=s.createCarDisplay(car,carX+105,y+277,200,225,
              getCarPaintColor(state[u.carId]||{}),null,false,state[u.carId]||{});
            for(const piece of pieces){add(piece);if(piece?.setMask)clipPoly(piece,carPanel);}
          }catch(err){
            // A missing/damaged optional car render must not strand a paid
            // crew competition behind an unfinished dark overlay.
            console.warn('[Tokyo SHIFT] Crew lineup car preview skipped:',u.carId,err);
          }
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
      if(!locked)add(s.add.rectangle(x+105,y+163,211,326,0xffffff,0)
        .setInteractive({useHandCursor:true}).setDepth(231)
        .on('pointerdown',()=>openRoster()));
    });
    unscope();
  }
  function canConfirm(){
    const members=selected.filter(Boolean);
    const drives=members.map(id=>normaliseDrive(units.find(u=>u.id===id)?.drivetrain));
    return members.length===3&&new Set(members).size===3&&
      (e.trophyId!=='triDrive'||new Set(drives).size===3);
  }
  function renderFooter(){
    clearGroup(footerNodes);footerNodes=[];scope(footerNodes);
    const footerButton=(x,w,label,onClick,{primary=false,disabled=false}={})=>{
      const hit=rect(x,779,w,49,disabled?0x242a31:
        primary?0x143e38:0x192333,1,
        disabled?0x53616e:primary?0x65e7bf:0x8ba1b5,246);
      if(!disabled)hit.setInteractive({useHandCursor:true}).on('pointerdown',onClick);
      const caption=text(x,779,label,BUTTON_FONT,
        disabled?'#94a2ac':'#ffffff',true,247).setOrigin(.5);
      if(caption.width>w-18)caption.setScale((w-18)/caption.width);
    };
    footerButton(974,205,unpaid?'CANCEL ENTRY':'FORFEIT EVENT',
      ()=>unpaid?(close(),opts.onCancel?.()):opts.onForfeit?.());
    if(!locked)footerButton(1196,205,'CLEAR LINEUP',
      ()=>setLineup([null,null,null]));
    footerButton(1430,229,unpaid?'GO TO GRID // ¥'+fee.toLocaleString('en-US'):'NEXT HEAT',()=>{
      if(!canConfirm())return;
      close();opts.onConfirm?.([...selected]);
    },{primary:true,disabled:!canConfirm()});
    unscope();
  }
  function setLineup(next){
    const unique=[...new Set(next.filter(Boolean))].slice(0,3);
    selected.splice(0,selected.length,...unique);
    while(selected.length<3)selected.push(null);
    renderLineup();renderFooter();
    if(popupVisible)renderRoster();
  }
  function assignDriver(id){
    const order=selected.filter(Boolean);
    const index=order.indexOf(id);
    if(index>=0)order.splice(index,1);
    else if(order.length<3)order.push(id);
    setLineup(order);
  }
  function renderRoster(){
    if(!popupVisible)return;
    clearGroup(popupNodes,popupMasks);popupNodes=[];popupMasks=[];
    scope(popupNodes,popupMasks);
    // Consistent grid: 16px inside the row; 10px between numbered box,
    // portrait and text; 20px before a complete unclipped car preview.
    rect(W/2,H/2,W,H,0x030915,.59,0x030915,249)
      .setInteractive().on('pointerdown',closeRoster);
    rect(1235,411,596,740,0x061421,.985,BLUE,250);
    add(s.add.text(971,60,'SELECT CREW DRIVERS',{
      fontFamily:PIXEL,fontSize:'18px',fontStyle:'normal',color:'#fff4f2',
    }).setDepth(252));
    units.slice(0,7).forEach((u,i)=>{
      const y=110+i*83;
      const assigned=selected.indexOf(u.id);
      const full=selected.filter(Boolean).length>=3;
      const selectedBorder=assigned>=0?RED:BLUE;
      const hit=rect(1235,y+30,558,76,assigned>=0?0x26384d:0x0a1d2e,
        1,selectedBorder,251);
      if(assigned>=0||!full)
        hit.setInteractive({useHandCursor:true}).on('pointerdown',()=>assignDriver(u.id));
      // Only SELECTED number boxes and rows use red. Empty boxes are blue.
      const check=rect(991,y+29,40,40,assigned>=0?0x913347:0x10273a,
        1,selectedBorder,254);
      if(assigned>=0||!full)
        check.setInteractive({useHandCursor:true}).on('pointerdown',()=>assignDriver(u.id));
      if(assigned>=0)add(s.add.text(991,y+27,String(assigned+1),{
        fontFamily:PIXEL,fontSize:'21px',fontStyle:'normal',color:'#ffffff',
      }).setOrigin(.5).setDepth(255));
      const portrait=createCharacterProfile(s,{characterId:u.id,pose:'idle',
        x:1071,y:y+30,frameWidth:70,frameHeight:69,depth:253,
        playerCharacterId:player});
      if(portrait)add(portrait);
      const ink=full&&assigned<0?'#8595a3':'#f4f3f3';
      const who=text(1119,y+1,u.name,18,ink,false,254);
      if(who.width>142)who.setScale(142/who.width);
      const model=text(1119,y+26,cars[u.carId]?.shortName||u.carId,
        15,'#c0dce8',false,254);
      if(model.width>142)model.setScale(142/model.width);
      const spec=text(1119,y+48,normaliseDrive(u.drivetrain)+' · '+
        Math.round(u.powerKW||0)+' kW',14,'#99bfce',false,254);
      if(spec.width>142)spec.setScale(142/spec.width);
      // FULL, shadow-free previews: the shared car renderer has a mixed
      // bottom-right/reference anchor, and its old hard clip cut off bonnets
      // and rooflines. Fit a slightly smaller sprite inside the row instead.
      // Only remove returned index 2 (the ground-shadow ellipse); never
      // change the global car renderer used by actual races and the garage.
      const car=cars[u.carId];
      if(car&&typeof s.createCarDisplay==='function'){
        try{
          const parts=s.createCarDisplay(car,1414,y+30,145,253,
            getCarPaintColor(state[u.carId]||{}),null,false,state[u.carId]||{});
          parts.forEach((part,index)=>{
            if(index===2){part?.destroy?.();return;}
            if(part)add(part); // No viewport mask: show the COMPLETE car.
          });
        }catch(err){
          console.warn('[Tokyo SHIFT] Crew roster car preview skipped:',u.carId,err);
        }
      }
    });
    btn(1420,734,182,44,'CLOSE',closeRoster,false,false,260);
    unscope();
  }
  function openRoster(){
    if(locked||popupVisible)return;
    popupVisible=true;renderRoster();
  }
  function closeRoster(){
    if(!popupVisible)return;
    popupVisible=false;clearGroup(popupNodes,popupMasks);
    popupNodes=[];popupMasks=[];
  }
  renderLineup();renderFooter();
  if(Number.isInteger(opts.popupSlot))openRoster();
}
