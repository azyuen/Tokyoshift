import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cars } from '../src/data/cars.js';
import { getRegionalCrewRoster, getCrewLoanCarId } from '../src/data/crewRoster.js';
import { isActiveCrewLoanCar } from '../src/data/crewSystem.js';
import {
  getOshiageRimListings, getOshiageRimQuote,
  buyOrInstallOshiageRim, restoreStockOshiageRims,
} from '../src/data/oshiageRims.js';
import { bookOshiageLesson } from '../src/data/oshiageSchool.js';

const read = name => readFileSync(new URL('../' + name, import.meta.url),'utf8');
const garage = read('src/scenes/GarageScene.js');
const crewScene = read('src/scenes/CrewSpaceScene.js');
const school = read('src/scenes/OshiageScene.js');
const travelMap = read('src/ui/TravelMap.js');
const meet = read('src/scenes/MeetScene.js');
const main = read('src/main.js');
const createFixture = () => {
  const candidate = getRegionalCrewRoster('ODAIBA').members[0];
  const carId = getCrewLoanCarId(candidate.characterId);
  assert.ok(cars[carId]?.crewLoan);
  const data = {
    cash: 10000000, garageTier: 2, crewSpaceActive: true,
    selectedCarId: carId, preferredCarId: 'ae86',
    ownedCarIds: ['ae86', carId], ownedWheelIds: [],
    carStates: { [carId]: { crewLoan: true, paintColor: 0xffffff } },
    crewMembers: { ODAIBA: {
      regionId:'ODAIBA', characterId:candidate.characterId,
      loanCarId:carId, baseCarId:candidate.baseCarId,
    }},
  };
  return {carId, data, registry:{
    get:key=>data[key], set:(key,value)=>{data[key]=value;},
  }};
};

test('chassis install/back controls align with the other three tuning categories',()=>{
  const chassis = garage.slice(garage.indexOf('  activateChassisMode() {'),garage.indexOf('  rebuildSelectedVisualModPreview() {'));
  assert.equal((chassis.match(/SIDE\.y \+ 624/g)||[]).length, 2);
  assert.equal((chassis.match(/SIDE\.y \+ 678/g)||[]).length, 2);
  assert.doesNotMatch(chassis, /crewControlLift|SIDE\.y \+ 494|SIDE\.y \+ 576/);
  assert.match(garage,/SIDE\.y \+ 624/);
  assert.match(crewScene,/GarageScene\.js\?v=20261021-r627/);
});

test('a genuine recruited crew driver and assigned loan car qualify for services',()=>{
  const f=createFixture();
  assert.equal(isActiveCrewLoanCar(f.registry,f.carId),true);
  const booking = bookOshiageLesson({
    booking:null,carId:f.carId,lessonId:'launch',cash:f.data.cash,
  });
  assert.equal(booking.ok,true);
  assert.equal(booking.booking.carId,f.carId);
});

test('wheel purchase and stock restoration modify only the selected crew car',()=>{
  const f=createFixture();
  const rim=getOshiageRimListings()[0];
  assert.ok(rim?.id);
  const quote=getOshiageRimQuote(f.registry,f.carId,rim.id);
  assert.equal(quote.locked,false);
  assert.ok(['OWNED','BUY'].includes(quote.status));
  const bought=buyOrInstallOshiageRim(f.registry,f.carId,rim.id);
  assert.equal(bought.ok,true);
  assert.equal(f.data.carStates[f.carId].customWheelId,rim.id);
  assert.equal(f.data.carStates[f.carId].crewLoan,true);
  assert.equal(f.data.selectedCarId,f.carId);
  assert.equal(Object.keys(f.data.crewMembers).length,1);
  assert.equal(restoreStockOshiageRims(f.registry,f.carId),true);
  assert.equal(f.data.carStates[f.carId].customWheelId,undefined);
});

test('a removed or unassigned crew car is not eligible for Oshiage cosmetic purchases',()=>{
  const f=createFixture();
  f.data.crewMembers={};
  assert.equal(isActiveCrewLoanCar(f.registry,f.carId),false);
  const rim=getOshiageRimListings()[0];
  assert.equal(getOshiageRimQuote(f.registry,f.carId,rim.id).status,'LOCKED');
  f.data.carStates[f.carId].customWheelId=rim.id;
  assert.equal(restoreStockOshiageRims(f.registry,f.carId),false);
});

test('Ginza test-drive loans cannot masquerade as a crew member',()=>{
  const f=createFixture();
  const demo='ginzaDemo_essoToyotaGtOne';
  f.data.ownedCarIds.push(demo);
  assert.equal(isActiveCrewLoanCar(f.registry,demo),false);
  assert.equal(getOshiageRimQuote(f.registry,demo,getOshiageRimListings()[0].id).status,'LOCKED');
});

test('crew map allows Oshiage school/custom works without granting Ginza or Skytree',()=>{
  assert.match(travelMap,/target\?\.regionId === 'OSHIAGE' && location\.id === 'oshiageSkytreeMeet'/);
  assert.match(travelMap,/selectedRegionId === 'CENTRAL_TOKYO'/);
  assert.match(travelMap,/regionId === 'CENTRAL_TOKYO'\) return/);
  assert.doesNotMatch(travelMap,/\['CENTRAL_TOKYO', 'OSHIAGE'\]\.includes/);
  assert.match(garage,/travelTarget\?\.regionId === 'OSHIAGE'/);
  assert.match(garage,/this\.crewMode && locationId === 'oshiageSkytreeMeet'/);
  assert.match(meet,/TravelMap\.js\?v=20261020-r615/);
  assert.match(school,/travelMode: this\.isCrewCarSelected\(\) \? 'crew' : 'default'/);
  assert.match(school,/target\.regionId === 'CENTRAL_TOKYO'/);
});

test('Oshiage school accepts active crew loans in booking and launch paths',()=>{
  assert.match(school,/isSchoolCarEligible\(car, id\)/);
  assert.match(school,/this\.isSchoolCarEligible\(current\.car, current\.id\)/);
  assert.match(school,/!this\.isSchoolCarEligible\(car, id\)/);
  assert.match(school,/raceReturnScene', 'OshiageScene'/);
  assert.doesNotMatch(school,/disabled: !car \|\| Boolean\(car\.crewLoan\)/);
});

test('paint purchases revalidate crew loan ownership and never rewrite other garages',()=>{
  assert.match(school,/const paintable = Boolean\(hasLayeredPaintAssets/);
  assert.match(school,/selectedId !== carId \|\| !car/);
  assert.match(school,/\(current\.crewLoan && !this\.isCrewCarSelected\(\)\)/);
  assert.match(main,/OshiageScene\.js\?v=20261020-r\d+/);
  assert.match(main,/CrewSpaceScene\.js\?v=20261020-r\d+/);
});
