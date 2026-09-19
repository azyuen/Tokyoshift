export default class RaceHUD {
  constructor(scene) {
    this.scene = scene;
    this.g = scene.add.graphics().setDepth(40).setScrollFactor(0);

    this.gear = scene.add.text(640, 575, 'N', {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);

    this.rpm = scene.add.text(640, 618, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#a8bfd4',
      align: 'center',
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);

    this.speed = scene.add.text(525, 610, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#e8f4ff',
      align: 'center',
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);

    this.boost = scene.add.text(755, 610, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#e8f4ff',
      align: 'center',
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);

    this.status = scene.add.text(640, 44, '', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#fff0b8',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);
  }

  update(t, raceStatus) {
    this.g.clear();

    const cx = 640;
    const cy = 588;
    const radius = 66;

    this.g.fillStyle(0x070a10, 0.80).fillCircle(cx, cy, radius + 10);
    this.g.lineStyle(6, 0x23344a, 1)
      .beginPath()
      .arc(cx, cy, radius, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(335))
      .strokePath();

    const rpmFrac = Phaser.Math.Clamp(t.rpm / 8500, 0, 1);
    const start = Phaser.Math.DegToRad(205);
    const end = Phaser.Math.DegToRad(205 + 130 * rpmFrac);

    this.g.lineStyle(7, t.rpm > 7900 ? 0xff5a70 : 0x63d7ff, 1)
      .beginPath()
      .arc(cx, cy, radius, start, end)
      .strokePath();

    const needleA = Phaser.Math.DegToRad(205 + 130 * rpmFrac);
    this.g.lineStyle(3, 0xffffff, 1)
      .beginPath()
      .moveTo(cx, cy)
      .lineTo(cx + Math.cos(needleA) * 55, cy + Math.sin(needleA) * 55)
      .strokePath();

    // Small NOS bar only; all development telemetry stays in Debug HUD.
    this.g.fillStyle(0x152337, 0.95).fillRoundedRect(545, 662, 190, 9, 4);
    this.g.fillStyle(0xff4ea3, 0.98).fillRoundedRect(545, 662, 190 * t.nosFraction, 9, 4);

    this.gear.setText(t.gear === 0 ? 'N' : String(t.gear));
    this.rpm.setText(`${Math.round(t.rpm)} RPM`);
    this.speed.setText(`${Math.round(t.speedKmh)} km/h`);
    this.boost.setText(`${t.boostBar.toFixed(1)} BAR`);
    this.status.setText(raceStatus);
  }
}
