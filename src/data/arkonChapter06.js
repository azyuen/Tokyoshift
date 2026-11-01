import {polishArukenPresentation} from '../story/ArukenPresentation.js?v=20261026-audit';
// R668 — Chapter 06: Aruken and Sayaka's positive business/relationship peak.
// Same black repossessed RWB: repay finance, restore, independently certify,
// cinematic no-input drive, then personal gift to Sayaka under the Ferris wheel.
const A='arkonDen',S='sayakaFujieda',K='kenjiOkabe';
const ark=(text,pose='storyTalking')=>['left',text,pose];
const say=(text,pose='oshiageRelaxed')=>['right',text,pose];
// The Oshiage instructor has a life outside work. Her casual clothes alternate
// by commission, and all intimate Porsche repair scenes use home sprites.
const homeTitles=new Set([
  'FROM DAIKOKU','THE EVENING SHIFT','THE BUSINESS ACCOUNT',
  'ROOM TO DO IT RIGHT','THE LETTER','BACK TO THE BARE SHELL',
  'THE HARD PART OF GETTING IT RIGHT','EVERYTHING IN WRITING',
  'THE CERTIFICATE','NO DESTINATION IN PARTICULAR','AFTER THE CITY FALLS QUIET',
  'SOMETHING I OWE YOU','JUST TWO WORDS','A VERY BAD EXCUSE','THE KEYS',
]);
const homePose=pose=>{
  if(String(pose).startsWith('home'))return pose;
  if(pose==='oshiageHappy')return 'homeHappy';
  if(['oshiageReviewing','oshiageSerious','oshiageConcerned'].includes(pose))
    return 'homeSerious';
  return 'homeNormal';
};
const manga=(title,lines,cast={left:A,right:S})=>{
  const home=homeTitles.has(title);
  return {type:'MANGA',title,characters:cast,pages:lines.map(([speaker,text,pose])=>({
    speaker,text,
    leftPose:cast.left===A?speaker==='left'?(pose||'storyTalking'):'storyIdle':'idle',
    rightPose:cast.right===S
      ?home?homePose(speaker==='right'?pose:'homeNormal')
        :speaker==='right'?(pose||'oshiageRelaxed'):'oshiageRelaxed'
      :'idle',
  }))};
};
const together=[{id:A,pose:'storyIdle'},{id:S,pose:'oshiageRelaxed',role:'observer'}];
const homeScenes=/SECOND NEW CLIENT|THE NEW ORDERS|WAREHOUSE HQ|RWB \/\/|JUST BEFORE MIDNIGHT/;
const stage=(caption,backgroundId,cars=[],cast=together)=>[
  {type:'CLEAR_STAGE'},
  {type:'STAGE',backgroundId,stageMode:'native',
    privateMeet:backgroundId.startsWith('meet:'),
    composition:'conversation-balanced',
    fadeInMs:backgroundId.startsWith('meet:')?1400:1050,
    meetCarLayout:backgroundId.startsWith('meet:')?'yokohamaGift':null,
    meetCastLayout:backgroundId.startsWith('meet:')?'yokohamaGift':null,
    characters:cast,cars},
  {type:'HOLD_SCENE',label:caption,caption:'ARUKEN DENZAKI // EVERYTHING WE BUILT',
    revealMs:800},
];
const workshop=(caption,car)=>{
  const home=homeScenes.test(caption);
  return stage(caption,'$CURRENT_WORKSHOP',car?[{carId:car}]:[],
    [{id:A,pose:caption.includes('RWB //')?'storyMechanicEngine':'storyIdle'},
     {id:S,pose:home?'homeNormal':'oshiageRelaxed',role:'observer'}]);
};
export const ARKON_CHAPTER_06={
  id:'arkonChapter06',
  title:'ARUKEN DENZAKI // CHAPTER 06: EVERYTHING WE BUILT',
  steps:[
    {type:'SET_FLAG',key:'arkonStoryChapter',value:6},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter06Commissions',timeOfDay:'day'},
    ...workshop('CANAL YARD // THE MORNING AFTER','rwbStellaPorsche'),
    manga('A PLACE THAT IS TOO SMALL',[
      ark('Three commissions finished. Five more people asking when I can fit them in.','storyThinking'),
      say('Your work speaks for itself now.','oshiageHappy'),
      ark('It is mostly shouting that the workshop is too small.','storyConfidentSmirk'),
      say('Then perhaps it is time to consider a bigger one.','oshiageReviewing'),
      ark('And the Porsche loan?','storySheepish'),
      say('We will not pretend that went away. One thing at a time.','oshiageSerious'),
    ]),
    {type:'PHONE',title:'NEW INVOICES // KENJI OKABE',callerId:K,callerName:'KENJI OKABE',
      presentationMode:'openingSwipe',pages:[
        {speaker:'caller',text:'Aruken. Your Mine\'s owner is telling everyone who repaired his car.'},
        {speaker:'player',text:'I hope he mentioned the paperwork.'},
        {speaker:'caller',text:'He did. Three paying commissions are confirmed, and the owners have signed the work orders.'},
        {speaker:'player',text:'I cannot take the risk without knowing the costs.'},
        {speaker:'caller',text:'They will cover the parts. Your labour invoices can go into the reserved business account.'},
        {speaker:'player',text:'Then send them in one at a time. I want every car properly finished.'},
      ]},
    ...workshop('THE FIRST NEW CLIENT','$SELECTED_CAR'),
    manga('FROM SHINAGAWA',[
      say('The first owner came through a contact at the Shinagawa meets.','oshiageRelaxed'),
      ark('You are turning into a rather convincing operations manager.','storyConfidentSmirk'),
      say('I still teach at Oshiage, remember? This is the occasional favour.','oshiageHappy'),
      ark('Occasional. Like the six messages you sent me yesterday?','storyLaughing'),
      say('Seven. You missed one.','oshiageHappy'),
    ]),
    {type:'ARKON_CH6_JOB',index:0},
    manga('ONE DONE',[
      ark('All checks passed. First invoice goes straight to the Porsche and workshop reserve.','storyConfident'),
      say('Well done. Two more waiting.','oshiageHappy'),
    ]),

    ...workshop('THE SECOND NEW CLIENT','$SELECTED_CAR'),
    manga('FROM DAIKOKU',[
      say('Remember the rotary crowd at Daikoku? Their friends have noticed.','oshiageReviewing'),
      ark('Somebody told them I can do the impossible.','storySheepish'),
      say('I told them you take careful measurements. They supplied the impossible part.','oshiageHappy'),
      ark('That is a reassuring distinction.','storyLaughing'),
    ]),
    {type:'ARKON_CH6_JOB',index:1},
    manga('THE EVENING SHIFT',[
      ark('The second car is ready. Another customer signed off, another invoice earned.','storyConfident'),
      say('And you are still taking the time to do the job properly.','oshiageHappy'),
      ark('I would rather be the slowest honest mechanic than the fastest liar.','storyConfidentSmirk'),
      say('I know. That is why people trust you.','oshiageRelaxed'),
    ]),

    ...workshop('THE THIRD COMMISSION','$SELECTED_CAR'),
    manga('A CALL FROM YOKOHAMA',[
      say('The last client knows somebody from Yokohama. A serious collector.','oshiageReviewing'),
      ark('Should I be worried?','storySheepish'),
      say('Only if you plan to cut corners.','oshiageHappy'),
      ark('Not even for a friend.','storySerious'),
      say('Especially not for a friend.','oshiageRelaxed'),
    ]),
    {type:'ARKON_CH6_JOB',index:2},
    ...workshop('THE NEW ORDERS ARE COMPLETE','rwbStellaPorsche'),
    manga('THE BUSINESS ACCOUNT',[
      ark('Three signed contracts. Eight million yen and some change in actual labour receipts.','storySurprised'),
      say('That is a proper business now. Not just one lucky job.','homeConfident'),
      ark('We can fit out Warehouse HQ, cover three months of rent, and clear the Porsche loan.','storyThinking'),
      say('And repair the RWB properly?','homeSerious'),
      ark('Every last panel. Even after that, there will be money left in the bank.','storyConfident'),
    ]),

    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter06Warehouse'},
    {type:'ARKON_CH6_WAREHOUSE'},
    {type:'LOCATION',scene:'GarageScene',
      data:{crewMode:false,workshopLocationId:'shinonomeWarehouseStrip'}},
    ...workshop('WAREHOUSE HQ // THE FIRST DAY','rwbStellaPorsche'),
    manga('ROOM TO DO IT RIGHT',[
      ark('A proper frame bench. A clean assembly area. Space to breathe.','storySurprised'),
      say('And a whole warehouse to lose your tools in.','oshiageHappy'),
      ark('They have organised drawers!','storyConfident'),
      say('I have never seen you this excited.','oshiageHappy'),
      ark('You did not see the invoice.','storySheepish'),
    ]),
    {type:'ARKON_CH6_REPAY'},
    manga('THE LETTER',[
      ark('The finance company has confirmed the Porsche debt is paid in full.','storySerious'),
      say('Three million yen. Really gone?','oshiageHappy'),
      ark('The workshop earned it. We have paid the rent ahead, too.','storySerious'),
      say('You earned it.','oshiageHappy'),
      ark('I still need to rebuild the thing.','storySheepish'),
      say('Then let us get started.','oshiageRelaxed'),
    ]),

    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter06Restoration'},
    ...workshop('RWB // STRUCTURAL REBUILD','rwbStellaPorsche'),
    manga('THE PART SHE STILL MISSES',[
      ark('You always see the whole team, not just the car in front of you.','storyTalking'),
      say('Old habits. I used to enjoy making race strategy work when everyone else was watching the clock.','homeContemplative'),
      ark('Do you miss managing a team?','storyThinking'),
      say('Sometimes. The decisions, the people, the responsibility. Not the politics.','homeContemplative'),
      say('But I like teaching at Oshiage. I am not sure I want to go back.','homeContemplative'),
      ark('You do not have to decide. You are good at both.','storySerious'),
      say('That is unusually reassuring from a man who argues with every dyno chart.','homeHappy'),
      ark('You reminded me I could still be a mechanic. I will return the favour whenever you need it.','storyCoolShy'),
      say('Careful. I might take you up on that.','homeHappy'),
    ]),
    manga('BACK TO THE BARE SHELL',[
      ark('No shortcuts. The old repair hid damage where nobody wanted to look.','storySerious'),
      say('What if the measurements fail?','oshiageReviewing'),
      ark('Then it stays on the jig until they do not.','storyMechanic'),
      say('That sounds like you.','oshiageRelaxed'),
    ]),
    {type:'ARKON_CH6_RESTORE',index:0},
    ...workshop('RWB // ENGINE AND DRIVELINE','rwbStellaPorsche'),
    manga('THE HARD PART OF GETTING IT RIGHT',[
      ark('The repaired structure is aligned and independently checked. Now the powertrain.','storySerious'),
      say('You are enjoying yourself again.','oshiageHappy'),
      ark('I am trying not to. It would be unprofessional.','storyConfidentSmirk'),
    ]),
    {type:'ARKON_CH6_RESTORE',index:1},
    ...workshop('RWB // FINAL INSPECTION','rwbStellaPorsche'),
    manga('EVERYTHING IN WRITING',[
      ark('Brakes, steering, restraints and tyres. Then an independent structural and roadworthiness inspection.','storySerious'),
      say('You really will not drive it until somebody signs off?','oshiageReviewing'),
      ark('Not one metre on the road. Not after what it was.','storySerious'),
      say('Good. Then I will bring the coffee.','oshiageHappy'),
    ]),
    {type:'ARKON_CH6_RESTORE',index:2},
    manga('THE CERTIFICATE',[
      ark('All repairs documented. Structural sign-off obtained. The Porsche is cleared for road use.','storySurprised'),
      say('So it really is finished.','oshiageHappy'),
      ark('Finished. Paid for. Safe.','storyConfident'),
      say('You have been waiting a long time to say those words.','oshiageRelaxed'),
    ]),

    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter06NightDrive',timeOfDay:'night'},
    ...workshop('JUST BEFORE MIDNIGHT','rwbStellaPorsche'),
    manga('NO DESTINATION IN PARTICULAR',[
      ark('Sayaka. Are you free tonight?','storyCoolShy'),
      say('That depends. Are you planning another test drive?','oshiageReviewing'),
      ark('I am planning a drive. No timer. No race. Just the car.','storyConfidentSmirk'),
      say('Where to?','oshiageRelaxed'),
      ark('Somewhere you will like.','storyTalking'),
      say('That has never sounded more suspicious.','oshiageHappy'),
    ]),
    {type:'CLEAR_STAGE'},
    {type:'ARKON_CH6_DRIVE'},
    {type:'WAIT_SCENE',scene:'MeetScene'},
    {type:'ARKON_CH6_DRIVE_RETURN'},
    // RaceScene has already selected the wheel as the real Meet venue,
    // so do not draw the former location first and then replace its background.
    ...stage('YOKOHAMA // THE FERRIS WHEEL','meet:yokohamaMinatoMirai:night',
      [{carId:'rwbStellaPorsche'}],
      [{id:A,pose:'storyCoolShy',role:'yokohamaArkon',flipX:false},
       {id:S,pose:'homeNormal',role:'yokohamaSayaka',flipX:true}]),
    manga('AFTER THE CITY FALLS QUIET',[
      say('You brought me all the way to Minato Mirai?','homeAlert'),
      ark('The lights are better when nobody is racing.','storyConfidentSmirk'),
      say('You have become surprisingly sentimental.','homeBlushing'),
      ark('Do not tell anyone. It will hurt my reputation.','storySheepish'),
      say('What reputation?','oshiageHappy'),
    ]),
    manga('SOMETHING I OWE YOU',[
      ark('Do you remember the night that Porsche arrived at Canal Yard?','storySerious'),
      say('Very clearly. You hardly spoke. You just kept staring at it.','homeNormal'),
      ark('I was wondering how many things one person could get wrong.','storyThinking'),
      say('You had not given up. You were still looking for a way forward.','homeSerious'),
      ark('You kept showing up. With dinner, ridiculous remarks, and people who needed help.','storyCoolShy'),
      say('I wanted to see you find your feet again.','homeNormal'),
      ark('I did not realise it then, but I started looking forward to those evenings.','storyCoolShy'),
      ark('Not just because there was more work coming in.','storyCoolShy'),
      say('Aruken...','homeNormal'),
    ]),
    {type:'CHOICE',key:'ch6GiftWords',title:'UNDER THE YOKOHAMA LIGHTS',
      subtitle:'Aruken has one more thing to tell Sayaka.',
      choices:[
        {id:'simple',to:'giftSimple',label:'TELL HER SIMPLY',
          description:'A quiet thank-you, without a prepared speech.'},
        {id:'playful',to:'giftPlayful',label:'TRY TO MAKE HER LAUGH',
          description:'Aruken stays Aruken, even for a moment like this.'},
      ]},
    {type:'LABEL',name:'giftSimple'},
    manga('JUST TWO WORDS',[
      ark('You gave me a reason to believe the workshop could be something again.','storySerious'),
      say('You built it with your own hands.','homeNormal'),
      ark('Maybe. But I would not have wanted to do it alone.','storyCoolShy'),
    ]),
    {type:'GOTO',to:'theGift'},
    {type:'LABEL',name:'giftPlayful'},
    manga('A VERY BAD EXCUSE',[
      ark('I thought about buying you flowers.','storySheepish'),
      say('You? Flowers? I would have been suspicious.','homeNormal'),
      ark('So I went with something a little less subtle.','storyConfidentSmirk'),
    ]),
    {type:'LABEL',name:'theGift'},
    manga('THE KEYS',[
      ark('Sayaka... the Porsche is yours.','storyBlushing'),
      say('Wait. You cannot mean that.','homeAlert'),
      ark('It is repaired, inspected and completely paid for. I had the papers prepared.','storyTalking'),
      say('Aruken, that is an extraordinary thing to give someone.','homeContemplative'),
      ark('I know. I spent a lot of time wondering if I could even ask you to take it.','storyCoolShy'),
      ark('But when things were at their worst, you stayed. You gave me hope.','storySerious'),
      ark('I wanted this car, of all things, to become a good memory for you too.','storyCoolShy'),
      say('I... I really do not know what to say.','homeBlushing'),
      ark('You do not have to answer tonight.','storySheepish'),
      say('I am grateful, Aruken. More than I can put into words.','homeBlushing'),
      ark('Well... guess that is what I needed to tell you...','storyCoolShy'),
      say('...','homeNormal'),
      ark('How about we just enjoy the view?','storyCoolShy'),
      say('I would like that.','homeHappy'),
    ]),
    {type:'ARKON_CH6_GIFT'},
    // Sayaka's last warm smile dissolves into the iconic rear-view pair.
    {type:'FADE_STORY_ACTOR',actorId:S,ms:1950},
    {type:'ARKON_CH6_ENDING'},
    {type:'SET_FLAG',key:'arkonStoryChapter06Done',value:true},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter06Complete'},
    {type:'CLEAR_STAGE'},
    {type:'END'},
  ],
};

polishArukenPresentation(ARKON_CHAPTER_06);
