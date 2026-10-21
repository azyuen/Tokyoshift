import { getCarMagazineMeta } from '../data/carMagazine.js?v=20261011-r479';
import { showProDriverBriefing } from '../ui/ProDriverBriefing.js?v=20261022-r635';
import { queueProVictoryAssets, showProVictoryResults } from '../ui/ProVictoryResults.js?v=20261022-r635';
import { getBaseCarId } from '../data/carOwnership.js?v=20261011-r479';
import { getFactoryPaintColor } from '../data/factoryPaintPalettes.js?v=20261020-r623';
import { selectMixedCarPaint } from '../data/streetPaintPalettes.js?v=20261020-r624';
import { isOpenDriverBriefing, driverBriefingEligibility, consumeDriverAdvice, forfeitOpenDriverTransaction, usesPrepaidDriverBriefing, purchaseDriverBriefingEntry } from '../data/proDriverBriefing.js?v=20261021-r631';
const proDriveClass = value => ({ FF:'FWD', FR:'RWD', FWD:'FWD', RWD:'RWD', AWD:'AWD', FOUR_WHEEL_DRIVE:'AWD' }[String(value || '').toUpperCase()] || String(value || '').toUpperCase());
import { CREW_SERIES, OPEN_CIRCUIT_CREW_FEE, OPEN_CIRCUIT_TROPHY_FEE, OPEN_CIRCUIT_TROPHY_PRIZE, isOpenCircuitAvailable, getOpenCircuitTrophy, getOpenCircuitCrewFormat, getProfessionalAttendance, getProfessionalRoundEvents, getProfessionalCarEligibility, registerProfessionalTimedEvent } from '../data/proSeason.js?v=20261021-r631';
import { drawSeasonHeader, drawCrewSidebar, showTokyoChampionship, showProSeasonAction, showCrewFixture, confirmCrewForfeit, drawProEventSidebarTitle, drawProEventSidebarDetails, drawProEventSidebarStatus, drawProEventSidebarEntry, proEventEntryLabel } from '../ui/ProSeasonPanel.js?v=20261022-r635';
import { startChapter09, chapter09ShouldBegin } from '../ui/Chapter09Story.js?v=20261022-r635';
import { saveProTransaction } from '../state/GameState.js?v=20261018-r588';
import { getCarBodyScaleForWidth } from '../vehicles/CarAppearance.js?v=20260929-r246';
import { getReferenceRightX } from '../data/carReferenceGeometry.js?v=20261012-ref2';
import { cars, carOrder } from '../data/cars.js?v=20261011-r479';
import { countOwnedCarModel, createAndRegisterOwnedCarInstance, ownsCarModel } from '../data/carOwnership.js?v=20261011-r479';
import { engines } from '../data/engines.js?v=20261011-r479';
import {
  characters,
  getCharacterAssetUrl,
  CENTRAL_TOKYO_CHARACTER_IDS,
  getCharacterVisualAsset,
  genericRivalCharacterOrder,
  getRivalCharacterOrderForRegion,
  getConqueredMainRivalIds,
  getMainRivalProgression,
} from '../data/characters.js?v=20261022-r635';
import {
  applyEngineTuning,
} from '../data/tuning.js?v=20260926-r211';
import {
  applySecondaryTuning,
} from '../data/secondaryTuning.js?v=20260926-r211';
import {
  DEFAULT_PAINT_COLOR,
  RIVAL_PAINT_COLORS,
  getCarBodyTextureKey,
  createCarBodyLayers,
  getCarPaintColor,
} from '../vehicles/CarAppearance.js?v=20260929-r246';
import {
  createVisualModLayers,
  getVisualModWheelVisual,
  preloadVisualModSelectionAssets,
} from '../data/visualMods.js?v=20261014-r501';
import { getWheelPairFit, getWheelContactOffsetY } from '../vehicles/WheelFit.js?v=20260929-r258';
import { getEncounterAi } from '../data/encounterProfiles.js?v=20260921-r76';
import {
  getProCircuitAccess, getProCircuitDriverSeeds, normaliseProCircuitState, PRO_CIRCUIT_TROPHIES,
} from '../data/proCircuit.js?v=20261021-r628';
import {
  FOUR_WIDE_CUP, createFourWideTournament, getPlayerProHeat,
} from '../data/proTournament.js?v=20261021-r628';
import { createRivalBuildState } from '../data/rivalBuilds.js?v=20260928-r234';
import { getVehiclePerformance } from '../vehicles/VehiclePerformance.js?v=20261011-r479';
import {
  saveSessionState,
  recordCarAcquisition,
  recordCarDeparture,
} from '../state/GameState.js?v=20261018-r588';
import { restorePreferredCar } from '../state/CarSelection.js?v=20261018-r588';
import { showTravelMap } from '../ui/TravelMap.js?v=20261022-r636';
import { isGinzaLoanActive, canVisitDuringGinzaLoan, ginzaRoomDuringLoan } from '../data/ginzaLoanAccess.js?v=20261022-r636';
import { preloadChapter08GinzaAssets, startChapter08Ginza } from '../ui/Chapter08Story.js?v=20261017-r574';
import { isChapter08DevReplay } from '../ui/Chapter08DevReplay.js?v=20261017-r574';
import {
  getGarageDeliveryOptions,
  showGarageDeliveryPicker,
} from '../ui/GarageDeliveryPicker.js?v=20260929-r264';
import { getWorldPhase, getOpenCircuitRotation } from '../environment/WorldClock.js?v=20261018-r592';
import { getTravelLocation } from '../data/travelRegions.js?v=20261015-r522';
import {
  applyMarketPriceDifficulty,
  getMarketPriceMultiplier,
} from '../data/careerProgression.js?v=20261010-r468';
import {
  getGarageCapacity,
  getUnlockedWorkshops,
  getWorkshopStorageCapacity,
  getWorkshopUsage,
  isWorkshopProgressionReady,
} from '../data/workshopProgression.js?v=20261005-r354';
import { getPowerTorqueDisplay } from '../data/carRatings.js?v=20261004-r325';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20261005-r355';
import { addSettingsButton } from '../ui/SettingsPanel.js?v=20261011-r482';
import { playMangaCutscene, sceneCutsceneActive } from '../ui/MangaCutscene.js?v=20261018-r588';
import { hasSeenCutscene } from '../data/cutscenes.js?v=20261009-r457';
import { GINZA_ROTATION_MS, GINZA_VAULT_CARS, getGinzaRoomStock, getGinzaVaultCar, ginzaVaultEligible, isGinzaOwner, isNamedArkonDen } from '../data/ginzaGallery.js?v=20261021-r629';
import { ginzaConversation } from '../data/ginzaScenes.js?v=20261021-r633';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';
import { preloadCarAppearanceAssets, preloadCarWheel, ensureDerivedModularCarTextures } from '../vehicles/CarAppearance.js?v=20260929-r246';
import { recordCarMagazineSightings } from '../data/carMagazine.js?v=20261011-r479';
import {
  CENTRAL_TOKYO_LOCATIONS,
  AUTO_MARKET_LISTINGS,
  GINZA_LISTINGS,
  PRO_DRAG_EVENTS,
  getAutoMarketBuild,
  getAutoMarketBasePrice,
  getNewCarState,
  getAutoMarketSellPrice,
  getGinzaCollectorState,
  isCentralTokyoLocationUnlocked,
  getCarCouponRequirement,
  getCarCouponCount,
  canRedeemCarCoupon,
  isArkonDen,
} from '../data/centralTokyo.js?v=20261014-r501';
import {
  TUNER_TEAM_INVITE_CHANCE,
  TUNER_TEAM_PITY_ARRIVALS,
  getTunerTeamChallengeState,
  isTunerTeamChallengeEligible,
} from '../data/tunerChallenges.js?v=20261011-r479';
import {
  TUNER_SHOP_ORDER,
  getTunerShopForRegion,
  isTunerShopUnlocked,
} from '../data/tunerShops.js?v=20261011-r479';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const STAGE = { x: 24, y: 92, w: 1138, h: 528 };
const SIDE = { x: 1180, y: 92, w: 356, h: 724 };
const CARDS = { x: 24, y: 636, w: 1138, h: 180 };

const LOCATION_BY_ID = Object.fromEntries(
  Object.values(CENTRAL_TOKYO_LOCATIONS).map(item => [item.id, item])
);

function money(value) {
  return '¥ ' + Number(value || 0).toLocaleString('en-US');
}

function clamp01(value) {
  return Math.max(0, Math.min(0.99, Number(value) || 0));
}

function proCircuitTrophyWins(registry, id) {
  return normaliseProCircuitState(registry.get('proCircuit')).trophyWins[id] || 0;
}
function proCircuitSpecialEligible(registry) {
  const pro = normaliseProCircuitState(registry.get('proCircuit'));
  return Boolean(pro.activeChampionship) || (pro.playerDriver.seasonPoints >= 60 && pro.playerTeam.seasonPoints >= 40);
}
export default class CentralTokyoScene extends Phaser.Scene {
  constructor() {
    super('CentralTokyoScene');
  }

  init(data = {}) {
    restorePreferredCar(this.registry);
    this.chapter08Arrival = Boolean(data?.chapter08Arrival ||
      (hasSeenCutscene(this.registry,'chapter08RaceFinished') &&
       !hasSeenCutscene(this.registry,'chapter08Ginza')));
    this.autoOpenProCrewFixture = Boolean(data?.autoOpenProCrewFixture);
    this.autoShowProVictory = data?.autoShowProVictory || null;
    this.autoOpenProDriverBriefing = Boolean(data?.autoOpenProDriverBriefing);
    this.promptProCrewForfeit = Boolean(data?.promptProCrewForfeit);
    this.requestedLocationId = data?.locationId ||
      (this.chapter08Arrival ? 'ginzaMotorGallery' : null);
    const activeLoan = this.registry.get('ginzaTestDrive');
    this.ginzaRoom = ginzaRoomDuringLoan(this.registry, data?.ginzaRoom || 1);
    const loanVariant = String(activeLoan?.carId || '').replace(/^ginzaDemo_/, '');
    const loanIndex = GINZA_VAULT_CARS.findIndex(car => car.decal === loanVariant || car.stock === loanVariant);
    this.ginzaVaultIndex = loanIndex < 0 ? 0 : loanIndex;
    this.ginzaStockBody = GINZA_VAULT_CARS[this.ginzaVaultIndex]?.stock === loanVariant;
    this.ginzaRotationKey = -1;
    this.ginzaOwnerDressed = isGinzaLoanActive(this.registry) && isNamedArkonDen(this.registry);
    const requestedRoom = String(data?.autoMarketRoom || 'new');
    this.autoMarketRoom = ['new', 'used'].includes(requestedRoom)
      ? requestedRoom
      : 'new';
  }

  preload() {
    let queued = 0;
    const requested = this.requestedLocationId || CENTRAL_TOKYO_LOCATIONS.autoMarket.id;
    const location = LOCATION_BY_ID[requested] || CENTRAL_TOKYO_LOCATIONS.autoMarket;
    queued += this.queueLocationAssets(location);
    if(this.autoShowProVictory){
      queued += queueProVictoryAssets(this,[
        'sayakaFujieda',this.registry.get('playerCharacterId')||'renMizuno',
        'daichiSakamoto'],this.autoShowProVictory.winner?'win':'loss',
        [this.autoShowProVictory.carId].filter(Boolean));
    } else if(this.autoOpenProCrewFixture){
      const finished=this.registry.get('proCircuit')?.activeCrewEvent?.fixture;
      if(finished?.revealed===3){
        const lineup=finished.lineup||[];
        const winCount=finished.heats?.filter(h=>h.won).length||0;
        queued+=queueProVictoryAssets(this,[
          ...lineup,this.registry.get('playerCharacterId')||'renMizuno'],
          winCount>=2?'win':'loss',
          finished.heats.map(h=>h.carId));
      }
    }
    if (this.chapter08Arrival && location.kind === 'showroom') {
      queued += preloadChapter08GinzaAssets(this);
      // The ordinary Ginza location preload already includes its RWB listing.
    }

    startSceneLoading(this, 'LOADING CENTRAL TOKYO', queued);
  }

  getLocationBackgroundConfig(location, phase = this.worldPhase || getWorldPhase()) {
    const safePhase = String(phase).toLowerCase() === 'day' ? 'day' : 'night';

    if (location?.kind === 'autoMarket') {
      const room = ['new', 'used'].includes(this.autoMarketRoom)
        ? this.autoMarketRoom
        : 'new';
      const roomConfig = location.marketBackgrounds?.[room];
      return roomConfig?.phases?.[safePhase] || roomConfig || {
        key: location.backgroundKey,
        path: location.backgroundPath,
      };
    }

    if (location?.kind === 'showroom') {
      if (this.ginzaRoom === 3) return {
        key: 'centralGinzaVaultBg', path: 'assets/CentralTokyo/tokyo_ginza03.png',
      };
      if (this.ginzaRoom === 2) return safePhase === 'day'
        ? { key: 'centralGinzaRoom2DayBg', path: 'assets/CentralTokyo/tokyo_ginza02_day.png' }
        : { key: 'centralGinzaRoom2NightBg', path: 'assets/CentralTokyo/tokyo_ginza02_night.png' };
    }
    return location?.phaseBackgrounds?.[safePhase] || {
      key: location?.backgroundKey,
      path: location?.backgroundPath,
    };
  }

  getLocationBackgroundConfigs(location) {
    const configs = [
      this.getLocationBackgroundConfig(location, 'day'),
      this.getLocationBackgroundConfig(location, 'night'),
    ];
    const seen = new Set();
    return configs.filter(config => {
      if (!config?.key || seen.has(config.key)) return false;
      seen.add(config.key);
      return true;
    });
  }

  queueLocationAssets(location) {
    let queued = 0;

    // Load both lighting variants only for the currently visited Central Tokyo
    // location/room. This keeps transitions instant without loading every
    // Central Tokyo background at boot.
    // Warm all three Ginza rooms at entry so moving between rooms does not
    // repeatedly show the full-screen Central Tokyo loading bar.
    const backgrounds = this.getLocationBackgroundConfigs(location);
    if (location?.kind === 'showroom') backgrounds.push(
      { key: 'centralGinzaRoom2DayBg', path: 'assets/CentralTokyo/tokyo_ginza02_day.png' },
      { key: 'centralGinzaRoom2NightBg', path: 'assets/CentralTokyo/tokyo_ginza02_night.png' },
      { key: 'centralGinzaVaultBg', path: 'assets/CentralTokyo/tokyo_ginza03.png' },
    );
    const seenBackgrounds = new Set();
    backgrounds.forEach(background => {
      if (seenBackgrounds.has(background?.key)) return;
      seenBackgrounds.add(background?.key);
      if (background?.path && background?.key && !this.textures.exists(background.key)) {
        this.load.image(background.key, background.path + '?v=20260929-r263');
        queued += 1;
      }
    });

    if (location?.kind === 'autoMarket') {
      queued += this.queueCharacterPose(
        CENTRAL_TOKYO_CHARACTER_IDS.autoMarket[this.autoMarketRoom],
        'normal'
      );

      {
        const listings = this.autoMarketRoom === 'new'
          ? this.getNewCarListings()
          : this.getUsedCarListings();

        listings.forEach(listing => {
          const car = cars[listing.carId];
          if (!car) return;
          queued += preloadCarAppearanceAssets(this, { [listing.carId]: car }, '20260929-r246');
          queued += preloadCarWheel(this, car, listing.previewState || {});
          queued += preloadVisualModSelectionAssets(
            this,
            listing.carId,
            listing.previewState || {},
            '20260929-r246'
          );
        });
      }
    }

    if (location?.kind === 'showroom') {
      GINZA_LISTINGS.forEach(listing => {
        const car = cars[listing.carId];
        if (!car) return;
        queued += preloadCarAppearanceAssets(this, { [listing.carId]: car }, '20260929-r246');
        queued += preloadCarWheel(this, car);
      });

      for (const [who, poses] of [
        ['emiSaionji', ['ginzaIdle', 'ginzaHappy', 'ginzaSad']],
        ['kaedeTachibana', ['ginzaIdle', 'ginzaHappy', 'ginzaSad']],
        ['sayakaFujieda', ['ginzaNormal', 'ginzaHappy', 'ginzaSerious', 'ginzaSad']],
      ]) poses.forEach(pose => { queued += this.queueCharacterPose(who, pose); });
      if (isNamedArkonDen(this.registry)) {
        // Warm both looks before the owner enters the Vault; no mid-scene stall.
        queued += this.queueCharacterPose('sayakaFujieda', 'normal');
        queued += this.queueCharacterPose('sayakaFujieda', 'ginzaDress');
        queued += this.queueCharacterPose('arkonDen', 'ginzaSuit');
      }
      // A buyer can trigger a manga conversation immediately. Preload only
      // the current driver's default portrait so the first BUY does not
      // freeze the showroom waiting on a network asset.
      const driverId = this.registry.get('playerCharacterId');
      if (driverId && characters[driverId]) {
        queued += this.queueCharacterPose(driverId, 'idle');
      }
    }

    if (location?.kind === 'proDrag') {
      const playerId = this.registry.get('playerCharacterId');
      const migratedRivals = getConqueredMainRivalIds(this.registry);
      const genericRivals = genericRivalCharacterOrder
        .filter(id => id !== playerId && characters[id] && !migratedRivals.includes(id))
        .sort((a, b) =>
          Number(characters[b]?.skill?.rating || 3) -
          Number(characters[a]?.skill?.rating || 3)
        )
        .slice(0, 3);

      migratedRivals.forEach(id => {
        queued += this.queueCharacterPose(id, 'normal', { rivalContext: true, proCircuit: true });
      });
      genericRivals.forEach(id => {
        queued += this.queueCharacterPose(id, 'normal', { proCircuit: true });
      });
      Object.values(CENTRAL_TOKYO_CHARACTER_IDS.dragComplex).forEach(id => {
        queued += this.queueCharacterPose(id, 'normal');
      });
      if (hasSeenCutscene(this.registry, 'proCircuitStrategistReveal')) {
        queued += this.queueCharacterPose('sayakaFujieda', 'track');
      }
    }

    return queued;
  }

