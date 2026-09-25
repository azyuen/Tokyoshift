const sourceValue = (source, key, fallback = null) => {
  if (source && typeof source.get === 'function') {
    const value = source.get(key);
    return value == null ? fallback : value;
  }
  const value = source?.[key];
  return value == null ? fallback : value;
};

export const CUTSCENES = {
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
      {
        speaker: 'left',
        speakerLabel: 'DAICHI SAKAMOTO',
        pose: 'idle',
        text: "You've got enough of a name now. Central Tokyo is open.",
      },
      {
        speaker: 'left',
        speakerLabel: 'DAICHI SAKAMOTO',
        pose: 'idle',
        text: 'Auto Market first. Useful cars. Questionable history.',
      },
    ],
    finalActionLabel: 'OPEN TOKYO MAP',
  },

  ginzaInvitation: {
    id: 'ginzaInvitation',
    category: 'CENTRAL TOKYO / STORY',
    testerLabel: 'Ginza — Private Invitation',
    title: 'GINZA // PRIVATE INVITATION',
    once: true,
    characters: { left: '$HOST', right: '$PLAYER' },
    preview: {
      characterOverrides: { HOST: 'sayakaFujieda' },
      variables: { HOST_NAME: 'SAYAKA FUJIEDA' },
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{HOST_NAME}',
        pose: 'idle',
        text: "Ginza doesn't advertise the cars worth seeing.",
      },
      {
        speaker: 'left',
        speakerLabel: '{HOST_NAME}',
        pose: 'win',
        text: "Your garage has earned a private look. Don't mistake access for ownership.",
      },
    ],
    finalActionLabel: 'ENTER GINZA',
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
        text: 'Win all three and the grand prize is yours.',
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
