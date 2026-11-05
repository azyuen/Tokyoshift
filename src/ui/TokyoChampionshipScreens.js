// Tokyo SHIFT — unified Championship Hub and three dedicated event briefings.
// Only presentation, navigation and one-use strategy notes live here.
// Authoritative scoring, car locks and race settlement remain in the existing modules.
import { championshipStandings, getChampionshipKnockoutHeat, getChampionshipCrewHeat,
  getChampionshipFourWideHeat, TOKYO_CHAMPIONSHIP_PURSES } from '../data/tokyoChampionship.js?v=20261030-r724';
import { normaliseProCircuitState } from '../data/proCircuit.js?v=20261030-r741';
import { getCrewSeriesUnits, getProSeasonDriverCarError } from '../data/proSeason.js?v=20261030-r741';
import { cars } from '../data/cars.js?v=20261026-r687';
import { characters, getCharacterVisualAsset, getCharacterAssetUrl } from '../data/characters.js?v=20261024-r680';
import { saveProTransaction } from '../state/GameState.js?v=20261030-r739';
import { PRO_GARAGE_ID } from '../data/workshopProgression.js?v=20261024-r675';

const W=1560, H=840;
const BODY='"Rajdhani", sans-serif', DISPLAY='"Exo 2", sans-serif', PIXEL='"Silkscreen", monospace';
const GOLD='#f4ca76', PALE='#eef1f5', MUTED='#b2c2d2', BLUE=0x52758e, RED=0xd64b5c;
const STAGES=['KNOCKOUT','CREW','FOUR_WIDE'];
const EVENTS={
  KNOCKOUT:{number:'01',title:'INDIVIDUAL KNOCKOUTS',short:'INDIVIDUAL',points:20,
    image:'tokyoChampKnockoutBg',path:'championship_knockouts.png'},
  CREW:{number:'02',title:'CREW BATTLES',short:'CREW BATTLES',points:20,
    image:'tokyoChampCrewBg',path:'championship_crewbattles.png'},
  FOUR_WIDE:{number:'03',title:'FOUR-WIDE FINALE',short:'FOUR-WIDE',points:40,
    image:'tokyoChampFourBg',path:'championship_fourwide.png'},
};
const HUB={image:'tokyoChampHubBg',path:'championship_hub.png'};
const bgPath=name=>'assets/CentralTokyo/dragcomplex/'+name+'?v=20261105-champ-ui';
const circuit=s=>normaliseProCircuitState(s.registry.get('proCircuit'));
const fmt=n=>Number(n||0).toLocaleString('en-US');
const closeSceneOverlay=s=>s._proOverlayClose?.();

