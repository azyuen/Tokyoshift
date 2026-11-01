import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cars} from '../src/data/cars.js';
import {getCarDrivetrain, getCarMagazineMeta,normaliseCarDrivetrain} from '../src/data/carMagazine.js';
import {getProDriverDrivetrain, getProfessionalCarEligibility} from '../src/data/proSeason.js';
import {PRO_GARAGE_WORKSHOP, getWorkshopPhaseBackground} from '../src/data/workshopProgression.js';
import {getProGarageBayCars} from '../src/data/proGarage.js';

test('all live cars, collector heroes, LBWK builds and crew loans resolve a legal drivetrain',()=>{
  const missing=Object.keys(cars).filter(id=>!['FWD','RWD','AWD'].includes(getCarDrivetrain(id)));
  assert.deepEqual(missing,[],'Missing drivetrain: '+missing.join(', '));
  for(const id of Object.keys(cars)){
    assert.equal(getCarMagazineMeta(id).drivetrain,getCarDrivetrain(id),id);
    assert.equal(getProDriverDrivetrain(id),getCarDrivetrain(id),id);
  }
});
test('drivetrain aliases, hero models and duplicated owned cars use one consistent class',()=>{
  assert.deepEqual(['FF','FR','4WD','AWD','FWD','RWD'].map(normaliseCarDrivetrain),
    ['FWD','RWD','AWD','AWD','FWD','RWD']);
  for(const [id,drive] of Object.entries({
    s2000:'RWD',minesR34:'AWD',amuseS2000Gt1:'RWD',
    spoonEk9:'FWD',renownMazda787B:'RWD',
    lbwkR32:'AWD',lbwk180sx:'RWD',arkonGinza240z:'RWD',
  }))assert.equal(getCarDrivetrain(id),drive,id);
  // Duplicate instances are registered during profile load and inherit base type.
  assert.equal(getCarDrivetrain('ae86__copy2'),'RWD');
  assert.equal(getCarDrivetrain('s2000__copy2'),'RWD');
});
test('actual professional scrutineering enforces drivetrain and does not pass unknowns',()=>{
  // Headless node test: scrutineering calls the real performance/AI estimator,
  // whose Turbo simulation normally uses Phaser's pure math helpers.
  // Supply only those helpers; production physics and eligibility stay intact.
  const previousPhaser=globalThis.Phaser;
  globalThis.Phaser={
    Math:{
      Clamp:(value,min,max)=>Math.min(max,Math.max(min,value)),
      Linear:(start,end,t)=>start+(end-start)*t,
    },
  };
  try {
  const right=getProfessionalCarEligibility('s2000',{}, {drivetrain:'RWD'});
  const wrong=getProfessionalCarEligibility('s2000',{}, {drivetrain:'AWD'});
  assert.equal(right.eligible,true,right.reasons.join(' / '));
  assert.equal(wrong.eligible,false);
  assert.match(wrong.reasons.join(' / '),/REQUIRES AWD/);
  assert.equal(getCarDrivetrain('car-id-not-in-catalogue'),null);
  } finally {
    globalThis.Phaser=previousPhaser;
  }
});
test('pro garage uses supplied day/night images and maintains 06 behind 05 behind 04',()=>{
  assert.equal(getWorkshopPhaseBackground(PRO_GARAGE_WORKSHOP,'day').path,
    'assets/CentralTokyo/dragcomplex/progarage_day.png');
  assert.equal(getWorkshopPhaseBackground(PRO_GARAGE_WORKSHOP,'night').path,
    'assets/CentralTokyo/dragcomplex/progarage_night.png');
  const garage=readFileSync(new URL('../src/scenes/GarageScene.js',import.meta.url),'utf8');
  assert.match(garage,/for\(const bay of \[\.\.\.bays\]\.reverse\(\)\)/);
  assert.match(garage,/'06':\{[^\n]*depth:4\}/);
  assert.match(garage,/'05':\{[^\n]*depth:8\}/);
  assert.match(garage,/'04':\{[^\n]*depth:12\}/);
  assert.match(garage,/this\.specValueTexts\.drivetrain/);
  assert.match(garage,/'DRIVETRAIN'/);
});
test('open circuit heading and subtitle replace rather than duplicate navigation text',()=>{
  const scene=readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
  assert.match(scene,/isOpen \? 'Open Circuit' : 'PRO SEASON'/);
  assert.match(scene,/Rotating professional events, contributes to ranking\. Start PRO SEASON to qualify for the Tokyo Championship\./);
  assert.doesNotMatch(scene,/ROTATING DRIVER \/ CREW \/ TROPHY EVENTS/);
  assert.equal((scene.match(/Rotating professional events, contributes to ranking\./g)||[]).length,1);
});
