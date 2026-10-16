// Full-screen regional Showdown preview using the Skytree three-heat layout.
// UI only: existing MeetScene offer generation, entry settlement, race mechanics
// and cooldown remain the sole source of gameplay state.
import { cars } from '../data/cars.js?v=20261011-r479';
import {
  characters, getCharacterVisualForContext, getCharacterForContext,
} from '../data/characters.js?v=20261013-r494';
import { getCarBodyTextureKey, normalisePaintColor, DEFAULT_PAINT_COLOR } from '../vehicles/CarAppearance.js?v=20260928-r244';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261007-r411';
import { getMeetCharacterQuote } from '../data/characterRaceDialogue.js?v=20261016-r532';
import { carMatchesCompetitionRestriction } from '../data/carMagazine.js?v=20261011-r479';
import { getPowerTorqueDisplay } from '../data/carRatings.js?v=20261004-r325';
import { getVehiclePerformance } from '../vehicles/VehiclePerformance.js?v=20261011-r479';
import { getCarCouponRequirement, getCarCouponCount } from '../data/centralTokyo.js?v=20261013-r496';
import {
  SHOWDOWN_STAGE as STAGE,
  SHOWDOWN_SIDE as SIDE,
  SHOWDOWN_STRIP as STRIP,
  SHOWDOWN_CARD_CENTERS,
  SHOWDOWN_CARD_Y,
  SHOWDOWN_CARD_WIDTH,
  SHOWDOWN_CARD_HEIGHT,
  SHOWDOWN_RACE_Y_OFFSET,
  SHOWDOWN_BACK_Y_OFFSET,
  SHOWDOWN_RACE_BUTTON_HEIGHT,
  SHOWDOWN_BACK_BUTTON_HEIGHT,
} from './ShowdownLayout.js?v=20261016-shared-showdown';

const PIXEL = '"Silkscreen", monospace';
const BODY = '"Rajdhani", sans-serif';
const Z = 200;
const money = n => '¥ ' + Math.max(0, Number(n) || 0).toLocaleString('en-US');
const safe = value => String(value ?? '').toUpperCase();

