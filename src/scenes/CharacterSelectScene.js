import { cars } from '../data/cars.js?v=20260921-r42';
import { characters, characterOrder } from '../data/characters.js?v=20260921-r42';
import { createDefaultGameState, applyStateToRegistry, saveSessionState } from '../state/GameState.js?v=20260921-r42';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

export default class CharacterSelectScene extends Phaser.Scene {
  constructor() { super('CharacterSelectScene'); }

  preload() {
    characterOrder.forEach(id => {
      const character = characters[id];
      if (!this.textures.exists(character.visual.spriteKey)) {
        this.load.image(character.visual.spriteKey, character.visual.path + '?v=20260921-r42');
      }
    });
  }

  create() {
    document.body.dataset.scene = 'setup';
    this.scale.resize(1560, 840);

    this.currentCharacterId = Phaser.Utils.Array.GetRandom(characterOrder);
    this.portraitObjects = [];

    this.add.rectangle(780, 420, 1560, 840, 0x050912);
    this.add.rectangle(780, 420, 1490, 770, 0x07111d, 0.98)
      .setStrokeStyle(2, 0x1f4964, 1);

    this.add.text(780, 58, 'TOKYO SHIFT', {
      fontFamily: PIXEL_FONT, fontSize: '34px', color: '#effbff'
    }).setOrigin(0.5);

    this.add.text(780, 108, 'YOUR NIGHT STARTS HERE', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#69dfff'
    }).setOrigin(0.5);

