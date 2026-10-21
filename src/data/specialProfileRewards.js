// Client-side convenience gates for named developer and compensation profiles.
// This protects casual profile creation in the PWA; the PIN is not a server
// authentication secret and cannot resist someone modifying their local files.
export const ETHAN_COMPENSATION_YEN = 2_000_000;
export const ETHAN_GIFT_SAVE_KEY = 'ethanYuenCompensationR638';
export const ETHAN_GIFT_PENDING_KEY = 'ethanYuenCompensationDialoguePending';

export function joinedProfileName(firstName, lastName) {
  return (String(firstName || '') + String(lastName || ''))
    .toLowerCase().replace(/[^a-z0-9]/g, '');
}
export function isArkonName(firstName, lastName) {
  return joinedProfileName(firstName, lastName) === 'arkonden';
}
export function isEthanName(firstName, lastName) {
  return joinedProfileName(firstName, lastName) === 'ethanyuen';
}
export function validArkonCreationPin(firstName, lastName, pin) {
  return !isArkonName(firstName, lastName) ||
    (typeof pin === 'string' && /^\d{4}$/.test(pin) && pin === '1985');
}

// Grant before opening the manga; mark the save immediately so reloading the
// page during dialogue can never repeat the payment. Pending dialogue can
// safely be replayed until it is actually completed.
export function grantEthanCompensationOnce(registry) {
  if (!registry?.get || !registry?.set ||
      !isEthanName(registry.get('firstName'), registry.get('lastName')) ||
      registry.get(ETHAN_GIFT_SAVE_KEY)) return false;
  registry.set('cash', Math.max(0, Number(registry.get('cash')) || 0) + ETHAN_COMPENSATION_YEN);
  registry.set(ETHAN_GIFT_SAVE_KEY, true);
  registry.set(ETHAN_GIFT_PENDING_KEY, true);
  return true;
}

export function ethanCompensationCutscene() {
  return {
    id: 'ethanYuenCompensationR638Scene',
    once: false,
    title: 'A LITTLE SOMETHING OWED',
    category: 'ARKON DEN // SPECIAL DELIVERY',
    finalActionLabel: 'ACCEPT $2,000,000',
    characters: { left: 'arkonDen' },
    pages: [
      { speaker: 'left', leftCharacter: 'arkonDen', leftPose: 'devTalking',
        text: 'I heard you were cheated out of a car for some reason. Well you’re in luck! I’m feeling generous, so here’s what you’re owed.' },
      { speaker: 'left', leftCharacter: 'arkonDen', leftPose: 'devLaughing',
        text: '$2,000,000. Go find yourself something good, Ethan!' },
    ],
  };
}
