import { CHAPTER08_SCENES } from './chapter08.js?v=20261024-r680';
import { CHAPTER09_SCENES, CHAPTER09_SEQUENCE } from './chapter09.js?v=20261027-r693';

const sourceValue = (source, key, fallback = null) => {
  if (source && typeof source.get === 'function') {
    const value = source.get(key);
    return value == null ? fallback : value;
  }
  const value = source?.[key];
  return value == null ? fallback : value;
};

export const CUTSCENES = {
  ...CHAPTER08_SCENES,
  ...CHAPTER09_SCENES,
  openingStationEncounter: {
    id: 'openingStationEncounter',
    category: 'OPENING / STORY',
    testerLabel: 'Opening — Daichi and the driver meet at the station',
    title: 'TOKYO STATION // A CHANCE ENCOUNTER',
    once: true,
    characters: { left: 'daichiSakamoto', right: '$PLAYER' },
    pages: [
      { speaker: 'left', pose: 'idle', text: "Hey, {PLAYER_FIRST_NAME}! Seen the new Tokyo SHIFT magazine?" },
      { speaker: 'right', pose: 'idle', text: "Not yet. What's in it?" },
      { speaker: 'left', pose: 'idle', text: "Cars, tuners and Tokyo's night racing scene. Issue one even looks back at last year's Tokyo Champion." },
      { speaker: 'left', pose: 'win', text: "I left a copy at your place. Have a read when you get home." },
      { speaker: 'right', pose: 'idle', text: "Thanks. Good bumping into you, but I'd better head back. I've got to wait for my car." },
      { speaker: 'left', pose: 'win', text: "You're getting a car? You can do your own Tokyo SHIFT then!" },
      { speaker: 'right', pose: 'idle', text: "Sayaka's bringing it over. She's known my family for years, and she heard how much I love cars." },
      { speaker: 'left', pose: 'win', text: "Then you'd better go! Can't wait to see what it is. I'll come by later.", emphasis: true },
    ],
    finalActionLabel: 'GO TO MAP',
  },
  openingSayakaKeys: {
    id: 'openingSayakaKeys',
    category: 'OPENING / STORY',
    testerLabel: 'Opening — Sayaka Delivers Your First Car',
    title: 'SHINONOME // FIRST KEYS',
    once: true,
    characters: { left: 'sayakaFujieda', right: '$PLAYER' },
    pages: [
      { speaker: 'left', pose: 'homeNormal', text: "Your parents say you never stop talking about cars. A friend and I helped find you a good one." },
      { speaker: 'right', pose: 'idle', text: "Wow, I can't believe I've finally got my own car!" },
      { speaker: 'left', pose: 'homeNormal', text: "It's decent enough, I guess. Do you even know how to drive?" },
      { speaker: 'right', pose: 'idle', text: "Just press accelerate, right?" },
      { speaker: 'left', pose: 'homeSad', text: "It's a manual... clutch in, shift gears, ease up on the clutch, then accelerate... You know what? I'll give you a quick lesson.", emphasis: true },
    ],
    finalActionLabel: 'LEARN TO DRIVE',
  },
  openingSayakaFarewell: {
    id: 'openingSayakaFarewell',
    category: 'OPENING / STORY',
    testerLabel: 'Opening — Sayaka Finishes Driving Lesson',
    title: 'SHINONOME // DRIVE SAFE',
    once: true,
    characters: { left: 'sayakaFujieda', right: '$PLAYER' },
    pages: [
      { speaker: 'left', pose: 'homeHappy', text: "Not bad for your first time! Just listen to the engine more. You'll get more out of the car that way." },
      { speaker: 'right', pose: 'idle', text: "Wow, didn't think you knew that much about cars." },
      { speaker: 'left', pose: 'homeBlushing', text: "Teehehe, what would I know about cars?" },
      { speaker: 'left', pose: 'homeHappy', text: "If you want more practice, there's a driving school in Oshiage. They've got launch, standing-start and rolling-start lessons." },
      { speaker: 'left', pose: 'homeBlushing', text: "I hear there's an incredibly beautiful and talented lady instructor there. Very modest, too!" },
      { speaker: 'right', pose: 'idle', text: "You seem to know a lot about this instructor..." },
      { speaker: 'left', pose: 'homeHappy', text: "Oh, just what I've heard! Here, take three free lesson vouchers — one for each advanced course. Even the retries are covered!" },
      { speaker: 'left', pose: 'homeSerious', text: "Anyway, drive safely. I've got somewhere to be, but we'll see each other around." },
    ],
    finalActionLabel: 'SAY GOODBYE',
  },
  openingSayakaPhoneCall: {
    id: 'openingSayakaPhoneCall',
    category: 'OPENING / PHONE',
    testerLabel: 'Opening — Sayaka Calls from Around the Corner',
    title: 'SHINONOME // INCOMING CALL',
    once: false, // A save reloaded during delivery should still receive the call.
    presentation: 'phone',
    presentationMode: 'openingSwipe', // Opening-only pilot; other phone calls unchanged.
    callerId: 'sayakaFujieda',
    callerPose: 'idle', // Same normal Sayaka PNG already preloaded for the garage.
    callerName: 'SAYAKA',
    label: 'INCOMING CALL',
    pages: [
      { speaker: 'caller', text: "Hey {PLAYER_FIRST_NAME}! I'm just around the corner. I've got your new car, meet me in your garage!" },
      { speaker: 'player', text: "Great, see you in the garage!" },
    ],
  },

  openingDaichiAfterSayaka: {
    id: 'openingDaichiAfterSayaka',
    category: 'OPENING / STORY',
    testerLabel: 'Opening — Daichi Explains Tokyo and Tuning',
    title: 'TOKYO SHIFT // FIRST NIGHT',
    once: true,
    characters: { left: 'daichiSakamoto', right: '$PLAYER' },
    pages: [
      { speaker: 'left', pose: 'idle', text: "After all these years talking about driving, you finally got one of your own." },
      { speaker: 'right', pose: 'idle', text: "Sayaka said some friends helped get it ready. I still can't believe it's mine." },
      { speaker: 'left', pose: 'idle', text: "They've picked a good one. Nothing fancy, but plenty of potential. You've always wanted to get out and race." },
      { speaker: 'right', pose: 'idle', text: "It looks stock to me, though?" },
      { speaker: 'left', pose: 'win', text: "Good thing your childhood friend knows which end of a spanner to hold. We'll get some life out of it." },
      { speaker: 'left', pose: 'idle', text: "Engine, gearing, grip — we can tune it here. Bigger upgrades will need a better-equipped workshop." },
      { speaker: 'left', pose: 'idle', text: "When you're ready, find a night meet on the map. Most races are for cash; bigger challenges will come." },
      { speaker: 'left', pose: 'idle', text: "Pink slips mean racing for the keys. Lose, and your car's gone. I'd stick to cash while you're learning." },
      { speaker: 'left', pose: 'win', text: "Go try a race, then bring it back. We'll figure out what needs work.", emphasis: true },
    ],
    finalActionLabel: 'START THE NIGHT',
  },

  oshiageInstructorFirstEncounter: {
    id: 'oshiageInstructorFirstEncounter',
    category: 'OSHIAGE / STORY',
    testerLabel: 'Oshiage — Meet the Mysterious Lady Instructor',
    title: 'OSHIAGE // FIRST ENCOUNTER',
    once: true,
    characters: { left: '$PLAYER', right: 'sayakaFujieda' },
    pages: [
      { speaker: 'left', pose: 'idle', rightPose: 'oshiageNeutral',
        text: 'Oh hi... you look so much like my family friend...' },
      { speaker: 'right', pose: 'oshiageConcerned', nameOverride: 'LADY INSTRUCTOR',
        text: "What do you mean?! I'm just a random driving instructor." },
      { speaker: 'right', pose: 'oshiageExplaining', nameOverride: 'LADY INSTRUCTOR',
        text: 'Call me Lady Instructor. Now, are you here to learn how to drive, or to ask questions?' },
    ],
    finalActionLabel: 'VISIT SCHOOL',
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
        text: "There are seven of us in the {REGION} crew. We're calling you out.",
      },
      {
        speaker: 'left',
        speakerLabel: '{NPC_NAME}',
        pose: 'idle',
        text: 'Beat all seven, one after another.',
      },
      {
        speaker: 'left',
        speakerLabel: '{NPC_NAME}',
        pose: 'win',
        text: 'Keep one car through all seven and go 7–0 — that is a Perfect Streak. Extra rewards.',
        emphasis: true,
      },
      {
        speaker: 'left',
        speakerLabel: '{NPC_NAME}',
        pose: 'idle',
        text: 'Lose? The challenge pauses. Tune up, come back, and pick up at the racer who stopped you.',
      },
      {
        speaker: 'right',
        pose: 'win',
        text: "Seven races. I'm in.",
      },
    ],
    finalActionLabel: 'ACCEPT CHALLENGE',
    secondaryFinalActionLabel: 'MAYBE LATER',
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

  crewRecruitmentInvite: {
    id: 'crewRecruitmentInvite',
    category: 'CREW / RECRUITMENT',
    testerLabel: 'Crew — Signature Car Invitation',
    title: '{REGION} // CREW INVITE',
    once: false,
    characters: {
      left: '$RIVAL',
      right: null,
    },
    preview: {
      characterOverrides: { RIVAL: 'aoiShindou' },
      variables: {
        REGION: 'ODAIBA',
        RIVAL_NAME: 'AOI SHINDOU',
        SIGNATURE_CAR: 'TOYOTA SPRINTER TRUENO AE86',
        CREW_LINE_1: "You've got my attention. That was a clean run.",
        CREW_LINE_2: "The car you saw tonight isn't the one I'm known for. This is my car: TOYOTA SPRINTER TRUENO AE86.",
        CREW_LINE_3: "Stock for stock. Beat me in it and I'll run with your crew.",
        CREW_ACCEPT_LABEL: 'ACCEPT STOCK RACE',
        CREW_DECLINE_LABEL: 'NOT NOW',
      },
    },
    introCard: {
      character: 'left',
      name: '{RIVAL_NAME}',
      subtitle: '{REGION} // CREW CANDIDATE',
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        pose: 'loss',
        text: '{CREW_LINE_1}',
      },
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        pose: 'idle',
        text: '{CREW_LINE_2}',
      },
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        pose: 'win',
        text: '{CREW_LINE_3}',
        emphasis: true,
        requireActionButton: true,
        actionLabel: '{CREW_ACCEPT_LABEL}',
        secondaryActionLabel: '{CREW_DECLINE_LABEL}',
      },
      {
        // Accepting moves INTO the choice page without closing this manga.
        // The rival silhouette fades away; both cars then occupy the frame.
        speaker: 'system',
        speakerLabel: 'CHOOSE A CAR TO RACE',
        leftCharacter: '',
        rightCharacter: '',
        fadeOutActors: true,
        hideSceneTitle: true,
        requireActionButton: true,
        text: 'You can only race an unmodified stock car of the same class. Choose one from your garage, or acquire one and come back later.',
      },
    ],
    finalActionLabel: 'READY TO RACE',
    secondaryFinalActionLabel: 'RACE LATER',
  },

  crewRecruitmentJoin: {
    id: 'crewRecruitmentJoin',
    category: 'CREW / RECRUITMENT',
    testerLabel: 'Crew — Join or Decline',
    title: '{REGION} // JOIN THE CREW?',
    once: false,
    characters: { left: '$RIVAL', right: '$PLAYER' },
    preview: {
      characterOverrides: { RIVAL: 'aoiShindou' },
      variables: {
        REGION: 'ODAIBA', RIVAL_NAME: 'AOI SHINDOU',
        CREW_JOIN_LINE: "You're the real deal. Could I join your crew?",
      },
    },
    pages: [
      { speaker: 'left', speakerLabel: '{RIVAL_NAME}', pose: 'loss',
        text: '{CREW_JOIN_LINE}', emphasis: true },
      { speaker: 'left', speakerLabel: '{RIVAL_NAME}', pose: 'idle',
        text: 'I will bring my car and my best driving. What do you say?',
        requireActionButton: true,
        actionLabel: 'WELCOME ABOARD',
        secondaryActionLabel: 'NOT THIS TIME' },
    ],
  },

  crewRecruitmentAnswer: {
    id: 'crewRecruitmentAnswer',
    category: 'CREW / RECRUITMENT',
    testerLabel: 'Crew — Player Response',
    title: '{REGION} // THE DECISION',
    once: false,
    characters: { left: '$RIVAL', right: '$PLAYER' },
    preview: {
      characterOverrides: { RIVAL: 'aoiShindou' },
      variables: {
        REGION: 'ODAIBA', RIVAL_NAME: 'AOI SHINDOU',
        PLAYER_REPLY: "You're in. Welcome to the team!",
        RIVAL_REPLY: "I'll bring the car to Crew Space.",
      },
    },
    pages: [
      { speaker: 'right', speakerLabel: '{PLAYER_NAME}', pose: 'idle',
        text: '{PLAYER_REPLY}', emphasis: true },
      { speaker: 'left', speakerLabel: '{RIVAL_NAME}', pose: 'idle',
        text: '{RIVAL_REPLY}' },
    ],
    finalActionLabel: 'CONTINUE',
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
        MECHANIC_SUBTITLE: 'SPOON SPORTS // REGION MECHANIC',
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
        text: "Come with me. I'll show you the shop.",
        emphasis: true,
      },
    ],
    finalActionLabel: '{SHOP} DISCOVERED',
  },

  regionalChampionVictory: {
    id: 'regionalChampionVictory',
    category: 'REGION / VICTORY',
    testerLabel: 'Region — Champion Victory',
    title: '{REGION} // CHAMPION',
    once: true,
    characters: {
      left: '$RIVAL',
      right: '$PLAYER',
    },
    preview: {
      characterOverrides: { RIVAL: 'natsumiKagawa' },
      variables: {
        REGION: 'SHINAGAWA',
        RIVAL_NAME: 'NATSUMI KAGAWA',
        CASH_REWARD: '250,000',
        DONOR: 'HONDA CIVIC TYPE R EK9',
        COUPON_AWARDS: '1',
        BADGE: 'REGIONAL CHAMPION',
      },
    },
    introCard: {
      character: 'left',
      name: '{RIVAL_NAME}',
      subtitle: '{REGION} // FINAL RIVAL',
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        pose: 'loss',
        text: 'You made it through all seven. It was not perfect, but it counts.',
      },
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        pose: 'idle',
        text: 'From tonight, you are the {REGION} Champion.',
        emphasis: true,
      },
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        pose: 'win',
        text: 'Prize is ¥{CASH_REWARD}. You also earned {COUPON_AWARDS} × {DONOR} coupon and the {BADGE} badge.',
      },
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        pose: 'idle',
        text: "You can attempt the Perfect Streak any time. Use the challenge badge at the Meet when you're ready.",
      },
    ],
    finalActionLabel: 'CLAIM CHAMPION REWARDS',
  },

  regionalChallengeLoss: {
    id: 'regionalChallengeLoss',
    category: 'REGION / CHALLENGE RESULT',
    testerLabel: 'Region — Challenge Paused',
    title: '{REGION} // CHALLENGE PAUSED',
    once: false,
    characters: {
      left: '$RIVAL',
      right: '$PLAYER',
    },
    preview: {
      characterOverrides: { RIVAL: 'natsumiKagawa' },
      variables: {
        REGION: 'SHINAGAWA',
        RIVAL_NAME: 'NATSUMI KAGAWA',
      },
    },
    introCard: {
      character: 'left',
      name: '{RIVAL_NAME}',
      subtitle: '{REGION} // REGIONAL CREW',
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        pose: 'win',
        text: 'That is where the run stops.',
      },
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        pose: 'idle',
        text: "Use the regional challenge badge at the Meet whenever you're ready to continue.",
      },
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        pose: 'idle',
        text: 'If we call you back, you pick up from the racer who stopped you. Bring the car back ready.',
        emphasis: true,
      },
    ],
    finalActionLabel: 'BACK TO THE MEET',
  },

  regionalPerfectVictory: {
    id: 'regionalPerfectVictory',
    category: 'REGION / VICTORY',
    testerLabel: 'Region — Perfect 7–0 Victory',
    title: '{REGION} // PERFECT 7–0',
    once: true,
    characters: {
      left: '$RIVAL',
      right: '$PLAYER',
    },
    preview: {
      characterOverrides: { RIVAL: 'natsumiKagawa' },
      variables: {
        REGION: 'SHINAGAWA',
        RIVAL_NAME: 'NATSUMI KAGAWA',
        CASH_REWARD: '500,000',
        DONOR: 'HONDA CIVIC TYPE R EK9',
        COUPON_AWARDS: '2',
        BADGE: 'REGIONAL CHAMPION ★',
      },
    },
    introCard: {
      character: 'left',
      name: '{RIVAL_NAME}',
      subtitle: '{REGION} // FINAL RIVAL',
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        pose: 'loss',
        text: 'Seven races. No losses. Nobody in {REGION} can argue with that.',
      },
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        pose: 'idle',
        text: 'That is a perfect sweep. Your Champion badge gets the star.',
        emphasis: true,
      },
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        pose: 'win',
        text: 'The sweep pays ¥{CASH_REWARD} and {COUPON_AWARDS} × {DONOR} coupon. Badge: {BADGE}.',
      },
    ],
    finalActionLabel: 'REGIONAL CHAMPION ★',
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

  specialChallengerWin: {
    id: 'specialChallengerWin',
    category: 'STREET / EVENT RESULT',
    testerLabel: 'Special Challenger — Win',
    title: 'SPECIAL CHALLENGER // DEFEATED',
    once: false,
    characters: { left: '$LOSER', right: '$WINNER' },
    preview: {
      characterOverrides: {
        RIVAL: 'rikuAkamine',
        LOSER: 'rikuAkamine',
        WINNER: 'renMizuno',
      },
      variables: { RIVAL_NAME: 'RIKU AKAMINE', CAR: 'SKYLINE' },
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        leftPose: 'loss',
        rightPose: 'win',
        text: 'You earned it. The {CAR} is yours.',
      },
      {
        speaker: 'right',
        leftPose: 'loss',
        rightPose: 'win',
        text: 'That was worth answering.',
      },
    ],
    finalActionLabel: 'TAKE THE KEYS',
  },

  specialChallengerLoss: {
    id: 'specialChallengerLoss',
    category: 'STREET / EVENT RESULT',
    testerLabel: 'Special Challenger — Loss',
    title: 'SPECIAL CHALLENGER // LOST',
    once: false,
    characters: { left: '$WINNER', right: '$LOSER' },
    preview: {
      characterOverrides: {
        RIVAL: 'rikuAkamine',
        WINNER: 'rikuAkamine',
        LOSER: 'renMizuno',
      },
      variables: { RIVAL_NAME: 'RIKU AKAMINE', CAR: 'AE86' },
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{RIVAL_NAME}',
        leftPose: 'win',
        rightPose: 'loss',
        text: 'That was the deal. The {CAR} comes with me.',
        emphasis: true,
      },
      {
        speaker: 'right',
        leftPose: 'win',
        rightPose: 'loss',
        text: 'A deal is a deal.',
      },
    ],
    finalActionLabel: 'CONTINUE',
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
    characters: { left: '$LOSER', right: '$WINNER' },
    preview: {
      characterOverrides: {
        RIVAL: 'rikuAkamine',
        LOSER: 'rikuAkamine',
        WINNER: 'renMizuno',
      },
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
    characters: { left: '$WINNER', right: '$LOSER' },
    preview: {
      characterOverrides: {
        RIVAL: 'rikuAkamine',
        WINNER: 'rikuAkamine',
        LOSER: 'renMizuno',
      },
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

  // Scene 04: ONE chapter and tester entry, staged in the same workshop.
  // CanalYardStory runs the middle seven pages through the actual ringing
  // phone/pickup UI, not the MangaCutscene dialogue renderer.
  canalYardBiggerDreams: {
    id: 'canalYardBiggerDreams',
    category: 'CAREER / STORY',
    testerLabel: 'Career 04 — Bigger Dreams (Canal Yard + Sayaka Call)',
    title: 'CANAL YARD // BIGGER DREAMS',
    once: true,
    characters: { left: 'daichiSakamoto', right: '$PLAYER' },
    pages: [
      { speaker: 'left', pose: 'win',
        text: "Look at this place! Proper equipment, decent tools, and room to work without tripping over somebody's gearbox!" },
      { speaker: 'right', pose: 'idle', text: "You mean YOUR gearbox?" },
      { speaker: 'left', pose: 'win',
        text: "That gearbox had sentimental value! Anyway, renting this place is a huge step. We can finally build something serious — a workshop people can trust." },
      { speaker: 'left', pose: 'idle',
        text: "And if we're taking on the tougher regional crews, we'll need better grip, stronger drivetrains, maybe more power—" },
      { speaker: 'right', pose: 'idle', text: "Oh, sorry! I've got to take this call." },
      { speaker: 'left', leftCharacter: 'sayakaFujieda', rightCharacter: '$PLAYER', pose: 'homeHappy',
        phoneCall: true, text: "Hello! Just checking if you’re still driving safely…wait… did I just hear someone say racing?" },
      { speaker: 'right', leftCharacter: 'sayakaFujieda', rightCharacter: '$PLAYER',
        phoneCall: true, text: "Yeah! My friend who's a mechanic is helping me prepare for the tougher regional challenges." },
      { speaker: 'left', leftCharacter: 'sayakaFujieda', rightCharacter: '$PLAYER', pose: 'homeSerious',
        phoneCall: true, text: "Regional challenges?! You're racing that much? Please be careful!" },
      { speaker: 'left', leftCharacter: 'sayakaFujieda', rightCharacter: '$PLAYER', pose: 'homeHappy',
        phoneCall: true, text: "And tell your mechanic friend — more horsepower is useless if the tyres can't put it down!" },
      { speaker: 'right', leftCharacter: 'sayakaFujieda', rightCharacter: '$PLAYER',
        phoneCall: true, text: "...Since when do you know so much about tuning?" },
      { speaker: 'left', leftCharacter: 'sayakaFujieda', rightCharacter: '$PLAYER', pose: 'homeBlushing',
        phoneCall: true, text: "Oh! The internet! Very educational! Anyway, that beautiful instructor in Oshiage can help if you need more lessons!" },
      { speaker: 'left', leftCharacter: 'sayakaFujieda', rightCharacter: '$PLAYER', pose: 'homeHappy',
        phoneCall: true, text: "Drive safely, okay? Byeee!" },
      { speaker: 'left', leftCharacter: 'daichiSakamoto', rightCharacter: '$PLAYER', pose: 'idle',
        text: "Everything alright?" },
      { speaker: 'right', leftCharacter: 'daichiSakamoto', rightCharacter: '$PLAYER',
        text: "Yeah, just an old family friend checking up on me." },
      { speaker: 'left', leftCharacter: 'daichiSakamoto', rightCharacter: '$PLAYER', pose: 'win',
        text: "Good! Oshiage Custom Works can handle our paint and wheels now. So where were we? Spending all our money on car parts. Professionally, of course!",
        emphasis: true },
    ],
    finalActionLabel: 'START BUILDING',
  },

  // Career chapter 05: the Ginza collection commissions Daichi to work on an
  // RWB 911. The curator's name/identity and personal ownership remain hidden.
  warehouseHqUnlocked: {
    id: 'warehouseHqUnlocked',
    category: 'CAREER / STORY',
    testerLabel: 'Career 05 — The Ginza Connection (Warehouse HQ)',
    title: 'WAREHOUSE HQ // THE GINZA CONNECTION',
    once: true,
    characters: { left: 'daichiSakamoto', right: '$PLAYER' },
    pages: [
      { speaker: 'left', pose: 'win',
        text: "Would you look at this place! Proper lifts, separate bays, room for serious builds. Even after paying to fit it out, this lease is a bargain!" },
      { speaker: 'right', pose: 'idle',
        text: "You're already planning where every car goes, aren't you?" },
      { speaker: 'left', pose: 'win',
        text: "You bet! This is where Tokyo's best cars come to get tuned. Or... where I'd like them to, anyway!" },
      // RWB rolls into frame at the beginning of page four.
      { speaker: 'right', pose: 'idle', cinematicBeat: 'rwbArrival',
        text: "Wait... Daichi! Is that an RWB Porsche?!" },
      { speaker: 'left', pose: 'win',
        text: "Yep. Right on time. This one's from the Ginza collection. The curator sent it over for some specialist work." },
      { speaker: 'right', pose: 'idle',
        text: "The Ginza collection? You know the curator?" },
      { speaker: 'left', pose: 'idle',
        text: "Only through work orders. We've never met. But she knows her cars. Her instructions were pretty clear: 'Grip before horsepower.' I like how she thinks!" },
      { speaker: 'right', pose: 'idle',
        text: "So... this is a pretty big deal, then?" },
      { speaker: 'left', pose: 'win',
        text: "Huge! If we get this right, it could open a few doors. Now, let's get to work. And whatever you do, DON'T lean on the paint!",
        emphasis: true },
    ],
    finalActionLabel: 'GET TO WORK',
  },

  // Scene 06: seven-badge turning point; the seven main rivals are silent
  // memories, not visitors or recruitable crew. GarageScene owns the montage.
  sevenRegionsConquered: {
    id: 'sevenRegionsConquered',
    category: 'CAREER / STORY',
    testerLabel: 'Career 06 — Beyond Seven (Rival Flags + Crew)',
    title: 'TOKYO SHIFT // BEYOND SEVEN',
    once: true,
    characters: { left: 'daichiSakamoto', right: '$PLAYER' },
    pages: [
      { speaker: 'left', pose: 'win',
        text: "Seven badges. All seven regions. You know, when we first started, I wasn't even sure we'd make it out of Odaiba!" },
      { speaker: 'right', pose: 'idle',
        text: "Feels like ages ago. I can still picture every one of those final races." },
      // A hidden cinematic-only page keeps Daichi's next line intact after
      // the gallery NEXT button, rather than silently skipping his dialogue.
      { speaker: 'system', text: '', cinematicBeat: 'sevenRivalsMontage', galleryOnly: true },
      { speaker: 'left', pose: 'idle',
        text: "Every one of them made you earn it. Tokyo knows your name. Even the elite Skytree Underground Meet is open to you now." },
      { speaker: 'right', pose: 'idle',
        text: "But I'm not finished. I want to be Tokyo Champion. Not just champion of seven regions. I want to be the best in all of Tokyo." },
      { speaker: 'left', pose: 'idle',
        text: "You know... I've got a dream too. I want to become a world-class racing engineer. Build cars that can compete with the very best, anywhere in the world." },
      { speaker: 'right', pose: 'idle',
        text: "So... you reckon we can actually get there?" },
      { speaker: 'left', pose: 'win',
        text: "I think we can. But not just the two of us. We've come this far together, but if we're going any further, we're going to need a proper team." },
      { speaker: 'right', pose: 'idle',
        text: "A team? Where are we going to find people willing to race with us?" },
      { speaker: 'left', pose: 'win',
        text: "You've got a reputation now! Keep racing around Tokyo and don't be surprised if other drivers start approaching you. Some might even want to join your crew!" },
      { speaker: 'left', pose: 'idle',
        text: "Of course, they'll want to know you're the real deal. You might have to prove yourself against them first. But that's never stopped you before!" },
      { speaker: 'left', pose: 'win',
        text: "Actually, there's something I've been meaning to show you. I've cleared out a space here at HQ. Welcome to Crew Space! Looks a little empty now, doesn't it? Let's see what we can do about that!" },
      { speaker: 'left', pose: 'idle',
        text: "I put a quick guide on the whiteboard here. If you need a reminder about recruiting drivers from all seven regions, you can always come back and check it.",
        emphasis: true },
    ],
    finalActionLabel: 'ENTER CREW SPACE',
  },

  // Scene 07: the seven-driver team finally comes together in Crew Space.
  // The actual recruits in the group cinematic come from the player's save.
  // Sayaka visits because she delivered the starter car; her Ginza identity
  // and her former team-strategist role remain secret to both friends.
  fullCrewTogether: {
    id: 'fullCrewTogether',
    category: 'CAREER / STORY',
    testerLabel: 'Career 07 — One Crew, Seven Roads (Complete Crew)',
    title: 'CREW SPACE // ONE CREW, SEVEN ROADS',
    once: true,
    characters: { left: 'daichiSakamoto', right: '$PLAYER' },
    pages: [
      { speaker: 'left', pose: 'win',
        text: "Seven drivers, seven cars... and somehow there's already an argument about tyre pressure!" },
      { speaker: 'right', pose: 'idle',
        text: "You said we needed a proper team!" },
      { speaker: 'left', pose: 'win',
        text: "One driver from every region. You didn't just beat them — you earned their trust. That's worth more than any badge." },
      // One unseen gallery page; NEXT resumes with the player's captain
      // reflection rather than skipping it behind the portrait overlay.
      { speaker: 'system', text: '', cinematicBeat: 'completeCrewGroup', galleryOnly: true },
      { speaker: 'right', pose: 'idle',
        text: "When we started, all I wanted was to see how far I could go. Now we've got seven other people counting on us." },
      { speaker: 'left', pose: 'idle',
        text: "And that's what makes this different. One fast driver can win a race. A real team has to win together." },
      { speaker: 'right', pose: 'idle',
        text: "So what's next?" },
      { speaker: 'left', pose: 'idle',
        text: "Regional crew battles! Three of our drivers against three of theirs. And each region has different rules — stock cars, power limits, even races without NOS." },
      { speaker: 'right', pose: 'idle',
        text: "Wait... so this time I'm not the one behind the wheel?" },
      { speaker: 'left', pose: 'win',
        text: "You're the captain now! You choose the drivers and the lineup. I'll get their cars ready. Then we trust them to do what they do best." },
      { speaker: 'left', leftCharacter: 'sayakaFujieda', leftPose: 'homeHappy',
        text: "Oh! Wow, you have so many friends? I never would've thought! I only stopped by to see if you've been looking after that car I delivered!" },
      { speaker: 'right', leftCharacter: 'sayakaFujieda', leftPose: 'homeHappy',
        text: "Sayaka?! Ah... well... let's just say the car's come a long way since then!" },
      { speaker: 'left', leftCharacter: 'sayakaFujieda', leftPose: 'homeSerious',
        text: "Seven drivers, hmm? You'll need to know everyone's strengths. Who handles pressure, which cars suit which races, who's best at launching... and you'll need a proper plan!" },
      { speaker: 'left', leftCharacter: 'sayakaFujieda', leftPose: 'homeHappy',
        text: "And if you're still getting used to your crew's cars, there's always the driving school in Oshiage! I hear the intelligent, beautiful lady instructor knows the ideal launch revs and most efficient shift bands for practically every car in Japan!" },
      { speaker: 'left', leftCharacter: 'daichiSakamoto', pose: 'idle',
        text: "That's... surprisingly detailed advice. I'm Daichi, by the way. The engineer." },
      { speaker: 'left', leftCharacter: 'sayakaFujieda', leftPose: 'homeBlushing',
        text: "Sayaka! Oh, it's just common sense, dear! Anyway, look after each other, alright?" },
      { speaker: 'left', leftCharacter: 'daichiSakamoto', pose: 'win',
        text: "Well, she's got a point! Come on, Captain. Seven regions, seven crew battles. Let's show Tokyo what we've built together!",
        emphasis: true },
    ],
    finalActionLabel: "LET'S RACE TOGETHER",
  },

  // Career chapter 02: reached from the existing nine-win Auto Market invite.
  // One 12-page manga, with two cast/location changes using shared renderer.
  centralTokyoUnlocked: {
    id: 'centralTokyoUnlocked',
    category: 'CAREER / STORY',
    testerLabel: 'Career 02 — Tokyo Takes Notice (9 Wins)',
    title: 'TOKYO SHIFT // TOKYO TAKES NOTICE',
    once: true,
    characters: { left: 'aoiShindou', right: '$PLAYER' },
    backdrops: {
      odaiba: { key: 'storyNineWinsOdaibaNight', path: 'assets/Meet/Night/odaiba_7eleven_night.png' },
      workshop: { key: 'storyNineWinsShinonomeNight', path: 'assets/Garage/shinonome_workshop_night.png' },
    },
    pages: [
      {
        speaker: 'left', pose: 'win', backdrop: 'odaiba',
        text: "Nine wins already? Okay, you're making it pretty hard for the rest of us to ignore you!",
      },
      {
        speaker: 'right', pose: 'idle',
        text: "Wait, you've been counting?",
      },
      {
        speaker: 'left', pose: 'idle',
        text: "Of course! People talk around here. But winning a few cash races is one thing. Think you can beat an entire regional crew?",
      },
      {
        speaker: 'right', pose: 'idle',
        text: "An entire crew?",
      },
      {
        speaker: 'left', pose: 'win',
        text: "Seven racers, one after another. Beat us all and you're Odaiba Champion. Win seven straight with the same car and no losses? That's a Perfect Streak. Extra prizes!",
      },
      {
        speaker: 'left', pose: 'idle',
        text: "Lose a race and you can come back to finish the championship. But a perfect run? You'll have to start that again. Emi's waiting at the end, by the way. Good luck!",
      },
      {
        speaker: 'left', leftCharacter: 'daichiSakamoto', pose: 'idle', backdrop: 'workshop',
        text: "So Aoi finally called you out? Nine wins and you've got the Odaiba crew chasing you. Not bad!",
      },
      {
        speaker: 'left', leftCharacter: 'daichiSakamoto', pose: 'idle',
        text: "But Odaiba's just the beginning. Shinagawa and Tatsumi are opening up too. Seven regions in total, and believe me, they get tougher as you go.",
      },
      {
        speaker: 'left', leftCharacter: 'daichiSakamoto', pose: 'idle',
        text: "We'll need to keep improving the car. Grip, gearing, power delivery... and sooner or later, maybe something faster altogether.",
      },
      {
        speaker: 'left', leftCharacter: 'daichiSakamoto', pose: 'win',
        text: "Good timing, actually. Tokyo Auto Market's open to you now. New cars, used cars, even tuned builds. And don't throw away those prize coupons — collect enough for a model and you can redeem a car there.",
      },
      {
        speaker: 'right', leftCharacter: 'daichiSakamoto', pose: 'idle', leftPose: 'idle',
        text: "So what's the plan? Take on every region?",
      },
      {
        speaker: 'left', leftCharacter: 'daichiSakamoto', pose: 'win',
        text: "One at a time. I'll look after the car. You keep winning races. Who knows? Maybe one day they'll know our names all over Tokyo.",
        emphasis: true,
      },
    ],
    finalActionLabel: 'UNLOCK TOKYO AUTO MARKET',
  },

  // Career chapter 03: after the FIRST regional challenge victory, on the
  // driver's next ordinary workshop visit. No extra prizes; the championship
  // badge and cash/coupons were awarded by the race settlement already.
  firstRegionalChampion: {
    id: 'firstRegionalChampion',
    category: 'CAREER / STORY',
    testerLabel: 'Career 03 — First Regional Champion',
    title: 'SHINONOME // FIRST CHAMPION',
    once: true,
    characters: { left: 'daichiSakamoto', right: '$PLAYER' },
    preview: { variables: { REGION: 'ODAIBA' } },
    pages: [
      {
        speaker: 'left', pose: 'win',
        text: "Well, look who's back. The {REGION} Champion! I was going to clear a space for your badge, but there's barely room for my tools.",
      },
      {
        speaker: 'right', pose: 'idle',
        text: "What? You didn't think I'd win?",
      },
      {
        speaker: 'left', pose: 'idle',
        text: "Oh, I thought you'd win. I just wasn't sure the workshop would survive you preparing for it.",
      },
      {
        speaker: 'right', pose: 'idle',
        text: "Hey, you helped me get there, you know.",
      },
      {
        speaker: 'left', pose: 'win',
        text: "I worked on the car. You're the one who beat all seven drivers in that regional challenge. You're the {REGION} Champion now. You earned it.",
        emphasis: true,
      },
      {
        speaker: 'left', pose: 'idle',
        text: "And word travels fast. Shibuya's taking challengers now. Different drivers, tougher cars. The next regional challenge won't come quite so easily.",
      },
      {
        speaker: 'left', pose: 'win',
        text: "But first, let's enjoy this win. Tomorrow we'll figure out what the next build needs. One region down, six to go!",
        emphasis: true,
      },
    ],
    finalActionLabel: 'KEEP RACING',
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
      { speaker: 'left', speakerLabel: '{HOST_NAME}', pose: 'happy', text: "Remember when I brought your first car over? You've come a long way since then." },
      { speaker: 'right', pose: 'idle', text: "Sayaka? You're the person inviting me to Ginza?" },
      { speaker: 'left', speakerLabel: '{HOST_NAME}', pose: 'normal', text: "I curate and manage the Ginza collection. It's a side of my work I prefer to keep separate until someone is ready." },
      { speaker: 'left', speakerLabel: '{HOST_NAME}', pose: 'normal', text: "Complete tuner builds, competition cars, and cars with histories that don't appear in normal listings. This collection isn't open to the public." },
      { speaker: 'left', speakerLabel: '{HOST_NAME}', pose: 'serious', text: "You've been invited to see it — and if you can afford one, you can buy it. But collector cars stay complete.", emphasis: true },
    ],
    finalActionLabel: 'UNLOCK GINZA',
  },

  // Reveal Sayaka's practical strategy experience after Ginza and a legitimate
  // seven-member crew. She is a family friend, NOT the player's father's strategist.
  // Lightweight, skippable Career v1 Championship milestones. The official
  // result and rewards are already saved before any victory dialogue appears.
  // Played from the final eight-round season report ONLY if the player
  // has not met BOTH Driver and Crew qualification thresholds.
  // A season-specific historyId lets each failed season have one reflection.
  proSeasonNotQualified: {
    id: 'proSeasonNotQualified',
    category: 'PRO CIRCUIT / CAREER',
    testerLabel: 'Pro Season — Missed Tokyo Qualification',
    title: 'PRO SEASON // NOT QUALIFIED',
    once: true,
    characters: { left: 'sayakaFujieda', right: '$PLAYER' },
    pages: [
      { speaker: 'left', pose: 'track',
        text: "The eight rounds are finished. We haven't met both qualification targets for Tokyo this season." },
      { speaker: 'right', pose: 'idle',
        text: "So there's no Championship invitation this time." },
      { speaker: 'left', pose: 'track',
        text: "That's right. We can review where we lost points, then plan which Driver and Crew events to enter next season." },
      { speaker: 'left', leftCharacter: 'daichiSakamoto', pose: 'idle',
        text: "I'll go through the car setups. The workshop's still here. We've got another season ahead of us." },
      { speaker: 'right', leftCharacter: 'daichiSakamoto', pose: 'idle',
        text: "Then let's see what we can improve." },
    ],
    finalActionLabel: 'VIEW SEASON REPORT',
  },
  tokyoChampionshipOpening: {
    id: 'tokyoChampionshipOpening',
    category: 'TOKYO CHAMPIONSHIP / CAREER',
    testerLabel: 'Tokyo Championship — The Final Sixteen',
    title: 'TOKYO CHAMPIONSHIP // THE FINAL SIXTEEN',
    once: true,
    characters: { left: 'sayakaFujieda', right: '$PLAYER' },
    pages: [
      { speaker: 'left', pose: 'track', text: "Eight professional rounds. You and the crew earned your place among Tokyo's final sixteen." },
      { speaker: 'right', pose: 'idle', text: "We've made it this far. What do we need to win?" },
      { speaker: 'left', pose: 'track', text: "Three stages: individual knockouts, crew battles and four-wide racing. Every point counts, even if we lose a heat." },
      { speaker: 'left', leftCharacter: 'daichiSakamoto', pose: 'win',
        text: "The cars are ready. You focus on the driving. I'll keep the workshop running!" },
      { speaker: 'right', leftCharacter: 'daichiSakamoto', pose: 'idle',
        text: "Then let's make this count.", emphasis: true },
    ],
    finalActionLabel: 'VIEW THE CHAMPIONSHIP',
  },
  tokyoChampionshipVictory: {
    id: 'tokyoChampionshipVictory',
    category: 'TOKYO CHAMPIONSHIP / CAREER',
    testerLabel: 'Tokyo Champion — Career Finale',
    title: 'TOKYO SHIFT // TOKYO CHAMPION',
    once: true,
    characters: { left: 'daichiSakamoto', right: '$PLAYER' },
    pages: [
      { speaker: 'left', pose: 'win', text: "TOKYO CHAMPION! Do you remember the first car in that little garage? Look how far we've come!" },
      { speaker: 'right', pose: 'win', text: "Seven regions, seven crew mates, the Open Circuit, the Pro Season... We all worked for this." },
      { speaker: 'left', leftCharacter: 'sayakaFujieda', pose: 'trackHappy',
        text: "And today, the strategy held together. Every driver on this team contributed. I'm proud of you." },
      { speaker: 'right', leftCharacter: 'sayakaFujieda', pose: 'win',
        text: "Couldn't have done it without any of you." },
      { speaker: 'left', leftCharacter: 'arkonDen', pose: 'normal',
        text: "Well driven. Looks like backing your team was a pretty good decision." },
      { speaker: 'right', leftCharacter: 'arkonDen', pose: 'idle',
        text: "Thanks, Aruken. There's still a lot more racing to do." },
      { speaker: 'left', leftCharacter: 'sayakaFujieda', pose: 'trackHappy',
        text: "Exactly. Enjoy the trophy tonight. Tomorrow, we defend it.", emphasis: true },
    ],
    finalActionLabel: 'CONTINUE AS TOKYO CHAMPION',
  },
  tokyoChampionshipDefeat: {
    id: 'tokyoChampionshipDefeat',
    category: 'TOKYO CHAMPIONSHIP / CAREER',
    testerLabel: 'Tokyo Championship — Final Result',
    title: 'TOKYO CHAMPIONSHIP // FINAL RESULTS',
    once: true,
    characters: { left: 'sayakaFujieda', right: '$PLAYER' },
    pages: [
      { speaker: 'left', pose: 'track', text: "That's the final result. We didn't take the title this season." },
      { speaker: 'right', pose: 'idle', text: "I know. But we learned exactly what it takes to race with the best." },
      { speaker: 'left', leftCharacter: 'daichiSakamoto', pose: 'win',
        text: "And the garage isn't going anywhere. We'll come back with the crew and try again." },
    ],
    finalActionLabel: 'PREPARE FOR NEXT SEASON',
  },
  proCircuitStrategistReveal: {
    id: 'proCircuitStrategistReveal',
    category: 'PRO CIRCUIT / STORY',
    testerLabel: 'Pro Circuit — Sayaka Joins as Strategist',
    title: 'PRO CIRCUIT // THE STRATEGIST',
    once: true,
    characters: { left: 'sayakaFujieda', right: '$PLAYER' },
    pages: [
      { speaker: 'left', speakerLabel: 'SAYAKA FUJIEDA', pose: 'track', text: "Seven drivers. You've built a team people across Tokyo respect. Well done." },
      { speaker: 'right', pose: 'idle', text: "Sayaka? I thought you were managing the Ginza collection." },
      { speaker: 'left', speakerLabel: 'SAYAKA FUJIEDA', pose: 'track', text: "I am. And I've spent years at the meets helping drivers and engineers with strategy. Some of them were remarkably stubborn." },
      { speaker: 'right', pose: 'idle', text: "You never mentioned that." },
      { speaker: 'left', speakerLabel: 'SAYAKA FUJIEDA', pose: 'track', text: "It wasn't the right time. Now you're entering the professional circuit. If you'll have me, I'll join as your team strategist." },
      { speaker: 'right', pose: 'idle', text: "Welcome to the team." },
      { speaker: 'left', speakerLabel: 'SAYAKA FUJIEDA', pose: 'trackHappy', text: "Then let's study the field. You and your drivers handle the racing; I'll handle the plan.", emphasis: true },
    ],
    finalActionLabel: 'WELCOME SAYAKA',
  },

  dragComplexInvitation: {
    id: 'dragComplexInvitation',
    category: 'CENTRAL TOKYO / STORY',
    testerLabel: 'Drag Complex — Invitation',
    title: 'TOKYO DRAG COMPLEX // INVITED',
    once: true,
    characters: { left: '$PROMOTER', right: '$PLAYER' },
    preview: { characterOverrides: { PROMOTER: 'masatoKuroda' }, variables: { PROMOTER_NAME: 'MASATO KURODA' } },
    pages: [
      { speaker: 'left', speakerLabel: '{PROMOTER_NAME}', pose: 'normal', text: "Your street record got their attention. The Drag Complex wants you on a proper timing board." },
      { speaker: 'left', speakerLabel: '{PROMOTER_NAME}', pose: 'normal', text: "These are organised three-race brackets with entry fees and serious prize money. No casual rematches halfway through." },
      { speaker: 'left', speakerLabel: '{PROMOTER_NAME}', pose: 'normal', text: "Some events cap power. Some ban nitrous. Others let you bring whatever you've built. Read the rules before you enter." },
      { speaker: 'left', speakerLabel: '{PROMOTER_NAME}', pose: 'happy', text: "Win there and nobody can write your street record off as luck. Your invitation is active.", emphasis: true },
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
        pose: 'normal',
        text: 'That {CAR} is not stock, and it is not a blank canvas.',
      },
      {
        speaker: 'left',
        speakerLabel: '{HOST_NAME}',
        pose: 'serious',
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
      characterOverrides: { PROMOTER: 'masatoKuroda' },
      variables: { PROMOTER_NAME: 'MASATO KURODA' },
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{PROMOTER_NAME}',
        pose: 'normal',
        text: 'Street wins got their attention.',
      },
      {
        speaker: 'left',
        speakerLabel: '{PROMOTER_NAME}',
        pose: 'happy',
        text: 'Three-race brackets. Proper limits. No excuses.',
      },
    ],
    finalActionLabel: 'ENTER DRAG COMPLEX',
  },

  competitionIntroduction: {
    id: 'competitionIntroduction',
    category: 'STREET SHOWDOWN / STORY',
    testerLabel: 'Street Showdown — First Entry',
    title: 'STREET SHOWDOWN // THREE RACES',
    once: true,
    characters: { left: '$PROMOTER', right: '$PLAYER' },
    preview: {
      characterOverrides: { PROMOTER: 'masatoKuroda' },
      variables: { PROMOTER_NAME: 'MASATO KURODA' },
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{PROMOTER_NAME}',
        pose: 'normal',
        text: 'Three races. Same car. No tuning between rounds.',
      },
      {
        speaker: 'left',
        speakerLabel: '{PROMOTER_NAME}',
        pose: 'happy',
        text: 'Win all three and the grand prize is yours. Vehicle prizes come as car-specific coupons — collect enough and the Auto Market will hand over the car.',
      },
    ],
    finalActionLabel: 'VIEW BRACKET',
  },

  competitionChampion: {
    id: 'competitionChampion',
    category: 'STREET SHOWDOWN / RESULT',
    testerLabel: 'Street Showdown — First Victory',
    title: 'STREET SHOWDOWN // CLEARED',
    once: true,
    characters: { left: '$PROMOTER', right: '$PLAYER' },
    preview: {
      characterOverrides: { PROMOTER: 'masatoKuroda' },
      variables: { PROMOTER_NAME: 'MASATO KURODA' },
    },
    pages: [
      {
        speaker: 'left',
        speakerLabel: '{PROMOTER_NAME}',
        pose: 'normal',
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
        pose: 'happy',
        text: 'Something faster.',
        emphasis: true,
      },
    ],
    finalActionLabel: 'CONTINUE',
  }
};

