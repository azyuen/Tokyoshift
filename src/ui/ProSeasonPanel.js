import { createProvisionalChampionship, championshipStandings, getChampionshipKnockoutHeat, getChampionshipCrewHeat, getChampionshipFourWideHeat } from '../data/tokyoChampionship.js';
import { playMangaCutscene } from './MangaCutscene.js';
import { CREW_SERIES, PRO_SEASON_LENGTH, OPEN_CIRCUIT_CREW_FEE, OPEN_CIRCUIT_TROPHY_FEE, isOpenCircuitAvailable, getOpenCircuitTrophy, getOpenCircuitCrewFormat, startProfessionalSeason, forfeitProfessionalSeason, getProfessionalRoundEvents, getProQualification, getSeasonStandings, getCrewSeriesUnits, crewSeriesEligibility, registerCrewSeries, forfeitCrewSeries, useProCrewAdvice, getProCrewAdviceAvailability, getCrewFixture, settleCrewSeriesFixture, getCrewSeriesTable, nextProfessionalSeason, assignCrewSeriesCar, preparePlayerCrewFixture, getPlayerCrewHeat } from '../data/proSeason.js';
import { normaliseProCircuitState, getProCircuitAccess, getProCircuitDriverSeeds, getProCircuitTeamSeeds, getProPrizeBonusPercent } from '../data/proCircuit.js';
import { saveProTransaction } from '../state/GameState.js';
import { getOpenCircuitRotation } from '../environment/WorldClock.js';
import { cars } from '../data/cars.js';
import { characters } from '../data/characters.js';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js';
import { showProCrewHeatSelection, getProCrewHeatAdvice } from './ProCrewBattleLineup.js';
import { showCompactProForfeit } from './ProBriefingChrome.js';
import { showProVictoryResults } from './ProVictoryResults.js';
const FONT='"Rajdhani", sans-serif';
// Set final sizes after the global 1.6x phone-text factory pass.
function uiText(s,x,y,value,size,style={}) {
  return s.add.text(x,y,value,{fontFamily:FONT,fontSize:size+'px',fontStyle:'600',color:'#e5e0df',...style}).setFontSize(size);
}
const cash=n=>'¥'+Number(n||0).toLocaleString('en-US');
const circuit=s=>normaliseProCircuitState(s.registry.get('proCircuit'));
const redraw=s=>s.renderLocation(s.activeLocationId);
function commit(s,changes) {try{saveProTransaction(s.registry,changes);s.proError=null;return true;}catch(e){s.proError=e.message;redraw(s);return false;}}
function text(s,x,y,value,size=16,extra={}) {return s.addContent(uiText(s,x,y,value,size,extra).setDepth(40));}
function button(s,x,y,w,label,action,enabled=true) {
  const b=s.addContent(s.add.rectangle(x,y,w,46,enabled?0x551d25:0x211e22).setStrokeStyle(2,enabled?0xda505a:0x635d60).setDepth(39));
  const labelNode=text(s,x,y,label,17).setOrigin(.5);
  if(labelNode.width>w-24)labelNode.setScale((w-24)/labelNode.width);
  if(enabled)b.setInteractive({useHandCursor:true}).on('pointerdown',action);
}
// R593: the driver, crew and team-trophy right panels all share ONE
// sidebar typography/entry-button specification. Keep these dimensions in
// sync with SIDE.y + 624 (Pro Season) and the navigation action below it.
export function drawProEventSidebarTitle(s,side,title) {
  return s.addContent(s.add.text(side.x+20,side.y+207,title,{
    fontFamily:'"Silkscreen", monospace',fontSize:'11px',color:'#f8f3f2',
    wordWrap:{width:side.w-38},
  }).setDepth(34));
}
export function drawProEventSidebarDetails(s,side,lines) {
  const concise=lines.filter(value=>!/^\\s*(ORIGINAL )?ENTRY\\s+/i.test(String(value)));
  return s.addContent(s.add.text(side.x+20,side.y+250,concise.join('\n'),{
    fontFamily:'"Rajdhani", monospace',fontSize:'11px',fontStyle:'700',
    color:'#c4bec0',lineSpacing:5,wordWrap:{width:side.w-37},
  }).setDepth(34));
}
export function drawProEventSidebarStatus(s,side,label,enabled) {
  if (!label) return null;
  return s.addContent(s.add.text(side.x+20,side.y+490,label,{
    fontFamily:'"Silkscreen", monospace',fontSize:'8px',
    color:enabled?'#f1e7e6':'#ea777d',wordWrap:{width:side.w-40},
  }).setDepth(34));
}
export const proEventEntryLabel=fee=>'ENTER EVENT BRIEFING';
export function drawProEventSidebarEntry(s,side,label,action,enabled=true) {
  const x=side.x+side.w/2,y=side.y+574,w=side.w-36;
  const bg=s.addContent(s.add.rectangle(x,y,w,40,enabled?0x551d25:0x201d20,1)
    .setStrokeStyle(2,enabled?0xed515c:0x575154,1).setDepth(33));
  const caption=s.addContent(s.add.text(x,y,label,{
    fontFamily:'"Silkscreen", monospace',fontSize:'8px',
    color:enabled?'#fff6f5':'#938a8d',
  }).setOrigin(.5).setDepth(34));
  if(caption.width>w-24)caption.setScale((w-24)/caption.width);
  if(enabled)bg.setInteractive({useHandCursor:true}).on('pointerdown',action);
  return bg;
}

