export default class ResultScene extends Phaser.Scene {
  constructor() { super('ResultScene'); }

  init(data) { this.dataIn = data; }

  create() {
    const d = this.dataIn;
    this.add.rectangle(780, 360, 1560, 720, 0x070914);
    this.add.rectangle(780, 350, 610, 470, 0x0d1420).setStrokeStyle(2, 0x40536a);
    this.add.text(780, 145, 'TOKYO SHIFT // RACE SLIP', {
      fontFamily: 'monospace', fontSize: '27px', color: '#eaf7ff', fontStyle: 'bold'
    }).setOrigin(0.5);

    const f = (v, suffix = ' s') => v == null ? '—' : `${v.toFixed(3)}${suffix}`;
    let winner = 'RESULT PENDING';
    if (d.falseStart) winner = 'RED LIGHT — LOSS';
    else if (d.playerFinishClock != null && d.opponentFinishClock != null) winner = d.playerFinishClock <= d.opponentFinishClock ? 'WIN' : 'LOSS';
    else if (d.playerFinishClock != null) winner = 'FINISH';

    const rows = [
      [d.playerName, 'vs', d.opponentName],
      ['REACTION', f(d.times.reaction), ''],
      ['60 FOOT', f(d.times.sixty), ''],
      ['1/8 MILE', f(d.times.eighth), ''],
      ['1/4 MILE ET', f(d.times.quarter), ''],
      ['TRAP SPEED', d.times.trapKmh == null ? '—' : `${d.times.trapKmh.toFixed(1)} km/h`, ''],
    ];

    let y = 215;
    for (const r of rows) {
      this.add.text(530, y, r[0], { fontFamily: 'monospace', fontSize: '17px', color: '#9fb0c5' });
      this.add.text(780, y, r[1], { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5, 0);
      this.add.text(1030, y, r[2], { fontFamily: 'monospace', fontSize: '17px', color: '#9fb0c5' }).setOrigin(1, 0);
      y += 48;
    }

    this.add.text(780, 520, winner, {
      fontFamily: 'monospace', fontSize: '34px', color: winner === 'WIN' ? '#70ff9b' : winner.includes('LOSS') ? '#ff5b7a' : '#7be0ff', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(780, 585, 'Tap anywhere or press R to run again', {
      fontFamily: 'monospace', fontSize: '15px', color: '#8c9db0'
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => this.scene.start('RaceScene'));
    const r = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    r.once('down', () => this.scene.start('RaceScene'));
  }
}
