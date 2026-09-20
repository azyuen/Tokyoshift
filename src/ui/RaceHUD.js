export default class RaceHUD {
  constructor(scene) {
    this.scene = scene;
    this.scale = 0.34;
    this.sourceW = 1448;
    this.sourceH = 1086;
    this.left = 640 - (this.sourceW * this.scale) / 2;
    this.top = 720 - this.sourceH * this.scale;

    this.console = scene.add.image(640, 720, 'hudConsole')
      .setOrigin(0.5, 1)
      .setScale(this.scale)
      .setDepth(39)
      .setScrollFactor(0);

    this.g = scene.add.graphics().setDepth(40).setScrollFactor(0);
    const p = (x, y) => ({ x: this.left + x * this.scale, y: this.top + y * this.scale });
    this.anchor = {
      speed: p(322, 522), rpm: p(1087, 522), boost: p(704, 790), gear: p(720, 305),
      speedDigital: p(320, 684), rpmDigital: p(1087, 684),
      nos: { x: this.left + 608 * this.scale, y: this.top + 455 * this.scale, w: 196 * this.scale, h: 34 * this.scale },
      traction: { x: this.left + 604 * this.scale, y: this.top + 535 * this.scale, w: 204 * this.scale, h: 76 * this.scale },
    };

    this.status = scene.add.text(640, 38, '', { fontFamily: 'monospace', fontSize: '21px', color: '#fff0b8', fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(43).setScrollFactor(0);
    this.gear = scene.add.text(this.anchor.gear.x, this.anchor.gear.y, 'N', { fontFamily: 'monospace', fontSize: '28px', color: '#f5f7ef', fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(43).setScrollFactor(0);
    this.speedText = scene.add.text(this.anchor.speedDigital.x, this.anchor.speedDigital.y, '0', { fontFamily: 'monospace', fontSize: '13px', color: '#e9f8ff', fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(43).setScrollFactor(0);
    this.rpmText = scene.add.text(this.anchor.rpmDigital.x, this.anchor.rpmDigital.y, '900', { fontFamily: 'monospace', fontSize: '12px', color: '#e9f8ff', fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(43).setScrollFactor(0);
  }

  drawNeedle(center, fraction, length, color = 0xf4f5ed) {
    const a = Phaser.Math.DegToRad(215 - 250 * Phaser.Math.Clamp(fraction, 0, 1));
    this.g.lineStyle(3, color, 0.98).beginPath().moveTo(center.x, center.y)
      .lineTo(center.x + Math.cos(a) * length, center.y + Math.sin(a) * length).strokePath();
    this.g.fillStyle(0x171b1d, 1).fillCircle(center.x, center.y, 5);
  }

  update(t, raceStatus) {
    const g = this.g;
    g.clear();
    this.drawNeedle(this.anchor.speed, t.speedKmh / 180, 48);
    this.drawNeedle(this.anchor.rpm, t.rpm / 10000, 48, t.rpm > 8000 ? 0xff4e42 : 0xf4f5ed);
    this.drawNeedle(this.anchor.boost, (t.boostBar + 1) / 2.5, 25);

    const n = this.anchor.nos;
    g.fillStyle(0x071216, 0.92).fillRoundedRect(n.x, n.y, n.w, n.h, 3);
    const nosW = n.w * Phaser.Math.Clamp(t.nosFraction, 0, 1);
    if (nosW > 0) g.fillStyle(0x5bc7d8, 0.95).fillRoundedRect(n.x, n.y, nosW, n.h, 3);

    const tr = this.anchor.traction;
    if (t.wheelspin) {
      g.fillStyle(0xffa51f, 0.22).fillRoundedRect(tr.x, tr.y, tr.w, tr.h, 4);
      g.lineStyle(2, 0xffa51f, 0.95).strokeRoundedRect(tr.x, tr.y, tr.w, tr.h, 4);
    } else {
      g.fillStyle(0x060809, 0.72).fillRoundedRect(tr.x, tr.y, tr.w, tr.h, 4);
    }

    this.status.setText(raceStatus);
    this.gear.setText(t.gear === 0 ? 'N' : String(t.gear));
    this.speedText.setText(String(Math.round(t.speedKmh)));
    this.rpmText.setText(String(Math.round(t.rpm)));
  }
}
