import {
  getControlSettings,
  getConnectedGamepads,
} from './ControlSettings.js?v=20261007-r421';

const BASE_RECTS = Object.freeze({
  clutch: Object.freeze({ x: 65, y: 390, w: 220, h: 320 }),
  nos: Object.freeze({ x: 318, y: 510, w: 122, h: 145 }),
  shifter: Object.freeze({ x: 1090, y: 380, w: 245, h: 330 }),
  throttle: Object.freeze({ x: 1315, y: 385, w: 190, h: 325 }),
});

const BASE_SPRITES = Object.freeze({
  clutch: Object.freeze({ x: 175, scale: 0.175 }),
  nos: Object.freeze({ x: 378, y: 570, scale: 0.088 }),
  shifter: Object.freeze({ x: 1218, scale: 0.20 }),
  throttle: Object.freeze({ x: 1405, scale: 0.175 }),
});

const DIRECT_GEAR_ACTIONS = Object.freeze([
  ['gear1', 1],
  ['gear2', 2],
  ['gear3', 3],
  ['gear4', 4],
  ['gear5', 5],
  ['gear6', 6],
]);

function bindingDown(set, binding = []) {
  return (Array.isArray(binding) ? binding : []).some(code => set.has(code));
}

function scaledRect(base, placement) {
  const scale = Number(placement?.scale || 1);
  const cx = base.x + base.w / 2 + Number(placement?.dx || 0);
  const cy = base.y + base.h / 2 + Number(placement?.dy || 0);
  const w = base.w * scale;
  const h = base.h * scale;
  return new Phaser.Geom.Rectangle(cx - w / 2, cy - h / 2, w, h);
}

export default class TouchControls {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.settings = getControlSettings();
    this.nosEnabled = options.nosEnabled !== false;
    const dynoHasNos =
      scene.sys?.settings?.key === 'DynoScene' &&
      Number(scene.build?.car?.nosPower || 0) > 0 &&
      Number(scene.build?.car?.nosCapacitySeconds || 0) > 0;
    this.showNos = options.showNos !== false && (
      options.showNos === true ||
      this.nosEnabled ||
      dynoHasNos
    );
    this.throttle = 0;
    this.clutch = 0;
    this.nos = false;
    this.pendingGearRequest = null;
    this.enabled = true;

    this.clutchPointer = null;
    this.throttlePointer = null;
    this.shifterPointer = null;
    this.clutchStartY = 0;
    this.throttleStartY = 0;
    this.shifterStartY = 0;
    this.shifterSwipeDirection = 'neutral';
    this.shifterSwipeConsumed = false;
    // Race and Dyno deliberately share identical pedal gesture behaviour.
    // Legacy scene-specific overrides are ignored.
    this.pedalLatchMax = true;
    this.clutchLatchedMax = false;
    this.throttleLatchedMax = false;
    this.pedalSwipePx = 72;
    this.shifterSwipePx = 54;
    this.controllerPrevious = {};

    const layout = this.settings.layout || {};
    this.placements = {
      clutch: { ...(layout.clutch || {}) },
      nos: { ...(layout.nos || {}) },
      shifter: { ...(layout.shifter || {}) },
      throttle: { ...(layout.throttle || {}) },
    };

    scene.input.addPointer(5);

    // Developer utility keys stay fixed. Driving keys are user-remappable.
    this.keys = scene.input.keyboard.addKeys({
      debug: Phaser.Input.Keyboard.KeyCodes.D,
      restart: Phaser.Input.Keyboard.KeyCodes.R,
    });

    this.keyboardDown = new Set();
    this.onKeyDown = event => {
      const code = String(event?.code || '');
      if (!code) return;
      this.keyboardDown.add(code);
      if (event?.repeat) return;

      const bindings = this.settings.keyboard || {};
      if (bindingDown(new Set([code]), bindings.shiftUp)) {
        this.pendingGearRequest = 'UP';
        return;
      }
      if (bindingDown(new Set([code]), bindings.shiftDown)) {
        this.pendingGearRequest = 'DOWN';
        return;
      }
      for (const [action, gear] of DIRECT_GEAR_ACTIONS) {
        if (bindingDown(new Set([code]), bindings[action])) {
          this.pendingGearRequest = gear;
          return;
        }
      }
    };
    this.onKeyUp = event => {
      const code = String(event?.code || '');
      if (code) this.keyboardDown.delete(code);
    };
    scene.input.keyboard.on('keydown', this.onKeyDown);
    scene.input.keyboard.on('keyup', this.onKeyUp);

    this.graphics = scene.add.graphics().setDepth(50).setScrollFactor(0);

