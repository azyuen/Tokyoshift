// Free Pro Season driver preparation. Cars are registered at the Pro Paddock;
// this briefing chooses which of those cars will race and allows Daichi to
// fit/remove levels ALREADY OWNED, without charging or altering physics.
import { getCharacterVisualAsset, getCharacterAssetUrl } from '../data/characters.js?v=20261024-r680';
import { getBaseCarId } from '../data/carOwnership.js?v=20261011-r479';
import { preloadCarAppearanceAssets, preloadCarWheel, ensureDerivedModularCarTextures, getCarPaintColor } from '../vehicles/CarAppearance.js?v=20261014-stock';
import { cars } from '../data/cars.js?v=20261026-r687';
import { getProDriverDrivetrain,getProfessionalCarEligibility,
  getProfessionalRoundEvents,getProSeasonDriverCarError } from '../data/proSeason.js?v=20261030-r741';
import { normaliseProCircuitState } from '../data/proCircuit.js?v=20261030-r741';
import { BRIEFING_POWER_PARTS,getDriverPowerPartLevelInfo,
  setDriverPowerPartLevels } from '../data/proDriverBriefing.js?v=20261030-r740';
import { saveProTransaction } from '../state/GameState.js?v=20261030-r739';

const PIXEL='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';
const money=n=>'¥'+Math.round(Number(n)||0).toLocaleString('en-US');
const shortDrive=d=>d==='FWD'?'FF':d||'—';

