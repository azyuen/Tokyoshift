import {
  MEET_LOCATIONS,
  getMeetLocation,
  getTravelCost,
  LOCAL_TRAVEL_COST,
  DISTRICT_TRAVEL_COST,
} from '../data/meetAssets.js?v=20260921-r60';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const MONEY = value => '¥ ' + Number(value || 0).toLocaleString('en-US');

const MAP_TEXTURE = 'travelMapTokyoBay';
const MAP = { x: 52, y: 104, w: 1038, h: 692 };
const INFO = { x: 1110, y: 104, w: 400, h: 692 };

const MAP_NODES = {
  odaiba7eleven: { x: 0.405, y: 0.352 },
  odaibaGundamPlaza: { x: 0.432, y: 0.408 },
  odaibaMiraikan: { x: 0.445, y: 0.471 },

  tatsumiBridgefrontPlaza: { x: 0.762, y: 0.107 },
  tatsumiSkylineVista: { x: 0.793, y: 0.177 },
  tatsumiHarborLoop: { x: 0.783, y: 0.250 },

  daikokuHarbor: { x: 0.216, y: 0.875 },
  daikokuPA: { x: 0.261, y: 0.788 },
  daikokuOpenLot: { x: 0.345, y: 0.837 },
};

const mapPoint = node => ({
  x: MAP.x + MAP.w * node.x,
  y: MAP.y + MAP.h * node.y,
});