    this.layout = {
      clutch: scaledRect(BASE_RECTS.clutch, this.placements.clutch),
      nos: scaledRect(BASE_RECTS.nos, this.placements.nos),
      shifter: scaledRect(BASE_RECTS.shifter, this.placements.shifter),
      throttle: scaledRect(BASE_RECTS.throttle, this.placements.throttle),
    };

    const textureHeight = key => {
      try { return Number(scene.textures.get(key)?.getSourceImage()?.height || 0); } catch (e) { return 0; }
    };
    const bottomAlignedY = (key, scale, fallback) => {
      const h = textureHeight(key);
      return h > 0 ? 710 - (h * scale) / 2 : fallback;
    };

    this.clutchScale = BASE_SPRITES.clutch.scale * Number(this.placements.clutch.scale || 1);
    this.throttleScale = BASE_SPRITES.throttle.scale * Number(this.placements.throttle.scale || 1);
    this.nosScale = BASE_SPRITES.nos.scale * Number(this.placements.nos.scale || 1);
    this.shifterScale = BASE_SPRITES.shifter.scale * Number(this.placements.shifter.scale || 1);

    const clutchY = bottomAlignedY('clutchPedal', this.clutchScale, 545) + Number(this.placements.clutch.dy || 0);
    const throttleY = bottomAlignedY('throttlePedal', this.throttleScale, 545) + Number(this.placements.throttle.dy || 0);
    const shifterY = bottomAlignedY('shifterNeutral', this.shifterScale, 535) + Number(this.placements.shifter.dy || 0);
    const nosY = BASE_SPRITES.nos.y + Number(this.placements.nos.dy || 0);

    this.shifterNeutralY = shifterY;
    this.shifterUpY = shifterY - 10 * Number(this.placements.shifter.scale || 1);
    this.shifterDownY = shifterY + 10 * Number(this.placements.shifter.scale || 1);
    this.shifterX = BASE_SPRITES.shifter.x + Number(this.placements.shifter.dx || 0);

    this.clutchSprite = scene.add.image(
      BASE_SPRITES.clutch.x + Number(this.placements.clutch.dx || 0),
      clutchY,
      'clutchPedal'
    ).setScale(this.clutchScale).setDepth(51).setScrollFactor(0);

    this.nosSprite = scene.add.image(
      BASE_SPRITES.nos.x + Number(this.placements.nos.dx || 0),
      nosY,
      'nosButton'
    ).setScale(this.nosScale).setDepth(51).setScrollFactor(0)
      .setVisible(this.showNos)
      .setAlpha(this.nosEnabled ? 1 : 0.42);

    // Older DynoScene code explicitly hides NOS because dyno pulls do not fire
    // nitrous. Keep it visible (dimmed/non-functional) while driving so Race
    // and Dyno retain the same canonical layout; intro screens may still hide it.
    if (scene.sys?.settings?.key === 'DynoScene' && this.showNos) {
      const setNosVisible = this.nosSprite.setVisible.bind(this.nosSprite);
      this.nosSprite.setVisible = value => setNosVisible(
        value || (this.enabled && this.showNos)
      );
    }

    this.shifterSprite = scene.add.image(
      this.shifterX,
      shifterY,
      'shifterNeutral'
    ).setScale(this.shifterScale).setDepth(51).setScrollFactor(0);

    this.throttleSprite = scene.add.image(
      BASE_SPRITES.throttle.x + Number(this.placements.throttle.dx || 0),
      throttleY,
      'throttlePedal'
    ).setScale(this.throttleScale).setDepth(51).setScrollFactor(0);

    this.onPointerDown = pointer => {
      if (!this.enabled) return;
      if (!this.clutchPointer && this.layout.clutch.contains(pointer.x, pointer.y)) {
        this.clutchPointer = pointer;
        this.clutchStartY = pointer.y;
        this.clutchLatchedMax = false;
      } else if (!this.throttlePointer && this.layout.throttle.contains(pointer.x, pointer.y)) {
        this.throttlePointer = pointer;
        this.throttleStartY = pointer.y;
        this.throttleLatchedMax = false;
      } else if (!this.shifterPointer && this.layout.shifter.contains(pointer.x, pointer.y)) {
        this.shifterPointer = pointer;
        this.shifterStartY = pointer.y;
        this.shifterSwipeDirection = 'neutral';
        this.shifterSwipeConsumed = false;
      }
    };

