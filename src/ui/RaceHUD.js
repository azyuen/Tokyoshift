import { getControlSettings } from '../input/ControlSettings.js?v=20261007-r422';

export default class RaceHUD {
  constructor(scene, options = {}) {
    this.scene = scene;

    // Race and Dyno deliberately consume the same canonical HUD placement.
    // No scene may supply its own x/y/scale override.
    const settings = getControlSettings();
    const placement = settings?.layout?.hud || {};
    this.scale = 0.47 * Number(placement.scale || 1);
    this.x = 780 + Number(placement.dx || 0);
    this.y = 675 + Number(placement.dy || 0);
    this.statusY = 452 + Number(placement.dy || 0);
    this.sourceW = 1473;
    this.sourceH = 452;
    this.hasTurbo = Boolean(options.hasTurbo);
    this.hasNitrous = Boolean(options.hasNitrous);
    this.showGear = options.showGear !== false;

    this.cluster = scene.add.image(this.x, this.y, 'hudCluster')
      .setOrigin(0.5, 1)
      .setScale(this.scale)
      .setDepth(39)
      .setScrollFactor(0);

    this.g = scene.add.graphics().setDepth(40).setScrollFactor(0);

    this.status = scene.add.text(this.x, this.statusY, '', {
      fontFamily: '"Silkscreen", monospace', fontSize: '11px', color: '#fff0b8'
    }).setOrigin(0.5).setDepth(43).setScrollFactor(0);

    this.gearBack = scene.add.rectangle(0, 0, 72, 58, 0x000000, 0)
      .setStrokeStyle(0, 0x000000, 0)
      .setDepth(42)
      .setScrollFactor(0);

    this.gearText = scene.add.text(0, 0, 'N', {
      fontFamily: '"Rajdhani", monospace', fontSize: '30px', color: '#f7f7f2', fontStyle: '700'
    }).setOrigin(0.5).setDepth(43).setScrollFactor(0);

    this.speedText = scene.add.text(0, 0, '0', {
      fontFamily: '"Rajdhani", monospace', fontSize: '16px', color: '#dff6ff', fontStyle: '700'
    }).setOrigin(0.5).setDepth(43).setScrollFactor(0);

    const auxLabelPoint = this.sourcePoint(1048, 383);
    this.auxLabel = scene.add.text(auxLabelPoint.x, auxLabelPoint.y, this.hasTurbo ? 'BOOST' : 'THR', {
      fontFamily: '"Silkscreen", monospace',
      fontSize: '7px',
      color: '#95afbd',
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
    this.gearBack.setPosition(gear.x, gear.y);
    this.gearText.setPosition(gear.x, gear.y);
    this.gearBack.setVisible(this.showGear);
    this.gearText.setVisible(this.showGear);
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
    const aux = this.sourcePoint(1048, 313);

    this.drawNeedle(tach, t.rpm / 8500, 105 * this.scale, 145, 375, t.rpm > 7900 ? 0xff665a : 0xf7f7f2, 3);
    this.drawNeedle(speed, t.speedKmh / 180, 121 * this.scale, 140, 383, 0xf7f7f2, 3);

    if (this.hasTurbo) {
      this.drawNeedle(aux, (t.boostBar + 1.0) / 3.0, 75 * this.scale, 151, 393, 0xf7f7f2, 3);
    } else {
      g.fillStyle(0x071019, 0.84).fillCircle(aux.x, aux.y, 79 * this.scale);
      g.lineStyle(2, 0x415c6b, 0.78).strokeCircle(aux.x, aux.y, 70 * this.scale);
      this.drawNeedle(aux, t.throttle, 62 * this.scale, 151, 393, 0x7fe5ff, 3);
    }

    if (this.hasNitrous) {
      const nosStart = this.sourcePoint(1262, 354);
      const segW = 20 * this.scale;
      const segH = 36 * this.scale;
      const segGap = 7 * this.scale;
      const filled = Math.ceil(Phaser.Math.Clamp(t.nosFraction, 0, 1) * 4 - 0.0001);
      for (let i = 0; i < 4; i++) {
        g.fillStyle(i < filled ? 0x4cc8ff : 0x071019, i < filled ? 0.92 : 0.68)
          .fillRoundedRect(nosStart.x + i * (segW + segGap), nosStart.y, segW, segH, 2);
      }
    }

    if (t.wheelspin) {
      const tr = this.sourcePoint(1201, 294);
      g.fillStyle(0xffa928, 0.24).fillRoundedRect(tr.x, tr.y, 170 * this.scale, 48 * this.scale, 4);
      g.lineStyle(2, 0xffa928, 0.85).strokeRoundedRect(tr.x, tr.y, 170 * this.scale, 48 * this.scale, 4);
    }

    this.status.setText(raceStatus);
    const gearValue = Number(t.gear || 0);
    this.gearText.setText(gearValue === 0 ? 'N' : String(gearValue));
    this.gearText.setVisible(this.showGear);
    this.gearBack.setVisible(this.showGear);
    this.speedText.setText(String(Math.round(t.speedKmh)));
  }

  destroy() {
    [
      this.cluster,
      this.g,
      this.status,
      this.gearBack,
      this.gearText,
      this.speedText,
      this.auxLabel,
    ].forEach(obj => {
      try { obj?.destroy?.(); } catch (e) {}
    });
  }
}
