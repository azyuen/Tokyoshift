// R644 — one NON-DESTRUCTIVE story/cinematic catalog over the existing asset owners.
// No image paths are moved, and gameplay scenes keep loading their own art.
// "provisional" means geometrical estimates, NOT image-measured perspective.
import { ALL_MEET_LOCATION_IDS, getMeetBackgroundForPhase } from './meetAssets.js?v=20261004-r322';
import { WORKSHOP_TIERS } from './workshopProgression.js?v=20261005-r354';
import { CENTRAL_TOKYO_LOCATIONS } from './centralTokyo.js?v=20261018-r588';
import { TUNER_SHOPS } from './tunerShops.js?v=20261011-r479';
import { resolveDragstripVenue } from './dragstripVenue.js?v=20261009-r455';

export const CINEMATIC_FAMILIES = Object.freeze(['location','interior','road']);
export const CINEMATIC_FRAMES = Object.freeze({
  full:Object.freeze({x:0,y:0,w:1560,h:840}),
  location:Object.freeze({x:24,y:92,w:1138,h:528}),
  workshop:Object.freeze({x:24,y:92,w:1138,h:528}),
  tuner:Object.freeze({x:24,y:92,w:1138,h:724}),
  road:Object.freeze({x:0,y:0,w:1560,h:720}),
});

// Perspective profile values are PROVISIONAL family defaults. They do not
// assert all artist-painted vanishing points are identical. A visual
// calibration pass can override values by background ID later.
export const CINEMATIC_PROJECTION_DEFAULTS = Object.freeze({
  location:Object.freeze({
    model:'ground-perspective',horizon:.40,near:.94,reference:.76,
    gamma:1, minFactor:.16,maxFactor:1.62,
    referenceCarWidth:.68,referenceCharacterHeight:.59,vanishingX:.50,
  }),
  interior:Object.freeze({
    model:'ground-perspective',horizon:.34,near:.95,reference:.78,
    gamma:.90,minFactor:.23,maxFactor:1.55,
    referenceCarWidth:.64,referenceCharacterHeight:.60,vanishingX:.50,
  }),
  road:Object.freeze({
    // Side-on moving race backgrounds are orthographic: skyline/roadside
    // already provide depth through parallax. Scaling race cars by screen Y
    // would be physically and visually incorrect.
    model:'orthographic',horizon:null,near:.91,reference:.72,
    gamma:1,minFactor:1,maxFactor:1,
    referenceCarWidth:.46,referenceCharacterHeight:.51,vanishingX:.50,
  }),
});

const phases=['day','night'];
const profile=(id,family,scene,asset,{label=id,phase=null,
  frame='location',fit='cover',projection={},calibration='provisional',
  layered=false,layers=null,variant=null}={})=>{
  if(!CINEMATIC_FAMILIES.includes(family))throw new Error('Invalid background family '+family);
  const base=CINEMATIC_PROJECTION_DEFAULTS[family];
  return Object.freeze({id,family,scene,label,phase,variant,asset,
    layered,layers,frame:CINEMATIC_FRAMES[frame],frameId:frame,fit,
    projection:Object.freeze({...base,...projection}),
    calibration,
  });
};
const entries=[];
const add=(...args)=>entries.push(profile(...args));

// 21 Meet venues × two existing assets. Own source: meetAssets.js.
for(const id of ALL_MEET_LOCATION_IDS) for(const phase of phases) {
  const bg=getMeetBackgroundForPhase(id,phase);
  if(bg)add('meet:'+id+':'+phase,'location','MeetScene',
    {key:bg.key,path:bg.path},{label:bg.label,phase,frame:'location'});
}

// The three real workshops and their office variants.
for(const workshop of WORKSHOP_TIERS){
  for(const phase of phases){
    const bg=workshop.phaseBackgrounds[phase];
    add('workshop:'+workshop.id+':'+phase,'interior','GarageScene',
      bg,{label:workshop.label,phase,frame:'workshop',
      fit:workshop.tier===0?'zoom-cover':'bottom-cover'});
  }
  add('office:'+workshop.id,'interior','GarageScene',{
    key:'storyOffice_'+workshop.id,
    path:'assets/Garage/'+({
      shinonomeWorkshop:'shinonome_workshop_office.png',
      shinonomeCanalYard:'shinonome_canalyard_office.png',
      shinonomeWarehouseStrip:'shinonome_warehouse_office.png',
    })[workshop.id],
  },{label:workshop.label+' OFFICE',frame:'full',fit:'contain'});
}
for(const phase of phases) {
  add('crewspace:'+phase,'interior','GarageScene',
    {key:'storyCrewSpace_'+phase,path:'assets/Garage/shinonome_crewspace_'+phase+'.png'},
    {label:'CREW SPACE',phase,frame:'workshop',fit:'bottom-cover'});
  add('dyno:'+phase,'interior','DynoScene',
    {key:'storyDyno_'+phase,path:'assets/Garage/shinonome_dyno_'+phase+'.png'},
    {label:'DYNO',phase,frame:'full'});
}

