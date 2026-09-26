import { cars } from '../data/cars.js?v=20260926-r209';
import { engines } from '../data/engines.js?v=20260924-r164';
import { applyEngineTuning } from '../data/tuning.js?v=20260926-r211';
import { applySecondaryTuning } from '../data/secondaryTuning.js?v=20260926-r211';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

function destroyObjects(objects = []) {
  objects.forEach(obj => {
    try { obj?.destroy?.(); } catch (e) {}
  });
}

function money(value) {
  return '¥ ' + Number(value || 0).toLocaleString('en-US');
}

function acquisitionLabel(value = '') {
  const labels = {
    starter: 'STARTER',
    pinkSlip: 'PINK SLIP',
    tokyoAutoMarket: 'AUTO MARKET',
    competitionCoupon: 'COUPON',
    ginzaMotorGallery: 'GINZA',
    'tuner-shop': 'TUNER BUILD',
    rivalBuild: 'PINK SLIP',
    legacy: 'EARLY GARAGE',
  };
  return labels[value] || String(value || 'GARAGE').replaceAll('_', ' ').toUpperCase();
}

function statusLabel(entry = {}) {
  const status = String(entry.status || 'OWNED').toUpperCase();
  if (status === 'OWNED') return 'IN GARAGE';
  if (status === 'SOLD') return 'SOLD' + (entry.salePrice ? ' // ' + money(entry.salePrice) : '');
  if (status === 'PINK_SLIP_LOST') return 'LOST // PINK SLIP';
  if (status === 'CONVERTED') {
    const target = cars[entry.convertedTo];
    return 'CONVERTED' + (target ? ' → ' + target.shortName : '');
  }
  if (status === 'LEGACY_ARCHIVED') return 'PRE-HISTORY // DETAILS UNAVAILABLE';
  return status.replaceAll('_', ' ');
}

function dateLabel(timestamp) {
  const value = Number(timestamp || 0);
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return date.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();
  } catch (e) {
    return '';
  }
}

function tunedStats(carId, state = {}) {
  const car = cars[carId];
  const engine = car ? engines[car.engine] : null;
  if (!car || !engine) return null;

  try {
    const engineBuild = applyEngineTuning(car, engine, state || {});
    const full = applySecondaryTuning(engineBuild.car, engineBuild.engine, state || {});
    return {
      power: Math.round(Number(full.car.powerKW || car.powerKW || 0)),
      torque: Math.round(Number(full.car.torqueNm || car.torqueNm || 0)),
      weight: Math.round(Number(full.car.vehicleMassKg || car.vehicleMassKg || 0)),
    };
  } catch (e) {
    return {
      power: Math.round(Number(car.powerKW || 0)),
      torque: Math.round(Number(car.torqueNm || 0)),
      weight: Math.round(Number(car.vehicleMassKg || 0)),
    };
  }
}

