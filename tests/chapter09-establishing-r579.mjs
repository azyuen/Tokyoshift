import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import { CHAPTER09_GROUPS, chapter09ShotAssets, playChapter09EstablishingShot } from '../src/ui/Chapter09EstablishingShot.js';
import { startChapter09 } from '../src/ui/Chapter09Story.js';

const source=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
globalThis.Phaser={
  Loader:{Events:{COMPLETE:'complete'}},
  Scenes:{Events:{SHUTDOWN:'shutdown',DESTROY:'destroy'}},
  Textures:{FilterMode:{NEAREST:'nearest'}},
};

function fakeScene({phase='night',uncached=false,avatar='renMizuno'}={}){
  const nodes=[],timers=[],tweens=[],queued=[],textures=new Set();
  const make=(type,value='')=>{
    const o={type,value,alpha:1,active:true,handlers:{},
      setDepth(){return this;},setOrigin(){return this;},setScale(){return this;},
      setAlpha(alpha){this.alpha=alpha;return this;},setFlipX(){return this;},
      setScrollFactor(){return this;},setInteractive(){this.interactive=true;return this;},
      disableInteractive(){this.interactive=false;return this;},
      on(name,fn){this.handlers[name]=fn;return this;},
      destroy(){this.active=false;},
    };
    nodes.push(o);return o;
  };
  const scene={
    registry:{get:key=>key==='playerCharacterId'?avatar:null},
    worldPhase:phase,
    scale:{width:1560,height:840},
    sys:{isActive:()=>true},
    events:new EventEmitter(),
    textures:{
      exists:key=>textures.has(key),
      get:key=>({getSourceImage:()=>({width:320,height:key.includes('Bg')?180:560}),
        setFilter(){}}),
    },
    add:{
      rectangle:(...args)=>make('rectangle'),
      ellipse:(...args)=>make('ellipse'),
      image:(x,y,key)=>make('image',key),
      text:(x,y,value)=>make('text',value),
    },
    tweens:{
      add:config=>{tweens.push(config);return config;},
      killTweensOf:()=>{},
    },
    time:{delayedCall:(ms,fn)=>{
      const handle={ms,fn,removed:false,remove(){this.removed=true;}};
      timers.push(handle);return handle;
    }},
    load:{
      once(name,fn){this.done=fn;},
      off(name,fn){if(this.done===fn)this.done=null;},
      image(key,path){queued.push({key,path});},
      isLoading:()=>false,
      start(){queued.forEach(item=>textures.add(item.key));this.done?.();},
    },
    _chapter09Establishing:null,
  };
  if(!uncached){
    const assets=chapter09ShotAssets(scene);
    textures.add(assets.background.key);
    for(const entry of [...assets.left,...assets.right])if(entry.asset?.key)textures.add(entry.asset.key);
  }
  return {scene,nodes,timers,tweens,queued,textures};
}
test('same real Drag Complex day/night art and the requested 3-versus-5 cast in correct lineup',()=>{
  assert.deepEqual(CHAPTER09_GROUPS.left.map(x=>x.id),
    ['sayakaFujieda','daichiSakamoto','$PLAYER']);
  assert.deepEqual(CHAPTER09_GROUPS.right.map(x=>x.id),
    ['ryujiTakahashi','masatoKuroda','hiroshiSato','kentaIshikawa','tomoSakamoto']);
  for(const phase of ['day','night']){
    const scene=fakeScene({phase}).scene;
    const shot=chapter09ShotAssets(scene);
    assert.equal(shot.background.path,
      'assets/CentralTokyo/tokyo_dragstrip_'+phase+'.png');
    assert.equal(shot.left[2].id,'renMizuno');
    assert.equal(shot.left.length+shot.right.length,8);
    assert.ok(fs.existsSync(new URL('../'+shot.background.path,import.meta.url)));
    for(const character of [...shot.left,...shot.right]){
      assert.ok(character.asset?.key,character.id);
      assert.ok(fs.existsSync(new URL('../'+character.asset.path,import.meta.url)),
        character.asset.path);
    }
  }
});
test('establishing shot fades in both groups and advances safely by touch',()=>{
  const t=fakeScene();let complete=0,cancelled=0;
  const shot=playChapter09EstablishingShot(t.scene,{
    onComplete:()=>complete++,onCancel:()=>cancelled++,
  });
  assert.ok(shot?.active);
  assert.equal(t.nodes.filter(o=>o.type==='image').length,9);
  assert.equal(t.nodes.filter(o=>o.type==='image'&&o.value==='centralTokyoDragNightBg').length,1);
  assert.ok(t.nodes.some(o=>o.value==='TOKYO DRAG COMPLEX'));
  assert.ok(t.nodes.some(o=>o.value==='THE NEW CREW'));
  assert.ok(t.nodes.some(o=>o.value==='THE OLD GUARD'));
  assert.equal(playChapter09EstablishingShot(t.scene),null,'no duplicate introduction');
  t.timers.find(x=>x.ms===680).fn();
  t.timers.find(x=>x.ms===1850).fn();
  const touch=t.nodes.find(x=>x.type==='rectangle'&&x.interactive);
  assert.ok(touch);
  touch.handlers.pointerdown();
  const fade=t.tweens.find(x=>x.duration===400);
  assert.ok(fade,'fade out to the dialogue');
  fade.onComplete();
  assert.equal(complete,1);
  assert.equal(cancelled,0);
  assert.equal(t.scene._chapter09Establishing,null);
  assert.ok(t.nodes.every(x=>!x.active),'no leaking overlay objects');
  assert.ok(t.timers.every(x=>x.removed),'no leaking timers');
});
test('first-use preview loads character assets before drawing and can be cancelled on shutdown',()=>{
  const t=fakeScene({uncached:true});
  let cancelled=0,completed=0;
  const intro=playChapter09EstablishingShot(t.scene,{
    onCancel:()=>cancelled++,onComplete:()=>completed++,
  });
  assert.ok(intro?.active);
  assert.ok(t.queued.length>=9,'day/night art and eight portraits queued');
  assert.equal(t.nodes.filter(x=>x.type==='image').length,9);
  t.scene.events.emit('shutdown');
  assert.equal(cancelled,1);
  assert.equal(completed,0);
  assert.equal(t.scene._chapter09Establishing,null);
  assert.ok(t.nodes.every(x=>!x.active));
});
test('both career and preview flow into Chapter 09 only after establishing fade',()=>{
  const chapter=source('src/ui/Chapter09Story.js');
  assert.match(chapter,/playChapter09EstablishingShot\(scene,\{/);
  assert.match(chapter,/onComplete:\(\)=>advance\(\)/);
  assert.match(chapter,/onCancel:\(\)=>\{scene\._chapter09Playing=false;\}/);
  assert.doesNotMatch(source('src/ui/Chapter09EstablishingShot.js'),/markCutsceneSeen|saveSessionState|scene\.start\(/);
  assert.match(source('src/ui/MangaCutscene.js'),/scene\?\._chapter09Establishing\?\.active/);
  assert.match(source('src/ui/CutsceneTester.js'),/startChapter09\(scene,\{preview:true\}\)/);
  assert.match(source('src/ui/StoryArchivePanel.js'),/startChapter09\(scene,\{preview:true\}\)/);
  assert.equal(typeof startChapter09,'function');
});
