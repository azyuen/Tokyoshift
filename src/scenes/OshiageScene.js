// Oshiage satellite district. The seven regional championships remain unchanged.
import { cars } from '../data/cars.js?v=20261011-r479';
import {
  OSHIAGE_SCHOOL_LESSONS, bookingMatches, bookOshiageLesson, consumeOshiageAttempt,
  remainingAttempts,
} from '../data/oshiageSchool.js?v=20261014-r510';
import { characters, getCharacterAssetUrl, getCharacterVisualAsset, CENTRAL_TOKYO_CHARACTER_IDS } from '../data/characters.js?v=20261013-r494';
import { getOshiageEliteProgress, getOshiageEliteOpponent, getOshiageEliteRemainingMs, OSHIAGE_ELITE_COOLDOWN_MS, OSHIAGE_ELITE_VENUES } from '../data/oshiageElite.js?v=20261013-r496';
import { getBaseCarId } from '../data/carOwnership.js?v=20261011-r479';
import { getWorldPhase } from '../environment/WorldClock.js?v=20260929-r286';
import { showTravelMap } from '../ui/TravelMap.js?v=20261013-r496';
import { getTravelLocation } from '../data/travelRegions.js?v=20261013-r496';
import { saveSessionState } from '../state/GameState.js?v=20261014-r501';
import { playMangaCutscene, sceneCutsceneActive } from '../ui/MangaCutscene.js?v=20261014-r511';
import { addSettingsButton } from '../ui/SettingsPanel.js?v=20261011-r482';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20261005-r355';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';
import {
  PAINT_PRESETS, hasLayeredPaintAssets, getCarPaintColor, normalisePaintColor, paintColorToRgb, rgbToPaintColor,
  getCarBodyTextureKey, getCarBodyScaleForWidth, createCarBodyLayers, setCarBodyPaint,
  preloadCarAppearanceAssets, preloadCarWheel, ensureDerivedModularCarTextures,
} from '../vehicles/CarAppearance.js?v=20260929-r246';
import { getReferenceRightX } from '../data/carReferenceGeometry.js?v=20261012-ref2';
import { createVisualModLayers, getVisualModWheelVisual, preloadVisualModSelectionAssets } from '../data/visualMods.js?v=20261014-r501';
import { getWheelPairFit, getWheelContactOffsetY } from '../vehicles/WheelFit.js?v=20260929-r258';
import { preloadWheelOption } from '../data/wheels.js?v=20260929-r246';
import {
  getOshiageRimListings, getOshiageRimQuote, buyOrInstallOshiageRim,
  restoreStockOshiageRims, RIMS_REFRESH_MS, OSHIAGE_RIM_SLOTS,
} from '../data/oshiageRims.js?v=20261014-r506';

const PIXEL = '"Silkscreen", monospace';
const BODY = '"Rajdhani", sans-serif';
const STAGE = { x: 24, y: 92, w: 1138, h: 528 };
const SIDE = { x: 1180, y: 92, w: 356, h: 724 };
const STRIP = { x: 24, y: 636, w: 1138, h: 180 };
const ROOT = 'assets/Oshiage/';
const SAYAKA = 'assets/Characters/Main/oshiage_sayaka_fujieda_';
const schoolSayakaKey = pose => 'characterSayakaOshiage' +
  pose.charAt(0).toUpperCase() + pose.slice(1);
const LOCATIONS = Object.freeze({
  oshiageSkytreeMeet: { label: 'SKYTREE UNDERGROUND MEET', stem: 'oshiage_skytree01' },
  oshiageCustomWorks: { label: 'OSHIAGE CUSTOM WORKS', stem: 'oshiage_shop' },
  oshiageDrivingSchool: { label: 'OSHIAGE DRIVING SCHOOL', stem: 'oshiage_school' },
});
const LEGACY_LESSONS = Object.freeze([
  { title: 'LAUNCH CONTROL', pose: 'explaining',
    text: 'Start with a repeatable launch. Add throttle smoothly while releasing the clutch. Too much torque too early can cost more time than a modest launch.',
    hint: 'Watch the first few metres, not just the engine note.' },
  { title: 'SHIFT QUALITY', pose: 'neutral',
    text: 'A clean change requires clutch engagement and a brief throttle lift. A clean shift is not necessarily a well-timed shift: gear choice and RPM also matter.',
    hint: 'Practise your clutch and throttle sequence before chasing speed.' },
  { title: 'POWERBAND', pose: 'explaining',
    text: 'The best upshift point depends on the torque in the current gear and the next. It is not always at the redline, especially with tuned gearing and turbo response.',
    hint: 'Compare pull before and after the shift at the dyno.' },
  { title: 'RACE PLANNING', pose: 'concerned',
    text: 'A stronger car is not always the better choice. Drivetrain, gearing, traction and the length of a race can reverse the result. Prepare options.',
    hint: 'These principles will matter even more in organised events.' },
]);

const MONEY = n => '¥ ' + Number(n || 0).toLocaleString('en-US');
const TEXT = (scene, x, y, label, options = {}) => scene.add.text(x, y, label, {
  fontFamily: options.pixel ? PIXEL : BODY,
  fontSize: options.size || '11px',
  color: options.color || '#d9ebf5',
  wordWrap: options.wrap ? { width: options.wrap } : undefined,
  align: options.align || 'left',
  fontStyle: options.bold ? 'bold' : 'normal',
  lineSpacing: options.spacing || 3,
});

export default class OshiageScene extends Phaser.Scene {
  constructor() { super('OshiageScene'); }

  init(data = {}) {
    this.activeLocationId = LOCATIONS[data.locationId] ? data.locationId :
      (LOCATIONS[this.registry.get('oshiageLocation')] ? this.registry.get('oshiageLocation') : 'oshiageDrivingSchool');
    this.room = ['paint', 'rims'].includes(data.room) ? data.room : 'outside';
    if (this.activeLocationId !== 'oshiageCustomWorks') this.room = 'outside';
    this.lessonIndex = Math.max(0, Math.min(3, Number(this.registry.get('oshiageLessonTab') || 0)));
    this.schoolCarEntered = false;
    this.schoolPromptOpen = false;
    this.meetAlternative = this.registry.get('oshiageEliteVenue') === 'plaza';
    this.paintMode = 'preset';
    this.customPaintColor = null;
    this.selectedRimIndex = -1;
    this.rimPreview = false;
    this.rimConfirmOpen = false;
    this.entryTween = null;
    this.rimCycle = Math.floor(Date.now() / RIMS_REFRESH_MS);
    this.pendingPaint = null;
    this.paintBusy = false;
    this.paintObjects = [];
    this.content = [];
    this.phase = getWorldPhase();
  }

  backgroundAsset(locationId = this.activeLocationId, phase = this.phase) {
    const cleanPhase = phase === 'day' ? 'day' : 'night';
    // Dedicated 8-bay Oshiage wheel shop, with genuine day/night variants.
    if (locationId === 'oshiageCustomWorks' && this.room === 'rims') {
      return {
        key: 'oshiage_wheels_' + cleanPhase + '_r506',
        path: ROOT + 'oshiage_wheels_' + cleanPhase + '.png?v=20261014-r506',
      };
    }
    const stem = this.room === 'paint' && locationId === 'oshiageCustomWorks'
      ? 'oshiage_paint'
      : locationId === 'oshiageSkytreeMeet' && this.meetAlternative
        ? 'oshiage_skytree02'
        : (LOCATIONS[locationId] || LOCATIONS.oshiageDrivingSchool).stem;
    return { key: 'oshiage_' + stem + '_' + cleanPhase, path: ROOT + stem + '_' + cleanPhase + '.png?v=20261013-r496' };
  }

  queueImage(key, path) {
    if (!key || !path || this.textures.exists(key)) return 0;
    this.load.image(key, path);
    return 1;
  }

  selectedCar() {
    const id = String(this.registry.get('selectedCarId') || '');
    const owned = this.registry.get('ownedCarIds') || [];
    const car = owned.includes(id) ? (cars[id] || cars[getBaseCarId(id)]) : null;
    const state = (this.registry.get('carStates') || {})[id] || {};
    return { id, car, state };
  }

  getEliteRival(venueId) {
    const series = this.registry.get('oshiageEliteSeries');
    const continuing = series?.active && series.venueId === venueId;
    return getOshiageEliteOpponent(this.registry, venueId,
      continuing ? Number(series.startedAt || Date.now()) : Date.now(),
      continuing ? Number(series.roundIndex || 0) : 0);
  }