    this.buildProfilePanel();
    this.buildIdentityPanel();
    this.buildStarterCarPanel();
    this.buildExplanation();
    this.refreshPortrait();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.nameDom?.destroy();
    });
  }

  panel(x, y, w, h, title) {
    this.add.rectangle(x, y, w, h, 0x0a1521, 0.98)
      .setStrokeStyle(2, 0x294b63, 1);
    this.add.text(x - w / 2 + 22, y - h / 2 + 18, title, {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#8ed4f5'
    });
  }

  buildProfilePanel() {
    this.panel(350, 360, 360, 420, '1 // PROFILE');

    this.add.rectangle(350, 340, 254, 254, 0x101b27, 1)
      .setStrokeStyle(2, 0x4bdcff, 0.85);

    this.portraitMaskShape = this.make.graphics({ add: false });
    this.portraitMaskShape.fillStyle(0xffffff, 1);
    this.portraitMaskShape.fillRect(223, 213, 254, 254);
    this.portraitMask = this.portraitMaskShape.createGeometryMask();

    const randomButton = this.add.rectangle(350, 520, 270, 44, 0x10283a, 1)
      .setStrokeStyle(2, 0x47dfff, 1)
      .setInteractive({ useHandCursor: true });

    this.add.text(350, 520, 'RANDOM PROFILE  >', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#f1fbff'
    }).setOrigin(0.5);

    randomButton.on('pointerdown', () => {
      const pool = characterOrder.filter(id => id !== this.currentCharacterId);
      this.currentCharacterId = Phaser.Utils.Array.GetRandom(pool);
      this.refreshPortrait();
    });

    this.profileLabel = this.add.text(350, 560, '', {
      fontFamily: BODY_FONT, fontSize: '14px', color: '#87a9bb', fontStyle: '600'
    }).setOrigin(0.5);
  }

  refreshPortrait() {
    this.portraitObjects.forEach(obj => obj.destroy());
    this.portraitObjects = [];

    const character = characters[this.currentCharacterId];
    const source = this.textures.get(character.visual.spriteKey).getSourceImage();
    const portrait = this.add.image(350, 185, character.visual.spriteKey)
      .setOrigin(0.5, 0)
      .setDepth(4)
      .setMask(this.portraitMask);

    portrait.setScale(720 / source.height);
    this.portraitObjects.push(portrait);
    this.profileLabel.setText('PROFILE ' + (characterOrder.indexOf(this.currentCharacterId) + 1).toString().padStart(2, '0'));
  }

  buildIdentityPanel() {
    this.panel(780, 360, 430, 420, '2 // DRIVER');

    this.add.text(780, 238, 'ENTER YOUR NAME', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(780, 284, 'This is the name rivals will know you by.', {
      fontFamily: BODY_FONT, fontSize: '15px', color: '#91a9b7'
    }).setOrigin(0.5);

    const html = `
      <div style="width:360px;display:grid;gap:14px;font-family:Rajdhani,sans-serif;">
        <input id="firstName" maxlength="16" autocomplete="given-name" placeholder="First name"
          style="width:100%;height:50px;padding:0 16px;border:2px solid #315470;background:#07111d;color:#fff;font:700 18px Rajdhani,sans-serif;outline:none;border-radius:2px;" />
        <input id="lastName" maxlength="16" autocomplete="family-name" placeholder="Last name"
          style="width:100%;height:50px;padding:0 16px;border:2px solid #315470;background:#07111d;color:#fff;font:700 18px Rajdhani,sans-serif;outline:none;border-radius:2px;" />
      </div>
    `;

    this.nameDom = this.add.dom(780, 382).createFromHTML(html);

    this.nameError = this.add.text(780, 492, '', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#ff748d'
    }).setOrigin(0.5);
  }

  buildStarterCarPanel() {
    this.panel(1210, 360, 360, 420, '3 // FIRST CAR');

    this.add.text(1210, 232, 'STARTER CAR', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#7e9caf'
    }).setOrigin(0.5);

    this.createCarDisplay(cars.ae86, 1210, 348, 300, 4);

    this.add.text(1210, 442, 'TOYOTA SPRINTER TRUENO', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(1210, 478, 'AE86 // STOCK', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#69dfff'
    }).setOrigin(0.5);

    this.add.text(1210, 522, '96 kW  •  940 kg  •  NA', {
      fontFamily: BODY_FONT, fontSize: '15px', color: '#91a9b7', fontStyle: '600'
    }).setOrigin(0.5);
  }

  buildExplanation() {
    this.add.text(780, 610,
      'RACE THE TOKYO NIGHT SCENE  •  SHIFT BY HAND  •  BUILD YOUR GARAGE  •  BET CASH OR PINK SLIPS', {
        fontFamily: PIXEL_FONT, fontSize: '9px', color: '#a8c6d7', align: 'center'
      }).setOrigin(0.5);

    this.add.text(780, 646,
      'Win cars. Tune them. Move through districts. Lose your last car on a pink slip and your run is over.', {
        fontFamily: BODY_FONT, fontSize: '15px', color: '#849eae', align: 'center'
      }).setOrigin(0.5);

    this.add.text(780, 678, 'Save in the Workshop to create a restore point.', {
      fontFamily: BODY_FONT, fontSize: '14px', color: '#ffe08a', fontStyle: '600'
    }).setOrigin(0.5);

    const start = this.add.rectangle(780, 742, 390, 56, 0x0c2b29, 1)
      .setStrokeStyle(3, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true });

    this.add.text(780, 742, 'START NIGHT  >', {
      fontFamily: PIXEL_FONT, fontSize: '13px', color: '#f2fffb'
    }).setOrigin(0.5);

    start.on('pointerdown', () => this.startNight());
  }

  startNight() {
    const root = this.nameDom?.node || this.nameDom?.getChildByID?.('firstName')?.parentElement;
    const firstInput = root?.querySelector?.('#firstName');
    const lastInput = root?.querySelector?.('#lastName');
    const firstName = (firstInput?.value || '').trim();
    const lastName = (lastInput?.value || '').trim();

    if (!firstName || !lastName) {
      this.nameError.setText('ENTER A FIRST AND LAST NAME');
      return;
    }

    const state = createDefaultGameState();
    state.firstName = firstName;
    state.lastName = lastName;
    state.playerCharacterId = this.currentCharacterId;
    state.selectedCarId = 'ae86';
    state.ownedCarIds = ['ae86'];
    state.carStates = {
      ae86: {
        stock: true,
        nosInstalled: false,
        tuneLevel: 0,
        acquiredVia: 'starter',
      },
    };

    applyStateToRegistry(this.registry, state);
    saveSessionState(this.registry);
    this.scene.start('GarageScene');
  }

  createCarDisplay(car, x, y, targetWidth, depth) {
    const source = this.textures.get(car.visual.bodyKey).getSourceImage();
    const bodyScale = targetWidth / source.width;
    const wheelScale = bodyScale * (car.visual.wheelScale / car.visual.bodyScale) * 1.16;

    const rearX = x + car.visual.rearOffsetX * bodyScale;
    const frontX = x + car.visual.frontOffsetX * bodyScale;
    const wheelY = y + car.visual.wheelOffsetY * bodyScale;

    const rear = this.add.image(rearX, wheelY, car.visual.wheelKey).setScale(wheelScale).setDepth(depth);
    const front = this.add.image(frontX, wheelY, car.visual.wheelKey).setScale(wheelScale).setDepth(depth);
    this.add.circle(rearX, wheelY, Math.max(5, rear.displayWidth * 0.50), 0x030507, 1).setDepth(depth - 0.3);
    this.add.circle(frontX, wheelY, Math.max(5, front.displayWidth * 0.50), 0x030507, 1).setDepth(depth - 0.3);
    this.add.ellipse(x, wheelY + 19, targetWidth * 0.86, 22, 0x000000, 0.70).setDepth(depth - 0.1);
    this.add.image(x, y, car.visual.bodyKey).setScale(bodyScale).setDepth(depth + 1);
  }
}
