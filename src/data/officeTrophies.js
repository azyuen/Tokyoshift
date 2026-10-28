// Career v1 Office trophy ledger. Reads earned results only, never placeholders.
import {normaliseProCircuitState,PRO_CIRCUIT_TROPHIES} from './proCircuit.js?v=20261021-r628';
export function getOfficeTrophyRecord(raw) {
  const c=normaliseProCircuitState(raw);
  const titles=Number(c.tokyoChampionWins)||0;
  const trophies=PRO_CIRCUIT_TROPHIES.map(t=>({
    id:t.id,label:t.label,wins:Number(c.trophyWins?.[t.id]||0),
  }));
  const latest=[...c.championshipHistory].filter(h=>h?.completed&&h.championId).at(-1)||null;
  const won=trophies.filter(t=>t.wins>0).length;
  return {titles,careerCompleted:c.careerCompleted||titles>0,
    trophyWins:won,trophyTotal:trophies.length,trophies,
    appearances:c.championshipHistory.filter(h=>h?.completed).length,
    latest};
}
export function getOfficeTrophyLines(raw) {
  const record=getOfficeTrophyRecord(raw);
  return [
    'TOKYO CHAMPION  //  '+(record.titles?record.titles+' TITLE'+(record.titles>1?'S':''):'NOT YET'),
    'CAREER MODE  //  '+(record.careerCompleted?'TOKYO CHAMPION':'TITLE NOT EARNED'),
    'PRESTIGE TROPHIES  //  '+record.trophyWins+'/'+record.trophyTotal+' COLLECTED',
    ...record.trophies.map(t=>t.label+'  //  '+(t.wins?'WON '+t.wins+' TIME'+(t.wins>1?'S':''):'NOT YET')),
    'TOKYO APPEARANCES  //  '+record.appearances,
    ...(record.latest?['LATEST CHAMPIONSHIP  //  SEASON '+record.latest.season+
      ' · CHAMPION '+(record.latest.championName||record.latest.championId)]:[]),
  ];
}
