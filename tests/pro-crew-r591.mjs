import test from 'node:test';
import assert from 'node:assert/strict';
import {createDefaultGameState} from '../src/state/GameState.js';
import {recruitRandomDevCrew} from '../src/data/crewSystem.js';
import {normaliseProCircuitState} from '../src/data/proCircuit.js';
import {
  getCrewSeriesUnits,registerCrewSeries,getCrewFixture,
  preparePlayerCrewFixture,getPlayerCrewHeat,settlePlayerCrewHeat,
  settleCrewSeriesFixture,useProCrewAdvice,getProCrewAdviceAvailability,
} from '../src/data/proSeason.js';
import {showProCrewHeatSelection} from '../src/ui/ProCrewBattleLineup.js';

const source=()=>{
  const data={...createDefaultGameState(),devMode:true,cash:5000000};
  const m=new Map(Object.entries(data));
  const s={get:k=>m.get(k),set:(k,v)=>m.set(k,v)};
  recruitRandomDevCrew(s,()=>0.2);
  return s;
};
const allIds=s=>getCrewSeriesUnits(s).map(u=>u.id);
function begin(s){
  const out=registerCrewSeries(s,allIds(s));
  assert.equal(out.error,undefined,out.error);
  s.set('proCircuit',out.circuit);s.set('cash',out.cash);
  return out.circuit.activeCrewEvent.id;
}
function finish(s){
  const f=getCrewFixture(s.get('proCircuit'));
  const out=preparePlayerCrewFixture(s,allIds(s).slice(0,3),f.id);
  assert.equal(out.error,undefined,out.error);
  s.set('proCircuit',out.circuit);
  for(let i=0;i<3;i++){
    const h=getPlayerCrewHeat(s.get('proCircuit'));
    const hit=settlePlayerCrewHeat(s.get('proCircuit'),h.id,[
      {id:'player',finishSeconds:10,disqualified:false},
      {id:'ai-1',finishSeconds:11,disqualified:false},
    ]);
    assert.equal(hit.status,'CREW_HEAT');
    s.set('proCircuit',hit.circuit);
  }
  const settled=settleCrewSeriesFixture(s.get('proCircuit'),f.id);
  assert.equal(settled.status,'COMPLETE');
  s.set('proCircuit',settled.circuit);
}
test('Sayaka advice can be used again only after the current event and two other completed pro events',()=>{
  const s=source(),id=begin(s);
  assert.equal(getProCrewAdviceAvailability(s).available,true);
  const used=useProCrewAdvice(s,id);
  assert.equal(used.error,undefined,used.error);
  s.set('proCircuit',normaliseProCircuitState(JSON.parse(JSON.stringify(used.circuit))));
  assert.equal(getProCrewAdviceAvailability(s).remaining,3);
  assert.equal(getProCrewAdviceAvailability(s).usedThisEvent,true);
  finish(s); // current competition
  assert.equal(getProCrewAdviceAvailability(s).remaining,2);
  const a=begin(s);
  assert.match(useProCrewAdvice(s,a).error,/2 MORE/);
  finish(s); // first other
  assert.equal(getProCrewAdviceAvailability(s).remaining,1);
  const b=begin(s);
  assert.match(useProCrewAdvice(s,b).error,/1 MORE/);
  finish(s); // second other
  assert.equal(getProCrewAdviceAvailability(s).remaining,0);
  const c=begin(s);
  assert.equal(useProCrewAdvice(s,c).error,undefined);
});

