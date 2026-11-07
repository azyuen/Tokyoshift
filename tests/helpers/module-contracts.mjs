import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
const root=new URL('../../',import.meta.url);
export function assertVersionedImport(owner, name) {
 const source=readFileSync(new URL(owner,root),'utf8');
 const paths=[...source.matchAll(/['"]([^'"\s]+\.js\?v=[^'"\s]+)['"]/g)].map(m=>m[1]);
 const target=paths.find(p=>p.split('?')[0].endsWith('/'+name+'.js'));
 assert.ok(target,owner+' must reference versioned '+name);
 const deferred=source.includes("makeDeferredScene('"+name+"'");
 const importer=deferred ? 'src/ui/DeferredScene.js' : owner;
 assert.ok(existsSync(new URL(target.split('?')[0],new URL(importer,root))),target+' must resolve');
}
export function assertBuildCacheContract() {
 const read=p=>readFileSync(new URL(p,root),'utf8');
 const {build}=JSON.parse(read('version.json'));
 assert.match(build,/^R\d+$/);
 const main=read('index.html').match(/main\.js\?v=([^'"]+)/)?.[1];
 assert.ok(main?.endsWith('-'+build.toLowerCase()),'HTML entry must match declared build');
 assert.ok(read('sw.js').includes("const BUILD = '"+build+"'"),'worker build must match');
 assert.match(read('sw.js'),/tokyoshift-content-v1-/,'art cache survives code releases');
}
