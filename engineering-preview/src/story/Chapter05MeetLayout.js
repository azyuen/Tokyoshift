// R670: Story-only head-to-head meet composition inside the EXACT Showdown
// viewport. Cars use the usual MeetScene renderer, tyre anchors and paint.
import {SHOWDOWN_STAGE} from '../ui/ShowdownLayout.js';

export const CH5_DUEL_GEOMETRY=Object.freeze({
  frame:SHOWDOWN_STAGE,
  cars:Object.freeze([
    Object.freeze({x:405,y:464,targetWidth:420,flipX:false}),
    Object.freeze({x:836,y:464,targetWidth:420,flipX:true}),
  ]),
  actors:Object.freeze({
    player:Object.freeze({x:153,feetY:599,height:244}),
    companion:Object.freeze({x:287,feetY:599,height:250}),
    challenger:Object.freeze({x:1081,feetY:599,height:248}),
  }),
});
export function getChapter05DuelCar(slot=0) {
  return CH5_DUEL_GEOMETRY.cars[slot]||null;
}
export function getChapter05DuelActor(role) {
  return CH5_DUEL_GEOMETRY.actors[role]||null;
}
