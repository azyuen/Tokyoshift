import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
 ISSUE01_EDITORIAL_PAGE_COUNT, ISSUE01_FEATURE_IDS, ISSUE01_PHOTO_CARS,
 drawIssue01Page,
} from '../src/ui/Issue01Pages.js';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Issue 01 has twelve editorial pages and five fixed feature cars', () => {
 assert.equal(ISSUE01_EDITORIAL_PAGE_COUNT,12);
 assert.deepEqual([...ISSUE01_FEATURE_IDS],['ae86','ef','fc3s','ek9','evo3']);
 for (const id of ['r32','spoonEk9','amuseS2000Gt1',...ISSUE01_FEATURE_IDS])
   assert.ok(ISSUE01_PHOTO_CARS.includes(id),id);
 assert.equal(typeof drawIssue01Page,'function');
});

test('later readings include Issue 01 before the existing dynamic garage archive', () => {
 const src=source('src/ui/CarHistoryPanel.js');
 assert.match(src,/totalViews = openingChoice \? 2 : firstArchiveView \+ featureSpreadCount/);
 assert.match(src,/if \(index === 1\) return buildIntroSpread\(\)/);
 assert.match(src,/if \(index < firstArchiveView\) return buildIssue01Spread\(index - 2\)/);
 assert.match(src,/return buildFeatureSpread\(index - firstArchiveView\)/);
 assert.match(src,/accept\.on\('pointerdown', \(\) =>/);
});

test('Ginza showcase remains fixed and the anonymous champion leaks no story secrets', () => {
 const pages=source('src/ui/Issue01Pages.js');
 assert.match(pages,/'spoonEk9'/);
 assert.match(pages,/'amuseS2000Gt1'/);
 assert.doesNotMatch(pages,/sayaka|strategist|father/i);
 assert.match(pages,/portrait=\(cx,cy/);
});

test('three practical guides cover shifts, clutch launches and 60 km/h rolling starts', () => {
 const pages=source('src/ui/Issue01Pages.js');
 for(const term of ['WHEN TO SHIFT','THE CLEAN LAUNCH','READ THE ROLL','60 km/h','FWD, RWD and AWD'])
   assert.ok(pages.includes(term),term);
});
