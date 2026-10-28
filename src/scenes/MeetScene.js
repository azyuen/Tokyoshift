import { getInGamePlayerDisplayName } from '../data/characterDisplayName.js?v=20261024-r677';
import { getStoryWorldPhase } from '../story/ArkonStoryTime.js?v=20261023-r653';
import {
  getCarBodyScaleForWidth,
  preloadCarAppearanceAssets,
  preloadCarWheel,
  ensureDerivedModularCarTextures,
} from '../vehicles/CarAppearance.js?v=20260928-r244';
import { cars, carOrder } from '../data/cars.js?v=20261026-r687';
import { getFactoryPaintColor } from '../data/factoryPaintPalettes.js?v=20261020-r623';
import { selectMixedCarPaint } from '../data/streetPaintPalettes.js?v=20261020-r624';
import {
  DEFAULT_PAINT_COLOR,
  RIVAL_PAINT_COLORS,
  normalisePaintColor,
  getCarBodyTextureKey,
  createCarBodyLayers,
} from '../vehicles/CarAppearance.js?v=20260928-r244';
import {
  characters,
  getCharacterAssetUrl,
  rivalCharacterOrder,
  getRivalCharacterOrderForRegion,
  hasRegionalTeam,
  getCharacterVisualForContext,
  getCharacterForContext,
  getMainRivalProgression,
  isMainRivalAvailableAtRegionalMeet,
} from '../data/characters.js?v=20261023-r653';
import {
  meetBackgrounds,
  getMeetBackgroundForPhase,
  MEET_LOCATIONS,
  LOCATION_ORDER_BY_REGION,
  ALL_MEET_LOCATION_IDS,
  getMeetLocation,
  getTravelCost,
  WORKSHOP_RETURN_COST,
} from '../data/meetAssets.js?v=20261004-r322';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';
import { shouldLaunchDevVaultStory, claimDevVaultStoryLoan } from '../data/devVaultStory.js?v=20261022-r643';
import { queueSafeSceneStart } from '../ui/SafeSceneTransition.js?v=20261017-r573';
import { saveSessionState } from '../state/GameState.js?v=20261029-r715';
import { restorePreferredCar } from '../state/CarSelection.js?v=20261018-r588';
import { getMeetCharacterQuote } from '../data/characterRaceDialogue.js?v=20261016-r532';
import { addSettingsButton } from '../ui/SettingsPanel.js?v=20261023-r667';
import { showTravelMap } from '../ui/TravelMap.js?v=20261023-r662';
import { preloadArkonMeetObserver, attachArkonMeetObserver } from '../ui/ArkonStoryMeetObserver.js?v=20261023-r652';
import { isGinzaLoanActive, canVisitDuringGinzaLoan } from '../data/ginzaLoanAccess.js?v=20261022-r636';
import { getTravelLocation } from '../data/travelRegions.js?v=20261023-r652';
import {
  getGarageCapacity,
  getUnlockedWorkshops,
  getWorkshopPhaseBackground,
  getCarsInWorkshop,
  isWorkshopUnlocked,
  isWorkshopProgressionReady,
} from '../data/workshopProgression.js?v=20261005-r354';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20261005-r355';
import { getWorldPhase } from '../environment/WorldClock.js?v=20260929-r286';
import {
  MEET_REFRESH_INTERVAL_MS,
  isMeetRoundActive,
  chooseMeetPreloadedOffers,
  mayAdoptPreloadedOffers,
} from '../data/meetRefreshCycle.js?v=20261010-r469';
import {
  recordCarMagazineSightings,
  carMatchesCompetitionRestriction,
  getCompetitionRestrictionPool,
} from '../data/carMagazine.js?v=20261011-r479';
import {
  getEncounterProfile,
  getEncounterSkillLabel,
  getEncounterAi,
} from '../data/encounterProfiles.js?v=20260926-r204';
import { PROGRESSION_BALANCE } from '../data/progressionBalance.js?v=20260929-r271';
import { applyEasyCashWinBonus } from '../data/careerProgression.js?v=20261010-r468';
import { createMeetOpponentMatch } from '../data/meetMatchmaking.js?v=20261011-r479';
import {
  createStreetShowdownRounds,
  STREET_SHOWDOWN_CASH_ENTRY_FEES,
  getStreetShowdownCouponEntryFee,
} from '../data/streetShowdowns.js?v=20261016-showdown-fees';
import { createRivalBuildState } from '../data/rivalBuilds.js?v=20260928-r234';
import { getVehiclePerformance } from '../vehicles/VehiclePerformance.js?v=20261026-r687';
import {
  getPinkSlipOpportunityChance,
  isPinkSlipValueEligible,
  rollPinkSlipOpportunity,
  consumePinkSlipOpportunity,
} from '../data/pinkSlipProgression.js?v=20261011-r479';
import { getPowerTorqueDisplay } from '../data/carRatings.js?v=20261004-r325';
import { getWheelPairFit } from '../vehicles/WheelFit.js?v=20260929-r258';
import { getReferenceRightX } from '../data/carReferenceGeometry.js?v=20261012-ref2';
import {
  TUNER_TEAM_CHALLENGE_STAGES,
  getRegionalChampionshipCashReward,
  TUNER_TEAM_INVITE_CHANCE,
  TUNER_TEAM_PITY_ARRIVALS,
  TUNER_TEAM_REOFFER_MIN_VISITS,
  TUNER_TEAM_REOFFER_MAX_VISITS,
  getTunerTeamChallengeState,
  isTunerTeamChallengeEligible,
  buildTunerTeamChallengeRounds,
  getRegionalRivalSignatureCarId,
} from '../data/tunerChallenges.js?v=20261029-r715';
import { materialiseRegionalChallengeRounds } from '../data/regionalChallengeBuilds.js?v=20261010-r462';
import {
  getTunerShopForRegion,
  isTunerShopUnlocked,
} from '../data/tunerShops.js?v=20261011-r479';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261007-r411';
import { playMangaCutscene, sceneCutsceneActive } from '../ui/MangaCutscene.js?v=20261023-r658';
import { markCutsceneSeen } from '../data/cutscenes.js?v=20261018-r588';
import { showGarageDeliveryPicker } from '../ui/GarageDeliveryPicker.js?v=20260929-r264';

import { showCutsceneTester } from '../ui/CutsceneTester.js?v=20261027-r693';
import {
  getPendingCentralTokyoInvite,
  markCentralTokyoUnlocked,
  getCarCouponRequirement,
  getCarCouponCount,
  MARKET_BASE_PRICES,
  isArkonDen,
} from '../data/centralTokyo.js?v=20261023-r652';
import {
  isCrewComplete,
  getCrewMembers,
  getRecruitedCrewCharacterIds,
  getRecruitableCrewCandidates,
  getCrewInviteInterest,
  clearCrewInviteInterest,
  getCrewRecruitChallenge,
  setCrewRecruitChallenge,
  acceptCrewInviteChallenge,
  clearCrewRecruitChallenge,
  getCrewRecruitmentChallengeRules,
  acceptCrewMember,
  resetCrewRecruitmentAfterLoss,
  createStockOpponentState,
  getCrewMemberForRegion,
  getCrewBattleProgress,
  getCrewBattleUnits,
  buildRegionalCrewBattleRounds,
  getCrewBattleCaptainId,
  getRegionalCrewBattleReward,
} from '../data/crewSystem.js?v=20261024-r676';
import { getCrewInviteDialogue } from '../data/crewDialogue.js?v=20261018-r588';
import { createRegionalCrewBattleIntroduction } from '../data/crewBattleIntroductions.js?v=20261016-crew-battle-manga';
import { getCrewBattleRegionRules, getCrewEventCarSetup } from '../data/crewBattleRules.js?v=20261020-r619';
import { getMeetProgressionActions } from '../data/meetProgressionActions.js?v=20261023-r657';
import { getRegionalChallengeReturnLines } from '../data/regionalChallengeReturnQuotes.js?v=20261016-r550';
import { showStreetShowdownView } from '../ui/StreetShowdownView.js?v=20261022-r651';
import { isStreetShowdownOfferRosterValid } from '../data/streetShowdownRoster.js?v=20261016-street-showdown-template';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const STAGE = { x: 24, y: 92, w: 1138, h: 528 };
const SIDE = { x: 1180, y: 92, w: 356, h: 724 };
const CARDS = { x: 24, y: 636, w: 1138, h: 180 };

const TAXI_TO_WORKSHOP_COST = 1000;
// New regional Ref2 preferences require one fresh roster on entry; afterwards
// normal three-minute refresh/result persistence continues unchanged.
const MEET_ROSTER_VERSION = 'R518';

const MODE_DATA = {
  SINGLE: {
    label: 'SINGLE RACE',
    types: ['Standing Start', 'Roll Race'],
    distances: ['1/4 mile'],
  },
  COMPETITION: {
    label: 'STREET SHOWDOWN',
    types: ['Three-Race Streak'],
    distances: ['1/4 mile', '3 rounds'],
  },
};

function chooseWeightedRaceType(rollingChance = 0.20) {
  const chance = Phaser.Math.Clamp(Number(rollingChance) || 0, 0, 1);
  return Phaser.Math.FloatBetween(0, 1) < chance ? 'Roll Race' : 'Standing Start';
}

const REGION_LOCATION_RIVAL_ROTATION = {
  ODAIBA: {
    odaiba7eleven: [
      'aoiShindou',
      'takumiSerizawa',
      'emiKanzaki',
      'yutoAsakura',
      'mikaHoshino',
    ],
    odaibaGundamPlaza: [
      'emiKanzaki',
      'aoiShindou',
      'yutoAsakura',
      'mikaHoshino',
      'shunAmamiya',
      'takumiSerizawa',
    ],
    odaibaMiraikan: [
      'yutoAsakura',
      'mikaHoshino',
      'kaoriNishimura',
      'shunAmamiya',
      'emiKanzaki',
      'aoiShindou',
    ],
  },
  SHINAGAWA: {
    shinagawaTennozu: [
      'akiraShimizu',
      'natsumiKagawa',
      'renMizuno',
      'reiTakamura',
      'goroNakajima',
    ],
    shinagawaKonan: [
      'renMizuno',
      'akiraShimizu',
      'reiTakamura',
      'natsumiKagawa',
      'reikaTachibana',
      'goroNakajima',
    ],
    shinagawaOiWharf: [
      'goroNakajima',
      'reiTakamura',
      'tetsuyaKanda',
      'reikaTachibana',
      'renMizuno',
      'akiraShimizu',
    ],
  },
};

const REGIONAL_INTRO_COPY = {
  ODAIBA: {
    greeting: "First night in Odaiba? Everyone says they're only here to look.",
    reply: "I'm not here to look.",
    sendoff: 'Good. The waterfront gets boring without fresh competition.',
  },
  SHINAGAWA: {
    greeting: "Shinagawa doesn't care how loud your car is. We care what the timing board says.",
    reply: "Then let's get a number.",
    sendoff: 'Clean run first. Reputation comes after.',
  },
  TATSUMI: {
    greeting: "Tatsumi isn't where you learn which pedal is which. Keep your line clean.",
    reply: 'I can keep up.',
    sendoff: "We'll find out before the next interchange.",
  },
  SHIBUYA: {
    greeting: 'New car, new face. Shibuya notices both.',
    reply: 'Which one matters more?',
    sendoff: "Whichever people are still talking about tomorrow.",
  },
  SHINJUKU: {
    greeting: 'Plenty of drivers arrive in Shinjuku with a reputation.',
    reply: 'And leave with?',
    sendoff: 'Usually a smaller one. Show us yours is real.',
  },
  YOKOHAMA: {
    greeting: 'Tokyo teaches launches. Yokohama tells you whether the car can keep pulling.',
    reply: 'How long a road do you need?',
    sendoff: 'Long enough to run out of excuses.',
  },
  DAIKOKU: {
    greeting: "If you've made it to Daikoku, nobody needs to ask whether you've raced before.",
    reply: 'Good. Saves time.',
    sendoff: 'Exactly. Park up, pick someone, and prove why you came.',
  },
};

export default class MeetScene extends Phaser.Scene {
  constructor() { super('MeetScene'); }

  preload() {
    restorePreferredCar(this.registry);
    // Fallback for a saved direct-Meet arrival: no expensive rivals, offers
    // or car assets should be prepared for the scripted Dogenzaka venue.
    if (shouldLaunchDevVaultStory(this.registry)) return;
    preloadArkonMeetObserver(this);
    for (const [key, file] of [
      ['meetBadgeRegional', 'badge_crown.png'],
      ['meetBadgePerfect', 'badge_star.png'],
      ['meetBadgeCrew', 'badge_crew.png'],
    ]) {
      if (!this.textures.exists(key)) this.load.image(
        key, 'assets/Garage/' + file + '?v=20261016-r550'
      );
    }
    const initialLocationId = MEET_LOCATIONS[this.registry.get('meetLocation')]
      ? this.registry.get('meetLocation')
      : 'odaiba7eleven';
    this.worldPhase = getStoryWorldPhase(this.registry);

    // Generate/restore only the roster that can actually be seen on entry.
    // Other location rosters remain data-only until the player travels there.
    const storedRefreshAt = Number(this.registry.get('meetRefreshAt') || 0);
    const storedRosters = this.registry.get('meetRosters') || {};
    const rawStoredCurrent = Array.isArray(storedRosters[initialLocationId])
      ? storedRosters[initialLocationId]
      : [];
    // Do not apply defeated results from an expired cycle. Otherwise yesterday's
    // three locked rivals can be copied onto today's newly generated roster.
    const storedCurrent = isMeetRoundActive(storedRefreshAt)
      ? this.applyMeetRaceResults(initialLocationId, rawStoredCurrent)
      : [];
    const storedCurrentUnique =
      new Set(storedCurrent.map(offer => offer?.characterId).filter(Boolean)).size ===
      storedCurrent.length;
    const initialRegion = getMeetLocation(initialLocationId)?.district;
    const initialRegionalCharacters = new Set(
      getRivalCharacterOrderForRegion(initialRegion)
    );
    const recruitedCharacterIds = getRecruitedCrewCharacterIds(this.registry);
    const storedCurrentValid =
      isMeetRoundActive(storedRefreshAt) &&
      storedCurrent.length > 0 &&
      storedCurrentUnique &&
      storedCurrent.every(offer =>
        initialRegionalCharacters.has(offer?.characterId) &&
        !recruitedCharacterIds.has(offer?.characterId) &&
        isMainRivalAvailableAtRegionalMeet(
          this.registry,
          offer?.characterId,
          initialRegion
        ) &&
        cars[offer?.carId] &&
        Number.isFinite(offer?.encounterRating) &&
        offer?.encounterAi &&
        ['LOCATION', 'MAIN_RIVAL'].includes(offer?.driverSkillSource) &&
        offer?.matchmakingVersion === MEET_ROSTER_VERSION &&
        Number.isFinite(Number(offer?.opponentBuildRating)) &&
        offer?.opponentBuildState && typeof offer.opponentBuildState === 'object'
      );

    this.selectedMode = 'SINGLE';
    this.nextRefreshAt = storedCurrentValid
      ? storedRefreshAt
      : Date.now() + MEET_REFRESH_INTERVAL_MS;
    this.preloadedInitialLocationId = initialLocationId;
    this.preloadedFromStoredRound = storedCurrentValid;
    this.preloadedInitialOffers = chooseMeetPreloadedOffers({
      useStoredRound: storedCurrentValid,
      storedOffers: storedCurrent,
      generateOffers: () => this.generateOffersForLocation(initialLocationId),
    });

    const batch = this.queueMeetRosterAssets(
      this.preloadedInitialOffers,
      initialLocationId
    );
    this.preloadedInitialCarIds = batch.carIds;

    const crewReveal =
      getCrewInviteInterest(this.registry, initialRegion) ||
      getCrewRecruitChallenge(this.registry, initialRegion) ||
      this.registry.get('crewPendingJoinDecision');
    const signatureCarId = String(crewReveal?.baseCarId || '');
    if (signatureCarId && cars[signatureCarId]) {
      if (!this.preloadedInitialCarIds.includes(signatureCarId)) {
        this.preloadedInitialCarIds.push(signatureCarId);
      }
      batch.queued += preloadCarAppearanceAssets(
        this,
        { [signatureCarId]: cars[signatureCarId] },
        '20261005-r346'
      );
      batch.queued += preloadCarWheel(this, cars[signatureCarId]);
    }

    if (crewReveal?.baseCarId) {
      // Warm the eligible garage cars and their workshop backdrops while the
      // Meet itself loads, not during the dramatic invitation-to-picker handoff.
      // Filtering by factory-stock and the recruit's power class keeps this
      // prefetch small even for collectors with large garages.
      const eligible = getCrewRecruitmentChallengeRules(
        this.registry, crewReveal
      ).eligibleCarIds || [];
      const locations = this.registry.get('carGarageLocations') || {};
      const backgroundKeys = new Set();
      eligible.forEach(carId => {
        if (!cars[carId]) return;
        if (!this.preloadedInitialCarIds.includes(carId)) {
          this.preloadedInitialCarIds.push(carId);
          batch.queued += preloadCarAppearanceAssets(
            this, { [carId]: cars[carId] }, '20261016-r537'
          );
          batch.queued += preloadCarWheel(this, cars[carId]);
        }
        const bg = getWorkshopPhaseBackground(
          locations[carId] || this.registry.get('workshopLocationId') || 'shinonomeWorkshop',
          this.worldPhase
        );
        if (bg?.path && !this.textures.exists(bg.key) &&
            !backgroundKeys.has(bg.key)) {
          backgroundKeys.add(bg.key);
          this.load.image(bg.key, bg.path + '?v=20261022-r645');
          batch.queued += 1;
        }
      });
    }

    // Crew showdown portraits and car panels must be ready before opening
    // the lineup, including teammates from other regions.
    if (isCrewComplete(this.registry)) {
      const crewUnits = getCrewBattleUnits(this.registry);
      const crewRounds = buildRegionalCrewBattleRounds(initialRegion, this.registry);
      const crewCarIds = [...new Set([...crewUnits, ...crewRounds].map(u => u.carId))]
        .filter(id => cars[id]);
      const missingCars = crewCarIds.filter(id => !this.preloadedInitialCarIds.includes(id));
      missingCars.forEach(id => {
        this.preloadedInitialCarIds.push(id);
        batch.queued += preloadCarAppearanceAssets(this, { [id]: cars[id] }, '20261016-r544');
        batch.queued += preloadCarWheel(this, cars[id]);
      });
      [...crewUnits, ...crewRounds].forEach(unit => {
        const visual = getCharacterVisualForContext(unit.characterId, {
          rivalContext: true,
          playerCharacterId: this.registry.get('playerCharacterId') || '',
        }) || {};
        if (visual.spriteKey && visual.path && !this.textures.exists(visual.spriteKey)) {
          this.load.image(visual.spriteKey, getCharacterAssetUrl(visual.path));
          batch.queued += 1;
        }
      });
    }

    startSceneLoading(this, 'LOADING MEET', batch.queued);
  }

