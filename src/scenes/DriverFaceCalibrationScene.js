import { cars, carOrder } from '../data/cars.js?v=20261013-driverface';
import { CAR_DRIVER_FACE_ANCHORS } from '../data/carDriverFaceAnchors.js?v=20261013-driverface';
import { getCarAssetPaths } from '../vehicles/CarAppearance.js?v=20261013-driverface';
import { characters, characterOrder, getCharacterAssetUrl } from '../data/characters.js?v=20261013-driverface';
import { resolveCharacterFaceAnchor } from '../characters/CharacterFaceAnchor.js?v=20261013-driverface';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261013-driverface';
import { createDriverSilhouette } from '../vehicles/DriverSilhouette.js?v=20261013-driverface';

const FONT = '"Rajdhani", sans-serif';
const HEAD_FONT = '"Silkscreen", monospace';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v)));

export default class DriverFaceCalibrationScene extends Phaser.Scene {
  constructor() { super('DriverFaceCalibrationScene'); }

  preload() {
    for (const id of carOrder) {
      const key = 'driverface_car_' + id;
      if (!this.textures.exists(key)) this.load.image(key, getCarAssetPaths(cars[id]).body);
    }
    const character = characters.renMizuno;
    this.load.image(character.visual.spriteKey, getCharacterAssetUrl(character.visual.path));
  }

  create() {
    document.body.dataset.scene = 'driver-face-calibration';
    this.scale.resize(1560, 840);
    this.carIndex = 0;
    this.characterIndex = Math.max(0, characterOrder.indexOf('renMizuno'));
    this.localSeats = structuredClone(CAR_DRIVER_FACE_ANCHORS);
    this.localFaces = {};
    this.objects = [];
    this.status = 'TAP WINDOW TO MOVE FACE ANCHOR';
    this.render();
  }

  clear() {
    for (const object of this.objects) object?.destroy?.();
    this.objects = [];
  }

  keep(object) { if (object) this.objects.push(object); return object; }

  text(x, y, label, size = 16, color = '#deeef5') {
    return this.keep(this.add.text(x, y, String(label), {
      fontFamily: FONT, fontSize: size + 'px', color,
    }).setDepth(90));
  }

  button(x, y, width, label, action) {
    const rect = this.keep(this.add.rectangle(x, y, width, 40, 0x142b3b)
      .setStrokeStyle(2, 0x47819a)
      .setDepth(95)
      .setInteractive({ useHandCursor: true }));
    this.keep(this.add.text(x, y, label, {
      fontFamily: HEAD_FONT, fontSize: '10px', color: '#e8f8ff',
    }).setOrigin(0.5).setDepth(96));
    rect.on('pointerdown', action);
  }

  selectCharacter(delta) {
    this.characterIndex = (this.characterIndex + delta + characterOrder.length) % characterOrder.length;
    const character = characters[characterOrder[this.characterIndex]];
    if (!this.textures.exists(character.visual.spriteKey)) {
      this.status = 'LOADING CHARACTER ...';
      this.render();
      this.load.image(character.visual.spriteKey, getCharacterAssetUrl(character.visual.path));
      this.load.once('complete', () => {
        this.status = 'CHARACTER READY';
        this.render();
      });
      this.load.start();
    } else {
      this.render();
    }
  }

  adjustCar(field, delta) {
    const id = carOrder[this.carIndex];
    const face = this.localSeats[id];
    face[field] = Math.round(clamp(face[field] + delta,
      field === 'height' ? 0.05 : 0, field === 'height' ? 0.26 : 1) * 1000) / 1000;
    this.render();
  }

  adjustCharacter(field, delta) {
    const id = characterOrder[this.characterIndex];
    const visual = characters[id]?.visual;
    if (!visual || !this.textures.exists(visual.spriteKey)) return;
    const src = this.textures.get(visual.spriteKey).getSourceImage();
    const current = this.localFaces[id] || (() => {
      const face = resolveCharacterFaceAnchor(src, visual.spriteKey, visual);
      return { x: face.x / src.width, y: face.y / src.height,
        headHeight: face.headHeight / src.height };
    })();
    current[field] = Math.round(clamp(current[field] + delta, 0, 1) * 1000) / 1000;
    this.localFaces[id] = current;
    this.render();
  }

  async exportAnchors() {
    const changedSeats = Object.fromEntries(
      Object.entries(this.localSeats).filter(([id, value]) =>
        JSON.stringify(value) !== JSON.stringify(CAR_DRIVER_FACE_ANCHORS[id])));
    const result = JSON.stringify({
      note: 'Car driverFace x/y/height are normalized source PNG fractions. Character faceAnchor is normalized to full idle sprite.',
      carDriverFaceAnchors: changedSeats,
      characterFaceAnchors: this.localFaces,
    }, null, 2);
    try {
      await navigator.clipboard.writeText(result);
      this.status = 'CHANGED ANCHORS COPIED';
    } catch (e) {
      this.status = 'CLIPBOARD UNAVAILABLE; SEE CONSOLE';
      console.info('Tokyo SHIFT driver face anchors', result);
    }
    this.render();
  }

