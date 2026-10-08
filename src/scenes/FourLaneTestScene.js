// Dev-only four-wide drag visual/physics prototype.
// IMPORTANT: This scene never invokes RaceScene settlement or writes career data.
// Reuses the production two-lane Vehicle/AI, car rendering and control systems.
import RaceScene from './RaceScene.js?v=20261008-r431';
import Vehicle from '../vehicles/Vehicle.js?v=20261008-r428';
import DragRacingAI from '../ai/DragRacingAI.js?v=20261008-r428';
import TouchControls from '../input/TouchControls.js?v=20261008-r426';
import RaceHUD from '../ui/RaceHUD.js?v=20261008-r428';
import EngineAudioSystem from '../audio/EngineAudioSystem.js?v=20260921-r81';
import { playRaceMusic } from '../audio/MusicManager.js?v=20260922-r99';
import { cars } from '../data/cars.js?v=20261006-r388';
import { getBuiltCar } from '../vehicles/VehiclePerformance.js?v=20261008-r428';
import {
  applyDifficultyToPlayerCarConfig,
  applyDifficultyToRivalAi,
  normalisePlayerDifficulty,
} from '../data/playerDifficulty.js?v=20261007-r399';
import {
  getEncounterAi,
  boostAiForStandingStart,
} from '../data/encounterProfiles.js?v=20260926-r204';
import { createRivalBuildState } from '../data/rivalBuilds.js?v=20260928-r234';
import {
  getCarPaintColor, preloadCarAppearanceAssets, preloadCarWheel,
  ensureDerivedModularCarTextures,
} from '../vehicles/CarAppearance.js?v=20260929-r246';
import { preloadVisualModSelectionAssets } from '../data/visualMods.js?v=20261006-r388';
import { preloadTunerDecalAssets } from '../vehicles/TunerDecals.js?v=20260929-r284';
import { isArkonDen } from '../data/centralTokyo.js?v=20261006-r388';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20261005-r355';
import {
  FOUR_LANE_TEST_DISTANCE_M, FOUR_LANE_TEST_LANES,
  FOUR_LANE_TEST_PX_PER_M, FOUR_LANE_TEST_ANCHOR_X,
  fourLaneCarX, fourLaneCameraX, fourLaneDashSafeYOffset,
  rankFourLaneFinishers,
} from '../data/fourLanePrototype.js?v=20261008-r436';

const PIXEL = '"Silkscreen", monospace';
const BODY = '"Rajdhani", monospace';
const WIDTH = 1560;
const HEIGHT = 720;
const STAND_Y = 130;
const ROAD_BOTTOM = 490;
// Two one-lane downward shifts relative to the original road. Keep the
// venue art and HUD fixed; only the Phaser road and car visuals move.
const ROAD_DROP_Y = 150;
// In the close-up the cars should occupy the race area, with the lowest car
// fully above the actual top of the player's custom-positioned dashboard.
const ZOOM_CAR_FOCUS_X = 640;
const DASH_CLEARANCE_PX = 24;
// The establishing shot is deliberately wider than the standard race framing.
const PREVIEW_ZOOM = 0.52;
const TRACK_PIVOT_X = 780;
const TRACK_PIVOT_Y = 290;
// Pan the entire race world left. This brings the staged cars alongside the
// pit complex and keeps the eventual driving view focused on the four cars.
const TRACK_PAN_X = -235;
// Enlarge the start complex by exactly 50% from its R433 preview size.
// Retain the exact R433 top-left coordinates rather than a rounded pixel.
const COMPLEX_BASE_PREVIEW_WIDTH = 330;
const COMPLEX_PREVIEW_WIDTH = COMPLEX_BASE_PREVIEW_WIDTH * 1.5;
const COMPLEX_ORIGINAL_FENCE_FRAC = 0.67;
const TRACK_DRAW_LEFT = -800;
const TRACK_DRAW_RIGHT = 3400;
const TRACK_DRAW_WIDTH = TRACK_DRAW_RIGHT - TRACK_DRAW_LEFT;

export default class FourLaneTestScene extends RaceScene {
  constructor() {
    super('FourLaneTestScene');
  }

