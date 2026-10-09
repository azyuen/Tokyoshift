import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const central = fs.readFileSync(
  new URL('../src/scenes/CentralTokyoScene.js', import.meta.url),
  'utf8'
);

function method(name, nextName) {
  const start = central.indexOf('  ' + name + '(');
  const end = central.indexOf('  ' + nextName + '(', start);
  assert.ok(start >= 0 && end > start, 'Expected method boundaries for ' + name);
  return central.slice(start, end);
}

test('CentralTokyoScene.create initializes event selection without undefined kind', () => {
  const startup = method('create', 'maybeShowTunerTeamCallout');
  assert.match(startup, /this\.contentObjects = \[\];\s+this\.selectedIndex = 0;\s+this\.selectedEventIndex = 0;/);
  assert.doesNotMatch(startup, /\bkind\b/);
  assert.match(startup, /this\.drawShell\(\);\s+this\.renderLocation\(this\.activeLocationId\)/);
  assert.match(startup, /finishSceneLoading\('CENTRAL TOKYO'\)/);
});

test('Central Tokyo retains Drag Complex fixed three-card menu and its refresh logic', () => {
  const drag = method('drawDragComplex', 'enterFourWideCup');
  assert.match(drag, /this\.getProDragEvents\(\)/);
  assert.match(drag, /this\.drawDragSide\(events\[this\.selectedEventIndex\], build\)/);
  assert.match(drag, /D\) REFRESH LINEUP/);
  assert.doesNotMatch(drag, /'4-LANE TEST'/);
  const refresh = method('devRefreshCentralLocation', 'openMap');
  assert.match(refresh, /const kind = location\?\.kind \|\| 'autoMarket'/);
  assert.match(refresh, /this\.devCentralRefreshOffsets\[key\]/);
});

test('scene bootstrap names and preload code remain callable', () => {
  assert.match(central, /  preload\(\) \{/);
  assert.match(central, /  create\(\) \{/);
  assert.match(central, /  renderLocation\(locationId, assetsAttempted = false\) \{/);
});
