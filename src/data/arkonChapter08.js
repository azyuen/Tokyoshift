// R672 — CHAPTER 08: THE PRICE OF AMBITION.
// Sayaka and Arkon remain close, even as his new circle unsettles her.
// Three player-driven races resolve honestly; the gala ends in a signed risk,
// not a manufactured mechanical failure, breakup or Chapter 09 cliff event.
const A='arkonDen',S='sayakaFujieda',V='storyVipPromoter';
const ark=(text,pose='storyTalking')=>['left',text,pose];
const say=(text,pose='homeNormal')=>['right',text,pose];
const vip=(text,pose='idle')=>['right',text,pose];
const manga=(title,lines,right=S,left=A)=>{
  // Formalwear remains consistent while either person speaks at the gala;
  // no casual-outfit flash between alternating dialogue panels.
  const formal=lines.some(([, ,pose])=>pose==='ginzaSuit'||pose==='ginzaDress');
  return {
    type:'MANGA',title,characters:{left,right},
    pages:lines.map(([speaker,text,pose])=>({
      speaker,text,
      leftPose:left===A?(speaker==='left'?pose||(formal?'ginzaSuit':'storyTalking')
        :formal?'ginzaSuit':'storyIdle'):'idle',
      rightPose:right===S?(speaker==='right'?pose||(formal?'ginzaDress':'homeNormal')
        :formal?'ginzaDress':'homeNormal'):'idle',
    })),
  };
};
const tableau=(label,bg,cast,cars=[],vipParty=false)=>[
  {type:'CLEAR_STAGE'},
  {type:'STAGE',backgroundId:bg,stageMode:'native',
    privateMeet:bg.startsWith('meet:'),composition:'car-behind-cast',
    vipParty,fadeInMs:vipParty?900:0,characters:cast,cars},
  {type:'HOLD_SCENE',label,
    caption:vipParty?'SHIBUYA // THE PRIVATE NIGHT':'ARKON DEN // THE PRICE OF AMBITION',
    revealMs:vipParty?650:0},
];
const ordinary=[{id:A,pose:'storyIdle'},{id:S,pose:'homeNormal',role:'observer'}];
const hq=(label,cast=ordinary)=>tableau(label,'workshop:shinonomeWarehouseStrip:night',
  cast,[{carId:'arkonLibertyWalk240z'}]);
