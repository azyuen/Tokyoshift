// One-time, deterministic transplant of the tested E005 engineering physics
// and skilled-human AI into production without porting preview UI, story,
// touch-control changes, economics or saved-state logic.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const RELEASE='20261026-r687';
const COPY=[
  'ai/DragRacingAI.js',
  'data/cars.js',
  'data/engines.js',
  'data/endgameHeroCalibration.js',
  'data/stockClasses.js',
  'data/tuningPotential.js',
  'data/vehicleEngineering.js',
  'data/tuning.js',
  'data/secondaryTuning.js',
  'data/stage3Calibration.js',
  'vehicles/Engine.js',
  'vehicles/Transmission.js',
  'vehicles/VehiclePerformance.js',
  'vehicles/PerformanceEstimate.js',
];
const MODULES=new Set([
  ...COPY,
  'ai/DrivingModel.js',
  'vehicles/Vehicle.js',
]);
const read=x=>fs.readFileSync(x,'utf8');
const save=(p,s)=>{if(!fs.existsSync(p)||read(p)!==s)fs.writeFileSync(p,s);};
for(const name of COPY){
  let s=read(path.join('engineering-preview','src',name));
  if(name==='data/endgameHeroCalibration.js'){
    s=s.replace('// Engineering preview ONLY. Fictional Tokyo SHIFT endgame specifications.',
      '// Fictional Tokyo SHIFT endgame specifications on the shared production physics.');
    s=s.replace('// Production cars are not changed.','// Only the intended sealed collector cars are calibrated.');
  }
  save(path.join('src',name),s);
}
// In an ES module, cars.js?v=old and cars.js?v=new are DIFFERENT module
// instances. Uniform versions here are vital: hero calibration mutates engine
// curves, so cars.js and engines.js MUST refer to the same shared instance.
let touched=[];
function walk(dir){
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,ent.name);
  if(ent.isDirectory())walk(file);
  else if(ent.name.endsWith('.js')){
   const original=read(file);
   const contents=original.replace(/(from\\s*['"]|import\\s*\\(\\s*['"])([^'"]+\\.js)(?:\\?[^'"]*)?(['"])/g,(all,a,spec,close)=>{
     const absolute=path.resolve(path.dirname(file),spec);
     const relative=path.relative(path.resolve('src'),absolute).split(path.sep).join('/');
     if(!MODULES.has(relative)) return all;
     return a+spec+'?v='+RELEASE+close;
   });
   if(contents!==original){save(file,contents);touched.push(file);}
  }
 }
}
walk('src');

// Force a fresh scene graph for the production app while preserving EXACT
// same scene classes and behaviour. Version reconciliation clears old caches.
const mainPath='src/main.js',main=read(mainPath);
const newMain=main.replace(/(loadScene\\([^\\n]*?['"]\\.\\/scenes\\/[^'"]+\\.js)\\?v=[^'"]+(?=['"])/g,'$1?v='+RELEASE);
assert.ok(newMain.includes('scenes/RaceScene.js?v='+RELEASE),'race scene cache revision');
save(mainPath,newMain);

let html=read('index.html');
assert.ok(/id="build-stamp">R686<\\/div>/.test(html)||html.includes('id="build-stamp">R687</div>'),'known prior production build');
html=html.replace('id="build-stamp">R686</div>','id="build-stamp">R687</div>')
 .replace(/src\\/main\\.js\\?v=20261025-r686/g,'src/main.js?v='+RELEASE);
assert.ok(html.includes("import('./src/main.js?v="+RELEASE+"')"),'revision entry point');
save('index.html',html);
let sw=read('sw.js').replace(/R686/g,'R687').replace(/r686/g,'r687');
save('sw.js',sw);
const version=JSON.parse(read('version.json'));
version.build='R687';version.stamp='2026-10-26T19:23:00+11:00';
save('version.json',JSON.stringify(version,null,2)+'\\n');

assert.ok(!touched.includes('src/input/TouchControls.js'),'touch controls must remain untouched');
console.log('R687_PORT_COMPLETE '+JSON.stringify({copied:COPY.length,importOnlyFiles:touched.length,importOnly:touched}));
