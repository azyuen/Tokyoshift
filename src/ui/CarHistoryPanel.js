import { cars } from '../data/cars.js?v=20261026-r687';
import { getActiveMagazineIssue } from '../data/carMagazine.js?v=20261011-r479';
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
import { drawIssue01Page, ISSUE01_ASSETS, ISSUE01_EDITORIAL_PAGE_COUNT, ISSUE01_PHOTO_CARS } from './Issue01Pages.js?v=20261012-r490';
import { getReferenceRightX } from '../data/carReferenceGeometry.js?v=20261012-ref2';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

function destroyObjects(objects = []) {
  objects.forEach(obj => {
    try { obj?.destroy?.(); } catch (e) {}
  });
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
  const displayX = getReferenceRightX(car, x, bodyScale);
  const displayY = car.visual?.referenceStandard ? y + targetWidth * 0.18 : y + renderOffsetY;
  const rearX = displayX + fit.rear.offsetX;
  const frontX = displayX + fit.front.offsetX;
  const rearY = displayY + fit.rear.offsetY;
  const frontY = displayY + fit.front.offsetY;

  add(scene.add.ellipse(
    x,
    car.visual?.referenceStandard ? displayY + 2 : Math.max(rearY, frontY) + 8,
    targetWidth * 0.92,
    Math.max(6, targetWidth * 0.055),
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
    x: displayX,
    y: displayY,
    scale: bodyScale,
    depth: depth + 1,
    paintColor,
  });
  // Phaser containers draw insertion order, not child depth. Paint stays below shell.
  [...bodyLayers.objects].sort((a, b) => a.depth - b.depth).forEach(add);

  return Boolean(rearBacking && frontBacking && rearWheel && frontWheel);
}

function prepareMagazineAssets(scene, onReady) {
  // These two cars are printed into Issue 01 even before the player owns one.
  // Keep them available for both the opening and all later magazine visits.
  const printedCars = ISSUE01_PHOTO_CARS;
  const ids = [...new Set(['ae86', 'ef', ...printedCars])]
    .filter(id => cars[id]);
  const states = scene.registry.get('carStates') || {};
  const issue = getActiveMagazineIssue(scene.registry);
  let queued = 0;

  const queueIssueImage = (key, path) => {
    if (!key || !path || scene.textures.exists(key)) return;
    scene.load.image(key, path + '?v=20261012-r490');
    queued += 1;
  };

  queueIssueImage(issue?.coverKey, issue?.coverPath);
  queueIssueImage(issue?.adKey, issue?.adPath);
  queueIssueImage(issue?.insetKey, issue?.insetPath);
  Object.values(ISSUE01_ASSETS).forEach(({key,path}) => queueIssueImage(key,path));

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
  prepareMagazineAssets(scene, () => {
    cleanup();
    if (!scene.sys?.isActive?.()) return;
    const issue = getActiveMagazineIssue(scene.registry);
    const missing = issue
      ? [issue.coverKey, issue.adKey, issue.insetKey, ...Object.values(ISSUE01_ASSETS).map(a => a.key)]
          .filter(key => !key || !scene.textures.exists(key))
      : [];
    if (missing.length) {
      console.error('[TOKYO SHIFT] Magazine textures failed to load:', missing);
      // Workshop toast sits behind the office backdrop. Show the error above
      // both the office and the magazine loader so failed artwork never
      // looks like an unresponsive magazine button.
      const shade = scene.add.rectangle(780, 420, 1560, 840, 0x010205, 0.78)
        .setDepth(310).setInteractive();
      const panel = scene.add.rectangle(780, 420, 790, 210, 0x08131f, 0.99)
        .setStrokeStyle(3, 0x43dfff, 0.96).setDepth(311);
      const label = scene.add.text(780, 420,
        'MAGAZINE COULD NOT LOAD\nA page image is missing.\nTAP TO CLOSE AND TRY AGAIN', {
          fontFamily: PIXEL_FONT, fontSize: '11px', color: '#eefaff',
          align: 'center', lineSpacing: 20,
        }).setOrigin(0.5).setDepth(312);
      shade.once('pointerdown', () => destroyObjects([shade, panel, label]));
      return;
    }
    showMagazine(scene, options);
  });
}

