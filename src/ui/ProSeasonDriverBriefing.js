// Free Pro Season driver preparation. Cars are registered at the Pro Paddock;
// this briefing chooses which of those cars will race and allows Daichi to
// fit/remove levels ALREADY OWNED, without charging or altering physics.
import { cars } from '../data/cars.js?v=20261026-r687';
import { getProDriverDrivetrain,getProfessionalCarEligibility,
  getProfessionalRoundEvents,getProSeasonDriverCarError } from '../data/proSeason.js?v=20261030-r741';
import { normaliseProCircuitState } from '../data/proCircuit.js?v=20261030-r741';
import { BRIEFING_POWER_PARTS,getDriverPowerPartLevelInfo,
  setDriverPowerPartLevels } from '../data/proDriverBriefing.js?v=20261030-r740';
import { saveProTransaction } from '../state/GameState.js?v=20261030-r739';

const PIXEL='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';
const money=n=>'¥'+Math.round(Number(n)||0).toLocaleString('en-US');
const shortDrive=d=>d==='FWD'?'FF':d||'—';

export function showProSeasonDriverBriefing(s,event,onGrid){
  const initial=normaliseProCircuitState(s.registry.get('proCircuit'));
  const owned=s.registry.get('ownedCarIds')||[];
  // Roster-less historical seasons remain playable. Their legacy choice
  // was any owned personal car; display the selected one first.
  const legacy=!Array.isArray(initial.registeredDriverCars);
  const legacyOrder=[s.registry.get('selectedCarId'),...owned]
    .filter((id,i,items)=>id&&items.indexOf(id)===i);
  const roster=(legacy?legacyOrder:initial.registeredDriverCars)
    .filter(id=>cars[id]&&owned.includes(id)&&!cars[id].ginzaDemo&&!cars[id].crewLoan)
    .slice(0,3);
  if(initial.seasonStatus!=='ACTIVE'||initial.calendar.round>=8||!roster.length)return false;
  if(s._proOverlayClose)s._proOverlayClose();
  const selectedId=s.registry.get('selectedCarId');
  let selected=roster.includes(selectedId)?selectedId:
    roster.find(id=>getProDriverDrivetrain(id)===event.seasonRules?.drivetrain)||roster[0];
  const originals=s.registry.get('carStates')||{};
  const drafts=Object.fromEntries(roster.map(id=>[id,originals[id]||{}]));
  let closed=false,nodes=[];
  const discard=()=>{nodes.forEach(node=>node?.destroy?.());nodes=[];};
  const close=()=>{
    if(closed)return;closed=true;discard();
    if(s._proOverlayClose===close)s._proOverlayClose=null;
    s.events.off('shutdown',close);
  };
  const add=node=>{nodes.push(node);return node;};
  s._proOverlayClose=close;
  s.events.once('shutdown',close);
  const label=(x,y,value,size=17,color='#dceaf0',extra={})=>add(
    s.add.text(x,y,value,{fontFamily:BODY,fontSize:size+'px',fontStyle:'700',
      color,wordWrap:{width:extra.wrap||1380},lineSpacing:3})
      .setDepth(252));
  const button=(x,y,w,h,caption,callback,enabled=true)=>{
    const bg=add(s.add.rectangle(x,y,w,h,enabled?0x163044:0x152029,.98)
      .setStrokeStyle(2,enabled?0x57b6d2:0x506070).setDepth(252));
    const txt=label(x,y,caption,14,enabled?'#e9f9ff':'#8097a3')
      .setOrigin(.5);
    if(txt.width>w-14)txt.setScale((w-14)/txt.width);
    if(enabled)bg.setInteractive({useHandCursor:true}).on('pointerdown',callback);
  };
  const rules=event.seasonRules||{};
  const limit=Number.isFinite(rules.maxPowerKW)?rules.maxPowerKW:null;
  const spec=(rules.stock?'FACTORY STOCK  /  ':'')+
    (rules.drivetrain?shortDrive(rules.drivetrain)+' ONLY  /  ':'ANY DRIVETRAIN  /  ')+
    (limit!=null?limit+' KW MAX':'UNLIMITED POWER')+'  /  '+
    (rules.noNos?'NO NOS':'NOS PERMITTED');

  function render(){
    discard();
    add(s.add.rectangle(780,420,1560,840,0x06101b,.99).setDepth(250).setInteractive());
    add(s.add.rectangle(780,420,1494,786,0x0a1725,.98)
      .setStrokeStyle(2,0x56a5c2).setDepth(251));
    label(65,39,'PRO SEASON // '+String(event.label||'DRIVER EVENT'),23,'#ffffff');
    label(65,85,'DAICHI // FREE EVENT PREPARATION · OWNED PARTS ONLY',17,'#82dbed');
    label(65,118,spec,17,'#f5d9ae');
    label(65,152,'CHOOSE ONE OF YOUR THREE REGISTERED CARS',15,'#b6cdd8');
    roster.forEach((id,i)=>{
      const active=id===selected;
      const x=293+i*486;
      const hit=add(s.add.rectangle(x,210,453,71,active?0x204d56:0x142838,.96)
        .setStrokeStyle(2,active?0x8cf2dc:0x597b91).setDepth(252)
        .setInteractive({useHandCursor:true}));
      const caption=label(x-204,188,(active?'✓  ':'')+
        (cars[id]?.shortName||id)+' // '+shortDrive(getProDriverDrivetrain(id)),
        17,active?'#ffffff':'#c9d9e2');
      if(caption.width>400)caption.setScale(400/caption.width);
      hit.on('pointerdown',()=>{selected=id;render();});
    });
    const draft=drafts[selected]||{};
    const check=getProfessionalCarEligibility(selected,draft,rules);
    const canStart=check.eligible&&(!Number.isFinite(event.entryFee)||
      Number(s.registry.get('cash')||0)>=event.entryFee);
    label(66,264,'POWER  '+(Number.isFinite(check.powerKW)?Math.round(check.powerKW)+' KW':'—')+
      '  //  '+(check.eligible?'SCRUTINEERING PASSED':
        'SETUP REQUIRED: '+check.reasons.slice(0,2).join(' / ')),17,
      check.eligible?'#90e5bb':'#f0a8aa',{wrap:1380});
    label(65,308,'SELECT FITTED LEVELS · CHANGES COST ¥0 · PURCHASED PARTS REMAIN YOURS',15,'#9dc1d3');
    // Three columns of five items. Car parts are prepared, never purchased.
    BRIEFING_POWER_PARTS.forEach((part,i)=>{
      const x=67+Math.floor(i/5)*497,y=346+(i%5)*67;
      const info=getDriverPowerPartLevelInfo(draft,part.id);
      const original=getDriverPowerPartLevelInfo(originals[selected]||{},part.id);
      if(!info)return;
      label(x,y,part.label,15,'#edf5f8');
      label(x+325,y,'OWNED L'+original.original,12,'#91b7cc');
      const max=original.original||0;
      const current=info.current||0;
      const levels=part.id==='nosKit'?
        [{level:0,caption:'OFF'},{level:max,caption:'FIT'}]:
        [0,1,2,3].map(level=>({level,caption:level===0?'STOCK':'L'+level}));
      levels.filter((row,i,list)=>i===0||row.level!==list[0].level).forEach((row,j)=>{
        const bx=x+34+j*97,by=y+37,enabled=row.level<=max,active=row.level===current;
        const box=add(s.add.rectangle(bx,by,83,29,active?0x237e7b:0x142a3d,
          enabled?1:.4).setStrokeStyle(1,active?0xa6ffee:0x537c96).setDepth(253));
        const txt=label(bx,by,row.caption,12,enabled?'#f6fbff':'#71838e')
          .setOrigin(.5);
        if(enabled)box.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
          drafts[selected]=setDriverPowerPartLevels(draft,{[part.id]:row.level});
          render();
        });
      });
    });
    label(65,701,'EVENT FORMAT  '+String(rules.format||'KNOCKOUT').replaceAll('_',' ')+
      '  ·  MAX 20 SEASON POINTS  ·  TOP PURSE '+money(event.prizeCash||0),
      16,'#d7c49d');
    button(247,777,338,50,'BACK TO PRO SEASON',close);
    button(785,777,370,50,'RESET UNSAVED SETUP',()=>{
      drafts[selected]=originals[selected]||{};render();
    });
    button(1304,777,394,50,canStart?'GO TO GRID // '+money(event.entryFee):
      'PASS SCRUTINEERING FIRST',()=>{
      const now=normaliseProCircuitState(s.registry.get('proCircuit'));
      const latest=s.getProDragEvents?.().find(e=>e.id===event.id&&
        e.seasonChoice===event.seasonChoice);
      const actual=s.registry.get('carStates')||{};
      if(now.seasonStatus!=='ACTIVE'||now.calendar.round!==initial.calendar.round||
        !latest||latest.seasonRules?.format!==rules.format||
        getProSeasonDriverCarError(now,selected)||
        now.activeTournament||now.activeTimedEvent||now.activeCrewEvent||
        s.registry.get('competitionState')?.active||
        !getProfessionalCarEligibility(selected,drafts[selected],rules).eligible){
        s.proError='EVENT OR SETUP CHANGED // REOPEN BRIEFING';
        close();s.renderLocation(s.activeLocationId);return;
      }
      try{
        saveProTransaction(s.registry,{
          selectedCarId:selected,
          carStates:{...actual,[selected]:drafts[selected]},
        });
      }catch(error){s.proError=error.message;close();s.renderLocation(s.activeLocationId);return;}
      close();
      onGrid?.(s.getSelectedBuild?.());
    },canStart);
  }
  render();return true;
}
