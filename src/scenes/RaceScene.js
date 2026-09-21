import Vehicle from '../vehicles/Vehicle.js?v=20260921-r55';
import TouchControls from '../input/TouchControls.js?v=20260921-r43';
import DragRacingAI from '../ai/DragRacingAI.js?v=20260921-r43';
import RaceHUD from '../ui/RaceHUD.js?v=20260921-r43';
import DebugHUD from '../ui/DebugHUD.js';
import TokyoExpresswayBackground from '../environment/TokyoExpresswayBackground.js?v=20260921-r49';
import { cars, carOrder } from '../data/cars.js?v=20260921-r55';
import { engines } from '../data/engines.js?v=20260921-r43';
import { applyEngineTuning } from '../data/tuning.js?v=20260921-r55';
import { characters } from '../data/characters.js?v=20260921-r43';
import { WORKSHOP_RETURN_COST } from '../data/meetAssets.js?v=20260921-r54';
import { saveSessionState, saveManualState, restoreManualSave, readManualSave, clearAllSaves } from '../state/GameState.js?v=20260921-r57';
import { playRaceMusic, playVictorySting, stopMusic } from '../audio/MusicManager.js?v=20260921-r57';
import EngineAudioSystem from '../audio/EngineAudioSystem.js?v=20260921-r57';

const TRACK_M = 402.336;
const PX_PER_M = 76.0;
const TREE_START_M = 4.72;
const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const clone = value => JSON.parse(JSON.stringify(value));

export default class RaceScene extends Phaser.Scene {
  constructor() { super('RaceScene'); }

  preload() {
    const queueImage = (key, path) => {
      if (!this.textures.exists(key)) this.load.image(key, path);
    };

    queueImage('hudCluster', 'assets/Ui/hud_cluster.png');
    queueImage('dragTree', 'assets/Ui/drag_tree.png');
    queueImage('clutchPedal', 'assets/Controls/clutch_pedal.png');
    queueImage('throttlePedal', 'assets/Controls/throttle_pedal.png');
    queueImage('nosButton', 'assets/Controls/nos_button.png');
    queueImage('shifterNeutral', 'assets/Controls/shifter_neutral.png');
    queueImage('shifterDown', 'assets/Controls/shifter_down.png');
  }

