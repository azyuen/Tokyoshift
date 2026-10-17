import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { queueSafeSceneStart } from '../src/ui/SafeSceneTransition.js';

const source = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
const nextInputTurn = () => new Promise(resolve => setTimeout(resolve, 10));
const makeScene = () => {
  const started=[];
  const scene={
    starts:started,sys:{settings:{key:'GarageScene'},isActive:()=>true},
    scene:{start:(...args)=>started.push(args)},
  };
  return scene;
};

test('replay transitions are deferred beyond the input event and never double start',async()=>{
  const scene=makeScene();
  assert.equal(queueSafeSceneStart(scene,'GarageScene',{storyArchiveChapter:'chapter06'}),true);
  assert.equal(scene.starts.length,0);
  assert.equal(queueSafeSceneStart(scene,'GarageScene',{storyArchiveChapter:'chapter08'}),false);
  await nextInputTurn();
  assert.deepEqual(scene.starts,[['GarageScene',{storyArchiveChapter:'chapter06'}]]);
  assert.equal(scene._pendingSafeSceneStart,null);
});

test('deferred transitions do not revive scenes which have been stopped',async()=>{
  const scene=makeScene();
  let active=true;
  scene.sys.isActive=()=>active;
  assert.equal(queueSafeSceneStart(scene,'RaceScene'),true);
  active=false;
  await nextInputTurn();
  assert.equal(scene.starts.length,0);
});

test('Story Archive and dev chapter replay share safe deferred startup and recovery',()=>{
  const archive=source('src/ui/StoryReplaySession.js');
  const chapter08=source('src/ui/Chapter08DevReplay.js');
  assert.match(archive,/queueSafeSceneStart\(scene,'GarageScene'/);
  assert.match(chapter08,/queueSafeSceneStart\(scene,'GarageScene'/);
  assert.match(chapter08,/queueSafeSceneStart\(scene,target\)/);
  assert.match(source('src/ui/StoryArchivePanel.js'),/const started=id==='chapter08'/);
  assert.match(source('src/ui/StoryArchivePanel.js'),/REPLAY COULD NOT START/);
});

test('travel starts after pointerdown event and protects destination button',()=>{
  const map=source('src/ui/TravelMap.js');
  assert.match(map,/travelLabel\.setText\('TRAVELLING\.\.\.'\)/);
  assert.match(map,/window\.setTimeout\(\(\) => \{[\s\S]*?dismiss\(\);[\s\S]*?onTravel\?\.\(location\.id, cost\)/);
  assert.match(map,/workshopActionPending = true/);
});

test('Arkon Den can leave an empty workshop using one owned personal car',()=>{
  const garage=source('src/scenes/GarageScene.js');
  assert.match(garage,/const devTravelCarId = !this\.crewMode && isArkonDen\(this\.registry\)/);
  assert.match(garage,/this\.ownedCarIds\.find\(id => cars\[id\] && !cars\[id\]\.crewLoan\)/);
  assert.match(garage,/selectedCarId', this\.selectedCarId \|\| devTravelCarId \|\| null/);
  assert.match(garage,/if \(!this\.selectedCarId && !devTravelCarId &&/);
});
