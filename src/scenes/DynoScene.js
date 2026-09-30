import TouchControls from '../input/TouchControls.js?v=20260930-r299';
import RaceHUD from '../ui/RaceHUD.js?v=20260930-r292';
import EngineAudioSystem from '../audio/EngineAudioSystem.js?v=20260930-r300';
import Turbo from '../vehicles/Turbo.js';
import { cars } from '../data/cars.js?v=20260928-r232';
import { characters } from '../data/characters.js?v=20260929-r275';
import { saveSessionState } from '../state/GameState.js?v=20260930-r288';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';
import {
  DYNO_WAREHOUSE_ID,
  getDynoStage,
  getDynoNextStage,
  getRecommendedDynoGear,
  buildDynoCar,
  getDynoPoint,
  analyseDynoRun,
} from '../data/dyno.js?v=20260930-r301';
import {
  getCarBodyScaleForWidth,
  getCarPaintColor,
  createCarBodyLayers,
  preloadCarAppearanceAssets,
  preloadCarWheel,
  ensureDerivedModularCarTextures,
} from '../vehicles/CarAppearance.js?v=20260929-r246';
import {
  getVisualModWheelVisual,
  createVisualModLayers,
  preloadVisualModSelectionAssets,
} from '../data/visualMods.js?v=20260929-r266';
import {
  createTunerDecalLayers,
  preloadTunerDecalAssets,
} from '../vehicles/TunerDecals.js?v=20260928-r242';
import { getWheelPairFit, getWheelContactOffsetY } from '../vehicles/WheelFit.js?v=20260929-r258';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20260930-r292';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';
const WIDTH = 1560;
const HEIGHT = 840;
const MONITOR = { x: 163, y: 82, w: 505, h: 230 };
const CAR_X = 780;
const CAR_TARGET_WIDTH = 650;
const WHEEL_CONTACT_Y = 600;

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

export default class DynoScene extends Phaser.Scene {
  constructor() {
    super('DynoScene');
  }

  preload() {
    let queued = 0;
    const queueImage = (key, path) => {
      if (!key || !path || this.textures.exists(key)) return;
      this.load.image(key, path);
      queued += 1;
    };

    queueImage('dynoWarehouseDayBg', 'assets/Garage/shinonome_dyno_day.png?v=20260930-r289');
    queueImage('hudCluster', 'assets/Ui/hud_cluster.png');
    queueImage('clutchPedal', 'assets/Controls/clutch_pedal.png');
    queueImage('throttlePedal', 'assets/Controls/throttle_pedal.png');
    queueImage('nosButton', 'assets/Controls/nos_button.png');
    queueImage('shifterNeutral', 'assets/Controls/shifter_neutral.png');
    queueImage('shifterDown', 'assets/Controls/shifter_down.png');

    const daichi = characters.daichiSakamoto;
    if (daichi?.visual) {
      queueImage(daichi.visual.spriteKey, daichi.visual.path + '?v=20260926-r213');
    }

    const carId = this.resolveCarId();
    const car = cars[carId];
    const state = (this.registry.get('carStates') || {})[carId] || {};
    if (car) {
      queued += preloadCarAppearanceAssets(this, { [carId]: car }, '20260930-r288');
      queued += preloadCarWheel(this, car, state);
      queued += preloadVisualModSelectionAssets(this, carId, state, '20260930-r288');
      queued += preloadTunerDecalAssets(this, state, '20260930-r288');
    }

    startSceneLoading(this, 'LOADING DYNO CELL', queued);
  }

  resolveCarId() {
    const owned = (this.registry.get('ownedCarIds') || []).filter(id => cars[id]);
    const locations = this.registry.get('carGarageLocations') || {};
    const warehouseCars = owned.filter(id => locations[id] === DYNO_WAREHOUSE_ID);
    const selected = this.registry.get('selectedCarId');
    return warehouseCars.includes(selected) ? selected : (warehouseCars[0] || null);
  }

