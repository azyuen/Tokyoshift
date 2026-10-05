import GarageScene from './GarageScene.js?v=20261005-r364';

// Dedicated Crew Space scene.
//
// It deliberately reuses GarageScene's full workshop/tuning implementation but
// lives under its own Phaser scene key. Keeping Warehouse HQ and Crew Space as
// separate scene instances avoids re-entering GarageScene while it is still
// shutting down, which was the source of the persistent black-screen hang.
export default class CrewSpaceScene extends GarageScene {
  constructor() {
    super('CrewSpaceScene');
  }

  init(data = {}) {
    super.init({
      ...data,
      crewMode: true,
      returningFromCrewSpace: true,
      workshopLocationId: 'shinonomeWarehouseStrip',
    });
  }
}
