import { cars, carOrder } from './cars.js?v=20260928-r232';
import { CAR_COUPON_REQUIREMENTS, getCarCouponRequirement, getCarCouponCount } from './centralTokyo.js?v=20260929-r272';
import { WHEEL_CATALOG } from './wheels.js?v=20260929-r246';

function sourceValue(source, key, fallback = null) {
  if (source && typeof source.get === 'function') {
    const value = source.get(key);
    return value == null ? fallback : value;
  }
  const value = source?.[key];
  return value == null ? fallback : value;
}

function choose(list = [], random = Math.random) {
  if (!list.length) return null;
  return list[Math.min(list.length - 1, Math.floor(random() * list.length))];
}

export function maybeAwardSurpriseReward(registry, { playerWon = false, random = Math.random } = {}) {
  if (!registry?.get || !registry?.set || !playerWon) return null;

  const wins = Math.max(0, Number(registry.get('wins') || 0));
  const raw = registry.get('surpriseRewardState') || {};
  const state = {
    winsSinceReward: Math.max(0, Number(raw.winsSinceReward || 0)) + 1,
    total: Math.max(0, Number(raw.total || 0)),
    lastAtWin: Math.max(0, Number(raw.lastAtWin || 0)),
  };

  const minimumGap = 4;
  const guaranteedBy = 18;
  const eligible = state.winsSinceReward >= minimumGap;
  const chance = Math.min(0.22, 0.045 + Math.max(0, state.winsSinceReward - minimumGap) * 0.012);
  const triggered = eligible && (state.winsSinceReward >= guaranteedBy || random() < chance);

  if (!triggered) {
    registry.set('surpriseRewardState', state);
    return null;
  }

  const ownedCars = new Set((registry.get('ownedCarIds') || []).map(String));
  const couponCandidates = carOrder.filter(carId => {
    if (!cars[carId] || !CAR_COUPON_REQUIREMENTS[carId]) return false;
    return getCarCouponCount(registry, carId) < getCarCouponRequirement(carId);
  });
  const preferredCoupons = couponCandidates.filter(carId => !ownedCars.has(carId));
  const ownedWheels = new Set((registry.get('ownedWheelIds') || []).map(String));
  const wheelCandidates = WHEEL_CATALOG.filter(
    wheel => wheel.tier === 'STANDARD' && !ownedWheels.has(wheel.id)
  );

  let reward = null;
  const roll = random();

  if (wheelCandidates.length && roll < 0.20) {
    const wheel = choose(wheelCandidates, random);
    registry.set('ownedWheelIds', [...ownedWheels, wheel.id]);
    reward = {
      type: 'WHEEL',
      id: wheel.id,
      label: wheel.label,
    };
  } else {
    const carId = choose(preferredCoupons.length ? preferredCoupons : couponCandidates, random);
    if (carId) {
      const coupons = { ...(registry.get('carCoupons') || {}) };
      const count = Math.max(0, Number(coupons[carId] || 0)) + 1;
      coupons[carId] = count;
      registry.set('carCoupons', coupons);
      reward = {
        type: 'COUPON',
        carId,
        label: cars[carId]?.shortName || carId.toUpperCase(),
        count,
        required: getCarCouponRequirement(carId),
      };
    } else if (wheelCandidates.length) {
      const wheel = choose(wheelCandidates, random);
      registry.set('ownedWheelIds', [...ownedWheels, wheel.id]);
      reward = {
        type: 'WHEEL',
        id: wheel.id,
        label: wheel.label,
      };
    }
  }

  if (!reward) {
    registry.set('surpriseRewardState', state);
    return null;
  }

  registry.set('surpriseRewardState', {
    winsSinceReward: 0,
    total: state.total + 1,
    lastAtWin: wins,
  });
  return reward;
}

export function normaliseSurpriseRewardState(source) {
  const raw = sourceValue(source, 'surpriseRewardState', {}) || {};
  return {
    winsSinceReward: Math.max(0, Math.floor(Number(raw.winsSinceReward || 0))),
    total: Math.max(0, Math.floor(Number(raw.total || 0))),
    lastAtWin: Math.max(0, Math.floor(Number(raw.lastAtWin || 0))),
  };
}
