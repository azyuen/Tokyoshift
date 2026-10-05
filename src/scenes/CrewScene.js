import { saveSessionState } from '../state/GameState.js?v=20261005-r354';
import { cancelSceneLoading } from '../ui/LoadingScreen.js?v=20261005-r355';

// Crew Space transition bridge.
//
// GarageScene owns the actual Crew Space UI so it can share the full workshop
// tuning/dyno implementation. This tiny scene gives Phaser a clean scene
// boundary when switching between Warehouse HQ and Crew Space. In particular,
// it avoids both a re-entrant GarageScene.restart() and a browser reload, which
// could leave the global loading splash parked at 98% on iOS/PWA.
export default class CrewScene extends Phaser.Scene {
  constructor() {
    super('CrewScene');
  }

  init(data = {}) {
    this.transitionMode = data?.mode === 'warehouse' ? 'warehouse' : 'crew';
    this.transitionCarId = data?.selectedCarId || null;
  }

  preload() {}

  create() {
    // Kill any late loader callback from the GarageScene instance we just left
    // before changing presentation mode.
    cancelSceneLoading();

    const returningToWarehouse = this.transitionMode === 'warehouse';

    this.registry.set('crewSpaceActive', !returningToWarehouse);
    this.registry.set('workshopLocationId', 'shinonomeWarehouseStrip');

    if (returningToWarehouse) {
      this.registry.set('selectedRacePlayerCharacterId', null);
      this.registry.set('crewPreviousCarId', null);
    }

    if (this.transitionCarId) {
      this.registry.set('selectedCarId', this.transitionCarId);
    } else if (!returningToWarehouse) {
      // Enter Crew Space on the group overview rather than immediately
      // focusing whichever ordinary Warehouse car was selected.
      this.registry.set('selectedCarId', null);
      this.registry.set('selectedRacePlayerCharacterId', null);
    }

    saveSessionState(this.registry);

    // Do not re-enter GarageScene synchronously from this bridge's create().
    // iOS/PWA can leave the loader at 98% when a stopped scene is restarted
    // inside the same SceneManager lifecycle tick. Give Phaser one frame to
    // complete the CrewScene start/stop bookkeeping first.
    this.time.delayedCall(34, () => {
      // Warehouse/Crew Space share one physical property and almost all assets.
      // Do not carry a global loading splash across this bridge.
      cancelSceneLoading();

      this.scene.start('GarageScene', {
        crewMode: !returningToWarehouse,
        returningFromCrewSpace: returningToWarehouse,
        workshopLocationId: 'shinonomeWarehouseStrip',
      });
    });
  }
}