export function drawSeasonHeader(s,stage) {
  const c=circuit(s),q=getProQualification(c);
  const driver=getProCircuitDriverSeeds(c).find(r=>r.id==='player:driver');
  const team=getProCircuitTeamSeeds(c).find(r=>r.id==='player:team');
  const x=stage.x+22,y=stage.y+18,w=355;
  const openCircuit=isOpenCircuitAvailable(c);
  // Rank and sponsorship remain visible through both Open Circuit and Season.
  // Season controls remain beside the main race entries on the right.
  const height=openCircuit?169:c.activeChampionship?236:213;
  const panel=s.addContent(s.add.rectangle(x-10,y-8,w+20,height,0x11151c,.88)
    .setOrigin(0,0).setStrokeStyle(1,0x63808a,.8).setDepth(28));
  if(openCircuit){
    // Open Circuit is a persistent professional ladder, not a season table.
    // Show both rankings and independent, cash-only appearance commissions.
    text(s,x,y,'PRO RANKINGS',19,{color:'#f5e9e5'});
    text(s,x+w-2,y+5,'OPEN CIRCUIT',12,{color:'#aab8c1'}).setOrigin(1,0);
    s.addContent(s.add.rectangle(x+w/2,y+42,1,67,0x51606b,.85).setDepth(40));
    for(const item of [
      {x,record:driver,label:'DRIVER'},
      {x:x+185,record:team,label:'CREW'},
    ]){
      text(s,item.x,y+36,item.label+' RANK',15,{color:'#bbc4ce'});
      text(s,item.x,y+57,'#'+item.record.seed,29,{color:'#fff2ed'});
      text(s,item.x,y+96,'+'+getProPrizeBonusPercent(item.record.seed)+'% WINNINGS BONUS',14,{color:'#ecc88d'});
    }
    const expandY=y+139;
    const expand=s.addContent(s.add.rectangle(x+w/2,expandY,w-10,34,0x40242a,.96)
      .setStrokeStyle(1,0xa46b6d,.9).setDepth(40)
      .setInteractive({useHandCursor:true}));
    text(s,x+w/2,expandY,'VIEW ALL PROFESSIONAL RANKINGS  ▼',15,{color:'#f5e9e5'}).setOrigin(.5);
    expand.on('pointerdown',()=>showProRankings(s));
    if(s.proError)text(s,stage.x+22,stage.y+460,s.proError,14,{color:'#ef939b'});
    return;
  }
  text(s,x,y,`SEASON ${c.season}  //  ROUND ${Math.min(8,c.calendar.round+1)} OF 8`,20,{color:'#f5e9e5'})
    .setInteractive({useHandCursor:true}).on('pointerdown',()=>showSeasonRecords(s,c.calendar.round>=8));
  const bar=(yy,label,score,goal,seed,color)=>{
    text(s,x,yy,`${label} #${seed}   +${getProPrizeBonusPercent(seed)}% SPONSOR   ${score}/${goal} PTS`,16,
      {color:'#f2e7e3'});
    s.addContent(s.add.rectangle(x,yy+29,w-10,10,0x38343c).setOrigin(0,0).setDepth(39));
    s.addContent(s.add.rectangle(x,yy+29,(w-10)*Math.min(1,score/goal),10,color).setOrigin(0,0).setDepth(40));
  };
  bar(y+39,'DRIVER',q.driver,q.driverRequired,driver.seed,0x3993ad);
  bar(y+92,'CREW',q.crew,q.crewRequired,team.seed,0xb7844c);
  const expandY=y+(c.activeChampionship?205:179);
  const expand=s.addContent(s.add.rectangle(x+w/2,expandY,w-10,32,0x40242a,.96)
    .setStrokeStyle(1,0xa46b6d,.9).setDepth(40)
    .setInteractive({useHandCursor:true}));
  text(s,x+w/2,expandY,'VIEW ALL PROFESSIONAL RANKINGS  ▼',15,{color:'#f5e9e5'}).setOrigin(.5);
  expand.on('pointerdown',()=>showProRankings(s));
  if(c.activeChampionship){
    const championship=text(s,x,y+148,'TOKYO CHAMPIONSHIP // '+c.activeChampionship.stage,16,{color:'#f3cf8d'});
    championship.setInteractive({useHandCursor:true}).on('pointerdown',()=>showTokyoChampionship(s));
  }
  if(s.proError)text(s,stage.x+22,stage.y+460,s.proError,14,{color:'#ef939b',wordWrap:{width:400}});
}
export function drawCrewSidebar(s,event,side) {
  const c=circuit(s),t=c.activeCrewEvent,f=getCrewFixture(c),short=t?!!t.short:!event.trophyId;
  if(!event.team&&!event.seasonEnd)return false;
  if(event.seasonEnd&&!t){
    text(s,side.x+20,side.y+207,'SEASON COMPLETE',21);
    text(s,side.x+20,side.y+255,`Eight official events completed.\n\nQualification: ${getProQualification(c).qualified?'ACHIEVED':'NOT YET'}\n\nDriver standing: #${getSeasonStandings(c).findIndex(r=>r.id==='player:driver')+1}\nTeam standing: #${getSeasonStandings(c,'TEAM').findIndex(r=>r.id==='player:team')+1}\n\nRatings, records and achievements carry over.\nSeason points reset when you continue.`,16,{lineSpacing:5,wordWrap:{width:side.w-40}});
    button(s,side.x+side.w/2,side.y+574,side.w-36,'VIEW RESULTS / NEXT SEASON',()=>showSeasonRecords(s,true));return true;
  }
  const access=getProCircuitAccess(s.registry);
  const open=isOpenCircuitAvailable(c);
  const rotation=getOpenCircuitRotation();
  const trophy=event.trophyId?getOpenCircuitTrophy(c,rotation):null;
  // Use the format of the selected card; never change it midway through drawing
  // if a day/night offer happens to rotate at a five-minute boundary.
  const crewFormat=f?.format||t?.format||event.format||(open?getOpenCircuitCrewFormat(rotation,c.openCircuitTick):
    getProfessionalRoundEvents(c.calendar.round).crew.format);
  const fee=open?(event.trophyId?trophy?.entryFee||OPEN_CIRCUIT_TROPHY_FEE:OPEN_CIRCUIT_CREW_FEE):CREW_SERIES.entryFee;
  const formatSupported=['DUEL','RELAY','TECHNICAL','FOUR_WIDE'].includes(crewFormat);
  const canEnter=formatSupported&&access.unlocked&&!c.activeCrewEvent&&!c.activeTournament&&!c.activeTimedEvent&&
    !(c.activeChampionship&&!c.activeChampionship.completed)&&!s.registry.get('competitionState')?.active&&
    (open||c.seasonStatus==='ACTIVE'&&c.calendar.round<8)&&
    (!event.trophyId||trophy?.available&&trophy.id===event.trophyId)&&
    Number(s.registry.get('cash')||0)>=fee;
  // Match the right-panel header typography of individual driver events.
  const crewTitle=t?.trophyId||event.trophyId?event.label:
    short?((t?.format||crewFormat)==='TECHNICAL'?'CREW TECHNICAL':
      (t?.format||crewFormat)==='RELAY'?'CREW RELAY':'CREW CLUB SPRINT'):CREW_SERIES.label;
  drawProEventSidebarTitle(s,side,crewTitle);
  const formatBrief=crewFormat==='FOUR_WIDE'?'3 FOUR-WIDE HEATS':
    crewFormat==='RELAY'?'3-LEG TEAM RELAY':'3 HEAD-TO-HEAD HEATS';
  const technicalBrief=[
    'TEST OF CONSISTENCY',
    'DRIVE THREE DIFFERENT CARS',
    'SMALLEST TIME DIFFERENCE WINS',
  ];
  const lines=event.trophyId&&!short?[
    '3 FIXTURES // 9 HEATS',
    event.trophyId==='triDrive'?'REQUIRES FWD + RWD + AWD':
      'CHOOSE THREE DRIVERS',
    'ENTRY  '+cash(t?.entryFee||fee),
    'CHAMPION  '+cash(t?.prizes?.[0]||trophy?.prizeCash||0),
  ]:short?[
    ...(crewFormat==='TECHNICAL'?technicalBrief:[formatBrief,'CHOOSE THREE DRIVERS']),
    'ENTRY  '+cash(t?.entryFee||fee),
    '3 WINS  '+cash(open?70000:210000),
    '2 WINS  '+cash(open?30000:90000),
    '1 WIN  '+cash(open?15000:40000),
  ]:[
    '3 FIXTURES // 9 HEATS',
    'CHOOSE THREE DRIVERS',
    'ENTRY  '+cash(CREW_SERIES.entryFee),
    '1ST  ¥210,000 // 2ND  ¥90,000',
  ];
  // Opposing team and fixture number are revealed in the battle room, not here.
  drawProEventSidebarDetails(s,side,lines);
  const reason=t?(f?'':'INVALID SAVED EVENT'):
    event.trophyId&&trophy?.eventsRemaining?'NEXT INVITATION // '+trophy.eventsRemaining+' EVENTS':
    !formatSupported?'FORMAT UNAVAILABLE':
    !canEnter?'CHECK ELIGIBILITY / CASH':'';
  drawProEventSidebarStatus(s,side,reason,t?!!f:canEnter);
  drawProEventSidebarEntry(s,side,
    t?'RESUME EVENT BRIEFING':canEnter?proEventEntryLabel(fee):'NOT ELIGIBLE',
    ()=>t?showCrewFixture(s):showCrewRegistration(s,[],{},event.trophyId||null),
    t?!!f:canEnter);
  return true;
}
function overlay(s,title) {
  if(s._proOverlayClose)s._proOverlayClose();
  const nodes=[];let closed=false;const add=o=>{nodes.push(o);return o;};
  add(s.add.rectangle(780,420,1560,840,0x09080b,.98).setDepth(200).setInteractive());
  add(uiText(s,90,62,title,30,{fontStyle:'700',color:'#fff4f2'}).setDepth(201));
  const label=(x,y,v,size=20)=>add(uiText(s,x,y,v,size,{color:'#e8e1df',wordWrap:{width:1320}}).setDepth(202));
  const btn=(x,y,w,v,fn)=>{const b=add(s.add.rectangle(x,y,w,48,0x5d1d27).setStrokeStyle(2,0xd8515b).setDepth(202).setInteractive({useHandCursor:true}));const caption=label(x,y,v,18).setOrigin(.5);if(caption.width>w-24)caption.setScale((w-24)/caption.width);b.on('pointerdown',()=>{if(!closed)fn();});return b;};
  const close=()=>{if(closed)return;closed=true;nodes.forEach(n=>n.destroy());s._proOverlayClose=null;s.events.off('shutdown',close);};s._proOverlayClose=close;
  s.events.once('shutdown',close);
  return {add,label,btn,close};
}
// Entry is a preview. Cash, a persistent crew event and any Sayaka advice
// are saved together only when the player taps GO TO GRID in the briefing.
function previewSource(s,circuitState){
  return {get:key=>key==='proCircuit'?circuitState:s.registry.get(key)};
}
function showUnpaidCrewBriefing(s,pending,selected=[]){
  const source=previewSource(s,pending.circuit);
  const f=getCrewFixture(pending.circuit),t=pending.circuit.activeCrewEvent;
  const units=getCrewSeriesUnits(s.registry,pending.assignments).filter(u=>t.squadIds.includes(u.id));
  if(!f){s.proError='CREW EVENT OFFER CHANGED';s._pendingCrewRegistration=null;redraw(s);return;}
  showProCrewHeatSelection(s,{
    event:t,fixture:f,units,selected,unpaid:true,entryFee:t.entryFee,
    adviceStatus:getProCrewAdviceAvailability(source),
    advice:t.adviceText||getProCrewHeatAdvice(f,units),
    onCancel:()=>{s._pendingCrewRegistration=null;s.proError=null;redraw(s);},
    onAdvice:ids=>{
      const out=useProCrewAdvice(source,t.id);
      if(out.error){s.proError=out.error;showUnpaidCrewBriefing(s,pending,ids);return;}
      const adviceText=getProCrewHeatAdvice(f,units);
      pending.circuit=out.circuit;
      pending.circuit.activeCrewEvent={
        ...out.circuit.activeCrewEvent,adviceText,
      };
      showUnpaidCrewBriefing(s,pending,ids);
    },
    onConfirm:ids=>{
      if(s.registry.get('competitionState')?.active||
         circuit(s).activeCrewEvent||circuit(s).activeTournament||
         circuit(s).activeTimedEvent){s.proError='FINISH ACTIVE EVENT FIRST';return;}
      // Re-register against the saved profile at the actual payment moment.
      const verified=registerCrewSeries(s.registry,pending.squadIds,
        pending.assignments,pending.trophyId,getOpenCircuitRotation());
      if(verified.error){s.proError=verified.error;return;}
      const savedEvent=verified.circuit.activeCrewEvent;
      if(savedEvent.id!==pending.circuit.activeCrewEvent.id||
         savedEvent.format!==pending.circuit.activeCrewEvent.format||
         savedEvent.entryFee!==pending.circuit.activeCrewEvent.entryFee){
        s.proError='EVENT OFFER CHANGED — CANCEL AND REOPEN';
        return;
      }
      const merged={...savedEvent,
        adviceUsed:Boolean(pending.circuit.activeCrewEvent.adviceUsed),
        adviceText:pending.circuit.activeCrewEvent.adviceText||null,
        lockedLineup:[...ids],
      };
      const staged={...verified.circuit,activeCrewEvent:merged,
        crewAdviceCooldownUntil:pending.circuit.crewAdviceCooldownUntil};
      const prepared=preparePlayerCrewFixture(previewSource(s,staged),ids,
        getCrewFixture(staged)?.id);
      if(prepared.error){s.proError=prepared.error;return;}
      const heat=getPlayerCrewHeat(prepared.circuit);
      if(!heat||!(s.registry.get('ownedCarIds')||[]).includes(heat.carId)){
        s.proError='REGISTERED CREW CAR UNAVAILABLE';return;
      }
      if(!commit(s,{proCircuit:prepared.circuit,cash:verified.cash}))return;
      s._pendingCrewRegistration=null;
      s._proOverlayClose?.();
      s.scene.start('FourLaneTestScene',{mode:'PRO_CREW'});
    },
  });
}
export function showCrewRegistration(s,_selection=[],assignments={},trophyId=null) {
  if(circuit(s).activeCrewEvent)return showCrewFixture(s);
  const units=getCrewSeriesUnits(s.registry,assignments);
  const squadIds=units.map(u=>u.id);
  const out=registerCrewSeries(s.registry,squadIds,assignments,
    trophyId,getOpenCircuitRotation());
  if(out.error){s.proError=out.error;redraw(s);return;}
  const pending={circuit:out.circuit,squadIds,assignments,trophyId};
  s._pendingCrewRegistration=pending;
  showUnpaidCrewBriefing(s,pending,[]);
}

