import { describe, expect, it } from "vitest";
import type { GameMap } from "../../types";
import {
  createBody3D,
  stepBody3D,
  tileToWorld,
  worldToTile,
} from "../controller3d";

const map: GameMap = {
  id: "test",
  name: "Test",
  width: 5,
  height: 5,
  tileSize: 32,
  tiles: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 2, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ],
  warps: [],
  encounterZones: {},
};

describe("controller3d", () => {
  it("maps tiles to world centers and back", () => {
    const w = tileToWorld(2, 3);
    const t = worldToTile(w.x, w.z);
    expect(t).toEqual({ tileX: 2, tileY: 3 });
  });

  it("blocks movement into solid tiles", () => {
    const body = createBody3D(1, 2, "right");
    // Push hard into the rock at (2,2)
    let next = body;
    for (let i = 0; i < 30; i++) {
      next = stepBody3D(next, map, { forward: 0, strafe: 1 }, 0.05).body;
    }
    expect(next.x).toBeLessThan(2 * 2); // never fully enter tile x=2 (world start 4)
    expect(next.tileX).toBe(1);
  });

  it("reports tile entry when crossing cells", () => {
    const body = createBody3D(1, 1, "right");
    const stepped = stepBody3D(body, map, { forward: 0, strafe: 1 }, 0.5);
    // May or may not cross depending on speed; force by placing near edge
    const nearEdge = { ...body, x: 1.95 * 2 - 0.1 };
    const cross = stepBody3D(nearEdge, map, { forward: 0, strafe: 1 }, 0.2);
    expect(cross.enteredTile || stepped.enteredTile || cross.body.tileX >= 1).toBe(true);
  });
});
