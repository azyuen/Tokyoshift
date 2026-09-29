import { cars } from '../data/cars.js?v=20260928-r232';
import { engines } from '../data/engines.js?v=20260928-r232';
import { applyEngineTuning } from '../data/tuning.js?v=20260926-r211';
import { applySecondaryTuning } from '../data/secondaryTuning.js?v=20260926-r211';
import {
  getCarMagazineMeta,
  getCarMagazineSightings,
} from '../data/carMagazine.js?v=20260929-r273';
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

function renderCarPhoto(scene, feature, x, y, targetWidth, depth, add) {
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
  const ids = features
    .map(feature => feature.carId)
    .filter((id, index, list) => cars[id] && list.indexOf(id) === index);
  const states = scene.registry.get('carStates') || {};
  let queued = 0;

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

  scene.load.once('complete', () => {
    ensureDerivedModularCarTextures(
      scene,
      Object.fromEntries(ids.map(id => [id, cars[id]]))
    );
    onReady();
  });
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

export function showCarHistoryPanel(scene) {
  if (scene._carHistoryOverlay?.length || scene._carMagazineLoading) return;

  const features = buildMagazineFeatures(scene);
  scene._carMagazineLoading = true;
  prepareMagazineAssets(scene, features, () => {
    scene._carMagazineLoading = false;
    if (!scene.sys?.isActive?.()) return;
    showMagazine(scene, features);
  });
}

function showMagazine(scene, features) {
  if (scene._carHistoryOverlay?.length) return;

  const objects = [];
  let pageObjects = [];
  const add = obj => { objects.push(obj); return obj; };
  const addPage = obj => {
    objects.push(obj);
    pageObjects.push(obj);
    return obj;
  };

  scene._carHistoryOverlay = objects;
  const spreadCount = Math.max(1, 1 + Math.ceil(features.length / 2));
  let spread = 0;
  let flipping = false;

  const closeMagazine = () => {
    destroyObjects(objects);
    scene._carHistoryOverlay = [];
  };

  add(scene.add.rectangle(780, 420, 1560, 840, 0x010205, 0.84)
    .setInteractive()
    .setDepth(260));

  add(scene.add.rectangle(780, 420, 1215, 718, 0x1a1510, 1)
    .setStrokeStyle(4, 0x8d6d45, 1)
    .setDepth(261));

  add(scene.add.rectangle(780, 420, 1170, 680, 0xeee5d1, 1)
    .setStrokeStyle(2, 0xcbbd9c, 1)
    .setDepth(262));

  add(scene.add.rectangle(780, 420, 5, 674, 0x8b7d66, 0.55).setDepth(264));

  const close = add(scene.add.rectangle(1320, 108, 116, 38, 0x1f1b17, 1)
    .setStrokeStyle(1, 0x9d896b, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(270));
  add(scene.add.text(1320, 108, 'CLOSE', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#f5e8cf',
  }).setOrigin(0.5).setDepth(271));
  close.on('pointerdown', closeMagazine);

  const prev = add(scene.add.rectangle(420, 748, 150, 42, 0x211a13, 1)
    .setStrokeStyle(1, 0xb59668, 1)
    .setDepth(270));
  const prevText = add(scene.add.text(420, 748, '<  PREV', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#f6e4c6',
  }).setOrigin(0.5).setDepth(271));

  const next = add(scene.add.rectangle(1140, 748, 150, 42, 0x211a13, 1)
    .setStrokeStyle(1, 0xb59668, 1)
    .setDepth(270));
  const nextText = add(scene.add.text(1140, 748, 'NEXT  >', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#f6e4c6',
  }).setOrigin(0.5).setDepth(271));

  const folio = add(scene.add.text(780, 749, '', {
    fontFamily: PIXEL_FONT,
    fontSize: '6px',
    color: '#8a7961',
  }).setOrigin(0.5).setDepth(271));

  const renderFeature = (feature, leftPage) => {
    const pageX = leftPage ? 226 : 795;
    const pageW = 540;
    const centerX = pageX + pageW / 2;
    const meta = getCarMagazineMeta(feature.carId);
    const car = cars[feature.carId];
    const owned = feature.kind === 'OWNED';
    const archived = feature.kind === 'ARCHIVE';
    const sighting = feature.sighting || {};
    const entry = feature.entry || {};
    const stats = car ? tunedStats(feature.carId, feature.state || {}) : null;

    addPage(scene.add.text(pageX + 28, 127, owned ? 'GARAGE FEATURE' : archived ? 'FROM THE ARCHIVE' : 'SPOTTED IN TOKYO', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: owned ? '#8a301f' : '#536477',
    }).setDepth(267));

    addPage(scene.add.text(pageX + 28, 155, meta.shortName, {
      fontFamily: PIXEL_FONT,
      fontSize: '20px',
      color: '#171512',
    }).setDepth(267));

    addPage(scene.add.text(pageX + 28, 190, meta.name.toUpperCase(), {
      fontFamily: BODY_FONT,
      fontSize: '13px',
      color: '#3b342c',
      fontStyle: '700',
      wordWrap: { width: 480 },
    }).setDepth(267));

    const specLine = [
      meta.year ? String(meta.year) : null,
      meta.drivetrain && meta.drivetrain !== 'SPECIAL' ? meta.drivetrain : null,
      stats ? stats.power + ' kW' : null,
      stats ? stats.weight + ' kg' : null,
    ].filter(Boolean).join('  //  ');

    addPage(scene.add.text(pageX + 28, 228, specLine || 'SPECIAL FEATURE', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#745f49',
    }).setDepth(267));

    const photoFrame = addPage(scene.add.rectangle(centerX, 370, 478, 238, 0xd8cdb6, 1)
      .setStrokeStyle(1, 0xaa9b7e, 1)
      .setDepth(265));

    const photoRendered = renderCarPhoto(
      scene,
      feature,
      centerX,
      362,
      420,
      266,
      addPage
    );

    if (!photoRendered) {
      addPage(scene.add.text(centerX, 365, meta.isHero ? 'HERO CAR\nFEATURE FILE' : 'PHOTO ARCHIVE', {
        fontFamily: PIXEL_FONT,
        fontSize: '12px',
        color: '#887860',
        align: 'center',
        lineSpacing: 8,
      }).setOrigin(0.5).setDepth(267));
    }

    addPage(scene.add.text(pageX + 28, 510, meta.fact, {
      fontFamily: BODY_FONT,
      fontSize: '12px',
      color: '#26221d',
      fontStyle: '600',
      wordWrap: { width: 480 },
      lineSpacing: 3,
    }).setDepth(267));

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

    addPage(scene.add.text(pageX + 28, 660, footer, {
      fontFamily: PIXEL_FONT,
      fontSize: '6px',
      color: '#766752',
      wordWrap: { width: 480 },
    }).setDepth(267));

    photoFrame.setData('magazinePhoto', true);
  };

  const renderCover = () => {
    addPage(scene.add.text(262, 152, 'TOKYO', {
      fontFamily: PIXEL_FONT,
      fontSize: '34px',
      color: '#16130f',
    }).setDepth(267));
    addPage(scene.add.text(262, 205, 'SHIFT', {
      fontFamily: PIXEL_FONT,
      fontSize: '44px',
      color: '#a72e1d',
    }).setDepth(267));
    addPage(scene.add.text(262, 276, 'STREET FILE', {
      fontFamily: PIXEL_FONT,
      fontSize: '14px',
      color: '#493d30',
    }).setDepth(267));

    addPage(scene.add.rectangle(510, 470, 420, 275, 0x241f19, 1).setDepth(265));
    addPage(scene.add.text(510, 470, 'YOUR GARAGE.\nYOUR RIVALS.\nYOUR TOKYO.', {
      fontFamily: PIXEL_FONT,
      fontSize: '18px',
      color: '#f0dfbd',
      align: 'center',
      lineSpacing: 12,
    }).setOrigin(0.5).setDepth(267));

    const owned = (scene.registry.get('ownedCarIds') || []).length;
    const seen = Object.keys(getCarMagazineSightings(scene.registry)).length;
    const history = (scene.registry.get('carHistory') || []).length;

    addPage(scene.add.text(825, 165, 'ISSUE // LIVE SAVE', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#8a301f',
    }).setDepth(267));
    addPage(scene.add.text(825, 220, 'THIS ISSUE EVOLVES\nAS YOU PLAY.', {
      fontFamily: PIXEL_FONT,
      fontSize: '18px',
      color: '#181510',
      lineSpacing: 10,
    }).setDepth(267));

    addPage(scene.add.text(825, 335,
      owned + ' CARS IN GARAGE\n' +
      seen + ' MODELS SPOTTED\n' +
      history + ' GARAGE RECORDS',
      {
        fontFamily: BODY_FONT,
        fontSize: '20px',
        color: '#433a30',
        fontStyle: '700',
        lineSpacing: 12,
      }
    ).setDepth(267));

    addPage(scene.add.text(825, 535,
      features.length
        ? 'Flip through the cars that have become part of this run.'
        : 'The first issue is still thin. Race, collect and explore Tokyo to fill it.',
      {
        fontFamily: BODY_FONT,
        fontSize: '14px',
        color: '#5e5142',
        fontStyle: '600',
        wordWrap: { width: 470 },
        lineSpacing: 4,
      }
    ).setDepth(267));

    addPage(scene.add.text(825, 660, 'TOKYO SHIFT // GARAGE EDITION', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#8a7961',
    }).setDepth(267));
  };

  const render = () => {
    destroyObjects(pageObjects);
    pageObjects = [];
    folio.setText('SPREAD ' + (spread + 1) + ' / ' + spreadCount);

    const canPrev = spread > 0;
    const canNext = spread < spreadCount - 1;
    prev.setFillStyle(canPrev ? 0x211a13 : 0x16120f, 1);
    next.setFillStyle(canNext ? 0x211a13 : 0x16120f, 1);
    prevText.setColor(canPrev ? '#f6e4c6' : '#695f52');
    nextText.setColor(canNext ? '#f6e4c6' : '#695f52');

    if (spread === 0) {
      renderCover();
      return;
    }

    const index = (spread - 1) * 2;
    const left = features[index];
    const right = features[index + 1];
    if (left) renderFeature(left, true);
    if (right) {
      renderFeature(right, false);
    } else {
      addPage(scene.add.text(1065, 375, 'NEXT FEATURE\nPENDING', {
        fontFamily: PIXEL_FONT,
        fontSize: '14px',
        color: '#968872',
        align: 'center',
        lineSpacing: 8,
      }).setOrigin(0.5).setDepth(267));
    }
  };

  const flipTo = nextSpread => {
    if (flipping || nextSpread < 0 || nextSpread >= spreadCount || nextSpread === spread) return;
    flipping = true;
    const direction = nextSpread > spread ? 1 : -1;
    const target = pageObjects.filter(obj => obj?.active);
    scene.tweens.add({
      targets: target,
      alpha: 0,
      x: '+=' + (direction * -24),
      duration: 110,
      ease: 'Quad.easeIn',
      onComplete: () => {
        spread = nextSpread;
        render();
        pageObjects.forEach(obj => {
          if (!obj?.active) return;
          obj.setAlpha?.(0);
          if (typeof obj.x === 'number') obj.x += direction * 24;
        });
        scene.tweens.add({
          targets: pageObjects.filter(obj => obj?.active),
          alpha: 1,
          x: '-=' + (direction * 24),
          duration: 150,
          ease: 'Quad.easeOut',
          onComplete: () => { flipping = false; },
        });
      },
    });
  };

  prev.setInteractive({ useHandCursor: true });
  next.setInteractive({ useHandCursor: true });
  prev.on('pointerdown', () => flipTo(spread - 1));
  next.on('pointerdown', () => flipTo(spread + 1));

  render();
}
