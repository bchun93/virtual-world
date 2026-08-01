import { getSpecies } from "../content/catalog";
import type { CreatureInstance } from "../types";
import { cloneInstance, movesForLevel, totalExpForLevel } from "./creature";
import { getMaxHp } from "./stats";

export function expGainFromDefeat(
  defeatedSpeciesId: string,
  defeatedLevel: number,
): number {
  const yieldBase = getSpecies(defeatedSpeciesId).baseExpYield;
  return Math.floor((yieldBase * defeatedLevel) / 7);
}

export interface LevelUpResult {
  instance: CreatureInstance;
  levelsGained: number;
  newMoves: string[];
  evolvedTo: string | null;
}

export function applyExp(
  instance: CreatureInstance,
  amount: number,
  opts?: { allowEvolution?: boolean },
): LevelUpResult {
  const allowEvolution = opts?.allowEvolution ?? true;
  let next = cloneInstance(instance);
  next.exp += amount;
  let levelsGained = 0;
  const newMoves: string[] = [];
  let evolvedTo: string | null = null;

  const species = () => getSpecies(next.speciesId);

  while (next.level < 100) {
    const need = totalExpForLevel(species().growthRate, next.level + 1);
    if (next.exp < need) break;
    next.level += 1;
    levelsGained += 1;

    const beforeMoves = new Set(next.moves.map((m) => m.moveId));
    const leveledMoves = movesForLevel(species(), next.level);
    for (const slot of leveledMoves) {
      if (!beforeMoves.has(slot.moveId) && next.moves.length < 4) {
        next.moves.push(slot);
        newMoves.push(slot.moveId);
      } else if (!beforeMoves.has(slot.moveId)) {
        // Auto-replace oldest if full — keep simple for vertical slice
        next.moves = [...next.moves.slice(1), slot];
        newMoves.push(slot.moveId);
      }
    }

    if (allowEvolution) {
      const evo = species().evolutions.find(
        (e) => e.trigger === "level" && typeof e.value === "number" && next.level >= e.value,
      );
      if (evo) {
        next.speciesId = evo.toSpeciesId;
        evolvedTo = evo.toSpeciesId;
      }
    }

    const max = getMaxHp(species(), next);
    next.currentHp = Math.min(max, next.currentHp + Math.floor(max * 0.1));
  }

  // Clamp HP to new max after any base-stat change
  next.currentHp = Math.min(getMaxHp(species(), next), next.currentHp);
  return { instance: next, levelsGained, newMoves, evolvedTo };
}
