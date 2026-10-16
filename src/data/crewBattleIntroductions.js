// Regional Crew Battles: short invitations voiced by the permanent region
// leader and a REAL opponent from the three-driver lineup. The character
// bible (docs/CHARACTER_BIBLE.md) governs tone; no secret plot revelations.
// Each region cycles through three distinct exchanges on successive visits.
export const REGIONAL_CREW_BATTLE_LINES = Object.freeze({
  ODAIBA: Object.freeze([
    {
      leader: "Hey! You actually brought your whole crew. I knew you would!",
      rules: "Three drivers each. First crew to take two wins gets the result. Pick your order and stick with it.",
      boast: "We're friendly until the lights turn green. Every one of us can leave that line properly.",
      challenge: "Ready to see whether your crew's as quick as you are?",
    },
    {
      leader: "There you are. Please tell me you didn't bring three people just to watch.",
      rules: "Three against three, best of three races. Every driver gets their own car and their own shot.",
      boast: "Around here we help each other get faster. You're racing all that practice tonight.",
      challenge: "Well? Should we put your crew on the board?",
    },
    {
      leader: "Okay, now this is interesting. Your team against ours!",
      rules: "Line up three drivers. Two wins decides it, and there's no swapping your picks midway.",
      boast: "We know when to push and when to let the car work. Don't confuse that with holding back.",
      challenge: "Want to give us a proper race?",
    },
  ]),
  SHINAGAWA: Object.freeze([
    {
      leader: "You brought three drivers. Good. We have three ready.",
      rules: "One run per matchup. First crew to two wins takes it. Set your order before we start.",
      boast: "Our launches are measured, our shifts are clean. Nobody here needs an excuse afterwards.",
      challenge: "Does your crew want the same terms?",
    },
    {
      leader: "You're on time. That saves us a conversation.",
      rules: "Three against three, best of three. Your chosen drivers stay in that order.",
      boast: "Each of us knows our car. We can repeat a good run, not just get lucky once.",
      challenge: "Are you prepared to test that?",
    },
    {
      leader: "I was wondering whether you'd come back with a crew.",
      rules: "Three drivers each, up to three heats. Two wins settles it. No last-minute substitutions.",
      boast: "We don't make much noise about preparation. You'll notice it when the lights change.",
      challenge: "Ready to line yours up?",
    },
  ]),
  TATSUMI: Object.freeze([
    {
      leader: "You're still here. And you've brought a team.",
      rules: "Three matchups. Two wins settle it. Choose your drivers carefully; the order won't change.",
      boast: "Our crew knows how to hold a clean run from the first metre to the last.",
      challenge: "Have yours prepared just as carefully?",
    },
    {
      leader: "I made time for this. I'd rather race than talk about racing.",
      rules: "Three drivers on each side. First to two victories takes the crew battle.",
      boast: "We've tested the starts, the gearing and the finish. Nothing here is left to guessing.",
      challenge: "Do you accept the comparison?",
    },
    {
      leader: "Good. You've taken the challenge seriously.",
      rules: "Pick three drivers and lock the order. Each matchup counts; win two and the night is yours.",
      boast: "Tatsumi rewards consistency. Our drivers don't lose their heads when a run gets close.",
      challenge: "Ready for the first heat?",
    },
  ]),
  SHIBUYA: Object.freeze([
    {
      leader: "You found us. I hope you also found three drivers worth bringing.",
      rules: "Three versus three. First to two wins. Choose your order now, not after the first loss.",
      boast: "Our crew has more than good-looking cars. We know exactly when to put the power down.",
      challenge: "Want to find that out on the road?",
    },
    {
      leader: "A whole crew. Good. One dramatic entrance would have been enough, though.",
      rules: "Three matchups, two victories to take it. Your lineup is fixed once we begin.",
      boast: "You can photograph the cars later. They're built to finish ahead of yours.",
      challenge: "Still want the challenge?",
    },
    {
      leader: "You've done the introductions. Let's see the driving.",
      rules: "Three drivers per crew. Best of three. Nobody changes places once the order is set.",
      boast: "Around here, style is optional. Fast reactions and a proper finish aren't.",
      challenge: "Shall we make this a real result?",
    },
  ]),
  YOKOHAMA: Object.freeze([
    {
      leader: "Wait, you brought three drivers? Great! We can finally do this properly.",
      rules: "It's three against three. Two wins takes the battle. We pick an order and keep it.",
      boast: "Don't let the welcome fool you. Our crew's put a lot of work into these cars.",
      challenge: "Are your drivers ready? Mine definitely are.",
    },
    {
      leader: "All right! I practised explaining this. Mostly.",
      rules: "Three matchups, first crew to two wins. No changing drivers after we're lined up.",
      boast: "We've got people who know these cars inside out. And we actually listen when they talk.",
      challenge: "Come on, give us a proper run!",
    },
    {
      leader: "Oh, this is going to be good. Your crew's here too!",
      rules: "Choose three racers. Best of three takes the result, so every launch matters.",
      boast: "We're not the loudest crew, but we've got the pace to stay with anyone.",
      challenge: "You in? I promise I'll stop talking when the lights come on.",
    },
  ]),
  DAIKOKU: Object.freeze([
    {
      leader: "Three drivers. Good. Now we can compare more than one setup.",
      rules: "Three matchups, first crew to two wins. Fix your order before we start.",
      boast: "We've spent hours getting traction and delivery right. The numbers aren't guesses.",
      challenge: "Would your crew like to verify them?",
    },
    {
      leader: "I don't need promises. I need three clean results.",
      rules: "Three drivers each. Win two heats to take the battle. No switching the lineup.",
      boast: "Everyone here can explain what their car does and why. That's our advantage.",
      challenge: "Are you ready to prove yours?",
    },
    {
      leader: "Your crew looks prepared. We'll see if the runs agree.",
      rules: "Best of three, one matchup at a time. Two wins are enough to decide it.",
      boast: "We know what works under load, not just what looks good on a dyno sheet.",
      challenge: "Same conditions. Do we have a race?",
    },
  ]),
  SHINJUKU: Object.freeze([
    {
      leader: "Look who brought a crew! Now THAT is worth staying out for.",
      rules: "Three against three, first team to two wins. Pick the order. No mid-show rewrites.",
      boast: "Our cars don't just look the part. Every driver here can back up the noise.",
      challenge: "You accepting, or am I doing the introductions again?",
    },
    {
      leader: "Full lineup? Beautiful. This could be tonight's best finish.",
      rules: "Three drivers on each side, best of three. Once the roster's set, it stays set.",
      boast: "We've built for hard launches and stronger finishes. The results speak louder than the crowd.",
      challenge: "Ready to put your team next to ours?",
    },
    {
      leader: "Three of yours against three of mine. Finally, a proper headline.",
      rules: "Two wins takes the series. Choose your drivers now; there are no substitutions.",
      boast: "There's nothing improvised about our preparation. Every one of us earned a place here.",
      challenge: "Want to make this a night worth remembering?",
    },
  ]),
});

