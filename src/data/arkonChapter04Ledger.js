// Chapter 04's Porsche occupies a real Canal Yard slot, but is strictly
// immobilised. The special finance liability is separate from spendable cash.
export const ARKON_RWB_CAR_ID='rwbStellaPorsche';
export const ARKON_RWB_LOAN_AMOUNT=3000000;
export const ARKON_RWB_MAX_DEPOSIT=6000;
export const ARKON_RWB_AUCTION_PRICE=ARKON_RWB_LOAN_AMOUNT+ARKON_RWB_MAX_DEPOSIT;
const read=(source,key)=>typeof source?.get==='function'
  ?source.get(key):source?.[key];

export function isArkonRwbRestoration(source,carId){
  return read(source,'gameMode')==='arkonStory' &&
    String(carId||'')===ARKON_RWB_CAR_ID &&
    Boolean(read(source,'arkonStoryRwbProject')?.acquired);
}
export function getArkonRwbLoan(source){
  return read(source,'gameMode')==='arkonStory' &&
    read(source,'arkonStoryRwbProject')?.acquired
    ? Math.max(0,Number(read(source,'arkonStoryRwbProject').outstandingFinance)||0)
    : 0;
}
export function recordArkonRwbPurchase(source){
  if(read(source,'gameMode')!=='arkonStory' ||
     !read(source,'arkonStoryChapter03Done') ||
     typeof source?.set!=='function')return false;
  if(read(source,'arkonStoryRwbProject')?.acquired)return true;
  const cash=Math.max(0,Math.floor(Number(read(source,'cash'))||0));
  const deposit=Math.min(ARKON_RWB_MAX_DEPOSIT,cash);
  const owned=[...(read(source,'ownedCarIds')||[])];
  const states={...(read(source,'carStates')||{})};
  const locations={...(read(source,'carGarageLocations')||{})};
  // If an old Story profile somehow already has the same rare car in its
  // normal inventory, do not silently replace another owned car or duplicate
  // a garage entry. This should never occur during ordinary progression.
  const carId=ARKON_RWB_CAR_ID;
  const project={
    acquired:true,carId,roadworthy:false,owner:'arkonDen',
    status:'structural-and-engine-restoration-required',
    purchasePrice:ARKON_RWB_LOAN_AMOUNT+deposit,deposit,
    outstandingFinance:ARKON_RWB_LOAN_AMOUNT,
  };
  source.set('arkonStoryRwbProject',project);
  source.set('carStates',{...states,[carId]:{
    ...(states[carId]||{}),paintColor:0xffffff,
    immutable:true,tuningLocked:true,storedProject:true,
    roadworthy:false,collector:true,
  }});
  source.set('carGarageLocations',{...locations,[carId]:'shinonomeCanalYard'});
  source.set('ownedCarIds',owned.includes(carId)?owned:[...owned,carId]);
  source.set('cash',cash-deposit);
  // Do not select the undriveable project: Arkon's 240Z remains his racer.
  return true;
}
