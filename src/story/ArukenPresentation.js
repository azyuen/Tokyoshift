// Visual-only Sayaka wardrobe/pose continuity across Story and Career.
// Home and Oshiage are distinct outfits. Preserve character text and story flags.
const pauses=new Set(['AN OLD DATSUN','THE DAY SHE NEEDED A FRIEND',
  'A SIGNATURE HE WILL NOT GIVE','THE PART SHE STILL MISSES','THE KEYS',
  'ANOTHER TIME','THE SIGNATURE','THE QUESTION','ONE LAST DOCUMENT','A RARE MOMENT OF DOUBT']);
const suited={storyLaughing:'devLaughing',storySerious:'devSerious',storyThinking:'devNervous',
  storySheepish:'devNervous',storyBlushing:'devBlushing',storyCoolShy:'devBlushing',
  storyTalking:'devTalking',storyIdle:'devIdle'};
// An Oshiage-labelled emotion is only appropriate when Sayaka is actually
// teaching at the driving school. At workshop, night meet or casual scenes,
// use the real home assets, including the four newly renamed originals.
const civilian={
  oshiageNeutral:'homeNormal',oshiageHappy:'homeHappy',
  oshiageConcerned:'homeAlert',oshiageSerious:'homeSerious',
  oshiageRelaxed:'homeNormal',oshiageReviewing:'homeContemplative',
  oshiageTalking:'homeExplaining',oshiageExplaining:'homeExplaining',
  oshiageConfident:'homeConfident',oshiageContemplative:'homeContemplative',
  oshiageAlert:'homeAlert',
};
const uniform={
  oshiageConfident:'oshiageHappy',oshiageContemplative:'oshiageReviewing',
  oshiageExplaining:'oshiageTalking',oshiageAlert:'oshiageConcerned',
};
const homeForUniform={
  homeNormal:'oshiageNeutral',homeHappy:'oshiageHappy',
  homeBlushing:'oshiageHappy',homeSad:'oshiageConcerned',
  homeSerious:'oshiageSerious',homeAlert:'oshiageConcerned',
  homeConfident:'oshiageHappy',homeContemplative:'oshiageReviewing',
  homeExplaining:'oshiageTalking',
};
const civilianChapters=new Set(['arkonChapter02','arkonChapter04',
  'arkonChapter05','arkonChapter06','arkonChapter08']);
export function polishArukenPresentation(script){
  let cast=[],closingTime=false,atSchool=false;
  const civilianByDefault=civilianChapters.has(script.id);
  for(const [index,step] of script.steps.entries()){
    // A cleared tableau must not impose its work clothes on a later school,
    // road or off-duty conversation. Keep real mechanic scenes outfit-safe.
    if(step.type==='CLEAR_STAGE'){cast=[];closingTime=false;}
    if(script.id==='arkonChapter02'&&step.type==='WAIT_SCENE'){
      if(step.scene==='OshiageScene')atSchool=true;
      else if(step.scene==='MeetScene'||step.scene==='GarageScene')atSchool=false;
    }
    if(step.type==='STAGE'){
      cast=step.characters||[];
      const label=script.steps[index+1]?.label||'';
      closingTime=script.id==='arkonChapter10'&&label==='GINZA // CLOSING TIME';
      if(closingTime)step.characters=cast=cast.map(a=>({...a,
        pose:a.id==='arkonDen'?'storyIdle':'homeNormal'}));
      if(/MORNING|FAMILIAR SOUND/.test(label)||
        script.id==='arkonChapter08'&&label==='WAREHOUSE HQ // A FAMILIAR VISITOR'){
        step.backgroundId=step.backgroundId.replace(/:night$/,':day');
        if(step.backgroundId==='$CURRENT_WORKSHOP')step.backgroundId='workshop:shinonomeCanalYard:day';
      }
      if(script.id==='arkonChapter09'&&label==='TOKYO // THE ROAD HOME')
        step.characters=cast=cast.map(a=>({...a,pose:a.id==='arkonDen'?'ginzaSuit':'ginzaDress'}));
      step.awaitArrival=true;
      if((step.cars?.length||0)>1&&step.backgroundId?.startsWith('meet:')&&!step.meetCarLayout)
        step.meetDuel=true;
      if(step.vipParty)step.population='gala';
      else if(['arkonChapter08','arkonChapter09'].includes(script.id)&&step.meetDuel)
        step.population='invitational';
      if(script.id==='arkonChapter09'&&step.backgroundId==='meet:shibuyaScramble:night'&&
        cast.some(a=>a.pose==='ginzaSuit'))step.population='private-sale';
      if(script.id==='arkonChapter10'&&label==='GINZA // OPENING EVENING')
        step.population='gallery';
      for(const actor of cast){
        if(actor.id!=='sayakaFujieda'){actor.pose=uniform[actor.pose]||actor.pose;continue;}
        // Chapter 01 intentionally established Sayaka in her navy uniform;
        // Chapter 02's Oshiage lesson is the other true school appearance.
        const school=script.id==='arkonChapter01Revised'||
          script.id==='arkonChapter01'||script.id==='arkonChapter02'&&atSchool;
        actor.pose=school?(homeForUniform[actor.pose]||uniform[actor.pose]||actor.pose):
          civilianByDefault?(civilian[actor.pose]||actor.pose):
          uniform[actor.pose]||actor.pose;
      }
    }
    if(step.type!=='MANGA')continue;
    if(pauses.has(step.title))step.holdAfter=true;
    for(const side of ['left','right']){
      const id=step.characters?.[side],key=side+'Pose',actor=cast.find(a=>a.id===id);
      for(const page of step.pages||[]){
        const pose=page[key];
        if(closingTime&&id==='arkonDen')page[key]={ginzaSuit:'storyIdle',
          devBlushing:'storyBlushing',devNervous:'storySheepish'}[pose]||pose;
        if(id==='arkonDen'&&actor?.pose==='ginzaSuit')page[key]=suited[page[key]]||page[key];
        else if(id==='arkonDen'&&String(actor?.pose).startsWith('storyMechanic')&&
          !String(pose).startsWith('storyMechanic'))page[key]='storyMechanic';
        if(id!=='sayakaFujieda')continue;
        if(closingTime&&page[key]==='ginzaDress')page[key]='homeNormal';
        const school=script.id==='arkonChapter01Revised'||
          script.id==='arkonChapter01'||script.id==='arkonChapter02'&&atSchool;
        if(actor?.pose==='ginzaDress'&&script.id!=='arkonChapter08'){
          page[key]='ginzaDress';
        }else if(school){
          page[key]=homeForUniform[page[key]]||uniform[page[key]]||page[key];
        }else if(civilianByDefault||
          String(actor?.pose).startsWith('home')){
          page[key]=civilian[page[key]]||page[key];
        }else if(String(actor?.pose).startsWith('oshiage')&&
          String(page[key]).startsWith('home')){
          page[key]=homeForUniform[page[key]]||page[key];
        }else page[key]=uniform[page[key]]||page[key];
      }
    }
  }
  return script;
}
