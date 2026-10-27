// Cross-scene story orchestration. The Director owns progression, not rendering.
// Built on the existing manga, phone, compact HUD, map and race systems.
import {
  validateStoryScript, createStoryCheckpoint, isStoryCheckpoint,
  checkStoryCondition, nextStoryPosition, normaliseStoryChoiceVars,
} from './StoryScript.js?v=20261027-ch8';
import { playMangaCutscene, sceneCutsceneActive } from '../ui/MangaCutscene.js?v=20261027-trio';
import { playCompactStoryDialogue } from '../ui/CompactStoryDialogue.js?v=20261022-r640';
import { showStoryStage } from '../ui/StoryStage.js?v=20261028-full';
import {showArukenChapter08Meet} from '../ui/ArukenChapter08Meet.js?v=20261028-pilot';
import { queueSafeSceneStart } from '../ui/SafeSceneTransition.js?v=20261017-r573';
import { getActiveProfileIndex, saveSessionState } from '../state/GameState.js?v=20261025-r684';
import { STORY_DIRECTOR_SCRIPTS } from '../data/storyDirectorScripts.js?v=20261025-r686';
import {migrateArkonR678Checkpoint,isR678StoryScript} from './ArkonR678CheckpointMigration.js?v=20261024-r678';
import {migrateArkonR679Checkpoint,isR679StoryScript} from './ArkonR679CheckpointMigration.js?v=20261024-r679';
import { showArkonCustomerTuning } from '../ui/ArkonCustomerTuning.js?v=20261024-r675';
import {getArkonCh4WorkProgress,startArkonCh4Work} from '../data/arkonChapter04Work.js?v=20261023-r667';
import {showArkonRwbContract} from '../ui/ArkonRwbContract.js?v=20261023-r667';
import {showArkonStoryObjective} from '../ui/ArkonStoryObjective.js?v=20261025-r686';
import { recordArkonRwbPurchase } from '../data/arkonChapter04Ledger.js?v=20261023-r665';
import { startArkonCh5TestRace, finishArkonCh5TestRace } from '../data/arkonChapter05Races.js?v=20261023-r666';
import {
  getArkonCh6Job,recordArkonCh6Job,leaseArkonCh6Warehouse,
  settleArkonCh6PorscheLoan,recordArkonCh6Restoration,ch6Progress,
  beginArkonCh6NightDrive,finishArkonCh6NightDrive,giftArkonCh6Porsche,
} from '../data/arkonChapter06Work.js?v=20261025-r682';
import {
  ch7Progress,startArkonCh7Work,finishArkonCh7Work,
  getArkonCh7Job,recordArkonCh7Job,startArkonCh7Race,finishArkonCh7Race,
  convertArkonCh7Car,startArkonCh7SoloDrive,finishArkonCh7SoloDrive
} from '../data/arkonChapter07Progress.js?v=20261025-r684';
import {startArkonCh8Race,finishArkonCh8Race,recordArkonCh8Contract}
  from '../data/arkonChapter08Races.js?v=20261023-r672';
import {startArkonCh9Race,finishArkonCh9Race,recordArkonCh9Refusal}
  from '../data/arkonChapter09Races.js?v=20261023-r673';
import {recordArkonCh10Project,startArkonCh10Race,finishArkonCh10Race,
  openArkonCh10Ginza,recordArkonCh10Investment,prepareArkonCh10Yokohama,
  settleArkonCh10Dispute,sellArkonCh10LibertyWalk,
  startArkonCh10PorscheCruise,finishArkonCh10PorscheCruise} from '../data/arkonChapter10Work.js?v=20261024-r679';
