// R675 — persistent player-facing exit for complete Arkon gameplay replay.
// The button sits INSIDE the top-left of the main background panel, not the
// global header, and remains clickable above phone/manga/workshop overlays.
import {isArkonPlayableReplay,endArkonPlayableReplay}
  from './ArkonPlayableReplay.js?v=20261023-r669';
export function syncArkonReplayExit(scene){
  if(!scene?.add || !scene.sys?.isActive?.())return;
  const active=isArkonPlayableReplay(scene.registry);
  if(!active){
    scene._arkonReplayExitUi?.destroy?.();
    return;
  }
  if(scene._arkonReplayExitUi?.active)return;
  let alive=true,parts=[],add=o=>(parts.push(o),o);
  const depth=90000;
  const box=add(scene.add.rectangle(179,106,306,47,0x342029,.98)
    .setStrokeStyle(2,0xffb994).setDepth(depth)
    .setScrollFactor(0).setInteractive({useHandCursor:true}));
  const label=add(scene.add.text(179,106,'EXIT CHAPTER REPLAY',{
    fontFamily:'"Silkscreen", monospace',fontSize:'10px',color:'#fff0e7',
  }).setOrigin(.5).setDepth(depth+1).setScrollFactor(0));
  const destroy=()=>{
    if(!alive)return;
    alive=false;parts.forEach(o=>o?.destroy?.());parts=[];
    scene.events?.off?.('shutdown',destroy);
    if(scene._arkonReplayExitUi===api)scene._arkonReplayExitUi=null;
  };
  box.on('pointerdown',()=>{
    if(!alive)return;
    if(endArkonPlayableReplay(scene,{toOffice:true}))destroy();
  });
  const api={active:true,destroy,box,label};
  scene._arkonReplayExitUi=api;
  scene.events?.once?.('shutdown',destroy);
  return api;
}
