import { characters } from '../data/characters.js?v=20261006-r392';
import { cars } from '../data/cars.js?v=20261006-r388';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261005-r365';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';
const RESULT_FONT = '"Exo 2", sans-serif';

const RIVAL_LAYOUTS = [
  // Three overlapping panels across the upper-right.
  { x: 900, y: 175, w: 280, h: 250, skew: -18 },
  { x: 1135, y: 175, w: 280, h: 250, skew: 15 },
  { x: 1370, y: 175, w: 280, h: 250, skew: -16 },

  // Four overlapping panels across the lower-right.
  { x: 790, y: 525, w: 250, h: 285, skew: 15 },
  { x: 1005, y: 525, w: 250, h: 285, skew: -14 },
  { x: 1220, y: 525, w: 250, h: 285, skew: 14 },
  { x: 1435, y: 525, w: 250, h: 285, skew: -15 },
];

function panelPoints(layout) {
  const { x, y, w, h, skew = 0 } = layout;
  return [
    new Phaser.Geom.Point(x - w / 2 + skew, y - h / 2),
    new Phaser.Geom.Point(x + w / 2, y - h / 2),
    new Phaser.Geom.Point(x + w / 2 - skew, y + h / 2),
    new Phaser.Geom.Point(x - w / 2, y + h / 2),
  ];
}

function raceDistanceLabel(distanceM) {
  const value = Number(distanceM || 0);
  if (Math.abs(value - 402.336) < 1) return '1/4 MILE';
  if (Math.abs(value - 804.672) < 1) return '1/2 MILE';
  return Math.round(value) + ' M';
}

function drawPanel(scene, objects, points, {
  fill = 0xf1eadb,
  fillAlpha = 0.72,
  stroke = 0x11141a,
  strokeAlpha = 0.94,
  strokeWidth = 4,
  depth = 0,
} = {}) {
  const graphics = scene.add.graphics().setDepth(depth).setScrollFactor(0);
  graphics.fillStyle(fill, fillAlpha);
  graphics.fillPoints(points, true);
  graphics.lineStyle(strokeWidth, stroke, strokeAlpha);
  graphics.strokePoints(points, true);
  objects.push(graphics);
  return graphics;
}

function addMaskedProfile(scene, objects, masks, {
  characterId,
  pose = 'idle',
  layout,
  depth,
  side = 'center',
  profileOverride = null,
}) {
  const profile = createCharacterProfile(scene, {
    characterId,
    pose,
    x: layout.x,
    y: layout.y,
    frameWidth: layout.w,
    frameHeight: layout.h,
    side,
    depth,
    flipInward: true,
    mask: false,
    profileOverride,
  });
  if (!profile?.image) return null;

  profile.image.setScrollFactor(0);

  const maskShape = scene.make.graphics({ add: false });
  maskShape.fillStyle(0xffffff, 1);
  maskShape.fillPoints(panelPoints(layout), true);
  const geometryMask = maskShape.createGeometryMask();
  profile.image.setMask(geometryMask);

  objects.push(profile.image);
  masks.push(maskShape);
  return profile;
}

