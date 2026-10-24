// R669 — CHAPTER 07: NEVER ENOUGH.
// The same prosperous Warehouse and the player’s REAL 240Z build now carry
// Aruken’s ambition. Sayaka’s absence is not a punishment or a betrayal.
const A='arkonDen',S='sayakaFujieda';
const ark=(text,pose='storyTalking')=>['left',text,pose];
const say=(text,pose='oshiageRelaxed')=>['right',text,pose];
const manga=(title,lines,cast={left:A,right:S},arkOutfit=null)=>({
  type:'MANGA',title,characters:cast,pages:lines.map(([speaker,text,pose])=>({
    speaker,text,
    leftPose:cast.left===A?(arkOutfit||(speaker==='left'?pose||'storyTalking':'storyIdle')):'idle',
    rightPose:cast.right===S?(speaker==='right'?pose||'oshiageRelaxed':'oshiageRelaxed'):'idle',
  })),
});
const pair=(ar='storyIdle',sa='oshiageRelaxed')=>[
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
    ...hq('WAREHOUSE HQ // THE MAN IN THE SUIT','240z',pair('ginzaSuit','oshiageHappy')),
    manga('A NEW LOOK',[
      say('Well, well. Should I make an appointment?','oshiageHappy'),
      ark('Very funny. A collector is visiting this afternoon.','ginzaSuit'),
      say('What happened to the man who lived in oil-stained overalls?','oshiageRelaxed'),
      ark('He discovered that wealthy customers like a good suit.','ginzaSuit'),
      say('I suppose you do look rather handsome.','oshiageHappy'),
      ark('Was that a compliment?','storySurprised'),
      say('Do not get used to it.','oshiageHappy'),
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
      say('I have a feeling this is going to be expensive.','oshiageReviewing'),
      ark('An investment in our reputation.','storyConfident'),
      say('Our reputation? Interesting phrasing.','oshiageHappy'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter07FirstBuild',timeOfDay:'day'},
    manga('THE FIRST ROUND OF UPGRADES',[
      ark('I will take the Z to some of the regional specialists.','storyTalking'),
      say('So long as you remember it is still a car, not a monument.','oshiageHappy'),
      ark('A fast monument, perhaps.','storyConfidentSmirk'),
    ]),
    {type:'ARKON_CH7_WORK',stage:1},
    ...stage('REGIONAL MECHANICS // NEW FRIENDS','tuner:shibuyaAmuse:night','240z',
      [{id:A,pose:'storyMechanic'},{id:'itsukiKuroda',pose:'idle',role:'observer'}]),
    manga('ITSUKI // THE AMUSE WORKSHOP',[
      ['right','Remember our argument about exhaust flow? The Z needs breathing room at high rpm.','idle'],
      ark('I brought the latest logs. You were right about the restriction.','storyThinking'),
      ['right','And your revised map makes the titanium setup more useful. That is why we work together.','idle'],
      ark('I missed this. Two people finding one good answer.','storyMechanic'),
    ],{left:A,right:'itsukiKuroda'},'storyMechanic'),
    ...road('yokohamaMinatoMirai','YOKOHAMA // TIME TO PROVE IT'),
    manga('ONE MORE TEST',[
      ark('The chassis is tighter. The power delivery is cleaner.','storyConfident'),
      ark('Let’s see whether the stopwatch agrees.','storyConfidentSmirk'),
    ],{left:A}),
    {type:'CLEAR_STAGE'},
    {type:'ARKON_CH7_RACE',index:0},
    {type:'WAIT_SCENE',scene:'MeetScene'},
    {type:'ARKON_CH7_RETURN'},
    ...road('yokohamaMinatoMirai','YOKOHAMA // A GROWING REPUTATION'),
    manga('A NAME AMONG THE SPECIALISTS',[
      ark('They were asking who prepared the Z before we lined up.','storyConfident'),
      ark('Perhaps it is time I stopped being surprised.','storyConfidentSmirk'),
    ],{left:A}),
    {type:'LOCATION',scene:'GarageScene',
      data:{crewMode:false,workshopLocationId:'shinonomeWarehouseStrip'}},

    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter07MoreBusiness',timeOfDay:'day'},
    ...hq('WAREHOUSE HQ // A FAMILIAR VISITOR'),
    manga('THE LESSON VOUCHERS',[
      say('You know those free driving lesson vouchers?','oshiageRelaxed'),
      ark('Have they expired?','storySheepish'),
      say('Not when you know the instructor.','oshiageHappy'),
      ark('Perks of knowing Miss Fujieda.','storyConfidentSmirk'),
      say('You could come to Oshiage. I might even teach you something.','oshiageHappy'),
      ark('I would love to. Just let me clear the diary first.','storyTalking'),
      say('You have been saying that rather a lot lately.','oshiageReviewing'),
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
      ark('There is still power to find. And the specialists have a few ideas.','storyThinking'),
      ark('I have come this far. Why stop at almost perfect?','storyConfidentSmirk'),
    ],{left:A}),
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
      say('Everyone seems rather fond of your 240Z. And of you.','oshiageHappy'),
      ark('I suppose I do know some extraordinary people now.','storyConfidentSmirk'),
      say('You have given them good reasons to trust you.','oshiageRelaxed'),
      ark('We gave each other good reasons.','storyThinking'),
      say('Then perhaps you can spare one evening for dinner.','oshiageHappy'),
      ark('I will. I just have a few more things to finish.','storyTalking'),
      say('You keep saying that.','oshiageReviewing'),
    ]),
    ...road('daikokuPA','DAIKOKU // THE FULL BUILD'),
    manga('ALL THAT WORK',[
      ark('Every part pushed to its proper maximum. Now for the proof.','storyConfident'),
      ark('The Z has never felt this alive.','storyConfidentSmirk'),
    ],{left:A}),
    {type:'CLEAR_STAGE'},
    {type:'ARKON_CH7_RACE',index:1},
    {type:'WAIT_SCENE',scene:'MeetScene'},
    {type:'ARKON_CH7_RETURN'},
    {type:'LOCATION',scene:'GarageScene',
      data:{crewMode:false,workshopLocationId:'shinonomeWarehouseStrip'}},
    {type:'ARKON_CH7_JOB',index:2},
    ...hq('WAREHOUSE HQ // LATE AGAIN'),
    manga('OLD HABITS',[
      say('How many hours have you been here?','oshiageReviewing'),
      ark('Enough to know the new setup is magnificent.','storyConfidentSmirk'),
      say('You sound like you did when you worked in professional engineering.','oshiageSerious'),
      ark('Except this time I am the boss.','storyConfident'),
      say('That is not quite what I meant.','oshiageSerious'),
      ark('Everything is going brilliantly, Sayaka. Truly.','storyTalking'),
    ]),
    ...hq('THE MASTERPIECE // ONE LAST IDEA','240z',[{id:A,pose:'storyMechanicEngine'}]),
    manga('SOMETHING IS MISSING',[
      ark('The drivetrain, brakes, engine, suspension... finished.','storyMechanic'),
      ark('But it still looks like the battered Z that came here years ago.','storyThinking'),
      ark('I know exactly what it needs.','storyConfidentSmirk'),
    ],{left:A},'storyMechanic'),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter07Bodywork',timeOfDay:'night'},
    {type:'ARKON_CH7_CONVERT'},
    ...hq('WAREHOUSE HQ // THE LIBERTY WALK','arkonLibertyWalk240z',[{id:A,pose:'storyConfident'}]),
    manga('THE NEW FACE OF ARUKEN DENZAKI',[
      ark('There. Not a panel left untouched.','storySurprised'),
      ark('The Liberty Walk 240Z. Something even the collectors will remember.','storyConfident'),
    ],{left:A}),
    ...hq('SAYAKA DROPS BY','arkonLibertyWalk240z'),
    manga('AN EXTRAORDINARY MACHINE',[
      say('Aruken... what on earth have you done?','oshiageReviewing'),
      ark('What do you think?','storyConfidentSmirk'),
      say('It is extraordinary. I remember when it barely ran.','oshiageHappy'),
      ark('That is the idea.','storyConfident'),
      say('There is something I have been meaning to talk to you about.','oshiageSerious'),
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
      say('I was just wondering whether you have been taking on too much.','oshiageSerious'),
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
      say('It is alright. Another time.','oshiageRelaxed'),
      ark('Hey, stay. We could take the new Z out for a drive!','storyConfidentSmirk'),
      say('Not tonight, Aruken. I am a little tired.','oshiageSerious'),
      ark('Tomorrow, perhaps?','storySheepish'),
      say('We will see. Good night, Aruken.','oshiageRelaxed'),
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
