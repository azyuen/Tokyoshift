// R568 Chapter 08 orchestration. All career flags are ordinary saved cutscene
// milestones, so a reload between a phone call, the map and Ginza can resume.
import { CHAPTER08_SCENES } from '../data/chapter08.js?v=20261022-r646';
import { playMangaCutscene, sceneCutsceneActive } from './MangaCutscene.js?v=20261017-r572';
import { showTravelMap } from './TravelMap.js?v=20261017-r573';
import { openSwipePortraitGallery } from './SwipePortraitGallery.js?v=20261017-r568';
import { hasSeenCutscene, markCutsceneSeen } from '../data/cutscenes.js?v=20261017-r571';
import { markCentralTokyoUnlocked } from '../data/centralTokyo.js?v=20261017-r568';
import { areAllCrewBattlesComplete } from '../data/crewSystem.js?v=20261016-r551';
import { characters, getCharacterAssetUrl } from '../data/characters.js?v=20261017-r565';
import { cars } from '../data/cars.js?v=20261017-r565';
import { isChapter08DevReplay, finishInteractiveChapter08Replay } from './Chapter08DevReplay.js?v=20261017-r574';
import { saveSessionState } from '../state/GameState.js?v=20261017-r565';
import { playChapter08GinzaRevealStage } from './Chapter08GinzaRevealStage.js?v=20261022-r646';
import { showStoryContinuePrompt } from './StoryContinuePrompt.js?v=20261022-r643';

const WAREHOUSE_BEATS = [
  'chapter08Warehouse',
  'chapter08ManagerCall',
  'chapter08WarehouseReaction',
  'chapter08SayakaCall',
  'chapter08WarehouseFarewell',
];

export function chapter08ShouldBegin(source) {
  return areAllCrewBattlesComplete(source) &&
    !hasSeenCutscene(source, 'chapter08Ginza') &&
    !hasSeenCutscene(source, 'chapter08RaceFinished');
}

export function startChapter08Warehouse(scene, { preview = false, onPreviewComplete = null } = {}) {
  if (!scene || sceneCutsceneActive(scene)) return false;
  const interactiveReplay = isChapter08DevReplay(scene.registry);
  if (!preview && !interactiveReplay && (!chapter08ShouldBegin(scene.registry) ||
      scene.crewMode || scene.registry.get('workshopLocationId') !== 'shinonomeWarehouseStrip' ||
      scene.registry.get('devMode'))) return false;

  let previewIndex = 0;
  const next = () => {
    if (!scene?.sys?.isActive?.() || sceneCutsceneActive(scene)) return;
    const sceneId = preview || interactiveReplay ? WAREHOUSE_BEATS[previewIndex++] :
      WAREHOUSE_BEATS.find(id => !hasSeenCutscene(scene.registry, id));
    if (!sceneId) {
      if (preview && !interactiveReplay) onPreviewComplete?.();
      else if(interactiveReplay && scene.registry.get('__chapter08ReplaySkipRace')){
        // Story-only repeat viewing: real Ginza room and character reveal,
        // but no need to drive the RWB challenge again.
        scene.scene.start('CentralTokyoScene',{
          locationId:'ginzaMotorGallery',ginzaRoom:1,chapter08Arrival:true,
        });
      } else openChapter08Map(scene);
      return;
    }
    const result = playMangaCutscene(scene, sceneId, {
      // Dev replay uses REAL presentation/click handling but no history flags.
      preview: preview || interactiveReplay,
      preloadPagePosesOnly: true,
      onComplete: () => {
        if (sceneId === 'chapter08ManagerCall') {
          // Pro invitation is earned here, while the Ginza/strategist
          // disclosures wait for the player's actual visit.
          markCentralTokyoUnlocked(scene.registry, 'ginza');
          saveSessionState(scene.registry);
        }
        scene.time.delayedCall(140, next);
      },
      onPreviewComplete: () => scene.time.delayedCall(140, next),
    });
    if (!result?.played && result?.reason === 'seen') scene.time.delayedCall(140, next);
  };
  next();
  return true;
}

export function openChapter08Map(scene) {
  if (!scene || sceneCutsceneActive(scene) ||
      (!isChapter08DevReplay(scene.registry) &&
        hasSeenCutscene(scene.registry, 'chapter08RaceFinished'))) return false;
  if (scene.travelMapPopup?.active) return true;
  // The phone's invitation is also the crash/reload recovery gate. Replay
  // needs no story unlocks; the developer already has access to Ginza.
  if (!isChapter08DevReplay(scene.registry)) {
    markCentralTokyoUnlocked(scene.registry, 'ginza');
    saveSessionState(scene.registry);
  }
  showTravelMap(scene, {
    currentLocationId: scene.registry.get('workshopLocationId') || 'shinonomeWarehouseStrip',
    fromWorkshop: true, travelMode: 'chapter08Ginza',
    title: 'CHAPTER 08 // DRIVE TO GINZA',
    actionVerb: 'DRIVE TO GINZA',
    onExit: isChapter08DevReplay(scene.registry)
      ? () => finishInteractiveChapter08Replay(scene) : null,
    onTravel: locationId => {
      if (locationId !== 'ginzaMotorGallery') return;
      scene.time.delayedCall(0, () => startChapter08PorscheRace(scene));
    },
  });
  return true;
}