export function confirmCrewForfeit(s) {
  const event=circuit(s).activeCrewEvent;
  if(!event)return;
  return showCompactProForfeit(s,{
    title:'FORFEIT CREW EVENT?',
    message:'The entry fee is not refunded. Remaining heats are lost, and this competition cannot be resumed.',
    onConfirm:()=>{
      const out=forfeitCrewSeries(s.registry,event.id);
      if(out.error){s.proError=out.error;return;}
      s._proOverlayClose?.();
      if(commit(s,{proCircuit:out.circuit}))redraw(s);
    },
  });
}

export function showCrewFixture(s,selection=null) {
  const c=circuit(s),f=getCrewFixture(c),t=c.activeCrewEvent;if(!f){s.proError='SAVED CREW FIXTURE UNAVAILABLE';redraw(s);return;}
  const currentFormat=f.format;
  const units=getCrewSeriesUnits(s.registry,t.assignments).filter(u=>t.squadIds.includes(u.id));
  const chosen=selection||t.squadIds.slice(0,3);
  if(!f.prepared||f.prepared.revealed<3){
    const lineup=t.lockedLineup||f.prepared?.lineup||null;
    const lock=Boolean(lineup);
    const ids=selection||lineup||[];
    const eventAdvice=t.adviceText||getProCrewHeatAdvice(f,units);
    return showProCrewHeatSelection(s,{
      event:t,fixture:f,units,selected:ids,locked:lock,
      adviceStatus:{
        ...getProCrewAdviceAvailability(s.registry),
        // Existing consultation can always be REVIEWED. New consultations
        // are available only in the very first heat of an event.
        remaining:!t.adviceUsed&&(f.round>0||f.prepared?.revealed>0)?
          Math.max(1,getProCrewAdviceAvailability(s.registry).remaining):
          getProCrewAdviceAvailability(s.registry).remaining,
      },
      advice:eventAdvice,
      onForfeit:()=>confirmCrewForfeit(s),
      onAdvice:lineupIds=>{
        if(f.round>0||f.prepared?.revealed>0){
          s.proError='SAYAKA CONSULTATION IS ONLY AVAILABLE BEFORE HEAT ONE';
          return;
        }
        const out=useProCrewAdvice(s.registry,t.id);
        if(out.error){s.proError=out.error;showCrewFixture(s,lineupIds);return;}
        out.circuit.activeCrewEvent={
          ...out.circuit.activeCrewEvent,adviceText:eventAdvice,
        };
        if(commit(s,{proCircuit:out.circuit}))showCrewFixture(s,lineupIds);
      },
      onConfirm:lineupIds=>{
        const current=circuit(s),fixture=getCrewFixture(current),active=current.activeCrewEvent;
        if(!fixture||active?.id!==t.id||fixture.id!==f.id){
          s.proError='FIXTURE CHANGED — REOPEN BRIEFING';return;
        }
        if(active.lockedLineup&&
          JSON.stringify(active.lockedLineup)!==JSON.stringify(lineupIds)){
          s.proError='REGISTERED LINEUP IS LOCKED';return;
        }
        const out=preparePlayerCrewFixture(s.registry,lineupIds,fixture.id);
        if(out.error){s.proError=out.error;return;}
        if(!active.lockedLineup)out.circuit.activeCrewEvent={
          ...out.circuit.activeCrewEvent,lockedLineup:[...lineupIds],
        };
        const heat=getPlayerCrewHeat(out.circuit);
        if(!heat||!(s.registry.get('ownedCarIds')||[]).includes(heat.carId)){
          s.proError='REGISTERED CREW CAR UNAVAILABLE';return;
        }
        if(commit(s,{proCircuit:out.circuit}))s.scene.start('FourLaneTestScene',{mode:'PRO_CREW'});
      },
    });
  } else {
    // The third player-driven heat is already durably saved. Award once and
    // open the definitive results page; no second official-confirmation modal.
    if(f.prepared?.revealed===3){
      const snapshot={heats:f.prepared.heats,crewIds:f.prepared.lineup,
        carIds:f.prepared.heats.map(h=>h.carId),
        opponent:f.opponent?.name,format:currentFormat,
        eventLabel:t.label,openCircuit:Boolean(t.openCircuit)};
      const result=settleCrewSeriesFixture(c,f.id);
      if(['COMPLETE','ADVANCED'].includes(result.status)){
        if(commit(s,{proCircuit:result.circuit,
          cash:Number(s.registry.get('cash')||0)+result.cashPrize}))
          showCrewResult(s,result,snapshot);
        return;
      }
    }
    const o=overlay(s,t.trophyId?`${t.label} // FIXTURE ${t.round+1}/3`:
      t.short?(currentFormat==='FOUR_WIDE'?'CREW FOUR-WIDE // THREE HEATS':currentFormat==='TECHNICAL'?'CREW TECHNICAL // THREE RUNS':currentFormat==='RELAY'?'CREW RELAY // THREE LEGS':'CREW CLUB SPRINT // THREE HEATS'):
      `CREW CLUB SERIES // FIXTURE ${t.round+1}/3`);
    o.label(90,115,'YOUR CREW vs '+f.opponent.name+(currentFormat==='FOUR_WIDE'?' · THREE FOUR-LANE HEATS · AGGREGATE PLACING POINTS':currentFormat==='TECHNICAL'?' · SMALLEST THREE-RUN SPREAD WINS':currentFormat==='RELAY'?' · LOWEST TOTAL TIME WINS':' · TWO HEAT WINS TAKE THE FIXTURE'),23);
    const prepared=f.prepared;
    o.label(90,166,'YOU DRIVE EACH CREW CAR · LIVE CLUTCH / THROTTLE / SHIFTING · EACH FINISH IS SAVED',18);
    prepared.heats.forEach((h,i)=>{
      o.label(120,241+i*90,`HEAT ${i+1} · ${h.name} / ${cars[h.carId]?.shortName}`,22);
      o.label(810,241+i*90,i<prepared.revealed?`${h.ownStatus&&h.ownStatus!=='FINISHED'?h.ownStatus:h.ownSeconds.toFixed(3)+'s'} vs ${h.opponentStatus&&h.opponentStatus!=='FINISHED'?h.opponentStatus:h.opponentSeconds.toFixed(3)+'s'} // ${t.format==='FOUR_WIDE'?'PLACE '+h.place+' / 4':h.tied?'DRAW':h.won?'WIN':'LOSS'}`:'AWAITING HEAT',24);
    });
    if(prepared.revealed<3){
      o.btn(990,677,620,'DRIVE HEAT '+(prepared.revealed+1)+' / 3',()=>{
        const out=preparePlayerCrewFixture(s.registry,prepared.lineup,f.id);
        if(out.error){o.label(90,570,out.error,18);return;}
        const heat=getPlayerCrewHeat(out.circuit);
        if(!heat||(s.registry.get('ownedCarIds')||[]).includes(heat.carId)===false){o.label(90,570,'REGISTERED CREW CAR UNAVAILABLE',18);return;}
        o.close();
        if(commit(s,{proCircuit:out.circuit}))s.scene.start('FourLaneTestScene',{mode:'PRO_CREW'});
      });
    } else {
      const wins=prepared.heats.filter(h=>h.won).length;
      const technical=currentFormat==='TECHNICAL';
      const playerFinishedTech=prepared.heats.every(h=>h.ownStatus==='FINISHED'&&Number.isFinite(h.ownSeconds)&&h.ownSeconds>0);
      const opponentFinishedTech=prepared.heats.every(h=>h.opponentStatus==='FINISHED'&&Number.isFinite(h.opponentSeconds)&&h.opponentSeconds>0);
      const ownSpread=playerFinishedTech?Math.max(...prepared.heats.map(h=>h.ownSeconds))-Math.min(...prepared.heats.map(h=>h.ownSeconds)):null;
      const opponentSpread=opponentFinishedTech?Math.max(...prepared.heats.map(h=>h.opponentSeconds))-Math.min(...prepared.heats.map(h=>h.opponentSeconds)):null;
      const technicalWon=playerFinishedTech&&(!opponentFinishedTech||ownSpread<opponentSpread-0.000001);
      const relay=currentFormat==='RELAY';
      const ownTotal=prepared.heats.reduce((sum,h)=>sum+h.ownSeconds,0);
      const opponentTotal=prepared.heats.reduce((sum,h)=>sum+h.opponentSeconds,0);
      const playerFinished=prepared.heats.every(h=>h.ownStatus==='FINISHED'&&h.ownSeconds>0);
      const opponentFinished=prepared.heats.every(h=>h.opponentStatus==='FINISHED'&&h.opponentSeconds>0);
      const relayWon=playerFinished&&(!opponentFinished||ownTotal<opponentTotal-0.000001);
      const fourWide=currentFormat==='FOUR_WIDE';
      const fourWidePoints=prepared.heats.reduce((sum,h)=>sum+(h.place?4-h.place:0),0);
      o.label(130,568,fourWide?'FOUR-WIDE TOTAL '+fourWidePoints+' / 9 POINTS · '+(fourWidePoints>=8?'TOP TIER':fourWidePoints>=5?'SECOND TIER':fourWidePoints>=2?'THIRD TIER':'FOURTH TIER')
        :technical
        ? 'PRECISION '+(technicalWon?'VICTORY':'DEFEAT')+' // '+(ownSpread===null?'DNF':ownSpread.toFixed(3)+'s')+' vs '+(opponentSpread===null?'DNF':opponentSpread.toFixed(3)+'s')
        : relay
        ? 'RELAY '+(relayWon?'VICTORY':'DEFEAT')+' // '+(playerFinished?ownTotal.toFixed(3)+'s':'DNF')+' vs '+(opponentFinished?opponentTotal.toFixed(3)+'s':'DNF')
        : `FIXTURE ${wins>=2?'VICTORY':'DEFEAT'} // ${wins} – ${3-wins}`,36);
      o.btn(1070,706,470,'CONFIRM OFFICIAL RESULT',()=>{
        const out=settleCrewSeriesFixture(circuit(s),f.id);if(!['ADVANCED','COMPLETE'].includes(out.status))return;
        o.close();if(commit(s,{proCircuit:out.circuit,cash:Number(s.registry.get('cash')||0)+out.cashPrize}))showCrewResult(s,out);
      });
    }
    o.btn(350,779,450,'FORFEIT EVENT',()=>confirmCrewForfeit(s));
  }
}
function showCrewResult(s,out,round={}){
  const summary=out.summary||{};
  // A second-tier four-wide placing is not a first-place trophy victory.
  const won=out.status==='ADVANCED'?out.wins>=2:summary.placing===1;
  showProVictoryResults(s,{
    kind:'crew',winner:won,
    eventName:summary.label||round.eventLabel||'CREW EVENT',
    opponent:round.opponent||'PRO CIRCUIT',
    crewIds:round.crewIds||[],
    carIds:round.carIds||round.heats?.map(h=>h.carId)||[],
    heats:round.heats||[],
    wins:summary.heatWins??out.wins,rounds:3,
    fourWidePoints:round.format==='FOUR_WIDE'?summary.fourWidePoints:undefined,
    cashPrize:out.cashPrize,sponsorBonus:summary.sponsorBonus||0,
    sponsorPercent:summary.sponsorPercent||0,points:summary.points||0,
    rankBefore:summary.rankBefore,rankAfter:summary.rankAfter,
    openCircuit:round.openCircuit??summary.openCircuit,
    statusLabel:out.status==='ADVANCED'?'NEXT FIXTURE READY':
      out.circuit?.calendar?.round>=8?'SEASON COMPLETE':'EVENT RECORDED',
    nextLabel:out.status==='ADVANCED'?'NEXT FIXTURE':'CONTINUE',
    onContinue:()=>out.status==='ADVANCED'?showCrewFixture(s):redraw(s),
  });
}

