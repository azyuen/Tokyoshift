import { garageAssets } from '../data/garageAssets.js?v=20260921-r25';
import { characters } from '../data/characters.js?v=20260921-r25';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    this.load.image('carAE86', 'assets/Cars/ae86_body.png');
    this.load.image('carR32', 'assets/Cars/r32_body.png');
    this.load.image('carEvoIII', 'assets/Cars/evo_iii_body.png');
    this.load.image('carFC3S', 'assets/Cars/fc3s_body.png');
    this.load.image('carWRX22B', 'assets/Cars/wrx_22b_body.png');
    this.load.image('carEK9', 'assets/Cars/civic_ek9_body.png');

    this.load.image('wheel8Spoke', 'assets/wheels/wheel_8spoke.png');
    this.load.image('wheel5Spoke', 'assets/wheels/wheel_5spoke.png');
    this.load.image('wheelMesh', 'assets/wheels/wheel_mesh.png');
    this.load.image('wheelDeepDish', 'assets/wheels/wheel_deepdish.png');

    // Keep initial boot lean: race controls/UI are loaded later while the player
    // is browsing the Meet screen. Only the current workshop background is needed.
    garageAssets
      .filter(asset => asset.key === 'garageWorkshopBg')
      .forEach(asset => this.load.image(asset.key, asset.path));

    // Only load the two workshop characters at startup. The rest of the roster
    // can be loaded when the meet/rival screens are added.
    const workshopCharacters = [characters.renMizuno, characters.daichiSakamoto];
    workshopCharacters.forEach(character => {
      this.load.image(
        character.visual.spriteKey,
        character.visual.path + '?v=20260921-r25'
      );
    });
  }

  create() {
    let profile = null;
    try {
      profile = JSON.parse(localStorage.getItem('tokyoShiftProfile') || 'null');
    } catch (e) {
      profile = null;
    }

    this.registry.set('selectedCarId', profile?.selectedCarId || this.registry.get('selectedCarId') || 'ae86');
    this.registry.set('wins', Number.isFinite(profile?.wins) ? profile.wins : 0);
    this.registry.set('losses', Number.isFinite(profile?.losses) ? profile.losses : 0);
    this.registry.set('cash', Number.isFinite(profile?.cash) ? profile.cash : 25000);
    this.registry.set('playerCharacterId', profile?.playerCharacterId || 'renMizuno');
    this.registry.set('workshopFriendId', 'daichiSakamoto');

    this.add.rectangle(780, 360, 1560, 720, 0x070914);
    this.add.text(780, 304, 'TOKYO SHIFT', {
      fontFamily: '"Silkscreen", monospace', fontSize: '40px', color: '#e8f7ff'
    }).setOrigin(0.5);
    this.add.text(780, 363, 'R25 // FAST LOAD', {
      fontFamily: '"Silkscreen", monospace', fontSize: '16px', color: '#62d8ff'
    }).setOrigin(0.5);

    this.time.delayedCall(90, () => this.scene.start('GarageScene'));
  }
}
