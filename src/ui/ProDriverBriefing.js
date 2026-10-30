// R610 — Reposition player, Sayaka, car ride height and individual heat subtitle.
// Deliberately reuses the Pro Crew registration-room art and screen vocabulary.
// Only active Open Circuit individual driver duels enter this room.
import { cars } from '../data/cars.js?v=20261026-r687';
import { getBaseCarId } from '../data/carOwnership.js?v=20261011-r479';
import { characters, getCharacterVisualAsset, getCharacterAssetUrl, getProCircuitGenericDriverAsset } from '../data/characters.js?v=20261022-r635';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261022-r635';
import { getVehiclePerformance } from '../vehicles/VehiclePerformance.js?v=20261026-r687';
import { getCarMagazineMeta } from '../data/carMagazine.js?v=20261011-r479';
import { STAGE3_CALIBRATION_OPTIONS, normaliseStage3Calibration, getStage3CalibrationEligibility,
  getStage3CalibrationOption } from '../data/stage3Calibration.js?v=20261026-r687';
import { addProGlowingHotspot, addProHeatSubtitle, renderStewardBriefing, renderPagedStewardBriefing, showCompactProForfeit, showProSayakaAdviceConfirm } from './ProBriefingChrome.js?v=20261020-r613';
import { driverAdviceStatus, driverBriefingEligibility, driverOpponentAdvice,
  toggleBriefingNos, isOpenDriverBriefing, BRIEFING_POWER_PARTS,
  removeDriverPowerPart, removeDriverPowerParts, restoreDriverPowerParts,
  getDriverPowerPartLevelInfo, setDriverPowerPartLevels,
  getProDriverHelmetIndex } from '../data/proDriverBriefing.js?v=20261030-r728';
import { preloadCarAppearanceAssets, preloadCarWheel,
  ensureDerivedModularCarTextures, getCarPaintColor } from '../vehicles/CarAppearance.js?v=20261014-stock';