// Source: centralTokyo.js, preserving Auto Market's "contain" crop.
for(const venue of Object.values(CENTRAL_TOKYO_LOCATIONS)){
  if(venue.kind==='autoMarket'){
    for(const [room,option] of Object.entries(venue.marketBackgrounds)){
      for(const phase of phases){
        const bg=option.phases?.[phase];
        if(bg)add('central:'+venue.id+':'+room+':'+phase,
          'interior','CentralTokyoScene',bg,{
            label:venue.label+' '+room.toUpperCase(),phase,variant:room,
            frame:'location',fit:'contain',
          });
      }
    }
  }else for(const phase of phases){
    const bg=venue.phaseBackgrounds?.[phase];
    if(!bg)continue;
    add('central:'+venue.id+':'+phase,
      venue.kind==='showroom'?'interior':'location',
      'CentralTokyoScene',bg,{
        label:venue.label,phase,frame:'location',fit:'cover',
      });
  }
}

// Ginza's third room is a single interior asset, shared across both phases.
add('ginza:private-vault','interior','CentralTokyoScene',
  {key:'storyGinzaPrivateVault',path:'assets/CentralTokyo/tokyo_ginza03.png'},
  {label:'GINZA PRIVATE VAULT',frame:'location',fit:'cover'});

// Eight tuner shops; own source: tunerShops.js.
for(const shop of Object.values(TUNER_SHOPS)) {
  if(!shop.enabled)continue;
  for(const phase of phases){
    const bg=shop.phaseBackgrounds?.[phase];
    if(bg)add('tuner:'+shop.id+':'+phase,'interior','TunerShopScene',
      bg,{label:shop.label,phase,frame:'tuner',fit:'bottom-cover'});
  }
}

// Oshiage stage backgrounds are represented by stems already used by
// OshiageScene.backgroundAsset(). The same paint/rims rooms reuse the shell.
const oshiage=[
  ['skytree01','location'],['skytree02','location'],
  ['shop','interior'],['school','interior'],['paint','interior'],
  ['wheels','interior'],
];
for(const [stem,family] of oshiage)for(const phase of phases){
  const key='storyOshiage_'+stem+'_'+phase;
  add('oshiage:'+stem+':'+phase,family,'OshiageScene',{
    key,path:'assets/Oshiage/oshiage_'+stem+'_'+phase+'.png',
  },{label:'OSHIAGE '+stem.toUpperCase(),phase,frame:'location',
     fit:stem==='wheels'?'top-fit':'cover'});
}

// Train station is a full-screen exterior establishment.
for(const phase of phases){
  add('train:station:'+phase,'location','TrainStationScene',{
    key:'storyTrainStation_'+phase,
    path:'assets/CentralTokyo/tokyo_trainstation_'+phase+'.png',
  },{label:'TOKYO TRAIN STATION',phase,frame:'full'});
  add('pro:registration:'+phase,'interior','CentralTokyoScene',{
    key:'storyProRegistration_'+phase,
    path:'assets/CentralTokyo/dragcomplex/regoroom_'+phase+'.png',
  },{label:'DRAG COMPLEX REGISTRATION',phase,frame:'full'});
  add('pro:registration-closeup:'+phase,'interior','CentralTokyoScene',{
    key:'storyProRegistrationClose_'+phase,
    path:'assets/CentralTokyo/dragcomplex/regozoomed_'+phase+'.png',
  },{label:'DRAG COMPLEX REGISTRATION CLOSE-UP',phase,frame:'full'});
}

// Road is a layered environment, not a flat background PNG. Mark clearly
// so cinematic STAGE cannot misuse a skyline as the whole road surface.
for(const district of ['DAIKOKU','ODAIBA','OSHIAGE','SHIBUYA',
  'SHINAGAWA','SHINJUKU','TATSUMI','YOKOHAMA'])for(const phase of phases){
  const format=['ODAIBA'].includes(district)?'webp':'webp';
  const skyline='assets/Race/Skylines/skyline_'+district.toLowerCase()+'_'+phase+'.'+format;
  add('road:'+district+':'+phase,'road','RaceScene',null,{
    label:district+' ROAD',phase,frame:'road',fit:'layered',
    layered:true,layers:[{role:'skyline',path:skyline,key:'storyRoad_'+district+'_'+phase},
      {role:'road',renderer:'TokyoExpresswayBackground'}],
  });
}
for(const crowd of ['low','half','full'])for(const phase of phases){
  const bg=resolveDragstripVenue({phase,crowdTier:crowd});
  add('pro:dragstrip:'+crowd+':'+phase,'road','FourLaneTestScene',null,{
    label:'TOKYO DRAG COMPLEX',phase,variant:crowd,frame:'road',
    fit:'layered',layered:true,layers:[bg.skyline,...Object.values(bg.sprites)],
  });
}

export const STORY_BACKGROUNDS=Object.freeze(
  Object.fromEntries(entries.map(item=>[item.id,item]))
);
export const ALL_STORY_BACKGROUND_IDS=Object.freeze(Object.keys(STORY_BACKGROUNDS));

export function getStoryBackground(id) {
  return STORY_BACKGROUNDS[String(id||'')] || null;
}
export function listStoryBackgrounds({family=null,scene=null,phase=null}={}) {
  return Object.values(STORY_BACKGROUNDS).filter(item=>
    (!family||item.family===family) &&
    (!scene||item.scene===scene) &&
    (!phase||item.phase===phase));
}
