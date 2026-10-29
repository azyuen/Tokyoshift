// Touch-first professional team naming. Native DOM input allows the mobile
// keyboard to work without Phaser capture, including iOS standalone mode.
import { normaliseProCircuitState, normaliseProTeamName } from '../data/proCircuit.js?v=20261030-r724';
import { saveProTransaction } from '../state/GameState.js?v=20261012-champ2c';

export function showProTeamNameEditor(scene, onSaved = null) {
  if (typeof document === 'undefined' || scene._proTeamNameEditor) return;
  const circuit = normaliseProCircuitState(scene.registry.get('proCircuit'));
  const backdrop = document.createElement('div');
  scene._proTeamNameEditor = backdrop;
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-label', 'Rename racing team');
  backdrop.style.cssText = 'position:fixed;inset:0;z-index:300000;display:flex;align-items:center;justify-content:center;background:rgba(3,7,15,.94);padding:20px;box-sizing:border-box;font-family:Rajdhani,sans-serif;color:#fff;';
  const panel = document.createElement('div');
  panel.style.cssText = 'width:min(520px,94vw);background:#101b27;border:2px solid #5ac4db;border-radius:8px;padding:22px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;box-shadow:0 12px 40px #000;';
  const title = document.createElement('div');
  title.textContent = 'PRO TEAM // RENAME';
  title.style.cssText = 'font:700 15px Silkscreen,monospace;color:#e7f8ff;';
  const note = document.createElement('div');
  note.textContent = 'Your team name appears in professional standings, crew entries and results. Maximum 24 characters.';
  note.style.cssText = 'font:600 16px Rajdhani,sans-serif;color:#adcad7;';
  const input = document.createElement('input');
  input.type = 'text'; input.maxLength = 24; input.value = circuit.playerTeamName;
  input.setAttribute('aria-label','Professional racing team name');
  input.autocomplete = 'off'; input.spellcheck = false;
  input.style.cssText = 'width:100%;box-sizing:border-box;background:#08111e;color:#fff;border:1px solid #75bcd1;border-radius:4px;padding:11px;font:700 22px Rajdhani,sans-serif;';
  const message = document.createElement('div');
  message.style.cssText = 'min-height:16px;color:#fa9696;font:600 13px Rajdhani,sans-serif;';
  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:12px;';
  const button = (name) => {
    const element = document.createElement('button');
    element.type = 'button'; element.textContent = name;
    element.style.cssText = 'flex:1;padding:12px;background:#20374b;border:1px solid #68bcd4;border-radius:4px;color:#fff;font:700 14px Silkscreen,monospace;cursor:pointer;';
    return element;
  };
  const cancel = button('CANCEL'), save = button('SAVE TEAM');
  save.style.background = '#673441';
  const stop = event => event.stopPropagation();
  ['pointerdown','pointerup','click','touchstart','touchend'].forEach(name =>
    backdrop.addEventListener(name,stop));
  const close = () => {
    if (scene._proTeamNameEditor !== backdrop) return;
    scene._proTeamNameEditor = null;
    scene.events?.off?.('shutdown',close);
    backdrop.remove();
  };
  cancel.addEventListener('click',close);
  save.addEventListener('click',() => {
    const typed = input.value.trim();
    if (!typed || /[<>]/.test(typed)) {
      message.textContent = 'ENTER A VALID TEAM NAME';
      return;
    }
    const name = normaliseProTeamName(typed);
    try {
      const current = normaliseProCircuitState(scene.registry.get('proCircuit'));
      saveProTransaction(scene.registry,{proCircuit:{...current,playerTeamName:name}});
      close();
      if (typeof onSaved === 'function') onSaved(name);
    } catch (error) {
      message.textContent = 'SAVE FAILED: ' + String(error?.message || error).slice(0,100);
    }
  });
  input.addEventListener('keydown',event => {
    event.stopPropagation();
    if (event.key === 'Enter') { event.preventDefault(); save.click(); }
    if (event.key === 'Escape') { event.preventDefault(); close(); }
  });
  actions.append(cancel,save);
  panel.append(title,note,input,message,actions);
  backdrop.append(panel);
  document.body.append(backdrop);
  scene.events?.once?.('shutdown',close);
}
