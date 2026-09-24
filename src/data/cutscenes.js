export const CUTSCENES = {
  regionalTeamCallout: {
    id: 'regionalTeamCallout',
    title: 'SHINAGAWA // TEAM CALL-OUT',
    category: 'REGION / STORY',
    once: true,
    characters: {
      left: 'natsumiKagawa',
      right: '$PLAYER',
    },
    introCard: {
      character: 'left',
      name: 'NATSUMI KAGAWA',
      subtitle: 'SPOON SPORTS ENGINEER',
    },
    pages: [
      {
        speaker: 'left',
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
        pose: 'win',
        text: 'Seven drivers. Beat the whole team. Then {TUNER} will hear about you.',
      },
    ],
    finalActionLabel: 'ACCEPT CHALLENGE',
  },

  tunerShopDiscovered: {
    id: 'tunerShopDiscovered',
    title: 'SPOON SPORTS // DISCOVERED',
    category: 'TUNER / STORY',
    once: true,
    characters: {
      left: 'natsumiKagawa',
      right: '$PLAYER',
    },
    introCard: {
      character: 'left',
      name: 'NATSUMI KAGAWA',
      subtitle: 'SPOON SPORTS ENGINEER',
    },
    pages: [
      {
        speaker: 'left',
        pose: 'idle',
        text: 'You beat all seven of them.',
      },
      {
        speaker: 'left',
        pose: 'win',
        text: "I've seen enough.",
      },
      {
        speaker: 'left',
        pose: 'idle',
        text: 'Bring your car to {TUNER}.',
      },
    ],
    finalActionLabel: 'CONTINUE',
  },

  specialChallengerIntro: {
    id: 'specialChallengerIntro',
    title: 'SPECIAL CHALLENGER // INTRODUCTION',
    category: 'SPECIAL / STORY',
    once: false,
    characters: {
      left: 'kaitoFujimori',
      right: '$PLAYER',
    },
    pages: [
      {
        speaker: 'left',
        pose: 'idle',
        text: "I've been looking for you.",
      },
      {
        speaker: 'left',
        pose: 'win',
        text: 'Keys for keys.',
      },
      {
        speaker: 'right',
        pose: 'idle',
        text: 'Then stop talking.',
      },
    ],
    finalActionLabel: 'RACE',
  },
};

const sourceValue = (source, key, fallback = null) => {
  if (source && typeof source.get === 'function') {
    const value = source.get(key);
    return value == null ? fallback : value;
  }
  const value = source?.[key];
  return value == null ? fallback : value;
};

export function getCutscene(id) {
  return CUTSCENES[id] || null;
}

export function getCutsceneList() {
  return Object.values(CUTSCENES);
}

export function getCutsceneCharacterIds() {
  const ids = new Set();
  Object.values(CUTSCENES).forEach(cutscene => {
    Object.values(cutscene.characters || {}).forEach(id => {
      if (typeof id === 'string' && id && !id.startsWith('$')) ids.add(id);
    });
  });
  return [...ids];
}

export function hasSeenCutscene(source, id) {
  if (!id) return false;
  const seen = sourceValue(source, 'cutscenesSeen', []);
  return Array.isArray(seen) && seen.includes(String(id));
}

export function markCutsceneSeen(registry, id) {
  if (!registry || typeof registry.get !== 'function' || !id) return [];
  const seen = Array.isArray(registry.get('cutscenesSeen'))
    ? [...registry.get('cutscenesSeen')]
    : [];
  const key = String(id);
  if (!seen.includes(key)) seen.push(key);
  registry.set('cutscenesSeen', seen);
  return seen;
}
