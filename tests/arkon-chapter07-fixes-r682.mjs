import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultGameState,normaliseState} from '../src/state/GameState.js';
import {ARKON_CHAPTER_07} from '../src/data/arkonChapter07.js';
import {isArkonStory240zProtected} from '../src/data/arkonStoryCarProtection.js';

const text=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const getScene=title=>ARKON_CHAPTER_07.steps.find(s=>s.type==='MANGA'&&s.title===title);
const source=values=>({get(key){return values[key]}});

function chapter7(overrides={}){
  return normaliseState({
    ...createDefaultGameState({starterCarId:'240z'}),
    gameMode:'arkonStory',firstName:'Arkon',lastName:'Den',
    arkonStoryChapter:7,arkonStoryChapter06Done:true,
    arkonStoryWarehouseUnlocked:true,garageTier:2,
    ownedCarIds:['240z','ef'],
    selectedCarId:'240z',preferredCarId:'240z',
    carGarageLocations:{'240z':'shinonomeCanalYard',ef:'shinonomeWorkshop'},
    workshopLocationId:'shinonomeWarehouseStrip',
    ...overrides,
  });
}

test('R682: a legacy Chapter 7 story Z moves into Warehouse HQ once',()=>{
  const save=chapter7();
  assert.equal(save.garageTier,2);
  assert.equal(save.carGarageLocations['240z'],'shinonomeWarehouseStrip');
  assert.equal(save.carGarageLocations.ef,'shinonomeWorkshop');
  assert.equal(save.arkonStoryCh7GarageSeeded,true);
  assert.equal(save.selectedCarId,'240z');
});

test('R682: Home and Canal Yard remain navigable after Warehouse unlock',()=>{
  const original=chapter7();
  for(const workshopLocationId of ['shinonomeWorkshop','shinonomeCanalYard','shinonomeWarehouseStrip']){
    const travel=normaliseState({...original,workshopLocationId});
    assert.equal(travel.workshopLocationId,workshopLocationId);
    assert.equal(travel.garageTier,2);
  }
  const moved=normaliseState({...original,
    workshopLocationId:'shinonomeCanalYard',
    carGarageLocations:{...original.carGarageLocations,'240z':'shinonomeCanalYard'}
  });
  assert.equal(moved.workshopLocationId,'shinonomeCanalYard');
  assert.equal(moved.carGarageLocations['240z'],'shinonomeCanalYard');
});

test('R682: Career workshop assignment is unchanged by Story repair',()=>{
  const career=normaliseState({...chapter7(),gameMode:'career',
    firstName:'Kai',lastName:'Driver',garageTier:2,
    workshopLocationId:'shinonomeCanalYard',
    carGarageLocations:{'240z':'shinonomeWorkshop',ef:'shinonomeCanalYard'}});
  assert.equal(career.carGarageLocations['240z'],'shinonomeWorkshop');
  assert.equal(career.workshopLocationId,'shinonomeCanalYard');
  assert.equal(career.arkonStoryCh7GarageSeeded,false);
});

test('R682: the original and converted Z are market protected only in unfinished Story',()=>{
  const story=source({gameMode:'arkonStory'});
  assert.equal(isArkonStory240zProtected(story,'240z'),true);
  assert.equal(isArkonStory240zProtected(story,'arkonLibertyWalk240z'),true);
  assert.equal(isArkonStory240zProtected(story,'ef'),false);
  assert.equal(isArkonStory240zProtected({gameMode:'career'},'240z'),false);
  assert.equal(isArkonStory240zProtected(source({gameMode:'arkonStory',
    arkonStoryChapter10ZSale:{status:'sold'}}),'arkonLibertyWalk240z'),false);
  const market=text('../src/scenes/CentralTokyoScene.js');
  assert.match(market,/storyCarLocked = isArkonStory240zProtected/);
  assert.match(market,/if \(isArkonStory240zProtected\(this\.registry,carId\)\) return;/);
  // The canon Chapter 10 story transaction remains separate from the used market.
  assert.match(text('../src/data/arkonChapter10Work.js'),/export function sellArkonCh10LibertyWalk/);
});

test('R682: Chapter 7 outfit is uniform across every manga page in suited and mechanic scenes',()=>{
  const suit=getScene('A NEW LOOK');
  assert.ok(suit);
  assert.ok(suit.pages.length>3);
  assert.ok(suit.pages.every(page=>page.leftPose==='ginzaSuit'));
  const mechanic=getScene('THE BUSINESS IS BOOMING');
  assert.ok(mechanic);
  assert.ok(mechanic.pages.every(page=>page.leftPose==='storyMechanic'));
  const bodywork=getScene('SOMETHING IS MISSING');
  assert.ok(bodywork.pages.every(page=>page.leftPose==='storyMechanic'));
  const tuner=getScene('TAKUMI // LIGHTNESS WITH PURPOSE');
  assert.ok(tuner.pages.every(page=>page.leftPose==='storyMechanic'));
  assert.ok(ARKON_CHAPTER_07.steps.some(step=>step.type==='STAGE'&&
    step.characters?.some(actor=>actor.id==='arkonDen'&&actor.pose==='ginzaSuit')));
});
