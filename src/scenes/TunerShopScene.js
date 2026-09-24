import { cars } from '../data/cars.js?v=20260924-r171';
import { characters } from '../data/characters.js?v=20260924-r167';
import {
  getTunerShopForRegion,
  isTunerShopUnlocked,
  getInstalledSpecialistTuning,
  areTunerOptionRequirementsMet,
} from '../data/tunerShops.js?v=20260924-r168';
import { saveSessionState } from '../state/GameState.js?v=20260924-r172';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';
import {
  getCarBodyTextureKey,
  createCarBodyLayers,
  getCarPaintColor,
} from '../vehicles/CarAppearance.js?v=20260924-r170';
import {
  getWheelPairFit,
  getWheelContactOffsetY,
} from '../vehicles/WheelFit.js?v=20260923-r160';
import {
  normaliseTunerDecals,
  withTunerDecal,
  carHasShopTune,
  createTunerDecalObject,
  createTunerDecalLayers,
} from '../vehicles/TunerDecals.js?v=20260924-r172';
import { showTravelMap } from '../ui/TravelMap.js?v=20260924-r172';
import { getTravelLocation } from '../data/travelRegions.js?v=20260923-r139';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const STAGE = { x: 24, y: 92, w: 1138, h: 724 };
const SIDE = { x: 1180, y: 92, w: 356, h: 724 };

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

  create() {
    document.body.dataset.scene = 'garage';
    this.scale.resize(1560, 840);
    playMusic('workshop');

    this.shop = getTunerShopForRegion(this.regionId);

    if (!this.shop || !isTunerShopUnlocked(this.registry, this.regionId)) {
      this.scene.start('GarageScene');
      return;
    }

    this.mode = 'HERO';
    this.dynamicObjects = [];
    this.popupObjects = [];
    this.conversionInProgress = false;

    this.recordShopVisit();
    this.drawBase();
    this.drawHeader();
    this.drawSidePanel();
    this.showHeroMode();
  }

  recordShopVisit() {
    const progress = { ...(this.registry.get('tunerShopProgress') || {}) };
    progress[this.shop.id] = {
      ...(progress[this.shop.id] || {}),
      discovered: true,
      visited: true,
      visitedAt: progress[this.shop.id]?.visitedAt || Date.now(),
    };
    this.registry.set('tunerShopProgress', progress);
    saveSessionState(this.registry);
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

    let textureKey = this.shop.backgroundKey;
    if (!this.textures.exists(textureKey)) {
      textureKey = this.textures.exists('garageWorkshopBg') ? 'garageWorkshopBg' : null;
    }

    if (textureKey) {
      const image = this.add.image(
        STAGE.x + STAGE.w / 2,
        STAGE.y + STAGE.h / 2,
        textureKey
      ).setDepth(-10);

      const source = this.textures.get(textureKey).getSourceImage();
      const scale = Math.max(STAGE.w / source.width, STAGE.h / source.height);
      image.setScale(scale);

      const scaledHeight = source.height * scale;
      image.setPosition(
        STAGE.x + STAGE.w / 2,
        STAGE.y + STAGE.h - scaledHeight / 2
      );

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
      this.add.text(
        STAGE.x + STAGE.w / 2,
        STAGE.y + STAGE.h / 2,
        'BACKGROUND ASSET PENDING\n' + this.shop.backgroundPath,
        {
          fontFamily: PIXEL_FONT,
          fontSize: '10px',
          color: '#887b6c',
          align: 'center',
        }
      ).setOrigin(0.5).setDepth(-8);
    }

    this.stageLabelBox = this.add.rectangle(
      STAGE.x + 190,
      STAGE.y + 33,
      340,
      42,
      0x100f0c,
      0.84
    ).setStrokeStyle(1, 0xe6b66a, 0.72).setDepth(18);

    this.stageLabelText = this.add.text(
      STAGE.x + 30,
      STAGE.y + 33,
      '',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#ffe1ac',
      }
    ).setOrigin(0, 0.5).setDepth(19);
  }

  setStageLabel(label = '') {
    this.stageLabelText?.setText(String(label || '').toUpperCase());
  }

  drawHeader() {
    this.add.rectangle(780, 35, 1512, 62, 0x07111d, 1)
      .setStrokeStyle(2, 0x453827, 1)
      .setDepth(40);

    this.add.text(52, 35, this.regionId + ' // TUNER SHOP', {
      fontFamily: PIXEL_FONT,
      fontSize: '18px',
      color: '#fff4df',
    }).setOrigin(0, 0.5).setDepth(42);

    this.add.text(465, 35, this.shop.label, {
      fontFamily: PIXEL_FONT,
      fontSize: '12px',
      color: '#e8b969',
    }).setOrigin(0, 0.5).setDepth(42);

    this.cashText = this.add.text(1510, 35, money(this.registry.get('cash') || 0), {
      fontFamily: PIXEL_FONT,
      fontSize: '11px',
      color: '#f0dfbf',
    }).setOrigin(1, 0.5).setDepth(42);
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

    const makeTab = (y, label, fill, stroke, fontSize = '9px') => {
      const box = this.add.rectangle(
        SIDE.x + SIDE.w / 2,
        SIDE.y + y,
        SIDE.w - 56,
        50,
        fill,
        1
      ).setStrokeStyle(2, stroke, 0.95)
        .setInteractive({ useHandCursor: true })
        .setDepth(31);

      const text = this.add.text(
        SIDE.x + SIDE.w / 2,
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
    this.tuneTab = makeTab(180, 'SPECIALIST TUNING', 0x101d22, 0x4f8b91, '8px');
    this.decalTab = makeTab(242, 'SHOP DECAL', 0x15191d, 0x59646a, '8px');

    this.heroTab.box.on('pointerdown', () => this.showHeroMode());
    this.tuneTab.box.on('pointerdown', () => this.showTuningMode());
    this.decalTab.box.on('pointerdown', () => this.showDecalMode());

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
    const heroActive = this.mode === 'HERO';
    const tuneActive = this.mode === 'TUNING';
    const decalActive = this.mode === 'DECAL';

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

    const hero = cars[this.shop.heroCarId];
    if (hero) {
      this.drawCarOnStage(hero.id, 720, 650, 770, 10, true);
      this.setStageLabel((hero.shortName || hero.name) + ' // HERO BUILD');
    } else {
      this.setStageLabel('HERO BUILD');
    }

    this.addDynamic(this.add.text(
      STAGE.x + 48,
      STAGE.y + 92,
      'SIGNATURE BUILD',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '10px',
        color: '#f0be70',
      }
    ).setDepth(20));

    this.addDynamic(this.add.text(
      STAGE.x + 48,
      STAGE.y + 128,
      hero?.name || this.shop.label + ' HERO CAR',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '13px',
        color: '#ffffff',
      }
    ).setDepth(20));

    const currentCarId = this.getCurrentCarId();
    const owned = this.registry.get('ownedCarIds') || [];
    const carStates = this.registry.get('carStates') || {};
    const donorExists = Boolean(cars[this.shop.donorCarId]);
    const currentIsDonor = currentCarId === this.shop.donorCarId;
    const donorState = currentIsDonor ? (carStates[currentCarId] || {}) : {};
    const donorStock = currentIsDonor && donorState.stock !== false;
    const heroOwned = owned.includes(this.shop.heroCarId);
    const cost = Number(this.shop.buildCost || 0);
    const cash = Number(this.registry.get('cash') || 0);

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

    this.sideContent.add(this.add.text(SIDE.x + 30, SIDE.y + 392, money(cost), {
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
      label = 'BRING YOUR STOCK ' + this.shop.donorLabel;
      enabled = false;
    } else if (!donorStock) {
      label = 'CURRENT DONOR MUST BE STOCK';
      enabled = false;
    } else if (cash < cost) {
      label = 'NEED ' + money(cost);
      enabled = false;
    }

    const buildButton = this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 446,
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
      SIDE.y + 446,
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
      SIDE.y + 496,
      'The build only accepts the car you actually\nbrought here. Your stock donor rolls in, is\nconverted, then becomes the sealed hero car.',
      {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: '#83939b',
        fontStyle: '600',
        lineSpacing: 4,
      }
    ));
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
      const label = currentId ? (cars[currentId]?.shortName || currentId) : 'NO CAR';
      this.setStageLabel(label + ' // CURRENT CAR');

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
        SIDE.y + 314,
        currentId ? 'THIS CAR IS NOT TUNABLE HERE' : 'NO CURRENT CAR',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '8px',
          color: '#79868c',
        }
      ));
      return;
    }

    const car = cars[carId];
    const carState = (this.registry.get('carStates') || {})[carId] || {};

    this.drawCarOnStage(carId, 720, 650, 730, 10, true);
    this.setStageLabel((car.shortName || car.name) + ' // CURRENT CAR');

    this.addDynamic(this.add.text(STAGE.x + 48, STAGE.y + 94, 'SPECIALIST TUNING', {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#72d8d1',
    }).setDepth(20));

    this.addDynamic(this.add.text(STAGE.x + 48, STAGE.y + 132, car.name, {
      fontFamily: PIXEL_FONT,
      fontSize: '12px',
      color: '#ffffff',
    }).setDepth(20));

    this.sideContent.add(this.add.text(SIDE.x + 30, SIDE.y + 292, 'CURRENT CAR', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#78999a',
    }));

    const carPanel = this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 334,
      SIDE.w - 56,
      50,
      0x102024,
      1
    ).setStrokeStyle(1, 0x4d767a, 1);

    const carName = this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 334,
      car.shortName,
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#e7ffff',
        align: 'center',
        wordWrap: { width: SIDE.w - 92 },
      }
    ).setOrigin(0.5);

    this.sideContent.add(carPanel);
    this.sideContent.add(carName);

    const installed = new Set(getInstalledSpecialistTuning(carState));
    const options = this.shop.tuningOptions || [];
    const startY = SIDE.y + 410;

    options.forEach((option, index) => {
      const y = startY + index * 92;
      const isInstalled = installed.has(option.id);
      const requirementsMet = areTunerOptionRequirementsMet(carState, option);
      const affordable = Number(this.registry.get('cash') || 0) >= Number(option.cost || 0);
      const enabled = !isInstalled && requirementsMet && affordable;

      const box = this.add.rectangle(
        SIDE.x + SIDE.w / 2,
        y,
        SIDE.w - 56,
        80,
        isInstalled ? 0x15241d : enabled ? 0x10262a : 0x151a1c,
        1
      ).setStrokeStyle(
        isInstalled || enabled ? 2 : 1,
        isInstalled ? 0x62b98a : enabled ? 0x65cfc8 : 0x465157,
        1
      );

      const name = this.add.text(
        SIDE.x + 30,
        y - 31,
        option.shortName || option.name,
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: isInstalled ? '#a9e4bd' : enabled ? '#e9fffb' : '#879296',
          wordWrap: { width: SIDE.w - 92 },
        }
      );

      const benefit = this.add.text(
        SIDE.x + 30,
        y - 10,
        option.benefit,
        {
          fontFamily: BODY_FONT,
          fontSize: '8px',
          color: '#91adb0',
          fontStyle: '700',
        }
      );

      let metaText = money(option.cost);
      if (isInstalled) metaText = 'INSTALLED';
      else if (!requirementsMet) metaText = option.requirementLabel;
      else if (!affordable) metaText = 'NEED ' + money(option.cost);

      const meta = this.add.text(
        SIDE.x + 30,
        y + 15,
        metaText,
        {
          fontFamily: PIXEL_FONT,
          fontSize: '6px',
          color: isInstalled ? '#8dd0a4' : enabled ? '#d9b66f' : '#717d82',
          wordWrap: { width: SIDE.w - 94 },
        }
      );

      [box, name, benefit, meta].forEach(obj => this.sideContent.add(obj));

      if (enabled) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => this.installSpecialistTune(carId, option));
      }
    });
  }

  showDecalMode() {
    if (this.conversionInProgress) return;
    this.mode = 'DECAL';
    this.clearDynamic();
    this.setTabStyle();
    this.drawMechanic();

    const carId = this.getCurrentTunableCarId();
    if (!carId) {
      this.setStageLabel('NO CAR // DECAL');
      this.sideContent.add(this.add.text(
        SIDE.x + 30,
        SIDE.y + 314,
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

    const car = cars[carId];
    const carStates = this.registry.get('carStates') || {};
    const carState = carStates[carId] || {};
    const eligible = carHasShopTune(carState, this.shop);

    const carObjects = this.drawCarOnStage(
      carId,
      720,
      650,
      730,
      10,
      true,
      { showDecals: false }
    );

    this.setStageLabel((car.shortName || car.name) + ' // ' + this.shop.decalLabel + ' DECAL');

    this.addDynamic(this.add.text(STAGE.x + 48, STAGE.y + 94, 'SHOP DECAL', {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: eligible ? '#f0c96f' : '#7f8588',
    }).setDepth(20));

    this.addDynamic(this.add.text(STAGE.x + 48, STAGE.y + 132, car.name, {
      fontFamily: PIXEL_FONT,
      fontSize: '12px',
      color: '#ffffff',
    }).setDepth(20));

    this.sideContent.add(this.add.text(SIDE.x + 30, SIDE.y + 292, 'CURRENT CAR', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#8d9699',
    }));

    this.sideContent.add(this.add.text(
      SIDE.x + 30,
      SIDE.y + 324,
      car.shortName,
      {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: '#eff7f7',
      }
    ));

    if (!eligible) {
      this.sideContent.add(this.add.text(
        SIDE.x + 30,
        SIDE.y + 382,
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

    const existing = normaliseTunerDecals(carState)[this.shop.decalId];
    const placement = {
      x: Number(existing?.x ?? 0.06),
      y: Number(existing?.y ?? -0.01),
      scale: Number(existing?.scale ?? 0.13),
      rotation: Number(existing?.rotation ?? 0),
    };

    const createPreview = () => {
      const preview = createTunerDecalObject(this, this.shop.decalId, {
        x: geometry.x + placement.x * geometry.displayWidth,
        y: geometry.displayY + placement.y * geometry.displayHeight,
        displayWidth: geometry.displayWidth,
        depth: 22,
        placement,
      });
      preview.setInteractive({ useHandCursor: true, draggable: true });
      this.input.setDraggable(preview);
      this.addDynamic(preview);

      preview.on('drag', (pointer, dragX, dragY) => {
        const minX = geometry.x - geometry.displayWidth * 0.34;
        const maxX = geometry.x + geometry.displayWidth * 0.34;
        const minY = geometry.displayY - geometry.displayHeight * 0.13;
        const maxY = geometry.displayY + geometry.displayHeight * 0.15;
        preview.x = Phaser.Math.Clamp(dragX, minX, maxX);
        preview.y = Phaser.Math.Clamp(dragY, minY, maxY);
      });

      return preview;
    };

    let preview = createPreview();

    const resizePreview = () => {
      const rawWidth = Math.max(1, Number(preview.width || 1));
      preview.setScale((geometry.displayWidth * placement.scale) / rawWidth);
      preview.setAngle(placement.rotation);
    };

    const makeControl = (x, y, width, label, handler) => {
      const box = this.add.rectangle(x, y, width, 42, 0x171d20, 1)
        .setStrokeStyle(1, 0x667176, 1)
        .setInteractive({ useHandCursor: true });
      const text = this.add.text(x, y, label, {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#dbe4e7',
      }).setOrigin(0.5);
      box.on('pointerdown', handler);
      this.sideContent.add(box);
      this.sideContent.add(text);
      return box;
    };

    this.sideContent.add(this.add.text(
      SIDE.x + 30,
      SIDE.y + 374,
      'DRAG THE DECAL ONTO THE BODY',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#d5bb76',
      }
    ));

    makeControl(SIDE.x + 76, SIDE.y + 430, 82, 'SIZE -', () => {
      placement.scale = Phaser.Math.Clamp(placement.scale - 0.015, 0.055, 0.24);
      resizePreview();
    });
    makeControl(SIDE.x + 174, SIDE.y + 430, 82, 'SIZE +', () => {
      placement.scale = Phaser.Math.Clamp(placement.scale + 0.015, 0.055, 0.24);
      resizePreview();
    });
    makeControl(SIDE.x + 272, SIDE.y + 430, 82, 'ROTATE', () => {
      placement.rotation += 10;
      if (placement.rotation > 30) placement.rotation = -30;
      resizePreview();
    });

    makeControl(SIDE.x + SIDE.w / 2, SIDE.y + 490, SIDE.w - 56, 'SAVE DECAL', () => {
      placement.x = (preview.x - geometry.x) / geometry.displayWidth;
      placement.y = (preview.y - geometry.displayY) / geometry.displayHeight;

      const nextStates = { ...(this.registry.get('carStates') || {}) };
      nextStates[carId] = withTunerDecal(nextStates[carId] || {}, this.shop.decalId, placement);
      this.registry.set('carStates', nextStates);
      saveSessionState(this.registry);
      this.showToast(this.shop.decalLabel + ' DECAL SAVED');
      this.showDecalMode();
    });

    makeControl(SIDE.x + SIDE.w / 2, SIDE.y + 548, SIDE.w - 56, 'REMOVE DECAL', () => {
      const nextStates = { ...(this.registry.get('carStates') || {}) };
      nextStates[carId] = withTunerDecal(nextStates[carId] || {}, this.shop.decalId, null);
      this.registry.set('carStates', nextStates);
      saveSessionState(this.registry);
      this.showToast(this.shop.decalLabel + ' DECAL REMOVED');
      this.showDecalMode();
    });

    this.sideContent.add(this.add.text(
      SIDE.x + 30,
      SIDE.y + 594,
      'A simple wordmark is used until the final\ntransparent shop-logo PNG is supplied.',
      {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: '#78868c',
        fontStyle: '600',
        lineSpacing: 4,
      }
    ));
  }

  installSpecialistTune(carId, option) {
    const carStates = { ...(this.registry.get('carStates') || {}) };
    const existing = { ...(carStates[carId] || {}) };
    const installed = getInstalledSpecialistTuning(existing);

    if (installed.includes(option.id)) return;
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

    this.addDynamic(this.add.text(
      64,
      730,
      character.name + ' // ENGINEER',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#e7cfaa',
      }
    ).setDepth(20));

    return { sprite, shadow };
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

  getStageWheelFit(car, bodyScale, wheelSource) {
    const fit = getWheelPairFit(car.visual, bodyScale, false, wheelSource);

    // Normal cars use the legacy/general wheel artwork. In the tuner-house
    // scene they were reading visibly undersized against the larger display
    // body. Hero cars already use their individually calibrated fit and must
    // not be boosted.
    if (!car.visual.singleBody) {
      const boost = 1.14;
      fit.rear.wheelScale *= boost;
      fit.front.wheelScale *= boost;
    }

    return fit;
  }

  getBodyYForWheelBottom(car, targetWidth, wheelBottomY) {
    const bodyKey = getCarBodyTextureKey(this, car);
    if (!this.textures.exists(bodyKey) || !this.textures.exists(car.visual.wheelKey)) {
      return wheelBottomY - 120;
    }

    const bodySource = this.textures.get(bodyKey).getSourceImage();
    const wheelSource = this.textures.get(car.visual.wheelKey).getSourceImage();
    const bodyScale = targetWidth / bodySource.width;
    const fit = this.getStageWheelFit(car, bodyScale, wheelSource);
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
    if (!this.textures.exists(bodyKey) || !this.textures.exists(car.visual.wheelKey)) {
      return [];
    }

    const bodyY = this.getBodyYForWheelBottom(car, targetWidth, wheelBottomY);
    const source = this.textures.get(bodyKey).getSourceImage();
    const wheelSource = this.textures.get(car.visual.wheelKey).getSourceImage();
    const bodyScale = targetWidth / source.width;
    const fit = this.getStageWheelFit(car, bodyScale, wheelSource);
    const renderOffsetY = Number(car.visual.renderOffsetY || 0) * bodyScale;
    const displayY = bodyY + renderOffsetY;

    const rearX = x + fit.rear.offsetX;
    const rearY = displayY + fit.rear.offsetY;
    const frontX = x + fit.front.offsetX;
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
      car.visual.wheelKey
    ).setScale(fit.rear.wheelScale).setDepth(depth);

    const frontWheel = this.add.image(
      frontX,
      frontY,
      car.visual.wheelKey
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

    const carState = (this.registry.get('carStates') || {})[carId] || {};
    const bodyLayers = createCarBodyLayers(this, car, {
      x,
      y: displayY,
      scale: bodyScale,
      depth: depth + 1,
      paintColor: getCarPaintColor(carState),
    });

    const decalObjects = showDecals
      ? createTunerDecalLayers(this, carState, {
          x,
          y: displayY,
          displayWidth: bodyLayers.primary.displayWidth,
          displayHeight: bodyLayers.primary.displayHeight,
          depth: depth + 1.04,
        })
      : [];

    const objects = [
      shadow,
      rearBacking,
      frontBacking,
      rearWheel,
      frontWheel,
      ...bodyLayers.objects,
      ...decalObjects,
    ];

    objects.geometry = {
      x,
      displayY,
      displayWidth: bodyLayers.primary.displayWidth,
      displayHeight: bodyLayers.primary.displayHeight,
      bodyScale,
      wheelBottomY,
      targetWidth,
    };

    if (track) objects.forEach(obj => this.addDynamic(obj));
    return objects;
  }

  rollInDonor() {
    if (this.conversionInProgress) return;

    const donor = cars[this.shop.donorCarId];
    const owned = this.registry.get('ownedCarIds') || [];
    const donorState = (this.registry.get('carStates') || {})[this.shop.donorCarId] || {};

    if (!donor || !owned.includes(this.shop.donorCarId) || donorState.stock === false) return;

    this.conversionInProgress = true;
    this.clearDynamic();
    this.drawMechanic();

    const carObjects = this.drawCarOnStage(
      this.shop.donorCarId,
      720,
      650,
      730,
      10,
      true
    );

    carObjects.forEach(obj => {
      obj.x -= 1100;
    });

    this.tweens.add({
      targets: carObjects,
      x: '+=1100',
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.conversionInProgress = false;
        this.showBuildConfirmation();
      },
    });
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

    this.addPopup(this.add.text(
      780,
      392,
      this.shop.donorLabel + ' will be permanently rebuilt as\n' +
        cars[this.shop.heroCarId].name + '.\n\nBUILD COST  ' + money(this.shop.buildCost),
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
    const cost = Math.max(0, Number(this.shop.buildCost || 0));
    if (cash < cost) return;

    this.conversionInProgress = true;
    this.clearPopup();

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
          this.drawCarOnStage(this.shop.heroCarId, 735, 650, 780, 10, true);
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
    const donorId = this.shop.donorCarId;
    const heroId = this.shop.heroCarId;
    const owned = [...(this.registry.get('ownedCarIds') || [])];
    const donorIndex = owned.indexOf(donorId);
    if (donorIndex < 0 || owned.includes(heroId)) return false;

    const carStates = { ...(this.registry.get('carStates') || {}) };
    const donorState = carStates[donorId] || {};
    if (donorState.stock === false) return false;

    const cash = Number(this.registry.get('cash') || 0);
    const cost = Math.max(0, Number(this.shop.buildCost || 0));
    if (cash < cost) return false;

    const locations = { ...(this.registry.get('carGarageLocations') || {}) };
    const donorLocation = locations[donorId] || this.registry.get('workshopLocationId') || 'shinonomeWorkshop';

    owned.splice(donorIndex, 1, heroId);
    delete carStates[donorId];
    carStates[heroId] = {
      stock: false,
      collector: true,
      immutable: true,
      tuningLocked: true,
      acquiredVia: 'tuner-shop',
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

  leaveWorkshop() {
    saveSessionState(this.registry);

    if (this.returnScene === 'MeetScene') {
      this.scene.start('MeetScene');
      return;
    }

    if (this.returnScene === 'CentralTokyoScene') {
      const locationId = this.registry.get('centralTokyoLocation') || this.returnLocationId;
      this.scene.start('CentralTokyoScene', { locationId });
      return;
    }

    this.scene.start('GarageScene');
  }
}
