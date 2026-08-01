import { getMove, getSpecies } from "../content/catalog";
import { effectiveStat } from "../progression/stats";
import type { BattleCreatureView, Move } from "../types";
import { typeEffectiveness } from "./typeEffectiveness";

export interface DamageInput {
  attacker: BattleCreatureView;
  defender: BattleCreatureView;
  move: Move;
  critical?: boolean;
  random?: number; // 0.85–1.0
}

export interface DamageResult {
  damage: number;
  effectiveness: number;
  stab: number;
  critical: boolean;
  base: number;
}

export function computeDamage(input: DamageInput): DamageResult {
  const { attacker, defender, move } = input;
  if (move.category === "status" || move.power <= 0) {
    return { damage: 0, effectiveness: 1, stab: 1, critical: false, base: 0 };
  }

  const atkSpecies = getSpecies(attacker.instance.speciesId);
  const defSpecies = getSpecies(defender.instance.speciesId);
  const level = attacker.instance.level;

  const isPhysical = move.category === "physical";
  let attack = effectiveStat(
    atkSpecies,
    attacker.instance,
    isPhysical ? "atk" : "spAtk",
    attacker.stages[isPhysical ? "atk" : "spAtk"],
  );
  let defense = effectiveStat(
    defSpecies,
    defender.instance,
    isPhysical ? "def" : "spDef",
    // Crits ignore positive defense stages
    input.critical && defender.stages[isPhysical ? "def" : "spDef"] > 0
      ? 0
      : defender.stages[isPhysical ? "def" : "spDef"],
  );

  if (attacker.instance.status === "burn" && isPhysical) {
    attack = Math.max(1, Math.floor(attack / 2));
  }

  const base =
    (((2 * level) / 5 + 2) * move.power * (attack / defense)) / 50 + 2;

  const stab = atkSpecies.types.includes(move.type) ? 1.5 : 1;
  const effectiveness = typeEffectiveness(move.type, defSpecies.types);
  const critical = input.critical ? 1.5 : 1;
  const random = input.random ?? 1;

  const damage = Math.max(
    1,
    Math.floor(base * stab * effectiveness * critical * random),
  );

  // Immunity still deals 0
  if (effectiveness === 0) {
    return { damage: 0, effectiveness, stab, critical: !!input.critical, base };
  }

  return {
    damage,
    effectiveness,
    stab,
    critical: !!input.critical,
    base,
  };
}

export function rollRandomFactor(rng: () => number): number {
  // 16 discrete values in [0.85, 1.00]
  const idx = Math.floor(rng() * 16);
  return (85 + idx) / 100;
}

export function rollCritical(rng: () => number): boolean {
  return rng() < 1 / 16;
}

export function getMoveOrThrow(moveId: string): Move {
  return getMove(moveId);
}
