import type { Direction, GameMap } from "../types";

export interface OverworldActor {
  tileX: number;
  tileY: number;
  facing: Direction;
  isMoving: boolean;
  moveProgress: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export const DELTA: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export function createActor(
  tileX: number,
  tileY: number,
  facing: Direction = "down",
): OverworldActor {
  return {
    tileX,
    tileY,
    facing,
    isMoving: false,
    moveProgress: 0,
    fromX: tileX,
    fromY: tileY,
    toX: tileX,
    toY: tileY,
  };
}

export function isBlocked(map: GameMap, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return true;
  return map.tiles[y][x] === 1;
}

export function encounterZoneAt(
  map: GameMap,
  x: number,
  y: number,
): string | null {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return null;
  return map.tiles[y][x] === 2 ? "tall_grass" : null;
}

export function tryStartMove(
  actor: OverworldActor,
  map: GameMap,
  dir: Direction,
): { actor: OverworldActor; bumped: boolean } {
  if (actor.isMoving) return { actor, bumped: false };

  const next = { ...actor, facing: dir };
  const [dx, dy] = DELTA[dir];
  const tx = actor.tileX + dx;
  const ty = actor.tileY + dy;
  if (isBlocked(map, tx, ty)) {
    return { actor: next, bumped: true };
  }
  return {
    actor: {
      ...next,
      isMoving: true,
      moveProgress: 0,
      fromX: actor.tileX,
      fromY: actor.tileY,
      toX: tx,
      toY: ty,
    },
    bumped: false,
  };
}

export function advanceMove(
  actor: OverworldActor,
  dt: number,
  speed = 5,
): { actor: OverworldActor; arrived: boolean } {
  if (!actor.isMoving) return { actor, arrived: false };
  const progress = actor.moveProgress + speed * dt;
  if (progress >= 1) {
    return {
      actor: {
        ...actor,
        tileX: actor.toX,
        tileY: actor.toY,
        fromX: actor.toX,
        fromY: actor.toY,
        isMoving: false,
        moveProgress: 0,
      },
      arrived: true,
    };
  }
  return { actor: { ...actor, moveProgress: progress }, arrived: false };
}

export function pixelPosition(
  actor: OverworldActor,
  tileSize: number,
): { x: number; y: number } {
  if (!actor.isMoving) {
    return { x: actor.tileX * tileSize, y: actor.tileY * tileSize };
  }
  const x =
    (actor.fromX + (actor.toX - actor.fromX) * actor.moveProgress) * tileSize;
  const y =
    (actor.fromY + (actor.toY - actor.fromY) * actor.moveProgress) * tileSize;
  return { x, y };
}
