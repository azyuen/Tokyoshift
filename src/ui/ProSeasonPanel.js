import { CREW_SERIES, PRO_SEASON_LENGTH, getSeasonStandings, getCrewSeriesUnits, crewSeriesEligibility, registerCrewSeries, getCrewFixture, settleCrewSeriesFixture, getCrewSeriesTable, nextProfessionalSeason, assignCrewSeriesCar, preparePlayerCrewFixture, getPlayerCrewHeat } from '../data/proSeason.js?v=20261010-r471';
import { normaliseProCircuitState, getProCircuitDriverSeeds, getProCircuitTeamSeeds } from '../data/proCircuit.js?v=20261010-r471';
import { saveProTransaction } from '../state/GameState.js?v=20261010-r471';
import { cars } from '../data/cars.js?v=20261006-r388';
import { characters } from '../data/characters.js?v=20261010-r459';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261007-r411';
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
export function drawSeasonHeader(s,side) {
  const c=circuit(s),driver=getProCircuitDriverSeeds(c).find(r=>r.id==='player:driver'),team=getProCircuitTeamSeeds(c).find(r=>r.id==='player:team');
  text(s,side.x+20,side.y+117,`SEASON ${c.season} // ROUND ${Math.min(8,c.calendar.round+1)}/8`,16).setInteractive({useHandCursor:true}).on('pointerdown',()=>showSeasonRecords(s,c.calendar.round>=8));
  text(s,side.x+20,side.y+146,`DRIVER #${driver.seed} · ${driver.seasonPoints} PTS\nCREW #${team.seed} · ${team.seasonPoints} PTS`,14);
  if(s.proError)text(s,side.x+20,side.y+630,s.proError,12,{color:'#ef939b',wordWrap:{width:side.w-40}});
}
export function drawCrewSidebar(s,event,side) {
  const c=circuit(s),t=c.activeCrewEvent,f=getCrewFixture(c);
  if(!event.team&&!event.seasonEnd&&!t)return false;
  if(event.seasonEnd&&!t){
    text(s,side.x+20,side.y+207,'SEASON COMPLETE',21);
    text(s,side.x+20,side.y+255,`Eight official events completed.\n\nDriver standing: #${getSeasonStandings(c).findIndex(r=>r.id==='player:driver')+1}\nTeam standing: #${getSeasonStandings(c,'TEAM').findIndex(r=>r.id==='player:team')+1}\n\nRatings, records and achievements carry over.\nSeason points reset when you continue.\n\nPast results remain in the season record.`,16,{lineSpacing:5,wordWrap:{width:side.w-40}});
    button(s,side.x+side.w/2,side.y+590,side.w-36,'VIEW RESULTS / NEXT SEASON',()=>showSeasonRecords(s,true));return true;
  }
  const ready=c.calendar.round>=1||s.registry.get('devMode');
  const canEnter=ready&&!c.activeTournament&&!s.registry.get('competitionState')?.active&&c.calendar.round<8&&Number(s.registry.get('cash')||0)>=CREW_SERIES.entryFee;
  text(s,side.x+20,side.y+207,CREW_SERIES.label,21);
  const lines=['TEAM COMPETITION // YOU DRIVE','4 TEAMS · 3 ROUND-ROBIN FIXTURES','REGISTER 3–5 DRIVERS · FIELD 3','2 OF 3 HEATS WINS EACH FIXTURE','3 POINTS PER FIXTURE WIN','TIES: HEAT DIFFERENCE, THEN SEED',`ENTRY ${cash(CREW_SERIES.entryFee)}`,'1ST ¥210,000 · 2ND ¥90,000','3RD ¥40,000 · 4TH ¥0','AFTER FIRST WIN: 65% PURSES'];
  if(t){lines.push(`FIXTURE ${t.round+1}/3 · ${f?.opponent.name||'SAVE NEEDS RECOVERY'}`);lines.push(...getCrewSeriesTable(t).map(r=>`${r.name} · ${r.points} PTS`));}
  else lines.push('YOUR SHIFTING + CREW CAR TUNING','GARAGE BREAKS BETWEEN FIXTURES');
  lines.forEach((line,i)=>{
    const row=text(s,side.x+20,side.y+250+i*18,line,16);
    if(row.width>side.w-40)row.setScale((side.w-40)/row.width);
  });
  const reason=t?(f?'SAVED SQUAD · NO RE-ENTRY FEE':'INVALID SAVED FIXTURE · NO MONEY CHANGED'):!ready?'COMPLETE ONE PRO EVENT TO UNLOCK':!canEnter?'FINISH ACTIVE EVENT / CHECK CASH':'SELECT YOUR SQUAD ON ENTRY';
  text(s,side.x+20,side.y+540,reason,12,{color:'#e89da3',wordWrap:{width:side.w-38}});
  button(s,side.x+side.w/2,side.y+590,side.w-36,t?'RESUME CREW SERIES':'ENTER / SELECT SQUAD',()=>t?showCrewFixture(s):showCrewRegistration(s),t?!!f:canEnter);
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
export function showCrewRegistration(s,selection=[],assignments={}) {
  const o=overlay(s,'REGISTER SQUAD // CREW CLUB SERIES'),units=getCrewSeriesUnits(s.registry,assignments),owned=s.registry.get('ownedCarIds')||[];
  o.label(90,115,'Select 3–5 crew cars. YOU drive each heat. Invest in their upgrades in the Crew Garage between fixtures.',18);
  units.forEach((u,i)=>{
    const chosen=selection.includes(u.id),y=187+i*65;
    o.btn(345,y,500,(chosen?'✓ ':'')+u.name,()=>{const next=chosen?selection.filter(id=>id!==u.id):selection.length<5?[...selection,u.id]:selection;o.close();showCrewRegistration(s,next,assignments);});
    o.label(650,y-12,(cars[u.loanCarId]?.shortName||u.loanCarId)+' · '+u.drivetrain+' · '+Math.round(u.powerKW)+' KW',22);
    o.label(1240,y-10,'YOU DRIVE',16);
  });
  const reason=crewSeriesEligibility(s.registry,selection,assignments);
  o.label(90,680,reason||'READY · '+selection.length+' REGISTERED DRIVERS · '+cash(CREW_SERIES.entryFee),19);
  o.btn(300,758,380,'BACK',o.close);
  o.btn(1090,758,600,'REGISTER · '+cash(CREW_SERIES.entryFee),()=>{
    const out=registerCrewSeries(s.registry,selection,assignments);if(out.error){o.label(90,714,out.error,17);return;}
    o.close();if(commit(s,{proCircuit:out.circuit,cash:out.cash}))showCrewFixture(s);
  });
}
export function showCrewFixture(s,selection=null) {
  const c=circuit(s),f=getCrewFixture(c),t=c.activeCrewEvent;if(!f){s.proError='SAVED CREW FIXTURE UNAVAILABLE';redraw(s);return;}
  const o=overlay(s,`CREW CLUB SERIES // FIXTURE ${t.round+1}/3`),units=getCrewSeriesUnits(s.registry,t.assignments).filter(u=>t.squadIds.includes(u.id));
  const chosen=selection||t.squadIds.slice(0,3);
  o.label(90,115,'YOUR CREW vs '+f.opponent.name+' · TWO HEAT WINS TAKE THE FIXTURE',23);
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
      o.label(810,241+i*90,i<prepared.revealed?`${h.ownStatus&&h.ownStatus!=='FINISHED'?h.ownStatus:h.ownSeconds.toFixed(3)+'s'} vs ${h.opponentStatus&&h.opponentStatus!=='FINISHED'?h.opponentStatus:h.opponentSeconds.toFixed(3)+'s'} // ${h.won?'WIN':'LOSS'}`:'AWAITING HEAT',24);
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
      o.label(130,568,`FIXTURE ${wins>=2?'VICTORY':'DEFEAT'} // ${wins} – ${3-wins}`,36);
      o.btn(1070,706,470,'CONFIRM OFFICIAL RESULT',()=>{
        const out=settleCrewSeriesFixture(circuit(s),f.id);if(!['ADVANCED','COMPLETE'].includes(out.status))return;
        o.close();if(commit(s,{proCircuit:out.circuit,cash:Number(s.registry.get('cash')||0)+out.cashPrize}))showCrewResult(s,out);
      });
    }
    o.btn(350,779,450,'SAVE / RETURN TO COMPLEX',o.close);
  }
}
function showCrewResult(s,out) {
  const o=overlay(s,'PROFESSIONAL CIRCUIT'),champion=out.summary?.placing===1;
  const portrait=createCharacterProfile(s,{characterId:s.registry.get('playerCharacterId')||'renMizuno',pose:out.wins>=2?'win':'loss',x:290,y:400,frameWidth:430,frameHeight:480,side:'left',depth:204,flipInward:true});
  if(portrait)o.add(portrait);
  o.label(610,205,champion?'SERIES WINNER':out.status==='COMPLETE'?'SERIES COMPLETE':out.wins>=2?'TEAM VICTORY':'TEAM DEFEAT',52);
  o.label(620,305,`FIXTURE SCORE ${out.wins} – ${3-out.wins}`,34);
  o.label(620,385,out.summary?`FINISH #${out.summary.placing} · +${cash(out.cashPrize)}\nTEAM RANK #${out.summary.rankBefore} → #${out.summary.rankAfter}\n+${out.summary.points} SEASON POINTS`:`NEXT: FIXTURE ${out.circuit.activeCrewEvent.round+1}/3\nYour crew and results are saved.`,24);
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
  o.label(90,555,'EVENT HISTORY: '+(c.calendar.history.map(h=>h.label+' #'+h.placing).join(' / ')||'No completed events yet.'),18);
  const last=c.calendar.archives.at(-1);if(last)o.label(90,642,`PREVIOUS SEASON ${last.season}: DRIVER #${last.drivers.findIndex(r=>r.id==='player:driver')+1} · CREW #${last.teams.findIndex(r=>r.id==='player:team')+1}`,18);
  o.btn(310,758,390,'RETURN',o.close);
  if(complete)o.btn(1100,758,570,'BEGIN SEASON '+(c.season+1),()=>{if(s.registry.get('competitionState')?.active)return;const out=nextProfessionalSeason(circuit(s));if(out.circuit){o.close();if(commit(s,{proCircuit:out.circuit}))redraw(s);}});
}
