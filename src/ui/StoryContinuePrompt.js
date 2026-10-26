// R643 — reusable non-blocking establishing-shot hold.
// A deliberate PLAYER tap is required before revealing manga or choice UI.
// Used by Story and Career through the Story Director's HOLD_SCENE command.
const PIXEL='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';
export function showStoryContinuePrompt(scene,{
  label='CONTINUE STORY',caption='',onContinue=null,onCancel=null,depth=1158,
  revealMs=0,
}={}) {
  if(!scene?.add || scene._storyContinuePrompt?.active) return null;
  const width=Number(scene.scale?.width||1560);
  const height=Number(scene.scale?.height||840);
  const objects=[];
  let active=true;
  const add=item=>{objects.push(item);return item;};
  // A low-alpha hit blocker prevents narrative beats from advancing through
  // underlying Meet/map controls while leaving the actual tableau visible.
  add(scene.add.rectangle(width/2,height/2,width,height,0x000000,.0001)
    .setDepth(depth).setScrollFactor(0).setInteractive());
  // Keep the prompt INSIDE the main cinematic/meet viewport, not in the
  // separate bottom-right rival or controls pane.
  const stage={x:24,y:92,w:1138,h:528};
  // Responsive plate dimensions: labels like "CHAPTER 01 // FIRST
  // IMPRESSIONS" must fit with padding on narrow iPad stage layouts.
  const aruken=scene.registry?.get?.('gameMode')==='arkonStory';
  const w=Math.min(aruken?560:455,stage.w-36),h=aruken?100:82;
  const x=Math.round(stage.x+stage.w-w/2-16);
  const y=aruken?700:Math.round(stage.y+stage.h-h/2-15);
  const plate=add(scene.add.graphics().setDepth(depth+1).setScrollFactor(0));
  const left=x-w/2,right=x+w/2,top=y-h/2,bottom=y+h/2;
  plate.fillStyle(0x0d2839,.94);
  plate.lineStyle(2,0x82dce4,1);
  const polygon=[{x:left+18,y:top},{x:right,y:top},{x:right-18,y:bottom},{x:left,y:bottom}];
  plate.fillPoints(polygon,true);plate.strokePoints(polygon,true);
  const title=add(scene.add.text(x,y+(caption?-11:0),String(label).toUpperCase(),{
    fontFamily:PIXEL,fontSize:aruken?'20px':'10px',color:'#ffffff',align:'center',
    wordWrap:{width:w-74,useAdvancedWrap:true},
  }).setOrigin(.5).setDepth(depth+2).setScrollFactor(0));
  // Phaser sizes text after measuring glyph widths; shrink any unexpectedly
  // long translations instead of bleeding outside the parallelogram.
  if(title.width>w-65)title.setFontSize(aruken?'16px':'8px');
  // The button already belongs to Aruken's Story; display the chapter title
  // alone, not a redundant ARUKEN DENZAKI prefix on every scene prompt.
  const shortCaption=String(caption||'').replace(/^ARUKEN DENZAKI\s*\/\/\s*/i,'');
  const captionText=shortCaption?add(scene.add.text(x,y+19,shortCaption,{
    fontFamily:BODY,fontSize:aruken?'18px':'11px',color:'#b9e6ec',align:'center',
    wordWrap:{width:w-88,useAdvancedWrap:true},
  }).setOrigin(.5).setDepth(depth+2).setScrollFactor(0)):null;
  const hit=add(scene.add.rectangle(x,y,w,h,0xffffff,.001)
    .setDepth(depth+3).setScrollFactor(0).setInteractive({useHandCursor:true}));
  const clear=()=>{
    if(!active)return false;
    active=false;
    objects.forEach(item=>{scene.tweens?.killTweensOf?.(item);item?.destroy?.();});
    scene.events?.off?.('shutdown',abort);
    scene.events?.off?.('destroy',abort);
    if(scene._storyContinuePrompt===control)scene._storyContinuePrompt=null;
    control.active=false;
    return true;
  };
  const abort=()=>{if(clear())onCancel?.({reason:'shutdown'});};
  const control={active:true,destroy:clear};
  scene._storyContinuePrompt=control;
  scene.events?.once?.('shutdown',abort);
  scene.events?.once?.('destroy',abort);
  const revealDuration=Math.max(0,Math.min(1800,Number(revealMs)||0));
  if(revealDuration)hit.disableInteractive();
  hit.on('pointerdown',()=>{if(clear())onContinue?.();});
  title.setAlpha(0);plate.setAlpha(0);captionText?.setAlpha(0);
  const displayPrompt=()=>{
    if(!active)return;
    hit.setInteractive({useHandCursor:true});
    scene.tweens?.add?.({targets:[title,plate,captionText].filter(Boolean),alpha:1,duration:360,ease:'Sine.Out'});
  };
  if(revealDuration){
    // Fade the dialogue away into a wide clear view of this exact Meet,
    // THEN reveal the user's Continue control. Never auto-advance.
    const veil=add(scene.add.rectangle(stage.x+stage.w/2,stage.y+stage.h/2,
      stage.w,stage.h,0x040a13,1).setDepth(depth+4).setScrollFactor(0));
    scene.tweens?.add?.({targets:veil,alpha:0,duration:revealDuration,
      ease:'Sine.InOut',onComplete:()=>{
        veil.destroy();
        displayPrompt();
      }});
  }else displayPrompt();
  return control;
}