  init() {
    const selected = this.registry.get('selectedCarId');
    this.playerCarId = cars[selected] ? selected : 'ae86';
    // Fixed, recognisable JDM test opponents; no effect on persistent racers.
    const candidates = ['evo6', 'r34', 'rx7fd', 's2000', 'r32', 'jza80'];
    this.aiCarIds = candidates.filter(id => cars[id] && id !== this.playerCarId).slice(0, 3);
    while (this.aiCarIds.length < 3) this.aiCarIds.push('ae86');
  }

  preload() {
    let queued = 0;
    const loadImage = (key, path) => {
      if (this.textures.exists(key)) return;
      this.load.image(key, path);
      queued++;
    };
    loadImage('hudCluster', 'assets/Ui/hud_cluster.png');
    loadImage('clutchPedal', 'assets/Controls/clutch_pedal.png');
    loadImage('throttlePedal', 'assets/Controls/throttle_pedal.png');
    loadImage('nosButton', 'assets/Controls/nos_button.png');
    loadImage('shifterNeutral', 'assets/Controls/shifter_neutral.png');
    loadImage('shifterDown', 'assets/Controls/shifter_down.png');
    // Dev-only venue foreground: loaded only when four-wide tester opens.
    loadImage('fourLaneStartComplex', 'assets/CentralTokyo/dragstrip_complex_night.png');
    const states = this.registry.get('carStates') || {};
    const playerState = states[this.playerCarId] || {};
    [...new Set([this.playerCarId, ...this.aiCarIds])].forEach(id => {
      queued += preloadCarAppearanceAssets(this, { [id]: cars[id] }, '20261008-r431');
      queued += preloadCarWheel(this, cars[id], id === this.playerCarId ? playerState : {});
    });
    queued += preloadVisualModSelectionAssets(this, this.playerCarId, playerState, '20261008-r431');
    queued += preloadTunerDecalAssets(this, playerState, '20261008-r431');
    startSceneLoading(this, 'FOUR-LANE TEST', queued);
  }

