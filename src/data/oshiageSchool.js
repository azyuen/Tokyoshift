// One booking includes an initial attempt and THREE retries. Fees are paid
// once at confirmation, not on individual retries.
export const OSHIAGE_SCHOOL_RETRIES = 3;
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
export const remainingAttempts = booking => Math.max(0,
  OSHIAGE_SCHOOL_MAX_ATTEMPTS - Math.max(0, Math.floor(Number(booking?.attemptsUsed || 0))));
export function bookingMatches(booking, carId, lessonId) {
  return lessonId !== 'basic' && Boolean(booking &&
    booking.carId === carId && booking.lessonId === lessonId &&
    remainingAttempts(booking) > 0);
}
export function bookOshiageLesson({ booking, carId, lessonId, cash }) {
  const lesson = OSHIAGE_SCHOOL_LESSONS[lessonId];
  const available = Math.max(0, Number(cash) || 0);
  if (!lesson || !carId) return { ok: false, reason: 'INVALID LESSON' };
  if (lessonId === 'basic') return { ok: true, cash: available, booking: null, charged: 0 };
  if (bookingMatches(booking, carId, lessonId)) {
    return { ok: true, cash: available, booking, charged: 0 };
  }
  if (available < lesson.fee) return { ok: false, reason: 'NOT ENOUGH YEN', fee: lesson.fee };
  return { ok: true, cash: available - lesson.fee, charged: lesson.fee,
    booking: { carId, lessonId, fee: lesson.fee, attemptsUsed: 0 } };
}
export function consumeOshiageAttempt(booking) {
  if (!booking || remainingAttempts(booking) <= 0) return null;
  return { ...booking, attemptsUsed: booking.attemptsUsed + 1 };
}
