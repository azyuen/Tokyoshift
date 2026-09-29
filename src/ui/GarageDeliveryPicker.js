import {
  getUnlockedWorkshops,
  getWorkshopStorageCapacity,
  getWorkshopUsage,
} from '../data/workshopProgression.js?v=20260929-r263';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

export function getGarageDeliveryOptions(scene, carId = null) {
  const owned = [...(scene?.registry?.get('ownedCarIds') || [])];
  const locations = { ...(scene?.registry?.get('carGarageLocations') || {}) };
  const unlocked = getUnlockedWorkshops(scene?.registry?.get('garageTier') || 0);
  const ownedAlready = Boolean(carId && owned.includes(carId));
  const currentGarageId = carId ? locations[carId] : null;

  return unlocked.map(workshop => {
    const capacity = getWorkshopStorageCapacity(workshop.id);
    const rawUsage = getWorkshopUsage(owned, locations, workshop.id);
    const currentCarOccupiesSlot = ownedAlready && currentGarageId === workshop.id;
    const usageWithoutCar = Math.max(0, rawUsage - (currentCarOccupiesSlot ? 1 : 0));
    const available = usageWithoutCar < capacity;

    return {
      id: workshop.id,
      label: workshop.label,
      shortLabel: workshop.shortLabel,
      capacity,
      currentUsage: rawUsage,
      usageAfterDelivery: available ? usageWithoutCar + 1 : rawUsage,
      available,
      currentGarage: currentCarOccupiesSlot,
    };
  });
}

export function showGarageDeliveryPicker(scene, {
  carId = null,
  carName = 'NEW CAR',
  title = 'CHOOSE DELIVERY GARAGE',
  message = 'Where should the car be delivered?',
  allowCancel = true,
  onSelect = null,
  onCancel = null,
  depth = 970,
} = {}) {
  if (!scene?.add || scene._garageDeliveryPicker?.active) {
    return scene?._garageDeliveryPicker || null;
  }

  const options = getGarageDeliveryOptions(scene, carId);
  if (!options.length || !options.some(option => option.available)) return null;

  const objects = [];
  const add = obj => {
    objects.push(obj);
    return obj;
  };

  const blocker = add(scene.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.82)
    .setDepth(depth)
    .setScrollFactor(0)
    .setInteractive());

  add(scene.add.rectangle(780, 420, 820, 600, 0x08131f, 0.998)
    .setStrokeStyle(3, 0x43dfff, 0.96)
    .setDepth(depth + 1)
    .setScrollFactor(0));

  add(scene.add.text(780, 155, String(title).toUpperCase(), {
    fontFamily: PIXEL_FONT,
    fontSize: '15px',
    color: '#eefaff',
    align: 'center',
  }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0));

  add(scene.add.text(780, 202, String(carName).toUpperCase(), {
    fontFamily: PIXEL_FONT,
    fontSize: '10px',
    color: '#8fe7ff',
    align: 'center',
  }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0));

  add(scene.add.text(780, 242, message, {
    fontFamily: BODY_FONT,
    fontSize: '12px',
    color: '#a7bdca',
    fontStyle: '600',
    align: 'center',
    wordWrap: { width: 660 },
  }).setOrigin(0.5).setDepth(depth + 2).setScrollFactor(0));

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    objects.forEach(obj => {
      try { obj?.destroy?.(); } catch (e) {}
    });
    scene._garageDeliveryPicker = null;
  };

  const startY = 330;
  const gap = 92;
  options.forEach((option, index) => {
    const y = startY + index * gap;
    const available = option.available;

    const row = add(scene.add.rectangle(
      780,
      y,
      680,
      72,
      available ? 0x0b1724 : 0x0a0f14,
      1
    ).setStrokeStyle(
      available ? 2 : 1,
      available ? 0x315470 : 0x3a444a,
      1
    ).setDepth(depth + 2).setScrollFactor(0));

    add(scene.add.text(470, y - 14, option.label, {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: available ? '#eefaff' : '#66737a',
    }).setOrigin(0, 0.5).setDepth(depth + 3).setScrollFactor(0));

    const usageText = available
      ? option.usageAfterDelivery + ' / ' + option.capacity + ' CARS AFTER DELIVERY'
      : option.currentUsage + ' / ' + option.capacity + ' CARS // FULL';

    add(scene.add.text(470, y + 18, usageText, {
      fontFamily: BODY_FONT,
      fontSize: '10px',
      color: available ? '#91a9b8' : '#66737a',
      fontStyle: '600',
    }).setOrigin(0, 0.5).setDepth(depth + 3).setScrollFactor(0));

    add(scene.add.text(1090, y, available ? 'DELIVER  >' : 'FULL', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: available ? '#62e8c7' : '#755f65',
    }).setOrigin(1, 0.5).setDepth(depth + 3).setScrollFactor(0));

    if (available) {
      row.setInteractive({ useHandCursor: true });
      row.on('pointerdown', () => {
        const chosen = option.id;
        close();
        onSelect?.(chosen);
      });
    }
  });

  if (allowCancel) {
    const cancel = add(scene.add.rectangle(780, 662, 220, 46, 0x151d28, 1)
      .setStrokeStyle(1, 0x657d8c, 1)
      .setDepth(depth + 2)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true }));

    add(scene.add.text(780, 662, 'CANCEL', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#d8e7ef',
    }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0));

    cancel.on('pointerdown', () => {
      close();
      onCancel?.();
    });
  }

  blocker.on('pointerdown', () => {});

  scene._garageDeliveryPicker = {
    active: true,
    options,
    close,
  };
  return scene._garageDeliveryPicker;
}
