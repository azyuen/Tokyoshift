// Championship Hub UI: live podium ordering, embedded standings and navigation.
// This is deliberately a presentation regression, not a second scoring engine.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getChampionshipHubPodium} from '../src/ui/TokyoChampionshipScreens.js';

const code=readFileSync(new URL('../src/ui/TokyoChampionshipScreens.js',import.meta.url),'utf8');
const hub=code.slice(code.indexOf('function showHub(s,actions,'),code.indexOf('function eventInfo('));
const sprite=code.slice(code.indexOf('function mainSprites('),code.indexOf('function standingName('));

test('shows the live top three; a fourth player only when outside the podium',()=>{
  const rows=Array.from({length:16},(_,i)=>({id:'rival:'+i,name:'Rival '+i}));
  rows[9]={id:'player:driver',name:'YOU'};
  assert.deepEqual(getChampionshipHubPodium(rows).map(r=>r.id),
    ['rival:0','rival:1','rival:2','player:driver']);
  const third=[...rows];third.splice(9,1);
  third.splice(2,0,{id:'player:driver',name:'YOU'});
  assert.deepEqual(getChampionshipHubPodium(third).map(r=>r.id),
    ['rival:0','rival:1','player:driver']);
  const first=[{id:'player:driver',name:'YOU'},...rows.slice(0,15)];
  assert.equal(getChampionshipHubPodium(first).length,3);
});

test('hub has full-bleed heading and season but none of the old top banner or rank card',()=>{
  assert.match(hub,/canvas\(s,'HUB',\{hideTopChrome:true\}\)/);
  assert.match(hub,/o\.headline\(41,21,'TOKYO CHAMPIONSHIP',62/);
  assert.match(hub,/o\.headline\(44,103,'SEASON '\+state\.season,27/);
  assert.doesNotMatch(hub,/SINGLE TITLE  \/  16 DRIVERS/);
  assert.doesNotMatch(hub,/YOUR RANK/);
  assert.doesNotMatch(hub,/scoreBar\(/);
  assert.match(code,/if\(!hideTopChrome\)/);
});

test('monitor page uses precisely ranked groups of eight and navigates to saved stats',()=>{
  assert.match(hub,/rows\.slice\(page\*8,page\*8\+8\)/);
  assert.match(hub,/page\*8\+i\+1/);
  assert.match(hub,/profileHubPage:page/);
  assert.match(hub,/standingsPage:0/);
  assert.match(hub,/standingsPage:1/);
  assert.match(code,/displayProfileId:driverId,standingsPage:page/);
  assert.doesNotMatch(hub,/VIEW ALL 16 DRIVERS/);
  assert.doesNotMatch(hub,/visible\[maxRows-1\]=me/);
});

test('each of three same-size event buttons toggles monitor details, never opens briefing',()=>{
  assert.match(hub,/const left=43,width=354,gap=19,centreY=740,height=74/);
  assert.match(hub,/STAGES\.forEach\(\(stage,i\)=>/);
  assert.match(hub,/displayStage:displayStage===stage\?null:stage/);
  assert.match(hub,/selected:displayStage===stage/);
  assert.match(hub,/const info=HUB_EVENT_EXPLANATIONS\[displayStage\]/);
  assert.match(code,/ONE-ON-ONE RACES/);
  assert.match(code,/THREE DIFFERENT ELIGIBLE RECRUITED CREW CARS/);
  assert.match(code,/SEMIFINALS: TWO HEATS/);
  assert.match(hub,/SELECT THE EVENT AGAIN FOR LIVE STANDINGS/);
});

test('the fourth matching red button follows the actual next Championship stage',()=>{
  assert.match(hub,/left\+width\/2\+3\*\(width\+gap\),centreY,width,height/);
  assert.match(hub,/const nextEvent=EVENTS\[current\]/);
  assert.match(hub,/finalAction\?'CHAMPIONSHIP RESULTS':'ENTER EVENT '\+\(nextEvent\?\.number\|\|'01'\)/);
  assert.match(hub,/view:finalAction\?'RESULT':current,actions/);
  assert.match(hub,/red:true/);
  assert.doesNotMatch(hub,/RIVAL PROFILES/);
  assert.doesNotMatch(hub,/CHAMPIONSHIP RULES/);
  assert.doesNotMatch(hub,/BACK TO PRO SEASON/);
});

test('hub no longer draws Sayaka and loads only actual ranked portraits',()=>{
  const hubBlock=sprite.slice(sprite.indexOf("if(view==='HUB')"),sprite.indexOf("}else if(view==='CREW')"));
  assert.match(hubBlock,/const lineup=hubLineup\(s\)/);
  assert.match(hubBlock,/xs=lineup\.length===4\?\[865,1055,1245,1435\]:\[890,1120,1350\]/);
  assert.match(hubBlock,/stature=isPlayer\?1110:978/);
  assert.match(hubBlock,/feet=isPlayer\?1190:1080/);
  assert.doesNotMatch(hubBlock,/champSayaka/);
  assert.match(code,/getProCircuitGenericDriverAsset/);
  assert.match(code,/getChampionshipHubPodium\(rows\)/);
});
