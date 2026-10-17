import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EventEmitter} from 'node:events';
import {CHAPTER09_GROUPS,chapter09ShotAssets,playChapter09RegoRoom} from '../src/ui/Chapter09EstablishingShot.js';
import {CHAPTER09_SEQUENCE,CHAPTER09_SCENES} from '../src/data/chapter09.js';
import {startChapter09} from '../src/ui/Chapter09Story.js';

globalThis.Phaser={
  Loader:{Events:{COMPLETE:'complete'}},
  Scenes:{Events:{SHUTDOWN:'shutdown',DESTROY:'destroy'}},
  Textures:{FilterMode:{NEAREST:'nearest'}},
};
const source=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');

function fakeScene({phase='night',playerId='renMizuno'}={}){
  const nodes=[],timers=[],tweens=[],loads=[],textures=new Set(),events=new EventEmitter();
  const make=(type,value='')=>{
    const node={type,value,alpha:1,active:true,handlers:{},
      setDepth(){return this;},setScrollFactor(){return this;},
      setOrigin(){return this;},setScale(){return this;},
      setFlipX(){return this;},setAlpha(n){this.alpha=n;return this;},
      setStrokeStyle(){return this;},setInteractive(){this.interactive=true;return this;},
      disableInteractive(){this.interactive=false;return this;},
      on(event,fn){this.handlers[event]=fn;return this;},
      destroy(){this.active=false;},
    };
    nodes.push(node);return node;
  };
  const scene={worldPhase:phase,
    registry:{get:key=>({playerCharacterId:playerId,firstName:'Test',lastName:'Driver'})[key]},
    events,scale:{width:1560,height:840},sys:{isActive:()=>true},
    textures:{
      exists:k=>textures.has(k),
      get:key=>({getSourceImage:()=>({width:390,height:key.startsWith('chapter09Rego')?230:550}),
        setFilter(){}}),
    },
    add:{rectangle:()=>make('rectangle'),ellipse:()=>make('ellipse'),
      image:(x,y,key)=>make('image',key),text:(x,y,value)=>make('text',value)},
    tweens:{add:cfg=>{tweens.push(cfg);return cfg;},killTweensOf:()=>{}},
    time:{delayedCall:(ms,fn)=>{
      const t={ms,fn,removed:false,remove(){this.removed=true;}};
      timers.push(t);return t;
    }},
    load:{once(name,fn){this.done=fn;},off(name,fn){if(this.done===fn)this.done=null;},
      image(key,path){loads.push({key,path});},isLoading:()=>false,
      start(){loads.forEach(item=>textures.add(item.key));this.done?.();}},
  };
  return {scene,nodes,timers,tweens,loads};
}

test('opening and visitor share authentic rego room and only six permanent people',()=>{
  assert.deepEqual(CHAPTER09_GROUPS.left.map(x=>x.id),
    ['sayakaFujieda','daichiSakamoto','$PLAYER']);
  assert.deepEqual(CHAPTER09_GROUPS.right.map(x=>x.id),
    ['ryujiTakahashi','masatoKuroda','hiroshiSato']);
  assert.equal(CHAPTER09_GROUPS.mika.id,'mikaHayaseChampion');
  for(const phase of ['day','night']){
    const assets=chapter09ShotAssets(fakeScene({phase}).scene);
    assert.equal(assets.background.path,
      'assets/CentralTokyo/dragcomplex/regoroom_'+phase+'.png');
    assert.equal(assets.left.length+assets.right.length,6);
    assert.equal(assets.left[2].id,'renMizuno');
    assert.ok(fs.existsSync(new URL('../'+assets.background.path,import.meta.url)));
    for(const entry of [...assets.left,...assets.right,assets.mika]){
      assert.ok(entry.asset?.path,entry.id);
      assert.ok(fs.existsSync(new URL('../'+entry.asset.path,import.meta.url)),entry.id);
    }
  }
});

test('opening is a six-character establishing shot with manual CONTINUE into manga',()=>{
  const t=fakeScene();let called=0,cancelled=0;
  const stage=playChapter09RegoRoom(t.scene,{
    mode:'opening',onComplete:()=>called++,onCancel:()=>cancelled++,
  });
  assert.ok(stage?.active);
  assert.equal(t.nodes.filter(n=>n.type==='image').length,7,'six characters + room');
  assert.equal(stage.characters.size,6);
  assert.equal(t.nodes.filter(n=>n.value==='CONTINUE  >').length,1);
  assert.equal(stage.phase,'opening');
  assert.equal(stage.continue(),false,'cannot advance before room fade-in');
  t.timers.find(x=>x.ms===1320).fn();
  assert.equal(stage.phase,'ready');
  assert.equal(called,0,'no automatic progression');
  assert.equal(stage.continue(),true);
  assert.equal(stage.continue(),false,'duplicate taps ignored');
  const fade=t.tweens.findLast(x=>x.duration===420&&typeof x.onComplete==='function');
  assert.ok(fade);
  fade.onComplete();
  assert.equal(called,1);
  assert.equal(cancelled,0);
  assert.equal(stage.active,false);
  assert.equal(t.scene._chapter09Stage,null);
  assert.ok(t.nodes.every(n=>!n.active),'no lingering room over manga');
  assert.ok(t.timers.every(x=>x.removed),'no lingering timers');
});

