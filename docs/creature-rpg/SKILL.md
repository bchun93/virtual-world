---
name: creature-rpg
description: Build tile-based creature-collector RPGs in the Pokémon/Temtem/Cassette-Beasts genre — a walkable overworld, wild encounters, turn-based creature battles with types and stats, capturing, party/storage, leveling, and evolution. Use this WHENEVER the user wants to build, design, or extend a monster-taming / creature-collecting / "Pokémon-like" / "catch-and-battle" game, an overworld tilemap RPG, a turn-based battle engine, a type-effectiveness system, a creature/species data model, or any subsystem of one (encounters, capture mechanics, movesets, evolution, save systems). Trigger even if the user only names one piece ("write me a damage formula", "how should I structure my monster data", "grid movement for an RPG") — those are almost always part of this larger genre and this skill has the surrounding architecture they'll need next.
---

# Creature-Collector RPG Builder

A skill for building original creature-collector RPGs: a walkable overworld where players explore, encounter wild creatures, battle them in a turn-based system driven by stats and types, capture them, build a party, and grow it through leveling and evolution.

## Read this first: the one decision that shapes everything

**Separate the *engine* (rules) from the *content* (data). Author content as data files, not code.**

A creature-collector is ~90% content (dozens–hundreds of species, moves, maps, NPCs, items) and ~10% systems (the rules that operate on that content). If species and moves are hardcoded into logic, every new creature is a code change and the project collapses under its own weight around creature #15. If content is *data* (JSON/config) and the systems are *generic interpreters* of that data, then adding a creature is editing a file, the engine stays small and stable, and non-programmers (or an agent, or the user's "game developers") can author the world without touching code. This is how every real game in the genre is built (Pokémon Essentials, RPG Maker, Godot-based tamers).

Everything below follows from this. The schemas in `references/data-schemas.md` are the contract between engine and content — design them first.

## Mental model: the game is a state machine over a grid

Two structural facts drive the whole architecture. Internalize them before writing code.

**1. At any instant the game is in exactly ONE mode.** Overworld, Battle, Dialogue, Menu, or Transition. Each mode owns its own input handling and rendering. Do not blur them — that is the source of the classic bugs (movement firing mid-battle, menu input leaking to the map). Implement an explicit finite state machine / scene stack. Input and update route to the active state only.

**2. The overworld is a discrete grid, not continuous space.** A creature's position is integer tile coordinates `(tileX, tileY)`. "Walking" is a visual tween between adjacent tiles while logically you are always *on* a tile or *moving to* the next one. This is not just retro aesthetic — it makes four otherwise-hard problems trivial lookups: collision (`collisionGrid[y][x]`), encounters ("is this an encounter tile? roll RNG"), warps (tile → destination map+tile), and NPC pathing (grid steps). Continuous physics would make all of these dramatically harder for zero gameplay gain. Reach for the grid.

## Build order (why this sequence, not another)

Dependencies dictate order, and you want a *playable vertical slice* as early as possible so problems surface early. Build in this order:

1. **Schemas + a tiny content set.** Define species/move/type data structures (`references/data-schemas.md`) and author just enough to test: 2–3 species, ~6 moves, the type chart (`assets/type_chart.json`). This is the contract; everything else consumes it.
2. **Battle engine as a pure, testable module.** Write damage, turn resolution, and capture as *pure functions* with no rendering, no framework, no global state — inputs in, results out. Unit-test the damage formula and type interactions *before* drawing a single sprite. Battles are where the fun and the bugs live; you want them verifiable in isolation. See `references/battle-engine.md`.
3. **Overworld: tilemap render + grid movement + collision.** Load a map, draw it, move the player tile-by-tile, block on solid tiles. See `references/overworld.md`.
4. **Encounters.** Tie encounter tiles → RNG roll → hand off game state to the battle module. This is the seam where overworld meets battle; keep the handoff a clean data boundary (pass in the wild creature, get back a result: caught / fainted / fled).
5. **Party, capture, storage, and progression.** Party of N, capture flow, a storage box for overflow, XP/leveling, and evolution. See `references/progression.md`.
6. **Save/load.** Serialize the entire game state to JSON (localStorage for web, a file otherwise). If step 5 kept state in plain serializable objects, this is nearly free — which is a reason to keep it so.
7. **Content expansion + polish.** Now that the loop is playable end-to-end, scale content and add juice (animations, sound, UI transitions).

The meta-principle: **engine before content, logic before graphics, one full vertical slice before breadth.** A player who can walk → encounter → battle → catch → save is a real game; everything after is expansion.

## Tech stack (recommendation + tradeoffs)

