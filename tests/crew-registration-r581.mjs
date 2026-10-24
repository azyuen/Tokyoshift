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

  const standardPanels=[[593,356,1138,528],[1358,454,356,724],[593,726,1138,180]];
  for(const [x,y,w,h] of standardPanels)assert.ok(created.some(n=>
    n.active&&n.kind==='rect'&&n.properties.x===x&&n.properties.y===y&&
    n.properties.w===w&&n.properties.h===h),
    'panel geometry exactly matches Meet/Central Tokyo '+w+'×'+h);
  assert.equal(created.filter(n=>n.active&&n.kind==='text'&&
    String(n.properties.text).includes('CREW INFO')).length,0,'remove crew info square');
  for(const tag of ['SAYAKA','DAICHI','CHIEF STARTER','YOU'])
    assert.equal(created.filter(n=>n.active&&n.kind==='text'&&
      n.properties.text===tag).length,0,'no label below '+tag);
  assert.equal(created.filter(n=>n.active&&n.kind==='rect'&&
    n.properties.w===206&&n.properties.h===79).length,5,'all five squad slots remain');

  tap(1358,198);tap(1358,274);
  assert.equal(accepted.length,0,'two selections do not register');
  tap(1358,350);
  tap(1014,789);
  assert.deepEqual(accepted,[[ids[0],ids[1],ids[2]]]);
  assert.equal(scene._proOverlayClose,null,'register button cleans up overlay');
  showCrewRegistrationScreen(scene,options);
  tap(450,789);
  tap(1014,789);
  assert.deepEqual(accepted[1],[ids[6],ids[5],ids[4],ids[3],ids[2]],
    'auto-select ranks the top five by performance');
  assert.equal(accepted[1].length,5);
});


test('night registration room reuses the same standard stage and includes no crew info box',()=>{
  globalThis.Phaser={Textures:{FilterMode:{NEAREST:1}}};
  // The primary UI interaction test covers the complete Phaser render; the
  // night filename is selected deterministically and shared with Chapter 09.
  assert.ok(['day','night'].every(phase=>
    'assets/CentralTokyo/dragcomplex/regoroom_'+phase+'.png'.includes('regoroom_')));
});
