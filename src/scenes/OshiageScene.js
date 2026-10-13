// Oshiage satellite district. The seven regional championships remain unchanged.
import { cars } from '../data/cars.js?v=20261011-r479';
import { characters, getCharacterAssetUrl } from '../data/characters.js?v=20261013-r494';
import { getOshiageEliteProgress, getOshiageEliteOpponent, getOshiageEliteRemainingMs, OSHIAGE_ELITE_COOLDOWN_MS, OSHIAGE_ELITE_VENUES } from '../data/oshiageElite.js?v=20261013-r496';
import { getBaseCarId } from '../data/carOwnership.js?v=20261011-r479';
import { getWorldPhase } from '../environment/WorldClock.js?v=20260929-r286';
import { showTravelMap } from '../ui/TravelMap.js?v=20261009-r451';
import { getTravelLocation } from '../data/travelRegions.js?v=20261013-osh1';
import { saveSessionState } from '../state/GameState.js?v=20261011-r482';
import { addSettingsButton } from '../ui/SettingsPanel.js?v=20261011-r482';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20261005-r355';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';
import {
  PAINT_PRESETS, hasLayeredPaintAssets, getCarPaintColor, normalisePaintColor, paintColorToRgb, rgbToPaintColor,
  getCarBodyTextureKey, getCarBodyScaleForWidth, createCarBodyLayers, setCarBodyPaint,
  preloadCarAppearanceAssets, preloadCarWheel, ensureDerivedModularCarTextures,
} from '../vehicles/CarAppearance.js?v=20260929-r246';
import { getReferenceRightX } from '../data/carReferenceGeometry.js?v=20261012-ref2';
import { createVisualModLayers, getVisualModWheelVisual, preloadVisualModSelectionAssets } from '../data/visualMods.js?v=20261011-r479';
import { getWheelPairFit, getWheelContactOffsetY } from '../vehicles/WheelFit.js?v=20260929-r258';

