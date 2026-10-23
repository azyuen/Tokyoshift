import fs from 'node:fs';
import assert from 'node:assert/strict';
import {cars} from '../src/data/cars.js';
import {stockClassFor} from '../src/data/stockClasses.js';
import {CREW_REGIONS,getRecruitableRegionalMembers} from '../src/data/crewRoster.js';
import {isCrewUnlocked,getCrewRecruitmentChallengeRules} from '../src/data/crewSystem.js';
import {AUTO_MARKET_LISTINGS,getAutoMarketBasePrice,getNewCarState,getCentralTokyoEligibility} from '../src/data/centralTokyo.js';
import {applyMarketPriceDifficulty,applyEasyCashWinBonus} from '../src/data/careerProgression.js';
import {getRegionalChampionshipCashReward} from '../src/data/tunerChallenges.js';
import {OSHIAGE_ELITE_VENUES,getOshiageEliteProgress} from '../src/data/oshiageElite.js';
const rows=[];
let challengesChecked=0;
for(const difficulty of ['EASY','STANDARD','HARD']){
 const source={devMode:false,firstName:'Career',lastName:'Fixture',playerDifficulty:difficulty,wins:49,garageTier:0,ownedCarIds:[],carStates:{},tunerTeamChallenges:Object.fromEntries(CREW_REGIONS.map(r=>[r,{championEarned:true}]))};
 assert.ok(isCrewUnlocked(source));assert.ok(getCentralTokyoEligibility(source).autoMarket);assert.ok(getOshiageEliteProgress(source).complete);
 const rewards=CREW_REGIONS.reduce((s,r)=>s+applyEasyCashWinBonus(source,getRegionalChampionshipCashReward(r)),0);
 for(const cls of ['A','B','C','D']){
  const choices=AUTO_MARKET_LISTINGS.filter(x=>stockClassFor(cars[x.carId])===cls).map(x=>({id:x.carId,price:applyMarketPriceDifficulty(source,getAutoMarketBasePrice(x.carId),'new')})).sort((a,b)=>a.price-b.price);
  assert.ok(choices.length>=2,cls);
  const reserve=75000,shortfall=Math.max(0,choices[1].price+reserve-rewards);
  const v=OSHIAGE_ELITE_VENUES.plaza,net=applyEasyCashWinBonus(source,v.prizeCash)-v.entryFee;
  rows.push({difficulty,class:cls,choices:choices.slice(0,2),championshipCash:rewards,shortfallForSecondChoice:shortfall,plazaWinsFromUnspentPrizes:Math.ceil(shortfall/net),plazaWinsFromEntryFeeOnly:Math.ceil(choices[1].price/net)});
 }
 for(const region of CREW_REGIONS)for(const member of getRecruitableRegionalMembers(region)){
  const cls=stockClassFor(cars[member.baseCarId]);
  const choices=rows.find(r=>r.difficulty===difficulty&&r.class===cls).choices;
  const owned=choices.map(c=>c.id),state={...source,ownedCarIds:owned,carStates:Object.fromEntries(owned.map(id=>[id,getNewCarState(id)]))};
  const rules=getCrewRecruitmentChallengeRules(state,{...member,regionId:region});
  assert.deepEqual([...rules.eligibleCarIds].sort(),owned.sort());challengesChecked++;
 }
}
fs.writeFileSync('docs/engineering/recruitment-access-results.json',JSON.stringify({scope:'Source-level non-dev eligibility and conditional savings model. Assumes showdown wins; not an end-to-end career playthrough. No perfect bonuses, resale, pink slips or coupons counted.',challengesChecked,rows},null,2)+'\n');
const lines=['# Recruitment access — 24 October 2026','','All 42 invitations × three difficulties accept both of their class’s two cheapest new showroom cars: **126 checks passed**. Fixtures have no dev flag, 49 wins and seven completed championships. The showroom opens at nine wins, before recruitment. All stock pages are browsable; models are not random daily availability.','',
'The guaranteed championship cash is an earnings total, not a player balance: workshop purchases and losses may already have spent it. It does not cover every class. Coupons from one championship completion are insufficient to guarantee a donor redemption.','',
'| Difficulty | Class | Two cheapest new cars / yen | Championship cash | Additional Plaza wins for second choice, unspent prizes | Plaza wins from entry-fee-only balance |','|---|---|---|---:|---:|---:|'];
for(const r of rows)lines.push(`| ${r.difficulty} | ${r.class} | ${r.choices.map(x=>x.id+' / '+x.price.toLocaleString('en-US')).join('; ')} | ${r.championshipCash.toLocaleString('en-US')} | ${r.plazaWinsFromUnspentPrizes} | ${r.plazaWinsFromEntryFeeOnly} |`);
lines.push('','The Plaza route opens with the same seven championships as recruitment and does not require a recruited crew. Each successful three-round event nets ¥675,000 on Standard/Hard; it costs ¥75,000 to enter and has a 15-minute venue cooldown. Figures retain an entry-fee reserve. These are conditional savings counts, not proof that a given player/build can win Elite showdowns. Lower-stakes repeatable meets are another income route but buying a car solely from those wagers can require extensive grinding.','',
'Decision: no immediate dealership or reward-price changes. There is no class availability or crew-unlock dependency loop in this branch, but affordable access is not guaranteed for a depleted save. Before release, playtest a spent-down seven-championship profile and reconcile current main’s recruitment invitation changes. A failed or deferred invitation must remain retryable.');
fs.writeFileSync('docs/engineering/RECRUITMENT_ACCESS.md',lines.join('\n')+'\n');
console.log({challengesChecked,rows:rows.length});
