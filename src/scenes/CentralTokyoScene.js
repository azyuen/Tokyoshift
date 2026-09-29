import { getCarBodyScaleForWidth } from '../vehicles/CarAppearance.js?v=20260929-r246';
import { cars, carOrder } from '../data/cars.js?v=20260928-r232';
import { engines } from '../data/engines.js?v=20260928-r232';
import {
  characters,
  genericRivalCharacterOrder,
  getRivalCharacterOrderForRegion,
} from '../data/characters.js?v=20260926-r213';
import {
  applyEngineTuning,
} from '../data/tuning.js?v=20260926-r211';
import {
  applySecondaryTuning,
} from '../data/secondaryTuning.js?v=20260926-r211';
import {
  DEFAULT_PAINT_COLOR,
  RIVAL_PAINT_COLORS,
  getCarBodyTextureKey,
  createCarBodyLayers,
  getCarPaintColor,
} from '../vehicles/CarAppearance.js?v=20260929-r246';
import { createDriverSilhouette } from '../vehicles/DriverSilhouette.js?v=20260923-r137';
import {
  createVisualModLayers,
  getVisualModWheelVisual,
  preloadVisualModSelectionAssets,
} from '../data/visualMods.js?v=20260929-r246';
import { getWheelPairFit, getWheelContactOffsetY } from '../vehicles/WheelFit.js?v=20260929-r258';
import { getEncounterAi } from '../data/encounterProfiles.js?v=20260921-r76';
import {
  saveSessionState,
  recordCarAcquisition,
  recordCarDeparture,
} from '../state/GameState.js?v=20260929-r246';
import { showTravelMap } from '../ui/TravelMap.js?v=20260929-r247';
import { getWorldPhase } from '../environment/WorldClock.js?v=20260929-r247';
import { getTravelLocation } from '../data/travelRegions.js?v=20260926-r211';
import {
  getGarageCapacity,
  getUnlockedWorkshops,
  getWorkshopStorageCapacity,
  getWorkshopUsage,
} from '../data/workshopProgression.js?v=20260929-r263';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20260922-r117';
import { addSettingsButton } from '../ui/SettingsPanel.js?v=20260929-r257';
import { playMangaCutscene } from '../ui/MangaCutscene.js?v=20260928-r235';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';
import { preloadCarAppearanceAssets, preloadCarWheel, ensureDerivedModularCarTextures } from '../vehicles/CarAppearance.js?v=20260929-r246';
import {
  CENTRAL_TOKYO_LOCATIONS,
  AUTO_MARKET_LISTINGS,
  GINZA_LISTINGS,
  PRO_DRAG_EVENTS,
  getAutoMarketBuild,
  getAutoMarketBasePrice,
  getNewCarState,
  getAutoMarketSellPrice,
  getGinzaCollectorState,
  isCentralTokyoLocationUnlocked,
  getCarCouponRequirement,
  getCarCouponCount,
  canRedeemCarCoupon,
  isArkonDen,
} from '../data/centralTokyo.js?v=20260929-r263';
import {
  TUNER_TEAM_INVITE_CHANCE,
  TUNER_TEAM_PITY_ARRIVALS,
  getTunerTeamChallengeState,
  isTunerTeamChallengeEligible,
} from '../data/tunerChallenges.js?v=20260926-r213';
import {
  TUNER_SHOP_ORDER,
  getTunerShopForRegion,
  isTunerShopUnlocked,
} from '../data/tunerShops.js?v=20260926-r212';
import {
  WHEEL_CATALOG,
  getWheelOption,
  getOwnedWheelIds,
  preloadWheelOption,
} from '../data/wheels.js?v=20260929-r246';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const STAGE = { x: 24, y: 92, w: 1138, h: 528 };
const SIDE = { x: 1180, y: 92, w: 356, h: 724 };
const CARDS = { x: 24, y: 636, w: 1138, h: 180 };

const LOCATION_BY_ID = Object.fromEntries(
  Object.values(CENTRAL_TOKYO_LOCATIONS).map(item => [item.id, item])
);

function money(value) {
  return '¥ ' + Number(value || 0).toLocaleString('en-US');
}

function clamp01(value) {
  return Math.max(0, Math.min(0.99, Number(value) || 0));
}

export default class CentralTokyoScene extends Phaser.Scene {
  constructor() {
    super('CentralTokyoScene');
  }

  init(data = {}) {
    this.requestedLocationId = data?.locationId || null;
    const requestedRoom = String(
      data?.autoMarketRoom || this.registry.get('autoMarketRoom') || 'used'
    );
    this.autoMarketRoom = ['new', 'used', 'wheels'].includes(requestedRoom)
      ? requestedRoom
      : 'used';
  }

  preload() {
    let queued = 0;
    const requested = this.requestedLocationId || this.registry.get('centralTokyoLocation');
    const location = LOCATION_BY_ID[requested] || CENTRAL_TOKYO_LOCATIONS.autoMarket;
    queued += this.queueLocationAssets(location);

    startSceneLoading(this, 'LOADING CENTRAL TOKYO', queued);
  }

  getLocationBackgroundConfig(location, phase = this.worldPhase || getWorldPhase()) {
    const safePhase = String(phase).toLowerCase() === 'day' ? 'day' : 'night';

    if (location?.kind === 'autoMarket') {
      const room = ['new', 'used', 'wheels'].includes(this.autoMarketRoom)
        ? this.autoMarketRoom
        : 'used';
      const roomConfig = location.marketBackgrounds?.[room];
      return roomConfig?.phases?.[safePhase] || roomConfig || {
        key: location.backgroundKey,
        path: location.backgroundPath,
      };
    }

    return location?.phaseBackgrounds?.[safePhase] || {
      key: location?.backgroundKey,
      path: location?.backgroundPath,
    };
  }

  getLocationBackgroundConfigs(location) {
    const configs = [
      this.getLocationBackgroundConfig(location, 'day'),
      this.getLocationBackgroundConfig(location, 'night'),
    ];
    const seen = new Set();
    return configs.filter(config => {
      if (!config?.key || seen.has(config.key)) return false;
      seen.add(config.key);
      return true;
    });
  }

  queueLocationAssets(location) {
    let queued = 0;

    // Load both lighting variants only for the currently visited Central Tokyo
    // location/room. This keeps transitions instant without loading every
    // Central Tokyo background at boot.
    this.getLocationBackgroundConfigs(location).forEach(background => {
      if (background?.path && background?.key && !this.textures.exists(background.key)) {
        this.load.image(background.key, background.path + '?v=20260929-r263');
        queued += 1;
      }
    });

    if (location?.kind === 'autoMarket') {
      if (this.autoMarketRoom === 'wheels') {
        const selectedCarId = this.registry.get('selectedCarId');
        const selectedCar = cars[selectedCarId];
        const selectedState = (this.registry.get('carStates') || {})[selectedCarId] || {};

        if (selectedCar) {
          queued += preloadCarAppearanceAssets(this, { [selectedCarId]: selectedCar }, '20260929-r246');
          queued += preloadCarWheel(this, selectedCar, selectedState);
          queued += preloadVisualModSelectionAssets(
            this,
            selectedCarId,
            selectedState,
            '20260929-r246'
          );
        }

        this.getWheelShopListings().forEach(option => {
          queued += preloadWheelOption(this, option, '20260929-r246');
        });
      } else {
        const listings = this.autoMarketRoom === 'new'
          ? this.getNewCarListings()
          : this.getUsedCarListings();

        listings.forEach(listing => {
          const car = cars[listing.carId];
          if (!car) return;
          queued += preloadCarAppearanceAssets(this, { [listing.carId]: car }, '20260929-r246');
          queued += preloadCarWheel(this, car, listing.previewState || {});
          queued += preloadVisualModSelectionAssets(
            this,
            listing.carId,
            listing.previewState || {},
            '20260929-r246'
          );
        });
      }
    }

    if (location?.kind === 'showroom') {
      GINZA_LISTINGS.forEach(listing => {
        const car = cars[listing.carId];
        if (!car) return;
        queued += preloadCarAppearanceAssets(this, { [listing.carId]: car }, '20260929-r246');
        queued += preloadCarWheel(this, car);
      });
    }

    if (location?.kind === 'proDrag') {
      const playerId = this.registry.get('playerCharacterId');
      const rivalIds = genericRivalCharacterOrder
        .filter(id => id !== playerId && characters[id])
        .sort((a, b) =>
          Number(characters[b]?.skill?.rating || 3) -
          Number(characters[a]?.skill?.rating || 3)
        )
        .slice(0, 3);
      new Set([...rivalIds, 'tetsuyaKanda']).forEach(id => {
        const visual = characters[id]?.visual;
        if (!visual || this.textures.exists(visual.spriteKey)) return;
        this.load.image(visual.spriteKey, visual.path + '?v=20260923-r145');
        queued += 1;
      });
    }

    return queued;
  }

