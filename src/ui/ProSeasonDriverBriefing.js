// Pro Season driver briefing uses Open Circuit room geometry and dialogue chrome.
// Daichi directs setup to the real Pro Paddock; no temporary tuning is allowed.
import { characters, getCharacterVisualAsset, getCharacterAssetUrl, getProCircuitGenericDriverAsset } from '../data/characters.js?v=20261022-r635';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261022-r635';
import { getBaseCarId } from '../data/carOwnership.js?v=20261011-r479';
import { preloadCarAppearanceAssets, preloadCarWheel, ensureDerivedModularCarTextures, getCarPaintColor } from '../vehicles/CarAppearance.js?v=20261014-stock';
import { cars } from '../data/cars.js?v=20261026-r687';
import { getProDriverDrivetrain,getProfessionalCarEligibility,
  getProSeasonDriverCarError } from '../data/proSeason.js?v=20261030-r741';
import { normaliseProCircuitState } from '../data/proCircuit.js?v=20261030-r741';
import { PRO_GARAGE_ID } from '../data/workshopProgression.js?v=20261024-r675';
import { selectProDuelOpponents } from '../data/proDragDuel.js?v=20261030-r741';
import { driverOpponentAdvice, getProDriverHelmetIndex } from '../data/proDriverBriefing.js?v=20261030-r740';
import { saveProTransaction } from '../state/GameState.js?v=20261030-r739';
import { addProGlowingHotspot, renderPagedStewardBriefing } from './ProBriefingChrome.js?v=20261020-r613';

const PIXEL='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';
const DISPLAY='"Exo 2", sans-serif';
const CYAN=0x35d6ff;
const fit=(node,max)=>{if(node?.width>max)node.setScale(max/node.width);return node;};
const money=n=>'¥'+Math.round(Number(n)||0).toLocaleString('en-US');
const shortDrive=d=>d==='FWD'?'FF':d||'—';

