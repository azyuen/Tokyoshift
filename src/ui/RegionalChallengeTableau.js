import { characters } from '../data/characters.js?v=20261006-r392';
import { cars } from '../data/cars.js?v=20261006-r388';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261005-r365';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';
const RESULT_FONT = '"Exo 2", sans-serif';

const rivalLayouts = [
  { x: 145, y: 178, w: 210, h: 238, skew: -10 },
  { x: 370, y: 178, w: 210, h: 238, skew: 8 },
  { x: 595, y: 178, w: 210, h: 238, skew: -7 },
  { x: 168, y: 520, w: 250, h: 270, skew: 9 },
  { x: 458, y: 520, w: 250, h: 270, skew: -8 },
  { x: 748, y: 520, w: 250, h: 270, skew: 8 },
  { x: 1038, y: 520, w: 250, h: 270, skew: -9 },
];

const playerLayout = { x: 1320, y: 192, w: 420, h: 318, skew: 12 };

function panelPoints(layout) {
  const { x, y, w, h, skew = 0 } = layout;
  return [
    new Phaser.Geom.Point(x - w / 2 + skew, y - h / 2),
    new Phaser.Geom.Point(x + w / 2, y - h / 2),
    new Phaser.Geom.Point(x + w / 2 - skew, y + h / 2),
    new Phaser.Geom.Point(x - w / 2, y + h / 2),
  ];
}

function distanceLabel(distanceM) {
  const value = Number(distanceM || 0);
  if (Math.abs(value - 402.336) < 1) return '1/4 MILE';
  if (Math.abs(value - 804.672) < 1) return '1/2 MILE';
  return Math.round(value) + ' M';
}

function addPolygon(scene, objects, points, fill, alpha, stroke, strokeAlpha, width, depth) {
  const g = scene.add.graphics().setDepth(depth).setScrollFactor(0);
  g.fillStyle(fill, alpha);
  g.fillPoints(points, true);
  g.lineStyle(width, stroke, strokeAlpha);
  g.strokePoints(points, true);
  objects.push(g);
  return g;
}