  init() {
    this.selectedCarId = this.registry.get('selectedCarId') || 'ae86';
    if (!cars[this.selectedCarId]) this.selectedCarId = 'ae86';

    const rivals = carOrder.filter(id => id !== this.selectedCarId);
    const chosenOpponent = this.registry.get('selectedOpponentCarId');
    this.opponentCarId = rivals.includes(chosenOpponent)
      ? chosenOpponent
      : Phaser.Utils.Array.GetRandom(rivals);

    this.opponentCharacterId = this.registry.get('selectedOpponentCharacterId') || 'kaitoFujimori';
    this.raceMode = this.registry.get('selectedRaceCategory') || 'SINGLE';
    this.raceType = this.registry.get('selectedRaceType') || 'Standing Start';
    this.isRollingStart = this.raceType === 'Roll Race';
    this.raceDeal = this.registry.get('selectedRaceDeal') || 'BET';
    this.raceStake = Number(this.registry.get('selectedRaceStake') || 0);
    this.raceTimeOfDay = this.registry.get('raceTimeOfDay') || 'night';
    this.raceDistrict = this.registry.get('raceDistrict') || this.registry.get('district') || 'WANGAN';
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
    this.engineAudio = new EngineAudioSystem(playerConfig.engine, opponentConfig.engine);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.engineAudio?.destroy());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.engineAudio?.destroy());

    // Stay staged and stationary until the player actually starts the race.
    // Roll-race speed is injected only when START ROLL is pressed.
    this.player.transmission.currentGear = 0;
    this.player.transmission.lastShiftQuality = 'NEUTRAL';
    this.opponent.transmission.currentGear = 1;
    this.opponent.transmission.lastShiftQuality = 'STAGED';

    const rivalAI = rivalCharacter?.skill?.ai ?? {
      reactionSkill: 0.78,
      launchSkill: 0.76,
      shiftSkill: 0.78,
      aggression: 0.78,
    };
    this.ai = new DragRacingAI(this.opponent, rivalAI);

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
    this.startMoved = false;
    this.times = { reaction: null, sixty: null, eighth: null, quarter: null, trapKmh: null };
    this.opponentTimes = { reaction: null, sixty: null, eighth: null, quarter: null, trapKmh: null };
    this.opponentStartMoved = false;
    this.opponentFinishClock = null;
    this.playerFinishClock = null;
    this.resultsShown = false;
    this.firstFinishClock = null;
    this.raceSettlement = null;
    this.raceStartPositionM = 0;
    this.opponentRaceStartPositionM = 0;
    this.finishTargetM = TRACK_M;
    this.rollingSpeedMps = 60 / 3.6;
    this.lastRollCountdownLabel = null;

    this.environment = new TokyoExpresswayBackground(this, { timeOfDay: this.raceTimeOfDay });
    this.worldG = this.add.graphics().setDepth(4);
    this.fxG = this.add.graphics().setDepth(8);
    this.treeLightsG = this.add.graphics().setDepth(23);

    this.playerVisual = this.createCarVisual(cars[this.selectedCarId].visual, 7, 1.0);
    this.opponentVisual = this.createCarVisual(cars[this.opponentCarId].visual, 6, 0.88);

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
  }

  confirmCancelRace() {
    if (this.cancelConfirmPopup?.active || this.resultsShown) return;

    const isPink = this.raceDeal === 'PINK_SLIP';
    const cashPenalty = Math.ceil((this.raceStake * 0.5) / 250) * 250;
    const penaltyText = isPink
      ? 'You forfeit ' + cars[this.selectedCarId].shortName + '. The rival takes your car.'
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
        this.registry.set('gameOver', false);
      } else {
        this.registry.set('selectedCarId', null);
        this.registry.set('gameOver', true);
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
    // Legacy pink-slip tune levels still modify grip/clutch/boost, while the new
    // part-by-part engine system changes the actual torque curve and turbo setup.
    this.applyTuneLevel(config, state.tuneLevel || 0);
    const tuned = applyEngineTuning(config, engineConfig, state);

    if (!state.nosInstalled) {
      tuned.car.nosPower = 0;
      tuned.car.nosCapacitySeconds = 0;
    } else {
      tuned.car.nosPower = Number(state.nosPower || tuned.car.nosPower || 35);
      tuned.car.nosCapacitySeconds = Number(state.nosCapacitySeconds || tuned.car.nosCapacitySeconds || 5);
    }

    return tuned;
  }

  applyRivalBuild(config, character) {
    const rating = Phaser.Math.Clamp(Number(character?.skill?.rating || 3), 1, 5);
    this.applyTuneLevel(config, rating);

    // Rookie and Skilled drivers are still early in the build ladder. Expert
    // and Elite rivals may carry a finite nitrous system.
    const hasNitrous = rating >= 4;
    config.nosPower = hasNitrous ? (rating >= 5 ? 55 : 35) : 0;
    config.nosCapacitySeconds = hasNitrous ? (rating >= 5 ? 5.0 : 4.0) : 0;

    this.opponentBuildState = {
      stock: rating <= 2,
      nosInstalled: hasNitrous,
      nosPower: config.nosPower,
      nosCapacitySeconds: config.nosCapacitySeconds,
      tuneLevel: rating,
      acquiredVia: 'pinkSlip',
    };

    return config;
  }

  prepareRollingVehicle(vehicle) {
    const speed = 60 / 3.6;
    vehicle.speedMps = speed;
    vehicle.accelerationMps2 = 0;
    vehicle.transmission.currentGear = Math.min(3, vehicle.config.gearRatios.length);
    vehicle.transmission.pendingGear = null;
    vehicle.transmission.shiftTimer = 0;
    vehicle.transmission.lastShiftQuality = 'ROLLING';

    const wheelRPM = speed / (Math.PI * 2 * vehicle.config.wheelRadius) * 60;
    vehicle.tyres.wheelRPM = wheelRPM;
    vehicle.engine.rpm = Phaser.Math.Clamp(
      wheelRPM * vehicle.transmission.ratio,
      vehicle.config.engineIdleRPM || 850,
      (vehicle.config.engineRedlineRPM || 7600) * 0.86
    );
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
    vehicle.engine.rpm = Phaser.Math.Clamp(
      wheelRPM * vehicle.transmission.ratio,
      vehicle.config.engineIdleRPM || 850,
      (vehicle.config.engineRedlineRPM || 7600) * 0.86
    );

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

  createCarVisual(cfg, depth, roleScale) {
    const bodyScale = cfg.bodyScale * roleScale;
    const wheelScale = cfg.wheelScale * roleScale * 1.16;

    const rearWheel = this.add.image(0, 0, cfg.wheelKey)
      .setScale(wheelScale)
      .setDepth(depth);

    const frontWheel = this.add.image(0, 0, cfg.wheelKey)
      .setScale(wheelScale)
      .setDepth(depth);

    // The body PNGs have open wheel arches. A dark backing keeps the road from
    // showing through the spinning rims and makes the tyres feel properly seated.
    const rearWheelBacking = this.add.circle(
      0, 0, Math.max(9, rearWheel.displayWidth * 0.50), 0x030507, 1
    ).setDepth(depth - 0.35);

    const frontWheelBacking = this.add.circle(
      0, 0, Math.max(9, frontWheel.displayWidth * 0.50), 0x030507, 1
    ).setDepth(depth - 0.35);

    const body = this.add.image(0, 0, cfg.bodyKey)
      .setScale(bodyScale)
      .setDepth(depth + 1);

    const roadShadow = this.add.ellipse(
      0, 0,
      Math.max(150, body.displayWidth * 0.98),
      Math.max(18, body.displayHeight * 0.18),
      0x000000, 0.68
    ).setDepth(depth - 0.6);

    return {
      cfg,
      bodyScale,
      wheelScale,
      rearWheel,
      frontWheel,
      rearWheelBacking,
      frontWheelBacking,
      roadShadow,
      body,
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

    if (!rollingCountdown) {
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
          this.finishTargetM = this.raceStartPositionM + TRACK_M;
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

    this.engineAudio?.update(playerT, oppT, this.player.config, this.opponent.config);

    this.handleTiming(playerT, oppT);
    this.drawScene(playerT, oppT, dt);

    let status = '';
    if (this.falseStart) status = 'RED LIGHT';
    else if (!this.raceStarted) {
      status = this.raceType.toUpperCase() + '  //  ' +
        cars[this.selectedCarId].shortName + ' vs ' + cars[this.opponentCarId].shortName;
    } else if (this.greenClock != null) status = 'GO!';
    else if (this.isRollingStart) status = 'ROLLING 60 KM/H';
    else if (this.countdownClock < 1.8) status = 'STAGED';

    this.hud.update(playerT, status);
    this.debug.update(playerT);

    if (this.finished) {
      this.afterFinishTimer += dt;
      if (this.afterFinishTimer > 0.45 && !this.resultsShown) {
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
      if (this.times.quarter == null && playerDistance >= TRACK_M) {
        this.times.quarter = elapsed;
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
      if (this.opponentTimes.quarter == null && opponentDistance >= TRACK_M) {
        this.opponentTimes.quarter = elapsed;
        this.opponentTimes.trapKmh = ot.speedKmh;
      }
    }

    if (this.greenClock != null && playerDistance >= TRACK_M && this.playerFinishClock == null) {
      this.playerFinishClock = this.raceClock;
      this.firstFinishClock ??= this.raceClock;
    }
    if (this.greenClock != null && opponentDistance >= TRACK_M && this.opponentFinishClock == null) {
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

  showResultsOverlay() {
    this.engineAudio?.fadeOut();
    this.resultsShown = true;
    this.controls.enabled = false;
    this.cancelButton?.disableInteractive();
    this.startButton?.disableInteractive();

    const depth = 100;
    const panelX = 780;
    const panelY = 300;
    const panelW = 980;
    const panelH = 430;
    const leftX = 515;
    const labelX = 780;
    const rightX = 1045;

    const titleFont = PIXEL_FONT;
    const dataFont = BODY_FONT;

    const formatTime = value => value == null ? '—' : value.toFixed(3) + ' s';
    const formatSpeed = value => value == null ? '—' : value.toFixed(1) + ' km/h';

    let outcome = 'RACE COMPLETE';
    let outcomeColour = '#78dcff';
    let playerWon = false;
    let opponentWon = false;

    if (this.falseStart) {
      outcome = 'RED LIGHT // DISQUALIFIED';
      outcomeColour = '#ff5378';
      opponentWon = true;
    } else if (this.playerFinishClock != null && this.opponentFinishClock != null) {
      playerWon = this.playerFinishClock <= this.opponentFinishClock;
      opponentWon = !playerWon;
      outcome = playerWon ? 'YOU WIN' : 'RIVAL WINS';
      outcomeColour = playerWon ? '#73f5a5' : '#ff6d8d';
    } else if (this.playerFinishClock != null) {
      playerWon = true;
      outcome = 'YOU WIN';
      outcomeColour = '#73f5a5';
    } else if (this.opponentFinishClock != null) {
      opponentWon = true;
      outcome = 'RIVAL WINS';
      outcomeColour = '#ff6d8d';
    }

    const settlement = (playerWon || opponentWon)
      ? this.settleRace(playerWon)
      : null;

    // Dim the frozen race instead of leaving it for a separate result scene.
    this.add.rectangle(780, 360, 1560, 720, 0x02050b, 0.62)
      .setDepth(depth)
      .setScrollFactor(0);

    const panel = this.add.rectangle(panelX, panelY, panelW, panelH, 0x08111c, 0.97)
      .setStrokeStyle(2, 0x4dd9ff, 0.78)
      .setDepth(depth + 1)
      .setScrollFactor(0);

    // Accent rails: cyan player side, magenta rival side.
    this.add.rectangle(panelX - panelW / 2 + 5, panelY, 5, panelH - 12, 0x45d7ff, 0.95)
      .setDepth(depth + 2).setScrollFactor(0);
    this.add.rectangle(panelX + panelW / 2 - 5, panelY, 5, panelH - 12, 0xff3f88, 0.88)
      .setDepth(depth + 2).setScrollFactor(0);

    this.add.text(panelX, 103, 'TOKYO SHIFT // RACE SLIP', {
      fontFamily: titleFont, fontSize: '18px', color: '#eaf8ff', fontStyle: 'bold',
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0);

    this.add.text(panelX, 137, outcome, {
      fontFamily: titleFont, fontSize: '15px', color: outcomeColour, fontStyle: 'bold',
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0);

    const addCarHeader = (x, role, carId, winner, accent) => {
      this.add.text(x, 166, role, {
        fontFamily: dataFont, fontSize: '9px', color: '#7f93aa', fontStyle: 'bold',
        letterSpacing: 2
      }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0);

      this.add.text(x, 184, cars[carId].shortName, {
        fontFamily: titleFont, fontSize: '16px', color: '#f5fbff', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0);

      if (winner) {
        const badge = this.add.rectangle(x, 213, 96, 23, accent, 0.16)
          .setStrokeStyle(1, accent, 0.9).setDepth(depth + 2).setScrollFactor(0);
        this.add.text(x, 213, 'WINNER', {
          fontFamily: dataFont, fontSize: '9px', color: '#ffffff',
          fontStyle: 'bold', letterSpacing: 1
        }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0);
      }
    };

    addCarHeader(leftX, 'YOU', this.selectedCarId, playerWon, 0x45d7ff);
    addCarHeader(rightX, 'RIVAL', this.opponentCarId, opponentWon, 0xff3f88);

    // Centre labels and two clean data columns with generous row spacing.
    const rows = [
      ['REACTION', this.falseStart ? 'DQ' : formatTime(this.times.reaction), formatTime(this.opponentTimes.reaction)],
      ['60 FT', this.falseStart ? '—' : formatTime(this.times.sixty), formatTime(this.opponentTimes.sixty)],
      ['1/8 MILE', this.falseStart ? '—' : formatTime(this.times.eighth), formatTime(this.opponentTimes.eighth)],
      ['1/4 ET', this.falseStart ? '—' : formatTime(this.times.quarter), formatTime(this.opponentTimes.quarter)],
      ['TRAP', this.falseStart ? '—' : formatSpeed(this.times.trapKmh), formatSpeed(this.opponentTimes.trapKmh)],
    ];

    const rowStartY = 244;
    const rowGap = 40;

    rows.forEach((row, i) => {
      const y = rowStartY + i * rowGap;

      if (i > 0) {
        this.add.rectangle(panelX, y - 10, 760, 1, 0x5b7088, 0.16)
          .setDepth(depth + 2).setScrollFactor(0);
      }

      this.add.text(labelX, y, row[0], {
        fontFamily: dataFont, fontSize: '9px', color: '#7f93aa',
        fontStyle: 'bold', letterSpacing: 1
      }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0);

      this.add.text(leftX, y, row[1], {
        fontFamily: dataFont, fontSize: '12px', color: '#dff8ff', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0);

      this.add.text(rightX, y, row[2], {
        fontFamily: dataFont, fontSize: '12px', color: '#ffe4ef', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0);
    });

    if (playerWon) playVictorySting();
    else stopMusic();

    if (settlement) {
      if (this.raceDeal === 'PINK_SLIP') {
        this.add.text(panelX, 449, settlement.gameOver
          ? settlement.pinkMessage + '   //   NO CARS LEFT'
          : settlement.pinkMessage, {
          fontFamily: dataFont,
          fontSize: '11px',
          color: settlement.playerWon ? '#73f5a5' : '#ff7d98',
          fontStyle: 'bold',
          letterSpacing: 1,
        }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0);
      } else {
        const delta = settlement.cashDelta;
        const moneyText = delta > 0
          ? '+¥ ' + delta.toLocaleString('en-US')
          : delta < 0
            ? '-¥ ' + Math.abs(delta).toLocaleString('en-US')
            : 'NO CASH CHANGE';

        this.add.text(panelX, 449, moneyText + '   //   BALANCE ¥ ' + settlement.cash.toLocaleString('en-US'), {
          fontFamily: dataFont,
          fontSize: '11px',
          color: delta > 0 ? '#73f5a5' : delta < 0 ? '#ff7d98' : '#aab9c6',
          fontStyle: 'bold',
          letterSpacing: 1,
        }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0);
      }
    }

    const addButton = (x, label, stroke, onPress) => {
      const button = this.add.rectangle(x, 486, 190, 42, 0x0c1825, 0.98)
        .setStrokeStyle(2, stroke, 0.88)
        .setDepth(depth + 3)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true });

      const text = this.add.text(x, 486, label, {
        fontFamily: titleFont, fontSize: '13px', color: '#eef9ff',
        fontStyle: 'bold', letterSpacing: 1
      }).setOrigin(0.5).setDepth(depth + 4).setScrollFactor(0);

      button.on('pointerover', () => button.setFillStyle(stroke, 0.16));
      button.on('pointerout', () => button.setFillStyle(0x0c1825, 0.98));
      button.on('pointerdown', onPress);
      return { button, text };
    };

    const addWorkshopButton = x => {
      const currentCash = Number(this.registry.get('cash') || 0);
      if (currentCash >= WORKSHOP_RETURN_COST) {
        return addButton(
          x,
          'WORKSHOP // ¥' + WORKSHOP_RETURN_COST.toLocaleString('en-US'),
          0x45d7ff,
          () => this.returnToWorkshop()
        );
      }

      const control = addButton(
        x,
        'NEED ¥' + WORKSHOP_RETURN_COST.toLocaleString('en-US'),
        0x66535a,
        () => {}
      );
      control.button.disableInteractive().setFillStyle(0x17181d, 0.98);
      control.text.setColor('#927b83');
      return control;
    };

    if (settlement?.gameOver) {
      addButton(780, 'BACK TO MEET // NO CAR', 0xffb85f, () => {
        this.scene.start('MeetScene');
      });
    } else {
      let saveControl = null;
      saveControl = addButton(540, 'SAVE GAME', 0x62e8c7, () => {
        saveManualState(this.registry);
        saveControl.text.setText('SAVED');
        saveControl.button.disableInteractive().setFillStyle(0x12352e, 0.98);
      });

      addWorkshopButton(780);
      addButton(1020, 'MEET', 0xff4a8d, () => this.scene.start('MeetScene'));
    }
  }

  returnToWorkshop() {
    const cash = Number(this.registry.get('cash') || 0);
    if (cash < WORKSHOP_RETURN_COST) return;

    this.registry.set('cash', cash - WORKSHOP_RETURN_COST);
    saveSessionState(this.registry);
    this.scene.start('GarageScene');
  }

  settleRace(playerWon) {
    if (this.raceSettlement) return this.raceSettlement;

    const wins = this.registry.get('wins') ?? 0;
    const losses = this.registry.get('losses') ?? 0;
    const oldCash = this.registry.get('cash') ?? 0;

    this.registry.set('wins', wins + (playerWon ? 1 : 0));
    this.registry.set('losses', losses + (playerWon ? 0 : 1));

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

      if (playerWon) {
        if (!ownedCarIds.includes(this.opponentCarId)) {
          ownedCarIds.push(this.opponentCarId);
          carStates[this.opponentCarId] = {
            ...this.opponentBuildState,
            acquiredVia: 'pinkSlip',
          };
          pinkMessage = 'PINK SLIP WON // ' + cars[this.opponentCarId].shortName + ' ADDED TO GARAGE';
        } else {
          pinkMessage = 'PINK SLIP WON // ' + cars[this.opponentCarId].shortName + ' ALREADY OWNED';
        }
      } else {
        ownedCarIds = ownedCarIds.filter(id => id !== this.selectedCarId);
        delete carStates[this.selectedCarId];
        pinkMessage = 'PINK SLIP LOST // ' + cars[this.selectedCarId].shortName + ' TAKEN';

        if (ownedCarIds.length) {
          this.registry.set('selectedCarId', ownedCarIds[0]);
        } else {
          this.registry.set('selectedCarId', null);
          gameOver = true;
        }
      }

      this.registry.set('ownedCarIds', ownedCarIds);
      this.registry.set('carStates', carStates);
      this.registry.set('gameOver', gameOver);
    } else if (this.raceMode === 'SINGLE' && this.raceDeal === 'BET') {
      cashDelta = playerWon ? this.raceStake : -this.raceStake;
    } else if (this.raceMode === 'COMPETITION' && playerWon) {
      cashDelta = this.raceStake;
    }

    const newCash = Math.max(0, oldCash + cashDelta);
    this.registry.set('cash', newCash);

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
    const targetPlayerX = W * 0.27;
    const cameraPx = pt.positionM * PX_PER_M - targetPlayerX;

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
    const bodyY = y + Phaser.Math.Clamp(t.accelerationMps2 * 0.8, -2, 4);
    v.body.setPosition(x, bodyY);

    const rearX = x + c.rearOffsetX * v.bodyScale;
    const frontX = x + c.frontOffsetX * v.bodyScale;
    const wheelY = bodyY + c.wheelOffsetY * v.bodyScale;

    v.wheelAngle += ((t.wheelRPM || 0) / 60) * Math.PI * 2 * dt;
    v.rearWheelBacking.setPosition(rearX, wheelY);
    v.frontWheelBacking.setPosition(frontX, wheelY);
    v.rearWheel.setPosition(rearX, wheelY).setRotation(v.wheelAngle);
    v.frontWheel.setPosition(frontX, wheelY).setRotation(v.wheelAngle);
    const wheelBaseY = wheelY + v.rearWheel.displayHeight * 0.5;
    const shadowHeight = v.roadShadow.displayHeight;
    // Put the tyre contact point one-third of the way down into the shadow:
    // the shadow's upper third overlaps the base of the wheels, grounding the car.
    v.roadShadow.setPosition(x, wheelBaseY + shadowHeight / 6);

    v.rearX = rearX;
    v.rearY = wheelY;
    v.frontX = frontX;
    v.frontY = wheelY;
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
