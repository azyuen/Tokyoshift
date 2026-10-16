// Repeat invitation after the very first seven-driver call-out was declined.
// These are region captain voices, not new lore or re-playable race popups.
export const REGIONAL_CHALLENGE_RETURN_LINES = Object.freeze({
  ODAIBA: Object.freeze([
    "Hey! Ready for our regional challenge? All seven of us are waiting!",
    "It's a proper run through the crew. Come on, give it a go!",
  ]),
  SHINAGAWA: Object.freeze([
    "Ready for the regional challenge? Seven clean results. No shortcuts.",
    "If your car is prepared, we'll start when you say so.",
  ]),
  TATSUMI: Object.freeze([
    "Still considering our regional challenge? Seven drivers, seven runs.",
    "If you're ready to prove your pace, we're here.",
  ]),
  SHIBUYA: Object.freeze([
    "You came back. Ready to take on all seven of us?",
    "A clean sweep would get my attention. So would a good fight.",
  ]),
  YOKOHAMA: Object.freeze([
    "You're here! Are we finally doing the regional challenge?",
    "Seven races, one after another. We've been looking forward to it!",
  ]),
  DAIKOKU: Object.freeze([
    "Ready to compare results against all seven of our drivers?",
    "Same road. Real timing. Your answer decides when we begin.",
  ]),
  SHINJUKU: Object.freeze([
    "There you are! Seven of us, one regional challenge. You in?",
    "Don't keep the crowd waiting forever. This could be a good show!",
  ]),
});
export function getRegionalChallengeReturnLines(regionId) {
  return REGIONAL_CHALLENGE_RETURN_LINES[String(regionId || '').toUpperCase()] ||
    ["Ready for our regional challenge? Try to beat all seven of us.",
     "Your first run is waiting when you are."];
}
