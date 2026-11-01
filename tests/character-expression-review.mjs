import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {STORY_DIRECTOR_SCRIPTS as scripts} from '../src/data/storyDirectorScripts.js';
import {CUTSCENES as cutscenes} from '../src/data/cutscenes.js';
import {getCharacterVisualAsset} from '../src/data/characters.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {polishArukenPresentation} from '../src/story/ArukenPresentation.js';
import {playOpeningPhonePrototype} from '../src/ui/OpeningPhonePrototype.js';
import {playPhoneConversation} from '../src/ui/PhoneConversation.js';

const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scene=(n,title)=>scripts['arkonChapter'+n].steps.find(s=>s.title===title);
const line=(n,title,text)=>scene(n,title).pages.find(p=>p.text.includes(text));
const clean=x=>Array.isArray(x)?x.map(clean):x&&typeof x==='object'?
 Object.fromEntries(Object.entries(x).filter(([k])=>!['pose','leftPose','rightPose','centerPose'].includes(k)).map(([k,v])=>[k,clean(v)])):x;

test('all dialogue, choices, rewards, chapter positions and Career reveal gates match cf80b7d',()=>{
 const hash=createHash('sha256').update(JSON.stringify(clean({scripts,cutscenes}))).digest('hex');
 assert.equal(hash,'f8ac1626cbab8ecaf3458ad7c41b94b003a399fee733eee8f3f64c87f4bbafa5');
});

test('every Story and Career Aruken/Sayaka pose resolves without an idle fallback',()=>{
 const check=(id,pose,where)=>{
  if(!['arkonDen','sayakaFujieda'].includes(id)||!pose)return;
  const asset=getCharacterVisualAsset(id,pose);
  assert.ok(asset,where);assert.equal(asset.fallback,false,where+' '+pose);
 };
 for(const [id,script] of Object.entries(scripts)){
  if(!id.startsWith('arkonChapter'))continue;
  validateStoryScript(script);
  for(const s of script.steps){
   if(s.type==='STAGE')for(const a of s.characters||[])check(a.id,a.pose,id);
   for(const p of s.pages||[])for(const side of ['left','center','right'])
    check(p[side+'Character']||s.characters?.[side],p[side+'Pose']||(p.speaker===side?p.pose:null),id+' '+s.title);
  }
 }
 for(const s of Object.values(cutscenes))for(const p of s.pages||[])for(const side of ['left','right'])
  check(p[side+'Character']||s.characters?.[side],p[side+'Pose']||(p.speaker===side?p.pose:null),s.id);
});

test('cleared work tableaux release expressions, while active mechanic scenes keep workwear',()=>{
 const script={id:'arkonChapter02',steps:[
  {type:'STAGE',backgroundId:'workshop:shinonomeWorkshop:night',characters:[{id:'arkonDen',pose:'storyMechanicEngine'}]},
  {type:'MANGA',characters:{left:'arkonDen'},pages:[{speaker:'left',leftPose:'storyThinking'}]},
  {type:'CLEAR_STAGE'},
  {type:'MANGA',characters:{left:'arkonDen'},pages:[{speaker:'left',leftPose:'storySurprised'}]},
 ]};
 polishArukenPresentation(script);
 assert.equal(script.steps[1].pages[0].leftPose,'storyMechanic');
 assert.equal(script.steps[3].pages[0].leftPose,'storySurprised');
 assert.equal(line('02','A VERY FAMILIAR INSTRUCTOR','Where is the instructor').leftPose,'storySurprised');
 assert.equal(line('02','A DIFFERENT KIND OF TALENT','very glad I came').leftPose,'storyCoolShy');
});

test('Chapter 5 road tests retain casual emotional range without changing repair costumes',()=>{
 assert.equal(line('05','THE PAIR FROM CANAL YARD','compliment').leftPose,'storyConfidentSmirk');
 assert.equal(line('05','A WORKSHOP WORTH REMEMBERING','').leftPose,'storyConfident');
 const work=scene('05','A MECHANIC, NOT A MAGICIAN');
 assert.ok(work.pages.every(p=>p.leftPose.startsWith('storyMechanic')));
});

test('quiet emotional beats and listener reactions survive chapter wardrobe processing',()=>{
 assert.equal(line('03','A LITTLE MORE POWER','You look nice too').leftPose,'storyBlushing');
 assert.equal(line('05','THE DAY SHE NEEDED A FRIEND','He went home').rightPose,'homeSad');
 assert.equal(scene('05','COMPLETELY IN SYNC').pages.find(p=>p.speaker==='right'&&p.text.includes('We are not a couple')).rightPose,'homeBlushing');
 assert.equal(line('06','THE KEYS','Wait. You cannot').rightPose,'homeAlert');
 assert.equal(line('07','SOME OTHER NIGHT','Not tonight').rightPose,'homeSad');
 assert.equal(line('07','SOME OTHER NIGHT','Not tonight').leftPose,'storyThinking');
 assert.equal(line('09','THE QUESTION','You never had nothing').leftPose,'storySheepish');
 assert.equal(line('10','THE COST OF KEEPING IT','agreed to sell').rightPose,'homeAlert');
 const c1=scripts.arkonChapter01Revised.steps.filter(s=>s.type==='MANGA'&&s.characters?.right==='sayakaFujieda');
 assert.ok(c1.every(s=>s.pages.every(p=>p.rightPose.startsWith('oshiage'))));
 assert.ok(scene('02','A VERY FAMILIAR INSTRUCTOR').pages.every(p=>p.rightPose.startsWith('oshiage')));
});