import {ARKON_CH10_PROJECTS} from '../data/arkonChapter10Work.js?v=20261024-r679';
import {showArkonCh10Restoration} from '../ui/ArkonChapter10Restoration.js?v=20261023-r674';
import {showArkonChapter10Finale} from '../ui/ArkonChapter10Finale.js?v=20261023-r674';
import {showArkonRwbRestoration} from '../ui/ArkonRwbRestoration.js?v=20261024-r675';
import {showArkonChapter06Finale} from '../ui/ArkonChapter06Finale.js?v=20261023-r671';
import { getRegionalChampionshipCount } from '../data/careerProgression.js?v=20261017-r553';
import { normaliseCarGarageLocations } from '../data/workshopProgression.js?v=20261023-r662';
import {isArkonPlayableReplay,endArkonPlayableReplay} from '../ui/ArkonPlayableReplay.js?v=20261023-r669';
import {syncArkonReplayExit} from '../ui/ArkonReplayExit.js?v=20261024-r675';
import {
  getArkonCustomerJob,recordArkonCustomerJob,
  beginArkonMx5GuestRace,finishArkonMx5GuestRace,
} from '../data/arkonChapter03Jobs.js?v=20261023-r660';
import { showStoryChoices } from '../ui/StoryChoicePanel.js?v=20261022-r641';
import { showStoryContinuePrompt } from '../ui/StoryContinuePrompt.js?v=20261025-r685';
import { cars } from '../data/cars.js?v=20261026-r687';
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
    if (compiled.script.id==='arkonChapter05' &&
        (scene.registry.get('gameMode')!=='arkonStory' ||
         !scene.registry.get('arkonStoryChapter04Done') ||
         scene.registry.get('arkonStoryChapter05Done') ||
         (!index && (sceneName(scene)!=='GarageScene' || scene.crewMode ||
           scene.registry.get('arkonStoryChapter05Loan')?.active))))return false;
    if (compiled.script.id==='arkonChapter06' &&
        (scene.registry.get('gameMode')!=='arkonStory' ||
         !scene.registry.get('arkonStoryChapter05Done') ||
         scene.registry.get('arkonStoryChapter06Done') ||
         (!index && (sceneName(scene)!=='GarageScene' || scene.crewMode ||
           !['shinonomeCanalYard','shinonomeWarehouseStrip']
             .includes(scene.registry.get('workshopLocationId'))))))return false;
    if (compiled.script.id==='arkonChapter07' &&
        (scene.registry.get('gameMode')!=='arkonStory' ||
         !scene.registry.get('arkonStoryChapter06Done') ||
         scene.registry.get('arkonStoryChapter07Done') ||
         (!index && (sceneName(scene)!=='GarageScene' || scene.crewMode ||
           scene.registry.get('workshopLocationId')!=='shinonomeWarehouseStrip'))))return false;
    if (compiled.script.id==='arkonChapter08' &&
        (scene.registry.get('gameMode')!=='arkonStory' ||
         !scene.registry.get('arkonStoryChapter07Done') ||
         scene.registry.get('arkonStoryChapter08Done') ||
         (!index && (sceneName(scene)!=='GarageScene' || scene.crewMode ||
           scene.registry.get('workshopLocationId')!=='shinonomeWarehouseStrip'))))return false;
    if (compiled.script.id==='arkonChapter09' &&
        (scene.registry.get('gameMode')!=='arkonStory' ||
         !scene.registry.get('arkonStoryChapter08Done') ||
         !scene.registry.get('arkonStoryChapter08ContractSigned') ||
         scene.registry.get('arkonStoryChapter09Done') ||
         (!index && (sceneName(scene)!=='GarageScene' || scene.crewMode ||
           scene.registry.get('workshopLocationId')!=='shinonomeWarehouseStrip'))))return false;
    if (compiled.script.id==='arkonChapter10' &&
        (scene.registry.get('gameMode')!=='arkonStory' ||
         !scene.registry.get('arkonStoryChapter09Done') ||
         !scene.registry.get('arkonStoryChapter09Refused') ||
         scene.registry.get('arkonStoryChapter10Done') ||
         (!index && (sceneName(scene)!=='GarageScene' || scene.crewMode ||
           scene.registry.get('workshopLocationId')!=='shinonomeWarehouseStrip'))))return false;
    const id = compiled.script.id;
    if (preview && !this.scripts.has(id)) this.register(compiled.script);
    const savedIndex = Math.max(0, Math.floor(Number(index) || 0));
    if (savedIndex >= compiled.script.steps.length) return false;
    const scriptVars=normaliseStoryChoiceVars(vars);
    if(!preview && savedIndex===0 && isR678StoryScript(id))scriptVars.storyR678=true;
    if(!preview && savedIndex===0 && isR679StoryScript(id))scriptVars.storyR679=true;
    if(!preview && savedIndex===0 && id==='arkonChapter07')scriptVars.storyR684=true;
    if(!preview && savedIndex===0 && id==='arkonChapter02')scriptVars.storyR685=true;
    this.session = { id, index: savedIndex, slot: owner(), preview: Boolean(preview),
      vars: scriptVars };
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
    let checkpoint = this.game.registry?.get?.(STORY_DIRECTOR_SAVE_KEY);
    if (!scene || !isStoryCheckpoint(checkpoint) ||
        checkpoint.ownerSlot !== owner() || !this.scripts.has(checkpoint.id)) return false;
    // Two new Chapter 2 story actions (visible crouch + CONTINUE hold) were
    // inserted before ANOTHER LIFE. Keep older numeric checkpoints aligned
    // without replaying fish wages, races or the school introduction.
    if(checkpoint.id==='arkonChapter02' && !checkpoint.vars?.storyR685){
      const steps=this.scripts.get(checkpoint.id)?.script?.steps||[];
      const next=steps.findIndex(x=>x.type==='MANGA'&&x.title==='ANOTHER LIFE');
      const oldIndex=Math.max(0,Number(checkpoint.index)||0);
      const index=next>=2&&oldIndex>=next-2?oldIndex+2:oldIndex;
      checkpoint={...checkpoint,index:Math.min(steps.length-1,index),
        vars:{...(checkpoint.vars||{}),storyR685:true}};
      scene.registry.set(STORY_DIRECTOR_SAVE_KEY,checkpoint);
      saveSessionState(scene.registry);
    }
    // R684 replaced the eight-step after-Level-2 sequence with nine steps
    // (Yokohama evening + a real R32 introduction). Numeric R683 checkpoints
    // must not jump forward to the wrong action or double-award a job.
    // Remap only once; do not reset tuning, invoices, race results or visits.
    if(checkpoint.id==='arkonChapter07' && !checkpoint.vars?.storyR684){
      const steps=this.scripts.get(checkpoint.id)?.script?.steps||[];
      const firstWork=steps.findIndex(x=>x.type==='ARKON_CH7_WORK'&&x.stage===1);
      const firstRace=steps.findIndex(x=>x.type==='ARKON_CH7_RACE'&&x.index===0);
      const oldIndex=Math.max(0,Number(checkpoint.index)||0);
      const index=firstWork>=0&&firstRace>=0&&oldIndex>firstWork
        ? oldIndex>=firstRace-1
          ? oldIndex+1
          : firstWork+1
        :oldIndex;
      checkpoint={...checkpoint,index:Math.max(0,Math.min(index,steps.length-1)),
        vars:{...(checkpoint.vars||{}),storyR684:true}};
      scene.registry.set(STORY_DIRECTOR_SAVE_KEY,checkpoint);
      saveSessionState(scene.registry);
    }
    // Old Chapter 03 checkpoints may still point to the Meet even though the
    // workshop story begins at Canal Yard. Finish the safe scene transition
    // first, then resume the SAME checkpoint (do not restart its scenes).
    if(checkpoint.id==='arkonChapter03' && checkpoint.index<=3 &&
       sceneName(scene)!=='GarageScene' && !scene._pendingSafeSceneStart){
      const reg=scene.registry;
      reg.set('arkonStoryCanalYardUnlocked',true);
      reg.set('garageTier',1);
      reg.set('workshopLocationId','shinonomeCanalYard');
      const owned=reg.get('ownedCarIds')||[];
      const selected=reg.get('selectedCarId');
      const requested={...(reg.get('carGarageLocations')||{})};
      if(selected&&owned.includes(selected))requested[selected]='shinonomeCanalYard';
      reg.set('carGarageLocations',normaliseCarGarageLocations(owned,requested,1));
      queueSafeSceneStart(scene,'GarageScene',{
        crewMode:false,workshopLocationId:'shinonomeCanalYard',
      });
      return false;
    }
    if(scene._pendingSafeSceneStart)return false;
    // After a mid-race reload, the loan and race context are still saved.
    // Return to the actual RaceScene rather than accepting an unpaid/untested
    // car at the next Meet or leaving the chapter stalled indefinitely.
    if(checkpoint.id==='arkonChapter05' &&
       scene.registry?.get?.('arkonStoryChapter05Loan')?.active &&
       !scene.registry.get('arkonStoryChapter05RaceResult') &&
       sceneName(scene)!=='RaceScene' &&
       ['GarageScene','MeetScene'].includes(sceneName(scene))){
      queueSafeSceneStart(scene,'RaceScene');
      return false;
    }
    if(checkpoint.id==='arkonChapter06' &&
       scene.registry?.get?.('arkonStoryChapter06Cruise')?.active &&
       !scene.registry.get('arkonStoryChapter06Cruise')?.completed &&
       sceneName(scene)!=='RaceScene' &&
       !scene._pendingSafeSceneStart){
      queueSafeSceneStart(scene,'RaceScene');
      return false;
    }
    if(checkpoint.id==='arkonChapter10' &&
       scene.registry?.get?.('arkonStoryChapter10Cruise')?.active &&
       !scene.registry.get('arkonStoryChapter10Cruise')?.completed &&
       sceneName(scene)!=='RaceScene' && !scene._pendingSafeSceneStart){
      queueSafeSceneStart(scene,'RaceScene');return false;
    }
    if(checkpoint.id==='arkonChapter10' &&
       scene.registry?.get?.('arkonStoryChapter10Cruise')?.completed &&
       sceneName(scene)!=='MeetScene' && !scene._pendingSafeSceneStart){
      queueSafeSceneStart(scene,'MeetScene');return false;
    }
    if(checkpoint.id==='arkonChapter10' &&
       scene.registry?.get?.('arkonStoryChapter10Race')?.active &&
       !scene.registry.get('arkonStoryChapter10RaceResult') &&
       sceneName(scene)!=='RaceScene' && !scene._pendingSafeSceneStart){
      queueSafeSceneStart(scene,'RaceScene');return false;
    }
    if(checkpoint.id==='arkonChapter09' &&
       scene.registry?.get?.('arkonStoryChapter09Race')?.active &&
       !scene.registry.get('arkonStoryChapter09RaceResult') &&
       sceneName(scene)!=='RaceScene' &&
       !scene._pendingSafeSceneStart){
      queueSafeSceneStart(scene,'RaceScene');return false;
    }
    if(checkpoint.id==='arkonChapter08' &&
       scene.registry?.get?.('arkonStoryChapter08Race')?.active &&
       !scene.registry.get('arkonStoryChapter08RaceResult') &&
       sceneName(scene)!=='RaceScene' &&
       !scene._pendingSafeSceneStart){
      queueSafeSceneStart(scene,'RaceScene');return false;
    }
    if(checkpoint.id==='arkonChapter07' &&
       scene.registry?.get?.('arkonStoryChapter07Race')?.active &&
       !scene.registry.get('arkonStoryChapter07RaceResult') &&
       sceneName(scene)!=='RaceScene' &&
       !scene._pendingSafeSceneStart){
      queueSafeSceneStart(scene,'RaceScene');return false;
    }
    if(checkpoint.id==='arkonChapter07' &&
       scene.registry?.get?.('arkonStoryChapter07Solo')?.active &&
       !scene.registry.get('arkonStoryChapter07Solo')?.completed &&
       sceneName(scene)!=='RaceScene' &&
       !scene._pendingSafeSceneStart){
      queueSafeSceneStart(scene,'RaceScene');return false;
    }
    // R663 authored the Chapter 03 test drive as manga. Preserve older
    // mid-chapter saves: if the Mazda build is finished but its road result
    // is still unset, resume at the NEW live drive rather than treating the
    // old numeric manga checkpoint as an unrelated later story beat.
    if(checkpoint.id==='arkonChapter03' &&
       ['chapter03Driving','chapter03GuestRace'].includes(
         scene.registry?.get?.('arkonStoryPhase')) &&
       Number(scene.registry?.get?.('arkonStoryCustomerJobsDone')||0)>=6 &&
       !scene.registry?.get?.('arkonStoryMx5RaceResult') &&
       !scene.registry?.get?.('arkonStoryMx5Loan')?.active){
      const steps=this.scripts.get('arkonChapter03')?.script?.steps||[];
      const driveIndex=steps.findIndex(step=>step.type==='ARKON_MX5_RACE');
      if(driveIndex>=0)
        return this.start(checkpoint.id,{index:driveIndex,
          vars:{...(checkpoint.vars||{}),storyR678:true}});
    }
    // Chapter 04's driving/tuning interlude is genuine free gameplay.
    // Never auto-launch the next scene behind an active Meet, replay or
    // pink-slip; only the Story Objective's resume action may restart it.
    if(checkpoint.id==='arkonChapter04' &&
       this.scripts.get(checkpoint.id)?.script?.steps?.[checkpoint.index]?.type==='ARKON_CH4_WORK')
      return false;
    if(checkpoint.id==='arkonChapter07' &&
      this.scripts.get(checkpoint.id)?.script?.steps?.[checkpoint.index]?.type==='ARKON_CH7_WORK')
      return false;
    // R677 checkpoints stored raw numeric positions. The R678 screenplay
    // inserts real conversations, so resume using a semantic milestone once.
    // Never reinterpret an old saved index as a new financial/race action.
    const compiled=this.scripts.get(checkpoint.id);
    const migrated678=migrateArkonR678Checkpoint(compiled,checkpoint,scene.registry);
    const intermediate=migrated678?{...checkpoint,...migrated678}:checkpoint;
    const migrated679=migrateArkonR679Checkpoint(compiled,intermediate,scene.registry);
    return this.start(checkpoint.id, migrated679 || migrated678 ||
      {index:checkpoint.index,vars:checkpoint.vars});
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
    // Replays can occupy Garage, Meet, Race and modal cutscene screens.
    // Render a single always-interactive exit in the scene foreground.
    syncArkonReplayExit(this.activeScene());
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
        const expected=replayChapter===2
          ? 'MeetScene' : 'GarageScene';
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
            revealMs:step.revealMs||0,
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
        if(type==='ARKON_CH4_WORK'){
          if(this.session.id!=='arkonChapter04' ||
             scene.registry.get('gameMode')!=='arkonStory'){
            this.error='240Z WORK INTERLUDE OUTSIDE CHAPTER 04';return;
          }
          const work=getArkonCh4WorkProgress(scene.registry);
          if(work.ready){
            this.advance();continue;
          }
          if(!work.started && !startArkonCh4Work(scene.registry)){
            this.error='COULD NOT START 240Z WORK OBJECTIVE';return;
          }
          // Stop with a retained checkpoint. Normal Garage/Meet controls
          // now have exclusive ownership; the story remains paused until
          // all gameplay objectives are met and CONTINUE is pressed.
          this.checkpoint();
          this.stop();
          // Present the actual task checklist once, after the previous
          // dialogue and private stage have fully cleared. It dismisses back
          // to ordinary Garage/Meet gameplay; no automatic cutscene resumes.
          if(!work.started)scene.time?.delayedCall?.(120,()=>{
            if(scene.sys?.isActive?.() &&
               scene.registry.get('arkonStoryPhase')==='chapter04Rebuild')
              showArkonStoryObjective(scene);
          });
          return;
        }
        if(type==='ARKON_RWB_CONTRACT'){
          if(this.session.id!=='arkonChapter04' ||
             scene.registry.get('gameMode')!=='arkonStory'){
            this.error='LOAN CONTRACT OUTSIDE CHAPTER 04';return;
          }
          this.wait={kind:'dialogue',index};
          const card=showArkonRwbContract(scene,{onContinue:()=>{
            if(this.session?.index===index&&this.wait?.index===index)
              this.advance();
          }});
          if(!card){this.wait=null;this.error='LOAN CONTRACT UNAVAILABLE';}
          return;
        }
        if(type==='ARKON_RWB_PURCHASE'){
          if(this.session.id!=='arkonChapter04' ||
              scene.registry.get('gameMode')!=='arkonStory'){
            this.error='RWB AUCTION OUTSIDE ARKON STORY';return;
          }
          if(!this.session.preview){
            if(!recordArkonRwbPurchase(scene.registry)){
              this.error='RWB AUCTION COULD NOT BE RECORDED';return;
            }
            // The now-owned, undriveable Porsche occupies a real garage card
            // without becoming the selected race car. Update UI immediately.
            scene.ownedCarIds=(scene.registry.get('ownedCarIds')||[]).filter(id=>cars[id]);
            scene.carGarageLocations=scene.registry.get('carGarageLocations')||{};
            // Show the restoration as the selected workshop exhibit, while
            // selectCar() seals its tuning, travel and transport controls.
            scene.selectCar?.('rwbStellaPorsche',{remember:false});
            scene.renderGaragePage?.();
            scene.refreshArkonRwbLoanHud?.();
            scene.cashText?.setText('¥ '+Number(scene.registry.get('cash')||0).toLocaleString('en-US'));
          }
          this.advance();continue;
        }
        if(type==='ARKON_CH6_JOB'){
          if(this.session.id!=='arkonChapter06'||
             scene.registry.get('gameMode')!=='arkonStory'||
             sceneName(scene)!=='GarageScene'){
            this.error='CHAPTER 06 CUSTOMER JOB NEEDS WAREHOUSE WORKSHOP';return;
          }
          const progress=ch6Progress(scene.registry);
          if(progress.jobsDone>step.index){this.advance();continue;}
          if(progress.jobsDone!==step.index){
            this.error='CHAPTER 06 JOB ORDER MISMATCH';return;
          }
          const job=getArkonCh6Job(scene.registry,step.index);
          if(!job){this.error='CHAPTER 06 CUSTOMER VEHICLE MISSING';return;}
          this.wait={kind:'dialogue',index};
          const control=showArkonCustomerTuning(scene,job,{
            onComplete:()=>{
              if(this.session?.index!==index||this.wait?.index!==index)return;
              if(!this.session.preview &&
                 !recordArkonCh6Job(scene.registry,step.index)){
                this.error='CHAPTER 06 INVOICE FAILED';return;
              }
              scene.cashText?.setText?.('¥ '+Number(scene.registry.get('cash')||0).toLocaleString('en-US'));
              saveSessionState(scene.registry);
              this.advance();
            },
          });
          if(!control){this.wait=null;this.error='CHAPTER 06 SERVICE PANEL UNAVAILABLE';}
          return;
        }
        if(type==='ARKON_CH6_WAREHOUSE' || type==='ARKON_CH6_REPAY' ||
           type==='ARKON_CH6_RESTORE' || type==='ARKON_CH6_DRIVE' ||
           type==='ARKON_CH6_DRIVE_RETURN'||type==='ARKON_CH6_GIFT'||
           type==='ARKON_CH6_ENDING'){
          if(this.session.id!=='arkonChapter06'||
             scene.registry.get('gameMode')!=='arkonStory'){
            this.error='CHAPTER 06 ACTION OUTSIDE ARKON STORY';return;
          }
          if(type==='ARKON_CH6_WAREHOUSE'){
            if(!leaseArkonCh6Warehouse(scene.registry)){
              this.error='WAREHOUSE ACCOUNT NOT READY';return;
            }
            saveSessionState(scene.registry);
            this.advance();continue;
          }
          if(type==='ARKON_CH6_REPAY'){
            if(!settleArkonCh6PorscheLoan(scene.registry)){
              this.error='PORSCHE FINANCE ACCOUNT NOT READY';return;
            }
            scene.refreshArkonRwbLoanHud?.();
            scene.cashText?.setText?.('¥ '+Number(scene.registry.get('cash')||0).toLocaleString('en-US'));
            saveSessionState(scene.registry);
            this.advance();continue;
          }
          if(type==='ARKON_CH6_RESTORE'){
            if(sceneName(scene)!=='GarageScene'||scene.crewMode){
              this.error='PORSCHE RESTORATION NEEDS WAREHOUSE';return;
            }
            const a=ch6Progress(scene.registry);
            if(a.restorationDone>step.index){this.advance();continue;}
            if(a.restorationDone!==step.index){
              this.error='PORSCHE RESTORATION OUT OF ORDER';return;
            }
            this.wait={kind:'dialogue',index};
            const control=showArkonRwbRestoration(scene,step.index,{
              onComplete:()=>{
                if(this.session?.index!==index||this.wait?.index!==index)return false;
                if(!recordArkonCh6Restoration(scene.registry,step.index)){
                  this.error='PORSCHE RESTORATION CHECK FAILED';return false;
                }
                scene.cashText?.setText?.('¥ '+Number(scene.registry.get('cash')||0).toLocaleString('en-US'));
                saveSessionState(scene.registry);
                this.advance();return true;
              },
            });
            if(!control){this.wait=null;this.error='RESTORATION CHECKLIST UNAVAILABLE';}
            return;
          }
          if(type==='ARKON_CH6_DRIVE'){
            if(!beginArkonCh6NightDrive(scene.registry)){
              this.error='CERTIFIED PORSCHE NIGHT DRIVE UNAVAILABLE';return;
            }
            saveSessionState(scene.registry);
            this.clearStage();
            if(!queueSafeSceneStart(scene,'RaceScene')){
              this.error='PORSCHE DRIVE TRANSITION FAILED';return;
            }
            this.advance();
            this.wait={kind:'transition',target:'RaceScene',origin:scene};
            return;
          }
          if(type==='ARKON_CH6_DRIVE_RETURN'){
            if(sceneName(scene)!=='MeetScene'||
               !finishArkonCh6NightDrive(scene.registry)){
              this.error='YOKOHAMA NIGHT DRIVE HAS NOT ENDED';return;
            }
            saveSessionState(scene.registry);
            this.advance();continue;
          }
          if(type==='ARKON_CH6_GIFT'){
            if(sceneName(scene)!=='MeetScene'||
               !giftArkonCh6Porsche(scene.registry)){
              this.error='CERTIFIED PORSCHE TRANSFER INCOMPLETE';return;
            }
            saveSessionState(scene.registry);
            this.advance();continue;
          }
          if(type==='ARKON_CH6_ENDING'){
            if(sceneName(scene)!=='MeetScene') {
              this.error='YOKOHAMA FINALE NEEDS MEET';return;
            }
            this.wait={kind:'dialogue',index};
            const control=showArkonChapter06Finale(scene,{onComplete:()=>{
              if(this.session?.index===index&&this.wait?.index===index)
                this.advance();
            }});
            if(!control){this.wait=null;this.error='YOKOHAMA FINALE UNAVAILABLE';}
            return;
          }
        }
        if(['ARKON_CH10_SETTLEMENT','ARKON_CH10_SELL_Z','ARKON_CH10_GINZA',
            'ARKON_CH10_INVEST','ARKON_CH10_YOKOHAMA'].includes(type)){
          if(this.session.id!=='arkonChapter10' ||
             scene.registry.get('gameMode')!=='arkonStory'){
            this.error='CHAPTER 10 ACTION OUTSIDE ARKON STORY';return;
          }
          const action=type==='ARKON_CH10_SETTLEMENT'?settleArkonCh10Dispute:
             type==='ARKON_CH10_SELL_Z'?sellArkonCh10LibertyWalk:
            type==='ARKON_CH10_GINZA'?openArkonCh10Ginza:
            type==='ARKON_CH10_INVEST'?recordArkonCh10Investment:
            prepareArkonCh10Yokohama;
          if(!action(scene.registry)){
            this.error='CHAPTER 10 MILESTONE NOT READY: '+type;return;
          }
          saveSessionState(scene.registry);this.advance();continue;
        }
        if(type==='ARKON_CH10_RESTORE'){
          if(this.session.id!=='arkonChapter10' ||
             scene.registry.get('gameMode')!=='arkonStory' ||
             sceneName(scene)!=='GarageScene' || scene.crewMode ||
             Number(scene.registry.get('arkonStoryChapter10ProjectsDone')||0)<step.index ||
             !ARKON_CH10_PROJECTS[step.index]){
            this.error='CHAPTER 10 RESTORATION NOT READY';return;
          }
          if(Number(scene.registry.get('arkonStoryChapter10ProjectsDone')||0)>step.index){
            this.advance();continue;
          }
          this.wait={kind:'dialogue',index};
          const control=showArkonCh10Restoration(scene,step.index,{onComplete:()=>{
            if(this.session?.index!==index||this.wait?.index!==index)return;
            if(!recordArkonCh10Project(scene.registry,step.index)){
              this.error='CHAPTER 10 RESTORATION COULD NOT BE SAVED';return;
            }
            saveSessionState(scene.registry);this.advance();
          }});
          if(!control){this.wait=null;this.error='CHAPTER 10 RESTORATION PANEL UNAVAILABLE';}
          return;
        }
        if(type==='ARKON_CH10_RACE'){
          if(this.session.id!=='arkonChapter10' ||
             scene.registry.get('gameMode')!=='arkonStory' ||
             !['GarageScene','MeetScene'].includes(sceneName(scene)) ||
             !startArkonCh10Race(scene.registry)){
            this.error='CHAPTER 10 FRIENDLY RACE UNAVAILABLE';return;
          }
          saveSessionState(scene.registry);this.clearStage();
          if(!queueSafeSceneStart(scene,'RaceScene')){
            scene.registry.set('arkonStoryChapter10RaceResult','forfeit');
            finishArkonCh10Race(scene.registry);
            this.error='CHAPTER 10 RACE TRANSITION FAILED';return;
          }
          this.advance();this.wait={kind:'transition',target:'RaceScene',origin:scene};return;
        }
        if(type==='ARKON_CH10_RETURN'){
          if(this.session.id!=='arkonChapter10' ||
             scene.registry.get('gameMode')!=='arkonStory' ||
             sceneName(scene)!=='MeetScene' ||
             !finishArkonCh10Race(scene.registry)){
            this.error='CHAPTER 10 FRIENDLY RACE RESULT NOT RECORDED';return;
          }
          saveSessionState(scene.registry);this.advance();continue;
        }
        if(type==='ARKON_CH10_DRIVE'){
          if(this.session.id!=='arkonChapter10' ||
             scene.registry.get('gameMode')!=='arkonStory' ||
             !startArkonCh10PorscheCruise(scene.registry)){
            this.error='CHAPTER 10 PORSCHE NIGHT DRIVE UNAVAILABLE';return;
          }
          saveSessionState(scene.registry);this.clearStage();
          if(!queueSafeSceneStart(scene,'RaceScene')){
            this.error='CHAPTER 10 PORSCHE TRANSITION FAILED';return;
          }
          this.advance();this.wait={kind:'transition',target:'RaceScene',origin:scene};return;
        }
        if(type==='ARKON_CH10_DRIVE_RETURN'){
          if(sceneName(scene)!=='MeetScene'||
             !finishArkonCh10PorscheCruise(scene.registry)){
            this.error='CHAPTER 10 PORSCHE NIGHT DRIVE NOT FINISHED';return;
          }
          saveSessionState(scene.registry);this.advance();continue;
        }
        if(type==='ARKON_CH10_FINALE'){
          if(this.session.id!=='arkonChapter10' ||
             scene.registry.get('gameMode')!=='arkonStory' ||
             sceneName(scene)!=='MeetScene' ||
             !scene.registry.get('arkonStoryCareerSeed') ||
             !scene.registry.get('arkonStoryGinzaPartnership')){
            this.error='ARKON STORY FINALE IS NOT READY';return;
          }
          this.wait={kind:'dialogue',index};
          const control=showArkonChapter10Finale(scene,{onComplete:()=>{
            if(this.session?.index===index&&this.wait?.index===index)this.advance();
          }});
          if(!control){this.wait=null;this.error='FINAL YOKOHAMA SCENE UNAVAILABLE';}
          return;
        }
        if(type==='ARKON_CH9_RACE'){
          if(this.session.id!=='arkonChapter09' ||
             scene.registry.get('gameMode')!=='arkonStory' ||
             !['GarageScene','MeetScene'].includes(sceneName(scene)) ||
             !startArkonCh9Race(scene.registry,step.index)){
            this.error='CHAPTER 09 DEMONSTRATION UNAVAILABLE';return;
          }
          saveSessionState(scene.registry);this.clearStage();
          if(!queueSafeSceneStart(scene,'RaceScene')){
            scene.registry.set('arkonStoryChapter09RaceResult','forfeit');
            finishArkonCh9Race(scene.registry);
            this.error='CHAPTER 09 RACE TRANSITION FAILED';return;
          }
          this.advance();this.wait={kind:'transition',target:'RaceScene',origin:scene};return;
        }
        if(type==='ARKON_CH9_RETURN'){
          if(this.session.id!=='arkonChapter09' ||
             scene.registry.get('gameMode')!=='arkonStory' ||
             sceneName(scene)!=='MeetScene' ||
             !finishArkonCh9Race(scene.registry)){
            this.error='CHAPTER 09 RACE RESULT NOT RECORDED';return;
          }
          saveSessionState(scene.registry);this.advance();continue;
        }
        if(type==='ARKON_CH9_REFUSE'){
          if(this.session.id!=='arkonChapter09' ||
             scene.registry.get('gameMode')!=='arkonStory' ||
             !recordArkonCh9Refusal(scene.registry)){
            this.error='CHAPTER 09 REFUSAL CANNOT BE RECORDED';return;
          }
          saveSessionState(scene.registry);this.advance();continue;
        }
        if(type==='ARKON_CH8_MEET'){
          if(this.session.id!=='arkonChapter08' || !['GarageScene','MeetScene'].includes(sceneName(scene))){
            this.error='CHAPTER 08 INVITATIONAL UNAVAILABLE';return;
          }
          this.clearStage();
          this.wait={kind:'dialogue',index};
          const meet=showArukenChapter08Meet(scene,step.index,()=>{
            if(this.session?.index===index && this.wait?.index===index)this.advance();
          });
          if(!meet){this.wait=null;this.error='CHAPTER 08 MEET UI UNAVAILABLE';}
          return;
        }
        if(type==='ARKON_CH8_RACE'){
          if(this.session.id!=='arkonChapter08' ||
             scene.registry.get('gameMode')!=='arkonStory' ||
             !['GarageScene','MeetScene'].includes(sceneName(scene)) ||
             !startArkonCh8Race(scene.registry,step.index)){
            this.error='CHAPTER 08 PRIVATE RACE UNAVAILABLE';return;
          }
          saveSessionState(scene.registry);this.clearStage();
          if(!queueSafeSceneStart(scene,'RaceScene')){
            scene.registry.set('arkonStoryChapter08RaceResult','forfeit');
            finishArkonCh8Race(scene.registry);
            this.error='CHAPTER 08 RACE TRANSITION FAILED';return;
          }
          this.advance();this.wait={kind:'transition',target:'RaceScene',origin:scene};return;
        }
        if(type==='ARKON_CH8_RETURN'){
          if(this.session.id!=='arkonChapter08' ||
             scene.registry.get('gameMode')!=='arkonStory' ||
             sceneName(scene)!=='MeetScene' ||
             !finishArkonCh8Race(scene.registry)){
            this.error='CHAPTER 08 RACE RESULT NOT RECORDED';return;
          }
          saveSessionState(scene.registry);this.advance();continue;
        }
        if(type==='ARKON_CH8_CONTRACT'){
          if(this.session.id!=='arkonChapter08' ||
             scene.registry.get('gameMode')!=='arkonStory' ||
             !recordArkonCh8Contract(scene.registry)){
            this.error='CHAPTER 08 CONTRACT CANNOT BE SIGNED';return;
          }
          saveSessionState(scene.registry);this.advance();continue;
        }
        if(type==='ARKON_CH7_JOB'){
          if(this.session.id!=='arkonChapter07'||
              scene.registry.get('gameMode')!=='arkonStory'||
              sceneName(scene)!=='GarageScene'){
            this.error='CHAPTER 07 COMMISSION REQUIRES WAREHOUSE HQ';return;
          }
          const p=ch7Progress(scene.registry);
          if(p.jobsDone>step.index){this.advance();continue;}
          if(p.jobsDone!==step.index){
            this.error='CHAPTER 07 COMMISSION ORDER MISMATCH';return;
          }
          const job=getArkonCh7Job(scene.registry,step.index);
          if(!job){this.error='CHAPTER 07 CONTRACT NOT READY';return;}
          this.wait={kind:'dialogue',index};
          const control=showArkonCustomerTuning(scene,job,{onComplete:()=>{
            if(this.session?.index!==index||this.wait?.index!==index)return;
            if(!this.session.preview&&!recordArkonCh7Job(scene.registry,step.index)){
              this.error='CHAPTER 07 INVOICE FAILED';return;
            }
            saveSessionState(scene.registry);this.advance();
          }});
          if(!control){this.wait=null;this.error='CHAPTER 07 TUNING PANEL UNAVAILABLE';}
          return;
        }
        if(type==='ARKON_CH7_WORK'){
          if(this.session.id!=='arkonChapter07' ||
            scene.registry.get('gameMode')!=='arkonStory' ||
            sceneName(scene)!=='GarageScene'){
            this.error='CHAPTER 07 240Z WORK REQUIRES WAREHOUSE HQ';return;
          }
          const p=ch7Progress(scene.registry);
          if(p.stage===step.stage && p.ready){
            if(!finishArkonCh7Work(scene.registry,step.stage)){
              this.error='CHAPTER 07 BUILD VALIDATION FAILED';return;
            }
            saveSessionState(scene.registry);this.advance();continue;
          }
          if(!startArkonCh7Work(scene.registry,step.stage)){
            this.error='CHAPTER 07 BUILD STAGE UNAVAILABLE';return;
          }
          // Ordinary garage upgrades and genuine tuner-shop visits are now
          // player-controlled. Retain the checkpoint; no auto-running scenes.
          this.checkpoint();this.stop();
          scene.time?.delayedCall?.(120,()=>{
            if(scene.sys?.isActive?.() && scene.registry.get('gameMode')==='arkonStory')
              showArkonStoryObjective(scene);
          });
          return;
        }
        if(type==='ARKON_CH7_RACE'){
          if(this.session.id!=='arkonChapter07'||
            scene.registry.get('gameMode')!=='arkonStory'||
            !['GarageScene','MeetScene'].includes(sceneName(scene))||
            !startArkonCh7Race(scene.registry,step.index)){
            this.error='CHAPTER 07 PROVING RUN UNAVAILABLE';return;
          }
          saveSessionState(scene.registry);
          this.clearStage();
          if(!queueSafeSceneStart(scene,'RaceScene')){
            scene.registry.set('arkonStoryChapter07RaceResult','forfeit');
            finishArkonCh7Race(scene.registry);
            this.error='CHAPTER 07 RACE TRANSITION FAILED';return;
          }
          this.advance();this.wait={kind:'transition',target:'RaceScene',origin:scene};return;
        }
        if(type==='ARKON_CH7_RETURN'){
          if(this.session.id!=='arkonChapter07'||
            scene.registry.get('gameMode')!=='arkonStory'||
            sceneName(scene)!=='MeetScene'||!finishArkonCh7Race(scene.registry)){
            this.error='CHAPTER 07 TEST RESULT NOT RECORDED';return;
          }
          saveSessionState(scene.registry);this.advance();continue;
        }
        if(type==='ARKON_CH7_CONVERT'){
          if(this.session.id!=='arkonChapter07'||sceneName(scene)!=='GarageScene'||
            !convertArkonCh7Car(scene.registry)){
            this.error='LIBERTY WALK CONVERSION NOT READY';return;
          }
          saveSessionState(scene.registry);this.advance();continue;
        }
        if(type==='ARKON_CH7_SOLO'){
          if(this.session.id!=='arkonChapter07'||
            !startArkonCh7SoloDrive(scene.registry)){
            this.error='CHAPTER 07 SOLO DRIVE UNAVAILABLE';return;
          }
          saveSessionState(scene.registry);this.clearStage();
          if(!queueSafeSceneStart(scene,'RaceScene')){
            this.error='SOLO DRIVE TRANSITION FAILED';return;
          }
          this.advance();this.wait={kind:'transition',target:'RaceScene',origin:scene};return;
        }
        if(type==='ARKON_CH7_SOLO_RETURN'){
          if(this.session.id!=='arkonChapter07'||sceneName(scene)!=='MeetScene'||
            !finishArkonCh7SoloDrive(scene.registry)){
            this.error='SOLO DRIVE HAS NOT ENDED';return;
          }
          saveSessionState(scene.registry);this.advance();continue;
        }
        if(type==='ARKON_CH5_RACE'){
          if(this.session.id!=='arkonChapter05' ||
             scene.registry.get('gameMode')!=='arkonStory' ||
             !['GarageScene','MeetScene'].includes(sceneName(scene)) ||
             !startArkonCh5TestRace(scene.registry,step.index)){
            this.error='CHAPTER 05 CUSTOMER TEST DRIVE UNAVAILABLE';return;
          }
          saveSessionState(scene.registry);
          this.clearStage();
          if(!queueSafeSceneStart(scene,'RaceScene')){
            scene.registry.set('arkonStoryChapter05RaceResult','forfeit');
            finishArkonCh5TestRace(scene.registry);
            this.error='CHAPTER 05 RACE TRANSITION FAILED';return;
          }
          this.advance();
          this.wait={kind:'transition',target:'RaceScene',origin:scene};return;
        }
        if(type==='ARKON_CH5_RETURN'){
          if(this.session.id!=='arkonChapter05' ||
             scene.registry.get('gameMode')!=='arkonStory' ||
             sceneName(scene)!=='MeetScene' ||
             !finishArkonCh5TestRace(scene.registry)){
            this.error='CHAPTER 05 CUSTOMER CAR COULD NOT BE RETURNED';return;
          }
          saveSessionState(scene.registry);
          this.advance();continue;
        }
        if(type==='ARKON_MX5_RACE'){ 
          // One continuous REAL road sequence: solo MX-5 rolling test drive,
          // Arkon/Sayaka in-race banter, S15 joins, paused decision, real
          // rolling-start race on acceptance. No intermediate Meet or manga.
          if(this.session.id!=='arkonChapter03' ||
              scene.registry.get('gameMode')!=='arkonStory' ||
              !['GarageScene','MeetScene'].includes(sceneName(scene)) ||
              !beginArkonMx5GuestRace(scene.registry)){
            this.error='SAYAKA MX-5 DRIVE UNAVAILABLE';return;
          }
          scene.registry.set('selectedRaceCategory','ARKON_MX5_DRIVE');
          scene.registry.set('arkonStoryPhase','chapter03Driving');
          saveSessionState(scene.registry);
          this.clearStage();
          if(!queueSafeSceneStart(scene,'RaceScene')){
            finishArkonMx5GuestRace(scene.registry);
            this.error='SAYAKA DRIVE TRANSITION FAILED';return;
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
            if (this.session.id==='arkonChapter03' &&
                step.key==='arkonStoryChapter' && step.value===3 &&
                scene.registry.get('gameMode')==='arkonStory') {
              // Canal Yard is a free Story milestone. Do not call either
              // workshop purchase path: no regional wins and no cash charge.
              const reg=scene.registry;
              reg.set('arkonStoryCanalYardUnlocked',true);
              reg.set('garageTier',1);
              reg.set('workshopLocationId','shinonomeCanalYard');
              const owned=reg.get('ownedCarIds')||[];
              const selected=reg.get('selectedCarId');
              const requested={...(reg.get('carGarageLocations')||{})};
              if(selected && owned.includes(selected))
                requested[selected]='shinonomeCanalYard';
              reg.set('carGarageLocations',normaliseCarGarageLocations(
                owned,requested,1));
              this.checkpoint();
              this.advance();
              if (sceneName(scene)!=='GarageScene' || scene.crewMode) {
                this.clearStage();
                if(!queueSafeSceneStart(scene,'GarageScene',{
                  crewMode:false,workshopLocationId:'shinonomeCanalYard'
                })){
                  this.error='CANAL YARD STORY TRANSITION FAILED';return;
                }
                this.wait={kind:'transition',target:'GarageScene',origin:scene};
                return;
              }
              continue;
            }
            // Script-authored Story time uses a PRIVATE profile flag, never
            // WorldClock's shared device-wide epoch. No additional script
            // step is inserted: existing R652 checkpoints remain valid.
            if (['arkonChapter01Revised','arkonChapter02','arkonChapter04','arkonChapter05','arkonChapter06','arkonChapter07','arkonChapter08','arkonChapter09','arkonChapter10'].includes(this.session.id) &&
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
          // Returning after the MX-5 run must really enter Canal Yard,
          // not merely paint a Canal Yard image over MeetScene.
          if(this.session.id==='arkonChapter03' &&
             step.backgroundId==='workshop:shinonomeCanalYard:night' &&
             sceneName(scene)!=='GarageScene'){
            this.clearStage();
            scene.registry.set('workshopLocationId','shinonomeCanalYard');
            if(!queueSafeSceneStart(scene,'GarageScene',{
              crewMode:false,workshopLocationId:'shinonomeCanalYard'
            })){
              this.error='CANAL YARD STORY RETURN FAILED';return;
            }
            this.wait={kind:'transition',target:'GarageScene',origin:scene};
            return; // Resume at this exact authored stage.
          }
          if (step.privateMeet && sceneName(scene)==='MeetScene')
            scene.setStoryEncounterActive?.(true);
          // Never put dialogue on top of the moving Porsche. Its native
          // garage roll must reach the stop position before the next prompt.
          const rolling=this.session.id==='arkonChapter04' && step.motion==='roll-in-left';
          const revealing=step.awaitArrival===true || (this.session.id==='arkonChapter05' &&
              step.meetDuel===true ||
              this.session.id==='arkonChapter06') &&
            Number(step.fadeInMs)>0;
          if(rolling||revealing)this.wait={kind:'dialogue',index};
          const stage=showStoryStage(scene,(rolling||revealing)?{
            ...step,onArrivalComplete:()=>{
              if(this.session?.index===index && this.wait?.index===index)
                this.advance();
            },
          }:step);
          if((this.session.id==='arkonChapter04'||revealing) && !stage){
            this.error='STORY STAGE UNAVAILABLE';return;
          }
          if(rolling||revealing)return;
          this.advance(); continue;
        }
        if(type==='STORY_CAR_EXIT'){
          if(this.session.id!=='arkonChapter05' ||
             sceneName(scene)!=='MeetScene' ||
             !scene._storyDirectorStage?.exitCar){
            this.error='CHAPTER 05 MEET CAR EXIT UNAVAILABLE';return;
          }
          this.wait={kind:'dialogue',index};
          scene._storyDirectorStage.exitCar(step.slot??1,step.ms||3000,()=>{
            if(this.session?.index===index && this.wait?.index===index)
              this.advance();
          });
          return;
        }
        if(type==='RETREAT_STORY_ACTOR'){
          if(!scene._storyDirectorStage?.retreatActor){
            this.error='STORY ACTOR RETREAT UNAVAILABLE';return;
          }
          this.wait={kind:'dialogue',index};
          scene._storyDirectorStage.retreatActor(step.actorId,()=>{
            if(this.session?.index===index && this.wait?.index===index)
              this.advance();
          });
          return;
        }
        if(type==='FADE_STORY_ACTOR'){
          if(!scene._storyDirectorStage?.fadeActor){
            this.error='STORY ACTOR FADE UNAVAILABLE';return;
          }
          this.wait={kind:'dialogue',index};
          scene._storyDirectorStage.fadeActor(step.actorId,step.ms||900,()=>{
            if(this.session?.index===index && this.wait?.index===index)
              this.advance();
          });
          return;
        }
        if (type === 'CLEAR_STAGE') {
          this.clearStage();
          this.advance(); continue;
        }
        if (['MANGA','PHONE','COMPACT'].includes(type)) {
          if (sceneCutsceneActive(scene) || scene._compactStoryDialogue?.active) return;
          const onDone = () => {
            if (!this.session || this.wait?.index !== index) return;
            if((this.session.id!=='arkonChapter06' && !step.holdAfter) || type!=='MANGA'){
              this.advance();return;
            }
            // Dialogue must fully dissolve before revealing the existing
            // workshop/Meet stage. The NEXT cutscene cannot auto-pop up.
            scene.time.delayedCall(140,()=>{
              if(!this.session || this.session.index!==index||this.wait?.index!==index)return;
              const prompt=showStoryContinuePrompt(scene,{
                label:'CONTINUE WHEN READY',
                caption:'TAKE IN THE SCENE',
                revealMs:950,
                onContinue:()=>{
                  if(this.session?.index===index&&this.wait?.index===index)
                    this.advance();
                },
                onCancel:({reason})=>{
                  if(this.session?.index===index && reason!=='shutdown')
                    this.error='STORY SCENERY HOLD CANCELLED';
                },
              });
              if(!prompt) this.advance();
            });
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
              preloadPagePosesOnly: ['arkonChapter01Revised','arkonChapter02','arkonChapter03','arkonChapter04'].includes(this.session.id) ||
                ['arkonChapter05','arkonChapter06','arkonChapter07','arkonChapter08','arkonChapter09','arkonChapter10'].includes(this.session.id),
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
