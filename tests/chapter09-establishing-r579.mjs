import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EventEmitter} from 'node:events';
import {CHAPTER09_GROUPS,CHAPTER09_STAGE_DEPTH,chapter09ShotAssets,playChapter09RegoRoom} from '../src/ui/Chapter09EstablishingShot.js';
import {sceneCutsceneActive} from '../src/ui/MangaCutscene.js';
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
    const node={type,value,alpha:1,depth:0,active:true,handlers:{},
      setDepth(v){this.depth=v;return this;},setScrollFactor(){return this;},
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

test('day/night registration-room art, six cast and real Mika assets',()=>{
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
    for(const person of [assets.background,...assets.left,...assets.right,assets.mika]){
      const path=person.asset?.path || person.path;
      assert.ok(fs.existsSync(new URL('../'+path,import.meta.url)),path);
    }
  }
});

test('CONTINUE into manga keeps the SAME registration room and six characters alive',()=>{
  const t=fakeScene();let progressed=0,cancelled=0;
  const stage=playChapter09RegoRoom(t.scene,{
    onContinue:()=>progressed++,onCancel:()=>cancelled++,
  });
  assert.ok(stage.active);
  assert.equal(CHAPTER09_STAGE_DEPTH,810);
  assert.equal(t.nodes.filter(n=>n.type==='image').length,8,'room + six cast + hidden Mika');
  assert.equal(stage.characters.size,7);
  const people=[...stage.characters.entries()].filter(([id])=>id!=='mikaHayaseChampion');
  assert.equal(people.length,6);
  assert.ok(people.every(([,o])=>o.sprite.alpha===1&&o.shadow.alpha===1),
    'all six characters are opaque from the first frame');
  assert.equal(stage.characters.get('mikaHayaseChampion').sprite.alpha,0,
    'Mika remains hidden until her scripted reveal');
  const background=t.nodes.find(n=>n.value==='chapter09RegoRoomNight');
  assert.ok(background);
  assert.ok(background.depth<900,'room must render BEHIND manga');
  assert.ok(t.nodes.every(n=>n.depth<900),'ALL scene props must be below manga');
  assert.equal(stage.phase,'opening');
  assert.equal(stage.continue(),false,'not ready during introduction');
  t.timers.find(x=>x.ms===1340).fn();
  assert.equal(stage.phase,'ready');
  assert.equal(stage.continue(),true);
  assert.equal(progressed,1);
  assert.equal(cancelled,0);
  assert.equal(stage.phase,'background');
  assert.equal(stage.active,true,'CONTINUE must NOT destroy room');
  assert.equal(t.scene._chapter09Stage,stage);
  assert.equal(background.active,true);
  assert.equal(stage.characters.size,7);
  assert.equal(sceneCutsceneActive(t.scene),true,'the room blocks unrelated scenes');
  assert.equal(sceneCutsceneActive(t.scene,{ignoreChapter09Stage:true}),false,
    'manga can play OVER an active Chapter 09 room');
  assert.ok(t.nodes.filter(n=>n.type==='image').every(n=>n.active));
});

test('Mika fades into the existing room, then CONTINUE returns to manga above it',()=>{
  const t=fakeScene({phase:'day'});let progress=0,visitor=0;
  const stage=playChapter09RegoRoom(t.scene,{onContinue:()=>progress++});
  t.timers.find(x=>x.ms===1340).fn();
  stage.continue();
  const originalRoom=t.nodes.find(n=>n.value==='chapter09RegoRoomDay');
  const originalCast=stage.characters.get('ryujiTakahashi').sprite;
  assert.equal(stage.showMika(()=>visitor++),true);
  assert.equal(stage.phase,'mika');
  const visitorTween=t.tweens.findLast(x=>x.alpha===1&&x.duration===950);
  assert.ok(visitorTween,'Mika fades into room');
  t.timers.find(x=>x.ms===1040).fn();
  assert.equal(stage.phase,'ready');
  assert.equal(visitor,0);
  stage.continue();
  assert.equal(visitor,1);
  assert.equal(progress,1);
  assert.equal(stage.phase,'background');
  assert.equal(originalRoom.active,true,'same room still showing');
  assert.equal(originalCast.active,true,'existing cast was not re-created');
  assert.equal(t.nodes.filter(n=>n.value==='chapter09RegoRoomDay').length,1);
  stage.hideMika();
  assert.ok(t.tweens.some(x=>x.alpha===0&&x.duration===470));
  let ended=0;
  assert.equal(stage.finish(()=>ended++),true);
  assert.equal(ended,0);
  const endFade=t.tweens.findLast(x=>x.duration===430&&typeof x.onComplete==='function');
  assert.ok(endFade);
  endFade.onComplete();
  assert.equal(ended,1);
  assert.equal(stage.active,false);
  assert.equal(t.scene._chapter09Stage,null);
  assert.ok(t.nodes.every(n=>!n.active));
});

