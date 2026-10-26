// Isolated presentation QA: real renderers, no race/economy/progression execution.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
const root=process.cwd(),source=process.env.AUDIT_SOURCE||root;
const phase=process.env.AUDIT_PHASE||'after',mode=process.env.AUDIT_MODE||'stage';
const port=Number(process.env.AUDIT_PORT||8770),out=path.join(root,'docs/story-audit/screenshots',phase+'-'+mode);
await fs.mkdir(out,{recursive:true});
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',source],{stdio:'ignore'});
const browser=await chromium.launch({executablePath:process.env.AUDIT_CHROMIUM||path.resolve('../browser-runtime/bin/chromium'),headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];let failed=false;
try {
for(const [device,width,height] of [['mobile',844,390],['tablet',1180,820]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/*phaser*.js',async route=>{if(!route.request().url().includes('127.0.0.1'))await route.fulfill({path:path.resolve('../browser-runtime/node_modules/phaser/dist/phaser.min.js')});else await route.continue();});
 await page.goto('http://127.0.0.1:'+port,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.TOKYO_SHIFT?.scene?.isActive('CharacterSelectScene'),{timeout:120000});
 await page.evaluate(async()=>{
  const g=window.TOKYO_SHIFT;for(const s of g.scene.getScenes(true))g.scene.stop(s.sys.settings.key);
  const s=new Phaser.Scene('Audit');g.scene.add('Audit',s,true);window.auditScene=s;
  await new Promise(r=>setTimeout(r,100));
  g.registry.set('gameMode','arkonStory');g.registry.set('playerCharacterId','arkonDen');g.registry.set('selectedCarId','240z');
  const [{STORY_DIRECTOR_SCRIPTS:scripts},{showStoryStage},{getStoryBackground},{resolveBackgroundViewport},{playMangaCutscene},{default:Garage},{default:Meet},{showStoryContinuePrompt}]=await Promise.all([
   import('/src/data/storyDirectorScripts.js'),import('/src/ui/StoryStage.js'),import('/src/data/storyBackgroundCatalog.js'),import('/src/story/BackgroundViewport.js'),import('/src/ui/MangaCutscene.js'),import('/src/scenes/GarageScene.js'),import('/src/scenes/MeetScene.js'),import('/src/ui/StoryContinuePrompt.js')]);
  const entries=[];for(let ch=1;ch<=10;ch++){
   const script=scripts[ch===1?'arkonChapter01Revised':'arkonChapter'+String(ch).padStart(2,'0')];let stage=null;
   script.steps.forEach((step,index)=>{if(step.type==='STAGE')stage=step;if(['STAGE','MANGA','PHONE'].includes(step.type))entries.push({ch,index,step,stage});});
  }
  window.audit={entries,showStoryStage,getStoryBackground,resolveBackgroundViewport,playMangaCutscene,Garage,Meet,showStoryContinuePrompt};
 });
 const entries=await page.evaluate(mode=>audit.entries.filter(e=>mode==='stage'?e.step.type==='STAGE':e.step.type!=='STAGE').map(e=>({ch:e.ch,index:e.index,title:e.step.title||e.stage.backgroundId})),mode);
 let count=0,last=0;
 for(const item of entries){
  if(process.env.AUDIT_CHAPTER&&item.ch!==Number(process.env.AUDIT_CHAPTER))continue;
  if(process.env.AUDIT_LIMIT&&count++>=Number(process.env.AUDIT_LIMIT))break;
  if(last!==item.ch){last=item.ch;console.log(phase,mode,device,'Chapter',last);}
  try {
   const detail=await page.evaluate(async({item,mode})=>{
    const s=window.auditScene,a=window.audit,e=a.entries.find(x=>x.ch===item.ch&&x.index===item.index),delay=ms=>new Promise(r=>setTimeout(r,ms));
    s._mangaCutscene?.shutdownHandler?.();s._phoneConversation?.close?.('shutdown');s._storyContinuePrompt?.destroy?.();s._storyDirectorStage?.destroy?.();s.tweens.killAll();s.children.removeAll(true);
    const stage=structuredClone(e.stage||{});
    s.registry.set('workshopLocationId',item.ch<4?'shinonomeWorkshop':item.ch<7?'shinonomeCanalYard':'shinonomeWarehouseStrip');
    s.worldPhase='night';s.selectedMeetLocation='odaiba7eleven';
    let bg=stage.backgroundId;if(bg==='$CURRENT_MEET')bg='meet:odaiba7eleven:night';if(bg==='$CURRENT_WORKSHOP')bg='workshop:'+s.registry.get('workshopLocationId')+':night';
    const profile=bg?a.getStoryBackground(bg):null;
    const native=profile?.id.startsWith('workshop:')?'GarageScene':'MeetScene';s.sys.settings.key=native;
    const proto=native==='GarageScene'?a.Garage.prototype:a.Meet.prototype;
    s.createCarDisplay=proto.createCarDisplay;
    for(const key of ['buildWorkshopHeroLayout','getBodyYForWheelBottom','getWorkshopWheelContactOffset'])s[key]=a.Garage.prototype[key];
    if(profile?.asset){
     if(!s.textures.exists(profile.asset.key)){
      s.load.image(profile.asset.key,profile.asset.path);await new Promise((r,j)=>{s.load.once('complete',r);s.load.start();setTimeout(()=>j(Error('Background load timeout')),15000);});
     }
     const src=s.textures.get(profile.asset.key).getSourceImage(),v=a.resolveBackgroundViewport({sourceWidth:src.width,sourceHeight:src.height,frame:profile.frame,fit:profile.fit});
     s.add.image(v.centreX,v.centreY,profile.asset.key).setDisplaySize(v.width,v.height).setDepth(1);
    }
    if(e.stage)await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Stage arrival timeout')),15000);a.showStoryStage(s,{...stage,onArrivalComplete:()=>{clearTimeout(timer);resolve();}});});
    let pages=0;
    if(mode==='dialogue'){
     const d={...e.step,id:'audit-'+item.ch+'-'+item.index,once:false};if(d.type==='PHONE')d.presentation='phone';
     a.playMangaCutscene(s,d,{preview:true,force:true,backgroundStyle:d.backgroundStyle||'wash'});
     await delay(500);
     if(d.type==='MANGA'){
      for(let t=0;t<100&&!s._mangaCutscene?.advance;t++)await delay(50);
      if(!s._mangaCutscene?.advance)throw Error('Manga not ready');
      for(let i=0;i<d.pages.length;i++){
       if(i){s._mangaCutscene.lastAdvanceAt=0;s._mangaCutscene.advance('button');}
       for(let t=0;t<100&&(!s._mangaCutscene.dialogueObjects.length||s._mangaCutscene.dialogueObjects.some(o=>o.alpha<.99));t++)await delay(50);
       if(!s._mangaCutscene.dialogueObjects.length||s._mangaCutscene.dialogueObjects.some(o=>o.alpha<.99))throw Error('Dialogue invisible');
       pages++;
      }
     }
    }
    await delay(120);return {pages};
   },{item,mode});
   const filename=`ch${String(item.ch).padStart(2,'0')}-${String(item.index).padStart(3,'0')}-${device}.jpg`;
   await page.screenshot({path:path.join(out,filename),type:'jpeg',quality:85});
   results.push({...item,device,...detail,file:filename});
  }catch(e){failed=true;results.push({...item,device,error:String(e)});console.error(item,String(e));}
  await fs.writeFile(path.join(out,'results.json'),JSON.stringify({phase,mode,results,errors},null,2));
 }
 await context.close();
}
}finally{await browser.close();server.kill();}
if(failed)process.exitCode=1;
