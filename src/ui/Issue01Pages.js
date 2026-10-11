// Issue 01 // static authored editorial. Phaser supplies text and car sprites.
// The champion is a public, unnamed legend — never an existing story character.
export const ISSUE01_EDITORIAL_PAGE_COUNT = 12;
export const ISSUE01_FEATURE_IDS = Object.freeze(['ae86','ef','fc3s','ek9','evo3']);
export const ISSUE01_PHOTO_CARS = Object.freeze([
  'r32','spoonEk9','amuseS2000Gt1',...ISSUE01_FEATURE_IDS
]);
const FEATURES = Object.freeze({
 ae86: ['TOYOTA AE86','THE MOMENTUM MACHINE','The lightweight rear-drive AE86 made its name by keeping speed through every corner. Its 4A-GE encourages precise use of the rev range.','Its modest torque is the challenge. A poor launch or early shift is hard to recover from.','Keep the engine singing, and do not give away speed between gears.'],
 ef: ['HONDA CIVIC EF','SMALL CAR, BIG ATTITUDE','A simple, light front-drive hatch that helped define grassroots Honda tuning. Weight, not huge horsepower, is its advantage.','Too much throttle can spin the driven front tyres.','Feed the clutch in smoothly; a clean launch beats wheelspin.'],
 fc3s: ['MAZDA RX-7 FC','ROTARY RHYTHM','The turbocharged FC RX-7 couples a compact rotary engine with classic rear-drive balance and a distinctive engine note.','A slow shift can let turbo response fall away.','Try to land each gear where the engine pulls hardest.'],
 ek9: ['HONDA CIVIC EK9','THE VTEC SPECIALIST','The first Civic Type R transformed a practical hatch into a focused high-revving performance car.','Little low-end torque means an early shift can cost momentum.','Let it rev, but shift before bouncing off the limiter.'],
 evo3: ['MITSUBISHI EVO III','AWD FROM THE START','Turbocharged 4G63 power and all-wheel-drive traction made the Evolution III a rally-inspired launch specialist.','The AWD hardware adds weight and drivetrain losses.','Build useful revs, engage the clutch cleanly and keep the turbo pulling.'],
});
export function drawIssue01Page(scene, o) {
 const {container,pageX,pageW:W,pageH:H,pageNumber:n,carPhoto}=o;
 const PIX='"Silkscreen",monospace', BODY='"Rajdhani",sans-serif';
 const add=v=>{container.add(v);return v};
 const box=(x,y,w,h,c,a=1,stroke)=>{const r=add(scene.add.rectangle(pageX+x,y,w,h,c,a));if(stroke)r.setStrokeStyle(1,stroke,1);return r};
 const txt=(s,x,y,size=15,col='#27251f',width=W-x-22,pixel=false)=>add(scene.add.text(pageX+x,y,s,{fontFamily:pixel?PIX:BODY,fontSize:size+'px',color:col,fontStyle:pixel?'400':'700',wordWrap:{width:Math.max(20,width)},lineSpacing:3}));
 const rule=y=>box(W/2,y,W-48,1,0xb0a187,.85);
 const head=(section,title,strap='')=>{txt('TOKYO SHIFT / '+section,24,22,7,'#9a4435',W-48,true);rule(49);txt(title,24,63,23,'#26231d',W-48);if(strap)txt(strap,25,106,12,'#766653',W-48)};
 const shot=(y,h,label,tint=0xb6bbc1)=>{box(W/2,y+h/2,W-48,h,tint,1,0x827e78);box(W/2,y+h-14,W-49,27,0x17232b,.92);txt(label,32,y+h-22,6,'#f4e5ca',W-64,true)};
 const portrait=(cx,cy,k=1)=>{
  box(cx,cy+57*k,96*k,76*k,0x2a3b49);box(cx,cy+10*k,65*k,69*k,0x232431);
  box(cx,cy+5*k,40*k,54*k,0xd8af90);box(cx,cy-22*k,66*k,30*k,0x25232b);
  box(cx-28*k,cy+4*k,14*k,64*k,0x25232b);box(cx+28*k,cy+4*k,14*k,64*k,0x25232b);
  box(cx-12*k,cy-3*k,6*k,4*k,0x2d2830);box(cx+12*k,cy-3*k,6*k,4*k,0x2d2830);
  box(cx,cy+18*k,15*k,3*k,0x995c58);box(cx,cy+80*k,10*k,35*k,0xc34939);
 };
 const car=(id,x,y,w)=>{if(!carPhoto(id,pageX+x,y,w))txt(id.toUpperCase(),x-w/2+10,y,12,'#28303b',w-20)};
 // Common magazine paper, margin rule and printed folio.
 box(W/2,H/2,W-10,H-10,0xfff9ed,.26,0xd4c5ac);
 rule(H-33);txt('TOKYO SHIFT  /  ISSUE 01',24,H-24,6,'#8d7a62',W-100,true);
 txt(String(n).padStart(2,'0'),W-52,H-24,7,'#9a4435',33,true);
 if(n===4){
  head('THE LEGEND','BEFORE THE LIGHTS','THE FORMER TOKYO CHAMPION / PART ONE');
  shot(136,274,'EARLY STREET YEARS / TOKYO PRESS ARCHIVE',0xa9b7bd);
  portrait(W*.43,244,1.35);
  box(W-103,217,105,123,0x8396a0,1,0xe5d6b8);portrait(W-103,225,.43);
  txt('She started where so many Tokyo racers start: late-night street meets, a borrowed opportunity and a lot to learn.',28,432,16,'#27251f',W-56);
  txt('The city knew her long before the cameras did.',28,526,17,'#a33e30',W-56);
  txt('"Every clean run was earned."',28,574,15,'#403a32',W-56);
 }else if(n===5){
  head('THE LEGEND','THE NIGHT SHE WON','THE FORMER TOKYO CHAMPION / PART TWO');
  shot(137,264,'TOKYO DRAG STRIP / FINAL RUN',0x58666b);
  box(W/2,313,W-77,33,0x30383c);
  for(let i=0;i<6;i++)box(55+i*(W-108)/5,318,27,3,0xf3e7cd);
  car('r32',W/2,262,W-104);
  txt('Nothing was guaranteed. Race after race, she had to make the next launch and the next shift count.',29,425,16,'#27251f',W-58);
  rule(516);txt('THEN  /  TOKYO CHAMPION',29,529,9,'#a33e30',W-58,true);
  txt('"The pass begins before the green light."',29,565,15,'#403a32',W-58);
 }else if(n===6){
  head('THE LEGEND','BEYOND TOKYO','THE FORMER TOKYO CHAMPION / PART THREE');
  shot(137,280,'VICTORY / PODIUM NIGHT',0x71868b);
  for(let i=0;i<22;i++)box(46+((i*71)%Math.floor(W-94)),155+((i*31)%174),5,9,i%3===0?0xdac16f:i%2?0xc44e40:0xf6ead3);
  portrait(W*.44,266,1.22);box(W*.44+73,326,38,67,0xc9aa64);box(W*.44+73,284,40,17,0xf3d780);
  txt('Tokyo was a beginning, not a destination. She has since taken her racing onto the international stage.',28,445,16,'#27251f',W-56);
  txt('"The next generation should go further than I did."',28,542,17,'#a33e30',W-56);
  txt('TOKYO STILL REMEMBERS.',28,593,8,'#403a32',W-56,true);
 }else if(n===7){
  box(W/2,H/2,W,H,0x17282d);box(W/2,H/2,W-28,H-28,0x16252b,1,0xd5b77b);
  txt('GINZA',34,46,36,'#e7cd9d',W-68);txt('MOTOR GALLERY / TOKYO',35,105,9,'#e7cd9d',W-70,true);
  txt('SOME CARS ARE MADE TO BE REMEMBERED.',35,139,13,'#fff3dd',W-70);
  [{id:'spoonEk9',y:175,tag:'SPOON / CIVIC TYPE R'}, {id:'amuseS2000Gt1',y:362,tag:'AMUSE / S2000 GT1'}].forEach(b=>{
   box(W/2,b.y+62,W-74,155,0x394c50,1,0xc6aa70);box(W/2,b.y+117,W-82,24,0x243237);
   car(b.id,W/2,b.y+66,W-133);txt(b.tag,51,b.y+130,8,'#f7e4c3',W-102,true);
  });
  txt('TWO MACHINES. ONE PRIVATE COLLECTION.',35,563,13,'#faf0d7',W-70);
  txt('EXPLORE THE GALLERY / CENTRAL TOKYO',35,593,7,'#d5b77b',W-70,true);
 }else if(n>=8&&n<=10){
  const guide={
   8:['WHEN TO SHIFT','SHIFT BEFORE THE LIMITER.','THE POWERBAND',[
    ['LISTEN','Let the engine build revs into the part of the range that pulls hardest.'],
    ['WATCH','Shift too early and the next gear may fall outside the useful powerband.'],
    ['RELEASE','Change gears near the top of the useful revs, before the limiter steals speed.']],
    'The fastest shift is the one that keeps the next gear pulling.'],
   9:['THE CLEAN LAUNCH','TRACTION BEATS DRAMA.','CLUTCH + THROTTLE',[
    ['PREPARE','Choose useful launch revs, not automatically maximum revs.'],
    ['FEED IN','Blend clutch and throttle. Dumping both at once can spin or bog.'],
    ['ADJUST','Wheelspin? Ease the power. Bogging? Change the clutch release.']],
    'A clean getaway sets up the whole quarter mile.'],
   10:['READ THE ROLL','CHOOSE THE RIGHT GEAR.','ROLLING STARTS',[
    ['SETTLE','Rolling starts may begin at roughly 60 km/h.'],
    ['CHOOSE','Pick the gear that puts the engine near its working powerband.'],
    ['GO','Respond to the signal and shift cleanly as speed rises.']],
    'FWD, RWD and AWD each respond differently. Test your setup.']
  }[n];
  head('DRIVER SCHOOL',guide[0],guide[2]);
  box(W/2,202,W-48,120,0x263c48);txt('0'+(n-7),45,168,29,'#ecd7af',75,true);
  txt(guide[1],131,177,18,'#fff4de',W-171);
  guide[3].forEach((step,i)=>{const y=300+i*80;
   txt('0'+(i+1)+' / '+step[0],28,y,8,'#a33e30',W-56,true);
   txt(step[1],28,y+24,15,'#27251f',W-56);rule(y+71);
  });
  txt(guide[4],28,560,15,'#75695b',W-56);
 }else if(n>=11&&n<=15){
  const id=ISSUE01_FEATURE_IDS[n-11],f=FEATURES[id];
  head('FEATURE CAR / 0'+(n-10),f[0],f[1]);
  shot(145,191,'TOKYO GARAGE / FEATURED CAR',0xcac7be);
  car(id,W/2,228,W-103);
  txt(f[2],28,361,16,'#27251f',W-56);
  rule(457);txt('STRENGTH / WHAT WORKS',28,475,8,'#48765c',W-56,true);
  txt(id==='evo3'?'Reliable AWD traction under power.':id==='ek9'?'A light chassis with a strong high-rev powerband.':id==='ef'?'Easy weight and direct, responsive FWD acceleration.':id==='fc3s'?'Strong response once the turbo is pulling.':'Light, balanced and rewarding when shifted cleanly.',28,497,13,'#27251f',W-56);
  txt('WEAK SPOT',28,545,8,'#a33e30',W-56,true);
  txt(f[3],28,564,12,'#27251f',W-56);
  txt('TIP / '+f[4],28,H-59,11,'#75695b',W-56);
 }
}
