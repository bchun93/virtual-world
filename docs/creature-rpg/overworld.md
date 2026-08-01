# Overworld — grid, movement, collision, warps, encounters

The explorable world. Everything here rides on one commitment: **the world is a discrete tile grid.** Hold onto that and the hard problems become array lookups.

## Contents
- [Coordinates: two spaces, keep them straight](#coordinates-two-spaces-keep-them-straight)
- [Grid movement that feels good](#grid-movement-that-feels-good)
- [Collision](#collision)
- [Warps](#warps)
- [NPCs](#npcs)
- [The encounter roll](#the-encounter-roll)
- [Camera](#camera)

## Coordinates: two spaces, keep them straight

There are two coordinate systems and conflating them is a top source of bugs:
- **Tile space** — integer `(tileX, tileY)`. All *game logic* lives here: collision, encounters, warps, "who is standing where."
- **Pixel space** — `(pixelX, pixelY)` for *rendering* only. `pixelX = tileX * TILE_SIZE` (e.g. 16 or 32).

Rule of thumb: logic reasons in tiles; only the renderer converts to pixels. If you find yourself doing collision math in pixels, stop — you've crossed the streams.

## Grid movement that feels good

The player is always either *on* a tile or *sliding toward* the next one; you never accept new movement mid-slide. This gives the crisp, deliberate feel of the genre.

```
state: { tileX, tileY, facing, isMoving, moveProgress }

on directional input:
  if isMoving: buffer the input (don't discard it) and return
  facing = direction                       # turning in place is free
  target = (tileX,tileY) + delta(direction)
  if isBlocked(target): play bump, stay put
  else: isMoving = true; start tween to target

each frame while isMoving:
  moveProgress += speed * dt
  if moveProgress >= 1:
    tileX,tileY = target; isMoving = false; moveProgress = 0
    onEnterTile(tileX, tileY)              # <-- encounters/warps fire HERE
    if bufferedInput: consume it and step again
```

Three details that separate "feels good" from "feels stiff":
- **Turn-in-place is free.** Tapping a direction you're not facing should just rotate the sprite without moving. Otherwise the character feels like it's on ice.
- **Buffer one input.** Holding a direction, or tapping the next one slightly early, should chain into a continuous walk. Discarding input mid-tween makes movement feel laggy.
- **`onEnterTile` is the event hook.** Encounters and warps trigger on *arrival* at a tile, not mid-slide — that's what keeps them grid-aligned and predictable.

## Collision

A 2D boolean grid parallel to the map: `collision[y][x] = true` means solid. `isBlocked(target)` is one lookup plus a bounds check plus "is an NPC standing there." Author it as a dedicated collision layer in Tiled (a layer where any painted tile = solid) and bake it into the boolean array on load. This is the entire payoff of the grid: collision is O(1), not geometry.

For layered maps (bridges, ledges) add a small amount of metadata per tile (e.g. `ledgeDown` tiles that allow a one-way hop south). Keep these as tile *properties* in Tiled so they stay content, not code.

## Warps

A warp is tile-space data: `{ atTile, toMap, toTile, facingAfter }`. When `onEnterTile` lands on a warp tile: fade out → load `toMap` → place player at `toTile` facing `facingAfter` → fade in. Doors that need a step-up animation are the same thing with an extra tween. Keep warps in the map's data (`data-schemas.md`), never hardcoded, so level designers wire the world without touching engine code.

## NPCs

NPCs are grid actors like the player: they occupy a tile (so they register in collision), face a direction, and optionally move on a pattern (`static`, `wander` within a radius, `patrol` a path). Give each a small data record: position, movement type, and an interaction (dialogue tree, shop, battle trigger). Interaction fires when the player presses the action button while *facing* the NPC's tile. Movement uses the same tween as the player; a wandering NPC picks a random legal adjacent tile on a timer and refuses tiles that are blocked or occupied.

## The encounter roll

This is the seam between overworld and battle. In `onEnterTile`, if the tile belongs to an encounter zone:

```
zone = encounterZoneAt(tileX, tileY)
if zone and random() < zone.rate:
    species = weightedChoice(zone.table)          # by weight, not uniform
    level   = randInt(entry.minLevel, entry.maxLevel)
    wild    = makeInstance(species, level)        # fresh runtime instance
    startBattle(playerParty, wild)                # hand off to the battle module
```

Design notes:
- **`rate` is per-step**, so a zone with rate 0.10 averages one encounter per ~10 grass tiles walked. Tune per zone; safe paths might be 0.05, deep grass 0.15.
- **Weighted table**, so commons stay common and rares stay rare. Normalize weights at roll time.
- **The handoff is a clean data boundary:** the overworld hands the battle module a party and a wild instance and later receives a result (`caught` / `won` / `lost` / `fled`). Neither side reaches into the other's internals. This is what lets you test the battle engine headless.
- Optional quality-of-life the genre expects: a brief post-battle "no encounters" grace period, and repel-style items that suppress rolls below a level threshold.

## Camera

Center the camera on the player in pixel space and clamp it to the map bounds so you never show off-map void. For the classic feel, the camera can follow smoothly (lerp toward the player each frame) or lock to the player exactly — locked is simpler and reads as more "retro." Either way, camera is pure presentation; it never affects tile logic.