// Expand the compact Open Circuit ladder into a complete persistent driver
// and crew leaderboard.  Season points intentionally do not affect its order.
export function showProRankings(s) {
  const c=circuit(s),o=overlay(s,'PRO RANKINGS // OPEN CIRCUIT');
  o.label(90,105,'CAREER RATING · SPONSOR BONUS ON OPEN CIRCUIT & PRO SEASON CASH PRIZES',20)
    .setColor('#b8c7cf');
  const columns=[
    {x:90,title:'DRIVER RANKINGS',rows:getProCircuitDriverSeeds(c),player:'player:driver'},
    {x:820,title:'CREW RANKINGS',rows:getProCircuitTeamSeeds(c),player:'player:team'},
  ];
  columns.forEach(({x,title,rows,player})=>{
    o.label(x,147,title+'  //  '+rows.length+' ENTRANTS',23).setColor('#f7e6e2');
    rows.forEach((entry,i)=>{
      const y=185+i*23;
      const mine=entry.id===player;
      if(mine)o.add(s.add.rectangle(x+310,y+10,642,22,0x45252c,.9)
        .setStrokeStyle(1,0x95646d,.65).setDepth(201));
      const display=mine?'YOU':entry.name||characters[entry.characterId]?.name||entry.id;
      const style={color:mine?'#ffe4a9':i<3?'#f5f0ed':'#c4c9cf'};
      o.add(uiText(s,x,y,'#'+entry.seed,17,style).setDepth(203));
      o.add(uiText(s,x+58,y,String(display).slice(0,25),17,style).setDepth(203));
      o.add(uiText(s,x+433,y,entry.rating+' PT',16,{color:'#9fb0bc'}).setDepth(203));
      o.add(uiText(s,x+548,y,'+'+getProPrizeBonusPercent(entry.seed)+'%',17,
        {color:mine?'#ffe4a9':'#ddb985'}).setDepth(203));
    });
  });
  o.btn(780,786,395,'CLOSE RANKINGS',o.close);
}