    this.onPointerMove = pointer => {
      if (!this.enabled || pointer !== this.shifterPointer || !pointer.isDown) return;
      const deltaY = pointer.y - this.shifterStartY;
      if (Math.abs(deltaY) >= 18) {
        this.shifterSwipeDirection = deltaY < 0 ? 'up' : 'down';
      }
      const scale = Math.max(0.55, Number(this.placements.shifter.scale || 1));
      if (!this.shifterSwipeConsumed && Math.abs(deltaY) >= this.shifterSwipePx * scale) {
        this.pendingGearRequest = deltaY < 0 ? 'UP' : 'DOWN';
        this.shifterSwipeConsumed = true;
      }
    };

    this.onPointerUp = pointer => {
      if (pointer === this.clutchPointer) {
        this.clutchPointer = null;
        this.clutchLatchedMax = false;
      }
      if (pointer === this.throttlePointer) {
        this.throttlePointer = null;
        this.throttleLatchedMax = false;
      }
      if (pointer === this.shifterPointer) {
        this.shifterPointer = null;
        this.shifterSwipeDirection = 'neutral';
        this.shifterSwipeConsumed = false;
      }
    };

    scene.input.on('pointerdown', this.onPointerDown);
    scene.input.on('pointermove', this.onPointerMove);
    scene.input.on('pointerup', this.onPointerUp);
  }

  pointerIn(rect) {
    return this.scene.input.manager.pointers.find(p => p.isDown && rect.contains(p.x, p.y));
  }

  getActiveGamepad() {
    return getConnectedGamepads()[0] || null;
  }

  readControllerBinding(gamepad, binding) {
    if (!gamepad || !binding) return 0;
    if (binding.kind === 'button') {
      const button = gamepad.buttons?.[Number(binding.index)];
      if (!button) return 0;
      const value = Number(button.value);
      return Phaser.Math.Clamp(Number.isFinite(value) ? value : (button.pressed ? 1 : 0), 0, 1);
    }
    if (binding.kind === 'axis') {
      const raw = Number(gamepad.axes?.[Number(binding.index)] || 0);
      const direction = Number(binding.direction) < 0 ? -1 : 1;
      const deadzone = Phaser.Math.Clamp(Number(binding.deadzone ?? 0.18), 0, 0.75);
      const directed = raw * direction;
      if (directed <= deadzone) return 0;
      return Phaser.Math.Clamp((directed - deadzone) / Math.max(0.01, 1 - deadzone), 0, 1);
    }
    return 0;
  }

  updateControllerRequests(gamepad) {
    const bindings = this.settings.controller || {};
    const actions = [
      ['shiftUp', 'UP'],
      ['shiftDown', 'DOWN'],
      ...DIRECT_GEAR_ACTIONS,
    ];

    actions.forEach(([action, request]) => {
      const down = this.readControllerBinding(gamepad, bindings[action]) >= 0.55;
      const wasDown = Boolean(this.controllerPrevious[action]);
      if (down && !wasDown) this.pendingGearRequest = request;
      this.controllerPrevious[action] = down;
    });
  }

  update() {
    if (!this.enabled) return this.snapshot();

    const keyboard = this.settings.keyboard || {};
    const keyboardThrottle = bindingDown(this.keyboardDown, keyboard.throttle);
    const keyboardClutch = bindingDown(this.keyboardDown, keyboard.clutch);
    const keyboardNos = this.nosEnabled && bindingDown(this.keyboardDown, keyboard.nos);

    const gamepad = this.getActiveGamepad();
    const controller = this.settings.controller || {};
    this.updateControllerRequests(gamepad);
    const controllerThrottle = this.readControllerBinding(gamepad, controller.throttle);
    const controllerClutch = this.readControllerBinding(gamepad, controller.clutch);
    const controllerNos = this.nosEnabled && this.readControllerBinding(gamepad, controller.nos) >= 0.55;

    if (this.throttlePointer && !this.throttlePointer.isDown) {
      this.throttlePointer = null;
      this.throttleLatchedMax = false;
    }
    let touchThrottle = 0;
    if (this.throttlePointer) {
      const scale = Math.max(0.55, Number(this.placements.throttle.scale || 1));
      const travel = this.throttleStartY - this.throttlePointer.y;
      if (this.pedalLatchMax && travel >= this.pedalSwipePx * scale) this.throttleLatchedMax = true;
      touchThrottle = this.throttleLatchedMax
        ? 1
        : Phaser.Math.Clamp(travel / (this.pedalSwipePx * scale), 0, 1);
    }
    this.throttle = Math.max(keyboardThrottle ? 1 : 0, touchThrottle, controllerThrottle);

    if (this.clutchPointer && !this.clutchPointer.isDown) {
      this.clutchPointer = null;
      this.clutchLatchedMax = false;
    }
    let touchClutch = 0;
    if (this.clutchPointer) {
      const scale = Math.max(0.55, Number(this.placements.clutch.scale || 1));
      const travel = this.clutchStartY - this.clutchPointer.y;
      if (this.pedalLatchMax && travel >= this.pedalSwipePx * scale) this.clutchLatchedMax = true;
      touchClutch = this.clutchLatchedMax
        ? 1
        : Phaser.Math.Clamp(travel / (this.pedalSwipePx * scale), 0, 1);
    }
    this.clutch = Math.max(keyboardClutch ? 1 : 0, touchClutch, controllerClutch);
    this.nos = this.nosEnabled && (
      keyboardNos ||
      controllerNos ||
      Boolean(this.pointerIn(this.layout.nos))
    );

    if (this.shifterPointer && !this.shifterPointer.isDown) {
      this.shifterPointer = null;
      this.shifterSwipeDirection = 'neutral';
      this.shifterSwipeConsumed = false;
    }

    this.drawDynamic(this.shifterSwipeDirection || 'neutral');
    return this.snapshot();
  }

  drawDynamic(shiftState) {
    const g = this.graphics;
    g.clear();

    const clutchScale = Number(this.placements.clutch.scale || 1);
    const throttleScale = Number(this.placements.throttle.scale || 1);
    const clutchRect = this.layout.clutch;
    const throttleRect = this.layout.throttle;
    const clutchBar = {
      x: clutchRect.right - 58 * clutchScale,
      y: clutchRect.y + 80 * clutchScale,
      w: 20 * clutchScale,
      h: 156 * clutchScale,
    };
    const throttleBar = {
      x: throttleRect.right - 67 * throttleScale,
      y: throttleRect.y + 81 * throttleScale,
      w: 21 * throttleScale,
      h: 165 * throttleScale,
    };

    g.fillStyle(0x48c9e8, 0.92)
      .fillRoundedRect(clutchBar.x, clutchBar.y + clutchBar.h * (1 - this.clutch), clutchBar.w, clutchBar.h * this.clutch, 3);
    g.fillStyle(0xe0b24e, 0.94)
      .fillRoundedRect(throttleBar.x, throttleBar.y + throttleBar.h * (1 - this.throttle), throttleBar.w, throttleBar.h * this.throttle, 3);

    g.lineStyle(2, 0x476272, 0.10).strokeRoundedRect(this.layout.clutch.x, this.layout.clutch.y, this.layout.clutch.width, this.layout.clutch.height, 18);
    g.lineStyle(2, 0x476272, 0.10).strokeRoundedRect(this.layout.throttle.x, this.layout.throttle.y, this.layout.throttle.width, this.layout.throttle.height, 18);
    g.lineStyle(2, 0x476272, 0.12).strokeRoundedRect(this.layout.shifter.x, this.layout.shifter.y, this.layout.shifter.width, this.layout.shifter.height, 18);

    if (shiftState === 'down') {
      this.shifterSprite.setTexture('shifterDown').setPosition(this.shifterX, this.shifterDownY).setScale(this.shifterScale);
    } else {
      this.shifterSprite.setTexture('shifterNeutral').setPosition(
        this.shifterX,
        shiftState === 'up' ? this.shifterUpY : this.shifterNeutralY
      ).setScale(this.shifterScale);
    }

    if (this.showNos) {
      this.nosSprite.setScale(this.nos ? this.nosScale * 0.965 : this.nosScale);
      this.nosSprite.setTint(this.nos ? 0xffffff : 0xe9eef1);
      this.nosSprite.setAlpha(this.nosEnabled ? 1 : 0.42);
    }
  }

  consumeGearRequest() {
    const request = this.pendingGearRequest;
    this.pendingGearRequest = null;
    return request;
  }

  snapshot() {
    return { throttle: this.throttle, clutch: this.clutch, nos: this.nos };
  }

  destroy() {
    try { this.scene.input.keyboard.off('keydown', this.onKeyDown); } catch (e) {}
    try { this.scene.input.keyboard.off('keyup', this.onKeyUp); } catch (e) {}
    try { this.scene.input.off('pointerdown', this.onPointerDown); } catch (e) {}
    try { this.scene.input.off('pointermove', this.onPointerMove); } catch (e) {}
    try { this.scene.input.off('pointerup', this.onPointerUp); } catch (e) {}
    [this.graphics, this.clutchSprite, this.nosSprite, this.shifterSprite, this.throttleSprite].forEach(obj => {
      try { obj?.destroy?.(); } catch (e) {}
    });
    this.keyboardDown.clear();
    this.controllerPrevious = {};
  }
}
