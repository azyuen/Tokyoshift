import { saveSessionState } from '../state/GameState.js?v=20261005-r350';

// Legacy scene alias.
//
// Crew Space now runs inside GarageScene so it can share the exact workshop
// layout, tuning systems and dyno flow. Keeping this tiny redirect means an old
// cached build or a direct CrewScene transition can never strand the player on
// the old loader.
export default class CrewScene extends Phaser.Scene {
  constructor() {
    super('CrewScene');
  }

  preload() {}

  create() {
    this.registry.set('crewSpaceActive', true);
    this.registry.set('workshopLocationId', 'shinonomeWarehouseStrip');
    saveSessionState(this.registry);

    // Do not show a second loading splash here. GarageScene owns the Crew Space
    // preload and will hide its splash after the workshop UI is live.
    this.scene.start('GarageScene', {
      crewMode: true,
      workshopLocationId: 'shinonomeWarehouseStrip',
    });
  }
}
