import { getTypeChart } from "../content/catalog";
import type { ElementType } from "../types";

export function typeEffectiveness(
  moveType: ElementType,
  defenderTypes: ElementType[],
): number {
  const chart = getTypeChart();
  let m = 1;
  for (const t of defenderTypes) {
    const row = chart.chart[moveType];
    const mult = row?.[t] ?? chart.default;
    m *= mult;
  }
  return m;
}

export function effectivenessLabel(mult: number): string {
  if (mult === 0) return "It had no effect…";
  if (mult >= 2) return "It's super effective!";
  if (mult < 1) return "It's not very effective…";
  return "";
}
