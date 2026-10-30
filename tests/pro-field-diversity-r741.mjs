import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultProCircuitState,getProDriverLadderSkillModifier} from '../src/data/proCircuit.js';
import {getProDuelOpponentRoster,selectProDuelOpponents} from '../src/data/proDragDuel.js';
import {PRO_RIVAL_CARS,getProfessionalOpponentBuild,getProfessionalCarEligibility} from '../src/data/proSeason.js';
import {carOrder} from '../src/data/cars.js';

globalThis.Phaser??={};
globalThis.Phaser.Math??={
  Clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  Linear:(a,b,t)=>a+(b-a)*t,
};
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const circuit=createDefaultProCircuitState();

test('every three-heat cup includes helmeted pro drivers instead of clustering regional champions',()=>{
  assert.equal(getProDuelOpponentRoster(circuit).length,23);
  for(const eventId of ['streetShootout','midnightCup','tokyoInvitational','shutoSpeed']){
    const encountered=new Set();
    for(let i=0;i<8;i++){
      const round=selectProDuelOpponents(circuit,{eventId,entryOrdinal:i,count:3});
      assert.equal(round.length,3);
      assert.equal(new Set(round.map(d=>d.id)).size,3);
      assert.ok(round.filter(d=>d.id.startsWith('pro:driver:')).length>=2,
        eventId+' entry '+i+' must represent the generic professional field');
      round.forEach(d=>encountered.add(d.id));
    }
    assert.equal(encountered.size,23,eventId+' must rotate through full official field');
  }
});
test('ladder position and current Elo make stronger pro drivers execute more precisely',()=>{
  const champion=getProDriverLadderSkillModifier({seed:1,rating:1950});
  const middle=getProDriverLadderSkillModifier({seed:12,rating:1550});
  const tail=getProDriverLadderSkillModifier({seed:24,rating:1100});
  assert.ok(champion>middle&&middle>tail);
  assert.ok(champion-tail>=.055);
  const scene=source('src/scenes/CentralTokyoScene.js');
  assert.match(scene,/const form=getProDriverLadderSkillModifier\(driver\)/);
  assert.match(scene,/encounterAi:Object.fromEntries/);
});
test('all standard production car models can be considered for Pro racing, excluding exhibition/hero aliases',()=>{
  assert.equal(PRO_RIVAL_CARS.length,carOrder.length);
  assert.ok(PRO_RIVAL_CARS.length>=40);
  assert.ok(PRO_RIVAL_CARS.every(id=>carOrder.includes(id)));
  assert.ok(!PRO_RIVAL_CARS.some(id=>id.startsWith('ginzaDemo_')));
});
test('different legal pro drivers can choose different competitive models in the same power class',()=>{
  const rules={maxPowerKW:380,noNos:true};
  const first=getProfessionalOpponentBuild(rules,325,5,'r741:car:test:1','ae86');
  assert.ok(first,'first opponent should be eligible');
  const second=getProfessionalOpponentBuild(rules,325,5,'r741:car:test:2','ae86',
    {avoidCarIds:[first.carId]});
  assert.ok(second,'second opponent should be eligible');
  assert.notEqual(first.carId,second.carId,'avoid an already-used model within the competition');
  for(const entry of [first,second]){
    const checked=getProfessionalCarEligibility(entry.carId,entry.state,rules);
    assert.equal(checked.eligible,true,checked.reasons?.join(','));
    assert.ok(checked.powerKW<=rules.maxPowerKW+.001);
    assert.equal(Boolean(entry.state.nosInstalled),false);
  }
});
test('saved rival paint is consistently used in briefing, live race and next-heat preview',()=>{
  const entry=source('src/scenes/CentralTokyoScene.js');
  const briefing=source('src/ui/ProDriverBriefing.js');
  const runtime=source('src/scenes/FourLaneTestScene.js');
  assert.ok(entry.includes("seed:driver.id+':'+event.id"),'paint seed must include persistent driver ID');
  assert.match(briefing,/paintColor:round\.paintColor\?\?getProRaceRivalPaint\(0\)/);
  assert.match(runtime,/paint: rivalRound\?\.paintColor\?\?getProRaceRivalPaint\(index\)/);
  assert.match(runtime,/const nextPaint=round\.paintColor\?\?getProRaceRivalPaint\(0\)/);
});