export function showSeasonRecords(s,complete=false) {
  const c=circuit(s),o=overlay(s,`SEASON ${c.season} // ${complete?'FINAL STANDINGS':'PROFESSIONAL RECORD'}`);
  for(const [kind,x] of [['DRIVER',90],['TEAM',810]]) {
    o.label(x,125,kind+' SEASON POINTS',25);
    const rows=getSeasonStandings(c,kind),player=kind==='TEAM'?'player:team':'player:driver';
    rows.slice(0,6).forEach((r,i)=>o.label(x,182+i*48,`${i+1}. ${r.id===player?'YOU':r.name||characters[r.characterId]?.name||r.id}  ${r.seasonPoints}`,20));
    const mine=rows.find(r=>r.id===player);o.label(x,487,`YOUR STANDING #${rows.indexOf(mine)+1} · ${mine.seasonPoints} PTS`,22);
  }
  const q=getProQualification(c);o.label(90,533,`TOKYO QUALIFICATION: DRIVER ${q.driver}/${q.driverRequired} · CREW ${q.crew}/${q.crewRequired} · ${q.qualified?'QUALIFIED':'NOT YET'}`,20);
  const outlook=q.qualified?'TOKYO CHAMPIONSHIP QUALIFIED'
    :!q.qualificationPossible?'QUALIFICATION NO LONGER POSSIBLE THIS SEASON'
    :`MINIMUM REMAINING ENTRIES: ${q.driverEventsNeeded} DRIVER + ${q.crewEventsNeeded} CREW · ${q.roundsRemaining} ROUNDS LEFT`;
  o.label(90,560,outlook,19);
  o.label(90,595,'EVENT HISTORY: '+(c.calendar.history.map(h=>h.label+' #'+h.placing).join(' / ')||'No completed events yet.'),18);
  const last=c.calendar.archives.at(-1);if(last)o.label(90,642,`PREVIOUS SEASON ${last.season}: DRIVER #${last.drivers.findIndex(r=>r.id==='player:driver')+1} · CREW #${last.teams.findIndex(r=>r.id==='player:team')+1}`,18);
  o.btn(310,758,390,'RETURN',o.close);
  if(complete && (q.qualified || c.activeChampionship))o.btn(1090,696,600,c.activeChampionship?'VIEW TOKYO CHAMPIONSHIP':'ENTER TOKYO CHAMPIONSHIP',()=>{
    if(!c.activeChampionship){const result=createProvisionalChampionship(c);if(result.error){o.label(90,690,result.error,18);return;}const next={...c,activeChampionship:result.championship};if(!commit(s,{proCircuit:next}))return;}
    o.close();showTokyoChampionship(s);
  });
  if(complete&&q.qualified&&!c.activeChampionship?.completed){
    o.label(760,748,'COMPLETE THE CHAMPIONSHIP OR WITHDRAW FROM THE SEASON',16);
    o.btn(1090,620,600,'WITHDRAW / FORFEIT SEASON',()=>{o.close();showProSeasonWithdrawal(s);});
  }
  if(complete&&(!q.qualified||c.activeChampionship?.completed))o.btn(1100,758,570,'RETURN TO OPEN CIRCUIT',()=>{if(s.registry.get('competitionState')?.active)return;const out=nextProfessionalSeason(circuit(s));if(out.circuit){o.close();if(commit(s,{proCircuit:out.circuit}))redraw(s);}});
}

