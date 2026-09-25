const sourceValue = (source, key, fallback = null) => {
  if (source && typeof source.get === 'function') {
    const value = source.get(key);
    return value == null ? fallback : value;
  }
  const value = source?.[key];
  return value == null ? fallback : value;
};

export const CUTSCENES = {
  openingDaichiStory: {
    id: 'openingDaichiStory',
    category: 'OPENING / STORY',
    testerLabel: 'Opening — Daichi & Tokyo Scene',
    title: 'TOKYO SHIFT // FIRST NIGHT',
    once: true,
    characters: { left: 'daichiSakamoto', right: '$PLAYER' },
    pages: [
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "So this is the car your family gave you. After all those years talking about driving, you've finally got one of your own." },
      { speaker: 'right', pose: 'idle', text: "And I've finally moved close enough to actually use it." },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "Your father would've had a list of things to change already. Professional racers never really switch that part of their brain off." },
      { speaker: 'right', pose: 'idle', text: "Watching him race is why I've always wanted to do this." },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'win', text: "Good thing your childhood friend happens to know which end of a spanner to hold." },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "Tokyo has a whole drag scene after dark. Odaiba, Shinagawa, Tatsumi, Shibuya, Shinjuku, Yokohama, Daikoku — every region has its own crowd." },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "Some run as teams. Others just appear when you're cruising between meets. You'll keep finding new people and new cars as your name gets around." },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "Most racers drive whatever they can get access to, but everyone has one car they're really known for. Their best car. Remember that when you learn who you're racing." },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'win', text: "First thing first: learn to launch this one without embarrassing either of us.", emphasis: true },
    ],
    finalActionLabel: 'LEARN THE CAR',
  },

  openingRaceRules: {
    id: 'openingRaceRules',
    category: 'OPENING / SYSTEMS',
    testerLabel: 'Opening — Bets, Pinks & Competitions',
    title: 'THE STREET // WHAT IS AT STAKE',
    once: true,
    characters: { left: 'daichiSakamoto', right: '$PLAYER' },
    pages: [
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "Most races are simple cash bets. Agree on the money, line up, winner gets paid." },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "Pink slips are different. Keys for keys. Lose and that car is gone. If it's your last car, your run is over.", emphasis: true },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "You'll also see three-race competitions. Same car through the bracket, no tuning between rounds. Lose once and the streak is finished." },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "Some competition prizes are vehicle coupons. Two matching coupons can claim most cars for free at the Auto Market." },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'win', text: "The R32 is different. That thing is worth too much to hand out easily — you'll need three R32 coupons." },
    ],
    finalActionLabel: 'GOT IT',
  },

  openingWorkshopGuide: {
    id: 'openingWorkshopGuide',
    category: 'OPENING / WORKSHOP',
    testerLabel: 'Opening — Daichi Workshop Guide',
    title: 'HOME GARAGE // START SMALL',
    once: true,
    characters: { left: 'daichiSakamoto', right: '$PLAYER' },
    pages: [
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "I can help you modify the car here — engine, drivetrain, chassis, exhaust, nitrous. But this is still a home garage." },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "Better parts need better tools, more space and proper equipment. When you can afford a stronger workshop, we'll move up." },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'win', text: "For now, race smart. Learn what the car is good at. And don't put the keys on the line unless you're ready to lose them.", emphasis: true },
    ],
    finalActionLabel: 'START THE NIGHT',
  },

  tunerTeamCallout: {
    id: 'tunerTeamCallout',
    category: 'REGION / STORY',
    testerLabel: 'Shinagawa — Team Call-Out',
    title: '{REGION} // CALL-OUT',
    once: true,
    characters: {
      left: '$NPC',
      right: '$PLAYER',
    },
    preview: {
      characterOverrides: {
        NPC: 'natsumiKagawa',
      },
      variables: {
        REGION: 'SHINAGAWA',
        SHOP: 'SPOON SPORTS',
        NPC_NAME: 'NATSUMI KAGAWA',
        NPC_SUBTITLE: 'SPOON SPORTS ENGINEER',
      },
    },
    introCard: {
      character: 'left',
      name: '{NPC_NAME}',
      subtitle: '{NPC_SUBTITLE}',
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{NPC_NAME}',
        pose: 'idle',
        text: "You've been making a lot of noise around {REGION}.",
      },
      {
        speaker: 'right',
        pose: 'idle',
        text: 'Is that supposed to be an invitation?',
      },
      {
        speaker: 'left',
        speakerLabel: '{NPC_NAME}',
        pose: 'win',
        text: 'Seven drivers. Beat the whole team. Then {SHOP} will hear about it.',
        emphasis: true,
      },
    ],
    finalActionLabel: 'ACCEPT CHALLENGE',
  },

  regionalCrewIntroduction: {
    id: 'regionalCrewIntroduction',
    category: 'REGION / INTRO',
    testerLabel: 'Region — First Crew Contact',
    title: '{REGION} // FIRST CONTACT',
    once: true,
    characters: { left: '$NPC', right: '$PLAYER' },
    preview: {
      characterOverrides: { NPC: 'natsumiKagawa' },
      variables: { REGION: 'SHINAGAWA', NPC_NAME: 'NATSUMI KAGAWA' },
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{NPC_NAME}',
        pose: 'idle',
        text: '{REGION_GREETING}',
      },
      {
        speaker: 'right',
        pose: 'idle',
        text: '{PLAYER_REPLY}',
      },
      {
        speaker: 'left',
        speakerLabel: '{NPC_NAME}',
        pose: 'win',
        text: '{REGION_SENDOFF}',
      },
    ],
    finalActionLabel: 'DRIVE',
  },

  tunerShopDiscovery: {
    id: 'tunerShopDiscovery',
    category: 'TUNER / STORY',
    testerLabel: 'Spoon — Workshop Discovered',
    title: '{SHOP} // DISCOVERED',
    once: true,
    characters: {
      left: '$MECHANIC',
      right: '$PLAYER',
    },
    preview: {
      characterOverrides: {
        MECHANIC: 'natsumiKagawa',
      },
      variables: {
        SHOP: 'SPOON SPORTS',
        MECHANIC_NAME: 'NATSUMI KAGAWA',
        MECHANIC_SUBTITLE: 'SPOON SPORTS ENGINEER',
      },
    },
    introCard: {
      character: 'left',
      name: '{MECHANIC_NAME}',
      subtitle: '{MECHANIC_SUBTITLE}',
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{MECHANIC_NAME}',
        pose: 'idle',
        text: 'You beat all seven of them.',
      },
      {
        speaker: 'left',
        speakerLabel: '{MECHANIC_NAME}',
        pose: 'win',
        text: "I've seen enough.",
      },
      {
        speaker: 'left',
        speakerLabel: '{MECHANIC_NAME}',
        pose: 'idle',
        text: 'Bring your car to my workshop.',
        emphasis: true,
      },
    ],
    finalActionLabel: '{SHOP} DISCOVERED',
  },

  specialChallengerIntroduction: {
    id: 'specialChallengerIntroduction',
    category: 'STREET / EVENT',
    testerLabel: 'Special Challenger — Introduction',
    title: 'SPECIAL CHALLENGER',
    once: true,
    characters: {
      left: '$RIVAL',
      right: '$PLAYER',
    },
    preview: {
      characterOverrides: {
        RIVAL: 'rikuAkamine',
      },
      variables: {
        RIVAL_NAME: 'RIKU AKAMINE',
        RIVAL_SUBTITLE: 'SPECIAL CHALLENGER',
      },
    },
    introCard: {
      character: 'left',
      name: '{RIVAL_NAME}',
      subtitle: '{RIVAL_SUBTITLE}',
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        pose: 'idle',
        text: "I've been looking for you.",
      },
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        pose: 'win',
        text: 'Keys for keys.',
        emphasis: true,
      },
    ],
    finalActionLabel: 'RACE',
  },

  firstPinkSlipChallenge: {
    id: 'firstPinkSlipChallenge',
    category: 'STREET / STAKES',
    testerLabel: 'First Pink Slip — Terms',
    title: 'PINK SLIP // TERMS',
    once: true,
    characters: { left: '$RIVAL', right: '$PLAYER' },
    preview: {
      characterOverrides: { RIVAL: 'rikuAkamine' },
      variables: { RIVAL_NAME: 'RIKU AKAMINE' },
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        pose: 'idle',
        text: 'No cash tonight. Winner takes the other car.',
      },
      {
        speaker: 'right',
        pose: 'idle',
        text: 'So if I lose, you drive mine home.',
      },
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        pose: 'win',
        text: 'Exactly.',
        emphasis: true,
      },
    ],
    finalActionLabel: 'LINE UP',
  },

  firstPinkSlipWin: {
    id: 'firstPinkSlipWin',
    category: 'STREET / RESULT',
    testerLabel: 'First Pink Slip — Win',
    title: 'PINK SLIP // WON',
    once: true,
    characters: { left: '$RIVAL', right: '$PLAYER' },
    preview: {
      characterOverrides: { RIVAL: 'rikuAkamine' },
      variables: { RIVAL_NAME: 'RIKU AKAMINE', CAR: 'SKYLINE' },
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        leftPose: 'loss',
        rightPose: 'win',
        text: 'Fair race. The {CAR} is yours.',
      },
      {
        speaker: 'right',
        leftPose: 'loss',
        rightPose: 'win',
        text: "I'll take care of it.",
      },
    ],
    finalActionLabel: 'TAKE THE KEYS',
  },

  firstPinkSlipLoss: {
    id: 'firstPinkSlipLoss',
    category: 'STREET / RESULT',
    testerLabel: 'First Pink Slip — Loss',
    title: 'PINK SLIP // LOST',
    once: true,
    characters: { left: '$RIVAL', right: '$PLAYER' },
    preview: {
      characterOverrides: { RIVAL: 'rikuAkamine' },
      variables: { RIVAL_NAME: 'RIKU AKAMINE', CAR: 'AE86' },
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        leftPose: 'win',
        rightPose: 'loss',
        text: 'Hand them over.',
        emphasis: true,
      },
      {
        speaker: 'right',
        leftPose: 'win',
        rightPose: 'loss',
        text: 'Take it.',
      },
    ],
    finalActionLabel: 'CONTINUE',
  },

  canalYardUnlocked: {
    id: 'canalYardUnlocked',
    category: 'WORKSHOP / STORY',
    testerLabel: 'Daichi — Canal Yard Unlocked',
    title: 'CANAL YARD // OPEN',
    once: true,
    characters: { left: 'daichiSakamoto', right: '$PLAYER' },
    pages: [
      {
        speaker: 'left',
        speakerLabel: 'DAICHI SAKAMOTO',
        pose: 'idle',
        text: "This place gives us room to do the jobs the home bay can't.",
      },
      {
        speaker: 'left',
        speakerLabel: 'DAICHI SAKAMOTO',
        pose: 'idle',
        text: "More cars. Better parts. Same rule: don't waste money.",
      },
    ],
    finalActionLabel: 'MOVE IN',
  },

  warehouseHqUnlocked: {
    id: 'warehouseHqUnlocked',
    category: 'WORKSHOP / STORY',
    testerLabel: 'Daichi — Warehouse HQ Unlocked',
    title: 'WAREHOUSE HQ // OPEN',
    once: true,
    characters: { left: 'daichiSakamoto', right: '$PLAYER' },
    pages: [
      {
        speaker: 'left',
        speakerLabel: 'DAICHI SAKAMOTO',
        pose: 'idle',
        text: 'Now we have enough space to build properly.',
      },
      {
        speaker: 'left',
        speakerLabel: 'DAICHI SAKAMOTO',
        pose: 'idle',
        text: 'High-tier work starts here. Keep the good cars organised.',
      },
    ],
    finalActionLabel: 'OPEN HQ',
  },

  centralTokyoUnlocked: {
    id: 'centralTokyoUnlocked',
    category: 'CENTRAL TOKYO / STORY',
    testerLabel: 'Daichi — Central Tokyo Opens',
    title: 'CENTRAL TOKYO // OPEN',
    once: true,
    characters: { left: 'daichiSakamoto', right: '$PLAYER' },
    pages: [
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "You've made enough noise that people have started passing your name around." },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "There's another side of the scene in Central Tokyo. Less standing around at meets, more cars and money changing hands." },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "The Auto Market sells used street cars — some stock, some already modified. If you win a car you don't want, they'll buy it from you too." },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'win', text: "Competition coupons get redeemed there as well. I've added Central Tokyo to your map.", emphasis: true },
    ],
    finalActionLabel: 'UNLOCK CENTRAL TOKYO',
  },

  ginzaInvitation: {
    id: 'ginzaInvitation',
    category: 'CENTRAL TOKYO / STORY',
    testerLabel: 'Ginza — Private Invitation',
    title: 'GINZA // PRIVATE INVITATION',
    once: true,
    characters: { left: '$HOST', right: '$PLAYER' },
    preview: { characterOverrides: { HOST: 'sayakaFujieda' }, variables: { HOST_NAME: 'SAYAKA FUJIEDA' } },
    pages: [
      { speaker: 'left', speakerLabel: '{HOST_NAME}', pose: 'idle', text: "Your name came up tonight. That doesn't happen often with the people I'm calling for." },
      { speaker: 'left', speakerLabel: '{HOST_NAME}', pose: 'idle', text: "There's a private collection in Ginza. Complete tuner builds, competition cars, and cars with histories that don't appear in normal listings." },
      { speaker: 'left', speakerLabel: '{HOST_NAME}', pose: 'idle', text: "The gallery isn't open to the public. You've been invited to see the collection — and if you can afford one, you can buy it." },
      { speaker: 'left', speakerLabel: '{HOST_NAME}', pose: 'win', text: "One rule: collector cars stay complete. You buy the finished car, not a project to tear apart.", emphasis: true },
    ],
    finalActionLabel: 'UNLOCK GINZA',
  },

  dragComplexInvitation: {
    id: 'dragComplexInvitation',
    category: 'CENTRAL TOKYO / STORY',
    testerLabel: 'Drag Complex — Invitation',
    title: 'TOKYO DRAG COMPLEX // INVITED',
    once: true,
    characters: { left: '$PROMOTER', right: '$PLAYER' },
    preview: { characterOverrides: { PROMOTER: 'tetsuyaKanda' }, variables: { PROMOTER_NAME: 'TETSUYA KANDA' } },
    pages: [
      { speaker: 'left', speakerLabel: '{PROMOTER_NAME}', pose: 'idle', text: "Your street record got their attention. The Drag Complex wants you on a proper timing board." },
      { speaker: 'left', speakerLabel: '{PROMOTER_NAME}', pose: 'idle', text: "These are organised three-race brackets with entry fees and serious prize money. No casual rematches halfway through." },
      { speaker: 'left', speakerLabel: '{PROMOTER_NAME}', pose: 'idle', text: "Some events cap power. Some ban nitrous. Others let you bring whatever you've built. Read the rules before you enter." },
      { speaker: 'left', speakerLabel: '{PROMOTER_NAME}', pose: 'win', text: "Win there and nobody can write your street record off as luck. Your invitation is active.", emphasis: true },
    ],
    finalActionLabel: 'UNLOCK DRAG COMPLEX',
  },

  ginzaHeroCarReveal: {
    id: 'ginzaHeroCarReveal',
    category: 'CENTRAL TOKYO / COLLECTOR',
    testerLabel: 'Ginza — First Hero Car',
    title: 'GINZA // COLLECTOR CAR',
    once: true,
    characters: { left: '$HOST', right: '$PLAYER' },
    preview: {
      characterOverrides: { HOST: 'sayakaFujieda' },
      variables: { HOST_NAME: 'SAYAKA FUJIEDA', CAR: 'FORTUNE RX-7' },
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{HOST_NAME}',
        pose: 'idle',
        text: 'That {CAR} is not stock, and it is not a blank canvas.',
      },
      {
        speaker: 'left',
        speakerLabel: '{HOST_NAME}',
        pose: 'win',
        text: 'Collector cars stay complete. Buy the car, not a project.',
      },
    ],
    finalActionLabel: 'VIEW CAR',
  },

  dragComplexInvitation: {
    id: 'dragComplexInvitation',
    category: 'CENTRAL TOKYO / STORY',
    testerLabel: 'Drag Complex — Invitation',
    title: 'TOKYO DRAG COMPLEX',
    once: true,
    characters: { left: '$PROMOTER', right: '$PLAYER' },
    preview: {
      characterOverrides: { PROMOTER: 'tetsuyaKanda' },
      variables: { PROMOTER_NAME: 'TETSUYA KANDA' },
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{PROMOTER_NAME}',
        pose: 'idle',
        text: 'Street wins got their attention.',
      },
      {
        speaker: 'left',
        speakerLabel: '{PROMOTER_NAME}',
        pose: 'win',
        text: 'Three-race brackets. Proper limits. No excuses.',
      },
    ],
    finalActionLabel: 'ENTER DRAG COMPLEX',
  },

  competitionIntroduction: {
    id: 'competitionIntroduction',
    category: 'COMPETITION / STORY',
    testerLabel: 'Competition — First Entry',
    title: 'COMPETITION // STREET THREE',
    once: true,
    characters: { left: '$PROMOTER', right: '$PLAYER' },
    preview: {
      characterOverrides: { PROMOTER: 'tetsuyaKanda' },
      variables: { PROMOTER_NAME: 'TETSUYA KANDA' },
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{PROMOTER_NAME}',
        pose: 'idle',
        text: 'Three races. Same car. No tuning between rounds.',
      },
      {
        speaker: 'left',
        speakerLabel: '{PROMOTER_NAME}',
        pose: 'win',
        text: 'Win all three and the grand prize is yours. Vehicle prizes come as car-specific coupons — collect enough and the Auto Market will hand over the car.',
      },
    ],
    finalActionLabel: 'VIEW BRACKET',
  },

  competitionChampion: {
    id: 'competitionChampion',
    category: 'COMPETITION / RESULT',
    testerLabel: 'Competition — First Championship',
    title: 'COMPETITION // CLEARED',
    once: true,
    characters: { left: '$PROMOTER', right: '$PLAYER' },
    preview: {
      characterOverrides: { PROMOTER: 'tetsuyaKanda' },
      variables: { PROMOTER_NAME: 'TETSUYA KANDA' },
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{PROMOTER_NAME}',
        pose: 'idle',
        text: "Three straight. That's the whole argument.",
      },
      {
        speaker: 'right',
        pose: 'win',
        text: "What's next?",
      },
      {
        speaker: 'left',
        speakerLabel: '{PROMOTER_NAME}',
        pose: 'win',
        text: 'Something faster.',
        emphasis: true,
      },
    ],
    finalActionLabel: 'CONTINUE',
  }
};

