export const characters = {
  renMizuno: {
    id: 'renMizuno',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.88, launchSkill: 0.86, shiftSkill: 0.88, aggression: 0.84 }, betRange: [9000, 14000], competitionPrize: 18000 },
    name: 'Ren Mizuno',
    age: 20,
    hometown: 'Saitama',
    archetype: 'The Quiet Ace',
    roleTags: ['protagonist', 'teammate', 'rival'],
    personality: 'Calm, observant and competitive without needing to show it.',
    bio: 'Ren learned to drive in an ordinary family car and became obsessed with smooth inputs, clean shifts and finding time where nobody else could see it. He is the most natural all-round protagonist: easy to underestimate, difficult to shake once a race starts.',
    drivingStyle: 'Balanced and technical; values clean launches, perfect shifts and carrying speed.',
    tuningFocus: 'Responsive power, gearing and chassis balance.',
    preferredCars: ['ae86', 'fc3s'],
    signatureRace: 'Street Sprint',
    introQuote: 'No drama. Just drive.',
    resultQuotes: {
      win: "Clean enough. That's all I needed.",
      loss: "I know where I lost it.",
    },
    visual: {
      spriteKey: 'characterRenMizuno',
      path: 'assets/Characters/ren_mizuno.png',
    },
  },

  daichiSakamoto: {
    id: 'daichiSakamoto',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.84, launchSkill: 0.90, shiftSkill: 0.86, aggression: 0.80 }, betRange: [8000, 13000], competitionPrize: 17000 },
    name: 'Daichi Sakamoto',
    age: 22,
    hometown: 'Kawaguchi',
    archetype: 'The Builder',
    roleTags: ['workshop', 'mechanic'],
    selectable: false,
    rivalEligible: false,
    workshopNpc: true,
    personality: 'Practical, loyal and quietly confident; happiest with grease on his hands.',
    bio: 'Daichi understands cars before he understands people. He has spent years repairing friends’ machines in cramped garages and knows exactly which upgrades matter and which ones are just noise. In a team he becomes the dependable technical backbone.',
    drivingStyle: 'Launch-focused and consistent; strong under pressure and hard to surprise.',
    tuningFocus: 'Traction, boost response, cooling and reliability.',
    preferredCars: ['evo3', 'wrx22b'],
    signatureRace: 'Standing Start',
    introQuote: 'If I built it right, the car will do the talking.',
    resultQuotes: {
      win: "Good. The setup held together.",
      loss: "Something's off. I'll find it.",
    },
    visual: {
      spriteKey: 'characterDaichiSakamoto',
      path: 'assets/Characters/daichi_sakamoto.png',
    },
  },

  ayaKurose: {
    id: 'ayaKurose',
    skill: { rating: 5, label: 'ELITE', ai: { reactionSkill: 0.92, launchSkill: 0.89, shiftSkill: 0.91, aggression: 0.88 }, betRange: [12000, 18000], competitionPrize: 24000 },
    name: 'Aya Kurose',
    age: 21,
    hometown: 'Yokohama',
    archetype: 'The Ice Line',
    roleTags: ['protagonist', 'teammate', 'rival'],
    personality: 'Cool, sharp-witted and composed; intensely competitive once challenged.',
    bio: 'Aya grew up around late-night expressway culture and developed a taste for long, fast runs where nerve matters as much as power. She rarely raises her voice, but she remembers every loss and comes back faster.',
    drivingStyle: 'High-speed precision with strong mid-race acceleration and measured risk.',
    tuningFocus: 'Turbo response, high-speed stability and braking.',
    preferredCars: ['r32', 'fc3s'],
    signatureRace: 'Wangan Run',
    introQuote: 'Keep up first. Talk later.',
    resultQuotes: {
      win: "You stayed close. Not close enough.",
      loss: "Remember this one. I will.",
    },
    visual: {
      spriteKey: 'characterAyaKurose',
      path: 'assets/Characters/aya_kurose.png',
    },
  },

  kaitoFujimori: {
    id: 'kaitoFujimori',
    skill: { rating: 5, label: 'ELITE', ai: { reactionSkill: 0.95, launchSkill: 0.93, shiftSkill: 0.95, aggression: 0.93 }, betRange: [15000, 22000], competitionPrize: 28000 },
    name: 'Kaito Fujimori',
    age: 23,
    hometown: 'Tokyo',
    archetype: 'The Night Runner',
    roleTags: ['protagonist', 'teammate', 'rival'],
    personality: 'Reserved, stylish and serious about driving; respects skill more than reputation.',
    bio: 'Kaito has already built a name in the city but has no interest in being famous. He appears at meets late, races hard, then disappears. He works well as a mentor-like teammate or as a benchmark rival the player keeps chasing.',
    drivingStyle: 'Fast, disciplined and relentless; strongest in longer races.',
    tuningFocus: 'Power delivery, gearing and aero stability.',
    preferredCars: ['r32', 'evo3'],
    signatureRace: 'Expressway Battle',
    introQuote: 'Speed is easy. Staying fast is the hard part.',
    resultQuotes: {
      win: "Fast is one thing. Finishing first is another.",
      loss: "Good run. You earned that.",
    },
    visual: {
      spriteKey: 'characterKaitoFujimori',
      path: 'assets/Characters/kaito_fujimori.png',
    },
  },

  haruTachibana: {
    id: 'haruTachibana',
    skill: { rating: 2, label: 'ROOKIE', ai: { reactionSkill: 0.58, launchSkill: 0.61, shiftSkill: 0.60, aggression: 0.72 }, betRange: [2000, 5000], competitionPrize: 8000 },
    name: 'Haru Tachibana',
    age: 19,
    hometown: 'Chiba',
    archetype: 'The Rookie Spark',
    roleTags: ['protagonist', 'teammate', 'rival'],
    personality: 'Friendly, impulsive and endlessly enthusiastic about cars.',
    bio: 'Haru is still early in his racing story and makes up for limited money with energy, curiosity and a willingness to try anything. He fits the humble-beginnings phase perfectly and can grow from an eager local racer into a serious contender.',
    drivingStyle: 'Lightweight, late-braking and energetic; sometimes overdrives when excited.',
    tuningFocus: 'Weight reduction, tyres and naturally responsive setups.',
    preferredCars: ['ek9', 'ae86'],
    signatureRace: 'Backstreet Dash',
    introQuote: 'Come on — one run. What’s the worst that could happen?',
    resultQuotes: {
      win: "No way—I actually got you!",
      loss: "Okay... one more lesson learned.",
    },
    visual: {
      spriteKey: 'characterHaruTachibana',
      path: 'assets/Characters/haru_tachibana.png',
    },
  },

  reinaShibata: {
    id: 'reinaShibata',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.86, launchSkill: 0.88, shiftSkill: 0.91, aggression: 0.82 }, betRange: [9000, 14000], competitionPrize: 19000 },
    name: 'Reina Shibata',
    age: 22,
    hometown: 'Kawasaki',
    archetype: 'The Tuner',
    roleTags: ['protagonist', 'teammate', 'rival'],
    personality: 'Confident, analytical and blunt in a useful way.',
    bio: 'Reina tunes by feel, then proves it with data. She can hear when something is wrong before most people can find it on a gauge. As a teammate she unlocks a strong mechanical identity; as a rival she arrives with cars that are always deceptively well sorted.',
    drivingStyle: 'Grip-heavy and efficient; prioritises repeatable pace over flashy moves.',
    tuningFocus: 'Suspension, tyres, boost control and fine setup changes.',
    preferredCars: ['wrx22b', 'evo3'],
    signatureRace: 'Technical Circuit',
    introQuote: 'Your setup is costing you more than your driving.',
    resultQuotes: {
      win: "The numbers were right.",
      loss: "Fine. Back to the data.",
    },
    visual: {
      spriteKey: 'characterReinaShibata',
      path: 'assets/Characters/reina_shibata.png',
    },
  },

  rikuAkamine: {
    id: 'rikuAkamine',
    skill: { rating: 3, label: 'SKILLED', ai: { reactionSkill: 0.80, launchSkill: 0.77, shiftSkill: 0.81, aggression: 0.91 }, betRange: [6000, 11000], competitionPrize: 15000 },
    name: 'Riku Akamine',
    age: 21,
    hometown: 'Shibuya',
    archetype: 'The Showman',
    roleTags: ['protagonist', 'teammate', 'rival'],
    personality: 'Charismatic, cocky and fun until the stakes get serious.',
    bio: 'Riku loves the social side of street racing almost as much as the racing itself. He is the one who knows where the next meet is, who is betting what, and which rival has something to prove. Under the swagger is a genuinely quick driver.',
    drivingStyle: 'Aggressive and opportunistic; loves close races and psychological pressure.',
    tuningFocus: 'Power, nitrous and dramatic but functional street builds.',
    preferredCars: ['fc3s', 'r32'],
    signatureRace: 'Bet Race',
    introQuote: 'Make it interesting and I’m in.',
    resultQuotes: {
      win: "Now that was worth the bet.",
      loss: "All right. You got me this time.",
    },
    visual: {
      spriteKey: 'characterRikuAkamine',
      path: 'assets/Characters/riku_akamine.png',
    },
  },

  emiKanzaki: {
    id: 'emiKanzaki',
    skill: { rating: 3, label: 'SKILLED', ai: { reactionSkill: 0.76, launchSkill: 0.80, shiftSkill: 0.79, aggression: 0.83 }, betRange: [5000, 9000], competitionPrize: 13000 },
    name: 'Emi Kanzaki',
    age: 20,
    hometown: 'Setagaya',
    archetype: 'The Momentum',
    roleTags: ['protagonist', 'teammate', 'rival'],
    personality: 'Bright, competitive and fearless, with a talent for reading other drivers.',
    bio: 'Emi races by rhythm. She watches where opponents hesitate, where they shift, and where their car unsettles, then attacks exactly there. She brings energy to a team and makes a dangerous rival because she improves while the race is still happening.',
    drivingStyle: 'Momentum-based and reactive; strong braking, quick corrections and clever overtakes.',
    tuningFocus: 'Handling, brakes, tyre grip and usable midrange power.',
    preferredCars: ['ek9', 'wrx22b'],
    signatureRace: 'Roll Race',
    introQuote: 'I only need one mistake.',
    resultQuotes: {
      win: "There. That hesitation.",
      loss: "You didn't give me the mistake.",
    },
    visual: {
      spriteKey: 'characterEmiKanzaki',
      path: 'assets/Characters/emi_kanzaki.png',
    },
  },
};

export const characterOrder = [
  'renMizuno',
  'daichiSakamoto',
  'ayaKurose',
  'kaitoFujimori',
  'haruTachibana',
  'reinaShibata',
  'rikuAkamine',
  'emiKanzaki',
];

// Keep the complete roster available for asset loading and workshop NPC use,
 // but expose explicit gameplay pools so non-driving characters can never
 // accidentally leak into profile selection or rival generation.
export const playableCharacterOrder = characterOrder.filter(
  id => characters[id]?.selectable !== false
);

export const rivalCharacterOrder = characterOrder.filter(
  id => characters[id]?.rivalEligible !== false
);

export const characterList = characterOrder.map((id) => characters[id]);
export const playableCharacterList = playableCharacterOrder.map((id) => characters[id]);
export const rivalCharacterList = rivalCharacterOrder.map((id) => characters[id]);

export function getCharacter(id) {
  return characters[id] ?? null;
}
