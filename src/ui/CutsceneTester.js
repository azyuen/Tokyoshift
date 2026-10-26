// R693 — D) SCENES is a MICRO-SCENE TESTER, not a duplicate Story Archive.
// The only major-chapter shortcut retained is the requested fully playable
// Chapter 09 sponsor regression, for developers with old Pro Season saves.
import { characters } from '../data/characters.js?v=20261024-r680';
import { CUTSCENES } from '../data/cutscenes.js?v=20261027-r693';
import { playMangaCutscene, sceneCutsceneActive } from './MangaCutscene.js?v=20261027-r693';
import { beginProSponsorPlayableReplay } from './ProSponsorReplay.js?v=20261027-r693';

const FONT='"Silkscreen",monospace';
const BODY='"Rajdhani",monospace';
const DEPTH=820;
const PAGE_SIZE=5;

// Explicit active micro-scenes. Old chapter constituent pages, duplicate
// invitations and retired demonstrations remain in CUTSCENES for save/backward
// compatibility, but no longer clutter the developer picker.
export const ACTIVE_DEV_MICRO_SCENES=Object.freeze([
  'oshiageInstructorFirstEncounter',
  'tunerTeamCallout',
  'regionalCrewIntroduction',
  'crewRecruitmentInvite',
  'crewRecruitmentJoin',
  'crewRecruitmentAnswer',
  'tunerShopDiscovery',
  'regionalChampionVictory',
  'regionalPerfectVictory',
  'specialChallengerIntroduction',
  'specialChallengerWin',
  'specialChallengerLoss',
  'firstPinkSlipChallenge',
  'firstPinkSlipWin',
  'firstPinkSlipLoss',
  'proCircuitStrategistReveal',
  'chapter09SeasonRegistration',
]);
export function getDevCutsceneEntries(){
  return [
    {id:'__proSponsorChapter09',label:'CHAPTER 09 // ARUKEN SPONSORSHIP',
      detail:'FULL PLAYABLE REPLAY // LIVE 240Z RACE // RESTORES YOUR SAVE',
      category:'DEVELOPER / REPLAY',
      definition:{title:'CHAPTER 09 // GINZA BACKING',pages:[]}},
    ...ACTIVE_DEV_MICRO_SCENES.filter(id=>CUTSCENES[id]).map(id=>({
      id,category:'ACTIVE / MICRO-SCENE',definition:CUTSCENES[id],
    })),
  ];
}
function characterLabel(scene,definition,side){
  const raw=definition.characters?.[side];
  if(raw==='$PLAYER') {
    const id=scene.registry.get('playerCharacterId')||'renMizuno';
    return characters[id]?.name||id;
  }
  return characters[raw]?.name||raw||'—';
}
function destroyAll(list){list.splice(0).forEach(x=>x?.destroy?.());}

export function addDevCutsceneButton(scene,x=840,y=35,options={}){
  if(!scene?.registry?.get('devMode'))return null;
  const depth=Number(options.depth||43);
  const button=scene.add.rectangle(x,y,166,38,0x15131c,1)
    .setStrokeStyle(1,0xff72a6,.95).setDepth(depth)
    .setScrollFactor(0).setInteractive({useHandCursor:true});
  const label=scene.add.text(x,y,'D) SCENES',{
    fontFamily:FONT,fontSize:'6px',color:'#ffc0d6',
  }).setOrigin(.5).setDepth(depth+1).setScrollFactor(0);
  button.on('pointerover',()=>button.setStrokeStyle(2,0xff9fc1));
  button.on('pointerout',()=>button.setStrokeStyle(1,0xff72a6));
  button.on('pointerdown',()=>{
    if(!sceneCutsceneActive(scene))showCutsceneTester(scene);
  });
  const api={
    button,label,
    setVisible(value){
      button.setVisible(Boolean(value));label.setVisible(Boolean(value));
      if(value)button.setInteractive({useHandCursor:true});
      else button.disableInteractive();
      return api;
    },
    destroy(){button.destroy();label.destroy();},
  };
  return api;
}

