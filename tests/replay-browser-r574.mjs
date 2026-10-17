import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true,args:[
  '--disable-dev-shm-usage','--no-sandbox','--use-gl=angle','--use-angle=swiftshader',
]});
let failures=0;
for(const chapter of ['chapter06','chapter07','chapter08']) {
  const page=await browser.newPage({viewport:{width:1560,height:840},deviceScaleFactor:1});
  const problems=[];
  page.on('pageerror',error=>problems.push('PAGE ERROR '+String(error.stack||error)));
  page.on('console',msg=>{if(msg.type()==='error')problems.push('CONSOLE '+msg.text());});
  page.on('requestfailed',req=>{
    if(req.url().includes('/assets/'))problems.push('ASSET '+req.url()+' '+req.failure()?.errorText);
  });
  try {
    await page.goto('http://127.0.0.1:8765/?ci_replay='+chapter,{waitUntil:'domcontentloaded',timeout:20000});
    await page.waitForFunction(()=>{
      const g=window.TOKYO_SHIFT;
      return g?.scene?.keys?.GarageScene && g?.registry && g.scene.getScene('GarageScene');
    },{timeout:30000});
    await page.evaluate(async()=>{
      const game=window.TOKYO_SHIFT;
      const mod=await import('/src/state/GameState.js?v=20261017-r574');
      const base=mod.createDefaultGameState();
      const overrides={
        firstName:'Arkon',lastName:'Den',devMode:true,gameOver:false,
        openingChapter:null,cash:999999999,garageTier:2,
        workshopLocationId:'shinonomeWarehouseStrip',crewSpaceActive:false,
        ownedCarIds:['ae86'],selectedCarId:'ae86',preferredCarId:'ae86',
        carGarageLocations:{ae86:'shinonomeWarehouseStrip'},
        carStates:{ae86:mod.createStarterCarState('ae86')},
        cutscenesSeen:[
          'openingDaichiAfterSayaka','centralTokyoUnlocked',
          'firstRegionalChampion','canalYardBiggerDreams','warehouseHqUnlocked',
          'sevenRegionsConquered','fullCrewTogether','chapter08Ginza',
          'chapter08RaceFinished',
        ],
      };
      for(const [key,value] of Object.entries({...base,...overrides})){
        game.registry.set(key,value);
      }
      game.scene.start('GarageScene',{crewMode:false,workshopLocationId:'shinonomeWarehouseStrip'});
    });
    await page.waitForFunction(()=>window.TOKYO_SHIFT?.scene?.isActive('GarageScene'),{timeout:20000});
    const result=await page.evaluate(async chapterId=>{
      const game=window.TOKYO_SHIFT;
      const scene=game.scene.getScene('GarageScene');
      if(chapterId==='chapter08'){
        const mod=await import('/src/ui/Chapter08DevReplay.js?v=20261017-r574');
        return mod.startInteractiveChapter08Replay(scene);
      }
      const mod=await import('/src/ui/StoryReplaySession.js?v=20261017-r574');
      return mod.beginStoryArchiveSceneReplay(scene,chapterId,{skipMagazine:true});
    },chapter);
    assert.equal(result,true,chapter+' replay accepted');
    const sceneKey=chapter==='chapter07'?'CrewSpaceScene':'GarageScene';
    await page.waitForFunction(key=>window.TOKYO_SHIFT?.scene?.isActive(key),sceneKey,{timeout:25000});
    await page.waitForFunction(key=>{
      const scene=window.TOKYO_SHIFT?.scene?.getScene(key);
      const cutscene=scene?._mangaCutscene;
      return Boolean(cutscene?.played && cutscene?.active) ||
        Boolean(scene?._phoneConversation?.active);
    },sceneKey,{timeout:30000});
    const state=await page.evaluate(key=>{
      const sc=window.TOKYO_SHIFT.scene.getScene(key);
      return {active:sc.sys.isActive(),scene:key,chapter:sc.storyArchiveChapter,
        replay:sc.registry.get('__storyArchiveSceneReplay'),
        chapter08Replay:sc.registry.get('__chapter08DevReplay'),
        cutscene:sc._mangaCutscene?.definition?.id||'loading',
        displayObjects:sc.children?.list?.length,
        clockPaused:sc.time.paused};
    },sceneKey);
    console.log('PASS '+chapter+' '+JSON.stringify(state));
  }catch(error){
    failures++;
    const state=await page.evaluate(()=>{
      const g=window.TOKYO_SHIFT;
      return g?{
        active:g.scene.getScenes(true).map(s=>s.scene.key),
        garage:g.scene.keys.GarageScene?{
          clockPaused:g.scene.keys.GarageScene.time.paused,
          manga:g.scene.keys.GarageScene._mangaCutscene?.definition?.id||null,
          archive:g.scene.keys.GarageScene.storyArchiveChapter,
          objects:g.scene.keys.GarageScene.children?.list?.length,
        }:null,
        crew:g.scene.keys.CrewSpaceScene?{
          archive:g.scene.keys.CrewSpaceScene.storyArchiveChapter,
          objects:g.scene.keys.CrewSpaceScene.children?.list?.length,
        }:null,
      }:null;
    }).catch(()=>null);
    console.error('FAIL '+chapter+' '+String(error)+' STATE '+JSON.stringify(state));
    console.error('BROWSER LOGS '+JSON.stringify(problems.slice(0,16)));
    await page.screenshot({path:'/tmp/'+chapter+'-failure.png'}).catch(()=>{});
  }finally{await page.close();}
}
await browser.close();
if(failures)process.exit(1);
