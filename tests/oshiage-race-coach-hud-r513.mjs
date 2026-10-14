import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RACE_COACH_LAYOUT } from '../src/ui/RaceCoachHud.js';

const code = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const hud = code('src/ui/RaceCoachHud.js');
const race = code('src/scenes/RaceScene.js');

test('short manga dialogue stops at the midpoint, and is taller and top-aligned', () => {
  const b = RACE_COACH_LAYOUT.bubble;
  assert.ok(b.right >= 760 && b.right <= 800);
  assert.ok(b.right <= 1560 / 2 + 20);
  assert.ok(b.bottom - b.top >= 185);
  assert.ok(b.bottom >= 300);
  assert.ok(b.notchDepth >= 20 && b.notchHalfHeight >= 20);
  assert.ok(b.headingX >= b.left + b.notchDepth);
  assert.ok(b.textX >= b.left + b.notchDepth);
  assert.ok(b.textY - b.headingY <= 30);
  assert.ok(b.textWidth <= b.right - b.textX - 10);
  assert.match(hud, /bubble\.lineTo\(layout\.left - layout\.notchDepth, mid\)/);
  assert.match(hud, /bubble\.fillPath\(\)/);
  assert.match(hud, /bubble\.strokePath\(\)/);
});

test('portrait floats borderless with a zoomed and face-centred transparent crop', () => {
  const face = RACE_COACH_LAYOUT.face;
  assert.ok(face.x >= 40 && face.x <= 70 && face.y < 120);
  assert.ok(face.headHeight >= 180);
  assert.ok(face.width <= 225);
  assert.match(hud, /resolveCharacterFaceAnchor\(/);
  assert.match(hud, /face\.headHeight \/ Math\.max\(1, anchor\.headHeight\)/);
  assert.match(hud, /setMask\(maskShape\.createGeometryMask\(\)\)/);
  const portraitArea = hud.slice(hud.indexOf('const maskShape'), hud.indexOf('drawMangaSpeechBubble(scene, bubble)'));
  assert.doesNotMatch(portraitArea, /scene\.add\.rectangle|setStrokeStyle|setTint|fillRect\(face\.x, face\.y, face\.width, face\.height\).*setDepth/);
});

test('recommendation is a legible, smaller red motorsport decal', () => {
  const badge = RACE_COACH_LAYOUT.badge;
  assert.ok(badge.radius >= 72 && badge.radius <= 90);
  assert.ok(badge.x > RACE_COACH_LAYOUT.bubble.right + 100);
  assert.match(hud, /0xc92c3b/);
  assert.match(hud, /0x8e1d2b/);
  assert.match(hud, /strokeCircle/);
  assert.match(hud, /fillTriangle/);
  assert.match(hud, /fontSize: '13px'/);
});

test('HUD is reusable while existing coaching and shift decisions remain unchanged', () => {
  assert.match(race, /createRaceCoachHud\(this,/);
  assert.match(race, /this\.coachHud\?\.setPortrait\(pose\)/);
  assert.match(race, /this\.coachTargetLabel = this\.coachHud\.label/);
  assert.match(race, /this\.coachTarget = this\.coachHud\.value/);
  assert.match(race, /this\.coachTargetFoot = this\.coachHud\.footer/);
  assert.match(race, /this\.coach\.shiftAdvice\(from, rpm, tr\.lastShiftQuality\)/);
  assert.match(race, /this\.coachSpeak\(assessment\.verdict, assessment\.pose\)/);
  assert.match(race, /this\.completeCoachedLesson\(telemetry, elapsed > 55\)/);
  assert.doesNotMatch(race, /this\.add\.circle\(1375, 199, 125/);
});
