import { LBWK_CONVERSIONS } from '../data/lbwkConversions.js';
import {recordArkonCh7TunerVisit,claimArkonCh7FirstVisitScene} from '../data/arkonChapter07Progress.js?v=20261025-r684';
import {getArkonCh7FirstTunerManga} from '../data/arkonChapter07.js?v=20261025-r684';
import {playMangaCutscene} from '../ui/MangaCutscene.js?v=20261025-r683';
import { getCarBodyScaleForWidth } from '../vehicles/CarAppearance.js?v=20260929-r246';
import { getReferenceRightX } from '../data/carReferenceGeometry.js?v=20261012-ref2';
import { cars } from '../data/cars.js?v=20261026-r687';
import { getBaseCarId } from '../data/carOwnership.js?v=20261011-r479';
import { characters, getCharacterAssetUrl } from '../data/characters.js?v=20261006-r392';
import {
  getTunerShopForRegion,
  getTunerShopPhaseBackground,
  isTunerShopUnlocked,
  getInstalledSpecialistTuning,
  areTunerOptionRequirementsMet,
} from '../data/tunerShops.js?v=20261026-lbwk1';
import {
  saveSessionState,
  recordCarAcquisition,
  recordCarDeparture,
} from '../state/GameState.js?v=20261011-r482';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';
import {
  getCarBodyTextureKey,
  createCarBodyLayers,
  getCarDecalAnchor,
  getCarPaintColor,
} from '../vehicles/CarAppearance.js?v=20260929-r246';
import { createVisualModLayers, getVisualModWheelVisual, preloadVisualModSelectionAssets } from '../data/visualMods.js?v=20261014-r501';
import {
  getWheelPairFit,
  getWheelContactOffsetY,
} from '../vehicles/WheelFit.js?v=20260929-r258';
import {
  normaliseTunerDecals,
  withTunerDecal,
  carHasShopTune,
  createTunerDecalObject,
  createTunerDecalLayers,
  setTunerDecalObjectColor,
  preloadTunerDecalAssets,
} from '../vehicles/TunerDecals.js?v=20260929-r284';
import { showTravelMap } from '../ui/TravelMap.js?v=20261025-r684';
import { getWorldPhase } from '../environment/WorldClock.js?v=20260929-r286';
import { getTravelLocation } from '../data/travelRegions.js?v=20260929-r272';
import { addSettingsButton } from '../ui/SettingsPanel.js?v=20261011-r482';
import { preloadCarAppearanceAssets, preloadCarWheel, ensureDerivedModularCarTextures } from '../vehicles/CarAppearance.js?v=20260929-r246';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20261005-r355';
import { recordCarMagazineSightings } from '../data/carMagazine.js?v=20261011-r479';
import { getStockTuneServiceAction, applyStockTuneService } from '../data/stockTuneService.js?v=20261024-r676';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const STAGE = { x: 24, y: 92, w: 1138, h: 724 };
const SIDE = { x: 1180, y: 92, w: 356, h: 724 };
const HERO_CAR_DISPLAY_SCALE = 0.84;
 // A single showroom footprint for stock, player and hero cars in every tuner.
 // All current reference-standard bodies share the same 1300px source canvas.
const TUNER_STAGE_CAR_WIDTH = Math.round(770 * HERO_CAR_DISPLAY_SCALE);

const money = value => '¥ ' + Number(value || 0).toLocaleString('en-US');

export default class TunerShopScene extends Phaser.Scene {
  constructor() {
    super('TunerShopScene');
  }

  init(data = {}) {
    this.regionId = String(data.regionId || 'ODAIBA').toUpperCase();
    this.returnScene = String(data.returnScene || 'GarageScene');
    this.returnLocationId = data.returnLocationId || null;
    this.returnFromWorkshop = Boolean(data.fromWorkshop);
  }