  create() {
    document.body.dataset.scene = 'dyno';
    this.scale.resize(WIDTH, HEIGHT);
    playMusic('workshop');

    this.carId = this.resolveCarId();
    this.carState = (this.registry.get('carStates') || {})[this.carId] || {};
    this.facilityTier = Math.max(0, Number(this.registry.get('dynoFacilityTier') || 0));
    this.stage = getDynoStage(this.facilityTier);
    this.sessionPullsRemaining = 0;
    this.pullState = 'IDLE';
    this.points = [];
    this.previousRun = this.carState?.dyno?.lastRun || null;
    this.controls = null;
    // Dyno uses the race engine voice in single-car mode. This restores the
    // live engine/turbo sound without constructing an unnecessary rival voice.
    this.audio = null;
    this.dynoAudioEnabled = true;
    this.turbo = null;
    this.currentGear = 0;
    this.currentRPM = 0;
    this.currentBoost = 0;
    this.runProgress = 0;
    this.lowThrottleTime = 0;
    this.lastRecordedRPM = 0;
    this.lastRecordedTime = 0;
    this.vehicleSpeedMps = 0;
    this.vehicleDistanceM = 0;
    this.dynoRunTime = 0;
    this.dynoRunMode = 'power';
    this.shiftEvents = [];
    this.shiftCooldown = 0;
    this.shiftLabelObjects = this.shiftLabelObjects || [];
    this.wheelObjects = [];
    this.carObjects = [];
    this.dynoHud = null;
    this.dynoUpdateError = null;
    this.dynoHudFrame = 0;
    this.dynoUiMode = 'intro';
    this.introUiObjects = [];
    this.activeUiObjects = [];
    this.shiftLabelObjects = [];
    this.dynoShifterInputShield = null;
    this._dynoCleanedUp = false;

    this.drawBackground();
    this.drawHeader();

    if (!this.carId || !cars[this.carId]) {
      this.drawNoCarState();
      finishSceneLoading('DYNO READY');
      return;
    }

    ensureDerivedModularCarTextures(this, { [this.carId]: cars[this.carId] });
    this.build = buildDynoCar(this.carId, this.carState);
    if (!this.build) {
      this.drawNoCarState('BUILD DATA UNAVAILABLE');
      finishSceneLoading('DYNO READY');
      return;
    }

    this.recommendedGear = getRecommendedDynoGear(this.build.car);
    this.currentRPM = Number(this.build.engine.idleRPM || 850);
    this.drawDynoMonitor();
    this.drawCarOnDyno();
    this.drawDaichiPanel();
    this.drawIntroUi();
    this.redrawGraph();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());
    finishSceneLoading('DYNO READY');
  }

  cleanup() {
    if (this._dynoCleanedUp) return;
    this._dynoCleanedUp = true;

    try { this.controls?.destroy?.(); } catch (e) {}
    this.controls = null;

    try { this.dynoShifterInputShield?.destroy?.(); } catch (e) {}
    this.dynoShifterInputShield = null;

    [...(this.introUiObjects || []), ...(this.activeUiObjects || [])].forEach(obj => {
      try { obj?.destroy?.(); } catch (e) {}
    });
    this.introUiObjects = [];
    this.activeUiObjects = [];
    (this.shiftLabelObjects || []).forEach(obj => {
      try { obj?.destroy?.(); } catch (e) {}
    });
    this.shiftLabelObjects = [];
    this.runButton = null;
    this.resultsButton = null;

    if (this.dynoHud) {
      [
        this.dynoHud.cluster,
        this.dynoHud.g,
        this.dynoHud.status,
        this.dynoHud.gearBack,
        this.dynoHud.gearText,
        this.dynoHud.speedText,
        this.dynoHud.auxLabel,
      ].forEach(obj => {
        try { obj?.destroy?.(); } catch (e) {}
      });
    }
    this.dynoHud = null;

    try { this.audio?.destroy?.(); } catch (e) {}
    this.audio = null;
  }

  drawBackground() {
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x05080c).setDepth(-20);
    if (this.textures.exists('dynoWarehouseDayBg')) {
      this.add.image(WIDTH / 2, HEIGHT / 2, 'dynoWarehouseDayBg')
        .setDisplaySize(WIDTH, HEIGHT)
        .setDepth(-15);
    }
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x02070d, 0.10).setDepth(-14);
  }

  drawHeader() {
    this.add.rectangle(780, 35, 1512, 62, 0x07111d, 0.96)
      .setStrokeStyle(2, 0x173249, 1)
      .setDepth(80);
    this.add.text(48, 35, 'WAREHOUSE HQ // DYNO', {
      fontFamily: PIXEL_FONT, fontSize: '18px', color: '#eefaff'
    }).setOrigin(0, 0.5).setDepth(81);

    const cash = Number(this.registry.get('cash') || 0);
    this.cashText = this.add.text(1512, 35, '¥ ' + cash.toLocaleString('en-US'), {
      fontFamily: PIXEL_FONT, fontSize: '14px', color: '#ffe08a'
    }).setOrigin(1, 0.5).setDepth(81);

    this.pullCounterText = this.add.text(1190, 35, '', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#9edcf7'
    }).setOrigin(1, 0.5).setDepth(81);
    this.refreshPullCounter();
  }

  drawNoCarState(message = 'NO CAR STORED AT WAREHOUSE HQ') {
    this.add.rectangle(780, 420, 760, 310, 0x07111d, 0.94)
      .setStrokeStyle(2, 0x315470, 1)
      .setDepth(20);
    this.add.text(780, 375, message, {
      fontFamily: PIXEL_FONT, fontSize: '14px', color: '#eefaff'
    }).setOrigin(0.5).setDepth(21);
    this.add.text(780, 430, 'Move a car to Warehouse HQ before using the dyno.', {
      fontFamily: BODY_FONT, fontSize: '13px', color: '#a7bdca', fontStyle: '600'
    }).setOrigin(0.5).setDepth(21);
    const back = this.add.rectangle(780, 505, 260, 52, 0x102138, 1)
      .setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(21);
    this.add.text(780, 505, 'RETURN TO WORKSHOP', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#eef8ff'
    }).setOrigin(0.5).setDepth(22);
    back.on('pointerdown', () => this.returnToWorkshop());
  }

  drawDynoMonitor() {
    this.add.text(MONITOR.x + 18, MONITOR.y + 16, 'DYNO LIVE // POWER + TORQUE', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#d9f5ff'
    }).setDepth(21);

    this.graphRect = {
      x: MONITOR.x + 42,
      y: MONITOR.y + 58,
      w: MONITOR.w - 82,
      h: MONITOR.h - 112,
    };
    this.graphGraphics = this.add.graphics().setDepth(20);

    this.graphXAxisLabel = this.add.text(
      this.graphRect.x + this.graphRect.w - 8,
      this.graphRect.y + this.graphRect.h - 6,
      'RPM',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '5px',
        color: '#7892a2',
      }
    ).setOrigin(1, 1).setDepth(21);
    this.add.text(MONITOR.x + 18, MONITOR.y + 44, 'TORQUE', {
      fontFamily: PIXEL_FONT, fontSize: '6px', color: '#59dcff'
    }).setDepth(21);
    this.add.text(MONITOR.x + MONITOR.w - 18, MONITOR.y + 44, 'POWER', {
      fontFamily: PIXEL_FONT, fontSize: '6px', color: '#7df6a8'
    }).setOrigin(1, 0).setDepth(21);

    this.telemetryText = this.add.text(
      MONITOR.x + 18,
      MONITOR.y + MONITOR.h - 24,
      '',
      {
        fontFamily: BODY_FONT,
        fontSize: '8px',
        color: '#b8cbd7',
        fontStyle: '700',
      }
    ).setOrigin(0, 1).setDepth(21);
  }

  drawCarOnDyno() {
    const car = cars[this.carId];
    const state = this.carState || {};
    const wheelVisual = getVisualModWheelVisual(car, state);
    const wheelSource = this.textures.get(wheelVisual.wheelKey).getSourceImage();
    const bodyScale = getCarBodyScaleForWidth(this, car, CAR_TARGET_WIDTH);
    const fit = getWheelPairFit(wheelVisual, bodyScale, false, wheelSource);
    const renderOffsetY = Number(car.visual?.renderOffsetY || 0) * bodyScale;
    const rearContact = Number(fit.rear.backingRadius || 0) > 0
      ? Number(fit.rear.backingRadius)
      : getWheelContactOffsetY(wheelSource, fit.rear.wheelScale);
    const frontContact = Number(fit.front.backingRadius || 0) > 0
      ? Number(fit.front.backingRadius)
      : getWheelContactOffsetY(wheelSource, fit.front.wheelScale);
    const maxBottomOffset = Math.max(
      renderOffsetY + fit.rear.offsetY + rearContact,
      renderOffsetY + fit.front.offsetY + frontContact
    );
    const bodyY = WHEEL_CONTACT_Y - maxBottomOffset;
    const displayY = bodyY + renderOffsetY;

    const rearX = CAR_X + fit.rear.offsetX;
    const frontX = CAR_X + fit.front.offsetX;
    const rearY = displayY + fit.rear.offsetY;
    const frontY = displayY + fit.front.offsetY;

    this.rearWheel = this.add.image(rearX, rearY, wheelVisual.wheelKey)
      .setScale(fit.rear.wheelScale).setDepth(10);
    this.frontWheel = this.add.image(frontX, frontY, wheelVisual.wheelKey)
      .setScale(fit.front.wheelScale).setDepth(10);
    this.wheelObjects = [this.rearWheel, this.frontWheel];

    this.add.circle(rearX, rearY, fit.rear.backingRadius || rearContact, 0x020304, 1).setDepth(9.6);
    this.add.circle(frontX, frontY, fit.front.backingRadius || frontContact, 0x020304, 1).setDepth(9.6);

    this.rollerRearX = rearX;
    this.rollerFrontX = frontX;
    this.rollerY = WHEEL_CONTACT_Y + 8;
    this.rollerGraphics = this.add.graphics().setDepth(8.7);

    const paintColor = getCarPaintColor(state);
    const bodyLayers = createCarBodyLayers(this, car, {
      x: CAR_X,
      y: displayY,
      scale: bodyScale,
      depth: 11,
      paintColor,
    });
    const visualMods = createVisualModLayers(this, car, state, {
      x: CAR_X,
      y: displayY,
      scale: bodyScale,
      depth: 11.005,
      paintColor,
      bodyLayers,
    });
    const decals = createTunerDecalLayers(this, state, {
      x: CAR_X,
      y: displayY,
      displayWidth: bodyLayers.primary.displayWidth,
      displayHeight: bodyLayers.primary.displayHeight,
      depth: 11.04,
    });

    this.carBodyObjects = [...bodyLayers.objects, ...visualMods, ...decals];
    this.carObjects = [...this.wheelObjects, ...this.carBodyObjects];
    this.carBodyBase = this.carBodyObjects.map(obj => ({ obj, y: obj.y }));

  }

  drawDaichiPanel() {
    const daichi = characters.daichiSakamoto;
    if (daichi?.visual && this.textures.exists(daichi.visual.spriteKey)) {
      const sprite = this.add.image(345, 550, daichi.visual.spriteKey)
        .setOrigin(0.5, 1)
        .setDepth(15);
      const source = this.textures.get(daichi.visual.spriteKey).getSourceImage();
      sprite.setScale(250 / Math.max(1, source.height));
    }

    // Manga-style instruction tab tucked directly beneath the dyno dashboard.
    this.daichiMessageBoard = this.add.rectangle(765, 808, 860, 64, 0xfffcf1, 0.985)
      .setStrokeStyle(4, 0x111111, 1)
      .setDepth(58)
      .setScrollFactor(0);
    this.daichiText = this.add.text(
      765,
      808,
      'DAICHI // Ready when you are. We need a clean baseline first.',
      {
        fontFamily: BODY_FONT,
        fontSize: '12px',
        color: '#111111',
        fontStyle: '700',
        align: 'center',
        wordWrap: { width: 802 },
        padding: { left: 12, right: 12, top: 5, bottom: 5 },
        lineSpacing: 1,
      }
    ).setOrigin(0.5).setDepth(59).setScrollFactor(0);
  }

  ensureDynoHud() {
    if (this.dynoHud) return;
    this.dynoHud = new RaceHUD(this, {
      hasTurbo: Number(this.build.car.maximumBoost || 0) > 0.05,
      hasNitrous: false,
      x: 720,
      y: 776,
      scale: 0.52,
      statusY: 620,
    });
    this.dynoHud.status?.setVisible(false);
  }

  clearUiObjects(listName) {
    const list = Array.isArray(this[listName]) ? this[listName] : [];
    list.forEach(obj => {
      try { obj?.destroy?.(); } catch (e) {}
    });
    this[listName] = [];
  }

  addUiObject(listName, obj) {
    if (!Array.isArray(this[listName])) this[listName] = [];
    this[listName].push(obj);
    return obj;
  }

  drawIntroUi() {
    this.clearUiObjects('activeUiObjects');
    this.clearUiObjects('introUiObjects');
    this.dynoUiMode = 'intro';
    this.runButton = null;
    this.resultsButton = null;

    const add = obj => this.addUiObject('introUiObjects', obj);
    const x = 1320;
    const powerCost = 5000;
    const drivetrainCost = 15000;

    // Stage I services are deliberately simple: buy the test you want.
    // Power Run is one pull; Drivetrain Test buys three attempts.
    const powerBox = add(this.add.rectangle(x, 178, 380, 100, 0x07111d, 0.97)
      .setStrokeStyle(2, 0x62e8c7, 0.95)
      .setInteractive({ useHandCursor: true }).setDepth(28));
    add(this.add.text(1148, 140,
      'POWER RUN  //  BASELINE ENGINE CURVE\n' +
      '1 CLEAN PULL  //  POWER + TORQUE VS RPM',
      {
        fontFamily: BODY_FONT, fontSize: '9px', color: '#b8dce8',
        fontStyle: '700', lineSpacing: 5,
      }).setDepth(29));
    add(this.add.text(1490, 252, 'START FOR ¥5,000', {
      fontFamily: PIXEL_FONT, fontSize: '7px', color: '#62e8c7'
    }).setOrigin(1, 0.5).setDepth(29));
    add(this.add.text(1490, 265, 'STAGE 1', {
      fontFamily: PIXEL_FONT, fontSize: '5px', color: '#ffe08a'
    }).setOrigin(1, 0.5).setDepth(29));
    powerBox.on('pointerdown', () => this.beginPull('power'));

    const driveBox = add(this.add.rectangle(x, 292, 380, 100, 0x07111d, 0.97)
      .setStrokeStyle(2, 0x43dfff, 0.95)
      .setInteractive({ useHandCursor: true }).setDepth(28));
    add(this.add.text(1148, 254,
      'DRIVETRAIN TEST  //  3 ATTEMPTS\n' +
      'STANDING START  //  SHIFT THROUGH THE GEARS\n' +
      'SEE RPM DROP + DELIVERED POWER AT EACH SHIFT',
      {
        fontFamily: BODY_FONT, fontSize: '8px', color: '#b8dce8',
        fontStyle: '700', lineSpacing: 4,
      }).setDepth(29));
    add(this.add.text(1490, 366, 'START FOR ¥15,000', {
      fontFamily: PIXEL_FONT, fontSize: '7px', color: '#43dfff'
    }).setOrigin(1, 0.5).setDepth(29));
    add(this.add.text(1490, 379, 'STAGE 1', {
      fontFamily: PIXEL_FONT, fontSize: '5px', color: '#ffe08a'
    }).setOrigin(1, 0.5).setDepth(29));
    driveBox.on('pointerdown', () => this.beginPull('drivetrain'));

    add(this.add.text(1148, 430,
      'POWER RUN  //  ¥5,000  //  1 PULL\n' +
      'DRIVETRAIN TEST  //  ¥15,000  //  3 ATTEMPTS',
      {
        fontFamily: PIXEL_FONT, fontSize: '7px', color: '#ffe08a',
        lineSpacing: 5,
      }).setDepth(29));

    if (this.facilityTier < 3) {
      add(this.add.rectangle(x, 530, 380, 108, 0x0b1017, 0.92)
        .setStrokeStyle(1, 0x6b5b37, 0.86).setDepth(28));
      add(this.add.text(1148, 486, 'NEXT // ' + getDynoNextStage(this.facilityTier).shortLabel, {
        fontFamily: PIXEL_FONT, fontSize: '7px', color: '#ffe08a'
      }).setDepth(29));
      add(this.add.text(1148, 515,
        'UPGRADE  ¥ ' + Number(getDynoNextStage(this.facilityTier).installCost || 0).toLocaleString('en-US') +
        '\n' + getDynoNextStage(this.facilityTier).description.toUpperCase(),
        {
          fontFamily: BODY_FONT, fontSize: '8px', color: '#aa9e80',
          fontStyle: '700', lineSpacing: 3, wordWrap: { width: 340 },
        }).setDepth(29));
    }

    const backY = this.facilityTier < 3 ? 670 : 530;
    const back = add(this.add.rectangle(x, backY, 380, 50, 0x102138, 0.98)
      .setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true }).setDepth(31));
    add(this.add.text(x, backY, 'RETURN TO WORKSHOP', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#eef8ff'
    }).setOrigin(0.5).setDepth(32));
    back.on('pointerdown', () => this.returnToWorkshop());
  }

  drawActiveUi() {
    this.clearUiObjects('introUiObjects');
    this.clearUiObjects('activeUiObjects');
    this.dynoUiMode = 'active';

    const add = obj => this.addUiObject('activeUiObjects', obj);
    const x = 1320;
    const makeButton = (y, label, onClick, style = 'primary') => {
      const primary = style === 'primary';
      const box = add(this.add.rectangle(x, y, 380, 52, primary ? 0x0c2827 : 0x102138, 0.98)
        .setStrokeStyle(2, primary ? 0x62e8c7 : 0x55b8ff, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(31));
      const text = add(this.add.text(x, y, label, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#f1fffb', align: 'center'
      }).setOrigin(0.5).setDepth(32));
      box.on('pointerdown', onClick);
      return { box, text };
    };

    this.runButton = makeButton(170, 'NEXT PULL', () => this.beginPull());
    this.returnButton = makeButton(236, 'RETURN TO WORKSHOP', () => this.returnToWorkshop(), 'secondary');

    this.resultsButton = null;
    this.refreshRunButton();
  }

  ensureControls() {
    if (this.controls) {
      this.controls.enabled = true;
      return;
    }
    this.controls = new TouchControls(this, { nosEnabled: false, controlBottomY: 790, controlScaleMultiplier: 1.10, pedalLatchMax: false });
    this.controls.nosSprite?.setVisible(false);

    // Dyno-specific input guard: the shifter touch rectangle overlaps the
    // CHANGE CAR / RETURN TO WORKSHOP buttons in the right-hand action column.
    // Without a top-most interactive object, a shifter swipe can also fire the
    // workshop button underneath it and make the dyno appear to "crash".
    // This invisible zone owns pointer hit-testing in the shifter region while
    // TouchControls continues to receive the scene-level pointer events.
    const shifterRect = this.controls.layout?.shifter;
    if (shifterRect && !this.dynoShifterInputShield) {
      this.dynoShifterInputShield = this.add.zone(
        shifterRect.centerX,
        shifterRect.centerY,
        shifterRect.width,
        shifterRect.height
      )
        .setInteractive()
        .setDepth(95)
        .setScrollFactor(0);
    }
  }

  ensureAudio() {
    if (this.audio || !this.dynoAudioEnabled || !this.build?.car) return;

    const engineId = this.build.car.engine || cars[this.carId]?.engine;
    if (!engineId) return;

    try {
      this.audio = new EngineAudioSystem(
        engineId,
        null,
        this.carState || {},
        {},
        { singleVehicle: true }
      );
    } catch (e) {
      // Audio must never stop a dyno session from functioning.
      this.audio = null;
    }
  }

  beginPull(requestedMode = null) {
    if (this.pullState === 'RUNNING' || this.pullState === 'SETUP') return;

    // Stage I service pricing: Power Run is ¥5,000 for one pull;
    // Drivetrain Test is ¥15,000 for three attempts.
    const serviceCost = requestedMode === 'drivetrain' ? 15000 : 5000;
    const servicePulls = requestedMode === 'drivetrain' ? 3 : 1;

    if (this.sessionPullsRemaining <= 0) {
      const cash = Math.max(0, Number(this.registry.get('cash') || 0));
      if (cash < serviceCost) {
        this.daichiText.setText('DAICHI // You need ¥' + serviceCost.toLocaleString('en-US') + ' for this Stage I test.');
        return;
      }
      this.registry.set('cash', cash - serviceCost);
      this.cashText.setText('¥ ' + Number(cash - serviceCost).toLocaleString('en-US'));
      this.sessionPullsRemaining = servicePulls;
      this.dynoRunMode = requestedMode || 'power';
      saveSessionState(this.registry);
    } else if (requestedMode) {
      // Do not charge again while a purchased three-attempt drivetrain
      // service is being used. A new purchase starts once the attempts run out.
      this.dynoRunMode = requestedMode;
    }

    this.ensureDynoHud();
    this.ensureControls();
    this.ensureAudio();

    this.points = [];
    this.shiftEvents = [];
    this.runProgress = 0;
    this.lowThrottleTime = 0;
    this.lastRecordedRPM = 0;
    this.lastRecordedTime = 0;
    this.vehicleSpeedMps = 0;
    this.vehicleDistanceM = 0;
    this.dynoRunTime = 0;
    this.shiftCooldown = 0;
    this.currentGear = this.dynoRunMode === 'drivetrain' ? 0 : 0;
    this.currentRPM = Number(this.build.engine.idleRPM || 850);
    this.currentBoost = 0;
    this.turbo = null;
    this.finalDynoPoint = null;
    this.pullState = 'SETUP';
    if (this.dynoUiMode !== 'active') this.drawActiveUi();
    this.redrawGraph();

    if (this.dynoRunMode === 'drivetrain') {
      this.daichiText.setText(
        'DAICHI // DRIVETRAIN TEST. Start in N. Clutch in, select your launch gear, set RPM, then release.'
      );
    } else {
      this.daichiText.setText(
        'DAICHI // POWER RUN. Clutch in. Select ' + this.ordinal(this.recommendedGear) +
        ' gear — closest to 1:1 — then release the clutch.'
      );
    }
    this.refreshRunButton();
    this.refreshPullCounter();
  }

  ordinal(value) {
    const n = Number(value) || 1;
    if (n === 1) return '1ST';
    if (n === 2) return '2ND';
    if (n === 3) return '3RD';
    return n + 'TH';
  }

  handleGearRequest(request, controls) {
    if (request == null || !this.build?.car) return;

    try {
      const maxGear = Math.max(1, Number(this.build.car.gearRatios?.length || 5));
      const clutch = Number(controls?.clutch || 0);

      if (clutch < 0.55) {
        this.daichiText?.setText('DAICHI // Clutch first. Do not force the gearbox on the dyno.');
        return;
      }

      let requestedGear = this.currentGear;
      if (request === 'UP') requestedGear += 1;
      else if (request === 'DOWN') requestedGear -= 1;
      else if (Number.isFinite(Number(request))) requestedGear = Number(request);

      const nextGear = Phaser.Math.Clamp(Math.round(requestedGear), 0, maxGear);

      if (
        this.pullState === 'RUNNING' &&
        this.dynoRunMode === 'drivetrain' &&
        nextGear > 0 &&
        nextGear !== this.currentGear
      ) {
        const oldGear = this.currentGear;
        const speedKmh = this.vehicleSpeedMps * 3.6;
        const oldRPM = this.currentRPM;

        this.currentGear = nextGear;
        const ratio = this.getOverallGearRatio(nextGear);
        const wheelRPM = this.getWheelRPMFromSpeed(this.vehicleSpeedMps);
        this.currentRPM = Math.max(
          Number(this.build.engine.idleRPM || 850),
          wheelRPM * ratio
        );

        const shiftPoint = getDynoPoint(this.build, oldRPM, this.currentBoost, 1);
        this.shiftEvents.push({
          speedKmh: Math.max(0, speedKmh),
          rpmBefore: oldRPM,
          rpmAfter: this.currentRPM,
          powerKW: shiftPoint.powerKW,
          torqueNm: shiftPoint.torqueNm,
          fromGear: oldGear,
          toGear: nextGear,
        });
        this.shiftCooldown = 0.16;
        this.daichiText?.setText(
          'DAICHI // ' + oldGear + ' > ' + nextGear +
          '. RPM DROP: ' + Math.max(0, Math.round(oldRPM - this.currentRPM)) + ' rpm.'
        );
      } else {
        this.currentGear = nextGear;
        if (this.pullState !== 'RUNNING') {
          this.daichiText?.setText(
            'DAICHI // GEAR ' + (this.currentGear === 0 ? 'NEUTRAL' : this.currentGear) +
            '. Release the clutch and build RPM.'
          );
        }
      }

      this.dynoUpdateError = null;
      this.dynoHudFrame = 0;
      const shiftTelemetry = this.getRollerTelemetry(0, clutch, this.currentBoost);
      this.updateDynoHud(shiftTelemetry, 'DYNO // SHIFT');
    } catch (error) {
      this.dynoUpdateError = error;
      this.currentGear = this.dynoRunMode === 'drivetrain' ? 1 : 0;
      this.daichiText?.setText('DAICHI // GEARBOX SAFETY RESET. Try the shift again.');
    }
  }

  startRunning() {
    if (this.pullState !== 'SETUP') return;
    this.pullState = 'RUNNING';
    this.runProgress = 0;
    this.dynoRunTime = 0;
    this.vehicleSpeedMps = 0;
    this.vehicleDistanceM = 0;
    this.lastRecordedTime = 0;
    this.shiftCooldown = 0;

    if (this.dynoRunMode === 'drivetrain') {
      const idle = Number(this.build.engine.idleRPM || 850);
      const redline = Number(this.build.engine.redlineRPM || 7600);
      this.currentRPM = Math.max(idle + 1000, redline * 0.24);
      this.daichiText.setText('DAICHI // GO. Hold it. Shift when you think the engine has had enough.');
    } else {
      this.currentRPM = Math.max(
        Number(this.build.engine.idleRPM || 850) + 650,
        Number(this.build.engine.redlineRPM || 7600) * 0.24
      );
      this.daichiText.setText('DAICHI // GO. Full throttle and hold it cleanly to redline.');
    }
    this.refreshRunButton();
  }

  abortPull() {
    if (this.pullState !== 'RUNNING') return;
    this.pullState = 'ABORTED';
    this.points = [];
    this.currentBoost = 0;
    this.controls.enabled = false;
    this.audio?.fadeOut();
    this.daichiText.setText('DAICHI // Pull aborted. No problem — that one does not count. Reset and try again.');
    this.refreshRunButton();
    this.redrawGraph();
  }

  completePull() {
    if (this.pullState !== 'RUNNING') return;
    this.pullState = 'COMPLETE';
    this.controls.enabled = false;
    this.sessionPullsRemaining = Math.max(0, this.sessionPullsRemaining - 1);
    // The normal session flow is one engine baseline followed by two
    // drivetrain attempts. A retry keeps the current mode; a fresh pull
    // after the baseline automatically switches to drivetrain analysis.

    const run = {
      completedAt: Date.now(),
      mode: this.dynoRunMode,
      gear: this.dynoRunMode === 'power' ? this.currentGear : (this.points?.[0]?.gear || this.currentGear),
      points: this.points.map(point => ({
        rpm: Math.round(point.rpm),
        speedKmh: Math.round(Number(point.speedKmh || 0) * 10) / 10,
        positionM: Math.round(Number(point.positionM || 0) * 10) / 10,
        powerKW: Math.round(point.powerKW * 10) / 10,
        torqueNm: Math.round(point.torqueNm * 10) / 10,
        wheelPowerKW: Math.round(Number(point.wheelPowerKW || 0) * 10) / 10,
        wheelTorqueNm: Math.round(Number(point.wheelTorqueNm || 0) * 10) / 10,
        gear: Number(point.gear || this.currentGear || 0),
        boostBar: Math.round(point.boostBar * 100) / 100,
      })),
      shiftEvents: this.shiftEvents.map(event => ({
        speedKmh: Math.round(Number(event.speedKmh || 0) * 10) / 10,
        rpmBefore: Math.round(Number(event.rpmBefore || 0)),
        rpmAfter: Math.round(Number(event.rpmAfter || 0)),
        fromGear: event.fromGear,
        toGear: event.toGear,
      })),
    };

    run.analysis = analyseDynoRun(run, this.build);
    run.wheelPowerKW = Math.round(
      Number(run.analysis.peakPowerKW || 0) *
      clamp(Number(this.build.car.drivetrainEfficiency || 0.86), 0.60, 0.99)
    );

    if (run.mode === 'drivetrain') {
      run.drivetrain = {
        topGearReached: this.currentGear >= Number(this.build.car.gearRatios?.length || 1),
        maxSpeedKmh: Math.round(this.vehicleSpeedMps * 3.6),
        shiftCount: this.shiftEvents.length,
      };
    }

    const carStates = { ...(this.registry.get('carStates') || {}) };
    const state = { ...(carStates[this.carId] || {}) };
    const dyno = { ...(state.dyno || {}) };
    const history = Array.isArray(dyno.history) ? [...dyno.history] : [];
    history.push(run);
    dyno.history = history.slice(-6);
    dyno.lastRun = run;
    if (!dyno.bestRun || Number(run.analysis.peakPowerKW || 0) > Number(dyno.bestRun?.analysis?.peakPowerKW || 0)) {
      dyno.bestRun = run;
    }
    state.dyno = dyno;
    carStates[this.carId] = state;
    this.registry.set('carStates', carStates);
    saveSessionState(this.registry);

    this.carState = state;
    this.previousRun = run;
    this.finalDynoPoint = run.points?.[run.points.length - 1] || {
      rpm: this.currentRPM,
      speedKmh: this.vehicleSpeedMps * 3.6,
      powerKW: run.analysis.peakPowerKW,
      torqueNm: run.analysis.peakTorqueNm,
      boostBar: this.currentBoost,
    };

    if (run.mode === 'drivetrain') {
      const shifts = this.shiftEvents.length;
      this.daichiText.setText(
        'DAICHI // DRIVETRAIN RUN COMPLETE. ' + shifts +
        ' shift' + (shifts === 1 ? '' : 's') + '. ' +
        Math.round(this.vehicleSpeedMps * 3.6) + ' km/h reached.'
      );
    } else {
      this.daichiText.setText('DAICHI // ' + run.analysis.comment);
    }

    // A completed Power Run or Drivetrain attempt simply returns to the
    // service selection flow when its purchased attempts are exhausted.
    if (this.sessionPullsRemaining <= 0) {
      this.dynoRunMode = 'power';
      this.drawIntroUi();
    }

    this.refreshPullCounter();
    this.refreshRunButton();
    this.redrawGraph();
    this.showRunSummary(run);
  }

  showRunSummary(run) {
    const a = run?.analysis;
    if (!a) return;

    if (run.mode === 'drivetrain') {
      const maxSpeed = Math.round(Number(run.drivetrain?.maxSpeedKmh || 0));
      const shifts = Number(run.drivetrain?.shiftCount || 0);
      const last = run.shiftEvents?.[run.shiftEvents.length - 1];
      this.telemetryText.setText(
        'DRIVETRAIN  //  MAX ' + maxSpeed + ' km/h  //  ' + shifts + ' SHIFTS' +
        (last ? '  //  LAST SHIFT ' + last.fromGear + '>' + last.toGear : '') +
        '\nPEAK ENGINE  ' + a.peakPowerKW + ' kW @ ' + a.peakPowerRPM.toLocaleString('en-US') +
        ' rpm  //  WHEEL ~' + Number(run.wheelPowerKW || 0) + ' kW'
      );
    } else {
      this.telemetryText.setText(
        'POWER RUN  //  PEAK ' + a.peakPowerKW + ' kW @ ' + a.peakPowerRPM.toLocaleString('en-US') +
        ' rpm  //  ' + a.peakTorqueNm + ' Nm @ ' + a.peakTorqueRPM.toLocaleString('en-US') +
        ' rpm\nUSABLE BAND  ' + a.usableBandStartRPM.toLocaleString('en-US') +
        '–' + a.usableBandEndRPM.toLocaleString('en-US') + ' rpm'
      );
    }
  }

  showLastRun() {
    if (!this.previousRun?.analysis) return;
    this.showRunSummary(this.previousRun);
    this.daichiText.setText('DAICHI // ' + this.previousRun.analysis.comment);
    this.redrawGraph();
  }

  refreshPullCounter() {
    if (!this.pullCounterText) return;
    this.pullCounterText.setText(
      this.sessionPullsRemaining > 0
        ? 'TEST // ' + this.sessionPullsRemaining + ' ATTEMPT' + (this.sessionPullsRemaining === 1 ? '' : 'S') + ' LEFT'
        : 'STAGE I // POWER ¥5,000 // DRIVETRAIN ¥15,000 / 3 ATTEMPTS'
    );
  }

  refreshRunButton() {
    if (!this.runButton) return;
    let label = 'NEW TEST';
    let enabled = true;

    if (this.pullState === 'SETUP') {
      label = this.dynoRunMode === 'drivetrain'
        ? 'SETUP // N // SELECT LAUNCH GEAR'
        : 'SETUP // SELECT ' + this.ordinal(this.recommendedGear) + ' GEAR';
      enabled = false;
    } else if (this.pullState === 'RUNNING') {
      label = this.dynoRunMode === 'drivetrain'
        ? 'DRIVETRAIN TEST // LIVE'
        : 'POWER RUN // LIVE';
      enabled = false;
    } else if (this.sessionPullsRemaining > 0) {
      label = this.pullState === 'ABORTED'
        ? 'RETRY ' + (this.dynoRunMode === 'drivetrain' ? 'DRIVETRAIN' : 'POWER') + ' // ' + this.sessionPullsRemaining + ' LEFT'
        : 'NEXT ' + (this.dynoRunMode === 'drivetrain' ? 'DRIVETRAIN' : 'TEST') + ' // ' + this.sessionPullsRemaining + ' LEFT';
    }

    this.runButton.text.setText(label);
    if (enabled) {
      this.runButton.box.setInteractive({ useHandCursor: true })
        .setFillStyle(0x0c2827, 0.98)
        .setStrokeStyle(2, 0x62e8c7, 1);
      this.runButton.text.setColor('#f1fffb');
    } else {
      this.runButton.box.disableInteractive()
        .setFillStyle(0x10171c, 0.94)
        .setStrokeStyle(1, 0x4a5c63, 0.86);
      this.runButton.text.setColor('#80949e');
    }
  }

  redrawRollers(spin = 0) {
    if (!this.rollerGraphics) return;
    const g = this.rollerGraphics;
    g.clear();
    [this.rollerRearX, this.rollerFrontX].forEach(x => {
      g.fillStyle(0x11161a, 0.95).fillRoundedRect(x - 72, this.rollerY - 10, 144, 24, 10);
      g.lineStyle(3, 0x53616a, 0.82);
      for (let index = -3; index <= 3; index += 1) {
        const offset = ((index * 24 + spin) % 168) - 84;
        g.lineBetween(x + offset, this.rollerY - 8, x + offset + 18, this.rollerY + 11);
      }
    });
  }

  redrawGraph() {
    if (!this.graphGraphics || !this.graphRect || !this.build) return;
    const g = this.graphGraphics;
    const rect = this.graphRect;
    g.clear();

    const graphRun = (this.points?.length ? { mode: this.dynoRunMode, points: this.points, shiftEvents: this.shiftEvents } : this.previousRun);
    const drivetrain = graphRun?.mode === 'drivetrain';
    this.graphXAxisLabel?.setText(drivetrain ? 'KM/H' : 'RPM');

    g.lineStyle(1, 0x1f3a49, 0.52);
    for (let i = 0; i <= 5; i += 1) {
      const x = rect.x + rect.w * i / 5;
      g.lineBetween(x, rect.y, x, rect.y + rect.h);
    }
    for (let i = 0; i <= 4; i += 1) {
      const y = rect.y + rect.h * i / 4;
      g.lineBetween(rect.x, y, rect.x + rect.w, y);
    }

    const redline = Math.max(2000, Number(this.build.engine.redlineRPM || this.build.car.engineRedlineRPM || 8000));
    const rpmMin = Math.max(500, Number(this.build.engine.idleRPM || 850));
    const maxTorque = Math.max(100, Number(this.build.car.torqueNm || 0) * 1.22);
    const maxPower = Math.max(80, Number(this.build.car.powerKW || 0) * 1.22);

    const xAt = value => {
      if (!drivetrain) {
        return rect.x + clamp((Number(value) - rpmMin) / Math.max(1, redline - rpmMin), 0, 1) * rect.w;
      }
      const maxSpeed = Math.max(
        80,
        ...((graphRun?.points || []).map(p => Number(p.speedKmh || 0))),
        Number(this.build.car.topSpeedKmh || 0)
      );
      return rect.x + clamp(Number(value) / Math.max(1, maxSpeed), 0, 1) * rect.w;
    };

    const torqueY = value => rect.y + rect.h - clamp(Number(value) / maxTorque, 0, 1.08) * rect.h;
    const powerY = value => rect.y + rect.h - clamp(Number(value) / maxPower, 0, 1.08) * rect.h;

    const drawSeries = (points, key, yFn, color, alpha, width) => {
      if (!Array.isArray(points) || points.length < 2) return;
      g.lineStyle(width, color, alpha);
      let started = false;
      points.forEach(point => {
        const xValue = drivetrain ? Number(point.speedKmh || 0) : Number(point.rpm || 0);
        const x = xAt(xValue);
        const y = yFn(point[key]);
        if (!started) {
          g.beginPath();
          g.moveTo(x, y);
          started = true;
        } else {
          g.lineTo(x, y);
        }
      });
      if (started) g.strokePath();
    };

    const previous = this.previousRun?.points?.length ? this.previousRun : null;
    if (previous && previous.mode === (drivetrain ? 'drivetrain' : 'power')) {
      drawSeries(previous.points, 'torqueNm', torqueY, 0x59dcff, this.points.length ? 0.25 : 0.48, 2);
      drawSeries(previous.points, 'powerKW', powerY, 0x7df6a8, this.points.length ? 0.25 : 0.48, 2);
    }

    drawSeries(this.points, 'torqueNm', torqueY, 0x59dcff, 1, 3);
    drawSeries(this.points, 'powerKW', powerY, 0x7df6a8, 1, 3);

    if (drivetrain) {
      const events = this.shiftEvents?.length ? this.shiftEvents : (graphRun?.shiftEvents || []);
      (this.shiftLabelObjects || []).forEach(obj => {
        try { obj?.destroy?.(); } catch (e) {}
      });
      this.shiftLabelObjects = [];

      events.forEach((event, index) => {
        const x = xAt(Number(event.speedKmh || 0));
        const yTorque = torqueY(Number(event.torqueNm || event.wheelTorqueNm || 0));
        const yPower = powerY(Number(event.powerKW || 0));
        g.fillStyle(0xffe08a, 1);
        g.fillCircle(x, yTorque, 3);
        g.fillCircle(x, yPower, 3);
        g.lineStyle(1, 0xffe08a, 0.55);
        g.lineBetween(x, rect.y + 4, x, rect.y + rect.h - 4);

        const labelY = rect.y + 8 + (index % 2) * 28;
        const label = this.add.text(
          x,
          labelY,
          event.fromGear + '→' + event.toGear + '\n' +
          Math.round(event.rpmBefore).toLocaleString('en-US') + '→' +
          Math.round(event.rpmAfter).toLocaleString('en-US'),
          {
            fontFamily: PIXEL_FONT,
            fontSize: '5px',
            color: '#ffe08a',
            align: 'center',
            backgroundColor: '#07111d',
            padding: { left: 2, right: 2, top: 2, bottom: 2 },
          }
        ).setOrigin(0.5, 0).setDepth(23);
        this.shiftLabelObjects.push(label);
      });
    }
  }

  getRollerTelemetry(throttle = 0, clutch = 0, boostBar = this.currentBoost) {
    const gear = Math.max(0, Number(this.currentGear || 0));
    const ratio = gear > 0
      ? Math.max(
          0.1,
          Number(this.build?.car?.gearRatios?.[gear - 1] || 1) *
            Number(this.build?.car?.finalDriveRatio || 1)
        )
      : 0;

    const wheelRPM = ratio > 0 && Number(clutch || 0) < 0.92
      ? Math.max(0, Number(this.currentRPM || 0) / ratio)
      : 0;
    const wheelRadius = Math.max(0.20, Number(this.build?.car?.wheelRadius || 0.32));
    const speedKmh = wheelRPM * (Math.PI * 2 * wheelRadius) / 60 * 3.6;
    const maxBoost = Math.max(0.01, Number(this.build?.car?.maximumBoost || 0));

    return {
      positionM: 0,
      speedKmh,
      rpm: this.currentRPM,
      gear,
      pendingGear: null,
      throttle: clamp(throttle, 0, 1),
      clutch: clamp(clutch, 0, 1),
      boostBar: Math.max(0, Number(boostBar || 0)),
      turboSpool: clamp(Number(boostBar || 0) / maxBoost, 0, 1),
      wheelRPM,
      wheelspin: false,
      slipRatio: 0,
      nosActive: false,
      nosFraction: 0,
    };
  }

  updateDynoHud(telemetry, status) {
    if (!this.dynoHud || !telemetry) return;
    this.dynoHud.update({
      rpm: telemetry.rpm,
      speedKmh: telemetry.speedKmh,
      gear: telemetry.gear,
      throttle: telemetry.throttle,
      boostBar: telemetry.boostBar,
      wheelspin: false,
      nosFraction: 0,
    }, status);
  }

  updateTelemetry(point = null, throttle = 0) {
    if (!this.telemetryText) return;
    const p = point || { powerKW: 0, torqueNm: 0, boostBar: 0 };
    const displayPoint = point || this.finalDynoPoint || { powerKW: 0, torqueNm: 0, boostBar: 0 };
    this.telemetryText.setText(
      'RPM  ' + Math.round(this.currentRPM).toLocaleString('en-US') +
      '   //   GEAR  ' + (this.currentGear || 'N') +
      '   //   THROTTLE  ' + Math.round(clamp(throttle, 0, 1) * 100) + '%' +
      '\nBOOST  ' + Number(displayPoint.boostBar || 0).toFixed(2) + ' bar' +
      '   //   TORQUE  ' + Math.round(Number(displayPoint.torqueNm || 0)) + ' Nm' +
      '   //   POWER  ' + Math.round(Number(displayPoint.powerKW || 0)) + ' kW'
    );
  }

  getOverallGearRatio(gear = this.currentGear) {
    const ratio = Number(this.build?.car?.gearRatios?.[Math.max(0, Number(gear) - 1)] || 1);
    const finalDrive = Number(this.build?.car?.finalDriveRatio || 1);
    return Math.max(0.1, ratio * finalDrive);
  }

  getWheelRPMFromSpeed(speedMps = 0) {
    const wheelRadius = Math.max(0.20, Number(this.build?.car?.wheelRadius || 0.32));
    return Math.max(0, Number(speedMps || 0)) / (Math.PI * 2 * wheelRadius) * 60;
  }

  getDrivetrainPoint(point, speedMps, gear) {
    const efficiency = clamp(Number(this.build.car.drivetrainEfficiency || 0.86), 0.60, 0.99);
    const ratio = this.getOverallGearRatio(gear);
    const wheelRadius = Math.max(0.20, Number(this.build.car.wheelRadius || 0.32));
    const wheelTorqueNm = Math.max(0, Number(point.torqueNm || 0) * ratio * efficiency);
    const wheelPowerKW = Math.max(0, wheelTorqueNm * this.getWheelRPMFromSpeed(speedMps) / 9549);
    return {
      ...point,
      speedKmh: Math.max(0, speedMps * 3.6),
      positionM: this.vehicleDistanceM,
      gear,
      wheelTorqueNm,
      wheelPowerKW,
    };
  }

  update(time, deltaMs) {
    try {
      if (!this.build || !this.controls) {
        this.redrawRollers(0);
        return;
      }

      const dt = Math.min(1 / 30, Math.max(0.001, Number(deltaMs || 16.7) / 1000));
      const input = this.controls.update();
      const gearRequest = this.controls.consumeGearRequest();
      if (gearRequest != null) this.handleGearRequest(gearRequest, input);

      if (this.pullState === 'SETUP') {
        if (this.dynoRunMode === 'drivetrain') {
          const throttle = clamp(input.throttle, 0, 1);
          const idle = Number(this.build.engine.idleRPM || 850);
          const launchRPM = Math.max(idle + 1000, Number(this.build.engine.redlineRPM || 7600) * 0.24);
          const targetRPM = Math.max(idle, idle + throttle * Math.max(700, launchRPM - idle));
          this.currentRPM += (targetRPM - this.currentRPM) * Math.min(1, dt * 8);
          const setupTurboMax = Math.max(0, Number(this.build.car.maximumBoost || 0));
          const setupTurboRpm = Phaser.Math.Clamp((this.currentRPM - 1800) / 4300, 0, 1);
          this.currentBoost = setupTurboMax * Math.pow(setupTurboRpm, 1.18) * Math.pow(throttle, 0.88);
          const setupTelemetry = this.getRollerTelemetry(throttle, input.clutch, this.currentBoost);
          this.updateTelemetry({ boostBar: this.currentBoost, powerKW: 0, torqueNm: 0 }, throttle);
          this.updateDynoHud(setupTelemetry, 'DRIVETRAIN // LAUNCH SETUP');
          this.audio?.update(setupTelemetry, null, this.build.car, null, dt);
          this.redrawRollers(time * 0.015 + setupTelemetry.wheelRPM * 0.03);

          if (
            this.currentGear > 0 &&
            Number(input.clutch || 0) < 0.20 &&
            throttle >= 0.72
          ) {
            this.startRunning();
          }
          return;
        }

        const targetRPM = Math.max(
          Number(this.build.engine.idleRPM || 850),
          Number(this.build.engine.idleRPM || 850) + Number(input.throttle || 0) * 800
        );
        this.currentRPM += (targetRPM - this.currentRPM) * Math.min(1, dt * 7);

        const setupTurboMax = Math.max(0, Number(this.build.car.maximumBoost || 0));
        const setupTurboRpm = Phaser.Math.Clamp((this.currentRPM - 1800) / 4300, 0, 1);
        this.currentBoost = setupTurboMax * Math.pow(setupTurboRpm, 1.18) * Math.pow(clamp(input.throttle, 0, 1), 0.88);

        const setupTelemetry = this.getRollerTelemetry(input.throttle, input.clutch, this.currentBoost);
        this.updateTelemetry({ boostBar: this.currentBoost, powerKW: 0, torqueNm: 0 }, input.throttle);
        this.updateDynoHud(setupTelemetry, 'POWER RUN // SETUP');
        this.audio?.update(setupTelemetry, null, this.build.car, null, dt);
        this.redrawRollers(time * 0.015 + setupTelemetry.wheelRPM * 0.03);

        if (this.currentGear === this.recommendedGear && Number(input.clutch || 0) < 0.20) {
          this.daichiText.setText('DAICHI // READY. Hold full throttle for the pull.');
          if (Number(input.throttle || 0) >= 0.86) this.startRunning();
        }
        return;
      }

      if (this.pullState === 'COMPLETE') {
        this.controls.enabled = false;
        const idleRPM = Math.max(0, Number(this.build.engine.idleRPM || 850));
        this.currentRPM += (idleRPM - this.currentRPM) * Math.min(1, dt * 1.8);
        this.currentBoost = Math.max(0, this.currentBoost - dt * Math.max(0.1, this.currentBoost * 1.8));
        const cooldownTelemetry = this.getRollerTelemetry(0, 0, this.currentBoost);
        this.updateTelemetry(this.finalDynoPoint, 0);
        this.updateDynoHud(cooldownTelemetry, 'DYNO // RUN COMPLETE');
        this.audio?.update(cooldownTelemetry, null, this.build.car, null, dt);
        this.redrawRollers(time * 0.006 + cooldownTelemetry.wheelRPM * 0.02);
        return;
      }

      if (this.pullState !== 'RUNNING') {
        const idleTelemetry = this.getRollerTelemetry(0, 1, 0);
        this.updateTelemetry(null, 0);
        this.updateDynoHud(idleTelemetry, 'DYNO // READY');
        this.audio?.update(idleTelemetry, null, this.build.car, null, dt);
        this.redrawRollers(time * 0.006);
        return;
      }

      const throttle = clamp(input.throttle, 0, 1);
      if (throttle < 0.72) this.lowThrottleTime += dt;
      else this.lowThrottleTime = Math.max(0, this.lowThrottleTime - dt * 2);
      if (this.lowThrottleTime > 0.55) {
        this.abortPull();
        return;
      }

      this.dynoRunTime += dt;
      this.shiftCooldown = Math.max(0, this.shiftCooldown - dt);

      const redline = Math.max(3000, Number(this.build.engine.redlineRPM || this.build.car.engineRedlineRPM || 8000));
      const turboMax = Math.max(0, Number(this.build.car.maximumBoost || 0));

      if (this.dynoRunMode === 'power') {
        this.runProgress = clamp(this.runProgress + dt * Math.max(0.18, throttle) / 5.25, 0, 1);
        const startRPM = Math.max(Number(this.build.engine.idleRPM || 850) + 650, redline * 0.24);
        this.currentRPM = startRPM + (redline - startRPM) * this.runProgress;

        const turboRpm = Phaser.Math.Clamp((this.currentRPM - 1800) / 4300, 0, 1);
        this.currentBoost = turboMax * Math.pow(turboRpm, 1.18) * Math.pow(throttle, 0.88);
        const point = getDynoPoint(this.build, this.currentRPM, this.currentBoost, throttle);

        if (!this.points.length || point.rpm - this.lastRecordedRPM >= 300 || this.runProgress >= 0.999) {
          this.points.push({ ...point, speedKmh: this.getRollerTelemetry(throttle, input.clutch, this.currentBoost).speedKmh, gear: this.currentGear });
          this.lastRecordedRPM = point.rpm;
          this.redrawGraph();
        }

        const overallRatio = this.getOverallGearRatio(this.currentGear);
        const wheelRPM = this.currentRPM / overallRatio;
        const rotation = wheelRPM * (Math.PI * 2 / 60) * dt;
        this.wheelObjects.forEach(wheel => { if (wheel?.active) wheel.rotation += rotation; });
        this.redrawRollers(time * 0.18 + wheelRPM * 0.03);

        const vibration = Math.sin(time * 0.055) * (1.0 + throttle * 1.3);
        this.carBodyBase.forEach(item => { if (item.obj?.active) item.obj.y = item.y + vibration; });

        const telemetry = this.getRollerTelemetry(throttle, input.clutch, this.currentBoost);
        this.updateTelemetry(point, throttle);
        this.updateDynoHud(telemetry, 'POWER RUN // LIVE');
        this.audio?.update(telemetry, null, this.build.car, null, dt);

        if (this.runProgress >= 0.999) {
          this.redrawGraph();
          this.completePull();
        }
        return;
      }

      // DRIVETRAIN TEST: a lightweight road-load simulation. The engine curve
      // stays RPM-based; the gearbox transforms it into wheel torque, and
      // vehicle speed determines the RPM after every shift.
      const clutch = clamp(input.clutch, 0, 1);
      if (this.currentGear < 1) {
        this.currentGear = 1;
      }

      if (this.shiftCooldown <= 0) {
        const ratio = this.getOverallGearRatio(this.currentGear);
        const wheelRPM = this.getWheelRPMFromSpeed(this.vehicleSpeedMps);
        const targetRPM = this.vehicleSpeedMps < 0.5
          ? this.currentRPM
          : wheelRPM * ratio;
        this.currentRPM += (targetRPM - this.currentRPM) * Math.min(1, dt * 14);
      }

      const turboRpm = Phaser.Math.Clamp((this.currentRPM - 1800) / 4300, 0, 1);
      this.currentBoost = turboMax * Math.pow(turboRpm, 1.18) * Math.pow(throttle, 0.88);
      const enginePoint = getDynoPoint(this.build, this.currentRPM, this.currentBoost, throttle);
      const drivetrainPoint = this.getDrivetrainPoint(enginePoint, this.vehicleSpeedMps, this.currentGear);

      const massKg = Math.max(850, Number(this.build.car.massKg || this.build.car.weightKg || 1350));
      const wheelRadius = Math.max(0.20, Number(this.build.car.wheelRadius || 0.32));
      const wheelForce = drivetrainPoint.wheelTorqueNm / wheelRadius;
      const rolling = massKg * 9.81 * 0.015;
      const speed = Math.max(0, this.vehicleSpeedMps);
      const dragCoeff = Math.max(0.15, Number(this.build.car.dragCoefficient || this.build.car.cd || 0.30));
      const frontalArea = Math.max(1.4, Number(this.build.car.frontalAreaM2 || 2.0));
      const aero = 0.5 * 1.225 * dragCoeff * frontalArea * speed * speed;
      const tractionForce = Math.max(0, Number(this.build.car.tractionForceN || 0));
      const driveForce = tractionForce > 0 ? Math.min(wheelForce, tractionForce) : wheelForce;
      const netForce = Math.max(-massKg * 1.5, driveForce - rolling - aero);
      const acceleration = netForce / massKg;

      if (clutch < 0.20 && this.shiftCooldown <= 0) {
        this.vehicleSpeedMps = Math.max(0, this.vehicleSpeedMps + acceleration * dt);
        this.vehicleDistanceM += this.vehicleSpeedMps * dt;
      }

      this.currentRPM = Math.max(
        Number(this.build.engine.idleRPM || 850),
        this.getWheelRPMFromSpeed(this.vehicleSpeedMps) * this.getOverallGearRatio(this.currentGear)
      );

      if (this.currentRPM >= redline * 0.995 && this.currentGear >= Number(this.build.car.gearRatios?.length || 1)) {
        this.currentRPM = Math.min(this.currentRPM, redline);
        this.completePull();
        return;
      }

      if (this.dynoRunTime > 22) {
        this.completePull();
        return;
      }

      const finalPoint = this.getDrivetrainPoint(
        getDynoPoint(this.build, this.currentRPM, this.currentBoost, throttle),
        this.vehicleSpeedMps,
        this.currentGear
      );

      if (!this.points.length || this.dynoRunTime - this.lastRecordedTime >= 0.10 || this.currentRPM >= redline * 0.995) {
        this.points.push(finalPoint);
        this.lastRecordedTime = this.dynoRunTime;
        this.redrawGraph();
      }

      const wheelRPM = this.getWheelRPMFromSpeed(this.vehicleSpeedMps);
      const rotation = wheelRPM * (Math.PI * 2 / 60) * dt;
      this.wheelObjects.forEach(wheel => { if (wheel?.active) wheel.rotation += rotation; });
      this.redrawRollers(time * 0.18 + wheelRPM * 0.03);

      const vibration = Math.sin(time * 0.055) * (1.0 + throttle * 1.3);
      this.carBodyBase.forEach(item => { if (item.obj?.active) item.obj.y = item.y + vibration; });

      const telemetry = this.getRollerTelemetry(throttle, clutch, this.currentBoost);
      telemetry.speedKmh = this.vehicleSpeedMps * 3.6;
      telemetry.wheelRPM = wheelRPM;
      this.updateTelemetry(finalPoint, throttle);
      this.updateDynoHud(telemetry, 'DRIVETRAIN TEST // LIVE');
      this.audio?.update(telemetry, null, this.build.car, null, dt);
    } catch (error) {
      this.dynoUpdateError = error;
      this.pullState = 'ABORTED';
      if (this.controls) this.controls.enabled = false;
      this.currentBoost = 0;
      this.daichiText?.setText('DAICHI // DYNO SAFETY STOP. Pull aborted; the cell is still online.');
      this.refreshRunButton?.();
    }
  }

  returnToWorkshop() {
    this.registry.set('workshopLocationId', DYNO_WAREHOUSE_ID);
    this.registry.set('selectedCarId', this.carId);
    saveSessionState(this.registry);

    try {
      sessionStorage.setItem('tokyoShiftInternalReload', '1');
      sessionStorage.setItem('tokyoShiftForceGarage', '1');
      sessionStorage.removeItem('tokyoShiftBootMessage');
      window.location.reload();
      return;
    } catch (e) {}

    this.cleanup();
    this.scene.start('GarageScene', { workshopLocationId: DYNO_WAREHOUSE_ID });
  }
}
