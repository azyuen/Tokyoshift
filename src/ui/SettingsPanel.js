import { getAudioSettings, setAudioSettings } from '../audio/AudioSettings.js?v=20260921-r56';
import { saveIdentityState, clearAllSaves } from '../state/GameState.js?v=20260921-r56';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

function destroyObjects(objects = []) {
  objects.forEach(obj => {
    try { obj?.destroy?.(); } catch (e) {}
  });
}

function drawCog(scene, x, y, depth = 44) {
  const g = scene.add.graphics().setDepth(depth);
  g.lineStyle(3, 0xbad7e8, 1);
  g.strokeCircle(x, y, 10);
  g.strokeCircle(x, y, 3);

  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const x1 = x + Math.cos(a) * 11;
    const y1 = y + Math.sin(a) * 11;
    const x2 = x + Math.cos(a) * 15;
    const y2 = y + Math.sin(a) * 15;
    g.lineBetween(x1, y1, x2, y2);
  }

  return g;
}

export function addSettingsButton(scene, x = 995, y = 35) {
  const button = scene.add.rectangle(x, y, 50, 38, 0x0b1724, 1)
    .setStrokeStyle(1, 0x315470, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(43);

  const cog = drawCog(scene, x, y, 44);

  button.on('pointerover', () => button.setStrokeStyle(2, 0x43dfff, 1));
  button.on('pointerout', () => button.setStrokeStyle(1, 0x315470, 1));
  button.on('pointerdown', () => showSettingsPanel(scene));

  return { button, cog };
}

export function showSettingsPanel(scene) {
  if (scene._settingsOverlay?.length) return;

  const objects = [];
  const add = obj => {
    objects.push(obj);
    return obj;
  };
  scene._settingsOverlay = objects;

  const close = () => {
    try { scene._settingsNameDom?.destroy?.(); } catch (e) {}
    scene._settingsNameDom = null;
    destroyObjects(objects);
    scene._settingsOverlay = [];
  };

  const blocker = add(scene.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.72)
    .setDepth(180)
    .setInteractive());

  const panel = add(scene.add.rectangle(780, 420, 760, 650, 0x08131f, 0.995)
    .setStrokeStyle(2, 0x43dfff, 0.92)
    .setDepth(181));

  add(scene.add.text(430, 122, 'SETTINGS', {
    fontFamily: PIXEL_FONT,
    fontSize: '15px',
    color: '#eefaff',
  }).setDepth(183));

  const closeButton = add(scene.add.rectangle(1095, 126, 100, 38, 0x141d28, 1)
    .setStrokeStyle(1, 0x678192, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(183));

  add(scene.add.text(1095, 126, 'CLOSE', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#cbdce6',
  }).setOrigin(0.5).setDepth(184));

  closeButton.on('pointerdown', close);

  let settings = getAudioSettings();

  const buildVolumeRow = (label, y, key) => {
    add(scene.add.text(450, y, label, {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#a8d4ec',
    }).setOrigin(0, 0.5).setDepth(183));

    const percentText = add(scene.add.text(1090, y, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#ffffff',
    }).setOrigin(1, 0.5).setDepth(183));

    const segments = [];
    for (let i = 0; i < 10; i++) {
      const x = 650 + i * 38;
      const seg = add(scene.add.rectangle(x, y, 28, 22, 0x102233, 1)
        .setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(183));
      segments.push(seg);

      seg.on('pointerdown', () => {
        settings = setAudioSettings({
          ...settings,
          [key]: (i + 1) / 10,
        });
        refresh();
      });
    }

    const mute = add(scene.add.rectangle(594, y, 70, 28, 0x151b23, 1)
      .setStrokeStyle(1, 0x526978, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(183));

    add(scene.add.text(594, y, 'MUTE', {
      fontFamily: PIXEL_FONT,
      fontSize: '6px',
      color: '#aabac4',
    }).setOrigin(0.5).setDepth(184));

    mute.on('pointerdown', () => {
      settings = setAudioSettings({
        ...settings,
        [key]: 0,
      });
      refresh();
    });

    const refresh = () => {
      const value = Math.max(0, Math.min(1, settings[key]));
      percentText.setText(Math.round(value * 100) + '%');
      segments.forEach((seg, i) => {
        const active = i < Math.round(value * 10);
        seg.setFillStyle(active ? 0x1b6f83 : 0x102233, 1);
        seg.setStrokeStyle(1, active ? 0x45ddff : 0x315470, 1);
      });
    };

    refresh();
  };

  buildVolumeRow('MUSIC', 205, 'music');
  buildVolumeRow('SOUND FX', 265, 'sfx');

  add(scene.add.line(780, 316, 430, 0, 1130, 0, 0x315470, 0.9).setDepth(182));

  add(scene.add.text(450, 345, 'DRIVER NAME', {
    fontFamily: PIXEL_FONT,
    fontSize: '9px',
    color: '#a8d4ec',
  }).setDepth(183));

  const firstName = String(scene.registry.get('firstName') || '');
  const lastName = String(scene.registry.get('lastName') || '');

  const html = `
    <div style="width:620px;display:grid;grid-template-columns:1fr 1fr;gap:14px;font-family:Rajdhani,sans-serif;">
      <input id="settingsFirstName" maxlength="16" placeholder="First name" value="${firstName.replace(/"/g, '&quot;')}"
        style="box-sizing:border-box;width:100%;height:46px;padding:0 14px;border:2px solid #315470;background:#07111d;color:#fff;font:700 17px Rajdhani,sans-serif;outline:none;border-radius:2px;" />
      <input id="settingsLastName" maxlength="16" placeholder="Last name" value="${lastName.replace(/"/g, '&quot;')}"
        style="box-sizing:border-box;width:100%;height:46px;padding:0 14px;border:2px solid #315470;background:#07111d;color:#fff;font:700 17px Rajdhani,sans-serif;outline:none;border-radius:2px;" />
    </div>
  `;

  scene._settingsNameDom = scene.add.dom(780, 405)
    .createFromHTML(html)
    .setDepth(184);

  const nameStatus = add(scene.add.text(780, 452, '', {
    fontFamily: BODY_FONT,
    fontSize: '9px',
    color: '#7fcbe9',
  }).setOrigin(0.5).setDepth(184));

  const saveName = add(scene.add.rectangle(780, 493, 270, 42, 0x0c2827, 1)
    .setStrokeStyle(2, 0x62e8c7, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(183));

  add(scene.add.text(780, 493, 'SAVE NAME', {
    fontFamily: PIXEL_FONT,
    fontSize: '8px',
    color: '#f1fffb',
  }).setOrigin(0.5).setDepth(184));

  saveName.on('pointerdown', () => {
    const root = scene._settingsNameDom?.node;
    const first = (root?.querySelector?.('#settingsFirstName')?.value || '').trim();
    const last = (root?.querySelector?.('#settingsLastName')?.value || '').trim();

    if (!first || !last) {
      nameStatus.setText('ENTER A FIRST AND LAST NAME').setColor('#ff7f91');
      return;
    }

    scene.registry.set('firstName', first);
    scene.registry.set('lastName', last);
    saveIdentityState(scene.registry);
    nameStatus.setText('NAME UPDATED').setColor('#73e7c8');
  });

  add(scene.add.line(780, 542, 430, 0, 1130, 0, 0x315470, 0.9).setDepth(182));

  add(scene.add.text(450, 568, 'NEW GAME', {
    fontFamily: PIXEL_FONT,
    fontSize: '9px',
    color: '#ff9aaa',
  }).setDepth(183));

  add(scene.add.text(450, 600, 'Restart from the beginning and erase this run.', {
    fontFamily: BODY_FONT,
    fontSize: '10px',
    color: '#8299a7',
  }).setDepth(183));

  const restart = add(scene.add.rectangle(955, 594, 310, 46, 0x2b151c, 1)
    .setStrokeStyle(2, 0xff657d, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(183));

  add(scene.add.text(955, 594, 'RESTART GAME', {
    fontFamily: PIXEL_FONT,
    fontSize: '8px',
    color: '#ffe2e8',
  }).setOrigin(0.5).setDepth(184));

  restart.on('pointerdown', () => {
    const confirmObjects = [];
    const addConfirm = obj => {
      confirmObjects.push(obj);
      return obj;
    };

    addConfirm(scene.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.82)
      .setDepth(210)
      .setInteractive());

    addConfirm(scene.add.rectangle(780, 420, 650, 330, 0x09121d, 1)
      .setStrokeStyle(2, 0xff657d, 1)
      .setDepth(211));

    addConfirm(scene.add.text(780, 325, 'RESTART THIS RUN?', {
      fontFamily: PIXEL_FONT,
      fontSize: '13px',
      color: '#fff2f4',
    }).setOrigin(0.5).setDepth(212));

    addConfirm(scene.add.text(
      780,
      385,
      'This permanently deletes your cash, cars, tuning, wins, losses and restore point.',
      {
        fontFamily: BODY_FONT,
        fontSize: '11px',
        color: '#ffb6c2',
        align: 'center',
        wordWrap: { width: 520 },
      }
    ).setOrigin(0.5).setDepth(212));

    addConfirm(scene.add.text(780, 437, 'THIS CANNOT BE UNDONE.', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#ff7188',
    }).setOrigin(0.5).setDepth(212));

    const cancel = addConfirm(scene.add.rectangle(665, 505, 190, 44, 0x10202a, 1)
      .setStrokeStyle(1, 0x617987, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(212));

    addConfirm(scene.add.text(665, 505, 'CANCEL', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#d9e7ef'
    }).setOrigin(0.5).setDepth(213));

    const confirm = addConfirm(scene.add.rectangle(895, 505, 190, 44, 0x32151e, 1)
      .setStrokeStyle(2, 0xff657d, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(212));

    addConfirm(scene.add.text(895, 505, 'YES, RESTART', {
      fontFamily: PIXEL_FONT, fontSize: '7px', color: '#ffe2e8'
    }).setOrigin(0.5).setDepth(213));

    cancel.on('pointerdown', () => destroyObjects(confirmObjects));
    confirm.on('pointerdown', () => {
      clearAllSaves();
      close();
      destroyObjects(confirmObjects);
      scene.scene.start('CharacterSelectScene');
    });
  });

  blocker.on('pointerdown', close);
}
