import Vehicle from '../vehicles/Vehicle.js?v=20260921-r66';
import TouchControls from '../input/TouchControls.js?v=20260921-r43';
import DragRacingAI from '../ai/DragRacingAI.js?v=20260923-r162';
import RaceHUD from '../ui/RaceHUD.js?v=20260921-r43';
import DebugHUD from '../ui/DebugHUD.js';
import TokyoExpresswayBackground from '../environment/TokyoExpresswayBackground.js?v=20260921-r49';
import { cars, carOrder } from '../data/cars.js?v=20260924-r171';
import {
  DEFAULT_PAINT_COLOR,
  getCarPaintColor,
  normalisePaintColor,
  createCarBodyLayers,
} from '../vehicles/CarAppearance.js?v=20260924-r170';
import { createDriverSilhouette } from '../vehicles/DriverSilhouette.js?v=20260923-r137';
import { createVisualModLayers } from '../data/visualMods.js?v=20260924-r177';
import { createTunerDecalLayers } from '../vehicles/TunerDecals.js?v=20260924-r176';
import { getWheelPairFit, getWheelContactOffsetY } from '../vehicles/WheelFit.js?v=20260923-r160';
import { engines } from '../data/engines.js?v=20260924-r164';
import { applyEngineTuning } from '../data/tuning.js?v=20260921-r55';
import { applySecondaryTuning, getExhaustNosTuning } from '../data/secondaryTuning.js?v=20260924-r176';
import {
  characters,
  playableCharacterOrder,
  rivalCharacterOrder,
  getRivalCharacterOrderForRegion,
  hasRegionalTeam,
} from '../data/characters.js?v=20260925-r182';
import { WORKSHOP_RETURN_COST } from '../data/meetAssets.js?v=20260922-r84';
import { saveSessionState, saveManualState, restoreManualSave, readManualSave, clearAllSaves } from '../state/GameState.js?v=20260924-r178';
import { playRaceMusic, playVictorySting, stopMusic } from '../audio/MusicManager.js?v=20260922-r99';
import EngineAudioSystem from '../audio/EngineAudioSystem.js?v=20260921-r81';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20260922-r117';
import {
  getEncounterAi,
  boostAiForPinkSlip,
} from '../data/encounterProfiles.js?v=20260923-r162';
import { getTunerShopForRegion } from '../data/tunerShops.js?v=20260924-r178';
import {
  TUNER_TEAM_CHALLENGE_STAGES,
  TUNER_TEAM_PERFECT_REWARD,
  getTunerTeamChallengeState,
} from '../data/tunerChallenges.js?v=20260924-r178';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20260925-r182';

const QUARTER_M = 402.336;
const HALF_MILE_M = 804.672;
const PX_PER_M = 76.0;
const TREE_START_M = 4.72;
const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';
const TAXI_TO_WORKSHOP_COST = 1000;
const RESULT_FRAME = {
  x: 780,
  y: 360,
  w: 1240,
  h: 697,
};

const RESULT_BACKGROUNDS = {
  victory: {
    key: 'raceResultVictoryBg',
    path: 'assets/Race/Results/victory_background.png?v=20260922-r105',
  },
  defeat: {
    key: 'raceResultDefeatBg',
    path: 'assets/Race/Results/defeat_background.png?v=20260922-r105',
  },
  pinkWin: {
    key: 'raceResultPinkWinBg',
    path: 'assets/Race/Results/pink_slip_won_background.png?v=20260922-r105',
  },
  pinkLoss: {
    key: 'raceResultPinkLossBg',
    path: 'assets/Race/Results/pink_slip_lost_background.png?v=20260922-r105',
  },
};

const clone = value => JSON.parse(JSON.stringify(value));

export default class RaceScene extends Phaser.Scene {
  constructor() { super('RaceScene'); }

  preload() {
    let queued = 0;
    const queueImage = (key, path) => {
      if (!this.textures.exists(key)) {
        this.load.image(key, path);
        queued += 1;
      }
    };

    queueImage('hudCluster', 'assets/Ui/hud_cluster.png');
    queueImage('dragTree', 'assets/Ui/drag_tree.png');
    queueImage('clutchPedal', 'assets/Controls/clutch_pedal.png');
    queueImage('throttlePedal', 'assets/Controls/throttle_pedal.png');
    queueImage('nosButton', 'assets/Controls/nos_button.png');
    queueImage('shifterNeutral', 'assets/Controls/shifter_neutral.png');
    queueImage('shifterDown', 'assets/Controls/shifter_down.png');

    Object.values(RESULT_BACKGROUNDS).forEach(asset => {
      queueImage(asset.key, asset.path);
    });

    const playerId = this.registry.get('playerCharacterId') || 'renMizuno';
    const opponentId = this.registry.get('selectedOpponentCharacterId');
    [playerId, opponentId].filter(Boolean).forEach(id => {
      const visual = characters[id]?.visual || {};
      queueImage(visual.winSpriteKey, visual.winPath ? visual.winPath + '?v=20260923-r145' : null);
      queueImage(visual.lossSpriteKey, visual.lossPath ? visual.lossPath + '?v=20260923-r145' : null);
    });

    startSceneLoading(this, 'PREPARING RACE', queued);
  }

  init() {
    this.selectedCarId = this.registry.get('selectedCarId') || 'ae86';
    if (!cars[this.selectedCarId]) this.selectedCarId = 'ae86';

    const rivals = carOrder.filter(id => id !== this.selectedCarId);
    const chosenOpponent = this.registry.get('selectedOpponentCarId');
    this.opponentCarId = rivals.includes(chosenOpponent)
      ? chosenOpponent
      : Phaser.Utils.Array.GetRandom(rivals);

    this.opponentPaintColor = normalisePaintColor(
      this.registry.get('selectedOpponentPaintColor'),
      DEFAULT_PAINT_COLOR
    );
    const storedPlayerCharacterId = this.registry.get('playerCharacterId') || 'renMizuno';
    this.playerCharacterId = playableCharacterOrder.includes(storedPlayerCharacterId)
      ? storedPlayerCharacterId
      : playableCharacterOrder[0];

    const storedOpponentCharacterId = this.registry.get('selectedOpponentCharacterId');
    const raceRegionForRivals = this.registry.get('raceDistrict')
      || this.registry.get('district')
      || 'ODAIBA';
    const regionRivals = getRivalCharacterOrderForRegion(raceRegionForRivals);
    const fallbackOpponentCharacterId =
      regionRivals.find(id => id !== this.playerCharacterId)
      || rivalCharacterOrder.find(id => id !== this.playerCharacterId)
      || rivalCharacterOrder[0];
    this.opponentCharacterId =
      regionRivals.includes(storedOpponentCharacterId) &&
      storedOpponentCharacterId !== this.playerCharacterId
        ? storedOpponentCharacterId
        : fallbackOpponentCharacterId;
    this.opponentEncounterRating = Phaser.Math.Clamp(
      Number(this.registry.get('selectedOpponentEncounterRating') || characters[this.opponentCharacterId]?.skill?.rating || 3),
      1,
      5
    );
    this.opponentEncounterAi = this.registry.get('selectedOpponentEncounterAi')
      || getEncounterAi(this.opponentEncounterRating);
    this.raceMode = this.registry.get('selectedRaceCategory') || 'SINGLE';
    this.raceType = this.registry.get('selectedRaceType') || 'Standing Start';
    this.isRollingStart = this.raceType === 'Roll Race';
    const configuredRaceDistanceM = Number(this.registry.get('selectedRaceDistanceM') || 0);
    this.raceDistanceM = configuredRaceDistanceM > 100
      ? configuredRaceDistanceM
      : (this.isRollingStart ? HALF_MILE_M : QUARTER_M);
    this.raceDistanceLabel = Math.abs(this.raceDistanceM - QUARTER_M) < 1
      ? '1/4 MILE'
      : Math.abs(this.raceDistanceM - HALF_MILE_M) < 1
        ? '1/2 MILE'
        : Math.round(this.raceDistanceM) + ' M';
    this.raceDeal = this.registry.get('selectedRaceDeal') || 'BET';
    this.raceStake = Number(this.registry.get('selectedRaceStake') || 0);
    this.raceTimeOfDay = this.registry.get('raceTimeOfDay') || 'night';
    this.raceDistrict = this.registry.get('raceDistrict') || this.registry.get('district') || 'ODAIBA';
    this.raceLocationLabel = this.registry.get('raceLocationLabel') || 'STREET';
  }

