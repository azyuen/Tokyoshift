import { cars } from '../data/cars.js?v=20261026-r687';
import { ISSUE01_ASSETS, ISSUE01_PAGES, ISSUE01_CONTENTS, ISSUE01_GINZA_CARS, ISSUE01_PROFILE_CARS } from '../data/magazineIssue01.js?v=20261012-r490';
export { ISSUE01_ASSETS } from '../data/magazineIssue01.js?v=20261012-r490';
export const ISSUE01_EDITORIAL_PAGE_COUNT = ISSUE01_PAGES.length;
export const ISSUE01_FEATURE_IDS = ISSUE01_PROFILE_CARS;
export const ISSUE01_PHOTO_CARS = Object.freeze([...ISSUE01_GINZA_CARS,...ISSUE01_PROFILE_CARS]);

// Template coordinates are page fractions; text and car sprites remain live Phaser objects.
export function drawIssue01Page(scene, {container,pageX:x,pageW:W,pageH:H,pageNumber,carPhoto}) {
 const page=pageNumber===3?{kind:'contents',art:'contents',number:3}:ISSUE01_PAGES.find(p=>p.number===pageNumber);
 if(!page)return;
 const add=o=>{container.add(o);return o;};
 const S=H/650;
 const text=(copy,fx,fy,fw,fh,size=16,extra={})=>{
  const o=add(scene.add.text(x+W*fx,H*fy,copy,{
   fontFamily:'Arial, sans-serif',fontSize:size*S+'px',color:'#28221e',lineSpacing:3*S,
   wordWrap:{width:W*fw},...extra,
  }));
  while((o.height>H*fh||o.width>W*fw+1)&&parseFloat(o.style.fontSize)>10*S)o.setFontSize(parseFloat(o.style.fontSize)-.5*S);
  o.setData('magazineBox',{width:W*fw,height:H*fh,page:page.number});return o;
 };
 const rect=(fx,fy,fw,fh,color,alpha=1)=>add(scene.add.rectangle(x+W*fx,H*fy,W*fw,H*fh,color,alpha).setOrigin(0));
 add(scene.add.image(x,0,ISSUE01_ASSETS[page.art].key).setOrigin(0).setDisplaySize(W,H));
 const header=()=>{
  text(page.kicker,.075,.071,.85,.03,10,{color:'#9b302a',fontStyle:'bold'});
  text(page.title,.075,.115,.85,.075,29,pageNumber===4?
   {fontFamily:'Georgia, serif',fontStyle:'bold italic'}:{fontStyle:'bold'});
 };
 if(page.kind==='contents'){
  // This new commissioned backing already contains the branding, heading and photographs.
  // Only the editorial page number and headline belong in its left parchment panel.
  ISSUE01_CONTENTS.forEach(([num,headline],i)=>{
   const y=.347+i*.13;
   text(num,.065,y,.095,.051,20,{color:'#ad241c',fontFamily:'Arial, sans-serif',fontStyle:'bold'});
   text(headline,.164,y+.005,.287,.073,15.2,{color:'#211d1a',fontFamily:'Arial, sans-serif',fontStyle:'bold'});
   if(i<ISSUE01_CONTENTS.length-1)rect(.069,y+.099,.38,.001,0xb99d77,.48);
  });
 }else if(page.kind==='article'){
  // Open editorial page 05: readable, genuinely two-column prose, not a cramped caption.
  text(page.kicker,.083,.086,.83,.038,11.5,{fontStyle:'bold',color:'#a82a22'});
  text(page.title,.083,.136,.84,.083,28,{fontFamily:'Georgia, serif',fontStyle:'bold italic'});
  text(page.deck,.083,.232,.84,.061,17.5,{fontFamily:'Georgia, serif',fontStyle:'italic',color:'#6d4a3e'});
  rect(.083,.318,.834,.002,0x9b302a,.65);
  rect(.504,.346,.001,.57,0x786450,.28);
  page.columns.forEach((paragraphs,i)=>{
   const fx=i===0?.082:.536;
   const width=W*.381;
   const copy=paragraphs.map(p=>'\u2003'+p).join('\n\n');
   const article=add(scene.add.text(x+W*fx,H*.344,copy,{
    fontFamily:'Georgia, serif',
    fontSize:17.5*S+'px',
    color:'#28211d',
    lineSpacing:2*S,
    wordWrap:{width},
   }));
   // Preserve an actual readable font floor instead of shrinking to tiny disclaimer print.
   while(article.height>H*.57&&parseFloat(article.style.fontSize)>15.5*S)
    article.setFontSize(Math.max(15.5*S,parseFloat(article.style.fontSize)-.35*S));
   article.setData('magazineBox',{width,height:H*.57,page:page.number});
  });
 }else if(page.kind==='champion'){
  header();
  const y=pageNumber===4?.708:.667;
  const end=pageNumber===4?.922:.865;
  text(page.body,.51,y,.415,end-y,16);
  if(pageNumber===4){
   rect(.05,.577,.90,.099,0x101015,.86);
   text(page.quote,.077,.598,.846,.065,17,{color:'#fff7df',fontFamily:'Georgia, serif',fontStyle:'italic'});
  }else text(page.quote,.075,.9,.85,.038,16,{color:'#8f2925',fontFamily:'Georgia, serif',fontStyle:'italic'});
 }else if(page.kind==='ginza'){
  // Permanent Issue 01 selection; never rotating inventory or save-car paint.
  for(const b of [
   {id:ISSUE01_GINZA_CARS[1],x:.72,y:.548,w:.47,ly:.623,label:'AMUSE S2000 GT1'},
   {id:ISSUE01_GINZA_CARS[0],x:.43,y:.711,w:.71,ly:.828,label:'SPOON EK9'},
  ]){
   carPhoto(b.id,x+W*b.x,H*b.y,W*b.w);
   text(b.label,b.x,b.ly,b.w,.023,10,{color:'#f8dda8',fontStyle:'bold',backgroundColor:'#14151b'}).setOrigin(.5,0);
  }
  return;
 }else if(page.kind==='guide'){
  header();text(page.deck,.08,.22,.84,.065,19,{fontFamily:'Georgia, serif',fontStyle:'italic',color:'#665044'});
  page.sections.forEach(([title,copy],i)=>{const y=.32+i*.175;
   rect(.079,y,.009,.029,0x9b302a);
   text(title,.108,y-.001,.79,.035,16.5,{fontStyle:'bold',color:'#9b302a'});
   text(copy,.08,y+.043,.84,.122,16);
  });
  rect(.065,.867,.87,.065,0x29231f);
  text(page.note,.083,.882,.83,.039,12.5,{color:'#fff5df'});
 }else if(page.kind==='car'){
  const car=cars[page.carId];
  text(car.name.toUpperCase(),.151,.196,.708,.042,23,{fontStyle:'bold'});
  text(page.role,.047,.28,.211,.04,10.5,{color:'#9b302a',fontStyle:'bold'});
  text(car.shortName,.047,.335,.211,.057,22,{fontStyle:'bold'});
  [page.year,car.engineModel,page.drive+' / '+car.powerKW+'kW',car.vehicleMassKg+' kg'].forEach((value,i)=>{
   rect(.097,.445+i*.048,.166,.026,0xfff8e3,.96);
   text(value,.101,.446+i*.048,.154,.025,10.5,{fontStyle:'bold'});
  });
  carPhoto(page.carId,x+W*.64,H*.457,W*.60);
  text('STOCK GAME SPEC',.37,.595,.49,.022,9,{align:'right',color:'#6e5e4a'});
  text(page.history,.045,.671,.428,.094,13.5);
  text(page.fact,.526,.671,.425,.094,13.5);
  text(page.tips,.045,.823,.274,.11,12.5);
  text(page.strengths,.375,.823,.259,.11,12.5);
  text(page.weaknesses,.689,.823,.259,.11,12.5);
 }
 text('TOKYO SHIFT  /  ISSUE 01',.075,.952,.64,.021,8.5,{color:'#fff4df',fontStyle:'bold'});
 text(String(pageNumber).padStart(2,'0'),.82,.952,.10,.021,8.5,{color:'#fff4df',align:'right',fontStyle:'bold'});
}
