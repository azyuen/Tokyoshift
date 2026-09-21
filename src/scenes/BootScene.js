import { garageAssets } from '../data/garageAssets.js?v=20260921-r68';
import { characters, characterOrder } from '../data/characters.js?v=20260921-r43';
import { createDefaultGameState, readManualSave, applyStateToRegistry } from '../state/GameState.js?v=20260921-r60';

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

    this.load.image(
      'travelMapTokyoBay',
      'assets/Ui/tokyo_bay_travel_map.png?v=20260921-r67'
    );

    this.load.image(
      'travelMapTokyoRegion',
      'assets/Ui/tokyo_region_map.png?v=20260921-r67'
    );

    garageAssets
      .filter(asset => asset.key === 'garageWorkshopBg' || asset.key.startsWith('stockEngine'))
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
  }

  create() {
    document.body.dataset.scene = 'garage';
    this.scale.resize(1560, 840);

    const saved = readManualSave();
    const state = applyStateToRegistry(
      this.registry,
      saved || createDefaultGameState()
    );

    this.registry.set('workshopFriendId', 'daichiSakamoto');

    this.add.rectangle(780, 420, 1560, 840, 0x070914);
    this.add.text(780, 356, 'TOKYO SHIFT', {
      fontFamily: '"Silkscreen", monospace', fontSize: '40px', color: '#e8f7ff'
    }).setOrigin(0.5);
    this.add.text(780, 425, saved ? 'LOADING SAVE // R68' : 'NEW RUN // R68', {
      fontFamily: '"Silkscreen", monospace', fontSize: '16px', color: '#62d8ff'
    }).setOrigin(0.5);

    this.time.delayedCall(90, () => {
      this.scene.start(saved && !state.gameOver ? 'GarageScene' : 'CharacterSelectScene');
    });
  }
}
