// Garage Office -> CAR COUPONS. Touch-friendly, paginated coupon register
// and region guide. The guide reports eligible pools, never claims that an
// undiscovered or expired Street Showdown currently offers a particular car.
import { cars, carOrder } from '../data/cars.js?v=20261026-r687';
import { getCarCouponRequirement } from '../data/centralTokyo.js?v=20261023-r652';
import { getStreetShowdownCouponHunts, STREET_SHOWDOWN_COUPON_CHANCE } from '../data/streetShowdownCouponHunt.js?v=20261029-r716';

const PIXEL='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';
const PER_PAGE=8;

export function getOwnedCouponEntries(source) {
  const counts=source?.get?.('carCoupons')||source?.carCoupons||{};
  return carOrder.filter(id=>cars[id]&&Number(counts[id]||0)>0)
    .map(id=>({carId:id,count:Math.max(0,Math.floor(Number(counts[id])||0)),
      required:getCarCouponRequirement(id),label:cars[id].shortName||cars[id].name||id}));
}

export function showOfficeCouponHunt(scene) {
  if(scene._officeCouponClose)return;
  const entries=getOwnedCouponEntries(scene.registry);
  const staticNodes=[],detailNodes=[],depth=270;
  const destroy=list=>{for(const o of list.splice(0))try{o?.destroy?.();}catch{}};
  const add=(obj,list=staticNodes)=>{list.push(obj);return obj;};
  const rectangle=(x,y,w,h,fill,stroke=0x36556d,interactive=false,list=staticNodes)=>{
    const o=add(scene.add.rectangle(x,y,w,h,fill,1).setStrokeStyle(1,stroke).setDepth(depth+2),list);
    if(interactive)o.setInteractive({useHandCursor:true});
    return o;
  };
  const txt=(x,y,value,size=15,pixel=false,color='#dbe9f4',list=staticNodes)=>{
    return add(scene.add.text(x,y,value,{fontFamily:pixel?PIXEL:BODY,
      fontSize:size+'px',fontStyle:pixel?'normal':'600',color,
      wordWrap:{width:500}}).setDepth(depth+3),list);
  };
  const button=(x,y,w,h,value,fn,list=detailNodes,selected=false)=>{
    const bg=rectangle(x,y,w,h,selected?0x193b44:0x122132,
      selected?0x69e8df:0x36566d,true,list);
    const t=txt(x,y,value,11,true,'#f3fbff',list).setOrigin(.5);
    if(t.width>w-20)t.setScale((w-20)/t.width);
    bg.on('pointerdown',fn);
    return bg;
  };
  const close=()=>{
    scene.events?.off?.('shutdown',close);
    destroy(detailNodes);destroy(staticNodes);
    if(scene._officeCouponClose===close)scene._officeCouponClose=null;
  };
  scene._officeCouponClose=close;
  scene.events?.once?.('shutdown',close);
  const blocker=add(scene.add.rectangle(780,420,1560,840,0x01050a,.87)
    .setDepth(depth).setInteractive());
  blocker.on('pointerdown',close);
  rectangle(780,420,1150,690,0x0b1723,0x67d8ec);
  rectangle(490,420,515,565,0x0e2030,0x2b5469);
  rectangle(1060,420,535,565,0x0e2030,0x2b5469);
  txt(242,102,'CAR COUPONS // HUNT GUIDE',17,true,'#ecfbff');
  txt(242,143,'Tap a coupon car to see which regional Street Showdowns can offer it.',17,false,'#9ac4d6');
  button(1265,116,112,38,'CLOSE',close,staticNodes);
  txt(260,194,'YOUR COUPONS',12,true,'#7deaff');
  txt(805,194,'WHERE TO HUNT',12,true,'#7deaff');

  let page=0,selectedId=entries[0]?.carId||null;
  const render=()=>{
    destroy(detailNodes);
    if(!entries.length){
      txt(490,405,'NO CAR COUPONS YET',12,true,'#a0becf',detailNodes).setOrigin(.5);
      txt(830,365,'WIN CAR COUPONS IN STREET SHOWDOWNS',14,false,'#b5d8e6',detailNodes);
      txt(830,405,'Once you collect one, its possible hunting regions appear here.',14,false,'#a3b8c4',detailNodes);
      return;
    }
    const pageCount=Math.ceil(entries.length/PER_PAGE);
    const start=page*PER_PAGE;
    entries.slice(start,start+PER_PAGE).forEach((entry,i)=>{
      const y=243+i*46,selected=selectedId===entry.carId,ready=entry.count>=entry.required;
      const bg=rectangle(490,y,474,41,selected?0x16444d:0x152a3b,
        selected?0x7cf2e1:0x365b71,true,detailNodes);
      const name=txt(267,y,String(entry.label).toUpperCase(),10,true,
        selected?'#d4fff4':'#e9f3fc',detailNodes).setOrigin(0,.5);
      if(name.width>300)name.setScale(300/name.width);
      txt(718,y,String(entry.count)+'/'+String(entry.required)+(ready?'  READY':''),9,true,
        ready?'#82f1c6':'#f5d98d',detailNodes).setOrigin(1,.5);
      bg.on('pointerdown',()=>{selectedId=entry.carId;render();});
    });
    txt(485,635,'PAGE '+(page+1)+' / '+pageCount,10,true,'#afcce0',detailNodes).setOrigin(.5);
    if(page>0)button(325,681,142,38,'PREV',()=>{page--;render();});
    if(page<pageCount-1)button(660,681,142,38,'NEXT',()=>{page++;render();});

    const picked=entries.find(e=>e.carId===selectedId)||entries[0];
    const title=txt(813,232,String(picked.label).toUpperCase(),13,true,'#e8fffa',detailNodes);
    if(title.width>460)title.setScale(460/title.width);
    txt(813,265,picked.count+' / '+picked.required+' COUPONS // '+
      Math.max(0,picked.required-picked.count)+' MORE NEEDED',14,false,'#f6d48e',detailNodes);
    const targets=getStreetShowdownCouponHunts(picked.carId,scene.registry);
    if(!targets.length){
      txt(814,340,'NO KNOWN REGIONAL SHOWDOWN POOL',12,true,'#f9bb9a',detailNodes);
      txt(814,390,'Try another model or collect coupons from special awards.',16,false,'#bdd2df',detailNodes);
    }else targets.slice(0,7).forEach((target,i)=>{
      const y=322+i*45;
      rectangle(1060,y,490,40,target.unlocked?0x12362e:0x28252b,
        target.unlocked?0x327d70:0x524c55,false,detailNodes);
      txt(826,y-8,target.regionName,10,true,target.unlocked?'#9ff7d1':'#d4b2a7',detailNodes);
      const locName=String(target.locationName).toUpperCase();
      txt(826,y+9,locName+' // '+target.eligibleMeetCount+' POSSIBLE MEET'+
        (target.eligibleMeetCount===1?'':'S'),11,false,'#b4cad6',detailNodes);
      txt(1285,y,target.unlocked?'OPEN':'LOCKED',9,true,
        target.unlocked?'#90efb8':'#e1aaad',detailNodes).setOrigin(1,.5);
    });
    const note=txt(812,660,Math.round(STREET_SHOWDOWN_COUPON_CHANCE*100)+
      '% COUPON SHOWDOWNS. MODEL VARIES WITH LOCATION AND RACE BALANCE.\n'+
      'REGIONS ARE HUNTING LEADS, NOT GUARANTEED CURRENT OFFERS.',13,false,'#a0b9c9',detailNodes);
    note.setLineSpacing(4);
  };
  render();
  return close;
}
