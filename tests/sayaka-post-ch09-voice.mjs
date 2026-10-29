// Voice and staging guardrails for the four post-Chapter 09 career scenes.
// Chapter 09 dialogue is established canon and must not be touched here.
import test from 'node:test';
import assert from 'node:assert/strict';
import {CUTSCENES} from '../src/data/cutscenes.js';
import {CHAPTER09_SCENES} from '../src/data/chapter09.js';
import {characters} from '../src/data/characters.js';

const ids=['proSeasonNotQualified','tokyoChampionshipOpening',
  'tokyoChampionshipDefeat','tokyoChampionshipVictory'];
const expected={
  proSeasonNotQualified:{pages:7,action:'VIEW SEASON REPORT'},
  tokyoChampionshipOpening:{pages:7,action:'VIEW THE CHAMPIONSHIP'},
  tokyoChampionshipDefeat:{pages:7,action:'PREPARE FOR NEXT SEASON'},
  tokyoChampionshipVictory:{pages:12,action:'CONTINUE AS TOKYO CHAMPION'},
};
const joined=id=>CUTSCENES[id].pages.map(p=>p.text).join(' ');

test('only the four requested post-Chapter 09 beats have expanded dialogue and retain result actions',()=>{
  for(const id of ids){
    const scene=CUTSCENES[id];
    assert.equal(scene.once,true,id);
    assert.equal(scene.pages.length,expected[id].pages,id);
    assert.equal(scene.finalActionLabel,expected[id].action,id);
    assert.ok(scene.pages.every(p=>p.text&&p.text.length<=175),id+' overlong line');
  }
});

test('Sayaka keeps an authentic restrained-but-playful voice',()=>{
  assert.match(joined('proSeasonNotQualified'),/arguing with the points table/);
  assert.match(joined('proSeasonNotQualified'),/Driver and Crew events/);
  assert.match(joined('tokyoChampionshipOpening'),/Only twice\?/);
  assert.match(joined('tokyoChampionshipDefeat'),/timing board isn't interested in my opinion/);
  assert.match(joined('tokyoChampionshipVictory'),/I'm proud of all of you/);
  assert.match(joined('tokyoChampionshipVictory'),/You've earned this/);
  assert.match(joined('tokyoChampionshipVictory'),/old 240Z/);
  assert.match(joined('tokyoChampionshipVictory'),/find my way back to this/);
  assert.match(joined('tokyoChampionshipVictory'),/I'm glad you were here for this/);
});

test('victory gives Aruken and Sayaka a genuinely shared, understated aside before returning to player',()=>{
  const pages=CUTSCENES.tokyoChampionshipVictory.pages;
  const aside=pages.filter(p=>p.leftCharacter==='arkonDen'&&
    p.rightCharacter==='sayakaFujieda');
  assert.equal(aside.length,4);
  assert.deepEqual(aside.map(p=>p.speaker),['left','right','left','right']);
  assert.equal(pages.at(-1).leftCharacter,'sayakaFujieda');
  assert.equal(pages.at(-1).rightCharacter,'$PLAYER');
  assert.equal(pages.at(-1).emphasis,true);
});

test('scene jokes do not leak Aruken into unqualified, opening or defeat outcomes',()=>{
  for(const id of ids.filter(id=>id!=='tokyoChampionshipVictory')){
    assert.doesNotMatch(joined(id),/Aruken|Denzaki|Ginza|father/i,id);
    assert.ok(CUTSCENES[id].pages.some(p=>p.leftCharacter==='daichiSakamoto'),id);
  }
});

test('every explicitly staged face and side maps to a real available portrait',()=>{
  for(const id of ids) {
    const scene=CUTSCENES[id];
    for(const page of scene.pages){
      assert.ok(['left','right'].includes(page.speaker),id);
      const actor=page.speaker==='left'?
        page.leftCharacter||scene.characters.left:
        page.rightCharacter||scene.characters.right;
      if(actor==='$PLAYER')continue;
      assert.ok(characters[actor],id+' unknown '+actor);
      const pose=page.speaker==='left'?
        page.leftPose||page.pose:
        page.rightPose||page.pose;
      const ch=characters[actor];
      // Daichi uses established default/win portraits from the scene sprite
      // registry rather than poseAssets; Sayaka and Aruken have explicit ones.
      const valid=Boolean(ch.visual.poseAssets?.[pose])||
        (actor==='daichiSakamoto'&&['idle','win'].includes(pose));
      assert.ok(valid,id+' '+actor+' has no pose '+pose);
    }
  }
});

test('Chapter 09 Sayaka voice, strategy, regulations, and sponsorship remain canonical',()=>{
  assert.ok(CHAPTER09_SCENES.chapter09Rules.pages.some(p=>
    p.text==="We're not signing anything today."));
  assert.ok(CHAPTER09_SCENES.chapter09Rules.pages.some(p=>p.text==='Ryuji.'));
  assert.ok(CHAPTER09_SCENES.chapter09Welcome.pages.some(p=>
    p.text==='Before that, you two need to look like professionals. Style is important!'));
  assert.ok(CHAPTER09_SCENES.proSponsorIntroduction.pages.some(p=>
    p.text==="You're almost on time for once."));
});
