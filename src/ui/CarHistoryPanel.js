import { cars } from '../data/cars.js?v=20261006-r388';
import { engines } from '../data/engines.js?v=20261004-r333';
import { applyEngineTuning } from '../data/tuning.js?v=20260926-r211';
import { applySecondaryTuning } from '../data/secondaryTuning.js?v=20260926-r211';
import {
  getCarMagazineMeta,
  getCarMagazineSightings,
  getActiveMagazineIssue,
} from '../data/carMagazine.js?v=20261006-r388';
import {
  createCarBodyLayers,
  getCarBodyScaleForWidth,
  getCarBodyTextureKey,
  getCarPaintColor,
  preloadCarAppearanceAssets,
  preloadCarWheel,
  ensureDerivedModularCarTextures,
} from '../vehicles/CarAppearance.js?v=20260929-r246';
import { getWheelPairFit } from '../vehicles/WheelFit.js?v=20260929-r258';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

function destroyObjects(objects = []) {
  objects.forEach(obj => {
    try { obj?.destroy?.(); } catch (e) {}
  });
}

function money(value) {
  return '¥ ' + Number(value || 0).toLocaleString('en-US');
}

function acquisitionLabel(value = '') {
  const labels = {
    starter: 'STARTER CAR',
    pinkSlip: 'PINK SLIP',
    tokyoAutoMarket: 'TOKYO AUTO MARKET',
    tokyoAutoMarketNew: 'TOKYO AUTO MARKET',
    tokyoAutoMarketUsed: 'TOKYO AUTO MARKET',
    competitionCoupon: 'COMPETITION COUPON',
    ginzaMotorGallery: 'GINZA MOTOR GALLERY',
    'tuner-shop': 'TUNER BUILD',
    rivalBuild: 'PINK SLIP',
    legacy: 'EARLY GARAGE',
  };
  return labels[value] || String(value || 'GARAGE').replaceAll('_', ' ').toUpperCase();
}

function statusLabel(entry = {}) {
  const status = String(entry.status || 'OWNED').toUpperCase();
  if (status === 'OWNED') return 'CURRENT GARAGE';
  if (status === 'SOLD') return 'SOLD' + (entry.salePrice ? ' // ' + money(entry.salePrice) : '');
  if (status === 'PINK_SLIP_LOST') return 'LOST ON A PINK SLIP';
  if (status === 'CONVERTED') return 'CONVERTED';
  if (status === 'LEGACY_ARCHIVED') return 'PRE-HISTORY ARCHIVE';
  return status.replaceAll('_', ' ');
}

function dateLabel(timestamp) {
  const value = Number(timestamp || 0);
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return date.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();
  } catch (e) {
    return '';
  }
}

function tunedStats(carId, state = {}) {
  const car = cars[carId];
  const engine = car ? engines[car.engine] : null;
  if (!car || !engine) return null;

  try {
    const engineBuild = applyEngineTuning(car, engine, state || {});
    const full = applySecondaryTuning(engineBuild.car, engineBuild.engine, state || {});
    return {
      power: Math.round(Number(full.car.powerKW || car.powerKW || 0)),
      torque: Math.round(Number(full.car.torqueNm || car.torqueNm || 0)),
      weight: Math.round(Number(full.car.vehicleMassKg || car.vehicleMassKg || 0)),
    };
  } catch (e) {
    return {
      power: Math.round(Number(car.powerKW || 0)),
      torque: Math.round(Number(car.torqueNm || 0)),
      weight: Math.round(Number(car.vehicleMassKg || 0)),
    };
  }
}

