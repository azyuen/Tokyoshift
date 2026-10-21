// Optional, purely cosmetic Ginza passenger banter for the named Arkon Den
// developer profile. No telemetry, launch, RPM or shifting advice is exposed.
export const GINZA_BANTER_EXCHANGES = Object.freeze([
  { sayaka: 'Tell me you brought the gallery keys back.', arkon: "Of course. They're somewhere very safe. Probably." },
  { sayaka: 'A normal night out, you said. In a Le Mans car.', arkon: "I never said my definition of normal was affordable." },
  { sayaka: 'This car has a more impressive insurance policy than I do.', arkon: "I'll ask them to put your name on the policy." },
  { sayaka: 'I was promised a quiet evening.', arkon: "It is quiet. I can barely hear you over the engine." },
  { sayaka: 'You look suspiciously pleased with yourself.', arkon: "Good company, excellent car. What's not to like?" },
  { sayaka: 'We could have taken something less conspicuous.', arkon: "And disappoint our invisible audience? Never." },
  { sayaka: 'You do understand this belongs in a collection?', arkon: "Exactly. We're taking the collection for a walk." },
  { sayaka: 'Did you tell security we were going out?', arkon: "I left a note. Very elegant handwriting, too." },
  { sayaka: 'I dressed for dinner, not an automotive press conference.', arkon: "Excellent. I'll handle the awkward questions." },
  { sayaka: 'You brought me along to keep an eye on the car.', arkon: "No, I brought you along for the company. The car's a bonus." },
  { sayaka: 'I hope you have somewhere nice in mind.', arkon: "I do. It's a surprise to both of us." },
  { sayaka: 'This is an extraordinarily expensive way to go out.', arkon: "Then we should choose a very inexpensive restaurant." },
  { sayaka: 'Do you always grin like that when you borrow a car?', arkon: "Only when the curator agrees to come with me." },
  { sayaka: "We've hardly left Ginza and you're already enjoying yourself.", arkon: "Well, your company does improve the mileage." },
  { sayaka: 'I should have insisted on choosing the music.', arkon: "I assumed the engine was our playlist." },
  { sayaka: 'Promise me this little outing stays our little outing.', arkon: "My lips are sealed. Except for the dramatic retelling." },
]);

export function createGinzaBanterState(gear = 0) {
  return {
    lastGear: Number(gear) || 0,
    lastIndex: -1,
    pendingReply: null,
    replyAt: Infinity,
    nextAt: 0.45,
    shiftReadyAt: 5.8,
  };
}

// Pure state machine: pick one quip, give Arkon time to respond, then wait
// several seconds or a later gear change before starting another pair.
export function advanceGinzaBanter(state, {
  elapsed = 0, gear = 0, running = false, finished = false,
} = {}, random = Math.random) {
  if (!state) return null;
  const seconds = Math.max(0, Number(elapsed) || 0);
  const currentGear = Number(gear) || 0;
  const shifted = currentGear > 0 && state.lastGear > 0 &&
    currentGear !== state.lastGear;
  state.lastGear = currentGear;
  if (!running || finished) return null;

  if (state.pendingReply !== null) {
    if (seconds < state.replyAt) return null;
    const text = state.pendingReply;
    state.pendingReply = null;
    state.nextAt = seconds + 4.5;
    state.shiftReadyAt = seconds + 2.8;
    return { speaker: 'arkon', text };
  }
  if (seconds < state.nextAt && !(shifted && seconds >= state.shiftReadyAt)) {
    return null;
  }

  const count = GINZA_BANTER_EXCHANGES.length;
  const raw = Number(random());
  const options = state.lastIndex < 0 ? count : count - 1;
  const pick = Math.min(options - 1, Math.max(0,
    Math.floor((Number.isFinite(raw) ? raw : 0) * options)));
  // Skip the previous exchange so consecutive banter never repeats.
  const index = state.lastIndex < 0
    ? pick
    : pick >= state.lastIndex ? pick + 1 : pick;
  const chosen = GINZA_BANTER_EXCHANGES[index];
  state.lastIndex = index;
  state.pendingReply = chosen.arkon;
  state.replyAt = seconds + 2.45;
  state.nextAt = Infinity;
  return { speaker: 'sayaka', text: chosen.sayaka };
}
