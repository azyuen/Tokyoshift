import { garageAssets } from '../data/garageAssets.js?v=20260922-r109';
import { cars } from '../data/cars.js?v=20260922-r83';
import { preloadCarAppearanceAssets } from '../vehicles/CarAppearance.js?v=20260922-r83';
import { characters, characterOrder } from '../data/characters.js?v=20260922-r111';
import { createDefaultGameState, readManualSave, readSessionState, applyStateToRegistry } from '../state/GameState.js?v=20260922-r112';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  init(data = {}) {
    let internalReload = false;
    let reloadMessage = '';
    let forceGarage = false;

    try {
      internalReload = sessionStorage.getItem('tokyoShiftInternalReload') === '1';
      reloadMessage = sessionStorage.getItem('tokyoShiftBootMessage') || '';
      forceGarage = sessionStorage.getItem('tokyoShiftForceGarage') === '1';
      if (internalReload) {
        sessionStorage.removeItem('tokyoShiftInternalReload');
        sessionStorage.removeItem('tokyoShiftBootMessage');
        sessionStorage.removeItem('tokyoShiftForceGarage');
      }
    } catch (e) {}

    this.internalReload = internalReload;
    this.forceGarage = forceGarage;
    this.preserveRegistry = Boolean(data?.preserveRegistry);
    this.bootMessage = String(data?.bootMessage || reloadMessage || '');
  }

  preload() {
    window.TOKYO_SHIFT_SET_LOADING?.(0.08, 'LOADING ASSETS');

    this.load.on('progress', value => {
      window.TOKYO_SHIFT_SET_LOADING?.(
        0.08 + (Math.max(0, Math.min(1, value)) * 0.84),
        'LOADING ASSETS'
      );
    });

    this.load.once('complete', () => {
      window.TOKYO_SHIFT_SET_LOADING?.(0.96, 'OPENING TOKYO');
    });

    // Every car follows the same appearance convention. Adding a car to cars.js
    // automatically queues its legacy body + tintable paint + fixed overlay.
    preloadCarAppearanceAssets(this, cars, '20260922-r83');

    this.load.image('wheel8Spoke', 'assets/wheels/wheel_8spoke.png');
    this.load.image('wheel5Spoke', 'assets/wheels/wheel_5spoke.png');
    this.load.image('wheelMesh', 'assets/wheels/wheel_mesh.png');
    this.load.image('wheelDeepDish', 'assets/wheels/wheel_deepdish.png');

    this.load.image(
      'travelMapTokyoBay',
      'assets/Ui/tokyo_bay_travel_map.png?v=20260921-r77'
    );

    this.load.image(
      'travelMapTokyoRegion',
      'assets/Ui/tokyo_region_map.png?v=20260921-r77'
    );

    garageAssets
      .filter(asset => asset.key.startsWith('garageWorkshop') || asset.key.startsWith('stockEngine') || asset.key.startsWith('tuningCategory') || asset.key.startsWith('tuningPart'))
      .forEach(asset => this.load.image(asset.key, asset.path));

    // A manual save can point at any chosen profile portrait, so every
    // player-character sprite must be available before we skip setup on boot.
    characterOrder.forEach(id => {
      const character = characters[id];
      this.load.image(
        character.visual.spriteKey,
        character.visual.path + '?v=20260921-r43'
      );
    });

    // Workshop-only Daichi poses. Keeping these separate from the canonical
    // character sprite lets each tuning category reuse the same mechanic while
    // changing only his working pose.
    this.load.image(
      'daichiEngineInspect',
      'assets/Characters/daichi_engine_inspect.png?v=20260922-r110'
    );
    this.load.image(
      'daichiChassisTools',
      'assets/Characters/daichi_chassis_tools.png?v=20260922-r110'
    );
    this.load.image(
      'daichiExhaustCrouch',
      'assets/Characters/daichi_exhaust_crouch.png?v=20260922-r110'
    );
  }

  create() {
    document.body.dataset.scene = 'garage';
    this.scale.resize(1560, 840);

    const manualSave = readManualSave();
    const sessionSave = this.internalReload ? readSessionState() : null;
    const saved = sessionSave || manualSave;
    const state = this.preserveRegistry
      ? { gameOver: Boolean(this.registry.get('gameOver')) }
      : applyStateToRegistry(
          this.registry,
          saved || createDefaultGameState()
        );

    this.registry.set('workshopFriendId', 'daichiSakamoto');

    // BootScene is now preload/state plumbing only. Do not show a Tokyo SHIFT
    // interstitial or pause between garage/map reloads.
    if (this.preserveRegistry) {
      this.scene.start('GarageScene');
      return;
    }

    this.scene.start(
      saved && (this.forceGarage || !state.gameOver)
        ? 'GarageScene'
        : 'CharacterSelectScene'
    );
  }
}
