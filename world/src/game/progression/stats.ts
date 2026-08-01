import type { BaseStats, CreatureInstance, Species, StatKey } from "../types";

export function deriveMaxHp(base: number, iv: number, level: number): number {
  return Math.floor(((2 * base + iv) * level) / 100) + level + 10;
}

export function deriveStat(base: number, iv: number, level: number): number {
  return Math.floor(((2 * base + iv) * level) / 100) + 5;
}

export function getDerivedStats(species: Species, instance: CreatureInstance): BaseStats {
  const { baseStats } = species;
  const { ivs, level } = instance;
  return {
    hp: deriveMaxHp(baseStats.hp, ivs.hp, level),
    atk: deriveStat(baseStats.atk, ivs.atk, level),
    def: deriveStat(baseStats.def, ivs.def, level),
    spAtk: deriveStat(baseStats.spAtk, ivs.spAtk, level),
    spDef: deriveStat(baseStats.spDef, ivs.spDef, level),
    spd: deriveStat(baseStats.spd, ivs.spd, level),
  };
}

export function getMaxHp(species: Species, instance: CreatureInstance): number {
  return getDerivedStats(species, instance).hp;
}

/** Stage multiplier: -6..+6 → classic table */
export function stageMultiplier(stage: number): number {
  const s = Math.max(-6, Math.min(6, stage));
  if (s >= 0) return (2 + s) / 2;
  return 2 / (2 - s);
}

export function effectiveStat(
  species: Species,
  instance: CreatureInstance,
  key: Exclude<StatKey, "hp">,
  stage = 0,
): number {
  const base = getDerivedStats(species, instance)[key];
  return Math.max(1, Math.floor(base * stageMultiplier(stage)));
}
