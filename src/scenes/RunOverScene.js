import { cars } from '../data/cars.js?v=20260925-r193';
import {
  applyStateToRegistry,
  clearAllSaves,
  createFreshRunStateFromRegistry,
  saveSessionState,
} from '../state/GameState.js?v=20260926-r214';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

export default class RunOverScene extends Phaser.Scene {
  constructor() { super('RunOverScene'); }

  create() {
    document.body.dataset.scene = 'setup';
    this.scale.resize(1560, 840);
    playMusic('title');

    const firstName = String(this.registry.get('firstName') || '').trim();
    const lastName = String(this.registry.get('lastName') || '').trim();
    const driverName = [firstName, lastName].filter(Boolean).join(' ') || 'DRIVER';
    const starterCarId = this.registry.get('starterCarId') === 'ek9' ? 'ek9' : 'ae86';
    const starter = cars[starterCarId] || cars.ae86;
    const wins = Number(this.registry.get('wins') || 0);
    const losses = Number(this.registry.get('losses') || 0);

    this.add.rectangle(780, 420, 1560, 840, 0x03060c);
    this.add.rectangle(780, 420, 1080, 620, 0x08111c, 0.99)
      .setStrokeStyle(3, 0xff5f93, 0.92);

    this.add.text(780, 170, 'RUN OVER', {
      fontFamily: PIXEL_FONT,
      fontSize: '28px',
      color: '#ff8faf',
    }).setOrigin(0.5);

    this.add.text(780, 238, 'YOUR LAST CAR IS GONE', {
      fontFamily: PIXEL_FONT,
      fontSize: '12px',
      color: '#f4fbff',
    }).setOrigin(0.5);

    this.add.text(780, 294, driverName.toUpperCase() + '  //  ' + wins + ' W  ' + losses + ' L', {
      fontFamily: BODY_FONT,
      fontSize: '13px',
      color: '#a9c1cf',
      fontStyle: '600',
    }).setOrigin(0.5);

    this.add.text(
      780,
      360,
      'Pink slips still have teeth. The loss has already been autosaved. Start the night again with ' +
        'the same driver and your chosen ' + starter.shortName + ', switch profiles, or begin with a new driver.',
      {
        fontFamily: BODY_FONT,
        fontSize: '13px',
        color: '#c8d8e1',
        align: 'center',
        wordWrap: { width: 820 },
        lineSpacing: 6,
      }
    ).setOrigin(0.5);

    const addButton = (y, label, stroke, onPress, enabled = true) => {
      const box = this.add.rectangle(780, y, 520, 54, enabled ? 0x0c1825 : 0x12161c, 1)
        .setStrokeStyle(2, enabled ? stroke : 0x46515b, enabled ? 0.95 : 0.65);
      const text = this.add.text(780, y, label, {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: enabled ? '#f2fbff' : '#697984',
      }).setOrigin(0.5);

      if (enabled) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', onPress);
      }
      return { box, text };
    };

    addButton(
      500,
      'RESTART NIGHT // SAME DRIVER + ' + starter.shortName,
      0x62e8c7,
      () => this.restartNight()
    );

    addButton(
      574,
      'DRIVER PROFILES',
      0x45d7ff,
      () => this.scene.start('ProfileSelectScene')
    );

    addButton(
      648,
      'NEW DRIVER // RESET THIS SLOT',
      0xff5f93,
      () => {
        clearAllSaves();
        this.scene.start('CharacterSelectScene');
      }
    );

    this.add.text(780, 718, 'Restart Night resets this run but keeps your name, character and starter choice.', {
      fontFamily: BODY_FONT,
      fontSize: '11px',
      color: '#7f98a7',
      align: 'center',
    }).setOrigin(0.5);
  }

  restartNight() {
    const fresh = createFreshRunStateFromRegistry(this.registry);
    applyStateToRegistry(this.registry, fresh);
    saveSessionState(this.registry);
    this.scene.start('GarageScene');
  }
}
