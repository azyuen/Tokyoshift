// One booking buys THREE total runs: the initial run and TWO retries.
// All runs belong to a single uninterrupted visit; leaving forfeits the rest.
export const OSHIAGE_SCHOOL_RETRIES = 2;
export const OSHIAGE_SCHOOL_MAX_ATTEMPTS = 1 + OSHIAGE_SCHOOL_RETRIES;
export const OSHIAGE_SCHOOL_LESSONS = Object.freeze({
  basic: Object.freeze({ id: 'basic', fee: 0, title: 'BASIC DRIVING', pose: 'explaining',
    speech: 'Haven’t we done this before? Oh wait! Ahem, I can teach you the basics for the first time…' }),
  launch: Object.freeze({ id: 'launch', fee: 5000, title: 'LAUNCH CONTROL', pose: 'concerned',
    speech: 'But why are you trying to rush away from the lights so quickly? I’m sure your parents wouldn’t approve…' }),
  standing: Object.freeze({ id: 'standing', fee: 10000, title: 'STANDING SHIFTING', pose: 'explaining',
    speech: 'I’ll teach you the secrets of racing… I mean… efficient gear changing. Very ordinary driving-school business.' }),
  rolling: Object.freeze({ id: 'rolling', fee: 15000, title: 'ROLLING SHIFTING', pose: 'neutral',
    speech: 'You’ll learn how to make the most of your car’s speed. But please don’t try this just anywhere! Drive safely!' }),
});
export const schoolFee = id => OSHIAGE_SCHOOL_LESSONS[id]?.fee ?? null;
export const OSHIAGE_VOUCHER_LESSONS = Object.freeze(['launch', 'standing', 'rolling']);
// One complimentary first booking for each advanced lesson (three runs total).
// Existing players' completed lessons count as already tried; no paid bookings are reset.
export function isOshiageVoucherAvailable(source, lessonId) {
  if (!OSHIAGE_VOUCHER_LESSONS.includes(lessonId)) return false;
  const read = key => typeof source?.get === 'function' ? source.get(key) : source?.[key];
  // No automatic per-type freebies in Story Mode. Five actual lesson credits
  // are earned ONLY by winning the regional challenge set by Sayaka.
  if (read('gameMode')==='arkonStory')
    return Number(read('arkonStoryLessonCredits')||0)>0;
  if (read('oshiageFreeLessonUsed')?.[lessonId]) return false;
  const previous = read('oshiageCoachingProgress') || {};
  return !Object.values(previous).some(carLessons => Boolean(carLessons?.[lessonId]?.completed));
}
export function getOshiageVouchersRemaining(source) {
  return OSHIAGE_VOUCHER_LESSONS.filter(id => isOshiageVoucherAvailable(source, id)).length;
}
export const remainingAttempts = booking => Math.max(0,
  OSHIAGE_SCHOOL_MAX_ATTEMPTS - Math.max(0, Math.floor(Number(booking?.attemptsUsed || 0))));
export function bookingMatches(booking, carId, lessonId) {
  return lessonId !== 'basic' && Boolean(booking &&
    booking.carId === carId && booking.lessonId === lessonId &&
    remainingAttempts(booking) > 0);
}
export function bookOshiageLesson({ booking, carId, lessonId, cash, freeFirstLesson = false }) {
  const lesson = OSHIAGE_SCHOOL_LESSONS[lessonId];
  const available = Math.max(0, Number(cash) || 0);
  if (!lesson || !carId) return { ok: false, reason: 'INVALID LESSON' };
  if (lessonId === 'basic') return { ok: true, cash: available, booking: null, charged: 0 };
  if (bookingMatches(booking, carId, lessonId)) {
    return { ok: true, cash: available, booking, charged: 0 };
  }
  const useVoucher = Boolean(freeFirstLesson && OSHIAGE_VOUCHER_LESSONS.includes(lessonId));
  const fee = useVoucher ? 0 : lesson.fee;
  if (available < fee) return { ok: false, reason: 'NOT ENOUGH YEN', fee };
  return { ok: true, cash: available - fee, charged: fee, usedVoucher: useVoucher,
    booking: { carId, lessonId, fee, attemptsUsed: 0 } };
}
export function consumeOshiageAttempt(booking) {
  if (!booking || remainingAttempts(booking) <= 0) return null;
  return { ...booking, attemptsUsed: booking.attemptsUsed + 1 };
}
