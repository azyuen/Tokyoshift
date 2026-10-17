// Character-specific dialogue for the post-championship crew recruitment loop.
//
// Every recruitable regional character has an explicit slot here so their
// personality can be authored independently without touching recruitment,
// racing or save-state code. Empty entries inherit the fallback copy below.
//
// Supported fields:
//   opening      - first line after the player beats them at a normal Meet
//   reveal       - line that reveals their canonical/signature stock car
//   challenge    - stock-vs-stock challenge line
//   carTagline   - small label beneath the signature-car name
//   acceptLabel  - primary final cutscene button
//   declineLabel - secondary final cutscene button
//   joinLine     - reserved for character-specific post-win dialogue
//   retryLine    - reserved for character-specific post-loss dialogue

export const DEFAULT_CREW_INVITE_DIALOGUE = Object.freeze({
  opening: "You've got my attention. That was a clean run.",
  reveal: "The car you saw tonight isn't the one I'm known for. This is my car: {SIGNATURE_CAR}.",
  challenge: "Stock for stock. Beat me in it and I'll run with your crew.",
  carTagline: 'SIGNATURE CAR // FACTORY SPEC',
  acceptLabel: 'ACCEPT STOCK RACE',
  declineLabel: 'NOT NOW',
  joinLine: "You won. I'm in.",
  retryLine: "Not yet. Come back when you want another run.",
});

export const CREW_INVITE_DIALOGUE = Object.freeze({
  aoiShindou: Object.freeze({}),
  yutoAsakura: Object.freeze({}),
  mikaHoshino: Object.freeze({}),
  kaoriNishimura: Object.freeze({}),
  shunAmamiya: Object.freeze({}),
  akiraShimizu: Object.freeze({}),
  natsumiKagawa: Object.freeze({}),
  reiTakamura: Object.freeze({}),
  goroNakajima: Object.freeze({}),
  tetsuyaKanda: Object.freeze({}),
  sotaKisaragi: Object.freeze({}),
  yuiNaruse: Object.freeze({}),
  daigoMoriyama: Object.freeze({}),
  risaTachikawa: Object.freeze({}),
  masatoKurogane: Object.freeze({}),
  haruSakurai: Object.freeze({}),
  miuTanaka: Object.freeze({}),
  renjiAoki: Object.freeze({}),
  kentoFujisawa: Object.freeze({}),
  rinaTachibana: Object.freeze({}),
  mikaHayase: Object.freeze({}),
  reinaKuroda: Object.freeze({}),
  ryoheiTakeda: Object.freeze({}),
  shunMizuno: Object.freeze({}),
  yuiKanzaki: Object.freeze({}),
  shoNakamura: Object.freeze({}),
  miloArai: Object.freeze({}),
  naoFujita: Object.freeze({}),
  akiSenda: Object.freeze({}),
  tetsuoMori: Object.freeze({}),
  emiSaionji: Object.freeze({}),
  kaedeTachibana: Object.freeze({}),
  renKurosawa: Object.freeze({}),
  rinAmamiya: Object.freeze({}),
  soraKanzaki: Object.freeze({}),
});

const CREW_JOIN_LINES = Object.freeze({
  daigoArakawa: "You have a captain's nerve. I want to see how far we can take this together.",
  kazuoTanaka: "I've raced these streets for years. You're someone worth following.",
  masatoIshikawa: "My pride can take a loss when it's that deserved. Shall we race together?",
  itsukiKuroda: "So that's what real speed looks like! Hey, save a spot in your crew for me.",
  tetsuNakahara: "That was controlled from launch to finish. I'll bring my experience if you'll take me.",
  reikaTachibana: "You didn't just beat me—you made me want to get better. Can I join your team?",
  takumiSerizawa: "You've got the right instincts. I'd be honoured to drive for your crew.",
  aoiShindou: "That wasn't luck. You're the real deal. Let me join your crew.",
  yutoAsakura: "You made every shift count. I'd be proud to race alongside you.",
  mikaHoshino: "Okay, wow. You've convinced me! Got room on your team?",
  kaoriNishimura: "I respect clean driving. You've earned my respect—and my loyalty, if you'll have me.",
  shunAmamiya: "I thought I had you covered. I didn't. Let me learn from the best.",
  akiraShimizu: "That's the kind of captain I can trust. May I come aboard?",
  natsumiKagawa: "That was incredible! Imagine what we could do as teammates!",
  reiTakamura: "No excuses from me. You're faster. I want to be on your side.",
  goroNakajima: "You drive with conviction. I could follow a captain like that.",
  tetsuyaKanda: "My setup was perfect, but your driving was better. Let's build something together.",
  sotaKisaragi: "You read that track better than anyone. Mind if I join your crew?",
  yuiNaruse: "I came to race you. Now I want to race for you. What do you say?",
  daigoMoriyama: "I never offer this lightly. I'd like a place on your team.",
  risaTachikawa: "That was seriously sharp! Let's make the other crews nervous together.",
  masatoKurogane: "You beat me on merit. Let me lend my car and experience to your team.",
  haruSakurai: "That launch was unreal. I'd love to be part of your crew.",
  miuTanaka: "No way, you actually did it! Can I come race with your team?",
  renjiAoki: "I know talent when I see it. You'd make a strong captain.",
  kentoFujisawa: "All right, I'm impressed. How about we race on the same side now?",
  rinaTachibana: "You really are something else. I want in, if the offer's open.",
  mikaHayase: "Champions recognise champions. Let me race under your banner.",
  reinaKuroda: "You've proved you're worth following. Is there room for one more?",
  ryoheiTakeda: "I gave you everything I had. You still won. Let me join up.",
  shunMizuno: "That was the cleanest win I've seen in ages. We should team up.",
  yuiKanzaki: "You earned that victory. I'd rather build a crew with you than chase you.",
  shoNakamura: "You can handle pressure. That's what a good captain needs. Count me in?",
  miloArai: "Now THAT was a race! Imagine us tearing up Tokyo together!",
  naoFujita: "I don't hand out respect for free. You earned mine. Can I join?",
  akiSenda: "You knew exactly when to shift. I'd like to race beside you.",
  tetsuoMori: "The road has spoken. Perhaps my next chapter belongs with your crew.",
  emiSaionji: "Well, you've certainly made an impression. Shall we make this a partnership?",
  kaedeTachibana: "A decisive run. I'd be delighted to contribute to your team.",
  renKurosawa: "I see it now: you lead, and everyone rises. Let me take a place.",
  rinAmamiya: "You've got a real gift. I want to be part of what you're building.",
  soraKanzaki: "I chased that win all night. I'd rather chase the next one together.",
});

function interpolateDialogue(value, variables = {}) {
  if (typeof value !== 'string') return value;
  return value.replace(/\{([A-Z0-9_]+)\}/g, (_, key) =>
    variables[key] == null ? '{' + key + '}' : String(variables[key])
  );
}

export function getCrewInviteDialogue(characterId, variables = {}) {
  const id = String(characterId || '');
  const override = {
    joinLine: CREW_JOIN_LINES[id] || DEFAULT_CREW_INVITE_DIALOGUE.joinLine,
    ...(CREW_INVITE_DIALOGUE[id] || {}),
  };
  const merged = {
    ...DEFAULT_CREW_INVITE_DIALOGUE,
    ...override,
  };

  return Object.fromEntries(
    Object.entries(merged).map(([key, value]) => [
      key,
      interpolateDialogue(value, variables),
    ])
  );
}
