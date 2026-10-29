// Garage Office -> CAR COUPONS. Touch-friendly, paginated coupon register
// and region guide. The guide reports eligible pools, never claims that an
// undiscovered or expired Street Showdown currently offers a particular car.
import { cars, carOrder } from '../data/cars.js?v=20261026-r687';
import { getCarCouponRequirement } from '../data/centralTokyo.js?v=20261023-r652';
import {
  getStreetShowdownCouponHunts, getActiveStreetShowdownCouponOffers,
  getStreetShowdownScheduleSlot, STREET_SHOWDOWN_COUPON_CHANCE,
} from '../data/streetShowdownCouponHunt.js?v=20261029-r716b';

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
  let updateTimer=null;
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
    updateTimer?.remove?.(false);
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
  txt(242,143,'Tap a car to find the exact active coupon Showdowns across Tokyo.',17,false,'#9ac4d6');
  button(1265,116,112,38,'CLOSE',close,staticNodes);
  txt(260,194,'YOUR COUPONS',12,true,'#7deaff');
  txt(805,194,'LIVE COUPON BOARD',12,true,'#7deaff');

  let page=0,selectedId=entries[0]?.carId||null;
  let rotationCountdown=null;
  const minutesUntilNextRotation=()=>Math.max(1,
    Math.ceil((getStreetShowdownScheduleSlot().nextEventAt-Date.now())/60000));
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
    const current=getStreetShowdownScheduleSlot();
    const live=getActiveStreetShowdownCouponOffers(picked.carId,scene.registry,
      {rotationIndex:current.rotationIndex,now:Date.now()});
    txt(813,302,'ACTIVE STREET SHOWDOWNS ('+live.length+')',10,true,
      '#85efdb',detailNodes);
    rotationCountdown=txt(813,326,'NEXT ROTATION // '+
      minutesUntilNextRotation()+' MIN',11,false,'#d9d0a4',detailNodes);
    if(!live.length){
      txt(813,367,'NO ACTIVE COUPON OFFERS THIS CYCLE',10,true,
        '#d1bcc0',detailNodes);
    }else{
      live.slice(0,3).forEach((offer,i)=>{
        const y=367+i*55;
        rectangle(1060,y,490,49,offer.unlocked?0x12362e:0x27242d,
          offer.unlocked?0x2b7c6c:0x675357,false,detailNodes);
        const label=txt(830,y-12,offer.regionName+' / '+offer.locationName,10,true,
          offer.unlocked?'#98f0d1':'#d8b8b3',detailNodes);
        if(label.width>430)label.setScale(430/label.width);
        txt(830,y+10,'COUPON NOW // '+offer.accessLabel,11,false,
          '#b4d0db',detailNodes);
      });
      if(live.length>3)txt(813,541,'+'+(live.length-3)+' MORE ACTIVE LOCATIONS',
        10,true,'#96d6e4',detailNodes);
    }
    const targets=getStreetShowdownCouponHunts(picked.carId,scene.registry);
    txt(813,564,'REGIONAL HUNTING LEADS',10,true,'#7deaff',detailNodes);
    if(!targets.length){
      txt(813,596,'NO REGULAR REGIONAL POOL FOUND',11,false,
        '#dfbbb0',detailNodes);
    }else{
      const available=targets.filter(t=>t.unlocked);
      const preferred=available.length?available:targets;
      txt(813,590,preferred.slice(0,2).map(t=>t.regionName+' / '+
        (t.huntTier==='REGIONAL FAVOURITE'?'FAVOURITE':
          t.huntTier==='CLASS MATCH'?'CLASS MATCH':'RARE')).join('   /   '),
        12,false,'#b4cbd8',detailNodes);
      txt(813,614,available.length?'Others may be locked.':'Unlock regions for more leads.',
        11,false,'#9ab3c4',detailNodes);
    }
    const note=txt(813,646,
      Math.round(STREET_SHOWDOWN_COUPON_CHANCE*100)+
      '% OF SHOWDOWNS OFFER COUPONS // 15-MIN DAY/NIGHT CYCLE.\n'+
      'LIVE = EXACT PRIZE. LEADS = POSSIBLE FUTURE PRIZES.',
      11,false,'#a2bccc',detailNodes);
    note.setLineSpacing(3);
  };
  let renderedRotation=getStreetShowdownScheduleSlot().rotationIndex;
  render();
  // No heavy opponent build calculations on this timer: redraw only when
  // the authoritative WorldClock rotation changes while the Office is open.
  updateTimer=scene.time?.addEvent?.({delay:10000,loop:true,callback:()=>{
    const slot=getStreetShowdownScheduleSlot().rotationIndex;
    if(slot!==renderedRotation){renderedRotation=slot;render();}
    else rotationCountdown?.setText?.('NEXT ROTATION // '+
      minutesUntilNextRotation()+' MIN');
  }})||null;
  return close;
}
