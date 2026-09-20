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

    this.graphics = scene.add.graphics().setDepth(49).setScrollFactor(0);
    this.layout = {
      clutch: new Phaser.Geom.Rectangle(0, 430, 250, 290),
      nos: new Phaser.Geom.Rectangle(255, 570, 120, 105),
      shifter: new Phaser.Geom.Rectangle(875, 500, 185, 205),
      throttle: new Phaser.Geom.Rectangle(1030, 430, 250, 290),
    };

    this.clutchSprite = scene.add.image(122, 565, 'clutchPedal').setScale(0.215).setDepth(51).setScrollFactor(0);
    this.throttleSprite = scene.add.image(1156, 565, 'throttlePedal').setScale(0.215).setDepth(51).setScrollFactor(0);
    this.shifterSprite = scene.add.image(966, 590, 'shifterUp').setScale(0.17).setDepth(51).setScrollFactor(0);

    this.nosLabel = scene.add.text(315, 620, 'NOS', {
      fontFamily: 'monospace', fontSize: '21px', color: '#e8eef0', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

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
  }

  pointerIn(rect) {
    return this.scene.input.manager.pointers.find(p => p.isDown && rect.contains(p.x, p.y));
  }

  update() {
    if (!this.enabled) return this.snapshot();

    if (this.throttlePointer && !this.throttlePointer.isDown) {
      this.throttlePointer = null;
      this.throttleLatchedMax = false;
    }
    let touchThrottle = 0;
    if (this.throttlePointer) {
      const travel = this.throttleStartY - this.throttlePointer.y;
      if (travel >= this.pedalSwipePx) this.throttleLatchedMax = true;
      touchThrottle = this.throttleLatchedMax ? 1 : Phaser.Math.Clamp(travel / this.pedalSwipePx, 0, 1);
    }
    this.throttle = Math.max((this.keys.throttle.isDown || this.keys.throttleAlt.isDown) ? 1 : 0, touchThrottle);

    if (this.clutchPointer && !this.clutchPointer.isDown) {
      this.clutchPointer = null;
      this.clutchLatchedMax = false;
    }
    let touchClutch = 0;
    if (this.clutchPointer) {
      const travel = this.clutchStartY - this.clutchPointer.y;
      if (travel >= this.pedalSwipePx) this.clutchLatchedMax = true;
      touchClutch = this.clutchLatchedMax ? 1 : Phaser.Math.Clamp(travel / this.pedalSwipePx, 0, 1);
    }
    this.clutch = this.keys.clutch.isDown ? 1 : touchClutch;
    this.nos = this.keys.nos.isDown || Boolean(this.pointerIn(this.layout.nos));

    for (let g = 1; g <= 6; g++) {
      const key = this.keys[['one', 'two', 'three', 'four', 'five', 'six'][g - 1]];
      if (Phaser.Input.Keyboard.JustDown(key)) this.pendingGearRequest = g;
    }

    const sp = this.pointerIn(this.layout.shifter);
    if (sp && !sp._tsShiftConsumed) {
      this.pendingGearRequest = 'UP';
      sp._tsShiftConsumed = true;
    }
    for (const p of this.scene.input.manager.pointers) if (!p.isDown) p._tsShiftConsumed = false;

    this.drawDynamic(Boolean(sp));
    return this.snapshot();
  }

  drawDynamic(shiftPressed) {
    const g = this.graphics;
    g.clear();

    const clutchBar = { x: 171, y: 500, w: 21, h: 151 };
    const throttleBar = { x: 1196, y: 499, w: 22, h: 151 };
    g.fillStyle(0x54b7c4, 0.85).fillRect(clutchBar.x, clutchBar.y + clutchBar.h * (1 - this.clutch), clutchBar.w, clutchBar.h * this.clutch);
    g.fillStyle(0xc6a84e, 0.88).fillRect(throttleBar.x, throttleBar.y + throttleBar.h * (1 - this.throttle), throttleBar.w, throttleBar.h * this.throttle);

    g.fillStyle(this.nos ? 0x5db9c4 : 0x11171a, 0.88)
      .lineStyle(2, this.nos ? 0xcffaff : 0x5b6a70, 0.9)
      .fillRoundedRect(255, 570, 120, 105, 22)
      .strokeRoundedRect(255, 570, 120, 105, 22);

    this.shifterSprite.setTexture(shiftPressed ? 'shifterDown' : 'shifterUp');
    this.nosLabel.setColor(this.nos ? '#ffffff' : '#e8eef0');
  }

  consumeGearRequest() {
    const g = this.pendingGearRequest;
    this.pendingGearRequest = null;
    return g;
  }

  snapshot() {
    return { throttle: this.throttle, clutch: this.clutch, nos: this.nos };
  }
}
