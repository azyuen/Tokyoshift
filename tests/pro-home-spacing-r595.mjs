import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const central=readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
const panel=readFileSync(new URL('../src/ui/ProSeasonPanel.js',import.meta.url),'utf8');

test('R595: entry-fee captions sit 10px lower on all three event cards',()=>{
  // The same forEach renderer draws Driver, Crew and Trophy card labels.
  const cards=central.slice(central.indexOf('events.forEach((event, index) => {'),
    central.indexOf('this.drawDragSide(events[this.selectedEventIndex]',central.indexOf('events.forEach((event, index) => {')));
  assert.match(cards,/CARDS\.y \+ 136,\s*event\.trophySlotClosed\?/);
  assert.match(cards,/CARDS\.y \+ 104,\s*340,\s*116,/);
  const cardBottom=104+116/2,captionBottom=136+7/2;
  assert.ok(cardBottom-captionBottom>12,'entry label retains bottom padding');
});

test('R595: Scrutineering message has headroom for up to three wrapped lines',()=>{
  assert.match(panel,/side\.y\+490,label/);
  assert.doesNotMatch(panel,/side\.y\+518,label/);
  const labelStart=490,threeLinesAt12px=36;
  const entryTop=574-40/2;
  assert.ok(entryTop-(labelStart+threeLinesAt12px)>=28,
    'status messages have >=28px vertical buffer before action');
});

test('R595: all three right-side professional actions have identical height and gaps',()=>{
  assert.match(panel,/s\.add\.rectangle\(x,y,w,40,enabled\?/);
  assert.match(panel,/const x=side\.x\+side\.w\/2,y=side\.y\+624/);
  assert.match(panel,/s\.add\.rectangle\(x,y,side\.w-36,40,/);
  assert.match(central,/const mapY = SIDE\.y \+ 674/);
  assert.match(central,/SIDE\.w - 36,\s*dragTheme \? 40 : 42,/);
  const tops=[574,624,674].map(y=>y-20);
  for(let i=0;i<tops.length-1;i++)
    assert.equal(tops[i+1]-(tops[i]+40),10,'all button gutters are 10px');
});

test('R595: Crew Technical describes three different cars and smallest time difference',()=>{
  assert.match(panel,/TEST OF CONSISTENCY/);
  assert.match(panel,/DRIVE THREE DIFFERENT CARS/);
  assert.match(panel,/SMALLEST TIME DIFFERENCE WINS/);
  assert.match(panel,/crewFormat==='TECHNICAL'\?technicalBrief/);
  assert.doesNotMatch(panel,/3 CONSISTENCY RUNS/);
});
