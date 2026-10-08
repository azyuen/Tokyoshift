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
import { characters, getCharacterAssetUrl } from '../data/characters.js?v=20261007-r411';
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
import { saveSessionState } from '../state/GameState.js?v=20261007-r422';
import { getFourLaneFinishCue } from '../data/fourLaneFinish.js?v=20261009-r444';
import { getProCircuitAccess } from '../data/proCircuit.js?v=20261008-r429';
import {
  FOUR_WIDE_CUP, proCupHash, getPlayerProHeat, settleFourWideHeat,
} from '../data/proTournament.js?v=20261008-r443';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20261005-r355';
import {
  FOUR_LANE_TEST_DISTANCE_M, FOUR_LANE_TEST_LANES,
  FOUR_LANE_TEST_PX_PER_M, FOUR_LANE_TEST_ANCHOR_X,
  fourLaneCarX, fourLaneCameraX, fourLaneDashSafeYOffset,
  fourLaneTreeLights, rankFourLaneFinishers,
} from '../data/fourLanePrototype.js?v=20261008-r440';

const PIXEL = '"Silkscreen", monospace';
const BODY = '"Rajdhani", monospace';
const WIDTH = 1560;
const HEIGHT = 720;
const STAND_Y = 130;
const ROAD_BOTTOM = 490;
// Two one-lane downward shifts relative to the original road. Keep the
// venue art and HUD fixed; only the Phaser road and car visuals move.
const ROAD_DROP_Y = 150;
// R437: move all road boundary lines down, with an extra inward shift on
// the distant shoulder so the far lane is narrower in perspective.
// Asphalt and lane bands are filled BETWEEN these exact same boundaries.
const ROAD_LINE_SHIFT_Y = 12;
const FAR_EDGE_EXTRA_INSET_Y = 26;
const ROAD_TOP_LINE_Y = STAND_Y + ROAD_DROP_Y +
  ROAD_LINE_SHIFT_Y + FAR_EDGE_EXTRA_INSET_Y;
const ROAD_BOTTOM_LINE_Y = ROAD_BOTTOM + ROAD_DROP_Y + ROAD_LINE_SHIFT_Y;
const ROAD_DIVIDER_LINE_YS = [233, 308, 383].map(y =>
  y + ROAD_DROP_Y + ROAD_LINE_SHIFT_Y
);
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

// Venue modules: source PNGs share the same bottom-aligned barrier baseline.
// Width and overlap are specified in the opening preview's SCREEN pixels.
const STAND_KEYS = [
  'fourLaneStandLeft', 'fourLaneStandMid', 'fourLaneStandRight',
];
const STAND_PREVIEW_PIECE_WIDTH = 495;
const STAND_PREVIEW_OVERLAP = 32;
const STAND_PREVIEW_START_X = 360;
const STAND_BASE_GAP = 3; // bottom of concrete, just above top white line
// Starting crowd stays LEFT / MIDDLE / RIGHT. At the finish, eight middle
// pieces produce LEFT / MIDDLE x8 / RIGHT (+5 middles over R439).
const FINISH_STAND_MIDDLES = 8;
const FINISH_STAND_DISTANCE_M = FOUR_LANE_TEST_DISTANCE_M;
const SKYLINE_PARALLAX = 0.16;
const SKYLINE_WORLD_WIDTH = 4096;
const SKYLINE_SCALE_UP = 1.5;
const SKYLINE_MIN_WORLD_HEIGHT = 730;
// Phaser-drawn floodlit chain-link fence on concrete safety barriers.
const FENCE_TOP_Y = 134;
const FENCE_CONCRETE_HEIGHT = 84; // 2x R439, base stays at y=315
const FENCE_BASE_Y = ROAD_TOP_LINE_Y - STAND_BASE_GAP;
const FENCE_CONCRETE_TOP_Y = FENCE_BASE_Y - FENCE_CONCRETE_HEIGHT;
const FENCE_POST_INTERVAL = 112;
const FENCE_MESH_STEP = 20;
// Lower foreground spectator strip: three sections at the start and exactly
// the same section count as the long grandstand at the finish.
const FRONT_CROWD_PREVIEW_WIDTH = 1100;
const FRONT_CROWD_PREVIEW_OVERLAP = 70;
const FRONT_CROWD_PREVIEW_START_X = -25;
// The nearest white lane ends at y=652. Keep the spectator heads LOWER than
// the nearest car; the backing wall then continues down beneath the image.
const FRONT_CROWD_BASE_Y = ROAD_BOTTOM_LINE_Y + 180;
const FRONT_WALL_TOP_Y = FRONT_CROWD_BASE_Y - 28;
const FRONT_WALL_BOTTOM_Y = 1900;
// Between foreground crowd sets, the mesh starts fully BELOW the asphalt.
const FRONT_FENCE_TOP_Y = ROAD_BOTTOM_LINE_Y + 14;
const FRONT_FENCE_CONCRETE_TOP_Y = ROAD_BOTTOM_LINE_Y + 90;
const FRONT_FENCE_POST_SPACING = 112;
const FRONT_FENCE_MESH_SIZE = 18;
// Physical trackside Christmas tree only. The redundant fixed-screen light
// sequence and live standings box remain removed.
const START_TREE_OFFSET_X = 78;
const START_TREE_BASE_Y = ROAD_TOP_LINE_Y;
const START_TREE_PANEL_WIDTH = 54;
const START_TREE_PANEL_HEIGHT = 124;

export default class FourLaneTestScene extends RaceScene {
  constructor() {
    super('FourLaneTestScene');
  }

