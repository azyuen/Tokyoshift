export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // Direct PNG assets uploaded to GitHub. No atlas dependency.
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

    this.load.image('hudConsole', 'assets/Ui/hud_console.png');
    this.load.image('dragTree', 'assets/Ui/drag_tree.png');

    this.load.image('clutchPedal', 'assets/Controls/clutch_pedal.png');
    this.load.image('throttlePedal', 'assets/Controls/throttle_pedal.png');
    this.load.image('shifterUp', 'assets/Controls/shifter_up.png');
    this.load.image('shifterDown', 'assets/Controls/shifter_down.png');
  }

  create() {
    this.add.rectangle(640, 360, 1280, 720, 0x070914);
    this.add.text(640, 305, 'TOKYO SHIFT', {
      fontFamily: 'monospace', fontSize: '44px', color: '#e8f7ff', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(640, 363, 'PHASE 1 // DRIVING PROTOTYPE', {
      fontFamily: 'monospace', fontSize: '18px', color: '#62d8ff', letterSpacing: 2
    }).setOrigin(0.5);
    this.time.delayedCall(350, () => this.scene.start('RaceScene'));
  }
}