function addProfile(scene, objects, masks, {
  characterId,
  pose,
  layout,
  depth,
  tint = null,
  alpha = 1,
  side = 'left',
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
  if (tint != null) profile.setTint(tint);
  profile.setAlpha(alpha);

  const maskShape = scene.make.graphics({ add: false });
  maskShape.fillStyle(0xffffff, 1);
  maskShape.fillPoints(panelPoints(layout), true);
  const mask = maskShape.createGeometryMask();
  profile.image.setMask(mask);

  objects.push(profile.image);
  masks.push(maskShape);
  return { profile, maskShape, mask };
}

export function createRegionalChallengeTableau(scene, {
  regionId = 'REGION',
  rounds = [],
  stageIndex = 0,
  playerCharacterId,
  playerDisplayName = 'YOU',
  mode = 'briefing',
  playerWon = null,
  perfectMode = false,
  completed = false,
  failed = false,
  settlement = null,
  onStart = null,
  onPause = null,
  onContinue = null,
  onNextReady = null,
} = {}) {
  const depth = 330;
  const objects = [];
  const masks = [];
  const panelRefs = [];
  let active = true;
  let transitioning = false;
  let briefingControls = [];

  const add = obj => {
    if (obj) objects.push(obj);
    return obj;
  };

  const shade = add(scene.add.rectangle(780, 360, 1560, 720, 0x03070b, 0.62)
    .setDepth(depth)
    .setScrollFactor(0)
    .setInteractive());

  add(scene.add.rectangle(780, 360, 1510, 680, 0x071019, 0.16)
    .setStrokeStyle(2, 0xdce5e8, 0.16)
    .setDepth(depth + 1)
    .setScrollFactor(0));

  const header = add(scene.add.text(825, 54, String(regionId).toUpperCase() + ' // REGIONAL CHALLENGE', {
    fontFamily: PIXEL_FONT,
    fontSize: '8px',
    color: '#d5e3e8',
    backgroundColor: '#0b1017bb',
    padding: { x: 8, y: 5 },
  }).setOrigin(0.5).setDepth(depth + 20).setScrollFactor(0));

  const getHeadline = () => {
    const raceNumber = stageIndex + 1;
    if (mode === 'result') {
      if (failed) return perfectMode ? 'STREAK BROKEN' : 'CHALLENGE PAUSED';
      if (completed) return settlement?.teamChallengePerfect ? 'PERFECT STREAK!' : 'REGIONAL CHAMPION';
      if (perfectMode) return 'STREAK #' + raceNumber;
      return 'VICTORY ' + raceNumber + ' OF 7';
    }
    return perfectMode ? 'PERFECT STREAK' : 'REGIONAL CHALLENGE';
  };

  const headline = add(scene.add.text(825, 102, getHeadline(), {
    fontFamily: RESULT_FONT,
    fontSize: mode === 'result' && completed ? '48px' : '38px',
    color: failed ? '#ff9caf' : '#a8f3e3',
    fontStyle: 'italic 900',
    stroke: '#11141a',
    strokeThickness: 4,
    align: 'center',
  }).setOrigin(0.5).setDepth(depth + 21).setScrollFactor(0));

  const subhead = add(scene.add.text(825, 154, '', {
    fontFamily: PIXEL_FONT,
    fontSize: '8px',
    color: '#eef6f8',
    backgroundColor: '#10151dcc',
    padding: { x: 8, y: 5 },
    align: 'center',
  }).setOrigin(0.5).setDepth(depth + 21).setScrollFactor(0));

  const detail = add(scene.add.text(825, 194, '', {
    fontFamily: BODY_FONT,
    fontSize: '13px',
    color: '#d1dce1',
    fontStyle: '700',
    align: 'center',
    lineSpacing: 4,
    wordWrap: { width: 390 },
  }).setOrigin(0.5, 0).setDepth(depth + 21).setScrollFactor(0));

  const actionHint = add(scene.add.text(825, 331, '', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#9eabb2',
    align: 'center',
  }).setOrigin(0.5).setDepth(depth + 22).setScrollFactor(0));

  const updateCopy = (index, nextMode = mode) => {
    const round = rounds[index] || {};
    const rival = characters[round.characterId];
    const car = cars[round.carId];
    const raceNumber = index + 1;
    const start = round.raceType === 'Roll Race' ? 'ROLLING START' : 'STANDING START';

    if (nextMode === 'briefing') {
      headline.setText(perfectMode ? 'PERFECT STREAK' : 'REGIONAL CHALLENGE');
      headline.setColor('#a8f3e3');
      subhead.setText('RACER ' + raceNumber + ' OF 7 // ' + String(rival?.name || 'RIVAL').toUpperCase());
      detail.setText(
        String(car?.shortName || car?.name || round.carId || 'CAR').toUpperCase() +
        ' // ' + distanceLabel(round.distanceM) + ' // ' + start +
        '\n' +
        (perfectMode
          ? 'SEVEN STRAIGHT WINS // ONE LOSS BREAKS THE STREAK'
          : 'DEFEAT THE REGIONAL CREW // SAME CAR THROUGH THE RUN')
      );
      actionHint.setText('');
      return;
    }

    if (failed) {
      subhead.setText(
        'RACER ' + raceNumber + ' OF 7 // ' +
        String(rival?.name || 'RIVAL').toUpperCase()
      );
      detail.setText(
        perfectMode
          ? 'THE PERFECT STREAK ENDS HERE'
          : String(settlement?.progress ?? index) + ' OF 7 RIVALS DEFEATED // PROGRESS SAVED'
      );
      actionHint.setText('TAP ANYWHERE // RETURN TO MEET');
      return;
    }

    if (completed) {
      subhead.setText('7 OF 7 // ' + String(regionId).toUpperCase() + ' CREW DEFEATED');
      detail.setText(
        settlement?.teamChallengePerfect
          ? 'SEVEN STRAIGHT WINS // PERFECT REGIONAL CLEAR'
          : 'REGIONAL CHAMPIONSHIP COMPLETE'
      );
      actionHint.setText('TAP ANYWHERE // CONTINUE');
      return;
    }

    subhead.setText(
      'RACER ' + raceNumber + ' OF 7 // ' +
      String(rival?.name || 'RIVAL').toUpperCase() + ' DEFEATED'
    );
    detail.setText(
      String(car?.shortName || car?.name || round.carId || 'CAR').toUpperCase() +
      ' // ' + distanceLabel(round.distanceM) + ' // ' + start
    );
    actionHint.setText('TAP ANYWHERE // REVEAL NEXT RACER');
  };

  const createRivalPanel = (round, index) => {
    const layout = rivalLayouts[index];
    if (!layout) return null;

    const isBefore = index < stageIndex;
    const isCurrent = index === stageIndex;
    const resultWinCurrent = mode === 'result' && isCurrent && playerWon === true;
    const resultLossCurrent = mode === 'result' && isCurrent && playerWon === false;
    const defeated = isBefore || resultWinCurrent || (completed && index <= stageIndex);
    const future = index > stageIndex;
    const activeRival = isCurrent && !defeated;
    const points = panelPoints(layout);

    addPolygon(
      scene,
      objects,
      points,
      future ? 0x20262d : defeated ? 0x9aa0a5 : 0xf1eadb,
      future ? 0.72 : defeated ? 0.52 : 0.78,
      activeRival ? 0xa8f3e3 : 0x11141a,
      activeRival ? 0.98 : 0.90,
      activeRival ? 4 : 3,
      depth + 5
    );

    const pose = defeated ? 'loss' : resultLossCurrent ? 'win' : 'idle';
    const portrait = addProfile(scene, objects, masks, {
      characterId: round?.characterId,
      pose,
      layout,
      depth: depth + 6,
      tint: future ? 0x303741 : defeated ? 0x6d757c : null,
      alpha: future ? 0.88 : defeated ? 0.76 : 1,
      side: index < 3 ? 'left' : 'center',
      profileOverride: { scale: 0.96, offsetX: 0, offsetY: 12 },
    });

    const name = characters[round?.characterId]?.name || 'RIVAL';
    const car = cars[round?.carId];
    const labelText = future
      ? 'RIVAL ' + (index + 1) + ' // ???'
      : String(name).toUpperCase() + ' // ' + String(car?.shortName || '').toUpperCase();

    const label = add(scene.add.text(
      layout.x - layout.w / 2 + 12,
      layout.y + layout.h / 2 - 30,
      labelText,
      {
        fontFamily: PIXEL_FONT,
        fontSize: index < 3 ? '5px' : '6px',
        color: future ? '#65717a' : defeated ? '#b7bec2' : '#f7fbfc',
        backgroundColor: '#0d1218dd',
        padding: { x: 6, y: 4 },
        wordWrap: { width: layout.w - 24 },
      }
    ).setDepth(depth + 9).setScrollFactor(0));

    const stateTag = add(scene.add.text(
      layout.x + layout.w / 2 - 10,
      layout.y - layout.h / 2 + 12,
      defeated ? 'DEFEATED' : activeRival ? 'CURRENT' : '???',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '5px',
        color: defeated ? '#c0c5c8' : activeRival ? '#a8f3e3' : '#56616a',
        backgroundColor: '#0d1218cc',
        padding: { x: 5, y: 3 },
      }
    ).setOrigin(1, 0).setDepth(depth + 9).setScrollFactor(0));

    const ref = {
      index,
      layout,
      round,
      portrait,
      label,
      stateTag,
      defeated,
      future,
    };
    panelRefs[index] = ref;
    return ref;
  };

  rounds.slice(0, 7).forEach((round, index) => createRivalPanel(round, index));

  const playerPoints = panelPoints(playerLayout);
  addPolygon(
    scene,
    objects,
    playerPoints,
    0xf1eadb,
    0.80,
    0x11141a,
    0.95,
    5,
    depth + 7
  );

  const playerPose = mode === 'result'
    ? (playerWon ? 'win' : 'loss')
    : 'idle';
  addProfile(scene, objects, masks, {
    characterId: playerCharacterId,
    pose: playerPose,
    layout: playerLayout,
    depth: depth + 8,
    side: 'right',
    profileOverride: { scale: 1.00, offsetX: 0, offsetY: 18 },
  });

  add(scene.add.text(
    playerLayout.x + playerLayout.w / 2 - 14,
    playerLayout.y + playerLayout.h / 2 - 34,
    'YOU // ' + String(playerDisplayName || 'PLAYER').toUpperCase(),
    {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#ffffff',
      backgroundColor: '#0d1218dd',
      padding: { x: 7, y: 5 },
    }
  ).setOrigin(1, 0).setDepth(depth + 11).setScrollFactor(0));

  const clearBriefingControls = () => {
    briefingControls.forEach(obj => obj?.destroy?.());
    briefingControls = [];
  };

  const addBriefingControls = (index, startLabel = null) => {
    clearBriefingControls();
    const button = scene.add.rectangle(825, 288, 250, 48, 0x173229, 0.98)
      .setStrokeStyle(2, 0xa8f3e3, 1)
      .setDepth(depth + 30)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    const buttonText = scene.add.text(
      825,
      288,
      startLabel || ('START RACE ' + (index + 1)),
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#effffb',
      }
    ).setOrigin(0.5).setDepth(depth + 31).setScrollFactor(0);

    const pause = scene.add.text(825, 356, 'PAUSE CHALLENGE', {
      fontFamily: PIXEL_FONT,
      fontSize: '6px',
      color: '#9eabb2',
      backgroundColor: '#111820dd',
      padding: { x: 8, y: 5 },
    }).setOrigin(0.5).setDepth(depth + 31).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => onStart?.(index));
    pause.on('pointerdown', () => onPause?.());

    briefingControls.push(button, buttonText, pause);
  };

  const transitionToNext = () => {
    if (transitioning || !active) return;
    const nextIndex = stageIndex + 1;
    const nextRef = panelRefs[nextIndex];
    const nextRound = rounds[nextIndex];
    if (!nextRef || !nextRound) {
      onContinue?.();
      return;
    }

    transitioning = true;
    actionHint.setText('');
    scene.tweens.add({
      targets: [headline, subhead, detail],
      alpha: 0,
      duration: 110,
      ease: 'Linear',
      onComplete: () => {
        updateCopy(nextIndex, 'briefing');
        headline.setAlpha(1);
        subhead.setAlpha(1);
        detail.setAlpha(1);

        const image = nextRef.portrait?.profile?.image;
        if (image) {
          scene.tweens.add({
            targets: image,
            alpha: 0.16,
            duration: 90,
            ease: 'Quad.In',
            onComplete: () => {
              nextRef.portrait.profile.setTint(null);
              image.setAlpha(0.16);
              nextRef.label.setText(
                String(characters[nextRound.characterId]?.name || 'RIVAL').toUpperCase() +
                ' // ' + String(cars[nextRound.carId]?.shortName || '').toUpperCase()
              ).setColor('#f7fbfc');
              nextRef.stateTag.setText('CURRENT').setColor('#a8f3e3');

              scene.tweens.add({
                targets: image,
                alpha: 1,
                duration: 230,
                ease: 'Sine.easeOut',
                onComplete: () => {
                  transitioning = false;
                  addBriefingControls(nextIndex);
                  onNextReady?.(nextIndex);
                },
              });
            },
          });
        } else {
          transitioning = false;
          addBriefingControls(nextIndex);
          onNextReady?.(nextIndex);
        }
      },
    });
  };

  updateCopy(stageIndex, mode);

  if (mode === 'briefing') {
    addBriefingControls(stageIndex);
  } else {
    shade.on('pointerdown', () => {
      if (transitioning) return;
      if (!failed && !completed && playerWon) {
        transitionToNext();
      } else {
        onContinue?.();
      }
    });
  }

  return {
    active: true,
    panels: panelRefs,
    headline,
    subhead,
    detail,
    actionHint,
    transitionToNext,
    destroy() {
      if (!active) return;
      active = false;
      clearBriefingControls();
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
