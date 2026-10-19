// R602 — Open Circuit briefing visual refinement and shared pro advice cooldown.
// Deliberately reuses the Pro Crew registration-room art and screen vocabulary.
// Only active Open Circuit individual driver duels enter this room.
import { cars } from '../data/cars.js?v=20261011-r479';
import { getBaseCarId } from '../data/carOwnership.js?v=20261011-r479';
import { characters, getCharacterVisualAsset, getCharacterAssetUrl } from '../data/characters.js?v=20261017-r578';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261017-r578';
import { getVehiclePerformance } from '../vehicles/VehiclePerformance.js?v=20261011-r479';
import { getCarMagazineMeta } from '../data/carMagazine.js?v=20261011-r479';
import { normaliseStage3Calibration, getStage3CalibrationEligibility,
  getStage3CalibrationOption } from '../data/stage3Calibration.js?v=20261004-r330';
import { driverAdviceStatus, driverBriefingEligibility, driverOpponentAdvice,
  toggleBriefingNos, isOpenDriverBriefing, BRIEFING_POWER_PARTS,
  removeDriverPowerPart, restoreDriverPowerParts,
  getProDriverHelmetIndex } from '../data/proDriverBriefing.js?v=20261019-r602';
import { preloadCarAppearanceAssets, preloadCarWheel,
  ensureDerivedModularCarTextures, getCarPaintColor } from '../vehicles/CarAppearance.js?v=20261014-stock';

const W=1560,H=840;
const PIXEL='"Silkscreen", monospace', BODY='"Rajdhani", sans-serif', DISPLAY='"Exo 2", sans-serif';
const CYAN=0x35d6ff, RED=0xec526a;
const room=s=>String(s.worldPhase||'night').toLowerCase()==='day'?'day':'night';
const keyFor=phase=>'proDriverRegoWide'+(phase==='day'?'Day':'Night');
const modelFor=id=>cars[id]||cars[getBaseCarId(id)]||null;
const cash=n=>'¥'+Number(n||0).toLocaleString('en-US');
const fit=(node,max)=>{if(node?.width>max)node.setScale(max/node.width);return node;};
const drive=raw=>({FR:'RWD',FF:'FWD',FOUR_WHEEL_DRIVE:'AWD'}[String(raw||'').toUpperCase()]||String(raw||'—').toUpperCase());

function loadAssets(s,state){
  let queued=0;
  const phase=room(s),bg=keyFor(phase);
  if(!s.textures.exists(bg)){
    s.load.image(bg,'assets/CentralTokyo/dragcomplex/regoroom_'+phase+'.png?v=20261019-r599');
    queued++;
  }
  for(const [key,path] of [
    ['proDriverHiroshi','assets/Characters/Central/hiroshi_sato_normal.png'],
    ['proDriverSayaka','assets/Characters/Main/race_sayaka_fujieda_idle.png'],
    ['proDriverDaichi','assets/Characters/Main/pro_daichi_sakamoto.png'],
  ]) if(!s.textures.exists(key)){
    s.load.image(key,getCharacterAssetUrl(path));queued++;
  }
  const playerId=s.registry.get('playerCharacterId')||'renMizuno';
  const playerAsset=getCharacterVisualAsset(playerId,'idle');
  if(playerAsset?.key&&playerAsset.path&&!s.textures.exists(playerAsset.key)){
    s.load.image(playerAsset.key,getCharacterAssetUrl(playerAsset.path));queued++;
  }
  const round=state.rounds[state.roundIndex];
  const named=characters[round.characterId];
  const mainRival=Boolean(round.mainRivalTier||named?.mainRival);
  const helmetIndex=getProDriverHelmetIndex(state,round);
  if(!mainRival){
    const helmetKey='proDriverHelmet'+helmetIndex;
    if(!s.textures.exists(helmetKey)){
      s.load.image(helmetKey,'assets/Characters/Central/driver_0'+helmetIndex+'.png?v=20261019-r601');
      queued++;
    }
  }
  const rival=getCharacterVisualAsset(round.characterId,'idle',{
    playerCharacterId:s.registry.get('playerCharacterId')||'renMizuno',rivalContext:true,
  });
  if(rival?.key&&rival.path&&!s.textures.exists(rival.key)){
    s.load.image(rival.key,getCharacterAssetUrl(rival.path));queued++;
  }
  const ids=[state.playerCarId,round.carId].filter(id=>modelFor(id));
  const unique=Object.fromEntries(ids.map(id=>[getBaseCarId(id),modelFor(id)]));
  queued+=preloadCarAppearanceAssets(s,unique,'20261019-r598');
  const carStates=s.registry.get('carStates')||{};
  for(const id of ids)queued+=preloadCarWheel(s,modelFor(id),
    id===state.playerCarId?carStates[id]||{}:round.opponentBuildState||{});
  return queued;
}

