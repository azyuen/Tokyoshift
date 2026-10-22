// Cross-scene story orchestration. The Director owns progression, not rendering.
// Built on the existing manga, phone, compact HUD, map and race systems.
import {
  validateStoryScript, createStoryCheckpoint, isStoryCheckpoint,
  checkStoryCondition, nextStoryPosition, normaliseStoryChoiceVars,
} from './StoryScript.js?v=20261023-r657';
import { playMangaCutscene, sceneCutsceneActive } from '../ui/MangaCutscene.js?v=20261023-r658';
import { playCompactStoryDialogue } from '../ui/CompactStoryDialogue.js?v=20261022-r640';
import { showStoryStage } from '../ui/StoryStage.js?v=20261023-r660';
import { queueSafeSceneStart } from '../ui/SafeSceneTransition.js?v=20261017-r573';
import { getActiveProfileIndex, saveSessionState } from '../state/GameState.js?v=20261023-r657';
import { STORY_DIRECTOR_SCRIPTS } from '../data/storyDirectorScripts.js?v=20261023-r659';
import { showArkonCustomerTuning } from '../ui/ArkonCustomerTuning.js?v=20261023-r660';
import { recordArkonRwbPurchase } from '../data/arkonChapter04Ledger.js?v=20261023-r659';
import { getRegionalChampionshipCount } from '../data/careerProgression.js?v=20261017-r553';
import {isArkonPlayableReplay,endArkonPlayableReplay} from '../ui/ArkonPlayableReplay.js?v=20261023-r657';
import {
  getArkonCustomerJob,recordArkonCustomerJob,
  beginArkonMx5GuestRace,finishArkonMx5GuestRace,
} from '../data/arkonChapter03Jobs.js?v=20261023-r660';
import { showStoryChoices } from '../ui/StoryChoicePanel.js?v=20261022-r641';
import { showStoryContinuePrompt } from '../ui/StoryContinuePrompt.js?v=20261023-r653';
import { cars } from '../data/cars.js?v=20261017-r565';
import {
  DEV_VAULT_STORY_ID, isArkonVaultStoryLoan, prepareDevVaultHeroRace,
} from '../data/devVaultStory.js?v=20261022-r643';

export const STORY_DIRECTOR_SAVE_KEY = 'storyDirectorProgress';
const DEFAULT_SCENE_DELAY = 2; // allow previous Phaser scene to shut down before resuming

const sceneName = scene => scene?.sys?.settings?.key || '';
const owner = () => getActiveProfileIndex();

