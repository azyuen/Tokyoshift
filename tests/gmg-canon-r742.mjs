import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHAPTER09_SCENES } from '../src/data/chapter09.js';
import { GINZA_LISTINGS } from '../src/data/centralTokyo.js';
import { ginzaConversation } from '../src/data/ginzaScenes.js';
import { isGinzaOwner } from '../src/data/ginzaGallery.js';
const src = path => readFileSync(new URL('../' + path, import.meta.url),'utf8');
const words = id => CHAPTER09_SCENES[id].pages.map(p=>p.text || '').join(' ');
test('GMG sponsorship is joint and commercially motivated without buying victories',()=>{
 const intro=words('proSponsorIntroduction');
 assert.match(intro,/We.re sponsoring the team/i);
 assert.match(intro,/GMG gets a racing programme worth backing/i);
 assert.match(intro,/We agreed it was worth doing/i);
 assert.match(intro,/earn every result/i);
 assert.match(intro,/missed running a race programme/i);
 assert.doesNotMatch(intro,/wife|girlfriend|gift|unlimited funds/i);
 assert.match(src('src/ui/ProSeasonPanel.js'),/GMG RACING \/\/ ENTRY COVERED/);
});
test('Career #16 demonstration car is different from Aruken\'s sold prequel 240Z',()=>{
 const intro=words('proSponsorIntroduction');
 assert.match(intro,/our Liberty Walk 240Z demonstrator/i);
 assert.doesNotMatch(intro,/my Liberty Walk 240Z|That's YOUR 240Z/i);
 assert.match(src('docs/GMG_BUSINESS_AND_RACING_CANON_20261030.md'),/different, later GMG/i);
 assert.match(src('docs/ARKON_R679_RECIPROCITY_AND_FINALE.md'),/voluntarily/i);
 assert.equal(GINZA_LISTINGS.find(c=>c.carId==='arkonGinza240z')?.price,125000000);
 assert.match(src('src/ui/ProSponsorStory.js'),/selectedOpponentCarId', 'arkonGinza240z/);
});
test("wealthy player access does not imply gallery ownership",()=>{
 const vault=ginzaConversation('vaultOwner');
 const dialogue=vault.pages.map(p=>p.text).join(' ');
 assert.equal(vault.pages.length,3);
 assert.doesNotMatch(dialogue,/owner of the Ginza Motor Gallery|our owner/i);
 assert.match(dialogue,/responsibility to their owners/i);
 assert.equal(isGinzaOwner({cash:900000001,firstName:'Some',lastName:'Visitor'}),true);
 // Existing named developer-only banter remains untouched.
 assert.match(ginzaConversation('vaultArkon').pages[0].text,/Aruken/i);
});
test('canon records a 50/50 commercial partnership, consignments, and earned racing',()=>{
 const canon=src('docs/GMG_BUSINESS_AND_RACING_CANON_20261030.md');
 assert.match(canon,/50\/50/);
 assert.match(canon,/consignments/i);
 assert.match(canon,/not an unlimited-finance billionaire empire/i);
 assert.match(canon,/Daichi/i);
 assert.match(canon,/sold \*\*his original/i);
 assert.match(src('docs/CHARACTER_BIBLE.md'),/R742 current Aruken \/ Sayaka canon/i);
});
