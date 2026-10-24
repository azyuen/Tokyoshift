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