  render() {
    this.clear();
    this.keep(this.add.rectangle(780, 420, 1560, 840, 0x07111d).setDepth(-10));
    this.keep(this.add.rectangle(780, 45, 1520, 70, 0x0f2837).setDepth(-5));
    this.text(34, 25, 'TOKYO SHIFT / FACE ANCHOR CALIBRATION', 17);
    this.button(1475, 44, 115, 'GAME', () => {
      const url = new URL(location.href);
      url.searchParams.delete('driverface');
      location.assign(url.toString());
    });
    this.button(1303, 44, 210, 'COPY CHANGES', () => this.exportAnchors());

    const id = carOrder[this.carIndex];
    const car = cars[id];
    const face = this.localSeats[id];
    const tex = this.textures.get('driverface_car_' + id);
    const source = tex?.getSourceImage();
    const width = source?.width || car.visual.referenceCanvasWidth || 1200;
    const height = source?.height || car.visual.referenceCanvasHeight || 500;
    const scale = Math.min(950 / width, 465 / height);
    const left = 55 + (950 - width * scale) / 2;
    const top = 155 + (465 - height * scale) / 2;

    this.text(50, 110, car.name + '  /  ' + (this.carIndex + 1) + ' OF ' + carOrder.length, 24, '#ffe3a3');
    this.keep(this.add.rectangle(529, 387, 968, 485, 0x677580).setDepth(-2));
    if (source) {
      const activeCharacter = characters[characterOrder[this.characterIndex]];
      const visual = activeCharacter?.visual;
      if (visual && this.textures.exists(visual.spriteKey)) {
        const oldFace = car.visual.driverFace;
        const oldCharFace = visual.faceAnchor;
        car.visual.driverFace = face;
        if (this.localFaces[activeCharacter.id]) visual.faceAnchor = this.localFaces[activeCharacter.id];
        const bodyX = left + width * scale * (car.visual.referenceStandard ? 1 : 0.5);
        const bodyY = top + height * scale * (car.visual.referenceStandard ? 1 : 0.5);
        const silhouette = createDriverSilhouette(this, car.visual, activeCharacter, {
          bodyX, bodyY, bodyScale: scale, sourceWidth: width, sourceHeight: height, depth: 5,
        });
        if (silhouette?.image) this.keep(silhouette.image);
        car.visual.driverFace = oldFace;
        visual.faceAnchor = oldCharFace;
      }
      this.keep(this.add.image(left, top, 'driverface_car_' + id)
        .setOrigin(0, 0).setScale(scale).setDepth(6));
      const markerX = left + face.x * width * scale;
      const markerY = top + face.y * height * scale;
      const guide = this.keep(this.add.graphics().setDepth(9));
      guide.lineStyle(2, 0x48fbff, 1);
      guide.strokeCircle(markerX, markerY, 8);
      guide.lineBetween(markerX - 18, markerY, markerX + 18, markerY);
      guide.lineBetween(markerX, markerY - 18, markerX, markerY + 18);
      const target = this.keep(this.add.rectangle(left + width * scale / 2,
        top + height * scale / 2, width * scale, height * scale, 0xffffff, 0.001)
        .setDepth(10).setInteractive({ useHandCursor: true }));
      target.on('pointerdown', pointer => {
        face.x = Math.round(clamp((pointer.x - left) / (width * scale), 0, 1) * 1000) / 1000;
        face.y = Math.round(clamp((pointer.y - top) / (height * scale), 0, 1) * 1000) / 1000;
        this.render();
      });
    }
    this.text(50, 654, 'TAP A POINT ON THE DRIVER WINDOW  /  TURQUOISE CROSS = FACE CENTRE', 15);
    this.button(118, 730, 150, '< CAR', () => { this.carIndex = (this.carIndex + carOrder.length - 1) % carOrder.length; this.render(); });
    this.button(278, 730, 150, 'CAR >', () => { this.carIndex = (this.carIndex + 1) % carOrder.length; this.render(); });
    this.button(443, 730, 135, 'HEAD -', () => this.adjustCar('height', -0.005));
    this.button(583, 730, 135, 'HEAD +', () => this.adjustCar('height', 0.005));
    this.text(700, 711, 'CAR X ' + face.x.toFixed(3) + '  Y ' + face.y.toFixed(3) +
      '  H ' + face.height.toFixed(3), 17, '#e5f3fa');

    const characterId = characterOrder[this.characterIndex];
    const character = characters[characterId];
    const visual = character?.visual;
    this.keep(this.add.rectangle(1280, 388, 470, 485, 0x1d2937).setDepth(-2));
    if (visual && this.textures.exists(visual.spriteKey)) {
      const oldAnchor = visual.faceAnchor;
      if (this.localFaces[characterId]) visual.faceAnchor = this.localFaces[characterId];
      const profile = createCharacterProfile(this, {
        characterId, x: 1280, y: 370, frameWidth: 390, frameHeight: 400, depth: 4,
      });
      if (profile) {
        this.keep(profile.image);
        this.keep(profile.maskShape);
      }
      visual.faceAnchor = oldAnchor;
    }
    this.text(1068, 115, character?.name || characterId, 22, '#ffe3a3');
    this.button(1105, 645, 145, '< DRIVER', () => this.selectCharacter(-1));
    this.button(1270, 645, 145, 'DRIVER >', () => this.selectCharacter(1));
    this.button(1100, 708, 145, 'FACE X -', () => this.adjustCharacter('x', -0.005));
    this.button(1280, 708, 145, 'FACE X +', () => this.adjustCharacter('x', 0.005));
    this.button(1100, 763, 145, 'FACE Y -', () => this.adjustCharacter('y', -0.005));
    this.button(1280, 763, 145, 'FACE Y +', () => this.adjustCharacter('y', 0.005));
    this.text(45, 797, this.status + ' / PREVIEW ONLY UNTIL CHANGES ARE COMMITTED', 14, '#8cdae4');
  }
}
