import { getActiveMagazineIssue } from '../data/carMagazine.js?v=20261011-r479';
import { getTunerTeamChallengeState } from '../data/tunerChallenges.js?v=20261011-r479';
import { getCrewBattleProgress } from '../data/crewSystem.js?v=20261011-r479';
import { showMagazinePanel } from './CarHistoryPanel.js?v=20261011-r475';

import { showCarHistoryLedger } from './CarHistoryLedger.js?v=20261006-r388';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const OFFICE_BACKGROUNDS = Object.freeze({
  shinonomeWorkshop: 'officeWorkshopBg',
  shinonomeCanalYard: 'officeCanalYardBg',
  shinonomeWarehouseStrip: 'officeWarehouseBg',
});

const REGIONS = Object.freeze([
  { id: 'ODAIBA', key: 'officeFlagOdaiba' },
  { id: 'SHINAGAWA', key: 'officeFlagShinagawa' },
  { id: 'TATSUMI', key: 'officeFlagTatsumi' },
  { id: 'SHIBUYA', key: 'officeFlagShibuya' },
  { id: 'YOKOHAMA', key: 'officeFlagYokohama' },
  { id: 'DAIKOKU', key: 'officeFlagDaikoku' },
  { id: 'SHINJUKU', key: 'officeFlagShinjuku' },
]);

const BADGE_PLACEMENT = Object.freeze({
  crown: { key: 'officeBadgeCrown', y: 380 / 576 },
  star: { key: 'officeBadgeStar', y: 441 / 576 },
  crew: { key: 'officeBadgeCrew', y: 502 / 576 },
});

function destroyObjects(objects = []) {
  objects.forEach(obj => {
    try { obj?.destroy?.(); } catch (e) {}
  });
}

function workshopLabel(id) {
  if (id === 'shinonomeCanalYard') return 'CANAL YARD';
  if (id === 'shinonomeWarehouseStrip') return 'WAREHOUSE HQ';
  return 'HOME WORKSHOP';
}

function officeFrame(scene, key) {
  const source = scene.textures.get(key)?.getSourceImage?.();
  if (!source?.width || !source?.height) {
    return { x: 0, y: 0, w: 1560, h: 840 };
  }

  const scale = Math.min(1560 / source.width, 840 / source.height);
  const w = source.width * scale;
  const h = source.height * scale;
  return {
    x: (1560 - w) / 2,
    y: (840 - h) / 2,
    w,
    h,
  };
}

function point(frame, nx, ny) {
  return {
    x: frame.x + frame.w * nx,
    y: frame.y + frame.h * ny,
  };
}

function addHotspot(scene, add, frame, config) {
  const p = point(frame, config.x, config.y);
  const box = add(scene.add.rectangle(
    p.x,
    p.y,
    frame.w * config.w,
    frame.h * config.h,
    0x43dfff,
    0.001
  ).setDepth(config.depth || 205)
    .setInteractive({ useHandCursor: true }));

  box.on('pointerover', () => {
    box.setFillStyle(0x43dfff, 0.08);
    box.setStrokeStyle(2, 0x8beaff, 0.80);
  });
  box.on('pointerout', () => {
    box.setFillStyle(0x43dfff, 0.001);
    box.setStrokeStyle(0, 0x43dfff, 0);
  });
  box.on('pointerdown', config.onActivate);
  return box;
}

function showOfficePopup(scene, title, lines = []) {
  if (scene._officeRecordOverlay?.length) return;

  const objects = [];
  const add = obj => {
    objects.push(obj);
    return obj;
  };
  scene._officeRecordOverlay = objects;
  const close = () => {
    destroyObjects(objects);
    scene._officeRecordOverlay = [];
  };

  const depth = 280;
  const blocker = add(scene.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.76)
    .setDepth(depth)
    .setInteractive());

  add(scene.add.rectangle(780, 420, 720, 430, 0x08131f, 0.995)
    .setStrokeStyle(3, 0x43dfff, 0.96)
    .setDepth(depth + 1));

  add(scene.add.text(780, 275, title, {
    fontFamily: PIXEL_FONT,
    fontSize: '16px',
    color: '#eefaff',
    align: 'center',
  }).setOrigin(0.5).setDepth(depth + 2));

  add(scene.add.text(780, 420, lines.join('\n'), {
    fontFamily: BODY_FONT,
    fontSize: '13px',
    color: '#b9d3df',
    fontStyle: '700',
    align: 'center',
    lineSpacing: 12,
    wordWrap: { width: 570 },
  }).setOrigin(0.5).setDepth(depth + 2));

  const button = add(scene.add.rectangle(780, 565, 180, 44, 0x142330, 1)
    .setStrokeStyle(1, 0x7298ac, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(depth + 2));

  add(scene.add.text(780, 565, 'CLOSE', {
    fontFamily: PIXEL_FONT,
    fontSize: '8px',
    color: '#d5e9f2',
  }).setOrigin(0.5).setDepth(depth + 3));

  button.on('pointerdown', close);
  blocker.on('pointerdown', close);
}