import { getProRaceRivalPaint } from '../data/proRacePaint.js?v=20261030-r726';

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
  const playerAsset=getCharacterVisualAsset(playerId,'idle',{proCircuit:true});
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
      const asset=getProCircuitGenericDriverAsset(helmetIndex);
      if(asset)s.load.image(helmetKey,getCharacterAssetUrl(asset.path));
      queued++;
    }
  }
  const rival=getCharacterVisualAsset(round.characterId,'idle',{
    playerCharacterId:s.registry.get('playerCharacterId')||'renMizuno',rivalContext:true,proCircuit:true,
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
    const hit=rect(x,y,w,h,disabled?0x30353d:grey?0x30353d:red?0x662032:0x0e2839,
      disabled?0x737b83:grey?0x8a939d:red?RED:CYAN,1,depth);
    if(!disabled)hit.setInteractive({useHandCursor:true}).on('pointerdown',action);
    const caption=text(x,y,label,13,disabled?'#bac0c6':'#ffffff',true,depth+1).setOrigin(.5);
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
  let performance=null;
  try{performance=getVehiclePerformance(getBaseCarId(state.playerCarId),carState);}
  catch(err){console.warn('[Tokyo SHIFT] Driver briefing performance unavailable',err);}
  const playerPower=Number(performance?.car?.powerKW||playerCar.powerKW||0);
  const eligibility=driverBriefingEligibility(state,carState,playerPower,
    s.registry.get('ownedCarIds')||[],fallback);
  const circuit=options.previewCircuit||s.registry.get('proCircuit')||{};
  const advice=driverAdviceStatus(circuit,state);
  // A consultation is charged only once per event. What Sayaka actually
  // says, however, is regenerated from the ACTIVE HEAT'S saved rival and
  // car every time this room opens. Older saves with first-heat prose are
  // safely upgraded by deriving it at display time, not by charging again.
  const currentOpponent={...rival,name:round.opponentName||rival.name};
  const currentOpponentCar={...oppCar,drivetrain:
    getCarMagazineMeta(round.carId)?.drivetrain||oppCar.drivetrain};
  const currentHeatAdvice=advice.usedThisEvent
    ? driverOpponentAdvice(currentOpponentCar,currentOpponent,playerCar) : null;
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
        if(i===2&&keepShadow)part?.setAlpha?.(.34);
        if(part)add(part);
      });
    }catch(err){console.warn('[Tokyo SHIFT] Briefing car display skipped',id,err);}
  };
  // R602: increase the R601 owned-car presentation a further 20%, shift
  // modestly up/right, preserve its exact paint, wheel and saved tuning state.
  safeCarPreview(state.playerCarId,796,492,670,207,carState,true);

  // Character order: DAICHI > PLAYER (mirrored) > OWNED CAR > SAYAKA > HIROSHI.
  // Both outer staff sprites are flipped as requested, while the protagonist
  // uses whichever authentic selectable character was saved in this profile.
  const playerAsset=getCharacterVisualAsset(playerId,'idle',{proCircuit:true});
  const characterPlaces=[
    {key:'proDriverDaichi',x:193,feet:727,height:560,maxWidth:280,flip:true,onTap:null},
    {key:playerAsset?.key,x:410,feet:691,height:519,maxWidth:256,flip:true,onTap:null},
    {key:'proDriverSayaka',x:1138,feet:763,height:527,maxWidth:276,flip:true,onTap:null},
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
  addProHeatSubtitle(s,add,{heat:stageNo,total:stageTotal,y:136,size:16});
  if(options.entryError){
    // Registration failures must be visible on the same paddock page,
    // not look like a button that simply refreshes with no action.
    const notice=add(s.add.text(790,158,
      'ENTRY NOT SAVED // '+String(options.entryError).slice(0,120),{
        fontFamily:PIXEL,fontSize:'13px',color:'#ffb5b9',
        backgroundColor:'#200b16ec',padding:{x:15,y:9},
      }).setOrigin(.5,0).setDepth(248));
    fit(notice,1040);
  }

  // Compact opponent panel. The nested portrait parallelogram uses the
  // identical slope as the outer card and a dark, professional black outline.
  poly(52,643,654,164,0x071728,CYAN,219);
  display(89,652,'NEXT OPPONENT',24,'#35d6ff');
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
  const px=frameX+frameW/2-9,py=frameY+frameH/2;
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
      playerCharacterId:playerId,rivalContext:true,proCircuit:true,
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
  // Show ONLY official restrictions, never the rival's private build data.
  // The rules appear both here and on Hiroshi's second briefing page.
  const rule=eligibility.rules;
  text(231,733,'CLASS CAP',10,'#b1cddb',true);
  text(326,730,rule.maxPowerKW==null?'OPEN':rule.maxPowerKW+' KW MAX',15);
  text(231,753,'NOS',10,'#b1cddb',true);
  text(326,750,rule.noNos?'PROHIBITED':'PERMITTED',15);
  text(231,775,'CLASS',10,'#b1cddb',true);
  text(326,771,rule.stock?'FACTORY STOCK':rule.drivetrain||'OPEN',15);
  // Approximately a third of a preview car-length left and slightly higher.
  safeCarPreview(round.carId,545,743,211,225,{
    ...(round.opponentBuildState||{}),
    // FourLaneTestScene paints the first opponent in every individual
    // Open Circuit/Trophy heat with this exact colour (not factory white).
    paintColor:getProRaceRivalPaint(0),
  });

  // Translucent breathing hotspots: identical alpha/timing language to
  // Warehouse HQ's Office / Crew / Dyno hotspots, not filled menu buttons.
  const workshopHotspot=(x,y,w,h,label,action,{disabled=false}={})=>
    addProGlowingHotspot(s,add,{x,y,w,h,label,onClick:action,disabled});
  // Daichi LEFT, Sayaka RIGHT-CENTRE, Hiroshi RIGHT.
  workshopHotspot(190,576,229,44,'CAR SETUP',()=>openTune());
  const adviceLabel=advice.usedThisEvent?'VIEW ADVICE':
    advice.remaining>0?advice.remaining+' EVENT COOLDOWN':
    advice.available?'ASK FOR ADVICE':'ADVICE CLOSED';
  workshopHotspot(1111,576,225,44,adviceLabel,()=>handleSayaka(),{
    disabled:!advice.available&&!advice.usedThisEvent,
  });
  workshopHotspot(1390,576,220,44,'RACE BRIEFING',()=>toggleDialogue('hiroshi'));

  // Unpaid: CANCEL ENTRY discards preview edits and costs nothing. Paid:
  // existing saved series still requires the explicit forfeiture confirmation.
  btn(1070,779,246,54,unpaid?'CANCEL ENTRY':'FORFEIT EVENT',()=>{
    if(unpaid){close();options.onCancel?.();}
    else openForfeit();
  },{grey:true});
  const eligibleGridLabel = unpaid?(state.entryFee===0?'GO TO GRID // SPONSORED':'GO TO GRID // '+cash(state.entryFee)):'NEXT HEAT';
  btn(1368,779,246,54,eligibility.eligible
    ? eligibleGridLabel : 'INELIGIBLE CAR SETUP',()=>{
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
        ['EVENT',title],
        ['NEXT DRIVER',String(round.opponentName||rival.name||'PRO DRIVER').toUpperCase()],
        ['NEXT CAR',String(oppCar.name||round.carId).toUpperCase()],
        ['PRIZE',cash(state.prizeCash)],
        ['POWER RULE',eligibility.rules.maxPowerKW==null?'OPEN':
          eligibility.rules.maxPowerKW+' KW MAX'],
        ['NOS RULE',eligibility.rules.noNos?'PROHIBITED':'ALLOWED'],
        ['STATUS',eligibility.eligible?'ELIGIBLE':eligibility.problems.join(' / '),
          eligibility.eligible?'#81efc4':'#ffb6ba'],
      ];
      // Trophy formats are deliberately excluded from this first-pass update.
      // Regular driver entries use the same two-page steward language as crews.
      if(state.openTrophyId){
        renderStewardBriefing(s,dialogueAdd,details,{anchorX:1402});
      }else{
        const sections=[
          {text:stageTotal+'-ROUND HEAD-TO-HEAD KNOCKOUT',large:true},
          {label:'HOW IT WORKS',paragraphs:[
            'Race one opponent at a time over a 1/4-mile standing-start drag. Each victory advances you to the next heat.',
            'Win all '+stageTotal+' heats to take the event. One defeat eliminates you from the knockout.',
          ]},
        ];
        const technical=[
          ['OPPONENT CAR',String(oppCar.name||round.carId).toUpperCase()],
          ['POWER LIMIT',eligibility.rules.maxPowerKW==null?'OPEN':eligibility.rules.maxPowerKW+' KW MAX'],
          ['NOS',eligibility.rules.noNos?'PROHIBITED':'ALLOWED'],
          ['CLASS',eligibility.rules.stock?'FACTORY STOCK':eligibility.rules.drivetrain||'OPEN'],
          ['PRIZE',cash(state.prizeCash)],
          ['STATUS',eligibility.eligible?'ELIGIBLE':eligibility.problems.join(' / '),
            eligibility.eligible?'#81efc4':'#ffb6ba'],
        ];
        renderPagedStewardBriefing(s,dialogueAdd,[
          {sections},{rows:technical},
        ],{anchorX:1402});
      }
      // Closing is intentionally ONLY via the glowing Hiroshi hotspot.
    }else if(which==='sayaka'&&currentHeatAdvice){
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
      const spoken=bubbleText(x+18,y+38,currentHeatAdvice,
        16,'#111111').setWordWrapWidth(w-37);
      spoken.setLineSpacing(1);
      if(spoken.height>h-49)spoken.setScale((h-49)/spoken.height);
      // Closing is intentionally ONLY via the glowing Sayaka hotspot.
    }
  }
  function handleSayaka(){
    if(advice.usedThisEvent){toggleDialogue('sayaka');return;}
    if(!advice.available)return;
    clearDialogue();openAdvice();
  }
  if(options.initialDialogue==='sayaka'&&currentHeatAdvice)
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
    const x=377,y=46,w=1140,h=738,side=36,mid=206;
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
      color:'#dceaf3',wordWrap:{width:835},lineSpacing:4,
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

  // Live physics readouts use the SAME tuned build as the actual race.
  // No guessed percentages or free 'dyno' result: official Stage I graph runs
  // remain a separate service and invalidate when parts are changed.
  function addLiveEngineeringMetrics(initialState) {
    // Keep all vehicle references in a dedicated RIGHT-HAND column.
    // The three tune rows and part-level controls occupy x=407..1233;
    // no stat box or label may overlap those interactive controls.
    const railX=1276,railY=216,railW=226,railH=455;
    popupAdd(s.add.text(railX+15,railY+17,'LIVE CAR STATS',{
      fontFamily:PIXEL,fontSize:'10px',color:'#9ee3f9',
    }).setDepth(275));
    const rows=[
      {label:'POWER',field:'power',y:railY+82},
      {label:'TORQUE',field:'torque',y:railY+169},
      {label:'WEIGHT',field:'mass',y:railY+256},
      {label:'SCRUTINEERING',field:'status',y:railY+343},
    ];
    const readouts=rows.map((row,index)=>{
      popupAdd(s.add.text(railX+15,row.y-12,row.label,{
        fontFamily:PIXEL,fontSize:'9px',color:'#9cc3d2',
      }).setDepth(275));
      return {...row,node:popupAdd(s.add.text(railX+15,row.y+12,'—',{
        fontFamily:BODY,
        fontSize:row.field==='status'?'16px':'24px',
        fontStyle:'700',color:'#ffffff',
        wordWrap:{width:railW-30},
      }).setDepth(275))};
    });
    const update=preview=>{
      let config=null;
      try{config=getVehiclePerformance(getBaseCarId(state.playerCarId),preview)?.car||null;}
      catch(err){console.warn('[Tokyo SHIFT] Setup preview unavailable',err);}
      const power=Number(config?.powerKW);
      const torque=Number(config?.torqueNm);
      const mass=Number(config?.vehicleMassKg);
      const check=driverBriefingEligibility(state,preview,power,
        s.registry.get('ownedCarIds')||[],fallback);
      const values={
        power:Number.isFinite(power)?Math.round(power)+' KW':'—',
        torque:Number.isFinite(torque)?Math.round(torque)+' NM':'—',
        mass:Number.isFinite(mass)?Math.round(mass)+' KG':'—',
        status:check.eligible?'ELIGIBLE':check.problems[0]||'INELIGIBLE',
      };
      readouts.forEach(entry=>{
        entry.node.setText(values[entry.field]).setColor(
          entry.field==='status'?(check.eligible?'#81efc4':'#ffb6ba'):'#ffffff');
        fit(entry.node,railW-30);
      });
      return check;
    };
    update(initialState);
    return update;
  }

  function openForfeit(){
    showCompactProForfeit(s,{
      title:'FORFEIT DRIVER EVENT?',
      message:'Remaining rounds count as losses and Daichi will restore stored upgrades. Aruken covers new professional entries.',
      onConfirm:()=>{close();options.onForfeit?.();},
    });
  }
  function openAdvice(){
    if(!driverAdviceStatus(options.previewCircuit||s.registry.get('proCircuit')||{},
      options.state||s.registry.get('competitionState')||{}).available)return;
    showProSayakaAdviceConfirm(s,{
      message:state.openTrophyId
        ? 'One consultation covers the entire trophy. Sayaka will update her advice for each remaining opponent. Cooldown: this trophy plus five other professional events.'
        : 'One consultation covers this event. Sayaka will update her advice for each remaining opponent. Cooldown: this event plus two other professional events.',
      onConfirm:()=>{
        close();
        options.onAdvice?.(driverOpponentAdvice(currentOpponentCar,currentOpponent,playerCar));
      },
    });
  }
  function openPowerParts(){
    mechanicDialogue('DAICHI // PART LEVELS',
      'Choose the level to fit for each part. Higher purchased levels are stored free for this event, then restored afterwards.');
    const previewMetrics=addLiveEngineeringMetrics(carState);
    const requestedLevels={};
    let previewState=carState;
    let rows=[];
    let partPage=0;
    const controls=modalBtn(830,730,266,'APPLY LEVELS // 0',()=>{
      if(!Object.keys(requestedLevels).length)return;
      // One atomic car-state change: unpaid previews stay scene-local.
      dismiss();close();options.onCarState?.(previewState);
    });
    const refreshApply=()=>{
      const count=Object.keys(requestedLevels).length;
      controls.copy.setText('APPLY LEVELS // '+count);
      fit(controls.copy,248);
      controls.hit.setFillStyle(count?0x1a7e83:0x142b3e,1)
        .setStrokeStyle(2,count?0xa6ffef:CYAN);
      controls.copy.setColor(count?'#ffffff':'#b4c7d5');
    };
    const redraw=()=>{
      rows.forEach(obj=>{try{obj.destroy();}catch(_){}});
      rows=[];
      const rowAdd=obj=>{popupAdd(obj);rows.push(obj);return obj;};
      // Two tidy pages fit all 15 technical parts without crowding the popup:
      // engine/exhaust/NOS first, drivetrain/chassis second.
      ['ENGINE + NOS','GRIP + WEIGHT'].forEach((label,index)=>{
        const tx=index===0?636:1034;
        const active=index===partPage;
        const hit=rowAdd(s.add.rectangle(tx,283,355,25,
          active?0x286e78:0x112638,.98)
          .setStrokeStyle(2,active?0x9aefed:0x477088).setDepth(274)
          .setInteractive({useHandCursor:true}));
        rowAdd(s.add.text(tx,283,label,{
          fontFamily:PIXEL,fontSize:'10px',
          color:active?'#ffffff':'#b5c8d5',
        }).setOrigin(.5).setDepth(275));
        hit.on('pointerdown',()=>{
          if(partPage===index)return;
          partPage=index;
          redraw();
        });
      });
      const parts=partPage===0
        ?BRIEFING_POWER_PARTS.slice(0,9)
        :BRIEFING_POWER_PARTS.slice(9);
      const firstColumnSize=partPage===0?5:3;
      parts.forEach((part,i)=>{
        const info=getDriverPowerPartLevelInfo(previewState,part.id);
        const owned=getDriverPowerPartLevelInfo(carState,part.id);
        const max=owned?.original||0;
        const current=info?.current||0;
        const x=i<firstColumnSize?610:1030;
        const y=326+(i%firstColumnSize)*80;
        rowAdd(s.add.rectangle(x,y,390,64,0x0c2132,.94)
          .setStrokeStyle(1,max>0?0x40718b:0x465360,.8).setDepth(273));
        const chosen=Object.prototype.hasOwnProperty.call(requestedLevels,part.id);
        rowAdd(s.add.text(x-177,y-26,part.label,{
          fontFamily:PIXEL,fontSize:'11px',color:max>0?'#e8f7ff':'#728b99',
        }).setDepth(275));
        rowAdd(s.add.text(x+177,y-26,
          'OWNED L'+max+(chosen?' // PREVIEW':''),
          {fontFamily:PIXEL,fontSize:'9px',color:chosen?'#90ffe3':'#9eb3c4'}
        ).setOrigin(1,0).setDepth(275));
        if(part.id==='nosKit'){
          const slots=[
            {level:0,label:'REMOVE NOS'},
            {level:max,label:'FIT NOS L'+max},
          ];
          slots.forEach((slot,j)=>{
            const bx=x+(j===0?-94:94),by=y+11;
            const active=slot.level===current;
            const usable=max>0;
            const hit=rowAdd(s.add.rectangle(bx,by,166,31,
              active?0x35b8b3:0x132e43,usable?1:.45)
              .setStrokeStyle(2,active?0xeaffff:0x5589a4)
              .setDepth(275));
            rowAdd(s.add.text(bx,by,slot.label,{
              fontFamily:PIXEL,fontSize:'9px',color:active?'#071923':'#dcecf4',
            }).setOrigin(.5).setDepth(276));
            if(usable)hit.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
              if(slot.level===getDriverPowerPartLevelInfo(carState,part.id)?.current)
                delete requestedLevels[part.id];
              else requestedLevels[part.id]=slot.level;
              previewState=setDriverPowerPartLevels(carState,requestedLevels);
              redraw();previewMetrics(previewState);refreshApply();
            });
          });
          return;
        }
        for(let level=0;level<=3;level++){
          const enabled=level<=max;
          const active=level===current;
          const bx=x-141+level*94,by=y+11;
          const hit=rowAdd(s.add.rectangle(bx,by,70,31,
            active?0x35b8b3:0x132e43,enabled?1:.36)
            .setStrokeStyle(2,active?0xeaffff:enabled?0x5589a4:0x40505b)
            .setDepth(275));
          rowAdd(s.add.text(bx,by,level===0?'STOCK':'L'+level,{
            fontFamily:PIXEL,fontSize:'10px',
            color:active?'#071923':enabled?'#dcecf4':'#647782',
          }).setOrigin(.5).setDepth(276));
          if(enabled)hit.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
            if(level===getDriverPowerPartLevelInfo(carState,part.id)?.current)
              delete requestedLevels[part.id];
            else requestedLevels[part.id]=level;
            previewState=setDriverPowerPartLevels(carState,requestedLevels);
            redraw();previewMetrics(previewState);refreshApply();
          });
        }
      });
    };
    modalBtn(532,730,238,'BACK TO SETUP',openTune);
    modalBtn(1116,730,236,'RESTORE ALL',()=>{
      let next=restoreDriverPowerParts(carState);
      if(next.proBriefingNosStash)next=toggleBriefingNos(next);
      dismiss();close();options.onCarState?.(next);
    });
    redraw();refreshApply();
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
      'Temporarily fit lower owned part levels or adjust Stage III calibration. All higher-level parts are restored after the event.');
    const previewMetrics=addLiveEngineeringMetrics(carState);
    const entries=[
      {key:'ecuBias',title:'ECU CURVE',sprite:'tuningPartEcuL3',
        requirement:'REQUIRES MOTORSPORT ECU // LEVEL 3',
        left:'MIDRANGE',right:'TOP END',accent:0x62e8c7,y:288},
      {key:'boostBias',title:'BOOST CURVE',sprite:'tuningPartTurboL3',
        requirement:'REQUIRES BIG TURBO // LEVEL 3',
        left:'EARLY',right:'LATE / STRONG',accent:0x43dfff,y:452},
      {key:'gearBias',title:'GEAR SPREAD',sprite:'tuningPartGearboxL3',
        requirement:'REQUIRES DOG BOX // LEVEL 3',
        left:'CLOSE',right:'WIDE',accent:0xffc86a,y:616},
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
        dynamic(s.add.text(432,entry.y-49,
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
            previewMetrics({...carState,stage3Calibration:{
              ...normaliseStage3Calibration(carState),...values,
            }});
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
