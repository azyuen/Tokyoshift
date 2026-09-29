import TouchControls from '../input/TouchControls.js?v=20260926-r209';
import EngineAudioSystem from '../audio/EngineAudioSystem.js?v=20260921-r55';
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
} from '../data/dyno.js?v=20260930-r288';
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
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20260922-r128';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';
const WIDTH = 1560;
const HEIGHT = 840;
const MONITOR = { x: 48, y: 108, w: 610, h: 306 };
const CAR_X = 950;
const CAR_TARGET_WIDTH = 720;
const WHEEL_CONTACT_Y = 586;

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

    queueImage('dynoWarehouseDayBg', 'assets/Garage/shinonome_dyno_day.png?v=20260930-r288');
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
    this.audio = null;
    this.turbo = null;
    this.currentGear = 0;
    this.currentRPM = 0;
    this.currentBoost = 0;
    this.runProgress = 0;
    this.lowThrottleTime = 0;
    this.lastRecordedRPM = 0;
    this.wheelObjects = [];
    this.carObjects = [];

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
    this.drawActions();
    this.drawProgressionCards();
    this.redrawGraph();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());
    finishSceneLoading('DYNO READY');
  }

  cleanup() {
    try { this.audio?.destroy(); } catch (e) {}
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
    this.add.rectangle(
      MONITOR.x + MONITOR.w / 2,
      MONITOR.y + MONITOR.h / 2,
      MONITOR.w,
      MONITOR.h,
      0x031018,
      0.94
    ).setStrokeStyle(3, 0x55b8ff, 0.94).setDepth(18);

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

    this.add.text(this.graphRect.x, MONITOR.y + MONITOR.h - 34, 'RPM  →', {
      fontFamily: PIXEL_FONT, fontSize: '6px', color: '#7892a2'
    }).setDepth(21);
    this.add.text(MONITOR.x + 18, MONITOR.y + 44, 'TORQUE', {
      fontFamily: PIXEL_FONT, fontSize: '6px', color: '#59dcff'
    }).setDepth(21);
    this.add.text(MONITOR.x + MONITOR.w - 18, MONITOR.y + 44, 'POWER', {
      fontFamily: PIXEL_FONT, fontSize: '6px', color: '#7df6a8'
    }).setOrigin(1, 0).setDepth(21);

    this.telemetryText = this.add.text(
      MONITOR.x + 18,
      MONITOR.y + MONITOR.h - 12,
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

    this.add.text(CAR_X, 625, cars[this.carId].name.toUpperCase(), {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#e8f6ff'
    }).setOrigin(0.5).setDepth(22);
    this.add.text(
      CAR_X,
      654,
      Math.round(this.build.car.powerKW) + ' kW  //  ' +
        Math.round(this.build.car.torqueNm) + ' Nm  //  ' +
        Math.round(this.build.car.vehicleMassKg) + ' kg',
      {
        fontFamily: BODY_FONT, fontSize: '10px', color: '#a7bdca', fontStyle: '700'
      }
    ).setOrigin(0.5).setDepth(22);
  }

  drawDaichiPanel() {
    const daichi = characters.daichiSakamoto;
    if (daichi?.visual && this.textures.exists(daichi.visual.spriteKey)) {
      const sprite = this.add.image(700, 560, daichi.visual.spriteKey)
        .setOrigin(0.5, 1)
        .setDepth(15);
      const source = this.textures.get(daichi.visual.spriteKey).getSourceImage();
      sprite.setScale(190 / Math.max(1, source.height));
    }

    this.add.rectangle(355, 478, 610, 94, 0x07111d, 0.92)
      .setStrokeStyle(1, 0x315470, 0.92)
      .setDepth(23);
    this.daichiText = this.add.text(72, 450, 'DAICHI // Ready when you are. We need a clean baseline first.', {
      fontFamily: BODY_FONT,
      fontSize: '11px',
      color: '#d8e8f0',
      fontStyle: '700',
      wordWrap: { width: 560 },
      lineSpacing: 2,
    }).setDepth(24);
  }

  drawActions() {
    const x = 1320;
    const makeButton = (y, label, onClick, style = 'primary') => {
      const primary = style === 'primary';
      const box = this.add.rectangle(x, y, 380, 50, primary ? 0x0c2827 : 0x102138, 0.98)
        .setStrokeStyle(2, primary ? 0x62e8c7 : 0x55b8ff, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(31);
      const text = this.add.text(x, y, label, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#f1fffb', align: 'center'
      }).setOrigin(0.5).setDepth(32);
      box.on('pointerdown', onClick);
      return { box, text };
    };

    this.runButton = makeButton(454, 'START SESSION // ¥ ' + Number(this.stage.sessionCost || 0).toLocaleString('en-US'), () => this.beginPull());
    this.resultsButton = makeButton(516, 'RESULTS // LAST RUN', () => this.showLastRun(), 'secondary');
    makeButton(578, 'CHANGE CAR // WORKSHOP', () => this.returnToWorkshop(), 'secondary');
    makeButton(640, 'RETURN TO WORKSHOP', () => this.returnToWorkshop(), 'secondary');

    this.resultsButton.box.setAlpha(this.previousRun ? 1 : 0.45);
    if (!this.previousRun) this.resultsButton.box.disableInteractive();
    this.refreshRunButton();
  }

  drawProgressionCards() {
    const next = getDynoNextStage(this.facilityTier);
    this.add.rectangle(1320, 170, 380, 122, 0x07111d, 0.93)
      .setStrokeStyle(2, 0x43dfff, 0.82).setDepth(28);
    this.add.text(1148, 126, this.stage.label, {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#dff7ff'
    }).setDepth(29);
    this.add.text(1148, 162, '3 PULL SESSION  //  LIVE POWER + TORQUE\nBASELINE MAPPING  //  DAICHI ANALYSIS', {
      fontFamily: BODY_FONT, fontSize: '9px', color: '#a7bdca', fontStyle: '700', lineSpacing: 4
    }).setDepth(29);

    if (this.facilityTier < 3) {
      this.add.rectangle(1320, 306, 380, 128, 0x0b1017, 0.92)
        .setStrokeStyle(1, 0x6b5b37, 0.86).setDepth(28);
      this.add.text(1148, 258, 'NEXT // ' + next.shortLabel, {
        fontFamily: PIXEL_FONT, fontSize: '7px', color: '#ffe08a'
      }).setDepth(29);
      this.add.text(
        1148,
        290,
        'UPGRADE  ¥ ' + Number(next.installCost || 0).toLocaleString('en-US') +
          '\n' + next.description.toUpperCase() + '\nLOCKED // NEXT DYNO RELEASE',
        {
          fontFamily: BODY_FONT, fontSize: '8px', color: '#aa9e80', fontStyle: '700', lineSpacing: 3,
          wordWrap: { width: 340 },
        }
      ).setDepth(29);
    }
  }

  ensureControls() {
    if (this.controls) {
      this.controls.enabled = true;
      return;
    }
    this.controls = new TouchControls(this, { nosEnabled: false });
    this.controls.nosSprite?.setVisible(false);
  }

  ensureAudio() {
    if (this.audio) return;
    const engineId = this.build?.car?.engine || cars[this.carId]?.engine;
    this.audio = new EngineAudioSystem(engineId, engineId, this.carState, {});
  }

  beginPull() {
    if (this.pullState === 'RUNNING' || this.pullState === 'SETUP') return;

    if (this.sessionPullsRemaining <= 0) {
      const cost = Math.max(0, Number(this.stage.sessionCost || 0));
      const cash = Math.max(0, Number(this.registry.get('cash') || 0));
      if (cash < cost) {
        this.daichiText.setText('DAICHI // You need ¥' + cost.toLocaleString('en-US') + ' for a three-pull session.');
        return;
      }
      this.registry.set('cash', cash - cost);
      this.cashText.setText('¥ ' + Number(cash - cost).toLocaleString('en-US'));
      this.sessionPullsRemaining = Math.max(1, Number(this.stage.pullsPerSession || 3));
      saveSessionState(this.registry);
    }

    this.ensureControls();
    this.ensureAudio();
    this.points = [];
    this.runProgress = 0;
    this.lowThrottleTime = 0;
    this.lastRecordedRPM = 0;
    this.currentGear = 0;
    this.currentRPM = Number(this.build.engine.idleRPM || 850);
    this.currentBoost = 0;
    this.turbo = new Turbo(this.build.car);
    this.pullState = 'SETUP';
    this.redrawGraph();
    this.daichiText.setText(
      'DAICHI // Clutch in. Select ' + this.ordinal(this.recommendedGear) +
      ' gear — closest to 1:1 — then release the clutch. I will call READY.'
    );
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
    if (Number(controls.clutch || 0) < 0.55) {
      this.daichiText.setText('DAICHI // Clutch first. Do not force the gearbox on the dyno.');
      return;
    }

    const maxGear = Math.max(1, this.build.car.gearRatios?.length || 5);
    if (request === 'UP') this.currentGear = Math.min(maxGear, this.currentGear + 1);
    else if (request === 'DOWN') this.currentGear = Math.max(0, this.currentGear - 1);
    else if (Number.isFinite(Number(request))) this.currentGear = clamp(Number(request), 1, maxGear);
  }

  startRunning() {
    if (this.pullState !== 'SETUP') return;
    this.pullState = 'RUNNING';
    this.runProgress = 0;
    this.currentRPM = Math.max(
      Number(this.build.engine.idleRPM || 850) + 650,
      Number(this.build.engine.redlineRPM || 7600) * 0.24
    );
    this.daichiText.setText('DAICHI // GO. Full throttle and hold it cleanly to redline.');
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
    this.audio?.fadeOut();
    this.sessionPullsRemaining = Math.max(0, this.sessionPullsRemaining - 1);

    const run = {
      completedAt: Date.now(),
      gear: this.recommendedGear,
      points: this.points.map(point => ({
        rpm: Math.round(point.rpm),
        powerKW: Math.round(point.powerKW * 10) / 10,
        torqueNm: Math.round(point.torqueNm * 10) / 10,
        boostBar: Math.round(point.boostBar * 100) / 100,
      })),
    };
    run.analysis = analyseDynoRun(run, this.build);
    run.wheelPowerKW = Math.round(
      Number(run.analysis.peakPowerKW || 0) * clamp(Number(this.build.car.drivetrainEfficiency || 0.86), 0.60, 0.99)
    );

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
    this.resultsButton?.box?.setAlpha(1)?.setInteractive?.({ useHandCursor: true });
    this.daichiText.setText('DAICHI // ' + run.analysis.comment);
    this.refreshPullCounter();
    this.refreshRunButton();
    this.redrawGraph();
    this.showRunSummary(run);
  }

  showRunSummary(run) {
    const a = run?.analysis;
    if (!a) return;
    this.telemetryText.setText(
      'PEAK  ' + a.peakPowerKW + ' kW @ ' + a.peakPowerRPM.toLocaleString('en-US') + ' rpm' +
      '   //   ' + a.peakTorqueNm + ' Nm @ ' + a.peakTorqueRPM.toLocaleString('en-US') + ' rpm' +
      '   //   WHEEL ~' + Number(run.wheelPowerKW || 0) + ' kW' +
      '\nUSABLE BAND  ' + a.usableBandStartRPM.toLocaleString('en-US') + '–' + a.usableBandEndRPM.toLocaleString('en-US') + ' rpm'
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
    this.pullCounterText.setText(
      this.sessionPullsRemaining > 0
        ? 'SESSION // ' + this.sessionPullsRemaining + ' CLEAN PULL' + (this.sessionPullsRemaining === 1 ? '' : 'S') + ' LEFT'
        : this.stage?.tier > 0
          ? 'SESSION // ¥ ' + Number(this.stage.sessionCost || 0).toLocaleString('en-US') + ' // 3 PULLS'
          : ''
    );
  }

  refreshRunButton() {
    if (!this.runButton) return;
    let label = 'START SESSION // ¥ ' + Number(this.stage.sessionCost || 0).toLocaleString('en-US');
    let enabled = true;

    if (this.pullState === 'SETUP') {
      label = 'SETUP // SELECT ' + this.ordinal(this.recommendedGear) + ' GEAR';
      enabled = false;
    } else if (this.pullState === 'RUNNING') {
      label = 'DYNO PULL // LIVE';
      enabled = false;
    } else if (this.sessionPullsRemaining > 0) {
      label = this.pullState === 'ABORTED'
        ? 'RETRY PULL // ' + this.sessionPullsRemaining + ' LEFT'
        : 'RUN NEXT PULL // ' + this.sessionPullsRemaining + ' LEFT';
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
    g.fillStyle(0x02090e, 0.93).fillRect(rect.x, rect.y, rect.w, rect.h);
    g.lineStyle(1, 0x1f3a49, 0.72);
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
    const xAt = rpm => rect.x + clamp((Number(rpm) - rpmMin) / Math.max(1, redline - rpmMin), 0, 1) * rect.w;
    const torqueY = value => rect.y + rect.h - clamp(Number(value) / maxTorque, 0, 1.08) * rect.h;
    const powerY = value => rect.y + rect.h - clamp(Number(value) / maxPower, 0, 1.08) * rect.h;

    const drawSeries = (points, key, yFn, color, alpha, width) => {
      if (!Array.isArray(points) || points.length < 2) return;
      g.lineStyle(width, color, alpha);
      let started = false;
      points.forEach(point => {
        const x = xAt(point.rpm);
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

    if (this.previousRun?.points?.length && this.points.length === 0) {
      drawSeries(this.previousRun.points, 'torqueNm', torqueY, 0x64727a, 0.42, 2);
      drawSeries(this.previousRun.points, 'powerKW', powerY, 0x64727a, 0.42, 2);
    } else if (this.previousRun?.points?.length) {
      drawSeries(this.previousRun.points, 'torqueNm', torqueY, 0x6c7479, 0.24, 2);
      drawSeries(this.previousRun.points, 'powerKW', powerY, 0x6c7479, 0.24, 2);
    }

    drawSeries(this.points, 'torqueNm', torqueY, 0x59dcff, 1, 3);
    drawSeries(this.points, 'powerKW', powerY, 0x7df6a8, 1, 3);
  }

  updateTelemetry(point = null, throttle = 0) {
    if (!this.telemetryText) return;
    const p = point || { powerKW: 0, torqueNm: 0, boostBar: 0 };
    this.telemetryText.setText(
      'RPM  ' + Math.round(this.currentRPM).toLocaleString('en-US') +
      '   //   GEAR  ' + (this.currentGear || 'N') +
      '   //   THROTTLE  ' + Math.round(clamp(throttle, 0, 1) * 100) + '%' +
      '\nBOOST  ' + Number(p.boostBar || 0).toFixed(2) + ' bar' +
      '   //   TORQUE  ' + Math.round(Number(p.torqueNm || 0)) + ' Nm' +
      '   //   POWER  ' + Math.round(Number(p.powerKW || 0)) + ' kW'
    );
  }

  update(time, deltaMs) {
    if (!this.build || !this.controls) {
      this.redrawRollers(0);
      return;
    }

    const dt = Math.min(1 / 30, Math.max(0.001, Number(deltaMs || 16.7) / 1000));
    const input = this.controls.update();
    const gearRequest = this.controls.consumeGearRequest();
    this.handleGearRequest(gearRequest, input);

    if (this.pullState === 'SETUP') {
      const targetRPM = Math.max(
        Number(this.build.engine.idleRPM || 850),
        Number(this.build.engine.idleRPM || 850) + Number(input.throttle || 0) * 800
      );
      this.currentRPM += (targetRPM - this.currentRPM) * Math.min(1, dt * 7);
      this.updateTelemetry({ boostBar: 0, powerKW: 0, torqueNm: 0 }, input.throttle);
      this.redrawRollers(time * 0.015);

      if (this.currentGear === this.recommendedGear && Number(input.clutch || 0) < 0.20) {
        this.daichiText.setText('DAICHI // READY. Hold full throttle for the pull.');
        if (Number(input.throttle || 0) >= 0.86) this.startRunning();
      }
      return;
    }

    if (this.pullState !== 'RUNNING') {
      this.updateTelemetry(null, 0);
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

    const redline = Math.max(3000, Number(this.build.engine.redlineRPM || this.build.car.engineRedlineRPM || 8000));
    const startRPM = Math.max(Number(this.build.engine.idleRPM || 850) + 650, redline * 0.24);
    this.runProgress = clamp(this.runProgress + dt * Math.max(0.18, throttle) / 5.25, 0, 1);
    this.currentRPM = startRPM + (redline - startRPM) * this.runProgress;

    this.turbo?.update(dt, this.currentRPM, throttle, 1.0, false, false);
    this.currentBoost = Number(this.turbo?.boostBar || 0);
    const point = getDynoPoint(this.build, this.currentRPM, this.currentBoost, throttle);

    if (!this.points.length || point.rpm - this.lastRecordedRPM >= 85 || this.runProgress >= 0.999) {
      this.points.push(point);
      this.lastRecordedRPM = point.rpm;
      this.redrawGraph();
    }

    const overallRatio = Math.max(
      0.1,
      Number(this.build.car.gearRatios?.[Math.max(0, this.recommendedGear - 1)] || 1) *
        Number(this.build.car.finalDriveRatio || 1)
    );
    const wheelRPM = this.currentRPM / overallRatio;
    const rotation = wheelRPM * (Math.PI * 2 / 60) * dt;
    this.wheelObjects.forEach(wheel => { if (wheel?.active) wheel.rotation += rotation; });
    this.redrawRollers(time * 0.18 + wheelRPM * 0.03);

    const vibration = Math.sin(time * 0.055) * (1.0 + throttle * 1.3);
    this.carBodyBase.forEach(item => {
      if (item.obj?.active) item.obj.y = item.y + vibration;
    });

    const telemetry = {
      positionM: 0,
      speedKmh: 0,
      rpm: this.currentRPM,
      gear: this.currentGear,
      pendingGear: null,
      throttle,
      clutch: input.clutch,
      boostBar: this.currentBoost,
      turboSpool: Number(this.turbo?.spool || 0),
      wheelRPM,
      wheelspin: false,
      slipRatio: 0,
      nosActive: false,
    };
    this.audio?.update(telemetry, null, this.build.car, this.build.car, dt);
    this.updateTelemetry(point, throttle);

    if (this.runProgress >= 0.999) this.completePull();
  }

  returnToWorkshop() {
    this.cleanup();
    this.registry.set('workshopLocationId', DYNO_WAREHOUSE_ID);
    this.registry.set('selectedCarId', this.carId);
    saveSessionState(this.registry);
    this.scene.start('GarageScene', { workshopLocationId: DYNO_WAREHOUSE_ID });
  }
}