function buildMagazineFeatures(scene) {
  const history = [...(scene.registry.get('carHistory') || [])]
    .filter(entry => entry?.carId)
    .sort((a, b) => Number(b.acquiredAt || 0) - Number(a.acquiredAt || 0));
  const ownedIds = new Set((scene.registry.get('ownedCarIds') || []).map(String));
  const currentStates = scene.registry.get('carStates') || {};
  const latestByCar = new Map();

  history.forEach(entry => {
    if (!latestByCar.has(entry.carId)) latestByCar.set(entry.carId, entry);
  });

  const owned = [...ownedIds]
    .filter(id => cars[id])
    .map(id => {
      const entry = latestByCar.get(id) || {
        carId: id,
        status: 'OWNED',
        acquiredVia: currentStates[id]?.acquiredVia || 'garage',
      };
      return {
        kind: 'OWNED',
        carId: id,
        entry,
        state: currentStates[id] || entry.lastState || {},
      };
    });

  const archived = [...latestByCar.values()]
    .filter(entry => !ownedIds.has(String(entry.carId)) && cars[entry.carId])
    .map(entry => ({
      kind: 'ARCHIVE',
      carId: entry.carId,
      entry,
      state: entry.lastState || {},
    }));

  const sightings = Object.values(getCarMagazineSightings(scene.registry))
    .filter(item => item?.carId && !ownedIds.has(String(item.carId)))
    .sort((a, b) => Number(b.lastSeenAt || 0) - Number(a.lastSeenAt || 0))
    .map(item => ({
      kind: 'SIGHTING',
      carId: item.carId,
      sighting: item,
      state: {},
    }));

  return [...owned, ...archived, ...sightings];
}

export function renderCarPhoto(scene, feature, x, y, targetWidth, depth, add) {
  const car = cars[feature.carId];
  if (!car) return false;

  const bodyKey = getCarBodyTextureKey(scene, car);
  const wheelKey = car.visual?.wheelKey;
  if (!scene.textures.exists(bodyKey) || !wheelKey || !scene.textures.exists(wheelKey)) {
    return false;
  }

  const bodyScale = getCarBodyScaleForWidth(scene, car, targetWidth);
  const wheelSource = scene.textures.get(wheelKey).getSourceImage();
  const fit = getWheelPairFit(car.visual || {}, bodyScale, false, wheelSource);
  const renderOffsetY = Number(car.visual?.renderOffsetY || 0) * bodyScale;
  const displayY = y + renderOffsetY;
  const rearX = x + fit.rear.offsetX;
  const frontX = x + fit.front.offsetX;
  const rearY = displayY + fit.rear.offsetY;
  const frontY = displayY + fit.front.offsetY;

  add(scene.add.ellipse(
    x,
    Math.max(rearY, frontY) + 8,
    targetWidth * 0.92,
    28,
    0x000000,
    0.22
  ).setDepth(depth - 0.2));

  const rearBacking = add(scene.add.circle(
    rearX,
    rearY,
    fit.rear.backingRadius ?? 18,
    0x111111,
    1
  ).setDepth(depth - 0.1));
  const frontBacking = add(scene.add.circle(
    frontX,
    frontY,
    fit.front.backingRadius ?? 18,
    0x111111,
    1
  ).setDepth(depth - 0.1));

  const rearWheel = add(scene.add.image(rearX, rearY, wheelKey)
    .setScale(fit.rear.wheelScale)
    .setDepth(depth));
  const frontWheel = add(scene.add.image(frontX, frontY, wheelKey)
    .setScale(fit.front.wheelScale)
    .setDepth(depth));

  const paintColor = getCarPaintColor(feature.state || {});
  const bodyLayers = createCarBodyLayers(scene, car, {
    x,
    y: displayY,
    scale: bodyScale,
    depth: depth + 1,
    paintColor,
  });
  bodyLayers.objects.forEach(add);

  return Boolean(rearBacking && frontBacking && rearWheel && frontWheel);
}

