// Central Tokyo Drag Complex HOME background (not the five-part race venue).
// Attendance is presentation-only: no event eligibility, ratings, economics or
// saved-profile fields are changed. The first professional invitation is quiet.
import {
  normaliseProCircuitState, getProCircuitDriverSeeds, getProCircuitTeamSeeds,
} from './proCircuit.js?v=20261029-r714';

export const DRAG_COMPLEX_HOME_CROWDS = Object.freeze(['empty', 'half', 'full']);

export function getDragComplexHomeCrowdTier({
  circuit = null, event = null, accessGranted = true,
} = {}) {
  if (!accessGranted) return 'empty';
  const pro = normaliseProCircuitState(circuit);

  const completed = Math.max(
    pro.eventTick, pro.openCircuitTick, pro.calendar.round,
    pro.playerDriver.entered + pro.playerTeam.entered,
  );
  // A fresh invite is an empty venue, irrespective of the rotating offers or
  // the dev account's access bypass. Keep old saved careers' event counts.
  if (!completed && !pro.activeChampionship && !pro.tokyoChampionWins)
    return 'empty';

  if (pro.activeChampionship || pro.tokyoChampionWins > 0)
    return 'full';

  const team = Boolean(event?.team || event?.reportDiscipline === 'TEAM');
  const rows = team ? getProCircuitTeamSeeds(pro) : getProCircuitDriverSeeds(pro);
  const playerId = team ? 'player:team' : 'player:driver';
  const rank = rows.find(row => row.id === playerId)?.seed || 32;
  // Top-ranked drivers draw crowds even for routine heats.
  if (rank <= 5) return 'full';

  // Selected event prestige matters, as well as the professional career.
  // Minor trophy / elite invitation > four-wide / season results > regular cup.
  const prestige = event?.trophyId || event?.seasonChoice === 'alternative' ? 2
    : event?.fourWide || event?.seasonEnd ? 1 : 0;
  const season = pro.seasonStatus === 'ACTIVE' || pro.seasonStatus === 'COMPLETE' ? 1 : 0;
  const reputation = rank <= 12 ? 1 : 0;
  const experience = completed >= 4 ? 1 : 0;
  const attention = prestige + season + reputation + experience;
  return attention >= 3 ? 'full' : attention >= 1 ? 'half' : 'empty';
}

export function resolveDragComplexHomeBackground({
  phase = 'night', circuit = null, event = null, accessGranted = true,
} = {}) {
  const time = String(phase).toLowerCase() === 'day' ? 'day' : 'night';
  const crowdTier = getDragComplexHomeCrowdTier({ circuit, event, accessGranted });
  const capitalise = value => value.charAt(0).toUpperCase() + value.slice(1);
  return {
    key: `centralTokyoDrag${capitalise(crowdTier)}${capitalise(time)}Bg`,
    path: `assets/CentralTokyo/dragcomplex/dragstrip_${crowdTier}_${time}.png`,
    crowdTier,
  };
}
