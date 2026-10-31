// R748 — chapter-ending cinematic time jump. Replays safely after a reload;
// it owns no money or story outcome and never writes a progress flag.
const PIXEL='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';
export function showArkonStoryTimeJump(scene,{title='A FEW YEARS LATER',durationMs=5500,onComplete}={}){
  if(!scene?.add||scene._arkonStoryTimeJump?.active)return null;
  const w=scene.scale?.width||1560,h=scene.scale?.height||840;
  const nodes=[],add=o=>(nodes.push(o),o);
  let active=true,completed=false,timer=null;
  const curtain=add(scene.add.rectangle(w/2,h/2,w,h,0x000000,1)
    .setScrollFactor(0).setDepth(1950).setInteractive());
  const text=add(scene.add.text(w/2,h/2-8,String(title).toUpperCase(),{
    fontFamily:PIXEL,fontSize:'26px',color:'#fff7eb',align:'center',
  }).setOrigin(.5).setAlpha(0).setScrollFactor(0).setDepth(1952));
  const caption=add(scene.add.text(w/2,h/2+54,'TOKYO SHIFT // THE ROAD AHEAD',{
    fontFamily:BODY,fontSize:'19px',color:'#c7cfda',align:'center',
  }).setOrigin(.5).setAlpha(0).setScrollFactor(0).setDepth(1952));
  const destroy=()=>{
    if(!active)return;
    active=false;
    timer?.remove?.(false);
    nodes.forEach(n=>{scene.tweens?.killTweensOf?.(n);n.destroy?.();});
    scene.events?.off?.('shutdown',destroy);
    if(scene._arkonStoryTimeJump===control)scene._arkonStoryTimeJump=null;
  };
  const control={active:true,destroy};
  scene._arkonStoryTimeJump=control;
  scene.events?.once?.('shutdown',destroy);
  scene.tweens?.add?.({targets:[text,caption],alpha:1,duration:1000,
    delay:700,ease:'Sine.Out'});
  const ms=Math.max(3500,Math.min(10000,Number(durationMs)||5500));
  timer=scene.time.delayedCall(ms,()=>{
    if(!active||completed)return;
    completed=true;
    scene.tweens?.add?.({targets:[text,caption,curtain],alpha:0,duration:850,
      ease:'Sine.InOut',onComplete:()=>{destroy();onComplete?.();}});
  });
  return control;
}
