import test from 'node:test';
import assert from 'node:assert/strict';
import {selectSuites} from '../scripts/run-regressions.mjs';
const suites=[{id:'cars',paths:['assets/Cars/**','src/data/cars.js']},
  {id:'story',paths:['src/story/**']},{id:'always',paths:[]}];
test('changes select matching and unconditional suites',()=>{
  assert.deepEqual(selectSuites(suites,['assets/Cars/Ref2/car.png']).map(x=>x.id),['cars','always']);
  assert.deepEqual(selectSuites(suites,['README.md']).map(x=>x.id),['always']);
});
test('CI changes and manual runs select every suite',()=>{
  assert.deepEqual(selectSuites(suites,['.github/workflows/regressions.yml']),suites);
  assert.deepEqual(selectSuites(suites,null),suites);
});
