import { createProvisionalChampionship, championshipStandings, getChampionshipKnockoutHeat, getChampionshipCrewHeat, getChampionshipFourWideHeat, settleTokyoChampionship, TOKYO_CHAMPIONSHIP_PURSES } from '../data/tokyoChampionship.js?v=20261030-r724';
import { playMangaCutscene } from './MangaCutscene.js?v=20261029-r720';
import { hasSeenCutscene } from '../data/cutscenes.js?v=20261029-r718';
import { maybePlayProSponsorStory } from './ProSponsorStory.js?v=20261030-r742';
import { PRO_DRIVER_DRIVETRAINS, getProDriverDrivetrain, getProSeasonDriverCarError, CREW_SERIES, PRO_SEASON_LENGTH, OPEN_CIRCUIT_CREW_FEE, OPEN_CIRCUIT_TROPHY_FEE, isOpenCircuitAvailable, getOpenCircuitTrophy, getOpenCircuitCrewFormat, getOpenCircuitSlotStatus, startProfessionalSeason, forfeitProfessionalSeason, getProfessionalRoundEvents, getProQualification, getProfessionalSeasonReport, getProfessionalSeasonBonus, claimProfessionalSeasonBonus, getSeasonStandings, getCrewSeriesUnits, crewSeriesEligibility, registerCrewSeries, forfeitCrewSeries, useProCrewAdvice, getProCrewAdviceAvailability, getCrewFixture, settleCrewSeriesFixture, getCrewSeriesTable, nextProfessionalSeason, assignCrewSeriesCar, preparePlayerCrewFixture, getPlayerCrewHeat, getCrewTechnicalScore } from '../data/proSeason.js?v=20261030-r741';
import { normaliseProCircuitState, getProCircuitAccess, getProCircuitDriverSeeds, getProCircuitTeamSeeds, getProPrizeBonusPercent, getProAiTeamDefinition } from '../data/proCircuit.js?v=20261030-r741';
import { saveProTransaction } from '../state/GameState.js?v=20261030-r739';
import { getOpenCircuitRotation } from '../environment/WorldClock.js?v=20261029-r713';
import { cars } from '../data/cars.js?v=20261026-r687';
import { characters } from '../data/characters.js?v=20261010-r459';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261007-r411';
import { showProCrewHeatSelection, getProCrewHeatAdvice } from './ProCrewBattleLineup.js?v=20261030-r728';
import { showCompactProForfeit } from './ProBriefingChrome.js?v=20261020-r613';
import { showProVictoryResults } from './ProVictoryResults.js?v=20261030-r723';
import { showProTeamNameEditor } from './ProTeamIdentity.js?v=20261030-r724';
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
  const report=getProfessionalSeasonReport(c);
  // Rank and sponsorship remain visible through both Open Circuit and Season.
  // Season controls remain beside the main race entries on the right.
  const height=openCircuit?169:c.activeChampionship?236:213;
  const panel=s.addContent(s.add.rectangle(x-10,y-8,w+20,height,0x11151c,.88)
    .setOrigin(0,0).setStrokeStyle(1,0x63808a,.8).setDepth(28));
  if(openCircuit){
    // Open Circuit is a persistent professional ladder, not a season table.
    // Show both rankings and independent, cash-only appearance commissions.
    text(s,x,y,report.completed?'SEASON '+c.season+' COMPLETE':'PRO RANKINGS',19,
      {color:'#f5e9e5'});
    text(s,x+w-2,y+5,report.completed?
      (report.canEnterTokyo?'TOKYO QUALIFIED':'NOT QUALIFIED'):'OPEN CIRCUIT',12,
      {color:report.completed?'#ecc88d':'#aab8c1'}).setOrigin(1,0);
    s.addContent(s.add.rectangle(x+w/2,y+42,1,67,0x51606b,.85).setDepth(40));
    for(const item of [
      {x,record:driver,label:'DRIVER'},
      {x:x+185,record:team,label:'CREW'},
    ]){
      text(s,item.x,y+36,item.label+' RANK',15,{color:'#bbc4ce'});
      text(s,item.x,y+57,'#'+item.record.seed,29,{color:'#fff2ed'});
      text(s,item.x,y+96,'+'+getProPrizeBonusPercent(item.record.seed,item.label==='CREW'?'TEAM':'DRIVER')+'% WINNINGS BONUS',14,{color:'#ecc88d'});
    }
    const expandY=y+139;
    const expand=s.addContent(s.add.rectangle(x+w/2,expandY,w-10,34,0x40242a,.96)
      .setStrokeStyle(1,0xa46b6d,.9).setDepth(40)
      .setInteractive({useHandCursor:true}));
    text(s,x+w/2,expandY,report.completed?
      'VIEW FINAL SEASON REPORT  ▼':'VIEW ALL PROFESSIONAL RANKINGS  ▼',15,
      {color:'#f5e9e5'}).setOrigin(.5);
    expand.on('pointerdown',()=>report.completed?showSeasonRecords(s,true):showProRankings(s));
    if(s.proError)text(s,stage.x+22,stage.y+460,s.proError,14,{color:'#ef939b'});
    return;
  }
  text(s,x,y,`SEASON ${c.season}  //  ROUND ${Math.min(8,c.calendar.round+1)} OF 8`,20,{color:'#f5e9e5'})
    .setInteractive({useHandCursor:true}).on('pointerdown',()=>showSeasonRecords(s,c.calendar.round>=8));
  const bar=(yy,label,score,goal,seed,color)=>{
    text(s,x,yy,`${label} #${seed}   +${getProPrizeBonusPercent(seed,label==='CREW'?'TEAM':'DRIVER')}% SPONSOR   ${score}/${goal} PTS`,16,
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
  } else {
    const status=report.completed?
      (report.canEnterTokyo?'TOKYO QUALIFIED // VIEW SEASON REPORT':'SEASON COMPLETE // VIEW REPORT'):
      report.qualified?'TARGETS MET // FINISH ALL 8 ROUNDS':
      !report.qualificationPossible?'TOKYO QUALIFICATION OUT OF REACH':
      'NEED '+report.driverEventsNeeded+' DRIVER + '+report.crewEventsNeeded+
        ' CREW EVENTS // '+report.roundsRemaining+' LEFT';
    text(s,x,y+148,status,14,{color:report.qualificationPossible?'#ecc88d':'#ec969b'});
  }
  if(s.proError)text(s,stage.x+22,stage.y+460,s.proError,14,{color:'#ef939b',wordWrap:{width:400}});
}
export function drawCrewSidebar(s,event,side) {
  const c=circuit(s),active=c.activeCrewEvent;
  // Two official crew choices can coexist on the cards, but only the
  // registered choice may show a Resume button. Legacy saves are standard.
  const open=isOpenCircuitAvailable(c);
  const t=active&&(open||
    (event.seasonChoice||'standard')===(active.seasonChoice||'standard'))?active:null;
  const f=t?getCrewFixture(c):null,short=t?!!t.short:!event.trophyId;
  if(!event.team&&!event.seasonEnd)return false;
  if(event.seasonEnd&&!t){
    const report=getProfessionalSeasonReport(c);
    text(s,side.x+20,side.y+207,report.canEnterTokyo?'TOKYO QUALIFIED':'SEASON COMPLETE',21,
      {color:report.canEnterTokyo?'#f3cf8d':'#f5e9e5'});
    text(s,side.x+20,side.y+255,
      'EIGHT PROFESSIONAL ROUNDS COMPLETE\n\n'+
      'DRIVER  '+report.driver+'/'+report.driverRequired+' PTS  //  #'+report.driverStanding+'\n'+
      'CREW    '+report.crew+'/'+report.crewRequired+' PTS  //  #'+report.crewStanding+'\n\n'+
      (report.canEnterTokyo?'CHAMPIONSHIP ENTRY UNLOCKED':
        'MISSED BY '+report.driverShortfall+' DRIVER / '+report.crewShortfall+' CREW PTS')+
      '\n\nVIEW FINAL STANDINGS AND NEXT STEPS',
      16,{lineSpacing:6,wordWrap:{width:side.w-40}});
    button(s,side.x+side.w/2,side.y+574,side.w-36,
      'VIEW OFFICIAL SEASON REPORT',()=>showSeasonRecords(s,true));
    return true;
  }
  const access=getProCircuitAccess(s.registry);
  const rotation=getOpenCircuitRotation();
  const trophy=event.trophyId?getOpenCircuitTrophy(c,rotation):null;
  // Use the format of the selected card; never change it midway through drawing
  // if a day/night offer happens to rotate at a five-minute boundary.
  const crewFormat=f?.format||t?.format||event.format||(open?getOpenCircuitCrewFormat(rotation,c.openCircuitTick):
    getProfessionalRoundEvents(c.calendar.round).crew.format);
  const fee=t?.entryFee??(open?(event.trophyId?trophy?.entryFee??OPEN_CIRCUIT_TROPHY_FEE:OPEN_CIRCUIT_CREW_FEE):event.entryFee??CREW_SERIES.entryFee);
  const formatSupported=['DUEL','RELAY','TECHNICAL','FOUR_WIDE'].includes(crewFormat);
  const crewSlotUsed=open&&!event.trophyId&&!getOpenCircuitSlotStatus(c,'TEAM',rotation).available;
  const canEnter=formatSupported&&access.unlocked&&!c.activeCrewEvent&&!c.activeTournament&&!c.activeTimedEvent&&
    !(c.activeChampionship&&!c.activeChampionship.completed)&&!s.registry.get('competitionState')?.active&&
    (open||c.seasonStatus==='ACTIVE'&&c.calendar.round<8)&&
    (!event.trophyId||trophy?.available&&trophy.id===event.trophyId)&&
    !crewSlotUsed&&Number(s.registry.get('cash')||0)>=fee;
  // Match the right-panel header typography of individual driver events.
  const crewTitle=t?.trophyId||event.trophyId?event.label:
    short?(event.seasonChoice==='alternative'?event.label:
      ((t?.format||crewFormat)==='TECHNICAL'?'CREW TECHNICAL':
      (t?.format||crewFormat)==='RELAY'?'CREW RELAY':
      (t?.format||crewFormat)==='FOUR_WIDE'?'CREW FOUR-WIDE':'CREW SPRINT')):CREW_SERIES.label;
  drawProEventSidebarTitle(s,side,crewTitle);
  const formatBrief=crewFormat==='FOUR_WIDE'?'3 FOUR-WIDE HEATS':
    crewFormat==='RELAY'?'3-LEG TEAM RELAY':'3 HEAD-TO-HEAD HEATS';
  const technicalBrief=[
    'TEST OF CONSISTENCY',
    'DRIVE THREE DIFFERENT CARS',
    'SMALLEST TIME DIFFERENCE WINS',
  ];
  const prizes=t?.prizes||event.prizes||CREW_SERIES.prizes;
  const lines=event.trophyId&&!short?[
    '3 FIXTURES // 9 HEATS',
    event.trophyId==='triDrive'?'REQUIRES FWD + RWD + AWD':
      'CHOOSE THREE DRIVERS',
    'ENTRY  '+cash(t?.entryFee||fee),
    'CHAMPION  '+cash(t?.prizes?.[0]||trophy?.prizeCash||0),
  ]:short?[
    ...(crewFormat==='TECHNICAL'?technicalBrief:[formatBrief,'CHOOSE THREE DRIVERS']),
    'ENTRY  '+cash(t?.entryFee||fee),
    ...(crewFormat==='TECHNICAL'?
      ['BEST THREE-RUN SPREAD  '+cash(prizes[0]),
       'A SINGLE FAST RUN DOES NOT WIN']:
      crewFormat==='RELAY'?
      ['LOWEST COMBINED THREE-LEG TIME  '+cash(prizes[0])]:
      ['3 WINS  '+cash(prizes[0]),
       '2 WINS  '+cash(prizes[1]),
       '1 WIN  '+cash(prizes[2])]),
  ]:[
    '3 FIXTURES // 9 HEATS',
    'CHOOSE THREE DRIVERS',
    'ENTRY  '+cash(fee),
    '1ST  '+cash(prizes[0])+' // 2ND  '+cash(prizes[1]),
  ];
  // Opposing team and fixture number are revealed in the battle room, not here.
  drawProEventSidebarDetails(s,side,[fee===0?'GMG RACING // ENTRY COVERED':
    'LEGACY PAID ENTRY  '+cash(fee),...lines]);
  const reason=t?(f?'':'INVALID SAVED EVENT'):
    event.trophyId&&trophy?.eventsRemaining?'NEXT INVITATION // '+trophy.eventsRemaining+' EVENTS':
    !formatSupported?'FORMAT UNAVAILABLE':
    active&&!t?'FINISH YOUR ACTIVE EVENT FIRST':
    crewSlotUsed?'CREW EVENT COMPLETE // NEXT ROTATION':
    !canEnter?'CHECK ELIGIBILITY / CASH':'';
  drawProEventSidebarStatus(s,side,reason,t?!!f:canEnter);
  drawProEventSidebarEntry(s,side,
    t?'RESUME EVENT BRIEFING':canEnter?proEventEntryLabel(fee):'NOT ELIGIBLE',
    ()=>t?showCrewFixture(s):showCrewRegistration(s,[],{},event.trophyId||null,event.seasonChoice||'standard'),
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
    advice:getProCrewHeatAdvice(f,units),
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
        pending.assignments,pending.trophyId,getOpenCircuitRotation(),pending.seasonChoice);
      if(verified.error){s.proError=verified.error;return;}
      const savedEvent=verified.circuit.activeCrewEvent;
      if(savedEvent.id!==pending.circuit.activeCrewEvent.id||
         savedEvent.format!==pending.circuit.activeCrewEvent.format||
         savedEvent.seasonChoice!==pending.circuit.activeCrewEvent.seasonChoice||
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
export function showCrewRegistration(s,_selection=[],assignments={},trophyId=null,seasonChoice='standard') {
  if(circuit(s).activeCrewEvent)return showCrewFixture(s);
  const units=getCrewSeriesUnits(s.registry,assignments);
  const squadIds=units.map(u=>u.id);
  const out=registerCrewSeries(s.registry,squadIds,assignments,
    trophyId,getOpenCircuitRotation(),seasonChoice);
  if(out.error){s.proError=out.error;redraw(s);return;}
  const pending={circuit:out.circuit,squadIds,assignments,trophyId,seasonChoice};
  s._pendingCrewRegistration=pending;
  showUnpaidCrewBriefing(s,pending,[]);
}

export function confirmCrewForfeit(s) {
  const event=circuit(s).activeCrewEvent;
  if(!event)return;
  return showCompactProForfeit(s,{
    title:'FORFEIT CREW EVENT?',
    message:'Aruken covers event entry. Remaining heats are lost, and this competition cannot be resumed.',
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
    // Event purchase is once-only, while the spoken strategy is updated for
    // the exact next unrevealed opponent every time this fixture is opened.
    // Ignore first-heat adviceText stored by older saves.
    const eventAdvice=getProCrewHeatAdvice(f,units);
    return showProCrewHeatSelection(s,{
      event:t,fixture:f,units,selected:ids,locked:lock,
      adviceStatus:getProCrewAdviceAvailability(s.registry),
      advice:eventAdvice,
      onForfeit:()=>confirmCrewForfeit(s),
      onAdvice:lineupIds=>{
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
      t.short?(currentFormat==='FOUR_WIDE'?'CREW FOUR-WIDE // THREE HEATS':currentFormat==='TECHNICAL'?'CREW TECHNICAL // THREE RUNS':currentFormat==='RELAY'?'CREW RELAY // THREE LEGS':'CREW SPRINT // THREE HEATS'):
      `CREW CLUB SERIES // FIXTURE ${t.round+1}/3`);
    o.label(90,115,circuit(s).playerTeamName+' vs '+f.opponent.name+(currentFormat==='FOUR_WIDE'?' · THREE FOUR-LANE HEATS · AGGREGATE PLACING POINTS':currentFormat==='TECHNICAL'?' · SMALLEST THREE-RUN SPREAD WINS':currentFormat==='RELAY'?' · LOWEST TOTAL TIME WINS':' · TWO HEAT WINS TAKE THE FIXTURE'),23);
    const prepared=f.prepared;
    o.label(90,166,'YOU DRIVE EACH CREW CAR · LIVE CLUTCH / THROTTLE / SHIFTING · EACH FINISH IS SAVED',18);
    prepared.heats.forEach((h,i)=>{
      o.label(120,241+i*90,`HEAT ${i+1} · ${h.name} / ${cars[h.carId]?.shortName}`,22);
      o.label(810,241+i*90,i<prepared.revealed?`${h.ownStatus&&h.ownStatus!=='FINISHED'?h.ownStatus:h.ownSeconds.toFixed(3)+'s'} vs ${h.opponentStatus&&h.opponentStatus!=='FINISHED'?h.opponentStatus:h.opponentSeconds.toFixed(3)+'s'} // ${currentFormat==='TECHNICAL'?'RUN RECORDED':currentFormat==='RELAY'?'LEG RECORDED':currentFormat==='FOUR_WIDE'?'PLACE '+h.place+' / 4':h.tied?'DRAW':h.won?'WIN':'LOSS'}`:'AWAITING HEAT',24);
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
      const technicalScore=getCrewTechnicalScore(prepared.heats);
      const {ownSpread,opponentSpread}=technicalScore;
      const technicalWon=technicalScore.won;
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
        ? 'CONSISTENCY '+(technicalWon?'VICTORY':technicalScore.tied?'DRAW':'DEFEAT')+' // SPREAD '+(ownSpread===null?'DNF':ownSpread.toFixed(3)+'s')+' vs '+(opponentSpread===null?'DNF':opponentSpread.toFixed(3)+'s')
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
    format:summary.format||round.format||'DUEL',
    ownSpread:summary.ownSpread,opponentSpread:summary.opponentSpread,
    ownTotal:summary.ownTotal,opponentTotal:summary.opponentTotal,
    fourWidePoints:(summary.format||round.format)==='FOUR_WIDE'?summary.fourWidePoints:undefined,
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

function showProfessionalTeamDetails(s,teamId) {
  const c=circuit(s),team=c.teams[teamId],definition=getProAiTeamDefinition(teamId);
  if(!team||!definition)return;
  const o=overlay(s,team.name.toUpperCase()+' // TEAM PROFILE');
  const driverName=id=>{
    const record=c.drivers[id];
    return record?.name||characters[record?.characterId]?.name||id;
  };
  o.label(90,125,'REGION  '+(definition.regionId||'PROFESSIONAL NATIONAL')+
    '    CAREER RATING  '+team.rating+'    SEASON POINTS  '+team.seasonPoints,23);
  o.label(90,190,'LEAD DRIVER  //  '+driverName(definition.leadDriverId),29);
  o.label(90,264,'PRO RACING CREW',24);
  definition.rankedDriverIds.forEach((id,index)=>{
    const driver=c.drivers[id],rank=getProCircuitDriverSeeds(c).find(row=>row.id===id)?.seed;
    o.label(115,321+index*64,(index+1)+'.  '+driverName(id)+
      '   //   DRIVER #'+(rank||'—')+'   '+(driver?.rating||0)+' PT',23);
  });
  o.label(115,321+definition.rankedDriverIds.length*64,
    (definition.rankedDriverIds.length+1)+'.  '+definition.reserveName+
    '   //   CREW RESERVE',22);
  o.label(90,655,'Each organisation enters one crew fixture or fields its solo drivers per round.',18);
  o.btn(780,782,330,'BACK TO RANKINGS',()=>showProRankings(s));
}

// Expand the compact Open Circuit ladder into a complete persistent driver
// and crew leaderboard.  Season points intentionally do not affect its order.
export function showProRankings(s) {
  const c=circuit(s),o=overlay(s,'PRO RANKINGS // OPEN CIRCUIT');
  o.label(90,105,'CAREER RATING · SPONSOR BONUS ON OPEN CIRCUIT & PRO SEASON CASH PRIZES',20)
    .setColor('#b8c7cf');
  o.btn(1305,105,345,'RENAME TEAM',()=>showProTeamNameEditor(s,()=>showProRankings(s)));
  const columns=[
    {x:90,title:'DRIVER RANKINGS',rows:getProCircuitDriverSeeds(c),player:'player:driver',kind:'DRIVER'},
    {x:820,title:'TEAM RANKINGS',rows:getProCircuitTeamSeeds(c),player:'player:team',kind:'TEAM'},
  ];
  columns.forEach(({x,title,rows,player,kind})=>{
    o.label(x,147,title+'  //  '+rows.length+' ENTRANTS',23).setColor('#f7e6e2');
    rows.forEach((entry,i)=>{
      const y=185+i*23;
      const mine=entry.id===player;
      if(mine)o.add(s.add.rectangle(x+310,y+10,642,22,0x45252c,.9)
        .setStrokeStyle(1,0x95646d,.65).setDepth(201));
      if(kind==='TEAM'&&!mine){
        const stripe=getProAiTeamDefinition(entry.id)?.colour||'#8096ac';
        const swatch=o.add(s.add.rectangle(x+43,y+10,6,17,
          Number.parseInt(stripe.slice(1),16)).setDepth(204));
        const hit=o.add(s.add.rectangle(x+310,y+10,642,22,0x000000,0)
          .setDepth(205).setInteractive({useHandCursor:true}));
        hit.on('pointerdown',()=>showProfessionalTeamDetails(s,entry.id));
      }
      const display=mine?(kind==='TEAM'?c.playerTeamName:'YOU'):
        entry.name||characters[entry.characterId]?.name||entry.id;
      const style={color:mine?'#ffe4a9':i<3?'#f5f0ed':'#c4c9cf'};
      o.add(uiText(s,x,y,'#'+entry.seed,17,style).setDepth(203));
      o.add(uiText(s,x+58,y,String(display).slice(0,25),17,style).setDepth(203));
      o.add(uiText(s,x+433,y,entry.rating+' PT',16,{color:'#9fb0bc'}).setDepth(203));
      o.add(uiText(s,x+548,y,'+'+getProPrizeBonusPercent(entry.seed,kind)+'%',17,
        {color:mine?'#ffe4a9':'#ddb985'}).setDepth(203));
    });
  });
  o.btn(780,786,395,'CLOSE RANKINGS',o.close);
}

export function showSeasonRecords(s,complete=false) {
  const c=circuit(s),report=getProfessionalSeasonReport(c);
  const finished=report.completed;
  const heading=finished?
    (report.canEnterTokyo?'TOKYO CHAMPIONSHIP // QUALIFIED':'PRO SEASON // NOT QUALIFIED'):
    ('PRO SEASON // ROUND '+(report.roundsCompleted+1)+' OF 8');
  const o=overlay(s,'SEASON '+c.season+' // '+heading);
  o.label(90,110,finished?
    (report.canEnterTokyo?'EIGHT ROUNDS COMPLETE · TOKYO CHAMPIONSHIP UNLOCKED':
      'EIGHT ROUNDS COMPLETE · RETURN TO THE OPEN CIRCUIT TO PREPARE'):
    (report.qualified?'POINT TARGETS MET · FINISH ALL EIGHT ROUNDS':
      'EARN DRIVER AND CREW POINTS TO QUALIFY FOR TOKYO'),19)
    .setColor(report.canEnterTokyo?'#f1cd84':'#b8c7cf');

  for(const [kind,x] of [['DRIVER',90],['TEAM',810]]) {
    o.label(x,151,kind+' SEASON POINTS',25);
    const rows=getSeasonStandings(c,kind),player=kind==='TEAM'?'player:team':'player:driver';
    rows.slice(0,6).forEach((r,i)=>o.label(x,192+i*44,
      (i+1)+'. '+(r.id===player?(kind==='TEAM'?c.playerTeamName:'YOU'):
      r.name||characters[r.characterId]?.name||r.id)+
      '  '+r.seasonPoints+' PTS',19).setColor(r.id===player?'#f2d396':'#e8e1df'));
    const position=kind==='TEAM'?report.crewStanding:report.driverStanding;
    const points=kind==='TEAM'?report.crew:report.driver;
    o.label(x,483,'YOUR STANDING #'+(position||'—')+' · '+points+' PTS',23)
      .setColor('#f2d396');
  }

  o.label(90,532,'TOKYO QUALIFICATION   DRIVER '+report.driver+'/'+report.driverRequired+
    '  ·  CREW '+report.crew+'/'+report.crewRequired,21);
  const outlook=report.canEnterTokyo?
    'QUALIFIED · YOUR TOKYO CHAMPIONSHIP INVITATION IS READY':
    finished?'NOT QUALIFIED · SHORT BY '+report.driverShortfall+' DRIVER / '+
      report.crewShortfall+' CREW POINTS':
    !report.qualificationPossible?'QUALIFICATION MATHEMATICALLY OUT OF REACH THIS SEASON':
    report.qualified?'POINT REQUIREMENTS MET · COMPLETE THE REMAINING ROUNDS':
    'MINIMUM STILL NEEDED: '+report.driverEventsNeeded+' DRIVER + '+
      report.crewEventsNeeded+' CREW EVENTS · '+report.roundsRemaining+' ROUNDS LEFT';
  o.label(90,564,outlook,19).setColor(report.canEnterTokyo?'#f1cd84':
    !report.qualificationPossible?'#eaa0a4':'#c4d0da');

  const entries=c.calendar.history.map((h,i)=>
    (i+1)+'. '+String(h.label||h.discipline||'PRO EVENT').slice(0,18)+
      '  '+Number(h.points||0)+'PT');
  o.label(90,602,'OFFICIAL EVENT RESULTS',18).setColor('#aab8c1');
  o.label(90,626,entries.slice(0,4).join('   /   ')||'NO COMPLETED EVENTS',17);
  if(entries.length>4)o.label(90,650,entries.slice(4,8).join('   /   '),17);

  const last=c.calendar.archives.at(-1);
  if(last)o.label(90,692,'PREVIOUS SEASON '+last.season+
    ': DRIVER #'+(last.drivers?.findIndex(r=>r.id==='player:driver')+1||'—')+
    ' · CREW #'+(last.teams?.findIndex(r=>r.id==='player:team')+1||'—'),17);

  const award=finished?getProfessionalSeasonBonus(c):null;
  if(award) {
    o.label(90,715,'SEASON RANKING AWARDS  ·  DRIVER #'+award.driverRank+
      '  '+cash(award.driverPrize)+'  //  CREW #'+award.crewRank+'  '+cash(award.crewPrize)+
      '  //  TOTAL '+cash(award.total)+(award.claimed?'  ·  CLAIMED':''),17).setColor('#f1cd84');
  }
  if(award&&!award.claimed) {
    o.btn(300,768,390,'COLLECT '+cash(award.total),()=>{
      const out=claimProfessionalSeasonBonus(circuit(s));
      if(out.error)return;
      if(commit(s,{proCircuit:out.circuit,
        cash:Number(s.registry.get('cash')||0)+out.cashPrize})){
        o.close();showSeasonRecords(s,true);
      }
    });
  } else o.btn(300,768,390,'CLOSE REPORT',o.close);
  if(!finished)return;
  if(report.canEnterTokyo&&!c.activeChampionship?.completed) {
    o.btn(1090,768,600,c.activeChampionship?
      'RESUME TOKYO CHAMPIONSHIP':'ENTER TOKYO CHAMPIONSHIP',()=>{
      // Repeated presses and reloads cannot recreate a saved championship.
      const current=circuit(s);
      if(!current.activeChampionship){
        const result=createProvisionalChampionship(current);
        if(result.error){o.label(90,714,result.error,18);return;}
        if(!commit(s,{proCircuit:{...current,activeChampionship:result.championship}}))return;
      }
      o.close();showTokyoChampionship(s);
    });
  } else {
    const needsAward=Boolean(c.activeChampionship?.completed&&
      c.activeChampionship.stage==='COMPLETE'&&
      !c.championshipSettledIds.includes(c.activeChampionship.id));
    o.btn(1090,768,600,needsAward?'VIEW CHAMPIONSHIP AWARDS':'RETURN TO OPEN CIRCUIT',()=>{
      if(needsAward){o.close();showTokyoChampionship(s);return;}
      if(s.registry.get('competitionState')?.active)return;
      const out=nextProfessionalSeason(circuit(s));
      if(out.error){o.label(90,714,out.error,18);return;}
      if(commit(s,{proCircuit:out.circuit})){o.close();redraw(s);}
    });
  }
  if(report.canEnterTokyo && !hasSeenCutscene(s.registry,'tokyoChampionshipOpening')){
    // Chapter 11 belongs to the moment both qualification targets are
    // achieved AND all eight rounds are finished. It does not require the
    // player to commit to a Championship entry first.
    playMangaCutscene(s,'tokyoChampionshipOpening',{
      preloadPagePosesOnly:true,
    });
  }
  if(report.outcome==='NOT_QUALIFIED'){
    // Played over the official final standings, not during an individual
    // failed heat or an unfinished season. Use a save-persistent HISTORY ID
    // scoped to the season, so refreshing the panel never repeats it but
    // a future unsuccessful season may have its own closing conversation.
    playMangaCutscene(s,'proSeasonNotQualified',{
      historyId:'proSeasonNotQualified:s'+c.season,
    });
  }
}

/** One unified sixteen-entrant championship: live stage results, durable
 *  payout and true podium. Never award or score from presentation alone. */
export function showTokyoChampionship(s) {
  let c=circuit(s),state=c.activeChampionship;
  if(!state){showSeasonRecords(s,c.calendar.round>=8);return;}

  // Recover a completed legacy save that reached the result page before
  // once-only awards existed; the transition is safe to call repeatedly.
  if(state.completed){
    const award=settleTokyoChampionship(c);
    if(award.error){s.proError=award.error;redraw(s);return;}
    if(!award.alreadySettled) {
      if(!commit(s,{proCircuit:award.circuit,
        cash:Number(s.registry.get('cash')||0)+award.cashPrize}))return;
      c=award.circuit;state=c.activeChampionship;
    }
  }

  const rows=championshipStandings(state);
  const mine=rows.find(r=>r.id==='player:driver');
  const myPlace=rows.indexOf(mine)+1;
  const complete=Boolean(state.completed);
  const winner=complete&&state.championId==='player:driver';
  const o=overlay(s,complete?
    (winner?'TOKYO CHAMPION // OFFICIAL RESULTS':'TOKYO CHAMPIONSHIP // FINAL STANDINGS'):
    'TOKYO CHAMPIONSHIP // FINAL SIXTEEN');
  const stageName={KNOCKOUT:'STAGE 1 / 3 — INDIVIDUAL KNOCKOUTS',
    CREW:'STAGE 2 / 3 — CREW BATTLES',
    FOUR_WIDE:'STAGE 3 / 3 — FOUR-WIDE FINALS',
    COMPLETE:'CHAMPIONSHIP COMPLETE'};
  o.label(90,105,stageName[state.stage]||'CHAMPIONSHIP IN PROGRESS',22)
    .setColor(complete?'#f6d18a':'#d7e8ef');
  o.label(90,142,complete?
    ('YOUR FINISH  #'+myPlace+'/16   ·   TOTAL '+mine.total+' PTS'+
      (winner?'   ·   TOKYO CHAMPION':'   ·   CHAMPION '+rows[0].name)):
    'THREE STAGES · KO 20 PTS + CREW 20 PTS + FOUR-WIDE 40 PTS MAX',19)
    .setColor(complete?'#f6d18a':'#b8c7cf');

  for(const [i,entry] of rows.entries()){
    const x=i<8?90:810,y=197+(i%8)*51;
    const own=entry.id==='player:driver';
    const name=own?'YOU':String(entry.name||entry.id).slice(0,19);
    o.label(x,y,(i+1)+'. '+name,18)
      .setColor(own?'#f5d18b':i<3?'#f0e6e4':'#d4dce2');
    o.label(x+328,y,'KO '+entry.knockout+
      ' · CR '+entry.crew+' · 4W '+entry.fourWide+'  =  '+entry.total,17)
      .setColor(own?'#f5d18b':'#9db6c5');
  }

  const heat=state.stage==='KNOCKOUT'?getChampionshipKnockoutHeat(state):
    state.stage==='CREW'?getChampionshipCrewHeat(state):
    state.stage==='FOUR_WIDE'?getChampionshipFourWideHeat(state):null;
  const next=heat?(state.stage==='KNOCKOUT'?
      'KNOCKOUT ROUND '+(heat.round+1)+'/4 · VS '+heat.opponent?.name:
      state.stage==='CREW'?'CREW HEAT '+(heat.index+1)+'/3 · VS '+heat.opponent?.name:
      'FOUR-WIDE '+['QUALIFIER','SEMIFINAL','FINAL'][heat.round]):null;
  const paid=c.championshipHistory.find(h=>h.id===state.id);
  o.label(90,633,complete?
    'OFFICIAL PODIUM · 1ST '+rows[0].name+'  ·  2ND '+rows[1].name+
      '  ·  3RD '+rows[2].name:
    (next?'UP NEXT · '+next:'STAGE COMPLETED · RESULTS ARE SAVED'),19)
    .setColor(complete?'#f5d18b':'#b8c7cf');
  if(complete){
    o.label(90,678,'YOUR CHAMPIONSHIP PRIZE  ¥'+
      Number(paid?.cashPrize??TOKYO_CHAMPIONSHIP_PURSES[myPlace-1]??0).toLocaleString('en-US')+
      (winner?'  ·  PERMANENT TOKYO CHAMPION TITLE EARNED':
        '  ·  RETURN FOR ANOTHER SEASON'),19).setColor('#f6d18a');
  }else{
    o.label(90,681,'EACH HEAT IS SAVED · A LOSS IN ONE STAGE DOES NOT END THE CHAMPIONSHIP',18)
      .setColor('#b8c7cf');
  }

  o.btn(310,768,390,'SAVE / RETURN',o.close);
  if(heat&&!complete){
    const mode=state.stage==='KNOCKOUT'?'CHAMP_KO':
      state.stage==='CREW'?'CHAMP_CREW':'CHAMP_FOUR';
    if(mode==='CHAMP_CREW'){
      const eligible=getCrewSeriesUnits(s.registry).filter(u=>
        u.validAssignment&&!heat.usedCarIds.includes(u.carId));
      o.btn(1090,768,600,'SELECT CREW CAR / DRIVE HEAT',()=>{
        o.close();showChampionshipCrewSelection(s);
      });
      if(!eligible.length)o.label(810,709,'NO ELIGIBLE UNIQUE CREW CAR — CHECK GARAGE',18)
        .setColor('#e89d9f');
    }else{
      const carId=state.driverCarId||s.registry.get('selectedCarId');
      o.btn(1090,768,600,'DRIVE CHAMPIONSHIP HEAT',()=>{
        startChampionshipRace(s,mode,carId);
      });
      if(state.driverCarId)o.label(810,709,'REGISTERED DRIVER CAR · '+
        (cars[state.driverCarId]?.shortName||state.driverCarId),17);
    }
  }else if(complete){
    o.btn(1090,768,600,'CONTINUE PROFESSIONAL CAREER',()=>{
      o.close();showSeasonRecords(s,true);
    });
  }
  // These simple story beats run only on genuine saved outcomes; there are
  // no rewards or state changes inside the cutscene.
  if(complete)playMangaCutscene(s,winner?
    'tokyoChampionshipVictory':'tokyoChampionshipDefeat');
  else if(state.stage==='KNOCKOUT'&&!(state.knockout?.results?.length))
    playMangaCutscene(s,'tokyoChampionshipOpening');
}

function showChampionshipCrewSelection(s) {
  const c=circuit(s),state=c.activeChampionship;
  const heat=getChampionshipCrewHeat(state);
  if(!heat){showTokyoChampionship(s);return;}
  const o=overlay(s,'TOKYO CHAMPIONSHIP // CREW CAR REGISTRATION');
  o.label(90,116,'HEAT '+(heat.index+1)+'/3  ·  '+heat.opponent.name,24);
  o.label(90,167,'DRIVE A DIFFERENT REGISTERED CREW CAR IN EACH HEAT. NO REUSED CARS.',19);
  const units=getCrewSeriesUnits(s.registry).filter(u=>
    u.validAssignment&&!heat.usedCarIds.includes(u.carId));
  units.slice(0,7).forEach((unit,i)=>{
    const x=i%2===0?435:1135,y=261+Math.floor(i/2)*105;
    o.btn(x,y,610,unit.name+'  /  '+(cars[unit.carId]?.shortName||unit.carId),()=>{
      if(startChampionshipRace(s,'CHAMP_CREW',unit.carId))o.close();
    });
  });
  if(!units.length)o.label(90,326,'NO ELIGIBLE CREW CAR — RETURN TO THE GARAGE',22);
  o.btn(290,763,390,'BACK TO STANDINGS',()=>{
    o.close();showTokyoChampionship(s);
  });
}

function startChampionshipRace(s,mode,carId) {
  const c=circuit(s),state=c.activeChampionship;
  const expected={KNOCKOUT:'CHAMP_KO',CREW:'CHAMP_CREW',FOUR_WIDE:'CHAMP_FOUR'}[state?.stage];
  const owned=s.registry.get('ownedCarIds')||[];
  if(!state||state.completed||expected!==mode||
     !carId||!cars[carId]||cars[carId].ginzaDemo||!owned.includes(carId)){
    s.proError='SELECT AN ELIGIBLE OWNED CAR FOR THE ACTIVE CHAMPIONSHIP HEAT';
    return false;
  }
  if(mode==='CHAMP_CREW') {
    const heat=getChampionshipCrewHeat(state);
    const valid=getCrewSeriesUnits(s.registry).some(u=>
      u.carId===carId&&u.validAssignment&&!heat?.usedCarIds.includes(carId));
    if(!heat||!valid){s.proError='REGISTER A DIFFERENT ELIGIBLE CREW CAR';return false;}
  }else{
    const heat=mode==='CHAMP_KO'?getChampionshipKnockoutHeat(state):
      getChampionshipFourWideHeat(state);
    if(!heat){s.proError='NO ACTIVE CHAMPIONSHIP HEAT';return false;}
    if(!state.driverCarId&&getProSeasonDriverCarError(c,carId)){
      s.proError='CHOOSE A CAR FROM YOUR THREE REGISTERED SEASON CARS';return false;
    }
    if(state.driverCarId&&state.driverCarId!==carId){
      s.proError='USE YOUR REGISTERED CHAMPIONSHIP DRIVER CAR';return false;
    }
    if(!state.driverCarId){
      // Lock the driver's car for both individual and four-wide stages,
      // without an entry fee or a duplicate registration.
      if(!commit(s,{proCircuit:{...c,
        activeChampionship:{...state,driverCarId:carId}}}))return false;
    }
  }
  s.proError=null;
  s.scene.start('FourLaneTestScene',{mode,carId});
  return true;
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

/** Eight-round entry locks one owned personal car per drivetrain. */
export function showProSeasonRegistration(s,selected={},pages={}){
  const owned=[...new Set(s.registry.get('ownedCarIds')||[])];
  const available=Object.fromEntries(PRO_DRIVER_DRIVETRAINS.map(d=>[d,
    owned.filter(id=>cars[id]&&!cars[id].ginzaDemo&&!cars[id].crewLoan&&
      getProDriverDrivetrain(id)===d)]));
  const o=overlay(s,'PRO SEASON // REGISTER THREE DRIVER CARS');
  o.label(90,111,'CHOOSE ONE FF (FWD), ONE RWD AND ONE AWD CAR FROM YOUR GARAGE.',23);
  o.label(90,151,'These three cars are locked for individual Pro Season races and Tokyo Championship entry. You may retune them between events. All seven recruited crew drivers remain available for crew events.',18)
    .setColor('#c5d5df');
  PRO_DRIVER_DRIVETRAINS.forEach((drive,column)=>{
    const x=90+column*480,rows=available[drive],page=Math.max(0,
      Math.min(Number(pages[drive])||0,Math.max(0,Math.ceil(rows.length/5)-1)));
    o.label(x,213,(drive==='FWD'?'FF / FWD':drive)+'   //   '+rows.length+' ELIGIBLE',22)
      .setColor('#f2d6b2');
    rows.slice(page*5,(page+1)*5).forEach((id,index)=>{
      const choice=(selected[drive]===id?'SELECTED  ✓  ':'')+
        (cars[id]?.shortName||id);
      o.btn(x+195,277+index*76,410,choice,()=>{
        showProSeasonRegistration(s,{...selected,[drive]:id},pages);
      });
    });
    if(!rows.length)o.label(x,315,'NO OWNED CAR IN THIS CLASS',17).setColor('#f0a0a5');
    if(rows.length>5){
      o.btn(x+95,672,190,'◀ PREV',()=>{
        showProSeasonRegistration(s,selected,{...pages,[drive]:Math.max(0,page-1)});
      });
      o.btn(x+296,672,190,'NEXT ▶',()=>{
        showProSeasonRegistration(s,selected,{...pages,[drive]:Math.min(Math.ceil(rows.length/5)-1,page+1)});
      });
    }
  });
  const ids=PRO_DRIVER_DRIVETRAINS.map(d=>selected[d]);
  const complete=ids.every(Boolean);
  o.label(90,723,complete?
    'READY // '+ids.map((id,i)=>(PRO_DRIVER_DRIVETRAINS[i]==='FWD'?'FF':PRO_DRIVER_DRIVETRAINS[i])+': '+(cars[id]?.shortName||id)).join('   |   '):
    'SELECT THREE CARS TO START THE EIGHT-ROUND SEASON.',18)
    .setColor(complete?'#e7d28e':'#c5d0d8');
  o.btn(280,786,380,'CANCEL',o.close);
  if(complete)o.btn(1175,786,580,'REGISTER CARS / START SEASON',()=>{
    if(!getProCircuitAccess(s.registry).unlocked){
      s.proError='ACCESS NOT UNLOCKED';o.close();redraw(s);return;
    }
    if(s.registry.get('competitionState')?.active){
      s.proError='FINISH YOUR ACTIVE EVENT FIRST';o.close();redraw(s);return;
    }
    const next=startProfessionalSeason(circuit(s),ids,s.registry.get('ownedCarIds')||[]);
    if(next.error){s.proError=next.error;o.close();redraw(s);return;}
    if(!commit(s,{proCircuit:next.circuit}))return;
    o.close();redraw(s);
    if(next.circuit.season===1&&!s.registry.get('cutscenesSeen')?.includes('proSponsorEpilogue'))
      maybePlayProSponsorStory(s);
    else playMangaCutscene(s,'chapter09SeasonRegistration',{preloadPagePosesOnly:true});
  });
}
export function showProSeasonWithdrawal(s){
  const c=circuit(s);
  let dialog;
  dialog=seasonConfirm(s,{
    title:'FORFEIT CURRENT SEASON?',
    description:`Season ${c.season} · ${c.calendar.round}/8 rounds completed. This action cannot be undone.`,
    details:'Current-season points and any active professional event are lost. Cars, crew, money and permanent trophies remain yours.',
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
