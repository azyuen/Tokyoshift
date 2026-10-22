// Chapter 04's Porsche is a non-drivable restoration liability, not an owned
// racer. Money and the purchase guard are saved in one profile transaction.
// All payments are expressed in the game's existing cash units (JPY display).
export const ARKON_RWB_AUCTION_PRICE = 1800000;
export const ARKON_RWB_MAX_DEPOSIT = 6000;

const read=(source,key)=>typeof source?.get==='function'
  ?source.get(key):source?.[key];

export function recordArkonRwbPurchase(source) {
  if(read(source,'gameMode')!=='arkonStory' ||
      !read(source,'arkonStoryChapter03Done'))return false;
  if(read(source,'arkonStoryRwbProject')?.acquired)return true;
  if(typeof source?.set!=='function')return false;
  const cash=Math.max(0,Math.floor(Number(read(source,'cash'))||0));
  const deposit=Math.min(ARKON_RWB_MAX_DEPOSIT,cash);
  // A specialist asset-backed facility covers the rest, subject to a personal
  // guarantee. This is debt, not a story gift and not spendable cash.
  const project={
    acquired:true,carId:'rwbStellaPorsche',roadworthy:false,
    status:'structural-and-engine-restoration-required',
    purchasePrice:ARKON_RWB_AUCTION_PRICE,deposit,
    outstandingFinance:ARKON_RWB_AUCTION_PRICE-deposit,
    owner:'arkonDen',
  };
  source.set('arkonStoryRwbProject',project);
  source.set('cash',cash-deposit);
  return true;
}
