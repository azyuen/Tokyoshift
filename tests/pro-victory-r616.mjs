import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.Phaser={
  Geom:{Point:class Point{constructor(x,y){this.x=x;this.y=y;}}},
  Input:{Keyboard:{KeyCodes:{ENTER:13}}},
};
const {showProVictoryResults}=await import('../src/ui/ProVictoryResults.js');

function scene(){
  const objects=[];
  const node=(type,x,y,value)=>{
    const o={type,x,y,value,visible:true,alpha:1,events:{},
      setDepth(n){this.depth=n;return this;},
      setInteractive(){return this;},
      setStrokeStyle(){return this;},
      setOrigin(){return this;},
      setScale(){return this;},
      setDisplaySize(){return this;},
      setAlpha(v){this.alpha=v;return this;},
      setMask(){return this;},
      setFontSize(n){this.fontSize=n;return this;},
      on(e,cb){this.events[e]=cb;return this;},
      off(){return this;},
      destroy(){this.destroyed=true;return this;},
      fillStyle(){return this;},
      fillRect(){return this;},
      fillPoints(){return this;},
      createGeometryMask(){return {};},
    };objects.push(o);return o;
  };
  const s={
    registry:{get:k=>k==='playerCharacterId'?'arkonDen':null},
    textures:{
      exists:()=>true,
      get:()=>({getSourceImage:()=>({naturalWidth:1024,naturalHeight:1536})}),
    },
    add:{
      rectangle:(x,y)=>node('rectangle',x,y),
      text:(x,y,value,style)=>node('text',x,y,value),
      graphics:()=>node('graphics',0,0),
      image:(x,y,key)=>node('image',x,y,key),
    },
    make:{graphics:()=>node('mask',0,0)},
    time:{delayedCall:(_,cb)=>cb()},
    tweens:{add:()=>{},killTweensOf:()=>{}},
    events:{once(){},off(){}},
    input:{keyboard:{addKey:()=>node('key',0,0)}},
    sys:{isActive:()=>true},
    createCarDisplay(car,x,y,width){
      objects.push({type:'rendered-car',value:car.id,x,y,width});
      return [];
    },
  };
  return {s,objects};
}

test('crew victory shows four actual registered character assets and saved event values',()=>{
  const {s,objects}=scene();
  let continued=0;
  showProVictoryResults(s,{
    kind:'crew',winner:true,crewIds:['renMizuno','ayaKurose','daichiSakamoto'],
    carIds:['evo6','r32','ae86'],
    opponent:'BLUE ARC',eventName:'CREW FOUR-WIDE',
    fourWidePoints:9,heats:[
      {name:'Ryohei Takeda',ownSeconds:12.046,place:1,won:true},
      {name:'Aoi Shindou',ownSeconds:13.408,place:1,won:true},
      {name:'Daigo Moriyama',ownSeconds:13.098,place:1,won:true},
    ],cashPrize:70000,openCircuit:true,points:0,onContinue:()=>continued++,
  });
  const labels=objects.filter(o=>o.type==='text').map(o=>String(o.value));
  assert.ok(labels.includes('CREW VICTORY'));
  assert.ok(labels.includes('FOUR-WIDE TOTAL  9 / 9'));
  assert.ok(labels.includes('PERFECT 9/9'));
  assert.ok(labels.includes('¥70,000'));
  assert.ok(labels.includes('NO SEASON PTS'));
  assert.ok(labels.includes('12.046s'));
  assert.ok(labels.includes('13.408s'));
  assert.ok(!labels.some(t=>t.includes('BONUS')||t.includes('REPUTATION')));
  const captain=objects.find(o=>o.type==='image'&&o.value==='proCircuitCharacter_arkon_den_win');
  assert.ok(captain);
  assert.equal(captain.x,331,'the player, not a crew NPC, leads the formation');
  const hit=objects.find(o=>o.type==='rectangle'&&o.depth===290);
  const award=objects.find(o=>o.type==='text'&&o.value==='¥70,000');
  assert.equal(award.alpha,0,'initial result is only the top-right winner headline');
  hit.events.pointerdown();
  assert.equal(award.alpha,1,'first tap reveals the detailed prize quadrant');
  assert.equal(continued,0,'first tap must not close awards');
  hit.events.pointerdown();hit.events.pointerdown();
  assert.equal(continued,1,'second tap continues exactly once');
  assert.deepEqual(objects.filter(o=>o.type==='rendered-car').map(o=>o.value),
    ['evo6','r32','ae86'],'show the actual three crew cars');
});

test('driver victory contains Sayaka, player, Daichi and true paid values',()=>{
  const {s,objects}=scene();
  showProVictoryResults(s,{
    kind:'driver',winner:true,eventName:'TOKYO INVITATIONAL',carId:'r32',
    heats:[
      {name:'RIVAL 1',won:true,result:'WIN'},
      {name:'RIVAL 2',won:true,result:'WIN'},
      {name:'RIVAL 3',won:true,result:'WIN',ownSeconds:12.456},
    ],wins:3,rounds:3,points:20,cashPrize:140000,
    rankBefore:14,rankAfter:12,openCircuit:false,
  });
  const images=objects.filter(o=>o.type==='image').map(o=>o.value);
  assert.ok(images.includes('proCircuitCharacter_arkon_den_win'));
  assert.ok(images.includes('characterDaichiSakamoto'));
  assert.ok(images.includes('characterSayakaProTrackHappy'));
  const labels=objects.filter(o=>o.type==='text').map(o=>String(o.value));
  assert.ok(labels.includes('EVENT WINNER'));
  assert.ok(labels.includes('¥140,000'));
  assert.ok(labels.includes('+20'));
  assert.ok(labels.includes('#14  →  #12'));
  assert.ok(objects.some(o=>o.type==='image'&&o.value==='proVictoryDragstripDayR617'),
    'the entire scene uses the real daytime dragstrip background');
  assert.deepEqual(objects.filter(o=>o.type==='rendered-car').map(o=>o.value),['r32']);
  assert.equal(objects.find(o=>o.type==='text'&&o.value==='¥140,000').alpha,0);
  assert.ok(!labels.includes('TOKYO'),'there is no bespoke top logo/banner');
  assert.ok(labels.includes('CLEAN SWEEP'));
});
