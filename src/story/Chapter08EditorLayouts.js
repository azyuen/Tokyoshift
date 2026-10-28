// Chapter 08 editor-authored composition. Percentages use the same 1560x840
// stage coordinates and bottom-centre object anchor as stage-editor.html.
// Never apply additional arbitrary scale factors to these measurements.
export const CH08_EDITOR_LAYOUTS = Object.freeze({
  garage: {
    cast: [[40.7169357609069,88.55448156585796,61.378823073945014,3,false],
           [23.613878392305047,88.61093437965089,60.17142857142858,2,false]],
    cars: [[54.11267605633802,71.93742592062779,63.798122065727696,false]],
  },
  meet: {
    cast: [[36.31887985546523,91.95774352521761,65.18571428571428,2,false],
           [23.03794037940379,91.78997588340148,63.51428571428572,2,false],
           [63.410117434507676,91.28667295795324,65.18571428571428,2,true]],
    cars: [[9.015356820234874,81.2206144489882,73.28906955736224,false],
           [90.72448057813912,81.38838209080424,74,true]],
  },
  vip: {
    cast: [[43.54561878952123,89.60899653979241,65.18571428571428,3,false],
           [32.97395984979134,91.29672515136784,65.18571428571428,4,false],
           [68.46883468834685,93.79259725280485,69.71533101045297,2,true]],
    cars: [[49.470641373080404,81.22061444898814,73.4,false]],
  },
});
export function getChapter08EditorLayout(backgroundId,vipParty=false){
  if(vipParty)return CH08_EDITOR_LAYOUTS.vip;
  const id=String(backgroundId||'');
  if(id.includes('shinonomeWarehouseStrip'))return CH08_EDITOR_LAYOUTS.garage;
  if(['shinagawaTennozu','daikokuPA','shibuyaScramble'].some(v=>id.includes(v)))
    return CH08_EDITOR_LAYOUTS.meet;
  return null;
}
