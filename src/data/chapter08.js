// Chapter 08: seven regional crew victories -> Warehouse HQ -> Ginza -> professional team.
// These scenes are authored as one connected chapter; save-state orchestration
// lives in Chapter08Story.js. No scene itself awards racing prizes.
const manga = (id, title, pages, finalActionLabel = 'NEXT') => ({
  id, category: 'CAREER / CHAPTER 08',
  title, once: true, characters: { left: 'daichiSakamoto', right: '$PLAYER' },
  pages, finalActionLabel,
});
const daichi = (text, pose = 'idle') => ({ speaker: 'left', leftPose: pose, text });
const player = (text, pose = 'idle') => ({ speaker: 'right', pose, text });
const sayaka = (text, pose = 'ginzaNormal', extra = {}) => ({
  speaker: 'left', leftCharacter: 'sayakaFujieda', leftPose: pose, text, ...extra,
});
const kaede = (text, pose = 'ginzaIdle', extra = {}) => ({
  speaker: 'left', leftCharacter: 'kaedeTachibana', leftPose: pose, text, ...extra,
});
const emi = (text, pose = 'ginzaIdle', extra = {}) => ({
  speaker: 'left', leftCharacter: 'emiSaionji', leftPose: pose, text, ...extra,
});

export const CHAPTER08_SCENES = Object.freeze({
  chapter08Warehouse: manga('chapter08Warehouse',
    'CHAPTER 08 // THE NEXT LEVEL', [
      daichi('Seven regions. Seven crews. We actually did it!', 'win'),
      player('Every last one of them!', 'win'),
      daichi("Remember when we were struggling to put together your first car? Now look at us!", 'win'),
      player("Tokyo's ours!", 'win'),
      daichi("Hah! Don't let that go to your head. But yeah... this is pretty incredible.", 'idle'),
      player('Huh? Unknown number?'),
    ], 'ANSWER THE PHONE'),

  chapter08ManagerCall: {
    id: 'chapter08ManagerCall', category: 'CAREER / CHAPTER 08',
    title: 'TOKYO DRAG COMPLEX // INCOMING CALL', once: true,
    // Chapter 04's actual vibrating-phone and green PICK UP choreography.
    presentation: 'phone', presentationMode: 'openingSwipe',
    callerId: 'masatoKuroda', callerPose: 'normal',
    callerName: 'MASATO KURODA // TOKYO DRAG COMPLEX',
    label: 'INCOMING CALL',
    pages: [
      { speaker: 'caller', text: "Hello. Am I speaking to the captain of the crew that's just swept all seven regions?" },
      { speaker: 'player', text: 'Uh... yes?' },
      { speaker: 'caller', text: "Congratulations. I'm Masato Kuroda, manager of the Tokyo Drag Complex. We've been following your progress." },
      { speaker: 'player', text: 'Tokyo Drag Complex?' },
      { speaker: 'caller', text: "Our professional circuit runs full seasons: individual driver events, crew competitions and special races against some of the country's best." },
      { speaker: 'caller', text: 'You can enter as an individual, or bring your entire team.' },
      { speaker: 'player', text: 'Wait... are you inviting us?' },
      { speaker: 'caller', text: "You've earned your invitation. But street racing and professional motorsport are very different worlds." },
      { speaker: 'caller', text: "One piece of advice: find yourself a good team manager. You'll need someone who can see the bigger picture." },
      { speaker: 'caller', text: "Congratulations again. We'll look forward to seeing you at the strip." },
    ],
  },

  chapter08WarehouseReaction: manga('chapter08WarehouseReaction',
    'WAREHOUSE HQ // BIG LEAGUES', [
      player('DAICHI! WE GOT INVITED TO THE PRO CIRCUIT!', 'win'),
      daichi('WHAT?! Professional races, proper teams, serious competition... this is huge!', 'win'),
      player("We're really doing this!", 'win'),
      daichi('...Hang on. Did he say professional teams?'),
      player('...Yeah.'),
      daichi('With team managers?'),
      player('...Yeah.'),
      daichi("I can build an engine. I've never run a professional racing team."),
      player("And I'm beginning to think winning on the street isn't quite the same thing."),
      daichi('...'),
      player('...'),
      daichi("We're in trouble, aren't we?"),
      player('Oh, come on. Another call?'),
    ], 'PICK UP'),

  chapter08SayakaCall: {
    id: 'chapter08SayakaCall', category: 'CAREER / CHAPTER 08',
    title: 'SAYAKA // INCOMING CALL', once: true,
    // Same ringing and tap-to-answer action, including in dev and Story Archive replay.
    presentation: 'phone', presentationMode: 'openingSwipe',
    callerId: 'sayakaFujieda', callerPose: 'homeHappy',
    callerName: 'SAYAKA FUJIEDA', label: 'INCOMING CALL',
    pages: [
      { speaker: 'caller', text: "Well, well. I hear someone's starting a professional racing team." },
      { speaker: 'player', text: 'Sayaka?! How did you hear about that already?' },
      { speaker: 'caller', text: 'Oh, I hear things.' },
      { speaker: 'caller', text: "Honestly. You and Daichi, charging into professional motorsport without a plan." },
      { speaker: 'caller', text: "I know somebody else who used to charge into races thinking things would simply work out." },
      { speaker: 'caller', text: "You'd think after all these years I'd be used to it." },
      { speaker: 'player', text: 'Wait, who do you mean—' },
      { speaker: 'caller', text: "Never mind that. There's something important I've been meaning to tell you." },
      { speaker: 'caller', text: "Come to Ginza Motor Gallery. I'll explain everything there. Bring your car." },
      { speaker: 'player', text: 'Ginza? Why Ginza?' },
      { speaker: 'caller', text: 'Just come. See you soon!' },
    ],
  },

  chapter08WarehouseFarewell: manga('chapter08WarehouseFarewell',
    'WAREHOUSE HQ // A MYSTERIOUS CALL', [
      player('Well, that was mysterious.'),
      daichi('Does your family friend always do that?'),
      player('Pretty much.'),
    ], 'OPEN THE MAP'),

  chapter08Ginza: {
    id: 'chapter08Ginza', category: 'CAREER / CHAPTER 08',
    title: 'GINZA MOTOR GALLERY // THE REVEAL',
    once: true, characters: { left: 'kaedeTachibana', right: '$PLAYER' },
    pages: [
      kaede('You were the driver from that Porsche race, weren\'t you? What are you doing here?'),
      player("I came to find out who was driving it. I was told to come here."),
      kaede("This is a private collection. You can't just walk in demanding answers."),
      player("Sayaka asked me to come. She said she'd explain everything."),
      kaede('S-Sayaka?! You mean Ms Fujieda?', 'ginzaSad'),
      sayaka("It's alright, Kaede. I invited them.", 'ginzaNormal',
        { cinematicBeat: 'chapter08SayakaExit' }),
      kaede('Oh! Of course, Ms Fujieda! My apologies!', 'ginzaSad'),
      sayaka('Surprised to see me?', 'ginzaHappy'),
      player('SAYAKA?! What are you doing here?'),
      sayaka('Well, I do happen to manage this place.'),
      player('YOU WHAT?!'),
      sayaka('What? Did you think I spent all my time at the driving school?', 'ginzaHappy'),
      sayaka('Anyway, nice driving out there.', 'ginzaHappy'),
      player('...Wait. That Porsche...'),
      sayaka('Oh, that old thing?', 'ginzaHappy'),
      player('THAT WAS YOU?!'),
      sayaka('Guilty. And miss the look on your face? Absolutely not.', 'ginzaHappy'),
      sayaka('Alright, enough teasing. I really did ask you here for a reason.'),
      sayaka("Seven regional crews. That's quite an achievement.", 'ginzaHappy'),
      player("Thanks. Although after that Porsche, I'm wondering how ready I really am."),
      sayaka("You've earned your place. But professional racing isn't just about being fast.", 'ginzaSerious'),
      sayaka("It's strategy. Preparation. Knowing when to push, and when to hold back.", 'ginzaSerious'),
      sayaka('And if you let it, racing can consume your whole life. It can also be incredibly rewarding.', 'ginzaSerious'),
      player("That's what worries me. I don't even know where to start."),
      sayaka('You know... I have helped drivers plan races for years. Some of them were rather stubborn engineers.', 'ginzaNormal'),
      player('Seriously?'),
      sayaka("I've spent more nights around Tokyo's meets than I'd care to count.", 'ginzaSerious'),
      player("So that's how you know so much about racing?"),
      sayaka("Some of the best lessons weren't about cars at all. Preparation, teamwork... and knowing when to walk away.", 'ginzaSad'),
      player('I had no idea.'),
      sayaka("But today isn't about our old stories.", 'ginzaNormal'),
      sayaka("It's about yours. I've watched you build something special from that first car.", 'ginzaHappy'),
      sayaka("And I've had a pretty good view of your driving along the way...", 'ginzaHappy'),
      { speaker: 'system', text: '', cinematicBeat: 'chapter08SayakaGallery', galleryOnly: true },
      sayaka("You've got the instinct, the determination, and a crew that believes in you.", 'ginzaNormal'),
      sayaka("So... if you'll have me, I'd like to help as your team manager and strategist.", 'ginzaSerious'),
      player('Wait... really? You have time for this alongside Ginza and the driving school?'),
      sayaka("For your team? We can make a plan. And Daichi can keep me honest.", 'ginzaNormal'),
      sayaka("But watching you and Daichi build this from nothing... some things are worth coming back for.", 'ginzaHappy'),
      player("Then... welcome to the team, Sayaka!", 'win'),
      sayaka("Heh. I was always on your side.", 'ginzaHappy'),
      sayaka("I'm glad to be on board. But before that, I need to dress the part.", 'ginzaHappy',
        { cinematicBeat: 'chapter08SayakaOutfitCue' }),
      sayaka("Now then. Let's show the professional circuit what this team can do.", 'track',
        { cinematicBeat: 'chapter08FinalPortrait', emphasis: true }),
      player("Daichi's going to lose his mind when he hears this.", 'win'),
      sayaka("I know. I'd better call him before he appoints himself team manager.", 'trackHappy'),
      sayaka("Your street racing days brought you here. Your professional career is only beginning.", 'track',
        { emphasis: true }),
    ],
    finalActionLabel: 'CHAPTER 08 COMPLETE',
  },
});
