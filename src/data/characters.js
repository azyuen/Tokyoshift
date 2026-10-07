export const CHARACTER_ASSET_VERSION = '20261007-r411';

export function getCharacterAssetUrl(path) {
  if (!path) return null;
  const separator = String(path).includes('?') ? '&' : '?';
  return String(path) + separator + 'v=' + encodeURIComponent(CHARACTER_ASSET_VERSION);
}

export const DEFAULT_CHARACTER_PROFILE = Object.freeze({
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  poses: Object.freeze({}),
});

// The seven selectable lead characters also exist in the world as authored
// regional rivals. When the active profile chose that same avatar, keep the
// rival's identity, dialogue, car and AI but render a same-gender substitute
// so the player never races or meets an alternate copy of themselves.
export const RIVAL_SUBSTITUTE_VISUALS = Object.freeze({
  male: Object.freeze({
    spriteKey: 'characterMaleSubstitute',
    path: 'assets/Characters/male_sub_idle.png',
    winSpriteKey: 'characterMaleSubstituteWin',
    winPath: 'assets/Characters/male_sub_win.png',
    lossSpriteKey: 'characterMaleSubstituteLoss',
    lossPath: 'assets/Characters/male_sub_loss.png',
  }),
  female: Object.freeze({
    spriteKey: 'characterFemaleSubstitute',
    path: 'assets/Characters/female_sub_idle.png',
    winSpriteKey: 'characterFemaleSubstituteWin',
    winPath: 'assets/Characters/female_sub_win.png',
    lossSpriteKey: 'characterFemaleSubstituteLoss',
    lossPath: 'assets/Characters/female_sub_loss.png',
  }),
});

const RIVAL_SUBSTITUTE_KIND_BY_CHARACTER = Object.freeze({
  renMizuno: 'male',
  kaitoFujimori: 'male',
  haruTachibana: 'male',
  rikuAkamine: 'male',
  ayaKurose: 'female',
  reinaShibata: 'female',
  emiKanzaki: 'female',
});

export const RIVAL_REPLACEMENT_CHARACTER_IDS = Object.freeze({
  male: 'keiNomura',
  female: 'amiOkada',
});

