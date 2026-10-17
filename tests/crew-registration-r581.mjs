import test from 'node:test';
import assert from 'node:assert/strict';
import { showCrewRegistrationScreen } from '../src/ui/CrewRegistrationPanel.js';

test('registration screen uses existing paid registration callback with 3–5 distinct drivers',()=>{
  globalThis.Phaser={Textures:{FilterMode:{NEAREST:1}}};
  const created=[];
  const obj=(kind,properties={})=>{
    const n={kind,properties,active:true,width:(String(properties.text||'').length*8),
      destroy(){this.active=false;},
      setDepth(v){this.depth=v;return this;},
      setStrokeStyle(){return this;},
      setOrigin(){return this;},
      setAngle(){return this;},
      setScale(){return this;},
      setDisplaySize(){return this;},
      setFlipX(){return this;},
      setMask(){return this;},
      setFontSize(){return this;},
      setAlpha(){return this;},
      setTint(){return this;},
      clearTint(){return this;},
      setInteractive(){this.interactive=true;return this;},
      on(name,callback){if(name==='pointerdown')this.click=callback;return this;},
    };
    created.push(n);return n;
  };
  const listeners=new Map();
  const scene={
    worldPhase:'day',
    registry:{get:k=>k==='playerCharacterId'?'renMizuno':k==='carStates'?{}:null},
    textures:{
      exists:()=>true,
      get:()=>({getSourceImage:()=>({width:400,height:790}),setFilter(){}}),
    },
    add:{
      rectangle:(x,y,w,h)=>obj('rect',{x,y,w,h}),
      ellipse:(x,y,w,h)=>obj('ellipse',{x,y,w,h}),
      image:(x,y,key)=>obj('image',{x,y,key}),
      text:(x,y,text)=>obj('text',{x,y,text}),
    },
    make:{graphics:()=>({
      fillStyle(){return this;},fillRect(){return this;},
      createGeometryMask(){return {};},destroy(){},
    })},
    events:{
      once:(name,cb)=>listeners.set(name,cb),
      off:(name,cb)=>{if(listeners.get(name)===cb)listeners.delete(name);},
    },
    createCarDisplay:()=>[obj('car')],
  };
  const ids=['renMizuno','daichiSakamoto','sayakaFujieda',
    'ryujiTakahashi','masatoKuroda','hiroshiSato','emiSaionji'];
  const units=ids.map((id,i)=>({
    id,name:'Crew Driver '+(i+1),carId:'ae86',
    drivetrain:'RWD',powerKW:96+i,performance:i,
  }));
  const accepted=[];
  const options={
    units,selection:[],trophyId:null,fee:35000,
    getReason:ids=>ids.length<3?'SELECT THREE TO FIVE ELIGIBLE DRIVERS':null,
    onRegister:(ids,close)=>{accepted.push([...ids]);close();},
  };
  showCrewRegistrationScreen(scene,options);
  const tap=(x,y)=>{
    const row=[...created].reverse().find(n=>n.active&&n.kind==='rect'&&
      n.properties.x===x&&n.properties.y===y&&n.click);
    assert.ok(row,'interactive registration control '+x+','+y);
    row.click();
  };
  assert.ok(created.some(n=>n.active&&n.kind==='image'&&
    n.properties.key==='chapter09RegoRoomDay'),'day room is reused');
  assert.equal(created.filter(n=>n.active&&n.kind==='car').length,7);
  tap(1271,181);tap(1271,260);
  assert.equal(accepted.length,0,'two selections do not register');
  tap(1271,339);
  tap(1299,810);
  assert.deepEqual(accepted,[[ids[0],ids[1],ids[2]]]);
  assert.equal(scene._proOverlayClose,null,'register button cleans up overlay');
  showCrewRegistrationScreen(scene,options);
  tap(493,810);
  tap(1299,810);
  assert.deepEqual(accepted[1],[ids[6],ids[5],ids[4],ids[3],ids[2]],
    'auto-select ranks the top five by performance');
  assert.equal(accepted[1].length,5);
});
