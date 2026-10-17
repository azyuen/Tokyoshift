import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EventEmitter} from 'node:events';
import {CHAPTER09_GROUPS,chapter09ShotAssets,playChapter09RegoRoom} from '../src/ui/Chapter09EstablishingShot.js';
import {CHAPTER09_SCENES,CHAPTER09_SEQUENCE} from '../src/data/chapter09.js';
import {startChapter09} from '../src/ui/Chapter09Story.js';

globalThis.Phaser={
  Loader:{Events:{COMPLETE:'complete'}},
  Scenes:{Events:{SHUTDOWN:'shutdown',DESTROY:'destroy'}},
  Textures:{FilterMode:{NEAREST:'nearest'}},
};
const source=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
function fakeScene({phase='night',playerId='renMizuno',cached=false}={}){
  const nodes=[],timers=[],tweens=[],loads=[],textures=new Set(),events=new EventEmitter();
  const make=(type,value='')=>{
    const node={type,value,alpha:1,active:true,handlers:{},texture:{key:value},
      setDepth(){return this;},setScrollFactor(){return this;},
      setOrigin(){return this;},setScale(){return this;},
      setFlipX(){return this;},setAlpha(n){this.alpha=n;return this;},
      setStrokeStyle(){return this;},setInteractive(){this.interactive=true;return this;},
      setText(value){this.value=value;return this;},
      setTexture(value){this.value=value;this.texture.key=value;return this;},
      on(event,fn){this.handlers[event]=fn;return this;},
      destroy(){this.active=false;},
    };
    nodes.push(node);return node;
  };
  const registry={get:key=>({playerCharacterId:playerId,
    cutscenesSeen:[],firstName:'Test',lastName:'Driver'})[key]};
  const scene={worldPhase:phase,registry,events,
    scale:{width:1560,height:840},sys:{isActive:()=>true},
    textures:{exists:k=>textures.has(k),get:key=>({
      getSourceImage:()=>({width:390,height:key.startsWith('chapter09Rego')?230:550}),
      setFilter(){},
    })},
    add:{
      rectangle:()=>make('rectangle'),ellipse:()=>make('ellipse'),
      image:(x,y,k)=>make('image',k),
      text:(x,y,value)=>make('text',value),
    },
    tweens:{add:cfg=>{tweens.push(cfg);return cfg;},killTweensOf:()=>{}},
    time:{delayedCall:(ms,fn)=>{
      const timer={ms,fn,removed:false,remove(){this.removed=true;}};
      timers.push(timer);return timer;
    }},
    load:{once(name,fn){this.done=fn;},off(name,fn){if(this.done===fn)this.done=null;},
      image(key,path){loads.push({key,path});},
      isLoading:()=>false,
      start(){loads.forEach(x=>textures.add(x.key));this.done?.();},
    },
  };
  if(cached){
    // Stage includes every pose used across the full Chapter 09 dialogue.
    // The uncached test checks the same first-load path used by Garage/Meet.
    const base=chapter09ShotAssets(scene);
    textures.add(base.background.key);
  }
  return {scene,nodes,timers,tweens,loads,textures};
}

test('rego room day/night assets and exactly six permanent cast, without the junior mechanics',()=>{
  assert.deepEqual(CHAPTER09_GROUPS.left.map(x=>x.id),
    ['sayakaFujieda','daichiSakamoto','$PLAYER']);
  assert.deepEqual(CHAPTER09_GROUPS.right.map(x=>x.id),
    ['ryujiTakahashi','masatoKuroda','hiroshiSato']);
  assert.equal(CHAPTER09_GROUPS.mika.id,'mikaHayaseChampion');
  for(const phase of ['day','night']){
    const s=fakeScene({phase}).scene;
    const assets=chapter09ShotAssets(s);
    assert.equal(assets.background.path,
      'assets/CentralTokyo/dragcomplex/regoroom_'+phase+'.png');
    assert.equal(assets.left.length+assets.right.length,6);
    assert.equal(assets.left[2].id,'renMizuno');
    assert.ok(fs.existsSync(new URL('../'+assets.background.path,import.meta.url)));
    for(const person of [...assets.left,...assets.right,assets.mika]){
      assert.ok(person.asset?.path,person.id);
      assert.ok(fs.existsSync(new URL('../'+person.asset.path,import.meta.url)),person.id);
    }
  }
});