export function showTravelMap(scene, {
  currentLocationId,
  onTravel,
  title = 'TOKYO REGION MAP',
  allowCurrentAction = false,
  actionVerb = 'DRIVE',
  costResolver = null,
} = {}) {
  if (scene.travelMapPopup?.active) return scene.travelMapPopup;

  const current = getMeetLocation(currentLocationId);
  const resolveCost = targetId => costResolver
    ? Number(costResolver(current.id, targetId) || 0)
    : getTravelCost(current.id, targetId);

  let selectedId = current.id;
  const depth = 120;
  const objects = [];
  const tweens = [];
  const nodeUi = {};

  const add = obj => {
    objects.push(obj);
    return obj;
  };

  const blocker = add(scene.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.76)
    .setDepth(depth)
    .setInteractive());

  const panel = add(scene.add.rectangle(780, 420, 1508, 790, 0x06101b, 0.995)
    .setStrokeStyle(2, 0x46d7ff, 0.92)
    .setInteractive()
    .setDepth(depth + 1));

  // Header is rendered by Phaser so the art can remain a reusable map layer.
  add(scene.add.text(58, 38, title, {
    fontFamily: PIXEL_FONT,
    fontSize: '15px',
    color: '#eefaff',
  }).setOrigin(0, 0.5).setDepth(depth + 4));


  const cash = Number(scene.registry.get('cash') || 0);
  const headerCash = add(scene.add.text(1502, 38, MONEY(cash), {
    fontFamily: PIXEL_FONT,
    fontSize: '11px',
    color: '#ffe08a',
  }).setOrigin(1, 0.5).setDepth(depth + 4));

  // Map frame and image.
  add(scene.add.rectangle(
    MAP.x + MAP.w / 2,
    MAP.y + MAP.h / 2,
    MAP.w + 8,
    MAP.h + 8,
    0x07131f,
    1
  ).setStrokeStyle(2, 0x244d68, 1).setDepth(depth + 2));

  if (scene.textures.exists(MAP_TEXTURE)) {
    add(scene.add.image(
      MAP.x + MAP.w / 2,
      MAP.y + MAP.h / 2,
      MAP_TEXTURE
    ).setDisplaySize(MAP.w, MAP.h).setDepth(depth + 2.2));
  } else {
    add(scene.add.rectangle(
      MAP.x + MAP.w / 2,
      MAP.y + MAP.h / 2,
      MAP.w,
      MAP.h,
      0x07111d,
      1
    ).setDepth(depth + 2.2));

    add(scene.add.text(
      MAP.x + MAP.w / 2,
      MAP.y + MAP.h / 2,
      'GPS MAP DATA UNAVAILABLE',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '12px',
        color: '#6d8797',
      }
    ).setOrigin(0.5).setDepth(depth + 3));
  }

  // A light darkening layer makes Phaser's live nodes legible without hiding the artwork.
  add(scene.add.rectangle(
    MAP.x + MAP.w / 2,
    MAP.y + MAP.h / 2,
    MAP.w,
    MAP.h,
    0x020812,
    0.10
  ).setDepth(depth + 2.3));

  // Info panel.
  add(scene.add.rectangle(
    INFO.x + INFO.w / 2,
    INFO.y + INFO.h / 2,
    INFO.w,
    INFO.h,
    0x07111d,
    0.985
  ).setStrokeStyle(2, 0x244d68, 1).setDepth(depth + 2));

  add(scene.add.text(INFO.x + 22, INFO.y + 22, 'CURRENT LOCATION', {
    fontFamily: PIXEL_FONT,
    fontSize: '8px',
    color: '#718fa3',
  }).setDepth(depth + 4));

  add(scene.add.text(
    INFO.x + 22,
    INFO.y + 56,
    current.district + ' // ' + current.label,
    {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#62e8c7',
      wordWrap: { width: INFO.w - 44 },
    }
  ).setDepth(depth + 4));

  add(scene.add.rectangle(
    INFO.x + INFO.w / 2,
    INFO.y + 104,
    INFO.w - 36,
    1,
    0x34536a,
    0.75
  ).setDepth(depth + 3));

  add(scene.add.text(INFO.x + 22, INFO.y + 128, 'DESTINATION', {
    fontFamily: PIXEL_FONT,
    fontSize: '8px',
    color: '#718fa3',
  }).setDepth(depth + 4));

  const destinationText = add(scene.add.text(INFO.x + 22, INFO.y + 166, '', {
    fontFamily: PIXEL_FONT,
    fontSize: '12px',
    color: '#eefaff',
    wordWrap: { width: INFO.w - 44 },
  }).setDepth(depth + 4));

  const destinationMeta = add(scene.add.text(INFO.x + 22, INFO.y + 222, '', {
    fontFamily: BODY_FONT,
    fontSize: '11px',
    color: '#8aa3b4',
    fontStyle: '600',
    wordWrap: { width: INFO.w - 44 },
  }).setDepth(depth + 4));

  add(scene.add.text(INFO.x + 22, INFO.y + 278, 'FUEL COST', {
    fontFamily: PIXEL_FONT,
    fontSize: '8px',
    color: '#718fa3',
  }).setDepth(depth + 4));

  const fuelText = add(scene.add.text(INFO.x + 22, INFO.y + 314, '', {
    fontFamily: PIXEL_FONT,
    fontSize: '21px',
    color: '#ffe08a',
  }).setDepth(depth + 4));

  const balanceText = add(scene.add.text(INFO.x + 22, INFO.y + 365, '', {
    fontFamily: BODY_FONT,
    fontSize: '10px',
    color: '#8aa3b4',
    fontStyle: '600',
  }).setDepth(depth + 4));

  add(scene.add.rectangle(
    INFO.x + INFO.w / 2,
    INFO.y + 408,
    INFO.w - 36,
    1,
    0x34536a,
    0.75
  ).setDepth(depth + 3));

  add(scene.add.text(INFO.x + 22, INFO.y + 430, 'TRAVEL RATES', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#718fa3',
  }).setDepth(depth + 4));

  add(scene.add.text(
    INFO.x + 22,
    INFO.y + 462,
    'LOCAL ' + MONEY(LOCAL_TRAVEL_COST) +
      '   //   CROSS-DISTRICT ' + MONEY(DISTRICT_TRAVEL_COST),
    {
      fontFamily: BODY_FONT,
      fontSize: '9px',
      color: '#7795a7',
      fontStyle: '600',
      wordWrap: { width: INFO.w - 44 },
    }
  ).setDepth(depth + 4));

  const travelButton = add(scene.add.rectangle(
    INFO.x + INFO.w / 2,
    INFO.y + 548,
    INFO.w - 44,
    58,
    0x0d2b29,
    1
  ).setStrokeStyle(2, 0x62e8c7, 1).setDepth(depth + 4));

  const travelLabel = add(scene.add.text(
    INFO.x + INFO.w / 2,
    INFO.y + 548,
    '',
    {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#f1fffb',
    }
  ).setOrigin(0.5).setDepth(depth + 5));

  const closeButton = add(scene.add.rectangle(
    INFO.x + INFO.w / 2,
    INFO.y + 626,
    INFO.w - 44,
    44,
    0x171c25,
    1
  ).setStrokeStyle(1, 0x516a7b, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(depth + 4));

  add(scene.add.text(
    INFO.x + INFO.w / 2,
    INFO.y + 626,
    'CLOSE GPS',
    {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#c7d5de',
    }
  ).setOrigin(0.5).setDepth(depth + 5));

  // Phaser owns interaction and state. The image underneath is purely visual.
  Object.entries(MAP_NODES).forEach(([locationId, node]) => {
    if (!MEET_LOCATIONS[locationId]) return;

    const pt = mapPoint(node);
    const glow = add(scene.add.circle(pt.x, pt.y, 23, 0x36dfff, 0.05)
      .setStrokeStyle(2, 0x4edfff, 0.50)
      .setDepth(depth + 5));

    const ring = add(scene.add.circle(pt.x, pt.y, 15, 0x07111d, 0.22)
      .setStrokeStyle(3, 0x7edfff, 0.82)
      .setDepth(depth + 6));

    const core = add(scene.add.circle(pt.x, pt.y, 5, 0xcdfaff, 0.95)
      .setDepth(depth + 7));

    const hit = add(scene.add.circle(pt.x, pt.y, 35, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 8));

    hit.on('pointerdown', () => {
      selectedId = locationId;
      updateSelection();
    });

    nodeUi[locationId] = { glow, ring, core, hit, pt };
  });

  const updateSelection = () => {
    const target = getMeetLocation(selectedId);
    const cost = resolveCost(selectedId);
    const currentCash = Number(scene.registry.get('cash') || 0);
    const enough = currentCash >= cost;
    const isCurrent = selectedId === current.id;

    Object.entries(nodeUi).forEach(([id, item]) => {
      const active = id === selectedId;
      const here = id === current.id;

      if (active) {
        item.glow.setRadius(27).setFillStyle(0xff4fbd, 0.12)
          .setStrokeStyle(3, 0xff63c5, 0.92);
        item.ring.setRadius(18).setStrokeStyle(4, 0xffffff, 1);
        item.core.setRadius(6).setFillStyle(0xff6bc9, 1);
      } else if (here) {
        item.glow.setRadius(24).setFillStyle(0x35e8ff, 0.10)
          .setStrokeStyle(3, 0x55ecff, 0.86);
        item.ring.setRadius(15).setStrokeStyle(3, 0xa9f7ff, 0.92);
        item.core.setRadius(5).setFillStyle(0xcdfaff, 1);
      } else {
        item.glow.setRadius(21).setFillStyle(0x1f89a5, 0.035)
          .setStrokeStyle(2, 0x4f8798, 0.38);
        item.ring.setRadius(14).setStrokeStyle(2, 0x7db6c7, 0.62);
        item.core.setRadius(4).setFillStyle(0xa5c9d4, 0.80);
      }
    });

    destinationText.setText(target.district + ' // ' + target.label);
    destinationMeta.setText(
      target.timeOfDay.toUpperCase() + '  •  ' + target.difficulty
    );

    fuelText
      .setText(isCurrent && !allowCurrentAction ? 'HERE' : MONEY(cost))
      .setColor(isCurrent && !allowCurrentAction ? '#62e8c7' : enough ? '#ffe08a' : '#ff8296');

    balanceText.setText('BALANCE  ' + MONEY(currentCash));

    travelButton.removeAllListeners('pointerdown');

    if (isCurrent && !allowCurrentAction) {
      travelButton
        .disableInteractive()
        .setFillStyle(0x111820, 1)
        .setStrokeStyle(1, 0x40515d, 1);
      travelLabel.setColor('#72838f').setText('CURRENT LOCATION');
      return;
    }

    if (!enough) {
      travelButton
        .disableInteractive()
        .setFillStyle(0x25151a, 1)
        .setStrokeStyle(2, 0x8b4f5c, 1);
      travelLabel.setColor('#c99aa4').setText('NEED ' + MONEY(cost));
      return;
    }

    travelButton
      .setInteractive({ useHandCursor: true })
      .setFillStyle(0x0d2b29, 1)
      .setStrokeStyle(2, 0x62e8c7, 1);

    travelLabel.setColor('#f1fffb').setText(
      actionVerb + '  //  ' + MONEY(cost)
    );

    travelButton.on('pointerdown', () => {
      dismiss();
      onTravel?.(selectedId, cost);
    });
  };

  // Pulse the current position independently from selected-destination state.
  const currentUi = nodeUi[current.id];
  if (currentUi) {
    tweens.push(scene.tweens.add({
      targets: currentUi.glow,
      scaleX: 1.26,
      scaleY: 1.26,
      alpha: 0.50,
      duration: 760,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    }));
  }

  const dismiss = () => {
    tweens.forEach(tween => tween?.remove?.());
    objects.forEach(obj => obj?.destroy?.());
    scene.travelMapPopup = null;
  };

  blocker.on('pointerdown', dismiss);
  closeButton.on('pointerdown', dismiss);
  panel.on('pointerdown', (_pointer, _lx, _ly, event) => event?.stopPropagation?.());

  scene.travelMapPopup = panel;
  updateSelection();

  // Keep the header balance live if another UI changed the registry immediately
  // before this popup opened.
  headerCash.setText(MONEY(Number(scene.registry.get('cash') || 0)));

  return panel;
}