const PIXEL = '"Silkscreen", monospace';
const BODY = '"Rajdhani", sans-serif';
const STAGE = { x: 24, y: 92, w: 1138, h: 528 };
const SIDE = { x: 1180, y: 92, w: 356, h: 724 };
const STRIP = { x: 24, y: 636, w: 1138, h: 180 };
const ROOT = 'assets/Oshiage/';
const SAYAKA = 'assets/Characters/Main/oshiage_sayaka_fujieda_';
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
    this.room = data.room === 'paint' ? 'paint' : 'outside';
    if (this.activeLocationId !== 'oshiageCustomWorks') this.room = 'outside';
    this.lessonIndex = 0;
    this.meetAlternative = this.registry.get('oshiageEliteVenue') === 'plaza';
    this.paintMode = 'preset';
    this.customPaintColor = null;
    this.pendingPaint = null;
    this.paintBusy = false;
    this.paintObjects = [];
    this.content = [];
    this.phase = getWorldPhase();
  }

  backgroundAsset(locationId = this.activeLocationId, phase = this.phase) {
    const stem = this.room === 'paint' && locationId === 'oshiageCustomWorks'
      ? 'oshiage_paint'
      : locationId === 'oshiageSkytreeMeet' && this.meetAlternative
        ? 'oshiage_skytree02'
        : (LOCATIONS[locationId] || LOCATIONS.oshiageDrivingSchool).stem;
    const cleanPhase = phase === 'day' ? 'day' : 'night';
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

  queueViewAssets() {
    let queued = 0;
    for (const phase of ['day', 'night']) {
      const background = this.backgroundAsset(this.activeLocationId, phase);
      queued += this.queueImage(background.key, background.path);
    }
    if (this.activeLocationId === 'oshiageDrivingSchool') {
      for (const pose of ['neutral', 'explaining', 'happy', 'concerned']) {
        queued += this.queueImage('oshiageSayaka_' + pose, SAYAKA + pose + '.png?v=20261013-r496');
      }
    }
    if (this.activeLocationId === 'oshiageSkytreeMeet' && getOshiageEliteProgress(this.registry).complete) {
      const opponent = getOshiageEliteOpponent(this.registry, this.meetAlternative ? 'plaza' : 'underpass');
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
    this.renderView();
    if (this.activeLocationId === 'oshiageDrivingSchool' && !this.registry.get('oshiageInstructorMet')) {
      this.time.delayedCall(420, () => this.showInstructorCutscene());
    }
    this.time.addEvent({ delay: 5000, loop: true, callback: () => {
      if (this.activeLocationId === 'oshiageSkytreeMeet' && !this.paintBusy &&
          !this.instructorCutsceneOpen) this.renderView();
    } });
    this.phaseWatcher = this.time.addEvent({ delay: 5000, loop: true, callback: () => {
      const phase = getWorldPhase();
      if (phase === this.phase) return;
      this.phase = phase;
      this.loadAndRender();
    } });
    finishSceneLoading('OSHIAGE READY');
  }

  own(obj) { this.content.push(obj); return obj; }
  clearView() {
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
      (this.room === 'paint' ? 'PAINT STUDIO // ' : '') + this.phase.toUpperCase());
    const background = this.backgroundAsset();
    if (this.textures.exists(background.key)) {
      const src = this.textures.get(background.key).getSourceImage();
      const img = this.own(this.add.image(STAGE.x + STAGE.w / 2, STAGE.y + STAGE.h / 2, background.key)
        .setScale(Math.max(STAGE.w / src.width, STAGE.h / src.height))
        .setMask(this.stageMask).setDepth(-10));
      img.texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    } else {
      this.addText(420, 340, 'IMAGE UNAVAILABLE: ' + background.path, { wrap: 650 });
    }
    if (this.activeLocationId === 'oshiageDrivingSchool') this.drawSchool();
    else if (this.activeLocationId === 'oshiageSkytreeMeet') this.drawMeet();
    else if (this.room === 'paint') this.drawPaintStudio();
    else this.drawCustomWorks();

    this.button(SIDE.x + SIDE.w / 2, SIDE.y + SIDE.h - 48,
      SIDE.w - 36, 46, 'GO TO MAP  >', () => this.openMap());
  }

  sideHeader(title, subtitle) {
    this.addText(SIDE.x + 20, SIDE.y + 20, title, { pixel: true, size: '12px', color: '#8feaff', wrap: SIDE.w - 40 });
    this.addText(SIDE.x + 20, SIDE.y + 76, subtitle, { size: '12px', color: '#a9c3d1', wrap: SIDE.w - 40 });
  }

  drawSchool() {
    const l = LESSONS[this.lessonIndex];
    const key = 'oshiageSayaka_' + l.pose;
    if (this.textures.exists(key)) {
      const source = this.textures.get(key).getSourceImage();
      const h = 325;
      const img = this.own(this.add.image(985, 575, key)
        .setOrigin(0.5, 1).setScale(h / source.height).setMask(this.stageMask).setDepth(12));
      img.texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    }
    this.sideHeader('DRIVING ACADEMY', 'Sayaka Fujieda // Instructor');
    this.addText(SIDE.x + 20, SIDE.y + 145, l.title, { pixel: true, size: '10px', color: '#ffe394', wrap: SIDE.w - 40 });
    this.addText(SIDE.x + 20, SIDE.y + 205, l.text, { size: '12px', wrap: SIDE.w - 40, color: '#e6f2f7', spacing: 5 });
    this.addText(SIDE.x + 20, SIDE.y + 420, 'SAYAKA: ' + l.hint, { size: '11px', wrap: SIDE.w - 40, color: '#9de0dd' });
    this.addText(48, 654, 'DRIVING SCHOOL // CHOOSE A LESSON', { pixel: true, size: '10px', color: '#8feaff' });
    LESSONS.forEach((lesson, index) => {
      const x = 168 + index * 273;
      this.button(x, 738, 252, 61, lesson.title, () => {
        this.lessonIndex = index;
        this.renderView();
      }, { accent: index === this.lessonIndex, size: '7px' });
    });
    this.addText(48, 795, 'Instructor briefings // practical driving takes place at the race controls.', {
      size: '9px', color: '#91aabd',
    });
  }
  drawMeet() {
    const challengeWon = Boolean(
      (this.registry.get('tunerTeamChallenges') || {}).SHINJUKU?.championEarned ||
      (this.registry.get('tunerTeamChallenges') || {}).SHINJUKU?.completed
    );
    this.sideHeader('SKYTREE ELITE MEET', 'An Oshiage satellite meet. No new regional flag.');
    this.addText(SIDE.x + 20, SIDE.y + 158, challengeWon
      ? 'SHINJUKU CLEARED'
      : 'CHALLENGE LOCKED', {
      pixel: true, size: '10px', color: challengeWon ? '#62e8c7' : '#ffd68d',
    });
    this.addText(SIDE.x + 20, SIDE.y + 222,
      challengeWon
        ? 'You have earned access to the elite tier. The cross-region rival roster and race rewards are awaiting their final balance pass.'
        : 'Defeat the Shinjuku regional championship to qualify for the Skytree Elite challenge. Until then, explore the meet and prepare your cars.',
      { size: '12px', wrap: SIDE.w - 40, spacing: 5 });
    this.addText(SIDE.x + 20, SIDE.y + 420,
      'No pink-slip bets or championship points are awarded here yet.',
      { size: '10px', wrap: SIDE.w - 40, color: '#95adb8' });
    this.addText(48, 660, 'OSHIAGE // SKYTREE MEET', { pixel: true, size: '10px', color: '#8feaff' });
    this.button(183, 741, 270, 57, 'UNDERPASS VIEW', () => {
      this.meetAlternative = false; this.loadAndRender();
    }, { accent: !this.meetAlternative });
    this.button(485, 741, 270, 57, 'SKYTREE PLAZA', () => {
      this.meetAlternative = true; this.loadAndRender();
    }, { accent: this.meetAlternative });
    this.button(853, 741, 278, 57, 'ELITE RACE // SOON', null, { disabled: true });
  }
  drawCustomWorks() {
    this.sideHeader('CUSTOM WORKS', 'Exterior finishing // Oshiage');
    this.addText(SIDE.x + 20, SIDE.y + 164,
      'PAINT STUDIO', { pixel: true, size: '12px', color: '#e3f1fc' });
    this.addText(SIDE.x + 20, SIDE.y + 223,
      'Select a colour, inspect the side-view paint preview and send your own car through the spray bay.',
      { size: '12px', wrap: SIDE.w - 40 });
    const tier = Number(this.registry.get('garageTier') || 0);
    this.addText(SIDE.x + 20, SIDE.y + 390,
      tier >= 1 ? 'CANAL YARD // PAINT SERVICE OPEN' : 'CANAL YARD REQUIRED FOR PAINTING',
      { pixel: true, size: '8px', wrap: SIDE.w - 40, color: tier >= 1 ? '#73ead0' : '#ffc18b' });
    this.addText(48, 660, 'SERVICES // EXTERIOR CUSTOMISATION', { pixel: true, size: '10px', color: '#8feaff' });
    this.button(225, 736, 350, 66, 'ENTER PAINT STUDIO', () => {
      this.room = 'paint';
      this.pendingPaint = null;
      this.loadAndRender(() => this.rollPaintCarIn());
    });
    this.button(665, 736, 350, 66, 'BODY KITS // FUTURE', null, { disabled: true });
  }
  drawPaintStudio() {
    const { id, car, state } = this.selectedCar();
    this.sideHeader('PAINT STUDIO', car ? String(car.name || car.label || id).toUpperCase() : 'NO CAR SELECTED');
    this.button(SIDE.x + SIDE.w / 2, SIDE.y + 150, SIDE.w - 40, 38, 'BACK TO CUSTOM WORKS', () => {
      this.room = 'outside'; this.pendingPaint = null; this.loadAndRender();
    }, { size: '7px' });
    if (!car) {
      this.addText(SIDE.x + 20, SIDE.y + 245,
        'Select an owned car at your workshop to preview a paint job.',
        { size: '12px', wrap: SIDE.w - 40 });
      return;
    }
    const current = getCarPaintColor(state);
    if (this.pendingPaint == null) this.pendingPaint = current;
    const paintable = hasLayeredPaintAssets(this, car);
    const canPurchase = Number(this.registry.get('garageTier') || 0) >= 1;
    const cost = 8000; // First pass uses the base garage paint fee; no double charge.
    this.paintObjects = this.drawOwnedCar(car, state, 615, 455, 690, this.pendingPaint);
    this.addText(SIDE.x + 20, SIDE.y + 221, 'CHOOSE A FINISH', { pixel: true, size: '9px', color: '#e5f8ff' });
    PAINT_PRESETS.forEach((p, i) => {
      const x = SIDE.x + 49 + (i % 5) * 62;
      const y = SIDE.y + 297 + Math.floor(i / 5) * 66;
      const active = p.color === this.pendingPaint;
      const swatch = this.own(this.add.rectangle(x, y, 43, 38, p.color)
        .setStrokeStyle(active ? 4 : 2, active ? 0xeaffff : 0x526676)
        .setDepth(33));
      if (paintable) swatch.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        if (this.paintBusy) return;
        this.pendingPaint = p.color;
        this.renderView();
      });
    });
    this.addText(SIDE.x + 20, SIDE.y + 450,
      !paintable ? 'THIS CAR HAS NO TINTABLE PAINT LAYERS'
        : !canPurchase ? 'CANAL YARD REQUIRED'
          : this.pendingPaint === current ? 'CURRENT FINISH'
            : 'FULL REPAINT // ' + MONEY(cost), {
      pixel: true, size: '8px', color: '#f6dda0', wrap: SIDE.w - 40,
    });
    this.button(SIDE.x + SIDE.w / 2, SIDE.y + 550, SIDE.w - 40, 53,
      'SPRAY PAINT // ' + MONEY(cost), () => this.applyPaint(id, this.pendingPaint, cost),
      { disabled: !paintable || !canPurchase || this.pendingPaint === current ||
          Number(this.registry.get('cash') || 0) < cost, accent: true });
    this.addText(48, 665, 'PAINT BAY // SIDE PROFILE', { pixel: true, size: '10px', color: '#8feaff' });
    this.addText(48, 725, this.paintBusy ? 'SPRAYING...' : 'Your car enters from the side. No front-facing sprites required.', {
      size: '13px', color: '#d6edf3', wrap: 1020,
    });
  }
  drawOwnedCar(car, state, x, y, width, paintColor) {
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
    const depth = 11;
    const objects = [];
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
      track(this.add.image(wheelX, wheelY, wheelVisual.wheelKey)
        .setScale(axle.wheelScale).setDepth(depth + 0.2));
    }
    const body = createCarBodyLayers(this, car, {
      x: drawX, y: visualY, scale, depth: depth + 1, paintColor,
    });
    for (const obj of body.objects) track(obj);
    const mods = createVisualModLayers(this, car, state, {
      x: drawX, y: visualY, scale, depth: depth + 1.01, paintColor, bodyLayers: body,
    });
    for (const obj of mods) track(obj);
    return objects;
  }
  rollPaintCarIn() {
    if (this.room !== 'paint' || !this.paintObjects.length) return;
    this.paintObjects.forEach(o => {
      const originalX = o.x;
      o.x -= 1150;
      this.tweens.add({ targets: o, x: originalX, duration: 1000, ease: 'Sine.easeOut' });
    });
  }
  applyPaint(carId, color, cost) {
    if (this.paintBusy || this.room !== 'paint') return;
    const owned = this.registry.get('ownedCarIds') || [];
    if (!owned.includes(carId)) return;
    const current = (this.registry.get('carStates') || {})[carId] || {};
    const paintColor = normalisePaintColor(color);
    if (getCarPaintColor(current) === paintColor) return;
    if (Number(this.registry.get('garageTier') || 0) < 1) return;
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
      const y = 360 + Phaser.Math.Between(0, 155);
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
