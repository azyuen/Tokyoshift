import { garageAssets } from '../data/garageAssets.js?v=20260925-r192';
import { cars, carOrder } from '../data/cars.js?v=20260926-r209';
import { preloadCarAppearanceAssets, preloadCarWheel, ensureDerivedModularCarTextures } from '../vehicles/CarAppearance.js?v=20260926-r202';
import { characters } from '../data/characters.js?v=20260926-r213';
import {
  createDefaultGameState,
  readManualSave,
  readSessionState,
  applyStateToRegistry,
  getProfileSlots,
} from '../state/GameState.js?v=20260926-r213';
import { startSceneLoading } from '../ui/LoadingScreen.js?v=20260922-r128';
import { ensureVisualModTextures, preloadVisualModAssets } from '../data/visualMods.js?v=20260926-r209';
import { TUNER_SHOPS } from '../data/tunerShops.js?v=20260924-r178';

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

    // Core rivals appear at any meet. Collector art loads at Ginza, except for
    // cars already owned in a saved game, which the garage must show at entry.
    const saved = readSessionState() || readManualSave();
    const owned = new Set(saved?.ownedCarIds || []);
    const initialCars = Object.fromEntries(
      Object.entries(cars).filter(([id]) => carOrder.includes(id) || owned.has(id))
    );
    preloadCarAppearanceAssets(this, initialCars, '20260925-r193');
    preloadVisualModAssets(this, '20260926-r201');

    this.load.image('wheel8Spoke', 'assets/wheels/wheel_8spoke.png');
    this.load.image('wheel5Spoke', 'assets/wheels/wheel_5spoke.png');
    this.load.image('wheelMesh', 'assets/wheels/wheel_mesh.png');
    this.load.image('wheelDeepDish', 'assets/wheels/wheel_deepdish.png');

    Object.values(initialCars).forEach(car => preloadCarWheel(this, car));

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

    // Decals can appear on owned cars in any scene; workshop backdrops and
    // mechanics are deferred until their own shop is entered.
    Object.values(TUNER_SHOPS).filter(shop => shop.enabled).forEach(shop => {
      if (shop.decalTextureKey && shop.decalPath) {
        this.load.image(shop.decalTextureKey, shop.decalPath + '?v=20260924-r176');
      }
    });

    // Settings can show all three saved driver profiles from any scene.
    // Preload only the drivers actually used by occupied slots, plus the active
    // driver and Daichi, so profile portraits never render as blank boxes.
    const profileDriverIds = getProfileSlots()
      .filter(slot => slot.occupied && slot.playerCharacterId)
      .map(slot => slot.playerCharacterId);

    [...new Set([
      ...profileDriverIds,
      saved?.playerCharacterId || (saved ? 'renMizuno' : null),
      'daichiSakamoto',
    ])].filter(Boolean).forEach(id => {
      const character = characters[id];
      if (!character?.visual?.spriteKey || !character?.visual?.path) return;
      if (this.textures.exists(character.visual.spriteKey)) return;

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
    ensureDerivedModularCarTextures(this, Object.fromEntries(
      Object.entries(cars).filter(([id]) => this.textures.exists('carBody_' + cars[id].visual.assetStem))
    ));
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
      this.scene.start(state.gameOver ? 'RunOverScene' : 'GarageScene');
      return;
    }

    if (!saved) {
      this.scene.start('CharacterSelectScene');
      return;
    }

    this.scene.start(state.gameOver ? 'RunOverScene' : 'GarageScene');
  }
}
