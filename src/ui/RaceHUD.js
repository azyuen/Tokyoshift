export default class RaceHUD {
  constructor(scene) {
    this.scene = scene;

    this.tach = scene.add.image(640, 718, 'tokyoShiftArt', 'tach_shell')
      .setOrigin(0.5, 1)
      .setScale(1.55)
      .setDepth(39)
      .setScrollFactor(0);

    this.gearPanel = scene.add.image(515, 505, 'tokyoShiftArt', 'gear_panel')
      .setScale(0.92)
      .setDepth(39)
      .setScrollFactor(0);

    this.speedPanel = scene.add.image(765, 505, 'tokyoShiftArt', 'speed_panel')
      .setScale(0.92)
      .setDepth(39)
      .setScrollFactor(0);

    this.g = scene.add.graphics().setDepth(40).setScrollFactor(0);

    this.status = scene.add.text(640, 38, '', {
      fontFamily: 'monospace',
      fontSize: '23px',
      color: '#fff0b8',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);

    this.gear = scene.add.text(515, 509, 'N', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);

    this.speed = scene.add.text(755, 503, '0', {
      fontFamily: 'monospace',
      fontSize: '27px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);

    this.speedUnit = scene.add.text(808, 519, 'KM/H', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#aeeaff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);

    this.rpm = scene.add.text(640, 610, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#dff5ff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);

    this.boostText = scene.add.text(552, 456, 'BOOST', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#7cddff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);

    this.nosText = scene.add.text(728, 456, 'NOS', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ff82bc',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(41).setScrollFactor(0);
  }

  update(t, raceStatus) {
    const g = this.g;
    g.clear();

    // Tach needle over the supplied instrument artwork.
    const cx = 640;
    const cy = 684;
    const rpmFrac = Phaser.Math.Clamp(t.rpm / 8500, 0, 1);
    const needleA = Phaser.Math.DegToRad(200 + 140 * rpmFrac);

    g.lineStyle(4, t.rpm > 7900 ? 0xff5a78 : 0xf3fbff, 0.96)
      .beginPath()
      .moveTo(cx, cy)
      .lineTo(cx + Math.cos(needleA) * 120, cy + Math.sin(needleA) * 120)
      .strokePath();

    g.fillStyle(0x08101d, 1).fillCircle(cx, cy, 9);
    g.lineStyle(2, 0x56dfff, 0.8).strokeCircle(cx, cy, 9);

    // Compact live boost + NOS bars. The physics/debug numbers stay out of
    // the normal racing view.
    g.fillStyle(0x111b2a, 0.95).fillRoundedRect(500, 468, 104, 9, 4);
    g.fillStyle(0x42cfff, 0.95).fillRoundedRect(
      500, 468, 104 * Phaser.Math.Clamp(t.boostBar / 1.2, 0, 1), 9, 4
    );

    g.fillStyle(0x111b2a, 0.95).fillRoundedRect(676, 468, 104, 9, 4);
    g.fillStyle(0xff4fa3, 0.95).fillRoundedRect(
      676, 468, 104 * Phaser.Math.Clamp(t.nosFraction, 0, 1), 9, 4
    );

    if (t.wheelspin) {
      g.lineStyle(2, 0xff5a8e, 0.90)
        .strokeRoundedRect(590, 480, 100, 24, 8);
    }

    this.status.setText(raceStatus);
    this.gear.setText(t.gear === 0 ? 'N' : String(t.gear));
    this.speed.setText(String(Math.round(t.speedKmh)));
    this.rpm.setText(`${Math.round(t.rpm)} RPM`);
  }
}
