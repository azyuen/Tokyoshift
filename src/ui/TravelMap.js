import {
  MEET_LOCATIONS,
  getMeetLocation,
} from '../data/meetAssets.js?v=20260922-r84';
import {
  getWorkshopByLocationId,
  getGarageCapacity,
  isWorkshopUnlocked,
} from '../data/workshopProgression.js?v=20260922-r97';
import {
  HOME_REGION_ID,
  HOME_RETURN_COST,
  TRAVEL_REGIONS,
  TRAVEL_REGION_ORDER,
  getTravelLocation,
  regionIdForMeetLocation,
  getRegionTravelCost,
} from '../data/travelRegions.js?v=20260922-r125';
import {
  isCentralTokyoLocationUnlocked,
  getCentralTokyoUnlockLabel,
} from '../data/centralTokyo.js?v=20260922-r125';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const MONEY = value => '¥ ' + Number(value || 0).toLocaleString('en-US');

const REGION_MAP_TEXTURE = 'travelMapTokyoRegion';
const FALLBACK_MAP_TEXTURE = 'travelMapTokyoBay';

// The map now owns the whole framed popup. Everything else floats over it.
const MAP = { x: 26, y: 25, w: 1508, h: 790 };
const INFO = { x: 874, y: 418, w: 634, h: 374 };
const MAP_SOURCE = { w: 1672, h: 941 };

function getMapArtBounds(scene, textureKey) {
  const source = textureKey && scene.textures.exists(textureKey)
    ? scene.textures.get(textureKey).getSourceImage()
    : null;
  const sourceW = Number(source?.width || MAP_SOURCE.w);
  const sourceH = Number(source?.height || MAP_SOURCE.h);
  const scale = Math.max(MAP.w / sourceW, MAP.h / sourceH);
  const w = sourceW * scale;
  const h = sourceH * scale;
  return {
    x: MAP.x + (MAP.w - w) / 2,
    y: MAP.y + (MAP.h - h) / 2,
    w,
    h,
  };
}

function currentRegionFromLocation(locationId, fromWorkshop) {
  if (fromWorkshop) return HOME_REGION_ID;
  if (MEET_LOCATIONS[locationId]) {
    return getMeetLocation(locationId).district;
  }
  return regionIdForMeetLocation(locationId, 'ODAIBA');
}

function locationTimeLabel(location) {
  if (location?.kind === 'home' || location?.kind === 'garageUpgrade') return 'ANY';

  const meet = MEET_LOCATIONS[location?.id];
  const raw = String(meet?.timeOfDay || location?.timeOfDay || 'night').toLowerCase();
  return raw === 'day' ? 'DAY' : 'NIGHT';
}

