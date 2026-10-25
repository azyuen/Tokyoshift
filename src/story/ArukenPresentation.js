// Presentation only: preserve every step index, choice, action and dialogue word.
const pauses=new Set(['AN OLD DATSUN','THE DAY SHE NEEDED A FRIEND',
  'A SIGNATURE HE WILL NOT GIVE','THE PART SHE STILL MISSES','THE KEYS',
  'ANOTHER TIME','THE SIGNATURE','THE QUESTION','ONE LAST DOCUMENT','A RARE MOMENT OF DOUBT']);
const suited={storyLaughing:'devLaughing',storySerious:'devSerious',storyThinking:'devNervous',
  storySheepish:'devNervous',storyBlushing:'devBlushing',storyCoolShy:'devBlushing',
  storyTalking:'devTalking',storyIdle:'devIdle'};
// These Oshiage-named images actually show a white blouse, not the navy uniform.
const uniform={oshiageConfident:'oshiageHappy',oshiageContemplative:'oshiageReviewing',
  oshiageExplaining:'oshiageTalking',oshiageAlert:'oshiageConcerned'};
export function polishArukenPresentation(script){
  let cast=[];
  for(const [index,step] of script.steps.entries()){
    if(step.type==='STAGE'){
      cast=step.characters||[];
      const label=script.steps[index+1]?.label||'';
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
      if(script.id==='arkonChapter10'&&step.backgroundId==='central:ginzaMotorGallery:night')
        step.population='gallery';
      for(const actor of cast)actor.pose=uniform[actor.pose]||actor.pose;
    }
    if(step.type!=='MANGA')continue;
    if(pauses.has(step.title))step.holdAfter=true;
    for(const side of ['left','right']){
      const id=step.characters?.[side],key=side+'Pose',actor=cast.find(a=>a.id===id);
      for(const page of step.pages||[]){
        const pose=page[key];
        if(id==='arkonDen'&&actor?.pose==='ginzaSuit')page[key]=suited[pose]||pose;
        else if(id==='arkonDen'&&String(actor?.pose).startsWith('storyMechanic')&&
          !String(pose).startsWith('storyMechanic'))page[key]='storyMechanic';
        if(id==='sayakaFujieda'){
          page[key]=uniform[page[key]]||page[key];
          if(actor?.pose==='ginzaDress')page[key]='ginzaDress';
          else if(String(actor?.pose).startsWith('home')&&String(page[key]).startsWith('oshiage'))
            page[key]=/Happy|Relaxed|Confident/.test(page[key])?'homeHappy':
              /Serious|Concerned|Reviewing/.test(page[key])?'homeSerious':'homeNormal';
          else if(String(actor?.pose).startsWith('oshiage')&&String(page[key]).startsWith('home'))
            page[key]=/Happy|Blushing/.test(page[key])?'oshiageHappy':
              /Serious|Sad/.test(page[key])?'oshiageConcerned':'oshiageNeutral';
        }
      }
    }
  }
  return script;
}
