import { CREW_SERIES, PRO_SEASON_LENGTH, getSeasonStandings, getCrewSeriesUnits, crewSeriesEligibility, registerCrewSeries, getCrewFixture, prepareCrewSeriesFixture, revealCrewSeriesHeat, settleCrewSeriesFixture, getCrewSeriesTable, nextProfessionalSeason } from '../data/proSeason.js?v=20261010-r469';
import { normaliseProCircuitState, getProCircuitDriverSeeds, getProCircuitTeamSeeds } from '../data/proCircuit.js?v=20261010-r469';
import { saveProTransaction } from '../state/GameState.js?v=20261010-r469';
import { cars } from '../data/cars.js?v=20261006-r388';
import { characters } from '../data/characters.js?v=20261010-r459';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261007-r411';
const FONT='"Exo 2", sans-serif';
const cash=n=>'¥'+Number(n||0).toLocaleString('en-US');
const circuit=s=>normaliseProCircuitState(s.registry.get('proCircuit'));
const redraw=s=>s.renderLocation(s.activeLocationId);
function commit(s,changes) {try{saveProTransaction(s.registry,changes);s.proError=null;return true;}catch(e){s.proError=e.message;redraw(s);return false;}}
function text(s,x,y,value,size=16,extra={}) {return s.addContent(s.add.text(x,y,value,{fontFamily:FONT,fontSize:size+'px',fontStyle:'700',color:'#e5e0df',...extra}).setDepth(40));}
function button(s,x,y,w,label,action,enabled=true) {
  const b=s.addContent(s.add.rectangle(x,y,w,46,enabled?0x551d25:0x211e22).setStrokeStyle(2,enabled?0xda505a:0x635d60).setDepth(39));
  text(s,x,y,label,14).setOrigin(.5);
  if(enabled)b.setInteractive({useHandCursor:true}).on('pointerdown',action);
}
export function drawSeasonHeader(s,side) {
  const c=circuit(s),driver=getProCircuitDriverSeeds(c).find(r=>r.id==='player:driver'),team=getProCircuitTeamSeeds(c).find(r=>r.id==='player:team');
  text(s,side.x+20,side.y+117,`SEASON ${c.season} // ROUND ${Math.min(8,c.calendar.round+1)}/8`,16);
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
  const lines=['TEAM COMPETITION // MANAGER','4 TEAMS · 3 ROUND-ROBIN FIXTURES','REGISTER 3–5 DRIVERS · FIELD 3','2 OF 3 HEATS WINS EACH FIXTURE','3 POINTS PER FIXTURE WIN','TIES: HEAT DIFFERENCE, THEN SEED',`ENTRY ${cash(CREW_SERIES.entryFee)}`,'1ST ¥210,000 · 2ND ¥90,000','3RD ¥40,000 · 4TH ¥0','AFTER FIRST TITLE: 65% PURSES'];
  if(t){lines.push(`FIXTURE ${t.round+1}/3 · ${f?.opponent.name||'SAVE NEEDS RECOVERY'}`);lines.push(...getCrewSeriesTable(t).map(r=>`${r.name} · ${r.points} PTS`));}
  else lines.push('CREW SKILL + CURRENT CAR TUNING','GARAGE BREAKS BETWEEN FIXTURES');
  text(s,side.x+20,side.y+250,lines.join('\n'),14,{lineSpacing:3,wordWrap:{width:side.w-38}});
  const reason=t?(f?'SAVED SQUAD · NO RE-ENTRY FEE':'INVALID SAVED FIXTURE · NO MONEY CHANGED'):!ready?'COMPLETE ONE PRO EVENT TO UNLOCK':!canEnter?'FINISH ACTIVE EVENT / CHECK CASH':'SELECT YOUR SQUAD ON ENTRY';
  text(s,side.x+20,side.y+540,reason,12,{color:'#e89da3',wordWrap:{width:side.w-38}});
  button(s,side.x+side.w/2,side.y+590,side.w-36,t?'RESUME CREW SERIES':'ENTER / SELECT SQUAD',()=>t?showCrewFixture(s):showCrewRegistration(s),t?!!f:canEnter);
  return true;
}
function overlay(s,title) {
  if(s._proOverlayClose)s._proOverlayClose();
  const nodes=[];let closed=false;const add=o=>{nodes.push(o);return o;};
  add(s.add.rectangle(780,420,1560,840,0x09080b,.98).setDepth(200).setInteractive());
  add(s.add.text(90,62,title,{fontFamily:FONT,fontSize:'30px',fontStyle:'900 italic',color:'#fff4f2'}).setDepth(201));
  const label=(x,y,v,size=20)=>add(s.add.text(x,y,v,{fontFamily:FONT,fontSize:size+'px',color:'#e8e1df',wordWrap:{width:1320}}).setDepth(202));
  const btn=(x,y,w,v,fn)=>{const b=add(s.add.rectangle(x,y,w,48,0x5d1d27).setStrokeStyle(2,0xd8515b).setDepth(202).setInteractive({useHandCursor:true}));label(x,y,v,17).setOrigin(.5);b.on('pointerdown',()=>{if(!closed)fn();});return b;};
  const close=()=>{if(closed)return;closed=true;nodes.forEach(n=>n.destroy());s._proOverlayClose=null;};s._proOverlayClose=close;
  s.events.once('shutdown',close);
  return {add,label,btn,close};
}
export function showCrewRegistration(s,selection=[],assignments={}) {
  const o=overlay(s,'REGISTER SQUAD // CREW CLUB SERIES'),units=getCrewSeriesUnits(s.registry,assignments),owned=s.registry.get('ownedCarIds')||[];
  o.label(90,115,'Select 3–5 recruited drivers. Tap a car to cycle owned cars. Tune the chosen cars in the garage between fixtures.',18);
  units.forEach((u,i)=>{
    const chosen=selection.includes(u.id),y=187+i*65;
    o.btn(345,y,500,(chosen?'✓ ':'')+u.name,()=>{const next=chosen?selection.filter(id=>id!==u.id):selection.length<5?[...selection,u.id]:selection;o.close();showCrewRegistration(s,next,assignments);});
    const eligible=owned.filter(id=>cars[id]&&(!cars[id].crewLoan||id===u.loanCarId));
    o.btn(920,y,550,(cars[u.carId]?.shortName||u.carId)+' · '+u.drivetrain+' · '+Math.round(u.powerKW)+' KW',()=>{const next={...assignments,[u.id]:eligible[(eligible.indexOf(u.carId)+1)%eligible.length]};o.close();showCrewRegistration(s,selection,next);});
    o.label(1240,y-10,'SKILL '+Math.round(u.skill*100),16);
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
    o.label(90,158,'Select three drivers in racing order. Car tuning is read when you lock the lineup.',18);
    units.forEach((u,i)=>{
      o.btn(345,235+i*70,500,(chosen.includes(u.id)?chosen.indexOf(u.id)+1+'. ':'')+u.name+' / '+cars[u.carId]?.shortName,()=>{const next=chosen.includes(u.id)?chosen.filter(id=>id!==u.id):chosen.length<3?[...chosen,u.id]:chosen;o.close();showCrewFixture(s,next);});
    });
    f.opponent.drivers.forEach((u,i)=>o.label(770,232+i*96,`HEAT ${i+1}: ${cars[u.carId]?.shortName}\nSKILL ${Math.round(u.skill*100)} · PERFORMANCE ${Math.round(u.performance)}`,23));
    o.label(90,650,'Current table: '+getCrewSeriesTable(t).map(r=>r.name+' '+r.points).join('  /  '),18);
    o.btn(300,754,410,'RETURN / GARAGE BREAK',o.close);
    o.btn(1080,754,580,'LOCK LINEUP / WATCH',()=>{const out=prepareCrewSeriesFixture(s.registry,chosen,f.id);if(out.error){o.label(90,690,out.error,18);return;}o.close();if(commit(s,{proCircuit:out.circuit}))showCrewFixture(s);});
  } else {
    const prepared=f.prepared;
    o.label(90,166,'SIMULATED VIEW · CREW SKILL + REAL TUNED CAR PERFORMANCE · RESULTS LOCKED BEFORE VIEWING',18);
    prepared.heats.forEach((h,i)=>{
      o.label(120,241+i*90,`HEAT ${i+1} · ${h.name} / ${cars[h.carId]?.shortName}`,22);
      o.label(810,241+i*90,i<prepared.revealed?`${h.ownSeconds.toFixed(3)}s vs ${h.opponentSeconds.toFixed(3)}s // ${h.won?'WIN':'LOSS'}`:'AWAITING HEAT',24);
    });
    if(prepared.revealed<3){
      o.btn(400,677,430,'WATCH NEXT HEAT',()=>{o.close();watchCrewHeat(s,f);});
      o.btn(1110,677,430,'SKIP TO RESULT',()=>{const out=revealCrewSeriesHeat(circuit(s),f.id,true);o.close();if(out.circuit&&commit(s,{proCircuit:out.circuit}))showCrewFixture(s);});
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
function watchCrewHeat(s,f) {
  const h=f.prepared.heats[f.prepared.revealed],o=overlay(s,'SIMULATED HEAT '+(f.prepared.revealed+1)+' // '+h.name);
  o.label(90,116,'Lightweight replay of the locked fixture result. Skip and watch produce the same official outcome.',18);
  let finished=false;const bars=[];
  [h.ownSeconds,h.opponentSeconds].forEach((seconds,i)=>{
    const y=290+i*155;o.label(120,y-48,i===0?h.name:f.opponent.name+' · '+(f.prepared.revealed+1),23);
    o.add(s.add.rectangle(770,y,1240,52,0x222126).setStrokeStyle(1,0x555257).setDepth(202));
    const bar=o.add(s.add.rectangle(155,y,1,36,i===0?0xd74652:0xbfbabb).setOrigin(0,.5).setDepth(203));bars.push(bar);
    s.tweens.add({targets:bar,width:1200,duration:seconds/Math.max(h.ownSeconds,h.opponentSeconds)*5500,ease:'Linear'});
    o.label(1200,y+45,seconds.toFixed(3)+'s',25);
  });
  const done=()=>{if(finished)return;finished=true;s.tweens.killTweensOf(bars);o.close();const out=revealCrewSeriesHeat(circuit(s),f.id);if(out.circuit&&commit(s,{proCircuit:out.circuit}))showCrewFixture(s);};
  const timer=s.time.delayedCall(5700,done);
  o.btn(1120,724,470,'FAST FORWARD',()=>{timer.remove();done();});
}
function showCrewResult(s,out) {
  const o=overlay(s,'PROFESSIONAL CIRCUIT'),champion=out.summary?.placing===1;
  const portrait=createCharacterProfile(s,{characterId:s.registry.get('playerCharacterId')||'renMizuno',pose:out.wins>=2?'win':'loss',x:290,y:400,frameWidth:430,frameHeight:480,side:'left',depth:204,flipInward:true});
  if(portrait?.image)o.add(portrait.image);
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
