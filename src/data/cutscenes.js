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
    once: false,
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
};

export const CUTSCENE_ORDER = [
  'tunerTeamCallout',
  'tunerShopDiscovery',
  'specialChallengerIntroduction',
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