export function showCutsceneTester(scene){
  if(!scene?.registry?.get('devMode') ||
     scene._cutsceneTesterObjects?.length || sceneCutsceneActive(scene))return;
  const w=Number(scene.scale.width||1560),h=Number(scene.scale.height||720);
  const objects=[],rows=[];
  const add=o=>{objects.push(o);return o;};
  const addRow=o=>{objects.push(o);rows.push(o);return o;};
  let page=0;
  const close=()=>{destroyAll(objects);scene._cutsceneTesterObjects=[];};
  scene._cutsceneTesterObjects=objects;
  add(scene.add.rectangle(w/2,h/2,w,h,0x000000,.78)
    .setDepth(DEPTH).setScrollFactor(0).setInteractive());
  add(scene.add.rectangle(w/2,h/2,Math.min(1050,w-70),Math.min(650,h-54),0x091421,.99)
    .setStrokeStyle(3,0xff72a6).setDepth(DEPTH+1).setScrollFactor(0));
  add(scene.add.text(w/2-452,h/2-282,'D) SCENES // MICRO TESTER',{
    fontFamily:FONT,fontSize:'14px',color:'#fff4f8',
  }).setDepth(DEPTH+2).setScrollFactor(0));
  add(scene.add.text(w/2-452,h/2-248,
    'LIVE MICRO CUTSCENES ONLY // CHAPTER 09 FULL RACE TEST AT TOP',{
      fontFamily:BODY,fontSize:'13px',fontStyle:'700',color:'#ffc0d6',
    }).setDepth(DEPTH+2).setScrollFactor(0));
  const exit=add(scene.add.rectangle(w/2+427,h/2-277,118,38,0x152538,.98)
    .setStrokeStyle(2,0x7895a6).setDepth(DEPTH+3)
    .setScrollFactor(0).setInteractive({useHandCursor:true}));
  add(scene.add.text(w/2+427,h/2-277,'CLOSE',{
    fontFamily:FONT,fontSize:'8px',color:'#ffffff',
  }).setOrigin(.5).setDepth(DEPTH+4).setScrollFactor(0));
  exit.on('pointerdown',close);
  const footer=h/2+267;
  const previous=add(scene.add.rectangle(w/2-266,footer,155,43,0x131e2c,.99)
    .setStrokeStyle(2,0x678b9d).setDepth(DEPTH+3)
    .setScrollFactor(0).setInteractive({useHandCursor:true}));
  add(scene.add.text(w/2-266,footer,'< PREV',{
    fontFamily:FONT,fontSize:'8px',color:'#e8f5fb',
  }).setOrigin(.5).setDepth(DEPTH+4).setScrollFactor(0));
  const next=add(scene.add.rectangle(w/2+266,footer,155,43,0x131e2c,.99)
    .setStrokeStyle(2,0x678b9d).setDepth(DEPTH+3)
    .setScrollFactor(0).setInteractive({useHandCursor:true}));
  add(scene.add.text(w/2+266,footer,'NEXT >',{
    fontFamily:FONT,fontSize:'8px',color:'#e8f5fb',
  }).setOrigin(.5).setDepth(DEPTH+4).setScrollFactor(0));
  const counter=add(scene.add.text(w/2,footer,'',{
    fontFamily:FONT,fontSize:'7px',color:'#9cb6c7',
  }).setOrigin(.5).setDepth(DEPTH+4).setScrollFactor(0));
  const showError=message=>{
    const note=scene.add.text(w/2,h/2+190,message,{
      fontFamily:FONT,fontSize:'9px',color:'#ffbaca',
      backgroundColor:'#112033',padding:{x:12,y:9},
    }).setOrigin(.5).setDepth(DEPTH+20).setScrollFactor(0);
    scene.time.delayedCall(4000,()=>note?.destroy?.());
  };
  const render=()=>{
    while(rows.length){const o=rows.pop();const j=objects.indexOf(o);
      if(j>=0)objects.splice(j,1);o?.destroy?.();}
    const entries=getDevCutsceneEntries();
    const last=Math.max(0,Math.ceil(entries.length/PAGE_SIZE)-1);
    page=Math.max(0,Math.min(last,page));
    previous.setAlpha(page?1:.35);next.setAlpha(page<last?1:.35);
    counter.setText((page+1)+' / '+(last+1)+' // '+entries.length+' ENTRIES');
    for(const [i,entry] of entries.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE).entries()){
      const y=h/2-162+i*85;
      const primary=entry.id==='__proSponsorChapter09';
      const row=addRow(scene.add.rectangle(w/2,y,902,77,primary?0x263044:0x12202c,.99)
        .setStrokeStyle(2,primary?0xf4ad76:0x54778c)
        .setDepth(DEPTH+2).setScrollFactor(0)
        .setInteractive({useHandCursor:true}));
      addRow(scene.add.text(w/2-427,y-22,
        String(entry.label||entry.definition.testerLabel||entry.definition.title||entry.id).toUpperCase(),{
          fontFamily:FONT,fontSize:'8px',color:'#ffffff',
          wordWrap:{width:750,useAdvancedWrap:true},
        }).setDepth(DEPTH+3).setScrollFactor(0));
      const d=entry.definition;
      addRow(scene.add.text(w/2-427,y+10,primary?entry.detail:
        (entry.category+' // '+d.pages.length+' PAGES // '+
         characterLabel(scene,d,'left')+' / '+characterLabel(scene,d,'right')),{
          fontFamily:BODY,fontSize:'12px',fontStyle:'700',color:'#a8c4d6',
          wordWrap:{width:710},
        }).setDepth(DEPTH+3).setScrollFactor(0));
      addRow(scene.add.text(w/2+423,y,primary?'PLAY RACE >':'PREVIEW >',{
        fontFamily:FONT,fontSize:'7px',color:primary?'#ffe0aa':'#ffb0ce',
      }).setOrigin(1,.5).setDepth(DEPTH+3).setScrollFactor(0));
      row.on('pointerdown',()=>{
        row.disableInteractive();
        window.setTimeout(()=>{
          // Start full replay in the same way as the Story Archive.
          if(primary){
            const started=beginProSponsorPlayableReplay(scene,{returnToArchive:false});
            if(started)close();
            else {row.setInteractive({useHandCursor:true});
              showError('A DRIVEABLE OWNED CAR IS NEEDED');}
          }else{
            close();
            playMangaCutscene(scene,entry.id,{preview:true,preloadPagePosesOnly:true});
          }
        },0);
      });
    }
  };
  previous.on('pointerdown',()=>{if(page>0){page--;render();}});
  next.on('pointerdown',()=>{if(page+1<Math.ceil(getDevCutsceneEntries().length/PAGE_SIZE)){page++;render();}});
  render();
}