  preload() {
    const shop = getTunerShopForRegion(this.regionId);
    if (!shop || !isTunerShopUnlocked(this.registry, this.regionId)) return;

    let queued = 0;
    // One real tuner backdrop was upscaled to the shared 1672x941 canvas.
    // Force a fresh fetch of backdrop art without invalidating car/decal assets.
    const phaseKeys = new Set(Object.values(shop.phaseBackgrounds||{})
      .map(asset => asset?.key).filter(Boolean));
    const queueImage = (key, path) => {
      if (!key || !path || this.textures.exists(key)) return;
      this.load.image(key, path + (phaseKeys.has(key)
        ? '?v=20261022-r645' : '?v=20261004-r333'));
      queued += 1;
    };

    ['day', 'night'].forEach(phase => {
      const background = getTunerShopPhaseBackground(shop, phase);
      if (background?.key && background?.path) {
        queueImage(background.key, background.path);
      }
    });

    // Legacy background remains a hard fallback only.
    queueImage(shop.backgroundKey, shop.backgroundPath);
    queueImage(shop.decalTextureKey, shop.decalPath);

    const mechanic = characters[shop.mechanicId]?.visual;
    if (
      mechanic?.spriteKey &&
      mechanic?.path &&
      !this.textures.exists(mechanic.spriteKey)
    ) {
      this.load.image(mechanic.spriteKey, getCharacterAssetUrl(mechanic.path));
      queued += 1;
    }

    // Liberty Walk collaborators have dedicated racing-outfit artwork.
    if (shop.cosmeticOnly) {
      for (const [key, path] of [
        ['lbwkArukenProIdle', 'assets/Characters/Pro/arkon_den_idle.png'],
        ['lbwkSayakaRaceIdle', 'assets/Characters/Main/race_sayaka_fujieda_idle.png'],
      ]) {
        if (!this.textures.exists(key)) {
          this.load.image(key, path);
          queued += 1;
        }
      }
    }

    const currentCarId = this.registry.get('selectedCarId');
    const owned = this.registry.get('ownedCarIds') || [];
    const carStates = this.registry.get('carStates') || {};
    const carIds = [...new Set([
      shop.heroCarId,
      ...(shop.cosmeticOnly ? LBWK_CONVERSIONS.map(g => g.id) : []),
      owned.includes(currentCarId) ? currentCarId : null,
    ])].filter(id => cars[id]);

    carIds.forEach(id => {
      queued += preloadCarAppearanceAssets(this, { [id]: cars[id] }, '20260928-r242');
      queued += preloadCarWheel(this, cars[id], id === currentCarId ? (carStates[id] || {}) : {});
    });

    if (currentCarId && cars[currentCarId]) {
      queued += preloadVisualModSelectionAssets(
        this,
        currentCarId,
        carStates[currentCarId] || {},
        '20260928-r242'
      );
      queued += preloadTunerDecalAssets(
        this,
        carStates[currentCarId] || {},
        '20260928-r242'
      );
    }

    startSceneLoading(this, 'LOADING TUNER SHOP', queued);
  }

