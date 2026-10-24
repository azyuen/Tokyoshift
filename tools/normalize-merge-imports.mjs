// Mechanical merge aid: normalize relative JS URLs on all three index stages.
// Leaves substantive conflicts for explicit review; never selects a side.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import cp from 'node:child_process';
const files=cp.execFileSync('git',['diff','--name-only','--diff-filter=U'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const resolved=[],remaining=[];
for(const file of files){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tokyoshift-merge-'));
 const paths=[2,1,3].map(stage=>{
  const text=cp.execFileSync('git',['show',`:${stage}:${file}`],{encoding:'utf8',maxBuffer:10000000});
  const normalized=text.replace(/(['"])(\.{1,2}\/[^'"\n]*\.js)\?v=[^'"\n]*\1/g,'$1$2$1');
  const dest=path.join(dir,String(stage));fs.writeFileSync(dest,normalized);return dest;
 });
 const r=cp.spawnSync('git',['merge-file','-p','-L','engineering','-L','base','-L','latest-main',...paths],{encoding:'utf8',maxBuffer:10000000});
 if(r.status===null||r.status>127)throw Error(r.stderr);
 fs.writeFileSync(file,r.stdout);
 if(r.status===0){cp.execFileSync('git',['add',file]);resolved.push(file);}else remaining.push(file);
}
console.log(JSON.stringify({resolved,remaining},null,2));
