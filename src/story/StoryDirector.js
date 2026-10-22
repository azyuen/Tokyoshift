// Cross-scene story orchestration. The Director owns progression, not rendering.
// Built on the existing manga, phone, compact HUD, map and race systems.
import {
  validateStoryScript, createStoryCheckpoint, isStoryCheckpoint,
  checkStoryCondition, nextStoryPosition, normaliseStoryChoiceVars,
} from './StoryScript.js?v=20261022-r639';
import { playMangaCutscene, sceneCutsceneActive } from '../ui/MangaCutscene.js?v=20261022-r638';
import { playCompactStoryDialogue } from '../ui/CompactStoryDialogue.js?v=20261022-r640';
import { showStoryStage } from '../ui/StoryStage.js?v=20261022-r642';
import { queueSafeSceneStart } from '../ui/SafeSceneTransition.js?v=20261017-r573';
import { getActiveProfileIndex, saveSessionState } from '../state/GameState.js?v=20261022-r639';
import { STORY_DIRECTOR_SCRIPTS } from '../data/storyDirectorScripts.js?v=20261022-r639';
import { showStoryChoices } from '../ui/StoryChoicePanel.js?v=20261022-r641';
import { showStoryContinuePrompt } from '../ui/StoryContinuePrompt.js?v=20261022-r643';
import { cars } from '../data/cars.js?v=20261017-r565';
import {
  DEV_VAULT_STORY_ID, isArkonVaultStoryLoan, prepareDevVaultHeroRace,
} from '../data/devVaultStory.js?v=20261022-r642';

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
    for (const scene of this.game.scene?.getScenes?.(true) || [])
      scene._storyDirectorStage?.destroy?.();
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
    if (!this.session) { this.resume(); return; }
    if (this.session.slot !== owner()) { this.stop(); return; }
    if (this.error) return;
    const scene = this.activeScene();
    if (!scene || !scene?.registry) return;
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
        if (!checkStoryCondition(wait.condition, key => scene.registry.get(key))) return;
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
            this.checkpoint();
          }
          this.advance(); continue;
        }
        if (type === 'STAGE') {
          showStoryStage(scene,step);
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
          if (checkStoryCondition(step,key=>scene.registry.get(key))) {
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
