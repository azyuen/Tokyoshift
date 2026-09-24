import { garageAssets } from '../data/garageAssets.js?v=20260922-r128';
import { cars } from '../data/cars.js?v=20260924-r171';
import { preloadCarAppearanceAssets, ensureDerivedModularCarTextures } from '../vehicles/CarAppearance.js?v=20260924-r170';
import { characters, playableCharacterOrder } from '../data/characters.js?v=20260923-r145';
import { createDefaultGameState, readManualSave, readSessionState, applyStateToRegistry } from '../state/GameState.js?v=20260924-r176';
import { startSceneLoading } from '../ui/LoadingScreen.js?v=20260922-r128';
import { ensureVisualModTextures, preloadVisualModAssets } from '../data/visualMods.js?v=20260924-r177';
import { TUNER_SHOPS } from '../data/tunerShops.js?v=20260924-r176';

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
    startSceneLoading(this, this.bootMessage || 'LOADING TOKYO', 1);

    // Standard cars load body + tintable paint + overlay. Ginza hero cars set
    // visual.singleBody and load only their finished one-off body PNG.
    preloadCarAppearanceAssets(this, cars, '20260924-r171');
    preloadVisualModAssets(this, '20260924-r177');

    this.load.image('wheel8Spoke', 'assets/wheels/wheel_8spoke.png');
    this.load.image('wheel5Spoke', 'assets/wheels/wheel_5spoke.png');
    this.load.image('wheelMesh', 'assets/wheels/wheel_mesh.png');
    this.load.image('wheelDeepDish', 'assets/wheels/wheel_deepdish.png');

    // Hero/collector cars can ship their own wheel sprite. Keeping the path in
    // cars.js means each one automatically works in the workshop, meets,
    // racing and result screens without scene-specific wheel code.
    Object.values(cars).forEach(car => {
      const visual = car?.visual || {};
      if (
        visual.wheelKey &&
        visual.wheelPath &&
        !this.textures.exists(visual.wheelKey)
      ) {
        this.load.image(
          visual.wheelKey,
          visual.wheelPath + '?v=20260924-r165'
        );
      }
    });

    this.load.image(
      'travelMapTokyoBay',
      'assets/Ui/tokyo_bay_travel_map.png?v=20260921-r77'
    );

    this.load.image(
      'travelMapTokyoRegion',
      'assets/Ui/tokyo_region_map_base.png?v=20260923-r139'
    );

    garageAssets
      .filter(asset => asset.key.startsWith('garageWorkshop') || asset.key.startsWith('stockEngine') || asset.key.startsWith('tuningCategory') || asset.key.startsWith('tuningPart'))
      .forEach(asset => this.load.image(asset.key, asset.path));

    // Tuner-shop art is data-driven by region. A missing background is safe:
    // TunerShopScene falls back to the normal garage art while the final asset
    // is being uploaded at the configured path.
    Object.values(TUNER_SHOPS)
      .filter(shop => shop.enabled)
      .forEach(shop => {
        if (shop.backgroundKey && shop.backgroundPath) {
          this.load.image(
            shop.backgroundKey,
            shop.backgroundPath + '?v=20260924-r176'
          );
        }

        if (shop.decalTextureKey && shop.decalPath) {
          this.load.image(
            shop.decalTextureKey,
            shop.decalPath + '?v=20260924-r176'
          );
        }

        const mechanic = characters[shop.mechanicId];
        if (mechanic?.visual?.spriteKey && mechanic?.visual?.path) {
          this.load.image(
            mechanic.visual.spriteKey,
            mechanic.visual.path + '?v=20260924-r176'
          );
        }
      });

    // A manual save can point at any chosen profile portrait, so every
    // player-character sprite must be available before we skip setup on boot.
    [...new Set([...playableCharacterOrder, 'daichiSakamoto'])].forEach(id => {
      const character = characters[id];
      if (!character) return;
      this.load.image(
        character.visual.spriteKey,
        character.visual.path + '?v=20260923-r145'
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
    ensureDerivedModularCarTextures(this, cars);
    ensureVisualModTextures(this);
    document.body.dataset.scene = 'garage';
    this.scale.resize(1560, 840);

    const manualSave = readManualSave();
    // Session state is the player's latest autosaved progress. The manual save
    // remains the explicit restore point, but normal launches should not roll
    // back newer flags such as devMode or Central Tokyo unlocks.
    const sessionSave = readSessionState();
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