  create() {
    if (!isArkonDen(this.registry)) {
      this.returnToDrag();
      return;
    }
    document.body.dataset.scene = 'race';
    this.scale.resize(WIDTH, HEIGHT);
    playRaceMusic();
    this.playerState = (this.registry.get('carStates') || {})[this.playerCarId] || {};
    const difficulty = normalisePlayerDifficulty(this.registry.get('playerDifficulty'));
    const playerBuild = getBuiltCar(this.playerCarId, this.playerState);
    if (!playerBuild) {
      this.returnToDrag();
      return;
    }
    const playerConfig = applyDifficultyToPlayerCarConfig(playerBuild.car, difficulty);
    const player = new Vehicle(playerConfig, playerBuild.engine);
    player.transmission.currentGear = 0;
    player.transmission.lastShiftQuality = 'NEUTRAL';

    this.runners = [{
      id: 'player', lane: 1, label: 'YOU', carId: this.playerCarId,
      carState: this.playerState, carLabel: cars[this.playerCarId].shortName,
      vehicle: player, ai: null, config: playerConfig,
      paint: getCarPaintColor(this.playerState), finishSeconds: null,
      disqualified: false,
    }];
    this.aiCarIds.forEach((id, index) => {
      const rating = index === 2 ? 5 : 4;
      const state = createRivalBuildState(cars[id], rating, {
        seed: 'four-lane-dev:' + id + ':' + index, raceType: 'Standing Start',
      });
      const built = getBuiltCar(id, state) || getBuiltCar(id, {});
      const vehicle = new Vehicle(built.car, built.engine);
      vehicle.transmission.currentGear = 1;
      vehicle.transmission.lastShiftQuality = 'STAGED';
      const skill = applyDifficultyToRivalAi(
        boostAiForStandingStart(getEncounterAi(rating), rating),
        difficulty, { rollingStart: false }
      );
      this.runners.push({
        id: 'ai-' + (index + 1), lane: index + 2,
        label: 'RIVAL ' + (index + 1), carId: id,
        carState: {}, carLabel: cars[id].shortName,
        vehicle, ai: new DragRacingAI(vehicle, skill, {
          rating, playerDifficulty: difficulty, rollingStart: false,
          raceDistanceM: FOUR_LANE_TEST_DISTANCE_M,
        }),
        config: built.car, paint: [0xd04a59, 0x63b3d4, 0xefca66][index],
        finishSeconds: null, disqualified: false,
      });
    });

    ensureDerivedModularCarTextures(
      this, Object.fromEntries([...new Set(this.runners.map(r => r.carId))]
        .map(id => [id, cars[id]]))
    );

    // The opening zoom-out reveals space outside the close-up track crop.
    // Fill that space with neutral venue architecture, never black gutters.
    this.add.rectangle(780, 360, WIDTH, HEIGHT, 0x10212d).setDepth(-2);
    this.trackG = this.add.graphics().setDepth(0);
    // Transparent building, crew, lights and barriers. The road stays Phaser-generated.
    // Keep the art in the SAME WORLD as the road and cars: the cinematic zoom
    // must grow all three together, revealing progressively less of the venue.
    this.complexArt = this.textures.exists('fourLaneStartComplex')
      ? this.add.image(0, 0, 'fourLaneStartComplex').setOrigin(0, 0).setDepth(2)
      : null;
    this.trackFX = this.add.graphics().setDepth(18);
    this.runners.forEach((runner, index) => {
      const lane = FOUR_LANE_TEST_LANES[index];
      runner.visual = this.createCarVisual(
        cars[runner.carId],
        12 - index * 2,
        lane.scale,
        runner.paint,
        null,
        runner.carState
      );
    });

    // Only the track and car sprites zoom. The controls and HUD never move.
    const carObjects = this.runners.flatMap(({ visual: v }) =>
      [v.roadShadow, v.rearWheelBacking, v.frontWheelBacking,
        v.rearWheel, v.frontWheel, v.driverSilhouette, ...v.bodyObjects]
        .filter(Boolean)
    );
    this.trackRoot = this.add.container(0, 0, [
      this.trackG, ...(this.complexArt ? [this.complexArt] : []), this.trackFX, ...carObjects,
    ])
      .setDepth(1);
    // Containers render children in list order, not scene Display List depth order.
    // Preserve standard wheels/body/decals/FX layering across all four cars.
    this.trackRoot.list.sort((a, b) => a.depth - b.depth);
    this.configureComplexArt();
    this.setTrackZoom(PREVIEW_ZOOM);

    const hasNitrous = Number(playerConfig.nosPower || 0) > 0 &&
      Number(playerConfig.nosCapacitySeconds || 0) > 0;
    this.controls = new TouchControls(this, { nosEnabled: hasNitrous });
    this.hud = new RaceHUD(this, {
      hasTurbo: Number(playerConfig.maximumBoost || 0) > 0.01,
      hasNitrous,
    });
    this.engineAudio = new EngineAudioSystem(
      playerConfig.engine, this.runners[1].config.engine,
      this.playerState, {}
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls?.destroy();
      this.hud?.destroy();
      this.engineAudio?.destroy();
    });

    this.raceClock = 0;
    this.greenClock = null;
    this.raceStarted = false;
    this.countdownActive = false;
    this.countdownClock = 0;
    this.zooming = false;
    this.finished = false;
    this.resultsShown = false;
    this.firstFinishClock = null;
    this.cameraPx = fourLaneCameraX(0);
    this.falseStart = false;

    this.header = this.add.text(780, 22, 'TOKYO DRAG COMPLEX // FOUR-WIDE DEV TEST', {
      fontFamily: PIXEL, fontSize: '10px', color: '#d7f4ff',
      backgroundColor: '#061019dd', padding: { x: 13, y: 6 },
    }).setDepth(48).setOrigin(0.5).setScrollFactor(0);
    this.subheader = this.add.text(
      780, 113, '4 LANES  //  QUARTER MILE  //  NO FEES OR CAREER RESULTS', {
        fontFamily: PIXEL, fontSize: '8px', color: '#b0deeb',
        backgroundColor: '#07111dcc', padding: { x: 10, y: 5 },
      }
    ).setDepth(48).setOrigin(0.5).setScrollFactor(0);

    this.startButton = this.makeButton(780, 64, 245, 'START 4-WIDE', 0x52dbd1,
      () => this.startFourLaneRace());
    this.exitButton = this.makeButton(150, 64, 215, 'RETURN TO DRAG', 0xffa9b3,
      () => this.returnToDrag());

    this.signalG = this.add.graphics().setDepth(45).setScrollFactor(0);
    this.signalText = this.add.text(1178, 72, 'TRACK PREVIEW', {
      fontFamily: PIXEL, fontSize: '9px', color: '#e9f9ff',
    }).setOrigin(0.5).setDepth(46).setScrollFactor(0);

