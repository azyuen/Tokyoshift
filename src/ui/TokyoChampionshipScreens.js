// Tokyo SHIFT — unified Championship Hub and three dedicated event briefings.
// Only presentation, navigation and one-use strategy notes live here.
// Authoritative scoring, car locks and race settlement remain in the existing modules.
import { championshipStandings, seedKnockoutBracket, getChampionshipKnockoutHeat, getChampionshipCrewHeat,
  getChampionshipFourWideHeat, TOKYO_CHAMPIONSHIP_PURSES } from '../data/tokyoChampionship.js?v=20261030-r724';
import { normaliseProCircuitState } from '../data/proCircuit.js?v=20261030-r741';
import { getCrewSeriesUnits, getProSeasonDriverCarError } from '../data/proSeason.js?v=20261030-r741';
import { cars } from '../data/cars.js?v=20261026-r687';
import { characters, getCharacterVisualAsset, getCharacterAssetUrl, getProCircuitGenericDriverAsset } from '../data/characters.js?v=20261024-r680';
import { saveProTransaction } from '../state/GameState.js?v=20261030-r739';
import { addProGlowingHotspot } from './ProBriefingChrome.js?v=20261020-r613';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261022-r635';
import { PRO_GARAGE_ID } from '../data/workshopProgression.js?v=20261024-r675';

const W=1560, H=840;
const BODY='"Rajdhani", sans-serif', DISPLAY='"Exo 2", sans-serif', PIXEL='"Silkscreen", monospace';
const GOLD='#f4ca76', PALE='#eef1f5', MUTED='#b2c2d2', BLUE=0x52758e, RED=0xd64b5c;
const STAGES=['KNOCKOUT','CREW','FOUR_WIDE'];
// The artwork screens are painted into the background PNGs (1671×941).
// After Phaser's cover-scale to 1560×840 they occupy these exact scene rectangles.
// Draw text directly on the virtual display, not in a second floating panel.
export const TOKYO_CHAMP_MONITORS=Object.freeze({
  HUB:Object.freeze({x:100,y:164,w:510,h:337}),
  KNOCKOUT:Object.freeze({x:897,y:160,w:550,h:285}),
});

const EVENTS={
  KNOCKOUT:{number:'01',title:'INDIVIDUAL KNOCKOUTS',short:'INDIVIDUAL',points:20,
    image:'tokyoChampKnockoutBg',path:'championship_knockouts.png'},
  CREW:{number:'02',title:'CREW BATTLES',short:'CREW BATTLES',points:20,
    image:'tokyoChampCrewBg',path:'championship_crewbattles.png'},
  FOUR_WIDE:{number:'03',title:'FOUR-WIDE FINALE',short:'FOUR-WIDE',points:40,
    image:'tokyoChampFourBg',path:'championship_fourwide.png'},
};
const HUB={image:'tokyoChampHubBg',path:'championship_hub.png'};
const bgPath=name=>'assets/CentralTokyo/dragcomplex/'+name+'?v=20261106-r802-wall-art';
const circuit=s=>normaliseProCircuitState(s.registry.get('proCircuit'));
const fmt=n=>Number(n||0).toLocaleString('en-US');
const closeSceneOverlay=s=>s._proOverlayClose?.();

