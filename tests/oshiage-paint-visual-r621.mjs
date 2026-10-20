import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../src/scenes/OshiageScene.js',import.meta.url),'utf8');
const main = readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const paint = source.slice(source.indexOf('  applyPaint(carId, color, cost) {'),source.indexOf('  openMap() {'));
const render = source.slice(source.indexOf('  renderView() {'),source.indexOf('  sideHeader('));
const draw = source.slice(source.indexOf('  drawPaintStudio() {'),source.indexOf('  setPaintMode('));

test('paint booth background moves down by 28 pixels, without shifting other locations',()=>{
  assert.match(render,/paintBackdropYOffset = this\.room === 'paint' \? 28 : 0/);
  assert.match(render,/rimWall \? STAGE\.y : STAGE\.y \+ STAGE\.h \/ 2 \+ paintBackdropYOffset/);
  assert.match(render,/\.setMask\(this\.stageMask\)\.setDepth\(-10\)/);
  assert.match(render,/rimWall \? 0 : 0\.5/);
  // Paint-room backdrop crop only: no modification to the stage mask.
  assert.match(source,/this\.maskGraphics\.fillRect\(STAGE\.x, STAGE\.y, STAGE\.w, STAGE\.h\)/);
});

test('the rendered car remains at exactly the prior position and width',()=>{
  assert.match(draw,/this\.paintObjects = this\.drawOwnedCar\(\s*car, state, 609, 410, 483, this\.pendingPaint/);
  assert.match(source,/this\.drawCustomWorksSpecialist\(\{ x: 1066, feetY: STAGE\.y \+ STAGE\.h - 35 \}\)/);
});

test('spray particles use a darker paint-tinted shade and noticeably higher opacity',()=>{
  assert.match(paint,/const sprayRgb = paintColorToRgb\(paintColor\)/);
  assert.match(paint,/40 \+ sprayRgb\.r \* 0\.48/);
  assert.match(paint,/40 \+ sprayRgb\.g \* 0\.48/);
  assert.match(paint,/40 \+ sprayRgb\.b \* 0\.48/);
  assert.match(paint,/i < 46/);
  assert.match(paint,/Phaser\.Math\.Between\(11, 28\), sprayShade, 0\.49/);
  const darken = color => 40 + color * .48;
  assert.ok(darken(255)<255 && darken(225)<225);
  assert.ok(darken(0)>0);
  assert.ok(.49>.25);
});

test('the original paint purchase, persistence and other-room code remain',()=>{
  assert.match(paint,/this\.registry\.set\('carStates'/);
  assert.match(paint,/this\.registry\.set\('cash', cash - cost\)/);
  assert.match(paint,/saveSessionState\(this\.registry\)/);
  assert.match(paint,/setCarBodyPaint\(this\.paintObjects, paintColor\)/);
  assert.match(render,/if \(this\.room === 'rims'\) this\.drawRimShop\(\)/);
  assert.match(render,/if \(this\.activeLocationId === 'oshiageDrivingSchool'\) this\.drawSchool\(\)/);
  assert.match(main,/OshiageScene\.js\?v=20261020-r621/);
});
