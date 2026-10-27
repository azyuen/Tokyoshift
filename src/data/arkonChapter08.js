import {polishArukenPresentation} from '../story/ArukenPresentation.js?v=20261027-ch8';
// Chapter 08 dialogue revision — bespoke super builds and understated Sayaka arc.
// Sayaka and Aruken remain close, even as his new circle unsettles her.
// Three player-driven races resolve honestly; the gala ends in a signed risk,
// not a manufactured mechanical failure, breakup or Chapter 09 cliff event.
const A='arkonDen',S='sayakaFujieda',V='storyVipPromoter';
const ark=(text,pose='storyTalking')=>['left',text,pose];
const say=(text,pose='homeNormal')=>['right',text,pose];
const vip=(text,pose='idle')=>['right',text,pose];
const manga=(title,lines,right=S,left=A,forceFormal=false)=>{
  // Formalwear remains consistent while either person speaks at the gala;
  // no casual-outfit flash between alternating dialogue panels.
  const formal=forceFormal||lines.some(([, ,pose])=>pose==='ginzaSuit'||pose==='ginzaDress'||String(pose||'').startsWith('dev'));
  return {
    type:'MANGA',title,characters:{left,right},
    pages:lines.map(([speaker,text,pose])=>({
      speaker,text,
      leftPose:left===A?(formal
        ? speaker==='left'&&String(pose||'').startsWith('dev')?pose:'ginzaSuit'
        : speaker==='left'?pose||'storyTalking':'storyIdle'):'idle',
      rightPose:right===S?(speaker==='right'?pose||(formal?'ginzaDress':'homeNormal')
        :formal?'ginzaDress':'homeNormal'):'idle',
    })),
  };
};
// Reusable three-character manga layout: Sayaka | Aruken | promoter.
// Center speaks as 'center'; the engine dims the other two automatically.
const trio=(title,lines)=>({
  type:'MANGA',title,characters:{left:S,center:A,right:V},
  pages:lines.map(([speaker,text,pose])=>({
    speaker:speaker==='left'?'center':speaker==='right'&&pose!=='ginzaDress'?'right':'left',
    text,
    leftPose:'devIdle',
    centerPose:speaker==='left'?(pose||'ginzaSuit'):'ginzaSuit',
    rightPose:'idle',
  })),
});
const galaSayakaPose=(text,pose)=>{
  if(/incredible|clean up|nice|lovely|thank you|of course/i.test(text))return 'devLaughing';
  if(/never mind|tired|little different|good luck/i.test(text))return 'devSad';
  if(/dangerous|everything|risk|deadline|contract|worried|careful|choice/i.test(text))return 'devScowl';
  if(/doubt|wonder|what|if|how/i.test(text))return 'devUnsure';
  return 'devDisappointed';
};
// Keep the scene geography: Sayaka on left, Aruken on right.
const intimate=(title,lines)=>({
  type:'MANGA',title,characters:{left:S,right:A},
  pages:lines.map(([speaker,text,pose])=>({
    speaker:speaker==='right'?'left':'right',text,
    leftPose:speaker==='right'?galaSayakaPose(text,pose):'devIdle',
    rightPose:speaker==='left'?(pose||'ginzaSuit'):'ginzaSuit',
  })),
});
const solo=(title,lines)=>({
  type:'MANGA',title,characters:{left:A},
  pages:lines.map(([,text,pose])=>({speaker:'left',text,leftPose:pose||'ginzaSuit'})),
});
const tableau=(label,bg,cast,cars=[],vipParty=false)=>[
  {type:'CLEAR_STAGE'},
  {type:'STAGE',backgroundId:bg,stageMode:'native',
    privateMeet:bg.startsWith('meet:'),composition:'car-behind-cast',
    vipParty,fadeInMs:vipParty?900:0,characters:cast,cars},
  {type:'HOLD_SCENE',label,
    caption:vipParty?'SHIBUYA // THE PRIVATE NIGHT':'ARUKEN DENZAKI // THE PRICE OF AMBITION',
    revealMs:vipParty?650:0},
];
const ordinary=[{id:A,pose:'storyIdle',facing:'right'},{id:S,pose:'homeNormal',role:'observer',facing:'left'}];
const school=[{id:A,pose:'storyIdle',facing:'right'},{id:S,pose:'oshiageHappy',role:'observer',facing:'left'}];
const close=[{id:A,pose:'storyIdle',facing:'right'},{id:S,pose:'homeNormal',role:'observer',facing:'left',offsetX:-32}];
const hq=(label,cast=ordinary)=>tableau(label,'workshop:shinonomeWarehouseStrip:night',
  cast,[{carId:'arkonLibertyWalk240z'}]);