/** Championship lobby: each stage launches the live race scene and saves after every heat. */
export function showTokyoChampionship(s) {
  const c=circuit(s),state=c.activeChampionship;
  if(!state){showSeasonRecords(s,c.calendar.round>=8);return;}
  const o=overlay(s,'TOKYO CHAMPIONSHIP // PROVISIONAL 16');
  o.label(90,110,'STAGE '+state.stage+' · SEASON '+state.season+' · '+(state.completed?'FINAL RESULTS':'CHAMPIONSHIP IN PROGRESS'),23);
  const rows=championshipStandings(state);
  rows.forEach((r,i)=>{
    const x=i<8?90:810,y=178+(i%8)*60;
    o.label(x,y,(i+1)+'. '+(r.id==='player:driver'?'YOU':r.name)+'  '+r.total+' PTS',20);
  });
  const heat=state.stage==='KNOCKOUT'?getChampionshipKnockoutHeat(state):
    state.stage==='CREW'?getChampionshipCrewHeat(state):
    state.stage==='FOUR_WIDE'?getChampionshipFourWideHeat(state):null;
  o.label(90,690,state.completed?'CHAMPION: '+(rows[0]?.name||'UNKNOWN'):
    heat?'NEXT: '+(state.stage==='KNOCKOUT'?'KNOCKOUT ROUND '+(heat.round+1)+' vs '+heat.opponent?.name:
      state.stage==='CREW'?'CREW HEAT '+(heat.index+1)+' vs '+heat.opponent?.name:
      'FOUR-LANE '+['QUALIFIER','SEMIFINAL','FINAL'][heat.round]):
    'STAGE TRANSITION PENDING',21);
  o.btn(300,766,390,'SAVE / RETURN',o.close);
  if(heat && !state.completed){
    const mode=state.stage==='KNOCKOUT'?'CHAMP_KO':state.stage==='CREW'?'CHAMP_CREW':'CHAMP_FOUR';
    const units=state.stage==='CREW'?getCrewSeriesUnits(s.registry).filter(u=>u.validAssignment&&!heat.usedCarIds.includes(u.carId)):[];
    const carId=state.stage==='CREW'?units[0]?.carId:s.registry.get('selectedCarId');
    if(state.stage==='CREW'){
      o.label(790,515,'SELECT A DISTINCT CREW CAR',18);
      units.slice(0,5).forEach((u,i)=>o.btn(970,558+i*43,340,u.name+' / '+(cars[u.carId]?.shortName||u.carId),()=>{
        o.close();startChampionshipRace(s,mode,u.carId);
      }));
      if(!units.length)o.label(790,650,'NO ELIGIBLE CREW CARS AVAILABLE',18);
    }else o.btn(1110,762,570,'DRIVE CHAMPIONSHIP HEAT',()=>{o.close();startChampionshipRace(s,mode,carId);});
  }
}

