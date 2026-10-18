// R600 — Open Circuit individual paddock briefing: Hiroshi, player, car, Sayaka, Daichi.
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
  removeDriverPowerPart, restoreDriverPowerParts } from '../data/proDriverBriefing.js?v=20261019-r598';
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
    nodes.forEach(o=>{try{o?.destroy?.();}catch(_){}});
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
  // The same grounded sprite sizes/placement as the existing crew room.
  for(const p of [
    {key:'proDriverSayaka',x:1080,feet:765,height:545,flip:false},
    {key:'proDriverDaichi',x:1380,feet:765,height:555,flip:false},
  ]){
    if(!s.textures.exists(p.key))continue;
    const source=s.textures.get(p.key).getSourceImage();
    const scale=Math.min(p.height/Math.max(1,source.height),305/Math.max(1,source.width))*1.32;
    s.textures.get(p.key).setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    add(s.add.ellipse(p.x,p.feet-6,235,27,0,.34).setDepth(210));
    add(s.add.image(p.x,p.feet,p.key).setOrigin(.5,1).setScale(scale)
      .setFlipX(p.flip).setDepth(211));
  }
  const round=state.rounds[state.roundIndex],rival=characters[round.characterId]||{};
  const playerCar=modelFor(state.playerCarId)||{},oppCar=modelFor(round.carId)||{};
  const carStates=s.registry.get('carStates')||{};
  const carState=carStates[state.playerCarId]||{};
  const fallback=options.event||{};
  let performance=null,oppPerformance=null;
  try{performance=getVehiclePerformance(getBaseCarId(state.playerCarId),carState);}
  catch(err){console.warn('[Tokyo SHIFT] Briefing player performance unavailable',err);}
  try{oppPerformance=getVehiclePerformance(getBaseCarId(round.carId),round.opponentBuildState||{});}
  catch(err){console.warn('[Tokyo SHIFT] Briefing opponent performance unavailable',err);}
  const playerPower=Number(performance?.car?.powerKW||playerCar.powerKW||0);
  const playerTorque=Number(performance?.car?.torqueNm||playerCar.torqueNm||0);
  const opponentPower=Number(oppPerformance?.car?.powerKW||oppCar.powerKW||0);
  const eligibility=driverBriefingEligibility(state,carState,playerPower,
    s.registry.get('ownedCarIds')||[],fallback);
  const circuit=s.registry.get('proCircuit')||{};
  const advice=driverAdviceStatus(circuit,state);
  const stageNo=state.roundIndex+1,stageTotal=state.rounds.length;
  // Racing game title grammar is lifted from the regional/Pro Crew layout.
  poly(40,34,268,42,0x03070c,0x03070c,218);
  display(63,43,'OPEN CIRCUIT',21,'#ff8197');
  const title=String(state.briefingLabel||fallback.label||'DRIVER SERIES').toUpperCase();
  fit(display(55,83,title,41),790);
  // Compact, taller briefing card: the former third headline row was
  // redundant, so the race distance, start and round live here instead.
  rect(278,299,444,260,0x071522,0x476b81,.87,217);
  text(81,184,'EVENT BRIEFING',14,'#35d6ff',true);
  const detail=(y,label,value,color='#f2f7fb')=>{
    text(85,y,label,11,'#bfd4e1',true);
    fit(text(283,y-2,value,16,color),198);
  };
  detail(220,'ROUND',stageNo+' / '+stageTotal);
  detail(248,'RACE','1/4 MI // STANDING', '#e9f4ff');
  detail(276,'PRIZE',cash(state.prizeCash));
  detail(304,'ENTRY PAID',cash(state.entryFee));
  detail(332,'POWER RULE',eligibility.rules.maxPowerKW==null?
    'OPEN':eligibility.rules.maxPowerKW+' KW MAX');
  detail(360,'NOS RULE',eligibility.rules.noNos?'PROHIBITED':'ALLOWED',
    eligibility.rules.noNos?'#ffc8a1':'#e9f4ff');
  const problems=eligibility.problems.join(' // ');
  detail(388,'STATUS',eligibility.eligible?'ELIGIBLE':problems,
    eligibility.eligible?'#7af4c1':'#ff9d9d');

  poly(46,436,389,357,0x071728,CYAN,219);
  poly(463,436,447,357,0x071728,CYAN,219);
  display(83,451,'YOUR CAR',27,'#35d6ff');
  display(502,451,'NEXT OPPONENT',27,'#35d6ff');
  const safeCarPreview=(id,x,y,w,depth,previewState={})=>{
    const car=modelFor(id);
    if(!car||typeof s.createCarDisplay!=='function')return;
    try {
      const parts=s.createCarDisplay(car,x,y,w,depth,getCarPaintColor(previewState),
        null,false,previewState);
      parts.forEach((part,i)=>{if(i===2){part?.destroy?.();return;}
        if(part)add(part);});
    }catch(error){console.warn('[Tokyo SHIFT] Briefing car preview skipped',id,error);}
  };
  safeCarPreview(state.playerCarId,239,594,319,225,carState);
  safeCarPreview(round.carId,747,680,253,225,round.opponentBuildState||{});
  fit(text(81,676,String(playerCar.name||getBaseCarId(state.playerCarId)).toUpperCase(),17),324);
  text(81,712,'POWER',12,'#b0cddd',true);
  text(267,712,Math.round(playerPower)+' KW',16);
  text(81,740,'TORQUE',12,'#b0cddd',true);
  text(267,740,Math.round(playerTorque)+' NM',16);
  text(81,766,'DRIVE',12,'#b0cddd',true);
  text(267,766,drive(getCarMagazineMeta(getBaseCarId(state.playerCarId))?.drivetrain||playerCar.drivetrain),16);
  const roster=Object.values(s.registry.get('proCircuit')?.drivers||{}).find(d=>d.characterId===round.characterId);
  const displayName=String(round.opponentName||rival.name||roster?.name||round.characterId||'PRO DRIVER').toUpperCase();
  fit(text(642,517,displayName,19),259);
  const portrait=createCharacterProfile(s,{
    characterId:round.characterId,pose:'idle',x:548,y:575,
    frameWidth:152,frameHeight:140,side:'center',depth:226,mask:false,
    playerCharacterId:s.registry.get('playerCharacterId')||'renMizuno',
    rivalContext:true,
  });
  if(portrait?.image)add(portrait.image);
  fit(text(642,551,String(oppCar.name||round.carId).toUpperCase(),14,'#b9e3ef'),262);
  text(642,583,Math.round(opponentPower)+' KW  //  '+
    drive(getCarMagazineMeta(getBaseCarId(round.carId))?.drivetrain||oppCar.drivetrain),12,'#d1e5f0',true);
  text(520,749,'OPPONENT '+stageNo+' OF '+stageTotal,11,'#cbd9e7',true);
  // One advice consultation per paid competition; never per heat.
  const adviceLabel=advice.usedThisEvent?'ADVICE USED THIS EVENT':
    advice.remaining?'AVAILABLE AFTER '+advice.remaining+' EVENTS':'ADVICE AVAILABLE';
  fit(text(1014,580,adviceLabel,13,'#ecf2f5'),475);
  // Preserve the actual consultation on screen after confirming; the saved
  // speech also survives a reload and remains visible between event heats.
  if(state.briefingAdviceUsed && state.briefingAdviceText){
    // Exact Pro Crew speech-bubble treatment: warm paper, black outline and
    // an equilateral point facing Sayaka. No generic rectangular overlay.
    const x=522,y=247,w=449,h=148,edge=x+w;
    const halfBase=37,tipX=edge+Math.sqrt(3)*halfBase;
    const cy=y+h/2;
    const points=[{x,y},{x:edge,y},{x:edge,y:cy-halfBase},
      {x:tipX,y:cy},{x:edge,y:cy+halfBase},
      {x:edge,y:y+h},{x,y:y+h}];
    const bubble=add(s.add.graphics().setDepth(235));
    bubble.fillStyle(0xfffcf1,1);bubble.fillPoints(points,true);
    bubble.lineStyle(5,0x111111,1);bubble.strokePoints(points,true);
    text(x+19,y+10,'Sayaka',15,'#252227',false,238)
      .setFontStyle('700');
    const speech=text(x+19,y+40,String(state.briefingAdviceText),
      16,'#111111',false,238);
    speech.setWordWrapWidth(w-38);
    speech.setLineSpacing(1);
    if(speech.height>h-53)speech.setScale((h-53)/speech.height);
  }
  btn(1074,650,240,49,'ASK FOR ADVICE',()=>openAdvice(),
    {disabled:!advice.available});
  btn(1377,650,255,49,'DAICHI // TUNE',()=>openTune());
  btn(1240,755,542,65,'PROCEED TO GRID  >>',()=>{
    if(!eligibility.eligible)return;
    close();options.onRace?.();
  },{red:true,disabled:!eligibility.eligible});
  btn(1002,810,200,42,'FORFEIT EVENT',()=>openForfeit(),{red:true});
  btn(1459,810,170,42,'BACK',()=>{close();options.onBack?.();});

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