export function startChapter08PorscheRace(scene) {
  if (!scene || (!isChapter08DevReplay(scene.registry) &&
    hasSeenCutscene(scene.registry, 'chapter08RaceFinished'))) return false;
  const registry = scene.registry;
  const playerCarId = cars[registry.get('selectedCarId')]
    ? registry.get('selectedCarId')
    : (registry.get('ownedCarIds') || []).find(id => cars[id] && !cars[id].crewLoan);
  if (!playerCarId) return false;
  registry.set('selectedCarId',playerCarId);
  registry.set('crewSpaceActive', false);
  registry.set('selectedRacePlayerCharacterId', null);
  registry.set('selectedOpponentCarId', 'rwbStellaPorsche');
  registry.set('selectedOpponentCharacterId', 'sayakaFujieda');
  registry.set('selectedOpponentEncounterRating', 5);
  registry.set('selectedOpponentEncounterAi', null);
  registry.set('selectedOpponentBuildState', null);
  registry.set('selectedOpponentBuildRating', null);
  registry.set('selectedOpponentBuildArchetype', null);
  registry.set('selectedRaceCategory', 'CHAPTER08');
  registry.set('selectedRaceType', 'Roll Race');
  registry.set('selectedRaceDistanceM', 402.336);
  registry.set('selectedRaceDeal', 'CHAPTER08_STORY');
  registry.set('selectedRaceStake', 0);
  registry.set('selectedRaceSpecialChallenge', false);
  registry.set('selectedRaceMeetOffer', null);
  registry.set('raceDistrict', 'CENTRAL_TOKYO');
  registry.set('raceLocationLabel', 'GINZA EXPRESSWAY // UNKNOWN CHALLENGER');
  registry.set('raceReturnScene', 'CentralTokyoScene');
  registry.set('raceTimeOfDay', 'night');
  saveSessionState(registry);
  scene.scene.start('RaceScene');
  return true;
}

// All story portraits already exist as Sayaka poseAssets. Only queue looks
// needed by this chapter, avoiding a huge first-page asset stall.
export function preloadChapter08GinzaAssets(scene) {
  if (!scene?.textures || !scene?.load) return 0;
  let added = 0;
  for (const pose of ['homeNormal', 'oshiageNeutral', 'track', 'trackHappy']) {
    const asset = characters.sayakaFujieda?.visual?.poseAssets?.[pose];
    if (asset?.key && asset?.path && !scene.textures.exists(asset.key)) {
      scene.load.image(asset.key, getCharacterAssetUrl(asset.path));
      added++;
    }
  }
  return added;
}

function showRacingRolePlate(scene) {
  const x = scene.scale.width * .54, y = scene.scale.height * .23;
  const objects = [
    scene.add.rectangle(x, y, 535, 92, 0x0a1425, .94)
      .setStrokeStyle(2, 0xff9cbb).setDepth(1105).setScrollFactor(0),
    scene.add.text(x, y - 19, 'SAYAKA FUJIEDA', {
      fontFamily: '"Silkscreen", monospace', fontSize:'15px', color:'#ffffff',
    }).setOrigin(.5).setDepth(1106).setScrollFactor(0),
    scene.add.text(x, y + 20, 'TEAM MANAGER & STRATEGIST', {
      fontFamily: '"Silkscreen", monospace', fontSize:'10px', color:'#ffb2d0',
    }).setOrigin(.5).setDepth(1106).setScrollFactor(0),
  ];
  objects.forEach(o=>o.setAlpha(0));
  scene.tweens.add({targets: objects, alpha:1, duration:850, ease:'Sine.easeOut'});
  return () => objects.forEach(o=>o?.destroy?.());
}

