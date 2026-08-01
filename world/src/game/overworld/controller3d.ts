import type { Direction, GameMap } from "../types";
import { isBlocked } from "./movement";

/** World units per map tile. */
export const TILE_WORLD = 2;

export interface Body3D {
  x: number;
  z: number;
  yaw: number;
  tileX: number;
  tileY: number;
  facing: Direction;
  radius: number;
}

export interface MoveInput {
  forward: number; // -1..1 (W/S)
  strafe: number; // -1..1 (A/D)
}

export function tileToWorld(tileX: number, tileY: number): { x: number; z: number } {
  return {
    x: (tileX + 0.5) * TILE_WORLD,
    z: (tileY + 0.5) * TILE_WORLD,
  };
}

export function worldToTile(x: number, z: number): { tileX: number; tileY: number } {
  return {
    tileX: Math.floor(x / TILE_WORLD),
    tileY: Math.floor(z / TILE_WORLD),
  };
}

export function createBody3D(
  tileX: number,
  tileY: number,
  facing: Direction = "down",
): Body3D {
  const { x, z } = tileToWorld(tileX, tileY);
  return {
    x,
    z,
    yaw: facingToYaw(facing),
    tileX,
    tileY,
    facing,
    radius: 0.35,
  };
}

export function facingToYaw(facing: Direction): number {
  switch (facing) {
    case "up":
      return Math.PI;
    case "down":
      return 0;
    case "left":
      return Math.PI / 2;
    case "right":
      return -Math.PI / 2;
  }
}

export function yawToFacing(yaw: number): Direction {
  const a = ((yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  if (a >= Math.PI * 0.25 && a < Math.PI * 0.75) return "left";
  if (a >= Math.PI * 0.75 && a < Math.PI * 1.25) return "up";
  if (a >= Math.PI * 1.25 && a < Math.PI * 1.75) return "right";
  return "down";
}

function circleHitsBlockedTile(
  map: GameMap,
  x: number,
  z: number,
  radius: number,
): boolean {
  const minTX = Math.floor((x - radius) / TILE_WORLD);
  const maxTX = Math.floor((x + radius) / TILE_WORLD);
  const minTY = Math.floor((z - radius) / TILE_WORLD);
  const maxTY = Math.floor((z + radius) / TILE_WORLD);

  for (let ty = minTY; ty <= maxTY; ty++) {
    for (let tx = minTX; tx <= maxTX; tx++) {
      if (!isBlocked(map, tx, ty)) continue;
      // AABB of tile in world space
      const minX = tx * TILE_WORLD;
      const maxX = (tx + 1) * TILE_WORLD;
      const minZ = ty * TILE_WORLD;
      const maxZ = (ty + 1) * TILE_WORLD;
      const cx = Math.max(minX, Math.min(x, maxX));
      const cz = Math.max(minZ, Math.min(z, maxZ));
      const dx = x - cx;
      const dz = z - cz;
      if (dx * dx + dz * dz < radius * radius) return true;
    }
  }
  return false;
}

/**
 * Kinematic character step — move with wish velocity, slide on walls.
 * Not physics-driven (no rigidbody integration); collision is discrete AABB tests.
 */
export function stepBody3D(
  body: Body3D,
  map: GameMap,
  input: MoveInput,
  dt: number,
  speed = 4.2,
): { body: Body3D; enteredTile: boolean } {
  let { x, z, yaw } = body;
  const wishX = input.strafe;
  const wishZ = input.forward;
  const mag = Math.hypot(wishX, wishZ);

  if (mag > 0.001) {
    const nx = wishX / mag;
    const nz = wishZ / mag;
    yaw = Math.atan2(-nx, nz);

    const dx = nx * speed * dt;
    const dz = nz * speed * dt;

    // Axis-separated resolution for sliding along walls
    const tryX = x + dx;
    if (!circleHitsBlockedTile(map, tryX, z, body.radius)) x = tryX;
    const tryZ = z + dz;
    if (!circleHitsBlockedTile(map, x, tryZ, body.radius)) z = tryZ;
  }

  const { tileX, tileY } = worldToTile(x, z);
  const enteredTile = tileX !== body.tileX || tileY !== body.tileY;
  return {
    body: {
      ...body,
      x,
      z,
      yaw,
      tileX,
      tileY,
      facing: yawToFacing(yaw),
    },
    enteredTile,
  };
}
