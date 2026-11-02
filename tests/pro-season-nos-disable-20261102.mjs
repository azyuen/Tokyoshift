import test from 'node:test';
import assert from 'node:assert/strict';
import {getProfessionalCarEligibility} from '../src/data/proSeason.js';

test('manual NOS off allows fitted NOS at no-NOS scrutineering',()=>{
  const fitted={nosInstalled:true,nosShots:3,nosEnabled:false};
  const enabled={...fitted,nosEnabled:true};
  const rules={noNos:true};
  const off=getProfessionalCarEligibility('ef',fitted,rules);
  const on=getProfessionalCarEligibility('ef',enabled,rules);
  assert.ok(!off.reasons.some(reason=>reason.includes('NOS')),JSON.stringify(off.reasons));
  assert.ok(on.reasons.some(reason=>reason.includes('NOS')));
  assert.equal(fitted.nosEnabled,false,'scrutineering must not change the car');
});

test('shot caps inspect enabled capacity without automatically reducing it',()=>{
  const fitted={nosInstalled:true,nosShots:3,nosEnabled:true};
  const over=getProfessionalCarEligibility('ef',fitted,{maxNosShots:1});
  assert.ok(over.reasons.some(reason=>reason.includes('NOS LIMIT')));
  const disabled=getProfessionalCarEligibility('ef',{...fitted,nosEnabled:false},{maxNosShots:1});
  assert.ok(!disabled.reasons.some(reason=>reason.includes('NOS LIMIT')));
  assert.equal(fitted.nosShots,3);
});
