// R604 — Shared Professional Circuit briefing UI vocabulary.
// Both the Open Circuit driver and paid Pro Crew lineup reuse these exact
// room-space dimensions and interactions (1560 x 840 reference canvas).
const PIXEL='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';
const CYAN=0x35d6ff;

// The same subtitle renderer is used in driver and crew briefings.
// HEAT is the player-facing term; format-specific round/fixture internals stay unchanged.
export function addProHeatSubtitle(s,add,{heat=1,total=3,x=58,y=146,size=23}={}){
  return add(s.add.text(x,y,'HEAT '+heat+' OF '+total,{
    fontFamily:'"Exo 2", sans-serif',fontSize:size+'px',
    fontStyle:'italic 900',color:'#c5cbd3',stroke:'#090d16',
    strokeThickness:3,
  }).setDepth(230));
}

export const STEWARD_BUBBLE=Object.freeze({x:850,y:24,w:674,h:258,triangleSide:36});

export function renderStewardBriefing(s,add,rows,{anchorX=1402,title='HIROSHI // RACE BRIEFING',height=null}={}){
  const {x,y,w,triangleSide}=STEWARD_BUBBLE;
  // Crew has two fewer rows than individual: trim exactly two row pitches.
  const h=height??STEWARD_BUBBLE.h,edge=x+w;
  const half=triangleSide/2,triangleHeight=Math.sqrt(3)*triangleSide/2;
  // Equilateral triangle on the BOTTOM horizontal, pointing at Hiroshi.
  const pts=[
    {x,y},{x:edge,y},{x:edge,y:y+h},
    {x:anchorX+half,y:y+h},
    {x:anchorX,y:y+h+triangleHeight},
    {x:anchorX-half,y:y+h},
    {x,y:y+h},
  ];
  const panel=add(s.add.graphics().setDepth(235));
  panel.fillStyle(0x081a2b,.97);panel.fillPoints(pts,true);
  panel.lineStyle(3,CYAN,1);panel.strokePoints(pts,true);
  const write=(xx,yy,str,size,color,pixel=false)=>{
    const t=add(s.add.text(xx,yy,String(str),{
      fontFamily:pixel?PIXEL:BODY,fontSize:size+'px',
      fontStyle:pixel?'normal':'600',color,wordWrap:{width:w-250},
    }).setDepth(238));
    return t;
  };
  write(x+22,y+11,title,15,'#53ddff',true);
  add(s.add.rectangle(x+w/2,y+43,w-42,1,0x3c7e98,.75).setDepth(237));
  rows.slice(0,8).forEach(([label,value,color],i)=>{
    const yy=y+52+i*20;
    write(x+24,yy,label,10,'#a5d4e6',true);
    const v=write(x+215,yy-2,value,14,color||'#f0f7fd');
    if(v.width>w-240)v.setScale((w-240)/v.width);
  });
  return panel;
}


/**
 * Two-page steward briefing for ordinary Open Circuit driver and Pro Crew
 * events. The wider panel gives the rule explanation room to wrap, while
 * trophy briefings retain their existing separate renderer.
 *
 * Page navigation is contained entirely in the top-right header band:
 * 40px high above the existing horizontal divider, with no protruding button
 * border. Each time Hiroshi's briefing reopens it starts on page 1.
 */
