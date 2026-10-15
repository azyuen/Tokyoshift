import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { characters, getRivalReplacementCharacterId } from '../src/data/characters.js';
import {
  CHARACTER_RACE_DIALOGUE, getMeetCharacterQuote, getRaceCharacterQuote,
} from '../src/data/characterRaceDialogue.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const ids = Object.keys(characters);
const text = value => typeof value === 'string' && value.trim().length >= 12;

test('all named character-bible IDs have seven genuinely authored lines', () => {
  assert.equal(ids.length, 62);
  assert.deepEqual(Object.keys(CHARACTER_RACE_DIALOGUE).sort(), ids.sort());
  for (const id of ids) {
    const entry = CHARACTER_RACE_DIALOGUE[id];
    assert(entry && entry.meet && entry.race, 'missing dialogue: ' + id);
    for (const phase of ['ready','win','loss']) {
      assert(text(entry.meet[phase]), id + ': meet.' + phase);
    }
    for (const outcome of ['win','loss']) {
      assert.equal(entry.race[outcome].length, 2, id + ': two '+outcome+' alternatives');
      entry.race[outcome].forEach((line, i) =>
        assert(text(line), id + ': race.' + outcome + '[' + i + ']'));
    }
  }
});
test('the entire 434-line collection has no shared dialogue or placeholders', () => {
  const quotes = ids.flatMap(id => {
    const {meet,race} = CHARACTER_RACE_DIALOGUE[id];
    return [...Object.values(meet),...race.win,...race.loss];
  });
  assert.equal(quotes.length, 62 * 7);
  assert.equal(new Set(quotes).size, quotes.length, 'unique exact quotes for every slot');
  for (const quote of quotes) assert(!/[{}]|TODO|PLACEHOLDER/.test(quote), quote);
});
test('meet quotes use challenge / rival victory / rival defeat separately', () => {
  const c = CHARACTER_RACE_DIALOGUE.emiKanzaki.meet;
  assert.equal(getMeetCharacterQuote('emiKanzaki','ready'), c.ready);
  assert.equal(getMeetCharacterQuote('emiKanzaki','win'), c.win);
  assert.equal(getMeetCharacterQuote('emiKanzaki','loss'), c.loss);
  assert.notEqual(c.win,c.loss);
  assert.equal(getMeetCharacterQuote('oldRemovedRival','ready','old save quote'), 'old save quote');
});
test('end-race quote selector varies by race count, never at random', () => {
  const c=CHARACTER_RACE_DIALOGUE.ayaKurose.race;
  assert.equal(getRaceCharacterQuote('ayaKurose',true,0),c.win[0]);
  assert.equal(getRaceCharacterQuote('ayaKurose',true,1),c.win[1]);
  assert.equal(getRaceCharacterQuote('ayaKurose',true,2),c.win[0]);
  assert.equal(getRaceCharacterQuote('ayaKurose',false,1),c.loss[1]);
  assert.equal(getRaceCharacterQuote('oldRemovedRival',true,1,'fallback'), 'fallback');
});
test('substituted protagonist retains distinct substitute dialogue as a rival', () => {
  const male = getRivalReplacementCharacterId('renMizuno','renMizuno');
  const female = getRivalReplacementCharacterId('ayaKurose','ayaKurose');
  assert.equal(male,'keiNomura');
  assert.equal(female,'amiOkada');
  assert.notEqual(getMeetCharacterQuote(male),getMeetCharacterQuote('renMizuno'));
  assert.notEqual(getMeetCharacterQuote(female),getMeetCharacterQuote('ayaKurose'));
});
test('meet card resolves named dialogue even for saved, pre-R532 encounters', () => {
  const meet=read('src/scenes/MeetScene.js');
  assert(meet.includes("getMeetCharacterQuote(displayCharacter?.id || characterId, 'ready'"));
  assert(meet.includes("getMeetCharacterQuote(character.id, 'loss'"));
  assert(meet.includes("getMeetCharacterQuote(character.id, 'win'"));
  assert(meet.includes("getMeetCharacterQuote(character.id, 'ready'"));
});
test('finish screen shows both actual player and contextual rival responses', () => {
  const race=read('src/scenes/RaceScene.js');
  assert(race.includes('getRaceCharacterQuote(rivalCharacter.id, !playerWon,'));
  assert(race.includes('playerCharacter.id, playerWon, eventIndex,'));
  assert(race.includes('playerQuoteText = this.add.text'));
  assert(race.includes('rivalQuoteText, playerQuoteText]'));
});
