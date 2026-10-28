import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {carOrder} from '../src/data/cars.js';
import {CAR_COUPON_REQUIREMENTS} from '../src/data/centralTokyo.js';
import {TRAVEL_REGIONS} from '../src/data/travelRegions.js';
import {createDefaultGameState} from '../src/state/GameState.js';
import {getOwnedCouponEntries} from '../src/ui/OfficeCouponHuntPanel.js';
import {createStreetShowdownRounds,STREET_SHOWDOWN_CASH_ENTRY_FEES,
  getStreetShowdownCouponEntryFee} from '../src/data/streetShowdowns.js';
import {STREET_SHOWDOWN_COUPON_CHANCE,rollStreetShowdownCouponPrize,
  getStreetShowdownCouponPool,getStreetShowdownCouponHunts} from '../src/data/streetShowdownCouponHunt.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const registry=data=>({get:key=>data[key],set:(key,v)=>{data[key]=v;}});
const REGIONS=['ODAIBA','SHINAGAWA','TATSUMI','SHIBUYA','YOKOHAMA','DAIKOKU','SHINJUKU'];

test('60% per newly generated offer, with fixed threshold and unchanged entry price bands',()=>{
  assert.equal(STREET_SHOWDOWN_COUPON_CHANCE,0.60);
  assert.equal(rollStreetShowdownCouponPrize(()=>0),true);
  assert.equal(rollStreetShowdownCouponPrize(()=>0.599999),true);
  assert.equal(rollStreetShowdownCouponPrize(()=>0.60),false);
  assert.equal(rollStreetShowdownCouponPrize(()=>0.99),false);
  assert.deepEqual(STREET_SHOWDOWN_CASH_ENTRY_FEES,
    {EASY:10000,MED:18000,HARD:30000,ELITE:40000});
  assert.equal(getStreetShowdownCouponEntryFee(2000000,5),35000);
  const meet=read('src/scenes/MeetScene.js');
  assert.match(meet,/rollStreetShowdownCouponPrize/);
  assert.match(meet,/getStreetShowdownCouponPool\(this.selectedMeetLocation\)/);
  assert.match(meet,/couponCarPool/);
  assert.match(meet,/R716-60pct-regional-coupons/);
  assert.match(meet,/getStreetShowdownCouponEntryFee\(carValue, couponRequirement\)/);
  assert.match(read('src/scenes/RaceScene.js'),/couponCount = Math.max\(0, Number\(coupons\[prizeCouponCarId\] \|\| 0\)\) \+ 1/);
});

test('all Street Showdown coupon models have real hunt locations',()=>{
  const all=new Set();
  for(const regionId of REGIONS){
    const region=TRAVEL_REGIONS[regionId];
    for(const loc of region.locations){
      const pool=getStreetShowdownCouponPool(loc.id);
      assert.ok(pool.length>=3,regionId+':'+loc.id+' has no coupon pool');
      for(const model of pool)all.add(model);
    }
  }
  for(const id of Object.keys(CAR_COUPON_REQUIREMENTS))
    assert.ok(all.has(id),'redemption coupon car not huntable: '+id);
  for(const id of carOrder)
    assert.ok(all.has(id),'stock car not eligible for any Street Showdown coupon: '+id);
  assert.ok(getStreetShowdownCouponPool('tatsumiSkylineVista').includes('rx8'));
  assert.ok(getStreetShowdownCouponPool('daikokuPA').includes('rx7fd'));
  assert.deepEqual(getStreetShowdownCouponPool('ginzaMotorGallery'),[]);
});

