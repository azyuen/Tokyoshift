export default class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.throttle = 0;
    this.clutch = 1;
    this.nos = false;
    this.pendingGearRequest = null;
    this.enabled = true;

    scene.input.addPointer(5);
    this.keys = scene.input.keyboard.addKeys({
      throttle: Phaser.Input.Keyboard.KeyCodes.W,
      throttleAlt: Phaser.Input.Keyboard.KeyCodes.UP,
      clutch: Phaser.Input.Keyboard.KeyCodes.C,
      nos: Phaser.Input.Keyboard.KeyCodes.SPACE,
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
      four: Phaser.Input.Keyboard.KeyCodes.FOUR,
      five: Phaser.Input.Keyboard.KeyCodes.FIVE,
      six: Phaser.Input.Keyboard.KeyCodes.SIX,
      debug: Phaser.Input.Keyboard.KeyCodes.D,
      restart: Phaser.Input.Keyboard.KeyCodes.R,
    });

    this.graphics = scene.add.graphics().setDepth(50).setScrollFactor(0);
    this.labels = [];

    // Phase 1.1: large two-thumb zones. The shifter is deliberately a
    // single large upshift pad on mobile; desktop keeps direct 1-6 keys.
    this.layout = {
      clutch: new Phaser.Geom.Rectangle(22, 430, 200, 266),
      nos: new Phaser.Geom.Rectangle(242, 568, 132, 116),
      shifter: new Phaser.Geom.Rectangle(884, 522, 154, 162),
      throttle: new Phaser.Geom.Rectangle(1058, 430, 200, 266),
    };

    this.addLabel(122, 454, 'CLUTCH', 16);
    this.addLabel(308, 626, 'NOS', 22);
    this.addLabel(961, 594, 'SHIFT', 18);
    this.addLabel(961, 625, '↑', 34);
    this.addLabel(1158, 454, 'THROTTLE', 16);

    this.drawDynamic();
  }

  addLabel(x, y, text, size = 14) {
    const t = this.scene.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: `${size}px`,
      color: '#e8f4ff',
      align: 'center',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);
    this.labels.push(t);
    return t;
  }

  pointerIn(rect) {
    return this.scene.input.manager.pointers.find(p => p.isDown && rect.contains(p.x, p.y));
  }

  update() {
    if (!this.enabled) return this.snapshot();

    const keyboardThrottle = this.keys.throttle.isDown || this.keys.throttleAlt.isDown;
    const keyboardClutch = this.keys.clutch.isDown;
    const keyboardNos = this.keys.nos.isDown;

    let touchThrottle = 0;
    const tp = this.pointerIn(this.layout.throttle);
    if (tp) {
      touchThrottle = Phaser.Math.Clamp(
        (this.layout.throttle.bottom - tp.y) / this.layout.throttle.height,
        0,
        1
      );
    }
    this.throttle = Math.max(keyboardThrottle ? 1 : 0, touchThrottle);

    let touchClutch = null;
    const cp = this.pointerIn(this.layout.clutch);
    if (cp) {
      touchClutch = Phaser.Math.Clamp(
        (this.layout.clutch.bottom - cp.y) / this.layout.clutch.height,
        0,
        1
      );
    }
    // Releasing the thumb releases the clutch. Holding C fully depresses it.
    this.clutch = keyboardClutch ? 1 : (touchClutch ?? 0);

    this.nos = keyboardNos || Boolean(this.pointerIn(this.layout.nos));

    // Desktop keeps direct gear selection.
    for (let g = 1; g <= 6; g++) {
      const key = this.keys[['one', 'two', 'three', 'four', 'five', 'six'][g - 1]];
      if (Phaser.Input.Keyboard.JustDown(key)) this.pendingGearRequest = g;
    }

    // Mobile: one large short-throw upshift control.
    const sp = this.pointerIn(this.layout.shifter);
    if (sp && !sp._tsShiftConsumed) {
      this.pendingGearRequest = 'UP';
      sp._tsShiftConsumed = true;
    }

    for (const p of this.scene.input.manager.pointers) {
      if (!p.isDown) p._tsShiftConsumed = false;
    }

    this.drawDynamic();
    return this.snapshot();
  }

  drawDynamic() {
    const g = this.graphics;
    g.clear();

    // Pedal bodies.
    g.fillStyle(0x0b111d, 0.90).lineStyle(3, 0x4a6078, 0.95);
    g.fillRoundedRect(22, 430, 200, 266, 24).strokeRoundedRect(22, 430, 200, 266, 24);
    g.fillRoundedRect(1058, 430, 200, 266, 24).strokeRoundedRect(1058, 430, 200, 266, 24);

    // Inner tracks.
    const innerTop = 478;
    const innerBottom = 676;
    const innerH = innerBottom - innerTop;

    g.fillStyle(0x172231, 0.95);
    g.fillRoundedRect(42, innerTop, 160, innerH, 16);
    g.fillRoundedRect(1078, innerTop, 160, innerH, 16);

    // Clutch bite band: visible without adding another text readout.
    const biteTop = innerBottom - innerH * 0.62;
    const biteBottom = innerBottom - innerH * 0.38;
    g.fillStyle(0xffbd59, 0.28);
    g.fillRect(42, biteTop, 160, biteBottom - biteTop);

    // Analogue fills.
    const clutchFill = innerH * this.clutch;
    g.fillStyle(0x59d9ff, 0.55);
    g.fillRoundedRect(42, innerBottom - clutchFill, 160, clutchFill, 14);

    const throttleFill = innerH * this.throttle;
    g.fillStyle(0xff4fa3, 0.58);
    g.fillRoundedRect(1078, innerBottom - throttleFill, 160, throttleFill, 14);

    // NOS.
    g.fillStyle(0x291128, this.nos ? 1 : 0.92)
      .lineStyle(3, this.nos ? 0xffffff : 0xff4fa3, 0.95);
    g.fillRoundedRect(242, 568, 132, 116, 28)
      .strokeRoundedRect(242, 568, 132, 116, 28);

    // Shift pad.
    const shiftPressed = Boolean(this.pointerIn(this.layout.shifter));
    g.fillStyle(shiftPressed ? 0x254766 : 0x111a27, 0.96)
      .lineStyle(3, shiftPressed ? 0x8ae8ff : 0x61788f, 0.98);
    g.fillRoundedRect(884, 522, 154, 162, 28)
      .strokeRoundedRect(884, 522, 154, 162, 28);
  }

  consumeGearRequest() {
    const g = this.pendingGearRequest;
    this.pendingGearRequest = null;
    return g;
  }

  snapshot() {
    return {
      throttle: this.throttle,
      clutch: this.clutch,
      nos: this.nos,
    };
  }
}
