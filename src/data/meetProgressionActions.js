// Meet progress calls-to-action. Only unfinished, player-initiated regional
// hurdles appear here; the first organic seven-driver invitation stays in story.
import {
  getTunerTeamChallengeState, isTunerTeamChallengeEligible,
} from './tunerChallenges.js?v=20261016-r550';
import { isCrewComplete, getCrewBattleProgress } from './crewSystem.js?v=20261016-r550';

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
  // Do not offer the continue button before a real attempt. An invitation
  // declined before the first race is handled by a later manga re-invitation.
  if (!state.championEarned && state.firstAttemptStarted &&
      isTunerTeamChallengeEligible(source, region)) {
    actions.push({ id: 'REGIONAL', label: 'CONTINUE REGIONAL CHALLENGE',
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
