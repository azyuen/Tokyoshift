// R617 — two-tap Professional Circuit finish. All amounts and placements are
// recorded upstream; this file renders only saved results and real garage cars.
import { characters, getCharacterAssetUrl, getCharacterVisualAsset } from '../data/characters.js?v=20261017-r578';
import { cars } from '../data/cars.js?v=20261011-r479';
import {
  preloadCarAppearanceAssets,preloadCarWheel,ensureDerivedModularCarTextures,getCarPaintColor,
} from '../vehicles/CarAppearance.js?v=20261020-r617';

const W=1560,H=840;
const BG_KEY='proVictoryDragstripDayR617';
const BG_URL='assets/CentralTokyo/tokyo_dragstrip_day.png?v=20261020-r617';
const BODY='"Rajdhani", sans-serif';
const HEAD='"Exo 2", sans-serif';
const PIXEL='"Silkscreen", monospace';
const RED=0xe04a61;
const yen=n=>'¥'+Math.max(0,Number(n)||0).toLocaleString('en-US');
const short=(text,length=42)=>String(text||'').length>length?
  String(text).slice(0,length-1)+'…':String(text||'');
const time=n=>Number.isFinite(Number(n))&&Number(n)>0?Number(n).toFixed(3)+'s':'—';

function characterVisual(id,kind){
  if(!id)return null;
  const pose=id==='sayakaFujieda'?(kind==='loss'?'trackSerious':'trackHappy'):
    kind==='loss'?'loss':'win';
  return getCharacterVisualAsset(id,pose,{proCircuit:true}) ||
    getCharacterVisualAsset(id,'idle',{proCircuit:true});
}
function resultsCast(s,options){
  const captain=s.registry.get('playerCharacterId')||'renMizuno';
  if(options.kind!=='crew')return ['sayakaFujieda',captain,'daichiSakamoto'];
  const mates=(options.crewIds||[]).slice(0,3);
  // The player remains the foremost, middle portrait, never a crew opponent.
  return [mates[0],captain,mates[1],mates[2]];
}
function resultCars(s,options){
  const ids=options.kind==='crew'?
    (options.carIds||options.heats?.map(h=>h.carId)||[]).slice(0,3):
    [options.carId||s.registry.get('selectedCarId')].filter(Boolean);
  return [...new Set(ids.filter(id=>cars[id]))];
}
export function queueProVictoryAssets(s,ids=[],kind='win',carIds=[]){
  let count=0;
  if(!s.textures.exists(BG_KEY)){
    s.load.image(BG_KEY,BG_URL);count++;
  }
  for(const id of [...new Set(ids.filter(Boolean))]){
    const sprite=characterVisual(id,kind);
    if(sprite?.key&&sprite.path&&!s.textures.exists(sprite.key)){
      s.load.image(sprite.key,getCharacterAssetUrl(sprite.path));count++;
    }
  }
  const states=s.registry.get('carStates')||{};
  const unique=[...new Set(carIds)].filter(id=>cars[id]);
  const map=Object.fromEntries(unique.map(id=>[id,cars[id]]));
  count+=preloadCarAppearanceAssets(s,map,'20261020-r617');
  for(const id of unique)count+=preloadCarWheel(s,cars[id],states[id]||{});
  return count;
}

function heatLabel(h,i,isCrew){
  const won=isCrew?Boolean(h?.won):h?.won!==false;
  const result=String(h?.result||(isCrew&&h?.place?'P'+h.place+'/4':
    h?.tied?'DRAW':won?'WIN':'LOSS'));
  return {
    title:short(h?.name||h?.label||'PRO RIVAL',26),
    number:h?.roundNumber||i+1,result,won,
    clock:h?.ownStatus&&h.ownStatus!=='FINISHED'?h.ownStatus:
      Number(h?.ownSeconds)>0?time(h.ownSeconds):'COMPLETE',
  };
}

// Caller must have saved the competition before calling this. All car previews
// use the production car renderer: paint, wheels and reference geometry match.
export function showProVictoryResults(s,options={}){
  const crew=options.kind==='crew',winner=options.winner!==false;
  const cast=resultsCast(s,options);
  const carIds=resultCars(s,options);
  const carMap=Object.fromEntries(carIds.map(id=>[id,cars[id]]));
  if(s._proVictoryLoading)return;
  const queued=queueProVictoryAssets(s,cast,winner?'win':'loss',carIds);
  if(queued>0){
    // A crew finish can enter the screen from a saved fixture after reload.
    s._proVictoryLoading=true;
    const bg=s.add.rectangle(W/2,H/2,W,H,0x0b1320,.98).setDepth(300).setInteractive();
    const title=s.add.text(W/2,H/2,'PREPARING EVENT RESULTS',{
      fontFamily:PIXEL,fontSize:'17px',color:'#f1eceb',
    }).setOrigin(.5).setDepth(301);
    const cleanup=()=>{bg.destroy();title.destroy();s._proVictoryLoading=false;};
    const loaded=()=>{
      s.events.off('shutdown',stopped);
      cleanup();
      if(s.sys?.isActive?.())showProVictoryResults(s,options);
    };
    const stopped=()=>{s.load.off('complete',loaded);cleanup();};
    s.events.once('shutdown',stopped);
    s.load.once('complete',loaded);
    s.load.start();
    return;
  }
  drawResults(s,options,cast,carMap);
}

