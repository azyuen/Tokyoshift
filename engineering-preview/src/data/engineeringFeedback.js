// Explain existing engineering constraints; never modify hardware or output.
export function boostSupportMessage(car, tuning = {}) {
  const limiting = car?.engineering?.limitingHardware;
  const part = {'engine internals':'engine','fuel / ECU':'ecu','charge cooling':'intercooler'}[limiting];
  if (!part) return 'INCLUDES ALL INSTALLED TUNING';
  return Number(tuning[part] || 0) >= 3
    ? 'BOOST LIMITED: ' + limiting.toUpperCase() + ' AT MAX LEVEL'
    : 'BOOST LIMITED: upgrade ' + limiting.toUpperCase();
}
