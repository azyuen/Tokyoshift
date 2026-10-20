// Oshiage satellite district. The seven regional championships remain unchanged.
import { cars } from '../data/cars.js?v=20261011-r479';
import {
  OSHIAGE_SCHOOL_LESSONS, bookOshiageLesson, consumeOshiageAttempt,
  isOshiageVoucherAvailable,
} from '../data/oshiageSchool.js?v=20261016-r536';
import { characters, getCharacterAssetUrl, getCharacterVisualAsset, getCharacterVisualForContext, CENTRAL_TOKYO_CHARACTER_IDS } from '../data/characters.js?v=20261013-r494';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261007-r411';
import { getOshiageEliteProgress, getOshiageEliteRemainingMs, getOshiageElitePrize, OSHIAGE_ELITE_VENUES } from '../data/oshiageElite.js?v=20261015-r522';
import {
  getOshiageShowdownLineup, getOshiageShowdownAccess,
  beginOshiageShowdown, prepareNextOshiageShowdownHeat,
} from '../data/oshiageShowdown.js?v=20261015-r522';
import { getBaseCarId } from '../data/carOwnership.js?v=20261011-r479';
import { isActiveCrewLoanCar } from '../data/crewSystem.js?v=20261020-r615';
import { getWorldPhase } from '../environment/WorldClock.js?v=20260929-r286';
import { showTravelMap } from '../ui/TravelMap.js?v=20261020-r615';
import { getTravelLocation } from '../data/travelRegions.js?v=20261015-r522';
import { saveSessionState } from '../state/GameState.js?v=20261014-r501';
import { getPowerTorqueDisplay } from '../data/carRatings.js?v=20261004-r325';
import { getVehiclePerformance } from '../vehicles/VehiclePerformance.js?v=20261011-r479';
import { restorePreferredCar } from '../state/CarSelection.js?v=20261016-r530';
import { playMangaCutscene, sceneCutsceneActive } from '../ui/MangaCutscene.js?v=20261017-r572';
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
  SHOWDOWN_STAGE, SHOWDOWN_SIDE, SHOWDOWN_STRIP,
} from '../ui/ShowdownLayout.js?v=20261016-shared-showdown';
import {
  getOshiageRimListings, getOshiageRimQuote, buyOrInstallOshiageRim,
  restoreStockOshiageRims, RIMS_REFRESH_MS, OSHIAGE_RIM_SLOTS,
} from '../data/oshiageRims.js?v=20261020-r615';

const PIXEL = '"Silkscreen", monospace';
const BODY = '"Rajdhani", monospace';
const STAGE = SHOWDOWN_STAGE;
const SIDE = SHOWDOWN_SIDE;
const STRIP = SHOWDOWN_STRIP;
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

function colorToHsv(color) {
  const { r, g, b } = paintColorToRgb(color);
  const R=r/255, G=g/255, B=b/255, hi=Math.max(R,G,B), lo=Math.min(R,G,B), d=hi-lo;
  let h=0;
  if (d) h=hi===R ? (G-B)/d%6 : hi===G ? (B-R)/d+2 : (R-G)/d+4;
  return { h:(h*60+360)%360, s:hi ? d/hi : 0, v:hi };
}
function hsvToColor(h,s,v) {
  h=(((h%360)+360)%360)/60;
  const C=Math.max(0,Math.min(1,v))*Math.max(0,Math.min(1,s));
  const X=C*(1-Math.abs(h%2-1)), m=Math.max(0,Math.min(1,v))-C;
  const [r,g,b]=h<1?[C,X,0]:h<2?[X,C,0]:h<3?[0,C,X]:h<4?[0,X,C]:h<5?[X,0,C]:[C,0,X];
  return rgbToPaintColor(255*(r+m),255*(g+m),255*(b+m));
}

export default class OshiageScene extends Phaser.Scene {
  constructor() { super('OshiageScene'); }

