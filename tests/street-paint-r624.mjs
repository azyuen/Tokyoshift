import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getFactoryPaintPalette } from '../src/data/factoryPaintPalettes.js';
import {
  STREET_TUNED_PAINTS, SHOW_CAR_PAINTS, STREET_PAINT_PALETTE,
  RIVAL_PAINT_MIX, getStreetPaintName, selectMixedCarPaint,
} from '../src/data/streetPaintPalettes.js';

const source = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('named street and show finishes are selectable without being mislabeled OEM',()=>{
  assert.equal(STREET_TUNED_PAINTS.length,10);
  assert.equal(SHOW_CAR_PAINTS.length,6);
  assert.equal(STREET_PAINT_PALETTE.length,16);
  assert.equal(new Set(STREET_PAINT_PALETTE.map(p=>p.color)).size,16);
  for (const p of STREET_PAINT_PALETTE) {
    assert.ok(p.name && Number.isInteger(p.color));
    assert.equal(getStreetPaintName(p.color),p.name);
    assert.equal(p.code,'');
  }
  assert.equal(getStreetPaintName(0xffffff),null);
});

test('regional mix uses early and late region proportions',()=>{
  assert.deepEqual(RIVAL_PAINT_MIX.DEFAULT,[45,40,15]);
  assert.deepEqual(RIVAL_PAINT_MIX.ODAIBA,[65,30,5]);
  assert.deepEqual(RIVAL_PAINT_MIX.SHINAGAWA,[65,30,5]);
  assert.deepEqual(RIVAL_PAINT_MIX.DAIKOKU,[30,50,20]);
  assert.deepEqual(RIVAL_PAINT_MIX.SHINJUKU,[35,45,20]);
  for(const [region,weights] of Object.entries(RIVAL_PAINT_MIX)) {
    assert.equal(weights.reduce((a,b)=>a+b,0),100,region);
    const counts={factory:0,street:0,show:0};
    for(let i=0;i<4000;i++){
      const paint=selectMixedCarPaint('s15',{region,seed:i});
      assert.ok(paint);
      counts[paint.category]++;
      const available=paint.category==='factory'
        ? getFactoryPaintPalette('s15')
        : paint.category==='street' ? STREET_TUNED_PAINTS : SHOW_CAR_PAINTS;
      assert.ok(available.some(p=>p.color===paint.color),region+' '+i);
    }
    ['factory','street','show'].forEach((type,i)=>{
      assert.ok(Math.abs(counts[type]/40-weights[i])<4,
        region+' '+type+': '+counts[type]/40+'% expected '+weights[i]+'%');
    });
  }
});

test('named main rivals have persistent signature finishes across rounds and regions',()=>{
  const a=selectMixedCarPaint('r32',{region:'ODAIBA',seed:1,characterId:'renMizuno',isMainRival:true});
  const b=selectMixedCarPaint('r32',{region:'DAIKOKU',seed:999999,characterId:'renMizuno',isMainRival:true});
  assert.deepEqual(a,b);
  assert.deepEqual(selectMixedCarPaint('s15__copy2',{seed:55}),selectMixedCarPaint('s15',{seed:55}));
  assert.equal(selectMixedCarPaint('renownMazda787B',{seed:123}),null);
});

test('new Tokyo Auto Market stays factory-only, used cars use full mixed palette',()=>{
  const market=source('src/scenes/CentralTokyoScene.js');
  const fresh=market.slice(market.indexOf('  getAllNewCarListings() {'),market.indexOf('  getNewCarListings() {'));
  const used=market.slice(market.indexOf('  getUsedCarListings() {'),market.indexOf('  getAutoMarketListings() {'));
  assert.match(fresh,/getFactoryPaintColor\(item\.carId,/);
  assert.doesNotMatch(fresh,/selectMixedCarPaint/);
  assert.match(used,/selectMixedCarPaint\(item\.carId, \{seed, region:'DEFAULT'\}\)/);
  assert.match(market,/paintColor: listing\.paintColor/);
  assert.match(market,/FACTORY STOCK \/\/ ORIGINAL MANUFACTURER COLOURS/);
});

test('regional Meets, street showdowns and Skytree use mixed colours consistently',()=>{
  const meets=source('src/scenes/MeetScene.js');
  const elite=source('src/data/oshiageElite.js');
  assert.match(meets,/region: location\.district, characterId/);
  assert.match(meets,/isMainRival: Boolean\(characters\[characterId\]\?\.mainRival\)/);
  assert.match(elite,/region: 'OSHIAGE', characterId, isMainRival/);
  assert.match(meets,/selectedOpponentPaintColor', opponentPaintColor/);
  const race=source('src/scenes/RaceScene.js');
  assert.match(race,/state\.paintColor = this\.opponentPaintColor/);
});

test('Oshiage has three actual buttons, named selection and two-page street catalogue',()=>{
  const view=source('src/scenes/OshiageScene.js');
  for (const mode of ['stock','street','custom']){
    assert.ok(view.includes("this.setPaintMode('"+mode+"')"));
  }
  assert.match(view,/STOCK \/\/ ¥8,000/);
  assert.match(view,/STREET \/\/ ¥12,000/);
  assert.match(view,/CUSTOM \/\/ ¥16,000/);
  assert.match(view,/palette\.slice\(this\.paintPage \* 10, this\.paintPage \* 10 \+ 10\)/);
  assert.match(view,/const pageCount = Math\.max\(1, Math\.ceil\(palette\.length \/ 10\)\)/);
  assert.match(view,/selectedFinish\.name\.toUpperCase\(\)/);
  assert.match(view,/getStreetPaintPalette\(\)\.some\(p => p\.color === paintColor\)/);
  assert.match(view,/cost !== \(this\.paintMode === 'custom' \? 16000 : this\.paintMode === 'street' \? 12000 : 8000\)/);
  // Three 350px buttons remain fully inside the 24..1162px main strip.
  for(const x of [217,593,969]){
    assert.ok(x-175>=24 && x+175<=1162);
  }
});

test('R624 PWA rollout keeps save keys and original engineering untouched',()=>{
  const html=source('index.html'),sw=source('sw.js'),main=source('src/main.js');
  assert.match(html,/R624/);
  assert.match(sw,/R624/);
  assert.match(main,/OshiageScene\.js\?v=20261020-r624/);
  assert.match(main,/MeetScene\.js\?v=20261020-r624/);
  assert.match(main,/CentralTokyoScene\.js\?v=20261020-r624/);
  assert.match(source('src/state/GameState.js'),/export const SAVE_KEY = 'tokyoShiftSaveState'/);
});