function drawResults(s,options,cast,carMap){
  s._proOverlayClose?.();
  const crew=options.kind==='crew',winner=options.winner!==false;
  ensureDerivedModularCarTextures(s,carMap);
  const nodes=[],masks=[],details=[];
  let stage=0,closed=false,armed=false,key=null,stageDetail=false;
  const add=(o,depth)=>{
    if(depth!==undefined)o.setDepth(depth);
    nodes.push(o);
    if(stageDetail){o.setAlpha(0);details.push(o);}
    return o;
  };
  const panel=(x,y,w,h,color=0x081321,opacity=.82,outline=0x3c4654,depth=244)=>{
    const node=add(s.add.rectangle(x,y,w,h,color,opacity).setStrokeStyle(1,outline,.85),depth);
    return node;
  };
  const label=(x,y,value,size=20,style={},depth=249)=>{
    const node=add(s.add.text(x,y,String(value),{
      fontFamily:BODY,fontSize:size+'px',fontStyle:'700',color:'#f5f2f1',
      ...style,
    }).setFontSize(size),depth);
    return node;
  };
  const close=()=>{
    if(closed)return;
    closed=true;
    s.events.off('shutdown',close);
    key?.off?.('down',advance);
    if(s._proOverlayClose===close)s._proOverlayClose=null;
    nodes.forEach(o=>{try{s.tweens?.killTweensOf?.(o);o.destroy();}catch(_){}});
    masks.forEach(o=>{try{o.destroy();}catch(_){}});
  };
  s._proOverlayClose=close;
  s.events.once('shutdown',close);

  // One authored scene image across ALL 1560x840; never a floating modal
  // or the former bespoke dark photo/banner/floor presentation.
  add(s.add.image(W/2,H/2,BG_KEY).setDisplaySize(W,H),210);
  add(s.add.rectangle(W/2,H/2,W,H,0x06101d,.17),211);

  // Actual garage cars sit on the visible right-hand road, behind the HUD.
  // The preview is side-on because Tokyo SHIFT's vehicle assets are side-on.
  // Depths are lower than the result cards and characters.
  const carIds=Object.keys(carMap);
  const spots=crew?
    [{x:1020,y:590,w:335},{x:1264,y:665,w:305},{x:1432,y:728,w:270}]:
    [{x:1214,y:628,w:530}];
  carIds.slice(0,crew?3:1).forEach((id,i)=>{
    if(typeof s.createCarDisplay!=='function')return;
    const info=spots[i],state=(s.registry.get('carStates')||{})[id]||{};
    try{
      const parts=s.createCarDisplay(carMap[id],info.x,info.y,info.w,216+i*.1,
        getCarPaintColor(state),null,false,state);
      (parts||[]).forEach(p=>{if(p)nodes.push(p);});
    }catch(e){
      console.warn('[Tokyo SHIFT] Victory car preview unavailable:',id,e);
    }
  });

  // A taller, closer, tightly grouped cast. The lead protagonist is drawn in
  // front of the others; sprites never hide the official result copy.
  const positions=crew?[
    {x:105,h:705,w:305,z:222},
    {x:331,h:850,w:440,z:227},
    {x:535,h:690,w:300,z:225},
    {x:677,h:650,w:277,z:223},
  ]:[
    {x:112,h:700,w:305,z:223},
    {x:350,h:860,w:445,z:227},
    {x:637,h:680,w:290,z:225},
  ];
  const shape=s.make.graphics({add:false});
  shape.fillStyle(0xffffff,1).fillRect(0,0,790,H);
  masks.push(shape);
  const crop=shape.createGeometryMask();
  positions.map((p,i)=>({...p,i})).sort((a,b)=>a.z-b.z).forEach(({x,h,w,z,i})=>{
    const v=characterVisual(cast[i],winner?'win':'loss');
    if(!v?.key||!s.textures.exists(v.key))return;
    const tex=s.textures.get(v.key).getSourceImage();
    const width=Math.max(1,tex.naturalWidth||tex.width);
    const height=Math.max(1,tex.naturalHeight||tex.height);
    const scale=Math.min(w/width,h/height);
    const node=add(s.add.image(x,860,v.key).setOrigin(.5,1)
      .setScale(scale).setMask(crop),z);
    node.setAlpha(0);
    s.tweens.add({targets:node,alpha:1,duration:380,delay:60*i});
  });

  // The only opaque treatment in the opening beat is the TOP RIGHT panel.
  panel(1167,201,748,300,0x08101e,.88,0,241);
  const bar=add(s.add.graphics(),248);
  bar.fillStyle(RED,1).fillPoints([
    new Phaser.Geom.Point(806,75),new Phaser.Geom.Point(821,75),
    new Phaser.Geom.Point(799,189),new Phaser.Geom.Point(784,189)],true);
  label(840,73,'// PROFESSIONAL CIRCUIT',24,{color:'#e4e2e6'});
  label(840,112,short((options.eventName||'PROFESSIONAL EVENT').toUpperCase(),35),17,
    {fontFamily:PIXEL,color:'#afb5c4'});
  const headline=winner?(crew?'CREW VICTORY':'EVENT WINNER'):
    (crew?'CREW RESULT':'EVENT COMPLETE');
  const head=label(839,146,headline,64,{
    fontFamily:HEAD,fontStyle:'900 italic',stroke:'#151019',strokeThickness:3,
  });
  if(head.width>650)head.setScale(650/head.width);
  label(844,235,short(crew?'YOUR CREW vs '+(options.opponent||'PRO CIRCUIT'):
    (options.opponent||'DRIVER CHALLENGE'),52),23,{color:'#d7d5dc'});
  const heats=(options.heats||[]);
  const wonCount=options.wins!=null?Number(options.wins):
    heats.filter(h=>h.won).length;
  const total=options.rounds||Math.max(3,heats.length);
  label(844,277,crew&&Number.isFinite(options.fourWidePoints)?
    'FOUR-WIDE TOTAL  '+options.fourWidePoints+' / 9':
    'HEATS WON  '+wonCount+' / '+total,31);
  const perfect=winner&&(crew?
    Number(options.fourWidePoints)===9||heats.length===3&&wonCount===3:
    heats.length>=3&&wonCount===heats.length);
  if(perfect){
    panel(1435,326,163,44,0x402c13,.88,0xc3a04a,246);
    label(1435,313,crew&&Number(options.fourWidePoints)===9?
      'PERFECT 9/9':'CLEAN SWEEP',19,{color:'#ffdfa0'}).setOrigin(.5,0);
  }

  // SECOND BEAT: results are authored once but hidden until the first tap.
  stageDetail=true;
  // This panel occupies only the bottom-right part of the same image.
  panel(1167,589,748,480,0x071120,.83,0x465264,241);
  const rows=heats.length?heats.slice(-3):[{name:'FINAL RESULT',won:winner}];
  rows.forEach((h,i)=>{
    const y=382+i*65,display=heatLabel(h,i,crew);
    panel(1167,y+21,702,55,0x0b1829,.84,0x3c4758,243);
    add(s.add.rectangle(835,y+21,5,55,display.won?RED:0x606b80),244);
    label(850,y+8,'HEAT '+display.number,19);
    label(970,y+8,display.result,18,{color:display.won?'#ff6d81':'#d3d7e0'});
    label(1087,y+4,display.title,19);
    label(1087,y+29,display.clock,17,{color:'#b2bece'});
  });

  // The recorded cash, official point type and rank; no invented reward types.
  label(843,590,'EVENT PRIZE',17,{color:'#adb4c1'});
  label(1023,579,yen(options.cashPrize),29,{color:'#ffdf91'});
  if(Number(options.sponsorBonus||0)>0)
    label(1023,615,'SPONSOR +'+yen(options.sponsorBonus)+
      '  ('+Number(options.sponsorPercent||0)+'%)',14,{color:'#edc993'});
  label(843,638,options.openCircuit?'OPEN CIRCUIT':'SEASON POINTS',17,{color:'#adb4c1'});
  label(1023,633,options.openCircuit?'NO SEASON PTS':
    '+'+Number(options.points||0),23);
  label(843,687,'PRO RANK',17,{color:'#adb4c1'});
  label(1023,680,options.rankBefore&&options.rankAfter?
    '#'+options.rankBefore+'  →  #'+options.rankAfter:'EVENT RECORDED',20);
  add(s.add.rectangle(1249,654,2,151,0x404d62),244);
  label(1269,590,'STATUS',17,{color:'#adb4c1'});
  label(1269,616,winner?'WINNER':'FINISHED',26,{color:winner?'#ffdf91':'#f5f2ef'});
  label(1269,675,options.openCircuit?'OPEN EVENT':'OFFICIAL RESULT',16,
    {color:'#adb4c1'});
  label(1269,698,short(options.statusLabel||'RESULT RECORDED',22),18);

  panel(1167,778,700,61,0x651e2d,1,0xf35d6c,245);
  label(1167,755,options.nextLabel||'CONTINUE',28).setOrigin(.5,0);
  stageDetail=false;

  // Full-screen hit target is above the artwork but does NOT swallow any
  // unrelated scene navigation once the awards close. ENTER is equivalent.
  const advance=()=>{
    if(closed||!armed)return;
    if(stage===0){
      stage=1;armed=false;
      details.forEach(obj=>obj.setAlpha(1));
      s.time.delayedCall(220,()=>{if(!closed)armed=true;});
      return;
    }
    close();
    options.onContinue?.();
  };
  add(s.add.rectangle(W/2,H/2,W,H,0xffffff,.001)
    .setInteractive({useHandCursor:true}).on('pointerdown',advance),290);
  key=s.input.keyboard?.addKey?.(Phaser.Input.Keyboard.KeyCodes.ENTER);
  if(key)key.on('down',advance);
  s.time.delayedCall(360,()=>{if(!closed)armed=true;});
  return {close};
}