export function getRegionalCrewBattleDialogue(regionId, visit = 0) {
  const region = String(regionId || '').toUpperCase();
  const variants = REGIONAL_CREW_BATTLE_LINES[region];
  if (!variants?.length) return null;
  const index = ((Math.trunc(Number(visit) || 0) % variants.length) + variants.length) % variants.length;
  return { ...variants[index], regionId: region, variantIndex: index };
}

export function createRegionalCrewBattleIntroduction(regionId, visit = 0) {
  const lines = getRegionalCrewBattleDialogue(regionId, visit);
  if (!lines) return null;
  return {
    id: 'regionalCrewBattleIntroduction',
    category: 'CREW / BATTLE',
    title: lines.regionId + ' // CREW BATTLE',
    once: false,
    characters: { left: '$LEADER', right: '$CHALLENGER' },
    introCard: {
      character: 'left',
      name: '{LEADER_NAME}',
      subtitle: lines.regionId + ' // REGIONAL LEADER',
    },
    pages: [
      { speaker: 'left', pose: 'idle', text: lines.leader },
      { speaker: 'left', pose: 'idle', text: lines.rules },
      { speaker: 'right', pose: 'idle', text: lines.boast },
      {
        speaker: 'right',
        pose: 'win',
        text: lines.challenge,
        emphasis: true,
        requireActionButton: true,
      },
    ],
    finalActionLabel: 'ACCEPT CHALLENGE',
    secondaryFinalActionLabel: 'RACE LATER',
  };
}
