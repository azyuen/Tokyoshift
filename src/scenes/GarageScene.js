import { getCarBodyScaleForWidth } from '../vehicles/CarAppearance.js?v=20260929-r246';
import { cars, carOrder } from '../data/cars.js?v=20261005-r345';
import { garageAssets } from '../data/garageAssets.js?v=20260925-r192';
import { engines } from '../data/engines.js?v=20261004-r333';
import { characters, getCharacterAssetUrl } from '../data/characters.js?v=20261004-r333';
import {
  ENGINE_PART_ORDER,
  ENGINE_TUNING_PARTS,
  normaliseEngineTuning,
  getEngineTuning,
  getEngineTuningCartCost,
  getUpgradePathCost,
  getEngineTuningCount,
  applyEngineTuning,
} from '../data/tuning.js?v=20260926-r211';
import {
  DRIVETRAIN_PART_ORDER,
  CHASSIS_PART_ORDER,
  EXHAUST_NOS_PART_ORDER,
  DRIVETRAIN_TUNING_PARTS,
  CHASSIS_TUNING_PARTS,
  EXHAUST_NOS_TUNING_PARTS,
  normaliseDrivetrainTuning,
  normaliseChassisTuning,
  normaliseExhaustNosTuning,
  getDrivetrainTuning,
  getChassisTuning,
  getExhaustNosTuning,
  getDrivetrainUpgradePathCost,
  getChassisUpgradePathCost,
  getExhaustNosUpgradePathCost,
  getDrivetrainCartCost,
  getChassisCartCost,
  getExhaustNosCartCost,
  applySecondaryTuning,
} from '../data/secondaryTuning.js?v=20260926-r211';
import { saveSessionState } from '../state/GameState.js?v=20261005-r354';
import { addSettingsButton, showSettingsPanel } from '../ui/SettingsPanel.js?v=20261005-r362';
import { playMangaCutscene } from '../ui/MangaCutscene.js?v=20261005-r348';
import { getMeetLocation } from '../data/meetAssets.js?v=20260922-r84';
import { getTravelLocation } from '../data/travelRegions.js?v=20260929-r272';
import { showTravelMap } from '../ui/TravelMap.js?v=20261004-r320';
import { getWorldPhase } from '../environment/WorldClock.js?v=20260929-r286';
import {
  CENTRAL_TOKYO_LOCATIONS,
  getCarCouponRequirement,
  getPendingCentralTokyoInvite,
  markCentralTokyoUnlocked,
  isArkonDen,
} from '../data/centralTokyo.js?v=20261005-r345';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';
import {
  isCrewUnlocked,
  getCrewMembers,
  getCrewCount,
  removeCrewMember,
} from '../data/crewSystem.js?v=20261005-r354';
import {
  WORKSHOP_TIERS,
  getGarageCapacity,
  getWorkshopByLocationId,
  getWorkshopPhaseBackground,
  getWorkshopStorageCapacity,
  getUnlockedWorkshops,
  getCarsInWorkshop,
  getWorkshopUsage,
  getWorkshopTransferCost,
  normaliseCarGarageLocations,
  applyWorkshopServiceCost,
  canInstallTuningLevel,
  getTuningRequirementLabel,
  getTotalRegionalWins,
  getWorkshopRegionalWinRequirement,
  isWorkshopProgressionReady,
} from '../data/workshopProgression.js?v=20261005-r354';
import { getPowerTorqueDisplay } from '../data/carRatings.js?v=20261004-r325';
import { WORKSHOP_PRESENTATION } from '../data/workshopPresentation.js?v=20260929-r267';
import {
  DYNO_WAREHOUSE_ID,
  DYNO_RENTAL_SESSION_COST,
  getDynoStage,
  buildDynoCar,
} from '../data/dyno.js?v=20261004-r331';
import {
  PAINT_PRESETS,
  getCarPaintColor,
  paintColorToHex,
  paintColorToRgb,
  rgbToPaintColor,
  normalisePaintColor,
  hasLayeredPaintAssets,
  getCarBodyTextureKey,
  createCarBodyLayers,
  setCarBodyPaint,
  preloadCarAppearanceAssets,
  preloadCarWheel,
  ensureDerivedModularCarTextures,
} from '../vehicles/CarAppearance.js?v=20260929-r246';
import {
  VISUAL_MOD_SLOT_ORDER,
  getVisualModCatalog,
  getVisualModSlotIds,
  getVisualModOptions,
  getVisualModOption,
  normaliseVisualMods,
  getVisualModChangeCost,
  createVisualModLayers,
  getVisualModWheelVisual,
  preloadVisualModAssets,
  preloadVisualModSelectionAssets,
} from '../data/visualMods.js?v=20261005-r345';
import { createTunerDecalLayers, preloadTunerDecalAssets } from '../vehicles/TunerDecals.js?v=20260928-r242';
import { getWheelPairFit, getWheelContactOffsetY } from '../vehicles/WheelFit.js?v=20260929-r258';
import {
  startSceneLoading,
  finishSceneLoading,
  cancelSceneLoading,
} from '../ui/LoadingScreen.js?v=20261005-r355';
import { showMagazinePanel } from '../ui/CarHistoryPanel.js?v=20261005-r362';
import { showOfficePanel } from '../ui/OfficePanel.js?v=20261005-r364';
import { getActiveMagazineIssue } from '../data/carMagazine.js?v=20260929-r278';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';
const HERO_CFG = WORKSHOP_PRESENTATION.heroCar;
const THUMB_CFG = WORKSHOP_PRESENTATION.thumbnail;
const PLAYER_CFG = WORKSHOP_PRESENTATION.player;
const DAICHI_CFG = WORKSHOP_PRESENTATION.daichi;

const TUNING_CATEGORY_LOGO_Y_OFFSET = 94;
const TUNING_CATEGORY_LOGO_MAX_HEIGHT = 164;
const TUNING_CATEGORY_ROW_START_OFFSET = 214;
const TUNING_CATEGORY_ROW_GAP = 56;

const SAFE = 24;
const STAGE = { x: 24, y: 92, w: 1138, h: 528 };
const SIDE = { x: 1180, y: 92, w: 356, h: 724 };
const STRIP = { x: 24, y: 644, w: 1138, h: 172 };

const CREW_MEMBER_LAYOUT = Object.freeze([
  // Five on the workshop floor, two on the balcony. Heights deliberately vary
  // with perspective so a full seven-person crew reads as one authored group,
  // not seven identical stickers laid over the room.
  { x: 150, feetY: 478, h: 154, zone: 'floor' },
  { x: 300, feetY: 468, h: 162, zone: 'floor' },
  { x: 455, feetY: 480, h: 158, zone: 'floor' },
  { x: 625, feetY: 466, h: 166, zone: 'floor' },
  { x: 790, feetY: 478, h: 158, zone: 'floor' },
  { x: 928, feetY: 354, h: 136, zone: 'balcony' },
  { x: 1065, feetY: 350, h: 140, zone: 'balcony' },
]);

export default class GarageScene extends Phaser.Scene {
  constructor(sceneKey = 'GarageScene') { super(sceneKey); }

  init(data = {}) {
    // Crew Space is a workshop-mode presentation of GarageScene so all tuning,
    // visual-mod and dyno behaviour stays on the same battle-tested code path.
    const explicitCrewMode = Object.prototype.hasOwnProperty.call(data || {}, 'crewMode')
      ? Boolean(data.crewMode)
      : null;
    this.crewMode = explicitCrewMode == null
      ? Boolean(this.registry.get('crewSpaceActive'))
      : explicitCrewMode;
    this.returningFromCrewSpace = Boolean(data?.returningFromCrewSpace);
    this._warehousePresentationTransitioning = false;

    if (this.crewMode) {
      this.registry.set('crewSpaceActive', true);
      this.registry.set('workshopLocationId', 'shinonomeWarehouseStrip');
    } else if (explicitCrewMode === false) {
      this.registry.set('crewSpaceActive', false);
    }

    // Pass the workshop explicitly when changing properties. This avoids
    // depending on a re-entrant scene restart to preserve the new location.
    if (data?.workshopLocationId) {
      this.registry.set('workshopLocationId', data.workshopLocationId);
    }
  }

  preload() {
    let queued = 0;
    const queueImage = (key, path) => {
      if (!key || !path || this.textures.exists(key)) return;
      this.load.image(key, path);
      queued += 1;
    };

    const ownedCarIds = (this.registry.get('ownedCarIds') || []).filter(id => cars[id]);
    const activeWorkshopId = this.crewMode
      ? 'shinonomeWarehouseStrip'
      : (this.registry.get('workshopLocationId') || 'shinonomeWorkshop');
    const assignments = normaliseCarGarageLocations(
      ownedCarIds,
      this.registry.get('carGarageLocations') || {},
      Number(this.registry.get('garageTier') || 0)
    );
    const members = getCrewMembers(this.registry);
    const crewCars = Object.values(members)
      .map(member => member.loanCarId)
      .filter(id => cars[id]);
    const localCars = this.crewMode
      ? crewCars
      : getCarsInWorkshop(ownedCarIds, assignments, activeWorkshopId)
          .filter(id => !cars[id]?.crewLoan);
    const carStates = this.registry.get('carStates') || {};

    // Crew Space has its own authored day/night room. Normal workshops keep
    // using their phase-aware workshop backgrounds.
    const activeWorkshop = getWorkshopByLocationId(activeWorkshopId);
    if (this.crewMode) {
      queueImage(
        'crewSpaceDayBg',
        'assets/Garage/shinonome_crewspace_day.png?v=20261005-r349'
      );
      queueImage(
        'crewSpaceNightBg',
        'assets/Garage/shinonome_crewspace_night.png?v=20261005-r349'
      );
    } else {
      ['day', 'night'].forEach(phase => {
        const background = getWorkshopPhaseBackground(activeWorkshop, phase);
        if (background?.key && background?.path) {
          queueImage(background.key, background.path + '?v=20260929-r263');
        }
      });

      // Keep the legacy active texture and home texture available as hard
      // fallbacks for old saves or a missing uploaded phase file.
      [activeWorkshop.textureKey, 'garageWorkshopBg'].forEach(key => {
        const asset = garageAssets.find(item => item.key === key);
        if (asset) queueImage(asset.key, asset.path);
      });
    }

    // Warehouse HQ is the doorway to Crew Space. Warm the alternate room and
    // its current roster while the Warehouse itself is loading so the room
    // buttons can switch presentation without exposing a black loading frame.
    const shouldWarmCrewSpace = (
      !this.crewMode &&
      activeWorkshopId === 'shinonomeWarehouseStrip' &&
      isCrewUnlocked(this.registry)
    );
    if (shouldWarmCrewSpace) {
      queueImage(
        'crewSpaceDayBg',
        'assets/Garage/shinonome_crewspace_day.png?v=20261005-r349'
      );
      queueImage(
        'crewSpaceNightBg',
        'assets/Garage/shinonome_crewspace_night.png?v=20261005-r349'
      );
    }

    const mapPhase = getWorldPhase() === 'day' ? 'day' : 'night';
    const workshopMapAsset = mapPhase === 'day'
      ? {
          key: 'travelMapTokyoRegionDay',
          path: 'assets/Ui/tokyo_region_map_day.png?v=20260928-r245',
        }
      : {
          key: 'travelMapTokyoRegionNight',
          path: 'assets/Ui/tokyo_region_map_base.png?v=20260928-r245',
        };
    queueImage(workshopMapAsset.key, workshopMapAsset.path);


    if (!this.crewMode) {
      const officeBackgrounds = {
        shinonomeWorkshop: {
          key: 'officeWorkshopBg',
          path: 'assets/Garage/shinonome_workshop_office.png?v=20261005-r362',
        },
        shinonomeCanalYard: {
          key: 'officeCanalYardBg',
          path: 'assets/Garage/shinonome_canalyard_office.png?v=20261005-r362',
        },
        shinonomeWarehouseStrip: {
          key: 'officeWarehouseBg',
          path: 'assets/Garage/shinonome_warehouse_office.png?v=20261005-r362',
        },
      };
      const officeBackground =
        officeBackgrounds[activeWorkshopId] ||
        officeBackgrounds.shinonomeWorkshop;
      queueImage(officeBackground.key, officeBackground.path);

      [
        ['officeFlagOdaiba', 'assets/Garage/flag_odaiba.png?v=20261005-r362'],
        ['officeFlagShinagawa', 'assets/Garage/flag_shinagawa.png?v=20261005-r362'],
        ['officeFlagTatsumi', 'assets/Garage/flag_tatsumi.png?v=20261005-r362'],
        ['officeFlagShibuya', 'assets/Garage/flag_shibuya.png?v=20261005-r362'],
        ['officeFlagYokohama', 'assets/Garage/flag_yokohama.png?v=20261005-r362'],
        ['officeFlagDaikoku', 'assets/Garage/flag_daikoku.png?v=20261005-r362'],
        ['officeFlagShinjuku', 'assets/Garage/flag_shinjuku.png?v=20261005-r362'],
        ['officeBadgeCrown', 'assets/Garage/badge_crown.png?v=20261005-r362'],
        ['officeBadgeStar', 'assets/Garage/badge_star.png?v=20261005-r362'],
        ['officeBadgeCrew', 'assets/Garage/badge_crew.png?v=20261005-r362'],
      ].forEach(([key, path]) => queueImage(key, path));
    }

    // Street File belongs to the ordinary workshop. Crew Space uses the same
    // three-panel layout but keeps the room focused on the team.
    if (!this.crewMode) {
      const magazineIssue = getActiveMagazineIssue(this.registry);
      queueImage(
        magazineIssue?.coverKey,
        magazineIssue?.coverPath ? magazineIssue.coverPath + '?v=20260929-r278' : null
      );
      queueImage(
        magazineIssue?.insetKey,
        magazineIssue?.insetPath ? magazineIssue.insetPath + '?v=20260929-r278' : null
      );
    }

    // Garage / Crew Space characters shown immediately.
    const characterIds = this.crewMode
      ? Object.values(members).map(member => member.characterId)
      : [
          this.registry.get('playerCharacterId') || 'renMizuno',
          'daichiSakamoto',
          ...(shouldWarmCrewSpace
            ? Object.values(members).map(member => member.characterId)
            : []),
        ];
    [...new Set(characterIds)].forEach(id => {
      const visual = characters[id]?.visual;
      if (visual) queueImage(visual.spriteKey, getCharacterAssetUrl(visual.path));
    });

    // A workshop can show and switch between its local cars without another
    // network round trip. At Warehouse HQ also warm the crew loan cars so the
    // Crew Space doorway can be an instant in-scene presentation switch.
    const preloadCarIds = [
      ...new Set([
        ...localCars,
        ...(shouldWarmCrewSpace ? crewCars : []),
      ]),
    ];
    preloadCarIds.forEach(id => {
      const car = cars[id];
      if (!car) return;
      queued += preloadCarAppearanceAssets(this, { [id]: car }, '20260928-r242');
      queued += preloadCarWheel(this, car, carStates[id] || {});
      queued += preloadVisualModSelectionAssets(this, id, carStates[id] || {}, '20260928-r242');
      queued += preloadTunerDecalAssets(this, carStates[id] || {}, '20260928-r242');
    });

    // Returning from Crew Space is a same-property presentation change.
    // Warehouse textures are normally already resident, and showing a second
    // global splash here was the path that could stick at 98% on iOS/PWA.
    if (!this.returningFromCrewSpace) {
      startSceneLoading(
        this,
        this.crewMode ? 'LOADING CREW SPACE' : 'LOADING WORKSHOP',
        queued
      );
    }
  }

