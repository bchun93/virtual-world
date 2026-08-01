# 3D Overworld & Physics Notes (Aether)

This project follows the **3D path** for the overworld while keeping battle, species data, and progression **dimension-agnostic**.

## What we use

| Concern | Choice |
|---|---|
| Web engine | **Three.js** (WebGL) inside the existing React/Vite app |
| Character movement | **Kinematic controller** — wish velocity + discrete collision tests |
| Collision | Circle vs tile AABB against solid map tiles |
| Encounters | Still data-driven: entering a tall-grass tile rolls the zone table |
| Battle / XP / capture | Unchanged pure modules |

## Why kinematic (not rigid-body walking)

Physics-driven character movement fights the genre’s feel: slippery acceleration, slope jitter, hard-to-tune “walk.” A kinematic step (`controller3d.ts`) moves the capsule with input, then resolves walls. Gravity/jumps can be added later without making walking a physics puzzle.

## Map authorship

Meadow Edge remains a **tile grid in JSON**. Tiles are extruded into 3D (ground, rocks, grass clumps). Logic stays tile lookups; rendering is continuous world space (`TILE_WORLD` units per cell).

## Files

- `world/src/game/overworld/controller3d.ts` — body + step + collision
- `world/src/game/overworld/scene3d.ts` — lights, meshes, camera
- `world/src/components/game/Overworld3D.tsx` — input + render loop