    this.placeText = this.add.text(1325, 159, '', {
      fontFamily: PIXEL, fontSize: '8px', color: '#eaf8ff',
      backgroundColor: '#061019dd', padding: { x: 10, y: 8 },
      lineSpacing: 9,
    }).setDepth(45).setOrigin(0.5, 0).setScrollFactor(0);

    this.renderTrack(0);
    finishSceneLoading('READY FOR FOUR-WIDE TEST');
  }

  makeButton(x, y, width, label, color, onPress) {
    const bg = this.add.rectangle(x, y, width, 43, 0x091928, 0.98)
      .setStrokeStyle(2, color, 1).setInteractive({ useHandCursor: true })
      .setDepth(60).setScrollFactor(0);
    const text = this.add.text(x, y, label, {
      fontFamily: PIXEL, fontSize: '10px', color: '#f1fcff',
    }).setOrigin(0.5).setDepth(61).setScrollFactor(0);
    bg.on('pointerdown', onPress);
    return { bg, text };
  }

  configureComplexArt() {
    if (!this.complexArt) return;
    const art = this.complexArt;
    // Establish the PNG once in track world coordinates. Unlike R432 we do
    // NOT re-fit its on-screen dimensions for every zoom frame.
    const previewImageScale = COMPLEX_PREVIEW_WIDTH / art.width;
    const worldImageScale = previewImageScale / PREVIEW_ZOOM;
    const previewRootX = TRACK_PIVOT_X * (1 - PREVIEW_ZOOM) + TRACK_PAN_X;
    const previewRootY = TRACK_PIVOT_Y * (1 - PREVIEW_ZOOM);
    // Recover the precise OLD preview top-left using R433's original fence
    // registration. The 50% larger picture then expands only down/right.
    const originalImageScale = COMPLEX_BASE_PREVIEW_WIDTH / art.width;
    const originalRoadTop = previewRootY + STAND_Y * PREVIEW_ZOOM;
    const originalArtTop = originalRoadTop -
      art.height * COMPLEX_ORIGINAL_FENCE_FRAC * originalImageScale;
    this.complexBaseX = -previewRootX / PREVIEW_ZOOM;
    const artWorldY = (originalArtTop - previewRootY) / PREVIEW_ZOOM;
    art.setPosition(this.complexBaseX, artWorldY).setScale(worldImageScale);
  }

  getStagedCarBottomWorld() {
    // Measure the real sprite bottoms after renderTrack() has positioned
    // the current player's body, wheels and road shadow. This is more robust
    // than assuming a particular car model, tyre size or tuned body kit.
    const v = this.runners?.[0]?.visual;
    const parts = v
      ? [v.roadShadow, v.rearWheel, v.frontWheel, ...(v.bodyObjects || [])]
      : [];
    const bottoms = parts
      .filter(obj => obj && Number.isFinite(obj.y) &&
        Number.isFinite(obj.displayHeight))
      .map(obj => obj.y + (1 - Number(obj.originY ?? 0.5)) * obj.displayHeight);
    return Math.max(
      FOUR_LANE_TEST_LANES[0].bodyY + ROAD_DROP_Y + 35,
      ...bottoms
    );
  }

  configureZoomFocus() {
    const carBottom = this.getStagedCarBottomWorld();
    // The player's HUD can move and scale in control settings. Read its real
    // position rather than depending on a hardcoded 720px-device cutoff.
    const dashBounds = this.hud?.cluster?.getBounds?.();
    const hudTop = Number.isFinite(dashBounds?.top) ? dashBounds.top : 462;
    this.zoomFocusShiftY = fourLaneDashSafeYOffset(
      carBottom, hudTop, DASH_CLEARANCE_PX
    );
    // Move a little toward the cars horizontally at close-up, without
    // changing the established wider start composition.
    this.zoomFocusShiftX = ZOOM_CAR_FOCUS_X -
      (FOUR_LANE_TEST_ANCHOR_X + TRACK_PAN_X);
  }

  setTrackZoom(scale) {
    // Scale the complete world, but ease the frame toward the four staged
    // cars during the push-in. At full zoom the lowest pixel stays at least
    // DASH_CLEARANCE_PX above the user's actual dashboard image.
    const progress = Phaser.Math.Clamp(
      (scale - PREVIEW_ZOOM) / (1 - PREVIEW_ZOOM), 0, 1
    );
    this.trackRoot.setScale(scale);
    this.trackRoot.setPosition(
      TRACK_PIVOT_X * (1 - scale) + TRACK_PAN_X +
        (this.zoomFocusShiftX || 0) * progress,
      TRACK_PIVOT_Y * (1 - scale) +
        (this.zoomFocusShiftY || 0) * progress
    );
    this.positionComplexArt();
  }

  positionComplexArt() {
    if (!this.complexArt || !this.trackRoot) return;
    // World-space travel makes the venue disappear after the launch, with no
    // abrupt removal and no arbitrary time-based slide animation.
    const travelledPx = this.cameraPx == null ? 0 :
      Math.max(0, this.cameraPx - fourLaneCameraX(0));
    const art = this.complexArt;
    art.x = this.complexBaseX - travelledPx;
    // Culling avoids drawing the building once it is fully off the left edge.
    const rightEdge = this.trackRoot.x +
      (art.x + art.displayWidth) * this.trackRoot.scaleX;
    art.setVisible(rightEdge > -8);
  }

  startFourLaneRace() {
    if (this.raceStarted || this.resultsShown) return;
    this.raceStarted = true;
    this.zooming = true;
    this.startButton.bg.disableInteractive().setVisible(false);
    this.startButton.text.setVisible(false);
    this.signalText.setText('CAMERA CLOSING IN');
    this.configureZoomFocus();
    this.tweens.addCounter({
      from: PREVIEW_ZOOM, to: 1, duration: 1250, ease: 'Sine.InOut',
      onUpdate: tween => this.setTrackZoom(tween.getValue()),
      onComplete: () => {
        this.setTrackZoom(1);
        this.zooming = false;
        this.countdownActive = true;
        this.countdownClock = 0;
      },
    });
  }

  racePhase() {
    if (!this.raceStarted) return 'PREVIEW';
    if (this.zooming) return 'ZOOM';
    if (this.greenClock != null) return 'GREEN';
    if (this.countdownClock < 0.9) return 'PRE-STAGE';
    if (this.countdownClock < 1.8) return 'STAGE';
    if (this.countdownClock < 2.3) return 'AMBER 1';
    if (this.countdownClock < 2.8) return 'AMBER 2';
    return 'AMBER 3';
  }

  update(_time, deltaMs) {
    if (!this.runners || this.resultsShown) return;
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    this.raceClock += dt;
    if (Phaser.Input.Keyboard.JustDown(this.controls.keys.restart)) {
      this.scene.restart();
      return;
    }
    const control = this.controls.update();
    const gearRequest = this.controls.consumeGearRequest();
    if (gearRequest != null && !this.finished) this.handleGearRequest(gearRequest);

    if (this.countdownActive && this.greenClock == null) {
      this.countdownClock += dt;
      if (this.countdownClock >= 3.3) {
        this.greenClock = this.raceClock;
        this.signalText.setText('GREEN!').setColor('#8affb0');
      }
    }

    let playerTelemetry = null;
    let firstAiTelemetry = null;
    const inPreview = !this.raceStarted || this.zooming;
    this.runners.forEach((runner, index) => {
      // Let finished cars keep rolling past the line while others finish;
      // only their official crossing time is frozen.
      let state;
      if (index === 0) {
        // Staged cars cannot creep before the test begins; after START, a
        // release before green is a genuine red-light disqualification.
        state = inPreview
          ? { throttle: control.throttle, clutch: 1, nos: false }
          : control;
      } else {
        state = runner.ai.update(dt, this.raceClock, this.greenClock);
      }
      const telemetry = runner.vehicle.update(dt, state);
      runner.lastTelemetry = telemetry;
      if (index === 0) playerTelemetry = telemetry;
      if (index === 1) firstAiTelemetry = telemetry;
      if (index === 0 && this.raceStarted && this.greenClock == null &&
          !this.zooming && runner.vehicle.positionM > 0.25) {
        runner.disqualified = true;
        this.falseStart = true;
      }
      if (this.greenClock != null && runner.finishSeconds == null &&
          runner.vehicle.positionM >= FOUR_LANE_TEST_DISTANCE_M) {
        // Interpolate across the crossing within the frame for fair placings.
        const speed = Math.max(0.1, telemetry.speedMps || 0.1);
        const overshoot = Math.max(0, runner.vehicle.positionM - FOUR_LANE_TEST_DISTANCE_M);
        runner.finishSeconds = Math.max(
          0, this.raceClock - this.greenClock - Math.min(dt, overshoot / speed)
        );
        if (this.firstFinishClock == null) this.firstFinishClock = this.raceClock;
      }
    });

    if (this.engineAudio && playerTelemetry) {
      this.engineAudio.update(playerTelemetry, firstAiTelemetry,
        this.runners[0].config, this.runners[1].config, dt);
    }

    const livePlayer = playerTelemetry || this.runners[0].lastTelemetry ||
      this.runners[0].vehicle.telemetry;
    this.renderTrack(dt);
    this.renderSignals();
    this.updateLivePositions();
    this.hud.update(livePlayer, this.falseStart ? 'RED LIGHT // DISQUALIFIED'
      : this.zooming ? 'FOUR-LANE TRACK // CLOSING IN'
      : !this.raceStarted ? 'WIDE VIEW // TAP START 4-WIDE'
      : this.greenClock != null ? 'FOUR-WIDE // QUARTER MILE'
      : 'STAGED // WAIT FOR GREEN');

    if (this.greenClock != null && !this.finished) {
      const allDone = this.runners.every(r => r.finishSeconds != null);
      const timeLimit = this.raceClock - this.greenClock > 38;
      // Avoid trapping a player who fails to launch indefinitely after all
      // rival cars have finished. A non-finisher is shown as DNF.
      const stragglerLimit = this.firstFinishClock != null &&
        this.raceClock - this.firstFinishClock > 10;
      if (allDone || timeLimit || stragglerLimit) {
        this.finished = true;
        this.time.delayedCall(950, () => this.showFourLaneResults());
      }
    }
  }

  handleGearRequest(request) {
    if (!this.raceStarted || this.zooming) return;
    const v = this.runners[0].vehicle;
    const gearbox = v.transmission;
    if (gearbox.shiftTimer > 0) return;
    if (request === 'UP') {
      const next = gearbox.currentGear <= 0 ? 1 : gearbox.currentGear + 1;
      if (next <= v.config.gearRatios.length) v.requestGear(next);
    } else if (request === 'DOWN') {
      if (gearbox.currentGear > 1) v.requestGear(gearbox.currentGear - 1);
    } else if (typeof request === 'number') {
      v.requestGear(request);
    }
  }

  updateLivePositions() {
    if (!this.placeText) return;
    const byDistance = [...this.runners].sort((a, b) =>
      (b.vehicle.positionM - a.vehicle.positionM) || a.lane - b.lane
    );
    const text = byDistance.map((r, i) =>
      (i + 1) + '  ' + r.carLabel.toUpperCase()
    ).join('\n');
    this.placeText.setText(text);
  }

  renderSignals() {
    const g = this.signalG;
    g.clear();
    const phase = this.racePhase();
    const statuses = [
      { name: 'STAGE', color: 0xc2e8ff, active: phase === 'STAGE' },
      { name: 'AMBER 1', color: 0xffbd46, active: phase === 'AMBER 1' },
      { name: 'AMBER 2', color: 0xffbd46, active: phase === 'AMBER 2' },
      { name: 'AMBER 3', color: 0xffbd46, active: phase === 'AMBER 3' },
      { name: 'GREEN', color: 0x58ffac, active: phase === 'GREEN' && !this.falseStart },
    ];
    g.fillStyle(0x041018, 0.92).fillRoundedRect(1076, 84, 215, 22, 6);
    statuses.forEach((lamp, index) => {
      g.fillStyle(lamp.active ? lamp.color : 0x243341, lamp.active ? 1 : 0.75);
      g.fillCircle(1100 + index * 40, 95, 7.5);
    });
    if (this.falseStart) this.signalText.setText('RED LIGHT').setColor('#ff697c');
    else if (phase === 'AMBER 1' || phase === 'AMBER 2' || phase === 'AMBER 3' ||
      phase === 'STAGE' || phase === 'PRE-STAGE') {
      this.signalText.setText(phase).setColor('#ffda9d');
    }
  }

  renderTrack(dt) {
    const player = this.runners[0];
    const playerM = player.vehicle.positionM;
    this.cameraPx = fourLaneCameraX(playerM);
    this.positionComplexArt();
    const g = this.trackG;
    g.clear();
    // Close-up professional venue, not a distant city skyline.
    g.fillStyle(0x050c14).fillRect(TRACK_DRAW_LEFT, -140, TRACK_DRAW_WIDTH, HEIGHT + 280);
    g.fillStyle(0x0c2330).fillRect(TRACK_DRAW_LEFT, 0, TRACK_DRAW_WIDTH, STAND_Y);
    g.fillStyle(0x183240).fillRect(TRACK_DRAW_LEFT, 26, TRACK_DRAW_WIDTH, 35);
    // Extend the lower venue wall to the translated road's top boundary.
    g.fillStyle(0x091b26).fillRect(TRACK_DRAW_LEFT, 75, TRACK_DRAW_WIDTH, 55 + ROAD_DROP_Y);
    const drift = (((this.cameraPx * 0.08) % 165) + 165) % 165;
    for (let x = -900 - drift; x < TRACK_DRAW_RIGHT; x += 165) {
      g.fillStyle(0x5e8496, 0.42).fillRect(x, 14, 4, 100);
      g.fillStyle(0x36d5e4, 0.30).fillRect(x + 12, 40, 82, 4);
      g.fillStyle(0xd9f6ff, 0.67).fillCircle(x + 60, 117, 3);
    }
    g.fillStyle(0x0a121b).fillRect(TRACK_DRAW_LEFT, STAND_Y + ROAD_DROP_Y, TRACK_DRAW_WIDTH, ROAD_BOTTOM - STAND_Y);
    // Translate the entire road by ROAD_DROP_Y, keeping its four band
    // heights and all three lane dividers identical to the preceding build.
    const laneBandTops = [383, 310, 235, 160];
    FOUR_LANE_TEST_LANES.forEach((_lane, index) => {
      g.fillStyle(index % 2 ? 0x222c34 : 0x252d35, 1)
        .fillRect(TRACK_DRAW_LEFT, laneBandTops[index] + ROAD_DROP_Y, TRACK_DRAW_WIDTH, 74);
    });
    g.fillStyle(0x8ea8b7, 0.5).fillRect(TRACK_DRAW_LEFT, STAND_Y + ROAD_DROP_Y + 2, TRACK_DRAW_WIDTH, 3);
    g.fillStyle(0xc2d5e0, 0.72).fillRect(TRACK_DRAW_LEFT, ROAD_BOTTOM + ROAD_DROP_Y - 3, TRACK_DRAW_WIDTH, 2);
    // Lane boundaries: keep the asphalt uncluttered.
    for (const y of [233, 308, 383]) {
      g.lineStyle(2, 0xc2d5e0, 0.48).beginPath().moveTo(TRACK_DRAW_LEFT, y + ROAD_DROP_Y)
        .lineTo(TRACK_DRAW_RIGHT, y + ROAD_DROP_Y).strokePath();
    }
    const trackShift = (((this.cameraPx * 0.90) % 150) + 150) % 150;
    for (let x = -900 - trackShift; x < TRACK_DRAW_RIGHT; x += 150) {
      for (const y of [230, 305, 380]) {
        g.fillStyle(0xe6eff2, 0.28).fillRect(x, y + ROAD_DROP_Y, 54, 2);
      }
      g.fillStyle(0x58b6c4, 0.40).fillRect(x + 12, 118, 4, 10);
    }
    // Start and finish mark are actual world-space positions.
    const front = player.visual.noseOffsetPx;
    const startX = fourLaneCarX(0, this.cameraPx, 0, front);
    const finishX = fourLaneCarX(FOUR_LANE_TEST_DISTANCE_M, this.cameraPx, 0, front);
    if (startX > -30 && startX < WIDTH + 30) {
      g.fillStyle(0xffffff, 0.7).fillRect(startX, 139 + ROAD_DROP_Y, 4, ROAD_BOTTOM - 144);
    }
    if (finishX > -30 && finishX < WIDTH + 30) {
      for (let y = 139 + ROAD_DROP_Y; y < ROAD_BOTTOM + ROAD_DROP_Y - 6; y += 16) {
        g.fillStyle(((y - (139 + ROAD_DROP_Y)) / 16) % 2 === 0 ? 0xffffff : 0x15202a, 0.92)
          .fillRect(finishX, y, 14, 16);
        g.fillStyle(((y - (139 + ROAD_DROP_Y)) / 16) % 2 === 0 ? 0x15202a : 0xffffff, 0.92)
          .fillRect(finishX + 14, y, 14, 16);
      }
    }
    g.fillStyle(0x121b23).fillRect(TRACK_DRAW_LEFT, ROAD_BOTTOM + ROAD_DROP_Y + 2, TRACK_DRAW_WIDTH, 26);
    g.fillStyle(0x68adba, 0.24).fillRect(TRACK_DRAW_LEFT, ROAD_BOTTOM + ROAD_DROP_Y + 2, TRACK_DRAW_WIDTH, 3);

    this.trackFX.clear();
    this.runners.forEach((runner, index) => {
      const t = runner.lastTelemetry || runner.vehicle.telemetry;
      const v = runner.visual;
      const x = fourLaneCarX(runner.vehicle.positionM, this.cameraPx,
        v.noseOffsetPx, front);
      this.updateCarVisual(v, x, FOUR_LANE_TEST_LANES[index].bodyY + ROAD_DROP_Y, t, dt);
      if (t.wheelspin) {
        this.trackFX.fillStyle(0xe0eff6, 0.16).fillCircle(v.rearX - 23, v.rearY + 5, 15);
      }
      if (t.nosActive) {
        this.trackFX.fillStyle(0x5acfff, 0.95)
          .fillTriangle(v.exhaustX, v.exhaustY,
            v.exhaustX - 28, v.exhaustY - 6,
            v.exhaustX - 28, v.exhaustY + 6);
      }
    });
  }

  showFourLaneResults() {
    if (this.resultsShown) return;
    this.resultsShown = true;
    this.controls.enabled = false;
    this.engineAudio?.fadeOut?.();
    const standings = rankFourLaneFinishers(this.runners);
    const own = standings.find(r => r.id === 'player');
    this.add.rectangle(780, 345, 1050, 552, 0x06121e, 0.985)
      .setStrokeStyle(3, 0x62d7ed).setDepth(95).setScrollFactor(0);
    this.add.text(780, 110, 'FOUR-WIDE TEST // OFFICIAL RESULTS', {
      fontFamily: PIXEL, fontSize: '18px', color: '#edfbff',
    }).setOrigin(0.5).setDepth(96).setScrollFactor(0);
    this.add.text(780, 154,
      'YOUR FINISH: ' + (own?.placing || 4) + '/4 // NO MONEY OR CAREER CHANGES', {
        fontFamily: PIXEL, fontSize: '11px', color: '#a3e5ec',
      }).setOrigin(0.5).setDepth(96).setScrollFactor(0);
    standings.forEach((row, i) => {
      const y = 215 + i * 64;
      const mine = row.id === 'player';
      this.add.rectangle(780, y, 865, 52, mine ? 0x154051 : 0x122433, 1)
        .setStrokeStyle(1, mine ? 0x79e6ff : 0x395362)
        .setDepth(96).setScrollFactor(0);
      this.add.text(410, y, String(row.placing) + '  LANE ' + row.lane, {
        fontFamily: PIXEL, fontSize: '10px', color: mine ? '#91efff' : '#ffffff',
      }).setOrigin(0, 0.5).setDepth(97).setScrollFactor(0);
      this.add.text(680, y, row.label + '  //  ' + row.carLabel, {
        fontFamily: BODY, fontSize: '15px', color: '#edfaff', fontStyle: '700',
      }).setOrigin(0, 0.5).setDepth(97).setScrollFactor(0);
      this.add.text(1190, y,
        row.status === 'FINISHED' ? row.finishSeconds.toFixed(3) + 's' : row.status, {
          fontFamily: PIXEL, fontSize: '10px',
          color: row.status === 'FINISHED' ? '#85e5b3' : '#ff93a2',
        }).setOrigin(1, 0.5).setDepth(97).setScrollFactor(0);
    });
    this.makeButton(625, 532, 290, 'RETRY 4-WIDE', 0x70dcca, () => this.scene.restart());
    this.makeButton(970, 532, 310, 'RETURN TO DRAG', 0xffcf9b, () => this.returnToDrag());
  }

  returnToDrag() {
    this.scene.start('CentralTokyoScene', { locationId: 'tokyoDragComplex' });
  }
}