  create() {
    document.body.dataset.scene = 'race';
    this.scale.resize(1560, 720);
    playRaceMusic();

    const carStates = this.registry.get('carStates') || {};
    this.playerCarState = carStates[this.selectedCarId] || {
      stock: true,
      nosInstalled: false,
      tuneLevel: 0,
      acquiredVia: 'starter',
    };
    this.playerPaintColor = getCarPaintColor(this.playerCarState);

    const rivalCharacter = characters[this.opponentCharacterId];
    const playerBaseCar = clone(cars[this.selectedCarId]);
    const playerBuild = this.applyOwnedBuild(
      playerBaseCar,
      clone(engines[playerBaseCar.engine]),
      this.playerCarState
    );
    const playerConfig = playerBuild.car;
    const opponentConfig = this.applyRivalBuild(clone(cars[this.opponentCarId]), rivalCharacter);

    this.playerCapabilities = {
      hasTurbo: (playerConfig.maximumBoost || 0) > 0.01,
      hasNitrous: (playerConfig.nosPower || 0) > 0 && (playerConfig.nosCapacitySeconds || 0) > 0,
    };

    this.opponentCapabilities = {
      hasTurbo: (opponentConfig.maximumBoost || 0) > 0.01,
      hasNitrous: (opponentConfig.nosPower || 0) > 0 && (opponentConfig.nosCapacitySeconds || 0) > 0,
    };

    this.player = new Vehicle(playerConfig, playerBuild.engine);
    this.opponent = new Vehicle(opponentConfig, clone(engines[opponentConfig.engine]));
    this.engineAudio = new EngineAudioSystem(playerConfig.engine, opponentConfig.engine, this.playerCarState, this.opponentBuildState || {});
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.engineAudio?.destroy());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.engineAudio?.destroy());

    // Stay staged and stationary until the player actually starts the race.
    // Roll-race speed is injected only when START ROLL is pressed.
    this.player.transmission.currentGear = 0;
    this.player.transmission.lastShiftQuality = 'NEUTRAL';
    this.opponent.transmission.currentGear = 1;
    this.opponent.transmission.lastShiftQuality = 'STAGED';

    const baseRivalAI = this.opponentEncounterAi
      || rivalCharacter?.skill?.ai
      || getEncounterAi(this.opponentEncounterRating);
    const rivalAI = this.raceDeal === 'PINK_SLIP'
      ? boostAiForPinkSlip(baseRivalAI)
      : { ...baseRivalAI };
    this.ai = new DragRacingAI(this.opponent, rivalAI, { rollingStart: this.isRollingStart });

    this.controls = new TouchControls(this, { nosEnabled: this.playerCapabilities.hasNitrous });
    this.hud = new RaceHUD(this, {
      hasTurbo: this.playerCapabilities.hasTurbo,
      hasNitrous: this.playerCapabilities.hasNitrous,
    });
    this.debug = new DebugHUD(this);

    this.raceClock = 0;
    this.countdownClock = 0;
    this.greenClock = null;
    this.raceStarted = false;
    this.falseStart = false;
    this.finished = false;
    this.afterFinishTimer = 0;
    this.finishCameraPx = null;
    this.startMoved = false;
    this.times = { reaction: null, sixty: null, eighth: null, quarter: null, finish: null, trapKmh: null };
    this.opponentTimes = { reaction: null, sixty: null, eighth: null, quarter: null, finish: null, trapKmh: null };
    this.opponentStartMoved = false;
    this.opponentFinishClock = null;
    this.playerFinishClock = null;
    this.resultsShown = false;
    this.firstFinishClock = null;
    this.raceSettlement = null;
    this.raceStartPositionM = 0;
    this.opponentRaceStartPositionM = 0;
    this.finishTargetM = this.raceDistanceM;
    this.rollingSpeedMps = 60 / 3.6;
    this.lastRollCountdownLabel = null;

    this.environment = new TokyoExpresswayBackground(this, { timeOfDay: this.raceTimeOfDay });
    this.worldG = this.add.graphics().setDepth(4);
    this.fxG = this.add.graphics().setDepth(8);
    this.treeLightsG = this.add.graphics().setDepth(23);

    this.playerVisual = this.createCarVisual(
      cars[this.selectedCarId],
      7,
      1.0,
      this.playerPaintColor,
      characters[this.playerCharacterId],
      this.playerCarState
    );
    this.opponentVisual = this.createCarVisual(
      cars[this.opponentCarId],
      6,
      0.88,
      this.opponentPaintColor,
      characters[this.opponentCharacterId],
      {}
    );

    this.treeSprite = this.add.image(780, 192, 'dragTree')
      .setScale(0.105)
      .setDepth(20)
      .setAlpha(0.94)
      .setVisible(!this.isRollingStart);

    this.rollCountdownText = this.add.text(780, 176, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '42px',
      color: '#f4fbff',
      stroke: '#07111d',
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(48).setScrollFactor(0).setVisible(false);

    this.startButton = this.add.rectangle(780, 54, 250, 54, 0x142235, 0.96)
      .setStrokeStyle(3, 0x63d7ff, 1)
      .setDepth(45)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.startButtonText = this.add.text(780, 54, this.isRollingStart ? 'START ROLL' : 'START RACE', {
      fontFamily: PIXEL_FONT, fontSize: '13px', color: '#eef8ff'
    }).setOrigin(0.5).setDepth(46).setScrollFactor(0);

    this.startButton.on('pointerdown', () => this.startRace());

    this.add.text(
      780,
      102,
      this.raceDistrict + ' // ' + this.raceLocationLabel + ' // ' + this.raceTimeOfDay.toUpperCase(),
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: this.raceTimeOfDay === 'day' ? '#d8f4ff' : '#9fc8de',
        backgroundColor: '#07111daa',
        padding: { x: 8, y: 4 },
      }
    ).setOrigin(0.5).setDepth(46).setScrollFactor(0);

    const rivalName = characters[this.opponentCharacterId]?.name || 'Rival';
    const moneyLabel = this.raceDeal === 'PINK_SLIP'
      ? 'PINK SLIP  //  ' + cars[this.selectedCarId].shortName
      : this.raceMode === 'COMPETITION'
        ? 'PRIZE  ¥ ' + this.raceStake.toLocaleString('en-US')
        : 'BET  ¥ ' + this.raceStake.toLocaleString('en-US');

    this.rivalText = this.add.text(1490, 39, rivalName.toUpperCase(), {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#d8edf8',
    }).setOrigin(1, 0.5).setDepth(46).setScrollFactor(0);

    this.stakeText = this.add.text(1490, 65, moneyLabel, {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: this.raceDeal === 'PINK_SLIP' ? '#ff7cac' : this.raceMode === 'COMPETITION' ? '#8fe7ff' : '#ffe08a',
    }).setOrigin(1, 0.5).setDepth(46).setScrollFactor(0);

    this.cancelButton = this.add.rectangle(135, 54, 210, 46, 0x24131a, 0.94)
      .setStrokeStyle(2, 0xff6b7a, 0.9)
      .setDepth(47)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.cancelButtonText = this.add.text(135, 54, 'CANCEL RACE', {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#ffd8dc'
    }).setOrigin(0.5).setDepth(48).setScrollFactor(0);

    this.cancelButton.on('pointerdown', () => this.confirmCancelRace());

    finishSceneLoading('READY TO RACE');
  }

  confirmCancelRace() {
    if (this.raceStarted || this.cancelConfirmPopup?.active || this.resultsShown) return;

    const isPink = this.raceDeal === 'PINK_SLIP';
    const isCompetition = this.raceMode === 'COMPETITION';
    const cashPenalty = Math.ceil((this.raceStake * 0.5) / 250) * 250;
    const penaltyText = isPink
      ? 'You forfeit ' + cars[this.selectedCarId].shortName + '. The rival takes your car.'
      : isCompetition
        ? 'Your competition streak ends here. The entry fee is not refunded.'
        : 'You forfeit ¥' + cashPenalty.toLocaleString('en-US') + ' — half the agreed bet.';

    const depth = 110;
    const objects = [];
    const add = obj => {
      objects.push(obj);
      return obj;
    };

    const blocker = add(this.add.rectangle(780, 360, 1560, 720, 0x02050b, 0.58)
      .setDepth(depth)
      .setScrollFactor(0)
      .setInteractive());

    const panel = add(this.add.rectangle(780, 350, 720, 280, 0x08131f, 0.995)
      .setStrokeStyle(2, isPink ? 0xff5f93 : 0xffb45f, 0.95)
      .setDepth(depth + 1)
      .setScrollFactor(0));

    add(this.add.text(780, 280, isPink ? 'CANCEL PINK SLIP?' : 'CANCEL RACE?', {
      fontFamily: PIXEL_FONT,
      fontSize: '16px',
      color: '#eefaff',
    }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0));

    add(this.add.text(780, 340, penaltyText, {
      fontFamily: BODY_FONT,
      fontSize: '14px',
      color: isPink ? '#ffb4ca' : '#f1c99a',
      align: 'center',
      wordWrap: { width: 590 },
    }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0));

    add(this.add.text(780, 382, 'This counts as a loss.', {
      fontFamily: BODY_FONT,
      fontSize: '11px',
      color: '#8799a5',
    }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0));

    const forfeit = add(this.add.rectangle(665, 438, 200, 46, 0x30151d, 1)
      .setStrokeStyle(2, 0xff667f, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2)
      .setScrollFactor(0));

    add(this.add.text(665, 438, 'FORFEIT', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#ffe2e8',
    }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0));

    const keepRacing = add(this.add.rectangle(895, 438, 200, 46, 0x0d2b29, 1)
      .setStrokeStyle(2, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2)
      .setScrollFactor(0));

    add(this.add.text(895, 438, 'KEEP RACING', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#f1fffb',
    }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0));

    const dismiss = () => {
      objects.forEach(obj => obj?.destroy?.());
      this.cancelConfirmPopup = null;
    };

    blocker.on('pointerdown', dismiss);
    keepRacing.on('pointerdown', dismiss);
    forfeit.on('pointerdown', () => {
      dismiss();
      this.forfeitRace(cashPenalty);
    });

    this.cancelConfirmPopup = panel;
  }

  forfeitRace(cashPenalty = 0) {
    if (this.resultsShown) return;

    const losses = Number(this.registry.get('losses') || 0);
    this.registry.set('losses', losses + 1);

    if (this.raceMode === 'COMPETITION') {
      this.registry.set('competitionState', null);
      saveSessionState(this.registry);
      this.scene.start('MeetScene');
      return;
    }

    if (this.raceDeal === 'PINK_SLIP') {
      const forfeitedCarName = cars[this.selectedCarId]?.shortName || 'YOUR CAR';
      let ownedCarIds = [...(this.registry.get('ownedCarIds') || [])];
      const carStates = { ...(this.registry.get('carStates') || {}) };

      ownedCarIds = ownedCarIds.filter(id => id !== this.selectedCarId);
      delete carStates[this.selectedCarId];

      this.registry.set('ownedCarIds', ownedCarIds);
      this.registry.set('carStates', carStates);

      if (ownedCarIds.length) {
        this.registry.set('selectedCarId', ownedCarIds[0]);
        this.registry.set('meetStranded', true);
        this.registry.set('gameOver', false);
      } else {
        this.registry.set('selectedCarId', null);
        this.registry.set('meetStranded', false);
        this.registry.set('gameOver', true);
      }

      if (this.registry.get('selectedRaceSpecialChallenge')) {
        this.registry.set('specialChallenger', null);
        this.registry.set('selectedRaceSpecialChallenge', false);
      }

      saveSessionState(this.registry);
      this.scene.start('MeetScene');
      return;
    }

    const cash = Number(this.registry.get('cash') || 0);
    this.registry.set('cash', Math.max(0, cash - Math.max(0, cashPenalty)));
    saveSessionState(this.registry);
    this.scene.start('MeetScene');
  }

  showForfeitGameOver(forfeitedCarName = 'YOUR CAR') {
    this.resultsShown = true;
    this.controls.enabled = false;
    this.cancelButton?.disableInteractive();
    this.startButton?.disableInteractive();
    stopMusic();

    const depth = 130;
    this.add.rectangle(780, 360, 1560, 720, 0x02050b, 0.72)
      .setDepth(depth)
      .setScrollFactor(0);

    this.add.rectangle(780, 350, 760, 300, 0x08111c, 0.98)
      .setStrokeStyle(2, 0xff5f93, 0.9)
      .setDepth(depth + 1)
      .setScrollFactor(0);

    this.add.text(780, 278, 'PINK SLIP FORFEITED', {
      fontFamily: PIXEL_FONT,
      fontSize: '17px',
      color: '#ff8faf',
    }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0);

    this.add.text(780, 334, forfeitedCarName + ' IS GONE // NO CARS LEFT', {
      fontFamily: BODY_FONT,
      fontSize: '14px',
      color: '#d7e6ee',
    }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0);

    const addButton = (x, label, stroke, onPress) => {
      const button = this.add.rectangle(x, 430, 220, 46, 0x0c1825, 0.98)
        .setStrokeStyle(2, stroke, 0.9)
        .setDepth(depth + 2)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true });

      this.add.text(x, 430, label, {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: '#eef9ff',
      }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0);

      button.on('pointerdown', onPress);
    };

    const hasManualSave = Boolean(readManualSave());
    if (hasManualSave) {
      addButton(650, 'RESTORE SAVE', 0x45d7ff, () => {
        const restored = restoreManualSave(this.registry);
        this.scene.start(restored && !restored.gameOver ? 'GarageScene' : 'CharacterSelectScene');
      });

      addButton(910, 'NEW RUN', 0xff4a8d, () => {
        clearAllSaves();
        this.scene.start('CharacterSelectScene');
      });
    } else {
      addButton(780, 'NEW RUN', 0xff4a8d, () => {
        clearAllSaves();
        this.scene.start('CharacterSelectScene');
      });
    }
  }

  applyTuneLevel(config, tuneLevel = 0) {
    const rating = Phaser.Math.Clamp(Number(tuneLevel) || 0, 0, 5);
    const tier = Math.max(0, rating - 2);

    config.tyreGrip *= 1 + tier * 0.018;
    config.clutchStrength *= 1 + tier * 0.055;

    if ((config.maximumBoost || 0) > 0) {
      config.maximumBoost *= 1 + tier * 0.035;
      config.turboSpoolRate *= 1 + tier * 0.025;
    }

    return config;
  }

  applyOwnedBuild(config, engineConfig, state = {}) {
    // Ginza collector cars are sealed complete builds. Their physics must stay
    // exactly as authored in cars.js/engines.js even if an old or edited save
    // contains tuning fields.
    if (config.tuningLocked || state.tuningLocked || state.immutable || state.collector) {
      config.nosPower = 0;
      config.nosCapacitySeconds = 0;
      return { car: config, engine: engineConfig };
    }

    // Legacy pink-slip tune levels remain compatible, then the newer workshop
    // systems layer engine, drivetrain and exhaust/NOS parts onto the car.
    this.applyTuneLevel(config, state.tuneLevel || 0);
    const engineTuned = applyEngineTuning(config, engineConfig, state);
    const tuned = applySecondaryTuning(engineTuned.car, engineTuned.engine, state);

    const exhaustNos = getExhaustNosTuning(state);
    const hasWorkshopNos = exhaustNos.nosKit > 0;

    if (!hasWorkshopNos) {
      if (!state.nosInstalled) {
        tuned.car.nosPower = 0;
        tuned.car.nosCapacitySeconds = 0;
      } else {
        tuned.car.nosPower = Number(state.nosPower || tuned.car.nosPower || 35);
        tuned.car.nosCapacitySeconds = Number(state.nosCapacitySeconds || tuned.car.nosCapacitySeconds || 5);
      }
    }

    return tuned;
  }

  applyRivalBuild(config, character) {
    const rating = Phaser.Math.Clamp(
      Number(this.opponentEncounterRating || character?.skill?.rating || 3),
      1,
      5
    );

    // A pink-slip rival protects their car by bringing a slightly sharper
    // version of the same build. This is a modest tune bump, not a hidden
    // speed multiplier, and the AI receives a separate small skill boost.
    const buildRating = Phaser.Math.Clamp(
      rating + (this.raceDeal === 'PINK_SLIP' ? 0.5 : 0),
      1,
      5
    );

    this.applyTuneLevel(config, buildRating);

    const hasNitrous = buildRating >= 4;
    config.nosPower = hasNitrous ? (buildRating >= 5 ? 55 : 35) : 0;
    config.nosCapacitySeconds = hasNitrous ? (buildRating >= 5 ? 5.0 : 4.0) : 0;

    this.opponentBuildState = {
      stock: buildRating <= 2,
      paintColor: this.opponentPaintColor,
      nosInstalled: hasNitrous,
      nosPower: config.nosPower,
      nosCapacitySeconds: config.nosCapacitySeconds,
      tuneLevel: buildRating,
      acquiredVia: 'pinkSlip',
    };

    return config;
  }

  rollingGearRPM(vehicle, gear) {
    const ratio = Number(vehicle.config.gearRatios?.[gear - 1] || 0)
      * Number(vehicle.config.finalDriveRatio || 0);
    if (ratio <= 0) return 0;

    const wheelRPM = this.rollingSpeedMps / (Math.PI * 2 * vehicle.config.wheelRadius) * 60;
    return wheelRPM * ratio;
  }

  chooseRollingStartGear(vehicle) {
    const redline = Number(
      vehicle.config.engineRedlineRPM
      || vehicle.engine?.config?.redlineRPM
      || 7600
    );
    const targetRPM = redline * 0.63;
    let bestGear = Math.min(2, vehicle.config.gearRatios.length);
    let bestScore = Infinity;

    for (let gear = 1; gear <= vehicle.config.gearRatios.length; gear++) {
      const rpm = this.rollingGearRPM(vehicle, gear);
      if (rpm <= 0 || rpm > redline * 0.86) continue;

      let score = Math.abs(rpm - targetRPM);
      if (rpm > redline * 0.76) score += (rpm - redline * 0.76) * 1.5;

      if (score < bestScore) {
        bestScore = score;
        bestGear = gear;
      }
    }

    return bestGear;
  }

  setRollingGear(vehicle, gear) {
    const nextGear = Math.round(Phaser.Math.Clamp(
      Number(gear) || 1,
      1,
      vehicle.config.gearRatios.length
    ));
    const rpm = this.rollingGearRPM(vehicle, nextGear);
    const limiter = Number(
      vehicle.config.engineLimiterRPM
      || vehicle.engine?.config?.limiterRPM
      || 7800
    );

    if (rpm >= limiter * 0.97) {
      vehicle.transmission.lastShiftQuality = 'TOO LOW @ 60';
      return false;
    }

    vehicle.transmission.currentGear = nextGear;
    vehicle.transmission.pendingGear = null;
    vehicle.transmission.shiftTimer = 0;
    vehicle.transmission.lastShiftQuality = 'ROLLING MATCH';
    vehicle.engine.rpm = Phaser.Math.Clamp(
      rpm,
      vehicle.config.engineIdleRPM || 850,
      limiter * 0.94
    );
    return true;
  }

  prepareRollingVehicle(vehicle) {
    vehicle.speedMps = this.rollingSpeedMps;
    vehicle.accelerationMps2 = 0;
    vehicle.transmission.pendingGear = null;
    vehicle.transmission.shiftTimer = 0;

    const wheelRPM = this.rollingSpeedMps / (Math.PI * 2 * vehicle.config.wheelRadius) * 60;
    vehicle.tyres.wheelRPM = wheelRPM;
    vehicle.tyres.wheelspin = false;
    vehicle.tyres.slipRatio = 0;
    this.setRollingGear(vehicle, this.chooseRollingStartGear(vehicle));
    vehicle.clutch.pedal = 0;
  }

  advanceRollingVehicle(vehicle, dt) {
    vehicle.speedMps = this.rollingSpeedMps;
    vehicle.accelerationMps2 = 0;
    vehicle.positionM += this.rollingSpeedMps * dt;

    const wheelRPM = this.rollingSpeedMps / (Math.PI * 2 * vehicle.config.wheelRadius) * 60;
    vehicle.tyres.wheelRPM = wheelRPM;
    vehicle.tyres.wheelspin = false;
    vehicle.tyres.slipRatio = 0;

    if (vehicle.transmission.currentGear > 0) {
      vehicle.engine.rpm = Phaser.Math.Clamp(
        this.rollingGearRPM(vehicle, vehicle.transmission.currentGear),
        vehicle.config.engineIdleRPM || 850,
        (vehicle.config.engineLimiterRPM || 7800) * 0.94
      );
    }

    return vehicle.telemetry;
  }

  showRollCountdown(label) {
    if (this.lastRollCountdownLabel === label) return;
    this.lastRollCountdownLabel = label;

    this.rollCountdownText.setText(label).setVisible(true).setAlpha(1).setScale(0.55);
    this.tweens.killTweensOf(this.rollCountdownText);
    this.tweens.add({
      targets: this.rollCountdownText,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 150,
      yoyo: true,
      hold: 160,
      ease: 'Back.Out',
    });

    if (label === 'GO!') {
      this.tweens.add({
        targets: this.rollCountdownText,
        alpha: 0,
        delay: 520,
        duration: 220,
        onComplete: () => this.rollCountdownText.setVisible(false),
      });
    }
  }

  createCarVisual(
    car,
    depth,
    roleScale,
    paintColor = DEFAULT_PAINT_COLOR,
    driverCharacter = null,
    carState = {}
  ) {
    const cfg = car.visual;
    const bodyScale = cfg.bodyScale * roleScale;
    const wheelSource = this.textures.get(cfg.wheelKey).getSourceImage();
    const wheelFit = getWheelPairFit(cfg, bodyScale, false, wheelSource);
    const renderOffsetY = Number(cfg.renderOffsetY || 0) * bodyScale;

    // Keep unique collector cars on the same road contact line as the normal
    // AE86 reference. Hero PNG trims differ, so renderOffsetY alone otherwise
    // makes some cars float high or sit low even when their tyres are correct.
    let groundCorrectionY = 0;
    if (cfg.singleBody && cars.ae86) {
      const reference = cars.ae86.visual;
      const referenceBodyScale = reference.bodyScale * roleScale;
      const referenceWheelSource = this.textures.get(reference.wheelKey).getSourceImage();
      const referenceFit = getWheelPairFit(
        reference,
        referenceBodyScale,
        false,
        referenceWheelSource
      );
      const referenceGroundOffset =
        Number(reference.renderOffsetY || 0) * referenceBodyScale +
        Math.max(
          referenceFit.rear.offsetY +
            getWheelContactOffsetY(referenceWheelSource, referenceFit.rear.wheelScale),
          referenceFit.front.offsetY +
            getWheelContactOffsetY(referenceWheelSource, referenceFit.front.wheelScale)
        );
      const heroGroundOffset =
        renderOffsetY +
        Math.max(
          wheelFit.rear.offsetY +
            getWheelContactOffsetY(wheelSource, wheelFit.rear.wheelScale),
          wheelFit.front.offsetY +
            getWheelContactOffsetY(wheelSource, wheelFit.front.wheelScale)
        );

      groundCorrectionY = referenceGroundOffset - heroGroundOffset;
    }

    const rearWheel = this.add.image(0, 0, cfg.wheelKey)
      .setScale(wheelFit.rear.wheelScale)
      .setDepth(depth);

    const frontWheel = this.add.image(0, 0, cfg.wheelKey)
      .setScale(wheelFit.front.wheelScale)
      .setDepth(depth);

    // Fill the complete wheel cavity with black behind the tyre. Hero cars have
    // measured well radii; normal cars fall back to the old wheel-sized backing.
    const rearWheelBacking = this.add.circle(
      0,
      0,
      wheelFit.rear.backingRadius ?? Math.max(9, rearWheel.displayWidth * 0.50),
      0x020304,
      1
    ).setDepth(depth - 0.35);

    const frontWheelBacking = this.add.circle(
      0,
      0,
      wheelFit.front.backingRadius ?? Math.max(9, frontWheel.displayWidth * 0.50),
      0x020304,
      1
    ).setDepth(depth - 0.35);

    const driver = driverCharacter
      ? createDriverSilhouette(this, cfg, driverCharacter, {
          bodyX: 0,
          bodyY: 0,
          bodyScale,
          depth: depth + 0.55,
        })
      : null;

    const bodyLayers = createCarBodyLayers(this, cfg, {
      x: 0,
      y: 0,
      scale: bodyScale,
      depth: depth + 1,
      paintColor,
    });
    const visualModObjects = createVisualModLayers(this, car, carState, {
      x: 0,
      y: 0,
      scale: bodyScale,
      depth: depth + 1.005,
      paintColor,
      bodyLayers,
    });
    const decalObjects = createTunerDecalLayers(this, carState, {
      x: 0,
      y: 0,
      displayWidth: bodyLayers.primary.displayWidth,
      displayHeight: bodyLayers.primary.displayHeight,
      depth: depth + 1.04,
    });
    const body = bodyLayers.primary;

    const roadShadow = this.add.ellipse(
      0, 0,
      Math.max(150, body.displayWidth * 0.98),
      Math.max(18, body.displayHeight * 0.18),
      0x000000, 0.68
    ).setDepth(depth - 0.6);

    return {
      cfg,
      bodyScale,
      renderOffsetY,
      groundCorrectionY,
      wheelFit,
      wheelScale: (wheelFit.rear.wheelScale + wheelFit.front.wheelScale) / 2,
      rearWheel,
      frontWheel,
      rearWheelBacking,
      frontWheelBacking,
      roadShadow,
      body,
      bodyObjects: [...bodyLayers.objects, ...visualModObjects, ...decalObjects],
      driverSilhouette: driver?.image || null,
      driverOffsetX: driver?.offsetX || 0,
      driverOffsetY: driver?.offsetY || 0,
      paintBody: bodyLayers.paint,
      bodyOverlay: bodyLayers.overlay,
      wheelAngle: 0,
      noseOffsetPx: body.width * bodyScale * 0.5,
      rearX: 0,
      rearY: 0,
      frontX: 0,
      frontY: 0,
      exhaustX: 0,
      exhaustY: 0,
    };
  }

  startRace() {
    if (this.raceStarted || this.finished) return;
    this.raceStarted = true;
    this.countdownClock = 0;
    this.greenClock = null;
    this.startMoved = false;
    this.opponentStartMoved = false;
    this.startButton.setVisible(false).disableInteractive();
    this.startButtonText.setVisible(false);
    this.cancelButton?.setVisible(false).disableInteractive();
    this.cancelButtonText?.setVisible(false);

    if (this.isRollingStart) {
      this.prepareRollingVehicle(this.player);
      this.prepareRollingVehicle(this.opponent);
      this.showRollCountdown('3');
    }
  }

  racePhase() {
    if (!this.raceStarted) return 'READY';
    if (this.isRollingStart && this.greenClock == null) return 'ROLLING';
    if (this.greenClock != null) return 'GREEN';
    if (this.countdownClock < 0.9) return 'PRE-STAGE';
    if (this.countdownClock < 1.8) return 'STAGE';
    if (this.countdownClock < 2.3) return 'AMBER 1';
    if (this.countdownClock < 2.8) return 'AMBER 2';
    if (this.countdownClock < 3.3) return 'AMBER 3';
    return 'GREEN';
  }

  update(_, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    this.raceClock += dt;

    if (Phaser.Input.Keyboard.JustDown(this.controls.keys.debug)) this.debug.toggle();
    if (Phaser.Input.Keyboard.JustDown(this.controls.keys.restart)) this.scene.start('GarageScene');

    if (this.resultsShown) return;

    const controlState = this.controls.update();
    const requestedGear = this.controls.consumeGearRequest();

    const rollingCountdown = this.isRollingStart && this.raceStarted && this.greenClock == null;

    if (rollingCountdown && requestedGear != null) {
      const tr = this.player.transmission;
      let nextGear = null;

      if (requestedGear === 'UP') {
        nextGear = Math.min(this.player.config.gearRatios.length, Math.max(1, tr.currentGear + 1));
      } else if (requestedGear === 'DOWN') {
        nextGear = Math.max(1, tr.currentGear - 1);
      } else if (typeof requestedGear === 'number') {
        nextGear = requestedGear;
      }

      if (nextGear != null) this.setRollingGear(this.player, nextGear);
    } else if (!rollingCountdown) {
      if (requestedGear === 'UP') {
        const tr = this.player.transmission;
        if (tr.shiftTimer <= 0) {
          const nextGear = tr.currentGear <= 0 ? 1 : tr.currentGear + 1;
          if (nextGear <= this.player.config.gearRatios.length) this.player.requestGear(nextGear);
        }
      } else if (requestedGear === 'DOWN') {
        const tr = this.player.transmission;
        if (tr.shiftTimer <= 0 && tr.currentGear > 1) this.player.requestGear(tr.currentGear - 1);
      } else if (typeof requestedGear === 'number') {
        this.player.requestGear(requestedGear);
      }
    }

    if (this.raceStarted && this.greenClock == null) {
      this.countdownClock += dt;

      if (this.isRollingStart) {
        if (this.countdownClock < 0.8) this.showRollCountdown('3');
        else if (this.countdownClock < 1.6) this.showRollCountdown('2');
        else if (this.countdownClock < 2.4) this.showRollCountdown('1');
        else {
          this.greenClock = this.raceClock;
          this.raceStartPositionM = this.player.positionM;
          this.opponentRaceStartPositionM = this.opponent.positionM;
          this.finishTargetM = this.raceStartPositionM + this.raceDistanceM;
          this.startMoved = true;
          this.opponentStartMoved = true;
          this.showRollCountdown('GO!');
        }
      } else if (this.countdownClock >= 3.3) {
        this.greenClock = this.raceClock;
      }
    }

    let playerT;
    let oppT;

    if (this.isRollingStart && this.raceStarted && this.greenClock == null) {
      playerT = this.advanceRollingVehicle(this.player, dt);
      oppT = this.advanceRollingVehicle(this.opponent, dt);
    } else {
      const aiState = this.ai.update(dt, this.raceClock, this.greenClock);
      playerT = this.player.update(dt, controlState);
      oppT = this.opponent.update(dt, aiState);
    }

    this.engineAudio?.update(playerT, oppT, this.player.config, this.opponent.config, dt);

    this.handleTiming(playerT, oppT);
    this.drawScene(playerT, oppT, dt);

    let status = '';
    if (this.falseStart) status = 'RED LIGHT';
    else if (!this.raceStarted) {
      status = this.raceType.toUpperCase() + '  //  ' + this.raceDistanceLabel + '  //  ' +
        cars[this.selectedCarId].shortName + ' vs ' + cars[this.opponentCarId].shortName;
    } else if (this.greenClock != null) {
      status = (this.raceClock - this.greenClock) < 0.70 ? 'GO!' : '';
    }
    else if (this.isRollingStart) status = 'ROLLING 60 KM/H  //  ' + this.raceDistanceLabel + '  //  SELECT GEAR';
    else if (this.countdownClock < 1.8) status = 'STAGED';

    this.hud.update(playerT, status);
    this.debug.update(playerT);

    if (this.finished) {
      this.afterFinishTimer += dt;
      const cinematicElapsed = this.firstFinishClock == null
        ? 0
        : this.raceClock - this.firstFinishClock;

      if (cinematicElapsed > 1.18 && !this.resultsShown) {
        this.showResultsOverlay();
      }
    }
  }

  handleTiming(pt, ot) {
    const playerDistance = Math.max(0, pt.positionM - this.raceStartPositionM);
    const opponentDistance = Math.max(0, ot.positionM - this.opponentRaceStartPositionM);

    if (!this.isRollingStart) {
      const playerMoved = playerDistance > 0.20 || pt.speedMps > 0.60;
      if (this.raceStarted && playerMoved && !this.startMoved) {
        this.startMoved = true;
        if (this.greenClock == null) {
          this.falseStart = true;
          this.times.reaction = null;
        } else {
          this.times.reaction = this.raceClock - this.greenClock;
        }
      }

      const opponentMoved = opponentDistance > 0.20 || ot.speedMps > 0.60;
      if (this.greenClock != null && opponentMoved && !this.opponentStartMoved) {
        this.opponentStartMoved = true;
        this.opponentTimes.reaction = this.raceClock - this.greenClock;
      }
    }

    if (this.greenClock != null && this.startMoved && !this.falseStart) {
      const launchClock = this.isRollingStart
        ? this.greenClock
        : this.greenClock + (this.times.reaction ?? 0);
      const elapsed = this.raceClock - launchClock;
      if (this.times.sixty == null && playerDistance >= 18.288) this.times.sixty = elapsed;
      if (this.times.eighth == null && playerDistance >= 201.168) this.times.eighth = elapsed;
      if (this.times.quarter == null && playerDistance >= QUARTER_M) {
        this.times.quarter = elapsed;
      }
      if (this.times.finish == null && playerDistance >= this.raceDistanceM) {
        this.times.finish = elapsed;
        this.times.trapKmh = pt.speedKmh;
      }
    }

    if (this.greenClock != null && this.opponentStartMoved) {
      const launchClock = this.isRollingStart
        ? this.greenClock
        : this.greenClock + (this.opponentTimes.reaction ?? 0);
      const elapsed = this.raceClock - launchClock;
      if (this.opponentTimes.sixty == null && opponentDistance >= 18.288) this.opponentTimes.sixty = elapsed;
      if (this.opponentTimes.eighth == null && opponentDistance >= 201.168) this.opponentTimes.eighth = elapsed;
      if (this.opponentTimes.quarter == null && opponentDistance >= QUARTER_M) {
        this.opponentTimes.quarter = elapsed;
      }
      if (this.opponentTimes.finish == null && opponentDistance >= this.raceDistanceM) {
        this.opponentTimes.finish = elapsed;
        this.opponentTimes.trapKmh = ot.speedKmh;
      }
    }

    if (this.greenClock != null && playerDistance >= this.raceDistanceM && this.playerFinishClock == null) {
      this.playerFinishClock = this.raceClock;
      this.firstFinishClock ??= this.raceClock;
    }
    if (this.greenClock != null && opponentDistance >= this.raceDistanceM && this.opponentFinishClock == null) {
      this.opponentFinishClock = this.raceClock;
      this.firstFinishClock ??= this.raceClock;
    }

    if (!this.finished) {
      const bothFinished = this.playerFinishClock != null && this.opponentFinishClock != null;
      const dqComplete = this.falseStart && this.opponentFinishClock != null;
      const finishTimeout = this.firstFinishClock != null && this.raceClock - this.firstFinishClock > 4.0;
      if (bothFinished || dqComplete || finishTimeout) this.finished = true;
    }
  }

  addResultBackground(textureKey, depth = 100, accent = 0x45d7ff) {
    // The race canvas is wider than 16:9. Keep the full 16:9 artwork visible
    // inside a centred hero card rather than cover-scaling and cropping it.
    this.add.rectangle(780, 360, 1560, 720, 0x01040a, 0.88)
      .setDepth(depth - 2)
      .setScrollFactor(0);

    this.add.rectangle(
      RESULT_FRAME.x,
      RESULT_FRAME.y,
      RESULT_FRAME.w + 18,
      RESULT_FRAME.h + 18,
      0x020711,
      0.96
    ).setDepth(depth - 1)
      .setScrollFactor(0);

    if (!this.textures.exists(textureKey)) {
      this.add.rectangle(
        RESULT_FRAME.x,
        RESULT_FRAME.y,
        RESULT_FRAME.w,
        RESULT_FRAME.h,
        0x050914,
        1
      ).setDepth(depth)
        .setScrollFactor(0);

      this.resultFrameMaskShape?.destroy?.();
      this.resultFrameMaskShape = this.make.graphics({ add: false });
      this.resultFrameMaskShape.fillStyle(0xffffff, 1);
      this.resultFrameMaskShape.fillRect(
        RESULT_FRAME.x - RESULT_FRAME.w / 2,
        RESULT_FRAME.y - RESULT_FRAME.h / 2,
        RESULT_FRAME.w,
        RESULT_FRAME.h
      );
      this.resultFrameMask = this.resultFrameMaskShape.createGeometryMask();

      this.add.rectangle(
        RESULT_FRAME.x,
        RESULT_FRAME.y,
        RESULT_FRAME.w,
        RESULT_FRAME.h,
        0xffffff,
        0
      ).setStrokeStyle(4, accent, 0.92)
        .setDepth(depth + 20)
        .setScrollFactor(0);

      return false;
    }

    const image = this.add.image(
      RESULT_FRAME.x,
      RESULT_FRAME.y,
      textureKey
    ).setDepth(depth)
      .setScrollFactor(0);

    const source = this.textures.get(textureKey).getSourceImage();
    const fitScale = Math.min(
      RESULT_FRAME.w / source.width,
      RESULT_FRAME.h / source.height
    );

    image.setScale(fitScale);

    this.resultFrameMaskShape?.destroy?.();
    this.resultFrameMaskShape = this.make.graphics({ add: false });
    this.resultFrameMaskShape.fillStyle(0xffffff, 1);
    this.resultFrameMaskShape.fillRect(
      RESULT_FRAME.x - image.displayWidth / 2,
      RESULT_FRAME.y - image.displayHeight / 2,
      image.displayWidth,
      image.displayHeight
    );
    this.resultFrameMask = this.resultFrameMaskShape.createGeometryMask();

    this.add.rectangle(
      RESULT_FRAME.x,
      RESULT_FRAME.y,
      image.displayWidth,
      image.displayHeight,
      0xffffff,
      0
    ).setStrokeStyle(4, accent, 0.95)
      .setDepth(depth + 20)
      .setScrollFactor(0);

    return true;
  }

  addResultCar(carId, paintColor, x, y, {
    flipX = false,
    lost = false,
    highlight = false,
    depth = 105,
    scaleMul = 1,
  } = {}) {
    const car = cars[carId];
    if (!car?.visual) return null;

    const cfg = car.visual;
    const baseScale = 0.98 * scaleMul;
    const bodyScale = cfg.bodyScale * baseScale;
    const wheelSource = this.textures.get(cfg.wheelKey).getSourceImage();
    const wheelFit = getWheelPairFit(cfg, bodyScale, flipX, wheelSource);
    const renderOffsetY = Number(cfg.renderOffsetY || 0) * bodyScale;

    let groundCorrectionY = 0;
    if (cfg.singleBody && cars.ae86) {
      const reference = cars.ae86.visual;
      const referenceBodyScale = reference.bodyScale * baseScale;
      const referenceWheelSource = this.textures.get(reference.wheelKey).getSourceImage();
      const referenceFit = getWheelPairFit(
        reference,
        referenceBodyScale,
        flipX,
        referenceWheelSource
      );
      const referenceGroundOffset =
        Number(reference.renderOffsetY || 0) * referenceBodyScale +
        Math.max(
          referenceFit.rear.offsetY +
            getWheelContactOffsetY(referenceWheelSource, referenceFit.rear.wheelScale),
          referenceFit.front.offsetY +
            getWheelContactOffsetY(referenceWheelSource, referenceFit.front.wheelScale)
        );
      const heroGroundOffset =
        renderOffsetY +
        Math.max(
          wheelFit.rear.offsetY +
            getWheelContactOffsetY(wheelSource, wheelFit.rear.wheelScale),
          wheelFit.front.offsetY +
            getWheelContactOffsetY(wheelSource, wheelFit.front.wheelScale)
        );
      groundCorrectionY = referenceGroundOffset - heroGroundOffset;
    }

    const displayY = y + renderOffsetY + groundCorrectionY;

    const shadow = this.add.ellipse(
      x,
      displayY,
      300 * scaleMul,
      24 * scaleMul,
      0x000000,
      0.50
    ).setDepth(depth - 2).setScrollFactor(0);

    const rearX = x + wheelFit.rear.offsetX;
    const frontX = x + wheelFit.front.offsetX;
    const rearY = displayY + wheelFit.rear.offsetY;
    const frontY = displayY + wheelFit.front.offsetY;

    const rearWheel = this.add.image(rearX, rearY, cfg.wheelKey)
      .setScale(wheelFit.rear.wheelScale)
      .setDepth(depth)
      .setScrollFactor(0);

    const frontWheel = this.add.image(frontX, frontY, cfg.wheelKey)
      .setScale(wheelFit.front.wheelScale)
      .setDepth(depth)
      .setScrollFactor(0);

    const resultTyreBottom = Math.max(
      rearY + getWheelContactOffsetY(wheelSource, wheelFit.rear.wheelScale),
      frontY + getWheelContactOffsetY(wheelSource, wheelFit.front.wheelScale)
    );
    const resultShadowHeight = shadow.displayHeight;
    shadow.setPosition(x, resultTyreBottom + resultShadowHeight / 6);

    const rearBacking = this.add.circle(
      rearX,
      rearY,
      wheelFit.rear.backingRadius ?? Math.max(9, rearWheel.displayWidth * 0.50),
      0x020304,
      1
    ).setDepth(depth - 0.4).setScrollFactor(0);

    const frontBacking = this.add.circle(
      frontX,
      frontY,
      wheelFit.front.backingRadius ?? Math.max(9, frontWheel.displayWidth * 0.50),
      0x020304,
      1
    ).setDepth(depth - 0.4).setScrollFactor(0);

    const bodyLayers = createCarBodyLayers(this, cfg, {
      x,
      y: displayY,
      scale: bodyScale,
      depth: depth + 1,
      flipX,
      paintColor,
    });

    const decalObjects = carId === this.selectedCarId
      ? createTunerDecalLayers(this, this.playerCarState || {}, {
          x,
          y: displayY,
          displayWidth: bodyLayers.primary.displayWidth,
          displayHeight: bodyLayers.primary.displayHeight,
          depth: depth + 1.04,
          flipX,
        })
      : [];

    const carObjects = [
      shadow,
      rearBacking,
      frontBacking,
      rearWheel,
      frontWheel,
      ...bodyLayers.objects,
      ...decalObjects,
    ];

    carObjects.forEach(obj => {
      obj.setScrollFactor(0);
      if (this.resultFrameMask) obj.setMask(this.resultFrameMask);
    });

    if (lost) {
      const faded = [rearWheel, frontWheel, ...bodyLayers.objects, ...decalObjects];
      faded.forEach(obj => obj.setTint(0x696d74).setAlpha(0.42));
      shadow.setAlpha(0.24);

      this.add.text(x, y + 8, 'LOST', {
        fontFamily: PIXEL_FONT,
        fontSize: '18px',
        color: '#ffe5eb',
        backgroundColor: '#761524dd',
        padding: { x: 11, y: 7 },
      }).setOrigin(0.5)
        .setAngle(-10)
        .setDepth(depth + 4)
        .setScrollFactor(0);
    }

    if (highlight) {
      this.add.text(x, y - 116, 'NEW CAR', {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#fff4fb',
        backgroundColor: '#a81769dd',
        padding: { x: 10, y: 6 },
      }).setOrigin(0.5)
        .setDepth(depth + 4)
        .setScrollFactor(0);
    }

    return {
      shadow,
      rearBacking,
      frontBacking,
      rearWheel,
      frontWheel,
      bodyLayers,
    };
  }

  showResultsOverlay() {
    this.engineAudio?.fadeOut();
    this.resultsShown = true;
    this.controls.enabled = false;
    this.cancelButton?.disableInteractive();
    this.startButton?.disableInteractive();

    const depth = 100;
    const titleFont = PIXEL_FONT;
    const dataFont = BODY_FONT;
    const formatTime = value => value == null ? '—' : value.toFixed(3) + ' s';
    const formatSpeed = value => value == null ? '—' : value.toFixed(1);

    let playerWon = false;
    let opponentWon = false;

    if (this.falseStart) {
      opponentWon = true;
    } else if (this.playerFinishClock != null && this.opponentFinishClock != null) {
      playerWon = this.playerFinishClock <= this.opponentFinishClock;
      opponentWon = !playerWon;
    } else if (this.playerFinishClock != null) {
      playerWon = true;
    } else if (this.opponentFinishClock != null) {
      opponentWon = true;
    }

    const settlement = (playerWon || opponentWon)
      ? this.settleRace(playerWon)
      : null;

    if (playerWon) playVictorySting();
    else stopMusic();

    const isPinkSlip = this.raceDeal === 'PINK_SLIP';
    const competitionCarPrizeWin = Boolean(
      settlement?.competitionWon && settlement?.prizeType === 'CAR'
    );
    const resultBackground = competitionCarPrizeWin
      ? RESULT_BACKGROUNDS.pinkWin
      : isPinkSlip
        ? (playerWon ? RESULT_BACKGROUNDS.pinkWin : RESULT_BACKGROUNDS.pinkLoss)
        : (playerWon ? RESULT_BACKGROUNDS.victory : RESULT_BACKGROUNDS.defeat);

    const accent = playerWon ? 0x45d7ff : 0xff4f7d;
    const hasHeroBackground = this.addResultBackground(
      resultBackground.key,
      depth,
      accent
    );

    if (!hasHeroBackground) {
      const fallbackTitle = competitionCarPrizeWin
        ? 'PINK SLIP WON'
        : isPinkSlip
          ? (playerWon ? 'PINK SLIP WON' : 'PINK SLIP LOST')
          : (playerWon ? 'YOU WIN' : 'YOU LOSE');

      this.add.text(780, 116, fallbackTitle, {
        fontFamily: titleFont,
        fontSize: '24px',
        color: playerWon ? '#56ebff' : '#ff5f86',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0);

      this.add.rectangle(780, 290, 560, 138, 0x081522, 0.94)
        .setStrokeStyle(2, accent, 0.9)
        .setDepth(depth + 2)
        .setScrollFactor(0);
    }

    // These stay dynamic so the same art works for every district and time of day.
    this.add.text(184, 25, 'TOKYO SHIFT // RACE RESULT', {
      fontFamily: titleFont,
      fontSize: '7px',
      color: '#dff5ff',
      backgroundColor: '#04101bcc',
      padding: { x: 7, y: 4 },
    }).setDepth(depth + 8).setScrollFactor(0);

    this.add.text(
      1376,
      25,
      this.raceDistrict + ' // ' + this.raceLocationLabel + ' // ' + this.raceTimeOfDay.toUpperCase(),
      {
        fontFamily: titleFont,
        fontSize: '7px',
        color: '#b3cad7',
        backgroundColor: '#04101bcc',
        padding: { x: 7, y: 4 },
      }
    ).setOrigin(1, 0).setDepth(depth + 8).setScrollFactor(0);

    const reward = (() => {
      if (!settlement) {
        return { primary: 'RACE COMPLETE', secondary: '' };
      }

      if (settlement.teamChallenge) {
        if (settlement.teamChallengeFailed) {
          return {
            primary: 'CHALLENGE\nPAUSED',
            secondary: settlement.progress + ' / 7 DEFEATED // YOU CAN RESUME LATER',
          };
        }

        if (settlement.teamChallengeContinues) {
          return {
            primary: 'RACER ' + settlement.stageNumber + '\nDEFEATED',
            secondary: settlement.progress + ' / 7 CLEARED // NEXT CHALLENGER READY',
          };
        }

        if (settlement.teamChallengeCompleted) {
          return {
            primary: settlement.teamChallengePerfect
              ? 'PERFECT 7–0\n+¥' + Number(settlement.perfectReward || 0).toLocaleString('en-US')
              : 'TEAM\nCLEARED',
            secondary: (settlement.shopLabel || 'TUNER SHOP') + ' ACCESS UNLOCKED',
          };
        }
      }

      if (settlement.competition) {
        if (settlement.competitionFailed) {
          return {
            primary: 'STREAK\nBROKEN',
            secondary: 'COMPETITION OVER // ROUND ' + settlement.roundNumber + '/3',
          };
        }

        if (settlement.competitionContinues) {
          return {
            primary: 'ROUND ' + settlement.roundNumber + '\nCLEARED',
            secondary: (3 - settlement.roundNumber) + ' RACE' +
              ((3 - settlement.roundNumber) === 1 ? '' : 'S') +
              ' TO GRAND PRIZE',
          };
        }

        if (settlement.competitionWon && settlement.prizeType === 'CAR') {
          return {
            primary: 'GRAND PRIZE\nWON',
            secondary: cars[settlement.prizeCarId].shortName + ' ADDED TO GARAGE',
          };
        }

        if (settlement.competitionWon) {
          return {
            primary: '+¥' + Number(settlement.prizeCash || 0).toLocaleString('en-US'),
            secondary: 'COMPETITION CLEARED // BALANCE  ¥' +
              Number(settlement.cash || 0).toLocaleString('en-US'),
          };
        }
      }

      if (isPinkSlip) {
        if (playerWon) {
          return {
            primary: 'NEW CAR WON',
            secondary: cars[this.opponentCarId].shortName + ' ADDED TO GARAGE',
          };
        }

        return {
          primary: 'YOUR CAR IS GONE',
          secondary: cars[this.selectedCarId].shortName + ' LOST',
        };
      }

      const delta = settlement.cashDelta;
      return {
        primary: (delta >= 0 ? '+¥' : '-¥') + Math.abs(delta).toLocaleString('en-US'),
        secondary: 'BALANCE  ¥' + settlement.cash.toLocaleString('en-US'),
      };
    })();

    // Fill the empty reward board in the uploaded art. Keep the balance clearly
    // below the board's divider line.
    const competitionMultilineText =
      Boolean(settlement?.competition || settlement?.teamChallenge) && reward.primary.includes('\n');
    this.add.text(780, competitionMultilineText ? 266 : 274, reward.primary, {
      fontFamily: titleFont,
      fontSize: competitionMultilineText
        ? '15px'
        : (isPinkSlip || competitionCarPrizeWin ? '20px' : '30px'),
      color: playerWon ? '#f1ffff' : '#fff1f5',
      align: 'center',
      lineSpacing: 4,
      wordWrap: { width: 500 },
    }).setOrigin(0.5).setDepth(depth + 9).setScrollFactor(0);

    this.add.text(780, 347, reward.secondary, {
      fontFamily: titleFont,
      fontSize: '9px',
      color: playerWon ? '#a3f0ff' : '#ffb6c9',
      align: 'center',
      wordWrap: { width: 570 },
    }).setOrigin(0.5).setDepth(depth + 9).setScrollFactor(0);

    // Push both cars outward, higher, and larger. Their rear quarters can clip
    // behind the hero-card frame, which makes the shot feel more photographic
    // while leaving the centre clear for the timing slip.
    this.addResultCar(
      this.selectedCarId,
      this.playerPaintColor,
      205,
      370,
      {
        flipX: false,
        // Pink-slip losses keep both cars fully present for the handover
        // tableau; the winner celebration tells the story instead of fading
        // the player's car out.
        lost: false,
        depth: depth + 5,
        scaleMul: 1.38,
      }
    );

    this.addResultCar(
      this.opponentCarId,
      this.opponentPaintColor,
      1355,
      370,
      {
        flipX: true,
        highlight: (isPinkSlip && playerWon) || competitionCarPrizeWin,
        depth: depth + 5,
        scaleMul: 1.38,
      }
    );

    const playerCharacter = characters[this.playerCharacterId] || characters.renMizuno;
    const rivalCharacter = characters[this.opponentCharacterId] || characters.kaitoFujimori;

    const playerDisplayName = [
      String(this.registry.get('firstName') || '').trim(),
      String(this.registry.get('lastName') || '').trim(),
    ].filter(Boolean).join(' ') || playerCharacter.name;

    const rivalDisplayName = rivalCharacter.name;

    const quoteFor = (character, won) => {
      const quote = won ? character?.resultQuotes?.win : character?.resultQuotes?.loss;
      if (quote) return quote;
      return won ? 'That was clean.' : 'Next run will be different.';
    };

    const addPortrait = (
      character,
      won,
      x,
      accentColour,
      role,
      displayName,
      footerOverride = null
    ) => {
      const size = 188;
      const y = 532;
      const visual = character?.visual || {};
      const poseKey = won ? visual.winSpriteKey : visual.lossSpriteKey;
      const spriteKey = poseKey && this.textures.exists(poseKey)
        ? poseKey
        : visual.spriteKey;

      this.add.rectangle(x, y, size, size, 0x06101a, 0.95)
        .setDepth(depth + 11)
        .setScrollFactor(0);

      if (spriteKey && this.textures.exists(spriteKey)) {
        const profile = createCharacterProfile(this, {
          characterId: character.id,
          pose: won ? 'win' : 'loss',
          x,
          y,
          frameWidth: size,
          frameHeight: size,
          side: x < 780 ? 'left' : 'right',
          depth: depth + 12,
          flipInward: true,
        });
        profile?.image?.setScrollFactor(0);
      }

      this.add.rectangle(x, y, size, size, 0xffffff, 0)
        .setStrokeStyle(3, accentColour, 0.98)
        .setDepth(depth + 13)
        .setScrollFactor(0);

      // Dedicated nameplate below the portrait: never covers the character art.
      this.add.rectangle(x, 640, size + 12, 34, 0x06101d, 0.97)
        .setStrokeStyle(1, accentColour, 0.82)
        .setDepth(depth + 13)
        .setScrollFactor(0);

      this.add.text(
        x,
        640,
        String(displayName || character?.name || role).toUpperCase(),
        {
          fontFamily: titleFont,
          fontSize: '6px',
          color: '#f3fbff',
          align: 'center',
        }
      ).setOrigin(0.5)
        .setDepth(depth + 14)
        .setScrollFactor(0);

      const footerText = footerOverride || ('“' + quoteFor(character, won) + '”');
      this.add.text(x, 665, footerText, {
        fontFamily: footerOverride ? titleFont : dataFont,
        fontSize: footerOverride ? '9px' : '8px',
        color: footerOverride ? '#ff8fb7' : '#d9e7ee',
        backgroundColor: '#06101dcc',
        padding: { x: 7, y: 4 },
        align: 'center',
        wordWrap: { width: 250 },
      }).setOrigin(0.5, 0)
        .setDepth(depth + 14)
        .setScrollFactor(0);
    };

    const pinkLossCelebration = isPinkSlip && !playerWon;

    addPortrait(
      playerCharacter,
      pinkLossCelebration ? true : playerWon,
      315,
      0x45d7ff,
      'YOU',
      playerDisplayName
    );
    addPortrait(
      rivalCharacter,
      pinkLossCelebration ? true : opponentWon,
      1245,
      0xff4f92,
      'RIVAL',
      rivalDisplayName,
      pinkLossCelebration ? 'WON YOUR CAR' : null
    );

    // Larger timing slip with more breathing room between every row.
    this.add.rectangle(780, 520, 520, 230, 0x06111d, 0.91)
      .setStrokeStyle(2, 0x315b73, 0.92)
      .setDepth(depth + 11)
      .setScrollFactor(0);

    this.add.text(635, 418, cars[this.selectedCarId].shortName, {
      fontFamily: titleFont,
      fontSize: '9px',
      color: '#8feaff',
    }).setOrigin(0.5).setDepth(depth + 12).setScrollFactor(0);

    this.add.text(925, 418, cars[this.opponentCarId].shortName, {
      fontFamily: titleFont,
      fontSize: '9px',
      color: '#ff94ba',
    }).setOrigin(0.5).setDepth(depth + 12).setScrollFactor(0);

    const rows = this.isRollingStart
      ? [
          ['1/8 SPLIT', this.falseStart ? '—' : formatTime(this.times.eighth), formatTime(this.opponentTimes.eighth)],
          ['1/4 SPLIT', this.falseStart ? '—' : formatTime(this.times.quarter), formatTime(this.opponentTimes.quarter)],
          [this.raceDistanceLabel, this.falseStart ? '—' : formatTime(this.times.finish), formatTime(this.opponentTimes.finish)],
          ['TRAP KM/H', this.falseStart ? '—' : formatSpeed(this.times.trapKmh), formatSpeed(this.opponentTimes.trapKmh)],
        ]
      : [
          ['REACTION', this.falseStart ? 'DQ' : formatTime(this.times.reaction), formatTime(this.opponentTimes.reaction)],
          ['60 FT', this.falseStart ? '—' : formatTime(this.times.sixty), formatTime(this.opponentTimes.sixty)],
          [this.raceDistanceLabel, this.falseStart ? '—' : formatTime(this.times.finish), formatTime(this.opponentTimes.finish)],
          ['TRAP KM/H', this.falseStart ? '—' : formatSpeed(this.times.trapKmh), formatSpeed(this.opponentTimes.trapKmh)],
        ];

    rows.forEach((row, i) => {
      const y = 463 + i * 49;

      if (i > 0) {
        this.add.rectangle(780, y - 24, 470, 1, 0x547285, 0.30)
          .setDepth(depth + 11)
          .setScrollFactor(0);
      }

      this.add.text(780, y, row[0], {
        fontFamily: dataFont,
        fontSize: '8px',
        color: '#8ea4b3',
        fontStyle: '700',
      }).setOrigin(0.5).setDepth(depth + 12).setScrollFactor(0);

      this.add.text(635, y, row[1], {
        fontFamily: dataFont,
        fontSize: '10px',
        color: '#e7fbff',
        fontStyle: '700',
      }).setOrigin(0.5).setDepth(depth + 12).setScrollFactor(0);

      this.add.text(925, y, row[2], {
        fontFamily: dataFont,
        fontSize: '10px',
        color: '#ffe6ef',
        fontStyle: '700',
      }).setOrigin(0.5).setDepth(depth + 12).setScrollFactor(0);
    });

    // One clear action keeps the result screen feeling like a hero moment.
    const button = this.add.rectangle(780, 686, 390, 44, 0x07111d, 0.97)
      .setStrokeStyle(3, accent, 0.96)
      .setDepth(depth + 15)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    const returnScene = this.registry.get('raceReturnScene') || 'MeetScene';
    const returnLabel = returnScene === 'CentralTokyoScene'
      ? 'RETURN TO CENTRAL TOKYO  >'
      : 'RETURN TO MEET  >';
    const actionLabel = settlement?.teamChallengeContinues
      ? 'NEXT CHALLENGER BRIEFING // ' + (settlement.progress + 1) + '/7  >'
      : settlement?.competitionContinues
        ? 'NEXT ROUND // ' + (settlement.roundNumber + 1) + '/3  >'
        : returnLabel;

    const buttonText = this.add.text(780, 686, actionLabel, {
      fontFamily: titleFont,
      fontSize: '9px',
      color: '#f5fbff',
      fontStyle: 'bold',
    }).setOrigin(0.5)
      .setDepth(depth + 16)
      .setScrollFactor(0);

    button.on('pointerover', () => button.setFillStyle(accent, 0.18));
    button.on('pointerout', () => button.setFillStyle(0x07111d, 0.97));
    button.on('pointerdown', () => {
      if (settlement?.teamChallengeContinues) {
        this.showNextTunerChallengeBriefing();
      } else if (settlement?.competitionContinues) {
        this.startNextCompetitionRound();
      } else {
        this.scene.start(returnScene);
      }
    });
  }

  getNextTunerChallengeRound() {
    const regionId = String(
      this.registry.get('raceDistrict') || this.registry.get('district') || ''
    ).toUpperCase();
    const state = getTunerTeamChallengeState(this.registry, regionId);
    const round = state.rounds?.[state.stage] || null;
    return { regionId, state, round };
  }

  showNextTunerChallengeBriefing() {
    if (this.tunerChallengeBriefing?.active) return;

    const { regionId, state, round } = this.getNextTunerChallengeRound();
    if (!state.activeSession || !round) {
      this.scene.start(this.registry.get('raceReturnScene') || 'MeetScene');
      return;
    }

    const nextNumber = state.stage + 1;
    const rival = characters[round.characterId] || null;
    const rivalCar = cars[round.carId] || null;
    const distanceLabel = Math.abs(Number(round.distanceM || 0) - QUARTER_M) < 1
      ? '1/4 MILE'
      : Math.abs(Number(round.distanceM || 0) - HALF_MILE_M) < 1
        ? '1/2 MILE'
        : Math.round(Number(round.distanceM || 0)) + ' M';
    const isRoll = round.raceType === 'Roll Race';
    const startAdvice = isRoll
      ? 'ROLLING START // CHOOSE YOUR GEAR BEFORE THE COUNTDOWN ENDS'
      : 'STANDING START // CLUTCH + THROTTLE // WATCH THE TREE';
    const depth = 210;
    const objects = [];
    const add = obj => { objects.push(obj); return obj; };

    const blocker = add(this.add.rectangle(780, 360, 1560, 720, 0x02050b, 0.90)
      .setDepth(depth)
      .setScrollFactor(0)
      .setInteractive());

    const panel = add(this.add.rectangle(780, 360, 900, 590, 0x07111d, 0.998)
      .setStrokeStyle(3, 0xff5f93, 0.98)
      .setDepth(depth + 1)
      .setScrollFactor(0));

    add(this.add.text(780, 104, regionId + ' // TEAM CHALLENGE', {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#ff91b6',
    }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0));

    add(this.add.text(780, 149, 'CHALLENGER ' + nextNumber + ' / 7', {
      fontFamily: PIXEL_FONT,
      fontSize: '20px',
      color: '#fff4f8',
    }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0));

    const portraitBoxX = 515;
    const portraitBoxY = 314;
    add(this.add.rectangle(portraitBoxX, portraitBoxY, 230, 250, 0x06101a, 1)
      .setStrokeStyle(2, 0x315b73, 1)
      .setDepth(depth + 2)
      .setScrollFactor(0));

    const textureKey = rival?.visual?.spriteKey;
    if (textureKey && this.textures.exists(textureKey)) {
      const profile = createCharacterProfile(this, {
        characterId: round.characterId,
        pose: 'idle',
        x: portraitBoxX,
        y: portraitBoxY,
        frameWidth: 224,
        frameHeight: 242,
        side: 'left',
        depth: depth + 3,
        flipInward: true,
      });
      if (profile) {
        profile.image.setScrollFactor(0);
        add(profile.image);
        objects.push(profile.maskShape);
      }
    } else {
      add(this.add.text(portraitBoxX, portraitBoxY, '#' + nextNumber, {
        fontFamily: PIXEL_FONT,
        fontSize: '30px',
        color: '#718fa3',
      }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0));
    }

    add(this.add.text(portraitBoxX, 464, String(rival?.name || 'RIVAL').toUpperCase(), {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#e8f6fc',
      align: 'center',
      wordWrap: { width: 240 },
    }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0));

    const infoX = 785;
    const infoStartY = 235;
    const labelStyle = {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#718fa3',
    };
    const valueStyle = {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#eefaff',
    };

    const rows = [
      ['CAR', rivalCar?.shortName || round.carId],
      ['RACE', String(round.raceType || 'Standing Start').toUpperCase()],
      ['DISTANCE', distanceLabel],
      ['DIFFICULTY', String(round.difficulty || 'HARD').toUpperCase()],
    ];

    rows.forEach((row, index) => {
      const y = infoStartY + index * 62;
      add(this.add.text(infoX, y, row[0], labelStyle)
        .setDepth(depth + 2).setScrollFactor(0));
      add(this.add.text(infoX, y + 25, row[1], valueStyle)
        .setDepth(depth + 2).setScrollFactor(0));
    });

    add(this.add.rectangle(780, 512, 720, 74, isRoll ? 0x10283b : 0x10281e, 0.96)
      .setStrokeStyle(2, isRoll ? 0x45d7ff : 0x62e8c7, 0.95)
      .setDepth(depth + 2)
      .setScrollFactor(0));

    add(this.add.text(780, 500, 'START PROCEDURE', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: isRoll ? '#8fe7ff' : '#8ff0c2',
    }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0));

    add(this.add.text(780, 529, startAdvice, {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#f3fbff',
      align: 'center',
      wordWrap: { width: 670 },
    }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0));

    if (rival?.introQuote) {
      add(this.add.text(780, 575, '“' + rival.introQuote + '”', {
        fontFamily: BODY_FONT,
        fontSize: '11px',
        color: '#a7bac5',
        fontStyle: '600',
        align: 'center',
        wordWrap: { width: 700 },
      }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0));
    }

    add(this.add.text(
      510,
      631,
      state.stage + ' / 7 DEFEATED' +
        (state.perfectEligible !== false ? '  //  PERFECT RUN ACTIVE' : ''),
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: state.perfectEligible !== false ? '#ffe08a' : '#8fa0aa',
      }
    ).setOrigin(0, 0.5).setDepth(depth + 2).setScrollFactor(0));

    const ready = add(this.add.rectangle(1040, 630, 260, 50, 0x321522, 1)
      .setStrokeStyle(2, 0xff5f93, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2)
      .setScrollFactor(0));

    add(this.add.text(1040, 630, 'READY // RACE ' + nextNumber, {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#fff4f8',
    }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0));

    blocker.on('pointerdown', () => {});
    ready.on('pointerover', () => ready.setFillStyle(0x5b2036, 1));
    ready.on('pointerout', () => ready.setFillStyle(0x321522, 1));
    ready.on('pointerdown', () => {
      objects.forEach(obj => obj?.destroy?.());
      this.tunerChallengeBriefing = null;
      this.startNextTunerChallengeRound();
    });

    this.tunerChallengeBriefing = panel;
  }

  startNextTunerChallengeRound() {
    const { regionId, state, round } = this.getNextTunerChallengeRound();

    if (!state.activeSession || !round) {
      this.scene.start(this.registry.get('raceReturnScene') || 'MeetScene');
      return;
    }

    this.registry.set('selectedCarId', state.playerCarId || this.selectedCarId);
    this.registry.set('selectedOpponentCarId', round.carId);
    this.registry.set('selectedOpponentPaintColor', normalisePaintColor(
      round.paintColor,
      DEFAULT_PAINT_COLOR
    ));
    this.registry.set('selectedOpponentCharacterId', round.characterId);
    this.registry.set('selectedOpponentEncounterRating', round.encounterRating);
    this.registry.set('selectedOpponentEncounterAi', round.encounterAi);
    this.registry.set('selectedOpponentDifficulty', round.difficulty);
    this.registry.set('selectedRaceCategory', 'TUNER_TEAM');
    this.registry.set('selectedRaceType', round.raceType);
    this.registry.set('selectedRaceDistanceM', round.distanceM);
    this.registry.set('selectedRaceDeal', 'TUNER_TEAM');
    this.registry.set('selectedRaceStake', 0);
    this.registry.set('selectedRaceSpecialChallenge', false);
    this.registry.set('selectedRaceMeetOffer', null);
    this.registry.set('raceDistrict', regionId);
    this.registry.set('raceLocationLabel', 'TEAM CHALLENGE // ' + (state.stage + 1) + '/7');

    saveSessionState(this.registry);
    this.scene.restart();
  }

  startNextCompetitionRound() {
    const state = this.registry.get('competitionState');
    if (!state?.active) {
      this.scene.start(this.registry.get('raceReturnScene') || 'MeetScene');
      return;
    }

    const index = Number(state.roundIndex || 0);
    const round = state.rounds?.[index];
    if (!round) {
      this.registry.set('competitionState', null);
      saveSessionState(this.registry);
      this.scene.start(this.registry.get('raceReturnScene') || 'MeetScene');
      return;
    }

    this.registry.set('selectedCarId', state.playerCarId);
    this.registry.set('selectedOpponentCarId', round.carId);
    this.registry.set('selectedOpponentPaintColor', round.paintColor);
    this.registry.set('selectedOpponentCharacterId', round.characterId);
    this.registry.set('selectedOpponentEncounterRating', round.encounterRating);
    this.registry.set('selectedOpponentEncounterAi', round.encounterAi);
    this.registry.set('selectedOpponentDifficulty', state.difficulty);
    this.registry.set('selectedRaceCategory', 'COMPETITION');
    this.registry.set('selectedRaceType', round.raceType);
    this.registry.set('selectedRaceDeal', 'COMPETITION');
    this.registry.set('selectedRaceStake', 0);
    this.registry.set('selectedRaceSpecialChallenge', false);
    saveSessionState(this.registry);

    this.scene.restart();
  }

  returnToWorkshop() {
    const cash = Number(this.registry.get('cash') || 0);
    const stranded = Boolean(this.registry.get('meetStranded'));
    const cost = stranded ? TAXI_TO_WORKSHOP_COST : WORKSHOP_RETURN_COST;
    if (cash < cost) return;

    this.registry.set('cash', cash - cost);
    this.registry.set('meetStranded', false);
    saveSessionState(this.registry);
    this.scene.start('GarageScene');
  }

  recordMeetRaceOutcome(playerWon) {
    if (this.raceMode === 'COMPETITION') return;

    const locationId = this.registry.get('meetLocation') || '';
    if (!locationId || !hasRegionalTeam(this.raceDistrict)) return;

    const snapshot = this.registry.get('selectedRaceMeetOffer') || {};
    const rosters = { ...(this.registry.get('meetRosters') || {}) };
    const current = Array.isArray(rosters[locationId])
      ? rosters[locationId].map(offer => ({ ...offer }))
      : [];

    const resultState = playerWon ? 'PLAYER_WIN' : 'PLAYER_LOSS';
    const isPinkSlip = this.raceDeal === 'PINK_SLIP';

    const resultOffer = {
      ...snapshot,
      characterId: this.opponentCharacterId,
      carId: snapshot.carId || this.opponentCarId,
      paintColor: normalisePaintColor(
        snapshot.paintColor ?? this.opponentPaintColor,
        DEFAULT_PAINT_COLOR
      ),
      meetLocation: locationId,
      locked: Boolean(playerWon),
      resultState,
      resultAt: Date.now(),
      pinkSlipResult: isPinkSlip ? resultState : null,
      displayCarId: isPinkSlip
        ? (playerWon ? null : this.selectedCarId)
        : (snapshot.carId || this.opponentCarId),
      displayPaintColor: isPinkSlip && !playerWon
        ? this.playerPaintColor
        : normalisePaintColor(
            snapshot.paintColor ?? this.opponentPaintColor,
            DEFAULT_PAINT_COLOR
          ),
    };

    let index = current.findIndex(
      offer => offer?.characterId === this.opponentCharacterId
    );

    if (index < 0 && Number.isInteger(Number(snapshot.slotIndex))) {
      const requested = Phaser.Math.Clamp(
        Number(snapshot.slotIndex),
        0,
        Math.max(0, current.length - 1)
      );
      if (current.length) index = requested;
    }

    if (index >= 0) {
      current[index] = {
        ...current[index],
        ...resultOffer,
      };
    } else {
      current.push(resultOffer);
    }

    // The meet stage has three physical slots. A special challenger who was
    // not already in the visible trio takes the final slot after the race so
    // their win/loss pose and pink-slip outcome remain visible.
    rosters[locationId] = current.slice(0, 3);
    this.registry.set('meetRosters', rosters);
    this.registry.set('selectedRaceMeetOffer', null);
  }

  settleRace(playerWon) {
    if (this.raceSettlement) return this.raceSettlement;

    const wins = this.registry.get('wins') ?? 0;
    const losses = this.registry.get('losses') ?? 0;
    const oldCash = this.registry.get('cash') ?? 0;

    this.registry.set('wins', wins + (playerWon ? 1 : 0));
    this.registry.set('losses', losses + (playerWon ? 0 : 1));

    // Regional tuner shops progress from wins earned in that region rather than
    // from the global win total. Only regions with an active shop are tracked,
    // so Central Tokyo and future placeholder areas do not pollute save data.
    if (playerWon) {
      const regionId = String(
        this.registry.get('raceDistrict') || this.registry.get('district') || ''
      ).toUpperCase();

      if (getTunerShopForRegion(regionId)) {
        const regionWins = { ...(this.registry.get('regionWins') || {}) };
        regionWins[regionId] = Math.max(0, Number(regionWins[regionId] || 0)) + 1;
        this.registry.set('regionWins', regionWins);
      }
    }

    if (this.raceMode === 'TUNER_TEAM') {
      const regionId = String(
        this.registry.get('raceDistrict') || this.registry.get('district') || ''
      ).toUpperCase();
      const store = { ...(this.registry.get('tunerTeamChallenges') || {}) };
      const current = getTunerTeamChallengeState(this.registry, regionId);
      const stageIndex = Math.max(
        0,
        Math.min(TUNER_TEAM_CHALLENGE_STAGES - 1, Number(current.stage || 0))
      );
      const stageNumber = stageIndex + 1;

      if (!playerWon) {
        store[regionId] = {
          ...current,
          invited: true,
          activeSession: false,
          perfectEligible: false,
          retryNotBefore: Date.now() + 60000,
        };
        this.registry.set('tunerTeamChallenges', store);
        saveSessionState(this.registry);

        this.raceSettlement = {
          playerWon: false,
          cashDelta: 0,
          cash: oldCash,
          pinkMessage: '',
          gameOver: false,
          teamChallenge: true,
          teamChallengeFailed: true,
          teamChallengeContinues: false,
          teamChallengeCompleted: false,
          regionId,
          stageNumber,
          progress: stageIndex,
        };
        return this.raceSettlement;
      }

      const nextStage = stageIndex + 1;

      if (nextStage < TUNER_TEAM_CHALLENGE_STAGES) {
        store[regionId] = {
          ...current,
          invited: true,
          activeSession: true,
          stage: nextStage,
          retryNotBefore: 0,
        };
        this.registry.set('tunerTeamChallenges', store);
        saveSessionState(this.registry);

        this.raceSettlement = {
          playerWon: true,
          cashDelta: 0,
          cash: oldCash,
          pinkMessage: '',
          gameOver: false,
          teamChallenge: true,
          teamChallengeFailed: false,
          teamChallengeContinues: true,
          teamChallengeCompleted: false,
          regionId,
          stageNumber,
          progress: nextStage,
        };
        return this.raceSettlement;
      }

      const perfect = current.perfectEligible !== false;
      const perfectReward = perfect ? TUNER_TEAM_PERFECT_REWARD : 0;
      const newCash = oldCash + perfectReward;
      const shop = getTunerShopForRegion(regionId);

      store[regionId] = {
        ...current,
        invited: true,
        activeSession: false,
        completed: true,
        stage: TUNER_TEAM_CHALLENGE_STAGES,
        completedAt: Date.now(),
        retryNotBefore: 0,
      };
      this.registry.set('tunerTeamChallenges', store);
      this.registry.set('cash', newCash);
      this.registry.set('tunerChallengeRevealPending', regionId);

      if (shop) {
        const progress = { ...(this.registry.get('tunerShopProgress') || {}) };
        progress[shop.id] = {
          ...(progress[shop.id] || {}),
          discovered: true,
          unlockedByChallenge: true,
          unlockedAt: Date.now(),
        };
        this.registry.set('tunerShopProgress', progress);
      }

      saveSessionState(this.registry);

      this.raceSettlement = {
        playerWon: true,
        cashDelta: perfectReward,
        cash: newCash,
        pinkMessage: '',
        gameOver: false,
        teamChallenge: true,
        teamChallengeFailed: false,
        teamChallengeContinues: false,
        teamChallengeCompleted: true,
        teamChallengePerfect: perfect,
        perfectReward,
        regionId,
        stageNumber: TUNER_TEAM_CHALLENGE_STAGES,
        progress: TUNER_TEAM_CHALLENGE_STAGES,
        shopLabel: shop?.label || 'TUNER SHOP',
      };
      return this.raceSettlement;
    }

    const competitionState = this.registry.get('competitionState');

    if (this.raceMode === 'COMPETITION' && competitionState?.active) {
      const state = {
        ...competitionState,
        rounds: [...(competitionState.rounds || [])],
      };
      const roundIndex = Phaser.Math.Clamp(Number(state.roundIndex || 0), 0, 2);
      const roundNumber = roundIndex + 1;

      if (!playerWon) {
        this.registry.set('competitionState', null);
        saveSessionState(this.registry);

        this.raceSettlement = {
          playerWon: false,
          cashDelta: 0,
          cash: oldCash,
          pinkMessage: '',
          gameOver: false,
          competition: true,
          competitionFailed: true,
          competitionContinues: false,
          competitionWon: false,
          roundNumber,
        };
        return this.raceSettlement;
      }

      if (roundIndex < 2) {
        state.roundIndex = roundIndex + 1;
        this.registry.set('competitionState', state);
        saveSessionState(this.registry);

        this.raceSettlement = {
          playerWon: true,
          cashDelta: 0,
          cash: oldCash,
          pinkMessage: '',
          gameOver: false,
          competition: true,
          competitionFailed: false,
          competitionContinues: true,
          competitionWon: false,
          roundNumber,
        };
        return this.raceSettlement;
      }

      let newCash = oldCash;
      let prizeCash = 0;
      let prizeCarId = null;

      if (state.prizeType === 'CAR' && state.prizeCarId && cars[state.prizeCarId]) {
        prizeCarId = state.prizeCarId;
        const ownedCarIds = [...(this.registry.get('ownedCarIds') || [])];
        const carStates = { ...(this.registry.get('carStates') || {}) };
        const carGarageLocations = { ...(this.registry.get('carGarageLocations') || {}) };

        if (!ownedCarIds.includes(prizeCarId)) {
          ownedCarIds.push(prizeCarId);
          carStates[prizeCarId] = {
            ...this.opponentBuildState,
            acquiredVia: 'competition',
          };
          carGarageLocations[prizeCarId] =
            this.registry.get('workshopLocationId') || 'shinonomeWorkshop';

          this.registry.set('ownedCarIds', ownedCarIds);
          this.registry.set('carStates', carStates);
          this.registry.set('carGarageLocations', carGarageLocations);
        }
      } else {
        prizeCash = Number(state.prizeCash || 0);
        newCash = oldCash + prizeCash;
        this.registry.set('cash', newCash);
      }

      this.registry.set('competitionState', null);
      saveSessionState(this.registry);

      this.raceSettlement = {
        playerWon: true,
        cashDelta: newCash - oldCash,
        cash: newCash,
        pinkMessage: '',
        gameOver: false,
        competition: true,
        competitionFailed: false,
        competitionContinues: false,
        competitionWon: true,
        roundNumber: 3,
        prizeType: state.prizeType,
        prizeCash,
        prizeCarId,
      };
      return this.raceSettlement;
    }

    if (playerWon) {
      const locationId = this.registry.get('meetLocation') || '';
      const rivalKey = locationId + ':' + this.opponentCharacterId;
      const defeated = new Set(this.registry.get('defeatedRivalKeys') || []);
      defeated.add(rivalKey);
      this.registry.set('defeatedRivalKeys', [...defeated]);
    }

    let cashDelta = 0;
    let pinkMessage = '';
    let gameOver = false;

    if (this.raceDeal === 'PINK_SLIP') {
      let ownedCarIds = [...(this.registry.get('ownedCarIds') || [])];
      const carStates = { ...(this.registry.get('carStates') || {}) };
      const carGarageLocations = { ...(this.registry.get('carGarageLocations') || {}) };

      if (playerWon) {
        if (!ownedCarIds.includes(this.opponentCarId)) {
          ownedCarIds.push(this.opponentCarId);
          carStates[this.opponentCarId] = {
            ...this.opponentBuildState,
            acquiredVia: 'pinkSlip',
          };
          carGarageLocations[this.opponentCarId] =
            this.registry.get('workshopLocationId') || 'shinonomeWorkshop';
          pinkMessage = 'PINK SLIP WON // ' + cars[this.opponentCarId].shortName + ' ADDED TO GARAGE';
        } else {
          pinkMessage = 'PINK SLIP WON // ' + cars[this.opponentCarId].shortName + ' ALREADY OWNED';
        }
      } else {
        ownedCarIds = ownedCarIds.filter(id => id !== this.selectedCarId);
        delete carStates[this.selectedCarId];
        delete carGarageLocations[this.selectedCarId];
        pinkMessage = 'PINK SLIP LOST // ' + cars[this.selectedCarId].shortName + ' TAKEN';

        if (ownedCarIds.length) {
          this.registry.set('selectedCarId', ownedCarIds[0]);
          this.registry.set('meetStranded', true);
        } else {
          this.registry.set('selectedCarId', null);
          this.registry.set('meetStranded', false);
          gameOver = true;
        }
      }

      if (playerWon) this.registry.set('meetStranded', false);
      this.registry.set('ownedCarIds', ownedCarIds);
      this.registry.set('carStates', carStates);
      this.registry.set('carGarageLocations', carGarageLocations);
      this.registry.set('gameOver', gameOver);

      if (this.registry.get('selectedRaceSpecialChallenge')) {
        this.registry.set('specialChallenger', null);
        this.registry.set('selectedRaceSpecialChallenge', false);
      }
    } else if (this.raceMode === 'SINGLE' && this.raceDeal === 'BET') {
      cashDelta = playerWon ? this.raceStake : -this.raceStake;
    }

    const newCash = Math.max(0, oldCash + cashDelta);
    this.registry.set('cash', newCash);

    this.recordMeetRaceOutcome(playerWon);
    saveSessionState(this.registry);

    this.raceSettlement = {
      playerWon,
      cashDelta: newCash - oldCash,
      cash: newCash,
      pinkMessage,
      gameOver,
    };
    return this.raceSettlement;
  }

  drawScene(pt, ot, dt) {
    const W = 1560;

    // Keep the cars farther into frame so a faster car remains visible while
    // it passes. With the current sprite widths, 34% puts the noses just shy
    // of centre screen for most cars.
    const targetPlayerX = W * 0.34;
    const chaseCameraPx = pt.positionM * PX_PER_M - targetPlayerX;

    // After the first car crosses the line, follow for a few more frames, then
    // lock the scenery while the cars keep travelling. They visibly shoot out
    // of the frozen finish-line frame before the result card arrives.
    const finishElapsed = this.firstFinishClock == null
      ? 0
      : this.raceClock - this.firstFinishClock;

    if (finishElapsed >= 0.30 && this.finishCameraPx == null) {
      this.finishCameraPx = chaseCameraPx;
    }

    const cameraPx = this.finishCameraPx == null
      ? chaseCameraPx
      : this.finishCameraPx;

    this.environment.update(cameraPx, pt.speedKmh);

    this.worldG.clear();
    const finishX = this.finishTargetM * PX_PER_M - cameraPx;
    if (finishX > -60 && finishX < W + 60) {
      for (let y = 272; y < 498; y += 20) {
        this.worldG.fillStyle(((y / 20) % 2) ? 0xffffff : 0x151515, 1).fillRect(finishX, y, 16, 20);
        this.worldG.fillStyle(((y / 20) % 2) ? 0x151515 : 0xffffff, 1).fillRect(finishX + 16, y, 16, 20);
      }
    }

    const px = pt.positionM * PX_PER_M - cameraPx;
    const rawOppX = ot.positionM * PX_PER_M - cameraPx;
    const ox = rawOppX + this.playerVisual.noseOffsetPx - this.opponentVisual.noseOffsetPx;

    // R8: both lanes sit lower on the road. The previous top-lane position
    // made the rival look like it was floating against the rear barrier.
    this.updateCarVisual(this.playerVisual, px, 418, pt, dt);
    this.updateCarVisual(this.opponentVisual, ox, 351, ot, dt);

    this.drawEffects(pt, ot);
    this.drawTree(cameraPx);
  }

  updateCarVisual(v, x, y, t, dt) {
    const c = v.cfg;
    const bodyY =
      y +
      (v.renderOffsetY || 0) +
      (v.groundCorrectionY || 0) +
      Phaser.Math.Clamp(t.accelerationMps2 * 0.8, -2, 4);
    (v.bodyObjects || [v.body]).forEach(obj => obj.setPosition(x, bodyY));
    if (v.driverSilhouette) {
      v.driverSilhouette.setPosition(
        x + v.driverOffsetX,
        bodyY + v.driverOffsetY
      );
    }

    const rearX = x + v.wheelFit.rear.offsetX;
    const frontX = x + v.wheelFit.front.offsetX;
    const rearY = bodyY + v.wheelFit.rear.offsetY;
    const frontY = bodyY + v.wheelFit.front.offsetY;

    v.wheelAngle += ((t.wheelRPM || 0) / 60) * Math.PI * 2 * dt;
    v.rearWheelBacking.setPosition(rearX, rearY);
    v.frontWheelBacking.setPosition(frontX, frontY);
    v.rearWheel.setPosition(rearX, rearY).setRotation(v.wheelAngle);
    v.frontWheel.setPosition(frontX, frontY).setRotation(v.wheelAngle);
    const wheelSource = this.textures.get(c.wheelKey).getSourceImage();
    const wheelBaseY = Math.max(
      rearY + getWheelContactOffsetY(wheelSource, v.wheelFit.rear.wheelScale),
      frontY + getWheelContactOffsetY(wheelSource, v.wheelFit.front.wheelScale)
    );
    const shadowHeight = v.roadShadow.displayHeight;
    // Put the tyre contact point one-third of the way down into the shadow:
    // the shadow's upper third overlaps the base of the wheels, grounding the car.
    v.roadShadow.setPosition(x, wheelBaseY + shadowHeight / 6);

    v.rearX = rearX;
    v.rearY = rearY;
    v.frontX = frontX;
    v.frontY = frontY;
    v.exhaustX = x + c.exhaustOffsetX * v.bodyScale;
    v.exhaustY = bodyY + c.exhaustOffsetY * v.bodyScale;
  }

  drawEffects(pt, ot) {
    this.fxG.clear();

    const smoke = (v, amount) => {
      for (let i = 0; i < 4; i++) {
        this.fxG.fillStyle(0xdde5ef, 0.10 + amount * 0.12)
          .fillCircle(v.rearX - 12 - i * 9, v.rearY + 8 - i * 3, 4 + amount * 8 + i * 1.5);
      }
    };

    if (pt.wheelspin) smoke(this.playerVisual, Phaser.Math.Clamp(pt.slipRatio, 0, 1));
    if (ot.wheelspin) smoke(this.opponentVisual, Phaser.Math.Clamp(ot.slipRatio, 0, 1));

    if (pt.nosActive) {
      const x = this.playerVisual.exhaustX;
      const y = this.playerVisual.exhaustY;
      this.fxG.fillStyle(0x58d9ff, 0.92).fillTriangle(x, y, x - 28, y - 6, x - 28, y + 6);
      this.fxG.fillStyle(0xffffff, 0.82).fillTriangle(x - 4, y, x - 17, y - 3, x - 17, y + 3);
    }
  }

  drawTree(cameraPx) {
    if (this.isRollingStart) {
      this.treeSprite.setVisible(false);
      this.treeLightsG.clear();
      return;
    }

    const treeX = TREE_START_M * PX_PER_M - cameraPx;
    const treeY = 192;
    const s = 0.105;
    const visible = treeX > -100 && treeX < 1660;

    this.treeSprite.setVisible(visible);
    this.treeLightsG.clear();
    if (!visible) return;

    this.treeSprite.setPosition(treeX, treeY);

    const phase = this.racePhase();
    const sourceW = 1086;
    const sourceH = 1448;
    const left = treeX - sourceW * s / 2;
    const top = treeY - sourceH * s / 2;
    const point = (sx, sy) => ({ x: left + sx * s, y: top + sy * s });

    const onlyGreen = phase === 'GREEN' && !this.falseStart;
    const onlyRed = this.falseStart;

    const lamps = [
      { x: 411, y: 130, r: 43, on: !onlyGreen && !onlyRed && ['PRE-STAGE','STAGE','AMBER 1','AMBER 2','AMBER 3'].includes(phase) },
      { x: 675, y: 130, r: 43, on: !onlyGreen && !onlyRed && ['PRE-STAGE','STAGE','AMBER 1','AMBER 2','AMBER 3'].includes(phase) },
      { x: 411, y: 284, r: 44, on: !onlyGreen && !onlyRed && ['STAGE','AMBER 1','AMBER 2','AMBER 3'].includes(phase) },
      { x: 675, y: 284, r: 44, on: !onlyGreen && !onlyRed && ['STAGE','AMBER 1','AMBER 2','AMBER 3'].includes(phase) },
      { x: 433, y: 466, r: 52, on: !onlyGreen && !onlyRed && ['AMBER 1','AMBER 2','AMBER 3'].includes(phase) },
      { x: 653, y: 466, r: 52, on: !onlyGreen && !onlyRed && ['AMBER 1','AMBER 2','AMBER 3'].includes(phase) },
      { x: 432, y: 632, r: 52, on: !onlyGreen && !onlyRed && ['AMBER 2','AMBER 3'].includes(phase) },
      { x: 653, y: 632, r: 52, on: !onlyGreen && !onlyRed && ['AMBER 2','AMBER 3'].includes(phase) },
      { x: 432, y: 797, r: 52, on: !onlyGreen && !onlyRed && phase === 'AMBER 3' },
      { x: 653, y: 797, r: 52, on: !onlyGreen && !onlyRed && phase === 'AMBER 3' },
      { x: 429, y: 959, r: 55, on: onlyGreen },
      { x: 657, y: 959, r: 55, on: onlyGreen },
      { x: 429, y: 1119, r: 55, on: onlyRed },
      { x: 656, y: 1119, r: 55, on: onlyRed },
    ];

    for (const lamp of lamps) {
      if (lamp.on) continue;
      const p = point(lamp.x, lamp.y);
      this.treeLightsG.fillStyle(0x05080d, 0.92).fillCircle(p.x, p.y, lamp.r * s);
    }
  }
}
