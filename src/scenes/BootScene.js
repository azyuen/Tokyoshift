export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    this.add.rectangle(640, 360, 1280, 720, 0x070914);
    this.add.text(640, 300, 'TOKYO SHIFT', {
      fontFamily: 'monospace', fontSize: '44px', color: '#e8f7ff', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(640, 358, 'PHASE 1 // DRIVING PROTOTYPE', {
      fontFamily: 'monospace', fontSize: '18px', color: '#62d8ff', letterSpacing: 2
    }).setOrigin(0.5);
    this.add.text(640, 420, 'Physics first. Style later.', {
      fontFamily: 'monospace', fontSize: '15px', color: '#a8afc4'
    }).setOrigin(0.5);

    this.time.delayedCall(600, () => this.scene.start('RaceScene'));
  }
}