test('full scene uses one room, never rebuilds it between sections and Mika enters then leaves',()=>{
  const t=fakeScene();let completions=0,cancellations=0;
  const state=playChapter09RegoRoom(t.scene,{preview:true,
    onComplete:()=>completions++,onCancel:()=>cancellations++});
  assert.ok(state?.active);
  assert.ok(t.loads.some(x=>x.path.includes('regoroom_night.png')));
  assert.equal(t.nodes.filter(x=>x.type==='image').length,8,
    'background + six actors + Mika initially hidden');
  assert.equal(t.nodes.filter(x=>x.type==='image'&&x.value.startsWith('chapter09Rego')).length,1);
  assert.equal(state.phase,'opening');
  const initialBackground=t.nodes.find(x=>x.type==='image'&&x.value.startsWith('chapter09Rego'));
  const firstSix=[...state.characters.entries()].filter(([id])=>id!=='mikaHayaseChampion');
  assert.equal(firstSix.length,6);
  t.timers.find(x=>x.ms===1750).fn();
  assert.equal(state.phase,'dialogue');
  assert.match(state.sectionTitle.value,/SCENE 1\/4/);
  state.showScene(1);
  assert.match(state.sectionTitle.value,/SCENE 2\/4/);
  state.showScene(2);
  assert.match(state.sectionTitle.value,/SCENE 3\/4/);
  assert.equal(state.characters.get('mikaHayaseChampion').visible,true);
  state.showScene(3);
  assert.match(state.sectionTitle.value,/SCENE 4\/4/);
  assert.equal(state.characters.get('mikaHayaseChampion').visible,false);
  assert.equal(t.nodes.filter(x=>x.type==='image'&&x.value.startsWith('chapter09Rego')).length,1,
    'same background persists for entire chapter');
  assert.equal(initialBackground.active,true);
  assert.equal(firstSix.every(([id,actor])=>actor.sprite.active),true);
  state.skip();
  const fade=t.tweens.findLast(x=>typeof x.onComplete==='function'&&x.duration===440);
  assert.ok(fade);fade.onComplete();
  assert.equal(completions,1);
  assert.equal(cancellations,0);
  assert.equal(t.scene._chapter09Stage,null);
  assert.ok(t.nodes.every(n=>!n.active),'clean overlay after complete');
});

test('first-use source preloads all character poses and shutdown never alters progress',()=>{
  const t=fakeScene();let cancels=0;
  const state=playChapter09RegoRoom(t.scene,{preview:true,onCancel:()=>cancels++});
  assert.ok(t.loads.length>=8,'background, six permanent cast, Mika and speaking poses');
  assert.ok(t.loads.some(x=>x.path.includes('mika_hayase_win.png')),
    'Mika actual win pose is available during her farewell');
  assert.ok(t.loads.some(x=>x.path.includes('regoroom_night.png')));
  t.scene.events.emit('shutdown');
  assert.equal(cancels,1);
  assert.equal(state.active,false);
  assert.equal(t.scene._chapter09Stage,null);
  assert.ok(t.nodes.every(n=>!n.active));
});

test('full Chapter 09 replay stays career-safe and uses same persistent room for Arkon Den and Story Archive',()=>{
  const story=source('src/ui/Chapter09Story.js');
  const stage=source('src/ui/Chapter09EstablishingShot.js');
  assert.match(story,/playChapter09RegoRoom\(scene,\{/);
  assert.match(story,/preview,/);
  assert.match(story,/onCancel:\(\)=>\{scene\._chapter09Playing=false;\}/);
  assert.match(stage,/if\(!preview\)\{/);
  assert.match(stage,/markCutsceneSeen\(scene\.registry,id\)/);
  assert.match(stage,/saveSessionState\(scene\.registry\)/);
  assert.match(stage,/drawPage\(\); \/\/ same background and cast objects/);
  assert.doesNotMatch(stage,/scene\.start\(/);
  assert.match(source('src/ui/MangaCutscene.js'),/scene\?\._chapter09Stage\?\.active/);
  assert.match(source('src/ui/CutsceneTester.js'),/startChapter09\(scene,\{preview:true\}\)/);
  assert.match(source('src/ui/StoryArchivePanel.js'),/startChapter09\(scene,\{preview:true\}\)/);
  assert.equal(CHAPTER09_SEQUENCE.length,4);
  assert.ok(CHAPTER09_SCENES.chapter09Visitor.pages.some(p=>p.leftCharacter==='mikaHayaseChampion'));
  assert.equal(typeof startChapter09,'function');
});
