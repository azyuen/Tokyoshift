// Player-facing identity is distinct from the persistent developer login.
// Never change firstName/lastName, character IDs or save keys for this purpose.
export const DEV_LOGIN_NAME = 'Arkon Den';
export const ARUKEN_CHARACTER_ID = 'arkonDen';
export const ARUKEN_CHARACTER_NAME = 'Aruken Denzaki';

export function getInGamePlayerDisplayName(source) {
  const value = key => typeof source?.get === 'function'
    ? source.get(key) : source?.[key];
  if (value('playerCharacterId') === ARUKEN_CHARACTER_ID)
    return ARUKEN_CHARACTER_NAME;
  return [String(value('firstName') || '').trim(),
    String(value('lastName') || '').trim()].filter(Boolean).join(' ') || 'PLAYER';
}