export function showProDriverBriefing(s,options={}){
  const state=s.registry.get('competitionState');
  if(!isOpenDriverBriefing(state))return false;
  if(s._proDriverBriefLoading)return true;
  const pending=options._loaded?0:loadAssets(s,state);
  if(pending){
    s._proOverlayClose?.();
    s._proDriverBriefLoading=true;
    const screen=s.add.rectangle(W/2,H/2,W,H,0x07111d,.99).setDepth(200).setInteractive();
    const label=s.add.text(W/2,H/2,'PREPARING DRIVER BRIEFING',{
      fontFamily:PIXEL,fontSize:'18px',color:'#ffffff',
    }).setOrigin(.5).setDepth(201);
    let finished=false;
    const cleanup=()=>{if(finished)return;finished=true;s._proDriverBriefLoading=false;
      screen.destroy();label.destroy();s.events.off('shutdown',shutdown);s.load.off('complete',done);};
    const shutdown=()=>cleanup();
    const done=()=>{
      cleanup();
      if(!s.sys?.isActive?.())return;
      const saved=s.registry.get('competitionState');
      if(!isOpenDriverBriefing(saved))return;
      const round=saved.rounds[saved.roundIndex];
      ensureDerivedModularCarTextures(s,Object.fromEntries(
        [saved.playerCarId,round.carId].filter(id=>modelFor(id))
          .map(id=>[getBaseCarId(id),modelFor(id)])));
      showProDriverBriefing(s,{...options,_loaded:true});
    };
    s.events.once('shutdown',shutdown);
    s.load.once('complete',done);
    s.load.start();
    return true;
  }
  draw(s,state,options);
  return true;
}

