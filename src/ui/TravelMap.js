import {
  MEET_LOCATIONS,
  getMeetLocation,
} from '../data/meetAssets.js?v=20260921-r60';
import {
  HOME_REGION_ID,
  HOME_RETURN_COST,
  TRAVEL_REGIONS,
  TRAVEL_REGION_ORDER,
  getTravelLocation,
  regionIdForMeetLocation,
  getRegionTravelCost,
} from '../data/travelRegions.js?v=20260921-r67';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const MONEY = value => '¥ ' + Number(value || 0).toLocaleString('en-US');

const REGION_MAP_TEXTURE = 'travelMapTokyoRegion';
const FALLBACK_MAP_TEXTURE = 'travelMapTokyoBay';

const MAP = { x: 52, y: 128, w: 1038, h: 584 };
const INFO = { x: 1110, y: 104, w: 400, h: 692 };

const mapPoint = region => ({
  x: MAP.x + MAP.w * region.mapX,
  y: MAP.y + MAP.h * region.mapY,
});

function currentRegionFromLocation(locationId, fromWorkshop) {
  if (fromWorkshop) return HOME_REGION_ID;
  if (MEET_LOCATIONS[locationId]) {
    return getMeetLocation(locationId).district;
  }
  return regionIdForMeetLocation(locationId, 'ODAIBA');
}

function locationTimeLabel(locationId) {
  const meet = MEET_LOCATIONS[locationId];
  return meet?.timeOfDay ? meet.timeOfDay.toUpperCase() : null;
}

