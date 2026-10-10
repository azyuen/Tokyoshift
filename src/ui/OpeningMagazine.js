// Backwards-compatible entry point. The opening now uses the real Issue 01
// viewer, rather than its own handcrafted tutorial magazine.
import { showMagazinePanel } from './CarHistoryPanel.js?v=20261011-r472';

export function showOpeningMagazine(scene, onChoose) {
  return showMagazinePanel(scene, { onChoose });
}
