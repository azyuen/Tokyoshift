import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createRaceDialogueHud, RACE_COACH_LAYOUT, RACE_DIALOGUE_THEMES,
} from '../src/ui/RaceCoachHud.js';
import {
  playPhoneConversation, PHONE_ACCENTS, formatPhoneMessage,
} from '../src/ui/PhoneConversation.js';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const shared = read('src/ui/RaceCoachHud.js');
const phone = read('src/ui/PhoneConversation.js');
const manga = read('src/ui/MangaCutscene.js');

function makeFakeScene() {
  const items = [];
  const methods = [
    'setOrigin', 'setDepth', 'setScrollFactor', 'setMask', 'setVisible',
    'setTexture', 'setPosition', 'setScale', 'setFillStyle', 'setStrokeStyle',
    'setInteractive', 'disableInteractive', 'clear', 'fillStyle', 'lineStyle',
    'beginPath', 'moveTo', 'lineTo', 'closePath', 'fillPath', 'strokePath',
    'fillRect', 'fillCircle', 'strokeCircle', 'fillTriangle', 'lineBetween',
  ];
  const make = (kind, args) => {
    const x = { kind, args, destroyed:false, clicks:{}, text: kind === 'text' ? args[2] : '' };
    for(const method of methods) x[method]=function(...values) {this.calls.push([method,...values]);return this;};
    x.calls=[];
    x.setText=function(value){this.text=value;return this;};
    x.on=function(event,callback){this.clicks[event]=callback;return this;};
    x.destroy=function(){this.destroyed=true;};
    x.createGeometryMask=function(){return {test:'mask'};};
    items.push(x);
    return x;
  };
  globalThis.Phaser = { Scenes:{Events:{SHUTDOWN:'shutdown'}},
    Textures:{FilterMode:{NEAREST:1}}, Loader:{Events:{COMPLETE:'complete'}} };
  const listenerMap={};
  const scene={
    add:Object.fromEntries(['image','graphics','rectangle','circle','text'].map(method=>
      [method,(...args)=>make(method,args)])),
    make:{graphics:(...args)=>make('mask',args)},
    textures:{exists:key=>Boolean(key),
      get:key=>({getSourceImage:()=>({width:480,height:1200}),
        setFilter(){}})},
    registry:{get:key=>key==='firstName'?'Ethan':undefined},
    tweens:{killTweensOf(){}},
    events:{once:(event,fn)=>{listenerMap[event]=fn;},off:()=>{}},
    load:{isLoading:()=>false,once:()=>{},image:()=>{},start:()=>{}},
  };
  return {scene,items,listenerMap};
}

test('standard speech triangle extends outward, not cut into bubble',()=>{
  const b=RACE_COACH_LAYOUT.bubble;
  assert.ok(b.left - b.notchDepth < b.left);
  assert.ok(b.right >= 775 && b.right <= 800);
  assert.match(shared,/bubble\.lineTo\(layout\.left - layout\.notchDepth, mid\)/);
  assert.doesNotMatch(shared,/bubble\.lineTo\(layout\.left \+ layout\.notchDepth, mid\)/);
  assert.ok(RACE_COACH_LAYOUT.face.targetX >= 140);
  assert.equal(RACE_DIALOGUE_THEMES.standard.border,0x111111);
});

test('phone theme uses pale translucent blue, blue outline and large corner icon',()=>{
  assert.equal(RACE_DIALOGUE_THEMES.phone.fill,0xe4f5ff);
  assert.ok(RACE_DIALOGUE_THEMES.phone.fillAlpha < 1);
  assert.equal(RACE_DIALOGUE_THEMES.phone.border,PHONE_ACCENTS.incoming);
  assert.match(shared,/badgeX = bubble\.right - 1/);
  assert.match(shared,/badgeY = bubble\.top/);
  assert.match(shared,/phoneIconKey/);
  assert.match(shared,/setStrokeStyle\(4, style\.border\)/);
  assert.match(phone,/theme: 'phone'/);
  assert.match(phone,/createRaceDialogueHud\(scene, \{/);
  assert.match(manga,/playPhoneConversation\(scene, \{/);
});

test('shared head stays frameless for both regular coaching and phone calls',()=>{
  const {scene,items}=makeFakeScene();
  const hud=createRaceDialogueHud(scene,{
    theme:'phone',speaker:'INCOMING CALL: SAYAKA',
    spriteKeyForPose:()=> 'homeSayaka',phoneIconKey:'openingIncomingPhone',
  });
  assert.equal(hud.heading.text,'INCOMING CALL: SAYAKA');
  assert.equal(hud.portrait.kind,'image');
  assert.equal(items.filter(x=>x.kind==='rectangle').length,0);
  assert.ok(items.some(x=>x.kind==='circle'));
  assert.ok(items.some(x=>x.kind==='image'&&x.args[2]==='openingIncomingPhone'));
  assert.ok(hud.portrait.calls.some(x=>x[0]==='setMask'));
  hud.setAccent(0x165b9a);
  hud.destroy();
  assert.equal(hud.portrait.destroyed,true);
  assert.ok(items.every(x=>x.destroyed));
});

test('existing caller sequence advances pages, updates heading and completes once',()=>{
  const {scene,items}=makeFakeScene();
  let completions=0;
  const state=playPhoneConversation(scene,{
    callerId:'sayakaFujieda',callerName:'SAYAKA',
    pages:[{text:'Hi {PLAYER_FIRST_NAME}'},{speaker:'player',text:'Okay!'}],
    onComplete:()=>completions++,
  });
  assert.equal(state.active,true);
  assert.equal(state.pageIndex,0);
  assert.ok(items.some(x=>x.kind==='text'&&x.text==='Hi Ethan'));
  const next=items.find(x=>x.kind==='rectangle'&&x.clicks.pointerdown);
  assert.ok(next,'phone advance control should remain clickable');
  next.clicks.pointerdown();
  assert.equal(state.pageIndex,1);
  assert.ok(items.some(x=>x.kind==='text'&&x.text==='Okay!'));
  assert.ok(items.some(x=>x.kind==='text'&&x.text==='YOU: ETHAN'));
  state.close('action');
  assert.equal(completions,1);
  assert.equal(state.active,false);
  assert.equal(scene._phoneConversation,null);
});