test('formal gala reactions are explicit and keep all six formal Sayaka expressions',()=>{
 const poses=new Set(scripts.arkonChapter08.steps.flatMap(s=>(s.pages||[]).flatMap(p=>
  ['left','center','right'].filter(side=>s.characters?.[side]==='sayakaFujieda').map(side=>p[side+'Pose']))));
 for(const p of ['devIdle','devLaughing','devSad','devScowl','devUnsure','devDisappointed'])assert.ok(poses.has(p),p);
 assert.equal(line('08','ANOTHER TIME','Of course.').leftPose,'devSad');
 assert.equal(line('08','EVERYTHING HAS CHANGED','never doubted').leftPose,'devIdle');
 assert.ok(scene('09','AN EXIT').pages.every(p=>p.rightPose==='ginzaDress'));
});

test('opening tutorial both queues and selects the home explaining portrait',()=>{
 const race=source('src/scenes/RaceScene.js');
 const preload=race.slice(race.indexOf('} else if (tutorialQueued)'),race.indexOf('// Each race picks'));
 assert.match(preload,/'homeExplaining'/);
 assert.match(race,/explaining: 'characterSayakaHomeExplaining'/);
});

test('Canal Yard keeps its authored caller expressions through the phone adapter',()=>{
 let captured;
 const context={getCutscene:()=>cutscenes.canalYardBiggerDreams,sceneCutsceneActive:()=>false,
  playMangaCutscene:(s,d,o)=>{if(d.presentation==='phone')captured=d;else o.onComplete?.({});return {played:true};}};
 vm.createContext(context);
 vm.runInContext(source('src/ui/CanalYardStory.js').replace(/^import .*;\n/gm,'').replace('export function','function'),context);
 context.playCanalYardStory({time:{delayedCall:(_,fn)=>fn()}},{preview:true});
 assert.ok(captured);
 assert.deepEqual(Array.from(captured.pages.filter(p=>p.speaker==='caller'),p=>p.pose),
  ['homeHappy','homeAlert','homeExplaining','homeBlushing','homeHappy']);
 assert.ok(captured.pages.filter(p=>p.speaker==='player').every(p=>!p.pose));
});

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
  globalThis.Phaser={Textures:{FilterMode:{NEAREST:1}},Loader:{Events:{COMPLETE:'complete'}},Scenes:{Events:{SHUTDOWN:'shutdown'}}};
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

const phonePages=[
 {speaker:'caller',pose:'homeAlert',text:'Careful.'},
 {speaker:'player',text:'I will.'},
 {speaker:'caller',pose:'homeExplaining',text:'Here is the plan.'},
 {speaker:'caller',text:'Goodbye.'},
];
for(const mode of ['standard','swipe'])test(mode+' phone renders each expression and resets to caller default',()=>{
 const {scene,objects}=fakeScene();let complete=0;
 const config={callerId:'sayakaFujieda',callerPose:'homeHappy',pages:phonePages,onComplete:()=>complete++};
 const state=mode==='swipe'?playOpeningPhonePrototype(scene,config):playPhoneConversation(scene,config);
 if(mode==='swipe')objects.find(x=>x.kind==='circle'&&x.buttons.pointerdown).buttons.pointerdown();
 const shown=key=>assert.ok(objects.some(x=>!x.destroyed&&x.kind==='image'&&(x.args[2]===key||x.calls.some(c=>c[0]==='setTexture'&&c[1]===key))),key);
 const realNow=Date.now;let clock=1000;Date.now=()=>clock+=500;
 try{
  for(const key of ['characterSayakaHomeAlert','characterAyaKurose','characterSayakaHomeExplaining','characterSayakaHomeHappy']){
   shown(key);objects.filter(x=>x.kind==='rectangle'&&x.buttons.pointerdown&&!x.destroyed).at(-1).buttons.pointerdown();
  }
 }finally{Date.now=realNow;}
 assert.equal(complete,1);assert.equal(state.active,false);
});
for(const mode of ['standard','swipe'])test(mode+' phone preloads page poses once before display and supports cancellation',()=>{
 const {scene}=fakeScene();const queued=[];let ready,cancelled=0;
 scene.textures.exists=()=>false;
 scene.load.image=(key,path)=>queued.push([key,path]);scene.load.once=(_,fn)=>ready=fn;
 const config={callerId:'sayakaFujieda',callerPose:'homeHappy',pages:[...phonePages,phonePages[0]],onCancel:()=>cancelled++};
 const state=mode==='swipe'?playOpeningPhonePrototype(scene,config):playPhoneConversation(scene,config);
 for(const key of ['characterSayakaHomeAlert','characterSayakaHomeExplaining','characterSayakaHomeHappy'])assert.equal(queued.filter(x=>x[0]===key).length,1,key);
 assert.equal(queued.some(x=>x[1].includes('/Dev/')),false);
 assert.equal(queued.some(x=>x[1].includes('oshiage_')),false);
 state.close('cancel');ready();assert.equal(state.active,false);assert.equal(cancelled,1);
});