function prepareMagazineAssets(scene, features, onReady) {
  // These two cars are printed into Issue 01 even before the player owns one.
  // Keep them available for both the opening and all later magazine visits.
  const ids = [...new Set(['ae86', 'ef', ...features.map(feature => feature.carId)])]
    .filter(id => cars[id]);
  const states = scene.registry.get('carStates') || {};
  const issue = getActiveMagazineIssue(scene.registry);
  let queued = 0;

  const queueIssueImage = (key, path) => {
    if (!key || !path || scene.textures.exists(key)) return;
    scene.load.image(key, path + '?v=20261011-r472');
    queued += 1;
  };

  queueIssueImage(issue?.coverKey, issue?.coverPath);
  queueIssueImage(issue?.adKey, issue?.adPath);
  queueIssueImage(issue?.insetKey, issue?.insetPath);

  ids.forEach(id => {
    queued += preloadCarAppearanceAssets(scene, { [id]: cars[id] }, '20260929-r273');
    queued += preloadCarWheel(scene, cars[id], states[id] || {});
  });

  if (!queued) {
    ensureDerivedModularCarTextures(
      scene,
      Object.fromEntries(ids.map(id => [id, cars[id]]))
    );
    onReady();
    return;
  }

  const complete = () => {
    scene.events.off('shutdown', cancel);
    ensureDerivedModularCarTextures(
      scene,
      Object.fromEntries(ids.map(id => [id, cars[id]]))
    );
    onReady();
  };
  const cancel = () => scene.load.off('complete', complete);
  scene.events.once('shutdown', cancel);
  scene.load.once('complete', complete);
  scene.load.start();
}

export function addCarHistoryButton(scene, x = 1102, y = 35) {
  const button = scene.add.rectangle(x, y, 128, 38, 0x17110c, 1)
    .setStrokeStyle(1, 0xb99058, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(43);

  const label = scene.add.text(x, y, 'MAGAZINE', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#ffe1a8',
  }).setOrigin(0.5).setDepth(44);

  button.on('pointerover', () => button.setStrokeStyle(2, 0xffcc79, 1));
  button.on('pointerout', () => button.setStrokeStyle(1, 0xb99058, 1));
  button.on('pointerdown', () => showCarHistoryPanel(scene));

  return { button, label };
}

export function showCarHistoryPanel(scene, options = {}) {
  if (scene._carHistoryOverlay?.length || scene._carMagazineLoading) return;

  const features = buildMagazineFeatures(scene);
  scene._carMagazineLoading = true;
  const loading = [
    scene.add.rectangle(780, 420, 1560, 840, 0x010205, 0.82)
      .setDepth(300).setInteractive(),
    scene.add.rectangle(780, 420, 480, 142, 0x08131f, 1)
      .setStrokeStyle(2, 0x43dfff, 1).setDepth(301),
    scene.add.text(780, 389, 'LOADING MAGAZINE', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#eefaff',
    }).setOrigin(0.5).setDepth(302),
    scene.add.rectangle(780, 438, 400, 16, 0x213b4b, 1).setDepth(302),
  ];
  const bar = scene.add.rectangle(580, 438, 1, 16, 0x43dfff, 1)
    .setOrigin(0, 0.5).setDepth(303);
  loading.push(bar);
  const progress = value => bar.setDisplaySize(Math.max(1, 400 * value), 16);
  const cleanup = () => {
    scene.load.off('progress', progress);
    scene.events.off('shutdown', cleanup);
    destroyObjects(loading);
    scene._carMagazineLoading = false;
  };
  scene.load.on('progress', progress);
  scene.events.once('shutdown', cleanup);
  prepareMagazineAssets(scene, features, () => {
    cleanup();
    if (!scene.sys?.isActive?.()) return;
    const issue = getActiveMagazineIssue(scene.registry);
    if (issue && [issue.coverKey, issue.adKey, issue.insetKey].some(key => !key || !scene.textures.exists(key))) {
      scene.showWorkshopToast?.('MAGAZINE COULD NOT LOAD // TAP TO RETRY');
      return;
    }
    showMagazine(scene, features, options);
  });
}