function startChampionshipRace(s,mode,carId){
  const owned=s.registry.get('ownedCarIds')||[];
  if(!carId||!cars[carId]||cars[carId].ginzaDemo||!owned.includes(carId)){
    s.proError='SELECT AN OWNED CAR BEFORE STARTING THE CHAMPIONSHIP HEAT';
    redraw(s);return;
  }
  s.scene.start('FourLaneTestScene',{mode,carId});
}


// A standard compact confirmation modal, not the full-screen season records
// overlay. Both entry and withdrawal deliberately use the same template.
function seasonConfirm(s,{title,description,details,confirmLabel,onConfirm}){
  if(s._proSeasonConfirmClose)s._proSeasonConfirmClose();
  let closed=false;
  const nodes=[],add=obj=>{nodes.push(obj);return obj;};
  const x=780,y=420,w=784,h=365,depth=260;
  const close=()=>{
    if(closed)return;closed=true;
    nodes.forEach(node=>node?.destroy?.());
    if(s._proSeasonConfirmClose===close)s._proSeasonConfirmClose=null;
    s.events.off('shutdown',close);
  };
  s._proSeasonConfirmClose=close;
  s.events.once('shutdown',close);
  const backdrop=add(s.add.rectangle(780,420,1560,840,0x06090d,.72)
    .setDepth(depth).setScrollFactor(0).setInteractive());
  backdrop.on('pointerdown',()=>{});
  add(s.add.rectangle(x,y,w,h,0x101923,.98)
    .setStrokeStyle(2,0xcf4b57).setDepth(depth+1).setScrollFactor(0));
  const label=(yy,value,size=20,color='#edf1f4',wrap=710)=>add(
    s.add.text(x-w/2+34,yy,value,{
      fontFamily:'"Rajdhani", sans-serif',fontSize:size+'px',
      fontStyle:'700',color,wordWrap:{width:wrap},lineSpacing:6,
    }).setDepth(depth+2).setScrollFactor(0)
  );
  label(y-h/2+29,title,25,'#fff5f5');
  label(y-h/2+88,description,21);
  label(y-h/2+172,details,19,'#bbc9d0');
  const action=(cx,caption,callback,red)=>{
    const bg=add(s.add.rectangle(cx,y+h/2-46,337,52,red?0x6b242c:0x253746,.99)
      .setStrokeStyle(2,red?0xe56870:0x7894a3)
      .setDepth(depth+2).setScrollFactor(0).setInteractive({useHandCursor:true}));
    add(s.add.text(cx,y+h/2-46,caption,{
      fontFamily:'"Silkscreen", monospace',fontSize:'10px',color:'#fff',
    }).setOrigin(.5).setDepth(depth+3).setScrollFactor(0));
    bg.on('pointerdown',()=>{if(!closed)callback();});
  };
  action(x-180,'CANCEL',close,false);
  action(x+180,confirmLabel,onConfirm,true);
  return {close,label};
}
export function showProSeasonAction(s,side){
  const c=circuit(s);
  const open=isOpenCircuitAvailable(c);
  const shouldForfeit=c.seasonStatus==='ACTIVE'||
    (c.seasonStatus==='COMPLETE'&&getProQualification(c).qualified);
  if(!open&&!shouldForfeit)return;
  const locked=open&&(!getProCircuitAccess(s.registry).unlocked||
    c.activeCrewEvent||c.activeTournament||c.activeTimedEvent||
    s.registry.get('competitionState')?.active);
  // All three Pro Circuit actions use 40px-high buttons centred at offsets
  // 574, 624 and 674. The 50px centre step gives equal 10px vertical gaps.
  const x=side.x+side.w/2,y=side.y+624;
  const available=!locked;
  const label=open?(c.seasonStatus==='COMPLETE'?'START NEXT PRO SEASON':'START PRO SEASON'):'WITHDRAW / FORFEIT SEASON';
  const b=s.addContent(s.add.rectangle(x,y,side.w-36,40,
      available?0x402028:0x211d23,.99)
    .setStrokeStyle(2,available?0xdd626a:0x645a5d).setDepth(38));
  s.addContent(s.add.text(x,y,label,{
    fontFamily:'"Silkscreen",monospace',fontSize:'8px',
    color:available?'#fff7f6':'#a69b9e',
  }).setOrigin(.5).setDepth(39));
  if(available)b.setInteractive({useHandCursor:true})
    .on('pointerdown',()=>open?showProSeasonRegistration(s):showProSeasonWithdrawal(s));
}

