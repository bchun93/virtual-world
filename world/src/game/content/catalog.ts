import itemsJson from "../../content/items.json";
import meadowEdge from "../../content/maps/meadow_edge.json";
import speciesJson from "../../content/species.json";
import typeChartJson from "../../content/type_chart.json";
import type { GameMap, Item, Move, Species, TypeChart } from "../types";

const species = speciesJson.species as Record<string, Species>;
const moves = speciesJson.moves as Record<string, Move>;
const items = itemsJson.items as Record<string, Item>;
const typeChart = typeChartJson as TypeChart;
const maps: Record<string, GameMap> = {
  meadow_edge: meadowEdge as GameMap,
};

export function getSpecies(id: string): Species {
  const s = species[id];
  if (!s) throw new Error(`Unknown species: ${id}`);
  return s;
}

export function getMove(id: string): Move {
  const m = moves[id];
  if (!m) throw new Error(`Unknown move: ${id}`);
  return m;
}

export function getItem(id: string): Item {
  const item = items[id];
  if (!item) throw new Error(`Unknown item: ${id}`);
  return item;
}

export function getMap(id: string): GameMap {
  const map = maps[id];
  if (!map) throw new Error(`Unknown map: ${id}`);
  return map;
}

export function getTypeChart(): TypeChart {
  return typeChart;
}

export function listStarters(): Species[] {
  return ["emberling", "tadsplash", "sprigling"].map(getSpecies);
}

export function allSpecies(): Species[] {
  return Object.values(species);
}

export function allMoves(): Move[] {
  return Object.values(moves);
}

export function validateContent(): string[] {
  const errors: string[] = [];
  for (const s of Object.values(species)) {
    for (const entry of s.learnset) {
      if (!moves[entry.moveId]) {
        errors.push(`${s.id} learnset references missing move ${entry.moveId}`);
      }
    }
    for (const evo of s.evolutions) {
      if (!species[evo.toSpeciesId]) {
        errors.push(`${s.id} evolves into missing ${evo.toSpeciesId}`);
      }
    }
  }
  for (const map of Object.values(maps)) {
    for (const zone of Object.values(map.encounterZones)) {
      for (const row of zone.table) {
        if (!species[row.speciesId]) {
          errors.push(`${map.id} encounter references missing ${row.speciesId}`);
        }
      }
    }
  }
  return errors;
}

export { species, moves, items, maps, typeChart };
