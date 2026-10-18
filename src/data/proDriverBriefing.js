// R598 — Open Circuit individual-driver briefing domain helpers.
// No races, fee settlement, physics or crew competition rules are changed here.
export function isOpenDriverBriefing(state) {
  return Boolean(state?.active && state?.proEvent && state?.openCircuit &&
    !state?.openTrophyId && Array.isArray(state?.rounds) &&
    Number.isInteger(Number(state?.roundIndex)) &&
    state.rounds[Number(state.roundIndex)]);
}

export function driverBriefingRules(state, fallback = {}) {
  const saved = state?.briefingRules || {};
  return {
    maxPowerKW: Number.isFinite(saved.maxPowerKW) ? saved.maxPowerKW :
      Number.isFinite(fallback.maxPowerKW) ? fallback.maxPowerKW : null,
    noNos: typeof saved.noNos === 'boolean' ? saved.noNos : Boolean(fallback.noNos),
  };
}

export function driverBriefingEligibility(state, carState = {}, powerKW = 0, owned = [], fallback = {}) {
  const rules = driverBriefingRules(state, fallback);
  const problems = [];
  if (!isOpenDriverBriefing(state)) problems.push('NO ACTIVE OPEN CIRCUIT DRIVER EVENT');
  if (!owned.includes(state?.playerCarId)) problems.push('REGISTERED CAR NOT OWNED');
  if (rules.maxPowerKW != null && (!Number.isFinite(powerKW) || powerKW > rules.maxPowerKW))
    problems.push('POWER EXCEEDS ' + rules.maxPowerKW + ' KW LIMIT');
  const nos = Boolean(carState.nosInstalled) || Number(carState.exhaustNosTuning?.nosKit || 0) > 0;
  if (rules.noNos && nos) problems.push('NOS IS PROHIBITED');
  return { eligible: problems.length === 0, problems, rules };
}

// Advice is shared with the already-shipped Pro Crew cooldown counter: once
// now, then finish the current competition plus two OTHER competitions.
export function driverAdviceStatus(circuit = {}, state = {}) {
  const remaining = Math.max(0, Number(circuit.crewAdviceCooldownUntil || 0) -
    Number(circuit.eventTick || 0));
  const usedThisEvent = Boolean(state.briefingAdviceUsed);
  return { remaining, usedThisEvent,
    available: isOpenDriverBriefing(state) && !usedThisEvent && remaining === 0 };
}

export function consumeDriverAdvice(circuit = {}, state = {}) {
  const status = driverAdviceStatus(circuit, state);
  if (!isOpenDriverBriefing(state)) return { error: 'DRIVER EVENT NO LONGER AVAILABLE' };
  if (status.usedThisEvent) return { error: 'SAYAKA ADVICE ALREADY USED' };
  if (!status.available) return { error: 'SAYAKA AVAILABLE AFTER ' + status.remaining + ' MORE COMPLETED EVENTS' };
  return {
    circuit: { ...circuit, crewAdviceCooldownUntil: Number(circuit.eventTick || 0) + 3 },
    competitionState: { ...state, briefingAdviceUsed: true },
  };
}

export function driverOpponentAdvice(opponentCar = {}, opponent = {}, playerCar = {}) {
  const drivetrain = String(opponentCar.drivetrain || opponentCar.drive || '').toUpperCase();
  const carName = String(opponentCar.shortName || 'car');
  const intro = opponent?.name ? opponent.name.split(' ')[0] + ' is driving a ' + carName + '. ' :
    'The next car is a ' + carName + '. ';
  const note = drivetrain.includes('AWD') || drivetrain.includes('4WD')
    ? "Expect a clean launch from an AWD car. Don't chase the start light; hold your own launch range and stay tidy through second."
    : drivetrain.includes('RWD') || drivetrain === 'FR'
    ? "With rear-wheel drive, too much throttle early can cost traction. Watch your own grip and concentrate on clean shifts."
    : drivetrain.includes('FWD') || drivetrain === 'FF'
    ? "Front-wheel drive can struggle when power overwhelms the front tyres. Keep your launch measured and avoid rushing the first shift."
    : "The first few seconds will matter. Focus on your own launch, shift points, and the best use of your available gears.";
  return 'Hrmmm. ' + intro + note;
}

// Don't delete purchased NOS upgrades. A saved, reversible removal is kept in
// the car state; it survives reload and is restored after the competition ends.
export function toggleBriefingNos(state = {}) {
  const next = { ...state, exhaustNosTuning: { ...(state.exhaustNosTuning || {}) } };
  if (state.proBriefingNosStash) {
    next.nosInstalled = Boolean(state.proBriefingNosStash.nosInstalled);
    next.exhaustNosTuning = { ...(state.proBriefingNosStash.exhaustNosTuning || {}) };
    delete next.proBriefingNosStash;
  } else {
    const fitted = Boolean(state.nosInstalled) || Number(state.exhaustNosTuning?.nosKit || 0) > 0;
    if (!fitted) return state;
    next.proBriefingNosStash = {
      nosInstalled: Boolean(state.nosInstalled),
      exhaustNosTuning: { ...(state.exhaustNosTuning || {}) },
    };
    next.nosInstalled = false;
    next.exhaustNosTuning.nosKit = 0;
    next.exhaustNosTuning.nitrousShot = 0;
  }
  if (state.dyno) next.dyno = { ...state.dyno, officialReading: null };
  return next;
}

export function restoreDriverBriefingNos(carStates = {}, state = {}) {
  const carId = state.playerCarId;
  if (!isOpenDriverBriefing(state) || !carStates[carId]?.proBriefingNosStash) return null;
  return { ...carStates, [carId]: toggleBriefingNos(carStates[carId]) };
}
