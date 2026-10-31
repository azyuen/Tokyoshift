import {polishArukenPresentation} from '../story/ArukenPresentation.js?v=20261026-audit';
// R674 — THE ROAD AHEAD. Aruken's Story has a complete positive ending.
// Direct continuation of Chapter 09: debts are handled, not magicked away.
// A modest joint gallery, a later Career time jump, and the existing one-Porsche ending.
const A='arkonDen',S='sayakaFujieda';
const ark=(text,pose='storyTalking')=>['left',text,pose];
const say=(text,pose='homeNormal')=>['right',text,pose];
const manga=(title,lines,formal=false)=>({
  type:'MANGA',title,characters:{left:A,right:S},
  pages:lines.map(([speaker,text,pose])=>({
    speaker,text,
    leftPose:speaker==='left'?(formal
      ? (String(pose||'').startsWith('dev')?pose:'ginzaSuit')
      : pose||'storyTalking'):
      formal?'ginzaSuit':'storyIdle',
    rightPose:speaker==='right'?(pose||(formal?'ginzaDress':'homeNormal')):
      formal?'ginzaDress':'homeNormal',
  })),
});
const staged=(label,backgroundId,cast,cars=[],options={})=>[
  {type:'CLEAR_STAGE'},
  {type:'STAGE',backgroundId,stageMode:'native',composition:'car-behind-cast',
    fadeInMs:850,privateMeet:backgroundId.startsWith('meet:'),
    characters:cast,cars,...options},
  {type:'HOLD_SCENE',label,caption:'ARUKEN DENZAKI // THE ROAD AHEAD',revealMs:550},
];
const casual=[{id:A,pose:'storyIdle',role:'player'},
  {id:S,pose:'homeNormal',role:'companion'}];
const gala=[{id:A,pose:'ginzaSuit',role:'player'},
  {id:S,pose:'ginzaDress',role:'companion'}];
const shop=(label,car='arkonLibertyWalk240z')=>
  staged(label,'workshop:shinonomeWarehouseStrip:night',casual,[{carId:car}]);
