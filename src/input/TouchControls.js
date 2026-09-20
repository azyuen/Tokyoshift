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
    this.pedalSwipePx = 72;

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

    this.layout = {
      clutch: new Phaser.Geom.Rectangle(0, 480, 190, 240),
      nos: new Phaser.Geom.Rectangle(180, 535, 145, 140),
      shifter: new Phaser.Geom.Rectangle(1165, 500, 195, 210),
      throttle: new Phaser.Geom.Rectangle(1370, 475, 190, 245),
    };

    this.clutchScale = 0.14;
    this.throttleScale = 0.14;
    this.nosScale = 0.09;
    this.shifterScale = 0.11;

    this.clutchSprite = scene.add.image(95, 608, 'clutchPedal').setScale(this.clutchScale).setDepth(51).setScrollFactor(0);
    this.nosSprite = scene.add.image(255, 608, 'nosButton').setScale(this.nosScale).setDepth(51).setScrollFactor(0);
    this.shifterSprite = scene.add.image(1262, 608, 'shifterNeutral').setScale(this.shifterScale).setDepth(51).setScrollFactor(0);
    this.throttleSprite = scene.add.image(1470, 603, 'throttlePedal').setScale(this.throttleScale).setDepth(51).setScrollFactor(0);

    this.plusLabel = scene.add.text(1262, 510, '+', {
      fontFamily: 'monospace', fontSize: '22px', color: '#c7d8df', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);
    this.minusLabel = scene.add.text(1262, 701, '−', {
      fontFamily: 'monospace', fontSize: '22px', color: '#c7d8df', fontStyle: 'bold'
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
      touchThrottle = this.throttleLatchedMax ? 1 : Phaser.Math.Clamp(travel / this.pedalSwipePx, 0, 1);
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
      touchClutch = this.clutchLatchedMax ? 1 : Phaser.Math.Clamp(travel / this.pedalSwipePx, 0, 1);
    }
    this.clutch = keyboardClutch ? 1 : touchClutch;
    this.nos = keyboardNos || Boolean(this.pointerIn(this.layout.nos));

    for (let g = 1; g <= 6; g++) {
      const key = this.keys[['one', 'two', 'three', 'four', 'five', 'six'][g - 1]];
      if (Phaser.Input.Keyboard.JustDown(key)) this.pendingGearRequest = g;
    }

    const sp = this.pointerIn(this.layout.shifter);
    let shiftState = 'neutral';
    if (sp) {
      const upperHalf = sp.y < this.layout.shifter.centerY;
      shiftState = upperHalf ? 'up' : 'down';
      if (!sp._tsShiftConsumed) {
        this.pendingGearRequest = upperHalf ? 'UP' : 'DOWN';
        sp._tsShiftConsumed = true;
      }
    }
    for (const p of this.scene.input.manager.pointers) if (!p.isDown) p._tsShiftConsumed = false;

    this.drawDynamic(shiftState);
    return this.snapshot();
  }

  drawDynamic(shiftState) {
    const g = this.graphics;
    g.clear();

    const clutchBar = { x: 136.5, y: 567.8, w: 15.0, h: 124.6 };
    const throttleBar = { x: 1501.4, y: 553.1, w: 17.6, h: 131.0 };

    g.fillStyle(0x48c9e8, 0.92)
      .fillRoundedRect(clutchBar.x, clutchBar.y + clutchBar.h * (1 - this.clutch), clutchBar.w, clutchBar.h * this.clutch, 3);
    g.fillStyle(0xe0b24e, 0.94)
      .fillRoundedRect(throttleBar.x, throttleBar.y + throttleBar.h * (1 - this.throttle), throttleBar.w, throttleBar.h * this.throttle, 3);

    g.lineStyle(2, 0x476272, 0.14).strokeRoundedRect(this.layout.clutch.x, this.layout.clutch.y, this.layout.clutch.width, this.layout.clutch.height, 18);
    g.lineStyle(2, 0x476272, 0.14).strokeRoundedRect(this.layout.throttle.x, this.layout.throttle.y, this.layout.throttle.width, this.layout.throttle.height, 18);
    g.lineStyle(2, 0x476272, 0.16).strokeRoundedRect(this.layout.shifter.x, this.layout.shifter.y, this.layout.shifter.width, this.layout.shifter.height, 18);

    if (shiftState === 'down') {
      this.shifterSprite.setTexture('shifterDown').setPosition(1262, 610).setScale(this.shifterScale);
    } else {
      this.shifterSprite.setTexture('shifterNeutral').setPosition(1262, shiftState === 'up' ? 602 : 608).setScale(this.shifterScale);
    }

    this.nosSprite.setScale(this.nos ? this.nosScale * 0.96 : this.nosScale);
    this.nosSprite.setTint(this.nos ? 0xffffff : 0xe9eef1);
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
