import { getItem, getSpecies } from "../content/catalog";
import type { CreatureInstance, StatusCondition } from "../types";
import { getMaxHp } from "./stats";

function statusModifier(status: StatusCondition): number {
  if (status === "sleep" || status === "freeze") return 2.5;
  if (status === "paralysis" || status === "poison" || status === "burn") return 1.5;
  return 1;
}

/** Gen III+ style `a` value, capped at 255. */
export function captureValue(
  wild: CreatureInstance,
  ballId: string,
  rng: () => number = Math.random,
): { a: number; guaranteed: boolean } {
  void rng;
  const species = getSpecies(wild.speciesId);
  const maxHp = getMaxHp(species, wild);
  const ball = getItem(ballId);
  const ballModifier = ball.ballModifier ?? 1;
  const a = Math.floor(
    (((3 * maxHp - 2 * wild.currentHp) *
      species.catchRate *
      ballModifier *
      statusModifier(wild.status)) /
      (3 * maxHp)),
  );
  const capped = Math.min(255, Math.max(0, a));
  return { a: capped, guaranteed: capped >= 255 };
}

export function shakeThreshold(a: number): number {
  if (a <= 0) return 0;
  return Math.floor(65535 / Math.sqrt(Math.sqrt(255 / a)));
}

/** Returns number of successful shakes (0–4). 4 = caught. */
export function runCaptureChecks(
  wild: CreatureInstance,
  ballId: string,
  rng: () => number = Math.random,
): { shakes: number; success: boolean; a: number } {
  const { a, guaranteed } = captureValue(wild, ballId, rng);
  if (guaranteed) return { shakes: 4, success: true, a };
  const b = shakeThreshold(a);
  let shakes = 0;
  for (let i = 0; i < 4; i++) {
    const roll = Math.floor(rng() * 65536);
    if (roll < b) shakes += 1;
    else break;
  }
  return { shakes, success: shakes === 4, a };
}