export const characters = {
  renMizuno: {
    id: 'renMizuno',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.88, launchSkill: 0.86, shiftSkill: 0.88, aggression: 0.84 }, betRange: [9000, 14000], competitionPrize: 18000 },
    name: 'Ren Mizuno',
    age: 20,
    hometown: 'Saitama',
    archetype: 'The Quiet Ace',
    roleTags: ['protagonist', 'teammate', 'rival', 'shinagawa', 'team', 'main-rival'],
    regionId: 'SHINAGAWA',
    regionExclusive: true,
    mainRival: true,
    teamRole: 'mainRival',
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
      winSpriteKey: 'characterRenMizunoWin',
      winPath: 'assets/Characters/ren_mizuno_win.png',
      lossSpriteKey: 'characterRenMizunoLoss',
      lossPath: 'assets/Characters/ren_mizuno_loss.png',
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
    roleTags: ['protagonist', 'teammate', 'rival', 'shibuya', 'team', 'main-rival'],
    regionId: 'SHIBUYA',
    regionExclusive: true,
    mainRival: true,
    teamRole: 'mainRival',
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
      winSpriteKey: 'characterAyaKuroseWin',
      winPath: 'assets/Characters/aya_kurose_win.png',
      lossSpriteKey: 'characterAyaKuroseLoss',
      lossPath: 'assets/Characters/aya_kurose_loss.png',
    },
  },

  kaitoFujimori: {
    id: 'kaitoFujimori',
    skill: { rating: 5, label: 'ELITE', ai: { reactionSkill: 0.95, launchSkill: 0.93, shiftSkill: 0.95, aggression: 0.93 }, betRange: [15000, 22000], competitionPrize: 28000 },
    name: 'Kaito Fujimori',
    age: 23,
    hometown: 'Tokyo',
    archetype: 'The Night Runner',
    roleTags: ['protagonist', 'teammate', 'rival', 'tatsumi', 'team', 'main-rival'],
    regionId: 'TATSUMI',
    regionExclusive: true,
    mainRival: true,
    teamRole: 'mainRival',
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
      winSpriteKey: 'characterKaitoFujimoriWin',
      winPath: 'assets/Characters/kaito_fujimori_win.png',
      lossSpriteKey: 'characterKaitoFujimoriLoss',
      lossPath: 'assets/Characters/kaito_fujimori_loss.png',
    },
  },

  sotaKisaragi: {
    id: 'sotaKisaragi',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.90, launchSkill: 0.88, shiftSkill: 0.93, aggression: 0.72 }, betRange: [10000, 15500], competitionPrize: 21000 },
    name: 'Sota Kisaragi',
    age: 27,
    hometown: 'Edogawa',
    archetype: 'The Systems Driver',
    roleTags: ['rival', 'tatsumi', 'team', 'specialist'],
    selectable: false,
    rivalEligible: true,
    regionId: 'TATSUMI',
    regionExclusive: true,
    teamRole: 'technical-specialist',
    personality: 'Quiet, exacting and intensely observant; he notices mechanical changes other drivers miss.',
    bio: 'Sota treats every run like a controlled experiment. He speaks little at meets, but can identify a bad shift point or unstable setup after watching only a few seconds.',
    drivingStyle: 'Precise and repeatable, with excellent shift timing and very little wasted movement.',
    tuningFocus: 'ECU calibration, gearing, boost response and telemetry.',
    preferredCars: ['evo3', 'r32'],
    signatureRace: 'Roll Race',
    introQuote: 'Your car told me what it does. Now show me what you do.',
    resultQuotes: {
      win: 'The result matched the data.',
      loss: 'Interesting. I missed a variable.',
    },
    visual: {
      spriteKey: 'characterSotaKisaragi',
      path: 'assets/Characters/Tatsumi/sota_kisaragi_idle.png',
      winSpriteKey: 'characterSotaKisaragiWin',
      winPath: 'assets/Characters/Tatsumi/sota_kisaragi_win.png',
      lossSpriteKey: 'characterSotaKisaragiLoss',
      lossPath: 'assets/Characters/Tatsumi/sota_kisaragi_loss.png',
    },
  },

  yuiNaruse: {
    id: 'yuiNaruse',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.91, launchSkill: 0.86, shiftSkill: 0.92, aggression: 0.70 }, betRange: [10000, 16000], competitionPrize: 21500 },
    name: 'Yui Naruse',
    age: 30,
    hometown: 'Koto',
    archetype: 'The Precision Line',
    roleTags: ['rival', 'tatsumi', 'team', 'precision'],
    selectable: false,
    rivalEligible: true,
    regionId: 'TATSUMI',
    regionExclusive: true,
    teamRole: 'precision-racer',
    personality: 'Controlled, perceptive and cool under pressure; she dislikes wasted motion and wasted words.',
    bio: 'Yui built her reputation on clean, measured runs and an uncanny ability to repeat the same launch. Tatsumi regulars know that if she is beside you at the line, you will not get a free mistake.',
    drivingStyle: 'Smooth, disciplined and exceptionally consistent.',
    tuningFocus: 'Traction, suspension balance and usable midrange power.',
    preferredCars: ['wrx22b', 'evo3'],
    signatureRace: 'Quarter Mile',
    introQuote: 'One clean run is enough.',
    resultQuotes: {
      win: 'Exactly as planned.',
      loss: 'That was cleaner than mine.',
    },
    visual: {
      spriteKey: 'characterYuiNaruse',
      path: 'assets/Characters/Tatsumi/yui_naruse_idle.png',
      winSpriteKey: 'characterYuiNaruseWin',
      winPath: 'assets/Characters/Tatsumi/yui_naruse_win.png',
      lossSpriteKey: 'characterYuiNaruseLoss',
      lossPath: 'assets/Characters/Tatsumi/yui_naruse_loss.png',
    },
  },

  daigoMoriyama: {
    id: 'daigoMoriyama',
    skill: { rating: 5, label: 'ELITE', ai: { reactionSkill: 0.91, launchSkill: 0.94, shiftSkill: 0.93, aggression: 0.76 }, betRange: [14000, 21000], competitionPrize: 27000 },
    name: 'Daigo Moriyama',
    age: 52,
    hometown: 'Adachi',
    archetype: 'The Old Hand',
    roleTags: ['rival', 'tatsumi', 'team', 'veteran'],
    selectable: false,
    rivalEligible: true,
    regionId: 'TATSUMI',
    regionExclusive: true,
    teamRole: 'veteran',
    personality: 'Dry, patient and quietly formidable; he has no interest in impressing anyone.',
    bio: 'Daigo was racing the bay roads before most of the current crew had licences. He no longer appears every night, which only makes people pay more attention when he does.',
    drivingStyle: 'Unhurried, smooth and brutally consistent once the race begins.',
    tuningFocus: 'Reliability, gearing and high-speed stability.',
    preferredCars: ['r32', 'fc3s'],
    signatureRace: 'Night Cup',
    introQuote: 'You do not need to rush to be fast.',
    resultQuotes: {
      win: 'Patience still works.',
      loss: 'Good. The next generation should be faster.',
    },
    visual: {
      spriteKey: 'characterDaigoMoriyama',
      path: 'assets/Characters/Tatsumi/daigo_moriyama_idle.png',
      winSpriteKey: 'characterDaigoMoriyamaWin',
      winPath: 'assets/Characters/Tatsumi/daigo_moriyama_win.png',
      lossSpriteKey: 'characterDaigoMoriyamaLoss',
      lossPath: 'assets/Characters/Tatsumi/daigo_moriyama_loss.png',
    },
  },

  risaTachikawa: {
    id: 'risaTachikawa',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.93, launchSkill: 0.90, shiftSkill: 0.91, aggression: 0.84 }, betRange: [11000, 17000], competitionPrize: 22500 },
    name: 'Risa Tachikawa',
    age: 34,
    hometown: 'Setagaya',
    archetype: 'The Interceptor',
    roleTags: ['rival', 'tatsumi', 'team', 'specialist'],
    selectable: false,
    rivalEligible: true,
    regionId: 'TATSUMI',
    regionExclusive: true,
    teamRole: 'specialist',
    personality: 'Sharp, self-contained and competitive; she prefers difficult opponents to easy attention.',
    bio: 'Risa rarely joins casual runs. She turns up when the field is strong, studies the quickest car in the group, and goes directly after it.',
    drivingStyle: 'Fast-reacting and adaptive, with strong pressure in close races.',
    tuningFocus: 'Braking, response and high-grip chassis setups.',
    preferredCars: ['evo3', 'ek9'],
    signatureRace: 'Eliminator',
    introQuote: 'If you are the quickest here, prove it.',
    resultQuotes: {
      win: 'That was the right target.',
      loss: 'Good. You were worth chasing.',
    },
    visual: {
      spriteKey: 'characterRisaTachikawa',
      path: 'assets/Characters/Tatsumi/risa_tachikawa_idle.png',
      winSpriteKey: 'characterRisaTachikawaWin',
      winPath: 'assets/Characters/Tatsumi/risa_tachikawa_win.png',
      lossSpriteKey: 'characterRisaTachikawaLoss',
      lossPath: 'assets/Characters/Tatsumi/risa_tachikawa_loss.png',
    },
  },

  masatoKurogane: {
    id: 'masatoKurogane',
    skill: { rating: 5, label: 'ELITE', ai: { reactionSkill: 0.92, launchSkill: 0.95, shiftSkill: 0.96, aggression: 0.79 }, betRange: [14500, 22000], competitionPrize: 28000 },
    name: 'Masato Kurogane',
    age: 45,
    hometown: 'Nerima',
    archetype: 'The Street Master',
    roleTags: ['rival', 'tatsumi', 'team', 'master'],
    selectable: false,
    rivalEligible: true,
    regionId: 'TATSUMI',
    regionExclusive: true,
    teamRole: 'master',
    personality: 'Serious, demanding and deeply respected; praise from him is rare and meaningful.',
    bio: 'Masato is one of the names older Tokyo racers mention without explanation. He treats Tatsumi as a proving ground and has little patience for drivers who arrive with more power than discipline.',
    drivingStyle: 'Complete and technically polished, with elite launch and shift execution.',
    tuningFocus: 'Whole-car balance, drivetrain efficiency and power delivery.',
    preferredCars: ['r32', 'evo3'],
    signatureRace: 'Pro Drag',
    introQuote: 'Power is only useful when the driver deserves it.',
    resultQuotes: {
      win: 'You still have work to do.',
      loss: 'Remember that run. You earned it.',
    },
    visual: {
      spriteKey: 'characterMasatoKurogane',
      path: 'assets/Characters/Tatsumi/masato_kurogane_idle.png',
      winSpriteKey: 'characterMasatoKuroganeWin',
      winPath: 'assets/Characters/Tatsumi/masato_kurogane_win.png',
      lossSpriteKey: 'characterMasatoKuroganeLoss',
      lossPath: 'assets/Characters/Tatsumi/masato_kurogane_loss.png',
    },
  },

  tetsuNakahara: {
    id: 'tetsuNakahara',
    skill: { rating: 3, label: 'SKILLED', ai: { reactionSkill: 0.82, launchSkill: 0.89, shiftSkill: 0.84, aggression: 0.78 }, betRange: [6500, 11000], competitionPrize: 15500 },
    name: 'Tetsu Nakahara',
    age: 38,
    hometown: 'Katsushika',
    archetype: 'The Wrench',
    roleTags: ['rival', 'tatsumi', 'team', 'mechanic', 'wildcard'],
    selectable: false,
    rivalEligible: true,
    regionId: 'TATSUMI',
    regionMechanic: true,
    regionMechanicShopId: 'tatsumiJun',
    regionExclusive: true,
    teamRole: 'support-mechanic',
    personality: 'Eccentric, friendly and mechanically obsessive; he is usually fixing something nobody else noticed was wrong.',
    bio: 'Tetsu is Tatsumi’s mechanic, oddball and occasional surprise entrant. He claims he only races to test repairs, but his launches are far too practiced for anyone to believe him.',
    drivingStyle: 'Launch-focused, unconventional and much cleaner than his casual attitude suggests.',
    tuningFocus: 'Drivetrain, traction, cooling and improvised fixes.',
    preferredCars: ['ae86', 'wrx22b'],
    signatureRace: 'Standing Start',
    introQuote: 'I changed one little thing. Might as well test it properly.',
    resultQuotes: {
      win: 'Ha! That part definitely stays.',
      loss: 'Good test. Bad result. Give me ten minutes.',
    },
    visual: {
      spriteKey: 'characterTetsuNakahara',
      path: 'assets/Characters/Tatsumi/tetsu_nakahara_idle.png',
      winSpriteKey: 'characterTetsuNakaharaWin',
      winPath: 'assets/Characters/Tatsumi/tetsu_nakahara_win.png',
      lossSpriteKey: 'characterTetsuNakaharaLoss',
      lossPath: 'assets/Characters/Tatsumi/tetsu_nakahara_loss.png',
    },
  },

  haruTachibana: {
    id: 'haruTachibana',
    skill: { rating: 2, label: 'ROOKIE', ai: { reactionSkill: 0.58, launchSkill: 0.61, shiftSkill: 0.60, aggression: 0.72 }, betRange: [2000, 5000], competitionPrize: 8000 },
    name: 'Haru Tachibana',
    age: 19,
    hometown: 'Chiba',
    archetype: 'The Rookie Spark',
    roleTags: ['protagonist', 'teammate', 'rival', 'yokohama', 'main-rival'],
    regionId: 'YOKOHAMA',
    regionExclusive: true,
    mainRival: true,
    teamRole: 'mainRival',
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
      winSpriteKey: 'characterHaruTachibanaWin',
      winPath: 'assets/Characters/haru_tachibana_win.png',
      lossSpriteKey: 'characterHaruTachibanaLoss',
      lossPath: 'assets/Characters/haru_tachibana_loss.png',
    },
  },

  reinaShibata: {
    id: 'reinaShibata',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.86, launchSkill: 0.88, shiftSkill: 0.91, aggression: 0.82 }, betRange: [9000, 14000], competitionPrize: 19000 },
    name: 'Reina Shibata',
    age: 22,
    hometown: 'Kawasaki',
    archetype: 'The Tuner',
    roleTags: ['protagonist', 'teammate', 'rival', 'daikoku', 'team', 'main-rival'],
    regionId: 'DAIKOKU',
    regionExclusive: true,
    mainRival: true,
    teamRole: 'mainRival',
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
      path: 'assets/Characters/reina_shibata_idle.png',
      winSpriteKey: 'characterReinaShibataWin',
      winPath: 'assets/Characters/reina_shibata_win.png',
      lossSpriteKey: 'characterReinaShibataLoss',
      lossPath: 'assets/Characters/reina_shibata_loss.png',
    },
  },

  kazuoTanaka: {
    id: 'kazuoTanaka',
    skill: { rating: 5, label: 'PRO', ai: { reactionSkill: 0.90, launchSkill: 0.95, shiftSkill: 0.93, aggression: 0.78 }, betRange: [18000, 32000], competitionPrize: 30000 },
    name: 'Kazuo Tanaka',
    age: 53,
    hometown: 'Yokohama',
    archetype: 'The Veteran Builder',
    roleTags: ['rival', 'daikoku', 'team', 'veteran'],
    selectable: false,
    rivalEligible: true,
    regionId: 'DAIKOKU',
    regionExclusive: true,
    teamRole: 'veteran',
    personality: 'Gruff, patient and deeply respected; he has nothing left to prove except that the car is right.',
    bio: 'Kazuo has been building and racing powerful street cars longer than most Daikoku regulars have been driving. He values mechanical honesty, repeatability and people who do their own work.',
    drivingStyle: 'Heavy launch discipline, clean shifts and relentless consistency.',
    tuningFocus: 'Engine durability, drivetrain strength, cooling and usable torque.',
    preferredCars: ['r32', 'evo3', 'wrx22b'],
    signatureRace: 'Quarter Mile',
    introQuote: 'Build it properly. Then prove it.',
    resultQuotes: {
      win: 'A strong car does not need excuses.',
      loss: 'Good. You built something worth respecting.',
    },
    visual: {
      spriteKey: 'characterKazuoTanaka',
      path: 'assets/Characters/Daikoku/kazuo_tanaka_idle.png',
      winSpriteKey: 'characterKazuoTanakaWin',
      winPath: 'assets/Characters/Daikoku/kazuo_tanaka_win.png',
      lossSpriteKey: 'characterKazuoTanakaLoss',
      lossPath: 'assets/Characters/Daikoku/kazuo_tanaka_loss.png',
    },
  },

  miloArai: {
    id: 'miloArai',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.89, launchSkill: 0.91, shiftSkill: 0.90, aggression: 0.84 }, betRange: [12000, 22000], competitionPrize: 22000 },
    name: 'Milo Arai',
    age: 29,
    hometown: 'Tsurumi',
    archetype: 'The Fabricator',
    roleTags: ['rival', 'daikoku', 'team', 'fabricator'],
    selectable: false,
    rivalEligible: true,
    regionId: 'DAIKOKU',
    regionExclusive: true,
    teamRole: 'fabrication-specialist',
    personality: 'Practical, energetic and fiercely proud of anything she has fabricated herself.',
    bio: 'Milo is the crew member people call when a part does not exist yet. Her cars carry handmade solutions everywhere, from brackets and piping to suspension and exhaust work.',
    drivingStyle: 'Quick reactions, aggressive launches and strong confidence under pressure.',
    tuningFocus: 'Fabrication, exhaust flow, intercooling and weight reduction.',
    preferredCars: ['fc3s', 'evo3', 'ae86'],
    signatureRace: 'Standing Start',
    introQuote: 'If I cannot buy the part, I will make a better one.',
    resultQuotes: {
      win: 'Built it. Tested it. Works.',
      loss: 'All right. I know what I am changing.',
    },
    visual: {
      spriteKey: 'characterMiloArai',
      path: 'assets/Characters/Daikoku/milo_arai_idle.png',
      winSpriteKey: 'characterMiloAraiWin',
      winPath: 'assets/Characters/Daikoku/milo_arai_win.png',
      lossSpriteKey: 'characterMiloAraiLoss',
      lossPath: 'assets/Characters/Daikoku/milo_arai_loss.png',
    },
  },

  shoNakamura: {
    id: 'shoNakamura',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.92, launchSkill: 0.88, shiftSkill: 0.88, aggression: 0.91 }, betRange: [10000, 19000], competitionPrize: 20000 },
    name: 'Sho Nakamura',
    age: 23,
    hometown: 'Kawasaki',
    archetype: 'The Young Gearhead',
    roleTags: ['rival', 'daikoku', 'team', 'gearhead'],
    selectable: false,
    rivalEligible: true,
    regionId: 'DAIKOKU',
    regionExclusive: true,
    teamRole: 'street-racer',
    personality: 'Upbeat, curious and mechanically obsessed; he is always pulling something apart to see why it works.',
    bio: 'Sho is the youngest regular in the crew and learned by spending more nights under cars than inside them. He still has youthful energy, but his builds are already seriously quick.',
    drivingStyle: 'Fast reactions, hard launches and fearless commitment.',
    tuningFocus: 'Boost response, gearing, traction and lightweight parts.',
    preferredCars: ['evo3', 'wrx22b', 'ek9'],
    signatureRace: 'Bet Race',
    introQuote: 'I changed three things since yesterday. Want to test them?',
    resultQuotes: {
      win: 'Yes! That setup finally works!',
      loss: 'Okay, okay. Back under the car.',
    },
    visual: {
      spriteKey: 'characterShoNakamura',
      path: 'assets/Characters/Daikoku/sho_nakamura_idle.png',
      winSpriteKey: 'characterShoNakamuraWin',
      winPath: 'assets/Characters/Daikoku/sho_nakamura_win.png',
      lossSpriteKey: 'characterShoNakamuraLoss',
      lossPath: 'assets/Characters/Daikoku/sho_nakamura_loss.png',
    },
  },

  akiSenda: {
    id: 'akiSenda',
    skill: { rating: 5, label: 'PRO', ai: { reactionSkill: 0.95, launchSkill: 0.90, shiftSkill: 0.96, aggression: 0.72 }, betRange: [17000, 30000], competitionPrize: 28500 },
    name: 'Aki Senda',
    age: 27,
    hometown: 'Shin-Koyasu',
    archetype: 'The ECU Specialist',
    roleTags: ['rival', 'daikoku', 'team', 'electronics'],
    selectable: false,
    rivalEligible: true,
    regionId: 'DAIKOKU',
    regionExclusive: true,
    teamRole: 'electronics-specialist',
    personality: 'Quiet, exacting and a little eccentric; Aki trusts clean data more than loud opinions.',
    bio: 'Aki handles ECU work, wiring and electronics for the crew. Their cars tend to look understated until the logs reveal how carefully every parameter has been calibrated.',
    drivingStyle: 'Precise, repeatable and exceptionally clean through every shift.',
    tuningFocus: 'ECU mapping, sensors, boost control and data logging.',
    preferredCars: ['evo3', 'r32', 'wrx22b'],
    signatureRace: 'Roll Race',
    introQuote: 'The log will tell us which car is actually faster.',
    resultQuotes: {
      win: 'Exactly as the data predicted.',
      loss: 'Useful. I need another calibration pass.',
    },
    visual: {
      spriteKey: 'characterAkiSenda',
      path: 'assets/Characters/Daikoku/aki_senda_idle.png',
      winSpriteKey: 'characterAkiSendaWin',
      winPath: 'assets/Characters/Daikoku/aki_senda_win.png',
      lossSpriteKey: 'characterAkiSendaLoss',
      lossPath: 'assets/Characters/Daikoku/aki_senda_loss.png',
    },
  },

  naoFujita: {
    id: 'naoFujita',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.91, launchSkill: 0.87, shiftSkill: 0.92, aggression: 0.75 }, betRange: [12000, 22000], competitionPrize: 22500 },
    name: 'Nao Fujita',
    age: 32,
    hometown: 'Kanagawa',
    archetype: 'The Diagnostician',
    roleTags: ['rival', 'daikoku', 'team', 'diagnostics', 'mechanic'],
    selectable: false,
    rivalEligible: true,
    regionId: 'DAIKOKU',
    regionMechanic: true,
    regionMechanicShopId: 'daikokuReAmemiya',
    regionExclusive: true,
    teamRole: 'diagnostics-specialist',
    personality: 'Dryly funny, observant and methodical; very little escapes her attention.',
    bio: 'Nao specialises in finding the faults everyone else has already spent hours chasing. At Daikoku she is known for turning temperamental cars into brutally dependable ones.',
    drivingStyle: 'Patient, measured and strongest when a race gets technical.',
    tuningFocus: 'Diagnostics, ignition, fuelling, cooling and reliability.',
    preferredCars: ['wrx22b', 'evo3', 'fc3s'],
    signatureRace: 'Technical Sprint',
    introQuote: 'If your car has a problem, the race will find it.',
    resultQuotes: {
      win: 'Nothing failed. That is the point.',
      loss: 'Interesting. Something still needs work.',
    },
    visual: {
      spriteKey: 'characterNaoFujita',
      path: 'assets/Characters/Daikoku/nao_fujita_idle.png',
      winSpriteKey: 'characterNaoFujitaWin',
      winPath: 'assets/Characters/Daikoku/nao_fujita_win.png',
      lossSpriteKey: 'characterNaoFujitaLoss',
      lossPath: 'assets/Characters/Daikoku/nao_fujita_loss.png',
    },
  },

  tetsuoMori: {
    id: 'tetsuoMori',
    skill: { rating: 5, label: 'PRO', ai: { reactionSkill: 0.88, launchSkill: 0.97, shiftSkill: 0.92, aggression: 0.94 }, betRange: [18000, 32000], competitionPrize: 30000 },
    name: 'Tetsuo Mori',
    age: 38,
    hometown: 'Daikoku',
    archetype: 'The Engine Machinist',
    roleTags: ['rival', 'daikoku', 'team', 'engine-builder'],
    selectable: false,
    rivalEligible: true,
    regionId: 'DAIKOKU',
    regionExclusive: true,
    teamRole: 'power-specialist',
    personality: 'Loud, good-humoured and intensely serious about engines.',
    bio: 'Tetsuo machines, assembles and breaks in engines for the crew. His broad build and rough workwear fit the cars he prefers: strong, loud and engineered to survive repeated hard launches.',
    drivingStyle: 'Explosive launches, aggressive shifts and huge straight-line pressure.',
    tuningFocus: 'Bottom-end strength, turbo systems, fuelling and torque.',
    preferredCars: ['r32', 'evo3', 'wrx22b'],
    signatureRace: 'Quarter Mile',
    introQuote: 'If it survives my launch, it is ready.',
    resultQuotes: {
      win: 'That is what torque feels like.',
      loss: 'Ha! Good run. I need more boost.',
    },
    visual: {
      spriteKey: 'characterTetsuoMori',
      path: 'assets/Characters/Daikoku/tetsuo_mori_idle.png',
      winSpriteKey: 'characterTetsuoMoriWin',
      winPath: 'assets/Characters/Daikoku/tetsuo_mori_win.png',
      lossSpriteKey: 'characterTetsuoMoriLoss',
      lossPath: 'assets/Characters/Daikoku/tetsuo_mori_loss.png',
    },
  },

  daigoArakawa: {
    id: 'daigoArakawa',
    skill: { rating: 5, label: 'PRO', ai: { reactionSkill: 0.93, launchSkill: 0.94, shiftSkill: 0.93, aggression: 0.86 }, betRange: [16000, 30000], competitionPrize: 29000 },
    name: 'Daigo Arakawa',
    archetype: 'The Authority',
    roleTags: ['rival', 'shinjuku', 'team', 'mechanic'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHINJUKU',
    regionMechanic: true,
    regionMechanicShopId: 'shinjukuTopSecret',
    regionExclusive: true,
    teamRole: 'ace',
    personality: 'Focused, competitive and at home in Shinjuku’s high-pressure street scene.',
    bio: 'Daigo Arakawa is part of Shinjuku’s late-game racing crew, where polished builds and disciplined driving set the standard.',
    drivingStyle: 'Fast reactions, clean shifts and confident high-speed runs.',
    tuningFocus: 'Balanced power, traction and repeatable street performance.',
    preferredCars: ['r34', 'jza80'],
    signatureRace: 'Quarter Mile',
    introQuote: 'Shinjuku does not give away easy wins.',
    resultQuotes: { win: 'That is the Shinjuku pace.', loss: 'Clean run. You earned it.' },
    visual: {
      spriteKey: 'characterDaigoArakawa',
      path: 'assets/Characters/Shinjuku/daigo_arakawa_idle.png',
      winSpriteKey: 'characterDaigoArakawaWin',
      winPath: 'assets/Characters/Shinjuku/daigo_arakawa_win.png',
      lossSpriteKey: 'characterDaigoArakawaLoss',
      lossPath: 'assets/Characters/Shinjuku/daigo_arakawa_loss.png',
    },
  },

  emiSaionji: {
    id: 'emiSaionji',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.89, launchSkill: 0.9, shiftSkill: 0.92, aggression: 0.82 }, betRange: [10000, 20000], competitionPrize: 21000 },
    name: 'Emi Saionji',
    archetype: 'The Precision',
    roleTags: ['rival', 'shinjuku', 'team'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHINJUKU',
    regionExclusive: true,
    teamRole: 'core',
    personality: 'Focused, competitive and at home in Shinjuku’s high-pressure street scene.',
    bio: 'Emi Saionji is part of Shinjuku’s late-game racing crew, where polished builds and disciplined driving set the standard.',
    drivingStyle: 'Fast reactions, clean shifts and confident high-speed runs.',
    tuningFocus: 'Balanced power, traction and repeatable street performance.',
    preferredCars: ['s2000', 'ek9'],
    signatureRace: 'Standing Start',
    introQuote: 'Shinjuku does not give away easy wins.',
    resultQuotes: { win: 'That is the Shinjuku pace.', loss: 'Clean run. You earned it.' },
    visual: {
      spriteKey: 'characterEmiSaionji',
      path: 'assets/Characters/Shinjuku/emi_saionji_idle.png',
      winSpriteKey: 'characterEmiSaionjiWin',
      winPath: 'assets/Characters/Shinjuku/emi_saionji_win.png',
      lossSpriteKey: 'characterEmiSaionjiLoss',
      lossPath: 'assets/Characters/Shinjuku/emi_saionji_loss.png',
    },
  },

  kaedeTachibana: {
    id: 'kaedeTachibana',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.9, launchSkill: 0.88, shiftSkill: 0.91, aggression: 0.88 }, betRange: [10000, 20000], competitionPrize: 21000 },
    name: 'Kaede Tachibana',
    archetype: 'The Night Runner',
    roleTags: ['rival', 'shinjuku', 'team'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHINJUKU',
    regionExclusive: true,
    teamRole: 'core',
    personality: 'Focused, competitive and at home in Shinjuku’s high-pressure street scene.',
    bio: 'Kaede Tachibana is part of Shinjuku’s late-game racing crew, where polished builds and disciplined driving set the standard.',
    drivingStyle: 'Fast reactions, clean shifts and confident high-speed runs.',
    tuningFocus: 'Balanced power, traction and repeatable street performance.',
    preferredCars: ['fd3s', 'r32'],
    signatureRace: 'Standing Start',
    introQuote: 'Shinjuku does not give away easy wins.',
    resultQuotes: { win: 'That is the Shinjuku pace.', loss: 'Clean run. You earned it.' },
    visual: {
      spriteKey: 'characterKaedeTachibana',
      path: 'assets/Characters/Shinjuku/kaede_tachibana_idle.png',
      winSpriteKey: 'characterKaedeTachibanaWin',
      winPath: 'assets/Characters/Shinjuku/kaede_tachibana_win.png',
      lossSpriteKey: 'characterKaedeTachibanaLoss',
      lossPath: 'assets/Characters/Shinjuku/kaede_tachibana_loss.png',
    },
  },

  renKurosawa: {
    id: 'renKurosawa',
    skill: { rating: 5, label: 'PRO', ai: { reactionSkill: 0.94, launchSkill: 0.92, shiftSkill: 0.95, aggression: 0.84 }, betRange: [16000, 30000], competitionPrize: 29000 },
    name: 'Ren Kurosawa',
    archetype: 'The Technician',
    roleTags: ['rival', 'shinjuku', 'team'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHINJUKU',
    regionExclusive: true,
    teamRole: 'ace',
    personality: 'Focused, competitive and at home in Shinjuku’s high-pressure street scene.',
    bio: 'Ren Kurosawa is part of Shinjuku’s late-game racing crew, where polished builds and disciplined driving set the standard.',
    drivingStyle: 'Fast reactions, clean shifts and confident high-speed runs.',
    tuningFocus: 'Balanced power, traction and repeatable street performance.',
    preferredCars: ['evo6', 'r34'],
    signatureRace: 'Quarter Mile',
    introQuote: 'Shinjuku does not give away easy wins.',
    resultQuotes: { win: 'That is the Shinjuku pace.', loss: 'Clean run. You earned it.' },
    visual: {
      spriteKey: 'characterRenKurosawa',
      path: 'assets/Characters/Shinjuku/ren_kurosawa_idle.png',
      winSpriteKey: 'characterRenKurosawaWin',
      winPath: 'assets/Characters/Shinjuku/ren_kurosawa_win.png',
      lossSpriteKey: 'characterRenKurosawaLoss',
      lossPath: 'assets/Characters/Shinjuku/ren_kurosawa_loss.png',
    },
  },

  rinAmamiya: {
    id: 'rinAmamiya',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.91, launchSkill: 0.89, shiftSkill: 0.9, aggression: 0.9 }, betRange: [10000, 20000], competitionPrize: 21000 },
    name: 'Rin Amamiya',
    archetype: 'The Challenger',
    roleTags: ['rival', 'shinjuku', 'team'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHINJUKU',
    regionExclusive: true,
    teamRole: 'core',
    personality: 'Focused, competitive and at home in Shinjuku’s high-pressure street scene.',
    bio: 'Rin Amamiya is part of Shinjuku’s late-game racing crew, where polished builds and disciplined driving set the standard.',
    drivingStyle: 'Fast reactions, clean shifts and confident high-speed runs.',
    tuningFocus: 'Balanced power, traction and repeatable street performance.',
    preferredCars: ['fd3s', 's15'],
    signatureRace: 'Standing Start',
    introQuote: 'Shinjuku does not give away easy wins.',
    resultQuotes: { win: 'That is the Shinjuku pace.', loss: 'Clean run. You earned it.' },
    visual: {
      spriteKey: 'characterRinAmamiya',
      path: 'assets/Characters/Shinjuku/rin_amamiya_idle.png',
      winSpriteKey: 'characterRinAmamiyaWin',
      winPath: 'assets/Characters/Shinjuku/rin_amamiya_win.png',
      lossSpriteKey: 'characterRinAmamiyaLoss',
      lossPath: 'assets/Characters/Shinjuku/rin_amamiya_loss.png',
    },
  },

  soraKanzaki: {
    id: 'soraKanzaki',
    skill: { rating: 5, label: 'PRO', ai: { reactionSkill: 0.92, launchSkill: 0.95, shiftSkill: 0.92, aggression: 0.91 }, betRange: [16000, 30000], competitionPrize: 29000 },
    name: 'Sora Kanzaki',
    archetype: 'The Ace',
    roleTags: ['rival', 'shinjuku', 'team'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHINJUKU',
    regionExclusive: true,
    teamRole: 'ace',
    personality: 'Focused, competitive and at home in Shinjuku’s high-pressure street scene.',
    bio: 'Sora Kanzaki is part of Shinjuku’s late-game racing crew, where polished builds and disciplined driving set the standard.',
    drivingStyle: 'Fast reactions, clean shifts and confident high-speed runs.',
    tuningFocus: 'Balanced power, traction and repeatable street performance.',
    preferredCars: ['nsx', 'jza80'],
    signatureRace: 'Quarter Mile',
    introQuote: 'Shinjuku does not give away easy wins.',
    resultQuotes: { win: 'That is the Shinjuku pace.', loss: 'Clean run. You earned it.' },
    visual: {
      spriteKey: 'characterSoraKanzaki',
      path: 'assets/Characters/Shinjuku/sora_kanzaki_idle.png',
      winSpriteKey: 'characterSoraKanzakiWin',
      winPath: 'assets/Characters/Shinjuku/sora_kanzaki_win.png',
      lossSpriteKey: 'characterSoraKanzakiLoss',
      lossPath: 'assets/Characters/Shinjuku/sora_kanzaki_loss.png',
    },
  },


  masatoIshikawa: {
    id: 'masatoIshikawa',
    skill: { rating: 5, label: 'PRO', ai: { reactionSkill: 0.92, launchSkill: 0.91, shiftSkill: 0.94, aggression: 0.86 }, betRange: [15000, 28000], competitionPrize: 28000 },
    name: 'Masato Ishikawa',
    archetype: 'The Harbor Ace',
    roleTags: ['rival', 'yokohama', 'team'],
    selectable: false, rivalEligible: true, regionId: 'YOKOHAMA', regionExclusive: true, teamRole: 'ace',
    personality: 'Calm and exacting, with a preference for long, clean pulls.',
    bio: 'A Yokohama regular built around high-speed consistency and disciplined power delivery.',
    drivingStyle: 'Strong top-end pace with precise shifts.', tuningFocus: 'High-speed stability and usable power.',
    preferredCars: ['r34', 'jza80'], signatureRace: 'Half Mile',
    introQuote: 'Yokohama rewards cars that keep pulling.', resultQuotes: { win: 'That is harbor pace.', loss: 'Clean run. You earned it.' },
    visual: { spriteKey: 'characterMasatoIshikawa', path: 'assets/Characters/Yokohama/masato_ishikawa_idle.png', winSpriteKey: 'characterMasatoIshikawaWin', winPath: 'assets/Characters/Yokohama/masato_ishikawa_win.png', lossSpriteKey: 'characterMasatoIshikawaLoss', lossPath: 'assets/Characters/Yokohama/masato_ishikawa_loss.png' },
  },
  mikaHayase: {
    id: 'mikaHayase',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.89, launchSkill: 0.88, shiftSkill: 0.91, aggression: 0.84 }, betRange: [10000, 20000], competitionPrize: 21000 },
    name: 'Mika Hayase', archetype: 'The Precision', roleTags: ['rival', 'yokohama', 'team'],
    selectable: false, rivalEligible: true, regionId: 'YOKOHAMA', regionExclusive: true, teamRole: 'core',
    personality: 'Measured and technical.', bio: 'A Yokohama racer focused on repeatable, efficient passes.',
    drivingStyle: 'Clean launches and consistent shifts.', tuningFocus: 'Balance and traction.',
    preferredCars: ['evo6', 'wrx22b'], signatureRace: 'Quarter Mile',
    introQuote: 'One clean pass tells me enough.', resultQuotes: { win: 'Precision wins.', loss: 'Good run.' },
    visual: { spriteKey: 'characterMikaHayase', path: 'assets/Characters/Yokohama/mika_hayase_idle.png', winSpriteKey: 'characterMikaHayaseWin', winPath: 'assets/Characters/Yokohama/mika_hayase_win.png', lossSpriteKey: 'characterMikaHayaseLoss', lossPath: 'assets/Characters/Yokohama/mika_hayase_loss.png' },
  },
  reinaKuroda: {
    id: 'reinaKuroda',
    skill: { rating: 5, label: 'PRO', ai: { reactionSkill: 0.93, launchSkill: 0.90, shiftSkill: 0.93, aggression: 0.90 }, betRange: [15000, 28000], competitionPrize: 28000 },
    name: 'Reina Kuroda', archetype: 'The Night Runner', roleTags: ['rival', 'yokohama', 'team', 'mechanic'],
    selectable: false, rivalEligible: true, regionId: 'YOKOHAMA',
    regionMechanic: true,
    regionMechanicShopId: 'yokohamaMines', regionExclusive: true, teamRole: 'ace',
    personality: 'Confident and relentless.', bio: 'A Yokohama night runner who thrives when speeds climb.',
    drivingStyle: 'Aggressive top-end acceleration.', tuningFocus: 'Power and gearing.',
    preferredCars: ['r32', 'r34'], signatureRace: 'Half Mile',
    introQuote: 'Keep your foot in it.', resultQuotes: { win: 'You lifted first.', loss: 'You held it. Respect.' },
    visual: { spriteKey: 'characterReinaKuroda', path: 'assets/Characters/Yokohama/reina_kuroda_idle.png', winSpriteKey: 'characterReinaKurodaWin', winPath: 'assets/Characters/Yokohama/reina_kuroda_win.png', lossSpriteKey: 'characterReinaKurodaLoss', lossPath: 'assets/Characters/Yokohama/reina_kuroda_loss.png' },
  },
  ryoheiTakeda: {
    id: 'ryoheiTakeda',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.88, launchSkill: 0.91, shiftSkill: 0.89, aggression: 0.87 }, betRange: [10000, 20000], competitionPrize: 21000 },
    name: 'Ryohei Takeda', archetype: 'The Launcher', roleTags: ['rival', 'yokohama', 'team'],
    selectable: false, rivalEligible: true, regionId: 'YOKOHAMA',
