import {
  characters,
  characterOrder,
} from '../data/characters.js?v=20260925-r182';
import {
  createCharacterProfile,
  getCharacterProfileTexture,
  resolveCharacterProfile,
  PROFILE_HEAD_SAFE_RATIO,
  PROFILE_EYE_TARGET_RATIO,
  PROFILE_TORSO_CROP_RATIO,
} from '../characters/CharacterProfileRenderer.js?v=20260925-r182';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

export default class ProfileCalibrationScene extends Phaser.Scene {
  constructor() { super('ProfileCalibrationScene'); }

  preload() {
    characterOrder.forEach(id => {
      const visual = characters[id]?.visual;
      if (!visual) return;
      [
        [visual.spriteKey, visual.path],
        [visual.winSpriteKey, visual.winPath],
        [visual.lossSpriteKey, visual.lossPath],
      ].forEach(([key, path]) => {
        if (key && path && !this.textures.exists(key)) {
          this.load.image(key, path + '?v=20260925-r182');
        }
      });
    });
  }

  create() {
    if (!this.registry.get('devMode')) {
      this.scene.start('GarageScene');
      return;
    }

    document.body.dataset.scene = 'profile-calibration';
    this.scale.resize(1560, 840);
    this.currentIndex = Math.max(0, characterOrder.indexOf(
      this.registry.get('playerCharacterId') || 'renMizuno'
    ));
    this.pose = 'idle';
    this.largeFrame = false;
    this.temp = { scale: 0, offsetX: 0, offsetY: 0 };
    this.previewObjects = [];

    this.add.rectangle(780, 420, 1560, 840, 0x03070d, 1);
    this.add.rectangle(780, 38, 1510, 58, 0x07111d, 1)
      .setStrokeStyle(2, 0x2b5773, 1);
    this.add.text(44, 38, 'DEV // PROFILE CALIBRATION', {
      fontFamily: PIXEL_FONT, fontSize: '16px', color: '#eefaff',
    }).setOrigin(0, 0.5);

    this.infoText = this.add.text(1040, 118, '', {
      fontFamily: BODY_FONT,
      fontSize: '12px',
      color: '#d7e8f0',
      lineSpacing: 7,
      wordWrap: { width: 450 },
    });

    this.add.text(1040, 82, 'CANONICAL PROFILE METADATA', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#7edfff',
    });

