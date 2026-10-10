const sourceValue = (source, key, fallback = null) => {
  if (source && typeof source.get === 'function') {
    const value = source.get(key);
    return value == null ? fallback : value;
  }
  const value = source?.[key];
  return value == null ? fallback : value;
};

export const CUTSCENES = {
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
      { speaker: 'right', pose: 'idle', text: "I don't think it's like that. A family friend is dropping it off. It's from my dad." },
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
      { speaker: 'left', pose: 'homeNormal', text: "Your father said you needed this... I have no idea why, though." },
      { speaker: 'right', pose: 'idle', text: "Wow, I can't believe I've finally got my own car!" },
      { speaker: 'left', pose: 'homeNormal', text: "It's decent enough, I guess. Do you even know how to drive?" },
      { speaker: 'right', pose: 'idle', text: "Just press accelerate, right?" },
      { speaker: 'left', pose: 'homeNormal', text: "It's a manual... clutch in, shift gears, ease up on the clutch, then accelerate... You know what? I'll give you a quick lesson.", emphasis: true },
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
      { speaker: 'left', pose: 'homeNormal', text: "Not bad for your first time! Just listen to the engine more. You'll get more out of the car that way." },
      { speaker: 'right', pose: 'idle', text: "Wow, didn't think you knew that much about cars." },
      { speaker: 'left', pose: 'homeHappy', text: "Teehehe, what would I know about cars?" },
      { speaker: 'left', pose: 'homeNormal', text: "Anyway, drive safely. I've got somewhere to be, but we'll see each other around." },
    ],
    finalActionLabel: 'SAY GOODBYE',
  },
  openingDaichiStory: {
    id: 'openingDaichiStory',
    category: 'OPENING / STORY',
    testerLabel: 'Opening — Sayaka Delivers First Car / Daichi Explains Tokyo',
    title: 'TOKYO SHIFT // FIRST NIGHT',
    once: true,
    characters: { left: 'daichiSakamoto', right: '$PLAYER' },
    pages: [
      { speaker: 'left', leftCharacter: 'sayakaFujieda', speakerLabel: 'SAYAKA FUJIEDA', pose: 'homeNormal', text: "Your family asked me to bring this over. It's your first car, and I wanted to hand you the keys myself." },
      { speaker: 'right', leftCharacter: 'sayakaFujieda', pose: 'idle', text: "You knew my father from his racing days, didn't you?" },
      { speaker: 'left', leftCharacter: 'sayakaFujieda', speakerLabel: 'SAYAKA FUJIEDA', pose: 'homeHappy', text: "We go back a long way. He'd want you to enjoy this, not just look after it. I'll be around." },
      { speaker: 'left', leftCharacter: 'daichiSakamoto', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "So Sayaka brought it over. After all those years talking about driving, you've finally got one of your own." },
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

  openingDaichiAfterSayaka: {
    id: 'openingDaichiAfterSayaka',
    category: 'OPENING / STORY',
    testerLabel: 'Opening — Daichi Explains Tokyo and Tuning',
    title: 'TOKYO SHIFT // FIRST NIGHT',
    once: true,
    characters: { left: 'daichiSakamoto', right: '$PLAYER' },
    pages: [
      { speaker: 'left', pose: 'idle', text: "After all these years talking about driving, you finally got one of your own." },
      { speaker: 'right', pose: 'idle', text: "I guess it makes sense my dad would get me one." },
      { speaker: 'left', pose: 'idle', text: "And he picked a good one. It's like he knew you're going to race it. Guess you can't shake it when you're an ex-pro driver." },
      { speaker: 'right', pose: 'idle', text: "It looks stock to me, though?" },
      { speaker: 'left', pose: 'win', text: "Good thing your childhood friend knows which end of a spanner to hold. We can start with the engine, then work on the drivetrain and grip." },
      { speaker: 'left', pose: 'idle', text: "Tokyo has a whole drag scene after dark. Odaiba, Shinagawa, Tatsumi, Shibuya, Yokohama, Daikoku and Shinjuku — each has its own crowd." },
      { speaker: 'left', pose: 'idle', text: "Some racers run as teams. Others turn up on their own. Everyone has a car they're known for, but they might drive something different when you meet." },
      { speaker: 'left', pose: 'win', text: "You've got a car. You've learned to drive it. Now let's see what you can really do with it.", emphasis: true },
    ],
    finalActionLabel: 'START THE NIGHT',
  },

  ethanYuenEfCompensation: {
    id: 'ethanYuenEfCompensation',
    category: 'DEV / SPECIAL REWARD',
    testerLabel: 'Special — Ethan Yuen EF Compensation',
    title: 'ARKON DEN // FAIR IS FAIR',
    once: true,
    characters: { left: 'arkonDen', right: '$PLAYER' },
    pages: [
      {
        speaker: 'left',
        speakerLabel: 'ARKON DEN',
        pose: 'idle',
        text: 'Hi there, I heard about you missing out on a winnable pink slip. That’s not fair, is it?',
      },
      {
        speaker: 'right',
        pose: 'idle',
        text: 'Yes! It was meant to be a Honda Civic EF!',
      },
      {
        speaker: 'left',
        speakerLabel: 'ARKON DEN',
        pose: 'win',
        text: 'Fair enough, well here’s some coupons to make it up to you.',
        emphasis: true,
      },
    ],
    finalActionLabel: 'TAKE THE COUPONS',
  },

  openingRaceRules: {
    id: 'openingRaceRules',
    category: 'OPENING / SYSTEMS',
    testerLabel: 'Opening — Bets, Pinks & Street Showdowns',
    title: 'THE STREET // WHAT IS AT STAKE',
    once: true,
    characters: { left: 'daichiSakamoto', right: '$PLAYER' },
    pages: [
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "Most races are simple cash bets. Agree on the money, line up, winner gets paid." },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "Pink slips are different. Keys for keys. Lose and that car is gone. If it's your last car, your run is over.", emphasis: true },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "You'll also see local Street Showdowns. Three races, same car, no tuning between rounds. Lose once and the streak is finished." },
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'idle', text: "Some showdown prizes are vehicle coupons. Two matching coupons can claim most cars for free at the Auto Market." },
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
      },
    ],
    finalActionLabel: '{CREW_ACCEPT_LABEL}',
    secondaryFinalActionLabel: '{CREW_DECLINE_LABEL}',
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
        text: 'Keep racing in {REGION}. We may call you back for a Perfect Streak — seven straight wins, with bonus rewards.',
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
        text: 'Keep racing around {REGION}. You might get another shot at the challenge.',
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
      { speaker: 'left', speakerLabel: 'DAICHI SAKAMOTO', pose: 'win', text: "Street Showdown coupons get redeemed there as well. I've added Central Tokyo to your map.", emphasis: true },
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
      { speaker: 'left', speakerLabel: '{HOST_NAME}', pose: 'happy', text: "Remember when I brought your first car over? You've come a long way since then." },
      { speaker: 'right', pose: 'idle', text: "Sayaka? You're the person inviting me to Ginza?" },
      { speaker: 'left', speakerLabel: '{HOST_NAME}', pose: 'normal', text: "I curate and manage the Ginza collection. It's a side of my work I prefer to keep separate until someone is ready." },
      { speaker: 'left', speakerLabel: '{HOST_NAME}', pose: 'normal', text: "Complete tuner builds, competition cars, and cars with histories that don't appear in normal listings. This collection isn't open to the public." },
      { speaker: 'left', speakerLabel: '{HOST_NAME}', pose: 'serious', text: "You've been invited to see it — and if you can afford one, you can buy it. But collector cars stay complete.", emphasis: true },
    ],
    finalActionLabel: 'UNLOCK GINZA',
  },

  // Only reveal Sayaka's professional past after the Ginza encounter and a
  // legitimate seven-member street crew. The pro venue controls that gate.
  proCircuitStrategistReveal: {
    id: 'proCircuitStrategistReveal',
    category: 'PRO CIRCUIT / STORY',
    testerLabel: 'Pro Circuit — Sayaka Joins as Strategist',
    title: 'PRO CIRCUIT // THE STRATEGIST',
    once: true,
    characters: { left: 'sayakaFujieda', right: '$PLAYER' },
    pages: [
      { speaker: 'left', speakerLabel: 'SAYAKA FUJIEDA', pose: 'track', text: "Seven drivers. You've assembled a real team. Your father would recognise what that takes." },
      { speaker: 'right', pose: 'idle', text: "Sayaka? I thought you were managing the Ginza collection." },
      { speaker: 'left', speakerLabel: 'SAYAKA FUJIEDA', pose: 'track', text: "I am. But back when your father raced, I was a racing-team strategist. I helped plan his team's runs." },
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
  'openingDaichiStory',
  'openingDaichiAfterSayaka',
  'openingRaceRules',
  'openingWorkshopGuide',
  'tunerTeamCallout',
  'regionalCrewIntroduction',
  'crewRecruitmentInvite',
  'tunerShopDiscovery',
  'regionalChampionVictory',
  'regionalPerfectVictory',
  'specialChallengerIntroduction',
  'specialChallengerWin',
  'specialChallengerLoss',
  'firstPinkSlipChallenge',
  'firstPinkSlipWin',
  'firstPinkSlipLoss',
  'canalYardUnlocked',
  'warehouseHqUnlocked',
  'centralTokyoUnlocked',
  'ginzaInvitation',
  'ginzaHeroCarReveal',
  'proCircuitStrategistReveal',
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
