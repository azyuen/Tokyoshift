import {polishArukenPresentation} from '../story/ArukenPresentation.js?v=20261026-audit';
// R669 — CHAPTER 07: NEVER ENOUGH.
// The same prosperous Warehouse and the player’s REAL 240Z build now carry
// Aruken’s ambition. Sayaka’s absence is not a punishment or a betrayal.
const A='arkonDen',S='sayakaFujieda';
const ark=(text,pose='storyTalking')=>['left',text,pose];
const say=(text,pose='homeNormal')=>['right',text,pose];
const manga=(title,lines,cast={left:A,right:S},arkOutfit=null)=>({
  type:'MANGA',title,characters:cast,pages:lines.map(([speaker,text,pose])=>({
    speaker,text,
    leftPose:cast.left===A?(arkOutfit==='ginzaSuit'
      ? (speaker==='left'&&String(pose||'').startsWith('dev')?pose:'ginzaSuit')
      : arkOutfit||(speaker==='left'?pose||'storyTalking':'storyIdle')):'idle',
    rightPose:cast.right===S?(speaker==='right'?pose||'homeNormal':'homeNormal'):'idle',
  })),
});
const pair=(ar='storyIdle',sa='homeNormal')=>[
  {id:A,pose:ar},{id:S,pose:sa,role:'observer'},
];
const stage=(label,bg,car,cast=pair())=>[
  {type:'CLEAR_STAGE'},
  {type:'STAGE',backgroundId:bg,stageMode:'native',
    privateMeet:bg.startsWith('meet:'),composition:'car-behind-cast',
    characters:cast,cars:car?[{carId:car}]:[]},
  {type:'HOLD_SCENE',label,caption:'ARUKEN DENZAKI // NEVER ENOUGH'},
];
const hq=(label,car='240z',cast=pair())=>stage(label,
  'workshop:shinonomeWarehouseStrip:night',car,cast);
const road=(venue,label,car='240z')=>stage(label,'meet:'+venue+':night',car);
const specialist=(shop,id,caption,title,exchange)=>[
  ...stage(caption,'tuner:'+shop+':night','240z',
    [{id:A,pose:'storyMechanic'},{id,pose:'idle',role:'observer'}]),
  manga(title,exchange,{left:A,right:id},'storyMechanic'),
];

