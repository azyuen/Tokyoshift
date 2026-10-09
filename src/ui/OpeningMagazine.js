import { cars } from '../data/cars.js?v=20261006-r388';
import { getActiveMagazineIssue } from '../data/carMagazine.js?v=20261006-r388';
import { renderCarPhoto } from './CarHistoryPanel.js?v=20261010-r467';

const PIXEL = '"Silkscreen", monospace';
const BODY = '"Rajdhani", monospace';

// A guided first look at Issue 01. The permanent magazine renderer remains
// untouched for every subsequent visit after the tutorial.
export function showOpeningMagazine(scene, onChoose) {
  if (scene._openingMagazineOverlay) return;
  const objects = [];
  const add = obj => { objects.push(obj); return obj; };
  const issue = getActiveMagazineIssue(scene.registry);
  let page = 0;
  let selected = null;
  let view = null;

  add(scene.add.rectangle(780, 420, 1560, 840, 0x03060a, 0.95)
    .setDepth(300).setInteractive());
  add(scene.add.rectangle(780, 410, 1120, 690, 0xede3cd, 1)
    .setStrokeStyle(5, 0x957e62, 1).setDepth(301));
  add(scene.add.rectangle(780, 410, 3, 684, 0xa18c70, 1).setDepth(302));

  const addText = (parent, x, y, value, fontSize = '10px', color = '#312921', width = 440) => {
    const obj = scene.add.text(x, y, value, {
      fontFamily: fontSize === '10px' ? PIXEL : BODY,
      fontSize, color, wordWrap: { width }, lineSpacing: 5,
      align: 'center',
    }).setOrigin(0.5);
    parent.add(obj);
    return obj;
  };

  const next = add(scene.add.rectangle(1407, 740, 240, 54, 0x132f30, 1)
    .setStrokeStyle(2, 0x64e3c2, 1).setDepth(310).setInteractive({ useHandCursor: true }));
  const nextLabel = add(scene.add.text(1407, 740, '', {
    fontFamily: PIXEL, fontSize: '8px', color: '#edfffa',
  }).setOrigin(0.5).setDepth(311));
  const back = add(scene.add.rectangle(148, 740, 206, 54, 0x29231b, 1)
    .setStrokeStyle(2, 0xa89378, 1).setDepth(310).setInteractive({ useHandCursor: true }));
  add(scene.add.text(148, 740, '<  PREV', {
    fontFamily: PIXEL, fontSize: '8px', color: '#f3ebdc',
  }).setOrigin(0.5).setDepth(311));
  const folio = add(scene.add.text(780, 772, '', {
    fontFamily: PIXEL, fontSize: '7px', color: '#bea98e',
  }).setOrigin(0.5).setDepth(311));

  const render = () => {
    view?.destroy(true);
    view = scene.add.container(780, 410).setDepth(305);
    const left = -280;
    const right = 280;
    if (page === 0) {
      if (issue?.coverKey && scene.textures.exists(issue.coverKey)) {
        const image = scene.add.image(0, 0, issue.coverKey).setDisplaySize(480, 620);
        view.add(image);
      } else addText(view, 0, 0, 'TOKYO SHIFT // ISSUE 01', '19px');
      addText(view, 0, 300, 'LAST YEAR\'S TOKYO CHAMPION', '14px', '#7a3b2e', 750);
      folio.setText('ISSUE 01 // COVER');
    } else if (page === 1) {
      addText(view, left, -245, 'TOKYO SHIFT', '10px', '#8b3b28');
      addText(view, left, -135, 'A NEW STREET FILE', '24px', '#231e18');
      addText(view, left, 0,
        'The first edition follows the tuning shops, night meets and people who shape Tokyo\'s car scene.',
        '18px', '#423b31', 430);
      addText(view, right, -230, 'LAST YEAR\'S CHAMPION', '12px', '#8b3b28');
      if (issue?.insetKey && scene.textures.exists(issue.insetKey)) {
        view.add(scene.add.image(right, -55, issue.insetKey).setDisplaySize(410, 445));
      }
      addText(view, right, 230,
        'One season. One champion. A city full of drivers ready to challenge the record.',
        '16px', '#423b31', 450);
      folio.setText('ISSUE 01 // FEATURE');
    } else {
      addText(view, 0, -289, 'TOKYO AUTO MARKET // USED CARS', '13px', '#993b28', 980);
      addText(view, 0, -244, 'TWO CLASSICS. YOUR FIRST KEYS.', '10px', '#403628', 900);
      for (const [id, x, label, desc] of [
        ['ae86', left, 'TOYOTA AE86', 'RWD // LIGHTWEIGHT // MOMENTUM'],
        ['ef', right, 'HONDA CIVIC EF', 'FWD // LIGHTWEIGHT // HIGH REVS'],
      ]) {
        const plate = scene.add.rectangle(x, 30, 490, 480, selected === id ? 0xffeed0 : 0xe3d6ba)
          .setStrokeStyle(selected === id ? 5 : 2, selected === id ? 0xb34e30 : 0xa18c70)
          .setInteractive({ useHandCursor: true });
        view.add(plate);
        addText(view, x, -139, label, '12px', '#292019');
        renderCarPhoto(scene, { carId: id, state: {} }, x, -20, 370, 0, obj => view.add(obj));
        addText(view, x, 130, desc, '8px', '#493a29');
        addText(view, x, 176, selected === id ? 'SELECTED ✓' : 'TAP TO CHOOSE', '9px',
          selected === id ? '#8c3828' : '#514a3d');
        plate.on('pointerdown', () => { selected = id; render(); });
      }
      addText(view, 0, 290,
        'Your family friend can bring either one. Which would you like?',
        '16px', '#4b3a2e', 900);
      folio.setText('ISSUE 01 // AUTO MARKET AD');
    }
    nextLabel.setText(page === 2 ? (selected ? 'CONFIRM CAR  >' : 'CHOOSE A CAR') : 'NEXT PAGE  >');
    back.setAlpha(page === 0 ? 0.3 : 1);
  };

  const close = () => {
    view?.destroy(true);
    objects.forEach(o => o?.destroy?.());
    scene._openingMagazineOverlay = null;
  };
  scene._openingMagazineOverlay = { close };
  back.on('pointerdown', () => { if (page > 0) { page--; render(); } });
  next.on('pointerdown', () => {
    if (page < 2) { page++; render(); return; }
    if (!selected) return;
    const choice = selected;
    close();
    onChoose?.(choice);
  });
  render();
}
