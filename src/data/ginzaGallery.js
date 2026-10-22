// Ginza: two independently cycling public showroom cars and one permanent vault.
// Pure helpers keep room pricing/order, endgame gating and variants testable.
export const GINZA_ROTATION_MS = 30 * 60 * 1000;
export const GINZA_VAULT_CARS = Object.freeze([
  { name: 'NISSAN R390 GT1', decal: 'calsonicR390', stock: 'cleanR390' },
  { name: 'TOYOTA GT-ONE TS020', decal: 'essoToyotaGtOne', stock: 'cleanToyotaGtOne' },
  { name: 'MAZDA 787B', decal: 'renownMazda787B', stock: 'cleanMazda787B' },
]);
export const GINZA_VAULT_IDS = new Set(GINZA_VAULT_CARS.flatMap(c => [c.decal, c.stock]));

export function getGinzaRoomStock(listings, now = Date.now(), offset = 0) {
  const pool = listings.filter(item => !GINZA_VAULT_IDS.has(item.carId))
    .sort((a, b) => a.price - b.price || a.carId.localeCompare(b.carId));
  if (!pool.length) return [null, null];
  // Split by actual price rank: Room 2 is always more expensive than Room 1.
  const split = Math.ceil(pool.length / 2);
  const lower = pool.slice(0, split);
  const higher = pool.slice(split);
  const cycle = Math.floor(Math.max(0, now) / GINZA_ROTATION_MS) + Math.floor(offset);
  return [lower[((cycle % lower.length) + lower.length) % lower.length],
    higher.length ? higher[((cycle % higher.length) + higher.length) % higher.length] : null];
}

export function getGinzaVaultCar(index, stock = false) {
  const car = GINZA_VAULT_CARS[Math.max(0, Math.min(2, Math.floor(Number(index) || 0)))];
  return car?.[stock ? 'stock' : 'decal'] || GINZA_VAULT_CARS[0].decal;
}

// Unlike developer access (which can also be granted by devMode or legacy
// cash), the special after-hours scene belongs to the Arkon Den profile alone.
export function isNamedArkonDen(source) {
  const get = name => typeof source?.get === 'function' ? source.get(name) : source?.[name];
  const fullName = (String(get('firstName') || '') + String(get('lastName') || ''))
    .toLowerCase().replace(/[^a-z0-9]/g, '');
  return fullName === 'arkonden' && get('gameMode') !== 'arkonStory';
}

export function isGinzaOwner(source) {
  const get = name => typeof source?.get === 'function' ? source.get(name) : source?.[name];
  const fullName = (String(get('firstName') || '') + String(get('lastName') || ''))
    .toLowerCase().replace(/[^a-z0-9]/g, '');
  if (get('gameMode') === 'arkonStory') return false;
  return Boolean(get('devMode')) || fullName === 'arkonden' ||
    Number(get('cash') || 0) >= 900000000;
}

export function ginzaVaultEligible(source, developer = false) {
  if (developer) return true;
  const read = name => typeof source?.get === 'function' ? source.get(name) : source?.[name];
  if (read('ginzaVaultInvited') === true) return true;
  const pro = read('proCircuit') || {};
  const won = c => c?.completed && c.championId === 'player:driver';
  return won(pro.activeChampionship) || (pro.championshipHistory || []).some(won);
}
