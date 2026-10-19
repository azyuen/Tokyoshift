// R616: Shared, visual one-page Professional Circuit event awards.
// This is presentation only. Settlement, prize, season points and save guards
// remain owned by proSeason / proTournament / proDragDuel.
import { characters, getCharacterAssetUrl, getCharacterVisualAsset } from '../data/characters.js?v=20261017-r578';

const W=1560,H=840;
const BODY='"Rajdhani", sans-serif';
const HEAD='"Exo 2", sans-serif';
const PIXEL='"Silkscreen", monospace';
const RED=0xd83c50;
const cash=n=>'¥'+Math.max(0,Number(n)||0).toLocaleString('en-US');
const seconds=n=>Number.isFinite(Number(n))&&Number(n)>0?Number(n).toFixed(3)+'s':'—';
const trim=(t,length=34)=>String(t||'').length>length?String(t).slice(0,length-1)+'…':String(t||'');

function visualFor(id,kind){
  const pose=id==='sayakaFujieda'?'trackHappy':kind==='loss'?'loss':'win';
  return getCharacterVisualAsset(id,pose)||getCharacterVisualAsset(id,'idle');
}
export function queueProVictoryAssets(s,ids,kind='win'){
  let count=0;
  for(const id of [...new Set(ids||[])]) {
    const v=visualFor(id,kind);
    if(v?.key&&v.path&&!s.textures.exists(v.key)) {
      s.load.image(v.key,getCharacterAssetUrl(v.path));
      count++;
    }
  }
  return count;
}

function heatText(h,i,crew) {
  const status=h?.ownStatus&&h.ownStatus!=='FINISHED'?h.ownStatus:
    Number.isFinite(Number(h?.ownSeconds))&&Number(h.ownSeconds)>0?
    seconds(h.ownSeconds):h?.status||'COMPLETE';
  const success=crew?h?.place===1||Boolean(h?.won):h?.won!==false;
  return {
    name:trim(h?.name||h?.label||('HEAT '+(i+1)),27),
    result:h?.result||(crew&&h?.place?'P'+h.place+'/4':success?'WIN':h?.tied?'DRAW':'LOSS'),
    time:status,
    positive:success,
  };
}

