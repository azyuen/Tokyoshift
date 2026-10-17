import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CUTSCENES } from '../src/data/cutscenes.js';
import { PHONE_DIALOGUE_LAYOUTS } from '../src/ui/RaceCoachHud.js';
import { OPENING_PHONE_DIALOGUE_LAYOUTS } from '../src/ui/OpeningPhonePrototype.js';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('scenes 6 and 7 only permit NEXT after the final gallery portrait', () => {
  const gallery = source('src/ui/SwipePortraitGallery.js');
  assert.match(gallery, /if \(moving \|\| index !== entries\.length - 1\) return/);
  assert.match(gallery, /const showNext = !moving && index === entries\.length - 1/);
  assert.match(gallery, /next\.setVisible\(showNext\)/);
  assert.match(gallery, /next\.caption\.setVisible\(showNext\)/);
  assert.match(source('src/ui/SevenRivalsMontage.js'), /openSwipePortraitGallery\(scene/);
  assert.match(source('src/scenes/GarageScene.js'), /completeCrewGroup/);
});

test('scene 7 adds the Oshiage coaching reminder without spoiling Sayaka', () => {
  const lines = CUTSCENES.fullCrewTogether.pages;
  const mention = lines.find(p => /lady instructor knows the ideal launch revs/i.test(p.text));
  assert.ok(mention);
  assert.equal(mention.leftCharacter, 'sayakaFujieda');
  assert.match(mention.text, /crew's cars/);
  assert.match(mention.text, /driving school in Oshiage/);
  assert.match(mention.text, /efficient shift bands/);
  assert.ok(lines.indexOf(mention) < lines.findIndex(p => /surprisingly detailed advice/.test(p.text)));
  assert.doesNotMatch(mention.text, /I am the instructor|I used to be a strategist/i);
});

test('phone actor portraits and chat panels are 30% larger and mirrored', () => {
  assert.equal(OPENING_PHONE_DIALOGUE_LAYOUTS, PHONE_DIALOGUE_LAYOUTS);
  const { left, right } = PHONE_DIALOGUE_LAYOUTS;
  assert.equal(left.face.width, 273);
  assert.equal(right.face.width, 273);
  assert.equal(left.bubble.right - left.bubble.left, 735);
  assert.equal(right.bubble.right - right.bubble.left, 735);
  assert.equal(left.bubble.bottom - left.bubble.top, 244);
  assert.equal(left.face.x + right.face.x + left.face.width, 1560);
  assert.equal(left.bubble.left + right.bubble.right, 1560);
});

test('call action bars sit along the bottom in black for both renderers', () => {
  for (const p of ['src/ui/OpeningPhonePrototype.js', 'src/ui/PhoneConversation.js']) {
    const s = source(p);
    assert.match(s, /\(scene\.scale\?\.height \|\| 840\) - 49|screenH - 49/);
    assert.match(s, /0x111111, 1\)\.setStrokeStyle\(2, 0xffffff/);
  }
  assert.match(source('src/ui/PhoneConversation.js'), /PHONE_DIALOGUE_LAYOUTS\[isPlayer \? 'right' : 'left'\]/);
});

test('Meet progression buttons use thinner pink slip design while preserving badges', () => {
  const meet = source('src/scenes/MeetScene.js');
  const segment = meet.slice(meet.indexOf('  buildMeetProgressionButtons() {'),
    meet.indexOf('  startMeetProgressionChallenge('));
  assert.match(segment, /width, 36, 0x291620, 1/);
  assert.match(segment, /setStrokeStyle\(2, 0xff5f93, 0\.9\)/);
  assert.match(segment, /fontSize: '8px', color: '#ffdce8'/);
  assert.match(segment, /setDisplaySize\(55, 55\)/);
  assert.match(segment, /const right = STAGE\.x \+ STAGE\.w - 34/);
});
