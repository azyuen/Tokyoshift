import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  OSHIAGE_SCHOOL_LESSONS, OSHIAGE_SCHOOL_RETRIES,
  bookOshiageLesson, bookingMatches, consumeOshiageAttempt, remainingAttempts
} from '../src/data/oshiageSchool.js';
import { createDefaultGameState, normaliseState } from '../src/state/GameState.js';

test('four school courses have authored costs and approved disguised dialogue', () => {
  assert.equal(OSHIAGE_SCHOOL_LESSONS.basic.fee, 0);
  assert.equal(OSHIAGE_SCHOOL_LESSONS.launch.fee, 5000);
  assert.equal(OSHIAGE_SCHOOL_LESSONS.standing.fee, 10000);
  assert.equal(OSHIAGE_SCHOOL_LESSONS.rolling.fee, 15000);
  assert.equal(OSHIAGE_SCHOOL_RETRIES, 3);
  for (const lesson of Object.values(OSHIAGE_SCHOOL_LESSONS)) {
    assert.ok(lesson.speech.length > 35);
    assert.doesNotMatch(lesson.speech, /strategist|Ginza|curator/i);
  }
});

test('a booking charges once and allows exactly three retries', () => {
  const start = bookOshiageLesson({carId:'ae86', lessonId:'standing', cash:20000});
  assert.equal(start.ok,true);
  assert.equal(start.cash,10000);
  assert.equal(start.charged,10000);
  let booking = start.booking;
  for(let i=0;i<4;i++){
    assert.equal(remainingAttempts(booking),4-i);
    booking = consumeOshiageAttempt(booking);
    assert.equal(booking.attemptsUsed,i+1);
    if(i<3) {
      const again=bookOshiageLesson({booking,carId:'ae86',lessonId:'standing',cash:10000});
      assert.equal(again.charged,0);
      assert.equal(again.cash,10000);
    }
  }
  assert.equal(remainingAttempts(booking),0);
  assert.equal(consumeOshiageAttempt(booking),null);
  assert.equal(bookingMatches(booking,'ae86','standing'),false);
  const renewal = bookOshiageLesson({booking,carId:'ae86',lessonId:'standing',cash:10000});
  assert.equal(renewal.charged,10000);
  assert.equal(renewal.booking.attemptsUsed,0);
});

test('exiting retains prepaid attempts but switching car or lesson requires new fee', () => {
  const start=bookOshiageLesson({carId:'r34',lessonId:'launch',cash:6000});
  const one=consumeOshiageAttempt(start.booking);
  assert.equal(bookingMatches(one,'r34','launch'),true);
  assert.equal(bookingMatches(one,'ae86','launch'),false);
  assert.equal(bookingMatches(one,'r34','rolling'),false);
  const noFunds=bookOshiageLesson({booking:one,carId:'ae86',lessonId:'rolling',cash:4000});
  assert.equal(noFunds.ok,false);
  assert.equal(start.cash,1000);
  assert.equal(bookOshiageLesson({carId:'ae86',lessonId:'basic',cash:0}).charged,0);
});

test('booking survives save normalisation and invalid records are rejected', () => {
  const booking={carId:'ae86',lessonId:'launch',fee:5000,attemptsUsed:3};
  assert.equal(createDefaultGameState().oshiageSchoolBooking,null);
  assert.deepEqual(normaliseState({oshiageSchoolBooking:booking}).oshiageSchoolBooking,booking);
  assert.equal(normaliseState({oshiageSchoolBooking:{...booking, attemptsUsed:7}}).oshiageSchoolBooking,null);
});

test('UI uses left face, big target circle, contrasting results and actual shift RPM', () => {
  const school=readFileSync(new URL('../src/scenes/OshiageScene.js',import.meta.url),'utf8');
  const race=readFileSync(new URL('../src/scenes/RaceScene.js',import.meta.url),'utf8');
  assert.match(school,/animateShopCarEntry\(this\.schoolCarObjects/);
  assert.match(school,/showLessonBookingDialogue\(lesson\.id\)/);
  assert.match(school,/bookOshiageLesson\(/);
  assert.match(race,/coachFaceMask/);
  assert.match(race,/this\.add\.circle\(1375, 199, 125/);
  assert.match(race,/0xf9faf8, 0\.93/);
  assert.match(race,/row\.actual/);
  assert.match(race,/bookingMatches\(current, this\.selectedCarId, this\.coachingLesson\)/);
  assert.match(race,/this\.scene\.restart\(\)/);
});
