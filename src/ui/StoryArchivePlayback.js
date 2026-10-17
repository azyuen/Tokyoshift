// R570 canonical cinematic player used by both Story Archive and developer.
// Original manga/phone systems and gesture-driven portrait galleries are reused.
import { playMangaCutscene,sceneCutsceneActive } from './MangaCutscene.js?v=20261017-r570';
import { playCanalYardStory } from './CanalYardStory.js?v=20261017-r562';
import { preloadSevenRivalsMontageAssets,startSevenRivalsPortraitMontage } from './SevenRivalsMontage.js?v=20261017-r564';
import { preloadFullCrewCelebrationAssets,showFullCrewCelebration } from './FullCrewCelebration.js?v=20261017-r562';
import { showMagazinePanel } from './CarHistoryPanel.js?v=20261012-r489';
import { getFirstRegionalChampionRegion } from '../data/careerProgression.js?v=20261017-r553';
import { isStoryArchiveSceneReplay,endStoryArchiveSceneReplay } from './StoryReplaySession.js?v=20261017-r570';

const OPENING=['openingStationEncounter','__magazine','openingSayakaPhoneCall',
  'openingSayakaKeys','openingSayakaFarewell','openingDaichiAfterSayaka'];

export function playStoryArchiveChapter(scene,id) {
  if(!scene || !isStoryArchiveSceneReplay(scene.registry) ||
      sceneCutsceneActive(scene))return false;
  const objects=[];
  const done=()=>{
    if (!isStoryArchiveSceneReplay(scene.registry))return;
    scene._sevenRivalsMontage?.stop?.();
    scene._fullCrewCelebration?.stop?.();
    scene._portraitGallery?.stop?.();
    objects.forEach(obj=>obj?.destroy?.());
    endStoryArchiveSceneReplay(scene);
  };
  const x=1403,y=46,depth=1180;
  const exit=scene.add.rectangle(x,y,230,47,0x182531,.97)
    .setStrokeStyle(2,0xffb3d2).setDepth(depth)
    .setScrollFactor(0).setInteractive({useHandCursor:true});
  const label=scene.add.text(x,y,'EXIT REPLAY',{
    fontFamily:'"Silkscreen", monospace',fontSize:'9px',color:'#ffffff',
  }).setOrigin(.5).setDepth(depth+1).setScrollFactor(0);
  objects.push(exit,label);
  exit.on('pointerdown',done);
  let i=0;
  const nextOpening=()=>{
    if (!scene?.sys?.isActive?.() || !isStoryArchiveSceneReplay(scene.registry))return;
    const step=OPENING[i++];
    if(!step){done();return;}
    if(step==='__magazine'){
      // This is the ACTUAL Issue 01 viewer: the player may flip spreads and
      // choose AE86/EF, but choices are temporarily sandboxed and never saved.
      scene.registry.set('openingChapter','magazine');
      let continued=false;
      const proceed=()=>{
        if(continued)return;
        continued=true;
        scene.registry.set('openingChapter',null);
        scene.time.delayedCall(180,nextOpening);
      };
      showMagazinePanel(scene,{
        onChoose: carId => {scene.registry.set('starterCarId',carId);proceed();},
        onClose:proceed,
      });
      return;
    }
    const result=playMangaCutscene(scene,step,{
      preview:true,preloadPagePosesOnly:true,
      onPreviewComplete:payload=>
        payload?.skipped?done():scene.time.delayedCall(140,nextOpening),
    });
    if(!result?.played)scene.time.delayedCall(140,nextOpening);
  };
  const generic=(storyId,options={})=>{
    const result=playMangaCutscene(scene,storyId,{
      preview:true,preloadPagePosesOnly:true,...options,
      onPreviewComplete:done,
    });
    if(!result?.played)done();
  };
  if(id==='chapter01')nextOpening();
  else if(id==='chapter02')generic('centralTokyoUnlocked');
  else if(id==='chapter03')generic('firstRegionalChampion',{
    variables:{REGION:getFirstRegionalChampionRegion(scene.registry)||'ODAIBA'},
  });
  else if(id==='chapter04'){
    const result=playCanalYardStory(scene,{
      preview:true,onComplete:done,onCancel:done,
    });
    if(!result?.played)done();
  } else if(id==='chapter05'){
    if(typeof scene.playWarehouseHqStory==='function'){
      if(!scene.playWarehouseHqStory({preview:true,onPreviewComplete:done}))done();
    } else generic('warehouseHqUnlocked');
  } else if(id==='chapter06'){
    preloadSevenRivalsMontageAssets(scene,()=>{
      if(!scene.sys.isActive()||!isStoryArchiveSceneReplay(scene.registry))return;
      if(typeof scene.playSevenRegionsStory==='function'){
        if(!scene.playSevenRegionsStory({preview:true,onPreviewComplete:done}))done();
      } else generic('sevenRegionsConquered',{
        onPageChange:({page})=>{if(page?.cinematicBeat==='sevenRivalsMontage')
          startSevenRivalsPortraitMontage(scene);},
      });
    });
  } else if(id==='chapter07'){
    preloadFullCrewCelebrationAssets(scene,{preview:true},()=>{
      if(!scene.sys.isActive()||!isStoryArchiveSceneReplay(scene.registry))return;
      if(typeof scene.playFullCrewStory==='function'){
        if(!scene.playFullCrewStory({preview:true,onPreviewComplete:done}))done();
      } else generic('fullCrewTogether',{
        onPageChange:({page})=>{
          if(page?.cinematicBeat==='completeCrewGroup')showFullCrewCelebration(scene,{preview:true});
        },
      });
    });
  } else done();
  return true;
}
