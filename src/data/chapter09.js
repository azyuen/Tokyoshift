// Chapter 09 — Welcome to the Big Leagues. Four connected, playable manga
// scenes at the already-unlocked Drag Complex, followed by a distinct season
// registration vignette. All dialogue uses the canonical character bible.
const manga=(id,title,pages,finalActionLabel='NEXT')=>({
  id,category:'CAREER / CHAPTER 09',title,once:true,
  characters:{left:'daichiSakamoto',right:'$PLAYER'},
  pages,finalActionLabel,
});
const daichi=(text,pose='idle')=>({speaker:'left',leftCharacter:'daichiSakamoto',leftPose:pose,text});
const player=(text,pose='idle')=>({speaker:'right',pose,text});
const sayaka=(text,pose='track')=>({speaker:'left',leftCharacter:'sayakaFujieda',leftPose:pose,text});
const ryuji=(text,pose='normal')=>({speaker:'left',leftCharacter:'ryujiTakahashi',leftPose:pose,text});
const masato=(text,pose='normal')=>({speaker:'left',leftCharacter:'masatoKuroda',leftPose:pose,text});
const hiroshi=(text,pose='normal')=>({speaker:'left',leftCharacter:'hiroshiSato',leftPose:pose,text});
const mika=(text,pose='idle')=>({speaker:'left',leftCharacter:'mikaHayaseChampion',leftPose:pose,speakerLabel:'MIKA HAYASE',text});

