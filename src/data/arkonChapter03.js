import {polishArukenPresentation} from '../story/ArukenPresentation.js?v=20261026-audit';
// R656 — Aruken's independent story, following his FIRST regional title.
// Five real customer power builds. No Daichi, no unearned MX-5 ownership.
const A='arkonDen',S='sayakaFujieda';
const ark=(text,pose='storyTalking',listenerPose)=>['left',text,pose,listenerPose];
const say=(text,pose='homeNormal',listenerPose)=>['right',text,pose,listenerPose];
const unknown=text=>['system','UNKNOWN DRIVER: '+text,''];
const manga=(title,lines,cast={left:A,right:S})=>({
  type:'MANGA',title,characters:cast,
  pages:lines.map(([speaker,text,pose,listenerPose])=>({
    speaker,text,
    leftPose:cast.left===A
      ? (speaker==='left'?pose||'storyTalking':listenerPose||'storyIdle'):'idle',
    rightPose:cast.right===S
      ? (speaker==='right'?pose||'homeNormal':listenerPose||'homeNormal'):'idle',
  })),
});
const scene=(label,backgroundId,characters,cars=[{carId:'mx5'}],extras={})=>[
  {type:'STAGE',backgroundId,stageMode:'native',privateMeet:true,
    composition:'car-behind-cast',characters,cars,
    // The Chapter 03 workshop cast shares the car's floor plane and stays
    // behind its bodywork. Meet staging continues using normal showdown rules.
    ...(backgroundId.startsWith('workshop:')?
      {castBehindCar:true,characterScale:.84}:{}),
    ...extras},
  {type:'HOLD_SCENE',label,caption:'ARUKEN DENZAKI // THE NIGHT SHIFT'},
];
const withSayaka=[
  {id:A,pose:'storySheepish',x:440,ground:.83},
  {id:S,pose:'homeHappy',x:835,ground:.83},
];

