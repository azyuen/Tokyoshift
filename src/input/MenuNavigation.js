const SKIP_SCENES = new Set([
  'RaceScene',
  'DynoScene',
  'WheelCalibrationScene',
]);

const SELECT_KEYS = new Set(['Enter', 'Space', 'KeyX']);
const DIRECTIONS = Object.freeze({
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
});

function activeTextInput() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = String(el.tagName || '').toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || Boolean(el.isContentEditable);
}

function objectVisible(obj) {
  if (!obj || obj.active === false || obj.visible === false || Number(obj.alpha ?? 1) <= 0.02) {
    return false;
  }

  let parent = obj.parentContainer;
  while (parent) {
    if (parent.active === false || parent.visible === false || Number(parent.alpha ?? 1) <= 0.02) {
      return false;
    }
    parent = parent.parentContainer;
  }
  return true;
}

function safeBounds(obj) {
  try {
    const b = obj?.getBounds?.();
    if (!b || !Number.isFinite(b.x) || !Number.isFinite(b.y)) return null;
    if (!(b.width > 2) || !(b.height > 2)) return null;
    return {
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      left: b.left ?? b.x,
      right: b.right ?? (b.x + b.width),
      top: b.top ?? b.y,
      bottom: b.bottom ?? (b.y + b.height),
      centerX: b.centerX ?? (b.x + b.width / 2),
      centerY: b.centerY ?? (b.y + b.height / 2),
    };
  } catch (e) {
    return null;
  }
}

function objectDepth(obj) {
  let depth = Number(obj?.depth || 0);
  let parent = obj?.parentContainer;
  while (parent) {
    depth += Number(parent.depth || 0);
    parent = parent.parentContainer;
  }
  return depth;
}

