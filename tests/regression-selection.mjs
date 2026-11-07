import test from 'node:test';
import assert from 'node:assert/strict';
import {selectSuites, expandNodeTestFiles, BROWSER_TEST_FILES} from '../scripts/run-regressions.mjs';
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

test('wildcards retain every Node suite and browser entry points remain separately covered', async()=>{
  const {readFileSync,readdirSync}=await import('node:fs');
  const files=['tests/extra.mjs','tests/simulation.test.js',...BROWSER_TEST_FILES];
  assert.deepEqual(expandNodeTestFiles(['tests/*.mjs','tests/*.js'],files),
    ['tests/extra.mjs','tests/simulation.test.js']);
  const workflows=readdirSync('.github/workflows').map(f=>readFileSync('.github/workflows/'+f,'utf8')).join('\n');
  for(const file of BROWSER_TEST_FILES)assert.ok(workflows.includes('node '+file),file+' must have a browser workflow');
});