const meet=(label,venue,rival,car)=>tableau(label,'meet:'+venue+':night',[
  {id:A,pose:'storyConfident',role:'player'},
  {id:S,pose:'homeHappy',role:'companion'},
  {id:rival,pose:'idle',role:'challenger'},
],[{carId:'arkonLibertyWalk240z'},{carId:car}]);
const partyCast=[
  {id:A,pose:'ginzaSuit',role:'player'},
  {id:S,pose:'ginzaDress',role:'companion'},
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
  title:'ARKON DEN // CHAPTER 08: THE PRICE OF AMBITION',
  steps:[
    {type:'SET_FLAG',key:'arkonStoryChapter',value:8},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter08Together',timeOfDay:'night'},
    ...hq('WAREHOUSE HQ // A FAMILIAR VISITOR'),
    manga('THE AFTERNOON COFFEE',[
      say('I brought coffee. The kind you can drink without signing an invoice.','homeHappy'),
      ark('You have never appreciated my old machine.','storySheepish'),
      say('You have a new suit, a new Z and three new contracts. Yet the coffee is still dreadful.','homeHappy'),
      ark('Some traditions deserve to survive.','storyLaughing'),
      say('I had a student today who insisted fourth gear was optional.','homeNormal'),
      ark('I like his ambition.','storyConfidentSmirk'),
      say('I knew you would.','homeHappy'),
    ]),
    {type:'PHONE',title:'WAREHOUSE HQ // AN EXCLUSIVE INVITATION',
      callerId:'',callerName:'PRIVATE EVENT ORGANISER',
      presentationMode:'openingSwipe',pages:[
        {speaker:'caller',text:'Arkon Den? Your Liberty Walk Z has attracted some serious attention.'},
        {speaker:'player',text:'I hope they liked the engineering underneath it.'},
        {speaker:'caller',text:'We have a private invitational in Shinagawa. Cash stakes, selective entries. Interested?'},
        {speaker:'player',text:'Send the rules. I do not race blind.'},
      ]},
    manga('JUST ONE EVENING',[
      say('You are not considering another invitation, surely?','homeSerious'),
      ark('One run. Good people, good cars. You could come with me.','storyTalking'),
      say('And remind you which pedal is the brake?','homeHappy'),
      ark('That was the plan.','storyConfidentSmirk'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter08FirstRace',timeOfDay:'night'},
    ...meet('SHINAGAWA // THE FIRST INVITATION','shinagawaTennozu','reikaTachibana','fc3s'),
    manga('A FAMILIAR RHYTHM',[
      say('Nice to be out in a car with you again.','homeHappy'),
      ark('I was beginning to think you missed my driving.','storyConfidentSmirk'),
      say('I missed having a complete conversation. The driving is negotiable.','homeHappy'),
    ]),
    ...race(0),
    ...tableau('SHINAGAWA // THE AFTERMATH','meet:shinagawaTennozu:night',ordinary,
      [{carId:'arkonLibertyWalk240z'}]),
    manga('WELL CONNECTED',[
      ark('Win or lose, they asked who built the Z.','storyConfident'),
      say('That used to be enough for you.','homeNormal'),
      ark('It still is. Mostly.','storySheepish'),
    ]),
    {type:'LOCATION',scene:'GarageScene',
      data:{crewMode:false,workshopLocationId:'shinonomeWarehouseStrip'}},
    ...hq('WAREHOUSE HQ // THE WORK DOES NOT STOP'),
    manga('ANOTHER SHORT VISIT',[
      say('You promised me dinner when you had an evening free.','homeNormal'),
      ark('I have not forgotten. Just one more collector meeting.','storyTalking'),
      say('You have a remarkable collection of one more meetings.','homeSerious'),
      ark('And you are still here to count them.','storySheepish'),
      say('I am.','homeHappy'),
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
      say('How much are they asking you to put up?','homeSerious'),
      ark('Nothing I cannot afford.','storyConfidentSmirk'),
      say('That is not quite what I asked.','homeSerious'),
      ark('I know the car. I know the risks.','storyTalking'),
      say('You seem very sure of that lately.','homeNormal'),
    ]),
    ...race(1),
    ...tableau('DAIKOKU // AFTER THE RUN','meet:daikokuPA:night',ordinary,
      [{carId:'arkonLibertyWalk240z'}]),
    manga('NOT THE SAME FEELING',[
      ark('The important part is the engineering. They noticed every detail.','storyConfident'),
      say('Then why do they talk more about money than cars?','homeSerious'),
      ark('They are investors. That is what investors do.','storyTalking'),
      say('Perhaps.','homeNormal'),
    ]),
    {type:'LOCATION',scene:'GarageScene',
      data:{crewMode:false,workshopLocationId:'shinonomeWarehouseStrip'}},
    ...hq('WAREHOUSE HQ // ONE MORE INVITATION'),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter08Invitation',timeOfDay:'night'},
    manga('SOMETHING IMPORTANT',[
      ark('Sayaka! There is something important I want to ask you.','storyTalking'),
      say('Oh? That sounds ominous.','homeHappy'),
      ark('Are you free Saturday evening? There is somewhere I would really like you to come.','storySheepish'),
      say('You mean... like a d—','homeBlushing'),
      ark('Deal of a lifetime!','storyConfidentSmirk'),
      ark('A VIP evening in Shibuya. Serious collectors. I could use your help.','storyConfident'),
      say('Oh. Business.','homeSerious'),
      ark('You are brilliant with people. And I wanted you there.','storyTalking'),
      say('...Alright, Arkon. I will come.','homeNormal'),
      ark('Fantastic. You will not regret it.','storyConfident'),
      say('I hope not.','homeSerious'),
    ]),
    manga('THE LAST INVITATIONAL',[
      ark('One more proving run before the party. Then we can leave the stopwatch behind.','storyConfident'),
      say('I would quite like that.','homeNormal'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter08ThirdRace',timeOfDay:'night'},
    ...meet('SHIBUYA // PRIVATE INVITATIONAL','shibuyaScramble','renKurosawa','evo5'),
    manga('THE WRONG COMPANY',[
      say('They are very keen to raise the stakes again.','homeSerious'),
      ark('It is not about winning. It is about who is watching.','storyConfidentSmirk'),
      say('That may be the first thing you have said tonight that frightens me.','homeSerious'),
    ]),
    ...race(2),
    ...tableau('SHIBUYA // THE CITY AFTER DARK','meet:shibuyaScramble:night',ordinary,
      [{carId:'arkonLibertyWalk240z'}]),
    manga('AFTER THE LAST RUN',[
      ark('That is the last race of the night. Come on. The party awaits.','storyTalking'),
      say('You said we could leave the stopwatch behind.','homeNormal'),
      ark('We can. I promise.','storySheepish'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter08VipParty',timeOfDay:'night'},
    ...party('SHIBUYA // AN EVENING ABOVE THE CITY'),
    manga('A DIFFERENT SIDE OF TOKYO',[
      ark('Wow.','ginzaSuit'),
      say('What?','ginzaDress'),
      ark('You look incredible.','ginzaSuit'),
      say('Thank you. You clean up rather well yourself.','ginzaDress'),
      ark('Perhaps we should go somewhere without an engine for once.','ginzaSuit'),
      say('That would be rather nice.','ginzaDress'),
    ]),
    ...party('SHIBUYA // THE VIP CIRCLE'),
    manga('THE PERFECT INTRODUCTION',[
      vip('Arkon Den. The man behind the Liberty Walk. A pleasure at last.'),
      ark('Good evening. I was hoping to meet your team.','ginzaSuit'),
      vip('We have ambitious clients. They dislike hearing that a deadline is impossible.'),
      ark('A safe result takes as long as the engineering requires.','ginzaSuit'),
      vip('Of course. Although our investors pay very well for certainty.'),
    ],V),
    manga('THE CONVERSATIONS',[
      say('They keep talking about deadlines and guarantees, not safety.','ginzaDress'),
      ark('They are used to large projects. They talk differently.','ginzaSuit'),
      say('I am not sure that is all it is.','ginzaDress'),
      ark('I will read every page. I am not going in blind.','ginzaSuit'),
    ]),
    ...party('SHIBUYA // A PRIVATE PROPOSAL'),
    manga('THE OFFER',[
      vip('An exclusive racing engineering programme. Substantial funding. International attention.'),
      ark('What about validation time and the right to refuse sign-off?','ginzaSuit'),
      vip('We can discuss milestones. Our clients require guarantees.'),
      ark('And the security?','ginzaSuit'),
      vip('Your business assets would back certain delivery obligations. A standard arrangement among serious partners.'),
      ark('Let me review the full terms.','ginzaSuit'),
    ],V),
    manga('THE MAN WITH THE PORSCHE',[
      say('Arkon. Can we talk?','ginzaDress'),
      ark('Of course. What is wrong?','ginzaSuit'),
      say('That contract. Are you really considering it?','ginzaDress'),
      ark('This could be the biggest opportunity we have ever had.','ginzaSuit'),
      say('And the risks?','ginzaDress'),
      ark('I have done the calculations. I am in control this time.','ginzaSuit'),
      say('Where is the man who refused to sign off on that Porsche?','ginzaDress'),
      ark('That was different.','ginzaSuit'),
      say('How?','ginzaDress'),
      ark('Because I know what I am doing now.','ginzaSuit'),
      say('You knew what you were doing then.','ginzaDress'),
    ]),
    manga('EVERYTHING HAS CHANGED',[
      ark('You do not understand what is at stake.','ginzaSuit'),
      say('You have built a wonderful business. People respect you. What more do you need?','ginzaDress'),
      ark('I just want to make something of myself.','ginzaSuit'),
      say('You already have.','ginzaDress'),
      say('Please, Arkon. Let us leave. We can talk properly at home.','ginzaDress'),
      ark('I cannot abandon a deal like this.','ginzaSuit'),
      say('Then I am going. I am not asking you to give up your dreams.','ginzaDress'),
      say('I am asking you not to lose yourself chasing them.','ginzaDress'),
    ]),
    manga('AN INTERRUPTION',[
      vip('Arkon! Our partners are ready to finalise the arrangement.'),
      ark('Yes. Just a moment.','ginzaSuit'),
    ],V),
    manga('ANOTHER TIME',[
      ark('Sayaka, can we talk about this later?','ginzaSuit'),
      say('Of course, Arkon.','ginzaDress'),
    ]),
    {type:'HOLD_SCENE',label:'SAYAKA WAITS',
      caption:'SHIBUYA // THE MUSIC CONTINUES',revealMs:600},
    {type:'FADE_STORY_ACTOR',actorId:S,ms:2200},
    {type:'HOLD_SCENE',label:'SHE IS GONE',
      caption:'SHIBUYA // ONE CONVERSATION TOO MANY',revealMs:450},
    manga('THE GUARANTEES',[
      vip('Our partners will fund the development. You commit to the delivery schedule.'),
      ark('I need final authority over engineering sign-off.','ginzaSuit'),
      vip('There are provisions for review. The financial security is non-negotiable.'),
      ark('And the workshop is named in the security documents?','ginzaSuit'),
      vip('Only if you fail to meet your contractual obligations.'),
      ark('...I understand.','ginzaSuit'),
    ],V),
    manga('THE SIGNATURE',[
      vip('So, Arkon. Shall we proceed?'),
      ark('Yes.','ginzaSuit'),
      vip('Excellent. Welcome aboard.'),
    ],V),
    {type:'ARKON_CH8_CONTRACT'},
    ...party('SHIBUYA // SURROUNDED BY EVERYONE',[
      {id:A,pose:'ginzaSuit',role:'player'},
      {id:V,pose:'idle',role:'observer'},
    ]),
    manga('THE PRICE OF AMBITION',[
      ark('It is the biggest deal I have ever signed.','storyThinking'),
      ark('I should be celebrating.','storySerious'),
    ],V),
    {type:'SET_FLAG',key:'arkonStoryChapter08Done',value:true},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter08Complete'},
    {type:'CLEAR_STAGE'},
    {type:'END'},
  ],
};
