// Real service-worker check using mobile-sized Chromium/WebKit contexts.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { chromium, webkit } from 'playwright';
const root = resolve(import.meta.dirname, '..');
const baseline = readFileSync(resolve(root, 'tests/fixtures/loading-cache-before.js'), 'utf8');
const manifest = readFileSync(resolve(root,'asset-manifest.js'),'utf8');
const revisions = JSON.parse(manifest.slice(manifest.indexOf('=')+1).trim().replace(/;$/, ''));
const asset = Object.keys(revisions).find(path=>path.startsWith('assets/Cars/') && path.endsWith('.png'));
const assetBytes = readFileSync(resolve(root,asset)).length;
const requests = {baseline:0,candidate:0};
const server = createServer((req,res)=>{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const [, variant, ...parts]=path.split('/');
  const relative=parts.join('/');
  if (!['baseline','candidate'].includes(variant) || relative.includes('..')) {res.writeHead(404).end();return;}
  if(relative==='probe.html') {res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Cache probe</title>');return;}
  try {
    const bytes=relative==='sw.js' && variant==='baseline' ? baseline : readFileSync(resolve(root,relative));
    if(relative===asset) requests[variant]++;
    res.setHeader('Cache-Control','no-cache');
    res.setHeader('Content-Type',extname(relative)==='.js'?'application/javascript':extname(relative)==='.png'?'image/png':'application/octet-stream');
    res.end(bytes);
  } catch {res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
try {
  for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]) {
    const browser=await engine.launch();
    try {
      for(const variant of ['baseline','candidate']) {
        requests[variant]=0;
        const context=await browser.newContext({viewport:{width:844,height:390}});
        const page=await context.newPage();
        await page.goto(`${origin}/${variant}/probe.html`);
        await page.evaluate(async()=>{
          await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
          await navigator.serviceWorker.ready;
          if(!navigator.serviceWorker.controller) await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
        });
        const download=()=>page.evaluate(async path=>(await (await fetch('./'+path)).arrayBuffer()).byteLength,asset);
        assert.equal(await download(),assetBytes);
        assert.equal(await download(),assetBytes);
        assert.equal(requests[variant],variant==='baseline'?2:1);
        if(variant==='candidate') {
          await page.reload();
          assert.equal(await download(),assetBytes);
          assert.equal(requests.candidate,1);
          await context.setOffline(true);
          assert.equal(await download(),assetBytes);
          assert.equal(requests.candidate,1);
        }
        console.log(JSON.stringify({engine:name,variant,asset,assetBytes,networkRequests:requests[variant],networkBytes:requests[variant]*assetBytes}));
        await context.close();
      }
    } finally {await browser.close();}
  }
} finally {server.close();}
