import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Garage and Crew replay startup does not depend on paused Phaser time',()=>{
 const garage=source('src/scenes/GarageScene.js');
 assert.match(garage,/this\.time\.paused=false;\s*window\.setTimeout\(\(\)=>\{/);
 assert.match(garage,/playStoryArchiveChapter\(this,this\.storyArchiveChapter\)/);
 assert.match(garage,/startChapter08Warehouse\(this\)/);
 assert.match(garage,/if \(!replayStarting\) \{\s*this\.time\.delayedCall\(140/);
 assert.match(garage,/CHAPTER 08 COULD NOT START/);
 assert.match(garage,/RETURN TO OFFICE/);
 // Regression that produced the real Chromium runtime exception: never call
 // disableInteractive() on a rectangle with no Phaser input component.
 assert.match(garage,/if \(this\.moveCarButton\.input\) this\.moveCarButton\.disableInteractive\(\)/);
});
test('Crew chapter routes to actual CrewSpaceScene sharing the same Garage implementation',()=>{
 const replay=source('src/ui/StoryReplaySession.js');
 const crew=source('src/scenes/CrewSpaceScene.js');
 const main=source('src/main.js');
 assert.match(replay,/queueSafeSceneStart\(scene,crew\?'CrewSpaceScene':'GarageScene'/);
 assert.match(crew,/GarageScene\.js\?v=20261017-r574/);
 assert.match(main,/CrewSpaceScene\.js\?v=20261017-r574/);
});
test('both normal player and developer replay entry points are wired consistently',()=>{
 const paths=['src/ui/StoryArchivePanel.js','src/ui/CutsceneTester.js',
 'src/ui/StoryArchivePlayback.js','src/scenes/GarageScene.js',
 'src/scenes/CentralTokyoScene.js','src/ui/Chapter08Story.js'];
 for(const p of paths){
   const s=source(p);
   assert.doesNotMatch(s,/StoryReplaySession\.js\?v=20261017-r57[0-3]/,p);
   assert.doesNotMatch(s,/Chapter08DevReplay\.js\?v=20261017-r57[0-3]/,p);
 }
});
