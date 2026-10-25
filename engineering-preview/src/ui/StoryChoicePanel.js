// R641 — mobile-safe decision cards for the universal Story Director.
// Rendered over the current scene: no scene replacement or profile writes.
const PIXEL='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';

export function showStoryChoices(scene,{ title='WHAT WILL YOU DO?',subtitle='',choices=[],onChoose,onCancel }={}) {
  if (!scene?.add || !Array.isArray(choices) || choices.length<2 ||
      !choices.every(c=>c.id && c.label)) return null;
  const w=Number(scene.scale?.width||1560), h=Number(scene.scale?.height||840);
  const objects=[];
  const add=obj=>{objects.push(obj);return obj;};
  let active=true;
  // Entire screen is captured, so the player cannot start races, move cars or
  // hit location controls while a story decision is pending.
  add(scene.add.rectangle(w/2,h/2,w,h,0x061019,.70).setDepth(1170)
    .setScrollFactor(0).setInteractive());
  const boxX=350,boxW=860,y0=244;
  add(scene.add.text(boxX,164,title.toUpperCase(),{
    fontFamily:PIXEL,fontSize:'17px',color:'#f8eee7',
    wordWrap:{width:boxW},
  }).setDepth(1172).setScrollFactor(0));
  if(subtitle)add(scene.add.text(boxX,211,subtitle,{
    fontFamily:BODY,fontSize:'17px',color:'#b5cad6',
    wordWrap:{width:boxW},
  }).setDepth(1172).setScrollFactor(0));
  const dispose=()=>{
    if(!active)return;
    active=false;
    objects.forEach(obj=>{scene.tweens?.killTweensOf?.(obj);obj?.destroy?.();});
    scene.events?.off?.('shutdown',abort);
    scene.events?.off?.('destroy',abort);
    if(scene._storyChoicePanel===panel)scene._storyChoicePanel=null;
  };
  const abort=()=>{if(!active)return;dispose();onCancel?.({reason:'shutdown'});};
  const panel={active:true,destroy(){dispose();this.active=false;}};
  scene._storyChoicePanel?.destroy?.();
  scene._storyChoicePanel=panel;
  scene.events?.once?.('shutdown',abort);
  scene.events?.once?.('destroy',abort);
  choices.slice(0,4).forEach((choice,index)=>{
    const y=y0+index*112;
    const shadow=add(scene.add.graphics().setScrollFactor(0).setDepth(1171));
    const paint=bright=>{
      shadow.clear();
      const x0=boxX,x1=boxX+boxW;
      shadow.fillStyle(bright?0x284e62:0x112635,.97);
      shadow.lineStyle(2,bright?0x9ae9ed:0x547e8c,.95);
      shadow.fillPoints([
        {x:x0+25,y:y},{x:x1,y:y},{x:x1-25,y:y+91},{x:x0,y:y+91},
      ],true);
      shadow.strokePoints([
        {x:x0+25,y:y},{x:x1,y:y},{x:x1-25,y:y+91},{x:x0,y:y+91},
      ],true);
    };
    paint(false);
    add(scene.add.text(boxX+47,y+20,String(index+1).padStart(2,'0'),{
      fontFamily:PIXEL,fontSize:'16px',color:'#7ddfdc',
    }).setDepth(1173).setScrollFactor(0));
    add(scene.add.text(boxX+113,y+16,choice.label,{
      fontFamily:PIXEL,fontSize:'12px',color:'#fffaf0',
      wordWrap:{width:boxW-167},
    }).setDepth(1173).setScrollFactor(0));
    if(choice.description)add(scene.add.text(boxX+113,y+54,choice.description,{
      fontFamily:BODY,fontSize:'15px',color:'#b9d5dc',
      wordWrap:{width:boxW-160},
    }).setDepth(1173).setScrollFactor(0));
    const hit=add(scene.add.rectangle(boxX+boxW/2,y+45,boxW-36,91,0xffffff,0.001)
      .setScrollFactor(0).setDepth(1175).setInteractive({useHandCursor:true}));
    hit.on('pointerover',()=>paint(true));
    hit.on('pointerout',()=>paint(false));
    hit.on('pointerdown',()=>{
      if(!active)return;
      dispose();
      onChoose?.(choice);
    });
  });
  // Buttons and dialogue share the same native 1560x840 safe-area frame.
  objects.forEach(obj=>{obj?.setAlpha?.(0);scene.tweens?.add?.({
    targets:obj,alpha:1,duration:220,ease:'Sine.Out',
  });});
  return panel;
}
