// Career v1: one unified Tokyo title, once-only awards, and persistent Office records.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultProCircuitState,normaliseProCircuitState} from '../src/data/proCircuit.js';
import {nextProfessionalSeason} from '../src/data/proSeason.js';
import {CUTSCENES} from '../src/data/cutscenes.js';
import {
  createProvisionalChampionship,settleChampionshipKnockout,
  getChampionshipKnockoutHeat,settleChampionshipCrewHeat,
  getChampionshipCrewHeat,getChampionshipFourWideHeat,
  settleChampionshipFourWideHeat,championshipStandings,
  settleTokyoChampionship,getTokyoCareerRecord,
  TOKYO_CHAMPIONSHIP_PURSES,
} from '../src/data/tokyoChampionship.js';
import {getOfficeTrophyRecord,getOfficeTrophyLines} from '../src/data/officeTrophies.js';
import {GINZA_LISTINGS, MARKET_BASE_PRICES} from '../src/data/centralTokyo.js';
const race=readFileSync(new URL('../src/scenes/FourLaneTestScene.js',import.meta.url),'utf8');
const panel=readFileSync(new URL('../src/ui/ProSeasonPanel.js',import.meta.url),'utf8');
const venue=readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
const office=readFileSync(new URL('../src/ui/OfficePanel.js',import.meta.url),'utf8');
const PLAYER='player:driver';
function registered(){
  const c=createDefaultProCircuitState();
  c.seasonStatus='COMPLETE';c.calendar.round=8;c.playerDriver.seasonPoints=60;
  c.playerTeam.seasonPoints=40;
  const out=createProvisionalChampionship(c);
  assert.ok(out.championship,out.error);
  c.activeChampionship=out.championship;
  return c;
}
function complete(c,knockoutWins,crewWins,fourPlace) {
  let s=structuredClone(c.activeChampionship);
  let count=0;
  while(s.stage==='KNOCKOUT'){
    assert.ok(getChampionshipKnockoutHeat(s));
    s=settleChampionshipKnockout(s,knockoutWins);
    assert.ok(++count<=4);
  }
  for(let i=0;i<3;i++) {
    const heat=getChampionshipCrewHeat(s);
    assert.equal(heat.index,i);
    s=settleChampionshipCrewHeat(s,{carId:'crew-car-'+i,
      won:i<crewWins,opponentId:heat.opponent.id});
  }
  count=0;
  while(s.stage==='FOUR_WIDE'){
    const heat=getChampionshipFourWideHeat(s);
    assert.ok(heat);
    const others=heat.entrants.filter(id=>id!==PLAYER);
    others.splice(fourPlace-1,0,PLAYER);
    s=settleChampionshipFourWideHeat(s,heat.id,others.map((id,i)=>({
      id,finishSeconds:10+i*.2,disqualified:false,
    })));
    assert.ok(++count<=3);
  }
  assert.equal(s.stage,'COMPLETE');
  c.activeChampionship=s;
  return c;
}

test('endgame prizes scale tenfold by placing, remain progressive, and fund collector goals',()=>{
  assert.equal(TOKYO_CHAMPIONSHIP_PURSES.length,16);
  assert.deepEqual(TOKYO_CHAMPIONSHIP_PURSES,[
    10000000,5000000,3000000,1750000,
    1000000,1000000,1000000,1000000,
    500000,500000,500000,500000,500000,500000,500000,500000,
  ]);
  assert.ok(TOKYO_CHAMPIONSHIP_PURSES.every((p,i,a)=>
    Number.isSafeInteger(p)&&p>=0&&(i===0||p<=a[i-1])));
  const leastCollector=Math.min(...GINZA_LISTINGS.map(car=>car.price));
  assert.equal(leastCollector,28000000);
  assert.ok(TOKYO_CHAMPIONSHIP_PURSES[0]<leastCollector,
    'one title must not purchase even the cheapest collector car unaided');
  assert.ok(TOKYO_CHAMPIONSHIP_PURSES[0]>
    MARKET_BASE_PRICES.r34,'title winner should be able to afford a strong standard car');
});