function showMagazine(scene, features, options = {}) {
  if (scene._carHistoryOverlay?.length) return;

  const objects = [];
  const add = obj => {
    objects.push(obj);
    return obj;
  };

  scene._carHistoryOverlay = objects;
  const issue = getActiveMagazineIssue(scene.registry);

  const insetSource =
    issue?.insetKey && scene.textures.exists(issue.insetKey)
      ? scene.textures.get(issue.insetKey).getSourceImage()
      : { width: 512, height: 644 };
  const coverSource =
    issue?.coverKey && scene.textures.exists(issue.coverKey)
      ? scene.textures.get(issue.coverKey).getSourceImage()
      : { width: 512, height: 679 };

  // The authored inset defines the exact physical page proportion. Every
  // Phaser-generated page uses this same size so the magazine never changes
  // shape as the player turns through it.
  const PAGE_H = 650;
  const PAGE_W = PAGE_H * (insetSource.width / Math.max(1, insetSource.height));
  const PAGE_TOP = 420 - PAGE_H / 2;
  const SPINE_X = 780;
  const LEFT_X = SPINE_X - PAGE_W;
  const RIGHT_X = SPINE_X;
  const COVER_H = 650;
  const COVER_W = COVER_H * (coverSource.width / Math.max(1, coverSource.height));
  const COVER_LEFT = 780 - COVER_W / 2;

  const openingChoice = scene.registry.get('openingChapter') === 'magazine';
  const featureSpreadCount = Math.max(1, Math.ceil(features.length / 2));
  // First reading: cover + pages 2/3 only. Revisits keep the identical
  // physical pages and unlock the existing generated Street File features.
  const totalViews = openingChoice ? 2 : 2 + featureSpreadCount;
  let viewIndex = 0;
  let currentView = null;
  let flipping = false;
  let confirmation = null;
  const activeGlows = [];

  const destroyView = view => {
    activeGlows.splice(0).forEach(tween => tween?.remove?.());
    if (!view) return;
    [view.cover, view.left, view.right].forEach(container => {
      try { container?.destroy?.(true); } catch (e) {}
    });
  };

  const dismissConfirmation = () => {
    if (!confirmation) return;
    destroyObjects(confirmation);
    confirmation = null;
  };
  const closeMagazine = () => {
    dismissConfirmation();
    destroyView(currentView);
    destroyObjects(objects);
    scene._carHistoryOverlay = [];
  };

  const confirmStarterCar = carId => {
    if (!openingChoice || confirmation || !['ae86', 'ef'].includes(carId)) return;
    const selectedName = carId === 'ae86' ? 'TOYOTA AE86' : 'HONDA CIVIC EF';
    confirmation = [];
    const addModal = obj => { confirmation.push(obj); return obj; };
    addModal(scene.add.rectangle(780, 420, 1560, 840, 0x02040a, 0.75)
      .setDepth(321).setInteractive());
    addModal(scene.add.rectangle(780, 410, 740, 348, 0xfffcf1, 1)
      .setStrokeStyle(6, 0x151515, 1).setDepth(322));
    addModal(scene.add.text(780, 309, 'YOUR FAVOURITE CAR?', {
      fontFamily: PIXEL_FONT, fontSize: '13px', color: '#171717',
    }).setOrigin(0.5).setDepth(323));
    addModal(scene.add.text(780, 390, selectedName, {
      fontFamily: PIXEL_FONT, fontSize: '16px', color: '#ae352a',
    }).setOrigin(0.5).setDepth(323));
    const cancel = addModal(scene.add.rectangle(603, 510, 260, 58, 0x303030, 1)
      .setInteractive({ useHandCursor: true }).setDepth(323));
    addModal(scene.add.text(603, 510, 'GO BACK', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(324));
    const accept = addModal(scene.add.rectangle(956, 510, 260, 58, 0x164b3b, 1)
      .setInteractive({ useHandCursor: true }).setDepth(323));
    addModal(scene.add.text(956, 510, 'CONFIRM', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(324));
    cancel.on('pointerdown', dismissConfirmation);
    accept.on('pointerdown', () => {
      accept.disableInteractive();
      closeMagazine();
      if (typeof options.onChoose === 'function') options.onChoose(carId);
      else scene.completeOpeningMagazineChoice?.(carId);
    });
  };

  add(scene.add.rectangle(780, 420, 1560, 840, 0x010205, 0.90)
    .setInteractive()
    .setDepth(260));

  const spreadShadow = add(scene.add.rectangle(
    SPINE_X,
    420 + 7,
    PAGE_W * 2 + 18,
    PAGE_H + 18,
    0x000000,
    0.48
  ).setDepth(261));

  const seam = add(scene.add.rectangle(
    SPINE_X,
    420,
    2,
    PAGE_H,
    0x6f604d,
    0.82
  ).setDepth(290));

  const closeX = 1460;
  const close = add(scene.add.rectangle(closeX, 82, 108, 42, 0x17130f, 1)
    .setStrokeStyle(1, 0xa89170, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(295));
  const closeText = add(scene.add.text(closeX, 82, 'CLOSE', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#f6e8ce',
  }).setOrigin(0.5).setDepth(296));
  close.on('pointerdown', closeMagazine);

  const prev = add(scene.add.rectangle(82, 420, 118, 48, 0x17130f, 1)
    .setStrokeStyle(1, 0xa89170, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(295));
  const prevText = add(scene.add.text(82, 420, '<  PREV', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#f6e8ce',
  }).setOrigin(0.5).setDepth(296));

  const next = add(scene.add.rectangle(1478, 420, 118, 48, 0x17130f, 1)
    .setStrokeStyle(1, 0xa89170, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(295));
  const nextText = add(scene.add.text(1478, 420, 'NEXT  >', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#f6e8ce',
  }).setOrigin(0.5).setDepth(296));

  const folio = add(scene.add.text(780, 790, '', {
    fontFamily: PIXEL_FONT,
    fontSize: '6px',
    color: '#9d8b73',
  }).setOrigin(0.5).setDepth(295));

  const addTo = (container, obj) => {
    container.add(obj);
    return obj;
  };

  const addPaper = (container, side, fill = 0xeee4cf) => {
    const pageX = side === 'left' ? -PAGE_W : 0;
    addTo(container, scene.add.rectangle(
      pageX + PAGE_W / 2,
      PAGE_H / 2,
      PAGE_W,
      PAGE_H,
      fill,
      1
    ));
    return pageX;
  };

  const buildCoverView = () => {
    const cover = scene.add.container(COVER_LEFT, 420 - COVER_H / 2)
      .setDepth(270);

    addTo(cover, scene.add.rectangle(
      COVER_W / 2 + 7,
      COVER_H / 2 + 9,
      COVER_W + 12,
      COVER_H + 12,
      0x000000,
      0.46
    ));

    if (issue?.coverKey && scene.textures.exists(issue.coverKey)) {
      addTo(cover, scene.add.image(COVER_W / 2, COVER_H / 2, issue.coverKey)
        .setDisplaySize(COVER_W, COVER_H));
    } else {
      addTo(cover, scene.add.rectangle(
        COVER_W / 2,
        COVER_H / 2,
        COVER_W,
        COVER_H,
        0xeadfc8,
        1
      ));
      addTo(cover, scene.add.text(COVER_W / 2, COVER_H / 2, issue?.label || 'ISSUE 01', {
        fontFamily: PIXEL_FONT,
        fontSize: '20px',
        color: '#7f291f',
      }).setOrigin(0.5));
    }

    return { cover, left: null, right: null };
  };

  const buildIntroSpread = () => {
    // Page 2 (left) and 3 (right) are the actual authored Issue 01 WebPs,
    // never a separately constructed 'starter magazine'.
    const left = scene.add.container(SPINE_X, PAGE_TOP).setDepth(272);
    const right = scene.add.container(SPINE_X, PAGE_TOP).setDepth(270);
    const leftPageX = addPaper(left, 'left');

    if (issue?.adKey && scene.textures.exists(issue.adKey)) {
      addTo(left, scene.add.image(leftPageX + PAGE_W / 2, PAGE_H / 2, issue.adKey)
        .setDisplaySize(PAGE_W, PAGE_H));
    }
    if (issue?.insetKey && scene.textures.exists(issue.insetKey)) {
      addTo(right, scene.add.image(PAGE_W / 2, PAGE_H / 2, issue.insetKey)
        .setDisplaySize(PAGE_W, PAGE_H));
    } else {
      addPaper(right, 'right');
    }

    // The two display bays are at 25% and 75% of the advertisement width,
    // between 63% and 85% of its height. Coordinates are proportional so
    // replacement ad artwork with the same aspect ratio remains aligned.
    for (const [id, fracX, label] of [
      ['ae86', 0.25, 'TOYOTA AE86'],
      ['ef', 0.75, 'HONDA CIVIC EF'],
    ]) {
      const bayX = leftPageX + PAGE_W * fracX;
      const bayY = PAGE_H * 0.757;
      const photoWidth = PAGE_W * 0.395;
      const drawn = renderCarPhoto(scene, { carId: id, state: {} },
        bayX, bayY, photoWidth, 0, obj => addTo(left, obj));
      if (!drawn) {
        addTo(left, scene.add.text(bayX, bayY, label, {
          fontFamily: PIXEL_FONT, fontSize: '9px', color: '#ffffff',
          backgroundColor: '#111111', padding: { x: 5, y: 5 },
        }).setOrigin(0.5));
      }

      // The little model insert lives immediately below each garage bay.
      const nameY = PAGE_H * 0.862;
      addTo(left, scene.add.rectangle(bayX, nameY, PAGE_W * 0.405, 27, 0x0b0b0b, 0.94)
        .setStrokeStyle(1, 0xf8e2b1, 0.85));
      addTo(left, scene.add.text(bayX, nameY, label, {
        fontFamily: PIXEL_FONT, fontSize: '6px', color: '#ffffff',
        align: 'center',
      }).setOrigin(0.5));

      if (!openingChoice) continue;

      const frame = addTo(left, scene.add.rectangle(
        bayX, PAGE_H * 0.755, PAGE_W * 0.422, PAGE_H * 0.205,
        0x62e8c7, 0.025
      ).setStrokeStyle(3, 0x64ffe0, 0.95)
        .setInteractive({ useHandCursor: true }));
      activeGlows.push(scene.tweens.add({
        targets: frame, alpha: { from: 0.58, to: 1 },
        duration: 580, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
      }));
      addTo(left, scene.add.text(bayX, PAGE_H * 0.640,
        'PRESS THE ONE\\nYOU LIKE BEST', {
          fontFamily: PIXEL_FONT, fontSize: '6px', color: '#ffffff',
          backgroundColor: '#091621dd',
          padding: { x: 4, y: 5 }, align: 'center',
        }).setOrigin(0.5));
      frame.on('pointerdown', () => confirmStarterCar(id));
    }

    if (openingChoice) {
      // An internal thought belongs to the spread, not to a new page.
      addTo(left, scene.add.rectangle(
        0, PAGE_H * 0.095, PAGE_W * 1.86, 88,
        0xfffcf1, 0.96
      ).setStrokeStyle(3, 0x151515, 1));
      addTo(left, scene.add.text(0, PAGE_H * 0.095,
        "I've heard that these two cars are great to start racing in…\\nbut which one would be better?", {
          fontFamily: BODY_FONT, fontSize: '12px', fontStyle: '700',
          color: '#151515', align: 'center', lineSpacing: 3,
          wordWrap: { width: PAGE_W * 1.70 },
        }).setOrigin(0.5));
    }

    return { cover: null, left, right };
  };

  const buildFeaturePage = (feature, side) => {
    const container = scene.add.container(SPINE_X, PAGE_TOP).setDepth(270);
    const pageX = addPaper(container, side);
    const pad = 28;
    const contentX = pageX + pad;
    const contentW = PAGE_W - pad * 2;
    const centerX = pageX + PAGE_W / 2;

    if (!feature) {
      addTo(container, scene.add.text(centerX, PAGE_H / 2, 'NEXT FEATURE\nPENDING', {
        fontFamily: PIXEL_FONT,
        fontSize: '13px',
        color: '#998a74',
        align: 'center',
        lineSpacing: 7,
      }).setOrigin(0.5));
      return container;
    }

    const meta = getCarMagazineMeta(feature.carId);
    const car = cars[feature.carId];
    const owned = feature.kind === 'OWNED';
    const archived = feature.kind === 'ARCHIVE';
    const sighting = feature.sighting || {};
    const entry = feature.entry || {};
    const stats = car ? tunedStats(feature.carId, feature.state || {}) : null;

    addTo(container, scene.add.text(
      contentX,
      32,
      owned ? 'GARAGE FEATURE' : archived ? 'FROM THE ARCHIVE' : 'SPOTTED IN TOKYO',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: owned ? '#9c3728' : '#5d6c79',
      }
    ));

    addTo(container, scene.add.text(contentX, 62, meta.shortName, {
      fontFamily: PIXEL_FONT,
      fontSize: '18px',
      color: '#171512',
    }));

    addTo(container, scene.add.text(contentX, 94, meta.name.toUpperCase(), {
      fontFamily: BODY_FONT,
      fontSize: '12px',
      color: '#3b342c',
      fontStyle: '700',
      wordWrap: { width: contentW },
    }));

    const specLine = [
      meta.year ? String(meta.year) : null,
      meta.drivetrain && meta.drivetrain !== 'SPECIAL' ? meta.drivetrain : null,
      stats ? stats.power + ' kW' : null,
      stats ? stats.weight + ' kg' : null,
    ].filter(Boolean).join('  //  ');

    addTo(container, scene.add.text(contentX, 128, specLine || 'SPECIAL FEATURE', {
      fontFamily: PIXEL_FONT,
      fontSize: '6px',
      color: '#765f49',
      wordWrap: { width: contentW },
    }));

    addTo(container, scene.add.rectangle(
      centerX,
      282,
      contentW,
      226,
      0xd8cdb6,
      1
    ).setStrokeStyle(1, 0xaa9b7e, 1));

    const photoRendered = renderCarPhoto(
      scene,
      feature,
      centerX,
      276,
      Math.min(425, PAGE_W - 78),
      0,
      obj => addTo(container, obj)
    );

    if (!photoRendered) {
      addTo(container, scene.add.text(
        centerX,
        280,
        meta.isHero ? 'HERO CAR\nFEATURE FILE' : 'PHOTO ARCHIVE',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '11px',
          color: '#887860',
          align: 'center',
          lineSpacing: 7,
        }
      ).setOrigin(0.5));
    }

    addTo(container, scene.add.text(contentX, 414, meta.fact, {
      fontFamily: BODY_FONT,
      fontSize: '11px',
      color: '#26221d',
      fontStyle: '600',
      wordWrap: { width: contentW },
      lineSpacing: 2,
    }));

    let footer = '';
    if (owned || archived) {
      footer =
        statusLabel(entry) +
        (entry.acquiredVia ? '  //  ' + acquisitionLabel(entry.acquiredVia) : '') +
        (dateLabel(entry.acquiredAt) ? '  //  ' + dateLabel(entry.acquiredAt) : '');
    } else {
      const source = Array.isArray(sighting.sources) && sighting.sources.length
        ? sighting.sources[sighting.sources.length - 1].replaceAll('-', ' ').toUpperCase()
        : 'TOKYO';
      footer =
        'SEEN // ' + source +
        (dateLabel(sighting.firstSeenAt) ? '  //  ' + dateLabel(sighting.firstSeenAt) : '');
    }

    addTo(container, scene.add.rectangle(
      centerX,
      PAGE_H - 54,
      contentW,
      1,
      0xb7a68b,
      0.7
    ));

    addTo(container, scene.add.text(contentX, PAGE_H - 38, footer, {
      fontFamily: PIXEL_FONT,
      fontSize: '5px',
      color: '#766752',
      wordWrap: { width: contentW },
    }));

    return container;
  };

  const buildFeatureSpread = featureSpreadIndex => {
    const featureIndex = featureSpreadIndex * 2;
    const left = buildFeaturePage(features[featureIndex], 'left');
    const right = buildFeaturePage(features[featureIndex + 1], 'right');
    return { cover: null, left, right };
  };

  const buildView = index => {
    if (index === 0) return buildCoverView();
    if (index === 1) return buildIntroSpread();
    return buildFeatureSpread(index - 2);
  };

  const updateControls = () => {
    const canPrev = viewIndex > 0;
    const canNext = viewIndex < totalViews - 1;

    prev.setFillStyle(canPrev ? 0x17130f : 0x0d0b09, 1);
    next.setFillStyle(canNext ? 0x17130f : 0x0d0b09, 1);
    prevText.setColor(canPrev ? '#f6e8ce' : '#665d52');
    nextText.setColor(canNext ? '#f6e8ce' : '#665d52');

    spreadShadow.setVisible(viewIndex > 0);
    seam.setVisible(viewIndex > 0);

    if (viewIndex === 0) {
      folio.setText((issue?.label || 'ISSUE 01') + ' // COVER');
    } else if (viewIndex === 1) {
      folio.setText((issue?.label || 'ISSUE 01') + ' // 02–03');
    } else {
      const featureNumber = viewIndex - 1;
      folio.setText(
        'FEATURE SPREAD ' + featureNumber + ' / ' + Math.max(1, featureSpreadCount)
      );
    }
  };

  const flipTo = direction => {
    if (flipping) return;

    const nextIndex = viewIndex + direction;
    if (nextIndex < 0 || nextIndex >= totalViews) return;

    flipping = true;

    // Forward: the current right-hand page folds into the spine, then the
    // newly revealed left page opens out to the left. Previous does the mirror
    // image of that motion.
    const outgoing = direction > 0
      ? (currentView?.right || currentView?.cover || currentView?.left)
      : (currentView?.left || currentView?.cover || currentView?.right);

    const finishSwap = () => {
      destroyView(currentView);
      viewIndex = nextIndex;
      currentView = buildView(viewIndex);

      const incoming = direction > 0
        ? (currentView?.left || currentView?.cover || currentView?.right)
        : (currentView?.right || currentView?.cover || currentView?.left);

      if (!incoming) {
        updateControls();
        flipping = false;
        return;
      }

      incoming.scaleX = 0;
      updateControls();

      scene.tweens.add({
        targets: incoming,
        scaleX: 1,
        duration: 220,
        ease: 'Sine.easeOut',
        onComplete: () => {
          flipping = false;
        },
      });
    };

    if (!outgoing) {
      finishSwap();
      return;
    }

    scene.tweens.add({
      targets: outgoing,
      scaleX: 0,
      duration: 190,
      ease: 'Sine.easeIn',
      onComplete: finishSwap,
    });
  };

  prev.on('pointerover', () => {
    if (viewIndex > 0) prev.setStrokeStyle(2, 0xe0c38f, 1);
  });
  prev.on('pointerout', () => prev.setStrokeStyle(1, 0xa89170, 1));
  next.on('pointerover', () => {
    if (viewIndex < totalViews - 1) next.setStrokeStyle(2, 0xe0c38f, 1);
  });
  next.on('pointerout', () => next.setStrokeStyle(1, 0xa89170, 1));
  close.on('pointerover', () => close.setStrokeStyle(2, 0xe0c38f, 1));
  close.on('pointerout', () => close.setStrokeStyle(1, 0xa89170, 1));

  prev.on('pointerdown', () => flipTo(-1));
  next.on('pointerdown', () => flipTo(1));

  currentView = buildView(viewIndex);
  updateControls();
}



// Office-facing alias. Keep showCarHistoryPanel for old callers while the
// magazine and the simple car-history ledger are separate UI concepts.
export function showMagazinePanel(scene, options = {}) {
  return showCarHistoryPanel(scene, options);
}
