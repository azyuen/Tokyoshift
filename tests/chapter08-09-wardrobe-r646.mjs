import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CHAPTER08_SCENES} from '../src/data/chapter08.js';
import {CHAPTER09_SCENES,CHAPTER09_SEQUENCE} from '../src/data/chapter09.js';
import {chapter09ShotAssets,playChapter09RegoRoom} from '../src/ui/Chapter09EstablishingShot.js';

globalThis.Phaser={
  Loader:{Events:{COMPLETE:'complete'}},
  Scenes:{Events:{SHUTDOWN:'shutdown',DESTROY:'destroy'}},
  Textures:{FilterMode:{NEAREST:'nearest'}},
};
const source=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Chapter 08 Porsche confrontation, Sayaka reveal and later outfit cue remain ordered',()=>{
  const pages=CHAPTER08_SCENES.chapter08Ginza.pages;
  const beat=name=>pages.findIndex(p=>p.cinematicBeat===name);
  assert.ok(pages.slice(0,5).some(p=>p.text.includes('Porsche')));
  assert.ok(pages.slice(0,5).some(p=>p.text.includes('Ms Fujieda')));
  assert.equal(beat('chapter08SayakaExit'),5);
  assert.ok(beat('chapter08SayakaGallery')>5);
  assert.ok(beat('chapter08SayakaOutfitCue')>beat('chapter08SayakaGallery'));
  assert.ok(beat('chapter08FinalPortrait')>beat('chapter08SayakaOutfitCue'));
  assert.equal(pages[beat('chapter08SayakaOutfitCue')].leftPose,'ginzaHappy');
  assert.equal(pages[beat('chapter08FinalPortrait')].leftPose,'track');
  const story=source('src/ui/Chapter08Story.js');
  const stage=source('src/ui/Chapter08GinzaRevealStage.js');
  assert.match(story,/pages:definition\.pages\.slice\(0,5\)/);
  assert.match(story,/pages:definition\.pages\.slice\(5\)/);
  assert.match(story,/characters:\{left:'sayakaFujieda',right:'\$PLAYER'\}/);
  assert.match(story,/stage\?\.revealSayaka\?/);
  assert.match(story,/stage\?\.changeSayakaOutfit\?/);
  assert.match(story,/stage\?\.restoreAfterOutfit\?/);
  assert.match(story,/showStoryContinuePrompt\(scene/);
  assert.match(stage,/tokyo_ginza_night\.png/);
  assert.match(stage,/rwbStellaPorsche/);
  assert.match(stage,/depth\+300/);
  assert.ok(fs.existsSync(new URL('../assets/CentralTokyo/tokyo_ginza_night.png',import.meta.url)));
  assert.ok(fs.existsSync(new URL('../assets/Characters/Main/race_sayaka_fujieda_idle.png',import.meta.url)));
  assert.match(source('src/scenes/CentralTokyoScene.js'),/this\.time\.delayedCall\(100, \(\) => \{[\s\S]*?startChapter08Ginza\(this\)/);
});

test('Chapter 09 final line cues wardrobe and stage swaps real pro sprite assets',()=>{
  const end=CHAPTER09_SCENES.chapter09Welcome.pages;
  assert.match(end.at(-2).text,/fire up our engines/);
  assert.match(end.at(-1).text,/look like professionals/);
  const resolved=chapter09ShotAssets({worldPhase:'night',registry:{get:k=>k==='playerCharacterId'?'renMizuno':null}});
  assert.equal(resolved.left[1].asset.path,'assets/Characters/Main/home_daichi_sakamoto.png');
  assert.equal(resolved.costumes[0].asset.path,'assets/Characters/Main/pro_daichi_sakamoto.png');
  assert.ok(resolved.costumes[1].asset.path.includes('/Pro/'));
  resolved.costumes.forEach(person=>
    assert.ok(fs.existsSync(new URL('../'+person.asset.path,import.meta.url)),person.id));
  assert.deepEqual(CHAPTER09_SEQUENCE,['chapter09OldGuard','chapter09Rules','chapter09Visitor','chapter09Welcome']);
  const story=source('src/ui/Chapter09Story.js');
  assert.match(story,/stage\?\.showProOutfits\?\.\(\(\)=>later\(finish\)\)/);
});

test('Chapter 09 room holds until CONTINUE after outfit swap',()=>{
  const nodes=[],timers=[],tweens=[],loads=[],textures=new Set();
  const make=(kind,value='')=>{
    const node={kind,value,alpha:1,active:true,texture:{key:value},depth:0,handlers:{},
      setDepth(v){this.depth=v;return this;},setScrollFactor(){return this;},
      setOrigin(){return this;},setScale(){return this;},
      setTexture(k){this.texture={key:k};return this;},
      setFlipX(){return this;},setAlpha(v){this.alpha=v;return this;},
      setStrokeStyle(){return this;},setInteractive(){return this;},
      disableInteractive(){return this;},on(k,fn){this.handlers[k]=fn;return this;},
      destroy(){this.active=false;},
    };
    nodes.push(node);return node;
  };
  const handlers=new Map();
  const scene={
    registry:{get:k=>k==='playerCharacterId'?'renMizuno':null},
    events:{once(k,fn){handlers.set(k,fn)},off(k,fn){if(handlers.get(k)===fn)handlers.delete(k)}},
    worldPhase:'night',sys:{isActive:()=>true},scale:{width:1560,height:840},
    textures:{exists:k=>textures.has(k),get:k=>({
      getSourceImage:()=>({width:400,height:600}),setFilter(){},
    })},
    add:{rectangle:()=>make('rect'),ellipse:()=>make('ellipse'),
      image:(x,y,key)=>make('image',key),text:(x,y,text)=>make('text',text)},
    tweens:{add:c=>{tweens.push(c);return c},killTweensOf(){}},
    time:{delayedCall:(ms,fn)=>{
      const t={ms,fn,remove(){}};timers.push(t);return t;
    }},
    load:{once(k,fn){this.callback=fn},off(){},image:(key,path)=>loads.push({key,path}),
      isLoading:()=>false,
      start(){loads.forEach(({key})=>textures.add(key));this.callback?.()},
    },
  };
  let finished=0;
  const stage=playChapter09RegoRoom(scene,{onContinue:()=>{}});
  timers.find(t=>t.ms===1340).fn();
  assert.ok(stage.continue());
  const daichi=stage.characters.get('daichiSakamoto').sprite;
  const player=stage.characters.get('renMizuno').sprite;
  assert.notEqual(daichi.texture.key,'chapter09DaichiProfessional');
  assert.ok(stage.showProOutfits(()=>finished++));
  assert.equal(stage.phase,'wardrobe');
  tweens.findLast(t=>t.duration===390).onComplete();
  assert.equal(daichi.texture.key,'chapter09DaichiProfessional');
  assert.ok(player.texture.key.startsWith('proCircuitCharacter_'));
  tweens.findLast(t=>t.duration===570).onComplete();
  assert.equal(stage.phase,'ready');
  assert.equal(finished,0);
  assert.ok(stage.continue());
  assert.equal(finished,1);
});

test('Meet progression continuation plates fit longest label and badges use pink',()=>{
  const sourceCode=source('src/scenes/MeetScene.js');
  assert.match(sourceCode,/const width = 394/);
  assert.match(sourceCode,/const right = STAGE\.x \+ STAGE\.w - 34/);
  assert.match(sourceCode,/getPinkMeetBadge\(source/);
  assert.match(sourceCode,/0xff5f93/);
  assert.doesNotMatch(sourceCode,/getGreyMeetBadge/);
});