export function showTravelMap(scene, {
  currentLocationId,
  onTravel,
  onHome = null,
  onWorkshopUpgrade = null,
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
  const panelObjects = [];

  const currentRegionId = currentRegionFromLocation(currentLocationId, fromWorkshop);
  let selectedRegionId = null;
  let selectedLocationId = null;
  const garageTier = () => Number(scene.registry.get('garageTier') || 0);
  const activeWorkshopId = () => scene.registry.get('workshopLocationId') || 'shinonomeWorkshop';
  const locationAvailable = location => {
    if (!location) return false;
    if (location.centralTokyoUnlock) {
      return isCentralTokyoLocationUnlocked(scene.registry, location.id);
    }
    return Boolean(location.available) || location.kind === 'home';
  };

  const add = obj => {
    objects.push(obj);
    return obj;
  };

  const addPanel = obj => {
    objects.push(obj);
    panelObjects.push(obj);
    return obj;
  };

  const setPanelVisible = visible => {
    panelObjects.forEach(obj => obj?.setVisible?.(visible));
  };

  const dismiss = () => {
    tweens.forEach(tween => tween?.remove?.());
    objects.forEach(obj => obj?.destroy?.());
    scene.travelMapPopup = null;
  };

  // Workshop switching changes the active GarageScene. Do not destroy the GPS
  // button/popup from inside its own pointerdown event before that transition.
  // On iOS Phaser can stall the input loop when the object currently
  // dispatching pointerdown is destroyed and the scene changes in the same
  // stack. Leave the map intact for a frame; the scene transition will clean
  // it up naturally.
  let workshopActionPending = false;
  const runWorkshopAction = (location, cost, unlocked) => {
    if (workshopActionPending) return;
    workshopActionPending = true;
    travelLabel.setColor('#7fcfe8').setText('OPENING WORKSHOP...');

    window.setTimeout(() => {
      try {
        onWorkshopUpgrade?.(location, cost, unlocked);
      } catch (error) {
        console.error('Workshop switch failed', error);
        workshopActionPending = false;
        refreshAction(location);
      }
    }, 0);
  };

  // Returning from a meet changes scene too. Keep the map alive through the
  // pointer event and defer the GarageScene transition by one task, matching
  // the stable workshop-switch path used on iOS/PWA.
  let homeActionPending = false;
  const runHomeAction = (location, cost) => {
    if (homeActionPending) return;
    homeActionPending = true;
    travelLabel.setColor('#7fcfe8').setText('RETURNING HOME...');

    window.setTimeout(() => {
      try {
        onHome?.(location?.id || 'shinonomeWorkshop', cost);
      } catch (error) {
        console.error('Return home failed', error);
        homeActionPending = false;
        refreshAction(location);
      }
    }, 0);
  };

  const blocker = add(scene.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.80)
    .setDepth(depth)
    .setInteractive());

  const frame = add(scene.add.rectangle(
    MAP.x + MAP.w / 2,
    MAP.y + MAP.h / 2,
    MAP.w,
    MAP.h,
    0x06101b,
    1
  ).setStrokeStyle(2, 0x46d7ff, 0.92)
    .setInteractive()
    .setDepth(depth + 1));

  const mapTexture = scene.textures.exists(REGION_MAP_TEXTURE)
    ? REGION_MAP_TEXTURE
    : scene.textures.exists(FALLBACK_MAP_TEXTURE)
      ? FALLBACK_MAP_TEXTURE
      : null;

  const art = getMapArtBounds(scene, mapTexture);
  const mapPoint = region => ({
    x: art.x + art.w * region.mapX,
    y: art.y + art.h * region.mapY,
  });

  if (mapTexture) {
    const mapImage = add(scene.add.image(
      art.x + art.w / 2,
      art.y + art.h / 2,
      mapTexture
    ).setDisplaySize(art.w, art.h).setDepth(depth + 2));

    const maskShape = scene.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(MAP.x, MAP.y, MAP.w, MAP.h);
    mapImage.setMask(maskShape.createGeometryMask());
    objects.push(maskShape);
  } else {
    add(scene.add.rectangle(
      MAP.x + MAP.w / 2,
      MAP.y + MAP.h / 2,
      MAP.w,
      MAP.h,
      0x07111d,
      1
    ).setDepth(depth + 2));

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

  // Only a tiny tint: the new artwork should be the screen, not a small inset.
  add(scene.add.rectangle(
    MAP.x + MAP.w / 2,
    MAP.y + MAP.h / 2,
    MAP.w,
    MAP.h,
    0x020812,
    0.035
  ).setDepth(depth + 2.25));

  // Stack the title vertically so it stays clear of Shinjuku.
  const stackedTitle = String(title || 'TOKYO REGION MAP')
    .trim()
    .split(/\s+/)
    .join('\n');

  add(scene.add.rectangle(
    MAP.x + 96,
    MAP.y + 82,
    148,
    126,
    0x030811,
    0.82
  ).setStrokeStyle(1, 0x315470, 0.78).setDepth(depth + 9));

  add(scene.add.text(MAP.x + 38, MAP.y + 34, stackedTitle, {
    fontFamily: PIXEL_FONT,
    fontSize: '13px',
    color: '#eefaff',
    lineSpacing: 6,
  }).setOrigin(0, 0).setDepth(depth + 10));

  const closeButton = add(scene.add.rectangle(
    MAP.x + MAP.w - 48,
    MAP.y + 42,
    64,
    42,
    0x07111d,
    0.90
  ).setStrokeStyle(1, 0x547489, 0.95)
    .setInteractive({ useHandCursor: true })
    .setDepth(depth + 10));

  add(scene.add.text(
    MAP.x + MAP.w - 48,
    MAP.y + 42,
    'X',
    {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#d8e7ef',
    }
  ).setOrigin(0.5).setDepth(depth + 11));

  // Compact lower-right region/location panel.
  const infoPanel = addPanel(scene.add.rectangle(
    INFO.x + INFO.w / 2,
    INFO.y + INFO.h / 2,
    INFO.w,
    INFO.h,
    0x06101b,
    0.94
  ).setStrokeStyle(2, 0x46d7ff, 0.92).setDepth(depth + 10));

  const regionNameText = addPanel(scene.add.text(INFO.x + 28, INFO.y + 22, '', {
    fontFamily: PIXEL_FONT,
    fontSize: '15px',
    color: '#ffffff',
  }).setDepth(depth + 12));

  const regionLineText = addPanel(scene.add.text(INFO.x + 28, INFO.y + 62, '', {
    fontFamily: BODY_FONT,
    fontSize: '11px',
    color: '#a7c0ce',
    fontStyle: '600',
    wordWrap: { width: INFO.w - 56 },
  }).setDepth(depth + 12));

  const rowStartY = INFO.y + 126;
  for (let i = 0; i < 3; i++) {
    const y = rowStartY + i * 58;

    const box = addPanel(scene.add.rectangle(
      INFO.x + INFO.w / 2,
      y,
      INFO.w - 40,
      50,
      0x0b1724,
      0.96
    ).setStrokeStyle(1, 0x315470, 1).setDepth(depth + 11));

    const label = addPanel(scene.add.text(INFO.x + 28, y, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#e4f5ff',
    }).setOrigin(0, 0.5).setDepth(depth + 12));

    const meta = addPanel(scene.add.text(INFO.x + INFO.w - 28, y, '', {
      fontFamily: BODY_FONT,
      fontSize: '10px',
      color: '#8fa8b8',
      fontStyle: '600',
    }).setOrigin(1, 0.5).setDepth(depth + 12));

    locationUi.push({ box, label, meta, location: null });
  }

  const travelButton = addPanel(scene.add.rectangle(
    INFO.x + INFO.w / 2,
    INFO.y + INFO.h - 48,
    INFO.w - 40,
    52,
    0x0d2b29,
    1
  ).setStrokeStyle(2, 0x62e8c7, 1).setDepth(depth + 11));

  const travelLabel = addPanel(scene.add.text(
    INFO.x + INFO.w / 2,
    INFO.y + INFO.h - 48,
    '',
    {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#f1fffb',
    }
  ).setOrigin(0.5).setDepth(depth + 12));

  const getTargetCost = location => {
    if (!location) return 0;

    if (location.kind === 'home') {
      return fromWorkshop ? 0 : Number(homeCost ?? HOME_RETURN_COST);
    }

    if (location.kind === 'garageUpgrade') {
      const unlocked = isWorkshopUnlocked(location.id, garageTier());
      if (!fromWorkshop && unlocked) {
        return Number(homeCost ?? HOME_RETURN_COST);
      }
      return unlocked ? 0 : Number(location.unlockCost || getWorkshopByLocationId(location.id).unlockCost || 0);
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

      if (!item.unlocked) {
        item.glow.setRadius(active ? 24 : 20)
          .setFillStyle(0x56616b, active ? 0.08 : 0.03)
          .setStrokeStyle(active ? 3 : 2, active ? 0x96a6b2 : 0x65727c, active ? 0.90 : 0.50);
        item.ring.setRadius(active ? 16 : 13)
          .setStrokeStyle(active ? 3 : 2, active ? 0xbac5cc : 0x75818a, active ? 0.95 : 0.62);
        item.core.setRadius(active ? 5 : 4).setFillStyle(0xaab4ba, active ? 0.92 : 0.70);
      } else if (active) {
        item.glow.setRadius(28)
          .setFillStyle(home ? 0x25dbff : 0xff4fbd, 0.15)
          .setStrokeStyle(3, home ? 0x5ceaff : 0xff63c5, 0.96);
        item.ring.setRadius(18).setStrokeStyle(4, 0xffffff, 1);
        item.core.setRadius(6).setFillStyle(home ? 0x60ecff : 0xff6bc9, 1);
      } else if (here) {
        item.glow.setRadius(25)
          .setFillStyle(0x35e8ff, 0.12)
          .setStrokeStyle(3, 0x55ecff, 0.9);
        item.ring.setRadius(16).setStrokeStyle(3, 0xa9f7ff, 0.95);
        item.core.setRadius(5).setFillStyle(0xcdfaff, 1);
      } else {
        item.glow.setRadius(20)
          .setFillStyle(home ? 0x168aa0 : 0x86205f, 0.04)
          .setStrokeStyle(2, home ? 0x4fa8b8 : 0x8a5274, 0.46);
        item.ring.setRadius(13)
          .setStrokeStyle(2, home ? 0x73b8c4 : 0xa66b8e, 0.64);
        item.core.setRadius(4)
          .setFillStyle(home ? 0x9dd9e4 : 0xd7a5c8, 0.80);
      }
    });
  };

  const refreshAction = location => {
    const currentCash = Number(scene.registry.get('cash') || 0);
    const cost = getTargetCost(location);
    const isCurrent = !fromWorkshop && location?.id === currentLocationId;
    const isHome = location?.kind === 'home';
    const available = locationAvailable(location) || isHome;
    const enough = currentCash >= cost;

    travelButton.removeAllListeners('pointerdown');

    if (!location) {
      travelButton.disableInteractive()
        .setFillStyle(0x111820, 1)
        .setStrokeStyle(1, 0x40515d, 1);
      travelLabel.setColor('#72838f').setText('SELECT A LOCATION');
      return;
    }

    if (location.kind === 'garageUpgrade') {
      const tier = garageTier();
      const targetTier = Number(location.garageTier || getWorkshopByLocationId(location.id).tier || 0);
      const unlocked = targetTier <= tier;
      const active = activeWorkshopId() === location.id;
      const prerequisite = Number(location.requiresTier || Math.max(0, targetTier - 1));
      const cost = unlocked ? 0 : Number(location.unlockCost || getWorkshopByLocationId(location.id).unlockCost || 0);

      travelButton.removeAllListeners('pointerdown');

      if (!fromWorkshop) {
        if (!unlocked) {
          travelButton.disableInteractive()
            .setFillStyle(0x111820, 1)
            .setStrokeStyle(1, 0x40515d, 1);
          travelLabel.setColor('#72838f').setText('GARAGE LOCKED');
          return;
        }

        const returnCost = Number(homeCost ?? HOME_RETURN_COST);
        if (currentCash < returnCost) {
          travelButton.disableInteractive()
            .setFillStyle(0x25151a, 1)
            .setStrokeStyle(2, 0x8b4f5c, 1);
          travelLabel.setColor('#c99aa4').setText('NEED ' + MONEY(returnCost));
          return;
        }

        travelButton
          .setInteractive({ useHandCursor: true })
          .setFillStyle(0x102838, 1)
          .setStrokeStyle(2, 0x55dfff, 1);

        travelLabel.setColor('#f1fffb').setText(
          'RETURN TO ' + getWorkshopByLocationId(location.id).shortLabel + ' // ' + MONEY(returnCost)
        );

        travelButton.on('pointerdown', () => {
          runHomeAction(location, returnCost);
        });
        return;
      }

      if (!unlocked && tier < prerequisite) {
        travelButton.disableInteractive()
          .setFillStyle(0x111820, 1)
          .setStrokeStyle(1, 0x40515d, 1);
        travelLabel.setColor('#72838f').setText('UNLOCK PREVIOUS WORKSHOP FIRST');
        return;
      }

      if (active) {
        travelButton.disableInteractive()
          .setFillStyle(0x10202a, 1)
          .setStrokeStyle(1, 0x4f788b, 1);
        travelLabel.setColor('#7fcfe8').setText('ACTIVE WORKSHOP');
        return;
      }

      if (!unlocked && currentCash < cost) {
        travelButton.disableInteractive()
          .setFillStyle(0x25151a, 1)
          .setStrokeStyle(2, 0x8b4f5c, 1);
        travelLabel.setColor('#c99aa4').setText('NEED ' + MONEY(cost));
        return;
      }

      travelButton
        .setInteractive({ useHandCursor: true })
        .setFillStyle(unlocked ? 0x102838 : 0x0d2b29, 1)
        .setStrokeStyle(2, unlocked ? 0x55dfff : 0x62e8c7, 1);

      travelLabel.setColor('#f1fffb').setText(
        unlocked
          ? 'USE THIS WORKSHOP'
          : 'UNLOCK // ' + MONEY(cost)
      );

      travelButton.on('pointerdown', () => {
        runWorkshopAction(location, cost, unlocked);
      });
      return;
    }

    if (!available) {
      travelButton.disableInteractive()
        .setFillStyle(0x111820, 1)
        .setStrokeStyle(1, 0x40515d, 1);
      travelLabel.setColor('#72838f').setText(
        location?.centralTokyoUnlock
          ? getCentralTokyoUnlockLabel(scene.registry, location.id)
          : 'COMING SOON'
      );
      return;
    }

    if (isHome && fromWorkshop) {
      const active = activeWorkshopId() === location.id;

      if (active) {
        travelButton.disableInteractive()
          .setFillStyle(0x10202a, 1)
          .setStrokeStyle(1, 0x4f788b, 1);
        travelLabel.setColor('#7fcfe8').setText('ACTIVE WORKSHOP');
        return;
      }

      travelButton
        .setInteractive({ useHandCursor: true })
        .setFillStyle(0x102838, 1)
        .setStrokeStyle(2, 0x55dfff, 1);
      travelLabel.setColor('#f1fffb').setText('USE HOME WORKSHOP');
      travelButton.on('pointerdown', () => {
        runWorkshopAction(location, 0, true);
      });
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
      if (isHome) {
        runHomeAction(location, cost);
        return;
      }
      dismiss();
      onTravel?.(location.id, cost);
    });
  };

  const refreshPanel = () => {
    const region = TRAVEL_REGIONS[selectedRegionId] || TRAVEL_REGIONS.ODAIBA;
    const visibleLocations =
      !fromWorkshop && region.id === HOME_REGION_ID
        ? region.locations.filter(item =>
            item.kind === 'home' ||
            (item.kind === 'garageUpgrade' && isWorkshopUnlocked(item.id, garageTier()))
          )
        : region.locations;

    if (!visibleLocations.some(item => item.id === selectedLocationId)) {
      selectedLocationId = null;
    }

    let location = visibleLocations.find(item => item.id === selectedLocationId);

    if (!location) {
      if (!fromWorkshop && selectedRegionId === currentRegionId) {
        location = visibleLocations.find(item => item.id === currentLocationId);
      }

      location = location
        || visibleLocations.find(item => item.id === activeWorkshopId())
        || visibleLocations.find(item => locationAvailable(item))
        || visibleLocations[0];

      selectedLocationId = location?.id || null;
    }

    regionNameText.setText(region.label);
    regionLineText.setText(region.description);

    locationUi.forEach((row, i) => {
      const item = visibleLocations[i] || null;
      row.location = item;

      if (!item) {
        row.box.removeAllListeners('pointerdown');
        row.box.disableInteractive().setVisible(false);
        row.label.setText('').setVisible(false);
        row.meta.setText('').setVisible(false);
        return;
      }

      row.box.setVisible(true);
      row.label.setVisible(true);
      row.meta.setVisible(true);

      const selected = selectedLocationId === item.id;
      const isCurrent = !fromWorkshop && currentLocationId === item.id;
      const cost = getTargetCost(item);
      const available = locationAvailable(item) || item.kind === 'home';
      const time = locationTimeLabel(item);

      row.label.setText(item.label);
      if (item.kind === 'garageUpgrade') {
        const unlocked = isWorkshopUnlocked(item.id, garageTier());
        const totalCapacity = getGarageCapacity(Number(item.garageTier || 0));
        row.meta.setText(
          !fromWorkshop && unlocked
            ? Number(item.capacity || 0) + ' SLOTS  •  ' + MONEY(cost)
            : (unlocked ? 'UNLOCKED' : 'UPGRADE') + '  •  +' +
              Number(item.capacity || 0) + ' SLOTS / ' + totalCapacity + ' TOTAL  •  ' +
              (unlocked ? 'OWNED' : MONEY(cost))
        );
      } else if (item.kind === 'home') {
        row.meta.setText(
          'HOME  •  4 SLOTS  •  ' +
          (fromWorkshop && activeWorkshopId() === item.id ? 'ACTIVE' : fromWorkshop ? 'OWNED' : MONEY(cost))
        );
      } else if (item.centralTokyoUnlock && !available) {
        row.meta.setText(
          item.difficulty + '  •  ' + getCentralTokyoUnlockLabel(scene.registry, item.id)
        );
      } else {
        row.meta.setText(
          item.difficulty + '  •  ' + time + '  •  ' +
          (isCurrent ? 'HERE' : MONEY(cost))
        );
      }

      row.box.removeAllListeners('pointerdown');

      if (available || item.centralTokyoUnlock) {
        row.box.setInteractive({ useHandCursor: true });
        row.box.on('pointerdown', () => {
          selectedLocationId = item.id;
          refreshPanel();
        });
      } else {
        row.box.disableInteractive();
      }

      row.box
        .setFillStyle(selected ? 0x14263a : available ? 0x0b1724 : 0x0a1017, 0.96)
        .setStrokeStyle(
          selected ? 2 : 1,
          selected ? 0x43dfff : available ? 0x315470 : 0x29343d,
          1
        );

      row.label.setColor(selected ? '#ffffff' : available ? '#dff3ff' : '#65737d');
      row.meta.setColor(available ? '#8fa8b8' : '#53616b');
    });

    const selectedLocation = visibleLocations.find(item => item.id === selectedLocationId) || null;
    refreshAction(selectedLocation);
    updateRegionNodes();
  };

  TRAVEL_REGION_ORDER.forEach(regionId => {
    const region = TRAVEL_REGIONS[regionId];
    const pt = mapPoint(region);
    const home = regionId === HOME_REGION_ID;
    const unlocked = home || region.locations.some(locationAvailable);

    const glow = add(scene.add.circle(
      pt.x,
      pt.y,
      22,
      unlocked ? (home ? 0x29dcff : 0xff4fbd) : 0x56616b,
      unlocked ? 0.05 : 0.03
    ).setStrokeStyle(
      2,
      unlocked ? (home ? 0x53dff8 : 0xff63c5) : 0x65727c,
      unlocked ? 0.45 : 0.50
    ).setDepth(depth + 5));

    const ring = add(scene.add.circle(pt.x, pt.y, 14, 0x07111d, 0.22)
      .setStrokeStyle(
        unlocked ? 3 : 2,
        unlocked ? (home ? 0x7cefff : 0xff8bd5) : 0x75818a,
        unlocked ? 0.82 : 0.62
      )
      .setDepth(depth + 6));

    const core = add(scene.add.circle(
      pt.x,
      pt.y,
      4,
      unlocked ? (home ? 0xcdfaff : 0xffb3e5) : 0xaab4ba,
      unlocked ? 0.95 : 0.70
    ).setDepth(depth + 7));

    const hit = add(scene.add.circle(pt.x, pt.y, 38, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 8));

    hit.on('pointerdown', () => {
      selectedRegionId = regionId;

      if (regionId === currentRegionId && !fromWorkshop) {
        selectedLocationId = currentLocationId;
      } else if (regionId === HOME_REGION_ID) {
        const unlockedHomeLocations = region.locations.filter(item =>
          item.kind === 'home' ||
          (item.kind === 'garageUpgrade' && isWorkshopUnlocked(item.id, garageTier()))
        );
        selectedLocationId = fromWorkshop
          ? activeWorkshopId()
          : unlockedHomeLocations.some(item => item.id === activeWorkshopId())
            ? activeWorkshopId()
            : unlockedHomeLocations[0]?.id || 'shinonomeWorkshop';
      } else {
        selectedLocationId = region.locations.find(item => locationAvailable(item))?.id
          || region.locations[0]?.id
          || null;
      }

      setPanelVisible(true);
      refreshPanel();
    });

    regionUi[regionId] = { glow, ring, core, hit, pt, unlocked };
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
  frame.on('pointerdown', (_pointer, _lx, _ly, event) => event?.stopPropagation?.());
  infoPanel.on('pointerdown', (_pointer, _lx, _ly, event) => event?.stopPropagation?.());

  scene.travelMapPopup = frame;

  // Start with the map completely unobstructed. The compact panel appears
  // only after the player taps a region.
  setPanelVisible(false);
  updateRegionNodes();

  return frame;
}
