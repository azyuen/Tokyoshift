// Browser smoke checks for iPhone/iPad sized viewports.
// Run through .github/workflows/mobile-regression.yml.
// These checks catch boot failures, viewport overflow and persistence across
// a browser reload. Manual race-control verification remains necessary.
import { chromium, devices } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const profiles=[
  {name:'iphone',...devices['iPhone 13']},
  {name:'ipad',...devices['iPad (gen 7)']},
];
await mkdir('artifacts/mobile',{recursive:true});
const browser=await chromium.launch({headless:true});
try {
  for(const profile of profiles){
    const {name,...device}=profile;
    const context=await browser.newContext({...device,serviceWorkers:'block'});
    const page=await context.newPage();
    const failures=[];
    page.on('pageerror',e=>failures.push('uncaught: '+e.message));
    page.on('console',m=>{if(m.type()==='error'&&/SyntaxError|ReferenceError|TypeError|Failed to fetch dynamically imported module/.test(m.text()))failures.push(m.text());});
    await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
    await page.waitForTimeout(14000);
    const before=await page.evaluate(()=>({
      bootError:document.body.innerText.includes('BOOT ERROR'),
      canvas:document.querySelectorAll('canvas').length,
      viewport:document.documentElement.clientWidth,
      scrollWidth:document.documentElement.scrollWidth,
      scene:document.body.dataset.scene||'',
    }));
    await page.screenshot({path:'artifacts/mobile/'+name+'-launch.png',fullPage:true});
    assert.equal(before.bootError,false,name+' must not show boot error');
    assert.ok(before.canvas>0,name+' must render a game canvas');
    assert.ok(before.scrollWidth<=before.viewport+2,name+' must not overflow horizontally');
    // Simulate leaving the PWA and returning. A reload must not break the game.
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForTimeout(14000);
    const after=await page.evaluate(()=>({
      bootError:document.body.innerText.includes('BOOT ERROR'),
      canvas:document.querySelectorAll('canvas').length,
    }));
    await page.screenshot({path:'artifacts/mobile/'+name+'-reload.png',fullPage:true});
    assert.equal(after.bootError,false,name+' reload must not show boot error');
    assert.ok(after.canvas>0,name+' reload must render a game canvas');
    assert.deepEqual(failures,[],name+' browser exceptions');
    console.log(name,JSON.stringify({before,after}));
    await context.close();
  }
}finally{await browser.close();}