function showMagazine(scene, options = {}) {
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
  const PAGE_H = 792; // 94% of the 1560 x 840 game canvas, without losing paper edges.
  const PAGE_W = PAGE_H * (insetSource.width / Math.max(1, insetSource.height));
  const PAGE_TOP = (840 - PAGE_H) / 2;
  const SPINE_X = 780;
  const LEFT_X = SPINE_X - PAGE_W;
  const RIGHT_X = SPINE_X;
  const COVER_H = PAGE_H;
  const COVER_W = COVER_H * (coverSource.width / Math.max(1, coverSource.height));
  const COVER_LEFT = 780 - COVER_W / 2;

  const openingChoice = scene.registry.get('openingChapter') === 'magazine';
  // Issue 01 is a fixed print edition: cover, 02–03, then 04–15.
  // Personal Street File / garage history pages no longer belong to this magazine.
  const editorialSpreads = ISSUE01_EDITORIAL_PAGE_COUNT / 2;
  const totalViews = 2 + editorialSpreads;
  let viewIndex = 0;
  let currentView = null;
  let flipping = false;
  let confirmation = null;
  let closed = false;
  let openingChoiceAccepted = false;
  const flipTweens = [];
  const activeGlows = [];
  const revealTimers = [];
  const revealTweens = [];

  const destroyView = view => {
    revealTimers.splice(0).forEach(timer => timer?.remove?.());
    revealTweens.splice(0).forEach(tween => tween?.remove?.());
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
    if (closed) return;
    closed = true;
    scene.events.off('shutdown', closeMagazine);
    flipTweens.splice(0).forEach(tween => tween?.remove?.());
    dismissConfirmation();
    destroyView(currentView);
    destroyObjects(objects);
    scene._carHistoryOverlay = [];
    if (!openingChoiceAccepted) options.onClose?.();
  };

  scene.events.once('shutdown', closeMagazine);

  const confirmStarterCar = carId => {
    if (closed || flipping || !openingChoice || confirmation || !['ae86', 'ef'].includes(carId)) return;
    const selectedName = carId === 'ae86' ? 'TOYOTA AE86' : 'HONDA CIVIC EF';
    confirmation = [];
    const addModal = obj => { confirmation.push(obj); return obj; };
    addModal(scene.add.rectangle(780, 420, 1560, 840, 0x02040a, 0.75)
      .setDepth(321).setInteractive());
    addModal(scene.add.rectangle(780, 410, 740, 348, 0xfffcf1, 1)
      .setStrokeStyle(6, 0x151515, 1).setDepth(322));
    addModal(scene.add.text(780, 309, 'DO YOU THINK THIS CAR IS BETTER?', {
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
    addModal(scene.add.text(956, 510, 'CONFIRM CAR', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(324));
    cancel.on('pointerdown', dismissConfirmation);
    accept.on('pointerdown', () => {
      accept.disableInteractive();
      openingChoiceAccepted = true;
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

  // Compact square controls sit outside the enlarged paper, not below it.
  const closeX = 1494;
  const closeY = 49;
  const close = add(scene.add.rectangle(closeX, closeY, 48, 48, 0x17130f, 1)
    .setStrokeStyle(2, 0xa89170, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(295));
  const closeText = add(scene.add.text(closeX, closeY, 'X', {
    fontFamily: BODY_FONT, fontSize: '27px', fontStyle: 'bold', color: '#f6e8ce',
  }).setOrigin(0.5).setDepth(296));
  close.on('pointerdown', closeMagazine);

  const prev = add(scene.add.rectangle(75, 420, 52, 52, 0x17130f, 1)
    .setStrokeStyle(2, 0xa89170, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(295));
  const prevText = add(scene.add.text(75, 420, '<', {
    fontFamily: BODY_FONT, fontSize: '29px', fontStyle: 'bold', color: '#f6e8ce',
  }).setOrigin(0.5).setDepth(296));

  const next = add(scene.add.rectangle(1485, 420, 52, 52, 0x17130f, 1)
    .setStrokeStyle(2, 0xa89170, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(295));
  const nextText = add(scene.add.text(1485, 420, '>', {
    fontFamily: BODY_FONT, fontSize: '29px', fontStyle: 'bold', color: '#f6e8ce',
  }).setOrigin(0.5).setDepth(296));

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
    // Original starter ad plus a live contents page on the supplied blank.
    const left = scene.add.container(SPINE_X, PAGE_TOP).setDepth(272);
    const right = scene.add.container(SPINE_X, PAGE_TOP).setDepth(270);
    const leftPageX = addPaper(left, 'left');

    if (issue?.adKey && scene.textures.exists(issue.adKey)) {
      addTo(left, scene.add.image(leftPageX + PAGE_W / 2, PAGE_H / 2, issue.adKey)
        .setDisplaySize(PAGE_W, PAGE_H));
    }
    drawIssue01Page(scene, {container: right, pageX: 0, pageW: PAGE_W, pageH: PAGE_H, pageNumber: 3});

    const selectionUi = [];
    const selectionFrames = [];

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
        bayX, PAGE_H * 0.750, PAGE_W * 0.405, PAGE_W * 0.405,
        0x62e8c7, 0.025
      ).setStrokeStyle(3, 0x64ffe0, 0.95).setAlpha(0));
      frame.disableInteractive();
      selectionUi.push(frame);
      selectionFrames.push(frame);
      frame.on('pointerdown', () => confirmStarterCar(id));
    }

    if (openingChoice) {
      // Keep the authored 02–03 spread unobstructed for one full second.
      // First the player's thought fades in, then the two selectable frames
      // and their single common instruction appear.
      const thought = [
        addTo(left, scene.add.rectangle(
          0, PAGE_H * 0.095, PAGE_W * 1.86, 88,
          0xfffcf1, 0.96
        ).setStrokeStyle(3, 0x151515, 1).setAlpha(0)),
        addTo(left, scene.add.text(0, PAGE_H * 0.095,
          "I've heard that these two cars are great to start racing in…\nbut which one would be better?", {
            fontFamily: BODY_FONT, fontSize: '12px', fontStyle: '700',
            color: '#151515', align: 'center', lineSpacing: 3,
            wordWrap: { width: PAGE_W * 1.70 },
          }).setOrigin(0.5).setAlpha(0)),
      ];
      const prompt = addTo(left, scene.add.text(
        -PAGE_W / 2, PAGE_H * 0.625, 'PRESS THE CAR YOU THINK IS BETTER', {
          fontFamily: PIXEL_FONT, fontSize: '7px', color: '#ffffff',
          backgroundColor: '#091621dd',
          padding: { x: 9, y: 8 }, align: 'center',
          wordWrap: { width: PAGE_W * 0.94 },
        }).setOrigin(0.5).setAlpha(0));
      selectionUi.push(prompt);
      revealTimers.push(scene.time.delayedCall(1000, () => {
        if (!left.active || viewIndex !== 1 || currentView?.left !== left) return;
        revealTweens.push(scene.tweens.add({
          targets: thought, alpha: 1, duration: 520,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            if (!left.active || viewIndex !== 1) return;
            revealTweens.push(scene.tweens.add({
              targets: selectionUi, alpha: 1, duration: 480,
              ease: 'Sine.easeInOut',
              onComplete: () => {
                if (!left.active || viewIndex !== 1) return;
                selectionFrames.forEach(frame => {
                  frame.setInteractive({ useHandCursor: true });
                  activeGlows.push(scene.tweens.add({
                    targets: frame, alpha: { from: 0.62, to: 1 },
                    duration: 620, yoyo: true, repeat: -1,
                    ease: 'Sine.easeInOut',
                  }));
                });
              },
            }));
          },
        }));
      }));
    }

    return { cover: null, left, right };
  };

  const buildIssue01Spread = spreadIndex => {
    const firstPage = 4 + spreadIndex * 2;
    const pages = ['left', 'right'].map((side, offset) => {
      const container = scene.add.container(SPINE_X, PAGE_TOP).setDepth(side === 'left' ? 272 : 270);
      const pageX = addPaper(container, side);
      drawIssue01Page(scene, {
        container, pageX, pageW: PAGE_W, pageH: PAGE_H,
        pageNumber: firstPage + offset,
        carPhoto: (id, x, y, width) =>
          renderCarPhoto(scene, { carId: id, state: {} }, x, y, width, 0,
            obj => addTo(container, obj)),
      });
      return container;
    });
    return { cover: null, left: pages[0], right: pages[1] };
  };

  const buildView = index => {
    if (index === 0) return buildCoverView();
    if (index === 1) return buildIntroSpread();
    return buildIssue01Spread(index - 2);
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


  };

  const flipTo = direction => {
    if (closed || flipping || confirmation) return;

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
      if (closed) return;
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

      flipTweens.push(scene.tweens.add({
        targets: incoming,
        scaleX: 1,
        duration: 220,
        ease: 'Sine.easeOut',
        onComplete: () => {
          flipping = false;
        },
      }));
    };

    if (!outgoing) {
      finishSwap();
      return;
    }

    flipTweens.push(scene.tweens.add({
      targets: outgoing,
      scaleX: 0,
      duration: 190,
      ease: 'Sine.easeIn',
      onComplete: finishSwap,
    }));
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