function draw(s,state,options){
  s._proOverlayClose?.();
  const nodes=[];
  let popup=[];
  let dialogueNodes=[];
  let activeDialogue=null;
  const add=o=>{nodes.push(o);return o;};
  let closed=false;
  const close=()=>{if(closed)return;closed=true;
    s.events.off('shutdown',close);
    dismiss();
    clearDialogue();
    nodes.forEach(o=>{try{s.tweens?.killTweensOf?.(o);o?.destroy?.();}catch(_){}});
    if(s._proOverlayClose===close)s._proOverlayClose=null;
  };
  s._proOverlayClose=close;s.events.once('shutdown',close);
  const text=(x,y,value,size=16,color='#f5f7fa',pixel=false,depth=230)=>{
    const t=add(s.add.text(x,y,String(value),{
      fontFamily:pixel?PIXEL:BODY,fontSize:size+'px',fontStyle:pixel?'normal':'600',
      color,wordWrap:{width:780},
    }).setFontSize(size).setDepth(depth));
    return t;
  };
  const rect=(x,y,w,h,fill=0x071827,line=CYAN,alpha=.92,depth=215)=>{
    return add(s.add.rectangle(x,y,w,h,fill,alpha).setStrokeStyle(2,line).setDepth(depth));
  };
  const poly=(x,y,w,h,fill=0x061321,line=CYAN,depth=216)=>{
    const points=[{x:x+25,y},{x:x+w+25,y},{x:x+w-25,y:y+h},{x:x-25,y:y+h}];
    const g=add(s.add.graphics().setDepth(depth));
    g.fillStyle(fill,.84);g.fillPoints(points,true);
    g.lineStyle(3,line,1);g.strokePoints(points,true);return g;
  };
  const btn=(x,y,w,h,label,action,{red=false,disabled=false,depth=246}={})=>{
    const hit=rect(x,y,w,h,disabled?0x192631:red?0x662032:0x0e2839,
      disabled?0x5c6b79:red?RED:CYAN,1,depth);
    if(!disabled)hit.setInteractive({useHandCursor:true}).on('pointerdown',action);
    const caption=text(x,y,label,13,disabled?'#8898a8':'#ffffff',true,depth+1).setOrigin(.5);
    fit(caption,w-18);return hit;
  };
  const display=(x,y,value,size,color='#fff')=>{
    const t=add(s.add.text(x,y,String(value),{fontFamily:DISPLAY,
      fontSize:size+'px',fontStyle:'italic 900',color,stroke:'#081321',strokeThickness:2,
    }).setDepth(230));t.setFontSize(size);return t;
  };
  rect(W/2,H/2,W,H,0x030914,0x030914,1,200).setInteractive();
  const bg=keyFor(room(s));
  if(s.textures.exists(bg)){
    const src=s.textures.get(bg).getSourceImage();
    add(s.add.image(W/2,H/2,bg).setDepth(201).setScale(
      Math.max(W/Math.max(1,src.width),H/Math.max(1,src.height))));
    s.textures.get(bg).setFilter?.(Phaser.Textures.FilterMode.NEAREST);
  }
  rect(W/2,H/2,W,H,0x020714,0x020714,.10,202);

  const round=state.rounds[state.roundIndex],rival=characters[round.characterId]||{};
  const playerCar=modelFor(state.playerCarId)||{},oppCar=modelFor(round.carId)||{};
  const carStates=s.registry.get('carStates')||{};
  const carState=carStates[state.playerCarId]||{};
  const fallback=options.event||{};
  let performance=null,oppPerformance=null;
  try{performance=getVehiclePerformance(getBaseCarId(state.playerCarId),carState);}
  catch(err){console.warn('[Tokyo SHIFT] Driver briefing performance unavailable',err);}
  try{oppPerformance=getVehiclePerformance(getBaseCarId(round.carId),round.opponentBuildState||{});}
  catch(err){console.warn('[Tokyo SHIFT] Driver opponent performance unavailable',err);}
  const playerPower=Number(performance?.car?.powerKW||playerCar.powerKW||0);
  const opponentPower=Number(oppPerformance?.car?.powerKW||oppCar.powerKW||0);
  const opponentTorque=Number(oppPerformance?.car?.torqueNm||oppCar.torqueNm||0);
  const eligibility=driverBriefingEligibility(state,carState,playerPower,
    s.registry.get('ownedCarIds')||[],fallback);
  const circuit=s.registry.get('proCircuit')||{};
  const advice=driverAdviceStatus(circuit,state);
  const stageNo=state.roundIndex+1,stageTotal=state.rounds.length;
  const playerId=s.registry.get('playerCharacterId')||'renMizuno';

  // The player's actual tuned/painted car is part of the paddock environment
  // (NOT another boxed menu card). It sits behind the full-body characters.
  const safeCarPreview=(id,x,y,w,depth,previewState={},keepShadow=false)=>{
    const car=modelFor(id);
    if(!car||typeof s.createCarDisplay!=='function')return;
    try{
      const parts=s.createCarDisplay(car,x,y,w,depth,getCarPaintColor(previewState),
        null,false,previewState);
      parts.forEach((part,i)=>{
        if(i===2&&!keepShadow){part?.destroy?.();return;}
        if(part)add(part);
      });
    }catch(err){console.warn('[Tokyo SHIFT] Briefing car display skipped',id,err);}
  };
  // R602: increase the R601 owned-car presentation a further 20%, shift
  // modestly up/right, preserve its exact paint, wheel and saved tuning state.
  safeCarPreview(state.playerCarId,631,510,744,207,carState,true);

  // Character order: DAICHI > OWNED CAR > PLAYER > SAYAKA > HIROSHI.
  // Both outer staff sprites are flipped as requested, while the protagonist
  // uses whichever authentic selectable character was saved in this profile.
  const playerAsset=getCharacterVisualAsset(playerId,'idle');
  const characterPlaces=[
    {key:'proDriverDaichi',x:193,feet:727,height:560,maxWidth:280,flip:true,onTap:null},
    {key:playerAsset?.key,x:888,feet:691,height:519,maxWidth:256,flip:false,onTap:null},
    {key:'proDriverSayaka',x:1110,feet:763,height:527,maxWidth:276,flip:false,onTap:null},
    {key:'proDriverHiroshi',x:1402,feet:724,height:522,maxWidth:270,flip:true,onTap:null},
  ];
  for(const p of characterPlaces){
    if(!p.key||!s.textures.exists(p.key))continue;
    const source=s.textures.get(p.key).getSourceImage();
    const scale=Math.min(p.height/Math.max(1,source.height),
      p.maxWidth/Math.max(1,source.width));
    s.textures.get(p.key).setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    add(s.add.ellipse(p.x,p.feet-6,p.maxWidth*.84,22,0,.27).setDepth(209));
    const sprite=add(s.add.image(p.x,p.feet,p.key).setOrigin(.5,1)
      .setScale(scale).setFlipX(Boolean(p.flip)).setDepth(214));
    // The workshop-style glowing buttons own all staff interactions.
  }

  // Same Open Circuit heading as R599. Hiroshi now owns all race rule details.
  poly(40,34,268,42,0x03070c,0x03070c,218);
  display(63,43,'OPEN CIRCUIT',21,'#ff8197');
  const title=String(state.briefingLabel||fallback.label||'DRIVER SERIES').toUpperCase();
  fit(display(55,83,title,41),790);

  // Compact opponent panel. The nested portrait parallelogram uses the
  // identical slope as the outer card and a dark, professional black outline.
  poly(52,643,654,164,0x071728,CYAN,219);
  display(89,652,'NEXT OPPONENT '+stageNo+'/'+stageTotal,24,'#35d6ff');
  const frameX=74,frameY=694,frameW=129,frameH=106,skew=16;
  const framePoints=[
    {x:frameX+skew,y:frameY},{x:frameX+frameW+skew,y:frameY},
    {x:frameX+frameW-skew,y:frameY+frameH},
    {x:frameX-skew,y:frameY+frameH},
  ];
  const border=add(s.add.graphics().setDepth(220));
  border.fillStyle(0x165578,.87);border.fillPoints(framePoints,true);
  border.lineStyle(4,0x050a10,1);border.strokePoints(framePoints,true);
  // Both generic and named rival artwork are cropped by the SAME frame.
  // Enlarging their upper body keeps the helmet, face and chest prominent.
  const clipPortrait=image=>{
    const shape=s.make.graphics({add:false});
    shape.fillStyle(0xffffff,1);shape.fillPoints(framePoints,true);
    image.setMask(shape.createGeometryMask());
    add({destroy:()=>shape.destroy()});
  };
  const px=frameX+frameW/2,py=frameY+frameH/2;
  const isMainRival=Boolean(round.mainRivalTier||rival.mainRival);
  const helmetKey='proDriverHelmet'+getProDriverHelmetIndex(state,round);
  if(!isMainRival&&s.textures.exists(helmetKey)){
    const source=s.textures.get(helmetKey).getSourceImage();
    const scale=Math.max(frameW*1.6/Math.max(1,source.width),
      frameH*2.2/Math.max(1,source.height));
    s.textures.get(helmetKey).setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    const profile=add(s.add.image(px,frameY-13,helmetKey)
      .setOrigin(.5,0).setScale(scale).setDepth(225));
    clipPortrait(profile);
  }else{
    const portrait=createCharacterProfile(s,{
      characterId:round.characterId,pose:'idle',x:px,y:py-6,
      frameWidth:frameW*1.55,frameHeight:frameH*1.5,
      side:'center',depth:225,mask:false,
      playerCharacterId:playerId,rivalContext:true,
    });
    if(portrait?.image){add(portrait);clipPortrait(portrait.image);}
    else text(px,py,'PRO DRIVER',11,'#b8d7e7',true,226).setOrigin(.5);
  }
  const roster=Object.values(circuit.drivers||{}).find(d=>d.characterId===round.characterId);
  const rivalName=String(round.opponentName||rival.name||roster?.name||
    round.characterId||'PRO DRIVER').toUpperCase();
  // The driver name aligns with the portrait's TOP horizontal, not its centre.
  fit(text(231,693,rivalName,18,'#ffffff'),239);
  fit(text(231,717,String(oppCar.name||round.carId).toUpperCase(),14,'#7fe0f1'),247);
  text(231,742,'POWER',10,'#b1cddb',true);
  text(326,739,Math.round(opponentPower)+' KW',15);
  text(231,762,'TORQUE',10,'#b1cddb',true);
  text(326,759,Math.round(opponentTorque)+' NM',15);
  text(231,784,'DRIVE',10,'#b1cddb',true);
  text(326,780,drive(getCarMagazineMeta(getBaseCarId(round.carId))?.drivetrain||
    oppCar.drivetrain),15);
  // Approximately a third of a preview car-length left and slightly higher.
  safeCarPreview(round.carId,545,722,211,225,round.opponentBuildState||{});

  // Translucent breathing hotspots: identical alpha/timing language to
  // Warehouse HQ's Office / Crew / Dyno hotspots, not filled menu buttons.
  const workshopHotspot=(x,y,w,h,label,action,{disabled=false}={})=>{
    const glow=add(s.add.rectangle(x,y,w,h,0x4ee8ff,.022)
      .setStrokeStyle(2,disabled?0x617b86:0x69ecff,.72).setDepth(246));
    const pad=add(s.add.rectangle(x,y,w-10,h-8,0x06141d,.66).setDepth(247));
    const caption=add(s.add.text(x,y,label,{
      fontFamily:PIXEL,fontSize:'11px',
      color:disabled?'#8eacb8':'#c9f8ff',align:'center',
    }).setOrigin(.5).setDepth(248));
    fit(caption,w-20);
    if(disabled){glow.setAlpha(.37);pad.setAlpha(.42);caption.setAlpha(.58);}
    else{
      glow.setInteractive({useHandCursor:true}).on('pointerdown',action);
      const timing={duration:1300,yoyo:true,repeat:-1,ease:'Sine.easeInOut'};
      const pulse=s.tweens.add({targets:glow,alpha:{from:.07,to:1},...timing});
      const padPulse=s.tweens.add({targets:pad,alpha:{from:.14,to:.72},...timing});
      s.tweens.add({targets:caption,alpha:{from:.46,to:.96},...timing});
      glow.on('pointerover',()=>{
        pulse.pause();padPulse.pause();
        glow.setAlpha(1).setFillStyle(0x4ee8ff,.08)
          .setStrokeStyle(3,0x9af6ff,.98);
        pad.setAlpha(.82);caption.setAlpha(1).setColor('#ffffff');
      });
      glow.on('pointerout',()=>{
        glow.setFillStyle(0x4ee8ff,.022).setStrokeStyle(2,0x69ecff,.72);
        caption.setColor('#c9f8ff');pulse.resume();padPulse.resume();
      });
    }
    return glow;
  };
  // Daichi LEFT, Sayaka RIGHT-CENTRE, Hiroshi RIGHT.
  workshopHotspot(190,611,229,44,'DAICHI // TUNE',()=>openTune());
  const adviceLabel=advice.usedThisEvent&&state.briefingAdviceText?'VIEW ADVICE':
    advice.available?'ASK FOR ADVICE':'ADVICE ON COOLDOWN';
  workshopHotspot(1111,637,225,44,adviceLabel,()=>handleSayaka(),{
    disabled:!advice.available&&!state.briefingAdviceText,
  });
  workshopHotspot(1390,616,220,44,'RACE BRIEFING',()=>toggleDialogue('hiroshi'));
  if(advice.remaining&&!state.briefingAdviceUsed)
    fit(text(993,671,'SAYAKA: '+advice.remaining+' EVENT COOLDOWN',10,
      '#c8d8e6',true),245);

  // Action row has two equal-sized controls, no Back: the competition is
  // already paid and the player may only continue or confirm a forfeit.
  btn(1070,779,246,54,'FORFEIT EVENT',()=>openForfeit(),{red:true});
  btn(1368,779,246,54,'PROCEED TO GRID  >>',()=>{
    if(!eligibility.eligible)return;
    close();options.onRace?.();
  },{disabled:!eligibility.eligible});

  // These bubbles are ephemeral, mutually exclusive, and NEVER persisted as
  // open state. Existing professional advice stays saved and can be viewed
  // again without spending an additional consultation.
  const dialogueAdd=o=>{dialogueNodes.push(o);return o;};
  function clearDialogue(){
    for(const node of dialogueNodes){try{node.destroy?.();}catch(_){}}
    dialogueNodes=[];activeDialogue=null;
  }
  function bubbleText(x,y,value,size=16,color='#f6fbff',pixel=false){
    const node=dialogueAdd(s.add.text(x,y,String(value),{
      fontFamily:pixel?PIXEL:BODY,fontSize:size+'px',
      fontStyle:pixel?'normal':'600',color,wordWrap:{width:600},
    }).setDepth(238));
    return node;
  }
  function toggleDialogue(which){
    if(activeDialogue===which){clearDialogue();return;}
    clearDialogue();activeDialogue=which;
    if(which==='hiroshi'){
      // Top-right official steward briefing: a small equilateral triangle
      // projects from the BOTTOM edge directly above Hiroshi's head.
      const x=850,y=24,w=674,h=222,edge=x+w,baseCenter=1402;
      const side=36,half=side/2,triangleHeight=Math.sqrt(3)*side/2;
      const pts=[
        {x,y},{x:edge,y},{x:edge,y:y+h},
        {x:baseCenter+half,y:y+h},
        {x:baseCenter,y:y+h+triangleHeight},
        {x:baseCenter-half,y:y+h},
        {x,y:y+h},
      ];
      const panel=dialogueAdd(s.add.graphics().setDepth(235));
      panel.fillStyle(0x081a2b,.97);panel.fillPoints(pts,true);
      panel.lineStyle(3,CYAN,1);panel.strokePoints(pts,true);
      bubbleText(x+22,y+11,'HIROSHI // RACE BRIEFING',15,'#53ddff',true);
      dialogueAdd(s.add.rectangle(x+w/2,y+43,w-42,1,0x3c7e98,.75).setDepth(237));
      const details=[
        ['EVENT',title],['ROUND',stageNo+' / '+stageTotal],
        ['RACE','1/4 MI // STANDING START'],
        ['PRIZE',cash(state.prizeCash)],['ENTRY PAID',cash(state.entryFee)],
        ['POWER RULE',eligibility.rules.maxPowerKW==null?'OPEN':
          eligibility.rules.maxPowerKW+' KW MAX'],
        ['NOS RULE',eligibility.rules.noNos?'PROHIBITED':'ALLOWED'],
        ['STATUS',eligibility.eligible?'ELIGIBLE':eligibility.problems.join(' / ')],
      ];
      details.forEach(([label,value],i)=>{
        const ty=y+52+i*20;
        bubbleText(x+24,ty,label,10,'#a5d4e6',true);
        const v=bubbleText(x+215,ty-2,value,14,
          i===7?(eligibility.eligible?'#81efc4':'#ffb6ba'):'#f0f7fd');
        fit(v,w-240);
      });
      // Closing is intentionally ONLY via the glowing Hiroshi hotspot.
    }else if(which==='sayaka'&&state.briefingAdviceText){
      // Lower than the player's face; the small equilateral speech point
      // sits in the UPPER half of the right edge and aims toward Sayaka.
      const x=558,y=330,w=470,h=146,edge=x+w;
      const triangleBase=36,half=triangleBase/2,tipX=edge+Math.sqrt(3)*triangleBase/2;
      const mid=y+41;
      const pts=[{x,y},{x:edge,y},{x:edge,y:mid-half},
        {x:tipX,y:mid},{x:edge,y:mid+half},
        {x:edge,y:y+h},{x,y:y+h}];
      const bubble=dialogueAdd(s.add.graphics().setDepth(235));
      bubble.fillStyle(0xfffcf1,1);bubble.fillPoints(pts,true);
      bubble.lineStyle(5,0x111111,1);bubble.strokePoints(pts,true);
      bubbleText(x+18,y+11,'Sayaka',16,'#252227').setFontStyle('700');
      const spoken=bubbleText(x+18,y+38,state.briefingAdviceText,
        16,'#111111').setWordWrapWidth(w-37);
      spoken.setLineSpacing(1);
      if(spoken.height>h-49)spoken.setScale((h-49)/spoken.height);
      // Closing is intentionally ONLY via the glowing Sayaka hotspot.
    }
  }
  function handleSayaka(){
    if(state.briefingAdviceText){toggleDialogue('sayaka');return;}
    if(!advice.available)return;
    clearDialogue();openAdvice();
  }
  if(options.initialDialogue==='sayaka'&&state.briefingAdviceText)
    toggleDialogue('sayaka');

  // All modal elements share the owning room's lifecycle. Closing the scene
  // also closes the modal, preventing invisible hit zones after a race.
  const popupAdd=o=>{popup.push(o);return o;};
  function dismiss(){
    popup.forEach(o=>{try{o?.destroy?.();}catch(_){}});
    popup=[];
  }
  function modal(title,description=''){
    dismiss();
    popupAdd(s.add.rectangle(W/2,H/2,W,H,0x020611,.80).setDepth(269).setInteractive());
    popupAdd(s.add.rectangle(W/2,H/2,870,475,0x0b1b2c,.99)
      .setStrokeStyle(3,CYAN).setDepth(270));
    popupAdd(s.add.text(398,227,title,{fontFamily:PIXEL,fontSize:'16px',color:'#ffffff'})
      .setFontSize(16).setDepth(274));
    if(description)popupAdd(s.add.text(398,271,description,{
      fontFamily:BODY,fontSize:'19px',color:'#e1edf7',wordWrap:{width:765},
    }).setFontSize(19).setDepth(274));
  }
  function modalBtn(x,y,w,label,action,red=false){
    const hit=popupAdd(s.add.rectangle(x,y,w,51,red?0x672336:0x142b3e)
      .setStrokeStyle(2,red?RED:CYAN).setDepth(275));
    hit.setInteractive({useHandCursor:true}).on('pointerdown',action);
    const copy=popupAdd(s.add.text(x,y,label,{fontFamily:PIXEL,
      fontSize:'13px',color:'#ffffff'}).setFontSize(13).setOrigin(.5).setDepth(276));
    fit(copy,w-14);
  }
  function openForfeit(){
    modal('FORFEIT DRIVER EVENT?',
      'Withdraw from this paid driver series? The entry fee is not refunded, remaining rounds are lost, and your event is recorded as a forfeit. Daichi will restore stored upgrades.');
    modalBtn(590,581,290,'CONTINUE EVENT',dismiss);
    modalBtn(979,581,290,'CONFIRM FORFEIT',()=>{
      dismiss();close();options.onForfeit?.();
    },true);
  }
  function openAdvice(){
    if(!driverAdviceStatus(s.registry.get('proCircuit')||{},
      s.registry.get('competitionState')||{}).available)return;
    modal('ASK SAYAKA FOR ADVICE?',
      'One tactical briefing per event. After this, finish this event and two more professional events before asking again.');
    modalBtn(581,581,255,'MAYBE LATER',dismiss);
    modalBtn(981,581,255,'ASK SAYAKA',()=>{
      dismiss();close();
      options.onAdvice?.(driverOpponentAdvice(oppCar,rival,playerCar));
    },true);
  }
  function openPowerParts(){
    const stored=carState.proBriefingPowerStash||{};
    modal('DAICHI // REMOVE PARTS',
      'Temporarily remove fitted power upgrades for the event limit. All removed parts are stored and restored after the series.');
    BRIEFING_POWER_PARTS.forEach((part,i)=>{
      const group=part.group==='tuning'?(carState.tuning||carState.engineTuning||{}):
        carState.exhaustNosTuning||{};
      const level=Math.max(0,Math.round(Number(group[part.id]||0)));
      const stashed=Object.hasOwn(stored[part.group]||{},part.id);
      const x=i<4?578:986,y=332+(i%4)*52;
      const hit=popupAdd(s.add.rectangle(x,y,366,43,
        level?0x153449:0x122233,.96)
        .setStrokeStyle(2,level?CYAN:0x667788).setDepth(275));
      const caption=popupAdd(s.add.text(x,y,
        part.label+' // '+(level?'LEVEL '+level+'  REMOVE':stashed?'STORED':'STOCK'),
        {fontFamily:PIXEL,fontSize:'11px',color:level?'#ffffff':'#aab9c8'})
        .setFontSize(11).setOrigin(.5).setDepth(276));
      fit(caption,349);
      if(level)hit.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
        const next=removeDriverPowerPart(carState,part.id);
        dismiss();close();options.onCarState?.(next);
      });
    });
    modalBtn(574,585,276,'RETURN TO ECU',openTune);
    modalBtn(987,585,276,'RESTORE ALL PARTS',()=>{
      const next=restoreDriverPowerParts(carState);
      dismiss();close();options.onCarState?.(next);
    });
  }
  function openTune(){
    const installed=getStage3CalibrationEligibility(carState);
    // The Drag Complex includes a full Level 3 calibration facility for
    // professional drivers, free of any Warehouse Dyno facility upgrade.
    // Each adjustment still needs the actual matching Level 3 car part,
    // because the shared race physics enforces that mechanical prerequisite.
    const level3=Boolean(options.proAccess);
    const values=normaliseStage3Calibration(carState);
    const canTune=level3&&Object.values(installed).some(Boolean);
    const stash=Boolean(carState.proBriefingNosStash);
    const hasNos=stash||Boolean(carState.nosInstalled)||
      Number(carState.exhaustNosTuning?.nosKit||0)>0;
    modal('DAICHI // RACE SETUP',
      canTune?'Level 3 calibration uses your installed parts and real race physics.':
        'Pro Drag Complex dyno access is complimentary. Each calibration requires its matching Level 3 car part.');
    const entries=[
      {key:'ecuBias',title:'ECU CURVE',allow:installed.ecuBias},
      {key:'boostBias',title:'BOOST CURVE',allow:installed.boostBias},
      {key:'gearBias',title:'GEAR SPREAD',allow:installed.gearBias},
    ];
    const tuneNodes=[];
    function tuneRows(){
      tuneNodes.forEach(o=>{try{o.destroy();}catch(_){}});
      tuneNodes.length=0;
      entries.forEach((entry,i)=>{
        const y=352+i*58,enabled=level3&&entry.allow;
        const option=getStage3CalibrationOption(entry.key,values[entry.key]);
        const node=s.add.text(405,y,entry.title,{fontFamily:PIXEL,fontSize:'12px',
          color:enabled?'#ebf7fa':'#8697aa'}).setFontSize(12).setDepth(278);
        popupAdd(node);tuneNodes.push(node);
        const val=s.add.text(735,y,enabled?option.label:'LOCKED',{
          fontFamily:BODY,fontSize:'20px',color:enabled?'#ffffff':'#8697aa',
        }).setFontSize(20).setOrigin(.5,0).setDepth(278);
        popupAdd(val);tuneNodes.push(val);
        for(const [dx,delta,sign] of [[-1,-1,'<'],[1,1,'>']]){
          const hit=s.add.rectangle(873+dx*45,y+12,39,34,0x14344b)
            .setStrokeStyle(1,CYAN).setDepth(278);
          popupAdd(hit);tuneNodes.push(hit);
          const label=s.add.text(873+dx*45,y+12,sign,{
            fontFamily:PIXEL,fontSize:'12px',color:'#ffffff',
          }).setFontSize(12).setOrigin(.5).setDepth(279);
          popupAdd(label);tuneNodes.push(label);
          if(enabled)hit.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
            values[entry.key]=Math.max(-2,Math.min(2,values[entry.key]+delta));
            tuneRows();
          });
        }
      });
    }
    tuneRows();
    modalBtn(492,588,174,stash?'RESTORE NOS':'REMOVE NOS',()=>{
      if(!hasNos)return;
      const next=toggleBriefingNos(carState);
      dismiss();close();options.onCarState?.(next);
    });
    modalBtn(693,588,183,'POWER PARTS',()=>openPowerParts());
    modalBtn(887,588,174,'CANCEL',dismiss);
    modalBtn(1093,588,190,'SAVE ECU SETUP',()=>{
      const next={...carState,stage3Calibration:canTune?{
        ecuBias:installed.ecuBias?values.ecuBias:0,
        boostBias:installed.boostBias?values.boostBias:0,
        gearBias:installed.gearBias?values.gearBias:0,
      }:normaliseStage3Calibration(carState)};
      if(canTune&&carState.dyno)next.dyno={...carState.dyno,officialReading:null};
      dismiss();close();options.onCarState?.(next);
    },true);
  }
}
