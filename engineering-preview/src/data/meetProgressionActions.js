// Meet progress calls-to-action. Only unfinished, player-initiated regional
// hurdles appear here; the first organic seven-driver invitation stays in story.
import {
  getTunerTeamChallengeState, isTunerTeamChallengeEligible,
} from './tunerChallenges.js';
import { isCrewComplete, getCrewBattleProgress } from './crewSystem.js';

export const MEET_PROGRESSION_BADGES = Object.freeze({
  REGIONAL: 'meetProgressBadgeRegional',
  PERFECT: 'meetProgressBadgePerfect',
  CREW: 'meetProgressBadgeCrew',
});

export function getMeetProgressionActions(source, regionId, hasCar = true) {
  const region = String(regionId || '').toUpperCase();
  if (!hasCar || !region) return [];
  const state = getTunerTeamChallengeState(source, region);
  const actions = [];
  // Arkon earns his FIRST regional challenge through his Chapter 02 story.
  // The normal crowned action is available immediately afterwards at Odaiba.
  const get=key=>typeof source?.get==='function'?source.get(key):source?.[key];
  const arkonFirstRegional=region==='ODAIBA' &&
    get('gameMode')==='arkonStory' && Boolean(get('arkonStoryChapter02Done')) &&
    !state.championEarned;
  // All ordinary Career invitations retain their existing conditions.
  if (arkonFirstRegional || (!state.championEarned && state.firstAttemptStarted &&
      isTunerTeamChallengeEligible(source, region))) {
    actions.push({ id: 'REGIONAL', label: arkonFirstRegional && !state.firstAttemptStarted
      ? 'START REGIONAL CHALLENGE' : 'CONTINUE REGIONAL CHALLENGE',
      badge: MEET_PROGRESSION_BADGES.REGIONAL });
  }
  if (state.championEarned && !state.perfectEarned && !state.perfectRewardClaimed) {
    actions.push({ id: 'PERFECT', label: 'ATTEMPT PERFECT STREAK',
      badge: MEET_PROGRESSION_BADGES.PERFECT });
  }
  if (isCrewComplete(source) && !getCrewBattleProgress(source)[region]?.completed) {
    actions.push({ id: 'CREW', label: 'START A CREW BATTLE',
      badge: MEET_PROGRESSION_BADGES.CREW });
  }
  return actions.slice(0, 2);
}
