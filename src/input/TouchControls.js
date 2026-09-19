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
    this.layout = {
      clutch: new Phaser.Geom.Rectangle(42, 448, 120, 224),
      nos: new Phaser.Geom.Rectangle(186, 560, 112, 92),
      shifter: new Phaser.Geom.Rectangle(864, 492, 190, 170),
      throttle: new Phaser.Geom.Rectangle(1100, 448, 130, 224),
    };
    this.drawStatic();
  }

  addLabel(x, y, text, size = 14) {
    const t = this.scene.add.text(x, y, text, { fontFamily: 'monospace', fontSize: `${size}px`, color: '#d7e8f5', align: 'center' })
      .setOrigin(0.5).setDepth(51).setScrollFactor(0);
    this.labels.push(t);
    return t;
  }

  drawStatic() {
    const g = this.graphics;
    g.clear();
    g.fillStyle(0x0d1220, 0.82).lineStyle(2, 0x52667e, 0.9);
    g.fillRoundedRect(42, 448, 120, 224, 12).strokeRoundedRect(42, 448, 120, 224, 12);
    g.fillRoundedRect(1100, 448, 130, 224, 12).strokeRoundedRect(1100, 448, 130, 224, 12);
    g.fillRoundedRect(864, 492, 190, 170, 12).strokeRoundedRect(864, 492, 190, 170, 12);
    g.fillStyle(0x311225, 0.88).lineStyle(2, 0xff5aa8, 0.9);
    g.fillRoundedRect(186, 560, 112, 92, 18).strokeRoundedRect(186, 560, 112, 92, 18);

    this.addLabel(102, 468, 'CLUTCH');
    this.addLabel(1165, 468, 'THROTTLE');
    this.addLabel(242, 606, 'NOS', 20);
    this.addLabel(959, 510, 'SHIFTER');

    const gears = [[1, 2], [3, 4], [5, 6]];
    for (let r = 0; r < gears.length; r++) {
      for (let c = 0; c < 2; c++) {
        if (!gears[r][c]) continue;
        this.addLabel(915 + c * 86, 548 + r * 48, String(gears[r][c]), 22);
      }
    }
  }

  pointerIn(rect) {
    return this.scene.input.manager.pointers.find(p => p.isDown && rect.contains(p.x, p.y));
  }

  update() {
    if (!this.enabled) return this.snapshot();

    // Keyboard fallbacks for desktop testing.
    const keyboardThrottle = this.keys.throttle.isDown || this.keys.throttleAlt.isDown;
    const keyboardClutch = this.keys.clutch.isDown;
    const keyboardNos = this.keys.nos.isDown;

    let touchThrottle = 0;
    const tp = this.pointerIn(this.layout.throttle);
    if (tp) touchThrottle = Phaser.Math.Clamp((this.layout.throttle.bottom - tp.y) / this.layout.throttle.height, 0, 1);
    this.throttle = Math.max(keyboardThrottle ? 1 : 0, touchThrottle);

    let touchClutch = null;
    const cp = this.pointerIn(this.layout.clutch);
    if (cp) touchClutch = Phaser.Math.Clamp((this.layout.clutch.bottom - cp.y) / this.layout.clutch.height, 0, 1);
    // Clutch defaults engaged when untouched; hold C = fully depressed.
    this.clutch = keyboardClutch ? 1 : (touchClutch ?? 0);

    this.nos = keyboardNos || Boolean(this.pointerIn(this.layout.nos));

    for (let g = 1; g <= 6; g++) {
      const key = this.keys[['one', 'two', 'three', 'four', 'five', 'six'][g - 1]];
      if (Phaser.Input.Keyboard.JustDown(key)) this.pendingGearRequest = g;
    }

    const sp = this.pointerIn(this.layout.shifter);
    if (sp && !sp._tsShiftConsumed) {
      const localX = sp.x - this.layout.shifter.x;
      const localY = sp.y - this.layout.shifter.y;
      const col = localX < this.layout.shifter.width / 2 ? 0 : 1;
      const row = Math.floor((localY - 33) / 48);
      const table = [[1, 2], [3, 4], [5, 6]];
      if (row >= 0 && row < 3) {
        const gear = table[row][col];
        if (gear) {
          this.pendingGearRequest = gear;
          sp._tsShiftConsumed = true;
        }
      }
    }
    for (const p of this.scene.input.manager.pointers) if (!p.isDown) p._tsShiftConsumed = false;

    this.drawDynamic();
    return this.snapshot();
  }

  drawDynamic() {
    const g = this.graphics;
    // Redraw static first because dynamic bars are on same graphics object.
    g.clear();
    g.fillStyle(0x0d1220, 0.82).lineStyle(2, 0x52667e, 0.9);
    g.fillRoundedRect(42, 448, 120, 224, 12).strokeRoundedRect(42, 448, 120, 224, 12);
    g.fillRoundedRect(1100, 448, 130, 224, 12).strokeRoundedRect(1100, 448, 130, 224, 12);
    g.fillRoundedRect(864, 492, 190, 170, 12).strokeRoundedRect(864, 492, 190, 170, 12);
    g.fillStyle(0x311225, this.nos ? 1 : 0.88).lineStyle(2, this.nos ? 0xffffff : 0xff5aa8, 0.9);
    g.fillRoundedRect(186, 560, 112, 92, 18).strokeRoundedRect(186, 560, 112, 92, 18);

    g.fillStyle(0x64d8ff, 0.45);
    g.fillRect(52, 662 - this.clutch * 188, 100, this.clutch * 188);
    g.fillStyle(0xff5aa8, 0.45);
    g.fillRect(1110, 662 - this.throttle * 188, 110, this.throttle * 188);
  }

  consumeGearRequest() {
    const g = this.pendingGearRequest;
    this.pendingGearRequest = null;
    return g;
  }

  snapshot() { return { throttle: this.throttle, clutch: this.clutch, nos: this.nos }; }
}
