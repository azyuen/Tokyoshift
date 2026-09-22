import { cars, carOrder } from '../data/cars.js?v=20260922-r83';
import {
  DEFAULT_PAINT_COLOR,
  RIVAL_PAINT_COLORS,
  normalisePaintColor,
  getCarBodyTextureKey,
  createCarBodyLayers,
} from '../vehicles/CarAppearance.js?v=20260922-r83';
import { characters, characterOrder, rivalCharacterOrder } from '../data/characters.js?v=20260922-r111';
import {
  meetBackgrounds,
  MEET_LOCATIONS,
  LOCATION_ORDER_BY_REGION,
  ALL_MEET_LOCATION_IDS,
  getMeetLocation,
  getTravelCost,
  WORKSHOP_RETURN_COST,
} from '../data/meetAssets.js?v=20260922-r84';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';
import { saveSessionState } from '../state/GameState.js?v=20260922-r112';
import { addSettingsButton } from '../ui/SettingsPanel.js?v=20260922-r86';
import { showTravelMap } from '../ui/TravelMap.js?v=20260922-r98';
import { getGarageCapacity, getUnlockedWorkshops, getCarsInWorkshop, isWorkshopUnlocked } from '../data/workshopProgression.js?v=20260922-r98';
import {
  getEncounterProfile,
  getEncounterSkillLabel,
  getEncounterAi,
  boostAiForPinkSlip,
} from '../data/encounterProfiles.js?v=20260921-r76';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const STAGE = { x: 24, y: 92, w: 1138, h: 528 };
const GPS = { x: 1180, y: 92, w: 356, h: 140 };
const SIDE = { x: 1180, y: 248, w: 356, h: 568 };
const CARDS = { x: 24, y: 636, w: 1138, h: 180 };

const TAXI_TO_WORKSHOP_COST = 1000;

const MODE_DATA = {
  SINGLE: {
    label: 'SINGLE RACE',
    types: ['Standing Start', 'Roll Race'],
    distances: ['1/4 mile'],
  },
  COMPETITION: {
    label: 'COMPETITION',
    types: ['Night Cup', 'Quarter Mile', 'Eliminator'],
    distances: ['1/4 mile', '5.0 km', '3 rounds'],
  },
};

export default class MeetScene extends Phaser.Scene {
  constructor() { super('MeetScene'); }

  preload() {
    characterOrder.forEach(id => {
      const character = characters[id];
      if (!this.textures.exists(character.visual.spriteKey)) {
        this.load.image(character.visual.spriteKey, character.visual.path + '?v=20260921-r43');
      }
    });

    meetBackgrounds.forEach(bg => {
      if (bg.path && !this.textures.exists(bg.key)) {
        this.load.image(bg.key, bg.path + '?v=20260922-r84');
      }
    });
  }

