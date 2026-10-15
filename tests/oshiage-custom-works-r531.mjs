import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts/oshiage-r531', {recursive:true});
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:1560,height:840},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',err=>errors.push(err.stack||err.message));
  page.on('response',response=>{
    if(response.status()>=400 && /Oshiage|oshiage/.test(response.url()))
      errors.push(response.status()+' '+response.url());
  });
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.TOKYO_SHIFT?.scene?.scenes?.length &&
    document.querySelector('canvas')),null,{timeout:30000});
  await page.evaluate(()=>{
    const game=window.TOKYO_SHIFT, registry=game.registry;
    registry.set('devMode',true);
    registry.set('wins',140);
    registry.set('cash',1000000);
    registry.set('garageTier',2);
    registry.set('ownedCarIds',['ae86']);
    registry.set('selectedCarId','ae86');
    registry.set('preferredCarId','ae86');
    registry.set('crewSpaceActive',false);
    registry.set('crewBattleState',null);
    registry.set('oshiageEliteSeries',null);
    registry.set('carStates',{ae86:{paintColor:0xd94f53}});
    for(const s of game.scene.scenes) if(s.sys.isActive()) game.scene.stop(s.sys.settings.key);
    game.scene.start('OshiageScene',{locationId:'oshiageCustomWorks'});
  });
  const ready=()=>page.evaluate(()=>{
    const s=window.TOKYO_SHIFT.scene.getScene('OshiageScene');
    return {ready:s.sys.isActive(),room:s.room,assets:s.content?.length||0,
      selected:s.selectedCar()?.id,errors:[]};
  });
  await page.waitForFunction(()=>{
    const s=window.TOKYO_SHIFT?.scene?.getScene('OshiageScene');
    return s?.sys.isActive() && s.activeLocationId==='oshiageCustomWorks' &&
      s.room==='outside' && s.content?.length>0;
  },null,{timeout:30000});
  assert.equal((await ready()).selected,'ae86');
  await page.screenshot({path:'artifacts/oshiage-r531/custom-works.png'});
  await page.evaluate(()=>window.TOKYO_SHIFT.scene.getScene('OshiageScene').openCustomWorksRoom('paint'));
  await page.waitForFunction(()=>{
    const s=window.TOKYO_SHIFT.scene.getScene('OshiageScene');
    return s.room==='paint' && s.paintObjects?.length>0;
  },null,{timeout:30000});
  await page.evaluate(()=>window.TOKYO_SHIFT.scene.getScene('OshiageScene').setPaintMode('custom'));
  await page.waitForFunction(()=>window.TOKYO_SHIFT.scene.getScene('OshiageScene')
    .textures.exists('oshiageColourSquareR531'),null,{timeout:10000});
  const before=await page.evaluate(()=>window.TOKYO_SHIFT.scene.getScene('OshiageScene').pendingPaint);
  await page.screenshot({path:'artifacts/oshiage-r531/paint-picker.png'});
  await page.mouse.click(1374,402);
  const after=await page.evaluate(()=>window.TOKYO_SHIFT.scene.getScene('OshiageScene').pendingPaint);
  assert.notEqual(after,before,'colour square tap must adjust live preview');
  await page.mouse.click(1420,503);
  const hue=await page.evaluate(()=>window.TOKYO_SHIFT.scene.getScene('OshiageScene').paintPickerHue);
  assert(hue>0&&hue<360,'hue strip changes paint hue');
  await page.screenshot({path:'artifacts/oshiage-r531/paint-selected.png'});
  await page.evaluate(()=>{
    const s=window.TOKYO_SHIFT.scene.getScene('OshiageScene');
    s.returnToCustomWorks();
  });
  await page.waitForFunction(()=>window.TOKYO_SHIFT.scene.getScene('OshiageScene').room==='outside',
    null,{timeout:30000});
  await page.evaluate(()=>window.TOKYO_SHIFT.scene.getScene('OshiageScene').openCustomWorksRoom('rims'));
  await page.waitForFunction(()=>{
    const s=window.TOKYO_SHIFT.scene.getScene('OshiageScene');
    return s.room==='rims' && s.textures.exists(s.backgroundAsset().key) &&
      s.content?.length>5;
  },null,{timeout:30000});
  const wall=await page.evaluate(()=>window.TOKYO_SHIFT.scene.getScene('OshiageScene').rimWallRect());
  assert.equal(wall.x,24);assert.equal(wall.y,92);assert.equal(wall.width,1138);
  await page.screenshot({path:'artifacts/oshiage-r531/rim-wall.png'});
  await page.evaluate(()=>window.TOKYO_SHIFT.scene.getScene('OshiageScene').selectRim(0));
  await page.waitForFunction(()=>window.TOKYO_SHIFT.scene.getScene('OshiageScene').rimPreview,
    null,{timeout:10000});
  await page.screenshot({path:'artifacts/oshiage-r531/rim-preview.png'});
  assert.deepEqual(errors,[]);
  console.log('OSHIAGE R531 INTERACTIVE SMOKE PASS',JSON.stringify({before,after,hue,wall}));
} finally {await browser.close();}
