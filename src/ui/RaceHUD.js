export default class RaceHUD {
  constructor(scene) {
    this.scene = scene;
    this.scale = 0.47;
    this.sourceW = 1473;
    this.sourceH = 452;

    this.cluster = scene.add.image(780, 675, 'hudCluster')
      .setOrigin(0.5, 1)
      .setScale(this.scale)
      .setDepth(39)
      .setScrollFactor(0);

    this.g = scene.add.graphics().setDepth(40).setScrollFactor(0);

    this.status = scene.add.text(780, 452, '', {
      fontFamily: 'monospace', fontSize: '17px', color: '#fff0b8', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(43).setScrollFactor(0);

    this.gearText = scene.add.text(0, 0, 'N', {
      fontFamily: 'monospace', fontSize: '31px', color: '#f7f7f2', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(43).setScrollFactor(0);

    this.speedText = scene.add.text(0, 0, '0', {
      fontFamily: 'monospace', fontSize: '23px', color: '#dff6ff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(43).setScrollFactor(0);

    this.layoutText();
  }

  sourcePoint(px, py) {
    const left = this.cluster.x - (this.sourceW * this.scale) / 2;
    const top = this.cluster.y - this.sourceH * this.scale;
    return { x: left + px * this.scale, y: top + py * this.scale };
  }

  layoutText() {
    const gear = this.sourcePoint(1260, 229);
    const speed = this.sourcePoint(723, 352);
    this.gearText.setPosition(gear.x, gear.y);
    this.speedText.setPosition(speed.x, speed.y);
  }

  drawNeedle(center, fraction, lengthPx, startDeg, endDeg, color = 0xf7f7f2, width = 3) {
    const a = Phaser.Math.DegToRad(startDeg + (endDeg - startDeg) * Phaser.Math.Clamp(fraction, 0, 1));
    this.g.lineStyle(width, color, 0.98)
      .beginPath()
      .moveTo(center.x, center.y)
      .lineTo(center.x + Math.cos(a) * lengthPx, center.y + Math.sin(a) * lengthPx)
      .strokePath();
    this.g.fillStyle(0x111820, 1).fillCircle(center.x, center.y, 5);
  }

  update(t, raceStatus) {
    const g = this.g;
    g.clear();

    const tach = this.sourcePoint(337, 278);
    const speed = this.sourcePoint(723, 267);
    const boost = this.sourcePoint(1048, 313);

    this.drawNeedle(tach, t.rpm / 8500, 105 * this.scale, 145, 375, t.rpm > 7900 ? 0xff665a : 0xf7f7f2, 3);
    this.drawNeedle(speed, t.speedKmh / 180, 121 * this.scale, 140, 383, 0xf7f7f2, 3);
    this.drawNeedle(boost, (t.boostBar + 1.0) / 3.0, 75 * this.scale, 151, 393, 0xf7f7f2, 3);

    const nosStart = this.sourcePoint(1262, 354);
    const segW = 20 * this.scale;
    const segH = 36 * this.scale;
    const segGap = 7 * this.scale;
    const filled = Math.ceil(Phaser.Math.Clamp(t.nosFraction, 0, 1) * 4 - 0.0001);
    for (let i = 0; i < 4; i++) {
      g.fillStyle(i < filled ? 0x4cc8ff : 0x071019, i < filled ? 0.92 : 0.68)
        .fillRoundedRect(nosStart.x + i * (segW + segGap), nosStart.y, segW, segH, 2);
    }

    if (t.wheelspin) {
      const tr = this.sourcePoint(1201, 294);
      g.fillStyle(0xffa928, 0.24).fillRoundedRect(tr.x, tr.y, 170 * this.scale, 48 * this.scale, 4);
      g.lineStyle(2, 0xffa928, 0.85).strokeRoundedRect(tr.x, tr.y, 170 * this.scale, 48 * this.scale, 4);
    }

    this.status.setText(raceStatus);
    this.gearText.setText(t.gear === 0 ? 'N' : String(t.gear));
    this.speedText.setText(String(Math.round(t.speedKmh)));
  }
}