  init(data = {}) {
    restorePreferredCar(this.registry);
    // Bookings are valid only for an uninterrupted RaceScene lesson session.
    // Returning to the school (or reopening after a reload) forfeits all unused
    // tries; they must never become prepaid passes on a future visit.
    if (this.registry.get('oshiageSchoolBooking')) {
      this.registry.set('oshiageSchoolBooking', null);
      this.registry.set('oshiageTrainingLesson', null);
      saveSessionState(this.registry);
    }
    this.activeLocationId = LOCATIONS[data.locationId] ? data.locationId :
      (LOCATIONS[this.registry.get('oshiageLocation')] ? this.registry.get('oshiageLocation') : 'oshiageDrivingSchool');
    this.room = ['paint', 'rims'].includes(data.room) ? data.room : 'outside';
    if (this.activeLocationId !== 'oshiageCustomWorks') this.room = 'outside';
    this.lessonIndex = Math.max(0, Math.min(3, Number(this.registry.get('oshiageLessonTab') || 0)));
    this.schoolCarEntered = false;
    this.schoolPromptOpen = false;
    const activeShowdown = this.registry.get('oshiageEliteSeries');
    this.meetAlternative = (activeShowdown?.active ? activeShowdown.venueId :
      this.registry.get('oshiageEliteVenue')) === 'plaza';
    this.showdownLineups = {};
    this.showdownPreviewIndex = activeShowdown?.active ? Number(activeShowdown.roundIndex || 0) : 0;
    this.showdownSwitching = false;
    this.showdownLaunching = false;
    this.paintMode = 'preset';
    this.customPaintColor = null;
    this.paintPickerHue = null;
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

  isCrewCarSelected() {
    return isActiveCrewLoanCar(this.registry, this.registry.get('selectedCarId'));
  }

  isSchoolCarEligible(car, id) {
    return Boolean(car && (!car.crewLoan || isActiveCrewLoanCar(this.registry, id)) &&
      !car.ginzaDemo);
  }

  selectedCar() {
    const id = String(this.registry.get('selectedCarId') || '');
    const owned = this.registry.get('ownedCarIds') || [];
    const car = owned.includes(id) ? (cars[id] || cars[getBaseCarId(id)]) : null;
    const state = (this.registry.get('carStates') || {})[id] || {};
    return { id, car, state };
  }

  getEliteLineup(venueId) {
    const active = this.registry.get('oshiageEliteSeries');
    if (active?.active && active.venueId === venueId) {
      return getOshiageShowdownLineup(this.registry, venueId);
    }
    if (!this.showdownLineups?.[venueId]) {
      this.showdownLineups[venueId] = getOshiageShowdownLineup(this.registry, venueId);
    }
    return this.showdownLineups[venueId];
  }

  getEliteRival(venueId) {
    const active = this.registry.get('oshiageEliteSeries');
    const index = active?.active && active.venueId === venueId ?
      Number(active.roundIndex || 0) : 0;
    return this.getEliteLineup(venueId)[index] || null;
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
    if (this.activeLocationId === 'oshiageSkytreeMeet' &&
        getOshiageEliteProgress(this.registry).complete) {
      const venueId = this.meetAlternative ? 'plaza' : 'underpass';
      // Preload all three opponents, as in a normal Meet. Tapping a rival
      // then requires only a stage fade, never another loading screen.
      this.getEliteLineup(venueId).forEach(opponent => {
        const visual = getCharacterVisualForContext(opponent?.characterId, {
          rivalContext: true,
          playerCharacterId: this.registry.get('playerCharacterId') || '',
        }) || characters[opponent?.characterId]?.visual || {};
        if (visual.spriteKey && visual.path) {
          // Use the exact portrait texture key expected by normal Meet profiles.
          queued += this.queueImage(visual.spriteKey, getCharacterAssetUrl(visual.path));
        }
        if (opponent && cars[opponent.carId]) {
          queued += preloadCarAppearanceAssets(this,
            { [opponent.carId]: cars[opponent.carId] }, '20261015-r522');
          queued += preloadCarWheel(this, cars[opponent.carId], opponent.buildState);
        }
      });
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
      const rimWall = this.room === 'rims';
      // Lower only the PAINT ROOM backdrop so its upper wall sign is fully
      // visible inside the stage mask. The car, specialist, spray and hit
      // targets remain in their existing world positions.
      const paintBackdropYOffset = this.room === 'paint' ? 28 : 0;
      const img = this.own(this.add.image(
        STAGE.x + STAGE.w / 2,
        rimWall ? STAGE.y : STAGE.y + STAGE.h / 2 + paintBackdropYOffset,
        background.key)
        .setOrigin(0.5, rimWall ? 0 : 0.5)
        .setScale(rimWall ? STAGE.w / src.width :
          Math.max(STAGE.w / src.width, STAGE.h / src.height))
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

    if (this.room === 'paint' || this.room === 'rims') {
      this.button(SIDE.x + SIDE.w / 2, SIDE.y + SIDE.h - 117,
        SIDE.w - 36, 46, 'RETURN TO CUSTOM WORKS',
        () => this.returnToCustomWorks(), { size: '8px' });
    }
    this.button(SIDE.x + SIDE.w / 2, SIDE.y + SIDE.h - 48,
      SIDE.w - 36, 46, 'GO TO MAP  >', () => this.openMap());
  }

  sideHeader(title, subtitle, ginzaStyle = false) {
    this.addText(SIDE.x + 20, SIDE.y + 20, title, { pixel: true, size: '12px', color: '#8feaff', wrap: SIDE.w - 40 });
    this.addText(SIDE.x + 20, SIDE.y + 76, subtitle,
      ginzaStyle ? { size: '10px', bold: true, color: '#9ab0bd', wrap: SIDE.w - 40 }
        : { size: '12px', color: '#a9c3d1', wrap: SIDE.w - 40 });
  }

  // Basic driving remains free. Advanced bookings buy three attempts total,
  // usable only inside the same uninterrupted lesson session.
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
        this.animateShopCarEntry(this.schoolCarObjects, { duration: 3750, distance: 1010, lockUI: false });
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
    const freeVoucher = isOshiageVoucherAvailable(this.registry, lesson.id);
    const completed = lesson.id === 'basic'
      ? Boolean(this.registry.get('oshiageBasicLessonComplete'))
      : Boolean(this.registry.get('oshiageCoachingProgress')?.[id]?.[lesson.id]?.completed);
    this.addText(SIDE.x + 20, SIDE.y + 394, lesson.id === 'basic'
      ? 'INTRODUCTORY COURSE // FREE'
      : freeVoucher ? 'SAYAKA VOUCHER // FIRST BOOKING FREE'
        : 'LESSON FEE // ' + MONEY(fee), {
      pixel: true, size: '9px', color: '#96e9d4', wrap: SIDE.w - 40
    });
    this.addText(SIDE.x + 20, SIDE.y + 445, lesson.id === 'basic'
      ? 'Drive as many times as you wish.'
      : '3 TOTAL ATTEMPTS // UNUSED GOES EXPIRE IF YOU EXIT', {
      size: '12px', color: '#a8c9d3', wrap: SIDE.w - 40
    });
    this.addText(SIDE.x + 20, SIDE.y + 505,
      completed ? 'COURSE COMPLETED // PRACTICE AGAIN' : 'COURSE READY', {
      pixel: true, size: '8px', color: '#d0e7b4', wrap: SIDE.w - 40
    });
    this.button(SIDE.x + SIDE.w / 2, SIDE.y + 568, SIDE.w - 40, 47,
      lesson.id === 'basic' ? 'FREE // ENTER LESSON' :
        freeVoucher ? 'START // USE FREE VOUCHER' : 'START LESSON // ' + MONEY(fee),
      () => this.showLessonBookingDialogue(lesson.id),
      { disabled: !this.isSchoolCarEligible(car, id), accent: true, size: '8px' });

    this.addText(48, 654, 'OSHIAGE DRIVING SCHOOL  //  CHOOSE A LESSON',
      { pixel: true, size: '10px', color: '#8feaff' });
    choices.forEach((option, i) => this.button(179 + i * 282, 743, 265, 65,
      option.tab + ' // ' + (option.id === 'basic' ? 'FREE' :
        isOshiageVoucherAvailable(this.registry, option.id) ? 'FREE VOUCHER' :
        MONEY(OSHIAGE_SCHOOL_LESSONS[option.id].fee)),
      () => {
        this.lessonIndex = i;
        this.registry.set('oshiageLessonTab', i);
        this.renderView();
      }, { accent: selected === i, size: '7px' }));
  }

  showLessonBookingDialogue(lessonId) {
    if (this.schoolPromptOpen || this.instructorCutsceneOpen ||
        this.paintBusy || sceneCutsceneActive(this)) return;
    const { id, car } = this.selectedCar();
    if (!this.isSchoolCarEligible(car, id)) {
      this.showOshiageNotice('SELECT YOUR CAR OR AN ACTIVE CREW CAR');
      return;
    }
    const freeVoucher = isOshiageVoucherAvailable(this.registry, lessonId);
    const quote = bookOshiageLesson({
      booking: null, carId: id, lessonId, cash: this.registry.get('cash'),
      freeFirstLesson: freeVoucher,
    });
    if (!quote.ok) {
      this.showOshiageNotice('NOT ENOUGH YEN FOR THIS LESSON');
      return;
    }
    const lesson = OSHIAGE_SCHOOL_LESSONS[lessonId];
    const text = lessonId === 'basic'
      ? 'The basics are free. Shall we practise together?'
      : freeVoucher
        ? 'Sayaka’s voucher covers all three attempts! If you leave, any unused tries expire. Ready?'
        : 'The fee is ' + MONEY(lesson.fee) +
          ' for up to three attempts. Exit early and unused tries expire. Ready?';
    // Real game manga cutscene: same portrait staging, dialogue plate,
    // animated transitions and two final dialogue buttons as the Dev tester.
    const definition = {
      id: 'oshiageSchoolBooking_' + lessonId,
      title: 'OSHIAGE // LADY INSTRUCTOR',
      once: false,
      characters: { left: 'sayakaFujieda' },
      pages: [
        { speaker: 'left', pose: 'oshiageExplaining',
          nameOverride: 'LADY INSTRUCTOR',
          text: lesson.speech + (lessonId === 'basic' ? '' :
            ' I’ll show recommended RPM ranges for your unique car and current tune.') },
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
          booking: null,
          carId: current.id, lessonId, cash: this.registry.get('cash'),
          freeFirstLesson: isOshiageVoucherAvailable(this.registry, lessonId),
        });
        if (!purchase.ok || current.id !== id ||
            !this.isSchoolCarEligible(current.car, current.id)) return;
        if (lessonId !== 'basic') {
          const attempt = consumeOshiageAttempt(purchase.booking);
          if (!attempt) return;
          if (purchase.usedVoucher) {
            this.registry.set('oshiageFreeLessonUsed', {
              ...(this.registry.get('oshiageFreeLessonUsed') || {}), [lessonId]: true,
            });
          }
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
        this.registry.get('oshiageInstructorMet') ||
        this.instructorCutsceneOpen || sceneCutsceneActive(this)) return;

    // Use the same portrait staging, manga dialogue and transitions as the
    // rest of the career. Preload only the player and Oshiage Sayaka poses.
    const finish = () => {
      this.instructorCutsceneOpen = false;
      this.registry.set('oshiageInstructorMet', true);
      saveSessionState(this.registry);
    };
    this.instructorCutsceneOpen = true;
    const result = playMangaCutscene(this, 'oshiageInstructorFirstEncounter', {
      preloadPagePosesOnly: true,
      onComplete: finish,
    });
    if (!result.played) {
      this.instructorCutsceneOpen = false;
      if (result.reason === 'seen') finish();
    }
  }

  startBasicTutorial(lessonId = null) {
    const { id, car } = this.selectedCar();
    if (!this.isSchoolCarEligible(car, id)) {
      this.showOshiageNotice('SELECT YOUR CAR OR AN ACTIVE CREW CAR FOR THIS LESSON');
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

  // Deliberately follows the same 1138px stage, three rival cards and
  // 356px right-hand column as a regular Tokyo SHIFT street Meet.
  drawMeet() {
    const progress = getOshiageEliteProgress(this.registry);
    const venueId = this.meetAlternative ? 'plaza' : 'underpass';
    const venue = OSHIAGE_ELITE_VENUES[venueId];
    const series = this.registry.get('oshiageEliteSeries');
    const continuing = Boolean(series?.active && series.venueId === venueId);
    const busyElsewhere = Boolean(series?.active && series.venueId !== venueId);
    const activeHeat = continuing ? Math.max(0, Math.min(2,
      Number(series.roundIndex || 0))) : 0;
    const lineup = progress.complete ? this.getEliteLineup(venueId) : [];
    const previewIndex = Math.max(0, Math.min(2,
      Number(this.showdownPreviewIndex || 0)));
    const opponent = lineup[previewIndex] || lineup[activeHeat] || null;
    const rival = opponent ? characters[opponent.characterId] : null;
    const car = opponent ? cars[opponent.carId] : null;
    const { id: playerCarId, car: playerCar, state: playerState } = this.selectedCar();
    const playerPerformance = playerCar
      ? getVehiclePerformance(playerCarId, playerState)
      : null;
    const playerRating = playerCar
      ? getPowerTorqueDisplay(playerCar, playerState, playerPerformance?.car || playerCar)
      : null;
    const cooldown = getOshiageEliteRemainingMs(this.registry, venueId);
    const access = getOshiageShowdownAccess(this.registry, venueId);
    const canRace = progress.complete && lineup.length === 3 &&
      !this.showdownLaunching && (
        continuing ? series.playerCarId === playerCarId && Boolean(playerCar)
          : access.allowed
      );
    const prize = continuing && series.prize || getOshiageElitePrize(this.registry,
      venueId, Number(this.registry.get('wins') || 0) + 3);
    const extraPrize = 'BONUS  //  ' +
      Number(prize?.coupons ?? venue.couponCount) + ' CAR COUPONS' +
      (prize?.wheelId ? '\n+ SPECIAL WHEELS' : '');

    // Match normal Meet's car-and-character presentation, but show just the
    // currently selected rival. The car is 30% larger than the old 510px one.
    if (opponent && car &&
        this.textures.exists(getCarBodyTextureKey(this, car))) {
      const carWidth = 663;
      const carX = STAGE.x + STAGE.w / 2;
      this.drawOwnedCar(car, opponent.buildState,
        carX, 455, carWidth, opponent.paintColor, 12);
    }

    const spriteKey = opponent && getCharacterVisualForContext(opponent.characterId, {
      rivalContext: true,
      playerCharacterId: this.registry.get('playerCharacterId') || '',
    })?.spriteKey;
    if (spriteKey && this.textures.exists(spriteKey)) {
      const source = this.textures.get(spriteKey).getSourceImage();
      const avatarX = STAGE.x + 255;
      const feetY = STAGE.y + STAGE.h - 4;
      const scale = 315 / Math.max(1, source.height);
      const characterWidth = source.width * scale;
      this.own(this.add.ellipse(avatarX, feetY - 12,
        Math.max(90, characterWidth * 0.77), 31, 0x000000, 0.55)
        .setMask(this.stageMask).setDepth(19.8));
      this.own(this.add.ellipse(avatarX, feetY - 7,
        Math.max(65, characterWidth * 0.56), 18, 0x000000, 0.82)
        .setMask(this.stageMask).setDepth(19.9));
      this.own(this.add.image(avatarX, feetY, spriteKey)
        .setOrigin(0.5, 1).setScale(scale).setDepth(20)
        .setMask(this.stageMask));
    }

    if (rival) {
      const labelWidth = 342, labelX = STAGE.x + STAGE.w - labelWidth / 2 - 21;
      this.own(this.add.rectangle(labelX, STAGE.y + 42,
        labelWidth, 59, 0x071523, 0.90)
        .setStrokeStyle(2, 0x64d5fa).setMask(this.stageMask).setDepth(25));
      this.addText(labelX - labelWidth / 2 + 14, STAGE.y + 24,
        String(rival.name).toUpperCase(), {
          pixel: true, size: '9px', color: '#f5ffff', depth: 26,
        }).setMask(this.stageMask);
      this.addText(labelX - labelWidth / 2 + 14, STAGE.y + 47,
        (rival.regionId || 'TOKYO') + ' // ELITE DRIVER', {
          pixel: true, size: '8px', color: '#8ddff1', depth: 26,
        }).setMask(this.stageMask);
    }

    // The bottom strip is the normal Meet's three-card roster. Selecting any
    // card previews its stage character/car; the heat order never changes.
    this.addText(STRIP.x + 18, STRIP.y + 6,
      'RIVALS IN THE SHOWDOWN', {
        pixel: true, size: '10px', color: '#a7d5ef',
      });
    [0, 1, 2].forEach(i => {
      const offer = lineup[i];
      const character = offer && characters[offer.characterId];
      const x = [215, 593, 971][i];
      const y = 744, w = 350, h = 132;
      const selected = Boolean(offer && i === previewIndex);
      const finished = continuing && i < activeHeat;
      const box = this.own(this.add.rectangle(x, y, w, h,
        selected ? 0x102a32 : 0x0a1521, 0.99)
        .setStrokeStyle(selected ? 3 : 2,
          selected ? 0x68e7ce : 0x315270).setDepth(34));
      if (offer) box.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.selectShowdownDriver(i));

      if (offer && character) {
        const portraitX = x - 111;
        this.own(this.add.rectangle(portraitX, y, 105, 105, 0x101b27)
          .setStrokeStyle(1, 0x365775).setDepth(35));
        // Exactly the same face-anchor, zoom, and square crop as MeetScene.drawCards.
        const portraitProfile = createCharacterProfile(this, {
          characterId: offer.characterId,
          pose: 'idle',
          x: portraitX,
          y,
          frameWidth: 104,
          frameHeight: 104,
          side: 'left',
          depth: 36,
          rivalContext: true,
          playerCharacterId: this.registry.get('playerCharacterId') || '',
        });
        if (portraitProfile?.image) this.own(portraitProfile.image);
        if (portraitProfile?.maskShape) this.own(portraitProfile.maskShape);
        this.addText(x - 42, y - 52,
          String(character.name || 'RIVAL').toUpperCase(), {
            pixel: true, size: '8px', color: '#f6ffff',
            wrap: 210, depth: 37,
          });
        const quote = String(character.introQuote ||
          character.personality || 'Three heats. No excuses.');
        this.addText(x - 42, y - 22, '“' + quote + '”', {
          size: '10px', color: '#a6c3d0',
          wrap: 208, depth: 37,
        });
        this.addText(x - 42, y + 31,
          finished ? 'HEAT ' + (i + 1) + ' // WON'
            : 'HEAT ' + (i + 1) + ' // ' +
              String(character.regionId || 'TOKYO'), {
            pixel: true, size: '7px', color: finished ? '#7ee5bb' : '#ffe6a7',
            wrap: 205, depth: 37,
          });
      } else {
        this.addText(x - 140, y - 12,
          'HEAT ' + (i + 1) + '\nELITE DRIVER LOCKED', {
            pixel: true, size: '8px', color: '#718795',
            wrap: 300, depth: 37,
          });
      }
    });

    // Normal Meet hierarchy: mode/location -> your car -> selected heat ->
    // offer/prize -> green challenge action -> Go to Map.
    this.addText(SIDE.x + 18, SIDE.y + 18, 'SKYTREE ELITE MEET', {
      pixel: true, size: '12px', color: '#8feaff', wrap: SIDE.w - 36,
    });
    this.addText(SIDE.x + 20, SIDE.y + 67, 'SHOWDOWN LOCATION', {
      pixel: true, size: '9px', color: '#b5d2e5',
    });
    this.button(SIDE.x + 94, SIDE.y + 119, 158, 49,
      'SKYTREE\nUNDERPASS', () => this.selectEliteVenue('underpass'), {
        accent: venueId === 'underpass', size: '7px',
      });
    this.button(SIDE.x + 265, SIDE.y + 119, 158, 49,
      'SKYTREE\nPLAZA', () => this.selectEliteVenue('plaza'), {
        accent: venueId === 'plaza', size: '7px',
      });

    this.addText(SIDE.x + 20, SIDE.y + 169, 'YOUR CAR', {
      pixel: true, size: '9px', color: '#8feaff',
    });
    // Share the normal Meet summary styling and estimated/dyno readings.
    this.addText(SIDE.x + 20, SIDE.y + 197,
      playerCar
        ? playerCar.shortName + '\n' +
          playerRating.powerLabel + '  •  ' + playerRating.torqueLabel
        : 'NO CAR', {
        size: '11px',
        color: playerCar ? '#d8e7ef' : '#72838f',
        spacing: -2,
        wrap: SIDE.w - 40,
      });
    this.own(this.add.rectangle(SIDE.x + SIDE.w / 2,
      SIDE.y + 246, SIDE.w - 34, 1, 0x31516a).setDepth(32));

    this.addText(SIDE.x + 20, SIDE.y + 258,
      'THREE ELITE RIVALS', {
        pixel: true, size: '9px', color: '#8feaff', wrap: SIDE.w - 40,
      });
    this.addText(SIDE.x + 20, SIDE.y + 292,
      'HEAT ' + (previewIndex + 1) + ' OF 3' +
      (continuing && previewIndex === activeHeat ? ' // UP NEXT' : ''), {
        pixel: true, size: '9px', color: '#ffe09a',
      });
    this.addText(SIDE.x + 20, SIDE.y + 321,
      'CAR: ' + (car?.shortName || 'ELITE BUILD') +
      '\nRACE: ' + (opponent?.raceType || venue.raceType).toUpperCase() +
      '\nDISTANCE: ' + (venue.distanceM < 500 ? '1/4 MILE' : '1/2 MILE'), {
        size: '12px', color: '#e7f2fb', wrap: SIDE.w - 40, spacing: 3,
      });

    this.addText(SIDE.x + 20, SIDE.y + 405, 'PRIZE', {
      pixel: true, size: '10px', color: '#a4d7eb',
    });
    this.addText(SIDE.x + 20, SIDE.y + 434,
      MONEY(venue.prizeCash), {
        pixel: true, size: '13px', color: '#ffdf70', wrap: SIDE.w - 40,
      });
    this.addText(SIDE.x + 20, SIDE.y + 471, extraPrize, {
      pixel: true, size: '7px', color: '#fbe7a4', wrap: SIDE.w - 40,
    });
    this.addText(SIDE.x + 20, SIDE.y + 510, 'WIN ALL 3 HEATS', {
      pixel: true, size: '9px', color: '#a8efce', wrap: SIDE.w - 40,
    });

    let status = '';
    if (!progress.complete) {
      status = 'CHAMPIONSHIPS  ' + progress.count + ' / ' + progress.required +
        ' REQUIRED TO UNLOCK';
    } else if (busyElsewhere) {
      status = 'FINISH THE OTHER SKYTREE SHOWDOWN FIRST';
    } else if (continuing && series.playerCarId !== playerCarId) {
      status = 'CONTINUE WITH THE SAME CAR';
    } else if (continuing) {
      status = 'STREAK ACTIVE // NEXT HEAT ' + (activeHeat + 1) + ' OF 3';
    } else if (cooldown > 0) {
      status = 'COOLDOWN  ' + Math.floor(cooldown / 60000) + ':' +
        String(Math.floor((cooldown % 60000) / 1000)).padStart(2, '0');
    } else if (!access.allowed) {
      status = access.reason || 'UNAVAILABLE';
    }
    // Show useful lockout/active-streak information only. The enabled
    // action button already conveys that the player can start racing.
    if (status) {
      this.addText(SIDE.x + 20, SIDE.y + 535, status, {
        pixel: true, size: '7px',
        color: canRace ? '#a8efce' : '#e6b7a2',
        wrap: SIDE.w - 40,
      });
    }
    // Bottom of race button is 15px above the Go to Map button.
    this.button(SIDE.x + SIDE.w / 2, SIDE.y + 614,
      SIDE.w - 38, 48,
      continuing ? 'CONTINUE HEAT ' + (activeHeat + 1) + '  >'
        : 'ENTER  //  ' + MONEY(venue.entryFee) + '  >',
      () => this.startEliteRace(venueId), {
        disabled: !canRace, accent: true, size: '8px',
      });
  }

  selectShowdownDriver(index) {
    if (this.showdownSwitching || this.showdownLaunching || this.paintBusy ||
        this.activeLocationId !== 'oshiageSkytreeMeet') return;
    const venueId = this.meetAlternative ? 'plaza' : 'underpass';
    if (!this.getEliteLineup(venueId)[index] ||
        index === this.showdownPreviewIndex) return;
    this.showdownSwitching = true;
    const fade = this.add.rectangle(
      STAGE.x + STAGE.w / 2, STAGE.y + STAGE.h / 2,
      STAGE.w, STAGE.h, 0x02060e, 1
    ).setDepth(29).setMask(this.stageMask).setAlpha(0);
    this.tweens.add({
      targets: fade, alpha: 1, duration: 205, ease: 'Sine.easeInOut',
      onComplete: () => {
        if (!this.sys.isActive()) { fade.destroy(); return; }
        this.showdownPreviewIndex = index;
        this.renderView();
        this.tweens.add({
          targets: fade, alpha: 0, duration: 245, ease: 'Sine.easeInOut',
          onComplete: () => {
            fade.destroy();
            this.showdownSwitching = false;
          },
        });
      },
    });
  }

  selectEliteVenue(id) {
    if (!OSHIAGE_ELITE_VENUES[id] || this.showdownSwitching) return;
    this.meetAlternative = id === 'plaza';
    this.showdownPreviewIndex = 0;
    const series = this.registry.get('oshiageEliteSeries');
    if (series?.active && series.venueId === id) {
      this.showdownPreviewIndex = Number(series.roundIndex || 0);
    }
    this.registry.set('oshiageEliteVenue', id);
    saveSessionState(this.registry);
    this.loadAndRender();
  }

  startEliteRace(venueId) {
    if (this.showdownLaunching || this.paintBusy || this.showdownSwitching ||
        !getOshiageEliteProgress(this.registry).complete) return;
    this.showdownLaunching = true;
    const series = this.registry.get('oshiageEliteSeries');
    let result;
    if (series?.active && series.venueId === venueId) {
      result = { ok: prepareNextOshiageShowdownHeat(this.registry) };
    } else {
      result = beginOshiageShowdown(this.registry, venueId, Date.now(),
        this.getEliteLineup(venueId));
    }
    if (!result.ok) {
      this.showdownLaunching = false;
      this.showOshiageNotice(result.reason || 'SHOWDOWN UNAVAILABLE');
      this.renderView();
      return;
    }
    this.registry.set('raceTimeOfDay', getWorldPhase());
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
    this.sideHeader('CUSTOM WORKS', 'Shop for bodywork and rims', true);
    this.addText(SIDE.x + 20, SIDE.y + 155, 'EXTERIOR CUSTOMISATION',
      { pixel: true, size: '10px', color: '#ffe5b0', wrap: SIDE.w - 40 });
    this.addText(SIDE.x + 20, SIDE.y + 220,
      'PAINT: Preset finishes cost ¥8,000, and custom paint selection for ¥16,000.\n\n' +
      'RIMS: Try and buy new and rare wheel designs, or install designs already in your collection.',
      { size: '10px', bold: true, wrap: SIDE.w - 40, color: '#9ab0bd', spacing: 5 });
    this.addText(48, 660, 'OSHIAGE CUSTOM WORKS // SELECT A SERVICE',
      { pixel: true, size: '10px', color: '#8feaff' });
    this.button(316, 745, 545, 64, 'PAINT', () => this.openCustomWorksRoom('paint'),
      { accent: true, size: '10px' });
    this.button(860, 745, 545, 64, 'RIMS', () => this.openCustomWorksRoom('rims'),
      { accent: true, size: '10px' });
  }

  returnToCustomWorks() {
    if (this.paintBusy || this.rimConfirmOpen) return;
    this.room = 'outside';
    this.pendingPaint = null;
    this.selectedRimIndex = -1;
    this.rimPreview = false;
    this.rimCarObjects = [];
    this.loadAndRender();
  }

  openCustomWorksRoom(room) {
    if (!['paint', 'rims'].includes(room) || this.paintBusy) return;
    this.room = room;
    this.pendingPaint = null;
    if (room === 'paint') {
      this.paintMode = 'preset';
      this.paintPickerHue = null;
    }
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
    const scale = STAGE.w / sourceW;
    return { x: STAGE.x, y: STAGE.y, width: STAGE.w, height: sourceH * scale };
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

    // Side panel: one succinct spec sheet, fitment price and two actions.
    if (!car) {
      this.addText(SIDE.x + 20, SIDE.y + 160, 'NO CAR SELECTED',
        { pixel: true, size: '10px', color: '#ffc6a8' });
      this.addText(SIDE.x + 20, SIDE.y + 210,
        'Select a car from your workshop before trying or installing wheels.',
        { size: '12px', wrap: SIDE.w - 40 });
    } else if (!selected) {
      this.addText(SIDE.x + 20, SIDE.y + 154,
        String(car.shortName || car.name).toUpperCase(),
        { pixel: true, size: '10px', color: '#f4faff', wrap: SIDE.w - 40 });
      this.addText(SIDE.x + 20, SIDE.y + 210,
        'Tap a wheel on the wall to preview its fitment. Purchased designs can always be reinstalled.',
        { size: '12px', wrap: SIDE.w - 40, color: '#aac8d6', spacing: 5 });
    } else {
      const tierColor = selected.tier === 'HERO' ? '#ff9fc7' :
        selected.tier === 'TUNER' ? '#ffe08a' : '#8fe7ff';
      this.addText(SIDE.x + 20, SIDE.y + 146,
        selected.tier + ' // ' + selected.label.toUpperCase(),
        { pixel: true, size: '9px', color: tierColor, wrap: SIDE.w - 40 });
      this.addText(SIDE.x + 20, SIDE.y + 230, selected.source,
        { size: '12px', color: '#afc4d2', wrap: SIDE.w - 40 });
      this.addText(SIDE.x + 20, SIDE.y + 326,
        quote?.status === 'INSTALLED' ? 'FITTED TO CURRENT CAR'
          : quote?.owned ? 'OWNED // FREE INSTALL'
            : quote?.locked ? 'FITMENT LOCKED'
              : 'PRICE // ' + MONEY(quote?.price || 0),
        { pixel: true, size: '9px', color: '#ffe5a5', wrap: SIDE.w - 40 });
      if (quote?.status === 'UNAFFORDABLE') {
        this.addText(SIDE.x + 20, SIDE.y + 366, 'NOT ENOUGH CASH',
          { pixel: true, size: '8px', color: '#ffbaba' });
      }
    }

    const restoreAllowed = Boolean(car && state.customWheelId &&
      !car.tuningLocked && !car.crewLoan && !state.collector && !state.immutable &&
      !state.tuningLocked && !state.crewLoan);
    this.button(SIDE.x + SIDE.w / 2, SIDE.y + 438, SIDE.w - 40, 44,
      restoreAllowed ? 'RESTORE STOCK RIMS' : 'STOCK RIMS',
      () => {
        if (!restoreStockOshiageRims(this.registry, id)) return;
        saveSessionState(this.registry);
        this.renderView();
        this.showOshiageNotice('ORIGINAL FACTORY RIMS RESTORED');
      }, { disabled: !restoreAllowed, size: '8px' });
    this.button(SIDE.x + SIDE.w / 2, SIDE.y + 507, SIDE.w - 40, 48,
      selected ? (quote?.owned ? 'INSTALL RIMS' : 'BUY & INSTALL // ' + MONEY(quote?.price || 0))
        : 'SELECT A WHEEL TO PREVIEW',
      () => this.confirmRimTransaction(selected, id),
      { disabled: !selected || !['OWNED', 'BUY'].includes(quote?.status),
        accent: Boolean(selected), size: '8px' });

    this.drawCustomWorksSpecialist({ x: 1054, feetY: STAGE.y + STAGE.h - 10 });

    if (this.rimPreview) {
      // Black text-button over the main window, rather than a bottom-row CTA.
      const back = this.own(this.add.rectangle(
        STAGE.x + STAGE.w - 120, STAGE.y + 28, 222, 38, 0x060a10, 0.96
      ).setStrokeStyle(1, 0x8499a8).setDepth(35)
        .setInteractive({ useHandCursor: true }));
      this.addText(STAGE.x + STAGE.w - 222, STAGE.y + 15,
        'BACK TO RIM WALL', { pixel: true, size: '8px', color: '#eff8ff', depth: 36 });
      back.on('pointerdown', () => {
        this.selectedRimIndex = -1;
        this.rimPreview = false;
        this.rimCarObjects = [];
        this.renderView();
      });
    }

    // The bottom panel explains the rotating collection rather than repeating
    // navigation or installation controls.
    this.addText(52, STRIP.y + 19, 'WHEEL COLLECTION // EIGHT DESIGNS ON DISPLAY',
      { pixel: true, size: '10px', color: '#8feaff' });
    [
      { x: 48, label: 'STANDARD // FOUR', detail: 'Classic street wheel designs.\nAlways available to browse.' },
      { x: 420, label: 'TUNER // TWO', detail: 'Motorsport-inspired choices.\nTwo styles rotate every 3 hours.' },
      { x: 792, label: 'HERO // TWO', detail: 'Rare signature wheel designs.\nTwo collector styles rotate.' },
    ].forEach(guide => {
      this.addText(guide.x, STRIP.y + 66, guide.label,
        { pixel: true, size: '9px', color: '#f3e4bc', wrap: 325 });
      this.addText(guide.x, STRIP.y + 98, guide.detail,
        { size: '12px', color: '#aac8d6', wrap: 325, spacing: 4 });
    });
    if (selected) this.addText(52, STRIP.y + 157,
      selected.label.toUpperCase() + ' // FREE PREVIEW · CHARGED ONLY ON CONFIRMATION',
      { size: '9px', color: '#b5e6e2' });
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

  ensurePaintPickerTexture(key, width, height, draw) {
    const texture = this.textures.exists(key)
      ? this.textures.get(key)
      : this.textures.createCanvas(key, width, height);
    const ctx = texture.getContext();
    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height);
    texture.refresh();
    return key;
  }

  drawPaintColourSquare() {
    const chosen = colorToHsv(this.pendingPaint);
    const hue = Number.isFinite(this.paintPickerHue) ? this.paintPickerHue : chosen.h;
    this.paintPickerHue = hue;
    const w = 284, h = 146, cx = SIDE.x + SIDE.w / 2;
    const sy = SIDE.y + 308, hy = SIDE.y + 411;
    const squareKey = this.ensurePaintPickerTexture('oshiageColourSquareR531', w, h,
      (ctx, width, height) => {
        ctx.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
        ctx.fillRect(0, 0, width, height);
        const white = ctx.createLinearGradient(0, 0, width, 0);
        white.addColorStop(0, '#ffffff');
        white.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = white; ctx.fillRect(0, 0, width, height);
        const black = ctx.createLinearGradient(0, 0, 0, height);
        black.addColorStop(0, 'rgba(0,0,0,0)');
        black.addColorStop(1, '#000000');
        ctx.fillStyle = black; ctx.fillRect(0, 0, width, height);
      });
    const hueKey = this.ensurePaintPickerTexture('oshiageHueStripR531', w, 23,
      (ctx, width, height) => {
        const spectrum = ctx.createLinearGradient(0, 0, width, 0);
        ['#ff0000','#ffff00','#00ff00','#00ffff','#0000ff','#ff00ff','#ff0000']
          .forEach((hex, index) => spectrum.addColorStop(index / 6, hex));
        ctx.fillStyle = spectrum; ctx.fillRect(0, 0, width, height);
      });
    const square = this.own(this.add.image(cx, sy, squareKey)
      .setDepth(33).setInteractive({ useHandCursor: true }));
    const strip = this.own(this.add.image(cx, hy, hueKey)
      .setDepth(33).setInteractive({ useHandCursor: true }));
    this.own(this.add.rectangle(cx, sy, w + 4, h + 4, 0, 0)
      .setStrokeStyle(2, 0xd6e5ef).setDepth(34));
    this.own(this.add.rectangle(cx, hy, w + 4, 27, 0, 0)
      .setStrokeStyle(1, 0xa0b8c6).setDepth(34));
    this.own(this.add.circle(cx - w / 2 + chosen.s * w,
      sy + h / 2 - chosen.v * h, 7, this.pendingPaint)
      .setStrokeStyle(2, 0xffffff).setDepth(35));
    this.own(this.add.rectangle(cx - w / 2 + hue / 360 * w, hy,
      4, 30, 0xffffff).setDepth(35));
    const chooseSquare = (pointer, localX, localY) => {
      if (this.paintBusy) return;
      this.pendingPaint = hsvToColor(this.paintPickerHue,
        Phaser.Math.Clamp(localX / w, 0, 1),
        1 - Phaser.Math.Clamp(localY / h, 0, 1));
      this.customPaintColor = this.pendingPaint;
      this.renderView();
    };
    const chooseHue = (pointer, localX) => {
      if (this.paintBusy) return;
      this.paintPickerHue = Phaser.Math.Clamp(localX / w, 0, 1) * 359.99;
      const value = colorToHsv(this.pendingPaint);
      this.pendingPaint = hsvToColor(this.paintPickerHue,
        Math.max(value.s, 0.85), Math.max(value.v, 0.75));
      this.customPaintColor = this.pendingPaint;
      this.renderView();
    };
    square.on('pointerdown', chooseSquare);
    square.on('pointermove', (pointer, x, y) => {
      if (pointer.isDown) chooseSquare(pointer, x, y);
    });
    strip.on('pointerdown', chooseHue);
    strip.on('pointermove', (pointer, x) => {
      if (pointer.isDown) chooseHue(pointer, x);
    });
    this.own(this.add.rectangle(cx, SIDE.y + 455, w, 22, this.pendingPaint)
      .setStrokeStyle(1, 0xd6e5ef).setDepth(33));
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
      // Allow properly recruited crew loans, never Ginza demos or sealed
      // collector cars, even though those also have an ownedCarIds entry.
      const paintable = Boolean(hasLayeredPaintAssets(this, car) &&
        !car.tuningLocked && !state.tuningLocked && !state.collector &&
        !state.immutable && (!car.crewLoan || this.isCrewCarSelected()) &&
        (!state.crewLoan || this.isCrewCarSelected()));
      const canBuy = Number(this.registry.get('garageTier') || 0) >= 1;
      // Lower the side-profile car roughly one wheel width inside the bay.
      this.paintObjects = this.drawOwnedCar(
        car, state, 609, 410, 483, this.pendingPaint
      );
      this.addText(SIDE.x + 20, SIDE.y + 145,
        mode === 'preset' ? 'FACTORY PALETTE' : 'CUSTOM COLOUR PICKER',
        { pixel: true, size: '9px', color: '#ffe394' });
      if (mode === 'preset') {
        this.addText(SIDE.x + 20, SIDE.y + 182, 'CHOOSE A FINISH',
          { pixel: true, size: '8px', color: '#96b6c7' });
        PAINT_PRESETS.forEach((preset, i) => {
          const x = SIDE.x + 48 + (i % 5) * 62;
          const y = SIDE.y + 248 + Math.floor(i / 5) * 66;
          const active = preset.color === this.pendingPaint;
          const swatch = this.own(this.add.rectangle(x, y, 44, 42, preset.color)
            .setStrokeStyle(active ? 4 : 2, active ? 0xe9ffff : 0x547087).setDepth(33));
          if (paintable) swatch.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            if (this.paintBusy) return;
            this.pendingPaint = preset.color;
            this.renderView();
          });
        });
      } else {
        this.addText(SIDE.x + 20, SIDE.y + 183,
          'TAP OR DRAG TO SELECT A COLOUR',
          { pixel: true, size: '7px', color: '#96b6c7' });
        this.drawPaintColourSquare();
      }
      this.addText(SIDE.x + 20, SIDE.y + 477,
        !paintable ? 'PAINT LAYERS NOT AVAILABLE'
          : !canBuy ? 'CANAL YARD REQUIRED'
            : this.pendingPaint === current ? 'ALREADY INSTALLED'
              : 'PRICE // ' + MONEY(fee),
        { pixel: true, size: '8px', color: '#f6dda0', wrap: SIDE.w - 40 });
      this.button(SIDE.x + SIDE.w / 2, SIDE.y + 528, SIDE.w - 40, 48,
        'APPLY PAINT // ' + MONEY(fee),
        () => this.applyPaint(id, this.pendingPaint, fee),
        { disabled: !paintable || !canBuy || this.pendingPaint === current ||
          Number(this.registry.get('cash') || 0) < fee || this.paintBusy,
          accent: true, size: '8px' });
    }

    this.drawCustomWorksSpecialist({ x: 1066, feetY: STAGE.y + STAGE.h - 35 });
    this.addText(48, 654, 'CUSTOM WORKS // SPRAY BOOTH // SIDE PROFILE',
      { pixel: true, size: '10px', color: '#8feaff' });
    this.button(316, 744, 545, 66, 'PRESET // ¥8,000', () => this.setPaintMode('preset'),
      { accent: mode === 'preset', size: '8px' });
    this.button(860, 744, 545, 66, 'CUSTOM COLOUR // ¥16,000', () => this.setPaintMode('custom'),
      { accent: mode === 'custom', size: '8px' });
    this.addText(48, 794, this.paintBusy ? 'CAR ENTERING / SPRAYING...' :
      'Side-entry spray bay // real car paint layers // colour preview before purchase.',
      { size: '9px', color: '#9cb8c8' });
  }