export function renderPagedStewardBriefing(s,add,pages,{
  anchorX=1402,title='HIROSHI // RACE BRIEFING',
}={}){
  // Extend leftwards, preserving the right edge and Hiroshi's pointer.
  // This is local to paged briefings; legacy trophy bubbles are unchanged.
  const {y,triangleSide}=STEWARD_BUBBLE;
  const x=720,w=804,h=274,edge=x+w,half=triangleSide/2;
  const triangleHeight=Math.sqrt(3)*triangleSide/2;
  const pts=[
    {x,y},{x:edge,y},{x:edge,y:y+h},
    {x:anchorX+half,y:y+h},
    {x:anchorX,y:y+h+triangleHeight},
    {x:anchorX-half,y:y+h},{x,y:y+h},
  ];
  const panel=add(s.add.graphics().setDepth(235));
  panel.fillStyle(0x081a2b,.97);panel.fillPoints(pts,true);
  panel.lineStyle(3,CYAN,1);panel.strokePoints(pts,true);
  add(s.add.text(x+22,y+11,title,{
    fontFamily:PIXEL,fontSize:'15px',color:'#53ddff',
  }).setDepth(238));
  // Continuous header rule; the arrow button sits just above it.
  add(s.add.rectangle(x+w/2,y+43,w-42,1,0x3c7e98,.75).setDepth(237));
  const indicator=add(s.add.text(edge-153,y+16,'01 / 02',{
    fontFamily:PIXEL,fontSize:'11px',color:'#b8dff0',
  }).setDepth(239));
  // Inside the top-right corner: x=edge-51..edge-3, y+3..y+43.
  // No independent button outline, so the shared header border stays seamless.
  const arrowHit=add(s.add.rectangle(edge-27,y+23,48,40,0x0b3449,1)
    .setDepth(245).setInteractive({useHandCursor:true}));
  add(s.add.rectangle(edge-51,y+23,1,40,0x3c7e98,.85).setDepth(246));
  const arrow=add(s.add.text(edge-27,y+21,'›',{
    fontFamily:BODY,fontSize:'29px',fontStyle:'700',color:'#ffffff',
  }).setOrigin(.5).setDepth(247));
  let current=0,pageObjects=[];
  const pageAdd=node=>{pageObjects.push(node);return add(node);};
  const pageText=(left,top,value,size,{pixel=false,color='#eff8ff',width=w-95}={})=>
    pageAdd(s.add.text(left,top,String(value),{
      fontFamily:pixel?PIXEL:BODY,fontSize:size+'px',
      fontStyle:pixel?'normal':'600',color,wordWrap:{width},
      lineSpacing:3,
    }).setDepth(238));
  const redraw=()=>{
    for(const node of pageObjects){try{node.destroy();}catch(_){}}
    pageObjects=[];
    const page=pages[current]||{};
    indicator.setText(String(current+1).padStart(2,'0')+' / 02');
    arrow.setText(current===0?'›':'‹');
    if(Array.isArray(page.sections)){
      const lowerLimit=y+h-16;
      let cursor=y+55;
      for(const section of page.sections){
        // Format is already self-descriptive; don't reserve a label row when
        // a section deliberately has no heading.
        if(section.label){
          pageText(x+24,cursor,String(section.label),10,{
            pixel:true,color:'#a5d4e6',
          });
          cursor+=18;
        }
        // One label for HOW IT WORKS; the victory rule is its final paragraph.
        const paragraphs=Array.isArray(section.paragraphs)
          ?section.paragraphs:[section.text];
        paragraphs.forEach((paragraph,i)=>{
          const value=pageText(x+24,cursor,String(paragraph||''),
            section.large?17:15,{width:w-68});
          const available=Math.max(12,lowerLimit-cursor);
          if(value.height>available)value.setScale(available/value.height);
          cursor+=Math.min(value.height,available)+(i===paragraphs.length-1?16:12);
        });
      }
    }else if(Array.isArray(page.rows)){
      const rows=page.rows.slice(0,9);
      const pitch=Math.min(31,(h-96)/Math.max(1,rows.length));
      rows.forEach(([label,value,color],i)=>{
        const top=y+61+i*pitch;
        pageText(x+24,top,String(label),10,{
          pixel:true,color:'#a5d4e6',width:180,
        });
        const detail=pageText(x+213,top-3,String(value),15,{
          color:color||'#f0f7fd',width:w-259,
        });
        // Long saved-state status messages cannot overflow the next row.
        if(detail.height>pitch-2)detail.setScale(Math.min(1,(pitch-2)/detail.height));
      });
    }
  };
  arrowHit.on('pointerdown',()=>{current=1-current;redraw();});
  arrowHit.on('pointerover',()=>arrowHit.setFillStyle(0x17617b,1));
  arrowHit.on('pointerout',()=>arrowHit.setFillStyle(0x0b3449,1));
  redraw();
  return panel;
}

export function addProGlowingHotspot(s,add,{x,y,w,h=44,label,onClick,disabled=false}){
  const glow=add(s.add.rectangle(x,y,w,h,0x4ee8ff,.022)
    .setStrokeStyle(2,disabled?0x617b86:0x69ecff,.72).setDepth(246));
  const pad=add(s.add.rectangle(x,y,w-10,h-8,0x06141d,.66).setDepth(247));
  const caption=add(s.add.text(x,y,label,{
    fontFamily:PIXEL,fontSize:'11px',
    color:disabled?'#8eacb8':'#c9f8ff',align:'center',
  }).setOrigin(.5).setDepth(248));
  if(caption.width>w-20)caption.setScale((w-20)/caption.width);
  if(disabled){glow.setAlpha(.37);pad.setAlpha(.42);caption.setAlpha(.58);}
  else {
    glow.setInteractive({useHandCursor:true}).on('pointerdown',onClick);
    const timing={duration:1300,yoyo:true,repeat:-1,ease:'Sine.easeInOut'};
    const pulse=s.tweens?.add?.({targets:glow,alpha:{from:.07,to:1},...timing});
    const padPulse=s.tweens?.add?.({targets:pad,alpha:{from:.14,to:.72},...timing});
    s.tweens?.add?.({targets:caption,alpha:{from:.46,to:.96},...timing});
    glow.on('pointerover',()=>{
      pulse?.pause?.();padPulse?.pause?.();
      glow.setAlpha(1).setFillStyle(0x4ee8ff,.08)
        .setStrokeStyle(3,0x9af6ff,.98);
      pad.setAlpha(.82);caption.setAlpha(1).setColor('#ffffff');
    });
    glow.on('pointerout',()=>{
      glow.setFillStyle(0x4ee8ff,.022).setStrokeStyle(2,0x69ecff,.72);
      caption.setColor('#c9f8ff');pulse?.resume?.();padPulse?.resume?.();
    });
  }
  return glow;
}

