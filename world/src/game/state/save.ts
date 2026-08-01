import type { SaveData } from "../types";

const SAVE_KEY = "aether-creature-rpg-save-v1";

export function createNewSave(playerName: string): SaveData {
  return {
    version: 1,
    player: {
      name: playerName,
      mapId: "meadow_edge",
      tile: [2, 6],
      facing: "down",
    },
    party: [],
    boxes: [[]],
    inventory: { aetherball: 10, greatball: 3, potion: 5 },
    flags: {},
    seen: [],
    caught: [],
  };
}

export function saveGame(data: SaveData): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function loadGame(): SaveData | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SaveData;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function hasSave(): boolean {
  return Boolean(localStorage.getItem(SAVE_KEY));
}