test('Tokyo seeding values 70% Driver + 30% Crew results and locks a season snapshot',()=>{
  const c=registered();
  const initial=c.activeChampionship;
  const player=initial.entrants.find(e=>e.id===PLAYER);
  assert.equal(player.seasonSeedScore,1);
  assert.equal(initial.entrants.filter(e=>e.characterId).length,7);
  const key='pro:driver:01';
  assert.ok(c.drivers[key]);
  const team=c.teams[c.drivers[key].teamId];
  assert.ok(team);
  c.activeChampionship=null;
  c.drivers[key].seasonPoints=120;
  team.seasonPoints=120;
  const next=createProvisionalChampionship(c);
  assert.ok(next.championship,next.error);
  const selected=next.championship.entrants.find(e=>e.id===key);
  assert.ok(selected,'top season performer enters Tokyo draw');
  assert.equal(selected.seasonSeedScore,2.3);
  assert.equal(selected.seed,1);
  // The old created draw never changes after standings move.
  assert.equal(initial.entrants.find(e=>e.id===PLAYER).seasonSeedScore,1);
});

test('championship retains 16 entrants and all three actual scoring stages',()=>{
  const c=complete(registered(),true,3,1);
  const rows=championshipStandings(c.activeChampionship);
  assert.equal(rows.length,16);
  assert.ok(rows.every(r=>r.total>=0&&r.total<=80));
  assert.equal(rows[0].id,c.activeChampionship.championId);
  assert.equal(c.activeChampionship.crew.results.length,3);
  assert.equal(c.activeChampionship.fourWide.results.length,3);
});

test('true Tokyo Champion receives durable title and correct purse exactly once',()=>{
  const c=complete(registered(),true,3,1);
  const award=settleTokyoChampionship(c);
  assert.ok(award.circuit,award.error);
  const won=award.result.playerChampion;
  assert.equal(won,award.result.championId===PLAYER);
  assert.equal(award.result.playerPlace,championshipStandings(c.activeChampionship).findIndex(r=>r.id===PLAYER)+1);
  assert.equal(award.cashPrize,TOKYO_CHAMPIONSHIP_PURSES[award.result.playerPlace-1]);
  assert.equal(award.circuit.tokyoChampionWins,won?1:0);
  assert.equal(award.circuit.careerCompleted,won);
  assert.equal(award.result.podium.length,3);
  const saved=normaliseProCircuitState(JSON.parse(JSON.stringify(award.circuit)));
  assert.equal(saved.championshipSettledIds.length,1);
  const again=settleTokyoChampionship(saved);
  assert.equal(again.cashPrize,0);
  assert.equal(again.alreadySettled,true);
  assert.equal(again.circuit.tokyoChampionWins,award.circuit.tokyoChampionWins);
  assert.equal(again.circuit.championshipHistory.length,1);
  const officeRecord=getOfficeTrophyRecord(again.circuit);
  assert.equal(officeRecord.titles,won?1:0);
  assert.equal(officeRecord.careerCompleted,won);
});

test('a genuine overall Tokyo winner gets ¥10m once, and an unclaimed final blocks rollover',()=>{
  const c=complete(registered(),true,3,1);
  assert.equal(c.activeChampionship.championId,PLAYER,
    'strongest three-stage player result must actually win the Championship');
  assert.match(nextProfessionalSeason(c).error,/CLAIM TOKYO CHAMPIONSHIP AWARDS/);
  const award=settleTokyoChampionship(c);
  assert.ok(award.circuit,award.error);
  assert.equal(award.result.playerPlace,1);
  assert.equal(award.cashPrize,10000000);
  assert.equal(award.circuit.tokyoChampionWins,1);
  const withCash=5000+award.cashPrize;
  assert.equal(withCash,10005000);
  const reload=normaliseProCircuitState(JSON.parse(JSON.stringify(award.circuit)));
  const repeated=settleTokyoChampionship(reload);
  assert.equal(repeated.cashPrize,0);
  assert.equal(repeated.circuit.championshipSettledIds.length,1);
  const next=nextProfessionalSeason(reload);
  assert.ok(next.circuit,next.error);
  assert.equal(next.circuit.tokyoChampionWins,1);
  assert.equal(next.circuit.championshipHistory.length,1);
  assert.match(panel,/VIEW CHAMPIONSHIP AWARDS/);
});

test('legacy won Tokyo titles migrate and never count twice on reward recovery',()=>{
  const c=complete(registered(),true,3,1);
  assert.equal(c.activeChampionship.championId,PLAYER);
  // Simulate a completed old save with history but no dedicated v1 counters.
  c.championshipHistory=[{id:c.activeChampionship.id,season:c.season,
    championId:PLAYER,completed:true}];
  delete c.tokyoChampionWins;delete c.careerCompleted;
  delete c.championshipSettledIds;
  const restored=normaliseProCircuitState(c);
  assert.equal(restored.tokyoChampionWins,1);
  assert.equal(restored.careerCompleted,true);
  const award=settleTokyoChampionship(restored);
  assert.ok(award.circuit,award.error);
  assert.equal(award.circuit.tokyoChampionWins,1);
  assert.equal(award.circuit.championshipHistory.length,1);
  assert.equal(award.circuit.championshipSettledIds.length,1);
  assert.equal(settleTokyoChampionship(award.circuit).cashPrize,0);
});

