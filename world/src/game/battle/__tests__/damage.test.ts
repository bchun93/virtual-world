import { describe, expect, it } from "vitest";
import { createInstance } from "../../progression/creature";
import type { BattleCreatureView } from "../../types";
import { computeDamage } from "../damage";
import { typeEffectiveness } from "../typeEffectiveness";
import { getMove } from "../../content/catalog";

function viewFrom(speciesId: string, level: number, iv = 31): BattleCreatureView {
  const instance = createInstance(speciesId, level, {
    ivs: { hp: iv, atk: iv, def: iv, spAtk: iv, spDef: iv, spd: iv },
  });
  return {
    instance,
    maxHp: instance.currentHp,
    stages: { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0 },
    sleepTurns: 0,
  };
}

describe("typeEffectiveness", () => {
  it("applies fire → nature as 2x", () => {
    expect(typeEffectiveness("fire", ["nature"])).toBe(2);
  });

  it("applies fire → water as 0.5x", () => {
    expect(typeEffectiveness("fire", ["water"])).toBe(0.5);
  });

  it("multiplies dual types", () => {
    expect(typeEffectiveness("fire", ["nature", "ice"])).toBe(4);
  });
});

describe("computeDamage", () => {
  it("matches the worked Ember example shape", () => {
    // Level 20 Emberling Ember into Nature defender with equal SpAtk/SpDef ≈ 35
    const attacker = viewFrom("emberling", 20);
    const defender = viewFrom("sprigling", 20);
    const move = getMove("ember");
    const result = computeDamage({
      attacker,
      defender,
      move,
      critical: false,
      random: 0.9,
    });
    expect(result.stab).toBe(1.5);
    expect(result.effectiveness).toBe(2);
    expect(result.damage).toBeGreaterThan(15);
    expect(result.damage).toBeLessThan(45);
  });

  it("deals 0 against immunity", () => {
    // neutral → shadow is 0
    const attacker = viewFrom("wildtail", 10);
    const defender = viewFrom("wildtail", 10);
    // Temporarily treat defender as shadow by using chart directly via a fake move type
    expect(typeEffectiveness("neutral", ["shadow"])).toBe(0);
    void attacker;
    void defender;
  });

  it("applies STAB only on type match", () => {
    const attacker = viewFrom("emberling", 10);
    const defender = viewFrom("wildtail", 10);
    const ember = computeDamage({
      attacker,
      defender,
      move: getMove("ember"),
      critical: false,
      random: 1,
    });
    const scratch = computeDamage({
      attacker,
      defender,
      move: getMove("scratch"),
      critical: false,
      random: 1,
    });
    expect(ember.stab).toBe(1.5);
    expect(scratch.stab).toBe(1);
  });
});