  create() {
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
    this.specialChallengeObjects = [];

    const storedRefreshAt = Number(this.registry.get('meetRefreshAt') || 0);
    const storedRosters = this.registry.get('meetRosters') || {};
    const storedOffers = Object.values(storedRosters)
      .filter(Array.isArray)
      .flat();
    const hasEncounterProgression = storedOffers.length > 0
      && storedOffers.every(offer => Number.isFinite(offer?.encounterRating) && offer?.encounterAi);
    const hasStoredRound = storedRefreshAt > Date.now()
      && hasEncounterProgression
      && ALL_MEET_LOCATION_IDS.some(id => Array.isArray(storedRosters[id]));

    if (hasStoredRound) {
      this.nextRefreshAt = storedRefreshAt;
      const defeated = new Set(this.registry.get('defeatedRivalKeys') || []);

      ALL_MEET_LOCATION_IDS.forEach(locationId => {
        const stored = Array.isArray(storedRosters[locationId])
          ? storedRosters[locationId]
          : this.generateOffersForLocation(locationId);

        this.locationOffers[locationId] = stored
          .filter(offer =>
            rivalCharacterOrder.includes(offer?.characterId) &&
            !defeated.has(locationId + ':' + offer.characterId)
          )
          .map(offer => ({ ...offer }));
        this.locationSelectedOfferIndex[locationId] = 0;
      });
    } else {
      this.nextRefreshAt = Date.now() + 180000;
      this.registry.set('defeatedRivalKeys', []);
      this.refreshAllLocationOffers({ resetTimer: false, persist: false });
      this.persistMeetRound();
    }

    this.drawBase();
    this.buildHeader();
    this.buildGpsPanel();
    this.buildSidebar();
    this.buildBottomArea();
    this.rollOffers({ resetTimer: false });

    const activeChallenger = this.registry.get('specialChallenger');
    if (
      activeChallenger?.active &&
      activeChallenger.locationId === this.selectedMeetLocation &&
      this.hasCar
    ) {
      this.time.delayedCall(80, () => this.showSpecialChallenger(activeChallenger, false));
    }

    // Let the visible Meet render first, then quietly fetch the rest of the
    // character/background library and the heavy race-control artwork.
    this.time.delayedCall(120, () => this.prefetchDeferredAssets());

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.updateRefreshTimer(),
    });
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

  setMeetBackground(preferredKey = null, labelOverride = null) {
    if (this.currentBackground) this.currentBackground.destroy();
    if (this.backgroundMaskShape) this.backgroundMaskShape.destroy();
    if (this.backgroundTint) this.backgroundTint.destroy();

    const available = meetBackgrounds.filter(bg => this.textures.exists(bg.key));
    const bg = available.find(item => item.key === preferredKey) || available[0];
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
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#8bbde0'
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

    addSettingsButton(this, 955, 35);

    this.cashText = this.add.text(1512, 35, '¥ ' + Number(cash).toLocaleString('en-US'), {
      fontFamily: PIXEL_FONT, fontSize: '15px', color: '#ffe08a'
    }).setOrigin(1, 0.5).setDepth(42);
  }

  buildGpsPanel() {
    this.gpsPanel = this.add.rectangle(
      GPS.x + GPS.w / 2,
      GPS.y + GPS.h / 2,
      GPS.w,
      GPS.h,
      0x07111d,
      0.98
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(35);

    this.add.text(GPS.x + 20, GPS.y + 14, 'GPS', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#8cc8ec'
    }).setDepth(37);

    this.gpsLocationText = this.add.text(
      GPS.x + GPS.w - 20,
      GPS.y + 16,
      '',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#dff7ff',
      }
    ).setOrigin(1, 0).setDepth(37);

    this.gpsMetaText = this.add.text(
      GPS.x + 20,
      GPS.y + 52,
      '',
      {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: '#7896a9',
        fontStyle: '600',
      }
    ).setDepth(37);

    this.gpsTravelButton = this.add.rectangle(
      GPS.x + GPS.w / 2,
      GPS.y + 105,
      GPS.w - 40,
      38,
      0x0b1724,
      1
    ).setStrokeStyle(1, 0x315470, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(37);

    this.add.text(
      GPS.x + GPS.w / 2,
      GPS.y + 105,
      this.hasCar ? 'GO SOMEWHERE ELSE  >' : 'NO CAR // CAN\'T DRIVE',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#dff7ff',
      }
    ).setOrigin(0.5).setDepth(38);

    this.gpsTravelButton.on('pointerdown', () => this.showDistrictPopup());
    if (!this.hasCar) {
      this.gpsTravelButton.disableInteractive()
        .setFillStyle(0x10151b, 1)
        .setStrokeStyle(1, 0x46545e, 1);
    }
    this.updateGpsPanel();
  }

  updateGpsPanel() {
    const current = getMeetLocation(this.selectedMeetLocation);
    this.gpsLocationText?.setText(current.district + ' // ' + current.label);
    this.gpsMetaText?.setText(
      current.timeOfDay.toUpperCase() + '  •  ' + current.difficulty
    );
  }

  travelToLocation(locationId, suppliedCost = null) {
    if (!this.hasCar) return false;
    if (!MEET_LOCATIONS[locationId]) return false;

    const travelCost = suppliedCost == null
      ? getTravelCost(this.selectedMeetLocation, locationId)
      : Number(suppliedCost || 0);
    const cash = Number(this.registry.get('cash') || 0);
    if (cash < travelCost) return false;

    if (locationId !== this.selectedMeetLocation) {
      this.locationSelectedOfferIndex[this.selectedMeetLocation] = this.selectedOfferIndex;
      this.registry.set('cash', cash - travelCost);
      this.selectedMeetLocation = locationId;

      const destination = getMeetLocation(locationId);
      this.registry.set('meetLocation', locationId);
      this.registry.set('district', destination.district);

      this.cashText?.setText('¥ ' + Number(cash - travelCost).toLocaleString('en-US'));
      this.updateWorkshopButton();
      this.showTravelNotice(destination, travelCost);

      // Travel changes the location only. The current round stays intact.
      this.rollOffers({ resetTimer: false });
      this.persistMeetRound();
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

    this.add.text(SIDE.x + 20, 266, 'RACE MODE', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#8cc8ec'
    }).setDepth(37);

    const storedCompetition =
      (this.registry.get('competitionOffers') || {})[this.selectedMeetLocation];
    const storedCompetitionExpired =
      Boolean(storedCompetition) &&
      Number(storedCompetition.refreshAt || 0) <= Date.now();
    const competitionUsed =
      Boolean(storedCompetition?.used) &&
      !storedCompetitionExpired;
    const competitionCooldownRemaining =
      Math.max(
        0,
        Number(this.registry.get('competitionCooldownUntil') || 0) - Date.now()
      );
    const competitionOnCooldown = competitionCooldownRemaining > 0;
    const competitionUnlocked =
      this.hasCar &&
      Number(this.registry.get('wins') || 0) >= 1 &&
      !competitionUsed &&
      !competitionOnCooldown;

    const competitionLabel = competitionOnCooldown
      ? 'COOLDOWN // ' + this.formatCompetitionCooldown(competitionCooldownRemaining)
      : competitionUsed
        ? 'COMPETITION // NEXT OFFER'
        : competitionUnlocked
          ? 'COMPETITION'
          : 'COMPETITION // WIN 1 RACE';

    const buttons = [
      ['SINGLE RACE', 'SINGLE', false],
      [
        competitionLabel,
        'COMPETITION',
        !competitionUnlocked,
      ],
    ];

    this.modeButtons = [];
    buttons.forEach((row, i) => {
      const y = 326 + i * 50;
      const locked = row[2];
      const box = this.add.rectangle(
        SIDE.x + SIDE.w / 2,
        y,
        SIDE.w - 36,
        40,
        locked ? 0x0a1017 : 0x10283b,
        1
      ).setStrokeStyle(locked ? 1 : 2, locked ? 0x29343d : 0x43dfff, 1)
        .setDepth(37);

      const label = this.add.text(SIDE.x + 24, y, row[0], {
        fontFamily: PIXEL_FONT,
        fontSize: locked ? '7px' : '10px',
        color: locked ? '#53626c' : '#ffffff'
      }).setOrigin(0, 0.5).setDepth(38);

      if (!locked && row[1] === 'COMPETITION') {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => this.showCompetitionPopup());
      }

      this.modeButtons.push({ key: row[1], box, label, locked });
    });

    this.add.text(SIDE.x + 20, 430, 'SELECTED RIVAL', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#8cc8ec'
    }).setDepth(37);

    this.selectedSummary = this.add.text(SIDE.x + 20, 458, '', {
      fontFamily: BODY_FONT,
      fontSize: '13px',
      color: '#d8e7ef',
      lineSpacing: 1,
      wordWrap: { width: SIDE.w - 40 },
    }).setDepth(37);

    this.add.text(SIDE.x + 20, 536, 'RIVAL OFFER', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#8cc8ec'
    }).setDepth(37);

    this.rivalOfferText = this.add.text(SIDE.x + SIDE.w - 20, 536, '', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#ffe08a'
    }).setOrigin(1, 0).setDepth(37);

    this.pinkSlipButton = this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      584,
      SIDE.w - 36,
      40,
      0x291620,
      1
    ).setStrokeStyle(2, 0xff5f93, 0.9)
      .setInteractive({ useHandCursor: true })
      .setDepth(37);

    this.pinkSlipButtonLabel = this.add.text(
      SIDE.x + SIDE.w / 2,
      584,
      'PINK SLIPS?',
      {
        fontFamily: PIXEL_FONT, fontSize: '9px', color: '#ffdce8'
      }
    ).setOrigin(0.5).setDepth(38);

    this.pinkResponseText = this.add.text(
      SIDE.x + SIDE.w / 2,
      615,
      '',
      {
        fontFamily: BODY_FONT,
        fontSize: '11px',
        color: '#91a9b7',
        wordWrap: { width: SIDE.w - 40 },
        align: 'center',
      }
    ).setOrigin(0.5, 0).setDepth(38);

    this.pinkSlipButton.on('pointerdown', () => this.challengePinkSlips());

    // Keep the action buttons aligned with the padded bottom margin.
    this.raceButton = this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      782,
      SIDE.w - 36,
      42,
      0x0b2826,
      1
    ).setStrokeStyle(2, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(38);

    this.raceButtonLabel = this.add.text(
      SIDE.x + SIDE.w / 2,
      782,
      'RACE  >',
      {
        fontFamily: PIXEL_FONT, fontSize: '10px', color: '#f1fffb'
      }
    ).setOrigin(0.5).setDepth(39);

    this.raceButton.on('pointerdown', () => this.startSelectedRace());

  }

  updateWorkshopButton() {
    // Meet navigation is map-only. Kept as a no-op for older refresh paths.
  }

  returnToWorkshop(workshopLocationId = 'shinonomeWorkshop', requestedCost = null) {
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
    this.rivalsTitleText = this.add.text(CARDS.x + 18, CARDS.y + 10, 'RIVALS', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#a7d5ef'
    }).setDepth(33);
  }

  getEventCarBand(rating = 3) {
    const bands = {
      1: ['ae86', 'ek9'],
      2: ['ae86', 'ek9', 'fc3s'],
      3: ['ek9', 'fc3s', 'evo3'],
      4: ['fc3s', 'evo3', 'wrx22b', 'r32'],
      5: ['evo3', 'wrx22b', 'r32'],
    };
    return bands[Phaser.Math.Clamp(Math.round(Number(rating) || 3), 1, 5)] || bands[3];
  }

  chooseEventCar(rating = 3, { preferUnowned = true, exclude = [] } = {}) {
    const owned = this.registry.get('ownedCarIds') || [];
    const selected = this.registry.get('selectedCarId');
    const blocked = new Set(exclude);
    const band = this.getEventCarBand(rating);

    const tiers = [
      preferUnowned
        ? band.filter(id => cars[id] && id !== selected && !owned.includes(id) && !blocked.has(id))
        : [],
      band.filter(id => cars[id] && id !== selected && !blocked.has(id)),
      carOrder.filter(id => cars[id] && id !== selected && !owned.includes(id) && !blocked.has(id)),
      carOrder.filter(id => cars[id] && id !== selected && !blocked.has(id)),
    ].filter(list => list.length);

    return Phaser.Utils.Array.GetRandom(tiers[0] || ['ek9']);
  }

  chooseEventCharacter(rating = 3, exclude = []) {
    const playerId = this.registry.get('playerCharacterId') || 'renMizuno';
    const blocked = new Set([playerId, ...exclude]);

    const candidates = rivalCharacterOrder
      .filter(id => !blocked.has(id) && characters[id])
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

    const encounterRating = Phaser.Utils.Array.GetRandom(profile.ratingSlots);
    const characterId = this.chooseEventCharacter(encounterRating);
    const carId = this.chooseEventCar(encounterRating, { preferUnowned: true });

    return {
      active: true,
      locationId: this.selectedMeetLocation,
      characterId,
      carId,
      paintColor: Phaser.Utils.Array.GetRandom(RIVAL_PAINT_COLORS),
      encounterRating,
      encounterAi: boostAiForPinkSlip(getEncounterAi(encounterRating)),
      skillRange: this.getDisplayedSkillRange(encounterRating),
      raceType: Phaser.Utils.Array.GetRandom(['Standing Start', 'Roll Race']),
      difficulty: profile.difficulty,
      quote: 'Keys for keys. Right now.',
      createdAt: Date.now(),
    };
  }

  maybeGenerateSpecialChallenger() {
    if (!this.hasCar) return null;

    const existing = this.registry.get('specialChallenger');
    if (existing?.active) return existing;

    let cooldown = Math.max(0, Number(this.registry.get('challengerCooldown') || 0));
    let misses = Math.max(0, Number(this.registry.get('challengerMisses') || 0));

    if (cooldown > 0) {
      this.registry.set('challengerCooldown', cooldown - 1);
      saveSessionState(this.registry);
      return null;
    }

    // 24% base chance; each miss raises the odds. The fourth eligible refresh
    // is guaranteed so the player can never go indefinitely without seeing one.
    const chance = misses >= 3 ? 1 : 0.24 + misses * 0.12;
    if (Phaser.Math.FloatBetween(0, 1) > chance) {
      this.registry.set('challengerMisses', misses + 1);
      saveSessionState(this.registry);
      return null;
    }

    const challenger = this.generateSpecialChallenger();
    if (!challenger) return null;

    this.registry.set('specialChallenger', challenger);
    this.registry.set('challengerMisses', 0);
    this.registry.set('challengerCooldown', 2);
    saveSessionState(this.registry);
    return challenger;
  }

  clearSpecialChallengeObjects() {
    (this.specialChallengeObjects || []).forEach(obj => obj?.destroy?.());
    this.specialChallengeObjects = [];
  }

  restoreMeetActionListeners() {
    this.pinkSlipButton?.removeAllListeners('pointerdown');
    this.pinkSlipButton?.on('pointerdown', () => this.challengePinkSlips());

    this.raceButton?.removeAllListeners('pointerdown');
    this.raceButton?.on('pointerdown', () => this.startSelectedRace());

    if (this.hasCar) {
      this.gpsTravelButton?.setInteractive({ useHandCursor: true });
    }

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

    this.specialChallengeActive = true;
    this.clearCardObjects();
    this.clearStageObjects();
    this.clearSpecialChallengeObjects();
    this.gpsTravelButton?.disableInteractive();

    this.modeButtons?.forEach(item => item.box.disableInteractive());

    const character = characters[challenger.characterId];
    const car = cars[challenger.carId];
    if (!character || !car) return;

    const startX = animate ? STAGE.x + STAGE.w + 390 : 640;
    const finalX = 640;
    const carObjects = this.createCarDisplay(
      car,
      startX,
      448,
      690,
      28,
      false,
      normalisePaintColor(challenger.paintColor, DEFAULT_PAINT_COLOR)
    );

    carObjects.forEach(obj => {
      obj.setMask(this.stageMask);
      this.specialChallengeObjects.push(obj);
    });

    if (animate) {
      const dx = finalX - startX;
      this.tweens.add({
        targets: carObjects,
        x: '+=' + dx,
        duration: 760,
        ease: 'Cubic.easeOut',
      });
    }

    const source = this.textures.get(character.visual.spriteKey).getSourceImage();
    const driver = this.add.image(920, 590, character.visual.spriteKey)
      .setOrigin(0.5, 1)
      .setDepth(36)
      .setMask(this.stageMask)
      .setAlpha(animate ? 0 : 1);
    driver.setScale(280 / source.height);
    this.specialChallengeObjects.push(driver);

    if (animate) {
      this.time.delayedCall(360, () => {
        this.tweens.add({
          targets: driver,
          alpha: 1,
          duration: 360,
          ease: 'Sine.easeOut',
        });
      });
    }

    const banner = this.add.text(
      STAGE.x + STAGE.w / 2,
      STAGE.y + 34,
      'SPECIAL CHALLENGER // PINK SLIPS',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '12px',
        color: '#fff1f7',
        backgroundColor: '#431426e8',
        padding: { x: 18, y: 10 },
      }
    ).setOrigin(0.5)
      .setDepth(74)
      .setMask(this.stageMask);
    this.specialChallengeObjects.push(banner);

    const card = this.add.rectangle(
      CARDS.x + CARDS.w / 2,
      CARDS.y + CARDS.h / 2,
      CARDS.w - 36,
      132,
      0x130b14,
      0.98
    ).setStrokeStyle(3, 0xff5f93, 0.92).setDepth(34);

    const portraitBg = this.add.rectangle(190, 746, 108, 108, 0x15101a, 1)
      .setStrokeStyle(2, 0xff739e, 0.92).setDepth(35);

    const portrait = this.add.image(190, 690, character.visual.spriteKey)
      .setOrigin(0.5, 0)
      .setDepth(36);
    portrait.setScale(420 / source.height);

    const portraitMask = this.make.graphics({ add: false });
    portraitMask.fillStyle(0xffffff, 1);
    portraitMask.fillRect(136, 692, 108, 108);
    portrait.setMask(portraitMask.createGeometryMask());

    const name = this.add.text(275, 705, character.name.toUpperCase(), {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#ffffff'
    }).setDepth(36);

    const details = this.add.text(
      275,
      739,
      car.shortName + '  //  EST. ' + challenger.skillRange +
        '\n“' + challenger.quote + '”',
      {
        fontFamily: BODY_FONT,
        fontSize: '13px',
        color: '#d8cad1',
        lineSpacing: 5,
      }
    ).setDepth(36);

    this.specialChallengeObjects.push(card, portraitBg, portrait, name, details);

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
  }

  declineSpecialChallenger() {
    this.registry.set('specialChallenger', null);
    saveSessionState(this.registry);
    this.specialChallengeActive = false;
    this.clearSpecialChallengeObjects();
    this.restoreMeetActionListeners();
    this.rollOffers({ resetTimer: false });
  }

  startSpecialChallengerRace() {
    const challenger = this.registry.get('specialChallenger');
    if (!challenger?.active || !this.hasCar) return;

    this.registry.set('selectedOpponentCarId', challenger.carId);
    this.registry.set('selectedOpponentPaintColor', normalisePaintColor(
      challenger.paintColor,
      DEFAULT_PAINT_COLOR
    ));
    this.registry.set('selectedOpponentCharacterId', challenger.characterId);
    this.registry.set('selectedOpponentEncounterRating', challenger.encounterRating);
    this.registry.set('selectedOpponentEncounterAi', challenger.encounterAi);
    this.registry.set('selectedOpponentDifficulty', challenger.difficulty);
    this.registry.set('selectedRaceCategory', 'SINGLE');
    this.registry.set('selectedRaceType', challenger.raceType);
    this.registry.set('selectedRaceDeal', 'PINK_SLIP');
    this.registry.set('selectedRaceStake', 0);
    this.registry.set('selectedRaceSpecialChallenge', true);

    const location = getMeetLocation(this.selectedMeetLocation);
    this.registry.set('raceTimeOfDay', location.timeOfDay);
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
    return this.registry.get('devMode')
      ? 15 * 60 * 1000
      : 2 * 60 * 60 * 1000;
  }

  getCompetitionCooldownRemainingMs() {
    return Math.max(
      0,
      Number(this.registry.get('competitionCooldownUntil') || 0) - Date.now()
    );
  }

  formatCompetitionCooldown(ms = 0) {
    const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
    if (totalMinutes < 60) return totalMinutes + 'M';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours + 'H' + (minutes ? ' ' + minutes + 'M' : '');
  }

  generateCompetitionOffer() {
    const location = getMeetLocation(this.selectedMeetLocation);
    const profile = getEncounterProfile(this.selectedMeetLocation, location.difficulty);
    const difficulty = profile.difficulty || 'MED';

    const settings = {
      EASY: { entryFee: 2500, cashPrize: 20000, ratings: [2, 2, 3] },
      MED: { entryFee: 4000, cashPrize: 32000, ratings: [2, 3, 4] },
      HARD: { entryFee: 6500, cashPrize: 48000, ratings: [3, 4, 5] },
      ELITE: { entryFee: 9000, cashPrize: 70000, ratings: [4, 5, 5] },
    }[difficulty] || { entryFee: 4000, cashPrize: 32000, ratings: [2, 3, 4] };

    const owned = this.registry.get('ownedCarIds') || [];
    const capacity = getGarageCapacity(this.registry.get('garageTier') || 0);
    const canWinCar = owned.length < capacity;
    const preferCarPrize = canWinCar && Phaser.Math.FloatBetween(0, 1) < (owned.length <= 1 ? 0.48 : 0.36);

    const usedCharacters = [];
    const usedCars = [];
    const rounds = settings.ratings.map((rating, index) => {
      const characterId = this.chooseEventCharacter(rating, usedCharacters);
      usedCharacters.push(characterId);

      const carId = this.chooseEventCar(rating, {
        preferUnowned: index === 2,
        exclude: usedCars,
      });
      usedCars.push(carId);

      return {
        characterId,
        carId,
        paintColor: Phaser.Utils.Array.GetRandom(RIVAL_PAINT_COLORS),
        encounterRating: rating,
        encounterAi: getEncounterAi(rating),
        skillLabel: getEncounterSkillLabel(rating),
        raceType: Phaser.Utils.Array.GetRandom(['Standing Start', 'Roll Race']),
      };
    });

    let prizeType = 'CASH';
    let prizeCarId = null;

    if (preferCarPrize) {
      const finalRating = settings.ratings[2];
      const candidate = this.chooseEventCar(finalRating, { preferUnowned: true });
      if (candidate && !owned.includes(candidate)) {
        prizeType = 'CAR';
        prizeCarId = candidate;
        rounds[2].carId = candidate;
      }
    }

    return {
      id: this.selectedMeetLocation + ':' + Date.now(),
      locationId: this.selectedMeetLocation,
      difficulty,
      entryFee: settings.entryFee,
      prizeType,
      prizeCash: settings.cashPrize,
      prizeCarId,
      rounds,
      refreshAt: Date.now() + this.getCompetitionOfferLifetimeMs(),
      used: false,
    };
  }

  getCompetitionOffer() {
    const offers = { ...(this.registry.get('competitionOffers') || {}) };
    const current = offers[this.selectedMeetLocation];
    const expired = !current || Number(current.refreshAt || 0) <= Date.now();

    if (expired) {
      offers[this.selectedMeetLocation] = this.generateCompetitionOffer();
      this.registry.set('competitionOffers', offers);
      saveSessionState(this.registry);
    }

    return offers[this.selectedMeetLocation];
  }

  showCompetitionPopup() {
    if (this.specialChallengeActive || !this.hasCar) return;
    if (Number(this.registry.get('wins') || 0) < 1) return;
    if (this.competitionPopup?.active) return;

    const offer = this.getCompetitionOffer();
    const cooldownRemaining = this.getCompetitionCooldownRemainingMs();
    if (cooldownRemaining > 0 || offer.used) return;

    const cash = Number(this.registry.get('cash') || 0);
    const enough = cash >= offer.entryFee;
    const prizeText = offer.prizeType === 'CAR'
      ? cars[offer.prizeCarId].shortName
      : '¥' + offer.prizeCash.toLocaleString('en-US');

    const depth = 120;
    const objects = [];
    const add = obj => { objects.push(obj); return obj; };

    const blocker = add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.72)
      .setDepth(depth).setInteractive());

    const panel = add(this.add.rectangle(780, 420, 780, 540, 0x07111d, 0.995)
      .setStrokeStyle(3, 0x45d7ff, 0.95).setDepth(depth + 1));

    add(this.add.text(780, 192, 'COMPETITION // STREET THREE', {
      fontFamily: PIXEL_FONT, fontSize: '15px', color: '#eefaff'
    }).setOrigin(0.5).setDepth(depth + 2));

    add(this.add.text(780, 235, 'WIN ALL THREE RACES IN A ROW', {
      fontFamily: BODY_FONT, fontSize: '13px', color: '#8faabb', fontStyle: '600'
    }).setOrigin(0.5).setDepth(depth + 2));

    add(this.add.text(535, 292, 'ENTRY', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#8cc8ec'
    }).setOrigin(0.5).setDepth(depth + 2));

    add(this.add.text(535, 326, '¥' + offer.entryFee.toLocaleString('en-US'), {
      fontFamily: PIXEL_FONT, fontSize: '13px', color: '#ffe08a'
    }).setOrigin(0.5).setDepth(depth + 2));

    add(this.add.text(1025, 292, 'GRAND PRIZE', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#8cc8ec'
    }).setOrigin(0.5).setDepth(depth + 2));

    add(this.add.text(1025, 326, prizeText, {
      fontFamily: PIXEL_FONT,
      fontSize: offer.prizeType === 'CAR' ? '11px' : '13px',
      color: offer.prizeType === 'CAR' ? '#ff9fc7' : '#73f5a5'
    }).setOrigin(0.5).setDepth(depth + 2));

    offer.rounds.forEach((round, i) => {
      const y = 395 + i * 54;
      add(this.add.text(470, y, 'ROUND ' + (i + 1), {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#718fa3'
      }).setOrigin(0, 0.5).setDepth(depth + 2));

      add(this.add.text(650, y, round.skillLabel, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#d9edf7'
      }).setOrigin(0, 0.5).setDepth(depth + 2));

      add(this.add.text(1040, y, cars[round.carId].shortName, {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: i === 2 && offer.prizeType === 'CAR' ? '#ff9fc7' : '#9db7c8'
      }).setOrigin(1, 0.5).setDepth(depth + 2));
    });

    add(this.add.text(780, 565, 'NO TUNING OR CAR CHANGES BETWEEN ROUNDS', {
      fontFamily: PIXEL_FONT, fontSize: '7px', color: '#8fa0aa'
    }).setOrigin(0.5).setDepth(depth + 2));

    const enter = add(this.add.rectangle(665, 625, 260, 48, enough ? 0x0d2b29 : 0x24161a, 1)
      .setStrokeStyle(2, enough ? 0x62e8c7 : 0x7a4652, 1)
      .setDepth(depth + 2));

    const enterText = add(this.add.text(
      665,
      625,
      enough ? 'ENTER // ¥' + offer.entryFee.toLocaleString('en-US') : 'NEED MORE CASH',
      {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: enough ? '#f1fffb' : '#b1848f'
      }
    ).setOrigin(0.5).setDepth(depth + 3));

    const close = add(this.add.rectangle(895, 625, 170, 48, 0x171c25, 1)
      .setStrokeStyle(1, 0x516a7b, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));

    add(this.add.text(895, 625, 'CLOSE', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#c7d5de'
    }).setOrigin(0.5).setDepth(depth + 3));

    const dismiss = () => {
      objects.forEach(obj => obj?.destroy?.());
      this.competitionPopup = null;
    };

    blocker.on('pointerdown', dismiss);
    close.on('pointerdown', dismiss);

    if (enough) {
      enter.setInteractive({ useHandCursor: true });
      enter.on('pointerdown', () => {
        dismiss();
        this.startCompetition(offer);
      });
    }

    this.competitionPopup = panel;
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
    this.registry.set('selectedRaceCategory', 'COMPETITION');
    this.registry.set('selectedRaceType', round.raceType);
    this.registry.set('selectedRaceDeal', 'COMPETITION');
    this.registry.set('selectedRaceStake', 0);
    this.registry.set('selectedRaceSpecialChallenge', false);

    const location = getMeetLocation(state.locationId);
    this.registry.set('raceTimeOfDay', location.timeOfDay);
    this.registry.set('raceDistrict', location.district);
    this.registry.set('raceLocationLabel', location.label);
    return true;
  }

  startCompetition(offer) {
    if (!offer || !this.hasCar) return;

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
      prizeCarId: offer.prizeCarId,
      rounds: offer.rounds,
      roundIndex: 0,
    };

    const competitionOffers = { ...(this.registry.get('competitionOffers') || {}) };
    competitionOffers[offer.locationId] = { ...offer, used: true };

    this.registry.set('cash', cash - offer.entryFee);
    this.registry.set('competitionOffers', competitionOffers);
    this.registry.set(
      'competitionCooldownUntil',
      Date.now() + this.getCompetitionCooldownMs()
    );
    this.registry.set('competitionState', state);
    this.cashText?.setText('¥ ' + Number(cash - offer.entryFee).toLocaleString('en-US'));

    if (!this.configureCompetitionRound(state, 0)) return;
    saveSessionState(this.registry);
    this.scene.start('RaceScene');
  }

  refreshAllLocationOffers({ resetTimer = true, persist = true } = {}) {
    this.locationOffers = {};
    this.locationSelectedOfferIndex = {};
    this.registry.set('defeatedRivalKeys', []);

    ALL_MEET_LOCATION_IDS.forEach(locationId => {
      this.locationOffers[locationId] = this.generateOffersForLocation(locationId);
      this.locationSelectedOfferIndex[locationId] = 0;
    });

    if (resetTimer) this.nextRefreshAt = Date.now() + 180000;
    if (persist) this.persistMeetRound();
  }

  persistMeetRound() {
    const cleanRosters = {};

    ALL_MEET_LOCATION_IDS.forEach(locationId => {
      cleanRosters[locationId] = (this.locationOffers[locationId] || []).map(offer => {
        const {
          card,
          ...plainOffer
        } = offer;
        return { ...plainOffer };
      });
    });

    this.registry.set('meetRosters', cleanRosters);
    this.registry.set('meetRefreshAt', this.nextRefreshAt);
    saveSessionState(this.registry);
  }

  generateOffersForLocation(locationId) {
    const location = getMeetLocation(locationId);
    const profile = getEncounterProfile(locationId, location.difficulty);
    const playerCharacterId = this.registry.get('playerCharacterId') || 'renMizuno';

    const eligible = rivalCharacterOrder.filter(id =>
      id !== playerCharacterId &&
      this.textures.exists(characters[id]?.visual?.spriteKey)
    );

    const availableCharacters = [...eligible];
    Phaser.Utils.Array.Shuffle(availableCharacters);

    const ratingSlots = [...profile.ratingSlots].slice(0, 3);
    Phaser.Utils.Array.Shuffle(ratingSlots);

    const ownedCars = this.registry.get('ownedCarIds') || [];
    const selectedCarId = this.registry.get('selectedCarId') || 'ae86';
    const usedRivalCars = new Set();

    const carBands = {
      1: ['ae86', 'ek9'],
      2: ['ae86', 'ek9', 'fc3s'],
      3: ['ek9', 'fc3s', 'evo3'],
      4: ['fc3s', 'evo3', 'wrx22b', 'r32'],
      5: ['evo3', 'wrx22b', 'r32'],
    };

    const chooseCharacterForRating = rating => {
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

    const chooseCarForEncounter = rating => {
      const band = carBands[Phaser.Math.Clamp(Math.round(Number(rating) || 3), 1, 5)] || carBands[3];
      const likely = profile.likelyCars.filter(id => band.includes(id) && cars[id]);
      const primary = likely.length ? likely : band.filter(id => cars[id]);

      const tiers = [
        primary.filter(id => id !== selectedCarId && !ownedCars.includes(id) && !usedRivalCars.has(id)),
        primary.filter(id => id !== selectedCarId && !usedRivalCars.has(id)),
        primary.filter(id => !usedRivalCars.has(id)),
        carOrder.filter(id => id !== selectedCarId && !ownedCars.includes(id) && !usedRivalCars.has(id)),
        carOrder.filter(id => id !== selectedCarId && !usedRivalCars.has(id)),
        carOrder.filter(id => id !== selectedCarId),
      ];

      const candidates = tiers.find(list => list.length) || ['ek9'];
      const id = Phaser.Utils.Array.GetRandom(candidates);
      usedRivalCars.add(id);
      return id;
    };

    const cfg = MODE_DATA[this.selectedMode];
    const paintPool = [...RIVAL_PAINT_COLORS];
    Phaser.Utils.Array.Shuffle(paintPool);

    return ratingSlots.map(encounterRating => {
      const characterId = chooseCharacterForRating(encounterRating);
      const character = characters[characterId];
      const carId = chooseCarForEncounter(encounterRating);
      const encounterAi = getEncounterAi(encounterRating);
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
      }

      const pinkDecision = this.evaluatePinkSlipAcceptance(character, carId, {
        encounterRating,
        encounterAi,
        difficulty: profile.difficulty,
        pinkAcceptanceBase: profile.pinkAcceptanceBase,
      });

      return {
        characterId,
        carId,
        raceType: Phaser.Utils.Array.GetRandom(cfg.types),
        raceDeal,
        stake,
        distance: Phaser.Utils.Array.GetRandom(cfg.distances),
        quote: character.introQuote,
        encounterRating,
        encounterAi,
        skillLabel,
        difficulty: profile.difficulty,
        pinkAccepted: pinkDecision.accepted,
        pinkAcceptanceChance: pinkDecision.chance,
        pinkReply: pinkDecision.reply,
        pinkChallenged: false,
        paintColor: paintPool.shift() ?? Phaser.Utils.Array.GetRandom(RIVAL_PAINT_COLORS),
        meetLocation: locationId,
      };
    });
  }

  rollOffers({ resetTimer = true } = {}) {
    this.clearCardObjects();
    this.clearStageObjects();

    const location = getMeetLocation(this.selectedMeetLocation);
    this.offers = this.locationOffers[this.selectedMeetLocation]
      || this.generateOffersForLocation(this.selectedMeetLocation);
    this.locationOffers[this.selectedMeetLocation] = this.offers;

    this.selectedOfferIndex = Phaser.Math.Clamp(
      Number(this.locationSelectedOfferIndex[this.selectedMeetLocation] || 0),
      0,
      Math.max(0, this.offers.length - 1)
    );

    this.setMeetBackground(
      location.bgKey,
      location.district + ' // ' + location.label + ' // ' + location.timeOfDay.toUpperCase()
    );

    if (resetTimer) {
      this.nextRefreshAt = Date.now() + 180000;
      this.persistMeetRound();
    }

    this.drawStage();
    this.drawCards();
    this.updateModeButtons();
    this.updateGpsPanel();
    this.rivalsTitleText?.setText(
      'RIVALS // ' + location.district + ' // ' + location.label + ' // ' + location.difficulty
    );

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

    this.rivalsTitleText?.setText(
      this.registry.get('meetStranded')
        ? 'RIVALS // CAR LOST // TAXI HOME TO SWITCH CARS'
        : 'RIVALS // NO CAR // EVERYONE IS OUT OF REACH'
    );
    this.updateWorkshopButton();
  }

  prefetchDeferredAssets() {
    const queueImage = (key, path) => {
      if (!this.textures.exists(key)) this.load.image(key, path);
    };

    characterOrder.forEach(id => {
      const character = characters[id];
      if (character) {
        queueImage(
          character.visual.spriteKey,
          character.visual.path + '?v=20260921-r43'
        );
      }
    });

    meetBackgrounds.forEach(bg => {
      if (bg.path) queueImage(bg.key, bg.path + '?v=20260921-r60');
    });

    // These used to block the very first Workshop load. Fetch them while the
    // player is choosing a rival instead.
    queueImage('hudCluster', 'assets/Ui/hud_cluster.png');
    queueImage('dragTree', 'assets/Ui/drag_tree.png');
    queueImage('clutchPedal', 'assets/Controls/clutch_pedal.png');
    queueImage('throttlePedal', 'assets/Controls/throttle_pedal.png');
    queueImage('nosButton', 'assets/Controls/nos_button.png');
    queueImage('shifterNeutral', 'assets/Controls/shifter_neutral.png');
    queueImage('shifterDown', 'assets/Controls/shifter_down.png');

    if (this.load.list.size > 0) this.load.start();
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

  drawStage() {
    const placements = [
      {
        // Left foreground anchor. Its body AND wheels stay above the middle car.
        carX: 225,
        carY: 440,
        carW: 590,
        carDepth: 30,
        carFlipX: false,
        charX: 125,
        charY: 592,
        charH: 278,
        charDepth: 34,
        charFlipX: false,
      },
      {
        // Middle rival is physically farther away: higher, smaller and behind.
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
        // Right foreground car remains close and clipped by the stage edge.
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

    this.offers.forEach((offer, i) => {
      const placement = placements[i];
      const car = cars[offer.carId];
      const character = characters[offer.characterId];

      const carObjects = this.createCarDisplay(
        car,
        placement.carX,
        placement.carY,
        placement.carW,
        placement.carDepth,
        placement.carFlipX,
        offer.paintColor
      );
      carObjects.forEach(obj => {
        obj.setMask(this.stageMask);
        if (!this.hasCar) obj.setAlpha(0.28);
      });
      this.stageObjects.push(...carObjects);

      const sprite = this.add.image(
        placement.charX,
        placement.charY,
        character.visual.spriteKey
      ).setOrigin(0.5, 1)
        .setDepth(placement.charDepth)
        .setMask(this.stageMask);

      const charSource = this.textures.get(character.visual.spriteKey).getSourceImage();
      sprite.setScale(placement.charH / charSource.height);
      sprite.setFlipX(placement.charFlipX);
      if (!this.hasCar) sprite.setAlpha(0.32);
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
    const cardY = 746;
    const cardH = 124;

    this.offers.forEach((offer, i) => {
      const x = xPositions[i];
      const character = characters[offer.characterId];

      const card = this.add.rectangle(
        x,
        cardY,
        350,
        cardH,
        0x0a1521,
        0.99
      ).setStrokeStyle(2, 0x2e4a61, 1)
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

      const source = this.textures.get(character.visual.spriteKey).getSourceImage();
      const portrait = this.add.image(
        portraitX,
        portraitY - 54,
        character.visual.spriteKey
      ).setDepth(36)
        .setOrigin(0.5, 0);

      portrait.setScale(405 / source.height);

      const portraitMaskShape = this.make.graphics({ add: false });
      portraitMaskShape.fillStyle(0xffffff, 1);
      portraitMaskShape.fillRect(
        portraitX - portraitSize / 2,
        portraitY - portraitSize / 2,
        portraitSize,
        portraitSize
      );
      portrait.setMask(portraitMaskShape.createGeometryMask());

      const textX = x - 42;

      const name = this.add.text(textX, cardY - 44, character.name.toUpperCase(), {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: '#ffffff'
      }).setDepth(35);

      const quote = this.add.text(textX, cardY - 14, '"' + offer.quote + '"', {
        fontFamily: BODY_FONT,
        fontSize: '12px',
        color: '#9fb4c2',
        wordWrap: { width: 214 },
        lineSpacing: 1,
      }).setDepth(35);

      if (this.hasCar) {
        card.on('pointerdown', () => this.selectOffer(i));
      } else {
        card.disableInteractive()
          .setFillStyle(0x101317, 0.99)
          .setStrokeStyle(1, 0x3b444a, 1);
        portraitBg.setFillStyle(0x111418, 1).setStrokeStyle(1, 0x3b444a, 1);
        portrait.setAlpha(0.34);
        name.setColor('#68737a');
        quote.setColor('#59636a');
      }

      this.cardObjects.push(
        card,
        portraitBg,
        portrait,
        portraitMaskShape,
        name,
        quote
      );
      offer.card = card;
    });
  }

  estimateCarThreat(carId, tuneLevel = 0, hasNitrous = false) {
    const car = cars[carId];
    if (!car) return 0;

    const powerToWeight = (car.powerKW || 0) / Math.max(1, car.vehicleMassKg || 1) * 1000;
    const traction = (car.tyreGrip || 1)
      * Math.max(0.35, (car.drivenAxleWeightFraction || 0.54) * (car.launchLoadMultiplier || 1));
    const forcedInduction = Math.max(0, car.maximumBoost || 0) * 7;
    const tune = Phaser.Math.Clamp(Number(tuneLevel) || 0, 0, 5) * 4.5;
    const nitrous = hasNitrous ? 9 : 0;

    return powerToWeight * 0.72 + traction * 52 + forcedInduction + tune + nitrous;
  }

  evaluatePinkSlipAcceptance(character, opponentCarId, encounter = {}) {
    const rating = Phaser.Math.Clamp(
      Number(encounter.encounterRating ?? character?.skill?.rating ?? 3),
      1,
      5
    );
    const encounterAi = encounter.encounterAi || getEncounterAi(rating);
    const aggression = Phaser.Math.Clamp(
      Number(encounterAi.aggression ?? character?.skill?.ai?.aggression ?? 0.76),
      0.5,
      1
    );

    const playerCarId = this.registry.get('selectedCarId') || 'ae86';
    const carStates = this.registry.get('carStates') || {};
    const playerState = carStates[playerCarId] || { tuneLevel: 0, nosInstalled: false };

    const wins = Number(this.registry.get('wins') || 0);
    const losses = Number(this.registry.get('losses') || 0);
    const races = wins + losses;
    const playerWinRate = races > 0 ? wins / races : 0.5;

    const opponentThreat = this.estimateCarThreat(opponentCarId, rating, rating >= 4)
      + rating * 9;
    const playerThreat = this.estimateCarThreat(
      playerCarId,
      playerState.tuneLevel || 0,
      Boolean(playerState.nosInstalled)
    ) + 18 + playerWinRate * 14;

    const opponentCarValue = this.estimateCarThreat(opponentCarId, 0, false);
    const playerCarValue = this.estimateCarThreat(playerCarId, 0, false);

    // Pink slips are intentionally rare. Rivals need to feel confident, and
    // risking a stronger/more valuable car makes them substantially more wary.
    const advantage = opponentThreat - playerThreat;
    const confidenceBonus = Phaser.Math.Clamp((advantage - 12) / 140, -0.04, 0.12);
    const aggressionBonus = Phaser.Math.Clamp((aggression - 0.75) * 0.08, -0.025, 0.025);
    const temptationBonus = Phaser.Math.Clamp((playerCarValue - opponentCarValue) / 250, 0, 0.04);
    const riskPenalty = Phaser.Math.Clamp((opponentCarValue - playerCarValue) / 220, 0, 0.08);
    const reputationPenalty = Phaser.Math.Clamp((playerWinRate - 0.55) * 0.10, 0, 0.04);

    const baseChance = Number(encounter.pinkAcceptanceBase ?? 0.07);
    const chance = Phaser.Math.Clamp(
      baseChance
        + confidenceBonus
        + aggressionBonus
        + temptationBonus
        - riskPenalty
        - reputationPenalty,
      0.01,
      0.28
    );

    const accepted = Phaser.Math.FloatBetween(0, 1) < chance;

    const yesReplies = [
      'All right. Keys for keys.',
      'You\'re on. Pink slips.',
      'Fine. Winner takes the car.',
    ];
    const noReplies = [
      'No. Cash race only.',
      'Not risking the car tonight.',
      'Cash is enough.',
      'Not for this matchup.',
    ];

    return {
      accepted,
      chance,
      reply: Phaser.Utils.Array.GetRandom(accepted ? yesReplies : noReplies),
    };
  }

  challengePinkSlips() {
    const offer = this.offers[this.selectedOfferIndex];
    if (!offer || offer.pinkChallenged) return;

    const ownedCars = this.registry.get('ownedCarIds') || [];
    const garageCapacity = getGarageCapacity(this.registry.get('garageTier') || 0);
    if (
      ownedCars.length >= garageCapacity &&
      !ownedCars.includes(offer.carId)
    ) {
      this.pinkSlipButton.disableInteractive();
      this.pinkSlipButtonLabel.setText('GARAGE FULL').setColor('#72838f');
      this.pinkResponseText
        .setText('Upgrade your Shinonome workshop before racing for another car.')
        .setColor('#8799a5');
      return;
    }

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

    if (!offer.pinkChallenged) {
      const ownedCars = this.registry.get('ownedCarIds') || [];
      const garageCapacity = getGarageCapacity(this.registry.get('garageTier') || 0);
      const garageFull =
        ownedCars.length >= garageCapacity &&
        !ownedCars.includes(offer.carId);

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
      offer.card.setFillStyle(active ? 0x10263a : 0x0a1521, 0.99);
      offer.card.setStrokeStyle(
        active ? 3 : 2,
        active ? 0x41dcff : 0x2e4a61,
        1
      );
    });

    const offer = this.offers[index];
    if (!offer) return;

    const character = characters[offer.characterId];
    const car = cars[offer.carId];

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
    if (this.specialChallengeActive || this.competitionPopup?.active) return;
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

        if (challenger) {
          this.showSpecialChallenger(challenger, true);
        } else {
          this.rollOffers({ resetTimer: false });
        }

        const noteBg = this.add.rectangle(
          STAGE.x + STAGE.w - 200,
          STAGE.y + 32,
          370,
          44,
          challenger ? 0x351522 : 0x07111d,
          0.94
        ).setStrokeStyle(1, challenger ? 0xff5f93 : 0x4bdcff, 0.8).setDepth(84);

        const note = this.add.text(
          STAGE.x + STAGE.w - 24,
          STAGE.y + 32,
          challenger
            ? '15 MINUTES LATER // SOMEONE PULLED IN'
            : '15 MINUTES LATER // NEW RACERS',
          {
            fontFamily: PIXEL_FONT,
            fontSize: '8px',
            color: challenger ? '#ffe4ee' : '#dff8ff',
          }
        ).setOrigin(1, 0.5).setDepth(85);

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
      },
    });
  }

  showDistrictPopup() {
    showTravelMap(this, {
      currentLocationId: this.selectedMeetLocation,
      title: 'TOKYO REGION MAP',
      actionVerb: 'DRIVE',
      allowCurrentAction: false,
      homeCost: this.hasCar ? WORKSHOP_RETURN_COST : TAXI_TO_WORKSHOP_COST,
      onHome: (workshopLocationId, cost) => this.returnToWorkshop(workshopLocationId, cost),
      onTravel: (locationId, cost) => this.travelToLocation(locationId, cost),
    });
  }

  startSelectedRace() {
    if (!this.hasCar) {
      this.applyNoCarMeetState();
      return;
    }

    const offer = this.offers[this.selectedOfferIndex];
    if (!offer) return;

    const cash = this.registry.get('cash') ?? 0;
    if (this.selectedDeal === 'CASH' && cash < Number(offer.stake || 0)) return;

    this.registry.set('selectedOpponentCarId', offer.carId);
    this.registry.set('selectedOpponentPaintColor', normalisePaintColor(offer.paintColor, DEFAULT_PAINT_COLOR));
    this.registry.set('selectedOpponentCharacterId', offer.characterId);
    this.registry.set('selectedOpponentEncounterRating', Number(offer.encounterRating || 3));
    this.registry.set('selectedOpponentEncounterAi', offer.encounterAi || getEncounterAi(offer.encounterRating || 3));
    this.registry.set('selectedOpponentDifficulty', offer.difficulty || getMeetLocation(this.selectedMeetLocation).difficulty);
    this.registry.set('selectedRaceCategory', this.selectedMode);
    this.registry.set('selectedRaceType', offer.raceType);
    this.registry.set('selectedRaceDeal', this.selectedDeal === 'PINK' ? 'PINK_SLIP' : 'BET');
    this.registry.set('selectedRaceStake', this.selectedDeal === 'PINK' ? 0 : offer.stake);

    const location = getMeetLocation(this.selectedMeetLocation);
    this.registry.set('raceTimeOfDay', location.timeOfDay);
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
    const bodyScale = targetWidth / source.width;
    const ratio = car.visual.wheelScale / car.visual.bodyScale;
    const wheelScale = bodyScale * ratio * 1.16;
    const dir = flipX ? -1 : 1;

    const rearX = x + car.visual.rearOffsetX * bodyScale * dir;
    const frontX = x + car.visual.frontOffsetX * bodyScale * dir;
    const wheelY = y + car.visual.wheelOffsetY * bodyScale;

    const rearWheel = this.add.image(rearX, wheelY, car.visual.wheelKey)
      .setScale(wheelScale)
      .setDepth(depth);

    const frontWheel = this.add.image(frontX, wheelY, car.visual.wheelKey)
      .setScale(wheelScale)
      .setDepth(depth);

    const rearBacking = this.add.circle(
      rearX,
      wheelY,
      Math.max(5, rearWheel.displayWidth * 0.50),
      0x030507,
      1
    ).setDepth(depth - 0.35);

    const frontBacking = this.add.circle(
      frontX,
      wheelY,
      Math.max(5, frontWheel.displayWidth * 0.50),
      0x030507,
      1
    ).setDepth(depth - 0.35);

    // Ground contact: place the ellipse low enough that only its upper edge
    // overlaps the lower portion of the tyres.
    const shadowY = wheelY + Math.max(16, rearWheel.displayHeight * 0.42);

    const softShadow = this.add.ellipse(
      x + (flipX ? -4 : 4),
      shadowY,
      Math.max(112, targetWidth * 0.88),
      Math.max(20, rearWheel.displayHeight * 0.34),
      0x000000,
      0.64
    ).setDepth(depth - 0.12);

    const contactShadow = this.add.ellipse(
      x,
      shadowY - 1,
      Math.max(92, targetWidth * 0.72),
      Math.max(10, rearWheel.displayHeight * 0.18),
      0x000000,
      0.88
    ).setDepth(depth - 0.08);

    const bodyLayers = createCarBodyLayers(this, car, {
      x,
      y,
      scale: bodyScale,
      depth: depth + 1,
      flipX,
      paintColor,
    });

    return [
      rearBacking,
      frontBacking,
      softShadow,
      contactShadow,
      rearWheel,
      frontWheel,
      ...bodyLayers.objects,
    ];
  }
}
