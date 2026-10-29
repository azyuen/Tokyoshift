import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getProfessionalDuelRound,settleProfessionalDuel} from '../src/data/proDragDuel.js';
import {
  driverAdviceStatus,consumeDriverAdvice,isOpenDriverBriefing,
  getProDriverHelmetIndex,
} from '../src/data/proDriverBriefing.js';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const race=source('src/scenes/FourLaneTestScene.js');
const briefing=source('src/ui/ProDriverBriefing.js');
const controller=source('src/scenes/CentralTokyoScene.js');

const rounds=[
  {characterId:'a',opponentName:'Takeshi Mori',carId:'r32',paintColor:0xd04a59},
  {characterId:'b',opponentName:'Keisuke Toda',carId:'rx7fd',paintColor:0xd04a59},
  {characterId:'c',opponentName:'Ayumi Tanaka',carId:'evo6',paintColor:0xd04a59},
];
const paid=()=>({
  active:true,proEvent:true,openCircuit:true,
  playerCarId:'gc8',eventId:'tokyoInvitational',proSeasonId:'open:tokyoInvitational:s1:e1',
  roundIndex:0,rounds,briefingRules:{maxPowerKW:600,noNos:false,stock:false},
});

test('QUALIFIED uses the settled, saved next round (not the current opponent)',()=>{
  const current=paid();
  const outcome=settleProfessionalDuel(current,true);
  assert.equal(outcome.status,'ADVANCED');
  assert.equal(outcome.nextState.roundIndex,1);
  assert.equal(getProfessionalDuelRound(outcome.nextState)?.round.opponentName,'Keisuke Toda');
  assert.ok(isOpenDriverBriefing(outcome.nextState));
  assert.match(race,/this\.drawProfessionalNextOpponentCard\(this\.registry\.get\('competitionState'\),depth\+3\)/);
  assert.match(race,/const next = getProfessionalDuelRound\(nextState\)/);
  assert.match(race,/String\(round\.opponentName \|\| rival\.name/);
  assert.match(race,/String\(car\.name \|\| car\.shortName \|\| round\.carId\)/);
  assert.match(race,/const rule = nextState\.briefingRules \|\| \{\}/);
  assert.equal(getProDriverHelmetIndex(outcome.nextState,rounds[1]),
    getProDriverHelmetIndex(outcome.nextState,rounds[1]));
});

test('rank badge is a true circle and compact next-rival parallelogram fits between results and buttons',()=>{
  assert.match(race,/const rankBadge = this\.add\.circle\(470, 557, 66/);
  assert.doesNotMatch(race,/const rankBadge = this\.add\.ellipse/);
  assert.match(race,/new Phaser\.Geom\.Point\(583,533\)/);
  assert.match(race,/new Phaser\.Geom\.Point\(1163,690\)/);
  assert.match(race,/new Phaser\.Geom\.Point\(590,569\)/);
  assert.match(race,/NEXT OPPONENT/);
  assert.match(race,/getProCircuitGenericDriverAsset\(index\)/);
  assert.match(race,/getCharacterVisualAsset\(nextRound\.characterId, 'idle'/);
  assert.ok(470+66<552,'circular rank badge must not touch the next-opponent panel');
  assert.ok(1191<1363-141,'opponent card must leave room for action buttons');
  assert.ok(533>384+3*40,'result table does not overlap the next-opponent panel');
  assert.ok(609+24<678-24,'briefing and next-heat buttons have a visible gap');
});

test('NEXT HEAT skips preparation; RACE BRIEFING opens saved paid preparation room',()=>{
  assert.match(race,/const paidNextDriver = advanced && duel &&/);
  assert.match(race,/if\(briefing && paidNextDriver\)\{\s*this\.scene\.start\('CentralTokyoScene',\{\s*locationId:'tokyoDragComplex',autoOpenProDriverBriefing:true,/);
  assert.match(race,/else if \(paidNextDriver\) \{\s*this\.scene\.restart\(\{mode:'PRO_DUEL'\}\)/);
  assert.match(race,/const advance = \(\) => navigate\(false\)/);
  assert.match(race,/\.on\('pointerdown',\(_pointer,_x,_y,event\)=>\{\s*event\?\.stopPropagation\?\.\(\);navigate\(true\)/);
  assert.match(race,/this\.add\.text\(1363,609,'RACE BRIEFING'/);
  assert.match(race,/this\.add\.rectangle\(1363,678,282,48/);
  assert.match(controller,/autoOpenProDriverBriefing/);
  assert.match(controller,/showOpenCircuitDriverBriefing/);
});

test('Sayaka can be consulted after any paid heat if the shared once-per-event allowance is unused',()=>{
  const state={...paid(),roundIndex:1};
  const circuit={eventTick:3,crewAdviceCooldownUntil:0};
  assert.equal(driverAdviceStatus(circuit,state).available,true);
  const first=consumeDriverAdvice(circuit,state);
  assert.equal(first.error,undefined);
  assert.equal(first.competitionState.briefingAdviceUsed,true);
  assert.equal(first.circuit.crewAdviceCooldownUntil,6);
  assert.match(consumeDriverAdvice(first.circuit,first.competitionState).error,/ALREADY USED/);
  assert.equal(driverAdviceStatus({eventTick:3,crewAdviceCooldownUntil:5},state).available,false);
  assert.doesNotMatch(briefing,/!advice\.available\|\|!firstHeat/);
  assert.match(briefing,/disabled:!advice\.available&&!advice\.usedThisEvent/);
  assert.match(briefing,/if\(advice\.usedThisEvent\)\{toggleDialogue\('sayaka'\);return;\}/);
});

test('no next-opponent teaser or prep choice after final win or elimination',()=>{
  const finalState={...paid(),roundIndex:2};
  const win=settleProfessionalDuel(finalState,true);
  const loss=settleProfessionalDuel(finalState,false);
  assert.equal(win.status,'CHAMPION');
  assert.equal(loss.status,'ELIMINATED');
  assert.equal(win.nextState,null);
  assert.equal(loss.nextState,null);
  assert.match(race,/if\(paidNextDriver\)\{/);
  assert.match(race,/if\s*\(!next \|\| !cars\[next\.round\.carId\]\) return false/);
});
