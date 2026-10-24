import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  STORY_DIALOGUE_TYPOGRAPHY,
  applyStoryDialogueTypography,
} from '../src/ui/StoryDialogueTypography.js';
import { CHAPTER08_SCENES } from '../src/data/chapter08.js';
const src = p => readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('normal manga and every phone presentation use one final-pixel readable type scale',()=>{
  assert.deepEqual(STORY_DIALOGUE_TYPOGRAPHY,{
    bodyPx:22,emphasisPx:24,speakerPx:16,lineSpacing:5,
  });
  const calls=[];
  const heading={setFontSize(v){calls.push(['heading',v]);return this;}};
  const dialogue={
    setFontSize(v){calls.push(['body',v]);return this;},
    setLineSpacing(v){calls.push(['spacing',v]);return this;},
  };
  assert.deepEqual(applyStoryDialogueTypography({dialogue,heading}),{dialogue,heading});
  assert.deepEqual(calls,[['heading',16],['body',22],['spacing',5]]);
  calls.length=0;
  applyStoryDialogueTypography({dialogue,heading,emphasis:true});
  assert.deepEqual(calls,[['heading',16],['body',24],['spacing',5]]);
  assert.doesNotThrow(()=>applyStoryDialogueTypography());
});

test('phone-only HUD styling inherits shared story font without modifying racing coach theme',()=>{
  const hud=src('src/ui/RaceCoachHud.js');
  const manga=src('src/ui/MangaCutscene.js');
  const helper="applyStoryDialogueTypography({ heading, dialogue });";
  const pos=hud.indexOf("  if (theme === 'phone') {");
  assert.ok(pos>=0);
  assert.ok(hud.indexOf(helper,pos)>pos);
  assert.ok(hud.indexOf(helper,pos)<hud.indexOf("  const setPortrait =",pos));
  assert.equal(hud.slice(0,pos).includes(helper),false);
  assert.match(hud,/StoryDialogueTypography\.js\?v=20261023-r658/);
  assert.match(manga,/StoryDialogueTypography\.js\?v=20261023-r658/);
  assert.match(manga,/applyStoryDialogueTypography\(\{ dialogue: body, heading: labelText/);
});

test('standard and animated/swipe phone calls never override the global template down to tiny 17px text',()=>{
  const normal=src('src/ui/PhoneConversation.js');
  const swipe=src('src/ui/OpeningPhonePrototype.js');
  const manga=src('src/ui/MangaCutscene.js');
  for(const [label,s] of [['standard',normal],['swipe',swipe]]){
    assert.match(s,/createRaceDialogueHud\(scene/);
    assert.match(s,/RaceCoachHud\.js\?v=20261023-r658/);
    assert.doesNotMatch(s,/\.setFontSize\(['"]17px['"]\)/,
      label+' must never override the shared font size after construction');
    assert.doesNotMatch(s,/\.setFontSize\(['"]10px['"]\)/,
      label+' must never shrink the phone speaker heading');
  }
  assert.match(normal,/OpeningPhonePrototype\.js\?v=20261023-r658/);
  assert.match(manga,/PhoneConversation\.js\?v=20261023-r658/);
  assert.match(normal,/panel\.dialogue\.setText\(formatPhoneMessage/);
  assert.match(swipe,/hud\.dialogue\.setText\(text\)/);
});

test('both established chapter 08 phone callers retain their content and use the shared phone template',()=>{
  for(const id of ['chapter08ManagerCall','chapter08SayakaCall']){
    const call=CHAPTER08_SCENES[id];
    assert.equal(call.presentation,'phone',id);
    assert.equal(call.presentationMode,'openingSwipe',id);
    assert.ok(call.pages.length>=8,id);
  }
  for(const file of ['src/ui/Chapter08Story.js','src/ui/Chapter09Story.js',
    'src/ui/CanalYardStory.js','src/ui/CutsceneTester.js',
    'src/scenes/GarageScene.js','src/scenes/MeetScene.js',
    'src/scenes/CentralTokyoScene.js','src/scenes/OshiageScene.js',
    'src/scenes/RaceScene.js','src/scenes/TrainStationScene.js',
    'src/story/StoryDirector.js']){
    assert.match(src(file),/MangaCutscene\.js\?v=20261023-r658/,
      file+' must load latest unified phone dialogue renderer');
  }
});

test('iPad and iPhone refresh the R658 story/phone templates without cache mixing',()=>{
  const html=src('index.html');
  const sw=src('sw.js');
  const game=src('src/main.js');
  const version=JSON.parse(src('version.json'));
  assert.equal(version.build,'R658');
  assert.match(html,/main\.js\?v=20261023-r658/);
  assert.match(sw,/const BUILD = 'R658'/);
  assert.match(sw,/tokyoshift-assets-r658/);
  assert.match(game,/StoryDirector\.js\?v=20261023-r658/);
  assert.match(game,/MeetScene\.js\?v=20261023-r658/);
  assert.match(game,/GarageScene\.js\?v=20261023-r658/);
});