export const CUTSCENE_ORDER = [
  'openingSayakaKeys',
  'openingSayakaFarewell',
  'openingSayakaPhoneCall',
  'openingDaichiAfterSayaka',
  'oshiageInstructorFirstEncounter',
  'tunerTeamCallout',
  'regionalCrewIntroduction',
  'crewRecruitmentInvite',
  'crewRecruitmentJoin',
  'crewRecruitmentAnswer',
  'tunerShopDiscovery',
  'regionalChampionVictory',
  'regionalPerfectVictory',
  'specialChallengerIntroduction',
  'specialChallengerWin',
  'specialChallengerLoss',
  'firstPinkSlipChallenge',
  'firstPinkSlipWin',
  'firstPinkSlipLoss',
  'centralTokyoUnlocked',
  'firstRegionalChampion',
  'canalYardBiggerDreams',
  'warehouseHqUnlocked',
  'sevenRegionsConquered',
  'fullCrewTogether',
  'chapter08Warehouse',
  'chapter08ManagerCall',
  'chapter08WarehouseReaction',
  'chapter08SayakaCall',
  'chapter08WarehouseFarewell',
  'chapter08Ginza',
  ...CHAPTER09_SEQUENCE,
  'proSponsorIntroduction',
  'proSponsorEpilogue',
  'chapter09SeasonRegistration',
  'ginzaInvitation',
  'ginzaHeroCarReveal',
  'proCircuitStrategistReveal',
  'dragComplexInvitation',
  'competitionIntroduction',
  'competitionChampion',
  'proSeasonNotQualified',
  'tokyoChampionshipOpening',
  'tokyoChampionshipVictory',
  'tokyoChampionshipDefeat',
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
