// Short character-driven sale scenes use the normal manga renderer; Ginza
// outfits are explicit pose assets so Shinjuku race portraits stay unchanged.
const page = (id, pose, text) => ({
  speaker: 'left', leftCharacter: id, leftPose: pose, text,
});
export function ginzaConversation(kind, { carName = 'THIS CAR', shortfall = 0 } = {}) {
  const priceGap = '¥ ' + Math.max(0, Math.round(shortfall)).toLocaleString('en-US');
  const sayaka = (pose, text) => page('sayakaFujieda', pose, text);
  const emi = (pose, text) => page('emiSaionji', pose, text);
  const kaede = (pose, text) => page('kaedeTachibana', pose, text);
  const options = {
    room1Short: {
      title: 'GINZA // A QUESTION OF FUNDS', finalActionLabel: "I'LL COME BACK",
      pages: [
        kaede('ginzaIdle', 'You are serious about the ' + carName + '? At this price, we do have to ask... do you actually have the cash?'),
        emi('ginzaIdle', 'I checked. You are exactly ' + priceGap + ' short of the asking price.'),
        kaede('ginzaSad', 'Then we cannot complete the sale today.'),
        { speaker:'right', text: "I understand. I'll come back when I have enough." },
        emi('ginzaHappy', "We'll keep an eye out for you!"),
      ],
    },
    room2Short: {
      title: 'GINZA // SOMETHING TO AIM FOR', finalActionLabel: 'KEEP DREAMING',
      pages: [
        sayaka('ginzaHappy', "Oh, I love that you have your sights set on the " + carName + "! It's nice to have ambitions."),
        kaede('ginzaIdle', "Sayaka, let's not waste their time. They're " + priceGap + " short."),
        sayaka('ginzaHappy', "It's okay, it's okay! We all need something to work towards. Perhaps next time!"),
      ],
    },
    interest: {
      title: 'GINZA // A SERIOUS BUYER', finalActionLabel: 'DISCUSS PURCHASE',
      pages: [
        emi('ginzaHappy', "You have good taste! Shall we talk about the " + carName + "?"),
        kaede('ginzaHappy', "And you have the funds. Wonderful. Let's make sure the delivery is perfect."),
        sayaka('ginzaHappy', 'A special car deserves the right home. We would be delighted to arrange it.'),
      ],
    },
    sale: {
      title: 'GINZA // SOLD!', finalActionLabel: 'ENJOY YOUR CAR',
      pages: [
        emi('ginzaHappy', 'The figures balance. Congratulations on your beautiful new car!'),
        kaede('ginzaHappy', 'A proper sale. Excellent choice — enjoy every kilometre.'),
        sayaka('ginzaHappy', "Congratulations! Take good care of it. We're all so happy it's found a good home."),
      ],
    },
    vaultInvitation: {
      title: 'GINZA // THE PRIVATE COLLECTION', finalActionLabel: 'ENTER PRIVATE ROOM',
      pages: [
        sayaka('ginzaHappy', "Tokyo Champion! I've been hoping you'd make it. There is something very special I want to show you."),
        sayaka('ginzaSerious', 'Behind this door are three priceless legends. This room is only for those I trust with them.'),
        sayaka('ginzaHappy', 'Consider this your personal invitation. Welcome to the private collection.'),
      ],
    },
    vaultOwner: {
      title: 'GINZA // A WORD WITH THE OWNER', finalActionLabel: 'ENTER PRIVATE ROOM',
      pages: [
        sayaka('ginzaHappy', 'Arkon Den! Of course the owner of the Ginza Motor Gallery has access to the private collection. Welcome back!'),
        sayaka('ginzaHappy', "Those three cars are yours to inspect, and I'll gladly accompany you on a drive."),
        sayaka('ginzaSerious', "But I'm coming in the passenger seat. We cannot have our owner crashing the gallery's most valuable assets!"),
      ],
    },
    // Only Arkon Den's named profile gets the gallery owner's relaxed
    // after-hours exchange. The ordinary invitation and vault scenes remain.
    vaultArkon: {
      title: 'GINZA // AFTER HOURS', finalActionLabel: "LET'S GO",
      characters: { left: 'sayakaFujieda', right: 'arkonDen' },
      pages: [
        { ...sayaka('normal', 'Arkon! Where are you off to in one of our cars tonight?'),
          rightCharacter: 'arkonDen', rightPose: 'ginzaSuit' },
        { speaker: 'right', rightCharacter: 'arkonDen', rightPose: 'ginzaSuit',
          leftCharacter: 'sayakaFujieda', leftPose: 'normal',
          text: 'Just a regular night out.' },
        { ...sayaka('normal', 'A regular night out. In a Le Mans legend. Naturally.'),
          rightCharacter: 'arkonDen', rightPose: 'ginzaSuit' },
        { ...sayaka('normal', "Give me a moment to change into something more comfortable. I'll join you. We can't have you wrecking our prized assets!"),
          rightCharacter: 'arkonDen', rightPose: 'ginzaSuit' },
      ],
    },
    vaultReturnArkon: {
      title: 'GINZA // KEYS RETURNED', finalActionLabel: 'BACK TO THE GALLERY',
      characters: { left: 'sayakaFujieda', right: 'arkonDen' },
      pages: [
        { ...sayaka('ginzaDress', 'There you are. And so is the car. Two welcome sights.'), rightCharacter: 'arkonDen', rightPose: 'ginzaSuit' },
        { speaker: 'right', rightCharacter: 'arkonDen', rightPose: 'ginzaSuit', leftCharacter: 'sayakaFujieda', leftPose: 'ginzaDress', text: 'Were you worried about me or the car?' },
        { ...sayaka('ginzaDress', 'Do you really want me to put those in order?'), rightCharacter: 'arkonDen', rightPose: 'ginzaSuit' },
        { speaker: 'right', rightCharacter: 'arkonDen', rightPose: 'ginzaSuit', leftCharacter: 'sayakaFujieda', leftPose: 'ginzaDress', text: 'Fine. Next time I will take you out in something sensible.' },
        { ...sayaka('ginzaDress', 'Wonderful. I shall believe it when I see it. Now, the keys, please.'), rightCharacter: 'arkonDen', rightPose: 'ginzaSuit' },
      ],
    },
    vaultReturn: {
      title: 'GINZA // SAFE RETURN', finalActionLabel: 'RETURN TO GALLERY',
      pages: [
        sayaka('ginzaHappy', 'Back in one piece. Excellent. I knew you could be trusted with it.'),
        sayaka('ginzaSerious', 'I will take the keys now. Your own car is waiting, and the gallery is open to you again.'),
      ],
    },
    vaultDrive: {
      title: 'GINZA // HANDLE WITH CARE', finalActionLabel: 'TAKE THE KEYS',
      pages: [
        sayaka('ginzaHappy', "You may take this one to the Tokyo street meets. I'll ride with you."),
        sayaka('ginzaHappy', "Enjoy the drive. Return it here to the private vault when you're finished. No workshops or events, please!"),
      ],
    },
    vaultLocked: {
      title: 'GINZA // PRIVATE ACCESS', finalActionLabel: 'BACK TO GALLERY',
      pages: [
        sayaka('ginzaSerious', 'Not this room just yet, dear. It requires a very special personal invitation from me.'),
        sayaka('ginzaHappy', "Make it to the very top of Tokyo's championship and perhaps we can talk."),
      ],
    },
  };
  const scene = options[kind];
  return scene ? {
    id: 'ginzaMicro_' + kind, category: 'CENTRAL TOKYO / GINZA',
    once: false, characters: { left: 'sayakaFujieda', right: '$PLAYER' },
    ...scene,
  } : null;
}