function portraitAssets(s,stage){
  const out=[['champSayaka','assets/Characters/Main/race_sayaka_fujieda_idle.png'],
    ['champDaichi','assets/Characters/Main/pro_daichi_sakamoto.png']];
  const player=getCharacterVisualAsset(s.registry.get('playerCharacterId')||'renMizuno',
    'idle',{proCircuit:true});
  if(player?.key&&player.path)out.push([player.key,player.path]);
  if(stage==='CREW'){
    const members=getCrewSeriesUnits(s.registry).filter(u=>u.validAssignment).slice(0,3);
    for(const unit of members){
      const asset=getCharacterVisualAsset(unit.id,'idle',{proCircuit:true,
        playerCharacterId:s.registry.get('playerCharacterId')||'renMizuno'});
      if(asset?.key&&asset.path)out.push([asset.key,asset.path]);
    }
  }
  return out;
}
function loadAssets(s,view,done){
  const stage=EVENTS[view]?view:null;
  const item=stage?EVENTS[stage]:HUB;
  const images=[[item.image,bgPath(item.path)],...portraitAssets(s,stage).map(([k,p])=>[k,getCharacterAssetUrl(p)])];
  let queued=0;
  for(const [key,path] of images)if(!s.textures.exists(key)){
    s.load.image(key,path);queued++;
  }
  if(!queued)return false;
  closeSceneOverlay(s);
  if(s._tokyoChampLoading)return true;
  s._tokyoChampLoading=true;
  const backdrop=s.add.rectangle(W/2,H/2,W,H,0x0b1421,1).setDepth(290).setInteractive();
  const loading=s.add.text(W/2,H/2,'PREPARING TOKYO CHAMPIONSHIP',{
    fontFamily:DISPLAY,fontSize:'27px',fontStyle:'italic 900',color:PALE,
  }).setOrigin(.5).setDepth(291);
  let gone=false;
  const clear=()=>{if(gone)return;gone=true;backdrop.destroy();loading.destroy();s._tokyoChampLoading=false;
    s.events.off('shutdown',clear);};
  const finish=()=>{clear();if(s.sys?.isActive?.())done();};
  s.events.once('shutdown',clear);
  s.load.once('complete',finish);
  s.load.start();
  return true;
}
function canvas(s,view){
  closeSceneOverlay(s);
  const nodes=[];
  let closed=false;
  const add=node=>{nodes.push(node);return node;};
  const close=()=>{if(closed)return;closed=true;
    nodes.forEach(n=>n?.destroy?.());
    if(s._proOverlayClose===close)s._proOverlayClose=null;
    s.events.off('shutdown',close);
  };
  s._proOverlayClose=close;s.events.once('shutdown',close);
  const item=EVENTS[view]||HUB;
  add(s.add.rectangle(W/2,H/2,W,H,0x080d17,1).setDepth(200).setInteractive());
  if(s.textures.exists(item.image)){
    const src=s.textures.get(item.image).getSourceImage();
    const scale=Math.max(W/src.width,H/src.height);
    add(s.add.image(W/2,H/2,item.image).setScale(scale).setDepth(201));
  }
  // Readable chrome without obscuring the room or character sprites.
  add(s.add.rectangle(W/2,32,W,64,0x08111f,.90).setDepth(204));
  const label=(x,y,value,size=20,color=PALE,extra={})=>
    add(s.add.text(x,y,String(value),{fontFamily:extra.font||BODY,
      fontSize:size+'px',fontStyle:extra.bold===false?'500':'700',color,
      wordWrap:extra.width?{width:extra.width}:undefined,
      stroke:extra.stroke?'#07101c':undefined,strokeThickness:extra.stroke?3:0,
      lineSpacing:3}).setFontSize(size).setDepth(extra.depth||231));
  const headline=(x,y,value,size=37,color=PALE,width=1000)=>{
    const node=label(x,y,value,size,color,{font:DISPLAY,stroke:true});
    node.setFontStyle('900 italic');
    if(node.width>width)node.setScale(width/node.width);
    return node;
  };
  const panel=(x,y,w,h,opacity=.91,line=0x5a7185)=>{
    const node=add(s.add.rectangle(x,y,w,h,0x0b1727,opacity)
      .setStrokeStyle(2,line,.95).setDepth(220));
    return node;
  };
  const button=(cx,cy,w,h,caption,action,{red=false,disabled=false}={})=>{
    const node=add(s.add.rectangle(cx,cy,w,h,disabled?0x263039:red?0x8d2636:0x1c3248,.98)
      .setStrokeStyle(2,disabled?0x58606a:red?0xf17883:0x9bb1c4,.95).setDepth(241));
    const txt=label(cx,cy,caption,Math.min(20,h*.4),disabled?'#8f9cac':PALE,
      {font:DISPLAY,depth:242}).setOrigin(.5);
    txt.setFontStyle('900 italic');
    if(txt.width>w-18)txt.setScale((w-18)/txt.width);
    if(!disabled)node.setInteractive({useHandCursor:true})
      .on('pointerdown',()=>{if(!closed)action();});
    return node;
  };
  label(32,10,'TOKYO SHIFT  /  TOKYO CHAMPIONSHIP',20,PALE,{font:DISPLAY,depth:235});
  label(1362,12,'SEASON '+circuit(s).season,18,GOLD,{font:DISPLAY,depth:235});
  button(1510,31,64,43,'X',close);
  return {add,close,label,headline,panel,button};
}
function sprite(s,o,key,x,feet,maxHeight=410,maxWidth=245,flip=false){
  if(!key||!s.textures.exists(key))return;
  const image=s.textures.get(key).getSourceImage();
  const scale=Math.min(maxHeight/image.height,maxWidth/image.width);
  o.add(s.add.ellipse(x,feet-9,maxWidth*.57,22,0x020711,.47).setDepth(207));
  o.add(s.add.image(x,feet,key).setOrigin(.5,1).setScale(scale)
    .setFlipX(flip).setDepth(210));
}
function mainSprites(s,o,view){
  const player=getCharacterVisualAsset(s.registry.get('playerCharacterId')||'renMizuno',
    'idle',{proCircuit:true});
  if(view==='HUB'){
    sprite(s,o,player?.key,568,581,380,220);
    sprite(s,o,'champSayaka',788,582,390,220);
    sprite(s,o,'champDaichi',1012,584,385,225);
  }else if(view==='CREW'){
    sprite(s,o,'champSayaka',175,622,420,240);
    sprite(s,o,'champDaichi',396,623,417,242);
    const units=getCrewSeriesUnits(s.registry).filter(u=>u.validAssignment).slice(0,3);
    units.forEach((unit,i)=>{
      const a=getCharacterVisualAsset(unit.id,'idle',{proCircuit:true,
        playerCharacterId:s.registry.get('playerCharacterId')||'renMizuno'});
      sprite(s,o,a?.key,630+i*155,636,308,154);
    });
  }else{
    sprite(s,o,'champSayaka',198,625,440,246);
    sprite(s,o,player?.key,447,627,438,260);
    sprite(s,o,'champDaichi',698,628,420,241);
  }
}
function standingName(c,row){
  return row.id==='player:driver'?'YOU':row.name||characters[row.characterId]?.name||row.id;
}
function panelTitle(o,x,y,value){o.headline(x,y,value,23,GOLD);}
function scoreBar(s,o,x,y,w,current,max){
  o.add(s.add.rectangle(x+w/2,y,w,12,0x304154,1).setDepth(233));
  if(current>0)o.add(s.add.rectangle(x,y,Math.min(1,current/max)*w,12,0xd3a255,1)
    .setOrigin(0,.5).setDepth(234));
}
function heatFor(state){
  return state.stage==='KNOCKOUT'?getChampionshipKnockoutHeat(state):
    state.stage==='CREW'?getChampionshipCrewHeat(state):
    state.stage==='FOUR_WIDE'?getChampionshipFourWideHeat(state):null;
}
function statusFor(state,stage){
  const i=STAGES.indexOf(stage),current=STAGES.indexOf(state.stage);
  return state.completed||current>i?'COMPLETE':current<i?'LOCKED':'ACTIVE';
}
function getEventAdvice(state,stage){
  const next=stage===state.stage?heatFor(state):null;
  if(stage==='KNOCKOUT'){
    return 'This is a knockout. '+(next?.opponent?.name||'Your opponent')+
      ' will punish a poor launch. Prioritise consistency and clean shifts; one mistake can end this stage.';
  }
  if(stage==='CREW')return 'Three separate crew cars, three different heats. Choose strong launch setups and keep each run controlled. Every heat won adds to our points.';
  return 'Four lanes magnify every launch error. Keep the championship car predictable under pressure: a strong qualifying place can take you into the final.';
}
function advicePanel(s,o,state,stage,x,y,w){
  o.panel(x+w/2,y+57,w,115,.93,0xb68a55);
  o.label(x+13,y+10,'SAYAKA  //  EVENT STRATEGY',19,GOLD);
  const saved=state.adviceByEvent?.[stage];
  if(saved){
    o.label(x+13,y+38,saved,17,PALE,{width:w-27});
  }else if(stage===state.stage&&!state.completed){
    o.label(x+13,y+39,'One strategy consultation is available for this major event.',17,MUTED,{width:w-25});
    o.button(x+w-125,y+86,230,36,'ASK SAYAKA  /  1 USE',()=>{
      const c=circuit(s),active=c.activeChampionship;
      if(!active||active.id!==state.id||active.stage!==stage||
        active.adviceByEvent?.[stage])return;
      const note=getEventAdvice(active,stage);
      const updated={...active,adviceByEvent:{...(active.adviceByEvent||{}),[stage]:note}};
      try{saveProTransaction(s.registry,{proCircuit:{...c,activeChampionship:updated}});
        showTokyoChampionshipScreens(s,{view:stage,actions:o.actions});
      }catch(error){s.proError=error.message;showTokyoChampionshipScreens(s,{view:stage,actions:o.actions});}
    });
  }else o.label(x+13,y+44,'Event consultation unavailable after completion.',17,MUTED);
}
function showHub(s,actions){
  const c=circuit(s),state=c.activeChampionship,rows=championshipStandings(state);
  const me=rows.find(r=>r.id==='player:driver'),place=rows.indexOf(me)+1;
  const current=state.stage==='COMPLETE'?'COMPLETE':state.stage;
  const o=canvas(s,'HUB');o.actions=actions;
  mainSprites(s,o,'HUB');
  o.headline(44,88,'TOKYO CHAMPIONSHIP',43,GOLD);
  o.label(45,145,'SINGLE TITLE  //  16 DRIVERS  //  THREE MAJOR EVENTS',19,PALE);
  o.panel(237,325,416,310);
  panelTitle(o,50,182,'LIVE CHAMPIONSHIP STANDINGS');
  const shortlist=rows.slice(0,5);
  if(place>5)shortlist.push(me);
  shortlist.forEach((row,i)=>{
    const y=220+i*38;
    const own=row.id==='player:driver';
    o.label(56,y,'#'+(rows.indexOf(row)+1),19,own?GOLD:PALE);
    o.label(112,y,standingName(c,row).slice(0,19),19,own?GOLD:PALE);
    o.label(402,y,row.total+' PTS',19,own?GOLD:MUTED).setOrigin(1,0);
    const hit=o.add(s.add.rectangle(237,y+12,386,34,0,0)
      .setDepth(243).setInteractive({useHandCursor:true}));
    hit.on('pointerdown',()=>showTokyoChampionshipScreens(s,{view:'PROFILE',driverId:row.id,actions}));
  });
  o.button(237,450,363,37,'ALL 16 DRIVERS / FULL STANDINGS',()=>showTokyoChampionshipScreens(s,{view:'STANDINGS',actions}));
  o.panel(1334,317,382,292);
  panelTitle(o,1165,183,'YOUR CHAMPIONSHIP');
  o.headline(1165,220,'STANDING  #'+place,31,GOLD,330);
  o.label(1165,277,'CHAMPIONSHIP POINTS  '+me.total+' / 80',19,PALE);
  scoreBar(s,o,1165,315,323,me.total,80);
  o.label(1165,346,'KO '+me.knockout+'  /  CREW '+me.crew+'  /  FOUR-WIDE '+me.fourWide,18,MUTED);
  o.label(1165,383,state.completed?'CHAMPION: '+standingName(c,rows[0]):
    'LEADER: '+standingName(c,rows[0])+'  /  '+rows[0].total+' PTS',17,GOLD,{width:320});
  o.label(1165,423,'POTENTIAL POINTS REMAINING: '+(
    state.stage==='KNOCKOUT'?80:state.stage==='CREW'?60:
      state.stage==='FOUR_WIDE'?40:0),16,MUTED,{width:330});
  o.panel(783,652,1510,213,.91,0x58677a);
  panelTitle(o,55,555,'CHAMPIONSHIP EVENTS');
  STAGES.forEach((stage,i)=>{
    const item=EVENTS[stage],x=46+i*511,st=statusFor(state,stage);
    const color=st==='ACTIVE'?0xb68a55:st==='COMPLETE'?0x477b6a:0x566777;
    o.panel(x+239,673,480,116,.96,color);
    o.headline(x+18,622,item.number+'  '+item.short,25,st==='LOCKED'?MUTED:PALE,440);
    o.label(x+19,665,st==='ACTIVE'?'CURRENT EVENT':st,17,st==='ACTIVE'?GOLD:MUTED);
    const earned=me[stage==='KNOCKOUT'?'knockout':stage==='CREW'?'crew':'fourWide'];
    o.label(x+19,701,earned+' / '+item.points+' POINTS',18,GOLD);
    o.button(x+375,712,167,37,st==='ACTIVE'?'ENTER EVENT':st==='COMPLETE'?'VIEW RESULTS':'PREVIEW',
      ()=>showTokyoChampionshipScreens(s,{view:stage,actions}),{red:st==='ACTIVE'});
  });
  o.button(210,793,336,49,'RIVAL PROFILES',()=>showTokyoChampionshipScreens(s,{view:'STANDINGS',actions}));
  o.button(548,793,310,49,'CHAMPIONSHIP RULES',()=>showTokyoChampionshipScreens(s,{view:'RULES',actions}));
  if(state.completed){
    const rank=place-1;
    o.button(1233,793,568,49,'FINAL RESULTS  /  ¥'+fmt(TOKYO_CHAMPIONSHIP_PURSES[rank]),
      ()=>showTokyoChampionshipScreens(s,{view:'RESULT',actions}),{red:true});
  }else o.button(1255,793,510,49,'ENTER EVENT '+EVENTS[current].number,
    ()=>showTokyoChampionshipScreens(s,{view:current,actions}),{red:true});
}
function eventInfo(s,o,state,stage){
  const x=1015,w=500;
  if(stage==='KNOCKOUT'){
    panelTitle(o,x,164,'16-DRIVER KNOCKOUT BRACKET');
    const bySeed=[...state.entrants].sort((a,b)=>a.seed-b.seed);
    const first=state.knockout?.bracket?.[0]||[];
    const pairs=first.length===8?first:
      Array.from({length:8},(_,i)=>[bySeed[i*2]?.id,bySeed[i*2+1]?.id]);
    const history=state.knockout?.results||[];
    pairs.forEach((pair,i)=>{
      const y=209+i*37;
      const names=pair.map(id=>{
        const row=bySeed.find(e=>e.id===id);
        return row?.id==='player:driver'?'YOU':row?.name||'RIVAL';
      });
      o.label(x+8,y,(i+1)+'.  '+names.map(n=>n.slice(0,13)).join('   VS   '),
        17,pair.includes('player:driver')?GOLD:PALE,{width:470});
    });
    o.label(x+12,537,'KNOCKOUT ROUNDS COMPLETE  '+history.length+' / 4',18,GOLD);
  }else if(stage==='CREW'){
    panelTitle(o,x,164,'CREW BATTLE BOARD');
    const next=stage===state.stage?getChampionshipCrewHeat(state):null;
    o.label(x+6,211,'OPPOSITION  '+(next?.opponent?.name||'FINAL RESULTS'),
      24,PALE,{width:480});
    const attempts=state.crew?.results||[];
    for(let i=0;i<3;i++){
      const result=attempts[i],y=276+i*62;
      o.panel(x+245,y+16,486,52,.95,result?(result.won?0x49765c:0x94505a):BLUE);
      o.label(x+17,y-1,'HEAT '+(i+1),20,GOLD);
      o.label(x+142,y-1,result?(result.won?'WIN  /  '+(cars[result.carId]?.shortName||result.carId):
        'LOSS  /  '+(cars[result.carId]?.shortName||result.carId)):'AWAITING RACE',
        18,PALE,{width:338});
    }
    o.label(x+12,507,'THREE DISTINCT CREW CARS  /  YOU DRIVE EACH HEAT',17,MUTED,{width:w});
    o.label(x+12,534,'CREW POINTS: 0 WINS = 3  /  1 = 8  /  2 = 14  /  3 = 20',17,GOLD,{width:w});
  }else{
    panelTitle(o,x,164,'FOUR-WIDE FINALS PROGRESSION');
    const current=state.fourWide?.results?.length||0;
    const labels=[['QUALIFYING','4 HEATS  /  TOP TWO ADVANCE'],
      ['SEMIFINALS','2 HEATS  /  TOP TWO ADVANCE'],['GRAND FINAL','4 DRIVERS  /  40 POINTS MAX']];
    labels.forEach(([name,detail],i)=>{
      const y=222+i*104;
      o.panel(x+245,y+25,486,89,.95,current===i&&state.stage===stage?0xb58a4e:BLUE);
      o.headline(x+17,y-3,'0'+(i+1)+'  '+name,23,i<=current?GOLD:PALE,461);
      o.label(x+22,y+37,detail,18,MUTED);
      o.label(x+22,y+60,i<current?'COMPLETE':i===current?'NEXT HEAT':'PENDING',16,i===current?GOLD:MUTED);
    });
  }
}
function showEvent(s,stage,actions){
  const c=circuit(s),state=c.activeChampionship;
  const active=state.stage===stage&&!state.completed,st=statusFor(state,stage),event=EVENTS[stage];
  const o=canvas(s,stage);o.actions=actions;
  mainSprites(s,o,stage);
  o.label(43,85,'TOKYO CHAMPIONSHIP  /  EVENT '+event.number,21,MUTED,{font:DISPLAY});
  o.headline(43,120,event.title,42,GOLD,907);
  o.label(44,171,(stage==='KNOCKOUT'?'ONE-ON-ONE ELIMINATION':
    stage==='CREW'?'THREE PLAYER-DRIVEN CREW HEATS':'QUALIFYING  /  SEMIFINAL  /  GRAND FINAL')+
    '   /   MAX '+event.points+' POINTS',19,PALE);
  o.panel(1255,363,552,450,.93,0x65798b);
  eventInfo(s,o,state,stage);
  // The event is a real area: full-body sprites occupy the foreground,
  // while the operational panels sit over the environmental background.
  advicePanel(s,o,state,stage,35,568,490);
  o.panel(777,637,433,136,.92,0x6f8091);
  panelTitle(o,577,582,'DAICHI  /  RACE PREPARATION');
  o.label(575,615,'Set up purchased parts at the appropriate paddock. '+
    'Existing car locks and event scrutineering still apply.',17,PALE,{width:401});
  const heat=active?heatFor(state):null;
  const position=championshipStandings(state).findIndex(r=>r.id==='player:driver')+1;
  o.label(43,721,'CHAMPIONSHIP STANDING #'+position+
    '   /   '+championshipStandings(state).find(r=>r.id==='player:driver')?.total+' PTS',
    21,GOLD,{width:522});
  const next=stage==='KNOCKOUT'?'ROUND '+((heat?.round||0)+1)+' / 4  VS  '+(heat?.opponent?.name||'—'):
    stage==='CREW'?'HEAT '+((heat?.index||0)+1)+' / 3  VS  '+(heat?.opponent?.name||'—'):
    ['QUALIFYING','SEMIFINAL','GRAND FINAL'][heat?.round||0];
  o.label(1015,566,active?'UP NEXT: '+next:st+' / EVENT STANDINGS SAVED',
    19,active?GOLD:MUTED,{width:500});
  if(s.proError)o.label(1015,600,String(s.proError).slice(0,84),18,'#ff9fa5',{width:490});
  o.button(163,794,278,49,'CHAMPIONSHIP HUB',
    ()=>showTokyoChampionshipScreens(s,{view:'HUB',actions}));
  o.button(468,794,280,49,'PRO PADDOCK',()=>openPaddock(s,state,'DRIVER'),{disabled:!active});
  o.button(750,794,271,49,'CREW PADDOCK',
    ()=>showPaddockCrewPicker(s,actions,[]),{disabled:!active});
  o.button(1254,794,492,49,active?'GO TO GRID  /  '+next:'RETURN TO HUB',()=>{
    if(!active)return showTokyoChampionshipScreens(s,{view:'HUB',actions});
    if(stage==='CREW')return showCarPicker(s,stage,actions);
    const carId=state.driverCarId||s._champSelectedDriverCar||
      s.registry.get('selectedCarId');
    const roster=c.registeredDriverCars;
    if(!state.driverCarId&&Array.isArray(roster)&&roster.length>1)
      return showCarPicker(s,stage,actions);
    if(!carId)return showCarPicker(s,stage,actions);
    if(!actions.startRace(stage==='KNOCKOUT'?'CHAMP_KO':'CHAMP_FOUR',carId)){
      showTokyoChampionshipScreens(s,{view:stage,actions});
    }
  },{red:active});
}
function showCarPicker(s,stage,actions){
  const c=circuit(s),state=c.activeChampionship;
  if(state.stage!==stage||state.completed)return showTokyoChampionshipScreens(s,{view:'HUB',actions});
  const o=canvas(s,stage);o.actions=actions;
  o.headline(95,106,'SELECT RACE CAR',42,GOLD);
  const crew=stage==='CREW';
  const heat=crew?getChampionshipCrewHeat(state):null;
  const used=new Set(heat?.usedCarIds||[]);
  const units=crew?getCrewSeriesUnits(s.registry).filter(u=>u.validAssignment&&!used.has(u.carId)):[];
  const owned=s.registry.get('ownedCarIds')||[];
  const roster=crew?units.map(u=>u.carId):
    (state.driverCarId?[state.driverCarId]:
      (Array.isArray(c.registeredDriverCars)?c.registeredDriverCars:owned))
        .filter(id=>owned.includes(id)&&cars[id]&&!getProSeasonDriverCarError(c,id));
  o.panel(780,438,1330,540,.94);
  o.label(103,179,crew?'SELECT A DIFFERENT RECRUITED CREW CAR FOR THIS HEAT':
    'CHOOSE ONE REGISTERED DRIVER CAR / LOCKED FOR KNOCKOUTS AND FOUR-WIDE',
    21,MUTED);
  if(!roster.length)o.label(110,320,'NO ELIGIBLE CAR AVAILABLE. RETURN TO DAICHI OR YOUR GARAGE.',23,'#ffacb2');
  roster.slice(0,7).forEach((id,i)=>{
    const x=425+(i%2)*680,y=265+Math.floor(i/2)*100;
    const unit=units.find(u=>u.carId===id);
    const name=(unit?unit.name+'  /  ':'')+(cars[id]?.shortName||id);
    o.button(x,y,615,64,name,()=>{
      const mode=crew?'CHAMP_CREW':stage==='KNOCKOUT'?'CHAMP_KO':'CHAMP_FOUR';
      if(!actions.startRace(mode,id))showCarPicker(s,stage,actions);
    },{red:i===0});
  });
  o.button(327,755,460,52,'BACK TO EVENT BRIEFING',
    ()=>showTokyoChampionshipScreens(s,{view:stage,actions}));
}
function openPaddock(s,state,type,crewIds=[],crewDrivers=[]){
  if(!state||state.completed)return;
  closeSceneOverlay(s);
  const previous=s.registry.get('workshopLocationId')||'shinonomeWarehouseStrip';
  s.scene.start('GarageScene',{
    proGarageMode:true,crewMode:false,
    ...(type==='CREW'?{crewProPaddockMode:true,crewProPaddockCars:crewIds,
      crewProPaddockDrivers:crewDrivers}:{}),
    workshopLocationId:PRO_GARAGE_ID,
    returnWorkshopId:previous===PRO_GARAGE_ID?'shinonomeWarehouseStrip':previous,
    proChampionshipReturn:{id:state.id,stage:state.stage},
  });
}
function showPaddockCrewPicker(s,actions,selected){
  const c=circuit(s),state=c.activeChampionship;
  if(!state||state.stage!=='CREW')return showTokyoChampionshipScreens(s,{view:state?.stage||'HUB',actions});
  const units=getCrewSeriesUnits(s.registry).filter(u=>u.validAssignment);
  const picked=[...selected];
  const o=canvas(s,'CREW');o.actions=actions;
  o.headline(78,102,'CREW PADDOCK  /  SELECT THREE CARS',37,GOLD,1390);
  o.label(80,171,'SELECT THREE DISTINCT RECRUITED CREW CARS TO PREPARE AT DAICHI.',21,MUTED);
  o.panel(780,410,1350,440,.94);
  units.slice(0,7).forEach((u,i)=>{
    const x=434+(i%2)*684,y=234+Math.floor(i/2)*85;
    o.button(x,y,625,53,(picked.includes(u.id)?'[SELECTED]  ':'')+
      u.name+'  /  '+(cars[u.carId]?.shortName||u.carId),()=>{
      const next=picked.includes(u.id)?picked.filter(id=>id!==u.id):
        picked.length<3?[...picked,u.id]:picked;
      showPaddockCrewPicker(s,actions,next);
    },{red:picked.includes(u.id)});
  });
  o.button(343,747,460,54,'BACK TO CREW BRIEFING',
    ()=>showTokyoChampionshipScreens(s,{view:'CREW',actions}));
  o.button(1125,747,570,54,'OPEN CREW PADDOCK  /  '+picked.length+' OF 3',()=>{
    const chosen=picked.map(id=>units.find(u=>u.id===id));
    if(chosen.length!==3||chosen.some(u=>!u))return;
    openPaddock(s,state,'CREW',chosen.map(u=>u.carId),picked);
  },{red:true,disabled:picked.length!==3});
}
function showStandings(s,actions){
  const c=circuit(s),state=c.activeChampionship,rows=championshipStandings(state);
  const o=canvas(s,'HUB');o.actions=actions;
  o.headline(57,102,'CHAMPIONSHIP STANDINGS  /  ALL 16',36,GOLD);
  o.panel(783,437,1490,576,.95);
  rows.forEach((r,i)=>{
    const x=i<8?57:800,y=190+(i%8)*63;
    o.label(x,y,'#'+(i+1),21,r.id==='player:driver'?GOLD:PALE);
    o.label(x+62,y,standingName(c,r).slice(0,20),21,r.id==='player:driver'?GOLD:PALE);
    o.label(x+350,y,'KO '+r.knockout+'   CR '+r.crew+'   4W '+r.fourWide,16,MUTED);
    o.label(x+620,y,r.total+' PTS',21,GOLD).setOrigin(1,0);
    const hit=o.add(s.add.rectangle(x+338,y+20,682,49,0,0).setDepth(245)
      .setInteractive({useHandCursor:true}));
    hit.on('pointerdown',()=>showTokyoChampionshipScreens(s,{view:'PROFILE',driverId:r.id,actions}));
  });
  o.button(781,783,480,51,'BACK TO CHAMPIONSHIP HUB',
    ()=>showTokyoChampionshipScreens(s,{view:'HUB',actions}));
}
function showProfile(s,id,actions){
  const c=circuit(s),state=c.activeChampionship,rows=championshipStandings(state);
  const r=rows.find(item=>item.id===id)||rows[0];
  const long=c.drivers?.[r.id]||null;
  const o=canvas(s,'HUB');o.actions=actions;
  o.headline(65,106,'DRIVER PROFILE  /  '+standingName(c,r),40,GOLD);
  o.panel(780,418,1320,540,.95);
  const fields=[
    ['CHAMPIONSHIP POSITION','#'+(rows.indexOf(r)+1)+' / 16'],
    ['CHAMPIONSHIP SEED','#'+r.seed],
    ['KNOCKOUT POINTS',r.knockout+' / 20'],
    ['CREW POINTS',r.crew+' / 20'],
    ['FOUR-WIDE POINTS',r.fourWide+' / 40'],
    ['TOTAL CHAMPIONSHIP POINTS',r.total+' / 80'],
    ['PROFESSIONAL DRIVER RATING',String(long?.rating||r.rating||'—')],
  ];
  fields.forEach(([k,v],i)=>{
    o.label(134,194+i*66,k,20,MUTED);
    o.headline(930,186+i*66,v,25,GOLD,490);
  });
  o.button(780,767,530,52,'BACK TO FULL STANDINGS',
    ()=>showTokyoChampionshipScreens(s,{view:'STANDINGS',actions}));
}
function showRules(s,actions){
  const o=canvas(s,'HUB');o.actions=actions;
  o.headline(62,100,'CHAMPIONSHIP REGULATIONS',39,GOLD);
  o.panel(780,413,1310,542,.95);
  const rules=[
    ['01  INDIVIDUAL KNOCKOUTS','16-driver bracket. Up to four head-to-head races. Maximum 20 points.'],
    ['02  CREW BATTLES','Three player-driven crew heats using three different crew cars. Maximum 20 points.'],
    ['03  FOUR-WIDE FINALE','Four-wide qualifier, semifinals and final. Maximum 40 points.'],
    ['OVERALL TITLE','All 16 drivers remain in the Championship; stage elimination only affects stage points.'],
    ['CAR REGISTRATION','One of your three season cars locks across solo stages. Crew heats require distinct cars.'],
    ['TIEBREAK','Four-wide score, then knockout score, then Championship seed.'],
  ];
  rules.forEach(([h,b],i)=>{o.headline(140,187+i*79,h,22,GOLD);o.label(140,219+i*79,b,19,PALE,{width:1220});});
  o.button(780,772,470,48,'BACK TO CHAMPIONSHIP HUB',
    ()=>showTokyoChampionshipScreens(s,{view:'HUB',actions}));
}
function showResult(s,actions){
  const c=circuit(s),state=c.activeChampionship,rows=championshipStandings(state);
  if(!state.completed)return showHub(s,actions);
  const mine=rows.find(r=>r.id==='player:driver'),place=rows.indexOf(mine)+1;
  const o=canvas(s,'HUB');o.actions=actions;
  o.headline(53,108,state.championId==='player:driver'?'TOKYO CHAMPION!':'CHAMPIONSHIP COMPLETE',43,GOLD);
  o.panel(780,415,1310,523,.96);
  o.headline(150,194,'OFFICIAL PODIUM',31,GOLD);
  rows.slice(0,3).forEach((r,i)=>{
    o.headline(160,245+i*75,(i+1)+'.  '+standingName(c,r),29,i===0?GOLD:PALE,800);
    o.label(1055,252+i*75,r.total+' POINTS',25,GOLD);
  });
  o.headline(156,513,'YOUR FINISH  #'+place+' / 16',31,GOLD);
  o.label(160,562,'YOUR TOTAL  '+mine.total+' / 80 POINTS',22,PALE);
  o.label(160,601,'CHAMPIONSHIP PRIZE  ¥'+fmt(TOKYO_CHAMPIONSHIP_PURSES[place-1]),25,GOLD);
  o.button(520,761,520,51,'CHAMPIONSHIP HUB',
    ()=>showTokyoChampionshipScreens(s,{view:'HUB',actions}));
  o.button(1100,761,520,51,'CONTINUE PRO CAREER',()=>{o.close();actions.returnToSeason?.();},{red:true});
}
export function showTokyoChampionshipScreens(s,{view='HUB',driverId=null,actions}={}){
  const state=circuit(s).activeChampionship;
  if(!state)return;
  const target=view==='EVENT'?state.stage:EVENTS[view]?view:view;
  const assetView=EVENTS[target]?target:'HUB';
  if(loadAssets(s,assetView,()=>showTokyoChampionshipScreens(s,{view,driverId,actions})))return;
  if(target==='CREW_PICK')return showCarPicker(s,'CREW',actions);
  if(target==='STANDINGS')return showStandings(s,actions);
  if(target==='PROFILE')return showProfile(s,driverId,actions);
  if(target==='RULES')return showRules(s,actions);
  if(target==='RESULT')return showResult(s,actions);
  if(EVENTS[target])return showEvent(s,target,actions);
  showHub(s,actions);
}