// Returns a scene-owned, disposable controller. The actual three-heat
// competition begins only after a deliberate click on the ENTER button.
export function showStreetShowdownView(scene, {
  offer, location, onEnter = () => {}, onClose = () => {},
} = {}) {
  if (!scene || !offer || !Array.isArray(offer.rounds) ||
      offer.rounds.length !== 3 || !location) return null;

  const baseObjects = [];
  let detailObjects = [];
  let maskShape = null;
  let active = true;
  const playerCharacterId = scene.registry.get('playerCharacterId') || '';
  const playerCarId = scene.registry.get('selectedCarId') || '';
  const playerCar = cars[playerCarId] || null;
  const playerState = (scene.registry.get('carStates') || {})[playerCarId] || {};
  const playerPerformance = playerCarId
    ? getVehiclePerformance(playerCarId, playerState)
    : null;
  const playerRating = playerCar
    ? getPowerTorqueDisplay(playerCar, playerState, playerPerformance?.car || playerCar)
    : null;
  const prizeCar = cars[offer.prizeCarId] || null;
  const couponEvent = offer.prizeType === 'COUPON';
  const entryFee = Math.max(0, Number(offer.entryFee) || 0);
  const canAfford = Number(scene.registry.get('cash') || 0) >= entryFee;
  const classAllowed = carMatchesCompetitionRestriction(playerCarId, offer.restriction);
  const canEnter = Boolean(canAfford && classAllowed && playerCar);
  const controller = {
    active: true,
    previewIndex: 0,
    close,
    select: index => {
      if (!active || !Number.isInteger(index) || index < 0 || index > 2 ||
          index === controller.previewIndex) return;
      controller.previewIndex = index;
      redraw();
    },
  };

  function add(obj, collection = baseObjects) {
    collection.push(obj);
    return obj;
  }
  function txt(x, y, label, {
    pixel = false, size = '11px', color = '#d8eaf4',
    depth = Z + 12, wrap = null, bold = false, align = 'left',
    spacing = 3,
  } = {}, collection = detailObjects) {
    return add(scene.add.text(x, y, String(label ?? ''), {
      fontFamily: pixel ? PIXEL : BODY,
      fontSize: size,
      color,
      fontStyle: bold ? 'bold' : 'normal',
      wordWrap: wrap ? { width: wrap } : undefined,
      align,
      lineSpacing: spacing,
    }).setDepth(depth), collection);
  }
  function button(x, y, width, height, label, {
    onClick = null, enabled = true, accent = false,
  } = {}) {
    const box = add(scene.add.rectangle(x, y, width, height,
      enabled ? (accent ? 0x174f43 : 0x122a40) : 0x17202a, 1)
      .setStrokeStyle(2, enabled ? (accent ? 0x66e9c1 : 0x49bce2) : 0x435262)
      .setDepth(Z + 20), detailObjects);
    txt(x, y, label, {
      pixel: true, size: '8px', color: enabled ? '#f4ffff' : '#8a9caa',
      depth: Z + 21, align: 'center',
    }).setOrigin(0.5);
    if (enabled && onClick) {
      box.setInteractive({ useHandCursor: true });
      box.on('pointerdown', () => {
        if (active) onClick();
      });
    }
  }
  function clipStage(obj) {
    if (maskShape && obj?.setMask) obj.setMask(maskShape.createGeometryMask());
    return obj;
  }
  function close() {
    if (!active) return;
    active = false;
    controller.active = false;
    scene.events.off('shutdown', close);
    scene.events.off('destroy', close);
    detailObjects.forEach(obj => { try { obj?.destroy?.(); } catch (_) {} });
    detailObjects = [];
    baseObjects.forEach(obj => { try { obj?.destroy?.(); } catch (_) {} });
    baseObjects.length = 0;
    try { maskShape?.destroy(); } catch (_) {}
    maskShape = null;
    onClose();
  }

  // Put an input-catching page above EVERY Meet button. Only the separate
  // Showdown preview controls remain active until the player closes this page.
  add(scene.add.rectangle(780, 420, 1560, 840, 0x020914, 1)
    .setDepth(Z - 2).setInteractive());
  add(scene.add.rectangle(780, 35, 1512, 62, 0x07111d, 1)
    .setStrokeStyle(2, 0x173249).setDepth(Z));
  txt(52, 35, 'STREET SHOWDOWN', {
    pixel: true, size: '18px', color: '#f4ffff', depth: Z + 1,
  }, baseObjects).setOrigin(0, 0.5);
  txt(430, 35, safe(location.district) + ' // ' + safe(location.label), {
    pixel: true, size: '10px', color: '#93c5e5', depth: Z + 1,
  }, baseObjects).setOrigin(0, 0.5);

  // Reuse the SAME day/night Meet background in the large Skytree stage.
  add(scene.add.rectangle(STAGE.x + STAGE.w / 2, STAGE.y + STAGE.h / 2,
    STAGE.w, STAGE.h, 0x0c1c2e, 1).setDepth(Z));
  maskShape = scene.make.graphics({ add: false });
  maskShape.fillStyle(0xffffff, 1);
  maskShape.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
  const bgKey = scene.currentBackground?.texture?.key;
  if (bgKey && scene.textures.exists(bgKey)) {
    const source = scene.textures.get(bgKey).getSourceImage();
    clipStage(add(scene.add.image(
      STAGE.x + STAGE.w / 2, STAGE.y + STAGE.h / 2, bgKey)
      .setScale(Math.max(STAGE.w / Math.max(1, source.width),
        STAGE.h / Math.max(1, source.height)))
      .setDepth(Z + 1)));
  }
  add(scene.add.rectangle(STAGE.x + STAGE.w / 2, STAGE.y + STAGE.h / 2,
    STAGE.w, STAGE.h, 0x03101b, 0.045).setDepth(Z + 2));
  add(scene.add.rectangle(STAGE.x + STAGE.w / 2, STAGE.y + STAGE.h / 2,
    STAGE.w, STAGE.h, 0x000000, 0)
    .setStrokeStyle(2, 0x365b79).setDepth(Z + 32));

  add(scene.add.rectangle(STRIP.x + STRIP.w / 2, STRIP.y + STRIP.h / 2,
    STRIP.w, STRIP.h, 0x061322, 1).setStrokeStyle(2, 0x25445d)
    .setDepth(Z + 2));
  txt(STRIP.x + 18, STRIP.y + 6, 'RIVALS IN THE SHOWDOWN', {
    pixel: true, size: '10px', color: '#a7d5ef', depth: Z + 7,
  }, baseObjects);
  add(scene.add.rectangle(SIDE.x + SIDE.w / 2, SIDE.y + SIDE.h / 2,
    SIDE.w, SIDE.h, 0x07111d, 0.99).setStrokeStyle(2, 0x17354d)
    .setDepth(Z + 3));

  function redraw() {
    if (!active) return;
    detailObjects.forEach(obj => { try { obj?.destroy?.(); } catch (_) {} });
    detailObjects = [];

    const index = controller.previewIndex;
    const round = offer.rounds[index];
    const rival = getCharacterForContext(round?.characterId, {
      rivalContext: true, playerCharacterId,
    }) || characters[round?.characterId] || null;
    const rivalCar = cars[round?.carId] || null;
    const visual = getCharacterVisualForContext(round?.characterId, {
      rivalContext: true, playerCharacterId,
    });

    // Large side-profile car: use the existing Meet wheel/paint renderer and
    // original opponent paint, not a stock-car placeholder or altered tuning.
    if (rivalCar && scene.textures.exists(getCarBodyTextureKey(scene, rivalCar)) &&
        scene.textures.exists(rivalCar.visual?.wheelKey)) {
      const display = scene.createCarDisplay(rivalCar,
        STAGE.x + STAGE.w / 2, 455, 663, Z + 6, false,
        normalisePaintColor(round.paintColor, DEFAULT_PAINT_COLOR));
      display.forEach(obj => clipStage(add(obj, detailObjects)));
    }

    if (visual?.spriteKey && scene.textures.exists(visual.spriteKey)) {
      const src = scene.textures.get(visual.spriteKey).getSourceImage();
      const avatarX = STAGE.x + 255;
      const feetY = STAGE.y + STAGE.h - 4;
      const height = 315;
      const scale = height / Math.max(1, src.height);
      const charWidth = src.width * scale;
      clipStage(add(scene.add.ellipse(avatarX, feetY - 12,
        Math.max(90, charWidth * 0.77), 31, 0x000000, 0.55)
        .setDepth(Z + 11), detailObjects));
      clipStage(add(scene.add.ellipse(avatarX, feetY - 7,
        Math.max(65, charWidth * 0.56), 18, 0x000000, 0.82)
        .setDepth(Z + 12), detailObjects));
      clipStage(add(scene.add.image(avatarX, feetY, visual.spriteKey)
        .setOrigin(0.5, 1).setScale(scale).setDepth(Z + 13), detailObjects));
    }

    if (rival) {
      const labelWidth = 342;
      const labelX = STAGE.x + STAGE.w - labelWidth / 2 - 21;
      clipStage(add(scene.add.rectangle(labelX, STAGE.y + 42,
        labelWidth, 59, 0x071523, 0.90)
        .setStrokeStyle(2, 0x64d5fa).setDepth(Z + 26), detailObjects));
      clipStage(txt(labelX - labelWidth / 2 + 14, STAGE.y + 24,
        safe(rival.name), {
          pixel: true, size: '9px', color: '#f5ffff',
          depth: Z + 27, wrap: 315,
        }));
      clipStage(txt(labelX - labelWidth / 2 + 14, STAGE.y + 47,
        safe(location.district) + ' // ' +
          safe(round?.skillLabel || 'RIVAL') + ' DRIVER', {
          pixel: true, size: '8px', color: '#8ddff1',
          depth: Z + 27, wrap: 320,
        }));
    }

    // All three rivals are visible in the same Skytree card geometry.
    // Tapping is PREVIEW ONLY; the racing order remains rounds[0..2].
    offer.rounds.forEach((entry, i) => {
      const cardX = SHOWDOWN_CARD_CENTERS[i];
      const selected = i === index;
      const character = getCharacterForContext(entry.characterId, {
        rivalContext: true, playerCharacterId,
      }) || characters[entry.characterId];
      const rect = add(scene.add.rectangle(cardX, SHOWDOWN_CARD_Y,
        SHOWDOWN_CARD_WIDTH, SHOWDOWN_CARD_HEIGHT,
        selected ? 0x102a32 : 0x0a1521, 0.99)
        .setStrokeStyle(selected ? 3 : 2,
          selected ? 0x68e7ce : 0x315270)
        .setDepth(Z + 14).setInteractive({ useHandCursor: true }), detailObjects);
      rect.on('pointerdown', () => controller.select(i));
      const portraitX = cardX - 111;
      add(scene.add.rectangle(portraitX, SHOWDOWN_CARD_Y, 105, 105,
        0x101b27).setStrokeStyle(1, 0x365775).setDepth(Z + 15),
        detailObjects);
      if (character) {
        const portrait = createCharacterProfile(scene, {
          characterId: entry.characterId,
          pose: 'idle',
          x: portraitX, y: SHOWDOWN_CARD_Y,
          frameWidth: 104, frameHeight: 104,
          side: 'left', depth: Z + 16,
          rivalContext: true, playerCharacterId,
        });
        if (portrait?.image) add(portrait.image, detailObjects);
        if (portrait?.maskShape) add(portrait.maskShape, detailObjects);
      }
      txt(cardX - 42, SHOWDOWN_CARD_Y - 52,
        safe(character?.name || 'RIVAL'), {
          pixel: true, size: '8px', color: '#f6ffff',
          depth: Z + 17, wrap: 208,
        });
      const quote = getMeetCharacterQuote(character?.id, 'ready',
        character?.introQuote || 'Ready for the next run.');
      txt(cardX - 42, SHOWDOWN_CARD_Y - 22, '“' + quote + '”', {
        size: '10px', color: '#a6c3d0', depth: Z + 17, wrap: 207,
      });
      txt(cardX - 42, SHOWDOWN_CARD_Y + 31,
        'HEAT ' + (i + 1) + ' // ' + safe(entry.skillLabel || 'RIVAL'), {
          pixel: true, size: '7px', color: '#ffe6a7',
          depth: Z + 17, wrap: 208,
        });
    });

    // Skytree's right-panel hierarchy, without the two venue buttons.
    txt(SIDE.x + 18, SIDE.y + 18, 'STREET SHOWDOWN', {
      pixel: true, size: '12px', color: '#8feaff', wrap: SIDE.w - 36,
    });
    txt(SIDE.x + 20, SIDE.y + 67,
      safe(location.district) + ' // ' + safe(offer.difficulty || 'STREET'), {
        pixel: true, size: '8px', color: '#b5d2e5',
        wrap: SIDE.w - 40,
      });
    txt(SIDE.x + 20, SIDE.y + 140, 'YOUR CAR', {
      pixel: true, size: '9px', color: '#8feaff',
    });
    // Match the normal single-race Meet car summary exactly: Rajdhani 11px,
    // current vehicle performance and the same estimated/dyno value policy.
    txt(SIDE.x + 20, SIDE.y + 169,
      playerCar
        ? playerCar.shortName + '\n' +
          playerRating.powerLabel + '  •  ' + playerRating.torqueLabel
        : 'NO CAR', {
        size: '11px',
        color: playerCar ? '#d8e7ef' : '#72838f',
        spacing: -2,
        wrap: SIDE.w - 40,
      });
    if (offer.restriction) {
      txt(SIDE.x + 20, SIDE.y + 207,
        'CLASS // ' + safe(offer.restriction.label || 'RESTRICTED'), {
          pixel: true, size: '7px', color: '#fbe7a4', wrap: SIDE.w - 40,
        });
    }
    add(scene.add.rectangle(SIDE.x + SIDE.w / 2, SIDE.y + 244,
      SIDE.w - 34, 1, 0x31516a).setDepth(Z + 8), detailObjects);
    txt(SIDE.x + 20, SIDE.y + 258, 'THREE RIVALS', {
      pixel: true, size: '9px', color: '#8feaff', wrap: SIDE.w - 40,
    });
    txt(SIDE.x + 20, SIDE.y + 292, 'HEAT ' + (index + 1) + ' OF 3', {
      pixel: true, size: '9px', color: '#ffe09a',
    });
    txt(SIDE.x + 20, SIDE.y + 322,
      'CAR: ' + safe(rivalCar?.shortName || 'UNKNOWN') +
      '\nDRIVER: ' + safe(round?.skillLabel || 'RIVAL') +
      '\nRACE: ' + safe(round?.raceType || 'STANDING START') +
      '\nDISTANCE: 1/4 MILE', {
        size: '12px', color: '#e7f2fb', wrap: SIDE.w - 40,
      });

    txt(SIDE.x + 20, SIDE.y + 435, 'PRIZE', {
      pixel: true, size: '10px', color: '#a4d7eb',
    });
    if (couponEvent && prizeCar) {
      txt(SIDE.x + 20, SIDE.y + 466,
        safe(prizeCar.shortName || prizeCar.name) + ' COUPON', {
          pixel: true, size: '8px', color: '#ffdf70', wrap: SIDE.w - 40,
        });
      txt(SIDE.x + 20, SIDE.y + 503,
        getCarCouponCount(scene.registry, offer.prizeCarId) +
        ' OWNED // ' + getCarCouponRequirement(offer.prizeCarId) + ' PER CAR', {
          pixel: true, size: '7px', color: '#fbe7a4', wrap: SIDE.w - 40,
        });
    } else {
      txt(SIDE.x + 20, SIDE.y + 465, money(offer.prizeCash), {
        pixel: true, size: '13px', color: '#ffdf70', wrap: SIDE.w - 40,
      });
    }
    txt(SIDE.x + 20, SIDE.y + 542, 'WIN ALL 3 HEATS', {
      pixel: true, size: '9px', color: '#a8efce', wrap: SIDE.w - 40,
    });
    if (!canEnter) {
      txt(SIDE.x + 20, SIDE.y + 575,
        !playerCar ? 'SELECT A CAR FIRST'
          : !classAllowed ? 'CLASS RESTRICTION NOT MET'
          : 'INSUFFICIENT CASH', {
          pixel: true, size: '7px', color: '#e6b7a2',
          wrap: SIDE.w - 40,
        });
    }
    button(SIDE.x + SIDE.w / 2, SIDE.y + SHOWDOWN_RACE_Y_OFFSET,
      SIDE.w - 38, SHOWDOWN_RACE_BUTTON_HEIGHT,
      canEnter ? 'ENTER  //  ' + money(entryFee) + '  >'
        : !classAllowed ? 'NEED ELIGIBLE CAR'
          : 'NEED ' + money(entryFee), {
        enabled: canEnter, accent: true,
        onClick: () => {
          // Unlike changing the preview card, this explicitly accepts an
          // offer. Close the overlay before MeetScene starts RaceScene.
          close();
          onEnter(offer);
        },
      });
    button(SIDE.x + SIDE.w / 2, SIDE.y + SHOWDOWN_BACK_Y_OFFSET,
      SIDE.w - 36, SHOWDOWN_BACK_BUTTON_HEIGHT, 'BACK TO MEET  >', {
        onClick: close,
      });
  }

  scene.events.once('shutdown', close);
  scene.events.once('destroy', close);
  redraw();
  return controller;
}