test('the Office guide derives its leads from the same eligible region pools',()=>{
  const source=registry(createDefaultGameState());
  const ids=['ae86','rx8','rx7fd','r34','nsx'];
  for(const id of ids){
    const hints=getStreetShowdownCouponHunts(id,source);
    assert.ok(hints.length,'no guide for '+id);
    for(const hint of hints){
      const region=TRAVEL_REGIONS[hint.regionId];
      const matches=region.locations.filter(l=>getStreetShowdownCouponPool(l.id).includes(id));
      assert.equal(matches.length,hint.eligibleMeetCount);
      assert.ok(matches.some(l=>l.id===hint.locationId));
    }
  }
  const odo=getStreetShowdownCouponHunts('ae86',source).find(h=>h.regionId==='ODAIBA');
  assert.ok(odo?.unlocked,'Odaiba should be open for new careers');
  const end=getStreetShowdownCouponHunts('nsx',source).find(h=>h.regionId==='DAIKOKU');
  assert.ok(end,'Daikoku should be a potential NSX coupon source');
  assert.ok(!end.unlocked,'late-game Daikoku must not be shown open at starter progression');
});

test('regional Showdown final prize car follows guide and retains real car physics',()=>{
  const pool=getStreetShowdownCouponPool('odaiba7eleven');
  const rounds=createStreetShowdownRounds({
    garageTier:0,wins:1,playerCarId:'ae86',playerState:{},
    playerDifficulty:'STANDARD',prizeType:'COUPON',
    couponCarPool:pool,seed:'test:odaiba:round:2400',
    raceTypes:['Standing Start','Standing Start','Standing Start'],
  });
  assert.equal(rounds.length,3);
  assert.ok(pool.includes(rounds[2].carId));
  assert.ok(rounds.every(r=>r.opponentBuildState&&Number.isFinite(r.performanceRatio)));
  const same=createStreetShowdownRounds({
    garageTier:0,wins:1,playerCarId:'ae86',playerState:{},
    playerDifficulty:'STANDARD',prizeType:'COUPON',
    couponCarPool:pool,seed:'test:odaiba:round:2400',
    raceTypes:['Standing Start','Standing Start','Standing Start'],
  });
  assert.deepEqual(same,rounds,'a saved invitation must be deterministic');
});

test('Office pages all collected coupons and supports tap-to-select region suggestions',()=>{
  const state=createDefaultGameState();
  state.carCoupons=Object.fromEntries(carOrder.slice(0,12).map((id,i)=>[id,i+1]));
  const entries=getOwnedCouponEntries(registry(state));
  assert.equal(entries.length,12);
  assert.equal(entries[0].carId,carOrder[0]);
  assert.equal(entries[11].carId,carOrder[11]);
  const ui=read('src/ui/OfficeCouponHuntPanel.js');
  assert.match(ui,/PER_PAGE=8/);
  assert.match(ui,/selectedId=entry.carId/);
  assert.match(ui,/getStreetShowdownCouponHunts\(picked.carId,scene.registry\)/);
  assert.match(ui,/REGIONS ARE HUNTING LEADS, NOT GUARANTEED CURRENT OFFERS/);
  const garage=read('src/scenes/GarageScene.js');
  assert.match(garage,/showCouponsPopup\(\) \{\s*return showOfficeCouponHunt\(this\)/);
  const office=read('src/ui/OfficePanel.js');
  assert.match(office,/scene.showCouponsPopup\(\)/);
});

test('R716 client release changes only runtime modules and does not reset asset cache',()=>{
  assert.equal(JSON.parse(read('version.json')).build,'R716');
  assert.match(read('index.html'),/id="build-stamp">R716/);
  assert.match(read('index.html'),/main\.js\?v=20261029-r716/);
  assert.match(read('src/main.js'),/GarageScene\.js\?v=20261029-r716/);
  assert.match(read('src/main.js'),/MeetScene\.js\?v=20261029-r716/);
  assert.match(read('src/scenes/MeetScene.js'),/streetShowdowns\.js\?v=20261029-r716/);
  assert.match(read('sw.js'),/const BUILD = 'R716'/);
  assert.match(read('sw.js'),/const ASSET_CACHE = 'tokyoshift-assets-r688'/);
});
