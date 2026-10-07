const STORAGE_KEY = 'tokyoShiftControlsV1';

export const CONTROL_REFERENCE = Object.freeze({ width: 1560, height: 720 });

export const CONTROL_LAYOUT_DEFAULTS = Object.freeze({
  hud: Object.freeze({ x: 780, y: 675, scale: 1 }),
  clutch: Object.freeze({ x: 175, y: 545, scale: 1 }),
  nos: Object.freeze({ x: 378, y: 570, scale: 1 }),
  shifter: Object.freeze({ x: 1218, y: 535, scale: 1 }),
  throttle: Object.freeze({ x: 1405, y: 545, scale: 1 }),
});

export const TOUCH_COMPONENTS = Object.freeze([
  { id: 'hud', label: 'DASH' },
  { id: 'clutch', label: 'CLUTCH' },
  { id: 'nos', label: 'NOS' },
  { id: 'shifter', label: 'SHIFTER' },
  { id: 'throttle', label: 'THROTTLE' },
]);

export const CONTROL_ACTIONS = Object.freeze([
  { id: 'throttle', label: 'THROTTLE', analog: true },
  { id: 'clutch', label: 'CLUTCH', analog: true },
  { id: 'nos', label: 'NOS', analog: false },
  { id: 'shiftUp', label: 'SHIFT UP', analog: false },
  { id: 'shiftDown', label: 'SHIFT DOWN', analog: false },
  { id: 'gear1', label: 'GEAR 1', analog: false },
  { id: 'gear2', label: 'GEAR 2', analog: false },
  { id: 'gear3', label: 'GEAR 3', analog: false },
  { id: 'gear4', label: 'GEAR 4', analog: false },
  { id: 'gear5', label: 'GEAR 5', analog: false },
  { id: 'gear6', label: 'GEAR 6', analog: false },
]);

const DEFAULT_SETTINGS = Object.freeze({
  version: 1,
  layout: {
    hud: { dx: 0, dy: 0, scale: 1 },
    clutch: { dx: 0, dy: 0, scale: 1 },
    nos: { dx: 0, dy: 0, scale: 1 },
    shifter: { dx: 0, dy: 0, scale: 1 },
    throttle: { dx: 0, dy: 0, scale: 1 },
  },
  keyboard: {
    throttle: ['KeyW', 'ArrowUp'],
    clutch: ['KeyC'],
    nos: ['Space'],
    shiftUp: ['KeyE'],
    shiftDown: ['KeyQ'],
    gear1: ['Digit1'],
    gear2: ['Digit2'],
    gear3: ['Digit3'],
    gear4: ['Digit4'],
    gear5: ['Digit5'],
    gear6: ['Digit6'],
  },
  controller: {
    throttle: { kind: 'button', index: 7 },
    clutch: { kind: 'button', index: 6 },
    nos: { kind: 'button', index: 0 },
    shiftUp: { kind: 'button', index: 5 },
    shiftDown: { kind: 'button', index: 4 },
    gear1: null,
    gear2: null,
    gear3: null,
    gear4: null,
    gear5: null,
    gear6: null,
  },
});

const clone = value => JSON.parse(JSON.stringify(value));

function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.max(min, Math.min(max, number))
    : fallback;
}

function sanitiseLayout(raw = {}) {
  const next = {};
  TOUCH_COMPONENTS.forEach(({ id }) => {
    const source = raw?.[id] || {};
    next[id] = {
      dx: clamp(source.dx, -1200, 1200, 0),
      dy: clamp(source.dy, -650, 650, 0),
      scale: clamp(source.scale, 0.55, 1.65, 1),
    };
  });
  return next;
}

function sanitiseKeyboard(raw = {}) {
  const next = {};
  CONTROL_ACTIONS.forEach(({ id }) => {
    const fallback = DEFAULT_SETTINGS.keyboard[id] || [];
    const candidate = Array.isArray(raw?.[id])
      ? raw[id].map(value => String(value || '').trim()).filter(Boolean).slice(0, 3)
      : [];
    next[id] = candidate.length ? candidate : [...fallback];
  });
  return next;
}

function sanitiseControllerBinding(binding) {
  if (!binding || typeof binding !== 'object') return null;
  if (binding.kind === 'button') {
    const index = Math.floor(Number(binding.index));
    if (!Number.isFinite(index) || index < 0 || index > 63) return null;
    return { kind: 'button', index };
  }
  if (binding.kind === 'axis') {
    const index = Math.floor(Number(binding.index));
    if (!Number.isFinite(index) || index < 0 || index > 31) return null;
    return {
      kind: 'axis',
      index,
      direction: Number(binding.direction) < 0 ? -1 : 1,
      deadzone: clamp(binding.deadzone, 0, 0.75, 0.18),
    };
  }
  return null;
}

