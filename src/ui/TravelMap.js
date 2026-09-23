import {
  MEET_LOCATIONS,
  getMeetLocation,
} from '../data/meetAssets.js?v=20260922-r84';
import {
  getWorkshopByLocationId,
  getGarageCapacity,
  isWorkshopUnlocked,
} from '../data/workshopProgression.js?v=20260924-r166';
import {
  HOME_REGION_ID,
  HOME_RETURN_COST,
  TRAVEL_REGIONS,
  TRAVEL_REGION_ORDER,
  getTravelLocation,
  regionIdForMeetLocation,
  getRegionTravelCost,
  isTravelRegionUnlocked,
} from '../data/travelRegions.js?v=20260923-r139';
import {
  isCentralTokyoLocationUnlocked,
  getCentralTokyoUnlockLabel,
} from '../data/centralTokyo.js?v=20260922-r131';

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

  const visibleLocationsForRegion = region => {
    if (!region) return [];
    if (region.id !== HOME_REGION_ID) return region.locations;

    const tier = garageTier();

    // Workshop map rule: show everything already owned plus exactly the next
    // purchasable workshop. Do not tease later workshop tiers that cannot yet
    // be reached. This is identical whether the map was opened from Garage,
    // a meet, or Central Tokyo.
    return region.locations.filter(item => {
      if (item.kind === 'home') return true;
      if (item.kind !== 'garageUpgrade') return true;

      const targetTier = Number(
        item.garageTier || getWorkshopByLocationId(item.id).tier || 0
      );
      return targetTier <= tier + 1;
    });
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

  const drawRegionLabel = (item, {
    unlocked,
    active,
    specialColor = null,
  } = {}) => {
    item.labelBg.clear();
    item.labelText
      .setVisible(true)
      .setScale(active ? 1.14 : 1);

    const regularPink = 0xff57bd;
    const accent = specialColor ?? (unlocked ? regularPink : 0x9ca8b0);
    const textColor = specialColor === 0xffd600
      ? '#ffe55c'
      : specialColor === 0x35dfff
        ? '#7cefff'
        : unlocked
          ? '#ff8bd5'
          : '#aab4bb';

    const fill = specialColor === 0xffd600
      ? 0x2d2804
      : specialColor === 0x35dfff
        ? 0x062731
        : unlocked
          ? 0x2a1022
          : 0x141b21;

    item.labelText.setColor(textColor);

    // The global phone-readability pass enlarges all Phaser text, so measure
    // the final rendered text first and build the rounded box around that.
    const w = Math.max(
      specialColor ? 116 : 92,
      item.labelText.displayWidth + (active ? 34 : 28)
    );
    const h = Math.max(
      active ? 40 : 34,
      item.labelText.displayHeight + (active ? 18 : 14)
    );
    const edge = 10;

    // Prefer labels above their dial. For the two northern nodes (and any
    // future edge node), automatically flip below the dial rather than clipping
    // the label out of the map.
    const forceBelow = item.regionId === 'SHIBUYA';
    let centerY = forceBelow
      ? item.pt.y + 42 + h / 2
      : item.pt.y - 42 - h / 2;

    if (!forceBelow && centerY - h / 2 < MAP.y + edge) {
      centerY = item.pt.y + 42 + h / 2;
    }
    if (centerY + h / 2 > MAP.y + MAP.h - edge) {
      centerY = item.pt.y - 42 - h / 2;
    }

    // Clamp horizontally so future regions can sit near either map edge without
    // their name spilling off-screen.
    const minCenterX = MAP.x + edge + w / 2;
    const maxCenterX = MAP.x + MAP.w - edge - w / 2;
    const centerX = Phaser.Math.Clamp(item.pt.x, minCenterX, maxCenterX);
    const x = centerX - w / 2;
    const y = centerY - h / 2;

    item.labelBg
      .fillStyle(fill, unlocked || specialColor ? 0.94 : 0.88)
      .fillRoundedRect(x, y, w, h, 9)
      .lineStyle(
        active ? 3 : specialColor ? 2 : unlocked ? 2 : 1,
        accent,
        unlocked || specialColor ? 0.96 : 0.82
      )
      .strokeRoundedRect(x, y, w, h, 9)
      .setVisible(true);

    // Centre the actual text inside the rounded rectangle. Previously its
    // baseline was anchored to the region point, which made the text appear
    // noticeably high/left inside the box.
    item.labelText
      .setPosition(centerX, centerY)
      .setOrigin(0.5, 0.5);
  };

  const setSelectionPulse = (item, active, color) => {
    if (active) {
      item.pulse
        .setVisible(true)
        .setStrokeStyle(3, color, 0.95)
        .setScale(1)
        .setAlpha(0.92);

      if (!item.pulseActive) {
        item.pulseActive = true;
        item.pulseTween.restart();
      }
      return;
    }

    item.pulseActive = false;
    item.pulseTween.pause();
    item.pulse.setVisible(false).setScale(1).setAlpha(0);
  };

  const updateRegionNodes = () => {
    Object.entries(regionUi).forEach(([regionId, item]) => {
      const active = regionId === selectedRegionId;
      const home = regionId === HOME_REGION_ID;
      const centralTokyo = regionId === 'CENTRAL_TOKYO';
      const specialColor = centralTokyo ? 0xffd600 : home ? 0x35dfff : null;
      const regularPink = 0xff57bd;
      const accent = specialColor ?? regularPink;

      if (!item.unlocked) {
        item.hit.disableInteractive();

        // Locked places are visible discoveries, but clearly unavailable:
        // stronger grey dial + grey name, with no hover/click target.
        item.glow
          .setVisible(true)
          .setRadius(18)
          .setFillStyle(0x73808a, 0.06)
          .setStrokeStyle(2, 0x8f9aa2, 0.48);
        item.ring
          .setVisible(true)
          .setRadius(13)
          .setFillStyle(0x263039, 0.88)
          .setStrokeStyle(2, 0xa1abb2, 0.92);
        item.core
          .setVisible(true)
          .setRadius(5)
          .setFillStyle(0x9aa4ab, 0.94);

        drawRegionLabel(item, { unlocked: false, active: false });
        setSelectionPulse(item, false, 0x9aa4ab);
        return;
      }

      item.hit.setInteractive({ useHandCursor: true });
      item.glow.setVisible(true);
      item.ring.setVisible(true);
      item.core.setVisible(true);

      // All unlocked regular areas are pink all the time. Central Tokyo and
      // Shinonome retain their special yellow/blue identities.
      item.glow
        .setRadius(
          active
            ? (specialColor ? 34 : 30)
            : (specialColor ? 23 : 20)
        )
        .setFillStyle(accent, active ? 0.20 : 0.055)
        .setStrokeStyle(active ? 4 : 2, accent, active ? 1 : 0.64);
      item.ring
        .setRadius(
          active
            ? (specialColor ? 21 : 19)
            : (specialColor ? 16 : 14)
        )
        .setFillStyle(0x07111d, 0.38)
        .setStrokeStyle(active ? 5 : 3, accent, 1);
      item.core
        .setRadius(
          active
            ? (specialColor ? 9 : 8)
            : (specialColor ? 6 : 5)
        )
        .setFillStyle(accent, 1);

      item.pulse.setRadius(active ? (specialColor ? 28 : 25) : 20);

      drawRegionLabel(item, {
        unlocked: true,
        active,
        specialColor,
      });

      // Selection is communicated by an animated outer dial rather than
      // changing the unlocked colour scheme.
      setSelectionPulse(item, active, accent);
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
      const active = fromWorkshop && activeWorkshopId() === location.id;
      const prerequisite = Number(location.requiresTier || Math.max(0, targetTier - 1));
      const upgradeCost = Number(location.unlockCost || getWorkshopByLocationId(location.id).unlockCost || 0);

      travelButton.removeAllListeners('pointerdown');

      if (!unlocked && tier < prerequisite) {
        travelButton.disableInteractive()
          .setFillStyle(0x111820, 1)
          .setStrokeStyle(1, 0x40515d, 1);
        travelLabel.setColor('#72838f').setText('UNLOCK PREVIOUS WORKSHOP FIRST');
        return;
      }

      // The map is the universal workshop-upgrade surface. A locked next-tier
      // workshop can be bought from anywhere in Tokyo, not only while standing
      // inside GarageScene.
      if (!unlocked) {
        if (!onWorkshopUpgrade) {
          travelButton.disableInteractive()
            .setFillStyle(0x111820, 1)
            .setStrokeStyle(1, 0x40515d, 1);
          travelLabel.setColor('#72838f').setText('UPGRADE UNAVAILABLE');
          return;
        }

        if (currentCash < upgradeCost) {
          travelButton.disableInteractive()
            .setFillStyle(0x25151a, 1)
            .setStrokeStyle(2, 0x8b4f5c, 1);
          travelLabel.setColor('#c99aa4').setText('NEED ' + MONEY(upgradeCost));
          return;
        }

        travelButton
          .setInteractive({ useHandCursor: true })
          .setFillStyle(0x0d2b29, 1)
          .setStrokeStyle(2, 0x62e8c7, 1);
        travelLabel.setColor('#f1fffb').setText('UPGRADE WORKSHOP // ' + MONEY(upgradeCost));
        travelButton.on('pointerdown', () => {
          runWorkshopAction(location, upgradeCost, false);
        });
        return;
      }

      if (!fromWorkshop) {
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
      travelLabel.setColor('#f1fffb').setText('USE THIS WORKSHOP');
      travelButton.on('pointerdown', () => {
        runWorkshopAction(location, 0, true);
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
    const visibleLocations = visibleLocationsForRegion(region);

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
          (unlocked ? 'OWNED' : 'UPGRADE') + '  •  +' +
          Number(item.capacity || 0) + ' SLOTS / ' + totalCapacity + ' TOTAL  •  ' +
          (unlocked
            ? (!fromWorkshop ? MONEY(cost) : 'AVAILABLE')
            : MONEY(cost))
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
    const centralTokyo = regionId === 'CENTRAL_TOKYO';
    const unlocked = regionId === currentRegionId || isTravelRegionUnlocked(scene.registry, regionId);

    const glow = add(scene.add.circle(pt.x, pt.y, 20, 0x82909a, 0.04)
      .setStrokeStyle(2, 0x9aa9b4, 0.42)
      .setDepth(depth + 5));

    const ring = add(scene.add.circle(pt.x, pt.y, 13, 0x111820, 0.45)
      .setStrokeStyle(2, 0x9aa9b4, 0.82)
      .setDepth(depth + 6));

    const core = add(scene.add.circle(pt.x, pt.y, 4, 0xc0c9cf, 0.92)
      .setDepth(depth + 7));

    const labelBg = add(scene.add.graphics().setDepth(depth + 6.6));
    const labelText = add(scene.add.text(
      pt.x,
      pt.y - 54,
      region.label,
      {
        fontFamily: PIXEL_FONT,
        fontSize: home || centralTokyo ? '9px' : '8px',
        color: '#c7d1d7',
        align: 'center',
      }
    ).setOrigin(0.5).setDepth(depth + 6.8));

    const pulse = add(scene.add.circle(
      pt.x,
      pt.y,
      home || centralTokyo ? 23 : 20,
      0x000000,
      0
    ).setStrokeStyle(3, 0xff57bd, 0.95)
      .setVisible(false)
      .setDepth(depth + 7.4));

    const pulseTween = scene.tweens.add({
      targets: pulse,
      scaleX: 1.72,
      scaleY: 1.72,
      alpha: { from: 1, to: 0 },
      duration: 720,
      repeat: -1,
      ease: 'Sine.easeOut',
      paused: true,
    });
    tweens.push(pulseTween);

    const hit = add(scene.add.circle(
      pt.x,
      pt.y,
      home || centralTokyo ? 48 : 38,
      0x000000,
      0.001
    ).setDepth(depth + 8));

    hit.on('pointerdown', () => {
      selectedRegionId = regionId;

      if (regionId === currentRegionId && !fromWorkshop) {
        selectedLocationId = currentLocationId;
      } else if (regionId === HOME_REGION_ID) {
        const visibleHomeLocations = visibleLocationsForRegion(region);
        selectedLocationId = fromWorkshop
          ? activeWorkshopId()
          : visibleHomeLocations.some(item => item.id === activeWorkshopId())
            ? activeWorkshopId()
            : visibleHomeLocations[0]?.id || 'shinonomeWorkshop';
      } else {
        selectedLocationId = region.locations.find(item => locationAvailable(item))?.id
          || region.locations[0]?.id
          || null;
      }

      setPanelVisible(true);
      refreshPanel();
    });

    regionUi[regionId] = {
      glow,
      ring,
      core,
      pulse,
      pulseTween,
      pulseActive: false,
      hit,
      pt,
      regionId,
      unlocked,
      labelBg,
      labelText,
    };
  });

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
