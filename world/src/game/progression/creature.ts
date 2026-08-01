import { getMove, getSpecies } from "../content/catalog";
import type { BaseStats, CreatureInstance, MoveSlot, Species } from "../types";
import { getMaxHp } from "./stats";

let nextId = 1;

export function randomIvs(): BaseStats {
  const roll = () => Math.floor(Math.random() * 32);
  return {
    hp: roll(),
    atk: roll(),
    def: roll(),
    spAtk: roll(),
    spDef: roll(),
    spd: roll(),
  };
}

export function movesForLevel(species: Species, level: number): MoveSlot[] {
  const learned = species.learnset
    .filter((e) => e.level <= level)
    .map((e) => e.moveId);
  // Keep last 4 unique moves in learn order
  const unique: string[] = [];
  for (const id of learned) {
    if (!unique.includes(id)) unique.push(id);
  }
  return unique.slice(-4).map((moveId) => ({
    moveId,
    ppRemaining: getMove(moveId).pp,
  }));
}

export function createInstance(
  speciesId: string,
  level: number,
  opts?: { ivs?: BaseStats; nickname?: string | null },
): CreatureInstance {
  const species = getSpecies(speciesId);
  const ivs = opts?.ivs ?? randomIvs();
  const instance: CreatureInstance = {
    instanceId: `c-${nextId++}-${Date.now().toString(36)}`,
    speciesId,
    nickname: opts?.nickname ?? null,
    level,
    exp: totalExpForLevel(species.growthRate, level),
    ivs,
    currentHp: 1,
    status: null,
    moves: movesForLevel(species, level),
  };
  instance.currentHp = getMaxHp(species, instance);
  return instance;
}

export function displayName(instance: CreatureInstance): string {
  if (instance.nickname) return instance.nickname;
  return getSpecies(instance.speciesId).name;
}

export function totalExpForLevel(
  growthRate: Species["growthRate"],
  level: number,
): number {
  const n = Math.max(1, level);
  let total: number;
  switch (growthRate) {
    case "fast":
      total = Math.floor(0.8 * n * n * n);
      break;
    case "slow":
      total = Math.floor(1.25 * n * n * n);
      break;
    case "mediumSlow":
      total = Math.floor((6 / 5) * n * n * n - 15 * n * n + 100 * n - 140);
      break;
    case "mediumFast":
    default:
      total = n * n * n;
  }
  return Math.max(0, total);
}

export function expToNextLevel(instance: CreatureInstance): number {
  const species = getSpecies(instance.speciesId);
  if (instance.level >= 100) return 0;
  return (
    totalExpForLevel(species.growthRate, instance.level + 1) - instance.exp
  );
}

export function cloneInstance(instance: CreatureInstance): CreatureInstance {
  return {
    ...instance,
    ivs: { ...instance.ivs },
    moves: instance.moves.map((m) => ({ ...m })),
  };
}
