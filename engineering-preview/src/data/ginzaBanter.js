// Optional, purely cosmetic Ginza passenger banter for the named Arkon Den
// developer profile. No telemetry, launch, RPM or shifting advice is exposed.
const CLASSIC_GINZA_BANTER = [
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
];

// Each entry carries speaker-specific emotion/pose keys, ready for later
// Story Mode dialogue authoring without tying expression to race mechanics.
const CLASSIC_GINZA_POSES = [["devUnsure","devTalking"],["devScowl","devLaughing"],["devDisappointed","devTalking"],["devScowl","devLaughing"],["devUnsure","devIdle"],["devLaughing","devLaughing"],["devScowl","devTalking"],["devUnsure","devLaughing"],["devScowl","devTalking"],["devUnsure","devTalking"],["devUnsure","devLaughing"],["devDisappointed","devLaughing"],["devLaughing","devTalking"],["devLaughing","devLaughing"],["devUnsure","devLaughing"],["devScowl","devLaughing"]];
const EXTRA_GINZA_BANTER = [
  [
    "You did reserve somewhere for dinner?",
    "Yes. I reserved the right to improvise.",
    "devUnsure",
    "devLaughing"
  ],
  [
    "The valet may have trouble parking this.",
    "I'll offer to leave it in the dining room.",
    "devUnsure",
    "devTalking"
  ],
  [
    "What exactly was the dress code?",
    "I assumed the car counted as formalwear.",
    "devScowl",
    "devLaughing"
  ],
  [
    "These shoes were not designed for a long walk.",
    "Excellent. We brought a very fast way to avoid one.",
    "devDisappointed",
    "devTalking"
  ],
  [
    "It would be lovely to arrive without an audience.",
    "I'll ask the headlights to be less charismatic.",
    "devUnsure",
    "devLaughing"
  ],
  [
    "You could at least tell me the destination.",
    "That would spoil the suspense. Mostly mine.",
    "devUnsure",
    "devTalking"
  ],
  [
    "This is not the vehicle I would have chosen.",
    "Naturally. You have impeccable judgment.",
    "devLaughing",
    "devIdle"
  ],
  [
    "Your idea of subtlety needs adjustment.",
    "Is a quieter exhaust considered subtle?",
    "devScowl",
    "devTalking"
  ],
  [
    "That restaurant has a very small car park.",
    "Then we shall give the car the larger table.",
    "devUnsure",
    "devLaughing"
  ],
  [
    "I hope you brought a coat.",
    "No. I thought I'd borrow some of your confidence.",
    "devLaughing",
    "devTalking"
  ],
  [
    "I had a lovely, sensible plan for this evening.",
    "I'm delighted one of us was prepared.",
    "devDisappointed",
    "devLaughing"
  ],
  [
    "This is going to appear in someone's photograph.",
    "I'll insist they capture my good side.",
    "devScowl",
    "devLaughing"
  ],
  [
    "The guest book asks for the vehicle's make.",
    "Just write 'very particular.'",
    "devUnsure",
    "devTalking"
  ],
  [
    "I should charge you for the extra cleaning.",
    "I'll put it under entertainment expenses.",
    "devScowl",
    "devLaughing"
  ],
  [
    "We have driven past the same building twice.",
    "I'm assessing it from all available angles.",
    "devUnsure",
    "devTalking"
  ],
  [
    "You know this isn't a taxi service.",
    "Then why is the company so excellent?",
    "devScowl",
    "devLaughing"
  ],
  [
    "I was hoping for a little sophistication.",
    "You'll be pleased to know I wore matching socks.",
    "devLaughing",
    "devTalking"
  ],
  [
    "Please don't announce our arrival.",
    "Of course not. The car has volunteered.",
    "devScowl",
    "devLaughing"
  ],
  [
    "I miss evenings when nobody noticed me.",
    "We could swap places and let me be famous.",
    "devSad",
    "devTalking"
  ],
  [
    "I do not recall approving this itinerary.",
    "It's still awaiting a destination. Very flexible.",
    "devUnsure",
    "devLaughing"
  ],
  [
    "You are treating a museum piece like a weekend runabout.",
    "A museum piece with excellent manners.",
    "devScowl",
    "devTalking"
  ],
  [
    "The paperwork took me three hours.",
    "Then I'll make sure tonight takes at least four.",
    "devDisappointed",
    "devLaughing"
  ],
  [
    "I brought a small handbag, not a tool kit.",
    "I brought optimism. Between us, we're equipped.",
    "devLaughing",
    "devTalking"
  ],
  [
    "Tell me you did not choose a route for the tunnels.",
    "I chose the tunnels for their architecture.",
    "devScowl",
    "devLaughing"
  ],
  [
    "Are you listening to a word I say?",
    "Every one. I just edit them for optimism.",
    "devScowl",
    "devTalking"
  ],
  [
    "I hope the chef isn't waiting on us.",
    "Then perhaps we're finally the special tonight.",
    "devUnsure",
    "devLaughing"
  ],
  [
    "I had expected a quiet cup of tea.",
    "We can still find one. At an interesting speed.",
    "devSad",
    "devTalking"
  ],
  [
    "You have a remarkable talent for complications.",
    "Thank you. I practise on simple evenings.",
    "devDisappointed",
    "devLaughing"
  ],
  [
    "The gallery's reputation is important to me.",
    "Of course. I'll only be mildly memorable.",
    "devLaughing",
    "devIdle"
  ],
  [
    "That corner café would have been quite enough.",
    "It's still there. We've simply taken the scenic introduction.",
    "devSad",
    "devTalking"
  ],
  [
    "I should have known when you said 'ordinary.'",
    "It's my favourite word for extraordinary.",
    "devUnsure",
    "devLaughing"
  ],
  [
    "There is an art to arriving discreetly.",
    "I'm an enthusiastic beginner.",
    "devScowl",
    "devTalking"
  ],
  [
    "You did remember the parking ticket?",
    "I have a feeling it remembered me.",
    "devUnsure",
    "devLaughing"
  ],
  [
    "The security team will have questions.",
    "Then I'll prepare answers of equal quality.",
    "devDisappointed",
    "devTalking"
  ],
  [
    "Why are you checking your reflection?",
    "A fine car deserves a reasonably tidy driver.",
    "devUnsure",
    "devLaughing"
  ],
  [
    "Are you certain the doors will clear the entrance?",
    "I'll let the doorman make a professional assessment.",
    "devScowl",
    "devTalking"
  ],
  [
    "I am not explaining this to the accountants.",
    "That's fair. I'll send them an interpretive drawing.",
    "devScowl",
    "devLaughing"
  ],
  [
    "We could have simply taken the train.",
    "Yes, but it has so many other passengers.",
    "devLaughing",
    "devTalking"
  ],
  [
    "Please remind me why I agreed to this.",
    "I believe I mentioned dinner and impeccable company.",
    "devUnsure",
    "devLaughing"
  ],
  [
    "That sounds like a very expensive evening.",
    "Only until we find the noodle shop.",
    "devScowl",
    "devTalking"
  ],
  [
    "You seem unusually cheerful tonight.",
    "My favourite curator accepted my invitation.",
    "devIdle",
    "devIdle"
  ],
  [
    "You are absolutely impossible sometimes.",
    "And yet you put on the nice earrings.",
    "devScowl",
    "devLaughing"
  ],
  [
    "If someone asks, this is a routine inspection.",
    "I'll wear my most professional expression.",
    "devUnsure",
    "devSerious"
  ],
  [
    "I was quite enjoying the silence.",
    "I'll be silent again. Starting after this sentence.",
    "devLaughing",
    "devTalking"
  ],
  [
    "This is definitely not in the vehicle's manual.",
    "Perhaps the manual needs more personality.",
    "devScowl",
    "devLaughing"
  ],
  [
    "I hope you appreciate the trouble I went to.",
    "I noticed the dress before I noticed the car.",
    "devIdle",
    "devTalking"
  ],
  [
    "I should have specified 'no surprises.'",
    "And I should have read the small print.",
    "devDisappointed",
    "devLaughing"
  ],
  [
    "Do you know how many people ask to see this car?",
    "Enough that I feel very special driving it.",
    "devUnsure",
    "devIdle"
  ],
  [
    "I am beginning to suspect there is no reservation.",
    "There is a very strong intention to make one.",
    "devLaughing",
    "devLaughing"
  ],
  [
    "We should be setting an example.",
    "I am. It's simply an adventurous example.",
    "devScowl",
    "devTalking"
  ],
  [
    "You don't have to make an entrance everywhere.",
    "But look how much fun it is when we're early.",
    "devUnsure",
    "devLaughing"
  ],
  [
    "I would like one evening without a spreadsheet.",
    "Consider the budget officially a work of fiction.",
    "devLaughing",
    "devTalking"
  ],
  [
    "Your confidence is frankly unreasonable.",
    "That's why I keep it in such generous supply.",
    "devScowl",
    "devLaughing"
  ],
  [
    "We have not agreed on a single detail.",
    "Except that the company is pleasant.",
    "devUnsure",
    "devTalking"
  ],
  [
    "I'm afraid those seats cost more than my shoes.",
    "Then your shoes are the bargain of the evening.",
    "devDisappointed",
    "devLaughing"
  ],
  [
    "Please tell me we're not stopping for petrol again.",
    "No. This time we're stopping for excellent coffee.",
    "devScowl",
    "devTalking"
  ],
  [
    "You said you wanted to show me a hidden gem.",
    "I did. It turns out we've been sitting in it.",
    "devUnsure",
    "devLaughing"
  ],
  [
    "We have taken the longest possible route.",
    "I thought you deserved an extended evening.",
    "devIdle",
    "devTalking"
  ],
  [
    "I would rather not attract the police.",
    "Understood. I'll keep my charm within the limit.",
    "devScowl",
    "devSerious"
  ],
  [
    "You know, a simple dinner would have been enough.",
    "It still would be. Especially with you there.",
    "devSad",
    "devIdle"
  ],
  [
    "Do you always have an answer prepared?",
    "Not always. Sometimes they're even good.",
    "devLaughing",
    "devLaughing"
  ],
  [
    "I have managed finer collections than this one.",
    "And fewer troublesome owners, I imagine.",
    "devIdle",
    "devTalking"
  ],
  [
    "I should really get back to the gallery.",
    "In a minute. You haven't finished making fun of me.",
    "devSad",
    "devLaughing"
  ],
  [
    "At least say the evening has been worth it.",
    "I was rather hoping you'd tell me.",
    "devUnsure",
    "devIdle"
  ]
];

export const GINZA_BANTER_EXCHANGES = Object.freeze([
  ...CLASSIC_GINZA_BANTER.map((exchange, index) => Object.freeze({
    ...exchange, sayakaPose: CLASSIC_GINZA_POSES[index][0],
    arkonPose: CLASSIC_GINZA_POSES[index][1],
  })),
  ...EXTRA_GINZA_BANTER.map(([sayaka, arkon, sayakaPose, arkonPose]) =>
    Object.freeze({ sayaka, arkon, sayakaPose, arkonPose })),
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
    const { text, pose } = state.pendingReply;
    state.pendingReply = null;
    state.nextAt = seconds + 4.5;
    state.shiftReadyAt = seconds + 2.8;
    return { speaker: 'arkon', text, pose };
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
  state.pendingReply = { text: chosen.arkon, pose: chosen.arkonPose };
  state.replyAt = seconds + 2.45;
  state.nextAt = Infinity;
  return { speaker: 'sayaka', text: chosen.sayaka, pose: chosen.sayakaPose };
}
