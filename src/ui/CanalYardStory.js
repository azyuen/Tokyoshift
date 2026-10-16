// Career Scene 04 is ONE chapter, staged with the canonical phone renderer:
// Manga intro -> genuine vibrating incoming call -> Manga outro.
// Only the chapter appears in the developer tester; segment checkpoints are
// internal and persist so interrupted iPad/PWA sessions can safely resume.
import { getCutscene, hasSeenCutscene, markCutsceneSeen } from '../data/cutscenes.js?v=20261017-r560';
import { playMangaCutscene, sceneCutsceneActive } from './MangaCutscene.js?v=20261017-r560';
import { saveSessionState } from '../state/GameState.js?v=20261014-r501';

const CHAPTER_ID = 'canalYardBiggerDreams';
const PENDING_ID = 'canalYardStoryPending';
const STEPS = Object.freeze([
  'canalYardBiggerDreamsIntro',
  'canalYardBiggerDreamsCall',
  'canalYardBiggerDreamsOutro',
]);

export function playCanalYardStory(scene, {
  preview = false,
  onComplete = null,
  onCancel = null,
} = {}) {
  if (!scene || sceneCutsceneActive(scene)) {
    return { played: false, reason: 'active' };
  }
  const chapter = getCutscene(CHAPTER_ID);
  if (!chapter?.pages || chapter.pages.length < 15) {
    return { played: false, reason: 'missing' };
  }
  if (!preview && hasSeenCutscene(scene.registry, CHAPTER_ID)) {
    return { played: false, reason: 'seen' };
  }

  const definitions = [
    {
      id: STEPS[0], category: chapter.category,
      title: chapter.title, characters: chapter.characters, once: true,
      pages: chapter.pages.slice(0, 5),
      finalActionLabel: 'ANSWER PHONE',
    },
    {
      id: STEPS[1], category: chapter.category,
      title: 'CANAL YARD // SAYAKA CALLING', once: true,
      presentation: 'phone', presentationMode: 'openingSwipe',
      callerId: 'sayakaFujieda', callerName: 'SAYAKA',
      callerPose: 'homeHappy', label: 'INCOMING CALL',
      pages: chapter.pages.slice(5, 12).map(page => ({
        speaker: page.speaker === 'right' ? 'player' : 'caller',
        text: page.text,
      })),
    },
    {
      id: STEPS[2], category: chapter.category,
      title: chapter.title, characters: chapter.characters, once: true,
      pages: chapter.pages.slice(12),
      finalActionLabel: chapter.finalActionLabel,
    },
  ];

  const completeChapter = payload => {
    if (!preview) {
      markCutsceneSeen(scene.registry, CHAPTER_ID);
      // Keep the completed segment history; only the active marker disappears.
      const seen = scene.registry.get('cutscenesSeen') || [];
      scene.registry.set('cutscenesSeen', seen.filter(id => id !== PENDING_ID));
      saveSessionState(scene.registry);
    }
    onComplete?.({ ...payload, cutsceneId: CHAPTER_ID, preview });
  };

  // An interrupted three-part R554 save can resume at the phone or outro
  // without repeating a manga the player has already completed.
  const alreadySeen = id => !preview && hasSeenCutscene(scene.registry, id);
  const oldComplete = [
    alreadySeen('canalYardUnlocked'),
    alreadySeen('canalYardSayakaCall'),
    alreadySeen('canalYardAfterCall'),
  ];
  const completedStep = index =>
    alreadySeen(STEPS[index]) || oldComplete[index];

  let nextIndex = preview ? 0 : definitions.findIndex((_def, i) => !completedStep(i));
  if (nextIndex < 0) {
    completeChapter({ reason: 'action', skipped: false });
    return { played: true, reason: 'completed' };
  }

  const run = () => {
    if (nextIndex >= definitions.length) {
      completeChapter({ reason: 'action', skipped: false });
      return;
    }
    const definition = definitions[nextIndex];
    const finish = payload => {
      if (payload?.skipped) {
        // SKIP dismisses the whole chapter: never ring the phone after the
        // driver has opted out of the story.
        completeChapter(payload);
        return;
      }
      nextIndex++;
      if (nextIndex >= definitions.length) {
        completeChapter(payload);
      } else {
        scene.time.delayedCall(180, run);
      }
    };
    const result = playMangaCutscene(scene, definition, {
      preview,
      onComplete: finish,
      onPreviewComplete: finish,
      onCancel: payload => onCancel?.(payload),
    });
    if (!result?.played) {
      onCancel?.({ reason: result?.reason || 'unavailable',
        cutsceneId: definition.id, preview });
    }
  };

  run();
  return { played: true, reason: 'started' };
}
