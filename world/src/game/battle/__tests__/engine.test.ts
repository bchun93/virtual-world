import { describe, expect, it } from "vitest";
import { createInstance } from "../../progression/creature";
import { createBattle, runTurn } from "../engine";

function fixedRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length];
    i += 1;
    return v;
  };
}

describe("battle engine", () => {
  it("creates a wild battle with conscious lead", () => {
    const party = [createInstance("emberling", 5)];
    const wild = createInstance("wildtail", 3);
    const battle = createBattle(party, wild);
    expect(battle.over).toBe(false);
    expect(battle.player.instance.speciesId).toBe("emberling");
    expect(battle.opponent.instance.speciesId).toBe("wildtail");
  });

  it("resolves a player move and reduces foe HP", () => {
    const party = [createInstance("emberling", 10)];
    const wild = createInstance("sprigling", 5);
    let battle = createBattle(party, wild);
    const before = battle.opponent.instance.currentHp;
    // rng: crit no, random high, accuracy hit, opponent accuracy/crit/etc.
    const rng = fixedRng([0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99]);
    battle = runTurn(
      battle,
      { kind: "move", moveId: "ember", actor: "player" },
      rng,
    );
    expect(battle.opponent.instance.currentHp).toBeLessThan(before);
    expect(battle.log.some((e) => e.type === "moveUsed")).toBe(true);
  });

  it("ends in caught when capture checks always pass", () => {
    const party = [createInstance("emberling", 5)];
    const wild = createInstance("wildtail", 2);
    wild.currentHp = 1;
    let battle = createBattle(party, wild);
    // First rolls used by capture (4 shakes) — all pass with 0
    const rng = fixedRng([0, 0, 0, 0, 0, 0]);
    battle = runTurn(
      battle,
      { kind: "item", itemId: "aetherball", actor: "player" },
      rng,
    );
    expect(battle.over).toBe(true);
    expect(battle.result).toBe("caught");
  });
});