export const CUTSCENE_ORDER = [
  'openingDaichiStory',
  'openingRaceRules',
  'openingWorkshopGuide',
  'tunerTeamCallout',
  'regionalCrewIntroduction',
  'tunerShopDiscovery',
  'specialChallengerIntroduction',
  'firstPinkSlipChallenge',
  'firstPinkSlipWin',
  'firstPinkSlipLoss',
  'canalYardUnlocked',
  'warehouseHqUnlocked',
  'centralTokyoUnlocked',
  'ginzaInvitation',
  'ginzaHeroCarReveal',
  'dragComplexInvitation',
  'competitionIntroduction',
  'competitionChampion',
];

export function getCutscene(id) {
  return CUTSCENES[id] || null;
}

export function getCutsceneIds() {
  return CUTSCENE_ORDER.filter(id => CUTSCENES[id]);
}

export function hasSeenCutscene(source, id) {
  if (!id) return false;
  const seen = sourceValue(source, 'cutscenesSeen', []);
  return Array.isArray(seen) && seen.includes(String(id));
}

export function markCutsceneSeen(registry, id) {
  if (!registry || !id) return [];
  const seen = Array.isArray(registry.get('cutscenesSeen'))
    ? registry.get('cutscenesSeen')
    : [];
  const next = [...new Set([...seen.map(String), String(id)])];
  registry.set('cutscenesSeen', next);
  return next;
}
