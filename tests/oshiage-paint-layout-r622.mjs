import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/scenes/OshiageScene.js',import.meta.url),'utf8');
const layout = readFileSync(new URL('../src/ui/ShowdownLayout.js',import.meta.url),'utf8');
const main = readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const draw = source.slice(source.indexOf('  drawPaintStudio() {'),source.indexOf('  setPaintMode('));
const apply = source.slice(source.indexOf('  applyPaint(carId, color, cost) {'),source.indexOf('  openMap() {'));
const render = source.slice(source.indexOf('  renderView() {'),source.indexOf('  sideHeader('));

test('paint studio car moves nine pixels down, retaining x/width, with other cars untouched',()=>{
  assert.match(draw,/this\.paintObjects = this\.drawOwnedCar\(\s*car, state, 609, 419, 483, this\.pendingPaint/);
  assert.match(source,/this\.rimCarObjects = this\.drawOwnedCar\(/);
  assert.match(source,/this\.schoolCarObjects = this\.drawOwnedCar\(car, state, 621, 430, 558/);
});

test('spray moves left and down; previous R621 tint, particle count and opacity stay',()=>{
  assert.match(apply,/const x = 230 \+ Phaser\.Math\.Between\(0, 630\)/);
  assert.match(apply,/const y = 298 \+ Phaser\.Math\.Between\(0, 155\)/);
  assert.match(apply,/const sprayShade = rgbToPaintColor/);
  assert.match(apply,/for \(let i = 0; i < 46; i\+\+\)/);
  assert.match(apply,/sprayShade, 0\.49/);
  assert.match(apply,/\.setMask\(this\.stageMask\)\.setDepth\(24\)/);
});

test('completion notice is entirely inside stage and not on lower strip',()=>{
  assert.match(apply,/const noticeX = STAGE\.x \+ 236/);
  assert.match(apply,/const noticeY = STAGE\.y \+ STAGE\.h - 38/);
  assert.match(apply,/this\.add\.rectangle\(noticeX, noticeY, 414, 44, 0x061a21, 0\.87\)/);
  assert.match(apply,/this\.addText\(noticeX, noticeY, 'PAINT COMPLETE \/\/ '/);
  assert.match(apply,/\.setOrigin\(0\.5\)/);
  assert.doesNotMatch(apply,/this\.addText\(405, 652, 'PAINT COMPLETE/);
  const stage = layout.match(/SHOWDOWN_STAGE = Object\.freeze\(\{ x: (\d+), y: (\d+), w: (\d+), h: (\d+) \}\)/);
  const strip = layout.match(/SHOWDOWN_STRIP = Object\.freeze\(\{ x: (\d+), y: (\d+), w: (\d+), h: (\d+) \}\)/);
  assert.ok(stage && strip);
  const [sx,sy,sw,sh] = stage.slice(1).map(Number);
  const stripY=Number(strip[2]);
  const x=sx+236,y=sy+sh-38,width=414,height=44;
  assert.ok(x-width/2 >= sx,'left edge contained in stage');
  assert.ok(x+width/2 <= sx+sw,'right edge contained in stage');
  assert.ok(y-height/2 >= sy,'top edge contained in stage');
  assert.ok(y+height/2 <= sy+sh,'bottom edge contained in stage');
  assert.ok(y+height/2 < stripY,'never overlaps lower text strip');
});

test('existing background nudge and paint transaction remain untouched',()=>{
  assert.match(render,/paintBackdropYOffset = this\.room === 'paint' \? 28 : 0/);
  assert.match(apply,/this\.registry\.set\('carStates'/);
  assert.match(apply,/this\.registry\.set\('cash', cash - cost\)/);
  assert.match(apply,/saveSessionState\(this\.registry\)/);
  assert.match(apply,/setCarBodyPaint\(this\.paintObjects, paintColor\)/);
  assert.match(main,/OshiageScene\.js\?v=20261020-r62[234]/);
});
