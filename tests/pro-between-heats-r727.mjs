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

test('rank badge, next rival card and action buttons have non-overlapping layout',()=>{
  assert.match(race,/const rankBadge = this\\.add\\.circle\\(individualHeatPreview \\? 492 : 470/);
  assert.doesNotMatch(race,/const rankBadge = this\\.add\\.ellipse/);
  assert.match(race,/new Phaser\\.Geom\\.Point\\(52\\+654\\+25\\+dx\\+55,643\\+dy\\)/);
  assert.match(race,/new Phaser\\.Geom\\.Point\\(52\\+654-25\\+dx\\+55,643\\+164\\+dy\\)/);
  assert.match(race,/NEXT OPPONENT/);
  assert.match(race,/getProCircuitGenericDriverAsset\\(index\\)/);
  assert.match(race,/getCharacterVisualAsset\\(nextRound\\.characterId, 'idle'/);
  const cardTop=643-122,cardRight=52+654+25+28+55;
  assert.ok(412+66<cardTop,'ranking circle must not cover the opponent card');
  assert.ok(cardRight<1059-141,'card must not touch briefing button');
  assert.ok(cardTop>384+3*40,'results table must end above the opponent card');
  assert.ok(1059+141<1370-141,'briefing and next-heat actions need horizontal spacing');
});
test('NEXT HEAT skips preparation; RACE BRIEFING opens saved paid preparation room',()=>{
  assert.match(race,/const paidNextDriver = individualHeatPreview;/);
  assert.match(race,/if\(briefing && paidNextDriver\)\{\s*this\.scene\.start\('CentralTokyoScene',\{\s*locationId:'tokyoDragComplex',autoOpenProDriverBriefing:true,/);
  assert.match(race,/else if \(paidNextDriver\) \{\s*this\.scene\.restart\(\{mode:'PRO_DUEL'\}\)/);
  assert.match(race,/const advance = \(\) => navigate\(false\)/);
  assert.match(race,/\.on\('pointerdown',\(_pointer,_x,_y,event\)=>\{\s*event\?\.stopPropagation\?\.\(\);navigate\(true\)/);
  assert.match(race,/this\.add\.text\(1059,637,'RACE BRIEFING'/);
  assert.match(race,/this\.add\.rectangle\(paidNextDriver \? 1370 : 1363,paidNextDriver \? 637 : 678,282,48/);
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
