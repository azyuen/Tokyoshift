import Vehicle from '../vehicles/Vehicle.js?v=20261008-r428';
import TouchControls from '../input/TouchControls.js?v=20261010-r462';
import DragRacingAI from '../ai/DragRacingAI.js?v=20261008-r428';
import {
  applyDifficultyToPlayerCarConfig,
  applyDifficultyToRivalAi,
  normalisePlayerDifficulty,
} from '../data/playerDifficulty.js?v=20261007-r399';
import RaceHUD from '../ui/RaceHUD.js?v=20261010-r458';
import DebugHUD from '../ui/DebugHUD.js';
import TokyoExpresswayBackground from '../environment/TokyoExpresswayBackground.js?v=20261010-r461';
import {
  STREET_GREEN_SECONDS,
  getStreetSignalFrame,
} from '../data/streetSignalTiming.js?v=20261010-r460';
import { getWorldPhase } from '../environment/WorldClock.js?v=20260929-r286';
import { cars, carOrder } from '../data/cars.js?v=20261006-r388';
import { createAndRegisterOwnedCarInstance, ownsCarModel } from '../data/carOwnership.js?v=20261006-r388';
import {
  DEFAULT_PAINT_COLOR,
  getCarPaintColor,
  normalisePaintColor,
  createCarBodyLayers,
  preloadCarAppearanceAssets,
  preloadCarWheel,
  ensureDerivedModularCarTextures,
} from '../vehicles/CarAppearance.js?v=20260929-r246';
import { createDriverSilhouette } from '../vehicles/DriverSilhouette.js?v=20260923-r137';
import { createVisualModLayers, getVisualModWheelVisual, preloadVisualModSelectionAssets } from '../data/visualMods.js?v=20261006-r388';
import { createTunerDecalLayers, preloadTunerDecalAssets } from '../vehicles/TunerDecals.js?v=20260929-r284';
import { getWheelPairFit, getWheelContactOffsetY } from '../vehicles/WheelFit.js?v=20260929-r258';
import { engines } from '../data/engines.js?v=20261004-r333';
import { buildCarFromState } from '../vehicles/VehiclePerformance.js?v=20261008-r428';
import { createRivalBuildState, addPinkSlipSupport } from '../data/rivalBuilds.js?v=20260928-r234';
import { recordPinkSlipVictory } from '../data/pinkSlipProgression.js?v=20261008-r430';
import {
  characters,
  getCharacterAssetUrl,
  getCharacterVisualForContext,
  getCharacterForContext,
  CENTRAL_TOKYO_CHARACTER_IDS,
  playableCharacterOrder,
  rivalCharacterOrder,
  getRivalCharacterOrderForRegion,
} from '../data/characters.js?v=20261010-r459';
import { WORKSHOP_RETURN_COST } from '../data/meetAssets.js?v=20260922-r84';
import {
  saveSessionState,
  clearAllSaves,
  recordCarAcquisition,
  recordCarDeparture,
} from '../state/GameState.js?v=20261010-r467';
import { playRaceMusic, playVictorySting, stopMusic } from '../audio/MusicManager.js?v=20260922-r99';
import EngineAudioSystem from '../audio/EngineAudioSystem.js?v=20260921-r81';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20261005-r355';
import {
  getEncounterAi,
  boostAiForPinkSlip,
  boostAiForStandingStart,
} from '../data/encounterProfiles.js?v=20260926-r204';
import {
  AUTO_MARKET_LISTINGS,
  getCarCouponRequirement,
  getCarCouponCount,
} from '../data/centralTokyo.js?v=20261006-r388';
import {
  applyEasyCashWinBonus,
  getEasyCouponMilestoneForWins,
} from '../data/careerProgression.js?v=20260929-r272';
import { getTunerShopForRegion } from '../data/tunerShops.js?v=20260926-r212';
import {
  TUNER_TEAM_CHALLENGE_STAGES,
  TUNER_TEAM_COMPLETION_REWARD,
  TUNER_TEAM_PERFECT_REWARD,
  getTunerTeamChallengeState,
  buildTunerTeamChallengeRounds,
  getRegionalChallengeRaceSpec,
} from '../data/tunerChallenges.js?v=20261010-r466';
import { materialiseRegionalChallengeRounds } from '../data/regionalChallengeBuilds.js?v=20261010-r462';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261007-r411';
import { createRegionalChallengeTableau } from '../ui/RegionalChallengeTableau.js?v=20261007-r411';
import { addDevCutsceneButton } from '../ui/CutsceneTester.js?v=20261009-r453';
import { playMangaCutscene, sceneCutsceneActive } from '../ui/MangaCutscene.js?v=20261009-r453';
import { maybeAwardSurpriseReward } from '../data/surpriseRewards.js?v=20261006-r388';
import { recordCarMagazineSightings } from '../data/carMagazine.js?v=20261006-r388';
import {
  getGarageDeliveryOptions,
  showGarageDeliveryPicker,
} from '../ui/GarageDeliveryPicker.js?v=20260929-r264';
import {
  CREW_BATTLE_LINEUP_SIZE,
  CREW_BATTLE_WINS_REQUIRED,
  CREW_BATTLE_COUPONS,
  createCrewInviteFromMeetWin,
  completeCrewRecruitChallenge,
  getRegionalCrewBattleReward,
  markCrewBattleCompleted,
  areAllCrewBattlesComplete,
  getCrewMembers,
  removeCrewMember,
} from '../data/crewSystem.js?v=20261007-r410';

const QUARTER_M = 402.336;
const HALF_MILE_M = 804.672;
const PX_PER_M = 76.0;
// The roadside start assembly and the zebra crossing share one physical
// world anchor, so both slide naturally past the camera after the launch.
const STREET_START_M = 4.72;
// Keep the R461 15% larger prop, but lift the entire pole and lights by
// 18px following the in-game positioning pass (without changing animation).
const STREET_SIGNAL_SCALE = 0.253;
const STREET_SIGNAL_POLE_X = 602; // pixel coordinate in 836px source PNG
const STREET_SIGNAL_BASE_Y = 587;
const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';
const TAXI_TO_WORKSHOP_COST = 1000;
const clone = value => JSON.parse(JSON.stringify(value));

export default class RaceScene extends Phaser.Scene {
  // Allow an isolated dev scene to reuse the production car renderer and physics helpers.
  constructor(sceneKey = 'RaceScene') { super(sceneKey); }

  preload() {
    let queued = 0;
    const queueImage = (key, path) => {
      if (!key || !path || this.textures.exists(key)) return;
      this.load.image(key, path);
      queued += 1;
    };

    queueImage('hudCluster', 'assets/Ui/hud_cluster.png');
    // Each race picks one of the four same-canvas suburban traffic signals.
    // A distinct Phaser texture key per variant is essential: reusing a single
    // cache key would make later races retain the first loaded appearance.
    const signalVariant = Phaser.Math.Between(1, 4);
    const signalSuffix = String(signalVariant).padStart(2, '0');
    this.streetSignalTextureKey = 'streetStartSignal' + signalSuffix;
    queueImage(
      this.streetSignalTextureKey,
      'assets/Ui/trafficlight_' + signalSuffix + '.png?v=20261010-r461'
    );
    queueImage('clutchPedal', 'assets/Controls/clutch_pedal.png');
    queueImage('throttlePedal', 'assets/Controls/throttle_pedal.png');
    queueImage('nosButton', 'assets/Controls/nos_button.png');
    queueImage('shifterNeutral', 'assets/Controls/shifter_neutral.png');
    queueImage('shifterDown', 'assets/Controls/shifter_down.png');
    queueImage('regionalChallengeBadge', 'assets/Garage/badge_crown.png');
    queueImage('regionalPerfectStarBadge', 'assets/Garage/badge_star.png');

    // All street-race regions now use authored day/night panoramas.
    // Assets follow skyline_<region>_<phase>.webp and share one renderer.
    const skylineRegions = new Set(['ODAIBA', 'SHINAGAWA', 'TATSUMI', 'DAIKOKU', 'SHIBUYA', 'SHINJUKU', 'YOKOHAMA']);
    if (skylineRegions.has(this.raceDistrict)) {
      const regionSlug = this.raceDistrict.toLowerCase();
      const skylineKey = 'raceSkyline_' + regionSlug + '_' + this.raceTimeOfDay;
      const skylineFile = 'skyline_' + regionSlug + '_' + this.raceTimeOfDay + '.webp';
      queueImage(
        skylineKey,
        'assets/Race/Skylines/' + skylineFile + '?v=20260929-r276'
      );
    }

    const profilePlayerCharacterId =
      this.registry.get('playerCharacterId') ||
      'renMizuno';
    const playerId =
      this.registry.get('selectedRacePlayerCharacterId') ||
      profilePlayerCharacterId;
    const opponentId = this.registry.get('selectedOpponentCharacterId');
    const queueCharacterVisual = visual => {
      if (!visual) return;
      queueImage(visual.spriteKey, getCharacterAssetUrl(visual.path));
      queueImage(visual.winSpriteKey, getCharacterAssetUrl(visual.winPath));
      queueImage(visual.lossSpriteKey, getCharacterAssetUrl(visual.lossPath));
    };

    // The temporary race driver can be a recruited crew member, but the avatar
    // that must never appear as an opponent is the active profile's character.
    queueCharacterVisual(characters[playerId]?.visual || null);
    queueCharacterVisual(getCharacterVisualForContext(opponentId, {
      rivalContext: true,
      playerCharacterId: profilePlayerCharacterId,
    }));

    if (this.raceMode === 'TUNER_TEAM') {
      const regionId = String(
        this.registry.get('raceDistrict') || this.registry.get('district') || ''
      ).toUpperCase();
      const challenge = getTunerTeamChallengeState(this.registry, regionId);
      (challenge.rounds || []).slice(0, TUNER_TEAM_CHALLENGE_STAGES).forEach(round => {
        queueCharacterVisual(getCharacterVisualForContext(round?.characterId, {
          rivalContext: true,
          playerCharacterId: profilePlayerCharacterId,
        }));
      });
    }

    const playerState = (this.registry.get('carStates') || {})[this.selectedCarId] || {};
    const raceCarIds = [...new Set([this.selectedCarId, this.opponentCarId])]
      .filter(id => cars[id]);
    raceCarIds.forEach(id => {
      queued += preloadCarAppearanceAssets(this, { [id]: cars[id] }, '20260929-r246');
      queued += preloadCarWheel(
        this,
        cars[id],
        id === this.selectedCarId ? playerState : {}
      );
    });
    queued += preloadVisualModSelectionAssets(
      this,
      this.selectedCarId,
      playerState,
      '20260928-r242'
    );
    queued += preloadTunerDecalAssets(this, playerState, '20260928-r242');

    startSceneLoading(this, 'PREPARING RACE', queued);
  }

  init() {
    this.selectedCarId = this.registry.get('selectedCarId') || 'ae86';
    if (!cars[this.selectedCarId]) this.selectedCarId = 'ae86';

    const chosenOpponent = this.registry.get('selectedOpponentCarId');
    const fallbackRivals = carOrder.filter(id => id !== this.selectedCarId && cars[id]);
    this.opponentCarId = cars[chosenOpponent]
      ? chosenOpponent
      : Phaser.Utils.Array.GetRandom(fallbackRivals.length ? fallbackRivals : carOrder);

    this.opponentPaintColor = normalisePaintColor(
      this.registry.get('selectedOpponentPaintColor'),
      DEFAULT_PAINT_COLOR
    );
    const storedPlayerCharacterId = this.registry.get('playerCharacterId') || 'renMizuno';
    const racePlayerCharacterId =
      this.registry.get('selectedRacePlayerCharacterId') || storedPlayerCharacterId;
    const developerAvatar =
      Boolean(this.registry.get('devMode')) &&
      racePlayerCharacterId === 'arkonDen';
    this.playerCharacterId =
      developerAvatar || characters[racePlayerCharacterId]
        ? racePlayerCharacterId
        : playableCharacterOrder.includes(storedPlayerCharacterId)
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
      regionRivals.includes(storedOpponentCharacterId)
        ? storedOpponentCharacterId
        : fallbackOpponentCharacterId;
    this.opponentEncounterRating = Phaser.Math.Clamp(
      Number(this.registry.get('selectedOpponentEncounterRating') || characters[this.opponentCharacterId]?.skill?.rating || 3),
      1,
      5
    );
    this.opponentEncounterAi = this.registry.get('selectedOpponentEncounterAi')
      || characters[this.opponentCharacterId]?.skill?.ai
      || getEncounterAi(this.opponentEncounterRating);
    this.raceMode = this.registry.get('selectedRaceCategory') || 'SINGLE';
    this.isTutorial = this.raceMode === 'TUTORIAL';
    const regionalRaceDistrict = String(
      this.registry.get('raceDistrict') || this.registry.get('district') || ''
    ).toUpperCase();
    const earlyRegionalState = this.raceMode === 'TUNER_TEAM'
      && ['ODAIBA', 'SHINAGAWA'].includes(regionalRaceDistrict)
      ? getTunerTeamChallengeState(this.registry, regionalRaceDistrict)
      : null;
    const earlyRegionalStage = Math.max(0, Math.min(
      TUNER_TEAM_CHALLENGE_STAGES - 1, Number(earlyRegionalState?.stage || 0)
    ));
    const earlyRegionalRace = earlyRegionalState
      ? getRegionalChallengeRaceSpec(regionalRaceDistrict, earlyRegionalStage)
      : null;
    const earlyRegionalRound = earlyRegionalState?.rounds?.[earlyRegionalStage];
    if (earlyRegionalRound && cars[earlyRegionalRound.carId]) {
      // Old suspended races may still have an RX-8 selected in the registry.
      // The current saved challenge, not that stale selection, wins.
      this.opponentCarId = earlyRegionalRound.carId;
      this.opponentEncounterRating = Phaser.Math.Clamp(
        Number(earlyRegionalRound.encounterRating || 3), 1, 5
      );
      this.opponentEncounterAi = earlyRegionalRound.encounterAi
        || getEncounterAi(this.opponentEncounterRating);
    }
    // Also honour the revised schedule if the player resumes directly into
    // a race with a pre-R464 selectedRaceType in their session.
    this.raceType = earlyRegionalRace?.raceType
      || this.registry.get('selectedRaceType') || 'Standing Start';
    this.isRollingStart = this.raceType === 'Roll Race';
    const configuredRaceDistanceM = Number(
      earlyRegionalRace?.distanceM || this.registry.get('selectedRaceDistanceM') || 0
    );
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
    const storedMeetOffer = this.registry.get('selectedRaceMeetOffer');
    const storedBuildState = this.registry.get('selectedOpponentBuildState') || storedMeetOffer?.opponentBuildState;
    const storedOfferCarId = storedMeetOffer?.displayCarId || storedMeetOffer?.carId;
    const isRandomMeetBuild =
      this.raceMode === 'SINGLE' &&
      !this.registry.get('selectedRaceSpecialChallenge') &&
      storedMeetOffer &&
      storedOfferCarId === this.opponentCarId &&
      storedBuildState && typeof storedBuildState === 'object';
    const isCompetitionBuild =
      ['COMPETITION', 'CREW_RECRUIT', 'CREW_BATTLE', 'TUNER_TEAM'].includes(this.raceMode) &&
      storedBuildState &&
      typeof storedBuildState === 'object';

    // Random Meets and competitions may carry a pre-matched physical build.
    // Driver skill stays separate, so expert/elite competition AI does not
    // silently make the opponent's hardware stronger.
    this.explicitOpponentBuildState =
      (isRandomMeetBuild || isCompetitionBuild)
        ? clone(storedBuildState)
        : null;
    this.opponentBuildRating = (isRandomMeetBuild || isCompetitionBuild)
      ? Phaser.Math.Clamp(
          Number(
            this.registry.get('selectedOpponentBuildRating') ||
            storedMeetOffer?.opponentBuildRating ||
            storedBuildState?.buildRating ||
            1
          ),
          1,
          5
        )
      : this.opponentEncounterRating;
    this.opponentBuildArchetype = (isRandomMeetBuild || isCompetitionBuild)
      ? (
          this.registry.get('selectedOpponentBuildArchetype') ||
          storedMeetOffer?.opponentBuildArchetype ||
          storedBuildState?.buildArchetype ||
          null
        )
      : null;
    this.raceTimeOfDay = this.registry.get('raceTimeOfDay') || getWorldPhase();
    this.raceDistrict = this.registry.get('raceDistrict') || this.registry.get('district') || 'ODAIBA';
    this.raceLocationLabel = this.registry.get('raceLocationLabel') || 'STREET';
  }