// Rank order comes from the authoritative live Championship standings, not
// from static seed order or the old preselected regional rivals.
export function getChampionshipHubPodium(standings){
  const topThree=(standings||[]).slice(0,3);
  const player=(standings||[]).find(r=>r.id==='player:driver');
  return player&&!topThree.some(r=>r.id===player.id)?
    [...topThree,player]:topThree;
}
function hubDriverAsset(s,row){
  if(!row)return null;
  const selected=s.registry.get('playerCharacterId')||'renMizuno';
  if(row.id==='player:driver')
    return getCharacterVisualAsset(selected,'idle',{proCircuit:true});
  if(row.characterId)
    return getCharacterVisualAsset(row.characterId,'idle',{
      proCircuit:true,rivalContext:true,playerCharacterId:selected,
    });
  // Professional-only entrants have no authored named portrait. Use the
  // existing generic Pro Circuit driver art rather than a false named rival.
  const number=Number.parseInt(String(row.id).split(':').at(-1),10);
  return getProCircuitGenericDriverAsset(Number.isFinite(number)?
    ((number-1)%4+4)%4+1:1);
}
function hubLineup(s){
  const rows=championshipStandings(circuit(s).activeChampionship);
  return getChampionshipHubPodium(rows).map(row=>({
    ...row,asset:hubDriverAsset(s,row),
  }));
}
function portraitAssets(s,stage){
  const out=[];
  if(stage){
    out.push(['champSayaka','assets/Characters/Main/race_sayaka_fujieda_idle.png']);
    out.push(['champDaichi','assets/Characters/Main/pro_daichi_sakamoto.png']);
    if(stage==='KNOCKOUT'){
      out.push(['champHiroshi','assets/Characters/Central/hiroshi_sato_normal.png']);
      const generic=getProCircuitGenericDriverAsset(1);
      if(generic)out.push([generic.key,generic.path]);
    }
    const player=getCharacterVisualAsset(s.registry.get('playerCharacterId')||'renMizuno',
      'idle',{proCircuit:true});
    if(player?.key&&player.path)out.push([player.key,player.path]);
  }else{
    for(const row of hubLineup(s))
      if(row.asset?.key&&row.asset?.path)out.push([row.asset.key,row.asset.path]);
  }
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
  const seen=new Set();
  for(const [key,path] of images)if(!seen.has(key)&&!s.textures.exists(key)){
    seen.add(key);s.load.image(key,path);queued++;
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
    s.events.off('shutdown',clear);
    s.load.off('complete',finish);};
  const finish=()=>{clear();if(s.sys?.isActive?.())done();};
  s.events.once('shutdown',clear);
  s.load.once('complete',finish);
  s.load.start();
  return true;
}
function canvas(s,view,{hideTopChrome=false}={}){
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
  // The Hub is a full-bleed scene. Other overlays/briefings retain their
  // original close control and small top navigation bar.
  if(!hideTopChrome)
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
  const button=(cx,cy,w,h,caption,action,
    {red=false,disabled=false,selected=false,subtitle=''}={})=>{
    const fill=disabled?0x263039:red?0x8d2636:selected?0x3b3327:0x1c3248;
    const outline=disabled?0x58606a:red?0xf17883:selected?0xf0ca80:0x9bb1c4;
    const node=add(s.add.rectangle(cx,cy,w,h,fill,.98)
      .setStrokeStyle(2,outline,.95).setDepth(241));
    const txt=label(cx,subtitle?cy-12:cy,caption,Math.min(20,h*.4),
      disabled?'#8f9cac':selected?GOLD:PALE,
      {font:DISPLAY,depth:242}).setOrigin(.5);
    txt.setFontStyle('900 italic');
    if(txt.width>w-18)txt.setScale((w-18)/txt.width);
    if(subtitle){
      const foot=label(cx,cy+17,subtitle,15,disabled?'#8796a6':
        selected?GOLD:MUTED,{font:BODY,depth:242}).setOrigin(.5);
      if(foot.width>w-16)foot.setScale((w-16)/foot.width);
    }
    if(!disabled)node.setInteractive({useHandCursor:true})
      .on('pointerdown',()=>{if(!closed)action();});
    return node;
  };
  if(!hideTopChrome){
    label(32,10,'TOKYO SHIFT  /  TOKYO CHAMPIONSHIP',20,PALE,
      {font:DISPLAY,depth:235});
    label(1362,12,'SEASON '+circuit(s).season,18,GOLD,
      {font:DISPLAY,depth:235});
    button(1510,31,64,43,'X',close);
  }
  // Glyph-only controls: preserve the 56×48 touch target, with no box/stroke
  // drawn around the arrows (important for small phones).
  const iconButton=(cx,cy,glyph,action,{disabled=false}={})=>{
    const hit=add(s.add.rectangle(cx,cy,56,48,0x000000,0)
      .setDepth(244));
    const icon=label(cx,cy,glyph,30,disabled?'#607286':GOLD,
      {font:DISPLAY,depth:245}).setOrigin(.5);
    icon.setFontStyle('900');
    if(!disabled)hit.setInteractive({useHandCursor:true})
      .on('pointerdown',()=>{if(!closed)action();});
    return hit;
  };
  return {add,close,label,headline,panel,button,iconButton};
}
function sprite(s,o,key,x,feet,maxHeight=410,maxWidth=245,flip=false){
  if(!key||!s.textures.exists(key))return;
  const image=s.textures.get(key).getSourceImage();
  const scale=Math.min(maxHeight/image.height,maxWidth/image.width);
  o.add(s.add.ellipse(x,feet-7,maxWidth*.87,37,0x020711,.60).setDepth(211));
  o.add(s.add.image(x,feet,key).setOrigin(.5,1).setScale(scale)
    .setFlipX(flip).setDepth(210));
}
function mainSprites(s,o,view){
  const player=getCharacterVisualAsset(s.registry.get('playerCharacterId')||'renMizuno',
    'idle',{proCircuit:true});
  if(view==='HUB'){
    const lineup=hubLineup(s);
    const xs=lineup.length===4?[850,1055,1260,1465]:[870,1100,1330];
    const ranked=championshipStandings(circuit(s).activeChampionship);
    // All podium sprites (including a fourth-place player) use identical
    // bounding boxes and baseline, so character proportions are consistent.
    // Move the first driver left when four are present and raise the group.
    lineup.forEach((row,i)=>{
      const isPlayer=row.id==='player:driver';
      sprite(s,o,row.asset?.key,xs[i],1040,978,480);
      const rank=ranked.findIndex(r=>r.id===row.id)+1;
      o.add(s.add.rectangle(xs[i],625,182,29,0x081625,.86)
        .setStrokeStyle(1,i===0?0xd9b36e:0x59738d,.85).setDepth(233));
      const tag='#'+rank+'  '+standingName(circuit(s),row).toUpperCase();
      const title=o.label(xs[i],625,tag,15,isPlayer?GOLD:PALE,
        {font:DISPLAY,depth:235}).setOrigin(.5);
      if(title.width>170)title.setScale(170/title.width);
    });
  }else if(view==='CREW'){
    sprite(s,o,'champSayaka',175,622,420,240);
    sprite(s,o,'champDaichi',396,623,417,242);
    const units=getCrewSeriesUnits(s.registry).filter(u=>u.validAssignment).slice(0,3);
    units.forEach((unit,i)=>{
      const a=getCharacterVisualAsset(unit.id,'idle',{proCircuit:true,
        playerCharacterId:s.registry.get('playerCharacterId')||'renMizuno'});
      sprite(s,o,a?.key,630+i*155,636,308,154);
    });
  }else if(view==='KNOCKOUT'){
    // Enlarged 25%, shared floor line; Daichi stays anchored on the right.
    sprite(s,o,'champSayaka',262,741,550,307);
    sprite(s,o,player?.key,474,741,548,325);
    sprite(s,o,'champDaichi',698,741,525,301);
    sprite(s,o,'champHiroshi',1481,741,550,307);
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
  // One shallow pit-wall card replaces two competing dialogue boxes.
  const active=stage===state.stage&&!state.completed;
  const saved=state.adviceByEvent?.[stage];
  o.panel(x+w/2,y+48,w,96,.84,0x85745a);
  o.label(x+15,y+8,'SAYAKA  //  RACE STRATEGY',17,GOLD,{font:DISPLAY});
  if(saved){
    o.label(x+15,y+34,saved,17,PALE,{width:w-35});
  }else if(active){
    o.label(x+15,y+36,'Ask Sayaka for a one-time briefing before this event.',17,MUTED,
      {width:w-260});
    o.button(x+w-118,y+68,215,39,'ASK SAYAKA',()=>{
      const c=circuit(s),current=c.activeChampionship;
      if(!current||current.id!==state.id||current.stage!==stage||
        current.adviceByEvent?.[stage])return;
      const note=getEventAdvice(current,stage);
      const updated={...current,adviceByEvent:{...(current.adviceByEvent||{}),[stage]:note}};
      try{
        saveProTransaction(s.registry,{proCircuit:{...c,activeChampionship:updated}});
        s.proError=null;
      }catch(error){s.proError=error.message;}
      showTokyoChampionshipScreens(s,{view:stage,actions:o.actions});
    },{red:true});
  }else o.label(x+15,y+37,'Race strategy consultation closed for this event.',17,MUTED);
}

// Event details are a non-navigating takeover of the physical wall monitor.
const HUB_EVENT_EXPLANATIONS=Object.freeze({
  KNOCKOUT:Object.freeze({
    title:'01  /  INDIVIDUAL KNOCKOUTS',
    strap:'16 DRIVERS  /  ONE-ON-ONE ELIMINATION',
    lines:[
      'ONE-ON-ONE RACES: WIN TO REACH THE NEXT ROUND.',
      'FOUR POSSIBLE ROUNDS: TOP 16, TOP 8, SEMIS, FINAL.',
      'POINTS: 20 / 17 / 13 / 9 / 5 BY FINISHING POSITION.',
      'ELIMINATION ONLY ENDS THIS EVENT, NOT YOUR CHAMPIONSHIP.',
    ],
  }),
  CREW:Object.freeze({
    title:'02  /  CREW BATTLES',
    strap:'THREE PLAYER-DRIVEN CREW HEATS',
    lines:[
      'YOU DRIVE ALL THREE HEAD-TO-HEAD CREW HEATS.',
      'USE THREE DIFFERENT ELIGIBLE RECRUITED CREW CARS.',
      'EACH VICTORY COUNTS TOWARDS YOUR CREW RESULT.',
      '0 / 1 / 2 / 3 WINS EARNS 3 / 8 / 14 / 20 POINTS.',
    ],
  }),
  FOUR_WIDE:Object.freeze({
    title:'03  /  FOUR-WIDE FINALE',
    strap:'FOUR LANES  /  40 POINTS MAXIMUM',
    lines:[
      'QUALIFYING: FOUR HEATS; TOP TWO IN EACH ADVANCE.',
      'SEMIFINALS: TWO HEATS; TOP TWO IN EACH ADVANCE.',
      'GRAND FINAL: FOUR DRIVERS RACE FOR THE TITLE.',
      'A SINGLE REGISTERED DRIVER CAR IS LOCKED FOR SOLO STAGES.',
    ],
  }),
});

function showHub(s,actions,{displayStage=null,displayProfileId=null,standingsPage=0}={}){
  const c=circuit(s),state=c.activeChampionship,rows=championshipStandings(state);
  const me=rows.find(r=>r.id==='player:driver');
  const current=state.stage,screen=TOKYO_CHAMP_MONITORS.HUB;
  const page=standingsPage===1?1:0;
  const o=canvas(s,'HUB',{hideTopChrome:true});o.actions=actions;
  mainSprites(s,o,'HUB');

  // No black header or close X; the primary title belongs to the environment.
  o.headline(41,21,'TOKYO CHAMPIONSHIP',62,GOLD,1020);
  o.headline(44,103,'SEASON '+state.season,27,GOLD,370);

  if(displayProfileId){
    // Driver details take over the same wall display in-place. All values
    // come from the live Championship snapshot and actual Pro Circuit record.
    const r=rows.find(item=>item.id===displayProfileId);
    if(r){
      const career=r.id==='player:driver'?c.playerDriver:c.drivers?.[r.id];
      const position=rows.indexOf(r)+1;
      const left=screen.x+18,right=screen.x+260;
      o.headline(left,screen.y+10,'DRIVER PROFILE  /  #'+position,
        21,GOLD,screen.w-36);
      o.headline(left,screen.y+41,standingName(c,r).toUpperCase(),
        28,PALE,screen.w-36);
      o.add(s.add.rectangle(screen.x+screen.w/2,screen.y+80,
        screen.w-36,1,0x7391ab,.65).setDepth(225));
      const record=career&&Number.isFinite(career.wins)&&
        Number.isFinite(career.losses)?
        career.wins+'W / '+career.losses+'L':'—';
      const fields=[
        [['CHAMPIONSHIP RANK','#'+position+' / 16'],
          ['CHAMPIONSHIP SEED','#'+r.seed]],
        [['KNOCKOUT',r.knockout+' / 20'],
          ['CREW BATTLES',r.crew+' / 20']],
        [['FOUR-WIDE',r.fourWide+' / 40'],
          ['TOTAL POINTS',r.total+' / 80']],
        [['DRIVER RATING',String(career?.rating||r.rating||'—')],
          ['PRO WINS / LOSSES',record]],
      ];
      fields.forEach((pair,i)=>pair.forEach(([heading,value],j)=>{
        const x=j===0?left:right,y=screen.y+90+i*48;
        o.label(x,y,heading,14,MUTED,{font:DISPLAY,width:223});
        o.label(x,y+18,value,24,
          heading==='TOTAL POINTS'?GOLD:PALE,{font:BODY,width:220});
      }));
      // One unobtrusive back affordance inside the monitor, not a modal
      // navigation bar; return to precisely the page the user was browsing.
      o.iconButton(left+13,screen.y+screen.h-24,'◀',
        ()=>showHub(s,actions,{standingsPage:page}));
      o.label(left+38,screen.y+screen.h-36,'BACK TO LIVE STANDINGS',17,GOLD,
        {font:DISPLAY});
      const back=o.add(s.add.rectangle(screen.x+screen.w/2,
        screen.y+screen.h-23,screen.w-36,37,0,0).setDepth(244)
        .setInteractive({useHandCursor:true}));
      back.on('pointerdown',()=>showHub(s,actions,{standingsPage:page}));
    }
  }else if(displayStage && HUB_EVENT_EXPLANATIONS[displayStage]){
    const info=HUB_EVENT_EXPLANATIONS[displayStage];
    o.headline(screen.x+16,screen.y+11,info.title,22,GOLD,screen.w-34);
    o.label(screen.x+16,screen.y+53,info.strap,17,PALE,
      {font:DISPLAY,width:screen.w-32});
    info.lines.forEach((line,i)=>{
      o.label(screen.x+18,screen.y+100+i*47,line,18,PALE,
        {width:screen.w-38});
    });
    o.label(screen.x+18,screen.y+screen.h-31,
      'SELECT THE EVENT AGAIN FOR LIVE STANDINGS',14,GOLD,
      {font:DISPLAY,width:screen.w-38});
  }else{
    // Exactly eight ranked drivers per page, never substitute the player for
    // the eighth entry: the second page must truly contain ranks 9 through 16.
    o.headline(screen.x+16,screen.y+9,'LIVE CHAMPIONSHIP STANDINGS',
      21,GOLD,screen.w-34);
    const pageRows=rows.slice(page*8,page*8+8);
    pageRows.forEach((r,i)=>{
      const y=screen.y+56+i*30,own=r.id==='player:driver';
      if(own)o.add(s.add.rectangle(screen.x+screen.w/2,y+12,
        screen.w-28,29,0x68502e,.47).setDepth(225));
      o.label(screen.x+18,y,'#'+(page*8+i+1),20,own?GOLD:PALE);
      o.label(screen.x+72,y,standingName(c,r).slice(0,23),20,
        own?GOLD:PALE,{width:screen.w-195});
      o.label(screen.x+screen.w-20,y,r.total+' PTS',18,
        own?GOLD:MUTED).setOrigin(1,0);
      const hit=o.add(s.add.rectangle(screen.x+screen.w/2,y+12,
        screen.w-24,29,0,0).setDepth(245)
        .setInteractive({useHandCursor:true}));
      hit.on('pointerdown',()=>showTokyoChampionshipScreens(s,{
        view:'PROFILE',driverId:r.id,profileHubPage:page,actions,
      }));
    });
    const footerY=screen.y+screen.h-22;
    o.iconButton(screen.x+41,footerY,'◀',
      ()=>showHub(s,actions,{standingsPage:0}),{disabled:page===0});
    o.label(screen.x+screen.w/2,footerY-11,
      (page? '09–16' : '01–08')+' / 16  DRIVERS',17,MUTED,
      {font:DISPLAY}).setOrigin(.5,0);
    o.iconButton(screen.x+screen.w-41,footerY,'▶',
      ()=>showHub(s,actions,{standingsPage:1}),{disabled:page===1});
  }

  // A clean lower navigation strip. Three same-size event toggles preview
  // regulations *on the wall monitor*. Only the red fourth button enters a
  // real event briefing. Toggling the selected event restores standings.
  o.headline(49,655,'THE ROAD TO THE TITLE',27,GOLD);
  const left=43,width=354,gap=19,centreY=740,height=74;
  STAGES.forEach((stage,i)=>{
    const event=EVENTS[stage],status=statusFor(state,stage);
    const key=stage==='KNOCKOUT'?'knockout':stage==='CREW'?'crew':'fourWide';
    o.button(left+width/2+i*(width+gap),centreY,width,height,
      event.number+'  '+event.short.toUpperCase(),()=>showHub(s,actions,{
        displayStage:displayStage===stage?null:stage,
        standingsPage:page,
      }),{
        selected:displayStage===stage,
        subtitle:status+'   /   '+me[key]+' OF '+event.points+' PTS',
      });
  });
  const finalAction=state.completed;
  const nextEvent=EVENTS[current];
  o.button(left+width/2+3*(width+gap),centreY,width,height,
    finalAction?'CHAMPIONSHIP RESULTS':'ENTER EVENT '+(nextEvent?.number||'01'),
    ()=>showTokyoChampionshipScreens(s,{
      view:finalAction?'RESULT':current,actions,
    }),{red:true,subtitle:finalAction?'VIEW FINAL PODIUM':
      'OPEN '+(nextEvent?.short||'NEXT EVENT')+' BRIEFING'});
  // Separate, full-width-of-event blue map shortcut below the red action.
  // Close the Hub overlay before presenting the existing region map.
  o.button(left+width/2+3*(width+gap),810,width,38,'GO TO MAP',()=>{
    o.close();
    actions?.goToMap?.();
  });

}

function eventInfo(s,o,state,stage,bracketHalf=0){
  const x=977,w=535;
  if(stage==='KNOCKOUT'){
    // Project the saved knockout tree onto the virtual wall display.
    const screen=TOKYO_CHAMP_MONITORS.KNOCKOUT;
    const entrant=new Map((state.entrants||[]).map(row=>[row.id,row]));
    const brackets=state.knockout?.bracket||seedKnockoutBracket(state.entrants);
    const history=state.knockout?.results||[];
    // Four first-round fixtures at a time: full-height, legible rows.
    const firstX=screen.x+13,cellW=151,gap=17;
    const starts=[0,1,2].map(r=>firstX+r*(cellW+gap));
    const top=screen.y+76,pitch=47;
    const centre=(round,index)=>top+pitch*(2**round)*(index+.5);
    o.label(screen.x+18,screen.y+9,
      'LIVE BRACKET  /  '+(bracketHalf?'BOTTOM':'TOP')+' HALF',
      19,GOLD,{font:DISPLAY,stroke:true});
    const graphic=o.add(s.add.graphics().setDepth(225));
    graphic.lineStyle(2,0x8fb4d0,.85);
    for(let round=0;round<2;round++)for(let i=0;i<4/(2**round);i++){
      const y=centre(round,i),dest=centre(round+1,Math.floor(i/2));
      const right=starts[round]+cellW,next=starts[round+1],k=right+gap/2;
      graphic.lineBetween(right,y,k,y);
      graphic.lineBetween(k,y,k,dest);
      graphic.lineBetween(k,dest,next,dest);
    }
    for(let round=0;round<3;round++){
      const xx=starts[round];
      o.label(xx,screen.y+48,['TOP 16','TOP 8','TOP 4'][round],17,GOLD);
      for(let i=0;i<4/(2**round);i++){
        const originalIndex=i+bracketHalf*(4/(2**round));
        const pair=brackets[round]?.[originalIndex]||[null,null],
          y=centre(round,i),
          winner=history[round]?.matches?.[originalIndex]?.winner;
        const isPlayer=pair.includes('player:driver');
        o.add(s.add.rectangle(xx+cellW/2,y,cellW,pitch*(2**round)-5,
          isPlayer?0x554529:0x102239,.77)
          .setStrokeStyle(1,isPlayer?0xe7be71:0x48718b,.95).setDepth(224));
        pair.forEach((id,j)=>{
          const eliminated=Boolean(winner&&id&&id!==winner);
          const name=!id?'TBD':id==='player:driver'?'YOU':
            (entrant.get(id)?.name||'RIVAL').slice(0,17);
          o.label(xx+7,y-17+j*19,name,17,
            id==='player:driver'?GOLD:eliminated?'#7b8899':PALE,
            {width:cellW-12});
        });
      }
    }
    // The bracket screen remains free of duplicate progress counters.
  }else if(stage==='CREW'){
    panelTitle(o,x,186,'CREW BATTLE SCOREBOARD');
    const results=state.crew?.results||[];
    const next=state.stage===stage?getChampionshipCrewHeat(state):null;
    const wins=results.filter(r=>r.won).length;
    o.headline(x+8,226,wins+' / 3 HEATS WON',29,GOLD,w-18);
    for(let i=0;i<3;i++){
      const result=results[i],y=280+i*91;
      const current=!result&&i===results.length&&next;
      o.panel(x+265,y+32,518,78,current ? .95 : .82,
        result?(result.won?0x588f76:0xa45b62):current?0xc09656:0x52667b);
      o.headline(x+13,y+6,'HEAT 0'+(i+1),24,current?GOLD:PALE,135);
      o.label(x+167,y+6,result?(result.won?'WIN':'LOSS'):
        current?'NEXT TO RACE':'AWAITING',22,result?(result.won?GOLD:'#e6a0a9'):
        current?GOLD:MUTED);
      o.label(x+168,y+39,result?(cars[result.carId]?.shortName||result.carId):
        current?(next?.opponent?.name||'SELECT CREW CAR'):'—',17,MUTED,
        {width:333});
    }
    o.label(x+8,560,'THREE DISTINCT CREW CARS  /  YOU DRIVE EVERY HEAT',
      16,GOLD,{width:520});
  }else{
    panelTitle(o,x,185,'FOUR-WIDE FINALS LADDER');
    const history=state.fourWide?.results||[];
    const live=state.stage===stage?getChampionshipFourWideHeat(state):null;
    const entrants=new Map((state.entrants||[]).map(e=>[e.id,e]));
    const names=['QUALIFYING','SEMIFINALS','GRAND FINAL'];
    for(let i=0;i<3;i++){
      const left=979+i*179,finished=!!history[i];
      const current=!finished&&live?.round===i;
      const heat=history[i]?.heats?.find(h=>
        h.entrants.includes('player:driver'))||
        (current?live:null);
      o.panel(left+83,378,166,304,finished ? .82 : current ? .96 : .75,
        current?0xc49657:finished?0x548675:0x52667b);
      o.label(left+10,242,'0'+(i+1),20,GOLD);
      o.headline(left+10,271,names[i],20,current?GOLD:PALE,156);
      o.label(left+11,312,finished?'COMPLETE':current?'UP NEXT':'PENDING',
        16,finished?'#8ed1ae':current?GOLD:MUTED);
      // A visible four-lane grid gives this round a motorsport identity.
      for(let lane=0;lane<4;lane++){
        const id=heat?.entrants?.[lane],mine=id==='player:driver';
        const laneY=355+lane*35;
        o.add(s.add.rectangle(left+82,laneY,143,28,
          mine?0x69502d:0x14283d,.97).setStrokeStyle(
          1,mine?0xf5c572:0x4d637c).setDepth(225));
        const name=id?(mine?'YOU':(entrants.get(id)?.name||'RIVAL')
          .split(' ').slice(-1)[0].slice(0,12)):'—';
        o.label(left+17,laneY-10,'L'+(lane+1)+'  '+name,15,
          mine?GOLD:id?PALE:MUTED,{width:139});
      }
      o.label(left+10,511,i===2?'TITLE DECIDER':'TOP 2 ADVANCE',16,MUTED);
    }
    o.label(x+6,560,'QUALIFY   >   SEMIFINALS   >   TOKYO TITLE',
      17,GOLD,{width:530});
  }
}

function showEvent(s,stage,actions,displayMode='BRACKET',bracketHalf=0){
  const c=circuit(s),state=c.activeChampionship;
  const active=state.stage===stage&&!state.completed;
  const st=statusFor(state,stage),event=EVENTS[stage];
  const o=canvas(s,stage,{hideTopChrome:stage==='KNOCKOUT'});o.actions=actions;
  mainSprites(s,o,stage);
  const standings=championshipStandings(state);
  const position=standings.findIndex(r=>r.id==='player:driver')+1;
  const points=standings.find(r=>r.id==='player:driver')?.total||0;
  o.label(44,stage==='KNOCKOUT'?23:82,'TOKYO CHAMPIONSHIP  /  EVENT '+event.number,19,MUTED,
    {font:DISPLAY});
  o.headline(44,stage==='KNOCKOUT'?55:119,event.title,41,GOLD,870);
  o.label(46,stage==='KNOCKOUT'?104:169,(stage==='KNOCKOUT'?'16-DRIVER ELIMINATION':
    stage==='CREW'?'THREE PLAYER-DRIVEN CREW HEATS':
    'QUALIFYING  /  SEMIFINALS  /  GRAND FINAL')+
    '   /   '+event.points+' POINTS AVAILABLE',18,PALE);
  if(stage!=='KNOCKOUT')
    o.label(1246,88,'RANK #'+position+'  /  '+points+' PTS',
      22,GOLD,{font:DISPLAY,stroke:true}).setOrigin(.5,0);

  // The stage-specific competition visual is the single main information panel.
  // The Knockouts artwork already has a physical screen; never panel over it.
  if(stage!=='KNOCKOUT')o.panel(1245,381,558,424,.85,0x61778e);
  if(stage==='KNOCKOUT'&&displayMode==='DETAILS'){
    const m=TOKYO_CHAMP_MONITORS.KNOCKOUT;
    o.headline(m.x+19,m.y+14,'EVENT DETAILS',25,GOLD,510);
    o.label(m.x+20,m.y+70,'16 DRIVERS / HEAD-TO-HEAD ELIMINATION',20,PALE);
    o.label(m.x+20,m.y+110,'FOUR ROUNDS / WIN TO ADVANCE',19,PALE);
    o.label(m.x+20,m.y+150,'DRIVER CAR: REGISTERED PRO PADDOCK CAR',18,MUTED);
    o.label(m.x+20,m.y+188,'CLASS / DRIVETRAIN: NO EXTRA RESTRICTION',18,MUTED);
    o.label(m.x+20,m.y+226,'POINTS AVAILABLE: '+event.points,19,GOLD);
  }else eventInfo(s,o,state,stage,bracketHalf);
  if(stage==='KNOCKOUT'&&displayMode!=='DETAILS'){
    const monitor=TOKYO_CHAMP_MONITORS.KNOCKOUT;
    o.button(monitor.x+monitor.w-60,monitor.y+monitor.h-16,
      64,29,bracketHalf?'UP':'DOWN',
      ()=>showEvent(s,stage,actions,'BRACKET',bracketHalf?0:1));
  }
  const heat=active?heatFor(state):null;
  const next=stage==='KNOCKOUT'?'ROUND '+((heat?.round||0)+1)+
    ' / 4  VS  '+(heat?.opponent?.name||'—'):
    stage==='CREW'?'HEAT '+((heat?.index||0)+1)+
    ' / 3  VS  '+(heat?.opponent?.name||'—'):
    ['QUALIFYING','SEMIFINAL','GRAND FINAL'][heat?.round||0];
  if(stage==='KNOCKOUT'){
    // Identical 654×164 Open Circuit opponent-card geometry, shifted left.
    // Red is the sole Championship colour substitution.
    const x=52,y=643,w=654,h=164,slant=21;
    const graphic=o.add(s.add.graphics().setDepth(219));
    const outline=[{x:x+slant,y},{x:x+w,y},{x:x+w-slant,y:y+h},
      {x,y:y+h}];
    graphic.fillStyle(0x071728,.96);graphic.fillPoints(outline,true);
    graphic.lineStyle(3,0xe45868,1);graphic.strokePoints(outline,true);
    o.headline(89,652,active?'NEXT OPPONENT':'EVENT STATUS',24,'#ff7885',570);
    const frameX=74,frameY=683,frameW=129,frameH=106,skew=16;
    const framePoints=[{x:frameX+skew,y:frameY},
      {x:frameX+frameW+skew,y:frameY},
      {x:frameX+frameW-skew,y:frameY+frameH},
      {x:frameX-skew,y:frameY+frameH}];
    const border=o.add(s.add.graphics().setDepth(220));
    border.fillStyle(0x783044,.87);border.fillPoints(framePoints,true);
    border.lineStyle(4,0x050a10,1);border.strokePoints(framePoints,true);
    const opponent=heat?.opponent||{};
    const portraitId=opponent.characterId;
    if(portraitId&&characters[portraitId]){
      const profile=createCharacterProfile(s,{
        characterId:portraitId,pose:'idle',x:frameX+frameW/2-9,
        y:frameY+frameH/2+10,frameWidth:frameW*1.55,
        frameHeight:frameH*1.5,side:'center',depth:225,mask:false,
        playerCharacterId:s.registry.get('playerCharacterId')||'renMizuno',
        rivalContext:true,proCircuit:true,
      });
      if(profile?.image){
        o.add(profile);
        const maskShape=s.make.graphics({add:false});
        maskShape.fillStyle(0xffffff,1);
        maskShape.fillPoints(framePoints,true);
        profile.image.setMask(maskShape.createGeometryMask());
        o.add({destroy:()=>maskShape.destroy()});
      }
    }else{
      const generic=getProCircuitGenericDriverAsset(1);
      if(generic&&s.textures.exists(generic.key)){
        const img=s.textures.get(generic.key).getSourceImage();
        const scale=Math.max(frameW*1.6/Math.max(1,img.width),
          frameH*2.2/Math.max(1,img.height));
        const portrait=o.add(s.add.image(frameX+frameW/2-9,frameY+18,generic.key)
          .setOrigin(.5,0).setScale(scale).setDepth(225));
        const maskShape=s.make.graphics({add:false});
        maskShape.fillStyle(0xffffff,1);maskShape.fillPoints(framePoints,true);
        portrait.setMask(maskShape.createGeometryMask());
        o.add({destroy:()=>maskShape.destroy()});
      }else o.label(100,726,'PRO DRIVER',13,PALE,{font:PIXEL});
    }
    const opponentDriver=c.drivers?.[opponent.id]||{};
    const opponentCarId=opponent.carId||opponentDriver.carId||
      opponentDriver.selectedCarId||heat?.opponentCarId;
    const opponentCar=cars[opponentCarId]||{};
    o.label(231,684,String(opponent.name||'TO BE CONFIRMED').toUpperCase(),
      18,PALE,{font:DISPLAY,width:239});
    o.label(231,708,String(opponentCar.name||opponentCar.shortName||
      opponentCarId||'CAR TO BE CONFIRMED').toUpperCase(),
      14,'#ff9ba5',{width:247});
    o.label(231,733,'CLASS CAP',11,MUTED);
    o.label(326,730,'NO ADDITIONAL CAP',15,PALE);
    o.label(231,753,'NOS',11,MUTED);
    o.label(326,750,'STANDARD CHAMPIONSHIP',15,PALE);
    o.label(231,775,'CLASS',11,MUTED);
    o.label(326,771,'CHAMPIONSHIP',15,PALE);
    if(opponentCarId&&cars[opponentCarId]&&
      typeof s.createCarDisplay==='function'){
      try{
        const parts=s.createCarDisplay(cars[opponentCarId],545,743,211,225,
          opponent.paintColor??0x7f8899,null,false,
          opponent.opponentBuildState||{})||[];
        for(const [index,part] of parts.entries()){
          if(index===2){part?.destroy?.();continue;}
          if(part)o.add(part);
        }
      }catch(error){console.warn('[Tokyo SHIFT] Championship rival car preview',error);}
    }
  }else o.label(993,615,active?'NEXT RACE  /  '+next:st+'  /  EVENT RECORDED',
    20,active?GOLD:PALE,{width:525,stroke:true});
  if(s.proError)o.label(995,646,String(s.proError).slice(0,100),17,
    '#ffacb2',{width:515,stroke:true});

  // Knockouts uses the glowing sprite hotspots found in other briefings.
  // Preserve the existing one-use Sayaka advice transaction on activation.
  if(stage==='KNOCKOUT'){
    const glow=(x,y,w,label,onClick,disabled=false)=>
      addProGlowingHotspot(s,o.add,{x,y,w,h:44,label,onClick,disabled});
    const adviceRound=state.knockout?.round||0;
    const lastAdviceRound=Number(state.lastSayakaKnockoutRound);
    const onCooldown=Number.isInteger(lastAdviceRound)&&
      lastAdviceRound>=adviceRound-1;
    const showAdviceDialogue=message=>{
      const nodes=[];
      const add=n=>{nodes.push(n);return n;};
      const close=()=>nodes.forEach(n=>n.destroy?.());
      add(s.add.rectangle(780,420,1560,840,0x030711,.63)
        .setDepth(270).setInteractive());
      add(s.add.rectangle(780,417,790,260,0xf8f7f1,1)
        .setStrokeStyle(3,0x8b99a5).setDepth(271));
      add(s.add.text(437,322,'SAYAKA  /  RACE STRATEGY',{
        fontFamily:DISPLAY,fontSize:'25px',fontStyle:'bold',color:'#172d43',
      }).setDepth(272));
      add(s.add.text(437,383,message,{
        fontFamily:BODY,fontSize:'23px',color:'#182e41',
        wordWrap:{width:690},lineSpacing:6,
      }).setDepth(272));
      add(s.add.rectangle(780,508,200,39,0x24485f,1)
        .setDepth(273).setInteractive({useHandCursor:true})
        .on('pointerdown',close));
      add(s.add.text(780,508,'CONTINUE',{
        fontFamily:PIXEL,fontSize:'12px',color:'#ffffff',
      }).setOrigin(.5).setDepth(274));
    };
    glow(265,465,220,'SAYAKA ADVICE',()=>{
      const current=circuit(s).activeChampionship;
      if(!current||current.id!==state.id)return;
      if(onCooldown){
        showAdviceDialogue('Sayaka needs one full heat between strategy briefings. Come back after your next race.');
        return;
      }
      if(!active)return;
      const note=getEventAdvice(current,stage);
      const updated={...current,lastSayakaKnockoutRound:adviceRound,
        adviceByEvent:{...(current.adviceByEvent||{}),[stage]:note}};
      try{
        saveProTransaction(s.registry,{proCircuit:{...c,activeChampionship:updated}});
        s.proError=null;
        showAdviceDialogue(note);
      }catch(error){s.proError=error.message;}
    },!active);
    glow(698,465,198,'CAR SETUP',()=>openPaddock(s,state,'DRIVER'),!active);
    glow(1420,465,205,'EVENT DETAILS',()=>showEvent(s,stage,actions,
      displayMode==='DETAILS'?'BRACKET':'DETAILS',bracketHalf));
  }else advicePanel(s,o,state,stage,42,650,906);
  if(stage==='KNOCKOUT'){
    const chosen=s.registry.get('selectedCarId');
    const chosenName=cars[chosen]?.shortName||cars[chosen]?.name||'SELECT CAR IN PADDOCK';
    o.button(1230,729,338,70,active?'GO TO GRID':'EVENT COMPLETE',
      ()=>enterGrid(),{red:active,disabled:!active,subtitle:chosenName});
    o.button(1230,795,338,34,'RETURN TO HUB',
      ()=>showTokyoChampionshipScreens(s,{view:'HUB',actions}));
    return;
  }
  o.button(186,794,280,48,'CHAMPIONSHIP HUB',
    ()=>showTokyoChampionshipScreens(s,{view:'HUB',actions}));
  o.button(474,794,260,48,'PRO PADDOCK',
    ()=>openPaddock(s,state,'DRIVER'),{disabled:!active});
  o.button(743,794,260,48,'CREW PADDOCK',
    ()=>showPaddockCrewPicker(s,actions,[]),{disabled:!active});
  o.button(1255,794,525,48,active?'GO TO GRID  /  '+next:'RETURN TO HUB',()=>enterGrid(),{red:active});
  function enterGrid(){
    if(!active)return showTokyoChampionshipScreens(s,{view:'HUB',actions});
    if(stage==='CREW')return showCarPicker(s,stage,actions);
    const selected=s.registry.get('selectedCarId');
    const roster=c.registeredDriverCars||[];
    const carId=(state.devBypass||roster.includes(selected))&&selected||
      state.driverCarId||roster[0];
    if(!carId){s.proError='SELECT A REGISTERED CAR IN PRO PADDOCK';
      return showEvent(s,stage,actions);}
    if(!actions.startRace(stage==='KNOCKOUT'?'CHAMP_KO':'CHAMP_FOUR',carId))
      showTokyoChampionshipScreens(s,{view:stage,actions});
  }
}

function showFullKnockout(s,actions){
  const state=circuit(s).activeChampionship;
  const o=canvas(s,'KNOCKOUT');o.actions=actions;
  o.panel(780,422,1450,675,.97,0x7297b5);
  o.headline(91,95,'THE ROAD TO THE FINAL  /  16 DRIVERS',33,GOLD);
  const entrants=new Map(state.entrants.map(row=>[row.id,row]));
  const rounds=state.knockout?.bracket||seedKnockoutBracket(state.entrants);
  const history=state.knockout?.results||[];
  const left=[95,450,805,1160],cellW=294,top=176,pitch=57;
  const center=(r,i)=>top+pitch*(2**r)*(i+.5);
  const g=o.add(s.add.graphics().setDepth(224));
  g.lineStyle(2,0x88a5c2,.85);
  for(let round=0;round<3;round++)
    for(let i=0;i<8/(2**round);i++){
      const y=center(round,i),parent=center(round+1,Math.floor(i/2));
      const mid=left[round]+cellW+23;
      g.lineBetween(left[round]+cellW,y,mid,y);
      g.lineBetween(mid,y,mid,parent);
      g.lineBetween(mid,parent,left[round+1],parent);
    }
  ['ROUND OF 16','QUARTERFINALS','SEMIFINALS','GRAND FINAL'].forEach((title,i)=>
    o.headline(left[i],150,title,20,GOLD,cellW));
  const name=id=>id==='player:driver'?'YOU':
    id?(entrants.get(id)?.name||'RIVAL'):'TO BE DECIDED';
  for(let round=0;round<4;round++){
    for(let i=0;i<8/(2**round);i++){
      const pair=rounds[round]?.[i]||[null,null],y=center(round,i);
      const winner=history[round]?.matches?.[i]?.winner,
        player=pair.includes('player:driver');
      o.panel(left[round]+cellW/2,y,cellW,51,.93,player?0xcba15b:0x4a687f);
      pair.forEach((id,j)=>{
        const color=id==='player:driver'?GOLD:
          winner&&winner!==id?'#7c91a3':id?PALE:MUTED;
        o.label(left[round]+13,y-22+j*24,name(id).slice(0,28),18,color,
          {width:cellW-26});
      });
    }
  }
  o.button(780,782,460,48,'BACK TO KNOCKOUT BRIEFING',
    ()=>showTokyoChampionshipScreens(s,{view:'KNOCKOUT',actions}));
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
      (state.devBypass?owned:Array.isArray(c.registeredDriverCars)?c.registeredDriverCars:owned))
        .filter(id=>owned.includes(id)&&cars[id]&&!cars[id].ginzaDemo&&
          !cars[id].crewLoan&&(state.devBypass||!getProSeasonDriverCarError(c,id)));
  o.panel(780,438,1330,540,.94);
  o.label(103,179,crew?'SELECT A DIFFERENT RECRUITED CREW CAR FOR THIS HEAT':
    (state.devBypass?'TEST MODE / CHOOSE ONE OWNED CAR / LOCKED FOR SOLO STAGES':
      'CHOOSE ONE REGISTERED DRIVER CAR / LOCKED FOR KNOCKOUTS AND FOUR-WIDE'),
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
export function showTokyoChampionshipScreens(s,{view='HUB',driverId=null,profileHubPage=null,actions}={}){
  const state=circuit(s).activeChampionship;
  if(!state)return;
  const target=view==='EVENT'?state.stage:EVENTS[view]?view:view;
  const assetView=target==='BRACKET'?'KNOCKOUT':target==='CREW_PICK'?'CREW':EVENTS[target]?target:'HUB';
  if(loadAssets(s,assetView,()=>showTokyoChampionshipScreens(s,{view,driverId,profileHubPage,actions})))return;
  if(target==='CREW_PICK')return showCarPicker(s,'CREW',actions);
  if(target==='BRACKET')return showFullKnockout(s,actions);
  if(target==='STANDINGS')return showStandings(s,actions);
  if(target==='PROFILE'){
    const rows=championshipStandings(state);
    const position=rows.findIndex(row=>row.id===driverId);
    const page=profileHubPage===null?
      (position>=8?1:0):profileHubPage;
    return showHub(s,actions,{displayProfileId:driverId,standingsPage:page});
  }
  if(target==='RULES')return showRules(s,actions);
  if(target==='RESULT')return showResult(s,actions);
  if(EVENTS[target])return showEvent(s,target,actions);
  showHub(s,actions);
  actions?.onHubRendered?.();
}
