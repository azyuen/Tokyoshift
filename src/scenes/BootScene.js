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

    this.load.image('hudCluster', 'assets/Ui/hud_cluster.png');
    this.load.image('dragTree', 'assets/Ui/drag_tree.png');
    this.load.image('clutchPedal', 'assets/Controls/clutch_pedal.png');
    this.load.image('throttlePedal', 'assets/Controls/throttle_pedal.png');
    this.load.image('nosButton', 'assets/Controls/nos_button.png');
    this.load.image('shifterNeutral', 'assets/Controls/shifter_neutral.png');
    this.load.image('shifterDown', 'assets/Controls/shifter_down.png');
  }

  create() {
    if (!this.registry.get('selectedCarId')) this.registry.set('selectedCarId', 'ae86');

    this.add.rectangle(780, 360, 1560, 720, 0x070914);
    this.add.text(780, 305, 'TOKYO SHIFT', {
      fontFamily: 'monospace', fontSize: '44px', color: '#e8f7ff', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(780, 363, 'R9 // RACE SLIP MODAL', {
      fontFamily: 'monospace', fontSize: '18px', color: '#62d8ff', letterSpacing: 2
    }).setOrigin(0.5);

    this.time.delayedCall(300, () => this.scene.start('GarageScene'));
  }
}