  setPaintMode(mode) {
    if (!['preset', 'custom'].includes(mode) || this.paintBusy) return;
    if (this.paintMode === 'custom') this.customPaintColor = this.pendingPaint;
    this.paintMode = mode;
    this.paintPickerHue = null;
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

  animateShopCarEntry(objects, { duration = 3950, distance = 1100, lockUI = true } = {}) {
    if (!objects?.length || (lockUI && this.paintBusy)) return;
    if (this.entryTween) {
      this.entryTween.stop();
      this.entryTween = null;
    }
    if (lockUI) this.paintBusy = true;

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
        if (lockUI) this.paintBusy = false;
        // Never invalidate an active manga scene during its confirmation.
        if (!this._mangaCutscene?.active && !this.schoolPromptOpen) {
          this.renderView(); // Stationary car; no replay on colour / rim selection.
        }
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
    const { id: selectedId, car } = this.selectedCar();
    if (selectedId !== carId || !car || !this.isSchoolCarEligible(car, carId) ||
        car.tuningLocked) return;
    const owned = this.registry.get('ownedCarIds') || [];
    if (!owned.includes(carId)) return;
    const current = (this.registry.get('carStates') || {})[carId] || {};
    if (current.collector || current.tuningLocked || current.immutable ||
        (current.crewLoan && !this.isCrewCarSelected()) ||
        !hasLayeredPaintAssets(this, car)) return;
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
    // Darken and densify the paint-coloured spray without obscuring the
    // car. Pure pastel/white particles previously disappeared into the bright
    // booth, particularly at 0.25 opacity.
    const sprayRgb = paintColorToRgb(paintColor);
    const sprayShade = rgbToPaintColor(
      40 + sprayRgb.r * 0.48,
      40 + sprayRgb.g * 0.48,
      40 + sprayRgb.b * 0.48
    );
    for (let i = 0; i < 46; i++) {
      const x = 310 + Phaser.Math.Between(0, 630);
      const y = 263 + Phaser.Math.Between(0, 155);
      const mist = this.add.circle(x, y, Phaser.Math.Between(11, 28), sprayShade, 0.49)
        .setMask(this.stageMask).setDepth(24);
      this.tweens.add({ targets: mist, alpha: 0, x: x + 64,
        duration: 510 + i * 15, delay: i * 18, onComplete: () => mist.destroy() });
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
      travelMode: this.isCrewCarSelected() ? 'crew' : 'default',
      onHome: (workshopLocationId, cost) => this.returnHome(workshopLocationId, cost),
      onTravel: (locationId, cost) => this.travelTo(locationId, cost),
    });
  }
  travelTo(locationId, cost = 0) {
    if (this.paintBusy) return;
    const target = getTravelLocation(locationId);
    if (!target) return;
    // Crew travel is limited to street regions, Driving School and Custom
    // Works. Keep the pro/elite Skytree racing event and Ginza restricted.
    if (this.isCrewCarSelected() && (target.regionId === 'CENTRAL_TOKYO' ||
        locationId === 'oshiageSkytreeMeet')) return;
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