  queueViewAssets() {
    let queued = 0;
    for (const phase of ['day', 'night']) {
      const background = this.backgroundAsset(this.activeLocationId, phase);
      queued += this.queueImage(background.key, background.path);
    }
    if (this.activeLocationId === 'oshiageDrivingSchool') {
      const { car, state } = this.selectedCar();
      if (car) {
        queued += preloadCarAppearanceAssets(this, { [car.id]: car }, '20261014-r510');
        queued += preloadCarWheel(this, car, state);
        queued += preloadVisualModSelectionAssets(this, car.id, state, '20261014-r510');
      }
      for (const pose of ['neutral', 'explaining', 'happy', 'concerned']) {
        queued += this.queueImage(schoolSayakaKey(pose), SAYAKA + pose + '.png?v=20261013-r496');
      }
    }
    if (this.activeLocationId === 'oshiageSkytreeMeet' && getOshiageEliteProgress(this.registry).complete) {
      const opponent = this.getEliteRival(this.meetAlternative ? 'plaza' : 'underpass');
      const rival = opponent && characters[opponent.characterId];
      if (rival?.visual?.spriteKey && rival.visual?.path) {
        queued += this.queueImage('oshiageEliteRival_' + opponent.characterId,
          getCharacterAssetUrl(rival.visual.path));
      }
      if (opponent && cars[opponent.carId]) {
        queued += preloadCarAppearanceAssets(this, { [opponent.carId]: cars[opponent.carId] }, '20261013-r496');
        queued += preloadCarWheel(this, cars[opponent.carId], opponent.buildState);
      }
    }
    if (this.activeLocationId === 'oshiageCustomWorks' &&
        ['paint', 'rims'].includes(this.room)) {
      const specialist = getCharacterVisualAsset(
        CENTRAL_TOKYO_CHARACTER_IDS.autoMarket.wheels, 'normal'
      );
      if (specialist?.key && specialist?.path) {
        queued += this.queueImage(specialist.key, getCharacterAssetUrl(specialist.path));
      }
    }
    if (this.room === 'rims') {
      const { car, state } = this.selectedCar();
      if (car) {
        queued += preloadCarAppearanceAssets(this, { [car.id]: car }, '20261014-r501');
        queued += preloadCarWheel(this, car, state);
      }
      getOshiageRimListings().forEach(rim => {
        queued += preloadWheelOption(this, rim, '20261014-r506');
      });
    }
    if (this.room === 'paint') {
      const { car, state } = this.selectedCar();
      if (car) {
        queued += preloadCarAppearanceAssets(this, { [car.id]: car }, '20261013-r496');
        queued += preloadCarWheel(this, car, state);
        queued += preloadVisualModSelectionAssets(this, car.id, state, '20261013-r496');
      }
    }
    return queued;
  }

  preload() {
    const queued = this.queueViewAssets();
    startSceneLoading(this, 'LOADING OSHIAGE', queued);
  }

  create() {
    document.body.dataset.scene = 'oshiage';
    this.scale.resize(1560, 840);
    playMusic('meet');
    this.drawShell();
    ensureDerivedModularCarTextures(this, Object.fromEntries(
      Object.entries(cars).filter(([, car]) =>
        car?.visual?.bodyKey && this.textures.exists(car.visual.bodyKey))
    ));
    this.renderView();
    if (this.activeLocationId === 'oshiageDrivingSchool' && !this.registry.get('oshiageInstructorMet')) {
      this.time.delayedCall(420, () => this.showInstructorCutscene());
    }
    this.time.addEvent({ delay: 5000, loop: true, callback: () => {
      if (this.activeLocationId === 'oshiageSkytreeMeet' && !this.paintBusy &&
          !this.instructorCutsceneOpen) this.renderView();
    } });
    this.phaseWatcher = this.time.addEvent({ delay: 5000, loop: true, callback: () => {
      // Never tear down a moving car midway through a showroom entrance.
      if (this.paintBusy) return;
      const phase = getWorldPhase();
      const rimCycle = Math.floor(Date.now() / RIMS_REFRESH_MS);
      if (phase === this.phase && (this.room !== 'rims' || rimCycle === this.rimCycle)) return;
      this.phase = phase;
      // Do not silently switch the selected item when a 3-hour rotation ends.
      if (this.room === 'rims' && rimCycle !== this.rimCycle) {
        this.selectedRimIndex = -1;
        this.rimPreview = false;
      }
      this.rimCycle = rimCycle;
      this.loadAndRender();
    } });
    finishSceneLoading('OSHIAGE READY');
  }

