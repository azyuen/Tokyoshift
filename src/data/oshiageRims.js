// R501: Oshiage Custom Works owns the former Tokyo Auto Market wheel shop.
// The ownership and per-car customWheelId keys are unchanged for old profiles.
import { cars } from './cars.js';
import { getBaseCarId } from './carOwnership.js';
import { WHEEL_CATALOG, getOwnedWheelIds, getWheelOption } from './wheels.js';

// R506: the new Oshiage wheel-wall background has exactly eight EMPTY bays.
// Coordinates are normalised to the original artwork, not the Phaser viewport.
// This avoids shifting the rims when the art is contained to the stage.
// Cabinet 1 (left): four standard rims in a 2x2 grid.
// Cabinet 2 (middle): two tuner rims side by side.
// Cabinet 3 (right): two hero rims stacked vertically.
export const RIMS_DISPLAY_COUNT = 8;
export const RIMS_STANDARD_COUNT = 4;
export const RIMS_SPECIAL_COUNT = 4;
export const RIMS_REFRESH_MS = 3 * 60 * 60 * 1000;
export const OSHIAGE_RIM_SLOTS = Object.freeze([
  { section: 'standard', x: 0.192, y: 0.325, diameter: 66 },
  { section: 'standard', x: 0.283, y: 0.325, diameter: 66 },
  { section: 'standard', x: 0.192, y: 0.452, diameter: 66 },
  { section: 'standard', x: 0.283, y: 0.452, diameter: 66 },
  { section: 'special', x: 0.458, y: 0.493, diameter: 70 },
  { section: 'special', x: 0.545, y: 0.493, diameter: 70 },
  { section: 'special', x: 0.716, y: 0.356, diameter: 70 },
  { section: 'special', x: 0.716, y: 0.474, diameter: 70 },
]);

const read = (source, key, fallback) => {
  const result = source?.get ? source.get(key) : source?.[key];
  return result == null ? fallback : result;
};

function rotateItems(items, offset, count) {
  if (!items.length) return [];
  return Array.from({ length: Math.min(count, items.length) },
    (_, i) => items[(offset + i) % items.length]);
}

export function getOshiageRimListings(now = Date.now()) {
  const cycle = Math.floor(now / RIMS_REFRESH_MS);
  // The four standard designs are always visible on the LEFT.
  const standard = WHEEL_CATALOG.filter(rim => rim?.tier === 'STANDARD');
  // Two rotating tuner wheels fill the centre's horizontal double cabinet.
  const tuners = WHEEL_CATALOG.filter(rim => rim?.tier === 'TUNER');
  // Two rotating rare/hero wheels fill the far-right vertical double cabinet.
  const heroes = WHEEL_CATALOG.filter(rim => rim?.tier === 'HERO');
  return [
    ...rotateItems(standard, 0, RIMS_STANDARD_COUNT),
    ...rotateItems(tuners, cycle * 2, 2),
    ...rotateItems(heroes, cycle, 2),
  ];
}

export function getOshiageRimQuote(source, carId, rimId) {
  const id = String(carId || '');
  const owned = read(source, 'ownedCarIds', []) || [];
  const wheel = getWheelOption(rimId);
  const car = cars[id] || cars[getBaseCarId(id)];
  const state = (read(source, 'carStates', {}) || {})[id] || {};
  const cash = Math.max(0, Number(read(source, 'cash', 0) || 0));
  if (!owned.includes(id) || !car || !wheel) {
    return { status: 'NO_CAR', price: 0, locked: true, owned: false };
  }
  const locked = Boolean(car.tuningLocked || state.collector || state.immutable || state.tuningLocked || car.crewLoan || state.crewLoan);
  const rimOwned = getOwnedWheelIds(source).includes(wheel.id);
  const installed = state.customWheelId === wheel.id;
  const price = rimOwned ? 0 : Number(wheel.price || 0);
  const status = locked ? 'LOCKED'
    : installed ? 'INSTALLED'
      : rimOwned ? 'OWNED'
        : cash >= price ? 'BUY' : 'UNAFFORDABLE';
  return { status, price, locked, owned: rimOwned, installed, wheel };
}

export function buyOrInstallOshiageRim(registry, carId, rimId) {
  if (!registry?.set || !registry?.get) return { ok: false, reason: 'NO_REGISTRY' };
  const quote = getOshiageRimQuote(registry, carId, rimId);
  if (!['OWNED', 'BUY'].includes(quote.status)) return { ok: false, reason: quote.status };
  const id = String(carId || '');
  const original = registry.get('carStates') || {};
  const current = original[id] || {};
  const price = quote.price;
  const cash = Number(registry.get('cash') || 0);
  if (price > cash) return { ok: false, reason: 'UNAFFORDABLE' };
  const ownedWheelIds = getOwnedWheelIds(registry);
  if (!ownedWheelIds.includes(rimId)) {
    registry.set('ownedWheelIds', [...ownedWheelIds, rimId]);
  }
  registry.set('carStates', {
    ...original,
    [id]: { ...current, customWheelId: rimId },
  });
  if (price > 0) registry.set('cash', cash - price);
  return { ok: true, spent: price, rimId, installedOn: id, purchased: price > 0 };
}

export function restoreStockOshiageRims(registry, carId) {
  if (!registry?.set || !registry?.get) return false;
  const id = String(carId || '');
  const owned = registry.get('ownedCarIds') || [];
  const car = cars[id] || cars[getBaseCarId(id)];
  const original = registry.get('carStates') || {};
  const state = original[id] || {};
  if (!owned.includes(id) || !car || car.tuningLocked || car.crewLoan ||
      state.tuningLocked || state.crewLoan || state.collector || state.immutable ||
      !state.customWheelId) return false;
  const { customWheelId: _previousWheel, ...withoutRims } = state;
  registry.set('carStates', { ...original, [id]: withoutRims });
  return true;
}
