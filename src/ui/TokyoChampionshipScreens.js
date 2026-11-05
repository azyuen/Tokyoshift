// Tokyo SHIFT — unified Championship Hub and three dedicated event briefings.
// Only presentation, navigation and one-use strategy notes live here.
// Authoritative scoring, car locks and race settlement remain in the existing modules.
import { championshipStandings, seedKnockoutBracket, getChampionshipKnockoutHeat, getChampionshipCrewHeat,
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

function hubRivals(s){
  const state=circuit(s).activeChampionship;
  return (state?.entrants||[]).filter(e=>e.id!=='player:driver'&&e.characterId)
    .sort((a,b)=>a.seed-b.seed).slice(0,2).map(entry=>({
      ...entry,asset:getCharacterVisualAsset(entry.characterId,'idle',{
        playerCharacterId:s.registry.get('playerCharacterId')||'renMizuno',
        proCircuit:true,rivalContext:true,
      }),
    }));
}
function portraitAssets(s,stage){
  const out=[['champSayaka','assets/Characters/Main/race_sayaka_fujieda_idle.png']];
  if(stage)out.push(['champDaichi','assets/Characters/Main/pro_daichi_sakamoto.png']);
  else for(const rival of hubRivals(s))if(rival.asset?.key&&rival.asset?.path)
    out.push([rival.asset.key,rival.asset.path]);
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
    s.events.off('shutdown',clear);
    s.load.off('complete',finish);};
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
    const rivals=hubRivals(s);
    sprite(s,o,rivals[0]?.asset?.key,557,582,340,175);
    sprite(s,o,player?.key,738,581,386,215);
    sprite(s,o,rivals[1]?.asset?.key,920,582,344,180);
    sprite(s,o,'champSayaka',1080,583,355,177);
    // These are real seeded Championship rivals, not arbitrary decorative sprites.
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

function showHub(s,actions){
  const c=circuit(s),state=c.activeChampionship,rows=championshipStandings(state);
  const me=rows.find(r=>r.id==='player:driver');
  const place=rows.indexOf(me)+1;
  const current=state.stage;
  const o=canvas(s,'HUB');o.actions=actions;
  mainSprites(s,o,'HUB');

  // A championship broadcast: two small information wings, the cast in the centre,
  // and one three-stage competition ribbon. Never stack boxes across the artwork.
  o.headline(45,87,'TOKYO CHAMPIONSHIP',45,GOLD);
  o.label(47,146,'16 DRIVERS   /   THREE EVENTS   /   ONE TOKYO CHAMPION',18,PALE);

  o.panel(245,326,405,306,.84,0x61758b);
  panelTitle(o,61,188,'LIVE STANDINGS');
  const shortlist=rows.slice(0,5);
  if(place>5)shortlist[4]=me;
  shortlist.forEach((r,i)=>{
    const y=231+i*36,own=r.id==='player:driver';
    o.label(65,y,'#'+(rows.indexOf(r)+1),20,own?GOLD:PALE);
    o.label(117,y,standingName(c,r).slice(0,17),20,own?GOLD:PALE);
    o.label(428,y,r.total+' PTS',18,own?GOLD:MUTED).setOrigin(1,0);
    const hit=o.add(s.add.rectangle(241,y+12,374,34,0,0)
      .setDepth(244).setInteractive({useHandCursor:true}));
    hit.on('pointerdown',()=>showTokyoChampionshipScreens(s,
      {view:'PROFILE',driverId:r.id,actions}));
  });
  o.button(245,444,362,43,'FULL 16-DRIVER STANDINGS',
    ()=>showTokyoChampionshipScreens(s,{view:'STANDINGS',actions}));

  o.panel(1320,323,386,300,.84,0x61758b);
  panelTitle(o,1151,187,'YOUR CHAMPIONSHIP');
  o.headline(1151,220,'RANK  #'+place,34,GOLD,330);
  o.label(1153,269,'TOTAL POINTS   '+me.total+' / 80',20,PALE);
  scoreBar(s,o,1153,310,324,me.total,80);
  o.label(1153,338,'KO '+me.knockout+'   CREW '+me.crew+
    '   FOUR-WIDE '+me.fourWide,17,MUTED,{width:330});
  o.label(1153,379,(state.completed?'CHAMPION  ':'LEADER  ')+
    standingName(c,rows[0])+'  /  '+rows[0].total+' PTS',
    18,GOLD,{width:329});
  o.label(1153,422,state.completed?'CHAMPIONSHIP FINISHED':
    'NEXT  '+(EVENTS[current]?.title||'FINAL RESULTS'),
    16,MUTED,{width:330});

  o.headline(48,574,'THE ROAD TO THE TITLE',26,GOLD);
  o.add(s.add.rectangle(780,683,1510,164,0x071322,.78).setDepth(218));
  STAGES.forEach((stage,i)=>{
    const item=EVENTS[stage],status=statusFor(state,stage);
    const x=43+i*503,w=490,active=status==='ACTIVE';
    const line=active?0xc69a58:status==='COMPLETE'?0x588f7a:0x52667b;
    o.panel(x+w/2,681,w,125,active ? .91 : .8,line);
    o.add(s.add.rectangle(x+w/2,620,w-3,4,line,1).setDepth(225));
    o.headline(x+17,631,item.number+'  '+item.short,25,
      status==='LOCKED'?MUTED:PALE,455);
    o.label(x+18,674,active?'CURRENT EVENT  /  NEXT TO RACE':status,
      17,active?GOLD:MUTED);
    const key=stage==='KNOCKOUT'?'knockout':stage==='CREW'?'crew':'fourWide';
    o.label(x+18,707,me[key]+' / '+item.points+' PTS',20,GOLD);
    o.label(x+472,708,active?'ENTER  >':'VIEW  >',16,
      active?'#f0d4a2':MUTED).setOrigin(1,0);
    const hit=o.add(s.add.rectangle(x+w/2,681,w,125,0,0)
      .setDepth(244).setInteractive({useHandCursor:true}));
    hit.on('pointerdown',()=>showTokyoChampionshipScreens(s,{view:stage,actions}));
  });
  o.button(197,794,303,47,'RIVAL PROFILES',
    ()=>showTokyoChampionshipScreens(s,{view:'STANDINGS',actions}));
  o.button(515,794,303,47,'CHAMPIONSHIP RULES',
    ()=>showTokyoChampionshipScreens(s,{view:'RULES',actions}));
  if(state.completed){
    o.button(1255,794,550,47,'FINAL RESULTS  /  ¥'+fmt(
      TOKYO_CHAMPIONSHIP_PURSES[place-1]),
      ()=>showTokyoChampionshipScreens(s,{view:'RESULT',actions}),{red:true});
  }else if(EVENTS[current]){
    o.button(1255,794,550,47,'ENTER EVENT 0'+(STAGES.indexOf(current)+1)+
      '  /  '+EVENTS[current].short,
      ()=>showTokyoChampionshipScreens(s,{view:current,actions}),{red:true});
  }
}

function eventInfo(s,o,state,stage){
  const x=977,w=535;
  if(stage==='KNOCKOUT'){
    // Real four-round bracket, driven entirely by saved pairings and results.
    // Unknown future opponents remain TBD until their bracket is settled.
    panelTitle(o,x,185,'16-DRIVER KNOCKOUT BRACKET');
    const entrants=new Map((state.entrants||[]).map(e=>[e.id,e]));
    const rounds=state.knockout?.bracket||seedKnockoutBracket(state.entrants);
    const history=state.knockout?.results||[];
    const starts=[980,1114,1248,1382],width=126;
    const centre=(r,i)=>245+(Math.pow(2,r)-1)*21.5+
      i*43*Math.pow(2,r);
    const lines=o.add(s.add.graphics().setDepth(222));
    lines.lineStyle(1,0x89a1b5,.6);
    for(let r=0;r<3;r++)for(let i=0;i<8/(2**r);i++){
      const yy=centre(r,i),parent=centre(r+1,Math.floor(i/2));
      lines.lineBetween(starts[r]+width,yy,starts[r]+130,yy);
      lines.lineBetween(starts[r]+130,yy,starts[r]+130,parent);
      lines.lineBetween(starts[r]+130,parent,starts[r+1],parent);
    }
    const roundNames=['TOP 16','QUARTERS','SEMIS','FINAL'];
    const short=id=>{
      if(!id)return 'TBD';
      if(id==='player:driver')return 'YOU';
      const name=entrants.get(id)?.name||'RIVAL';
      return name.split(' ').slice(-1)[0].slice(0,13);
    };
    for(let r=0;r<4;r++){
      o.label(starts[r]+4,211,roundNames[r],16,r===(
        state.knockout?.round||0)&&state.stage===stage?GOLD:MUTED);
      for(let i=0;i<8/(2**r);i++){
        const pair=rounds[r]?.[i]||[null,null],yy=centre(r,i);
        const winner=history[r]?.matches?.[i]?.winner;
        const mine=pair.includes('player:driver');
        o.panel(starts[r]+width/2,yy,width,37,.85,mine?0xb68a55:0x52667b);
        pair.forEach((id,n)=>{
          const eliminated=!!winner&&winner!==id;
          const color=id==='player:driver'?GOLD:eliminated?'#748699':id?PALE:MUTED;
          o.label(starts[r]+7,yy-17+n*18,short(id),14,color,
            {width:width-12});
        });
      }
    }
    const finished=history.length;
    o.label(x+5,562,'BRACKET ROUNDS COMPLETE  '+finished+' / 4',17,GOLD);
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
      o.label(left+10,511,i===2?'TITLE DECIDER':
        i===0?'TOP 2 ADVANCE':'TOP 2 ADVANCE',16,MUTED);
    }
    o.label(x+6,560,'QUALIFY   >   SEMIFINALS   >   TOKYO TITLE',
      17,GOLD,{width:530});
  }
}

