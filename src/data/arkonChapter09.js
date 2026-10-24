// R673 — Aruken Story Chapter 09, not the separate Career Chapter 09.
// No named criminal organisation, magical exoneration or invented race victories.
// Sayaka gives Aruken space to choose principle; practical danger remains for Chapter 10.
const A='arkonDen',S='sayakaFujieda',V='storyVipPromoter';
const ark=(text,pose='storyTalking')=>['left',text,pose];
const say=(text,pose='homeNormal')=>['right',text,pose];
const vip=(text,pose='idle')=>['right',text,pose];
const manga=(title,lines,right=S,left=A)=>({
  type:'MANGA',title,characters:{left,right},
  pages:lines.map(([speaker,text,pose])=>({
    speaker,text,
    leftPose:left===A?(speaker==='left'?pose||'storyTalking':'storyIdle'):'idle',
    rightPose:right===S?(speaker==='right'?pose||'homeNormal':'homeNormal'):'idle',
  })),
});
const stage=(label,backgroundId,characters,cars=[],privateMeet=false)=>[
  {type:'CLEAR_STAGE'},
  {type:'STAGE',backgroundId,stageMode:'native',privateMeet,
    composition:'car-behind-cast',fadeInMs:650,characters,cars},
  {type:'HOLD_SCENE',label,caption:'ARUKEN DENZAKI // NO WAY OUT',revealMs:420},
];
const alone=[{id:A,pose:'storySerious',role:'player'}];
const together=[{id:A,pose:'storyIdle',role:'player'},
  {id:S,pose:'homeNormal',role:'companion'}];
const hq=(label,cast=alone,cars=[{carId:'arkonLibertyWalk240z'}])=>
  stage(label,'workshop:shinonomeWarehouseStrip:night',cast,cars);
