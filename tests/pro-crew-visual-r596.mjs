import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const ui=readFileSync(new URL('../src/ui/ProCrewBattleLineup.js',import.meta.url),'utf8');

test('R596: official crew header uses pink Open Circuit and a translucent backed car rule',()=>{
  assert.match(ui,/e\.openCircuit===false\?'#48d9ff':'#f06e88'/);
  assert.doesNotMatch(ui,/meetHeader\(54,194,632,35,0x02050b,\.74\)/);
  assert.match(ui,/THREE DISTINCT CREW CARS/);
  assert.match(ui,/ONE FWD \+ ONE RWD \+ ONE AWD/);
});

test('R596: all four main scene buttons share the intermediate 13px Silkscreen sizing',()=>{
  assert.match(ui,/const BUTTON_FONT=13;/);
  assert.match(ui,/text\(x,y,label,BUTTON_FONT/);
  assert.match(ui,/const caption=text\(x,779,label,BUTTON_FONT/);
  assert.match(ui,/crewGlow\(1055,502,235,adviceUsed/);
  assert.match(ui,/footerButton\(974,205,unpaid\?'CANCEL ENTRY':'FORFEIT EVENT'/);
  assert.match(ui,/if\(!locked\)footerButton\(1196,205,'CLEAR LINEUP'/);
  assert.match(ui,/footerButton\(1430,229,invalidCarSetup\?'INELIGIBLE CAR SETUP'/);
  assert.doesNotMatch(ui,/const BUTTON_FONT=16/);
});

test('R596: speech bubble body is two thirds of old width, with one stroked equilateral pointer',()=>{
  assert.match(ui,/const x=427,y=285,w=480,h=136/);
  assert.match(ui,/const triangleBase=36,tipX=edge\+Math\.sqrt\(3\)\*triangleBase\/2/);
  assert.match(ui,/bubble\.fillPoints\(points,true\)/);
  assert.match(ui,/bubble\.strokePoints\(points,true\)/);
  assert.doesNotMatch(ui,/bubble\.strokeTriangle/);
  const base=74,altitude=Math.sqrt(3)*base/2;
  assert.ok(Math.abs(Math.hypot(altitude,base/2)-base)<1e-9,
    'triangle pointer has three sides of equal length');
  assert.equal(427+480+Math.round(altitude),971,
    'speech point is close to Sayaka at x=1056');
  assert.ok(251+136<399,'speech box does not overlap lineup panel');
  assert.match(ui,/if\(spoken\.height>maxHeight\)spoken\.setScale/);
});

test('R596/R597: blue roster borders, red selected states and full shadow-free car previews',()=>{
  assert.match(ui,/rect\(1235,411,596,740,0x061421,\.985,BLUE,250\)/);
  assert.match(ui,/const selectedBorder=assigned>=0\?RED:BLUE/);
  assert.match(ui,/1,selectedBorder,251/);
  assert.match(ui,/1,selectedBorder,254/);
  assert.match(ui,/text\(991,y\+27,String\(assigned\+1\)/);
  assert.match(ui,/fontSize:'21px',fontStyle:'normal'/);
  assert.match(ui,/fontSize:'18px',fontStyle:'normal'/);
  assert.match(ui,/x:1071,y:y\+30,frameWidth:70/);
  assert.match(ui,/const who=text\(1119,y\+1/);
  assert.match(ui,/createCarDisplay\(car,1414,y\+30,145,253/);
  assert.match(ui,/if\(index===2\)\{part\?\.destroy\?\.\(\);return;\}/);
  assert.doesNotMatch(ui,/const crop=mask\(1268,y-4,204,75\)/,
    'roster cars should not be clipped');
  assert.doesNotMatch(ui,/7 TEAM MEMBERS/);
  assert.match(ui,/function assignDriver\(id\)/);
});