function sanitiseController(raw = {}) {
  const next = {};
  CONTROL_ACTIONS.forEach(({ id }) => {
    const hasValue = Object.prototype.hasOwnProperty.call(raw || {}, id);
    next[id] = hasValue
      ? sanitiseControllerBinding(raw[id])
      : sanitiseControllerBinding(DEFAULT_SETTINGS.controller[id]);
  });
  return next;
}

function sanitise(raw = {}) {
  return {
    version: 1,
    layout: sanitiseLayout(raw.layout),
    keyboard: sanitiseKeyboard(raw.keyboard),
    controller: sanitiseController(raw.controller),
  };
}

export function getDefaultControlSettings() {
  return clone(DEFAULT_SETTINGS);
}

export function getControlSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultControlSettings();
    return sanitise(JSON.parse(raw));
  } catch (e) {
    return getDefaultControlSettings();
  }
}

export function setControlSettings(settings) {
  const next = sanitise(settings || {});
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('tokyoShiftControlSettingsChanged', {
      detail: clone(next),
    }));
  } catch (e) {}
  return next;
}

export function updateControlSettings(mutator) {
  const current = getControlSettings();
  const draft = clone(current);
  const result = typeof mutator === 'function' ? (mutator(draft) || draft) : draft;
  return setControlSettings(result);
}

export function resetControlSettings(section = 'all') {
  const defaults = getDefaultControlSettings();
  if (section === 'all') return setControlSettings(defaults);
  return updateControlSettings(settings => {
    if (section === 'layout') settings.layout = clone(defaults.layout);
    if (section === 'keyboard') settings.keyboard = clone(defaults.keyboard);
    if (section === 'controller') settings.controller = clone(defaults.controller);
    return settings;
  });
}

export function getLayoutPlacement(id, settings = getControlSettings()) {
  const base = CONTROL_LAYOUT_DEFAULTS[id] || { x: 0, y: 0, scale: 1 };
  const saved = settings?.layout?.[id] || {};
  return {
    x: Number(base.x || 0) + Number(saved.dx || 0),
    y: Number(base.y || 0) + Number(saved.dy || 0),
    scale: Number(base.scale || 1) * Number(saved.scale || 1),
  };
}

const KEY_LABELS = Object.freeze({
  Space: 'SPACE',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Escape: 'ESC',
  Enter: 'ENTER',
  Backspace: 'BACKSPACE',
  Tab: 'TAB',
});

export function keyboardCodeLabel(code = '') {
  const raw = String(code || '');
  if (KEY_LABELS[raw]) return KEY_LABELS[raw];
  if (raw.startsWith('Key')) return raw.slice(3).toUpperCase();
  if (raw.startsWith('Digit')) return raw.slice(5);
  if (raw.startsWith('Numpad')) return 'NUM ' + raw.slice(6);
  return raw.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase() || 'UNBOUND';
}

export function keyboardBindingLabel(binding) {
  const list = Array.isArray(binding) ? binding : [];
  return list.length ? list.map(keyboardCodeLabel).join(' / ') : 'UNBOUND';
}

const STANDARD_BUTTON_NAMES = Object.freeze({
  0: 'A / CROSS',
  1: 'B / CIRCLE',
  2: 'X / SQUARE',
  3: 'Y / TRIANGLE',
  4: 'LB / L1',
  5: 'RB / R1',
  6: 'LT / L2',
  7: 'RT / R2',
  8: 'VIEW / SHARE',
  9: 'MENU / OPTIONS',
  10: 'L3',
  11: 'R3',
  12: 'D-PAD UP',
  13: 'D-PAD DOWN',
  14: 'D-PAD LEFT',
  15: 'D-PAD RIGHT',
  16: 'HOME',
});

export function controllerBindingLabel(binding) {
  if (!binding) return 'UNBOUND';
  if (binding.kind === 'button') {
    return STANDARD_BUTTON_NAMES[binding.index] || ('BUTTON ' + binding.index);
  }
  if (binding.kind === 'axis') {
    return 'AXIS ' + binding.index + (Number(binding.direction) < 0 ? ' −' : ' +');
  }
  return 'UNBOUND';
}

export function getConnectedGamepads() {
  try {
    if (!navigator.getGamepads) return [];
    return Array.from(navigator.getGamepads() || []).filter(Boolean);
  } catch (e) {
    return [];
  }
}
