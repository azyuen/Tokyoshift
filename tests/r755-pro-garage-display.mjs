import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../src/scenes/GarageScene.js',import.meta.url),'utf8');

test('all three Pro Garage cars are twice R754 size and shifted left',()=>{
  const start=source.indexOf('  getProGarageBayPlacement(number){');
  const end=source.indexOf('\n  drawProGarageBayLineup(){',start);
  assert.ok(start>=0&&end>start,'Pro Garage bay placement method found');
  const method=source.slice(start,end);
  const placement=new Function('STAGE',`return ({${method}}).getProGarageBayPlacement;`)
    ({x:24,y:92});
  const before=[
    ['04',316,258,394,12],
    ['05',607,226,383,8],
    ['06',934,198,374,4],
  ];
  const actual=before.map(([bay,x,width,contactY,depth])=>{
    const item=placement(bay);
    assert.ok(item,bay+' placement');
    assert.equal(item.width,width*2,bay+' doubled size');
    assert.ok(item.x<24+x,bay+' shifted left');
    assert.equal(item.contactY,92+contactY,bay+' maintains original tyre contact');
    assert.equal(item.depth,depth,bay+' keeps layer depth');
    return item;
  });
  assert.ok(actual[0].x+actual[0].width/2>actual[1].x-actual[1].width/2,'04 overlaps 05');
  assert.ok(actual[1].x+actual[1].width/2>actual[2].x-actual[2].width/2,'05 overlaps 06');
  assert.match(source,/for\(const bay of \[\.\.\.bays\]\.reverse\(\)\)/);
});

test('Pro Garage hides only workshop car callouts while part selectors are kept',()=>{
  assert.match(source,/buildEngineHotspots\(\)\s*\{[\s\S]*?if \(this\.proGarageMode\) return;/);
  assert.match(source,/buildSecondaryHotspots\(mode\)\s*\{[\s\S]*?if \(this\.proGarageMode\) return;/);
  assert.match(source,/this\.buildEngineHotspots\(\);/);
  assert.match(source,/this\.buildSecondaryHotspots\(mode\);/);
  assert.match(source,/this\.openEnginePartSelector\(partId\)/);
  assert.match(source,/this\.openSecondaryPartSelector\(partId\)/);
  assert.match(source,/this\.createCarDisplay\([\s\S]*?placement\?\.width/);
});

test('Pro Garage bay vehicles sit farther right while the bay signs stay anchored',()=>{
  const start=source.indexOf('  getProGarageBayPlacement(number){');
  const end=source.indexOf('\n  drawProGarageBayLineup(){',start);
  const method=source.slice(start,end);
  const placement=new Function('STAGE',`return ({${method}}).getProGarageBayPlacement;`)
    ({x:24,y:92});
  for(const bay of ['04','05','06']){
    const item=placement(bay);
    assert.equal(item.carX-item.x,60,bay+' rear clears more of the doorway');
    assert.ok(item.width>0&&item.contactY>0,bay+' retains size and tyre contact');
  }
  assert.ok(source.includes('const {x,carX,contactY,width,depth}=config;'));
  assert.ok(source.includes('this.createCarDisplay(cars[bay.carId],carX,y,width,depth)'));
  assert.ok(source.includes('this.add.text(x,top,'),'bay signage remains anchored');
  assert.equal(source.split('placement?.carX??').length-1,2,
    'selected car and visual-mod preview must use the same shifted coordinates');
});
