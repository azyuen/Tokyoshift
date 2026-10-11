import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import { ISSUE01_EDITORIAL_PAGE_COUNT, ISSUE01_FEATURE_IDS, ISSUE01_PHOTO_CARS, drawIssue01Page } from '../src/ui/Issue01Pages.js';
import { ISSUE01_ASSETS, ISSUE01_PAGES, ISSUE01_GINZA_CARS } from '../src/data/magazineIssue01.js';
import { cars } from '../src/data/cars.js';
const source = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('twelve contiguous editorial pages include five complete car profiles',()=>{
 assert.equal(ISSUE01_EDITORIAL_PAGE_COUNT,12);
 assert.deepEqual(ISSUE01_PAGES.map(p=>p.number),Array.from({length:12},(_,i)=>i+4));
 assert.deepEqual([...ISSUE01_FEATURE_IDS],['ae86','ef','fc3s','ek9','evo3']);
 for(const p of ISSUE01_PAGES.filter(p=>p.kind==='car')){
  assert(cars[p.carId]);assert(ISSUE01_PHOTO_CARS.includes(p.carId));
  for(const k of ['history','fact','tips','strengths','weaknesses'])assert(p[k].length>20);
 }
 assert.equal(typeof drawIssue01Page,'function');
});
test('owner supplied templates and all champion art are valid nonempty WebP files',()=>{
 assert.equal(ISSUE01_ASSETS.blank.path,'assets/Magazine/blank.webp');
 assert.equal(ISSUE01_ASSETS.featured_car.path,'assets/Magazine/featuredcar_blank.webp');
 assert.equal(ISSUE01_ASSETS.ginza_ad.path,'assets/Magazine/ginza_blank.webp');
 for(const a of Object.values(ISSUE01_ASSETS)){
  assert(existsSync(a.path));const b=readFileSync(a.path);assert(b.length>1000);assert.equal(b.subarray(0,4).toString(),'RIFF');assert.equal(b.subarray(8,12).toString(),'WEBP');
 }
});
test('full Issue 01 is available at opening and precedes the personal archive',()=>{
 const s=source('src/ui/CarHistoryPanel.js');
 assert.match(s,/totalViews = firstArchiveView \+ \(openingChoice \? 0 : featureSpreadCount\)/);
 assert.match(s,/const printedCars = ISSUE01_PHOTO_CARS/);
 assert.match(s,/return buildFeatureSpread\(index - firstArchiveView\)/);
});
test('Ginza pair stays fixed and cannot become an accidental purchase',()=>{
 assert.deepEqual(ISSUE01_GINZA_CARS,['spoonEk9','amuseS2000Gt1']);
 assert(Object.isFrozen(ISSUE01_GINZA_CARS));
 assert.doesNotMatch(source('src/ui/Issue01Pages.js'),/registry|Math\.random|setInteractive/);
});
test('named Mika feature uses public history and replaces placeholder portraits',()=>{
 const copy=JSON.stringify(ISSUE01_PAGES.filter(p=>p.kind==='champion'));
 assert.match(copy,/Mika Hiyase/);assert.match(copy,/street meets/);assert.match(copy,/internationally/);
 assert.doesNotMatch(copy,/Sayaka|father|strategist|Mika Hayase/);
 assert.doesNotMatch(source('src/ui/Issue01Pages.js'),/portrait=|const portrait/);
});
test('guides explain actual clutch scoring, 60 km/h rolling starts and drivetrain tradeoffs',()=>{
 const copy=JSON.stringify(ISSUE01_PAGES.filter(p=>p.kind==='guide'));
 for(const phrase of ['CLEAN IS NOT A MAGIC RPM','60 km/h','TOO LOW @ 60','FWD','RWD','AWD','clutch fully'])assert(copy.includes(phrase),phrase);
});
test('magazine closes safely and respects calibrated car anchors and layer order',()=>{
 const s=source('src/ui/CarHistoryPanel.js');
 assert.match(s,/flipTweens\.splice\(0\)/);assert.match(s,/if \(closed \|\| flipping \|\| confirmation\) return/);
 assert.match(s,/if \(closed\) return;\s+destroyView/);
 assert.match(s,/getReferenceRightX\(car, x, bodyScale\)/);
 assert.match(s,/sort\(\(a, b\) => a.depth - b.depth\)/);
});