export class StoryDirector {
  constructor(game, scripts = STORY_DIRECTOR_SCRIPTS) {
    this.game = game;
    this.scripts = new Map();
    Object.values(scripts).forEach(script => this.register(script));
    this.session = null;
    this.wait = null;
    this.error = null;
    this.sceneDelay = 0;
    this.events = new Map();
    this.tick = this.tick.bind(this);
    game.events.on(Phaser.Core.Events.POST_STEP, this.tick);
    game.events.on('tokyo-shift-story-event', (event, payload) => this.signal(event,payload));
  }
  register(script) {
    const compiled = validateStoryScript(script);
    this.scripts.set(script.id, compiled);
    return script.id;
  }
  activeScene() {
    const scenes = this.game.scene?.getScenes?.(true) || [];
    return scenes.slice().reverse().find(s => s?.sys?.isActive?.() &&
      !['BootScene','ProfileSelectScene','CharacterSelectScene'].includes(sceneName(s))) || null;
  }
  get status() {
    return {
      active: Boolean(this.session), id: this.session?.id || null,
      index: this.session?.index ?? null, waiting: this.wait?.kind || null,
      error: this.error,
    };
  }
  start(scriptOrId, { preview = false, index = 0, vars = {} } = {}) {
    const compiled = typeof scriptOrId === 'string'
      ? this.scripts.get(scriptOrId)
      : validateStoryScript(scriptOrId);
    if (!compiled || this.session) return false;
    const scene = this.activeScene();
    if (!scene?.registry || sceneCutsceneActive(scene) || scene._compactStoryDialogue?.active) return false;
    // Chapter 04 is opt-in from the workshop Story Objective only. Never
    // initiate it behind a Meet/pink-slip popup or during a scene transition.
    if (compiled.script.id==='arkonChapter04' &&
        (sceneName(scene)!=='GarageScene' || scene.crewMode ||
         scene.registry.get('gameMode')!=='arkonStory' ||
         !scene.registry.get('arkonStoryChapter03Done') ||
         scene.registry.get('arkonStoryChapter04Done')))return false;
    const id = compiled.script.id;
    if (preview && !this.scripts.has(id)) this.register(compiled.script);
    const savedIndex = Math.max(0, Math.floor(Number(index) || 0));
    if (savedIndex >= compiled.script.steps.length) return false;
    this.session = { id, index: savedIndex, slot: owner(), preview: Boolean(preview),
      vars: normaliseStoryChoiceVars(vars) };
    this.wait = null; this.error = null; this.sceneDelay = 0;
    this.events.clear();
    this.checkpoint();
    this.tick();
    return true;
  }
  // Only explicitly registered scripts may resume from saved profile data.
  resume() {
    if (this.session) return false;
    const scene = this.activeScene();
    const checkpoint = this.game.registry?.get?.(STORY_DIRECTOR_SAVE_KEY);
    if (!scene || !isStoryCheckpoint(checkpoint) ||
        checkpoint.ownerSlot !== owner() || !this.scripts.has(checkpoint.id)) return false;
    return this.start(checkpoint.id, { index: checkpoint.index, vars:checkpoint.vars });
  }
  checkpoint() {
    if (!this.session || this.session.preview) return;
    const registry = this.game.registry;
    registry.set(STORY_DIRECTOR_SAVE_KEY,
      createStoryCheckpoint(this.session.id, this.session.index, this.session.slot,
        this.session.vars));
    saveSessionState(registry);
  }
  clearStage() {
    for (const scene of this.game.scene?.getScenes?.(true) || []) {
      scene._storyDirectorStage?.destroy?.();
      scene.setStoryEncounterActive?.(false);
    }
  }
  stop({ complete = false } = {}) {
    const was = this.session;
    this.session = null; this.wait = null; this.error = null;
    this.events.clear();
    this.clearStage();
    for (const scene of this.game.scene?.getScenes?.(true) || [])
      { scene._storyChoicePanel?.destroy?.();
        scene._storyContinuePrompt?.destroy?.(); }
    if (was && !was.preview && complete && was.slot === owner()) {
      this.game.registry.set(STORY_DIRECTOR_SAVE_KEY, null);
      saveSessionState(this.game.registry);
    }
    if(was?.id==='arkonChapter02' && complete &&
       !isArkonPlayableReplay(this.game.registry)){
      this.activeScene()?.buildMeetProgressionButtons?.();
    }
    if (was && complete && isArkonPlayableReplay(this.game.registry)) {
      const scene=this.activeScene();
      if(scene)endArkonPlayableReplay(scene);
    }
    // Do not discard an interrupted real checkpoint without explicit request.
    return Boolean(was);
  }
  cancel() {
    const was = this.session;
    if (!was) return false;
    this.stop();
    if (!was.preview && was.slot === owner()) {
      this.game.registry.set(STORY_DIRECTOR_SAVE_KEY, null);
      saveSessionState(this.game.registry);
    }
    return true;
  }
  advance() {
    if (!this.session) return;
    this.session.index++;
    this.wait = null;
    this.checkpoint();
    this.sceneDelay = DEFAULT_SCENE_DELAY;
  }
  signal(event, payload = {}) {
    if (!event || !this.session) return;
    this.events.set(String(event), payload);
    if (this.wait?.kind === 'event' && this.wait.event === event) this.advance();
  }
  tick() {
    if (this.game.registry?.get?.('__arkonStoryRecountActive')) return;
    if (!this.session) {
      const registry=this.game.registry;
      // A playable replay starts from an Office button. Its scene transition
      // is deferred to the browser event loop, so a same-frame POST_STEP must
      // NOT resume the chapter in the outgoing GarageScene: that would create
      // a HOLD_SCENE or interactive job which the transition immediately
      // destroys, leaving the replay stuck or appearing cinematic-only.
      if (isArkonPlayableReplay(registry)) {
        const active=this.activeScene();
        const replayChapter=Number(registry.get('__arkonStoryPlayableReplayChapter')||0);
        const expected=replayChapter===1||replayChapter===4
          ? 'GarageScene' : 'MeetScene';
        if (!replayChapter || sceneName(active)!==expected ||
            active?._pendingSafeSceneStart) return;
      }
      const checkpoint=registry?.get?.(STORY_DIRECTOR_SAVE_KEY);
      // The sequel begins on the NEXT ordinary Meet visit after Chapter 01.
      // Never touch Career, the debug developer save or an older checkpoint.
      if (!isArkonPlayableReplay(registry) && !checkpoint && registry?.get?.('gameMode')==='arkonStory' &&
          registry.get('arkonStoryChapter01RevisedDone') &&
          !registry.get('arkonStoryChapter02Done') &&
          sceneName(this.activeScene())==='MeetScene' &&
          !sceneCutsceneActive(this.activeScene())) {
        if(this.start('arkonChapter02'))return;
      }
      if (!isArkonPlayableReplay(registry) && !checkpoint && registry?.get?.('gameMode')==='arkonStory' &&
          registry.get('arkonStoryChapter02Done') &&
          !registry.get('arkonStoryChapter03Done') &&
          getRegionalChampionshipCount(registry)>=1 &&
          sceneName(this.activeScene())==='MeetScene' &&
          !sceneCutsceneActive(this.activeScene())) {
        if(this.start('arkonChapter03'))return;
      }
      this.resume();return;
    }
    if (this.session.slot !== owner()) { this.stop(); return; }
    if (this.error) return;
    const scene = this.activeScene();
    if (!scene || !scene?.registry) return;
    // An interrupted Chapter 04 never resumes its private workshop story
    // over normal Meet, pending pink slips, or an unrelated location UI.
    if(this.session.id==='arkonChapter04' &&
       (sceneName(scene)!=='GarageScene' || scene.crewMode ||
        scene._arkonStoryObjectiveOpen || sceneCutsceneActive(scene) &&
        this.wait?.kind!=='dialogue'))return;
    if (this.sceneDelay > 0) { this.sceneDelay--; return; }
    if (this.wait) {
      const wait = this.wait;
      if (wait.kind === 'transition') {
        // Phaser may reuse the same scene object when restarting GarageScene.
        // Scene delay has already allowed the scheduled transition to execute.
        if (sceneName(scene) !== wait.target) return;
        this.wait = null;
      } else if (wait.kind === 'sceneChanged') {
        if (sceneName(scene) === wait.source) return;
        this.advance();
      } else if (wait.kind === 'dialogue') {
        return;
      } else if (wait.kind === 'scene') {
        if (sceneName(scene) !== wait.target) return;
        this.advance();
      } else if (wait.kind === 'raceEnd') {
        if (sceneName(scene) !== 'RaceScene' || !scene.resultsShown || !scene.finished) return;
        this.advance();
      } else if (wait.kind === 'flag') {
        // If Safari reloads or the player leaves the Chapter 02 night drive
        // before it is completed, visiting a Meet offers the SAME solo drive
        // again. Never silently count an unfinished drive as complete.
        if(this.session.id==='arkonChapter02' &&
           wait.condition.key==='arkonStoryCruiseComplete' &&
           !scene.registry.get('arkonStoryCruiseComplete') &&
           sceneName(scene)==='MeetScene'){
          const previous=this.scripts.get(this.session.id)?.script?.steps
            .findIndex(step=>step.type==='STORY_CRUISE')??-1;
          if(previous>=0){
            this.session.index=previous;
            this.wait=null;
            this.checkpoint();
            this.sceneDelay=DEFAULT_SCENE_DELAY;
            return;
          }
        }
        if ((wait.condition.scene && sceneName(scene)!==wait.condition.scene) ||
            !checkStoryCondition(wait.condition, key => scene.registry.get(key))) return;
        this.advance();
      } else if(wait.kind==='winDelta') {
        if(sceneName(scene)!==wait.targetScene ||
           Number(scene.registry.get('wins')||0)<wait.startWins+wait.count)return;
        this.advance();
      } else if (wait.kind === 'event') {
        if (!this.events.has(wait.event)) return;
        this.events.delete(wait.event);
        this.advance();
      }
      if (this.wait) return;
    }
    const compiled = this.scripts.get(this.session.id);
    if (!compiled) { this.error = 'SCRIPT MISSING'; return; }
    for (let budget=0; budget<25 && this.session; budget++) {
      const index = this.session.index;
      const step = compiled.script.steps[index];
      if (!step || String(step.type).toUpperCase() === 'END') { this.stop({ complete: true }); return; }
      const type = String(step.type).toUpperCase();
      try {
        if (['LABEL','IF','GOTO'].includes(type)) {
          this.session.index = nextStoryPosition(compiled,index,key=>
            Object.prototype.hasOwnProperty.call(this.session.vars,key)
              ? this.session.vars[key] : scene.registry.get(key));
          this.checkpoint();
          continue;
        }
        if (type === 'WAIT_MS') {
          this.wait = {kind:'dialogue',index};
          scene.time.delayedCall(step.ms,()=>{
            if (this.session?.index === index && this.wait?.index === index) this.advance();
          });
          return;
        }
        if (type === 'VENUE') {
          if (typeof scene.transitionVenue !== 'function') {
            this.error='VENUE requires a story environment';return;
          }
          this.wait={kind:'dialogue',index};
          const accepted=scene.transitionVenue(step.venue,()=>{
            if(this.session?.index===index && this.wait?.index===index)this.advance();
          });
          if(!accepted){this.wait=null;this.error='STORY VENUE UNAVAILABLE';}
          return;
        }
        if (type === 'HOLD_SCENE') {
          if (sceneCutsceneActive(scene) || scene._storyContinuePrompt?.active) return;
          this.wait={kind:'dialogue',index};
          const prompt=showStoryContinuePrompt(scene,{
            label:step.label||'CONTINUE STORY',caption:step.caption||'',
            onContinue:()=>{
              if(this.session?.index===index && this.wait?.index===index)
                this.advance();
            },
            onCancel:({reason})=>{
              if(this.session?.index===index && reason!=='shutdown')
                this.error='STORY CONTINUE CANCELLED';
            },
          });
          if(!prompt){this.wait=null;this.error='STORY CONTINUE UNAVAILABLE';}
          return;
        }
        if (type === 'CHOICE') {
          if (sceneCutsceneActive(scene) || scene._storyChoicePanel?.active) return;
          this.wait={kind:'dialogue',index};
          const panel=showStoryChoices(scene,{
            title:step.title,subtitle:step.subtitle,choices:step.choices,
            onChoose:choice=>{
              if(!this.session || this.session.index!==index || this.wait?.index!==index)return;
              this.session.vars[step.key||'choice']=choice.id;
              if (!this.session.preview && scene.registry.get('gameMode')==='arkonStory') {
                const previous=scene.registry.get('arkonStoryChoices') || {};
                scene.registry.set('arkonStoryChoices', {...previous,[step.key||'choice']:choice.id});
              }
              const dest=compiled.labels.get(choice.to);
              if(dest==null){this.error='CHOICE TARGET MISSING';return;}
              this.session.index=dest+1;
              this.wait=null;
              this.checkpoint();
              this.sceneDelay=DEFAULT_SCENE_DELAY;
            },
            onCancel:()=>{if(this.session?.index===index)this.error='CHOICE INTERRUPTED';},
          });
          if(!panel){this.wait=null;this.error='CHOICE PANEL FAILED';}
          return;
        }
        if(type==='ARKON_CUSTOMER_JOB'){
          if(this.session.id!=='arkonChapter03' ||
              scene.registry.get('gameMode')!=='arkonStory'){
            this.error='STORY CUSTOMER JOB UNAVAILABLE';return;
          }
          const done=Number(scene.registry.get('arkonStoryCustomerJobsDone')||0);
          if(done>step.index){this.advance();continue;}
          if(done!==step.index){this.error='CUSTOMER JOB ORDER MISMATCH';return;}
          if(!scene.registry.get('arkonStoryChapter03Seed') && !this.session.preview){
            scene.registry.set('arkonStoryChapter03Seed',Math.floor(Math.random()*0x7fffffff)||1);
            this.checkpoint();
          }
          const job=getArkonCustomerJob(scene.registry,step.index);
          if(!job){this.error='CUSTOMER CAR MISSING';return;}
          this.wait={kind:'dialogue',index};
          const control=showArkonCustomerTuning(scene,job,{
            onComplete:result=>{
              if(this.session?.index!==index || this.wait?.index!==index)return;
              if(step.index===4 && !this.session.preview){
                scene.registry.set('arkonStoryMx5CustomerTuning',result.tuning);
              }
              if(!this.session.preview && !recordArkonCustomerJob(scene.registry,step.index)){
                this.error='CUSTOMER PAYMENT SAVE FAILED';return;
              }
              this.advance();
            },
          });
          if(!control){this.wait=null;this.error='CUSTOMER TUNING PANEL FAILED';}
          return;
        }
        if(type==='ARKON_RWB_PURCHASE'){
          if(this.session.id!=='arkonChapter04' ||
              scene.registry.get('gameMode')!=='arkonStory'){
            this.error='RWB AUCTION OUTSIDE ARKON STORY';return;
          }
          if(!this.session.preview && !recordArkonRwbPurchase(scene.registry)){
            this.error='RWB AUCTION COULD NOT BE RECORDED';return;
          }
          this.advance();continue;
        }
        if(type==='ARKON_MX5_RACE'){
          if(this.session.id!=='arkonChapter03' ||
              scene.registry.get('gameMode')!=='arkonStory' ||
              sceneName(scene)!=='MeetScene' ||
              !beginArkonMx5GuestRace(scene.registry)){
            this.error='SAYAKA MX-5 RACE UNAVAILABLE';return;
          }
          saveSessionState(scene.registry);
          this.clearStage();
          if(!queueSafeSceneStart(scene,'RaceScene')){
            finishArkonMx5GuestRace(scene.registry);
            this.error='SAYAKA RACE TRANSITION FAILED';return;
          }
          this.advance();
          this.wait={kind:'transition',target:'RaceScene',origin:scene};
          return;
        }
        if(type==='ARKON_MX5_RETURN'){
          if(this.session.id!=='arkonChapter03' ||
              scene.registry.get('gameMode')!=='arkonStory'){
            this.error='UNEXPECTED STORY CAR RETURN';return;
          }
          if(!this.session.preview && !finishArkonMx5GuestRace(scene.registry)){
            this.error='SAYAKA CAR RETURN FAILED';return;
          }
          saveSessionState(scene.registry);
          this.advance();continue;
        }
        if (type === 'STORY_CRUISE') {
          if(this.session.id!=='arkonChapter02' ||
             scene.registry.get('gameMode')!=='arkonStory' ||
             sceneName(scene)!=='MeetScene' ||
             !cars[scene.registry.get('selectedCarId')]) {
            this.error='STORY DRIVE MUST BEGIN FROM A MEET';return;
          }
          for(const [key,value] of Object.entries({
            selectedRaceCategory:'STORY_CRUISE',
            selectedRaceType:'Roll Race',
            selectedRaceDistanceM:804.672,
            selectedRaceDeal:'STORY',
            selectedRaceStake:0,
            selectedRaceSpecialChallenge:false,
            selectedRaceMeetOffer:null,
            selectedOpponentCarId:'ae86',
            selectedOpponentCharacterId:'storyDaigoKirishima',
            selectedOpponentBuildState:null,
            selectedOpponentEncounterAi:null,
            raceReturnScene:'GarageScene',
            raceDistrict:'TATSUMI',
            raceTimeOfDay:'night',
            raceLocationLabel:'A DRIVE WITH SAYAKA',
            arkonStoryCruiseComplete:false,
          }))scene.registry.set(key,value);
          saveSessionState(scene.registry);
          this.clearStage();
          if(!queueSafeSceneStart(scene,'RaceScene')){
            this.error='STORY DRIVE COULD NOT START';return;
          }
          this.advance();
          this.wait={kind:'transition',target:'RaceScene',origin:scene};
          return;
        }
        if (type === 'ARKON_CHALLENGE_RACE') {
          if(!['arkonChapter01Revised','arkonChapter02','arkonChapter03'].includes(this.session.id) ||
              scene.registry.get('gameMode')!=='arkonStory' ||
              sceneName(scene)!=='MeetScene' ||
              !scene.registry.get('selectedCarId')){
            this.error='ARKON RIVAL RACE MUST START FROM A MEET'; return;
          }
          // This is a standard SINGLE/BET race. Same real engine, opponent
          // car, inputs, physics, AI, and settlement as normal Career.
          // There are no scripted results or power multipliers.
          const values={
            selectedOpponentCarId:'ae86',
            selectedOpponentCharacterId:'storyDaigoKirishima',
            selectedOpponentEncounterRating:2,
            selectedOpponentEncounterAi:null,
            selectedOpponentBuildState:null,
            selectedOpponentDifficulty:'EASY',
            selectedRaceCategory:'SINGLE',
            selectedRaceType:'Standing Start',
            selectedRaceDistanceM:402.336,
            selectedRaceDeal:'BET',
            selectedRaceStake:this.session.id==='arkonChapter02'?0:1000,
            selectedRaceSpecialChallenge:false,
            selectedRaceMeetOffer:null,
            raceReturnScene:'MeetScene',
            raceLocationLabel:this.session.id==='arkonChapter02'
              ? 'CHAPTER 02 // FRIENDLY REMATCH' : 'CHAPTER 01 // DAIGO KIRISHIMA',
            raceDistrict:String(scene.registry.get('district')||'ODAIBA'),
            raceTimeOfDay:String(scene.worldPhase||'night'),
            ...(this.session.id==='arkonChapter02'
              ? {arkonStoryChapter02RivalResult:null} : {arkonStoryRivalResult:null}),
          };
          for(const [key,value]of Object.entries(values))scene.registry.set(key,value);
          saveSessionState(scene.registry);
          this.clearStage();
          if(!queueSafeSceneStart(scene,'RaceScene')){
            this.error='ARKON RIVAL RACE COULD NOT START';return;
          }
          this.advance();
          this.wait={kind:'transition',target:'RaceScene',origin:scene};
          return;
        }
        if (type === 'DEV_HERO_RACE') {
          if(this.session.id!==DEV_VAULT_STORY_ID ||
             sceneName(scene)!=='DevVaultStoryScene' ||
             !prepareDevVaultHeroRace(scene.registry,id=>Boolean(cars[id]))){
            this.error='DEV STORY RACE UNAVAILABLE';return;
          }
          if(!queueSafeSceneStart(scene,'RaceScene')){
            this.error='RACE SCENE TRANSITION FAILED';return;
          }
          this.advance();
          this.wait={kind:'transition',target:'RaceScene',origin:scene};
          return;
        }
        if (type === 'RETURN_LOAN') {
          if(this.session.id!==DEV_VAULT_STORY_ID ||
              sceneName(scene)!=='CentralTokyoScene' ||
              !isArkonVaultStoryLoan(scene.registry) ||
              typeof scene.endGinzaTestDrive!=='function' ||
              !scene.endGinzaTestDrive(false)){
            this.error='GINZA LOAN COULD NOT BE RETURNED';return;
          }
          scene.ginzaRoom=1;
          scene.ginzaOwnerDressed=false;
          scene.renderLocation(scene.activeLocationId);
          this.advance();continue;
        }
        if (type === 'SET_FLAG') {
          if (!this.session.preview && step.key) {
            scene.registry.set(step.key,step.value);
            // Script-authored Story time uses a PRIVATE profile flag, never
            // WorldClock's shared device-wide epoch. No additional script
            // step is inserted: existing R652 checkpoints remain valid.
            if (['arkonChapter01Revised','arkonChapter02','arkonChapter04'].includes(this.session.id) &&
                scene.registry.get('gameMode')==='arkonStory' &&
                (step.timeOfDay==='night'||step.timeOfDay==='day')) {
              scene.registry.set('arkonStoryTimeOfDay',step.timeOfDay);
            }
            this.checkpoint();
          }
          this.advance(); continue;
        }
        if (type==='WAIT_WIN_DELTA') {
          if(this.session.id!=='arkonChapter02' ||
             scene.registry.get('gameMode')!=='arkonStory') {
            this.error='INVALID STORY WIN MILESTONE';return;
          }
          if(!Object.prototype.hasOwnProperty.call(this.session.vars,step.key)){
            this.session.vars[step.key]=Math.max(0,Number(scene.registry.get('wins')||0));
            this.checkpoint(); // save the baseline so reloads cannot shorten the wait
          }
          const startWins=Number(this.session.vars[step.key]);
          if(sceneName(scene)==='MeetScene' &&
             Number(scene.registry.get('wins')||0)>=startWins+step.count) {
            this.advance();continue;
          }
          this.wait={kind:'winDelta',startWins,count:step.count,
            targetScene:step.scene};return;
        }
        if (type==='ARKON_DOCK_PAYMENT') {
          if(this.session.id!=='arkonChapter02' ||
             scene.registry.get('gameMode')!=='arkonStory') {
            this.error='INVALID STORY JOB PAYMENT';return;
          }
          if(!this.session.preview && !scene.registry.get('arkonStoryChapter02FishPaid')){
            const balance=Math.max(0,Number(scene.registry.get('cash')||0));
            // Save the guard with the cash: crash/reload never pays twice.
            scene.registry.set('cash',Math.min(1e9,balance+25000));
            scene.registry.set('arkonStoryChapter02FishPaid',true);
            this.checkpoint();
          }
          this.advance();continue;
        }
        if (type === 'STAGE') {
          if (step.privateMeet && sceneName(scene)==='MeetScene')
            scene.setStoryEncounterActive?.(true);
          const stage=showStoryStage(scene,step);
          if(this.session.id==='arkonChapter04' && !stage){
            this.error='CHAPTER 04 STAGE UNAVAILABLE';return;
          }
          this.advance(); continue;
        }
        if (type === 'CLEAR_STAGE') {
          this.clearStage();
          this.advance(); continue;
        }
        if (['MANGA','PHONE','COMPACT'].includes(type)) {
          if (sceneCutsceneActive(scene) || scene._compactStoryDialogue?.active) return;
          const onDone = () => {
            if (!this.session || this.wait?.index !== index) return;
            this.advance();
          };
          const onCancel = payload => {
            if (!this.session || this.wait?.index !== index) return;
            this.wait = null;
            if (payload?.reason !== 'shutdown') this.error = 'DIALOGUE CANCELLED';
          };
          const definition = step.cutsceneId || {
            id: this.session.id + '-' + index,
            once: false, title: step.title || compiled.script.title || 'TOKYO SHIFT',
            characters: step.characters || { left:'sayakaFujieda',right:'$PLAYER' },
            pages: step.pages,
            presentation: type === 'PHONE' ? 'phone' : undefined,
            presentationMode: step.presentationMode || 'openingSwipe',
            callerId: step.callerId, callerName: step.callerName,
            callerPose: step.callerPose, label: step.label,
            backdrops: step.backdrops,
          };
          this.wait = { kind:'dialogue', index };
          const result = type === 'COMPACT'
            ? playCompactStoryDialogue(scene, {
              ...step, onComplete:onDone,onCancel,
            })
            : playMangaCutscene(scene,definition,{
              preloadPagePosesOnly: ['arkonChapter01Revised','arkonChapter02','arkonChapter03','arkonChapter04'].includes(this.session.id),
              preview:true, // Director owns completion history; never double-mark cutscenes.
              backgroundStyle:step.backgroundStyle,
              variables:step.variables,
              onPreviewComplete:onDone,
              onCancel,
            });
          if (!result?.played) {
            this.wait = null;
            this.error = 'DIALOGUE DID NOT START: '+String(result?.reason || 'unknown');
          }
          return;
        }
        if (type === 'WAIT_SCENE') {
          if (sceneName(scene) === step.scene) { this.advance(); continue; }
          this.wait = { kind:'scene',target:step.scene };
          return;
        }
        if (type === 'WAIT_RACE_END') {
          if (sceneName(scene) === 'RaceScene' && scene.finished && scene.resultsShown) {
            this.advance(); continue;
          }
          this.wait = { kind:'raceEnd' }; return;
        }
        if (type === 'WAIT_EVENT') {
          if (this.events.has(step.event)) {
            this.events.delete(step.event);
            this.advance(); continue;
          }
          this.wait = { kind:'event', event:step.event }; return;
        }
        if (type === 'WAIT_FLAG') {
          if ((!step.scene || sceneName(scene)===step.scene) &&
              checkStoryCondition(step,key=>scene.registry.get(key))) {
            this.advance(); continue;
          }
          this.wait = { kind:'flag',condition:step }; return;
        }
        if (type === 'OPEN_MAP') {
          // Delegate to the real Garage map button: maintains live travel prices,
          // unlock checks, scene cleanup and iPad-safe navigation.
          const button = scene.meetButton;
          if (typeof button?.emit !== 'function' || sceneName(scene) !== 'GarageScene') {
            this.error = 'OPEN_MAP requires GarageScene map controls'; return;
          }
          this.wait = { kind:'sceneChanged',source:sceneName(scene) };
          button.emit('pointerdown');
          return;
        }
        if (type === 'LOCATION' || type === 'START_RACE') {
          const target = type === 'START_RACE' ? 'RaceScene' : step.scene;
          if (!target) { this.error = 'LOCATION needs scene'; return; }
          if (type === 'START_RACE' && !scene.registry.get('selectedCarId')) {
            this.error = 'START_RACE needs a selected car'; return;
          }
          if (type === 'START_RACE' && step.raceContext && !this.session.preview) {
            for(const [key,value] of Object.entries(step.raceContext)) scene.registry.set(key,value);
          }
          if (type === 'LOCATION' && target === sceneName(scene) &&
              !step.force && !step.data) {
            this.advance(); continue;
          }
          this.clearStage();
          if (!queueSafeSceneStart(scene,target,step.data)) {
            this.error = 'SCENE TRANSITION REJECTED: ' + target; return;
          }
          // Advance before transition so a reload cannot repeatedly restart it.
          this.advance();
          this.wait = { kind:'transition',target,origin:scene };
          return;
        }
        this.error = 'UNHANDLED STORY ACTION: '+type;
        return;
      } catch (error) {
        this.error = String(error?.message || error);
        console.error('[Tokyo SHIFT] story action failed',this.session.id,index,error);
        return;
      }
    }
    if (this.session && !this.wait) this.error = 'SCRIPT LOOP (25 actions without wait)';
  }
}

export function installStoryDirector(game) {
  if (!game) throw new Error('Story Director needs a Phaser game');
  if (game.storyDirector) return game.storyDirector;
  const director = new StoryDirector(game);
  game.storyDirector = director;
  return director;
}
