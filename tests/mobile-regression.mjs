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
    const requests=[];
    const errors=[];
    page.on('requestfailed', req => {
      const message = req.failure()?.errorText || 'request failed';
      requests.push(req.url() + ' => ' + message);
    });
    page.on('response', res => {
      if (res.status() >= 400) requests.push(res.status() + ' ' + res.url());
    });
    page.on('pageerror',e=>{
      const message = 'uncaught: ' + (e.stack || e.message);
      errors.push(message); failures.push(message);
    });
    page.on('console',m=>{
      if(m.type()==='error'){
        errors.push('console: '+m.text());
        if(/SyntaxError|ReferenceError|TypeError|Failed to fetch dynamically imported module/.test(m.text()))failures.push(m.text());
      }
    });
    await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
    await page.waitForTimeout(14000);
    const before=await page.evaluate(()=>({
      bootError:document.body.innerText.includes('BOOT ERROR'),
      canvas:document.querySelectorAll('canvas').length,
      viewport:document.documentElement.clientWidth,
      scrollWidth:document.documentElement.scrollWidth,
      scene:document.body.dataset.scene||'',
      label:document.getElementById('loading-label')?.textContent,
      percent:document.getElementById('loading-percent')?.textContent,
      diagnostic:document.getElementById('loading-screen')?.getAttribute('data-boot-error')||'',
      phaser:typeof window.Phaser,
      game:typeof window.TOKYO_SHIFT,
      mainScripts:[...document.scripts].map(s=>({src:s.src,type:s.type})),
      navigation:performance.getEntriesByType('resource').filter(x=>/phaser|main\.js|jsdelivr|unpkg/.test(x.name)).map(x=>({name:x.name,duration:Math.round(x.duration),size:x.transferSize})),
    }));
    await page.screenshot({path:'artifacts/mobile/'+name+'-launch.png',fullPage:true});
    console.log('[MOBILE STARTUP DIAGNOSTICS]',JSON.stringify({name,before,requests:requests.slice(0,35),errors:errors.slice(0,25)}));
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
