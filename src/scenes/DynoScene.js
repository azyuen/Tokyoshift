import TouchControls from '../input/TouchControls.js?v=20260930-r299';
import RaceHUD from '../ui/RaceHUD.js?v=20261004-r321';
import EngineAudioSystem from '../audio/EngineAudioSystem.js?v=20260930-r300';

import { cars } from '../data/cars.js?v=20261005-r345';
import { characters, getCharacterAssetUrl } from '../data/characters.js?v=20261004-r333';
import { saveSessionState } from '../state/GameState.js?v=20261005-r350';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';
import {
  DYNO_WAREHOUSE_ID,
  getDynoStage,
  getRecommendedDynoGear,
  buildDynoCar,
  getDynoPoint,
  analyseDynoRun,
} from '../data/dyno.js?v=20261004-r331';
import { createOfficialDynoReading } from '../data/carRatings.js?v=20261004-r325';
import {
  STAGE3_CALIBRATION_OPTIONS,
  STAGE3_PRESET_SAVE_COST,
  MAX_STAGE3_PRESETS,
  normaliseStage3Calibration,
  getStage3CalibrationEligibility,
  getStage3CalibrationOption,
  describeStage3Calibration,
  getStage3Presets,
  findMatchingStage3Preset,
  normaliseStage3PresetName,
} from '../data/stage3Calibration.js?v=20261004-r330';
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
} from '../data/visualMods.js?v=20261005-r345';
import {
  createTunerDecalLayers,
  preloadTunerDecalAssets,
} from '../vehicles/TunerDecals.js?v=20260928-r242';
import { getWheelPairFit, getWheelContactOffsetY } from '../vehicles/WheelFit.js?v=20260929-r258';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20260930-r292';
import { getWorldPhase } from '../environment/WorldClock.js?v=20260929-r286';

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

  init(data = {}) {
    this.isRentalSession = Boolean(data?.rentalSession);
    this.rentalCarId = data?.carId || null;
    this.rentalReturnWorkshopId = data?.returnWorkshopId || null;
  }

  preload() {
    let queued = 0;
    const queueImage = (key, path) => {
      if (!key || !path || this.textures.exists(key)) return;
      this.load.image(key, path);
      queued += 1;
    };

    queueImage('dynoWarehouseDayBg', 'assets/Garage/shinonome_dyno_day.png?v=20261004-r322');
    queueImage('dynoWarehouseNightBg', 'assets/Garage/shinonome_dyno_night.png?v=20261004-r322');
    queueImage('hudCluster', 'assets/Ui/hud_cluster.png');
    queueImage('clutchPedal', 'assets/Controls/clutch_pedal.png');
    queueImage('throttlePedal', 'assets/Controls/throttle_pedal.png');
    queueImage('nosButton', 'assets/Controls/nos_button.png');
    queueImage('shifterNeutral', 'assets/Controls/shifter_neutral.png');
    queueImage('shifterDown', 'assets/Controls/shifter_down.png');

    queueImage('tuningPartEcuL3', 'assets/Tuning/Parts/ecu_l3.png?v=20261004-r325');
    queueImage('tuningPartTurboL3', 'assets/Tuning/Parts/turbo_l3.png?v=20261004-r325');
    queueImage('tuningPartGearboxL3', 'assets/Tuning/Parts/gearbox_l3.png?v=20261004-r325');

    const daichi = characters.daichiSakamoto;
    if (daichi?.visual) {
      queueImage(daichi.visual.spriteKey, getCharacterAssetUrl(daichi.visual.path));
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
    if (this.isRentalSession && this.rentalCarId && owned.includes(this.rentalCarId)) {
      return this.rentalCarId;
    }
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

    // R311 chart reset: clear all legacy Dyno graphs once. The marker lives
    // inside each car's dyno state so new cars are not repeatedly reset.
    const allCarStates = { ...(this.registry.get('carStates') || {}) };
    let chartResetChanged = false;
    Object.entries(allCarStates).forEach(([id, rawState]) => {
      const state = { ...(rawState || {}) };
      const dyno = { ...(state.dyno || {}) };
      if (dyno.chartResetVersion !== 1) {
        dyno.history = [];
        dyno.lastRun = null;
        dyno.bestRun = null;
        dyno.chartResetVersion = 1;
        state.dyno = dyno;
        allCarStates[id] = state;
        chartResetChanged = true;
      }
    });
    if (chartResetChanged) {
      this.registry.set('carStates', allCarStates);
      saveSessionState(this.registry);
    }

    this.carState = (this.registry.get('carStates') || {})[this.carId] || {};
    this.facilityTier = this.isRentalSession
      ? 1
      : Math.max(0, Number(this.registry.get('dynoFacilityTier') || 0));
    this.stage = getDynoStage(this.facilityTier);
    this.sessionPullsRemaining = this.isRentalSession ? 1 : 0;
    this.sessionPullsRemainingByMode = {
      power: this.isRentalSession ? 1 : 0,
      drivetrain: 0,
    };
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
    this.graphViewIndex = 0;
    this.pendingReplaceSlot = null;
    this.replacementCandidateSlot = null;
    this.replacementPopupObjects = [];
    this.awaitingNextPull = false;
    this.introUiObjects = [];
    this.activeUiObjects = [];
    this.shiftLabelObjects = [];
    this.dynoShifterInputShield = null;
    this.stage3PendingTune = null;
    this.stage3ReferenceIndex = 0;
    this.stage3StatusMessage = '';
    this.textEntryPopupObjects = [];
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
    (this.textEntryPopupObjects || []).forEach(obj => {
      try { obj?.destroy?.(); } catch (e) {}
    });
    this.textEntryPopupObjects = [];
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
    const dynoPhase = getWorldPhase() === 'day' ? 'day' : 'night';
    const dynoBgKey = dynoPhase === 'day' ? 'dynoWarehouseDayBg' : 'dynoWarehouseNightBg';
    if (this.textures.exists(dynoBgKey)) {
      this.add.image(WIDTH / 2, HEIGHT / 2, dynoBgKey)
        .setDisplaySize(WIDTH, HEIGHT)
        .setDepth(-15);
    }
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x02070d, 0.10).setDepth(-14);
  }

  drawHeader() {
    this.add.rectangle(780, 35, 1512, 62, 0x07111d, 0.96)
      .setStrokeStyle(2, 0x173249, 1)
      .setDepth(80);
    this.add.text(
      48,
      35,
      this.isRentalSession ? 'RENTED STAGE I // DYNO' : 'WAREHOUSE HQ // DYNO',
      {
        fontFamily: PIXEL_FONT, fontSize: '18px', color: '#eefaff'
      }
    ).setOrigin(0, 0.5).setDepth(81);

    const cash = Number(this.registry.get('cash') || 0);
    this.cashText = this.add.text(1512, 35, '¥ ' + cash.toLocaleString('en-US'), {
      fontFamily: PIXEL_FONT, fontSize: '14px', color: '#ffe08a'
    }).setOrigin(1, 0.5).setDepth(81);

    this.pullCounterText = this.add.text(1190, 35, 'DYNO OPTIONS', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#9edcf7'
    }).setOrigin(1, 0.5).setDepth(81);
    this.setHeaderContext('DYNO OPTIONS');
  }

  setHeaderContext(label = 'DYNO OPTIONS') {
    this.pullCounterText?.setText(String(label).toUpperCase());
  }

  drawNoCarState(message = this.isRentalSession ? 'RENTAL CAR UNAVAILABLE' : 'NO CAR STORED AT WAREHOUSE HQ') {
    this.add.rectangle(780, 420, 760, 310, 0x07111d, 0.94)
      .setStrokeStyle(2, 0x315470, 1)
      .setDepth(20);
    this.add.text(780, 375, message, {
      fontFamily: PIXEL_FONT, fontSize: '14px', color: '#eefaff'
    }).setOrigin(0.5).setDepth(21);
    this.add.text(
      780,
      430,
      this.isRentalSession
        ? 'Return to the workshop and book a new rental session.'
        : 'Move a car to Warehouse HQ before using the dyno.',
      {
        fontFamily: BODY_FONT, fontSize: '13px', color: '#a7bdca', fontStyle: '600'
      }
    ).setOrigin(0.5).setDepth(21);
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
    this.powerAxisLabel = this.add.text(MONITOR.x + MONITOR.w - 18, MONITOR.y + 44, 'POWER', {
      fontFamily: PIXEL_FONT, fontSize: '6px', color: '#7df6a8'
    }).setOrigin(1, 0).setDepth(21);

    this.telemetryText = this.add.text(
      MONITOR.x + 18,
      MONITOR.y + MONITOR.h - 20,
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
      const sprite = this.add.image(330, 565, daichi.visual.spriteKey)
        .setOrigin(0.5, 1)
        .setDepth(15);
      const source = this.textures.get(daichi.visual.spriteKey).getSourceImage();
      sprite.setScale(270 / Math.max(1, source.height));
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
      showGear: true,
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

  clearShiftLabels() {
    (this.shiftLabelObjects || []).forEach(obj => {
      try { obj?.destroy?.(); } catch (e) {}
    });
    this.shiftLabelObjects = [];
  }

  drawIntroUi() {
    this.clearUiObjects('activeUiObjects');
    this.clearUiObjects('introUiObjects');
    this.clearShiftLabels();
    this.dynoUiMode = 'intro';
    if (this.controls) this.controls.enabled = false;
    this.setDynoShifterShieldEnabled(false);
    [this.controls?.clutchSprite, this.controls?.nosSprite, this.controls?.shifterSprite, this.controls?.throttleSprite].forEach(obj => obj?.setVisible(false));
    if (this.dynoHud) Object.values(this.dynoHud).forEach(obj => obj?.setVisible?.(false));
    this.dynoHud?.gearBack?.setVisible(false);
    this.dynoHud?.gearText?.setVisible(false);
    this.runButton = null;
    this.resultsButton = null;
    this.setHeaderContext('DYNO OPTIONS');

    const add = obj => this.addUiObject('introUiObjects', obj);
    const x = 1320;
    const powerCost = 5000;
    const drivetrainCost = 15000;

    const stageActionLabel = (mode, cost) => {
      if (this.sessionPullsRemaining > 0 && this.dynoRunMode === mode) {
        return this.sessionPullsRemaining + ' RUN' + (this.sessionPullsRemaining === 1 ? '' : 'S') + ' REMAINING';
      }
      return '';
    };

    const cardLeft = 92;
    const cardHeight = 96;
    const cardWidth = 380;
    const powerTop = cardLeft;
    const powerBottom = powerTop + cardHeight;
    const driveTop = powerBottom + 10;
    const driveBottom = driveTop + cardHeight;
    const nextTop = driveBottom + 10;
    const nextBottom = nextTop + cardHeight;

    const drawStageCard = (top, accent, title, body, stage, action, onClick, locked = false) => {
      const bottom = top + cardHeight;
      const box = add(this.add.rectangle(x, (top + bottom) / 2, cardWidth, cardHeight,
        locked ? 0x0b1017 : 0x07111d, 0.97)
        .setStrokeStyle(2, locked ? 0x6b5b37 : accent, locked ? 0.86 : 0.95)
        .setInteractive({ useHandCursor: !locked }).setDepth(28));
      add(this.add.text(1148, top + 13, title, {
        fontFamily: BODY_FONT, fontSize: '9px',
        color: locked ? '#8f8770' : '#b8dce8', fontStyle: '700'
      }).setDepth(29));
      add(this.add.text(1490, top + 9, stage, {
        fontFamily: PIXEL_FONT, fontSize: '5px',
        color: locked ? '#aa9e80' : accent
      }).setOrigin(1, 0).setDepth(29));
      add(this.add.text(1148, top + 39, body, {
        fontFamily: BODY_FONT, fontSize: '8px',
        color: locked ? '#aa9e80' : '#b8dce8',
        fontStyle: '700', lineSpacing: 3, wordWrap: { width: 340 }
      }).setDepth(29));
      if (action) {
        add(this.add.text(1490, bottom - 10, action, {
          fontFamily: PIXEL_FONT, fontSize: '6px',
          color: locked ? '#aa9e80' : accent
        }).setOrigin(1, 1).setDepth(29));
      }
      if (!locked) box.on('pointerdown', onClick);
      return box;
    };

    if (this.isRentalSession) {
      const remaining = this.getModeSessionRemaining('power');
      this.setHeaderContext('RENTED STAGE I SESSION');

      drawStageCard(
        powerTop,
        remaining > 0 ? 0x62e8c7 : 0x6b5b37,
        remaining > 0
          ? 'RENTED POWER RUN  //  SESSION PAID'
          : 'RENTAL SESSION COMPLETE',
        remaining > 0
          ? '1 CLEAN PULL  //  OFFICIAL POWER + TORQUE + SAVED GRAPH'
          : 'RETURN TO THE WORKSHOP TO BOOK ANOTHER SESSION',
        'STAGE 1',
        remaining > 0 ? 'PAID // ¥100,000' : '1 / 1 RUN USED',
        remaining > 0 ? () => this.enterDynoTest('power') : null,
        remaining <= 0
      );

      add(this.add.text(1320, 255,
        'RENTAL ACCESS\nPOWER RUN ONLY\nNO STAGE II / III',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '6px',
          color: '#829aa8',
          align: 'center',
          lineSpacing: 6,
        }
      ).setOrigin(0.5).setDepth(29));

      const back = add(this.add.rectangle(1320, 360, cardWidth, 50, 0x102138, 0.98)
        .setStrokeStyle(2, 0x55b8ff, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(31));
      add(this.add.text(1320, 360, 'RETURN TO WORKSHOP', {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#eef8ff',
      }).setOrigin(0.5).setDepth(32));
      back.on('pointerdown', () => this.returnToWorkshop());
      return;
    }

    drawStageCard(
      powerTop, 0x62e8c7, 'POWER RUN  //  BASELINE ENGINE CURVE',
      '1 CLEAN PULL  //  POWER + TORQUE VS RPM',
      'STAGE 1', stageActionLabel('power', powerCost),
      () => this.enterDynoTest('power')
    );

    const cash = Math.max(0, Number(this.registry.get('cash') || 0));
    const stageTwo = getDynoStage(2);
    const stageThree = getDynoStage(3);

    if (this.facilityTier >= 2) {
      drawStageCard(
        driveTop, 0x43dfff, 'DRIVETRAIN TEST  //  3 ATTEMPTS',
        'STANDING START  //  SHIFT THROUGH THE GEARS\nSEE RPM DROP + DELIVERED POWER AT EACH SHIFT',
        'STAGE 2', stageActionLabel('drivetrain', drivetrainCost),
        () => this.enterDynoTest('drivetrain')
      );
    } else {
      const stageTwoCost = Number(stageTwo.installCost || 0);
      drawStageCard(
        driveTop,
        cash >= stageTwoCost ? 0x43dfff : 0x7b5962,
        'LOAD DYNO + ECU  //  FACILITY UPGRADE',
        'UNLOCK DRIVETRAIN TEST + ROAD-LOAD SIMULATION',
        'STAGE 2',
        (cash >= stageTwoCost ? 'INSTALL // ¥ ' : 'NEED // ¥ ') +
          stageTwoCost.toLocaleString('en-US'),
        () => this.purchaseDynoFacilityStage(2)
      );
    }

    if (this.facilityTier >= 3) {
      drawStageCard(
        nextTop, 0xd9b65f,
        'TUNING CONSOLE  //  TRADE-OFF SETUP',
        'ECU CURVE + BOOST CURVE + GEAR SPREAD',
        'STAGE 3',
        'OPEN TUNING CONSOLE',
        () => this.openStage3Tuning()
      );
    } else if (this.facilityTier === 2) {
      const stageThreeCost = Number(stageThree.installCost || 0);
      drawStageCard(
        nextTop,
        cash >= stageThreeCost ? 0xd9b65f : 0x7b5962,
        'COMPETITION CALIBRATION CELL',
        'END-GAME TUNING // ECU + BOOST + GEAR SPREAD',
        'STAGE 3',
        (cash >= stageThreeCost ? 'INSTALL // ¥ ' : 'NEED // ¥ ') +
          stageThreeCost.toLocaleString('en-US'),
        () => this.purchaseDynoFacilityStage(3)
      );
    } else {
      drawStageCard(
        nextTop, 0x6b5b37,
        'COMPETITION CALIBRATION CELL',
        'INSTALL THE STAGE II LOAD DYNO FIRST',
        'STAGE 3',
        'REQUIRES STAGE 2',
        null,
        true
      );
    }

    const graphY = 440;
    const graphBox = add(this.add.rectangle(x, graphY, cardWidth, 50, 0x102138, 0.98)
      .setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true }).setDepth(31));
    add(this.add.text(x, graphY, 'GRAPH MANAGEMENT', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#eef8ff'
    }).setOrigin(0.5).setDepth(32));
    graphBox.on('pointerdown', () => this.openGraphManagement());

    const backY = 500;
    const back = add(this.add.rectangle(x, backY, cardWidth, 50, 0x102138, 0.98)
      .setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true }).setDepth(31));
    add(this.add.text(x, backY, 'RETURN TO WORKSHOP', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#eef8ff'
    }).setOrigin(0.5).setDepth(32));
    back.on('pointerdown', () => this.returnToWorkshop());
  }


  purchaseDynoFacilityStage(targetTier) {
    const target = Math.max(1, Math.min(3, Math.floor(Number(targetTier) || 0)));
    if (target !== this.facilityTier + 1) return;

    const stage = getDynoStage(target);
    const cost = Math.max(0, Number(stage.installCost || 0));
    const cash = Math.max(0, Number(this.registry.get('cash') || 0));

    if (cash < cost) {
      this.daichiText?.setText(
        'DAICHI // You need ¥' + cost.toLocaleString('en-US') +
        ' to install ' + String(stage.shortLabel || stage.label || 'the next dyno stage') + '.'
      );
      return;
    }

    const remaining = cash - cost;
    this.registry.set('cash', remaining);
    this.registry.set('dynoFacilityTier', target);
    this.facilityTier = target;
    this.stage = stage;
    this.cashText?.setText('¥ ' + remaining.toLocaleString('en-US'));
    saveSessionState(this.registry);

    this.daichiText?.setText(
      target >= 3
        ? 'DAICHI // Competition Calibration Cell installed. Stage III tuning is online.'
        : 'DAICHI // Load Dyno installed. Drivetrain testing is now available.'
    );
    this.drawIntroUi();
  }

  closeTextEntryPopup() {
    if (this.textEntryKeyboardHandler) {
      try { this.input.keyboard?.off?.('keydown', this.textEntryKeyboardHandler); } catch (e) {}
      this.textEntryKeyboardHandler = null;
    }
    (this.textEntryPopupObjects || []).forEach(obj => {
      try { obj?.destroy?.(); } catch (e) {}
    });
    this.textEntryPopupObjects = [];
  }

  openTextEntryPopup({
    title = 'ENTER NAME',
    initialValue = '',
    confirmLabel = 'SAVE',
    maxLength = 8,
    onConfirm = null,
  } = {}) {
    this.closeTextEntryPopup();
    this.setDynoShifterShieldEnabled(false);

    const objects = [];
    const add = obj => {
      objects.push(obj);
      return obj;
    };
    this.textEntryPopupObjects = objects;
    const depth = 210;
    let value = String(initialValue || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLength)
      .toUpperCase();
    let replaceOnFirstCharacter = Boolean(value);

    add(this.add.rectangle(780, 420, 1560, 840, 0x010306, 0.78)
      .setDepth(depth)
      .setInteractive());

    add(this.add.rectangle(780, 420, 1180, 720, 0x07111d, 0.995)
      .setStrokeStyle(2, 0x55b8ff, 1)
      .setDepth(depth + 1));

    add(this.add.text(780, 105, title, {
      fontFamily: PIXEL_FONT,
      fontSize: '11px',
      color: '#eefaff',
      align: 'center',
    }).setOrigin(0.5).setDepth(depth + 2));

    add(this.add.rectangle(780, 170, 900, 66, 0x0b1620, 1)
      .setStrokeStyle(2, 0x557d93, 1)
      .setDepth(depth + 2));

    const valueText = add(this.add.text(780, 170, value || ' ', {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#eefaff',
      align: 'center',
    }).setOrigin(0.5).setDepth(depth + 3));

    const countText = add(this.add.text(1215, 207, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '4px',
      color: '#7895a5',
    }).setOrigin(1, 0.5).setDepth(depth + 3));

    add(this.add.text(780, 225, 'TOUCH KEYS TO NAME THIS SETUP', {
      fontFamily: PIXEL_FONT,
      fontSize: '5px',
      color: '#7895a5',
    }).setOrigin(0.5).setDepth(depth + 2));

    const refreshValue = () => {
      valueText.setText(value || ' ');
      countText.setText(value.length + ' / ' + maxLength);
    };
    refreshValue();

    const appendCharacter = character => {
      if (replaceOnFirstCharacter) {
        value = '';
        replaceOnFirstCharacter = false;
      }
      if (value.length >= maxLength) return;
      value += character;
      refreshValue();
    };

    const backspace = () => {
      replaceOnFirstCharacter = false;
      value = value.slice(0, -1);
      refreshValue();
    };

    const clear = () => {
      replaceOnFirstCharacter = false;
      value = '';
      refreshValue();
    };

    const keyRows = [
      { chars: ['1','2','3','4','5','6','7','8','9','0'], y: 300 },
      { chars: ['Q','W','E','R','T','Y','U','I','O','P'], y: 370 },
      { chars: ['A','S','D','F','G','H','J','K','L'], y: 440 },
      { chars: ['Z','X','C','V','B','N','M','-','/','#'], y: 510 },
    ];

    keyRows.forEach(row => {
      const keyW = 78;
      const gap = 10;
      const totalW = row.chars.length * keyW + (row.chars.length - 1) * gap;
      const startX = 780 - totalW / 2 + keyW / 2;

      row.chars.forEach((character, index) => {
        const x = startX + index * (keyW + gap);
        const key = add(this.add.rectangle(x, row.y, keyW, 44, 0x102138, 1)
          .setStrokeStyle(1, 0x557d93, 0.92)
          .setInteractive({ useHandCursor: true })
          .setDepth(depth + 2));
        add(this.add.text(x, row.y, character, {
          fontFamily: PIXEL_FONT,
          fontSize: '8px',
          color: '#eaf7ff',
        }).setOrigin(0.5).setDepth(depth + 3));
        key.on('pointerdown', () => appendCharacter(character));
      });
    });

    const specialY = 585;
    const space = add(this.add.rectangle(585, specialY, 330, 52, 0x102138, 1)
      .setStrokeStyle(1, 0x557d93, 0.92)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    add(this.add.text(585, specialY, 'SPACE', {
      fontFamily: PIXEL_FONT,
      fontSize: '6px',
      color: '#eaf7ff',
    }).setOrigin(0.5).setDepth(depth + 3));
    space.on('pointerdown', () => appendCharacter(' '));

    const back = add(this.add.rectangle(875, specialY, 170, 52, 0x102138, 1)
      .setStrokeStyle(1, 0x557d93, 0.92)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    add(this.add.text(875, specialY, 'BACK', {
      fontFamily: PIXEL_FONT,
      fontSize: '6px',
      color: '#eaf7ff',
    }).setOrigin(0.5).setDepth(depth + 3));
    back.on('pointerdown', backspace);

    const clearBox = add(this.add.rectangle(1065, specialY, 170, 52, 0x21171b, 1)
      .setStrokeStyle(1, 0x9b6672, 0.92)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    add(this.add.text(1065, specialY, 'CLEAR', {
      fontFamily: PIXEL_FONT,
      fontSize: '6px',
      color: '#f2c9d2',
    }).setOrigin(0.5).setDepth(depth + 3));
    clearBox.on('pointerdown', clear);

    const submit = () => {
      const finalValue = value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
      if (!finalValue) return;
      this.closeTextEntryPopup();
      onConfirm?.(finalValue);
    };

    const confirm = add(this.add.rectangle(650, 665, 340, 56, 0x0c2827, 1)
      .setStrokeStyle(2, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    add(this.add.text(650, 665, confirmLabel, {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#f1fffb',
      align: 'center',
    }).setOrigin(0.5).setDepth(depth + 3));
    confirm.on('pointerdown', submit);

    const cancel = add(this.add.rectangle(1010, 665, 300, 56, 0x102138, 1)
      .setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    add(this.add.text(1010, 665, 'CANCEL', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#d4e6ef',
    }).setOrigin(0.5).setDepth(depth + 3));
    cancel.on('pointerdown', () => this.closeTextEntryPopup());

    this.textEntryKeyboardHandler = event => {
      if (!event) return;
      const key = String(event.key || '');
      if (/^[a-z0-9#\-/]$/i.test(key)) {
        appendCharacter(key.toUpperCase());
      } else if (key === ' ') {
        appendCharacter(' ');
      } else if (key === 'Backspace') {
        backspace();
      } else if (key === 'Enter') {
        submit();
      } else if (key === 'Escape') {
        this.closeTextEntryPopup();
      }
    };
    this.input.keyboard?.on?.('keydown', this.textEntryKeyboardHandler);
  }

  openStage3Tuning() {
    if (this.facilityTier < 3 || !this.carId) return;

    if (this.controls) this.controls.enabled = false;
    this.setDynoShifterShieldEnabled(false);
    [
      this.controls?.clutchSprite,
      this.controls?.nosSprite,
      this.controls?.shifterSprite,
      this.controls?.throttleSprite,
    ].forEach(obj => obj?.setVisible(false));

    if (this.dynoHud) Object.values(this.dynoHud).forEach(obj => obj?.setVisible?.(false));
    this.dynoHud?.gearBack?.setVisible(false);
    this.dynoHud?.gearText?.setVisible(false);
    this.daichiMessageBoard?.setVisible(false);
    this.daichiText?.setVisible(false);

    this.pullState = 'IDLE';
    this.points = [];
    this.shiftEvents = [];
    this.clearShiftLabels();
    this.clearUiObjects('introUiObjects');
    this.clearUiObjects('activeUiObjects');

    this.dynoUiMode = 'stage3Tuning';
    this.dynoRunMode = 'power';
    this.stage3PendingTune = normaliseStage3Calibration(this.carState || {});
    this.stage3StatusMessage = '';
    this.setHeaderContext('STAGE III // TUNING CONSOLE');

    const runs = this.getDynoGraphSlots('power');
    const firstSaved = runs.findIndex(Boolean);
    this.stage3ReferenceIndex = firstSaved >= 0 ? firstSaved : 0;
    this.graphViewIndex = this.stage3ReferenceIndex;
    this.previousRun = runs[this.stage3ReferenceIndex] || null;

    this.renderStage3Tuning();
  }

  renderStage3Tuning() {
    if (this.dynoUiMode !== 'stage3Tuning') return;
    this.clearUiObjects('activeUiObjects');

    const add = obj => this.addUiObject('activeUiObjects', obj);
    const panelX = 1265;
    const panelY = 450;
    const panelW = 570;
    const panelH = 780;
    const eligibility = getStage3CalibrationEligibility(this.carState || {});
    const tune = normaliseStage3Calibration(this.stage3PendingTune || {});
    const powerRuns = this.getDynoGraphSlots('power');

    add(this.add.rectangle(panelX, panelY, panelW, panelH, 0x02070d, 0.94)
      .setStrokeStyle(2, 0xd9b65f, 0.86)
      .setDepth(30));

    add(this.add.text(panelX, 99, 'STAGE III // CALIBRATION', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#ffe08a',
    }).setOrigin(0.5).setDepth(32));

    add(this.add.text(panelX, 126, 'SAVED DYNO REFERENCE', {
      fontFamily: PIXEL_FONT,
      fontSize: '5px',
      color: '#88a8ba',
    }).setOrigin(0.5).setDepth(32));

    [0, 1, 2].forEach(index => {
      const bx = 1085 + index * 180;
      const run = powerRuns[index];
      const selected = Boolean(run) && index === this.stage3ReferenceIndex;
      const box = add(this.add.rectangle(
        bx,
        160,
        150,
        36,
        run ? (selected ? 0x243a32 : 0x102138) : 0x0b1017,
        0.98
      )
        .setStrokeStyle(2, run ? (selected ? 0xffd45a : 0x456f82) : 0x394752, 0.92)
        .setDepth(31));

      const graphLabel = run?.label || ('GRAPH ' + (index + 1));
      add(this.add.text(bx, 160, run ? graphLabel : 'EMPTY', {
        fontFamily: PIXEL_FONT,
        fontSize: '5px',
        color: run ? (selected ? '#ffe58a' : '#b9d9e8') : '#687983',
      }).setOrigin(0.5).setDepth(32));

      if (run) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => {
          this.stage3ReferenceIndex = index;
          this.graphViewIndex = index;
          this.previousRun = powerRuns[index];
          this.renderStage3Tuning();
        });
      }
    });

    const selectedRun = powerRuns[this.stage3ReferenceIndex] || null;
    const refTune = describeStage3Calibration(selectedRun?.stage3Calibration || {});
    add(this.add.text(
      panelX,
      193,
      selectedRun
        ? 'REF  //  ECU ' + refTune.ecu +
          '  //  BOOST ' + refTune.boost +
          '  //  GEARS ' + refTune.gears
        : 'NO SAVED POWER GRAPH YET',
      {
        fontFamily: BODY_FONT,
        fontSize: '7px',
        color: selectedRun ? '#9fb6c3' : '#748793',
        fontStyle: '700',
        align: 'center',
        wordWrap: { width: 520 },
      }
    ).setOrigin(0.5).setDepth(32));

    const activeTune = normaliseStage3Calibration(this.carState || {});
    const activeLabels = describeStage3Calibration(activeTune);
    const pendingTune = normaliseStage3Calibration(this.stage3PendingTune || {});
    const hasPendingChanges =
      activeTune.ecuBias !== pendingTune.ecuBias ||
      activeTune.boostBias !== pendingTune.boostBias ||
      activeTune.gearBias !== pendingTune.gearBias;

    add(this.add.text(
      panelX,
      220,
      'ACTIVE // ECU ' + activeLabels.ecu +
        ' // BOOST ' + activeLabels.boost +
        ' // GEARS ' + activeLabels.gears +
        (hasPendingChanges ? ' // PENDING CHANGES' : ''),
      {
        fontFamily: PIXEL_FONT,
        fontSize: '4px',
        color: hasPendingChanges ? '#ffcf71' : '#72e7bd',
        align: 'center',
        wordWrap: { width: 520 },
      }
    ).setOrigin(0.5).setDepth(32));

    const rows = [
      {
        key: 'ecuBias',
        y: 325,
        title: 'ECU CURVE',
        sprite: 'tuningPartEcuL3',
        requirement: 'REQUIRES MOTORSPORT ECU // LEVEL 3',
        left: 'MIDRANGE',
        right: 'TOP END',
        accent: 0x62e8c7,
      },
      {
        key: 'boostBias',
        y: 465,
        title: 'BOOST CURVE',
        sprite: 'tuningPartTurboL3',
        requirement: 'REQUIRES BIG TURBO // LEVEL 3',
        left: 'EARLY',
        right: 'LATE / STRONG',
        accent: 0x43dfff,
      },
      {
        key: 'gearBias',
        y: 605,
        title: 'GEAR SPREAD',
        sprite: 'tuningPartGearboxL3',
        requirement: 'REQUIRES DOG BOX // LEVEL 3',
        left: 'CLOSE',
        right: 'WIDE',
        accent: 0xffc86a,
      },
    ];

    rows.forEach(row => {
      const unlocked = Boolean(eligibility[row.key]);
      const current = tune[row.key];
      const option = getStage3CalibrationOption(row.key, current);

      add(this.add.rectangle(panelX, row.y, 530, 118, 0x07111d, unlocked ? 0.86 : 0.72)
        .setStrokeStyle(1, unlocked ? row.accent : 0x47535a, unlocked ? 0.62 : 0.48)
        .setDepth(30.5));

      const sprite = add(this.add.image(1070, row.y, row.sprite)
        .setDepth(32)
        .setAlpha(unlocked ? 1 : 0.30));
      if (this.textures.exists(row.sprite)) {
        const source = this.textures.get(row.sprite).getSourceImage();
        sprite.setScale(Math.min(62 / Math.max(1, source.width), 62 / Math.max(1, source.height)));
      }

      add(this.add.text(1120, row.y - 42, row.title + '  //  ' + (option?.label || 'BALANCED'), {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: unlocked
          ? '#' + row.accent.toString(16).padStart(6, '0')
          : '#71808a',
      }).setDepth(32));

      if (!unlocked) {
        add(this.add.text(1120, row.y + 5, row.requirement, {
          fontFamily: PIXEL_FONT,
          fontSize: '5px',
          color: '#806f62',
          wordWrap: { width: 410 },
        }).setDepth(32));
        return;
      }

      add(this.add.text(1220, row.y - 10, row.left, {
        fontFamily: BODY_FONT,
        fontSize: '6px',
        color: '#839aa8',
        fontStyle: '700',
      }).setOrigin(1, 0.5).setDepth(32));

      add(this.add.text(1510, row.y - 10, row.right, {
        fontFamily: BODY_FONT,
        fontSize: '6px',
        color: '#839aa8',
        fontStyle: '700',
      }).setOrigin(1, 0.5).setDepth(32));

      STAGE3_CALIBRATION_OPTIONS[row.key].forEach((preset, presetIndex) => {
        const bx = 1230 + presetIndex * 62;
        const selected = preset.value === current;
        const button = add(this.add.rectangle(
          bx,
          row.y + 15,
          36,
          28,
          selected ? row.accent : 0x102138,
          selected ? 0.92 : 0.98
        )
          .setStrokeStyle(1, selected ? 0xffffff : row.accent, selected ? 0.85 : 0.55)
          .setInteractive({ useHandCursor: true })
          .setDepth(31));

        add(this.add.text(
          bx,
          row.y + 15,
          preset.value > 0 ? '+' + preset.value : String(preset.value),
          {
            fontFamily: PIXEL_FONT,
            fontSize: '4px',
            color: selected ? '#07111d' : '#dcecf4',
          }
        ).setOrigin(0.5).setDepth(32));

        button.on('pointerdown', () => {
          this.stage3PendingTune = {
            ...normaliseStage3Calibration(this.stage3PendingTune || {}),
            [row.key]: preset.value,
          };
          this.stage3StatusMessage = '';
          this.renderStage3Tuning();
        });
      });

      add(this.add.text(1365, row.y + 47, option?.detail || '', {
        fontFamily: BODY_FONT,
        fontSize: '6px',
        color: '#9ab0bc',
        fontStyle: '700',
        align: 'center',
        wordWrap: { width: 355 },
      }).setOrigin(0.5).setDepth(32));
    });

    const save = add(this.add.rectangle(1095, 730, 150, 44, 0x2a2615, 0.98)
      .setStrokeStyle(2, 0xffd45a, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(31));
    add(this.add.text(1095, 730, 'APPLY TUNE', {
      fontFamily: PIXEL_FONT,
      fontSize: '6px',
      color: '#fff0b5',
    }).setOrigin(0.5).setDepth(32));
    save.on('pointerdown', () => this.saveStage3Tuning());

    const presets = getStage3Presets(this.carState || {});
    const presetCount = presets.filter(Boolean).length;
    const presetButton = add(this.add.rectangle(1270, 730, 180, 44, 0x1d2418, 0.98)
      .setStrokeStyle(2, 0xd9b65f, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(31));
    add(this.add.text(1270, 730, 'PRESETS ' + presetCount + '/' + MAX_STAGE3_PRESETS, {
      fontFamily: PIXEL_FONT,
      fontSize: '5px',
      color: '#ffe08a',
    }).setOrigin(0.5).setDepth(32));
    presetButton.on('pointerdown', () => this.openStage3PresetManager());

    const reset = add(this.add.rectangle(1450, 730, 150, 44, 0x102138, 0.98)
      .setStrokeStyle(2, 0x65879a, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(31));
    add(this.add.text(1450, 730, 'BALANCED', {
      fontFamily: PIXEL_FONT,
      fontSize: '5px',
      color: '#cce4ef',
    }).setOrigin(0.5).setDepth(32));
    reset.on('pointerdown', () => {
      this.stage3PendingTune = { ecuBias: 0, boostBias: 0, gearBias: 0 };
      this.stage3StatusMessage = 'BALANCED PRESET LOADED // APPLY TUNE TO USE';
      this.renderStage3Tuning();
    });

    const back = add(this.add.rectangle(panelX, 785, 420, 44, 0x102138, 0.98)
      .setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(31));
    add(this.add.text(panelX, 785, 'RETURN TO DYNO', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#eef8ff',
    }).setOrigin(0.5).setDepth(32));
    back.on('pointerdown', () => {
      this.daichiMessageBoard?.setVisible(true);
      this.daichiText?.setVisible(true);
      this.returnToDynoMenu();
    });

    if (this.stage3StatusMessage) {
      add(this.add.text(panelX, 690, this.stage3StatusMessage, {
        fontFamily: PIXEL_FONT,
        fontSize: '5px',
        color: '#ffe08a',
        align: 'center',
        wordWrap: { width: 520 },
      }).setOrigin(0.5).setDepth(32));
    }

    this.graphViewIndex = this.stage3ReferenceIndex;
    this.previousRun = selectedRun;
    this.points = [];
    this.dynoRunMode = 'power';
    this.redrawGraph();
  }

  openStage3PresetManager() {
    if (this.facilityTier < 3 || !this.carId) return;

    this.setDynoShifterShieldEnabled(false);
    this.clearUiObjects('activeUiObjects');
    this.dynoUiMode = 'stage3Presets';
    this.setHeaderContext('STAGE III // PRESETS');

    const add = obj => this.addUiObject('activeUiObjects', obj);
    const x = 1265;
    const presets = getStage3Presets(this.carState || {});
    const pending = normaliseStage3Calibration(this.stage3PendingTune || this.carState || {});

    add(this.add.rectangle(x, 420, 570, 690, 0x02070d, 0.95)
      .setStrokeStyle(2, 0xd9b65f, 0.9)
      .setDepth(30));

    add(this.add.text(x, 98, 'TUNE PRESETS // THIS CAR', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#ffe08a',
    }).setOrigin(0.5).setDepth(32));

    add(this.add.text(x, 127,
      'SAVE / OVERWRITE  ¥' + STAGE3_PRESET_SAVE_COST.toLocaleString('en-US') +
      '  //  LOAD + RENAME FREE',
      {
        fontFamily: BODY_FONT,
        fontSize: '7px',
        color: '#9fb3bf',
        fontStyle: '700',
      }
    ).setOrigin(0.5).setDepth(32));

    if (this.stage3StatusMessage) {
      add(this.add.text(x, 154, this.stage3StatusMessage, {
        fontFamily: PIXEL_FONT,
        fontSize: '4px',
        color: '#ffe08a',
        align: 'center',
        wordWrap: { width: 420 },
      }).setOrigin(0.5).setDepth(32));
    }

    presets.forEach((preset, index) => {
      const y = 235 + index * 155;
      const occupied = Boolean(preset);
      const tune = occupied ? preset.calibration : pending;
      const labels = describeStage3Calibration(tune);

      add(this.add.rectangle(x, y, 530, 136, occupied ? 0x07111d : 0x090d11, 0.94)
        .setStrokeStyle(2, occupied ? 0x8e7742 : 0x3f4b52, 0.86)
        .setDepth(30.5));

      add(this.add.text(1020, y - 48,
        occupied ? preset.name : ('EMPTY PRESET ' + (index + 1)),
        {
          fontFamily: PIXEL_FONT,
          fontSize: '6px',
          color: occupied ? '#ffe08a' : '#74838c',
        }
      ).setDepth(32));

      add(this.add.text(1020, y - 16,
        'ECU ' + labels.ecu + '\n' +
        'BOOST ' + labels.boost + '\n' +
        'GEARS ' + labels.gears,
        {
          fontFamily: BODY_FONT,
          fontSize: '7px',
          color: occupied ? '#b6cad5' : '#6f7e87',
          fontStyle: '700',
          lineSpacing: 3,
        }
      ).setDepth(32));

      const saveBox = add(this.add.rectangle(1395, y - 28, 150, 38, 0x2a2615, 0.98)
        .setStrokeStyle(1, 0xd9b65f, 0.92)
        .setInteractive({ useHandCursor: true })
        .setDepth(31));
      add(this.add.text(
        1395,
        y - 28,
        occupied ? 'OVERWRITE' : 'SAVE CURRENT',
        {
          fontFamily: PIXEL_FONT,
          fontSize: occupied ? '5px' : '4px',
          color: '#ffe6a0',
        }
      ).setOrigin(0.5).setDepth(32));
      saveBox.on('pointerdown', () => this.saveStage3Preset(index));

      const loadBox = add(this.add.rectangle(1320, y + 27, 120, 36, 0x102138, 0.98)
        .setStrokeStyle(1, occupied ? 0x62e8c7 : 0x46515a, 0.9)
        .setDepth(31));
      add(this.add.text(1320, y + 27, occupied ? 'LOAD' : 'NO PRESET', {
        fontFamily: PIXEL_FONT,
        fontSize: '5px',
        color: occupied ? '#dffbf3' : '#687983',
      }).setOrigin(0.5).setDepth(32));
      if (occupied) {
        loadBox.setInteractive({ useHandCursor: true });
        loadBox.on('pointerdown', () => {
          this.stage3PendingTune = { ...preset.calibration };
          this.stage3StatusMessage = 'LOADED ' + preset.name + ' // APPLY TUNE TO USE';
          this.dynoUiMode = 'stage3Tuning';
          this.renderStage3Tuning();
        });
      }

      const renameBox = add(this.add.rectangle(1450, y + 27, 120, 36, 0x102138, 0.98)
        .setStrokeStyle(1, occupied ? 0x55b8ff : 0x46515a, 0.9)
        .setDepth(31));
      add(this.add.text(1450, y + 27, occupied ? 'RENAME' : '—', {
        fontFamily: PIXEL_FONT,
        fontSize: '5px',
        color: occupied ? '#d5edfa' : '#687983',
      }).setOrigin(0.5).setDepth(32));
      if (occupied) {
        renameBox.setInteractive({ useHandCursor: true });
        renameBox.on('pointerdown', () => this.renameStage3Preset(index));
      }
    });

    const back = add(this.add.rectangle(x, 715, 420, 46, 0x102138, 0.98)
      .setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(31));
    add(this.add.text(x, 715, 'RETURN TO TUNING', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#eef8ff',
    }).setOrigin(0.5).setDepth(32));
    back.on('pointerdown', () => {
      this.dynoUiMode = 'stage3Tuning';
      this.renderStage3Tuning();
    });
  }

  saveStage3Preset(index) {
    const slot = Math.max(0, Math.min(MAX_STAGE3_PRESETS - 1, Math.floor(Number(index) || 0)));
    const presets = getStage3Presets(this.carState || {});
    const existing = presets[slot];
    const defaultName = existing?.name || ('PRESET ' + (slot + 1));

    this.openTextEntryPopup({
      title: existing ? 'OVERWRITE PRESET // NAME' : 'SAVE PRESET // NAME',
      initialValue: defaultName,
      confirmLabel: 'SAVE // ¥' + STAGE3_PRESET_SAVE_COST.toLocaleString('en-US'),
      onConfirm: name => {
        const cash = Math.max(0, Number(this.registry.get('cash') || 0));
        if (cash < STAGE3_PRESET_SAVE_COST) {
          this.stage3StatusMessage =
            'NEED ¥' + STAGE3_PRESET_SAVE_COST.toLocaleString('en-US') + ' TO SAVE A PRESET';
          this.openStage3PresetManager();
          return;
        }

        const carStates = { ...(this.registry.get('carStates') || {}) };
        const state = { ...(carStates[this.carId] || {}) };
        const nextPresets = getStage3Presets(state);
        nextPresets[slot] = {
          name: normaliseStage3PresetName(name, 'PRESET ' + (slot + 1)),
          calibration: normaliseStage3Calibration(this.stage3PendingTune || state),
          savedAt: Date.now(),
        };
        state.stage3Presets = nextPresets;
        carStates[this.carId] = state;

        this.registry.set('cash', cash - STAGE3_PRESET_SAVE_COST);
        this.registry.set('carStates', carStates);
        this.cashText?.setText(
          '¥ ' + Number(cash - STAGE3_PRESET_SAVE_COST).toLocaleString('en-US')
        );
        saveSessionState(this.registry);

        this.carState = state;
        this.stage3StatusMessage = 'PRESET SAVED // ' + nextPresets[slot].name;
        this.openStage3PresetManager();
      },
    });
  }

  renameStage3Preset(index) {
    const slot = Math.max(0, Math.min(MAX_STAGE3_PRESETS - 1, Math.floor(Number(index) || 0)));
    const presets = getStage3Presets(this.carState || {});
    const preset = presets[slot];
    if (!preset) return;

    this.openTextEntryPopup({
      title: 'RENAME PRESET',
      initialValue: preset.name,
      confirmLabel: 'RENAME',
      onConfirm: name => {
        const carStates = { ...(this.registry.get('carStates') || {}) };
        const state = { ...(carStates[this.carId] || {}) };
        const nextPresets = getStage3Presets(state);
        if (!nextPresets[slot]) return;
        nextPresets[slot] = {
          ...nextPresets[slot],
          name: normaliseStage3PresetName(name, preset.name),
        };
        state.stage3Presets = nextPresets;
        carStates[this.carId] = state;
        this.registry.set('carStates', carStates);
        saveSessionState(this.registry);
        this.carState = state;
        this.openStage3PresetManager();
      },
    });
  }

  saveStage3Tuning() {
    if (this.facilityTier < 3 || !this.carId) return;

    const carStates = { ...(this.registry.get('carStates') || {}) };
    const state = { ...(carStates[this.carId] || {}) };
    const eligibility = getStage3CalibrationEligibility(state);
    const requested = normaliseStage3Calibration(this.stage3PendingTune || {});
    const next = {
      ecuBias: eligibility.ecuBias ? requested.ecuBias : 0,
      boostBias: eligibility.boostBias ? requested.boostBias : 0,
      gearBias: eligibility.gearBias ? requested.gearBias : 0,
    };
    const previous = normaliseStage3Calibration(state);
    const changed =
      previous.ecuBias !== next.ecuBias ||
      previous.boostBias !== next.boostBias ||
      previous.gearBias !== next.gearBias;

    state.stage3Calibration = next;
    if (changed && state.dyno) {
      state.dyno = { ...state.dyno, officialReading: null };
    }

    carStates[this.carId] = state;
    this.registry.set('carStates', carStates);
    saveSessionState(this.registry);

    this.carState = state;
    this.stage3PendingTune = { ...next };
    this.build = buildDynoCar(this.carId, state);
    this.recommendedGear = getRecommendedDynoGear(this.build?.car || {});
    this.currentRPM = Number(this.build?.engine?.idleRPM || 850);
    this.currentBoost = 0;
    try { this.audio?.destroy?.(); } catch (e) {}
    this.audio = null;

    const labels = describeStage3Calibration(next);
    this.stage3StatusMessage = changed
      ? 'APPLIED // ECU ' + labels.ecu +
        ' // BOOST ' + labels.boost +
        ' // GEARS ' + labels.gears +
        ' // OFFICIAL RATING CLEARED'
      : 'ACTIVE TUNE ALREADY MATCHES THESE SETTINGS';

    this.renderStage3Tuning();
  }

  
  openGraphManagement() {
    if (this.controls) this.controls.enabled = false;
    this.setDynoShifterShieldEnabled(false);
    [this.controls?.clutchSprite, this.controls?.nosSprite, this.controls?.shifterSprite, this.controls?.throttleSprite].forEach(obj => obj?.setVisible(false));
    if (this.dynoHud) Object.values(this.dynoHud).forEach(obj => obj?.setVisible?.(false));
    this.dynoHud?.gearBack?.setVisible(false);
    this.dynoHud?.gearText?.setVisible(false);
    this.daichiMessageBoard?.setVisible(false);
    this.daichiText?.setVisible(false);
    this.dynoUiMode = 'graphManagement';
    this.pullState = 'IDLE';
    this.points = [];
    this.shiftEvents = [];
    this.clearShiftLabels();
    this.clearUiObjects('introUiObjects');
    this.clearUiObjects('activeUiObjects');
    this.graphManagementMode = this.graphManagementMode || 'power';
    this.graphManagementIndex = Number.isInteger(this.graphManagementIndex) ? this.graphManagementIndex : 0;
    this.setHeaderContext('GRAPH MANAGEMENT');

    const add = obj => this.addUiObject('introUiObjects', obj);
    const x = 1320;
    const powerRuns = this.getDynoGraphSlots('power');
    const driveRuns = this.getDynoGraphSlots('drivetrain');

    const makeSection = (centerY, mode, title, accent, runs) => {
      const accentText = mode === 'power' ? '#62e8c7' : '#43dfff';
      const panelW = 410;
      const panelH = 102;
      const titleY = centerY - 29;
      const buttonY = centerY + 18;

      // A padded, dark translucent group card keeps the label readable over
      // the authored TV/background and visually ties the three graph slots
      // together without obscuring the rest of Graph Management.
      add(this.add.rectangle(x, centerY, panelW, panelH, 0x02070d, 0.86)
        .setStrokeStyle(2, accent, 0.62)
        .setDepth(30));

      add(this.add.text(x, titleY, title, {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: accentText,
        align: 'center',
      }).setOrigin(0.5).setDepth(32));

      [0, 1, 2].forEach(i => {
        const bx = 1190 + i * 130;
        const hasGraph = !!runs[i];
        const selected =
          this.graphManagementMode === mode &&
          this.graphManagementIndex === i &&
          hasGraph;
        const box = add(this.add.rectangle(
          bx,
          buttonY,
          108,
          44,
          hasGraph ? 0x102138 : 0x0b1017,
          0.98
        )
          .setStrokeStyle(
            2,
            hasGraph ? accent : 0x46515a,
            selected ? 1 : 0.7
          )
          .setInteractive({ useHandCursor: hasGraph })
          .setDepth(31));

        add(this.add.text(
          bx,
          buttonY,
          hasGraph ? (runs[i]?.label || ('GRAPH ' + (i + 1))) : 'EMPTY',
          {
            fontFamily: PIXEL_FONT,
            fontSize: '6px',
            color: hasGraph ? accentText : '#687983',
          }
        ).setOrigin(0.5).setDepth(32));

        if (hasGraph) {
          box.on('pointerdown', () => this.openGraphManagementGraph(mode, i));
        }
      });
    };

    makeSection(145, 'power', 'DYNO RUN', 0x62e8c7, powerRuns);
    makeSection(265, 'drivetrain', 'DRIVETRAIN TEST', 0x43dfff, driveRuns);

    const selectedRuns = this.getDynoGraphSlots(this.graphManagementMode);
    const selectedGraph = selectedRuns[this.graphManagementIndex];
    const selectedEnabled = !!selectedGraph;

    const renameBox = add(this.add.rectangle(x, 355, 380, 44, selectedEnabled ? 0x102138 : 0x0b1017, 0.98)
      .setStrokeStyle(2, selectedEnabled ? 0xd9b65f : 0x46515a, 1)
      .setDepth(31));
    add(this.add.text(x, 355, 'RENAME SELECTED GRAPH', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: selectedEnabled ? '#ffe08a' : '#687983',
    }).setOrigin(0.5).setDepth(32));
    if (selectedEnabled) {
      renameBox.setInteractive({ useHandCursor: true });
      renameBox.on('pointerdown', () => this.renameGraphManagementSelection());
    }

    const deleteBox = add(this.add.rectangle(x, 410, 380, 44, selectedEnabled ? 0x102138 : 0x0b1017, 0.98)
      .setStrokeStyle(2, selectedEnabled ? 0x55b8ff : 0x46515a, 1)
      .setDepth(31));
    add(this.add.text(x, 410, 'DELETE SELECTED GRAPH', {
      fontFamily: PIXEL_FONT, fontSize: '7px', color: selectedEnabled ? '#eef8ff' : '#687983'
    }).setOrigin(0.5).setDepth(32));
    if (selectedEnabled) {
      deleteBox.setInteractive({ useHandCursor: true });
      deleteBox.on('pointerdown', () => this.deleteGraphManagementSelection());
    }

    const back = add(this.add.rectangle(x, 465, 380, 44, 0x102138, 0.98)
      .setStrokeStyle(2, 0x55b8ff, 1).setInteractive({ useHandCursor: true }).setDepth(31));
    add(this.add.text(x, 465, 'RETURN TO DYNO OPTIONS', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#eef8ff'
    }).setOrigin(0.5).setDepth(32));
    back.on('pointerdown', () => this.drawIntroUi());

    this.previousRun = selectedGraph || null;
    this.graphViewIndex = this.graphManagementIndex;
    this.dynoRunMode = this.graphManagementMode;
    this.redrawGraph();
  }
  openGraphManagementGraph(mode, index) {
    const history = this.getDynoGraphSlots(mode);
    if (!history[index]) return;
    this.graphManagementMode = mode;
    this.graphManagementIndex = index;
    this.dynoRunMode = mode;
    this.pullState = 'IDLE';
    this.points = [];
    this.shiftEvents = [];
    this.clearShiftLabels();
    this.previousRun = history[index];
    this.graphViewIndex = index;
    this.pendingReplaceSlot = null;
    this.setHeaderContext('GRAPH MANAGEMENT');
    this.redrawGraph();
    this.openGraphManagement();
  }

  
  renameGraphManagementSelection() {
    const mode = this.graphManagementMode === 'drivetrain' ? 'drivetrain' : 'power';
    const index = this.graphManagementIndex;
    const slots = this.getDynoGraphSlots(mode);
    const selected = slots[index];
    if (!selected) return;

    this.openTextEntryPopup({
      title: 'RENAME ' + (mode === 'drivetrain' ? 'DRIVETRAIN GRAPH' : 'DYNO GRAPH'),
      initialValue: selected.label || ('GRAPH ' + (index + 1)),
      confirmLabel: 'RENAME',
      onConfirm: name => {
        const carStates = { ...(this.registry.get('carStates') || {}) };
        const state = { ...(carStates[this.carId] || {}) };
        const nextDyno = { ...(state.dyno || {}) };
        const nextGraphs = { ...(nextDyno.graphs || {}) };
        const nextSlots = Array.isArray(nextGraphs[mode])
          ? nextGraphs[mode].slice(0, 3)
          : this.getDynoGraphSlots(mode);

        if (!nextSlots[index]) return;
        const renamed = {
          ...nextSlots[index],
          label: normaliseStage3PresetName(name, 'GRAPH ' + (index + 1)),
        };
        nextSlots[index] = renamed;
        nextGraphs[mode] = nextSlots;
        nextDyno.graphs = nextGraphs;
        nextDyno.history = [
          ...(nextGraphs.power || []).filter(Boolean),
          ...(nextGraphs.drivetrain || []).filter(Boolean),
        ];
        if (
          nextDyno.lastRun &&
          Number(nextDyno.lastRun.completedAt || 0) === Number(renamed.completedAt || 0)
        ) {
          nextDyno.lastRun = renamed;
        }

        state.dyno = nextDyno;
        carStates[this.carId] = state;
        this.registry.set('carStates', carStates);
        saveSessionState(this.registry);

        this.carState = state;
        this.previousRun = renamed;
        this.openGraphManagement();
      },
    });
  }

  deleteGraphManagementSelection() {
    const mode = this.graphManagementMode === 'drivetrain' ? 'drivetrain' : 'power';
    const index = this.graphManagementIndex;
    const slots = this.getDynoGraphSlots(mode);
    if (!slots[index]) return;
    slots[index] = null;
    const dyno = { ...(this.carState.dyno || {}) };
    dyno.graphs = { ...(dyno.graphs || {}), [mode]: slots };
    dyno.history = [
      ...(dyno.graphs.power || []).filter(Boolean),
      ...(dyno.graphs.drivetrain || []).filter(Boolean),
    ];
    dyno.lastRun = dyno.history[dyno.history.length - 1] || null;
    const carStates = { ...(this.registry.get('carStates') || {}) };
    const state = { ...(carStates[this.carId] || {}) };
    state.dyno = dyno;
    carStates[this.carId] = state;
    this.registry.set('carStates', carStates);
    saveSessionState(this.registry);
    this.carState = state;
    const remaining = slots.filter(Boolean);
    this.graphManagementIndex = Math.min(index, Math.max(0, remaining.length - 1));
    this.previousRun = remaining[this.graphManagementIndex] || null;
    this.openGraphManagement();
  }
  drawActiveUi() {
    this.clearUiObjects('introUiObjects');
    this.clearUiObjects('activeUiObjects');
    this.dynoUiMode = 'active';

    this.ensureDynoHud();
    if (this.dynoHud) Object.values(this.dynoHud).forEach(obj => obj?.setVisible?.(true));

    if (this.controls) {
      this.controls.enabled = true;
      [this.controls.clutchSprite, this.controls.shifterSprite, this.controls.throttleSprite].forEach(obj => obj?.setVisible(true));
      this.controls.nosSprite?.setVisible(false);
    }

    const add = obj => this.addUiObject('activeUiObjects', obj);
    const x = 1320;
    const makeButton = (y, label, onClick, style = 'primary') => {
      const primary = style === 'primary';
      const box = add(this.add.rectangle(x, y, 380, 52, primary ? 0x0c2827 : 0x102138, 0.98)
        .setStrokeStyle(2, primary ? 0x62e8c7 : 0x55b8ff, 1)
        .setInteractive({ useHandCursor: true }).setDepth(31));
      const text = add(this.add.text(x, y, label, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#f1fffb', align: 'center'
      }).setOrigin(0.5).setDepth(32));
      box.on('pointerdown', onClick);
      return { box, text };
    };

    this.runButton = makeButton(
      154,
      this.isRentalSession ? 'DYNO RUN // SESSION PAID' : 'DYNO RUN // ¥5,000',
      () => this.handlePrimaryRunAction()
    );

    const modeSlots = this.getDynoGraphSlots(this.dynoRunMode);
    const accent = this.dynoRunMode === 'drivetrain' ? 0x43dfff : 0x62e8c7;
    this.graphSlotButtons = [];
    [0,1,2].forEach(index => {
      const bx = 1172 + index * 105;
      const hasGraph = !!modeSlots[index];
      const box = add(this.add.rectangle(bx, 255, 88, 48, hasGraph ? 0x102138 : 0x0b1017, 0.98)
        .setStrokeStyle(2, hasGraph ? accent : 0x46515a, 0.8)
        .setInteractive({ useHandCursor: hasGraph }).setDepth(31));
      const label = add(this.add.text(bx, 255, hasGraph ? ('GRAPH ' + (index + 1)) : 'EMPTY', {
        fontFamily: PIXEL_FONT, fontSize: '6px', color: hasGraph ? '#eef8ff' : '#687983'
      }).setOrigin(0.5).setDepth(32));
      if (hasGraph) box.on('pointerdown', () => this.selectGraphSlot(index));
      this.graphSlotButtons.push({ box, label });
    });

    this.dynoMenuButton = makeButton(340, 'RETURN TO DYNO OPTIONS', () => this.returnToDynoMenu(), 'secondary');
    this.resultsButton = null;
    this.refreshRunButton();
    this.refreshGraphManagement();
  }
  setDynoShifterShieldEnabled(enabled = true) {
    if (!this.dynoShifterInputShield) return;
    if (enabled) this.dynoShifterInputShield.setInteractive();
    else this.dynoShifterInputShield.disableInteractive();
  }

  ensureControls() {
    if (this.controls) {
      this.controls.enabled = true;
      this.setDynoShifterShieldEnabled(true);
      return;
    }
    this.controls = new TouchControls(this, {
      nosEnabled: false,
      pedalLatchMax: false,
    });
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
    this.setDynoShifterShieldEnabled(true);
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

    getDynoHistoryRuns(mode = this.dynoRunMode) {
    return this.getDynoGraphSlots(mode).filter(Boolean);
  }
  openGraphView(mode) {
    const history = this.getDynoGraphSlots(mode);
    if (!history.length) return;
    this.graphManagementMode = mode;
    this.graphManagementIndex = 0;
    this.openGraphManagementGraph(mode, 0);
  }

    selectGraphSlot(index) {
    const history = this.getDynoGraphSlots(this.dynoRunMode);
    if (!history[index]) return;
    this.graphViewIndex = index;
    this.previousRun = history[index];
    this.showRunSummary(this.previousRun);
    this.redrawGraph();
    this.refreshGraphManagement();
  }
    deleteSelectedGraph() {
    return this.deleteGraphManagementSelection();
  }
    prepareGraphReplacement() { return false; }
  
  getModeSessionRemaining(mode = this.dynoRunMode) {
    return Number(this.sessionPullsRemainingByMode?.[mode] || 0);
  }

  openGraphReplacementPopup() {
    this.closeGraphReplacementPopup();
    this.replacementCandidateSlot = null;
    this.redrawGraph();

    const objects = [];
    const add = obj => { objects.push(obj); return obj; };
    this.replacementPopupObjects = objects;
    const depth = 140;

    add(this.add.rectangle(1320, 525, 390, 300, 0x02070d, 0.96)
      .setStrokeStyle(2, 0x55b8ff, 1).setDepth(depth).setInteractive());

    add(this.add.text(1320, 405, 'REPLACE SAVED GRAPH', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#eef8ff'
    }).setOrigin(0.5).setDepth(depth + 1));
    add(this.add.text(1320, 435, 'SELECT A GRAPH TO REPLACE', {
      fontFamily: BODY_FONT, fontSize: '10px', color: '#a7bdca', fontStyle: '700'
    }).setOrigin(0.5).setDepth(depth + 1));

    const slots = this.getDynoGraphSlots(this.dynoRunMode);
    this.replacementPopupButtons = [];
    [0,1,2].forEach(index => {
      const y = 485 + index * 52;
      const box = add(this.add.rectangle(1320, y, 260, 40, 0x102138, 0.98)
        .setStrokeStyle(2, this.dynoRunMode === 'drivetrain' ? 0x43dfff : 0x62e8c7, 0.9)
        .setInteractive({ useHandCursor: true }).setDepth(depth + 1));
      const label = add(this.add.text(
        1320,
        y,
        slots[index]?.label || ('GRAPH ' + (index + 1)),
        {
          fontFamily: PIXEL_FONT, fontSize: '6px', color: '#eef8ff'
        }
      ).setOrigin(0.5).setDepth(depth + 2));
      this.replacementPopupButtons.push({ box, label });
      box.on('pointerdown', () => {
        this.replacementPopupButtons?.forEach(item => {
          item.box.setFillStyle(0x102138, 0.98);
          item.box.setStrokeStyle(2, this.dynoRunMode === 'drivetrain' ? 0x43dfff : 0x62e8c7, 0.9);
          item.label.setColor('#eef8ff');
        });
        this.replacementCandidateSlot = index;
        this.pendingReplaceSlot = index;
        box.setFillStyle(0x6b5b37, 1);
        box.setStrokeStyle(2, 0xffd45a, 1);
        label.setColor('#ffe58a');
        this.redrawGraph();
      });
    });

    const ok = add(this.add.rectangle(1260, 680, 110, 42, 0x0c2827, 0.98)
      .setStrokeStyle(2, 0x62e8c7, 1).setInteractive({ useHandCursor: true }).setDepth(depth + 1));
    const cancel = add(this.add.rectangle(1380, 680, 110, 42, 0x102138, 0.98)
      .setStrokeStyle(2, 0x55b8ff, 1).setInteractive({ useHandCursor: true }).setDepth(depth + 1));
    add(this.add.text(1260, 680, 'OK', { fontFamily: PIXEL_FONT, fontSize: '7px', color: '#f1fffb' }).setOrigin(0.5).setDepth(depth + 2));
    add(this.add.text(1380, 680, 'CANCEL', { fontFamily: PIXEL_FONT, fontSize: '7px', color: '#eef8ff' }).setOrigin(0.5).setDepth(depth + 2));

    ok.on('pointerdown', () => {
      if (!Number.isInteger(this.replacementCandidateSlot)) return;
      this.pendingReplaceSlot = this.replacementCandidateSlot;
      this.closeGraphReplacementPopup();
      this.prepareNextPull();
    });
    cancel.on('pointerdown', () => {
      this.pendingReplaceSlot = null;
      this.replacementCandidateSlot = null;
      this.closeGraphReplacementPopup();
      this.cancelGraphReplacement();
    });
  }

  closeGraphReplacementPopup() {
    (this.replacementPopupObjects || []).forEach(obj => {
      try { obj?.destroy?.(); } catch (e) {}
    });
    this.replacementPopupObjects = [];
    this.replacementPopupButtons = [];
  }

  cancelGraphReplacement() {
    this.pullState = 'IDLE';
    this.points = [];
    this.shiftEvents = [];
    this.clearShiftLabels();
    if (this.controls) this.controls.enabled = false;
    this.currentGear = 0;
    this.currentRPM = Number(this.build?.engine?.idleRPM || 850);
    this.currentBoost = 0;
    this.vehicleSpeedMps = 0;
    this.vehicleDistanceM = 0;
    this.awaitingNextPull = false;
    this.redrawGraph();
    this.refreshRunButton();
    this.daichiText?.setText('DAICHI // Replacement cancelled. The paid test session remains available.');
  }

  prepareNextPull() {
    this.pullState = 'IDLE';
    this.awaitingNextPull = true;
    this.points = [];
    this.shiftEvents = [];
    this.clearShiftLabels();
    if (this.controls) this.controls.enabled = false;
    this.currentGear = 0;
    this.currentRPM = Number(this.build?.engine?.idleRPM || 850);
    this.currentBoost = 0;
    this.vehicleSpeedMps = 0;
    this.vehicleDistanceM = 0;
    this.dynoRunTime = 0;
    this.runProgress = 0;
    this.lastRecordedTime = 0;
    this.lastRecordedRPM = 0;
    this.daichiText?.setText('DAICHI // Graph selected. Press NEXT PULL when you are ready to set up the test.');
    this.redrawGraph();
    this.refreshRunButton();
  }


  enterDynoTest(mode) {
    if (this.pullState === 'RUNNING' || this.pullState === 'SETUP') return;
    if (this.isRentalSession && mode !== 'power') return;
    if (this.isRentalSession && this.getModeSessionRemaining('power') <= 0) {
      this.daichiText?.setText('DAICHI // Rental session complete. Return to the workshop to book another pull.');
      return;
    }
    if (mode === 'drivetrain' && this.facilityTier < 2) {
      this.daichiText?.setText('DAICHI // Install the Stage II Load Dyno before running a drivetrain test.');
      return;
    }
    this.dynoRunMode = mode === 'drivetrain' ? 'drivetrain' : 'power';
    this.pullState = 'IDLE';
    this.sessionPullsRemaining = Number(this.sessionPullsRemainingByMode?.[this.dynoRunMode] || 0);
    this.graphViewIndex = 0;
    this.pendingReplaceSlot = null;
    this.replacementCandidateSlot = null;
    this.awaitingNextPull = false;
    this.closeGraphReplacementPopup();
    this.setHeaderContext(this.dynoRunMode === 'drivetrain' ? 'DRIVETRAIN TEST' : 'POWER RUN');
    this.drawActiveUi();
    this.redrawGraph();
    this.daichiText?.setText(
      this.isRentalSession
        ? 'DAICHI // Rental session is paid. One power run — make it count.'
        : (
            this.dynoRunMode === 'drivetrain'
              ? 'DAICHI // Ready. Press DYNO RUN // ¥15,000 to begin the drivetrain test.'
              : 'DAICHI // Ready. Press DYNO RUN // ¥5,000 to begin the power run.'
          )
    );
  }
  
  handlePrimaryRunAction() {
    if (this.awaitingNextPull) {
      this.awaitingNextPull = false;
      this.pullState = 'SETUP';
      this.points = [];
      this.shiftEvents = [];
      this.currentGear = 0;
      this.currentRPM = Number(this.build?.engine?.idleRPM || 850);
      this.currentBoost = 0;
      this.vehicleSpeedMps = 0;
      this.vehicleDistanceM = 0;
      this.ensureControls();
      this.controls.enabled = true;
      this.daichiText?.setText(this.dynoRunMode === 'drivetrain'
        ? 'DAICHI // DRIVETRAIN TEST. Select your launch gear, set RPM, then release the clutch.'
        : 'DAICHI // POWER RUN. Select any starting gear, then release the clutch and hold full throttle.');
      this.refreshRunButton();
      return;
    }
    if (this.pullState === 'ABORTED') {
      this.beginPull(this.dynoRunMode);
      return;
    }
    const mode = this.dynoRunMode;
    const slots = this.getDynoGraphSlots(mode);
    if (slots.every(Boolean)) {
      this.beginPull(mode);
      if (this.pullState === 'SETUP') this.openGraphReplacementPopup();
      return;
    }
    this.beginPull(mode);
  }
  
  beginPull(requestedMode = null) {
    if (this.pullState === 'RUNNING' || this.pullState === 'SETUP') return;
    const mode = requestedMode === 'drivetrain' ? 'drivetrain' : (requestedMode === 'power' ? 'power' : this.dynoRunMode);
    if (mode === 'drivetrain' && this.facilityTier < 2) {
      this.daichiText?.setText('DAICHI // Stage II is required for drivetrain testing.');
      return;
    }
    this.dynoRunMode = mode;

    const serviceCost = mode === 'drivetrain' ? 15000 : 5000;
    const servicePulls = mode === 'drivetrain' ? 3 : 1;
    let remaining = this.getModeSessionRemaining(mode);

    if (this.isRentalSession && (mode !== 'power' || remaining <= 0)) {
      this.daichiText?.setText('DAICHI // Rental session complete. Book another Stage I session from the workshop.');
      return;
    }

    if (remaining <= 0) {
      const cash = Math.max(0, Number(this.registry.get('cash') || 0));
      if (cash < serviceCost) {
        this.daichiText?.setText('DAICHI // You need ¥' + serviceCost.toLocaleString('en-US') + ' for this Stage I test.');
        return;
      }
      this.registry.set('cash', cash - serviceCost);
      this.cashText?.setText('¥ ' + Number(cash - serviceCost).toLocaleString('en-US'));
      remaining = servicePulls;
      this.sessionPullsRemainingByMode[mode] = remaining;
      saveSessionState(this.registry);
    }

    this.sessionPullsRemaining = remaining;
    this.awaitingNextPull = false;
    this.ensureDynoHud();
    if (this.dynoHud) Object.values(this.dynoHud).forEach(obj => obj?.setVisible?.(true));
    this.ensureControls();
    this.ensureAudio();
    this.points = [];
    this.shiftEvents = [];
    this.clearShiftLabels();
    this.runProgress = 0;
    this.lowThrottleTime = 0;
    this.lastRecordedRPM = 0;
    this.lastRecordedTime = 0;
    this.vehicleSpeedMps = 0;
    this.vehicleDistanceM = 0;
    this.dynoRunTime = 0;
    this.shiftCooldown = 0;
    this.currentGear = 0;
    this.currentRPM = Number(this.build.engine.idleRPM || 850);
    this.currentBoost = 0;
    this.turbo = null;
    this.finalDynoPoint = null;
    this.graphViewIndex = 0;
    this.pullState = 'SETUP';
    this.setHeaderContext(mode === 'drivetrain' ? 'DRIVETRAIN TEST' : 'POWER RUN');
    if (this.dynoUiMode !== 'active') this.drawActiveUi();
    this.redrawGraph();
    this.daichiText?.setText(
      mode === 'drivetrain'
        ? 'DAICHI // DRIVETRAIN TEST. Start in N. Clutch in, select your launch gear, set RPM, then release.'
        : 'DAICHI // POWER RUN. Clutch in. Select any starting gear, then release the clutch.'
    );
    this.refreshRunButton();
  }
  ordinal(value) {
    const n = Number(value) || 1;
    if (n === 1) return '1ST';
    if (n === 2) return '2ND';
    if (n === 3) return '3RD';
    return n + 'TH';
  }

  returnToDynoMenu() {
    if (this.controls) this.controls.enabled = false;
    this.audio?.fadeOut?.();

    this.pullState = 'IDLE';
    this.points = [];
    this.shiftEvents = [];
    this.clearShiftLabels();
    this.runProgress = 0;
    this.lowThrottleTime = 0;
    this.lastRecordedRPM = 0;
    this.lastRecordedTime = 0;
    this.vehicleSpeedMps = 0;
    this.vehicleDistanceM = 0;
    this.dynoRunTime = 0;
    this.shiftCooldown = 0;
    this.currentGear = 0;
    this.currentRPM = Number(this.build?.engine?.idleRPM || 850);
    this.currentBoost = 0;
    this.finalDynoPoint = null;
    this.graphViewIndex = 0;
    this.pendingReplaceSlot = null;
    this.replacementCandidateSlot = null;
    this.closeGraphReplacementPopup();

    this.telemetryText?.setText('');
    this.daichiText?.setText('DAICHI // Choose the Stage I test you want to run.');
    this.drawIntroUi();
    this.refreshPullCounter();
    this.redrawGraph();
    this.refreshGraphButton();
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

    const mode = this.dynoRunMode === 'drivetrain' ? 'drivetrain' : 'power';
    const carStates = { ...(this.registry.get('carStates') || {}) };
    const state = { ...(carStates[this.carId] || {}) };
    const dyno = { ...(state.dyno || {}) };
    const slots = Array.isArray(dyno.graphs?.[mode]) ? dyno.graphs[mode].slice(0,3) : this.getDynoGraphSlots(mode);
    const targetIndex = Number.isInteger(this.pendingReplaceSlot) ? this.pendingReplaceSlot : Math.max(0, slots.findIndex(slot => !slot));

    const runCalibration = normaliseStage3Calibration(state);
    const matchingPreset = findMatchingStage3Preset(state, runCalibration);
    const run = {
      completedAt: Date.now(),
      mode,
      label: matchingPreset?.preset?.name || '',
      presetName: matchingPreset?.preset?.name || '',
      stage3Calibration: runCalibration,
      gear: mode === 'power' ? this.currentGear : (this.points?.[0]?.gear || this.currentGear),
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
        powerKW: Math.round(Number(event.powerKW || 0) * 10) / 10,
        torqueNm: Math.round(Number(event.torqueNm || 0) * 10) / 10,
        fromGear: event.fromGear,
        toGear: event.toGear,
      })),
    };
    run.analysis = analyseDynoRun(run, this.build);
    const runMetrics = this.getRunMetrics(run);
    run.maxBoostBar = Math.round(runMetrics.maxBoostBar * 100) / 100;
    run.maxTorqueNm = Math.round(runMetrics.maxTorqueNm * 10) / 10;
    run.maxPowerKW = Math.round(runMetrics.maxPowerKW * 10) / 10;
    run.startingGear = runMetrics.startingGear;
    run.wheelPowerKW = Math.round(Number(run.analysis.peakPowerKW || 0) * clamp(Number(this.build.car.drivetrainEfficiency || 0.86), 0.60, 0.99));

    if (mode === 'drivetrain') {
      run.drivetrain = {
        topGearReached: this.currentGear >= Number(this.build.car.gearRatios?.length || 1),
        maxSpeedKmh: Math.round(this.vehicleSpeedMps * 3.6),
        shiftCount: this.shiftEvents.length,
      };
    }

    if (slots.every(Boolean) && !Number.isInteger(this.pendingReplaceSlot)) {
      this.pullState = 'COMPLETE';
      this.daichiText?.setText('DAICHI // Run complete. Choose a saved graph to replace before saving.');
      this.refreshRunButton();
      this.redrawGraph();
      return;
    }

    slots[targetIndex] = run;
    dyno.graphs = { ...(dyno.graphs || {}), [mode]: slots };
    dyno.history = [
      ...(dyno.graphs.power || []).filter(Boolean),
      ...(dyno.graphs.drivetrain || []).filter(Boolean),
    ];

    // A completed power pull becomes the official measured rating for this
    // exact physical build. Any later performance modification changes the
    // build signature and automatically returns displays to estimated ranges.
    if (mode === 'power') {
      dyno.officialReading = createOfficialDynoReading(state, run);
    }
    dyno.lastRun = run;

    this.sessionPullsRemainingByMode[mode] = Math.max(0, this.getModeSessionRemaining(mode) - 1);
    this.sessionPullsRemaining = this.sessionPullsRemainingByMode[mode];

    state.dyno = dyno;
    carStates[this.carId] = state;
    this.registry.set('carStates', carStates);
    saveSessionState(this.registry);
    this.carState = state;
    this.previousRun = run;
    this.finalDynoPoint = run.points?.[run.points.length - 1] || {
      rpm: this.currentRPM, speedKmh: this.vehicleSpeedMps * 3.6,
      powerKW: run.analysis.peakPowerKW, torqueNm: run.analysis.peakTorqueNm, boostBar: this.currentBoost
    };
    this.pendingReplaceSlot = null;
    this.replacementCandidateSlot = null;

    if (mode === 'drivetrain') {
      const shifts = this.shiftEvents.length;
      this.daichiText?.setText('DAICHI // DRIVETRAIN RUN COMPLETE. ' + shifts + ' shift' + (shifts === 1 ? '' : 's') + '. ' + Math.round(this.vehicleSpeedMps * 3.6) + ' km/h reached.');
    } else {
      this.daichiText?.setText('DAICHI // ' + run.analysis.comment);
    }

    this.graphViewIndex = targetIndex;
    this.refreshPullCounter();
    this.refreshRunButton();
    this.redrawGraph();
    this.showRunSummary(run);
    this.refreshGraphManagement();
  }
  showRunSummary(run) {
    if (!run || !this.telemetryText) return;
    const m = this.getRunMetrics(run);
    const gearLabel = m.startingGear > 0 ? String(m.startingGear) : 'N';
    this.telemetryText.setText(
      'MAX BOOST  ' + m.maxBoostBar.toFixed(2) + ' bar' +
      '   //   MAX TORQUE  ' + Math.round(m.maxTorqueNm) + ' Nm' +
      '   //   MAX POWER  ' + Math.round(m.maxPowerKW) + ' kW' +
      '\nSTART GEAR  ' + gearLabel
    );
  }

  showLastRun() {
    if (!this.previousRun?.analysis) return;
    this.showRunSummary(this.previousRun);
    this.daichiText.setText('DAICHI // ' + this.previousRun.analysis.comment);
    this.redrawGraph();
  }

  refreshPullCounter() {
    if (!this.pullCounterText) return;
    const label = this.isRentalSession
      ? 'RENTED STAGE I SESSION'
      : (this.dynoUiMode === 'intro'
      ? 'DYNO OPTIONS'
      : (this.dynoRunMode === 'drivetrain' ? 'DRIVETRAIN TEST' : 'POWER RUN'));
    this.pullCounterText.setText(label);
  }

  
  refreshRunButton() {
    if (!this.runButton) return;
    const mode = this.dynoRunMode === 'drivetrain' ? 'drivetrain' : 'power';
    const cost = mode === 'drivetrain' ? '15,000' : '5,000';
    const remaining = this.getModeSessionRemaining(mode);
    let label = 'DYNO RUN // ¥' + cost;
    let enabled = true;
    if (this.awaitingNextPull) {
      label = this.isRentalSession ? 'NEXT PULL // PAID' : 'NEXT PULL';
    } else if (this.pullState === 'SETUP') {
      label = mode === 'drivetrain' ? 'SETUP // SELECT LAUNCH GEAR' : 'SETUP // SELECT STARTING GEAR';
      enabled = false;
    } else if (this.pullState === 'RUNNING') {
      label = mode === 'drivetrain' ? 'DRIVETRAIN TEST // LIVE' : 'DYNO RUN // LIVE';
      enabled = false;
    } else if (this.pullState === 'ABORTED') {
      label = this.isRentalSession
        ? 'RETRY RENTAL RUN // PAID'
        : (mode === 'drivetrain' ? 'RETRY DRIVETRAIN TEST RUN' : 'RETRY DYNO RUN // ¥' + cost);
    } else if (this.isRentalSession && remaining > 0) {
      label = 'DYNO RUN // SESSION PAID';
    } else if (this.isRentalSession && remaining <= 0) {
      label = 'RENTAL SESSION COMPLETE';
      enabled = false;
    } else if (remaining > 0) {
      label = 'CONTINUE // ' + remaining + ' RUN' + (remaining === 1 ? '' : 'S') + ' REMAINING';
    }
    this.runButton.text.setText(label);
    if (enabled) {
      this.runButton.box.setInteractive({ useHandCursor: true }).setFillStyle(0x0c2827, 0.98).setStrokeStyle(2, 0x62e8c7, 1);
      this.runButton.text.setColor('#f1fffb');
    } else {
      this.runButton.box.disableInteractive().setFillStyle(0x10171c, 0.94).setStrokeStyle(1, 0x4a5c63, 0.86);
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

  getRunMetrics(run) {
    const points = Array.isArray(run?.points) ? run.points : [];
    const maxBoostBar = points.reduce((max, p) => Math.max(max, Number(p?.boostBar || 0)), 0);
    const maxTorqueNm = points.reduce((max, p) => Math.max(max, Number(p?.torqueNm || 0)), 0);
    const maxPowerKW = points.reduce((max, p) => Math.max(max, Number(p?.powerKW || 0)), 0);
    return {
      maxBoostBar: Number(run?.maxBoostBar ?? maxBoostBar),
      maxTorqueNm: Number(run?.maxTorqueNm ?? maxTorqueNm),
      maxPowerKW: Number(run?.maxPowerKW ?? maxPowerKW),
      startingGear: Number(run?.startingGear ?? run?.gear ?? points[0]?.gear ?? 0),
    };
  }

  getDynoGraphSlots(mode = this.dynoRunMode) {
    const dyno = this.carState?.dyno || {};
    const graphs = dyno.graphs || {};
    if (Array.isArray(graphs[mode])) return graphs[mode].slice(0, 3);

    const legacy = Array.isArray(dyno.history)
      ? dyno.history.filter(run => run?.mode === mode).slice(-3).reverse()
      : [];
    return [legacy[0] || null, legacy[1] || null, legacy[2] || null];
  }

  getDynoHistoryRuns(mode = null) {
    if (mode) return this.getDynoGraphSlots(mode).filter(Boolean);
    return [
      ...this.getDynoGraphSlots('power').filter(Boolean),
      ...this.getDynoGraphSlots('drivetrain').filter(Boolean)
    ];
  }

    toggleGraphHistory() {
    const history = this.getDynoGraphSlots(this.dynoRunMode).filter(Boolean);
    if (!history.length) return;
    this.graphViewIndex = (this.graphViewIndex + 1) % history.length;
    this.previousRun = history[this.graphViewIndex];
    this.showRunSummary(this.previousRun);
    this.redrawGraph();
    this.refreshGraphManagement();
  }
  refreshGraphManagement() {
    if (!this.graphSlotButtons) return;
    const history = this.getDynoGraphSlots(this.dynoRunMode);
    const accent = this.dynoRunMode === 'drivetrain' ? 0x43dfff : 0x62e8c7;
    this.graphSlotButtons.forEach((slot, index) => {
      const exists = Boolean(history[index]);
      const selected = index === this.graphViewIndex && exists;
      slot.box.setFillStyle(selected ? 0x0c2827 : (exists ? 0x102138 : 0x0b1017), 0.98);
      slot.box.setStrokeStyle(2, exists ? accent : 0x46515a, selected ? 1 : 0.7);
      slot.label.setText(exists ? (history[index]?.label || ('GRAPH ' + (index + 1))) : 'EMPTY');
      slot.label.setColor(exists ? (selected ? '#f1fffb' : '#eef8ff') : '#687983');
      if (exists) slot.box.setInteractive({ useHandCursor: true });
      else slot.box.disableInteractive();
    });
  }
  redrawGraph() {
    if (!this.graphGraphics || !this.graphRect || !this.build) return;
    const g = this.graphGraphics;
    const rect = this.graphRect;
    g.clear();
    this.clearShiftLabels();

    const historyRuns = this.getDynoGraphSlots(this.dynoRunMode).filter(Boolean);
    const graphRun = (
      this.points?.length
        ? { mode: this.dynoRunMode, points: this.points, shiftEvents: this.shiftEvents }
        : (historyRuns[this.graphViewIndex] || this.previousRun)
    );
    const drivetrain = graphRun?.mode === 'drivetrain';

    // Drivetrain reserves a compact readout column on the right of the TV.
    // Power runs continue to use the full plotting area.
    const shiftColumnW = drivetrain ? 118 : 0;
    const plotRect = {
      x: rect.x,
      y: rect.y,
      w: Math.max(220, rect.w - shiftColumnW),
      h: rect.h,
    };

    this.graphXAxisLabel
      ?.setText(drivetrain ? 'KM/H' : 'RPM')
      ?.setPosition(plotRect.x + plotRect.w - 6, plotRect.y + plotRect.h - 5);

    this.powerAxisLabel
      ?.setPosition(plotRect.x + plotRect.w, MONITOR.y + 44);

    g.lineStyle(1, 0x1f3a49, 0.52);
    for (let i = 0; i <= 5; i += 1) {
      const x = plotRect.x + plotRect.w * i / 5;
      g.lineBetween(x, plotRect.y, x, plotRect.y + plotRect.h);
    }
    for (let i = 0; i <= 4; i += 1) {
      const y = plotRect.y + plotRect.h * i / 4;
      g.lineBetween(plotRect.x, y, plotRect.x + plotRect.w, y);
    }

    if (drivetrain) {
      const dividerX = plotRect.x + plotRect.w + 8;
      g.lineStyle(1, 0x6b5b37, 0.46);
      g.lineBetween(dividerX, rect.y, dividerX, rect.y + rect.h);
    }

    const redline = Math.max(
      2000,
      Number(this.build.engine.redlineRPM || this.build.car.engineRedlineRPM || 8000)
    );
    const rpmMin = Math.max(500, Number(this.build.engine.idleRPM || 850));
    const maxTorque = Math.max(100, Number(this.build.car.torqueNm || 0) * 1.22);
    const maxPower = Math.max(80, Number(this.build.car.powerKW || 0) * 1.22);

    const xAt = value => {
      if (!drivetrain) {
        return plotRect.x +
          clamp((Number(value) - rpmMin) / Math.max(1, redline - rpmMin), 0, 1) *
          plotRect.w;
      }
      const maxSpeed = Math.max(
        80,
        ...((graphRun?.points || []).map(p => Number(p.speedKmh || 0))),
        Number(this.build.car.topSpeedKmh || 0)
      );
      return plotRect.x + clamp(Number(value) / Math.max(1, maxSpeed), 0, 1) * plotRect.w;
    };

    const torqueY = value =>
      plotRect.y + plotRect.h - clamp(Number(value) / maxTorque, 0, 1.08) * plotRect.h;
    const powerY = value =>
      plotRect.y + plotRect.h - clamp(Number(value) / maxPower, 0, 1.08) * plotRect.h;

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

    const replacementOverlay = Number.isInteger(this.replacementCandidateSlot)
      ? this.getDynoGraphSlots(this.dynoRunMode)[this.replacementCandidateSlot]
      : null;
    if (replacementOverlay?.points?.length && replacementOverlay.mode === (drivetrain ? 'drivetrain' : 'power')) {
      drawSeries(replacementOverlay.points, 'torqueNm', torqueY, 0x59dcff, 0.22, 2);
      drawSeries(replacementOverlay.points, 'powerKW', powerY, 0x7df6a8, 0.22, 2);
    }

    const previous = this.previousRun?.points?.length ? this.previousRun : null;
    if (previous && previous.mode === (drivetrain ? 'drivetrain' : 'power')) {
      drawSeries(
        previous.points,
        'torqueNm',
        torqueY,
        0x59dcff,
        this.points.length ? 0.25 : 0.48,
        2
      );
      drawSeries(
        previous.points,
        'powerKW',
        powerY,
        0x7df6a8,
        this.points.length ? 0.25 : 0.48,
        2
      );
    }

    drawSeries(this.points, 'torqueNm', torqueY, 0x59dcff, 1, 3);
    drawSeries(this.points, 'powerKW', powerY, 0x7df6a8, 1, 3);

    if (graphRun?.points?.length && this.dynoUiMode === 'graphManagement') {
      this.showRunSummary(graphRun);
    }

    if (drivetrain) {
      const events = this.shiftEvents?.length
        ? this.shiftEvents
        : (graphRun?.shiftEvents || []);

      const columnX = plotRect.x + plotRect.w + 17;
      const header = this.add.text(columnX, MONITOR.y + 16, 'SHIFTS', {
        fontFamily: PIXEL_FONT,
        fontSize: '5px',
        color: '#ffe08a',
      }).setDepth(23);
      this.shiftLabelObjects.push(header);

      events.slice(0, 6).forEach((event, index) => {
        const x = xAt(Number(event.speedKmh || 0));
        const yTorque = torqueY(Number(event.torqueNm || event.wheelTorqueNm || 0));
        const yPower = powerY(Number(event.powerKW || 0));

        // Keep subtle plot markers, but put the readable shift record in the
        // side column: gear change on one line, RPM drop directly beneath it.
        g.fillStyle(0xffe08a, 0.94);
        if (Number(event.torqueNm || event.wheelTorqueNm || 0) > 0) g.fillCircle(x, yTorque, 2);
        if (Number(event.powerKW || 0) > 0) g.fillCircle(x, yPower, 2);
        g.lineStyle(1, 0xffe08a, 0.32);
        g.lineBetween(x, plotRect.y + 4, x, plotRect.y + plotRect.h - 4);

        const baseY = MONITOR.y + 31 + index * 26;
        const gearLabel = this.add.text(
          columnX,
          baseY,
          event.fromGear + '-' + event.toGear,
          {
            fontFamily: PIXEL_FONT,
            fontSize: '5px',
            color: '#ffe08a',
          }
        ).setDepth(23);
        const rpmLabel = this.add.text(
          columnX,
          baseY + 11,
          Math.round(Number(event.rpmBefore || 0)).toLocaleString('en-US') +
          '-' +
          Math.round(Number(event.rpmAfter || 0)).toLocaleString('en-US'),
          {
            fontFamily: PIXEL_FONT,
            fontSize: '4px',
            color: '#ffe08a',
          }
        ).setDepth(23);
        this.shiftLabelObjects.push(gearLabel, rpmLabel);
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

  getDynoBoostFraction(rpm = this.currentRPM) {
    const onset = Number(this.build?.car?.boostOnsetRPM || 1800);
    const ramp = Math.max(1200, Number(this.build?.car?.boostRampRPM || 4300));
    return Phaser.Math.Clamp((Number(rpm || 0) - onset) / ramp, 0, 1);
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
          const setupTurboRpm = this.getDynoBoostFraction(this.currentRPM);
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
        const setupTurboRpm = this.getDynoBoostFraction(this.currentRPM);
        this.currentBoost = setupTurboMax * Math.pow(setupTurboRpm, 1.18) * Math.pow(clamp(input.throttle, 0, 1), 0.88);

        const setupTelemetry = this.getRollerTelemetry(input.throttle, input.clutch, this.currentBoost);
        this.updateTelemetry({ boostBar: this.currentBoost, powerKW: 0, torqueNm: 0 }, input.throttle);
        this.updateDynoHud(setupTelemetry, 'POWER RUN // SETUP');
        this.audio?.update(setupTelemetry, null, this.build.car, null, dt);
        this.redrawRollers(time * 0.015 + setupTelemetry.wheelRPM * 0.03);

        if (this.currentGear > 0 && Number(input.clutch || 0) < 0.20) {
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

        const turboRpm = this.getDynoBoostFraction(this.currentRPM);
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

      const turboRpm = this.getDynoBoostFraction(this.currentRPM);
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
    const returnWorkshopId = this.isRentalSession
      ? (this.rentalReturnWorkshopId || this.registry.get('workshopLocationId') || 'shinonomeWorkshop')
      : DYNO_WAREHOUSE_ID;
    this.registry.set('workshopLocationId', returnWorkshopId);
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
    this.scene.start('GarageScene', { workshopLocationId: returnWorkshopId });
  }
}
