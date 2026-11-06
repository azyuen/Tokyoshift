// UI presentation regressions for the Tokyo Championship Hub R804.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../src/ui/TokyoChampionshipScreens.js',import.meta.url),'utf8');
const hub=code.slice(code.indexOf('function showHub('),code.indexOf('function eventInfo('));
const hubSprites=code.slice(code.indexOf("if(view==='HUB')"),
  code.indexOf("}else if(view==='CREW')"));

test('Hub footer contains only the original four event buttons',()=>{
  assert.match(hub,/STAGES\.forEach\(\(stage,i\)=>/);
  assert.match(hub,/const left=43,width=354,gap=19,centreY=740,height=74/);
  assert.match(hub,/left\+width\/2\+3\*\(width\+gap\),centreY,width,height/);
  assert.doesNotMatch(hub,/RIVAL PROFILES|CHAMPIONSHIP RULES|BACK TO PRO SEASON/);
});

test('sprite size bounds increased 50%, and wall monitor is still kept clear',()=>{
  assert.match(hubSprites,/sprite\(s,o,row\.asset\?\.key,xs\[i\],1040,978,480\)/);
  assert.match(hubSprites,/const ranked=championshipStandings/);
  assert.match(hubSprites,/const isPlayer=row\.id==='player:driver'/);
  assert.match(hubSprites,/xs=lineup\.length===4\?\[790,1000,1210,1420\]:\[870,1100,1330\]/);
  // The leftmost AI slot begins at x=865 - 480/2 = 625px.
  // If the player is top-three, their slot begins at 890 - 540/2 = 620px.
  // Both remain right of the physical wall display's x=610px edge.
  assert.ok(790-480/2<610);
  assert.ok(870-480/2>=610);
  assert.doesNotMatch(hubSprites,/champSayaka/);
});

test('rank paging uses unboxed arrow glyphs with invisible accessible touch areas',()=>{
  assert.match(code,/const iconButton=\(cx,cy,glyph,action,\{disabled=false\}=\{\}\)=>/);
  assert.match(code,/rectangle\(cx,cy,56,48,0x000000,0\)/);
  assert.match(code,/if\(!disabled\)hit\.setInteractive/);
  assert.match(hub,/o\.iconButton\(screen\.x\+41,footerY,'◀'/);
  assert.match(hub,/o\.iconButton\(screen\.x\+screen\.w-41,footerY,'▶'/);
  assert.doesNotMatch(hub,/o\.button\(screen\.x\+41,footerY/);
  assert.match(hub,/rows\.slice\(page\*8,page\*8\+8\)/);
});

test('driver stats take over the real wall monitor and preserve rankings page',()=>{
  assert.match(hub,/if\(displayProfileId\)\{/);
  assert.match(hub,/const r=rows\.find\(item=>item\.id===displayProfileId\)/);
  assert.match(hub,/r\.id==='player:driver'\?c\.playerDriver:c\.drivers\?\.\[r\.id\]/);
  for(const field of ['CHAMPIONSHIP RANK','CHAMPIONSHIP SEED','KNOCKOUT',
    'CREW BATTLES','FOUR-WIDE','TOTAL POINTS','DRIVER RATING',
    'PRO WINS / LOSSES'])assert.ok(hub.includes(field));
  assert.match(hub,/BACK TO LIVE STANDINGS/);
  assert.match(hub,/showHub\(s,actions,\{standingsPage:page\}\)/);
  assert.match(code,/displayProfileId:driverId,standingsPage:page/);
  assert.doesNotMatch(code,/function showProfile\(/);
});

test('Championship event toggles and dynamic entry remain unchanged',()=>{
  assert.match(hub,/displayStage:displayStage===stage\?null:stage/);
  assert.match(hub,/selected:displayStage===stage/);
  assert.match(hub,/view:finalAction\?'RESULT':current,actions/);
  assert.match(hub,/red:true/);
  assert.match(hub,/profileHubPage:page/);
});