export function createRegionalChallengeTableau(scene, {
  regionId = 'REGION',
  rounds = [],
  stageIndex = 0,
  perfectMode = false,
  revealCurrent = false,
  onStart = null,
  onPause = null,
} = {}) {
  const depth = 330;
  const objects = [];
  const masks = [];
  const revealedLabels = [];
  let active = true;
  let startArmed = !revealCurrent;

  const add = obj => {
    if (obj) objects.push(obj);
    return obj;
  };

  // Keep the race location visible, but mute it enough for the manga collage.
  const blocker = add(scene.add.rectangle(780, 360, 1560, 720, 0x03070b, 0.38)
    .setDepth(depth)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true }));

  const safeStage = Math.max(0, Math.min(6, Number(stageIndex || 0)));
  const currentRound = rounds[safeStage] || {};
  const currentRival = characters[currentRound.characterId] || null;
  const currentCar = cars[currentRound.carId] || null;
  const raceNumber = safeStage + 1;
  const startType = currentRound.raceType === 'Roll Race'
    ? 'ROLLING START'
    : 'STANDING START';

  // Sparse editorial briefing, deliberately isolated in the left quadrant.
  add(scene.add.text(132, 58, String(regionId || 'REGION').toUpperCase(), {
    fontFamily: RESULT_FONT,
    fontSize: '13px',
    color: '#e9f0f2',
    fontStyle: 'italic 900',
    stroke: '#11141a',
    strokeThickness: 2,
  }).setDepth(depth + 30).setScrollFactor(0));

  const racerLine = add(scene.add.text(
    132,
    98,
    'Racer ' + raceNumber + ' of 7  ' + String(currentRival?.name || 'RIVAL'),
    {
      fontFamily: BODY_FONT,
      fontSize: '21px',
      color: '#ffffff',
      fontStyle: '700',
      stroke: '#071019',
      strokeThickness: 2,
    }
  ).setDepth(depth + 30).setScrollFactor(0));

  const specLine = add(scene.add.text(
    132,
    136,
    String(currentCar?.shortName || currentCar?.name || currentRound.carId || 'CAR').toUpperCase() +
      ' // ' + raceDistanceLabel(currentRound.distanceM) + ' // ' + startType,
    {
      fontFamily: BODY_FONT,
      fontSize: '15px',
      color: '#f4f7f8',
      fontStyle: '700',
      stroke: '#071019',
      strokeThickness: 2,
    }
  ).setDepth(depth + 30).setScrollFactor(0));

  const startHint = add(scene.add.text(132, 178, 'PRESS ANYWHERE TO START', {
    fontFamily: BODY_FONT,
    fontSize: '12px',
    color: '#f4f7f8',
    fontStyle: '700',
    stroke: '#071019',
    strokeThickness: 2,
  }).setDepth(depth + 30).setScrollFactor(0));

  const mainTitle = add(scene.add.text(
    132,
    236,
    perfectMode ? 'PERFECT\nSTREAK' : 'REGIONAL\nCHALLENGE',
    {
      fontFamily: RESULT_FONT,
      fontSize: perfectMode ? '48px' : '50px',
      color: '#f4f7f8',
      fontStyle: 'italic 900',
      stroke: '#11141a',
      strokeThickness: 4,
      lineSpacing: -10,
    }
  ).setDepth(depth + 30).setScrollFactor(0));

  const rivalQuote = String(
    currentRival?.resultQuotes?.win ||
    currentRival?.resultQuotes?.loss ||
    'This is where your run gets serious.'
  );

  const quoteBox = add(scene.add.rectangle(1115, 350, 520, 62, 0x0b0d10, 0.94)
    .setStrokeStyle(2, 0x11141a, 1)
    .setDepth(depth + 32)
    .setScrollFactor(0));

  add(scene.add.text(1115, 350, '“' + rivalQuote + '”', {
    fontFamily: BODY_FONT,
    fontSize: '14px',
    color: '#ffffff',
    fontStyle: '700',
    align: 'center',
    wordWrap: { width: 468 },
  }).setOrigin(0.5).setDepth(depth + 33).setScrollFactor(0));

  const pauseText = add(scene.add.text(132, 654, 'PAUSE CHALLENGE', {
    fontFamily: PIXEL_FONT,
    fontSize: '6px',
    color: '#9ca9af',
    backgroundColor: '#0d1218cc',
    padding: { x: 8, y: 5 },
  }).setDepth(depth + 35).setScrollFactor(0)
    .setInteractive({ useHandCursor: true }));

  rounds.slice(0, 7).forEach((round, index) => {
    const layout = RIVAL_LAYOUTS[index];
    if (!layout) return;

    const defeated = index < safeStage;
    const current = index === safeStage;
    const future = index > safeStage;
    const panelDepth = depth + 4 + index + (current ? 18 : 0);
    const points = panelPoints(layout);

    drawPanel(scene, objects, points, {
      fill: future ? 0x52585d : defeated ? 0x8b9195 : 0xf1eadb,
      fillAlpha: future ? 0.62 : defeated ? 0.55 : 0.78,
      stroke: current ? 0xf4f7f8 : 0x11141a,
      strokeAlpha: current ? 0.98 : 0.88,
      strokeWidth: current ? 5 : 4,
      depth: panelDepth,
    });

    const pose = defeated ? 'loss' : 'idle';
    const profile = addMaskedProfile(scene, objects, masks, {
      characterId: round.characterId,
      pose,
      layout,
      depth: panelDepth + 1,
      side: index < 3 ? 'left' : 'center',
      profileOverride: { scale: 0.98, offsetX: 0, offsetY: 14 },
    });

    if (profile?.image) {
      if (future || (current && revealCurrent)) {
        // Tint-fill produces a true featureless silhouette: only the alpha
        // outline remains, with no face/clothing detail.
        profile.image.setTintFill(0x73797e);
        profile.image.setAlpha(0.96);
      } else if (defeated) {
        profile.image.setTint(0x747b80);
        profile.image.setAlpha(0.76);
      }
    }

    // Names are earned/revealed progressively. Future silhouettes have no
    // labels at all.
    if (!future && !(current && revealCurrent)) {
      const characterName = String(characters[round.characterId]?.name || 'RIVAL').toUpperCase();
      const label = add(scene.add.text(
        layout.x - layout.w / 2 + 12,
        layout.y + layout.h / 2 - 30,
        characterName,
        {
          fontFamily: PIXEL_FONT,
          fontSize: '5px',
          color: defeated ? '#c0c5c8' : '#ffffff',
          backgroundColor: '#0d1218dd',
          padding: { x: 6, y: 4 },
        }
      ).setDepth(panelDepth + 3).setScrollFactor(0));
      revealedLabels[index] = label;
    }

    if (current && revealCurrent && profile?.image) {
      racerLine.setAlpha(0);
      specLine.setAlpha(0);
      startHint.setAlpha(0);

      scene.time.delayedCall(90, () => {
        if (!active || !profile.image?.active) return;

        scene.tweens.add({
          targets: profile.image,
          alpha: 0.18,
          duration: 90,
          ease: 'Quad.In',
          onComplete: () => {
            if (!active || !profile.image?.active) return;
            profile.image.clearTint();

            const label = add(scene.add.text(
              layout.x - layout.w / 2 + 12,
              layout.y + layout.h / 2 - 30,
              String(characters[round.characterId]?.name || 'RIVAL').toUpperCase(),
              {
                fontFamily: PIXEL_FONT,
                fontSize: '5px',
                color: '#ffffff',
                backgroundColor: '#0d1218dd',
                padding: { x: 6, y: 4 },
              }
            ).setDepth(panelDepth + 3).setScrollFactor(0).setAlpha(0));
            revealedLabels[index] = label;

            scene.tweens.add({
              targets: profile.image,
              alpha: 1,
              duration: 240,
              ease: 'Sine.easeOut',
            });
            scene.tweens.add({
              targets: [label, racerLine, specLine, startHint],
              alpha: 1,
              duration: 180,
              delay: 70,
              ease: 'Linear',
              onComplete: () => {
                startArmed = true;
              },
            });
          },
        });
      });
    }
  });

  blocker.on('pointerdown', () => {
    if (!active || !startArmed) return;
    onStart?.();
  });

  pauseText.on('pointerdown', (pointer, localX, localY, event) => {
    event?.stopPropagation?.();
    if (!active) return;
    onPause?.();
  });

  return {
    active: true,
    destroy() {
      if (!active) return;
      active = false;
      [...objects].reverse().forEach(obj => {
        try { obj?.destroy?.(); } catch (e) {}
      });
      masks.forEach(maskShape => {
        try { maskShape?.destroy?.(); } catch (e) {}
      });
      this.active = false;
    },
  };
}