function phaserMock(){
  globalThis.Phaser={Textures:{FilterMode:{NEAREST:1}}};
  const nodes=[], add=(kind,attrs={})=>{
    const o={kind,attrs,active:true,width:Math.max(20,String(attrs.text||'').length*8),
      destroy(){this.active=false;return this;},
      setDepth(v){this.depth=v;return this;},
      setScrollFactor(){return this;},setStrokeStyle(){return this;},
      setOrigin(){return this;},setAngle(){return this;},setScale(){return this;},
      setFlipX(){return this;},setMask(){return this;},setAlpha(){return this;},
      setFontSize(){return this;},setWordWrapWidth(){return this;},
      setLineSpacing(){return this;},setFontStyle(){return this;},
      setTint(){return this;},clearTint(){return this;},
      setInteractive(){this.interactive=true;return this;},
      on(k,cb){if(k==='pointerdown')this.click=cb;return this;},
      fillStyle(){return this;},fillPoints(){return this;},lineStyle(){return this;},
      strokePoints(){return this;},fillTriangle(){return this;},strokeTriangle(){return this;},
      fillRect(){return this;},createGeometryMask(){return {};},
    };
    nodes.push(o);return o;
  };
  const listeners=new Map(),calls=[];
  const s=source();
  const scene={
    worldPhase:'night',registry:s,
    textures:{exists:()=>true,get:()=>({
      getSourceImage:()=>({width:400,height:800}),setFilter(){},
    })},
    add:{
      rectangle:(...z)=>add('rectangle',{x:z[0],y:z[1],w:z[2],h:z[3]}),
      ellipse:(...z)=>add('ellipse',{x:z[0],y:z[1]}),
      polygon:(...z)=>add('polygon',{x:z[0],y:z[1]}),
      image:(...z)=>add('image',{x:z[0],y:z[1],key:z[2]}),
      text:(...z)=>add('text',{x:z[0],y:z[1],text:z[2]}),
      graphics:()=>add('graphics'),
    },
    make:{graphics:()=>add('mask')},
    events:{once:(n,f)=>listeners.set(n,f),off:(n,f)=>{
      if(listeners.get(n)===f)listeners.delete(n);
    }},
    createCarDisplay:(car,x,y,w,depth,paintColor,driver,flipX,carState)=>{
      assert.notEqual(paintColor,false,'paintColor must not be the legacy false flip value');
      assert.equal(typeof flipX,'boolean','flipX must remain a boolean');
      assert.ok(carState&&typeof carState==='object');
      calls.push({carId:car.id,x,y,w,depth,paintColor,flipX});
      return [add('car',{carId:car.id})];
    },
  };
  s.set('playerCharacterId','renMizuno');
  s.set('carStates',{});
  return {scene,nodes,calls};
}
test('replacing crew drivers renders background and correctly ordered car sprites every time',()=>{
  const {scene,nodes,calls}=phaserMock();
  const units=getCrewSeriesUnits(scene.registry),selected=[null,null,null];
  showProCrewHeatSelection(scene,{units,selected,event:{short:true,openCircuit:true,
    format:'RELAY',label:'CREW CLUB SPRINT'},fixture:{round:0,format:'RELAY'},
    _loaded:true,adviceStatus:{available:true,remaining:0}});
  function tap(x,y,w){
    const o=[...nodes].reverse().find(n=>n.active&&n.kind==='rectangle'&&
      n.attrs.x===x&&n.attrs.y===y&&(!w||n.attrs.w===w)&&n.click);
    assert.ok(o,'find active tappable UI '+x+','+y);
    o.click();
  }
  tap(168,626,211); // open the persistent one-column selector
  tap(1235,140,558); // assign driver 1 without closing the popup
  assert.ok(calls.length>0,'selected driver car is rendered');
  assert.ok(nodes.some(n=>n.active&&n.kind==='text'&&n.attrs.text==='1'),
    'first selected row displays assignment number 1');
  const backdrop=nodes.find(n=>n.kind==='image'&&
    n.attrs.key==='proCrewRegoZoomedNight');
  assert.ok(backdrop?.active,'room background is intact after first assignment');
  tap(1235,223,558); // assign driver 2 without closing/recreating scene
  assert.ok(backdrop.active,'room background survives second assignment');
  assert.ok(nodes.some(n=>n.active&&n.kind==='text'&&n.attrs.text==='2'),
    'second selected row displays assignment number 2');
  tap(1235,140,558); // remove the first driver while the popup stays open
  tap(1235,306,558); // third driver now fills order slot 2
  assert.ok(backdrop.active,'room remains after repeated roster toggles');
  tap(1420,734,182); // close selector only, not the registration room
  assert.ok(backdrop.active,'closing popup does not cause black screen');
  assert.ok(calls.length>2,'car renders redraw in place');
  assert.ok(nodes.some(n=>n.active&&n.kind==='text'&&
    n.attrs.text==='YOUR LINEUP'),'standard crew heading remains');
  assert.equal(nodes.some(n=>n.active&&n.kind==='text'&&
    n.attrs.text==='7 TEAM MEMBERS'),false,'remove redundant popup heading');
});