function showEvent(s,stage,actions){
  const c=circuit(s),state=c.activeChampionship;
  const active=state.stage===stage&&!state.completed;
  const st=statusFor(state,stage),event=EVENTS[stage];
  const o=canvas(s,stage);o.actions=actions;
  mainSprites(s,o,stage);
  const standings=championshipStandings(state);
  const position=standings.findIndex(r=>r.id==='player:driver')+1;
  const points=standings.find(r=>r.id==='player:driver')?.total||0;
  o.label(44,82,'TOKYO CHAMPIONSHIP  /  EVENT '+event.number,19,MUTED,
    {font:DISPLAY});
  o.headline(44,119,event.title,41,GOLD,870);
  o.label(46,169,(stage==='KNOCKOUT'?'16-DRIVER ELIMINATION':
    stage==='CREW'?'THREE PLAYER-DRIVEN CREW HEATS':
    'QUALIFYING  /  SEMIFINALS  /  GRAND FINAL')+
    '   /   '+event.points+' POINTS AVAILABLE',18,PALE);
  o.label(1246,88,'RANK #'+position+'  /  '+points+' PTS',
    22,GOLD,{font:DISPLAY,stroke:true}).setOrigin(.5,0);

  // The stage-specific competition visual is the single main information panel.
  o.panel(1245,381,558,424,.85,0x61778e);
  eventInfo(s,o,state,stage);
  const heat=active?heatFor(state):null;
  const next=stage==='KNOCKOUT'?'ROUND '+((heat?.round||0)+1)+
    ' / 4  VS  '+(heat?.opponent?.name||'—'):
    stage==='CREW'?'HEAT '+((heat?.index||0)+1)+
    ' / 3  VS  '+(heat?.opponent?.name||'—'):
    ['QUALIFYING','SEMIFINAL','GRAND FINAL'][heat?.round||0];
  o.label(993,615,active?'NEXT RACE  /  '+next:st+'  /  EVENT RECORDED',
    20,active?GOLD:PALE,{width:525,stroke:true});
  if(s.proError)o.label(995,646,String(s.proError).slice(0,100),17,
    '#ffacb2',{width:515,stroke:true});

  // One dialogue area; the two paddocks are accessible from navigation.
  advicePanel(s,o,state,stage,42,650,906);
  o.button(186,794,280,48,'CHAMPIONSHIP HUB',
    ()=>showTokyoChampionshipScreens(s,{view:'HUB',actions}));
  o.button(474,794,260,48,'PRO PADDOCK',
    ()=>openPaddock(s,state,'DRIVER'),{disabled:!active});
  o.button(743,794,260,48,'CREW PADDOCK',
    ()=>showPaddockCrewPicker(s,actions,[]),{disabled:!active});
  o.button(1255,794,525,48,active?'GO TO GRID  /  '+next:'RETURN TO HUB',()=>{
    if(!active)return showTokyoChampionshipScreens(s,{view:'HUB',actions});
    if(stage==='CREW')return showCarPicker(s,stage,actions);
    const carId=state.driverCarId||s._champSelectedDriverCar||
      s.registry.get('selectedCarId');
    const roster=c.registeredDriverCars;
    if(!state.driverCarId&&Array.isArray(roster)&&roster.length>1)
      return showCarPicker(s,stage,actions);
    if(!carId)return showCarPicker(s,stage,actions);
    if(!actions.startRace(stage==='KNOCKOUT'?'CHAMP_KO':'CHAMP_FOUR',carId))
      showTokyoChampionshipScreens(s,{view:stage,actions});
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
  const assetView=target==='CREW_PICK'?'CREW':EVENTS[target]?target:'HUB';
  if(loadAssets(s,assetView,()=>showTokyoChampionshipScreens(s,{view,driverId,actions})))return;
  if(target==='CREW_PICK')return showCarPicker(s,'CREW',actions);
  if(target==='STANDINGS')return showStandings(s,actions);
  if(target==='PROFILE')return showProfile(s,driverId,actions);
  if(target==='RULES')return showRules(s,actions);
  if(target==='RESULT')return showResult(s,actions);
  if(EVENTS[target])return showEvent(s,target,actions);
  showHub(s,actions);
  actions?.onHubRendered?.();
}