const restore=index=>({type:'ARKON_CH10_RESTORE',index});
export const ARKON_CHAPTER_10={
  id:'arkonChapter10',
  title:'ARUKEN DENZAKI // CHAPTER 10: THE ROAD AHEAD',
  steps:[
    {type:'SET_FLAG',key:'arkonStoryChapter',value:10},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter10Recovery',timeOfDay:'day'},
    ...shop('WAREHOUSE HQ // A FAMILIAR SOUND'),
    manga('THE QUIET WORKSHOP',[
      say('Well. That is something I have not seen for a while.','homeHappy'),
      ark('What?','storyIdle'),
      say('You ignoring your phone.','homeHappy'),
      ark('They can leave a message. This car is not going to fix itself.','storyMechanic'),
      say('How are you, Aruken? Really?','homeNormal'),
      ark('The advisers got some claims withdrawn. Others still have to be paid.','storySerious'),
      ark('Warehouse HQ is safe for now. But I cannot pretend the remaining bill has disappeared.','storyThinking'),
      say('And how does that feel?'),
      ark('Surprisingly good. I finished work before dinner yesterday.','storySheepish'),
      say('Who are you, and what have you done with Aruken Denzaki?','homeHappy'),
      ark('Apparently there is a world outside this workshop.','storyLaughing'),
      say('I have been trying to tell you.','homeHappy'),
    ]),
    {type:'ARKON_CH10_SETTLEMENT'},
    manga('THE WORK IS STILL HERE',[
      ark('I missed just fixing things. No grand promises, no mysterious clients.','storyMechanic'),
      say('You do sound terribly boring.','homeHappy'),
      ark('It is wonderful.','storyConfidentSmirk'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter10Restorations'},
    ...shop('WAREHOUSE HQ // THE FORGOTTEN CLASSIC','ae86'),
    manga('SOMETHING WORTH SAVING',[
      ark('A family-owned AE86. The owner just wants it driving beautifully again.','storyMechanic'),
      say('No chasing another hundred kilowatts?','homeHappy'),
      ark('Not unless the owner asks. And even then I might say no.','storySheepish'),
      say('Now I really am worried about you.','homeHappy'),
    ]),
    restore(0),
    manga('THE FIRST HONEST INVOICE',[
      ark('A documented rebuild, a pleased owner and a paid invoice. I remember those.','storyConfident'),
      say('No photographers? No enormous contract?','homeHappy'),
      ark('Just a well-running car.','storyIdle'),
      say('Sounds like a good day to me.','homeHappy'),
    ]),
    ...shop('WAREHOUSE HQ // AN OLD CONNECTION','gc8'),
    manga('NOT EVERYTHING ALONE',[
      ark('Tetsuo called about this GC8. The engine is his speciality.','storyThinking'),
      say('You are working together?','homeHappy'),
      ark('He knows the platform better. I can handle the rest.','storyMechanic'),
      say('Aruken Denzaki admitting somebody knows more than he does?','homeHappy'),
      ark('Do not spread it around.','storySheepish'),
    ]),
    restore(1),
    manga('PROPERLY TESTED',[
      ark('Tetsuo has the last measurements. We will both sign our own work, nothing more.','storySerious'),
      say('That sounds rather like the old you.','homeNormal'),
      ark('The one with terrible coffee?','storyConfidentSmirk'),
      say('Unfortunately, yes.','homeHappy'),
      ark('One friendly run to celebrate? The Z could use an outing.','storyConfident'),
      say('No wagers. And no mysterious men in suits.','homeSerious'),
      ark('Deal.','storyLaughing'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter10TestDrive',timeOfDay:'night'},
    ...staged('DAIKOKU // JUST FOR FUN','meet:daikokuPA:night',[
      {id:A,pose:'storyConfident',role:'player'},
      {id:S,pose:'homeHappy',role:'companion'},
      {id:'tetsuoMori',pose:'idle',role:'challenger'},
    ],[{carId:'arkonLibertyWalk240z'},{carId:'gc8'}]),
    manga('A DIFFERENT KIND OF RACE',[
      say('Try not to turn this into another engineering demonstration.','homeHappy'),
      ark('You wound me.','storySheepish'),
      say('Race well. Then we are getting dinner.','homeHappy'),
      ark('Now that is a prize worth chasing.','storyConfidentSmirk'),
    ]),
    {type:'CLEAR_STAGE'},
    {type:'ARKON_CH10_RACE'},
    {type:'WAIT_SCENE',scene:'MeetScene'},
    {type:'ARKON_CH10_RETURN'},
    manga('MORE IMPORTANT THINGS',[
      ark('I could do another run.','storyConfidentSmirk'),
      say('And I could confiscate your keys.','homeHappy'),
      ark('Dinner it is.','storyLaughing'),
    ]),
    {type:'LOCATION',scene:'GarageScene',
      data:{crewMode:false,workshopLocationId:'shinonomeWarehouseStrip'}},
    ...shop('WAREHOUSE HQ // AN OLD FRIEND','arkonLibertyWalk240z'),
    manga('THE COST OF KEEPING IT',[
      ark('The lawyers have a way to release the workshop from the last guarantees.','storySerious'),
      say('That sounds like good news. Why do you look so miserable?','homeNormal'),
      ark('The money has to come from somewhere. I have agreed to sell the Z.','storyThinking'),
      say('Your Z? After everything you put into it?','homeSerious'),
      ark('I chose the contract. It should not be somebody else who pays for it.','storySerious'),
      say('Are you certain? We could look for another way.','homeNormal'),
      ark('I have. This is the one that lets us start clean.','storySerious'),
      say('Then I will not talk you out of your decision. But you can be sad about it.','homeNormal'),
    ]),
    manga('ONE LAST LOOK',[
      ark('This car got me through the worst years. I thought I would keep it forever.','storyThinking'),
      say('I remember when it was barely holding together.','homeNormal'),
      ark('Then I built it into something everyone would notice. Perhaps I needed that a little too much.','storySheepish'),
      say('It was still wonderful work. You should be proud of that.','homeHappy'),
      ark('I am. I will miss it.','storyCoolShy'),
      say('I know.','homeNormal'),
      ark('Alright. The buyer can take the keys.','storySerious'),
    ]),
    {type:'ARKON_CH10_SELL_Z'},
    ...shop('WAREHOUSE HQ // A SMALLER, QUIETER GARAGE','ae86'),
    ...shop('WAREHOUSE HQ // ONE LAST COMMISSION','r32'),
    manga('SOMETHING SPECIAL',[
      say('This collector knows the history of every bolt on this R32.','homeNormal'),
      ark('Then we should preserve what makes it special.','storyThinking'),
      say('That is almost philosophical, Aruken.','homeHappy'),
      ark('Do not worry. I am still charging for labour.','storyConfidentSmirk'),
    ]),
    restore(2),
    manga('A HOME FOR THE CARS',[
      say('It seems a shame to send beautiful machines like this away so quickly.','homeNormal'),
      ark('That is generally what happens when you sell one.','storySheepish'),
      say('What if we chose the cars, documented them, restored them and found them the right owners?','homeNormal'),
      ark('A dealership?'),
      say('A gallery. Some of these are pieces of history, not just merchandise.','homeHappy'),
      ark('Where would you put it?','storyThinking'),
      say('I have found a little place in Ginza.','homeHappy'),
      ark('Ginza?! Have you seen the rents?','storySurprised'),
      say('Have you seen what you used to spend on the Z?','homeHappy'),
      ark('That was different.','storySheepish'),
      say('Naturally.','homeHappy'),
      ark('Alright. Show me. But no strange investors and no spending money we have not earned.','storySerious'),
      say('Agreed.','homeHappy'),
    ]),
    // The empty-room business decision is the end of the early timeline.
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter10Ginza',timeOfDay:'day'},
    ...staged('GINZA // AN EMPTY ROOM','central:ginzaMotorGallery:day',casual),
    manga('A RARE MOMENT OF DOUBT',[
      say('A small gallery. Exceptional cars, consignments and restorations. You handle the engineering, I handle the clients.','homeExplaining'),
      ark('You have worked all this out already, have you?','storyConfidentSmirk'),
      say('Most of it. I still need a business partner.','homeConfident'),
      ark('This was your idea, Sayaka. Half each?','storySerious'),
      say('Fifty-fifty.','homeHappy'),
      ark('Then let us do it properly.','storyConfident'),
    ]),
    {type:'ARKON_CH10_GINZA'},
    // A short seed for the later Career, not a second Ginza opening.
    manga('A LITTLE OPPORTUNITY',[
      say('There is a young mechanic, Daichi, looking for affordable workshop space. And a child of old family friends coming to Tokyo to try racing.','homeExplaining'),
      ark('We could arrange the lease, and restore an AE86 or Civic EF. Let the driver choose.','storyThinking'),
      say('A fair start. Not a guaranteed victory.','homeConfident'),
      ark('No strings. They can make their own names.','storySerious'),
    ]),
    {type:'ARKON_CH10_INVEST'},
    {type:'CLEAR_STAGE'},
    // No second chapter: the player has ALREADY lived these years in Career.
    {type:'ARKON_CH10_TIME_JUMP',title:'A FEW YEARS LATER',durationMs:5500},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter10FinalDrive',timeOfDay:'night'},
    ...staged('GINZA // AFTER THE CHAMPIONSHIP','central:ginzaMotorGallery:night',casual,
      [{carId:'rwbStellaPorsche'}]),
    manga('AN EVENING TOGETHER',[
      say('I spoke to Daichi after the celebrations. I would like to stay with the team next season, from the beginning. I had forgotten how much I missed it.','homeConfident'),
      ark('I had a feeling. You looked completely at home today.','storyCoolShy'),
      say('And you? Back to the gallery tomorrow?','homeNormal'),
      ark('Not tomorrow. I booked us dinner in Yokohama, at that little restaurant you showed me years ago. And tomorrow is ours.','storyConfident'),
      say('You remembered?','homeContemplative'),
      ark('Of course. There is plenty of time for the waterfront first.','storyConfidentSmirk'),
      say('You really did think of everything.','homeHappy'),
    ]),
    // Existing real no-input Porsche cinematic: Sayaka drives, Aruken rides.
    {type:'ARKON_CH10_DRIVE'},
    {type:'WAIT_SCENE',scene:'MeetScene'},
    {type:'ARKON_CH10_DRIVE_RETURN'},
    {type:'ARKON_CH10_YOKOHAMA'},
    {type:'LOCATION',scene:'MeetScene'},
    ...staged('YOKOHAMA // BACK WHERE WE BEGAN','meet:yokohamaMinatoMirai:night',
      [{id:A,pose:'storyCoolShy',role:'yokohamaArkon',flipX:false},
       {id:S,pose:'homeNormal',role:'yokohamaSayaka',flipX:true}],
      [{carId:'rwbStellaPorsche'}],
      {meetCarLayout:'yokohamaFinale',meetCastLayout:'yokohamaGift'}),
    manga('THE SAME VIEW',[
      say('It has been a while since we came here. So much has happened.','homeContemplative'),
      ark('Yeah. It has.','storyCoolShy'),
      say('Are you happy, Aruken?','homeNormal'),
      ark('Yeah. I really am.','storyCoolShy'),
      ark('What about you?','storyTalking'),
      say('Very.','homeHappy'),
    ]),
    // Original one-Porsche/holding-hands Ferris wheel finale, unchanged.
    {type:'ARKON_CH10_FINALE'},
    {type:'SET_FLAG',key:'arkonStoryChapter10Done',value:true},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter10Complete'},
    {type:'CLEAR_STAGE'},
    {type:'END'},
  ],
};

polishArukenPresentation(ARKON_CHAPTER_10);
