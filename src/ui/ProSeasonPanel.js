import { createProvisionalChampionship, championshipStandings, getChampionshipKnockoutHeat, getChampionshipCrewHeat, getChampionshipFourWideHeat } from '../data/tokyoChampionship.js?v=20261012-champaudit';
import { playMangaCutscene } from './MangaCutscene.js?v=20261018-r585';
import { CREW_SERIES, PRO_SEASON_LENGTH, OPEN_CIRCUIT_CREW_FEE, OPEN_CIRCUIT_TROPHY_FEE, isOpenCircuitAvailable, getOpenCircuitTrophy, startProfessionalSeason, forfeitProfessionalSeason, getProfessionalRoundEvents, getProQualification, getSeasonStandings, getCrewSeriesUnits, crewSeriesEligibility, registerCrewSeries, getCrewFixture, settleCrewSeriesFixture, getCrewSeriesTable, nextProfessionalSeason, assignCrewSeriesCar, preparePlayerCrewFixture, getPlayerCrewHeat } from '../data/proSeason.js?v=20261018-r584';
import { normaliseProCircuitState, getProCircuitAccess, getProCircuitDriverSeeds, getProCircuitTeamSeeds } from '../data/proCircuit.js?v=20261018-r584';
import { saveProTransaction } from '../state/GameState.js?v=20261012-champ2c';
import { cars } from '../data/cars.js?v=20261011-r479';
import { characters } from '../data/characters.js?v=20261010-r459';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261007-r411';
import { showCrewRegistrationScreen } from './CrewRegistrationPanel.js?v=20261018-r584';
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
export function drawSeasonHeader(s,stage) {
  const c=circuit(s),q=getProQualification(c);
  const driver=getProCircuitDriverSeeds(c).find(r=>r.id==='player:driver');
  const team=getProCircuitTeamSeeds(c).find(r=>r.id==='player:team');
  const x=stage.x+22,y=stage.y+18,w=355;
  const openCircuit=isOpenCircuitAvailable(c);
  // Top-left is informational only. The season action lives alongside the
  // race entry and map controls on the right, with predictable touch targets.
  const height=openCircuit?111:c.activeChampionship?176:158;
  const panel=s.addContent(s.add.rectangle(x-10,y-8,w+20,height,0x11151c,.88)
    .setOrigin(0,0).setStrokeStyle(1,0x63808a,.8).setDepth(28));
  if(openCircuit){
    text(s,x,y,'OPEN CIRCUIT // INDEPENDENT EVENTS',18,{color:'#f5e9e5'});
    text(s,x,y+34,'DRIVER / CREW / ROTATING MINOR TROPHY',16,{color:'#c7d9dc'});
    text(s,x,y+61,'PRESTIGE TROPHY TOURNAMENTS // NO SEASON POINTS',15,{color:'#c7d9dc'});
    if(s.proError)text(s,stage.x+22,stage.y+460,s.proError,14,{color:'#ef939b'});
    return;
  }
  text(s,x,y,`SEASON ${c.season}  //  ROUND ${Math.min(8,c.calendar.round+1)} OF 8`,20,{color:'#f5e9e5'})
    .setInteractive({useHandCursor:true}).on('pointerdown',()=>showSeasonRecords(s,c.calendar.round>=8));
  const bar=(yy,label,score,goal,seed,color)=>{
    text(s,x,yy,`${label} RANK #${seed}   ${score} / ${goal} PTS`,18,{color:'#f2e7e3'});
    s.addContent(s.add.rectangle(x,yy+29,w-10,10,0x38343c).setOrigin(0,0).setDepth(39));
    s.addContent(s.add.rectangle(x,yy+29,(w-10)*Math.min(1,score/goal),10,color).setOrigin(0,0).setDepth(40));
  };
  bar(y+39,'DRIVER',q.driver,q.driverRequired,driver.seed,0x3993ad);
  bar(y+92,'CREW',q.crew,q.crewRequired,team.seed,0xb7844c);
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
  const trophy=event.trophyId?getOpenCircuitTrophy(c):null;
  const crewFormat=f?.format||t?.format||(open?['DUEL','RELAY','TECHNICAL','FOUR_WIDE'][c.openCircuitTick%4]:
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
  s.addContent(s.add.text(side.x+20,side.y+207,crewTitle,{
    fontFamily:'"Silkscreen", monospace',fontSize:'11px',color:'#f8f3f2',
    wordWrap:{width:side.w-38},
  }).setDepth(34));
  const lines=event.trophyId&&!short?[
    'PRESTIGE TROPHY // '+(t?.round+1||1)+'/3 FIXTURES',
    '9 PLAYER-DRIVEN HEATS // THREE OPPONENT CREWS',
    event.trophyDescription||t?.label||'CHAMPIONSHIP SERIES',
    event.trophyId==='triDrive'?'REQUIRES FWD + RWD + AWD':'RANKED OPPONENTS // FULL SERIES',
    'RESULTS AND LINEUPS SAVED BETWEEN FIXTURES',
    'NO SEASON OR CHAMPIONSHIP POINTS',
    'ENTRY  '+cash(t?.entryFee||fee),
    'FIRST WIN  '+cash(t?.prizes?.[0]||trophy?.prizeCash||0),
  ]:short?[
    (open?'OPEN CIRCUIT // NO SEASON POINTS':'ROUND '+(c.calendar.round+1)+'/8')+' // '+crewFormat,
    crewFormat==='FOUR_WIDE'?'3 FOUR-LANE HEATS // 3/2/1/0 POINTS PER FINISH':crewFormat==='TECHNICAL'?'3 RUNS // SMALLEST TIME SPREAD WINS':crewFormat==='RELAY'?'3 LEGS // LOWEST COMBINED TIME WINS':'3 HEATS // THREE CREW CARS',
    'REGISTER 3–5 · FIELD THREE',
    open?'INDEPENDENT EVENT // NO CHAMPIONSHIP POINTS':'CREW POINTS  2 / 7 / 13 / 20',
    'ENTRY  '+cash(t?.entryFee||fee),
    '3 WINS  '+cash(open?(event.trophyId?90000:70000):210000),
    '2 WINS  '+cash(open?(event.trophyId?0:30000):90000),
    '1 WIN  '+cash(open?(event.trophyId?0:15000):40000),
  ]:[
    'PRO COMP // CREW // SAVED SERIES',
    '3 FIXTURES // 9 HEATS TOTAL',
    'REGISTER 3–5 · FIELD THREE',
    'ENTRY  '+cash(CREW_SERIES.entryFee),
    '1ST  ¥210,000 · 2ND  ¥90,000',
    '3RD  ¥40,000 · 4TH  ¥0',
  ];
  if(t)lines.push(`FIXTURE ${t.round+1}/${short?1:3} · ${f?.opponent.name||'SAVED FIXTURE UNAVAILABLE'}`);
  s.addContent(uiText(s,side.x+20,side.y+250,lines.join('\n'),18,{
    color:'#c4bec0',fontStyle:'700',lineSpacing:5,wordWrap:{width:side.w-37}
  }).setDepth(34));
  const reason=t?(f?'SAVED SQUAD · NO RE-ENTRY FEE':'INVALID SAVED FIXTURE'):
    event.trophyId&&trophy?.eventsRemaining?'NEXT INVITATION // '+trophy.eventsRemaining+' OTHER EVENTS REQUIRED':
    !formatSupported?'CREW FORMAT NOT YET AVAILABLE':
    !canEnter?'FINISH ACTIVE EVENT / CHECK CASH':'SELECT YOUR SQUAD ON ENTRY';
  text(s,side.x+20,side.y+518,reason,13,{color:'#e89da3',wordWrap:{width:side.w-38}});
  button(s,side.x+side.w/2,side.y+590,side.w-36,t?'RESUME CREW SERIES':'ENTER / SELECT SQUAD',()=>t?showCrewFixture(s):showCrewRegistration(s,[],{},event.trophyId||null),t?!!f:canEnter);
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
export function showCrewRegistration(s,selection=[],assignments={},trophyId=null) {
  const c=circuit(s);
  const open=isOpenCircuitAvailable(c);
  const trophy=trophyId?getOpenCircuitTrophy(c):null;
  const fee=open?(trophy?.entryFee||OPEN_CIRCUIT_CREW_FEE):CREW_SERIES.entryFee;
  const units=getCrewSeriesUnits(s.registry,assignments);
  const getReason=ids=>crewSeriesEligibility(s.registry,ids,assignments)||
    (trophyId&&!getOpenCircuitTrophy(circuit(s)).available?'TROPHY INVITATION UNAVAILABLE':null)||
    (trophyId==='triDrive'&&
      (ids.length!==3||!['FWD','RWD','AWD'].every(d=>ids.map(id=>String(units.find(u=>u.id===id)?.drivetrain||'').toUpperCase())
        .map(x=>({FF:'FWD',FR:'RWD'}[x]||x)).includes(d)))?
      'FIELD EXACTLY ONE FWD, RWD AND AWD DRIVER':null)||
    (Number(s.registry.get('cash')||0)<fee?'INSUFFICIENT CASH':null);
  return showCrewRegistrationScreen(s,{
    units,selection,assignments,trophyId,fee,getReason,
    onRegister:(ids,close)=>{
      if(getReason(ids))return;
      const out=registerCrewSeries(s.registry,ids,assignments,trophyId);
      if(out.error){s.proError=out.error;close();redraw(s);return;}
      close();
      if(commit(s,{proCircuit:out.circuit,cash:out.cash}))showCrewFixture(s);
    },
  });
}
export function showCrewFixture(s,selection=null) {
  const c=circuit(s),f=getCrewFixture(c),t=c.activeCrewEvent;if(!f){s.proError='SAVED CREW FIXTURE UNAVAILABLE';redraw(s);return;}
  const currentFormat=f.format;
  const o=overlay(s,t.trophyId?`${t.label} // FIXTURE ${t.round+1}/3`:
    t.short?(currentFormat==='FOUR_WIDE'?'CREW FOUR-WIDE // THREE HEATS':currentFormat==='TECHNICAL'?'CREW TECHNICAL // THREE RUNS':currentFormat==='RELAY'?'CREW RELAY // THREE LEGS':'CREW CLUB SPRINT // THREE HEATS'):
    `CREW CLUB SERIES // FIXTURE ${t.round+1}/3`),units=getCrewSeriesUnits(s.registry,t.assignments).filter(u=>t.squadIds.includes(u.id));
  const chosen=selection||t.squadIds.slice(0,3);
  o.label(90,115,'YOUR CREW vs '+f.opponent.name+(currentFormat==='FOUR_WIDE'?' · THREE FOUR-LANE HEATS · AGGREGATE PLACING POINTS':currentFormat==='TECHNICAL'?' · SMALLEST THREE-RUN SPREAD WINS':currentFormat==='RELAY'?' · LOWEST TOTAL TIME WINS':' · TWO HEAT WINS TAKE THE FIXTURE'),23);
  if(!f.prepared){
    o.label(90,158,'Choose three crew cars in racing order. You drive ALL three. Tuning is locked for this fixture.',18);
    units.forEach((u,i)=>{
      o.btn(280,235+i*70,390,(chosen.includes(u.id)?chosen.indexOf(u.id)+1+'. ':'')+u.name,()=>{const next=chosen.includes(u.id)?chosen.filter(id=>id!==u.id):chosen.length<3?[...chosen,u.id]:chosen;o.close();showCrewFixture(s,next);});
      o.label(510,225+i*70,(cars[u.carId]?.shortName||u.carId)+' · '+Math.round(u.powerKW)+' KW',20);
      if(!u.validAssignment)o.btn(635,250+i*70,220,'USE CREW LOAN',()=>{
        const out=assignCrewSeriesCar(s.registry,u.id,u.loanCarId);
        if(out.circuit){o.close();if(commit(s,{proCircuit:out.circuit}))showCrewFixture(s,chosen);}
      });
    });
    f.opponent.drivers.forEach((u,i)=>o.label(770,232+i*96,`HEAT ${i+1}: ${cars[u.carId]?.shortName}\nSKILL ${Math.round(u.skill*100)} · PERFORMANCE ${Math.round(u.performance)}`,23));
    o.label(90,650,'Current table: '+getCrewSeriesTable(t).map(r=>r.name+' '+r.points).join('  /  '),18);
    o.btn(300,754,410,'RETURN / GARAGE BREAK',o.close);
    o.btn(1080,754,580,'LOCK LINEUP / RACE',()=>{const out=preparePlayerCrewFixture(s.registry,chosen,f.id);if(out.error){o.label(90,690,out.error,18);return;}o.close();if(commit(s,{proCircuit:out.circuit}))showCrewFixture(s);});
  } else {
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
    o.btn(350,779,450,'SAVE / RETURN TO COMPLEX',o.close);
  }
}
function showCrewResult(s,out) {
  const o=overlay(s,out.summary?.trophyId?'PRESTIGE TROPHY // AWARDS':'PROFESSIONAL CIRCUIT'),champion=out.summary?.placing===1;
  const portrait=createCharacterProfile(s,{characterId:s.registry.get('playerCharacterId')||'renMizuno',pose:out.wins>=2?'win':'loss',x:290,y:400,frameWidth:430,frameHeight:480,side:'left',depth:204,flipInward:true});
  if(portrait)o.add(portrait);
  o.label(610,205,champion&&out.summary?.trophyId?'TROPHY CHAMPION':champion?'SERIES WINNER':out.status==='COMPLETE'?'SERIES COMPLETE':out.wins>=2?'TEAM VICTORY':'TEAM DEFEAT',52);
  o.label(620,305,out.summary?.format==='TECHNICAL'?`TIME SPREAD ${out.summary.ownSpread===null?'DNF':out.summary.ownSpread.toFixed(3)+'s'} vs ${out.summary.opponentSpread===null?'DNF':out.summary.opponentSpread.toFixed(3)+'s'}`:out.summary?.format==='RELAY'?`RELAY TOTAL ${out.summary.ownTotal.toFixed(3)}s vs ${out.summary.opponentTotal.toFixed(3)}s`:`FIXTURE SCORE ${out.wins} – ${3-out.wins}`,34);
  o.label(620,385,out.summary?
    `${out.summary.trophyId?out.summary.label+' · FINAL PLACING #'+out.summary.placing:'HEATS WON '+(out.summary.heatWins??out.summary.wins)+'/3'} · +${cash(out.cashPrize)}\nTEAM RANK #${out.summary.rankBefore} → #${out.summary.rankAfter}\n${out.summary.openCircuit?'STANDALONE TROPHY · NO SEASON POINTS':'+'+out.summary.points+' SEASON POINTS'}`:
    `NEXT: FIXTURE ${out.circuit.activeCrewEvent.round+1}/3\nYour crew and results are saved.`,24);
  if(out.circuit.calendar.round>=8)o.label(620,566,'SEASON COMPLETE · VIEW RESULTS AT THE COMPLEX',20);
  o.label(980,745,'TAP ANYWHERE · RETURN TO COMPLEX',18);
  let armed=false,done=false;const advance=()=>{if(!armed||done)return;done=true;o.close();redraw(s);};
  o.add(s.add.rectangle(780,420,1560,840,0,0.001).setDepth(295).setInteractive()).on('pointerdown',advance);
  s.time.delayedCall(360,()=>{armed=true;});
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
  // Regular entry buttons end at SIDE.y+598, action begins SIDE.y+605;
  // map begins at SIDE.y+653. Both have at least 7px of separation.
  const x=side.x+side.w/2,y=side.y+624;
  const available=!locked;
  const label=open?(c.seasonStatus==='COMPLETE'?'START NEXT PRO SEASON':'START PRO SEASON'):'WITHDRAW / FORFEIT SEASON';
  const b=s.addContent(s.add.rectangle(x,y,side.w-36,38,
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