    this.buildControls();
    this.renderPreview();
  }

  buildControls() {
    const button = (x, y, w, label, onDown, accent = 0x315b73) => {
      const rect = this.add.rectangle(x, y, w, 42, 0x0b1722, 1)
        .setStrokeStyle(2, accent, 1)
        .setInteractive({ useHandCursor: true });
      this.add.text(x, y, label, {
        fontFamily: PIXEL_FONT, fontSize: '7px', color: '#eefaff',
      }).setOrigin(0.5);
      rect.on('pointerdown', onDown);
      return rect;
    };

    button(92, 38, 110, 'BACK', () => this.scene.start('GarageScene'), 0x56646d);

    button(1068, 330, 170, '< CHARACTER', () => {
      this.currentIndex = (this.currentIndex - 1 + characterOrder.length) % characterOrder.length;
      this.resetTemp();
    });
    button(1280, 330, 170, 'CHARACTER >', () => {
      this.currentIndex = (this.currentIndex + 1) % characterOrder.length;
      this.resetTemp();
    });

    button(1065, 390, 105, 'IDLE', () => { this.pose = 'idle'; this.resetTemp(false); });
    button(1190, 390, 105, 'WIN', () => { this.pose = 'win'; this.resetTemp(false); });
    button(1315, 390, 105, 'LOSS', () => { this.pose = 'loss'; this.resetTemp(false); });

    button(1080, 470, 130, 'X -', () => this.adjust('offsetX', -2));
    button(1240, 470, 130, 'X +', () => this.adjust('offsetX', 2));
    button(1080, 525, 130, 'Y -', () => this.adjust('offsetY', -2));
    button(1240, 525, 130, 'Y +', () => this.adjust('offsetY', 2));
    button(1080, 580, 130, 'SCALE -', () => this.adjust('scale', -0.02));
    button(1240, 580, 130, 'SCALE +', () => this.adjust('scale', 0.02));

    button(1160, 650, 290, 'PORTRAIT / CUTSCENE SIZE', () => {
      this.largeFrame = !this.largeFrame;
      this.renderPreview();
    }, 0x9b6a37);

    button(1160, 710, 290, 'RESET TEMP ADJUSTMENTS', () => this.resetTemp(false), 0x56646d);

    this.add.text(1040, 755,
      'Controls are preview-only. Copy only genuine outlier values into visual.profile after review.',
      {
        fontFamily: BODY_FONT,
        fontSize: '10px',
        color: '#8fa5b2',
        wordWrap: { width: 430 },
      }
    );
  }

  adjust(field, amount) {
    this.temp[field] += amount;
    this.renderPreview();
  }

  resetTemp(resetPose = true) {
    this.temp = { scale: 0, offsetX: 0, offsetY: 0 };
    if (resetPose) this.pose = 'idle';
    this.renderPreview();
  }

  clearPreview() {
    this.previewObjects.forEach(obj => obj?.destroy?.());
    this.previewObjects = [];
  }

  addPreview(obj) {
    if (obj) this.previewObjects.push(obj);
    return obj;
  }

  renderPreview() {
    this.clearPreview();

    const characterId = characterOrder[this.currentIndex] || 'renMizuno';
    const character = characters[characterId];
    const frame = this.largeFrame
      ? { x: 500, y: 430, w: 600, h: 720 }
      : { x: 540, y: 430, w: 360, h: 460 };

    const base = resolveCharacterProfile(characterId, this.pose);
    const adjusted = {
      scale: Math.max(0.2, Number(base.scale) + this.temp.scale),
      offsetX: Number(base.offsetX) + this.temp.offsetX,
      offsetY: Number(base.offsetY) + this.temp.offsetY,
    };

    this.addPreview(this.add.rectangle(frame.x, frame.y, frame.w + 18, frame.h + 18, 0x08131e, 1)
      .setStrokeStyle(2, 0x315b73, 1));
    this.addPreview(this.add.rectangle(frame.x, frame.y, frame.w, frame.h, 0x101821, 1));

    const profile = createCharacterProfile(this, {
      characterId,
      pose: this.pose,
      x: frame.x,
      y: frame.y,
      frameWidth: frame.w,
      frameHeight: frame.h,
      side: 'left',
      depth: 4,
      flipInward: true,
      profileOverride: adjusted,
    });

    if (profile) {
      this.previewObjects.push(profile.image, profile.maskShape);
    }

    const top = frame.y - frame.h / 2;
    const left = frame.x - frame.w / 2;
    const right = frame.x + frame.w / 2;
    const guide = this.addPreview(this.add.graphics().setDepth(20));

    guide.lineStyle(2, 0x54e3ff, 0.85);
    guide.lineBetween(left, top + frame.h * PROFILE_HEAD_SAFE_RATIO, right, top + frame.h * PROFILE_HEAD_SAFE_RATIO);
    guide.lineStyle(2, 0xffd166, 0.85);
    guide.lineBetween(left, top + frame.h * PROFILE_EYE_TARGET_RATIO, right, top + frame.h * PROFILE_EYE_TARGET_RATIO);
    guide.lineStyle(1, 0xb7c7d2, 0.55);
    guide.lineBetween(frame.x, top, frame.x, top + frame.h);
    guide.lineStyle(2, 0xff7aa8, 0.72);
    guide.lineBetween(left, top + frame.h * PROFILE_TORSO_CROP_RATIO, right, top + frame.h * PROFILE_TORSO_CROP_RATIO);

    this.addPreview(this.add.text(left + 8, top + 8, this.largeFrame ? 'CUTSCENE-SCALE PREVIEW' : 'STANDARD PROFILE PREVIEW', {
      fontFamily: PIXEL_FONT, fontSize: '6px', color: '#d7f7ff',
      backgroundColor: '#07111dcc', padding: { x: 6, y: 4 },
    }).setDepth(22));

    const poseOverride = character?.visual?.profile?.poses?.[this.pose];
    const textureInfo = getCharacterProfileTexture(characterId, this.pose);
    const fallback = profile?.poseFallback || !textureInfo?.key;
    this.infoText.setText(
      character.name + '  //  ' + characterId +
      '\nPOSE: ' + this.pose.toUpperCase() + (fallback ? '  (IDLE FALLBACK)' : '') +
      '\nFRAME: ' + frame.w + ' × ' + frame.h +
      '\n\nprofile.scale: ' + adjusted.scale.toFixed(2) +
      '\nprofile.offsetX: ' + adjusted.offsetX.toFixed(0) +
      '\nprofile.offsetY: ' + adjusted.offsetY.toFixed(0) +
      '\n\nPOSE OVERRIDE: ' + (poseOverride ? JSON.stringify(poseOverride) : 'none') +
      '\nTEMP DELTA: ' +
      'scale ' + (this.temp.scale >= 0 ? '+' : '') + this.temp.scale.toFixed(2) +
      ', X ' + (this.temp.offsetX >= 0 ? '+' : '') + this.temp.offsetX +
      ', Y ' + (this.temp.offsetY >= 0 ? '+' : '') + this.temp.offsetY +
      '\n\nGUIDES\ncyan: head safe zone\nyellow: face / eye target\ngrey: centre\npink: lower torso crop zone'
    );
  }
}