test('losing final cannot award unearned Tokyo Champion status',()=>{
  const c=complete(registered(),false,0,4);
  assert.notEqual(c.activeChampionship.championId,PLAYER);
  const result=settleTokyoChampionship(c);
  assert.ok(result.circuit,result.error);
  assert.equal(result.result.playerChampion,false);
  assert.equal(result.circuit.tokyoChampionWins,0);
  assert.equal(result.circuit.careerCompleted,false);
  assert.ok(result.cashPrize>0);
  assert.equal(getTokyoCareerRecord(result.circuit).appearances,1);
  assert.match(getOfficeTrophyLines(result.circuit).join(' '),/NOT YET/);
});

test('winner marker is only awarded for completed and consistent results',()=>{
  const c=registered();
  assert.match(settleTokyoChampionship(c).error,/NOT FINAL/);
  const broken=complete(registered(),false,1,2);
  broken.activeChampionship.championId=PLAYER;
  if(championshipStandings(broken.activeChampionship)[0].id!==PLAYER)
    assert.match(settleTokyoChampionship(broken).error,/INVALID/);
});

test('repeat seasons preserve results without duplicated history or prizes',()=>{
  let c=complete(registered(),false,1,2);
  let out=settleTokyoChampionship(c);
  assert.ok(out.circuit,out.error);c=out.circuit;
  const initialTitles=c.tokyoChampionWins;
  const oldId=c.activeChampionship.id;
  const rolled=nextProfessionalSeason(c);
  assert.ok(rolled.circuit,rolled.error);
  assert.equal(rolled.circuit.championshipHistory.length,1);
  assert.equal(rolled.circuit.championshipHistory[0].id,oldId);
  assert.equal(rolled.circuit.tokyoChampionWins,initialTitles);
  const state=rolled.circuit;
  state.seasonStatus='COMPLETE';state.calendar.round=8;
  state.playerDriver.seasonPoints=60;state.playerTeam.seasonPoints=40;
  const second=createProvisionalChampionship(state);
  assert.ok(second.championship,second.error);
  state.activeChampionship=second.championship;
  c=complete(state,false,0,4);
  out=settleTokyoChampionship(c);
  assert.ok(out.circuit,out.error);
  assert.equal(out.circuit.championshipHistory.length,2);
  assert.deepEqual(out.circuit.championshipSettledIds,[oldId,second.championship.id]);
  assert.equal(out.circuit.tokyoChampionWins,initialTitles+(out.result.playerChampion?1:0));
});

test('Office prestige collection is sourced from saved wins, not placement claims',()=>{
  const c=createDefaultProCircuitState();
  c.trophyWins.shutoSpeed=2;
  c.trophyWins.tokyoMasters=1;
  const record=getOfficeTrophyRecord(c);
  assert.equal(record.trophyWins,2);
  assert.equal(record.trophyTotal,5);
  assert.match(getOfficeTrophyLines(c).join('\n'),/SHUTO SPEED TROPHY  \/\/  WON 2 TIMES/);
  assert.match(getOfficeTrophyLines(c).join('\n'),/TOKYO MASTERS TROPHY  \/\/  WON 1 TIME/);
  assert.doesNotMatch(office,/NO TROPHIES YET/);
});

test('final UI, replay-safe car registration and existing cutscenes are wired',()=>{
  assert.match(race,/settleTokyoChampionship\(changes\)/);
  assert.match(race,/cash:Number\(this.registry.get\('cash'\)\|\|0\)\+award.cashPrize/);
  assert.match(panel,/showChampionshipCrewSelection\(s\)/);
  assert.match(panel,/driverCarId:carId/);
  assert.match(panel,/TOKYO CHAMPION \/\/ OFFICIAL RESULTS/);
  assert.match(panel,/tokyoChampionshipVictory/);
  assert.match(panel,/tokyoChampionshipDefeat/);
  assert.match(panel,/tokyoChampionshipOpening/);
  assert.match(venue,/autoOpenTokyoChampionship/);
  for(const name of ['tokyoChampionshipOpening','tokyoChampionshipVictory','tokyoChampionshipDefeat']){
    assert.ok(CUTSCENES[name]);
    assert.equal(CUTSCENES[name].once,true);
    assert.ok(CUTSCENES[name].pages.length>=3);
  }
  assert.ok(CUTSCENES.tokyoChampionshipVictory.pages.some(page=>
    page.leftCharacter==='arkonDen'));
});