export const ARKON_CHAPTER_07={
  id:'arkonChapter07',
  title:'ARUKEN DENZAKI // CHAPTER 07: NEVER ENOUGH',
  steps:[
    {type:'SET_FLAG',key:'arkonStoryChapter',value:7},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter07Business',timeOfDay:'day'},
    ...hq('WAREHOUSE HQ // THE MAN IN THE SUIT','240z',pair('ginzaSuit','homeHappy')),
    manga('A NEW LOOK',[
      say('Well, well. Should I make an appointment?','homeHappy'),
      ark('Very funny. A collector is visiting this afternoon.','ginzaSuit'),
      say('What happened to the man who lived in oil-stained overalls?','homeNormal'),
      ark('He discovered that wealthy customers like a good suit.','ginzaSuit'),
      say('I suppose you do look rather handsome.','homeHappy'),
      ark('Was that a compliment?','devBlushing'),
      say('Do not get used to it.','homeHappy'),
    ],{left:A,right:S},'ginzaSuit'),
    ...hq('ANOTHER SIGNED CONTRACT','$SELECTED_CAR',[{id:A,pose:'storyMechanic'}]),
    manga('THE BUSINESS IS BOOMING',[
      ark('Three more commissions. I ought to be exhausted.','storyMechanic'),
      ark('Instead, I keep wondering what else we could build.','storyConfidentSmirk'),
    ],{left:A},'storyMechanic'),
    {type:'ARKON_CH7_JOB',index:0},
    ...hq('THE 240Z // A NEW PLAN'),
    manga('A CAR TO MATCH THE NAME',[
      ark('All these collectors recognise the workshop now.','storyThinking'),
      ark('But the Z is still the car they remember from my worst days.','storySerious'),
      ark('Time to show them what a proper build looks like.','storyConfidentSmirk'),
      say('I have a feeling this is going to be expensive.','homeSerious'),
      ark('An investment in our reputation.','storyConfident'),
      say('Our reputation? Interesting phrasing.','homeHappy'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter07FirstBuild',timeOfDay:'day'},
    manga('THE FIRST ROUND OF UPGRADES',[
      ark('I need a proper exhaust review at Amuse in Shibuya.','storyThinking'),
      say('And Mine\'s in Yokohama could check the response calibration.','homeHappy'),
      ark('Two specialists, a complete Level 2 build, then a test drive.','storyConfident'),
      say('A test drive somewhere with a nice view, perhaps?','homeHappy'),
      ark('Yokohama. Good road, good data.','storyTalking'),
      say('...And a nice view.','homeHappy'),
    ]),
    {type:'ARKON_CH7_WORK',stage:1},
    // Shibuya/Amuse and Yokohama/Mine's introductions run IN each tuner
    // shop when visited, never as an unrelated Warehouse HQ montage.
    ...stage('YOKOHAMA // AN EVENING TOGETHER','meet:yokohamaMinatoMirai:night','240z',
      pair('storyThinking','homeHappy')),
    manga('A VIEW WORTH RETURNING FOR',[
      say('I even changed out of my teaching clothes for tonight.','homeHappy'),
      ark('And I finally got the idle steady. Listen to that.','storyConfident'),
      say('You are an incurable romantic.','homeHappy'),
      ark('What? Oh. You look lovely, by the way.','storySheepish'),
      say('Thank you. I think.','homeHappy'),
      say('I was thinking more about the harbour. It looks lovely tonight.','homeHappy'),
      ark('Right. And the air temperature is perfect for a clean pull.','storyThinking'),
      say('You brought your data logger on our evening out?','homeSerious'),
      ark('Only a small one. I promised I would test the Z properly.','storySheepish'),
      say('Well, I am glad we are here together, anyway.','homeHappy'),
      ark('Me too. Listen to how smoothly it settles now.','storyConfidentSmirk'),
    ]),
    manga('A FRIENDLY CHALLENGE',[
      say('There is a meet just ahead. Want to give the new setup a proper run?','homeHappy'),
      ark('Perfect. One pass against somebody who knows this road.','storyConfident'),
      say('One pass. Then we look at the lights, not your graphs.','homeHappy'),
      ark('Deal. More or less.','storySheepish'),
    ]),
    ...road('yokohamaMinatoMirai','YOKOHAMA // THE NIGHT MEET','240z'),
    manga('MASATO // THE HARBOUR R32',[
      ['right','Masato Ishikawa. You are the mechanic everyone is talking about?','idle'],
      ark('Aruken. That is a tidy R32 you have there.','storyConfident'),
      ['right','Yokohama rewards a clean run, not just a big number. Want to test the Z?','idle'],
      ark('A friendly quarter mile. No stakes.','storyTalking'),
      ['right','You are on. Let us see what it can do.','idle'],
    ],{left:A,right:'masatoIshikawa'}),
    {type:'CLEAR_STAGE'},
    {type:'ARKON_CH7_RACE',index:0},
    {type:'WAIT_SCENE',scene:'MeetScene'},
    {type:'ARKON_CH7_RETURN'},
    ...stage('YOKOHAMA // AFTER THE RUN','meet:yokohamaMinatoMirai:night',
      '240z',pair('storyConfident','homeHappy')),
    manga('MORE THAN A TIME SLIP',[
      say('Masato seemed impressed. You have given the Z something special.','homeHappy'),
      ark('The launch still needs refining. I can see two tenths in it.','storyThinking'),
      say('You have barely put the helmet down. Can the numbers wait?','homeHappy'),
      ark('Just a note so I do not lose it. This is how the workshop stays ahead.','storyTalking'),
      say('Yokohama always feels nice at night, does it not?','homeHappy'),
      ark('It does. The air is cooler, and the cars run beautifully.','storyConfidentSmirk'),
      say('That is not quite what I meant.','homeNormal'),
      ark('Sorry. You were saying?','storySheepish'),
      say('Nothing. Come on, let us take the long way home.','homeHappy'),
    ]),
    {type:'LOCATION',scene:'GarageScene',
      data:{crewMode:false,workshopLocationId:'shinonomeWarehouseStrip'}},

    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter07MoreBusiness',timeOfDay:'day'},
    ...hq('WAREHOUSE HQ // A FAMILIAR VISITOR'),
    manga('THE LESSON VOUCHERS',[
      say('You know those free driving lesson vouchers?','homeNormal'),
      ark('Have they expired?','storySheepish'),
      say('Not when you know the instructor.','homeHappy'),
      ark('Perks of knowing Miss Fujieda.','storyConfidentSmirk'),
      say('You could come to Oshiage. I might even teach you something.','homeHappy'),
      ark('I would love to. Just let me clear the diary first.','storyTalking'),
      say('You have been saying that rather a lot lately.','homeSerious'),
    ]),
    {type:'ARKON_CH7_JOB',index:1},
    ...hq('WAREHOUSE HQ // THE EVENING PHONE CALL','240z',[{id:A,pose:'storyThinking'}]),
    {type:'PHONE',title:'SAYAKA // AFTER WORK',callerId:S,callerName:'SAYAKA FUJIEDA',
      presentationMode:'openingSwipe',pages:[
        {speaker:'caller',text:'I was thinking of grabbing dinner at the place we used to visit.'},
        {speaker:'player',text:'Tonight? I have a collector flying in tomorrow. A huge contract.'},
        {speaker:'caller',text:'Another one?'},
        {speaker:'player',text:'Just imagine what we could build next. We can make this even bigger!'},
        {speaker:'caller',text:'It is already rather big, Aruken.'},
        {speaker:'player',text:'Rain check? I promise I will make it up to you.'},
        {speaker:'caller',text:'Alright. Good luck tomorrow.'},
      ]},
    ...hq('THE Z // NEVER QUITE FINISHED'),
    manga('THE SECOND ROUND',[
      say('Did you see the restaurant I sent you after Yokohama?','homeHappy'),
      ark('I did. And Mine\'s has sent the new calibration notes.','storyThinking'),
      say('I meant the restaurant, not the ECU.','homeSerious'),
      ark('Sorry. The next round of parts should make a real difference.','storyTalking'),
      say('You do know the workshop will still be here tomorrow?','homeNormal'),
      ark('I know. But the next contract might not.','storySerious'),
      say('Then promise you will find an evening for us somewhere in that diary.','homeHappy'),
      ark('I will. Once I finish this build.','storySheepish'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter07FinalBuild',timeOfDay:'day'},
    {type:'ARKON_CH7_WORK',stage:2},
    // The player has visited all seven real tuner houses and bought one
    // eligible, paid specialist package for the SAME 240Z at each. The
    // resulting scene is a character payoff, never a tuning reward.
    ...specialist('odaibaEsprit','takumiSerizawa','ESPRIT // OLD FRIENDS','TAKUMI // LIGHTNESS WITH PURPOSE',[
      ['right','Aoi still tells everybody about the mechanic who saved her old Z.','idle'],
      ark('Her car reminded me why I keep mine. What do you think of this aero balance?','storySheepish'),
      ['right','We can save weight without ruining stability. Let us put it on the scales.','idle'],
    ]),
    ...specialist('shinagawaZeroSports','natsumiKagawa','ZERO/SPORTS // A CLEANER LAUNCH','NATSUMI // POWER TO THE GROUND',[
      ['right','You listened. The differential and tyre loads finally agree.','idle'],
      ark('Your launch measurements were the missing piece.','storyMechanic'),
      ['right','Then we both deserve credit when it leaves the line cleanly.','idle'],
    ]),
    ...specialist('tatsumiJun','tetsuNakahara','JUN // THE INSIDE STORY','TETSU // SOMETHING TO TRUST',[
      ['right','The engine internals are properly blueprinted. No shortcuts.','idle'],
      ark('You taught me to distrust a flattering number without a tolerance sheet.','storyThinking'),
      ['right','And you made the rest of the machine worthy of the engine.','idle'],
    ]),
    ...specialist('shibuyaAmuse','itsukiKuroda','AMUSE // THE FINAL FLOW','ITSUKI // THE SOUND OF AN ENGINE',[
      ['right','I knew you would be back. You never liked leaving power trapped in the exhaust.','idle'],
      ark('I like it even less when the cure causes a new problem.','storyConfidentSmirk'),
      ['right','The flow and response are balanced now. The numbers finally agree with your ears.','idle'],
    ]),
    ...specialist('yokohamaMines','reinaKuroda','MINE\'S // EVERY RESPONSE COUNTS','REINA // PRECISION',[
      ['right','Remember the R34? This time the ECU and drivetrain are speaking the same language.','idle'],
      ark('Your response calibration makes everything else feel more precise.','storyMechanic'),
      ['right','And you knew exactly what the calibration had to achieve.','idle'],
    ]),
    ...specialist('daikokuReAmemiya','naoFujita','RE AMEMIYA // THE DAIKOKU DIAGNOSIS','NAO // UNDER PRESSURE',[
      ['right','Your thermal data is remarkably consistent for a car making this much power.','idle'],
      ark('Your cooling and flow changes held up under repeated runs.','storyConfident'),
      ['right','Good. I would rather see a car finish five runs than impress people for one.','idle'],
      ark('I have a collector who would appreciate that philosophy too.','storyThinking'),
    ]),
    ...specialist('shinjukuTopSecret','daigoArakawa','TOP SECRET // THE LAST BOOST CHECK','ARAKAWA // NOTHING LEFT TO GUESS',[
      ['right','The boost control is stable. That is a serious piece of engineering, Aruken.','idle'],
      ark('And the final charge-flow setup was your idea.','storyMechanic'),
      ['right','You brought together seven very different approaches. Not many people could do that.','idle'],
      ark('I did not build it alone. That is the part I am proudest of.','storySerious'),
    ]),
    ...hq('WAREHOUSE HQ // WHAT WE BUILT'),
    manga('SOMETHING MORE THAN A CAR',[
      say('Everyone seems rather fond of your 240Z. And of you.','homeHappy'),
      ark('I suppose I do know some extraordinary people now.','storyConfidentSmirk'),
      say('You have given them good reasons to trust you.','homeNormal'),
      ark('We gave each other good reasons.','storyThinking'),
      say('Then perhaps you can spare one evening for dinner.','homeHappy'),
      ark('I will. I just have a few more things to finish.','storyTalking'),
      say('You keep saying that.','homeSerious'),
    ]),
    ...road('daikokuPA','DAIKOKU // THE FULL BUILD'),
    manga('ALL THAT WORK',[
      say('Another test run? You have hardly taken a night off.','homeNormal'),
      ark('This one matters. Seven specialists, all pulling in the same direction.','storyConfident'),
      say('And seven more calls waiting when you get back, I suppose.','homeHappy'),
      ark('People trust me with their builds now. I cannot let that slip.','storySerious'),
      say('Just remember the people who liked you before the contracts.','homeHappy'),
      ark('Of course. Now, let us see what the Z can do.','storyConfidentSmirk'),
    ]),
    {type:'CLEAR_STAGE'},
    {type:'ARKON_CH7_RACE',index:1},
    {type:'WAIT_SCENE',scene:'MeetScene'},
    {type:'ARKON_CH7_RETURN'},
    {type:'LOCATION',scene:'GarageScene',
      data:{crewMode:false,workshopLocationId:'shinonomeWarehouseStrip'}},
    {type:'ARKON_CH7_JOB',index:2},
    ...hq('WAREHOUSE HQ // LATE AGAIN'),
    manga('OLD HABITS',[
      say('How many hours have you been here?','homeSerious'),
      ark('Enough to know the new setup is magnificent.','storyConfidentSmirk'),
      say('You sound like you did when you worked in professional engineering.','homeSerious'),
      ark('Except this time I am the boss.','storyConfident'),
      say('That is not quite what I meant.','homeSerious'),
      ark('Everything is going brilliantly, Sayaka. Truly.','storyTalking'),
    ]),
    ...hq('THE MASTERPIECE // ONE LAST IDEA','240z',
      pair('storyMechanicEngine','homeNormal')),
    manga('SOMETHING IS MISSING',[
      say('You have been staring at that Z for ages. What is wrong?','homeHappy'),
      ark('The drivetrain, brakes, engine, suspension... finally finished.','storyMechanic'),
      say('That sounds like everything. Can we celebrate?','homeHappy'),
      ark('But it still looks like the battered Z that came here years ago.','storyMechanic'),
      say('That old car helped you get back on your feet. I rather like it.','homeNormal'),
      ark('And now I want it to look like everything we have built.','storyMechanic'),
      say('Aruken, are you building a car or a billboard for the workshop?','homeSerious'),
      ark('Something people will remember. Just one last idea.','storyMechanic'),
    ],{left:A,right:S},'storyMechanic'),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter07Bodywork',timeOfDay:'night'},
    {type:'ARKON_CH7_CONVERT'},
    ...hq('WAREHOUSE HQ // THE LIBERTY WALK','arkonLibertyWalk240z',[{id:A,pose:'storyConfident'}]),
    manga('THE NEW FACE OF ARUKEN DENZAKI',[
      ark('There. Not a panel left untouched.','storySurprised'),
      ark('The Liberty Walk 240Z. Something even the collectors will remember.','storyConfident'),
    ],{left:A}),
    ...hq('SAYAKA DROPS BY','arkonLibertyWalk240z'),
    manga('AN EXTRAORDINARY MACHINE',[
      say('Aruken... what on earth have you done?','homeSerious'),
      ark('What do you think?','storyConfidentSmirk'),
      say('It is extraordinary. I remember when it barely ran.','homeHappy'),
      ark('That is the idea.','storyConfident'),
      say('There is something I have been meaning to talk to you about.','homeSerious'),
      ark('Of course. What is it?','storyTalking'),
    ]),
    {type:'PHONE',title:'WAREHOUSE HQ // AN IMPORTANT CALL',
      callerId:'',callerName:'PRIVATE COLLECTOR',presentationMode:'openingSwipe',
      pages:[
        {speaker:'caller',text:'Aruken, we need your assessment of our next project.'},
        {speaker:'player',text:'Of course. Send through the documentation. I can look at it tonight.'},
        {speaker:'caller',text:'Excellent. My associate will call with the terms.'},
      ]},
    manga('ANOTHER TIME',[
      ark('Sorry! Big opportunity. What were you saying?','storySheepish'),
      say('I was just wondering whether you have been taking on too much.','homeSerious'),
      ark('It is busy, but that is a good problem to have.','storyConfidentSmirk'),
    ]),
    {type:'PHONE',title:'WAREHOUSE HQ // ANOTHER CALL',
      callerId:'',callerName:'PARTS SUPPLIER',presentationMode:'openingSwipe',
      pages:[
        {speaker:'caller',text:'We finally have the parts you requested. Can you confirm tonight?'},
        {speaker:'player',text:'Yes, reserve them. I will send the order immediately.'},
      ]},
    manga('SOME OTHER NIGHT',[
      ark('Right. You were saying?','storyTalking'),
      say('It is alright. Another time.','homeNormal'),
      ark('Hey, stay. We could take the new Z out for a drive!','storyConfidentSmirk'),
      say('Not tonight, Aruken. I am a little tired.','homeSerious'),
      ark('Tomorrow, perhaps?','storySheepish'),
      say('We will see. Good night, Aruken.','homeNormal'),
    ]),
    {type:'FADE_STORY_ACTOR',actorId:S,ms:1000},
    manga('THE PHONE DOES NOT STOP',[
      ark('Right... now where were those supplier documents?','storyThinking'),
    ],{left:A}),
    {type:'PHONE',title:'WAREHOUSE HQ // ONE MORE DEAL',
      callerId:'',callerName:'PRIVATE COLLECTOR',presentationMode:'openingSwipe',
      pages:[
        {speaker:'caller',text:'We can confirm the project if you have capacity next month.'},
        {speaker:'player',text:'Absolutely. We have the equipment and the people. Let us make it happen.'},
        {speaker:'caller',text:'Then we have a deal.'},
      ]},
    ...hq('WAREHOUSE HQ // AFTER EVERYONE HAS GONE','arkonLibertyWalk240z',[{id:A,pose:'storyThinking'}]),
    manga('THE EMPTY WORKSHOP',[
      ark('Sayaka?','storyTalking'),
      ark('...She has gone.','storyThinking'),
      ark('Well. I might as well give the Z a proper run.','storySheepish'),
    ],{left:A}),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter07SoloDrive',timeOfDay:'night'},
    {type:'CLEAR_STAGE'},
    {type:'ARKON_CH7_SOLO'},
    {type:'WAIT_SCENE',scene:'MeetScene'},
    {type:'ARKON_CH7_SOLO_RETURN'},
    {type:'SET_FLAG',key:'arkonStoryChapter07Done',value:true},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter07Complete'},
    {type:'CLEAR_STAGE'},
    {type:'END'},
  ],
};

// Play these introductions only when the player PHYSICALLY enters a shop.
// The shop portrait/backdrop remain in its proper venue; never fake a visit
// with a Warehouse montage after a milestone is completed.
export function getArkonCh7FirstTunerManga(region){
  const id=String(region||'').toUpperCase();
  if(id==='SHIBUYA')return manga('ITSUKI // AMUSE',[
    ['right','I heard you were rebuilding the old Z. Let us see those logs.','idle'],
    ark('I am taking it to Level 2. The top end still feels restricted.','storyMechanic'),
    ['right','The exhaust is holding it back. Your revised map could make a titanium setup worthwhile.','idle'],
    ark('That is why I brought it here instead of guessing.','storyMechanic'),
    ['right','Good. Let us measure it before choosing the parts.','idle'],
  ],{left:A,right:'itsukiKuroda'},'storyMechanic');
  if(id==='YOKOHAMA')return manga('REINA // MINE\'S',[
    ['right','The old 240Z? I have been wondering when you would bring it.','idle'],
    ark('The engine is stronger, but the throttle response could be cleaner.','storyMechanic'),
    ['right','We will look at the ECU map and how the power reaches the road.','idle'],
    ark('Exactly. I want it predictable, not just impressive on a dyno.','storyMechanic'),
    ['right','Then you came to the right place. Let us get started.','idle'],
  ],{left:A,right:'reinaKuroda'},'storyMechanic');
  return null;
}

polishArukenPresentation(ARKON_CHAPTER_07);