// Two manga sections bracket the full-screen Porsche entrance. The *real*
// chapter08Ginza history flag is awarded ONLY after the second section ends.
// The first section has no history side-effects and is safely replayable.
export function startChapter08Ginza(scene, { preview = false } = {}) {
  if (!scene || sceneCutsceneActive(scene) || scene._chapter08GinzaStage?.active) return false;
  const interactiveReplay = isChapter08DevReplay(scene.registry);
  if (!preview && !interactiveReplay &&
      (!hasSeenCutscene(scene.registry, 'chapter08RaceFinished') ||
       hasSeenCutscene(scene.registry, 'chapter08Ginza'))) return false;

  const definition = CHAPTER08_SCENES.chapter08Ginza;
  let stage=null,disposeRole=null,finished=false,wardrobePending=false;
  const clearRole=()=>{disposeRole?.();disposeRole=null;};
  const clear=()=>{
    if(finished)return;
    finished=true;
    clearRole();
    scene._chapter08SayakaGallery?.stop?.();
    scene._storyContinuePrompt?.destroy?.();
    stage?.destroy?.();
  };
  const complete=()=>{
    clear();
    if(!preview && !interactiveReplay){
      markCutsceneSeen(scene.registry,'ginzaInvitation');
      markCutsceneSeen(scene.registry,'proCircuitStrategistReveal');
      saveSessionState(scene.registry);
      scene.chapter08Arrival=false;
      scene.chapter08Kaede=null;
      if(scene.sys?.isActive?.())scene.renderLocation('ginzaMotorGallery');
    }else if(interactiveReplay)finishInteractiveChapter08Replay(scene);
  };
  const showHold=(onContinue)=>{
    if(finished||!scene.sys?.isActive?.())return;
    const prompt=showStoryContinuePrompt(scene,{
      label:'CONTINUE',depth:1158,
      onContinue:()=>{if(!finished)onContinue?.();},
      onCancel:({reason})=>{if(reason!=='shutdown')clear();},
    });
    if(!prompt)clear();
  };
  const playAfterReveal=()=>{
    if(finished||!scene.sys?.isActive?.())return;
    // Sayaka replaces Kaede as the resting LEFT portrait for all player lines.
    // Kaede returns only for her explicit apology, never as a shaded default.
    const rest={...definition,characters:{left:'sayakaFujieda',right:'$PLAYER'},
      pages:definition.pages.slice(5)};
    const result=playMangaCutscene(scene,rest,{
      preview:preview||interactiveReplay,
      preloadPagePosesOnly:true,
      onPageChange:({page,pageIndex})=>{
        if(pageIndex>=3)stage?.dismissSayaka?.();
        if(page?.cinematicBeat==='chapter08SayakaGallery'){
          openSwipePortraitGallery(scene,{
            entries:[
              {characterId:'sayakaFujieda',pose:'homeNormal',subtitle:'Family friend'},
              {characterId:'sayakaFujieda',pose:'oshiageNeutral',subtitle:'Lady instructor'},
              {characterId:'sayakaFujieda',pose:'ginzaNormal',subtitle:'Ginza gallery curator'},
            ],
            transparentBackground:true,title:'SAYAKA // THREE FAMILIAR FACES',
            ownerKey:'_chapter08SayakaGallery',
          });
        }else if(page?.cinematicBeat==='chapter08FinalPortrait'){
          // The preceding Ginza dialogue remains fully readable until the
          // player NEXTs. Only then reveal the new wardrobe on the full-size
          // showroom tableau. CONTINUE returns to this first pro-gear page,
          // without advancing past its dialogue.
          if(!wardrobePending){
            wardrobePending=true;
            scene.time.delayedCall(80,()=>{
              if(finished||!scene._mangaCutscene?.active)return;
              if(!stage?.changeSayakaOutfit?.(()=>{
                showHold(()=>{
                  stage?.restoreAfterOutfit?.();
                  clearRole();
                  disposeRole=showRacingRolePlate(scene);
                });
              })){
                // Keep the manga moving even if a sprite failed to load.
                clearRole();
                disposeRole=showRacingRolePlate(scene);
              }
            });
          }
        }else clearRole();
      },
      onComplete:complete,
      onPreviewComplete:complete,
      onCancel:clear,
    });
    if(!result?.played)clear();
  };
  const firstManga=()=>{
    if(finished||!scene.sys?.isActive?.())return;
    const prelude={...definition,id:'chapter08GinzaPrelude',once:false,
      pages:definition.pages.slice(0,5),finalActionLabel:'THE REVEAL'};
    const result=playMangaCutscene(scene,prelude,{
      preview:true,preloadPagePosesOnly:true,
      onPreviewComplete:()=>{
        // Bring the Porsche and Sayaka into a clean, uncluttered full-screen
        // frame; the player must explicitly CONTINUE before the main reveal.
        if(!stage?.revealSayaka?.(()=>{
          showHold(()=>{
            stage?.dismissSayaka?.();
            playAfterReveal();
          });
        }))clear();
      },
      onCancel:clear,
    });
    if(!result?.played)clear();
  };
  stage=playChapter08GinzaRevealStage(scene,{
    onReady:firstManga,
    onCancel:clear,
  });
  return Boolean(stage);
}
