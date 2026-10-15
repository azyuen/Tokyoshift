// Fixed print edition: authored copy, stable collector choices, stock game stats.
export const ISSUE01_ASSETS = Object.freeze({
 blank: { key: 'issue01Blank', path: 'assets/Magazine/blank.webp' },
 contents: { key: 'issue01Contents', path: 'assets/Magazine/contents.webp' },
 featured_car: { key: 'issue01FeaturedCar', path: 'assets/Magazine/featuredcar_01.webp' },
 ginza_ad: { key: 'issue01Ginza', path: 'assets/Magazine/ginza_blank.webp' },
 champion_01: { key: 'issue01Champion01', path: 'assets/Magazine/01/champion_01.webp' },
 champion_03: { key: 'issue01Champion03', path: 'assets/Magazine/01/champion_03.webp' },
});
export const ISSUE01_GINZA_CARS = Object.freeze(['spoonEk9', 'amuseS2000Gt1']);
export const ISSUE01_PROFILE_CARS = Object.freeze(['ae86', 'ef', 'fc3s', 'ek9', 'galant']);
const pages = [
 { kind:'champion', art:'champion_01', kicker:'MIKA HIYASE / THE FORMER TOKYO CHAMPION', title:'THE PRICE OF SPEED',
   body:'Mika Hiyase began at waterfront street meets, funding her white R32 with shifts at a parts counter. Quiet in a crowd, fiercely curious in the garage, she kept a notebook of every lost run. Tokyo noticed the car. Rivals remembered the preparation.',
   quote:'“My name is on the trophy. It took all of us.”' },
 { kind:'article', art:'blank', kicker:'COVER STORY / MIKA HIYASE', title:'THE LONG WAY TO THE LINE',
   deck:'Behind the trophy: a white R32, a battered notebook and years of ordinary work.',
   columns:[
    [
     "Mika Hiyase bought her white R32 with wages from a parts counter. After work she drove to waterfront meets, where a perfect run mattered more than the shine of a fresh upgrade.",
     "She lost often. Every bad launch, missed shift and change in weather went into a notebook. Instead of hiding the failures, she studied them until the next run was better.",
    ],
    [
     "Friends added their ideas to Mika's notebook. Mechanics challenged her settings, and the crew stayed late checking tyres and gears. She learned to trust the people around her, not just the car.",
     "At the final, small gains became repeatable speed. Tokyo saw a trophy; Mika saw everyone behind it. She carried that discipline into international racing, keeping the notebook close.",
    ],
   ] },
 { kind:'champion', art:'champion_03', kicker:'MIKA HIYASE / THE NEXT CHAPTER', title:'TOKYO GOES WITH HER',
   body:'Now racing internationally, Mika still carries that battered notebook. Her dry humour survives the cameras; so does her habit of asking mechanics one more question. Tokyo remembers a champion. She wants its next generation to see a beginning.',
   quote:'“Don’t drive my story. Give Tokyo a new one.”' },
 { kind:'ginza', art:'ginza_ad' },
 { kind:'guide', art:'blank', kicker:'RACE SCHOOL / 01', title:'WHEN TO SHIFT', deck:'The next gear should keep the engine pulling.', sections:[
   ['READ THE ENGINE','Use the rev counter and listen. Shift before sitting on the limiter, but leave enough revs after the change to stay in the useful power band. Different engines and ratios need different timing.'],
   ['MAKE THE CHANGE CLEAN','Lift the throttle, press the clutch fully, select the next gear, then release the clutch and feed the throttle back in. A rejected shift means the clutch was not pressed far enough.'],
   ['CLEAN IS NOT A MAGIC RPM','CLEAN rewards clutch and throttle technique. It does not tell you that you chose the fastest shift point. Compare elapsed times using the same car and tune.'],
 ],note:'TRY THIS / Move your shift point a little, repeat the run, compare.' },
 { kind:'guide', art:'blank', kicker:'RACE SCHOOL / 02', title:'TWO WAYS TO START', deck:'Standing starts need grip. Rolling starts need the right gear.', sections:[
   ['STANDING / BUILD, THEN RELEASE','In first gear, hold the clutch and build revs before the start. At GO, release the clutch while applying power. Too few revs can bog the engine; too many can turn power into wheelspin.'],
   ['ROLLING / ALREADY AT 60','The game holds you at 60 km/h before GO. Check your gear: leave room to accelerate without dropping below useful revs. A gear that is too low is refused with TOO LOW @ 60.'],
   ['WATCH THE FIRST SECOND','Standing: settle the launch before chasing a shift. Rolling: accelerate from the matched gear; there is no standing clutch launch to repeat. Once moving, use the same clean shift sequence.'],
 ],note:'PRACTISE / Keep the build fixed until you can repeat a clean start.' },
 { kind:'guide', art:'blank', kicker:'RACE SCHOOL / 03', title:'WHICH WHEELS PULL?', deck:'FWD, RWD and AWD: learn the car behind the layout.',sections:[
   ['FWD / CIVIC EF + EK9','Light, efficient early choices. The front tyres do the driving and lose some launch loading under acceleration. Too much throttle can spin them: build revs, then introduce power progressively.'],
   ['RWD / AE86 + RX-7 FC','Rear-drive cars gain launch loading, rewarding a measured clutch release. They still have only two driven tyres. A light AE86 teaches momentum; the FC adds turbo torque that can overwhelm grip.'],
   ['AWD / LANCER GALANT VR-4','Four driven wheels give the Galant a strong standing start. Extra mass and drivetrain losses still matter once rolling. AWD is no automatic win: gearing and clean shifts still count.'],
 ],note:'IN THIS GAME / Straight-line traction matters. Tyres and tuning count too.' },
];
const profiles = [
 {carId:'ae86',year:'1983',drive:'RWD',role:'STARTER / 01',
  history:'The AE86 arrived in 1983, retaining rear-wheel drive as much of the Corolla family moved to front-wheel drive.',
  fact:'Trueno wears pop-up headlights; its Levin sister has fixed lamps. The familiar AE86 name is a chassis code.',
  tips:'Keep the 4A-GE singing. Avoid a low-rev launch and long pauses between gears.',
  strengths:'Low mass. Direct response. A clear lesson in carrying momentum.',
  weaknesses:'Modest torque. Slow to recover lost speed. Excess launch throttle spins the tyres.'},
 {carId:'ef',year:'1989 SiR',drive:'FWD',role:'STARTER / 02',
  history:'The fourth-generation Civic arrived in 1987. The Japanese SiR followed in 1989, bringing DOHC VTEC to the compact hatch.',
  fact:'Double-wishbone suspension at all four corners was ambitious engineering for an everyday small car.',
  tips:'Let the B16A rev. Release the clutch progressively so the front tyres can use the power.',
  strengths:'Lightweight. Rev-hungry. Strong early pace without turbo spool to manage.',
  weaknesses:'Front wheelspin wastes launches. Shift too early and the engine loses useful revs.'},
 {carId:'fc3s',year:'1985 debut',drive:'RWD',role:'NEXT STEP / 03',
  history:'The second-generation RX-7 debuted in 1985. The FC paired Mazda’s rotary character with a more refined sports-car package.',
  fact:'The 13B uses rotating rotors instead of reciprocating pistons. That compact engine is central to the RX-7 identity.',
  tips:'Keep revs up between shifts. Ease into turbo torque while the rear tyres settle.',
  strengths:'Turbo pull. Rear-drive launch grip. A different rhythm from a high-rev Civic.',
  weaknesses:'Boost takes time to build. Wheelspin and slow shifts can undo the benefit of its extra torque.'},
 {carId:'ek9',year:'1997',drive:'FWD',role:'NEXT STEP / 04',
  history:'In 1997, the EK9 became the first Civic Type R. Honda focused the idea around a sharp chassis and high-revving B16B.',
  fact:'Type R reached the Civic after the NSX and Integra. The small hatch inherited a much bigger sporting brief.',
  tips:'Use the upper rev range, then shift cleanly. Fit grip to match power before chasing bigger figures.',
  strengths:'High-rev pace. Efficient drivetrain. A familiar step up from the Civic EF.',
  weaknesses:'Limited low-rev torque. More power still goes through two front tyres; rushed launches waste it.'},
 {carId:'galant',year:'1992',drive:'AWD',role:'NEXT STEP / 05',
  history:'The Galant VR-4 brought Mitsubishi turbocharged four-wheel-drive rally engineering to the road before the Lancer Evolution line.',
  fact:'Its 4G63 turbo four-cylinder and full-time AWD helped establish Mitsubishi’s rally-bred performance formula.',
  tips:'Use its grip with enough launch revs. Keep the turbo working through quick, clean changes.',
  strengths:'Strong standing starts. Turbo midrange. Four driven tyres to put power down.',
  weaknesses:'Heavier than the starters. More drivetrain loss. Rolling starts reduce its launch advantage.'},
];
function freeze(value) { if(value && typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value; }
export const ISSUE01_PAGES = freeze([...pages,...profiles.map(p=>({...p,kind:'car',art:'featured_car'}))].map((p,i)=>({...p,number:i+4})));
// Editorial listings only. Page 07 is an advertisement, not a contents entry.
export const ISSUE01_CONTENTS = freeze([
 ['04','FEATURE: MIKA HIYASE'],
 ['08','RACE SCHOOL'],
 ['11','FIVE CARS TO KNOW'],
]);
