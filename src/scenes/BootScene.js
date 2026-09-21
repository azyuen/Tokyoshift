import { garageAssets } from '../data/garageAssets.js?v=20260922-r86';
import { cars } from '../data/cars.js?v=20260922-r83';
import { preloadCarAppearanceAssets } from '../vehicles/CarAppearance.js?v=20260922-r83';
import { characters, characterOrder } from '../data/characters.js?v=20260921-r43';
import { createDefaultGameState, readManualSave, applyStateToRegistry } from '../state/GameState.js?v=20260922-r86';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
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
      .filter(asset => asset.key.startsWith('garageWorkshop') || asset.key.startsWith('stockEngine') || asset.key.startsWith('tuningCategory'))
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
    this.add.text(780, 425, saved ? 'LOADING SAVE // R86' : 'NEW RUN // R86', {
      fontFamily: '"Silkscreen", monospace', fontSize: '16px', color: '#62d8ff'
    }).setOrigin(0.5);

    this.time.delayedCall(90, () => {
      this.scene.start(saved && !state.gameOver ? 'GarageScene' : 'CharacterSelectScene');
    });
  }
}
