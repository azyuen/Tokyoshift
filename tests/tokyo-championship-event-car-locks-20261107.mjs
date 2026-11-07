import test from 'node:test';
import assert from 'node:assert/strict';
import { getChampionshipEventCar, lockChampionshipEventCar } from '../src/data/tokyoChampionship.js';

const roster=['ef','ae86','gc8'];
const owned=[...roster,'r34'];
const base=()=>({stage:'KNOCKOUT',completed:false,knockout:{round:0,results:[]}});

test('knockout locks one registered car and survives JSON reload',()=>{
  const first=lockChampionshipEventCar(base(),'KNOCKOUT','ef',roster,owned);
  assert.ok(first.championship,first.error);
  const saved=JSON.parse(JSON.stringify(first.championship));
  assert.equal(getChampionshipEventCar(saved,'KNOCKOUT'),'ef');
  assert.equal(lockChampionshipEventCar(saved,'KNOCKOUT','ef',roster,owned).championship,saved);
  assert.match(lockChampionshipEventCar(saved,'KNOCKOUT','ae86',roster,owned).error,/LOCKED/);
});
test('four-wide can independently select the same or another registered car',()=>{
  const ko=lockChampionshipEventCar(base(),'KNOCKOUT','ef',roster,owned).championship;
  for(const id of ['ef','gc8']){
    const four=lockChampionshipEventCar({...ko,stage:'FOUR_WIDE'},'FOUR_WIDE',id,roster,owned);
    assert.ok(four.championship,four.error);
    assert.equal(getChampionshipEventCar(four.championship,'KNOCKOUT'),'ef');
    assert.equal(getChampionshipEventCar(four.championship,'FOUR_WIDE'),id);
    assert.match(lockChampionshipEventCar(four.championship,'FOUR_WIDE','ae86',roster,owned).error,/LOCKED/);
  }
});
test('unregistered, unowned and wrong-stage cars are refused',()=>{
  assert.match(lockChampionshipEventCar(base(),'KNOCKOUT','r34',roster,owned).error,/REGISTERED/);
  assert.match(lockChampionshipEventCar(base(),'KNOCKOUT','gc8',roster,['ef']).error,/REGISTERED/);
  assert.match(lockChampionshipEventCar(base(),'FOUR_WIDE','ef',roster,owned).error,/NOT ACTIVE/);
  assert.match(lockChampionshipEventCar({...base(),completed:true},'KNOCKOUT','ef',roster,owned).error,/NOT ACTIVE/);
});
test('legacy Championship save without locks can nominate a car',()=>{
  const legacy=JSON.parse(JSON.stringify(base()));
  assert.equal(getChampionshipEventCar(legacy,'KNOCKOUT'),null);
  assert.equal(getChampionshipEventCar(lockChampionshipEventCar(legacy,'KNOCKOUT','ae86',roster,owned).championship,'KNOCKOUT'),'ae86');
});
