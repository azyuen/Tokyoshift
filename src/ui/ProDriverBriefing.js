// R606 — Daichi car setup now shares the Warehouse Stage III Dyno calibration UI.
// Deliberately reuses the Pro Crew registration-room art and screen vocabulary.
// Only active Open Circuit individual driver duels enter this room.
import { cars } from '../data/cars.js?v=20261011-r479';
import { getBaseCarId } from '../data/carOwnership.js?v=20261011-r479';
import { characters, getCharacterVisualAsset, getCharacterAssetUrl } from '../data/characters.js?v=20261017-r578';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261017-r578';
import { getVehiclePerformance } from '../vehicles/VehiclePerformance.js?v=20261011-r479';
import { getCarMagazineMeta } from '../data/carMagazine.js?v=20261011-r479';
import { STAGE3_CALIBRATION_OPTIONS, normaliseStage3Calibration, getStage3CalibrationEligibility,
  getStage3CalibrationOption } from '../data/stage3Calibration.js?v=20261004-r330';
import { addProGlowingHotspot, renderStewardBriefing, showCompactProForfeit, showProSayakaAdviceConfirm } from './ProBriefingChrome.js?v=20261019-r606';
import { driverAdviceStatus, driverBriefingEligibility, driverOpponentAdvice,
  toggleBriefingNos, isOpenDriverBriefing, BRIEFING_POWER_PARTS,
  removeDriverPowerPart, removeDriverPowerParts, restoreDriverPowerParts,
  getProDriverHelmetIndex } from '../data/proDriverBriefing.js?v=20261019-r606';
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
    ['tuningPartEcuL3','assets/Tuning/Parts/ecu_l3.png'],
    ['tuningPartTurboL3','assets/Tuning/Parts/turbo_l3.png'],
    ['tuningPartGearboxL3','assets/Tuning/Parts/gearbox_l3.png'],
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
  const state=options.state||s.registry.get('competitionState');
  if(!isOpenDriverBriefing(state))return false;
  if(s._proDriverBriefLoading)return true;
  const pending=options._loaded?0:loadAssets(s,state);
  if(pending){
    s._proOverlayClose?.();
    s._proDriverBriefLoading=true;
    const screen=s.add.rectangle(W/2,H/2,W,H,0x07111d,.99).setDepth(200).setInteractive();
    const label=s.add.text(W/2,H/2,'PREPARING RACE BRIEFING',{
      fontFamily:PIXEL,fontSize:'18px',color:'#ffffff',
    }).setOrigin(.5).setDepth(201);
    let finished=false;
    const cleanup=()=>{if(finished)return;finished=true;s._proDriverBriefLoading=false;
      screen.destroy();label.destroy();s.events.off('shutdown',shutdown);s.load.off('complete',done);};
    const shutdown=()=>cleanup();
    const done=()=>{
      cleanup();
      if(!s.sys?.isActive?.())return;
      const saved=options.state||s.registry.get('competitionState');
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
    s._proForfeitClose?.();
    s._proSayakaClose?.();
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
  const btn=(x,y,w,h,label,action,{red=false,grey=false,disabled=false,depth=246}={})=>{
    const hit=rect(x,y,w,h,disabled?0x192631:grey?0x30353d:red?0x662032:0x0e2839,
      disabled?0x5c6b79:grey?0x8a939d:red?RED:CYAN,1,depth);
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
  const carState=options.preparedCarState||carStates[state.playerCarId]||{};
  const unpaid=Boolean(state.briefingEntryPending);
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
  const circuit=options.previewCircuit||s.registry.get('proCircuit')||{};
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
        if(i===2&&keepShadow)part?.setAlpha?.(.16);
        if(part)add(part);
      });
    }catch(err){console.warn('[Tokyo SHIFT] Briefing car display skipped',id,err);}
  };
  // R602: increase the R601 owned-car presentation a further 20%, shift
  // modestly up/right, preserve its exact paint, wheel and saved tuning state.
  safeCarPreview(state.playerCarId,726,474,744,207,carState,true);

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
    add(s.add.ellipse(p.x,p.feet-(p.key==='proDriverSayaka'?16:6),p.maxWidth*.84,22,0,.27).setDepth(209));
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
  const frameX=74,frameY=683,frameW=129,frameH=106,skew=16;
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
    const profile=add(s.add.image(px,frameY+18,helmetKey)
      .setOrigin(.5,0).setScale(scale).setDepth(225));
    clipPortrait(profile);
  }else{
    const portrait=createCharacterProfile(s,{
      characterId:round.characterId,pose:'idle',x:px,y:py+10,
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
  fit(text(231,684,rivalName,18,'#ffffff'),239);
  fit(text(231,708,String(oppCar.name||round.carId).toUpperCase(),14,'#7fe0f1'),247);
  text(231,733,'POWER',10,'#b1cddb',true);
  text(326,730,Math.round(opponentPower)+' KW',15);
  text(231,753,'TORQUE',10,'#b1cddb',true);
  text(326,750,Math.round(opponentTorque)+' NM',15);
  text(231,775,'DRIVE',10,'#b1cddb',true);
  text(326,771,drive(getCarMagazineMeta(getBaseCarId(round.carId))?.drivetrain||
    oppCar.drivetrain),15);
  // Approximately a third of a preview car-length left and slightly higher.
  safeCarPreview(round.carId,545,743,211,225,round.opponentBuildState||{});

  // Translucent breathing hotspots: identical alpha/timing language to
  // Warehouse HQ's Office / Crew / Dyno hotspots, not filled menu buttons.
  const workshopHotspot=(x,y,w,h,label,action,{disabled=false}={})=>
    addProGlowingHotspot(s,add,{x,y,w,h,label,onClick:action,disabled});
  // Daichi LEFT, Sayaka RIGHT-CENTRE, Hiroshi RIGHT.
  workshopHotspot(190,576,229,44,'CAR SETUP',()=>openTune());
  const firstHeat=stageNo===1;
  const adviceLabel=advice.usedThisEvent&&state.briefingAdviceText?'VIEW ADVICE':
    advice.remaining>0?advice.remaining+' EVENT COOLDOWN':
    firstHeat?'ASK FOR ADVICE':'ADVICE CLOSED';
  workshopHotspot(1111,576,225,44,adviceLabel,()=>handleSayaka(),{
    disabled:(!advice.available||!firstHeat)&&!state.briefingAdviceText,
  });
  workshopHotspot(1390,576,220,44,'RACE BRIEFING',()=>toggleDialogue('hiroshi'));

  // Unpaid: CANCEL ENTRY discards preview edits and costs nothing. Paid:
  // existing saved series still requires the explicit forfeiture confirmation.
  btn(1070,779,246,54,unpaid?'CANCEL ENTRY':'FORFEIT EVENT',()=>{
    if(unpaid){close();options.onCancel?.();}
    else openForfeit();
  },{grey:true});
  btn(1368,779,246,54,unpaid?'GO TO GRID // '+cash(state.entryFee):'NEXT HEAT',()=>{
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
      const details=[
        ['EVENT',title],['ROUND',stageNo+' / '+stageTotal],
        ['NEXT DRIVER',String(round.opponentName||rival.name||'PRO DRIVER').toUpperCase()],
        ['NEXT CAR',String(oppCar.name||round.carId).toUpperCase()],
        ['PRIZE',cash(state.prizeCash)],
        ['POWER RULE',eligibility.rules.maxPowerKW==null?'OPEN':
          eligibility.rules.maxPowerKW+' KW MAX'],
        ['NOS RULE',eligibility.rules.noNos?'PROHIBITED':'ALLOWED'],
        ['STATUS',eligibility.eligible?'ELIGIBLE':eligibility.problems.join(' / '),
          eligibility.eligible?'#81efc4':'#ffb6ba'],
      ];
      renderStewardBriefing(s,dialogueAdd,details,{anchorX:1402});
      // Closing is intentionally ONLY via the glowing Hiroshi hotspot.
    }else if(which==='sayaka'&&state.briefingAdviceText){
      // Lower than the player's face; the small equilateral speech point
      // sits in the UPPER half of the right edge and aims toward Sayaka.
      const x=558,y=405,w=470,h=146,edge=x+w;
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
    if(!advice.available||!firstHeat)return;
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
  // Daichi uses the same cyan-border / dark-ink dialogue language as
  // Hiroshi's steward bubble, with room for actual ECU and NOS controls.
  // Shared Hiroshi-style shape. The left pointer aims back at Daichi;
  // all live Dyno Stage III controls sit to the RIGHT of his character.
  function mechanicDialogue(title,description=''){
    dismiss();
    popupAdd(s.add.rectangle(W/2,H/2,W,H,0x020611,.47)
      .setDepth(269).setInteractive());
    const x=377,y=46,w=891,h=738,side=36,mid=206;
    const half=side/2,tip=Math.sqrt(3)*side/2;
    const points=[
      {x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h},
      {x,y:mid+half},{x:x-tip,y:mid},{x,y:mid-half},
    ];
    const panel=popupAdd(s.add.graphics().setDepth(270));
    panel.fillStyle(0x081a2b,.97);panel.fillPoints(points,true);
    panel.lineStyle(3,CYAN,1);panel.strokePoints(points,true);
    popupAdd(s.add.text(x+25,y+21,title,{
      fontFamily:PIXEL,fontSize:'17px',color:'#53ddff',
    }).setDepth(274));
    popupAdd(s.add.rectangle(x+w/2,y+68,w-48,1,0x3c7e98,.75)
      .setDepth(273));
    if(description)popupAdd(s.add.text(x+25,y+89,description,{
      fontFamily:BODY,fontSize:'18px',fontStyle:'600',
      color:'#dceaf3',wordWrap:{width:w-58},lineSpacing:4,
    }).setDepth(274));
  }
  function modalBtn(x,y,w,label,action,red=false){
    const hit=popupAdd(s.add.rectangle(x,y,w,51,red?0x672336:0x142b3e)
      .setStrokeStyle(2,red?RED:CYAN).setDepth(275));
    hit.setInteractive({useHandCursor:true}).on('pointerdown',action);
    const copy=popupAdd(s.add.text(x,y,label,{fontFamily:PIXEL,
      fontSize:'13px',color:'#ffffff'}).setFontSize(13).setOrigin(.5).setDepth(276));
    fit(copy,w-14);
    return {hit,copy};
  }
  function openForfeit(){
    showCompactProForfeit(s,{
      title:'FORFEIT DRIVER EVENT?',
      message:'The entry fee is not refunded. Remaining rounds count as losses and Daichi will restore stored upgrades.',
      onConfirm:()=>{close();options.onForfeit?.();},
    });
  }
  function openAdvice(){
    if(!driverAdviceStatus(options.previewCircuit||s.registry.get('proCircuit')||{},
      options.state||s.registry.get('competitionState')||{}).available)return;
    showProSayakaAdviceConfirm(s,{
      message:unpaid?
        'Advice applies to every heat of this event. The cooldown covers this event and the next two professional events.':
        'Advice applies to every remaining heat of this event. It stays available to review throughout the competition.',
      onConfirm:()=>{
        close();
        options.onAdvice?.(driverOpponentAdvice(oppCar,rival,playerCar));
      },
    });
  }
  function openPowerParts(){
    const stored=carState.proBriefingPowerStash||{};
    const selected=new Set();
    mechanicDialogue('DAICHI // REMOVE PARTS',
      'Select any combination of installed parts. Daichi will remove all selected parts together, free of charge. Equipment is restored after the event.');
    const apply=modalBtn(831,730,266,'APPLY REMOVALS // 0',()=>{
      if(!selected.size)return;
      const next=removeDriverPowerParts(carState,[...selected]);
      dismiss();close();options.onCarState?.(next);
    });
    const refreshApply=()=>{
      apply.copy.setText('APPLY REMOVALS // '+selected.size);
      fit(apply.copy,250);
      apply.hit.setFillStyle(selected.size?0x1a7e83:0x142b3e,1)
        .setStrokeStyle(2,selected.size?0xa6ffef:CYAN);
      apply.copy.setColor(selected.size?'#ffffff':'#b4c7d5');
    };
    BRIEFING_POWER_PARTS.forEach((part,i)=>{
      const isNos=part.id==='nosKit';
      const group=part.group==='tuning'?(carState.tuning||carState.engineTuning||{}):
        carState.exhaustNosTuning||{};
      const level=isNos
        ?Math.max(Number(group.nosKit||0),carState.nosInstalled?1:0)
        :Math.max(0,Math.round(Number(group[part.id]||0)));
      const stashed=isNos?Boolean(carState.proBriefingNosStash):
        Object.hasOwn(stored[part.group]||{},part.id);
      const x=i<5?609:1030,y=294+(i%5)*81;
      const available=level>0&&!stashed;
      const hit=popupAdd(s.add.rectangle(x,y,392,57,
        available?0x153449:0x122233,.96)
        .setStrokeStyle(2,available?CYAN:0x667788).setDepth(275));
      const status=()=>available?
        (selected.has(part.id)?'SELECTED':'LEVEL '+level+'  SELECT'):
        stashed?'STORED':'STOCK';
      const caption=popupAdd(s.add.text(x,y,
        part.label+' // '+status(),{
          fontFamily:PIXEL,fontSize:'14px',
          color:available?'#ffffff':'#aab9c8',
        }).setOrigin(.5).setDepth(276));
      fit(caption,372);
      if(available)hit.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
        if(selected.has(part.id))selected.delete(part.id);
        else selected.add(part.id);
        const chosen=selected.has(part.id);
        hit.setFillStyle(chosen?0x226e72:0x153449,.96)
          .setStrokeStyle(2,chosen?0xa6ffef:CYAN);
        caption.setText(part.label+' // '+status()).setColor('#ffffff');
        fit(caption,372);
        refreshApply();
      });
    });
    modalBtn(532,730,238,'BACK TO SETUP',openTune);
    modalBtn(1116,730,236,'RESTORE ALL',()=>{
      let next=restoreDriverPowerParts(carState);
      if(next.proBriefingNosStash)next=toggleBriefingNos(next);
      dismiss();close();options.onCarState?.(next);
    });
    refreshApply();
  }
  function openTune(){
    const installed=getStage3CalibrationEligibility(carState);
    // Identical five positions, options, hardware gates, colours and
    // Level III parts art to the Warehouse Dyno's renderStage3Tuning().
    // Only the three calibration rows are needed in this mechanic dialogue.
    const level3=Boolean(options.proAccess);
    const values=normaliseStage3Calibration(carState);
    const canTune=level3&&Object.values(installed).some(Boolean);
    mechanicDialogue('DAICHI // CAR SETUP',
      "I've got some great equipment here. I can remove key car parts to meet race requirements for free. I can also do advanced calibration on the car, as long as it has matching level 3 parts.");
    const entries=[
      {key:'ecuBias',title:'ECU CURVE',sprite:'tuningPartEcuL3',
        requirement:'REQUIRES MOTORSPORT ECU // LEVEL 3',
        left:'MIDRANGE',right:'TOP END',accent:0x62e8c7,y:320},
      {key:'boostBias',title:'BOOST CURVE',sprite:'tuningPartTurboL3',
        requirement:'REQUIRES BIG TURBO // LEVEL 3',
        left:'EARLY',right:'LATE / STRONG',accent:0x43dfff,y:461},
      {key:'gearBias',title:'GEAR SPREAD',sprite:'tuningPartGearboxL3',
        requirement:'REQUIRES DOG BOX // LEVEL 3',
        left:'CLOSE',right:'WIDE',accent:0xffc86a,y:602},
    ];
    const tuneNodes=[];
    let applyButton=null;
    const original=normaliseStage3Calibration(carState);
    function highlightApplyTune(){
      if(!applyButton)return;
      const changed=['ecuBias','boostBias','gearBias'].some(key=>
        values[key]!==original[key]);
      applyButton.hit.setFillStyle(changed?0x167c79:0x142b3e,1)
        .setStrokeStyle(2,changed?0xafffee:CYAN);
      applyButton.copy.setColor(changed?'#ffffff':'#b4c7d5');
    }
    const dynamic=obj=>{popupAdd(obj);tuneNodes.push(obj);return obj;};
    function tuneRows(){
      tuneNodes.forEach(o=>{try{o.destroy();}catch(_){}});
      tuneNodes.length=0;
      entries.forEach(entry=>{
        const unlocked=level3&&Boolean(installed[entry.key]);
        const current=values[entry.key];
        const option=getStage3CalibrationOption(entry.key,current);
        const selectedColour=unlocked?entry.accent:0x47535a;
        const bg=dynamic(s.add.rectangle(820,entry.y,826,124,0x07111d,
          unlocked?.86:.72).setStrokeStyle(1,selectedColour,
          unlocked?.62:.48).setDepth(272));
        if(s.textures.exists(entry.sprite)){
          const sprite=dynamic(s.add.image(479,entry.y+20,entry.sprite)
            .setDepth(275).setAlpha(unlocked?1:.30));
          const source=s.textures.get(entry.sprite).getSourceImage();
          sprite.setScale(Math.min(66/Math.max(1,source.width),
            66/Math.max(1,source.height)));
        }
        const accent='#'+entry.accent.toString(16).padStart(6,'0');
        dynamic(s.add.text(541,entry.y-49,
          entry.title+'  //  '+(unlocked?option?.label||'BALANCED':'LOCKED'),{
            fontFamily:PIXEL,fontSize:'13px',color:unlocked?accent:'#71808a',
          }).setDepth(275));
        if(!unlocked){
          dynamic(s.add.text(551,entry.y+5,entry.requirement,{
            fontFamily:PIXEL,fontSize:'11px',color:'#a99a8b',
            wordWrap:{width:610},
          }).setDepth(275));
          return;
        }
        dynamic(s.add.text(663,entry.y+4,entry.left,{
          fontFamily:BODY,fontSize:'14px',fontStyle:'700',color:'#839aa8',
        }).setOrigin(1,.5).setDepth(275));
        dynamic(s.add.text(1098,entry.y+4,entry.right,{
          fontFamily:BODY,fontSize:'14px',fontStyle:'700',color:'#839aa8',
        }).setOrigin(0,.5).setDepth(275));
        STAGE3_CALIBRATION_OPTIONS[entry.key].forEach((preset,index)=>{
          const bx=704+index*87,by=entry.y+4;
          const selected=preset.value===current;
          const hit=dynamic(s.add.rectangle(bx,by,63,38,
            selected?entry.accent:0x102138,selected?.92:.98)
            .setStrokeStyle(2,selected?0xffffff:entry.accent,
              selected?.85:.55).setDepth(274));
          dynamic(s.add.text(bx,by,preset.value>0?'+'+preset.value:
            String(preset.value),{
            fontFamily:PIXEL,fontSize:'12px',
            color:selected?'#07111d':'#dcecf4',
          }).setOrigin(.5).setDepth(276));
          hit.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
            values[entry.key]=preset.value;
            tuneRows();
            highlightApplyTune();
          });
        });
        dynamic(s.add.text(885,entry.y+43,option?.detail||'',{
          fontFamily:BODY,fontSize:'14px',fontStyle:'700',color:'#9ab0bc',
          align:'center',wordWrap:{width:475},
        }).setOrigin(.5).setDepth(275));
      });
    }
    tuneRows();
    modalBtn(557,730,223,'REMOVE PARTS',()=>openPowerParts());
    applyButton=modalBtn(839,730,223,'APPLY TUNE',()=>{
      const next={...carState,stage3Calibration:canTune?{
        ecuBias:installed.ecuBias?values.ecuBias:0,
        boostBias:installed.boostBias?values.boostBias:0,
        gearBias:installed.gearBias?values.gearBias:0,
      }:normaliseStage3Calibration(carState)};
      if(canTune&&carState.dyno)next.dyno={
        ...carState.dyno,officialReading:null,
      };
      dismiss();close();options.onCarState?.(next);
    });
    highlightApplyTune();
    modalBtn(1112,730,223,'CLOSE',dismiss);
  }

}
