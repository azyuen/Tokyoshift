// Career v1: qualification, report and replay are separate durable transitions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultProCircuitState} from '../src/data/proCircuit.js';
import {
  completeSeasonRound,getProQualification,getProfessionalSeasonReport,
  nextProfessionalSeason,startProfessionalSeason,forfeitProfessionalSeason,claimProfessionalSeasonBonus,
} from '../src/data/proSeason.js';

const venue=readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
const panel=readFileSync(new URL('../src/ui/ProSeasonPanel.js',import.meta.url),'utf8');
function runSeason(schedule,points=20){
  let c=createDefaultProCircuitState();
  c.seasonStatus='ACTIVE';
  for(const discipline of schedule) {
    const record=discipline==='DRIVER'?'playerDriver':'playerTeam';
    c[record].seasonPoints+=points;
    c[record].entered++;
    const summary={id:'season'+c.season+':r'+c.calendar.round,
      label:discipline==='DRIVER'?'DRIVER EVENT':'CREW EVENT',
      discipline,points,placing:points===20?1:3};
    c=completeSeasonRound(c,summary);
  }
  return c;
}

test('qualification requires BOTH targets and all eight completed rounds for Tokyo entry',()=>{
  const c=runSeason(['DRIVER','TEAM','DRIVER','TEAM','DRIVER']);
  const q=getProQualification(c),report=getProfessionalSeasonReport(c);
  assert.equal(q.qualified,true);
  assert.equal(report.completed,false);
  assert.equal(report.canEnterTokyo,false);
  assert.equal(report.outcome,'IN_PROGRESS');
  assert.equal(report.driver,60);
  assert.equal(report.crew,40);
  assert.equal(report.roundsRemaining,3);
});

test('qualified finished season has standings, records and explicit Tokyo entry',()=>{
  const schedule=['DRIVER','TEAM','DRIVER','TEAM','DRIVER','TEAM','DRIVER','TEAM'];
  const c=runSeason(schedule);
  assert.equal(c.calendar.round,8);
  assert.equal(c.seasonStatus,'COMPLETE');
  const report=getProfessionalSeasonReport(c);
  assert.equal(report.outcome,'QUALIFIED');
  assert.equal(report.completed,true);
  assert.equal(report.canEnterTokyo,true);
  assert.equal(report.driver,80);
  assert.equal(report.crew,80);
  assert.equal(report.eventCount,8);
  assert.ok(report.driverStanding>=1);
  assert.ok(report.crewStanding>=1);
  const duplicate=completeSeasonRound(c,c.calendar.history.at(-1));
  assert.deepEqual(duplicate,c,'last-round report is idempotent');
  assert.ok(nextProfessionalSeason(c).error,'qualified season cannot skip championship');
  c.activeChampionship={id:'tokyo:s1',season:1,completed:true,championId:'player:driver'};
  const paid=claimProfessionalSeasonBonus(c);
  assert.ok(paid.circuit);
  const reset=nextProfessionalSeason(paid.circuit);
  assert.ok(reset.circuit,reset.error);
  assert.equal(reset.circuit.season,2);
  assert.equal(reset.circuit.seasonStatus,'OPEN');
  assert.equal(reset.circuit.calendar.archives.length,1);
  assert.equal(reset.circuit.championshipHistory.length,1);
  assert.equal(reset.circuit.playerDriver.seasonPoints,0);
  assert.equal(reset.circuit.playerTeam.seasonPoints,0);
});

test('failed finished season reports shortfall and safely reopens the circuit',()=>{
  const c=runSeason(Array(8).fill('DRIVER'));
  const report=getProfessionalSeasonReport(c);
  assert.equal(report.outcome,'NOT_QUALIFIED');
  assert.equal(report.canEnterTokyo,false);
  assert.equal(report.driverShortfall,0);
  assert.equal(report.crewShortfall,40);
  const paid=claimProfessionalSeasonBonus(c);
  assert.ok(paid.circuit);
  const reset=nextProfessionalSeason(paid.circuit);
  assert.ok(reset.circuit,reset.error);
  assert.equal(reset.circuit.seasonStatus,'OPEN');
  assert.equal(reset.circuit.calendar.archives.length,1);
  assert.equal(reset.circuit.calendar.archives[0].season,1);
  assert.ok(startProfessionalSeason(reset.circuit).circuit,'player can enter next season');
});

test('when qualification becomes impossible, the player may still finish the calendar',()=>{
  const seven=runSeason(Array(7).fill('DRIVER'));
  const report=getProfessionalSeasonReport(seven);
  assert.equal(report.outcome,'UNREACHABLE');
  assert.equal(report.completed,false);
  assert.equal(report.qualificationPossible,false);
  assert.equal(report.roundsRemaining,1);
  const finished=completeSeasonRound(seven,{id:'last',discipline:'TEAM',
    label:'CREW FINAL',placing:1,points:20});
  assert.equal(getProfessionalSeasonReport(finished).outcome,'NOT_QUALIFIED');
});

test('forfeit remains separate from completion and preserves permanent progress',()=>{
  const c=runSeason(['DRIVER','TEAM']);
  c.trophyWins.shutoSpeed=1;
  const out=forfeitProfessionalSeason(c);
  assert.ok(out.circuit,out.error);
  assert.equal(out.circuit.seasonStatus,'OPEN');
  assert.equal(out.circuit.trophyWins.shutoSpeed,1);
  assert.equal(out.circuit.calendar.archives.at(-1).forfeited,true);
});

test('venue shows completed reports, without locking the player on a selected card',()=>{
  const menu=venue.slice(venue.indexOf('getProDragEvents() {'),venue.indexOf('drawDragComplex() {'));
  assert.match(menu,/if\(round>=8\)/);
  assert.match(menu,/id:'seasonDrivers'/);
  assert.match(menu,/id:'seasonCrews'/);
  assert.match(menu,/id:'seasonResults'/);
  assert.match(menu,/this\._seasonReportSelected!==pro\.season/);
  assert.match(panel,/VIEW FINAL SEASON REPORT/);
  assert.match(panel,/VIEW OFFICIAL SEASON REPORT/);
  assert.match(panel,/TOKYO CHAMPIONSHIP \/\/ QUALIFIED/);
  assert.match(panel,/PRO SEASON \/\/ NOT QUALIFIED/);
  assert.match(panel,/RESUME TOKYO CHAMPIONSHIP/);
  assert.match(panel,/RETURN TO OPEN CIRCUIT/);
});