  create() {
    document.body.dataset.scene = 'central-tokyo';
    this.scale.resize(1560, 840);
    playMusic('meet');

    const requestedLocation = this.requestedLocationId || CENTRAL_TOKYO_LOCATIONS.autoMarket.id;
    const savedLocation = canVisitDuringGinzaLoan(this.registry, requestedLocation)
      ? requestedLocation : CENTRAL_TOKYO_LOCATIONS.ginza.id;

    this.activeLocationId = isCentralTokyoLocationUnlocked(this.registry, savedLocation)
      ? savedLocation
      : CENTRAL_TOKYO_LOCATIONS.autoMarket.id;

    if (!isCentralTokyoLocationUnlocked(this.registry, this.activeLocationId)) {
      this.activeLocationId = Object.values(CENTRAL_TOKYO_LOCATIONS)
        .find(item => isCentralTokyoLocationUnlocked(this.registry, item.id))?.id
        || CENTRAL_TOKYO_LOCATIONS.autoMarket.id;
    }

    this.registry.set('centralTokyoLocation', this.activeLocationId);

    ensureDerivedModularCarTextures(
      this,
      Object.fromEntries(
        Object.entries(cars).filter(([, car]) =>
          car?.visual?.bodyKey && this.textures.exists(car.visual.bodyKey)
        )
      )
    );

    this.contentObjects = [];
    this.selectedIndex = 0;
    this.selectedEventIndex = 0;
    this.autoMarketShowcaseActive = false;
    this.autoMarketAnimateShowcase = false;
    this.autoMarketTransitioning = false;
    this.newCarStockPage = 0;
    this.ginzaShowcaseActive = false;
    this.ginzaAnimateShowcase = false;
    this.ginzaTransitioning = false;
    this.ginzaCarFading = false;
    this.devCentralRefreshOffsets = {
      autoMarket: 0,
      showroom: 0,
      proDrag: 0,
    };
    this.worldPhase = getWorldPhase();
    this.centralBackgroundImage = null;
    this.centralBackgroundLocation = null;

    this.drawShell();
    this.renderLocation(this.activeLocationId);
    if(this.autoShowProVictory){
      const result=this.autoShowProVictory;
      this.time.delayedCall(0,()=>{
        if(this.sys?.isActive?.())showProVictoryResults(this,{
          ...result,onContinue:()=>this.renderLocation('tokyoDragComplex'),
        });
      });
    }
    // After each professional crew heat, return straight to its SAVED heat
    // preparation, not the generic Drag Complex home screen.
    if (this.autoOpenProCrewFixture && this.registry.get('proCircuit')?.activeCrewEvent) {
      this.time.delayedCall(0,()=>{
        if(!this.sys?.isActive?.() ||
          !this.registry.get('proCircuit')?.activeCrewEvent)return;
        showCrewFixture(this);
        if(this.promptProCrewForfeit)confirmCrewForfeit(this);
      });
    }
    if (this.autoOpenProDriverBriefing && isOpenDriverBriefing(this.registry.get('competitionState'))) {
      this.time.delayedCall(0,()=>{
        if(this.sys?.isActive?.())this.showOpenCircuitDriverBriefing();
      });
    }
    if (this.chapter08Arrival && this.activeLocationId === 'ginzaMotorGallery') {
      // Let the normal R567 showroom be recognisable before dialogue starts.
      this.time.delayedCall(1500, () => {
        if (!sceneCutsceneActive(this)) startChapter08Ginza(this);
      });
    }

    this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        this.syncWorldPhaseBackground();
        if (this.activeLocationId === CENTRAL_TOKYO_LOCATIONS.ginza.id &&
            this.ginzaRotationKey !== Math.floor(Date.now() / GINZA_ROTATION_MS)) {
          this.renderLocation(this.activeLocationId);
        }
        // Driver/crew offers change at five-minute slot boundaries, even if
        // DAY/NIGHT has not flipped yet. Never interrupt modal or manga UI.
        if (this.activeLocationId === 'tokyoDragComplex' &&
            isOpenCircuitAvailable(this.registry.get('proCircuit')) &&
            this.proOpenRotationKey !== getOpenCircuitRotation().rotationIndex &&
            !this._proOverlayClose && !this._proSeasonConfirmClose &&
            !sceneCutsceneActive(this)) this.renderLocation(this.activeLocationId);
      },
    });

    if (
      this.activeLocationId === 'tokyoAutoMarket' ||
      this.activeLocationId === 'tokyoDragComplex'
    ) {
      this.time.delayedCall(220, () => this.maybeShowTunerTeamCallout());
    }

    finishSceneLoading('CENTRAL TOKYO');
  }

  maybeShowTunerTeamCallout() {
    const candidates = TUNER_SHOP_ORDER
      .filter(regionId =>
        !isTunerShopUnlocked(this.registry, regionId) &&
        isTunerTeamChallengeEligible(this.registry, regionId)
      )
      .map(regionId => ({
        regionId,
        state: getTunerTeamChallengeState(this.registry, regionId),
        wins: Number((this.registry.get('regionWins') || {})[regionId] || 0),
      }))
      .filter(item => !item.state.invited && item.state.retryNotBefore <= Date.now())
      .sort((a, b) => b.wins - a.wins);

    if (!candidates.length) return;

    const candidate = candidates[0];
    const nextMisses = candidate.state.misses + 1;
    const chance = Math.max(0.18, TUNER_TEAM_INVITE_CHANCE - 0.08);
    const trigger =
      Math.random() < chance ||
      nextMisses >= TUNER_TEAM_PITY_ARRIVALS;

    const store = { ...(this.registry.get('tunerTeamChallenges') || {}) };
    store[candidate.regionId] = {
      ...candidate.state,
      invited: trigger,
      misses: trigger ? 0 : nextMisses,
      offeredAt: trigger ? this.activeLocationId : candidate.state.offeredAt,
    };
    this.registry.set('tunerTeamChallenges', store);
    saveSessionState(this.registry);

    if (trigger) this.showTunerTeamCallout(candidate.regionId);
  }

  showTunerTeamCallout(regionId) {
    const key = String(regionId || '').toUpperCase();
    const shop = getTunerShopForRegion(key);
    if (!shop) return;

    const regionalRivals = getRivalCharacterOrderForRegion(key);
    const npcId = characters[shop.mechanicId]
      ? shop.mechanicId
      : (regionalRivals[0] || genericRivalCharacterOrder[0] || null);
    const npcName = characters[npcId]?.name || (key + ' CREW');

    playMangaCutscene(this, 'tunerTeamCallout', {
      historyId: 'tunerTeamCallout:' + key,
      characterOverrides: {
        NPC: npcId,
      },
      variables: {
        REGION: key,
        SHOP: shop.label,
        NPC_NAME: npcName.toUpperCase(),
        NPC_SUBTITLE: (shop.label + ' // CREW CALL-OUT').toUpperCase(),
      },
      onComplete: () => {
        // Invitation state was persisted before the presentation begins.
        // Accept/skip here changes no Central Tokyo progression; the challenge
        // remains available in its home region exactly as before.
      },
    });
  }

  drawShell() {
    this.add.rectangle(780, 420, 1560, 840, 0x050a11).setDepth(-20);

    this.add.rectangle(780, 35, 1512, 62, 0x07111d, 1)
      .setStrokeStyle(2, 0x173249, 1)
      .setDepth(40);

    this.add.text(52, 35, 'CENTRAL', {
      fontFamily: PIXEL_FONT,
      fontSize: '20px',
      color: '#eefaff',
    }).setOrigin(0, 0.5).setDepth(42);

    this.locationHeader = this.add.text(340, 35, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#7edfff',
    }).setOrigin(0, 0.5).setDepth(42);

    const wins = Number(this.registry.get('wins') || 0);
    const losses = Number(this.registry.get('losses') || 0);
    const cash = Number(this.registry.get('cash') || 0);

    this.add.text(1120, 24, 'WINS  ' + wins, {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#b4ccdb',
    }).setOrigin(1, 0.5).setDepth(42);

    this.add.text(1120, 47, 'LOSSES  ' + losses, {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#b4ccdb',
    }).setOrigin(1, 0.5).setDepth(42);

    this.cashText = this.add.text(1510, 35, money(cash), {
      fontFamily: PIXEL_FONT,
      fontSize: '15px',
      color: '#ffe08a',
    }).setOrigin(1, 0.5).setDepth(42);

    addSettingsButton(this, 955, 35);

    this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x08121d,
      1
    ).setStrokeStyle(2, 0x24475f, 1).setDepth(-12);

    // Central Tokyo characters belong inside the authored stage window. Keep a
    // reusable crop mask on them, then redraw the border above character art so
    // nobody can visually spill over the frame.
    this.centralStageMaskShape = this.make.graphics({ add: false });
    this.centralStageMaskShape.fillStyle(0xffffff, 1);
    this.centralStageMaskShape.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
    this.centralStageMask = this.centralStageMaskShape.createGeometryMask();

    this.centralStageBorderOverlay = this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x000000,
      0
    ).setStrokeStyle(2, 0x24475f, 1).setDepth(39);

    this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + SIDE.h / 2,
      SIDE.w,
      SIDE.h,
      0x07111d,
      0.99
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(30);

    this.add.rectangle(
      CARDS.x + CARDS.w / 2,
      CARDS.y + CARDS.h / 2,
      CARDS.w,
      CARDS.h,
      0x07111d,
      0.99
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(30);
  }

  clearContent() {
    this.contentObjects.forEach(obj => obj?.destroy?.());
    this.contentObjects = [];
  }

  addContent(obj) {
    this.contentObjects.push(obj);
    return obj;
  }

  queueCharacterPose(characterId, pose = 'normal', { rivalContext = false, proCircuit = false } = {}) {
    const asset = getCharacterVisualAsset(characterId, pose, {
      rivalContext,
      playerCharacterId: this.registry.get('playerCharacterId') || '',
      proCircuit,
    });
    if (!asset?.key || !asset?.path || this.textures.exists(asset.key)) return 0;
    this.load.image(asset.key, getCharacterAssetUrl(asset.path));
    return 1;
  }

  addVenueCharacter({
    characterId,
    pose = 'normal',
    x,
    feetY,
    height = 220,
    flip = false,
    depth = 21,
    shadow = true,
    shadowOffsetX = 0,
    shadowOffsetY = 0,
    rivalContext = false,
    proCircuit = this.activeLocationId === 'tokyoDragComplex',
  } = {}) {
    const asset = getCharacterVisualAsset(characterId, pose, {
      rivalContext,
      playerCharacterId: this.registry.get('playerCharacterId') || '',
      proCircuit,
    });
    const key = asset?.key;
    if (!key || !this.textures.exists(key)) return null;

    const texture = this.textures.get(key);
    texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    const source = texture.getSourceImage();
    const safeHeight = Math.max(1, Number(source?.height || source?.naturalHeight || 1));
    const displayHeight = Math.max(1, Number(height || 220)) * 1.50;

    if (shadow) {
      const venueShadow = this.add.ellipse(
        x + shadowOffsetX,
        feetY - 7 + shadowOffsetY,
        Math.max(62, displayHeight * 0.42),
        Math.max(14, displayHeight * 0.075),
        0x000000,
        0.48
      ).setDepth(depth - 0.1);
      if (this.centralStageMask) venueShadow.setMask(this.centralStageMask);
      this.addContent(venueShadow);
    }

    const venueCharacter = this.add.image(x, feetY, key)
      .setOrigin(0.5, 1)
      .setScale(displayHeight / safeHeight)
      .setFlipX(Boolean(flip))
      .setDepth(depth);
    if (this.centralStageMask) venueCharacter.setMask(this.centralStageMask);
    return this.addContent(venueCharacter);
  }

  renderLocation(locationId, assetsAttempted = false) {
    const location = LOCATION_BY_ID[locationId] || CENTRAL_TOKYO_LOCATIONS.autoMarket;

    if (
      location.kind === 'autoMarket' &&
      this.activeLocationId &&
      this.activeLocationId !== location.id &&
      !assetsAttempted
    ) {
      this.autoMarketRoom = 'new';
      this.registry.set('autoMarketRoom', 'new');
    }

    if (!isCentralTokyoLocationUnlocked(this.registry, location.id)) {
      return;
    }

    if (!assetsAttempted) {
      const queued = this.queueLocationAssets(location);
      if (queued) {
        startSceneLoading(this, 'LOADING ' + location.label, queued);
        this.load.once('complete', () => {
          ensureDerivedModularCarTextures(
            this,
            Object.fromEntries(
              Object.entries(cars).filter(([, car]) =>
                car?.visual?.bodyKey && this.textures.exists(car.visual.bodyKey)
              )
            )
          );
          this.renderLocation(location.id, true);
          finishSceneLoading('CENTRAL TOKYO');
        });
        this.load.start();
        return;
      }
    }

    const previousLocationId = this.activeLocationId;
    if (location.kind !== 'showroom' || previousLocationId !== location.id) {
      this.ginzaShowcaseActive = false;
      this.ginzaAnimateShowcase = false;
    }
    if (location.kind !== 'autoMarket' || previousLocationId !== location.id) {
      this.autoMarketShowcaseActive = false;
      this.autoMarketAnimateShowcase = false;
    }

    this.clearContent();
    this.activeLocationId = location.id;
    this.registry.set('centralTokyoLocation', location.id);
    saveSessionState(this.registry);

    this.updateLocationHeaderForPhase(location);
    this.drawBackground(location);

    if (location.kind === 'autoMarket') {
      this.drawAutoMarket();
      return;
    }

    if (location.kind === 'showroom') {
      this.drawGinza();
      return;
    }

    this.drawDragComplex();
    this.queueSayakaProStrategistReveal();
    // The first genuine visit after Chapter 08 introduces the professional
    // circuit, even though the Open Circuit was already unlocked by R575.
    if(!this._chapter09Scheduled && chapter09ShouldBegin(this.registry)){
      this._chapter09Scheduled=true;
      this.time.delayedCall(750,()=>{
        this._chapter09Scheduled=false;
        if(this.activeLocationId===CENTRAL_TOKYO_LOCATIONS.drag.id &&
          !sceneCutsceneActive(this))startChapter09(this);
      });
    }
  }

  // Sayaka is an eighth, non-driving support figure, not a substitute for any
  // of the seven regional recruits. Ginza recognition must precede this reveal.
  queueSayakaProStrategistReveal() {
    if (this._sayakaProRevealScheduled ||
        hasSeenCutscene(this.registry, 'proCircuitStrategistReveal') ||
        !hasSeenCutscene(this.registry, 'ginzaInvitation')) return false;

    const access = getProCircuitAccess(this.registry);
    // A dev bypass alone is not the canonical seven-member career milestone.
    if (!access.unlocked || access.crewCount < access.crewRequired) return false;

    this._sayakaProRevealScheduled = true;
    this.time.delayedCall(260, () => {
      this._sayakaProRevealScheduled = false;
      if (this.activeLocationId !== CENTRAL_TOKYO_LOCATIONS.drag.id ||
          sceneCutsceneActive(this) ||
          hasSeenCutscene(this.registry, 'proCircuitStrategistReveal')) return;

      playMangaCutscene(this, 'proCircuitStrategistReveal', {
        onComplete: () => this.renderLocation(this.activeLocationId),
      });
    });
    return true;
  }

  updateLocationHeaderForPhase(location) {
    const marketRoomLabel = this.autoMarketRoom === 'new' ? 'NEW CARS' : 'USED CARS';
    const ginzaRoomLabel = ['','MOTOR GALLERY','PRESTIGE SALON','PRIVATE VAULT'][this.ginzaRoom] || 'MOTOR GALLERY';
    const phaseLabel = (this.worldPhase || getWorldPhase()).toUpperCase();

    this.locationHeader?.setText(
      location?.kind === 'autoMarket'
        ? location.label + ' // ' + marketRoomLabel + ' // ' + phaseLabel
        : location?.kind === 'showroom'
          ? location.label + ' // ' + ginzaRoomLabel + ' // ' + phaseLabel
          : location.label + ' // ' + phaseLabel
    );
  }

  applyCentralBackgroundTexture(image, textureKey, location) {
    if (!image?.active || !textureKey || !this.textures.exists(textureKey)) return false;

    image.setTexture(textureKey);
    const source = this.textures.get(textureKey).getSourceImage();

    // Preserve the exact existing perspective rules: Auto Market art is
    // contained to show the full authored panel; Ginza and Drag keep the
    // original cover crop. Day/night changes only the texture.
    const scale = location?.kind === 'autoMarket'
      ? Math.min(STAGE.w / source.width, STAGE.h / source.height)
      : Math.max(STAGE.w / source.width, STAGE.h / source.height);

    image
      .setScale(scale)
      .setPosition(STAGE.x + STAGE.w / 2, STAGE.y + STAGE.h / 2);

    return true;
  }

  syncWorldPhaseBackground() {
    const nextPhase = getWorldPhase();
    if (nextPhase === this.worldPhase) return;

    this.worldPhase = nextPhase;
    const location = LOCATION_BY_ID[this.activeLocationId] || CENTRAL_TOKYO_LOCATIONS.autoMarket;
    const background = this.getLocationBackgroundConfig(location, nextPhase);
    this.updateLocationHeaderForPhase(location);

    if (
      !this.centralBackgroundImage?.active ||
      !background?.key ||
      !this.textures.exists(background.key)
    ) return;

    const image = this.centralBackgroundImage;
    this.tweens.killTweensOf(image);
    this.tweens.add({
      targets: image,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (!image?.active) return;
        this.applyCentralBackgroundTexture(image, background.key, location);
        this.tweens.add({
          targets: image,
          alpha: 1,
          duration: 260,
          ease: 'Quad.easeOut',
        });
      },
    });
  }

  drawBackground(location) {
    const background = this.getLocationBackgroundConfig(location);
    const textureKey = background?.key;

    this.addContent(this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x050b12,
      1
    ).setDepth(-11));

    if (textureKey && this.textures.exists(textureKey)) {
      const image = this.addContent(this.add.image(
        STAGE.x + STAGE.w / 2,
        STAGE.y + STAGE.h / 2,
        textureKey
      ).setDepth(-10));

      this.applyCentralBackgroundTexture(image, textureKey, location);
      this.centralBackgroundImage = image;
      this.centralBackgroundLocation = location.id;

      const maskShape = this.addContent(this.make.graphics({ add: false }));
      maskShape.fillStyle(0xffffff, 1);
      maskShape.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
      image.setMask(maskShape.createGeometryMask());
    } else {
      this.centralBackgroundImage = null;
      this.centralBackgroundLocation = null;
      this.addContent(this.add.text(
        STAGE.x + STAGE.w / 2,
        STAGE.y + STAGE.h / 2,
        'BACKGROUND READY FOR UPLOAD\n' + (background?.path || ''),
        {
          fontFamily: PIXEL_FONT,
          fontSize: '8px',
          color: '#547487',
          align: 'center',
        }
      ).setOrigin(0.5).setDepth(2));
    }

    this.addContent(this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x020812,
      location?.kind === 'autoMarket' ? 0.035 : 0.08
    ).setDepth(-8));
  }

  drawNavigation(title, subtitle) {
    const dragTheme = LOCATION_BY_ID[this.activeLocationId]?.kind === 'proDrag';
    this.addContent(this.add.text(SIDE.x + 20, SIDE.y + 18, title, {
      fontFamily: PIXEL_FONT,
      fontSize: '14px',
      color: dragTheme ? '#f0e9e9' : '#8fe7ff',
    }).setDepth(33));

    this.addContent(this.add.text(SIDE.x + 20, SIDE.y + 54, subtitle, {
      fontFamily: BODY_FONT,
      fontSize: '10px',
      color: dragTheme ? '#c6b7ba' : '#93aebd',
      fontStyle: '600',
      wordWrap: { width: SIDE.w - 40 },
    }).setDepth(33));

    // Central destinations are intentionally reached through the region map.
    // There are no shortcut buttons between Auto Market, Ginza and Drag.
    // Keep navigation as the final action in the side panel.
    const mapY = SIDE.y + 674;
    const mapButton = this.addContent(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      mapY,
      SIDE.w - 36,
      dragTheme ? 40 : 42,
      dragTheme ? 0x30181e : 0x102138,
      1
    ).setStrokeStyle(2, dragTheme ? 0xd54a54 : 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(33));

    this.addContent(this.add.text(
      SIDE.x + SIDE.w / 2,
      mapY,
      'GO TO MAP  >',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: '#eef8ff',
      }
    ).setOrigin(0.5).setDepth(34));

    mapButton.on('pointerdown', () => this.openMap());

    if (isArkonDen(this.registry) &&
        LOCATION_BY_ID[this.activeLocationId]?.kind !== 'proDrag') {
      const location = LOCATION_BY_ID[this.activeLocationId];
      const kind = location?.kind || 'autoMarket';
      // Ginza's standard-sized refresh control belongs on the main showroom
      // window, outside the right-pane details and away from the car.
      const ginzaRefresh = kind === 'showroom';
      const devX = ginzaRefresh
        ? STAGE.x + STAGE.w - 132 : SIDE.x + SIDE.w / 2;
      const devY = ginzaRefresh
        ? STAGE.y + 27 : SIDE.y + 176;
      const devWidth = ginzaRefresh ? 226 : SIDE.w - 36;
      const devButton = this.addContent(this.add.rectangle(
        devX, devY, devWidth, 36, 0x261629, 0.96
      ).setStrokeStyle(2, 0xd875ff, 0.95)
        .setInteractive({ useHandCursor: true }).setDepth(33));

      this.addContent(this.add.text(devX, devY,
        ginzaRefresh ? 'D) REFRESH CARS' : 'D) REFRESH AUTO MARKET', {
          fontFamily: PIXEL_FONT, fontSize: '8px', color: '#f0c8ff',
        }
      ).setOrigin(0.5).setDepth(34));

      devButton.on('pointerdown', () => this.devRefreshCentralLocation());
    }
  }

  devRefreshCentralLocation() {
    if (!isArkonDen(this.registry)) return;

    const location = LOCATION_BY_ID[this.activeLocationId];
    const kind = location?.kind || 'autoMarket';
    const key = kind === 'showroom' ? 'showroom' : kind === 'proDrag' ? 'proDrag' : 'autoMarket';
    const lengths = {
      autoMarket: Math.max(1, AUTO_MARKET_LISTINGS.length),
      showroom: Math.max(1, GINZA_LISTINGS.length),
      proDrag: Math.max(1, PRO_DRAG_EVENTS.length),
    };

    this.devCentralRefreshOffsets[key] =
      (Number(this.devCentralRefreshOffsets[key] || 0) + 1) % lengths[key];

    this.selectedIndex = 0;
    this.selectedEventIndex = 0;
    this.autoMarketShowcaseActive = false;
    this.autoMarketAnimateShowcase = false;
    this.ginzaShowcaseActive = false;
    this.ginzaAnimateShowcase = false;
    this.renderLocation(this.activeLocationId);
  }

  openMap() {
    showTravelMap(this, {
      currentLocationId: this.activeLocationId,
      title: 'TOKYO REGION MAP',
      actionVerb: 'DRIVE',
      allowCurrentAction: false,
      onHome: (workshopLocationId, cost) => this.returnToWorkshop(workshopLocationId, cost),
      onWorkshopUpgrade: (location, cost, alreadyUnlocked) =>
        this.upgradeWorkshopFromMap(location, cost, alreadyUnlocked),
      onTravel: (locationId, cost) => this.travelToLocation(locationId, cost),
    });
  }

  travelToLocation(locationId, cost = 0) {
    if (!canVisitDuringGinzaLoan(this.registry, locationId)) return;
    const target = getTravelLocation(locationId);
    if (!target) return;

    const cash = Number(this.registry.get('cash') || 0);
    if (cash < Number(cost || 0)) return;

    this.registry.set('cash', cash - Number(cost || 0));
    this.cashText?.setText(money(cash - Number(cost || 0)));

    if (LOCATION_BY_ID[locationId]) {
      this.renderLocation(locationId);
      return;
    }

    if (target.regionId === 'OSHIAGE') {
      this.registry.set('oshiageLocation', locationId);
      this.registry.set('district', 'OSHIAGE');
      saveSessionState(this.registry);
      this.scene.start('OshiageScene', { locationId });
      return;
    }

    this.registry.set('meetLocation', locationId);
    this.registry.set('district', target.regionId);
    saveSessionState(this.registry);
    this.scene.start('MeetScene');
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

    // Buying a workshop is a physical move: the player arrives there in the
    // car they were driving, so store that current car at the new property.
    if (selectedCarId && ownedCarIds.includes(selectedCarId)) {
      locations[selectedCarId] = location.id;
      this.registry.set('carGarageLocations', locations);
    }

    this.registry.set('meetStranded', false);
    saveSessionState(this.registry);
    this.cashText?.setText(money(cash - price));

    try {
      sessionStorage.setItem('tokyoShiftInternalReload', '1');
      sessionStorage.setItem('tokyoShiftForceGarage', '1');
      sessionStorage.removeItem('tokyoShiftBootMessage');
    } catch (e) {}

    window.location.reload();
  }

  returnToWorkshop(workshopLocationId = 'shinonomeWorkshop', cost = 500) {
    if (isGinzaLoanActive(this.registry)) return;
    const cash = Number(this.registry.get('cash') || 0);
    const requested = Math.max(0, Number(cost || 0));
    if (cash < requested) return;

    this.registry.set('cash', cash - requested);
    this.registry.set('workshopLocationId', workshopLocationId || 'shinonomeWorkshop');
    this.registry.set('meetStranded', false);
    saveSessionState(this.registry);

    try {
      sessionStorage.setItem('tokyoShiftInternalReload', '1');
      sessionStorage.setItem('tokyoShiftForceGarage', '1');
      sessionStorage.removeItem('tokyoShiftBootMessage');
    } catch (e) {}

    window.location.reload();
  }

  createCarDisplay(
    car,
    x,
    y,
    targetWidth,
    depth,
    paintColor = DEFAULT_PAINT_COLOR,
    _driverCharacter = null, // Legacy call slot; driver silhouettes retired.
    flipX = false,
    appearanceStateOverride = null
  ) {
    const bodyKey = getCarBodyTextureKey(this, car);
    const carState = appearanceStateOverride && typeof appearanceStateOverride === 'object'
      ? appearanceStateOverride
      : ((this.registry.get('carStates') || {})[car.id] || {});
    const wheelVisual = getVisualModWheelVisual(car, carState);

    if (
      !this.textures.exists(bodyKey) ||
      !wheelVisual?.wheelKey ||
      !this.textures.exists(wheelVisual.wheelKey)
    ) return [];

    const source = this.textures.get(bodyKey).getSourceImage();
    const wheelSource = this.textures.get(wheelVisual.wheelKey).getSourceImage();
    const bodyScale = getCarBodyScaleForWidth(this, car, targetWidth);
    const fit = getWheelPairFit(wheelVisual, bodyScale, flipX, wheelSource);
    const renderOffsetY = Number(car.visual.renderOffsetY || 0) * bodyScale;

    // Ginza hero assets are authored on slightly different vertical trims.
    // Treat the incoming y as a common presentation position and solve each
    // hero body's origin against the AE86 tyre-contact baseline at the same
    // width. This removes the up/down jump when cycling collector cars.
    let groundedBodyY = y;
    if (car.visual.singleBody && !car.visual.referenceStandard && cars.ae86 && car.id !== 'ae86') {
      const reference = cars.ae86;
      const referenceBodyKey = getCarBodyTextureKey(this, reference);
      if (
        this.textures.exists(referenceBodyKey) &&
        this.textures.exists(reference.visual.wheelKey)
      ) {
        const referenceSource = this.textures.get(referenceBodyKey).getSourceImage();
        const referenceWheelSource = this.textures.get(reference.visual.wheelKey).getSourceImage();
        const referenceBodyScale = targetWidth / referenceSource.width;
        const referenceFit = getWheelPairFit(
          reference.visual,
          referenceBodyScale,
          flipX,
          referenceWheelSource
        );
        const referenceRenderOffsetY =
          Number(reference.visual.renderOffsetY || 0) * referenceBodyScale;
        const referenceRearBottom =
          referenceFit.rear.offsetY +
          getWheelContactOffsetY(referenceWheelSource, referenceFit.rear.wheelScale);
        const referenceFrontBottom =
          referenceFit.front.offsetY +
          getWheelContactOffsetY(referenceWheelSource, referenceFit.front.wheelScale);
        const targetWheelBottom = reference.visual.referenceStandard
          ? y + targetWidth * (232 / 1200) // exact old-AE86 reference contact ratio
          : y + referenceRenderOffsetY +
            Math.max(referenceRearBottom, referenceFrontBottom);

        const rearBottomOffset =
          fit.rear.offsetY + getWheelContactOffsetY(wheelSource, fit.rear.wheelScale);
        const frontBottomOffset =
          fit.front.offsetY + getWheelContactOffsetY(wheelSource, fit.front.wheelScale);

        groundedBodyY =
          targetWheelBottom -
          renderOffsetY -
          Math.max(rearBottomOffset, frontBottomOffset);
      }
    }

    const displayY = groundedBodyY + renderOffsetY +
      (car.visual.referenceStandard ? targetWidth * (232 / 1200) : 0);
    const drawX = getReferenceRightX(car, x, bodyScale);

    const rearX = drawX + fit.rear.offsetX;
    const frontX = drawX + fit.front.offsetX;
    const rearY = displayY + fit.rear.offsetY;
    const frontY = displayY + fit.front.offsetY;

    const rearWheel = this.add.image(rearX, rearY, wheelVisual.wheelKey)
      .setScale(fit.rear.wheelScale)
      .setFlipX(flipX)
      .setData('carWheel', true)
      .setDepth(depth);
    const frontWheel = this.add.image(frontX, frontY, wheelVisual.wheelKey)
      .setScale(fit.front.wheelScale)
      .setFlipX(flipX)
      .setData('carWheel', true)
      .setDepth(depth);

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

    const tyreBottom = Math.max(
      rearY + getWheelContactOffsetY(wheelSource, fit.rear.wheelScale),
      frontY + getWheelContactOffsetY(wheelSource, fit.front.wheelScale)
    );
    const shadowHeight = Math.max(
      26,
      Math.max(rearWheel.displayHeight, frontWheel.displayHeight) * 0.36
    );
    const shadow = this.add.ellipse(
      x,
      tyreBottom + shadowHeight / 6,
      targetWidth * 0.92,
      shadowHeight,
      0x000000,
      0.72
    ).setDepth(depth - 0.1);
    const bodyLayers = createCarBodyLayers(this, car, {
      x: drawX,
      y: displayY,
      scale: bodyScale,
      depth: depth + 1,
      flipX,
      paintColor,
    });

    const visualModObjects = createVisualModLayers(this, car, carState, {
      x: drawX,
      y: displayY,
      scale: bodyScale,
      depth: depth + 1.005,
      paintColor,
      bodyLayers,
      flipX,
    });

    return [
      rearBacking,
      frontBacking,
      shadow,
      rearWheel,
      frontWheel,
      ...bodyLayers.objects,
      ...visualModObjects,
    ];
  }

  getAutoMarketCycle() {
    return Math.floor(Date.now() / (3 * 60 * 60 * 1000));
  }

  marketHash(value) {
    const text = String(value || '');
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  rotateMarketPool(pool = [], salt = 0) {
    if (!pool.length) return [];
    const cycle = this.getAutoMarketCycle();
    const dev = Number(this.devCentralRefreshOffsets?.autoMarket || 0);
    const offset = (cycle * 3 + salt + dev) % pool.length;
    return [...pool.slice(offset), ...pool.slice(0, offset)];
  }

  getAllNewCarListings() {
    const owned = this.registry.get('ownedCarIds') || [];
    const pool = AUTO_MARKET_LISTINGS.filter(item => cars[item.carId]);
    const rotated = this.rotateMarketPool(pool, 0);
    const claimable = rotated.filter(item =>
      canRedeemCarCoupon(this.registry, item.carId)
    );
    const unowned = rotated.filter(item =>
      !ownsCarModel(owned, item.carId) && !claimable.includes(item)
    );
    const alreadyOwned = rotated.filter(item =>
      ownsCarModel(owned, item.carId) && !claimable.includes(item)
    );
    return [...claimable, ...unowned, ...alreadyOwned]
      .map(item => {
        const paintColor = getFactoryPaintColor(item.carId,
          this.marketHash(this.getAutoMarketCycle() + ':' + item.carId + ':new')) ?? 0xffffff;
        const standardPrice = getAutoMarketBasePrice(item.carId);
        const price = applyMarketPriceDifficulty(this.registry, standardPrice, 'new');
        return {
          ...item,
          marketType: 'new',
          buildLabel: 'FACTORY STOCK',
          price,
          standardPrice,
          listPrice: standardPrice,
          paintColor,
          previewState: getNewCarState(item.carId, paintColor),
          conditionLabel: 'NEW // FACTORY STOCK',
        };
      });
  }

  getNewCarListings() {
    const all = this.getAllNewCarListings();
    const pages = Math.max(1, Math.ceil(all.length / 3));
    const page = Math.min(Math.max(0, this.newCarStockPage || 0), pages - 1);
    return all.slice(page * 3, page * 3 + 3);
  }

  // Browse every stock model without changing the existing 3-car showroom.
  // Only the next page's assets are loaded, avoiding a huge mobile preload.
  browseNewCarStock(delta) {
    if (this.autoMarketRoom !== 'new' || this.autoMarketTransitioning) return;
    const all = this.getAllNewCarListings();
    const pages = Math.ceil(all.length / 3);
    if (pages <= 1) return;
    const current = Math.min(Math.max(0, this.newCarStockPage || 0), pages - 1);
    const next = (current + delta + pages) % pages;
    const nextListings = all.slice(next * 3, next * 3 + 3);

    this.autoMarketTransitioning = true;
    const blocker = this.add.rectangle(780, 420, 1560, 840, 0x020811, 0.66)
      .setDepth(180).setInteractive();
    const loading = this.add.text(780, 420, 'LOADING NEW CAR STOCK', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#b4eafa',
    }).setOrigin(0.5).setDepth(181);
    const dismiss = () => { blocker.destroy(); loading.destroy(); };
    const finish = () => {
      if (!this.scene.isActive()) { dismiss(); return; }
      // Keep the existing page if an image download failed.
      const ready = nextListings.every(item => {
        const car = cars[item.carId];
        const key = getCarBodyTextureKey(this, car);
        return this.textures.exists(key) &&
          this.textures.exists(car.visual.wheelKey);
      });
      if (ready) {
        this.newCarStockPage = next;
        this.selectedIndex = 0;
        this.autoMarketShowcaseActive = false;
        this.autoMarketAnimateShowcase = false;
        this.renderLocation(this.activeLocationId);
      } else {
        console.warn('[Tokyo SHIFT] New Car stock could not load. Retaining current page.');
      }
      dismiss();
      this.autoMarketTransitioning = false;
    };

    let queued = 0;
    for (const listing of nextListings) {
      const car = cars[listing.carId];
      if (!car) continue;
      queued += preloadCarAppearanceAssets(this, { [listing.carId]: car }, '20261012-r488');
      queued += preloadCarWheel(this, car);
    }
    if (queued > 0) {
      this.load.once('complete', finish);
      this.load.start();
    } else {
      finish();
    }
  }

  getHaggleRecord(key) {
    return (this.registry.get('autoMarketHaggles') || {})[String(key || '')] || null;
  }

  getUsedCarListings() {
    const owned = this.registry.get('ownedCarIds') || [];
    const pool = AUTO_MARKET_LISTINGS.filter(item => cars[item.carId]);
    const rotated = this.rotateMarketPool(pool, 7);
    const unowned = rotated.filter(item => !ownsCarModel(owned, item.carId));
    const alreadyOwned = rotated.filter(item => ownsCarModel(owned, item.carId));
    const conditionLabels = [
      'CLEAN STREET CAR',
      'WEEKEND BUILD',
      'SHOP DEMO',
      'ONE OWNER',
      'STREET TUNED',
      'QUICK SALE',
    ];

    return [...unowned, ...alreadyOwned]
      .slice(0, 3)
      .map((item, index) => {
        const cycle = this.getAutoMarketCycle();
        const seed = this.marketHash(cycle + ':' + item.carId + ':used');
        const isDeal = ((cycle + index + (seed % 3)) % 7) === 0;
        const percent = isDeal
          ? 74 + ((seed >>> 8) % 9)
          : 88 + ((seed >>> 8) % 23);
        const standardListPrice = Math.max(
          100000,
          Math.round(
            (Number(item.price || getAutoMarketBasePrice(item.carId)) * percent / 100) / 10000
          ) * 10000
        );
        const paintColor = selectMixedCarPaint(item.carId, {seed, region:'DEFAULT'})?.color ??
          getFactoryPaintColor(item.carId, seed) ??
          RIVAL_PAINT_COLORS[seed % RIVAL_PAINT_COLORS.length];
        const visualMods = { bodyKit: 'stock' };
        const previewState = {
          ...getAutoMarketBuild(item.carId),
          paintColor,
          visualMods,
          acquiredVia: 'tokyoAutoMarketUsed',
        };
        const haggleKey = cycle + ':' + item.carId;
        const haggle = this.getHaggleRecord(haggleKey);

        const negotiatedStandardPrice = Math.max(
          0,
          Number(haggle?.price || standardListPrice)
        );
        const price = applyMarketPriceDifficulty(
          this.registry,
          negotiatedStandardPrice,
          'used'
        );

        return {
          ...item,
          marketType: 'used',
          listPrice: standardListPrice,
          standardPrice: negotiatedStandardPrice,
          price,
          paintColor,
          previewState,
          haggleKey,
          haggle,
          isDeal,
          conditionLabel: isDeal
            ? 'QUICK SALE // GOOD DEAL'
            : conditionLabels[(seed >>> 12) % conditionLabels.length],
        };
      });
  }

  getAutoMarketListings() {
    return this.autoMarketRoom === 'new'
      ? this.getNewCarListings()
      : this.getUsedCarListings();
  }

  drawAutoMarketRoomTabs() {
    const tabs = [
      { id: 'new', label: 'NEW CARS' },
      { id: 'used', label: 'USED CARS' },
    ];
    const startX = SIDE.x + 32;
    const width = 140;
    const gap = 12;
    const y = SIDE.y + 128;

    tabs.forEach((tab, index) => {
      const active = tab.id === this.autoMarketRoom;
      const x = startX + width / 2 + index * (width + gap);
      const box = this.addContent(this.add.rectangle(
        x, y, width, 38, active ? 0x123047 : 0x0c1823, 1
      ).setStrokeStyle(
        active ? 2 : 1,
        active ? 0x43dfff : 0x315470,
        1
      ).setDepth(35).setInteractive({ useHandCursor: true }));

      this.addContent(this.add.text(x, y, tab.label, {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: active ? '#ffffff' : '#95adbb',
      }).setOrigin(0.5).setDepth(36));

      box.on('pointerdown', () => this.selectAutoMarketRoom(tab.id));
    });
  }

  selectAutoMarketRoom(room) {
    if (!['new', 'used'].includes(room)) return;
    if (this.autoMarketTransitioning) return;

    this.autoMarketRoom = room;
    this.registry.set('autoMarketRoom', room);
    this.selectedIndex = 0;
    this.newCarStockPage = 0;
    this.autoMarketShowcaseActive = false;
    this.autoMarketAnimateShowcase = false;
    this.wheelPreviewActive = false;
    this.wheelAnimatePreview = false;
    saveSessionState(this.registry);
    this.renderLocation(this.activeLocationId);
  }

  drawAutoMarket() {
    const subtitles = {
      new: 'FACTORY STOCK // ORIGINAL MANUFACTURER COLOURS',
      used: 'MIXED FINISHES // FACTORY · STREET · SHOW CAR',
    };

    this.drawNavigation('TOKYO AUTO MARKET', subtitles[this.autoMarketRoom]);
    this.drawAutoMarketRoomTabs();

    this.drawMarketCarRoom(this.autoMarketRoom);
    this.drawAutoMarketStaff();
  }

  drawAutoMarketStaff() {
    const room = this.autoMarketRoom;
    const characterId = CENTRAL_TOKYO_CHARACTER_IDS.autoMarket[room];
    const placements = {
      new: {
        x: STAGE.x + STAGE.w - 58,
        feetY: STAGE.y + 506,
        height: 218,
        flip: true,
      },
      used: {
        x: STAGE.x + 62,
        feetY: STAGE.y + 506,
        height: 218,
        flip: false,
      },
      wheels: {
        x: STAGE.x + STAGE.w - 68,
        feetY: STAGE.y + 508,
        height: 224,
        flip: true,
      },
    };
    const placement = placements[room];
    if (!characterId || !placement) return;

    this.addVenueCharacter({
      characterId,
      pose: 'normal',
      ...placement,
      depth: 25,
    });
  }

  getMarketBayPoses(room = 'new') {
    const y = room === 'new'
      ? STAGE.y + 300
      : STAGE.y + 318;
    const rightX = room === 'used' ? 0.795 : 0.78;

    return [
      { x: STAGE.x + STAGE.w * 0.22, y, w: 242, depth: 9, flip: false },
      { x: STAGE.x + STAGE.w * 0.50, y, w: 242, depth: 10, flip: false },
      { x: STAGE.x + STAGE.w * rightX, y, w: 242, depth: 9, flip: false },
    ];
  }

  shiftMarketCarArtwork(objects = [], deltaY = 0) {
    if (!deltaY) return;

    objects.forEach((object, index) => {
      // createCarDisplay returns the ground shadow at index 2. Keep that
      // exactly where it is while moving the actual parked car downward.
      if (index === 2) return;
      if (object && Number.isFinite(object.y)) object.y += deltaY;
    });
  }

  drawMarketCarRoom(room) {
    const listings = room === 'new' ? this.getNewCarListings() : this.getUsedCarListings();
    if (!listings.length) return;

    this.selectedIndex = Phaser.Math.Clamp(this.selectedIndex, 0, listings.length - 1);
    const poses = this.getMarketBayPoses(room);

    listings.forEach((listing, index) => {
      if (this.autoMarketShowcaseActive && index === this.selectedIndex) return;

      const car = cars[listing.carId];
      const pose = poses[index];
      const objects = this.createCarDisplay(
        car,
        pose.x,
        pose.y,
        pose.w,
        pose.depth,
        listing.paintColor,
        null,
        pose.flip,
        listing.previewState
      );
      const artworkShiftY = room === 'new' ? 14 : 12;
      this.shiftMarketCarArtwork(objects, artworkShiftY);

      objects.forEach(obj => this.addContent(obj));

      const hit = this.addContent(this.add.rectangle(
        pose.x,
        pose.y + artworkShiftY,
        pose.w,
        Math.max(104, pose.w * 0.38),
        0x000000,
        0.001
      ).setDepth(31).setInteractive({ useHandCursor: true }));
      hit.on('pointerdown', () => this.transitionAutoMarketCar(index));
    });

    if (this.autoMarketShowcaseActive) {
      const listing = listings[this.selectedIndex];
      const car = cars[listing.carId];
      const objects = this.createCarDisplay(
        car,
        STAGE.x + STAGE.w * 0.51,
        STAGE.y + 350,
        640,
        16,
        listing.paintColor,
        null,
        false,
        listing.previewState
      );
      objects.forEach(obj => this.addContent(obj));

      if (this.autoMarketAnimateShowcase) {
        this.autoMarketAnimateShowcase = false;
        this.animateMarketCarIn(objects);
      }

      const dismiss = this.addContent(this.add.text(
        STAGE.x + STAGE.w - 22,
        STAGE.y + 22,
        '×  BACK TO ' + (room === 'new' ? 'NEW CARS' : 'USED CARS'),
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: '#e4f2f8',
          backgroundColor: '#07111bdd',
          padding: { x: 11, y: 8 },
        }
      ).setOrigin(1, 0).setDepth(42).setInteractive({ useHandCursor: true }));
      dismiss.on('pointerdown', () => this.transitionAutoMarketCar(null));
    }

    this.addContent(this.add.text(
      CARDS.x + 18,
      CARDS.y + 14,
      room === 'new'
        ? 'NEW CARS // 3 ON DISPLAY // BROWSE ALL MODELS'
        : 'USED CARS // 3 AVAILABLE // ROTATES 3H',
      { fontFamily: PIXEL_FONT, fontSize: '9px', color: '#8fe7ff' }
    ).setDepth(33));

    if (room === 'new') {
      const pages = Math.max(1, Math.ceil(this.getAllNewCarListings().length / 3));
      const current = Math.min(Math.max(0, this.newCarStockPage || 0), pages - 1);
      this.addContent(this.add.text(
        CARDS.x + 728, CARDS.y + 17,
        'PAGE ' + (current + 1) + '/' + pages,
        { fontFamily: PIXEL_FONT, fontSize: '7px', color: '#d6ebf4' }
      ).setDepth(34));
      const pageButton = (x, title, delta) => {
        const button = this.addContent(this.add.rectangle(
          x, CARDS.y + 23, 94, 37, 0x102838, 1
        ).setStrokeStyle(2, 0x58afce, 1).setDepth(34)
          .setInteractive({ useHandCursor: true }));
        this.addContent(this.add.text(x, CARDS.y + 23, title, {
          fontFamily: PIXEL_FONT, fontSize: '7px', color: '#e7f8ff',
        }).setOrigin(0.5).setDepth(35));
        button.on('pointerdown', () => this.browseNewCarStock(delta));
      };
      pageButton(CARDS.x + 945, 'PREV', -1);
      pageButton(CARDS.x + 1060, 'NEXT', 1);
    }

    listings.forEach((listing, index) => {
      const car = cars[listing.carId];
      const x = CARDS.x + 190 + index * 365;
      const selected = this.autoMarketShowcaseActive && index === this.selectedIndex;
      const modelOwnedCount = countOwnedCarModel(
        this.registry.get('ownedCarIds') || [],
        listing.carId
      );
      const box = this.addContent(this.add.rectangle(
        x,
        CARDS.y + 104,
        340,
        116,
        selected ? 0x123047 : 0x0b1724,
        1
      ).setStrokeStyle(selected ? 2 : 1, selected ? 0x43dfff : 0x315470, 1)
        .setInteractive({ useHandCursor: true }).setDepth(32));

      this.addContent(this.add.text(x - 145, CARDS.y + 70, car.shortName, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#ffffff',
      }).setDepth(34));

      this.addContent(this.add.text(
        x - 145,
        CARDS.y + 98,
        room === 'new' ? 'FACTORY STOCK' : listing.conditionLabel,
        {
          fontFamily: BODY_FONT,
          fontSize: '9px',
          color: room === 'used' && listing.isDeal ? '#83efc8' : '#91a9b8',
          fontStyle: '600',
        }
      ).setDepth(34));

      this.addContent(this.add.text(
        x + 145,
        CARDS.y + 139,
        modelOwnedCount > 0 ? 'OWNED ×' + modelOwnedCount : money(listing.price),
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: modelOwnedCount > 0 ? '#62e8c7' : '#ffe08a',
        }
      ).setOrigin(1, 0.5).setDepth(34));

      box.on('pointerdown', () => this.transitionAutoMarketCar(index));
    });

    this.drawAutoMarketSide(listings[this.selectedIndex], room);
  }

  animateMarketCarIn(objects = []) {
    const movable = objects.filter(obj =>
      obj && typeof obj.x === 'number' && typeof obj.setPosition === 'function'
    );

    movable.forEach(obj => {
      const targetX = obj.x;
      obj.x = targetX - 620;
      obj.setAlpha?.(1);
      this.tweens.add({ targets: obj, x: targetX, duration: 1500, ease: 'Sine.easeOut' });

      if (obj.getData?.('carWheel')) {
        this.tweens.add({
          targets: obj,
          angle: obj.angle + 620,
          duration: 1500,
          ease: 'Sine.easeOut',
        });
      }
    });
  }

  transitionAutoMarketCar(nextIndex = null) {
    if (this.autoMarketTransitioning) return;
    this.autoMarketTransitioning = true;

    const fade = this.add.rectangle(780, 420, 1560, 840, 0x020307, 0)
      .setDepth(180).setInteractive();

    this.tweens.add({
      targets: fade,
      alpha: 0.97,
      duration: 210,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (nextIndex === null) {
          this.autoMarketShowcaseActive = false;
          this.autoMarketAnimateShowcase = false;
        } else {
          this.selectedIndex = nextIndex;
          this.autoMarketShowcaseActive = true;
          this.autoMarketAnimateShowcase = true;
        }

        this.renderLocation(this.activeLocationId);

        this.tweens.add({
          targets: fade,
          alpha: 0,
          duration: 280,
          ease: 'Quad.easeOut',
          onComplete: () => {
            fade.destroy();
            this.autoMarketTransitioning = false;
          },
        });
      },
    });
  }

  drawAutoMarketSide(listing, room) {
    const car = cars[listing.carId];
    const displaySpec = (() => {
      if (room !== 'used') return car;
      const engineBuild = applyEngineTuning(
        car,
        engines[car.engine],
        listing.previewState || {}
      );
      return applySecondaryTuning(
        engineBuild.car,
        engineBuild.engine,
        listing.previewState || {}
      ).car;
    })();
    const ratingState = room === 'used'
      ? { ...(listing.previewState || {}), stock: false }
      : { stock: true };
    const ratingDisplay = getPowerTorqueDisplay(car, ratingState, displaySpec);
    const ownedCars = this.registry.get('ownedCarIds') || [];
    const modelOwnedCount = countOwnedCarModel(ownedCars, listing.carId);
    const cash = Number(this.registry.get('cash') || 0);
    const capacity = getGarageCapacity(this.registry.get('garageTier') || 0);
    const ownedCount = ownedCars.length;
    const hasStorage = Boolean(this.findStorageForPurchase());

    const couponRequired = getCarCouponRequirement(listing.carId);
    const couponCount = getCarCouponCount(this.registry, listing.carId);
    const couponReady = room === 'new' && canRedeemCarCoupon(this.registry, listing.carId);
    const canBuyWithCash = cash >= listing.price && ownedCount < capacity && hasStorage;
    const canClaimWithCoupons = couponReady && ownedCount < capacity && hasStorage;
    const canBuy = canBuyWithCash || canClaimWithCoupons;

    const y0 = SIDE.y + 224;

    this.addContent(this.add.text(
      SIDE.x + 20,
      y0,
      room === 'new' ? 'NEW CAR // FACTORY STOCK' : 'USED CAR // ' + listing.conditionLabel,
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: room === 'used' && listing.isDeal ? '#62e8c7' : '#8cc8ec',
        wordWrap: { width: SIDE.w - 40 },
      }
    ).setDepth(34));

    this.addContent(this.add.text(SIDE.x + 20, y0 + 38, car.name.toUpperCase(), {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#ffffff',
      wordWrap: { width: SIDE.w - 40 },
    }).setDepth(34));

    this.addContent(this.add.text(
      SIDE.x + 20,
      y0 + 84,
      (room === 'new' ? 'STOCK SPEC' : listing.buildLabel) + '\n' +
      car.engineModel + '\n' +
      ratingDisplay.powerLabel + '  //  ' +
      ratingDisplay.torqueLabel + '\n' +
      Math.round(displaySpec.vehicleMassKg) + ' kg',
      {
        fontFamily: BODY_FONT,
        fontSize: '10px',
        color: '#9ab0bd',
        fontStyle: '600',
        lineSpacing: 3,
        wordWrap: { width: SIDE.w - 40 },
      }
    ).setDepth(34));

    const marketMultiplier = getMarketPriceMultiplier(this.registry, room);
    const standardPrice = Number(listing.standardPrice || listing.price || 0);
    const priceLabel = marketMultiplier < 1
      ? 'EASY PRICE  ' + money(listing.price) + '  //  STANDARD ' + money(standardPrice)
      : (room === 'new' ? 'STANDARD PRICE  ' : 'ASKING  ') + money(listing.price);

    this.addContent(this.add.text(
      SIDE.x + 20,
      y0 + 172,
      priceLabel,
      {
        fontFamily: PIXEL_FONT,
        fontSize: marketMultiplier < 1 ? '7px' : '9px',
        color: '#ffe08a',
        wordWrap: { width: SIDE.w - 40 },
      }
    ).setDepth(34));

    if (room === 'new') {
      this.addContent(this.add.text(
        SIDE.x + 20,
        y0 + 208,
        'CAR COUPONS  ' + couponCount + ' / ' + couponRequired +
          (couponReady ? '  //  READY' : ''),
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: couponReady ? '#62e8c7' : '#8cc8ec',
        }
      ).setDepth(34));
    } else {
      const haggle = listing.haggle;
      const haggleText = haggle
        ? haggle.status === 'accepted'
          ? 'OFFER ACCEPTED // ' + money(listing.price)
          : haggle.status === 'countered'
            ? 'SELLER COUNTER // ' + money(listing.price)
            : 'OFFER REJECTED // PRICE FIRM'
        : 'ONE BARGAIN ATTEMPT AVAILABLE';

      this.addContent(this.add.text(
        SIDE.x + 20,
        y0 + 208,
        haggleText,
        {
          fontFamily: PIXEL_FONT,
          fontSize: '6px',
          color: haggle?.status === 'rejected' ? '#ff9aa8' : '#83efc8',
          wordWrap: { width: SIDE.w - 40 },
        }
      ).setDepth(34));

      const offerAvailable = !haggle;
      const offerButton = this.addContent(this.add.rectangle(
        SIDE.x + SIDE.w / 2,
        SIDE.y + 488,
        SIDE.w - 36,
        40,
        offerAvailable ? 0x1f2435 : 0x17181d,
        1
      ).setStrokeStyle(1, offerAvailable ? 0xa58cff : 0x514f55, 1).setDepth(33));

      this.addContent(this.add.text(
        SIDE.x + SIDE.w / 2,
        SIDE.y + 488,
        offerAvailable ? 'MAKE OFFER' : haggle ? 'BARGAIN USED' : 'NO OFFER',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: offerAvailable ? '#e8ddff' : '#817d84',
        }
      ).setOrigin(0.5).setDepth(34));

      if (offerAvailable) {
        offerButton.setInteractive({ useHandCursor: true });
        offerButton.on('pointerdown', () => this.showHaggleDialog(listing));
      }

      this.drawUsedSellButton();
    }

    const buyButton = this.addContent(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 608,
      SIDE.w - 36,
      48,
      canBuy ? 0x0d2b29 : 0x17181d,
      1
    ).setStrokeStyle(2, canBuy ? 0x62e8c7 : 0x514f55, 1).setDepth(33));

    const buyLabel = !hasStorage || ownedCount >= capacity
      ? 'GARAGE FULL'
      : canClaimWithCoupons
        ? (modelOwnedCount > 0 ? 'CLAIM ANOTHER // ' : 'CLAIM // ') + couponRequired + ' COUPONS'
        : cash < listing.price
          ? 'NEED ' + money(listing.price)
          : (modelOwnedCount > 0 ? 'BUY ANOTHER // ' : 'BUY // ') + money(listing.price);

    this.addContent(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 608,
      buyLabel,
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: canBuy ? '#f1fffb' : '#817d84',
      }
    ).setOrigin(0.5).setDepth(34));

    if (canBuy) {
      buyButton.setInteractive({ useHandCursor: true });
      buyButton.on('pointerdown', () => {
        const carName = car?.shortName || car?.name || 'this car';
        const useCoupons = canClaimWithCoupons;
        this.showTransactionConfirm({
          title: useCoupons ? 'CONFIRM CLAIM' : 'CONFIRM PURCHASE',
          message: useCoupons
            ? 'Claim ' + carName + ' using ' + couponRequired + ' car coupons?'
            : 'Buy ' + carName + ' for ' + money(listing.price) + '?',
          confirmLabel: useCoupons ? 'CLAIM CAR' : 'BUY CAR',
          accent: 0x62e8c7,
          onConfirm: () => {
            const carName = car?.shortName || car?.name || listing.carId;
            showGarageDeliveryPicker(this, {
              // Incoming purchases always consume a new slot, even when this
              // model is already represented elsewhere in the collection.
              carId: null,
              carName,
              title: useCoupons ? 'CHOOSE CLAIM DELIVERY' : 'CHOOSE PURCHASE DELIVERY',
              message: 'Select the garage where this car should be delivered.',
              onSelect: workshopId => this.buyAutoMarketCar(listing, workshopId),
            });
          },
        });
      });
    }
  }

  drawUsedSellButton() {
    const selectedCarId = this.registry.get('selectedCarId');
    const ownedCars = this.registry.get('ownedCarIds') || [];
    const selectedCar = cars[selectedCarId];
    const selectedState = (this.registry.get('carStates') || {})[selectedCarId] || {};
    const collectorLocked = Boolean(
      selectedCar?.tuningLocked ||
      selectedState.collector ||
      selectedState.immutable ||
      selectedCar?.crewLoan ||
      selectedState.crewLoan ||
      selectedCar?.nonTradeable ||
      selectedState.nonTradeable
    );
    const starterOnly = Boolean(
      ownedCars.length === 1 &&
      selectedCarId &&
      selectedCarId === this.registry.get('starterCarId')
    );
    const canSell = Boolean(
      selectedCarId && selectedCar && ownedCars.length > 1 && !collectorLocked
    );
    const sellPrice = canSell ? getAutoMarketSellPrice(selectedCarId, selectedState) : 0;

    const sellButton = this.addContent(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 548,
      SIDE.w - 36,
      40,
      canSell ? 0x261922 : 0x17181d,
      1
    ).setStrokeStyle(1, canSell ? 0xff7cac : 0x514f55, 1).setDepth(33));

    this.addContent(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 548,
      canSell
        ? 'SELL ' + selectedCar.shortName + ' // ' + money(sellPrice)
        : collectorLocked
          ? (selectedCar?.crewLoan || selectedState.crewLoan
              ? 'CREW LOAN // NOT FOR SALE'
              : 'COLLECTOR CAR NOT TRADED')
          : starterOnly
            ? 'ONLY CAR // NOT FOR SALE'
            : 'KEEP AT LEAST ONE CAR',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: canSell ? '#ffc0d7' : '#817d84',
      }
    ).setOrigin(0.5).setDepth(34));

    if (canSell) {
      sellButton.setInteractive({ useHandCursor: true });
      sellButton.on('pointerdown', () => {
        const carName = selectedCar.shortName || selectedCar.name || 'this car';
        this.showTransactionConfirm({
          title: 'CONFIRM SALE',
          message: 'Sell ' + carName + ' for ' + money(sellPrice) +
            '?\n\nPurchased wheel designs remain in your wheel collection.',
          confirmLabel: 'SELL CAR',
          accent: 0xff7cac,
          onConfirm: () => this.sellSelectedCar(selectedCarId, sellPrice),
        });
      });
    }
  }

  showHaggleDialog(listing) {
    if (!listing?.haggleKey || this.getHaggleRecord(listing.haggleKey)) return;
    if (this.transactionConfirmOpen) return;
    this.transactionConfirmOpen = true;

    const depth = 245;
    const objects = [];
    const add = obj => {
      objects.push(obj);
      return obj;
    };
    const close = () => {
      objects.forEach(obj => obj?.destroy?.());
      this.transactionConfirmOpen = false;
    };

    add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.82)
      .setDepth(depth).setInteractive());
    add(this.add.rectangle(780, 420, 760, 390, 0x09131d, 1)
      .setStrokeStyle(3, 0xa58cff, 0.95).setDepth(depth + 1));
    add(this.add.text(780, 292, 'MAKE AN OFFER', {
      fontFamily: PIXEL_FONT,
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(depth + 2));
    add(this.add.text(
      780,
      342,
      cars[listing.carId].shortName + ' // ASKING ' + money(listing.price) +
        '\nOne attempt. ' +
        (getMarketPriceMultiplier(this.registry, 'used') < 1
          ? 'Easy driver discount remains after bargaining.'
          : 'A rejected offer makes the listed price firm.'),
      {
        fontFamily: BODY_FONT,
        fontSize: '13px',
        color: '#bfd0da',
        fontStyle: '600',
        align: 'center',
        lineSpacing: 5,
      }
    ).setOrigin(0.5).setDepth(depth + 2));

    const offers = [
      { label: 'SAFE  -5%', discount: 0.05, accept: 0.80, counter: 0.15 },
      { label: 'PUSH  -10%', discount: 0.10, accept: 0.48, counter: 0.35 },
      { label: 'LOWBALL  -15%', discount: 0.15, accept: 0.22, counter: 0.38 },
    ];

    offers.forEach((offer, index) => {
      const x = 545 + index * 235;
      const button = add(this.add.rectangle(
        x, 462, 205, 64, 0x151d2c, 1
      ).setStrokeStyle(
        2,
        index === 0 ? 0x62e8c7 : index === 1 ? 0xffd06a : 0xff7cac,
        1
      ).setDepth(depth + 2).setInteractive({ useHandCursor: true }));

      add(this.add.text(x, 462, offer.label, {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(depth + 3));

      button.on('pointerdown', () => {
        const roll = Math.random();
        let status = 'rejected';
        let finalStandardPrice = listing.listPrice;

        if (roll < offer.accept) {
          status = 'accepted';
          finalStandardPrice = Math.round(
            listing.listPrice * (1 - offer.discount) / 10000
          ) * 10000;
        } else if (roll < offer.accept + offer.counter) {
          status = 'countered';
          finalStandardPrice = Math.round(
            listing.listPrice * (1 - offer.discount * 0.5) / 10000
          ) * 10000;
        }

        const finalPrice = applyMarketPriceDifficulty(
          this.registry,
          finalStandardPrice,
          'used'
        );

        const current = { ...(this.registry.get('autoMarketHaggles') || {}) };
        current[listing.haggleKey] = {
          status,
          price: finalStandardPrice,
          attemptedAt: Date.now(),
        };

        const entries = Object.entries(current)
          .sort((a, b) =>
            Number(b[1]?.attemptedAt || 0) - Number(a[1]?.attemptedAt || 0)
          )
          .slice(0, 18);
        this.registry.set('autoMarketHaggles', Object.fromEntries(entries));
        saveSessionState(this.registry);
        close();
        this.renderLocation(this.activeLocationId);

        const title = status === 'accepted'
          ? 'OFFER ACCEPTED'
          : status === 'countered'
            ? 'COUNTER OFFER'
            : 'OFFER REJECTED';
        const message = status === 'rejected'
          ? 'Seller stays at ' + money(listing.price) + '. The price is now firm.'
          : 'New price: ' + money(finalPrice);

        this.showTransactionConfirm({
          title,
          message,
          confirmLabel: 'OK',
          accent: status === 'rejected' ? 0xff7cac : 0x62e8c7,
          onConfirm: () => {},
        });
      });
    });

    const cancel = add(this.add.text(780, 548, 'CANCEL', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#9fb0ba',
      backgroundColor: '#121820',
      padding: { x: 18, y: 9 },
    }).setOrigin(0.5).setDepth(depth + 3).setInteractive({ useHandCursor: true }));
    cancel.on('pointerdown', close);
  }

  showTransactionConfirm({
    title = 'CONFIRM',
    message = '',
    confirmLabel = 'CONFIRM',
    accent = 0x62e8c7,
    onConfirm = null,
  } = {}) {
    if (this.transactionConfirmOpen) return;
    this.transactionConfirmOpen = true;

    const depth = 240;
    const objects = [];
    const add = obj => {
      objects.push(obj);
      return obj;
    };
    const close = () => {
      objects.forEach(obj => obj?.destroy?.());
      this.transactionConfirmOpen = false;
    };

    const blocker = add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.78)
      .setDepth(depth)
      .setInteractive());

    add(this.add.rectangle(780, 420, 620, 330, 0x09131d, 1)
      .setStrokeStyle(3, accent, 0.95)
      .setDepth(depth + 1));

    add(this.add.text(780, 318, String(title).toUpperCase(), {
      fontFamily: PIXEL_FONT,
      fontSize: '14px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5).setDepth(depth + 2));

    add(this.add.text(780, 392, message, {
      fontFamily: BODY_FONT,
      fontSize: '15px',
      color: '#c9d8df',
      fontStyle: '600',
      align: 'center',
      lineSpacing: 6,
      wordWrap: { width: 520 },
    }).setOrigin(0.5).setDepth(depth + 2));

    const cancel = add(this.add.rectangle(640, 512, 230, 52, 0x151c25, 1)
      .setStrokeStyle(2, 0x657783, 1)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true }));
    add(this.add.text(640, 512, 'CANCEL', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#d9e6ec',
    }).setOrigin(0.5).setDepth(depth + 3));

    const confirm = add(this.add.rectangle(920, 512, 230, 52, 0x102822, 1)
      .setStrokeStyle(2, accent, 1)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true }));
    add(this.add.text(920, 512, String(confirmLabel).toUpperCase(), {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(depth + 3));

    blocker.on('pointerdown', () => {});
    cancel.on('pointerdown', close);
    confirm.on('pointerdown', () => {
      close();
      onConfirm?.();
    });
  }

  findStorageForPurchase() {
    const owned = this.registry.get('ownedCarIds') || [];
    const locations = this.registry.get('carGarageLocations') || {};
    const activeId = this.registry.get('workshopLocationId') || 'shinonomeWorkshop';
    const unlocked = getUnlockedWorkshops(this.registry.get('garageTier') || 0);

    const ordered = [
      ...unlocked.filter(item => item.id === activeId),
      ...unlocked.filter(item => item.id !== activeId),
    ];

    return ordered.find(workshop =>
      getWorkshopUsage(owned, locations, workshop.id) < getWorkshopStorageCapacity(workshop.id)
    )?.id || null;
  }

  buyAutoMarketCar(listing, storageId = null) {
    const owned = [...(this.registry.get('ownedCarIds') || [])];
    if (!listing?.carId) return;

    const historicalIds = (this.registry.get('carHistory') || [])
      .map(entry => entry?.carId)
      .filter(Boolean);
    const instanceId = createAndRegisterOwnedCarInstance(
      owned,
      listing.carId,
      historicalIds
    );
    if (!instanceId) return;

    const cash = Number(this.registry.get('cash') || 0);
    const couponRequired = getCarCouponRequirement(listing.carId);
    const couponCount = getCarCouponCount(this.registry, listing.carId);
    const useCoupons = listing.marketType === 'new' && couponCount >= couponRequired;

    if (!useCoupons && cash < Number(listing.price || 0)) return;

    const delivery = getGarageDeliveryOptions(this, null)
      .find(option => option.id === storageId && option.available);
    if (!delivery) return;

    const carStates = { ...(this.registry.get('carStates') || {}) };
    const locations = { ...(this.registry.get('carGarageLocations') || {}) };
    const coupons = { ...(this.registry.get('carCoupons') || {}) };

    const purchasedState = listing.marketType === 'new'
      ? getNewCarState(listing.carId, listing.paintColor)
      : {
          ...(listing.previewState || getAutoMarketBuild(listing.carId)),
          paintColor: listing.paintColor,
          acquiredVia: 'tokyoAutoMarketUsed',
        };

    owned.push(instanceId);
    carStates[instanceId] = purchasedState;
    locations[instanceId] = storageId;

    let nextCash = cash;
    if (useCoupons) {
      const remaining = Math.max(0, couponCount - couponRequired);
      if (remaining > 0) coupons[listing.carId] = remaining;
      else delete coupons[listing.carId];
      this.registry.set('carCoupons', coupons);
    } else {
      nextCash = cash - Number(listing.price || 0);
      this.registry.set('cash', nextCash);
    }

    this.registry.set('ownedCarIds', owned);
    this.registry.set('carStates', carStates);
    this.registry.set('carGarageLocations', locations);
    // Buying a car does not teleport the driver out of the car they arrived in.
    // The purchased vehicle simply appears in the selected delivery garage.
    recordCarAcquisition(this.registry, instanceId, {
      acquiredVia: useCoupons
        ? 'competitionCoupon'
        : listing.marketType === 'new'
          ? 'tokyoAutoMarketNew'
          : 'tokyoAutoMarketUsed',
    });
    saveSessionState(this.registry);

    this.cashText.setText(money(nextCash));
    this.autoMarketShowcaseActive = false;
    this.renderLocation(this.activeLocationId);
  }

  sellSelectedCar(carId, salePrice) {
    // Registered professional tournament cars cannot be sold mid-event.
    if (normaliseProCircuitState(this.registry.get('proCircuit'))
      .activeTournament?.carId === carId) return;
    const proDuel = this.registry.get('competitionState');
    if (proDuel?.active && proDuel?.proEvent && proDuel.playerCarId === carId) return;
    const owned = [...(this.registry.get('ownedCarIds') || [])];
    const starterCarId = this.registry.get('starterCarId');
    if (!owned.includes(carId)) return;
    if (owned.length <= 1) return;
    if (owned.length === 1 && carId === starterCarId) return;

    const nextOwned = owned.filter(id => id !== carId);
    const carStates = { ...(this.registry.get('carStates') || {}) };
    const locations = { ...(this.registry.get('carGarageLocations') || {}) };

    recordCarDeparture(this.registry, carId, 'sold', {
      salePrice: Number(salePrice || 0),
    });

    delete carStates[carId];
    delete locations[carId];

    const cash = Number(this.registry.get('cash') || 0) + Number(salePrice || 0);
    this.registry.set('ownedCarIds', nextOwned);
    this.registry.set('carStates', carStates);
    this.registry.set('carGarageLocations', locations);
    this.registry.set('selectedCarId', nextOwned[0] || null);
    this.registry.set('cash', cash);
    saveSessionState(this.registry);

    this.cashText.setText(money(cash));
    this.renderLocation(this.activeLocationId);
  }


  getGinzaListings() {
    return getGinzaRoomStock(GINZA_LISTINGS.filter(item => cars[item.carId]),
      Date.now(), this.devCentralRefreshOffsets?.showroom || 0);
  }

  getGinzaActiveListing() {
    if (this.ginzaRoom === 3) {
      const carId = getGinzaVaultCar(this.ginzaVaultIndex, this.ginzaStockBody);
      return GINZA_LISTINGS.find(item => item.carId === carId) || null;
    }
    return this.getGinzaListings()[this.ginzaRoom - 1] || null;
  }

  ginzaScene(kind, args = {}, onComplete = null) {
    if (sceneCutsceneActive(this)) return false;
    const definition = ginzaConversation(kind, args);
    if (!definition) return false;
    return Boolean(playMangaCutscene(this, definition, {
      // Ginza scene portraits are limited to the poses actually scripted.
      // Without this flag the manga renderer requests all of Sayaka's
      // garage, driving-school and racing artwork on the first interaction.
      preloadPagePosesOnly: true,
      onComplete: () => onComplete?.(),
    })?.played);
  }

  // Reveal Sayaka's private-gallery evening look only after she offers to
  // accompany Arkon. Keep the same feet/scale and leave her floor shadow.
  changeGinzaSayakaToDress() {
    if (this.ginzaRoom !== 3 || !isNamedArkonDen(this.registry) ||
        this.ginzaOwnerDressed || !this.textures.exists('ginzaSayakaDress')) return false;
    const previous = this.ginzaVenueSayaka;
    const dressed = this.addVenueCharacter({
      characterId: 'sayakaFujieda', pose: 'ginzaDress',
      x: STAGE.x + 103, feetY: STAGE.y + 512, height: 225,
      depth: 18, shadow: false,
    });
    if (!dressed) return false;
    dressed.setAlpha(0);
    this.ginzaOwnerDressed = true;
    this.ginzaVenueSayaka = dressed;
    const fadeIn = () => {
      if (!dressed.active || this.ginzaRoom !== 3) return;
      this.tweens.add({
        targets: dressed, alpha: 1, duration: 580, ease: 'Sine.easeOut',
      });
    };
    if (previous?.active) {
      this.tweens.add({
        targets: previous, alpha: 0, duration: 460, ease: 'Sine.easeIn',
        onComplete: () => { previous.destroy(); fadeIn(); },
      });
    } else fadeIn();
    return true;
  }

  enterGinzaRoom(room) {
    if (isGinzaLoanActive(this.registry)) return;
    const target = Phaser.Math.Clamp(Number(room) || 1, 1, 3);
    if (target === this.ginzaRoom || sceneCutsceneActive(this) || this.ginzaCarFading) return;
    if (target === 3) {
      const dev = isGinzaOwner(this.registry);
      if (!ginzaVaultEligible(this.registry, dev)) {
        this.ginzaScene('vaultLocked');
        return;
      }
      if (dev && isNamedArkonDen(this.registry)) {
        // Enter the actual private gallery first, so the two full-body sprites
        // are present behind the cutscene. Dress reveal follows their banter.
        this.ginzaOwnerDressed = false;
        this.ginzaRoom = 3;
        this.renderLocation(this.activeLocationId);
        this.ginzaScene('vaultArkon', {}, () => {
          this.registry.set('ginzaVaultOwnerWelcomed', true);
          this.registry.set('ginzaVaultInvited', true);
          saveSessionState(this.registry);
          this.changeGinzaSayakaToDress();
        });
        return;
      }
      if (dev) {
        this.ginzaScene('vaultOwner', {}, () => {
          this.registry.set('ginzaVaultOwnerWelcomed', true);
          this.registry.set('ginzaVaultInvited', true);
          saveSessionState(this.registry);
          this.ginzaRoom = 3;
          this.renderLocation(this.activeLocationId);
        });
        return;
      }
      if (!dev && !this.registry.get('ginzaVaultInvited')) {
        this.ginzaScene('vaultInvitation', {}, () => {
          this.registry.set('ginzaVaultInvited', true);
          saveSessionState(this.registry);
          this.ginzaRoom = 3;
          this.renderLocation(this.activeLocationId);
        });
        return;
      }
    }
    if (target !== 3) this.ginzaOwnerDressed = false;
    this.ginzaRoom = target;
    this.renderLocation(this.activeLocationId);
  }

  switchGinzaVaultCar(index) {
    const next = Phaser.Math.Clamp(Number(index) || 0, 0, 2);
    if (this.ginzaRoom !== 3 || this.ginzaCarFading ||
        next === this.ginzaVaultIndex || sceneCutsceneActive(this)) return;
    this.ginzaCarFading = true;
    const active = (this.ginzaHeroObjects || []).filter(o => o?.active);
    this.tweens.add({
      targets: active, alpha: 0, duration: 280, ease: 'Sine.easeInOut',
      onComplete: () => {
        this.ginzaVaultIndex = next;
        this.renderLocation(this.activeLocationId);
        const fresh = (this.ginzaHeroObjects || []).filter(o => o?.active);
        fresh.forEach(o => o.setAlpha(0));
        this.tweens.add({ targets: fresh, alpha: 1, duration: 340,
          ease: 'Sine.easeInOut', onComplete: () => { this.ginzaCarFading = false; } });
      },
    });
  }

  toggleGinzaVaultStock() {
    if (this.ginzaRoom !== 3 || this.ginzaCarFading || sceneCutsceneActive(this)) return;
    const original = this.ginzaStockBody;
    this.ginzaCarFading = true;
    const active = (this.ginzaHeroObjects || []).filter(o => o?.active);
    this.tweens.add({
      targets: active, alpha: 0, duration: 260, ease: 'Sine.easeInOut',
      onComplete: () => {
        this.ginzaStockBody = !original;
        this.renderLocation(this.activeLocationId);
        const next = (this.ginzaHeroObjects || []).filter(o => o?.active);
        next.forEach(o => o.setAlpha(0));
        this.tweens.add({ targets: next, alpha: 1, duration: 350,
          ease: 'Sine.easeInOut', onComplete: () => { this.ginzaCarFading = false; } });
      },
    });
  }

  drawGinza() {
    if (isGinzaLoanActive(this.registry)) this.ginzaRoom = 3;
    this.ginzaRotationKey = Math.floor(Date.now() / GINZA_ROTATION_MS);
    const storyShowroom = this.chapter08Arrival && this.ginzaRoom === 1 &&
      (isChapter08DevReplay(this.registry) ||
       !hasSeenCutscene(this.registry,'chapter08Ginza'));
    const listing = storyShowroom
      ? GINZA_LISTINGS.find(item => item.carId === 'rwbStellaPorsche')
      : this.getGinzaActiveListing();
    this.chapter08Kaede = null;
    this.ginzaVenueSayaka = null;
    const arkonVault = this.ginzaRoom === 3 && isNamedArkonDen(this.registry);
    const locked = !ginzaVaultEligible(this.registry, isGinzaOwner(this.registry));
    const labels = ['', 'MOTOR GALLERY', 'PRESTIGE SALON', 'INVITATION VAULT'];
    this.drawNavigation(labels[this.ginzaRoom], this.ginzaRoom === 3
      ? 'PRIVATE COLLECTION // THREE LE MANS LEGENDS'
      : 'HAND-CURATED // NEW CAR EVERY 30 MINUTES');

    const ordinary = this.getGinzaListings().filter(Boolean);
    recordCarMagazineSightings(this.registry,
      (this.ginzaRoom === 3 ? [listing] : ordinary)
        .filter(Boolean).map(l => ({ carId: l.carId, source: 'ginza' })), 'ginza');
    saveSessionState(this.registry);

    // Keep the showroom figures grounded on the real floor artwork.
    // The rear staff in Room 2 are intentionally behind the display car.
    if (this.ginzaRoom === 1) {
      // Kaede takes Emi's previous left-hand welcome position. Emi now
      // faces inwards from the right side of the Motor Gallery.
      this.addVenueCharacter({ characterId: 'emiSaionji', pose: 'ginzaIdle',
        x: STAGE.x + STAGE.w - 108, feetY: STAGE.y + 510, height: 244,
        flip: true, shadowOffsetY: -18, depth: 16 });
      this.chapter08Kaede = this.addVenueCharacter({ characterId: 'kaedeTachibana', pose: 'ginzaIdle',
        x: STAGE.x + 103, feetY: STAGE.y + 512, height: 245,
        shadowOffsetX: 16, shadowOffsetY: -18, depth: 17 });
    } else {
      if (this.ginzaRoom === 2) {
        this.addVenueCharacter({ characterId: 'emiSaionji', pose: 'ginzaIdle',
          x: STAGE.x + 775, feetY: STAGE.y + 383, height: 143,
          flip: true, depth: 7 });
        this.addVenueCharacter({ characterId: 'kaedeTachibana', pose: 'ginzaIdle',
          x: STAGE.x + 905, feetY: STAGE.y + 383, height: 143,
          flip: true, depth: 7 });
      }
      // Ginza Sayaka shares the foreground footprint and visual height
      // of Kaede in the Motor Gallery, instead of towering over the car.
      this.ginzaVenueSayaka = this.addVenueCharacter({
        characterId: 'sayakaFujieda',
        pose: arkonVault ? (this.ginzaOwnerDressed ? 'ginzaDress' : 'normal') : 'ginzaNormal',
        x: STAGE.x + 103, feetY: STAGE.y + 512, height: 225, depth: 18,
      });
      if (arkonVault) {
        // Only the actual Arkon Den profile stands beside Sayaka in the Vault.
        this.addVenueCharacter({
          characterId: 'arkonDen', pose: 'ginzaSuit',
          x: STAGE.x + 285, feetY: STAGE.y + 512, height: 225,
          shadowOffsetX: 6, depth: 19,
        });
      }
    }

    this.ginzaHeroObjects = [];
    if (listing && cars[listing.carId]) {
      // Common plinth centre in all three rooms; reduce hero size by 10%.
      const stageX = STAGE.x + STAGE.w * 0.50;
      const carObjects = this.createCarDisplay(
        cars[listing.carId], stageX, STAGE.y + 309, 567, 11,
        DEFAULT_PAINT_COLOR, null, false, getGinzaCollectorState(listing.carId)
      );
      carObjects.forEach(obj => this.addContent(obj));
      this.ginzaHeroObjects = carObjects;
      if (!storyShowroom) {
        const hit = this.addContent(this.add.rectangle(stageX, STAGE.y + 302,
          604, 218, 0x000000, 0).setDepth(24)
          .setInteractive({ useHandCursor: true }));
        hit.on('pointerdown', () => this.showGinzaPurchase(listing, true));
      }
    }

    // The full lower strip is now *only* navigation, in every room.
    // Vault car selection is retained as a small stage-mounted selector.
    // Standard rooms navigate between rooms. The Vault instead uses these
    // same three large bottom slots for its three legendary vehicles.
    const vault = this.ginzaRoom === 3;
    const roomNames = ['MOTOR GALLERY', 'PRESTIGE SALON', 'PRIVATE VAULT'];
    (vault ? GINZA_VAULT_CARS : roomNames).forEach((item, index) => {
      const x = CARDS.x + 198 + index * 369;
      const selected = vault
        ? index === this.ginzaVaultIndex
        : index + 1 === this.ginzaRoom;
      const label = vault ? item.name
        : index === 2 && locked ? 'PRIVATE VAULT // INVITE ONLY' : item;
      const box = this.addContent(this.add.rectangle(
        x, CARDS.y + 90, 348, 112,
        selected ? 0x351c31 : 0x101a28, 1
      ).setStrokeStyle(2, selected ? 0xff8fbd : 0x46627a, 1)
        .setDepth(33).setInteractive({ useHandCursor: true }));
      this.addContent(this.add.text(x, CARDS.y + 90, label, {
        fontFamily: PIXEL_FONT, fontSize: '10px',
        color: selected ? '#ffffff' : '#b5cde0',
      }).setOrigin(0.5).setDepth(34));
      box.on('pointerdown', () => {
        if (vault) this.switchGinzaVaultCar(index);
        else this.enterGinzaRoom(index + 1);
      });
    });

    if (listing && !storyShowroom) this.drawGinzaSide(listing);
  }

  drawGinzaSide(listing) {
    const car = cars[listing.carId];
    const owned = (this.registry.get('ownedCarIds') || []).includes(listing.carId);
    const vault = this.ginzaRoom === 3;
    const x = SIDE.x + 20;
    const centerX = SIDE.x + SIDE.w / 2;
    const width = SIDE.w - 36;

    if (vault) {
      const toggle = this.addContent(this.add.rectangle(
        centerX, SIDE.y + 122, width, 37, 0x211527, 1
      ).setStrokeStyle(2, 0xff8eb9, 1).setDepth(34)
        .setInteractive({ useHandCursor: true }));
      this.addContent(this.add.text(centerX, SIDE.y + 122,
        this.ginzaStockBody ? 'DISPLAY: STOCK / CLEAN  ⇄' : 'DISPLAY: DECALS / RACE  ⇄',
        { fontFamily: PIXEL_FONT, fontSize: '8px', color: '#ffe5f0' }
      ).setDepth(35).setOrigin(0.5));
      toggle.on('pointerdown', () => this.toggleGinzaVaultStock());
    }

    const y0 = SIDE.y + (vault ? 165 : 124);
    this.addContent(this.add.text(x, y0,
      listing.rarity + (vault ? ' // PRIVATE COLLECTION' : ' // GINZA'),
      { fontFamily: PIXEL_FONT, fontSize: '8px', color: '#ff9fc7' }
    ).setDepth(34));

    // The full model name appears exactly once, as the hero headline.
    // Reserve space for multi-line names before drawing its specifications.
    this.addContent(this.add.text(x, y0 + 30, car.name.toUpperCase(), {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#f5d48b',
      wordWrap: { width: SIDE.w - 43, useAdvancedWrap: true },
      lineSpacing: 3,
    }).setDepth(34));

    this.addContent(this.add.text(x, y0 + 110,
      car.engineModel + '\n' +
      car.powerKW + ' kW  //  ' + car.torqueNm + ' Nm\n' +
      Math.round(car.vehicleMassKg) + ' kg',
      { fontFamily: BODY_FONT, fontSize: '12px', color: '#b7c9d4',
        lineSpacing: 5, wordWrap: { width: SIDE.w - 40 } }
    ).setDepth(34));
    this.addContent(this.add.text(x, y0 + 207,
      'ASKING  ' + money(listing.price), {
        fontFamily: PIXEL_FONT, fontSize: '10px', color: '#ffe08a'
      }).setDepth(34));
    this.addContent(this.add.text(x, y0 + 246,
      'SEALED COLLECTOR\nNO MECHANICAL MODIFICATIONS', {
        fontFamily: BODY_FONT, fontSize: '11px',
        color: '#d6a9bc', lineSpacing: 3,
      }).setDepth(34));

    if (vault) {
      const driving = this.registry.get('ginzaTestDrive');
      const demoY = SIDE.y + 513;
      const demo = this.addContent(this.add.rectangle(
        centerX, demoY, width, 42, 0x132d32, 1
      ).setStrokeStyle(2, 0x6bd8cb, 1).setDepth(33)
        .setInteractive({ useHandCursor: true }));
      this.addContent(this.add.text(centerX, demoY,
        driving ? 'RETURN TEST CAR' : 'TEST DRIVE ANYWHERE', {
          fontFamily: PIXEL_FONT, fontSize: '9px', color: '#e6fffb'
        }).setOrigin(0.5).setDepth(34));
      demo.on('pointerdown', () => {
        if (driving) {
          const owner = isNamedArkonDen(this.registry);
          this.ginzaScene(owner ? 'vaultReturnArkon' : 'vaultReturn', {}, () => {
            this.endGinzaTestDrive(false);
            this.ginzaRoom = 1;
            this.ginzaOwnerDressed = false;
            this.renderLocation(this.activeLocationId);
          });
        } else this.ginzaScene('vaultDrive', {}, () => this.startGinzaTestDrive(listing));
      });
    }

    // Price is printed once above; BUY stays actionable even if cash is short.
    const buyY = SIDE.y + (vault ? 567 : 515);
    const loanPurchaseLocked = isGinzaLoanActive(this.registry);
    const buy = this.addContent(this.add.rectangle(
      centerX, buyY, width, 45, loanPurchaseLocked ? 0x16191e : 0x2b1422, 1
    ).setStrokeStyle(2, loanPurchaseLocked ? 0x4b545d : 0xff7cac, 1).setDepth(33));
    if (!loanPurchaseLocked) buy.setInteractive({ useHandCursor: true });
    this.addContent(this.add.text(centerX, buyY,
      loanPurchaseLocked ? 'RETURN LOAN BEFORE PURCHASE' :
        owned ? 'ALREADY OWNED // DETAILS' : 'BUY THIS CAR', {
        fontFamily: PIXEL_FONT, fontSize: '9px', color: loanPurchaseLocked ? '#83939c' : '#ffe5ef'
      }).setOrigin(0.5).setDepth(34));
    if (!loanPurchaseLocked) buy.on('pointerdown', () => this.showGinzaPurchase(listing));

    if (vault) {
      // The only extra side-panel navigation: straight back to Room 1.
      const backY = SIDE.y + 623;
      const loanActive = isGinzaLoanActive(this.registry);
      const back = this.addContent(this.add.rectangle(
        centerX, backY, width, 40, loanActive ? 0x16191e : 0x102138, 1
      ).setStrokeStyle(2, loanActive ? 0x4b545d : 0x557eae, 1).setDepth(33));
      if (!loanActive) back.setInteractive({ useHandCursor: true });
      this.addContent(this.add.text(centerX, backY,
        loanActive ? 'RETURN LOAN TO LEAVE VAULT' : 'GO BACK // MOTOR GALLERY', {
          fontFamily: PIXEL_FONT, fontSize: '8px', color: loanActive ? '#83939c' : '#eef8ff'
        }).setOrigin(0.5).setDepth(34));
      if (!loanActive) back.on('pointerdown', () => this.enterGinzaRoom(1));
    }
  }

  showGinzaPurchase(listing, viewOnly = false) {
    if (isGinzaLoanActive(this.registry) || sceneCutsceneActive(this) || !listing) return;
    // The car itself selects it and reveals details without forcing dialogue.
    if (viewOnly) return;
    const carName = cars[listing.carId]?.shortName || 'collector';
    const cash = Number(this.registry.get('cash') || 0);
    if (cash < listing.price) {
      this.ginzaScene(this.ginzaRoom === 1 ? 'room1Short' : 'room2Short',
        { carName, shortfall: listing.price - cash });
      return;
    }
    const selected = (this.registry.get('ownedCarIds') || []).includes(listing.carId);
    if (selected) {
      this.showTransactionConfirm({ title: 'ALREADY OWNED',
        message: 'This car is already in your collection.',
        confirmLabel: 'CLOSE', onConfirm: () => {} });
      return;
    }
    const storage = Boolean(this.findStorageForPurchase());
    const ownedCount = (this.registry.get('ownedCarIds') || [])
      .filter(id => !cars[id]?.crewLoan && !cars[id]?.ginzaDemo).length;
    if (!storage || ownedCount >= getGarageCapacity(this.registry.get('garageTier') || 0)) {
      this.showTransactionConfirm({ title: 'DELIVERY SPACE REQUIRED',
        message: 'The gallery can make the sale, but your garages are full. Arrange space before purchasing.',
        confirmLabel: 'UNDERSTOOD', onConfirm: () => {} });
      return;
    }
    const doConfirm = () => this.showTransactionConfirm({
      title: 'CONFIRM GINZA PURCHASE',
      message: 'Acquire ' + carName + ' for ' + money(listing.price) +
        '?\n\nCollector cars remain sealed and cannot be modified.',
      confirmLabel: 'BUY COLLECTOR',
      accent: 0xff7cac,
      onConfirm: () => showGarageDeliveryPicker(this, {
        carId: listing.carId, carName, title: 'GINZA DELIVERY',
        message: 'Choose a garage for your new collector car.',
        onSelect: workshopId => {
          this.buyGinzaCar(listing, workshopId);
          if ((this.registry.get('ownedCarIds') || []).includes(listing.carId)) {
            this.ginzaScene('sale', { carName });
          }
        },
      }),
    });
    this.ginzaScene('interest', { carName }, doConfirm);
  }

  startGinzaTestDrive(listing) {
    if (this.ginzaRoom !== 3 || !listing || !ginzaVaultEligible(this.registry,
        isGinzaOwner(this.registry))) return false;
    this.endGinzaTestDrive(false);
    const demoId = 'ginzaDemo_' + listing.carId;
    if (!cars[demoId]) return false;
    const previousCarId = this.registry.get('selectedCarId') || '';
    const previousPreferredId = this.registry.get('preferredCarId') || previousCarId;
    const owned = [...(this.registry.get('ownedCarIds') || [])];
    if (!owned.includes(demoId)) owned.push(demoId);
    this.registry.set('ownedCarIds', owned);
    this.registry.set('carStates', {
      ...(this.registry.get('carStates') || {}),
      [demoId]: { ...getGinzaCollectorState(listing.carId),
        acquiredVia: 'ginzaTemporaryTestDrive', ginzaDemo: true },
    });
    this.registry.set('carGarageLocations', {
      ...(this.registry.get('carGarageLocations') || {}),
      [demoId]: this.registry.get('workshopLocationId') || 'shinonomeWorkshop',
    });
    this.registry.set('ginzaTestDrive', {
      carId: demoId, previousCarId, previousPreferredId,
    });
    this.registry.set('selectedCarId', demoId);
    this.registry.set('preferredCarId', demoId);
    saveSessionState(this.registry);
    this.renderLocation(this.activeLocationId);
    this.openMap();
    return true;
  }

  endGinzaTestDrive(redraw = true) {
    const active = this.registry.get('ginzaTestDrive');
    if (!active?.carId) return false;
    const demoId = active.carId;
    const owned = (this.registry.get('ownedCarIds') || []).filter(id => id !== demoId);
    const states = { ...(this.registry.get('carStates') || {}) };
    const locations = { ...(this.registry.get('carGarageLocations') || {}) };
    delete states[demoId]; delete locations[demoId];
    this.registry.set('ownedCarIds', owned);
    this.registry.set('carStates', states);
    this.registry.set('carGarageLocations', locations);
    const restore = owned.includes(active.previousCarId)
      ? active.previousCarId : owned[0] || null;
    const preferred = owned.includes(active.previousPreferredId)
      ? active.previousPreferredId : restore;
    this.registry.set('selectedCarId', restore);
    this.registry.set('preferredCarId', preferred);
    this.registry.set('ginzaTestDrive', null);
    saveSessionState(this.registry);
    if (redraw) this.renderLocation(this.activeLocationId);
    return true;
  }

  buyGinzaCar(listing, storageId = null) {
    const car = cars[listing?.carId];
    const isCuratedGinzaListing = GINZA_LISTINGS.some(
      item => item?.carId === listing?.carId
    );
    if (!car || !isCuratedGinzaListing) return;

    const owned = [...(this.registry.get('ownedCarIds') || [])];
    if (owned.includes(listing.carId)) return;

    const cash = Number(this.registry.get('cash') || 0);
    if (cash < Number(listing.price || 0)) return;

    const delivery = getGarageDeliveryOptions(this, listing.carId)
      .find(option => option.id === storageId && option.available);
    if (!delivery) return;

    const carStates = { ...(this.registry.get('carStates') || {}) };
    const locations = { ...(this.registry.get('carGarageLocations') || {}) };

    owned.push(listing.carId);
    carStates[listing.carId] = getGinzaCollectorState(listing.carId);
    locations[listing.carId] = storageId;

    this.registry.set('ownedCarIds', owned);
    this.registry.set('carStates', carStates);
    this.registry.set('carGarageLocations', locations);
    this.registry.set('cash', cash - listing.price);
    recordCarAcquisition(this.registry, listing.carId, {
      acquiredVia: 'ginzaMotorGallery',
    });
    saveSessionState(this.registry);

    this.cashText.setText(money(cash - listing.price));
    this.renderLocation(this.activeLocationId);
  }

  getSelectedBuild() {
    const carId = this.registry.get('selectedCarId');
    const car = cars[carId];
    if (!car) return null;

    const state = (this.registry.get('carStates') || {})[carId] || {};
    const engineBuild = applyEngineTuning(car, engines[car.engine], state);
    const full = applySecondaryTuning(engineBuild.car, engineBuild.engine, state);

    return {
      carId,
      car: full.car,
      engine: full.engine,
      state,
      nosInstalled:
        Boolean(state.nosInstalled) ||
        Number(state.exhaustNosTuning?.nosKit || 0) > 0,
    };
  }

  getProDragEvents() {
    const pro = normaliseProCircuitState(this.registry.get('proCircuit'));
    const legacy = this.registry.get('competitionState');
    // Open Circuit offers rotate with WorldClock (six slots per day/night).
    // Existing in-progress events keep their saved identities and fixtures.
    if (isOpenCircuitAvailable(pro)) {
      const rotation=getOpenCircuitRotation();
      const driverBase=PRO_DRAG_EVENTS[rotation.rotationIndex%PRO_DRAG_EVENTS.length];
      const driver={...driverBase,requiredWins:0,openCircuit:true,
        entryFee:Math.round(driverBase.entryFee*.55/1000)*1000,
        prizeCash:Math.round(driverBase.prizeCash*.6/1000)*1000};
      const crewFormat=getOpenCircuitCrewFormat(rotation,pro.openCircuitTick);
      const crewLabel={DUEL:'CREW CLUB SPRINT',RELAY:'CREW RELAY',
        TECHNICAL:'CREW TECHNICAL',FOUR_WIDE:'CREW FOUR-WIDE'}[crewFormat];
      const crew={...CREW_SERIES,label:crewLabel,format:crewFormat,
        entryFee:OPEN_CIRCUIT_CREW_FEE,openCircuit:true,requiredWins:0};
      const trophy=getOpenCircuitTrophy(pro,rotation);
      const crewTrophy=['TEAM','MIXED'].includes(trophy.discipline);
      const trophyBase=PRO_DRAG_EVENTS[2];
      const special={...trophyBase,id:trophy.id,label:trophy.label,trophyId:trophy.id,
        team:crewTrophy,requiredWins:0,openCircuit:true,entryFee:trophy.entryFee,
        prizeCash:trophy.firstWin?trophy.prizeCash:trophy.repeatCash,
        trophyCooldown:trophy.eventsRemaining,trophyDescription:trophy.description,
        trophyFixtures:trophy.fixtures,trophyFormat:trophy.format,
        trophyStages:trophy.stages||[],
        opponentRatings:crewTrophy?trophyBase.opponentRatings:[4,4,5,5,5],
        maxPowerKW:trophy.maxPowerKW||undefined,noNos:Boolean(trophy.noNos)};
      const choices=[driver,crew,trophy.scheduled?special:{
        id:'noTrophy',label:'NO TROPHY EVENT',trophySlotClosed:true,
        openCircuit:true,requiredWins:0,entryFee:0,
      }];
      if(legacy?.active&&legacy.proEvent&&legacy.openCircuit){
        const activeCard=legacy.openTrophyId?2:0;
        choices[activeCard]={...choices[activeCard],id:legacy.eventId,
          label:legacy.openTrophyId?
            (PRO_CIRCUIT_TROPHIES.find(t=>t.id===legacy.openTrophyId)?.label||legacy.eventId):
            (PRO_DRAG_EVENTS.find(e=>e.id===legacy.eventId)?.label||legacy.eventId),
          trophyId:legacy.openTrophyId||null,team:false,trophySlotClosed:false,
          entryFee:legacy.entryFee,prizeCash:legacy.prizeCash,trophyCooldown:0,
          trophyFixtures:legacy.rounds?.length||choices[activeCard].trophyFixtures,
          trophyDescription:legacy.openTrophyId&&legacy.rounds?.length===3?
            'LEGACY THREE-ROUND TROPHY // SAVED EVENT':choices[activeCard].trophyDescription,
          maxPowerKW:legacy.maxPowerKW??choices[activeCard].maxPowerKW};
      }
      if(pro.activeCrewEvent&&!pro.activeCrewEvent.trophyId){
        choices[1]={...choices[1],label:{DUEL:'CREW CLUB SPRINT',
          RELAY:'CREW RELAY',TECHNICAL:'CREW TECHNICAL',
          FOUR_WIDE:'CREW FOUR-WIDE'}[pro.activeCrewEvent.format]||crewLabel};
      }
      if(pro.activeCrewEvent?.trophyId){
        choices[2]={...choices[2],id:pro.activeCrewEvent.trophyId,label:pro.activeCrewEvent.label,
          team:true,trophyId:pro.activeCrewEvent.trophyId,trophyCooldown:0,
          trophySlotClosed:false};
      }
      return choices;
    }
    const round = pro.calendar.round;
    const driverPool = PRO_DRAG_EVENTS;
    const rules = getProfessionalRoundEvents(round);
    const primary = driverPool.find(e => e.id === rules.driver.id) || driverPool[0];
    const fourWide = {
      id: FOUR_WIDE_CUP.id, label: 'FOUR-WIDE OPEN', fourWide: true,
      entryFee: FOUR_WIDE_CUP.entryFee, prizeCash: FOUR_WIDE_CUP.prizeCash[0], requiredWins: 0,
    };
    const driver = { ...(rules.driver.id === 'fourWideOpen' ? fourWide : primary),
      seasonRules: rules.driver,
      label: (rules.driver.id === 'fourWideOpen' ? fourWide : primary).label };
    // Fixed positions: driver, crew, special/championship. Existing saved
    // registrations remain resumable even when the calendar has advanced.
    const choices = [driver, { ...CREW_SERIES, requiredWins: 0 },
      { id: 'specialSlot', label: proCircuitSpecialEligible(this.registry) ? 'TOKYO CHAMPIONSHIP' : 'MINOR TROPHIES', specialSlot: true, entryFee: 0, requiredWins: 0 }];
    if (legacy?.active && legacy.proEvent) {
      choices[0] = { ...(driverPool.find(e => e.id === legacy.eventId) || primary), entryFee: legacy.entryFee || 0 };
    }
    if (pro.activeTournament) choices[0] = fourWide;
    if (round >= 8 && !proCircuitSpecialEligible(this.registry)) {
      choices[2] = { id: 'seasonResults', label: 'SEASON RESULTS', seasonEnd: true,
        entryFee: 0, requiredWins: 0 };
      if (!pro.activeCrewEvent && !pro.activeTournament && !legacy?.active) this.selectedEventIndex = 2;
    }
    // Never overwrite the player's chosen card merely because a crew series
    // or another professional event is in progress.
    return choices;
  }

  drawDragComplex() {
    const access = getProCircuitAccess(this.registry);
    const circuitOpen = access.unlocked || isArkonDen(this.registry);
    const isOpen = isOpenCircuitAvailable(this.registry.get('proCircuit'));
    this.drawNavigation(
      'PRO DRAG CIRCUIT',
      circuitOpen
        ? (isOpen?'ROTATING DRIVER / CREW / TROPHY EVENTS':
          'CHOOSE AN EVENT · EARN POINTS · QUALIFY FOR TOKYO CHAMPIONSHIP')
        : 'PROFESSIONAL CIRCUIT // RECRUIT SEVEN CREW MEMBERS TO ENTER'
    );

    // Dev-only refresh is in the venue pane, never the sidebar.
    if (isArkonDen(this.registry)) {
      const x = STAGE.x + STAGE.w - 135, y = STAGE.y + 19;
      const dev = this.addContent(this.add.rectangle(
        x, y, 250, 30, 0x211317, 0.96
      ).setStrokeStyle(1, 0xbf444b, 1)
        .setDepth(29).setInteractive({ useHandCursor: true }));
      this.addContent(this.add.text(x, y, 'D) REFRESH LINEUP', {
        fontFamily: PIXEL_FONT, fontSize: '7px', color: '#f1e6e7',
      }).setOrigin(0.5).setDepth(30));
      dev.on('pointerdown', () => this.devRefreshCentralLocation());
    }

    if (!circuitOpen) {
      this.addContent(this.add.text(
        STAGE.x + STAGE.w / 2,
        STAGE.y + 46,
        'PRO ENTRY LOCKED // CREW ' + access.crewCount + '/' + access.crewRequired,
        { fontFamily: PIXEL_FONT, fontSize: '10px', color: '#ffe08a' }
      ).setOrigin(0.5).setDepth(27));
    }

    drawSeasonHeader(this, STAGE);

    this.proOpenRotationKey = isOpen ? getOpenCircuitRotation().rotationIndex : null;
    const events = this.getProDragEvents();
    const build = this.getSelectedBuild();
    const selectedCar = build ? cars[build.carId] : null;

    if (selectedCar) {
      const playerCharacterId = this.registry.get('playerCharacterId') || 'renMizuno';
      const playerCharacter = characters[playerCharacterId] || characters.renMizuno;

      const carObjects = this.createCarDisplay(
        selectedCar,
        STAGE.x + 420,
        STAGE.y + 350,
        460,
        8,
        getCarPaintColor(build.state),
        playerCharacter
      );
      carObjects.forEach(obj => this.addContent(obj));
    }

    const migratedRivals = getConqueredMainRivalIds(this.registry);
    if (migratedRivals.length) {
      // They are ambient spectators, not an explanatory UI item. Set them
      // one full sprite-height lower, across the width with deterministic
      // irregular spacing/grounding so the group looks naturally assembled.
      const count = migratedRivals.length;
      const step = Math.min(146, 850 / Math.max(1, count - 1));
      const centreX = STAGE.x + STAGE.w / 2;
      const xJitter = [-19, 13, -8, 24, -16, 9, -11];
      const feetJitter = [0, -12, 8, 15, -7, 10, -3];
      migratedRivals.forEach((characterId, index) => {
        this.addVenueCharacter({
          characterId,
          pose: 'normal',
          x: centreX + (index - (count - 1) / 2) * step +
            xJitter[index % xJitter.length],
          feetY: STAGE.y + 427 + feetJitter[index % feetJitter.length],
          height: 82,
          flip: index % 2 === 1,
          depth: 6,
          shadow: false,
          rivalContext: true,
        });
      });
    }

    const dragStaff = CENTRAL_TOKYO_CHARACTER_IDS.dragComplex;
    [
      { characterId: dragStaff.owner, x: STAGE.x + 72, feetY: STAGE.y + 505, height: 210, flip: false, depth: 19 },
      { characterId: dragStaff.mechanic, x: STAGE.x + 704, feetY: STAGE.y + 508, height: 184, flip: false, depth: 18 },
      { characterId: dragStaff.starter, x: STAGE.x + 824, feetY: STAGE.y + 505, height: 202, flip: false, depth: 20 },
      { characterId: dragStaff.telemetry, x: STAGE.x + 950, feetY: STAGE.y + 508, height: 182, flip: true, depth: 18 },
      { characterId: dragStaff.manager, x: STAGE.x + STAGE.w - 68, feetY: STAGE.y + 505, height: 216, flip: true, depth: 21 },
    ].forEach(config => this.addVenueCharacter({ ...config, pose: 'normal' }));

    if (hasSeenCutscene(this.registry, 'proCircuitStrategistReveal')) {
      this.addVenueCharacter({
        characterId: 'sayakaFujieda',
        pose: 'track',
        x: STAGE.x + 230,
        feetY: STAGE.y + 505,
        height: 202,
        flip: false,
        depth: 20,
      });
    }

    this.addContent(this.add.text(CARDS.x + 18, CARDS.y + 14, 'EVENT SELECTION', {
      fontFamily: PIXEL_FONT,
      fontSize: '11px',
      color: '#8fe7ff',
    }).setDepth(33));

    this.selectedEventIndex = Phaser.Math.Clamp(
      this.selectedEventIndex,
      0,
      events.length - 1
    );

    events.forEach((event, index) => {
      const x = CARDS.x + 190 + index * 365;
      const selected = index === this.selectedEventIndex;
      const wins = Number(this.registry.get('wins') || 0);
      const unlocked = circuitOpen && (event.fourWide || isArkonDen(this.registry) || wins >= event.requiredWins);

      const box = this.addContent(this.add.rectangle(
        x,
        CARDS.y + 104,
        340,
        116,
        selected ? 0x36181d : 0x141317,
        1
      ).setStrokeStyle(selected ? 2 : 1, selected ? 0xd74750 : 0x665f62, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(32));

      this.addContent(this.add.text(x - 145, CARDS.y + 68, event.label, {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: unlocked ? '#f7f3f1' : '#797277',
      }).setDepth(34));

      this.addContent(this.add.text(x - 145, CARDS.y + 98, event.trophySlotClosed?'NO INVITATION THIS CYCLE':event.trophyId ? (event.trophyCooldown?'NEXT INVITATION // '+event.trophyCooldown+' EVENTS':'PRESTIGE TROPHY // '+event.trophyFixtures+' STAGES') : event.openCircuit ? (event.team?'CHOOSE THREE DRIVERS':'THREE ROUNDS // CASH PRIZES') : event.team ? 'CREW POINTS // 20 MAX' : event.seasonEnd ? 'CAREER // STANDINGS' : event.fourWide ? 'DRIVER POINTS // MULTI-CAR' : 'DRIVER POINTS // 20 MAX', {
        fontFamily: BODY_FONT,
        fontSize: '10px',
        color: unlocked ? '#d9cacb' : '#7f7377',
        fontStyle: '600',
      }).setDepth(34));

      this.addContent(this.add.text(
        x + 145,
        CARDS.y + 136,
        event.trophySlotClosed?'':'ENTRY ' + money(event.entryFee),
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: unlocked ? '#f2dadc' : '#817d84',
        }
      ).setOrigin(1, 0.5).setDepth(34));

      box.on('pointerdown', () => {
        this.selectedEventIndex = index;
        this.renderLocation(this.activeLocationId);
      });
    });

    this.drawDragSide(events[this.selectedEventIndex], build);
    showProSeasonAction(this,SIDE);
  }

  enterProfessionalTimedEvent(event) {
    const pro=normaliseProCircuitState(this.registry.get('proCircuit'));
    const active=pro.activeTimedEvent;
    const owned=this.registry.get('ownedCarIds')||[];
    if(active) {
      if(active.round===pro.calendar.round&&active.attempts.length<3&&owned.includes(active.carId))
        this.scene.start('FourLaneTestScene',{mode:'PRO_TIMED'});
      return;
    }
    const access=getProCircuitAccess(this.registry);
    if(!access.unlocked&&!isArkonDen(this.registry))return;
    if(pro.seasonStatus!=='ACTIVE'||pro.activeTournament||pro.activeCrewEvent||pro.activeChampionship||
      this.registry.get('competitionState')?.active)return;
    const build=this.getSelectedBuild();
    if(!build||!owned.includes(build.carId))return;
    const cash=Number(this.registry.get('cash')||0);
    if(cash<event.entryFee)return;
    const registration=registerProfessionalTimedEvent(pro,build.carId,event.entryFee,build.state);
    if(registration.error){this.proError=registration.error;this.renderLocation(this.activeLocationId);return;}
    try {
      saveProTransaction(this.registry,{proCircuit:registration.circuit,cash:cash-event.entryFee});
    }catch(error){this.proError=error.message;this.renderLocation(this.activeLocationId);return;}
    this.scene.start('FourLaneTestScene',{mode:'PRO_TIMED'});
  }

  enterFourWideCup() {
    const access = getProCircuitAccess(this.registry);
    if ((!access.unlocked && !isArkonDen(this.registry)) ||
        this.registry.get('competitionState')?.active) return;
    const pro = normaliseProCircuitState(this.registry.get('proCircuit'));
    const owned = this.registry.get('ownedCarIds') || [];
    if (pro.seasonStatus!=='ACTIVE'||pro.activeCrewEvent || (pro.calendar.round >= 8 && !pro.activeTournament)) return;
    const active = pro.activeTournament;
    if (active) {
      if (active.eventId !== FOUR_WIDE_CUP.id ||
        !getPlayerProHeat(active) || !owned.includes(active.carId)) return;
      this.scene.start('FourLaneTestScene', { mode: 'PRO_CUP' });
      return;
    }
    const build = this.getSelectedBuild();
    const carId = build?.carId;
    if (!carId || !owned.includes(carId) || cars[carId]?.ginzaDemo) return;
    const rules = getProfessionalRoundEvents(pro.calendar.round).driver;
    if (rules.id !== 'fourWideOpen' || rules.format !== 'FOUR_WIDE' || rules.stock) return;
    if (rules.maxPowerKW && Number(build.car?.powerKW || 0) > rules.maxPowerKW) return;
    if (rules.noNos && build.nosInstalled) return;
    if (rules.drivetrain && proDriveClass(getCarMagazineMeta(carId)?.drivetrain) !== proDriveClass(rules.drivetrain)) return;
    const cash = Number(this.registry.get('cash') || 0);
    if (cash < FOUR_WIDE_CUP.entryFee) return;
    const tournament = createFourWideTournament(pro, carId);
    if (!tournament) return;
    // Registry snapshot is written ONCE before leaving the venue, so closing
    // the PWA mid-heat never charges another fee or loses a registered bracket.
    tournament.crowdTier = getProfessionalAttendance(pro, { prestige: 2 });
    try { saveProTransaction(this.registry, { proCircuit: { ...pro, activeTournament: tournament }, cash: cash - FOUR_WIDE_CUP.entryFee }); }
    catch (error) { this.proError = error.message; this.renderLocation(this.activeLocationId); return; }
    this.scene.start('FourLaneTestScene', { mode: 'PRO_CUP' });
  }

  drawDragSide(event, build) {
    if (event.specialSlot && proCircuitSpecialEligible(this.registry)) {
      this.addContent(this.add.text(SIDE.x + 20, SIDE.y + 245,
        'TOKYO CHAMPIONSHIP\nQUALIFICATION ACHIEVED\n\nENTER THE CHAMPIONSHIP LOBBY',
        { fontFamily: BODY_FONT, fontSize: '18px', color: '#f3cf8d' }).setDepth(34));
      const championshipEntry = this.addContent(this.add.rectangle(SIDE.x + SIDE.w / 2,
        SIDE.y + 574, SIDE.w - 36, 48, 0x5d1d27).setDepth(34).setInteractive({ useHandCursor: true }));
      championshipEntry.on('pointerdown', () => showTokyoChampionship(this));
      this.addContent(this.add.text(SIDE.x + SIDE.w / 2, SIDE.y + 574,
        'OPEN TOKYO CHAMPIONSHIP', { fontFamily: PIXEL_FONT, fontSize: '8px', color: '#fff6f5' }).setOrigin(0.5).setDepth(35));
      return;
    }
    if (event.trophySlotClosed) {
      this.addContent(this.add.text(SIDE.x + 20,SIDE.y + 208,'NO TROPHY EVENT',{
        fontFamily:PIXEL_FONT,fontSize:'11px',color:'#f8f3f2',
      }).setDepth(34));
      this.addContent(this.add.text(SIDE.x + 20,SIDE.y + 255,
        'CHECK BACK AFTER THE NEXT FULL DAY / NIGHT',{
        fontFamily:'"Rajdhani", monospace',fontSize:'11px',fontStyle:'700',color:'#c4bec0',
        lineSpacing:5,wordWrap:{width:SIDE.w-37},
      }).setDepth(34));
      return;
    }
    if (event.specialSlot) {
      this.addContent(this.add.text(SIDE.x + 22, SIDE.y + 250,
        'MINOR TROPHIES // COLLECTION\\n' + PRO_CIRCUIT_TROPHIES.map(t => t.label + '  ' + (proCircuitTrophyWins(this.registry, t.id) || '—')).join('\\n') + '\\n\\nTROPHY RACES ARE NOT YET AVAILABLE.',
        { fontFamily: BODY_FONT, fontSize: '17px', color: '#e8d7b7', wordWrap: { width: SIDE.w - 44 } }).setDepth(34));
      return;
    }
    if (drawCrewSidebar(this, event, SIDE)) return;
    const wins = Number(this.registry.get('wins') || 0);
    const cash = Number(this.registry.get('cash') || 0);
    const access = getProCircuitAccess(this.registry);
    const circuitOpen = access.unlocked || isArkonDen(this.registry);
    const pro = normaliseProCircuitState(this.registry.get('proCircuit'));
    const activeCup = pro.activeTournament;
    const activeDuel = this.registry.get('competitionState')?.active &&
      this.registry.get('competitionState')?.proEvent
        ? this.registry.get('competitionState') : null;
    const selectedFourWide = Boolean(event.fourWide);
    const openCircuit=Boolean(event.openCircuit);
    const trophyUnavailable=Boolean(event.trophyId&&event.trophyCooldown);
    const selectedTimed = ['TIME_ATTACK','CONSISTENCY'].includes(event.seasonRules?.format);
    const eventUnlocked = circuitOpen && !trophyUnavailable &&
      (selectedFourWide || isArkonDen(this.registry) || wins >= event.requiredWins);
    const power = Math.round(Number(build?.car?.powerKW || 0));
    const seasonRules = event.seasonRules;
    const seasonPowerOk = !seasonRules?.maxPowerKW || power <= seasonRules.maxPowerKW;
    const seasonNosOk = !seasonRules?.noNos || !build?.nosInstalled;
    const seasonCheck=build&&seasonRules?getProfessionalCarEligibility(build.carId,(this.registry.get('carStates')||{})[build.carId]||{},seasonRules):null;
    const seasonStockOk = !seasonRules?.stock || Boolean(seasonCheck&&!seasonCheck.reasons.some(r=>r.startsWith('MODIFIED ')||r.includes('TUNE')||r.includes('NITROUS')||r.includes('CALIBRATION')||r.includes('UNVERIFIED')||r.includes('INVALID')));
    // A calendar format is only enterable when its actual race scene exists.
    // Do not silently substitute a knockout for time attack or consistency.
    const supportedFormat = !seasonRules?.format ||
      (selectedFourWide ? seasonRules.format === 'FOUR_WIDE' : ['KNOCKOUT','TIME_ATTACK','CONSISTENCY'].includes(seasonRules.format));
    const seasonDrivetrainOk = !seasonRules?.drivetrain ||
      proDriveClass(getCarMagazineMeta(build?.carId)?.drivetrain) === proDriveClass(seasonRules.drivetrain);
    // For normal Open Circuit individual series, NOS and excessive removable
    // power belong to Daichi's pre-payment scrutineering, not registration.
    const prepareBeforePay=usesPrepaidDriverBriefing(event);
    const passesPower = selectedFourWide || prepareBeforePay || Boolean(build) && (!Number.isFinite(event.maxPowerKW) || power <= event.maxPowerKW);
    const passesNos = selectedFourWide || prepareBeforePay || Boolean(build) && (!event.noNos || !build.nosInstalled);
    const owned = this.registry.get('ownedCarIds') || [];
    const activeCupHere = selectedFourWide && activeCup?.eventId === FOUR_WIDE_CUP.id &&
      Boolean(getPlayerProHeat(activeCup));
    const activeDuelHere = !selectedFourWide && activeDuel &&
      (!activeDuel.eventId || activeDuel.eventId === event.id ||
        (!openCircuit&&activeDuel.eventId === 'tokyoInvitational'));
    const activeTimedHere = selectedTimed && pro.activeTimedEvent?.round === pro.calendar.round &&
      pro.activeTimedEvent?.format === seasonRules.format && pro.activeTimedEvent.attempts.length<3;
    const resuming = Boolean(activeCupHere || activeDuelHere || activeTimedHere);
    const registeredCar = activeCupHere ? activeCup.carId : activeDuelHere ? activeDuel.playerCarId : activeTimedHere ? pro.activeTimedEvent.carId : null;
    const canResume = circuitOpen && resuming && !(
      selectedFourWide ? activeDuel : activeCup
    ) && (!pro.activeTimedEvent || activeTimedHere) && owned.includes(registeredCar);
    const eligible = circuitOpen && eventUnlocked &&
      !activeCup && !pro.activeTimedEvent && !this.registry.get('competitionState')?.active &&
      Boolean(build) && owned.includes(build.carId) &&
      passesPower && passesNos && supportedFormat && seasonPowerOk && seasonNosOk && seasonStockOk && seasonDrivetrainOk && cash >= event.entryFee;
    const canEnter = canResume || (eligible && (openCircuit?isOpenCircuitAvailable(pro):pro.seasonStatus==='ACTIVE'&&pro.calendar.round<8) && !pro.activeCrewEvent);

    const title = activeDuelHere && (
      !activeDuel.eventId || activeDuel.eventId === 'tokyoInvitational'
    ) ? 'ACTIVE PRO CUP' : selectedFourWide ? 'FOUR-WIDE OPEN' : event.label;
    drawProEventSidebarTitle(this,SIDE,title);

    const desc = activeDuelHere && (!activeDuel.eventId ||
        activeDuel.eventId === 'tokyoInvitational')
      ? [
          'SAVED DRIVER EVENT',
          '3 ROUNDS // HEAD-TO-HEAD',
          'WIN EACH ROUND TO ADVANCE',
          'ROUND ' + (Number(activeDuel.roundIndex || 0) + 1) + '/3',
          'ORIGINAL ENTRY  ' + money(activeDuel.entryFee || 0),
          'REGISTERED PRIZE  ' + money(activeDuel.prizeCash || 0),
          'REGISTERED CAR  ' + (cars[activeDuel.playerCarId]?.shortName || activeDuel.playerCarId),
        ]
      : selectedTimed
      ? [
          'PRO COMP // ' + (seasonRules.format==='TIME_ATTACK'?'TIME ATTACK':'CONSISTENCY'),
          'THREE DRIVEN ATTEMPTS',
          seasonRules.format==='TIME_ATTACK'?'FASTEST VALID RUN WINS':'SMALLEST TIME SPREAD WINS',
          'ATTEMPT ' + (activeTimedHere?pro.activeTimedEvent.attempts.length+1:1) + '/3',
          'REGISTERED CAR  ' + (cars[activeTimedHere?pro.activeTimedEvent.carId:build?.carId]?.shortName||'NONE'),
          'ENTRY  ' + money(event.entryFee),
          'SEASON POINTS  20 WIN / 8 LOSS',
        ]
      : selectedFourWide
      ? [
          'TROPHY COMP // FOUR-WIDE',
          '16 DRIVERS // FOUR CARS PER HEAT',
          'QUALIFYING   4 HEATS',
          'SEMIFINALS   2 HEATS',
          'FINAL        1 HEAT',
          'TOP TWO ADVANCE EACH HEAT',
          '1ST ' + money(FOUR_WIDE_CUP.prizeCash[0]) +
            ' // 2ND ' + money(FOUR_WIDE_CUP.prizeCash[1]),
          '3RD ' + money(FOUR_WIDE_CUP.prizeCash[2]) +
            ' // 4TH ' + money(FOUR_WIDE_CUP.prizeCash[3]),
          'ENTRY  ' + money(event.entryFee),
        ]
      : [
          'DRIVER // PROFESSIONAL EVENT',
          '3 ROUNDS // HEAD-TO-HEAD',
          'WIN THREE TO CLAIM PURSE',
          'POWER LIMIT  ' + (event.maxPowerKW||'OPEN') + ' KW',
          'NOS  ' + (event.noNos ? 'PROHIBITED' : 'ALLOWED'),
          'CHAMPION  ' + money(event.prizeCash),
          'ENTRY  ' + money(event.entryFee),
        ];

    if (openCircuit) {
      if(event.trophyId){
        const progress=activeDuelHere&&activeDuel?.openTrophyId
          ?Number(activeDuel.roundIndex||0)+1:1;
        desc.length=0;
        desc.push(event.trophyDescription||'INVITATIONAL CHAMPIONSHIP',
          'STAGE '+progress+'/'+(event.trophyFixtures||5),
          'ELIMINATION ON DEFEAT',
          event.maxPowerKW?'POWER LIMIT  '+event.maxPowerKW+' KW':'OPEN POWER CLASS',
          'NOS  '+(event.noNos?'PROHIBITED':'ALLOWED'),
          'CHAMPION  '+money(event.prizeCash),
          'ENTRY  '+money(event.entryFee));
      }
    }
    if (!resuming && seasonRules) {
      desc.splice(1, 0, 'ROUND ' + (pro.calendar.round + 1) + '/8 // ' + seasonRules.format.replaceAll('_', ' '));
      if (seasonRules.stock) desc.push('CAR CLASS  FACTORY STOCK ONLY');
      if (seasonRules.drivetrain) desc.push('DRIVETRAIN  ' + seasonRules.drivetrain);
      if (seasonRules.maxPowerKW) desc.push('SEASON LIMIT  ' + seasonRules.maxPowerKW + ' KW');
      if (seasonRules.noNos) desc.push('SEASON NOS  PROHIBITED');
    }

    drawProEventSidebarDetails(this,SIDE,desc);

    const label = resuming
      ? activeTimedHere ? 'READY // ATTEMPT ' + (pro.activeTimedEvent.attempts.length+1) + '/3' : selectedFourWide
        ? 'READY // ' + FOUR_WIDE_CUP.stageNames[activeCup.stage]
        : 'READY // ROUND ' + (Number(activeDuel.roundIndex || 0) + 1) + '/3'
      : !openCircuit&&pro.calendar.round >= 8 ? 'SEASON COMPLETE // VIEW RESULTS OR START NEXT SEASON'
        : activeCup || activeDuel || pro.activeTimedEvent || pro.activeCrewEvent || this.registry.get('competitionState')?.active
        ? 'FINISH YOUR ACTIVE EVENT FIRST'
        : !circuitOpen ? 'CREW REQUIRED // ' + access.crewCount + '/7'
        : trophyUnavailable ? 'TROPHY COOLDOWN // '+event.trophyCooldown+' OTHER EVENTS REQUIRED'
        : !eventUnlocked ? 'REQUIRES ' + event.requiredWins + ' WINS'
        : !build ? 'SELECT A CAR FIRST'
        : !supportedFormat ? 'EVENT FORMAT NOT YET AVAILABLE'
        : !seasonStockOk ? 'FACTORY STOCK ONLY // '+(seasonCheck?.reasons?.[0]||'MODIFICATIONS DETECTED')
        : !seasonDrivetrainOk ? 'DRIVETRAIN RESTRICTION'
        : !seasonPowerOk ? 'SEASON POWER LIMIT // ' + seasonRules.maxPowerKW + ' KW'
        : !seasonNosOk ? 'NOS PROHIBITED BY SEASON RULES'
        : prepareBeforePay && (Number.isFinite(event.maxPowerKW)&&power>event.maxPowerKW || event.noNos&&build?.nosInstalled)
          ? 'SETUP REQUIRED // DAICHI WILL PREPARE CAR'
        : !passesPower ? 'OVER POWER LIMIT // ' + power + ' KW'
        : !passesNos ? 'REMOVE NOS'
        : cash < event.entryFee ? 'INSUFFICIENT CASH'
        : '';
    drawProEventSidebarStatus(this,SIDE,label,canEnter);

    const actionText = canResume
      ? activeTimedHere ? 'RESUME TIMED EVENT' : selectedFourWide ? 'RESUME FOUR-WIDE OPEN' : 'RESUME EVENT BRIEFING'
      : canEnter ? proEventEntryLabel(event.entryFee) : 'NOT ELIGIBLE';
    drawProEventSidebarEntry(this,SIDE,actionText,()=>{
      if (activeTimedHere) this.enterProfessionalTimedEvent(event);
      else if (activeCupHere) this.enterFourWideCup();
      else if (activeDuelHere) {
        if(isOpenDriverBriefing(activeDuel))this.showOpenCircuitDriverBriefing();
        else this.scene.start('FourLaneTestScene', { mode: 'PRO_DUEL' });
      }
      else if (selectedFourWide) this.showDragEventBriefing(event,()=>this.enterFourWideCup());
      else if (selectedTimed) this.showDragEventBriefing(event,()=>this.enterProfessionalTimedEvent(event));
      else if(!prepareBeforePay)
        this.showDragEventBriefing(event,()=>this.startProBracket(event,build));
      else this.startProBracket(event, build);
    },canEnter);
  }

  // Specialized timed, four-wide and season formats have no five-character
  // paddock scene. Still open a FREE, compact briefing before any fee changes.
  // The ONLY paid action on this screen is Go to Grid.
  showDragEventBriefing(event,onGrid){
    const fee=Number(event?.entryFee||0);
    const rule=event?.noNos?'NOS PROHIBITED':'NOS PERMITTED';
    this.showTransactionConfirm({
      title:'EVENT BRIEFING // '+String(event.label||'PRO EVENT'),
      message:'FORMAT  '+String(event.seasonRules?.format||event.format||
        (event.fourWide?'FOUR-WIDE':'PRO CIRCUIT')).replaceAll('_',' ')+
        '\nENTRY  '+money(fee)+
        '\nRULES  '+(event.maxPowerKW?event.maxPowerKW+' KW MAX // ':'')+rule+
        '\n\nProceed to enter this competition. Your entry is charged once.',
      confirmLabel:'GO TO GRID // '+money(fee),
      onConfirm:onGrid,
    });
  }

  buildDragMainRivalRound(characterId, event, build, index = 0) {
    const progression = getMainRivalProgression(this.registry, characterId);
    if (!progression?.conquered) return null;

    const character = characters[characterId] || {};
    const candidateCarIds = [
      ...(character.preferredCars || []),
      ...(event.opponentCars || []),
    ].filter((id, pos, list) => cars[id] && list.indexOf(id) === pos);
    const targetPower = Math.min(
      Number(event.maxPowerKW || 9999),
      Math.max(1, Number(build?.car?.powerKW || event.maxPowerKW || 1))
    );
    const preferredRating = progression.tier >= 2 ? 5 : 4;
    const ratingCandidates = preferredRating >= 5 ? [5, 4, 3] : [4, 3, 5];
    let best = null;

    candidateCarIds.forEach(carId => {
      ratingCandidates.forEach(buildRating => {
        let state = createRivalBuildState(
          cars[carId],
          buildRating,
          {
            seed:
              'drag-main-rival:' + characterId + ':' + event.id + ':' +
              progression.tier + ':' + index,
            raceType: 'Standing Start',
          }
        );

        if (event.noNos) {
          state = {
            ...state,
            nosInstalled: false,
            exhaustNosTuning: {
              ...(state.exhaustNosTuning || {}),
              nosKit: 0,
              nitrousShot: 0,
            },
          };
        }

        const performance = getVehiclePerformance(carId, state);
        const power = Number(performance?.car?.powerKW || cars[carId]?.powerKW || 0);
        if (power <= 0 || power > Number(event.maxPowerKW || Infinity)) return;

        const score =
          Math.abs(power - targetPower) +
          Math.abs(buildRating - preferredRating) * 8;
        if (!best || score < best.score) {
          best = {
            score,
            carId,
            buildRating,
            state,
            power,
          };
        }
      });
    });

    if (!best) return null;
    return {
      characterId,
      carId: best.carId,
      opponentBuildRating: best.buildRating,
      opponentBuildArchetype: best.state.buildArchetype || null,
      opponentBuildState: best.state,
      encounterRating: progression.encounterRating,
      encounterAi: progression.encounterAi,
      difficulty: progression.difficulty,
      mainRivalTier: progression.tierLabel,
    };
  }

  // Unpaid preview for normal Open Circuit individual races. The selected
  // entrant, provisional opponents, car setup and even Sayaka advice remain
  // scene-local until the ONE Proceed to Grid transaction.
  showOpenCircuitDriverBriefing(initialDialogue=null) {
    const pending=this._pendingProDriverBriefing||null;
    const state=pending?.state||this.registry.get('competitionState');
    if(!isOpenDriverBriefing(state))return;
    const definition=pending?.event||PRO_DRAG_EVENTS.find(e=>e.id===state.eventId)||{};
    const pro=normaliseProCircuitState(this.registry.get('proCircuit'));
    const fail=message=>{
      this.proError=message;
      this.renderLocation(this.activeLocationId);
      if(this._pendingProDriverBriefing||isOpenDriverBriefing(this.registry.get('competitionState')))
        this.showOpenCircuitDriverBriefing();
    };
    showProDriverBriefing(this,{
      state:pending?.state||null,
      preparedCarState:pending?.preparedCarState||null,
      previewCircuit:pending?.adviceCircuit||null,
      event:definition,initialDialogue,
      proAccess:getProCircuitAccess(this.registry).unlocked,
      onCancel:()=>{
        if(!pending)return;
        this._pendingProDriverBriefing=null;
        this.proError=null;
        this.renderLocation(this.activeLocationId);
      },
      onBack:()=>{}, // Paid competitions resume from the Drag Complex card.
      onAdvice:spoken=>{
        if(pending){
          const out=consumeDriverAdvice(pending.adviceCircuit||pro,pending.state);
          if(out.error){fail(out.error);return;}
          pending.state={...out.competitionState,briefingAdviceText:spoken};
          pending.adviceCircuit=out.circuit;
          this.showOpenCircuitDriverBriefing('sayaka');
          return;
        }
        const current=this.registry.get('competitionState');
        if(!isOpenDriverBriefing(current))return;
        const out=consumeDriverAdvice(normaliseProCircuitState(this.registry.get('proCircuit')),current);
        if(out.error){fail(out.error);return;}
        try{
          saveProTransaction(this.registry,{
            proCircuit:out.circuit,
            competitionState:{...out.competitionState,briefingAdviceText:spoken},
          });
          this.showOpenCircuitDriverBriefing('sayaka');
        }catch(error){fail(error.message);}
      },
      onCarState:nextState=>{
        if(pending){
          pending.preparedCarState=nextState;
          this.showOpenCircuitDriverBriefing();
          return;
        }
        const current=this.registry.get('competitionState');
        if(!isOpenDriverBriefing(current))return;
        const carId=current.playerCarId;
        if(!(this.registry.get('ownedCarIds')||[]).includes(carId))return;
        const carStates={...(this.registry.get('carStates')||{}),[carId]:nextState};
        try{
          saveProTransaction(this.registry,{carStates});
          this.showOpenCircuitDriverBriefing();
        }catch(error){fail(error.message);}
      },
      onForfeit:()=>{
        if(pending)return; // Unpaid events use CANCEL ENTRY, never FORFEIT.
        const current=this.registry.get('competitionState');
        const tx=forfeitOpenDriverTransaction(
          this.registry.get('proCircuit'),current,this.registry.get('carStates')||{});
        if(tx.error){fail(tx.error);return;}
        try{
          saveProTransaction(this.registry,tx.changes);
          this.proError=null;
          this.renderLocation(this.activeLocationId);
        }catch(error){fail(error.message);}
      },
      onRace:()=>{
        const current=pending?.state||this.registry.get('competitionState');
        if(!isOpenDriverBriefing(current))return;
        const carId=current.playerCarId;
        const currentCarStates=this.registry.get('carStates')||{};
        const carState=pending?.preparedCarState||currentCarStates[carId]||{};
        let powerKW=Infinity;
        try{powerKW=getVehiclePerformance(getBaseCarId(carId),carState)?.car?.powerKW??Infinity;}
        catch(error){console.warn('[Tokyo SHIFT] Briefing scrutineering unavailable',error);}
        const eligible=driverBriefingEligibility(current,carState,powerKW,
          this.registry.get('ownedCarIds')||[],definition);
        if(!eligible.eligible||!cars[getBaseCarId(carId)]||!Number.isFinite(powerKW)){
          fail(eligible.problems.join(' // ')||'CAR ENGINEERING DATA UNAVAILABLE');
          return;
        }
        if(pending){
          // Recheck the currently available official event at the moment of
          // payment. A stale day/night offer or changed save pays nothing.
          const live=this.getProDragEvents().find(e=>e.id===pending.event.id&&
            usesPrepaidDriverBriefing(e)&&e.entryFee===pending.event.entryFee);
          if(!live){fail('EVENT OFFER CHANGED — CANCEL AND REOPEN REGISTRATION');return;}
          if(this.registry.get('competitionState')?.active){
            fail('ANOTHER COMPETITION IS ALREADY ACTIVE');return;
          }
          const transaction=purchaseDriverBriefingEntry({
            circuit:this.registry.get('proCircuit'),state:pending.state,
            carStates:currentCarStates,preparedCarState:carState,
            owned:this.registry.get('ownedCarIds')||[],
            cash:Number(this.registry.get('cash')||0),powerKW,
            adviceCircuit:pending.adviceCircuit,
          });
          if(transaction.error){fail(transaction.error);return;}
          try{saveProTransaction(this.registry,transaction.changes);}
          catch(error){fail(error.message);return;}
          this._pendingProDriverBriefing=null; // Payment cannot happen twice.
          this.setProDuelRaceContext(transaction.changes.competitionState);
        }else{
          this.registry.set('selectedCarId',carId);
          saveSessionState(this.registry);
        }
        this.scene.start('FourLaneTestScene',{mode:'PRO_DUEL'});
      },
    });
  }

  // Called only when a paid entry has been saved; all engine/race setup
  // continues to use the game's original registered-opponent parameters.
  setProDuelRaceContext(state) {
    const round=state.rounds[state.roundIndex]||state.rounds[0];
    this.registry.set('raceReturnScene','CentralTokyoScene');
    this.registry.set('selectedCarId',state.playerCarId);
    this.registry.set('selectedOpponentCarId',round.carId);
    this.registry.set('selectedOpponentPaintColor',round.paintColor);
    this.registry.set('selectedOpponentCharacterId',round.characterId);
    this.registry.set('selectedOpponentEncounterRating',round.encounterRating);
    this.registry.set('selectedOpponentEncounterAi',round.encounterAi);
    this.registry.set('selectedOpponentDifficulty',round.difficulty||'ELITE');
    this.registry.set('selectedOpponentBuildRating',round.opponentBuildRating||null);
    this.registry.set('selectedOpponentBuildArchetype',round.opponentBuildArchetype||null);
    this.registry.set('selectedOpponentBuildState',round.opponentBuildState||null);
    this.registry.set('selectedRaceCategory','COMPETITION');
    this.registry.set('selectedRaceType','Standing Start');
    this.registry.set('selectedRaceDeal','COMPETITION');
    this.registry.set('selectedRaceStake',0);
    this.registry.set('selectedRaceSpecialChallenge',false);
    this.registry.set('raceTimeOfDay',getWorldPhase());
    this.registry.set('raceDistrict','CENTRAL TOKYO');
    this.registry.set('raceLocationLabel','TOKYO DRAG COMPLEX');
    saveSessionState(this.registry);
  }

  startProBracket(event, build, storyConfirmed = false) {
    if (cars[this.registry.get('selectedCarId')]?.ginzaDemo) return;
    const pro = normaliseProCircuitState(this.registry.get('proCircuit'));
    if (pro.activeTournament || pro.activeCrewEvent || (!isOpenCircuitAvailable(pro)&&pro.calendar.round >= 8) || this.registry.get('competitionState')?.active) return;
    const access = getProCircuitAccess(this.registry);
    const isDev = isArkonDen(this.registry);
    if (!event || (!access.unlocked && !isDev)) return;
    if (!isDev && Number(this.registry.get('wins') || 0) < event.requiredWins) return;
    const cash = Number(this.registry.get('cash') || 0);
    const selectedBuild = this.getSelectedBuild();
    const ownedCars = this.registry.get('ownedCarIds') || [];
    if (!build || !selectedBuild || build.carId !== selectedBuild.carId || !ownedCars.includes(build.carId) || cash < event.entryFee) return;
    // Always use current saved tuning, never the pre-cutscene build snapshot.
    build = selectedBuild;
    const prepareBeforePay=usesPrepaidDriverBriefing(event);
    if(!prepareBeforePay && Number.isFinite(event.maxPowerKW) && Number(build.car?.powerKW || 0) > event.maxPowerKW) return;
    if(!prepareBeforePay && event.noNos && build.nosInstalled) return;
    // Revalidate the real card when paying the fee: no stale UI can bypass
    // registered-season restrictions or an active minor-trophy cooldown.
    const openCircuit=isOpenCircuitAvailable(pro);
    if(openCircuit){
      const choices=this.getProDragEvents();
      const actual=choices.find(e=>e.id===event.id&&e.openCircuit&&
        (e.trophyId||null)===(event.trophyId||null));
      if(!actual||actual.trophyCooldown||actual.team||actual.entryFee!==event.entryFee)return;
    }else{
      if(pro.seasonStatus!=='ACTIVE')return;
      const rules = getProfessionalRoundEvents(pro.calendar.round).driver;
      if (event.id !== rules.id || rules.format !== 'KNOCKOUT' || rules.stock) return;
      if (rules.maxPowerKW && Number(build.car?.powerKW || 0) > rules.maxPowerKW) return;
      if (rules.noNos && build.nosInstalled) return;
      if (rules.drivetrain && proDriveClass(getCarMagazineMeta(build.carId)?.drivetrain) !== proDriveClass(rules.drivetrain)) return;
    }

    if (!storyConfirmed) {
      const promoterId = CENTRAL_TOKYO_CHARACTER_IDS.dragComplex.manager;
      const story = playMangaCutscene(this, 'competitionIntroduction', {
        characterOverrides: { PROMOTER: promoterId },
        variables: {
          PROMOTER_NAME: String(characters[promoterId]?.name || 'Masato Kuroda').toUpperCase(),
        },
        onComplete: () => this.startProBracket(event, build, true),
      });
      if (story.played) return;
    }

    const playerCharacterId = this.registry.get('playerCharacterId');
    const migrated = getConqueredMainRivalIds(this.registry);
    const rotation = migrated.length
      ? (
          Number(this.registry.get('wins') || 0) +
          Number(this.devCentralRefreshOffsets?.proDrag || 0) +
          Math.max(0, PRO_DRAG_EVENTS.findIndex(item => item.id === event.id))
        ) % migrated.length
      : 0;
    const rotatedMigrated = migrated.length
      ? migrated.slice(rotation).concat(migrated.slice(0, rotation))
      : [];
    const genericFill = genericRivalCharacterOrder
      .filter(id =>
        id !== playerCharacterId &&
        characters[id] &&
        !rotatedMigrated.includes(id)
      )
      .sort((a, b) =>
        Number(characters[b]?.skill?.rating || 3) -
        Number(characters[a]?.skill?.rating || 3)
      );
    const lineupOffset = Number(this.devCentralRefreshOffsets?.proDrag || 0);
    const genericOrder = genericFill.length
      ? [...genericFill.slice(lineupOffset % genericFill.length),
         ...genericFill.slice(0, lineupOffset % genericFill.length)]
      : [];
    const rivals = [...rotatedMigrated, ...genericOrder].slice(0, event.trophyId ? 5 : 3);

    const rounds = event.opponentRatings.map((rating, index) => {
      const characterId = rivals[index % rivals.length];
      const mainRivalRound = this.buildDragMainRivalRound(
        characterId,
        event,
        build,
        index
      );
      const baseAi = getEncounterAi(rating);
      const eventBoost = event.id === 'tokyoInvitational' ? 0.035 : event.id === 'midnightCup' ? 0.02 : 0.01;

      if (mainRivalRound) {
        return {
          ...mainRivalRound,
          opponentName:characters[characterId]?.name||null,
          paintColor: selectMixedCarPaint(mainRivalRound.carId,
            {characterId, isMainRival: true, seed: index})?.color ??
            [0x5e6b7a, 0xffffff, 0xd64f5d][index % 3],
          raceType: 'Standing Start',
        };
      }

      return {
        characterId,
        opponentName:characters[characterId]?.name||null,
        carId: event.opponentCars[index % event.opponentCars.length],
        paintColor: selectMixedCarPaint(event.opponentCars[index % event.opponentCars.length],
          {region:'SHINJUKU', characterId, seed: index + pro.eventTick * 31})?.color ??
          [0x5e6b7a, 0xffffff, 0xd64f5d][index % 3],
        encounterRating: rating,
        encounterAi: {
          reactionSkill: clamp01(baseAi.reactionSkill + eventBoost),
          launchSkill: clamp01(baseAi.launchSkill + eventBoost),
          shiftSkill: clamp01(baseAi.shiftSkill + eventBoost),
          aggression: clamp01(baseAi.aggression + eventBoost),
        },
        raceType: 'Standing Start',
      };
    });

    const state = {
      active: true,
      proEvent: true,
      proSeasonId: (openCircuit?'open:':'duel:') + event.id + ':s' + pro.season + ':e' + (pro.eventTick + 1),
      openCircuit,openTrophyId:event.trophyId||null,
      trophyStages:event.trophyStages||null,
      eventId: event.id,
      briefingLabel: event.label,
      briefingRules: {
        maxPowerKW:Number.isFinite(event.maxPowerKW)?event.maxPowerKW:null,
        noNos:Boolean(event.noNos),
        stock:Boolean(event.stock),
        drivetrain:String(event.drivetrain||'').toUpperCase(),
      },
      returnScene: 'CentralTokyoScene',
      locationId: CENTRAL_TOKYO_LOCATIONS.drag.id,
      difficulty: 'ELITE',
      playerCarId: build.carId,
      entryFee: event.entryFee,
      prizeType: 'CASH',
      prizeCash: event.prizeCash,
      prizeCarId: null,
      rounds,
      roundIndex: 0,
    };

    if(prepareBeforePay && isOpenDriverBriefing(state)){
      // A brand-new entry remains strictly unpaid until final scrutineering.
      // No registry/session writes, fee deductions, eventTick or cooldown
      // changes happen until the player confirms by proceeding to the grid.
      state.briefingEntryPending=true;
      this._pendingProDriverBriefing={
        state,event:{...event},preparedCarState:{
          ...build.state,
          tuning:build.state.tuning?{...build.state.tuning}:undefined,
          exhaustNosTuning:build.state.exhaustNosTuning?
            {...build.state.exhaustNosTuning}:undefined,
        },
        adviceCircuit:null,
      };
      this.showOpenCircuitDriverBriefing();
      return;
    }
    try{saveProTransaction(this.registry,{
      cash:cash-event.entryFee,competitionState:state,
    });}
    catch(error){this.proError=error.message;this.renderLocation(this.activeLocationId);return;}
    this.setProDuelRaceContext(state);
    // Season knockouts and legacy trophy races keep their current paid entry
    // and direct race flow. Only standard Open Circuit individual series
    // use the new unpaid room.
    if(isOpenDriverBriefing(state))this.showOpenCircuitDriverBriefing();
    else this.scene.start('FourLaneTestScene',{mode:'PRO_DUEL'});
  }
}
