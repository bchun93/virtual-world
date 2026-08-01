import type { CreatureInstance, EncounterZone } from "../types";
import { createInstance } from "../progression/creature";

export function weightedChoice<T extends { weight: number }>(
  table: T[],
  rng: () => number = Math.random,
): T {
  const total = table.reduce((sum, row) => sum + row.weight, 0);
  let roll = rng() * total;
  for (const row of table) {
    roll -= row.weight;
    if (roll <= 0) return row;
  }
  return table[table.length - 1];
}

export function rollEncounter(
  zone: EncounterZone,
  rng: () => number = Math.random,
): CreatureInstance | null {
  if (rng() >= zone.rate) return null;
  const entry = weightedChoice(zone.table, rng);
  const span = entry.maxLevel - entry.minLevel + 1;
  const level = entry.minLevel + Math.floor(rng() * span);
  return createInstance(entry.speciesId, level);
}
