// Chapter 04: a deliberately full-screen legal/finance beat.
// This is a narrative acknowledgment, not a second loan or a cash grant.
import { ARKON_RWB_LOAN_AMOUNT } from '../data/arkonChapter04Ledger.js?v=20261023-r665';
const PIXEL='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';

export function showArkonRwbContract(scene,{onContinue}={}){
  if(!scene?.add||scene._arkonRwbContract?.active)return null;
  const depth=1450,objects=[],own=obj=>(objects.push(obj),obj);
  let active=true;
  const close=()=>{
    if(!active)return false;
    active=false;
    objects.forEach(x=>x?.destroy?.());
    scene.events?.off?.('shutdown',close);
    if(scene._arkonRwbContract===control)scene._arkonRwbContract=null;
    return true;
  };
  own(scene.add.rectangle(780,420,1560,840,0x04080e,.95)
    .setDepth(depth).setInteractive());
  own(scene.add.rectangle(780,420,1050,690,0xece9de,1)
    .setStrokeStyle(5,0x2b3441).setDepth(depth+1));
  own(scene.add.rectangle(780,127,1000,78,0x102435,1).setDepth(depth+2));
  own(scene.add.text(780,127,'SECURED VEHICLE FINANCE // AGREEMENT',{
    fontFamily:PIXEL,fontSize:'19px',color:'#f3f6f7'
  }).setOrigin(.5).setDepth(depth+3));

  const text=(x,y,value,size,color,font=BODY)=>own(scene.add.text(x,y,value,{
    fontFamily:font,fontSize:size+'px',color
  }).setDepth(depth+3));
  text(320,203,'ASSET',13,'#52606b',PIXEL);
  text(320,230,'RWB PORSCHE // NON-ROADWORTHY RESTORATION',23,'#162334');
  text(320,275,'SECURITY',12,'#52606b',PIXEL);
  text(320,301,'THE VEHICLE ITSELF // PERSONAL GUARANTEE',18,'#162334');
  own(scene.add.rectangle(780,425,920,189,0xf9dfd9,1)
    .setStrokeStyle(4,0x9d283c).setDepth(depth+2));
  own(scene.add.text(780,359,'OUTSTANDING LOAN',{
    fontFamily:PIXEL,fontSize:'17px',color:'#8a2639'
  }).setOrigin(.5).setDepth(depth+3));
  own(scene.add.text(780,429,'¥ '+ARKON_RWB_LOAN_AMOUNT.toLocaleString('en-US'),{
    fontFamily:PIXEL,fontSize:'48px',color:'#9d2138'
  }).setOrigin(.5).setDepth(depth+3));
  own(scene.add.text(780,494,'THREE MILLION YEN // REPAYABLE',{
    fontFamily:PIXEL,fontSize:'12px',color:'#8a2639'
  }).setOrigin(.5).setDepth(depth+3));
  text(319,552,'CONDITION: STRUCTURAL + ENGINE RESTORATION REQUIRED',16,'#192735',PIXEL);
  text(319,587,'THE PORSCHE OCCUPIES A GARAGE SLOT. NO RACING OR TUNING.',17,'#1f2934');
  own(scene.add.text(1190,630,'ARUKEN DENZAKI',{
    fontFamily:BODY,fontSize:'28px',fontStyle:'italic',color:'#1b3448'
  }).setOrigin(1,.5).setDepth(depth+3));
  own(scene.add.rectangle(1190,650,224,2,0x1e3445,1).setOrigin(1,.5).setDepth(depth+3));
  const button=own(scene.add.rectangle(780,712,500,56,0x0f3030,1)
    .setStrokeStyle(2,0x80e4c5).setDepth(depth+5)
    .setInteractive({useHandCursor:true}));
  own(scene.add.text(780,712,'ACKNOWLEDGE THE ¥3,000,000 DEBT  >',{
    fontFamily:PIXEL,fontSize:'12px',color:'#f9fffa'
  }).setOrigin(.5).setDepth(depth+6));
  button.once('pointerdown',()=>{
    if(!close())return;
    onContinue?.();
  });
  const control={active:true,destroy:close};
  scene._arkonRwbContract=control;
  scene.events?.once?.('shutdown',close);
  return control;
}
