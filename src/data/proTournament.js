// Phase 2: persistent four-wide professional tournament engine.
// Pure transitions: no Phaser, clocks, registry writes or random Math.random().
import {
  normaliseProCircuitState, getProCircuitDriverSeeds,
} from './proCircuit.js?v=20261008-r443';
import { characters } from './characters.js?v=20261007-r411';

export const FOUR_WIDE_CUP = Object.freeze({
  id: 'fourWideOpen', label: 'TOKYO FOUR-WIDE OPEN',
  entrants: 16, qualifyPerHeat: 2, entryFee: 35000,
  prizeCash: Object.freeze([320000, 170000, 90000, 50000]),
  stageNames: Object.freeze(['QUALIFYING', 'SEMIFINAL', 'FINAL']),
});

const PLAYER = 'player:driver';
const SEED_GRID = Object.freeze([
  [0, 7, 8, 15], [3, 4, 11, 12],
  [1, 6, 9, 14], [2, 5, 10, 13],
]);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const copy = x => JSON.parse(JSON.stringify(x));

export function proCupHash(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
export function proCupRandom(seed) {
  let state = proCupHash(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Match local circuit racers to the player's current ability; stronger racers
// still appear, but a first-time entrant won't face all seven legends at once.
function selectEntrants(circuit, id) {
  const full = getProCircuitDriverSeeds(circuit);
  const player = full.find(r => r.id === PLAYER);
  const candidates = full.filter(r => r.id !== PLAYER)
    .sort((a, b) => Math.abs(a.rating - player.rating) -
      Math.abs(b.rating - player.rating) ||
      proCupHash(id + a.id) - proCupHash(id + b.id));
  return [player, ...candidates.slice(0, FOUR_WIDE_CUP.entrants - 1)]
    .sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id));
}

function makeHeat(id, ids, stage, index) {
  if (ids.length !== 4 || new Set(ids).size !== 4) throw Error('Invalid four-wide heat');
  return { id: id + ':' + stage + ':' + index, entrants: [...ids], results: null };
}

export function createFourWideTournament(proCircuit, carId) {
  const c = normaliseProCircuitState(proCircuit);
  if (c.activeTournament) return null;
  const id = FOUR_WIDE_CUP.id + ':s' + c.season + ':e' + (c.eventTick + 1);
  const selected = selectEntrants(c, id);
  const players = selected.map((r, i) => ({
    id: r.id, seed: i + 1, rating: r.rating,
    name: r.id === PLAYER ? 'YOU' : String(r.name || characters[r.characterId]?.name || r.id),
    characterId: r.characterId || null,
  }));
  const heats = SEED_GRID.map((positions, i) => makeHeat(id, positions.map(n => players[n].id), 0, i));
  return {
    schema: 1, id, eventId: FOUR_WIDE_CUP.id, carId: String(carId),
    stage: 0, entrants: players, heats, history: [],
    entryFee: FOUR_WIDE_CUP.entryFee, pending: true,
  };
}

export function getPlayerProHeat(tournament) {
  if (!tournament || !tournament.pending) return null;
  return tournament.heats.find(h => h.entrants.includes(PLAYER) && !h.results) || null;
}

function scoredRows(heat, input) {
  if (!Array.isArray(input) || input.length !== 4 ||
    new Set(input.map(r => r.id)).size !== 4 ||
    input.some(r => !heat.entrants.includes(r.id))) {
    throw Error('Heat finishers do not match registered entrants');
  }
  return input.map(row => {
    const finite = row.finishSeconds != null && Number.isFinite(Number(row.finishSeconds))
      && Number(row.finishSeconds) >= 0;
    return {
      id: row.id,
      finishSeconds: finite ? Number(row.finishSeconds) : null,
      status: row.disqualified ? 'DQ' : finite ? 'FINISHED' : 'DNF',
    };
  }).sort((a,b) => {
    const rank = r => r.status === 'FINISHED' ? 0 : r.status === 'DNF' ? 1 : 2;
    return rank(a)-rank(b) || (a.finishSeconds ?? Infinity)-(b.finishSeconds ?? Infinity) ||
      a.id.localeCompare(b.id);
  }).map((r,i)=>({...r, placing: i+1}));
}

function simulateHeat(tournament, heat) {
  const rng = proCupRandom(heat.id);
  const input = heat.entrants.map(id => {
    const driver = tournament.entrants.find(e => e.id === id);
    // Lightweight consistent ET estimate, with driver variance and upsets.
    // This does NOT pretend to run a hidden full Phaser/Vehicle scene.
    const time = clamp(12.8 - (driver.rating - 1400) * .003 +
      (rng() + rng() + rng() - 1.5) * .85, 8.8, 18);
    return { id, finishSeconds: Number(time.toFixed(3)) };
  });
  return scoredRows(heat, input);
}

function nextStage(t, winners) {
  if (t.stage === 0) {
    const h = winners;
    return [
      makeHeat(t.id, [h[0][0], h[1][1], h[2][0], h[3][1]], 1, 0),
      makeHeat(t.id, [h[1][0], h[0][1], h[3][0], h[2][1]], 1, 1),
    ];
  }
  if (t.stage === 1) {
    return [makeHeat(t.id, [winners[0][0], winners[1][1],
      winners[1][0], winners[0][1]], 2, 0)];
  }
  return [];
}

function recordStage(t) {
  t.history.push({ stage: t.stage, heats: copy(t.heats) });
  const advancing = t.heats.map(h => h.results.slice(0, 2).map(row => row.id));
  t.heats = nextStage(t, advancing);
  t.stage += 1;
}

// All results are simulated only for off-screen heats. The player's played heat
// is NEVER replaced by a projection from rankings.
function advanceAfterPlayer(t) {
  for (;;) {
    t.heats.forEach(heat => {
      if (!heat.results) {
        if (heat.entrants.includes(PLAYER)) throw Error('Played heat has no official results');
        heat.results = simulateHeat(t, heat);
      }
    });
    recordStage(t);
    if (t.stage > 2) return;
    if (getPlayerProHeat(t)) return;
  }
}

function finalPlayerStage(t) {
  for (let stage = t.history.length-1; stage >= 0; stage--) {
    const row = t.history[stage].heats.flatMap(h => h.results)
      .find(r => r.id === PLAYER);
    if (row) return { stage, row };
  }
  return { stage: 0, row: { placing: 4, status: 'DNF' } };
}

function eventPlacement(t) {
  const { stage, row } = finalPlayerStage(t);
  if (stage === 2) return row.placing;
  if (stage === 1) return 4 + row.placing; // 7th/8th approx; tournament stage matters most
  return 8 + row.placing * 2; // 10–16 approximate with shared places
}

function settleCompletedEvent(circuit, t) {
  const next = normaliseProCircuitState(circuit);
  if (next.completedEventIds.includes(t.id)) return {
    circuit: next, cashPrize: 0, settled: false,
  };
  const rankingBefore = getProCircuitDriverSeeds(next)
    .find(row => row.id === PLAYER)?.seed || 32;
  const allHeats = t.history.flatMap(stage => stage.heats);
  const table = { [PLAYER]: next.playerDriver, ...next.drivers };
  // Elo-style pairwise comparisons; each real/simulated result contributes.
  for (const heat of allHeats) {
    for (const row of heat.results) {
      const s = table[row.id];
      if (!s) continue;
      const oldRating = s.rating;
      let delta = 0;
      for (const rival of heat.results) {
        if (rival.id === row.id) continue;
        const other = table[rival.id];
        const expected = 1 / (1 + Math.pow(10, (other.rating-oldRating)/400));
        const score = row.placing < rival.placing ? 1 : 0;
        delta += (score-expected)*6;
      }
      s.rating = clamp(Math.round(s.rating+delta), 100, 3000);
      s.wins += row.placing <= 2 ? 1 : 0;
      s.losses += row.placing > 2 ? 1 : 0;
    }
  }
  const participation = new Set(t.entrants.map(r => r.id));
  for (const id of participation) {
    const s=table[id]; if(!s) continue;
    s.entered += 1;
    const finalRow = t.history.at(-1).heats.flatMap(h=>h.results)
      .find(r=>r.id===id);
    const semiRow=t.history.find(h=>h.stage===1)?.heats.flatMap(h=>h.results)
      .find(r=>r.id===id);
    s.seasonPoints += finalRow ? [32,24,18,14][finalRow.placing-1] :
      semiRow ? 8 : 3;
  }
  const place = eventPlacement(t);
  const payout = place <= 4 ? FOUR_WIDE_CUP.prizeCash[place-1] :
    place <= 8 ? 12000 : 0;
  // Repeats remain worthwhile but deliberately avoid easy limitless farming.
  const cashPrize = Math.floor(payout *
    (next.eventTick > 0 ? .70 : 1));
  next.qualified = true;
  next.eventTick += 1;
  next.completedEventIds = [...new Set([...next.completedEventIds, t.id])].slice(-250);
  next.activeTournament = null;
  const rankingAfter = getProCircuitDriverSeeds(next)
    .find(row => row.id === PLAYER)?.seed || 32;
  next.lastTournament = {
    id: t.id, label: FOUR_WIDE_CUP.label, placing: place, cashPrize,
    ratingBefore: circuit.playerDriver.rating, ratingAfter: next.playerDriver.rating,
    rankBefore: rankingBefore, rankAfter: rankingAfter,
    stagesCompleted: finalPlayerStage(t).stage+1,
  };
  return { circuit: next, cashPrize, settled: true, summary: next.lastTournament };
}

export function settleFourWideHeat(proCircuit, playerResults, heatId) {
  const original = normaliseProCircuitState(proCircuit);
  const active = original.activeTournament;
  if (!active || active.eventId !== FOUR_WIDE_CUP.id ||
    !active.pending) return { circuit: original, status: 'NO_EVENT', cashPrize: 0 };
  const heat = getPlayerProHeat(active);
  if (!heat || heat.id !== heatId) return {
    circuit: original, status: 'STALE_HEAT', cashPrize: 0,
  };
  const t = copy(active);
  const current = t.heats.find(h => h.id === heatId);
  current.results = scoredRows(current, playerResults);
  const playerRow = current.results.find(r => r.id === PLAYER);
  const advanced = playerRow.placing <= 2 && playerRow.status === 'FINISHED';
  if (!advanced) {
    // Simulate all remaining offscreen stages after this real elimination.
    advanceAfterPlayer(t);
  } else {
    advanceAfterPlayer(t);
  }
  if (t.stage > 2) {
    return {
      ...settleCompletedEvent(original, t),
      status: 'COMPLETE', advanced: false, placing: playerRow.placing,
      finalPlace: eventPlacement(t), tournament: null,
    };
  }
  const newCircuit = { ...original, activeTournament: t };
  return {
    circuit: newCircuit, status: 'ADVANCED', advanced: true,
    placing: playerRow.placing, cashPrize: 0, tournament: t,
  };
}
