// Canonical public chapter index. Micro-cutscenes never enter the Story Archive.
// Progress is checked against the ACTIVE profile, with legacy milestones as
// fallback for players who completed chapters before once-flags were added.
import { hasSeenCutscene } from './cutscenes.js?v=20261017-r570';
import { getRegionalChampionshipCount } from './careerProgression.js?v=20261017-r553';
import { isCrewComplete } from './crewSystem.js?v=20261016-r551';
const get = (source,key,fallback=null) => source?.get?.(key) ?? source?.[key] ?? fallback;
export const STORY_CHAPTERS = Object.freeze([
  { number:1,id:'chapter01',title:'The First Night',subtitle:'A chance encounter and a first car' },
  { number:2,id:'chapter02',title:'Tokyo Takes Notice',subtitle:'The racing world begins to open up' },
  { number:3,id:'chapter03',title:'First Regional Champion',subtitle:'Your first major victory' },
  { number:4,id:'chapter04',title:'Bigger Dreams',subtitle:'A call from Sayaka' },
  { number:5,id:'chapter05',title:'The Ginza Connection',subtitle:'A surprising visitor at Warehouse HQ' },
  { number:6,id:'chapter06',title:'Beyond Seven',subtitle:'Seven regional leaders' },
  { number:7,id:'chapter07',title:'One Crew, Seven Roads',subtitle:'Your crew comes together' },
  { number:8,id:'chapter08',title:'The Next Level',subtitle:'A new racing career begins' },
]);
export const getStoryChapter = id => STORY_CHAPTERS.find(chapter => chapter.id === id) || null;
export function isStoryChapterComplete(source, chapterId) {
  const seen = id => hasSeenCutscene(source,id);
  const tier = Number(get(source,'garageTier',0));
  switch(chapterId){
    case 'chapter01':
      return seen('openingDaichiAfterSayaka') ||
        Boolean(get(source,'openingDrivingLessonComplete')) ||
        (get(source,'openingChapter') == null &&
          (Number(get(source,'wins',0)) > 0 || tier > 0));
    case 'chapter02':
      return seen('centralTokyoUnlocked') ||
        Boolean(get(source,'centralTokyoUnlocks',{})?.autoMarket);
    case 'chapter03':
      return seen('firstRegionalChampion') || getRegionalChampionshipCount(source) >= 1;
    case 'chapter04':
      return seen('canalYardBiggerDreams') || tier >= 1;
    case 'chapter05':
      return seen('warehouseHqUnlocked') || tier >= 2;
    case 'chapter06':
      return seen('sevenRegionsConquered') || getRegionalChampionshipCount(source) >= 7;
    case 'chapter07':
      return seen('fullCrewTogether') || isCrewComplete(source);
    case 'chapter08':
      return seen('chapter08Ginza');
    default:
      return false;
  }
}
export function availableStoryChapters(source, { dev = false } = {}) {
  return STORY_CHAPTERS.map(chapter => ({
    ...chapter,
    completed:Boolean(dev || isStoryChapterComplete(source,chapter.id)),
  }));
}
