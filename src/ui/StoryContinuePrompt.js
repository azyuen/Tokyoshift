// R643 — reusable non-blocking establishing-shot hold.
// A deliberate PLAYER tap is required before revealing manga or choice UI.
// Used by Story and Career through the Story Director's HOLD_SCENE command.
const PIXEL='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';
export function showStoryContinuePrompt(scene,{
  label='CONTINUE STORY',caption='',onContinue=null,onCancel=null,depth=1158,
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
  const x=Math.round(width*.866), y=Math.round(height*.872);
  const w=Math.round(width*.195), h=Math.round(height*.084);
  const plate=add(scene.add.graphics().setDepth(depth+1).setScrollFactor(0));
  const left=x-w/2,right=x+w/2,top=y-h/2,bottom=y+h/2;
  plate.fillStyle(0x0d2839,.94);
  plate.lineStyle(2,0x82dce4,1);
  const polygon=[{x:left+18,y:top},{x:right,y:top},{x:right-18,y:bottom},{x:left,y:bottom}];
  plate.fillPoints(polygon,true);plate.strokePoints(polygon,true);
  const title=add(scene.add.text(x,y-3,String(label).toUpperCase(),{
    fontFamily:PIXEL,fontSize:'12px',color:'#ffffff',align:'center',
  }).setOrigin(.5).setDepth(depth+2).setScrollFactor(0));
  if(caption)add(scene.add.text(x,y+22,String(caption),{
    fontFamily:BODY,fontSize:'12px',color:'#b9e6ec',
  }).setOrigin(.5).setDepth(depth+2).setScrollFactor(0));
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
  hit.on('pointerdown',()=>{if(clear())onContinue?.();});
  title.setAlpha(0);plate.setAlpha(0);
  scene.tweens?.add?.({targets:[title,plate],alpha:1,duration:260,ease:'Sine.Out'});
  return control;
}