function uniqueObjects(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export default class MenuNavigation {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.focused = null;
    this.focusGraphics = null;
    this.lastSceneKey = '';
    this.destroyed = false;

    this.padState = {
      up: false,
      down: false,
      left: false,
      right: false,
      select: false,
    };
    this.padRepeatAt = {
      up: 0,
      down: 0,
      left: 0,
      right: 0,
    };

    this.onKeyDown = event => {
      if (this.destroyed || event.repeat || activeTextInput()) return;
      const scene = this.getActiveScene();
      if (!scene || this.isSuppressed(scene)) return;

      const direction = DIRECTIONS[event.code];
      if (direction) {
        event.preventDefault();
        this.navigate(direction, scene);
        return;
      }

      if (SELECT_KEYS.has(event.code)) {
        event.preventDefault();
        this.activate(scene);
      }
    };

    this.onPointerUse = () => {
      this.clearFocus();
    };

    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('pointerdown', this.onPointerUse, true);

    this.tick = this.tick.bind(this);
    this.raf = window.requestAnimationFrame(this.tick);
  }

  getActiveScene() {
    try {
      const active = this.game?.scene?.getScenes?.(true) || [];
      if (!active.length) return null;

      // Scene Manager returns active scenes in display/update order. Prefer the
      // last input-enabled scene, which is normally the visible modal/top scene.
      for (let i = active.length - 1; i >= 0; i--) {
        const scene = active[i];
        if (scene?.input?.enabled !== false && scene?.sys?.isActive?.()) return scene;
      }
      return active[active.length - 1] || null;
    } catch (e) {
      return null;
    }
  }

  isSuppressed(scene) {
    const key = String(scene?.sys?.settings?.key || '');
    return (
      SKIP_SCENES.has(key) ||
      Boolean(scene?._menuNavigationCaptureInput) ||
      activeTextInput()
    );
  }

  getInteractiveObjects(scene) {
    if (!scene?.input) return [];

    const listed = Array.isArray(scene.input._list) ? scene.input._list : [];
    const childFallback = Array.isArray(scene.children?.list)
      ? scene.children.list.filter(obj => obj?.input?.enabled)
      : [];
    const all = uniqueObjects([...listed, ...childFallback])
      .filter(obj =>
        obj?.input?.enabled !== false &&
        objectVisible(obj) &&
        !obj.input?.draggable
      )
      .map(obj => ({ obj, bounds: safeBounds(obj), depth: objectDepth(obj) }))
      .filter(item => item.bounds);

    if (!all.length) return [];

    const width = Math.max(1, Number(scene.scale?.width || scene.cameras?.main?.width || 1560));
    const height = Math.max(1, Number(scene.scale?.height || scene.cameras?.main?.height || 840));
    const viewportArea = width * height;

    // Full-screen interactive rectangles are commonly modal click-catchers.
    // Use the highest one as a depth floor, but do not normally focus it.
    const blockers = all.filter(item =>
      item.bounds.width * item.bounds.height >= viewportArea * 0.48
    );
    const modalDepth = blockers.length
      ? Math.max(...blockers.map(item => item.depth))
      : -Infinity;

    const inFront = all.filter(item => item.depth >= modalDepth - 0.01);
    let focusable = inFront.filter(item =>
      item.bounds.width * item.bounds.height < viewportArea * 0.42
    );

    // "Tap anywhere" screens may intentionally have only one large target.
    if (!focusable.length && inFront.length) {
      focusable = [...inFront].sort(
        (a, b) =>
          (a.bounds.width * a.bounds.height) -
          (b.bounds.width * b.bounds.height)
      ).slice(0, 1);
    }

    return focusable;
  }

  ensureScene(scene) {
    const key = String(scene?.sys?.settings?.key || '');
    if (scene !== this.scene || key !== this.lastSceneKey) {
      this.clearFocus();
      this.scene = scene;
      this.lastSceneKey = key;
    }
  }

  setFocus(scene, item) {
    if (!item?.obj) return;

    if (this.focused?.obj && this.focused.obj !== item.obj) {
      try {
        this.focused.obj.emit(
          'pointerout',
          scene.input?.activePointer,
          { stopPropagation() {} }
        );
      } catch (e) {}
    }

    this.focused = item;

    try {
      item.obj.emit(
        'pointerover',
        scene.input?.activePointer,
        0,
        0,
        { stopPropagation() {} }
      );
    } catch (e) {}

    this.drawFocus(scene);
  }

  clearFocus() {
    if (this.focused?.obj && this.scene) {
      try {
        this.focused.obj.emit(
          'pointerout',
          this.scene.input?.activePointer,
          { stopPropagation() {} }
        );
      } catch (e) {}
    }
    this.focused = null;
    try { this.focusGraphics?.destroy?.(); } catch (e) {}
    this.focusGraphics = null;
  }

  drawFocus(scene) {
    const item = this.focused;
    if (!item?.obj || !objectVisible(item.obj)) {
      this.clearFocus();
      return;
    }

    const b = safeBounds(item.obj);
    if (!b) {
      this.clearFocus();
      return;
    }
    item.bounds = b;

    const objects = this.getInteractiveObjects(scene);
    const maxDepth = objects.length
      ? Math.max(...objects.map(candidate => candidate.depth))
      : objectDepth(item.obj);

    if (!this.focusGraphics || this.focusGraphics.scene !== scene) {
      try { this.focusGraphics?.destroy?.(); } catch (e) {}
      this.focusGraphics = scene.add.graphics().setScrollFactor(0);
    }

    const g = this.focusGraphics;
    g.setDepth(maxDepth + 1000);
    g.clear();
    g.fillStyle(0x43dfff, 0.045)
      .fillRoundedRect(b.x - 7, b.y - 7, b.width + 14, b.height + 14, 8);
    g.lineStyle(3, 0x63e8ff, 0.98)
      .strokeRoundedRect(b.x - 7, b.y - 7, b.width + 14, b.height + 14, 8);

    const corner = 12;
    g.lineStyle(4, 0xffffff, 0.92);
    g.lineBetween(b.x - 9, b.y - 9, b.x - 9 + corner, b.y - 9);
    g.lineBetween(b.x - 9, b.y - 9, b.x - 9, b.y - 9 + corner);
    g.lineBetween(b.right + 9, b.y - 9, b.right + 9 - corner, b.y - 9);
    g.lineBetween(b.right + 9, b.y - 9, b.right + 9, b.y - 9 + corner);
    g.lineBetween(b.x - 9, b.bottom + 9, b.x - 9 + corner, b.bottom + 9);
    g.lineBetween(b.x - 9, b.bottom + 9, b.x - 9, b.bottom + 9 - corner);
    g.lineBetween(b.right + 9, b.bottom + 9, b.right + 9 - corner, b.bottom + 9);
    g.lineBetween(b.right + 9, b.bottom + 9, b.right + 9, b.bottom + 9 - corner);
  }

  pickInitial(items, direction) {
    if (!items.length) return null;
    const sorted = [...items];

    if (direction === 'up') {
      sorted.sort((a, b) => b.bounds.centerY - a.bounds.centerY || a.bounds.centerX - b.bounds.centerX);
    } else if (direction === 'left') {
      sorted.sort((a, b) => b.bounds.centerX - a.bounds.centerX || a.bounds.centerY - b.bounds.centerY);
    } else if (direction === 'right') {
      sorted.sort((a, b) => a.bounds.centerX - b.bounds.centerX || a.bounds.centerY - b.bounds.centerY);
    } else {
      sorted.sort((a, b) => a.bounds.centerY - b.bounds.centerY || a.bounds.centerX - b.bounds.centerX);
    }
    return sorted[0];
  }

  navigate(direction, scene = this.getActiveScene()) {
    if (!scene || this.isSuppressed(scene)) return;
    this.ensureScene(scene);

    const items = this.getInteractiveObjects(scene);
    if (!items.length) {
      this.clearFocus();
      return;
    }

    const currentIndex = this.focused?.obj
      ? items.findIndex(item => item.obj === this.focused.obj)
      : -1;

    if (currentIndex < 0) {
      this.setFocus(scene, this.pickInitial(items, direction));
      return;
    }

    const current = items[currentIndex];
    const cx = current.bounds.centerX;
    const cy = current.bounds.centerY;

    const candidates = items
      .filter(item => item.obj !== current.obj)
      .map(item => {
        const dx = item.bounds.centerX - cx;
        const dy = item.bounds.centerY - cy;
        let primary = 0;
        let cross = 0;
        let valid = false;

        if (direction === 'right') {
          valid = dx > 4;
          primary = dx;
          cross = Math.abs(dy);
        } else if (direction === 'left') {
          valid = dx < -4;
          primary = -dx;
          cross = Math.abs(dy);
        } else if (direction === 'down') {
          valid = dy > 4;
          primary = dy;
          cross = Math.abs(dx);
        } else {
          valid = dy < -4;
          primary = -dy;
          cross = Math.abs(dx);
        }

        const distance = Math.hypot(dx, dy);
        return {
          ...item,
          valid,
          score: primary + cross * 2.15 + distance * 0.08,
        };
      })
      .filter(item => item.valid)
      .sort((a, b) => a.score - b.score);

    if (candidates.length) {
      this.setFocus(scene, candidates[0]);
      return;
    }

    // Wrap cleanly at menu edges.
    this.setFocus(scene, this.pickInitial(items, direction));
  }

  activate(scene = this.getActiveScene()) {
    if (!scene || this.isSuppressed(scene)) return;
    this.ensureScene(scene);

    const items = this.getInteractiveObjects(scene);
    if (!items.length) return;

    let item = this.focused?.obj
      ? items.find(candidate => candidate.obj === this.focused.obj)
      : null;

    if (!item) {
      item = this.pickInitial(items, 'down');
      this.setFocus(scene, item);
      return;
    }

    const obj = item.obj;
    const b = safeBounds(obj);
    if (!b) return;

    const activePointer = scene.input?.activePointer;
    const pointer = activePointer
      ? Object.create(activePointer)
      : {};
    pointer.x = b.centerX;
    pointer.y = b.centerY;
    pointer.worldX = b.centerX;
    pointer.worldY = b.centerY;

    const event = {
      stopPropagation() {},
      stopImmediatePropagation() {},
      preventDefault() {},
    };

    try {
      obj.emit('pointerdown', pointer, b.width / 2, b.height / 2, event);
    } catch (e) {}

    if (obj?.active !== false) {
      try {
        obj.emit('pointerup', pointer, b.width / 2, b.height / 2, event);
      } catch (e) {}
    }

    // Scene/modal may have changed as a result of activation.
    window.setTimeout(() => {
      if (!this.destroyed) {
        const nextScene = this.getActiveScene();
        if (nextScene) {
          this.ensureScene(nextScene);
          if (this.focused) this.drawFocus(nextScene);
        }
      }
    }, 0);
  }

  readGamepad() {
    try {
      const pads = navigator.getGamepads?.() || [];
      return Array.from(pads).find(Boolean) || null;
    } catch (e) {
      return null;
    }
  }

  tick(now = performance.now()) {
    if (this.destroyed) return;

    const scene = this.getActiveScene();
    if (scene) this.ensureScene(scene);

    if (scene && !this.isSuppressed(scene)) {
      const pad = this.readGamepad();
      if (pad) {
        const axisX = Number(pad.axes?.[0] || 0);
        const axisY = Number(pad.axes?.[1] || 0);
        const states = {
          up: Boolean(pad.buttons?.[12]?.pressed) || axisY < -0.58,
          down: Boolean(pad.buttons?.[13]?.pressed) || axisY > 0.58,
          left: Boolean(pad.buttons?.[14]?.pressed) || axisX < -0.58,
          right: Boolean(pad.buttons?.[15]?.pressed) || axisX > 0.58,
          // Standard button 0 = A/Cross. Button 2 = X/Square, so either
          // common "X" interpretation can confirm a selection.
          select: Boolean(pad.buttons?.[0]?.pressed) || Boolean(pad.buttons?.[2]?.pressed),
        };

        ['up', 'down', 'left', 'right'].forEach(direction => {
          const down = states[direction];
          const wasDown = this.padState[direction];
          if (down && !wasDown) {
            this.navigate(direction, scene);
            this.padRepeatAt[direction] = now + 360;
          } else if (down && wasDown && now >= this.padRepeatAt[direction]) {
            this.navigate(direction, scene);
            this.padRepeatAt[direction] = now + 145;
          }
          this.padState[direction] = down;
        });

        if (states.select && !this.padState.select) {
          this.activate(scene);
        }
        this.padState.select = states.select;
      } else {
        Object.keys(this.padState).forEach(key => { this.padState[key] = false; });
      }

      if (this.focused) this.drawFocus(scene);
    } else {
      this.clearFocus();
    }

    this.raf = window.requestAnimationFrame(this.tick);
  }

  destroy() {
    this.destroyed = true;
    try { window.cancelAnimationFrame(this.raf); } catch (e) {}
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('pointerdown', this.onPointerUse, true);
    this.clearFocus();
  }
}
