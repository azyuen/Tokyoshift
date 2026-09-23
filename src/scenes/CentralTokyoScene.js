import { cars, carOrder } from '../data/cars.js?v=20260923-r155';
import { engines } from '../data/engines.js?v=20260923-r134';
import { characters, genericRivalCharacterOrder } from '../data/characters.js?v=20260923-r145';
import {
  applyEngineTuning,
} from '../data/tuning.js?v=20260922-r114';
import {
  applySecondaryTuning,
} from '../data/secondaryTuning.js?v=20260922-r128';
import {
  DEFAULT_PAINT_COLOR,
  getCarBodyTextureKey,
  createCarBodyLayers,
  getCarPaintColor,
} from '../vehicles/CarAppearance.js?v=20260923-r154';
import { createDriverSilhouette } from '../vehicles/DriverSilhouette.js?v=20260923-r137';
import { createVisualModLayers } from '../data/visualMods.js?v=20260923-r138';
import { getWheelPairFit } from '../vehicles/WheelFit.js?v=20260923-r152';
import { getEncounterAi } from '../data/encounterProfiles.js?v=20260921-r76';
import { saveSessionState } from '../state/GameState.js?v=20260923-r140';
import { showTravelMap } from '../ui/TravelMap.js?v=20260923-r144';
import { getTravelLocation } from '../data/travelRegions.js?v=20260923-r144';
import {
  getGarageCapacity,
  getUnlockedWorkshops,
  getWorkshopStorageCapacity,
  getWorkshopUsage,
} from '../data/workshopProgression.js?v=20260922-r128';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20260922-r117';
import { addSettingsButton } from '../ui/SettingsPanel.js?v=20260922-r125';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';
import {
  CENTRAL_TOKYO_LOCATIONS,
  AUTO_MARKET_LISTINGS,
  GINZA_LISTINGS,
  PRO_DRAG_EVENTS,
  getAutoMarketBuild,
  getAutoMarketSellPrice,
  getGinzaCollectorState,
  isCentralTokyoLocationUnlocked,
  isArkonDen,
} from '../data/centralTokyo.js?v=20260923-r134';

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
  }

  preload() {
    let queued = 0;
    Object.values(CENTRAL_TOKYO_LOCATIONS).forEach(location => {
      if (!this.textures.exists(location.backgroundKey)) {
        this.load.image(
          location.backgroundKey,
          location.backgroundPath + '?v=20260922-r125'
        );
        queued += 1;
      }
    });

    startSceneLoading(this, 'LOADING CENTRAL TOKYO', queued);
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

    this.contentObjects = [];
    this.selectedIndex = 0;
    this.selectedEventIndex = 0;
    this.ginzaShowcaseActive = false;
    this.ginzaAnimateShowcase = false;
    this.ginzaTransitioning = false;

    this.drawShell();
    this.renderLocation(this.activeLocationId);

    finishSceneLoading('CENTRAL TOKYO');
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

  renderLocation(locationId) {
    const location = LOCATION_BY_ID[locationId] || CENTRAL_TOKYO_LOCATIONS.autoMarket;

    if (!isCentralTokyoLocationUnlocked(this.registry, location.id)) {
      return;
    }

    const previousLocationId = this.activeLocationId;
    if (location.kind !== 'showroom' || previousLocationId !== location.id) {
      this.ginzaShowcaseActive = false;
      this.ginzaAnimateShowcase = false;
    }

    this.clearContent();
    this.activeLocationId = location.id;
    this.registry.set('centralTokyoLocation', location.id);
    saveSessionState(this.registry);

    this.locationHeader.setText(location.label + ' // NIGHT');
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

  drawBackground(location) {
    if (this.textures.exists(location.backgroundKey)) {
      const source = this.textures.get(location.backgroundKey).getSourceImage();
      const scale = Math.max(STAGE.w / source.width, STAGE.h / source.height);
      const image = this.addContent(this.add.image(
        STAGE.x + STAGE.w / 2,
        STAGE.y + STAGE.h / 2,
        location.backgroundKey
      ).setScale(scale).setDepth(-10));

      const maskShape = this.addContent(this.make.graphics({ add: false }));
      maskShape.fillStyle(0xffffff, 1);
      maskShape.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
      image.setMask(maskShape.createGeometryMask());
    } else {
      this.addContent(this.add.rectangle(
        STAGE.x + STAGE.w / 2,
        STAGE.y + STAGE.h / 2,
        STAGE.w,
        STAGE.h,
        0x07101a,
        1
      ).setDepth(-10));

      this.addContent(this.add.text(
        STAGE.x + STAGE.w / 2,
        STAGE.y + STAGE.h / 2,
        'BACKGROUND READY FOR UPLOAD\n' + location.backgroundPath,
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
      0.08
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
    const mapY = SIDE.y + 142;
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
  }

  openMap() {
    showTravelMap(this, {
      currentLocationId: this.activeLocationId,
      title: 'TOKYO REGION MAP',
      actionVerb: 'DRIVE',
      allowCurrentAction: false,
      onHome: (workshopLocationId, cost) => this.returnToWorkshop(workshopLocationId, cost),
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
    flipX = false
  ) {
    const bodyKey = getCarBodyTextureKey(this, car);
    if (!this.textures.exists(bodyKey) || !this.textures.exists(car.visual.wheelKey)) return [];

    const source = this.textures.get(bodyKey).getSourceImage();
    const wheelSource = this.textures.get(car.visual.wheelKey).getSourceImage();
    const bodyScale = targetWidth / source.width;
    const fit = getWheelPairFit(car.visual, bodyScale, flipX, wheelSource);
    const renderOffsetY = Number(car.visual.renderOffsetY || 0) * bodyScale;
    const displayY = y + renderOffsetY;

    const rearX = x + fit.rear.offsetX;
    const frontX = x + fit.front.offsetX;
    const rearY = displayY + fit.rear.offsetY;
    const frontY = displayY + fit.front.offsetY;

    const rearWheel = this.add.image(rearX, rearY, car.visual.wheelKey)
      .setScale(fit.rear.wheelScale)
      .setFlipX(flipX)
      .setData('carWheel', true)
      .setDepth(depth);
    const frontWheel = this.add.image(frontX, frontY, car.visual.wheelKey)
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
      rearY + rearWheel.displayHeight * 0.5,
      frontY + frontWheel.displayHeight * 0.5
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

    const carState = (this.registry.get('carStates') || {})[car.id] || {};
    const visualModObjects = createVisualModLayers(this, car, carState, {
      x,
      y: displayY,
      scale: bodyScale,
      depth: depth + 1.005,
      paintColor,
      bodyLayers,
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

  getAutoMarketListings() {
    const owned = new Set(this.registry.get('ownedCarIds') || []);
    const pool = [...AUTO_MARKET_LISTINGS];
    const offset = Math.floor(Date.now() / (3 * 60 * 60 * 1000)) % pool.length;
    const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];

    // Prefer cars the player does not own, but keep owned cars in the market
    // so the dealership still feels populated when the collection grows.
    return [
      ...rotated.filter(item => !owned.has(item.carId)),
      ...rotated.filter(item => owned.has(item.carId)),
    ].slice(0, 3);
  }

  drawAutoMarket() {
    this.drawNavigation(
      'DEALERSHIP',
      'USED CARS // PRE-MODIFIED STREET BUILDS // BUY & SELL'
    );

    const listings = this.getAutoMarketListings();
    this.selectedIndex = Phaser.Math.Clamp(this.selectedIndex, 0, listings.length - 1);

    listings.forEach((listing, index) => {
      const car = cars[listing.carId];
      const x = STAGE.x + 200 + index * 370;
      const objects = this.createCarDisplay(car, x, STAGE.y + 390, 315, 8);
      objects.forEach(obj => this.addContent(obj));
    });

    this.addContent(this.add.text(CARDS.x + 18, CARDS.y + 14, 'USED CARS // TOKYO AUTO MARKET', {
      fontFamily: PIXEL_FONT,
      fontSize: '11px',
      color: '#8fe7ff',
    }).setDepth(33));

    listings.forEach((listing, index) => {
      const car = cars[listing.carId];
      const x = CARDS.x + 190 + index * 365;
      const selected = index === this.selectedIndex;
      const owned = (this.registry.get('ownedCarIds') || []).includes(listing.carId);

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

      this.addContent(this.add.text(x - 145, CARDS.y + 72, car.shortName, {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: '#ffffff',
      }).setDepth(34));

      this.addContent(this.add.text(x - 145, CARDS.y + 98, listing.buildLabel, {
        fontFamily: BODY_FONT,
        fontSize: '10px',
        color: '#91a9b8',
        fontStyle: '600',
      }).setDepth(34));

      this.addContent(this.add.text(x + 145, CARDS.y + 126, owned ? 'OWNED' : money(listing.price), {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: owned ? '#62e8c7' : '#ffe08a',
      }).setOrigin(1, 0.5).setDepth(34));

      box.on('pointerdown', () => {
        this.selectedIndex = index;
        this.renderLocation(this.activeLocationId);
      });
    });

    this.drawAutoMarketSide(listings[this.selectedIndex]);
  }

  drawAutoMarketSide(listing) {
    const car = cars[listing.carId];
    const owned = (this.registry.get('ownedCarIds') || []).includes(listing.carId);
    const cash = Number(this.registry.get('cash') || 0);
    const capacity = getGarageCapacity(this.registry.get('garageTier') || 0);
    const ownedCount = (this.registry.get('ownedCarIds') || []).length;
    const canBuy = !owned && cash >= listing.price && ownedCount < capacity;

    const y0 = SIDE.y + 328;

    this.addContent(this.add.text(SIDE.x + 20, y0, 'SELECTED CAR', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#8cc8ec',
    }).setDepth(34));

    this.addContent(this.add.text(SIDE.x + 20, y0 + 42, car.name.toUpperCase(), {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#ffffff',
      wordWrap: { width: SIDE.w - 40 },
    }).setDepth(34));

    this.addContent(this.add.text(
      SIDE.x + 20,
      y0 + 92,
      listing.buildLabel + '\n' +
      car.engineModel + '  //  ' + car.powerKW + ' kW\n' +
      Math.round(car.vehicleMassKg) + ' kg',
      {
        fontFamily: BODY_FONT,
        fontSize: '11px',
        color: '#9ab0bd',
        fontStyle: '600',
        lineSpacing: 5,
      }
    ).setDepth(34));

    this.addContent(this.add.text(SIDE.x + 20, y0 + 184, 'ASKING  ' + money(listing.price), {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#ffe08a',
    }).setDepth(34));

    const buyButton = this.addContent(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 604,
      SIDE.w - 36,
      48,
      canBuy ? 0x0d2b29 : 0x17181d,
      1
    ).setStrokeStyle(2, canBuy ? 0x62e8c7 : 0x514f55, 1).setDepth(33));

    const buyLabel = owned
      ? 'ALREADY OWNED'
      : ownedCount >= capacity
        ? 'GARAGE FULL'
        : cash < listing.price
          ? 'NEED ' + money(listing.price)
          : 'BUY // ' + money(listing.price);

    this.addContent(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 604,
      buyLabel,
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: canBuy ? '#f1fffb' : '#817d84',
      }
    ).setOrigin(0.5).setDepth(34));

    if (canBuy) {
      buyButton.setInteractive({ useHandCursor: true });
      buyButton.on('pointerdown', () => this.buyAutoMarketCar(listing));
    }

    const selectedCarId = this.registry.get('selectedCarId');
    const ownedCars = this.registry.get('ownedCarIds') || [];
    const selectedCar = cars[selectedCarId];
    const selectedState = (this.registry.get('carStates') || {})[selectedCarId] || {};
    const collectorLocked = Boolean(selectedCar?.tuningLocked || selectedState.collector || selectedState.immutable);
    const canSell = Boolean(
      selectedCarId &&
      selectedCar &&
      ownedCars.length > 1 &&
      !collectorLocked
    );
    const sellPrice = canSell
      ? getAutoMarketSellPrice(
          selectedCarId,
          (this.registry.get('carStates') || {})[selectedCarId] || {}
        )
      : 0;

    const sellButton = this.addContent(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 668,
      SIDE.w - 36,
      44,
      canSell ? 0x261922 : 0x17181d,
      1
    ).setStrokeStyle(1, canSell ? 0xff7cac : 0x514f55, 1).setDepth(33));

    this.addContent(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 668,
      canSell
        ? 'SELL ' + cars[selectedCarId].shortName + ' // ' + money(sellPrice)
        : collectorLocked
          ? 'COLLECTOR CAR NOT TRADED HERE'
          : 'KEEP AT LEAST ONE CAR',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: canSell ? '#ffc0d7' : '#817d84',
      }
    ).setOrigin(0.5).setDepth(34));

    if (canSell) {
      sellButton.setInteractive({ useHandCursor: true });
      sellButton.on('pointerdown', () => this.sellSelectedCar(selectedCarId, sellPrice));
    }
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
    if (owned.includes(listing.carId)) return;

    const cash = Number(this.registry.get('cash') || 0);
    if (cash < listing.price) return;

    const storageId = this.findStorageForPurchase();
    if (!storageId) return;

    const carStates = { ...(this.registry.get('carStates') || {}) };
    const locations = { ...(this.registry.get('carGarageLocations') || {}) };

    owned.push(listing.carId);
    carStates[listing.carId] = {
      ...getAutoMarketBuild(listing.carId),
      paintColor: DEFAULT_PAINT_COLOR,
    };
    locations[listing.carId] = storageId;

    this.registry.set('ownedCarIds', owned);
    this.registry.set('carStates', carStates);
    this.registry.set('carGarageLocations', locations);
    this.registry.set('selectedCarId', listing.carId);
    this.registry.set('cash', cash - listing.price);
    saveSessionState(this.registry);

    this.cashText.setText(money(cash - listing.price));
    this.renderLocation(this.activeLocationId);
  }

  sellSelectedCar(carId, salePrice) {
    const owned = [...(this.registry.get('ownedCarIds') || [])];
    if (owned.length <= 1 || !owned.includes(carId)) return;

    const nextOwned = owned.filter(id => id !== carId);
    const carStates = { ...(this.registry.get('carStates') || {}) };
    const locations = { ...(this.registry.get('carGarageLocations') || {}) };

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
    const rotation = Math.floor(Date.now() / (6 * 60 * 60 * 1000)) % pool.length;
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

  selectGinzaCar(index) {
    const listings = this.getGinzaListings();
    if (!listings[index]) return;
    if (this.ginzaShowcaseActive && this.selectedIndex === index) {
      this.transitionGinzaView(null);
      return;
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
      const poses = [
        { x: STAGE.x + STAGE.w * 0.50, y: STAGE.y + 405, w: 390, depth: 11, flip: false },
        { x: STAGE.x + STAGE.w * 0.24, y: STAGE.y + 315, w: 310, depth: 9, flip: true },
        { x: STAGE.x + STAGE.w * 0.78, y: STAGE.y + 292, w: 292, depth: 8, flip: false },
      ];

      ranked.forEach(({ listing, index }, rank) => {
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

    listings.forEach((listing, index) => {
      const car = cars[listing.carId];
      const x = CARDS.x + 190 + index * 365;
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

    const y0 = SIDE.y + 310;

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
      SIDE.y + 676,
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
      SIDE.y + 676,
      buyLabel,
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: canBuy ? '#ffe5ef' : '#817d84',
      }
    ).setOrigin(0.5).setDepth(34));

    if (canBuy) {
      buyButton.setInteractive({ useHandCursor: true });
      buyButton.on('pointerdown', () => this.buyGinzaCar(listing));
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

  drawDragComplex() {
    this.drawNavigation(
      'PRO DRAG RACING',
      'THREE-ROUND BRACKETS // POWER LIMITS // ELITE DRIVERS'
    );

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
      PRO_DRAG_EVENTS.length - 1
    );

    PRO_DRAG_EVENTS.forEach((event, index) => {
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

    this.drawDragSide(PRO_DRAG_EVENTS[this.selectedEventIndex], build);
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

  startProBracket(event, build) {
    const cash = Number(this.registry.get('cash') || 0);
    if (!build || cash < event.entryFee) return;

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
    this.registry.set('raceTimeOfDay', 'night');
    this.registry.set('raceDistrict', 'CENTRAL TOKYO');
    this.registry.set('raceLocationLabel', 'TOKYO DRAG COMPLEX');
    saveSessionState(this.registry);

    this.scene.start('RaceScene');
  }
}
