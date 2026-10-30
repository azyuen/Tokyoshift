import { getProCircuitDriverSeeds, PRO_AI_TEAM_DEFINITIONS } from './proCircuit.js?v=20261030-r724';
import { characters } from './characters.js?v=20261023-r672';

// A saved professional heat must reference one of the actual named drivers
// in the persistent Pro Circuit roster. Earlier dev / legacy event schedules
// could have no characterId, and visually fell back to "UNKNOWN DRIVER".
// Assign *display/standings identity only*; never change car, AI or physics.
const anonymousLabel=/^(?:UNKNOWN DRIVER|PRO DRIVER|RIVAL)(?:\s*\d+)?$/i;
const stableHash=value=>{
  let hash=2166136261;
  for(const char of String(value||''))hash=Math.imul(hash^char.charCodeAt(0),16777619);
  return hash>>>0;
};

// The complete professional ladder is 23 AI drivers: seven regional
// champions and 16 named professional drivers. Keep a stable ID order:
// rankings are dynamic and must never reshuffle event opponent rotation.
const CANONICAL_PRO_DRIVER_IDS=new Set(
  PRO_AI_TEAM_DEFINITIONS.flatMap(team=>team.rankedDriverIds));
export function getProDuelOpponentRoster(circuit) {
  return getProCircuitDriverSeeds(circuit)
    .filter(driver=>CANONICAL_PRO_DRIVER_IDS.has(driver.id))
    .map(driver=>({
      ...driver,
      name:driver.name||characters[driver.characterId]?.name||null,
    }))
    .filter(driver=>driver.name)
    .sort((a,b)=>a.id.localeCompare(b.id));
}

// Each event contains only three (or five) heats, but successive entries
// cycle through the FULL 23-driver roster without duplicates within an event.
// The stable order allows every competitor to be encountered over time.
export function selectProDuelOpponents(circuit,{
  eventId='professional',entryOrdinal=0,count=3,
}={}) {
  const roster=getProDuelOpponentRoster(circuit);
  if(!roster.length)return [];
  const total=Math.max(0,Math.min(roster.length,Math.floor(Number(count)||0)));
  const ordinal=Math.max(0,Math.floor(Number(entryOrdinal)||0));
  const start=(stableHash(eventId)%roster.length+
    ordinal*total)%roster.length;
  return Array.from({length:total},(_,index)=>
    roster[(start+index)%roster.length]);
}

export function materialiseProDuelOpponentIdentities(state,circuit) {
  if(!state?.proEvent||!Array.isArray(state.rounds)||
    ![3,5].includes(state.rounds.length))return state;
  const roster=getProDuelOpponentRoster(circuit);
  if(!roster.length)return state;
  const offset=stableHash(state.proSeasonId||state.eventId||'professional')%roster.length;
  const used=new Set();
  let changed=false;
  const rounds=state.rounds.map((round,index)=>{
    if(!round?.carId)return round;
    const explicit=String(round.opponentName||'').trim();
    const namedCharacter=characters[round.characterId]?.name||'';
    const rosterById=roster.find(driver=>driver.id===round.opponentDriverId);
    const rosterByName=roster.find(driver=>
      driver.name.toLowerCase()===explicit.toLowerCase());
    let selected=rosterById||rosterByName||null;
    if(!selected&&!namedCharacter&&(!explicit||anonymousLabel.test(explicit))) {
      for(let step=0;step<roster.length;step++){
        const candidate=roster[(offset+index+step)%roster.length];
        if(!used.has(candidate.id)){selected=candidate;break;}
      }
    }
    if(selected)used.add(selected.id);
    const name=explicit&&!anonymousLabel.test(explicit)
      ? explicit : namedCharacter || selected?.name || explicit;
    const id=selected?.id||round.opponentDriverId||null;
    const characterId=round.characterId||selected?.characterId||null;
    if(name===round.opponentName&&
      (!id||id===round.opponentDriverId)&&
      (!characterId||characterId===round.characterId))return round;
    changed=true;
    return {...round,opponentName:name,
      ...(id?{opponentDriverId:id}:{}),
      ...(characterId?{characterId}:{})};
  });
  return changed?{...state,rounds}:state;
}

// Legacy three-round professional cups use the FourLaneTestScene renderer
// with only the nearest two lanes occupied. Pure, repeat-safe race transitions.
export function getProfessionalDuelRound(state) {
  if (!state || !state.active || !state.proEvent ||
      !Array.isArray(state.rounds) || ![3,5].includes(state.rounds.length)) return null;
  const index = Number(state.roundIndex);
  if (!Number.isInteger(index) || index < 0 || index >= state.rounds.length) return null;
  const round = state.rounds[index];
  if (!round?.carId) return null;
  return { round, roundIndex: index, roundNumber: index + 1, totalRounds: state.rounds.length };
}

export function settleProfessionalDuel(state, playerWon) {
  const current = getProfessionalDuelRound(state);
  if (!current) return {
    status: 'NO_EVENT', nextState: state, cashPrize: 0,
    competitionWinsDelta: 0, roundNumber: null,
  };
  if (!playerWon) return {
    status: 'ELIMINATED', nextState: null, cashPrize: 0,
    competitionWinsDelta: 0, roundNumber: current.roundNumber,
  };
  if (current.roundIndex < current.totalRounds - 1) return {
    status: 'ADVANCED',
    nextState: { ...state, roundIndex: current.roundIndex + 1 },
    cashPrize: 0, competitionWinsDelta: 0, roundNumber: current.roundNumber,
  };
  return {
    status: 'CHAMPION', nextState: null,
    cashPrize: state.prizeType === 'CASH' ?
      Math.max(0, Math.floor(Number(state.prizeCash || 0))) : 0,
    competitionWinsDelta: 1, roundNumber: current.totalRounds,
  };
}