There is no single right answer; match the stack to the goal. First-principles tradeoff: the overworld wants a real 2D engine (tilemaps, sprites, animation, input, scenes are tedious to hand-roll), while the battle engine wants to be *plain, portable, testable code* independent of any engine. So the strong pattern regardless of stack is: **battle logic as a framework-agnostic module; the game engine only for I/O and rendering.**

| Stack | Best when | Cost / tradeoff |
|---|---|---|
| **TypeScript + Phaser 3** (recommended default) | Want a shippable *web* game, zero-install sharing, fast overworld via built-in Tiled tilemap + sprite + scene support | Phaser is a dependency with its own API to learn; you inherit its scene lifecycle |
| **TypeScript + plain Canvas** | Want full control, minimal deps, a teaching exercise | You reimplement tilemap loading, animation, input — more code, more bugs |
| **Godot 4 (GDScript)** | Want a "real," polished game exportable to web/desktop/mobile; best-in-class 2D tilemap editor | Separate toolchain, not web-native authoring, steeper ramp |
| **Python + pygame** | Prototyping *logic* fast; battle engine as a clean testable library | Weakest for polished overworld/animation; hardest to ship to players |

Recommendation: **TypeScript + Phaser 3 for a web creature-RPG, with the battle engine written as a pure TS module** — confidence 8/10 for "shippable and shareable." If the user's north star is a commercial-quality standalone game, **Godot** instead (confidence 8/10 for that goal). If they only want to nail the battle math or explicitly prefer Python, **pygame/Python** for the logic module is fine (confidence 7/10, lower only because shipping to players is harder).

**Author maps in [Tiled](https://www.mapeditor.org/), not by hand.** Export to JSON/TMX and load them. Hand-coding map arrays does not scale past a couple of screens, and reinforces the same data-driven separation: maps become content, not code. Phaser and Godot both import Tiled directly.

## The two formulas at the heart of the genre

These are grounded in the standard mechanics of the genre (sources in the reference files). Use them as the starting point and tune the constants for your game's feel.

**Damage** (per hit, physical/special chosen by move category):
```
base = ((2 * Level / 5 + 2) * Power * Attack / Defense) / 50 + 2
damage = floor(base * STAB * TypeEffectiveness * Critical * Random)
```
where `STAB` = 1.5 if the move's type matches the attacker's type else 1; `TypeEffectiveness` comes from the type chart (product across the defender's types: 0, 0.25, 0.5, 1, 2, or 4); `Critical` = 1.5 (or 1); `Random` ∈ [0.85, 1.0]. `Attack`/`Defense` use the physical or special stat per the move's category. Full derivation and worked example in `references/battle-engine.md`.

**Capture** (Gen III+ style):
```
a = ((3*maxHP - 2*currentHP) * catchRate * ballModifier * statusModifier) / (3*maxHP)
```
Lower current HP and a status condition raise `a`; then run shake checks against `a` to decide capture. Full derivation in `references/progression.md`.

Type effectiveness is the single highest-leverage lever for battle feel — it's what makes team-building a puzzle. It is just a lookup matrix; ship a coherent one early (`assets/type_chart.json`) and tune it.

## Reference files — read the one you're working on

Load these as you reach the corresponding subsystem; don't front-load all of them.

- **`references/data-schemas.md`** — The engine↔content contract. Species, moves, type chart, maps, encounter tables, items, and the runtime *instance* vs. static *species* distinction. **Read this before writing any other code.**
- **`references/battle-engine.md`** — Turn structure, action priority + Speed ordering, the damage formula derived from first principles, status conditions, accuracy, stat stages, and a simple opponent AI. Read at build step 2.
- **`references/overworld.md`** — Tile grid, movement tween + input buffering, collision layers, warps, NPCs, and the encounter roll. Read at build steps 3–4.
- **`references/progression.md`** — XP curves, leveling, evolution triggers, capture math, party/box storage, and save serialization. Read at build step 5.

## Assets — usable starting content

- **`assets/type_chart.json`** — A coherent, original 12-type effectiveness matrix ready to load. A starting point to tune, not a balance guarantee.
- **`assets/example_species.json`** — Three original starter creatures (with evolutions) and a small move set, demonstrating the schemas as working content.

## Make it *original* — a genre, not a clone (important)

Build in the *style* of Pokémon; do not copy Pokémon. Nintendo/Game Freak own their creature names, designs, sprites, music, the specific 18-type chart, exact base-stat data, and Pokédex text — reproducing those invites legal trouble and makes a worse portfolio piece. The *mechanics* (grid overworld, turn-based type battles, capture, evolution) are a genre and free to build in. So: invent your own creatures, names, types, art, and world. The assets in this skill are deliberately original templates for exactly this reason. When the user asks for "Pokémon," build them their *own* creature world with Pokémon-grade systems.
