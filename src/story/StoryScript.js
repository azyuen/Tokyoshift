// Story Director script contract: pure functions, no Phaser or save-state dependencies.
// All commands are declarative. No arbitrary JavaScript callbacks are persisted.
export const STORY_COMMANDS = Object.freeze(new Set([
  'LOCATION', 'STAGE', 'CLEAR_STAGE', 'MANGA', 'PHONE', 'COMPACT',
  'OPEN_MAP', 'START_RACE', 'WAIT_SCENE', 'WAIT_RACE_END', 'WAIT_EVENT',
  'WAIT_FLAG', 'SET_FLAG', 'IF', 'GOTO', 'LABEL', 'END',
  'CHOICE', 'WAIT_MS', 'VENUE', 'DEV_HERO_RACE', 'RETURN_LOAN',
]));

const nameOf = step => String(step?.type || '').toUpperCase();
export const normaliseStoryId = id => String(id || '').trim();

export function validateStoryScript(script) {
  if (!script || !normaliseStoryId(script.id) ||
      !Array.isArray(script.steps) || !script.steps.length) {
    throw new Error('Story Director requires an id and a non-empty steps array');
  }
  const labels = new Map();
  script.steps.forEach((step, index) => {
    const type = nameOf(step);
    if (!STORY_COMMANDS.has(type)) throw new Error('Unknown story action at ' + index + ': ' + type);
    if (type === 'LABEL') {
      if (!step.name || labels.has(step.name)) throw new Error('Duplicate/empty story label at ' + index);
      labels.set(step.name, index);
    }
    if (['MANGA','PHONE','COMPACT'].includes(type) &&
        !step.cutsceneId && !(Array.isArray(step.pages) && step.pages.length)) {
      throw new Error(type + ' needs cutsceneId or dialogue pages at ' + index);
    }
    if (type === 'CHOICE' && (!Array.isArray(step.choices) ||
        step.choices.length < 2 || step.choices.length > 4 ||
        !step.choices.every(choice => choice?.id && choice?.label && choice?.to))) {
      throw new Error('CHOICE requires 2-4 named options with branch targets at ' + index);
    }
    if (type === 'WAIT_MS' && (!Number.isFinite(step.ms) || step.ms < 0 || step.ms > 15000)) {
      throw new Error('WAIT_MS must be 0-15000 milliseconds at ' + index);
    }
    if (type === 'VENUE' && !step.venue) throw new Error('VENUE needs venue at ' + index);
    if (type === 'START_RACE' && step.scene && step.scene !== 'RaceScene') {
      throw new Error('START_RACE can only enter RaceScene');
    }
  });
  script.steps.forEach((step, index) => {
    const targets = nameOf(step) === 'CHOICE'
      ? step.choices.map(choice=>choice.to)
      : ['IF','GOTO'].includes(nameOf(step))
        ? [step.to,step.then,step.else].filter(Boolean) : [];
    for (const label of targets) {
      if (!labels.has(label)) throw new Error('Story branch at ' + index + ' has missing label: ' + label);
    }
  });
  return { script, labels };
}

export function checkStoryCondition(condition, getValue) {
  if (!condition || typeof condition !== 'object' || !condition.key) return false;
  const value = getValue(condition.key);
  if (Object.prototype.hasOwnProperty.call(condition,'equals')) return value === condition.equals;
  if (Object.prototype.hasOwnProperty.call(condition,'notEquals')) return value !== condition.notEquals;
  if (Object.prototype.hasOwnProperty.call(condition,'atLeast')) return Number(value) >= Number(condition.atLeast);
  if (Object.prototype.hasOwnProperty.call(condition,'atMost')) return Number(value) <= Number(condition.atMost);
  return Boolean(value);
}

export function nextStoryPosition(compiled, index, getValue) {
  const step = compiled.script.steps[index];
  if (!step) return compiled.script.steps.length;
  const type = nameOf(step);
  if (type === 'IF') {
    const label = checkStoryCondition(step, getValue) ? step.then : step.else;
    return label ? compiled.labels.get(label) + 1 : index + 1;
  }
  if (type === 'GOTO') return compiled.labels.get(step.to) + 1;
  return index + 1;
}

export function createStoryCheckpoint(scriptId, index, profileSlot) {
  return { id: normaliseStoryId(scriptId), index: Math.max(0, Math.floor(index || 0)),
    ownerSlot: Number(profileSlot), version: 1 };
}

export function isStoryCheckpoint(value) {
  return Boolean(value && typeof value.id === 'string' &&
    Number.isSafeInteger(value.index) && value.index >= 0 &&
    Number.isSafeInteger(value.ownerSlot) && value.version === 1);
}
