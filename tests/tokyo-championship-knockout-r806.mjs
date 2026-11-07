import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/ui/TokyoChampionshipScreens.js',import.meta.url),'utf8');
const event=src.slice(src.indexOf('function showEvent('),src.indexOf('function showFullKnockout('));
const bracket=src.slice(src.indexOf('function eventInfo('),src.indexOf('function showEvent('));
const sprites=src.slice(src.indexOf('function mainSprites('),src.indexOf('function standingName('));
test('Knockout briefing is full bleed and heading is raised',()=>{
 assert.match(event,/hideTopChrome:stage==='KNOCKOUT'/);
 assert.match(event,/stage==='KNOCKOUT'\?55:119/);
 assert.match(event,/if\(stage!=='KNOCKOUT'\)\s*o\.label\(1246,88/);
});
test('three Knockout characters grow 25 percent and move together',()=>{
 assert.match(sprites,/sprite\(s,o,'champSayaka',262,741,550,307\)/);
 assert.match(sprites,/sprite\(s,o,player\?\.key,474,741,548,325\)/);
 assert.match(sprites,/sprite\(s,o,'champDaichi',698,741,525,301\)/);
});
test('Knockout monitor has only live bracket and compact expand control',()=>{
 assert.match(bracket,/screen\.y\+9,/);
 assert.doesNotMatch(bracket,/ROUNDS RECORDED/);
 assert.match(bracket,/firstX=screen\.x\+13/);
 assert.match(event,/monitor\.y\+monitor\.h-16/);
 assert.match(event,/64,29,bracketHalf/);
});
test('knockout actions retain setup, advice and race navigation',()=>{
 assert.match(event,/saveProTransaction/);
 assert.match(event,/if\(stage==='KNOCKOUT'\)\{/);
 assert.match(event,/if\(stage==='KNOCKOUT'\)\{[\s\S]*?o\.button\(1230,729,338,70/);
 assert.match(event,/o\.button\(1230,795,338,34,'RETURN TO HUB'/);
});
test('next opponent is red skewed card, not free-floating text',()=>{
 assert.match(event,/graphic\.fillPoints/);
 assert.match(event,/graphic\.strokePoints/);
 assert.match(event,/0xe45868/);
 assert.match(event,/NEXT OPPONENT/);
});