  init(data = {}) {
    this.proCup = data.mode === 'PRO_CUP';
    const circuit = this.registry.get('proCircuit') || {};
    this.proTournament = this.proCup ? circuit.activeTournament : null;
    this.proHeat = this.proCup ? getPlayerProHeat(this.proTournament) : null;
    const selected = this.proCup ? this.proTournament?.carId : this.registry.get('selectedCarId');
    this.playerCarId = cars[selected] ? selected : 'ae86';
    const candidates = ['evo6', 'r34', 'rx7fd', 's2000', 'r32', 'jza80']
      .filter(id => Boolean(cars[id]));
    this.aiEntrants = this.proHeat
      ? this.proHeat.entrants
        .filter(id => id !== 'player:driver')
        .map(id => this.proTournament.entrants.find(r => r.id === id))
      : [];
    this.aiCarIds = this.aiEntrants.length === 3
      ? this.aiEntrants.map(e => {
          const available = candidates.filter(id => id !== this.playerCarId);
          return available[proCupHash(this.proTournament.id + e.id) % available.length];
        })
      : candidates.filter(id => id !== this.playerCarId).slice(0, 3);
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
    if (this.proCup) {
      const visual = characters[this.registry.get('playerCharacterId')]?.visual;
      if (visual) {
        loadImage(visual.spriteKey, getCharacterAssetUrl(visual.path));
        loadImage(visual.winSpriteKey, getCharacterAssetUrl(visual.winPath));
      }
    }
    // Dev-only venue foreground: loaded only when four-wide tester opens.
    loadImage('fourLaneStartComplex', 'assets/CentralTokyo/dragstrip_complex_night.png');
    loadImage('fourLaneStandLeft', 'assets/CentralTokyo/dragstrip_standleft_night.png');
    // The uploaded filename is "standmid", not "standmiddle".
    loadImage('fourLaneStandMid', 'assets/CentralTokyo/dragstrip_standmid_night.png');
    loadImage('fourLaneStandRight', 'assets/CentralTokyo/dragstrip_standright_night.png');
    loadImage('fourLaneFrontCrowd', 'assets/CentralTokyo/dragstrip_frontcrowd_night.png');
    loadImage('fourLaneShinjukuNight', 'assets/Race/Skylines/skyline_shinjuku_night.webp');
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
    const access = getProCircuitAccess(this.registry);
    if (this.proCup) {
      const owned = this.registry.get('ownedCarIds') || [];
      if (!access.unlocked || !this.proHeat ||
          !owned.includes(this.playerCarId) ||
          this.registry.get('competitionState')?.active) {
        this.returnToDrag();
        return;
      }
    } else if (!isArkonDen(this.registry)) {
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
      id: this.proCup ? 'player:driver' : 'player', lane: 1, label: 'YOU', carId: this.playerCarId,
      carState: this.playerState, carLabel: cars[this.playerCarId].shortName,
      vehicle: player, ai: null, config: playerConfig,
      paint: getCarPaintColor(this.playerState), finishSeconds: null,
      disqualified: false,
    }];
    this.aiCarIds.forEach((id, index) => {
      const entrant = this.aiEntrants[index];
      const rating = entrant ? Math.max(2, Math.min(5,
        Math.round(3 + (entrant.rating - 1400) / 250))) : index === 2 ? 5 : 4;
      const state = createRivalBuildState(cars[id], rating, {
        seed: this.proCup ? this.proHeat.id + ':' + entrant.id : 'four-lane-dev:' + id + ':' + index,
        raceType: 'Standing Start',
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
        id: entrant?.id || 'ai-' + (index + 1), lane: index + 2,
        label: entrant ? entrant.name.toUpperCase().slice(0, 16) : 'RIVAL ' + (index + 1), carId: id,
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
    // Shinjuku behind the stands, but in front of the generated venue wall.
    // The skyline ends above the outermost road line and never covers asphalt.
    this.skylineSprites = this.createShinjukuSkyline();
    this.standSets = [
      this.createStandSet(0),
      this.createStandSet(FINISH_STAND_DISTANCE_M),
    ].filter(Boolean);
    this.roadsideFence = this.add.graphics().setDepth(0.8);
    this.frontCrowdSets = this.standSets.map(set =>
      this.createFrontCrowdSet(set.distanceM, set.images.length)
    ).filter(Boolean);
    this.frontGapFence = this.add.graphics().setDepth(18.1);
    this.frontConcreteWall = this.add.graphics().setDepth(18.2);
    this.startTree = this.add.graphics().setDepth(2.5);
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
      this.trackG,
      ...this.skylineSprites,
      this.roadsideFence,
      ...this.standSets.flatMap(set => set.images),
      ...(this.complexArt ? [this.complexArt] : []),
      this.startTree,
      this.trackFX, ...carObjects,
      this.frontGapFence,
      this.frontConcreteWall,
      ...this.frontCrowdSets.flatMap(set => set.images),
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
    this.countdownActive = false;
    this.countdownClock = 0;
    this.falseStart = false;
    this.raceStarted = false;
     this.zooming = false;
    this.finished = false;
    this.resultsShown = false;
    this.firstFinishClock = null;
    this.finishCameraPx = null;
    this.finishTransitioning = false;
    this.cameraPx = fourLaneCameraX(0);

    this.header = this.add.text(780, 22, this.proCup
      ? 'TOKYO FOUR-WIDE OPEN  //  ' + FOUR_WIDE_CUP.stageNames[this.proTournament.stage]
      : '4-LANE TEST', {
      fontFamily: PIXEL, fontSize: '10px', color: '#d7f4ff',
      backgroundColor: '#061019dd', padding: { x: 13, y: 6 },
    }).setDepth(48).setOrigin(0.5).setScrollFactor(0);
    this.subheader = this.add.text(
      780, 113, this.proCup
        ? 'TOP TWO ADVANCE  //  1/4 MILE'
        : 'FOUR LANES  //  NO STAKES', {
        fontFamily: PIXEL, fontSize: '8px', color: '#b0deeb',
        backgroundColor: '#07111dcc', padding: { x: 10, y: 5 },
      }
    ).setDepth(48).setOrigin(0.5).setScrollFactor(0);

    this.startButton = this.makeButton(780, 64, 245,
      this.proCup ? 'START HEAT' : 'START 4-WIDE', 0x52dbd1,
      () => this.startFourLaneRace());
    this.exitButton = this.makeButton(150, 64, 215, 'BACK TO DRAG', 0xffa9b3,
      () => this.returnToDrag());

    this.renderTrack(0);
    if (this.proCup && this.proTournament?.stage === 0 &&
        !this.proTournament?.briefingSeen) {
      this.showTournamentBriefing();
    }
    finishSceneLoading('READY FOR FOUR-WIDE TEST');
  }

  showTournamentBriefing() {
    if (!this.proCup || !this.proHeat || this.briefingOpen) return;
    this.briefingOpen = true;
    this.controls.enabled = false;
    this.startButton.bg.disableInteractive();
    this.exitButton.bg.disableInteractive();

    const overlay = [];
    const place = obj => {
      overlay.push(obj);
      return obj;
    };
    const text = (x, y, value, fontSize, color = '#eafaff', options = {}) =>
      place(this.add.text(x, y, value, {
        fontFamily: PIXEL,
        fontSize: fontSize + 'px',
        color,
        ...options,
      }).setDepth(112).setScrollFactor(0));
    place(this.add.rectangle(780, 360, WIDTH, HEIGHT, 0x020810, 0.83)
      .setDepth(109).setScrollFactor(0).setInteractive());
    place(this.add.rectangle(780, 360, 1010, 564, 0x091b2b, 0.99)
      .setStrokeStyle(3, 0x5de3f0, 1)
      .setDepth(110).setScrollFactor(0));

    text(780, 111, 'TOKYO FOUR-WIDE OPEN', 18, '#e9fbff').setOrigin(0.5);
    text(780, 153, '16 DRIVERS  /  4 CARS PER HEAT  /  QUARTER MILE', 9, '#a1dbe9')
      .setOrigin(0.5);
    place(this.add.rectangle(780, 181, 876, 2, 0x33576a, 1)
      .setDepth(111).setScrollFactor(0));

    const stages = [
      'QUALIFYING     4 HEATS OF FOUR      TOP TWO ADVANCE',
      'SEMIFINALS    2 HEATS OF FOUR      TOP TWO ADVANCE',
      'FINAL         1 HEAT OF FOUR      FINISH 1ST-4TH',
    ];
    stages.forEach((line, i) => {
      text(346, 211 + 36 * i, line, 8, i === 0 ? '#7cf2e5' : '#e4f0fa');
    });
    text(344, 341, 'YOUR FIRST HEAT', 10, '#8df6e5');

    const rivals = this.runners.slice(1);
    rivals.forEach((runner, i) => {
      const label = runner.label + '   /   ' + runner.carLabel.toUpperCase();
      text(345, 375 + i * 31, (i + 1) + '.  ' + label, 9, '#f0f7fc');
    });
    text(347, 483,
      'ENTRY PAID  ¥' + FOUR_WIDE_CUP.entryFee.toLocaleString('en-US') +
      '     FIRST PRIZE  ¥' + FOUR_WIDE_CUP.prizeCash[0].toLocaleString('en-US'),
      8, '#ffd993');
    text(347, 513, 'SAVES BETWEEN HEATS  /  SAME CAR FOR THE EVENT',
      8, '#9ac7d6');

    const confirm = place(this.add.rectangle(780, 581, 356, 44, 0x124249, 1)
      .setStrokeStyle(2, 0x6af0e0, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(113).setScrollFactor(0));
    text(780, 581, 'READY TO RACE', 11, '#f0fffe')
      .setOrigin(0.5).setDepth(114);
    confirm.on('pointerdown', () => {
      if (!this.briefingOpen) return;
      const state = this.registry.get('proCircuit');
      if (state?.activeTournament?.id === this.proTournament.id) {
        const tournament = { ...state.activeTournament, briefingSeen: true };
        this.registry.set('proCircuit', { ...state, activeTournament: tournament });
        this.proTournament = tournament;
        saveSessionState(this.registry);
      }
      overlay.forEach(obj => obj.destroy());
      this.briefingOpen = false;
      this.controls.enabled = true;
      this.startButton.bg.setInteractive({ useHandCursor: true });
      this.exitButton.bg.setInteractive({ useHandCursor: true });
    });
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

  prepareStandTexture(key) {
    // The authored grandstand PNGs may contain a white preview backdrop and
    // canvas padding. Remove ONLY edge-connected white, retaining white logos,
    // floodlight bulbs and spectator clothing, then trim empty margins.
    const cleanKey = key + 'SceneTrim';
    if (this.textures.exists(cleanKey)) return cleanKey;
    const source = this.textures.get(key)?.getSourceImage();
    if (!source) return key;
    const w = source.width, h = source.height;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return key;
    ctx.drawImage(source, 0, 0);
    const frame = ctx.getImageData(0, 0, w, h);
    const px = frame.data;
    const isWhite = p => {
      const a = p * 4;
      return px[a + 3] > 0 &&
        Math.min(px[a], px[a + 1], px[a + 2]) > 235 &&
        Math.max(px[a], px[a + 1], px[a + 2]) -
          Math.min(px[a], px[a + 1], px[a + 2]) < 16;
    };
    // Flood-fill only if the actual outside edge looks like white paper.
    if ([0, w - 1, (h - 1) * w, h * w - 1].some(isWhite)) {
      const seen = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      let head = 0, tail = 0;
      const offer = p => {
        if (p < 0 || p >= w * h || seen[p] || !isWhite(p)) return;
        seen[p] = 1;
        queue[tail++] = p;
      };
      for (let x = 0; x < w; x++) {
        offer(x); offer((h - 1) * w + x);
      }
      for (let y = 0; y < h; y++) {
        offer(y * w); offer(y * w + w - 1);
      }
      while (head < tail) {
        const p = queue[head++];
        px[p * 4 + 3] = 0;
        const x = p % w;
        if (x > 0) offer(p - 1);
        if (x + 1 < w) offer(p + 1);
        if (p >= w) offer(p - w);
        if (p < (h - 1) * w) offer(p + w);
      }
      ctx.putImageData(frame, 0, 0);
    }
    // Trim to actual drawn alpha so all concrete barrier bases meet the same
    // world-space top road boundary when anchored at image origin (0, 1).
    let left = w, top = h, right = -1, bottom = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      if (px[p + 3] < 8) continue;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    if (right < left) return key;
    left = Math.max(0, left - 1); top = Math.max(0, top - 1);
    right = Math.min(w - 1, right + 1);
    bottom = Math.min(h - 1, bottom + 1);
    const trimmed = document.createElement('canvas');
    trimmed.width = right - left + 1;
    trimmed.height = bottom - top + 1;
    trimmed.getContext('2d').drawImage(canvas, left, top,
      trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
    this.textures.addCanvas(cleanKey, trimmed);
    return cleanKey;
  }

  createShinjukuSkyline() {
    if (!this.textures.exists('fourLaneShinjukuNight')) return [];
    // Use a larger aspect-correct panorama. At minimum it reaches ABOVE
    // screen y=0 even in the 52% preview; its lower edge stays at the road.
    const source = this.textures.get('fourLaneShinjukuNight').getSourceImage();
    const baseHeight = SKYLINE_WORLD_WIDTH * source.height / source.width;
    const scale = Math.max(SKYLINE_SCALE_UP,
      SKYLINE_MIN_WORLD_HEIGHT / baseHeight);
    this.skylineWorldWidth = SKYLINE_WORLD_WIDTH * scale;
    const skylineHeight = baseHeight * scale;
    return [-1, 0, 1].map(() =>
      this.add.image(0, ROAD_TOP_LINE_Y - STAND_BASE_GAP, 'fourLaneShinjukuNight')
        .setOrigin(0, 1).setDepth(0.4)
        .setDisplaySize(this.skylineWorldWidth, skylineHeight)
        .setAlpha(0.78)
    );
  }

  createStandSet(distanceM) {
    if (!STAND_KEYS.every(key => this.textures.exists(key))) return null;
    const imageKeys = STAND_KEYS.map(key => this.prepareStandTexture(key));
    // A single left and right end-cap at both venues. Only the finish uses
    // eight middle sections; every section reuses the same cached texture.
    if (distanceM > 0) {
      imageKeys.splice(1, 1, ...Array(FINISH_STAND_MIDDLES).fill(imageKeys[1]));
    }
    // Scale all images with one shared pixel scale, so the bottom
    // concrete walls and crowd proportions line up even for different crops.
    const midWidth = this.textures.get(imageKeys[1]).getSourceImage().width;
    const worldScale = (STAND_PREVIEW_PIECE_WIDTH / PREVIEW_ZOOM) / midWidth;
    const rootPreviewX = TRACK_PIVOT_X * (1 - PREVIEW_ZOOM) + TRACK_PAN_X;
    const initialWorldX = (STAND_PREVIEW_START_X - rootPreviewX) / PREVIEW_ZOOM;
    const overlap = STAND_PREVIEW_OVERLAP / PREVIEW_ZOOM;
    const images = [];
    let x = 0;
    imageKeys.forEach(key => {
      const img = this.add.image(0, 0, key).setOrigin(0, 1)
        .setScale(worldScale).setDepth(1);
      // Full-height common barrier baseline; each module overlaps at joins.
      img.standLocalX = x;
      img.setPosition(x, ROAD_TOP_LINE_Y - STAND_BASE_GAP);
      images.push(img);
      x += img.width * worldScale - overlap;
    });
    // x includes one final unused overlap; compensate to obtain right edge.
    const worldWidth = x + overlap;
    return { images, initialWorldX, distanceM, worldWidth };
  }

  createFrontCrowdSet(distanceM, count) {
    if (!this.textures.exists('fourLaneFrontCrowd')) return null;
    // The asset is transparent. Trimming its empty canvas ensures the
    // spectator heads are measured from the actual visible silhouettes.
    const key = this.prepareStandTexture('fourLaneFrontCrowd');
    const source = this.textures.get(key).getSourceImage();
    // R442: twice the R441 scale in both axes. The bottom-origin y stays
    // untouched, so the heads become 2x taller without moving the baseline.
    const scale = (FRONT_CROWD_PREVIEW_WIDTH / PREVIEW_ZOOM) / source.width;
    const rootPreviewX = TRACK_PIVOT_X * (1 - PREVIEW_ZOOM) + TRACK_PAN_X;
    const initialWorldX = (FRONT_CROWD_PREVIEW_START_X - rootPreviewX) / PREVIEW_ZOOM;
    const overlap = FRONT_CROWD_PREVIEW_OVERLAP / PREVIEW_ZOOM;
    const images = [];
    let x = 0;
    for (let i = 0; i < count; i++) {
      const img = this.add.image(0, FRONT_CROWD_BASE_Y, key)
        .setOrigin(0, 1).setScale(scale).setDepth(19);
      img.crowdLocalX = x;
      images.push(img);
      x += img.width * scale - overlap;
    }
    return { images, distanceM, initialWorldX, worldWidth: x + overlap };
  }

  drawFrontCrowdSurfaces(cameraTravel) {
    const wall = this.frontConcreteWall;
    const fence = this.frontGapFence;
    if (!wall || !fence || !this.frontCrowdSets?.length) return;
    wall.clear();
    fence.clear();
    const zoom = Math.max(0.01, this.trackRoot.scaleX);
    const screenToWorld = screenX =>
      (screenX - this.trackRoot.x) / zoom + cameraTravel;
    const viewLeft = screenToWorld(-120);
    const viewRight = screenToWorld(WIDTH + 120);

    const visiblePart = (fromWorld, toWorld) => {
      const start = Math.max(fromWorld, viewLeft);
      const end = Math.min(toWorld, viewRight);
      return end > start ? [start - cameraTravel, end - cameraTravel,
        start, end] : null;
    };
    // Behind all foreground silhouettes, these tall panels continue to the
    // bottom of the screen at both the 52% preview and full racing zoom.
    for (const set of this.frontCrowdSets) {
      const worldX = set.initialWorldX +
        set.distanceM * FOUR_LANE_TEST_PX_PER_M;
      const clip = visiblePart(worldX, worldX + set.worldWidth);
      if (!clip) continue;
      const [left, right, start, end] = clip;
      const w = right - left;
      wall.fillStyle(0x141b25, 1).fillRect(left, FRONT_WALL_TOP_Y,
        w, FRONT_WALL_BOTTOM_Y - FRONT_WALL_TOP_Y);
      wall.fillStyle(0x34414d, 1).fillRect(left, FRONT_WALL_TOP_Y, w, 7);
      wall.fillStyle(0x56616a, 0.68).fillRect(left, FRONT_WALL_TOP_Y + 6, w, 2);
      const first = Math.floor(start / 126);
      const last = Math.ceil(end / 126);
      for (let i = first; i <= last; i++) {
        const x = i * 126 - cameraTravel;
        if (x < left || x > right) continue;
        wall.fillStyle(0x080f18, 0.85).fillRect(x, FRONT_WALL_TOP_Y + 9,
          5, FRONT_WALL_BOTTOM_Y - FRONT_WALL_TOP_Y - 9);
        wall.fillStyle(0x7d8a94, 0.34).fillRect(x + 15,
          FRONT_WALL_TOP_Y + 16, 4, 4);
      }
    }

    // Continuous low fencing + concrete for ONLY the clear strip between the
    // near spectator sets. The fence top is 14px below the white road edge.
    if (this.frontCrowdSets.length < 2) return;
    const startSet = this.frontCrowdSets[0];
    const finishSet = this.frontCrowdSets[1];
    const fromWorld = startSet.initialWorldX + startSet.worldWidth;
    const toWorld = finishSet.initialWorldX +
      finishSet.distanceM * FOUR_LANE_TEST_PX_PER_M;
    const clip = visiblePart(fromWorld, toWorld);
    if (!clip) return;
    const [left, right, firstVisible, lastVisible] = clip;
    const width = right - left;

    fence.fillStyle(0x27313b, 1).fillRect(left, FRONT_FENCE_CONCRETE_TOP_Y,
      width, FRONT_WALL_BOTTOM_Y - FRONT_FENCE_CONCRETE_TOP_Y);
    fence.fillStyle(0x7a8893, 1).fillRect(left, FRONT_FENCE_CONCRETE_TOP_Y,
      width, 6);
    fence.fillStyle(0x141e29, 1).fillRect(left,
      FRONT_FENCE_CONCRETE_TOP_Y + 12, width, 5);
    const firstPost = Math.floor(firstVisible / FRONT_FENCE_POST_SPACING);
    const lastPost = Math.ceil(lastVisible / FRONT_FENCE_POST_SPACING);
    for (let i = firstPost; i <= lastPost; i++) {
      const x = i * FRONT_FENCE_POST_SPACING - cameraTravel;
      if (x < left - 4 || x > right + 4) continue;
      fence.fillStyle(0x0d151f, 0.92).fillRect(x - 2,
        FRONT_FENCE_CONCRETE_TOP_Y + 7, 4,
        FRONT_WALL_BOTTOM_Y - FRONT_FENCE_CONCRETE_TOP_Y - 7);
      if (i % 3 === 0) fence.fillStyle(0xe6ba67, 0.85)
        .fillRect(x + 18, FRONT_FENCE_CONCRETE_TOP_Y + 23, 16, 4);
    }

    // Mesh is drawn with limited visible extents, not a 28,000px world strip.
    fence.lineStyle(1, 0x9db3c0, 0.18).beginPath();
    for (let y = FRONT_FENCE_TOP_Y + 9;
      y < FRONT_FENCE_CONCRETE_TOP_Y - 9; y += FRONT_FENCE_MESH_SIZE) {
      const meshPeriod = FRONT_FENCE_MESH_SIZE * 2;
      for (let worldX = Math.floor(firstVisible / meshPeriod) * meshPeriod;
        worldX <= lastVisible; worldX += meshPeriod) {
        const x = worldX - cameraTravel;
        if (x < left + 8 || x > right - 8) continue;
        fence.moveTo(x - 8, y).lineTo(x, y + 8)
          .lineTo(x + 8, y).lineTo(x, y - 8);
      }
    }
    fence.strokePath();
    fence.fillStyle(0x283b4b, 1).fillRect(left, FRONT_FENCE_TOP_Y,
      width, 5);
    fence.fillStyle(0x8da1ad, 0.86).fillRect(left, FRONT_FENCE_TOP_Y,
      width, 2);
    fence.fillStyle(0x233543, 1).fillRect(left,
      FRONT_FENCE_CONCRETE_TOP_Y - 4, width, 4);
    for (let i = firstPost; i <= lastPost; i++) {
      const x = i * FRONT_FENCE_POST_SPACING - cameraTravel;
      if (x < left - 5 || x > right + 5) continue;
      fence.fillStyle(0x192a37, 1).fillRect(x - 3, FRONT_FENCE_TOP_Y,
        6, FRONT_FENCE_CONCRETE_TOP_Y - FRONT_FENCE_TOP_Y);
      fence.fillStyle(0x8da1ad, 0.72).fillRect(x - 2, FRONT_FENCE_TOP_Y,
        2, FRONT_FENCE_CONCRETE_TOP_Y - FRONT_FENCE_TOP_Y);
      fence.fillStyle(0xa5b8c4, 0.86).fillCircle(x, FRONT_FENCE_TOP_Y, 4);
    }
  }

  positionTrackside() {
    if (!this.trackRoot) return;
    const cameraTravel = this.cameraPx == null ? 0 :
      Math.max(0, this.cameraPx - fourLaneCameraX(0));
    // A modest, slower parallax keeps the Shinjuku skyline distant.
    const skylineWidth = this.skylineWorldWidth || SKYLINE_WORLD_WIDTH;
    const skylinePhase = (cameraTravel * SKYLINE_PARALLAX) % skylineWidth;
    this.skylineSprites.forEach((image, i) => {
      image.x = (i - 1) * skylineWidth - skylinePhase;
    });
    // World-anchored scenery: the finish group returns as we approach 402 m.
    this.standSets.forEach(set => {
      const deltaX = set.initialWorldX +
        set.distanceM * FOUR_LANE_TEST_PX_PER_M - cameraTravel;
      set.images.forEach(image => {
        // Preserve each image's local join position while translating the set.
        image.x = deltaX + image.standLocalX;
      });
    });
    this.drawRoadsideFence(cameraTravel);
    this.frontCrowdSets.forEach(set => {
      const baseX = set.initialWorldX +
        set.distanceM * FOUR_LANE_TEST_PX_PER_M - cameraTravel;
      set.images.forEach(image => { image.x = baseX + image.crowdLocalX; });
    });
    this.drawFrontCrowdSurfaces(cameraTravel);
  }

  drawRoadsideFence(cameraTravel) {
    const g = this.roadsideFence;
    if (!g) return;
    g.clear();
    if (this.standSets.length < 2) return;

    // A single bounded world interval between the two grandstand groups.
    // The start and finish artworks cover the first/last few fence panels.
    const start = this.standSets[0];
    const finish = this.standSets[1];
    const joinOverlap = STAND_PREVIEW_OVERLAP / PREVIEW_ZOOM * 0.5;
    const worldStart = start.initialWorldX + start.worldWidth - joinOverlap;
    const worldEnd = finish.initialWorldX +
      finish.distanceM * FOUR_LANE_TEST_PX_PER_M + joinOverlap;
    if (worldEnd <= worldStart) return;

    // Convert visible SCREEN area back into track-root coordinates, then
    // render only these segments. No 28,000px-wide Graphics mesh/allocation.
    const zoom = Math.max(0.01, this.trackRoot.scaleX);
    const viewStart = (-this.trackRoot.x) / zoom + cameraTravel - 160;
    const viewEnd = (WIDTH - this.trackRoot.x) / zoom + cameraTravel + 160;
    const minWorld = Math.max(worldStart, viewStart);
    const maxWorld = Math.min(worldEnd, viewEnd);
    if (maxWorld <= minWorld) return;
    const left = minWorld - cameraTravel;
    const right = maxWorld - cameraTravel;
    const width = right - left;

    // Concrete trackside bollards, adapted from the normal race guardrail
    // palette but shaped as discrete bolted modular panels.
    g.fillStyle(0x333d48, 1).fillRect(left, FENCE_CONCRETE_TOP_Y,
      width, FENCE_CONCRETE_HEIGHT);
    g.fillStyle(0x7a8791, 1).fillRect(left, FENCE_CONCRETE_TOP_Y, width, 5);
    g.fillStyle(0x161f28, 0.96).fillRect(left,
      FENCE_BASE_Y - 6, width, 6);
    g.fillStyle(0xabb4bc, 0.3).fillRect(left,
      FENCE_CONCRETE_TOP_Y + 8, width, 2);
    const firstPanel = Math.floor(minWorld / FENCE_POST_INTERVAL);
    const lastPanel = Math.ceil(maxWorld / FENCE_POST_INTERVAL);
    for (let i = firstPanel; i <= lastPanel; i++) {
      const x = i * FENCE_POST_INTERVAL - cameraTravel;
      if (x < left - 3 || x > right + 3) continue;
      g.fillStyle(0x1a242e, 0.86).fillRect(x - 2,
        FENCE_CONCRETE_TOP_Y + 5, 4, FENCE_CONCRETE_HEIGHT - 11);
      g.fillStyle(0x9fabb5, 0.7).fillRect(x + 9,
        FENCE_CONCRETE_TOP_Y + 14, 3, 3);
      if (i % 3 === 0) {
        g.fillStyle(0xe4ae61, 0.86).fillRect(x + 20,
          FENCE_BASE_Y - 16, 16, 4);
      }
    }

    // Taller-than-street-racing fence; diagonal open mesh lets the enlarged
    // Shinjuku night skyline remain visible between structural elements.
    const meshBottom = FENCE_CONCRETE_TOP_Y;
    g.lineStyle(1, 0x9bb3c0, 0.18);
    g.beginPath();
    for (let y = FENCE_TOP_Y + 9; y < meshBottom - 8; y += FENCE_MESH_STEP) {
      for (let worldX = Math.floor(minWorld / (FENCE_MESH_STEP * 2)) *
          FENCE_MESH_STEP * 2; worldX <= maxWorld; worldX += FENCE_MESH_STEP * 2) {
        const x = worldX - cameraTravel;
        if (x < left + 8 || x > right - 8) continue;
        g.moveTo(x - 8, y);
        g.lineTo(x, y + 9);
        g.lineTo(x + 8, y);
        g.lineTo(x, y - 9);
      }
    }
    g.strokePath();
    // Fence posts and rails align to the concrete's repeat grid.
    g.fillStyle(0x263b4d, 0.95).fillRect(left, FENCE_TOP_Y, width, 5);
    g.fillStyle(0x718899, 0.87).fillRect(left, FENCE_TOP_Y, width, 2);
    g.fillStyle(0x304554, 0.86).fillRect(left, meshBottom - 4, width, 5);
    for (let i = firstPanel; i <= lastPanel; i++) {
      const x = i * FENCE_POST_INTERVAL - cameraTravel;
      if (x < left - 4 || x > right + 4) continue;
      g.fillStyle(0x1b2c3a, 0.98).fillRect(x - 3, FENCE_TOP_Y, 6,
        meshBottom - FENCE_TOP_Y);
      g.fillStyle(0x8097a8, 0.8).fillRect(x - 2, FENCE_TOP_Y, 2,
        meshBottom - FENCE_TOP_Y);
      g.fillStyle(0xa9b9c4, 0.9).fillCircle(x, FENCE_TOP_Y, 4);
    }
  }

  drawStartTree() {
    const g = this.startTree;
    if (!g || !this.runners?.length) return;
    g.clear();
    // Use exactly the same world-space camera and start-line calculation as
    // the road's actual starting stripe; no drifting screen overlay.
    const playerNose = this.runners[0].visual?.noseOffsetPx || 110;
    const startX = fourLaneCarX(0, this.cameraPx, 0, playerNose);
    const x = startX + START_TREE_OFFSET_X;
    if (x < -90 || x > TRACK_DRAW_RIGHT + 90) return;

    const phase = this.racePhase();
    const lamps = fourLaneTreeLights(phase, this.falseStart);
    const baseY = START_TREE_BASE_Y;
    const panelTop = baseY - START_TREE_PANEL_HEIGHT - 18;
    const panelLeft = x - START_TREE_PANEL_WIDTH / 2;

    // Steel baseplate and anchored stem.
    g.fillStyle(0x131b25, 1)
      .fillRect(x - 22, baseY - 8, 44, 8);
    g.fillStyle(0x697d89, 0.9)
      .fillRect(x - 17, baseY - 8, 34, 2);
    g.fillStyle(0x172431, 1)
      .fillRect(x - 5, panelTop - 4, 10, baseY - panelTop);
    g.fillStyle(0x617887, 0.92)
      .fillRect(x - 4, panelTop - 4, 2, baseY - panelTop);

    // Two illuminated columns evoke a professional drag strip tree. One
    // light assembly serves the dev tester's four simultaneous lanes.
    g.fillStyle(0x080f18, 1)
      .fillRoundedRect(panelLeft - 3, panelTop - 3,
        START_TREE_PANEL_WIDTH + 6, START_TREE_PANEL_HEIGHT + 6, 5);
    g.fillStyle(0x25333e, 1)
      .fillRoundedRect(panelLeft, panelTop,
        START_TREE_PANEL_WIDTH, START_TREE_PANEL_HEIGHT, 4);
    g.lineStyle(2, 0x91a8b8, 0.66)
      .strokeRoundedRect(panelLeft, panelTop,
        START_TREE_PANEL_WIDTH, START_TREE_PANEL_HEIGHT, 4);

    const rows = [
      { offset: 13, color: 0xd9f5ff, on: lamps.preStage },
      { offset: 29, color: 0xf7fbff, on: lamps.stage },
      { offset: 47, color: 0xffb94b, on: lamps.ambers[0] },
      { offset: 63, color: 0xffb94b, on: lamps.ambers[1] },
      { offset: 79, color: 0xffb94b, on: lamps.ambers[2] },
      { offset: 98, color: 0x61fda1, on: lamps.green },
      { offset: 114, color: 0xff5167, on: lamps.red },
    ];
    for (const row of rows) {
      const cy = panelTop + row.offset;
      for (const dx of [-11, 11]) {
        g.fillStyle(0x03080d, 1).fillCircle(x + dx, cy, 7.7);
        if (row.on) {
          g.fillStyle(row.color, 0.19).fillCircle(x + dx, cy, 10);
          g.fillStyle(row.color, 1).fillCircle(x + dx, cy, 5.2);
          g.fillStyle(0xffffff, 0.72).fillCircle(x + dx - 1.1, cy - 1.2, 2);
        } else {
          g.fillStyle(row.color, 0.14).fillCircle(x + dx, cy, 4.5);
        }
      }
    }
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
    this.exitButton?.bg?.disableInteractive().setVisible(false);
    this.exitButton?.text?.setVisible(false);
    this.configureZoomFocus();
    // All pre-race overlay copy fades away before green. Track, tree and HUD remain.
    this.tweens.add({
      targets: [this.header, this.subheader],
      alpha: 0, delay: 550, duration: 450,
    });
    this.tweens.addCounter({
      from: PREVIEW_ZOOM, to: 1, duration: 1250, ease: 'Sine.InOut',
      onUpdate: tween => this.setTrackZoom(tween.getValue()),
      onComplete: () => {
        this.setTrackZoom(1);
        this.zooming = false;
        // The same 3.3s pre-stage / amber / green timing as the original
        // physical tree (R440); no fixed-screen lights are reintroduced.
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
    if (!this.proCup && Phaser.Input.Keyboard.JustDown(this.controls.keys.restart)) {
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
        this.countdownActive = false;
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
        // Staged cars cannot creep during preview/zoom; a launch before
        // green is a genuine red-light disqualification.
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
    this.hud.update(livePlayer, this.falseStart ? 'RED LIGHT'
      : !this.raceStarted && this.proCup ? 'TOP TWO ADVANCE'
      : !this.raceStarted ? 'TAP START TO STAGE'
      : '');

    if (!this.finished) {
      const cue = getFourLaneFinishCue({
        now: this.raceClock,
        greenClock: this.greenClock,
        firstFinishClock: this.firstFinishClock,
        allFinished: this.runners.every(r => r.finishSeconds != null),
      });
      if (cue.showResults) this.beginFinishTransition();
    }
  }

  beginFinishTransition() {
    if (this.finishTransitioning || this.resultsShown) return;
    this.finishTransitioning = true;
    this.finished = true;
    this.controls.enabled = false;
    this.engineAudio?.fadeOut?.();
    this.hud?.status?.setText('');
    // RaceScene's cinematic pause: a tiny beat after the frozen camera
    // before the results panel takes over. No extra 10-second driving loop.
    this.time.delayedCall(160, () => {
      if (this.sys?.isActive?.() === false || this.resultsShown) return;
      this.showFourLaneResults();
    });
  }

  handleGearRequest(request) {
    if (!this.raceStarted || this.zooming || this.finished) return;
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

  renderTrack(dt) {
    const player = this.runners[0];
    const playerM = player.vehicle.positionM;
    const chaseCameraPx = fourLaneCameraX(playerM);
    const finishCue = getFourLaneFinishCue({
      now: this.raceClock,
      greenClock: this.greenClock,
      firstFinishClock: this.firstFinishClock,
      allFinished: this.runners.every(r => r.finishSeconds != null),
    });
    // Match RaceScene's finish choreography: follow briefly, then pin the
    // venue so all cars accelerate out of the camera and fly past the line.
    if (finishCue.lockCamera && this.finishCameraPx == null) {
      this.finishCameraPx = chaseCameraPx;
    }
    this.cameraPx = this.finishCameraPx ?? chaseCameraPx;
    this.positionComplexArt();
    this.positionTrackside();
    this.drawStartTree();
    const g = this.trackG;
    g.clear();
    // Close-up professional venue, not a distant city skyline.
    g.fillStyle(0x050c14).fillRect(TRACK_DRAW_LEFT, -140, TRACK_DRAW_WIDTH, HEIGHT + 280);
    g.fillStyle(0x0c2330).fillRect(TRACK_DRAW_LEFT, 0, TRACK_DRAW_WIDTH, STAND_Y);
    g.fillStyle(0x183240).fillRect(TRACK_DRAW_LEFT, 26, TRACK_DRAW_WIDTH, 35);
    // Venue wall now stops at the far white shoulder; asphalt is strictly
    // contained between the top and bottom white outer borders.
    g.fillStyle(0x091b26).fillRect(
      TRACK_DRAW_LEFT, 75, TRACK_DRAW_WIDTH, ROAD_TOP_LINE_Y - 75
    );
    const drift = (((this.cameraPx * 0.08) % 165) + 165) % 165;
    for (let x = -900 - drift; x < TRACK_DRAW_RIGHT; x += 165) {
      g.fillStyle(0x5e8496, 0.42).fillRect(x, 14, 4, 100);
      g.fillStyle(0x36d5e4, 0.30).fillRect(x + 12, 40, 82, 4);
      g.fillStyle(0xd9f6ff, 0.67).fillCircle(x + 60, 117, 3);
    }

    // Four perspective lanes. The far lane becomes 26px thinner than before,
    // while the three other divider lines move down by the same 12px.
    // Painting each band between adjacent white lines prevents stray grey
    // patches above the distant border or below the near border.
    const laneEdges = [
      ROAD_TOP_LINE_Y, ...ROAD_DIVIDER_LINE_YS, ROAD_BOTTOM_LINE_Y,
    ];
    for (let index = 0; index < 4; index++) {
      const top = laneEdges[index];
      const bottom = laneEdges[index + 1];
      g.fillStyle(index % 2 ? 0x252d35 : 0x222c34, 1)
        .fillRect(TRACK_DRAW_LEFT, top, TRACK_DRAW_WIDTH, bottom - top);
    }

    // Both outer shoulder lines are deliberately restrained.
    g.fillStyle(0x8ea8b7, 0.6)
      .fillRect(TRACK_DRAW_LEFT, ROAD_TOP_LINE_Y, TRACK_DRAW_WIDTH, 3);
    g.fillStyle(0xc2d5e0, 0.72)
      .fillRect(TRACK_DRAW_LEFT, ROAD_BOTTOM_LINE_Y - 2, TRACK_DRAW_WIDTH, 2);

    // Three interior dividers follow the new road geometry.
    for (const y of ROAD_DIVIDER_LINE_YS) {
      g.lineStyle(2, 0xc2d5e0, 0.48).beginPath()
        .moveTo(TRACK_DRAW_LEFT, y)
        .lineTo(TRACK_DRAW_RIGHT, y).strokePath();
    }
    const trackShift = (((this.cameraPx * 0.90) % 150) + 150) % 150;
    for (let x = -900 - trackShift; x < TRACK_DRAW_RIGHT; x += 150) {
      for (const y of ROAD_DIVIDER_LINE_YS) {
        g.fillStyle(0xe6eff2, 0.28).fillRect(x, y - 3, 54, 2);
      }
      g.fillStyle(0x58b6c4, 0.40).fillRect(x + 12, 118, 4, 10);
    }
    // Start and finish mark are actual world-space positions.
    const front = player.visual.noseOffsetPx;
    const startX = fourLaneCarX(0, this.cameraPx, 0, front);
    const finishX = fourLaneCarX(FOUR_LANE_TEST_DISTANCE_M, this.cameraPx, 0, front);
    if (startX > -30 && startX < WIDTH + 30) {
      g.fillStyle(0xffffff, 0.7).fillRect(
        startX, ROAD_TOP_LINE_Y + 5, 4, ROAD_BOTTOM_LINE_Y - ROAD_TOP_LINE_Y - 10
      );
    }
    if (finishX > -30 && finishX < WIDTH + 30) {
      const finishStartY = ROAD_TOP_LINE_Y + 5;
      const finishEndY = ROAD_BOTTOM_LINE_Y - 5;
      for (let y = finishStartY; y < finishEndY; y += 16) {
        const cellH = Math.min(16, finishEndY - y);
        const light = ((y - finishStartY) / 16) % 2 === 0;
        g.fillStyle(light ? 0xffffff : 0x15202a, 0.92)
          .fillRect(finishX, y, 14, cellH);
        g.fillStyle(light ? 0x15202a : 0xffffff, 0.92)
          .fillRect(finishX + 14, y, 14, cellH);
      }
    }
    // The lower shoulder starts outside the white line, not inside the road.
    g.fillStyle(0x121b23).fillRect(
      TRACK_DRAW_LEFT, ROAD_BOTTOM_LINE_Y + 2, TRACK_DRAW_WIDTH, 26
    );
    g.fillStyle(0x68adba, 0.24).fillRect(
      TRACK_DRAW_LEFT, ROAD_BOTTOM_LINE_Y + 2, TRACK_DRAW_WIDTH, 3
    );

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
    const own = standings.find(r => r.id === (this.proCup ? 'player:driver' : 'player'));
    let outcome = null;
    if (this.proCup) {
      try {
        outcome = settleFourWideHeat(
          this.registry.get('proCircuit'),
          this.runners.map(r => ({
            id: r.id, finishSeconds: r.finishSeconds,
            disqualified: r.disqualified,
          })),
          this.proHeat.id
        );
        if (outcome.status === 'ADVANCED' || (outcome.status === 'COMPLETE' && outcome.settled)) {
          this.registry.set('proCircuit', outcome.circuit);
          if (outcome.cashPrize > 0) {
            this.registry.set('cash', Number(this.registry.get('cash') || 0) + outcome.cashPrize);
          }
          saveSessionState(this.registry);
        }
      } catch (error) {
        // A damaged or legacy saved bracket must NEVER strand the player on
        // the frozen race scene. Do not award/replace the saved result: return
        // to the complex and let the pending heat be safely retried.
        console.error('[Tokyo SHIFT] Four-wide cup settlement failed', error);
        outcome = { status: 'ERROR', cashPrize: 0 };
      }
    }
    this.add.rectangle(780, 345, 1050, 552, 0x06121e, 0.985)
      .setStrokeStyle(3, 0x62d7ed).setDepth(95).setScrollFactor(0);
    const resultHeading = this.proCup
      ? outcome?.status === 'ADVANCED' ? 'QUALIFIED'
        : outcome?.summary?.placing === 1 ? 'CHAMPION'
          : 'ELIMINATED'
      : own?.placing === 1 ? 'VICTORY' : 'RACE COMPLETE';
    const finishTitle = this.add.text(780, 109, resultHeading, {
      fontFamily: '"Exo 2", sans-serif', fontStyle: '900 italic',
      fontSize: '44px', color: outcome?.status === 'ADVANCED' ? '#88f4df' : '#edfbff',
      stroke: '#030c18', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(96).setScrollFactor(0)
      .setAlpha(0).setScale(0.78);
    this.tweens.add({
      targets: finishTitle, alpha: 1, scaleX: 1, scaleY: 1,
      duration: 290, ease: 'Back.Out',
    });
    this.add.text(780, 154,
      this.proCup ? (
        outcome?.status === 'ADVANCED'
          ? 'FINISHED ' + (own?.placing || 4) + '/4  //  ADVANCED'
          : outcome?.status === 'COMPLETE'
            ? 'FINISHED ' + (own?.placing || 4) + '/4  //  TOURNAMENT COMPLETE'
            : 'RESULT NOT SAVED // RETURN AND RETRY'
      ) : 'FINISHED ' + (own?.placing || 4) + '/4  //  PRACTICE', {
        fontFamily: PIXEL, fontSize: '11px', color: '#a3e5ec',
      }).setOrigin(0.5).setDepth(96).setScrollFactor(0);
    if (this.proCup) {
      const visual = characters[this.registry.get('playerCharacterId')]?.visual;
      const key = this.textures.exists(visual?.winSpriteKey)
        ? visual.winSpriteKey : visual?.spriteKey;
      if (key && this.textures.exists(key)) {
        const portrait = this.add.image(415, 328, key).setDepth(97).setScrollFactor(0);
        const image = this.textures.get(key).getSourceImage();
        portrait.setScale(Math.min(225 / image.width, 253 / image.height));
      }
      if (outcome?.summary) {
        const last = outcome.summary;
        const capsule = this.add.rectangle(412, 472, 318, 64, 0x142e40, 0.97)
          .setStrokeStyle(2, 0x70def0, 1).setDepth(98).setScrollFactor(0)
          .setScale(0.06, 1);
        const rankLabel = this.add.text(412, 472, 'PRO RANK #' + last.rankBefore, {
          fontFamily: PIXEL, fontSize: '13px', color: '#bcf6ff',
        }).setOrigin(0.5).setDepth(99).setScrollFactor(0).setVisible(false);
        this.tweens.add({
          targets: capsule, scaleX: 1, duration: 750, ease: 'Cubic.Out',
        });
        this.tweens.addCounter({
          from: last.rankBefore, to: last.rankAfter, duration: 1100,
          ease: 'Cubic.Out',
          onUpdate: tween => rankLabel.setText('PRO RANK #' + Math.round(tween.getValue())),
          onStart: () => rankLabel.setVisible(true),
        });
      }
    }
    standings.forEach((row, i) => {
      const y = 215 + i * 64;
      const mine = row.id === (this.proCup ? 'player:driver' : 'player');
      this.add.rectangle(this.proCup ? 1005 : 780, y,
        this.proCup ? 720 : 865, 52, mine ? 0x154051 : 0x122433, 1)
        .setStrokeStyle(1, mine ? 0x79e6ff : 0x395362)
        .setDepth(96).setScrollFactor(0);
      this.add.text(this.proCup ? 675 : 410, y, String(row.placing) + '  LANE ' + row.lane, {
        fontFamily: PIXEL, fontSize: '10px', color: mine ? '#91efff' : '#ffffff',
      }).setOrigin(0, 0.5).setDepth(97).setScrollFactor(0);
      this.add.text(this.proCup ? 855 : 680, y, row.label + '  //  ' + row.carLabel, {
        fontFamily: BODY, fontSize: '15px', color: '#edfaff', fontStyle: '700',
      }).setOrigin(0, 0.5).setDepth(97).setScrollFactor(0);
      this.add.text(this.proCup ? 1340 : 1190, y,
        row.status === 'FINISHED' ? row.finishSeconds.toFixed(3) + 's' : row.status, {
          fontFamily: PIXEL, fontSize: '10px',
          color: row.status === 'FINISHED' ? '#85e5b3' : '#ff93a2',
        }).setOrigin(1, 0.5).setDepth(97).setScrollFactor(0);
    });
    if (this.proCup && outcome?.status === 'COMPLETE' && outcome.summary) {
      const last = outcome.summary;
      this.add.text(1010, 484,
        'EVENT #' + last.placing + ' // +' + last.cashPrize.toLocaleString('en-US') + ' YEN', {
          fontFamily: PIXEL, fontSize: '10px', color: '#95e6b5',
        }).setOrigin(0.5).setDepth(98).setScrollFactor(0);
    }
    if (this.proCup && outcome?.status === 'ADVANCED') {
      this.makeButton(625, 532, 290, 'NEXT HEAT', 0x70dcca,
        () => this.scene.restart({ mode: 'PRO_CUP' }));
    } else if (!this.proCup) {
      this.makeButton(625, 532, 290, 'RETRY 4-WIDE', 0x70dcca,
        () => this.scene.restart());
    }
    this.makeButton(this.proCup && outcome?.status !== 'ADVANCED' ? 780 : 970,
      532, 310, 'RETURN TO DRAG', 0xffcf9b, () => this.returnToDrag());
  }

  returnToDrag() {
    this.scene.start('CentralTokyoScene', { locationId: 'tokyoDragComplex' });
  }
}