  create() {
    ensureDerivedModularCarTextures(this, Object.fromEntries(
      [...new Set([this.selectedCarId, this.opponentCarId])]
        .filter(id => cars[id])
        .map(id => [id, cars[id]])
    ));

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

    if (!this.isTutorial && this.opponentCarId) {
      recordCarMagazineSightings(this.registry, [{
        carId: this.opponentCarId,
        source: this.raceMode === 'TUNER_TEAM'
          ? 'team-challenge'
          : this.raceMode === 'COMPETITION'
            ? 'competition'
            : this.raceDeal === 'PINK_SLIP'
              ? 'pink-slip'
              : 'street',
      }]);
    }

    const rivalCharacter = characters[this.opponentCharacterId];
    const rivalDisplayCharacter = getCharacterForContext(
      this.opponentCharacterId,
      {
        rivalContext: true,
        playerCharacterId: this.registry.get('playerCharacterId') || 'renMizuno',
      }
    ) || rivalCharacter;
    const playerBaseCar = clone(cars[this.selectedCarId]);
    const playerBuild = this.applyOwnedBuild(
      playerBaseCar,
      clone(engines[playerBaseCar.engine]),
      this.playerCarState
    );
    this.playerDifficulty = normalisePlayerDifficulty(
      this.registry.get('playerDifficulty')
    );
    const playerConfig = applyDifficultyToPlayerCarConfig(
      playerBuild.car,
      this.playerDifficulty
    );
    const opponentBaseCar = clone(cars[this.opponentCarId]);
    const opponentBuild = this.applyRivalBuild(
      opponentBaseCar,
      clone(engines[opponentBaseCar.engine]),
      rivalCharacter
    );
    const opponentConfig = opponentBuild.car;

    this.playerCapabilities = {
      hasTurbo: (playerConfig.maximumBoost || 0) > 0.01,
      hasNitrous: (playerConfig.nosPower || 0) > 0 && (playerConfig.nosCapacitySeconds || 0) > 0,
    };

    this.opponentCapabilities = {
      hasTurbo: (opponentConfig.maximumBoost || 0) > 0.01,
      hasNitrous: (opponentConfig.nosPower || 0) > 0 && (opponentConfig.nosCapacitySeconds || 0) > 0,
    };

    this.player = new Vehicle(playerConfig, playerBuild.engine);
    this.opponent = new Vehicle(opponentConfig, opponentBuild.engine);
    this.engineAudio = new EngineAudioSystem(
      playerConfig.engine,
      opponentConfig.engine,
      this.playerCarState,
      this.opponentBuildState || {}
    );
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
    // One deliberate pink-slip driver bump; Easy remains exempt.
    let rivalAI = this.raceDeal === 'PINK_SLIP' && this.playerDifficulty !== 'EASY'
      ? boostAiForPinkSlip(baseRivalAI)
      : { ...baseRivalAI };

    if (!this.isRollingStart && !this.isTutorial) {
      rivalAI = boostAiForStandingStart(rivalAI, this.opponentEncounterRating);
    }

    if (!this.isTutorial) {
      rivalAI = applyDifficultyToRivalAi(
        rivalAI,
        this.playerDifficulty,
        { rollingStart: this.isRollingStart }
      );
    }

    this.ai = new DragRacingAI(this.opponent, rivalAI, {
      rollingStart: this.isRollingStart, rating: this.opponentEncounterRating,
      playerDifficulty: this.playerDifficulty, tutorial: this.isTutorial,
      raceDistanceM: this.raceDistanceM,
    });
    // Developer inspection: scene.aiDiagnostics. No normal HUD output.
    this.aiDiagnostics = this.ai.diagnostics;

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
    this.finishVisualFrozen = false;
    this.finishTimedOut = false;
    this.startMoved = false;
    this.times = {
      reaction: null,
      sixty: null,
      zeroToSixty: null,
      eighth: null,
      quarter: null,
      finish: null,
      trapKmh: null,
      maxKmh: 0,
    };
    this.opponentTimes = {
      reaction: null,
      sixty: null,
      zeroToSixty: null,
      eighth: null,
      quarter: null,
      finish: null,
      trapKmh: null,
      maxKmh: 0,
    };
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

    const skylineRegions = new Set(['ODAIBA', 'SHINAGAWA', 'TATSUMI', 'DAIKOKU', 'SHIBUYA', 'SHINJUKU', 'YOKOHAMA']);
    const skylineKey = skylineRegions.has(this.raceDistrict)
      ? 'raceSkyline_' + this.raceDistrict.toLowerCase() + '_' + this.raceTimeOfDay
      : null;
    // Keep regional skyline identity stable but vary the expressway furniture
    // from race to race. A session counter makes the sequence deterministic.
    const roadVariantCounter = Number(this.registry.get('raceRoadVariantCounter') || 0) + 1;
    this.registry.set('raceRoadVariantCounter', roadVariantCounter);
    const roadVariant = roadVariantCounter % 4;
    const startWindow = this.raceDistanceM <= QUARTER_M + 1 ? 0.78 : 0.42;
    const skylineStartRatio = ((roadVariantCounter * 0.61803398875) % 1) * startWindow;
    const skylineTravelPx = this.raceDistanceM <= QUARTER_M + 1 ? 430 : (this.raceDistanceM <= HALF_MILE_M + 1 ? 760 : 1000);
    this.environment = new TokyoExpresswayBackground(this, {
      timeOfDay: this.raceTimeOfDay,
      skylineKey,
      roadVariant,
      skylineStartRatio,
      skylineTravelPx,
      roadsideRegion: this.raceDistrict,
      roadsideSeed: roadVariantCounter,
      worldPxPerM: PX_PER_M,
    });
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
    this.opponentVisual = this.isTutorial
      ? null
      : this.createCarVisual(
          cars[this.opponentCarId],
          6,
          0.88,
          this.opponentPaintColor,
          rivalDisplayCharacter,
          {}
        );

    // The base of the signal stands in front of the foreground roadside
    // bollards (depth 3), with its head rising above the racing surface.
    this.treeSprite = this.add.image(780, 192, this.streetSignalTextureKey)
      .setOrigin(0, 0)
      .setScale(STREET_SIGNAL_SCALE)
      .setDepth(20)
      .setVisible(!this.isRollingStart);

    // Phaser overlays glow and seven-segment-style text on the neutral PNG,
    // avoiding separate colour-variant assets for every state.
    this.streetCountdownText = this.add.text(0, 0, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '18px',
      color: '#ff6245',
      stroke: '#34100c',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(24).setVisible(false);

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

    if (this.isTutorial) {
      this.startButton.setVisible(false).disableInteractive();
      this.startButtonText.setVisible(false);
      this.finishTargetM = 999999;
    }

    this.raceLocationText = this.add.text(
      30,
      39,
      this.raceDistrict + ' // ' + this.raceLocationLabel + ' // ' + this.raceTimeOfDay.toUpperCase(),
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: this.raceTimeOfDay === 'day' ? '#d8f4ff' : '#9fc8de',
        backgroundColor: '#07111daa',
        padding: { x: 8, y: 4 },
      }
    ).setOrigin(0, 0.5).setDepth(46).setScrollFactor(0)
      .setVisible(false);

    const rivalName = rivalDisplayCharacter?.name || 'Rival';
    const moneyLabel = this.isTutorial
      ? 'CONTROLS // NO STAKES'
      : this.raceDeal === 'PINK_SLIP'
        ? 'PINK SLIP  //  ' + cars[this.selectedCarId].shortName
        : this.raceMode === 'COMPETITION'
          ? 'SHOWDOWN ROUND'
          : 'BET  ¥ ' + this.raceStake.toLocaleString('en-US');

    this.rivalText = this.add.text(
      1490,
      39,
      this.isTutorial ? 'SOLO DRIVING LESSON' : rivalName.toUpperCase(),
      {
        fontFamily: PIXEL_FONT,
        fontSize: '10px',
        color: this.isTutorial ? '#8fe7ff' : '#d8edf8',
      }
    ).setOrigin(1, 0.5).setDepth(46).setScrollFactor(0);

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

    this.cancelButtonText = this.add.text(135, 54, this.isTutorial ? 'EXIT TUTORIAL' : 'CANCEL RACE', {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#ffd8dc'
    }).setOrigin(0.5).setDepth(48).setScrollFactor(0);

    this.cancelButton.on('pointerdown', () => {
      if (this.isTutorial) {
        this.scene.start('GarageScene');
        return;
      }
      this.confirmCancelRace();
    });

    if (this.isTutorial) {
      this.setupDrivingTutorial();
    }

    // Safe dev-only cutscene preview while staged. It is hidden during an
    // active race and raised above the result tableau only after the race ends.
    this.devCutsceneControl = addDevCutsceneButton(this, 350, 54, { depth: 90 });

    if (this.raceMode === 'TUNER_TEAM') {
      const regionId = String(this.raceDistrict || '').toUpperCase();
      const state = getTunerTeamChallengeState(this.registry, regionId);
      const stageKey = regionId + ':' + Number(state.stage || 0);
      const revealCurrent =
        this.registry.get('regionalChallengeRevealCurrentStage') === stageKey;

      if (revealCurrent) {
        this.registry.set('regionalChallengeRevealCurrentStage', null);
        saveSessionState(this.registry);
      }

      this.time.delayedCall(45, () =>
        this.showRegionalChallengeBriefing({ revealCurrent })
      );
    }

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
        ? 'Your Street Showdown ends here. The entry fee is not refunded.'
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
      color: '#101820',
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
      const forfeitedCrewMember = Object.values(getCrewMembers(this.registry))
        .find(member => member?.loanCarId === this.selectedCarId) || null;
      let ownedCarIds = [...(this.registry.get('ownedCarIds') || [])];
      const carStates = { ...(this.registry.get('carStates') || {}) };

      ownedCarIds = ownedCarIds.filter(id => id !== this.selectedCarId);
      delete carStates[this.selectedCarId];

      this.registry.set('ownedCarIds', ownedCarIds);
      this.registry.set('carStates', carStates);

      if (forfeitedCrewMember?.regionId) {
        removeCrewMember(this.registry, forfeitedCrewMember.regionId);
        this.registry.set('selectedRacePlayerCharacterId', null);
      }

      if (ownedCarIds.length) {
        this.registry.set(
          'selectedCarId',
          ownedCarIds.find(id => !cars[id]?.crewLoan) || ownedCarIds[0]
        );
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
      this.scene.start(ownedCarIds.length ? 'MeetScene' : 'RunOverScene');
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

    addButton(780, 'RUN OVER // OPTIONS', 0xff4a8d, () => {
      this.scene.start('RunOverScene');
    });
  }

  applyOwnedBuild(config, engineConfig, state = {}) {
    return buildCarFromState(config, engineConfig, state);
  }

  getRivalBuildState(config, rating = 3) {
    const buildRating = Phaser.Math.Clamp(
      Number(this.opponentBuildRating || rating || 3),
      1,
      5
    );

    let state = this.explicitOpponentBuildState
      ? clone(this.explicitOpponentBuildState)
      : createRivalBuildState(config, buildRating, {
          raceType: this.raceType,
          paintColor: this.opponentPaintColor,
          seed: [
            this.raceMode,
            this.raceDistrict,
            this.opponentCharacterId,
            this.opponentCarId,
            this.raceType,
            buildRating,
          ].join(':'),
        });

    if (this.raceMode === 'TUNER_TEAM') {
      // Persistent seven-race sessions may contain rivals generated by older
      // builds. Rebuild the CURRENT round's hardware from the canonical rules
      // at race entry, without resetting the player's stage, identity or car.
      const saved = getTunerTeamChallengeState(this.registry, this.raceDistrict);
      const stageIndex = Math.max(0, Math.min(6, Number(saved.stage || 0)));
      const template = buildTunerTeamChallengeRounds(
        this.raceDistrict,
        this.playerCharacterId,
        this.playerDifficulty
      )[stageIndex];
      if (template) {
        const legalRound = materialiseRegionalChallengeRounds([{
          ...template,
          stageIndex,
          carId: this.opponentCarId,
          characterId: this.opponentCharacterId,
          paintColor: this.opponentPaintColor,
          raceType: this.raceType,
        }], Number(this.registry.get('wins') || 0))[0];
        if (legalRound?.opponentBuildState) {
          state = legalRound.opponentBuildState;
        }
      }
    }

    // Pink-slip hardware remains real player-accessible parts. Applying it here
    // means the exact race build is also the exact build inherited on victory.
    if (this.raceDeal === 'PINK_SLIP') {
      state = addPinkSlipSupport(state, buildRating);
    }

    state.buildRating = Number(state.buildRating || buildRating);
    state.buildArchetype = state.buildArchetype || this.opponentBuildArchetype || 'balancedStreet';
    state.paintColor = this.opponentPaintColor;
    state.nosInstalled = Boolean(
      state.nosInstalled ||
      Number(state.exhaustNosTuning?.nosKit || 0) > 0
    );
    return state;
  }

  applyRivalBuild(config, engineConfig, character) {
    const fallbackRating = Phaser.Math.Clamp(
      Number(this.opponentEncounterRating || character?.skill?.rating || 3),
      1,
      5
    );
    const state = this.getRivalBuildState(config, fallbackRating);
    const tuned = buildCarFromState(config, engineConfig, state);

    this.opponentBuildState = {
      ...state,
      paintColor: this.opponentPaintColor,
      nosInstalled: Number(tuned.car.nosCapacitySeconds || 0) > 0,
      nosPower: Number(tuned.car.nosPower || 0),
      nosCapacitySeconds: Number(tuned.car.nosCapacitySeconds || 0),
    };

    return tuned;
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
    const aiGear = vehicle === this.opponent ? this.ai.chooseRollingStartGear(this.rollingSpeedMps) : null;
    this.setRollingGear(vehicle, aiGear ?? this.chooseRollingStartGear(vehicle));
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
    const wheelCfg = getVisualModWheelVisual(car, carState);
    const bodyScale = cfg.bodyScale * roleScale;
    const wheelSource = this.textures.get(wheelCfg.wheelKey).getSourceImage();
    const wheelFit = getWheelPairFit(wheelCfg, bodyScale, false, wheelSource);
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

    const rearWheel = this.add.image(0, 0, wheelCfg.wheelKey)
      .setScale(wheelFit.rear.wheelScale)
      .setDepth(depth);

    const frontWheel = this.add.image(0, 0, wheelCfg.wheelKey)
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

  setupDrivingTutorial() {
    this.tutorialStep = 'FIRST_GEAR';
    this.tutorialShiftReady = false;
    this.tutorialCountdownStarted = false;
    this.tutorialComplete = false;
    this.tutorialFeedback = '';
    this.tutorialHighlightObjects = [];
    this.tutorialHighlightTweens = [];

    // Keep the lesson card in the top-left so it never covers the drag tree,
    // HUD or the controls the player is being asked to use.
    this.tutorialPanel = this.add.rectangle(360, 200, 640, 250, 0xf8f7f2, 0.995)
      .setStrokeStyle(3, 0x18222b, 1)
      .setDepth(82)
      .setScrollFactor(0);

    this.tutorialStepText = this.add.text(78, 96, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#2a708d',
    }).setDepth(83).setScrollFactor(0);

    this.tutorialTitleText = this.add.text(78, 130, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '12px',
      color: '#101820',
    }).setDepth(83).setScrollFactor(0);

    this.tutorialBodyText = this.add.text(78, 168, '', {
      fontFamily: BODY_FONT,
      fontSize: '12px',
      color: '#202a31',
      fontStyle: '700',
      lineSpacing: 5,
      wordWrap: { width: 565 },
    }).setDepth(83).setScrollFactor(0);

    this.tutorialPromptBox = this.add.rectangle(360, 292, 570, 46, 0xffffff, 1)
      .setStrokeStyle(2, 0x315470, 1)
      .setDepth(83)
      .setScrollFactor(0);

    this.tutorialPromptText = this.add.text(360, 292, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#17232c',
      align: 'center',
      wordWrap: { width: 530 },
    }).setOrigin(0.5).setDepth(84).setScrollFactor(0);

