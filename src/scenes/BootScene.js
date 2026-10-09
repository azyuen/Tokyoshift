import { characters, getCharacterAssetUrl } from '../data/characters.js?v=20261010-r458';
import {
  createDefaultGameState,
  readSessionState,
  applyStateToRegistry,
  getProfileSlots,
} from '../state/GameState.js?v=20261007-r422';
import { startSceneLoading } from '../ui/LoadingScreen.js?v=20261005-r355';

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
    let queued = 0;
    const queueImage = (key, path) => {
      if (!key || !path || this.textures.exists(key)) return;
      this.load.image(key, path);
      queued += 1;
    };

    // R242: Boot owns only profile/setup assets. Gameplay scenes now load
    // their own cars, locations, tuning art and event assets on demand.
    const saved = readSessionState();
    const profileIds = new Set(
      getProfileSlots()
        .filter(slot => slot?.occupied)
        .map(slot => slot.playerCharacterId)
        .filter(Boolean)
    );
    if (saved?.playerCharacterId) profileIds.add(saved.playerCharacterId);

    profileIds.forEach(id => {
      const visual = characters[id]?.visual;
      if (visual) queueImage(visual.spriteKey, getCharacterAssetUrl(visual.path));
    });

    startSceneLoading(this, 'LOADING TOKYO SHIFT', queued);
  }

  create() {
    document.body.dataset.scene = 'garage';
    this.scale.resize(1560, 840);

    // Session state is the authoritative autosave. readSessionState() still
    // falls back to a legacy manual record for old profiles, but new gameplay
    // no longer exposes restore points that could undo race consequences.
    const saved = readSessionState();
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

    const hasProfiles = getProfileSlots().some(slot => slot.occupied);

    // A normal app launch/refresh starts at the driver board. Controlled
    // internal reloads (workshop changes, profile switches, tutorial handoff)
    // bypass it so those transitions remain immediate and deterministic.
    if (!this.internalReload && !this.forceGarage && hasProfiles) {
      this.scene.start('ProfileSelectScene');
      return;
    }

    if (!saved) {
      this.scene.start('CharacterSelectScene');
      return;
    }

    this.scene.start(state.gameOver ? 'RunOverScene' : 'GarageScene');
  }
}
