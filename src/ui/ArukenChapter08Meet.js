// Chapter 08 scripted invitational: one rival, one actionable race button.
// A scene-local overlay; it never modifies normal MeetScene menus or economy.
import {ARKON_CH8_RACES} from '../data/arkonChapter08Races.js?v=20261028-pilot';
import {characters} from '../data/characters.js?v=20261027-shibuya';
export function showArukenChapter08Meet(scene,index,onRace){
  const race=ARKON_CH8_RACES[index];
  if(!race||!scene?.add)return null;
  const w=scene.scale.width||1560,h=scene.scale.height||840;
  const depth=1220,objects=[];
  const add=o=>{objects.push(o);return o;};
  let active=true;
  const panel=(x,y,pw,ph,color=0x142337)=>add(scene.add.rectangle(x,y,pw,ph,color,.97).setStrokeStyle(2,0x74b9cb).setDepth(depth+1).setScrollFactor(0));
  add(scene.add.rectangle(w/2,h/2,w,h,0x07121e,.88).setDepth(depth).setScrollFactor(0).setInteractive());
  const topH=h*.69,sideW=Math.max(240,w*.26);
  panel((w-sideW)/2,topH/2,w-sideW-20,topH-18,0x17283b);
  panel(w-sideW/2-6,h/2,sideW-12,h-18);
  panel((w-sideW)/2,(h+topH)/2,w-sideW-20,h-topH-16);
  const txt=(x,y,t,size=20,color='#ffffff')=>add(scene.add.text(x,y,t,{fontFamily:'"Rajdhani", sans-serif',fontSize:size+'px',color,wordWrap:{width:sideW-34}}).setDepth(depth+3).setScrollFactor(0));
  txt(32,30,race.label,Math.min(26,w*.022),'#e9c689');
  txt(32,topH+24,'ONLY CHALLENGER',17,'#a5d9e7');
  txt(32,topH+57,characters[race.rival]?.name||race.rival,Math.min(24,w*.02));
  txt(w-sideW+14,42,'PRIVATE INVITATIONAL',18,'#e9c689');
  txt(w-sideW+14,92,characters[race.rival]?.name||race.rival,23);
  txt(w-sideW+14,145,'RIVAL CAR: '+race.car.toUpperCase(),16,'#a5d9e7');
  const bx=w-sideW/2-6,by=h-108,bw=sideW-35,bh=65;
  const button=add(scene.add.rectangle(bx,by,bw,bh,0xc99b50).setDepth(depth+3).setScrollFactor(0).setInteractive({useHandCursor:true}));
  const label=txt(bx-bw/2+24,by-17,'RACE',28,'#111a24');
  button.on('pointerdown',()=>{if(!active)return;active=false;destroy();onRace?.();});
  const destroy=()=>{objects.forEach(o=>o?.destroy?.());scene.events?.off?.('shutdown',destroy);if(scene._chapter08Meet?.destroy===destroy)scene._chapter08Meet=null;};
  scene.events?.once?.('shutdown',destroy);
  scene._chapter08Meet={destroy};
  return scene._chapter08Meet;
}
