import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import { BACKGROUND_WEBP_ASSETS } from '../src/data/backgroundWebpTable.js';
import {
  resolveBackgroundWebpUrl,installBackgroundWebpLoader,
} from '../src/data/backgroundWebpMap.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const path=p=>root+p;

test('non-background image URLs are never changed',()=>{
  for(const input of [
    'assets/Cars/stock/gdb.png',
    'assets/Characters/Main/pro_daichi_sakamoto.png',
    'assets/Tuning/Parts/whatever.png?v=1',
    'https://images.example.com/hero.png',
    null,
  ])assert.equal(resolveBackgroundWebpUrl(input),input);
});

test('generated WebP map targets existing artwork with no duplicate PNG',()=>{
  for(const [oldPath,newPath] of Object.entries(BACKGROUND_WEBP_ASSETS)){
    assert.match(oldPath,/^assets\/.+\.png$/);
    assert.equal(newPath,oldPath.replace(/\.png$/,'.webp'));
    assert.equal(existsSync(path(newPath)),true,'WebP not committed: '+newPath);
    assert.equal(existsSync(path(oldPath)),false,'original should remain in Git history, not deployed: '+oldPath);
  }
  if(Object.keys(BACKGROUND_WEBP_ASSETS).length){
    const [png,webp]=Object.entries(BACKGROUND_WEBP_ASSETS)[0];
    assert.equal(resolveBackgroundWebpUrl(png),webp);
    assert.equal(resolveBackgroundWebpUrl('./'+png+'?v=day'),'./'+webp+'?v=day');
    assert.equal(resolveBackgroundWebpUrl('https://site.example/Tokyoshift/'+png+'?v=1'),
      'https://site.example/Tokyoshift/'+webp+'?v=1');
  }
});

test('Phaser image loader maps images but keeps texture keys and other parameters',()=>{
  class Loader {}
  Loader.prototype.image=function(key,url,...args){return {key,url,args};};
  const Phaser={Loader:{LoaderPlugin:Loader}};
  installBackgroundWebpLoader(Phaser);
  installBackgroundWebpLoader(Phaser); // idempotent on multiple app boots
  const instance=new Loader();
  const [original,converted]=Object.entries(BACKGROUND_WEBP_ASSETS)[0]||[
    'assets/Cars/stock/gdb.png','assets/Cars/stock/gdb.png'];
  const result=instance.image('champ-key',original+'?phase=day','custom');
  assert.equal(result.key,'champ-key');
  assert.equal(result.url,converted+'?phase=day');
  assert.deepEqual(result.args,['custom']);
  const obj=instance.image({key:'layout',url:original});
  assert.equal(obj.key.key,'layout');
  assert.equal(obj.key.url,converted);
  assert.equal(instance.image('stock','assets/Cars/stock/gdb.png').url,
    'assets/Cars/stock/gdb.png');
});

test('WebP URL redirect is installed before the game starts, with no profile changes',()=>{
  const source=readFileSync(path('src/main.js'),'utf8');
  assert.match(source,/installBackgroundWebpLoader\(Phaser\)/);
  assert.ok(source.indexOf('installBackgroundWebpLoader(Phaser)') <
    source.indexOf('new Phaser.Game(config)'));
  assert.doesNotMatch(source,/clear\(\)|localStorage\.clear/);
});
