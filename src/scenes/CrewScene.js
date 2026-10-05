import { saveSessionState } from '../state/GameState.js?v=20261005-r352';

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

    this.scene.start('GarageScene', {
      crewMode: !returningToWarehouse,
      workshopLocationId: 'shinonomeWarehouseStrip',
    });
  }
}