const meet=(label,venue,rival,car)=>tableau(label,'meet:'+venue+':night',[
  {id:A,pose:'storyConfident',role:'player',facing:'right'},
  {id:S,pose:'homeHappy',role:'companion',facing:'left'},
  {id:rival,pose:'idle',role:'challenger'},
],[{carId:'arkonLibertyWalk240z'},{carId:car}]);
const partyCast=[
  {id:A,pose:'ginzaSuit',role:'player',facing:'right'},
  {id:S,pose:'ginzaDress',role:'companion',facing:'left'},
  {id:V,pose:'idle',role:'observer'},
];
const party=(label,cast=partyCast)=>tableau(label,
  'meet:shibuyaScramble:night',cast,[{carId:'arkonLibertyWalk240z'}],true);
const race=index=>[
  {type:'CLEAR_STAGE'},
  {type:'ARKON_CH8_RACE',index},
  {type:'WAIT_SCENE',scene:'MeetScene'},
  {type:'ARKON_CH8_RETURN'},
];
export const ARKON_CHAPTER_08={
  id:'arkonChapter08',
  title:'ARUKEN DENZAKI // CHAPTER 08: THE PRICE OF AMBITION',
  steps:[
    {type:'SET_FLAG',key:'arkonStoryChapter',value:8},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter08Together',timeOfDay:'night'},
    ...hq('WAREHOUSE HQ // A FAMILIAR VISITOR',school),
    manga('THE AFTERNOON COFFEE',[
      say("Well, well. Still here?",'homeHappy'),
      ark("I was beginning to think you missed my company.",'storyConfidentSmirk'),
      say("I missed having a complete conversation. Your company is negotiable.",'homeHappy'),
      ark("How was the driving school?",'storyTalking'),
      say("I had a student today who insisted fourth gear was optional.",'homeNormal'),
      ark("I like his ambition.",'storyConfidentSmirk'),
      say("I knew you would.",'homeHappy'),
      ark("I've been thinking about what you said. About taking an evening off.",'storySheepish'),
      say("Aruken Denzaki admitting I'm right? Historic.",'homeHappy'),
    ]),
    {type:'PHONE',title:'WAREHOUSE HQ // AN EXCLUSIVE INVITATION',
      callerId:'',callerName:'PRIVATE EVENT ORGANISER',
      presentationMode:'openingSwipe',pages:[
        {speaker:'caller',text:'Aruken Denzaki? Your Liberty Walk Z has attracted some serious attention.'},
        {speaker:'player',text:'I hope they liked the engineering underneath it.'},
        {speaker:'caller',text:"We represent a group investing in specialist automotive engineering. We'd like you at our Shinagawa invitational."},
        {speaker:'player',text:'Send the rules. I do not race blind.'},
      ]},
    manga('JUST ONE EVENING',[
      say("Another invitation? You were just saying something about taking an evening off.",'homeSerious'),
      ark("Come with me. One run, and then we can get dinner.",'storyTalking'),
      say("Is that a promise?",'homeHappy'),
      ark("Absolutely.",'storyConfidentSmirk'),
      say("I'll remember that.",'homeHappy'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter08FirstRace',timeOfDay:'night'},
    ...meet('SHINAGAWA // THE FIRST INVITATION','shinagawaTennozu','reikaTachibana','fc3s'),
    manga('A FAMILIAR RHYTHM',[
      say("Nice to be out in a car with you again.",'homeHappy'),
      ark("I was beginning to think you missed my driving.",'storyConfidentSmirk'),
      say("I missed having you to myself for more than five minutes.",'homeHappy'),
      ark("You make me sound terribly popular.",'storyTalking'),
      say("You're certainly popular with your telephone.",'homeHappy'),
      ark("Point taken.",'storySheepish'),
    ]),
    ...race(0),
    ...tableau('SHINAGAWA // THE AFTERMATH','meet:shinagawaTennozu:night',school,
      [{carId:'arkonLibertyWalk240z'}]),
    manga('WELL CONNECTED',[
      ark("They asked who built the Z. They were interested in the engineering.",'storyConfident'),
      say("And I'm pleased for you. You've worked incredibly hard.",'homeHappy'),
      ark("I couldn't have done it without some very good people.",'storyTalking'),
      say("Some very patient people, too.",'homeHappy'),
      ark("Especially those.",'storySheepish'),
      say("Now, about that dinner you promised...",'homeHappy'),
      ark("I haven't forgotten.",'storyTalking'),
    ]),
    {type:'LOCATION',scene:'GarageScene',
      data:{crewMode:false,workshopLocationId:'shinonomeWarehouseStrip'}},
    ...hq('WAREHOUSE HQ // THE WORK DOES NOT STOP',close),
    manga('ANOTHER SHORT VISIT',[
      ark("Sayaka, they want to establish a private engineering programme. Bespoke performance cars, international clients, real development budgets.",'storyConfident'),
      say("And they want you to lead it? Aruken, that's wonderful!",'homeHappy'),
      ark("Imagine building something extraordinary with my name on it.",'storyConfidentSmirk'),
      say("People already remember your work. Just make sure you know what they want in return.",'homeNormal'),
      ark("That's what the next meeting is for.",'storyTalking'),
      say("I've worked with teams who promised the world and expected miracles by Friday.",'homeSerious'),
      ark("Remind me to have you read the contract.",'storyTalking'),
      say("Happily. Dinner would be a start.",'homeHappy'),
    ]),
    {type:'PHONE',title:'PRIVATE INVITATIONAL // DAIKOKU',
      callerId:'',callerName:'PRIVATE EVENT ORGANISER',pages:[
        {speaker:'caller',text:'The Daikoku event carries a larger wager. Our investors want you there.'},
        {speaker:'player',text:'Send the entry terms. I want everything in writing.'},
        {speaker:'caller',text:'Of course. You are quickly becoming a name among our members.'},
      ]},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter08SecondRace',timeOfDay:'night'},
    ...meet('DAIKOKU // THE BIGGER WAGER','daikokuPA','tetsuoMori','3000gt'),
    manga('JUST BUSINESS?',[
      say("That's an interesting way to interview an engineer.",'homeSerious'),
      ark("They want to see what the Z can do.",'storyTalking'),
      say("Then let the car speak for itself.",'homeNormal'),
      ark("You sound like my old race strategist.",'storyConfidentSmirk'),
      say("I was rather good at it.",'homeHappy'),
      ark("Still are.",'storyConfident'),
    ]),
    ...race(1),
    ...tableau('DAIKOKU // AFTER THE RUN','meet:daikokuPA:night',ordinary,
      [{carId:'arkonLibertyWalk240z'}]),
    manga('NOT THE SAME FEELING',[
      ark("They're talking about serious funding. This could really happen.",'storyConfident'),
      say("They've told you plenty about the money, and very little about the work.",'homeSerious'),
      ark("That's what the next meeting is for.",'storyTalking'),
      say("Just be careful.",'homeNormal'),
      ark("I've spent years trying to get back into serious engineering. I can't let this pass me by.",'storySerious'),
      say("I'm not asking you to.",'homeNormal'),
      ark("Sorry. I know you're looking out for me.",'storySheepish'),
      say("Someone has to.",'homeHappy'),
    ]),
    {type:'LOCATION',scene:'GarageScene',
      data:{crewMode:false,workshopLocationId:'shinonomeWarehouseStrip'}},
    ...hq('WAREHOUSE HQ // ONE MORE INVITATION'),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter08Invitation',timeOfDay:'night'},
    manga('SOMETHING IMPORTANT',[
      ark("Sayaka! There is something important I want to ask you.",'storyTalking'),
      say("Oh? That sounds ominous.",'homeHappy'),
      ark("Are you free Saturday evening? There is somewhere I would really like you to come.",'storySheepish'),
      say("You mean... like a d—",'homeBlushing'),
      ark("Deal of a lifetime!",'storyConfidentSmirk'),
      ark("A VIP evening in Shibuya. Serious collectors. I could use your help.",'storyConfident'),
      say("Oh. Business.",'homeSerious'),
      ark("You are brilliant with people. And I wanted you there.",'storyTalking'),
      say("...Alright, Aruken. I will come.",'homeNormal'),
      ark("Fantastic. You will not regret it.",'storyConfident'),
      say("I hope not.",'homeSerious'),
    ]),
    manga('THE LAST INVITATIONAL',[
      ark("One more proving run before the party. Then we can leave the stopwatch behind.",'storyConfident'),
      say("I would quite like that.",'homeNormal'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter08ThirdRace',timeOfDay:'night'},
    ...meet('SHIBUYA // PRIVATE INVITATIONAL','shibuyaScramble','renKurosawa','evo5'),
    manga('THE WRONG COMPANY',[
      say("You're unusually quiet.",'homeNormal'),
      ark("Just thinking about what happens if this works.",'storyThinking'),
      say("And if it doesn't?",'homeNormal'),
      ark("Then we go home and I keep building cars.",'storyTalking'),
      say("That doesn't sound so terrible.",'homeHappy'),
      ark("No. But I really want this, Sayaka.",'storySerious'),
      say("I know you do.",'homeNormal'),
    ]),
    ...race(2),
    ...tableau('SHIBUYA // THE CITY AFTER DARK','meet:shibuyaScramble:night',ordinary,
      [{carId:'arkonLibertyWalk240z'}]),
    manga('AFTER THE LAST RUN',[
      ark("That's the last race. No more stopwatches tonight.",'storyConfident'),
      say("I'll hold you to that.",'homeHappy'),
      ark("You always do.",'storySheepish'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter08VipParty',timeOfDay:'night'},
    ...party('SHIBUYA // AN EVENING ABOVE THE CITY'),
    manga('A DIFFERENT SIDE OF TOKYO',[
      ark("Wow.",'devBlushing'),
      say("What?",'ginzaDress'),
      ark("You look incredible.",'devBlushing'),
      say("Thank you. You clean up rather well yourself.",'ginzaDress'),
      ark("Perhaps we should go somewhere without an engine for once.",'devLaughing'),
      say("That would be rather nice.",'ginzaDress'),
      ark("After tonight, perhaps.",'ginzaSuit'),
      say("Of course.",'ginzaDress'),
    ]),
    ...party('SHIBUYA // THE VIP CIRCLE'),
    trio('THE PERFECT INTRODUCTION',[
      vip("Aruken Denzaki. The man behind the Liberty Walk. A pleasure at last.",'storyTalking'),
      ark("Good evening. I was hoping to meet your team.",'ginzaSuit'),
      vip("Our partners have followed your work closely. We'd like to make you an offer.",'storyTalking'),
      ark("I'm listening.",'devSerious'),
    ]),
    trio('THE CONVERSATIONS',[
      say("They seem very interested in deadlines and guarantees.",'ginzaDress'),
      ark("They're investors. That's how they talk.",'ginzaSuit'),
      say("Just remember you don't need to prove anything at any cost.",'ginzaDress'),
      ark("I know. I'll read every page.",'ginzaSuit'),
    ]),
    ...party('SHIBUYA // A PRIVATE PROPOSAL',[
      {id:A,pose:'ginzaSuit',role:'player'},
      {id:V,pose:'idle',role:'observer'},
    ]),
    manga('THE OFFER',[
      vip("Three bespoke super builds. Six months. Fully funded by our investors.",'storyTalking'),
      ark("Three? In six months?",'devSerious'),
      vip("Each a unique, high-performance machine, engineered and delivered under your supervision.",'storyTalking'),
      ark("That's an ambitious schedule. I won't compromise safety or approve work that isn't ready.",'devSerious'),
      vip("Naturally. But our clients expect results.",'storyTalking'),
      ark("And if we need more time?",'devNervous'),
      vip("The delivery dates are fixed. Your workshop and business assets secure the delivery obligations.",'storyTalking'),
      ark("Warehouse HQ?",'devNervous'),
      vip("Only if you fail to fulfil the agreement. Imagine three extraordinary cars with your name on them.",'storyTalking'),
      ark("I need to review the terms.",'devSerious'),
      vip("Of course. Our partners make their final commitment tonight.",'storyTalking'),
    ],V),
    ...party('SHIBUYA // THE DEBRIEF',[
      {id:S,pose:'devIdle',role:'companion'},
      {id:A,pose:'ginzaSuit',role:'player'},
    ]),
    intimate('THE MAN WITH THE PORSCHE',[
      say("Well? How did it go?",'ginzaDress'),
      ark("Three custom super builds. Six months. Full funding.",'ginzaSuit'),
      say("Six months? That's barely enough time to develop one properly.",'ginzaDress'),
      ark("With the right team, we could manage it.",'ginzaSuit'),
      say("And if you can't?",'ginzaDress'),
      ark("The workshop guarantees the contract.",'devNervous'),
      say("Warehouse HQ? Aruken, that's everything you've built.",'ginzaDress'),
      ark("I know what I'm risking.",'devSerious'),
      say("There's a difference between difficult and dangerous.",'ginzaDress'),
      ark("I've handled difficult before.",'devSerious'),
      say("I know. I was there.",'ginzaDress'),
      say("Remember the Porsche you refused to sign off on? You knew what it would cost you.",'ginzaDress'),
      ark("That was different. The car wasn't safe.",'devSerious'),
      say("You always have a choice, Aruken.",'ginzaDress'),
      ark("And that choice cost me my career.",'devAngry'),
      say("It cost you your job. Not your integrity.",'ginzaDress'),
      ark("I can't go back to having nothing.",'devNervous'),
      say("You aren't that man anymore.",'ginzaDress'),
      ark("I intend to prove it.",'devSerious'),
      say("To whom?",'ginzaDress'),
    ]),
    intimate('EVERYTHING HAS CHANGED',[
      ark("Sayaka, this could change everything.",'devSerious'),
      say("I know. That's what worries me.",'ginzaDress'),
      ark("You don't think I can do it?",'devNervous'),
      say("I've never doubted what you can do, Aruken.",'ginzaDress'),
      ark("Then what is it?",'ginzaSuit'),
      say("I just wonder if you'll have time for anything else.",'ginzaDress'),
      ark("Of course I will. Once things settle down.",'ginzaSuit'),
      say("You always say that.",'ginzaDress'),
      ark("I thought you'd be happy for me.",'devNervous'),
      say("I am. I suppose I was hoping tonight might be a little different.",'ginzaDress'),
      ark("Different how?",'ginzaSuit'),
      say("Never mind.",'ginzaDress'),
    ]),
    manga('AN INTERRUPTION',[
      vip("Mr Denzaki? Our partners are ready to finalise the arrangement.",'storyTalking'),
      ark("Already? Right. Just a moment.",'ginzaSuit'),
    ],V),
    intimate('ANOTHER TIME',[
      ark("This is it. Everything I've been working towards.",'ginzaSuit'),
      say("I know.",'ginzaDress'),
      ark("I should probably go.",'ginzaSuit'),
      say("Of course.",'ginzaDress'),
      ark("Are you alright?",'devNervous'),
      say("Yes. Just a little tired.",'ginzaDress'),
      ark("I'll find you afterwards. We can get something to eat.",'ginzaSuit'),
      say("Aruken...",'ginzaDress'),
      ark("Hmm?",'ginzaSuit'),
      say("Nothing. Good luck.",'ginzaDress'),
      ark("Thanks. I'll need it.",'ginzaSuit'),
    ]),
    // Her last words lead directly into the silent stage departure.
    {type:'CLEAR_STAGE'},
    {type:'STAGE',backgroundId:'meet:shibuyaScramble:night',
      stageMode:'native',composition:'car-behind-cast',vipParty:true,
      characters:[
        {id:S,pose:'devSad',role:'companion',offsetX:-45},
        {id:A,pose:'ginzaSuit',role:'player'},
        {id:V,pose:'idle',role:'observer'},
      ],cars:[{carId:'arkonLibertyWalk240z'}]},
    {type:'RETREAT_STORY_ACTOR',actorId:S},
    manga('THE GUARANTEES',[
      vip("Everything is prepared, Mr Denzaki.",'storyTalking'),
      ark("I want final authority over engineering safety and sign-off.",'devSerious'),
      vip("The agreement provides for engineering review.",'storyTalking'),
      ark("That's not quite the same thing.",'devSerious'),
      vip("Your expertise is precisely why we're investing in you.",'storyTalking'),
      ark("And if I miss the deadline, I could lose the workshop.",'devNervous'),
      vip("Only if you fail to fulfil the agreement. Your assets secure the delivery commitments.",'storyTalking'),
      vip("You've spent years building your reputation. This is the opportunity you've been waiting for.",'storyTalking'),
    ],V),
    manga('THE SIGNATURE',[
      vip('So, Aruken. Shall we proceed?'),
      ark("Yes.",'devSerious'),
      vip('Excellent. Welcome aboard.'),
    ],V),
    {type:'ARKON_CH8_CONTRACT'},
    ...tableau('SHIBUYA // ALONE WITH THE Z','meet:shibuyaScramble:night',[
      {id:A,pose:'ginzaSuit',role:'player',facing:'right'},
    ],[{carId:'arkonLibertyWalk240z'}]),
    solo('THE PRICE OF AMBITION',[
      ark("Three cars. Six months.",'devNervous'),
      ark("I can do this.",'devSerious'),
      ark("Sayaka will understand.",'devNervous'),
      ark("I should be celebrating.",'devSad'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryChapter08Done',value:true},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter08Complete'},
    {type:'CLEAR_STAGE'},
    {type:'END'},
  ],
};

polishArukenPresentation(ARKON_CHAPTER_08);
