import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  RACE_COACH_LAYOUT, RACE_DIALOGUE_THEMES,
  PHONE_CALL_PRESENTATION, PHONE_DIALOGUE_LAYOUTS,
  createPhoneCallBackdrop,
} from '../src/ui/RaceCoachHud.js';
import { CHAPTER08_SCENES } from '../src/data/chapter08.js';

const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('standard phone template creates one translucent, input-blocking full-screen veil',()=>{
  const calls=[];
  const rectangle=(...args)=>{
    calls.push(args);
    return {
      setScrollFactor(v){this.scrollFactor=v;return this;},
      setDepth(v){this.depth=v;return this;},
      setInteractive(){this.interactive=true;return this;},
    };
  };
  const scene={scale:{width:1560,height:840},add:{rectangle}};
  const overlay=createPhoneCallBackdrop(scene,{depth:305});
  assert.equal(calls.length,1);
  assert.deepEqual(calls[0],[
    780,420,1560,840,
    PHONE_CALL_PRESENTATION.backdropColor,
    PHONE_CALL_PRESENTATION.backdropOpacity,
  ]);
  assert.ok(PHONE_CALL_PRESENTATION.backdropOpacity>0.25);
  assert.ok(PHONE_CALL_PRESENTATION.backdropOpacity<0.55);
  assert.equal(overlay.depth,305);
  assert.equal(overlay.scrollFactor,0);
  assert.equal(overlay.interactive,true);
});

test('phone bubble has a larger floating icon, no round badge, and original coaching UI untouched',()=>{
  const hud=source('src/ui/RaceCoachHud.js');
  assert.ok(PHONE_CALL_PRESENTATION.iconSize>=56);
  assert.ok(PHONE_CALL_PRESENTATION.iconOffsetY<0);
  assert.match(hud,/const iconX = bubble\.right \+ PHONE_CALL_PRESENTATION\.iconOffsetX/);
  assert.match(hud,/const iconY = bubble\.top \+ PHONE_CALL_PRESENTATION\.iconOffsetY/);
  assert.match(hud,/PHONE_CALL_PRESENTATION\.iconSize \/ Math\.max/);
  const phoneSection=hud.slice(hud.indexOf("  if (theme === 'phone') {"),
    hud.indexOf("  const setPortrait ="));
  assert.doesNotMatch(phoneSection,/scene\.add\.circle/);
  assert.doesNotMatch(phoneSection,/strokeCircle|iconBadge|badgeRadius/);
  assert.equal(RACE_DIALOGUE_THEMES.standard.fill,0xfffcf1);
  assert.equal(RACE_COACH_LAYOUT.face.width,214);
  assert.equal(PHONE_DIALOGUE_LAYOUTS.left.face.width,150);
});

test('both standard and vibrating pick-up phone renderer reuse same global backdrop and icon template',()=>{
  const normal=source('src/ui/PhoneConversation.js');
  const swipe=source('src/ui/OpeningPhonePrototype.js');
  const dispatcher=source('src/ui/MangaCutscene.js');
  for(const mode of [normal,swipe]){
    assert.match(mode,/createPhoneCallBackdrop/);
    assert.match(mode,/createRaceDialogueHud\(scene/);
    assert.match(mode,/phoneIconKey:/);
    assert.ok(mode.includes('RaceCoachHud.js?v=20261023-r658'));
  }
  assert.match(normal,/createPhoneCallBackdrop\(scene, \{depth:DEPTH\}\)/);
  assert.match(swipe,/own\(createPhoneCallBackdrop\(scene,\{depth:DEPTH\}\)\)/);
  assert.match(swipe,/objects\.splice\(1\)/); // veil stays after pickup
  assert.match(swipe,/green\.once\('pointerdown'/); // never auto answer
  assert.ok(normal.includes('OpeningPhonePrototype.js?v=20261023-r658'));
  assert.ok(dispatcher.includes('PhoneConversation.js?v=20261023-r658'));
});

test('all chapter and game scene entry points use refreshed canonical phone caller presentation',()=>{
  for(const path of [
    'src/scenes/GarageScene.js',
    'src/scenes/MeetScene.js',
    'src/scenes/CentralTokyoScene.js',
    'src/scenes/OshiageScene.js',
    'src/scenes/RaceScene.js',
    'src/scenes/TrainStationScene.js',
    'src/ui/CanalYardStory.js',
    'src/ui/Chapter08Story.js',
    'src/ui/CutsceneTester.js',
    'src/ui/StoryArchivePlayback.js',
  ]){
    assert.ok(source(path).includes('MangaCutscene.js?v='),path);
  }
  for(const id of ['chapter08ManagerCall','chapter08SayakaCall']){
    assert.equal(CHAPTER08_SCENES[id].presentation,'phone');
    assert.equal(CHAPTER08_SCENES[id].presentationMode,'openingSwipe');
  }
});
