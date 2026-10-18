import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  drawProEventSidebarTitle,drawProEventSidebarDetails,
  drawProEventSidebarStatus,drawProEventSidebarEntry,proEventEntryLabel,
  drawCrewSidebar,
} from '../src/ui/ProSeasonPanel.js';
import {createDefaultGameState} from '../src/state/GameState.js';
import {recruitRandomDevCrew} from '../src/data/crewSystem.js';

const SIDE={x:1180,y:92,w:356,h:724};
function scene(){
  const nodes=[];
  const make=(kind,coords,textValue=null,style={})=>{
    const n={kind,...coords,value:textValue,style,active:true,interactions:{},
      width:textValue?String(textValue).length*8:0,
      setStrokeStyle(width,color){this.strokeWidth=width;this.strokeColor=color;return this;},
      setDepth(v){this.depth=v;return this;},setOrigin(){return this;},
      setScale(v){this.scale=v;return this;},
      setInteractive(){this.interactive=true;return this;},
      on(event,handler){this.interactions[event]=handler;return this;},
      setFontSize(v){this.fontSize=v;return this;},
    };
    nodes.push(n);return n;
  };
  const data=createDefaultGameState();data.devMode=true;data.cash=500000;
  const map=new Map(Object.entries(data));
  const registry={get:k=>map.get(k),set:(k,v)=>map.set(k,v)};
  recruitRandomDevCrew(registry,()=>.2);
  return {nodes,registry,worldPhase:'day',addContent:n=>n,
    add:{
      text:(x,y,v,style)=>make('text',{x,y},v,style),
      rectangle:(x,y,w,h,fill,alpha)=>make('rect',{x,y,w,h,fill,alpha}),
    },
  };
}
test('R593: shared sidebar font, sizes, geometry, and spacing mirror driver events',()=>{
  const s=scene();
  const fired=[];
  drawProEventSidebarTitle(s,SIDE,'CREW TECHNICAL');
  drawProEventSidebarDetails(s,SIDE,['3 CONSISTENCY RUNS','CHOOSE THREE DRIVERS']);
  drawProEventSidebarStatus(s,SIDE,'CHECK ELIGIBILITY / CASH',false);
  drawProEventSidebarEntry(s,SIDE,proEventEntryLabel(35000),()=>fired.push('enter'),true);
  const [title,details,status,bg,caption]=s.nodes;
  assert.deepEqual([title.x,title.y],[SIDE.x+20,SIDE.y+207]);
  assert.equal(title.style.fontFamily,'"Silkscreen", monospace');
  assert.equal(title.style.fontSize,'11px');
  assert.deepEqual([details.x,details.y],[SIDE.x+20,SIDE.y+250]);
  assert.equal(details.style.fontFamily,'"Rajdhani", monospace');
  assert.equal(details.style.fontSize,'11px');
  assert.deepEqual([status.x,status.y],[SIDE.x+20,SIDE.y+518]);
  assert.equal(status.style.fontFamily,'"Silkscreen", monospace');
  assert.equal(status.style.fontSize,'8px');
  assert.deepEqual([bg.x,bg.y,bg.w,bg.h],[SIDE.x+SIDE.w/2,SIDE.y+574,SIDE.w-36,48]);
  assert.equal(caption.style.fontFamily,'"Silkscreen", monospace');
  assert.equal(caption.style.fontSize,'8px');
  assert.equal(caption.value,'ENTER EVENT // ¥ 35,000');
  bg.interactions.pointerdown();
  assert.deepEqual(fired,['enter']);
  // The independent Pro Season action is 38 px tall, centered y=624.
  assert.equal((SIDE.y+624-19)-(bg.y+bg.h/2),7,'7px gap to Start Pro Season button');
});

test('R593: short crew format has the same entry button and details as a driver',()=>{
  const s=scene();
  assert.equal(drawCrewSidebar(s,{
    team:true,openCircuit:true,label:'CREW TECHNICAL',format:'TECHNICAL',entryFee:35000,
  },SIDE),true);
  const button=s.nodes.find(n=>n.kind==='rect'&&n.y===SIDE.y+574&&n.h===48);
  assert.ok(button,'crew entry at exact driver action position');
  const caption=s.nodes.find(n=>n.kind==='text'&&n.y===SIDE.y+574);
  assert.equal(caption.value,'ENTER EVENT // ¥ 35,000');
  assert.equal(caption.style.fontFamily,'"Silkscreen", monospace');
  assert.equal(caption.style.fontSize,'8px');
  const body=s.nodes.find(n=>n.kind==='text'&&n.y===SIDE.y+250);
  assert.equal(body.style.fontSize,'11px');
  assert.equal(body.style.fontFamily,'"Rajdhani", monospace');
  assert.match(body.value,/CHOOSE THREE DRIVERS/);
});

test('R593: trophy/driver/crew screens delegate to same shared sidebar renderers',()=>{
  const c=readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
  const crew=readFileSync(new URL('../src/ui/ProSeasonPanel.js',import.meta.url),'utf8');
  for(const fn of ['drawProEventSidebarTitle','drawProEventSidebarDetails',
    'drawProEventSidebarStatus','drawProEventSidebarEntry']){
    assert.match(c,new RegExp(fn+'\\(this,SIDE,'));
    assert.match(crew,new RegExp(fn+'\\(s,side,'));
  }
  assert.doesNotMatch(crew,/side\.y\+590/,'no overlapping low crew entry button');
  assert.doesNotMatch(crew,/ENTER CREW EVENT|ENTER.*SELECT SQUAD/,'old crew-specific entry label gone');
});