export function showProSeasonDriverBriefing(s,event,onGrid,options={}){
  const initial=normaliseProCircuitState(s.registry.get('proCircuit'));
  const resume=Boolean(options.resume);
  const paidState=s.registry.get('competitionState');
  const adviceKey='s'+initial.season+':r'+initial.calendar.round+':'+event.id;
  const savedAdvice=()=>((s.registry.get('proCircuit')||{}).seasonDriverAdviceUsed||{})[adviceKey];
  const adviceUsed=()=>Boolean(savedAdvice());
  const opponents=selectProDuelOpponents(initial,{
    eventId:event.id,
    entryOrdinal:Number(initial.calendar.round||0)+8*Math.max(0,Number(initial.season||1)-1),
    count:event.opponentRatings?.length||3,
  });
  const opponent=()=>{
    const current=s.registry.get('competitionState');
    const heat=resume?current?.rounds?.[current.roundIndex]:null;
    return heat?{...heat,name:heat.opponentName,carId:heat.carId}:opponents[0]||null;
  };
  const owned=s.registry.get('ownedCarIds')||[];
  // Roster-less historical seasons remain playable. Their legacy choice
  // was any owned personal car; display the selected one first.
  const legacy=!Array.isArray(initial.registeredDriverCars);
  const legacyOrder=[s.registry.get('selectedCarId'),...owned]
    .filter((id,i,items)=>id&&items.indexOf(id)===i);
  const roster=(legacy?legacyOrder:initial.registeredDriverCars)
    .filter(id=>cars[id]&&owned.includes(id)&&!cars[id].ginzaDemo&&!cars[id].crewLoan)
    .slice(0,3);
  if(initial.seasonStatus!=='ACTIVE'||initial.calendar.round>=8||!roster.length)return false;
  if(s._proOverlayClose)s._proOverlayClose();
  // Selection is exclusively made in the Pro Paddock, never auto-picked
  // by the briefing. A missing/incorrect choice must remain ineligible.
  const selectedId=s.registry.get('selectedCarId');
  let selected=roster.includes(selectedId)?selectedId:null;
  const originals=s.registry.get('carStates')||{};
  const drafts=Object.fromEntries(roster.map(id=>[id,originals[id]||{}]));
  let closed=false,nodes=[],dialogueNodes=[],activeDialogue=null;
  const clearDialogue=()=>{dialogueNodes.forEach(node=>node?.destroy?.());dialogueNodes=[];activeDialogue=null;};
  const discard=()=>{clearDialogue();nodes.forEach(node=>node?.destroy?.());nodes=[];};
  const close=()=>{
    if(closed)return;closed=true;discard();
    if(s._proOverlayClose===close)s._proOverlayClose=null;
    s.events.off('shutdown',close);
  };
  const add=node=>{nodes.push(node);return node;};
  s._proOverlayClose=close;
  s.events.once('shutdown',close);
  const label=(x,y,value,size=17,color='#dceaf0',extra={})=>add(
    s.add.text(x,y,value,{fontFamily:BODY,fontSize:size+'px',fontStyle:'700',
      color,wordWrap:{width:extra.wrap||1380},lineSpacing:3})
      .setDepth(230));
  // Match the Open Circuit driver's Exo headings, Silkscreen rules and skewed panels.
  const text=(x,y,value,size=16,color='#f5f7fa',pixel=false,depth=230)=>add(
    s.add.text(x,y,String(value),{fontFamily:pixel?PIXEL:BODY,
      fontSize:size+'px',fontStyle:pixel?'normal':'600',color,
      wordWrap:{width:780}}).setFontSize(size).setDepth(depth));
  const display=(x,y,value,size,color='#fff')=>add(
    s.add.text(x,y,String(value),{fontFamily:DISPLAY,fontSize:size+'px',
      fontStyle:'italic 900',color,stroke:'#081321',strokeThickness:2})
      .setFontSize(size).setDepth(230));
  const poly=(x,y,w,h,fill=0x061321,line=CYAN,depth=216)=>{
    const points=[{x:x+25,y},{x:x+w+25,y},{x:x+w-25,y:y+h},{x:x-25,y:y+h}];
    const g=add(s.add.graphics().setDepth(depth));
    g.fillStyle(fill,.84);g.fillPoints(points,true);
    g.lineStyle(3,line,1);g.strokePoints(points,true);return g;
  };
  const button=(x,y,w,h,caption,callback,enabled=true,{grey=false}={})=>{
    const bg=add(s.add.rectangle(x,y,w,h,
      !enabled||grey?0x30353d:0x0e2839,1)
      .setStrokeStyle(2,!enabled?0x737b83:grey?0x8a939d:CYAN)
      .setDepth(246));
    const txt=fit(text(x,y,caption,13,
      enabled?'#ffffff':'#bac0c6',true,247).setOrigin(.5),w-18);
    if(enabled)bg.setInteractive({useHandCursor:true}).on('pointerdown',callback);
    return bg;
  };
  const rules=event.seasonRules||{};
  const limit=Number.isFinite(rules.maxPowerKW)?rules.maxPowerKW:null;
  const spec=(rules.stock?'FACTORY STOCK  /  ':'')+
    (rules.drivetrain?shortDrive(rules.drivetrain)+' ONLY  /  ':'ANY DRIVETRAIN  /  ')+
    (limit!=null?limit+' KW MAX':'UNLIMITED POWER')+'  /  '+
    (rules.noNos?'NOS OFF REQUIRED':
      Number.isFinite(rules.maxNosShots)
        ?rules.maxNosShots+' NOS SHOTS MAX':'NOS PERMITTED');

  function openProPaddock(){
    close();
    const previous=s.registry.get('workshopLocationId')||'shinonomeWarehouseStrip';
    s.scene.start('GarageScene',{
      proGarageMode:true,crewMode:false,workshopLocationId:PRO_GARAGE_ID,
      returnWorkshopId:previous===PRO_GARAGE_ID?'shinonomeWarehouseStrip':previous,
      proBriefingReturn:{eventId:event.id,seasonChoice:event.seasonChoice,
        season:initial.season,round:initial.calendar.round},
    });
  }

  const assets=[
    ['proSeasonBriefRoomDay','assets/CentralTokyo/dragcomplex/regoroom_day.png'],
    ['proSeasonBriefRoomNight','assets/CentralTokyo/dragcomplex/regoroom_night.png'],
    ['proSeasonBriefDaichi','assets/Characters/Main/pro_daichi_sakamoto.png'],
    ['proSeasonBriefSayaka','assets/Characters/Main/race_sayaka_fujieda_idle.png'],
    ['proSeasonBriefHiroshi','assets/Characters/Central/hiroshi_sato_normal.png'],
  ];
  const playerAsset=getCharacterVisualAsset(s.registry.get('playerCharacterId')||'renMizuno','idle',{proCircuit:true});
  if(playerAsset?.key&&playerAsset.path)assets.push([playerAsset.key,playerAsset.path]);
  const preview=opponent();
  const portrait=preview?.characterId
    ?getCharacterVisualAsset(preview.characterId,'idle',{proCircuit:true,rivalContext:true})
    :null;
  if(portrait?.key&&portrait.path)assets.push([portrait.key,portrait.path]);
  // House professionals do not have authored character portraits. A zero
  // index is invalid for this asset resolver and caused empty blue frames.
  const helmet=getProCircuitGenericDriverAsset(getProDriverHelmetIndex(
    {proSeasonId:event.id,roundIndex:initial.calendar.round},{
      opponentDriverId:preview?.opponentDriverId||preview?.id,
      characterId:preview?.characterId,opponentName:preview?.name,
    }));
  if(helmet?.path)assets.push([helmet.key,helmet.path]);
  let pending=0;
  for(const [key,path] of assets)if(!s.textures.exists(key)){
    s.load.image(key,getCharacterAssetUrl(path));pending++;
  }
  const selectedModels=Object.fromEntries(roster.filter(id=>cars[id]).map(id=>[getBaseCarId(id),cars[id]]));
  pending+=preloadCarAppearanceAssets(s,selectedModels,'20261019-r598');
  for(const id of roster)if(cars[id])pending+=preloadCarWheel(s,cars[id],drafts[id]||{});
  const rivalCarId=preview?.carId||(event.opponentCars||[])[0];
  if(rivalCarId&&cars[rivalCarId]){
    pending+=preloadCarAppearanceAssets(s,{[getBaseCarId(rivalCarId)]:cars[rivalCarId]},'20261019-r598');
    pending+=preloadCarWheel(s,cars[rivalCarId],preview?.opponentBuildState||{});
  }
  function proceedToGrid(){
    const now=normaliseProCircuitState(s.registry.get('proCircuit'));
    const latest=s.getProDragEvents?.().find(e=>e.id===event.id&&
      e.seasonChoice===event.seasonChoice);
    const currentSelection=s.registry.get('selectedCarId');
    const actual=s.registry.get('carStates')||{};
    const cash=Number(s.registry.get('cash')||0);
    const error=resume&&currentSelection!==paidState?.playerCarId
      ?'USE THE CAR ENTERED IN THIS EVENT':
      !currentSelection||!roster.includes(currentSelection)
      ?'SELECT A REGISTERED CAR IN PRO PADDOCK':
      getProSeasonDriverCarError(now,currentSelection)||
      getProfessionalCarEligibility(currentSelection,actual[currentSelection]||{},rules)
        .reasons.join(' / ');
    if(now.seasonStatus!=='ACTIVE'||now.calendar.round!==initial.calendar.round||
      !latest||latest.seasonRules?.format!==rules.format||
      now.activeTournament||now.activeTimedEvent||now.activeCrewEvent||
      (resume?(!paidState?.active||paidState?.eventId!==event.id||
        paidState?.openCircuit!==false):s.registry.get('competitionState')?.active)||
      (!resume&&cash<Number(event.entryFee||0))||error){
      s.proError=error||'EVENT OR SETUP CHANGED // REOPEN BRIEFING';
      close();s.renderLocation(s.activeLocationId);return;
    }
    // Never mutate car states in a briefing: the paddock owns all tuning.
    close();
    onGrid?.(s.getSelectedBuild?.());
  }

  function renderBriefing(){
    discard();
    const phase=String(s.worldPhase||'night').toLowerCase()==='day'?'Day':'Night';
    const room='proSeasonBriefRoom'+phase;
    add(s.add.rectangle(780,420,1560,840,0x06101b,1).setDepth(200).setInteractive());
    if(s.textures.exists(room)){
      const source=s.textures.get(room).getSourceImage();
      add(s.add.image(780,420,room).setScale(Math.max(1560/source.width,840/source.height)).setDepth(201));
      s.textures.get(room).setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    }
    add(s.add.rectangle(780,420,1560,840,0x020714,.10).setDepth(202));
    const title=String(event.label||'DRIVER EVENT').toUpperCase();
    poly(40,34,268,42,0x03070c,0x03070c,218);
    display(63,43,'PRO SEASON',21,'#ff8197');
    fit(display(55,83,title,41),790);
    add(s.add.text(58,136,'ROUND '+(initial.calendar.round+1)+' / 8  //  '+
      String(rules.format||'KNOCKOUT').replaceAll('_',' '),{
      fontFamily:DISPLAY,fontSize:'16px',fontStyle:'italic 900',
      color:'#c5cbd3',stroke:'#090d16',strokeThickness:3,
    }).setDepth(230));
    const positions=[
      {key:'proSeasonBriefDaichi',x:193,feet:727,height:560,max:280},
      {key:playerAsset?.key,x:410,feet:691,height:519,max:256},
      {key:'proSeasonBriefSayaka',x:1138,feet:763,height:527,max:276},
      {key:'proSeasonBriefHiroshi',x:1402,feet:724,height:522,max:270},
    ];
    for(const p of positions){
      if(!p.key||!s.textures.exists(p.key))continue;
      const source=s.textures.get(p.key).getSourceImage();
      const scale=Math.min(p.height/source.height,p.max/source.width);
      s.textures.get(p.key).setFilter?.(Phaser.Textures.FilterMode.NEAREST);
      add(s.add.ellipse(p.x,p.feet-(p.key==='proSeasonBriefSayaka'?16:6),
        p.max*.84,22,0,.27).setDepth(209));
      add(s.add.image(p.x,p.feet,p.key).setOrigin(.5,1).setScale(scale)
        .setFlipX(true).setDepth(214));
    }
    const draft=selected?(s.registry.get('carStates')||{})[selected]||{}:{};
    const check=selected?getProfessionalCarEligibility(selected,draft,rules):
      {eligible:false,reasons:['SELECT A CAR IN PRO PADDOCK']};
    const canStart=Boolean(selected)&&check.eligible&&
      (!resume||selected===paidState?.playerCarId)&&
      (resume||Number(s.registry.get('cash')||0)>=Number(event.entryFee||0));
    // Use the same vehicle display helper as the Open Circuit briefing.
    if(cars[selected]&&typeof s.createCarDisplay==='function'){
      try{
        ensureDerivedModularCarTextures(s,{[getBaseCarId(selected)]:cars[selected]});
        for(const part of s.createCarDisplay(cars[selected],796,492,670,207,
          getCarPaintColor(draft),null,false,draft)||[])if(part)add(part);
      }catch(error){console.warn('[Tokyo SHIFT] Season briefing car preview',error);}
    }
    // Exact Open Circuit geometry and type hierarchy for the opponent card.
    poly(52,643,654,164,0x071728,CYAN,219);
    display(89,652,'NEXT OPPONENT',24,'#35d6ff');
    const next=opponent();
    const frameX=74,frameY=683,frameW=129,frameH=106,skew=16;
    const framePoints=[
      {x:frameX+skew,y:frameY},{x:frameX+frameW+skew,y:frameY},
      {x:frameX+frameW-skew,y:frameY+frameH},
      {x:frameX-skew,y:frameY+frameH},
    ];
    const border=add(s.add.graphics().setDepth(220));
    border.fillStyle(0x165578,.87);border.fillPoints(framePoints,true);
    border.lineStyle(4,0x050a10,1);border.strokePoints(framePoints,true);
    const clipPortrait=image=>{
      const shape=s.make.graphics({add:false});
      shape.fillStyle(0xffffff,1);shape.fillPoints(framePoints,true);
      image.setMask(shape.createGeometryMask());
      add({destroy:()=>shape.destroy()});
    };
    const px=frameX+frameW/2-9,py=frameY+frameH/2;
    const isMainRival=Boolean(next?.mainRivalTier||
      characters[next?.characterId]?.mainRival);
    const helmetKey=helmet?.key;
    const drawHelmet=()=>{
      if(!helmetKey||!s.textures.exists(helmetKey))return false;
      const source=s.textures.get(helmetKey).getSourceImage();
      const scale=Math.max(frameW*1.6/Math.max(1,source.width),
        frameH*2.2/Math.max(1,source.height));
      s.textures.get(helmetKey).setFilter?.(Phaser.Textures.FilterMode.NEAREST);
      const profile=add(s.add.image(px,frameY+18,helmetKey)
        .setOrigin(.5,0).setScale(scale).setDepth(225));
      clipPortrait(profile);
      return true;
    };
    if(!isMainRival||!next?.characterId){
      if(!drawHelmet())text(px,py,'PRO DRIVER',11,'#b8d7e7',true,226).setOrigin(.5);
    }else{
      const profile=createCharacterProfile(s,{
        characterId:next.characterId,pose:'idle',x:px,y:py+10,
        frameWidth:frameW*1.55,frameHeight:frameH*1.5,
        side:'center',depth:225,mask:false,
        playerCharacterId:s.registry.get('playerCharacterId')||'renMizuno',
        rivalContext:true,proCircuit:true,
      });
      if(profile?.image){add(profile);clipPortrait(profile.image);}
      else if(!drawHelmet())text(px,py,'PRO DRIVER',11,'#b8d7e7',true,226).setOrigin(.5);
    }
    const rivalName=String(next?.name||'PRO DRIVER').toUpperCase();
    fit(text(231,684,rivalName,18,'#ffffff'),239);
    const shownCarId=next?.carId||rivalCarId;
    const carName=shownCarId&&cars[shownCarId]
      ?cars[shownCarId].name||cars[shownCarId].shortName||shownCarId
      :'CAR CONFIRMED ON ENTRY';
    fit(text(231,708,String(carName).toUpperCase(),14,'#7fe0f1'),247);
    // Reveal event restrictions, not confidential AI power or tuning.
    text(231,733,'CLASS CAP',10,'#b1cddb',true);
    text(326,730,limit==null?'OPEN':limit+' KW MAX',15);
    text(231,753,'NOS',10,'#b1cddb',true);
    text(326,750,rules.noNos?'PROHIBITED':'PERMITTED',15);
    text(231,775,'CLASS',10,'#b1cddb',true);
    text(326,771,rules.stock?'FACTORY STOCK':rules.drivetrain||'OPEN',15);
    if(shownCarId&&cars[shownCarId]&&typeof s.createCarDisplay==='function'){
      try{
        ensureDerivedModularCarTextures(s,{
          [getBaseCarId(shownCarId)]:cars[shownCarId]});
        const parts=s.createCarDisplay(cars[shownCarId],545,743,211,225,
          next?.paintColor??0x7f8899,null,false,
          next?.opponentBuildState||{})||[];
        for(const [index,part] of parts.entries()){
          if(index===2){part?.destroy?.();continue;}
          if(part)add(part);
        }
      }catch(err){console.warn('[Tokyo SHIFT] Opponent preview',err);}
    }
    // Same Open Circuit mechanic hotspot; the Pro Season action always
    // opens the real paddock, never the legacy free-tuning shortcut.
    addProGlowingHotspot(s,add,{x:190,y:576,w:229,h:44,
      label:'CAR SETUP',onClick:openProPaddock});
    addProGlowingHotspot(s,add,{x:1111,y:576,w:225,h:44,
      label:adviceUsed()?'VIEW ADVICE':'ASK FOR ADVICE',
      onClick:()=>{
        if(!adviceUsed()){
          const circuit=normaliseProCircuitState(s.registry.get('proCircuit'));
          try{
            saveProTransaction(s.registry,{proCircuit:{
              ...circuit,seasonDriverAdviceUsed:{
                ...(circuit.seasonDriverAdviceUsed||{}),[adviceKey]:driverOpponentAdvice(
                (opponent()?.carId&&cars[opponent().carId])||{},
                {name:opponent()?.name},selected?cars[selected]||{}:{}),
              },
            }});
          }catch(error){console.warn('[Tokyo SHIFT] Advice save failed',error);return;}
        }
        toggleDialogue('sayaka',check);
      }});
    addProGlowingHotspot(s,add,{x:1390,y:576,w:220,h:44,
      label:'RACE BRIEFING',onClick:()=>toggleDialogue('hiroshi',check)});
    button(1070,779,246,54,'BACK TO SEASON',close,true,{grey:true});
    button(1368,779,246,54,canStart?
      (resume?'RESUME NEXT HEAT':'GO TO GRID'):
      'SELECT / SET UP CAR',proceedToGrid,canStart);
  }
  // Same two-page steward and cream advice bubble used by Open Circuit.
  function toggleDialogue(which,check){
    if(activeDialogue===which){clearDialogue();return;}
    clearDialogue();activeDialogue=which;
    if(which==='hiroshi'){
      const title=String(event.label||'DRIVER EVENT').toUpperCase();
      const format=String(rules.format||'KNOCKOUT').replaceAll('_',' ');
      renderPagedStewardBriefing(s,node=>{dialogueNodes.push(node);return add(node);},[
        {sections:[
          {text:'PRO SEASON · ROUND '+(initial.calendar.round+1)+' / 8',large:true},
          {label:'HOW IT WORKS',paragraphs:[
            'Race under the published '+format.toLowerCase()+' rules for this round.',
            'Earn up to 20 championship points. Your car must pass scrutineering before entry.',
          ]},
        ]},
        {rows:[
          ['EVENT',title],
          ['CAR',selected?(cars[selected]?.shortName||selected):'NOT SELECTED'],
          ['DRIVETRAIN',rules.drivetrain?shortDrive(rules.drivetrain):'OPEN'],
          ['POWER LIMIT',limit==null?'OPEN':limit+' KW MAX'],
          ['NOS',rules.noNos?'PROHIBITED':
            Number.isFinite(rules.maxNosShots)?rules.maxNosShots+' SHOTS MAX':'ALLOWED'],
          ['ENTRY','SPONSORED // FREE'],
          ['PRIZE',money(event.prizeCash)],
          ['STATUS',check.eligible?'ELIGIBLE':check.reasons.join(' / '),
            check.eligible?'#81efc4':'#ffb6ba'],
        ]},
      ],{anchorX:1402});
    }else if(which==='sayaka'){
      const put=node=>{dialogueNodes.push(node);return add(node);};
      const x=558,y=405,w=470,h=146,edge=x+w,half=18,mid=y+41;
      const pts=[{x,y},{x:edge,y},{x:edge,y:mid-half},
        {x:edge+Math.sqrt(3)*half,y:mid},{x:edge,y:mid+half},
        {x:edge,y:y+h},{x,y:y+h}];
      const bubble=put(s.add.graphics().setDepth(260));
      bubble.fillStyle(0xfffcf1,1);bubble.fillPoints(pts,true);
      bubble.lineStyle(5,0x111111,1);bubble.strokePoints(pts,true);
      put(s.add.text(x+18,y+11,'Sayaka',{
        fontFamily:BODY,fontSize:'16px',color:'#252227',fontStyle:'700',
      }).setDepth(261));
      const next=opponent();
      const rivalCar=next?.carId?cars[next.carId]:null;
      const message=typeof savedAdvice()==='string'?savedAdvice():
        next?driverOpponentAdvice(rivalCar||{},
          {name:next.name},selected?cars[selected]||{}:{})
        :'Check your selected car and launch setup before racing.';
      const speech=put(s.add.text(x+18,y+38,message,{
        fontFamily:BODY,fontSize:'16px',fontStyle:'600',color:'#111111',
        wordWrap:{width:w-37},
      }).setDepth(261));
      if(speech.height>h-49)speech.setScale((h-49)/speech.height);
    }
  }
  if(pending){
    discard();
    add(s.add.rectangle(780,420,1560,840,0x07111d,.99).setDepth(200).setInteractive());
    label(590,407,'PREPARING PRO SEASON BRIEFING',19,'#ffffff');
    s.load.once('complete',()=>{
      if(closed||!s.sys?.isActive?.())return;
      renderBriefing();
    });
    s.load.start();
  }else renderBriefing();
  return true;
}