  create() {
    document.body.dataset.scene = 'central-tokyo';
    this.scale.resize(1560, 840);
    playMusic('meet');

    const savedLocation =
      this.requestedLocationId ||
      this.registry.get('centralTokyoLocation') ||
      CENTRAL_TOKYO_LOCATIONS.autoMarket.id;

    this.activeLocationId = isCentralTokyoLocationUnlocked(this.registry, savedLocation)
      ? savedLocation
      : CENTRAL_TOKYO_LOCATIONS.autoMarket.id;

    if (!isCentralTokyoLocationUnlocked(this.registry, this.activeLocationId)) {
      this.activeLocationId = Object.values(CENTRAL_TOKYO_LOCATIONS)
        .find(item => isCentralTokyoLocationUnlocked(this.registry, item.id))?.id
        || CENTRAL_TOKYO_LOCATIONS.autoMarket.id;
    }

    this.registry.set('centralTokyoLocation', this.activeLocationId);

    ensureDerivedModularCarTextures(
      this,
      Object.fromEntries(
        Object.entries(cars).filter(([, car]) =>
          car?.visual?.bodyKey && this.textures.exists(car.visual.bodyKey)
        )
      )
    );

    this.contentObjects = [];
    this.selectedIndex = 0;
    this.selectedEventIndex = 0;
    this.autoMarketShowcaseActive = false;
    this.autoMarketAnimateShowcase = false;
    this.autoMarketTransitioning = false;
    this.wheelPreviewActive = false;
    this.wheelAnimatePreview = false;
    this.selectedWheelIndex = 0;
    this.ginzaShowcaseActive = false;
    this.ginzaAnimateShowcase = false;
    this.ginzaTransitioning = false;
    this.devCentralRefreshOffsets = {
      autoMarket: 0,
      showroom: 0,
      proDrag: 0,
    };
    this.worldPhase = getWorldPhase();
    this.centralBackgroundImage = null;
    this.centralBackgroundLocation = null;

    this.drawShell();
    this.renderLocation(this.activeLocationId);

    this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => this.syncWorldPhaseBackground(),
    });

    if (
      this.activeLocationId === 'tokyoAutoMarket' ||
      this.activeLocationId === 'tokyoDragComplex'
    ) {
      this.time.delayedCall(220, () => this.maybeShowTunerTeamCallout());
    }

    finishSceneLoading('CENTRAL TOKYO');
  }

  maybeShowTunerTeamCallout() {
    const candidates = TUNER_SHOP_ORDER
      .filter(regionId =>
        !isTunerShopUnlocked(this.registry, regionId) &&
        isTunerTeamChallengeEligible(this.registry, regionId)
      )
      .map(regionId => ({
        regionId,
        state: getTunerTeamChallengeState(this.registry, regionId),
        wins: Number((this.registry.get('regionWins') || {})[regionId] || 0),
      }))
      .filter(item => !item.state.invited && item.state.retryNotBefore <= Date.now())
      .sort((a, b) => b.wins - a.wins);

    if (!candidates.length) return;

    const candidate = candidates[0];
    const nextMisses = candidate.state.misses + 1;
    const chance = Math.max(0.18, TUNER_TEAM_INVITE_CHANCE - 0.08);
    const trigger =
      Math.random() < chance ||
      nextMisses >= TUNER_TEAM_PITY_ARRIVALS;

    const store = { ...(this.registry.get('tunerTeamChallenges') || {}) };
    store[candidate.regionId] = {
      ...candidate.state,
      invited: trigger,
      misses: trigger ? 0 : nextMisses,
      offeredAt: trigger ? this.activeLocationId : candidate.state.offeredAt,
    };
    this.registry.set('tunerTeamChallenges', store);
    saveSessionState(this.registry);

    if (trigger) this.showTunerTeamCallout(candidate.regionId);
  }

  showTunerTeamCallout(regionId) {
    const key = String(regionId || '').toUpperCase();
    const shop = getTunerShopForRegion(key);
    if (!shop) return;

    const regionalRivals = getRivalCharacterOrderForRegion(key);
    const npcId = characters[shop.mechanicId]
      ? shop.mechanicId
      : (regionalRivals[0] || genericRivalCharacterOrder[0] || null);
    const npcName = characters[npcId]?.name || (key + ' CREW');

    playMangaCutscene(this, 'tunerTeamCallout', {
      historyId: 'tunerTeamCallout:' + key,
      characterOverrides: {
        NPC: npcId,
      },
      variables: {
        REGION: key,
        SHOP: shop.label,
        NPC_NAME: npcName.toUpperCase(),
        NPC_SUBTITLE: (shop.label + ' // CREW CALL-OUT').toUpperCase(),
      },
      onComplete: () => {
        // Invitation state was persisted before the presentation begins.
        // Accept/skip here changes no Central Tokyo progression; the challenge
        // remains available in its home region exactly as before.
      },
    });
  }

  drawShell() {
    this.add.rectangle(780, 420, 1560, 840, 0x050a11).setDepth(-20);

    this.add.rectangle(780, 35, 1512, 62, 0x07111d, 1)
      .setStrokeStyle(2, 0x173249, 1)
      .setDepth(40);

    this.add.text(52, 35, 'CENTRAL', {
      fontFamily: PIXEL_FONT,
      fontSize: '20px',
      color: '#eefaff',
    }).setOrigin(0, 0.5).setDepth(42);

    this.locationHeader = this.add.text(340, 35, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#7edfff',
    }).setOrigin(0, 0.5).setDepth(42);

    const wins = Number(this.registry.get('wins') || 0);
    const losses = Number(this.registry.get('losses') || 0);
    const cash = Number(this.registry.get('cash') || 0);

    this.add.text(1120, 24, 'WINS  ' + wins, {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#b4ccdb',
    }).setOrigin(1, 0.5).setDepth(42);

    this.add.text(1120, 47, 'LOSSES  ' + losses, {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#b4ccdb',
    }).setOrigin(1, 0.5).setDepth(42);

    this.cashText = this.add.text(1510, 35, money(cash), {
      fontFamily: PIXEL_FONT,
      fontSize: '15px',
      color: '#ffe08a',
    }).setOrigin(1, 0.5).setDepth(42);

    addSettingsButton(this, 955, 35);

    this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x08121d,
      1
    ).setStrokeStyle(2, 0x24475f, 1).setDepth(-12);

    this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + SIDE.h / 2,
      SIDE.w,
      SIDE.h,
      0x07111d,
      0.99
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(30);

    this.add.rectangle(
      CARDS.x + CARDS.w / 2,
      CARDS.y + CARDS.h / 2,
      CARDS.w,
      CARDS.h,
      0x07111d,
      0.99
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(30);
  }

  clearContent() {
    this.contentObjects.forEach(obj => obj?.destroy?.());
    this.contentObjects = [];
  }

  addContent(obj) {
    this.contentObjects.push(obj);
    return obj;
  }

  renderLocation(locationId, assetsAttempted = false) {
    const location = LOCATION_BY_ID[locationId] || CENTRAL_TOKYO_LOCATIONS.autoMarket;

    if (!isCentralTokyoLocationUnlocked(this.registry, location.id)) {
      return;
    }

    if (!assetsAttempted) {
      const queued = this.queueLocationAssets(location);
      if (queued) {
        startSceneLoading(this, 'LOADING ' + location.label, queued);
        this.load.once('complete', () => {
          ensureDerivedModularCarTextures(
            this,
            Object.fromEntries(
              Object.entries(cars).filter(([, car]) =>
                car?.visual?.bodyKey && this.textures.exists(car.visual.bodyKey)
              )
            )
          );
          this.renderLocation(location.id, true);
          finishSceneLoading('CENTRAL TOKYO');
        });
        this.load.start();
        return;
      }
    }

    const previousLocationId = this.activeLocationId;
    if (location.kind !== 'showroom' || previousLocationId !== location.id) {
      this.ginzaShowcaseActive = false;
      this.ginzaAnimateShowcase = false;
    }
    if (location.kind !== 'autoMarket' || previousLocationId !== location.id) {
      this.autoMarketShowcaseActive = false;
      this.autoMarketAnimateShowcase = false;
      this.wheelPreviewActive = false;
      this.wheelAnimatePreview = false;
    }

    this.clearContent();
    this.activeLocationId = location.id;
    this.registry.set('centralTokyoLocation', location.id);
    saveSessionState(this.registry);

    this.updateLocationHeaderForPhase(location);
    this.drawBackground(location);

    if (location.kind === 'autoMarket') {
      this.drawAutoMarket();
      return;
    }

    if (location.kind === 'showroom') {
      this.drawGinza();
      return;
    }

    this.drawDragComplex();
  }

  updateLocationHeaderForPhase(location) {
    const marketRoomLabel = this.autoMarketRoom === 'new'
      ? 'NEW CARS'
      : this.autoMarketRoom === 'wheels'
        ? 'WHEEL SHOP'
        : 'USED CARS';
    const phaseLabel = (this.worldPhase || getWorldPhase()).toUpperCase();

    this.locationHeader?.setText(
      location?.kind === 'autoMarket'
        ? location.label + ' // ' + marketRoomLabel + ' // ' + phaseLabel
        : location.label + ' // ' + phaseLabel
    );
  }

  applyCentralBackgroundTexture(image, textureKey, location) {
    if (!image?.active || !textureKey || !this.textures.exists(textureKey)) return false;

    image.setTexture(textureKey);
    const source = this.textures.get(textureKey).getSourceImage();

    // Preserve the exact existing perspective rules: Auto Market art is
    // contained to show the full authored panel; Ginza and Drag keep the
    // original cover crop. Day/night changes only the texture.
    const scale = location?.kind === 'autoMarket'
      ? Math.min(STAGE.w / source.width, STAGE.h / source.height)
      : Math.max(STAGE.w / source.width, STAGE.h / source.height);

    image
      .setScale(scale)
      .setPosition(STAGE.x + STAGE.w / 2, STAGE.y + STAGE.h / 2);

    return true;
  }

  syncWorldPhaseBackground() {
    const nextPhase = getWorldPhase();
    if (nextPhase === this.worldPhase) return;

    this.worldPhase = nextPhase;
    const location = LOCATION_BY_ID[this.activeLocationId] || CENTRAL_TOKYO_LOCATIONS.autoMarket;
    const background = this.getLocationBackgroundConfig(location, nextPhase);
    this.updateLocationHeaderForPhase(location);

    if (
      !this.centralBackgroundImage?.active ||
      !background?.key ||
      !this.textures.exists(background.key)
    ) return;

    const image = this.centralBackgroundImage;
    this.tweens.killTweensOf(image);
    this.tweens.add({
      targets: image,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (!image?.active) return;
        this.applyCentralBackgroundTexture(image, background.key, location);
        this.tweens.add({
          targets: image,
          alpha: 1,
          duration: 260,
          ease: 'Quad.easeOut',
        });
      },
    });
  }

  drawBackground(location) {
    const background = this.getLocationBackgroundConfig(location);
    const textureKey = background?.key;

    this.addContent(this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x050b12,
      1
    ).setDepth(-11));

    if (textureKey && this.textures.exists(textureKey)) {
      const image = this.addContent(this.add.image(
        STAGE.x + STAGE.w / 2,
        STAGE.y + STAGE.h / 2,
        textureKey
      ).setDepth(-10));

      this.applyCentralBackgroundTexture(image, textureKey, location);
      this.centralBackgroundImage = image;
      this.centralBackgroundLocation = location.id;

      const maskShape = this.addContent(this.make.graphics({ add: false }));
      maskShape.fillStyle(0xffffff, 1);
      maskShape.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
      image.setMask(maskShape.createGeometryMask());
    } else {
      this.centralBackgroundImage = null;
      this.centralBackgroundLocation = null;
      this.addContent(this.add.text(
        STAGE.x + STAGE.w / 2,
        STAGE.y + STAGE.h / 2,
        'BACKGROUND READY FOR UPLOAD\n' + (background?.path || ''),
        {
          fontFamily: PIXEL_FONT,
          fontSize: '8px',
          color: '#547487',
          align: 'center',
        }
      ).setOrigin(0.5).setDepth(2));
    }

    this.addContent(this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x020812,
      location?.kind === 'autoMarket' ? 0.035 : 0.08
    ).setDepth(-8));
  }

  drawNavigation(title, subtitle) {
    this.addContent(this.add.text(SIDE.x + 20, SIDE.y + 18, title, {
      fontFamily: PIXEL_FONT,
      fontSize: '14px',
      color: '#8fe7ff',
    }).setDepth(33));

    this.addContent(this.add.text(SIDE.x + 20, SIDE.y + 54, subtitle, {
      fontFamily: BODY_FONT,
      fontSize: '10px',
      color: '#93aebd',
      fontStyle: '600',
      wordWrap: { width: SIDE.w - 40 },
    }).setDepth(33));

    // Central destinations are intentionally reached through the region map.
    // There are no shortcut buttons between Auto Market, Ginza and Drag.
    // Keep navigation as the final action in the side panel.
    const mapY = SIDE.y + 674;
    const mapButton = this.addContent(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      mapY,
      SIDE.w - 36,
      42,
      0x102138,
      1
    ).setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(33));

    this.addContent(this.add.text(
      SIDE.x + SIDE.w / 2,
      mapY,
      'GO TO MAP  >',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: '#eef8ff',
      }
    ).setOrigin(0.5).setDepth(34));

    mapButton.on('pointerdown', () => this.openMap());

    if (isArkonDen(this.registry)) {
      const location = LOCATION_BY_ID[this.activeLocationId];
      const kind = location?.kind || 'autoMarket';
      // Dev refresh stays near the header so GO TO MAP remains the bottom-most action.
      const devY = SIDE.y + 176;
      const labels = {
        autoMarket: 'DEV // REFRESH AUTO MARKET',
        showroom: 'DEV // REFRESH COLLECTORS',
        proDrag: 'DEV // REFRESH DRAG EVENTS',
      };

      const devButton = this.addContent(this.add.rectangle(
        SIDE.x + SIDE.w / 2,
        devY,
        SIDE.w - 36,
        34,
        0x261629,
        1
      ).setStrokeStyle(1, 0xd875ff, 0.95)
        .setInteractive({ useHandCursor: true })
        .setDepth(33));

      this.addContent(this.add.text(
        SIDE.x + SIDE.w / 2,
        devY,
        labels[kind] || 'DEV // REFRESH LOCATION',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: '#f0c8ff',
        }
      ).setOrigin(0.5).setDepth(34));

      devButton.on('pointerdown', () => this.devRefreshCentralLocation());
    }
  }

  devRefreshCentralLocation() {
    if (!isArkonDen(this.registry)) return;

    const location = LOCATION_BY_ID[this.activeLocationId];
    const kind = location?.kind || 'autoMarket';
    const key = kind === 'showroom' ? 'showroom' : kind === 'proDrag' ? 'proDrag' : 'autoMarket';
    const lengths = {
      autoMarket: Math.max(1, AUTO_MARKET_LISTINGS.length),
      showroom: Math.max(1, GINZA_LISTINGS.length),
      proDrag: Math.max(1, PRO_DRAG_EVENTS.length),
    };

    this.devCentralRefreshOffsets[key] =
      (Number(this.devCentralRefreshOffsets[key] || 0) + 1) % lengths[key];

    this.selectedIndex = 0;
    this.selectedEventIndex = 0;
    this.autoMarketShowcaseActive = false;
    this.autoMarketAnimateShowcase = false;
    this.wheelPreviewActive = false;
    this.wheelAnimatePreview = false;
    this.ginzaShowcaseActive = false;
    this.ginzaAnimateShowcase = false;
    this.renderLocation(this.activeLocationId);
  }

  openMap() {
    showTravelMap(this, {
      currentLocationId: this.activeLocationId,
      title: 'TOKYO REGION MAP',
      actionVerb: 'DRIVE',
      allowCurrentAction: false,
      onHome: (workshopLocationId, cost) => this.returnToWorkshop(workshopLocationId, cost),
      onWorkshopUpgrade: (location, cost, alreadyUnlocked) =>
        this.upgradeWorkshopFromMap(location, cost, alreadyUnlocked),
      onTravel: (locationId, cost) => this.travelToLocation(locationId, cost),
    });
  }

  travelToLocation(locationId, cost = 0) {
    const target = getTravelLocation(locationId);
    if (!target) return;

    const cash = Number(this.registry.get('cash') || 0);
    if (cash < Number(cost || 0)) return;

    this.registry.set('cash', cash - Number(cost || 0));
    this.cashText?.setText(money(cash - Number(cost || 0)));

    if (LOCATION_BY_ID[locationId]) {
      this.renderLocation(locationId);
      return;
    }

    this.registry.set('meetLocation', locationId);
    this.registry.set('district', target.regionId);
    saveSessionState(this.registry);
    this.scene.start('MeetScene');
  }

  upgradeWorkshopFromMap(location, cost = 0, alreadyUnlocked = false) {
    if (!location) return;

    if (alreadyUnlocked) {
      this.returnToWorkshop(location.id, 0);
      return;
    }

    const cash = Number(this.registry.get('cash') || 0);
    const price = Math.max(0, Number(cost || 0));
    if (cash < price) return;

    const targetTier = Number(location.garageTier || 0);
    const selectedCarId = this.registry.get('selectedCarId');
    const ownedCarIds = this.registry.get('ownedCarIds') || [];
    const locations = { ...(this.registry.get('carGarageLocations') || {}) };

    this.registry.set(
      'garageTier',
      Math.max(Number(this.registry.get('garageTier') || 0), targetTier)
    );
    this.registry.set('cash', cash - price);
    this.registry.set('workshopLocationId', location.id);

    // Buying a workshop is a physical move: the player arrives there in the
    // car they were driving, so store that current car at the new property.
    if (selectedCarId && ownedCarIds.includes(selectedCarId)) {
      locations[selectedCarId] = location.id;
      this.registry.set('carGarageLocations', locations);
    }

    this.registry.set('meetStranded', false);
    saveSessionState(this.registry);
    this.cashText?.setText(money(cash - price));

    try {
      sessionStorage.setItem('tokyoShiftInternalReload', '1');
      sessionStorage.setItem('tokyoShiftForceGarage', '1');
      sessionStorage.removeItem('tokyoShiftBootMessage');
    } catch (e) {}

    window.location.reload();
  }

  returnToWorkshop(workshopLocationId = 'shinonomeWorkshop', cost = 500) {
    const cash = Number(this.registry.get('cash') || 0);
    const requested = Math.max(0, Number(cost || 0));
    if (cash < requested) return;

    this.registry.set('cash', cash - requested);
    this.registry.set('workshopLocationId', workshopLocationId || 'shinonomeWorkshop');
    this.registry.set('meetStranded', false);
    saveSessionState(this.registry);

    try {
      sessionStorage.setItem('tokyoShiftInternalReload', '1');
      sessionStorage.setItem('tokyoShiftForceGarage', '1');
      sessionStorage.removeItem('tokyoShiftBootMessage');
    } catch (e) {}

    window.location.reload();
  }

  createCarDisplay(
    car,
    x,
    y,
    targetWidth,
    depth,
    paintColor = DEFAULT_PAINT_COLOR,
    driverCharacter = null,
    flipX = false,
    appearanceStateOverride = null
  ) {
    const bodyKey = getCarBodyTextureKey(this, car);
    const carState = appearanceStateOverride && typeof appearanceStateOverride === 'object'
      ? appearanceStateOverride
      : ((this.registry.get('carStates') || {})[car.id] || {});
    const wheelVisual = getVisualModWheelVisual(car, carState);

    if (
      !this.textures.exists(bodyKey) ||
      !wheelVisual?.wheelKey ||
      !this.textures.exists(wheelVisual.wheelKey)
    ) return [];

    const source = this.textures.get(bodyKey).getSourceImage();
    const wheelSource = this.textures.get(wheelVisual.wheelKey).getSourceImage();
    const bodyScale = getCarBodyScaleForWidth(this, car, targetWidth);
    const fit = getWheelPairFit(wheelVisual, bodyScale, flipX, wheelSource);
    const renderOffsetY = Number(car.visual.renderOffsetY || 0) * bodyScale;

    // Ginza hero assets are authored on slightly different vertical trims.
    // Treat the incoming y as a common presentation position and solve each
    // hero body's origin against the AE86 tyre-contact baseline at the same
    // width. This removes the up/down jump when cycling collector cars.
    let groundedBodyY = y;
    if (car.visual.singleBody && cars.ae86 && car.id !== 'ae86') {
      const reference = cars.ae86;
      const referenceBodyKey = getCarBodyTextureKey(this, reference);
      if (
        this.textures.exists(referenceBodyKey) &&
        this.textures.exists(reference.visual.wheelKey)
      ) {
        const referenceSource = this.textures.get(referenceBodyKey).getSourceImage();
        const referenceWheelSource = this.textures.get(reference.visual.wheelKey).getSourceImage();
        const referenceBodyScale = targetWidth / referenceSource.width;
        const referenceFit = getWheelPairFit(
          reference.visual,
          referenceBodyScale,
          flipX,
          referenceWheelSource
        );
        const referenceRenderOffsetY =
          Number(reference.visual.renderOffsetY || 0) * referenceBodyScale;
        const referenceRearBottom =
          referenceFit.rear.offsetY +
          getWheelContactOffsetY(referenceWheelSource, referenceFit.rear.wheelScale);
        const referenceFrontBottom =
          referenceFit.front.offsetY +
          getWheelContactOffsetY(referenceWheelSource, referenceFit.front.wheelScale);
        const targetWheelBottom =
          y +
          referenceRenderOffsetY +
          Math.max(referenceRearBottom, referenceFrontBottom);

        const rearBottomOffset =
          fit.rear.offsetY + getWheelContactOffsetY(wheelSource, fit.rear.wheelScale);
        const frontBottomOffset =
          fit.front.offsetY + getWheelContactOffsetY(wheelSource, fit.front.wheelScale);

        groundedBodyY =
          targetWheelBottom -
          renderOffsetY -
          Math.max(rearBottomOffset, frontBottomOffset);
      }
    }

    const displayY = groundedBodyY + renderOffsetY;

    const rearX = x + fit.rear.offsetX;
    const frontX = x + fit.front.offsetX;
    const rearY = displayY + fit.rear.offsetY;
    const frontY = displayY + fit.front.offsetY;

    const rearWheel = this.add.image(rearX, rearY, wheelVisual.wheelKey)
      .setScale(fit.rear.wheelScale)
      .setFlipX(flipX)
      .setData('carWheel', true)
      .setDepth(depth);
    const frontWheel = this.add.image(frontX, frontY, wheelVisual.wheelKey)
      .setScale(fit.front.wheelScale)
      .setFlipX(flipX)
      .setData('carWheel', true)
      .setDepth(depth);

    const rearBacking = this.add.circle(
      rearX,
      rearY,
      fit.rear.backingRadius ?? Math.max(5, rearWheel.displayWidth * 0.50),
      0x020304,
      1
    ).setDepth(depth - 0.2);
    const frontBacking = this.add.circle(
      frontX,
      frontY,
      fit.front.backingRadius ?? Math.max(5, frontWheel.displayWidth * 0.50),
      0x020304,
      1
    ).setDepth(depth - 0.2);

    const tyreBottom = Math.max(
      rearY + getWheelContactOffsetY(wheelSource, fit.rear.wheelScale),
      frontY + getWheelContactOffsetY(wheelSource, fit.front.wheelScale)
    );
    const shadowHeight = Math.max(
      26,
      Math.max(rearWheel.displayHeight, frontWheel.displayHeight) * 0.36
    );
    const shadow = this.add.ellipse(
      x,
      tyreBottom + shadowHeight / 6,
      targetWidth * 0.92,
      shadowHeight,
      0x000000,
      0.72
    ).setDepth(depth - 0.1);
    const driver = driverCharacter
      ? createDriverSilhouette(this, car, driverCharacter, {
          bodyX: x,
          bodyY: displayY,
          bodyScale,
          depth: depth + 0.55,
        })
      : null;

    const bodyLayers = createCarBodyLayers(this, car, {
      x,
      y: displayY,
      scale: bodyScale,
      depth: depth + 1,
      flipX,
      paintColor,
    });

    const visualModObjects = createVisualModLayers(this, car, carState, {
      x,
      y: displayY,
      scale: bodyScale,
      depth: depth + 1.005,
      paintColor,
      bodyLayers,
      flipX,
    });

    return [
      rearBacking,
      frontBacking,
      shadow,
      rearWheel,
      frontWheel,
      ...(driver?.image ? [driver.image] : []),
      ...bodyLayers.objects,
      ...visualModObjects,
    ];
  }

  getAutoMarketCycle() {
    return Math.floor(Date.now() / (3 * 60 * 60 * 1000));
  }

  marketHash(value) {
    const text = String(value || '');
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  rotateMarketPool(pool = [], salt = 0) {
    if (!pool.length) return [];
    const cycle = this.getAutoMarketCycle();
    const dev = Number(this.devCentralRefreshOffsets?.autoMarket || 0);
    const offset = (cycle * 3 + salt + dev) % pool.length;
    return [...pool.slice(offset), ...pool.slice(0, offset)];
  }

  getNewCarListings() {
    const owned = new Set(this.registry.get('ownedCarIds') || []);
    const pool = AUTO_MARKET_LISTINGS.filter(item => cars[item.carId]);
    const rotated = this.rotateMarketPool(pool, 0);
    const claimable = rotated.filter(item =>
      !owned.has(item.carId) && canRedeemCarCoupon(this.registry, item.carId)
    );
    const unowned = rotated.filter(item =>
      !owned.has(item.carId) && !claimable.includes(item)
    );
    const alreadyOwned = rotated.filter(item => owned.has(item.carId));
    const neutrals = [0xffffff, 0x30343a, 0x8d939a];

    return [...claimable, ...unowned, ...alreadyOwned]
      .slice(0, 3)
      .map(item => {
        const paintColor = neutrals[
          this.marketHash(this.getAutoMarketCycle() + ':' + item.carId + ':new') % neutrals.length
        ];
        const price = getAutoMarketBasePrice(item.carId);
        return {
          ...item,
          marketType: 'new',
          buildLabel: 'FACTORY STOCK',
          price,
          listPrice: price,
          paintColor,
          previewState: getNewCarState(item.carId, paintColor),
          conditionLabel: 'NEW // FACTORY STOCK',
        };
      });
  }

  getHaggleRecord(key) {
    return (this.registry.get('autoMarketHaggles') || {})[String(key || '')] || null;
  }

  getUsedCarListings() {
    const owned = new Set(this.registry.get('ownedCarIds') || []);
    const pool = AUTO_MARKET_LISTINGS.filter(item => cars[item.carId]);
    const rotated = this.rotateMarketPool(pool, 7);
    const unowned = rotated.filter(item => !owned.has(item.carId));
    const alreadyOwned = rotated.filter(item => owned.has(item.carId));
    const colours = [...RIVAL_PAINT_COLORS, 0xffffff, 0x25292f, 0xa3a8ad];
    const conditionLabels = [
      'CLEAN STREET CAR',
      'WEEKEND BUILD',
      'SHOP DEMO',
      'ONE OWNER',
      'STREET TUNED',
      'QUICK SALE',
    ];

    return [...unowned, ...alreadyOwned]
      .slice(0, 3)
      .map((item, index) => {
        const cycle = this.getAutoMarketCycle();
        const seed = this.marketHash(cycle + ':' + item.carId + ':used');
        const isDeal = ((cycle + index + (seed % 3)) % 7) === 0;
        const percent = isDeal
          ? 74 + ((seed >>> 8) % 9)
          : 88 + ((seed >>> 8) % 23);
        const listPrice = Math.max(
          100000,
          Math.round(
            (Number(item.price || getAutoMarketBasePrice(item.carId)) * percent / 100) / 10000
          ) * 10000
        );
        const paintColor = colours[seed % colours.length];
        const kitRoll = (seed >>> 16) % 4;
        const visualMods = kitRoll === 0
          ? { bodyKit: 'stock' }
          : { bodyKit: kitRoll % 2 ? 'bodykit1' : 'bodykit2' };
        const previewState = {
          ...getAutoMarketBuild(item.carId),
          paintColor,
          visualMods,
          acquiredVia: 'tokyoAutoMarketUsed',
        };
        const haggleKey = cycle + ':' + item.carId;
        const haggle = this.getHaggleRecord(haggleKey);

        return {
          ...item,
          marketType: 'used',
          listPrice,
          price: Math.max(0, Number(haggle?.price || listPrice)),
          paintColor,
          previewState,
          haggleKey,
          haggle,
          isDeal,
          conditionLabel: isDeal
            ? 'QUICK SALE // GOOD DEAL'
            : conditionLabels[(seed >>> 12) % conditionLabels.length],
        };
      });
  }

  getAutoMarketListings() {
    return this.autoMarketRoom === 'new'
      ? this.getNewCarListings()
      : this.getUsedCarListings();
  }

  getWheelShopListings() {
    const pool = WHEEL_CATALOG.filter(Boolean);
    if (pool.length <= 10) return [...pool];
    const cycle = this.getAutoMarketCycle();
    const dev = Number(this.devCentralRefreshOffsets?.autoMarket || 0);
    const offset = (cycle * 5 + dev) % pool.length;
    return [...pool.slice(offset), ...pool.slice(0, offset)].slice(0, 10);
  }

  drawAutoMarketRoomTabs() {
    const tabs = [
      { id: 'new', label: 'NEW' },
      { id: 'used', label: 'USED' },
      { id: 'wheels', label: 'WHEELS' },
    ];
    const startX = SIDE.x + 26;
    const width = 96;
    const gap = 8;
    const y = SIDE.y + 128;

    tabs.forEach((tab, index) => {
      const active = tab.id === this.autoMarketRoom;
      const x = startX + width / 2 + index * (width + gap);
      const box = this.addContent(this.add.rectangle(
        x, y, width, 38, active ? 0x123047 : 0x0c1823, 1
      ).setStrokeStyle(
        active ? 2 : 1,
        active ? 0x43dfff : 0x315470,
        1
      ).setDepth(35).setInteractive({ useHandCursor: true }));

      this.addContent(this.add.text(x, y, tab.label, {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: active ? '#ffffff' : '#95adbb',
      }).setOrigin(0.5).setDepth(36));

      box.on('pointerdown', () => this.selectAutoMarketRoom(tab.id));
    });
  }

  selectAutoMarketRoom(room) {
    if (!['new', 'used', 'wheels'].includes(room)) return;
    if (this.autoMarketTransitioning) return;

    this.autoMarketRoom = room;
    this.registry.set('autoMarketRoom', room);
    this.selectedIndex = 0;
    this.selectedWheelIndex = 0;
    this.autoMarketShowcaseActive = false;
    this.autoMarketAnimateShowcase = false;
    this.wheelPreviewActive = false;
    this.wheelAnimatePreview = false;
    saveSessionState(this.registry);
    this.renderLocation(this.activeLocationId);
  }

  drawAutoMarket() {
    const subtitles = {
      new: 'FACTORY STOCK // STANDARD PRICE // WHITE · BLACK · GREY',
      used: 'MODIFIED CARS // MIXED PRICES // ONE OFFER PER LISTING',
      wheels: 'CUSTOM RIMS // STANDARD · TUNER · HERO // TRY BEFORE YOU BUY',
    };

    this.drawNavigation('TOKYO AUTO MARKET', subtitles[this.autoMarketRoom]);
    this.drawAutoMarketRoomTabs();

    if (this.autoMarketRoom === 'wheels') {
      this.drawWheelShop();
      return;
    }

    this.drawMarketCarRoom(this.autoMarketRoom);
  }

  getMarketBayPoses() {
    return [
      { x: STAGE.x + STAGE.w * 0.22, y: STAGE.y + 288, w: 255, depth: 9, flip: false },
      { x: STAGE.x + STAGE.w * 0.50, y: STAGE.y + 288, w: 255, depth: 10, flip: false },
      { x: STAGE.x + STAGE.w * 0.78, y: STAGE.y + 288, w: 255, depth: 9, flip: false },
    ];
  }

  drawMarketCarRoom(room) {
    const listings = room === 'new' ? this.getNewCarListings() : this.getUsedCarListings();
    if (!listings.length) return;

    this.selectedIndex = Phaser.Math.Clamp(this.selectedIndex, 0, listings.length - 1);
    const poses = this.getMarketBayPoses();

    listings.forEach((listing, index) => {
      if (this.autoMarketShowcaseActive && index === this.selectedIndex) return;

      const car = cars[listing.carId];
      const pose = poses[index];
      const objects = this.createCarDisplay(
        car,
        pose.x,
        pose.y,
        pose.w,
        pose.depth,
        listing.paintColor,
        null,
        pose.flip,
        listing.previewState
      );
      objects.forEach(obj => this.addContent(obj));

      const hit = this.addContent(this.add.rectangle(
        pose.x,
        pose.y,
        pose.w,
        Math.max(104, pose.w * 0.38),
        0x000000,
        0.001
      ).setDepth(31).setInteractive({ useHandCursor: true }));
      hit.on('pointerdown', () => this.transitionAutoMarketCar(index));
    });

    if (this.autoMarketShowcaseActive) {
      const listing = listings[this.selectedIndex];
      const car = cars[listing.carId];
      const objects = this.createCarDisplay(
        car,
        STAGE.x + STAGE.w * 0.52,
        STAGE.y + 386,
        650,
        16,
        listing.paintColor,
        null,
        false,
        listing.previewState
      );
      objects.forEach(obj => this.addContent(obj));

      if (this.autoMarketAnimateShowcase) {
        this.autoMarketAnimateShowcase = false;
        this.animateMarketCarIn(objects);
      }

      const dismiss = this.addContent(this.add.text(
        STAGE.x + STAGE.w - 22,
        STAGE.y + 22,
        '×  BACK TO ' + (room === 'new' ? 'NEW CARS' : 'USED CARS'),
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: '#e4f2f8',
          backgroundColor: '#07111bdd',
          padding: { x: 11, y: 8 },
        }
      ).setOrigin(1, 0).setDepth(42).setInteractive({ useHandCursor: true }));
      dismiss.on('pointerdown', () => this.transitionAutoMarketCar(null));
    }

    this.addContent(this.add.text(
      CARDS.x + 18,
      CARDS.y + 14,
      (room === 'new' ? 'NEW CARS' : 'USED CARS') + ' // 3 AVAILABLE // ROTATES 3H',
      { fontFamily: PIXEL_FONT, fontSize: '10px', color: '#8fe7ff' }
    ).setDepth(33));

    listings.forEach((listing, index) => {
      const car = cars[listing.carId];
      const x = CARDS.x + 190 + index * 365;
      const selected = this.autoMarketShowcaseActive && index === this.selectedIndex;
      const owned = (this.registry.get('ownedCarIds') || []).includes(listing.carId);
      const box = this.addContent(this.add.rectangle(
        x,
        CARDS.y + 104,
        340,
        116,
        selected ? 0x123047 : 0x0b1724,
        1
      ).setStrokeStyle(selected ? 2 : 1, selected ? 0x43dfff : 0x315470, 1)
        .setInteractive({ useHandCursor: true }).setDepth(32));

      this.addContent(this.add.text(x - 145, CARDS.y + 70, car.shortName, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#ffffff',
      }).setDepth(34));

      this.addContent(this.add.text(
        x - 145,
        CARDS.y + 98,
        room === 'new' ? 'FACTORY STOCK' : listing.conditionLabel,
        {
          fontFamily: BODY_FONT,
          fontSize: '9px',
          color: room === 'used' && listing.isDeal ? '#83efc8' : '#91a9b8',
          fontStyle: '600',
        }
      ).setDepth(34));

      this.addContent(this.add.text(
        x + 145,
        CARDS.y + 126,
        owned ? 'OWNED' : money(listing.price),
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: owned ? '#62e8c7' : '#ffe08a',
        }
      ).setOrigin(1, 0.5).setDepth(34));

      box.on('pointerdown', () => this.transitionAutoMarketCar(index));
    });

    this.drawAutoMarketSide(listings[this.selectedIndex], room);
  }

  animateMarketCarIn(objects = []) {
    const movable = objects.filter(obj =>
      obj && typeof obj.x === 'number' && typeof obj.setPosition === 'function'
    );

    movable.forEach(obj => {
      const targetX = obj.x;
      obj.x = targetX - 620;
      obj.setAlpha?.(1);
      this.tweens.add({ targets: obj, x: targetX, duration: 1500, ease: 'Sine.easeOut' });

      if (obj.getData?.('carWheel')) {
        this.tweens.add({
          targets: obj,
          angle: obj.angle + 620,
          duration: 1500,
          ease: 'Sine.easeOut',
        });
      }
    });
  }

  transitionAutoMarketCar(nextIndex = null) {
    if (this.autoMarketTransitioning) return;
    this.autoMarketTransitioning = true;

    const fade = this.add.rectangle(780, 420, 1560, 840, 0x020307, 0)
      .setDepth(180).setInteractive();

    this.tweens.add({
      targets: fade,
      alpha: 0.97,
      duration: 210,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (nextIndex === null) {
          this.autoMarketShowcaseActive = false;
          this.autoMarketAnimateShowcase = false;
        } else {
          this.selectedIndex = nextIndex;
          this.autoMarketShowcaseActive = true;
          this.autoMarketAnimateShowcase = true;
        }

        this.renderLocation(this.activeLocationId);

        this.tweens.add({
          targets: fade,
          alpha: 0,
          duration: 280,
          ease: 'Quad.easeOut',
          onComplete: () => {
            fade.destroy();
            this.autoMarketTransitioning = false;
          },
        });
      },
    });
  }

  drawAutoMarketSide(listing, room) {
    const car = cars[listing.carId];
    const displaySpec = (() => {
      if (room !== 'used') return car;
      const engineBuild = applyEngineTuning(
        car,
        engines[car.engine],
        listing.previewState || {}
      );
      return applySecondaryTuning(
        engineBuild.car,
        engineBuild.engine,
        listing.previewState || {}
      ).car;
    })();
    const owned = (this.registry.get('ownedCarIds') || []).includes(listing.carId);
    const cash = Number(this.registry.get('cash') || 0);
    const capacity = getGarageCapacity(this.registry.get('garageTier') || 0);
    const ownedCount = (this.registry.get('ownedCarIds') || []).length;
    const hasStorage = Boolean(this.findStorageForPurchase());

    const couponRequired = getCarCouponRequirement(listing.carId);
    const couponCount = getCarCouponCount(this.registry, listing.carId);
    const couponReady = room === 'new' && canRedeemCarCoupon(this.registry, listing.carId);
    const canBuyWithCash = !owned && cash >= listing.price && ownedCount < capacity && hasStorage;
    const canClaimWithCoupons = !owned && couponReady && ownedCount < capacity && hasStorage;
    const canBuy = canBuyWithCash || canClaimWithCoupons;

    const y0 = SIDE.y + 224;

    this.addContent(this.add.text(
      SIDE.x + 20,
      y0,
      room === 'new' ? 'NEW CAR // FACTORY STOCK' : 'USED CAR // ' + listing.conditionLabel,
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: room === 'used' && listing.isDeal ? '#62e8c7' : '#8cc8ec',
        wordWrap: { width: SIDE.w - 40 },
      }
    ).setDepth(34));

    this.addContent(this.add.text(SIDE.x + 20, y0 + 38, car.name.toUpperCase(), {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#ffffff',
      wordWrap: { width: SIDE.w - 40 },
    }).setDepth(34));

    this.addContent(this.add.text(
      SIDE.x + 20,
      y0 + 84,
      (room === 'new' ? 'STOCK SPEC' : listing.buildLabel) + '\n' +
      car.engineModel + '\n' +
      Math.round(displaySpec.powerKW) + ' kW  //  ' +
      Math.round(displaySpec.torqueNm) + ' Nm\n' +
      Math.round(displaySpec.vehicleMassKg) + ' kg',
      {
        fontFamily: BODY_FONT,
        fontSize: '10px',
        color: '#9ab0bd',
        fontStyle: '600',
        lineSpacing: 3,
        wordWrap: { width: SIDE.w - 40 },
      }
    ).setDepth(34));

    this.addContent(this.add.text(
      SIDE.x + 20,
      y0 + 172,
      (room === 'new' ? 'STANDARD PRICE  ' : 'ASKING  ') + money(listing.price),
      { fontFamily: PIXEL_FONT, fontSize: '9px', color: '#ffe08a' }
    ).setDepth(34));

    if (room === 'new') {
      this.addContent(this.add.text(
        SIDE.x + 20,
        y0 + 208,
        'CAR COUPONS  ' + couponCount + ' / ' + couponRequired +
          (couponReady ? '  //  READY' : ''),
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: couponReady ? '#62e8c7' : '#8cc8ec',
        }
      ).setDepth(34));
    } else {
      const haggle = listing.haggle;
      const haggleText = haggle
        ? haggle.status === 'accepted'
          ? 'OFFER ACCEPTED // ' + money(haggle.price)
          : haggle.status === 'countered'
            ? 'SELLER COUNTER // ' + money(haggle.price)
            : 'OFFER REJECTED // PRICE FIRM'
        : 'ONE BARGAIN ATTEMPT AVAILABLE';

      this.addContent(this.add.text(
        SIDE.x + 20,
        y0 + 208,
        haggleText,
        {
          fontFamily: PIXEL_FONT,
          fontSize: '6px',
          color: haggle?.status === 'rejected' ? '#ff9aa8' : '#83efc8',
          wordWrap: { width: SIDE.w - 40 },
        }
      ).setDepth(34));

      const offerAvailable = !owned && !haggle;
      const offerButton = this.addContent(this.add.rectangle(
        SIDE.x + SIDE.w / 2,
        SIDE.y + 488,
        SIDE.w - 36,
        40,
        offerAvailable ? 0x1f2435 : 0x17181d,
        1
      ).setStrokeStyle(1, offerAvailable ? 0xa58cff : 0x514f55, 1).setDepth(33));

      this.addContent(this.add.text(
        SIDE.x + SIDE.w / 2,
        SIDE.y + 488,
        offerAvailable ? 'MAKE OFFER' : haggle ? 'BARGAIN USED' : 'NO OFFER',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: offerAvailable ? '#e8ddff' : '#817d84',
        }
      ).setOrigin(0.5).setDepth(34));

      if (offerAvailable) {
        offerButton.setInteractive({ useHandCursor: true });
        offerButton.on('pointerdown', () => this.showHaggleDialog(listing));
      }

      this.drawUsedSellButton();
    }

    const buyButton = this.addContent(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 608,
      SIDE.w - 36,
      48,
      canBuy ? 0x0d2b29 : 0x17181d,
      1
    ).setStrokeStyle(2, canBuy ? 0x62e8c7 : 0x514f55, 1).setDepth(33));

    const buyLabel = owned
      ? 'ALREADY OWNED'
      : !hasStorage || ownedCount >= capacity
        ? 'GARAGE FULL'
        : canClaimWithCoupons
          ? 'CLAIM // ' + couponRequired + ' COUPONS'
          : cash < listing.price
            ? 'NEED ' + money(listing.price)
            : 'BUY // ' + money(listing.price);

    this.addContent(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 608,
      buyLabel,
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: canBuy ? '#f1fffb' : '#817d84',
      }
    ).setOrigin(0.5).setDepth(34));

    if (canBuy) {
      buyButton.setInteractive({ useHandCursor: true });
      buyButton.on('pointerdown', () => {
        const carName = car?.shortName || car?.name || 'this car';
        const useCoupons = canClaimWithCoupons;
        this.showTransactionConfirm({
          title: useCoupons ? 'CONFIRM CLAIM' : 'CONFIRM PURCHASE',
          message: useCoupons
            ? 'Claim ' + carName + ' using ' + couponRequired + ' car coupons?'
            : 'Buy ' + carName + ' for ' + money(listing.price) + '?',
          confirmLabel: useCoupons ? 'CLAIM CAR' : 'BUY CAR',
          accent: 0x62e8c7,
          onConfirm: () => this.buyAutoMarketCar(listing),
        });
      });
    }
  }

  drawUsedSellButton() {
    const selectedCarId = this.registry.get('selectedCarId');
    const ownedCars = this.registry.get('ownedCarIds') || [];
    const selectedCar = cars[selectedCarId];
    const selectedState = (this.registry.get('carStates') || {})[selectedCarId] || {};
    const collectorLocked = Boolean(
      selectedCar?.tuningLocked || selectedState.collector || selectedState.immutable
    );
    const starterOnly = Boolean(
      ownedCars.length === 1 &&
      selectedCarId &&
      selectedCarId === this.registry.get('starterCarId')
    );
    const canSell = Boolean(
      selectedCarId && selectedCar && ownedCars.length > 1 && !collectorLocked
    );
    const sellPrice = canSell ? getAutoMarketSellPrice(selectedCarId, selectedState) : 0;

    const sellButton = this.addContent(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 548,
      SIDE.w - 36,
      40,
      canSell ? 0x261922 : 0x17181d,
      1
    ).setStrokeStyle(1, canSell ? 0xff7cac : 0x514f55, 1).setDepth(33));

    this.addContent(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 548,
      canSell
        ? 'SELL ' + selectedCar.shortName + ' // ' + money(sellPrice)
        : collectorLocked
          ? 'COLLECTOR CAR NOT TRADED'
          : starterOnly
            ? 'ONLY CAR // NOT FOR SALE'
            : 'KEEP AT LEAST ONE CAR',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: canSell ? '#ffc0d7' : '#817d84',
      }
    ).setOrigin(0.5).setDepth(34));

    if (canSell) {
      sellButton.setInteractive({ useHandCursor: true });
      sellButton.on('pointerdown', () => {
        const carName = selectedCar.shortName || selectedCar.name || 'this car';
        this.showTransactionConfirm({
          title: 'CONFIRM SALE',
          message: 'Sell ' + carName + ' for ' + money(sellPrice) +
            '?\n\nPurchased wheel designs remain in your wheel collection.',
          confirmLabel: 'SELL CAR',
          accent: 0xff7cac,
          onConfirm: () => this.sellSelectedCar(selectedCarId, sellPrice),
        });
      });
    }
  }

  showHaggleDialog(listing) {
    if (!listing?.haggleKey || this.getHaggleRecord(listing.haggleKey)) return;
    if (this.transactionConfirmOpen) return;
    this.transactionConfirmOpen = true;

    const depth = 245;
    const objects = [];
    const add = obj => {
      objects.push(obj);
      return obj;
    };
    const close = () => {
      objects.forEach(obj => obj?.destroy?.());
      this.transactionConfirmOpen = false;
    };

    add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.82)
      .setDepth(depth).setInteractive());
    add(this.add.rectangle(780, 420, 760, 390, 0x09131d, 1)
      .setStrokeStyle(3, 0xa58cff, 0.95).setDepth(depth + 1));
    add(this.add.text(780, 292, 'MAKE AN OFFER', {
      fontFamily: PIXEL_FONT,
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(depth + 2));
    add(this.add.text(
      780,
      342,
      cars[listing.carId].shortName + ' // ASKING ' + money(listing.listPrice) +
        '\nOne attempt. A rejected offer makes the listed price firm.',
      {
        fontFamily: BODY_FONT,
        fontSize: '13px',
        color: '#bfd0da',
        fontStyle: '600',
        align: 'center',
        lineSpacing: 5,
      }
    ).setOrigin(0.5).setDepth(depth + 2));

    const offers = [
      { label: 'SAFE  -5%', discount: 0.05, accept: 0.80, counter: 0.15 },
      { label: 'PUSH  -10%', discount: 0.10, accept: 0.48, counter: 0.35 },
      { label: 'LOWBALL  -15%', discount: 0.15, accept: 0.22, counter: 0.38 },
    ];

    offers.forEach((offer, index) => {
      const x = 545 + index * 235;
      const button = add(this.add.rectangle(
        x, 462, 205, 64, 0x151d2c, 1
      ).setStrokeStyle(
        2,
        index === 0 ? 0x62e8c7 : index === 1 ? 0xffd06a : 0xff7cac,
        1
      ).setDepth(depth + 2).setInteractive({ useHandCursor: true }));

      add(this.add.text(x, 462, offer.label, {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(depth + 3));

      button.on('pointerdown', () => {
        const roll = Math.random();
        let status = 'rejected';
        let finalPrice = listing.listPrice;

        if (roll < offer.accept) {
          status = 'accepted';
          finalPrice = Math.round(
            listing.listPrice * (1 - offer.discount) / 10000
          ) * 10000;
        } else if (roll < offer.accept + offer.counter) {
          status = 'countered';
          finalPrice = Math.round(
            listing.listPrice * (1 - offer.discount * 0.5) / 10000
          ) * 10000;
        }

        const current = { ...(this.registry.get('autoMarketHaggles') || {}) };
        current[listing.haggleKey] = {
          status,
          price: finalPrice,
          attemptedAt: Date.now(),
        };

        const entries = Object.entries(current)
          .sort((a, b) =>
            Number(b[1]?.attemptedAt || 0) - Number(a[1]?.attemptedAt || 0)
          )
          .slice(0, 18);
        this.registry.set('autoMarketHaggles', Object.fromEntries(entries));
        saveSessionState(this.registry);
        close();
        this.renderLocation(this.activeLocationId);

        const title = status === 'accepted'
          ? 'OFFER ACCEPTED'
          : status === 'countered'
            ? 'COUNTER OFFER'
            : 'OFFER REJECTED';
        const message = status === 'rejected'
          ? 'Seller stays at ' + money(listing.listPrice) + '. The price is now firm.'
          : 'New price: ' + money(finalPrice);

        this.showTransactionConfirm({
          title,
          message,
          confirmLabel: 'OK',
          accent: status === 'rejected' ? 0xff7cac : 0x62e8c7,
          onConfirm: () => {},
        });
      });
    });

    const cancel = add(this.add.text(780, 548, 'CANCEL', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#9fb0ba',
      backgroundColor: '#121820',
      padding: { x: 18, y: 9 },
    }).setOrigin(0.5).setDepth(depth + 3).setInteractive({ useHandCursor: true }));
    cancel.on('pointerdown', close);
  }

  drawWheelShop() {
    const listings = this.getWheelShopListings();
    const selectedCarId = this.registry.get('selectedCarId');
    const car = cars[selectedCarId];
    const carState = (this.registry.get('carStates') || {})[selectedCarId] || {};
    const locked = Boolean(car?.tuningLocked || carState.collector || carState.immutable);

    if (!car) {
      this.addContent(this.add.text(
        STAGE.x + STAGE.w / 2,
        STAGE.y + STAGE.h / 2,
        'NO CAR SELECTED',
        { fontFamily: PIXEL_FONT, fontSize: '13px', color: '#8aa0ad' }
      ).setOrigin(0.5).setDepth(20));
      return;
    }

    this.selectedWheelIndex = Phaser.Math.Clamp(
      this.selectedWheelIndex,
      0,
      Math.max(0, listings.length - 1)
    );

    if (this.wheelPreviewActive && listings.length) {
      const option = listings[this.selectedWheelIndex];
      const previewState = { ...carState, customWheelId: option.id };
      const carObjects = this.createCarDisplay(
        car,
        STAGE.x + STAGE.w * 0.52,
        STAGE.y + 388,
        660,
        16,
        getCarPaintColor(carState),
        null,
        false,
        previewState
      );
      carObjects.forEach(obj => this.addContent(obj));

      if (this.wheelAnimatePreview) {
        this.wheelAnimatePreview = false;
        this.animateMarketCarIn(carObjects);
      }

      const back = this.addContent(this.add.text(
        STAGE.x + STAGE.w - 22,
        STAGE.y + 22,
        '×  BACK TO WHEEL WALL',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: '#e4f2f8',
          backgroundColor: '#07111bdd',
          padding: { x: 11, y: 8 },
        }
      ).setOrigin(1, 0).setDepth(42).setInteractive({ useHandCursor: true }));
      back.on('pointerdown', () => this.transitionWheelPreview(null));
    } else {
      // These centres correspond to the ten illustrated display boxes in the
      // authored wheel-shop background: five across, two rows. Keep the wall
      // visually clean; item name/price appears only after selection.
      const wheelSlots = [
        [0.115, 0.205], [0.307, 0.205], [0.500, 0.205], [0.693, 0.205], [0.885, 0.205],
        [0.115, 0.485], [0.307, 0.485], [0.500, 0.485], [0.693, 0.485], [0.885, 0.485],
      ];

      listings.forEach((option, index) => {
        const slot = wheelSlots[index] || [0.5, 0.35];
        const x = STAGE.x + STAGE.w * slot[0];
        const y = STAGE.y + STAGE.h * slot[1];
        const wheel = this.addContent(this.add.image(
          x, y, option.textureKey
        ).setDisplaySize(104, 104).setDepth(18).setInteractive({ useHandCursor: true }));

        wheel.on('pointerover', () => wheel.setScale(wheel.scaleX * 1.06));
        wheel.on('pointerout', () => wheel.setDisplaySize(104, 104));
        wheel.on('pointerdown', () => this.transitionWheelPreview(index));
      });
    }

    this.addContent(this.add.text(
      CARDS.x + 18,
      CARDS.y + 16,
      'WHEEL WALL // 10 AVAILABLE // ROTATES 3H',
      { fontFamily: PIXEL_FONT, fontSize: '10px', color: '#8fe7ff' }
    ).setDepth(33));

    this.addContent(this.add.text(
      CARDS.x + 18,
      CARDS.y + 58,
      'STANDARD  •  TUNER SHOP  •  HERO CAR\n' +
      'Tap a wheel to fade into a live preview on your current car.',
      {
        fontFamily: BODY_FONT,
        fontSize: '11px',
        color: '#9ab0bd',
        fontStyle: '600',
        lineSpacing: 5,
      }
    ).setDepth(33));

    this.addContent(this.add.text(
      CARDS.x + 18,
      CARDS.y + 126,
      'CURRENT CAR  //  ' + car.shortName +
        (locked ? '  //  COLLECTOR SPEC — WHEELS LOCKED' : ''),
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: locked ? '#ff9aa8' : '#62e8c7',
      }
    ).setDepth(33));

    this.drawWheelShopSide(
      this.wheelPreviewActive ? listings[this.selectedWheelIndex] : null,
      car,
      carState,
      locked
    );
  }

  transitionWheelPreview(nextIndex = null) {
    if (this.autoMarketTransitioning) return;
    this.autoMarketTransitioning = true;

    const fade = this.add.rectangle(780, 420, 1560, 840, 0x020307, 0)
      .setDepth(180).setInteractive();

    this.tweens.add({
      targets: fade,
      alpha: 0.97,
      duration: 210,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (nextIndex === null) {
          this.wheelPreviewActive = false;
          this.wheelAnimatePreview = false;
        } else {
          this.selectedWheelIndex = nextIndex;
          this.wheelPreviewActive = true;
          this.wheelAnimatePreview = true;
        }

        this.renderLocation(this.activeLocationId);

        this.tweens.add({
          targets: fade,
          alpha: 0,
          duration: 280,
          ease: 'Quad.easeOut',
          onComplete: () => {
            fade.destroy();
            this.autoMarketTransitioning = false;
          },
        });
      },
    });
  }

  drawWheelShopSide(option, car, carState, locked) {
    const y0 = SIDE.y + 224;
    const ownedWheels = new Set(getOwnedWheelIds(this.registry));

    if (!option) {
      this.addContent(this.add.text(SIDE.x + 20, y0, 'WHEEL SHOP', {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: '#8cc8ec',
      }).setDepth(34));
      this.addContent(this.add.text(
        SIDE.x + 20,
        y0 + 46,
        'Select one of the ten wheels on the wall to try it on ' +
          car.shortName + '.\n\nNothing changes until you buy or install.',
        {
          fontFamily: BODY_FONT,
          fontSize: '11px',
          color: '#9ab0bd',
          fontStyle: '600',
          lineSpacing: 5,
          wordWrap: { width: SIDE.w - 40 },
        }
      ).setDepth(34));
      return;
    }

    const alreadyOwned = ownedWheels.has(option.id);
    const installed = carState.customWheelId === option.id;
    const cash = Number(this.registry.get('cash') || 0);
    const canApply = !locked && (alreadyOwned || cash >= option.price);
    const tierColor = option.tier === 'HERO'
      ? '#ff9fc7'
      : option.tier === 'TUNER'
        ? '#ffe08a'
        : '#8fe7ff';

    this.addContent(this.add.text(SIDE.x + 20, y0, option.tier + ' WHEEL', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: tierColor,
    }).setDepth(34));
    this.addContent(this.add.text(SIDE.x + 20, y0 + 38, option.label, {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#ffffff',
      wordWrap: { width: SIDE.w - 40 },
    }).setDepth(34));
    this.addContent(this.add.text(
      SIDE.x + 20,
      y0 + 86,
      option.source + '\n384 × 384 STANDARD FIT\n' +
      (alreadyOwned ? 'IN YOUR WHEEL COLLECTION' : 'NOT YET OWNED'),
      {
        fontFamily: BODY_FONT,
        fontSize: '10px',
        color: '#9ab0bd',
        fontStyle: '600',
        lineSpacing: 5,
      }
    ).setDepth(34));
    this.addContent(this.add.text(
      SIDE.x + 20,
      y0 + 178,
      alreadyOwned ? 'OWNED // FREE TO INSTALL' : 'PRICE  ' + money(option.price),
      {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: alreadyOwned ? '#62e8c7' : '#ffe08a',
      }
    ).setDepth(34));

    if (carState.customWheelId) {
      const stockButton = this.addContent(this.add.rectangle(
        SIDE.x + SIDE.w / 2,
        SIDE.y + 548,
        SIDE.w - 36,
        40,
        locked ? 0x17181d : 0x1b2028,
        1
      ).setStrokeStyle(1, locked ? 0x514f55 : 0x8aa0ad, 1).setDepth(33));
      this.addContent(this.add.text(
        SIDE.x + SIDE.w / 2,
        SIDE.y + 548,
        locked ? 'COLLECTOR WHEELS LOCKED' : 'RESTORE STOCK WHEELS',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: locked ? '#817d84' : '#d5e1e7',
        }
      ).setOrigin(0.5).setDepth(34));
      if (!locked) {
        stockButton.setInteractive({ useHandCursor: true });
        stockButton.on('pointerdown', () => this.restoreStockWheels(car.id));
      }
    }

    const apply = this.addContent(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 608,
      SIDE.w - 36,
      48,
      canApply && !installed ? 0x0d2b29 : 0x17181d,
      1
    ).setStrokeStyle(2, canApply && !installed ? 0x62e8c7 : 0x514f55, 1).setDepth(33));

    const label = locked
      ? 'COLLECTOR CAR // LOCKED'
      : installed
        ? 'CURRENTLY INSTALLED'
        : alreadyOwned
          ? 'INSTALL'
          : cash < option.price
            ? 'NEED ' + money(option.price)
            : 'BUY & INSTALL // ' + money(option.price);

    this.addContent(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 608,
      label,
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: canApply && !installed ? '#f1fffb' : '#817d84',
      }
    ).setOrigin(0.5).setDepth(34));

    if (canApply && !installed) {
      apply.setInteractive({ useHandCursor: true });
      apply.on('pointerdown', () => {
        this.showTransactionConfirm({
          title: alreadyOwned ? 'INSTALL WHEELS' : 'BUY WHEELS',
          message: alreadyOwned
            ? 'Install ' + option.label + ' on ' + car.shortName + '?'
            : 'Buy ' + option.label + ' for ' + money(option.price) +
              ' and install them on ' + car.shortName + '?',
          confirmLabel: alreadyOwned ? 'INSTALL' : 'BUY & INSTALL',
          accent: 0x62e8c7,
          onConfirm: () => this.buyOrInstallWheel(option, car.id),
        });
      });
    }
  }

  buyOrInstallWheel(option, carId) {
    const wheel = getWheelOption(option?.id);
    const car = cars[carId];
    if (!wheel || !car) return;

    const states = { ...(this.registry.get('carStates') || {}) };
    const state = { ...(states[carId] || {}) };
    if (car.tuningLocked || state.collector || state.immutable) return;

    const ownedWheelIds = getOwnedWheelIds(this.registry);
    const alreadyOwned = ownedWheelIds.includes(wheel.id);
    const cash = Number(this.registry.get('cash') || 0);
    if (!alreadyOwned && cash < wheel.price) return;

    if (!alreadyOwned) {
      ownedWheelIds.push(wheel.id);
      this.registry.set('ownedWheelIds', ownedWheelIds);
      this.registry.set('cash', cash - wheel.price);
      this.cashText?.setText(money(cash - wheel.price));
    }

    state.customWheelId = wheel.id;
    states[carId] = state;
    this.registry.set('carStates', states);
    saveSessionState(this.registry);
    this.renderLocation(this.activeLocationId);
  }

  restoreStockWheels(carId) {
    const car = cars[carId];
    const states = { ...(this.registry.get('carStates') || {}) };
    const state = { ...(states[carId] || {}) };
    if (!car || car.tuningLocked || state.collector || state.immutable) return;

    delete state.customWheelId;
    states[carId] = state;
    this.registry.set('carStates', states);
    saveSessionState(this.registry);
    this.renderLocation(this.activeLocationId);
  }


  showTransactionConfirm({
    title = 'CONFIRM',
    message = '',
    confirmLabel = 'CONFIRM',
    accent = 0x62e8c7,
    onConfirm = null,
  } = {}) {
    if (this.transactionConfirmOpen) return;
    this.transactionConfirmOpen = true;

    const depth = 240;
    const objects = [];
    const add = obj => {
      objects.push(obj);
      return obj;
    };
    const close = () => {
      objects.forEach(obj => obj?.destroy?.());
      this.transactionConfirmOpen = false;
    };

    const blocker = add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.78)
      .setDepth(depth)
      .setInteractive());

    add(this.add.rectangle(780, 420, 620, 330, 0x09131d, 1)
      .setStrokeStyle(3, accent, 0.95)
      .setDepth(depth + 1));

    add(this.add.text(780, 318, String(title).toUpperCase(), {
      fontFamily: PIXEL_FONT,
      fontSize: '14px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5).setDepth(depth + 2));

    add(this.add.text(780, 392, message, {
      fontFamily: BODY_FONT,
      fontSize: '15px',
      color: '#c9d8df',
      fontStyle: '600',
      align: 'center',
      lineSpacing: 6,
      wordWrap: { width: 520 },
    }).setOrigin(0.5).setDepth(depth + 2));

    const cancel = add(this.add.rectangle(640, 512, 230, 52, 0x151c25, 1)
      .setStrokeStyle(2, 0x657783, 1)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true }));
    add(this.add.text(640, 512, 'CANCEL', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#d9e6ec',
    }).setOrigin(0.5).setDepth(depth + 3));

    const confirm = add(this.add.rectangle(920, 512, 230, 52, 0x102822, 1)
      .setStrokeStyle(2, accent, 1)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true }));
    add(this.add.text(920, 512, String(confirmLabel).toUpperCase(), {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(depth + 3));

    blocker.on('pointerdown', () => {});
    cancel.on('pointerdown', close);
    confirm.on('pointerdown', () => {
      close();
      onConfirm?.();
    });
  }

  findStorageForPurchase() {
    const owned = this.registry.get('ownedCarIds') || [];
    const locations = this.registry.get('carGarageLocations') || {};
    const activeId = this.registry.get('workshopLocationId') || 'shinonomeWorkshop';
    const unlocked = getUnlockedWorkshops(this.registry.get('garageTier') || 0);

    const ordered = [
      ...unlocked.filter(item => item.id === activeId),
      ...unlocked.filter(item => item.id !== activeId),
    ];

    return ordered.find(workshop =>
      getWorkshopUsage(owned, locations, workshop.id) < getWorkshopStorageCapacity(workshop.id)
    )?.id || null;
  }

  buyAutoMarketCar(listing) {
    const owned = [...(this.registry.get('ownedCarIds') || [])];
    if (!listing?.carId || owned.includes(listing.carId)) return;

    const cash = Number(this.registry.get('cash') || 0);
    const couponRequired = getCarCouponRequirement(listing.carId);
    const couponCount = getCarCouponCount(this.registry, listing.carId);
    const useCoupons = listing.marketType === 'new' && couponCount >= couponRequired;

    if (!useCoupons && cash < Number(listing.price || 0)) return;

    const storageId = this.findStorageForPurchase();
    if (!storageId) return;

    const carStates = { ...(this.registry.get('carStates') || {}) };
    const locations = { ...(this.registry.get('carGarageLocations') || {}) };
    const coupons = { ...(this.registry.get('carCoupons') || {}) };

    const purchasedState = listing.marketType === 'new'
      ? getNewCarState(listing.carId, listing.paintColor)
      : {
          ...(listing.previewState || getAutoMarketBuild(listing.carId)),
          paintColor: listing.paintColor,
          acquiredVia: 'tokyoAutoMarketUsed',
        };

    owned.push(listing.carId);
    carStates[listing.carId] = purchasedState;
    locations[listing.carId] = storageId;

    let nextCash = cash;
    if (useCoupons) {
      const remaining = Math.max(0, couponCount - couponRequired);
      if (remaining > 0) coupons[listing.carId] = remaining;
      else delete coupons[listing.carId];
      this.registry.set('carCoupons', coupons);
    } else {
      nextCash = cash - Number(listing.price || 0);
      this.registry.set('cash', nextCash);
    }

    this.registry.set('ownedCarIds', owned);
    this.registry.set('carStates', carStates);
    this.registry.set('carGarageLocations', locations);
    this.registry.set('selectedCarId', listing.carId);
    recordCarAcquisition(this.registry, listing.carId, {
      acquiredVia: useCoupons
        ? 'competitionCoupon'
        : listing.marketType === 'new'
          ? 'tokyoAutoMarketNew'
          : 'tokyoAutoMarketUsed',
    });
    saveSessionState(this.registry);

    this.cashText.setText(money(nextCash));
    this.autoMarketShowcaseActive = false;
    this.renderLocation(this.activeLocationId);
  }

  sellSelectedCar(carId, salePrice) {
    const owned = [...(this.registry.get('ownedCarIds') || [])];
    const starterCarId = this.registry.get('starterCarId');
    if (!owned.includes(carId)) return;
    if (owned.length <= 1) return;
    if (owned.length === 1 && carId === starterCarId) return;

    const nextOwned = owned.filter(id => id !== carId);
    const carStates = { ...(this.registry.get('carStates') || {}) };
    const locations = { ...(this.registry.get('carGarageLocations') || {}) };

    recordCarDeparture(this.registry, carId, 'sold', {
      salePrice: Number(salePrice || 0),
    });

    delete carStates[carId];
    delete locations[carId];

    const cash = Number(this.registry.get('cash') || 0) + Number(salePrice || 0);
    this.registry.set('ownedCarIds', nextOwned);
    this.registry.set('carStates', carStates);
    this.registry.set('carGarageLocations', locations);
    this.registry.set('selectedCarId', nextOwned[0] || null);
    this.registry.set('cash', cash);
    saveSessionState(this.registry);

    this.cashText.setText(money(cash));
    this.renderLocation(this.activeLocationId);
  }

  getGinzaListings() {
    const pool = GINZA_LISTINGS.filter(item => cars[item.carId]);
    if (pool.length <= 3) {
      return [...pool].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    // Ginza rotates a curated trio every six hours. Within that trio, the
    // highest-value car is presented as the front/hero position.
    const clockRotation = Math.floor(Date.now() / (6 * 60 * 60 * 1000)) % pool.length;
    const rotation = (clockRotation + Number(this.devCentralRefreshOffsets?.showroom || 0)) % pool.length;
    return [...pool.slice(rotation), ...pool.slice(0, rotation)]
      .slice(0, 3)
      .sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  }

  animateGinzaCarIn(objects) {
    const movable = objects.filter(obj =>
      obj && typeof obj.x === 'number' && typeof obj.setPosition === 'function'
    );

    movable.forEach(obj => {
      const targetX = obj.x;
      obj.x = targetX - 650;
      obj.setAlpha?.(1);
      this.tweens.add({ targets: obj, x: targetX, duration: 1850, ease: 'Sine.easeOut' });
      if (obj.getData?.('ginzaWheel')) {
        this.tweens.add({
          targets: obj,
          angle: obj.angle + 720,
          duration: 1850,
          ease: 'Sine.easeOut',
        });
      }
    });
  }

  transitionGinzaView(nextIndex = null) {
    if (this.ginzaTransitioning) return;
    this.ginzaTransitioning = true;

    const fade = this.add.rectangle(780, 420, 1560, 840, 0x020307, 0)
      .setDepth(120).setInteractive();

    this.tweens.add({
      targets: fade,
      alpha: 0.96,
      duration: 220,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (nextIndex === null) {
          this.ginzaShowcaseActive = false;
          this.ginzaAnimateShowcase = false;
        } else {
          this.selectedIndex = nextIndex;
          this.ginzaShowcaseActive = true;
          this.ginzaAnimateShowcase = true;
        }
        this.renderLocation(this.activeLocationId);
        this.tweens.add({
          targets: fade,
          alpha: 0,
          duration: 300,
          ease: 'Quad.easeOut',
          onComplete: () => {
            fade.destroy();
            this.ginzaTransitioning = false;
          },
        });
      },
    });
  }

  selectGinzaCar(index, storyConfirmed = false) {
    const listings = this.getGinzaListings();
    const listing = listings[index] || null;
    if (!listing) return;

    if (this.ginzaShowcaseActive && this.selectedIndex === index) {
      this.transitionGinzaView(null);
      return;
    }

    if (!storyConfirmed) {
      const carName = cars[listing.carId]?.shortName || listing.carId || 'COLLECTOR CAR';
      const story = playMangaCutscene(this, 'ginzaHeroCarReveal', {
        characterOverrides: { HOST: 'sayakaFujieda' },
        variables: {
          HOST_NAME: 'SAYAKA FUJIEDA',
          CAR: String(carName).toUpperCase(),
        },
        onComplete: () => this.selectGinzaCar(index, true),
      });
      if (story.played) return;
    }

    this.transitionGinzaView(index);
  }

  drawGinza() {
    this.drawNavigation('SHOWROOM', 'PRIVATE COLLECTION // SEALED HERO CARS // COLLECTOR GRADE');

    const listings = this.getGinzaListings();
    if (!listings.length) return;
    this.selectedIndex = Phaser.Math.Clamp(this.selectedIndex, 0, listings.length - 1);

    if (this.ginzaShowcaseActive) {
      const listing = listings[this.selectedIndex];
      const car = cars[listing.carId];
      const objects = this.createCarDisplay(
        car, STAGE.x + STAGE.w * 0.51, STAGE.y + 350, 700, 8
      );
      objects.slice(3, 5).forEach(obj => obj?.setData?.('ginzaWheel', true));
      objects.forEach(obj => this.addContent(obj));

      if (this.ginzaAnimateShowcase) {
        this.ginzaAnimateShowcase = false;
        this.animateGinzaCarIn(objects);
      }

      const dismiss = this.addContent(this.add.text(
        STAGE.x + STAGE.w - 24, STAGE.y + 24, '×  BACK TO COLLECTION',
        {
          fontFamily: PIXEL_FONT, fontSize: '8px', color: '#d8e7ef',
          backgroundColor: '#07111bcc', padding: { x: 12, y: 9 },
        }
      ).setOrigin(1, 0).setDepth(40).setInteractive({ useHandCursor: true }));
      dismiss.on('pointerdown', () => this.transitionGinzaView(null));
    } else {
      const ranked = listings.map((listing, index) => ({ listing, index }))
        .sort((left, right) => right.listing.price - left.listing.price);
      // Display order is left → centre → right. Keep this same order for the
      // selection cards below so each button sits under the car it controls.
      const screenOrder = [ranked[1], ranked[0], ranked[2]].filter(Boolean);
      const poses = [
        { x: STAGE.x + STAGE.w * 0.24, y: STAGE.y + 315, w: 310, depth: 9, flip: true },
        { x: STAGE.x + STAGE.w * 0.50, y: STAGE.y + 405, w: 390, depth: 11, flip: false },
        { x: STAGE.x + STAGE.w * 0.78, y: STAGE.y + 292, w: 292, depth: 8, flip: false },
      ];

      screenOrder.forEach(({ listing, index }, rank) => {
        const car = cars[listing.carId];
        const pose = poses[rank];
        const objects = this.createCarDisplay(
          car,
          pose.x,
          pose.y,
          pose.w,
          pose.depth,
          DEFAULT_PAINT_COLOR,
          null,
          pose.flip
        );
        objects.forEach(obj => this.addContent(obj));
        const hit = this.addContent(this.add.rectangle(
          pose.x, pose.y, pose.w, Math.max(105, pose.w * 0.34), 0x000000, 0
        ).setDepth(30).setInteractive({ useHandCursor: true }));
        hit.on('pointerdown', () => this.selectGinzaCar(index));
      });
    }

    this.addContent(this.add.text(
      CARDS.x + 18, CARDS.y + 14, 'GINZA HERO CARS // 3 AVAILABLE // ROTATES 6H',
      { fontFamily: PIXEL_FONT, fontSize: '11px', color: '#8fe7ff' }
    ).setDepth(33));

    const ginzaRanked = listings.map((listing, index) => ({ listing, index }))
      .sort((left, right) => right.listing.price - left.listing.price);
    const ginzaScreenOrder = [ginzaRanked[1], ginzaRanked[0], ginzaRanked[2]].filter(Boolean);

    ginzaScreenOrder.forEach(({ listing, index }, displayIndex) => {
      const car = cars[listing.carId];
      const x = CARDS.x + 190 + displayIndex * 365;
      const selected = this.ginzaShowcaseActive && index === this.selectedIndex;
      const owned = (this.registry.get('ownedCarIds') || []).includes(listing.carId);
      const box = this.addContent(this.add.rectangle(
        x, CARDS.y + 104, 340, 116, selected ? 0x2a2032 : 0x0b1724, 1
      ).setStrokeStyle(selected ? 2 : 1, selected ? 0xff9fc7 : 0x315470, 1)
        .setInteractive({ useHandCursor: true }).setDepth(32));

      this.addContent(this.add.text(x - 145, CARDS.y + 70, car.shortName, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#ffffff',
      }).setDepth(34));
      this.addContent(this.add.text(x - 145, CARDS.y + 99, listing.collectionLabel, {
        fontFamily: BODY_FONT, fontSize: '10px', color: '#c7a8bd', fontStyle: '600',
      }).setDepth(34));
      this.addContent(this.add.text(
        x + 145, CARDS.y + 126, owned ? 'OWNED' : money(listing.price),
        {
          fontFamily: PIXEL_FONT, fontSize: '7px',
          color: owned ? '#62e8c7' : '#ffe08a',
        }
      ).setOrigin(1, 0.5).setDepth(34));
      box.on('pointerdown', () => this.selectGinzaCar(index));
    });

    this.drawGinzaSide(listings[this.selectedIndex]);
  }

  drawGinzaSide(listing) {
    const car = cars[listing.carId];
    const owned = (this.registry.get('ownedCarIds') || []).includes(listing.carId);
    const cash = Number(this.registry.get('cash') || 0);
    const capacity = getGarageCapacity(this.registry.get('garageTier') || 0);
    const ownedCount = (this.registry.get('ownedCarIds') || []).length;
    const hasStorage = Boolean(this.findStorageForPurchase());
    const canBuy = !owned && cash >= listing.price && ownedCount < capacity && hasStorage;

    const y0 = SIDE.y + 238;

    this.addContent(this.add.text(SIDE.x + 20, y0, listing.rarity + ' // GINZA', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#ff9fc7',
    }).setDepth(34));

    this.addContent(this.add.text(SIDE.x + 20, y0 + 38, car.name.toUpperCase(), {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#ffffff',
      wordWrap: { width: SIDE.w - 40 },
    }).setDepth(34));

    this.addContent(this.add.text(
      SIDE.x + 20,
      y0 + 90,
      listing.collectionLabel + '\n' +
      car.engineModel + '\n' +
      car.powerKW + ' kW  //  ' + car.torqueNm + ' Nm\n' +
      Math.round(car.vehicleMassKg) + ' kg',
      {
        fontFamily: BODY_FONT,
        fontSize: '10px',
        color: '#9ab0bd',
        fontStyle: '600',
        lineSpacing: 4,
        wordWrap: { width: SIDE.w - 40 },
      }
    ).setDepth(34));

    this.addContent(this.add.text(SIDE.x + 20, y0 + 190, 'ASKING  ' + money(listing.price), {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#ffe08a',
    }).setDepth(34));

    this.addContent(this.add.text(
      SIDE.x + 20,
      y0 + 230,
      'SEALED COLLECTOR SPEC\nNO ENGINE / DRIVETRAIN / CHASSIS / NOS MODIFICATIONS',
      {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: '#d6a9bc',
        fontStyle: '600',
        lineSpacing: 4,
        wordWrap: { width: SIDE.w - 40 },
      }
    ).setDepth(34));

    const buyButton = this.addContent(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 608,
      SIDE.w - 36,
      48,
      canBuy ? 0x2b1422 : 0x17181d,
      1
    ).setStrokeStyle(2, canBuy ? 0xff7cac : 0x514f55, 1).setDepth(33));

    const buyLabel = owned
      ? 'IN YOUR COLLECTION'
      : !hasStorage || ownedCount >= capacity
        ? 'GARAGE FULL'
        : cash < listing.price
          ? 'NEED ' + money(listing.price)
          : 'ACQUIRE // ' + money(listing.price);

    this.addContent(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 608,
      buyLabel,
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: canBuy ? '#ffe5ef' : '#817d84',
      }
    ).setOrigin(0.5).setDepth(34));

    if (canBuy) {
      buyButton.setInteractive({ useHandCursor: true });
      buyButton.on('pointerdown', () => {
        const carName = cars[listing.carId]?.shortName || cars[listing.carId]?.name || 'this collector car';
        this.showTransactionConfirm({
          title: 'CONFIRM PURCHASE',
          message: 'Acquire ' + carName + ' for ' + money(listing.price) + '?\n\nGINZA collector cars are sealed and cannot be modified.',
          confirmLabel: 'ACQUIRE CAR',
          accent: 0xff7cac,
          onConfirm: () => this.buyGinzaCar(listing),
        });
      });
    }
  }

  buyGinzaCar(listing) {
    const car = cars[listing?.carId];
    if (!car?.ginzaExclusive) return;

    const owned = [...(this.registry.get('ownedCarIds') || [])];
    if (owned.includes(listing.carId)) return;

    const cash = Number(this.registry.get('cash') || 0);
    if (cash < Number(listing.price || 0)) return;

    const storageId = this.findStorageForPurchase();
    if (!storageId) return;

    const carStates = { ...(this.registry.get('carStates') || {}) };
    const locations = { ...(this.registry.get('carGarageLocations') || {}) };

    owned.push(listing.carId);
    carStates[listing.carId] = getGinzaCollectorState(listing.carId);
    locations[listing.carId] = storageId;

    this.registry.set('ownedCarIds', owned);
    this.registry.set('carStates', carStates);
    this.registry.set('carGarageLocations', locations);
    this.registry.set('selectedCarId', listing.carId);
    this.registry.set('cash', cash - listing.price);
    recordCarAcquisition(this.registry, listing.carId, {
      acquiredVia: 'ginzaMotorGallery',
    });
    saveSessionState(this.registry);

    this.cashText.setText(money(cash - listing.price));
    this.renderLocation(this.activeLocationId);
  }

  getSelectedBuild() {
    const carId = this.registry.get('selectedCarId');
    const car = cars[carId];
    if (!car) return null;

    const state = (this.registry.get('carStates') || {})[carId] || {};
    const engineBuild = applyEngineTuning(car, engines[car.engine], state);
    const full = applySecondaryTuning(engineBuild.car, engineBuild.engine, state);

    return {
      carId,
      car: full.car,
      engine: full.engine,
      state,
      nosInstalled:
        Boolean(state.nosInstalled) ||
        Number(state.exhaustNosTuning?.nosKit || 0) > 0,
    };
  }

  getProDragEvents() {
    const events = [...PRO_DRAG_EVENTS];
    if (!events.length) return events;

    const offset = Number(this.devCentralRefreshOffsets?.proDrag || 0) % events.length;
    return [...events.slice(offset), ...events.slice(0, offset)];
  }

  drawDragComplex() {
    this.drawNavigation(
      'PRO DRAG RACING',
      'THREE-ROUND BRACKETS // POWER LIMITS // ELITE DRIVERS'
    );

    const events = this.getProDragEvents();
    const build = this.getSelectedBuild();
    const selectedCar = build ? cars[build.carId] : null;

    if (selectedCar) {
      const playerCharacterId = this.registry.get('playerCharacterId') || 'renMizuno';
      const playerCharacter = characters[playerCharacterId] || characters.renMizuno;

      const carObjects = this.createCarDisplay(
        selectedCar,
        STAGE.x + 420,
        STAGE.y + 350,
        500,
        8,
        getCarPaintColor(build.state),
        playerCharacter
      );
      carObjects.forEach(obj => this.addContent(obj));
    }

    this.addContent(this.add.text(CARDS.x + 18, CARDS.y + 14, 'EVENTS // TOKYO DRAG COMPLEX', {
      fontFamily: PIXEL_FONT,
      fontSize: '11px',
      color: '#8fe7ff',
    }).setDepth(33));

    this.selectedEventIndex = Phaser.Math.Clamp(
      this.selectedEventIndex,
      0,
      events.length - 1
    );

    events.forEach((event, index) => {
      const x = CARDS.x + 190 + index * 365;
      const selected = index === this.selectedEventIndex;
      const wins = Number(this.registry.get('wins') || 0);
      const unlocked = isArkonDen(this.registry) || wins >= event.requiredWins;

      const box = this.addContent(this.add.rectangle(
        x,
        CARDS.y + 104,
        340,
        116,
        selected ? 0x123047 : 0x0b1724,
        1
      ).setStrokeStyle(selected ? 2 : 1, selected ? 0x43dfff : 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(32));

      this.addContent(this.add.text(x - 145, CARDS.y + 68, event.label, {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: unlocked ? '#ffffff' : '#667780',
      }).setDepth(34));

      this.addContent(this.add.text(x - 145, CARDS.y + 98, event.subtitle + ' // 3 ROUNDS', {
        fontFamily: BODY_FONT,
        fontSize: '10px',
        color: unlocked ? '#91a9b8' : '#5b6971',
        fontStyle: '600',
      }).setDepth(34));

      this.addContent(this.add.text(
        x + 145,
        CARDS.y + 126,
        unlocked ? 'ENTRY ' + money(event.entryFee) : event.requiredWins + ' WINS',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: unlocked ? '#ffe08a' : '#817d84',
        }
      ).setOrigin(1, 0.5).setDepth(34));

      box.on('pointerdown', () => {
        this.selectedEventIndex = index;
        this.renderLocation(this.activeLocationId);
      });
    });

    this.drawDragSide(events[this.selectedEventIndex], build);
  }

  drawDragSide(event, build) {
    const wins = Number(this.registry.get('wins') || 0);
    const cash = Number(this.registry.get('cash') || 0);
    const eventUnlocked = isArkonDen(this.registry) || wins >= event.requiredWins;
    const power = Math.round(Number(build?.car?.powerKW || 0));
    const passesPower = Boolean(build) && power <= event.maxPowerKW;
    const passesNos = Boolean(build) && (!event.noNos || !build.nosInstalled);
    const eligible = eventUnlocked && passesPower && passesNos && cash >= event.entryFee;

    const y = SIDE.y + 326;

    this.addContent(this.add.text(SIDE.x + 20, y, event.label, {
      fontFamily: PIXEL_FONT,
      fontSize: '11px',
      color: '#ffffff',
    }).setDepth(34));

    this.addContent(this.add.text(
      SIDE.x + 20,
      y + 48,
      'ENTRY  ' + money(event.entryFee) + '\n' +
      'PURSE  ' + money(event.prizeCash) + '\n' +
      'FORMAT  3-RACE BRACKET\n' +
      'POWER LIMIT  ' + event.maxPowerKW + ' kW\n' +
      'NOS  ' + (event.noNos ? 'PROHIBITED' : 'ALLOWED'),
      {
        fontFamily: BODY_FONT,
        fontSize: '11px',
        color: '#a4b7c3',
        fontStyle: '600',
        lineSpacing: 6,
      }
    ).setDepth(34));

    const status = !eventUnlocked
      ? 'LOCKED // ' + event.requiredWins + ' WINS'
      : !build
        ? 'NO CAR SELECTED'
        : !passesPower
          ? 'OVER POWER LIMIT // ' + power + ' kW'
          : !passesNos
            ? 'REMOVE NOS'
            : cash < event.entryFee
              ? 'NOT ENOUGH CASH'
              : 'SCRUTINEERING PASSED';

    this.addContent(this.add.text(
      SIDE.x + 20,
      y + 210,
      status,
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: eligible ? '#62e8c7' : '#ff8d9b',
        wordWrap: { width: SIDE.w - 40 },
      }
    ).setDepth(34));

    const enter = this.addContent(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 646,
      SIDE.w - 36,
      48,
      eligible ? 0x0d2b29 : 0x17181d,
      1
    ).setStrokeStyle(2, eligible ? 0x62e8c7 : 0x514f55, 1).setDepth(33));

    this.addContent(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 646,
      eligible ? 'ENTER BRACKET // ' + money(event.entryFee) : 'NOT ELIGIBLE',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: eligible ? '#f1fffb' : '#817d84',
      }
    ).setOrigin(0.5).setDepth(34));

    if (eligible) {
      enter.setInteractive({ useHandCursor: true });
      enter.on('pointerdown', () => this.startProBracket(event, build));
    }
  }

  startProBracket(event, build, storyConfirmed = false) {
    const cash = Number(this.registry.get('cash') || 0);
    if (!build || cash < event.entryFee) return;

    if (!storyConfirmed) {
      const story = playMangaCutscene(this, 'competitionIntroduction', {
        characterOverrides: { PROMOTER: 'tetsuyaKanda' },
        variables: { PROMOTER_NAME: 'TETSUYA KANDA' },
        onComplete: () => this.startProBracket(event, build, true),
      });
      if (story.played) return;
    }

    const playerCharacterId = this.registry.get('playerCharacterId');
    const rivals = genericRivalCharacterOrder
      .filter(id => id !== playerCharacterId && characters[id])
      .sort((a, b) =>
        Number(characters[b]?.skill?.rating || 3) -
        Number(characters[a]?.skill?.rating || 3)
      )
      .slice(0, 3);

    const rounds = event.opponentRatings.map((rating, index) => {
      const baseAi = getEncounterAi(rating);
      const eventBoost = event.id === 'tokyoInvitational' ? 0.035 : event.id === 'midnightCup' ? 0.02 : 0.01;

      return {
        characterId: rivals[index % rivals.length],
        carId: event.opponentCars[index % event.opponentCars.length],
        paintColor: [0x5e6b7a, 0xffffff, 0xd64f5d][index % 3],
        encounterRating: rating,
        encounterAi: {
          reactionSkill: clamp01(baseAi.reactionSkill + eventBoost),
          launchSkill: clamp01(baseAi.launchSkill + eventBoost),
          shiftSkill: clamp01(baseAi.shiftSkill + eventBoost),
          aggression: clamp01(baseAi.aggression + eventBoost),
        },
        raceType: 'Standing Start',
      };
    });

    const state = {
      active: true,
      proEvent: true,
      returnScene: 'CentralTokyoScene',
      locationId: CENTRAL_TOKYO_LOCATIONS.drag.id,
      difficulty: 'ELITE',
      playerCarId: build.carId,
      entryFee: event.entryFee,
      prizeType: 'CASH',
      prizeCash: event.prizeCash,
      prizeCarId: null,
      rounds,
      roundIndex: 0,
    };

    this.registry.set('cash', cash - event.entryFee);
    this.registry.set('competitionState', state);
    this.registry.set('raceReturnScene', 'CentralTokyoScene');
    this.registry.set('selectedCarId', build.carId);
    this.registry.set('selectedOpponentCarId', rounds[0].carId);
    this.registry.set('selectedOpponentPaintColor', rounds[0].paintColor);
    this.registry.set('selectedOpponentCharacterId', rounds[0].characterId);
    this.registry.set('selectedOpponentEncounterRating', rounds[0].encounterRating);
    this.registry.set('selectedOpponentEncounterAi', rounds[0].encounterAi);
    this.registry.set('selectedOpponentDifficulty', 'ELITE');
    this.registry.set('selectedRaceCategory', 'COMPETITION');
    this.registry.set('selectedRaceType', 'Standing Start');
    this.registry.set('selectedRaceDeal', 'COMPETITION');
    this.registry.set('selectedRaceStake', 0);
    this.registry.set('selectedRaceSpecialChallenge', false);
    this.registry.set('raceTimeOfDay', getWorldPhase());
    this.registry.set('raceDistrict', 'CENTRAL TOKYO');
    this.registry.set('raceLocationLabel', 'TOKYO DRAG COMPLEX');
    saveSessionState(this.registry);

    this.scene.start('RaceScene');
  }
}
