export type ElementType =
  | "neutral"
  | "fire"
  | "water"
  | "nature"
  | "electric"
  | "earth"
  | "air"
  | "ice"
  | "metal"
  | "toxic"
  | "light"
  | "shadow";

export type StatKey = "hp" | "atk" | "def" | "spAtk" | "spDef" | "spd";
export type GrowthRate = "fast" | "mediumFast" | "mediumSlow" | "slow";
export type MoveCategory = "physical" | "special" | "status";
export type StatusCondition = "burn" | "poison" | "paralysis" | "sleep" | "freeze" | null;
export type Direction = "up" | "down" | "left" | "right";

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spAtk: number;
  spDef: number;
  spd: number;
}

export interface LearnsetEntry {
  level: number;
  moveId: string;
}

export interface Evolution {
  toSpeciesId: string;
  trigger: "level" | "item" | "friendship" | "trade";
  value: number | string;
}

export interface Species {
  id: string;
  name: string;
  types: ElementType[];
  baseStats: BaseStats;
  catchRate: number;
  growthRate: GrowthRate;
  baseExpYield: number;
  learnset: LearnsetEntry[];
  evolutions: Evolution[];
  spriteFront?: string;
  spriteBack?: string;
}

export type MoveEffect =
  | { kind: "status"; status: Exclude<StatusCondition, null> }
  | { kind: "statusChance"; status: Exclude<StatusCondition, null>; chance: number }
  | { kind: "statStage"; stat: Exclude<StatKey, "hp">; stages: number };

export interface Move {
  id: string;
  name: string;
  type: ElementType;
  category: MoveCategory;
  power: number;
  accuracy: number | null;
  pp: number;
  priority: number;
  target: "opponent" | "self";
  effect?: MoveEffect;
}

export interface MoveSlot {
  moveId: string;
  ppRemaining: number;
}

export interface CreatureInstance {
  instanceId: string;
  speciesId: string;
  nickname: string | null;
  level: number;
  exp: number;
  ivs: BaseStats;
  currentHp: number;
  status: StatusCondition;
  moves: MoveSlot[];
}

export interface TypeChart {
  types: ElementType[];
  default: number;
  chart: Partial<Record<ElementType, Partial<Record<ElementType, number>>>>;
}

export interface EncounterEntry {
  speciesId: string;
  weight: number;
  minLevel: number;
  maxLevel: number;
}

export interface EncounterZone {
  rate: number;
  table: EncounterEntry[];
}

export interface Warp {
  atTile: [number, number];
  toMap: string;
  toTile: [number, number];
  facingAfter?: Direction;
}

export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tileSize: number;
  /** 0 = walkable, 1 = solid, 2 = tall grass / encounter */
  tiles: number[][];
  warps: Warp[];
  encounterZones: Record<string, EncounterZone>;
}

export interface Item {
  id: string;
  name: string;
  category: "ball" | "heal" | "key";
  ballModifier?: number;
  heal?: number;
  usableIn: Array<"battle" | "overworld">;
}

export type GameMode = "title" | "starter" | "overworld" | "battle" | "menu" | "dialogue";

export interface PlayerState {
  name: string;
  mapId: string;
  tile: [number, number];
  facing: Direction;
}

export interface SaveData {
  version: number;
  player: PlayerState;
  party: CreatureInstance[];
  boxes: CreatureInstance[][];
  inventory: Record<string, number>;
  flags: Record<string, boolean>;
  seen: string[];
  caught: string[];
}

export type BattleSide = "player" | "opponent";

export type BattleAction =
  | { kind: "move"; moveId: string; actor: BattleSide }
  | { kind: "switch"; instanceId: string; actor: BattleSide }
  | { kind: "item"; itemId: string; actor: BattleSide }
  | { kind: "flee"; actor: BattleSide };

export type BattleEvent =
  | { type: "turnStart"; turn: number }
  | { type: "message"; text: string }
  | { type: "moveUsed"; actor: BattleSide; moveId: string; moveName: string }
  | { type: "miss"; actor: BattleSide }
  | {
      type: "damage";
      actor: BattleSide;
      target: BattleSide;
      amount: number;
      effectiveness: number;
      critical: boolean;
      remainingHp: number;
    }
  | { type: "statusApplied"; target: BattleSide; status: Exclude<StatusCondition, null> }
  | { type: "statStage"; target: BattleSide; stat: Exclude<StatKey, "hp">; stages: number }
  | { type: "faint"; side: BattleSide }
  | { type: "statusSkip"; side: BattleSide; status: Exclude<StatusCondition, null> }
  | { type: "statusChip"; side: BattleSide; amount: number; status: Exclude<StatusCondition, null> }
  | { type: "captureAttempt"; shakes: number; success: boolean }
  | { type: "fled"; success: boolean }
  | { type: "expGain"; instanceId: string; amount: number; leveledTo?: number }
  | { type: "battleEnd"; result: BattleResult };

export type BattleResult = "won" | "lost" | "fled" | "caught";

export interface BattleCreatureView {
  instance: CreatureInstance;
  maxHp: number;
  stages: Record<Exclude<StatKey, "hp">, number>;
  sleepTurns: number;
}

export interface BattleState {
  player: BattleCreatureView;
  opponent: BattleCreatureView;
  playerParty: CreatureInstance[];
  turn: number;
  over: boolean;
  result: BattleResult | null;
  log: BattleEvent[];
  wild: boolean;
}