// Independent, compact 620 x 258 forfeit confirmation; safe on both Pro Crew
// and Open Circuit rooms. Never auto-confirms or replaces the active overlay.
export function showCompactProForfeit(s,{title='FORFEIT EVENT?',message='',onConfirm}={}){
  s._proForfeitClose?.();
  const nodes=[];
  const add=o=>{nodes.push(o);return o;};
  const close=()=>{
    if(s._proForfeitClose!==close)return;
    s.events?.off?.('shutdown',close);
    nodes.forEach(n=>{try{n?.destroy?.();}catch(_){}});
    s._proForfeitClose=null;
  };
  s._proForfeitClose=close;
  s.events?.once?.('shutdown',close);
  add(s.add.rectangle(780,420,1560,840,0x020611,.76)
    .setDepth(280).setInteractive());
  add(s.add.rectangle(780,420,620,258,0x0b1b2c,.99)
    .setStrokeStyle(2,CYAN).setDepth(281));
  add(s.add.text(780,333,title,{
    fontFamily:PIXEL,fontSize:'14px',color:'#ffffff',align:'center',
  }).setOrigin(.5).setDepth(282));
  add(s.add.text(780,406,message,{
    fontFamily:BODY,fontSize:'15px',fontStyle:'600',color:'#dceaf3',
    align:'center',wordWrap:{width:540},lineSpacing:4,
  }).setOrigin(.5).setDepth(282));
  const button=(x,label,action,{danger=false}={})=>{
    const hit=add(s.add.rectangle(x,493,250,46,danger?0x5c2534:0x26313b)
      .setStrokeStyle(2,danger?0xde788a:0x8195a4).setDepth(283)
      .setInteractive({useHandCursor:true}).on('pointerdown',action));
    const t=add(s.add.text(x,493,label,{
      fontFamily:PIXEL,fontSize:'12px',color:'#ffffff',
    }).setOrigin(.5).setDepth(284));
    if(t.width>232)t.setScale(232/t.width);
    return hit;
  };
  button(643,'CONTINUE EVENT',close);
  button(918,'CONFIRM FORFEIT',()=>{
    close();
    onConfirm?.();
  },{danger:true});
  return {close};
}

// Shared compact confirmation for Sayaka — identical in both pro rooms.
// No oversized generic modal. Layout remains readable on the iPad viewport.
export function showProSayakaAdviceConfirm(s,{
  message='',onConfirm,cancelLabel='MAYBE LATER',
  confirmLabel='ASK SAYAKA',
}={}){
  s._proSayakaClose?.();
  const nodes=[];
  const add=o=>{nodes.push(o);return o;};
  const close=()=>{
    if(s._proSayakaClose!==close)return;
    s.events?.off?.('shutdown',close);
    nodes.forEach(node=>{try{node?.destroy?.();}catch(_){}});
    s._proSayakaClose=null;
  };
  s._proSayakaClose=close;
  s.events?.once?.('shutdown',close);
  add(s.add.rectangle(780,420,1560,840,0x020611,.73)
    .setDepth(279).setInteractive());
  add(s.add.rectangle(780,420,820,268,0x0b1b2c,.99)
    .setStrokeStyle(3,CYAN).setDepth(280));
  add(s.add.text(780,317,'ASK SAYAKA FOR ADVICE?',{
    fontFamily:PIXEL,fontSize:'17px',color:'#f5fbff',
  }).setOrigin(.5).setDepth(281));
  const description=add(s.add.text(780,402,message,{
    fontFamily:BODY,fontSize:'18px',fontStyle:'600',
    color:'#dceaf3',align:'center',
    wordWrap:{width:740},lineSpacing:4,
  }).setOrigin(.5).setDepth(281));
  if(description.height>112)description.setScale(112/description.height);
  const button=(x,label,action,confirm=false)=>{
    const hit=add(s.add.rectangle(x,497,256,48,
      confirm?0x642a3b:0x142b3e,.97)
      .setStrokeStyle(2,confirm?0xf28ba2:CYAN)
      .setDepth(282).setInteractive({useHandCursor:true})
      .on('pointerdown',action));
    const caption=add(s.add.text(x,497,label,{
      fontFamily:PIXEL,fontSize:'13px',color:'#ffffff',
    }).setOrigin(.5).setDepth(283));
    if(caption.width>238)caption.setScale(238/caption.width);
    return hit;
  };
  button(610,cancelLabel,close);
  button(948,confirmLabel,()=>{close();onConfirm?.();},true);
  return {close};
}
