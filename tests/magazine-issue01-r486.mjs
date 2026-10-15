import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import { ISSUE01_EDITORIAL_PAGE_COUNT, ISSUE01_FEATURE_IDS, ISSUE01_PHOTO_CARS, drawIssue01Page } from '../src/ui/Issue01Pages.js';
import { ISSUE01_ASSETS, ISSUE01_PAGES, ISSUE01_CONTENTS, ISSUE01_GINZA_CARS } from '../src/data/magazineIssue01.js';
import { cars } from '../src/data/cars.js';
const source = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('twelve contiguous editorial pages include five complete car profiles',()=>{
 assert.equal(ISSUE01_EDITORIAL_PAGE_COUNT,12);
 assert.deepEqual(ISSUE01_PAGES.map(p=>p.number),Array.from({length:12},(_,i)=>i+4));
 assert.deepEqual([...ISSUE01_FEATURE_IDS],['ae86','ef','fc3s','ek9','galant']);
 for(const p of ISSUE01_PAGES.filter(p=>p.kind==='car')){
  assert(cars[p.carId]);assert(ISSUE01_PHOTO_CARS.includes(p.carId));
  for(const k of ['history','fact','tips','strengths','weaknesses'])assert(p[k].length>20);
 }
 assert.equal(typeof drawIssue01Page,'function');
});
test('owner supplied templates and used champion art are valid nonempty WebP files',()=>{
 assert.equal(ISSUE01_ASSETS.blank.path,'assets/Magazine/blank.webp');
 assert.equal(ISSUE01_ASSETS.contents.path,'assets/Magazine/contents.webp');
 assert.equal(ISSUE01_ASSETS.champion_02,undefined);
 assert.equal(ISSUE01_ASSETS.featured_car.path,'assets/Magazine/featuredcar_01.webp');
 assert.equal(ISSUE01_ASSETS.ginza_ad.path,'assets/Magazine/ginza_blank.webp');
 for(const a of Object.values(ISSUE01_ASSETS)){
  assert(existsSync(a.path));const b=readFileSync(a.path);assert(b.length>1000);assert.equal(b.subarray(0,4).toString(),'RIFF');assert.equal(b.subarray(8,12).toString(),'WEBP');
 }
});
test('Issue 01 ends on page 15 and does not append Street File archive pages',()=>{
 const s=source('src/ui/CarHistoryPanel.js');
 assert.match(s,/const totalViews = 2 \+ editorialSpreads/);
 assert.match(s,/const printedCars = ISSUE01_PHOTO_CARS/);
 assert.doesNotMatch(s,/firstArchiveView|buildFeatureSpread|folio\.setText|buildMagazineFeatures/);
 assert.match(s,/const PAGE_H = 792/);
 for(const symbol of ["'X'","'<'","'>'"])assert(s.includes(symbol),symbol);
});

test('contents uses the commissioned artwork and editorial-only page numbers',()=>{
 assert.deepEqual(ISSUE01_CONTENTS,[
  ['04','FEATURE: MIKA HIYASE'],
  ['08','RACE SCHOOL'],
  ['11','FIVE CARS TO KNOW'],
 ]);
 assert(!JSON.stringify(ISSUE01_CONTENTS).includes('GINZA'));
 const s=source('src/ui/Issue01Pages.js');
 assert.match(s,/art:'contents'/);
 assert.match(s,/kind==='contents'/);
});
test('Mika page 04 carries the former page 05 quote and page 05 is a two-column blank article',()=>{
 const first=ISSUE01_PAGES.find(p=>p.number===4);
 const second=ISSUE01_PAGES.find(p=>p.number===5);
 assert.equal(first.title,'THE PRICE OF SPEED');
 assert.equal(first.quote,'“My name is on the trophy. It took all of us.”');
 assert.equal(second.kind,'article');
 assert.equal(second.art,'blank');
 assert.equal(second.columns.length,2);
 assert(second.columns.every(column=>column.length===2 && column.join(' ').length>250));
 assert(second.columns.flat().join(' ').includes('parts counter'));
 assert(second.columns.flat().join(' ').includes('international racing'));
 const s=source('src/ui/Issue01Pages.js');
 assert.match(s,/fontStyle:'bold italic'/);
 assert.match(s,/fontSize:17\.5\*S/);
 assert.match(s,/fontSize\)>15\.5\*S/);
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