  create() {
    document.body.dataset.scene = 'garage';
    this.scale.resize(1560, 840);

    // Defensive reset for profile switches. GarageScene is a reused Phaser
    // scene instance, so never inherit a disabled input state.
    try { this.input.enabled = true; } catch (e) {}
    try { if (this.input.keyboard) this.input.keyboard.enabled = true; } catch (e) {}

    // A workshop switch used to restart the scene from inside a completed
    // camera fade. On some mobile/PWA runs the restarted camera inherited the
    // fully black fade overlay. Always begin GarageScene with camera FX reset.
    this.cameras.main.resetFX?.();
    this.cameras.main.setAlpha(1);

    playMusic('workshop');

    // Promote legacy Arkon Den saves immediately on GarageScene entry so every
    // workshop-side system sees the same dev flags as MeetScene.
    if (isArkonDen(this.registry)) {
      this.registry.set('devMode', true);
      saveSessionState(this.registry);
    }

    this.ownedCarIds = (this.registry.get('ownedCarIds') || []).filter(id => cars[id]);
    this.activeWorkshopId = this.crewMode
      ? 'shinonomeWarehouseStrip'
      : (this.registry.get('workshopLocationId') || 'shinonomeWorkshop');
    if (this.crewMode) {
      this.registry.set('workshopLocationId', 'shinonomeWarehouseStrip');
    }
    this.carGarageLocations = normaliseCarGarageLocations(
      this.ownedCarIds,
      this.registry.get('carGarageLocations') || {},
      Number(this.registry.get('garageTier') || 0)
    );
    this.registry.set('carGarageLocations', this.carGarageLocations);

    const localCars = this.getCurrentWorkshopCars();
    const requestedCarId = this.registry.get('selectedCarId');
    this.selectedCarId = this.crewMode
      ? (localCars.includes(requestedCarId) ? requestedCarId : null)
      : (localCars.includes(requestedCarId) ? requestedCarId : localCars[0] || null);

    this.registry.set('ownedCarIds', this.ownedCarIds);
    this.registry.set('selectedCarId', this.selectedCarId);
    this.registry.set('meetStranded', false);

    ensureDerivedModularCarTextures(
      this,
      Object.fromEntries(localCars.filter(id => cars[id]).map(id => [id, cars[id]]))
    );

    this.selectedDisplay = [];
    this.crewStageObjects = [];
    this.crewFocusedCharacterId = null;
    this.thumbButtons = [];
    this.upgradeButtons = [];
    this.selectedUpgrade = null;
    this.engineMode = false;
    this.engineModeObjects = [];
    this.engineModalObjects = [];
    this.engineHotspotObjects = [];
    this.engineHelperObjects = [];
    this.secondaryMode = null;
    this.secondaryModeObjects = [];
    this.secondaryModalObjects = [];
    this.secondaryHelperObjects = [];
    this.secondaryHotspotObjects = [];

    this.chassisMode = false;
    this.chassisModeObjects = [];
    this.chassisPresetButtons = [];
    this.chassisRgbLabels = {};
    this.currentPaintColor = 0xffffff;
    this.pendingPaintColor = 0xffffff;

    this.garagePageSize = 4;
    this.garagePageObjects = [];
    const selectedGarageIndex = Math.max(0, localCars.indexOf(this.selectedCarId));
    this.garagePage = Math.floor(selectedGarageIndex / this.garagePageSize);
    this.worldPhase = getWorldPhase();
    this.workshopBackgroundImage = null;
    this.workshopBackgroundWorkshop = null;

    this.drawScene();

    this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => this.syncWorldPhaseBackground(),
    });
    this.buildHeader();
    this.buildSpecsAndUpgrades();
    this.buildGarageStrip();
    if (this.crewMode) {
      this.buildCrewSpaceNavigation();
    } else {
      this.buildMoveCarButton();
      this.buildWorkshopJumpButton();
      this.buildOfficeHotspot();
      this.buildWarehouseSpaceHotspots();
      this.buildDynoButton();
      this.buildMeetButton();
    }

    if (this.selectedCarId) {
      this.selectCar(this.selectedCarId);
      this.renderGaragePage();
      this.selectUpgrade(null);
    } else if (this.crewMode) {
      this.showCrewOverviewState();
    } else {
      this.showEmptyGarageState();
    }

    if (this.crewMode) {
      // A same-scene Warehouse -> Crew restart can finish object teardown a
      // frame after create(). Reassert the Crew Space nav after state drawing
      // so its three persistent actions can never disappear on re-entry.
      this.refreshCrewSpaceNavigationState();
      this.time.delayedCall(0, () => this.refreshCrewSpaceNavigationState());
    }

    finishSceneLoading('READY');

    // Warm the tuning bay in the background once the workshop itself is
    // visible. This keeps initial garage entry quick, but removes the visible
    // first-tap lazy-load when the player opens Engine/Drivetrain/etc.
    this.time.delayedCall(140, () => {
      this.ensureGarageTuningAssets(null, {
        includeVisualMods: true,
        silent: true,
      });
    });

    let reopenSettings = false;
    let tutorialJustCompleted = false;
    try {
      reopenSettings = sessionStorage.getItem('tokyoShiftOpenSettingsAfterReload') === '1';
      tutorialJustCompleted = sessionStorage.getItem('tokyoShiftTutorialComplete') === '1';
      if (reopenSettings) sessionStorage.removeItem('tokyoShiftOpenSettingsAfterReload');
      if (tutorialJustCompleted) sessionStorage.removeItem('tokyoShiftTutorialComplete');
    } catch (e) {}

    if (reopenSettings) {
      this.time.delayedCall(80, () => showSettingsPanel(this));
    } else if (tutorialJustCompleted) {
      this.time.delayedCall(140, () => this.showTutorialCompletionChoice());
    } else if (!this.crewMode) {
      this.time.delayedCall(260, () => {
        if (!this.showPendingWorkshopCutscene()) {
          this.continueGarageStoryFlow();
        }
      });
    }
  }

  applyWorkshopBackgroundTexture(image, textureKey, activeWorkshop) {
    if (!image?.active || !textureKey || !this.textures.exists(textureKey)) return false;

    image.setTexture(textureKey);
    const source = this.textures.get(textureKey).getSourceImage();
    const naturalCoverScale = Math.max(STAGE.w / source.width, STAGE.h / source.height);
    const isUpgradedWorkshop = Number(activeWorkshop?.tier || 0) > 0;

    // Preserve the exact R262 geometry: the home workshop keeps its 1.12 crop,
    // while Canal Yard / Warehouse retain their bottom-anchored native cover.
    const workshopScale = naturalCoverScale * (isUpgradedWorkshop ? 1 : 1.12);
    image
      .setScale(workshopScale)
      .setPosition(STAGE.x + STAGE.w / 2, STAGE.y + STAGE.h / 2);

    if (isUpgradedWorkshop) {
      const scaledHeight = source.height * workshopScale;
      image.setPosition(
        STAGE.x + STAGE.w / 2,
        STAGE.y + STAGE.h - scaledHeight / 2
      );
    }

    return true;
  }

  syncWorldPhaseBackground() {
    const nextPhase = getWorldPhase();
    if (nextPhase === this.worldPhase) return;
    this.worldPhase = nextPhase;

    const image = this.workshopBackgroundImage;
    if (!image?.active) return;

    const activeWorkshop = getWorkshopByLocationId(
      this.registry.get('workshopLocationId') || this.activeWorkshopId || 'shinonomeWorkshop'
    );
    const textureKey = this.crewMode
      ? (nextPhase === 'day' ? 'crewSpaceDayBg' : 'crewSpaceNightBg')
      : getWorkshopPhaseBackground(activeWorkshop, nextPhase)?.key;

    if (!textureKey || !this.textures.exists(textureKey)) return;

    this.tweens.killTweensOf(image);
    this.tweens.add({
      targets: image,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (!image?.active) return;
        if (this.crewMode) this.applyCrewSpaceBackgroundTexture(image, textureKey);
        else this.applyWorkshopBackgroundTexture(image, textureKey, activeWorkshop);
        this.workshopBackgroundWorkshop = activeWorkshop;
        this.tweens.add({
          targets: image,
          alpha: 1,
          duration: 260,
          ease: 'Quad.easeOut',
        });
      },
    });
  }

  applyCrewSpaceBackgroundTexture(image, textureKey) {
    if (!image?.active || !textureKey || !this.textures.exists(textureKey)) return false;
    image.setTexture(textureKey);
    const source = this.textures.get(textureKey).getSourceImage();
    const scale = Math.max(STAGE.w / source.width, STAGE.h / source.height);
    image.setScale(scale).setPosition(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h - (source.height * scale) / 2
    );
    return true;
  }

  clearCrewStageObjects() {
    (this.crewStageObjects || []).forEach(obj => {
      try { obj?.destroy?.(); } catch (e) {}
    });
    this.crewStageObjects = [];
  }

  getCrewMemberForLoanCar(carId) {
    return Object.values(getCrewMembers(this.registry))
      .find(member => member?.loanCarId === carId) || null;
  }

  syncSelectedRaceDriver() {
    const member = this.getCrewMemberForLoanCar(this.selectedCarId);
    this.registry.set(
      'selectedRacePlayerCharacterId',
      member?.characterId || null
    );
    return member;
  }

  drawCrewOverview() {
    if (!this.crewMode) return;
    this.clearCrewStageObjects();
    this.crewFocusedCharacterId = null;

    const members = Object.values(getCrewMembers(this.registry));
    members.slice(0, CREW_MEMBER_LAYOUT.length).forEach((member, index) => {
      const character = characters[member.characterId];
      const layout = CREW_MEMBER_LAYOUT[index];
      if (!character?.visual?.spriteKey || !this.textures.exists(character.visual.spriteKey)) return;

      const x = STAGE.x + layout.x;
      const feetY = STAGE.y + layout.feetY;
      const shadow = this.add.ellipse(
        x,
        feetY - 8,
        74,
        18,
        0x000000,
        0.55
      ).setDepth(12);

      const sprite = this.add.image(x, feetY, character.visual.spriteKey)
        .setOrigin(0.5, 1)
        .setDepth(14)
        .setInteractive({ useHandCursor: true });

      const source = this.textures.get(character.visual.spriteKey).getSourceImage();
      sprite.setScale(layout.h / Math.max(1, source.height));

      const name = this.add.text(
        x,
        feetY + 9,
        String(character.name || member.characterId).toUpperCase(),
        {
          fontFamily: PIXEL_FONT,
          fontSize: '5px',
          color: '#dff7ff',
          backgroundColor: '#06111dcc',
          padding: { x: 5, y: 3 },
        }
      ).setOrigin(0.5, 0).setDepth(18).setAlpha(0);

      sprite.on('pointerover', () => name.setAlpha(1));
      sprite.on('pointerout', () => name.setAlpha(0));
      sprite.on('pointerdown', () => this.selectCar(member.loanCarId));

      this.crewStageObjects.push(shadow, sprite, name);
    });

    const title = this.add.text(
      STAGE.x + 28,
      STAGE.y + 24,
      'CREW TOGETHER // TAP A MEMBER',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#e8faff',
        backgroundColor: '#06111dcc',
        padding: { x: 8, y: 6 },
      }
    ).setDepth(22);
    this.crewStageObjects.push(title);
  }

  focusCrewMember(member) {
    if (!this.crewMode || !member) return;
    this.clearCrewStageObjects();
    this.crewFocusedCharacterId = member.characterId;

    const character = characters[member.characterId];
    if (character?.visual?.spriteKey && this.textures.exists(character.visual.spriteKey)) {
      const x = STAGE.x + 215;
      const feetY = STAGE.y + 468;
      const shadow = this.add.ellipse(x, feetY - 10, 116, 24, 0x000000, 0.58)
        .setDepth(13);
      const sprite = this.add.image(x, feetY, character.visual.spriteKey)
        .setOrigin(0.5, 1)
        .setDepth(15);
      const source = this.textures.get(character.visual.spriteKey).getSourceImage();
      sprite.setScale(265 / Math.max(1, source.height));

      const tag = this.add.text(
        STAGE.x + 30,
        STAGE.y + 32,
        String(character.name || member.characterId).toUpperCase() +
          ' // ' + String(member.regionId || '').replace(/_/g, ' ') +
          ' // TUNING BAY',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '8px',
          color: '#ffffff',
          backgroundColor: '#06111ddd',
          padding: { x: 8, y: 6 },
        }
      ).setDepth(22);

      this.crewStageObjects.push(shadow, sprite, tag);
    }

    const allCrew = this.add.text(
      STAGE.x + STAGE.w - 24,
      STAGE.y + 24,
      'ALL CREW  <',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#bfeeff',
        backgroundColor: '#06111ddd',
        padding: { x: 10, y: 7 },
      }
    ).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(24);
    allCrew.on('pointerdown', () => this.showCrewOverviewState());
    this.crewStageObjects.push(allCrew);

    const remove = this.add.text(
      STAGE.x + STAGE.w - 24,
      STAGE.y + 62,
      'REMOVE MEMBER',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#ffc0d7',
        backgroundColor: '#241018dd',
        padding: { x: 10, y: 7 },
      }
    ).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(24);
    remove.on('pointerdown', () => this.confirmRemoveCrewMember(member));
    this.crewStageObjects.push(remove);
  }

  confirmRemoveCrewMember(member) {
    if (!this.crewMode || !member) return;

    const depth = 180;
    const objects = [];
    const add = obj => { objects.push(obj); return obj; };
    const close = () => objects.forEach(obj => {
      try { obj?.destroy?.(); } catch (e) {}
    });

    add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.80)
      .setDepth(depth).setInteractive());

    add(this.add.rectangle(780, 420, 760, 350, 0x09131d, 1)
      .setStrokeStyle(2, 0xff7cac, 1).setDepth(depth + 1));

    add(this.add.text(780, 330, 'REMOVE CREW MEMBER?', {
      fontFamily: PIXEL_FONT,
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(depth + 2));

    add(this.add.text(
      780,
      397,
      'Their loan car leaves with them. Every upgrade on that car is lost.\nYou can recruit another driver from this region later.',
      {
        fontFamily: BODY_FONT,
        fontSize: '12px',
        color: '#c5d2da',
        fontStyle: '600',
        align: 'center',
        wordWrap: { width: 650 },
      }
    ).setOrigin(0.5).setDepth(depth + 2));

    const keep = add(this.add.rectangle(650, 505, 220, 48, 0x151d28, 1)
      .setStrokeStyle(1, 0x657d8c, 1).setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    add(this.add.text(650, 505, 'KEEP MEMBER', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#d2dce2',
    }).setOrigin(0.5).setDepth(depth + 3));

    const removeButton = add(this.add.rectangle(910, 505, 220, 48, 0x351820, 1)
      .setStrokeStyle(2, 0xff7cac, 1).setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    add(this.add.text(910, 505, 'REMOVE', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#ffd1e0',
    }).setOrigin(0.5).setDepth(depth + 3));

    keep.on('pointerdown', close);
    removeButton.on('pointerdown', () => {
      removeCrewMember(this.registry, member.regionId);
      this.selectedCarId = null;
      this.registry.set('selectedCarId', null);
      this.registry.set('selectedRacePlayerCharacterId', null);
      close();
      this.showCrewOverviewState();
      this.refreshDynoButton?.();
      saveSessionState(this.registry);
    });
  }

  drawScene() {
    this.add.rectangle(780, 420, 1560, 840, 0x050a11).setDepth(-20);

    this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x08121d,
      1
    ).setStrokeStyle(2, 0x24475f, 1).setDepth(-12);

    const activeWorkshop = getWorkshopByLocationId(
      this.registry.get('workshopLocationId') || 'shinonomeWorkshop'
    );
    const workshopTexture = this.crewMode
      ? (this.worldPhase === 'day' ? 'crewSpaceDayBg' : 'crewSpaceNightBg')
      : (() => {
          const phaseBackground = getWorkshopPhaseBackground(
            activeWorkshop,
            this.worldPhase || getWorldPhase()
          );
          return phaseBackground?.key && this.textures.exists(phaseBackground.key)
            ? phaseBackground.key
            : this.textures.exists(activeWorkshop.textureKey)
              ? activeWorkshop.textureKey
              : 'garageWorkshopBg';
        })();

    const workshop = this.add.image(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      workshopTexture
    ).setDepth(-10);

    if (this.crewMode) this.applyCrewSpaceBackgroundTexture(workshop, workshopTexture);
    else this.applyWorkshopBackgroundTexture(workshop, workshopTexture, activeWorkshop);
    this.workshopBackgroundImage = workshop;
    this.workshopBackgroundWorkshop = activeWorkshop;

    const maskShape = this.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
    workshop.setMask(maskShape.createGeometryMask());

    this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x03101b,
      this.crewMode ? 0.02 : 0.06
    ).setDepth(-9);

    if (this.crewMode) {
      this.drawCrewOverview();
      return;
    }

    if (activeWorkshop.tier > 0) {
      this.add.rectangle(STAGE.x + 142, STAGE.y + 30, 238, 34, 0x06101b, 0.82)
        .setStrokeStyle(1, 0x43dfff, 0.62)
        .setDepth(18);
      this.add.text(STAGE.x + 28, STAGE.y + 30, activeWorkshop.shortLabel, {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#cbefff',
      }).setOrigin(0, 0.5).setDepth(19);
    }

    const playerCharacter = characters[this.registry.get('playerCharacterId')] || characters.renMizuno;
    this.addGarageCharacter(
      playerCharacter,
      PLAYER_CFG.x,
      PLAYER_CFG.feetY,
      PLAYER_CFG.targetHeight,
      14
    );
  }

  addGarageCharacter(character, x, feetY, targetHeight, depth) {
    const sprite = this.add.image(x, feetY, character.visual.spriteKey)
      .setOrigin(0.5, 1)
      .setDepth(depth);

    const source = this.textures.get(character.visual.spriteKey).getSourceImage();
    sprite.setScale(targetHeight / source.height);

    this.add.ellipse(
      x + 12,
      feetY - 16,
      Math.max(60, sprite.displayWidth * 0.80),
      30,
      0x000000,
      0.58
    ).setDepth(depth - 0.12);

    this.add.ellipse(
      x + 9,
      feetY - 11,
      Math.max(44, sprite.displayWidth * 0.60),
      18,
      0x000000,
      0.84
    ).setDepth(depth - 0.08);

    return sprite;
  }

  buildMagazineProp() {
    const issue = getActiveMagazineIssue(this.registry);
    if (!issue?.coverKey || !this.textures.exists(issue.coverKey)) return;

    // Physical magazine lives on the lower-left of the workshop scene. Keep it
    // separate from the garage strip so it reads as an object inside the room.
    const x = STAGE.x + 82;
    const y = STAGE.y + STAGE.h - 98;
    const angle = -9;
    const displayW = 92;
    const displayH = 122;

    this.add.rectangle(
      x + 7,
      y + 9,
      displayW + 6,
      displayH + 6,
      0x000000,
      0.46
    ).setAngle(angle).setDepth(23);

    const cover = this.add.image(x, y, issue.coverKey)
      .setDisplaySize(displayW, displayH)
      .setAngle(angle)
      .setInteractive({ useHandCursor: true })
      .setDepth(25);

    const baseScaleX = cover.scaleX;
    const baseScaleY = cover.scaleY;

    cover.on('pointerover', () => {
      cover.setScale(baseScaleX * 1.045, baseScaleY * 1.045);
    });
    cover.on('pointerout', () => {
      cover.setScale(baseScaleX, baseScaleY);
    });
    cover.on('pointerdown', () => showMagazinePanel(this));
  }

  buildHeader() {
    this.add.rectangle(780, 35, 1512, 62, 0x07111d, 1)
      .setStrokeStyle(2, 0x173249, 1)
      .setDepth(40);

    this.add.text(52, 35, this.crewMode ? 'CREW SPACE' : 'WORKSHOP', {
      fontFamily: PIXEL_FONT, fontSize: '20px', color: '#eefaff'
    }).setOrigin(0, 0.5).setDepth(42);

    this.headerCarText = this.add.text(
      305,
      35,
      this.crewMode ? 'CREW ' + (getCrewCount(this.registry) + 1) + '/8' : '',
      {
        fontFamily: PIXEL_FONT, fontSize: '11px', color: '#8bbde0'
      }
    ).setOrigin(0, 0.5).setDepth(42);

    const wins = this.registry.get('wins') ?? 0;
    const losses = this.registry.get('losses') ?? 0;
    const cash = this.registry.get('cash') ?? 50000;

    this.add.text(1250, 25, 'WINS  ' + wins, {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#b4ccdb'
    }).setOrigin(1, 0.5).setDepth(42);
    this.add.text(1250, 47, 'LOSSES  ' + losses, {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#b4ccdb'
    }).setOrigin(1, 0.5).setDepth(42);

    // Keep utility buttons clear of the enlarged W/L record on phone layouts.
    addSettingsButton(this, 925, 35);


    this.cashText = this.add.text(1512, 35, '¥ ' + Number(cash).toLocaleString('en-US'), {
      fontFamily: PIXEL_FONT, fontSize: '15px', color: '#ffe08a'
    }).setOrigin(1, 0.5).setDepth(42);
  }

  showCouponsPopup() {
    const coupons = this.registry.get('carCoupons') || {};
    const entries = carOrder
      .filter(carId => cars[carId] && Number(coupons[carId] || 0) > 0)
      .map(carId => ({
        carId,
        count: Math.max(0, Math.floor(Number(coupons[carId] || 0))),
        required: Math.max(1, Number(getCarCouponRequirement(carId) || 2)),
      }));

    const depth = 270;
    const objects = [];
    const add = obj => {
      objects.push(obj);
      return obj;
    };
    const close = () => objects.forEach(obj => obj?.destroy?.());

    const blocker = add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.78)
      .setDepth(depth)
      .setInteractive());

    add(this.add.rectangle(780, 420, 700, 570, 0x08131f, 0.995)
      .setStrokeStyle(2, 0x43dfff, 1)
      .setDepth(depth + 1));

    add(this.add.text(470, 170, 'CAR COUPONS', {
      fontFamily: PIXEL_FONT,
      fontSize: '14px',
      color: '#eefaff',
    }).setDepth(depth + 2));

    add(this.add.text(470, 212, 'Only coupon cars you have discovered are shown here.', {
      fontFamily: BODY_FONT,
      fontSize: '11px',
      color: '#a7bdca',
      fontStyle: '600',
    }).setDepth(depth + 2));

    if (!entries.length) {
      add(this.add.text(780, 390, 'NO CAR COUPONS YET', {
        fontFamily: PIXEL_FONT,
        fontSize: '10px',
        color: '#708694',
      }).setOrigin(0.5).setDepth(depth + 2));
    } else {
      entries.slice(0, 7).forEach((entry, index) => {
        const y = 275 + index * 48;
        const complete = entry.count >= entry.required;

        add(this.add.rectangle(
          780,
          y,
          610,
          38,
          complete ? 0x112a26 : 0x0d1b29,
          1
        ).setStrokeStyle(1, complete ? 0x62e8c7 : 0x315470, 1)
          .setDepth(depth + 2));

        add(this.add.text(500, y, cars[entry.carId].shortName, {
          fontFamily: PIXEL_FONT,
          fontSize: '8px',
          color: '#eef8ff',
        }).setOrigin(0, 0.5).setDepth(depth + 3));

        add(this.add.text(
          1060,
          y,
          entry.count + ' / ' + entry.required + (complete ? '  //  READY' : ''),
          {
            fontFamily: PIXEL_FONT,
            fontSize: '7px',
            color: complete ? '#86efd7' : '#a7c6d8',
          }
        ).setOrigin(1, 0.5).setDepth(depth + 3));
      });
    }

    const closeButton = add(this.add.rectangle(780, 650, 190, 46, 0x151d28, 1)
      .setStrokeStyle(1, 0x657d8c, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));

    add(this.add.text(780, 650, 'CLOSE', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#c4d5df',
    }).setOrigin(0.5).setDepth(depth + 3));

    closeButton.on('pointerdown', close);
    blocker.on('pointerdown', close);
  }

  buildCarLabel() {
    this.add.rectangle(206, 566, 330, 72, 0x07111d, 0.94)
      .setStrokeStyle(1, 0x26465e, 1)
      .setDepth(31);

    this.carNameText = this.add.text(52, 542, '', {
      fontFamily: PIXEL_FONT, fontSize: '14px', color: '#ffffff'
    }).setDepth(32);

    this.carSubText = this.add.text(52, 575, '', {
      fontFamily: BODY_FONT, fontSize: '18px', color: '#79bce3', fontStyle: '600'
    }).setDepth(32);
  }

  buildSpecsAndUpgrades() {
    this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + SIDE.h / 2,
      SIDE.w,
      SIDE.h,
      0x07111d,
      0.98
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(35);

    this.add.text(
      SIDE.x + 20,
      SIDE.y + 18,
      this.crewMode ? 'CREW CAR SPECS' : 'CAR SPECS',
      {
        fontFamily: PIXEL_FONT, fontSize: '14px', color: '#8cc8ec'
      }
    ).setDepth(37);

    const rows = [
      ['ENGINE', 'engine'],
      ['POWER', 'power'],
      ['TORQUE', 'torque'],
      ['WEIGHT', 'weight'],
    ];

    this.specValueTexts = {};
    rows.forEach((row, i) => {
      const y = SIDE.y + 76 + i * 32;
      this.add.line(
        SIDE.x + SIDE.w / 2,
        y + 16,
        SIDE.x + 20,
        0,
        SIDE.x + SIDE.w - 20,
        0,
        0x27465d,
        0.75
      ).setDepth(36);

      this.add.text(SIDE.x + 20, y, row[0], {
        fontFamily: PIXEL_FONT, fontSize: '11px', color: '#9cc6df'
      }).setOrigin(0, 0.5).setDepth(37);

      this.specValueTexts[row[1]] = this.add.text(SIDE.x + SIDE.w - 20, y, '', {
        fontFamily: PIXEL_FONT, fontSize: '12px', color: '#ffffff'
      }).setOrigin(1, 0.5).setDepth(37);
    });

    this.tuningStatusText = this.add.text(
      SIDE.x + 20,
      SIDE.y + 230,
      this.crewMode
        ? 'CREW TUNING // WAREHOUSE HQ'
        : 'TUNING // ' + this.getActiveWorkshop().shortLabel,
      {
        fontFamily: PIXEL_FONT, fontSize: '10px', color: '#8cc8ec'
      }
    ).setDepth(37);

    const categories = ['ENGINE', 'DRIVETRAIN', 'EXHAUST / NOS', 'CHASSIS'];

    categories.forEach((name, i) => {
      const y = SIDE.y + 285 + i * 48;
      const box = this.add.rectangle(SIDE.x + SIDE.w / 2, y, SIDE.w - 36, 40, 0x0b1724, 1)
        .setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(37);

      const label = this.add.text(SIDE.x + 30, y, name, {
        fontFamily: PIXEL_FONT,
        fontSize: '11px',
        color: '#a9c7da'
      }).setOrigin(0, 0.5).setDepth(38);

      const arrow = this.add.text(SIDE.x + SIDE.w - 30, y, '>', {
        fontFamily: PIXEL_FONT, fontSize: '14px', color: '#8cb6cf'
      }).setOrigin(0.5).setDepth(38);

      box.on('pointerdown', () => {
        if (!this.selectedCarId) return;
        if (this.isSelectedCarTuningLocked()) {
          this.showWorkshopToast('COLLECTOR CAR // TUNING SEALED');
          return;
        }
        this.selectUpgrade(name);
        if (name === 'ENGINE') {
          this.enterEngineMode();
          return;
        }
        if (name === 'DRIVETRAIN') {
          this.enterSecondaryTuningMode('drivetrain');
          return;
        }
        if (name === 'CHASSIS') {
          this.enterChassisMode();
          return;
        }
        if (name === 'EXHAUST / NOS') {
          this.enterSecondaryTuningMode('exhaustNos');
          return;
        }
        this.selectUpgrade(name);
      });

      this.upgradeButtons.push({ name, box, label, arrow });
    });

  }

  isSelectedCarTuningLocked() {
    const car = cars[this.selectedCarId];
    const state = (this.registry.get('carStates') || {})[this.selectedCarId] || {};
    return Boolean(car?.tuningLocked || state.tuningLocked || state.immutable || state.collector);
  }

  refreshTuningCategoryAvailability() {
    const locked = Boolean(this.selectedCarId && this.isSelectedCarTuningLocked());

    if (this.tuningStatusText) {
      this.tuningStatusText
        .setText(
          locked
            ? 'COLLECTOR SPEC (TUNING SEALED)'
            : 'TUNING // ' + this.getActiveWorkshop().shortLabel
        )
        .setColor(locked ? '#d7a0b8' : '#8cc8ec');
    }

    this.upgradeButtons.forEach(item => {
      if (locked || !this.selectedCarId) {
        item.box.disableInteractive()
          .setFillStyle(0x111318, 1)
          .setStrokeStyle(1, 0x4e4149, 1);
        item.label.setColor('#756873');
        item.arrow.setText('—').setColor('#655965');
      } else {
        item.box.setInteractive({ useHandCursor: true })
          .setFillStyle(0x0b1724, 1)
          .setStrokeStyle(1, 0x315470, 1);
        item.label.setColor('#a9c7da');
        item.arrow.setText('>').setColor('#8cb6cf');
      }
    });
  }

  getActiveWorkshop() {
    return getWorkshopByLocationId(
      this.registry.get('workshopLocationId') || this.activeWorkshopId || 'shinonomeWorkshop'
    );
  }

  syncGarageAssignments() {
    this.activeWorkshopId = this.getActiveWorkshop().id;
    this.carGarageLocations = normaliseCarGarageLocations(
      this.ownedCarIds,
      this.registry.get('carGarageLocations') || this.carGarageLocations || {},
      Number(this.registry.get('garageTier') || 0)
    );
    this.registry.set('carGarageLocations', this.carGarageLocations);
    return this.carGarageLocations;
  }

  getCurrentWorkshopCars() {
    if (this.crewMode) {
      return Object.values(getCrewMembers(this.registry))
        .map(member => member.loanCarId)
        .filter(id => cars[id] && this.ownedCarIds.includes(id));
    }

    const assignments = this.syncGarageAssignments();
    return getCarsInWorkshop(
      this.ownedCarIds,
      assignments,
      this.getActiveWorkshop().id
    ).filter(id => !cars[id]?.crewLoan);
  }

  getWorkshopAdjustedCost(baseCost) {
    return applyWorkshopServiceCost(baseCost, this.getActiveWorkshop().id);
  }

  canInstallCurrentUpgrade(category, partId, level) {
    return canInstallTuningLevel(
      category,
      partId,
      level,
      this.getActiveWorkshop().id,
      Number(this.registry.get('wins') || 0),
      Boolean(this.registry.get('devMode'))
    );
  }

  getCurrentUpgradeRequirement(category, partId, level) {
    return getTuningRequirementLabel(
      category,
      partId,
      level,
      this.getActiveWorkshop().id,
      Number(this.registry.get('wins') || 0),
      Boolean(this.registry.get('devMode'))
    );
  }

  buildGarageStrip() {
    this.garageStripPanel = this.add.rectangle(
      STRIP.x + STRIP.w / 2,
      STRIP.y + STRIP.h / 2,
      STRIP.w,
      STRIP.h,
      0x07111d,
      0.99
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(30);

    this.add.text(
      STRIP.x + 18,
      STRIP.y + 7,
      this.crewMode ? 'CREW LOAN GARAGE' : 'MY GARAGE',
      {
        fontFamily: PIXEL_FONT, fontSize: '12px', color: '#a7d5ef'
      }
    ).setDepth(32);

    this.garageCountText = this.add.text(STRIP.x + STRIP.w - 18, STRIP.y + 14, '', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#7fa6bd'
    }).setOrigin(1, 0).setDepth(32);

    const navY = STRIP.y + 100;
    this.garagePrevButton = this.add.rectangle(
      STRIP.x + 28,
      navY,
      38,
      112,
      0x0a1521,
      0.96
    ).setStrokeStyle(1, 0x315470, 1).setDepth(35);

    this.garagePrevLabel = this.add.text(STRIP.x + 28, navY, '<', {
      fontFamily: PIXEL_FONT,
      fontSize: '16px',
      color: '#9edcf7',
    }).setOrigin(0.5).setDepth(36);

    this.garageNextButton = this.add.rectangle(
      STRIP.x + STRIP.w - 28,
      navY,
      38,
      112,
      0x0a1521,
      0.96
    ).setStrokeStyle(1, 0x315470, 1).setDepth(35);

    this.garageNextLabel = this.add.text(STRIP.x + STRIP.w - 28, navY, '>', {
      fontFamily: PIXEL_FONT,
      fontSize: '16px',
      color: '#9edcf7',
    }).setOrigin(0.5).setDepth(36);

    this.garagePageText = this.add.text(
      STRIP.x + STRIP.w / 2,
      STRIP.y + 16,
      '',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#607f92',
      }
    ).setOrigin(0.5, 0).setDepth(32);

    this.garagePrevButton.on('pointerdown', () => this.changeGaragePage(-1));
    this.garageNextButton.on('pointerdown', () => this.changeGaragePage(1));

    // Swipe anywhere across the garage strip to reveal the next four local slots.
    this.input.on('pointerup', pointer => {
      if (this.engineMode || this.secondaryMode || this.chassisMode) return;

      const downInside = pointer.downY >= STRIP.y && pointer.downY <= STRIP.y + STRIP.h;
      const upInside = pointer.y >= STRIP.y && pointer.y <= STRIP.y + STRIP.h;
      if (!downInside || !upInside) return;

      const dx = pointer.x - pointer.downX;
      const dy = pointer.y - pointer.downY;
      if (Math.abs(dx) < 72 || Math.abs(dy) > 64) return;

      this.changeGaragePage(dx < 0 ? 1 : -1);
    });

    this.renderGaragePage();
  }

  renderGaragePage() {
    this.garagePageObjects.forEach(obj => obj?.destroy?.());
    this.garagePageObjects = [];
    this.thumbButtons = [];

    const add = obj => {
      this.garagePageObjects.push(obj);
      return obj;
    };

    const activeWorkshop = this.getActiveWorkshop();
    const localCars = this.getCurrentWorkshopCars();
    const capacity = this.crewMode ? 7 : getWorkshopStorageCapacity(activeWorkshop.id);
    const totalCapacity = this.crewMode
      ? 7
      : getGarageCapacity(this.registry.get('garageTier') || 0);
    const pageSize = this.garagePageSize || 4;
    const totalPages = Math.max(1, Math.ceil(capacity / pageSize));
    this.garagePage = Phaser.Math.Clamp(Number(this.garagePage || 0), 0, totalPages - 1);

    const startIndex = this.garagePage * pageSize;
    const gap = 12;
    const usableLeft = STRIP.x + 58;
    const usableRight = STRIP.x + STRIP.w - 58;
    const usableWidth = usableRight - usableLeft;
    const cardW = (usableWidth - gap * (pageSize - 1)) / pageSize;
    const startX = usableLeft + cardW / 2;
    const y = STRIP.y + 100;

    for (let localIndex = 0; localIndex < pageSize; localIndex++) {
      const slotIndex = startIndex + localIndex;
      if (slotIndex >= capacity) break;

      const id = localCars[slotIndex] || null;
      const x = startX + localIndex * (cardW + gap);
      const active = id === this.selectedCarId;

      const box = add(this.add.rectangle(
        x,
        y,
        cardW,
        112,
        id ? (active ? 0x10263a : 0x0b1724) : 0x050a10,
        id ? 1 : 0.56
      ).setStrokeStyle(
        active ? 3 : id ? 2 : 1,
        active ? 0x41dcff : id ? 0x29465c : 0x26333d,
        id ? 1 : 0.46
      ).setDepth(32));

      if (!id) {
        add(this.add.text(x, y - 8, 'EMPTY SLOT', {
          fontFamily: PIXEL_FONT, fontSize: '8px', color: '#40515d'
        }).setOrigin(0.5).setDepth(34));
        add(this.add.text(
          x,
          y + 24,
          this.crewMode ? 'RECRUIT A DRIVER' : 'MOVE OR WIN A CAR',
          {
            fontFamily: PIXEL_FONT, fontSize: '6px', color: '#31414c'
          }
        ).setOrigin(0.5).setDepth(34));
        continue;
      }

      box.setInteractive({ useHandCursor: true });
      const thumbWidth = Math.min(THUMB_CFG.targetWidth, cardW - 30);

      // Workshop thumbnails used to be visually stable for many revisions.
      // Keep their whole car canvas on an authored card-local origin instead
      // of solving a second tyre-contact baseline at tiny scale.
      const thumbBodyY = y + THUMB_CFG.bodyYOffset;
      const display = this.createCarDisplay(cars[id], x, thumbBodyY, thumbWidth, 42);
      display.forEach(obj => {
        // Do NOT force every returned object visible here. Replacement body
        // kits intentionally hide the stock body layers inside createCarDisplay.
        // Re-enabling them produced the doubled/misaligned garage thumbnails.
        obj?.setAlpha?.(1);
        add(obj);
      });

      const crewMember = this.crewMode ? this.getCrewMemberForLoanCar(id) : null;
      const cardLabel = crewMember
        ? String(characters[crewMember.characterId]?.name || crewMember.characterId).toUpperCase() +
          '\n' + String(cars[id].shortName || id).toUpperCase()
        : cars[id].shortName;
      const label = add(this.add.text(x, y + 34, cardLabel, {
        fontFamily: PIXEL_FONT,
        fontSize: this.crewMode ? '6px' : '9px',
        color: active ? '#ffffff' : '#b8cad7',
        align: 'center',
        lineSpacing: this.crewMode ? 3 : 0,
      }).setOrigin(0.5).setDepth(48));

      box.on('pointerup', pointer => {
        const movedX = Math.abs(pointer.x - pointer.downX);
        const movedY = Math.abs(pointer.y - pointer.downY);
        if (movedX <= 20 && movedY <= 20) this.selectCar(id);
      });

      this.thumbButtons.push({ id, box, label, display });
    }

    this.garageCountText.setText(
      this.crewMode
        ? localCars.length + '/7 LOAN CARS'
        : localCars.length + '/' + capacity + ' HERE  //  ' +
          this.ownedCarIds.filter(id => !cars[id]?.crewLoan).length +
          '/' + totalCapacity + ' TOTAL'
    );

    this.garagePageText.setText(
      totalPages > 1
        ? activeWorkshop.shortLabel + '  //  SLOTS ' +
          (startIndex + 1) + '-' + Math.min(startIndex + pageSize, capacity) +
          '  //  ' + (this.garagePage + 1) + '/' + totalPages
        : this.crewMode
          ? 'CREW SPACE // 7 REGIONAL LOAN SLOTS'
          : activeWorkshop.shortLabel + '  //  ' + capacity + ' SLOTS'
    );

    this.updateGarageNavState();
    this.updateMoveCarButtonState();
  }

  changeGaragePage(delta) {
    if (this.engineMode || this.secondaryMode || this.chassisMode) return;

    const capacity = this.crewMode
      ? 7
      : getWorkshopStorageCapacity(this.getActiveWorkshop().id);
    const totalPages = Math.max(1, Math.ceil(capacity / (this.garagePageSize || 4)));
    const nextPage = Phaser.Math.Clamp(
      Number(this.garagePage || 0) + Number(delta || 0),
      0,
      totalPages - 1
    );

    if (nextPage === this.garagePage) return;
    this.garagePage = nextPage;
    this.renderGaragePage();
  }

  updateGarageNavState() {
    const capacity = this.crewMode
      ? 7
      : getWorkshopStorageCapacity(this.getActiveWorkshop().id);
    const totalPages = Math.max(1, Math.ceil(capacity / (this.garagePageSize || 4)));
    const locked = Boolean(this.engineMode || this.secondaryMode || this.chassisMode);
    const canPrev = !locked && this.garagePage > 0;
    const canNext = !locked && this.garagePage < totalPages - 1;

    const apply = (button, label, enabled) => {
      if (!button || !label) return;
      if (enabled) {
        button.setInteractive({ useHandCursor: true })
          .setFillStyle(0x0a1521, 0.96)
          .setStrokeStyle(1, 0x315470, 1);
        label.setColor('#9edcf7');
      } else {
        button.disableInteractive()
          .setFillStyle(0x080e15, 0.84)
          .setStrokeStyle(1, 0x263641, 0.70);
        label.setColor('#465965');
      }
    };

    apply(this.garagePrevButton, this.garagePrevLabel, canPrev);
    apply(this.garageNextButton, this.garageNextLabel, canNext);
    this.updateMoveCarButtonState();
  }

  updateMoveCarButtonState() {
    if (!this.moveCarButton || !this.moveCarLabel) return;

    const locked = Boolean(this.engineMode || this.secondaryMode || this.chassisMode);
    const currentWorkshopId = this.getActiveWorkshop().id;
    const alternatives = getUnlockedWorkshops(this.registry.get('garageTier') || 0)
      .filter(workshop =>
        workshop.id !== currentWorkshopId &&
        getWorkshopUsage(
          this.ownedCarIds,
          this.carGarageLocations || {},
          workshop.id
        ) < getWorkshopStorageCapacity(workshop.id)
      );

    const crewLoan = Boolean(cars[this.selectedCarId]?.crewLoan);
    const enabled =
      !locked &&
      !crewLoan &&
      Boolean(this.selectedCarId) &&
      alternatives.length > 0;

    if (enabled) {
      this.moveCarButton
        .setInteractive({ useHandCursor: true })
        .setFillStyle(0x102138, 1)
        .setStrokeStyle(2, 0x55b8ff, 1);
      this.moveCarLabel.setColor('#eef8ff').setText('MOVE CAR  >');
    } else {
      this.moveCarButton
        .disableInteractive()
        .setFillStyle(0x17181d, 1)
        .setStrokeStyle(1, 0x514f55, 1);
      this.moveCarLabel
        .setColor('#817d84')
        .setText(crewLoan ? 'CREW LOAN // WAREHOUSE' : 'MOVE CAR');
    }
  }

  showMoveCarPopup() {
    if (
      !this.selectedCarId ||
      cars[this.selectedCarId]?.crewLoan ||
      this.engineMode ||
      this.secondaryMode ||
      this.chassisMode
    ) return;

    this.syncGarageAssignments();
    const currentWorkshop = this.getActiveWorkshop();
    const unlocked = getUnlockedWorkshops(this.registry.get('garageTier') || 0);
    const depth = 150;
    const objects = [];
    const add = obj => {
      objects.push(obj);
      return obj;
    };
    const close = () => objects.forEach(obj => obj?.destroy?.());

    const blocker = add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.78)
      .setDepth(depth)
      .setInteractive());

    add(this.add.rectangle(780, 420, 840, 570, 0x08131f, 0.99)
      .setStrokeStyle(2, 0x43dfff, 1)
      .setDepth(depth + 1));

    add(this.add.text(405, 175, 'MOVE ' + cars[this.selectedCarId].shortName, {
      fontFamily: PIXEL_FONT,
      fontSize: '14px',
      color: '#eefaff',
    }).setDepth(depth + 2));

    add(this.add.text(405, 220, 'Choose a destination garage. Transport is charged before the car is moved.', {
      fontFamily: BODY_FONT,
      fontSize: '12px',
      color: '#a7bdca',
      fontStyle: '600',
      wordWrap: { width: 660 },
    }).setDepth(depth + 2));

    const performTransfer = (workshop, transferCost, confirmObjects = []) => {
      const movedCarId = this.selectedCarId;
      const cash = Number(this.registry.get('cash') || 0);

      this.syncGarageAssignments();
      const liveSourceId = this.carGarageLocations?.[movedCarId];
      if (liveSourceId !== currentWorkshop.id) {
        confirmObjects.forEach(obj => obj?.destroy?.());
        close();
        this.showWorkshopToast('CAR LOCATION CHANGED // REOPEN MOVE CAR');
        return;
      }

      const destinationUsage = getWorkshopUsage(
        this.ownedCarIds,
        this.carGarageLocations || {},
        workshop.id
      );
      if (destinationUsage >= getWorkshopStorageCapacity(workshop.id)) {
        confirmObjects.forEach(obj => obj?.destroy?.());
        close();
        this.showWorkshopToast('DESTINATION GARAGE IS FULL');
        return;
      }

      if (cash < transferCost) {
        confirmObjects.forEach(obj => obj?.destroy?.());
        close();
        this.showWorkshopToast('NOT ENOUGH CASH FOR TRANSPORT');
        return;
      }

      const requestedLocations = {
        ...(this.carGarageLocations || {}),
        [movedCarId]: workshop.id,
      };
      const validatedLocations = normaliseCarGarageLocations(
        this.ownedCarIds,
        requestedLocations,
        Number(this.registry.get('garageTier') || 0)
      );

      if (validatedLocations?.[movedCarId] !== workshop.id) {
        confirmObjects.forEach(obj => obj?.destroy?.());
        close();
        this.showWorkshopToast('TRANSFER FAILED // GARAGE ASSIGNMENT NOT SAVED');
        return;
      }

      this.carGarageLocations = validatedLocations;
      this.registry.set('carGarageLocations', validatedLocations);
      this.registry.set('cash', cash - transferCost);

      // Moving a car is a storage/logistics action only. Keep the player in the
      // current workshop and update the assignment in-place.
      const remainingLocalCars = getCarsInWorkshop(
        this.ownedCarIds,
        validatedLocations,
        currentWorkshop.id
      );
      const nextSelectedCarId = remainingLocalCars[0] || null;
      this.selectedCarId = nextSelectedCarId;
      this.registry.set('selectedCarId', nextSelectedCarId);
      saveSessionState(this.registry);

      this.cashText?.setText('¥ ' + Number(cash - transferCost).toLocaleString('en-US'));

      confirmObjects.forEach(obj => obj?.destroy?.());
      close();

      // iOS/PWA can stall a re-entrant Phaser scene restart after its loader
      // reaches 97%. Use the same clean reload path as workshop switching.
      this.registry.set('workshopLocationId', currentWorkshop.id);
      try {
        sessionStorage.setItem('tokyoShiftInternalReload', '1');
        sessionStorage.setItem('tokyoShiftForceGarage', '1');
        sessionStorage.removeItem('tokyoShiftBootMessage');
      } catch (e) {}
      window.location.reload();
    };

    const openConfirmation = (workshop, transferCost) => {
      const confirmObjects = [];
      const addConfirm = obj => {
        confirmObjects.push(obj);
        return obj;
      };
      const closeConfirm = () => confirmObjects.forEach(obj => obj?.destroy?.());
      const cash = Number(this.registry.get('cash') || 0);

      addConfirm(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.50)
        .setDepth(depth + 10)
        .setInteractive());

      addConfirm(this.add.rectangle(780, 420, 660, 360, 0x091520, 1)
        .setStrokeStyle(2, 0x62e8c7, 1)
        .setDepth(depth + 11));

      addConfirm(this.add.text(780, 315, 'CONFIRM TRANSFER', {
        fontFamily: PIXEL_FONT,
        fontSize: '14px',
        color: '#f0fbff',
      }).setOrigin(0.5).setDepth(depth + 12));

      addConfirm(this.add.text(
        780,
        382,
        cars[this.selectedCarId].shortName + '  →  ' + workshop.label,
        {
          fontFamily: PIXEL_FONT,
          fontSize: '10px',
          color: '#8eeaff',
          align: 'center',
        }
      ).setOrigin(0.5).setDepth(depth + 12));

      addConfirm(this.add.text(
        780,
        430,
        'TRANSPORT  ¥ ' + transferCost.toLocaleString('en-US') +
          '   //   CASH AFTER  ¥ ' + Math.max(0, cash - transferCost).toLocaleString('en-US'),
        {
          fontFamily: BODY_FONT,
          fontSize: '11px',
          color: '#b8cbd7',
          fontStyle: '600',
        }
      ).setOrigin(0.5).setDepth(depth + 12));

      const cancel = addConfirm(this.add.rectangle(650, 510, 210, 56, 0x151d28, 1)
        .setStrokeStyle(1, 0x657d8c, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(depth + 12));
      addConfirm(this.add.text(650, 510, 'CANCEL', {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: '#c4d5df',
      }).setOrigin(0.5).setDepth(depth + 13));

      const confirm = addConfirm(this.add.rectangle(910, 510, 250, 56, 0x0c2827, 1)
        .setStrokeStyle(2, 0x62e8c7, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(depth + 12));
      addConfirm(this.add.text(910, 510, 'MOVE CAR  //  ¥ ' + transferCost.toLocaleString('en-US'), {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#f1fffb',
      }).setOrigin(0.5).setDepth(depth + 13));

      cancel.on('pointerdown', closeConfirm);
      confirm.on('pointerdown', () => performTransfer(workshop, transferCost, confirmObjects));
    };

    unlocked.forEach((workshop, index) => {
      const y = 305 + index * 100;
      const usage = getWorkshopUsage(
        this.ownedCarIds,
        this.carGarageLocations || {},
        workshop.id
      );
      const capacity = getWorkshopStorageCapacity(workshop.id);
      const isCurrent = workshop.id === currentWorkshop.id;
      const full = usage >= capacity;
      const transferCost = getWorkshopTransferCost(currentWorkshop.id, workshop.id);
      const cash = Number(this.registry.get('cash') || 0);
      const affordable = cash >= transferCost;
      const enabled = !isCurrent && !full && affordable;

      const box = add(this.add.rectangle(
        780,
        y,
        700,
        78,
        enabled ? 0x0b1724 : 0x090f16,
        1
      ).setStrokeStyle(
        isCurrent ? 2 : 1,
        isCurrent ? 0x43dfff : full ? 0x5e4247 : affordable ? 0x315470 : 0x65424a,
        1
      ).setDepth(depth + 2));

      add(this.add.text(455, y - 16, workshop.label, {
        fontFamily: PIXEL_FONT,
        fontSize: '10px',
        color: enabled || isCurrent ? '#eaf8ff' : '#707c84',
      }).setOrigin(0, 0.5).setDepth(depth + 3));

      add(this.add.text(
        455,
        y + 18,
        usage + ' / ' + capacity + ' CARS' +
          (isCurrent ? '  //  CURRENT GARAGE' : '  //  TRANSPORT ¥ ' + transferCost.toLocaleString('en-US')),
        {
          fontFamily: BODY_FONT,
          fontSize: '10px',
          color: '#91a9b8',
          fontStyle: '600',
        }
      ).setOrigin(0, 0.5).setDepth(depth + 3));

      add(this.add.text(
        1110,
        y,
        isCurrent ? 'CURRENT' : full ? 'FULL' : !affordable ? 'NEED ¥' + transferCost.toLocaleString('en-US') : 'SELECT  >',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '9px',
          color: isCurrent ? '#55e4ff' : full ? '#8f626a' : affordable ? '#62e8c7' : '#c9828d',
        }
      ).setOrigin(1, 0.5).setDepth(depth + 3));

      if (enabled) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => openConfirmation(workshop, transferCost));
      }
    });

    const closeButton = add(this.add.rectangle(1025, 645, 170, 48, 0x151d28, 1)
      .setStrokeStyle(1, 0x657d8c, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));

    add(this.add.text(1025, 645, 'CLOSE', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#c4d5df',
    }).setOrigin(0.5).setDepth(depth + 3));

    closeButton.on('pointerdown', close);
    blocker.on('pointerdown', close);
  }

  buildMoveCarButton() {
    const button = this.moveCarButton = this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      662,
      SIDE.w - 32,
      42,
      0x102138,
      1
    ).setStrokeStyle(2, 0x55b8ff, 1)
      .setDepth(40);

    this.moveCarLabel = this.add.text(
      SIDE.x + SIDE.w / 2,
      662,
      'MOVE CAR  >',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '10px',
        color: '#eef8ff',
      }
    ).setOrigin(0.5).setDepth(41);

    button.on('pointerdown', () => this.showMoveCarPopup());
    this.updateMoveCarButtonState();
  }

  buildWorkshopJumpButton() {
    const button = this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      716,
      SIDE.w - 32,
      40,
      0x122331,
      1
    ).setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(40);

    this.add.text(SIDE.x + SIDE.w / 2, 716, 'OTHER WORKSHOP  >', {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#eef8ff',
    }).setOrigin(0.5).setDepth(41);

    button.on('pointerdown', () => this.showWorkshopJumpPopup());
  }

  showWorkshopJumpPopup() {
    if (this.engineMode || this.secondaryMode || this.chassisMode) return;

    this.syncGarageAssignments();
    const current = this.getActiveWorkshop();
    const ownedTier = Math.max(0, Number(this.registry.get('garageTier') || 0));
    const depth = 150;
    const objects = [];
    const add = obj => {
      objects.push(obj);
      return obj;
    };
    const close = () => objects.forEach(obj => obj?.destroy?.());

    const reloadIntoWorkshop = workshop => {
      this.registry.set('workshopLocationId', workshop.id);
      const localCars = getCarsInWorkshop(
        this.ownedCarIds,
        this.registry.get('carGarageLocations') || this.carGarageLocations || {},
        workshop.id
      );
      this.registry.set('selectedCarId', localCars[0] || null);
      saveSessionState(this.registry);

      try {
        sessionStorage.setItem('tokyoShiftInternalReload', '1');
        sessionStorage.setItem('tokyoShiftForceGarage', '1');
        sessionStorage.removeItem('tokyoShiftBootMessage');
      } catch (e) {}

      window.location.reload();
    };

    const unlockWorkshop = workshop => {
      const liveTier = Math.max(0, Number(this.registry.get('garageTier') || 0));
      const cash = Math.max(0, Number(this.registry.get('cash') || 0));
      const cost = Math.max(0, Number(workshop.unlockCost || 0));

      if (
        workshop.tier !== liveTier + 1 ||
        cash < cost ||
        !isWorkshopProgressionReady(this.registry, workshop.tier)
      ) return;

      this.registry.set('garageTier', workshop.tier);
      this.registry.set('cash', cash - cost);
      this.registry.set('workshopLocationId', workshop.id);

      const requestedLocations = {
        ...(this.registry.get('carGarageLocations') || this.carGarageLocations || {}),
      };
      if (this.selectedCarId && this.ownedCarIds.includes(this.selectedCarId)) {
        requestedLocations[this.selectedCarId] = workshop.id;
      }

      const reassigned = normaliseCarGarageLocations(
        this.ownedCarIds,
        requestedLocations,
        workshop.tier
      );
      this.carGarageLocations = reassigned;
      this.registry.set('carGarageLocations', reassigned);

      const storyId = workshop.tier >= 2
        ? 'warehouseHqUnlocked'
        : workshop.tier >= 1
          ? 'canalYardUnlocked'
          : null;
      if (storyId) {
        try { sessionStorage.setItem('tokyoShiftPendingCutscene', storyId); } catch (e) {}
      }

      saveSessionState(this.registry);
      this.cashText?.setText('¥ ' + Number(cash - cost).toLocaleString('en-US'));

      try {
        sessionStorage.setItem('tokyoShiftInternalReload', '1');
        sessionStorage.setItem('tokyoShiftForceGarage', '1');
        sessionStorage.removeItem('tokyoShiftBootMessage');
      } catch (e) {}

      window.location.reload();
    };

    const blocker = add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.78)
      .setDepth(depth)
      .setInteractive());

    add(this.add.rectangle(780, 420, 760, 500, 0x08131f, 0.99)
      .setStrokeStyle(2, 0x43dfff, 1)
      .setDepth(depth + 1));

    add(this.add.text(440, 205, 'WORKSHOPS', {
      fontFamily: PIXEL_FONT,
      fontSize: '14px',
      color: '#eefaff',
    }).setDepth(depth + 2));

    add(this.add.text(
      440,
      248,
      'Jump between owned garages or unlock the next workshop here.',
      {
        fontFamily: BODY_FONT,
        fontSize: '11px',
        color: '#a7bdca',
        fontStyle: '600',
        wordWrap: { width: 650 },
      }
    ).setDepth(depth + 2));

    WORKSHOP_TIERS.forEach((workshop, index) => {
      const y = 330 + index * 82;
      const isUnlocked = workshop.tier <= ownedTier;
      const isCurrent = isUnlocked && workshop.id === current.id;
      const isNextUnlock = workshop.tier === ownedTier + 1;
      const cash = Math.max(0, Number(this.registry.get('cash') || 0));
      const cost = Math.max(0, Number(workshop.unlockCost || 0));
      const affordable = cash >= cost;
      const regionalWins = getTotalRegionalWins(this.registry);
      const requiredRegionalWins = getWorkshopRegionalWinRequirement(workshop.tier);
      const progressionReady = isWorkshopProgressionReady(this.registry, workshop.tier);
      const usage = isUnlocked
        ? getWorkshopUsage(
            this.ownedCarIds,
            this.carGarageLocations || {},
            workshop.id
          )
        : 0;
      const capacity = getWorkshopStorageCapacity(workshop.id);

      const fill = isCurrent
        ? 0x152a2a
        : isUnlocked
          ? 0x102138
          : isNextUnlock
            ? 0x211a12
            : 0x15171c;
      const stroke = isCurrent
        ? 0x62e8c7
        : isUnlocked
          ? 0x55b8ff
          : isNextUnlock
            ? 0xe4b660
            : 0x514f55;

      const box = add(this.add.rectangle(
        780,
        y,
        650,
        62,
        fill,
        1
      ).setStrokeStyle(2, stroke, 1)
        .setDepth(depth + 2));

      add(this.add.text(485, y - 10, workshop.label, {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: isUnlocked || isNextUnlock ? '#eef8ff' : '#817d84',
      }).setDepth(depth + 3));

      let meta = '';
      let metaColor = '#9fc7db';
      if (isCurrent) {
        meta = usage + ' / ' + capacity + ' CARS  //  HERE';
        metaColor = '#78ddc8';
      } else if (isUnlocked) {
        meta = usage + ' / ' + capacity + ' CARS  //  GO >';
      } else if (isNextUnlock) {
        if (!progressionReady) {
          meta = 'REGIONAL WINS  ' + regionalWins + '/' + requiredRegionalWins;
          metaColor = '#c99aa4';
        } else {
          meta = (affordable ? 'UNLOCK  ' : 'NEED  ') +
            '¥ ' + Number(cost).toLocaleString('en-US');
          metaColor = affordable ? '#f2d899' : '#c99aa4';
        }
      } else {
        meta = 'LOCKED // UNLOCK PREVIOUS WORKSHOP';
        metaColor = '#817d84';
      }

      add(this.add.text(1075, y + 12, meta, {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: metaColor,
        fontStyle: '700',
      }).setOrigin(1, 0.5).setDepth(depth + 3));

      if (isUnlocked && !isCurrent) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => reloadIntoWorkshop(workshop));
      } else if (!isUnlocked && isNextUnlock && affordable && progressionReady) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => unlockWorkshop(workshop));
      }
    });

    const closeButton = add(this.add.rectangle(780, 620, 190, 46, 0x151d28, 1)
      .setStrokeStyle(1, 0x657d8c, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));

    add(this.add.text(780, 620, 'CLOSE', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#c4d5df',
    }).setOrigin(0.5).setDepth(depth + 3));

    closeButton.on('pointerdown', close);
    blocker.on('pointerdown', close);
  }

  showCrewOverviewState({ preserveSelection = false } = {}) {
    if (!this.crewMode) return;

    for (const obj of this.selectedDisplay || []) {
      try { obj?.destroy?.(); } catch (e) {}
    }
    this.selectedDisplay = [];
    this.heroCarLayout = null;

    if (!preserveSelection) {
      this.selectedCarId = null;
      this.registry.set('selectedCarId', null);
      this.registry.set('selectedRacePlayerCharacterId', null);

      this.headerCarText?.setText(
        'CREW ' + (getCrewCount(this.registry) + 1) + '/8'
      );
      Object.values(this.specValueTexts || {}).forEach(text => text?.setText?.('—'));
      this.upgradeButtons?.forEach(item => {
        item.box.disableInteractive()
          .setFillStyle(0x0a1017, 1)
          .setStrokeStyle(1, 0x29343d, 1);
        item.label.setColor('#53626c');
        item.arrow.setText('—').setColor('#46545e');
      });
      this.meetButton?.disableInteractive()
        .setFillStyle(0x17181d, 1)
        .setStrokeStyle(1, 0x514f55, 1);
      this.meetButtonLabel?.setText('SELECT A CREW CAR').setColor('#817d84');
      this.refreshDynoButton?.();
    }

    this.drawCrewOverview();
    this.renderGaragePage();
    this.refreshCrewSpaceNavigationState();
    saveSessionState(this.registry);
  }

  restoreWarehouseAfterCrewSpace(selectedCarId = null) {
    if (this.crewMode) return;

    const localCars = this.getCurrentWorkshopCars();
    const nextCarId = localCars.includes(selectedCarId)
      ? selectedCarId
      : localCars.includes(this.selectedCarId)
        ? this.selectedCarId
        : localCars[0] || null;

    this.selectedCarId = nextCarId;
    this.registry.set('crewSpaceActive', false);
    this.registry.set('workshopLocationId', 'shinonomeWarehouseStrip');
    this.registry.set('selectedCarId', nextCarId);
    this.registry.set('selectedRacePlayerCharacterId', null);
    this.registry.set('crewPreviousCarId', null);

    // The Warehouse scene was slept, not rebuilt. Re-enable input/camera and
    // refresh only data that may have changed while Crew Space was open.
    try { this.input.enabled = true; } catch (e) {}
    try { if (this.input.keyboard) this.input.keyboard.enabled = true; } catch (e) {}
    this.cameras.main.resetFX?.();
    this.cameras.main.setAlpha(1);

    this.cashText?.setText(
      '¥ ' + Number(this.registry.get('cash') || 0).toLocaleString('en-US')
    );

    if (nextCarId) {
      // The hero car and buttons are deliberately left in place; they never
      // left the sleeping Warehouse scene. Just restore the selected card/UI.
      this.thumbButtons?.forEach(item => {
        const active = item.id === nextCarId;
        item.box
          ?.setFillStyle(active ? 0x10263a : 0x0b1724, 1)
          .setStrokeStyle(active ? 3 : 2, active ? 0x41dcff : 0x29465c, 1);
        item.label?.setColor(active ? '#ffffff' : '#b8cad7');
      });
      this.refreshWorkshopSpecs();
    }

    this.updateMoveCarButtonState();
    this.refreshDynoButton?.();
    saveSessionState(this.registry);
  }

  transitionWarehousePresentation(crewMode, selectedCarId = null) {
    if (this._warehousePresentationTransitioning) return;
    this._warehousePresentationTransitioning = true;

    const nextCrewMode = Boolean(crewMode);
    const currentScene = this.sys?.settings?.key;

    if (nextCrewMode && currentScene === 'GarageScene') {
      this.registry.set('crewSpaceActive', true);
      this.registry.set('workshopLocationId', 'shinonomeWarehouseStrip');
      this.registry.set('selectedCarId', null);
      this.registry.set('selectedRacePlayerCharacterId', null);
      saveSessionState(this.registry);
      cancelSceneLoading(this);

      // Keep Warehouse HQ alive exactly as rendered underneath Crew Space.
      // Sleeping preserves the selected hero car, physical-room hotspots and
      // all side-panel controls, so returning is an instant reveal rather than
      // another fragile rebuild of GarageScene.
      this.scene.launch('CrewSpaceScene', {
        crewMode: true,
        returningFromCrewSpace: true,
        workshopLocationId: 'shinonomeWarehouseStrip',
      });
      this.scene.sleep('GarageScene');
      this._warehousePresentationTransitioning = false;
      return;
    }

    if (!nextCrewMode && currentScene === 'CrewSpaceScene') {
      const warehouse = this.scene.get('GarageScene');
      const warehouseIsSleeping = this.scene.isSleeping('GarageScene');

      this.registry.set('crewSpaceActive', false);
      this.registry.set('workshopLocationId', 'shinonomeWarehouseStrip');
      this.registry.set('selectedCarId', selectedCarId || null);
      this.registry.set('selectedRacePlayerCharacterId', null);
      saveSessionState(this.registry);
      cancelSceneLoading(this);

      if (warehouse && warehouseIsSleeping) {
        warehouse.restoreWarehouseAfterCrewSpace?.(selectedCarId || null);
        this.scene.wake('GarageScene');
        this.scene.stop('CrewSpaceScene');
        this._warehousePresentationTransitioning = false;
        return;
      }

      // Recovery path for a direct Crew Space boot where no sleeping Warehouse
      // exists. This should be rare, but keeps old saves navigable.
      this.scene.start('GarageScene', {
        crewMode: false,
        returningFromCrewSpace: true,
        workshopLocationId: 'shinonomeWarehouseStrip',
      });
      return;
    }

    this._warehousePresentationTransitioning = false;
  }

  buildCrewSpaceNavigation() {
    if (!this.crewMode) return;

    // Rebuild this small persistent nav as a unit. This is deliberately
    // idempotent because GarageScene is restarted in place when moving between
    // Warehouse HQ and Crew Space.
    [
      this.crewBackButton,
      this.crewBackButtonLabel,
      this.dynoButton,
      this.dynoButtonLabel,
      this.meetButton,
      this.meetButtonLabel,
    ].forEach(obj => {
      if (obj?.active) {
        try { obj.destroy(); } catch (e) {}
      }
    });

    this.crewBackButton = null;
    this.crewBackButtonLabel = null;
    this.dynoButton = null;
    this.dynoButtonLabel = null;
    this.meetButton = null;
    this.meetButtonLabel = null;

    this.buildDynoButton();
    this.buildCrewBackButton();
    this.buildMeetButton();
    this.refreshCrewSpaceNavigationState();
  }

  refreshCrewSpaceNavigationState() {
    if (!this.crewMode) return;

    const crewCount = getCrewCount(this.registry);
    const hasCrew = crewCount > 0;
    const hasCrewCar = Boolean(
      this.selectedCarId &&
      cars[this.selectedCarId]?.crewLoan
    );
    const tuningLocked = Boolean(
      this.engineMode || this.secondaryMode || this.chassisMode
    );

    // Persistent navigation should always be visible on Crew Space, even on
    // the empty overview and after a second/third visit.
    [
      this.crewBackButton,
      this.crewBackButtonLabel,
      this.dynoButton,
      this.dynoButtonLabel,
      this.meetButton,
      this.meetButtonLabel,
    ].forEach(obj => {
      if (!obj?.active) return;
      obj.setVisible(true);
      obj.setAlpha(1);
    });

    this.crewBackButton?.setDepth(82);
    this.crewBackButtonLabel?.setDepth(83);
    this.dynoButton?.setDepth(82);
    this.dynoButtonLabel?.setDepth(83);
    this.meetButton?.setDepth(82);
    this.meetButtonLabel?.setDepth(83);

    // Going back to the workshop is always available, including an empty crew.
    this.crewBackButton
      ?.setInteractive({ useHandCursor: true })
      .setFillStyle(0x122331, 1)
      .setStrokeStyle(2, 0x55b8ff, 1);
    this.crewBackButtonLabel
      ?.setText('BACK TO WORKSHOP  >')
      .setColor('#eef8ff');

    if (!hasCrew) {
      // Empty Crew Space: leave the whole workspace readable but inert. The
      // player can always retreat to the workshop and recruit later.
      this.upgradeButtons?.forEach(item => {
        item.box.disableInteractive()
          .setFillStyle(0x0a1017, 1)
          .setStrokeStyle(1, 0x29343d, 1);
        item.label.setColor('#53626c');
        item.arrow.setText('—').setColor('#46545e');
      });

      this.dynoButton?.disableInteractive()
        .setFillStyle(0x17181d, 1)
        .setStrokeStyle(1, 0x514f55, 1);
      this.dynoButtonLabel
        ?.setText('DYNO // NO CREW')
        .setColor('#817d84');

      this.meetButton?.disableInteractive()
        .setFillStyle(0x17181d, 1)
        .setStrokeStyle(1, 0x514f55, 1);
      this.meetButtonLabel
        ?.setText('GO TO MAP // NO CREW')
        .setColor('#817d84');
      return;
    }

    if (!hasCrewCar) {
      this.dynoButton?.disableInteractive()
        .setFillStyle(0x17181d, 1)
        .setStrokeStyle(1, 0x514f55, 1);
      this.dynoButtonLabel
        ?.setText('DYNO // SELECT CREW CAR')
        .setColor('#817d84');

      this.meetButton?.disableInteractive()
        .setFillStyle(0x17181d, 1)
        .setStrokeStyle(1, 0x514f55, 1);
      this.meetButtonLabel
        ?.setText('GO TO MAP // SELECT CAR')
        .setColor('#817d84');
      return;
    }

    // Once a crew car is selected, restore the normal Dyno state (installed,
    // installable, etc.) and enable map travel.
    this.refreshDynoButton?.();
    if (tuningLocked) {
      this.meetButton?.disableInteractive();
    } else {
      this.meetButton?.setInteractive({ useHandCursor: true });
    }
    this.meetButton
      ?.setFillStyle(0x0c2827, 1)
      .setStrokeStyle(2, 0x62e8c7, 1);
    this.meetButtonLabel
      ?.setText('GO TO MAP  >')
      .setColor('#f1fffb');
  }

  buildCrewBackButton() {
    if (!this.crewMode) return;

    const x = SIDE.x + SIDE.w / 2;
    const y = 664;
    this.crewBackButton = this.add.rectangle(x, y, SIDE.w - 32, 40, 0x122331, 1)
      .setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(82);

    this.crewBackButtonLabel = this.add.text(x, y, 'BACK TO WORKSHOP  >', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#eef8ff',
    }).setOrigin(0.5).setDepth(83);

    this.crewBackButton.on('pointerdown', () => {
      if (this.engineMode || this.secondaryMode || this.chassisMode) return;

      const personalCars = (this.registry.get('ownedCarIds') || [])
        .filter(id => cars[id] && !cars[id].crewLoan);
      const previous = this.registry.get('crewPreviousCarId');
      const warehouseCars = getCarsInWorkshop(
        personalCars,
        this.registry.get('carGarageLocations') || {},
        'shinonomeWarehouseStrip'
      );
      const nextCarId = warehouseCars.includes(previous)
        ? previous
        : warehouseCars[0] || personalCars[0] || null;

      this.transitionWarehousePresentation(false, nextCarId);
    });
  }

  createWarehouseSpaceHotspot({
    x,
    y,
    w = 300,
    h = 44,
    label,
    labelAlign = 'left',
    labelText = null,
    onActivate,
    enabled = true,
  }) {
    const labelW = 104;
    const left = x - w / 2;
    const right = x + w / 2;
    const isRight = labelAlign === 'right';

    // Thin outline that wraps the authored room sign instead of becoming a
    // second sign itself. Text sits in a dark gutter away from background type.
    const glow = this.add.rectangle(x, y, w, h, 0x4ee8ff, 0.022)
      .setStrokeStyle(2, 0x69ecff, 0.72)
      .setDepth(28);

    const padX = isRight
      ? right - labelW / 2
      : left + labelW / 2;
    const labelPad = this.add.rectangle(
      padX,
      y,
      labelW,
      h - 8,
      0x06141d,
      0.66
    ).setDepth(29);

    const textX = isRight ? right - 13 : left + 13;
    const text = this.add.text(
      textX,
      y,
      labelText || (label + (isRight ? '' : '  >')),
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: enabled ? '#c9f8ff' : '#72909b',
        align: isRight ? 'right' : 'left',
      }
    ).setOrigin(isRight ? 1 : 0, 0.5).setDepth(30);

    if (enabled) glow.setInteractive({ useHandCursor: true });

    // Strong breathing pulse: almost invisible at the low point.
    const glowTween = this.tweens.add({
      targets: glow,
      alpha: { from: 0.07, to: 1 },
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const padTween = this.tweens.add({
      targets: labelPad,
      alpha: { from: 0.14, to: 0.72 },
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: text,
      alpha: { from: 0.46, to: 0.96 },
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    if (enabled) {
      glow.on('pointerover', () => {
        glowTween.pause();
        padTween.pause();
        glow.setAlpha(1)
          .setFillStyle(0x4ee8ff, 0.08)
          .setStrokeStyle(3, 0x9af6ff, 0.98);
        labelPad.setAlpha(0.82);
        text.setAlpha(1).setColor('#ffffff');
      });

      glow.on('pointerout', () => {
        glow.setFillStyle(0x4ee8ff, 0.022)
          .setStrokeStyle(2, 0x69ecff, 0.72);
        text.setColor('#c9f8ff');
        glowTween.resume();
        padTween.resume();
      });

      glow.on('pointerdown', () => {
        if (this.engineMode || this.secondaryMode || this.chassisMode) return;
        onActivate?.();
      });
    }

    return { glow, labelPad, text };
  }

  activateWarehouseDynoSpace() {
    if (this.engineMode || this.secondaryMode || this.chassisMode) return;
    if (this.getActiveWorkshop()?.id !== DYNO_WAREHOUSE_ID) return;

    const tier = Math.max(0, Number(this.registry.get('dynoFacilityTier') || 0));
    if (tier < 1) {
      this.showDynoInstallPopup();
      return;
    }

    if (!this.selectedCarId) {
      this.showWorkshopToast('MOVE A CAR TO WAREHOUSE HQ FIRST');
      return;
    }

    this.registry.set('selectedCarId', this.selectedCarId);
    this.registry.set('workshopLocationId', DYNO_WAREHOUSE_ID);
    saveSessionState(this.registry);
    this.scene.start('DynoScene');
  }

  buildOfficeHotspot() {
    const activeWorkshop = this.getActiveWorkshop();
    if (!activeWorkshop || activeWorkshop.id === 'shinonomeWarehouseStrip') return;

    let position;
    let labelAlign = 'right';

    if (activeWorkshop.id === 'shinonomeCanalYard') {
      // Move the Canal Yard entry right and slightly upward so it finishes
      // immediately before the top of the staircase.
      position = {
        x: 880,
        y: 142,
        w: 250,
        h: 44,
        labelText: 'OFFICE  >',
      };
    } else {
      // Home Workshop: place the glow over the door rather than the wall.
      // Its right edge is pulled left to meet the top of the doorway and the
      // label reads naturally from the left edge of the button.
      position = {
        x: 760,
        y: 158,
        w: 240,
        h: 44,
        labelText: 'OFFICE  >',
      };
      labelAlign = 'left';
    }

    this.createWarehouseSpaceHotspot({
      ...position,
      label: 'OFFICE',
      labelAlign,
      onActivate: () => showOfficePanel(this),
    });
  }

  buildWarehouseSpaceHotspots() {
    const activeWorkshop = this.getActiveWorkshop();
    if (activeWorkshop?.id !== 'shinonomeWarehouseStrip') return;

    // Calibrated against the Warehouse HQ artwork:
    // - all three are thinner;
    // - Office moves up/left so its label clears the painted sign;
    // - Crew moves upward above the car roof;
    // - Dyno keeps the same right edge, shortens from the left to start just
    //   before the authored DYNO sign, with its call-to-action on the right.
    this.createWarehouseSpaceHotspot({
      x: 700,
      y: 142,
      w: 300,
      h: 44,
      label: 'OFFICE',
      onActivate: () => showOfficePanel(this),
    });

    if (isCrewUnlocked(this.registry)) {
      this.createWarehouseSpaceHotspot({
        x: 650,
        y: 234,
        w: 300,
        h: 44,
        label: 'CREW',
        onActivate: () => {
          const previous = this.selectedCarId && !cars[this.selectedCarId]?.crewLoan
            ? this.selectedCarId
            : (this.ownedCarIds || []).find(id => !cars[id]?.crewLoan) || null;

          this.registry.set('crewPreviousCarId', previous);
          this.transitionWarehousePresentation(true, null);
        },
      });
    }

    this.createWarehouseSpaceHotspot({
      x: 1025,
      y: 291,
      w: 230,
      h: 44,
      label: 'DYNO',
      labelAlign: 'right',
      labelText: '<  DYNO',
      onActivate: () => this.activateWarehouseDynoSpace(),
    });
  }

  buildDynoButton() {
    const activeWorkshop = this.getActiveWorkshop();

    if (activeWorkshop.id !== DYNO_WAREHOUSE_ID) {
      if (Number(activeWorkshop.tier || 0) > 1) return;

      const x = SIDE.x + SIDE.w / 2;
      const y = 608;
      const rentalCost = DYNO_RENTAL_SESSION_COST;

      this.dynoButton = this.add.rectangle(
        x,
        y,
        SIDE.w - 32,
        40,
        0x102138,
        1
      ).setStrokeStyle(2, 0x55b8ff, 1)
        .setDepth(40);

      this.dynoButtonLabel = this.add.text(x, y, '', {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#eef8ff',
        align: 'center',
      }).setOrigin(0.5).setDepth(41);

      this.refreshDynoButton = () => {
        if (!this.dynoButton?.active || !this.dynoButtonLabel?.active) return;
        const cash = Math.max(0, Number(this.registry.get('cash') || 0));
        const hasLocalCar = Boolean(this.selectedCarId);
        const affordable = cash >= rentalCost;
        const lockedByTuning = Boolean(this.engineMode || this.secondaryMode || this.chassisMode);

        if (!hasLocalCar) {
          this.dynoButtonLabel.setText('RENT DYNO // SELECT CAR').setColor('#817d84');
          this.dynoButton
            .setFillStyle(0x17181d, 1)
            .setStrokeStyle(2, 0x514f55, 1);
        } else {
          this.dynoButtonLabel
            .setText(
              affordable
                ? 'RENT STAGE I DYNO // ¥100,000'
                : 'RENT DYNO // NEED ¥100,000'
            )
            .setColor(affordable ? '#f1fffb' : '#c99aa4');
          this.dynoButton
            .setFillStyle(affordable ? 0x0c2827 : 0x1b1418, 1)
            .setStrokeStyle(2, affordable ? 0x62e8c7 : 0x79515a, 1);
        }

        if (lockedByTuning) this.dynoButton.disableInteractive();
        else this.dynoButton.setInteractive({ useHandCursor: true });
      };

      this.dynoButton.on('pointerdown', () => {
        if (this.engineMode || this.secondaryMode || this.chassisMode) return;
        if (!this.selectedCarId) {
          this.showWorkshopToast('SELECT A CAR BEFORE BOOKING THE DYNO');
          return;
        }
        this.showDynoRentalPopup(activeWorkshop);
      });

      this.refreshDynoButton();
      return;
    }

    const stageOne = getDynoStage(1);
    const x = SIDE.x + SIDE.w / 2;
    // Keep the Dyno action above MOVE CAR. These buttons previously shared
    // the same Y position and were therefore directly overlapping.
    const y = 608;

    this.dynoButton = this.add.rectangle(
      x,
      y,
      SIDE.w - 32,
      40,
      0x102138,
      1
    ).setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(40);

    this.dynoButtonLabel = this.add.text(x, y, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#eef8ff',
    }).setOrigin(0.5).setDepth(41);

    this.refreshDynoButton = () => {
      if (!this.dynoButton?.active || !this.dynoButtonLabel?.active) return;
      const tier = Math.max(0, Number(this.registry.get('dynoFacilityTier') || 0));
      const cash = Math.max(0, Number(this.registry.get('cash') || 0));
      const lockedByTuning = Boolean(this.engineMode || this.secondaryMode || this.chassisMode);
      const hasLocalCar = Boolean(this.selectedCarId);

      if (tier < 1) {
        const affordable = cash >= Number(stageOne.installCost || 0);
        this.dynoButtonLabel
          .setText(
            affordable
              ? 'INSTALL DYNO // ¥ ' + Number(stageOne.installCost || 0).toLocaleString('en-US')
              : 'DYNO // NEED ¥ ' + Number(stageOne.installCost || 0).toLocaleString('en-US')
          )
          .setColor(affordable ? '#ffe7a5' : '#c99aa4');
        this.dynoButton
          .setFillStyle(affordable ? 0x211a12 : 0x1b1418, 1)
          .setStrokeStyle(2, affordable ? 0xe4b660 : 0x79515a, 1);
      } else {
        this.dynoButtonLabel
          .setText(hasLocalCar ? 'DYNO // STAGE I  >' : 'DYNO // MOVE CAR HERE')
          .setColor(hasLocalCar ? '#f1fffb' : '#817d84');
        this.dynoButton
          .setFillStyle(hasLocalCar ? 0x0c2827 : 0x17181d, 1)
          .setStrokeStyle(2, hasLocalCar ? 0x62e8c7 : 0x514f55, 1);
      }

      if (lockedByTuning) this.dynoButton.disableInteractive();
      else this.dynoButton.setInteractive({ useHandCursor: true });
    };

    this.dynoButton.on('pointerdown', () => {
      this.activateWarehouseDynoSpace();
    });

    this.refreshDynoButton();
  }

  showDynoRentalPopup(workshop = this.getActiveWorkshop()) {
    if (!workshop || Number(workshop.tier || 0) > 1) return;
    if (!this.selectedCarId) return;

    const cost = DYNO_RENTAL_SESSION_COST;
    const cash = Math.max(0, Number(this.registry.get('cash') || 0));
    const affordable = cash >= cost;
    const depth = 160;
    const objects = [];
    const add = obj => {
      objects.push(obj);
      return obj;
    };
    const close = () => objects.forEach(obj => obj?.destroy?.());

    const blocker = add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.78)
      .setDepth(depth)
      .setInteractive());

    add(this.add.rectangle(780, 420, 790, 440, 0x08131f, 0.995)
      .setStrokeStyle(2, 0x62e8c7, 1)
      .setDepth(depth + 1));

    add(this.add.text(430, 245, 'BOOK STAGE I DYNO SESSION', {
      fontFamily: PIXEL_FONT,
      fontSize: '13px',
      color: '#eefaff',
    }).setDepth(depth + 2));

    add(this.add.text(
      430,
      300,
      'Rent time on a basic AWD roller dyno. Your booking includes one paid power run, an official power / torque reading, and a saved graph for this car.',
      {
        fontFamily: BODY_FONT,
        fontSize: '11px',
        color: '#b8cbd7',
        fontStyle: '600',
        wordWrap: { width: 700 },
        lineSpacing: 4,
      }
    ).setDepth(depth + 2));

    add(this.add.text(
      430,
      405,
      'RENTAL SESSION  //  ¥ ' + cost.toLocaleString('en-US') +
        '\n1 POWER RUN  //  STAGE I ONLY',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: affordable ? '#ffe08a' : '#c99aa4',
        lineSpacing: 8,
      }
    ).setDepth(depth + 2));

    add(this.add.text(
      430,
      470,
      'NO DRIVETRAIN TEST  //  NO STAGE III TUNING',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#829aa8',
      }
    ).setDepth(depth + 2));

    const cancel = add(this.add.rectangle(650, 555, 220, 54, 0x151d28, 1)
      .setStrokeStyle(1, 0x657d8c, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    add(this.add.text(650, 555, 'CANCEL', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#c4d5df',
    }).setOrigin(0.5).setDepth(depth + 3));

    const confirm = add(this.add.rectangle(
      940,
      555,
      300,
      54,
      affordable ? 0x0c2827 : 0x2a171b,
      1
    ).setStrokeStyle(2, affordable ? 0x62e8c7 : 0xff6f7d, 1)
      .setDepth(depth + 2));

    const confirmText = add(this.add.text(
      940,
      555,
      affordable
        ? 'BOOK // ¥ ' + cost.toLocaleString('en-US')
        : 'NOT ENOUGH CASH',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: affordable ? '#f1fffb' : '#ffc0c6',
      }
    ).setOrigin(0.5).setDepth(depth + 3));

    cancel.on('pointerdown', close);
    blocker.on('pointerdown', close);

    if (affordable) {
      confirm.setInteractive({ useHandCursor: true });
      confirm.on('pointerdown', () => {
        const liveCash = Math.max(0, Number(this.registry.get('cash') || 0));
        if (liveCash < cost) {
          confirm.disableInteractive();
          confirmText.setText('NOT ENOUGH CASH').setColor('#ffc0c6');
          return;
        }

        const carId = this.selectedCarId;
        const returnWorkshopId = workshop.id;
        this.registry.set('cash', liveCash - cost);
        this.registry.set('selectedCarId', carId);
        this.registry.set('workshopLocationId', returnWorkshopId);
        this.cashText?.setText('¥ ' + Number(liveCash - cost).toLocaleString('en-US'));
        saveSessionState(this.registry);
        close();

        this.scene.start('DynoScene', {
          rentalSession: true,
          carId,
          returnWorkshopId,
        });
      });
    }
  }

  showDynoInstallPopup() {
    if (this.getActiveWorkshop().id !== DYNO_WAREHOUSE_ID) return;
    const stage = getDynoStage(1);
    const cost = Math.max(0, Number(stage.installCost || 0));
    const cash = Math.max(0, Number(this.registry.get('cash') || 0));
    const affordable = cash >= cost;
    const depth = 160;
    const objects = [];
    const add = obj => {
      objects.push(obj);
      return obj;
    };
    const close = () => objects.forEach(obj => obj?.destroy?.());

    add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.76)
      .setDepth(depth)
      .setInteractive());

    add(this.add.rectangle(780, 420, 760, 430, 0x08131f, 0.995)
      .setStrokeStyle(2, 0x43dfff, 1)
      .setDepth(depth + 1));

    add(this.add.text(440, 250, 'INSTALL AWD ROLLER DYNO', {
      fontFamily: PIXEL_FONT,
      fontSize: '14px',
      color: '#eefaff',
    }).setDepth(depth + 2));

    add(this.add.text(
      440,
      302,
      'Build the Warehouse HQ dyno cell. Stage I maps real power and torque curves, live boost and RPM, and gives you three pulls per session.',
      {
        fontFamily: BODY_FONT,
        fontSize: '12px',
        color: '#b8cbd7',
        fontStyle: '600',
        wordWrap: { width: 670 },
        lineSpacing: 4,
      }
    ).setDepth(depth + 2));

    add(this.add.text(
      440,
      400,
      'INSTALLATION  ¥ ' + cost.toLocaleString('en-US') +
        '\nSESSION  ¥ ' + Number(stage.sessionCost || 0).toLocaleString('en-US') + '  //  3 PULLS',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: affordable ? '#ffe08a' : '#c99aa4',
        lineSpacing: 8,
      }
    ).setDepth(depth + 2));

    const cancel = add(this.add.rectangle(650, 540, 220, 54, 0x151d28, 1)
      .setStrokeStyle(1, 0x657d8c, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    add(this.add.text(650, 540, 'CANCEL', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#c4d5df',
    }).setOrigin(0.5).setDepth(depth + 3));

    const confirm = add(this.add.rectangle(
      920,
      540,
      280,
      54,
      affordable ? 0x0c2827 : 0x2a171b,
      1
    ).setStrokeStyle(2, affordable ? 0x62e8c7 : 0xff6f7d, 1)
      .setDepth(depth + 2));
    const confirmText = add(this.add.text(
      920,
      540,
      affordable ? 'INSTALL // ¥ ' + cost.toLocaleString('en-US') : 'NOT ENOUGH CASH',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: affordable ? '#f1fffb' : '#ffc0c6',
      }
    ).setOrigin(0.5).setDepth(depth + 3));

    cancel.on('pointerdown', close);

    if (affordable) {
      confirm.setInteractive({ useHandCursor: true });
      confirm.on('pointerdown', () => {
        const liveCash = Math.max(0, Number(this.registry.get('cash') || 0));
        if (liveCash < cost) {
          confirm.disableInteractive();
          confirmText.setText('NOT ENOUGH CASH').setColor('#ffc0c6');
          return;
        }
        this.registry.set('cash', liveCash - cost);
        this.registry.set('dynoFacilityTier', 1);
        this.cashText?.setText('¥ ' + Number(liveCash - cost).toLocaleString('en-US'));
        saveSessionState(this.registry);
        close();
        this.refreshDynoButton?.();
        this.showWorkshopToast('AWD ROLLER DYNO INSTALLED // STAGE I READY');
      });
    }
  }

  buildMeetButton() {
    const button = this.meetButton = this.add.rectangle(SIDE.x + SIDE.w / 2, 770, SIDE.w - 32, 42, 0x0c2827, 1)
      .setStrokeStyle(2, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(40);

    this.meetButtonLabel = this.add.text(SIDE.x + SIDE.w / 2, 770, 'GO TO MAP  >', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#f1fffb'
    }).setOrigin(0.5).setDepth(41);

    button.on('pointerdown', () => {
      this.registry.set('selectedCarId', this.selectedCarId);
      this.syncSelectedRaceDriver();

      // Old Arkon Den profiles pre-date the persisted devMode flag. Promote the
      // live registry before the workshop map evaluates unlocks so dev access
      // is identical whether the map is opened from Garage or Meet.
      if (isArkonDen(this.registry)) {
        this.registry.set('devMode', true);
      }

      this.saveProfile();

      showTravelMap(this, {
        currentLocationId: this.registry.get('meetLocation') || 'odaiba7eleven',
        title: 'TOKYO REGION MAP',
        actionVerb: 'DRIVE',
        fromWorkshop: true,
        allowCurrentAction: true,
        onWorkshopUpgrade: (location, cost, alreadyUnlocked) => {
          const cash = Number(this.registry.get('cash') || 0);
          if (!alreadyUnlocked && cash < cost) return;

          const nextCash = alreadyUnlocked ? cash : cash - cost;
          const targetTier = Number(location.garageTier || 0);

          if (!alreadyUnlocked) {
            this.registry.set('garageTier', Math.max(
              Number(this.registry.get('garageTier') || 0),
              targetTier
            ));
            this.registry.set('cash', nextCash);

            const storyId = targetTier >= 2
              ? 'warehouseHqUnlocked'
              : targetTier >= 1
                ? 'canalYardUnlocked'
                : null;
            if (storyId) {
              try { sessionStorage.setItem('tokyoShiftPendingCutscene', storyId); } catch (e) {}
            }
          }

          this.registry.set('workshopLocationId', location.id);

          const requestedLocations = {
            ...(this.registry.get('carGarageLocations') || {}),
          };

          // Purchasing a new workshop physically moves the player and their
          // current car into the new property. Switching between workshops that
          // are already owned does not silently relocate stored cars.
          if (
            !alreadyUnlocked &&
            this.selectedCarId &&
            this.ownedCarIds.includes(this.selectedCarId)
          ) {
            requestedLocations[this.selectedCarId] = location.id;
          }

          const reassigned = normaliseCarGarageLocations(
            this.ownedCarIds,
            requestedLocations,
            Number(this.registry.get('garageTier') || 0)
          );
          this.registry.set('carGarageLocations', reassigned);
          saveSessionState(this.registry);
          this.cashText?.setText('¥ ' + Number(nextCash).toLocaleString('en-US'));

          // Workshop changes are rare, high-level actions. On iOS/PWA the
          // Phaser scene/input lifecycle has repeatedly stalled while switching
          // from the GPS overlay. Persist the live session and perform a clean
          // browser reload instead of another Phaser scene transition.
          try {
            sessionStorage.setItem('tokyoShiftInternalReload', '1');
            sessionStorage.removeItem('tokyoShiftBootMessage');
          } catch (e) {}
          window.location.reload();
        },
        onTravel: (locationId, cost) => {
          const travelTarget = getTravelLocation(locationId);

          // Central Tokyo contains a dealership and showroom, so the player can
          // visit it even when the current physical workshop has no car stored.
          // Normal street meets still require a local car to drive out with.
          if (!this.selectedCarId && travelTarget?.regionId !== 'CENTRAL_TOKYO') {
            this.showWorkshopToast('MOVE TO A GARAGE WITH A CAR FIRST');
            return;
          }

          const cash = Number(this.registry.get('cash') || 0);
          if (cash < cost) return;
          this.registry.set('cash', cash - cost);
          this.registry.set('selectedCarId', this.selectedCarId);
          this.registry.set('meetStranded', false);

          if (travelTarget?.regionId === 'CENTRAL_TOKYO') {
            this.registry.set('centralTokyoLocation', locationId);
            this.registry.set('district', 'CENTRAL_TOKYO');
            saveSessionState(this.registry);
            this.cashText?.setText('¥ ' + Number(cash - cost).toLocaleString('en-US'));
            this.scene.start('CentralTokyoScene', { locationId });
            return;
          }

          const destination = getMeetLocation(locationId);
          this.registry.set('meetLocation', locationId);
          this.registry.set('district', destination.district);
          saveSessionState(this.registry);

          this.cashText?.setText('¥ ' + Number(cash - cost).toLocaleString('en-US'));
          this.scene.start('MeetScene');
        },
      });
    });
  }

  getWorkshopWheelContactOffset(wheelSource, axleFit) {
    const authoredRadius = Number(axleFit?.backingRadius || 0);
    if (authoredRadius > 0) return authoredRadius;
    return getWheelContactOffsetY(wheelSource, axleFit?.wheelScale);
  }

  getWheelBottomY(car, bodyY, targetWidth, visualModsOverride = null) {
    const bodySource = this.textures.get(getCarBodyTextureKey(this, car)).getSourceImage();
    const carState = (this.registry.get('carStates') || {})[car.id] || {};
    const wheelVisual = getVisualModWheelVisual(car, visualModsOverride || carState);
    const wheelSource = this.textures.get(wheelVisual.wheelKey).getSourceImage();
    const bodyScale = getCarBodyScaleForWidth(this, car, targetWidth);
    const fit = getWheelPairFit(wheelVisual, bodyScale, false, wheelSource);

    const renderOffsetY = Number(car.visual.renderOffsetY || 0) * bodyScale;
    const rearBottom =
      bodyY + renderOffsetY + fit.rear.offsetY +
      this.getWorkshopWheelContactOffset(wheelSource, fit.rear);
    const frontBottom =
      bodyY + renderOffsetY + fit.front.offsetY +
      this.getWorkshopWheelContactOffset(wheelSource, fit.front);
    return Math.max(rearBottom, frontBottom);
  }

  getBodyYForWheelBottom(car, targetWidth, wheelBottomY, visualModsOverride = null) {
    const bodySource = this.textures.get(getCarBodyTextureKey(this, car)).getSourceImage();
    const carState = (this.registry.get('carStates') || {})[car.id] || {};
    const wheelVisual = getVisualModWheelVisual(car, visualModsOverride || carState);
    const wheelSource = this.textures.get(wheelVisual.wheelKey).getSourceImage();
    const bodyScale = getCarBodyScaleForWidth(this, car, targetWidth);
    const fit = getWheelPairFit(wheelVisual, bodyScale, false, wheelSource);

    const renderOffsetY = Number(car.visual.renderOffsetY || 0) * bodyScale;
    const rearBottomOffset =
      fit.rear.offsetY + this.getWorkshopWheelContactOffset(wheelSource, fit.rear);
    const frontBottomOffset =
      fit.front.offsetY + this.getWorkshopWheelContactOffset(wheelSource, fit.front);

    // Account for per-asset body trim when solving the body origin. Without
    // this, hero cars with larger renderOffsetY values sat visibly lower even
    // though the garage was trying to share one tyre-contact baseline.
    return wheelBottomY - renderOffsetY - Math.max(rearBottomOffset, frontBottomOffset);
  }

  createCarDisplay(car, x, y, targetWidth, depth, visualModsOverride = null) {
    const source = this.textures.get(getCarBodyTextureKey(this, car)).getSourceImage();
    const carStates = this.registry.get('carStates') || {};
    const carState = carStates[car.id] || {};
    const wheelVisual = getVisualModWheelVisual(car, visualModsOverride || carState);
    const wheelSource = this.textures.get(wheelVisual.wheelKey).getSourceImage();
    const bodyScale = getCarBodyScaleForWidth(this, car, targetWidth);
    const fit = getWheelPairFit(wheelVisual, bodyScale, false, wheelSource);
    const renderOffsetY = Number(car.visual.renderOffsetY || 0) * bodyScale;
    const displayY = y + renderOffsetY;

    const rearX = x + fit.rear.offsetX;
    const frontX = x + fit.front.offsetX;
    const rearY = displayY + fit.rear.offsetY;
    const frontY = displayY + fit.front.offsetY;

    const rearWheel = this.add.image(rearX, rearY, wheelVisual.wheelKey)
      .setScale(fit.rear.wheelScale)
      .setDepth(depth);

    const frontWheel = this.add.image(frontX, frontY, wheelVisual.wheelKey)
      .setScale(fit.front.wheelScale)
      .setDepth(depth);

    const rearWheelBacking = this.add.circle(
      rearX,
      rearY,
      fit.rear.backingRadius ?? Math.max(5, rearWheel.displayWidth * 0.50),
      0x020304,
      1
    ).setDepth(depth - 0.35);

    const frontWheelBacking = this.add.circle(
      frontX,
      frontY,
      fit.front.backingRadius ?? Math.max(5, frontWheel.displayWidth * 0.50),
      0x020304,
      1
    ).setDepth(depth - 0.35);

    const tyreBottom = Math.max(
      rearY + this.getWorkshopWheelContactOffset(wheelSource, fit.rear),
      frontY + this.getWorkshopWheelContactOffset(wheelSource, fit.front)
    );
    const shadowHeight = Math.max(
      20,
      Math.max(rearWheel.displayHeight, frontWheel.displayHeight) * 0.34
    );
    const roadShadow = this.add.ellipse(
      x,
      tyreBottom - shadowHeight / 8,
      Math.max(128, targetWidth * 0.96),
      shadowHeight,
      0x000000,
      0.82
    ).setDepth(depth - 0.12);

    const paintColor = getCarPaintColor(carState);
    const bodyLayers = createCarBodyLayers(this, car, {
      x,
      y: displayY,
      scale: bodyScale,
      depth: depth + 1,
      paintColor,
    });

    const visualModObjects = createVisualModLayers(this, car, carState, {
      x,
      y: displayY,
      scale: bodyScale,
      depth: depth + 1.005,
      paintColor,
      visualMods: visualModsOverride,
      bodyLayers,
    });

    const decalObjects = createTunerDecalLayers(this, carState, {
      x,
      y: displayY,
      displayWidth: bodyLayers.primary.displayWidth,
      displayHeight: bodyLayers.primary.displayHeight,
      depth: depth + 1.04,
    });

    return [
      rearWheelBacking,
      frontWheelBacking,
      roadShadow,
      rearWheel,
      frontWheel,
      ...bodyLayers.objects,
      ...visualModObjects,
      ...decalObjects,
    ];
  }

  buildWorkshopHeroLayout(car, visualModsOverride = null) {
    if (!car) return null;

    const tyreContactY = Number(HERO_CFG.tyreContactY || 500);
    const bodyY = this.getBodyYForWheelBottom(
      car,
      HERO_CFG.targetWidth,
      tyreContactY,
      visualModsOverride
    );
    const carState = (this.registry.get('carStates') || {})[car.id] || {};
    const wheelVisual = getVisualModWheelVisual(
      car,
      visualModsOverride || carState
    );
    const wheelSource = this.textures.get(wheelVisual.wheelKey).getSourceImage();
    const bodyScale = getCarBodyScaleForWidth(
      this,
      car,
      HERO_CFG.targetWidth
    );
    const wheelFit = getWheelPairFit(
      wheelVisual,
      bodyScale,
      false,
      wheelSource
    );
    const renderOffsetY = Number(car.visual.renderOffsetY || 0) * bodyScale;

    return {
      x: HERO_CFG.x,
      bodyY,
      targetWidth: HERO_CFG.targetWidth,
      bodyScale,
      tyreContactY,
      frontWheelX: HERO_CFG.x + wheelFit.front.offsetX,
      rearWheelX: HERO_CFG.x + wheelFit.rear.offsetX,
      rearWheelY: bodyY + renderOffsetY + wheelFit.rear.offsetY,
      frontWheelY: bodyY + renderOffsetY + wheelFit.front.offsetY,
      wheelY: bodyY + renderOffsetY + (
        wheelFit.rear.offsetY +
        wheelFit.front.offsetY
      ) / 2,
      left: HERO_CFG.x - HERO_CFG.targetWidth / 2,
      right: HERO_CFG.x + HERO_CFG.targetWidth / 2,
    };
  }

  selectCar(id) {
    if (!cars[id] || !this.ownedCarIds.includes(id)) return;
    if (
      !this.crewMode &&
      this.carGarageLocations?.[id] !== this.getActiveWorkshop().id
    ) return;
    if (
      this.crewMode &&
      !this.getCurrentWorkshopCars().includes(id)
    ) return;

    if (this.engineMode || this.secondaryMode || this.chassisMode) {
      if (id !== this.selectedCarId) this.showWorkshopToast('EXIT TUNING BEFORE CHANGING CARS');
      return;
    }

    this.selectedCarId = id;
    this.registry.set('selectedCarId', id);
    const crewMember = this.syncSelectedRaceDriver();

    for (const obj of this.selectedDisplay || []) {
      try { obj?.destroy?.(); } catch (e) {}
    }

    if (this.crewMode && crewMember) {
      this.focusCrewMember(crewMember);
    }

    this.heroCarLayout = this.buildWorkshopHeroLayout(cars[id]);
    if (!this.heroCarLayout) return;
    this.selectedDisplay = this.createCarDisplay(
      cars[id],
      this.heroCarLayout.x,
      this.heroCarLayout.bodyY,
      this.heroCarLayout.targetWidth,
      10
    );

    if (this.crewMode) {
      const travel = 690;
      // Crew cars enter an indoor meeting/workshop bay rather than blasting
      // onto a race stage. Keep the roll-in deliberately calm and physical.
      const duration = 5200;
      this.selectedDisplay.forEach(obj => {
        if (obj?.x != null) obj.x += travel;
      });
      this.tweens.add({
        targets: this.selectedDisplay,
        x: '-=' + travel,
        duration,
        ease: 'Sine.easeInOut',
      });

      const wheels = [this.selectedDisplay[3], this.selectedDisplay[4]].filter(Boolean);
      this.tweens.add({
        targets: wheels,
        angle: '-=420',
        duration,
        ease: 'Sine.easeOut',
      });
    }

    const car = cars[id];
    const carStates = this.registry.get('carStates') || {};
    const carState = carStates[id] || {};
    const tunedBuild = buildDynoCar(id, carState) || (() => {
      const engineBuild = applyEngineTuning(car, engines[car.engine], carState);
      return applySecondaryTuning(engineBuild.car, engineBuild.engine, carState);
    })();

    this.headerCarText.setText(
      this.crewMode && crewMember
        ? String(characters[crewMember.characterId]?.name || crewMember.characterId).toUpperCase() +
          ' // ' + car.shortName.toUpperCase()
        : car.name.toUpperCase()
    );

    const tunedPower = Number(tunedBuild.car.powerKW ?? 0);
    const tunedTorque = Number(tunedBuild.car.torqueNm ?? 0);
    const ratingDisplay = getPowerTorqueDisplay(car, carState, tunedBuild.car);
    const powerGain = Math.round(tunedPower - Number(car.powerKW || 0));
    const torqueGain = Math.round(tunedTorque - Number(car.torqueNm || 0));

    const engineLabel = this.isSelectedCarTuningLocked()
      ? String(car.engineModel || '—').split('//')[0].trim()
      : (car.engineModel || '—');
    this.specValueTexts.engine.setText(engineLabel);
    this.specValueTexts.power.setText(
      ratingDisplay.powerLabel +
      (!ratingDisplay.estimated && powerGain > 0 ? '  (+' + powerGain + ')' : '')
    );
    this.specValueTexts.torque.setText(
      ratingDisplay.torqueLabel +
      (!ratingDisplay.estimated && torqueGain > 0 ? '  (+' + torqueGain + ')' : '')
    );
    this.specValueTexts.weight.setText(Math.round(tunedBuild.car.vehicleMassKg) + ' kg');

    this.refreshTuningCategoryAvailability();

    for (const item of this.thumbButtons) {
      const active = item.id === id;
      item.box.setFillStyle(active ? 0x10263a : 0x0b1724, 1);
      item.box.setStrokeStyle(active ? 3 : 2, active ? 0x41dcff : 0x29465c, 1);
      item.label.setColor(active ? '#ffffff' : '#b8cad7');
    }

    if (this.meetButton) {
      this.meetButton.setInteractive({ useHandCursor: true })
        .setFillStyle(0x0c2827, 1)
        .setStrokeStyle(2, 0x62e8c7, 1);
      this.meetButtonLabel?.setText('GO TO MAP  >').setColor('#f1fffb');
    }

    this.updateMoveCarButtonState();
    this.refreshDynoButton?.();

    if (this.crewMode) {
      const crewCars = this.getCurrentWorkshopCars();
      const selectedIndex = Math.max(0, crewCars.indexOf(id));
      this.garagePage = Math.floor(selectedIndex / (this.garagePageSize || 4));
      this.renderGaragePage();
      this.refreshCrewSpaceNavigationState();
    }

    this.saveProfile();
  }

  showEmptyGarageState() {
    this.headerCarText.setText('NO CAR');
    this.specValueTexts.engine.setText('—');
    this.specValueTexts.power.setText('—');
    this.specValueTexts.torque.setText('—');
    this.specValueTexts.weight.setText('—');
    this.tuningStatusText
      ?.setText('TUNING // ' + this.getActiveWorkshop().shortLabel)
      .setColor('#8cc8ec');

    this.upgradeButtons.forEach(item => {
      item.box.disableInteractive()
        .setFillStyle(0x0a1017, 1)
        .setStrokeStyle(1, 0x29343d, 1);
      item.label.setColor('#53626c');
      item.arrow.setColor('#46545e');
    });

    const ownsCarsElsewhere = this.ownedCarIds.length > 0;

    // A driver cannot leave an empty workshop without a car. OTHER WORKSHOP
    // remains available so cars stored elsewhere can still be retrieved.
    this.meetButton?.disableInteractive()
      .setFillStyle(0x17181d, 1)
      .setStrokeStyle(1, 0x514f55, 1);
    this.meetButtonLabel
      ?.setText(ownsCarsElsewhere ? 'NO CAR // USE OTHER WORKSHOP' : 'NO CAR')
      .setColor('#817d84');
    this.updateMoveCarButtonState();

    this.add.rectangle(710, 360, 720, 148, 0x050b12, 0.78)
      .setStrokeStyle(1, 0x315470, 0.64)
      .setDepth(19);

    this.add.text(710, 326, ownsCarsElsewhere ? 'NO CARS STORED HERE' : 'GARAGE EMPTY', {
      fontFamily: PIXEL_FONT,
      fontSize: '18px',
      color: '#edf8ff',
    }).setOrigin(0.5).setDepth(20);

    this.add.text(
      710,
      382,
      ownsCarsElsewhere
        ? 'Your cars are stored at another Shinonome workshop. Use OTHER WORKSHOP to switch garages and collect one.'
        : 'You lost your last car. Restart from SETTINGS when you are ready for another run.',
      {
        fontFamily: BODY_FONT,
        fontSize: '13px',
        color: '#b8cbd7',
        align: 'center',
        wordWrap: { width: 640 },
      }
    ).setOrigin(0.5).setDepth(20);
  }

  recoverTuningTransition(error = null) {
    if (error) console.error('[Tokyo SHIFT] tuning transition failed', error);

    const lists = [
      'engineModeObjects',
      'engineModalObjects',
      'engineHotspotObjects',
      'engineHelperObjects',
      'secondaryModeObjects',
      'secondaryModalObjects',
      'secondaryHotspotObjects',
      'secondaryHelperObjects',
      'chassisModeObjects',
    ];

    lists.forEach(key => {
      (this[key] || []).forEach(obj => {
        try { obj?.destroy?.(); } catch (e) {}
      });
      this[key] = [];
    });

    this.engineMode = false;
    this.secondaryMode = null;
    this.chassisMode = false;
    this.engineTransitioning = false;

    try { this.updateGarageNavState(); } catch (e) {}
    this.upgradeButtons?.forEach(item => {
      try { item.box.setInteractive({ useHandCursor: true }); } catch (e) {}
    });
    this.thumbButtons?.forEach(item => {
      try { item.box.setInteractive({ useHandCursor: true }); } catch (e) {}
    });
    try { this.saveButton?.setInteractive({ useHandCursor: true }); } catch (e) {}
    try { this.meetButton?.setInteractive({ useHandCursor: true }); } catch (e) {}
    try { this.selectUpgrade(null); } catch (e) {}

    try {
      this.showWorkshopToast('TUNING SCREEN RECOVERED // TRY AGAIN');
    } catch (e) {}
  }

  ensureGarageTuningAssets(
    onReady,
    { includeVisualMods = false, silent = false } = {}
  ) {
    this._garageTuningAssetCallbacks = this._garageTuningAssetCallbacks || [];
    if (typeof onReady === 'function') {
      this._garageTuningAssetCallbacks.push(onReady);
    }

    if (this._garageTuningAssetLoading) return;

    let queued = 0;
    const queueImage = (key, path) => {
      if (!key || !path || this.textures.exists(key)) return;
      this.load.image(key, path);
      queued += 1;
    };

    garageAssets
      .filter(asset =>
        asset.key.startsWith('stockEngine') ||
        asset.key.startsWith('tuningCategory') ||
        asset.key.startsWith('tuningPart')
      )
      .forEach(asset => queueImage(asset.key, asset.path));

    [
      ['daichiEngineInspect', 'assets/Characters/daichi_engine_inspect.png?v=20260922-r110'],
      ['daichiChassisTools', 'assets/Characters/daichi_chassis_tools.png?v=20260922-r110'],
      ['daichiExhaustCrouch', 'assets/Characters/daichi_exhaust_crouch.png?v=20260922-r110'],
    ].forEach(([key, path]) => queueImage(key, path));

    if (includeVisualMods && this.selectedCarId) {
      queued += preloadVisualModAssets(
        this,
        '20260928-r242',
        [this.selectedCarId]
      );
    }

    const flushCallbacks = () => {
      const callbacks = [...(this._garageTuningAssetCallbacks || [])];
      this._garageTuningAssetCallbacks = [];
      callbacks.forEach(callback => {
        try { callback?.(); } catch (error) {
          this.recoverTuningTransition(error);
        }
      });
    };

    if (queued <= 0) {
      flushCallbacks();
      return;
    }

    this._garageTuningAssetLoading = true;
    if (!silent) {
      startSceneLoading(this, 'LOADING TUNING BAY', queued);
    }

    this.load.once('complete', () => {
      this._garageTuningAssetLoading = false;
      flushCallbacks();
      if (!silent) finishSceneLoading('TUNING READY');
    });

    if (!this.load.isLoading()) this.load.start();
  }

  runTuningTransition(activate) {
    if (this.engineTransitioning) return;
    this.engineTransitioning = true;

    const veil = this.add.rectangle(780, 420, 1560, 840, 0x02050b, 1)
      .setDepth(165)
      .setAlpha(0)
      .setInteractive();

    let finished = false;
    const clearVeil = () => {
      if (finished) return;
      finished = true;

      const finish = () => {
        try { veil.destroy(); } catch (e) {}
        this.engineTransitioning = false;
      };

      if (!veil?.active) {
        finish();
        return;
      }

      this.tweens.add({
        targets: veil,
        alpha: 0,
        duration: 180,
        ease: 'Sine.easeOut',
        onComplete: finish,
      });
    };

    // Never go fully black. More importantly, always clear the veil even when
    // a tuning component throws during activation.
    this.tweens.add({
      targets: veil,
      alpha: 0.72,
      duration: 120,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        try {
          activate();
        } catch (error) {
          this.recoverTuningTransition(error);
        } finally {
          clearVeil();
        }
      },
    });

    // Last-resort guard for interrupted tweens / iOS lifecycle edge cases.
    this.time.delayedCall(900, clearVeil);
  }

  enterEngineMode() {
    if (this.engineMode || this.secondaryMode || this.chassisMode || this.engineTransitioning || !this.selectedCarId) return;
    if (this.isSelectedCarTuningLocked()) {
      this.showWorkshopToast('COLLECTOR CAR // ENGINE TUNING LOCKED');
      return;
    }
    this.ensureGarageTuningAssets(
      () => this.runTuningTransition(() => this.activateEngineMode())
    );
  }

  activateEngineMode() {
    if (this.engineMode || this.secondaryMode || this.chassisMode || !this.selectedCarId) return;
    this.engineMode = true;
    this.updateGarageNavState();

    this.upgradeButtons.forEach(item => item.box.disableInteractive());
    this.thumbButtons.forEach(item => {
      const active = item.id === this.selectedCarId;
      item.box.disableInteractive()
        .setFillStyle(active ? 0x10263a : 0x080d12, 1)
        .setStrokeStyle(active ? 3 : 1, active ? 0x41dcff : 0x29343d, active ? 1 : 0.65);
      item.label.setColor(active ? '#ffffff' : '#56636b');
      item.display?.forEach(obj => obj?.setAlpha?.(active ? 1 : 0.22));
    });
    this.saveButton?.disableInteractive();
    this.meetButton?.disableInteractive();

    const car = cars[this.selectedCarId];
    const carStates = this.registry.get('carStates') || {};
    const state = carStates[this.selectedCarId] || {};
    this.currentEngineTuning = getEngineTuning(state);
    this.pendingEngineTuning = { ...this.currentEngineTuning };

    const add = obj => {
      this.engineModeObjects.push(obj);
      return obj;
    };

    add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + SIDE.h / 2,
      SIDE.w,
      SIDE.h,
      0x07111d,
      1
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(70));

    // Invisible hit area: the category artwork already supplies its own visual frame.
    this.engineInset = add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 102,
      SIDE.w - 36,
      178,
      0x000000,
      0
    ).setInteractive({ useHandCursor: true })
      .setDepth(74));

    this.engineInset.on('pointerdown', () => this.openEnginePartSelector('engine'));

    if (this.textures.exists('tuningCategoryEngine')) {
      const logo = add(this.add.image(
        SIDE.x + SIDE.w / 2,
        SIDE.y + TUNING_CATEGORY_LOGO_Y_OFFSET,
        'tuningCategoryEngine'
      ).setOrigin(0.5).setDepth(73));

      const source = this.textures.get('tuningCategoryEngine').getSourceImage();
      const fit = Math.min(
        (SIDE.w - 54) / source.width,
        TUNING_CATEGORY_LOGO_MAX_HEIGHT / source.height
      );
      logo.setScale(fit);
    } else {
      add(this.add.text(SIDE.x + SIDE.w / 2, SIDE.y + TUNING_CATEGORY_LOGO_Y_OFFSET, 'ENGINE', {
        fontFamily: PIXEL_FONT,
        fontSize: '14px',
        color: '#e9f8ff'
      }).setOrigin(0.5).setDepth(73));
    }

    const listIds = ENGINE_PART_ORDER;
    this.enginePartRows = {};

    listIds.forEach((partId, i) => {
      const y = SIDE.y + TUNING_CATEGORY_ROW_START_OFFSET + i * TUNING_CATEGORY_ROW_GAP;
      const part = ENGINE_TUNING_PARTS[partId];

      const box = add(this.add.rectangle(
        SIDE.x + SIDE.w / 2,
        y,
        SIDE.w - 36,
        44,
        0x0b1724,
        1
      ).setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(72));

      const label = add(this.add.text(SIDE.x + 24, y - 8, part.name, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#dff3ff'
      }).setOrigin(0, 0.5).setDepth(73));

      const detail = add(this.add.text(SIDE.x + 24, y + 12, '', {
        fontFamily: BODY_FONT, fontSize: '9px', color: '#7d9bad', fontStyle: '600'
      }).setOrigin(0, 0.5).setDepth(73));

      const level = add(this.add.text(SIDE.x + SIDE.w - 26, y, '', {
        fontFamily: PIXEL_FONT, fontSize: '7px', color: '#8db6cc'
      }).setOrigin(1, 0.5).setDepth(73));

      box.on('pointerdown', () => this.openEnginePartSelector(partId));
      this.enginePartRows[partId] = { box, label, detail, level };
    });

    this.enginePreviewText = add(this.add.text(
      SIDE.x + 20,
      SIDE.y + 510,
      '',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#91b6ca',
        lineSpacing: 4,
      }
    ).setDepth(73));

    this.engineApplyButton = add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 624,
      SIDE.w - 36,
      44,
      0x102226,
      1
    ).setStrokeStyle(2, 0x3e7f78, 1).setDepth(72));

    this.engineApplyText = add(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 624,
      'NO PARTS SELECTED',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#758e94',
      }
    ).setOrigin(0.5).setDepth(73));

    const backButton = add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 678,
      SIDE.w - 36,
      44,
      0x102138,
      1
    ).setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(72));

    add(this.add.text(SIDE.x + SIDE.w / 2, SIDE.y + 678, '<  BACK TO WORKSHOP', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#eef8ff'
    }).setOrigin(0.5).setDepth(73));

    backButton.on('pointerdown', () => this.leaveEngineMode(true, true));

    this.buildEngineHotspots();
    this.addDaichiEngineHelper();
    this.refreshEngineMode();
  }

  leaveEngineMode(refreshCar = true, animate = true) {
    if (animate) {
      if (this.engineTransitioning) return;
      this.engineTransitioning = true;

      const veil = this.add.rectangle(780, 420, 1560, 840, 0x02050b, 1)
        .setDepth(170)
        .setAlpha(0)
        .setInteractive();

      this.tweens.add({
        targets: veil,
        alpha: 1,
        duration: 190,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.leaveEngineMode(refreshCar, false);
          this.tweens.add({
            targets: veil,
            alpha: 0,
            duration: 280,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              veil.destroy();
              this.engineTransitioning = false;
            },
          });
        },
      });
      return;
    }

    this.closeEnginePartSelector();
    this.engineModeObjects.forEach(obj => obj?.destroy?.());
    this.engineHotspotObjects.forEach(obj => obj?.destroy?.());
    this.engineHelperObjects.forEach(obj => obj?.destroy?.());

    this.engineModeObjects = [];
    this.engineHotspotObjects = [];
    this.engineHelperObjects = [];
    this.engineMode = false;
    this.updateGarageNavState();
    this.enginePartRows = {};
    this.inlineEngineSprite = null;
    this.inlineEngineMask = null;

    this.upgradeButtons.forEach(item => item.box.setInteractive({ useHandCursor: true }));
    this.thumbButtons.forEach(item => {
      const active = item.id === this.selectedCarId;
      item.box.setInteractive({ useHandCursor: true })
        .setFillStyle(active ? 0x10263a : 0x0b1724, 1)
        .setStrokeStyle(active ? 3 : 2, active ? 0x41dcff : 0x29465c, 1);
      item.label.setColor(active ? '#ffffff' : '#b8cad7');
      item.display?.forEach(obj => obj?.setAlpha?.(1));
    });
    this.saveButton?.setInteractive({ useHandCursor: true });
    this.meetButton?.setInteractive({ useHandCursor: true });
    this.selectUpgrade(null);

    if (refreshCar) this.refreshWorkshopSpecs();
  }

  buildEngineHotspots() {
    const layout = this.heroCarLayout || {
      frontWheelX: 930,
      rearWheelX: 500,
      wheelY: 430,
      left: 363,
      right: 1053,
    };

    const frontX = layout.frontWheelX;
    const rearX = layout.rearWheelX;
    const wheelY = layout.wheelY;
    const carLeft = layout.left;
    const carRight = layout.right;
    const clampX = value => Phaser.Math.Clamp(value, carLeft + 42, carRight - 42);

    // Anchor the mechanical points to the selected car's wheelbase rather than
    // fixed screen coordinates. This keeps the markers on hatches, coupes and
    // sedans even when the body proportions change.
    const hotspots = {
      ecu: {
        x: clampX(frontX - 118),
        y: wheelY - 38,
        lx: clampX(frontX - 178),
        ly: wheelY + 30,
      },
      intake: {
        x: clampX(frontX + 78),
        y: wheelY - 48,
        lx: clampX(frontX + 112),
        ly: wheelY - 106,
      },
      turbo: {
        x: clampX(frontX - 48),
        y: wheelY - 54,
        lx: clampX(frontX - 74),
        ly: wheelY - 108,
      },
      intercooler: {
        x: clampX(carRight - 76),
        y: wheelY - 14,
        lx: clampX(carRight - 112),
        ly: wheelY + 30,
      },
    };

    Object.entries(hotspots).forEach(([partId, p]) => {
      const part = ENGINE_TUNING_PARTS[partId];
      if (!part) return;

      const line = this.add.line(0, 0, p.x, p.y, p.lx, p.ly, 0x43dfff, 0.95)
        .setOrigin(0, 0)
        .setLineWidth(2)
        .setDepth(74);

      const dot = this.add.circle(p.x, p.y, 10, 0x07111d, 1)
        .setStrokeStyle(3, 0x43dfff, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(75);

      const width = Math.max(100, part.name.length * 12);
      const box = this.add.rectangle(p.lx, p.ly, width, 30, 0x07111d, 0.97)
        .setStrokeStyle(2, 0x43dfff, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(74);

      const label = this.add.text(p.lx, p.ly, part.name, {
        fontFamily: PIXEL_FONT, fontSize: '7px', color: '#e7fbff'
      }).setOrigin(0.5).setDepth(75);

      const open = () => this.openEnginePartSelector(partId);
      dot.on('pointerdown', open);
      box.on('pointerdown', open);

      this.engineHotspotObjects.push(line, dot, box, label);
    });
  }

  addDaichiTuningHelper({
    textureKey,
    x,
    feetY,
    targetHeight = 282,
    depth = 8.4,
    anchorY = 1,
    shadowWidth = 74,
    shadowHeight = 22,
    shadowOffsetX = 6,
    shadowOffsetY = -8,
    useGarageCharacterShadow = false,
    objectList,
  }) {
    if (!textureKey || !this.textures.exists(textureKey) || !objectList) return null;

    const sprite = this.add.image(x, feetY, textureKey)
      .setOrigin(0.5, anchorY)
      .setDepth(depth);

    const source = this.textures.get(textureKey).getSourceImage();
    sprite.setScale(targetHeight / source.height);

    const softShadow = useGarageCharacterShadow
      ? this.add.ellipse(
          x + 12,
          feetY - 16,
          Math.max(60, sprite.displayWidth * 0.80),
          30,
          0x000000,
          0.58
        ).setDepth(depth - 0.12)
      : this.add.ellipse(
          x + shadowOffsetX,
          feetY + shadowOffsetY,
          shadowWidth,
          shadowHeight,
          0x000000,
          0.55
        ).setDepth(depth - 0.2);

    const contactShadow = useGarageCharacterShadow
      ? this.add.ellipse(
          x + 9,
          feetY - 11,
          Math.max(44, sprite.displayWidth * 0.60),
          18,
          0x000000,
          0.84
        ).setDepth(depth - 0.08)
      : this.add.ellipse(
          x + Math.round(shadowOffsetX * 0.72),
          feetY + shadowOffsetY + 3,
          Math.max(42, Math.round(shadowWidth * 0.70)),
          Math.max(12, Math.round(shadowHeight * 0.60)),
          0x000000,
          0.80
        ).setDepth(depth - 0.1);

    objectList.push(softShadow, contactShadow, sprite);
    return sprite;
  }

  addDaichiEngineHelper() {
    const layout = this.heroCarLayout;
    const car = cars[this.selectedCarId];
    if (!layout || !car) return;

    const wheelBottomY = this.getWheelBottomY(car, layout.bodyY, layout.targetWidth);
    // The older helper offset was authored around the oversized 690px car and
    // pushed Daichi into the right wall. Keep him beside the engine bay instead.
    const engineCfg = DAICHI_CFG.engine;
    const x = Math.min(
      STAGE.x + STAGE.w - engineCfg.rightInset,
      layout.frontWheelX + engineCfg.frontWheelOffsetX
    );

    this.addDaichiTuningHelper({
      textureKey: 'daichiEngineInspect',
      x,
      feetY: wheelBottomY + engineCfg.feetOffsetY,
      targetHeight: engineCfg.targetHeight,
      depth: 8.4,
      // The generated pose uses the shared 1024x1536 canvas but has extra
      // transparent padding below the shoes. Anchor the visible feet instead.
      anchorY: 1458 / 1536,
      shadowWidth: 116,
      shadowHeight: 25,
      shadowOffsetX: 13,
      shadowOffsetY: -7,
      objectList: this.engineHelperObjects,
    });
  }

  drawInlineEngineSchematic(level = 0) {
    const g = this.engineInsetGraphics;
    if (!g) return;
    g.clear();

    if (this.inlineEngineSprite) {
      this.inlineEngineSprite.destroy();
      this.inlineEngineSprite = null;
    }
    if (this.inlineEngineMask) {
      this.inlineEngineMask.destroy();
      this.inlineEngineMask = null;
    }

    const car = cars[this.selectedCarId];
    const engineKey = car?.visual?.engineKey;
    const insetLeft = SIDE.x + 18;
    const insetTop = SIDE.y + 13;
    const insetW = SIDE.w - 36;
    const insetH = 178;
    const cx = insetLeft + 70;
    const cy = SIDE.y + 110;

    if (engineKey && this.textures.exists(engineKey)) {
      this.inlineEngineSprite = this.add.image(cx, cy, engineKey)
        .setDepth(74)
        .setOrigin(0.5);
      this.engineModeObjects.push(this.inlineEngineSprite);

      const source = this.textures.get(engineKey).getSourceImage();
      const fit = Math.max(220 / source.width, 150 / source.height);
      this.inlineEngineSprite.setScale(fit * (1 + level * 0.035));

      this.inlineEngineMask = this.make.graphics({ add: false });
      this.inlineEngineMask.fillStyle(0xffffff, 1);
      this.inlineEngineMask.fillRect(insetLeft + 2, insetTop + 2, insetW - 4, insetH - 4);
      this.inlineEngineSprite.setMask(this.inlineEngineMask.createGeometryMask());
      this.engineModeObjects.push(this.inlineEngineMask);
      return;
    }

    const scale = 1.06 + level * 0.04;
    g.fillStyle(0x02070c, 0.65).fillEllipse(cx, cy + 32, 180 * scale, 22 * scale);
    g.fillStyle(0x8796a0, 1)
      .fillRoundedRect(cx - 82 * scale, cy - 24 * scale, 164 * scale, 62 * scale, 7);
    g.fillStyle(level >= 2 ? 0xbd3d49 : 0x9f2935, 1)
      .fillRoundedRect(cx - 64 * scale, cy - 39 * scale, 128 * scale, 33 * scale, 5);
    g.lineStyle(3, 0xd7e4ea, 0.76)
      .strokeRoundedRect(cx - 82 * scale, cy - 24 * scale, 164 * scale, 62 * scale, 7);

    for (let i = 0; i < 4; i++) {
      g.fillStyle(0x222b34, 1)
        .fillCircle(cx - 54 * scale + i * 35 * scale, cy + 15 * scale, 10 * scale);
    }
  }

  getPendingEngineCost() {
    if (!this.currentEngineTuning || !this.pendingEngineTuning) return 0;
    const baseCost = getEngineTuningCartCost(
      this.currentEngineTuning,
      this.pendingEngineTuning
    );
    return this.getWorkshopAdjustedCost(baseCost);
  }

  refreshEngineMode() {
    if (!this.engineMode || !this.selectedCarId) return;

    const car = cars[this.selectedCarId];
    const carStates = this.registry.get('carStates') || {};
    const state = carStates[this.selectedCarId] || {};
    const previewState = {
      ...state,
      tuning: this.pendingEngineTuning,
      engineTuning: this.pendingEngineTuning,
      stock: false,
    };
    const enginePreview = applyEngineTuning(car, engines[car.engine], previewState);
    const preview = applySecondaryTuning(enginePreview.car, enginePreview.engine, previewState);
    const previewRating = getPowerTorqueDisplay(car, previewState, preview.car);

    Object.entries(this.enginePartRows || {}).forEach(([partId, row]) => {
      const current = this.currentEngineTuning[partId];
      const pending = this.pendingEngineTuning[partId];
      const spec = ENGINE_TUNING_PARTS[partId].levels[pending];

      row.level.setText(
        pending === current ? 'LV.' + current : 'LV.' + current + ' > ' + pending
      );
      row.level.setColor(pending > current ? '#55e4ff' : '#8db6cc');
      row.detail.setText(spec.name.toUpperCase());
      row.box.setStrokeStyle(
        pending > current ? 2 : 1,
        pending > current ? 0x43dfff : 0x315470,
        1
      );
    });

    this.enginePreviewText?.setText(
      'POWER  ' + previewRating.powerLabel + '\n' +
      'TORQUE ' + previewRating.torqueLabel + '\n' +
      'BOOST  ' + (preview.car.maximumBoost || 0).toFixed(2) + ' bar'
    );

    const cash = Number(this.registry.get('cash') || 0);
    const cost = this.getPendingEngineCost();
    this.engineApplyButton?.removeAllListeners('pointerdown');

    if (cost <= 0) {
      this.engineApplyButton?.disableInteractive()
        .setFillStyle(0x102226, 1)
        .setStrokeStyle(2, 0x3e7f78, 0.7);
      this.engineApplyText?.setText('NO PARTS SELECTED').setColor('#758e94');
      return;
    }

    const affordable = cash >= cost;
    this.engineApplyButton?.setInteractive({ useHandCursor: true })
      .setFillStyle(affordable ? 0x0c2827 : 0x2a171b, 1)
      .setStrokeStyle(2, affordable ? 0x62e8c7 : 0xff6f7d, 1);

    this.engineApplyText?.setText(
      affordable
        ? 'INSTALL // ¥ ' + cost.toLocaleString('en-US')
        : 'NEED ¥ ' + cost.toLocaleString('en-US')
    ).setColor(affordable ? '#f1fffb' : '#ffc0c6');

    this.engineApplyButton?.on('pointerdown', () => this.applyPendingEngineUpgrades());
  }

  addModificationModalVisual(add, {
    textureKey = null,
    title = '',
    subtitle = '',
    partName = '',
    frameLabel = 'CURRENT SETUP',
    mode = 'engine',
    depth = 120,
  } = {}) {
    const frameX = 390;
    const frameY = 420;
    const frameW = 410;
    const frameH = 500;

    add(this.add.rectangle(frameX, frameY, frameW, frameH, 0x07111d, 0.98)
      .setStrokeStyle(2, 0x315470, 1)
      .setDepth(depth + 2));

    add(this.add.text(frameX - frameW / 2 + 22, frameY - frameH / 2 + 24, frameLabel, {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#6f93a8',
    }).setDepth(depth + 3));

    let renderedSprite = false;
    if (textureKey && this.textures.exists(textureKey)) {
      const sprite = add(this.add.image(frameX, frameY - 48, textureKey)
        .setDepth(depth + 3)
        .setOrigin(0.5));
      const source = this.textures.get(textureKey).getSourceImage();
      const fit = Math.min(350 / source.width, 300 / source.height);
      sprite.setScale(fit);
      renderedSprite = true;
    }

    if (!renderedSprite) {
      const g = add(this.add.graphics().setDepth(depth + 3));
      g.lineStyle(5, 0x7f98a8, 0.92);

      if (mode === 'drivetrain') {
        g.strokeRoundedRect(frameX - 82, frameY - 95, 126, 70, 10);
        g.lineBetween(frameX - 116, frameY - 60, frameX - 82, frameY - 60);
        g.lineBetween(frameX + 44, frameY - 60, frameX + 112, frameY - 60);
        g.strokeCircle(frameX - 120, frameY - 60, 22);
        g.strokeCircle(frameX + 116, frameY - 60, 22);
      } else if (mode === 'exhaustNos') {
        g.lineBetween(frameX - 112, frameY - 48, frameX + 30, frameY - 48);
        g.strokeRoundedRect(frameX + 30, frameY - 76, 90, 56, 10);
        g.strokeRoundedRect(frameX - 88, frameY - 128, 38, 80, 10);
      } else {
        g.strokeRoundedRect(frameX - 102, frameY - 100, 204, 118, 12);
        g.lineBetween(frameX - 92, frameY - 8, frameX + 92, frameY - 8);
        for (let i = 0; i < 4; i++) {
          g.strokeCircle(frameX - 72 + i * 48, frameY - 46, 14);
        }
      }

      add(this.add.text(frameX, frameY + 38, 'SPRITE SLOT', {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#526d7e',
      }).setOrigin(0.5).setDepth(depth + 3));
    }

    add(this.add.text(frameX, frameY + 142, title, {
      fontFamily: PIXEL_FONT,
      fontSize: '11px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: frameW - 44, useAdvancedWrap: true },
    }).setOrigin(0.5, 0).setDepth(depth + 3));

    if (subtitle) {
      add(this.add.text(frameX, frameY + 192, subtitle, {
        fontFamily: BODY_FONT,
        fontSize: '10px',
        color: '#8da9ba',
        align: 'center',
        fontStyle: '600',
        wordWrap: { width: frameW - 44, useAdvancedWrap: true },
      }).setOrigin(0.5, 0).setDepth(depth + 3));
    }

    if (partName) {
      add(this.add.text(frameX, frameY + 232, partName, {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#59dfff',
        align: 'center',
      }).setOrigin(0.5, 1).setDepth(depth + 3));
    }
  }

  resolveEnginePartSpriteKey(partId, spec, car) {
    if (partId === 'engine') {
      return car?.visual?.engineKey || null;
    }

    if (partId === 'turbo') {
      const level = Math.max(0, Math.min(3, Number(spec?.level || 0)));

      if (level === 0) {
        const factoryTurbo = Number(car?.maximumBoost || 0) > 0.01;
        return factoryTurbo
          ? 'tuningPartTurboL0Stock'
          : 'tuningPartTurboL0NA';
      }

      return 'tuningPartTurboL' + level;
    }

    return spec?.spriteKey || null;
  }

  addUpgradeRowSprite(add, spec, x, y, depth = 120, spriteKeyOverride = null) {
    const well = add(this.add.rectangle(x, y, 88, 74, 0x07111d, 0.96)
      .setStrokeStyle(1, 0x29465c, 1)
      .setDepth(depth + 3));

    const spriteKey = spriteKeyOverride || spec?.spriteKey || null;

    if (spriteKey && this.textures.exists(spriteKey)) {
      const sprite = add(this.add.image(x, y, spriteKey)
        .setDepth(depth + 4)
        .setOrigin(0.5));
      const source = this.textures.get(spriteKey).getSourceImage();
      sprite.setScale(Math.min(76 / source.width, 62 / source.height));
    } else {
      add(this.add.text(x, y, 'LV.' + Number(spec?.level || 0), {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#658294',
      }).setOrigin(0.5).setDepth(depth + 4));
    }

    return well;
  }

  openEnginePartSelector(partId, previewLevel = null) {
    this.closeEnginePartSelector();
    const part = ENGINE_TUNING_PARTS[partId];
    if (!part) return;

    const add = obj => {
      this.engineModalObjects.push(obj);
      return obj;
    };
    const depth = 120;
    const car = cars[this.selectedCarId];
    const installed = Number(this.currentEngineTuning[partId] || 0);
    const pending = Number(this.pendingEngineTuning[partId] ?? installed);
    const draftLevel = Phaser.Math.Clamp(
      previewLevel == null ? pending : Number(previewLevel),
      installed,
      Math.max(installed, part.levels.length - 1)
    );
    const previewSpec = part.levels[draftLevel] || part.levels[installed];
    const currentEngineName =
      engines[car.engine]?.name || car.engineModel || String(car.engine || '').toUpperCase();

    const blocker = add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.76)
      .setDepth(depth)
      .setInteractive());

    add(this.add.rectangle(780, 420, 1320, 680, 0x08131f, 1)
      .setStrokeStyle(2, 0x43dfff, 1)
      .setDepth(depth + 1));

    add(this.add.text(150, 112, part.name + ' // SELECT KIT', {
      fontFamily: PIXEL_FONT,
      fontSize: '13px',
      color: '#eefaff',
    }).setDepth(depth + 2));

    this.addModificationModalVisual(add, {
      textureKey: this.resolveEnginePartSpriteKey(partId, previewSpec, car) || car?.visual?.engineKey,
      title:
        partId === 'engine' && draftLevel === installed && installed === 0
          ? currentEngineName
          : previewSpec?.name?.toUpperCase(),
      subtitle:
        partId === 'engine' && draftLevel === 0
          ? 'FACTORY ENGINE // ' + car.shortName
          : previewSpec?.benefit?.toUpperCase(),
      partName: part.name,
      frameLabel: 'PREVIEW',
      mode: 'engine',
      depth,
    });

    part.levels.forEach((spec, index) => {
      const y = 230 + index * 120;
      const selected = draftLevel === spec.level;
      const availableHere =
        spec.level <= installed ||
        this.canInstallCurrentUpgrade('engine', partId, spec.level);
      const selectable = spec.level >= installed && availableHere;
      const pathCost = this.getWorkshopAdjustedCost(
        getUpgradePathCost(partId, installed, spec.level)
      );

      const box = add(this.add.rectangle(
        1040,
        y,
        720,
        100,
        selected ? 0x123047 : 0x0b1724,
        1
      ).setStrokeStyle(
        selected ? 2 : 1,
        selected ? 0x43dfff : 0x315470,
        1
      ).setDepth(depth + 2));

      this.addUpgradeRowSprite(
        add,
        spec,
        745,
        y,
        depth,
        this.resolveEnginePartSpriteKey(partId, spec, car)
      );

      add(this.add.text(805, y - 22, 'LV.' + spec.level + '  ' + spec.name.toUpperCase(), {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: selectable ? '#eaf8ff' : '#5a6d79',
      }).setOrigin(0, 0.5).setDepth(depth + 3));

      add(this.add.text(805, y + 24, spec.benefit.toUpperCase(), {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: selectable ? '#8eafc1' : '#53636e',
        fontStyle: '600',
        wordWrap: { width: 390, useAdvancedWrap: true },
      }).setOrigin(0, 0.5).setDepth(depth + 3));

      let price = 'INSTALLED';
      if (spec.level > installed && availableHere) {
        price = '¥ ' + pathCost.toLocaleString('en-US');
      } else if (spec.level > installed && !availableHere) {
        price = 'NEEDS ' + this.getCurrentUpgradeRequirement('engine', partId, spec.level);
      }
      if (spec.level < installed) price = 'INCLUDED';

      add(this.add.text(1365, y, price, {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: selected ? '#55e4ff' : selectable ? '#ffe08a' : '#61717b',
      }).setOrigin(1, 0.5).setDepth(depth + 3));

      if (selectable) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => {
          this.openEnginePartSelector(partId, spec.level);
        });
      }
    });

    const cancel = add(this.add.rectangle(1160, 124, 140, 44, 0x151d28, 1)
      .setStrokeStyle(1, 0x657d8c, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    add(this.add.text(1160, 124, 'CANCEL', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#c4d5df',
    }).setOrigin(0.5).setDepth(depth + 3));

    const confirm = add(this.add.rectangle(1320, 124, 150, 44, 0x0c2827, 1)
      .setStrokeStyle(2, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    add(this.add.text(
      1320,
      124,
      draftLevel === installed ? 'KEEP CURRENT' : 'ADD TO LIST',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#f1fffb',
      }
    ).setOrigin(0.5).setDepth(depth + 3));

    cancel.on('pointerdown', () => this.closeEnginePartSelector());
    confirm.on('pointerdown', () => {
      this.pendingEngineTuning[partId] = draftLevel;
      this.closeEnginePartSelector();
      this.refreshEngineMode();
    });
  }

  closeEnginePartSelector() {
    this.engineModalObjects.forEach(obj => obj?.destroy?.());
    this.engineModalObjects = [];
  }

  applyPendingEngineUpgrades() {
    const blockedPart = ENGINE_PART_ORDER.find(partId =>
      Number(this.pendingEngineTuning?.[partId] || 0) >
        Number(this.currentEngineTuning?.[partId] || 0) &&
      !this.canInstallCurrentUpgrade(
        'engine',
        partId,
        this.pendingEngineTuning?.[partId] || 0
      )
    );

    if (blockedPart) {
      const targetLevel = this.pendingEngineTuning?.[blockedPart] || 0;
      this.showWorkshopToast(
        'NEEDS ' + this.getCurrentUpgradeRequirement('engine', blockedPart, targetLevel)
      );
      return;
    }

    const cost = this.getPendingEngineCost();
    if (cost <= 0) return;

    const cash = Number(this.registry.get('cash') || 0);
    if (cash < cost) {
      this.showWorkshopToast('NOT ENOUGH CASH');
      return;
    }

    const carStates = { ...(this.registry.get('carStates') || {}) };
    const existing = carStates[this.selectedCarId] || {};
    const tuning = normaliseEngineTuning(this.pendingEngineTuning);

    carStates[this.selectedCarId] = {
      stock: false,
      nosInstalled: Boolean(existing.nosInstalled),
      tuneLevel: Number(existing.tuneLevel || 0),
      acquiredVia: existing.acquiredVia || 'garage',
      ...existing,
      tuning,
      stock:
        getEngineTuningCount(tuning) === 0 &&
        !existing.nosInstalled &&
        Object.values(existing.drivetrainTuning || {}).every(value => !Number(value)) &&
        Object.values(existing.chassisTuning || {}).every(value => !Number(value)) &&
        Object.values(getExhaustNosTuning(existing)).every(value => !Number(value)),
    };

    this.registry.set('carStates', carStates);
    this.registry.set('cash', cash - cost);
    this.cashText?.setText('¥ ' + (cash - cost).toLocaleString('en-US'));
    saveSessionState(this.registry);

    this.currentEngineTuning = getEngineTuning(carStates[this.selectedCarId]);
    this.pendingEngineTuning = { ...this.currentEngineTuning };
    this.refreshEngineMode();
    this.showWorkshopToast('DAICHI INSTALLED THE PARTS // ¥ ' + cost.toLocaleString('en-US'));
  }


  enterChassisMode() {
    if (this.engineMode || this.secondaryMode || this.chassisMode || this.engineTransitioning || !this.selectedCarId) return;
    if (this.isSelectedCarTuningLocked()) {
      this.showWorkshopToast('COLLECTOR CAR // CHASSIS & PAINT LOCKED');
      return;
    }
    this.ensureGarageTuningAssets(
      () => this.runTuningTransition(() => this.activateChassisMode()),
      { includeVisualMods: true }
    );
  }

  activateChassisMode() {
    if (this.engineMode || this.secondaryMode || this.chassisMode || !this.selectedCarId) return;

    const car = cars[this.selectedCarId];
    const carStates = this.registry.get('carStates') || {};
    const state = carStates[this.selectedCarId] || {};

    this.chassisMode = true;
    this.currentPaintColor = getCarPaintColor(state);
    this.pendingPaintColor = this.currentPaintColor;
    this.currentChassisTuning = getChassisTuning(state);
    this.pendingChassisTuning = { ...this.currentChassisTuning };
    this.currentVisualMods = normaliseVisualMods(this.selectedCarId, state);
    this.pendingVisualMods = { ...this.currentVisualMods };
    this.chassisModeObjects = [];
    this.chassisModalObjects = [];
    this.chassisPaintObjects = [];
    this.chassisPartRows = {};
    this.chassisPresetButtons = [];
    this.chassisRgbLabels = {};
    this.chassisPaintChannelButtons = [];
    this.chassisVisualModRows = {};
    this.chassisPaintPanelOpen = false;
    this.updateGarageNavState();

    this.upgradeButtons.forEach(item => item.box.disableInteractive());
    this.thumbButtons.forEach(item => {
      const active = item.id === this.selectedCarId;
      item.box.disableInteractive()
        .setFillStyle(active ? 0x10263a : 0x080d12, 1)
        .setStrokeStyle(active ? 3 : 1, active ? 0x41dcff : 0x29343d, active ? 1 : 0.65);
      item.label.setColor(active ? '#ffffff' : '#56636b');
      item.display?.forEach(obj => obj?.setAlpha?.(active ? 1 : 0.22));
    });
    this.saveButton?.disableInteractive();
    this.meetButton?.disableInteractive();

    const add = obj => {
      this.chassisModeObjects.push(obj);
      return obj;
    };
    const addPaint = obj => {
      this.chassisModeObjects.push(obj);
      this.chassisPaintObjects.push(obj);
      obj.setVisible(false);
      return obj;
    };

    add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + SIDE.h / 2,
      SIDE.w,
      SIDE.h,
      0x07111d,
      1
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(70));

    if (this.textures.exists('tuningCategoryChassis')) {
      const logo = add(this.add.image(
        SIDE.x + SIDE.w / 2,
        SIDE.y + TUNING_CATEGORY_LOGO_Y_OFFSET,
        'tuningCategoryChassis'
      ).setOrigin(0.5).setDepth(73));

      const source = this.textures.get('tuningCategoryChassis').getSourceImage();
      logo.setScale(Math.min(
        (SIDE.w - 54) / source.width,
        TUNING_CATEGORY_LOGO_MAX_HEIGHT / source.height
      ));
    } else {
      add(this.add.text(SIDE.x + SIDE.w / 2, SIDE.y + TUNING_CATEGORY_LOGO_Y_OFFSET, 'CHASSIS', {
        fontFamily: PIXEL_FONT,
        fontSize: '13px',
        color: '#e9f8ff',
      }).setOrigin(0.5).setDepth(73));
    }

    this.chassisPartRows = {};
    CHASSIS_PART_ORDER.forEach((partId, index) => {
      const part = CHASSIS_TUNING_PARTS[partId];
      const y = SIDE.y + TUNING_CATEGORY_ROW_START_OFFSET + index * 62;

      const box = add(this.add.rectangle(
        SIDE.x + SIDE.w / 2,
        y,
        SIDE.w - 36,
        52,
        0x0b1724,
        1
      ).setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(72));

      const label = add(this.add.text(SIDE.x + 24, y - 9, part.name, {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#dff3ff',
      }).setOrigin(0, 0.5).setDepth(73));

      const detail = add(this.add.text(SIDE.x + 24, y + 13, '', {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: '#7d9bad',
        fontStyle: '600',
      }).setOrigin(0, 0.5).setDepth(73));

      const level = add(this.add.text(SIDE.x + SIDE.w - 26, y, '', {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#8db6cc',
      }).setOrigin(1, 0.5).setDepth(73));

      box.on('pointerdown', () => this.openChassisPartSelector(partId));
      this.chassisPartRows[partId] = { box, label, detail, level };
    });

    const paintY = SIDE.y + 338;
    this.chassisPaintMenuButton = add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      paintY,
      SIDE.w - 36,
      52,
      0x0b1724,
      1
    ).setStrokeStyle(1, 0x315470, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(72));

    this.chassisPaintMenuLabel = add(this.add.text(SIDE.x + 24, paintY - 9, 'PAINT', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#dff3ff',
    }).setOrigin(0, 0.5).setDepth(73));

    this.chassisPaintMenuDetail = add(this.add.text(
      SIDE.x + 24,
      paintY + 13,
      'CUSTOM COLOUR // ¥ ' + this.getPaintJobCost().toLocaleString('en-US'),
      {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: '#7d9bad',
        fontStyle: '600',
      }
    ).setOrigin(0, 0.5).setDepth(73));

    this.chassisPaintMenuArrow = add(this.add.text(
      SIDE.x + SIDE.w - 28,
      paintY,
      '>',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '10px',
        color: '#8db6cc',
      }
    ).setOrigin(0.5).setDepth(73));

    this.chassisPaintMenuButton.on('pointerdown', () => this.openChassisPaintPanel());

    // Authored full-body kit pairs share the stock canvas and paint tint.
    // Each available row cycles through STOCK and its two options.
    const visualCatalog = getVisualModCatalog(this.selectedCarId);
    if (visualCatalog) {
      getVisualModSlotIds(this.selectedCarId).forEach((slotId, index) => {
        const slot = visualCatalog.slots[slotId];
        const y = SIDE.y + 402 + index * TUNING_CATEGORY_ROW_GAP;

        const box = add(this.add.rectangle(
          SIDE.x + SIDE.w / 2,
          y,
          SIDE.w - 36,
          46,
          0x0b1724,
          1
        ).setStrokeStyle(1, 0x315470, 1)
          .setInteractive({ useHandCursor: true })
          .setDepth(72));

        const label = add(this.add.text(SIDE.x + 24, y - 8, slot.label, {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: '#dff3ff',
        }).setOrigin(0, 0.5).setDepth(73));

        const detail = add(this.add.text(SIDE.x + 24, y + 11, '', {
          fontFamily: BODY_FONT,
          fontSize: '9px',
          color: '#7d9bad',
          fontStyle: '600',
        }).setOrigin(0, 0.5).setDepth(73));

        const arrow = add(this.add.text(SIDE.x + SIDE.w - 28, y, '>', {
          fontFamily: PIXEL_FONT,
          fontSize: '9px',
          color: '#8db6cc',
        }).setOrigin(0.5).setDepth(73));

        box.on('pointerdown', () => this.cyclePendingVisualMod(slotId));
        this.chassisVisualModRows[slotId] = { box, label, detail, arrow };
      });

      this.visualModsApplyButton = add(this.add.rectangle(
        SIDE.x + SIDE.w / 2,
        SIDE.y + 534,
        SIDE.w - 36,
        38,
        0x102226,
        1
      ).setStrokeStyle(2, 0x3e7f78, 0.7).setDepth(72));

      this.visualModsApplyText = add(this.add.text(
        SIDE.x + SIDE.w / 2,
        SIDE.y + 534,
        'VISUAL MODS INSTALLED',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: '#758e94',
        }
      ).setOrigin(0.5).setDepth(73));
    } else {
      const y = SIDE.y + 390;
      add(this.add.text(SIDE.x + 24, y, 'VISUAL MODS // NOT AVAILABLE FOR THIS CAR YET', {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: '#607887',
        fontStyle: '600',
        wordWrap: { width: SIDE.w - 48 },
      }).setDepth(73));
    }

    this.chassisPartsApplyButton = add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 594,
      SIDE.w - 36,
      44,
      0x102226,
      1
    ).setStrokeStyle(2, 0x3e7f78, 0.7).setDepth(72));

    this.chassisPartsApplyText = add(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 594,
      'NO CHASSIS PARTS SELECTED',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#758e94',
      }
    ).setOrigin(0.5).setDepth(73));

    this.chassisMainBackButton = add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 658,
      SIDE.w - 36,
      44,
      0x102138,
      1
    ).setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(72));

    this.chassisMainBackText = add(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 658,
      '<  BACK TO WORKSHOP',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#eef8ff',
      }
    ).setOrigin(0.5).setDepth(73));

    this.chassisMainBackButton.on('pointerdown', () => this.leaveChassisMode(true));

    // Paint sub-panel: same controls as before, hidden until PAINT is selected.
    addPaint(this.add.text(SIDE.x + 28, SIDE.y + 154, 'PAINT', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#62dfff',
    }).setDepth(73));

    this.chassisPaintSwatch = addPaint(this.add.rectangle(
      SIDE.x + 70,
      SIDE.y + 198,
      76,
      52,
      this.pendingPaintColor,
      1
    ).setStrokeStyle(2, 0xd8f5ff, 1).setDepth(72));

    this.chassisHexText = addPaint(this.add.text(SIDE.x + 126, SIDE.y + 187, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#e8f7ff',
    }).setDepth(73));

    this.chassisAssetStatusText = addPaint(this.add.text(SIDE.x + 126, SIDE.y + 212, '', {
      fontFamily: BODY_FONT,
      fontSize: '9px',
      color: '#7fa4b7',
      wordWrap: { width: 180 },
    }).setDepth(73));

    addPaint(this.add.text(SIDE.x + 28, SIDE.y + 254, 'PRESET COLOURS', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#91b9ce',
    }).setDepth(73));

    const presetStartX = SIDE.x + 55;
    const presetStartY = SIDE.y + 296;
    const presetGapX = 62;
    const presetGapY = 54;

    PAINT_PRESETS.forEach((preset, index) => {
      const col = index % 5;
      const row = Math.floor(index / 5);
      const x = presetStartX + col * presetGapX;
      const y = presetStartY + row * presetGapY;

      const box = addPaint(this.add.rectangle(x, y, 46, 32, preset.color, 1)
        .setStrokeStyle(2, 0x42586a, 1)
        .setDepth(72));

      const hit = addPaint(this.add.rectangle(x, y, 52, 40, 0x000000, 0)
        .setDepth(74));

      hit.disableInteractive();
      hit.on('pointerdown', () => {
        if (!hasLayeredPaintAssets(this, car)) return;
        this.pendingPaintColor = preset.color;
        this.refreshChassisMode();
      });

      this.chassisPresetButtons.push({ preset, box, hit });
    });

    addPaint(this.add.text(SIDE.x + 28, SIDE.y + 398, 'CUSTOM RGB', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#91b9ce',
    }).setDepth(73));

    ['r', 'g', 'b'].forEach((channel, index) => {
      const y = SIDE.y + 442 + index * 46;
      const label = channel.toUpperCase();

      addPaint(this.add.text(SIDE.x + 32, y, label, {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#dff3ff',
      }).setOrigin(0, 0.5).setDepth(73));

      const minus = addPaint(this.add.rectangle(SIDE.x + 112, y, 42, 34, 0x0b1724, 1)
        .setStrokeStyle(1, 0x315470, 1)
        .setDepth(72));
      minus.disableInteractive();

      addPaint(this.add.text(SIDE.x + 112, y, '−', {
        fontFamily: PIXEL_FONT,
        fontSize: '12px',
        color: '#bde9ff',
      }).setOrigin(0.5).setDepth(73));

      const valueText = addPaint(this.add.text(SIDE.x + 180, y, '000', {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(73));
      this.chassisRgbLabels[channel] = valueText;

      const plus = addPaint(this.add.rectangle(SIDE.x + 248, y, 42, 34, 0x0b1724, 1)
        .setStrokeStyle(1, 0x315470, 1)
        .setDepth(72));
      plus.disableInteractive();

      addPaint(this.add.text(SIDE.x + 248, y, '+', {
        fontFamily: PIXEL_FONT,
        fontSize: '10px',
        color: '#bde9ff',
      }).setOrigin(0.5).setDepth(73));

      minus.on('pointerdown', () => this.adjustPendingPaintChannel(channel, -8));
      plus.on('pointerdown', () => this.adjustPendingPaintChannel(channel, 8));

      this.chassisPaintChannelButtons = this.chassisPaintChannelButtons || [];
      this.chassisPaintChannelButtons.push(minus, plus);
    });

    this.chassisApplyButton = addPaint(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 604,
      SIDE.w - 36,
      44,
      0x102226,
      1
    ).setStrokeStyle(2, 0x3e7f78, 1).setDepth(72));
    this.chassisApplyButton.disableInteractive();

    this.chassisApplyText = addPaint(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 604,
      'PAINT INSTALLED',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#758e94',
      }
    ).setOrigin(0.5).setDepth(73));

    this.chassisPaintBackButton = addPaint(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 662,
      SIDE.w - 36,
      44,
      0x102138,
      1
    ).setStrokeStyle(2, 0x55b8ff, 1).setDepth(72));
    this.chassisPaintBackButton.disableInteractive();

    this.chassisPaintBackText = addPaint(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 662,
      '<  BACK TO CHASSIS',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#eef8ff',
      }
    ).setOrigin(0.5).setDepth(73));

    this.chassisPaintBackButton.on('pointerdown', () => this.closeChassisPaintPanel());

    this.addDaichiChassisHelper();
    this.refreshChassisMode();
  }

  getPaintJobCost() {
    return this.getWorkshopAdjustedCost(8000);
  }

  openChassisPaintPanel() {
    if (!this.chassisMode || this.chassisPaintPanelOpen) return;

    this.chassisPaintPanelOpen = true;
    this.pendingPaintColor = this.currentPaintColor;

    Object.values(this.chassisPartRows || {}).forEach(row => {
      [row.box, row.label, row.detail, row.level].forEach(obj => obj?.setVisible?.(false));
      row.box?.disableInteractive?.();
    });
    Object.values(this.chassisVisualModRows || {}).forEach(row => {
      [row.box, row.label, row.detail, row.arrow].forEach(obj => obj?.setVisible?.(false));
      row.box?.disableInteractive?.();
    });

    [
      this.chassisPaintMenuButton,
      this.chassisPaintMenuLabel,
      this.chassisPaintMenuDetail,
      this.chassisPaintMenuArrow,
      this.chassisPartsApplyButton,
      this.chassisPartsApplyText,
      this.visualModsApplyButton,
      this.visualModsApplyText,
      this.chassisMainBackButton,
      this.chassisMainBackText,
    ].forEach(obj => obj?.setVisible?.(false));

    this.chassisPaintMenuButton?.disableInteractive();
    this.chassisPartsApplyButton?.disableInteractive();
    this.visualModsApplyButton?.disableInteractive();
    this.chassisMainBackButton?.disableInteractive();

    (this.chassisPaintObjects || []).forEach(obj => obj?.setVisible?.(true));
    this.chassisPaintBackButton?.setInteractive({ useHandCursor: true });
    (this.chassisPaintChannelButtons || []).forEach(button =>
      button?.setInteractive?.({ useHandCursor: true })
    );

    this.refreshChassisMode();
  }

  closeChassisPaintPanel() {
    if (!this.chassisMode || !this.chassisPaintPanelOpen) return;

    this.chassisPaintPanelOpen = false;
    this.pendingPaintColor = this.currentPaintColor;
    setCarBodyPaint(this.selectedDisplay, this.currentPaintColor);

    (this.chassisPaintObjects || []).forEach(obj => obj?.setVisible?.(false));
    this.chassisPresetButtons.forEach(item => item.hit?.disableInteractive?.());
    (this.chassisPaintChannelButtons || []).forEach(button => button?.disableInteractive?.());
    this.chassisApplyButton?.disableInteractive();
    this.chassisPaintBackButton?.disableInteractive();

    Object.values(this.chassisPartRows || {}).forEach(row => {
      [row.box, row.label, row.detail, row.level].forEach(obj => obj?.setVisible?.(true));
      row.box?.setInteractive?.({ useHandCursor: true });
    });
    Object.values(this.chassisVisualModRows || {}).forEach(row => {
      [row.box, row.label, row.detail, row.arrow].forEach(obj => obj?.setVisible?.(true));
      row.box?.setInteractive?.({ useHandCursor: true });
    });

    [
      this.chassisPaintMenuButton,
      this.chassisPaintMenuLabel,
      this.chassisPaintMenuDetail,
      this.chassisPaintMenuArrow,
      this.chassisPartsApplyButton,
      this.chassisPartsApplyText,
      this.chassisMainBackButton,
      this.chassisMainBackText,
    ].forEach(obj => obj?.setVisible?.(true));

    this.chassisPaintMenuButton?.setInteractive({ useHandCursor: true });
    this.chassisMainBackButton?.setInteractive({ useHandCursor: true });

    this.refreshChassisMode();
  }

  rebuildSelectedVisualModPreview() {
    if (!this.selectedCarId || !this.heroCarLayout) return;

    (this.selectedDisplay || []).forEach(obj => obj?.destroy?.());

    const car = cars[this.selectedCarId];
    const layout = this.buildWorkshopHeroLayout(car, this.pendingVisualMods);
    if (!layout) return;
    this.heroCarLayout = layout;
    this.selectedDisplay = this.createCarDisplay(
      car,
      layout.x,
      layout.bodyY,
      layout.targetWidth,
      10,
      this.pendingVisualMods
    );

    setCarBodyPaint(
      this.selectedDisplay,
      normalisePaintColor(this.pendingPaintColor ?? this.currentPaintColor)
    );
  }

  cyclePendingVisualMod(slotId) {
    if (!this.chassisMode || !this.selectedCarId || this.chassisPaintPanelOpen) return;

    const options = getVisualModOptions(this.selectedCarId, slotId);
    if (options.length <= 1) return;

    const currentId = this.pendingVisualMods?.[slotId] || 'stock';
    const index = Math.max(0, options.findIndex(option => option.id === currentId));
    const next = options[(index + 1) % options.length];

    this.pendingVisualMods = {
      ...(this.pendingVisualMods || {}),
      [slotId]: next.id,
    };

    this.rebuildSelectedVisualModPreview();
    this.refreshChassisMode();
  }

  applyPendingVisualMods() {
    if (!this.chassisMode || !this.selectedCarId || !this.pendingVisualMods) return;

    const cost = this.getWorkshopAdjustedCost(
      getVisualModChangeCost(
        this.selectedCarId,
        this.currentVisualMods || {},
        this.pendingVisualMods
      )
    );

    const unchanged = VISUAL_MOD_SLOT_ORDER.every(
      slotId =>
        (this.currentVisualMods?.[slotId] || 'stock') ===
        (this.pendingVisualMods?.[slotId] || 'stock')
    );
    if (unchanged) return;

    const cash = Number(this.registry.get('cash') || 0);
    if (cash < cost) {
      this.showWorkshopToast('NOT ENOUGH CASH');
      return;
    }

    const carStates = { ...(this.registry.get('carStates') || {}) };
    const existing = carStates[this.selectedCarId] || {};
    const installed = normaliseVisualMods(this.selectedCarId, this.pendingVisualMods);

    carStates[this.selectedCarId] = {
      ...existing,
      stock: false,
      visualMods: installed,
    };

    this.registry.set('carStates', carStates);
    this.registry.set('cash', cash - cost);
    this.cashText?.setText('¥ ' + (cash - cost).toLocaleString('en-US'));
    saveSessionState(this.registry);

    this.currentVisualMods = { ...installed };
    this.pendingVisualMods = { ...installed };

    this.rebuildSelectedVisualModPreview();
    this.refreshChassisMode();
    this.showWorkshopToast(
      cost > 0
        ? 'VISUAL MODS INSTALLED // ¥ ' + cost.toLocaleString('en-US')
        : 'VISUAL MODS UPDATED'
    );
  }

  getPendingChassisCost() {
    if (!this.currentChassisTuning || !this.pendingChassisTuning) return 0;
    return this.getWorkshopAdjustedCost(
      getChassisCartCost(this.currentChassisTuning, this.pendingChassisTuning)
    );
  }

  openChassisPartSelector(partId, previewLevel = null) {
    this.closeChassisPartSelector();
    const part = CHASSIS_TUNING_PARTS[partId];
    if (!part) return;

    const add = obj => {
      this.chassisModalObjects.push(obj);
      return obj;
    };
    const depth = 120;
    const installed = Number(this.currentChassisTuning[partId] || 0);
    const pending = Number(this.pendingChassisTuning[partId] ?? installed);
    const draftLevel = Phaser.Math.Clamp(
      previewLevel == null ? pending : Number(previewLevel),
      installed,
      Math.max(installed, part.levels.length - 1)
    );
    const previewSpec = part.levels[draftLevel] || part.levels[installed];

    const blocker = add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.76)
      .setDepth(depth)
      .setInteractive());

    add(this.add.rectangle(780, 420, 1320, 680, 0x08131f, 1)
      .setStrokeStyle(2, 0x43dfff, 1)
      .setDepth(depth + 1));

    add(this.add.text(150, 112, part.name + ' // SELECT KIT', {
      fontFamily: PIXEL_FONT,
      fontSize: '13px',
      color: '#eefaff',
    }).setDepth(depth + 2));

    this.addModificationModalVisual(add, {
      textureKey: previewSpec?.spriteKey,
      title: previewSpec?.name?.toUpperCase() || part.name,
      subtitle: previewSpec?.benefit?.toUpperCase() || '',
      partName: 'CHASSIS',
      frameLabel: 'PREVIEW',
      mode: 'chassis',
      depth,
    });

    part.levels.forEach((spec, index) => {
      const y = 230 + index * 120;
      const selected = draftLevel === spec.level;
      const availableHere =
        spec.level <= installed ||
        this.canInstallCurrentUpgrade('chassis', partId, spec.level);
      const selectable = spec.level >= installed && availableHere;
      const pathCost = this.getWorkshopAdjustedCost(
        getChassisUpgradePathCost(partId, installed, spec.level)
      );

      const box = add(this.add.rectangle(
        1040,
        y,
        720,
        100,
        selected ? 0x123047 : 0x0b1724,
        1
      ).setStrokeStyle(
        selected ? 2 : 1,
        selected ? 0x43dfff : 0x315470,
        1
      ).setDepth(depth + 2));

      this.addUpgradeRowSprite(add, spec, 745, y, depth);

      add(this.add.text(805, y - 22, 'LV.' + spec.level + '  ' + spec.name.toUpperCase(), {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: selectable ? '#eaf8ff' : '#5a6d79',
      }).setOrigin(0, 0.5).setDepth(depth + 3));

      add(this.add.text(805, y + 24, spec.benefit.toUpperCase(), {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: selectable ? '#8eafc1' : '#53636e',
        fontStyle: '600',
        wordWrap: { width: 390, useAdvancedWrap: true },
      }).setOrigin(0, 0.5).setDepth(depth + 3));

      let price = 'INSTALLED';
      if (spec.level > installed && availableHere) {
        price = '¥ ' + pathCost.toLocaleString('en-US');
      } else if (spec.level > installed && !availableHere) {
        price = 'NEEDS ' + this.getCurrentUpgradeRequirement('chassis', partId, spec.level);
      }
      if (spec.level < installed) price = 'INCLUDED';

      add(this.add.text(1365, y, price, {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: selected ? '#55e4ff' : selectable ? '#ffe08a' : '#61717b',
      }).setOrigin(1, 0.5).setDepth(depth + 3));

      if (selectable) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => {
          this.openChassisPartSelector(partId, spec.level);
        });
      }
    });

    const cancel = add(this.add.rectangle(1160, 124, 140, 44, 0x151d28, 1)
      .setStrokeStyle(1, 0x657d8c, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    add(this.add.text(1160, 124, 'CANCEL', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#c4d5df',
    }).setOrigin(0.5).setDepth(depth + 3));

    const confirm = add(this.add.rectangle(1320, 124, 150, 44, 0x0c2827, 1)
      .setStrokeStyle(2, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    add(this.add.text(
      1320,
      124,
      draftLevel === installed ? 'KEEP CURRENT' : 'ADD TO LIST',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#f1fffb',
      }
    ).setOrigin(0.5).setDepth(depth + 3));

    cancel.on('pointerdown', () => this.closeChassisPartSelector());
    confirm.on('pointerdown', () => {
      this.pendingChassisTuning[partId] = draftLevel;
      this.closeChassisPartSelector();
      this.refreshChassisMode();
    });
  }

  closeChassisPartSelector() {
    (this.chassisModalObjects || []).forEach(obj => obj?.destroy?.());
    this.chassisModalObjects = [];
  }

  applyPendingChassisUpgrades() {
    const blockedPart = CHASSIS_PART_ORDER.find(partId =>
      Number(this.pendingChassisTuning?.[partId] || 0) >
        Number(this.currentChassisTuning?.[partId] || 0) &&
      !this.canInstallCurrentUpgrade(
        'chassis',
        partId,
        this.pendingChassisTuning?.[partId] || 0
      )
    );

    if (blockedPart) {
      this.showWorkshopToast(
        'NEEDS ' + this.getCurrentUpgradeRequirement(
          'chassis',
          blockedPart,
          this.pendingChassisTuning?.[blockedPart] || 0
        )
      );
      return;
    }

    const cost = this.getPendingChassisCost();
    if (cost <= 0) return;

    const cash = Number(this.registry.get('cash') || 0);
    if (cash < cost) {
      this.showWorkshopToast('NOT ENOUGH CASH');
      return;
    }

    const carStates = { ...(this.registry.get('carStates') || {}) };
    const existing = carStates[this.selectedCarId] || {};
    const chassisTuning = normaliseChassisTuning(this.pendingChassisTuning);

    const updated = {
      ...existing,
      stock: false,
      acquiredVia: existing.acquiredVia || 'garage',
      chassisTuning,
    };

    carStates[this.selectedCarId] = updated;
    this.registry.set('carStates', carStates);
    this.registry.set('cash', cash - cost);
    this.cashText?.setText('¥ ' + (cash - cost).toLocaleString('en-US'));
    saveSessionState(this.registry);

    this.currentChassisTuning = getChassisTuning(updated);
    this.pendingChassisTuning = { ...this.currentChassisTuning };
    this.refreshChassisMode();
    this.refreshWorkshopSpecs();
    this.showWorkshopToast('DAICHI INSTALLED THE PARTS // ¥ ' + cost.toLocaleString('en-US'));
  }

  adjustPendingPaintChannel(channel, delta) {
    if (!this.chassisMode || !hasLayeredPaintAssets(this, cars[this.selectedCarId])) return;

    const rgb = paintColorToRgb(this.pendingPaintColor);
    rgb[channel] = Phaser.Math.Clamp(Number(rgb[channel] || 0) + Number(delta || 0), 0, 255);
    this.pendingPaintColor = rgbToPaintColor(rgb.r, rgb.g, rgb.b);
    this.refreshChassisMode();
  }

  refreshChassisMode() {
    if (!this.chassisMode || !this.selectedCarId) return;

    const car = cars[this.selectedCarId];
    const ready = hasLayeredPaintAssets(this, car);
    const color = normalisePaintColor(this.pendingPaintColor);
    const rgb = paintColorToRgb(color);

    Object.entries(this.chassisPartRows || {}).forEach(([partId, row]) => {
      const current = this.currentChassisTuning?.[partId] || 0;
      const pending = this.pendingChassisTuning?.[partId] || 0;
      const spec = CHASSIS_TUNING_PARTS[partId].levels[pending];

      row.level.setText(pending === current ? 'LV.' + current : 'LV.' + current + ' > ' + pending);
      row.level.setColor(pending > current ? '#55e4ff' : '#8db6cc');
      row.detail.setText(spec.name.toUpperCase());
      row.box.setStrokeStyle(
        pending > current ? 2 : 1,
        pending > current ? 0x43dfff : 0x315470,
        1
      );
    });

    Object.entries(this.chassisVisualModRows || {}).forEach(([slotId, row]) => {
      const currentId = this.currentVisualMods?.[slotId] || 'stock';
      const pendingId = this.pendingVisualMods?.[slotId] || 'stock';
      const option = getVisualModOption(this.selectedCarId, slotId, pendingId);
      const changed = currentId !== pendingId;

      row.detail.setText(
        (option?.name || 'STOCK').toUpperCase() +
        (option?.price ? ' // ¥ ' + Number(option.price).toLocaleString('en-US') : '')
      );
      row.detail.setColor(changed ? '#7fe6ff' : '#7d9bad');
      row.box.setStrokeStyle(changed ? 2 : 1, changed ? 0x43dfff : 0x315470, 1);
      row.arrow.setColor(changed ? '#55e4ff' : '#8db6cc');
    });

    if (this.visualModsApplyButton && this.visualModsApplyText) {
      const visualUnchanged = VISUAL_MOD_SLOT_ORDER.every(
        slotId =>
          (this.currentVisualMods?.[slotId] || 'stock') ===
          (this.pendingVisualMods?.[slotId] || 'stock')
      );
      const visualCost = this.getWorkshopAdjustedCost(
        getVisualModChangeCost(
          this.selectedCarId,
          this.currentVisualMods || {},
          this.pendingVisualMods || {}
        )
      );
      const visualAffordable = Number(this.registry.get('cash') || 0) >= visualCost;

      this.visualModsApplyButton.removeAllListeners('pointerdown');

      if (visualUnchanged) {
        this.visualModsApplyButton.disableInteractive()
          .setFillStyle(0x102226, 1)
          .setStrokeStyle(2, 0x3e7f78, 0.7);
        this.visualModsApplyText
          .setText('VISUAL MODS INSTALLED')
          .setColor('#758e94');
      } else {
        this.visualModsApplyButton.setInteractive({ useHandCursor: true })
          .setFillStyle(visualAffordable ? 0x0c2827 : 0x2a171b, 1)
          .setStrokeStyle(2, visualAffordable ? 0x62e8c7 : 0xff6f7d, 1);
        this.visualModsApplyText.setText(
          visualAffordable
            ? 'INSTALL VISUAL MODS // ¥ ' + visualCost.toLocaleString('en-US')
            : 'NEED ¥ ' + visualCost.toLocaleString('en-US')
        ).setColor(visualAffordable ? '#f1fffb' : '#ffc0c6');

        this.visualModsApplyButton.on('pointerdown', () => this.applyPendingVisualMods());
      }
    }

    const chassisCost = this.getPendingChassisCost();
    const cash = Number(this.registry.get('cash') || 0);
    this.chassisPartsApplyButton?.removeAllListeners('pointerdown');

    if (chassisCost <= 0) {
      this.chassisPartsApplyButton?.disableInteractive()
        .setFillStyle(0x102226, 1)
        .setStrokeStyle(2, 0x3e7f78, 0.7);
      this.chassisPartsApplyText?.setText('NO CHASSIS PARTS SELECTED').setColor('#758e94');
    } else {
      const affordable = cash >= chassisCost;
      this.chassisPartsApplyButton?.setInteractive({ useHandCursor: true })
        .setFillStyle(affordable ? 0x0c2827 : 0x2a171b, 1)
        .setStrokeStyle(2, affordable ? 0x62e8c7 : 0xff6f7d, 1);
      this.chassisPartsApplyText?.setText(
        affordable
          ? 'INSTALL PARTS // ¥ ' + chassisCost.toLocaleString('en-US')
          : 'NEED ¥ ' + chassisCost.toLocaleString('en-US')
      ).setColor(affordable ? '#f1fffb' : '#ffc0c6');
      this.chassisPartsApplyButton?.on('pointerdown', () => this.applyPendingChassisUpgrades());
    }

    this.chassisPaintSwatch?.setFillStyle(color, 1);
    this.chassisHexText?.setText(paintColorToHex(color));
    this.chassisRgbLabels.r?.setText(String(rgb.r).padStart(3, '0'));
    this.chassisRgbLabels.g?.setText(String(rgb.g).padStart(3, '0'));
    this.chassisRgbLabels.b?.setText(String(rgb.b).padStart(3, '0'));

    this.chassisAssetStatusText?.setText(
      ready
        ? 'LIVE PREVIEW // PHASER TINT'
        : 'PAINT LAYERS NOT AVAILABLE FOR THIS CAR'
    ).setColor(ready ? '#62e8c7' : '#ffbc71');

    this.chassisPresetButtons.forEach(item => {
      const active = item.preset.color === color;
      item.box.setStrokeStyle(active ? 3 : 2, active ? 0xffffff : 0x42586a, active ? 1 : 0.85);
      if (ready && this.chassisPaintPanelOpen) item.hit.setInteractive({ useHandCursor: true });
      else item.hit.disableInteractive();
    });

    if (ready && this.chassisPaintPanelOpen) setCarBodyPaint(this.selectedDisplay, color);

    this.chassisApplyButton?.removeAllListeners('pointerdown');

    if (!ready) {
      this.chassisApplyButton?.disableInteractive()
        .setFillStyle(0x241b16, 1)
        .setStrokeStyle(2, 0x79563a, 0.85);
      this.chassisApplyText?.setText('PAINT ASSETS REQUIRED').setColor('#c99b74');
      return;
    }

    if (color === this.currentPaintColor) {
      this.chassisApplyButton?.disableInteractive()
        .setFillStyle(0x102226, 1)
        .setStrokeStyle(2, 0x3e7f78, 0.7);
      this.chassisApplyText?.setText('PAINT INSTALLED').setColor('#758e94');
      return;
    }

    const paintCost = this.getPaintJobCost();
    const affordablePaint = Number(this.registry.get('cash') || 0) >= paintCost;
    if (this.chassisPaintPanelOpen) {
      this.chassisApplyButton?.setInteractive({ useHandCursor: true })
        .setFillStyle(affordablePaint ? 0x0c2827 : 0x2a171b, 1)
        .setStrokeStyle(2, affordablePaint ? 0x62e8c7 : 0xff6f7d, 1);
    } else {
      this.chassisApplyButton?.disableInteractive();
    }
    this.chassisApplyText?.setText(
      affordablePaint
        ? 'PAINT CAR // ¥ ' + paintCost.toLocaleString('en-US')
        : 'NEED ¥ ' + paintCost.toLocaleString('en-US')
    ).setColor(affordablePaint ? '#f1fffb' : '#ffc0c6');
    if (this.chassisPaintPanelOpen) {
      this.chassisApplyButton?.on('pointerdown', () => this.applyPendingPaint());
    }
  }

  applyPendingPaint() {
    if (!this.chassisMode || !this.selectedCarId || !this.chassisPaintPanelOpen) return;
    const car = cars[this.selectedCarId];
    if (!hasLayeredPaintAssets(this, car)) {
      this.showWorkshopToast('PAINT LAYERS NOT AVAILABLE');
      return;
    }

    const paintColor = normalisePaintColor(this.pendingPaintColor);
    if (paintColor === this.currentPaintColor) return;

    const cost = this.getPaintJobCost();
    const cash = Number(this.registry.get('cash') || 0);
    if (cash < cost) {
      this.showWorkshopToast('NOT ENOUGH CASH');
      return;
    }

    const carStates = { ...(this.registry.get('carStates') || {}) };
    const existing = carStates[this.selectedCarId] || {};

    carStates[this.selectedCarId] = {
      ...existing,
      paintColor,
    };

    this.registry.set('carStates', carStates);
    this.registry.set('cash', cash - cost);
    this.cashText?.setText('¥ ' + (cash - cost).toLocaleString('en-US'));
    saveSessionState(this.registry);
    this.currentPaintColor = paintColor;
    this.pendingPaintColor = paintColor;

    this.thumbButtons.forEach(item => {
      if (item.id === this.selectedCarId) setCarBodyPaint(item.display || [], paintColor);
    });
    setCarBodyPaint(this.selectedDisplay, paintColor);
    this.refreshChassisMode();
    this.showWorkshopToast(
      'PAINT APPLIED // ' + paintColorToHex(paintColor) + ' // ¥ ' + cost.toLocaleString('en-US')
    );
  }

  leaveChassisMode(animate = true) {
    if (!this.chassisMode) return;

    if (animate) {
      if (this.engineTransitioning) return;
      this.engineTransitioning = true;

      const veil = this.add.rectangle(780, 420, 1560, 840, 0x02050b, 1)
        .setDepth(170)
        .setAlpha(0)
        .setInteractive();

      this.tweens.add({
        targets: veil,
        alpha: 1,
        duration: 180,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.leaveChassisMode(false);
          this.tweens.add({
            targets: veil,
            alpha: 0,
            duration: 250,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              veil.destroy();
              this.engineTransitioning = false;
            },
          });
        },
      });
      return;
    }

    this.closeChassisPartSelector();
    this.pendingPaintColor = this.currentPaintColor;
    this.pendingVisualMods = { ...(this.currentVisualMods || {}) };
    this.rebuildSelectedVisualModPreview();
    setCarBodyPaint(this.selectedDisplay, this.currentPaintColor);
    this.chassisModeObjects.forEach(obj => obj?.destroy?.());
    this.chassisModeObjects = [];
    this.chassisPresetButtons = [];
    this.chassisRgbLabels = {};
    this.chassisPartRows = {};
    this.chassisVisualModRows = {};
    this.chassisPaintObjects = [];
    this.chassisPaintChannelButtons = [];
    this.chassisPaintPanelOpen = false;
    this.currentChassisTuning = null;
    this.pendingChassisTuning = null;
    this.currentVisualMods = null;
    this.pendingVisualMods = null;
    this.visualModsApplyButton = null;
    this.visualModsApplyText = null;
    this.chassisMode = false;
    this.updateGarageNavState();

    this.upgradeButtons.forEach(item => item.box.setInteractive({ useHandCursor: true }));
    this.thumbButtons.forEach(item => {
      const active = item.id === this.selectedCarId;
      item.box.setInteractive({ useHandCursor: true })
        .setFillStyle(active ? 0x10263a : 0x0b1724, 1)
        .setStrokeStyle(active ? 3 : 2, active ? 0x41dcff : 0x29465c, 1);
      item.label.setColor(active ? '#ffffff' : '#b8cad7');
      item.display?.forEach(obj => obj?.setAlpha?.(1));
    });
    this.saveButton?.setInteractive({ useHandCursor: true });
    this.meetButton?.setInteractive({ useHandCursor: true });
    this.selectUpgrade(null);

    this.refreshWorkshopSpecs();
  }

  enterSecondaryTuningMode(mode) {
    if (this.engineMode || this.secondaryMode || this.chassisMode || this.engineTransitioning || !this.selectedCarId) return;
    if (this.isSelectedCarTuningLocked()) {
      this.showWorkshopToast('COLLECTOR CAR // TUNING SEALED');
      return;
    }
    this.ensureGarageTuningAssets(
      () => this.runTuningTransition(() => this.activateSecondaryTuningMode(mode))
    );
  }

  activateSecondaryTuningMode(mode) {
    if (this.engineMode || this.secondaryMode || this.chassisMode || !this.selectedCarId) return;

    const isDrivetrain = mode === 'drivetrain';
    const parts = isDrivetrain ? DRIVETRAIN_TUNING_PARTS : EXHAUST_NOS_TUNING_PARTS;
    const order = isDrivetrain ? DRIVETRAIN_PART_ORDER : EXHAUST_NOS_PART_ORDER;
    const carStates = this.registry.get('carStates') || {};
    const state = carStates[this.selectedCarId] || {};

    this.secondaryMode = mode;
    this.updateGarageNavState();
    this.currentSecondaryTuning = isDrivetrain
      ? getDrivetrainTuning(state)
      : getExhaustNosTuning(state);
    this.pendingSecondaryTuning = { ...this.currentSecondaryTuning };

    this.upgradeButtons.forEach(item => item.box.disableInteractive());
    this.thumbButtons.forEach(item => {
      const active = item.id === this.selectedCarId;
      item.box.disableInteractive()
        .setFillStyle(active ? 0x10263a : 0x080d12, 1)
        .setStrokeStyle(active ? 3 : 1, active ? 0x41dcff : 0x29343d, active ? 1 : 0.65);
      item.label.setColor(active ? '#ffffff' : '#56636b');
      item.display?.forEach(obj => obj?.setAlpha?.(active ? 1 : 0.22));
    });
    this.saveButton?.disableInteractive();
    this.meetButton?.disableInteractive();

    const add = obj => {
      this.secondaryModeObjects.push(obj);
      return obj;
    };

    add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + SIDE.h / 2,
      SIDE.w,
      SIDE.h,
      0x07111d,
      1
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(70));

    const secondaryCategoryKey = isDrivetrain
      ? 'tuningCategoryDrivetrain'
      : 'tuningCategoryExhaustNos';
    const secondaryCategoryName = isDrivetrain ? 'DRIVETRAIN' : 'EXHAUST / NOS';

    if (this.textures.exists(secondaryCategoryKey)) {
      const logo = add(this.add.image(
        SIDE.x + SIDE.w / 2,
        SIDE.y + TUNING_CATEGORY_LOGO_Y_OFFSET,
        secondaryCategoryKey
      ).setOrigin(0.5).setDepth(73));

      const source = this.textures.get(secondaryCategoryKey).getSourceImage();
      logo.setScale(Math.min(
        (SIDE.w - 54) / source.width,
        TUNING_CATEGORY_LOGO_MAX_HEIGHT / source.height
      ));
    } else {
      add(this.add.text(SIDE.x + SIDE.w / 2, SIDE.y + TUNING_CATEGORY_LOGO_Y_OFFSET, secondaryCategoryName, {
        fontFamily: PIXEL_FONT,
        fontSize: '13px',
        color: '#e9f8ff',
      }).setOrigin(0.5).setDepth(73));
    }

    this.secondaryPartRows = {};
    const rowStartY = SIDE.y + TUNING_CATEGORY_ROW_START_OFFSET;
    const rowGap = TUNING_CATEGORY_ROW_GAP;
    order.forEach((partId, i) => {
      const y = rowStartY + i * rowGap;
      const part = parts[partId];

      const box = add(this.add.rectangle(
        SIDE.x + SIDE.w / 2,
        y,
        SIDE.w - 36,
        48,
        0x0b1724,
        1
      ).setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(72));

      const label = add(this.add.text(SIDE.x + 24, y - 8, part.name, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#dff3ff'
      }).setOrigin(0, 0.5).setDepth(73));

      const detail = add(this.add.text(SIDE.x + 24, y + 12, '', {
        fontFamily: BODY_FONT, fontSize: '9px', color: '#7d9bad', fontStyle: '600'
      }).setOrigin(0, 0.5).setDepth(73));

      const level = add(this.add.text(SIDE.x + SIDE.w - 26, y, '', {
        fontFamily: PIXEL_FONT, fontSize: '7px', color: '#8db6cc'
      }).setOrigin(1, 0.5).setDepth(73));

      box.on('pointerdown', () => this.openSecondaryPartSelector(partId));
      this.secondaryPartRows[partId] = { box, label, detail, level };
    });

    this.secondaryPreviewText = add(this.add.text(
      SIDE.x + 20,
      SIDE.y + 510,
      '',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#91b6ca',
        lineSpacing: 4,
      }
    ).setDepth(73));

    this.secondaryApplyButton = add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 624,
      SIDE.w - 36,
      44,
      0x102226,
      1
    ).setStrokeStyle(2, 0x3e7f78, 1).setDepth(72));

    this.secondaryApplyText = add(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 624,
      'NO PARTS SELECTED',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#758e94',
      }
    ).setOrigin(0.5).setDepth(73));

    const backButton = add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 678,
      SIDE.w - 36,
      44,
      0x102138,
      1
    ).setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(72));

    add(this.add.text(SIDE.x + SIDE.w / 2, SIDE.y + 678, '<  BACK TO WORKSHOP', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#eef8ff'
    }).setOrigin(0.5).setDepth(73));

    backButton.on('pointerdown', () => this.leaveSecondaryTuningMode(true));

    this.buildSecondaryHotspots(mode);
    this.addDaichiSecondaryHelper(mode);
    this.refreshSecondaryTuningMode();
  }

  leaveSecondaryTuningMode(animate = true) {
    if (animate) {
      if (this.engineTransitioning) return;
      this.engineTransitioning = true;

      const veil = this.add.rectangle(780, 420, 1560, 840, 0x02050b, 1)
        .setDepth(170)
        .setAlpha(0)
        .setInteractive();

      this.tweens.add({
        targets: veil,
        alpha: 1,
        duration: 190,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.leaveSecondaryTuningMode(false);
          this.tweens.add({
            targets: veil,
            alpha: 0,
            duration: 280,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              veil.destroy();
              this.engineTransitioning = false;
            },
          });
        },
      });
      return;
    }

    this.closeSecondaryPartSelector();
    this.secondaryModeObjects.forEach(obj => obj?.destroy?.());
    this.secondaryHelperObjects.forEach(obj => obj?.destroy?.());
    this.secondaryHotspotObjects.forEach(obj => obj?.destroy?.());

    this.secondaryModeObjects = [];
    this.secondaryHelperObjects = [];
    this.secondaryHotspotObjects = [];
    this.secondaryMode = null;
    this.updateGarageNavState();
    this.secondaryPartRows = {};
    this.secondarySpriteImage = null;

    this.upgradeButtons.forEach(item => item.box.setInteractive({ useHandCursor: true }));
    this.thumbButtons.forEach(item => {
      const active = item.id === this.selectedCarId;
      item.box.setInteractive({ useHandCursor: true })
        .setFillStyle(active ? 0x10263a : 0x0b1724, 1)
        .setStrokeStyle(active ? 3 : 2, active ? 0x41dcff : 0x29465c, 1);
      item.label.setColor(active ? '#ffffff' : '#b8cad7');
      item.display?.forEach(obj => obj?.setAlpha?.(1));
    });
    this.saveButton?.setInteractive({ useHandCursor: true });
    this.meetButton?.setInteractive({ useHandCursor: true });
    this.selectUpgrade(null);

    this.refreshWorkshopSpecs();
  }

  refreshWorkshopSpecs() {
    if (!this.selectedCarId) return;
    const car = cars[this.selectedCarId];
    const carStates = this.registry.get('carStates') || {};
    const state = carStates[this.selectedCarId] || {};
    const fullBuild = buildDynoCar(this.selectedCarId, state) || (() => {
      const engineBuild = applyEngineTuning(car, engines[car.engine], state);
      return applySecondaryTuning(engineBuild.car, engineBuild.engine, state);
    })();

    const tunedPower = Number(fullBuild.car.powerKW ?? 0);
    const tunedTorque = Number(fullBuild.car.torqueNm ?? 0);
    const ratingDisplay = getPowerTorqueDisplay(car, state, fullBuild.car);
    const powerGain = Math.round(tunedPower - Number(car.powerKW || 0));
    const torqueGain = Math.round(tunedTorque - Number(car.torqueNm || 0));

    // Match selectCar(): exiting a tuning screen must not silently drop the
    // visible gain brackets even though the underlying tuned stats are correct.
    this.specValueTexts.power.setText(
      ratingDisplay.powerLabel +
      (!ratingDisplay.estimated && powerGain > 0 ? '  (+' + powerGain + ')' : '')
    );
    this.specValueTexts.torque.setText(
      ratingDisplay.torqueLabel +
      (!ratingDisplay.estimated && torqueGain > 0 ? '  (+' + torqueGain + ')' : '')
    );
    this.specValueTexts.weight.setText(Math.round(fullBuild.car.vehicleMassKg) + ' kg');
  }

  buildSecondaryHotspots(mode) {
    const isDrivetrain = mode === 'drivetrain';
    const parts = isDrivetrain ? DRIVETRAIN_TUNING_PARTS : EXHAUST_NOS_TUNING_PARTS;
    const layout = this.heroCarLayout || {
      frontWheelX: 930,
      rearWheelX: 500,
      wheelY: 430,
      left: 363,
      right: 1053,
    };

    const frontX = layout.frontWheelX;
    const rearX = layout.rearWheelX;
    const wheelY = layout.wheelY;
    const midX = (frontX + rearX) / 2;
    const clampX = value => Phaser.Math.Clamp(value, layout.left + 48, layout.right - 48);

    const hotspots = isDrivetrain
      ? {
          clutch: {
            x: clampX(frontX - 64),
            y: wheelY - 44,
            lx: clampX(frontX - 94),
            ly: wheelY - 112,
          },
          gearbox: {
            x: clampX(frontX - 154),
            y: wheelY - 14,
            lx: clampX(frontX - 178),
            ly: wheelY + 48,
          },
          differential: {
            x: clampX(rearX + 42),
            y: wheelY + 4,
            lx: clampX(rearX + 34),
            ly: wheelY + 66,
          },
          suspension: {
            x: clampX(rearX - 34),
            y: wheelY - 48,
            lx: clampX(rearX - 94),
            ly: wheelY - 108,
          },
        }
      : {
          headers: {
            x: clampX(frontX - 80),
            y: wheelY - 58,
            // Header label takes the former nitrous-shot side to uncross the callouts.
            lx: clampX(midX + 152),
            ly: wheelY - 106,
          },
          exhaust: {
            // Pull the mid-pipe marker toward the rear wheel, but keep its
            // label to the wheel's right so it stays clear of MUFFLER.
            x: clampX(rearX + 74),
            y: wheelY + 14,
            lx: clampX(rearX + 122),
            ly: wheelY + 74,
          },
          muffler: {
            x: clampX(rearX - 92),
            y: wheelY + 2,
            lx: clampX(rearX - 56),
            ly: wheelY + 58,
          },
          nosKit: {
            // Move the bottle marker distinctly left of its previous position.
            x: clampX(midX - 132),
            y: wheelY - 88,
            lx: clampX(midX - 164),
            ly: wheelY - 150,
          },
          nitrousShot: {
            x: clampX(midX + 54),
            y: wheelY - 62,
            // Swap label side with HEADERS so the two leader lines no longer cross.
            lx: clampX(frontX - 168),
            ly: wheelY - 136,
          },
        };

    Object.entries(hotspots).forEach(([partId, p]) => {
      const part = parts[partId];
      if (!part) return;

      const line = this.add.line(0, 0, p.x, p.y, p.lx, p.ly, 0x43dfff, 0.95)
        .setOrigin(0, 0)
        .setLineWidth(2)
        .setDepth(74);

      const dot = this.add.circle(p.x, p.y, 10, 0x07111d, 1)
        .setStrokeStyle(3, 0x43dfff, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(75);

      const width = Math.max(104, part.name.length * 12);
      const box = this.add.rectangle(p.lx, p.ly, width, 30, 0x07111d, 0.97)
        .setStrokeStyle(2, 0x43dfff, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(74);

      const label = this.add.text(p.lx, p.ly, part.name, {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#e7fbff',
      }).setOrigin(0.5).setDepth(75);

      const open = () => this.openSecondaryPartSelector(partId);
      dot.on('pointerdown', open);
      box.on('pointerdown', open);

      this.secondaryHotspotObjects.push(line, dot, box, label);
    });
  }

  addDaichiSecondaryHelper(mode) {
    const daichi = characters.daichiSakamoto;
    if (!daichi) return;

    if (mode === 'drivetrain') {
      // This is Daichi's original tuning pose and intentionally keeps the exact
      // former engine-helper placement.
      const drivetrainCfg = DAICHI_CFG.drivetrain;
      this.addDaichiTuningHelper({
        textureKey: daichi.visual.spriteKey,
        x: drivetrainCfg.x,
        feetY: drivetrainCfg.feetY,
        targetHeight: drivetrainCfg.targetHeight,
        depth: 8.4,
        anchorY: 1,
        shadowWidth: 74,
        shadowHeight: 22,
        objectList: this.secondaryHelperObjects,
      });
      return;
    }

    const layout = this.heroCarLayout;
    const car = cars[this.selectedCarId];
    if (!layout || !car) return;

    const wheelBottomY = this.getWheelBottomY(car, layout.bodyY, layout.targetWidth);

    // Exhaust/NOS uses the crouching inspection pose in front of the side of
    // the car. It is deliberately layered over the car, with its visible shoes
    // just below the wheel baseline.
    const exhaustCfg = DAICHI_CFG.exhaustNos;
    this.addDaichiTuningHelper({
      textureKey: 'daichiExhaustCrouch',
      x: layout.x,
      feetY: wheelBottomY + exhaustCfg.feetOffsetY,
      targetHeight: exhaustCfg.targetHeight,
      depth: 13.4,
      anchorY: 1365 / 1536,
      shadowWidth: 112,
      shadowHeight: 27,
      shadowOffsetX: 4,
      shadowOffsetY: -7,
      objectList: this.secondaryHelperObjects,
    });
  }

  addDaichiChassisHelper() {
    const layout = this.heroCarLayout;
    if (!layout) return;

    const chassisCfg = DAICHI_CFG.chassis;
    const x = Phaser.Math.Clamp(
      layout.frontWheelX + chassisCfg.frontWheelOffsetX,
      layout.x + chassisCfg.minFromCarCentre,
      STAGE.x + STAGE.w - chassisCfg.rightInset
    );

    this.addDaichiTuningHelper({
      textureKey: 'daichiChassisTools',
      x,
      // Chassis work reads better with Daichi behind the car rather than
      // standing over the foreground. Lift and shrink him so the car remains
      // the main subject while his tools/pose are still visible.
      feetY: chassisCfg.feetY,
      targetHeight: chassisCfg.targetHeight,
      depth: 9.4,
      anchorY: 1517 / 1536,
      useGarageCharacterShadow: false,
      shadowWidth: 86,
      shadowHeight: 20,
      shadowOffsetY: -6,
      objectList: this.chassisModeObjects,
    });
  }

  drawSecondarySchematic(mode) {
    const g = this.secondarySpriteGraphics;
    if (!g) return;
    g.clear();

    if (this.secondarySpriteImage) {
      this.secondarySpriteImage.destroy();
      this.secondarySpriteImage = null;
    }

    const car = cars[this.selectedCarId];
    const key = mode === 'drivetrain'
      ? car?.visual?.drivetrainKey
      : car?.visual?.exhaustNosKey;
    const cx = SIDE.x + SIDE.w - 92;
    const cy = SIDE.y + 105;

    if (key && this.textures.exists(key)) {
      this.secondarySpriteImage = this.add.image(cx, cy, key)
        .setDepth(74)
        .setOrigin(0.5);
      this.secondaryModeObjects.push(this.secondarySpriteImage);

      const source = this.textures.get(key).getSourceImage();
      const fit = Math.min(150 / source.width, 100 / source.height);
      this.secondarySpriteImage.setScale(fit);
      return;
    }

    if (mode === 'drivetrain') {
      g.lineStyle(5, 0x93aab8, 1);
      g.strokeRoundedRect(cx - 62, cy - 26, 92, 52, 8);
      g.lineBetween(cx - 86, cy, cx - 62, cy);
      g.lineBetween(cx + 30, cy, cx + 78, cy);
      g.fillStyle(0x5d6e79, 1).fillCircle(cx - 90, cy, 18);
      g.fillStyle(0x5d6e79, 1).fillCircle(cx + 82, cy, 18);
      g.fillStyle(0x263744, 1).fillCircle(cx + 4, cy, 18);
    } else {
      g.lineStyle(6, 0x8fa2ad, 1);
      g.lineBetween(cx - 78, cy + 14, cx + 18, cy + 14);
      g.strokeRoundedRect(cx + 18, cy - 7, 72, 42, 10);
      g.lineStyle(3, 0x48bde8, 1);
      g.strokeRoundedRect(cx - 62, cy - 48, 30, 62, 10);
      g.fillStyle(0x2d6ea5, 1).fillRoundedRect(cx - 58, cy - 44, 22, 54, 8);
      g.fillStyle(0xd6eef8, 1).fillRect(cx - 55, cy - 24, 16, 8);
    }
  }

  getPendingSecondaryCost() {
    if (!this.currentSecondaryTuning || !this.pendingSecondaryTuning || !this.secondaryMode) return 0;
    const baseCost = this.secondaryMode === 'drivetrain'
      ? getDrivetrainCartCost(this.currentSecondaryTuning, this.pendingSecondaryTuning)
      : getExhaustNosCartCost(this.currentSecondaryTuning, this.pendingSecondaryTuning);
    return this.getWorkshopAdjustedCost(baseCost);
  }

  refreshSecondaryTuningMode() {
    if (!this.secondaryMode || !this.selectedCarId) return;

    const isDrivetrain = this.secondaryMode === 'drivetrain';
    const parts = isDrivetrain ? DRIVETRAIN_TUNING_PARTS : EXHAUST_NOS_TUNING_PARTS;
    const car = cars[this.selectedCarId];
    const carStates = this.registry.get('carStates') || {};
    const state = carStates[this.selectedCarId] || {};
    const previewState = {
      ...state,
      ...(isDrivetrain
        ? { drivetrainTuning: this.pendingSecondaryTuning }
        : { exhaustNosTuning: this.pendingSecondaryTuning }),
    };

    const engineBuild = applyEngineTuning(car, engines[car.engine], previewState);
    const preview = applySecondaryTuning(engineBuild.car, engineBuild.engine, previewState);
    const previewRating = getPowerTorqueDisplay(
      car,
      { ...previewState, stock: false },
      preview.car
    );

    Object.entries(this.secondaryPartRows || {}).forEach(([partId, row]) => {
      const current = this.currentSecondaryTuning[partId];
      const pending = this.pendingSecondaryTuning[partId];
      const spec = parts[partId].levels[pending];

      row.level.setText(pending === current ? 'LV.' + current : 'LV.' + current + ' > ' + pending);
      row.level.setColor(pending > current ? '#55e4ff' : '#8db6cc');
      row.detail.setText(spec.name.toUpperCase());
      row.box.setStrokeStyle(
        pending > current ? 2 : 1,
        pending > current ? 0x43dfff : 0x315470,
        1
      );
    });

    if (isDrivetrain) {
      const base = cars[this.selectedCarId];
      const launchGain = Math.round((preview.car.launchLoadMultiplier / Math.max(0.01, base.launchLoadMultiplier || 1) - 1) * 100);
      const gripGain = Math.round((preview.car.tyreGrip / Math.max(0.01, base.tyreGrip || 1) - 1) * 100);
      const clutchGain = Math.round((preview.car.clutchStrength / Math.max(1, base.clutchStrength || 1) - 1) * 100);
      const shiftGain = Math.round((1 - (preview.car.shiftTimeScale || 1)) * 100);
      this.secondaryPreviewText?.setText(
        'LAUNCH   +' + Math.max(0, launchGain) + '%\n' +
        'SHIFT    ' + Math.max(0, shiftGain) + '% FASTER\n' +
        'GRIP     +' + Math.max(0, gripGain) + '%\n' +
        'CLUTCH   +' + Math.max(0, clutchGain) + '%'
      );
    } else {
      this.secondaryPreviewText?.setText(
        'POWER    ' + previewRating.powerLabel + '\n' +
        'NITROUS  ' + Number(preview.car.nosPower || 0) + ' hp\n' +
        'CAPACITY ' + Number(preview.car.nosCapacitySeconds || 0).toFixed(1) + ' sec\n' +
        'WEIGHT   ' + Math.round(preview.car.vehicleMassKg) + ' kg'
      );
    }

    const cash = Number(this.registry.get('cash') || 0);
    const cost = this.getPendingSecondaryCost();
    this.secondaryApplyButton?.removeAllListeners('pointerdown');

    if (cost <= 0) {
      this.secondaryApplyButton?.disableInteractive()
        .setFillStyle(0x102226, 1)
        .setStrokeStyle(2, 0x3e7f78, 0.7);
      this.secondaryApplyText?.setText('NO PARTS SELECTED').setColor('#758e94');
      return;
    }

    const affordable = cash >= cost;
    this.secondaryApplyButton?.setInteractive({ useHandCursor: true })
      .setFillStyle(affordable ? 0x0c2827 : 0x2a171b, 1)
      .setStrokeStyle(2, affordable ? 0x62e8c7 : 0xff6f7d, 1);

    this.secondaryApplyText?.setText(
      affordable
        ? 'INSTALL // ¥ ' + cost.toLocaleString('en-US')
        : 'NEED ¥ ' + cost.toLocaleString('en-US')
    ).setColor(affordable ? '#f1fffb' : '#ffc0c6');

    this.secondaryApplyButton?.on('pointerdown', () => this.applyPendingSecondaryUpgrades());
  }

  openSecondaryPartSelector(partId, previewLevel = null) {
    this.closeSecondaryPartSelector();
    const isDrivetrain = this.secondaryMode === 'drivetrain';
    const parts = isDrivetrain ? DRIVETRAIN_TUNING_PARTS : EXHAUST_NOS_TUNING_PARTS;
    const part = parts[partId];
    if (!part) return;

    const add = obj => {
      this.secondaryModalObjects.push(obj);
      return obj;
    };
    const depth = 120;
    const installed = Number(this.currentSecondaryTuning[partId] || 0);
    const pending = Number(this.pendingSecondaryTuning[partId] ?? installed);
    const draftLevel = Phaser.Math.Clamp(
      previewLevel == null ? pending : Number(previewLevel),
      installed,
      Math.max(installed, part.levels.length - 1)
    );
    const previewSpec = part.levels[draftLevel] || part.levels[installed];
    const car = cars[this.selectedCarId];
    const contextTextureKey = isDrivetrain
      ? car?.visual?.drivetrainKey
      : car?.visual?.exhaustNosKey;
    const category = isDrivetrain ? 'drivetrain' : 'exhaustNos';

    const blocker = add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.76)
      .setDepth(depth)
      .setInteractive());

    add(this.add.rectangle(780, 420, 1320, 680, 0x08131f, 1)
      .setStrokeStyle(2, 0x43dfff, 1)
      .setDepth(depth + 1));

    add(this.add.text(150, 112, part.name + ' // SELECT KIT', {
      fontFamily: PIXEL_FONT,
      fontSize: '13px',
      color: '#eefaff',
    }).setDepth(depth + 2));

    this.addModificationModalVisual(add, {
      textureKey: previewSpec?.spriteKey || contextTextureKey,
      title: previewSpec?.name?.toUpperCase() || part.name,
      subtitle: previewSpec?.benefit?.toUpperCase() || '',
      partName: isDrivetrain ? 'DRIVETRAIN' : 'EXHAUST / NOS',
      frameLabel: 'PREVIEW',
      mode: isDrivetrain ? 'drivetrain' : 'exhaustNos',
      depth,
    });

    part.levels.forEach((spec, index) => {
      const y = 230 + index * 120;
      const selected = draftLevel === spec.level;
      const availableHere =
        spec.level <= installed ||
        this.canInstallCurrentUpgrade(category, partId, spec.level);
      const selectable = spec.level >= installed && availableHere;
      const pathCost = this.getWorkshopAdjustedCost(
        isDrivetrain
          ? getDrivetrainUpgradePathCost(partId, installed, spec.level)
          : getExhaustNosUpgradePathCost(partId, installed, spec.level)
      );

      const box = add(this.add.rectangle(
        1040,
        y,
        720,
        100,
        selected ? 0x123047 : 0x0b1724,
        1
      ).setStrokeStyle(
        selected ? 2 : 1,
        selected ? 0x43dfff : 0x315470,
        1
      ).setDepth(depth + 2));

      this.addUpgradeRowSprite(add, spec, 745, y, depth);

      add(this.add.text(805, y - 22, 'LV.' + spec.level + '  ' + spec.name.toUpperCase(), {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: selectable ? '#eaf8ff' : '#5a6d79',
      }).setOrigin(0, 0.5).setDepth(depth + 3));

      add(this.add.text(805, y + 24, spec.benefit.toUpperCase(), {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: selectable ? '#8eafc1' : '#53636e',
        fontStyle: '600',
        wordWrap: { width: 390, useAdvancedWrap: true },
      }).setOrigin(0, 0.5).setDepth(depth + 3));

      let price = 'INSTALLED';
      if (spec.level > installed && availableHere) {
        price = '¥ ' + pathCost.toLocaleString('en-US');
      } else if (spec.level > installed && !availableHere) {
        price = 'NEEDS ' + this.getCurrentUpgradeRequirement(category, partId, spec.level);
      }
      if (spec.level < installed) price = 'INCLUDED';

      add(this.add.text(1365, y, price, {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: selected ? '#55e4ff' : selectable ? '#ffe08a' : '#61717b',
      }).setOrigin(1, 0.5).setDepth(depth + 3));

      if (selectable) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => {
          this.openSecondaryPartSelector(partId, spec.level);
        });
      }
    });

    const cancel = add(this.add.rectangle(1160, 124, 140, 44, 0x151d28, 1)
      .setStrokeStyle(1, 0x657d8c, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    add(this.add.text(1160, 124, 'CANCEL', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#c4d5df',
    }).setOrigin(0.5).setDepth(depth + 3));

    const confirm = add(this.add.rectangle(1320, 124, 150, 44, 0x0c2827, 1)
      .setStrokeStyle(2, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    add(this.add.text(
      1320,
      124,
      draftLevel === installed ? 'KEEP CURRENT' : 'ADD TO LIST',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#f1fffb',
      }
    ).setOrigin(0.5).setDepth(depth + 3));

    cancel.on('pointerdown', () => this.closeSecondaryPartSelector());
    confirm.on('pointerdown', () => {
      this.pendingSecondaryTuning[partId] = draftLevel;
      this.closeSecondaryPartSelector();
      this.refreshSecondaryTuningMode();
    });
  }

  closeSecondaryPartSelector() {
    this.secondaryModalObjects.forEach(obj => obj?.destroy?.());
    this.secondaryModalObjects = [];
  }

  applyPendingSecondaryUpgrades() {
    if (!this.secondaryMode) return;

    const category = this.secondaryMode === 'drivetrain' ? 'drivetrain' : 'exhaustNos';
    const partOrder = this.secondaryMode === 'drivetrain'
      ? DRIVETRAIN_PART_ORDER
      : EXHAUST_NOS_PART_ORDER;
    const blockedPart = partOrder.find(partId =>
      Number(this.pendingSecondaryTuning?.[partId] || 0) >
        Number(this.currentSecondaryTuning?.[partId] || 0) &&
      !this.canInstallCurrentUpgrade(
        category,
        partId,
        this.pendingSecondaryTuning?.[partId] || 0
      )
    );

    if (blockedPart) {
      const targetLevel = this.pendingSecondaryTuning?.[blockedPart] || 0;
      this.showWorkshopToast(
        'NEEDS ' + this.getCurrentUpgradeRequirement(category, blockedPart, targetLevel)
      );
      return;
    }

    const cost = this.getPendingSecondaryCost();
    if (cost <= 0) return;

    const cash = Number(this.registry.get('cash') || 0);
    if (cash < cost) {
      this.showWorkshopToast('NOT ENOUGH CASH');
      return;
    }

    const isDrivetrain = this.secondaryMode === 'drivetrain';
    const carStates = { ...(this.registry.get('carStates') || {}) };
    const existing = carStates[this.selectedCarId] || {};
    const tuning = isDrivetrain
      ? normaliseDrivetrainTuning(this.pendingSecondaryTuning)
      : normaliseExhaustNosTuning(this.pendingSecondaryTuning);

    const updated = {
      ...existing,
      stock: false,
      acquiredVia: existing.acquiredVia || 'garage',
      ...(isDrivetrain
        ? { drivetrainTuning: tuning }
        : { exhaustNosTuning: tuning }),
    };

    if (!isDrivetrain && tuning.nosKit > 0) {
      const kit = EXHAUST_NOS_TUNING_PARTS.nosKit.levels[tuning.nosKit];
      const shot = EXHAUST_NOS_TUNING_PARTS.nitrousShot.levels[tuning.nitrousShot];
      updated.nosInstalled = true;
      updated.nosCapacitySeconds = Number(kit.capacitySeconds || 0);
      updated.nosPower = Number(shot.powerHp || 0);
    }

    carStates[this.selectedCarId] = updated;
    this.registry.set('carStates', carStates);
    this.registry.set('cash', cash - cost);
    this.cashText?.setText('¥ ' + (cash - cost).toLocaleString('en-US'));
    saveSessionState(this.registry);

    this.currentSecondaryTuning = isDrivetrain
      ? getDrivetrainTuning(updated)
      : getExhaustNosTuning(updated);
    this.pendingSecondaryTuning = { ...this.currentSecondaryTuning };
    this.refreshSecondaryTuningMode();
    this.showWorkshopToast('DAICHI INSTALLED THE PARTS // ¥ ' + cost.toLocaleString('en-US'));
  }

  showWorkshopToast(message) {
    if (this.workshopToastObjects?.length) {
      this.workshopToastObjects.forEach(obj => obj?.destroy?.());
    }
    this.workshopToastObjects = [];

    const panel = this.add.rectangle(710, 600, 570, 44, 0x07131e, 0.98)
      .setStrokeStyle(2, 0x43dfff, 0.92)
      .setDepth(145);

    const text = this.add.text(710, 600, message, {
      fontFamily: PIXEL_FONT, fontSize: '7px', color: '#eefaff'
    }).setOrigin(0.5).setDepth(146);

    this.workshopToastObjects.push(panel, text);
    this.time.delayedCall(1450, () => {
      this.workshopToastObjects?.forEach(obj => obj?.destroy?.());
      this.workshopToastObjects = [];
    });
  }

  showTutorialCompletionChoice() {
    if (this.tutorialCompletionPopup?.active) return true;

    const depth = 190;
    const objects = [];
    const add = obj => {
      objects.push(obj);
      return obj;
    };

    const blocker = add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.70)
      .setDepth(depth)
      .setInteractive());

    const panel = add(this.add.rectangle(780, 410, 780, 380, 0xf8f7f2, 1)
      .setStrokeStyle(3, 0x18222b, 1)
      .setDepth(depth + 1));

    add(this.add.text(780, 292, 'YOU\'VE GOT IT', {
      fontFamily: PIXEL_FONT,
      fontSize: '18px',
      color: '#101820',
    }).setOrigin(0.5).setDepth(depth + 2));

    add(this.add.text(
      780,
      370,
      'You launched cleanly and shifted through 1st, 2nd and 3rd into 4th gear.\nWould you like to practise the controls again?',
      {
        fontFamily: BODY_FONT,
        fontSize: '13px',
        color: '#202a31',
        fontStyle: '700',
        align: 'center',
        lineSpacing: 7,
        wordWrap: { width: 640 },
      }
    ).setOrigin(0.5).setDepth(depth + 2));

    const again = add(this.add.rectangle(650, 510, 250, 56, 0xffffff, 1)
      .setStrokeStyle(3, 0x2f8f78, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));

    add(this.add.text(650, 510, 'TRY AGAIN', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#15372f',
    }).setOrigin(0.5).setDepth(depth + 3));

    const continueButton = add(this.add.rectangle(910, 510, 250, 56, 0xffffff, 1)
      .setStrokeStyle(3, 0x2b7898, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));

    add(this.add.text(910, 510, 'CONTINUE WITH DAICHI', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#173849',
    }).setOrigin(0.5).setDepth(depth + 3));

    const dismiss = () => {
      objects.forEach(obj => obj?.destroy?.());
      this.tutorialCompletionPopup = null;
    };

    blocker.on('pointerdown', () => {});

    again.on('pointerdown', () => {
      dismiss();
      this.time.delayedCall(80, () => this.startOpeningDrivingTutorial());
    });

    continueButton.on('pointerdown', () => {
      dismiss();
      this.time.delayedCall(100, () => this.runOpeningStoryIfNeeded());
    });

    this.tutorialCompletionPopup = panel;
    return true;
  }

  hasSeenStoryCutscene(id) {
    return (this.registry.get('cutscenesSeen') || []).map(String).includes(String(id));
  }

  isEthanYuenProfile() {
    const profileNameKey = (
      String(this.registry.get('firstName') || '').trim().toLowerCase() +
      String(this.registry.get('lastName') || '').trim().toLowerCase()
    ).replace(/[^a-z0-9]/g, '');
    return profileNameKey === 'ethanyuen';
  }

  showEthanYuenRewardIfNeeded() {
    const cutsceneId = 'ethanYuenEfCompensation';
    if (!this.isEthanYuenProfile() || this.hasSeenStoryCutscene(cutsceneId)) {
      return false;
    }

    const result = playMangaCutscene(this, cutsceneId, {
      onComplete: () => {
        const coupons = { ...(this.registry.get('carCoupons') || {}) };
        coupons.ef = Math.max(0, Math.floor(Number(coupons.ef || 0))) + 2;
        this.registry.set('carCoupons', coupons);
        saveSessionState(this.registry);
        this.time.delayedCall(180, () => this.continueGarageStoryFlow());
      },
    });

    return Boolean(result.played);
  }

  continueGarageStoryFlow() {
    if (this.showEthanYuenRewardIfNeeded()) return true;
    if (this.runOpeningStoryIfNeeded()) return true;
    return this.showCentralTokyoInvitationIfNeeded();
  }

  runOpeningStoryIfNeeded() {
    // Only introduce the origin story on a fresh run. Existing progressed
    // profiles are not interrupted by a retroactive tutorial.
    const racesRun =
      Number(this.registry.get('wins') || 0) +
      Number(this.registry.get('losses') || 0);
    const hasStartedOpening =
      this.hasSeenStoryCutscene('openingDaichiStory') ||
      Boolean(this.registry.get('introTutorialChoiceDone'));

    if (racesRun > 0 && !hasStartedOpening) return false;

    if (!this.hasSeenStoryCutscene('openingDaichiStory')) {
      const result = playMangaCutscene(this, 'openingDaichiStory', {
        onComplete: () => {
          this.time.delayedCall(120, () => this.showOpeningTutorialChoice());
        },
      });
      return Boolean(result.played);
    }

    if (!this.registry.get('introTutorialChoiceDone')) {
      this.showOpeningTutorialChoice();
      return true;
    }

    if (!this.hasSeenStoryCutscene('openingRaceRules')) {
      const result = playMangaCutscene(this, 'openingRaceRules', {
        onComplete: () => {
          this.time.delayedCall(140, () => this.runOpeningStoryIfNeeded());
        },
      });
      return Boolean(result.played);
    }

    if (!this.hasSeenStoryCutscene('openingWorkshopGuide')) {
      const result = playMangaCutscene(this, 'openingWorkshopGuide', {
        onComplete: () => {
          this.time.delayedCall(160, () => this.showCentralTokyoInvitationIfNeeded());
        },
      });
      return Boolean(result.played);
    }

    return false;
  }

  showOpeningTutorialChoice() {
    if (this.openingTutorialPopup?.active) return;

    const depth = 180;
    const objects = [];
    const add = obj => { objects.push(obj); return obj; };

    add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.74)
      .setDepth(depth).setInteractive());

    const panel = add(this.add.rectangle(780, 420, 800, 360, 0x08131f, 0.995)
      .setStrokeStyle(3, 0x45d7ff, 0.96).setDepth(depth + 1));

    add(this.add.text(780, 305, 'LEARN THE START?', {
      fontFamily: PIXEL_FONT, fontSize: '16px', color: '#eefaff'
    }).setOrigin(0.5).setDepth(depth + 2));

    add(this.add.text(
      780,
      375,
      'Run a consequence-free standing-start practice.\nDaichi will guide clutch, first gear, launch RPM and shifting on-screen.',
      {
        fontFamily: BODY_FONT,
        fontSize: '13px',
        color: '#bcd3df',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: 650 },
      }
    ).setOrigin(0.5).setDepth(depth + 2));

    const practice = add(this.add.rectangle(650, 510, 250, 50, 0x0d2b29, 1)
      .setStrokeStyle(2, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true }).setDepth(depth + 2));
    add(this.add.text(650, 510, 'PRACTICE RUN', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#effffb'
    }).setOrigin(0.5).setDepth(depth + 3));

    const skip = add(this.add.rectangle(910, 510, 250, 50, 0x171c25, 1)
      .setStrokeStyle(1, 0x61798a, 1)
      .setInteractive({ useHandCursor: true }).setDepth(depth + 2));
    add(this.add.text(910, 510, 'SKIP TUTORIAL', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#d0dde5'
    }).setOrigin(0.5).setDepth(depth + 3));

    const dismiss = () => {
      objects.forEach(obj => obj?.destroy?.());
      this.openingTutorialPopup = null;
    };

    practice.on('pointerdown', () => {
      dismiss();
      this.registry.set('introTutorialChoiceDone', true);
      saveSessionState(this.registry);
      this.startOpeningDrivingTutorial();
    });

    skip.on('pointerdown', () => {
      dismiss();
      this.registry.set('introTutorialChoiceDone', true);
      saveSessionState(this.registry);
      this.time.delayedCall(100, () => this.runOpeningStoryIfNeeded());
    });

    this.openingTutorialPopup = panel;
  }

  startOpeningDrivingTutorial() {
    const playerCarId =
      this.selectedCarId ||
      this.registry.get('selectedCarId') ||
      this.registry.get('starterCarId') ||
      'ae86';

    this.registry.set('selectedCarId', playerCarId);
    // Same-model practice is deliberate and also regression-tests that the race
    // handoff no longer substitutes a random rival car.
    this.registry.set('selectedOpponentCarId', playerCarId);
    this.registry.set('selectedOpponentPaintColor', 0xffffff);
    this.registry.set('selectedOpponentCharacterId', 'emiKanzaki');
    this.registry.set('selectedOpponentEncounterRating', 2);
    this.registry.set('selectedOpponentEncounterAi', null);
    this.registry.set('selectedOpponentDifficulty', 'EASY');
    this.registry.set('selectedRaceCategory', 'TUTORIAL');
    this.registry.set('selectedRaceType', 'Standing Start');
    this.registry.set('selectedRaceDistanceM', 402.336);
    this.registry.set('selectedRaceDeal', 'TUTORIAL');
    this.registry.set('selectedRaceStake', 0);
    this.registry.set('selectedRaceSpecialChallenge', false);
    this.registry.set('selectedRaceMeetOffer', null);
    this.registry.set('raceReturnScene', 'GarageScene');
    this.registry.set('raceTimeOfDay', getWorldPhase());
    this.registry.set('raceDistrict', 'ODAIBA');
    this.registry.set('raceLocationLabel', 'DAICHI PRACTICE RUN');
    saveSessionState(this.registry);
    this.scene.start('RaceScene');
  }

  showPendingWorkshopCutscene() {
    let cutsceneId = null;
    try {
      cutsceneId = sessionStorage.getItem('tokyoShiftPendingCutscene');
      if (cutsceneId) sessionStorage.removeItem('tokyoShiftPendingCutscene');
    } catch (e) {}

    if (!cutsceneId) return false;
    if (cutsceneId !== 'canalYardUnlocked' && cutsceneId !== 'warehouseHqUnlocked') {
      return false;
    }

    const result = playMangaCutscene(this, cutsceneId, {
      onComplete: () => {
        this.time.delayedCall(180, () => this.continueGarageStoryFlow());
      },
    });

    if (!result.played) {
      this.time.delayedCall(180, () => this.continueGarageStoryFlow());
    }
    return Boolean(result.played);
  }

  showCentralTokyoInvitationIfNeeded() {
    const inviteKey = getPendingCentralTokyoInvite(this.registry);
    if (!inviteKey) return false;

    const unlockInvite = () => {
      markCentralTokyoUnlocked(this.registry, inviteKey);
      saveSessionState(this.registry);
      this.time.delayedCall(180, () => this.showCentralTokyoInvitationIfNeeded());
    };

    let result = null;
    if (inviteKey === 'autoMarket') {
      // Central Tokyo itself is intentionally Workshop-gated: reaching the
      // win requirement only makes Daichi's conversation eligible.
      result = playMangaCutscene(this, 'centralTokyoUnlocked', {
        onComplete: unlockInvite,
      });
    } else if (inviteKey === 'ginza') {
      result = playMangaCutscene(this, 'ginzaInvitation', {
        characterOverrides: { HOST: 'sayakaFujieda' },
        variables: { HOST_NAME: 'SAYAKA FUJIEDA' },
        onComplete: unlockInvite,
      });
    } else if (inviteKey === 'drag') {
      result = playMangaCutscene(this, 'dragComplexInvitation', {
        characterOverrides: { PROMOTER: 'tetsuyaKanda' },
        variables: { PROMOTER_NAME: 'TETSUYA KANDA' },
        onComplete: unlockInvite,
      });
    }

    if (!result?.played && result?.reason === 'seen') {
      unlockInvite();
      return false;
    }

    return Boolean(result?.played);
  }

  selectUpgrade(name) {
    this.selectedUpgrade = name;

    if (this.selectedCarId && this.isSelectedCarTuningLocked()) {
      this.refreshTuningCategoryAvailability();
      return;
    }

    for (const item of this.upgradeButtons) {
      const active = item.name === name;
      item.box.setFillStyle(active ? 0x10283b : 0x0b1724, 1);
      item.box.setStrokeStyle(active ? 2 : 1, active ? 0x43dfff : 0x315470, 1);
      item.label.setColor(active ? '#ffffff' : '#a9c7da');
      item.arrow.setColor(active ? '#55e4ff' : '#8cb6cf');
    }
  }

  saveProfile() {
    this.registry.set('selectedCarId', this.selectedCarId);
    this.registry.set('ownedCarIds', this.ownedCarIds);
    saveSessionState(this.registry);

  }
}