// Width and placement are in the real 1560 x 840 Drag Complex scene.
// The same scene is used for driver and crew finals, including open-circuit.
export function showProVictoryResults(s,options={}) {
  const crew=options.kind==='crew';
  const winner=options.winner!==false;
  const characterId=s.registry.get('playerCharacterId')||'renMizuno';
  const ids=(crew?[characterId,...(options.crewIds||[]).slice(0,3)]:
    ['sayakaFujieda',characterId,'daichiSakamoto']);
  const required=ids.map(id=>visualFor(id,winner?'win':'loss')).filter(Boolean);
  const unloaded=required.filter(v=>v.key&&v.path&&!s.textures.exists(v.key));
  if(unloaded.length) {
    // Loading is asynchronous but does not change the saved competition.
    if(s._proVictoryLoading)return;
    s._proVictoryLoading=true;
    const veil=s.add.rectangle(W/2,H/2,W,H,0x090c14,.98).setDepth(290).setInteractive();
    const notice=s.add.text(W/2,H/2,'PREPARING EVENT AWARDS',{
      fontFamily:PIXEL,fontSize:'18px',color:'#f7f3f3'
    }).setOrigin(.5).setDepth(291);
    const clean=()=>{veil.destroy();notice.destroy();s._proVictoryLoading=false;};
    const done=()=>{s.events.off('shutdown',stopped);clean();
      if(s.sys?.isActive?.())showProVictoryResults(s,options);};
    const stopped=()=>{s.load.off('complete',done);clean();};
    s.events.once('shutdown',stopped);
    s.load.once('complete',done);
    queueProVictoryAssets(s,ids,winner?'win':'loss');
    s.load.start();
    return;
  }

  s._proOverlayClose?.();
  let nodes=[],shapes=[],closed=false,armed=false;
  const add=(obj,depth=220)=>{nodes.push(obj.setDepth(depth));return obj;};
  const panel=(x,y,w,h,fill=0x0b101b,alpha=.96,stroke=0x374153)=>{
    const r=add(s.add.rectangle(x,y,w,h,fill,alpha),226);
    if(stroke)r.setStrokeStyle(1,stroke,.85);
    return r;
  };
  const label=(x,y,value,size=20,opts={})=>add(s.add.text(x,y,String(value),{
    fontFamily:BODY,fontSize:size+'px',fontStyle:'700',color:'#f5f2f1',
    ...opts,
  }),235);
  const close=()=>{
    if(closed)return;
    closed=true;
    s.events.off('shutdown',close);
    if(s._proOverlayClose===close)s._proOverlayClose=null;
    nodes.forEach(o=>{try{s.tweens?.killTweensOf?.(o);o.destroy();}catch(_){}});
    shapes.forEach(o=>{try{o.destroy();}catch(_){}});
  };
  s._proOverlayClose=close;
  s.events.once('shutdown',close);

  // Existing venue artwork stays visible through the twilight overlay.
  add(s.add.rectangle(780,420,W,H,0x05070c,.88).setInteractive(),210);
  add(s.add.rectangle(780,35,W,70,0x060b14,.98).setStrokeStyle(1,0x343942),213);
  label(46,16,'TOKYO',37,{fontFamily:HEAD,fontStyle:'900 italic'});
  label(168,16,'SHIFT',37,{fontFamily:HEAD,fontStyle:'900 italic',color:'#e23c4c'});
  label(348,24,'PROFESSIONAL CIRCUIT',25,{fontFamily:HEAD});
  label(710,27,'CENTRAL // '+(options.openCircuit?'OPEN CIRCUIT':'PRO SEASON'),18,{color:'#9399a6'});
  label(1514,22,'TOKYO DRAG COMPLEX // '+(crew?'CREW':'DRIVER'),14,
    {fontFamily:PIXEL,color:'#aaaeb8'}).setOrigin(1,0);

  // Subtle floor accent and three contrasting character silhouettes.
  add(s.add.rectangle(377,789,754,100,0x38101a,.30),215);
  const shape=s.make.graphics({add:false});
  shape.fillStyle(0xffffff,1).fillRect(0,72,775,768);
  shapes.push(shape);
  const mask=shape.createGeometryMask();
  const positions=crew?
    [{x:120,h:495,w:285,z:219},{x:370,h:660,w:385,z:223},
     {x:565,h:500,w:290,z:220},{x:722,h:465,w:270,z:218}]:
    [{x:140,h:485,w:300,z:219},{x:378,h:690,w:425,z:223},
     {x:630,h:490,w:288,z:221}];
  // Draw back to front to retain the protagonist's raised-fist silhouette.
  const order=positions.map((p,i)=>i).sort((a,b)=>positions[a].z-positions[b].z);
  for(const i of order) {
    const v=visualFor(ids[i],winner?'win':'loss'),p=positions[i];
    if(!v?.key||!s.textures.exists(v.key))continue;
    const tex=s.textures.get(v.key).getSourceImage();
    const width=Math.max(1,tex.naturalWidth||tex.width),height=Math.max(1,tex.naturalHeight||tex.height);
    const scale=Math.min(p.w/width,p.h/height);
    const img=add(s.add.image(p.x,818,v.key).setOrigin(.5,1)
      .setScale(scale).setMask(mask),p.z);
    // Tiny fade makes final awards appear as a reveal, without blocking taps.
    img.setAlpha(0);
    s.tweens.add({targets:img,alpha:1,duration:360,delay:i*70});
    const name=characters[ids[i]]?.name||'DRIVER';
    label(p.x,784,trim(name.toUpperCase(),19),12,{
      fontFamily:PIXEL,color:i===(crew?1:1)?'#ffffff':'#adb3c0',
      backgroundColor:'#080a10',padding:{x:6,y:4}
    }).setOrigin(.5,0);
  }

  // Results are rendered above any part of the art that approaches the split.
  panel(1166,457,764,766,0x080c14,.965,0x303847);
  const title=winner?(crew?'CREW VICTORY':'EVENT WINNER'):
    (crew?'CREW RESULT':'EVENT COMPLETE');
  label(817,91,'// PROFESSIONAL CIRCUIT',22,{color:'#f1ebeb'});
  label(817,122,trim((options.eventName||'PROFESSIONAL EVENT').toUpperCase(),46),17,
    {fontFamily:PIXEL,color:'#949aaa'});
  const accent=add(s.add.graphics(),232);
  accent.fillStyle(RED,1).fillPoints([
    new Phaser.Geom.Point(790,103),new Phaser.Geom.Point(804,103),
    new Phaser.Geom.Point(778,210),new Phaser.Geom.Point(765,210)],true);
  label(812,159,title,72,{fontFamily:HEAD,fontStyle:'900 italic',color:'#fffafa',
    stroke:'#171014',strokeThickness:3});
  label(820,249,trim(options.opponent?
    (crew?'YOUR CREW vs '+options.opponent:options.opponent):
    (crew?'YOUR CREW':'PROFESSIONAL EVENT'),47),24,{color:'#d4d8e0'});

  const heats=(options.heats||[]).slice(0,5);
  const available=heats.length;
  const totalWins=heats.filter(h=>crew?
    h?.place===1||h?.won:h?.won!==false).length;
  const perfect=winner&&(crew?
    Number(options.fourWidePoints)===9||available===3&&totalWins===3:
    available>=3&&totalWins===available);
  label(820,291,crew&&Number.isFinite(options.fourWidePoints)?
    'AGGREGATE  '+options.fourWidePoints+' / 9':
    (winner?'HEATS WON  '+(options.wins??totalWins)+' / '+(options.rounds||Math.max(3,available)):
      'EVENT RESULT'),30);
  if(perfect) {
    panel(1425,308,166,58,0x3b2b0e,.90,0xc3a250);
    label(1425,291,crew?'PERFECT 9/9':'CLEAN SWEEP',20,{color:'#ffdf89'}).setOrigin(.5,0);
  }

  const rows=heats.length?heats:[{name:'FINAL RESULT',won:winner}];
  const rowY=356,step=65;
  rows.slice(0,3).forEach((h,i)=>{
    const y=rowY+i*step,display=heatText(h,i,crew);
    panel(1167,y+26,704,58,0x111723,.98,0x384052);
    add(s.add.rectangle(817,y+26,5,58,display.positive?RED:0x676a78),232);
    label(838,y+9,'HEAT '+(i+1),19,{color:'#f4eded'});
    label(967,y+10,display.result,18,{color:display.positive?'#ff6478':'#bec4ce'});
    label(1060,y+4,display.name,19,{color:'#dce1e6'});
    label(1060,y+29,display.time,17,{color:'#a9b7c9'});
  });

  const bottom=574;
  panel(1167,674,704,194,0x0b121d,.98,0x4a4450);
  label(837,bottom+16,'EVENT PRIZE',17,{color:'#a5acb8'});
  label(1038,bottom+9,cash(options.cashPrize),29,{color:'#ffe4b5'});
  label(837,bottom+70,options.openCircuit?'OPEN CIRCUIT':'SEASON POINTS',17,
    {color:'#a5acb8'});
  label(1038,bottom+63,options.openCircuit?'NO SEASON PTS':
    '+'+Number(options.points||0),22,{color:'#f5efed'});
  label(837,bottom+122,'PRO RANK',17,{color:'#a5acb8'});
  label(1038,bottom+116,options.rankBefore&&options.rankAfter?
    '#'+options.rankBefore+'  →  #'+options.rankAfter:'EVENT RECORDED',18);
  add(s.add.rectangle(1221,674,2,158,0x444d5b),230);
  label(1243,bottom+16,'STATUS',16,{color:'#a5acb8'});
  label(1243,bottom+42,trim(winner?'WINNER':'FINISHED',20),26,
    {color:winner?'#f3d599':'#f3eeee'});
  label(1243,bottom+91,options.openCircuit?'OPEN EVENT':'OFFICIAL RESULT',16,
    {color:'#a5acb8'});
  label(1243,bottom+115,trim(options.statusLabel||'SAVED TO CAREER',21),18,
    {color:'#f3eeee'});

  const doContinue=()=>{
    if(!armed||closed)return;
    close();
    options.onContinue?.();
  };
  panel(1167,785,704,57,0x651d2d,1,0xec5161)
    .setInteractive({useHandCursor:true}).on('pointerdown',doContinue);
  label(1167,765,options.nextLabel||'CONTINUE',27,{color:'#ffffff'}).setOrigin(.5,0);
  // A debounce prevents the final racing tap from accidentally dismissing the awards.
  s.time.delayedCall(360,()=>{if(!closed)armed=true;});
  const enter=s.input.keyboard?.addKey?.(Phaser.Input.Keyboard.KeyCodes.ENTER);
  if(enter) {
    enter.on('down',doContinue);
    s.events.once('shutdown',()=>enter.off('down',doContinue));
  }
  return {close};
}
