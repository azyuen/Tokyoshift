import test from 'node:test';
import assert from 'node:assert/strict';
import {PRO_SEASON_CALENDAR,getProfessionalSeasonOrder,getProfessionalSeasonCalendar,getProfessionalRoundEvents,getProDriverInvitationRules} from '../src/data/proSeason.js';

test('each season has eight balanced driver and crew events',()=>{
  for(let season=1;season<=40;season++){
    const calendar=getProfessionalSeasonCalendar(season);
    assert.equal(calendar.length,8);
    for(const discipline of ['DRIVER','TEAM']){
      const order=getProfessionalSeasonOrder(season,discipline);
      assert.deepEqual([...order].sort((a,b)=>a-b),[0,1,2,3,4,5,6,7]);
    }
    assert.equal(calendar.filter(e=>e.driver.noNos).length,2);
    assert.deepEqual(calendar.map(e=>e.driver.maxNosShots).sort((a,b)=>a-b),[0,0,1,1,2,2,3,3]);
    assert.deepEqual(calendar.map(e=>e.driver.drivetrain).filter(Boolean).sort(),['AWD','FWD','RWD','RWD']);
    assert.equal(calendar.filter(e=>e.crew.format==='RELAY').length,2);
    assert.deepEqual(getProfessionalSeasonCalendar(season),calendar);
    for(let round=0;round<8;round++)
      assert.deepEqual(getProfessionalRoundEvents(round,season),calendar[round]);
  }
});

test('season one preserves the legacy schedule and later seasons rotate',()=>{
  assert.deepEqual(getProfessionalSeasonCalendar(1),PRO_SEASON_CALENDAR);
  assert.notDeepEqual(getProfessionalSeasonCalendar(2),PRO_SEASON_CALENDAR);
  assert.notDeepEqual(getProfessionalSeasonCalendar(3),getProfessionalSeasonCalendar(2));
});

test('Elite Driver Invitational is the open-power alternative every round',()=>{
  for(let season=1;season<=12;season++)for(let round=0;round<8;round++){
    const rules=getProDriverInvitationRules(round,season);
    assert.equal(rules.id,'proDriverInvitational');
    assert.equal(rules.maxPowerKW,undefined,'an over-cap collector must remain eligible for the Elite Invitational');
    assert.equal(rules.drivetrain,undefined);
    assert.equal(rules.maxNosShots,3);
    assert.equal(rules.noNos,false);
  }
});