const meet=(label,venue,rival,car)=>stage(label,'meet:'+venue+':night',[
  {id:A,pose:'storyConfident',role:'player'},
  {id:rival,pose:'idle',role:'challenger'},
],[{carId:'arkonLibertyWalk240z'},{carId:car}],true);
const race=index=>[
  {type:'CLEAR_STAGE'},
  {type:'ARKON_CH9_RACE',index},
  {type:'WAIT_SCENE',scene:'MeetScene'},
  {type:'ARKON_CH9_RETURN'},
];
const night=(label,cast,cars)=>stage(label,'meet:shibuyaScramble:night',cast,cars,true);
export const ARKON_CHAPTER_09={
  id:'arkonChapter09',
  title:'ARUKEN DENZAKI // CHAPTER 09: NO WAY OUT',
  steps:[
    {type:'SET_FLAG',key:'arkonStoryChapter',value:9},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter09Contracts',timeOfDay:'night'},
    ...hq('WAREHOUSE HQ // ANOTHER LATE NIGHT'),
    manga('THE GOLDEN CAGE',[
      ark('The Shibuya contract paid for a great deal of new equipment.','storyConfident'),
      ark('I should be happier about that.','storyThinking'),
      ark('Three cars arrived without clear histories. The same buyer appears on two sets of papers.','storySerious'),
      ark('It may be nothing. Collectors move cars every day.'),
    ]),
    {type:'PHONE',title:'A PRIVATE ENGINEERING PROGRAMME',callerId:'',
      callerName:'PRIVATE EVENT ORGANISER',pages:[
        {speaker:'caller',text:'The investors loved your presentation. They require another demonstration in Shibuya tonight.'},
        {speaker:'player',text:'I still need the paperwork for the latest consignments.'},
        {speaker:'caller',text:'Everything is in order. Show them what the Z can do, Aruken.'},
      ]},
    ...meet('SHIBUYA // A FLAWLESS DEMONSTRATION','shibuyaScramble','renKurosawa','evo5'),
    manga('APPLAUSE',[
      ark('Another beautiful machine. But no one asked how it was built.','storyThinking'),
      ark('They were watching the numbers move on a phone. Not the cars.'),
    ]),
    ...race(0),
    ...hq('WAREHOUSE HQ // THE SAME CHASSIS'),
    manga('THE SECOND SALE',[
      ark('I know this car. I checked it for another client last month.','storySerious'),
      ark('Now the documents say it changed hands twice and doubled in value.','storyThinking'),
      ark('That does not happen because someone polished the bonnet.'),
    ]),
    manga('AN UNWELCOME QUESTION',[
      ark('I need to verify the ownership chain before I put my name to its condition report.','storySerious'),
      vip('Aruken, buyers pay you for your engineering, not your opinions about their affairs.'),
      ark('My signature is not a decoration.'),
      vip('The investors are expecting another performance test at Daikoku. Keep your attention there.'),
    ],V),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter09Pressure',timeOfDay:'night'},
    ...meet('DAIKOKU // UNDER PRESSURE','daikokuPA','tetsuoMori','3000gt'),
    manga('THE SECOND TEST',[
      ark('I asked for two extra days of inspection. They gave me another race instead.','storySerious'),
      ark('I used to think winning meant I was in control.','storyThinking'),
    ]),
    ...race(1),
    ...hq('WAREHOUSE HQ // THE GUARANTEE'),
    manga('THE FIGURES',[
      ark('The declared resale value is far higher than the records can support.','storySerious'),
      ark('And there are invoices for work we never performed.'),
      ark('My sign-off would make all of it look respectable.'),
      ark('What exactly did I agree to in Shibuya?'),
    ]),
    manga('TERMS AND CONDITIONS',[
      vip('A missed milestone leaves you with substantial contractual liabilities.'),
      ark('You want me to certify a car without knowing its real history?','storySerious'),
      vip('We want you to honour an agreement. You have a very fine workshop.'),
      ark('That sounds like a threat.'),
      vip('It is a reminder that success carries obligations.'),
    ],V),
    ...hq('WAREHOUSE HQ // THE PORSCHE RETURNS',together,
      [{carId:'arkonLibertyWalk240z'},{carId:'rwbStellaPorsche'}]),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter09SayakaReturns',timeOfDay:'night'},
    manga('SAYAKA RETURNS',[
      say('Aruken.','homeNormal'),
      ark('Sayaka? I was going to call you.','storySheepish'),
      say('I have heard a few things about your new clients. Nothing definite. Enough to worry me.','homeSerious'),
      ark('I think some of their transactions are wrong. They want me to sign anyway.','storySerious'),
      say('And when did you start to suspect that?'),
      ark('Before tonight.','storyThinking'),
      say('Oh, Aruken.','homeSerious'),
    ]),
    manga('THE QUESTION',[
      ark('If I refuse, I could lose Warehouse HQ. Maybe more.','storySerious'),
      say('Then we get independent advice. Carefully. We do not confront anyone alone.','homeSerious'),
      ark('What if I cannot get out of it?'),
      say('There is something I need you to answer first.'),
      say('If walking away costs you the money, the contacts, the reputation... would you still do it?','homeSerious'),
      ark('I cannot go back to having nothing.','storyThinking'),
      say('You never had nothing. You had me.','homeNormal'),
      ark('Sayaka...','storySheepish'),
      say('Where is the man who refused to sign off on that Porsche?','homeSerious'),
      ark('He made a mistake. A very big one.','storySerious'),
      say('Then let him make the next decision properly.'),
      ark('I want out. No more signatures.','storySerious'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryChapter09ResolvedToLeave',value:true},
    manga('A CAREFUL PLAN',[
      say('We will speak to an independent adviser before the event. No disappearing records. No dramatic accusations.','homeSerious'),
      ark('They want me at a final private sale tomorrow.'),
      say('Then do not go alone. And do not sign anything you cannot stand behind.'),
      ark('I did not deserve you coming back.','storySheepish'),
      say('You can thank me by listening for once.','homeHappy'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter09FinalMeet',timeOfDay:'night'},
    ...night('SHIBUYA // THE FINAL SIGNATURE',[
      {id:A,pose:'ginzaSuit',role:'player'},
      {id:V,pose:'idle',role:'observer'},
    ],[{carId:'arkonLibertyWalk240z'},{carId:'rwbStellaPorsche'}]),
    manga('ONE LAST DOCUMENT',[
      vip('Our purchasers are waiting. The restored car, the valuation, your engineering assurance.'),
      ark('The documents do not match. I cannot verify its history.','ginzaSuit'),
      vip('You signed a contract, Aruken.'),
      ark('I know. I intend to deal with that. But I will not certify this transaction.','ginzaSuit'),
      vip('It would be unfortunate if your workshop suffered for this.'),
      ark('My decision is final.','ginzaSuit'),
    ],V),
    {type:'ARKON_CH9_REFUSE'},
    ...night('SHIBUYA // NOT ALONE',[
      {id:A,pose:'ginzaSuit',role:'player'},
      {id:S,pose:'ginzaDress',role:'companion'},
      {id:V,pose:'idle',role:'observer'},
    ],[{carId:'rwbStellaPorsche'}]),
    manga('THE INVESTOR',[
      vip('There will be matters to settle.'),
      ark('Then we can address them properly. Not here.','ginzaSuit'),
      vip('We will be in touch.'),
    ],V),
    manga('AN EXIT',[
      say('Aruken. Our advisers are waiting.','ginzaDress'),
      ark('I am ready.','ginzaSuit'),
      say('Good evening.','ginzaDress'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter09RoadHome',timeOfDay:'night'},
    ...stage('TOKYO // THE ROAD HOME','meet:yokohamaMinatoMirai:night',together,
      [{carId:'rwbStellaPorsche'}],true),
    manga('THE ROAD HOME',[
      ark('I do not know what happens next.','storySerious'),
      say('Neither do I.','homeNormal'),
      ark('I might lose the workshop.','storyThinking'),
      say('Maybe. But you did not put your name to another lie.','homeNormal'),
      ark('Why did you come?'),
      say('I remembered someone who once lost everything rather than sign off on a Porsche he knew was unsafe.','homeHappy'),
      say('I thought he might still be in there somewhere.','homeNormal'),
    ]),
    {type:'LOCATION',scene:'GarageScene',
      data:{crewMode:false,workshopLocationId:'shinonomeWarehouseStrip'}},
    ...hq('WAREHOUSE HQ // MORNING COFFEE',together,
      [{carId:'arkonLibertyWalk240z'},{carId:'rwbStellaPorsche'}]),
    manga('A SMALL BEGINNING',[
      ark('I am sorry, Sayaka. For Shibuya. For not listening. For all of it.','storySheepish'),
      say('You really were quite an idiot.','homeSerious'),
      ark('A spectacular one?','storySheepish'),
      say('Spectacular.','homeHappy'),
      ark('There are invoices to check, lawyers to meet, and customers I owe explanations.'),
      say('Then start with one honest job. And breakfast.','homeHappy'),
      ark('I still owe you dinner.','storySheepish'),
      say('You do. I am keeping the receipt.','homeHappy'),
    ]),
    {type:'SET_FLAG',key:'arkonStoryChapter09Done',value:true},
    {type:'SET_FLAG',key:'arkonStoryPhase',value:'chapter09Complete'},
    {type:'CLEAR_STAGE'},
    {type:'END'},
  ],
};
