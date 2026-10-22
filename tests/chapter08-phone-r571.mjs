import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import { CHAPTER08_SCENES } from '../src/data/chapter08.js';
import { CUTSCENES } from '../src/data/cutscenes.js';
import { getCharacterVisualAsset } from '../src/data/characters.js';

const code=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const CALLS=['chapter08ManagerCall','chapter08SayakaCall'];

test('both chapter 08 calls use Chapter 04 actual ringing and tap-to-answer presentation',()=>{
  const chapter04=code('src/ui/CanalYardStory.js');
  assert.match(chapter04,/presentation: 'phone', presentationMode: 'openingSwipe'/);
  for(const id of CALLS){
    const call=CHAPTER08_SCENES[id];
    assert.equal(call.presentation,'phone',id);
    assert.equal(call.presentationMode,'openingSwipe',id);
    assert.equal(CUTSCENES[id].presentationMode,'openingSwipe',id+' in canonical cutscene registry');
    assert.equal(call.label,'INCOMING CALL',id);
    assert.ok(call.callerId,id);
    assert.ok(call.pages.length >= 8,id+' retains full dialogue');
    assert.ok(call.pages.some(page=>page.speaker==='caller'),id);
    assert.ok(call.pages.some(page=>page.speaker==='player'),id);
    const asset=getCharacterVisualAsset(call.callerId,call.callerPose||'idle');
    assert.ok(asset?.key && asset?.path,id+' has a real caller portrait');
  }
  assert.equal(CHAPTER08_SCENES.chapter08ManagerCall.callerId,'masatoKuroda');
  assert.equal(CHAPTER08_SCENES.chapter08ManagerCall.callerPose,'normal');
  assert.equal(CHAPTER08_SCENES.chapter08SayakaCall.callerId,'sayakaFujieda');
  assert.equal(CHAPTER08_SCENES.chapter08SayakaCall.callerPose,'homeHappy');
});

test('phone playback explicitly launches animation before conversation, without auto-answer',()=>{
  const dispatcher=code('src/ui/MangaCutscene.js');
  const phone=code('src/ui/PhoneConversation.js');
  const ringing=code('src/ui/OpeningPhonePrototype.js');
  assert.match(dispatcher,/definition\.presentationMode \|\| 'standard'/);
  assert.match(phone,/presentationMode === 'openingSwipe'/);
  assert.match(phone,/playOpeningPhonePrototype/);
  assert.match(ringing,/state\.phase = 'ringing'/);
  assert.match(ringing,/repeat: -1/);
  assert.match(ringing,/PICK UP/);
  assert.match(ringing,/green\.once\('pointerdown'/);
  assert.match(ringing,/showPage\(0\)/);
  assert.match(ringing,/onComplete\?\.\(\{ reason, pages: chapter.length \}\)/);
});

test('chapter 08 orchestration waits for each real or previewed call to finish',()=>{
  const story=code('src/ui/Chapter08Story.js');
  assert.match(story,/chapter08ManagerCall/);
  assert.match(story,/chapter08SayakaCall/);
  assert.match(story,/onPreviewComplete: \(\) => scene\.time\.delayedCall\(140, next\)/);
  assert.match(story,/onComplete: \(\) => \{/);
  assert.match(story,/const result = playMangaCutscene\(scene, sceneId/);
  const tester=code('src/ui/CutsceneTester.js');
  assert.match(tester,/startChapter08Warehouse\(scene,\{preview:true/);
  const cinema=code('src/data/cutscenes.js');
  assert.match(cinema,/chapter08\.js\?v=20261017-r\d+/);
  assert.match(story,/MangaCutscene\.js\?v=20261023-r658/);
});
