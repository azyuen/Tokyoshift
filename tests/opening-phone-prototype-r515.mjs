import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CUTSCENES } from '../src/data/cutscenes.js';
import {
  OPENING_PHONE_LAYOUT, getOpeningPhoneAssets, playOpeningPhonePrototype,
} from '../src/ui/OpeningPhonePrototype.js';
import { formatPhoneMessage } from '../src/ui/PhoneConversation.js';
import { PHONE_CARD_SWIPE_DISTANCE } from '../src/ui/CompactDialogueLayout.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

function fakeScene() {
  const objects=[];
  const methods=['setOrigin','setDepth','setScrollFactor','setScale','setStrokeStyle',
    'setInteractive','disableInteractive','setAlpha','setY','setCrop','setPosition',
    'setVisible','setFillStyle','setText','setTexture','setMask','setFontSize',
    'setLineSpacing','clear','fillStyle','lineStyle','beginPath','moveTo','lineTo',
    'closePath','fillPath','strokePath','fillRect','createGeometryMask','setFilter'];
  const mk=(kind,...args)=>{
    const o={kind,args,active:true,buttons:{},children:args[2]||[],
      alpha:1,y:args[1]||0,calls:[],destroyed:false};
    for(const m of methods)o[m]=function(...v){this.calls.push([m,...v]);if(m==='setAlpha')this.alpha=v[0];if(m==='setY')this.y=v[0];if(m==='setText')this.text=v[0];return this;};
    o.on=function(ev,fn){this.buttons[ev]=fn;return this;};
    o.once=function(ev,fn){this.buttons[ev]=fn;return this;};
    o.destroy=function(){this.destroyed=true;this.active=false;};
    objects.push(o);return o;
  };
  const events={once(){},off(){}};
  globalThis.Phaser={Textures:{FilterMode:{NEAREST:1}},Loader:{Events:{COMPLETE:'complete'}}};
  const tweens=[];
  const scene={
    add:Object.fromEntries(['rectangle','circle','text','image','container','graphics']
      .map(k=>[k,(...args)=>mk(k,...args)])),
    make:{graphics:()=>mk('mask')},
    textures:{exists:()=>true,get:()=>({getSourceImage:()=>({width:540,height:1180}),setFilter(){}})},
    tweens:{add:config=>{tweens.push(config);if(config.onComplete)config.onComplete();return {remove(){}};},killTweensOf(){}},
    events,
    registry:{get:name=>name==='playerCharacterId'?'ayaKurose':name==='firstName'?'Ethan':null},
    load:{isLoading:()=>false,image(){},once(){},off(){},start(){}},
  };
  return {scene,objects,tweens};
}

test('only the opening call opts in to the new presentation, preserving other calls', () => {
  const intro=CUTSCENES.openingSayakaPhoneCall;
  assert.equal(intro.presentation,'phone');
  assert.equal(intro.presentationMode,'openingSwipe');
  assert.deepEqual(intro.pages.map(p=>p.speaker),['caller','player']);
  assert.equal(intro.pages[1].text,'Great, see you in the garage!');
  const phone=read('src/ui/PhoneConversation.js');
  const manga=read('src/ui/MangaCutscene.js');
  assert.match(phone,/if \(presentationMode === 'openingSwipe'\)/);
  assert.match(manga,/presentationMode: options\.presentationMode \|\| definition\.presentationMode/);
});

test('selected player uses their actual character portrait', () => {
  const assets=getOpeningPhoneAssets('sayakaFujieda','idle','ayaKurose');
  assert.match(assets.caller.path,/home_sayaka_fujieda_normal\.png/);
  assert.match(assets.player.path,/aya_kurose/);
  assert.equal(OPENING_PHONE_LAYOUT.transitionMs,280);
});

test('first screen displays vibrating centred phone and a single green answer control', () => {
  const {scene,objects,tweens}=fakeScene();
  let completed=0;
  const state=playOpeningPhonePrototype(scene,{
    callerId:'sayakaFujieda',callerName:'SAYAKA',
    pages:CUTSCENES.openingSayakaPhoneCall.pages,
    formatMessage:formatPhoneMessage,onComplete:()=>completed++,
  });
  assert.equal(state.phase,'ringing');
  assert.equal(state.pageIndex,-1);
  assert.ok(objects.some(x=>x.kind==='image'&&x.args[2]==='openingIncomingPhone'));
  assert.ok(objects.some(x=>x.kind==='text'&&x.args[2]==='INCOMING CALL'));
  assert.ok(tweens.some(t=>t.angle?.from===-8&&t.angle?.to===8&&t.repeat===-1));
  const pickup=objects.find(x=>x.kind==='circle'&&x.buttons.pointerdown);
  assert.ok(pickup);
  assert.equal(pickup.args[3],0x1ab565);
  assert.equal(objects.filter(x=>x.buttons.pointerdown).length,1);
  assert.equal(completed,0);
});

test('pickup shows left Sayaka, continue swipes up and reveals mirrored player, then delivers once', () => {
  const {scene,objects,tweens}=fakeScene();
  let completed=0;
  const state=playOpeningPhonePrototype(scene,{
    callerId:'sayakaFujieda',callerName:'SAYAKA',
    pages:CUTSCENES.openingSayakaPhoneCall.pages,
    formatMessage:formatPhoneMessage,onComplete:()=>completed++,
  });
  const pickup=objects.find(x=>x.kind==='circle'&&x.buttons.pointerdown);
  pickup.buttons.pointerdown();
  assert.equal(state.phase,'caller');
  assert.equal(state.pageIndex,0);
  const first=objects.find(x=>x.kind==='container');
  assert.ok(first);
  assert.ok(first.children.some(c=>c.kind==='text'&&String(c.text || c.args[2]).includes("Hey Ethan")));
  let next=objects.find(x=>x.kind==='rectangle'&&x.buttons.pointerdown&&!x.destroyed);
  next.buttons.pointerdown();
  assert.equal(state.phase,'player');
  assert.equal(state.pageIndex,1);
  assert.ok(tweens.some(t=>t.y===-PHONE_CARD_SWIPE_DISTANCE&&t.duration===OPENING_PHONE_LAYOUT.transitionMs));
  const second=objects.filter(x=>x.kind==='container').at(-1);
  assert.ok(second.children.some(c=>c.kind==='text'&&(c.text || c.args[2])==='Great, see you in the garage!'));
  assert.ok(second.children.some(c=>c.kind==='image'&&c.args[2]==='characterAyaKurose'));
  next=objects.filter(x=>x.kind==='rectangle'&&x.buttons.pointerdown&&!x.destroyed).at(-1);
  next.buttons.pointerdown();
  assert.equal(completed,1);
  assert.equal(state.active,false);
  assert.equal(scene._phoneConversation,null);
});

test('opening garage still waits for successful call completion before car delivery',()=>{
  const garage=read('src/scenes/GarageScene.js');
  const a=garage.indexOf('  showOpeningPhoneCall() {');
  const b=garage.indexOf('  spawnOpeningCompanion(',a);
  const chunk=garage.slice(a,b);
  assert.match(chunk,/playMangaCutscene\(this, 'openingSayakaPhoneCall'/);
  assert.match(chunk,/onComplete: \(\) => \{/);
  assert.match(chunk,/this\.deliverOpeningCar\(\)/);
  assert.match(read('src/ui/OpeningPhonePrototype.js'),/state\.close\('action'\)/);
});
