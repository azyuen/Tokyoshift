// R655 — Arkon's second chapter is an independent, save-gated origin story.
// All ordinary races still use production driving physics. The dockside Forester
// is a STORY PROP using its stock modular car artwork, not a player reward.
const A='arkonDen', S='sayakaFujieda', D='storyDaigoKirishima', F='storyDockForeman';
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
  {type:'HOLD_SCENE',label,caption:'ARKON DEN // THE LONG WAY HOME'},
];
const meetCast=[
  {id:A,pose:'storyIdle'},
  {id:S,pose:'oshiageNeutral'},
  {id:D,pose:'idle',role:'observer'},
];

export const ARKON_CHAPTER_02 = {
  id:'arkonChapter02',
  title:'ARKON DEN // CHAPTER 02: THE LONG WAY HOME',
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
      daigo('Arkon. Still driving the Civic? I respect your commitment to automotive history.'),
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
      {id:F,pose:'idle',x:425,ground:.80},
      {id:A,pose:'storyMechanicCrouch',role:'carMechanic',x:955,ground:.85},
    ],[{carId:'forester',x:935,ground:.81,width:555}],
    'meet:daikokuOpenLot:day'),
    manga('SOMETHING OTHER THAN RACING',[
      ark('Four in the morning. Crates, forklifts, fish. Good thing I needed the money.','storySerious'),
      foreman('You there. The Forester has died on us and the deliveries are backing up.'),
      ark('And I am supposed to do what about it?','storySheepish'),
      foreman('You were talking about engines. Can you take a look?'),
      ark('All right. Pop the bonnet.','storyTalking'),
    ],{left:A,right:F}),
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

    // Only here does Sayaka catch Arkon with tools at the Meet: not at home.
    ...present('THE CIVIC // AFTER THE RUNS',[
      {id:A,pose:'storyMechanicCrouch',role:'carMechanic'},
      {id:S,pose:'oshiageReviewing',role:'observer'},
    ]),
    manga('NOT JUST A LOOSE BOLT',[
      say('I wondered where you had got to.','oshiageNeutral'),
      ark('Down here. Trying not to become part of the exhaust.','storySheepish'),
      say('You are adjusting the clutch linkage? At a meet?','oshiageReviewing'),
      ark('The engagement was inconsistent. I could feel it on the last two launches.'),
      say('You can diagnose that from the pedal?','oshiageConcerned'),
      ark('After enough years, sometimes the car tells you.','storySerious'),
      say('That sounds suspiciously like experience.','oshiageTalking'),
      ark('It is a lot cheaper than buying new parts.','storyLaughing'),
    ]),
    manga('AN INVITATION, SORT OF',[
      say('You have done more to that Civic than I thought.'),
      ark('You should hear it when the gearbox is warm.','storyConfident'),
      say('Then drive. I will come along.','oshiageRelaxed'),
      ark('You want a ride in the museum exhibit?','storySurprised'),
      say('Before you change your mind.','oshiageHappy'),
    ]),
    {type:'CLEAR_STAGE'},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter02Driving'},
    ...present('NIGHT DRIVE // NO CLOCK, NO FINISH LINE',[],
      [{carId:'$SELECTED_CAR',x:1010,ground:.77,width:650}],
      'meet:tatsumiDistrictLoop:night',{motion:'drive'}),
    manga('THE LONG WAY HOME',[
      say('That shift was smoother than the last lesson.','oshiageReviewing'),
      ark('I changed the linkage. And a few other things.','storyTalking'),
      say('Who built the engine?','oshiageSerious'),
      ark('I did.'),
      say('And the transmission?'),
      ark('That as well.'),
      say('You left out rather a lot when we first met.','oshiageConcerned'),
      ark('I used to turn spanners for a race team. These days I am trying to keep the lights on.','storySerious'),
      say('There is a story there.','oshiageRelaxed'),
      ark('There is. My workshop is just around the corner. Want terrible coffee?','storySheepish'),
      say('How terrible?','oshiageTalking'),
      ark('Remarkably consistent. Unlike my bank account.','storyLaughing'),
    ]),
    {type:'CLEAR_STAGE'},
    ...present("ARKON'S PLACE // BAD COFFEE",[
      {id:A,pose:'storyMechanicEngine',x:830,ground:.84},
      {id:S,pose:'oshiageRelaxed',x:390,ground:.84},
    ],[{carId:'ef',x:1100,ground:.78,width:600}],
    'workshop:shinonomeWorkshop:night'),
    manga('COFFEE AND A WORKBENCH',[
      ark('Sorry about the coffee. The good stuff ran out sometime last decade.','storySheepish'),
      say('That is impressively bad.','oshiageConcerned'),
      ark('You are welcome. Would you like the full tour?','storyLaughing'),
      say('There is more than one room?','oshiageRelaxed'),
      ark('Technically the storage cupboard counts.'),
      say('These tools are not cheap. And they are very well looked after.','oshiageReviewing'),
      ark('Some are older than the Civic. I kept them when the race-team work ended.','storySerious'),
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
    {type:'WAIT_WIN_DELTA',key:'ch2BeforeFriendlyRace',count:2,scene:'MeetScene'},
    ...present('A FAMILIAR INTERRUPTION',meetCast),
    manga('A FRIENDLY REMATCH',[
      ark('If it is not the most expensive smile in Tokyo.','storyLaughing'),
      say('Please, both of you.','oshiageSerious'),
      ark('I had not even started.','storySheepish'),
      say('You were going to.','oshiageRelaxed'),
    ]),
    manga('THE OFFER',[
      daigo('Your Civic sounded different tonight. Let us have another run. No money.'),
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