function getRegionAchievement(scene, regionId) {
  const dev = Boolean(scene.registry.get('devMode'));
  const regionWins = scene.registry.get('regionWins') || {};
  const challenge = getTunerTeamChallengeState(scene.registry, regionId);
  const crew = getCrewBattleProgress(scene.registry)?.[regionId] || {};

  const hasProgress = dev ||
    challenge.championEarned ||
    challenge.perfectEarned ||
    Boolean(crew.completed);

  return {
    visible: hasProgress,
    wins: Math.max(0, Number(regionWins[regionId] || 0)),
    crown: dev || challenge.championEarned,
    star: dev || challenge.perfectEarned,
    crew: dev || Boolean(crew.completed),
  };
}

function showRegionRecord(scene, regionId, achievement) {
  showOfficePopup(scene, regionId + ' // RECORD', [
    'REGIONAL WINS  //  ' + achievement.wins,
    'REGIONAL CHAMPION  //  ' + (achievement.crown ? 'EARNED' : 'PENDING'),
    'PERFECT CLEAR  //  ' + (achievement.star ? 'EARNED' : 'PENDING'),
    'CREW BATTLE  //  ' + (achievement.crew ? 'CLEARED' : 'PENDING'),
  ]);
}

export function showOfficePanel(scene) {
  if (scene._officeOverlay?.length) return;

  const workshopId =
    scene.registry.get('workshopLocationId') ||
    scene.activeWorkshopId ||
    'shinonomeWorkshop';
  const backgroundKey =
    OFFICE_BACKGROUNDS[workshopId] ||
    OFFICE_BACKGROUNDS.shinonomeWorkshop;

  if (!scene.textures.exists(backgroundKey)) {
    scene.showWorkshopToast?.('OFFICE ASSET NOT LOADED');
    return;
  }

  const objects = [];
  const add = obj => {
    objects.push(obj);
    return obj;
  };
  scene._officeOverlay = objects;

  const closeOffice = () => {
    destroyObjects(scene._officeRecordOverlay || []);
    scene._officeRecordOverlay = [];
    destroyObjects(objects);
    scene._officeOverlay = [];
    if (scene.closeOpeningOffice === closeOffice) scene.closeOpeningOffice = null;
  };
  // The Sayaka call is received while the office is open. Only NEXT dismisses
  // the office to reveal the real garage before the car enters.
  scene.closeOpeningOffice = closeOffice;

  // Prevent workshop controls beneath the room from receiving input.
  add(scene.add.rectangle(780, 420, 1560, 840, 0x010308, 1)
    .setDepth(190)
    .setInteractive());

  const frame = officeFrame(scene, backgroundKey);
  add(scene.add.image(
    frame.x + frame.w / 2,
    frame.y + frame.h / 2,
    backgroundKey
  ).setDisplaySize(frame.w, frame.h)
    .setDepth(191));
  add(scene.add.rectangle(frame.x + frame.w / 2, frame.y + frame.h / 2,
    frame.w - 4, frame.h - 4, 0x000000, 0)
    .setStrokeStyle(3, 0x43dfff, 0.96).setDepth(216));

  const titleP = point(frame, 0.50, 0.055);
  add(scene.add.rectangle(titleP.x, titleP.y, 390, 42, 0x06111b, 0.82)
    .setStrokeStyle(1, 0x3d6f87, 0.70)
    .setDepth(212));
  add(scene.add.text(
    titleP.x,
    titleP.y,
    'OFFICE // ' + workshopLabel(workshopId),
    {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#dff5ff',
    }
  ).setOrigin(0.5).setDepth(213));

  const backP = point(frame, 0.08, 0.055);
  const back = add(scene.add.rectangle(backP.x, backP.y, 160, 44, 0x0b1724, 0.94)
    .setStrokeStyle(2, 0x43dfff, 0.88)
    .setInteractive({ useHandCursor: true })
    .setDepth(214));
  add(scene.add.text(backP.x, backP.y, '<  WORKSHOP', {
    fontFamily: PIXEL_FONT,
    fontSize: '8px',
    color: '#eefaff',
  }).setOrigin(0.5).setDepth(215));
  back.on('pointerdown', closeOffice);

  const openingMagazine = scene.registry.get('openingChapter') === 'magazine';
  // One canonical Issue 01 viewer for the first read and every later visit.
  // The magazine itself enforces the temporary page cap during onboarding.
  const openMagazine = () => showMagazinePanel(scene, openingMagazine ? {
    onChoose: carId => {
      // Keep the office artwork behind the incoming-call overlay.
      scene.completeOpeningMagazineChoice?.(carId);
    },
  } : {});

  if (openingMagazine) {
    const instruction = add(scene.add.text(
      frame.x + frame.w * 0.36, frame.y + frame.h * 0.715,
      'READ THE TOKYO SHIFT MAGAZINE', {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#ffffff',
        backgroundColor: '#06303b', padding: { x: 14, y: 11 },
        align: 'center',
      }
    ).setOrigin(0.5).setDepth(218));
    scene.tweens.add({ targets: instruction, alpha: 0.65, duration: 550, yoyo: true, repeat: -1 });
  }

  // Seven regional pennants. The badge positions follow the authored
  // 160x576 flag asset coordinates in garage_assets.json.
  // Keep the achievement wall compact and biased left so the right-hand
  // display remains clear for a future large event trophy.
  const flagTop = frame.y + frame.h * 0.255;
  const flagHeight = frame.h * 0.355;
  const flagWidth = flagHeight * (160 / 576);
  const flagStartX = 0.255;
  const flagGap = 0.0600;
  const badgeSize = flagHeight * (56 / 576);

  REGIONS.forEach((region, index) => {
    const achievement = getRegionAchievement(scene, region.id);
    if (!achievement.visible || !scene.textures.exists(region.key)) return;

    const x = frame.x + frame.w * (flagStartX + flagGap * index);
    const flag = add(scene.add.image(x, flagTop, region.key)
      .setOrigin(0.5, 0)
      .setDisplaySize(flagWidth, flagHeight)
      .setInteractive({ useHandCursor: true })
      .setDepth(198));

    flag.on('pointerover', () => flag.setAlpha(0.84));
    flag.on('pointerout', () => flag.setAlpha(1));
    flag.on('pointerdown', () => showRegionRecord(scene, region.id, achievement));

    const badges = [
      ['crown', achievement.crown],
      ['star', achievement.star],
      ['crew', achievement.crew],
    ];

    badges.forEach(([badgeId, earned]) => {
      const cfg = BADGE_PLACEMENT[badgeId];
      if (!earned || !scene.textures.exists(cfg.key)) return;
      const badge = add(scene.add.image(
        x,
        flagTop + flagHeight * cfg.y,
        cfg.key
      ).setDisplaySize(badgeSize, badgeSize)
        .setInteractive({ useHandCursor: true })
        .setDepth(201));
      badge.on('pointerdown', () => showRegionRecord(scene, region.id, achievement));
    });
  });

  // First magazine on the rack: use the live issue cover already loaded by
  // GarageScene, so future issues can continue to use the same rack entry.
  const issue = getActiveMagazineIssue(scene.registry);
  if (issue?.coverKey && scene.textures.exists(issue.coverKey)) {
    const source = scene.textures.get(issue.coverKey).getSourceImage();
    const coverP = point(frame, 0.290, 0.832);
    const coverH = frame.h * 0.122;
    const coverW = coverH * (source.width / Math.max(1, source.height));

    add(scene.add.rectangle(
      coverP.x + 5,
      coverP.y + 6,
      coverW + 8,
      coverH + 8,
      0x000000,
      0.36
    ).setAngle(0).setDepth(199));

    const cover = add(scene.add.image(coverP.x, coverP.y, issue.coverKey)
      .setDisplaySize(coverW, coverH)
      .setAngle(0)
      .setInteractive({ useHandCursor: true })
      .setDepth(202));
    const sx = cover.scaleX;
    const sy = cover.scaleY;
    cover.on('pointerover', () => cover.setScale(sx * 1.04, sy * 1.04));
    cover.on('pointerout', () => cover.setScale(sx, sy));
    if (openingMagazine) {
      const outline = add(scene.add.rectangle(
        coverP.x, coverP.y, coverW + 20, coverH + 20, 0x000000, 0
      ).setStrokeStyle(4, 0x62e8c7, 1).setDepth(201));
      scene.tweens.add({ targets: outline, alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });
    }
    cover.on('pointerdown', openMagazine);
  }

  // Transparent, hover-revealed interaction zones preserve the authored
  // office artwork while making the display areas reliable on touch screens.
  addHotspot(scene, add, frame, {
    x: 0.115, y: 0.285, w: 0.17, h: 0.24,
    onActivate: () => showCarHistoryLedger(scene),
  });
  addHotspot(scene, add, frame, {
    x: 0.84, y: 0.52, w: 0.25, h: 0.37,
    onActivate: () => showOfficePopup(scene, 'TROPHY CASE', [
      'NO TROPHIES YET',
      'Event trophies will appear here as those events are introduced.',
    ]),
  });
  addHotspot(scene, add, frame, {
    // Exact bottom-right CAR COUPONS register: sign + coupon cards.
    // Keep this above the broad trophy area so taps always resolve here.
    x: 0.765, y: 0.815, w: 0.155, h: 0.18,
    depth: 220,
    onActivate: () => {
      if (typeof scene.showCouponsPopup === 'function') {
        scene.showCouponsPopup();
      }
    },
  });
}
