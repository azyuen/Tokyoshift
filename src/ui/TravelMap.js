import {
  MEET_REGIONS,
  MEET_LOCATIONS,
  LOCATION_ORDER_BY_REGION,
  getMeetLocation,
  getTravelCost,
} from '../data/meetAssets.js?v=20260921-r49';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const MONEY = value => '¥ ' + Number(value || 0).toLocaleString('en-US');

export function showTravelMap(scene, {
  currentLocationId,
  onTravel,
  title = 'TOKYO AREA MAP',
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

  const add = obj => {
    objects.push(obj);
    return obj;
  };

  const blocker = add(scene.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.72)
    .setDepth(depth)
    .setInteractive());

  const panel = add(scene.add.rectangle(780, 420, 1160, 650, 0x07111d, 0.995)
    .setStrokeStyle(2, 0x46d7ff, 0.92)
    .setDepth(depth + 1));

  add(scene.add.text(780, 122, title, {
    fontFamily: PIXEL_FONT,
    fontSize: '18px',
    color: '#eefaff',
  }).setOrigin(0.5).setDepth(depth + 2));

  add(scene.add.text(780, 162, 'SELECT WHERE TO DRIVE', {
    fontFamily: BODY_FONT,
    fontSize: '12px',
    color: '#7f9caf',
  }).setOrigin(0.5).setDepth(depth + 2));

  // Schematic expressway line between the two districts.
  const highway = add(scene.add.graphics().setDepth(depth + 2));
  highway.lineStyle(4, 0x284f69, 0.8);
  highway.beginPath();
  highway.moveTo(520, 356);
  highway.lineTo(1040, 356);
  highway.strokePath();

  const regionUi = {};
  const regionCenters = { WANGAN: 470, DAIKOKU: 1090 };

  Object.keys(MEET_REGIONS).forEach(regionId => {
    const cx = regionCenters[regionId];
    const region = MEET_REGIONS[regionId];

    const regionBox = add(scene.add.rectangle(cx, 365, 500, 360, 0x091624, 0.98)
      .setStrokeStyle(2, 0x25465e, 1)
      .setDepth(depth + 2));

    const regionTitle = add(scene.add.text(cx, 215, region.label, {
      fontFamily: PIXEL_FONT,
      fontSize: '13px',
      color: '#8edcff',
    }).setOrigin(0.5).setDepth(depth + 3));

    const locationRows = [];
    LOCATION_ORDER_BY_REGION[regionId].forEach((locationId, i) => {
      const loc = MEET_LOCATIONS[locationId];
      const y = 280 + i * 88;

      const row = add(scene.add.rectangle(cx, y, 432, 68, 0x0b1724, 1)
        .setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(depth + 3));

      const name = add(scene.add.text(cx - 190, y - 12, loc.label, {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: '#dff7ff',
      }).setOrigin(0, 0.5).setDepth(depth + 4));

      const meta = add(scene.add.text(
        cx - 190,
        y + 15,
        loc.timeOfDay.toUpperCase() + '  •  ' + loc.difficulty,
        {
          fontFamily: BODY_FONT,
          fontSize: '10px',
          color: '#7896a9',
          fontStyle: '600',
        }
      ).setOrigin(0, 0.5).setDepth(depth + 4));

      const cost = resolveCost(locationId);
      const costText = add(scene.add.text(cx + 190, y, cost === 0 ? 'HERE' : MONEY(cost), {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: cost === 0 ? '#62e8c7' : '#ffe08a',
      }).setOrigin(1, 0.5).setDepth(depth + 4));

      row.on('pointerdown', () => {
        selectedId = locationId;
        updateSelection();
      });

      locationRows.push({ locationId, row, name, meta, costText });
    });

    regionUi[regionId] = { regionBox, regionTitle, locationRows };
  });

  const selectedText = add(scene.add.text(430, 594, '', {
    fontFamily: PIXEL_FONT,
    fontSize: '9px',
    color: '#dff7ff',
  }).setOrigin(0, 0.5).setDepth(depth + 4));

  const detailText = add(scene.add.text(430, 624, '', {
    fontFamily: BODY_FONT,
    fontSize: '10px',
    color: '#8aa3b4',
  }).setOrigin(0, 0.5).setDepth(depth + 4));

  const travelButton = add(scene.add.rectangle(1000, 610, 340, 54, 0x0d2b29, 1)
    .setStrokeStyle(2, 0x62e8c7, 1)
    .setDepth(depth + 4));

  const travelLabel = add(scene.add.text(1000, 610, '', {
    fontFamily: PIXEL_FONT,
    fontSize: '9px',
    color: '#f1fffb',
  }).setOrigin(0.5).setDepth(depth + 5));

  const close = add(scene.add.rectangle(780, 700, 210, 42, 0x171c25, 1)
    .setStrokeStyle(1, 0x516a7b, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(depth + 4));

  add(scene.add.text(780, 700, 'CLOSE', {
    fontFamily: PIXEL_FONT,
    fontSize: '8px',
    color: '#c7d5de',
  }).setOrigin(0.5).setDepth(depth + 5));

  const dismiss = () => {
    objects.forEach(obj => obj?.destroy?.());
    scene.travelMapPopup = null;
  };

  const updateSelection = () => {
    const target = getMeetLocation(selectedId);
    const cost = resolveCost(selectedId);
    const cash = Number(scene.registry.get('cash') || 0);
    const enough = cash >= cost;
    const isCurrent = selectedId === current.id;

    Object.values(regionUi).forEach(group => {
      group.locationRows.forEach(item => {
        const active = item.locationId === selectedId;
        item.row
          .setFillStyle(active ? 0x10283b : 0x0b1724, 1)
          .setStrokeStyle(active ? 2 : 1, active ? 0x43dfff : 0x315470, 1);
        item.name.setColor(active ? '#ffffff' : '#dff7ff');
      });
    });

    selectedText.setText(target.district + ' // ' + target.label);
    detailText.setText(
      target.timeOfDay.toUpperCase() +
      '  •  ' + target.difficulty +
      '  •  FUEL ' + MONEY(cost)
    );

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
      actionVerb + '  •  ' + MONEY(cost)
    );

    travelButton.on('pointerdown', () => {
      dismiss();
      onTravel?.(selectedId, cost);
    });
  };

  blocker.on('pointerdown', dismiss);
  close.on('pointerdown', dismiss);
  scene.travelMapPopup = panel;
  updateSelection();
  return panel;
}
