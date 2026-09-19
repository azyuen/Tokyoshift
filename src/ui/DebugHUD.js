export default class DebugHUD {
  constructor(scene) {
    this.visible = false;
    this.text = scene.add.text(14, 14, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#b9f7d1', backgroundColor: '#08100ddd', padding: { x: 8, y: 7 }
    }).setDepth(100).setScrollFactor(0).setVisible(false);
  }

  toggle() { this.visible = !this.visible; this.text.setVisible(this.visible); }

  update(t) {
    if (!this.visible) return;
    this.text.setText([
      `RPM ${t.rpm.toFixed(0)} | gear ${t.gear} | ${t.speedKmh.toFixed(1)} km/h`,
      `throttle ${(t.throttle * 100).toFixed(0)}% | clutch ${(t.clutch * 100).toFixed(0)}%`,
      `clutch slip ${t.clutchSlipRPM.toFixed(0)} rpm | torque ${t.clutchTorqueNm.toFixed(0)} Nm`,
      `turbo ${(t.turboSpool * 100).toFixed(0)}% | boost ${t.boostBar.toFixed(2)} bar`,
      `wheel ${t.wheelRPM.toFixed(0)} rpm | slip ${(t.slipRatio * 100).toFixed(1)}% | spin ${t.wheelspin}`,
      `drive ${t.forces.drive.toFixed(0)}N | drag ${t.forces.drag.toFixed(0)}N | net ${t.forces.net.toFixed(0)}N`,
      `shift ${t.shiftQuality}`,
      `pos ${t.positionM.toFixed(1)}m`,
      `D = debug | R = restart`,
    ].join('\n'));
  }
}
