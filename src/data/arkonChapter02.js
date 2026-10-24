// R655 — Aruken's second chapter is an independent, save-gated origin story.
// All ordinary races still use production driving physics. The dockside Forester
// is a STORY PROP using its stock modular car artwork, not a player reward.
const A='arkonDen', S='sayakaFujieda', D='storyDaigoKirishima', F='storyDockForeman';
const R='rinaTachibana'; // Established Shibuya racer: the temporary S15 belongs to a client.
const manga=(title,lines,cast={left:A,right:S})=>({
  type:'MANGA',title,characters:cast,
  pages:lines.map(([speaker,text,pose])=>({
    speaker,text,
    leftPose:cast.left===A
      ? (speaker==='left' ? pose||'storyTalking' : 'storyIdle') : 'idle',
    rightPose:cast.right===S
      ? (speaker==='right' ? pose||'oshiageNeutral' : 'oshiageNeutral') : 'idle',
  })),
});
const ark=(text,pose='storyTalking')=>['left',text,pose];
const say=(text,pose='oshiageNeutral')=>['right',text,pose];
const daigo=(text)=>['left',text,'idle'];
const foreman=(text)=>['right',text,'idle'];
const present=(label,characters,cars=[{carId:'$SELECTED_CAR'}],backgroundId='$CURRENT_MEET',
  extras={})=>[
  {type:'STAGE',backgroundId,privateMeet:true,
    stageMode:backgroundId==='$CURRENT_MEET'?'native':'story',
    composition:'conversation-balanced',characters,cars,...extras},
  {type:'HOLD_SCENE',label,caption:'ARUKEN DENZAKI // THE LONG WAY HOME'},
];
const meetCast=[
  {id:A,pose:'storyIdle'},
  {id:S,pose:'oshiageNeutral'},
  {id:D,pose:'idle',role:'observer'},
];

