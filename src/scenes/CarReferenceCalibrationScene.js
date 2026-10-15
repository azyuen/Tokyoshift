import { finishSceneLoading } from '../ui/LoadingScreen.js';
import { STANDARD_CAR_REFERENCE as BASELINE, STANDARD_CAR_REFERENCE_ROOT } from '../data/carReferenceGeometry.js';

// Read-only reference assets. This scene never modifies gameplay car data.
// X positions are stored in unscaled source pixels, measured LEFT from the
// common bottom-right PNG anchor. Every car uses one shared body multiplier.
const REFS = [
  ['ae86', 'AE86'],
  ['ef', 'CIVIC EF'],
  ['ek9', 'CIVIC EK9'],
  ['22b', 'WRX GC8 STI'],
  ['evo6', 'EVO VI'],
  ['r32', 'R32 GT-R'],
  ['rx7fc', 'RX-7 FC'],
  ['rx7fd', 'RX-7 FD'],
  ['rx8', 'RX-8'],
];
const STORAGE_KEY = 'tokyoShiftRefCarCalibration_v1';
const FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", sans-serif';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function wheelFootprint(source) {
  // Wheel catalogue PNGs have a shared canvas, but some transparent border.
  // Measure the actual tyre once so both sizes really touch the PNG ground.
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(source, 0, 0);
  const pixels = context.getImageData(0, 0, source.width, source.height).data;
  let minX = source.width, minY = source.height, maxX = -1, maxY = -1;
  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      if (pixels[(y * source.width + x) * 4 + 3] < 25) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) {
    return { diameter: source.width, centerX: 0, bottomY: source.height / 2 };
  }
  return {
    diameter: Math.max(maxX - minX + 1, maxY - minY + 1),
    centerX: (minX + maxX + 1) / 2 - source.width / 2,
    bottomY: maxY + 1 - source.height / 2,
  };
}

export default class CarReferenceCalibrationScene extends Phaser.Scene {
  constructor() {
    super('CarReferenceCalibrationScene');
    this._menuNavigationCaptureInput = true;
  }

  preload() {
    for (const [id] of REFS) {
      for (const layer of ['body', 'paint']) {
        const key = 'carRef_' + id + '_' + layer;
        if (!this.textures.exists(key)) {
          this.load.image(key, STANDARD_CAR_REFERENCE_ROOT + '/' + id + '_stock_' + layer + '.png');
        }
      }
    }
    if (!this.textures.exists('carRef_wheel')) {
      this.load.image('carRef_wheel', 'assets/wheels/wheel_5spoke.png');
    }
  }

  create() {
    document.body.dataset.scene = 'car-calibration';
    this.scale.resize(1560, 840);
    this.view = 'grid';
    this.selectedIndex = 0;
    this.selectedAxle = 'rear';
    this.showWheels = true;
    this.showPaint = true;
    this.status = '';
    this.objects = [];
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch (e) {}
    // Browser-local edits remain available, but GIMP-approved values are now
    // the canonical default on every device. Saved per-device tweaks override
    // only when explicitly adjusted in this calibration screen.
    this.masterScale = clamp(Number(saved.masterScale ?? BASELINE.masterScale), 0.26, 0.355);
    this.diameters = {
      S: clamp(Number(saved.diameters?.S ?? BASELINE.wheelDiameters.S), 130, 230),
      L: clamp(Number(saved.diameters?.L ?? BASELINE.wheelDiameters.L), 150, 250),
    };
    this.calibrations = {};
    for (const [id] of REFS) {
      const tex = this.textures.get('carRef_' + id + '_body');
      const source = tex?.getSourceImage();
      const width = source?.width || 1200;
      const authored = BASELINE.cars[id] || {};
      const previous = saved.cars?.[id] || {};
      this.calibrations[id] = {
        rearX: clamp(Number(previous.rearX ?? authored.rearX ?? -Math.round(width * 0.80)), -width, 0),
        frontX: clamp(Number(previous.frontX ?? authored.frontX ?? -Math.round(width * 0.20)), -width, 0),
        size: (previous.size ?? authored.size) === 'L' ? 'L' : 'S',
      };
    }
    try {
      const source = this.textures.get('carRef_wheel').getSourceImage();
      this.wheelMetrics = wheelFootprint(source);
    } catch (e) {
      this.wheelMetrics = { diameter: 384, centerX: 0, bottomY: 192 };
    }
    this.render();
    finishSceneLoading();
  }

  persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        masterScale: this.masterScale,
        diameters: this.diameters,
        cars: this.calibrations,
      }));
    } catch (e) {}
  }

  track(obj) {
    this.objects.push(obj);
    return obj;
  }

  clear() {
    for (const obj of this.objects || []) {
      try { obj?.destroy?.(); } catch (e) {}
    }
    this.objects = [];
  }

  text(x, y, value, size = 9, color = '#c9dce9') {
    return this.track(this.addText(x, y, value, size, color));
  }

  addText(x, y, value, size, color) {
    return this.add.text(x, y, String(value), {
      fontFamily: FONT, fontSize: size + 'px', color,
    });
  }

  button(x, y, w, label, action, color = 0x365c79) {
    const area = this.track(this.add.rectangle(x, y, w, 40, 0x0b1d2c, 1)
      .setStrokeStyle(2, color)
      .setInteractive({ useHandCursor: true })
      .setDepth(100));
    this.track(this.add.text(x, y, label, {
      fontFamily: FONT, fontSize: '7px', color: '#f3f9fc',
    }).setOrigin(0.5).setDepth(101));
    area.on('pointerdown', action);
  }

  setStatus(value) {
    this.status = value;
    this.render();
  }

  changeScale(delta) {
    this.masterScale = Math.round(clamp(this.masterScale + delta, 0.26, 0.355) * 1000) / 1000;
    this.persist();
    this.render();
  }

  returnToGame() {
    const url = new URL(window.location.href);
    url.searchParams.delete('carref');
    window.location.assign(url.toString());
  }

  render() {
    this.clear();
    this.track(this.add.rectangle(780, 420, 1560, 840, 0x050b15, 1).setDepth(-10));
    this.track(this.add.rectangle(780, 42, 1524, 66, 0x0a1928, 1)
      .setStrokeStyle(2, 0x335d78).setDepth(-5));
    this.text(35, 23, 'TOKYO SHIFT // 9-CAR REFERENCE TEST', 15, '#f5f0dd');
    this.button(730, 45, 112, this.view === 'grid' ? 'DETAIL' : 'ALL 9', () => {
      this.view = this.view === 'grid' ? 'detail' : 'grid'; this.render();
    });
    this.button(857, 45, 126, this.showWheels ? 'WHEELS ON' : 'WHEELS OFF', () => {
      this.showWheels = !this.showWheels; this.render();
    });
    this.button(1000, 45, 126, this.showPaint ? 'PAINT ON' : 'PAINT OFF', () => {
      this.showPaint = !this.showPaint; this.render();
    });
    this.button(1120, 45, 90, 'SCALE -', () => this.changeScale(-0.005));
    this.button(1222, 45, 90, 'SCALE +', () => this.changeScale(0.005));
    this.button(1352, 45, 128, 'COPY DATA', () => this.copyData(), 0x997044);
    this.button(1484, 45, 105, 'GAME', () => this.returnToGame(), 0x6b4b64);

    if (this.view === 'grid') this.renderGrid();
    else this.renderDetail();
    this.text(36, 797,
      'AE86 MASTER = ' + this.masterScale.toFixed(3) +
      ' // ALL CARS SHARE ONE SCALE // BOTTOM-RIGHT ANCHOR // GROUND = PNG BOTTOM',
      8, '#91c6c9');
    if (this.status) this.text(980, 797, this.status, 8, '#ffd787');
  }

  renderCar(id, right, ground, scale, guides = false) {
    const bodyKey = 'carRef_' + id + '_body';
    const paintKey = 'carRef_' + id + '_paint';
    if (!this.textures.exists(bodyKey)) {
      this.text(right - 160, ground - 80, 'MISSING ' + id, 9, '#ffa0af');
      return;
    }
    const car = this.calibrations[id];
    const source = this.textures.get(bodyKey).getSourceImage();
    const width = source.width * scale;
    const line = this.track(this.add.graphics().setDepth(10));
    line.lineStyle(guides ? 3 : 1, 0x64c5c8, guides ? 0.95 : 0.55);
    line.lineBetween(right - width - 8, ground, right + 9, ground);
    if (guides) {
      line.lineStyle(2, 0xe6b867, 0.85);
      line.lineBetween(right, ground - source.height * scale - 25, right, ground + 10);
    }

    if (this.showWheels && this.textures.exists('carRef_wheel')) {
      const diameter = this.diameters[car.size];
      const wheelScale = diameter * scale / this.wheelMetrics.diameter;
      for (const axle of ['rear', 'front']) {
        const wheelX = right + car[axle + 'X'] * scale;
        const visibleX = wheelX - this.wheelMetrics.centerX * wheelScale;
        const wheelY = ground - this.wheelMetrics.bottomY * wheelScale;
        this.track(this.add.circle(wheelX, ground - diameter * scale / 2,
          diameter * scale / 2 * 1.03, 0x020407, 1).setDepth(1));
        this.track(this.add.image(visibleX, wheelY, 'carRef_wheel')
          .setScale(wheelScale).setDepth(2));
        if (guides) {
          const label = axle === 'rear' ? 'REAR' : 'FRONT';
          const color = axle === this.selectedAxle ? 0xffca69 : 0x69ddf1;
          line.lineStyle(2, color, 1);
          line.strokeCircle(wheelX, ground - diameter * scale / 2, diameter * scale * 0.51);
          this.text(wheelX - 30, ground + 16,
            label + ' ' + Math.round(car[axle + 'X']), 7,
            axle === this.selectedAxle ? '#ffca69' : '#69ddf1');
        }
      }
    }
    if (this.showPaint && this.textures.exists(paintKey)) {
      this.track(this.add.image(right, ground, paintKey)
        .setOrigin(1, 1).setScale(scale).setDepth(3));
    }
    this.track(this.add.image(right, ground, bodyKey)
      .setOrigin(1, 1).setScale(scale).setDepth(4));
  }

  renderGrid() {
    this.text(36, 91,
      'SAME SCALE, SAME RIGHT EDGE PER TILE, SAME GROUND LINE // TAP A CAR TO ADJUST ITS AXLES',
      8, '#a4bccc');
    const xs = [490, 1005, 1520];
    const ys = [290, 505, 720];
    REFS.forEach(([id, name], i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const right = xs[col];
      const ground = ys[row];
      this.track(this.add.rectangle(right - 240, ground - 80, 486, 202, 0x0b1724, 1)
        .setStrokeStyle(1, id === REFS[this.selectedIndex][0] ? 0xd4a85c : 0x20394c)
        .setDepth(-2));
      this.text(right - 470, ground - 167, name, 10, '#e5f2fb');
      const config = this.calibrations[id];
      this.text(right - 470, ground - 141,
        String(config.size) + ' WHEELS  /  REAR ' + Math.round(config.rearX) +
        '  /  FRONT ' + Math.round(config.frontX), 7, '#839daf');
      this.renderCar(id, right - 10, ground, this.masterScale);
      const hit = this.track(this.add.rectangle(right - 240, ground - 80, 485, 202, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true }).setDepth(25));
      hit.on('pointerdown', () => {
        this.selectedIndex = i;
        this.view = 'detail';
        this.render();
      });
    });
  }

  renderDetail() {
    const [id, name] = REFS[this.selectedIndex];
    const car = this.calibrations[id];
    this.track(this.add.rectangle(230, 435, 400, 675, 0x0a1928, 1)
      .setStrokeStyle(2, 0x34596a));
    this.text(45, 111, name + ' // AXLE CALIBRATION', 11, '#ffcf8c');
    this.text(45, 158, 'TAP CAR AREA TO SET X', 9, '#d3e6f0');
    this.text(45, 192, 'Only the X positions vary.', 8, '#9eb9cb');
    this.button(128, 251, 164, '< PREVIOUS', () => {
      this.selectedIndex = (this.selectedIndex + REFS.length - 1) % REFS.length; this.render();
    });
    this.button(331, 251, 164, 'NEXT >', () => {
      this.selectedIndex = (this.selectedIndex + 1) % REFS.length; this.render();
    });
    this.button(128, 322, 164, 'REAR AXLE', () => {
      this.selectedAxle = 'rear'; this.render();
    }, this.selectedAxle === 'rear' ? 0xe0b263 : 0x315a79);
    this.button(331, 322, 164, 'FRONT AXLE', () => {
      this.selectedAxle = 'front'; this.render();
    }, this.selectedAxle === 'front' ? 0x55b9d6 : 0x315a79);
    this.button(128, 384, 164, 'X - 2', () => this.moveAxle(-2));
    this.button(331, 384, 164, 'X + 2', () => this.moveAxle(2));
    this.button(128, 455, 164, 'SMALL TYRE', () => this.setSize('S'),
      car.size === 'S' ? 0xd4ac61 : 0x315a79);
    this.button(331, 455, 164, 'LARGE TYRE', () => this.setSize('L'),
      car.size === 'L' ? 0xd4ac61 : 0x315a79);
    this.button(128, 517, 164, 'DIAMETER -', () => this.changeDiameter(-2));
    this.button(331, 517, 164, 'DIAMETER +', () => this.changeDiameter(2));

    this.text(45, 571, 'REAR X: ' + Math.round(car.rearX) +
      '   FRONT X: ' + Math.round(car.frontX), 9, '#d5e8f4');
    this.text(45, 604, car.size + ' WHEEL: ' + this.diameters[car.size] +
      ' SOURCE PIXELS', 8, '#d5e8f4');
    this.text(45, 647, 'ONE SHARED AE86 SCALE', 8, '#88c5cc');
    this.text(45, 675, 'No car-specific Y or scaling.', 8, '#9eb9cb');
    this.button(230, 725, 357, 'RESET CURRENT CAR', () => {
      const baseline = BASELINE.cars[id];
      car.rearX = baseline.rearX;
      car.frontX = baseline.frontX;
      car.size = baseline.size;
      this.persist(); this.render();
    }, 0x696776);

    const right = 1480;
    const ground = 605;
    const scale = this.masterScale * 2.25;
    this.text(525, 121,
      'PREVIEW / ' + this.selectedAxle.toUpperCase() +
      ' // BODY AND PAINT MATCH EXACTLY', 9, '#e5f1f7');
    this.renderCar(id, right, ground, scale, true);

    const bodySource = this.textures.get('carRef_' + id + '_body').getSourceImage();
    const width = bodySource.width * scale;
    // The tap target is restricted to the body canvas, not the left controls.
    const hit = this.track(this.add.rectangle(right - width / 2, ground - bodySource.height * scale / 2,
      width, bodySource.height * scale, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true }).setDepth(20));
    hit.on('pointerdown', pointer => {
      car[this.selectedAxle + 'X'] = Math.round(
        clamp((pointer.x - right) / scale, -bodySource.width, 0)
      );
      this.persist();
      this.render();
    });
    this.text(525, 685,
      'WHEELS CONTACT THE PNG BOTTOM // X COORDINATES ARE MEASURED FROM THE RIGHT EDGE',
      8, '#93b1bf');
  }

  moveAxle(delta) {
    const id = REFS[this.selectedIndex][0];
    const source = this.textures.get('carRef_' + id + '_body').getSourceImage();
    const key = this.selectedAxle + 'X';
    this.calibrations[id][key] = clamp(this.calibrations[id][key] + delta, -source.width, 0);
    this.persist();
    this.render();
  }

  setSize(size) {
    this.calibrations[REFS[this.selectedIndex][0]].size = size;
    this.persist();
    this.render();
  }

  changeDiameter(delta) {
    const size = this.calibrations[REFS[this.selectedIndex][0]].size;
    this.diameters[size] = clamp(this.diameters[size] + delta, 130, 250);
    this.persist();
    this.render();
  }

  async copyData() {
    const exportData = {
      note: 'Source pixels. Common bottom-right origin. Global scale from AE86.',
      masterScale: this.masterScale,
      wheelDiameters: { ...this.diameters },
      cars: this.calibrations,
    };
    const content = JSON.stringify(exportData, null, 2);
    try {
      await navigator.clipboard.writeText(content);
      this.setStatus('COPIED');
    } catch (e) {
      this.setStatus('CLIPBOARD UNAVAILABLE');
      console.info('Tokyo SHIFT ref calibration:', content);
    }
  }
}
