import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Load the real deferred loader against Phaser's minimal constructor contract.
globalThis.Phaser = {
  Scene: class Scene {
    constructor(key) {
      this.sys = {settings: {key}, isActive: () => true};
    }
  },
};
const events=[];
globalThis.window = {
  TOKYO_SHIFT_SHOW_SPLASH: label => events.push(['splash',label]),
  TOKYO_SHIFT_SHOW_BOOT_ERROR: error => events.push(['error',String(error)]),
};
const {makeDeferredScene} = await import('../src/ui/DeferredScene.js');

test('first entry imports the actual scene and forwards the canonical key and init data',async()=>{
  events.length=0;
  const Placeholder=makeDeferredScene('DeferredFixture',
    '../../tests/fixtures/DeferredSceneFixture.mjs','TEST');
  const scene=new Placeholder();
  const manager={
    getScene: key => key === 'DeferredFixture' ? scene : null,
    remove: key => events.push(['remove',key]),
    add: (key,SceneClass,auto,data) => events.push([
      'add', key, SceneClass.name,auto,data,
    ]),
  };
  scene.game={scene:manager};
  const data={locationId:'tokyoDragComplex',number:7};
  scene.init(data);
  await scene.create();
  assert.deepEqual(events[0],['splash','LOADING TEST']);
  assert.deepEqual(events[1],['remove','DeferredFixture']);
  assert.deepEqual(events[2],['add','DeferredFixture','DeferredSceneFixture',true,data]);
});

test('inactive/abandoned first-load transition cannot restart an old scene',async()=>{
  events.length=0;
  const Placeholder=makeDeferredScene('DeferredFixture',
    '../../tests/fixtures/DeferredSceneFixture.mjs');
  const scene=new Placeholder();
  scene.game={scene:{getScene:()=>({different:true}),
    remove:()=>events.push(['remove']),add:()=>events.push(['add'])}};
  await scene.create();
  assert.equal(events.some(event=>['remove','add'].includes(event[0])),false);
});

test('main boot registers heavy scenes lazily, preserving their canonical names',()=>{
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  const eager=main.slice(main.indexOf('const [BootScene'),main.indexOf('// Preserve the canonical'));
  assert.doesNotMatch(eager,/loadScene\('GARAGE'|loadScene\('MEET'|loadScene\('RACE'/);
  for(const key of ['GarageScene','MeetScene','RaceScene','CentralTokyoScene',
    'FourLaneTestScene','OshiageScene','CrewSpaceScene','CharacterSelectScene','TrainStationScene']){
    assert.match(main,new RegExp("makeDeferredScene\\('"+key+"'"));
  }
});
