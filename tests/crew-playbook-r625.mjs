import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { CREW_REGIONS, getRegionalCrewRoster } from '../src/data/crewRoster.js';
import { getCrewBattleRegionRules } from '../src/data/crewBattleRules.js';
import { buildRegionalCrewBattleRounds } from '../src/data/crewSystem.js';
import {
  CREW_PLAYBOOK_REGIONS, CREW_PLAYBOOK_ADVICE,
  getCrewPlaybookBriefing, createCrewPlaybookCutscene,
} from '../src/data/crewBattlePlaybook.js';

const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');

test('actual uploaded whiteboard is available in the game assets', () => {
  assert.ok(existsSync(new URL('../assets/Garage/whiteboard_crewbattle.png', import.meta.url)));
});

test('all seven whiteboard intel cards are based on the actual crew heat rules', () => {
  assert.deepEqual(CREW_PLAYBOOK_REGIONS, CREW_REGIONS);
  assert.equal(getCrewPlaybookBriefing('FAKE_REGION'), null);
  for (const region of CREW_REGIONS) {
    const info = getCrewPlaybookBriefing(region);
    const rounds = buildRegionalCrewBattleRounds(region);
    assert.ok(CREW_PLAYBOOK_ADVICE[region]?.preparation, region);
    assert.ok(info?.opening && info?.preparation, region);
    assert.equal(info.focus, getCrewBattleRegionRules(region).focus);
    assert.equal(info.heats.length, 3, region);
    for (let heat=0; heat<3; heat++) {
      const a=info.heats[heat], b=rounds[heat];
      assert.equal(a.ruleLabel, b.rule.label, region + ' heat ' + (heat+1));
      assert.equal(a.raceType, b.raceType, region + ' heat ' + (heat+1));
      assert.equal(a.distanceM, b.distanceM, region + ' heat ' + (heat+1));
      assert.equal(a.startLabel, b.raceType === 'Roll Race' ? 'ROLL' : 'STAND');
      assert.equal(a.distanceLabel, b.distanceM > 500 ? '1/2 MI' : '1/4 MI');
    }
  }
});

test('each regional recruit speaks in the standard replayable manga, beside a 3-heat regulation panel', () => {
  for(const region of CREW_REGIONS){
    const recruit = getRegionalCrewRoster(region).members[0].characterId;
    const fixture={crewMembers:{[region]:{regionId:region,characterId:recruit}}};
    const story=createCrewPlaybookCutscene(region,recruit,fixture);
    assert.ok(story,region);
    assert.equal(story.definition.characters.left,recruit);
    assert.equal(story.definition.once,false);
    assert.equal(story.definition.pages.length,2);
    assert.equal(story.definition.pages[0].speaker,'left');
    assert.equal(story.definition.pages[1].speaker,'left');
    assert.equal(story.definition.finalActionLabel,'BACK TO WHITEBOARD');
    assert.deepEqual(story.infoPanel.headers,['HEAT','REGULATION','START','DIST.']);
    assert.deepEqual(story.infoPanel.rows.map(row=>row[1]),
      story.briefing.heats.map(heat=>heat.ruleLabel));
    assert.equal(story.infoPanel.rows.length,3);
  }
  assert.equal(createCrewPlaybookCutscene('ODAIBA',null),null);
});

test('Crew Space button, image-sized hotspots and manga return reuse the existing scene', () => {
  const garage=read('src/scenes/GarageScene.js');
  const bridge=read('src/scenes/CrewSpaceScene.js');
  const main=read('src/main.js');
  assert.match(garage,/assets\/Garage\/whiteboard_crewbattle\.png/);
  assert.match(garage,/this\.buildCrewPlaybookHotspot\(\)/);
  assert.match(garage,/this\.showCrewBattleWhiteboard\(\)/);
  assert.match(garage,/const targets = \[([\s\S]*?)\];/);
  assert.match(garage,/const scale = Math\.min\(viewportW \/ source\.width, viewportH \/ source\.height\)/);
  assert.match(garage,/setInteractive\(\{ useHandCursor: true \}\)/);
  assert.match(garage,/const member = members\[regionId\]/);
  assert.match(garage,/if \(!member\?\.characterId/);
  assert.match(garage,/playMangaCutscene\(this, plan\.definition, \{/);
  assert.match(garage,/infoPanel: plan\.infoPanel/);
  assert.match(garage,/this\.crewBattleWhiteboardOverlay = null/);
  assert.match(bridge,/super\('CrewSpaceScene'\)/);
  assert.match(main,/GarageScene\.js\?v=20261020-r625/);
  assert.match(main,/CrewSpaceScene\.js\?v=20261020-r625/);
});

test('meet battle briefing no longer has redundant heat-three overflow', () => {
  const meet=read('src/scenes/MeetScene.js');
  assert.doesNotMatch(meet,/HEAT 3 ONLY IF THE SERIES IS TIED 1-1/);
  assert.match(meet,/text\(830, 454, 'BATTLE BRIEFING'/);
  assert.match(meet,/regional\?\.focus \|\| 'CREW CHALLENGE'/);
});
