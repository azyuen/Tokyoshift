import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultGameState} from '../src/state/GameState.js';
import {recruitRandomDevCrew} from '../src/data/crewSystem.js';
import {
 registerCrewSeries,getCrewSeriesUnits,getCrewFixture,preparePlayerCrewFixture,
 getPlayerCrewHeat,settlePlayerCrewHeat,useProCrewAdvice,
} from '../src/data/proSeason.js';
import {usesPrepaidDriverBriefing,isOpenDriverBriefing} from '../src/data/proDriverBriefing.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const crewUI=read('../src/ui/ProCrewBattleLineup.js');
const driverUI=read('../src/ui/ProDriverBriefing.js');
const crewPanel=read('../src/ui/ProSeasonPanel.js');
const track=read('../src/scenes/FourLaneTestScene.js');
const complex=read('../src/scenes/CentralTokyoScene.js');

function registry(){
  const map=new Map(Object.entries({...createDefaultGameState(),devMode:true,cash:10000000}));
  const s={get:k=>map.get(k),set:(k,v)=>map.set(k,v)};
  recruitRandomDevCrew(s,()=>.2);
  return s;
}

test('R605 a crew event can be fully previewed without paying, before atomic grid registration',()=>{
  const s=registry(),cash=s.get('cash');
  const units=getCrewSeriesUnits(s),ids=units.map(u=>u.id);
  const opened=registerCrewSeries(s,ids);
  assert.equal(opened.error,undefined,opened.error);
  assert.equal(s.get('cash'),cash);
  assert.equal(s.get('proCircuit').activeCrewEvent,null);
  const wrapped={get:key=>key==='proCircuit'?opened.circuit:s.get(key)};
  const f=getCrewFixture(opened.circuit);
  assert.ok(f?.opponent?.drivers?.[0]?.carId);
  const consultation=useProCrewAdvice(wrapped,opened.circuit.activeCrewEvent.id);
  assert.equal(consultation.error,undefined,consultation.error);
  assert.equal(s.get('proCircuit').crewAdviceCooldownUntil,0);
  const stage=preparePlayerCrewFixture(wrapped,ids.slice(0,3),f.id);
  assert.equal(stage.error,undefined,stage.error);
  assert.ok(getPlayerCrewHeat(stage.circuit));
  // Payment is a separate explicit, single save at Go to Grid:
  s.set('proCircuit',stage.circuit);s.set('cash',opened.cash);
  assert.equal(s.get('cash'),cash-opened.circuit.activeCrewEvent.entryFee);
});
test('R605 saved crew result returns to same locked briefing for the next heat',()=>{
  const s=registry(),ids=getCrewSeriesUnits(s).map(u=>u.id);
  const reg=registerCrewSeries(s,ids),wrapped={get:key=>key==='proCircuit'?reg.circuit:s.get(key)};
  const f=getCrewFixture(reg.circuit),out=preparePlayerCrewFixture(wrapped,ids.slice(0,3),f.id);
  const heat=getPlayerCrewHeat(out.circuit);
  const settled=settlePlayerCrewHeat(out.circuit,heat.id,[
    {id:'player',finishSeconds:12.3,disqualified:false},
    {id:'ai-1',finishSeconds:12.5,disqualified:false},
  ]);
  assert.equal(settled.status,'CREW_HEAT');
  assert.equal(getPlayerCrewHeat(settled.circuit).index,1);
  assert.equal(settled.circuit.activeCrewEvent.fixture.revealed,1);
  assert.match(crewPanel,/lockedLineup:\[\.\.\.ids\]/);
  assert.match(crewPanel,/const lineup=t\.lockedLineup\|\|f\.prepared\?\.lineup\|\|null/);
  assert.match(crewUI,/if\(!locked\)footerButton\(1196/);
  assert.match(crewUI,/unpaid\?'GO TO GRID \/\/ ¥'/);
  assert.match(crewUI,/'NEXT HEAT'/);
  assert.match(track,/autoOpenProCrewFixture:true/);
});

test('R605 Hiroshi identifies next driver and car, advice cooldown is compact',()=>{
  assert.match(crewUI,/\['NEXT DRIVER'/);
  assert.match(crewUI,/\['NEXT CAR'/);
  assert.match(driverUI,/\['NEXT DRIVER'/);
  assert.match(driverUI,/\['NEXT CAR'/);
  assert.match(driverUI,/advice\.remaining\+' EVENT COOLDOWN'/);
  assert.match(crewUI,/adviceRemaining\+' EVENT COOLDOWN'/);
  assert.doesNotMatch(crewUI,/AVAILABLE AFTER '\+adviceRemaining/);
  assert.match(driverUI,/One consultation covers this event/);
  assert.match(crewUI,/One consultation covers this event/);
  assert.match(crewPanel,/adviceText:eventAdvice/);
});

test('R605 first briefing is free; paid driver heats and trophy heats go straight to Next Heat',()=>{
  assert.match(driverUI,/unpaid\?'CANCEL ENTRY':'FORFEIT EVENT'/);
  assert.match(driverUI,/const eligibleGridLabel = unpaid\?'GO TO GRID/);
  assert.doesNotMatch(driverUI,/PAY ONLY WHEN YOU PROCEED/);
  assert.equal(usesPrepaidDriverBriefing({
    openCircuit:true,trophyId:'tokyoTechnical',team:false,opponentRatings:[4,4,5,5,5]
  }),true);
  assert.equal(isOpenDriverBriefing({active:true,proEvent:true,openCircuit:true,
    openTrophyId:'tokyoTechnical',roundIndex:0,rounds:[{carId:'r32'}]}),true);
  assert.match(track,/NEXT HEAT/);
  assert.match(track,/REVIEW FIXTURE/);
  assert.match(complex,/autoOpenProDriverBriefing/);
});

test('R605 right-side event listings have no duplicate entry fees',()=>{
  assert.match(crewPanel,/const concise=lines\.filter/);
  assert.match(crewPanel,/ENTER EVENT BRIEFING/);
  assert.match(complex,/canEnter \? proEventEntryLabel\(event\.entryFee\)/);
  assert.match(crewPanel,/showUnpaidCrewBriefing\(s,pending,\[\]\)/);
  assert.match(crewPanel,/commit\(s,\{proCircuit:prepared\.circuit,cash:verified\.cash\}\)/);
});
