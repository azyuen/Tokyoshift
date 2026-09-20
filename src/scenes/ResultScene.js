const PIXEL_FONT = '"Silkscreen", monospace';

export default class ResultScene extends Phaser.Scene {
  constructor() { super('ResultScene'); }

  init(data) { this.dataIn = data; }

  create() {
    const d = this.dataIn;
    this.add.rectangle(780, 360, 1560, 720, 0x070914);
    this.add.rectangle(780, 350, 610, 470, 0x0d1420).setStrokeStyle(2, 0x40536a);
    this.add.text(780, 145, 'TOKYO SHIFT // RACE SLIP', {
      fontFamily: PIXEL_FONT, fontSize: '20px', color: '#eaf7ff'
    }).setOrigin(0.5);

    const f = (v, suffix = ' s') => v == null ? '—' : v.toFixed(3) + suffix;
    let winner = 'RESULT PENDING';
    let outcome = null;

    if (d.falseStart) {
      winner = 'RED LIGHT — LOSS';
      outcome = 'loss';
    } else if (d.playerFinishClock != null && d.opponentFinishClock != null) {
      outcome = d.playerFinishClock <= d.opponentFinishClock ? 'win' : 'loss';
      winner = outcome === 'win' ? 'WIN' : 'LOSS';
    } else if (d.playerFinishClock != null) {
      winner = 'FINISH';
    }

    if (outcome) this.recordOutcome(outcome);

    const rows = [
      [d.playerName, 'vs', d.opponentName],
      ['REACTION', f(d.times.reaction), ''],
      ['60 FOOT', f(d.times.sixty), ''],
      ['1/8 MILE', f(d.times.eighth), ''],
      ['1/4 MILE ET', f(d.times.quarter), ''],
      ['TRAP SPEED', d.times.trapKmh == null ? '—' : d.times.trapKmh.toFixed(1) + ' km/h', ''],
    ];

    let y = 215;
    for (const row of rows) {
      this.add.text(530, y, row[0], { fontFamily: PIXEL_FONT, fontSize: '12px', color: '#9fb0c5' });
      this.add.text(780, y, row[1], { fontFamily: PIXEL_FONT, fontSize: '12px', color: '#ffffff' }).setOrigin(0.5, 0);
      this.add.text(1030, y, row[2], { fontFamily: PIXEL_FONT, fontSize: '12px', color: '#9fb0c5' }).setOrigin(1, 0);
      y += 48;
    }

    this.add.text(780, 520, winner, {
      fontFamily: PIXEL_FONT,
      fontSize: '28px',
      color: winner === 'WIN' ? '#70ff9b' : winner.includes('LOSS') ? '#ff5b7a' : '#7be0ff'
    }).setOrigin(0.5);

    this.add.text(780, 585, 'TAP ANYWHERE OR PRESS R TO RETURN TO WORKSHOP', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#8c9db0'
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => this.scene.start('GarageScene'));
    const r = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    r.once('down', () => this.scene.start('GarageScene'));
  }

  recordOutcome(outcome) {
    const wins = this.registry.get('wins') ?? 0;
    const losses = this.registry.get('losses') ?? 0;

    if (outcome === 'win') this.registry.set('wins', wins + 1);
    if (outcome === 'loss') this.registry.set('losses', losses + 1);

    try {
      localStorage.setItem('tokyoShiftProfile', JSON.stringify({
        selectedCarId: this.registry.get('selectedCarId') || 'ae86',
        wins: this.registry.get('wins') ?? 0,
        losses: this.registry.get('losses') ?? 0,
        cash: this.registry.get('cash') ?? 25000,
        playerCharacterId: this.registry.get('playerCharacterId') || 'renMizuno',
      }));
    } catch (e) {
      // Ignore unavailable storage.
    }
  }
}
