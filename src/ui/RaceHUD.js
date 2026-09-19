export default class RaceHUD {
  constructor(scene) {
    this.scene = scene;
    this.g = scene.add.graphics().setDepth(40).setScrollFactor(0);
    this.text = scene.add.text(640, 605, '', {
      fontFamily: 'monospace', fontSize: '18px', color: '#eef8ff', align: 'center'
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);
    this.gear = scene.add.text(640, 545, '1', {
      fontFamily: 'monospace', fontSize: '46px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);
    this.status = scene.add.text(640, 74, '', {
      fontFamily: 'monospace', fontSize: '26px', color: '#fff0b8', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);
    this.split = scene.add.text(640, 112, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#92a5bb', align: 'center'
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);
  }

  update(t, raceStatus, splitText = '') {
    this.g.clear();
    const cx = 640, cy = 610, radius = 82;
    this.g.fillStyle(0x070a10, 0.78).fillCircle(cx, cy, radius + 14);
    this.g.lineStyle(6, 0x23344a, 1).beginPath().arc(cx, cy, radius, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340)).strokePath();
    const rpmFrac = Phaser.Math.Clamp(t.rpm / 8500, 0, 1);
    const start = Phaser.Math.DegToRad(200), end = Phaser.Math.DegToRad(200 + 140 * rpmFrac);
    this.g.lineStyle(7, t.rpm > 7900 ? 0xff5a70 : 0x63d7ff, 1).beginPath().arc(cx, cy, radius, start, end).strokePath();

    const needleA = Phaser.Math.DegToRad(200 + 140 * rpmFrac);
    this.g.lineStyle(3, 0xffffff, 1).beginPath().moveTo(cx, cy).lineTo(cx + Math.cos(needleA) * 70, cy + Math.sin(needleA) * 70).strokePath();

    // NOS bar.
    this.g.fillStyle(0x152337, 0.9).fillRect(515, 688, 250, 10);
    this.g.fillStyle(0xff4ea3, 0.95).fillRect(515, 688, 250 * t.nosFraction, 10);

    this.gear.setText(t.gear === 0 ? '—' : String(t.gear));
    this.text.setText(`${Math.round(t.rpm)} RPM   ${t.speedKmh.toFixed(0)} km/h   BOOST ${t.boostBar.toFixed(2)} bar\nCL ${Math.round(t.clutch * 100)}%   TH ${Math.round(t.throttle * 100)}%   ${t.wheelspin ? 'WHEELSPIN' : ''}`);
    this.status.setText(raceStatus);
    this.split.setText(splitText);
  }
}