export function showProSeasonDriverBriefing(s,event,onGrid){
  const initial=normaliseProCircuitState(s.registry.get('proCircuit'));
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
  const selectedId=s.registry.get('selectedCarId');
  let selected=roster.includes(selectedId)?selectedId:
    roster.find(id=>getProDriverDrivetrain(id)===event.seasonRules?.drivetrain)||roster[0];
  const originals=s.registry.get('carStates')||{};
  const drafts=Object.fromEntries(roster.map(id=>[id,originals[id]||{}]));
  let closed=false,nodes=[];
  const discard=()=>{nodes.forEach(node=>node?.destroy?.());nodes=[];};
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
      .setDepth(252));
  const button=(x,y,w,h,caption,callback,enabled=true)=>{
    const bg=add(s.add.rectangle(x,y,w,h,enabled?0x163044:0x152029,.98)
      .setStrokeStyle(2,enabled?0x57b6d2:0x506070).setDepth(252));
    const txt=label(x,y,caption,14,enabled?'#e9f9ff':'#8097a3')
      .setOrigin(.5);
    if(txt.width>w-14)txt.setScale((w-14)/txt.width);
    if(enabled)bg.setInteractive({useHandCursor:true}).on('pointerdown',callback);
  };
  const rules=event.seasonRules||{};
  const limit=Number.isFinite(rules.maxPowerKW)?rules.maxPowerKW:null;
  const spec=(rules.stock?'FACTORY STOCK  /  ':'')+
    (rules.drivetrain?shortDrive(rules.drivetrain)+' ONLY  /  ':'ANY DRIVETRAIN  /  ')+
    (limit!=null?limit+' KW MAX':'UNLIMITED POWER')+'  /  '+
    (rules.noNos?'NOS OFF REQUIRED':
      Number.isFinite(rules.maxNosShots)
        ?rules.maxNosShots+' NOS SHOTS MAX':'NOS PERMITTED');

  function renderSetup(){
    discard();
    add(s.add.rectangle(780,420,1560,840,0x06101b,.99).setDepth(250).setInteractive());
    add(s.add.rectangle(780,420,1494,786,0x0a1725,.98)
      .setStrokeStyle(2,0x56a5c2).setDepth(251));
    label(65,39,'PRO SEASON // '+String(event.label||'DRIVER EVENT'),23,'#ffffff');
    label(65,85,'DAICHI // FREE EVENT PREPARATION · OWNED PARTS ONLY',17,'#82dbed');
    label(65,118,spec,17,'#f5d9ae');
    label(65,152,'CHOOSE ONE OF YOUR THREE REGISTERED CARS',15,'#b6cdd8');
    roster.forEach((id,i)=>{
      const active=id===selected;
      const x=293+i*486;
      const hit=add(s.add.rectangle(x,210,453,71,active?0x204d56:0x142838,.96)
        .setStrokeStyle(2,active?0x8cf2dc:0x597b91).setDepth(252)
        .setInteractive({useHandCursor:true}));
      const caption=label(x-204,188,(active?'✓  ':'')+
        (cars[id]?.shortName||id)+' // '+shortDrive(getProDriverDrivetrain(id)),
        17,active?'#ffffff':'#c9d9e2');
      if(caption.width>400)caption.setScale(400/caption.width);
      hit.on('pointerdown',()=>{selected=id;renderSetup();});
    });
    const draft=drafts[selected]||{};
    const check=getProfessionalCarEligibility(selected,draft,rules);
    const canStart=check.eligible&&(!Number.isFinite(event.entryFee)||
      Number(s.registry.get('cash')||0)>=event.entryFee);
    label(66,264,'POWER  '+(Number.isFinite(check.powerKW)?Math.round(check.powerKW)+' KW':'—')+
      '  //  '+(check.eligible?'SCRUTINEERING PASSED':
        'SETUP REQUIRED: '+check.reasons.slice(0,2).join(' / ')),17,
      check.eligible?'#90e5bb':'#f0a8aa',{wrap:1380});
    label(65,308,'SELECT FITTED LEVELS · CHANGES COST ¥0 · PURCHASED PARTS REMAIN YOURS',15,'#9dc1d3');
    // Three columns of five items. Car parts are prepared, never purchased.
    BRIEFING_POWER_PARTS.forEach((part,i)=>{
      const x=67+Math.floor(i/5)*497,y=346+(i%5)*67;
      const info=getDriverPowerPartLevelInfo(draft,part.id);
      const original=getDriverPowerPartLevelInfo(originals[selected]||{},part.id);
      if(!info)return;
      label(x,y,part.label,15,'#edf5f8');
      label(x+325,y,'OWNED L'+original.original,12,'#91b7cc');
      const max=original.original||0;
      const current=info.current||0;
      const levels=[0,1,2,3].map(level=>({
        level,caption:part.id==='nosKit'
          ?(level===0?'OFF':level+' SHOT'+(level===1?'':'S'))
          :(level===0?'STOCK':'L'+level)
      }));
      levels.filter((row,i,list)=>i===0||row.level!==list[0].level).forEach((row,j)=>{
        const bx=x+34+j*97,by=y+37,enabled=row.level<=max,active=row.level===current;
        const box=add(s.add.rectangle(bx,by,83,29,active?0x237e7b:0x142a3d,
          enabled?1:.4).setStrokeStyle(1,active?0xa6ffee:0x537c96).setDepth(253));
        const txt=label(bx,by,row.caption,12,enabled?'#f6fbff':'#71838e')
          .setOrigin(.5);
        if(enabled)box.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
          drafts[selected]=setDriverPowerPartLevels(draft,{[part.id]:row.level});
          renderSetup();
        });
      });
    });
    // Manual NOS switch is available during the free preparation briefing,
    // including for sealed collectors with a factory NOS system. Nothing
    // changes in the saved garage until the player confirms GO TO GRID.
    const configured = originals[selected] || {};
    const factory = cars[selected] || {};
    const hasNos = Boolean(configured.nosInstalled) ||
      Number(configured.exhaustNosTuning?.nosKit || 0) > 0 ||
      (Number(factory.nosPower || 0) > 0 &&
        Number(factory.nosShots || factory.nosCapacitySeconds || 0) > 0);
    const nosEnabled = draft.nosEnabled !== false;
    button(345,694,555,38,hasNos?
      'NOS MASTER // '+(nosEnabled?'ON':'OFF')+'   ·   TOGGLE':
      'NOS MASTER // NO KIT INSTALLED',()=>{
      drafts[selected]={...draft,nosEnabled:!nosEnabled};
      renderSetup();
    },hasNos);
    label(65,731,'EVENT FORMAT  '+String(rules.format||'KNOCKOUT').replaceAll('_',' ')+
      '  ·  MAX 20 SEASON POINTS  ·  TOP PURSE '+money(event.prizeCash||0),
      16,'#d7c49d');
    button(247,777,338,50,'BACK TO BRIEFING',renderBriefing);
    button(785,777,370,50,'RESET UNSAVED SETUP',()=>{
      drafts[selected]=originals[selected]||{};renderSetup();
    });
    button(1304,777,394,50,canStart?'GO TO GRID // '+money(event.entryFee):
      'PASS SCRUTINEERING FIRST',()=>{
      proceedToGrid();
    },canStart);
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
  let pending=0;
  for(const [key,path] of assets)if(!s.textures.exists(key)){
    s.load.image(key,getCharacterAssetUrl(path));pending++;
  }
  const selectedModels=Object.fromEntries(roster.filter(id=>cars[id]).map(id=>[getBaseCarId(id),cars[id]]));
  pending+=preloadCarAppearanceAssets(s,selectedModels,'20261019-r598');
  for(const id of roster)if(cars[id])pending+=preloadCarWheel(s,cars[id],drafts[id]||{});
  function proceedToGrid(){
          const now=normaliseProCircuitState(s.registry.get('proCircuit'));
          const latest=s.getProDragEvents?.().find(e=>e.id===event.id&&
            e.seasonChoice===event.seasonChoice);
          const actual=s.registry.get('carStates')||{};
          if(now.seasonStatus!=='ACTIVE'||now.calendar.round!==initial.calendar.round||
            !latest||latest.seasonRules?.format!==rules.format||
            getProSeasonDriverCarError(now,selected)||
            now.activeTournament||now.activeTimedEvent||now.activeCrewEvent||
            s.registry.get('competitionState')?.active||
            !getProfessionalCarEligibility(selected,drafts[selected],rules).eligible){
            s.proError='EVENT OR SETUP CHANGED // REOPEN BRIEFING';
            close();s.renderLocation(s.activeLocationId);return;
          }
          try{
            saveProTransaction(s.registry,{
              selectedCarId:selected,
              carStates:{...actual,[selected]:drafts[selected]},
            });
          }catch(error){s.proError=error.message;close();s.renderLocation(s.activeLocationId);return;}
          close();
          onGrid?.(s.getSelectedBuild?.());
    
  }
  function renderBriefing(){
    discard();
    const phase=String(s.worldPhase||'night').toLowerCase()==='day'?'Day':'Night';
    const room='proSeasonBriefRoom'+phase;
    add(s.add.rectangle(780,420,1560,840,0x06101b,1).setDepth(250).setInteractive());
    if(s.textures.exists(room)){
      const source=s.textures.get(room).getSourceImage();
      add(s.add.image(780,420,room).setScale(Math.max(1560/source.width,840/source.height)).setDepth(251));
    }
    add(s.add.rectangle(780,420,1560,840,0x04101b,.22).setDepth(251));
    const title=String(event.label||'DRIVER EVENT').toUpperCase();
    label(48,35,'PRO SEASON // ROUND '+(initial.calendar.round+1)+' OF 8',23,'#ffffff');
    label(48,77,title,32,'#f7faff');
    label(50,124,'DRIVER EVENT  //  '+String(rules.format||'KNOCKOUT').replaceAll('_',' '),17,'#8de5f8');
    const positions=[
      {key:'proSeasonBriefDaichi',x:190,feet:732,height:510,max:280},
      {key:playerAsset?.key,x:402,feet:716,height:492,max:260},
      {key:'proSeasonBriefSayaka',x:1152,feet:739,height:495,max:275},
      {key:'proSeasonBriefHiroshi',x:1398,feet:723,height:490,max:250},
    ];
    for(const p of positions){
      if(!p.key||!s.textures.exists(p.key))continue;
      const source=s.textures.get(p.key).getSourceImage();
      const scale=Math.min(p.height/source.height,p.max/source.width);
      add(s.add.image(p.x,p.feet,p.key).setOrigin(.5,1).setScale(scale).setFlipX(true).setDepth(254));
    }
    const draft=drafts[selected]||{};
    const check=getProfessionalCarEligibility(selected,draft,rules);
    const canStart=check.eligible&&Number(s.registry.get('cash')||0)>=Number(event.entryFee||0);
    // Use the same vehicle display helper as the Open Circuit briefing.
    if(cars[selected]&&typeof s.createCarDisplay==='function'){
      try{
        ensureDerivedModularCarTextures(s,{[getBaseCarId(selected)]:cars[selected]});
        for(const part of s.createCarDisplay(cars[selected],790,502,610,253,
          getCarPaintColor(draft),null,false,draft)||[])if(part)add(part);
      }catch(error){console.warn('[Tokyo SHIFT] Season briefing car preview',error);}
    }
    const info=add(s.add.rectangle(777,203,685,105,0x071625,.87)
      .setStrokeStyle(2,0x36cce9).setDepth(258));
    label(464,161,'REGISTERED CAR // '+(cars[selected]?.shortName||selected),18,'#ffffff');
    label(464,190,spec,14,'#f2d4a5',{wrap:625});
    label(464,218,'SCRUTINEERING // '+(check.eligible?'PASSED':check.reasons.slice(0,2).join(' / ')),
      14,check.eligible?'#96eac7':'#ffb5b9',{wrap:625});
    button(187,580,238,48,'CAR SETUP',renderSetup);
    button(1120,580,228,48,'SAYAKA // ADVICE',()=>{
      renderDialogue('SAYAKA // STRATEGY',
        'Select your registered '+shortDrive(rules.drivetrain||'')+
        ' car, verify the power and NOS restrictions, then prepare your launch. '+
        'This season event awards up to 20 championship points.');
    });
    button(1394,580,225,48,'RACE BRIEFING',()=>{
      renderDialogue('HIROSHI // EVENT RULES',
        title+'\n'+spec+'\nFORMAT: '+String(rules.format||'KNOCKOUT').replaceAll('_',' ')+
        '\nENTRY: '+money(event.entryFee)+'  //  PURSE: '+money(event.prizeCash)+
        '\nSEASON POINTS: UP TO 20');
    });
    button(1068,778,244,52,'BACK TO SEASON',close);
    button(1365,778,246,52,canStart?'GO TO GRID // '+money(event.entryFee):
      'SETUP REQUIRED',proceedToGrid,canStart);
  }
  function renderDialogue(heading,body){
    renderBriefing();
    add(s.add.rectangle(780,417,750,335,0x071626,.98)
      .setStrokeStyle(3,0x48c9e9).setDepth(260));
    const header=label(440,282,heading,23,'#ffffff');header.setDepth(261);
    const copy=label(440,335,body,19,'#e3edf4',{wrap:680});copy.setDepth(261);
    button(780,526,320,48,'RETURN TO BRIEFING',renderBriefing);
  }
  if(pending){
    discard();
    add(s.add.rectangle(780,420,1560,840,0x07111d,.99).setDepth(250).setInteractive());
    label(590,407,'PREPARING PRO SEASON BRIEFING',19,'#ffffff');
    s.load.once('complete',()=>{
      if(closed||!s.sys?.isActive?.())return;
      renderBriefing();
    });
    s.load.start();
  }else renderBriefing();
  return true;
}
