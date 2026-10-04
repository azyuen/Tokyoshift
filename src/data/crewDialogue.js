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

export function getCrewInviteDialogue(characterId) {
  const override = CREW_INVITE_DIALOGUE[String(characterId || '')] || {};
  return {
    ...DEFAULT_CREW_INVITE_DIALOGUE,
    ...override,
  };
}
