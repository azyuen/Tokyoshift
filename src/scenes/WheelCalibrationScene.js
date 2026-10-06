import { cars, carOrder } from '../data/cars.js?v=20261006-r388';
import {
  DEFAULT_PAINT_COLOR,
  createCarBodyLayers,
  ensureDerivedModularCarTextures,
  getCarBodyScaleForWidth,
  getCarBodyTextureKey,
  preloadCarAppearanceAssets,
  preloadCarWheel,
} from '../vehicles/CarAppearance.js?v=20260929-r247';
import { getWheelPairFit } from '../vehicles/WheelFit.js?v=20260929-r258';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default class WheelCalibrationScene extends Phaser.Scene {
  constructor() { super('WheelCalibrationScene'); }

  init(data = {}) {
    const storedId = this.registry.get('wheelCalibrationCarId');
    const requestedId = data.carId || storedId || this.registry.get('selectedCarId') || carOrder[0];
    this.currentIndex = Math.max(0, carOrder.indexOf(requestedId));
    this.selectedAxle = data.axle === 'front' ? 'front' : 'rear';
  }

  preload() {
    const carId = carOrder[this.currentIndex] || carOrder[0];
    const car = cars[carId];
    if (!car) return;

    const states = this.registry.get('carStates') || {};
    const state = { ...(states[carId] || {}) };
    delete state.customWheelId;

    preloadCarAppearanceAssets(this, { [carId]: car }, '20260929-r247');
    preloadCarWheel(this, car, state);
  }

  create() {
    if (!this.registry.get('devMode')) {
      this.scene.start('GarageScene');
      return;
    }

    this.scale.resize(1560, 840);
    this.previewObjects = [];
    this.infoText = null;
    this.copyStatus = null;
    this.resetTemp();

    this.add.rectangle(780, 420, 1560, 840, 0x03070d, 1);
    this.add.rectangle(780, 38, 1510, 58, 0x07111d, 1)
      .setStrokeStyle(2, 0x8b6938, 1);
    this.add.text(44, 38, 'DEV // WHEEL FIT CALIBRATION', {
      fontFamily: PIXEL_FONT,
      fontSize: '15px',
      color: '#fff4d7',
    }).setOrigin(0, 0.5);

    this.buildControls();
    this.renderPreview();
  }

  getCurrentCar() {
    return cars[carOrder[this.currentIndex] || carOrder[0]];
  }

  resetTemp() {
    const car = this.getCurrentCar();
    const v = car?.visual || {};
    this.temp = {
      rearX: num(v.rearWheelOffsetX, num(v.rearOffsetX, 0)),
      frontX: num(v.frontWheelOffsetX, num(v.frontOffsetX, 0)),
      rearY: num(v.rearWheelOffsetY, num(v.wheelOffsetY, 0)),
      frontY: num(v.frontWheelOffsetY, num(v.wheelOffsetY, 0)),
      rearScale: num(v.rearWheelScale, num(v.wheelScale, 0.039)),
      frontScale: num(v.frontWheelScale, num(v.wheelScale, 0.039)),
    };
  }

  clearPreview() {
    this.previewObjects.forEach(obj => {
      try { obj?.destroy?.(); } catch (e) {}
    });
    this.previewObjects = [];
  }

  addPreview(obj) {
    if (obj) this.previewObjects.push(obj);
    return obj;
  }

  button(x, y, w, label, onDown, accent = 0x315b73) {
    const rect = this.add.rectangle(x, y, w, 42, 0x0b1722, 1)
      .setStrokeStyle(2, accent, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#eefaff',
    }).setOrigin(0.5);
    rect.on('pointerdown', onDown);
    return rect;
  }

  buildControls() {
    this.button(1450, 38, 120, 'BACK', () => this.scene.start('GarageScene'), 0x56646d);

    this.button(1040, 114, 160, '< CAR', () => this.changeCar(-1));
    this.button(1230, 114, 160, 'CAR >', () => this.changeCar(1));

    this.button(1040, 176, 160, 'REAR AXLE', () => {
      this.selectedAxle = 'rear';
      this.renderPreview();
    }, 0xd7a95b);
    this.button(1230, 176, 160, 'FRONT AXLE', () => {
      this.selectedAxle = 'front';
      this.renderPreview();
    }, 0x58cde8);

    this.button(1040, 264, 150, 'X -', () => this.adjust('X', -2));
    this.button(1230, 264, 150, 'X +', () => this.adjust('X', 2));
    this.button(1040, 324, 150, 'Y -', () => this.adjust('Y', -2));
    this.button(1230, 324, 150, 'Y +', () => this.adjust('Y', 2));
    this.button(1040, 384, 150, 'SIZE -', () => this.adjust('Scale', -0.001));
    this.button(1230, 384, 150, 'SIZE +', () => this.adjust('Scale', 0.001));

    this.button(1135, 452, 340, 'RESET CURRENT CAR', () => {
      this.resetTemp();
      this.renderPreview();
    }, 0x56646d);

    this.button(1135, 512, 340, 'COPY CONFIG', () => this.copyConfig(), 0x9b6a37);

    this.copyStatus = this.add.text(1135, 550, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '6px',
      color: '#83efc8',
    }).setOrigin(0.5);

    this.infoText = this.add.text(950, 590, '', {
      fontFamily: BODY_FONT,
      fontSize: '11px',
      color: '#c7d8e2',
      lineSpacing: 5,
      wordWrap: { width: 520 },
    });

    this.add.text(
      950,
      774,
      'Preview-only. COPY CONFIG and paste the values back into cars.js after visual review.',
      {
        fontFamily: BODY_FONT,
        fontSize: '10px',
        color: '#7f96a3',
        wordWrap: { width: 520 },
      }
    );
  }

  changeCar(delta) {
    this.currentIndex = (
      this.currentIndex + delta + carOrder.length
    ) % carOrder.length;
    const carId = carOrder[this.currentIndex];
    this.registry.set('wheelCalibrationCarId', carId);
    this.scene.restart({ carId, axle: this.selectedAxle });
  }

  adjust(field, amount) {
    const prefix = this.selectedAxle;
    const key = prefix + field;
    if (!(key in this.temp)) return;

    this.temp[key] += amount;
    if (field === 'Scale') {
      this.temp[key] = Math.max(0.001, this.temp[key]);
    }
    this.renderPreview();
  }

  getOverrideVisual(car) {
    return {
      ...(car?.visual || {}),
      rearWheelOffsetX: this.temp.rearX,
      frontWheelOffsetX: this.temp.frontX,
      rearWheelOffsetY: this.temp.rearY,
      frontWheelOffsetY: this.temp.frontY,
      rearWheelScale: this.temp.rearScale,
      frontWheelScale: this.temp.frontScale,
    };
  }

  getConfigText() {
    return [
      'rearWheelOffsetX: ' + Math.round(this.temp.rearX) + ',',
      'frontWheelOffsetX: ' + Math.round(this.temp.frontX) + ',',
      'rearWheelOffsetY: ' + Math.round(this.temp.rearY) + ',',
      'frontWheelOffsetY: ' + Math.round(this.temp.frontY) + ',',
      'rearWheelScale: ' + this.temp.rearScale.toFixed(5) + ',',
      'frontWheelScale: ' + this.temp.frontScale.toFixed(5) + ',',
    ].join('\n');
  }

  async copyConfig() {
    const car = this.getCurrentCar();
    const text = '// ' + car.id + ' // ' + car.shortName + '\n' + this.getConfigText();
    try {
      await navigator.clipboard.writeText(text);
      this.copyStatus?.setText('COPIED TO CLIPBOARD');
    } catch (e) {
      this.copyStatus?.setText('COPY FAILED — VALUES SHOWN BELOW');
    }
  }

  renderPreview() {
    this.clearPreview();

    const car = this.getCurrentCar();
    if (!car) return;

    try {
      ensureDerivedModularCarTextures(this, { [car.id]: car });
    } catch (e) {}

    const bodyKey = getCarBodyTextureKey(this, car);
    const wheelKey = car.visual?.wheelKey;
    if (!this.textures.exists(bodyKey) || !wheelKey || !this.textures.exists(wheelKey)) {
      this.addPreview(this.add.text(560, 420, 'ASSET NOT READY', {
        fontFamily: PIXEL_FONT, fontSize: '12px', color: '#ff9aa8',
      }).setOrigin(0.5));
      return;
    }

    const bodyX = 510;
    const bodyY = 470;
    const targetWidth = 900;
    const bodyScale = getCarBodyScaleForWidth(this, car, targetWidth);
    const wheelSource = this.textures.get(wheelKey).getSourceImage();
    const visual = this.getOverrideVisual(car);
    const fit = getWheelPairFit(visual, bodyScale, false, wheelSource);

    const rearX = bodyX + fit.rear.offsetX;
    const frontX = bodyX + fit.front.offsetX;
    const rearY = bodyY + fit.rear.offsetY;
    const frontY = bodyY + fit.front.offsetY;

    this.addPreview(this.add.ellipse(
      bodyX, bodyY + 170, targetWidth * 0.90, 64, 0x000000, 0.55
    ).setDepth(1));

    const rear = this.addPreview(this.add.image(rearX, rearY, wheelKey)
      .setScale(fit.rear.wheelScale).setDepth(2));
    const front = this.addPreview(this.add.image(frontX, frontY, wheelKey)
      .setScale(fit.front.wheelScale).setDepth(2));

    const bodyLayers = createCarBodyLayers(this, car, {
      x: bodyX,
      y: bodyY,
      scale: bodyScale,
      depth: 3,
      paintColor: DEFAULT_PAINT_COLOR,
    });
    (bodyLayers?.objects || []).forEach(obj => this.addPreview(obj));

    const guide = this.addPreview(this.add.graphics().setDepth(10));
    guide.lineStyle(3, this.selectedAxle === 'rear' ? 0xffc560 : 0x526878, 0.95);
    guide.strokeCircle(rearX, rearY, Math.max(16, rear.displayWidth * 0.52));
    guide.lineBetween(rearX - 16, rearY, rearX + 16, rearY);
    guide.lineBetween(rearX, rearY - 16, rearX, rearY + 16);

    guide.lineStyle(3, this.selectedAxle === 'front' ? 0x58ddff : 0x526878, 0.95);
    guide.strokeCircle(frontX, frontY, Math.max(16, front.displayWidth * 0.52));
    guide.lineBetween(frontX - 16, frontY, frontX + 16, frontY);
    guide.lineBetween(frontX, frontY - 16, frontX, frontY + 16);

    this.addPreview(this.add.text(54, 92, car.name.toUpperCase() + ' // ' + car.id, {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#eefaff',
    }).setDepth(12));

    this.addPreview(this.add.text(54, 126,
      'Selected axle: ' + this.selectedAxle.toUpperCase() +
      '  //  orange = rear  //  cyan = front',
      {
        fontFamily: BODY_FONT,
        fontSize: '11px',
        color: '#9fb6c3',
      }
    ).setDepth(12));

    this.infoText?.setText(
      car.shortName + '  //  ' + (this.currentIndex + 1) + ' / ' + carOrder.length +
      '\n\n' + this.getConfigText() +
      '\n\nBODY SCALE: ' + bodyScale.toFixed(4) +
      '\nWHEEL ASSET: ' + wheelKey
    );
  }
}