test('R594: a broken optional car preview never strands the roster or hides the room',()=>{
  const {scene,nodes}=phaserMock();
  scene.createCarDisplay=()=>{throw Error('intentionally broken car preview');};
  const originalWarn=console.warn;
  let warnings=0;
  console.warn=()=>{warnings++;};
  try {
    const units=getCrewSeriesUnits(scene.registry);
    showProCrewHeatSelection(scene,{units,selected:[null,null,null],
      event:{short:true,openCircuit:true,label:'CREW RELAY'},
      fixture:{round:0,format:'RELAY'},_loaded:true});
    const firstSlot=nodes.find(n=>n.active&&n.kind==='rectangle'&&
      n.attrs.x===168&&n.attrs.y===626&&n.click);
    assert.ok(firstSlot);
    firstSlot.click();
    assert.ok(warnings>0,'renderer failures handled individually');
    const backdrop=nodes.find(n=>n.active&&n.kind==='image'&&
      n.attrs.key==='proCrewRegoZoomedNight');
    assert.ok(backdrop?.active,'background survives failure');
    const close=nodes.find(n=>n.active&&n.kind==='rectangle'&&
      n.attrs.x===1420&&n.attrs.y===734&&n.click);
    assert.ok(close,'close action remains available');
    close.click();
    assert.ok(backdrop.active,'closing after broken preview remains safe');
  }finally {
    console.warn=originalWarn;
  }
});


test('R610: every roster car displays unmasked, vertically centred in its row, with its ground shadow removed',()=>{
  const {scene,nodes}=phaserMock(),created=[];
  scene.createCarDisplay=(car,x,y,width)=>{
    const rear=scene.add.image(x,y,'rear-backing');
    const front=scene.add.image(x,y,'front-backing');
    const shadow=scene.add.ellipse(x,y);
    const body=scene.add.image(x,y,'whole-car');
    const originalMask=body.setMask;
    body.setMask=function(...args){this.masked=true;return originalMask.apply(this,args);};
    created.push({x,y,width,shadow,body});
    return [rear,front,shadow,body];
  };
  const units=getCrewSeriesUnits(scene.registry);
  showProCrewHeatSelection(scene,{units,selected:[null,null,null],
    event:{short:true,openCircuit:true,label:'CREW RELAY'},
    fixture:{round:0,format:'RELAY'},_loaded:true});
  const open=nodes.find(n=>n.active&&n.kind==='rectangle'&&
    n.attrs.x===168&&n.attrs.y===626&&n.click);
  assert.ok(open);
  open.click();
  assert.equal(created.length,7,'each of seven drivers has a complete preview');
  created.forEach((part,i)=>{
    assert.equal(part.x,1414);
    assert.equal(part.y,110+i*83+30,'car vertically centred with its 76px selection row');
    assert.equal(part.width,145);
    assert.equal(part.shadow.active,false,'ground ellipse removed');
    assert.equal(part.body.active,true,'complete car is retained');
    assert.notEqual(part.body.masked,true,'no cropping rectangle applied');
  });
  const back=nodes.find(n=>n.active&&n.kind==='image'&&
    n.attrs.key==='proCrewRegoZoomedNight');
  assert.ok(back?.active,'the main room survives changes to car previews');
});