    this.renderDrivingTutorialStep();
  }

  tutorialStepNumber() {
    const order = [
      'FIRST_GEAR',
      'LAUNCH_PREP',
      'LAUNCH',
      'GEAR_2',
      'POWER_2',
      'GEAR_3',
      'POWER_3',
      'GEAR_4',
    ];
    return Math.max(1, order.indexOf(this.tutorialStep) + 1);
  }

  clearTutorialHighlights() {
    (this.tutorialHighlightTweens || []).forEach(tween => {
      try { tween?.stop?.(); } catch (e) {}
    });
    this.tutorialHighlightTweens = [];

    (this.tutorialHighlightObjects || []).forEach(obj => {
      try { obj?.destroy?.(); } catch (e) {}
    });
    this.tutorialHighlightObjects = [];
  }

  tutorialTargetRect(key) {
    if (key === 'clutch') return this.controls.layout.clutch;
    if (key === 'throttle') return this.controls.layout.throttle;
    if (key === 'shifter') return this.controls.layout.shifter;

    if (key === 'gear') {
      return new Phaser.Geom.Rectangle(
        this.hud.gearText.x - 52,
        this.hud.gearText.y - 42,
        104,
        84
      );
    }

    if (key === 'tach') {
      const p = this.hud.sourcePoint(337, 278);
      return new Phaser.Geom.Rectangle(p.x - 82, p.y - 82, 164, 164);
    }

    if (key === 'tree') {
      const signal = this.treeSprite;
      return new Phaser.Geom.Rectangle(
        Number(signal?.x || 755), Number(signal?.y || 90),
        Number(signal?.displayWidth || 185), 230
      );
    }

    return null;
  }

  addTutorialHighlight(key, label, colour = 0x45d7ff) {
    const rect = this.tutorialTargetRect(key);
    if (!rect) return;

    const box = this.add.rectangle(
      rect.centerX,
      rect.centerY,
      rect.width,
      rect.height,
      colour,
      0.055
    ).setStrokeStyle(4, colour, 0.98)
      .setDepth(78)
      .setScrollFactor(0);

    const tagY = Math.max(254, rect.y - 16);
    const tag = this.add.text(rect.centerX, tagY, label, {
      fontFamily: PIXEL_FONT,
      fontSize: '6px',
      color: '#101820',
      backgroundColor: '#ffffff',
      padding: { x: 10, y: 6 },
    }).setOrigin(0.5, 1)
      .setDepth(79)
      .setScrollFactor(0);

    const arrow = this.add.graphics().setDepth(79).setScrollFactor(0);
    arrow.fillStyle(colour, 1);
    arrow.fillTriangle(
      rect.centerX - 8,
      rect.y - 10,
      rect.centerX + 8,
      rect.y - 10,
      rect.centerX,
      rect.y + 2
    );

    this.tutorialHighlightObjects.push(box, tag, arrow);
    const tween = this.tweens.add({
      targets: box,
      alpha: { from: 0.55, to: 1 },
      duration: 480,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tutorialHighlightTweens.push(tween);
  }

  setTutorialStep(step, { shiftReady = false, feedback = '' } = {}) {
    if (!this.isTutorial || this.tutorialComplete) return;
    this.tutorialStep = step;
    this.tutorialShiftReady = Boolean(shiftReady);
    this.tutorialFeedback = feedback;
    this.renderDrivingTutorialStep();
  }

  setTutorialFeedback(message = '') {
    if (!this.isTutorial || this.tutorialComplete) return;
    const next = String(message || '');
    if (this.tutorialFeedback === next) return;
    this.tutorialFeedback = next;
    this.renderDrivingTutorialStep();
  }

  renderDrivingTutorialStep() {
    if (!this.isTutorial || !this.tutorialPanel || this.tutorialComplete) return;

    this.clearTutorialHighlights();

    const stepNo = this.tutorialStepNumber();
    let title = '';
    let body = '';
    let prompt = '';
    let targets = [];

    if (this.tutorialStep === 'FIRST_GEAR') {
      title = 'CLUTCH + FIRST GEAR';
      body = 'Hold the CLUTCH. While holding it, SWIPE UP on the shifter to select 1st. Watch the gear display change.';
      prompt = 'YOUR TURN // HOLD CLUTCH + SHIFT UP';
      targets = [
        ['clutch', 'HOLD CLUTCH', 0x45d7ff],
        ['shifter', 'SWIPE UP', 0x62e8c7],
        ['gear', 'GEAR DISPLAY', 0xffe08a],
      ];
    } else if (this.tutorialStep === 'LAUNCH_PREP') {
      title = 'BUILD REVS + WAIT FOR GREEN';
      body = this.tutorialCountdownStarted
        ? 'Keep the clutch held and the accelerator high. Do NOT release the clutch until the street signal turns green.'
        : 'Keep the clutch held. Push the accelerator high and hold it. The start lights will begin when you are ready.';
      prompt = this.tutorialCountdownStarted
        ? 'HOLD BOTH // WAIT FOR GREEN'
        : 'YOUR TURN // CLUTCH HELD + ACCELERATOR HIGH';
      targets = [
        ['clutch', 'KEEP HELD', 0x45d7ff],
        ['throttle', 'HOLD HIGH', 0xffc857],
      ];
      if (this.tutorialCountdownStarted) {
        targets.push(['tree', 'WAIT FOR GREEN', 0x62e8c7]);
      }
    } else if (this.tutorialStep === 'LAUNCH') {
      title = 'LAUNCH';
      body = 'GREEN. Release the clutch quickly and keep the accelerator up. Let the car pull away.';
      prompt = 'YOUR TURN // RELEASE CLUTCH + ACCELERATE';
      targets = [
        ['clutch', 'RELEASE', 0x62e8c7],
        ['throttle', 'ACCELERATE', 0xffc857],
      ];
    } else if (this.tutorialStep === 'GEAR_2' || this.tutorialStep === 'GEAR_3' || this.tutorialStep === 'GEAR_4') {
      const targetGear = Number(this.tutorialStep.slice(-1));
      title = 'SHIFT TO ' + targetGear + (targetGear === 2 ? 'ND' : targetGear === 3 ? 'RD' : 'TH') + ' GEAR';

      if (!this.tutorialShiftReady) {
        body = 'Keep accelerating and watch the tachometer. Wait until the revs are high before shifting.';
        prompt = 'YOUR TURN // LET THE REVS CLIMB';
        targets = [
          ['throttle', 'KEEP ACCELERATING', 0xffc857],
          ['tach', 'WATCH REVS', 0xffe08a],
        ];
      } else {
        body = 'Lift off the accelerator, hold the clutch, then SWIPE UP on the shifter. Watch the gear display change to ' + targetGear + '.';
        prompt = 'YOUR TURN // LIFT THROTTLE + CLUTCH + SHIFT UP';
        targets = [
          ['throttle', 'LIFT OFF', 0xffc857],
          ['clutch', 'PRESS CLUTCH', 0x45d7ff],
          ['shifter', 'SWIPE UP', 0x62e8c7],
          ['gear', 'GEAR ' + targetGear, 0xffe08a],
        ];
      }
    } else if (this.tutorialStep === 'POWER_2' || this.tutorialStep === 'POWER_3') {
      const gear = Number(this.tutorialStep.slice(-1));
      title = 'BACK ON THE POWER';
      body = 'You are in ' + gear + (gear === 2 ? 'nd' : 'rd') + '. Release the clutch quickly, get back on the accelerator, then build the revs again.';
      prompt = 'YOUR TURN // RELEASE CLUTCH + ACCELERATE';
      targets = [
        ['clutch', 'RELEASE', 0x62e8c7],
        ['throttle', 'ACCELERATE', 0xffc857],
        ['gear', 'GEAR ' + gear, 0xffe08a],
      ];
    }

    this.tutorialStepText.setText('DRIVING LESSON // STEP ' + stepNo + ' / 8');
    this.tutorialTitleText.setText(title);
    this.tutorialBodyText.setText(body);
    this.tutorialPromptText.setText(this.tutorialFeedback || prompt);
    targets.forEach(target => this.addTutorialHighlight(...target));
  }

  tutorialExpectedShiftGear() {
    if (this.tutorialStep === 'FIRST_GEAR') return 1;
    if (this.tutorialStep === 'GEAR_2' && this.tutorialShiftReady) return 2;
    if (this.tutorialStep === 'GEAR_3' && this.tutorialShiftReady) return 3;
    if (this.tutorialStep === 'GEAR_4' && this.tutorialShiftReady) return 4;
    return null;
  }

  handleTutorialGearRequest(requestedGear, controlState) {
    if (!this.isTutorial || requestedGear == null || this.tutorialComplete) return;

    const expected = this.tutorialExpectedShiftGear();
    const transmission = this.player.transmission;
    const currentOrPending = Number(
      transmission.pendingGear || transmission.currentGear || 0
    );

    let desired = null;
    if (requestedGear === 'UP') {
      desired = Math.max(1, currentOrPending + 1);
    } else if (requestedGear === 'DOWN') {
      desired = Math.max(1, currentOrPending - 1);
    } else if (typeof requestedGear === 'number') {
      desired = requestedGear;
    }

    if (expected == null || desired !== expected) {
      if (
        this.tutorialStep === 'GEAR_2' ||
        this.tutorialStep === 'GEAR_3' ||
        this.tutorialStep === 'GEAR_4'
      ) {
        this.setTutorialFeedback('WAIT // LET THE REVS GET HIGHER FIRST');
      }
      return;
    }

    if (Number(controlState.clutch || 0) < 0.68) {
      this.setTutorialFeedback('CLUTCH FIRST // PRESS AND HOLD THE CLUTCH');
      return;
    }

    if (expected > 1 && Number(controlState.throttle || 0) > 0.45) {
      this.setTutorialFeedback('LIFT OFF THE ACCELERATOR // THEN SHIFT');
      return;
    }

    if (transmission.shiftTimer > 0 || transmission.pendingGear) return;

    // Use the player's current pedal position immediately rather than waiting
    // one physics frame, so a correct clutch + shifter gesture is recognised.
    this.player.clutch.pedal = Number(controlState.clutch || 0);
    this.player.throttle = Number(controlState.throttle || 0);

    const accepted = this.player.requestGear(expected);
    if (accepted) {
      this.setTutorialFeedback('GOOD // KEEP THE CLUTCH HELD UNTIL THE GEAR ENGAGES');
    }
  }

  tutorialShiftRPM() {
    const limiter = Number(
      this.player?.config?.engineLimiterRPM ||
      this.player?.config?.engineRedlineRPM ||
      7800
    );
    return limiter * 0.78;
  }

  updateDrivingTutorial(controlState, telemetry = {}) {
    if (!this.isTutorial || this.tutorialComplete) return;

    const clutch = Number(controlState.clutch || 0);
    const throttle = Number(controlState.throttle || 0);
    const gear = Number(telemetry.gear || this.player.transmission.currentGear || 0);
    const pending = Number(this.player.transmission.pendingGear || 0);
    const rpm = Number(telemetry.rpm || 0);
    const speed = Number(telemetry.speedKmh || 0);

    if (this.tutorialStep === 'FIRST_GEAR') {
      if ((gear === 1 || pending === 1) && clutch >= 0.68) {
        if (gear === 1) this.setTutorialStep('LAUNCH_PREP');
      } else if (clutch >= 0.68) {
        this.setTutorialFeedback('GOOD // KEEP HOLDING THE CLUTCH, THEN SWIPE THE SHIFTER UP');
      }
      return;
    }

    if (this.tutorialStep === 'LAUNCH_PREP') {
      if (!this.tutorialCountdownStarted) {
        if (clutch >= 0.68 && throttle >= 0.72 && gear === 1) {
          this.tutorialCountdownStarted = true;
          this.tutorialFeedback = '';
          this.startRace();
          this.renderDrivingTutorialStep();
        }
        return;
      }

      if (this.greenClock != null) {
        this.setTutorialStep('LAUNCH');
      } else if (clutch < 0.68) {
        this.setTutorialFeedback('CLUTCH BACK IN // THE LIGHTS PAUSE UNTIL YOU HOLD IT');
      } else if (throttle < 0.62) {
        this.setTutorialFeedback('MORE THROTTLE // HOLD THE ACCELERATOR HIGH');
      } else if (this.tutorialFeedback) {
        this.tutorialFeedback = '';
        this.renderDrivingTutorialStep();
      }
      return;
    }

    if (this.tutorialStep === 'LAUNCH') {
      if (clutch <= 0.35 && throttle >= 0.60 && speed >= 3) {
        this.setTutorialStep('GEAR_2');
      }
      return;
    }

    if (this.tutorialStep === 'GEAR_2' || this.tutorialStep === 'GEAR_3' || this.tutorialStep === 'GEAR_4') {
      const targetGear = Number(this.tutorialStep.slice(-1));
      const previousGear = targetGear - 1;

      if (!this.tutorialShiftReady && gear === previousGear && rpm >= this.tutorialShiftRPM()) {
        this.tutorialShiftReady = true;
        this.tutorialFeedback = '';
        this.renderDrivingTutorialStep();
        return;
      }

      if (gear === targetGear) {
        if (targetGear >= 4) {
          this.completeTutorialToWorkshop();
        } else {
          this.setTutorialStep('POWER_' + targetGear);
        }
      }
      return;
    }

    if (this.tutorialStep === 'POWER_2' || this.tutorialStep === 'POWER_3') {
      const currentGear = Number(this.tutorialStep.slice(-1));
      if (gear === currentGear && clutch <= 0.35 && throttle >= 0.60) {
        this.setTutorialStep('GEAR_' + (currentGear + 1));
      }
    }
  }

  completeTutorialToWorkshop() {
    if (!this.isTutorial || this.tutorialComplete || this.tutorialTransitioning) return;

    this.tutorialComplete = true;
    this.tutorialTransitioning = true;
    this.clearTutorialHighlights();

    this.controls.enabled = false;
    this.controls.throttle = 0;
    this.controls.clutch = 1;
    this.engineAudio?.fadeOut();

    this.tutorialPromptText?.setText('LESSON COMPLETE // RETURNING TO ' +
      (this.registry.get('openingChapter') === 'tutorial' ? 'SAYAKA' : 'DAICHI'));
    saveSessionState(this.registry);

    // RaceScene has repeatedly proven fragile when it tears down controls,
    // audio and touch capture while also constructing an interactive popup on
    // iOS. Finish the lesson with the same controlled reload used elsewhere in
    // the app, then show the completion choice safely inside GarageScene.
    try {
      sessionStorage.setItem('tokyoShiftInternalReload', '1');
      sessionStorage.setItem('tokyoShiftBootMessage', 'RETURNING TO WORKSHOP');
      sessionStorage.setItem('tokyoShiftForceGarage', '1');
      sessionStorage.setItem('tokyoShiftTutorialComplete', '1');
    } catch (e) {}

    window.TOKYO_SHIFT_SHOW_SPLASH?.('RETURNING TO WORKSHOP');

    window.setTimeout(() => {
      window.location.reload();
    }, 90);
  }


  startRace() {
    if (this.raceStarted || this.finished) return;
    this.raceStarted = true;
    this.devCutsceneControl?.setVisible(false);
    this.countdownClock = 0;
    this.greenClock = null;
    this.startMoved = false;
    this.opponentStartMoved = false;
    this.startButton.setVisible(false).disableInteractive();
    this.startButtonText.setVisible(false);
    // The top-left location title replaces the cancel control only after
    // launch is pressed, at the same y-coordinate as the rival's name.
    this.raceLocationText?.setVisible(true);
    if (!this.isTutorial) {
      this.cancelButton?.setVisible(false).disableInteractive();
      this.cancelButtonText?.setVisible(false);
    }

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
    if (this.countdownClock < 2) return 'PEDESTRIAN WARNING';
    if (this.countdownClock < 3) return 'COUNT 3';
    if (this.countdownClock < 4) return 'COUNT 2';
    if (this.countdownClock < 5) return 'COUNT 1';
    return 'GREEN';
  }

  update(_, deltaMs) {
    if (sceneCutsceneActive(this)) return;

    const dt = Math.min(deltaMs / 1000, 1 / 30);
    this.raceClock += dt;

    if (Phaser.Input.Keyboard.JustDown(this.controls.keys.debug)) this.debug.toggle();
    if (Phaser.Input.Keyboard.JustDown(this.controls.keys.restart)) this.scene.start('GarageScene');

    if (this.resultsShown) return;
    if (this.isTutorial && this.tutorialComplete) return;

    const controlState = this.controls.update();
    const requestedGear = this.controls.consumeGearRequest();

    const rollingCountdown = this.isRollingStart && this.raceStarted && this.greenClock == null;

    if (this.isTutorial) {
      this.handleTutorialGearRequest(requestedGear, controlState);
    } else if (rollingCountdown && requestedGear != null) {
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
      const tutorialCanAdvanceTree = !this.isTutorial || (
        this.tutorialStep === 'LAUNCH_PREP' &&
        Number(controlState.clutch || 0) >= 0.68 &&
        Number(controlState.throttle || 0) >= 0.62
      );

      if (tutorialCanAdvanceTree) this.countdownClock += dt;

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
      } else if (this.countdownClock >= STREET_GREEN_SECONDS) {
        this.greenClock = this.raceClock;
      }
    }

    let playerT;
    let oppT;

    if (this.isTutorial) {
      const tutorialControls = {
        ...controlState,
        // Before green the tutorial keeps the drivetrain safely disconnected.
        // The visible lesson still requires the player to hold the real clutch.
        clutch: this.greenClock == null ? 1 : controlState.clutch,
        nos: false,
      };
      playerT = this.player.update(dt, tutorialControls);
      oppT = null;
    } else if (this.isRollingStart && this.raceStarted && this.greenClock == null) {
      playerT = this.advanceRollingVehicle(this.player, dt);
      oppT = this.advanceRollingVehicle(this.opponent, dt);
    } else {
      const aiState = this.ai.update(dt, this.raceClock, this.greenClock);
      playerT = this.player.update(dt, controlState);
      oppT = this.opponent.update(dt, aiState);
    }

    this.engineAudio?.update(
      playerT,
      this.isTutorial ? null : oppT,
      this.player.config,
      this.opponent.config,
      dt
    );

    if (!this.isTutorial) this.handleTiming(playerT, oppT);
    this.drawScene(playerT, oppT, dt);

    let status = '';
    if (this.isTutorial) {
      status = 'DRIVER TRAINING // FOLLOW THE HIGHLIGHTED CONTROLS';
    } else if (this.falseStart) status = 'RED LIGHT';
    else if (!this.raceStarted) {
      status = this.raceType.toUpperCase() + '  //  ' + this.raceDistanceLabel + '  //  ' +
        cars[this.selectedCarId].shortName + ' vs ' + cars[this.opponentCarId].shortName;
    } else if (this.greenClock != null) {
      status = (this.raceClock - this.greenClock) < 0.70 ? 'GO!' : '';
    }
    else if (this.isRollingStart) status = 'ROLLING 60 KM/H  //  ' + this.raceDistanceLabel + '  //  SELECT GEAR';
    else if (this.countdownClock < 2) status = 'STAGED';

    this.hud.update(playerT, status);
    this.debug.update(playerT);
    this.updateDrivingTutorial(controlState, playerT);

    if (this.finished) {
      this.afterFinishTimer += dt;
      const elapsedSinceFirstFinish = this.firstFinishClock == null
        ? 0
        : this.raceClock - this.firstFinishClock;

      // Normal close races keep the full fly-past. A huge performance gap gets
      // a hard cap so the player never waits more than ~2 seconds after the
      // winner crosses the line.
      const normalFlyPastReady = this.afterFinishTimer > 0.82;
      const hardCapReached = this.firstFinishClock != null && elapsedSinceFirstFinish >= 2.0;
      if ((normalFlyPastReady || hardCapReached) && !this.resultsShown) {
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
      if (this.times.finish == null) {
        this.times.maxKmh = Math.max(Number(this.times.maxKmh || 0), Number(pt.speedKmh || 0));
      }
      if (!this.isRollingStart && this.times.zeroToSixty == null && pt.speedKmh >= 60) {
        this.times.zeroToSixty = elapsed;
      }
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
      if (this.opponentTimes.finish == null) {
        this.opponentTimes.maxKmh = Math.max(
          Number(this.opponentTimes.maxKmh || 0),
          Number(ot.speedKmh || 0)
        );
      }
      if (!this.isRollingStart && this.opponentTimes.zeroToSixty == null && ot.speedKmh >= 60) {
        this.opponentTimes.zeroToSixty = elapsed;
      }
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

    this.aiDiagnostics.raceTimes = { ...this.opponentTimes };

    if (!this.finished) {
      const bothFinished = this.playerFinishClock != null && this.opponentFinishClock != null;
      const dqComplete = this.falseStart && this.opponentFinishClock != null;
      const finishElapsed = this.firstFinishClock == null
        ? 0
        : this.raceClock - this.firstFinishClock;
      const finishTimeout = this.firstFinishClock != null && finishElapsed >= 2.0;

      if (finishTimeout && !bothFinished && !dqComplete) {
        this.finishTimedOut = true;
      }
      if (bothFinished || dqComplete || finishTimeout) this.finished = true;
    }
  }

  showResultsOverlay() {
    this.engineAudio?.fadeOut();
    this.resultsShown = true;
    this.controls.enabled = false;

    if (this.devCutsceneControl) {
      this.devCutsceneControl.button.setDepth(290);
      this.devCutsceneControl.label.setDepth(291);
      this.devCutsceneControl.setVisible(true);
    }
    this.cancelButton?.disableInteractive();
    this.startButton?.disableInteractive();

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

    const wasSpecialChallenge = Boolean(this.registry.get('selectedRaceSpecialChallenge'));
    const settlement = (playerWon || opponentWon)
      ? this.settleRace(playerWon)
      : null;

    if (playerWon) playVictorySting();
    else stopMusic();

    const isPinkSlip = this.raceDeal === 'PINK_SLIP';
    const playerCharacter = characters[this.playerCharacterId] || characters.renMizuno;
    const rivalCharacter = getCharacterForContext(
      this.opponentCharacterId,
      {
        rivalContext: true,
        playerCharacterId: this.registry.get('playerCharacterId') || 'renMizuno',
      }
    ) || characters[this.opponentCharacterId] || characters.kaitoFujimori;
    const resultPose = playerWon ? 'win' : 'loss';
    const accent = playerWon ? 0xf2b84b : 0x6f8edb;
    const accentBright = playerWon ? '#ffd36a' : '#94b0ff';
    const accentSoft = playerWon ? '#f2b84b' : '#6f8edb';
    const paper = 0xf1eadb;
    const ink = 0x11141a;
    const depth = 200;
    const titleFont = PIXEL_FONT;
    const dataFont = BODY_FONT;
    const formatTime = value => value == null ? '—' : value.toFixed(3) + ' s';
    const formatSpeed = value => value == null ? '—' : value.toFixed(1);

    const rewardFor = () => {
      if (!settlement) return { primary: 'RACE COMPLETE', secondary: '' };

      if (settlement.tutorial) {
        return {
          primary: 'PRACTICE COMPLETE',
          secondary: 'NO CASH // NO RECORD',
        };
      }

      if (settlement.crewRecruit) {
        if (!settlement.playerWon) {
          return {
            primary: 'STOCK CHALLENGE LOST',
            secondary: 'CHALLENGE REMAINS OPEN',
          };
        }
        return settlement.crewRecruitJoined
          ? {
              primary: 'CREW MEMBER JOINED',
              secondary: 'SIGNATURE CAR LOANED TO WAREHOUSE HQ',
            }
          : {
              primary: 'STOCK CHALLENGE WON',
              secondary: 'RETURN TO THE MEET',
            };
      }

      if (settlement.crewBattle) {
        if (settlement.crewBattleContinues) {
          return {
            primary: 'CREW SCORE  ' + settlement.playerScore + ' - ' + settlement.opponentScore,
            secondary: 'ROUND ' + settlement.roundNumber + '/' + CREW_BATTLE_LINEUP_SIZE + ' COMPLETE',
          };
        }
        if (settlement.crewBattleCompleted) {
          const couponLine = settlement.couponAwards > 0 && settlement.couponCarId
            ? String(cars[settlement.couponCarId]?.shortName || 'CAR').toUpperCase() +
              ' COUPONS +' + settlement.couponAwards
            : 'REPLAY // NO EXTRA REWARD';
          return {
            primary: 'REGIONAL CREW DEFEATED',
            secondary:
              settlement.playerScore + ' - ' + settlement.opponentScore + ' // ' +
              (settlement.crewBattleFirstClear
                ? '+¥' + Number(settlement.cashReward || 0).toLocaleString('en-US') + ' // ' + couponLine
                : couponLine) +
              (settlement.tokyoChampionshipInvited ? ' // TOKYO CHAMPIONSHIP INVITATION' : ''),
          };
        }
        return {
          primary: 'CREW BATTLE LOST',
          secondary: settlement.playerScore + ' - ' + settlement.opponentScore + ' // TRY AGAIN',
        };
      }

      if (settlement.teamChallenge) {
        if (settlement.teamChallengeFailed) {
          return settlement.teamChallengePerfectAttempt
            ? {
                primary: 'PERFECT SWEEP RESET',
                secondary: 'REGIONAL CHAMPION BADGE KEPT // START AGAIN AT 0 / 7',
              }
            : {
                primary: 'CHALLENGE PAUSED',
                secondary: settlement.progress + ' / 7 DEFEATED // RESUME LATER',
              };
        }
        if (settlement.teamChallengeContinues) {
          return {
            primary: 'RACER ' + settlement.stageNumber + ' DEFEATED',
            secondary: settlement.progress + ' / 7 CLEARED',
          };
        }
        if (settlement.teamChallengeCompleted) {
          const donor = String(settlement.donorLabel || 'DONOR CAR').toUpperCase();
          const couponText = settlement.couponAwards > 0
            ? donor + ' COUPON ' + settlement.couponCount + ' / ' + settlement.couponRequired
            : donor + ' COUPON ALREADY CLAIMED';
          if (settlement.teamChallengePerfect) {
            return {
              primary: 'PERFECT 7–0 ★  +¥' + Number(settlement.totalReward || 0).toLocaleString('en-US'),
              secondary: 'REGIONAL CHAMPION ★ // ' + couponText,
            };
          }
          return {
            primary: 'REGIONAL CHAMPION  +¥' + Number(settlement.completionReward || 0).toLocaleString('en-US'),
            secondary: 'CHAMPION BADGE EARNED // ' + couponText,
          };
        }
      }

      if (settlement.competition) {
        if (settlement.competitionFailed) {
          return {
            primary: 'STREAK BROKEN',
            secondary: 'SHOWDOWN OVER // ROUND ' + settlement.roundNumber + '/3',
          };
        }
        if (settlement.competitionContinues) {
          return {
            primary: 'ROUND ' + settlement.roundNumber + ' CLEARED',
            secondary: (3 - settlement.roundNumber) + ' RACE' +
              ((3 - settlement.roundNumber) === 1 ? '' : 'S') + ' TO GRAND PRIZE',
          };
        }
        if (settlement.competitionWon && settlement.prizeType === 'COUPON') {
          return {
            primary: cars[settlement.prizeCouponCarId].shortName + ' COUPON WON',
            secondary:
              settlement.couponCount + ' / ' + settlement.couponRequired +
              ' COUPONS // REDEEM AT TOKYO AUTO MARKET',
          };
        }
        if (settlement.competitionWon) {
          return {
            primary: '+¥' + Number(settlement.prizeCash || 0).toLocaleString('en-US'),
            secondary: 'SHOWDOWN CLEARED // BALANCE ¥' +
              Number(settlement.cash || 0).toLocaleString('en-US'),
          };
        }
      }

      if (isPinkSlip) {
        return playerWon
          ? {
              primary: 'NEW CAR WON',
              secondary: cars[this.opponentCarId].shortName + ' ADDED TO GARAGE',
            }
          : {
              primary: 'YOUR CAR IS GONE',
              secondary: cars[this.selectedCarId].shortName + ' LOST',
            };
      }

      const delta = Number(settlement.cashDelta || 0);
      return {
        primary: (delta >= 0 ? '+¥' : '-¥') + Math.abs(delta).toLocaleString('en-US'),
        secondary: 'BALANCE ¥' + Number(settlement.cash || 0).toLocaleString('en-US'),
      };
    };

    let reward = rewardFor();
    if (this.lastEasyCouponAward?.carId && cars[this.lastEasyCouponAward.carId]) {
      const award = this.lastEasyCouponAward;
      const line =
        'EASY 20-WIN BONUS // ' + cars[award.carId].shortName +
        ' COUPON ' + award.count + '/' + award.required;
      reward = {
        ...reward,
        secondary: reward.secondary ? reward.secondary + ' // ' + line : line,
      };
    }
    if (this.lastSurpriseReward) {
      const bonus = this.lastSurpriseReward;
      const line = bonus.type === 'WHEEL'
        ? 'BONUS FIND // ' + bonus.label
        : 'BONUS FIND // ' + bonus.label + ' COUPON ' + bonus.count + '/' + bonus.required;
      reward = {
        ...reward,
        secondary: reward.secondary ? reward.secondary + ' // ' + line : line,
      };
    }

    // Frozen Finish Overlay: preserve the actual race frame and skyline.
    // Remove the driving UI, then add translucent manga geometry over the live
    // environment so the result still feels tied to the place where it happened.
    [
      this.controls?.graphics,
      this.controls?.clutchSprite,
      this.controls?.nosSprite,
      this.controls?.shifterSprite,
      this.controls?.throttleSprite,
      this.hud?.cluster,
      this.hud?.status,
      this.hud?.gearBack,
      this.hud?.gearText,
      this.hud?.speedText,
      this.hud?.auxLabel,
      this.treeSprite,
      this.streetCountdownText,
      this.rollCountdownText,
      this.raceLocationText,
      this.rivalText,
      this.stakeText,
      this.startButton,
      this.startButtonText,
      this.cancelButton,
      this.cancelButtonText,
    ].forEach(obj => obj?.setVisible?.(false));
    this.hud?.g?.clear?.();
    this.treeLightsG?.clear?.();

    if (this.finishTimedOut) {
      const hideCarVisual = visual => {
        if (!visual) return;
        [
          visual.rearWheel,
          visual.frontWheel,
          visual.rearWheelBacking,
          visual.frontWheelBacking,
          visual.roadShadow,
          visual.driverSilhouette,
          ...(visual.bodyObjects || []),
        ].forEach(obj => obj?.setVisible?.(false));
      };

      if (this.playerFinishClock == null) hideCarVisual(this.playerVisual);
      if (this.opponentFinishClock == null) hideCarVisual(this.opponentVisual);
    }

    // Normal results retain a light cinematic wash. Pink-slip results get a
    // much stronger ownership-change colour wash which fades in before every
    // other result element.
    const baseWash = this.add.rectangle(780, 360, 1560, 720, 0x05070b, isPinkSlip ? 0.08 : 0.12)
      .setDepth(depth)
      .setScrollFactor(0);

    const pinkSlipShade = isPinkSlip
      ? this.add.rectangle(
          780,
          360,
          1560,
          720,
          playerWon ? 0x2fb99a : 0xd62f67,
          1
        ).setDepth(depth + 1).setScrollFactor(0).setAlpha(0)
      : null;
    const pinkSlipShadeTargetAlpha = playerWon ? 0.34 : 0.33;

    // Editorial result composition. VICTORY and LOSS share the exact same
    // Exo 2 Black Italic treatment; only the outcome colour changes.
    const resultFont = '"Exo 2", sans-serif';
    const resultColor = playerWon ? '#a8f3e3' : '#ff9caf';
    const titleTargetX = 92;
    const titleStyle = {
      fontFamily: resultFont,
      fontSize: '88px',
      color: resultColor,
      fontStyle: 'italic 900',
      stroke: '#11141a',
      strokeThickness: 4,
    };

    const finalRegionalWin = Boolean(
      settlement?.teamChallengeCompleted && playerWon
    );
    const title = this.add.text(
      titleTargetX,
      196,
      settlement?.teamChallenge
        ? (finalRegionalWin
            ? 'WON'
            : playerWon
              ? 'WIN #' + Number(settlement.stageNumber || 1)
              : 'LOSS')
        : isPinkSlip
          ? (playerWon ? 'CAR WON!' : 'CAR LOST')
          : (playerWon ? 'VICTORY' : 'LOSS'),
      titleStyle
    ).setDepth(depth + 8).setScrollFactor(0);

    const challengeTitle = finalRegionalWin
      ? this.add.text(titleTargetX, 134, 'CHALLENGE', {
          ...titleStyle,
          fontSize: '46px',
        }).setDepth(depth + 8).setScrollFactor(0)
      : null;

    const regionalBadge = finalRegionalWin && this.textures.exists('regionalChallengeBadge')
      ? this.add.image(1450, 590, 'regionalChallengeBadge')
          .setDisplaySize(104, 104)
          .setDepth(depth + 12)
          .setScrollFactor(0)
          .setAlpha(0)
          .setAngle(-8)
      : null;
    if (regionalBadge) {
      regionalBadge.stampTargetScaleX = regionalBadge.scaleX;
      regionalBadge.stampTargetScaleY = regionalBadge.scaleY;
      regionalBadge.setScale(
        regionalBadge.scaleX * 1.65,
        regionalBadge.scaleY * 1.65
      );
    }

    const perfectStarBadge =
      finalRegionalWin &&
      settlement?.teamChallengePerfect &&
      this.textures.exists('regionalPerfectStarBadge')
        ? this.add.image(1335, 590, 'regionalPerfectStarBadge')
            .setDisplaySize(88, 88)
            .setDepth(depth + 13)
            .setScrollFactor(0)
            .setAlpha(0)
            .setAngle(8)
        : null;
    if (perfectStarBadge) {
      perfectStarBadge.stampTargetScaleX = perfectStarBadge.scaleX;
      perfectStarBadge.stampTargetScaleY = perfectStarBadge.scaleY;
      perfectStarBadge.setScale(
        perfectStarBadge.scaleX * 1.65,
        perfectStarBadge.scaleY * 1.65
      );
    }

    const startLabel = this.isRollingStart ? 'ROLLING START' : 'STANDING START';
    const contextType = isPinkSlip
      ? 'PINK SLIP'
      : this.raceMode === 'COMPETITION'
        ? 'STREET SHOWDOWN'
        : this.raceMode === 'TUNER_TEAM'
          ? 'REGIONAL TEAM CHALLENGE'
          : this.raceMode === 'CREW_RECRUIT'
            ? 'CREW RECRUITMENT'
            : this.raceMode === 'CREW_BATTLE'
              ? 'CREW BATTLE'
              : 'STREET RACE';

    let contextExtra = '';
    if (settlement?.competition && settlement.roundNumber) {
      contextExtra = ' // ROUND ' + settlement.roundNumber + '/3';
    } else if (settlement?.crewBattle && settlement.roundNumber) {
      contextExtra = ' // ROUND ' + settlement.roundNumber + '/' + CREW_BATTLE_LINEUP_SIZE;
    } else if (settlement?.teamChallenge && settlement.stageNumber) {
      contextExtra = ' // RACER ' + settlement.stageNumber + '/7';
    }

    const contextLine = settlement?.teamChallenge
      ? (
          String(this.raceDistrict).toUpperCase() +
          contextExtra +
          ' // ' + this.raceDistanceLabel +
          ' // ' + (this.isRollingStart ? 'ROLLING' : 'STANDING')
        )
      : (
          contextType + contextExtra + ' // ' + this.raceDistanceLabel + ' // ' + startLabel +
          ' // ' + String(this.raceDistrict + ' · ' + this.raceLocationLabel).toUpperCase()
        );

    const rivalCar = cars[this.opponentCarId] || {};
    const rivalConfig = this.opponent?.config || rivalCar;
    const rivalPower = Math.round(Number(rivalConfig.powerKW || rivalCar.powerKW || 0));
    const rivalMass = Math.round(Number(rivalConfig.vehicleMassKg || rivalCar.vehicleMassKg || 0));
    const rivalBuildLabel = this.opponentBuildArchetype
      ? ' // ' + String(this.opponentBuildArchetype).replaceAll('_', ' ').toUpperCase()
      : this.opponentBuildRating
        ? ' // BUILD ' + Number(this.opponentBuildRating) + '/5'
        : '';
    const rivalCarLine =
      String(rivalCar.name || rivalCar.shortName || 'RIVAL CAR').toUpperCase() +
      (rivalPower ? ' // ' + rivalPower + ' KW' : '') +
      (rivalMass ? ' // ' + rivalMass + ' KG' : '') +
      rivalBuildLabel;

    const awardParts = [];
    const cashDelta = Number(settlement?.cashDelta || 0);
    if (cashDelta > 0) {
      awardParts.push('CASH +¥' + cashDelta.toLocaleString('en-US'));
    } else if (cashDelta < 0) {
      awardParts.push('CASH -¥' + Math.abs(cashDelta).toLocaleString('en-US'));
    }

    if (isPinkSlip) {
      if (playerWon) {
        awardParts.push(
          'CAR WON · ' +
          String(rivalCar.shortName || rivalCar.name || 'RIVAL CAR').toUpperCase()
        );
      } else {
        awardParts.push(
          'CAR LOST · ' +
          String(cars[this.selectedCarId]?.shortName || cars[this.selectedCarId]?.name || 'YOUR CAR').toUpperCase()
        );
      }
    }
    if (playerWon && settlement?.crewRecruitJoined) {
      awardParts.push('CREW MEMBER JOINED');
      awardParts.push('SIGNATURE CAR LOANED');
    }
    if (playerWon && settlement?.teamChallengeCompleted) {
      awardParts.push(String(
        settlement.badgeLabel ||
        (settlement.teamChallengePerfect ? 'REGIONAL CHAMPION ★' : 'REGIONAL CHAMPION')
      ).toUpperCase());
      if (Number(settlement.couponAwards || 0) > 0) {
        awardParts.push(
          String(settlement.donorLabel || 'DONOR CAR').toUpperCase() +
          ' COUPON +' + Number(settlement.couponAwards || 0)
        );
      }
      if (settlement.tokyoChampionshipInvited) awardParts.push('TOKYO CHAMPIONSHIP INVITATION');
    }
    if (playerWon && settlement?.crewBattleCompleted && settlement.crewBattleFirstClear) {
      if (Number(settlement.couponAwards || 0) > 0 && settlement.couponCarId) {
        awardParts.push(
          String(cars[settlement.couponCarId]?.shortName || 'CAR').toUpperCase() +
          ' COUPONS +' + Number(settlement.couponAwards || 0)
        );
      }
      if (settlement.tokyoChampionshipInvited) awardParts.push('TOKYO CHAMPIONSHIP INVITATION');
    }
    if (playerWon && settlement?.competitionWon && settlement.prizeType === 'COUPON') {
      awardParts.push(
        String(cars[settlement.prizeCouponCarId]?.shortName || 'CAR').toUpperCase() +
        ' COUPON · ' + Number(settlement.couponCount || 0) + '/' + Number(settlement.couponRequired || 0)
      );
    }
    if (playerWon && this.lastEasyCouponAward?.carId) {
      const award = this.lastEasyCouponAward;
      awardParts.push(
        '20-WIN BONUS · ' + String(cars[award.carId]?.shortName || 'CAR').toUpperCase() +
        ' COUPON ' + award.count + '/' + award.required
      );
    }
    if (playerWon && this.lastSurpriseReward) {
      const bonus = this.lastSurpriseReward;
      awardParts.push(
        bonus.type === 'WHEEL'
          ? 'BONUS FIND · ' + String(bonus.label || 'WHEEL').toUpperCase()
          : 'BONUS FIND · ' + String(bonus.label || 'CAR').toUpperCase() +
            ' COUPON ' + bonus.count + '/' + bonus.required
      );
    }

    const teamStateAfterResult = settlement?.teamChallenge
      ? getTunerTeamChallengeState(
          this.registry,
          String(settlement.regionId || this.raceDistrict || '').toUpperCase()
        )
      : null;
    const teamResultIsFinal = Boolean(settlement?.teamChallengeCompleted);
    const teamStreakActive = Boolean(
      settlement?.teamChallenge &&
      playerWon &&
      !teamResultIsFinal &&
      teamStateAfterResult?.perfectEligible !== false
    );

    let resultRowLabel = 'AWARDS';
    let resultRowText = awardParts.length ? awardParts.join(' // ') : 'NONE';

    if (settlement?.teamChallenge && !teamResultIsFinal) {
      if (!playerWon) {
        resultRowLabel = 'STATUS';
        resultRowText =
          'CHALLENGE PAUSED // RACE AT MEETS FOR A CHANCE TO CONTINUE';
      } else if (teamStreakActive) {
        resultRowLabel = 'ON STREAK';
        resultRowText = Number(settlement.stageNumber || 1) + ' OF 7';
      } else {
        const remaining = Math.max(
          0,
          TUNER_TEAM_CHALLENGE_STAGES - Number(settlement.stageNumber || 1)
        );
        resultRowLabel = 'STATUS';
        resultRowText =
          remaining + ' RACE' + (remaining === 1 ? '' : 'S') + ' TO GO';
      }
    }

    const captionStyle = {
      fontFamily: dataFont,
      fontSize: '10px',
      color: '#f4f7f8',
      fontStyle: '700',
      stroke: '#071019',
      strokeThickness: 2,
    };
    const captionLabelStyle = {
      fontFamily: resultFont,
      fontSize: '11px',
      color: '#e1e5e7',
      fontStyle: 'italic 900',
      stroke: '#071019',
      strokeThickness: 2,
    };

    const labelX = 96;
    const valueX = 210;

    const raceLabel = this.add.text(labelX, 374, 'RACE', captionLabelStyle)
      .setDepth(depth + 8).setScrollFactor(0);
    const contextText = this.add.text(valueX, 379, contextLine, {
      ...captionStyle,
      wordWrap: { width: 548 },
    }).setDepth(depth + 8).setScrollFactor(0);

    const carLabel = this.add.text(labelX, 414, 'RIVAL', captionLabelStyle)
      .setDepth(depth + 8).setScrollFactor(0);
    const rivalCarText = this.add.text(valueX, 419, rivalCarLine, {
      ...captionStyle,
      wordWrap: { width: 548 },
    }).setDepth(depth + 8).setScrollFactor(0);

    const awardsLabel = this.add.text(labelX, 454, resultRowLabel, captionLabelStyle)
      .setDepth(depth + 8).setScrollFactor(0);
    const awardsText = this.add.text(
      valueX,
      459,
      resultRowText,
      {
        ...captionStyle,
        color: playerWon ? '#d9f5ee' : '#dec9ce',
        wordWrap: { width: 548 },
      }
    ).setDepth(depth + 8).setScrollFactor(0);

    // Compact two-column timing table, visually tied to the editorial labels.
    const timingRows = [
      ['TIME',
        this.falseStart ? 'DQ' : formatTime(this.times.finish),
        formatTime(this.opponentTimes.finish)],
      ['0–60',
        this.isRollingStart || this.falseStart ? '—' : formatTime(this.times.zeroToSixty),
        this.isRollingStart ? '—' : formatTime(this.opponentTimes.zeroToSixty)],
      ['MAX KM/H',
        this.falseStart ? '—' : formatSpeed(this.times.maxKmh),
        formatSpeed(this.opponentTimes.maxKmh)],
    ];

    const timingObjects = [];
    const timingLabelX = labelX;
    const timingYouX = 260;
    const timingRivalX = 420;
    const timingHeaderY = 526;

    timingObjects.push(
      this.add.text(timingYouX, timingHeaderY, 'YOU', captionLabelStyle)
        .setDepth(depth + 8).setScrollFactor(0),
      this.add.text(timingRivalX, timingHeaderY, 'RIVAL', captionLabelStyle)
        .setDepth(depth + 8).setScrollFactor(0)
    );

    timingRows.forEach((row, index) => {
      const y = 558 + index * 34;
      timingObjects.push(
        this.add.text(timingLabelX, y, row[0], captionLabelStyle)
          .setDepth(depth + 8).setScrollFactor(0),
        this.add.text(timingYouX, y + 5, row[1], {
          ...captionStyle,
          wordWrap: { width: 130 },
        }).setDepth(depth + 8).setScrollFactor(0),
        this.add.text(timingRivalX, y + 5, row[2], {
          ...captionStyle,
          wordWrap: { width: 130 },
        }).setDepth(depth + 8).setScrollFactor(0)
      );
    });

    const playerDisplayName = [
      String(this.registry.get('firstName') || '').trim(),
      String(this.registry.get('lastName') || '').trim(),
    ].filter(Boolean).join(' ') || playerCharacter.name;
    const rivalDisplayName = rivalCharacter.name;

    // Return to the angled manga panels from R381, but crop the portrait image
    // with the exact same polygon used by its frame.
    const playerPanelPoints = [
      new Phaser.Geom.Point(1102, 72),
      new Phaser.Geom.Point(1542, 58),
      new Phaser.Geom.Point(1522, 430),
      new Phaser.Geom.Point(1078, 446),
    ];
    const playerFrame = this.add.graphics().setDepth(depth + 6).setScrollFactor(0);
    playerFrame.fillStyle(paper, 0.74);
    playerFrame.fillPoints(playerPanelPoints, true);
    playerFrame.lineStyle(5, ink, 0.92);
    playerFrame.strokePoints(playerPanelPoints, true);

    const playerProfile = createCharacterProfile(this, {
      characterId: this.playerCharacterId,
      pose: playerWon ? 'win' : 'loss',
      x: 1310,
      y: 252,
      frameWidth: 470,
      frameHeight: 390,
      side: 'right',
      depth: depth + 7,
      flipInward: true,
      mask: false,
      profileOverride: playerWon
        ? { scale: 1.00, offsetX: 0, offsetY: 18 }
        : { scale: 1.04, offsetX: 0, offsetY: 20 },
    });

    const playerMaskShape = this.make.graphics({ add: false });
    playerMaskShape.fillStyle(0xffffff, 1);
    playerMaskShape.fillPoints(playerPanelPoints, true);
    const playerMask = playerMaskShape.createGeometryMask();
    playerProfile?.image?.setMask(playerMask);

    const rivalPanelPoints = [
      new Phaser.Geom.Point(818, 126),
      new Phaser.Geom.Point(1115, 108),
      new Phaser.Geom.Point(1155, 388),
      new Phaser.Geom.Point(792, 406),
    ];
    const rivalFrame = this.add.graphics().setDepth(depth + 6).setScrollFactor(0);
    rivalFrame.fillStyle(paper, 0.72);
    rivalFrame.fillPoints(rivalPanelPoints, true);
    rivalFrame.lineStyle(4, ink, 0.90);
    rivalFrame.strokePoints(rivalPanelPoints, true);

    const rivalProfile = createCharacterProfile(this, {
      characterId: this.opponentCharacterId,
      pose: playerWon ? 'loss' : 'win',
      x: 982,
      y: 257,
      frameWidth: 355,
      frameHeight: 310,
      side: 'left',
      depth: depth + 7,
      flipInward: true,
      dimmed: false,
      mask: false,
      profileOverride: { scale: 1.02, offsetX: 0, offsetY: 18 },
      rivalContext: true,
      playerCharacterId: this.registry.get('playerCharacterId') || 'renMizuno',
    });

    const rivalMaskShape = this.make.graphics({ add: false });
    rivalMaskShape.fillStyle(0xffffff, 1);
    rivalMaskShape.fillPoints(rivalPanelPoints, true);
    const rivalMask = rivalMaskShape.createGeometryMask();
    rivalProfile?.image?.setMask(rivalMask);

    const playerPortraitImage = playerProfile?.image || null;
    const rivalPortraitImage = rivalProfile?.image || null;

    const playerNameText = this.add.text(1515, 452, String(playerDisplayName || 'YOU').toUpperCase(), {
      fontFamily: titleFont,
      fontSize: '7px',
      color: '#f5f0e7',
      backgroundColor: '#11141add',
      padding: { x: 9, y: 5 },
    }).setOrigin(1, 0).setDepth(depth + 10).setScrollFactor(0);

    const rivalNameText = this.add.text(812, 411, String(rivalDisplayName || 'RIVAL').toUpperCase(), {
      fontFamily: titleFont,
      fontSize: '7px',
      color: '#f5f0e7',
      backgroundColor: '#11141add',
      padding: { x: 9, y: 5 },
      align: 'left',
    }).setOrigin(0, 0).setDepth(depth + 10).setScrollFactor(0);

    const rivalQuote = playerWon
      ? (rivalCharacter?.resultQuotes?.loss || 'You got me this time.')
      : (rivalCharacter?.resultQuotes?.win || 'Not quite enough.');
    const rivalQuoteText = this.add.text(812, 446, '“' + rivalQuote + '”', {
      fontFamily: dataFont,
      fontSize: '15px',
      color: '#ffffff',
      backgroundColor: '#11141ae8',
      padding: { x: 12, y: 8 },
      align: 'left',
      fontStyle: '700',
      lineSpacing: 3,
      wordWrap: { width: 330 },
    }).setOrigin(0, 0).setDepth(depth + 10).setScrollFactor(0);

    const returnScene = this.registry.get('raceReturnScene') || 'MeetScene';
    const actionHint = settlement?.gameOver
      ? 'RUN OVER'
      : settlement?.crewBattleContinues
        ? 'NEXT CREW MATCH'
        : settlement?.teamChallengeContinues
          ? 'NEXT CHALLENGER'
          : settlement?.competitionContinues
            ? 'NEXT ROUND'
            : 'CONTINUE';

    const actionHintText = this.add.text(1490, 690, actionHint + ' // TAP ANYWHERE', {
      fontFamily: titleFont,
      fontSize: '6px',
      color: '#9aa3ad',
    }).setOrigin(1, 0.5).setDepth(depth + 25).setScrollFactor(0);
    if (isPinkSlip) actionHintText.setAlpha(0);

    let advanceArmed = false;
    let advanced = false;
    const tapTarget = this.add.rectangle(780, 360, 1560, 720, 0xffffff, 0.001)
      .setDepth(depth + 80)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    const advance = () => {
      if (!advanceArmed || advanced || sceneCutsceneActive(this)) return;
      advanced = true;
      tapTarget.disableInteractive();

      if (isPinkSlip && settlement) {
        this.registry.set('pendingPinkSlipResult', {
          playerWon: Boolean(playerWon),
          gameOver: Boolean(settlement.gameOver),
          wasSpecialChallenge: Boolean(wasSpecialChallenge),
          rivalCharacterId: this.opponentCharacterId,
          playerCharacterId: this.playerCharacterId,
          rivalName: String(rivalCharacter?.name || 'RIVAL').toUpperCase(),
          carName: String(
            playerWon
              ? (cars[this.opponentCarId]?.shortName || 'CAR')
              : (cars[this.selectedCarId]?.shortName || 'CAR')
          ).toUpperCase(),
          acquiredCarId: settlement.acquiredCarId || null,
          completedAt: Date.now(),
        });
        saveSessionState(this.registry);
        this.scene.start('MeetScene');
      } else if (settlement?.gameOver) {
        this.scene.start('RunOverScene');
      } else if (settlement?.crewBattleContinues) {
        this.startNextCrewBattleRound();
      } else if (settlement?.teamChallengeContinues) {
        this.showNextTunerChallengeBriefing();
      } else if (
        settlement?.teamChallengeCompleted ||
        settlement?.teamChallengeFailed
      ) {
        this.registry.set('pendingRegionalChallengeResult', {
          completed: Boolean(settlement.teamChallengeCompleted),
          failed: Boolean(settlement.teamChallengeFailed),
          perfect: Boolean(settlement.teamChallengePerfect),
          regionId: String(settlement.regionId || this.raceDistrict || 'REGION').toUpperCase(),
          rivalCharacterId: this.opponentCharacterId,
          playerCharacterId: this.playerCharacterId,
          rivalName: String(rivalCharacter?.name || 'REGIONAL RIVAL').toUpperCase(),
          cashReward: Number(settlement.totalReward || 0),
          donorLabel: String(settlement.donorLabel || 'DONOR CAR').toUpperCase(),
          couponAwards: Number(settlement.couponAwards || 0),
          badgeLabel: String(
            settlement.badgeLabel ||
            (settlement.teamChallengePerfect ? 'REGIONAL CHAMPION ★' : 'REGIONAL CHAMPION')
          ),
          completedAt: Date.now(),
        });
        saveSessionState(this.registry);
        this.scene.start('MeetScene');
      } else if (settlement?.competitionContinues) {
        this.startNextCompetitionRound();
      } else {
        this.scene.start(returnScene);
      }
    };

    tapTarget.on('pointerdown', advance);

    const nextKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    nextKey.once('down', advance);

    // Cars are already gone. For pink slips the ownership-colour wash lands
    // first, then the key/portraits/headline/details arrive as a second beat.
    const detailObjects = [
      raceLabel, contextText, carLabel, rivalCarText, awardsLabel, awardsText,
      ...timingObjects,
    ];
    const portraitCopy = [playerNameText, rivalNameText, rivalQuoteText];
    detailObjects.forEach(obj => obj.setAlpha(0));
    portraitCopy.forEach(obj => obj.setAlpha(0));

    const pinkRevealDelay = isPinkSlip ? 190 : 0;

    const finalTitleX = title.x;
    title.x = -title.width - 80;
    title.setAlpha(0);

    if (pinkSlipShade) {
      this.tweens.add({
        targets: pinkSlipShade,
        alpha: pinkSlipShadeTargetAlpha,
        duration: 155,
        ease: 'Quad.Out',
      });
    }

    if (playerPortraitImage) {
      const targetX = playerPortraitImage.x;
      playerPortraitImage.x += 250;
      playerPortraitImage.setAlpha(0);
      this.tweens.add({
        targets: playerPortraitImage,
        x: targetX,
        alpha: 1,
        duration: 190,
        delay: pinkRevealDelay,
        ease: 'Expo.Out',
      });
    }

    if (rivalPortraitImage) {
      const targetX = rivalPortraitImage.x;
      rivalPortraitImage.x += 190;
      rivalPortraitImage.setAlpha(0);
      this.tweens.add({
        targets: rivalPortraitImage,
        x: targetX,
        alpha: 1,
        duration: 175,
        delay: pinkRevealDelay + 15,
        ease: 'Expo.Out',
      });
    }

    playerFrame.setAlpha(0);
    rivalFrame.setAlpha(0);
    this.tweens.add({
      targets: [playerFrame, rivalFrame],
      alpha: 1,
      duration: 120,
      delay: pinkRevealDelay,
      ease: 'Linear',
    });

    this.tweens.add({
      targets: portraitCopy,
      alpha: 1,
      duration: 135,
      delay: pinkRevealDelay + 95,
      ease: 'Linear',
    });

    this.tweens.add({
      targets: title,
      x: finalTitleX,
      alpha: 1,
      duration: 215,
      delay: pinkRevealDelay + 65,
      ease: 'Expo.Out',
    });

    if (challengeTitle) {
      const finalChallengeX = challengeTitle.x;
      challengeTitle.x = -challengeTitle.width - 60;
      challengeTitle.setAlpha(0);
      this.tweens.add({
        targets: challengeTitle,
        x: finalChallengeX,
        alpha: 1,
        duration: 190,
        delay: pinkRevealDelay + 25,
        ease: 'Expo.Out',
      });
    }

    if (regionalBadge) {
      this.tweens.add({
        targets: regionalBadge,
        alpha: 1,
        scaleX: regionalBadge.stampTargetScaleX,
        scaleY: regionalBadge.stampTargetScaleY,
        angle: 0,
        duration: 170,
        delay: pinkRevealDelay + 245,
        ease: 'Back.Out',
        onStart: () => this.cameras.main.shake(65, 0.0012),
      });
    }

    if (perfectStarBadge) {
      this.tweens.add({
        targets: perfectStarBadge,
        alpha: 1,
        scaleX: perfectStarBadge.stampTargetScaleX,
        scaleY: perfectStarBadge.stampTargetScaleY,
        angle: 0,
        duration: 165,
        delay: pinkRevealDelay + 390,
        ease: 'Back.Out',
        onStart: () => this.cameras.main.shake(55, 0.001),
      });
    }

    this.tweens.add({
      targets: detailObjects,
      alpha: 1,
      duration: 135,
      delay: pinkRevealDelay + 175,
      ease: 'Linear',
    });

    if (isPinkSlip) {
      this.tweens.add({
        targets: actionHintText,
        alpha: 1,
        duration: 120,
        delay: pinkRevealDelay + 230,
        ease: 'Linear',
      });
    }

    if (!playerWon && playerPortraitImage) {
      this.tweens.add({
        targets: playerPortraitImage,
        y: '+=7',
        duration: 120,
        delay: pinkRevealDelay + 120,
        ease: 'Quad.In',
      });
    } else if (playerWon) {
      this.time.delayedCall(pinkRevealDelay + 55, () => {
        this.cameras.main.shake(isPinkSlip ? 95 : 65, isPinkSlip ? 0.0018 : 0.0012);
      });
    }

    this.time.delayedCall(isPinkSlip ? 560 : 330, () => {
      advanceArmed = true;
    });

    // Preserve the existing special-result follow-ups. They run after the
    // manga panel lands so an ordinary result never waits on animation.
    this.time.delayedCall(390, () => {
      if (!settlement) return;

      if (isPinkSlip) return;

      if (settlement?.competitionWon) {
        const promoterId = CENTRAL_TOKYO_CHARACTER_IDS.dragComplex.manager;
        playMangaCutscene(this, 'competitionChampion', {
          characterOverrides: { PROMOTER: promoterId },
          variables: {
            PROMOTER_NAME: String(
              characters[promoterId]?.name || 'Masato Kuroda'
            ).toUpperCase(),
          },
        });
      }
    });
  }

  showAcquiredCarDelivery(carId) {
    if (!carId || !cars[carId] || this._deliveryPromptCarId === carId) return;
    this._deliveryPromptCarId = carId;

    const picker = showGarageDeliveryPicker(this, {
      carId,
      carName: cars[carId].shortName || cars[carId].name || carId,
      title: 'CAR WON // DELIVERY',
      message: 'Choose which garage should receive your new car.',
      allowCancel: false,
      onSelect: workshopId => {
        const locations = { ...(this.registry.get('carGarageLocations') || {}) };
        locations[carId] = workshopId;
        this.registry.set('carGarageLocations', locations);
        saveSessionState(this.registry);
      },
    });

    // If every garage is full, retain the race's provisional assignment and do
    // not trap the player behind an impossible modal.
    if (!picker) this._deliveryPromptCarId = null;
  }

  getNextTunerChallengeRound() {
    const regionId = String(
      this.registry.get('raceDistrict') || this.registry.get('district') || ''
    ).toUpperCase();
    const state = getTunerTeamChallengeState(this.registry, regionId);
    const round = state.rounds?.[state.stage] || null;
    return { regionId, state, round };
  }

  getRegionalChallengeTableauState() {
    const regionId = String(
      this.registry.get('raceDistrict') || this.registry.get('district') || ''
    ).toUpperCase();
    const state = getTunerTeamChallengeState(this.registry, regionId);
    return {
      regionId,
      state,
      rounds: Array.isArray(state.rounds)
        ? state.rounds.slice(0, TUNER_TEAM_CHALLENGE_STAGES)
        : [],
      perfectMode: Boolean(
        state.perfectAttempt ||
        (state.championEarned && !state.perfectEarned)
      ),
    };
  }

  hideRegionalChallengeRaceUi() {
    if (this._regionalChallengeUiVisibility) return;
    const ui = [
      this.controls?.graphics,
      this.controls?.clutchSprite,
      this.controls?.nosSprite,
      this.controls?.shifterSprite,
      this.controls?.throttleSprite,
      this.hud?.cluster,
      this.hud?.status,
      this.hud?.gearBack,
      this.hud?.gearText,
      this.hud?.speedText,
      this.hud?.auxLabel,
      this.treeSprite,
      this.streetCountdownText,
      this.rollCountdownText,
      this.raceLocationText,
      this.rivalText,
      this.stakeText,
      this.startButton,
      this.startButtonText,
      this.cancelButton,
      this.cancelButtonText,
    ].filter(Boolean);

    this._regionalChallengeUiVisibility = ui.map(obj => ({
      obj,
      visible: obj.visible !== false,
    }));
    ui.forEach(obj => obj.setVisible?.(false));
  }

  restoreRegionalChallengeRaceUi() {
    (this._regionalChallengeUiVisibility || []).forEach(({ obj, visible }) => {
      if (obj?.active !== false) obj?.setVisible?.(visible);
    });
    this._regionalChallengeUiVisibility = null;
  }

  showRegionalChallengeBriefing({ revealCurrent = false } = {}) {
    if (this.regionalChallengeTableau?.active) return;

    const { regionId, state, rounds, perfectMode } = this.getRegionalChallengeTableauState();
    const stageIndex = Math.max(
      0,
      Math.min(TUNER_TEAM_CHALLENGE_STAGES - 1, Number(state.stage || 0))
    );
    const round = rounds[stageIndex];
    if (!state.activeSession || !round) {
      this.scene.start(this.registry.get('raceReturnScene') || 'MeetScene');
      return;
    }

    this.hideRegionalChallengeRaceUi();

    this.regionalChallengeTableau = createRegionalChallengeTableau(this, {
      regionId,
      rounds,
      stageIndex,
      perfectMode,
      revealCurrent,
      onStart: () => {
        this.regionalChallengeTableau?.destroy?.();
        this.regionalChallengeTableau = null;

        this.restoreRegionalChallengeRaceUi();
        // Briefing dismissed. The player now uses the ordinary race START
        // control, keeping the familiar staging beat before every challenge run.
      },
      onPause: () => this.showRegionalChallengePauseWarning(),
    });
  }

  showNextTunerChallengeBriefing() {
    const { regionId, state } = this.getRegionalChallengeTableauState();
    const stageKey = regionId + ':' + Number(state.stage || 0);
    this.registry.set('regionalChallengeRevealCurrentStage', stageKey);
    saveSessionState(this.registry);
    this.startNextTunerChallengeRound();
  }

  pauseRegionalChallenge() {
    const { regionId, state } = this.getRegionalChallengeTableauState();
    const store = { ...(this.registry.get('tunerTeamChallenges') || {}) };
    const perfectSweep = Boolean(
      state.perfectAttempt ||
      (state.championEarned && !state.perfectEarned)
    );

    store[regionId] = {
      ...(store[regionId] || {}),
      ...state,
      invited: true,
      activeSession: false,
      paused: true,
      pausedAt: Date.now(),
      stage: perfectSweep ? 0 : state.stage,
      perfectAttempt: false,
      perfectEligible: perfectSweep ? true : false,
      retryNotBefore: 0,
    };
    this.registry.set('tunerTeamChallenges', store);
    saveSessionState(this.registry);

    this.regionalChallengeTableau?.destroy?.();
    this.regionalChallengeTableau = null;
    this._regionalChallengeUiVisibility = null;
    this.scene.start(this.registry.get('raceReturnScene') || 'MeetScene');
  }

  showRegionalChallengePauseWarning() {
    if (this.regionalChallengePauseWarning?.active) return;

    const { state } = this.getRegionalChallengeTableauState();
    const perfectSweep = Boolean(
      state.perfectAttempt ||
      (state.championEarned && !state.perfectEarned)
    );
    const depth = 500;
    const objects = [];
    const add = obj => {
      objects.push(obj);
      return obj;
    };

    const blocker = add(this.add.rectangle(780, 360, 1560, 720, 0x02050b, 0.82)
      .setDepth(depth).setScrollFactor(0).setInteractive());
    add(this.add.rectangle(780, 360, 760, 300, 0x09111a, 0.998)
      .setStrokeStyle(3, 0xffc65c, 0.98)
      .setDepth(depth + 1).setScrollFactor(0));

    add(this.add.text(780, 274, 'PAUSE REGIONAL CHALLENGE?', {
      fontFamily: PIXEL_FONT,
      fontSize: '14px',
      color: '#ffe09a',
    }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0));

    add(this.add.text(
      780,
      350,
      perfectSweep
        ? 'Pausing ends this Perfect Streak.\nYour next attempt restarts from racer 1.'
        : 'Challenge progress is saved, but leaving breaks the current 7–0 run.',
      {
        fontFamily: BODY_FONT,
        fontSize: '13px',
        color: '#e4edf2',
        align: 'center',
        lineSpacing: 7,
        wordWrap: { width: 650 },
      }
    ).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0));

    const keep = add(this.add.rectangle(650, 448, 220, 48, 0x17242a, 1)
      .setStrokeStyle(1, 0x6d8796, 1).setDepth(depth + 2)
      .setScrollFactor(0).setInteractive({ useHandCursor: true }));
    add(this.add.text(650, 448, 'KEEP RACING', {
      fontFamily: PIXEL_FONT, fontSize: '7px', color: '#dcebf2',
    }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0));

    const confirm = add(this.add.rectangle(910, 448, 230, 48, 0x3a2710, 1)
      .setStrokeStyle(2, 0xffc65c, 1).setDepth(depth + 2)
      .setScrollFactor(0).setInteractive({ useHandCursor: true }));
    add(this.add.text(910, 448, 'PAUSE ANYWAY', {
      fontFamily: PIXEL_FONT, fontSize: '7px', color: '#fff1c7',
    }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0));

    const close = () => {
      objects.forEach(obj => obj?.destroy?.());
      this.regionalChallengePauseWarning = null;
    };
    blocker.on('pointerdown', () => {});
    keep.on('pointerdown', close);
    confirm.on('pointerdown', () => {
      close();
      this.pauseRegionalChallenge();
    });

    this.regionalChallengePauseWarning = blocker;
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
    this.registry.set('selectedOpponentBuildRating', round.opponentBuildRating || null);
    this.registry.set('selectedOpponentBuildArchetype', round.opponentBuildArchetype || null);
    this.registry.set('selectedOpponentBuildState', round.opponentBuildState || null);
    this.registry.set('selectedRaceCategory', 'TUNER_TEAM');
    this.registry.set('selectedRaceType', round.raceType);
    this.registry.set('selectedRaceDistanceM', round.distanceM);
    this.registry.set('selectedRaceDeal', 'TUNER_TEAM');
    this.registry.set('selectedRaceStake', 0);
    this.registry.set('selectedRaceSpecialChallenge', false);
    this.registry.set('selectedRaceMeetOffer', null);
    this.registry.set('raceTimeOfDay', getWorldPhase());
    this.registry.set('raceDistrict', regionId);
    this.registry.set('raceLocationLabel', 'TEAM CHALLENGE // ' + (state.stage + 1) + '/7');

    saveSessionState(this.registry);
    this.scene.restart();
  }

  startNextCrewBattleRound() {
    const state = this.registry.get('crewBattleState');
    if (!state?.active) {
      this.registry.set('selectedRacePlayerCharacterId', null);
      saveSessionState(this.registry);
      this.scene.start(this.registry.get('raceReturnScene') || 'MeetScene');
      return;
    }

    const index = Math.max(
      0,
      Math.min(CREW_BATTLE_LINEUP_SIZE - 1, Number(state.roundIndex || 0))
    );
    const unit = state.lineup?.[index];
    const round = state.rounds?.[index];

    if (!unit || !round || !cars[unit.carId] || !cars[round.carId]) {
      this.registry.set('crewBattleState', null);
      this.registry.set('selectedRacePlayerCharacterId', null);
      saveSessionState(this.registry);
      this.scene.start(this.registry.get('raceReturnScene') || 'MeetScene');
      return;
    }

    this.registry.set('selectedCarId', unit.carId);
    this.registry.set('selectedRacePlayerCharacterId', unit.characterId);
    this.registry.set('selectedOpponentCarId', round.carId);
    this.registry.set('selectedOpponentPaintColor', normalisePaintColor(
      round.paintColor,
      DEFAULT_PAINT_COLOR
    ));
    this.registry.set('selectedOpponentCharacterId', round.characterId);
    this.registry.set('selectedOpponentEncounterRating', round.encounterRating);
    this.registry.set('selectedOpponentEncounterAi', round.encounterAi);
    this.registry.set('selectedOpponentDifficulty', round.difficulty);
    this.registry.set('selectedOpponentBuildRating', round.buildRating);
    this.registry.set(
      'selectedOpponentBuildArchetype',
      round.opponentBuildState?.buildArchetype || null
    );
    this.registry.set('selectedOpponentBuildState', round.opponentBuildState || null);
    this.registry.set('selectedRaceCategory', 'CREW_BATTLE');
    this.registry.set('selectedRaceType', round.raceType);
    this.registry.set('selectedRaceDistanceM', round.distanceM);
    this.registry.set('selectedRaceDeal', 'CREW_BATTLE');
    this.registry.set('selectedRaceStake', 0);
    this.registry.set('selectedRaceSpecialChallenge', false);
    this.registry.set('selectedRaceMeetOffer', null);
    this.registry.set('raceTimeOfDay', getWorldPhase());
    this.registry.set('raceDistrict', state.regionId);
    this.registry.set(
      'raceLocationLabel',
      'CREW BATTLE // ' + (index + 1) + '/' + CREW_BATTLE_LINEUP_SIZE
    );

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
    this.registry.set('selectedOpponentBuildRating', round.opponentBuildRating || null);
    this.registry.set('selectedOpponentBuildArchetype', round.opponentBuildArchetype || null);
    this.registry.set('selectedOpponentBuildState', round.opponentBuildState || null);
    this.registry.set('selectedRaceCategory', 'COMPETITION');
    this.registry.set('selectedRaceType', round.raceType);
    this.registry.set('selectedRaceDeal', 'COMPETITION');
    this.registry.set('selectedRaceStake', 0);
    this.registry.set('selectedRaceSpecialChallenge', false);
    this.registry.set('raceTimeOfDay', getWorldPhase());
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
    const snapshot = this.registry.get('selectedRaceMeetOffer') || {};

    // Persist results for every actual Meet race, not only districts that have
    // a regional team. Older code gated this on hasRegionalTeam(), which meant
    // wins in other Meets were removed from view without ever gaining a saved
    // loss pose/locked card.
    const isMeetRace = Boolean(
      locationId &&
      snapshot &&
      typeof snapshot === 'object' &&
      (snapshot.characterId || this.registry.get('selectedRaceSpecialChallenge'))
    );
    if (!isMeetRace) return;
    const rosters = { ...(this.registry.get('meetRosters') || {}) };
    const current = Array.isArray(rosters[locationId])
      ? rosters[locationId].map(offer => ({ ...offer }))
      : [];

    const resultState = playerWon ? 'PLAYER_WIN' : 'PLAYER_LOSS';
    const isPinkSlip = this.raceDeal === 'PINK_SLIP';
    const isCashRematchLoss = !playerWon && this.raceDeal === 'BET';
    const previousStake = Math.max(0, Number(snapshot.stake || 0));
    const rematchStake = isCashRematchLoss && previousStake > 0
      ? Math.max(1, Math.floor(previousStake * 0.5))
      : previousStake;
    const rematchLosses = isCashRematchLoss
      ? Math.max(0, Number(snapshot.rematchLosses || 0)) + 1
      : Math.max(0, Number(snapshot.rematchLosses || 0));

    const resultOffer = {
      ...snapshot,
      characterId: snapshot.characterId || this.opponentCharacterId,
      carId: snapshot.carId || this.opponentCarId,
      paintColor: normalisePaintColor(
        snapshot.paintColor ?? this.opponentPaintColor,
        DEFAULT_PAINT_COLOR
      ),
      meetLocation: locationId,
      locked: Boolean(playerWon),
      stake: rematchStake,
      rematchLosses,
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
      offer => offer?.characterId === (snapshot.characterId || this.opponentCharacterId)
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

    // Keep a second, slot-bound result record. MeetScene reapplies these on
    // entry even if the generated roster was rebuilt for some unrelated
    // reason. Normal Meet refresh is the only thing that clears them.
    const resultStore = { ...(this.registry.get('meetRaceResults') || {}) };
    const locationResults = Array.isArray(resultStore[locationId])
      ? resultStore[locationId].map(result => ({
          slotIndex: Math.max(0, Number(result?.slotIndex || 0)),
          offer: { ...(result?.offer || {}) },
        }))
      : [];
    const resultSlot = Number.isInteger(Number(snapshot.slotIndex))
      ? Math.max(0, Math.min(2, Number(snapshot.slotIndex)))
      : Math.max(0, Math.min(2, index >= 0 ? index : 0));
    const existingResultIndex = locationResults.findIndex(result =>
      Number(result?.slotIndex) === resultSlot
    );
    const storedResult = { slotIndex: resultSlot, offer: { ...resultOffer } };
    if (existingResultIndex >= 0) locationResults[existingResultIndex] = storedResult;
    else locationResults.push(storedResult);
    resultStore[locationId] = locationResults.slice(0, 3);
    this.registry.set('meetRaceResults', resultStore);

    // A race can outlast the Meet roster timer if the player spends time on
    // staging/results. Give the just-completed roster a fresh visibility window
    // so returning to the Meet always shows the DEFEATED / LAST RUN state
    // instead of immediately generating a replacement driver.
    const resultViewUntil = Date.now() + 180000;
    this.registry.set(
      'meetRefreshAt',
      Math.max(Number(this.registry.get('meetRefreshAt') || 0), resultViewUntil)
    );

    this.registry.set('selectedRaceMeetOffer', null);
  }

  processEasyCouponMilestone(newWins = 0) {
    const milestone = getEasyCouponMilestoneForWins(newWins);
    const processed = Math.max(
      0,
      Number(this.registry.get('easyCouponLastMilestone') || 0)
    );

    if (milestone <= processed) return null;

    // Crossing a 20-win mark on Standard/Hard consumes that milestone without
    // awarding it. This keeps the reward strictly tied to wins earned on Easy.
    this.registry.set('easyCouponLastMilestone', milestone);
    if (this.playerDifficulty !== 'EASY') return null;

    const owned = this.registry.get('ownedCarIds') || [];
    const priceCap = newWins < 40
      ? 4000000
      : newWins < 80
        ? 7500000
        : Infinity;

    // Coupons are inventory, not a one-car progress bar. Reaching the
    // redemption requirement does not remove a model from future rewards.
    const withinPriceBand = AUTO_MARKET_LISTINGS.filter(item =>
      Boolean(cars[item.carId]) && Number(item.price || 0) <= priceCap
    );
    const fallback = AUTO_MARKET_LISTINGS.filter(item => Boolean(cars[item.carId]));

    const eligible = withinPriceBand.length ? withinPriceBand : fallback;
    if (!eligible.length) return null;

    // Still favour discovery when possible, but once every model has been
    // represented the player can keep stockpiling whichever coupons roll.
    const preferred = eligible.filter(item => !ownsCarModel(owned, item.carId));
    const pool = preferred.length ? preferred : eligible;
    const selected = Phaser.Utils.Array.GetRandom(pool);
    if (!selected) return null;

    const coupons = { ...(this.registry.get('carCoupons') || {}) };
    const nextCount = Math.max(0, Number(coupons[selected.carId] || 0)) + 1;
    coupons[selected.carId] = nextCount;
    this.registry.set('carCoupons', coupons);

    return {
      carId: selected.carId,
      milestone,
      count: nextCount,
      required: getCarCouponRequirement(selected.carId),
    };
  }

  settleRace(playerWon) {
    if (this.raceSettlement) return this.raceSettlement;

    const wins = this.registry.get('wins') ?? 0;
    const losses = this.registry.get('losses') ?? 0;
    const oldCash = this.registry.get('cash') ?? 0;

    if (this.isTutorial) {
      saveSessionState(this.registry);
      this.raceSettlement = {
        playerWon,
        cashDelta: 0,
        cash: oldCash,
        pinkMessage: '',
        gameOver: false,
        tutorial: true,
      };
      return this.raceSettlement;
    }

    const newWins = wins + (playerWon ? 1 : 0);
    this.registry.set('wins', newWins);
    this.registry.set('losses', losses + (playerWon ? 0 : 1));
    this.lastEasyCouponAward = playerWon
      ? this.processEasyCouponMilestone(newWins)
      : null;
    this.lastSurpriseReward = playerWon && !this.lastEasyCouponAward
      ? maybeAwardSurpriseReward(this.registry, { playerWon: true })
      : null;

    // A declined regional team call-out is re-offered after 5–10 meaningful
    // regional activities. Travel already counts in MeetScene; completed normal
    // Meet races now count too, so staying and racing in one place cannot stall
    // the re-challenge forever.
    if (
      this.raceMode === 'SINGLE' &&
      (this.registry.get('raceReturnScene') || 'MeetScene') === 'MeetScene'
    ) {
      const regionId = String(
        this.registry.get('raceDistrict') || this.registry.get('district') || ''
      ).toUpperCase();
      const challenges = { ...(this.registry.get('tunerTeamChallenges') || {}) };
      const raw = challenges[regionId];

      if (
        raw &&
        raw.offeredOnce &&
        !raw.invited &&
        Number(raw.reofferVisitsRemaining || 0) > 0
      ) {
        challenges[regionId] = {
          ...raw,
          reofferVisitsRemaining: Math.max(
            0,
            Number(raw.reofferVisitsRemaining || 0) - 1
          ),
        };
        this.registry.set('tunerTeamChallenges', challenges);
      }
    }

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

    if (this.raceMode === 'CREW_RECRUIT') {
      const challenge = this.registry.get('crewRecruitChallenge');
      let recruited = null;

      if (playerWon && challenge?.active) {
        recruited = completeCrewRecruitChallenge(this.registry, challenge);
      } else if (challenge?.active) {
        this.registry.set('crewRecruitChallenge', {
          ...challenge,
          active: true,
          attempts: Math.max(0, Number(challenge.attempts || 0)) + 1,
          lastLossAt: Date.now(),
        });
      }

      this.registry.set('selectedRacePlayerCharacterId', null);
      saveSessionState(this.registry);

      this.raceSettlement = {
        playerWon,
        cashDelta: 0,
        cash: oldCash,
        pinkMessage: '',
        gameOver: false,
        crewRecruit: true,
        crewRecruitWon: Boolean(playerWon),
        crewRecruitJoined: Boolean(recruited),
        crewRecruitRetry: Boolean(!playerWon && challenge?.active),
        crewRecruitCharacterId: challenge?.characterId || this.opponentCharacterId,
        crewRecruitRegionId: String(challenge?.regionId || this.raceDistrict || '').toUpperCase(),
        crewRecruitLoanCarId: recruited?.loanCarId || null,
      };
      return this.raceSettlement;
    }

    if (this.raceMode === 'CREW_BATTLE') {
      const state = this.registry.get('crewBattleState');
      if (!state?.active) {
        this.registry.set('selectedRacePlayerCharacterId', null);
        saveSessionState(this.registry);
        this.raceSettlement = {
          playerWon,
          cashDelta: 0,
          cash: oldCash,
          pinkMessage: '',
          gameOver: false,
          crewBattle: true,
          crewBattleFailed: true,
          crewBattleContinues: false,
          crewBattleCompleted: false,
          regionId: String(this.raceDistrict || '').toUpperCase(),
          playerScore: 0,
          opponentScore: 0,
        };
        return this.raceSettlement;
      }

      const regionId = String(state.regionId || this.raceDistrict || '').toUpperCase();
      const roundIndex = Math.max(
        0,
        Math.min(CREW_BATTLE_LINEUP_SIZE - 1, Number(state.roundIndex || 0))
      );
      const roundNumber = roundIndex + 1;
      const playerScore = Math.max(0, Number(state.playerWins || 0)) + (playerWon ? 1 : 0);
      const opponentScore = Math.max(0, Number(state.opponentWins || 0)) + (playerWon ? 0 : 1);
      const nextRoundIndex = roundIndex + 1;
      const remaining = Math.max(0, CREW_BATTLE_LINEUP_SIZE - nextRoundIndex);
      const playerCanStillReachFour = playerScore + remaining >= CREW_BATTLE_WINS_REQUIRED;
      const battleWon = playerScore >= CREW_BATTLE_WINS_REQUIRED;
      const battleLost =
        !battleWon &&
        (
          !playerCanStillReachFour ||
          nextRoundIndex >= CREW_BATTLE_LINEUP_SIZE
        );

      if (!battleWon && !battleLost) {
        const nextState = {
          ...state,
          roundIndex: nextRoundIndex,
          playerWins: playerScore,
          opponentWins: opponentScore,
        };
        this.registry.set('crewBattleState', nextState);
        saveSessionState(this.registry);

        this.raceSettlement = {
          playerWon,
          cashDelta: 0,
          cash: oldCash,
          pinkMessage: '',
          gameOver: false,
          crewBattle: true,
          crewBattleFailed: false,
          crewBattleContinues: true,
          crewBattleCompleted: false,
          regionId,
          roundNumber,
          nextRoundNumber: nextRoundIndex + 1,
          playerScore,
          opponentScore,
        };
        return this.raceSettlement;
      }

      const previousProgress = (this.registry.get('crewBattleProgress') || {})[regionId] || {};
      const firstClear = battleWon && !previousProgress.completed;
      const reward = getRegionalCrewBattleReward(regionId);
      let cashReward = 0;
      let couponAwards = 0;
      let couponCount = 0;
      let couponRequired = 0;
      let newCash = oldCash;

      if (battleWon) {
        markCrewBattleCompleted(this.registry, regionId, playerScore);

        if (firstClear) {
          cashReward = Math.max(0, Number(reward.cash || 0));
          newCash = oldCash + cashReward;
          this.registry.set('cash', newCash);

          if (reward.couponCarId && cars[reward.couponCarId]) {
            couponAwards = CREW_BATTLE_COUPONS;
            const coupons = { ...(this.registry.get('carCoupons') || {}) };
            couponCount =
              Math.max(0, Number(coupons[reward.couponCarId] || 0)) +
              couponAwards;
            coupons[reward.couponCarId] = couponCount;
            couponRequired = getCarCouponRequirement(reward.couponCarId);
            this.registry.set('carCoupons', coupons);
          }
        }
      }

      const tokyoInvite = battleWon && areAllCrewBattlesComplete(this.registry);
      const restoreCarId =
        state.originalSelectedCarId && cars[state.originalSelectedCarId]
          ? state.originalSelectedCarId
          : (this.registry.get('ownedCarIds') || []).find(id => cars[id] && !cars[id].crewLoan) || null;

      this.registry.set('selectedCarId', restoreCarId);
      this.registry.set('selectedRacePlayerCharacterId', null);
      this.registry.set('crewBattleState', null);
      saveSessionState(this.registry);

      this.raceSettlement = {
        playerWon,
        cashDelta: cashReward,
        cash: newCash,
        pinkMessage: '',
        gameOver: false,
        crewBattle: true,
        crewBattleFailed: battleLost,
        crewBattleContinues: false,
        crewBattleCompleted: battleWon,
        crewBattleFirstClear: firstClear,
        regionId,
        roundNumber,
        playerScore,
        opponentScore,
        cashReward,
        couponAwards,
        couponCarId: reward.couponCarId || null,
        couponCount,
        couponRequired,
        tokyoChampionshipInvited: tokyoInvite,
      };
      return this.raceSettlement;
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
        const perfectAttempt = Boolean(
          current.perfectAttempt ||
          (current.championEarned && !current.perfectEarned)
        );

        store[regionId] = {
          ...current,
          invited: true,
          activeSession: false,
          // Normal first-clear progress remains permanent. A post-champion
          // perfect-sweep attempt is a true streak, so a loss restarts it at 0.
          stage: perfectAttempt ? 0 : stageIndex,
          perfectAttempt: false,
          perfectEligible: perfectAttempt ? true : false,
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
          teamChallengePerfectAttempt: perfectAttempt,
          regionId,
          stageNumber,
          progress: perfectAttempt ? 0 : stageIndex,
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
      const wasChampion = Boolean(current.championEarned);
      const completionReward = current.championRewardClaimed
        ? 0
        : TUNER_TEAM_COMPLETION_REWARD;
      const perfectReward = perfect && !current.perfectRewardClaimed
        ? TUNER_TEAM_PERFECT_REWARD
        : 0;
      const totalReward = completionReward + perfectReward;
      const newCash = oldCash + totalReward;
      const shop = getTunerShopForRegion(regionId);

      const donorCarId = String(shop?.donorCarId || '');
      const donorLabel = String(shop?.donorLabel || donorCarId || 'REGIONAL DONOR CAR');
      const couponAwards =
        (completionReward > 0 ? 1 : 0) +
        (perfectReward > 0 ? 1 : 0);
      let couponCount = 0;
      let couponRequired = donorCarId ? getCarCouponRequirement(donorCarId) : 0;

      if (donorCarId && couponAwards > 0) {
        const coupons = { ...(this.registry.get('carCoupons') || {}) };
        couponCount = Math.max(0, Number(coupons[donorCarId] || 0)) + couponAwards;
        coupons[donorCarId] = couponCount;
        this.registry.set('carCoupons', coupons);
      } else if (donorCarId) {
        couponCount = Math.max(
          0,
          Number((this.registry.get('carCoupons') || {})[donorCarId] || 0)
        );
      }

      store[regionId] = {
        ...current,
        invited: false,
        activeSession: false,
        completed: true,
        championEarned: true,
        perfectEarned: Boolean(current.perfectEarned || perfect),
        championRewardClaimed: Boolean(
          current.championRewardClaimed || completionReward > 0
        ),
        perfectRewardClaimed: Boolean(
          current.perfectRewardClaimed || perfectReward > 0
        ),
        perfectAttempt: false,
        stage: TUNER_TEAM_CHALLENGE_STAGES,
        completedAt: current.completedAt || Date.now(),
        perfectAt: perfect
          ? (current.perfectAt || Date.now())
          : Number(current.perfectAt || 0),
        // After an imperfect first clear, offer the optional perfect sweep again
        // after the player actually leaves and returns to the region.
        reofferVisitsRemaining: perfect ? 0 : 1,
        retryNotBefore: 0,
      };
      this.registry.set('tunerTeamChallenges', store);
      this.registry.set('cash', newCash);

      if (!wasChampion) {
        this.registry.set('tunerChallengeRevealPending', regionId);
      }

      if (shop) {
        const progress = { ...(this.registry.get('tunerShopProgress') || {}) };
        progress[shop.id] = {
          ...(progress[shop.id] || {}),
          discovered: true,
          unlockedByChallenge: true,
          unlockedAt: progress[shop.id]?.unlockedAt || Date.now(),
        };
        this.registry.set('tunerShopProgress', progress);
      }

      saveSessionState(this.registry);

      this.raceSettlement = {
        playerWon: true,
        cashDelta: totalReward,
        cash: newCash,
        pinkMessage: '',
        gameOver: false,
        teamChallenge: true,
        teamChallengeFailed: false,
        teamChallengeContinues: false,
        teamChallengeCompleted: true,
        teamChallengeFirstClear: !wasChampion,
        teamChallengePerfect: perfect,
        completionReward,
        perfectReward,
        totalReward,
        couponAwards,
        donorCarId,
        donorLabel,
        couponCount,
        couponRequired,
        badgeLabel: perfect ? 'REGIONAL CHAMPION ★' : 'REGIONAL CHAMPION',
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
      let prizeCouponCarId = null;
      let couponCount = 0;
      let couponRequired = 0;

      const couponPrize = (
        state.prizeType === 'COUPON' ||
        state.prizeType === 'CAR'
      ) && state.prizeCarId && cars[state.prizeCarId];

      if (couponPrize) {
        prizeCouponCarId = state.prizeCarId;
        couponRequired = getCarCouponRequirement(prizeCouponCarId);

        const coupons = { ...(this.registry.get('carCoupons') || {}) };
        couponCount = Math.max(0, Number(coupons[prizeCouponCarId] || 0)) + 1;
        coupons[prizeCouponCarId] = couponCount;
        this.registry.set('carCoupons', coupons);
      } else {
        prizeCash = applyEasyCashWinBonus(
          this.registry,
          Number(state.prizeCash || 0)
        );
        newCash = oldCash + prizeCash;
        this.registry.set('cash', newCash);
      }

      this.registry.set(
        'competitionWins',
        Math.max(0, Number(this.registry.get('competitionWins') || 0)) + 1
      );
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
        prizeType: couponPrize ? 'COUPON' : state.prizeType,
        prizeCash,
        prizeCarId,
        prizeCouponCarId,
        couponCount,
        couponRequired,
      };
      return this.raceSettlement;
    }

    // Do not remove defeated drivers from a Meet. recordMeetRaceOutcome() locks
    // the saved offer and preserves its PLAYER_WIN state so the rival remains
    // on the stage in a loss pose until the normal Meet refresh.
    let cashDelta = 0;
    let pinkMessage = '';
    let gameOver = false;
    let acquiredCarId = null;

    if (this.raceDeal === 'PINK_SLIP') {
      if (playerWon) recordPinkSlipVictory(this.registry);
      let pinkCarNewlyWon = false;
      let lostCrewMember = null;
      let ownedCarIds = [...(this.registry.get('ownedCarIds') || [])];
      const carStates = { ...(this.registry.get('carStates') || {}) };
      const carGarageLocations = { ...(this.registry.get('carGarageLocations') || {}) };

      if (playerWon) {
        const historicalIds = (this.registry.get('carHistory') || [])
          .map(entry => entry?.carId)
          .filter(Boolean);
        const wonInstanceId = createAndRegisterOwnedCarInstance(
          ownedCarIds,
          this.opponentCarId,
          historicalIds
        );

        if (wonInstanceId) {
          pinkCarNewlyWon = true;
          acquiredCarId = wonInstanceId;
          ownedCarIds.push(wonInstanceId);
          carStates[wonInstanceId] = {
            ...this.opponentBuildState,
            acquiredVia: 'pinkSlip',
          };
          const provisionalGarageId = getGarageDeliveryOptions(this, null)
            .find(option => option.available)?.id
            || this.registry.get('workshopLocationId')
            || 'shinonomeWorkshop';
          carGarageLocations[wonInstanceId] = provisionalGarageId;
          pinkMessage =
            'PINK SLIP WON // ' + cars[this.opponentCarId].shortName +
            ' // CHOOSE DELIVERY GARAGE';
        } else {
          pinkMessage =
            'PINK SLIP WON // ' + cars[this.opponentCarId].shortName +
            ' // UNIQUE CAR ALREADY COLLECTED';
        }
      } else {
        lostCrewMember = Object.values(getCrewMembers(this.registry))
          .find(member => member?.loanCarId === this.selectedCarId) || null;
        recordCarDeparture(this.registry, this.selectedCarId, 'pink-slip-lost', {
          opponentCarId: this.opponentCarId,
        });
        ownedCarIds = ownedCarIds.filter(id => id !== this.selectedCarId);
        delete carStates[this.selectedCarId];
        delete carGarageLocations[this.selectedCarId];
        pinkMessage = 'PINK SLIP LOST // ' + cars[this.selectedCarId].shortName + ' TAKEN';

        if (ownedCarIds.length) {
          this.registry.set(
            'selectedCarId',
            ownedCarIds.find(id => !cars[id]?.crewLoan) || ownedCarIds[0]
          );
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

      if (!playerWon && lostCrewMember?.regionId) {
        removeCrewMember(this.registry, lostCrewMember.regionId);
        this.registry.set('selectedRacePlayerCharacterId', null);
      }

      if (playerWon && pinkCarNewlyWon && acquiredCarId) {
        recordCarAcquisition(this.registry, acquiredCarId, {
          acquiredVia: 'pinkSlip',
        });
      }

      if (this.registry.get('selectedRaceSpecialChallenge')) {
        this.registry.set('specialChallenger', null);
        this.registry.set('selectedRaceSpecialChallenge', false);
      }
    } else if (this.raceMode === 'SINGLE' && this.raceDeal === 'BET') {
      cashDelta = playerWon
        ? applyEasyCashWinBonus(this.registry, this.raceStake)
        : -this.raceStake;
    }

    const newCash = Math.max(0, oldCash + cashDelta);
    this.registry.set('cash', newCash);

    this.recordMeetRaceOutcome(playerWon);

    let crewInviteInterest = null;
    if (
      playerWon &&
      this.raceMode === 'SINGLE' &&
      this.raceDeal === 'BET' &&
      !cars[this.selectedCarId]?.crewLoan &&
      !this.registry.get('selectedRaceSpecialChallenge')
    ) {
      const meetOffer = this.registry.get('selectedRaceMeetOffer') || {};
      const defeatedCharacterId = String(
        meetOffer.characterId || this.opponentCharacterId || ''
      );
      const regionId = String(
        this.registry.get('raceDistrict') ||
        this.registry.get('district') ||
        ''
      ).toUpperCase();
      const locationId = String(
        meetOffer.meetLocation ||
        this.registry.get('meetLocation') ||
        ''
      );

      if (defeatedCharacterId && regionId) {
        crewInviteInterest = createCrewInviteFromMeetWin(
          this.registry,
          {
            regionId,
            characterId: defeatedCharacterId,
            locationId,
            winToken:
              locationId + ':' +
              defeatedCharacterId + ':' +
              Date.now(),
          }
        );
      }
    }

    saveSessionState(this.registry);

    this.raceSettlement = {
      playerWon,
      cashDelta: newCash - oldCash,
      cash: newCash,
      pinkMessage,
      gameOver,
      acquiredCarId,
      crewInviteInterest: crewInviteInterest
        ? {
            regionId: crewInviteInterest.regionId,
            characterId: crewInviteInterest.characterId,
            baseCarId: crewInviteInterest.baseCarId,
          }
        : null,
    };
    return this.raceSettlement;
  }

  drawScene(pt, ot, dt) {
    const W = 1560;

    // The solo tutorial centres the player's car more prominently. Normal
    // races keep the two-car chase composition.
    const targetPlayerX = W * (this.isTutorial ? 0.46 : 0.34);
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
    if (!this.isRollingStart) this.drawStreetCrosswalk(cameraPx);
    const finishX = this.finishTargetM * PX_PER_M - cameraPx;

    // Odaiba is the visual test bed for the authored race scenes. Keep the
    // finish mark on the asphalt only: no rear barrier / fence extension.
    // Centre the thinner checker on the actual timing line so the car nose
    // crosses the middle of the painted stripe.
    if (
      this.raceDistrict === 'ODAIBA' &&
      finishX > -40 &&
      finishX < W + 40
    ) {
      const roadTop = 364;
      const roadBottom = 496;
      const cellW = 9;
      const cellH = 11;
      const startX = Math.round(finishX - cellW);
      const light = 0xaeb4b8;
      const dark = 0x181a1d;

      for (let row = 0, y = roadTop; y < roadBottom; row++, y += cellH) {
        const h = Math.min(cellH, roadBottom - y);
        this.worldG
          .fillStyle(row % 2 === 0 ? light : dark, 0.92)
          .fillRect(startX, y, cellW, h);
        this.worldG
          .fillStyle(row % 2 === 0 ? dark : light, 0.92)
          .fillRect(startX + cellW, y, cellW, h);
      }
    }

    const px = pt.positionM * PX_PER_M - cameraPx;

    this.updateCarVisual(this.playerVisual, px, 418, pt, dt);

    if (!this.isTutorial && this.opponentVisual && ot) {
      const rawOppX = ot.positionM * PX_PER_M - cameraPx;
      const ox = rawOppX + this.playerVisual.noseOffsetPx - this.opponentVisual.noseOffsetPx;

      // R8: both lanes sit lower on the road. The previous top-lane position
      // made the rival look like it was floating against the rear barrier.
      this.updateCarVisual(this.opponentVisual, ox, 351, ot, dt);
    }

    this.drawEffects(pt, this.isTutorial ? null : ot);
    this.drawTree(cameraPx);

  }

  updateCarVisual(v, x, y, t, dt) {
    const c = v.cfg;
    const bodyY =
      y +
      (v.renderOffsetY || 0) +
      (v.groundCorrectionY || 0) +
      Phaser.Math.Clamp(t.accelerationMps2 * 0.8, -2, 4);
    (v.bodyObjects || [v.body]).forEach(obj => {
      if (obj?.getData?.('tunerDecalLayer')) {
        const offsetX = Number(obj.getData('tunerDecalOffsetX') || 0);
        const offsetY = Number(obj.getData('tunerDecalOffsetY') || 0);
        obj.setPosition(x + offsetX, bodyY + offsetY);
      } else {
        obj.setPosition(x, bodyY);
      }
    });
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
    if (ot?.wheelspin && this.opponentVisual) {
      smoke(this.opponentVisual, Phaser.Math.Clamp(ot.slipRatio, 0, 1));
    }

    if (pt.nosActive) {
      const x = this.playerVisual.exhaustX;
      const y = this.playerVisual.exhaustY;
      this.fxG.fillStyle(0x58d9ff, 0.92).fillTriangle(x, y, x - 28, y - 6, x - 28, y + 6);
      this.fxG.fillStyle(0xffffff, 0.82).fillTriangle(x - 4, y, x - 17, y - 3, x - 17, y + 3);
    }
  }

  drawStreetCrosswalk(cameraPx) {
    // The world-space crossing sits just in front of the staged cars' noses.
    // Broad light bars run across both lanes, ending before the shoulder and
    // the near-side bollards. It scrolls off naturally when cars accelerate.
    const poleX = STREET_START_M * PX_PER_M - cameraPx;
    const stripeX = Math.round(poleX - 175);
    const crossingWidth = 106;
    if (stripeX < -crossingWidth || stripeX > 1560) return;

    this.worldG.fillStyle(0xe8eceb, 0.76);
    for (let i = 0; i < 8; i++) {
      const stripeY = 358 + i * 18;
      // Small edge variations keep the painted stripes from looking like UI.
      const edge = i % 3 === 0 ? 3 : 0;
      this.worldG.fillRect(stripeX + edge, stripeY, crossingWidth - edge * 2, 12);
    }
  }

  drawStreetSignalPerson(graphics, cx, cy, colour, walking = false) {
    // Deliberately chunky at ~20px high, matching the low-resolution LED
    // pedestrian glyph rather than covering the housing with a flat tint.
    graphics.fillStyle(colour, 0.97);
    graphics.fillCircle(cx, cy - 8, 2.6);
    graphics.fillRect(cx - 2.1, cy - 4.5, 4.2, 9);
    if (walking) {
      graphics.fillRect(cx - 7.3, cy - 3, 5.5, 2.1);
      graphics.fillRect(cx + 1.4, cy - 1.5, 5.2, 2);
      graphics.fillRect(cx - 6.1, cy + 4.1, 6.2, 2.3);
      graphics.fillRect(cx + 1, cy + 4, 3, 7);
    } else {
      graphics.fillRect(cx - 5.2, cy - 3.5, 3, 9);
      graphics.fillRect(cx + 2.2, cy - 3.5, 3, 9);
      graphics.fillRect(cx - 3.4, cy + 4, 2.8, 7);
      graphics.fillRect(cx + 0.9, cy + 4, 2.8, 7);
    }
  }

  drawTree(cameraPx) {
    // Rolling street races have an existing rolling countdown. No stationary
    // pedestrian crossing or traffic signal is shown for those starts.
    this.treeLightsG.clear();
    if (this.isRollingStart) {
      this.treeSprite.setVisible(false);
      this.streetCountdownText.setVisible(false);
      return;
    }

    const poleX = STREET_START_M * PX_PER_M - cameraPx;
    const scale = STREET_SIGNAL_SCALE;
    const sourceH = 1881;
    const left = poleX - STREET_SIGNAL_POLE_X * scale;
    const top = STREET_SIGNAL_BASE_Y - sourceH * scale;
    const visible = poleX > -160 && left < 1560;
    this.treeSprite.setVisible(visible);
    this.streetCountdownText.setVisible(false);
    if (!visible) return;

    this.treeSprite.setPosition(left, top);
    const px = (x, y) => ({
      x: left + x * scale,
      y: top + y * scale,
    });
    const frame = getStreetSignalFrame(
      this.raceStarted,
      this.countdownClock,
      this.greenClock != null
    );
    const drawLens = (x, colour) => {
      const p = px(x, 246);
      this.treeLightsG.fillStyle(colour, 0.28).fillCircle(p.x, p.y, 12);
      this.treeLightsG.fillStyle(colour, 0.97).fillCircle(p.x, p.y, 8.3);
      this.treeLightsG.fillStyle(0xffffff, 0.22).fillCircle(p.x - 2.2, p.y - 2.4, 2);
    };

    // Vehicle light: source asset uses LEFT green, CENTRE amber, RIGHT red.
    if (frame.vehicle === 'red') drawLens(389, 0xff332c);
    if (frame.vehicle === 'green') drawLens(160, 0x25ef82);

    if (frame.pedestrian === 'green') {
      const walk = px(415, 785);
      this.treeLightsG.fillStyle(0x15d6a5, 0.13)
        .fillRoundedRect(walk.x - 11, walk.y - 14, 22, 27, 3);
      this.drawStreetSignalPerson(this.treeLightsG, walk.x, walk.y, 0x32ffae, true);
    } else if (frame.pedestrian === 'red') {
      const stop = px(414, 684);
      this.treeLightsG.fillStyle(0xed332a, 0.13)
        .fillRoundedRect(stop.x - 11, stop.y - 14, 22, 27, 3);
      this.drawStreetSignalPerson(this.treeLightsG, stop.x, stop.y, 0xff5046);
    }

    if (frame.countdown != null) {
      const count = px(544, 761);
      // Cover the neutral/dim "88" face, not the silver housing bezel.
      this.treeLightsG.fillStyle(0x101219, 0.96)
        .fillRoundedRect(count.x - 10.5, count.y - 12.5, 21, 25, 2);
      this.streetCountdownText
        .setPosition(count.x, count.y)
        .setText(String(frame.countdown))
        .setVisible(true);
    }
  }
}