  own(obj) { this.content.push(obj); return obj; }
  clearView() {
    // Entry tweens target a proxy, so stop them explicitly before destroying
    // wheel sprites. Ordinary preview changes remain instant after entry.
    if (this.entryTween) {
      this.entryTween.stop();
      this.entryTween = null;
    }
    this.tweens.killTweensOf(this.content);
    this.content.forEach(o => o?.destroy?.());
    this.content = [];
    this.paintObjects = [];
  }
  drawShell() {
    this.add.rectangle(780, 420, 1560, 840, 0x040a12).setDepth(-20);
    this.add.rectangle(780, 35, 1512, 62, 0x07111d)
      .setStrokeStyle(2, 0x1e4057).setDepth(35);
    TEXT(this, 52, 35, 'OSHIAGE', { pixel: true, size: '20px', color: '#f2fbff' })
      .setOrigin(0, 0.5).setDepth(37);
    this.header = TEXT(this, 330, 35, '', { pixel: true, size: '10px', color: '#83e0fa' })
      .setOrigin(0, 0.5).setDepth(37);
    this.cashText = TEXT(this, 1510, 35, '', { pixel: true, size: '15px', color: '#ffe394' })
      .setOrigin(1, 0.5).setDepth(37);
    addSettingsButton(this, 980, 35);

    this.add.rectangle(STAGE.x + STAGE.w / 2, STAGE.y + STAGE.h / 2,
      STAGE.w, STAGE.h, 0x08121d).setStrokeStyle(2, 0x36546a).setDepth(-13);
    this.maskGraphics = this.make.graphics({ add: false });
    this.maskGraphics.fillStyle(0xffffff);
    this.maskGraphics.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
    this.stageMask = this.maskGraphics.createGeometryMask();
    this.add.rectangle(STAGE.x + STAGE.w / 2, STAGE.y + STAGE.h / 2,
      STAGE.w, STAGE.h, 0x000000, 0).setStrokeStyle(2, 0x36546a).setDepth(29);
    this.add.rectangle(SIDE.x + SIDE.w / 2, SIDE.y + SIDE.h / 2,
      SIDE.w, SIDE.h, 0x07111d, 0.99).setStrokeStyle(2, 0x24465e).setDepth(30);
    this.add.rectangle(STRIP.x + STRIP.w / 2, STRIP.y + STRIP.h / 2,
      STRIP.w, STRIP.h, 0x07111d, 0.99).setStrokeStyle(2, 0x24465e).setDepth(30);
  }
  addText(x, y, s, opts = {}) {
    return this.own(TEXT(this, x, y, s, opts).setDepth(opts.depth ?? 33));
  }
  button(x, y, w, h, label, onClick, opts = {}) {
    const active = opts.disabled !== true;
    const r = this.own(this.add.rectangle(x, y, w, h,
      active ? (opts.accent ? 0x153d3a : 0x14253a) : 0x17212b)
      .setStrokeStyle(2, active ? (opts.accent ? 0x62e8c7 : 0x63baff) : 0x3c4e58)
      .setDepth(33));
    const t = this.addText(x, y, label, {
      pixel: true, size: opts.size || '8px',
      color: active ? '#f1fbff' : '#8294a1',
      align: 'center', depth: 34,
    }).setOrigin(0.5);
    if (active) r.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      if (!this.paintBusy) onClick?.();
    });
    return { rect: r, label: t };
  }
  loadAndRender(afterLoad) {
    const queued = this.queueViewAssets();
    if (!queued) {
      ensureDerivedModularCarTextures(this, Object.fromEntries(
        Object.entries(cars).filter(([, car]) => car?.visual?.bodyKey && this.textures.exists(car.visual.bodyKey)
      )));
      this.renderView();
      afterLoad?.();
      return;
    }
    startSceneLoading(this, 'LOADING OSHIAGE', queued);
    this.load.once('complete', () => {
      ensureDerivedModularCarTextures(this, Object.fromEntries(
        Object.entries(cars).filter(([, car]) => car?.visual?.bodyKey && this.textures.exists(car.visual.bodyKey)
      )));
      this.renderView();
      finishSceneLoading('OSHIAGE READY');
      afterLoad?.();
    });
    if (!this.load.isLoading()) this.load.start();
  }
  showLocation(locationId) {
    if (!LOCATIONS[locationId]) return;
    this.activeLocationId = locationId;
    this.room = 'outside';
    this.registry.set('oshiageLocation', locationId);
    saveSessionState(this.registry);
    this.loadAndRender();
  }
  renderView() {
    this.clearView();
    this.cashText.setText(MONEY(this.registry.get('cash')));
    this.header.setText(LOCATIONS[this.activeLocationId].label + ' // ' +
      (this.room === 'paint' ? 'PAINT STUDIO // ' :
        this.room === 'rims' ? 'RIMS // ' : '') + this.phase.toUpperCase());
    const background = this.backgroundAsset();
    if (this.textures.exists(background.key)) {
      const src = this.textures.get(background.key).getSourceImage();
      const img = this.own(this.add.image(STAGE.x + STAGE.w / 2, STAGE.y + STAGE.h / 2, background.key)
        .setScale((this.room === 'rims' ? Math.min : Math.max)(STAGE.w / src.width, STAGE.h / src.height))
        .setMask(this.stageMask).setDepth(-10));
      img.texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    } else {
      this.addText(420, 340, 'IMAGE UNAVAILABLE: ' + background.path, { wrap: 650 });
    }
    if (this.activeLocationId === 'oshiageDrivingSchool') this.drawSchool();
    else if (this.activeLocationId === 'oshiageSkytreeMeet') this.drawMeet();
    else if (this.room === 'paint') this.drawPaintStudio();
    else if (this.room === 'rims') this.drawRimShop();
    else this.drawCustomWorks();

    this.button(SIDE.x + SIDE.w / 2, SIDE.y + SIDE.h - 48,
      SIDE.w - 36, 46, 'GO TO MAP  >', () => this.openMap());
  }

  sideHeader(title, subtitle) {
    this.addText(SIDE.x + 20, SIDE.y + 20, title, { pixel: true, size: '12px', color: '#8feaff', wrap: SIDE.w - 40 });
    this.addText(SIDE.x + 20, SIDE.y + 76, subtitle, { size: '12px', color: '#a9c3d1', wrap: SIDE.w - 40 });
  }

  // The first course remains free. Paid practical lessons come with three
  // retries, usable on the chosen car within the same booking.
  drawSchool() {
    const selected = Math.max(0, Math.min(3, this.lessonIndex));
    const choices = [
      { id: 'basic', title: 'FIRST DRIVING LESSON', tab: 'BASIC',
        description: 'Learn the clutch, throttle and gearbox with the original step-by-step tutorial.',
        pose: 'explaining' },
      { id: 'launch', title: 'FIND YOUR LAUNCH BAND', tab: 'LAUNCH',
        description: 'Your own launch RPM range, with clutch and wheelspin advice over a short 60-foot run.',
        pose: 'concerned' },
      { id: 'standing', title: 'STANDING-START SHIFTING', tab: 'STANDING',
        description: 'A standing quarter mile, with personalised upshift ranges and live feedback.',
        pose: 'explaining' },
      { id: 'rolling', title: 'ROLLING-START SHIFTING', tab: 'ROLLING',
        description: 'Start at 60 km/h. Pick the best gear, then practise each change over half a mile.',
        pose: 'neutral' },
    ];
    const lesson = choices[selected];
    const { id, car, state } = this.selectedCar();
    if (car) {
      const key = schoolSayakaKey(lesson.pose);
      this.schoolCarObjects = this.drawOwnedCar(car, state, 621, 430, 558,
        getCarPaintColor(state), 8);
      if (!this.schoolCarEntered && this.schoolCarObjects?.length) {
        this.schoolCarEntered = true;
        // The same wheel-distance rolling animation used in Custom Works.
        this.animateShopCarEntry(this.schoolCarObjects, { duration: 3750, distance: 1010 });
      }
      if (this.textures.exists(key)) {
        const source = this.textures.get(key).getSourceImage();
        const img = this.own(this.add.image(1000, STAGE.y + STAGE.h - 15, key)
          .setOrigin(0.5, 1).setScale(355 / source.height)
          .setMask(this.stageMask).setDepth(16));
        img.texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
      }
    }
    this.sideHeader('DRIVING SCHOOL', 'Lady Instructor // Oshiage');
    this.addText(SIDE.x + 20, SIDE.y + 150, lesson.title, {
      pixel: true, size: '10px', color: '#ffe394', wrap: SIDE.w - 40
    });
    this.addText(SIDE.x + 20, SIDE.y + 216, lesson.description, {
      size: '13px', color: '#e3edf4', wrap: SIDE.w - 40, spacing: 5
    });
    const fee = OSHIAGE_SCHOOL_LESSONS[lesson.id].fee;
    const currentBooking = this.registry.get('oshiageSchoolBooking');
    const continuing = bookingMatches(currentBooking, id, lesson.id);
    const count = continuing ? remainingAttempts(currentBooking) : 4;
    const completed = lesson.id === 'basic'
      ? Boolean(this.registry.get('oshiageBasicLessonComplete'))
      : Boolean(this.registry.get('oshiageCoachingProgress')?.[id]?.[lesson.id]?.completed);
    this.addText(SIDE.x + 20, SIDE.y + 394, lesson.id === 'basic'
      ? 'INTRODUCTORY COURSE // FREE'
      : continuing
        ? 'PREPAID // ' + count + ' RUNS REMAINING'
        : 'LESSON FEE // ' + MONEY(fee), {
      pixel: true, size: '9px', color: '#96e9d4', wrap: SIDE.w - 40
    });
    this.addText(SIDE.x + 20, SIDE.y + 445, lesson.id === 'basic'
      ? 'Drive as many times as you wish.'
      : 'One booking includes your first run and 3 retries.', {
      size: '12px', color: '#a8c9d3', wrap: SIDE.w - 40
    });
    this.addText(SIDE.x + 20, SIDE.y + 505,
      completed ? 'COURSE COMPLETED // PRACTICE AGAIN' : 'COURSE READY', {
      pixel: true, size: '8px', color: '#d0e7b4', wrap: SIDE.w - 40
    });
    this.button(SIDE.x + SIDE.w / 2, SIDE.y + 568, SIDE.w - 40, 47,
      lesson.id === 'basic' ? 'FREE // ENTER LESSON' :
        continuing ? 'PREPAID // CONTINUE' : MONEY(fee) + ' // ENTER',
      () => this.showLessonBookingDialogue(lesson.id),
      { disabled: !car || Boolean(car.crewLoan), accent: true, size: '8px' });

    this.addText(48, 654, 'OSHIAGE DRIVING SCHOOL  //  CHOOSE A LESSON',
      { pixel: true, size: '10px', color: '#8feaff' });
    choices.forEach((option, i) => this.button(179 + i * 282, 743, 265, 65,
      option.tab + ' // ' + (option.id === 'basic' ? 'FREE' : MONEY(OSHIAGE_SCHOOL_LESSONS[option.id].fee)),
      () => {
        this.lessonIndex = i;
        this.registry.set('oshiageLessonTab', i);
        this.renderView();
      }, { accent: selected === i, size: '7px' }));
    this.addText(48, 790, 'ONE FEE PER BOOKING // THREE RETRIES // NO RACE STAKES',
      { size: '9px', color: '#91aabd' });
  }

  showLessonBookingDialogue(lessonId) {
    if (this.schoolPromptOpen || this.instructorCutsceneOpen ||
        this.paintBusy || sceneCutsceneActive(this)) return;
    const { id, car } = this.selectedCar();
    if (!car || car.crewLoan) {
      this.showOshiageNotice('PLEASE SELECT YOUR OWN CAR FIRST');
      return;
    }
    const booking = this.registry.get('oshiageSchoolBooking');
    const continuing = bookingMatches(booking, id, lessonId);
    const quote = bookOshiageLesson({
      booking, carId: id, lessonId, cash: this.registry.get('cash'),
    });
    if (!quote.ok) {
      this.showOshiageNotice('NOT ENOUGH YEN FOR THIS LESSON');
      return;
    }
    const lesson = OSHIAGE_SCHOOL_LESSONS[lessonId];
    const text = continuing
      ? 'You still have ' + remainingAttempts(booking) +
        ' runs remaining on this booking. Shall we continue?'
      : lessonId === 'basic'
        ? 'The basics are free. Shall we practise together?'
        : 'The fee is ' + MONEY(lesson.fee) +
          ', including three retries. Shall we begin?';
    // Real game manga cutscene: same portrait staging, dialogue plate,
    // animated transitions and two final dialogue buttons as the Dev tester.
    const definition = {
      id: 'oshiageSchoolBooking_' + lessonId,
      title: 'OSHIAGE // LADY INSTRUCTOR',
      once: false,
      characters: { left: 'sayakaFujieda' },
      pages: [
        { speaker: 'left', pose: 'oshiageExplaining',
          nameOverride: 'LADY INSTRUCTOR', text: lesson.speech },
        { speaker: 'left', pose: 'oshiageHappy',
          nameOverride: 'LADY INSTRUCTOR', text },
      ],
      finalActionLabel: 'YES, LET\'S DRIVE',
      secondaryFinalActionLabel: 'NOT NOW',
    };
    this.schoolPromptOpen = true;
    const result = playMangaCutscene(this, definition, {
      preloadPagePosesOnly: true,
      onComplete: ({ reason }) => {
        this.schoolPromptOpen = false;
        // Skipping or selecting the secondary button must never spend yen.
        if (reason !== 'action') return;
        const current = this.selectedCar();
        const purchase = bookOshiageLesson({
          booking: this.registry.get('oshiageSchoolBooking'),
          carId: current.id, lessonId, cash: this.registry.get('cash'),
        });
        if (!purchase.ok || current.id !== id || !current.car || current.car.crewLoan) return;
        if (lessonId !== 'basic') {
          const attempt = consumeOshiageAttempt(purchase.booking);
          if (!attempt) return;
          this.registry.set('cash', purchase.cash);
          this.registry.set('oshiageSchoolBooking', attempt);
        }
        this.startBasicTutorial(lessonId === 'basic' ? null : lessonId);
      },
    });
    if (!result.played) this.schoolPromptOpen = false;
  }

  showInstructorCutscene() {
    if (this.activeLocationId !== 'oshiageDrivingSchool' ||
        this.registry.get('oshiageInstructorMet') || this.instructorCutsceneOpen) return;
    this.instructorCutsceneOpen = true;
    const pages = [
      { who: 'YOU', pose: 'neutral', text: 'Wait... you look familiar. Like someone I know.' },
      { who: 'LADY INSTRUCTOR', pose: 'concerned', text: "What do you mean?! I'm just a random driving instructor." },
      { who: 'LADY INSTRUCTOR', pose: 'explaining', text: "Call me Lady Instructor. Now, are you here to learn how to drive, or to ask questions?" },
    ];
    let index = 0;
    let pieces = [];
    const render = () => {
      pieces.forEach(o => o?.destroy?.());
      pieces = [];
      const add = o => { pieces.push(o); return o; };
      const p = pages[index];
      add(this.add.rectangle(780, 420, 1560, 840, 0x020713, 0.83)
        .setDepth(100).setInteractive());
      add(this.add.rectangle(780, 470, 960, 475, 0x101926, 0.995)
        .setStrokeStyle(3, 0x86d8ef).setDepth(101));
      const key = schoolSayakaKey(p.pose);
      if (this.textures.exists(key)) {
        const source = this.textures.get(key).getSourceImage();
        add(this.add.image(465, 651, key).setOrigin(0.5, 1)
          .setScale(365 / source.height).setDepth(102));
      }
      add(TEXT(this, 687, 322, 'OSHIAGE // FIRST ENCOUNTER',
        { pixel: true, size: '12px', color: '#91eaff' }).setDepth(103));
      add(TEXT(this, 687, 377, p.who,
        { pixel: true, size: '11px', color: '#ffe6a0' }).setDepth(103));
      add(TEXT(this, 687, 427, p.text,
        { size: '20px', wrap: 500, color: '#effaff', spacing: 8 }).setDepth(103));
      const next = add(this.add.rectangle(1110, 620, 230, 54, 0x16363a, 1)
        .setStrokeStyle(2, 0x79eddd).setDepth(103)
        .setInteractive({ useHandCursor: true }));
      add(TEXT(this, 1110, 620, index === pages.length - 1 ? 'VISIT SCHOOL' : 'NEXT  >',
        { pixel: true, size: '10px', color: '#ebffff' }).setOrigin(0.5).setDepth(104));
      next.on('pointerdown', () => {
        if (++index < pages.length) { render(); return; }
        pieces.forEach(o => o?.destroy?.());
        pieces = [];
        this.instructorCutsceneOpen = false;
        this.registry.set('oshiageInstructorMet', true);
        saveSessionState(this.registry);
      });
    };
    render();
  }

  startBasicTutorial(lessonId = null) {
    const { id, car } = this.selectedCar();
    if (!car || car.crewLoan) {
      this.showOshiageNotice('SELECT YOUR OWN CAR AT YOUR WORKSHOP BEFORE A LESSON');
      return;
    }
    this.registry.set('selectedCarId', id);
    this.registry.set('selectedOpponentCarId', id);
    this.registry.set('selectedOpponentPaintColor', 0xffffff);
    this.registry.set('selectedOpponentCharacterId', 'emiKanzaki');
    this.registry.set('selectedOpponentEncounterRating', 2);
    this.registry.set('selectedOpponentEncounterAi', null);
    this.registry.set('selectedOpponentBuildState', null);
    this.registry.set('selectedOpponentDifficulty', 'EASY');
    this.registry.set('oshiageTrainingLesson', ['launch', 'standing', 'rolling'].includes(lessonId) ? lessonId : null);
    this.registry.set('selectedRaceCategory', 'TUTORIAL');
    this.registry.set('selectedRaceType', lessonId === 'rolling' ? 'Roll Race' : 'Standing Start');
    this.registry.set('selectedRaceDistanceM', lessonId === 'rolling' ? 804.672 : 402.336);
    this.registry.set('selectedRaceDeal', 'TUTORIAL');
    this.registry.set('selectedRaceStake', 0);
    this.registry.set('selectedRaceSpecialChallenge', false);
    this.registry.set('selectedRaceMeetOffer', null);
    this.registry.set('raceReturnScene', 'OshiageScene');
    this.registry.set('raceTimeOfDay', getWorldPhase());
    this.registry.set('raceDistrict', 'OSHIAGE');
    this.registry.set('raceLocationLabel', 'LADY INSTRUCTOR // ' + ({ launch: 'LAUNCH', standing: 'SHIFTING', rolling: 'ROLLING' }[lessonId] || 'BASIC DRIVING'));
    this.registry.set('oshiageLocation', 'oshiageDrivingSchool');
    saveSessionState(this.registry);
    this.scene.start('RaceScene');
  }

  drawMeet() {
    const progress = getOshiageEliteProgress(this.registry);
    const venueId = this.meetAlternative ? 'plaza' : 'underpass';
    const venue = OSHIAGE_ELITE_VENUES[venueId];
    const remaining = getOshiageEliteRemainingMs(this.registry, venueId);
    const { id: selectedCarId, car: playerCar } = this.selectedCar();
    const series = this.registry.get('oshiageEliteSeries');
    const continuing = Boolean(series?.active && series.venueId === venueId);
    const busyElsewhere = Boolean(series?.active && series.venueId !== venueId);
    const roundIndex = continuing ? Math.max(0, Math.min(2, Number(series.roundIndex || 0))) : 0;
    const opponent = progress.complete ? this.getEliteRival(venueId) : null;
    const rival = opponent ? characters[opponent.characterId] : null;
    this.sideHeader('SKYTREE ELITE MEETS', venue.label + ' // ' +
      (venue.distanceM < 500 ? '1/4 MILE' : '1/2 MILE'));

    if (!progress.complete) {
      this.addText(SIDE.x + 20, SIDE.y + 160, 'ELITE SHOWDOWNS LOCKED',
        { pixel: true, size: '9px', color: '#ffd68d', wrap: SIDE.w - 40 });
      this.addText(SIDE.x + 20, SIDE.y + 222,
        'Win the regional championship in all seven districts, including Shinjuku, to race at Skytree. This is separate from the professional drag complex.',
        { size: '13px', wrap: SIDE.w - 40 });
      this.addText(SIDE.x + 20, SIDE.y + 400,
        'CHAMPIONSHIPS  ' + progress.count + ' / ' + progress.required,
        { pixel: true, size: '9px', color: '#ffe394' });
    } else {
      const key = opponent && 'oshiageEliteRival_' + opponent.characterId;
      if (key && this.textures.exists(key)) {
        const source = this.textures.get(key).getSourceImage();
        this.own(this.add.image(267, 567, key).setOrigin(0.5, 1)
          .setScale(290 / source.height).setMask(this.stageMask).setDepth(11));
      }
      if (opponent && cars[opponent.carId] &&
          this.textures.exists(getCarBodyTextureKey(this, cars[opponent.carId]))) {
        this.drawOwnedCar(cars[opponent.carId], opponent.buildState,
          738, 462, 510, opponent.paintColor);
      }
      this.addText(SIDE.x + 20, SIDE.y + 154, 'ELITE OPPONENT',
        { pixel: true, size: '9px', color: '#f6d27b' });
      this.addText(SIDE.x + 20, SIDE.y + 191,
        rival?.name || 'TOKYO ELITE RACER', { pixel: true, size: '9px', wrap: SIDE.w - 40 });
      this.addText(SIDE.x + 20, SIDE.y + 253,
        'CAR // ' + String(cars[opponent?.carId]?.shortName || 'JDM BUILD').toUpperCase() +
        '\nSKILL // ELITE 5/5\nROUND // ' + (roundIndex + 1) + ' / 3' +
        '\nGRAND PRIZE // ' + MONEY(venue.prizeCash),
        { size: '13px', wrap: SIDE.w - 40, color: '#d9eff7', spacing: 9 });
      this.addText(SIDE.x + 20, SIDE.y + 389,
        venueId === 'plaza'
          ? 'WIN: RARE WHEEL OR 3 CAR COUPONS'
          : 'WIN: 2 CAR COUPONS',
        { pixel: true, size: '8px', wrap: SIDE.w - 40, color: '#ffe394' });
      this.addText(SIDE.x + 20, SIDE.y + 461,
        continuing ? 'STREAK ACTIVE // ROUND ' + (roundIndex + 1) + '/3'
          : busyElsewhere ? 'FINISH YOUR OTHER SKYTREE STREAK FIRST'
          : remaining > 0
            ? 'COOLDOWN // ' + Math.floor(remaining / 60000) + ':' +
              String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')
            : playerCar ? 'READY // THREE-RACE STREAK' : 'SELECT YOUR OWN CAR',
        { pixel: true, size: '9px', wrap: SIDE.w - 40,
          color: remaining > 0 ? '#ffbc96' : '#a8eacb' });
    }
    this.button(SIDE.x + SIDE.w / 2, SIDE.y + 571, SIDE.w - 40, 52,
      continuing ? 'START ROUND ' + (roundIndex + 1) + ' / 3' : 'START ELITE SHOWDOWN',
      () => this.startEliteRace(venueId), {
        disabled: !progress.complete || busyElsewhere || (!continuing && remaining > 0) ||
          !opponent || !playerCar || Boolean(playerCar.crewLoan) ||
          (continuing && series.playerCarId !== selectedCarId),
        accent: true, size: '8px',
      });
    if (series?.active) {
      this.button(SIDE.x + SIDE.w / 2, SIDE.y + 627, SIDE.w - 40, 37,
        'ABANDON CURRENT STREAK', () => this.abandonEliteStreak(), { size: '7px' });
    }
    const last = this.registry.get('oshiageEliteLastResult');
    this.addText(48, 653,
      'SKYTREE SHOWDOWNS // 3 RACES TO WIN // 15-MINUTE COOLDOWNS',
      { pixel: true, size: '9px', color: '#8feaff' });
    this.button(310, 747, 495, 70, 'SKYTREE UNDERPASS // ELITE', () => this.selectEliteVenue('underpass'),
      { accent: venueId === 'underpass', size: '8px' });
    this.button(853, 747, 495, 70, 'SKYTREE PLAZA // ELITE', () => this.selectEliteVenue('plaza'),
      { accent: venueId === 'plaza', size: '8px' });
    if (last?.venueId === venueId) {
      this.addText(48, 793,
        last.continues ? 'ROUND ' + last.roundNumber + ' / 3 CLEARED // NO PRIZE YET'
          : last.playerWon
            ? 'SHOWDOWN WON // ' + MONEY(last.cash) +
              (last.wheelLabel ? ' // ' + last.wheelLabel : ' // +' + last.couponAwards + ' COUPONS')
            : 'STREAK BROKEN // NO PRIZE // RETURN AFTER COOLDOWN',
        { size: '10px', color: '#d9e2ef' });
    }
  }

  selectEliteVenue(id) {
    if (!OSHIAGE_ELITE_VENUES[id]) return;
    this.meetAlternative = id === 'plaza';
    this.registry.set('oshiageEliteVenue', id);
    saveSessionState(this.registry);
    this.loadAndRender();
  }

  startEliteRace(venueId) {
    if (this.paintBusy || !getOshiageEliteProgress(this.registry).complete) return;
    const { id, car } = this.selectedCar();
    if (!car || car.crewLoan) return;
    const activeSeries = this.registry.get('oshiageEliteSeries');
    if (activeSeries?.active && activeSeries.venueId !== venueId) return;
    const continuing = Boolean(activeSeries?.active && activeSeries.venueId === venueId);
    if (continuing && activeSeries.playerCarId !== id) {
      this.showOshiageNotice('YOU MUST FINISH THIS THREE-RACE STREAK IN THE SAME CAR');
      return;
    }
    if (!continuing && getOshiageEliteRemainingMs(this.registry, venueId) > 0) return;
    const rival = this.getEliteRival(venueId);
    const venue = OSHIAGE_ELITE_VENUES[venueId];
    if (!rival || !venue) return;

    const roundIndex = continuing ? Number(activeSeries.roundIndex || 0) : 0;
    if (!continuing) {
      const startedAt = Date.now();
      const cooldowns = { ...(this.registry.get('oshiageEliteCooldowns') || {}) };
      cooldowns[venueId] = startedAt + OSHIAGE_ELITE_COOLDOWN_MS;
      this.registry.set('oshiageEliteCooldowns', cooldowns);
      this.registry.set('oshiageEliteSeries', {
        active: true, venueId, roundIndex: 0, playerCarId: id, startedAt,
      });
    }
    this.registry.set('oshiageEliteVenue', venueId);
    this.registry.set('oshiageLocation', 'oshiageSkytreeMeet');
    this.registry.set('district', 'OSHIAGE');
    this.registry.set('selectedCarId', id);
    this.registry.set('selectedOpponentCarId', rival.carId);
    this.registry.set('selectedOpponentPaintColor', rival.paintColor);
    this.registry.set('selectedOpponentCharacterId', rival.characterId);
    this.registry.set('selectedOpponentEncounterRating', 5);
    this.registry.set('selectedOpponentEncounterAi', rival.encounterAi);
    this.registry.set('selectedOpponentDifficulty', 'ELITE');
    this.registry.set('selectedOpponentBuildRating', 5);
    this.registry.set('selectedOpponentBuildArchetype', rival.buildState.buildArchetype);
    this.registry.set('selectedOpponentBuildState', rival.buildState);
    this.registry.set('selectedRaceCategory', 'OSHIAGE_ELITE');
    this.registry.set('selectedRaceType', rival.raceType);
    this.registry.set('selectedRaceDistanceM', rival.distanceM);
    this.registry.set('selectedRaceDeal', 'OSHIAGE_ELITE');
    this.registry.set('selectedRaceStake', 0);
    this.registry.set('selectedRaceSpecialChallenge', false);
    this.registry.set('selectedRaceMeetOffer', null);
    this.registry.set('raceReturnScene', 'OshiageScene');
    this.registry.set('raceTimeOfDay', getWorldPhase());
    this.registry.set('raceDistrict', 'OSHIAGE');
    this.registry.set('raceLocationLabel', venue.label + ' // ' + (roundIndex + 1) + '/3');
    saveSessionState(this.registry);
    this.scene.start('RaceScene');
  }

  abandonEliteStreak() {
    const series = this.registry.get('oshiageEliteSeries');
    if (!series?.active) return;
    this.registry.set('oshiageEliteSeries', null);
    this.registry.set('oshiageEliteLastResult', {
      venueId: series.venueId, playerWon: false, abandoned: true,
      cash: 0, at: Date.now(),
    });
    saveSessionState(this.registry);
    this.renderView();
  }

  showOshiageNotice(message) {
    const objs = [];
    const add = obj => { objs.push(obj); return obj; };
    add(this.add.rectangle(780, 420, 830, 150, 0x111e2c, 0.98)
      .setStrokeStyle(2, 0x9de8f0).setDepth(80));
    add(TEXT(this, 780, 420, message, { pixel: true, size: '9px', wrap: 740,
      align: 'center', color: '#ecffff' }).setOrigin(0.5).setDepth(81));
    this.time.delayedCall(1900, () => objs.forEach(obj => obj?.destroy?.()));
  }

  drawCustomWorks() {
    this.sideHeader('CUSTOM WORKS', 'Paint & Rims // Oshiage');
    this.addText(SIDE.x + 20, SIDE.y + 155, 'EXTERIOR CUSTOMISATION',
      { pixel: true, size: '10px', color: '#ffe5b0', wrap: SIDE.w - 40 });
    this.addText(SIDE.x + 20, SIDE.y + 222,
      'PAINT: Preset finishes ¥8,000, or custom RGB for ¥16,000.\n\n' +
      'RIMS: Try and buy standard, tuner and hero wheel designs, or install designs already in your collection.',
      { size: '13px', wrap: SIDE.w - 40, color: '#e1eff6', spacing: 6 });
    this.addText(SIDE.x + 20, SIDE.y + 450,
      'BODYKIT // COMING SOON\nOld bodykits have been retired to match the new car assets.',
      { size: '11px', wrap: SIDE.w - 40, color: '#9cb2c0', spacing: 6 });
    this.button(SIDE.x + SIDE.w / 2, SIDE.y + 557, SIDE.w - 40, 50,
      'ENTER PAINT BOOTH  >', () => this.openCustomWorksRoom('paint'),
      { accent: true, size: '8px' });
    this.addText(48, 654, 'OSHIAGE CUSTOM WORKS // SELECT A SERVICE',
      { pixel: true, size: '10px', color: '#8feaff' });
    this.button(225, 743, 338, 65, 'PAINT', () => this.openCustomWorksRoom('paint'),
      { accent: true, size: '9px' });
    this.button(590, 743, 338, 65, 'RIMS', () => this.openCustomWorksRoom('rims'),
      { size: '9px' });
    this.button(955, 743, 338, 65, 'BODYKIT // COMING SOON', null,
      { disabled: true, size: '7px' });
  }

  openCustomWorksRoom(room) {
    if (!['paint', 'rims'].includes(room) || this.paintBusy) return;
    this.room = room;
    this.pendingPaint = null;
    if (room === 'paint') this.paintMode = 'preset';
    if (room === 'rims') {
      this.selectedRimIndex = -1;
      this.rimPreview = false;
      this.rimCycle = Math.floor(Date.now() / RIMS_REFRESH_MS);
    }
    this.loadAndRender(room === 'paint' ? () => this.rollPaintCarIn() : null);
  }

  rimWallRect() {
    // Match renderView's contain transform exactly: overlay sprites must
    // register to the authored slots even if the artwork is letterboxed.
    const asset = this.backgroundAsset();
    const image = this.textures.exists(asset.key)
      ? this.textures.get(asset.key).getSourceImage() : null;
    const sourceW = Number(image?.width || STAGE.w);
    const sourceH = Number(image?.height || STAGE.h);
    const scale = Math.min(STAGE.w / sourceW, STAGE.h / sourceH);
    const width = sourceW * scale, height = sourceH * scale;
    return {
      x: STAGE.x + (STAGE.w - width) / 2,
      y: STAGE.y + (STAGE.h - height) / 2,
      width, height,
    };
  }

  drawCustomWorksSpecialist({ x = 1065, feetY = STAGE.y + STAGE.h - 14,
    displayHeight = 272 } = {}) {
    // Yuna Kisaragi previously ran the Tokyo Central wheel counter. Her
    // character ID and normal pose are reused in both Oshiage workrooms.
    const characterId = CENTRAL_TOKYO_CHARACTER_IDS.autoMarket.wheels;
    const asset = getCharacterVisualAsset(characterId, 'normal');
    if (!asset?.key || !this.textures.exists(asset.key)) return;
    const texture = this.textures.get(asset.key);
    texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    const source = texture.getSourceImage();
    const srcHeight = Math.max(1, Number(source?.height || source?.naturalHeight || 1));
    this.own(this.add.ellipse(x, feetY - 7, 107, 17, 0x02060b, 0.43)
      .setDepth(24.7).setMask(this.stageMask));
    this.own(this.add.image(x, feetY, asset.key)
      .setOrigin(0.5, 1)
      .setScale(displayHeight / srcHeight)
      .setFlipX(true)
      .setDepth(25)
      .setMask(this.stageMask));
  }

  drawRimShop() {
    const listings = getOshiageRimListings();
    const { id, car, state } = this.selectedCar();
    const selected = listings[this.selectedRimIndex] || null;
    const quote = selected ? getOshiageRimQuote(this.registry, id, selected.id) : null;
    this.sideHeader('CUSTOM WORKS // RIMS', 'Yuna Kisaragi // Wheel specialist');
    this.rimCarObjects = [];

    // The cabinet geometry is authored into oshiage_wheels_day/night.
    // Left: 2x2 STANDARD. Middle: 2 horizontal TUNER. Right: 2 HERO
    // stacked vertically. Position against the contained image, not STAGE.
    const rack = this.rimWallRect();
    listings.forEach((option, index) => {
      if (!this.textures.exists(option.textureKey)) return;
      const slot = OSHIAGE_RIM_SLOTS[index];
      if (!slot) return;
      const chosen = this.selectedRimIndex === index;
      const x = rack.x + rack.width * slot.x;
      const y = rack.y + rack.height * slot.y;
      const diameter = chosen ? slot.diameter + 4 : slot.diameter;
      const img = this.own(this.add.image(x, y, option.textureKey)
        .setDisplaySize(diameter, diameter)
        .setMask(this.stageMask).setDepth(18)
        .setInteractive({ useHandCursor: true }));
      img.texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
      img.on('pointerdown', () => {
        if (!this.rimConfirmOpen && !this.paintBusy) this.selectRim(index);
      });
    });

    if (car && this.rimPreview && selected) {
      const previewState = { ...state, customWheelId: selected.id };
      // Reuse the exact fitted pair and stock car body as garage/paint studio.
      // The preview modifies only this temporary object, not saved car state.
      this.rimCarObjects = this.drawOwnedCar(
        car, previewState, 603, 453, 695, getCarPaintColor(state), 21
      );
    } else if (!car) {
      this.addText(STAGE.x + 125, STAGE.y + STAGE.h - 58,
        'SELECT YOUR CAR AT A WORKSHOP TO PREVIEW RIMS',
        { pixel: true, size: '9px', color: '#eff7ff', depth: 27 });
    }

    if (!car) {
      this.addText(SIDE.x + 20, SIDE.y + 169, 'NO CAR SELECTED',
        { pixel: true, size: '10px', color: '#ffc6a8' });
      this.addText(SIDE.x + 20, SIDE.y + 226,
        'Choose an owned car before trying, buying or installing rims. Your previously purchased rims stay in your collection.',
        { size: '12px', wrap: SIDE.w - 40 });
    } else if (!selected) {
      this.addText(SIDE.x + 20, SIDE.y + 170,
        String(car.shortName || car.name).toUpperCase(),
        { pixel: true, size: '10px', color: '#d9eefd', wrap: SIDE.w - 40 });
      this.addText(SIDE.x + 20, SIDE.y + 242,
        'Choose a wheel on the wall. Yuna will show it on your car.',
        { size: '13px', wrap: SIDE.w - 40, spacing: 5 });
      this.addText(SIDE.x + 20, SIDE.y + 347,
        'Owned wheels can be reinstalled free.',
        { size: '12px', wrap: SIDE.w - 40, color: '#9dc6d6' });
    } else {
      const locked = quote?.locked;
      const tierColor = selected.tier === 'HERO' ? '#ff9fc7' :
        selected.tier === 'TUNER' ? '#ffe08a' : '#8fe7ff';
      this.addText(SIDE.x + 20, SIDE.y + 166, selected.tier + ' RIMS',
        { pixel: true, size: '9px', color: tierColor, wrap: SIDE.w - 40 });
      this.addText(SIDE.x + 20, SIDE.y + 214, selected.label.toUpperCase(),
        { pixel: true, size: '11px', color: '#f4faff', wrap: SIDE.w - 40 });
      this.addText(SIDE.x + 20, SIDE.y + 297, selected.source,
        { size: '12px', color: '#9cbbc9', wrap: SIDE.w - 40 });
      this.addText(SIDE.x + 20, SIDE.y + 371,
        quote?.status === 'INSTALLED' ? 'FITTED TO THIS CAR'
          : quote?.owned ? 'OWNED // FREE TO INSTALL'
            : 'PRICE // ' + MONEY(quote?.price || 0),
        { pixel: true, size: '9px', color: '#ffe5a5', wrap: SIDE.w - 40 });
      if (locked || quote?.status === 'UNAFFORDABLE') {
        this.addText(SIDE.x + 20, SIDE.y + 440,
          locked ? 'WHEEL FITMENT LOCKED' : 'NOT ENOUGH CASH',
          { pixel: true, size: '8px', color: '#ffbaba', wrap: SIDE.w - 40 });
      }
      this.button(SIDE.x + SIDE.w / 2, SIDE.y + 601, SIDE.w - 40, 48,
        quote?.owned ? 'INSTALL RIMS' : 'BUY & INSTALL // ' + MONEY(selected.price),
        () => this.confirmRimTransaction(selected, id),
        { disabled: !['OWNED', 'BUY'].includes(quote?.status), accent: true, size: '8px' });
    }

    const restoreAllowed = Boolean(car && state.customWheelId &&
      !car.tuningLocked && !car.crewLoan && !state.collector && !state.immutable &&
      !state.tuningLocked && !state.crewLoan);
    this.button(SIDE.x + SIDE.w / 2, SIDE.y + 535, SIDE.w - 40, 42,
      restoreAllowed ? 'RESTORE STOCK RIMS' : 'STOCK RIMS',
      () => {
        if (!restoreStockOshiageRims(this.registry, id)) return;
        saveSessionState(this.registry);
        this.renderView();
        this.showOshiageNotice('ORIGINAL FACTORY RIMS RESTORED');
      }, { disabled: !restoreAllowed, size: '8px' });

    this.addText(48, 654, 'RIMS // 4 STANDARD LEFT · 2 TUNER CENTRE · 2 HERO RIGHT',
      { pixel: true, size: '9px', color: '#8feaff' });
    this.drawCustomWorksSpecialist({ x: 1054, feetY: STAGE.y + STAGE.h - 10 });
    this.button(326, 745, 550, 64, 'RETURN TO CUSTOM WORKS', () => {
      this.room = 'outside';
      this.selectedRimIndex = -1;
      this.rimPreview = false;
      this.rimCarObjects = [];
      this.loadAndRender();
    }, { size: '8px' });
    this.button(854, 745, 550, 64, 'BACK TO RIM WALL', () => {
      this.selectedRimIndex = -1;
      this.rimPreview = false;
      this.rimCarObjects = [];
      this.renderView();
    }, { disabled: !this.rimPreview, size: '8px' });
    this.addText(48, 798,
      selected
        ? 'RIMS ARE PREVIEW ONLY UNTIL YOU CONFIRM THE PURCHASE OR INSTALLATION.'
        : 'TAP ANY RIM ON THE WALL TO START A LIVE FITMENT PREVIEW.',
      { size: '9px', color: '#a1bdcc' });
  }

  selectRim(index) {
    const listings = getOshiageRimListings();
    if (index < 0 || index >= listings.length || this.rimConfirmOpen ||
        this.paintBusy) return;
    const shouldRollIn = !this.rimPreview && Boolean(this.selectedCar().car);
    this.selectedRimIndex = index;
    this.rimPreview = true;
    this.renderView();
    // Only animate the first preview after entering the shop or returning to
    // the wall. Selecting another rim while the car is displayed is instant.
    if (shouldRollIn) this.rollRimCarIn();
  }

  confirmRimTransaction(option, carId) {
    if (this.rimConfirmOpen || this.paintBusy) return;
    const quote = getOshiageRimQuote(this.registry, carId, option?.id);
    if (!['OWNED', 'BUY'].includes(quote.status)) return;
    this.rimConfirmOpen = true;
    const objects = [];
    const add = obj => { objects.push(obj); return obj; };
    const close = () => {
      objects.forEach(obj => obj?.destroy?.());
      this.rimConfirmOpen = false;
    };
    add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.80)
      .setDepth(240).setInteractive());
    add(this.add.rectangle(780, 420, 770, 318, 0x0a1622, 0.998)
      .setStrokeStyle(3, 0x62e8c7).setDepth(241));
    add(TEXT(this, 780, 318, quote.owned ? 'INSTALL RIMS?' : 'BUY & INSTALL RIMS?',
      { pixel: true, size: '15px', color: '#f5ffff' }).setOrigin(0.5).setDepth(242));
    add(TEXT(this, 780, 394, option.label + '\n' +
      (quote.owned ? 'ALREADY OWNED // NO CHARGE' : MONEY(quote.price)) +
      '\nInstall on ' + String(cars[carId]?.shortName || 'YOUR CAR') + '?',
      { size: '16px', color: '#c9e5ed', align: 'center', spacing: 6 })
      .setOrigin(0.5).setDepth(242));
    const cancel = add(this.add.rectangle(637, 516, 226, 50, 0x18232a)
      .setStrokeStyle(2, 0x8299a5).setDepth(242).setInteractive({ useHandCursor: true }));
    add(TEXT(this, 637, 516, 'CANCEL', { pixel: true, size: '9px' })
      .setOrigin(0.5).setDepth(243));
    cancel.on('pointerdown', close);
    const confirm = add(this.add.rectangle(921, 516, 232, 50, 0x153a31)
      .setStrokeStyle(2, 0x62e8c7).setDepth(242).setInteractive({ useHandCursor: true }));
    add(TEXT(this, 921, 516, quote.owned ? 'INSTALL' : 'BUY & INSTALL',
      { pixel: true, size: '9px' }).setOrigin(0.5).setDepth(243));
    confirm.on('pointerdown', () => {
      close();
      const result = buyOrInstallOshiageRim(this.registry, carId, option.id);
      if (!result.ok) {
        this.renderView();
        this.showOshiageNotice('TRANSACTION UNAVAILABLE // PLEASE TRY AGAIN');
        return;
      }
      saveSessionState(this.registry);
      this.renderView();
      this.showOshiageNotice(result.spent > 0
        ? 'RIMS PURCHASED & INSTALLED // ' + MONEY(result.spent)
        : 'OWNED RIMS INSTALLED // NO CHARGE');
    });
  }

  drawPaintStudio() {
    const { id, car, state } = this.selectedCar();
    const mode = this.paintMode === 'custom' ? 'custom' : 'preset';
    const fee = mode === 'custom' ? 16000 : 8000;
    this.sideHeader('SPRAY PAINT STUDIO',
      car ? String(car.shortName || car.name || id).toUpperCase() : 'NO CAR SELECTED');

    if (!car) {
      this.addText(SIDE.x + 20, SIDE.y + 190,
        'Choose a car from your workshop before using the paint booth.',
        { size: '13px', wrap: SIDE.w - 40 });
    } else {
      const current = getCarPaintColor(state);
      if (this.pendingPaint == null) {
        this.pendingPaint = mode === 'custom' && this.customPaintColor != null
          ? this.customPaintColor : current;
      }
      const paintable = hasLayeredPaintAssets(this, car);
      const canBuy = Number(this.registry.get('garageTier') || 0) >= 1;
      // Same side-on car renderer as garage and dyno. The target is positioned
      // well inside the high central spray bay, not on the foreground floor.
      // 30% smaller than the previous 690px paint sprite, with its registration
      // slightly higher in the booth and centred away from Yuna at the right.
      this.paintObjects = this.drawOwnedCar(
        car, state, 609, 345, 483, this.pendingPaint
      );

      this.addText(SIDE.x + 20, SIDE.y + 169, mode === 'preset' ? 'FACTORY PALETTE' : 'CUSTOM RGB MIX',
        { pixel: true, size: '9px', color: '#ffe394' });
      if (mode === 'preset') {
        this.addText(SIDE.x + 20, SIDE.y + 217,
          'SELECT A PRESET COLOUR', { pixel: true, size: '8px', color: '#96b6c7' });
        PAINT_PRESETS.forEach((preset, i) => {
          const x = SIDE.x + 48 + (i % 5) * 62;
          const y = SIDE.y + 291 + Math.floor(i / 5) * 68;
          const active = preset.color === this.pendingPaint;
          const swatch = this.own(this.add.rectangle(x, y, 44, 41, preset.color)
            .setStrokeStyle(active ? 4 : 2, active ? 0xe9ffff : 0x547087).setDepth(33));
          if (paintable) swatch.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            if (this.paintBusy) return;
            this.pendingPaint = preset.color;
            this.renderView();
          });
        });
      } else {
        this.addText(SIDE.x + 20, SIDE.y + 212,
          'MIX YOUR OWN CUSTOM COLOUR', { pixel: true, size: '8px', color: '#96b6c7' });
        const rgb = paintColorToRgb(this.pendingPaint);
        ['r', 'g', 'b'].forEach((ch, i) => {
          const y = SIDE.y + 294 + i * 67;
          this.addText(SIDE.x + 30, y - 11, ch.toUpperCase(),
            { pixel: true, size: '9px', color: '#e9faff' });
          this.button(SIDE.x + 112, y, 48, 42, '-', () => this.updatePaintChannel(ch, -15), { size: '15px' });
          this.addText(SIDE.x + 190, y - 11, String(rgb[ch]).padStart(3, '0'),
            { pixel: true, size: '9px', color: '#ffe5a1' });
          this.button(SIDE.x + 268, y, 48, 42, '+', () => this.updatePaintChannel(ch, 15), { size: '15px' });
        });
        const chip = this.own(this.add.rectangle(SIDE.x + SIDE.w / 2,
          SIDE.y + 510, SIDE.w - 72, 26, this.pendingPaint).setStrokeStyle(2, 0xcde4f3).setDepth(33));
        chip.setAlpha(1);
      }

      this.addText(SIDE.x + 20, SIDE.y + 536,
        !paintable ? 'PAINT LAYERS NOT AVAILABLE'
          : !canBuy ? 'CANAL YARD REQUIRED'
            : this.pendingPaint === current ? 'ALREADY INSTALLED'
              : (mode === 'custom' ? 'CUSTOM PAINT // ' : 'PRESET PAINT // ') + MONEY(fee),
        { pixel: true, size: '8px', color: '#f6dda0', wrap: SIDE.w - 40 });
      this.button(SIDE.x + SIDE.w / 2, SIDE.y + 614, SIDE.w - 40, 48,
        'APPLY PAINT  //  ' + MONEY(fee),
        () => this.applyPaint(id, this.pendingPaint, fee),
        { disabled: !paintable || !canBuy || this.pendingPaint === current ||
          Number(this.registry.get('cash') || 0) < fee || this.paintBusy,
          accent: true, size: '8px' });
    }

    this.drawCustomWorksSpecialist({ x: 1066, feetY: STAGE.y + STAGE.h - 8 });
    this.addText(48, 654, 'CUSTOM WORKS // SPRAY BOOTH // SIDE PROFILE',
      { pixel: true, size: '10px', color: '#8feaff' });
    this.button(206, 744, 315, 66, 'PRESET // ¥8,000', () => this.setPaintMode('preset'),
      { accent: mode === 'preset', size: '8px' });
    this.button(542, 744, 315, 66, 'CUSTOM RGB // ¥16,000', () => this.setPaintMode('custom'),
      { accent: mode === 'custom', size: '8px' });
    this.button(951, 744, 318, 66, 'RETURN TO CUSTOM WORKS', () => {
      this.room = 'outside'; this.pendingPaint = null; this.loadAndRender();
    }, { size: '7px' });
    this.addText(48, 794, this.paintBusy ? 'CAR ENTERING / SPRAYING...' :
      'Side-entry spray bay // real car paint layers // colour preview before purchase.',
      { size: '9px', color: '#9cb8c8' });
  }

  setPaintMode(mode) {
    if (!['preset', 'custom'].includes(mode) || this.paintBusy) return;
    if (this.paintMode === 'custom') this.customPaintColor = this.pendingPaint;
    this.paintMode = mode;
    const current = getCarPaintColor(this.selectedCar().state);
    this.pendingPaint = mode === 'custom'
      ? (this.customPaintColor ?? current) : current;
    this.renderView();
  }

  updatePaintChannel(channel, amount) {
    if (this.paintMode !== 'custom' || this.paintBusy) return;
    const rgb = paintColorToRgb(this.pendingPaint);
    rgb[channel] = Phaser.Math.Clamp(rgb[channel] + amount, 0, 255);
    this.pendingPaint = rgbToPaintColor(rgb.r, rgb.g, rgb.b);
    this.customPaintColor = this.pendingPaint;
    this.renderView();
  }

  drawOwnedCar(car, state, x, y, width, paintColor, depth = 11) {
    const bodyKey = getCarBodyTextureKey(this, car);
    const wheelVisual = getVisualModWheelVisual(car, state);
    if (!this.textures.exists(bodyKey) || !wheelVisual?.wheelKey ||
        !this.textures.exists(wheelVisual.wheelKey)) return [];
    const wheelSrc = this.textures.get(wheelVisual.wheelKey).getSourceImage();
    const scale = getCarBodyScaleForWidth(this, car, width);
    const fit = getWheelPairFit(wheelVisual, scale, false, wheelSrc);
    const visualY = y + Number(car.visual.renderOffsetY || 0) * scale +
      (car.visual.referenceStandard ? width * (232 / 1200) : 0);
    const drawX = getReferenceRightX(car, x, scale);
    const rearX = drawX + fit.rear.offsetX, frontX = drawX + fit.front.offsetX;
    const rearY = visualY + fit.rear.offsetY, frontY = visualY + fit.front.offsetY;
    const rearBottom = rearY + getWheelContactOffsetY(wheelSrc, fit.rear.wheelScale);
    const frontBottom = frontY + getWheelContactOffsetY(wheelSrc, fit.front.wheelScale);
    const objects = [];
    const rollingWheels = [];
    const track = obj => {
      obj.setMask?.(this.stageMask);
      this.own(obj);
      objects.push(obj);
      return obj;
    };
    track(this.add.ellipse(x, Math.max(rearBottom, frontBottom) + 4, width * 0.85, 34, 0x000000, 0.58).setDepth(depth - 1));
    for (const axle of [fit.rear, fit.front]) {
      const wheelX = drawX + axle.offsetX;
      const wheelY = visualY + axle.offsetY;
      track(this.add.circle(wheelX, wheelY, axle.backingRadius || 10, 0x020304).setDepth(depth));
      const wheelSprite = track(this.add.image(wheelX, wheelY, wheelVisual.wheelKey)
        .setScale(axle.wheelScale).setDepth(depth + 0.2));
      rollingWheels.push({
        sprite: wheelSprite,
        radius: Math.max(9, Number(axle.backingRadius || 0) ||
          wheelSprite.displayWidth * 0.48),
      });
    }
    const body = createCarBodyLayers(this, car, {
      x: drawX, y: visualY, scale, depth: depth + 1, paintColor,
    });
    for (const obj of body.objects) track(obj);
    const mods = createVisualModLayers(this, car, state, {
      x: drawX, y: visualY, scale, depth: depth + 1.01, paintColor, bodyLayers: body,
    });
    for (const obj of mods) track(obj);
    // Metadata stays on the returned array, never in save data. Only tyre
    // textures rotate; the body, paint, decals, shadows and hub masks move
    // horizontally together.
    objects.rollingWheels = rollingWheels;
    return objects;
  }

  animateShopCarEntry(objects, { duration = 3950, distance = 1100 } = {}) {
    if (!objects?.length || this.paintBusy) return;
    if (this.entryTween) {
      this.entryTween.stop();
      this.entryTween = null;
    }
    this.paintBusy = true;

    const originX = objects.map(obj => ({ obj, x: obj.x }));
    const wheels = (objects.rollingWheels || []).filter(wheel => wheel?.sprite);
    const progress = { travel: 0 };
    for (const entry of originX) entry.obj.x = entry.x - distance;

    // A single progress tween drives the car AND angular wheel displacement.
    // Using travelled distance / visible tyre radius synchronises rotation
    // with translation, unlike the previous horizontal slide with static rims.
    this.entryTween = this.tweens.add({
      targets: progress,
      travel: distance,
      duration,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        for (const entry of originX) {
          entry.obj.x = entry.x - distance + progress.travel;
        }
        for (const wheel of wheels) {
          const degrees = progress.travel / wheel.radius * (180 / Math.PI);
          wheel.sprite.setAngle(degrees);
        }
      },
      onComplete: () => {
        this.entryTween = null;
        if (!this.sys.isActive()) return;
        this.paintBusy = false;
        this.renderView(); // Stationary car; no replay on colour / rim selection.
      },
    });
  }

  rollRimCarIn() {
    if (this.room !== 'rims' || !this.rimPreview) return;
    this.animateShopCarEntry(this.rimCarObjects, { duration: 3950, distance: 1090 });
  }

  rollPaintCarIn() {
    if (this.room !== 'paint') return;
    this.animateShopCarEntry(this.paintObjects, { duration: 4100, distance: 1100 });
  }
  applyPaint(carId, color, cost) {
    if (this.paintBusy || this.room !== 'paint') return;
    const owned = this.registry.get('ownedCarIds') || [];
    if (!owned.includes(carId)) return;
    const current = (this.registry.get('carStates') || {})[carId] || {};
    const paintColor = normalisePaintColor(color);
    if (getCarPaintColor(current) === paintColor) return;
    if (Number(this.registry.get('garageTier') || 0) < 1) return;
    if (cost !== (this.paintMode === 'custom' ? 16000 : 8000)) return;
    const cash = Number(this.registry.get('cash') || 0);
    if (cash < cost) return;
    this.paintBusy = true;
    // Commit immediately so leaving/reloading mid-animation cannot lose a paid paint job.
    this.registry.set('carStates', {
      ...(this.registry.get('carStates') || {}),
      [carId]: { ...current, paintColor },
    });
    this.registry.set('cash', cash - cost);
    saveSessionState(this.registry);
    this.cashText.setText(MONEY(cash - cost));
    setCarBodyPaint(this.paintObjects, paintColor);
    const sparkObjects = [];
    for (let i = 0; i < 34; i++) {
      const x = 310 + Phaser.Math.Between(0, 630);
      const y = 263 + Phaser.Math.Between(0, 155);
      const mist = this.add.circle(x, y, Phaser.Math.Between(9, 26), paintColor, 0.25)
        .setMask(this.stageMask).setDepth(24);
      sparkObjects.push(mist);
      this.tweens.add({ targets: mist, alpha: 0, x: x + 55,
        duration: 480 + i * 18, delay: i * 23, onComplete: () => mist.destroy() });
    }
    this.time.delayedCall(1250, () => {
      this.paintBusy = false;
      this.pendingPaint = paintColor;
      this.renderView();
      this.addText(405, 652, 'PAINT COMPLETE // ' + MONEY(cost), {
        pixel: true, size: '12px', color: '#8cffe4', depth: 34,
      });
    });
  }
  openMap() {
    if (this.paintBusy) return;
    showTravelMap(this, {
      currentLocationId: this.activeLocationId,
      title: 'TOKYO REGION MAP', actionVerb: 'DRIVE', allowCurrentAction: false,
      onHome: (workshopLocationId, cost) => this.returnHome(workshopLocationId, cost),
      onTravel: (locationId, cost) => this.travelTo(locationId, cost),
    });
  }
  travelTo(locationId, cost = 0) {
    if (this.paintBusy) return;
    const target = getTravelLocation(locationId);
    if (!target) return;
    const amount = Math.max(0, Number(cost || 0));
    const cash = Number(this.registry.get('cash') || 0);
    if (cash < amount) return;
    this.registry.set('cash', cash - amount);
    this.registry.set('meetStranded', false);
    if (target.regionId === 'OSHIAGE') {
      this.registry.set('district', 'OSHIAGE');
      this.showLocation(locationId);
      return;
    }
    if (target.regionId === 'CENTRAL_TOKYO') {
      this.registry.set('centralTokyoLocation', locationId);
      this.registry.set('district', 'CENTRAL_TOKYO');
      saveSessionState(this.registry);
      this.scene.start('CentralTokyoScene', { locationId });
      return;
    }
    this.registry.set('district', target.regionId);
    this.registry.set('meetLocation', locationId);
    saveSessionState(this.registry);
    this.scene.start('MeetScene');
  }
  returnHome(workshopLocationId = 'shinonomeWorkshop', cost = 500) {
    const cash = Number(this.registry.get('cash') || 0);
    const price = Math.max(0, Number(cost || 0));
    if (cash < price || this.paintBusy) return;
    this.registry.set('cash', cash - price);
    this.registry.set('workshopLocationId', workshopLocationId);
    this.registry.set('meetStranded', false);
    saveSessionState(this.registry);
    try {
      sessionStorage.setItem('tokyoShiftInternalReload', '1');
      sessionStorage.setItem('tokyoShiftForceGarage', '1');
    } catch (e) {}
    window.location.reload();
  }
}
