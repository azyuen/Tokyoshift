import { cars } from '../data/cars.js?v=20260924-r165';
import {
  DEFAULT_PAINT_COLOR,
  getCarBodyTextureKey,
  createCarBodyLayers,
} from '../vehicles/CarAppearance.js?v=20260923-r154';
import { getWheelPairFit } from '../vehicles/WheelFit.js?v=20260923-r160';
import { characters, playableCharacterOrder } from '../data/characters.js?v=20260923-r145';
import { createDefaultGameState, applyStateToRegistry, saveManualState } from '../state/GameState.js?v=20260922-r128';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20260922-r120';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

export default class CharacterSelectScene extends Phaser.Scene {
  constructor() { super('CharacterSelectScene'); }

  preload() {
    let queued = 0;
    playableCharacterOrder.forEach(id => {
      const character = characters[id];
      if (!this.textures.exists(character.visual.spriteKey)) {
        this.load.image(character.visual.spriteKey, character.visual.path + '?v=20260921-r43');
        queued += 1;
      }
    });
    startSceneLoading(this, 'LOADING DRIVERS', queued);
  }

  create() {
    document.body.dataset.scene = 'setup';
    this.scale.resize(1560, 840);

    try { this.input.enabled = true; } catch (e) {}
    try { if (this.input.keyboard) this.input.keyboard.enabled = true; } catch (e) {}

    playMusic('title');

    this.currentCharacterId = Phaser.Utils.Array.GetRandom(playableCharacterOrder);
    this.portraitObjects = [];

    // Spacious title-screen frame. This scene needs more breathing room than
    // the in-game panels because all Phaser text is globally enlarged for phone use.
    this.add.rectangle(780, 420, 1560, 840, 0x050912);
    this.add.rectangle(780, 420, 1480, 770, 0x07111d, 0.98)
      .setStrokeStyle(2, 0x1f4964, 1);

    this.add.text(780, 58, 'TOKYO SHIFT', {
      fontFamily: PIXEL_FONT, fontSize: '32px', color: '#effbff'
    }).setOrigin(0.5);

    this.add.text(780, 112, 'YOUR NIGHT STARTS HERE', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#69dfff'
    }).setOrigin(0.5);

