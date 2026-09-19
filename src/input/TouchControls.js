export default class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.throttle = 0;
    this.clutch = 0;
    this.nos = false;
    this.pendingGearRequest = null;
    this.enabled = true;

    this.clutchPointer = null;
    this.throttlePointer = null;
    this.clutchStartY = 0;
    this.throttleStartY = 0;
    this.clutchLatchedMax = false;
    this.throttleLatchedMax = false;
    this.pedalSwipePx = 64;

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

    // Large thumb zones. Artwork is smaller than the actual hit areas so the
    // controls stay forgiving on a phone.
    this.layout = {
      clutch: new Phaser.Geom.Rectangle(18, 425, 220, 275),
      nos: new Phaser.Geom.Rectangle(250, 565, 126, 112),
      shifter: new Phaser.Geom.Rectangle(878, 515, 170, 170),
      throttle: new Phaser.Geom.Rectangle(1040, 425, 222, 275),
    };

    this.clutchSprite = scene.add.image(126, 558, 'tokyoShiftArt', 'clutch_pedal')
      .setScale(1.52).setDepth(51).setScrollFactor(0);

    this.throttleSprite = scene.add.image(1150, 558, 'tokyoShiftArt', 'throttle_pedal')
      .setScale(1.48).setDepth(51).setScrollFactor(0);

    this.shifterSprite = scene.add.image(962, 575, 'tokyoShiftArt', 'shifter_knob')
      .setScale(1.30).setDepth(51).setScrollFactor(0);

    this.shifterLabel = scene.add.text(962, 660, 'SHIFT', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#c8efff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.nosLabel = scene.add.text(313, 621, 'NOS', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ffd7eb',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    // Relative swipe controls: touch anywhere in a pedal's large hit area,
    // swipe up a short distance, and max stays latched until that thumb lifts.
    scene.input.on('pointerdown', pointer => {
      if (!this.clutchPointer && this.layout.clutch.contains(pointer.x, pointer.y)) {
        this.clutchPointer = pointer;
        this.clutchStartY = pointer.y;
        this.clutchLatchedMax = false;
      } else if (!this.throttlePointer && this.layout.throttle.contains(pointer.x, pointer.y)) {
        this.throttlePointer = pointer;
        this.throttleStartY = pointer.y;
        this.throttleLatchedMax = false;
      }
    });

    scene.input.on('pointerup', pointer => {
      if (pointer === this.clutchPointer) {
        this.clutchPointer = null;
        this.clutchLatchedMax = false;
      }
      if (pointer === this.throttlePointer) {
        this.throttlePointer = null;
        this.throttleLatchedMax = false;
      }
    });

    this.drawDynamic(false);
  }

  pointerIn(rect) {
    return this.scene.input.manager.pointers.find(p => p.isDown && rect.contains(p.x, p.y));
  }

  update() {
    if (!this.enabled) return this.snapshot();

    const keyboardThrottle = this.keys.throttle.isDown || this.keys.throttleAlt.isDown;
    const keyboardClutch = this.keys.clutch.isDown;
    const keyboardNos = this.keys.nos.isDown;

    if (this.throttlePointer && !this.throttlePointer.isDown) {
      this.throttlePointer = null;
      this.throttleLatchedMax = false;
    }

    let touchThrottle = 0;
    if (this.throttlePointer) {
      const travel = this.throttleStartY - this.throttlePointer.y;
      if (travel >= this.pedalSwipePx) this.throttleLatchedMax = true;
      touchThrottle = this.throttleLatchedMax
        ? 1
        : Phaser.Math.Clamp(travel / this.pedalSwipePx, 0, 1);
    }
    this.throttle = Math.max(keyboardThrottle ? 1 : 0, touchThrottle);

    if (this.clutchPointer && !this.clutchPointer.isDown) {
      this.clutchPointer = null;
      this.clutchLatchedMax = false;
    }

    let touchClutch = 0;
    if (this.clutchPointer) {
      const travel = this.clutchStartY - this.clutchPointer.y;
      if (travel >= this.pedalSwipePx) this.clutchLatchedMax = true;
      touchClutch = this.clutchLatchedMax
        ? 1
        : Phaser.Math.Clamp(travel / this.pedalSwipePx, 0, 1);
    }
    this.clutch = keyboardClutch ? 1 : touchClutch;

    this.nos = keyboardNos || Boolean(this.pointerIn(this.layout.nos));

    // Desktop keeps direct 1–6 gear selection.
    for (let g = 1; g <= 6; g++) {
      const key = this.keys[['one', 'two', 'three', 'four', 'five', 'six'][g - 1]];
      if (Phaser.Input.Keyboard.JustDown(key)) this.pendingGearRequest = g;
    }

    // Mobile uses one big short-throw sequential shift control.
    const sp = this.pointerIn(this.layout.shifter);
    if (sp && !sp._tsShiftConsumed) {
      this.pendingGearRequest = 'UP';
      sp._tsShiftConsumed = true;
    }

    for (const p of this.scene.input.manager.pointers) {
      if (!p.isDown) p._tsShiftConsumed = false;
    }

    this.drawDynamic(Boolean(sp));
    return this.snapshot();
  }

  drawDynamic(shiftPressed) {
    const g = this.graphics;
    g.clear();

    // Very subtle outlines show the forgiving thumb areas without clutter.
    g.lineStyle(2, this.clutch > 0 ? 0x63d7ff : 0x30475c, this.clutch > 0 ? 0.60 : 0.22)
      .strokeRoundedRect(18, 425, 220, 275, 22);

    g.lineStyle(2, this.throttle > 0 ? 0xff4fa3 : 0x30475c, this.throttle > 0 ? 0.60 : 0.22)
      .strokeRoundedRect(1040, 425, 222, 275, 22);

    // Shifter base.
    g.fillStyle(0x0b111d, 0.68)
      .lineStyle(2, shiftPressed ? 0x8ae8ff : 0x40586d, shiftPressed ? 0.85 : 0.40)
      .fillRoundedRect(878, 515, 170, 170, 24)
      .strokeRoundedRect(878, 515, 170, 170, 24);

    // NOS remains a large hold button.
    g.fillStyle(this.nos ? 0xff3f98 : 0x291128, this.nos ? 0.90 : 0.72)
      .lineStyle(2, this.nos ? 0xffffff : 0xff4fa3, 0.82)
      .fillRoundedRect(250, 565, 126, 112, 25)
      .strokeRoundedRect(250, 565, 126, 112, 25);

    // Soft level glows beneath the pedal art.
    if (this.clutch > 0) {
      g.fillStyle(0x55d9ff, 0.14 + this.clutch * 0.18)
        .fillRoundedRect(46, 655 - 185 * this.clutch, 160, 185 * this.clutch, 14);
    }
    if (this.throttle > 0) {
      g.fillStyle(0xff4fa3, 0.14 + this.throttle * 0.18)
        .fillRoundedRect(1070, 655 - 185 * this.throttle, 160, 185 * this.throttle, 14);
    }

    this.clutchSprite.setScale(1.52 + this.clutch * 0.035);
    this.throttleSprite.setScale(1.48 + this.throttle * 0.035);
    this.shifterSprite
      .setScale(shiftPressed ? 1.36 : 1.30)
      .setY(shiftPressed ? 581 : 575);

    this.nosLabel.setColor(this.nos ? '#ffffff' : '#ffd7eb');
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
