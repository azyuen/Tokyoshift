// Crew Space whiteboard: repeatable, recruit-led regional preparation.
// The displayed heat regulations and formats come from the actual crew battle
// generator, never from a parallel set of strings maintained for the whiteboard.
import { CREW_REGIONS } from './crewRoster.js';
import { getCrewBattleRegionRules } from './crewBattleRules.js';
import { buildRegionalCrewBattleRounds, isCrewComplete } from './crewSystem.js';

export const CREW_PLAYBOOK_REGIONS = CREW_REGIONS;

/**
 * Existing story completion and validated regional crew slots are the only
 * persisted sources of truth. No new save flags or migration are necessary.
 */
export function getCrewWhiteboardMode(source, { developerPreview = false } = {}) {
  const seen = typeof source?.get === 'function'
    ? source.get('cutscenesSeen') : source?.cutscenesSeen;
  const hasSeen = id => Array.isArray(seen) && seen.includes(id);
  if (!hasSeen('sevenRegionsConquered') && !developerPreview) return null;
  if (isCrewComplete(source) &&
      (hasSeen('fullCrewTogether') || developerPreview)) return 'playbook';
  return 'recruit';
}


export const CREW_PLAYBOOK_ADVICE = Object.freeze({
  ODAIBA: Object.freeze({
    opening: "Odaiba keeps it simple: three standing-start quarter-miles, and open tuning across the board.",
    preparation: "Choose three drivers who can launch consistently. You need two clean wins, not the loudest dyno number.",
  }),
  SHINAGAWA: Object.freeze({
    opening: "Three standing-start quarter-miles, but nitrous is banned in every heat here.",
    preparation: "Uninstall the NOS hardware before you line up. Work on grip, clean shifts and repeatable starts.",
  }),
  TATSUMI: Object.freeze({
    opening: "Every Tatsumi heat is a standing quarter-mile, with a strict 220 kilowatt power ceiling.",
    preparation: "Get the most from traction and gearing below 220 kW. If you're over the cap, they won't let your car race.",
  }),
  SHIBUYA: Object.freeze({
    opening: "Shibuya starts with factory stock, then runs an open rolling quarter-mile and an open standing quarter-mile.",
    preparation: "Keep one crew car genuinely stock. Give that rolling-start heat to someone who knows their car's response.",
  }),
  YOKOHAMA: Object.freeze({
    opening: "The first two Yokohama heats are capped at 300 kW: standing first, rolling second. The open half-mile is last.",
    preparation: "Plan the car order in advance. Your strongest long-distance setup belongs in the third slot.",
  }),
  DAIKOKU: Object.freeze({
    opening: "All three Daikoku heats are capped at 380 kW, with no nitrous. There's a rolling quarter, a standing half and a standing quarter.",
    preparation: "One setup won't suit every format. Match the driver, gearing and traction to each heat, and remove NOS first.",
  }),
  SHINJUKU: Object.freeze({
    opening: "Shinjuku tests three different builds: factory stock, a 380 kW no-NOS rolling quarter, and an open half-mile.",
    preparation: "Keep one car stock, prepare another under 380 kW without nitrous, then reserve a strong long-run car for the final slot.",
  }),
});

export function getCrewPlaybookBriefing(regionId, source = null) {
  const region = String(regionId || '').toUpperCase();
  const rules = getCrewBattleRegionRules(region);
  const advice = CREW_PLAYBOOK_ADVICE[region];
  if (!rules || !advice) return null;
  // This is the SAME builder used by MeetScene to set the opponent and the
  // three physical racing heats. Scouts' hidden tuning is deliberately omitted.
  const rounds = buildRegionalCrewBattleRounds(region, source);
  if (rounds.length !== 3) return null;
  return {
    region,
    focus: rules.focus,
    opening: advice.opening,
    preparation: advice.preparation,
    heats: rounds.map((round, i) => ({
      number: i + 1,
      ruleLabel: round.rule.label,
      raceType: round.raceType,
      distanceM: round.distanceM,
      distanceLabel: round.distanceM > 500 ? '1/2 MI' : '1/4 MI',
      startLabel: round.raceType === 'Roll Race' ? 'ROLL' : 'STAND',
    })),
  };
}

// The normal manga renderer displays the real recruited regional character on
// the left and its existing info panel on the right. No saved story flags.
export function createCrewPlaybookCutscene(regionId, characterId, source = null) {
  const briefing = getCrewPlaybookBriefing(regionId, source);
  if (!briefing || !characterId) return null;
  return {
    briefing,
    definition: {
      id: 'crewPlaybook_' + briefing.region.toLowerCase(),
      category: 'CREW / REGIONAL PLAYBOOK',
      title: briefing.region + ' // CREW INTELLIGENCE',
      once: false,
      characters: { left: String(characterId) },
      pages: [
        { speaker: 'left', pose: 'idle', text: briefing.opening },
        {
          speaker: 'left', pose: 'idle', text: briefing.preparation,
          emphasis: true, requireActionButton: true,
        },
      ],
      finalActionLabel: 'BACK TO WHITEBOARD',
    },
    infoPanel: {
      title: briefing.region + ' // CREW BATTLE',
      subtitle: briefing.focus,
      headers: ['HEAT', 'REGULATION', 'START', 'DIST.'],
      rows: briefing.heats.map(heat => [
        String(heat.number).padStart(2, '0'),
        heat.ruleLabel,
        heat.startLabel,
        heat.distanceLabel,
      ]),
      footer: '3 VS 3 // FIRST TO TWO WINS // NO AUTO TUNING',
    },
  };
}