export function showTravelMap(scene, {
  currentLocationId,
  onTravel,
  onHome = null,
  title = 'TOKYO REGION MAP',
  fromWorkshop = false,
  allowCurrentAction = false,
  actionVerb = 'DRIVE',
  homeCost = HOME_RETURN_COST,
} = {}) {
  if (scene.travelMapPopup?.active) return scene.travelMapPopup;

  const depth = 120;
  const objects = [];
  const tweens = [];
  const regionUi = {};
  const locationUi = [];

  const currentRegionId = currentRegionFromLocation(currentLocationId, fromWorkshop);
  let selectedRegionId = currentRegionId;
  let selectedLocationId = fromWorkshop
    ? 'shinonomeWorkshop'
    : (getTravelLocation(currentLocationId)?.id || currentLocationId || 'odaiba7eleven');

  const add = obj => {
    objects.push(obj);
    return obj;
  };

  const dismiss = () => {
    tweens.forEach(tween => tween?.remove?.());
    objects.forEach(obj => obj?.destroy?.());
    scene.travelMapPopup = null;
  };

  const blocker = add(scene.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.78)
    .setDepth(depth)
    .setInteractive());

  const panel = add(scene.add.rectangle(780, 420, 1508, 790, 0x06101b, 0.995)
    .setStrokeStyle(2, 0x46d7ff, 0.92)
    .setInteractive()
    .setDepth(depth + 1));

  add(scene.add.text(58, 38, title, {
    fontFamily: PIXEL_FONT,
    fontSize: '15px',
    color: '#eefaff',
  }).setOrigin(0, 0.5).setDepth(depth + 4));

  add(scene.add.text(58, 72, 'SELECT A REGION // THEN CHOOSE A MEET', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#6ca8c6',
  }).setOrigin(0, 0.5).setDepth(depth + 4));

  const cash = Number(scene.registry.get('cash') || 0);
  const headerCash = add(scene.add.text(1502, 38, MONEY(cash), {
    fontFamily: PIXEL_FONT,
    fontSize: '11px',
    color: '#ffe08a',
  }).setOrigin(1, 0.5).setDepth(depth + 4));

  add(scene.add.rectangle(
    MAP.x + MAP.w / 2,
    MAP.y + MAP.h / 2,
    MAP.w + 8,
    MAP.h + 8,
    0x07131f,
    1
  ).setStrokeStyle(2, 0x244d68, 1).setDepth(depth + 2));

  const mapTexture = scene.textures.exists(REGION_MAP_TEXTURE)
    ? REGION_MAP_TEXTURE
    : scene.textures.exists(FALLBACK_MAP_TEXTURE)
      ? FALLBACK_MAP_TEXTURE
      : null;

  if (mapTexture) {
    add(scene.add.image(
      MAP.x + MAP.w / 2,
      MAP.y + MAP.h / 2,
      mapTexture
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
      'UPLOAD assets/Ui/tokyo_region_map.png',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '10px',
        color: '#6d8797',
      }
    ).setOrigin(0.5).setDepth(depth + 3));
  }

  add(scene.add.rectangle(
    MAP.x + MAP.w / 2,
    MAP.y + MAP.h / 2,
    MAP.w,
    MAP.h,
    0x020812,
    0.08
  ).setDepth(depth + 2.3));

  add(scene.add.rectangle(
    INFO.x + INFO.w / 2,
    INFO.y + INFO.h / 2,
    INFO.w,
    INFO.h,
    0x07111d,
    0.99
  ).setStrokeStyle(2, 0x244d68, 1).setDepth(depth + 2));

  add(scene.add.text(INFO.x + 22, INFO.y + 18, 'REGION', {
    fontFamily: PIXEL_FONT,
    fontSize: '8px',
    color: '#718fa3',
  }).setDepth(depth + 4));

  const regionNameText = add(scene.add.text(INFO.x + 22, INFO.y + 48, '', {
    fontFamily: PIXEL_FONT,
    fontSize: '14px',
    color: '#eefaff',
  }).setDepth(depth + 4));

  const regionMetaText = add(scene.add.text(INFO.x + 22, INFO.y + 82, '', {
    fontFamily: PIXEL_FONT,
    fontSize: '8px',
    color: '#65dffc',
  }).setDepth(depth + 4));

  const regionDescriptionText = add(scene.add.text(INFO.x + 22, INFO.y + 112, '', {
    fontFamily: BODY_FONT,
    fontSize: '10px',
    color: '#8aa3b4',
    fontStyle: '600',
    wordWrap: { width: INFO.w - 44 },
    lineSpacing: 1,
  }).setDepth(depth + 4));

  add(scene.add.rectangle(
    INFO.x + INFO.w / 2,
    INFO.y + 176,
    INFO.w - 36,
    1,
    0x34536a,
    0.75
  ).setDepth(depth + 3));

  add(scene.add.text(INFO.x + 22, INFO.y + 194, 'LOCATIONS', {
    fontFamily: PIXEL_FONT,
    fontSize: '8px',
    color: '#718fa3',
  }).setDepth(depth + 4));

  const locationStartY = INFO.y + 246;

  for (let i = 0; i < 3; i++) {
    const y = locationStartY + i * 72;

    const box = add(scene.add.rectangle(
      INFO.x + INFO.w / 2,
      y,
      INFO.w - 44,
      60,
      0x0b1724,
      1
    ).setStrokeStyle(1, 0x315470, 1).setDepth(depth + 4));

    const label = add(scene.add.text(INFO.x + 34, y - 13, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#dff3ff',
    }).setOrigin(0, 0.5).setDepth(depth + 5));

    const meta = add(scene.add.text(INFO.x + 34, y + 14, '', {
      fontFamily: BODY_FONT,
      fontSize: '9px',
      color: '#7d9bad',
      fontStyle: '600',
    }).setOrigin(0, 0.5).setDepth(depth + 5));

    locationUi.push({ box, label, meta, location: null });
  }

  add(scene.add.rectangle(
    INFO.x + INFO.w / 2,
    INFO.y + 466,
    INFO.w - 36,
    1,
    0x34536a,
    0.75
  ).setDepth(depth + 3));

  const selectedDetail = add(scene.add.text(INFO.x + 22, INFO.y + 486, '', {
    fontFamily: BODY_FONT,
    fontSize: '10px',
    color: '#9ab0bd',
    fontStyle: '600',
    wordWrap: { width: INFO.w - 44 },
    lineSpacing: 1,
  }).setDepth(depth + 4));

  const travelButton = add(scene.add.rectangle(
    INFO.x + INFO.w / 2,
    INFO.y + 566,
    INFO.w - 44,
    58,
    0x0d2b29,
    1
  ).setStrokeStyle(2, 0x62e8c7, 1).setDepth(depth + 4));

  const travelLabel = add(scene.add.text(
    INFO.x + INFO.w / 2,
    INFO.y + 566,
    '',
    {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#f1fffb',
    }
  ).setOrigin(0.5).setDepth(depth + 5));

  const closeButton = add(scene.add.rectangle(
    INFO.x + INFO.w / 2,
    INFO.y + 638,
    INFO.w - 44,
    42,
    0x171c25,
    1
  ).setStrokeStyle(1, 0x516a7b, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(depth + 4));

  add(scene.add.text(
    INFO.x + INFO.w / 2,
    INFO.y + 638,
    'CLOSE GPS',
    {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#c7d5de',
    }
  ).setOrigin(0.5).setDepth(depth + 5));

  const getTargetCost = location => {
    if (!location) return 0;

    if (location.kind === 'home') {
      return fromWorkshop ? 0 : Number(homeCost ?? HOME_RETURN_COST);
    }

    return getRegionTravelCost({
      fromWorkshop,
      currentLocationId,
      targetLocationId: location.id,
    });
  };

  const updateRegionNodes = () => {
    Object.entries(regionUi).forEach(([regionId, item]) => {
      const active = regionId === selectedRegionId;
      const here = regionId === currentRegionId;
      const home = regionId === HOME_REGION_ID;

      if (active) {
        item.glow.setRadius(28)
          .setFillStyle(home ? 0x25dbff : 0xff4fbd, 0.15)
          .setStrokeStyle(3, home ? 0x5ceaff : 0xff63c5, 0.96);
        item.ring.setRadius(18)
          .setStrokeStyle(4, 0xffffff, 1);
        item.core.setRadius(6)
          .setFillStyle(home ? 0x60ecff : 0xff6bc9, 1);
      } else if (here) {
        item.glow.setRadius(25)
          .setFillStyle(0x35e8ff, 0.12)
          .setStrokeStyle(3, 0x55ecff, 0.9);
        item.ring.setRadius(16)
          .setStrokeStyle(3, 0xa9f7ff, 0.95);
        item.core.setRadius(5)
          .setFillStyle(0xcdfaff, 1);
      } else {
        item.glow.setRadius(21)
          .setFillStyle(home ? 0x168aa0 : 0x86205f, 0.05)
          .setStrokeStyle(2, home ? 0x4fa8b8 : 0x8a5274, 0.5);
        item.ring.setRadius(14)
          .setStrokeStyle(2, home ? 0x73b8c4 : 0xa66b8e, 0.68);
        item.core.setRadius(4)
          .setFillStyle(home ? 0x9dd9e4 : 0xd7a5c8, 0.82);
      }
    });
  };

  const refreshLocationRows = region => {
    region.locations.slice(0, 3).forEach((location, i) => {
      const row = locationUi[i];
      row.location = location;

      const selected = selectedLocationId === location.id;
      const isCurrent = !fromWorkshop && currentLocationId === location.id;
      const cost = getTargetCost(location);
      const available = Boolean(location.available);

      row.label.setText(location.label);

      if (location.kind === 'home') {
        row.meta.setText(fromWorkshop
          ? 'HOME BASE // HERE'
          : 'HOME BASE // ' + MONEY(cost));
      } else if (!available) {
        row.meta.setText(location.difficulty + ' // COMING SOON');
      } else if (isCurrent) {
        row.meta.setText(location.difficulty + ' // HERE');
      } else {
        const time = locationTimeLabel(location.id);
        row.meta.setText(
          (time ? time + ' // ' : '') + location.difficulty + ' // ' + MONEY(cost)
        );
      }

      row.box.removeAllListeners('pointerdown');

      if (available || location.kind === 'home') {
        row.box.setInteractive({ useHandCursor: true });
        row.box.on('pointerdown', () => {
          selectedLocationId = location.id;
          refreshPanel();
        });
      } else {
        row.box.disableInteractive();
      }

      row.box
        .setFillStyle(selected ? 0x14263a : available || location.kind === 'home' ? 0x0b1724 : 0x0a1017, 1)
        .setStrokeStyle(
          selected ? 2 : 1,
          selected ? 0x43dfff : available || location.kind === 'home' ? 0x315470 : 0x29343d,
          1
        );

      row.label.setColor(
        selected ? '#ffffff' : available || location.kind === 'home' ? '#dff3ff' : '#66747d'
      );
      row.meta.setColor(
        available || location.kind === 'home' ? '#7d9bad' : '#53616b'
      );
    });
  };

  const refreshAction = location => {
    const currentCash = Number(scene.registry.get('cash') || 0);
    const cost = getTargetCost(location);
    const isCurrent = !fromWorkshop && location?.id === currentLocationId;
    const isHome = location?.kind === 'home';
    const available = Boolean(location?.available) || isHome;
    const enough = currentCash >= cost;

    travelButton.removeAllListeners('pointerdown');

    if (!location) {
      travelButton.disableInteractive()
        .setFillStyle(0x111820, 1)
        .setStrokeStyle(1, 0x40515d, 1);
      travelLabel.setColor('#72838f').setText('SELECT A LOCATION');
      return;
    }

    if (!available) {
      travelButton.disableInteractive()
        .setFillStyle(0x111820, 1)
        .setStrokeStyle(1, 0x40515d, 1);
      travelLabel.setColor('#72838f').setText('COMING SOON');
      return;
    }

    if (isHome && fromWorkshop) {
      travelButton.disableInteractive()
        .setFillStyle(0x10202a, 1)
        .setStrokeStyle(1, 0x4f788b, 1);
      travelLabel.setColor('#7fcfe8').setText('YOU\'RE HOME');
      return;
    }

    if (isCurrent && !allowCurrentAction) {
      travelButton.disableInteractive()
        .setFillStyle(0x111820, 1)
        .setStrokeStyle(1, 0x40515d, 1);
      travelLabel.setColor('#72838f').setText('CURRENT LOCATION');
      return;
    }

    if (!enough) {
      travelButton.disableInteractive()
        .setFillStyle(0x25151a, 1)
        .setStrokeStyle(2, 0x8b4f5c, 1);
      travelLabel.setColor('#c99aa4').setText('NEED ' + MONEY(cost));
      return;
    }

    travelButton
      .setInteractive({ useHandCursor: true })
      .setFillStyle(isHome ? 0x102838 : 0x0d2b29, 1)
      .setStrokeStyle(2, isHome ? 0x55dfff : 0x62e8c7, 1);

    travelLabel.setColor('#f1fffb').setText(
      isHome
        ? 'RETURN HOME // ' + MONEY(cost)
        : actionVerb + ' // ' + MONEY(cost)
    );

    travelButton.on('pointerdown', () => {
      dismiss();
      if (isHome) {
        onHome?.(cost);
      } else {
        onTravel?.(location.id, cost);
      }
    });
  };

  const refreshPanel = () => {
    const region = TRAVEL_REGIONS[selectedRegionId] || TRAVEL_REGIONS.ODAIBA;
    let location = region.locations.find(item => item.id === selectedLocationId);

    if (!location) {
      if (!fromWorkshop && selectedRegionId === currentRegionId) {
        location = region.locations.find(item => item.id === currentLocationId);
      }
      location = location || region.locations.find(item => item.available) || region.locations[0];
      selectedLocationId = location?.id || null;
    }

    regionNameText.setText(region.label);
    regionMetaText.setText(
      region.role + ' // ' + region.level +
      (region.baseCost > 0 ? ' // FROM HOME ' + MONEY(region.baseCost) + '+' : '')
    );
    regionDescriptionText.setText(region.description);

    refreshLocationRows(region);

    const selectedLocation = region.locations.find(item => item.id === selectedLocationId) || null;
    const cost = getTargetCost(selectedLocation);

    if (selectedLocation) {
      selectedDetail.setText(
        selectedLocation.label + ' // ' + selectedLocation.note +
        (selectedLocation.available && selectedLocation.kind !== 'home'
          ? '\nTRAVEL ' + MONEY(cost) + '   •   BALANCE ' + MONEY(Number(scene.registry.get('cash') || 0))
          : '')
      );
    } else {
      selectedDetail.setText('');
    }

    refreshAction(selectedLocation);
    updateRegionNodes();
  };

  TRAVEL_REGION_ORDER.forEach(regionId => {
    const region = TRAVEL_REGIONS[regionId];
    const pt = mapPoint(region);
    const home = regionId === HOME_REGION_ID;

    const glow = add(scene.add.circle(pt.x, pt.y, 22, home ? 0x29dcff : 0xff4fbd, 0.05)
      .setStrokeStyle(2, home ? 0x53dff8 : 0xff63c5, 0.45)
      .setDepth(depth + 5));

    const ring = add(scene.add.circle(pt.x, pt.y, 14, 0x07111d, 0.22)
      .setStrokeStyle(3, home ? 0x7cefff : 0xff8bd5, 0.82)
      .setDepth(depth + 6));

    const core = add(scene.add.circle(pt.x, pt.y, 4, home ? 0xcdfaff : 0xffb3e5, 0.95)
      .setDepth(depth + 7));

    const hit = add(scene.add.circle(pt.x, pt.y, 37, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 8));

    hit.on('pointerdown', () => {
      selectedRegionId = regionId;

      if (regionId === currentRegionId && !fromWorkshop) {
        selectedLocationId = currentLocationId;
      } else if (regionId === HOME_REGION_ID) {
        selectedLocationId = 'shinonomeWorkshop';
      } else {
        selectedLocationId = region.locations.find(item => item.available)?.id
          || region.locations[0]?.id
          || null;
      }

      refreshPanel();
    });

    regionUi[regionId] = { glow, ring, core, hit, pt };
  });

  const currentUi = regionUi[currentRegionId];
  if (currentUi) {
    tweens.push(scene.tweens.add({
      targets: currentUi.glow,
      scaleX: 1.24,
      scaleY: 1.24,
      alpha: 0.55,
      duration: 760,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    }));
  }

  blocker.on('pointerdown', dismiss);
  closeButton.on('pointerdown', dismiss);
  panel.on('pointerdown', (_pointer, _lx, _ly, event) => event?.stopPropagation?.());

  scene.travelMapPopup = panel;
  refreshPanel();
  headerCash.setText(MONEY(Number(scene.registry.get('cash') || 0)));

  return panel;
}