  create() {
    // Replace only the specifically armed Shibuya/Dogenzaka developer arrival
    // with a two-character private story tableau: no regular Meet cars/cards.
    if (shouldLaunchDevVaultStory(this.registry) &&
        queueSafeSceneStart(this,'DevVaultStoryScene')) {
      claimDevVaultStoryLoan(this.registry);
      saveSessionState(this.registry);
      finishSceneLoading('READY');
      return;
    }
    document.body.dataset.scene = 'meet';
    this.scale.resize(1560, 840);
    playMusic('meet');

    const ownedCarIds = (this.registry.get('ownedCarIds') || []).filter(id => cars[id]);
    const selectedCarId = this.registry.get('selectedCarId');
    this.meetStranded = Boolean(this.registry.get('meetStranded'));
    this.hasCar = !this.meetStranded && ownedCarIds.length > 0 && Boolean(cars[selectedCarId]);

    this.selectedMode = 'SINGLE';
    this.selectedDeal = 'CASH';
    this.refreshTransitioning = false;
    this.offers = [];
    this.cardObjects = [];
    this.stageObjects = [];
    this.selectedOfferIndex = 0;
    this.currentBackground = null;
    this.backgroundMaskShape = null;
    this.backgroundTint = null;
    this.selectedMeetLocation = MEET_LOCATIONS[this.registry.get('meetLocation')]
      ? this.registry.get('meetLocation')
      : 'odaiba7eleven';
    this.locationOffers = {};
    this.locationSelectedOfferIndex = {};
    this.specialChallengeActive = false;
    this.specialChallengePreparing = false;
    this.specialChallengeObjects = [];
    this.competitionPopup = null;
    this.competitionLoading = false;

    const storedRefreshAt = Number(this.registry.get('meetRefreshAt') || 0);
    const storedRosters = this.registry.get('meetRosters') || {};
    const isCurrentMeetOffer = offer =>
      Boolean(cars[offer?.carId]) &&
      Number.isFinite(offer?.encounterRating) &&
      offer?.encounterAi &&
      ['LOCATION', 'MAIN_RIVAL'].includes(offer?.driverSkillSource) &&
      offer?.matchmakingVersion === MEET_ROSTER_VERSION &&
      Number.isFinite(Number(offer?.opponentBuildRating)) &&
      offer?.opponentBuildState && typeof offer.opponentBuildState === 'object';

    // Preserve the meet the player is actually returning to. Previously this
    // gate validated every stored location at once, so a stale/unvisited Meet
    // elsewhere in Tokyo could force a global reroll and erase the DEFEATED
    // state from the race that just finished.
    const selectedStoredOffers = this.applyMeetRaceResults(
      this.selectedMeetLocation,
      Array.isArray(storedRosters[this.selectedMeetLocation])
        ? storedRosters[this.selectedMeetLocation]
        : []
    );
    const hasStoredRound =
      isMeetRoundActive(storedRefreshAt) &&
      selectedStoredOffers.length > 0 &&
      selectedStoredOffers.every(isCurrentMeetOffer) &&
      // Preload performs additional regional/duplicate/recruit validation.
      // If it rejected the roster, create must not adopt that stale cycle.
      (this.preloadedInitialLocationId !== this.selectedMeetLocation ||
        this.preloadedFromStoredRound === true);

    // Preload may have generated the visible three-car roster before create().
    // Keep that exact roster so the assets we just loaded are the ones rendered.
    const preloadedInitialOffers = Array.isArray(this.preloadedInitialOffers)
      ? this.preloadedInitialOffers.map(offer => ({ ...offer }))
      : null;

    if (hasStoredRound) {
      this.nextRefreshAt = storedRefreshAt;

      // Legacy builds removed defeated rivals from the saved three-person Meet
      // roster via defeatedRivalKeys. The current design keeps all three racers
      // physically present until the Meet refreshes, using their result pose and
      // locked card to show who has already been beaten.
      if ((this.registry.get('defeatedRivalKeys') || []).length) {
        this.registry.set('defeatedRivalKeys', []);
      }

      ALL_MEET_LOCATION_IDS.forEach(locationId => {
        const location = getMeetLocation(locationId);
        const recruitedIds = getRecruitedCrewCharacterIds(this.registry);
        const allowed = new Set(
          getRivalCharacterOrderForRegion(location.district)
            .filter(id =>
              !recruitedIds.has(id) &&
              isMainRivalAvailableAtRegionalMeet(
                this.registry,
                id,
                location.district
              )
            )
        );

        const stored = Array.isArray(storedRosters[locationId])
          ? storedRosters[locationId]
          : this.generateOffersForLocation(locationId);

        const regionValid = stored.filter(offer =>
          allowed.has(offer?.characterId) && isCurrentMeetOffer(offer)
        );

        // Existing saves may contain an old/global roster, stale matchmaking
        // data or duplicate drivers. Regenerate only that specific location;
        // never wipe the result state from a different valid Meet.
        const uniqueCharacterCount = new Set(
          regionValid.map(offer => offer?.characterId).filter(Boolean)
        ).size;
        const duplicateCharacters = uniqueCharacterCount !== regionValid.length;
        const baseOffers =
          stored.length === 0 ||
          regionValid.length !== stored.length ||
          duplicateCharacters
            ? this.generateOffersForLocation(locationId)
            : regionValid;

        this.locationOffers[locationId] = this.applyMeetRaceResults(
          locationId,
          baseOffers
        ).map(offer => ({ ...offer }));
        this.locationSelectedOfferIndex[locationId] = 0;
      });
    } else {
      this.nextRefreshAt = Date.now() + MEET_REFRESH_INTERVAL_MS;
      this.registry.set('defeatedRivalKeys', []);
      this.refreshAllLocationOffers({ resetTimer: false, persist: false });
      this.persistMeetRound();
    }

    if (
      preloadedInitialOffers &&
      this.preloadedInitialLocationId === this.selectedMeetLocation &&
      mayAdoptPreloadedOffers(this.preloadedFromStoredRound, hasStoredRound)
    ) {
      this.locationOffers[this.selectedMeetLocation] = preloadedInitialOffers;
      this.locationSelectedOfferIndex[this.selectedMeetLocation] = 0;
      this.persistMeetRound();
    }

    ensureDerivedModularCarTextures(
      this,
      Object.fromEntries(
        (this.preloadedInitialCarIds || [])
          .filter(id => cars[id])
          .map(id => [id, cars[id]])
      )
    );

    this.drawBase();
    this.buildHeader();
    this.buildSidebar();
    this.buildBottomArea();
    this.buildDevControls();
    this.buildMeetProgressionButtons();
    this.rollOffers({ resetTimer: false });
    attachArkonMeetObserver(this);

    const regulationError = this.registry.get('crewBattleValidationError');
    if (regulationError) {
      this.registry.set('crewBattleValidationError', null);
      saveSessionState(this.registry);
      this.time.delayedCall(200, () => this.showCrewBattleRuleError(regulationError));
    }

    const pendingCrewJoinShown = this.maybeShowPendingCrewJoinDecision();
    const pendingRegionalChallengeShown = pendingCrewJoinShown
      ? false : this.maybeShowPendingRegionalChallengeResult();
    const pendingPinkSlipResultShown = pendingCrewJoinShown || pendingRegionalChallengeShown
      ? false : this.maybeShowPendingPinkSlipResult();
    const pendingResultShown =
      pendingCrewJoinShown || pendingRegionalChallengeShown || pendingPinkSlipResultShown;

    const activeChallenger = this.registry.get('specialChallenger');
    const activeRegionRivals = getRivalCharacterOrderForRegion(
      getMeetLocation(this.selectedMeetLocation).district
    );
    const visibleMeetOffers = this.locationOffers[this.selectedMeetLocation] || [];
    const activeChallengerPresent = visibleMeetOffers.some(offer =>
      offer?.characterId === activeChallenger?.characterId &&
      offer?.carId === activeChallenger?.carId
    );
    let specialChallengerShown = false;
    if (
      !pendingResultShown &&
      activeChallenger?.active &&
      activeChallenger.locationId === this.selectedMeetLocation &&
      activeRegionRivals.includes(activeChallenger.characterId) &&
      activeChallengerPresent &&
      this.hasCar
    ) {
      specialChallengerShown = true;
      this.time.delayedCall(80, () => this.showSpecialChallenger(activeChallenger, false));
    } else if (
      !pendingResultShown &&
      activeChallenger?.active &&
      activeChallenger.locationId === this.selectedMeetLocation &&
      (
        !activeRegionRivals.includes(activeChallenger.characterId) ||
        !activeChallengerPresent
      )
    ) {
      this.registry.set('specialChallenger', null);
      saveSessionState(this.registry);
    }

    if (!pendingResultShown && !specialChallengerShown && !this.isCrewTestDriveMode()) {
      const crewInviteShown = this.maybeShowCrewInviteInterest();
      const activeRecruitShown = crewInviteShown
        ? false
        : this.maybeShowActiveCrewRecruitChallenge();

      if (!crewInviteShown && !activeRecruitShown) {
        const centralInviteShown = this.maybeShowRemoteCentralTokyoInvitation();
        if (!centralInviteShown) {
          const revealShown = this.maybeShowTunerChallengeReveal();
          if (!revealShown) {
            this.time.delayedCall(180, () => {
              if (!this.maybeShowRegionalCrewIntroduction()) {
                this.maybeShowTunerTeamChallenge();
              }
            });
          }
        }
      }
    }

    // Fetch race controls after the meet renders. Other regions load on travel.
    this.time.delayedCall(120, () => this.prefetchDeferredAssets());

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.updateRefreshTimer(),
    });

    finishSceneLoading('READY');
  }

  showCrewBattleRuleError(reason) {
    const objects = [];
    const depth = 950;
    objects.push(this.add.rectangle(780, 392, 800, 130, 0x180e18, 0.98)
      .setStrokeStyle(2, 0xff8a9a).setDepth(depth).setInteractive());
    objects.push(this.add.text(780, 366, 'CREW RACE BLOCKED // REGULATIONS', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#ffe1e5',
    }).setOrigin(0.5).setDepth(depth + 1));
    objects.push(this.add.text(780, 413, String(reason), {
      fontFamily: BODY_FONT, fontSize: '18px', color: '#ffffff',
      align: 'center', wordWrap: { width: 750 },
    }).setOrigin(0.5).setDepth(depth + 1));
    const close = () => objects.forEach(obj => obj?.active && obj.destroy());
    objects[0].on('pointerdown', close);
    this.time.delayedCall(6000, close);
  }

  isCrewTestDriveMode() {
    const selectedCarId = String(this.registry.get('selectedCarId') || '');
    return Boolean(
      selectedCarId &&
      cars[selectedCarId]?.crewLoan &&
      this.registry.get('selectedRacePlayerCharacterId')
    );
  }

  maybeShowPendingCrewJoinDecision() {
    const pending = this.registry.get('crewPendingJoinDecision');
    if (!pending?.characterId || !pending?.regionId) return false;
    const rival = characters[pending.characterId];
    const rivalName = String(rival?.name || 'RIVAL').toUpperCase();
    const dialogue = getCrewInviteDialogue(pending.characterId);

    this.time.delayedCall(160, () => {
      const start = playMangaCutscene(this, 'crewRecruitmentJoin', {
        force: true, preloadPagePosesOnly: true,
        historyId: 'crewRecruitmentJoin:' + pending.characterId + ':' + pending.wonAt,
        characterOverrides: { RIVAL: pending.characterId },
        variables: {
          REGION: String(pending.regionId).toUpperCase(),
          RIVAL_NAME: rivalName,
          CREW_JOIN_LINE: dialogue.joinLine,
        },
        onComplete: ({ reason }) => {
          // Closing/skipping the manga isn't a refusal: preserve the choice
          // until the player deliberately taps YES or NO.
          if (reason !== 'action' && reason !== 'secondary') {
            saveSessionState(this.registry);
            return;
          }
          const accepted = reason === 'action';
          const joined = accepted ? acceptCrewMember(this.registry, pending) : null;
          if (!joined) resetCrewRecruitmentAfterLoss(this.registry, pending);
          this.registry.set('crewPendingJoinDecision', null);
          saveSessionState(this.registry);
          const carName = String(
            cars[joined?.baseCarId]?.shortName || cars[joined?.baseCarId]?.name || 'SIGNATURE CAR'
          ).toUpperCase();
          playMangaCutscene(this, 'crewRecruitmentAnswer', {
            force: true, preloadPagePosesOnly: true,
            historyId: 'crewRecruitmentAnswer:' + pending.characterId + ':' + pending.wonAt,
            characterOverrides: { RIVAL: pending.characterId },
            variables: {
              REGION: String(pending.regionId).toUpperCase(),
              RIVAL_NAME: rivalName,
              PLAYER_REPLY: joined
                ? "You're in. Welcome to the team!"
                : accepted
                  ? "I'd like to, but there's no room right now."
                  : "Not this time. We'll keep racing our own ways.",
              RIVAL_REPLY: joined
                ? "I'll bring my car over to Crew Space. See you there!"
                : 'Fair enough. See you on the street!',
            },
            onComplete: () => {
              if (joined) this.showCrewJoinedToast(rivalName, carName);
            },
          });
        },
      });
      if (!start?.played && !start?.active && !start?.loading) {
        // Keep the invitation in the save for the next Meet entry if the
        // manga renderer was unavailable; never silently accept or decline.
        saveSessionState(this.registry);
      }
    });
    return true;
  }

  showCrewJoinedToast(rivalName, carName) {
    const panel = this.add.rectangle(1235, 132, 560, 108, 0x03070b, 0.96)
      .setStrokeStyle(2, 0xe9c37b, 1).setDepth(901);
    const title = this.add.text(1235, 111, rivalName + ' // CREW MEMBER', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#ffe1a0',
    }).setOrigin(0.5).setDepth(902);
    const detail = this.add.text(1235, 148,
      carName + ' + DRIVER NOW AT WAREHOUSE CREW SPACE', {
        fontFamily: BODY_FONT, fontSize: '11px', color: '#e7f2f7',
        wordWrap: { width: 522 }, align: 'center',
      }).setOrigin(0.5).setDepth(902);
    this.time.delayedCall(6500, () => [panel, title, detail]
      .forEach(obj => obj?.active && obj.destroy()));
  }

  maybeShowPendingRegionalChallengeResult() {
    const pending = this.registry.get('pendingRegionalChallengeResult');
    if (!pending || typeof pending !== 'object') return false;

    this.registry.set('pendingRegionalChallengeResult', null);
    saveSessionState(this.registry);

    this.time.delayedCall(120, () => {
      const completed = Boolean(pending.completed);
      const failed = Boolean(pending.failed);
      const perfect = Boolean(pending.perfect);
      const cutsceneId = failed
        ? 'regionalChallengeLoss'
        : perfect
          ? 'regionalPerfectVictory'
          : 'regionalChampionVictory';

      const result = playMangaCutscene(this, cutsceneId, {
        historyId: failed
          ? 'regionalChallengeLoss:' +
            String(pending.regionId || 'REGION') + ':' +
            Number(pending.completedAt || Date.now())
          : cutsceneId + ':' + String(pending.regionId || 'REGION'),
        characterOverrides: {
          RIVAL: pending.rivalCharacterId,
          PLAYER: pending.playerCharacterId,
        },
        variables: {
          REGION: String(pending.regionId || 'REGION').toUpperCase(),
          RIVAL_NAME: String(pending.rivalName || 'REGIONAL RIVAL').toUpperCase(),
          CASH_REWARD: Number(pending.cashReward || 0).toLocaleString('en-US'),
          DONOR: String(pending.donorLabel || 'DONOR CAR').toUpperCase(),
          COUPON_AWARDS: String(Number(pending.couponAwards || 0)),
          BADGE: String(
            pending.badgeLabel ||
            (perfect ? 'REGIONAL CHAMPION ★' : 'REGIONAL CHAMPION')
          ),
        },
      });

      // Loss cutscene is non-once and should always play; if a cached/edge
      // condition prevents any result cutscene, simply leave the player at Meet.
      if (!result?.played && completed) {
        saveSessionState(this.registry);
      }
    });

    return true;
  }

  maybeShowPendingPinkSlipResult() {
    const pending = this.registry.get('pendingPinkSlipResult');
    if (!pending || typeof pending !== 'object') return false;

    // Consume first so a reload cannot replay the ownership handover.
    this.registry.set('pendingPinkSlipResult', null);
    saveSessionState(this.registry);

    this.time.delayedCall(120, () => {
      const playerWon = Boolean(pending.playerWon);
      const acquiredCarId = pending.acquiredCarId || null;
      const gameOver = Boolean(pending.gameOver);
      const carName = String(pending.carName || 'CAR').toUpperCase();

      const finishHandover = () => {
        if (playerWon && acquiredCarId) {
          const picker = showGarageDeliveryPicker(this, {
            carId: acquiredCarId,
            carName,
            title: 'CAR WON // DELIVERY',
            message: 'Choose which garage should receive your new car.',
            allowCancel: false,
            onSelect: workshopId => {
              const locations = { ...(this.registry.get('carGarageLocations') || {}) };
              locations[acquiredCarId] = workshopId;
              this.registry.set('carGarageLocations', locations);
              saveSessionState(this.registry);
            },
          });

          // If all garages are full, keep the provisional assignment made at
          // settlement rather than trapping the player behind an impossible modal.
          if (!picker) saveSessionState(this.registry);
          return;
        }

        if (gameOver) {
          this.scene.start('RunOverScene');
        }
      };

      const resultCutscene = playMangaCutscene(
        this,
        pending.wasSpecialChallenge
          ? (playerWon ? 'specialChallengerWin' : 'specialChallengerLoss')
          : (playerWon ? 'firstPinkSlipWin' : 'firstPinkSlipLoss'),
        {
          historyId: pending.wasSpecialChallenge
            ? 'specialChallengerResult:' + Number(pending.completedAt || Date.now()) +
              ':' + (playerWon ? 'W' : 'L')
            : undefined,
          characterOverrides: {
            RIVAL: pending.rivalCharacterId,
            WINNER: playerWon ? pending.playerCharacterId : pending.rivalCharacterId,
            LOSER: playerWon ? pending.rivalCharacterId : pending.playerCharacterId,
          },
          playerRoleTokens: [playerWon ? 'WINNER' : 'LOSER'],
          variables: {
            RIVAL_NAME: String(pending.rivalName || 'RIVAL').toUpperCase(),
            CAR: carName,
          },
          onComplete: finishHandover,
        }
      );

      if (!resultCutscene?.played) finishHandover();
    });

    return true;
  }

  getRivalDisplayCharacter(characterId) {
    return getCharacterForContext(characterId, {
      rivalContext: true,
      playerCharacterId: this.registry.get('playerCharacterId') || '',
    }) || characters[characterId] || null;
  }

  getActiveDriverCharacterId() {
    const selectedCarId = this.registry.get('selectedCarId');
    const selectedCar = cars[selectedCarId];
    const crewDriverId = this.registry.get('selectedRacePlayerCharacterId');

    if (selectedCar?.crewLoan && crewDriverId && characters[crewDriverId]) {
      return crewDriverId;
    }

    return this.registry.get('playerCharacterId') || 'renMizuno';
  }

  getMeetRaceResults(locationId) {
    // An expired refresh deadline invalidates every saved slot-bound result.
    // This guard protects future refresh paths, not just preload/create.
    if (!isMeetRoundActive(this.registry.get('meetRefreshAt'))) return [];
    const store = this.registry.get('meetRaceResults') || {};
    return Array.isArray(store[locationId]) ? store[locationId] : [];
  }

  applyMeetRaceResults(locationId, offers = []) {
    const merged = (Array.isArray(offers) ? offers : [])
      .slice(0, 3)
      .map(offer => ({ ...offer }));

    this.getMeetRaceResults(locationId).forEach(result => {
      const slotIndex = Phaser.Math.Clamp(
        Math.floor(Number(result?.slotIndex || 0)),
        0,
        2
      );
      const savedOffer = result?.offer;
      if (!savedOffer || typeof savedOffer !== 'object' || !savedOffer.characterId) return;

      while (merged.length <= slotIndex) merged.push(null);
      merged[slotIndex] = { ...savedOffer };
    });

    return merged.filter(Boolean).slice(0, 3);
  }

  getPinkMeetBadge(source, destination) {
    if (this.textures.exists(destination)) return destination;
    if (!this.textures.exists(source)) return source;
    try {
      const img = this.textures.get(source).getSourceImage();
      const tex = this.textures.createCanvas(destination, img.width, img.height);
      const ctx = tex.getContext();
      ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, img.width, img.height);
      const d = pixels.data;
      for (let i = 0; i < d.length; i += 4) {
        // Preserve each icon's existing light/shadow detail, recoloured in
        // the progression button's vivid pink palette (not monochrome grey).
        const light = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
        d[i] = Math.round(136 + 119 * light);
        d[i + 1] = Math.round(29 + 94 * light);
        d[i + 2] = Math.round(80 + 110 * light);
      }
      ctx.putImageData(pixels, 0, 0);
      tex.refresh();
      return destination;
    } catch (_) {
      if (this.textures.exists(destination)) this.textures.remove(destination);
      return source;
    }
  }

  buildMeetProgressionButtons() {
    (this.meetProgressionButtonObjects || []).forEach(obj => obj?.destroy?.());
    this.meetProgressionButtonObjects = [];
    if (this.isCrewTestDriveMode() || !this.hasCar ||
        cars[this.registry.get('selectedCarId')]?.ginzaDemo) return;
    const regionId = String(getMeetLocation(this.selectedMeetLocation)?.district || '').toUpperCase();
    const actions = getMeetProgressionActions(this.registry, regionId, this.hasCar);
    const add = obj => {
      this.meetProgressionButtonObjects.push(obj);
      return obj;
    };
    // Match PINK SLIPS styling. A wider leftward plate fits the longest
    // "CONTINUE REGIONAL CHALLENGE" caption without moving the right badge.
    const width = 394;
    const right = STAGE.x + STAGE.w - 34;
    const centre = right - width / 2;
    const icons = { REGIONAL: 'meetBadgeRegional', PERFECT: 'meetBadgePerfect',
      CREW: 'meetBadgeCrew' };
    actions.forEach((action, index) => {
      const y = STAGE.y + 51 + index * 60;
      const button = add(this.add.rectangle(centre, y, width, 36, 0x291620, 1)
        .setStrokeStyle(2, 0xff5f93, 0.9).setDepth(55)
        .setInteractive({ useHandCursor: true }));
      add(this.add.text(centre - 20, y, action.label, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#ffdce8',
      }).setOrigin(0.5).setDepth(56));
      const source = icons[action.id];
      if (this.textures.exists(source)) {
        const tinted = this.getPinkMeetBadge(source, 'pink_' + source);
        const badge = add(this.add.image(right, y, tinted)
          .setDisplaySize(55, 55).setDepth(57));
        if (tinted === source) badge.setTint(0xff5f93);
      }
      button.on('pointerdown', () => {
        if (sceneCutsceneActive(this) || this.competitionPopup?.active ||
            this.specialChallengeActive) return;
        if (action.id === 'CREW') this.showCrewBattleIntroduction(regionId);
        else this.startMeetProgressionChallenge(regionId, action.id);
      });
    });
  }

  startMeetProgressionChallenge(regionId, mode) {
    const region = String(regionId || '').toUpperCase();
    if (this.isCrewTestDriveMode() || !this.hasCar ||
        cars[this.registry.get('selectedCarId')]?.ginzaDemo || sceneCutsceneActive(this)) return false;
    const actions = getMeetProgressionActions(this.registry, region, this.hasCar);
    if (!actions.some(action => action.id === mode)) return false;
    return this.beginTunerTeamChallenge(region, { perfect: mode === 'PERFECT' });
  }

  showCrewBattleIntroduction(regionId) {
    if (this.isCrewTestDriveMode() || !isCrewComplete(this.registry) ||
        sceneCutsceneActive(this)) return false;

    const key = String(regionId || '').toUpperCase();
    const rounds = buildRegionalCrewBattleRounds(key, this.registry);
    const units = getCrewBattleUnits(this.registry);
    if (units.length < 3 || rounds.length < 3) return false;

    // Captain manages the opposition without racing; the co-speaker races.
    const leaderId = getCrewBattleCaptainId(key);
    const challengerId = rounds[0]?.characterId;
    if (!leaderId || !challengerId) return false;

    const visits = this.registry.get('crewBattleIntroVisits') || {};
    const count = Math.max(0, Math.floor(Number(visits[key]) || 0));
    const definition = createRegionalCrewBattleIntroduction(key, count);
    if (!definition) return false;

    const leaderName = this.getRivalDisplayCharacter(leaderId)?.name ||
      characters[leaderId]?.name || key + ' LEADER';

    const result = playMangaCutscene(this, definition, {
      characterOverrides: { LEADER: leaderId, CHALLENGER: challengerId },
      variables: { LEADER_NAME: String(leaderName).toUpperCase() },
      // Repeatable invitation: load only idle and win portraits being shown.
      preloadPagePosesOnly: true,
      onComplete: ({ reason }) => {
        // ACCEPT must be explicit. RACE LATER and SKIP return to the Meet.
        if (reason === 'action') this.showCrewBattleLineup(key);
      },
    });

    if (!result?.played) return false;
    this.registry.set('crewBattleIntroVisits', {
      ...visits, [key]: count + 1,
    });
    saveSessionState(this.registry);
    return true;
  }

  showCrewBattleLineup(regionId) {
    if (this.isCrewTestDriveMode() || !isCrewComplete(this.registry)) return;
    const units = getCrewBattleUnits(this.registry);
    const rounds = buildRegionalCrewBattleRounds(regionId, this.registry);
    if (units.length < 3 || rounds.length < 3) return;
    const saved = (this.registry.get('crewBattleLineups') || {})[regionId] || [];
    const slots = [0, 1, 2].map(i => units.find(u => u.id === saved[i]) || null);
    const objects = [];
    const depth = 200;
    const add = o => { objects.push(o); return o; };
    const close = () => {
      objects.splice(0).forEach(o => { try { o.destroy?.(); } catch (_) {} });
    };
    const font = '"Exo 2", sans-serif';
    const text = (x, y, value, size, color = '#ffffff', opts = {}) =>
      add(this.add.text(x, y, value, {
        fontFamily: font, fontSize: size + 'px', fontStyle: 'italic 900',
        color, stroke: '#090d16', strokeThickness: size >= 24 ? 5 : 1,
        ...opts,
      }).setDepth(depth + 8));

    // Dedicated full-screen meet artwork, independent of the stage mask and
    // existing meet UI. No dark scrim over the background image.
    const bgKey = this.currentBackground?.texture?.key;
    if (bgKey && this.textures.exists(bgKey)) {
      const source = this.textures.get(bgKey).getSourceImage();
      add(this.add.image(780, 420, bgKey)
        .setScale(Math.max(1560 / source.width, 840 / source.height))
        .setDepth(depth));
    } else {
      add(this.add.rectangle(780, 420, 1560, 840, 0x102137).setDepth(depth));
    }
    // Transparent input shield blocks the underlying Meet screen.
    add(this.add.rectangle(780, 420, 1560, 840, 0x000000, 0)
      .setInteractive().setDepth(depth + 1));
    const headerShape = (x, y, w, h, fill, alpha = 1) => {
      const g = add(this.add.graphics().setDepth(depth + 7));
      g.fillStyle(fill, alpha);
      g.fillPoints([
        { x: x + 15, y }, { x: x + w, y },
        { x: x + w - 15, y: y + h }, { x, y: y + h },
      ], true);
      return g;
    };
    headerShape(52, 40, 175, 43, 0x03070c, 0.96);
    text(72, 48, String(regionId).toUpperCase(), 19, '#48d9ff');
    text(58, 85, 'CREW BATTLE', 38, '#ffffff');
    headerShape(54, 151, 420, 41, 0x081522, 0.73);
    add(this.add.text(74, 163, '3 VS 3  //  BEST OF 3', {
      fontFamily: PIXEL_FONT, fontSize: '13px', color: '#a8c4d7',
    }).setDepth(depth + 8));

    // The skewed panels use geometry masks, so sprites are actually clipped
    // to the slanted edges rather than overflowing their card boundaries.
    const polygon = (x, y, w, h, skew = 18) => [
      { x: x + skew, y }, { x: x + w + skew, y },
      { x: x + w - skew, y: y + h }, { x: x - skew, y: y + h },
    ];
    const panel = (x, y, w, h, fill, border, alpha = 1, skew = 17) => {
      const points = polygon(x, y, w, h, skew);
      const g = add(this.add.graphics().setDepth(depth + 3));
      g.fillStyle(fill, alpha); g.fillPoints(points, true);
      g.lineStyle(3, border, 1); g.strokePoints(points, true);
      return { points, g };
    };
    const clip = (obj, points, collection) => {
      const shape = this.make.graphics({ add: false });
      shape.fillStyle(0xffffff, 1); shape.fillPoints(points, true);
      obj.setMask(shape.createGeometryMask());
      // Graphics mask is not a displayed object; destroy it with the slot.
      objects.push(shape); collection.push(shape);
    };
    const sideFrame = (x, y, w, h, color, title, titleOffsetX = 0) => {
      const p = polygon(x, y, w, h, 32);
      const g = add(this.add.graphics().setDepth(depth + 2));
      g.fillStyle(0x030b16, 0.77); g.fillPoints(p, true);
      g.lineStyle(5, color, 1); g.strokePoints(p, true);
      text(x + 43 + titleOffsetX, y + 10, title, 26,
        '#' + color.toString(16).padStart(6, '0'));
    };
    // Titles now sit in line with the angled portrait panels. Frame geometry
    // remains unchanged, preserving the existing background and card padding.
    sideFrame(24, 399, 730, 405, 0x35d6ff, 'YOUR CREW', 18);
    sideFrame(798, 28, 728, 408, 0xff477e, 'RIVAL CREW', 18);

    // The street in the lower-right quadrant is intentionally reserved for
    // scouting. Keep the skyline visible above the player's crew, and leave
    // a clear gap before the bottom action buttons.
    const regional = getCrewBattleRegionRules(regionId);
    headerShape(806, 446, 724, 294, 0x06121f, 0.85);
    text(830, 454, 'BATTLE BRIEFING', 13, '#f4e4a4');
    add(this.add.text(830, 482, regional?.focus || 'CREW CHALLENGE', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#96cfdc',
      wordWrap: { width: 645 },
    }).setDepth(depth + 9));
    rounds.slice(0, 3).forEach((round, i) => {
      const y = 519 + i * 70;
      const distance = round.distanceM > 500 ? '1/2 MI' : '1/4 MI';
      const mode = round.raceType === 'Roll Race' ? 'ROLL' : 'STANDING';
      add(this.add.text(831, y,
        'HEAT ' + (i + 1) + '  //  ' +
        round.ruleLabel + '  /  ' + mode + ' ' + distance, {
          fontFamily: PIXEL_FONT, fontSize: '10px', color: '#c3e1f0',
        }).setDepth(depth + 9));
      add(this.add.text(831, y + 27,
        'SCOUT: ' + (round.scout?.focus || 'UNKNOWN SETUP') +
        '   //   LIKELY: ' + (round.scout?.label || 'UNCONFIRMED'), {
          fontFamily: PIXEL_FONT, fontSize: '9px', color: '#80bac9',
        }).setDepth(depth + 9));
    });
    const lineupComplianceLabel = add(this.add.text(831, 718,
      'ASSIGN THREE COMPLIANT CARS // NO AUTO DOWN-TUNING', {
        fontFamily: PIXEL_FONT, fontSize: '9px', color: '#7acddf',
      }).setDepth(depth + 9));

    const xPlayer = [63, 292, 521];
    // Move the red character panels 14px right, but anchor the red car
    // boxes at their original coordinates as requested.
    const xRival = [835, 1064, 1293];
    const slotObjects = [[], [], []];
    let vsStamp = null;
    const createPortrait = (id, x, y, pts, collection) => {
      if (!id) return;
      const profile = createCharacterProfile(this, {
        characterId: id, pose: 'idle', x, y, frameWidth: 226,
        frameHeight: 171, side: 'center', depth: depth + 5,
        mask: false, rivalContext: true,
        playerCharacterId: this.registry.get('playerCharacterId') || '',
      });
      if (profile?.image) {
        objects.push(profile.image); collection.push(profile.image);
        clip(profile.image, pts, collection);
      }
    };
    const createCar = (id, x, y, pts, collection) => {
      if (!cars[id]) return;
      const images = this.createCarDisplay(cars[id], x, y, 200,
        depth + 5, false, DEFAULT_PAINT_COLOR);
      images.forEach(o => {
        objects.push(o); collection.push(o);
        if (o?.setMask) clip(o, pts, collection);
      });
    };
    const drawCard = (index, unit, rival = false) => {
      const collection = rival ? [] : slotObjects[index];
      const x = rival ? xRival[index] : xPlayer[index];
      const y = rival ? 92 : 463;
      const accent = rival ? 0xff477e : 0x35d6ff;
      const portrait = panel(x, y, 211, 168,
        rival ? 0x80304e : 0x165578, 0x050a10, 0.65, 13);
      // Blue car panels move left 12px. Red car panels do not move.
      const carX = x - (rival ? 26 : 30);
      const carPanel = panel(carX, y + 228, 211, 98,
        rival ? 0x381b31 : 0x0a2b48, accent, 0.78, 8);
      collection.push(portrait.g, carPanel.g);
      if (unit) {
        createPortrait(unit.characterId, x + 105, y + 84, portrait.points, collection);
        createCar(unit.carId, carX + 105, y + 277, carPanel.points, collection);
      }
      const name = unit
        ? String(characters[unit.characterId]?.name || unit.characterId).toUpperCase()
        : 'SELECT DRIVER';
      const carName = unit
        ? String(cars[unit.carId]?.shortName || unit.carId).toUpperCase()
        : 'TAP TO ASSIGN';
      const t1 = add(this.add.text(x + 105, y + 176, name, {
        fontFamily: PIXEL_FONT, fontSize: '10px', color: '#ffffff',
        align: 'center',
      }).setOrigin(0.5, 0).setDepth(depth + 8));
      const t2 = add(this.add.text(carX + 105, y + 199, carName, {
        fontFamily: PIXEL_FONT, fontSize: '9px', color: '#cbd8e5',
        align: 'center',
      }).setOrigin(0.5, 0).setDepth(depth + 8));
      collection.push(t1, t2);
      if (!rival) {
        const hit = add(this.add.rectangle(x + 105, y + 163, 211, 326,
          0xffffff, 0).setInteractive({ useHandCursor: true })
          .setDepth(depth + 9));
        collection.push(hit);
        hit.on('pointerdown', () => chooseSlot(index));
      }
    };
    rounds.slice(0, 3).forEach((round, i) => drawCard(i, round, true));

    const button = (x, width, color, border) => {
      return add(this.add.rectangle(x, 779, width, 49, color, 1)
        .setStrokeStyle(2, border).setDepth(depth + 6));
    };
    const later = button(1030, 214, 0x192333, 0x8ba1b5)
      .setInteractive({ useHandCursor: true });
    add(this.add.text(1030, 779, 'RACE LATER', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(depth + 8));
    const start = button(1324, 330, 0x143e38, 0x65e7bf);
    const startLabel = add(this.add.text(1324, 779, 'DRIVERS READY - START BATTLE', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(depth + 8));
    later.on('pointerdown', close);
    const save = () => {
      const lineups = { ...(this.registry.get('crewBattleLineups') || {}) };
      lineups[regionId] = slots.map(u => u?.id || null);
      this.registry.set('crewBattleLineups', lineups);
      saveSessionState(this.registry);
    };
    const refresh = () => {
      for (let i = 0; i < 3; i++) {
        slotObjects[i].forEach(o => {
          const j = objects.indexOf(o);
          if (j !== -1) objects.splice(j, 1);
          o.destroy?.();
        });
        slotObjects[i] = [];
        drawCard(i, slots[i]);
      }
      const count = slots.filter(Boolean).length;
      const evaluations = slots.map((unit, index) => unit
        ? getCrewEventCarSetup(unit.carId,
          (this.registry.get('carStates') || {})[unit.carId] || {}, rounds[index]?.rule)
        : null);
      const uniqueDrivers = new Set(slots.filter(Boolean).map(unit => unit.id)).size === count;
      const failedHeat = evaluations.findIndex(result => result && !result.eligible);
      const valid = count === 3 && uniqueDrivers && failedHeat < 0;
      startLabel.setText(valid ? 'DRIVERS READY - START BATTLE'
        : count === 3 ? 'INELIGIBLE CAR / CHANGE YOUR LINEUP' : 'SELECT THREE DRIVERS');
      const notice = !uniqueDrivers
        ? 'EACH HEAT REQUIRES A DIFFERENT CREW DRIVER'
        : failedHeat >= 0
          ? 'HEAT ' + (failedHeat + 1) + ' NOT ELIGIBLE: ' + evaluations[failedHeat].reason
          : count < 3
            ? 'ASSIGN THREE DRIVERS // FOLLOW EACH HEAT RULE'
            : 'THREE CARS CLEARED // NO AUTO DOWN-TUNING';
      lineupComplianceLabel.setText(notice);
      lineupComplianceLabel.setColor(failedHeat >= 0 || !uniqueDrivers ? '#ff9da3' : '#7acddf');
      if (vsStamp) {
        const j = objects.indexOf(vsStamp);
        if (j >= 0) objects.splice(j, 1);
        vsStamp.destroy(); vsStamp = null;
      }
      if (valid) {
        start.setFillStyle(0x116049).setInteractive({ useHandCursor: true });
        vsStamp = text(778, 437, 'VS', 55, '#ffffff',
          { stroke: '#100813', strokeThickness: 7 })
          .setOrigin(0.5).setAngle(-12).setDepth(depth + 12);
        this.tweens.add({ targets: vsStamp, scale: { from: 1.3, to: 1 },
          duration: 240, ease: 'Back.easeOut' });
      } else {
        start.disableInteractive().setFillStyle(0x182735);
      }
      save();
    };
    const chooseSlot = index => {
      const chooser = [];
      const addChoice = o => { objects.push(o); chooser.push(o); return o; };
      const dismiss = () => chooser.splice(0).forEach(o => {
        const j = objects.indexOf(o); if (j >= 0) objects.splice(j, 1);
        o.destroy();
      });
      const z = depth + 30;
      addChoice(this.add.rectangle(780, 420, 1560, 840, 0x01040a, 0.87)
        .setInteractive().setDepth(z));
      addChoice(this.add.rectangle(780, 420, 1120, 650, 0x0a1828)
        .setStrokeStyle(3, 0x35d6ff).setDepth(z + 1));
      addChoice(this.add.text(780, 142, 'SELECT CREW MEMBER // HEAT ' + (index + 1), {
        fontFamily: PIXEL_FONT, fontSize: '19px',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(z + 2));
      const chosenHeat = rounds[index];
      addChoice(this.add.text(780, 176,
        chosenHeat.ruleLabel + '  //  ' +
        (chosenHeat.raceType === 'Roll Race' ? 'ROLLING' : 'STANDING') +
        '  ' + (chosenHeat.distanceM > 500 ? '1/2 MILE' : '1/4 MILE'), {
          fontFamily: PIXEL_FONT, fontSize: '10px', color: '#e8d397',
        }).setOrigin(0.5).setDepth(z + 2));
      // Each row owns its images and clips them to dedicated portrait/car frames.
      units.forEach((unit, i) => {
        const occupied = slots.some((u, j) => j !== index && u?.id === unit.id);
        const crewSetup = getCrewEventCarSetup(
          unit.carId, (this.registry.get('carStates') || {})[unit.carId] || {}, rounds[index]?.rule
        );
        const unavailable = occupied || !crewSetup.eligible;
        const x = i % 2 ? 1035 : 525;
        const y = 229 + Math.floor(i / 2) * 117;
        const rowW = 492, rowH = 108;
        addChoice(this.add.rectangle(x, y, rowW, rowH,
          unavailable ? 0x171c26 : 0x143044)
          .setStrokeStyle(2, unavailable ? 0x44505e : 0x35d6ff).setDepth(z + 2));
        const portraitX = x - 193, carX = x - 65;
        const makeClip = (left, top, width, height, image) => {
          const maskGraphics = this.make.graphics({ add: false });
          maskGraphics.fillStyle(0xffffff);
          maskGraphics.fillRect(left, top, width, height);
          image.setMask(maskGraphics.createGeometryMask());
          addChoice(maskGraphics);
        };
        addChoice(this.add.rectangle(portraitX, y, 96, 94, 0x0b1827)
          .setStrokeStyle(1, 0x688aa0).setDepth(z + 3));
        addChoice(this.add.rectangle(carX, y, 144, 94, 0x0b1827)
          .setStrokeStyle(1, 0x688aa0).setDepth(z + 3));
        const profile = createCharacterProfile(this, {
          characterId: unit.characterId, pose: 'idle',
          x: portraitX, y: y + 46, frameWidth: 96, frameHeight: 150,
          side: 'center', depth: z + 4, mask: false, rivalContext: true,
          playerCharacterId: this.registry.get('playerCharacterId') || '',
        });
        if (profile?.image) {
          addChoice(profile.image);
          makeClip(portraitX - 47, y - 46, 94, 92, profile.image);
        }
        const car = cars[unit.carId] || {};
        if (cars[unit.carId]) {
          const images = this.createCarDisplay(car, carX, y + 14, 126,
            z + 4, false, DEFAULT_PAINT_COLOR);
          images.forEach(image => {
            addChoice(image);
            if (image?.setMask) makeClip(carX - 71, y - 46, 142, 92, image);
          });
        }
        const name = String(characters[unit.characterId]?.name || unit.characterId).toUpperCase();
        const model = String(car.shortName || unit.carId).toUpperCase();
        const ownedState = (this.registry.get('carStates') || {})[unit.carId] || {};
        const eventSetup = getCrewEventCarSetup(unit.carId, ownedState, rounds[index]?.rule);
        const tuned = getVehiclePerformance(unit.carId, ownedState);
        const actualPower = Math.round(Number(tuned?.car?.powerKW || car.powerKW || 0));
        const drive = String(car.drivetrain || (car.awd ? 'AWD' : car.fwd ? 'FWD' : 'RWD')).toUpperCase();
        const infoX = x + 22;
        const eventLine = eventSetup.eligible
          ? actualPower + ' KW / ' + drive
          : eventSetup.reason + ' / ' + actualPower + ' KW';
        [[name, y - 34, '#ffffff', 10],
         [model, y - 7, '#b8d9ed', 9],
         [eventLine, y + 23, eventSetup.eligible ? '#72e0ed' : '#ff9da3', 8]].forEach(([value, ty, color, size]) => {
          addChoice(this.add.text(infoX, ty, value, {
            fontFamily: PIXEL_FONT, fontSize: size + 'px', color,
          }).setDepth(z + 5));
        });
        if (!unavailable) {
          addChoice(this.add.rectangle(x, y, rowW, rowH, 0xffffff, 0)
            .setInteractive({ useHandCursor: true }).setDepth(z + 6))
            .on('pointerdown', () => { slots[index] = unit; dismiss(); refresh(); });
        }
      });
      const clearAll = addChoice(this.add.rectangle(640, 698, 230, 48, 0x29323d)
        .setStrokeStyle(2, 0x8ea2b5).setInteractive({ useHandCursor: true })
        .setDepth(z + 2));
      addChoice(this.add.text(640, 698, 'CLEAR ALL', {
        fontFamily: PIXEL_FONT, fontSize: '12px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(z + 3));
      clearAll.on('pointerdown', () => {
        slots.fill(null);
        dismiss();
        refresh();
      });
      const cancel = addChoice(this.add.rectangle(920, 698, 230, 48, 0x29323d)
        .setStrokeStyle(2, 0x8ea2b5).setInteractive({ useHandCursor: true })
        .setDepth(z + 2));
      addChoice(this.add.text(920, 698, 'CANCEL', {
        fontFamily: PIXEL_FONT, fontSize: '12px',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(z + 3));
      cancel.on('pointerdown', dismiss);
    };
    start.on('pointerdown', () => {
      if (slots.some(u => !u) || slots.some((u, i) =>
        !getCrewEventCarSetup(u.carId,
          (this.registry.get('carStates') || {})[u.carId] || {}, rounds[i]?.rule).eligible
      )) return;
      save(); close(); this.startCrewBattle(regionId, slots, rounds);
    });
    refresh();
  }

  startCrewBattle(regionId, lineup, rounds = null) {
    const battleRounds = rounds || buildRegionalCrewBattleRounds(regionId, this.registry);
    if (!isCrewComplete(this.registry) || lineup.length !== 3 || battleRounds.length < 3) return;
    if (new Set(lineup.map(u => u.id)).size !== 3 ||
        lineup.some((unit, i) => !getCrewEventCarSetup(unit.carId,
          (this.registry.get('carStates') || {})[unit.carId] || {}, battleRounds[i].rule).eligible)) return;

    const state = {
      active: true,
      regionId: String(regionId || '').toUpperCase(),
      lineup: lineup.map(unit => ({ ...unit })),
      rounds: battleRounds.slice(0, 3).map(round => ({ ...round })),
      roundIndex: 0,
      playerWins: 0,
      opponentWins: 0,
      originalSelectedCarId: this.registry.get('selectedCarId') || null,
      reward: getRegionalCrewBattleReward(regionId),
    };

    this.registry.set('crewBattleState', state);
    this.registry.set('raceReturnScene', 'MeetScene');

    if (!this.configureCrewBattleRound(state, 0)) return;
    saveSessionState(this.registry);
    this.scene.start('RaceScene');
  }

  configureCrewBattleRound(state, index) {
    const unit = state?.lineup?.[index];
    const round = state?.rounds?.[index];
    if (!unit || !round || !cars[unit.carId] || !cars[round.carId]) return false;

    const setup = getCrewEventCarSetup(unit.carId,
      (this.registry.get('carStates') || {})[unit.carId] || {}, round.rule);
    if (!setup.eligible) return false;
    this.registry.set('crewBattleEventPlayerSetup', setup.state);
    this.registry.set('selectedCarId', unit.carId);
    this.registry.set('selectedRacePlayerCharacterId', unit.characterId);
    this.registry.set('selectedOpponentCarId', round.carId);
    this.registry.set('selectedOpponentPaintColor', DEFAULT_PAINT_COLOR);
    this.registry.set('selectedOpponentCharacterId', round.characterId);
    this.registry.set('selectedOpponentEncounterRating', round.encounterRating);
    this.registry.set('selectedOpponentEncounterAi', round.encounterAi);
    this.registry.set('selectedOpponentDifficulty', round.difficulty);
    this.registry.set('selectedOpponentBuildRating', round.buildRating);
    this.registry.set('selectedOpponentBuildArchetype', round.opponentBuildState?.buildArchetype || null);
    this.registry.set('selectedOpponentBuildState', round.opponentBuildState);
    this.registry.set('selectedRaceCategory', 'CREW_BATTLE');
    this.registry.set('selectedRaceType', round.raceType);
    this.registry.set('selectedRaceDistanceM', round.distanceM);
    this.registry.set('selectedRaceDeal', 'CREW_BATTLE');
    this.registry.set('selectedRaceStake', 0);
    this.registry.set('selectedRaceSpecialChallenge', false);
    this.registry.set('selectedRaceMeetOffer', null);
    this.registry.set('raceTimeOfDay', getStoryWorldPhase(this.registry));
    this.registry.set('raceDistrict', state.regionId);
    this.registry.set(
      'raceLocationLabel',
      'CREW BATTLE // ' + (index + 1) + '/3'
    );

    return true;
  }

  maybeShowRemoteCentralTokyoInvitation() {
    const inviteKey = getPendingCentralTokyoInvite(this.registry);
    if (inviteKey !== 'ginza' && inviteKey !== 'drag') return false;

    const completeInvite = () => {
      markCentralTokyoUnlocked(this.registry, inviteKey);
      saveSessionState(this.registry);
    };

    const options = inviteKey === 'ginza'
      ? {
          characterOverrides: { HOST: 'sayakaFujieda' },
          variables: { HOST_NAME: 'SAYAKA FUJIEDA' },
          onComplete: completeInvite,
        }
      : {
          characterOverrides: { PROMOTER: 'tetsuyaKanda' },
          variables: { PROMOTER_NAME: 'TETSUYA KANDA' },
          onComplete: completeInvite,
        };

    const result = playMangaCutscene(
      this,
      inviteKey === 'ginza' ? 'ginzaInvitation' : 'dragComplexInvitation',
      options
    );

    if (!result.played && result.reason === 'seen') {
      completeInvite();
      return false;
    }

    return Boolean(result.played);
  }

  getTunerChallengeStore() {
    return { ...(this.registry.get('tunerTeamChallenges') || {}) };
  }

  setTunerChallengeState(regionId, next) {
    const key = String(regionId || '').toUpperCase();
    const store = this.getTunerChallengeStore();
    store[key] = { ...(store[key] || {}), ...next, regionId: key };
    this.registry.set('tunerTeamChallenges', store);
    return store[key];
  }

  maybeShowRegionalCrewIntroduction({ countChallengeVisit = false } = {}) {
    if (this.isCrewTestDriveMode()) return false;
    if (!this.hasCar || this.specialChallengeActive ||
        this.competitionLoading || this.competitionPopup?.active) {
      return false;
    }

    const location = getMeetLocation(this.selectedMeetLocation);
    const regionId = String(location?.district || '').toUpperCase();
    const copy = REGIONAL_INTRO_COPY[regionId];
    if (!copy) return false;

    const playerCharacterId = this.getActiveDriverCharacterId();
    const npcId = getRivalCharacterOrderForRegion(regionId)
      .find(id => id !== playerCharacterId && characters[id]);
    if (!npcId) return false;

    const result = playMangaCutscene(this, 'regionalCrewIntroduction', {
      historyId: 'regionalCrewIntroduction:' + regionId,
      characterOverrides: { NPC: npcId },
      variables: {
        REGION: regionId,
        NPC_NAME: String(characters[npcId]?.name || 'LOCAL DRIVER').toUpperCase(),
        REGION_GREETING: copy.greeting,
        PLAYER_REPLY: copy.reply,
        REGION_SENDOFF: copy.sendoff,
      },
      onComplete: () => {
        this.time.delayedCall(120, () => {
          this.maybeShowTunerTeamChallenge({ countReofferVisit: countChallengeVisit });
        });
      },
    });

    return Boolean(result.played);
  }

  createCrewInviteCarReveal(interest, car, { side = 'right' } = {}) {
    // Both manga car bays deliberately use the SAME geometry, framing and
    // car scale. Only the background and horizontal placement differ.
    const isPlayer = side === 'left';
    const shiftX = isPlayer ? -890 : 0;
    const centerX = 1225 + shiftX;
    const reveal = { x: 915 + shiftX, y: 115, width: 620, height: 500 };
    const objects = [];
    const add = object => {
      if (object) objects.push(object);
      return object;
    };
    const maskShape = this.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(reveal.x, reveal.y, reveal.width, reveal.height);
    const mask = maskShape.createGeometryMask();

    let backgroundKey = null;
    if (isPlayer && car) {
      const garage = (this.registry.get('carGarageLocations') || {})[car.id] ||
        this.registry.get('workshopLocationId') || 'shinonomeWorkshop';
      backgroundKey = getWorkshopPhaseBackground(
        garage, this.worldPhase || getStoryWorldPhase(this.registry)
      )?.key;
    } else if (!isPlayer) {
      // The actual current Meet asset already contains the road.
      backgroundKey = this.currentBackground?.texture?.key ||
        getMeetBackgroundForPhase(
          this.selectedMeetLocation, this.worldPhase || getStoryWorldPhase(this.registry)
        )?.key;
    }

    add(this.add.rectangle(centerX, 365, reveal.width, reveal.height,
      0x07111d, 1).setDepth(908).setScrollFactor(0));

    if (car && backgroundKey && this.textures.exists(backgroundKey)) {
      const src = this.textures.get(backgroundKey).getSourceImage();
      const width = Number(src.naturalWidth || src.width || 1);
      const height = Number(src.naturalHeight || src.height || 1);
      const cover = Math.max(reveal.width / width, reveal.height / height);
      add(this.add.image(centerX, 365, backgroundKey)
        .setScale(cover).setDepth(909)
        .setScrollFactor(0).setMask(mask));
    }

    if (car) {
      try {
        ensureDerivedModularCarTextures(this, { [car.id]: car });
        const bodyKey = getCarBodyTextureKey(this, car);
        if (bodyKey && this.textures.exists(bodyKey) &&
            car.visual?.wheelKey && this.textures.exists(car.visual.wheelKey)) {
          const state = isPlayer
            ? (this.registry.get('carStates') || {})[car.id] || {}
            : {};
          const carObjects = this.createCarDisplay(
            car, 1145 + shiftX, 392, 820, 916, false,
            isPlayer ? (state.paintColor ?? DEFAULT_PAINT_COLOR)
              : DEFAULT_PAINT_COLOR
          );
          carObjects.forEach(obj => {
            obj.setScrollFactor?.(0);
            obj.setMask?.(mask);
            objects.push(obj);
          });
        }
      } catch (error) {
        console.warn('[Tokyo SHIFT] Crew manga car rendering error', error);
      }
    }

    // Trim is explicitly above the car and background (and transparent
    // inside), as in the approved page-two signature-car treatment.
    add(this.add.rectangle(centerX, 365, reveal.width, reveal.height,
      0x000000, 0).setStrokeStyle(5, 0x55dfff, 0.95)
      .setDepth(928).setScrollFactor(0));
    add(this.add.rectangle(1270 + shiftX, 103, 515, 76, 0x111111, 0.98)
      .setStrokeStyle(3, 0xfffcf1, 1)
      .setDepth(929).setScrollFactor(0));

    const ownerName = String(characters[interest?.characterId]?.name ||
      interest?.characterId || 'RIVAL').toUpperCase();
    const goldHeader = isPlayer
      ? (car ? 'YOUR STOCK CAR' : 'NO ELIGIBLE CAR')
      : ownerName + '’S SIGNATURE CAR';
    add(this.add.text(1505 + shiftX, 90, goldHeader, {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#f2d079',
      align: 'right',
    }).setOrigin(1, 0.5).setDepth(930).setScrollFactor(0));

    const carName = car
      ? String(car.name || car.shortName || interest?.baseCarId || '').toUpperCase()
      : 'ACQUIRE ONE AND TRY AGAIN LATER';
    add(this.add.text(1505 + shiftX, 117, carName, {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#ffffff',
      align: 'right',
    }).setOrigin(1, 0.5).setDepth(930).setScrollFactor(0));

    objects.forEach(obj => obj?.setAlpha?.(0));
    const fade = this.tweens.add({
      targets: objects, alpha: 1, duration: 360, ease: 'Sine.easeOut',
    });
    let disposed = false;
    return () => {
      if (disposed) return;
      disposed = true;
      try { fade?.stop?.(); } catch (_) {}
      objects.forEach(obj => {
        try { this.tweens.killTweensOf(obj); } catch (_) {}
        try { obj?.clearMask?.(false); } catch (_) {}
        try { obj?.destroy?.(); } catch (_) {}
      });
      try { mask?.destroy?.(); } catch (_) {}
      try { maskShape.destroy(); } catch (_) {}
    };
  }

  createCrewInviteCarToggles(eligibleIds, onChoose) {
    if (!Array.isArray(eligibleIds) || eligibleIds.length < 2)
      return () => {};

    const objects = [];
    const add = object => { objects.push(object); return object; };
    const makeToggle = (x, symbol, direction) => {
      add(this.add.rectangle(x, 563, 56, 54, 0x111111, 0.96)
        .setStrokeStyle(3, 0x55dfff, 0.95)
        .setDepth(936).setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => onChoose(direction)));
      add(this.add.text(x, 563, symbol, {
        fontFamily: PIXEL_FONT, fontSize: '17px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(937).setScrollFactor(0));
    };
    makeToggle(83, '<', -1);
    makeToggle(583, '>', 1);

    let index = 0;
    const counter = add(this.add.text(335, 568, '', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#ffffff',
      backgroundColor: '#111111cc',
      padding: { x: 13, y: 8 },
    }).setOrigin(0.5).setDepth(937).setScrollFactor(0));
    const setIndex = selected => {
      index = Math.max(0, eligibleIds.indexOf(selected));
      counter.setText((index + 1) + ' / ' + eligibleIds.length);
    };
    // Caller updates the counter through the cleanup function's setter.
    const dispose = () => objects.forEach(obj => {
      try { obj.destroy(); } catch (_) {}
    });
    dispose.setSelected = setIndex;
    return dispose;
  }

  createCrewRecruitVsLabel() {
    // Same Exo 2 Black Italic family and 88px headline as race WIN results.
    const vs = this.add.text(780, 365, 'VS', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '88px',
      fontStyle: 'italic 900',
      color: '#ffffff',
      stroke: '#11141a',
      strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(940).setAlpha(0);
    const fade = this.tweens.add({
      targets: vs, alpha: 1, duration: 360, ease: 'Sine.easeOut',
    });
    return () => {
      try { fade.stop(); } catch (_) {}
      try { this.tweens.killTweensOf(vs); } catch (_) {}
      try { vs.destroy(); } catch (_) {}
    };
  }

  maybeShowCrewInviteInterest() {
    if (this.isCrewTestDriveMode()) return false;
    const location = getMeetLocation(this.selectedMeetLocation);
    const currentRegion = String(location?.district || '').toUpperCase();
    const interest = getCrewInviteInterest(this.registry, currentRegion);
    if (!interest?.characterId || !interest?.regionId) return false;
    if (String(interest.regionId).toUpperCase() !== currentRegion) return false;
    if (getCrewMemberForRegion(this.registry, currentRegion)) {
      clearCrewInviteInterest(this.registry, currentRegion);
      saveSessionState(this.registry);
      return false;
    }

    const character = characters[interest.characterId];
    const car = cars[interest.baseCarId];
    if (!character || !car) {
      clearCrewInviteInterest(this.registry, currentRegion);
      saveSessionState(this.registry);
      return false;
    }
    const rivalName = String(character.name || interest.characterId).toUpperCase();
    const signatureCarName = String(
      car.name || car.shortName || interest.baseCarId
    ).toUpperCase();
    const playerName = getInGamePlayerDisplayName(this.registry);
    const dialogue = getCrewInviteDialogue(interest.characterId, {
      REGION: currentRegion, RIVAL_NAME: rivalName,
      SIGNATURE_CAR: signatureCarName, PLAYER_NAME: playerName.toUpperCase(),
    });

    let cleanupReveal = () => {};
    let cleanupPlayer = () => {};
    let cleanupToggles = () => {};
    let cleanupVs = () => {};
    let acceptedChallenge = null;
    let eligibleIds = [];
    let selectedCarId = null;

    const drawPlayer = () => {
      cleanupPlayer();
      cleanupPlayer = this.createCrewInviteCarReveal(
        interest, selectedCarId ? cars[selectedCarId] : null, { side: 'left' }
      );
    };
    const enterCarSelection = () => {
      // The fourth page is part of this very same manga presentation:
      // accept the invite, then show the player's garage car on the left.
      acceptedChallenge = acceptCrewInviteChallenge(this.registry, interest);
      if (!acceptedChallenge) return;
      saveSessionState(this.registry);
      const rules = getCrewRecruitmentChallengeRules(
        this.registry, acceptedChallenge
      );
      eligibleIds = rules.eligibleCarIds || [];
      selectedCarId = eligibleIds.includes(this.registry.get('selectedCarId'))
        ? this.registry.get('selectedCarId') : eligibleIds[0] || null;
      drawPlayer();
      cleanupVs = this.createCrewRecruitVsLabel();
      cleanupToggles = this.createCrewInviteCarToggles(eligibleIds, direction => {
        if (!eligibleIds.length) return;
        const index = eligibleIds.indexOf(selectedCarId);
        selectedCarId = eligibleIds[
          (Math.max(0, index) + direction + eligibleIds.length) %
            eligibleIds.length
        ];
        drawPlayer();
        cleanupToggles.setSelected?.(selectedCarId);
      });
      cleanupToggles.setSelected?.(selectedCarId);
    };

    const result = playMangaCutscene(this, 'crewRecruitmentInvite', {
      historyId: 'crewRecruitmentInvite:' + interest.characterId + ':' +
        Number(interest.createdAt || Date.now()),
      force: true,
      preloadPagePosesOnly: true,
      characterOverrides: { RIVAL: interest.characterId },
      variables: {
        REGION: currentRegion,
        RIVAL_NAME: rivalName,
        SIGNATURE_CAR: signatureCarName,
        CREW_LINE_1: dialogue.opening,
        CREW_LINE_2: dialogue.reveal,
        CREW_LINE_3: dialogue.challenge,
        CREW_ACCEPT_LABEL: dialogue.acceptLabel,
        CREW_DECLINE_LABEL: dialogue.declineLabel,
      },
      onPageChange: ({ pageIndex }) => {
        if (pageIndex === 1) {
          cleanupReveal();
          cleanupReveal = this.createCrewInviteCarReveal(interest, car);
        } else if (pageIndex === 3) {
          enterCarSelection();
        }
      },
      isFinalActionEnabled: () => Boolean(
        acceptedChallenge && selectedCarId &&
        getCrewRecruitmentChallengeRules(
          this.registry, acceptedChallenge
        ).eligibleCarIds.includes(selectedCarId)
      ),
      onComplete: ({ reason }) => {
        cleanupToggles();
        cleanupVs();
        cleanupPlayer();
        cleanupReveal();
        if (acceptedChallenge) {
          if (reason === 'action' && selectedCarId) {
            this.startCrewRecruitmentRace(acceptedChallenge, selectedCarId);
          } else {
            // RACE LATER or SKIP on page four keeps this accepted invite.
            saveSessionState(this.registry);
          }
        } else {
          // NOT NOW on page three leaves the recruitment offer unaccepted.
          clearCrewInviteInterest(this.registry, currentRegion);
          saveSessionState(this.registry);
        }
      },
    });
    return Boolean(result?.played);
  }

  maybeShowActiveCrewRecruitChallenge() {
    if (this.isCrewTestDriveMode()) return false;
    const region = String(getMeetLocation(this.selectedMeetLocation)?.district || '').toUpperCase();
    let challenge = getCrewRecruitChallenge(this.registry, region);
    if (!challenge?.active) return false;

    // Legacy saves may retain a defeated challenge from the older automatic
    // rematch loop. Retire it immediately, without offering the same rival.
    if (challenge.lastLossAt || challenge.retryDeferredUntilExit) {
      resetCrewRecruitmentAfterLoss(this.registry, challenge);
      saveSessionState(this.registry);
      return false;
    }
    const location = getMeetLocation(this.selectedMeetLocation);
    if (String(challenge.regionId || '').toUpperCase() !==
        String(location?.district || '').toUpperCase()) return false;

    const character = characters[challenge.characterId];
    const opponentCar = cars[challenge.baseCarId];
    if (!character || !opponentCar) {
      clearCrewRecruitChallenge(this.registry, region);
      saveSessionState(this.registry);
      return false;
    }

    const rules = getCrewRecruitmentChallengeRules(this.registry, challenge);
    const eligibleIds = rules.eligibleCarIds || [];
    let selectedCarId = eligibleIds.includes(this.registry.get('selectedCarId'))
      ? this.registry.get('selectedCarId') : eligibleIds[0] || null;
    let cleanupReveal = () => {};
    let cleanupPlayer = () => {};
    let cleanupToggles = () => {};
    let cleanupVs = () => {};
    const interest = challenge;

    const drawPlayer = () => {
      cleanupPlayer();
      cleanupPlayer = this.createCrewInviteCarReveal(
        interest, selectedCarId ? cars[selectedCarId] : null, { side: 'left' }
      );
    };
    const definition = {
      id: 'crewRecruitmentCarChoice', once: false,
      title: String(challenge.regionId) + ' // CREW RECRUITMENT',
      characters: { left: null, right: null },
      pages: [{
        speaker: 'system',
        speakerLabel: 'CHOOSE A CAR TO RACE',
        hideSceneTitle: true,
        requireActionButton: true,
        text: 'Recruitment requires a factory-stock car within 40 kW of the rival. ' +
          'Choose one from your garage, or acquire one and come back later.',
      }],
      finalActionLabel: 'READY TO RACE',
      secondaryFinalActionLabel: 'RACE LATER',
    };
    const result = playMangaCutscene(this, definition, {
      onPageChange: () => {
        cleanupReveal = this.createCrewInviteCarReveal(interest, opponentCar);
        drawPlayer();
        cleanupVs = this.createCrewRecruitVsLabel();
        cleanupToggles = this.createCrewInviteCarToggles(eligibleIds, direction => {
          const index = eligibleIds.indexOf(selectedCarId);
          selectedCarId = eligibleIds[
            (Math.max(0, index) + direction + eligibleIds.length) %
              eligibleIds.length
          ];
          drawPlayer();
          cleanupToggles.setSelected?.(selectedCarId);
        });
        cleanupToggles.setSelected?.(selectedCarId);
      },
      isFinalActionEnabled: () => Boolean(
        selectedCarId && getCrewRecruitmentChallengeRules(
          this.registry, challenge
        ).eligibleCarIds.includes(selectedCarId)
      ),
      onComplete: ({ reason }) => {
        cleanupToggles();
        cleanupVs();
        cleanupPlayer();
        cleanupReveal();
        if (reason === 'action' && selectedCarId) {
          this.startCrewRecruitmentRace(challenge, selectedCarId);
        } else {
          saveSessionState(this.registry);
        }
      },
    });
    return Boolean(result?.played);
  }

  startCrewRecruitmentRace(challenge, playerCarId) {
    if (this.isCrewTestDriveMode()) return;
    if (!challenge?.characterId || !challenge?.baseCarId || !cars[playerCarId]) return;

    const character = characters[challenge.characterId];
    const recruitRules = getCrewRecruitmentChallengeRules(this.registry, challenge);
    if (!(recruitRules.eligibleCarIds || []).includes(playerCarId)) return;
    // Select the actual regional duel before RaceScene reads the legacy
    // active-challenge slot; accepted duels elsewhere remain untouched.
    setCrewRecruitChallenge(this.registry, challenge);

    const characterRating = Phaser.Math.Clamp(Number(character?.skill?.rating || 4), 1, 5);
    const rating = recruitRules.aiRating || characterRating;
    const characterAi = character?.skill?.ai || getEncounterAi(characterRating);
    const tierAi = getEncounterAi(rating);
    // Easy must never inherit an Expert/Elite recruit's personal AI; the
    // factory-stock duel uses a Rookie driver with the normal Easy assist.
    // Standard keeps the exact Expert profile. Hard keeps the demanding
    // max-of-character-and-Elite profile, both unchanged.
    const encounterAi = recruitRules.playerDifficulty === 'EASY'
      ? getEncounterAi(2)
      : recruitRules.playerDifficulty === 'STANDARD'
        ? getEncounterAi(4)
        : recruitRules.aiTier
        ? {
            ...characterAi,
            reactionSkill: Math.max(Number(characterAi.reactionSkill || 0), Number(tierAi.reactionSkill || 0)),
            launchSkill: Math.max(Number(characterAi.launchSkill || 0), Number(tierAi.launchSkill || 0)),
            shiftSkill: Math.max(Number(characterAi.shiftSkill || 0), Number(tierAi.shiftSkill || 0)),
            aggression: Math.max(Number(characterAi.aggression || 0), Number(tierAi.aggression || 0)),
          }
        : characterAi;

    this.registry.set('selectedCarId', playerCarId);
    this.registry.set(
      'selectedRacePlayerCharacterId',
      this.registry.get('playerCharacterId') || 'renMizuno'
    );
    this.registry.set('selectedOpponentCarId', challenge.baseCarId);
    this.registry.set('selectedOpponentPaintColor', DEFAULT_PAINT_COLOR);
    this.registry.set('selectedOpponentCharacterId', challenge.characterId);
    this.registry.set('selectedOpponentEncounterRating', rating);
    this.registry.set('selectedOpponentEncounterAi', encounterAi);
    this.registry.set(
      'selectedOpponentDifficulty',
      recruitRules.aiTier ||
        (rating >= 5 ? 'ELITE' : rating >= 4 ? 'EXPERT' : 'SKILLED')
    );
    this.registry.set('selectedOpponentBuildRating', 1);
    this.registry.set('selectedOpponentBuildArchetype', 'stock');
    this.registry.set(
      'selectedOpponentBuildState',
      createStockOpponentState(challenge.baseCarId)
    );
    this.registry.set('selectedRaceCategory', 'CREW_RECRUIT');
    this.registry.set('selectedRaceType', 'Standing Start');
    this.registry.set('selectedRaceDistanceM', 402.336);
    this.registry.set('selectedRaceDeal', 'CREW_RECRUIT');
    this.registry.set('selectedRaceStake', 0);
    this.registry.set('selectedRaceSpecialChallenge', false);
    this.registry.set('selectedRaceMeetOffer', null);
    this.registry.set('raceReturnScene', 'MeetScene');
    this.registry.set('raceDistrict', String(challenge.regionId).toUpperCase());
    this.registry.set('raceLocationLabel', 'CREW RECRUITMENT');
    this.registry.set('raceTimeOfDay', getStoryWorldPhase(this.registry));
    saveSessionState(this.registry);
    this.scene.start('RaceScene');
  }

  maybeShowTunerChallengeReveal() {
    if (this.isCrewTestDriveMode()) return false;
    const pending = String(this.registry.get('tunerChallengeRevealPending') || '').toUpperCase();
    if (!pending) return false;

    const location = getMeetLocation(this.selectedMeetLocation);
    if (String(location?.district || '').toUpperCase() !== pending) return false;

    const shop = getTunerShopForRegion(pending);
    if (!shop) {
      this.registry.set('tunerChallengeRevealPending', null);
      saveSessionState(this.registry);
      return false;
    }

    const mechanicId = characters[shop.mechanicId] ? shop.mechanicId : null;
    const mechanicName = mechanicId
      ? characters[mechanicId].name
      : (shop.label + ' ENGINEER');

    const dismissReveal = () => {
      this.registry.set('tunerChallengeRevealPending', null);
      saveSessionState(this.registry);
    };

    const result = playMangaCutscene(this, 'tunerShopDiscovery', {
      historyId: 'tunerShopDiscovery:' + pending,
      characterOverrides: {
        MECHANIC: mechanicId,
      },
      variables: {
        SHOP: shop.label,
        MECHANIC_NAME: mechanicName.toUpperCase(),
        MECHANIC_SUBTITLE: (shop.fullName + ' // REGION MECHANIC').toUpperCase(),
      },
      onComplete: dismissReveal,
    });

    if (!result.played && result.reason === 'seen') {
      dismissReveal();
      return false;
    }

    return Boolean(result.played);
  }

  maybeShowTunerTeamChallenge({ countReofferVisit = false } = {}) {
    if (this.isCrewTestDriveMode()) return false;
    if (this.registry.get('gameMode')==='arkonStory' &&
        !this.registry.get('arkonStoryChapter02Done'))return false;
    if (!this.hasCar || this.specialChallengeActive ||
        this.competitionLoading || this.competitionPopup?.active) return false;

    const location = getMeetLocation(this.selectedMeetLocation);
    const regionId = String(location?.district || '').toUpperCase();
    const shop = getTunerShopForRegion(regionId);
    let state = getTunerTeamChallengeState(this.registry, regionId);

    if (shop && state.championEarned && !state.championRewardClaimed) {
      const cash = Number(this.registry.get('cash') || 0);
      const donorCarId = String(shop.donorCarId || '');
      const donorLabel = String(shop.donorLabel || donorCarId || 'DONOR CAR');
      let couponCount = 0;
      let couponRequired = donorCarId ? getCarCouponRequirement(donorCarId) : 0;

      if (donorCarId) {
        const coupons = { ...(this.registry.get('carCoupons') || {}) };
        couponCount = Math.max(0, Number(coupons[donorCarId] || 0)) + 1;
        coupons[donorCarId] = couponCount;
        this.registry.set('carCoupons', coupons);
      }

      const cashReward = applyEasyCashWinBonus(
        this.registry,
        getRegionalChampionshipCashReward(regionId)
      );
      this.registry.set('cash', cash + cashReward);
      this.cashText?.setText('¥ ' + Number(cash + cashReward).toLocaleString('en-US'));

      state = this.setTunerChallengeState(regionId, {
        ...state,
        championEarned: true,
        championRewardClaimed: true,
      });

      this.legacyChampionRewardNotice = {
        regionId,
        donorLabel,
        couponCount,
        couponRequired,
        cash: cashReward,
      };

      saveSessionState(this.registry);
    }

    // Random invitations are ONLY for the first seven-racer encounter, or
    // one short re-invitation after declining it. Started regional challenges
    // and post-champion perfect sweeps are exclusively player-initiated.
    if (state.perfectEarned || state.perfectRewardClaimed ||
        state.championEarned || state.firstAttemptStarted) return false;

    const perfectRematch = Boolean(state.championEarned && !state.perfectEarned);

    // Returning from the briefing after choosing PAUSE should actually return
    // the player to the Meet, not immediately reopen the same challenge card.
    // On any later visit/scene entry the saved challenge can be resumed.
    if (state.paused && Date.now() - Number(state.pausedAt || 0) < 8000) {
      return false;
    }

    if (!shop || (isTunerShopUnlocked(this.registry, regionId) && !perfectRematch)) {
      return false;
    }

    const eligible = isTunerTeamChallengeEligible(this.registry, regionId);
    if (!eligible && !state.invited && state.stage <= 0) return false;
    if (state.retryNotBefore > Date.now()) return false;

    // "NOT YET" is a real refusal now. Only actual travel/arrival calls consume
    // the hidden 5–10 visit cooldown; race-result scene reloads do not.
    if (!state.invited && state.reofferVisitsRemaining > 0) {
      if (!countReofferVisit) return false;

      const remaining = Math.max(0, state.reofferVisitsRemaining - 1);
      state = this.setTunerChallengeState(regionId, {
        ...state,
        reofferVisitsRemaining: remaining,
      });
      saveSessionState(this.registry);

      if (remaining > 0) return false;
    }

    if (!state.invited) {
      const isReturningOffer = state.offeredOnce && state.reofferVisitsRemaining <= 0;
      const misses = isReturningOffer ? 0 : state.misses + 1;
      const trigger = isReturningOffer ||
        Math.random() < TUNER_TEAM_INVITE_CHANCE ||
        misses >= TUNER_TEAM_PITY_ARRIVALS;

      state = this.setTunerChallengeState(regionId, {
        ...state,
        misses: trigger ? 0 : misses,
        invited: trigger,
        offeredOnce: state.offeredOnce || trigger,
        reofferVisitsRemaining: trigger ? 0 : state.reofferVisitsRemaining,
        offeredAt: trigger ? (isReturningOffer ? 'RETURN' : 'REGION') : state.offeredAt,
      });
      saveSessionState(this.registry);

      if (!trigger) return false;
    }

    this.showTunerTeamChallengePopup(regionId);
    return true;
  }

  getPreparedRegionalChallengeRounds(regionId) {
    const key = String(regionId || '').toUpperCase();
    const state = getTunerTeamChallengeState(this.registry, key);
    const playerCharacterId = this.registry.get('playerCharacterId') || 'renMizuno';
    const generated = materialiseRegionalChallengeRounds(
      buildTunerTeamChallengeRounds(
        key, playerCharacterId,
        this.registry.get('playerDifficulty') || 'STANDARD', this.registry
      ), Number(this.registry.get('wins') || 0)
    );
    const old = Array.isArray(state.rounds) ? state.rounds : [];
    const recruited = getRecruitedCrewCharacterIds(this.registry);
    const invalid = old.some(round => recruited.has(round?.characterId));
    // The getter migrates old Sayaka snapshots for display, but their saved
    // power/vehicle builds may refer to her retired RX-8. Rebuild the roster
    // once from the approved current roster and Reika's signature FC3S.
    // Keep championship stage, wins and rewards in the surrounding state.
    const savedRounds = (this.registry.get('tunerTeamChallenges') || {})[key]?.rounds;
    const oldShinagawaDriver = key === 'SHINAGAWA' &&
      Array.isArray(savedRounds) &&
      savedRounds.some(round =>
        round?.characterId === 'sayakaFujieda' ||
        (round?.characterId === 'reikaTachibana' &&
          round?.carId !== getRegionalRivalSignatureCarId(
            key, 'reikaTachibana', round.carId))
      );
    if (oldShinagawaDriver) return generated;
    // Reuse saved opponents and their stage on resume, unless recruitment
    // made a previous roster illegal; this preserves mid-run continuity.
    return invalid ? generated : Array.from({ length: TUNER_TEAM_CHALLENGE_STAGES },
      (_, i) => {
        const saved = old[i];
        const fresh = generated[i];
        return saved?.characterId && characters[saved.characterId]
          ? { ...fresh, ...saved,
              carId: getRegionalRivalSignatureCarId(key, saved.characterId, fresh.carId) }
          : fresh;
      });
  }

  beginTunerTeamChallenge(regionId, { perfect = false } = {}) {
    const key = String(regionId || '').toUpperCase();
    if (!this.hasCar || this.isCrewTestDriveMode() || sceneCutsceneActive(this)) return false;
    if(this.registry.get('gameMode')==='arkonStory' &&
       !this.registry.get('arkonStoryChapter02Done'))return false;
    const state = getTunerTeamChallengeState(this.registry, key);
    if (state.perfectEarned || state.perfectRewardClaimed) return false;
    if (perfect && !state.championEarned) return false;
    if (!perfect && state.championEarned) return false;
    const continuingPerfect = Boolean(perfect && state.perfectAttempt &&
      state.stage > 0 && state.stage < TUNER_TEAM_CHALLENGE_STAGES);
    const rounds = this.getPreparedRegionalChallengeRounds(key);
    if (rounds.length !== TUNER_TEAM_CHALLENGE_STAGES || rounds.some(r => !r?.carId)) return false;
    const next = this.setTunerChallengeState(key, {
      ...state, firstAttemptStarted: true, invited: true, offeredOnce: true,
      activeSession: true, paused: false, pausedAt: 0,
      reofferVisitsRemaining: 0, retryNotBefore: 0,
      stage: perfect && !continuingPerfect ? 0 : state.stage,
      perfectAttempt: perfect ? true : state.perfectAttempt,
      perfectEligible: perfect ? true : state.perfectEligible,
      playerCarId: continuingPerfect && state.playerCarId
        ? state.playerCarId : (this.registry.get('selectedCarId') || ''),
      rounds,
    });
    if (!cars[next.playerCarId]) return false;
    saveSessionState(this.registry);
    this.startTunerTeamChallengeRound(key);
    return true;
  }

  // Retain this entry point for the first, organic call-out (and the dev
  // shortcut). All subsequent attempts use the dedicated Meet buttons.
  showTunerTeamChallengePopup(regionId, { forceCallout = false } = {}) {
    if (this.isCrewTestDriveMode() || !this.hasCar || sceneCutsceneActive(this)) return false;
    const key = String(regionId || '').toUpperCase();
    const state = getTunerTeamChallengeState(this.registry, key);
    const shop = getTunerShopForRegion(key);
    if (!shop || (!forceCallout && (state.championEarned || state.firstAttemptStarted))) {
      return false;
    }
    const rounds = this.getPreparedRegionalChallengeRounds(key);
    if (!rounds[0]?.characterId) return false;
    // A declined first invitation is reissued as a very short rival-led
    // manga exchange, never a generic modal with rectangular action buttons.
    const isReturn = state.offeredAt === 'RETURN';
    const returnLines = getRegionalChallengeReturnLines(key);
    const npcId = isReturn
      ? getCrewBattleCaptainId(key) || rounds[0].characterId
      : rounds[0].characterId;
    const npcName = String(characters[npcId]?.name || key + ' RIVAL').toUpperCase();
    const definition = isReturn
      ? {
          id: 'regionalChallengeReturnInvite',
          category: 'REGION / CHALLENGE',
          title: key + ' // REGIONAL CHALLENGE',
          once: false,
          characters: { left: '$NPC' },
          pages: [
            { speaker: 'left', pose: 'idle',
              text: returnLines[0] },
            { speaker: 'left', pose: 'idle',
              text: returnLines[1],
              emphasis: true, requireActionButton: true },
          ],
          finalActionLabel: 'ACCEPT',
          secondaryFinalActionLabel: 'RACE LATER',
        }
      : 'tunerTeamCallout';
    const postpone = () => {
      const visits = Phaser.Math.Between(
        TUNER_TEAM_REOFFER_MIN_VISITS, TUNER_TEAM_REOFFER_MAX_VISITS
      );
      this.setTunerChallengeState(key, {
        invited: false, offeredOnce: true, activeSession: false,
        reofferVisitsRemaining: visits, misses: 0, rounds,
      });
      saveSessionState(this.registry);
    };
    const result = playMangaCutscene(this, definition, {
      historyId: isReturn ? 'regionalChallengeReturnInvite:' + key : 'tunerTeamCallout:' + key,
      force: Boolean(forceCallout),
      characterOverrides: { NPC: npcId },
      variables: {
        REGION: key, SHOP: shop.label,
        NPC_NAME: npcName, NPC_SUBTITLE: key + ' // REGIONAL CREW',
      },
      onComplete: ({ reason }) => {
        if (reason === 'action') {
          // Manga scene must be fully torn down before the race transition.
          this.time.delayedCall(80, () => this.beginTunerTeamChallenge(key));
        } else {
          postpone();
        }
      },
    });
    return Boolean(result?.played);
  }

  startTunerTeamChallengeRound(regionId) {
    if (this.isCrewTestDriveMode()) return;
    const key = String(regionId || '').toUpperCase();
    const state = getTunerTeamChallengeState(this.registry, key);
    const round = state.rounds[state.stage];
    if (!round || !this.hasCar) return;

    const location = getMeetLocation(this.selectedMeetLocation);

    this.registry.set('selectedCarId', state.playerCarId || this.registry.get('selectedCarId'));
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
    this.registry.set('raceReturnScene', 'MeetScene');
    this.registry.set('raceTimeOfDay', getStoryWorldPhase(this.registry));
    this.registry.set('raceDistrict', key);
    this.registry.set('raceLocationLabel', 'TEAM CHALLENGE // ' + (state.stage + 1) + '/7');

    saveSessionState(this.registry);
    this.scene.start('RaceScene');
  }

  drawBase() {
    this.add.rectangle(780, 420, 1560, 840, 0x050912).setDepth(-30);

    this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x08121d,
      1
    ).setStrokeStyle(2, 0x24475f, 1).setDepth(-15);

    this.add.rectangle(
      CARDS.x + CARDS.w / 2,
      CARDS.y + CARDS.h / 2,
      CARDS.w,
      CARDS.h,
      0x07111d,
      0.99
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(30);

    this.stageMaskShape = this.make.graphics({ add: false });
    this.stageMaskShape.fillStyle(0xffffff, 1);
    this.stageMaskShape.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
    this.stageMask = this.stageMaskShape.createGeometryMask();
  }

  setMeetBackground(preferredKey = null, labelOverride = null, fallbackKey = null) {
    if (this.currentBackground) this.currentBackground.destroy();
    if (this.backgroundMaskShape) this.backgroundMaskShape.destroy();
    if (this.backgroundTint) this.backgroundTint.destroy();

    const available = meetBackgrounds.filter(bg => this.textures.exists(bg.key));
    const bg = preferredKey && this.textures.exists(preferredKey)
      ? { key: preferredKey, label: labelOverride || '' }
      : available.find(item => item.key === fallbackKey)
        || available.find(item => item.key === preferredKey)
        || available[0];
    if (!bg) return;

    const image = this.add.image(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      bg.key
    ).setDepth(-10);

    const source = this.textures.get(bg.key).getSourceImage();
    const coverScale = Math.max(STAGE.w / source.width, STAGE.h / source.height);
    image.setScale(coverScale);

    const maskShape = this.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
    image.setMask(maskShape.createGeometryMask());

    this.currentBackground = image;
    this.backgroundMaskShape = maskShape;
    this.locationText.setText(labelOverride || bg.label);

    this.backgroundTint = this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x03101b,
      0.035
    ).setDepth(-9);
  }

  buildHeader() {
    this.add.rectangle(780, 35, 1512, 62, 0x07111d, 1)
      .setStrokeStyle(2, 0x173249, 1)
      .setDepth(40);

    this.add.text(52, 35, 'MEET', {
      fontFamily: PIXEL_FONT, fontSize: '20px', color: '#eefaff'
    }).setOrigin(0, 0.5).setDepth(42);

    this.locationText = this.add.text(235, 35, 'TOKYO // NIGHT MEET', {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#8bbde0'
    }).setOrigin(0, 0.5).setDepth(42);

    const wins = this.registry.get('wins') ?? 0;
    const losses = this.registry.get('losses') ?? 0;
    const cash = this.registry.get('cash') ?? 50000;

    this.add.text(1105, 25, 'WINS  ' + wins, {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#b4ccdb'
    }).setOrigin(1, 0.5).setDepth(42);

    this.add.text(1105, 47, 'LOSSES  ' + losses, {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#b4ccdb'
    }).setOrigin(1, 0.5).setDepth(42);

    const settingsUi = addSettingsButton(this, 930, 35);
    settingsUi?.devCutscenes?.destroy?.();

    this.cashText = this.add.text(1512, 35, '¥ ' + Number(cash).toLocaleString('en-US'), {
      fontFamily: PIXEL_FONT, fontSize: '15px', color: '#ffe08a'
    }).setOrigin(1, 0.5).setDepth(42);
  }

  buildDevControls() {
    if (isArkonDen(this.registry)) this.registry.set('devMode', true);
    if (!this.registry.get('devMode')) return;

    // One permanent developer button expands into a six-action grid.
    const fill = 0x321523;
    const stroke = 0xff72a6;
    const textColor = '#ffd1e1';
    const controls = [];
    const x = STAGE.x + 114;
    const y = STAGE.y + 24;
    const deploy = this.add.rectangle(x, y, 188, 34, fill, 0.97)
      .setStrokeStyle(1, stroke, 0.98)
      .setInteractive({ useHandCursor: true }).setDepth(88);
    const deployLabel = this.add.text(x, y, 'D) DEPLOY  +', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: textColor,
    }).setOrigin(0.5).setDepth(89);

    const setExpanded = value => {
      this.devControlsExpanded = Boolean(value);
      deployLabel.setText(this.devControlsExpanded ? 'D) DEPLOY  -' : 'D) DEPLOY  +');
      controls.forEach(({ box, label }) => {
        box.setVisible(this.devControlsExpanded);
        label.setVisible(this.devControlsExpanded);
        if (this.devControlsExpanded) box.setInteractive({ useHandCursor: true });
        else box.disableInteractive();
      });
    };
    deploy.on('pointerover', () => deploy.setStrokeStyle(2, 0xffa7c6, 1));
    deploy.on('pointerout', () => deploy.setStrokeStyle(1, stroke, 0.98));
    deploy.on('pointerdown', () => setExpanded(!this.devControlsExpanded));

    const makeButton = (index, labelText, onPress) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const bx = STAGE.x + 111 + column * 187;
      const by = STAGE.y + 68 + row * 44;
      const box = this.add.rectangle(bx, by, 182, 36, fill, 0.97)
        .setStrokeStyle(1, stroke, 0.98).setDepth(88)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(bx, by, labelText, {
        fontFamily: PIXEL_FONT, fontSize: '6px', color: textColor,
      }).setOrigin(0.5).setDepth(89);
      box.on('pointerover', () => box.setStrokeStyle(2, 0xffa7c6, 1));
      box.on('pointerout', () => box.setStrokeStyle(1, stroke, 0.98));
      box.on('pointerdown', onPress);
      const control = { box, label, defaultText: labelText };
      controls.push(control);
      return control;
    };

    this.devScenesControl = makeButton(
      0, 'D) SCENES', () => { if (!sceneCutsceneActive(this)) showCutsceneTester(this); }
    );
    this.devRefreshChallengesControl = makeButton(
      1, 'D) REFRESH MEET', () => this.devRefreshAllChallenges()
    );
    this.devForceChallengerControl = makeButton(
      2, 'D) PINK SLIP', () => this.forceDevSpecialChallenger()
    );
    this.devForceTeamChallengeControl = makeButton(
      3, 'D) REGIONAL CHALLENGE', () => this.forceDevTunerTeamChallenge()
    );
    this.devForceCrewRecruitControl = makeButton(
      4, 'D) DEPLOY RECRUIT', () => this.forceDevCrewRecruitment()
    );
    if (isArkonDen(this.registry) && isCrewComplete(this.registry)) {
      this.devForceRegionalCrewBattleControl = makeButton(
        5, 'D) CREW CHALLENGE', () => this.forceDevRegionalCrewBattle()
      );
    }
    setExpanded(false);
  }

  flashDevControl(control, message, color = '#f4fbff') {
    if (!control?.label?.active) return;
    control.label.setText(message).setColor(color);
    this.time.delayedCall(1100, () => {
      if (!control?.label?.active) return;
      control.label.setText(control.defaultText).setColor('#ffd1e1');
    });
  }

  forceDevRegionalCrewBattle() {
    if (!isArkonDen(this.registry) || !isCrewComplete(this.registry)) return;

    if (this.isCrewTestDriveMode()) {
      this.flashDevControl(
        this.devForceRegionalCrewBattleControl,
        'D) USE OWN CAR',
        '#ffb4c8'
      );
      return;
    }

    const location = getMeetLocation(this.selectedMeetLocation);
    const regionId = String(location?.district || '').toUpperCase();
    const units = getCrewBattleUnits(this.registry);
    const rounds = buildRegionalCrewBattleRounds(regionId, this.registry);

    if (!regionId || units.length < 3 || rounds.length < 3) {
      this.flashDevControl(
        this.devForceRegionalCrewBattleControl,
        'D) CREW UNAVAILABLE',
        '#ffb4c8'
      );
      return;
    }

    this.showCrewBattleIntroduction(regionId);
    this.flashDevControl(
      this.devForceRegionalCrewBattleControl,
      'D) CREW READY',
      '#f1d0ff'
    );
  }

  forceDevTunerTeamChallenge() {
    if (!this.registry.get('devMode') || !this.hasCar) return;

    const location = getMeetLocation(this.selectedMeetLocation);
    const regionId = String(location?.district || '').toUpperCase();
    const shop = getTunerShopForRegion(regionId);

    if (!shop) {
      this.flashDevControl(
        this.devForceTeamChallengeControl,
        'D) NO REGIONAL TUNER',
        '#ffb4c8'
      );
      return;
    }

    const playerCharacterId = this.registry.get('playerCharacterId') || 'renMizuno';
    const rounds = materialiseRegionalChallengeRounds(
      buildTunerTeamChallengeRounds(
        regionId,
        playerCharacterId,
        this.registry.get('playerDifficulty') || 'STANDARD',
        this.registry
      ),
      Number(this.registry.get('wins') || 0)
    );
    this.setTunerChallengeState(regionId, {
      invited: true,
      offeredOnce: true,
      reofferVisitsRemaining: 0,
      completed: false,
      stage: 0,
      misses: 0,
      perfectEligible: true,
      activeSession: false,
      retryNotBefore: 0,
      rounds,
      offeredAt: 'DEV',
      completedAt: 0,
    });
    saveSessionState(this.registry);

    this.showTunerTeamChallengePopup(regionId, { forceCallout: true });
    this.flashDevControl(
      this.devForceTeamChallengeControl,
      'D) CHALLENGE READY',
      '#ffe2a4'
    );
  }

  forceDevSpecialChallenger() {
    if (!this.registry.get('devMode')) return;

    if (!this.hasCar) {
      this.flashDevControl(
        this.devForceChallengerControl,
        'D) NO CAR',
        '#ffb4c8'
      );
      return;
    }

    const challenger = this.generateSpecialChallenger();
    if (!challenger) {
      this.flashDevControl(
        this.devForceChallengerControl,
        'D) GARAGE FULL',
        '#ffb4c8'
      );
      return;
    }

    this.registry.set('specialChallenger', challenger);
    recordCarMagazineSightings(this.registry, [{ carId: challenger.carId, source: 'pink-slip' }], 'pink-slip');
    this.registry.set('challengerMisses', 0);
    this.registry.set('challengerCooldown', 2);
    saveSessionState(this.registry);

    this.showSpecialChallenger(challenger, true);
    this.flashDevControl(
      this.devForceChallengerControl,
      'D) PINK SLIP READY',
      '#ffb4c8'
    );
  }

  forceDevCrewRecruitment() {
    if (!this.registry.get('devMode')) return;

    const location = getMeetLocation(this.selectedMeetLocation);
    const regionId = String(location?.district || '').toUpperCase();
    const candidates = getRecruitableCrewCandidates(this.registry, regionId);
    const visibleCharacterIds = new Set(
      (this.locationOffers[this.selectedMeetLocation] || [])
        .map(offer => offer?.characterId)
        .filter(Boolean)
    );
    const candidate = candidates.find(item =>
      visibleCharacterIds.has(item.characterId)
    );

    if (!candidate) {
      this.flashDevControl(
        this.devForceCrewRecruitControl,
        candidates.length
          ? 'D) RECRUIT NOT HERE'
          : 'D) NO RECRUIT',
        '#ffb4c8'
      );
      return;
    }

    this.registry.set('crewInviteInterest', {
      active: true,
      regionId,
      locationId: this.selectedMeetLocation,
      characterId: candidate.characterId,
      baseCarId: candidate.baseCarId,
      createdAt: Date.now(),
      source: 'devMeetDeploy',
    });
    this.registry.set('crewPendingRecruit', null);
    this.registry.set('crewRecruitChallenge', null);
    saveSessionState(this.registry);

    const shown = this.maybeShowCrewInviteInterest();
    this.flashDevControl(
      this.devForceCrewRecruitControl,
      shown ? 'D) RECRUIT DEPLOYED' : 'D) RECRUIT READY',
      '#9fffe3'
    );
  }

  devRefreshAllChallenges() {
    if (!this.registry.get('devMode')) return;

    this.registry.set('specialChallenger', null);
    this.registry.set('challengerMisses', 0);
    this.registry.set('challengerCooldown', 0);

    this.specialChallengeActive = false;
    this.clearSpecialChallengeObjects();
    this.restoreMeetActionListeners();

    this.refreshAllLocationOffers({ resetTimer: true, persist: false });
    this.persistMeetRound();
    this.rollOffers({ resetTimer: false });

    this.flashDevControl(
      this.devRefreshChallengesControl,
      'D) MEET REFRESHED',
      '#8fe7ff'
    );
  }

  buildGpsPanel() {
    // Navigation now lives in the full-height race sidebar.
  }

  updateGpsPanel() {
    const current = getMeetLocation(this.selectedMeetLocation);
    const phase = this.worldPhase || getStoryWorldPhase(this.registry);
    this.locationText?.setText(
      current.district + ' // ' +
      current.label + ' // ' +
      phase.toUpperCase() + ' // ' +
      current.difficulty
    );
  }

  releaseDeferredCrewRecruitment() {
    // Migration guard: do not revive legacy defeated recruitment duels.
    const region = String(getMeetLocation(this.selectedMeetLocation)?.district || '').toUpperCase();
    const challenge = getCrewRecruitChallenge(this.registry, region);
    if (!challenge?.lastLossAt && !challenge?.retryDeferredUntilExit) return;
    resetCrewRecruitmentAfterLoss(this.registry, challenge);
    saveSessionState(this.registry);
  }

  travelToLocation(locationId, suppliedCost = null) {
    if (!this.hasCar || !canVisitDuringGinzaLoan(this.registry, locationId)) return false;

    const travelTarget = getTravelLocation(locationId);
    if (!travelTarget) return false;

    const travelCost = suppliedCost == null
      ? getTravelCost(this.selectedMeetLocation, locationId)
      : Number(suppliedCost || 0);
    const cash = Number(this.registry.get('cash') || 0);
    if (cash < travelCost) return false;

    // A real departure (not the RaceScene -> MeetScene results handoff)
    // re-enables a pending defeated recruitment for a LATER visit.
    if (locationId !== this.selectedMeetLocation &&
        (travelTarget.regionId === 'CENTRAL_TOKYO' ||
         travelTarget.regionId === 'OSHIAGE' ||
         Boolean(MEET_LOCATIONS[locationId]))) {
      this.releaseDeferredCrewRecruitment();
    }

    if (travelTarget.regionId === 'CENTRAL_TOKYO') {
      this.registry.set('cash', cash - travelCost);
      this.registry.set('centralTokyoLocation', locationId);
      this.registry.set('district', 'CENTRAL_TOKYO');
      this.registry.set('meetStranded', false);
      saveSessionState(this.registry);
      this.scene.start('CentralTokyoScene', { locationId });
      return true;
    }

    if (travelTarget.regionId === 'OSHIAGE') {
      this.registry.set('cash', cash - travelCost);
      this.registry.set('oshiageLocation', locationId);
      this.registry.set('district', 'OSHIAGE');
      this.registry.set('meetStranded', false);
      saveSessionState(this.registry);
      this.scene.start('OshiageScene', { locationId });
      return true;
    }

    if (!MEET_LOCATIONS[locationId]) return false;

    if (locationId !== this.selectedMeetLocation) {
      this.locationSelectedOfferIndex[this.selectedMeetLocation] = this.selectedOfferIndex;
      this.registry.set('cash', cash - travelCost);
      this.selectedMeetLocation = locationId;

      const destination = getMeetLocation(locationId);
      this.registry.set('meetLocation', locationId);
      this.registry.set('district', destination.district);

      const finishTravel = () => {
        this.cashText?.setText('¥ ' + Number(cash - travelCost).toLocaleString('en-US'));
        this.updateWorkshopButton();
        this.showTravelNotice(destination, travelCost);

        // Travel changes the location only. The current round stays intact.
        this.rollOffers({ resetTimer: false });
        this.persistMeetRound();
        this.updateGpsPanel();
        this.buildMeetProgressionButtons();

        this.time.delayedCall(60, () => {
          // Region-specific pending invitations open only after arriving in
          // their own region; do not interrupt them with a regional intro.
          if (this.maybeShowCrewInviteInterest()) return;
          if (this.maybeShowActiveCrewRecruitChallenge()) return;
          const introShown = this.maybeShowRegionalCrewIntroduction({
            countChallengeVisit: true,
          });
          if (!introShown) {
            this.maybeShowTunerTeamChallenge({ countReofferVisit: true });
          }
        });
      };

      const destinationOffers = this.locationOffers[locationId]
        || this.generateOffersForLocation(locationId);
      this.locationOffers[locationId] = destinationOffers;

      if (this.ensureMeetRosterAssets(
        destinationOffers,
        locationId,
        'LOADING ' + destination.district,
        finishTravel
      )) {
        return true;
      }
      finishTravel();
    }

    this.updateGpsPanel();
    return true;
  }

  showTravelNotice(destination, travelCost) {
    const note = this.add.text(
      STAGE.x + STAGE.w - 24,
      STAGE.y + 28,
      destination.district + ' // ' + destination.label +
        (travelCost ? '  •  FUEL -¥' + travelCost.toLocaleString('en-US') : ''),
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#e7faff',
        backgroundColor: '#07111dee',
        padding: { x: 12, y: 8 },
      }
    ).setOrigin(1, 0).setDepth(86);

    this.time.delayedCall(1800, () => {
      if (!note.active) return;
      this.tweens.add({
        targets: note,
        alpha: 0,
        duration: 280,
        onComplete: () => note.destroy(),
      });
    });
  }

  buildSidebar() {
    this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + SIDE.h / 2,
      SIDE.w,
      SIDE.h,
      0x07111d,
      0.98
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(35);

    this.add.text(SIDE.x + 20, SIDE.y + 18, 'RACE MODE', {
      fontFamily: PIXEL_FONT,
      fontSize: '12px',
      color: '#8cc8ec',
    }).setDepth(37);

    const competitionCooldownRemaining = this.getCompetitionCooldownRemainingMs();
    const crewTestDrive = this.isCrewTestDriveMode();
    const competitionUnlocked =
      this.hasCar &&
      !crewTestDrive &&
      Number(this.registry.get('wins') || 0) >= 1 &&
      competitionCooldownRemaining <= 0;

    const competitionLabel = crewTestDrive
      ? 'CREW TEST // SINGLE + PINKS'
      : Number(this.registry.get('wins') || 0) < 1
        ? 'SHOWDOWN // WIN 1 RACE'
        : competitionCooldownRemaining > 0
          ? 'COOLDOWN // ' + this.formatCompetitionCooldown(competitionCooldownRemaining)
          : 'STREET SHOWDOWN';

    const buttons = [
      ['SINGLE RACE', 'SINGLE', false],
      [competitionLabel, 'COMPETITION', !competitionUnlocked],
    ];

    this.modeButtons = [];
    buttons.forEach((row, i) => {
      const y = SIDE.y + 78 + i * 50;
      const locked = row[2];
      const box = this.add.rectangle(
        SIDE.x + SIDE.w / 2,
        y,
        SIDE.w - 36,
        40,
        locked ? 0x0a1017 : 0x10283b,
        1
      ).setStrokeStyle(
        locked ? 1 : 2,
        locked ? 0x29343d : 0x43dfff,
        1
      ).setDepth(37);

      const label = this.add.text(SIDE.x + 24, y, row[0], {
        fontFamily: PIXEL_FONT,
        fontSize: locked ? '7px' : '10px',
        color: locked ? '#53626c' : '#ffffff',
      }).setOrigin(0, 0.5).setDepth(38);

      if (!locked && row[1] === 'COMPETITION') {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => this.showCompetitionPopup());
      }

      this.modeButtons.push({ key: row[1], box, label, locked });
    });

    const selectedCarId = this.registry.get('selectedCarId');
    const selectedCar = cars[selectedCarId];
    const selectedState = (this.registry.get('carStates') || {})[selectedCarId] || {};
    const selectedPerformance = selectedCarId
      ? getVehiclePerformance(selectedCarId, selectedState)
      : null;
    const selectedRating = selectedCar
      ? getPowerTorqueDisplay(
          selectedCar,
          selectedState,
          selectedPerformance?.car || selectedCar
        )
      : null;

    this.add.text(SIDE.x + 20, SIDE.y + 168, 'YOUR CAR', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#8cc8ec',
    }).setDepth(37);

    this.currentCarText = this.add.text(
      SIDE.x + 20,
      SIDE.y + 194,
      selectedCar
        ? selectedCar.shortName + '\n' +
          selectedRating.powerLabel + '  •  ' + selectedRating.torqueLabel
        : 'NO CAR',
      {
        fontFamily: BODY_FONT,
        fontSize: '11px',
        color: selectedCar ? '#d8e7ef' : '#72838f',
        lineSpacing: -2,
        wordWrap: { width: SIDE.w - 40 },
      }
    ).setDepth(37);

    this.add.text(SIDE.x + 20, SIDE.y + 268, 'SELECTED RIVAL', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#8cc8ec',
    }).setDepth(37);

    this.selectedSummary = this.add.text(SIDE.x + 20, SIDE.y + 296, '', {
      fontFamily: BODY_FONT,
      fontSize: '12px',
      color: '#d8e7ef',
      lineSpacing: 0,
      wordWrap: { width: SIDE.w - 40 },
    }).setDepth(37);

    this.add.text(SIDE.x + 20, SIDE.y + 404, 'RIVAL OFFER', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#8cc8ec',
    }).setDepth(37);

    this.rivalOfferText = this.add.text(
      SIDE.x + SIDE.w - 20,
      SIDE.y + 404,
      '',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: '#ffe08a',
      }
    ).setOrigin(1, 0).setDepth(37);

    // Primary action now sits where the old pink-slip button lived.
    this.raceButton = this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 492,
      SIDE.w - 36,
      44,
      0x0b2826,
      1
    ).setStrokeStyle(2, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(38);

    this.raceButtonLabel = this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 492,
      'RACE  >',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '10px',
        color: '#f1fffb',
      }
    ).setOrigin(0.5).setDepth(39);

    this.raceButton.on('pointerdown', () => this.startSelectedRace());

    this.pinkSlipButton = this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 552,
      SIDE.w - 36,
      40,
      0x291620,
      1
    ).setStrokeStyle(2, 0xff5f93, 0.9)
      .setInteractive({ useHandCursor: true })
      .setDepth(37);

    this.pinkSlipButtonLabel = this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 552,
      'PINK SLIPS?',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: '#ffdce8',
      }
    ).setOrigin(0.5).setDepth(38);

    this.pinkResponseText = this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 584,
      '',
      {
        fontFamily: BODY_FONT,
        fontSize: '10px',
        color: '#91a9b7',
        wordWrap: { width: SIDE.w - 44 },
        align: 'center',
        lineSpacing: 0,
      }
    ).setOrigin(0.5, 0).setDepth(38);

    this.pinkSlipButton.on('pointerdown', () => this.challengePinkSlips());

    // Match Central Tokyo and Workshop navigation: the map is always the
    // bottom-right action, including when the player is stranded.
    this.mapButton = this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      770,
      SIDE.w - 32,
      42,
      0x102138,
      1
    ).setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(40);

    this.mapButtonLabel = this.add.text(
      SIDE.x + SIDE.w / 2,
      770,
      'GO TO MAP  >',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '10px',
        color: '#eef8ff',
      }
    ).setOrigin(0.5).setDepth(41);

    this.mapButton.on('pointerdown', () => this.showDistrictPopup());

    // Backward-compatible alias for special-challenger code that temporarily
    // disables navigation while the challenge presentation is active.
    this.gpsTravelButton = this.mapButton;
  }

  updateWorkshopButton() {
    // Meet navigation is map-only. Kept as a no-op for older refresh paths.
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
    if (!isWorkshopProgressionReady(this.registry, targetTier)) return;
    const selectedCarId = this.registry.get('selectedCarId');
    const ownedCarIds = this.registry.get('ownedCarIds') || [];
    const locations = { ...(this.registry.get('carGarageLocations') || {}) };

    this.registry.set(
      'garageTier',
      Math.max(Number(this.registry.get('garageTier') || 0), targetTier)
    );
    this.registry.set('cash', cash - price);
    this.registry.set('workshopLocationId', location.id);

    const storyId = targetTier >= 2
      ? 'warehouseHqUnlocked'
      : targetTier >= 1
        ? 'canalYardUnlocked'
        : null;
    if (storyId) {
      if (storyId === 'canalYardUnlocked') markCutsceneSeen(this.registry, 'canalYardStoryPending');
      if (storyId === 'warehouseHqUnlocked') markCutsceneSeen(this.registry, 'warehouseHqStoryPending');
      try { sessionStorage.setItem('tokyoShiftPendingCutscene', storyId); } catch (e) {}
    }

    // A newly purchased garage becomes home immediately, and the car the
    // player drove there occupies one of its fresh storage slots.
    if (selectedCarId && ownedCarIds.includes(selectedCarId)) {
      locations[selectedCarId] = location.id;
      this.registry.set('carGarageLocations', locations);
    }

    this.registry.set('meetStranded', false);
    this.cashText?.setText('¥ ' + Number(cash - price).toLocaleString('en-US'));
    saveSessionState(this.registry);

    try {
      sessionStorage.setItem('tokyoShiftInternalReload', '1');
      sessionStorage.setItem('tokyoShiftForceGarage', '1');
      sessionStorage.removeItem('tokyoShiftBootMessage');
    } catch (e) {}

    window.location.reload();
  }

  returnToWorkshop(workshopLocationId = 'shinonomeWorkshop', requestedCost = null) {
    if (isGinzaLoanActive(this.registry)) return false;
    const garageTier = Number(this.registry.get('garageTier') || 0);
    const destinationId = isWorkshopUnlocked(workshopLocationId, garageTier)
      ? workshopLocationId
      : 'shinonomeWorkshop';

    const cash = Number(this.registry.get('cash') || 0);
    const fallbackCost = this.hasCar ? WORKSHOP_RETURN_COST : TAXI_TO_WORKSHOP_COST;
    const cost = Number.isFinite(Number(requestedCost))
      ? Math.max(0, Number(requestedCost))
      : fallbackCost;

    if (cash < cost) return;

    this.releaseDeferredCrewRecruitment();
    this.registry.set('cash', cash - cost);
    this.registry.set('meetStranded', false);
    this.registry.set('workshopLocationId', destinationId);
    this.cashText?.setText('¥ ' + Number(cash - cost).toLocaleString('en-US'));
    saveSessionState(this.registry);

    // Meet -> Workshop proved unreliable as an in-Phaser scene handoff on
    // iOS/PWA: GarageScene starts (music changes) while the GPS overlay can
    // remain visually stuck. Persist the exact destination and perform a clean
    // document reload instead. BootScene is invisible, so this feels direct.
    try {
      sessionStorage.setItem('tokyoShiftInternalReload', '1');
      sessionStorage.setItem('tokyoShiftForceGarage', '1');
      sessionStorage.removeItem('tokyoShiftBootMessage');
    } catch (e) {}

    window.location.reload();
  }

  buildBottomArea() {
    this.rivalsTitleText = this.add.text(CARDS.x + 18, CARDS.y + 6, 'RIVALS', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#a7d5ef'
    }).setDepth(33);
  }

  getEventCarBand(rating = 3) {
    const bands = {
      1: ['ae86', 'ef', 'ek9', 'crx'],
      2: ['ae86', 'ef', 'ek9', 'crx', 'fc3s', 'rx8', 'a60'],
      3: ['ek9', 'fc3s', 'rx8', 'gr86', 'galant', 'rx7fd'],
      4: ['fc3s', 'gr86', 'rx7fd', 'galant', 'evo5', 'evo6', 'gc8', 'r32', '3000gt'],
      5: ['rx7fd', 'evo5', 'evo6', 'galant', 'gc8', 'r32', 'r34', '3000gt', 'jza80', 'nsx'],
    };
    return bands[Phaser.Math.Clamp(Math.round(Number(rating) || 3), 1, 5)] || bands[3];
  }

  chooseEventCar(rating = 3, { preferUnowned = true, exclude = [], restriction = null } = {}) {
    const owned = this.registry.get('ownedCarIds') || [];
    const selected = this.registry.get('selectedCarId');
    const blocked = new Set(exclude);
    const band = this.getEventCarBand(rating);
    const allowed = id =>
      cars[id] &&
      id !== selected &&
      !blocked.has(id) &&
      carMatchesCompetitionRestriction(id, restriction);

    const tiers = [
      preferUnowned
        ? band.filter(id => allowed(id) && !owned.includes(id))
        : [],
      band.filter(allowed),
      carOrder.filter(id => allowed(id) && !owned.includes(id)),
      carOrder.filter(allowed),
    ].filter(list => list.length);

    const fallback = carOrder.filter(id => cars[id] && carMatchesCompetitionRestriction(id, restriction));
    return Phaser.Utils.Array.GetRandom(tiers[0] || (fallback.length ? fallback : ['ek9']));
  }

  getCompetitionRestriction(difficulty = 'MED') {
    const location = getMeetLocation(this.selectedMeetLocation);
    const pool = getCompetitionRestrictionPool(location.district, difficulty);
    if (!pool.length) return null;

    const owned = (this.registry.get('ownedCarIds') || []).filter(id => cars[id]);
    const possible = pool.filter(restriction =>
      owned.some(id => carMatchesCompetitionRestriction(id, restriction))
    );
    if (!possible.length) return null;

    const region = String(location.district || '').toUpperCase();
    const level = String(difficulty || '').toUpperCase();
    let chance = 0.40;
    if (region === 'SHINJUKU') chance = 0.58;
    if (region === 'DAIKOKU') chance = 0.72;
    if (level === 'HARD') chance = Math.max(chance, 0.55);
    if (level === 'ELITE') chance = Math.max(chance, 0.72);

    if (Phaser.Math.FloatBetween(0, 1) > chance) return null;
    return Phaser.Utils.Array.GetRandom(possible);
  }

  chooseEventCharacter(rating = 3, exclude = []) {
    const blocked = new Set([...exclude, ...getRecruitedCrewCharacterIds(this.registry)]);
    const location = getMeetLocation(this.selectedMeetLocation);

    const candidates = getRivalCharacterOrderForRegion(location.district)
      .filter(id =>
        !blocked.has(id) &&
        characters[id] &&
        isMainRivalAvailableAtRegionalMeet(
          this.registry,
          id,
          location.district
        )
      )
      .sort((a, b) => {
        const ar = Number(characters[a]?.skill?.rating || 3);
        const br = Number(characters[b]?.skill?.rating || 3);
        return Math.abs(ar - rating) - Math.abs(br - rating);
      });

    const close = candidates.filter(id =>
      Math.abs(Number(characters[id]?.skill?.rating || 3) - rating) <= 1
    );

    return Phaser.Utils.Array.GetRandom(close.length ? close : candidates);
  }

  getDisplayedSkillRange(rating = 3) {
    const rounded = Phaser.Math.Clamp(Math.round(Number(rating) || 3), 1, 5);
    if (rounded <= 2) return 'ROOKIE – SKILLED';
    if (rounded === 3) return 'SKILLED – EXPERT';
    return 'EXPERT – ELITE';
  }

  generateSpecialChallenger() {
    const location = getMeetLocation(this.selectedMeetLocation);
    const profile = getEncounterProfile(this.selectedMeetLocation, location.difficulty);
    const owned = this.registry.get('ownedCarIds') || [];
    const capacity = getGarageCapacity(this.registry.get('garageTier') || 0);

    // Do not offer a car the player cannot physically keep.
    if (owned.length >= capacity) return null;

    // A character-instigated pink-slip race must come from somebody who is
    // physically present at this exact Meet. This keeps the challenger tied to
    // the visible three-person roster instead of spawning a second/random NPC.
    const roster = (this.locationOffers[this.selectedMeetLocation] || this.offers || [])
      .filter(offer =>
        offer?.characterId &&
        offer?.carId &&
        characters[offer.characterId] &&
        cars[offer.carId]
      );
    const fairRoster = roster.filter(offer =>
      isPinkSlipValueEligible(this.registry.get('selectedCarId'), offer.carId)
    );
    const freshRoster = fairRoster.filter(offer => !offer.resultState && !offer.locked);
    const sourceOffer = Phaser.Utils.Array.GetRandom(
      freshRoster.length ? freshRoster : fairRoster
    );
    if (!sourceOffer) return null;

    const encounterRating = Phaser.Math.Clamp(
      Number(sourceOffer.encounterRating || 3),
      1,
      5
    );
    const characterId = sourceOffer.characterId;
    const carId = sourceOffer.carId;

    return {
      active: true,
      locationId: this.selectedMeetLocation,
      characterId,
      carId,
      paintColor: normalisePaintColor(
        sourceOffer.paintColor,
        Phaser.Utils.Array.GetRandom(RIVAL_PAINT_COLORS)
      ),
      encounterRating,
      // Driver pressure is applied once, when RaceScene constructs the AI.
      encounterAi: sourceOffer.encounterAi || getEncounterAi(encounterRating),
      opponentBuildRating: sourceOffer.opponentBuildRating,
      opponentBuildArchetype: sourceOffer.opponentBuildArchetype || null,
      opponentBuildState: sourceOffer.opponentBuildState || null,
      skillRange: this.getDisplayedSkillRange(encounterRating),
      raceType: sourceOffer.raceType || chooseWeightedRaceType(
        PROGRESSION_BALANCE.meetMatchmaking.raceTypeChances?.pinkSlipRolling ?? 0.12
      ),
      difficulty: sourceOffer.difficulty || profile.difficulty,
      quote: 'Keys for keys. Right now.',
      sourceMeetSlot: Math.max(0, roster.indexOf(sourceOffer)),
      createdAt: Date.now(),
    };
  }

  maybeGenerateSpecialChallenger() {
    const meetObscured = Boolean(
      this.travelMapPopup?.active ||
      this._settingsOverlay?.length ||
      this.tunerChallengePopup?.active ||
      this.competitionPopup?.active ||
      this.lastCarPinkWarning?.active ||
      sceneCutsceneActive(this)
    );
    if (
      !this.hasCar ||
      meetObscured ||
      cars[this.registry.get('selectedCarId')]?.crewLoan
    ) return null;

    const existing = this.registry.get('specialChallenger');
    const existingStillAtMeet = (
      this.locationOffers[this.selectedMeetLocation] ||
      this.offers ||
      []
    ).some(offer =>
      offer?.characterId === existing?.characterId &&
      offer?.carId === existing?.carId
    );
    if (existing?.active && existingStillAtMeet) return existing;
    if (existing?.active && !existingStillAtMeet) {
      this.registry.set('specialChallenger', null);
    }

    // Meet refreshes share the same cached race-based lottery as player
    // requests and incoming rivals. Refreshing cannot improve the odds.
    const challenger = this.generateSpecialChallenger();
    if (!challenger || !rollPinkSlipOpportunity(this.registry)) return null;
    if (!consumePinkSlipOpportunity(this.registry)) return null;

    this.registry.set('specialChallenger', challenger);
    this.registry.set('challengerMisses', 0);
    this.registry.set('challengerCooldown', 0);
    saveSessionState(this.registry);
    return challenger;
  }

  clearSpecialChallengeObjects() {
    (this.specialChallengeObjects || []).forEach(obj => obj?.destroy?.());
    this.specialChallengeObjects = [];
  }

  specialChallengerAssetsReady(challenger) {
    const character = characters[challenger?.characterId];
    const car = cars[challenger?.carId];
    if (!character || !car) return false;

    try {
      ensureDerivedModularCarTextures(this, { [challenger.carId]: car });
    } catch (e) {}

    const contextualVisual = getCharacterVisualForContext(
      challenger?.characterId,
      {
        rivalContext: true,
        playerCharacterId: this.registry.get('playerCharacterId') || '',
      }
    ) || character.visual;
    const characterKey = contextualVisual?.spriteKey;
    const bodyKey = getCarBodyTextureKey(this, car);
    const wheelKey = car.visual?.wheelKey;

    return Boolean(
      characterKey &&
      bodyKey &&
      wheelKey &&
      this.textures.exists(characterKey) &&
      this.textures.exists(bodyKey) &&
      this.textures.exists(wheelKey)
    );
  }

  recoverSpecialChallengerView({ clearChallenger = false } = {}) {
    this.specialChallengePreparing = false;
    this.specialChallengeActive = false;
    this.clearSpecialChallengeObjects();

    if (clearChallenger) {
      this.registry.set('specialChallenger', null);
      saveSessionState(this.registry);
    }

    this.restoreMeetActionListeners();
    this.rollOffers({ resetTimer: false, force: true });
  }

  prepareSpecialChallengerAssets(challenger, animate = true) {
    if (this.specialChallengePreparing) return false;

    const character = characters[challenger?.characterId];
    const car = cars[challenger?.carId];
    if (!character || !car) {
      this.recoverSpecialChallengerView({ clearChallenger: true });
      return false;
    }

    try {
      ensureDerivedModularCarTextures(this, { [challenger.carId]: car });
    } catch (e) {}

    if (this.specialChallengerAssetsReady(challenger)) return true;

    this.specialChallengePreparing = true;

    // Keep the normal meet visible until every challenger asset is ready.
    // This prevents the old failure mode where the three rivals were cleared
    // first and an iOS loading hiccup left only the persistent action buttons.
    (this.offers || []).forEach(offer => offer?.card?.disableInteractive?.());
    this.raceButton?.disableInteractive();
    this.pinkSlipButton?.disableInteractive();
    this.gpsTravelButton?.disableInteractive();
    this.modeButtons?.forEach(item => item.box.disableInteractive());

    const contextualVisual = getCharacterVisualForContext(
      challenger?.characterId,
      {
        rivalContext: true,
        playerCharacterId: this.registry.get('playerCharacterId') || '',
      }
    ) || character.visual;

    if (
      contextualVisual?.spriteKey &&
      contextualVisual?.path &&
      !this.textures.exists(contextualVisual.spriteKey)
    ) {
      this.load.image(
        contextualVisual.spriteKey,
        getCharacterAssetUrl(contextualVisual.path)
      );
    }

    preloadCarAppearanceAssets(
      this,
      { [challenger.carId]: car },
      '20260928-r232'
    );
    preloadCarWheel(this, car);

    const retry = () => {
      this.specialChallengePreparing = false;

      try {
        ensureDerivedModularCarTextures(this, { [challenger.carId]: car });
      } catch (e) {}

      const live = this.registry.get('specialChallenger');
      const stillCurrent = Boolean(
        live?.active &&
        live.createdAt === challenger.createdAt &&
        live.locationId === this.selectedMeetLocation
      );

      if (stillCurrent && this.specialChallengerAssetsReady(challenger)) {
        this.showSpecialChallenger(challenger, animate);
        return;
      }

      this.recoverSpecialChallengerView({
        clearChallenger: stillCurrent && !this.specialChallengerAssetsReady(challenger),
      });
    };

    const loaderBusy = Boolean(this.load.isLoading?.());
    const hasQueued = Number(this.load.list?.size || 0) > 0;

    if (loaderBusy || hasQueued) {
      this.load.once('complete', retry);
      if (!loaderBusy) this.load.start();
    } else {
      retry();
    }

    return false;
  }

  restoreMeetActionListeners() {
    this.pinkSlipButton?.removeAllListeners('pointerdown');
    this.pinkSlipButton?.on('pointerdown', () => this.challengePinkSlips());

    this.raceButton?.removeAllListeners('pointerdown');
    this.raceButton?.on('pointerdown', () => this.startSelectedRace());

    this.mapButton?.setInteractive({ useHandCursor: true });

    this.modeButtons?.forEach(item => {
      if (item.key === 'COMPETITION' && !item.locked) {
        item.box.removeAllListeners('pointerdown');
        item.box.setInteractive({ useHandCursor: true });
        item.box.on('pointerdown', () => this.showCompetitionPopup());
      }
    });
  }

  showSpecialChallenger(challenger, animate = true) {
    if (!challenger || !this.hasCar) return;

    const physicalRoster =
      this.locationOffers[this.selectedMeetLocation] || this.offers || [];
    const rawSourceSlot = Number(challenger.sourceMeetSlot);
    const sourceSlot = Number.isInteger(rawSourceSlot) && rawSourceSlot >= 0
      ? rawSourceSlot
      : -1;
    const slotOffer = sourceSlot >= 0 ? physicalRoster[sourceSlot] : null;
    const sourceOffer =
      slotOffer?.characterId === challenger.characterId &&
      slotOffer?.carId === challenger.carId
        ? slotOffer
        : physicalRoster.find(offer =>
            offer?.characterId === challenger.characterId &&
            offer?.carId === challenger.carId
          );

    // NPC-instigated pink slips never create a new/random person. The
    // challenger must still be one of the physical rivals at this exact Meet.
    if (!sourceOffer) {
      this.recoverSpecialChallengerView({ clearChallenger: true });
      return;
    }

    const character = characters[sourceOffer.characterId];
    const displayCharacter = this.getRivalDisplayCharacter(sourceOffer.characterId);
    const car = cars[sourceOffer.carId];

    // Validate definitions and textures before clearing the ordinary meet.
    // On slower iPhones a challenger could previously arrive while an asset
    // was still loading, leaving the stage/cards blank after they were removed.
    if (!character || !car) {
      this.recoverSpecialChallengerView({ clearChallenger: true });
      return;
    }
    if (!this.specialChallengerAssetsReady(challenger)) {
      this.prepareSpecialChallengerAssets(challenger, animate);
      return;
    }

    this.specialChallengePreparing = false;
    this.specialChallengeActive = true;
    this.clearCardObjects();
    this.clearStageObjects();
    this.clearSpecialChallengeObjects();
    this.gpsTravelButton?.disableInteractive();

    this.modeButtons?.forEach(item => item.box.disableInteractive());

    try {
    // This driver was already physically present in the Meet roster. Do not
    // animate a second "arrival"; simply focus the existing rival into the
    // pink-slip presentation.
    const carObjects = this.createCarDisplay(
      car,
      640,
      430,
      690,
      48,
      false,
      normalisePaintColor(challenger.paintColor, DEFAULT_PAINT_COLOR)
    );

    carObjects.forEach(obj => {
      obj.setMask(this.stageMask);
      this.specialChallengeObjects.push(obj);
    });

    const contextualVisual = getCharacterVisualForContext(
      sourceOffer.characterId,
      {
        rivalContext: true,
        playerCharacterId: this.registry.get('playerCharacterId') || '',
      }
    ) || character.visual;
    const source = this.textures.get(contextualVisual.spriteKey).getSourceImage();
    const driver = this.add.image(930, 590, contextualVisual.spriteKey)
      .setOrigin(0.5, 1)
      .setDepth(56)
      .setMask(this.stageMask)
      .setAlpha(animate ? 0 : 1);

    // Back the challenger down slightly from the previous pass. This target
    // makes the displayed car read at roughly three-quarters of the character
    // canvas height while preserving the full-body silhouette.
    const specialDriverCanvasHeight = 340;
    driver.setScale(specialDriverCanvasHeight / source.height);

    // Centre a wider contact shadow directly beneath the driver's feet so the
    // character feels planted without the shadow drifting off to one side.
    const driverShadow = this.add.ellipse(
      930,
      588,
      164,
      18,
      0x000000,
      0.52
    ).setOrigin(0.5)
      .setDepth(47.8)
      .setMask(this.stageMask)
      .setAlpha(animate ? 0 : 1);

    this.specialChallengeObjects.push(driverShadow, driver);

    if (animate) {
      this.time.delayedCall(1180, () => {
        this.tweens.add({
          targets: [driverShadow, driver],
          alpha: 1,
          duration: 420,
          ease: 'Sine.easeOut',
        });
      });
    }

    const banner = this.add.text(
      STAGE.x + STAGE.w / 2,
      STAGE.y + 42,
      'SPECIAL CHALLENGER // PINK SLIPS',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '14px',
        color: '#fff7fa',
        backgroundColor: '#651832f2',
        padding: { x: 26, y: 12 },
      }
    ).setOrigin(0.5)
      .setDepth(74)
      .setMask(this.stageMask);
    this.specialChallengeObjects.push(banner);

    // Keep the profile card below the section heading with explicit top/bottom
    // padding. The old card began underneath the heading and the enlarged phone
    // text caused the border, portrait and copy to collide.
    const card = this.add.rectangle(
      CARDS.x + CARDS.w / 2,
      742,
      CARDS.w - 36,
      128,
      0x130b14,
      0.98
    ).setStrokeStyle(3, 0xff5f93, 0.92).setDepth(64);

    const portraitBg = this.add.rectangle(190, 742, 104, 104, 0x15101a, 1)
      .setStrokeStyle(2, 0xff739e, 0.92).setDepth(65);

    const portraitProfile = createCharacterProfile(this, {
      characterId: challenger.characterId,
      pose: 'idle',
      x: 190,
      y: 742,
      frameWidth: 104,
      frameHeight: 104,
      side: 'left',
      depth: 66,
      rivalContext: true,
      playerCharacterId: this.registry.get('playerCharacterId') || '',
    });

    const name = this.add.text(270, 690, String(displayCharacter?.name || character.name).toUpperCase(), {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#ffffff'
    }).setDepth(66);

    const details = this.add.text(
      270,
      726,
      car.shortName + '  //  EST. ' + challenger.skillRange +
        '\n“' + challenger.quote + '”',
      {
        fontFamily: BODY_FONT,
        fontSize: '13px',
        color: '#d8cad1',
        lineSpacing: 5,
        wordWrap: { width: CARDS.w - 330 },
      }
    ).setDepth(66);

    this.specialChallengeObjects.push(
      card,
      portraitBg,
      portraitProfile?.image,
      portraitProfile?.maskShape,
      name,
      details
    );

    this.selectedSummary.setText(
      'PINK SLIP CHALLENGE\n' +
      car.shortName + '  •  ' + challenger.raceType + '\n' +
      'EST. ' + challenger.skillRange
    );
    this.rivalOfferText.setText('KEYS');

    this.pinkSlipButton.removeAllListeners('pointerdown');
    this.pinkSlipButton
      .setInteractive({ useHandCursor: true })
      .setFillStyle(0x161b22, 1)
      .setStrokeStyle(2, 0x72818b, 1);
    this.pinkSlipButtonLabel.setText('DECLINE').setColor('#d4dde2');
    this.pinkResponseText
      .setText('Winner takes the other car.')
      .setColor('#ffabc4');
    this.pinkSlipButton.on('pointerdown', () => this.declineSpecialChallenger());

    this.raceButton.removeAllListeners('pointerdown');
    this.raceButton
      .setInteractive({ useHandCursor: true })
      .setFillStyle(0x351522, 1)
      .setStrokeStyle(3, 0xff5f93, 1);
    this.raceButtonLabel.setText('ACCEPT PINKS  >').setColor('#fff4f8');
    this.raceButton.on('pointerdown', () => this.startSpecialChallengerRace());

    this.rivalsTitleText?.setText('SPECIAL CHALLENGER // PINK SLIPS');

    const introDelay = animate ? 1500 : 180;
    this.time.delayedCall(introDelay, () => {
      if (!this.specialChallengeActive) return;
      const live = this.registry.get('specialChallenger');
      if (!live?.active || live.createdAt !== challenger.createdAt) return;

      playMangaCutscene(this, 'specialChallengerIntroduction', {
        historyId: 'specialChallengerIntroduction:' + String(challenger.createdAt || 0),
        characterOverrides: { RIVAL: challenger.characterId },
        variables: {
          RIVAL_NAME: String(displayCharacter?.name || character.name).toUpperCase(),
          RIVAL_SUBTITLE: 'SPECIAL CHALLENGER',
        },
      });
    });
    } catch (error) {
      console.warn('Special challenger render recovered', error);
      this.recoverSpecialChallengerView();
    }
  }

  declineSpecialChallenger() {
    this.registry.set('specialChallenger', null);
    saveSessionState(this.registry);
    this.specialChallengeActive = false;
    this.clearSpecialChallengeObjects();
    this.restoreMeetActionListeners();
    this.rollOffers({ resetTimer: false });
  }

  startSpecialChallengerRace(storyConfirmed = false) {
    const challenger = this.registry.get('specialChallenger');
    if (!challenger?.active || !this.hasCar) return;

    if (!storyConfirmed) {
      const rivalName = String(
        this.getRivalDisplayCharacter(challenger.characterId)?.name || 'RIVAL'
      ).toUpperCase();
      const story = playMangaCutscene(this, 'firstPinkSlipChallenge', {
        characterOverrides: { RIVAL: challenger.characterId },
        variables: { RIVAL_NAME: rivalName },
        onComplete: () => this.startSpecialChallengerRace(true),
      });
      if (story.played) return;
    }

    this.registry.set('selectedOpponentCarId', challenger.carId);
    this.registry.set('selectedOpponentPaintColor', normalisePaintColor(
      challenger.paintColor,
      DEFAULT_PAINT_COLOR
    ));
    this.registry.set('selectedOpponentCharacterId', challenger.characterId);
    this.registry.set('selectedOpponentEncounterRating', challenger.encounterRating);
    this.registry.set('selectedOpponentEncounterAi', challenger.encounterAi);
    this.registry.set('selectedOpponentBuildRating', Number(challenger.opponentBuildRating || 1));
    this.registry.set('selectedOpponentBuildArchetype', challenger.opponentBuildArchetype || null);
    this.registry.set('selectedOpponentBuildState', challenger.opponentBuildState || null);
    this.registry.set('selectedOpponentDifficulty', challenger.difficulty);
    this.registry.set('selectedOpponentBuildRating', null);
    this.registry.set('selectedOpponentBuildArchetype', null);
    this.registry.set('selectedOpponentBuildState', null);
    this.registry.set('selectedRaceCategory', 'SINGLE');
    this.registry.set('selectedRaceType', challenger.raceType);
    this.registry.set('selectedRaceDistanceM', 0);
    this.registry.set('selectedRaceDeal', 'PINK_SLIP');
    this.registry.set('selectedRaceStake', 0);
    this.registry.set('selectedRaceSpecialChallenge', true);
    this.registry.set('selectedRaceMeetOffer', {
      ...challenger,
      raceDeal: 'PINK_SLIP',
      stake: 0,
      distance: '1/4 mile',
      meetLocation: this.selectedMeetLocation,
      slotIndex: Math.min(2, Math.max(0, (this.locationOffers[this.selectedMeetLocation] || []).length - 1)),
    });
    this.registry.set('raceReturnScene', 'MeetScene');

    const location = getMeetLocation(this.selectedMeetLocation);
    this.registry.set('raceTimeOfDay', getStoryWorldPhase(this.registry));
    this.registry.set('raceDistrict', location.district);
    this.registry.set('raceLocationLabel', location.label);
    saveSessionState(this.registry);

    this.scene.start('RaceScene');
  }

  getCompetitionOfferLifetimeMs() {
    return this.registry.get('devMode')
      ? 15 * 60 * 1000
      : 3 * 60 * 60 * 1000;
  }

  getCompetitionCooldownMs() {
    return 30 * 60 * 1000;
  }

  getCompetitionCooldownRemainingMs() {
    return Math.max(
      0,
      Number(this.registry.get('competitionCooldownUntil') || 0) - Date.now()
    );
  }

  formatCompetitionCooldown(ms = 0) {
    const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
    return totalMinutes + 'M';
  }

  updateCompetitionCooldownButton() {
    const item = this.modeButtons?.find(button => button.key === 'COMPETITION');
    if (!item) return;

    const wins = Number(this.registry.get('wins') || 0);
    const remaining = this.getCompetitionCooldownRemainingMs();
    const crewTestDrive = this.isCrewTestDriveMode();
    const unlocked = this.hasCar && !crewTestDrive &&
      wins >= 1 && remaining <= 0;

    item.locked = !unlocked;
    item.label.setText(
      crewTestDrive
        ? 'CREW TEST // SINGLE + PINKS'
        : wins < 1
          ? 'SHOWDOWN // WIN 1 RACE'
          : remaining > 0
            ? 'COOLDOWN // ' + this.formatCompetitionCooldown(remaining)
            : 'STREET SHOWDOWN'
    );

    item.box.removeAllListeners('pointerdown');
    if (unlocked) {
      item.box.setInteractive({ useHandCursor: true });
      item.box.on('pointerdown', () => this.showCompetitionPopup());
    } else {
      item.box.disableInteractive();
    }

    this.updateModeButtons();
  }

  chooseCompetitionCharacter(rating = 3, exclude = []) {
    const playerId = this.getActiveDriverCharacterId();
    const blocked = new Set([
      playerId, ...exclude, ...getRecruitedCrewCharacterIds(this.registry),
    ]);
    const location = getMeetLocation(this.selectedMeetLocation);
    const target = Phaser.Math.Clamp(Math.round(Number(rating) || 3), 1, 5);

    // A Street Showdown is hosted by THIS region. Recruited teammates,
    // locked regional leaders and the active driver cannot reappear as rivals.
    // Ordinary single-race Meet opponents are intentionally NOT excluded:
    // someone can compete in two different events on the same evening.
    const regional = getRivalCharacterOrderForRegion(location.district)
      .filter(id =>
        !blocked.has(id) &&
        characters[id]?.rivalEligible !== false &&
        Boolean(characters[id]) &&
        isMainRivalAvailableAtRegionalMeet(this.registry, id, location.district)
      );
    if (!regional.length) return null;

    const closestDistance = Math.min(...regional.map(id =>
      Math.abs(Number(characters[id]?.skill?.rating || 3) - target)
    ));
    const closest = regional.filter(id =>
      Math.abs(Number(characters[id]?.skill?.rating || 3) - target) === closestDistance
    );
    return Phaser.Utils.Array.GetRandom(closest.length ? closest : regional);
  }

  isCompetitionOfferRosterValid(offer) {
    return isStreetShowdownOfferRosterValid(offer, {
      source: this.registry,
      activeDriverCharacterId: this.getActiveDriverCharacterId(),
      playerCharacterId: this.registry.get('playerCharacterId') || '',
    });
  }

  getCompetitionRefreshToken() {
    return Number(this.registry.get('meetRefreshAt') || this.nextRefreshAt || 0);
  }

  generateCompetitionOffer() {
    const location = getMeetLocation(this.selectedMeetLocation);
    const profile = getEncounterProfile(this.selectedMeetLocation, location.difficulty);
    const difficulty = profile.difficulty || 'MED';

    const settings = {
      EASY: { entryFee: STREET_SHOWDOWN_CASH_ENTRY_FEES.EASY, cashPrize: 20000 },
      MED: { entryFee: STREET_SHOWDOWN_CASH_ENTRY_FEES.MED, cashPrize: 32000 },
      HARD: { entryFee: STREET_SHOWDOWN_CASH_ENTRY_FEES.HARD, cashPrize: 48000 },
      ELITE: { entryFee: STREET_SHOWDOWN_CASH_ENTRY_FEES.ELITE, cashPrize: 70000 },
    }[difficulty] || { entryFee: STREET_SHOWDOWN_CASH_ENTRY_FEES.MED, cashPrize: 32000 };

    const owned = this.registry.get('ownedCarIds') || [];
    const playerCarId = this.registry.get('selectedCarId');
    const playerState = (this.registry.get('carStates') || {})[playerCarId] || {};
    const playerDifficulty = this.registry.get('playerDifficulty') || 'STANDARD';
    const refreshToken = this.getCompetitionRefreshToken();
    const preferCouponPrize =
      Phaser.Math.FloatBetween(0, 1) < (owned.length <= 1 ? 0.48 : 0.36);

    const usedCharacters = [];
    const raceTypes = Array.from({ length: 3 }, () =>
      chooseWeightedRaceType(
        PROGRESSION_BALANCE.meetMatchmaking.raceTypeChances?.competitionRolling ?? 0.20
      )
    );
    const garageTier = Math.max(0, Math.min(2, Number(this.registry.get('garageTier') || 0)));
    const wins = Math.max(0, Number(this.registry.get('wins') || 0));
    const generatePrizeRounds = prizeType => createStreetShowdownRounds({
      garageTier, wins, playerCarId, playerState, playerDifficulty, raceTypes,
      prizeType, baseCashPrize: settings.cashPrize,
      seed: ['street-showdown', this.selectedMeetLocation, refreshToken, playerCarId].join(':'),
    });
    let prizeType = preferCouponPrize ? 'COUPON' : 'CASH';
    let physicalRounds = generatePrizeRounds(prizeType);
    if (physicalRounds.length !== 3) return null;
    let prizeCarId = prizeType === 'COUPON' ? physicalRounds[2]?.carId : null;

    // Not every candidate car issues coupons. Never sell a coupon-strength
    // showdown for a cash prize merely because its chosen final car cannot
    // award coupons; instead build a real cash-strength event.
    if (prizeType === 'COUPON' && !(prizeCarId && getCarCouponRequirement(prizeCarId) > 0)) {
      prizeType = 'CASH';
      prizeCarId = null;
      physicalRounds = generatePrizeRounds('CASH');
      if (physicalRounds.length !== 3) return null;
    }

    const rounds = physicalRounds.map(physical => {
      const rating = physical.encounterRating;
      const characterId = this.chooseCompetitionCharacter(rating, usedCharacters);
      if (characterId) usedCharacters.push(characterId);
      return {
        ...physical,
        characterId,
        paintColor: selectMixedCarPaint(physical.carId, {
          region: location.district, characterId,
          isMainRival: Boolean(characters[characterId]?.mainRival),
          seed: refreshToken + ':showdown:' + physical.carId + ':' + usedCharacters.length,
        })?.color ?? getFactoryPaintColor(physical.carId, 0) ??
          Phaser.Utils.Array.GetRandom(RIVAL_PAINT_COLORS),
        encounterAi: getEncounterAi(rating),
        skillLabel: getEncounterSkillLabel(rating),
      };
    });

    // Never save a three-heat invitation that lacks three eligible identities.
    if (rounds.some(round => !round.characterId) ||
        new Set(rounds.map(round => round.characterId)).size !== 3) return null;

    const rollingRoundCount = rounds.filter(round => round.raceType === 'Roll Race').length;
    const rollingPrizeBonusPerRound = Number(
      PROGRESSION_BALANCE.meetMatchmaking.competitionRollingPrizeBonusPerRound ?? 0.10
    );
    const adjustedCashPrize = Phaser.Math.Snap.To(
      Math.round(settings.cashPrize * (1 + rollingRoundCount * rollingPrizeBonusPerRound)),
      500
    );

    let entryFee = settings.entryFee;
    if (prizeType === 'COUPON' && prizeCarId) {
      const carValue = Math.max(0, Number(MARKET_BASE_PRICES[prizeCarId] || 0));
      const couponRequirement = Math.max(1, getCarCouponRequirement(prizeCarId));
      entryFee = getStreetShowdownCouponEntryFee(carValue, couponRequirement);
    }

    return {
      id: this.selectedMeetLocation + ':' + String(refreshToken || Date.now()),
      locationId: this.selectedMeetLocation,
      difficulty,
      entryFee,
      prizeType,
      prizeCash: adjustedCashPrize,
      baseCashPrize: settings.cashPrize,
      prizeCarId,
      restriction: null,
      rounds,
      balanceVersion: 'R20261016-fees',
      playerCarId,
      garageTier,
      winsAtGeneration: wins,
      playerDifficulty,
      tuningFingerprint: JSON.stringify(playerState),
      meetRefreshAt: refreshToken,
      refreshAt: refreshToken,
    };
  }

  getCompetitionOffer() {
    const offers = { ...(this.registry.get('competitionOffers') || {}) };
    const current = offers[this.selectedMeetLocation];
    const refreshToken = this.getCompetitionRefreshToken();
    const refreshChanged = Number(current?.meetRefreshAt || 0) !== refreshToken;
    const legacyDirectCarPrize = current?.prizeType === 'CAR';
    const expired =
      !current ||
      refreshChanged ||
      legacyDirectCarPrize ||
      Boolean(current?.used) ||
      !this.isCompetitionOfferRosterValid(current) ||
      current?.balanceVersion !== 'R20261016-fees' ||
      current?.playerCarId !== this.registry.get('selectedCarId') ||
      current?.garageTier !== Math.max(0, Math.min(2, Number(this.registry.get('garageTier') || 0))) ||
      current?.winsAtGeneration !== Math.max(0, Number(this.registry.get('wins') || 0)) ||
      current?.playerDifficulty !== (this.registry.get('playerDifficulty') || 'STANDARD') ||
      current?.tuningFingerprint !== JSON.stringify(
        (this.registry.get('carStates') || {})[this.registry.get('selectedCarId')] || {}
      );

    if (expired) {
      offers[this.selectedMeetLocation] = this.generateCompetitionOffer();
      this.registry.set('competitionOffers', offers);
      saveSessionState(this.registry);
    }

    return offers[this.selectedMeetLocation];
  }

  showCompetitionPopup(storyConfirmed = false) {
    if (this.isCrewTestDriveMode() || this.specialChallengeActive ||
        !this.hasCar || this.competitionLoading || this.competitionPopup?.active ||
        this.getCompetitionCooldownRemainingMs() > 0) return;

    // Keep the authored first-visit invitation, then show the redesigned
    // full-screen Skytree-style roster instead of the old box popup.
    if (!storyConfirmed) {
      const story = playMangaCutscene(this, 'competitionIntroduction', {
        characterOverrides: { PROMOTER: 'tetsuyaKanda' },
        variables: { PROMOTER_NAME: 'TETSUYA KANDA' },
        onComplete: () => this.showCompetitionPopup(true),
      });
      if (story.played) return;
    }
    if (Number(this.registry.get('wins') || 0) < 1 ||
        sceneCutsceneActive(this)) return;

    const offer = this.getCompetitionOffer();
    if (!offer || !this.isCompetitionOfferRosterValid(offer)) return;

    // Skytree preloads its opponents before drawing the screen. Do the same
    // here for ALL three cards and side-profile cars so previews never flash
    // missing texture errors, even on iPads and older saved Meet profiles.
    const present = () => {
      this.competitionLoading = false;
      if (!this.sys.isActive() || this.competitionPopup?.active ||
          this.specialChallengeActive) return;
      const current = this.getCompetitionOffer();
      if (!current || !this.isCompetitionOfferRosterValid(current)) return;
      if (current.id !== offer.id) {
        // The player changed car or the Meet refreshed during asset loading.
        this.showCompetitionPopup(true);
        return;
      }

      recordCarMagazineSightings(
        this.registry,
        current.rounds.map(round => ({ carId: round.carId, source: 'competition' })),
        'competition'
      );

      this.competitionPopup = showStreetShowdownView(this, {
        offer: current,
        location: getMeetLocation(this.selectedMeetLocation),
        onClose: () => { this.competitionPopup = null; },
        onEnter: selected => {
          // The preview is not a transaction. Revalidate once at acceptance,
          // and preserve the existing one-fee, three-heat race settlement.
          const latest = this.getCompetitionOffer();
          if (!latest || latest.id !== selected.id ||
              !this.isCompetitionOfferRosterValid(latest)) {
            this.showCompetitionPopup(true);
            return;
          }
          this.startCompetition(latest);
        },
      });
    };

    // A Meet invitation can be scheduled while artwork loads. Block that
    // automatic story handoff AND repeated Showdown taps until this view is
    // ready, so manga overlays never cover the Showdown ENTER button.
    this.competitionLoading = true;
    if (this.ensureMeetRosterAssets(
      offer.rounds, this.selectedMeetLocation, 'LOADING SHOWDOWN', present
    )) return;
    present();
  }

  configureCompetitionRound(state, index) {
    const round = state.rounds[index];
    if (!round) return false;

    this.registry.set('selectedCarId', state.playerCarId);
    this.registry.set('selectedOpponentCarId', round.carId);
    this.registry.set('selectedOpponentPaintColor', normalisePaintColor(
      round.paintColor,
      DEFAULT_PAINT_COLOR
    ));
    this.registry.set('selectedOpponentCharacterId', round.characterId);
    this.registry.set('selectedOpponentEncounterRating', round.encounterRating);
    this.registry.set('selectedOpponentEncounterAi', round.encounterAi);
    this.registry.set('selectedOpponentDifficulty', state.difficulty);
    this.registry.set('selectedOpponentBuildRating', round.opponentBuildRating || null);
    this.registry.set('selectedOpponentBuildArchetype', round.opponentBuildArchetype || null);
    this.registry.set('selectedOpponentBuildState', round.opponentBuildState || null);
    this.registry.set('selectedRaceCategory', 'COMPETITION');
    this.registry.set('selectedRaceType', round.raceType);
    this.registry.set('selectedRaceDistanceM', 0);
    this.registry.set('selectedRaceDeal', 'COMPETITION');
    this.registry.set('selectedRaceStake', 0);
    this.registry.set('selectedRaceSpecialChallenge', false);
    this.registry.set('selectedRaceMeetOffer', null);

    const location = getMeetLocation(state.locationId);
    this.registry.set('raceTimeOfDay', getStoryWorldPhase(this.registry));
    this.registry.set('raceDistrict', location.district);
    this.registry.set('raceLocationLabel', location.label);
    return true;
  }

  startCompetition(offer) {
    if (!offer || !this.hasCar) return;
    // Curated Ginza collector loans may enter every regional Street Showdown
    // irrespective of the usual showroom-era/drivetrain restrictions.
    if (!isGinzaLoanActive(this.registry) &&
        !carMatchesCompetitionRestriction(this.registry.get('selectedCarId'), offer.restriction)) return;

    const cash = Number(this.registry.get('cash') || 0);
    if (cash < offer.entryFee) return;

    const state = {
      active: true,
      locationId: offer.locationId,
      difficulty: offer.difficulty,
      playerCarId: this.registry.get('selectedCarId'),
      entryFee: offer.entryFee,
      prizeType: offer.prizeType,
      prizeCash: offer.prizeCash,
      baseCashPrize: offer.baseCashPrize || 0,
      prizeCarId: offer.prizeCarId,
      restriction: offer.restriction || null,
      rounds: offer.rounds,
      roundIndex: 0,
    };

    const competitionOffers = { ...(this.registry.get('competitionOffers') || {}) };
    delete competitionOffers[offer.locationId];

    this.registry.set('cash', cash - offer.entryFee);
    this.registry.set('competitionOffers', competitionOffers);
    this.registry.set(
      'competitionCooldownUntil',
      Date.now() + this.getCompetitionCooldownMs()
    );
    this.registry.set('competitionState', state);
    this.registry.set('raceReturnScene', 'MeetScene');
    this.cashText?.setText('¥ ' + Number(cash - offer.entryFee).toLocaleString('en-US'));

    if (!this.configureCompetitionRound(state, 0)) return;
    saveSessionState(this.registry);
    this.scene.start('RaceScene');
  }

  refreshAllLocationOffers({ resetTimer = true, persist = true } = {}) {
    this.locationOffers = {};
    this.locationSelectedOfferIndex = {};
    this.registry.set('defeatedRivalKeys', []);
    // This is the one authoritative point at which completed-race overlays are
    // retired. Until a real Meet refresh occurs, returning from a race must
    // preserve the exact rival/result in its original physical slot.
    this.registry.set('meetRaceResults', {});

    ALL_MEET_LOCATION_IDS.forEach(locationId => {
      this.locationOffers[locationId] = this.generateOffersForLocation(locationId);
      this.locationSelectedOfferIndex[locationId] = 0;
    });

    if (resetTimer) this.nextRefreshAt = Date.now() + MEET_REFRESH_INTERVAL_MS;
    if (persist) this.persistMeetRound();
  }

  persistMeetRound() {
    const cleanRosters = {};

    ALL_MEET_LOCATION_IDS.forEach(locationId => {
      cleanRosters[locationId] = this.applyMeetRaceResults(
        locationId,
        this.locationOffers[locationId] || []
      ).map(offer => {
        const {
          card,
          ...plainOffer
        } = offer;
        return { ...plainOffer };
      });
    });

    const visibleSightings = (cleanRosters[this.selectedMeetLocation] || [])
      .map(offer => ({
        carId: offer.displayCarId || offer.carId,
        source: 'street',
      }))
      .filter(item => item.carId);
    recordCarMagazineSightings(this.registry, visibleSightings, 'street');

    this.registry.set('meetRosters', cleanRosters);
    this.registry.set('meetRefreshAt', this.nextRefreshAt);
    saveSessionState(this.registry);
  }

  queueMeetRosterAssets(offers = [], locationId = this.selectedMeetLocation) {
    let queued = 0;
    const carIds = new Set();
    const queuedImageKeys = new Set();
    const queueImage = (key, path) => {
      if (
        !key ||
        !path ||
        this.textures.exists(key) ||
        queuedImageKeys.has(key)
      ) return;
      queuedImageKeys.add(key);
      this.load.image(key, path);
      queued += 1;
    };

    const location = getMeetLocation(locationId);
    const phaseBackground = getMeetBackgroundForPhase(
      location.id,
      this.worldPhase || getStoryWorldPhase(this.registry)
    );
    if (phaseBackground?.path) {
      queueImage(phaseBackground.key, phaseBackground.path + '?v=20261022-r645');
    }

    // Keep the authored legacy texture as a fail-safe without changing the
    // existing cover-scale, stage mask, or foreground perspective.
    const fallbackBackground = meetBackgrounds.find(bg => bg.key === location.bgKey);
    if (fallbackBackground?.path) {
      queueImage(fallbackBackground.key, fallbackBackground.path + '?v=20260928-r245');
    }

    const region = String(getMeetLocation(locationId)?.district || '').toUpperCase();
    const inviteCharacterId = String(
      getCrewInviteInterest(this.registry, region)?.characterId ||
      getCrewRecruitChallenge(this.registry, region)?.characterId ||
      ''
    );

    (offers || []).forEach(offer => {
      const visual = getCharacterVisualForContext(
        offer?.characterId,
        {
          rivalContext: true,
          playerCharacterId: this.registry.get('playerCharacterId') || '',
        }
      ) || {};
      queueImage(visual.spriteKey, getCharacterAssetUrl(visual.path));

      if (String(offer?.characterId || '') === inviteCharacterId) {
        queueImage(
          visual.winSpriteKey,
          visual.winPath ? getCharacterAssetUrl(visual.winPath) : null
        );
        queueImage(
          visual.lossSpriteKey,
          visual.lossPath ? getCharacterAssetUrl(visual.lossPath) : null
        );
      }

      if (offer?.resultState) {
        const won = offer.resultState === 'PLAYER_LOSS';
        const poseKey = won ? visual.winSpriteKey : visual.lossSpriteKey;
        const posePath = won ? visual.winPath : visual.lossPath;
        queueImage(poseKey, posePath ? posePath + '?v=20260923-r145' : null);
      }

      const displayCarId = offer?.pinkSlipResult === 'PLAYER_LOSS'
        ? (offer.displayCarId || offer.carId)
        : offer?.carId;
      if (displayCarId && cars[displayCarId]) carIds.add(displayCarId);
    });

    // A queued recruit may not occupy one of the three visible Meet slots.
    // Load their portrait and signature car anyway before the manga invitation.
    if (inviteCharacterId) {
      const visual = getCharacterVisualForContext(inviteCharacterId, {
        rivalContext: true,
        playerCharacterId: this.registry.get('playerCharacterId') || '',
      }) || {};
      queueImage(visual.spriteKey, getCharacterAssetUrl(visual.path));
      queueImage(visual.winSpriteKey, visual.winPath
        ? getCharacterAssetUrl(visual.winPath) : null);
      queueImage(visual.lossSpriteKey, visual.lossPath
        ? getCharacterAssetUrl(visual.lossPath) : null);
      const recruit = getCrewInviteInterest(this.registry, region) ||
        getCrewRecruitChallenge(this.registry, region);
      if (cars[recruit?.baseCarId]) carIds.add(recruit.baseCarId);
    }

    carIds.forEach(id => {
      queued += preloadCarAppearanceAssets(this, { [id]: cars[id] }, '20260928-r242');
      queued += preloadCarWheel(this, cars[id]);
    });

    return { queued, carIds: [...carIds] };
  }

  ensureMeetRosterAssets(
    offers,
    locationId,
    label = 'LOADING RACERS',
    onReady = null
  ) {
    const batch = this.queueMeetRosterAssets(offers, locationId);
    const finish = () => {
      ensureDerivedModularCarTextures(
        this,
        Object.fromEntries(
          batch.carIds.filter(id => cars[id]).map(id => [id, cars[id]])
        )
      );
      onReady?.();
    };

    if (batch.queued <= 0) {
      ensureDerivedModularCarTextures(
        this,
        Object.fromEntries(
          batch.carIds.filter(id => cars[id]).map(id => [id, cars[id]])
        )
      );
      return false;
    }

    startSceneLoading(this, label, batch.queued);
    this.load.once('complete', () => {
      finish();
      finishSceneLoading('READY');
    });
    if (!this.load.isLoading()) this.load.start();
    return true;
  }

  generateOffersForLocation(locationId) {
    const location = getMeetLocation(locationId);
    const profile = getEncounterProfile(locationId, location.difficulty);

    const recruitedIds = getRecruitedCrewCharacterIds(this.registry);
    const regionalPool = getRivalCharacterOrderForRegion(location.district)
      .filter(id =>
        !recruitedIds.has(id) &&
        isMainRivalAvailableAtRegionalMeet(
          this.registry,
          id,
          location.district
        )
      );
    const regionalTeam = hasRegionalTeam(location.district);
    const configuredOrder =
      REGION_LOCATION_RIVAL_ROTATION[location.district]?.[locationId]
      || regionalPool;

    // Preserve authored regional character rotation. Region affects who and
    // what tends to appear, but never replaces current-car performance matching.
    const refreshBasis = Number(this.nextRefreshAt || Date.now());
    const cycle = Math.floor(refreshBasis / MEET_REFRESH_INTERVAL_MS);
    const locationOffset = Math.max(0, ALL_MEET_LOCATION_IDS.indexOf(locationId));
    const shift = configuredOrder.length
      ? (cycle + locationOffset) % configuredOrder.length
      : 0;
    const rotatedOrder = configuredOrder.length
      ? configuredOrder.slice(shift).concat(configuredOrder.slice(0, shift))
      : [];

    const eligible = [...new Set(
      [...rotatedOrder, ...regionalPool].filter(id =>
        !recruitedIds.has(id) &&
        isMainRivalAvailableAtRegionalMeet(
          this.registry,
          id,
          location.district
        ) &&
        characters[id]
      )
    )];

    const availableCharacters = [...eligible];
    if (!regionalTeam) Phaser.Utils.Array.Shuffle(availableCharacters);

    const ownedCars = this.registry.get('ownedCarIds') || [];
    const selectedCarId = this.registry.get('selectedCarId') || 'ae86';
    const selectedState = (this.registry.get('carStates') || {})[selectedCarId] || {};
    const usedRivalCars = new Set();

    const chooseCharacterForRating = rating => {
      if (regionalTeam) {
        return availableCharacters.shift() || Phaser.Utils.Array.GetRandom(eligible);
      }

      const sorted = [...availableCharacters].sort((a, b) => {
        const ar = Number(characters[a]?.skill?.rating || 3);
        const br = Number(characters[b]?.skill?.rating || 3);
        return Math.abs(ar - rating) - Math.abs(br - rating);
      });

      const id = sorted[0] || Phaser.Utils.Array.GetRandom(eligible);
      const index = availableCharacters.indexOf(id);
      if (index >= 0) availableCharacters.splice(index, 1);
      return id;
    };

    const cfg = MODE_DATA[this.selectedMode];
    const paintPool = [...RIVAL_PAINT_COLORS];
    Phaser.Utils.Array.Shuffle(paintPool);
    const configuredOfferCount = Math.max(
      1,
      Number(PROGRESSION_BALANCE.meetMatchmaking.offerCount || 3)
    );
    // Never duplicate a person to fill a Meet. In the unlikely event a region
    // has fewer eligible drivers than configured slots, show fewer cards.
    const offerCount = Math.min(
      configuredOfferCount,
      Math.max(1, eligible.length)
    );

    // The location owns driver difficulty. Use its authored three rating slots
    // as the Meet population (shuffled only to avoid a fixed card order).
    const locationDriverRatings = Array.isArray(profile.ratingSlots) && profile.ratingSlots.length
      ? [...profile.ratingSlots]
      : [2, 3, 3];
    Phaser.Utils.Array.Shuffle(locationDriverRatings);

    return Array.from({ length: offerCount }, (_, slotIndex) => {
      // Race context is chosen before vehicle matching because standing and
      // rolling performance are deliberately evaluated differently.
      const raceType = chooseWeightedRaceType(
        PROGRESSION_BALANCE.meetMatchmaking.raceTypeChances?.meetRolling ?? 0.20
      );
      const distance = raceType === 'Roll Race'
        ? '1/2 mile'
        : Phaser.Utils.Array.GetRandom(cfg.distances);

      // DRIVER skill is independent from vehicle/build performance, but it is
      // not global: the current location's authored population supplies it.
      const locationEncounterRating = Number(
        locationDriverRatings[slotIndex % locationDriverRatings.length] || 3
      );
      const characterId = chooseCharacterForRating(locationEncounterRating);
      const character = characters[characterId];
      const displayCharacter = this.getRivalDisplayCharacter(characterId);
      const mainRivalProgression = getMainRivalProgression(
        this.registry,
        characterId
      );
      const encounterRating = Number(
        mainRivalProgression?.encounterRating || locationEncounterRating
      );

      const match = createMeetOpponentMatch({
        playerCarId: selectedCarId,
        playerState: selectedState,
        ownedCarIds: ownedCars,
        usedCarIds: [...usedRivalCars],
        preferredCars: profile.likelyCars,
        requiredCarId: getRegionalRivalSignatureCarId(location.district, characterId),
        raceType,
        difficulty: profile.difficulty,
        playerDifficulty: this.registry.get('playerDifficulty') || 'STANDARD',
        locationId,
        refreshSeed: refreshBasis,
        slotIndex,
      });

      if (!match) {
        throw new Error('Unable to generate a physical Meet opponent for ' + selectedCarId);
      }

      const carId = match.carId;
      usedRivalCars.add(carId);
      const encounterAi = mainRivalProgression?.encounterAi || getEncounterAi(encounterRating);
      const skillLabel = getEncounterSkillLabel(encounterRating);

      let raceDeal = 'PRIZE';
      let stake = Phaser.Math.Snap.To(
        Math.round(profile.stakeRange[1] * 1.8),
        500
      );

      if (this.selectedMode === 'SINGLE') {
        raceDeal = 'BET';
        const minBet = Math.max(500, Number(profile.stakeRange?.[0] || 1000));
        const maxBet = Math.max(minBet, Number(profile.stakeRange?.[1] || minBet));
        stake = Phaser.Math.Snap.To(
          Phaser.Math.Between(minBet, maxBet),
          500
        );

        if (raceType === 'Roll Race') {
          const rollMultiplier = Number(
            PROGRESSION_BALANCE.meetMatchmaking.rollingCashStakeMultiplier ?? 1.30
          );
          stake = Phaser.Math.Snap.To(Math.round(stake * rollMultiplier), 500);
        }
      }

      const pinkDecision = this.evaluatePinkSlipAcceptance(character, carId, {
        encounterRating,
        encounterAi,
        opponentBuildRating: match.buildRating,
        opponentBuildState: match.buildState,
        raceType,
        difficulty: profile.difficulty,
        pinkAcceptanceBase: profile.pinkAcceptanceBase,
      });

      return {
        characterId,
        carId,
        raceType,
        raceDeal,
        stake,
        distance,
        quote: getMeetCharacterQuote(displayCharacter?.id || characterId, 'ready', displayCharacter?.introQuote || character.introQuote),

        // Driver ability.
        encounterRating,
        encounterAi,
        skillLabel,
        driverSkillSource: mainRivalProgression ? 'MAIN_RIVAL' : 'LOCATION',
        mainRivalTier: mainRivalProgression?.tierLabel || null,

        // R409 migrates saved rosters so conquered leaders leave regional Meets
        // and selectable-avatar rivals can safely return using substitute art.
        matchmakingVersion: MEET_ROSTER_VERSION,
        vehicleDifficultyProfile: profile.difficulty,
        allowedBuildRatings: match.allowedBuildRatings,
        buildCeiling: match.buildCeiling,

        // Vehicle development: intentionally independent from driver ability.
        opponentBuildRating: match.buildRating,
        opponentBuildArchetype: match.buildArchetype,
        opponentBuildState: match.buildState,
        performanceBand: match.performanceBand,
        performanceRatio: match.ratio,
        playerPerformanceIndex: match.playerPerformanceIndex,
        opponentPerformanceIndex: match.opponentPerformanceIndex,

        difficulty: mainRivalProgression?.difficulty || profile.difficulty,
        pinkAccepted: pinkDecision.accepted,
        pinkAcceptanceChance: pinkDecision.chance,
        pinkReply: pinkDecision.reply,
        pinkChallenged: false,
        // Incoming pinks are rolled only when the player actually chooses a
        // normal race. Keeping this false at roster generation prevents rivals
        // created during the global cooldown from banking a future offer.
        incomingPinkChallenge: false,
        incomingPinkPrompted: false,
        paintColor: selectMixedCarPaint(carId, {
          region: location.district, characterId,
          isMainRival: Boolean(characters[characterId]?.mainRival),
          seed: Phaser.Math.Between(0, 2147483647),
        })?.color ?? getFactoryPaintColor(carId, 0) ??
          paintPool.shift() ?? Phaser.Utils.Array.GetRandom(RIVAL_PAINT_COLORS),
        meetLocation: locationId,
        locked: false,
        resultState: null,
        pinkSlipResult: null,
      };
    });
  }

  meetRosterHasDuplicatePeople(offers = []) {
    const characterIds = new Set();
    const visualIds = new Set();

    for (const offer of offers || []) {
      const characterId = String(offer?.characterId || '');
      const visual = getCharacterVisualForContext(
        characterId,
        {
          rivalContext: true,
          playerCharacterId: this.registry.get('playerCharacterId') || '',
        }
      ) || {};
      const visualId = String(visual.spriteKey || visual.path || '');

      if (!characterId) return true;
      if (characterIds.has(characterId)) return true;
      if (visualId && visualIds.has(visualId)) return true;

      characterIds.add(characterId);
      if (visualId) visualIds.add(visualId);
    }

    return false;
  }

  rollOffers({ resetTimer = true, force = false } = {}) {
    if (!force && (this.specialChallengeActive || this.specialChallengePreparing)) {
      return;
    }

    this.clearCardObjects();
    this.clearStageObjects();

    const location = getMeetLocation(this.selectedMeetLocation);
    let visibleOffers = this.locationOffers[this.selectedMeetLocation]
      || this.generateOffersForLocation(this.selectedMeetLocation);

    // Rendering is the final authority: even if an old save or an interrupted
    // refresh somehow leaves duplicate people in a roster, never put the same
    // character (or the same visual identity) on one Meet screen twice.
    if (visibleOffers.some(offer => getRecruitedCrewCharacterIds(this.registry).has(offer?.characterId)) ||
        this.meetRosterHasDuplicatePeople(visibleOffers)) {
      visibleOffers = this.generateOffersForLocation(this.selectedMeetLocation);
      this.locationOffers[this.selectedMeetLocation] = visibleOffers;
      this.locationSelectedOfferIndex[this.selectedMeetLocation] = 0;
      this.persistMeetRound();
    }

    this.offers = visibleOffers;
    this.locationOffers[this.selectedMeetLocation] = this.offers;

    this.selectedOfferIndex = Phaser.Math.Clamp(
      Number(this.locationSelectedOfferIndex[this.selectedMeetLocation] || 0),
      0,
      Math.max(0, this.offers.length - 1)
    );

    const worldPhase = this.worldPhase || getStoryWorldPhase(this.registry);
    const phaseBackground = getMeetBackgroundForPhase(location.id, worldPhase);
    this.setMeetBackground(
      phaseBackground?.key || location.bgKey,
      location.district + ' // ' + location.label + ' // ' +
        worldPhase.toUpperCase() + ' // ' + location.difficulty,
      location.bgKey
    );

    if (resetTimer) {
      this.nextRefreshAt = Date.now() + MEET_REFRESH_INTERVAL_MS;
      this.persistMeetRound();
    }

    this.drawStage();
    this.drawCards();
    this.updateModeButtons();
    this.updateGpsPanel();
    this.rivalsTitleText?.setText('RIVALS');

    if (!this.hasCar) {
      this.applyNoCarMeetState();
      return;
    }

    if (this.offers.length) {
      this.selectOffer(this.selectedOfferIndex);
    } else {
      this.selectedSummary.setText('NO RACERS LEFT\nWAIT FOR THE NEXT ROUND');
      this.rivalOfferText.setText('—');
      this.pinkSlipButton.disableInteractive()
        .setFillStyle(0x11161c, 1)
        .setStrokeStyle(1, 0x46545e, 1);
      this.pinkSlipButtonLabel.setText('NO CHALLENGE').setColor('#72838f');
      this.pinkResponseText.setText('');
      this.raceButton.disableInteractive()
        .setFillStyle(0x11161c, 1)
        .setStrokeStyle(1, 0x46545e, 1);
      this.raceButtonLabel.setColor('#72838f').setText('NO RACERS LEFT');
    }
  }

  getTaxiWorkshopDestination() {
    const ownedCarIds = (this.registry.get('ownedCarIds') || []).filter(id => cars[id]);
    const locations = this.registry.get('carGarageLocations') || {};
    const tier = Number(this.registry.get('garageTier') || 0);
    const unlocked = getUnlockedWorkshops(tier);
    const activeId = this.registry.get('workshopLocationId') || 'shinonomeWorkshop';

    // Prefer the currently active garage when it still contains another car.
    if (
      isWorkshopUnlocked(activeId, tier) &&
      getCarsInWorkshop(ownedCarIds, locations, activeId).length > 0
    ) {
      return activeId;
    }

    // Otherwise take the player straight to the first unlocked property where
    // one of their remaining cars is actually stored.
    const withCar = unlocked.find(workshop =>
      getCarsInWorkshop(ownedCarIds, locations, workshop.id).length > 0
    );
    if (withCar) return withCar.id;

    // If no cars remain, still return to a valid home property.
    return isWorkshopUnlocked(activeId, tier)
      ? activeId
      : 'shinonomeWorkshop';
  }

  applyNoCarMeetState() {
    const stranded = Boolean(this.registry.get('meetStranded'));
    this.selectedSummary?.setText(
      stranded
        ? 'CAR LOST\nTAKE A TAXI HOME FOR ANOTHER'
        : 'NO CAR\nYOU CANNOT RACE'
    );
    this.rivalOfferText?.setText('—');

    this.pinkSlipButton?.disableInteractive()
      .setFillStyle(0x11161c, 1)
      .setStrokeStyle(1, 0x46545e, 1);
    this.pinkSlipButtonLabel?.setText('NO CAR').setColor('#72838f');
    this.pinkResponseText?.setText(
      stranded
        ? 'Your car was taken. Pay for a taxi below to get back to your garage.'
        : 'Your last car is gone.'
    );

    const taxiCost = TAXI_TO_WORKSHOP_COST;
    const cash = Number(this.registry.get('cash') || 0);
    const canAffordTaxi = cash >= taxiCost;
    const taxiDestinationId = this.getTaxiWorkshopDestination();

    this.raceButton?.removeAllListeners('pointerdown');

    if (canAffordTaxi) {
      this.raceButton
        ?.setInteractive({ useHandCursor: true })
        .setFillStyle(0x272019, 1)
        .setStrokeStyle(2, 0xffc66d, 1);

      this.raceButtonLabel
        ?.setColor('#ffe0a8')
        .setText('TAXI HOME // ¥' + taxiCost.toLocaleString('en-US'));

      this.raceButton?.on('pointerdown', () => {
        this.returnToWorkshop(taxiDestinationId, taxiCost);
      });
    } else {
      this.raceButton
        ?.disableInteractive()
        .setFillStyle(0x171418, 1)
        .setStrokeStyle(1, 0x5d5141, 1);

      this.raceButtonLabel
        ?.setColor('#9d866e')
        .setText('NEED ¥' + taxiCost.toLocaleString('en-US') + ' FOR TAXI');
    }

    this.modeButtons?.forEach(item => {
      item.box.disableInteractive()
        .setFillStyle(0x0a1017, 1)
        .setStrokeStyle(1, 0x29343d, 1);
      item.label.setColor('#53626c');
    });

    this.rivalsTitleText?.setText('RIVALS');
    this.updateWorkshopButton();
  }

  prefetchDeferredAssets() {
    const queueImage = (key, path) => {
      if (!key || !path || this.textures.exists(key)) return;
      this.load.image(key, path);
    };

    // Warm the opposite phase only after the Meet is interactive, avoiding a
    // doubled initial background load while making later phase flips instant.
    const location = getMeetLocation(this.selectedMeetLocation);
    const oppositePhase = (this.worldPhase || getStoryWorldPhase(this.registry)) === 'day' ? 'night' : 'day';
    const oppositeBackground = getMeetBackgroundForPhase(location.id, oppositePhase);
    if (oppositeBackground?.path) {
      queueImage(oppositeBackground.key, oppositeBackground.path + '?v=20260928-r245');
    }

    // Only prepare result poses for the three racers actually on screen.
    // Loading every win/loss pose in a seven-person regional crew caused a
    // large texture-memory spike immediately after Meet opened.
    (this.offers || []).forEach(offer => {
      const visual = characters[offer?.characterId]?.visual || {};
      queueImage(
        visual.winSpriteKey,
        getCharacterAssetUrl(visual.winPath)
      );
      queueImage(
        visual.lossSpriteKey,
        getCharacterAssetUrl(visual.lossPath)
      );
    });

    // Race controls are small and useful to warm after the Meet is interactive.
    queueImage('hudCluster', 'assets/Ui/hud_cluster.png');
    queueImage('dragTree', 'assets/Ui/drag_tree.png');
    queueImage('clutchPedal', 'assets/Controls/clutch_pedal.png');
    queueImage('throttlePedal', 'assets/Controls/throttle_pedal.png');
    queueImage('nosButton', 'assets/Controls/nos_button.png');
    queueImage('shifterNeutral', 'assets/Controls/shifter_neutral.png');
    queueImage('shifterDown', 'assets/Controls/shifter_down.png');

    if (this.load.list.size > 0 && !this.load.isLoading()) this.load.start();
  }

  clearCardObjects() {
    for (const obj of this.cardObjects) {
      if (obj?.destroy) obj.destroy();
    }
    this.cardObjects = [];
  }

  clearStageObjects() {
    for (const obj of this.stageObjects) {
      if (obj?.destroy) obj.destroy();
    }
    this.stageObjects = [];
  }

  // A private conversation temporarily empties the Meet stage and rival cards.
  // Nothing is removed from the actual roster or saved results.
  setStoryEncounterActive(active) {
    const showing = Boolean(active);
    this._storyEncounterActive = showing;
    [...(this.stageObjects || []), ...(this.cardObjects || [])].forEach(item => {
      if (item?.setVisible && item?.active) item.setVisible(!showing);
    });
    if (this.rivalsTitleText?.active) {
      this.rivalsTitleText.setText(showing ? 'AFTER HOURS // PRIVATE CONVERSATION' : 'RIVALS');
    }
  }

  getOfferCharacterSpriteKey(offer) {
    const character = characters[offer?.characterId];
    const visual = getCharacterVisualForContext(
      offer?.characterId,
      {
        rivalContext: true,
        playerCharacterId: this.registry.get('playerCharacterId') || '',
      }
    ) || character?.visual || {};

    if (offer?.resultState === 'PLAYER_WIN' && visual.lossSpriteKey && this.textures.exists(visual.lossSpriteKey)) {
      return visual.lossSpriteKey;
    }
    const pinkLossCelebration = (this.offers || []).some(
      item => item?.pinkSlipResult === 'PLAYER_LOSS'
    );

    if (
      (offer?.resultState === 'PLAYER_LOSS' || pinkLossCelebration) &&
      visual.winSpriteKey &&
      this.textures.exists(visual.winSpriteKey)
    ) {
      return visual.winSpriteKey;
    }
    return visual.spriteKey;
  }

  getOfferDisplayCar(offer) {
    if (offer?.pinkSlipResult === 'PLAYER_WIN') return null;

    const carId = offer?.pinkSlipResult === 'PLAYER_LOSS'
      ? offer.displayCarId
      : offer?.carId;
    if (!carId || !cars[carId]) return null;

    return {
      carId,
      paintColor: offer?.pinkSlipResult === 'PLAYER_LOSS'
        ? normalisePaintColor(offer.displayPaintColor, DEFAULT_PAINT_COLOR)
        : normalisePaintColor(offer.paintColor, DEFAULT_PAINT_COLOR),
    };
  }

  drawStage() {
    const placements = [
      {
        carX: 225,
        carY: 440,
        carW: 590,
        carDepth: 30,
        carFlipX: false,
        charX: 125,
        charY: 592,
        charH: 300,
        charDepth: 34,
        charFlipX: false,
      },
      {
        carX: 620,
        carY: 394,
        carW: 390,
        carDepth: 14,
        carFlipX: false,
        charX: 535,
        charY: 482,
        charH: 182,
        charDepth: 16,
        charFlipX: true,
      },
      {
        carX: 1110,
        carY: 456,
        carW: 705,
        carDepth: 24,
        carFlipX: true,
        charX: 875,
        charY: 548,
        charH: 248,
        charDepth: 19,
        charFlipX: true,
      },
    ];

    const pinkLossCelebration = this.offers.some(
      offer => offer?.pinkSlipResult === 'PLAYER_LOSS'
    );

    this.offers.forEach((offer, i) => {
      const placement = placements[i];
      const character = characters[offer.characterId];
      const displayCar = this.getOfferDisplayCar(offer);

      if (displayCar) {
        const car = cars[displayCar.carId];
        const carObjects = this.createCarDisplay(
          car,
          placement.carX,
          placement.carY,
          placement.carW,
          placement.carDepth,
          placement.carFlipX,
          displayCar.paintColor
        );
        carObjects.forEach(obj => {
          obj.setMask(this.stageMask);
          if (!this.hasCar && !pinkLossCelebration) obj.setAlpha(0.28);
        });
        this.stageObjects.push(...carObjects);
      }

      const spriteKey = this.getOfferCharacterSpriteKey(offer);
      const sprite = this.add.image(
        placement.charX,
        placement.charY,
        spriteKey
      ).setOrigin(0.5, 1)
        .setDepth(placement.charDepth)
        .setMask(this.stageMask);

      const charSource = this.textures.get(spriteKey).getSourceImage();
      sprite.setScale(placement.charH / charSource.height);
      sprite.setFlipX(placement.charFlipX);
      if (!this.hasCar && !pinkLossCelebration) sprite.setAlpha(0.32);
      this.stageObjects.push(sprite);

      const softShadow = this.add.ellipse(
        placement.charX + 2,
        placement.charY - 12,
        Math.max(60, sprite.displayWidth * 0.78),
        i === 0 ? 30 : 26,
        0x000000,
        0.58
      ).setDepth(placement.charDepth - 0.12)
        .setMask(this.stageMask);

      const contactShadow = this.add.ellipse(
        placement.charX,
        placement.charY - 8,
        Math.max(44, sprite.displayWidth * 0.58),
        i === 0 ? 18 : 15,
        0x000000,
        0.84
      ).setDepth(placement.charDepth - 0.08)
        .setMask(this.stageMask);

      this.stageObjects.push(softShadow, contactShadow);
    });
  }

  drawCards() {
    const xPositions = [215, 593, 971];
    const cardY = 742;
    const cardH = 132;
    const pinkLossCelebration = this.offers.some(
      offer => offer?.pinkSlipResult === 'PLAYER_LOSS'
    );

    this.offers.forEach((offer, i) => {
      const x = xPositions[i];
      const character = this.getRivalDisplayCharacter(offer.characterId)
        || characters[offer.characterId];

      const card = this.add.rectangle(
        x,
        cardY,
        350,
        cardH,
        offer.locked ? 0x111820 : 0x0a1521,
        0.99
      ).setStrokeStyle(2, offer.locked ? 0x56646d : 0x2e4a61, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(34);

      const portraitSize = 104;
      const portraitX = x - 108;
      const portraitY = cardY;

      const portraitBg = this.add.rectangle(
        portraitX,
        portraitY,
        portraitSize,
        portraitSize,
        0x0d1824,
        1
      ).setStrokeStyle(1, 0x315470, 1).setDepth(35);

      const spriteKey = this.getOfferCharacterSpriteKey(offer);
      const pose = offer?.resultState === 'PLAYER_WIN'
        ? 'loss'
        : (offer?.resultState === 'PLAYER_LOSS' || pinkLossCelebration)
          ? 'win'
          : 'idle';
      const portraitProfile = createCharacterProfile(this, {
        characterId: offer.characterId,
        pose,
        x: portraitX,
        y: portraitY,
        frameWidth: portraitSize,
        frameHeight: portraitSize,
        side: 'left',
        depth: 36,
        rivalContext: true,
        playerCharacterId: this.registry.get('playerCharacterId') || '',
      });

      const textX = x - 42;

      const name = this.add.text(textX, cardY - 52, character.name.toUpperCase(), {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: '#ffffff'
      }).setDepth(35);

      const normalCashLoss = offer.resultState === 'PLAYER_LOSS' && !offer.pinkSlipResult;
      // Result states describe the PLAYER; dialogue outcomes describe RIVAL.
      // Resolve again at display time so old saved Meet rosters gain the
      // authored character-bible lines without resetting their race results.
      const quoteText = offer.resultState === 'PLAYER_WIN'
        ? getMeetCharacterQuote(character.id, 'loss',
            character.resultQuotes?.loss || 'You got me.')
        : offer.resultState === 'PLAYER_LOSS'
          ? getMeetCharacterQuote(character.id, 'win',
              character.resultQuotes?.win || 'That run was mine.')
          : getMeetCharacterQuote(character.id, 'ready',
              offer.quote || character.introQuote);

      const quote = this.add.text(textX, cardY - 26, '"' + quoteText + '"', {
        fontFamily: BODY_FONT,
        fontSize: '11px',
        color: offer.locked ? '#8f9da6' : '#9fb4c2',
        wordWrap: { width: 214 },
        lineSpacing: -2,
      }).setDepth(35);

      let statusText = null;
      if (offer.resultState) {
        const status = normalCashLoss
          ? 'You lost the last run'
          : offer.pinkSlipResult === 'PLAYER_WIN'
            ? 'DEFEATED // CAR WON'
            : offer.pinkSlipResult === 'PLAYER_LOSS'
              ? 'WON YOUR CAR'
              : 'DEFEATED';

        statusText = this.add.text(textX, cardY + 34, status, {
          fontFamily: PIXEL_FONT,
          fontSize: '6px',
          color: offer.resultState === 'PLAYER_WIN' ? '#79dff1' : '#ff9ab8',
        }).setDepth(36);
      }

      if (this.hasCar) {
        card.on('pointerdown', () => this.selectOffer(i));
      } else {
        card.disableInteractive();

        // A pink-slip loss is staged as the winner's victory moment: keep the
        // meet crowd, cars and character cards fully visible instead of washing
        // the whole scene out just because the player is temporarily stranded.
        if (!pinkLossCelebration) {
          card.setFillStyle(0x101317, 0.99)
            .setStrokeStyle(1, 0x3b444a, 1);
          portraitBg.setFillStyle(0x111418, 1).setStrokeStyle(1, 0x3b444a, 1);
          portraitProfile?.setAlpha(0.34);
          name.setColor('#68737a');
          quote.setColor('#59636a');
        }
      }

      this.cardObjects.push(
        card,
        portraitBg,
        portraitProfile?.image,
        portraitProfile?.maskShape,
        name,
        quote,
        statusText
      );
      offer.card = card;
    });
  }

  evaluatePinkSlipAcceptance(character, opponentCarId, encounter = {}) {
    if (!isPinkSlipValueEligible(this.registry.get('selectedCarId'), opponentCarId)) {
      return {
        accepted: false,
        chance: 0,
        reply: 'Not risking a car worth that much against yours.',
      };
    }

    const playerCarId = this.registry.get('selectedCarId') || 'ae86';
    const carStates = this.registry.get('carStates') || {};
    const playerState = carStates[playerCarId] || { tuneLevel: 0, nosInstalled: false };
    const raceType = encounter.raceType || 'Standing Start';
    const buildRating = Phaser.Math.Clamp(
      Number(encounter.opponentBuildRating ?? encounter.encounterRating ?? 3), 1, 5
    );
    const opponentState = encounter.opponentBuildState || createRivalBuildState(
      cars[opponentCarId] || {}, buildRating,
      { raceType, seed: 'pink-eval:' + opponentCarId + ':' + buildRating + ':' + raceType }
    );
    const opponentPerformance = getVehiclePerformance(opponentCarId, opponentState, { raceType });
    const playerPerformance = getVehiclePerformance(playerCarId, playerState, { raceType });
    const strengthRatio =
      Number(playerPerformance?.index?.selected || 1) /
      Math.max(1, Number(opponentPerformance?.index?.selected || 1));

    if (strengthRatio >= 1.18) {
      return {
        accepted: false,
        chance: 0,
        reply: 'Cash race only. Your build is in another league.',
      };
    }

    // The shared completed-race roll replaces the old independent acceptance
    // lottery. Clicking again or refreshing does not add a lottery ticket.
    const accepted = encounter.opportunityGranted === true;
    return {
      accepted,
      chance: getPinkSlipOpportunityChance(this.registry),
      reply: Phaser.Utils.Array.GetRandom(accepted
        ? ["All right. Keys for keys.", "You're on. Pink slips.", "Fine. Winner takes the car."]
        : ['No. Cash race only.', 'Not risking the car tonight.', 'Cash is enough.']),
    };
  }

  getPinkSlipRequestInterval() {
    const difficulty = String(
      this.registry.get('playerDifficulty') || 'STANDARD'
    ).toUpperCase();
    if (difficulty === 'EASY') return 0;
    if (difficulty === 'HARD') return 5;
    return 3;
  }

  getPinkSlipRequestCooldownRaces() {
    const interval = this.getPinkSlipRequestInterval();
    if (interval <= 0) return 0;

    const completedRaces =
      Math.max(0, Number(this.registry.get('wins') || 0)) +
      Math.max(0, Number(this.registry.get('losses') || 0));
    const lastRequestRace = Number(
      this.registry.get('pinkSlipLastRequestRace') ?? -999
    );
    return Math.max(
      0,
      interval - Math.max(0, completedRaces - lastRequestRace)
    );
  }

  getIncomingPinkSlipCooldownInterval() {
    const difficulty = String(
      this.registry.get('playerDifficulty') || 'STANDARD'
    ).toUpperCase();
    return difficulty === 'EASY' ? 8 : 15;
  }

  getIncomingPinkSlipCooldownRaces() {
    const completedRaces =
      Math.max(0, Number(this.registry.get('wins') || 0)) +
      Math.max(0, Number(this.registry.get('losses') || 0));
    const lastOfferRace = Number(
      this.registry.get('incomingPinkSlipLastOfferRace') ?? -999
    );
    return Math.max(
      0,
      this.getIncomingPinkSlipCooldownInterval() -
        Math.max(0, completedRaces - lastOfferRace)
    );
  }

  challengePinkSlips() {
    const offer = this.offers[this.selectedOfferIndex];
    if (!offer || offer.pinkChallenged) return;

    if (cars[this.registry.get('selectedCarId')]?.ginzaDemo) return;
    const pinkCooldown = this.getPinkSlipRequestCooldownRaces();
    if (pinkCooldown > 0) {
      this.pinkSlipButton?.disableInteractive();
      this.pinkSlipButtonLabel
        ?.setText(
          'PINKS // ' + pinkCooldown + ' RACE' +
          (pinkCooldown === 1 ? '' : 'S')
        )
        .setColor('#72838f');
      this.pinkResponseText
        ?.setText(
          'Race ' + pinkCooldown + ' more time' +
          (pinkCooldown === 1 ? '' : 's') + ' before asking again.'
        )
        .setColor('#8799a5');
      return;
    }

    const ownedCars = this.registry.get('ownedCarIds') || [];
    const personalCarCount = ownedCars.filter(id => !cars[id]?.crewLoan).length;
    const garageCapacity = getGarageCapacity(this.registry.get('garageTier') || 0);
    const displayCarId = this.getOfferDisplayCar(offer)?.carId || offer.carId;
    if (
      personalCarCount >= garageCapacity &&
      !ownedCars.includes(displayCarId)
    ) {
      this.pinkSlipButton.disableInteractive();
      this.pinkSlipButtonLabel.setText('GARAGE FULL').setColor('#72838f');
      this.pinkResponseText
        .setText('Upgrade your Shinonome workshop before racing for another car.')
        .setColor('#8799a5');
      return;
    }

    const character = characters[offer.characterId];
    const location = getMeetLocation(this.selectedMeetLocation);
    const profile = getEncounterProfile(this.selectedMeetLocation, location.difficulty);
    const opportunityGranted = isPinkSlipValueEligible(
      this.registry.get('selectedCarId'), displayCarId
    ) && rollPinkSlipOpportunity(this.registry);
    const pinkDecision = this.evaluatePinkSlipAcceptance(character, displayCarId, {
      opportunityGranted,
      encounterRating: offer.encounterRating,
      encounterAi: offer.encounterAi,
      opponentBuildRating: offer.opponentBuildRating,
      opponentBuildState: offer.opponentBuildState,
      raceType: offer.raceType,
      difficulty: offer.difficulty || profile.difficulty,
      pinkAcceptanceBase: profile.pinkAcceptanceBase,
    });

    const completedRaces =
      Math.max(0, Number(this.registry.get('wins') || 0)) +
      Math.max(0, Number(this.registry.get('losses') || 0));
    this.registry.set('pinkSlipLastRequestRace', completedRaces);
    if (pinkDecision.accepted && !consumePinkSlipOpportunity(this.registry)) {
      pinkDecision.accepted = false;
    }

    offer.pinkAccepted = pinkDecision.accepted;
    offer.pinkAcceptanceChance = pinkDecision.chance;
    offer.pinkReply = pinkDecision.reply;
    offer.pinkChallenged = true;
    this.persistMeetRound();
    this.pinkSlipButton.disableInteractive();
    this.pinkSlipButtonLabel.setText('THINKING...');
    this.pinkResponseText.setText('They look over both cars...');

    const selectedIndex = this.selectedOfferIndex;
    this.time.delayedCall(420, () => {
      if (!this.offers[selectedIndex]) return;
      if (this.selectedOfferIndex === selectedIndex) this.selectOffer(selectedIndex);
    });
  }

  updatePinkSlipControl(offer) {
    if (!offer) return;
    if (cars[this.registry.get('selectedCarId')]?.ginzaDemo) {
      this.pinkSlipButton?.disableInteractive()
        .setFillStyle(0x11161c, 1).setStrokeStyle(1, 0x46545e, 1);
      this.pinkSlipButtonLabel?.setText('GALLERY LOAN // NO PINKS').setColor('#72838f');
      this.pinkResponseText?.setText('Sayaka will not risk the gallery car in a pink-slip race.');
      return;
    }

    if (!offer.pinkChallenged) {
      const ownedCars = this.registry.get('ownedCarIds') || [];
      const personalCarCount = ownedCars.filter(id => !cars[id]?.crewLoan).length;
      const garageCapacity = getGarageCapacity(this.registry.get('garageTier') || 0);
      const displayCarId = this.getOfferDisplayCar(offer)?.carId || offer.carId;
      const garageFull =
        personalCarCount >= garageCapacity &&
        !ownedCars.includes(displayCarId);

      if (garageFull) {
        this.pinkSlipButton
          .setFillStyle(0x11161c, 1)
          .setStrokeStyle(1, 0x46545e, 1)
          .disableInteractive();
        this.pinkSlipButtonLabel.setText('GARAGE FULL').setColor('#72838f');
        this.pinkResponseText
          .setText('Upgrade your Shinonome workshop to add another car.')
          .setColor('#8799a5');
        return;
      }

      const pinkCooldown = this.getPinkSlipRequestCooldownRaces();
      if (pinkCooldown > 0) {
        this.pinkSlipButton
          .setFillStyle(0x11161c, 1)
          .setStrokeStyle(1, 0x46545e, 1)
          .disableInteractive();
        this.pinkSlipButtonLabel
          .setText(
            'PINKS // ' + pinkCooldown + ' RACE' +
            (pinkCooldown === 1 ? '' : 'S')
          )
          .setColor('#72838f');
        this.pinkResponseText
          .setText(
            'Ask again after ' + pinkCooldown + ' more race' +
            (pinkCooldown === 1 ? '.' : 's.')
          )
          .setColor('#8799a5');
        return;
      }

      this.pinkSlipButton
        .setFillStyle(0x291620, 1)
        .setStrokeStyle(2, 0xff5f93, 0.9)
        .setInteractive({ useHandCursor: true });
      this.pinkSlipButtonLabel.setText('PINK SLIPS?').setColor('#ffdce8');
      this.pinkResponseText.setText('');
      return;
    }

    this.pinkSlipButton.disableInteractive();

    if (offer.pinkAccepted) {
      this.pinkSlipButton
        .setFillStyle(0x351724, 1)
        .setStrokeStyle(2, 0xff6aa0, 1);
      this.pinkSlipButtonLabel.setText('PINKS ACCEPTED').setColor('#ffffff');
      this.pinkResponseText.setText('“' + offer.pinkReply + '”').setColor('#ffafca');
    } else {
      this.pinkSlipButton
        .setFillStyle(0x11161c, 1)
        .setStrokeStyle(1, 0x46545e, 1);
      this.pinkSlipButtonLabel.setText('NO DEAL').setColor('#72838f');
      this.pinkResponseText.setText('“' + offer.pinkReply + '”').setColor('#8799a5');
    }
  }

  selectOffer(index) {
    if (!this.hasCar) {
      this.applyNoCarMeetState();
      return;
    }

    this.selectedOfferIndex = index;
    this.locationSelectedOfferIndex[this.selectedMeetLocation] = index;

    this.offers.forEach((offer, i) => {
      if (!offer.card) return;

      const active = i === index;
      offer.card.setFillStyle(
        active ? (offer.locked ? 0x20252b : 0x10263a) : (offer.locked ? 0x111820 : 0x0a1521),
        0.99
      );
      offer.card.setStrokeStyle(
        active ? 3 : 2,
        active ? (offer.locked ? 0x76858e : 0x41dcff) : (offer.locked ? 0x56646d : 0x2e4a61),
        1
      );
    });

    const offer = this.offers[index];
    if (!offer) return;

    const character = characters[offer.characterId];
    const displayCar = this.getOfferDisplayCar(offer);
    const car = displayCar?.carId ? cars[displayCar.carId] : cars[offer.carId];

    if (offer.locked) {
      this.selectedDeal = 'LOCKED';
      const resultCar = offer.displayCarId && cars[offer.displayCarId]
        ? cars[offer.displayCarId]
        : car;

      const headline = offer.resultState === 'PLAYER_WIN'
        ? 'RACE COMPLETE // DEFEATED'
        : 'RACE COMPLETE // RIVAL WON';

      const detail = offer.pinkSlipResult === 'PLAYER_WIN'
        ? 'PINK SLIP WON // THEIR CAR IS YOURS'
        : offer.pinkSlipResult === 'PLAYER_LOSS'
          ? 'PINK SLIP LOST // ' + (resultCar?.shortName || 'YOUR CAR') + ' NOW WITH RIVAL'
          : (resultCar?.shortName || car?.shortName || 'RIVAL') + '  •  ' + offer.raceType;

      this.selectedSummary.setText(headline + '\n' + detail);
      this.rivalOfferText.setText('DONE');

      this.pinkSlipButton
        .disableInteractive()
        .setFillStyle(0x11161c, 1)
        .setStrokeStyle(1, 0x46545e, 1);
      this.pinkSlipButtonLabel.setText('RACE COMPLETE').setColor('#72838f');
      this.pinkResponseText
        .setText('You beat this rival. They stay here in their loss pose until the next meet refresh.')
        .setColor('#7d8d98');

      this.raceButton
        .disableInteractive()
        .setFillStyle(0x11161c, 1)
        .setStrokeStyle(1, 0x46545e, 1);
      this.raceButtonLabel.setColor('#72838f').setText('ALREADY RACED');
      return;
    }

    const stakeText = typeof offer.stake === 'number'
      ? '¥ ' + offer.stake.toLocaleString('en-US')
      : offer.stake;

    this.selectedDeal = offer.pinkChallenged && offer.pinkAccepted ? 'PINK' : 'CASH';

    this.selectedSummary.setText(
      (offer.skillLabel || character.skill?.label || 'SKILLED') + '\n' +
      car.shortName + '  •  ' + offer.raceType + '\n' +
      offer.distance
    );

    this.rivalOfferText.setText(stakeText);
    this.updatePinkSlipControl(offer);

    const cash = this.registry.get('cash') ?? 0;
    const affordable = this.selectedDeal === 'PINK' || cash >= Number(offer.stake || 0);

    if (affordable) {
      this.raceButton
        .setFillStyle(this.selectedDeal === 'PINK' ? 0x32151f : 0x0b2826, 1)
        .setStrokeStyle(2, this.selectedDeal === 'PINK' ? 0xff5f93 : 0x62e8c7, 1)
        .setInteractive({ useHandCursor: true });

      this.raceButtonLabel.setColor('#f1fffb').setText(
        this.selectedDeal === 'PINK'
          ? 'RACE FOR PINKS  >'
          : 'RACE FOR ' + stakeText + '  >'
      );
    } else {
      this.raceButton.setFillStyle(0x25151a, 1)
        .setStrokeStyle(2, 0x8b4f5c, 1)
        .disableInteractive();
      this.raceButtonLabel.setColor('#c99aa4').setText('NEED ' + stakeText);
    }
  }

  updateModeButtons() {
    this.modeButtons.forEach(item => {
      if (!this.hasCar) {
        item.box.setFillStyle(0x0a1017, 1).setStrokeStyle(1, 0x29343d, 1);
        item.label.setColor('#53626c');
        return;
      }
      if (item.locked) {
        item.box.setFillStyle(0x0a1017, 1).setStrokeStyle(1, 0x29343d, 1);
        item.label.setColor('#53626c');
        return;
      }

      const active = item.key === this.selectedMode;
      item.box.setFillStyle(active ? 0x10283b : 0x0b1724, 1);
      item.box.setStrokeStyle(
        active ? 2 : 1,
        active ? 0x43dfff : 0x315470,
        1
      );
      item.label.setColor(active ? '#ffffff' : '#a9c7da');
    });
  }

  updateRefreshTimer() {
    this.updateCompetitionCooldownButton();

    const nextWorldPhase = getStoryWorldPhase(this.registry);
    if (nextWorldPhase !== this.worldPhase) {
      this.worldPhase = nextWorldPhase;
      const location = getMeetLocation(this.selectedMeetLocation);
      const phaseBackground = getMeetBackgroundForPhase(location.id, nextWorldPhase);
      this.setMeetBackground(
        phaseBackground?.key || location.bgKey,
        location.district + ' // ' + location.label + ' // ' +
          nextWorldPhase.toUpperCase() + ' // ' + location.difficulty,
        location.bgKey
      );
    }

    // Never let a timed challenger or Meet refresh spawn underneath another
    // screen. Once the overlay closes, this 1-second timer naturally retries.
    const meetObscured = Boolean(
      this.travelMapPopup?.active ||
      this._settingsOverlay?.length ||
      this.tunerChallengePopup?.active ||
      this.competitionPopup?.active ||
      this.lastCarPinkWarning?.active ||
      sceneCutsceneActive(this)
    );
    if (this.specialChallengeActive || this.specialChallengePreparing || meetObscured) return;
    if (Date.now() >= this.nextRefreshAt) this.refreshOffersWithTransition();
  }

  refreshOffersWithTransition() {
    if (this.refreshTransitioning) return;
    this.refreshTransitioning = true;

    const stageVeil = this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x02050b,
      1
    ).setDepth(78).setAlpha(0);

    const cardVeil = this.add.rectangle(
      CARDS.x + CARDS.w / 2,
      CARDS.y + CARDS.h / 2,
      CARDS.w,
      CARDS.h,
      0x02050b,
      1
    ).setDepth(78).setAlpha(0);

    this.tweens.add({
      targets: [stageVeil, cardVeil],
      alpha: 1,
      duration: 320,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.refreshAllLocationOffers({ resetTimer: true, persist: true });
        const challenger = this.maybeGenerateSpecialChallenger();

        const finishRefresh = () => {
          if (challenger) {
            this.showSpecialChallenger(challenger, true);
          } else {
            this.rollOffers({ resetTimer: false });
          }

          const noteBg = this.add.rectangle(
          STAGE.x + 195,
          STAGE.y + 32,
          370,
          44,
          challenger ? 0x351522 : 0x07111d,
          0.94
        ).setStrokeStyle(1, challenger ? 0xff5f93 : 0x4bdcff, 0.8).setDepth(84);

        const note = this.add.text(
          STAGE.x + 195,
          STAGE.y + 32,
          'NEW RIVALS ARRIVE',
          {
            fontFamily: PIXEL_FONT,
            fontSize: '8px',
            color: challenger ? '#ffe4ee' : '#dff8ff',
          }
        ).setOrigin(0.5).setDepth(85);

        this.tweens.add({
          targets: [stageVeil, cardVeil],
          alpha: 0,
          duration: 420,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            stageVeil.destroy();
            cardVeil.destroy();
            this.refreshTransitioning = false;
          },
        });

          this.time.delayedCall(2200, () => {
            this.tweens.add({
              targets: [noteBg, note],
              alpha: 0,
              duration: 300,
              onComplete: () => {
                noteBg.destroy();
                note.destroy();
              },
            });
          });
        };

        const currentOffers = this.locationOffers[this.selectedMeetLocation] || [];
        if (!this.ensureMeetRosterAssets(
          currentOffers,
          this.selectedMeetLocation,
          'LOADING NEW RACERS',
          finishRefresh
        )) {
          finishRefresh();
        }
      },
    });
  }

  showDistrictPopup() {
    showTravelMap(this, {
      currentLocationId: this.selectedMeetLocation,
      title: 'TOKYO REGION MAP',
      actionVerb: 'DRIVE',
      allowCurrentAction: false,
      travelMode: this.isCrewTestDriveMode() ? 'crew' : 'default',
      homeCost: this.hasCar ? WORKSHOP_RETURN_COST : TAXI_TO_WORKSHOP_COST,
      onHome: (workshopLocationId, cost) => this.returnToWorkshop(workshopLocationId, cost),
      onWorkshopUpgrade: (location, cost, alreadyUnlocked) =>
        this.upgradeWorkshopFromMap(location, cost, alreadyUnlocked),
      onTravel: (locationId, cost) => this.travelToLocation(locationId, cost),
    });
  }

  showLastCarPinkSlipWarning(onConfirm) {
    if (this.lastCarPinkWarning?.active) return;

    const depth = 180;
    const objects = [];
    const add = obj => { objects.push(obj); return obj; };

    const blocker = add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.76)
      .setDepth(depth).setInteractive());
    const panel = add(this.add.rectangle(780, 420, 760, 330, 0x08111c, 0.995)
      .setStrokeStyle(3, 0xff5f93, 0.96).setDepth(depth + 1));

    add(this.add.text(780, 325, 'LAST CAR AT RISK', {
      fontFamily: PIXEL_FONT, fontSize: '16px', color: '#ff9aba'
    }).setOrigin(0.5).setDepth(depth + 2));

    add(this.add.text(
      780,
      392,
      'Lose this pink-slip race and your current run ends.\nYou can restart with the same driver or restore a Workshop save.',
      {
        fontFamily: BODY_FONT,
        fontSize: '13px',
        color: '#dce9ef',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: 640 },
      }
    ).setOrigin(0.5).setDepth(depth + 2));

    const cancel = add(this.add.rectangle(650, 510, 220, 48, 0x171c25, 1)
      .setStrokeStyle(1, 0x516a7b, 1)
      .setInteractive({ useHandCursor: true }).setDepth(depth + 2));
    add(this.add.text(650, 510, 'CANCEL', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#c7d5de'
    }).setOrigin(0.5).setDepth(depth + 3));

    const race = add(this.add.rectangle(910, 510, 250, 48, 0x321522, 1)
      .setStrokeStyle(2, 0xff5f93, 1)
      .setInteractive({ useHandCursor: true }).setDepth(depth + 2));
    add(this.add.text(910, 510, 'RACE FOR PINKS', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#fff4f8'
    }).setOrigin(0.5).setDepth(depth + 3));

    const dismiss = () => {
      objects.forEach(obj => obj?.destroy?.());
      this.lastCarPinkWarning = null;
    };

    blocker.on('pointerdown', () => {});
    cancel.on('pointerdown', dismiss);
    race.on('pointerdown', () => {
      dismiss();
      onConfirm?.();
    });

    this.lastCarPinkWarning = panel;
  }

  startSelectedRace(storyConfirmed = false, lastCarConfirmed = false) {
    if (!this.hasCar) {
      this.applyNoCarMeetState();
      return;
    }

    const offer = this.offers[this.selectedOfferIndex];
    if (!offer) return;

    if (this.selectedDeal === 'PINK' && cars[this.registry.get('selectedCarId')]?.crewLoan) {
      return;
    }

    // Incoming pink-slip offers come from the actual rival the player chose to
    // race, rather than from waiting for the three-minute Meet refresh.
    if (
      this.selectedDeal === 'CASH' &&
      !offer.incomingPinkPrompted &&
      !cars[this.registry.get('selectedCarId')]?.crewLoan &&
      this.getIncomingPinkSlipCooldownRaces() === 0 &&
      !offer.pinkChallenged &&
      isPinkSlipValueEligible(
        this.registry.get('selectedCarId'),
        this.getOfferDisplayCar(offer)?.carId || offer.carId
      ) &&
      rollPinkSlipOpportunity(this.registry)
    ) {
      const owned = this.registry.get('ownedCarIds') || [];
      const capacity = getGarageCapacity(this.registry.get('garageTier') || 0);
      if (owned.length < capacity && consumePinkSlipOpportunity(this.registry)) {
        offer.incomingPinkChallenge = true;
        offer.incomingPinkPrompted = true;
        const completedRaces =
          Math.max(0, Number(this.registry.get('wins') || 0)) +
          Math.max(0, Number(this.registry.get('losses') || 0));
        // Cooldown starts when the offer is made, whether accepted or declined.
        // This is global across Meet regions and does not accumulate probability.
        this.registry.set('incomingPinkSlipLastOfferRace', completedRaces);
        this.persistMeetRound();
        const encounterRating = Phaser.Math.Clamp(Number(offer.encounterRating || 3), 1, 5);
        const easy = String(this.registry.get('playerDifficulty') || 'STANDARD').toUpperCase() === 'EASY';
        const challenger = {
          active: true,
          locationId: this.selectedMeetLocation,
          characterId: offer.characterId,
          carId: offer.carId,
          paintColor: offer.paintColor,
          encounterRating,
          encounterAi: offer.encounterAi || getEncounterAi(encounterRating),
          opponentBuildRating: offer.opponentBuildRating,
          opponentBuildArchetype: offer.opponentBuildArchetype || null,
          opponentBuildState: offer.opponentBuildState || null,
          skillRange: this.getDisplayedSkillRange(encounterRating),
          raceType: offer.raceType,
          difficulty: offer.difficulty,
          quote: 'Forget the cash. Keys for keys.',
          sourceMeetSlot: this.selectedOfferIndex,
          createdAt: Date.now(),
        };
        this.registry.set('specialChallenger', challenger);
        saveSessionState(this.registry);
        this.showSpecialChallenger(challenger, true);
        return;
      }
    }

    if (this.selectedDeal === 'PINK' && !storyConfirmed) {
      const rivalName = String(
        this.getRivalDisplayCharacter(offer.characterId)?.name || 'RIVAL'
      ).toUpperCase();
      const story = playMangaCutscene(this, 'firstPinkSlipChallenge', {
        characterOverrides: { RIVAL: offer.characterId },
        variables: { RIVAL_NAME: rivalName },
        onComplete: () => this.startSelectedRace(true, lastCarConfirmed),
      });
      if (story.played) return;
    }

    if (
      this.selectedDeal === 'PINK' &&
      !lastCarConfirmed &&
      (this.registry.get('ownedCarIds') || []).length <= 1
    ) {
      this.showLastCarPinkSlipWarning(() => this.startSelectedRace(true, true));
      return;
    }

    const cash = this.registry.get('cash') ?? 0;
    if (this.selectedDeal === 'CASH' && cash < Number(offer.stake || 0)) return;

    const displayCar = this.getOfferDisplayCar(offer);
    const opponentCarId = displayCar?.carId || offer.carId;
    const opponentPaintColor = displayCar?.paintColor ?? normalisePaintColor(
      offer.paintColor,
      DEFAULT_PAINT_COLOR
    );

    this.registry.set('selectedOpponentCarId', opponentCarId);
    this.registry.set('selectedOpponentPaintColor', opponentPaintColor);
    this.registry.set('selectedOpponentCharacterId', offer.characterId);
    this.registry.set('selectedOpponentEncounterRating', Number(offer.encounterRating || 3));
    this.registry.set('selectedOpponentEncounterAi', offer.encounterAi || getEncounterAi(offer.encounterRating || 3));
    this.registry.set('selectedOpponentBuildRating', Number(offer.opponentBuildRating || 1));
    this.registry.set('selectedOpponentBuildArchetype', offer.opponentBuildArchetype || null);
    this.registry.set('selectedOpponentBuildState', offer.opponentBuildState || null);
    this.registry.set('selectedOpponentDifficulty', offer.difficulty || getMeetLocation(this.selectedMeetLocation).difficulty);
    this.registry.set('selectedRaceCategory', this.selectedMode);
    this.registry.set('selectedRaceType', offer.raceType);
    this.registry.set('selectedRaceDistanceM', 0);
    this.registry.set('selectedRaceDeal', this.selectedDeal === 'PINK' ? 'PINK_SLIP' : 'BET');
    this.registry.set('selectedRaceSpecialChallenge', false);
    this.registry.set('selectedRaceStake', this.selectedDeal === 'PINK' ? 0 : offer.stake);
    const { card, ...plainOffer } = offer;
    this.registry.set('selectedRaceMeetOffer', {
      ...plainOffer,
      carId: opponentCarId,
      paintColor: opponentPaintColor,
      displayCarId: opponentCarId,
      displayPaintColor: opponentPaintColor,
      meetLocation: this.selectedMeetLocation,
      slotIndex: this.selectedOfferIndex,
    });
    this.registry.set('raceReturnScene', 'MeetScene');

    const location = getMeetLocation(this.selectedMeetLocation);
    this.registry.set('raceTimeOfDay', getStoryWorldPhase(this.registry));
    this.registry.set('raceDistrict', location.district);
    this.registry.set('raceLocationLabel', location.label);
    this.persistMeetRound();

    this.scene.start('RaceScene');
  }

  createCarDisplay(
    car,
    x,
    y,
    targetWidth,
    depth,
    flipX = false,
    paintColor = DEFAULT_PAINT_COLOR
  ) {
    const source = this.textures.get(getCarBodyTextureKey(this, car)).getSourceImage();
    const wheelSource = this.textures.get(car.visual.wheelKey).getSourceImage();
    const bodyScale = getCarBodyScaleForWidth(this, car, targetWidth);
    const fit = getWheelPairFit(car.visual, bodyScale, flipX, wheelSource);
    const renderOffsetY = Number(car.visual.renderOffsetY || 0) * bodyScale;
    // The existing meet layout supplies a legacy centred bay Y. Convert it
    // to the common tyre contact line once, not individually per new model.
    const displayY = y + renderOffsetY +
      (car.visual.referenceStandard ? targetWidth * (232 / 1200) : 0);
    const drawX = getReferenceRightX(car, x, bodyScale);

    const rearX = drawX + fit.rear.offsetX;
    const frontX = drawX + fit.front.offsetX;
    const rearY = displayY + fit.rear.offsetY;
    const frontY = displayY + fit.front.offsetY;

    const rearWheel = this.add.image(rearX, rearY, car.visual.wheelKey)
      .setScale(fit.rear.wheelScale)
      .setDepth(depth);

    const frontWheel = this.add.image(frontX, frontY, car.visual.wheelKey)
      .setScale(fit.front.wheelScale)
      .setDepth(depth);

    const rearBacking = this.add.circle(
      rearX,
      rearY,
      fit.rear.backingRadius ?? Math.max(5, rearWheel.displayWidth * 0.50),
      0x020304,
      1
    ).setDepth(depth - 0.35);

    const frontBacking = this.add.circle(
      frontX,
      frontY,
      fit.front.backingRadius ?? Math.max(5, frontWheel.displayWidth * 0.50),
      0x020304,
      1
    ).setDepth(depth - 0.35);

    // Use one soft tyre shadow, raised towards the car's contact patch.
    // The right-hand flipped display needs a little more upward adjustment.
    const tyreBottom = Math.max(
      rearY + rearWheel.displayHeight * 0.5,
      frontY + frontWheel.displayHeight * 0.5
    );
    const softShadowHeight = Math.max(
      20,
      Math.max(rearWheel.displayHeight, frontWheel.displayHeight) * 0.34
    );
    const shadowY = tyreBottom - (flipX ? 12 : 7);

    const softShadow = this.add.ellipse(
      x + (flipX ? -4 : 4),
      shadowY,
      Math.max(112, targetWidth * 0.88),
      softShadowHeight,
      0x000000,
      0.64
    ).setDepth(depth - 0.12);

    const bodyLayers = createCarBodyLayers(this, car, {
      x: drawX,
      y: displayY,
      scale: bodyScale,
      depth: depth + 1,
      flipX,
      paintColor,
    });

    return [
      rearBacking,
      frontBacking,
      softShadow,
      rearWheel,
      frontWheel,
      ...bodyLayers.objects,
    ];
  }
}