    this.buildProfilePanel();
    this.buildIdentityPanel();
    this.buildStarterCarPanel();
    this.buildExplanation();
    this.refreshPortrait();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      const form = document.getElementById('driver-name-overlay');
      form?.classList.remove('is-visible');
      form?.setAttribute('aria-hidden', 'true');
      try { if (this.input.keyboard) this.input.keyboard.enabled = true; } catch (e) {}
    });

    finishSceneLoading('READY');
  }

  panel(x, y, w, h, title) {
    this.add.rectangle(x, y, w, h, 0x0a1521, 0.98)
      .setStrokeStyle(2, 0x294b63, 1);

    this.add.text(x - w / 2 + 24, y - h / 2 + 22, title, {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#8ed4f5'
    });
  }

  buildProfilePanel() {
    const x = 300;
    this.panel(x, 365, 370, 455, '1 // CHARACTER');

    // Portrait gets its own padded block rather than touching the panel title/button.
    this.add.rectangle(x, 328, 240, 240, 0x101b27, 1);

    // Keep the cyan selection frame above the character artwork so hair/jacket
    // pixels never cover the outline.
    this.add.rectangle(x, 328, 240, 240, 0xffffff, 0)
      .setStrokeStyle(2, 0x4bdcff, 0.95)
      .setDepth(6);

    this.portraitMaskShape = this.make.graphics({ add: false });
    this.portraitMaskShape.fillStyle(0xffffff, 1);
    this.portraitMaskShape.fillRect(x - 120, 208, 240, 240);
    this.portraitMask = this.portraitMaskShape.createGeometryMask();

    const randomButton = this.add.rectangle(x, 500, 270, 46, 0x10283a, 1)
      .setStrokeStyle(2, 0x47dfff, 1)
      .setInteractive({ useHandCursor: true });

    this.add.text(x, 500, 'RANDOM CHARACTER  >', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#f1fbff'
    }).setOrigin(0.5);

    randomButton.on('pointerdown', () => {
      const pool = playableCharacterOrder.filter(id => id !== this.currentCharacterId);
      this.currentCharacterId = Phaser.Utils.Array.GetRandom(pool);
      this.refreshPortrait();
    });

    this.profileLabel = this.add.text(x, 552, '', {
      fontFamily: BODY_FONT, fontSize: '12px', color: '#87a9bb', fontStyle: '600'
    }).setOrigin(0.5);
  }

  refreshPortrait() {
    this.portraitObjects.forEach(obj => obj.destroy());
    this.portraitObjects = [];

    const character = characters[this.currentCharacterId];
    const source = this.textures.get(character.visual.spriteKey).getSourceImage();
    const portrait = this.add.image(300, 188, character.visual.spriteKey)
      .setOrigin(0.5, 0)
      .setDepth(4)
      .setMask(this.portraitMask);

    portrait.setScale(690 / source.height);
    this.portraitObjects.push(portrait);

    this.profileLabel.setText(
      'CHARACTER ' +
      (playableCharacterOrder.indexOf(this.currentCharacterId) + 1).toString().padStart(2, '0')
    );
  }

  buildIdentityPanel() {
    this.panel(780, 365, 520, 455, '2 // DRIVER');

    this.add.text(780, 242, 'ENTER YOUR NAME', {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(780, 294, 'This is the name rivals will know you by.', {
      fontFamily: BODY_FONT,
      fontSize: '12px',
      color: '#91a9b7',
      align: 'center',
      wordWrap: { width: 390 },
    }).setOrigin(0.5);

    const form = document.getElementById('driver-name-overlay');
    const firstInput = document.getElementById('driverFirstName');
    const lastInput = document.getElementById('driverLastName');

    if (firstInput) firstInput.value = '';
    if (lastInput) lastInput.value = '';

    form?.classList.add('is-visible');
    form?.setAttribute('aria-hidden', 'false');

    this.input.keyboard?.clearCaptures?.();

    [firstInput, lastInput].filter(Boolean).forEach(input => {
      input.onkeydown = event => event.stopPropagation();
      input.onkeyup = event => event.stopPropagation();
      input.onkeypress = event => event.stopPropagation();
      input.onfocus = () => {
        if (this.input.keyboard) this.input.keyboard.enabled = false;
      };
      input.onblur = () => {
        if (this.input.keyboard) this.input.keyboard.enabled = true;
      };
    });

    this.nameError = this.add.text(780, 510, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#ff748d',
      align: 'center',
      wordWrap: { width: 400 },
    }).setOrigin(0.5);
  }
  buildStarterCarPanel() {
    const x = 1260;
    this.panel(x, 365, 370, 455, '3 // FIRST CAR');

    this.add.text(x, 232, 'STARTER CAR', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#7e9caf'
    }).setOrigin(0.5);

    this.createCarDisplay(cars.ae86, x, 350, 300, 4);

    this.add.text(x, 454, 'TOYOTA SPRINTER TRUENO', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(x, 496, 'AE86 // STOCK', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#69dfff'
    }).setOrigin(0.5);

    this.add.text(x, 540, '96 kW   •   940 kg   •   NA', {
      fontFamily: BODY_FONT, fontSize: '13px', color: '#91a9b7', fontStyle: '600'
    }).setOrigin(0.5);
  }

  buildExplanation() {
    // Footer copy is deliberately split into three separate rows so enlarged
    // phone text can never collide with adjacent panels or the CTA.
    this.add.text(
      780,
      626,
      'RACE THE TOKYO NIGHT SCENE   •   SHIFT BY HAND   •   BUILD YOUR GARAGE   •   BET CASH OR PINK SLIPS',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#a8c6d7',
        align: 'center',
        wordWrap: { width: 1260 },
      }
    ).setOrigin(0.5);

    this.add.text(
      780,
      667,
      'Win cars. Tune them. Move through districts. Lose your last car on a pink slip and your run is over.',
      {
        fontFamily: BODY_FONT,
        fontSize: '12px',
        color: '#849eae',
        align: 'center',
        wordWrap: { width: 1220 },
      }
    ).setOrigin(0.5);

    this.add.text(780, 704, 'Save in the Workshop to create a restore point.', {
      fontFamily: BODY_FONT, fontSize: '11px', color: '#ffe08a', fontStyle: '600'
    }).setOrigin(0.5);

    const start = this.add.rectangle(780, 760, 390, 56, 0x0c2b29, 1)
      .setStrokeStyle(3, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true });

    this.add.text(780, 760, 'START NIGHT  >', {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#f2fffb'
    }).setOrigin(0.5);

    start.on('pointerdown', () => this.startNight());
  }

  startNight() {
    const firstInput = document.getElementById('driverFirstName');
    const lastInput = document.getElementById('driverLastName');
    const firstName = (firstInput?.value || '').trim();
    const lastName = (lastInput?.value || '').trim();

    if (!firstName || !lastName) {
      this.nameError.setText('ENTER A FIRST AND LAST NAME');
      return;
    }

    const state = createDefaultGameState();
    state.firstName = firstName;
    state.lastName = lastName;

    const isDevProfile = (
      firstName.toLowerCase() + lastName.toLowerCase()
    ).replace(/[^a-z0-9]/g, '') === 'arkonden';
    if (isDevProfile) {
      state.devMode = true;
      state.cash = 1000000000;
    }

    state.playerCharacterId = playableCharacterOrder.includes(this.currentCharacterId)
      ? this.currentCharacterId
      : playableCharacterOrder[0];
    state.selectedCarId = 'ae86';
    state.ownedCarIds = ['ae86'];
    state.carStates = {
      ae86: {
        stock: true,
        paintColor: DEFAULT_PAINT_COLOR,
        nosInstalled: false,
        tuneLevel: 0,
        tuning: {
          engine: 0,
          intake: 0,
          ecu: 0,
          turbo: 0,
          intercooler: 0,
        },
        drivetrainTuning: {},
        exhaustNosTuning: {},
        acquiredVia: 'starter',
      },
    };

    const form = document.getElementById('driver-name-overlay');
    form?.classList.remove('is-visible');
    form?.setAttribute('aria-hidden', 'true');

    applyStateToRegistry(this.registry, state);
    saveManualState(this.registry);
    this.scene.start('GarageScene');
  }
  createCarDisplay(car, x, y, targetWidth, depth) {
    const source = this.textures.get(getCarBodyTextureKey(this, car)).getSourceImage();
    const wheelSource = this.textures.get(car.visual.wheelKey).getSourceImage();
    const bodyScale = targetWidth / source.width;
    const fit = getWheelPairFit(car.visual, bodyScale, false, wheelSource);
    const renderOffsetY = Number(car.visual.renderOffsetY || 0) * bodyScale;
    const displayY = y + renderOffsetY;

    const rearX = x + fit.rear.offsetX;
    const frontX = x + fit.front.offsetX;
    const rearY = displayY + fit.rear.offsetY;
    const frontY = displayY + fit.front.offsetY;

    const rear = this.add.image(rearX, rearY, car.visual.wheelKey)
      .setScale(fit.rear.wheelScale)
      .setDepth(depth);
    const front = this.add.image(frontX, frontY, car.visual.wheelKey)
      .setScale(fit.front.wheelScale)
      .setDepth(depth);

    this.add.circle(
      rearX,
      rearY,
      fit.rear.backingRadius ?? Math.max(5, rear.displayWidth * 0.50),
      0x020304,
      1
    ).setDepth(depth - 0.3);
    this.add.circle(
      frontX,
      frontY,
      fit.front.backingRadius ?? Math.max(5, front.displayWidth * 0.50),
      0x020304,
      1
    ).setDepth(depth - 0.3);

    const tyreBottom = Math.max(
      rearY + rear.displayHeight * 0.5,
      frontY + front.displayHeight * 0.5
    );
    this.add.ellipse(x, tyreBottom + 7, targetWidth * 0.86, 22, 0x000000, 0.70)
      .setDepth(depth - 0.1);

    createCarBodyLayers(this, car, {
      x,
      y: displayY,
      scale: bodyScale,
      depth: depth + 1,
      paintColor: DEFAULT_PAINT_COLOR,
    });
  }
}