export function addCarHistoryButton(scene, x = 690, y = 35) {
  const button = scene.add.rectangle(x, y, 150, 38, 0x0b1724, 1)
    .setStrokeStyle(1, 0x315470, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(43);

  const label = scene.add.text(x, y, 'CAR HISTORY', {
    fontFamily: PIXEL_FONT,
    fontSize: '6px',
    color: '#bfe4f5',
  }).setOrigin(0.5).setDepth(44);

  button.on('pointerover', () => button.setStrokeStyle(2, 0x43dfff, 1));
  button.on('pointerout', () => button.setStrokeStyle(1, 0x315470, 1));
  button.on('pointerdown', () => showCarHistoryPanel(scene));

  return { button, label };
}

export function showCarHistoryPanel(scene) {
  if (scene._carHistoryOverlay?.length) return;

  const objects = [];
  let rowObjects = [];
  const add = obj => { objects.push(obj); return obj; };
  const addRow = obj => {
    rowObjects.push(obj);
    objects.push(obj);
    return obj;
  };

  const history = [...(scene.registry.get('carHistory') || [])]
    .filter(entry => entry && cars[entry.carId])
    .sort((a, b) => Number(b.acquiredAt || 0) - Number(a.acquiredAt || 0));

  const currentStates = scene.registry.get('carStates') || {};
  const pageSize = 5;
  let page = 0;
  const pageCount = Math.max(1, Math.ceil(history.length / pageSize));

  scene._carHistoryOverlay = objects;

  const close = () => {
    destroyObjects(objects);
    scene._carHistoryOverlay = [];
  };

  add(scene.add.rectangle(780, 420, 1560, 840, 0x01040a, 0.80)
    .setInteractive()
    .setDepth(260));

  add(scene.add.rectangle(780, 420, 1120, 730, 0x07121d, 0.998)
    .setStrokeStyle(3, 0x45dfff, 0.94)
    .setDepth(261));

  add(scene.add.text(270, 92, 'CAR HISTORY', {
    fontFamily: PIXEL_FONT,
    fontSize: '16px',
    color: '#eefaff',
  }).setDepth(263));

  add(scene.add.text(270, 132, 'YOUR COLLECTION LEDGER // OWNED, SOLD, LOST AND CONVERTED', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#79cbe9',
  }).setDepth(263));

  const uniqueCars = new Set(history.map(entry => entry.carId)).size;
  const ownedCount = history.filter(entry => entry.status === 'OWNED').length;
  const departedCount = Math.max(0, history.length - ownedCount);

  add(scene.add.text(
    1290,
    110,
    uniqueCars + ' MODELS  //  ' + ownedCount + ' OWNED  //  ' + departedCount + ' ARCHIVED',
    {
      fontFamily: BODY_FONT,
      fontSize: '10px',
      color: '#8fa9b8',
      fontStyle: '700',
    }
  ).setOrigin(1, 0.5).setDepth(263));

  const closeButton = add(scene.add.rectangle(1280, 160, 150, 38, 0x141d28, 1)
    .setStrokeStyle(1, 0x678192, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(263));

  add(scene.add.text(1280, 160, 'CLOSE', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#d1e2eb',
  }).setOrigin(0.5).setDepth(264));
  closeButton.on('pointerdown', close);

  const pageText = add(scene.add.text(780, 742, '', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#829eae',
  }).setOrigin(0.5).setDepth(263));

  const prev = add(scene.add.rectangle(550, 742, 150, 38, 0x101b26, 1)
    .setStrokeStyle(1, 0x315470, 1)
    .setDepth(263));
  const prevText = add(scene.add.text(550, 742, '<  PREV', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#d8e8ef',
  }).setOrigin(0.5).setDepth(264));

  const next = add(scene.add.rectangle(1010, 742, 150, 38, 0x101b26, 1)
    .setStrokeStyle(1, 0x315470, 1)
    .setDepth(263));
  const nextText = add(scene.add.text(1010, 742, 'NEXT  >', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#d8e8ef',
  }).setOrigin(0.5).setDepth(264));

  const render = () => {
    destroyObjects(rowObjects);
    rowObjects = [];

    page = Math.max(0, Math.min(pageCount - 1, page));
    pageText.setText('PAGE ' + (page + 1) + ' / ' + pageCount);

    const canPrev = page > 0;
    const canNext = page < pageCount - 1;
    prev
      .setFillStyle(canPrev ? 0x101b26 : 0x0b1016, 1)
      .setStrokeStyle(1, canPrev ? 0x315470 : 0x26343e, 1);
    next
      .setFillStyle(canNext ? 0x101b26 : 0x0b1016, 1)
      .setStrokeStyle(1, canNext ? 0x315470 : 0x26343e, 1);
    prevText.setColor(canPrev ? '#d8e8ef' : '#52636e');
    nextText.setColor(canNext ? '#d8e8ef' : '#52636e');

    prev.removeAllListeners('pointerdown');
    next.removeAllListeners('pointerdown');
    if (canPrev) {
      prev.setInteractive({ useHandCursor: true });
      prev.on('pointerdown', () => { page -= 1; render(); });
    } else {
      prev.disableInteractive();
    }
    if (canNext) {
      next.setInteractive({ useHandCursor: true });
      next.on('pointerdown', () => { page += 1; render(); });
    } else {
      next.disableInteractive();
    }

    const visible = history.slice(page * pageSize, page * pageSize + pageSize);
    if (!visible.length) {
      addRow(scene.add.text(780, 430, 'NO CARS RECORDED YET', {
        fontFamily: PIXEL_FONT,
        fontSize: '12px',
        color: '#688392',
      }).setOrigin(0.5).setDepth(263));
      addRow(scene.add.text(780, 475, 'Cars you collect from this build onward will appear here automatically.', {
        fontFamily: BODY_FONT,
        fontSize: '11px',
        color: '#718895',
      }).setOrigin(0.5).setDepth(263));
      return;
    }

    visible.forEach((entry, rowIndex) => {
      const car = cars[entry.carId];
      const y = 235 + rowIndex * 92;
      const owned = entry.status === 'OWNED';
      const state = owned
        ? (currentStates[entry.carId] || entry.lastState || {})
        : (entry.lastState || {});
      const stats = entry.status === 'LEGACY_ARCHIVED'
        ? null
        : tunedStats(entry.carId, state);

      addRow(scene.add.rectangle(780, y, 980, 76, owned ? 0x0c1c27 : 0x0a131c, 1)
        .setStrokeStyle(1, owned ? 0x2e6883 : 0x293f4e, 1)
        .setDepth(262));

      addRow(scene.add.text(315, y - 18, car.name.toUpperCase(), {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#ffffff',
      }).setDepth(263));

      addRow(scene.add.text(
        315,
        y + 14,
        acquisitionLabel(entry.acquiredVia) +
          (dateLabel(entry.acquiredAt) ? '  //  ' + dateLabel(entry.acquiredAt) : ''),
        {
          fontFamily: BODY_FONT,
          fontSize: '9px',
          color: '#829dab',
          fontStyle: '600',
        }
      ).setDepth(263));

      addRow(scene.add.text(
        860,
        y - 17,
        entry.status === 'LEGACY_ARCHIVED'
          ? 'PRE-HISTORY BUILD NOT RECORDED'
          : stats
            ? stats.power + ' kW   •   ' + stats.torque + ' Nm   •   ' + stats.weight + ' kg'
            : 'BUILD DATA UNAVAILABLE',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '7px',
          color: '#a8cddd',
        }
      ).setOrigin(0.5, 0).setDepth(263));

      addRow(scene.add.text(
        1260,
        y + 13,
        statusLabel(entry),
        {
          fontFamily: PIXEL_FONT,
          fontSize: '6px',
          color: owned ? '#62e8c7' : entry.status === 'SOLD' ? '#ffe08a' : '#ff9ab9',
        }
      ).setOrigin(1, 0.5).setDepth(263));
    });
  };

  render();
}