export const CHAPTER09_SEQUENCE=Object.freeze([
  'chapter09OldGuard','chapter09Rules','chapter09Visitor','chapter09Welcome',
]);
export const CHAPTER09_SCENES=Object.freeze({
  chapter09OldGuard:manga('chapter09OldGuard',
    'CHAPTER 09 // THE OLD GUARD',[
      daichi('That is FOUR lanes. Grandstands! Professional timing! Look at this place!', 'win'),
      player('Pretty different from the streets.'),
      masato("Welcome to the Tokyo Drag Complex. I'm Masato Kuroda. We spoke on the phone."),
      player("You're the one who invited us after the seven crew battles."),
      masato("That's right. Your team's earned a place here. I'm responsible for running the complex; Hiroshi handles the race briefing."),
      daichi('Even the invitations have managers. I feel underdressed.'),
      sayaka('Speaking of old faces...'),
      sayaka("Ryuji! You're still alive!", 'trackHappy'),
      ryuji("Sayaka Fujieda! Still as charming as ever.",'happy'),
      sayaka("And you still haven't learned to retire.",'trackHappy'),
      ryuji("Someone has to stop these youngsters from blowing up my timing equipment.",'happy'),
      daichi('Wait. You two know each other?'),
      ryuji("Know her? Ha! You've got no idea who you've brought here.",'happy'),
      sayaka('Careful, Ryuji. We still remember some of your old starts.'),
      ryuji("...Masato, wasn't there supposed to be a briefing?",'serious'),
    ],'MEET THE OFFICIALS'),

  chapter09Rules:manga('chapter09Rules',
    'CHAPTER 09 // THE RULES (NOBODY IS LISTENING)',[
      hiroshi('I am Hiroshi Sato, chief starter. Before you register, you WILL understand the regulations.','focus'),
      daichi('Race fast. Win money. Easy.', 'win'),
      hiroshi('That is an extraordinarily inadequate summary.','focus'),
      ryuji("He's not completely wrong.",'happy'),
      hiroshi('Mr Takahashi. Please.','focus'),
      hiroshi('First: OPEN CIRCUIT. Independent driver races, crew events, and one rotating minor trophy. Each is a paid one-off.'),
      hiroshi('They earn cash and trophies, but ZERO professional season points. Practise and upgrade between entries.'),
      daichi("So we can race here without signing away the next eight weekends?"),
      hiroshi('Correct. The minor trophy rotates after an attempt; two other completed independent events clear its cooldown.'),
      hiroshi('Second: PRO SEASON. Eight rounds, three event choices per round, and you enter exactly ONE.'),
      hiroshi('Earn 60 Driver points and 40 Crew points to qualify for the Tokyo Championship. Plan carefully; you cannot enter everything.'),
      hiroshi('You may visit garages, tune and race on the streets between rounds. Independent Drag Strip events are suspended once registered.'),
      hiroshi('Withdrawal forfeits this season and its points. It does NOT take your cars, crew, cash or previously earned trophies.'),
      daichi("Great! Let's sign up RIGHT NOW.",'win'),
      sayaka("We're not signing anything today.",'track'),
      daichi("But we've beaten every crew in Tokyo!"),
      sayaka("On the streets. This isn't the streets.",'track'),
      ryuji("Listen to her. First sensible thing she's ever said in this building.",'happy'),
      sayaka("Ryuji.",'track'),
      hiroshi('Can I finish one briefing without being interrupted?','focus'),
    ],'UNDERSTOOD... MOSTLY'),

  chapter09Visitor:manga('chapter09Visitor',
    'CHAPTER 09 // AN UNEXPECTED VISITOR',[
      daichi('Hang on. Is that... Mika HAYASE?! The champion from the magazine?!', 'win'),
      mika("I hear you've been making quite a name for yourselves."),
      daichi('SHE KNOWS WHO WE ARE!', 'win'),
      mika("Seven regions is no small feat. But winning on the streets is one thing. Winning here? Another entirely."),
      player("Guess we'll have to find out."),
      mika("Good answer. Although with *her* in your corner, you might actually stand a chance."),
      daichi('There it is again. Why does EVERYONE here know Sayaka?!'),
      sayaka("I used to get out more.",'trackHappy'),
      mika("I'll see you on the timing board. Show me what you can really do.",'win'),
      daichi('Okay. NOW we have to sign up!'),
    ],'WATCH HER LEAVE'),

  chapter09Welcome:manga('chapter09Welcome',
    'CHAPTER 09 // WELCOME TO THE BIG LEAGUES',[
      masato("The briefing is complete. Your invitation is accepted, and the Open Circuit is yours to explore.",'happy'),
      hiroshi('Read the event restrictions and check your car before you pay an entry fee.','focus'),
      ryuji("No shame in finding out you're not ready. Shame is finding out halfway through a championship.",'serious'),
      daichi('You really know how to motivate people.'),
      sayaka("He's right. We've come a long way. But let's make sure we're ready before we commit.",'track'),
      player('Independent events first. Then we take on the championship.'),
      sayaka("Good. We'll prepare properly. And then... we'll show them what this crew can do.",'trackHappy'),
      daichi("Right! Who's ready to hear these engines?!",'win'),
    ],'CHAPTER 09 COMPLETE'),
  chapter09SeasonRegistration:{
    id:'chapter09SeasonRegistration',category:'CAREER / CHAPTER 09',
    title:'PRO CIRCUIT // THE SIGNING',once:false,
    characters:{left:'masatoKuroda',right:'$PLAYER'},pages:[
      {speaker:'left',leftCharacter:'masatoKuroda',leftPose:'normal',
        text:'Eight rounds. One event per round. Your registration is now official.'},
      {speaker:'left',leftCharacter:'hiroshiSato',leftPose:'focus',
        text:'Entry recorded. There are no second choices for a completed round.'},
      {speaker:'left',leftCharacter:'ryujiTakahashi',leftPose:'happy',
        text:"Well, there's no backing out without forfeiting the season now."},
      {speaker:'left',leftCharacter:'daichiSakamoto',leftPose:'win',
        text:"Okay, that sounded a lot more dramatic out loud."},
      {speaker:'left',leftCharacter:'sayakaFujieda',leftPose:'trackHappy',
        text:"Alright, you two. We've had our fun. Now let's get serious.",emphasis:true},
    ],finalActionLabel:'START THE SEASON',
  },
});
