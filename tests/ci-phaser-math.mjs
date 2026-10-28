// Node-only stand-in for the small Phaser Math surface used by the approved
// vehicle engine during repository tests. Never imported by the game.
const MathAPI={
  Clamp:(value,min,max)=>Math.max(min,Math.min(max,value)),
  Linear:(a,b,t)=>a+(b-a)*t,
  Between:(a,b)=>Math.floor((a+b)/2),
  FloatBetween:(a,b)=>(a+b)/2,
  DegToRad:degrees=>degrees*Math.PI/180,
  RadToDeg:radians=>radians*180/Math.PI,
};
if(!globalThis.Phaser)globalThis.Phaser={Scene:class {},Math:MathAPI};
else globalThis.Phaser.Math={...MathAPI,...(globalThis.Phaser.Math||{})};
