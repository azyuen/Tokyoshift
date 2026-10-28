import { LBWK_CONVERSIONS } from '../data/lbwkConversions.js';
import { LBWK_CATALOG, getLbwkConversionQuote } from '../data/lbwkFullWorks.js?v=20261027-r694';
import {recordArkonCh7TunerVisit,claimArkonCh7FirstVisitScene} from '../data/arkonChapter07Progress.js?v=20261025-r684';
import {getArkonCh7FirstTunerManga} from '../data/arkonChapter07.js?v=20261025-r684';
import {playMangaCutscene} from '../ui/MangaCutscene.js?v=20261025-r683';
import { getCarBodyScaleForWidth } from '../vehicles/CarAppearance.js?v=20260929-r246';
import { getReferenceRightX } from '../data/carReferenceGeometry.js?v=20261012-ref2';
import { cars } from '../data/cars.js?v=20261027-r694';
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

    if (this.shop.cosmeticOnly) {
      this.sideContent = this.add.container(0,0).setDepth(33);
      this.add.text(SIDE.x+26,SIDE.y+22,'LBWK BUILDS',{
        fontFamily:PIXEL_FONT,fontSize:'15px',color:'#fff2dc'
      }).setDepth(32);
      this.lbwkIntroText=this.add.text(SIDE.x+26,SIDE.y+61,
        'Bring a compatible car for the\nLiberty Walk treatment.',{
          fontFamily:BODY_FONT,fontSize:'14px',color:'#b5c6cd',
          lineSpacing:3
        }).setDepth(32);
      this.lbwkChoices=LBWK_CATALOG;
      this.lbwkBrowseObjects=[];
      this.lbwkChoiceControls=[];
      this.lbwkChoices.forEach((g,i)=>{
        const y=SIDE.y+149+i*46;
        const selected=this.shop.heroCarId===g.id;
        const label=({libertyWalk240z:'240Z',lbwk180sx:'180SX',
          lbwkA60:'A60 SUPRA',lbwk350z:'350Z',lbwkS15:'S15',
          lbwkR34:'R34',lbwkMx5:'MX-5 NB',lbwkR32:'R32'})[g.id]||g.name.replace(/^LBWK\\s*/,'');
        const b=this.add.rectangle(SIDE.x+SIDE.w/2,y,SIDE.w-56,40,
          selected?0x3a2d18:0x12202b,1)
          .setStrokeStyle(1,selected?0xffd889:0x627786,1)
          .setInteractive({useHandCursor:true}).setDepth(32);
        const text=this.add.text(SIDE.x+SIDE.w/2,y,label,{
          fontFamily:PIXEL_FONT,fontSize:'9px',
          color:selected?'#ffe2a3':'#dce7eb'
        }).setOrigin(0.5).setDepth(33);
        b.on('pointerdown',()=>this.selectLbwkBuild(g));
        this.lbwkChoiceControls.push({id:g.id,button:b,text});
        this.lbwkBrowseObjects.push(b,text);
      });
      const y=SIDE.y+SIDE.h-39;
      const map=this.add.rectangle(SIDE.x+SIDE.w/2,y,SIDE.w-56,40,0x111920,1)
        .setStrokeStyle(1,0x62727b,1).setInteractive({useHandCursor:true}).setDepth(32);
      this.add.text(SIDE.x+SIDE.w/2,y,'GO TO MAP  >',{
        fontFamily:PIXEL_FONT,fontSize:'9px',color:'#e7f0f2'
      }).setOrigin(0.5).setDepth(33);
      map.on('pointerdown',()=>this.openMap());
      return;
    }

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

  refreshLbwkChoiceHighlight() {
    // The eight sidebar buttons are persistent scene objects, not part of
    // clearDynamic(). Repaint them when the selected build changes so the
    // original 240Z does not remain highlighted.
    for (const item of this.lbwkChoiceControls || []) {
      const selected = item.id === this.shop?.heroCarId;
      item.button?.setFillStyle(selected ? 0x3a2d18 : 0x12202b, 1)
        .setStrokeStyle(1, selected ? 0xffd889 : 0x627786, 1);
      item.text?.setColor(selected ? '#ffe2a3' : '#dce7eb');
    }
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

  getLbwkCurrentQuote() {
    if (!this.shop?.cosmeticOnly) return null;
    const build=LBWK_CATALOG.find(item=>item.id===this.shop.heroCarId);
    const carId=this.getCurrentCarId();
    const state=getBaseCarId(carId)===build?.donor
      ? (this.registry.get('carStates')||{})[carId]||{}
      : {};
    return getLbwkConversionQuote(build,state);
  }

  showHeroMode() {
    if (this.conversionInProgress) return;
    this.mode = 'HERO';
    this.clearDynamic();
    if (this.shop.cosmeticOnly) {
      (this.lbwkBrowseObjects||[]).forEach(o=>{o.setVisible(true);if(o.input)o.input.enabled=true;});
      this.lbwkIntroText?.setVisible(true);
      this.refreshLbwkChoiceHighlight();
    }
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
    const cost = this.shop.cosmeticOnly ? (this.getLbwkCurrentQuote()?.total || 0)
      : Number(this.shop.buildCost || 0);
    const cash = Number(this.registry.get('cash') || 0);

    if (this.shop.cosmeticOnly) {
      const currentBuild=cars[this.shop.heroCarId];
      const donorModel=cars[this.shop.donorCarId];
      const sx=SIDE.x+27;
      const stat=(y,value,color='#c7d6dd',size='9px')=>
        this.sideContent.add(this.add.text(sx,SIDE.y+y,value,{
          fontFamily:PIXEL_FONT,fontSize:size,color
        }));
      stat(535,'SELECTED  '+(currentBuild?.shortName||'HERO BUILD'),'#ffe2a3','8px');
      stat(558,'POWER '+Math.round(currentBuild?.powerKW||0)+' kW    TORQUE '+Math.round(currentBuild?.torqueNm||0)+' Nm','#dce7eb','8px');
      stat(583,'BUILD  '+money(cost),'#f3c77b','9px');
      if (currentIsDonor && donorEligible && !heroOwned) {
        // Keep the CTA above the sidebar's text container so touch input
        // cannot be intercepted by overlapping price or other UI children.
        const y=SIDE.y+SIDE.h-96;
        const b=this.addDynamic(this.add.rectangle(SIDE.x+SIDE.w/2,y,
          SIDE.w-56,44,0x392916,1).setStrokeStyle(2,0xe2b464,1)
          .setDepth(60).setInteractive({useHandCursor:true}));
        this.addDynamic(this.add.text(SIDE.x+SIDE.w/2,y,'YOUR LBWK BUILD',{
          fontFamily:PIXEL_FONT,fontSize:'9px',color:'#fff1d5'
        }).setOrigin(0.5).setDepth(61));
        b.on('pointerdown',()=>{
          if (this.conversionInProgress) return;
          b.disableInteractive();
          try { this.rollInDonor(); }
          catch (error) {
            console.error('[LBWK] donor arrival failed',error);
            this.conversionInProgress=false;
            this.showHeroMode();
            this.showLbwkActionError(error);
          }
        });
      }
      return;
    }

  }

  selectLbwkBuild(g) {
    if (!this.shop?.cosmeticOnly || !isTunerShopUnlocked(this.registry,this.regionId)) return;
    this.shop.heroCarId=g.id;
    this.shop.donorCarId=g.donor;
    this.shop.donorLabel=cars[g.donor]?.name || g.donor.toUpperCase();
    this.shop.buildCost=getLbwkConversionQuote(g)?.fullPrice || 0;
    this.clearPopup();
    this.refreshLbwkChoiceHighlight();
    this.showHeroMode();
  }

  showLbwkBuildSelector() {
    if (!this.shop?.cosmeticOnly) return;
    this.clearPopup();
    this.addPopup(this.add.rectangle(780,420,1560,840,0x030609,0.8)
      .setDepth(150).setInteractive());
    this.addPopup(this.add.rectangle(780,420,740,650,0x09131b,0.99)
      .setStrokeStyle(2,0xe4b958,1).setDepth(151));
    this.addPopup(this.add.text(780,160,'LIBERTY WALK // FULL WORKS',{
      fontFamily:PIXEL_FONT,fontSize:'14px',color:'#ffe2a3'
    }).setOrigin(0.5).setDepth(152));
    const choices=LBWK_CATALOG;
    choices.forEach((g,i)=>{
      const y=215+i*56;
      const chosen=this.shop.heroCarId===g.id;
      const b=this.addPopup(this.add.rectangle(780,y,650,48,
        chosen?0x3a2d18:0x12202b,1)
        .setStrokeStyle(1,chosen?0xffd889:0x627786,1)
        .setInteractive({useHandCursor:true}).setDepth(152));
      this.addPopup(this.add.text(780,y,
        g.name+'   //   FROM '+money(getLbwkConversionQuote(g)?.fullPrice||0),
        {fontFamily:PIXEL_FONT,fontSize:'9px',color:chosen?'#ffe2a3':'#dce7eb'}
      ).setOrigin(0.5).setDepth(153));
      b.on('pointerdown',()=>this.selectLbwkBuild(g));
    });
    const close=this.addPopup(this.add.rectangle(780,690,260,40,0x202832,1)
      .setStrokeStyle(1,0x8497a3,1).setInteractive({useHandCursor:true}).setDepth(152));
    this.addPopup(this.add.text(780,690,'CLOSE',{
      fontFamily:PIXEL_FONT,fontSize:'9px',color:'#ffffff'
    }).setOrigin(0.5).setDepth(153));
    close.on('pointerdown',()=>this.clearPopup());
  }

  drawLbwkSelectorButton() {
    if (!this.shop?.cosmeticOnly) return;
    const x=STAGE.x+STAGE.w-185,y=STAGE.y+55;
    const b=this.addDynamic(this.add.rectangle(x,y,330,52,0x322410,0.98)
      .setStrokeStyle(2,0xe4b958,1).setInteractive({useHandCursor:true}).setDepth(29));
    this.addDynamic(this.add.text(x,y,'CHOOSE LBWK BUILD  >',{
      fontFamily:PIXEL_FONT,fontSize:'9px',color:'#ffe2a3'
    }).setOrigin(0.5).setDepth(30));
    b.on('pointerdown',()=>this.showLbwkBuildSelector());
  }

  getTunableCarIds() {
    return (this.registry.get('ownedCarIds') || []).filter(id => {
      const car = cars[id];
      if (!car) return false;
      if (car.collector || car.tuningLocked) return false;
      return true;
    });
  }

  showTuningMode() {
    if (this.conversionInProgress) return;
    this.mode = 'TUNING';
    this.clearDynamic();
    this.setTabStyle();
    this.drawMechanic();

    const carId = this.getCurrentTunableCarId();
    if (!carId) {
      const currentId = this.getCurrentCarId();

      this.addDynamic(this.add.text(
        STAGE.x + STAGE.w / 2,
        STAGE.y + STAGE.h / 2,
        currentId ? 'CURRENT CAR CANNOT USE SPECIALIST TUNING' : 'BRING A CAR TO THE TUNER SHOP',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '11px',
          color: '#a7b6bd',
          align: 'center',
        }
      ).setOrigin(0.5).setDepth(20));

      this.sideContent.add(this.add.text(
        SIDE.x + 30,
        SIDE.y + 330,
        currentId ? 'THIS CAR IS NOT TUNABLE HERE' : 'NO CURRENT CAR',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '8px',
          color: '#79868c',
          wordWrap: { width: SIDE.w - 72 },
        }
      ));
      return;
    }

    const car = cars[carId];
    const carState = (this.registry.get('carStates') || {})[carId] || {};

    this.drawCarOnStage(carId, 720, 650, TUNER_STAGE_CAR_WIDTH, 10, true);

    const installed = new Set(getInstalledSpecialistTuning(carState));
    const options = this.shop.tuningOptions || [];
    const startY = SIDE.y + 338;
    const cardHeight = 116;
    const cardStep = 124;

    options.forEach((option, index) => {
      const y = startY + index * cardStep;
      const isInstalled = installed.has(option.id);
      const requirementsMet = areTunerOptionRequirementsMet(carState, option);
      const affordable = Number(this.registry.get('cash') || 0) >= Number(option.cost || 0);
      const enabled = !carState.stockTuneService &&
        !isInstalled && requirementsMet && affordable;

      const box = this.add.rectangle(
        SIDE.x + SIDE.w / 2,
        y,
        SIDE.w - 56,
        cardHeight,
        isInstalled ? 0x15241d : enabled ? 0x10262a : 0x151a1c,
        1
      ).setStrokeStyle(
        isInstalled || enabled ? 2 : 1,
        isInstalled ? 0x62b98a : enabled ? 0x65cfc8 : 0x465157,
        1
      );

      const cardTop = y - cardHeight / 2;
      const contentX = SIDE.x + 42;
      const name = this.add.text(
        contentX,
        cardTop + 14,
        option.shortName || option.name,
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: isInstalled ? '#a9e4bd' : enabled ? '#e9fffb' : '#879296',
          wordWrap: { width: SIDE.w - 106 },
        }
      );

      const benefit = this.add.text(
        contentX,
        cardTop + 44,
        option.benefit,
        {
          fontFamily: BODY_FONT,
          fontSize: '8px',
          color: '#91adb0',
          fontStyle: '700',
          wordWrap: { width: SIDE.w - 106 },
        }
      );

      let metaText = money(option.cost);
      if (isInstalled) metaText = 'INSTALLED';
      else if (!requirementsMet) metaText = option.requirementLabel;
      else if (!affordable) metaText = 'NEED ' + money(option.cost);

      const meta = this.add.text(
        contentX,
        cardTop + 78,
        metaText,
        {
          fontFamily: PIXEL_FONT,
          fontSize: '6px',
          color: isInstalled ? '#8dd0a4' : enabled ? '#d9b66f' : '#717d82',
          wordWrap: { width: SIDE.w - 108 },
        }
      );

      [box, name, benefit, meta].forEach(obj => this.sideContent.add(obj));

      if (enabled) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => this.showTuneConfirmation(carId, option));
      }
    });
  }


  showServiceMode() {
    if (this.conversionInProgress) return;
    this.mode = 'SERVICE';
    this.clearDynamic();
    this.setTabStyle();
    this.drawMechanic();
    const carId = this.getCurrentTunableCarId();
    const state = (this.registry.get('carStates') || {})[carId] || {};
    const quote = carId ? getStockTuneServiceAction(state, this.shop) : null;
    if (carId) this.drawCarOnStage(carId, 720, 650, TUNER_STAGE_CAR_WIDTH, 10, true);
    const addText = (y, value, fontSize = '9px', color = '#c9dce4') => {
      this.sideContent.add(this.add.text(SIDE.x + 30, y, value, {
        fontFamily: fontSize === '9px' ? PIXEL_FONT : BODY_FONT,
        fontSize, color, wordWrap: { width: SIDE.w - 60 }, lineSpacing: 5,
      }));
    };
    addText(SIDE.y + 319, carId
      ? (cars[carId]?.shortName || carId).toUpperCase() + ' // TUNE SERVICE'
      : 'SELECT A CAR FIRST', '9px', '#e9f8ff');
    if (!carId) return;
    addText(SIDE.y + 365, quote?.action === 'RESTORE'
      ? 'YOUR PURCHASED PARTS AND SPECIALIST CALIBRATIONS ARE READY TO BE REINSTALLED.'
      : 'RETURN TO FACTORY SPECIFICATION WITHOUT LOSING PURCHASED PARTS OR CALIBRATIONS.',
      '13px');
    if (!quote?.action) {
      addText(SIDE.y + 473, quote?.reason || 'NO SERVICE AVAILABLE', '10px', '#d5b88b');
      return;
    }
    addText(SIDE.y + 472, 'LABOUR // ' + money(quote.fee), '9px', '#e5c47c');
    const action = this.add.rectangle(
      SIDE.x + SIDE.w / 2, SIDE.y + 568, SIDE.w - 58, 49,
      0x15352f, 1).setStrokeStyle(2, 0x68dec1)
      .setInteractive({ useHandCursor: true });
    this.sideContent.add(action);
    this.sideContent.add(this.add.text(SIDE.x + SIDE.w / 2,
      SIDE.y + 568, quote.action === 'RESTORE' ? 'RESTORE SAVED TUNE' : 'PREPARE FACTORY STOCK', {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#edfff7',
      }).setOrigin(0.5));
    action.on('pointerdown', () => this.confirmStockTuneService(carId));
  }

  confirmStockTuneService(carId) {
    if (this.conversionInProgress || this.getCurrentTunableCarId() !== carId) return;
    const state = (this.registry.get('carStates') || {})[carId] || {};
    const quote = getStockTuneServiceAction(state, this.shop);
    if (!quote.action) return;
    this.clearPopup();
    const add = obj => this.addPopup(obj);
    add(this.add.rectangle(780, 420, 1560, 840, 0x030911, 0.81)
      .setDepth(150).setInteractive());
    add(this.add.rectangle(780, 420, 730, 340, 0x0b1821, 1)
      .setStrokeStyle(2, 0x6adaca).setDepth(151));
    add(this.add.text(780, 320,
      quote.action === 'RESTORE' ? 'RESTORE SAVED TUNING' : 'PREPARE FACTORY STOCK', {
        fontFamily: PIXEL_FONT, fontSize: '12px', color: '#f5fdff',
      }).setOrigin(0.5).setDepth(152));
    const info = [
      cars[carId]?.shortName || carId,
      quote.action === 'RESTORE'
        ? 'RESTORE ALL PURCHASED UPGRADES AND CALIBRATIONS'
        : 'STORE ALL PERFORMANCE MODIFICATIONS TEMPORARILY',
      'LABOUR // ' + money(quote.fee),
    ].join('\n');
    add(this.add.text(780, 407, info, {
      fontFamily: BODY_FONT, fontSize: '17px', color: '#c5dce6',
      align: 'center', lineSpacing: 7,
    }).setOrigin(0.5).setDepth(152));
    const makeButton = (x, label, handler) => {
      const box = add(this.add.rectangle(x, 526, 240, 48, 0x1a2d35, 1)
        .setStrokeStyle(2, 0x6adaca).setDepth(152)
        .setInteractive({ useHandCursor: true }));
      add(this.add.text(x, 526, label, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#f4ffff',
      }).setOrigin(0.5).setDepth(153));
      box.on('pointerdown', handler);
    };
    makeButton(640, 'CANCEL', () => this.clearPopup());
    makeButton(925, 'CONFIRM // ' + money(quote.fee), () => {
      const live = (this.registry.get('carStates') || {})[carId] || {};
      const valid = getStockTuneServiceAction(live, this.shop);
      const cash = Number(this.registry.get('cash') || 0);
      if (this.getCurrentTunableCarId() !== carId ||
          valid.action !== quote.action || cash < valid.fee) {
        this.clearPopup();
        this.showToast(cash < valid.fee ? 'INSUFFICIENT FUNDS' : 'SERVICE STATUS CHANGED');
        return;
      }
      const updated = applyStockTuneService(live, this.shop);
      if (!updated) return;
      this.registry.set('carStates', {
        ...(this.registry.get('carStates') || {}), [carId]: updated,
      });
      this.registry.set('cash', cash - valid.fee);
      this.cashText.setText(money(cash - valid.fee));
      saveSessionState(this.registry);
      this.clearPopup();
      this.showServiceMode();
      this.showToast(quote.action === 'RESTORE' ? 'SAVED TUNE RESTORED' : 'FACTORY STOCK READY');
    });
  }

  showTuneConfirmation(carId, option) {
    if (!carId || !option) return;

    const car = cars[carId];
    const carState = (this.registry.get('carStates') || {})[carId] || {};
    const installed = getInstalledSpecialistTuning(carState);
    if (installed.includes(option.id)) return;
    if (!areTunerOptionRequirementsMet(carState, option)) return;

    const cost = Math.max(0, Number(option.cost || 0));
    const cash = Number(this.registry.get('cash') || 0);
    if (cash < cost) return;

    this.clearPopup();

    const shade = this.addPopup(this.add.rectangle(
      780,
      420,
      1560,
      840,
      0x020304,
      0.74
    ).setDepth(150).setInteractive());

    const panel = this.addPopup(this.add.rectangle(
      780,
      420,
      700,
      356,
      0x091119,
      0.995
    ).setStrokeStyle(2, 0x65cfc8, 1).setDepth(151));

    this.addPopup(this.add.text(780, 305, 'CONFIRM SPECIALIST TUNE', {
      fontFamily: PIXEL_FONT,
      fontSize: '13px',
      color: '#e9fffb',
    }).setOrigin(0.5).setDepth(152));

    this.addPopup(this.add.text(
      780,
      352,
      (car?.shortName || car?.name || carId) + '  //  ' + (option.shortName || option.name),
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 590 },
      }
    ).setOrigin(0.5).setDepth(152));

    this.addPopup(this.add.text(
      780,
      408,
      option.description || option.benefit,
      {
        fontFamily: BODY_FONT,
        fontSize: '12px',
        color: '#aebfc5',
        fontStyle: '600',
        align: 'center',
        wordWrap: { width: 560 },
      }
    ).setOrigin(0.5).setDepth(152));

    this.addPopup(this.add.text(
      780,
      466,
      option.benefit + '     ' + money(cost),
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#d8c17f',
        align: 'center',
      }
    ).setOrigin(0.5).setDepth(152));

    const cancel = this.addPopup(this.add.rectangle(
      640,
      535,
      230,
      54,
      0x171d21,
      1
    ).setStrokeStyle(1, 0x68747a, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(152));

    const apply = this.addPopup(this.add.rectangle(
      920,
      535,
      230,
      54,
      0x10292b,
      1
    ).setStrokeStyle(2, 0x65cfc8, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(152));

    this.addPopup(this.add.text(640, 535, 'CANCEL', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#cbd5d9',
    }).setOrigin(0.5).setDepth(153));

    this.addPopup(this.add.text(920, 535, 'YES // APPLY', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#e9fffb',
    }).setOrigin(0.5).setDepth(153));

    cancel.on('pointerdown', () => this.clearPopup());
    apply.on('pointerdown', () => {
      this.clearPopup();
      this.installSpecialistTune(carId, option);
    });

    shade.on('pointerdown', () => {});
    panel.setInteractive();
  }

  showDecalMode() {
    if (this.conversionInProgress) return;
    this.mode = 'DECAL';
    this.clearDynamic();
    this.setTabStyle();
    this.drawMechanic();

    const carId = this.getCurrentTunableCarId();
    if (!carId) {
      this.sideContent.add(this.add.text(
        SIDE.x + 30,
        SIDE.y + 330,
        'BRING A TUNABLE CAR HERE FIRST',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '8px',
          color: '#78858a',
          wordWrap: { width: SIDE.w - 70 },
        }
      ));
      return;
    }

    const carStates = this.registry.get('carStates') || {};
    const carState = carStates[carId] || {};
    const eligible = carHasShopTune(carState, this.shop);

    const carObjects = this.drawCarOnStage(
      carId,
      720,
      650,
      TUNER_STAGE_CAR_WIDTH,
      10,
      true,
      { showDecals: false }
    );

    if (!eligible) {
      this.sideContent.add(this.add.text(
        SIDE.x + 30,
        SIDE.y + 336,
        'DECAL LOCKED\n\nUSE AT LEAST ONE ' + this.shop.label + '\nSPECIALIST TUNE ON THIS CAR.',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: '#817d70',
          lineSpacing: 5,
          wordWrap: { width: SIDE.w - 74 },
        }
      ));
      return;
    }

    const geometry = carObjects.geometry;
    if (!geometry) return;
    const decalLayerDepth = cars[carId]?.visual?.referenceStandard &&
      !cars[carId]?.visual?.singleBody ? 11.012 : 11.04;

    const allDecals = normaliseTunerDecals(carState);
    const existing = allDecals[this.shop.decalId];

    // Keep decals earned at other tuner houses visible while editing this
    // shop's decal. Only the active decal is replaced by the draggable preview.
    const otherDecals = { ...allDecals };
    delete otherDecals[this.shop.decalId];
    const otherDecalObjects = createTunerDecalLayers(
      this,
      { ...carState, tunerDecals: otherDecals },
      {
        x: geometry.x,
        y: geometry.displayY,
        displayWidth: geometry.displayWidth,
        displayHeight: geometry.displayHeight,
        depth: decalLayerDepth,
      }
    );
    otherDecalObjects.forEach(obj => this.addDynamic(obj));

    const placement = {
      x: Number(existing?.x ?? 0.06),
      y: Number(existing?.y ?? -0.01),
      scale: Number(existing?.scale ?? 0.13),
      rotation: Number(existing?.rotation ?? 0),
      color: String(existing?.color || '#FFFFFF').toUpperCase(),
    };

    const clampPlacement = () => {
      placement.x = Phaser.Math.Clamp(Number(placement.x || 0), -0.42, 0.42);
      placement.y = Phaser.Math.Clamp(Number(placement.y || 0), -0.65, 0.30);
    };

    const syncPlacementFromPreview = previewObject => {
      placement.x = (previewObject.x - geometry.x) / geometry.displayWidth;
      placement.y = (previewObject.y - geometry.displayY) / geometry.displayHeight;
      clampPlacement();
    };

    const positionPreviewFromPlacement = previewObject => {
      clampPlacement();
      previewObject.setPosition(
        geometry.x + placement.x * geometry.displayWidth,
        geometry.displayY + placement.y * geometry.displayHeight
      );
    };

    const createPreview = () => {
      const preview = createTunerDecalObject(this, this.shop.decalId, {
        x: geometry.x + placement.x * geometry.displayWidth,
        y: geometry.displayY + placement.y * geometry.displayHeight,
        displayWidth: geometry.displayWidth,
        depth: decalLayerDepth,
        placement,
      });
      preview.setInteractive({ useHandCursor: true, draggable: true });
      this.input.setDraggable(preview);
      this.addDynamic(preview);

      preview.on('drag', (_pointer, dragX, dragY) => {
        const minX = geometry.x - geometry.displayWidth * 0.42;
        const maxX = geometry.x + geometry.displayWidth * 0.42;
        const minY = geometry.displayY - geometry.displayHeight * 0.65;
        const maxY = geometry.displayY + geometry.displayHeight * 0.30;
        preview.x = Phaser.Math.Clamp(dragX, minX, maxX);
        preview.y = Phaser.Math.Clamp(dragY, minY, maxY);
        syncPlacementFromPreview(preview);
      });

      return preview;
    };

    let preview = createPreview();

    const resizePreview = () => {
      const rawWidth = Math.max(1, Number(preview.width || 1));
      preview.setScale((geometry.displayWidth * placement.scale) / rawWidth);
      preview.setAngle(placement.rotation);
      setTunerDecalObjectColor(preview, placement.color);
      positionPreviewFromPlacement(preview);
    };

    const makeControl = (x, y, width, label, handler, options = {}) => {
      const box = this.add.rectangle(
        x,
        y,
        width,
        Number(options.height || 42),
        Number(options.fill ?? 0x171d20),
        1
      ).setStrokeStyle(
        Number(options.strokeWidth || 1),
        Number(options.stroke ?? 0x667176),
        1
      ).setInteractive({ useHandCursor: true });

      const text = this.add.text(x, y, label, {
        fontFamily: PIXEL_FONT,
        fontSize: options.fontSize || '7px',
        color: options.textColor || '#dbe4e7',
        align: 'center',
      }).setOrigin(0.5);

      box.on('pointerdown', handler);
      this.sideContent.add(box);
      this.sideContent.add(text);
      return { box, text };
    };

    const colourTitleY = SIDE.y + 304;
    this.sideContent.add(this.add.text(
      SIDE.x + 30,
      colourTitleY,
      'DECAL COLOUR',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#d5bb76',
      }
    ));

    const swatch = this.add.rectangle(
      SIDE.x + SIDE.w - 42,
      colourTitleY + 7,
      26,
      18,
      Number.parseInt(placement.color.slice(1), 16),
      1
    ).setStrokeStyle(1, 0x96a2a7, 1);
    this.sideContent.add(swatch);

    const whiteControl = makeControl(
      SIDE.x + 72,
      SIDE.y + 350,
      78,
      'WHITE',
      () => {
        placement.color = '#FFFFFF';
        setTunerDecalObjectColor(preview, placement.color);
        refreshColourControls();
      },
      { fill: 0xf4f4f4, stroke: 0xbfc8cc, textColor: '#111111' }
    );

    const blackControl = makeControl(
      SIDE.x + 160,
      SIDE.y + 350,
      78,
      'BLACK',
      () => {
        placement.color = '#000000';
        setTunerDecalObjectColor(preview, placement.color);
        refreshColourControls();
      },
      { fill: 0x050505, stroke: 0x69757b, textColor: '#ffffff' }
    );

    const customControl = makeControl(
      SIDE.x + 270,
      SIDE.y + 350,
      112,
      'CUSTOM',
      () => {
        this.openDecalColourPicker(placement.color, color => {
          placement.color = color;
          setTunerDecalObjectColor(preview, placement.color);
          refreshColourControls();
        });
      },
      { fill: 0x171d20, stroke: 0x8a7750, textColor: '#f1dfb2' }
    );

    const refreshColourControls = () => {
      const isWhite = placement.color === '#FFFFFF';
      const isBlack = placement.color === '#000000';
      const isCustom = !isWhite && !isBlack;

      whiteControl.box.setStrokeStyle(isWhite ? 3 : 1, isWhite ? 0xe6c365 : 0xbfc8cc, 1);
      blackControl.box.setStrokeStyle(isBlack ? 3 : 1, isBlack ? 0xe6c365 : 0x69757b, 1);
      customControl.box.setStrokeStyle(isCustom ? 3 : 1, isCustom ? 0xe6c365 : 0x8a7750, 1);
      swatch.setFillStyle(Number.parseInt(placement.color.slice(1), 16), 1);
    };

    refreshColourControls();

    this.sideContent.add(this.add.text(
      SIDE.x + 30,
      SIDE.y + 394,
      'DRAG TO PLACE // FINE ARROWS ON DISPLAY',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#d5bb76',
      }
    ));

    // Touch dragging is intentionally coarse on a small decal. Give the player
    // a separate on-stage D-pad for predictable micro-adjustments.
    const nudgeX = STAGE.x + STAGE.w - 114;
    const nudgeY = STAGE.y + 138;
    const nudgeStepPx = 4;

    this.addDynamic(this.add.text(nudgeX, nudgeY - 66, 'FINE MOVE', {
      fontFamily: PIXEL_FONT,
      fontSize: '6px',
      color: '#f4dfaa',
      backgroundColor: '#081018cc',
      padding: { x: 8, y: 5 },
    }).setOrigin(0.5).setDepth(26));

    const addNudge = (x, y, label, dxPx, dyPx, width = 58) => {
      const box = this.addDynamic(this.add.rectangle(
        x, y, width, 34, 0x0b1720, 0.96
      ).setStrokeStyle(1, 0xd2aa60, 0.95)
        .setInteractive({ useHandCursor: true })
        .setDepth(26));
      this.addDynamic(this.add.text(x, y, label, {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#fff3ce',
      }).setOrigin(0.5).setDepth(27));

      box.on('pointerdown', () => {
        placement.x += dxPx / geometry.displayWidth;
        placement.y += dyPx / geometry.displayHeight;
        positionPreviewFromPlacement(preview);
      });
    };

    addNudge(nudgeX, nudgeY - 34, 'UP', 0, -nudgeStepPx, 52);
    addNudge(nudgeX - 50, nudgeY + 4, 'LEFT', -nudgeStepPx, 0, 70);
    addNudge(nudgeX + 50, nudgeY + 4, 'RIGHT', nudgeStepPx, 0, 70);
    addNudge(nudgeX, nudgeY + 42, 'DOWN', 0, nudgeStepPx, 60);

    makeControl(SIDE.x + 76, SIDE.y + 440, 82, 'SIZE -', () => {
      placement.scale = Phaser.Math.Clamp(placement.scale - 0.015, 0.055, 0.24);
      resizePreview();
    });
    makeControl(SIDE.x + 174, SIDE.y + 440, 82, 'SIZE +', () => {
      placement.scale = Phaser.Math.Clamp(placement.scale + 0.015, 0.055, 0.24);
      resizePreview();
    });
    makeControl(SIDE.x + 272, SIDE.y + 440, 82, 'ROTATE', () => {
      placement.rotation += 10;
      if (placement.rotation > 30) placement.rotation = -30;
      resizePreview();
    });

    makeControl(SIDE.x + SIDE.w / 2, SIDE.y + 502, SIDE.w - 56, 'SAVE DECAL', () => {
      syncPlacementFromPreview(preview);

      const nextStates = { ...(this.registry.get('carStates') || {}) };
      nextStates[carId] = withTunerDecal(nextStates[carId] || {}, this.shop.decalId, placement);
      this.registry.set('carStates', nextStates);
      saveSessionState(this.registry);
      this.showToast(this.shop.decalLabel + ' DECAL SAVED');
      this.showDecalMode();
    });

    makeControl(SIDE.x + SIDE.w / 2, SIDE.y + 560, SIDE.w - 56, 'REMOVE DECAL', () => {
      const nextStates = { ...(this.registry.get('carStates') || {}) };
      nextStates[carId] = withTunerDecal(nextStates[carId] || {}, this.shop.decalId, null);
      this.registry.set('carStates', nextStates);
      saveSessionState(this.registry);
      this.showToast(this.shop.decalLabel + ' DECAL REMOVED');
      this.showDecalMode();
    });

    this.sideContent.add(this.add.text(
      SIDE.x + 30,
      SIDE.y + 607,
      'CUSTOM OPENS YOUR DEVICE COLOUR PICKER.',
      {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: '#78868c',
        fontStyle: '600',
      }
    ));
  }

  openDecalColourPicker(initialColor = '#FFFFFF', onPick = null) {
    this.clearPopup();

    const shade = this.addPopup(this.add.rectangle(
      780,
      420,
      1560,
      840,
      0x020304,
      0.74
    ).setDepth(170).setInteractive());

    const panel = this.addPopup(this.add.rectangle(
      780,
      420,
      720,
      430,
      0x091119,
      0.995
    ).setStrokeStyle(2, 0xe6c365, 1).setDepth(171));

    this.addPopup(this.add.text(780, 260, 'CHOOSE DECAL COLOUR', {
      fontFamily: PIXEL_FONT,
      fontSize: '13px',
      color: '#fff1d5',
    }).setOrigin(0.5).setDepth(172));

    const colours = [
      '#FFFFFF', '#D8D8D8', '#8C8C8C', '#000000',
      '#FF3B30', '#FF9500', '#FFD60A', '#34C759',
      '#00C7BE', '#32ADE6', '#007AFF', '#5856D6',
      '#AF52DE', '#FF2D55', '#7A4B2A', '#C8A46A',
      '#A8E6CF', '#64D2FF', '#5E5CE6', '#BF5AF2',
      '#FF6482', '#E6E6FA', '#F5F0DC', '#C7FF00',
    ];

    const cols = 6;
    const cellW = 88;
    const cellH = 62;
    const startX = 780 - ((cols - 1) * cellW) / 2;
    const startY = 325;

    colours.forEach((color, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * cellW;
      const y = startY + row * cellH;
      const tint = Number.parseInt(color.slice(1), 16);
      const selected = color.toUpperCase() === String(initialColor || '').toUpperCase();

      const swatch = this.addPopup(this.add.rectangle(
        x,
        y,
        60,
        40,
        tint,
        1
      ).setStrokeStyle(selected ? 4 : 2, selected ? 0xe6c365 : 0x707b80, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(172));

      swatch.on('pointerdown', () => {
        onPick?.(color);
        this.clearPopup();
      });
    });

    const cancel = this.addPopup(this.add.rectangle(
      780,
      590,
      270,
      48,
      0x171d21,
      1
    ).setStrokeStyle(1, 0x68747a, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(172));

    this.addPopup(this.add.text(780, 590, 'CANCEL', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#d7e1e5',
    }).setOrigin(0.5).setDepth(173));

    cancel.on('pointerdown', () => this.clearPopup());
    shade.on('pointerdown', () => {});
    panel.setInteractive();
  }

  installSpecialistTune(carId, option) {
    const carStates = { ...(this.registry.get('carStates') || {}) };
    const existing = { ...(carStates[carId] || {}) };
    const installed = getInstalledSpecialistTuning(existing);

    if (existing.stockTuneService || installed.includes(option.id)) return;
    if (!areTunerOptionRequirementsMet(existing, option)) return;

    const cash = Number(this.registry.get('cash') || 0);
    const cost = Math.max(0, Number(option.cost || 0));
    if (cash < cost) return;

    carStates[carId] = {
      ...existing,
      stock: false,
      acquiredVia: existing.acquiredVia || 'garage',
      specialistTuning: [...installed, option.id],
    };

    this.registry.set('carStates', carStates);
    this.registry.set('cash', cash - cost);

    // The decal is earned by using this tuner's work on this specific car.
    // Keep the legacy global entitlement for save compatibility, but actual
    // placement is still checked per-car via specialistTuning.
    if (this.shop?.decalId) {
      const unlocked = new Set(this.registry.get('tunerDecalsUnlocked') || []);
      unlocked.add(this.shop.decalId);
      this.registry.set('tunerDecalsUnlocked', [...unlocked]);
    }

    this.cashText.setText(money(cash - cost));
    saveSessionState(this.registry);

    this.showToast(option.shortName + ' INSTALLED');
    this.showTuningMode();
  }

  drawMechanic() {
    if (this.shop.cosmeticOnly) {
      const feetY = 714;
      const addPerson = (key, x, height, depth) => {
        if (!this.textures.exists(key)) return;
        const source = this.textures.get(key).getSourceImage();
        this.addDynamic(this.add.ellipse(x, feetY - 7, 126, 27, 0x000000, 0.58).setDepth(depth - 1));
        const sprite = this.addDynamic(this.add.image(x, feetY, key)
          .setOrigin(0.5, 1).setDepth(depth));
        sprite.setScale(height / source.height);
      };
      // Sayaka stands immediately to Aruken's left, both grounded at the same floor line.
      addPerson('lbwkSayakaRaceIdle', 163, 347, 13);
      addPerson('lbwkArukenProIdle', 303, 350, 14);
      const infoX = 46, infoY = 724, infoW = 430, infoH = 78;
      this.addDynamic(this.add.rectangle(infoX + infoW / 2, infoY + infoH / 2,
        infoW, infoH, 0x05090d, 0.74).setStrokeStyle(1, 0xd6aa68, 0.48).setDepth(18));
      this.addDynamic(this.add.text(infoX + 18, infoY + 13, 'ARUKEN DENZAKI', {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#f3dfbd'
      }).setDepth(20));
      this.addDynamic(this.add.text(infoX + 18, infoY + 44,
        'GINZA MOTOR GALLERY // COLLABORATOR', {
          fontFamily: PIXEL_FONT, fontSize: '7px', color: '#c2d0d6'
        }).setDepth(20));
      return;
    }
    const character = characters[this.shop.mechanicId];
    if (!character?.visual?.spriteKey || !this.textures.exists(character.visual.spriteKey)) return;

    const shadow = this.addDynamic(this.add.ellipse(
      263,
      706,
      150,
      34,
      0x000000,
      0.62
    ).setDepth(12));

    const sprite = this.addDynamic(this.add.image(
      252,
      714,
      character.visual.spriteKey
    ).setOrigin(0.5, 1).setDepth(14));

    const source = this.textures.get(character.visual.spriteKey).getSourceImage();
    sprite.setScale(350 / source.height);

    const infoX = 46;
    const infoY = 724;
    const infoW = 430;
    const infoH = 78;

    const infoPlate = this.addDynamic(this.add.rectangle(
      infoX + infoW / 2,
      infoY + infoH / 2,
      infoW,
      infoH,
      0x05090d,
      0.74
    ).setStrokeStyle(1, 0xd6aa68, 0.48).setDepth(18));

    const nameText = this.addDynamic(this.add.text(
      infoX + 18,
      infoY + 13,
      String(character.name || '').toUpperCase(),
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#f3dfbd',
      }
    ).setDepth(20));

    const regionText = this.addDynamic(this.add.text(
      infoX + 18,
      infoY + 44,
      String(this.shop.regionId || '').toUpperCase() + ' // REGION MECHANIC',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#c2d0d6',
      }
    ).setDepth(20));

    return { sprite, shadow, infoPlate, nameText, regionText };
  }

  drawPlayerCharacter() {
    const playerId = this.registry.get('playerCharacterId') || 'renMizuno';
    const character = characters[playerId] || characters.renMizuno;
    if (!character?.visual?.spriteKey || !this.textures.exists(character.visual.spriteKey)) return;

    const shadow = this.addDynamic(this.add.ellipse(
      330,
      707,
      140,
      32,
      0x000000,
      0.62
    ).setDepth(12));

    const sprite = this.addDynamic(this.add.image(
      320,
      716,
      character.visual.spriteKey
    ).setOrigin(0.5, 1).setDepth(14));

    const source = this.textures.get(character.visual.spriteKey).getSourceImage();
    sprite.setScale(350 / source.height);

    return { sprite, shadow };
  }

  getStageWheelFit(wheelVisual, bodyScale, wheelSource) {
    return getWheelPairFit(wheelVisual, bodyScale, false, wheelSource);
  }

  getBodyYForWheelBottom(car, targetWidth, wheelBottomY, carState = {}) {
    if (car?.visual?.referenceStandard) return wheelBottomY;
    const bodyKey = getCarBodyTextureKey(this, car);
    const wheelVisual = getVisualModWheelVisual(car, carState);
    if (
      !this.textures.exists(bodyKey) ||
      !wheelVisual?.wheelKey ||
      !this.textures.exists(wheelVisual.wheelKey)
    ) {
      return wheelBottomY - 120;
    }

    const bodySource = this.textures.get(bodyKey).getSourceImage();
    const wheelSource = this.textures.get(wheelVisual.wheelKey).getSourceImage();
    const bodyScale = getCarBodyScaleForWidth(this, car, targetWidth);
    const fit = this.getStageWheelFit(wheelVisual, bodyScale, wheelSource);
    const renderOffsetY = Number(car.visual.renderOffsetY || 0) * bodyScale;
    const rearBottomOffset =
      fit.rear.offsetY + getWheelContactOffsetY(wheelSource, fit.rear.wheelScale);
    const frontBottomOffset =
      fit.front.offsetY + getWheelContactOffsetY(wheelSource, fit.front.wheelScale);

    return wheelBottomY - renderOffsetY - Math.max(rearBottomOffset, frontBottomOffset);
  }

  drawCarOnStage(
    carId,
    x,
    wheelBottomY,
    targetWidth,
    depth,
    track = false,
    { showDecals = true } = {}
  ) {
    const car = cars[carId];
    if (!car) return [];

    const bodyKey = getCarBodyTextureKey(this, car);
    const carState = (this.registry.get('carStates') || {})[carId] || {};
    const wheelVisual = getVisualModWheelVisual(car, carState);
    if (
      !this.textures.exists(bodyKey) ||
      !wheelVisual?.wheelKey ||
      !this.textures.exists(wheelVisual.wheelKey)
    ) {
      return [];
    }

    const bodyY = this.getBodyYForWheelBottom(car, targetWidth, wheelBottomY, carState);
    const source = this.textures.get(bodyKey).getSourceImage();
    const wheelSource = this.textures.get(wheelVisual.wheelKey).getSourceImage();
    const bodyScale = getCarBodyScaleForWidth(this, car, targetWidth);
    const fit = this.getStageWheelFit(wheelVisual, bodyScale, wheelSource);
    const renderOffsetY = Number(car.visual.renderOffsetY || 0) * bodyScale;
    const displayY = bodyY + renderOffsetY;
    const drawX = getReferenceRightX(car, x, bodyScale);

    const rearX = drawX + fit.rear.offsetX;
    const rearY = displayY + fit.rear.offsetY;
    const frontX = drawX + fit.front.offsetX;
    const frontY = displayY + fit.front.offsetY;

    const shadow = this.add.ellipse(
      x,
      wheelBottomY + 5,
      targetWidth * 0.92,
      Math.max(40, targetWidth * 0.062),
      0x000000,
      0.68
    ).setDepth(depth - 0.32);

    const rearWheel = this.add.image(
      rearX,
      rearY,
      wheelVisual.wheelKey
    ).setScale(fit.rear.wheelScale).setDepth(depth);

    const frontWheel = this.add.image(
      frontX,
      frontY,
      wheelVisual.wheelKey
    ).setScale(fit.front.wheelScale).setDepth(depth);

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

    const bodyLayers = createCarBodyLayers(this, car, {
      x: drawX,
      y: displayY,
      scale: bodyScale,
      depth: depth + 1,
      paintColor: getCarPaintColor(carState),
    });

    const visualModObjects = createVisualModLayers(this, car, carState, {
      x: drawX,
      y: displayY,
      scale: bodyScale,
      depth: depth + 1.005,
      paintColor: getCarPaintColor(carState),
      bodyLayers,
    });

    // Correct for each reference PNG's real canvas width while preserving
    // existing saved tuner-shop Y placements (and moving with the car body).
    const decalAnchor = getCarDecalAnchor(car, {
      x: car.visual?.referenceStandard ? drawX : x,
      y: displayY,
      scale: bodyScale,
      sourceWidth: source.width,
      sourceHeight: source.height,
    });
    const decalObjects = showDecals
      ? createTunerDecalLayers(this, carState, {
          x: decalAnchor.x,
          y: decalAnchor.y,
          displayWidth: bodyLayers.primary.displayWidth,
          displayHeight: bodyLayers.primary.displayHeight,
          depth: bodyLayers.layered && bodyLayers.overlay ? depth + 1.012 : depth + 1.04,
        })
      : [];

    const objects = [
      shadow,
      rearBacking,
      frontBacking,
      rearWheel,
      frontWheel,
      ...bodyLayers.objects,
      ...visualModObjects,
      ...decalObjects,
    ];

    objects.geometry = {
      // The placement editor must use the identical anchor as saved decals.
      x: decalAnchor.x,
      displayY: decalAnchor.y,
      displayWidth: bodyLayers.primary.displayWidth,
      displayHeight: bodyLayers.primary.displayHeight,
      bodyScale,
      wheelBottomY,
      targetWidth,
    };

    if (track) objects.forEach(obj => this.addDynamic(obj));
    return objects;
  }

  showLbwkActionError(error) {
    this.addDynamic(this.add.text(SIDE.x+25,SIDE.y+SIDE.h-156,
      'BUILD PREVIEW ERROR — PLEASE RETRY',{
        fontFamily:PIXEL_FONT,fontSize:'8px',color:'#ffac99'
      }).setDepth(62));
  }

  rollInDonor() {
    if (this.conversionInProgress) return;
    const currentCarId=this.getCurrentCarId();
    const donor=cars[currentCarId];
    const donorState=(this.registry.get('carStates')||{})[currentCarId]||{};
    if (!donor || getBaseCarId(currentCarId)!==this.shop.donorCarId ||
        (!this.shop.cosmeticOnly && donorState.stock===false)) return;

    this.conversionInProgress=true;
    this.clearDynamic();
    this.drawMechanic();
    const carObjects=this.drawCarOnStage(currentCarId,720,650,TUNER_STAGE_CAR_WIDTH,10,true);
    if (!carObjects.length) {
      this.conversionInProgress=false;
      this.showHeroMode();
      return;
    }
    const wheelObjects=carObjects.slice(3,5);
    carObjects.forEach(obj=>{obj.x-=1050;});
    // Constant deceleration: the car travels in as the wheels turn and both
    // translation and wheel rotation come to rest on the same frame.
    const arrivalXs=carObjects.map(obj=>obj.x);
    const travel={progress:0};
    this.tweens.add({
      targets:travel,progress:1,duration:2450,ease:'Cubic.easeOut',
      onUpdate:()=>{
        const p=travel.progress;
        const eased=1050*p;
        carObjects.forEach((obj,i)=>{obj.x=arrivalXs[i]+eased;});
        wheelObjects.forEach(obj=>{
          const radius=Math.max(1,obj.displayWidth/2);
          obj.rotation=eased/radius;
        });
      },
      onComplete:()=>{
        this.conversionInProgress=false;
        if (this.shop.cosmeticOnly) this.showLbwkBuildReview();
        else this.showBuildConfirmation();
      }
    });
  }

  showLbwkBuildReview() {
    this.clearPopup();
    if (!this.shop.cosmeticOnly) return this.showBuildConfirmation();
    const currentId=this.getCurrentCarId();
    const donor=cars[currentId],hero=cars[this.shop.heroCarId];
    if (!donor || !hero || getBaseCarId(currentId)!==this.shop.donorCarId) {
      this.showHeroMode();return;
    }
    // The model-selection buttons are scene objects, not sideContent children.
    // Hide and disable them during review to prevent overlapping labels/touch targets.
    (this.lbwkBrowseObjects||[]).forEach(o=>{
      o.setVisible(false);
      if(o.input)o.input.enabled=false;
    });
    this.lbwkIntroText?.setVisible(false);
    this.sideContent.removeAll(true);
    const x=SIDE.x+26;
    const add=(y,value,size='9px',color='#e5edf1')=>
      this.sideContent.add(this.add.text(x,SIDE.y+y,value,{
        fontFamily:PIXEL_FONT,fontSize:size,color,
        wordWrap:{width:SIDE.w-52},lineSpacing:8
      }));
    add(86,'YOUR LBWK BUILD','12px','#ffe2a3');
    add(141,donor.name+'  >  '+hero.name,'8px');
    add(206,'POWER  '+donor.powerKW+' > '+hero.powerKW+' kW','9px');
    add(251,'TORQUE '+donor.torqueNm+' > '+hero.torqueNm+' Nm','9px');
    const quote=this.getLbwkCurrentQuote();
    add(315,'FULL LV3 + 3 NOS SHOTS / DENZAKI TUNE','8px','#ffe2a3');
    add(352,'Your purchased parts are credited. The resulting LBWK collector is sealed and fully upgraded.','8px');
    add(421,'ALL PARTS   '+money(quote?.fullPartsCost||0),'8px');
    add(444,'INSTALLED CREDIT  -'+money(quote?.installedCredit||0),'8px','#a9ddc0');
    add(467,'LBWK PREMIUM  '+money(quote?.specialistPremium||0),'8px');
    add(495,'TO PAY  '+money(quote?.total||0),'9px','#ffe2a3');
    const cash=Number(this.registry.get('cash')||0);
    const owned=(this.registry.get('ownedCarIds')||[]).includes(hero.id);
    const ready=Boolean(quote)&&cash>=quote.total&&!owned;
    const makeAction=(y,label,enabled,handler,highlight=false)=>{
      const box=this.addDynamic(this.add.rectangle(SIDE.x+SIDE.w/2,SIDE.y+y,
        SIDE.w-56,43,highlight?0x392916:0x111d26,1)
        .setStrokeStyle(2,highlight?0xe2b464:0x667783,1)
        .setDepth(75));
      this.addDynamic(this.add.text(SIDE.x+SIDE.w/2,SIDE.y+y,label,{
        fontFamily:PIXEL_FONT,fontSize:'9px',color:'#fff1d5'
      }).setOrigin(0.5).setDepth(76));
      if(enabled)box.setInteractive({useHandCursor:true}).on('pointerdown',handler);
    };
    makeAction(SIDE.h-151,owned?'HERO ALREADY OWNED':ready?'DO THE BUILD':'INSUFFICIENT FUNDS',
      ready,()=>this.showBuildConfirmation(),true);
    makeAction(SIDE.h-98,'BACK',true,()=>this.showHeroMode());

  }

  showBuildConfirmation() {
    this.clearPopup();

    const shade = this.addPopup(this.add.rectangle(
      780,
      420,
      1560,
      840,
      0x020304,
      0.70
    ).setDepth(150).setInteractive());

    const panel = this.addPopup(this.add.rectangle(
      780,
      420,
      650,
      310,
      0x091119,
      0.99
    ).setStrokeStyle(2, 0xe2b464, 1).setDepth(151));

    this.addPopup(this.add.text(780, 335, 'CONFIRM HERO BUILD', {
      fontFamily: PIXEL_FONT,
      fontSize: '14px',
      color: '#fff1d5',
    }).setOrigin(0.5).setDepth(152));

    const quotedPrice=this.shop.cosmeticOnly
      ? (this.getLbwkCurrentQuote()?.total || 0) : Number(this.shop.buildCost||0);
    this.addPopup(this.add.text(
      780,
      392,
      this.shop.donorLabel + ' will be permanently rebuilt as\n' +
        cars[this.shop.heroCarId].name + '.\n\nBUILD COST  ' + money(quotedPrice),
      {
        fontFamily: BODY_FONT,
        fontSize: '13px',
        color: '#d7e0e4',
        fontStyle: '700',
        align: 'center',
        lineSpacing: 6,
      }
    ).setOrigin(0.5).setDepth(152));

    const no = this.addPopup(this.add.rectangle(
      650,
      505,
      210,
      54,
      0x171d21,
      1
    ).setStrokeStyle(1, 0x68747a, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(152));

    const yes = this.addPopup(this.add.rectangle(
      910,
      505,
      210,
      54,
      0x2a2115,
      1
    ).setStrokeStyle(2, 0xe2b464, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(152));

    this.addPopup(this.add.text(650, 505, 'NO', {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#cbd5d9',
    }).setOrigin(0.5).setDepth(153));

    this.addPopup(this.add.text(910, 505, 'YES // BUILD', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#fff1d5',
    }).setOrigin(0.5).setDepth(153));

    no.on('pointerdown', () => {
      this.clearPopup();
      this.showHeroMode();
    });

    yes.on('pointerdown', () => this.confirmHeroConversion());
    shade.on('pointerdown', () => {});
    panel.setInteractive();
  }

  confirmHeroConversion() {
    if (this.conversionInProgress) return;

    const cash = Number(this.registry.get('cash') || 0);
    const quote=this.shop.cosmeticOnly ? this.getLbwkCurrentQuote() : null;
    if(this.shop.cosmeticOnly && !quote) return;
    const cost = Math.max(0, this.shop.cosmeticOnly ? quote.total
      : Number(this.shop.buildCost || 0));
    if (cash < cost) return;

    this.conversionInProgress = true;
    this.clearPopup();

    if (this.shop.cosmeticOnly) {
      const donorCarObjects=this.dynamicObjects.filter(obj=>obj?.active && obj.depth>=9 && obj.depth<12);
      this.tweens.add({
        targets:donorCarObjects,alpha:0,duration:850,ease:'Sine.easeInOut',
        onComplete:()=>{
          const success=this.performHeroConversion();
          if (!success) {
            this.conversionInProgress=false;
            this.showHeroMode();return;
          }
          this.clearDynamic();
          this.drawMechanic();
          const built=this.drawCarOnStage(this.shop.heroCarId,735,650,TUNER_STAGE_CAR_WIDTH,10,true);
          built.forEach(obj=>{obj.alpha=0;});
          this.addDynamic(this.add.text(STAGE.x+STAGE.w/2,STAGE.y+110,
            'LIBERTY WALK // BUILD COMPLETE',{
              fontFamily:PIXEL_FONT,fontSize:'15px',color:'#ffe0a4'
            }).setOrigin(0.5).setDepth(20));
          this.tweens.add({
            targets:built,alpha:1,duration:1100,ease:'Sine.easeInOut',
            onComplete:()=>{
              this.conversionInProgress=false;
              this.cashText.setText(money(this.registry.get('cash')||0));
            }
          });
        }
      });
      return;
    }

    const fade = this.add.rectangle(
      780,
      420,
      1560,
      840,
      0x000000,
      0
    ).setDepth(300);

    this.tweens.add({
      targets: fade,
      alpha: 1,
      duration: 520,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        const success = this.performHeroConversion();
        this.clearDynamic();

        if (success) {
          this.drawPlayerCharacter();
          this.drawCarOnStage(this.shop.heroCarId, 735, 650, TUNER_STAGE_CAR_WIDTH, 10, true);
          this.addDynamic(this.add.text(
            STAGE.x + STAGE.w / 2,
            STAGE.y + 110,
            this.shop.label + ' HERO BUILD COMPLETE',
            {
              fontFamily: PIXEL_FONT,
              fontSize: '15px',
              color: '#ffe0a4',
            }
          ).setOrigin(0.5).setDepth(20));

          this.addDynamic(this.add.text(
            STAGE.x + STAGE.w / 2,
            STAGE.y + 150,
            cars[this.shop.heroCarId].name,
            {
              fontFamily: PIXEL_FONT,
              fontSize: '10px',
              color: '#ffffff',
            }
          ).setOrigin(0.5).setDepth(20));
        } else {
          this.drawMechanic();
        }

        this.tweens.add({
          targets: fade,
          alpha: 0,
          duration: 650,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            fade.destroy();
            this.conversionInProgress = false;
            this.cashText.setText(money(this.registry.get('cash') || 0));
            if (!success) this.showHeroMode();
          },
        });
      },
    });
  }

  performHeroConversion() {
    const donorBaseId = this.shop.donorCarId;
    const donorId = this.getCurrentCarId();
    const heroId = this.shop.heroCarId;
    const owned = [...(this.registry.get('ownedCarIds') || [])];
    const donorIndex = owned.indexOf(donorId);
    if (
      !donorId ||
      getBaseCarId(donorId) !== donorBaseId ||
      donorIndex < 0 ||
      owned.includes(heroId)
    ) return false;

    const carStates = { ...(this.registry.get('carStates') || {}) };
    const donorState = carStates[donorId] || {};
    if (!this.shop.cosmeticOnly && donorState.stock === false) return false;
    if (this.shop.cosmeticOnly && !isTunerShopUnlocked(this.registry, this.regionId)) return false;

    const cash = Number(this.registry.get('cash') || 0);
    const quote=this.shop.cosmeticOnly
      ? getLbwkConversionQuote(LBWK_CATALOG.find(item=>item.id===heroId),donorState)
      : null;
    if(this.shop.cosmeticOnly && !quote) return false;
    const cost=Math.max(0,this.shop.cosmeticOnly?quote.total:Number(this.shop.buildCost||0));
    if(cash<cost) return false;

    const locations = { ...(this.registry.get('carGarageLocations') || {}) };
    const donorLocation = locations[donorId] || this.registry.get('workshopLocationId') || 'shinonomeWorkshop';

    recordCarDeparture(this.registry, donorId, 'converted', {
      convertedTo: heroId,
    });

    owned.splice(donorIndex, 1, heroId);
    delete carStates[donorId];
    carStates[heroId] = {
      stock: false,
      collector: true,
      immutable: true,
      tuningLocked: true,
      acquiredVia: 'tuner-shop',
      nosInstalled: Boolean(this.shop.cosmeticOnly),
      lbwkFullWorks: Boolean(this.shop.cosmeticOnly),
      lbwkPartsCredit: quote?.installedCredit || 0,
      lbwkPremiumPaid: quote?.specialistPremium || 0,
      tunerShopId: this.shop.id,
      convertedFrom: donorId,
      builtAt: Date.now(),
    };

    delete locations[donorId];
    locations[heroId] = donorLocation;

    const progress = { ...(this.registry.get('tunerShopProgress') || {}) };
    progress[this.shop.id] = {
      ...(progress[this.shop.id] || {}),
      discovered: true,
      heroBuilt: true,
      heroCarId: heroId,
      builtAt: Date.now(),
    };

    this.registry.set('ownedCarIds', owned);
    this.registry.set('selectedCarId', heroId);
    this.registry.set('carStates', carStates);
    this.registry.set('carGarageLocations', locations);
    this.registry.set('tunerShopProgress', progress);
    this.registry.set('cash', cash - cost);
    this.registry.set('gameOver', false);
    recordCarAcquisition(this.registry, heroId, {
      acquiredVia: 'tuner-shop',
      convertedFrom: donorId,
    });
    saveSessionState(this.registry);

    return true;
  }

  showToast(message) {
    const bg = this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + 60,
      420,
      48,
      0x07151a,
      0.96
    ).setStrokeStyle(1, 0x62c9c2, 1).setDepth(180);

    const text = this.add.text(
      STAGE.x + STAGE.w / 2,
      STAGE.y + 60,
      message,
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#eafffc',
      }
    ).setOrigin(0.5).setDepth(181);

    this.time.delayedCall(1600, () => {
      bg.destroy();
      text.destroy();
    });
  }

  openMap() {
    const district = String(this.registry.get('district') || '').toUpperCase();
    const currentLocationId =
      this.returnLocationId ||
      (district === 'CENTRAL_TOKYO'
        ? this.registry.get('centralTokyoLocation')
        : this.registry.get('meetLocation')) ||
      'odaiba7eleven';

    showTravelMap(this, {
      currentLocationId,
      title: 'TOKYO REGION MAP',
      actionVerb: 'DRIVE',
      allowCurrentAction: false,
      fromWorkshop: false,
      onHome: (workshopLocationId, cost) =>
        this.returnToWorkshop(workshopLocationId, cost),
      onWorkshopUpgrade: (location, cost, alreadyUnlocked) =>
        this.upgradeWorkshopFromMap(location, cost, alreadyUnlocked),
      onTravel: (locationId, cost) => this.travelToLocation(locationId, cost),
    });
  }

  travelToLocation(locationId, cost = 0) {
    const target = getTravelLocation(locationId);
    if (!target) return;

    const price = Math.max(0, Number(cost || 0));
    const cash = Number(this.registry.get('cash') || 0);
    if (cash < price) return;

    this.registry.set('cash', cash - price);
    this.cashText?.setText(money(cash - price));
    this.registry.set('meetStranded', false);

    if (String(target.regionId || '').toUpperCase() === 'CENTRAL_TOKYO') {
      this.registry.set('centralTokyoLocation', locationId);
      this.registry.set('district', 'CENTRAL_TOKYO');
      saveSessionState(this.registry);
      this.scene.start('CentralTokyoScene', { locationId });
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

    if (selectedCarId && ownedCarIds.includes(selectedCarId)) {
      locations[selectedCarId] = location.id;
      this.registry.set('carGarageLocations', locations);
    }

    this.registry.set('meetStranded', false);
    saveSessionState(this.registry);

    try {
      sessionStorage.setItem('tokyoShiftInternalReload', '1');
      sessionStorage.setItem('tokyoShiftForceGarage', '1');
      sessionStorage.removeItem('tokyoShiftBootMessage');
    } catch (e) {}

    window.location.reload();
  }

  returnToWorkshop(workshopLocationId = 'shinonomeWorkshop', cost = 500) {
    const cash = Number(this.registry.get('cash') || 0);
    const price = Math.max(0, Number(cost || 0));
    if (cash < price) return;

    this.registry.set('cash', cash - price);
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
}