/** Deliberate commitment to the official 8-round championship. */
export function showProSeasonRegistration(s){
  const c=circuit(s),q=getProQualification(c);
  let dialog;
  dialog=seasonConfirm(s,{
    title:'START PROFESSIONAL SEASON?',
    description:'Eight rounds. Three choices per round — you may enter only ONE.',
    details:`TARGETS: DRIVER ${q.driverRequired} PTS / CREW ${q.crewRequired} PTS\nIndependent strip events lock until the season ends or is forfeited. Street racing and tuning remain available.`,
    confirmLabel:'START SEASON',
    onConfirm:()=>{
      if(!getProCircuitAccess(s.registry).unlocked){dialog.label(477,'ACCESS NOT UNLOCKED',17,'#ff98a1');return;}
      if(s.registry.get('competitionState')?.active){dialog.label(477,'FINISH YOUR ACTIVE EVENT FIRST',17,'#ff98a1');return;}
      const next=startProfessionalSeason(circuit(s));
      if(next.error){dialog.label(477,next.error,17,'#ff98a1');return;}
      if(!commit(s,{proCircuit:next.circuit}))return;
      dialog.close();redraw(s);
      // This short, separate registration scene only plays after a durable
      // season registration. It never awards points or alters race outcomes.
      playMangaCutscene(s,'chapter09SeasonRegistration',{preloadPagePosesOnly:true});
    },
  });
}
export function showProSeasonWithdrawal(s){
  const c=circuit(s);
  let dialog;
  dialog=seasonConfirm(s,{
    title:'FORFEIT CURRENT SEASON?',
    description:`Season ${c.season} · ${c.calendar.round}/8 rounds completed. This action cannot be undone.`,
    details:'Current-season points and any active professional event are lost without a refund. Cars, crew, money and permanent trophies remain yours.',
    confirmLabel:'CONFIRM FORFEIT',
    onConfirm:()=>{
      const next=forfeitProfessionalSeason(circuit(s));
      if(next.error){dialog.label(477,next.error,17,'#ff98a1');return;}
      const state=s.registry.get('competitionState');
      const changes={proCircuit:next.circuit};
      if(state?.active&&state.proEvent)changes.competitionState=null;
      if(!commit(s,changes))return;
      dialog.close();redraw(s);
    },
  });
}