regionExclusive: true, teamRole: 'core',
    personality: 'Direct and competitive.', bio: 'A Yokohama racer who makes the first sixty feet count.',
    drivingStyle: 'Hard launches and decisive shifts.', tuningFocus: 'Traction and response.',
    preferredCars: ['evo3', 'evo6'], signatureRace: 'Quarter Mile',
    introQuote: 'Win it off the line.', resultQuotes: { win: 'Too late from the start.', loss: 'That launch was yours.' },
    visual: { spriteKey: 'characterRyoheiTakeda', path: 'assets/Characters/Yokohama/ryohei_takeda_idle.png', winSpriteKey: 'characterRyoheiTakedaWin', winPath: 'assets/Characters/Yokohama/ryohei_takeda_win.png', lossSpriteKey: 'characterRyoheiTakedaLoss', lossPath: 'assets/Characters/Yokohama/ryohei_takeda_loss.png' },
  },
  shunMizuno: {
    id: 'shunMizuno',
    skill: { rating: 5, label: 'PRO', ai: { reactionSkill: 0.91, launchSkill: 0.92, shiftSkill: 0.95, aggression: 0.82 }, betRange: [15000, 28000], competitionPrize: 28000 },
    name: 'Shun Mizuno', archetype: 'The Smooth Operator', roleTags: ['rival', 'yokohama', 'team'],
    selectable: false, rivalEligible: true, regionId: 'YOKOHAMA', regionExclusive: true, teamRole: 'ace',
    personality: 'Quiet and controlled.', bio: 'A seasoned Yokohama driver known for smooth, fast passes.',
    drivingStyle: 'Seamless shifts and steady acceleration.', tuningFocus: 'Powerband and gearing.',
    preferredCars: ['nsx', 'fc3s'], signatureRace: 'Half Mile',
    introQuote: 'Smooth is fast.', resultQuotes: { win: 'No wasted motion.', loss: 'That was cleaner than mine.' },
    visual: { spriteKey: 'characterShunMizuno', path: 'assets/Characters/Yokohama/shun_mizuno_idle.png', winSpriteKey: 'characterShunMizunoWin', winPath: 'assets/Characters/Yokohama/shun_mizuno_win.png', lossSpriteKey: 'characterShunMizunoLoss', lossPath: 'assets/Characters/Yokohama/shun_mizuno_loss.png' },
  },
  yuiKanzaki: {
    id: 'yuiKanzaki',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.90, launchSkill: 0.87, shiftSkill: 0.92, aggression: 0.88 }, betRange: [10000, 20000], competitionPrize: 21000 },
    name: 'Yui Kanzaki', archetype: 'The Challenger', roleTags: ['rival', 'yokohama', 'team'],
    selectable: false, rivalEligible: true, regionId: 'YOKOHAMA', regionExclusive: true, teamRole: 'core',
    personality: 'Sharp and fearless.', bio: 'A Yokohama challenger who prefers fast cars and faster decisions.',
    drivingStyle: 'Quick reactions and committed runs.', tuningFocus: 'Response and top-end pull.',
    preferredCars: ['fd3s', 'jza80'], signatureRace: 'Quarter Mile',
    introQuote: 'Do not hesitate.', resultQuotes: { win: 'Commit earlier next time.', loss: 'You did not blink.' },
    visual: { spriteKey: 'characterYuiKanzaki', path: 'assets/Characters/Yokohama/yui_kanzaki_idle.png', winSpriteKey: 'characterYuiKanzakiWin', winPath: 'assets/Characters/Yokohama/yui_kanzaki_win.png', lossSpriteKey: 'characterYuiKanzakiLoss', lossPath: 'assets/Characters/Yokohama/yui_kanzaki_loss.png' },
  },

  rikuAkamine: {
    id: 'rikuAkamine',
    skill: { rating: 3, label: 'SKILLED', ai: { reactionSkill: 0.80, launchSkill: 0.77, shiftSkill: 0.81, aggression: 0.91 }, betRange: [6000, 11000], competitionPrize: 15000 },
    name: 'Riku Akamine',
    age: 21,
    hometown: 'Shibuya',
    archetype: 'The Showman',
    roleTags: ['protagonist', 'teammate', 'rival', 'shinjuku', 'main-rival'],
    regionId: 'SHINJUKU',
    regionExclusive: true,
    mainRival: true,
    teamRole: 'mainRival',
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
      winSpriteKey: 'characterRikuAkamineWin',
      winPath: 'assets/Characters/riku_akamine_win.png',
      lossSpriteKey: 'characterRikuAkamineLoss',
      lossPath: 'assets/Characters/riku_akamine_loss.png',
    },
  },

  emiKanzaki: {
    id: 'emiKanzaki',
    skill: { rating: 3, label: 'SKILLED', ai: { reactionSkill: 0.76, launchSkill: 0.80, shiftSkill: 0.79, aggression: 0.83 }, betRange: [5000, 9000], competitionPrize: 13000 },
    name: 'Emi Kanzaki',
    age: 20,
    hometown: 'Setagaya',
    archetype: 'The Momentum',
    roleTags: ['protagonist', 'teammate', 'rival', 'odaiba', 'main-rival'],
    regionId: 'ODAIBA',
    regionExclusive: true,
    mainRival: true,
    teamRole: 'mainRival',
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
      path: 'assets/Characters/Odaiba/emi_kanzaki_idle.png',
      winSpriteKey: 'characterEmiKanzakiWin',
      winPath: 'assets/Characters/Odaiba/emi_kanzaki_win.png',
      lossSpriteKey: 'characterEmiKanzakiLoss',
      lossPath: 'assets/Characters/Odaiba/emi_kanzaki_loss.png',
    },
  },

  aoiShindou: {
    id: 'aoiShindou',
    skill: { rating: 2, label: 'ROOKIE', ai: { reactionSkill: 0.67, launchSkill: 0.70, shiftSkill: 0.68, aggression: 0.75 }, betRange: [3000, 6000], competitionPrize: 9000 },
    name: 'Aoi Shindou',
    age: 26,
    hometown: 'Odaiba',
    archetype: 'The Spark',
    roleTags: ['rival', 'odaiba', 'team'],
    selectable: false,
    rivalEligible: true,
    regionId: 'ODAIBA',
    regionExclusive: true,
    teamRole: 'core',
    personality: 'Upbeat, social and quick to turn any meet into a friendly challenge.',
    bio: 'Aoi is one of the most visible faces of the Odaiba crew. She is still developing as a racer, but her confidence and ability to read a crowd make her a natural early rival.',
    drivingStyle: 'Light-footed and reactive, with strong starts and simple, clean lines.',
    tuningFocus: 'Tyres, braking and responsive naturally aspirated setups.',
    preferredCars: ['ek9', 'ae86'],
    signatureRace: 'Standing Start',
    introQuote: 'You came all the way out here. We may as well run.',
    resultQuotes: {
      win: 'That was fun. You nearly had me.',
      loss: 'Okay, okay — that one was yours.',
    },
    visual: {
      spriteKey: 'characterAoiShindou',
      path: 'assets/Characters/Odaiba/aoi_shindou_idle.png',
      winSpriteKey: 'characterAoiShindouWin',
      winPath: 'assets/Characters/Odaiba/aoi_shindou_win.png',
      lossSpriteKey: 'characterAoiShindouLoss',
      lossPath: 'assets/Characters/Odaiba/aoi_shindou_loss.png',
    },
  },

  yutoAsakura: {
    id: 'yutoAsakura',
    skill: { rating: 3, label: 'SKILLED', ai: { reactionSkill: 0.79, launchSkill: 0.81, shiftSkill: 0.82, aggression: 0.72 }, betRange: [5000, 9000], competitionPrize: 13000 },
    name: 'Yuto Asakura',
    age: 32,
    hometown: 'Koto',
    archetype: 'The Meter',
    roleTags: ['rival', 'odaiba', 'team'],
    selectable: false,
    rivalEligible: true,
    regionId: 'ODAIBA',
    regionExclusive: true,
    teamRole: 'core',
    personality: 'Disciplined, understated and methodical; rarely wastes a launch.',
    bio: 'Yuto treats street races like controlled tests. He has been around longer than most of Odaiba’s younger crowd and is usually the one quietly setting the benchmark.',
    drivingStyle: 'Consistent launches, measured shifts and very few unforced mistakes.',
    tuningFocus: 'Gearing, launch traction and repeatable power delivery.',
    preferredCars: ['fc3s', 'evo3'],
    signatureRace: 'Quarter Mile',
    introQuote: 'One clean run. No excuses.',
    resultQuotes: {
      win: 'Consistency wins more races than noise.',
      loss: 'Good. Now I have something to measure against.',
    },
    visual: {
      spriteKey: 'characterYutoAsakura',
      path: 'assets/Characters/Odaiba/yuto_asakura_idle.png',
      winSpriteKey: 'characterYutoAsakuraWin',
      winPath: 'assets/Characters/Odaiba/yuto_asakura_win.png',
      lossSpriteKey: 'characterYutoAsakuraLoss',
      lossPath: 'assets/Characters/Odaiba/yuto_asakura_loss.png',
    },
  },

  mikaHoshino: {
    id: 'mikaHoshino',
    skill: { rating: 3, label: 'SKILLED', ai: { reactionSkill: 0.77, launchSkill: 0.84, shiftSkill: 0.85, aggression: 0.76 }, betRange: [5000, 9500], competitionPrize: 14000 },
    name: 'Mika Hoshino',
    age: 35,
    hometown: 'Shin-Kiba',
    archetype: 'The Calibrator',
    roleTags: ['rival', 'odaiba', 'team', 'tuner'],
    selectable: false,
    rivalEligible: true,
    regionId: 'ODAIBA',
    regionExclusive: true,
    teamRole: 'tuner-driver',
    personality: 'Dryly funny, mechanically obsessive and always testing a new setup.',
    bio: 'Mika is the driver who arrives with a different setup every few nights. She races because data from the road tells her more than another hour in the garage.',
    drivingStyle: 'Grip-focused and technical with strong mid-run corrections.',
    tuningFocus: 'Suspension, boost control and chassis balance.',
    preferredCars: ['wrx22b', 'evo3'],
    signatureRace: 'Roll Race',
    introQuote: 'I changed three things. Let’s see if any of them mattered.',
    resultQuotes: {
      win: 'That setup stays.',
      loss: 'Fine. Back on the alignment rack.',
    },
    visual: {
      spriteKey: 'characterMikaHoshino',
      path: 'assets/Characters/Odaiba/mika_hoshino_idle.png',
      winSpriteKey: 'characterMikaHoshinoWin',
      winPath: 'assets/Characters/Odaiba/mika_hoshino_win.png',
      lossSpriteKey: 'characterMikaHoshinoLoss',
      lossPath: 'assets/Characters/Odaiba/mika_hoshino_loss.png',
    },
  },

  kaoriNishimura: {
    id: 'kaoriNishimura',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.88, launchSkill: 0.90, shiftSkill: 0.91, aggression: 0.78 }, betRange: [8500, 13500], competitionPrize: 19000 },
    name: 'Kaori Nishimura',
    age: 44,
    hometown: 'Minato',
    archetype: 'The Veteran',
    roleTags: ['rival', 'odaiba', 'team', 'veteran'],
    selectable: false,
    rivalEligible: true,
    regionId: 'ODAIBA',
    regionExclusive: true,
    teamRole: 'veteran',
    personality: 'Polished, calm and quietly authoritative; she has nothing left to prove.',
    bio: 'Kaori was racing around the bay before most of the current Odaiba crew had licences. She now acts as the team’s mentor, but still races when someone interesting turns up.',
    drivingStyle: 'Smooth, deceptively fast and extremely difficult to unsettle.',
    tuningFocus: 'Balanced high-speed builds and reliability.',
    preferredCars: ['r32', 'fc3s'],
    signatureRace: 'Night Cup',
    introQuote: 'If you want to learn something, stay beside me.',
    resultQuotes: {
      win: 'Experience still counts for something.',
      loss: 'Excellent. That was worth coming out for.',
    },
    visual: {
      spriteKey: 'characterKaoriNishimura',
      path: 'assets/Characters/Odaiba/kaori_nishimura_idle.png',
      winSpriteKey: 'characterKaoriNishimuraWin',
      winPath: 'assets/Characters/Odaiba/kaori_nishimura_win.png',
      lossSpriteKey: 'characterKaoriNishimuraLoss',
      lossPath: 'assets/Characters/Odaiba/kaori_nishimura_loss.png',
    },
  },

  shunAmamiya: {
    id: 'shunAmamiya',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.91, launchSkill: 0.86, shiftSkill: 0.92, aggression: 0.92 }, betRange: [9000, 14500], competitionPrize: 20000 },
    name: 'Shun Amamiya',
    age: 25,
    hometown: 'Ariake',
    archetype: 'The Wildcard',
    roleTags: ['rival', 'odaiba', 'team', 'specialist'],
    selectable: false,
    rivalEligible: true,
    regionId: 'ODAIBA',
    regionExclusive: true,
    teamRole: 'wildcard',
    personality: 'Flashy, inventive and unpredictable, but far more technical than he first appears.',
    bio: 'Shun is Odaiba’s specialist. He experiments with unusual setups and will happily choose the harder line just to see if he can make it work.',
    drivingStyle: 'Aggressive, adaptive and difficult to read.',
    tuningFocus: 'Boost response, electronics and unconventional combinations.',
    preferredCars: ['evo3', 'r32'],
    signatureRace: 'Eliminator',
    introQuote: 'Normal is boring. Show me something strange.',
    resultQuotes: {
      win: 'See? Weird works.',
      loss: 'Huh. I need a new trick.',
    },
    visual: {
      spriteKey: 'characterShunAmamiya',
      path: 'assets/Characters/Odaiba/shun_amamiya_idle.png',
      winSpriteKey: 'characterShunAmamiyaWin',
      winPath: 'assets/Characters/Odaiba/shun_amamiya_win.png',
      lossSpriteKey: 'characterShunAmamiyaLoss',
      lossPath: 'assets/Characters/Odaiba/shun_amamiya_loss.png',
    },
  },

  takumiSerizawa: {
    id: 'takumiSerizawa',
    skill: { rating: 2, label: 'ROOKIE', ai: { reactionSkill: 0.71, launchSkill: 0.78, shiftSkill: 0.80, aggression: 0.62 }, betRange: [3000, 6500], competitionPrize: 10000 },
    name: 'Takumi Serizawa',
    age: 49,
    hometown: 'Toyosu',
    archetype: 'The Crew Chief',
    roleTags: ['rival', 'odaiba', 'team', 'mechanic'],
    selectable: false,
    rivalEligible: true,
    regionId: 'ODAIBA',
    regionMechanic: true,
    regionMechanicShopId: 'odaibaEsprit',
    regionExclusive: true,
    teamRole: 'support-mechanic',
    personality: 'Patient, good-humoured and practical; he usually has a tool in one hand and coffee in the other.',
    bio: 'Takumi keeps Odaiba’s cars running and has decades of mechanical experience. He does not chase reputation, but he can still put together a very tidy quarter mile when someone talks him into driving.',
    drivingStyle: 'Conservative, clean and launch-focused.',
    tuningFocus: 'Reliability, cooling, traction and practical fixes.',
    preferredCars: ['ae86', 'wrx22b'],
    signatureRace: 'Standing Start',
    introQuote: 'All right. One run, then I’m checking your tyre pressures.',
    resultQuotes: {
      win: 'Old hands still work.',
      loss: 'Fair enough. Your car sounded healthy, at least.',
    },
    visual: {
      spriteKey: 'characterTakumiSerizawa',
      path: 'assets/Characters/Odaiba/takumi_serizawa_idle.png',
      winSpriteKey: 'characterTakumiSerizawaWin',
      winPath: 'assets/Characters/Odaiba/takumi_serizawa_win.png',
      lossSpriteKey: 'characterTakumiSerizawaLoss',
      lossPath: 'assets/Characters/Odaiba/takumi_serizawa_loss.png',
    },
  },

  akiraShimizu: {
    id: 'akiraShimizu',
    skill: { rating: 2, label: 'ROOKIE', ai: { reactionSkill: 0.72, launchSkill: 0.75, shiftSkill: 0.76, aggression: 0.70 }, betRange: [3000, 6500], competitionPrize: 10000 },
    name: 'Akira Shimizu',
    age: 29,
    hometown: 'Shinagawa',
    archetype: 'The Commuter',
    roleTags: ['rival', 'shinagawa', 'team'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHINAGAWA',
    regionExclusive: true,
    teamRole: 'lead-racer',
    personality: 'Composed, practical and quietly competitive; looks more like an office commuter than a street racer.',
    bio: 'Akira slips between ordinary working life and the Shinagawa night scene without changing personality. He is tidy, punctual and frustratingly consistent once the lights go green.',
    drivingStyle: 'Clean launches, disciplined shifts and very few unnecessary corrections.',
    tuningFocus: 'Gearing, tyres and repeatable street-friendly power.',
    preferredCars: ['ek9', 'fc3s'],
    signatureRace: 'Standing Start',
    introQuote: 'One run. Keep it clean.',
    resultQuotes: {
      win: 'That was enough.',
      loss: 'Good run. I missed the launch.',
    },
    visual: {
      spriteKey: 'characterAkiraShimizu',
      path: 'assets/Characters/Shinagawa/akira_shimizu_idle.png',
      winSpriteKey: 'characterAkiraShimizuWin',
      winPath: 'assets/Characters/Shinagawa/akira_shimizu_win.png',
      lossSpriteKey: 'characterAkiraShimizuLoss',
      lossPath: 'assets/Characters/Shinagawa/akira_shimizu_loss.png',
    },
  },

  tetsuyaKanda: {
    id: 'tetsuyaKanda',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.87, launchSkill: 0.88, shiftSkill: 0.91, aggression: 0.70 }, betRange: [8500, 13500], competitionPrize: 19000 },
    name: 'Tetsuya Kanda',
    age: 55,
    hometown: 'Takanawa',
    archetype: 'The Veteran',
    roleTags: ['rival', 'shinagawa', 'team', 'veteran'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHINAGAWA',
    regionExclusive: true,
    teamRole: 'veteran',
    personality: 'Reserved, experienced and almost unnervingly calm.',
    bio: 'Tetsuya has raced the bay roads for decades and dresses more like a senior executive than a meet regular. He rarely chases attention, but the younger Shinagawa drivers listen when he speaks.',
    drivingStyle: 'Smooth, economical and difficult to provoke into mistakes.',
    tuningFocus: 'Balanced power, stability and long-term reliability.',
    preferredCars: ['r32', 'fc3s'],
    signatureRace: 'Night Cup',
    introQuote: 'Speed settles arguments quickly.',
    resultQuotes: {
      win: 'Experience is mostly knowing what not to do.',
      loss: 'Good. That was worth my time.',
    },
    visual: {
      spriteKey: 'characterTetsuyaKanda',
      path: 'assets/Characters/Shinagawa/tetsuya_kanda_idle.png',
      winSpriteKey: 'characterTetsuyaKandaWin',
      winPath: 'assets/Characters/Shinagawa/tetsuya_kanda_win.png',
      lossSpriteKey: 'characterTetsuyaKandaLoss',
      lossPath: 'assets/Characters/Shinagawa/tetsuya_kanda_loss.png',
    },
  },

  natsumiKagawa: {
    id: 'natsumiKagawa',
    skill: { rating: 2, label: 'ROOKIE', ai: { reactionSkill: 0.70, launchSkill: 0.80, shiftSkill: 0.78, aggression: 0.74 }, betRange: [3000, 7000], competitionPrize: 10500 },
    name: 'Natsumi Kagawa',
    age: 42,
    hometown: 'Oi',
    archetype: 'The Mechanic',
    roleTags: ['rival', 'shinagawa', 'team', 'mechanic'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHINAGAWA',
    regionMechanic: true,
    regionMechanicShopId: 'shinagawaSpoon',
    regionExclusive: true,
    teamRole: 'support-mechanic',
    personality: 'Practical, blunt and good-humoured, with no patience for decorative tuning.',
    bio: 'Natsumi keeps half the Shinagawa crew on the road. She races less often than the others, but her own cars launch hard and almost never break.',
    drivingStyle: 'Strong starts, conservative shifts and mechanical sympathy.',
    tuningFocus: 'Traction, cooling, suspension and durability.',
    preferredCars: ['wrx22b', 'evo3'],
    signatureRace: 'Standing Start',
    introQuote: 'If it breaks, you pushed the wrong part.',
    resultQuotes: {
      win: 'Good car. Better setup.',
      loss: 'Fine. I know what I am changing tonight.',
    },
    visual: {
      spriteKey: 'characterNatsumiKagawa',
      path: 'assets/Characters/Shinagawa/natsumi_kagawa_idle.png',
      winSpriteKey: 'characterNatsumiKagawaWin',
      winPath: 'assets/Characters/Shinagawa/natsumi_kagawa_win.png',
      lossSpriteKey: 'characterNatsumiKagawaLoss',
      lossPath: 'assets/Characters/Shinagawa/natsumi_kagawa_loss.png',
    },
  },

  reiTakamura: {
    id: 'reiTakamura',
    skill: { rating: 3, label: 'SKILLED', ai: { reactionSkill: 0.82, launchSkill: 0.78, shiftSkill: 0.86, aggression: 0.66 }, betRange: [5000, 9500], competitionPrize: 14000 },
    name: 'Rei Takamura',
    age: 31,
    hometown: 'Konan',
    archetype: 'The Specialist',
    roleTags: ['rival', 'shinagawa', 'team', 'specialist'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHINAGAWA',
    regionExclusive: true,
    teamRole: 'tech-specialist',
    personality: 'Analytical, precise and slightly detached; thinks in data before instinct.',
    bio: 'Rei works with electronics and vehicle data by day, then applies the same thinking to race setups at night. He is tall, quiet and usually watching more than talking.',
    drivingStyle: 'Measured, highly repeatable and excellent at adapting to traction changes.',
    tuningFocus: 'ECU mapping, telemetry, boost control and gearing.',
    preferredCars: ['evo3', 'r32'],
    signatureRace: 'Roll Race',
    introQuote: 'I only need one clean data point.',
    resultQuotes: {
      win: 'The numbers agreed.',
      loss: 'Interesting. I misread you.',
    },
    visual: {
      spriteKey: 'characterReiTakamura',
      path: 'assets/Characters/Shinagawa/rei_takamura_idle.png',
      winSpriteKey: 'characterReiTakamuraWin',
      winPath: 'assets/Characters/Shinagawa/rei_takamura_win.png',
      lossSpriteKey: 'characterReiTakamuraLoss',
      lossPath: 'assets/Characters/Shinagawa/rei_takamura_loss.png',
    },
  },

  goroNakajima: {
    id: 'goroNakajima',
    skill: { rating: 3, label: 'SKILLED', ai: { reactionSkill: 0.80, launchSkill: 0.86, shiftSkill: 0.82, aggression: 0.90 }, betRange: [5500, 10000], competitionPrize: 14500 },
    name: 'Goro Nakajima',
    age: 39,
    hometown: 'Samezu',
    archetype: 'The Enforcer',
    roleTags: ['rival', 'shinagawa', 'team', 'enforcer'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHINAGAWA',
    regionExclusive: true,
    teamRole: 'enforcer',
    personality: 'Direct, intimidating and fiercely loyal to the crew.',
    bio: 'Goro is the broad-shouldered Shinagawa regular people notice before they notice his car. He is not reckless; he simply prefers decisive launches and enough torque to end arguments early.',
    drivingStyle: 'Hard launches, aggressive shifts and relentless straight-line pressure.',
    tuningFocus: 'Torque, drivetrain strength and traction.',
    preferredCars: ['evo3', 'wrx22b'],
    signatureRace: 'Quarter Mile',
    introQuote: 'No speeches. Line up.',
    resultQuotes: {
      win: 'That is how you finish a run.',
      loss: 'You earned that one.',
    },
    visual: {
      spriteKey: 'characterGoroNakajima',
      path: 'assets/Characters/Shinagawa/goro_nakajima_idle.png',
      winSpriteKey: 'characterGoroNakajimaWin',
      winPath: 'assets/Characters/Shinagawa/goro_nakajima_win.png',
      lossSpriteKey: 'characterGoroNakajimaLoss',
      lossPath: 'assets/Characters/Shinagawa/goro_nakajima_loss.png',
    },
  },

  sayakaFujieda: {
    id: 'sayakaFujieda',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.90, launchSkill: 0.84, shiftSkill: 0.90, aggression: 0.68 }, betRange: [8500, 14000], competitionPrize: 19500 },
    name: 'Sayaka Fujieda',
    age: 47,
    hometown: 'Shinagawa',
    archetype: 'The Strategist',
    roleTags: ['rival', 'shinagawa', 'team', 'strategist'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHINAGAWA',
    regionExclusive: true,
    teamRole: 'strategist',
    personality: 'Controlled, perceptive and difficult to read; she treats a race like a negotiation.',
    bio: 'Sayaka is the senior planner behind many of Shinagawa’s competition entries. She has a polished professional presence and races only when she sees a useful reason to do so.',
    drivingStyle: 'Patient, adaptive and excellent at exploiting an opponent’s habits.',
    tuningFocus: 'Balanced setups, data logging and strategic gearing.',
    preferredCars: ['r32', 'wrx22b'],
    signatureRace: 'Eliminator',
    introQuote: 'You have already shown me more than you think.',
    resultQuotes: {
      win: 'Predictable is expensive.',
      loss: 'I will revise the plan.',
    },
    visual: {
      spriteKey: 'characterSayakaFujieda',
      path: 'assets/Characters/Shinagawa/sayaka_fujieda_idle.png',
      winSpriteKey: 'characterSayakaFujiedaWin',
      winPath: 'assets/Characters/Shinagawa/sayaka_fujieda_win.png',
      lossSpriteKey: 'characterSayakaFujiedaLoss',
      lossPath: 'assets/Characters/Shinagawa/sayaka_fujieda_loss.png',
      // Sayaka is a recurring character: keep her Shinagawa race set as the
      // canonical idle/win/loss art, but expose her Ginza wardrobe and
      // expressions as explicit Central Tokyo poses for showroom/cutscene use.
      poseAssets: {
        normal: { key: 'characterSayakaFujiedaCentral', path: 'assets/Characters/Central/sayaka_fujieda_normal.png' },
        happy: { key: 'characterSayakaFujiedaCentralHappy', path: 'assets/Characters/Central/sayaka_fujieda_happy.png' },
        sad: { key: 'characterSayakaFujiedaCentralSad', path: 'assets/Characters/Central/sayaka_fujieda_sad.png' },
        serious: { key: 'characterSayakaFujiedaCentralSerious', path: 'assets/Characters/Central/sayaka_fujieda_serious.png' },
      },
    },
  },

  haruSakurai: {
    id: 'haruSakurai',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.89, launchSkill: 0.86, shiftSkill: 0.90, aggression: 0.84 }, betRange: [7500, 12000], competitionPrize: 17500 },
    name: 'Haru Sakurai',
    age: 23,
    hometown: 'Shibuya',
    archetype: 'The Street Stylist',
    roleTags: ['rival', 'shibuya', 'team', 'fashion'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHIBUYA',
    regionExclusive: true,
    teamRole: 'style-specialist',
    personality: 'Relaxed, image-conscious and deceptively serious once a race starts.',
    bio: 'Haru moves easily between Shibuya fashion, music and car culture. His builds look effortless, but every visual choice hides a carefully sorted street setup.',
    drivingStyle: 'Smooth and confident with strong mid-race pace and clean shifts.',
    tuningFocus: 'Street response, suspension stance and usable turbo power.',
    preferredCars: ['fc3s', 'r32'],
    signatureRace: 'Street Sprint',
    introQuote: 'Looking good is easy. Keeping up is the test.',
    resultQuotes: { win: 'That worked out nicely.', loss: 'Okay. That one needs a rethink.' },
    visual: {
      spriteKey: 'characterHaruSakurai',
      path: 'assets/Characters/Shibuya/shibuya_haru_sakurai_idle.png',
      winSpriteKey: 'characterHaruSakuraiWin',
      winPath: 'assets/Characters/Shibuya/shibuya_haru_sakurai_win.png',
      lossSpriteKey: 'characterHaruSakuraiLoss',
      lossPath: 'assets/Characters/Shibuya/shibuya_haru_sakurai_loss.png',
    },
  },

  miuTanaka: {
    id: 'miuTanaka',
    skill: { rating: 3, label: 'SKILLED', ai: { reactionSkill: 0.85, launchSkill: 0.80, shiftSkill: 0.84, aggression: 0.88 }, betRange: [5500, 9500], competitionPrize: 14500 },
    name: 'Miu Tanaka',
    age: 20,
    hometown: 'Setagaya',
    archetype: 'The Trendsetter',
    roleTags: ['rival', 'shibuya', 'team', 'fashion'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHIBUYA',
    regionExclusive: true,
    teamRole: 'wildcard',
    personality: 'Bright, expressive and fearless; she treats every meet like an event.',
    bio: 'Miu arrived through Shibuya fashion circles rather than traditional car culture and immediately made the scene her own. She races with the same energy she brings everywhere else.',
    drivingStyle: 'Quick-reacting, aggressive and unpredictable in close races.',
    tuningFocus: 'Lightweight response, tyres and punchy acceleration.',
    preferredCars: ['ek9', 'ae86'],
    signatureRace: 'Bet Race',
    introQuote: 'If we are doing this, make it fun.',
    resultQuotes: { win: 'Yes! That was perfect!', loss: 'Ugh. Fine. Rematch later.' },
    visual: {
      spriteKey: 'characterMiuTanaka',
      path: 'assets/Characters/Shibuya/shibuya_miu_tanaka_idle.png',
      winSpriteKey: 'characterMiuTanakaWin',
      winPath: 'assets/Characters/Shibuya/shibuya_miu_tanaka_win.png',
      lossSpriteKey: 'characterMiuTanakaLoss',
      lossPath: 'assets/Characters/Shibuya/shibuya_miu_tanaka_loss.png',
    },
  },

  renjiAoki: {
    id: 'renjiAoki',
    skill: { rating: 3, label: 'SKILLED', ai: { reactionSkill: 0.81, launchSkill: 0.84, shiftSkill: 0.85, aggression: 0.76 }, betRange: [5000, 9000], competitionPrize: 14000 },
    name: 'Renji Aoki',
    age: 24,
    hometown: 'Nakano',
    archetype: 'The Layered Runner',
    roleTags: ['rival', 'shibuya', 'team', 'streetwear'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHIBUYA',
    regionExclusive: true,
    teamRole: 'street-racer',
    personality: 'Easygoing, sociable and observant; he rarely looks hurried.',
    bio: 'Renji is a familiar face across late-night Shibuya meets. He knows everyone, hears every rumour and has a habit of producing unexpectedly tidy runs when the stakes rise.',
    drivingStyle: 'Balanced, adaptable and particularly strong off the line.',
    tuningFocus: 'Traction, gearing and responsive street setups.',
    preferredCars: ['ae86', 'fc3s'],
    signatureRace: 'Standing Start',
    introQuote: 'No pressure. Just do not miss the light.',
    resultQuotes: { win: 'Nice run. Mine was just cleaner.', loss: 'Yeah, you had me there.' },
    visual: {
      spriteKey: 'characterRenjiAoki',
      path: 'assets/Characters/Shibuya/shibuya_renji_aoki_idle.png',
      winSpriteKey: 'characterRenjiAokiWin',
      winPath: 'assets/Characters/Shibuya/shibuya_renji_aoki_win.png',
      lossSpriteKey: 'characterRenjiAokiLoss',
      lossPath: 'assets/Characters/Shibuya/shibuya_renji_aoki_loss.png',
    },
  },

  kentoFujisawa: {
    id: 'kentoFujisawa',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.88, launchSkill: 0.87, shiftSkill: 0.91, aggression: 0.82 }, betRange: [7500, 12500], competitionPrize: 18000 },
    name: 'Kento Fujisawa',
    age: 26,
    hometown: 'Meguro',
    archetype: 'The Minimalist',
    roleTags: ['rival', 'shibuya', 'team', 'specialist'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHIBUYA',
    regionExclusive: true,
    teamRole: 'precision-racer',
    personality: 'Dry, composed and selective about both cars and people.',
    bio: 'Kento prefers clean design, clean builds and clean runs. He avoids the loudest parts of the scene, but his understated cars are usually among the quickest present.',
    drivingStyle: 'Precise, disciplined and difficult to force into an error.',
    tuningFocus: 'Balanced power, gearing and chassis response.',
    preferredCars: ['r32', 'evo3'],
    signatureRace: 'Quarter Mile',
    introQuote: 'Keep it simple. Keep it fast.',
    resultQuotes: { win: 'Nothing extra required.', loss: 'Clean. I cannot argue with that.' },
    visual: {
      spriteKey: 'characterKentoFujisawa',
      path: 'assets/Characters/Shibuya/shibuya_kento_fujisawa_idle.png',
      winSpriteKey: 'characterKentoFujisawaWin',
      winPath: 'assets/Characters/Shibuya/shibuya_kento_fujisawa_win.png',
      lossSpriteKey: 'characterKentoFujisawaLoss',
      lossPath: 'assets/Characters/Shibuya/shibuya_kento_fujisawa_loss.png',
    },
  },

  rinaTachibana: {
    id: 'rinaTachibana',
    skill: { rating: 4, label: 'EXPERT', ai: { reactionSkill: 0.91, launchSkill: 0.84, shiftSkill: 0.89, aggression: 0.79 }, betRange: [8000, 13000], competitionPrize: 18500 },
    name: 'Rina Tachibana',
    age: 25,
    hometown: 'Shibuya',
    archetype: 'The Night Editor',
    roleTags: ['rival', 'shibuya', 'team', 'fashion'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHIBUYA',
    regionExclusive: true,
    teamRole: 'strategist',
    personality: 'Self-possessed, perceptive and hard to impress.',
    bio: 'Rina has an eye for details other people miss, whether it is an outfit, a car or an opponent. She studies a meet quietly and tends to race only after she has worked out who matters.',
    drivingStyle: 'Patient and adaptive with excellent reaction timing.',
    tuningFocus: 'Boost response, tyre choice and balanced street setups.',
    preferredCars: ['wrx22b', 'r32'],
    signatureRace: 'Eliminator',
    introQuote: 'I have been watching. Show me something new.',
    resultQuotes: { win: 'About what I expected.', loss: 'Interesting. I read that wrong.' },
    visual: {
      spriteKey: 'characterRinaTachibana',
      path: 'assets/Characters/Shibuya/shibuya_rina_tachibana_idle.png',
      winSpriteKey: 'characterRinaTachibanaWin',
      winPath: 'assets/Characters/Shibuya/shibuya_rina_tachibana_win.png',
      lossSpriteKey: 'characterRinaTachibanaLoss',
      lossPath: 'assets/Characters/Shibuya/shibuya_rina_tachibana_loss.png',
    },
  },

  itsukiKuroda: {
    id: 'itsukiKuroda',
    skill: { rating: 3, label: 'SKILLED', ai: { reactionSkill: 0.79, launchSkill: 0.87, shiftSkill: 0.85, aggression: 0.73 }, betRange: [5000, 9000], competitionPrize: 14000 },
    name: 'Itsuki Kuroda',
    age: 29,
    hometown: 'Ebisu',
    archetype: 'The Custom Tuner',
    roleTags: ['rival', 'shibuya', 'team', 'mechanic'],
    selectable: false,
    rivalEligible: true,
    regionId: 'SHIBUYA',
    regionMechanic: true,
    regionMechanicShopId: 'shibuyaAmuse',
    regionExclusive: true,
    teamRole: 'support-mechanic',
    personality: 'Inventive, low-key and obsessive about making unusual ideas actually work.',
    bio: 'Itsuki is Shibuya’s mechanic and tuner, equally comfortable discussing fitment, fabrication or boost control. His own cars look unconventional but are never built for appearance alone.',
    drivingStyle: 'Strong launches, tidy shifts and mechanically sympathetic pace.',
    tuningFocus: 'Custom fabrication, suspension, traction and boost response.',
    preferredCars: ['ae86', 'evo3'],
    signatureRace: 'Standing Start',
    introQuote: 'I changed a few things. Let us see if they work.',
    resultQuotes: { win: 'Good. The setup stays.', loss: 'Useful result. I know what to change.' },
    visual: {
      spriteKey: 'characterItsukiKuroda',
      path: 'assets/Characters/Shibuya/shibuya_itsuki_kuroda_idle.png',
      winSpriteKey: 'characterItsukiKurodaWin',
      winPath: 'assets/Characters/Shibuya/shibuya_itsuki_kuroda_win.png',
      lossSpriteKey: 'characterItsukiKurodaLoss',
      lossPath: 'assets/Characters/Shibuya/shibuya_itsuki_kuroda_loss.png',
    },
  },


  harutoMizuno: {
    id: 'harutoMizuno',
    name: 'Haruto Mizuno',
    archetype: 'New Car Specialist',
    roleTags: ['central', 'auto-market', 'npc', 'dealer'],
    selectable: false,
    rivalEligible: false,
    centralRole: 'new-car-specialist',
    personality: 'Polished, upbeat and product-focused.',
    bio: 'The Tokyo Auto Market specialist for factory-stock new cars.',
    visual: {
      spriteKey: 'characterHarutoMizuno',
      path: 'assets/Characters/Central/haruto_mizuno_normal.png',
      poseAssets: {
        normal: { key: 'characterHarutoMizuno', path: 'assets/Characters/Central/haruto_mizuno_normal.png' },
        happy: { key: 'characterHarutoMizunoHappy', path: 'assets/Characters/Central/haruto_mizuno_happy.png' },
        sad: { key: 'characterHarutoMizunoSad', path: 'assets/Characters/Central/haruto_mizuno_sad.png' },
      },
    },
  },

  kenjiOkabe: {
    id: 'kenjiOkabe',
    name: 'Kenji Okabe',
    archetype: 'Used Car Dealer',
    roleTags: ['central', 'auto-market', 'npc', 'dealer'],
    selectable: false,
    rivalEligible: false,
    centralRole: 'used-car-dealer',
    personality: 'Friendly, shrewd and always ready to talk condition or price.',
    bio: 'The Tokyo Auto Market buyer and dealer handling modified used stock.',
    visual: {
      spriteKey: 'characterKenjiOkabe',
      path: 'assets/Characters/Central/kenji_okabe_normal.png',
      poseAssets: {
        normal: { key: 'characterKenjiOkabe', path: 'assets/Characters/Central/kenji_okabe_normal.png' },
        happy: { key: 'characterKenjiOkabeHappy', path: 'assets/Characters/Central/kenji_okabe_happy.png' },
        sad: { key: 'characterKenjiOkabeSad', path: 'assets/Characters/Central/kenji_okabe_sad.png' },
      },
    },
  },

  yunaKisaragi: {
    id: 'yunaKisaragi',
    name: 'Yuna Kisaragi',
    archetype: 'Wheel & Fitment Specialist',
    roleTags: ['central', 'auto-market', 'npc', 'wheels'],
    selectable: false,
    rivalEligible: false,
    centralRole: 'wheel-specialist',
    personality: 'Exacting, stylish and enthusiastic about getting fitment right.',
    bio: 'The Tokyo Auto Market wheel and fitment specialist.',
    visual: {
      spriteKey: 'characterYunaKisaragi',
      path: 'assets/Characters/Central/yuna_kisaragi_normal.png',
      poseAssets: {
        normal: { key: 'characterYunaKisaragi', path: 'assets/Characters/Central/yuna_kisaragi_normal.png' },
        happy: { key: 'characterYunaKisaragiHappy', path: 'assets/Characters/Central/yuna_kisaragi_happy.png' },
        sad: { key: 'characterYunaKisaragiSad', path: 'assets/Characters/Central/yuna_kisaragi_sad.png' },
      },
    },
  },

  ryujiTakahashi: {
    id: 'ryujiTakahashi',
    name: 'Ryuji Takahashi',
    archetype: 'Drag Complex Owner',
    roleTags: ['central', 'drag-complex', 'npc', 'owner', 'veteran'],
    selectable: false,
    rivalEligible: false,
    centralRole: 'drag-owner',
    personality: 'Old-school, understated and deeply serious about proper racing.',
    bio: 'An old-school racer and the owner of the Tokyo Drag Complex.',
    visual: {
      spriteKey: 'characterRyujiTakahashi',
      path: 'assets/Characters/Central/ryuji_takahashi_normal.png',
      poseAssets: {
        normal: { key: 'characterRyujiTakahashi', path: 'assets/Characters/Central/ryuji_takahashi_normal.png' },
        happy: { key: 'characterRyujiTakahashiHappy', path: 'assets/Characters/Central/ryuji_takahashi_happy.png' },
        serious: { key: 'characterRyujiTakahashiSerious', path: 'assets/Characters/Central/ryuji_takahashi_serious.png' },
      },
    },
  },

  masatoKuroda: {
    id: 'masatoKuroda',
    name: 'Masato Kuroda',
    archetype: 'Drag Complex Manager',
    roleTags: ['central', 'drag-complex', 'npc', 'manager', 'promoter'],
    selectable: false,
    rivalEligible: false,
    centralRole: 'drag-manager',
    personality: 'Professional, organised and calm under pressure.',
    bio: 'The day-to-day manager and event promoter at the Tokyo Drag Complex.',
    visual: {
      spriteKey: 'characterMasatoKuroda',
      path: 'assets/Characters/Central/masato_kuroda_normal.png',
      poseAssets: {
        normal: { key: 'characterMasatoKuroda', path: 'assets/Characters/Central/masato_kuroda_normal.png' },
        happy: { key: 'characterMasatoKurodaHappy', path: 'assets/Characters/Central/masato_kuroda_happy.png' },
        sad: { key: 'characterMasatoKurodaSad', path: 'assets/Characters/Central/masato_kuroda_sad.png' },
      },
    },
  },

  hiroshiSato: {
    id: 'hiroshiSato',
    name: 'Hiroshi Sato',
    archetype: 'Chief Starter',
    roleTags: ['central', 'drag-complex', 'npc', 'official', 'starter'],
    selectable: false,
    rivalEligible: false,
    centralRole: 'chief-starter',
    personality: 'Focused, authoritative and completely locked in once cars stage.',
    bio: 'Chief umpire and starter at the Tokyo Drag Complex.',
    visual: {
      spriteKey: 'characterHiroshiSato',
      path: 'assets/Characters/Central/hiroshi_sato_normal.png',
      poseAssets: {
        normal: { key: 'characterHiroshiSato', path: 'assets/Characters/Central/hiroshi_sato_normal.png' },
        happy: { key: 'characterHiroshiSatoHappy', path: 'assets/Characters/Central/hiroshi_sato_happy.png' },
        focus: { key: 'characterHiroshiSatoFocus', path: 'assets/Characters/Central/hiroshi_sato_focus.png' },
        signal: { key: 'characterHiroshiSatoSignal', path: 'assets/Characters/Central/hiroshi_sato_signal.png' },
      },
    },
  },

  kentaIshikawa: {
    id: 'kentaIshikawa',
    name: 'Kenta Ishikawa',
    archetype: 'Track Mechanic',
    roleTags: ['central', 'drag-complex', 'npc', 'mechanic'],
    selectable: false,
    rivalEligible: false,
    centralRole: 'track-mechanic',
    personality: 'Young, practical and happiest when there is a car to inspect.',
    bio: 'The young track mechanic keeping Drag Complex cars and equipment ready.',
    visual: {
      spriteKey: 'characterKentaIshikawa',
      path: 'assets/Characters/Central/kenta_ishikawa_normal.png',
      poseAssets: {
        normal: { key: 'characterKentaIshikawa', path: 'assets/Characters/Central/kenta_ishikawa_normal.png' },
        happy: { key: 'characterKentaIshikawaHappy', path: 'assets/Characters/Central/kenta_ishikawa_happy.png' },
        sad: { key: 'characterKentaIshikawaSad', path: 'assets/Characters/Central/kenta_ishikawa_sad.png' },
      },
    },
  },

  tomoSakamoto: {
    id: 'tomoSakamoto',
    name: 'Tomo Sakamoto',
    archetype: 'Timing & Telemetry Assistant',
    roleTags: ['central', 'drag-complex', 'npc', 'telemetry'],
    selectable: false,
    rivalEligible: false,
    centralRole: 'timing-assistant',
    relatedCharacterIds: ['daichiSakamoto'],
    personality: 'Shy, clever and much more comfortable around timing data than crowds.',
    bio: 'Daichi Sakamoto’s younger brother and the Drag Complex timing and telemetry assistant.',
    visual: {
      spriteKey: 'characterTomoSakamoto',
      path: 'assets/Characters/Central/tomo_sakamoto_normal.png',
      poseAssets: {
        normal: { key: 'characterTomoSakamoto', path: 'assets/Characters/Central/tomo_sakamoto_normal.png' },
        happy: { key: 'characterTomoSakamotoHappy', path: 'assets/Characters/Central/tomo_sakamoto_happy.png' },
        sad: { key: 'characterTomoSakamotoSad', path: 'assets/Characters/Central/tomo_sakamoto_sad.png' },
      },
    },
  },

  keiNomura: {
    id: 'keiNomura',
    name: 'Kei Nomura',
    archetype: 'The Conditional Rival',
    roleTags: ['conditional-rival', 'avatar-replacement'],
    selectable: false,
    rivalEligible: false,
    conditionalRivalReplacement: true,
    personality: 'Measured, competitive and comfortable stepping into a difficult matchup.',
    introQuote: 'If I am here, I intend to earn the spot.',
    resultQuotes: {
      win: 'That was the pace I came for.',
      loss: 'Good run. I will adjust.',
    },
    visual: {
      spriteKey: 'characterMaleSubstitute',
      path: 'assets/Characters/male_sub_idle.png',
      winSpriteKey: 'characterMaleSubstituteWin',
      winPath: 'assets/Characters/male_sub_win.png',
      lossSpriteKey: 'characterMaleSubstituteLoss',
      lossPath: 'assets/Characters/male_sub_loss.png',
    },
  },

  amiOkada: {
    id: 'amiOkada',
    name: 'Ami Okada',
    archetype: 'The Conditional Rival',
    roleTags: ['conditional-rival', 'avatar-replacement'],
    selectable: false,
    rivalEligible: false,
    conditionalRivalReplacement: true,
    personality: 'Calm, sharp and immediately serious once a race is on.',
    introQuote: 'You have my attention. Let us run it properly.',
    resultQuotes: {
      win: 'I knew where the gap would open.',
      loss: 'That was clean. I will find the time.',
    },
    visual: {
      spriteKey: 'characterFemaleSubstitute',
      path: 'assets/Characters/female_sub_idle.png',
      winSpriteKey: 'characterFemaleSubstituteWin',
      winPath: 'assets/Characters/female_sub_win.png',
      lossSpriteKey: 'characterFemaleSubstituteLoss',
      lossPath: 'assets/Characters/female_sub_loss.png',
    },
  },

  arkonDen: {
    id: 'arkonDen',
    name: 'Arkon Den',
    archetype: 'Developer',
    roleTags: ['developer'],
    selectable: false,
    rivalEligible: false,
    personality: 'The developer behind the curtain.',
    resultQuotes: {
      win: 'All according to plan.',
      loss: 'That one needs another pass.',
    },
    visual: {
      spriteKey: 'characterArkonDen',
      path: 'assets/Characters/arkon_den_idle.png',
      winSpriteKey: 'characterArkonDenWin',
      winPath: 'assets/Characters/arkon_den_win.png',
      lossSpriteKey: 'characterArkonDenLoss',
      lossPath: 'assets/Characters/arkon_den_loss.png',
    },
  },

};

// Profile framing is deliberately separate from standing/world alignment.
// Every character receives the same canonical defaults at runtime; only genuine
// visual outliers should declare visual.profile overrides in the roster data.
for (const character of Object.values(characters)) {
  if (!character?.visual) continue;
  const profile = character.visual.profile || {};
  character.visual.profile = {
    ...DEFAULT_CHARACTER_PROFILE,
    ...profile,
    poses: { ...(profile.poses || {}) },
  };
}

export const characterOrder = [
  'renMizuno',
  'daichiSakamoto',
  'ayaKurose',
  'kaitoFujimori',
  'sotaKisaragi',
  'yuiNaruse',
  'daigoMoriyama',
  'risaTachikawa',
  'masatoKurogane',
  'tetsuNakahara',
  'haruTachibana',
  'reinaShibata',
  'shoNakamura',
  'miloArai',
  'naoFujita',
  'akiSenda',
  'tetsuoMori',
  'kazuoTanaka',
  'rikuAkamine',
  'emiKanzaki',
  'aoiShindou',
  'yutoAsakura',
  'mikaHoshino',
  'kaoriNishimura',
  'shunAmamiya',
  'takumiSerizawa',
  'akiraShimizu',
  'tetsuyaKanda',
  'natsumiKagawa',
  'reiTakamura',
  'goroNakajima',
  'sayakaFujieda',
  'haruSakurai',
  'miuTanaka',
  'renjiAoki',
  'kentoFujisawa',
  'rinaTachibana',
  'itsukiKuroda',
  // Shinjuku and Yokohama use the corrected named regional sprite sets too.
  'daigoArakawa',
  'emiSaionji',
  'kaedeTachibana',
  'renKurosawa',
  'rinAmamiya',
  'soraKanzaki',
  'masatoIshikawa',
  'mikaHayase',
  'reinaKuroda',
  'ryoheiTakeda',
  'shunMizuno',
  'yuiKanzaki',
  // Central Tokyo venue cast. These are NPC/cutscene characters, not rivals.
  'harutoMizuno',
  'kenjiOkabe',
  'yunaKisaragi',
  'ryujiTakahashi',
  'masatoKuroda',
  'hiroshiSato',
  'kentaIshikawa',
  'tomoSakamoto',
  'keiNomura',
  'amiOkada',
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

export const MAIN_RIVAL_BY_REGION = Object.freeze({
  ODAIBA: 'emiKanzaki',
  SHINAGAWA: 'renMizuno',
  TATSUMI: 'kaitoFujimori',
  SHIBUYA: 'ayaKurose',
  YOKOHAMA: 'haruTachibana',
  DAIKOKU: 'reinaShibata',
  SHINJUKU: 'rikuAkamine',
});

export function getMainRivalForRegion(regionId) {
  return MAIN_RIVAL_BY_REGION[String(regionId || '').trim().toUpperCase()] || null;
}

function rivalContextValue(source, key, fallback = null) {
  if (source && typeof source.get === 'function') {
    const value = source.get(key);
    return value == null ? fallback : value;
  }
  const value = source?.[key];
  return value == null ? fallback : value;
}

function clampRivalSkill(value) {
  return Math.max(0.30, Math.min(0.99, Number(value) || 0));
}

function growRivalAi(base = {}, floors = {}, bump = 0) {
  const grow = (key, fallback) => clampRivalSkill(
    Math.max(
      Number(floors[key] ?? 0),
      Number(base[key] ?? fallback) + Number(bump || 0)
    )
  );

  return {
    ...base,
    reactionSkill: grow('reactionSkill', 0.78),
    launchSkill: grow('launchSkill', 0.76),
    shiftSkill: grow('shiftSkill', 0.78),
    aggression: grow('aggression', 0.74),
  };
}

export function getConqueredMainRivalIds(source) {
  const progress = rivalContextValue(source, 'crewBattleProgress', {}) || {};
  return Object.entries(MAIN_RIVAL_BY_REGION)
    .filter(([regionId, characterId]) =>
      Boolean(progress?.[regionId]?.completed) &&
      Boolean(characters[characterId])
    )
    .sort((a, b) =>
      Number(progress?.[a[0]]?.completedAt || 0) -
      Number(progress?.[b[0]]?.completedAt || 0)
    )
    .map(([, characterId]) => characterId);
}

export function isMainRivalAvailableAtRegionalMeet(
  source,
  characterId,
  regionId = ''
) {
  const id = String(characterId || '');
  const character = characters[id];
  if (!character?.mainRival) return true;

  const canonicalRegion = String(
    regionId || character.regionId || ''
  ).trim().toUpperCase();
  if (!canonicalRegion || MAIN_RIVAL_BY_REGION[canonicalRegion] !== id) return true;

  const progress = rivalContextValue(source, 'crewBattleProgress', {}) || {};
  return !Boolean(progress?.[canonicalRegion]?.completed);
}

export function getMainRivalProgression(source, characterId) {
  const id = String(characterId || '');
  const character = characters[id];
  if (!character?.mainRival) return null;

  const regionId = String(character.regionId || '').trim().toUpperCase();
  const progress = rivalContextValue(source, 'crewBattleProgress', {}) || {};
  const conquered = Boolean(progress?.[regionId]?.completed);
  const wins = Math.max(0, Number(rivalContextValue(source, 'wins', 0) || 0));
  const losses = Math.max(0, Number(rivalContextValue(source, 'losses', 0) || 0));
  const raceExperience = wins + losses * 0.25;
  const conqueredCount = Object.keys(MAIN_RIVAL_BY_REGION)
    .filter(key => Boolean(progress?.[key]?.completed))
    .length;

  const baseRating = Math.max(
    1,
    Math.min(5, Math.round(Number(character.skill?.rating || 4)))
  );
  const baseAi = character.skill?.ai || {};

  if (!conquered) {
    const tier = raceExperience >= 70 ? 3 : raceExperience >= 40 ? 2 : raceExperience >= 18 ? 1 : 0;
    const bump = [0, 0.012, 0.026, 0.042][tier];
    const encounterRating = Math.max(
      baseRating,
      tier >= 3 ? 5 : tier >= 1 ? 4 : baseRating
    );

    return {
      characterId: id,
      regionId,
      phase: 'REGIONAL',
      tier,
      tierLabel: 'REGIONAL_' + (tier + 1),
      encounterRating,
      difficulty: encounterRating >= 5 ? 'ELITE' : encounterRating >= 4 ? 'EXPERT' : 'SKILLED',
      encounterAi: growRivalAi(baseAi, {}, bump),
      conquered: false,
    };
  }

  const complexScore = raceExperience + conqueredCount * 16;
  const tier = complexScore >= 150 ? 3 : complexScore >= 95 ? 2 : 1;
  const floorsByTier = {
    1: { reactionSkill: 0.94, launchSkill: 0.95, shiftSkill: 0.96, aggression: 0.90 },
    2: { reactionSkill: 0.96, launchSkill: 0.97, shiftSkill: 0.98, aggression: 0.92 },
    3: { reactionSkill: 0.98, launchSkill: 0.985, shiftSkill: 0.99, aggression: 0.95 },
  };

  return {
    characterId: id,
    regionId,
    phase: 'DRAG_COMPLEX',
    tier,
    tierLabel: 'COMPLEX_' + tier,
    encounterRating: 5,
    difficulty: 'ELITE',
    encounterAi: growRivalAi(
      baseAi,
      floorsByTier[tier],
      tier === 3 ? 0.006 : tier === 2 ? 0.004 : 0
    ),
    conquered: true,
  };
}

export const REGION_TEAM_CHARACTER_IDS = {
  ODAIBA: [
    'aoiShindou',
    'yutoAsakura',
    'mikaHoshino',
    'kaoriNishimura',
    'shunAmamiya',
    'takumiSerizawa',
    MAIN_RIVAL_BY_REGION.ODAIBA,
  ],
  SHINAGAWA: [
    'akiraShimizu',
    'natsumiKagawa',
    'reiTakamura',
    'goroNakajima',
    'tetsuyaKanda',
    'sayakaFujieda',
    MAIN_RIVAL_BY_REGION.SHINAGAWA,
  ],
  TATSUMI: [
    'sotaKisaragi',
    'yuiNaruse',
    'daigoMoriyama',
    'risaTachikawa',
    'masatoKurogane',
    'tetsuNakahara',
    MAIN_RIVAL_BY_REGION.TATSUMI,
  ],
  SHIBUYA: [
    'haruSakurai',
    'miuTanaka',
    'renjiAoki',
    'kentoFujisawa',
    'rinaTachibana',
    'itsukiKuroda',
    MAIN_RIVAL_BY_REGION.SHIBUYA,
  ],
  YOKOHAMA: [
    'masatoIshikawa',
    'mikaHayase',
    'reinaKuroda',
    'ryoheiTakeda',
    'shunMizuno',
    'yuiKanzaki',
    MAIN_RIVAL_BY_REGION.YOKOHAMA,
  ],
  DAIKOKU: [
    'shoNakamura',
    'miloArai',
    'naoFujita',
    'akiSenda',
    'tetsuoMori',
    'kazuoTanaka',
    MAIN_RIVAL_BY_REGION.DAIKOKU,
  ],
  SHINJUKU: [
    'daigoArakawa',
    'emiSaionji',
    'kaedeTachibana',
    'renKurosawa',
    'rinAmamiya',
    'soraKanzaki',
    MAIN_RIVAL_BY_REGION.SHINJUKU,
  ],
};

export const CENTRAL_TOKYO_CHARACTER_IDS = Object.freeze({
  autoMarket: Object.freeze({
    new: 'harutoMizuno',
    used: 'kenjiOkabe',
    wheels: 'yunaKisaragi',
  }),
  ginza: Object.freeze({
    proprietor: 'sayakaFujieda',
  }),
  dragComplex: Object.freeze({
    owner: 'ryujiTakahashi',
    manager: 'masatoKuroda',
    starter: 'hiroshiSato',
    mechanic: 'kentaIshikawa',
    telemetry: 'tomoSakamoto',
  }),
});

export function getRivalReplacementCharacterId(characterId, playerCharacterId = '') {
  const rivalId = String(characterId || '');
  const playerId = String(playerCharacterId || '');
  if (!rivalId || rivalId !== playerId) return rivalId;

  const kind = RIVAL_SUBSTITUTE_KIND_BY_CHARACTER[playerId];
  if (!kind || characters[playerId]?.mainRival !== true) return rivalId;
  return RIVAL_REPLACEMENT_CHARACTER_IDS[kind] || rivalId;
}

export function getCharacterForContext(
  characterId,
  { rivalContext = false, playerCharacterId = '' } = {}
) {
  const canonicalId = String(characterId || '');
  if (!canonicalId) return null;

  const resolvedId = rivalContext
    ? getRivalReplacementCharacterId(canonicalId, playerCharacterId)
    : canonicalId;
  return characters[resolvedId] || characters[canonicalId] || null;
}

export function getRivalSubstituteVisual(characterId, playerCharacterId = '') {
  const replacementId = getRivalReplacementCharacterId(
    characterId,
    playerCharacterId
  );
  if (!replacementId || replacementId === String(characterId || '')) return null;
  return characters[replacementId]?.visual || null;
}

export function getCharacterVisualForContext(
  characterId,
  { rivalContext = false, playerCharacterId = '' } = {}
) {
  return getCharacterForContext(characterId, {
    rivalContext,
    playerCharacterId,
  })?.visual || null;
}

export function getCharacterVisualAsset(characterId, pose = 'idle', options = {}) {
  const visual = getCharacterVisualForContext(characterId, options);
  if (!visual) return null;

  const requestedPose = String(pose || 'idle').trim().toLowerCase() || 'idle';
  const customPose = visual.poseAssets?.[requestedPose];
  if (customPose?.key || customPose?.path) {
    return {
      key: customPose.key || visual.spriteKey,
      path: customPose.path || visual.path,
      pose: requestedPose,
      fallback: false,
    };
  }

  if (requestedPose === 'win' && (visual.winSpriteKey || visual.winPath)) {
    return {
      key: visual.winSpriteKey || visual.spriteKey,
      path: visual.winPath || visual.path,
      pose: 'win',
      fallback: false,
    };
  }

  if (requestedPose === 'loss' && (visual.lossSpriteKey || visual.lossPath)) {
    return {
      key: visual.lossSpriteKey || visual.spriteKey,
      path: visual.lossPath || visual.path,
      pose: 'loss',
      fallback: false,
    };
  }

  return {
    key: visual.spriteKey,
    path: visual.path,
    pose: 'idle',
    fallback: requestedPose !== 'idle',
  };
}


export const REGION_MECHANIC_CHARACTER_IDS = Object.freeze(
  Object.fromEntries(
    Object.values(characters)
      .filter(character =>
        character?.regionMechanic === true &&
        character?.regionId &&
        character?.id
      )
      .map(character => [
        String(character.regionId).trim().toUpperCase(),
        character.id,
      ])
  )
);

export function getRegionMechanicCharacterId(regionId) {
  const key = String(regionId || '').trim().toUpperCase();
  return REGION_MECHANIC_CHARACTER_IDS[key] || null;
}

export function getRegionMechanicCharacter(regionId) {
  const id = getRegionMechanicCharacterId(regionId);
  return id ? (characters[id] || null) : null;
}

export function isRegionMechanicCharacter(characterId) {
  return Boolean(characters[String(characterId || '')]?.regionMechanic);
}


export const genericRivalCharacterOrder = rivalCharacterOrder.filter(
  id => !characters[id]?.regionExclusive
);

export function getRivalCharacterOrderForRegion(regionId) {
  const key = String(regionId || '').trim().toUpperCase();
  const regional = REGION_TEAM_CHARACTER_IDS[key];
  if (Array.isArray(regional) && regional.length) {
    return regional.filter(id => characters[id]?.rivalEligible !== false);
  }
  return [...genericRivalCharacterOrder];
}

export function hasRegionalTeam(regionId) {
  const key = String(regionId || '').trim().toUpperCase();
  return Array.isArray(REGION_TEAM_CHARACTER_IDS[key])
    && REGION_TEAM_CHARACTER_IDS[key].length > 0;
}

export const characterList = characterOrder.map((id) => characters[id]);
export const playableCharacterList = playableCharacterOrder.map((id) => characters[id]);
export const rivalCharacterList = rivalCharacterOrder.map((id) => characters[id]);

export function getCharacter(id) {
  return characters[id] ?? null;
}
