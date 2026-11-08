// Runtime manga dialogue for voluntary tuner purchases. These are not one-time
// story milestones: cancelling or skipping never changes a player's save.
const money = amount => '¥ ' + Math.max(0, Math.round(Number(amount) || 0)).toLocaleString('en-US');

const VOICES = Object.freeze({
  odaibaEsprit: {
    opener: 'Give me a minute to look it over. We can make the changes properly.',
    close: 'We can check the result on the next run.',
  },
  shinagawaZeroSports: {
    opener: 'Bonnet up. Here is what I would change.',
    close: 'Clear cost, clear result. Your call.',
  },
  tatsumiJun: {
    opener: 'I have an idea. Strictly a little research... with proper measurements.',
    close: 'We will test it, not guess.',
  },
  shibuyaAmuse: {
    opener: 'The clearances matter here. I have worked out a setup.',
    close: 'I can build it properly, if you want.',
  },
  yokohamaMines: {
    opener: 'Tell me what changed. Then we will sharpen the response.',
    close: 'I want clean delivery, not just a number.',
  },
  daikokuReAmemiya: {
    opener: 'I have checked the setup. No expensive guessing.',
    close: 'One clean run should tell us.',
  },
  shinjukuTopSecret: {
    opener: 'This is the specified work. No shortcuts.',
    close: 'The quote is firm. Your decision.',
  },
  ginzaLibertyWalk: {
    opener: 'We have a plan for this build. Let me walk you through it.',
    close: 'It will be a proper full-works conversion, not a quick bodykit.',
  },
});

function manga(shop, title, pages) {
  return {
    id: 'tunerPurchase-' + String(shop?.id || 'shop'),
    once: false,
    title,
    characters: {
      left: shop?.mechanicId || 'arkonDen',
      right: '$PLAYER',
    },
    pages: pages.map((page, i) => ({
      speaker: 'left',
      leftPose: i === 1 ? 'explaining' : 'idle',
      rightPose: 'idle',
      ...page,
    })),
  };
}

function decision(text, cost) {
  return {
    text,
    actionLabel: 'YES, ' + money(cost),
    secondaryActionLabel: 'NO',
    // The purchase must only happen through an explicit YES button, never
    // from a tap on the manga dialogue or the dark backdrop.
    requireActionButton: true,
  };
}

export function makeSpecialistTuneManga(shop, car, option) {
  const voice = VOICES[shop?.id] || {};
  const cost = Math.max(0, Number(option?.cost) || 0);
  return manga(shop, String(shop?.label || 'TUNER') + ' // SPECIALIST TUNE', [
    {
      text: (voice.opener || 'Here is the work I recommend.') + '\n' +
        'For your ' + String(car?.shortName || car?.name || 'car') +
        ': ' + String(option?.name || 'SPECIALIST TUNE') + '.',
    },
    {
      text: String(option?.description || 'We will refine this setup.') +
        '\nEXPECTED IMPROVEMENT: ' + String(option?.benefit || 'Specialist calibration') + '.',
    },
    decision(
      (voice.close || 'This is the complete quote.') +
      '\nThe specialist work costs ' + money(cost) + '. Shall I go ahead?',
      cost
    ),
  ]);
}

export function makeHeroBuildManga(shop, donor, hero, quote = {}) {
  const voice = VOICES[shop?.id] || {};
  const cost = Math.max(0, Number(quote?.total) || 0);
  const fromPower = Number(donor?.powerKW);
  const toPower = Number(hero?.powerKW);
  const fromTorque = Number(donor?.torqueNm);
  const toTorque = Number(hero?.torqueNm);
  const figures = [];
  if (Number.isFinite(fromPower) && Number.isFinite(toPower))
    figures.push('POWER: ' + fromPower + ' → ' + toPower + ' kW');
  if (Number.isFinite(fromTorque) && Number.isFinite(toTorque))
    figures.push('TORQUE: ' + fromTorque + ' → ' + toTorque + ' Nm');
  const isFullWorks = Boolean(shop?.cosmeticOnly);
  const breakdown = isFullWorks
    ? 'Parts ' + money(quote?.fullPartsCost) +
      ', installed parts credit −' + money(quote?.installedCredit) +
      ', specialist premium ' + money(quote?.specialistPremium) + '. '
    : '';

  return manga(shop, String(shop?.label || 'TUNER') + ' // HERO BUILD', [
    {
      text: (voice.opener || 'Let me show you the proposed build.') +
        '\nWe will turn your ' + String(donor?.name || 'donor car') +
        ' into the ' + String(hero?.name || 'hero car') + '.',
    },
    {
      text: (isFullWorks ? 'FACTORY TO HERO // ' : '') +
        (figures.join('  |  ') || 'The completed car uses a dedicated performance build.') +
        (isFullWorks ? '\nFull Level 3 tuning and three NOS shots. ' : '\n') +
        'The donor is permanently replaced by a fixed-spec collector car. Tuning is sealed.',
    },
    decision(
      breakdown + (voice.close || 'This is the full build price.') +
      '\nTotal to pay: ' + money(cost) + '. Approve the conversion?',
      cost
    ),
  ]);
}