  create() {
    const shopForAssets = getTunerShopForRegion(this.regionId);
    const currentCarIdForAssets = this.registry.get('selectedCarId');
    ensureDerivedModularCarTextures(this, Object.fromEntries(
      [...new Set([shopForAssets?.heroCarId, currentCarIdForAssets])]
        .filter(id => cars[id])
        .map(id => [id, cars[id]])
    ));

    document.body.dataset.scene = 'garage';
    this.scale.resize(1560, 840);
    playMusic('workshop');

    this.shop = getTunerShopForRegion(this.regionId);
    if (this.shop?.cosmeticOnly) this.shop = { ...this.shop };

    if (!this.shop || !isTunerShopUnlocked(this.registry, this.regionId)) {
      this.scene.start('GarageScene');
      return;
    }

    this.mode = 'HERO';
    this.dynamicObjects = [];
    this.popupObjects = [];
    this.conversionInProgress = false;
    this.worldPhase = getWorldPhase();
    this.tunerBackgroundImage = null;

    this.recordShopVisit();
    this.drawBase();

    this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => this.syncWorldPhaseBackground(),
    });
    this.drawHeader();
    this.drawSidePanel();
    this.showHeroMode();
    finishSceneLoading('TUNER SHOP');
    // The first Chapter 7 specialist meeting belongs HERE, with the actual
    // tuner backdrop, not several steps later back at Warehouse HQ.
    if(this._ch7FirstVisitManga){
      const definition=this._ch7FirstVisitManga;
      this._ch7FirstVisitManga=null;
      this.time.delayedCall(150,()=>{
        if(this.sys?.isActive?.() && this.registry.get('gameMode')==='arkonStory')
          playMangaCutscene(this,definition,{preloadPagePosesOnly:true,preview:true});
      });
    }
  }

  recordShopVisit() {
    const progress = { ...(this.registry.get('tunerShopProgress') || {}) };
    const previousVisit = progress[this.shop.id]
      || (this.shop.legacyShopId ? progress[this.shop.legacyShopId] : null)
      || {};
    progress[this.shop.id] = {
      ...previousVisit,
      discovered: true,
      visited: true,
      visitedAt: previousVisit.visitedAt || Date.now(),
    };
    this.registry.set('tunerShopProgress', progress);
    // Record actual in-world specialist visits, not authored montage cards.
    if (!this.shop.cosmeticOnly) recordArkonCh7TunerVisit(this.registry,this.regionId);
    if(!this.shop.cosmeticOnly && claimArkonCh7FirstVisitScene(this.registry,this.regionId))
      this._ch7FirstVisitManga=getArkonCh7FirstTunerManga(this.regionId);
    if (this.shop.heroCarId) {
      recordCarMagazineSightings(this.registry, [{
        carId: this.shop.heroCarId,
        label: this.shop.fullName + ' // ' + (this.shop.donorLabel || 'HERO CAR'),
        source: 'tuner-shop',
      }], 'tuner-shop');
    }
    saveSessionState(this.registry);
  }

  applyTunerBackgroundTexture(image, textureKey) {
    if (!image?.active || !textureKey || !this.textures.exists(textureKey)) return false;

    image.setTexture(textureKey);
    const source = this.textures.get(textureKey).getSourceImage();
    const scale = Math.max(STAGE.w / source.width, STAGE.h / source.height);

    // Preserve the existing R262 tuner-shop geometry exactly: cover the whole
    // stage and pin the floor edge to the bottom of the viewport.
    const scaledHeight = source.height * scale;
    image
      .setScale(scale)
      .setPosition(
        STAGE.x + STAGE.w / 2,
        STAGE.y + STAGE.h - scaledHeight / 2
      );

    return true;
  }

  syncWorldPhaseBackground() {
    const nextPhase = getWorldPhase();
    if (nextPhase === this.worldPhase) return;
    this.worldPhase = nextPhase;

    const background = getTunerShopPhaseBackground(this.shop, nextPhase);
    if (
      !this.tunerBackgroundImage?.active ||
      !background?.key ||
      !this.textures.exists(background.key)
    ) return;

    const image = this.tunerBackgroundImage;
    this.tweens.killTweensOf(image);
    this.tweens.add({
      targets: image,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (!image?.active) return;
        this.applyTunerBackgroundTexture(image, background.key);
        this.tweens.add({
          targets: image,
          alpha: 1,
          duration: 260,
          ease: 'Quad.easeOut',
        });
      },
    });
  }

  drawBase() {
    this.add.rectangle(780, 420, 1560, 840, 0x050a11).setDepth(-20);

    this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x0a1116,
      1
    ).setStrokeStyle(2, 0x4b4035, 1).setDepth(-12);

    const phaseBackground = getTunerShopPhaseBackground(
      this.shop,
      this.worldPhase || getWorldPhase()
    );
    let textureKey = phaseBackground?.key;
    if (!textureKey || !this.textures.exists(textureKey)) {
      textureKey = this.textures.exists(this.shop.backgroundKey)
        ? this.shop.backgroundKey
        : this.textures.exists('garageWorkshopBg')
          ? 'garageWorkshopBg'
          : null;
    }

    if (textureKey) {
      const image = this.add.image(
        STAGE.x + STAGE.w / 2,
        STAGE.y + STAGE.h / 2,
        textureKey
      ).setDepth(-10);

      this.applyTunerBackgroundTexture(image, textureKey);
      this.tunerBackgroundImage = image;

      const maskShape = this.make.graphics({ add: false });
      maskShape.fillStyle(0xffffff, 1);
      maskShape.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
      image.setMask(maskShape.createGeometryMask());

      this.add.rectangle(
        STAGE.x + STAGE.w / 2,
        STAGE.y + STAGE.h / 2,
        STAGE.w,
        STAGE.h,
        0x050707,
        0.10
      ).setDepth(-9);
    } else {
      this.tunerBackgroundImage = null;
      this.add.text(
        STAGE.x + STAGE.w / 2,
        STAGE.y + STAGE.h / 2,
        'BACKGROUND ASSET PENDING\n' + (phaseBackground?.path || this.shop.backgroundPath),
        {
          fontFamily: PIXEL_FONT,
          fontSize: '10px',
          color: '#887b6c',
          align: 'center',
        }
      ).setOrigin(0.5).setDepth(-8);
    }
  }


  drawHeader() {
    this.add.rectangle(780, 35, 1512, 62, 0x07111d, 1)
      .setStrokeStyle(2, 0x453827, 1)
      .setDepth(40);

    this.add.text(52, 35, (this.shop.cosmeticOnly ? 'GINZA MOTOR GALLERY X LIBERTY WALK' : this.regionId + ' // TUNER SHOP'), {
      fontFamily: PIXEL_FONT,
      fontSize: '18px',
      color: '#fff4df',
    }).setOrigin(0, 0.5).setDepth(42);

    this.cashText = this.add.text(1510, 35, money(this.registry.get('cash') || 0), {
      fontFamily: PIXEL_FONT,
      fontSize: '11px',
      color: '#f0dfbf',
    }).setOrigin(1, 0.5).setDepth(42);

    addSettingsButton(this, 1210, 35);
  }

  drawSidePanel() {
    this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + SIDE.h / 2,
      SIDE.w,
      SIDE.h,
      0x071018,
      0.97
    ).setStrokeStyle(2, 0x59462c, 1).setDepth(30);

    this.add.text(SIDE.x + 26, SIDE.y + 24, this.shop.label, {
      fontFamily: PIXEL_FONT,
      fontSize: '15px',
      color: '#fff2dc',
    }).setDepth(32);

    this.add.text(SIDE.x + 26, SIDE.y + 58, this.shop.specialty, {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#d6aa68',
    }).setDepth(32);

    if (this.shop.cosmeticOnly) {
      this.sideContent = this.add.container(0, 0).setDepth(33);
      this.add.text(SIDE.x + 26, SIDE.y + 24, 'LBWK BUILDS', {
        fontFamily: PIXEL_FONT, fontSize: '15px', color: '#fff2dc'
      }).setDepth(32);
      const choices = [
        {id:'libertyWalk240z',donor:'240z',name:'LBWK 240Z',cost:22000000},
        ...LBWK_CONVERSIONS
      ];
      choices.forEach((g,i) => {
        const y = SIDE.y + 85 + i*49;
        const b = this.add.rectangle(SIDE.x+SIDE.w/2,y,SIDE.w-56,43,
          this.shop.heroCarId===g.id?0x3a2d18:0x12202b,1)
          .setStrokeStyle(1,this.shop.heroCarId===g.id?0xffd889:0x627786,1)
          .setInteractive({useHandCursor:true}).setDepth(32);
        this.add.text(SIDE.x+SIDE.w/2,y,g.name.toUpperCase(),{
          fontFamily:PIXEL_FONT,fontSize:'9px',color:'#ffe2a3'
        }).setOrigin(0.5).setDepth(33);
        b.on('pointerdown',()=>this.selectLbwkBuild(g));
      });
      const mapY=SIDE.y+SIDE.h-42;
      const map=this.add.rectangle(SIDE.x+SIDE.w/2,mapY,SIDE.w-56,40,0x111920,1)
        .setStrokeStyle(1,0x62727b,1).setInteractive({useHandCursor:true}).setDepth(32);
      this.add.text(SIDE.x+SIDE.w/2,mapY,'GO TO MAP',{
        fontFamily:PIXEL_FONT,fontSize:'9px',color:'#e7f0f2'
      }).setOrigin(0.5).setDepth(33);
      map.on('pointerdown',()=>this.openMap());
      return;
    }

    const makeTab = (y, label, fill, stroke, fontSize = '9px',
      x = SIDE.x + SIDE.w / 2, width = SIDE.w - 56) => {
      const box = this.add.rectangle(
        x,
        SIDE.y + y,
        width,
        50,
        fill,
        1
      ).setStrokeStyle(2, stroke, 0.95)
        .setInteractive({ useHandCursor: true })
        .setDepth(31);

      const text = this.add.text(
        x,
        SIDE.y + y,
        label,
        {
          fontFamily: PIXEL_FONT,
          fontSize,
          color: '#e7f0f2',
          align: 'center',
        }
      ).setOrigin(0.5).setDepth(32);

      return { box, text };
    };

    this.heroTab = makeTab(118, 'HERO BUILD', 0x241c12, 0xe2b464, '9px');
    this.tuneTab = makeTab(180, this.shop.cosmeticOnly ? 'FULL WORKS // 240Z ONLY' : 'SPECIALIST TUNING', 0x101d22, 0x4f8b91, '8px');
    // Split the existing third row: no extra height is used in the side panel.
    this.decalTab = makeTab(242, 'SHOP DECAL', 0x15191d, 0x59646a,
      '7px', SIDE.x + 103, 145);
    this.serviceTab = makeTab(242, 'TUNE SERVICE', 0x13212a, 0x567c92,
      '7px', SIDE.x + SIDE.w - 103, 145);

    this.heroTab.box.on('pointerdown', () => this.showHeroMode());
    if (!this.shop.cosmeticOnly) this.tuneTab.box.on('pointerdown', () => this.showTuningMode());
    if (!this.shop.cosmeticOnly) this.decalTab.box.on('pointerdown', () => this.showDecalMode());
    if (!this.shop.cosmeticOnly) this.serviceTab.box.on('pointerdown', () => this.showServiceMode());

    this.sideContent = this.add.container(0, 0).setDepth(33);

    const mapY = SIDE.y + SIDE.h - 48;
    const mapButton = this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      mapY,
      SIDE.w - 56,
      44,
      0x111920,
      1
    ).setStrokeStyle(1, 0x62727b, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(31);

    this.add.text(
      SIDE.x + SIDE.w / 2,
      mapY,
      'GO TO MAP  >',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#dce8ed',
      }
    ).setOrigin(0.5).setDepth(32);

    mapButton.on('pointerdown', () => this.openMap());
  }

  setTabStyle() {
    if (this.shop.cosmeticOnly) return;
    const heroActive = this.mode === 'HERO';
    const tuneActive = this.mode === 'TUNING';
    const decalActive = this.mode === 'DECAL';
    const serviceActive = this.mode === 'SERVICE';

    this.heroTab.box
      .setFillStyle(heroActive ? 0x2b2114 : 0x171814, 1)
      .setStrokeStyle(heroActive ? 2 : 1, heroActive ? 0xe8ba68 : 0x554b3b, 1);
    this.heroTab.text.setColor(heroActive ? '#fff2da' : '#948875');

    this.tuneTab.box
      .setFillStyle(tuneActive ? 0x10292b : 0x10191d, 1)
      .setStrokeStyle(tuneActive ? 2 : 1, tuneActive ? 0x65cfc8 : 0x405258, 1);
    this.tuneTab.text.setColor(tuneActive ? '#e9fffb' : '#789094');

    const currentId = this.getCurrentCarId();
    const currentState = (this.registry.get('carStates') || {})[currentId] || {};
    const decalEligible = carHasShopTune(currentState, this.shop);

    this.decalTab.box
      .setFillStyle(decalActive ? 0x292414 : 0x15191d, 1)
      .setStrokeStyle(
        decalActive ? 2 : 1,
        decalActive ? 0xe6c365 : decalEligible ? 0x8e7a3e : 0x485056,
        1
      );
    this.decalTab.text.setColor(
      decalActive ? '#fff3c8' : decalEligible ? '#d9c687' : '#707a7f'
    );
    this.serviceTab.box
      .setFillStyle(serviceActive ? 0x163441 : 0x101b23, 1)
      .setStrokeStyle(serviceActive ? 2 : 1,
        serviceActive ? 0x69d9ff : 0x567c92, 1);
    this.serviceTab.text.setColor(serviceActive ? '#eefaff' : '#86a6b7');
  }

  getCurrentCarId() {
    const carId = this.registry.get('selectedCarId');
    const owned = this.registry.get('ownedCarIds') || [];
    return carId && owned.includes(carId) && cars[carId] ? carId : null;
  }

  getCurrentTunableCarId() {
    const carId = this.getCurrentCarId();
    const car = carId ? cars[carId] : null;
    if (!car || car.collector || car.tuningLocked) return null;
    return carId;
  }

  clearDynamic() {
    this.dynamicObjects.forEach(obj => obj?.destroy?.());
    this.dynamicObjects = [];

    if (this.sideContent) {
      this.sideContent.removeAll(true);
    }

    this.clearPopup();
  }

  addDynamic(obj) {
    this.dynamicObjects.push(obj);
    return obj;
  }

  clearPopup() {
    this.popupObjects.forEach(obj => obj?.destroy?.());
    this.popupObjects = [];
  }

  addPopup(obj) {
    this.popupObjects.push(obj);
    return obj;
  }

  showHeroMode() {
    if (this.conversionInProgress) return;
    this.mode = 'HERO';
    this.clearDynamic();
    this.setTabStyle();

    this.drawMechanic();
    if (!this.shop.cosmeticOnly) this.drawLbwkSelectorButton();

    const hero = cars[this.shop.heroCarId];
    if (hero) {
      this.drawCarOnStage(hero.id, 720, 650, TUNER_STAGE_CAR_WIDTH, 10, true);
    }

    const currentCarId = this.getCurrentCarId();
    const owned = this.registry.get('ownedCarIds') || [];
    const carStates = this.registry.get('carStates') || {};
    const donorExists = Boolean(cars[this.shop.donorCarId]);
    const currentIsDonor = getBaseCarId(currentCarId) === this.shop.donorCarId;
    const donorState = currentIsDonor ? (carStates[currentCarId] || {}) : {};
    const donorEligible = currentIsDonor && (this.shop.cosmeticOnly || donorState.stock !== false);
    const heroOwned = owned.includes(this.shop.heroCarId);
    const cost = Number(this.shop.buildCost || 0);
    const cash = Number(this.registry.get('cash') || 0);

    if (this.shop.cosmeticOnly) {
      // The permanent build list is the only selector. A compatible car reveals
      // its build action above the map; no sale or conversion happens here.
      if (currentIsDonor && donorEligible && !heroOwned) {
        const y = SIDE.y + SIDE.h - 99;
        const btn=this.sideContent.add(this.add.rectangle(SIDE.x+SIDE.w/2,y,
          SIDE.w-56,45,0x392916,1).setStrokeStyle(2,0xe2b464,1)
          .setInteractive({useHandCursor:true}));
        this.sideContent.add(this.add.text(SIDE.x+SIDE.w/2,y,'YOUR LBWK BUILD',{
          fontFamily:PIXEL_FONT,fontSize:'9px',color:'#fff1d5'
        }).setOrigin(0.5));
        btn.on('pointerdown',()=>this.rollInDonor());
      }
      return;
    }
    this.sideContent.add(this.add.text(SIDE.x + 30, SIDE.y + 300, 'BUILD PROGRAM', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#d6aa68',
    }));

    this.sideContent.add(this.add.text(
      SIDE.x + 30,
      SIDE.y + 334,
      this.shop.donorLabel + '\n→ ' + (hero?.shortName || this.shop.label + ' HERO'),
      {
        fontFamily: BODY_FONT,
        fontSize: '12px',
        color: '#e4edf0',
        fontStyle: '700',
        lineSpacing: 7,
      }
    ));

    this.sideContent.add(this.add.text(SIDE.x + 30, SIDE.y + 394, money(cost), {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#f3c77b',
    }));

    let label = 'BUILD HERO CAR';
    let enabled = true;

    if (!donorExists) {
      label = 'STOCK ' + this.shop.donorLabel + ' NOT YET IN CATALOGUE';
      enabled = false;
    } else if (heroOwned) {
      label = 'HERO ALREADY OWNED';
      enabled = false;
    } else if (!currentIsDonor) {
      label = this.shop.cosmeticOnly
        ? 'DRIVE YOUR ' + this.shop.donorLabel + ' HERE'
        : 'BRING YOUR STOCK ' + this.shop.donorLabel;
      enabled = false;
    } else if (!donorEligible) {
      label = 'CURRENT DONOR MUST BE STOCK';
      enabled = false;
    } else if (cash < cost) {
      label = 'NEED ' + money(cost);
      enabled = false;
    }

    const buildY = SIDE.y + 482;
    const buildButton = this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      buildY,
      SIDE.w - 56,
      64,
      enabled ? 0x2a2115 : 0x17191b,
      1
    ).setStrokeStyle(
      enabled ? 2 : 1,
      enabled ? 0xe2b464 : 0x495057,
      1
    );

    const buildText = this.add.text(
      SIDE.x + SIDE.w / 2,
      buildY,
      label,
      {
        fontFamily: PIXEL_FONT,
        fontSize: enabled ? '8px' : '7px',
        color: enabled ? '#fff1d5' : '#768087',
        align: 'center',
        wordWrap: { width: SIDE.w - 96 },
      }
    ).setOrigin(0.5);

    this.sideContent.add(buildButton);
    this.sideContent.add(buildText);

    if (enabled) {
      buildButton.setInteractive({ useHandCursor: true });
      buildButton.on('pointerdown', () => this.rollInDonor());
    }

    this.sideContent.add(this.add.text(
      SIDE.x + 30,
      SIDE.y + 536,
      this.shop.cosmeticOnly
        ? 'Buy a compatible car at Auto Market and\ndeliver it to a garage. Select it there, then\ndrive here to arrange your full-works build.\nStock and modified donors are accepted.'
        : 'The build only accepts the car you actually\nbrought here. Your stock donor rolls in, is\nconverted, then becomes the sealed hero car.',
      {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: '#83939b',
        fontStyle: '600',
        lineSpacing: 4,
      }
    ));