test('stage cancellation during scene shutdown cleans room without changing saved progress',()=>{
  const t=fakeScene();let cancelled=0,progressed=0;
  const stage=playChapter09RegoRoom(t.scene,{
    onContinue:()=>progressed++,onCancel:()=>cancelled++,
  });
  assert.ok(t.loads.some(x=>x.path.includes('regoroom_night.png')));
  assert.ok(t.loads.some(x=>x.path.includes('mika_hayase_idle.png')));
  t.scene.events.emit('shutdown');
  assert.equal(cancelled,1);
  assert.equal(progressed,0);
  assert.equal(stage.active,false);
  assert.equal(t.scene._chapter09Stage,null);
  assert.ok(t.nodes.every(n=>!n.active));
});

test('all four original manga chapters overlay the one persistent stage',()=>{
  const story=source('src/ui/Chapter09Story.js');
  const stage=source('src/ui/Chapter09EstablishingShot.js');
  const manga=source('src/ui/MangaCutscene.js');
  assert.deepEqual(CHAPTER09_SEQUENCE,[
    'chapter09OldGuard','chapter09Rules','chapter09Visitor','chapter09Welcome']);
  assert.match(story,/playChapter09RegoRoom\(scene,\{/);
  assert.match(story,/playMangaCutscene\(scene,definition,\{/);
  assert.match(story,/chapter09RoomBackdrop:true/);
  assert.match(story,/ignoreChapter09Stage:true/);
  assert.match(story,/stage\?\.showMika\?\.\(\(\)=>later\(playDialogue\)\)/);
  assert.match(story,/stage\?\.finish\?\.\(/);
  assert.match(stage,/state\.phase='background'/);
  assert.doesNotMatch(stage,/markCutsceneSeen|saveSessionState|playMangaCutscene/);
  assert.match(manga,/createCharacterProfile/);
  assert.match(manga,/paperBackground \? 1 : whiteWash \? 0\.83 : 0\.54/);
  assert.match(manga,/ignoreChapter09Stage: Boolean\(options\.chapter09RoomBackdrop\)/);
  assert.match(manga,/ignoreChapter09Stage: Boolean\(context\?\.options\?\.chapter09RoomBackdrop\)/);
  assert.equal(typeof startChapter09,'function');
  assert.equal(CHAPTER09_SCENES.chapter09Visitor.pages.at(-2).leftPose,'win');
});

test('Arkon Den + Story Archive replay the complete story over the room without saving',()=>{
  const tester=source('src/ui/CutsceneTester.js');
  const archive=source('src/ui/StoryArchivePanel.js');
  const story=source('src/ui/Chapter09Story.js');
  assert.match(tester,/beginProSponsorPlayableReplay/);
  assert.match(archive,/beginProSponsorPlayableReplay/);
  assert.match(story,/const sequence=preview\?\[\.\.\.CHAPTER09_SEQUENCE\]/);
  assert.match(story,/onPreviewComplete:done/);
  assert.ok(story.includes('onPreviewComplete?.()'));
  assert.match(archive,/const leftColumn=i<6/);
  assert.match(archive,/const y=209\+\(leftColumn\?i:i-6\)\*105/);
});