export const ARKON_CHAPTER_02 = {
  id:'arkonChapter02',
  title:'ARUKEN DENZAKI // CHAPTER 02: THE LONG WAY HOME',
  steps:[
    {type:'SET_FLAG',key:'arkonStoryChapter',value:2},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter02Opening',timeOfDay:'night'},
    ...present('CHAPTER 02 // UNWELCOME COMPANY',meetCast),
    manga('TWO MEN. ONE UNIMPRESSED WOMAN.',[
      ark('Did someone order a very expensive interruption?','storySheepish'),
      say('I did not.','oshiageRelaxed'),
      ark('He appears to have found us anyway.','storyLaughing'),
    ]),
    manga('ANOTHER PERFECT ENTRANCE',[
      daigo('Aruken. Still driving the 240Z? I respect your commitment to automotive history.'),
      say('Good evening, Daigo.','oshiageNeutral'),
      daigo('Sayaka, dinner? There is somewhere in Ginza I think you would like.'),
      say('I have plans.','oshiageReviewing'),
      daigo('Of course. Another night, then.'),
      say('I did not say that.','oshiageRelaxed'),
    ],{left:D,right:S}),
    manga('NOT MUCH OF A CONTEST',[
      ark('I was actually about to ask you something myself.','storyConfident'),
      say('Please do not. I came to watch people drive.','oshiageSerious'),
      ark('Right. And I should probably concentrate on doing that.','storySheepish'),
      say('That would be a welcome change.','oshiageHappy'),
    ]),
    {type:'CLEAR_STAGE'},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter02Earn',timeOfDay:'day'},
    {type:'WAIT_WIN_DELTA',key:'ch2BeforeDock',count:2,scene:'MeetScene'},

    // A private tableau at the named lot: never changes the current Meet
    // location, unlocks Daikoku, or silently reidentifies Kazuo Tanaka.
    ...present('EARLY SHIFT // THE LOADING LOT',[
      {id:F,pose:'idle',role:'chapter02DockForeman'},
      {id:A,pose:'storyMechanic',role:'chapter02DockAruken'},
    ],[{carId:'forester'}],
    'meet:daikokuOpenLot:day',{stageMode:'native'}),
    manga('SOMETHING OTHER THAN RACING',[
      ark('Four in the morning. Crates, forklifts, fish. Good thing I needed the money.','storySerious'),
      foreman('You there. The Forester has died on us and the deliveries are backing up.'),
      ark('And I am supposed to do what about it?','storySheepish'),
      foreman('You were talking about engines. Can you take a look?'),
      ark('All right. Pop the bonnet.','storyTalking'),
    ],{left:A,right:F}),
    // Show the crouched inspection at the actual loading lot and require
    // a button press before resuming the conversation about the repair.
    {type:'STAGE',backgroundId:'meet:daikokuOpenLot:day',stageMode:'native',
      privateMeet:true,composition:'conversation-balanced',
      characters:[{id:F,pose:'idle',role:'chapter02DockForeman'},
        {id:A,pose:'storyMechanicCrouch',role:'chapter02DockCrouch'}],
      cars:[{carId:'forester'}]},
    {type:'HOLD_SCENE',label:'INSPECT THE FORESTER',caption:'THE LONG WAY HOME'},
    manga('ANOTHER LIFE',[
      foreman('You found it already?'),
      ark('Corroded earth strap. Lucky it stopped here instead of on the expressway.','storyMechanic'),
      foreman('You are supposed to be shifting boxes. Where did you learn that?'),
      ark('Spent a few years working on race cars. Proper ones.','storySerious'),
      foreman('And now you are moving fish?'),
      ark('Life takes an interesting line through the corners.','storySheepish'),
      foreman('I can pay you for the repair. And I know a couple of other drivers who need help.'),
      ark('That would be appreciated. More than you know.','storySerious'),
    ],{left:A,right:F}),
    {type:'ARKON_DOCK_PAYMENT',amount:25000},
    {type:'CLEAR_STAGE'},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter02MeetRepair',timeOfDay:'night'},
    {type:'WAIT_WIN_DELTA',key:'ch2BeforeRepair',count:2,scene:'MeetScene'},

    // Shibuya's better-paying meets bring Aruken here after the dock work.
    // The S15 is a client vehicle being inspected by Rina, not a new award or a
    // change to her signature SVX. This is a private cinematic: don't alter
    // the player's actual region unlocks, inventory, race or current Meet.
    {type:'CLEAR_STAGE'},
    ...present('SHIBUYA // TROUBLE BETWEEN RUNS',[
      {id:A,pose:'storyMechanicCrouch',role:'carMechanic'},
      {id:R,pose:'idle',role:'chapter02ShibuyaRina'},
      {id:S,pose:'oshiageReviewing',role:'observer'},
    ],[{carId:'s15'}],'meet:shibuyaDogenzaka:night',{stageMode:'native'}),
    manga('A MUCH HARDER PROBLEM',[
      ['right','This S15 belongs to a client. I brought it here for a check, but the boost falls away halfway through a run.','idle'],
      ark('It holds pressure at idle? Then the fault may only show under load.','storyMechanic'),
      ['right','Three people have checked the turbo already. Nobody found anything.','idle'],
      ark('The turbo is doing its job. Look at where that reference line goes. The controller is reading the wrong side of the restriction.','storyMechanicCrouch'),
      ['right','So the control loop keeps correcting a pressure that never matches the manifold?','idle'],
      ark('Exactly. Reroute the reference correctly, verify the plumbing and check the calibration before another full-power pull.','storyMechanic'),
      ['right','I would never have thought to check the system as a whole. Thank you. What do I owe you?','idle'],
      ark('Nothing. Tell the owner to have the setup checked properly before racing it.','storySheepish'),
    ],{left:A,right:R}),
    manga('SOMEONE WAS WATCHING',[
      say('I was helping with the Shibuya meet schedule when Rina asked for help. Three workshops had already examined that car.','oshiageReviewing'),
      ark('Three good workshops, probably. They were all looking for a broken part.','storyThinking'),
      say('You were looking for why good parts did not work together.','oshiageNeutral'),
      ark('Sometimes that is the difference.','storySheepish'),
      say('That sort of diagnosis is rare outside serious professional racing.','oshiageSerious'),
      ark('You know a lot about that world for someone helping at a meet.','storyConfidentSmirk'),
    ]),
    {type:'CHOICE',key:'arkonShibuyaDisclosure',title:'HOW MUCH WILL YOU REVEAL?',
      subtitle:'She has noticed more than you intended.',choices:[
      {id:'open',label:'ADMIT YOUR PROFESSIONAL PAST',to:'shibuyaOpen',
        description:'Offer an honest fragment of your history.'},
      {id:'guarded',label:'KEEP YOUR HISTORY PRIVATE',to:'shibuyaGuarded',
        description:'Meet her curiosity with a little humour.'},
    ]},
    {type:'LABEL',name:'shibuyaOpen'},
    manga('MORE THAN A LUCKY GUESS',[
      ark('I worked on serious race cars for a few years. Proper paddock work. I learned to listen to the whole machine.','storySerious'),
      say('That explains a few things. And yet you are working for nothing at a street meet.','oshiageReviewing'),
      ark('Your turn. How do you know so much about professional racing?','storyConfidentSmirk'),
      say('I have been around the scene. You meet interesting people organising these nights.','oshiageNeutral'),
      ark('So there is more to you than meets the eye.','storyLaughing'),
      say('I was about to say the same thing.','oshiageHappy'),
    ]),
    {type:'GOTO',to:'shibuyaAfterChoice'},
    {type:'LABEL',name:'shibuyaGuarded'},
    manga('TWO VERY OBSERVANT PEOPLE',[
      ark('You are pretty observant. Perhaps you are onto something.','storyConfidentSmirk'),
      say('Perhaps.','oshiageHappy'),
      ark('Then how do you know so much about professional racing?','storyTalking'),
      say('I am pretty observant too. Perhaps you are onto something.','oshiageHappy'),
      ark('You are enjoying this, are you not?','storyLaughing'),
      say('A little.','oshiageHappy'),
    ]),
    {type:'LABEL',name:'shibuyaAfterChoice'},
    manga('WHAT GOOD WORK IS WORTH',[
      say('Aoi and Haru needed a kindness. That was lovely. But clients with expensive cars can afford your time.','oshiageNeutral'),
      ark('It did not take long.','storySheepish'),
      say('They are paying for you to know where to look, not for the minutes you spend looking.','oshiageReviewing'),
      ark('And you are planning to invoice me for this advice?','storyConfidentSmirk'),
      say('At least buy me a decent coffee one day. Somewhere quiet, with chairs that do not smell of petrol.','oshiageHappy'),
    ]),
    // Legacy Chapter 01 completions already attended the school. Do not
    // repeat the reveal, give duplicate credits, or reset lesson completion.
    {type:'IF',key:'arkonStorySchoolRevealed',equals:true,then:'shibuyaSchoolKnown',else:'shibuyaSchoolNew'},
    {type:'LABEL',name:'shibuyaSchoolNew'},
    manga('SOMEONE AT OSHIAGE',[
      say('I know somebody at the Oshiage Driving School. You could use a little help with those launches.','oshiageNeutral'),
      ark('Is this person very strict?','storySheepish'),
      say('Unbearably. But I can arrange a complimentary lesson.','oshiageHappy'),
      ark('Then I would be a fool to turn it down.','storyConfidentSmirk'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryLessonCredits',value:1},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter02GoSchool',timeOfDay:'day'},
    {type:'CLEAR_STAGE'},
    {type:'WAIT_SCENE',scene:'OshiageScene'},
    {type:'WAIT_FLAG',key:'arkonStoryAtSchool',equals:true},
    manga('A VERY FAMILIAR INSTRUCTOR',[
      ark('Hello. Sayaka mentioned someone who could teach me to—','storyTalking'),
      say('Good to see you, Aruken.','oshiageHappy'),
      ark('...Of course. Where is the instructor?','storySurprised'),
      say('You are looking at her. Disappointed?','oshiageHappy'),
      ark('I am beginning to wonder what else you have not told me.','storySheepish'),
      say('Funny. I have been wondering the same about you.','oshiageHappy'),
      ark('Fair enough.','storyLaughing'),
      say('Now let us see whether you drive as well as you fix cars.','oshiageReviewing'),
    ]),
    {type:'SET_FLAG',key:'arkonStorySchoolRevealed',value:true},
    {type:'SET_FLAG',key:'arkonStoryLessonCompleted',value:false},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter02Lesson'},
    {type:'WAIT_FLAG',key:'arkonStoryLessonCompleted',equals:true},
    {type:'WAIT_SCENE',scene:'OshiageScene'},
    manga('A DIFFERENT KIND OF TALENT',[
      say('Good. You can hear an engine perfectly. Now you are starting to understand the launch.','oshiageHappy'),
      ark('I seem to have found an instructor who knows exactly how to humble me.','storySheepish'),
      say('You are welcome.','oshiageHappy'),
      ark('And I am very glad I came.','storyCoolShy'),
    ]),
    {type:'GOTO',to:'shibuyaSchoolKnown'},
    {type:'LABEL',name:'shibuyaSchoolKnown'},
    manga('A POSSIBLE PARTNERSHIP',[
      say('I visit a few other meets and know the local workshops. I could introduce you to people who need help.','oshiageNeutral'),
      ark('You have already done more than enough.','storySheepish'),
      say('And somebody should make sure you actually charge the wealthy ones.','oshiageHappy'),
      ark('You are volunteering to negotiate my invoices?','storyConfidentSmirk'),
      say('Occasionally. I have a job of my own, you know.','oshiageReviewing'),
      ark('Then I had better make the most of the time you spare.','storyCoolShy'),
      say('A remarkably sensible answer.','oshiageHappy'),
    ]),
    {type:'CLEAR_STAGE'},
    {type:'WAIT_SCENE',scene:'MeetScene'},
    // Later, she catches him checking his own 240Z. Engineering skill
    // and his willingness to accept her driving advice now complement one another.
    ...present('THE 240Z // AFTER THE RUNS',[
      {id:A,pose:'storyMechanicCrouch',role:'carMechanic'},
      {id:S,pose:'oshiageReviewing',role:'observer'},
    ]),
    manga('A PROPER LAUNCH',[
      say('You are checking the clutch linkage?','oshiageReviewing'),
      ark('After that lesson, I realised the engagement was inconsistent.','storyMechanic'),
      say('You really did take the notes seriously.','oshiageHappy'),
      ark('I can diagnose it. That does not mean I know everything about driving it.','storySerious'),
      say('Good. I would hate to run out of things to teach you.','oshiageHappy'),
    ]),
    manga('AN INVITATION, SORT OF',[
      say('You have done more to that 240Z than I thought.'),
      ark('You should hear it when the gearbox is warm.','storyConfident'),
      say('Then drive. I will come along.','oshiageRelaxed'),
      ark('You want a ride in the museum exhibit?','storySurprised'),
      say('Before you change your mind.','oshiageHappy'),
    ]),
    {type:'CLEAR_STAGE'},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter02Driving'},
    {type:'STORY_CRUISE'},
    {type:'WAIT_FLAG',key:'arkonStoryCruiseComplete',equals:true,scene:'GarageScene'},
    manga('AFTER THE DRIVE',[
      say('Your 240Z is better sorted than some expensive cars I have driven.','oshiageReviewing'),
      ark('Do you always offer compliments in the least flattering way?','storyLaughing'),
      say('Almost always. Now where is that workshop?','oshiageRelaxed'),
    ]),
    {type:'CLEAR_STAGE'},
    ...present("ARUKEN'S PLACE // BAD COFFEE",[
      {id:A,pose:'storyMechanicEngine'},
      {id:S,pose:'oshiageRelaxed'},
    ],[{carId:'$SELECTED_CAR'}],
    'workshop:shinonomeWorkshop:night',{stageMode:'native',privateMeet:false}),
    manga('COFFEE AND A WORKBENCH',[
      ark('Sorry about the coffee. The good stuff ran out sometime last decade.','storySheepish'),
      say('That is impressively bad.','oshiageConcerned'),
      ark('You are welcome. Would you like the full tour?','storyLaughing'),
      say('There is more than one room?','oshiageRelaxed'),
      ark('Technically the storage cupboard counts.'),
      say('These tools are not cheap. And they are very well looked after.','oshiageReviewing'),
      ark('Some are older than the 240Z. I kept them when the race-team work ended.','storySerious'),
      say('You really did work in a professional paddock.','oshiageSerious'),
      ark('For a while. I miss getting a car right. I do not miss the politics.','storySerious'),
    ]),
    manga('SHE WATCHES HIM WORK',[
      say('Would you mind showing me what you have been changing?','oshiageTalking'),
      ark('Watch the selector travel here. Just enough to take the slack out.','storyMechanic'),
      say('You measured the difference rather than guessing.','oshiageReviewing'),
      ark("You do not guess with somebody else's race on the line.",'storySerious'),
      say('No. You do not.','oshiageSerious'),
      ark('You sound like you know that from experience.','storySheepish'),
      say('A little.','oshiageRelaxed'),
      ark('That makes two of us giving incomplete answers.','storyLaughing'),
      say('Perhaps. I have a car I may ask you to look at one day.','oshiageHappy'),
      ark('If you survive the coffee, you know where to find me.','storyConfident'),
    ]),
    {type:'CLEAR_STAGE'},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter02AfterWorkshop'},
    {type:'WAIT_SCENE',scene:'MeetScene'},
    {type:'WAIT_WIN_DELTA',key:'ch2BeforeFriendlyRace',count:2,scene:'MeetScene'},
    ...present('A FAMILIAR INTERRUPTION',meetCast),
    manga('A FRIENDLY REMATCH',[
      ark('If it is not the most expensive smile in Tokyo.','storyLaughing'),
      say('Please, both of you.','oshiageSerious'),
      ark('I had not even started.','storySheepish'),
      say('You were going to.','oshiageRelaxed'),
    ]),
    manga('THE OFFER',[
      daigo('Your 240Z sounded different tonight. Let us have another run. No money.'),
      say('That is unusually generous.','oshiageReviewing'),
      daigo('I can be generous. Especially in front of company.'),
      say('I was about to leave.','oshiageNeutral'),
      daigo('A pity. You will miss me winning.'),
      say('Possibly.','oshiageRelaxed'),
    ],{left:D,right:S}),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter02RivalRace'},
    {type:'CLEAR_STAGE'},
    {type:'ARKON_CHALLENGE_RACE'},
    {type:'WAIT_SCENE',scene:'MeetScene'},
    {type:'IF',key:'arkonStoryChapter02RivalResult',equals:'won',then:'afterWin',else:'afterLoss'},
    {type:'LABEL',name:'afterWin'},
    ...present('THE REMATCH // WELL DRIVEN',[{id:A,pose:'storyConfident'},{id:S,pose:'oshiageRelaxed'}]),
    manga('QUIET SATISFACTION',[
      ark('That felt more like the car I have been trying to build.','storyConfident'),
      say('It looked like it, too. Your setup held together.','oshiageHappy'),
      ark('You noticed the car before the driver.','storyLaughing'),
      say('I noticed both. Do not make it difficult.','oshiageRelaxed'),
    ]),
    {type:'GOTO',to:'chapterEnd'},
    {type:'LABEL',name:'afterLoss'},
    ...present('THE REMATCH // MORE TO LEARN',[{id:A,pose:'storySheepish'},{id:S,pose:'oshiageRelaxed'}]),
    manga('NO EASY WAY THROUGH',[
      ark('Better setup. Still not enough.','storySerious'),
      say('The shifts were cleaner. You can keep working from there.','oshiageReviewing'),
      ark('You do have a way of making defeat sound productive.','storySheepish'),
      say('Only when it is.','oshiageRelaxed'),
    ]),
    {type:'LABEL',name:'chapterEnd'},
    manga('SOMETHING TO BUILD',[
      say('You know, fixing that Forester might turn into more work.','oshiageReviewing'),
      ark('A few people have asked me to look at their cars. Paid work, for once.','storySerious'),
      say('Take the jobs you can do properly. The rest can wait.','oshiageSerious'),
      ark('And the regional challenge?','storyTalking'),
      say('When you are ready. I am not giving away five lessons easily.','oshiageHappy'),
      ark('I thought you had forgotten that wager.','storyLaughing'),
      say('Not a chance.','oshiageRelaxed'),
    ]),
    {type:'CLEAR_STAGE'},
    {type:'SET_FLAG',key:'arkonStoryChapter02Done',value:true},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter02Complete'},
    {type:'END'},
  ],
};