test('Mika fades into the same room, then waits for explicit continue before manga',()=>{
  const t=fakeScene({phase:'day'});let called=0;
  const state=playChapter09RegoRoom(t.scene,{mode:'mika',onComplete:()=>called++});
  assert.ok(state?.active);
  assert.equal(state.characters.size,7);
  assert.equal(t.nodes.filter(n=>n.type==='image').length,8,'room + six cast + Mika');
  assert.ok(t.loads.some(x=>x.path.includes('regoroom_day.png')));
  assert.ok(t.loads.some(x=>x.path.includes('mika_hayase_idle.png')));
  assert.equal(state.continue(),false);
  t.timers.find(x=>x.ms===1120).fn();
  assert.ok(t.tweens.some(x=>x.alpha===.98&&x.duration===930),'Mika visible fade-in');
  assert.equal(called,0);
  t.timers.find(x=>x.ms===2200).fn();
  assert.equal(state.phase,'ready');
  assert.equal(called,0,'Mika does not automatically trigger dialogue');
  state.continue();
  const fade=t.tweens.findLast(x=>x.duration===420&&typeof x.onComplete==='function');
  assert.ok(fade);fade.onComplete();
  assert.equal(called,1);
  assert.ok(t.nodes.every(x=>!x.active));
});

test('opening and visitor clean up safely on interrupted scene or asset load',()=>{
  const t=fakeScene();let cancelled=0,completed=0;
  const s=playChapter09RegoRoom(t.scene,{mode:'opening',
    onComplete:()=>completed++,onCancel:()=>cancelled++});
  assert.ok(t.loads.length>=7);
  assert.ok(t.loads.some(x=>x.path.includes('regoroom_night.png')));
  t.scene.events.emit('shutdown');
  assert.equal(cancelled,1);
  assert.equal(completed,0);
  assert.equal(s.active,false);
  assert.equal(t.scene._chapter09Stage,null);
  assert.ok(t.nodes.every(x=>!x.active));
});

test('original four manga scenes preserved with one registration-room beat before Mika',()=>{
  const story=source('src/ui/Chapter09Story.js');
  const stage=source('src/ui/Chapter09EstablishingShot.js');
  const manga=source('src/ui/MangaCutscene.js');
  assert.equal(CHAPTER09_SEQUENCE.length,4);
  assert.deepEqual(CHAPTER09_SEQUENCE,[
    'chapter09OldGuard','chapter09Rules','chapter09Visitor','chapter09Welcome']);
  assert.match(story,/playMangaCutscene\(scene,id,\{/);
  assert.match(story,/preloadPagePosesOnly:true/);
  assert.match(story,/onPreviewComplete:done/);
  assert.match(story,/if\(sequence\[index\]==='chapter09Visitor'&&!mikaRevealed\)/);
  assert.match(story,/stage\('mika',playDialogue\)/);
  assert.match(story,/if\(sequence\[0\]==='chapter09OldGuard'\)return stage\('opening',advance\)/);
  assert.match(stage,/const MIKA=Object\.freeze\(\{id:'mikaHayaseChampion'/);
  assert.doesNotMatch(stage,/markCutsceneSeen|saveSessionState|playMangaCutscene/);
  assert.match(manga,/createCharacterProfile/);
  assert.match(manga,/scene\?\._chapter09Stage\?\.active/);
  assert.ok(CHAPTER09_SCENES.chapter09Visitor.pages.some(p=>p.leftPose==='win'));
  assert.equal(typeof startChapter09,'function');
});

test('dev full-chapter and player archive replay both use the complete hybrid playback',()=>{
  const tester=source('src/ui/CutsceneTester.js');
  const archive=source('src/ui/StoryArchivePanel.js');
  const story=source('src/ui/Chapter09Story.js');
  assert.match(tester,/startChapter09\(scene,\{preview:true\}\)/);
  assert.match(archive,/startChapter09\(scene,\{preview:true\}\)/);
  assert.match(story,/const sequence=preview\?\[\.\.\.CHAPTER09_SEQUENCE\]/);
  assert.match(story,/onPreviewComplete:done/);
  assert.match(archive,/const leftColumn=i<5/);
  assert.match(archive,/const y=210\+\(leftColumn\?i:i-5\)\*123/);
});
