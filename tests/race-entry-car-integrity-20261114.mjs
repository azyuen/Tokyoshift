import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../src/scenes/'+name+'.js',import.meta.url),'utf8');
test('every Meet race transition snapshots selected car',()=>{
  const meet=read('MeetScene');
  assert.doesNotMatch(meet,/this\.scene\.start\('RaceScene'\);/);
  assert.match(meet,/raceEntry:\s*\{\s*playerCarId/);
  assert.match(meet,/playerCarId, opponentCarId: challenge\.baseCarId/);
});
test('other street and tutorial transitions snapshot selected car',()=>{
  for(const name of ['GarageScene','OshiageScene']){
    const source=read(name);
    assert.doesNotMatch(source,/this\.scene\.start\('RaceScene'\);/);
    assert.match(source,/raceEntry:\s*\{\s*playerCarId/);
  }
});
test('RaceScene honors explicit race entry and blocks invalid selection',()=>{
  const race=read('RaceScene');
  assert.match(race,/data\?\.raceEntry\?\.playerCarId/);
  assert.match(race,/if \(this\.invalidRaceEntryCar\)/);
  assert.match(race,/refusing AE86 substitution/);
});
test('professional races reject invalid registered car',()=>{
  const pro=read('FourLaneTestScene');
  assert.match(pro,/this\.invalidProRaceCar = !selected \|\| !cars\[selected\]/);
  assert.match(pro,/if \(this\.invalidProRaceCar\) \{\s*this\.returnToDrag\(\)/);
});