export const ARKON_CHAPTER_03={
  id:'arkonChapter03',
  title:'ARUKEN DENZAKI // CHAPTER 03: THE NIGHT SHIFT',
  steps:[
    {type:'SET_FLAG',key:'arkonStoryChapter',value:3},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter03Jobs',timeOfDay:'night'},
    ...scene('CHAPTER 03 // THE NIGHT SHIFT','workshop:shinonomeCanalYard:night',
      [{id:A,pose:'storyMechanic',x:470,ground:.83}],[{carId:'$SELECTED_CAR'}]),
    manga('A DIFFERENT KIND OF WIN',[
      ark('First regional championship. Hard to believe that old 240Z managed it.','storyConfidentSmirk'),
      ark('The trophy is nice. The bills have not noticed.','storyShrugging'),
      ark('At least a few people have started asking about the work I do under the bonnet.','storyThinking'),
    ],{left:A}),
    {type:'PHONE',title:'CANAL YARD // INCOMING CALL',presentationMode:'openingSwipe',
      callerId:'',callerName:'LOCAL DRIVER',callerPose:'idle',
      pages:[
        {speaker:'caller',text:'Hey, I got your number from a guy at the meets. You the one who can tune an engine?'},
        {speaker:'player',text:'Depends on the engine.'},
        {speaker:'caller',text:'I need another few kilowatts. Can I bring the car to Canal Yard?'},
        {speaker:'player',text:'Bring it over. Tell me what power you want.'},
      ]},
    {type:'ARKON_CUSTOMER_JOB',index:0},
    manga('GOOD WORK TRAVELS',[
      ark('One happy customer. That was almost more satisfying than a win.','storyConfident'),
      ark('Almost.','storyConfidentSmirk'),
    ],{left:A}),
    {type:'PHONE',title:'THE SECOND CALL',presentationMode:'openingSwipe',
      callerId:'',callerName:'ANOTHER CUSTOMER',callerPose:'idle',
      pages:[
        {speaker:'caller',text:'My friend says you sorted his car out. You got room for one more?'},
        {speaker:'player',text:'Send me the details. And a realistic power target.'},
      ]},
    {type:'ARKON_CUSTOMER_JOB',index:1},
    {type:'ARKON_CUSTOMER_JOB',index:2},
    // Real Career specialists, not invented Story Mode mechanics. Their
    // connections grow from Sayaka's introductions and Aruken's actual work.
    ...scene('ODAIBA // ESPRIT','tuner:odaibaEsprit:night',[
      {id:A,pose:'storyMechanic'},{id:'takumiSerizawa',pose:'idle'}],[{carId:'240z'}]),
    manga('TAKUMI // FIRST PRINCIPLES',[
      ['right','Aoi told me you saved her old Z. She said you would not even take a payment.','idle'],
      ark('I could hardly charge her for cleaning a connection.','storySheepish'),
      ['right','Then have a look at this aero setup. Less weight is useless if it makes the car unstable.','idle'],
      ark('The balance matters more than one impressive number. Mind if we compare measurements?','storyMechanic'),
      ['right','That is the sort of question I like. Come in.','idle'],
    ],{left:A,right:'takumiSerizawa'}),
    {type:'CLEAR_STAGE'},
    ...scene('SHIBUYA // POWER HOUSE AMUSE','tuner:shibuyaAmuse:night',[
      {id:A,pose:'storyMechanic'},{id:'itsukiKuroda',pose:'idle'}],[{carId:'240z'}]),
    manga('ITSUKI // FLOW AND RESPONSE',[
      ['right','Sayaka says you understand how engines behave, not just how they look on a chart.','idle'],
      ark('She is very generous with her descriptions.','storySheepish'),
      ['right','Then you will enjoy this. We have been studying the relationship between exhaust flow and high-rpm response.','idle'],
      ark('Show me the data. I might have an idea about where the restriction moves with load.','storyThinking'),
      ['right','Good. I would rather work with someone who asks questions.','idle'],
    ],{left:A,right:'itsukiKuroda'}),
    {type:'CLEAR_STAGE'},
    ...scene('CANAL YARD // A FAMILIAR VISITOR','workshop:shinonomeCanalYard:night',withSayaka,[{carId:'240z'}]),
    manga('A LITTLE CREDIT',[
      say('Takumi and Itsuki both called. They enjoyed working with you.','homeHappy'),
      ark('I learned a lot. It was good to be around people who care about getting things right.','storySerious'),
      say('They said you had rather useful ideas of your own.','homeExplaining'),
      ark('They are polite people.','storySheepish'),
      say('Are you ever going to accept a compliment?','homeHappy'),
      ark('I did accept your invitation. That has worked out rather well.','storyCoolShy'),
      say('Careful, Aruken. That almost sounded sincere.','homeHappy'),
    ]),
    {type:'CLEAR_STAGE'},
    manga('WORD OF MOUTH',[
      ark('Three cars in two nights. I might need to stop answering my phone.','storyMechanic'),
      ark('Then again, the bills are starting to look a little friendlier.','storyLaughing'),
    ],{left:A}),
    {type:'ARKON_CUSTOMER_JOB',index:3},
    {type:'PHONE',title:'ONE LAST BOOKING',presentationMode:'openingSwipe',
      callerId:'',callerName:'CUSTOMER FIVE',callerPose:'idle',
      pages:[
        {speaker:'caller',text:'I have a little Mazda MX-5 booked in. Just make it a bit more lively, would you?'},
        {speaker:'player',text:'MX-5? Sure. I will have a look.'},
      ]},
    {type:'ARKON_CUSTOMER_JOB',index:4},
    ...scene('THE OWNER ARRIVES','workshop:shinonomeCanalYard:night',
      withSayaka.map(actor=>actor.id===S?{...actor,fadeInMs:1350}:actor),
      [{carId:'mx5'}],{castBehindCar:false,characterScale:1}),
    manga('AN UNEXPECTED CUSTOMER',[
      say('Excuse me. I am here to collect my car.','homeNormal'),
      ark('Just give me a— Sayaka?!','storySurprised'),
      say('Aruken?','homeHappy'),
      ark('This MX-5 is yours?','storySurprised'),
      say('It is. And apparently you are my mechanic.','homeHappy'),
      ark('I had absolutely no idea.','storySheepish'),
      say('Well, that is reassuring.','homeHappy'),
      ark('You just look... different.','storyCoolShy'),
      say('Different?','homeContemplative'),
      ark('I mean nice. You look nice.','storyBlushing','homeBlushing'),
      say('Thank you. I do occasionally wear something other than driving clothes.','homeBlushing'),
      ark('Right. Of course.','storySheepish'),
      say('Have I interrupted something?','homeHappy'),
      ark('No! Just working.','storyMechanic'),
      say('I can see that.','homeHappy'),
    ]),
    manga('A LITTLE MORE POWER',[
      say('So you have found yourself a job here?','homeNormal'),
      ark('More or less. People from the meets started calling. One job turned into another.','storyTalking'),
      say('Tuning cars professionally already. I am impressed.','homeHappy'),
      ark('Would not go that far. But it pays better than losing races.','storyShrugging'),
      say('And how is my little Mazda coming along?','homeNormal'),
      ark('Quite a bit livelier than when it arrived.','storyConfident'),
      say('How much further could you take it?','homeContemplative'),
      ark('Here at Canal Yard? Quite a bit.','storyThinking'),
      say('Then let us do it. As far as this place can manage.','homeConfident'),
      ark('Everything? You are serious?','storySurprised'),
      say('Completely. Unless you have forgotten how to work with me standing here.','homeConfident'),
      ark('Very funny.','storySheepish'),
      say('I will leave you to it. Oh, Aruken?','homeNormal'),
      ark('Yeah?','storyTalking'),
      say('You look nice too. In a very... hardworking sort of way.','homeBlushing','storyBlushing'),
      ark('...Thanks. I think.','storyCoolShy'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter03MaxBuild'},
    {type:'ARKON_CUSTOMER_JOB',index:5},
    manga('A PERFECTLY ORDINARY TEST DRIVE',[
      say('Finished?','homeHappy'),
      ark('Every upgrade I can fit here. Your MX-5 is officially not so little any more.','storyConfident'),
      say('Then you should drive it. You built it. Tell me how it feels.','homeNormal'),
      ark('You want me behind the wheel?','storySurprised'),
      say('As long as you remember I want the car back.','homeHappy'),
    ]),
    // The real RaceScene begins as a gentle hands-free MX-5 test drive with
    // Aruken at the wheel and Sayaka in the passenger seat. They talk using
    // compact race HUD portraits. The S15 pulls alongside, the road freezes
    // for the player decision, then an accepted challenge uses REAL physics.
    {type:'CLEAR_STAGE'},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter03Driving'},
    {type:'ARKON_MX5_RACE'},
    {type:'WAIT_SCENE',scene:'MeetScene'},
    {type:'ARKON_MX5_RETURN'},
    {type:'IF',key:'arkonStoryMx5RaceResult',equals:'declined',then:'decline',else:'judge'},
    {type:'LABEL',name:'judge'},
    {type:'IF',key:'arkonStoryMx5RaceResult',equals:'won',then:'victory',else:'defeat'},
    {type:'LABEL',name:'victory'},
    ...scene('AFTER THE RUN','meet:daikokuOpenLot:night',withSayaka),
    manga('ENOUGH POWER FOR TWO',[
      ark('How was that for your little Mazda?','storyConfidentSmirk'),
      say('Not bad. For a mechanic.','homeHappy'),
      ark('I was hoping for a little more enthusiasm.','storySheepish'),
      say('All right. That was rather good.','homeHappy'),
      ark('I knew you were going to say it eventually.','storyLaughing'),
    ]),
    {type:'GOTO',to:'parking'},
    {type:'LABEL',name:'defeat'},
    ...scene('AFTER THE RUN','meet:daikokuOpenLot:night',withSayaka),
    manga('STILL A GOOD ENGINE',[
      ark('Well. That did not go entirely to plan.','storySheepish'),
      say('The car did what you asked it to. Perhaps you asked at the wrong moment.','homeExplaining'),
      ark('I liked you better when you were complimenting my work.','storyShrugging'),
      say('I still am. The driving is a separate subject.','homeHappy'),
    ]),
    {type:'GOTO',to:'parking'},
    {type:'LABEL',name:'decline'},
    ...scene('A QUIET STOP','meet:daikokuOpenLot:night',withSayaka),
    manga('SOME RACES CAN WAIT',[
      ark('Let him go. It is a test drive, not a championship.','storySerious'),
      say('A remarkably sensible answer. Who are you and what have you done with Aruken?','homeHappy'),
      ark('I save my terrible decisions for the weekend.','storyConfidentSmirk'),
      say('I will mark my calendar.','homeHappy'),
    ]),
    {type:'LABEL',name:'parking'},
    // A fully staged unknown driver enters the same real Meet composition.
    // Reika's existing sprite is intentional as a VISUAL stand-in only: the
    // chapter does not disclose the driver's identity. The player decides
    // when to open the conversation; the visitor fades away afterwards.
    ...scene('SOMEONE IS WATCHING','meet:daikokuOpenLot:night',[
      {id:S,pose:'homeSerious'},
      {id:'reikaTachibana',pose:'idle',role:'observer',fadeInMs:1300},
    ],[{carId:'mx5'}],{castBehindCar:false}),
    {type:'MANGA',title:'SOMEONE REMEMBERS',
      characters:{left:S,right:'reikaTachibana'},pages:[
        {speaker:'right',speakerLabel:'UNKNOWN DRIVER',rightPose:'idle',leftPose:'homeSerious',text:'Sayaka? I thought that was you. Been a long time.'},
        {speaker:'left',leftPose:'homeSerious',rightPose:'idle',text:'It has. Good evening.'},
        {speaker:'right',speakerLabel:'UNKNOWN DRIVER',rightPose:'idle',leftPose:'homeNormal',text:'Did not think I would see you back out here.'},
        {speaker:'system',speakerLabel:'ARUKEN',rightPose:'idle',leftPose:'homeNormal',text:'You two know each other?'},
        {speaker:'left',leftPose:'homeNormal',rightPose:'idle',text:'We have crossed paths.'},
        {speaker:'right',speakerLabel:'UNKNOWN DRIVER',rightPose:'idle',leftPose:'homeNormal',text:'More than a few times. Funny how these roads bring people back.'},
        {speaker:'left',leftPose:'homeSerious',rightPose:'idle',text:'Some of us were only out for a drive.'},
        {speaker:'system',speakerLabel:'ARUKEN',rightPose:'idle',leftPose:'homeNormal',text:'And some of us were offered a race.'},
        {speaker:'right',speakerLabel:'UNKNOWN DRIVER',rightPose:'idle',leftPose:'homeNormal',text:'That engine sounds like someone knows what they are doing. Who tuned it?'},
        {speaker:'left',leftPose:'homeHappy',rightPose:'idle',text:'He did.'},
        {speaker:'right',speakerLabel:'UNKNOWN DRIVER',rightPose:'idle',leftPose:'homeNormal',text:'Canal Yard? I will remember that.'},
      ]},
    {type:'FADE_STORY_ACTOR',actorId:'reikaTachibana',ms:1250},
    ...scene('THE ROAD IS QUIET AGAIN','meet:daikokuOpenLot:night',withSayaka),
    manga('AN UNFINISHED STORY',[
      ark('You have a few stories you have not told me.','storyThinking'),
      say('I am sure you have a few of your own.','homeNormal'),
      ark('I try to keep things simple. Fix cars, race, go home.','storyShrugging'),
      say('You are doing remarkably well on your own.','homeHappy'),
      ark('It is simpler that way.','storyShrugging'),
      say('Maybe. Not everything worth doing is easier alone.','homeContemplative'),
      ark('Is this another driving lesson?','storyConfidentSmirk'),
      say('Only if you are paying attention.','homeHappy'),
    ]),
    {type:'CLEAR_STAGE'},
    ...scene('BACK AT CANAL YARD','workshop:shinonomeCanalYard:night',
      [{id:A,pose:'storyMechanic',x:465,ground:.82}],[{carId:'$SELECTED_CAR'}]),
    manga('A DIFFERENT KIND OF REPUTATION',[
      ark('Five customers. One very unexpected visitor. Not a bad week.','storyThinking'),
      ark('Quiet again. Just me and the tools. I could get used to this.','storyIdle'),
    ],{left:A}),
    {type:'PHONE',title:'CANAL YARD // ANOTHER CALL',presentationMode:'openingSwipe',
      callerId:'',callerName:'UNKNOWN CUSTOMER',callerPose:'idle',
      pages:[
        {speaker:'caller',text:'I heard about that little MX-5. Are you the mechanic?'},
        {speaker:'player',text:'That depends. What needs fixing?'},
        {speaker:'caller',text:'Not fixing. Building. I have a job for you.'},
        {speaker:'player',text:'Tell me what you need.'},
      ]},
    {type:'CLEAR_STAGE'},
    {type:'SET_FLAG',key:'arkonStoryChapter03Done',value:true},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter03Complete'},
    {type:'END'},
  ],
};

polishArukenPresentation(ARKON_CHAPTER_03);
