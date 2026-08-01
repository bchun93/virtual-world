# Data Schemas — the engine ↔ content contract

**Read this before writing any other code.** These schemas are the boundary between the *engine* (generic rules) and the *content* (the world your developers author). Get them right and the rest of the project is filling in files; get them wrong and you refactor everything later.

## Contents
- [The one distinction that prevents the biggest bug](#the-one-distinction-that-prevents-the-biggest-bug)
- [Type chart](#type-chart)
- [Species (static template)](#species-static-template)
- [Move](#move)
- [Creature instance (runtime)](#creature-instance-runtime)
- [Map + encounter table](#map--encounter-table)
- [Item](#item)
- [Why JSON, and where it stops scaling](#why-json-and-where-it-stops-scaling)

## The one distinction that prevents the biggest bug

**Static species template ≠ runtime creature instance.** This is the mistake most first attempts make. A *species* ("Emberling") is shared, immutable design data: base stats, types, which moves it can learn, its evolution. A *creature instance* is one specific individual the player owns or fights: it has a level, current HP, current XP, a chosen moveset with PP, maybe a nickname and a status condition. Ten Emberlings in the wild share ONE species record but are TEN instances.

If you store mutable per-individual state (current HP, level) on the species, every Emberling in the game shares one HP bar. Keep species read-only and reference it by ID from each instance:

```
instance.speciesId = "emberling"   // points at the shared template
instance.currentHp = 14            // this individual only
```

This also makes saving trivial: you serialize instances (small), never species (reconstructed from static data on load).

## Type chart

A matrix `chart[attackerType][defenderType] = multiplier`. Store only non-1.0 entries; default missing lookups to 1.0. Multipliers are 0 (immune), 0.5, or 2 per pairing; against a dual-type defender you take the **product** across both its types, yielding 0, 0.25, 0.5, 1, 2, or 4. See `assets/type_chart.json` for a ready 12-type version. Effectiveness lookup:

```
function effectiveness(moveType, defenderTypes):
    m = 1.0
    for t in defenderTypes:
        m *= chart[moveType][t] ?? 1.0
    return m        # 0, 0.25, 0.5, 1, 2, or 4
```

## Species (static template)

```json
{
  "id": "emberling",
  "name": "Emberling",
  "types": ["fire"],
  "baseStats": { "hp": 39, "atk": 52, "def": 43, "spAtk": 60, "spDef": 50, "spd": 65 },
  "catchRate": 45,
  "growthRate": "mediumFast",
  "baseExpYield": 62,
  "learnset": [
    { "level": 1, "moveId": "scratch" },
    { "level": 1, "moveId": "ember" },
    { "level": 7, "moveId": "ember_burst" }
  ],
  "evolutions": [
    { "toSpeciesId": "cindmaw", "trigger": "level", "value": 16 }
  ],
  "spriteFront": "emberling_front.png",
  "spriteBack": "emberling_back.png"
}
```

Field notes:
- **`baseStats`** are the species' innate potential. Six stats is the genre standard; splitting attack into physical (`atk`) and special (`spAtk`) — with matching defenses — lets a move choose which pairing it uses, which is what makes "physical vs special attacker" a meaningful build distinction. You can simplify to one Attack/Defense pair if you want less depth; that is a real tradeoff between build variety and balancing effort.
- **`catchRate`** (0–255-ish): higher = easier to catch. Feeds the capture formula. Legendaries low (~3), early creatures high (~255).
- **`growthRate`** names an XP curve (see `progression.md`); it decides how much total XP each level costs.
- **`learnset`** is level → move. Keep it *data* so re-leveling a creature or adding moves is an edit, not a code change.
- **`evolutions`** is a list (a species can branch). `trigger` is an enum: `level`, `item`, `trade`, `friendship`, etc. Keeping it a list of `{trigger, value, toSpeciesId}` objects means new evolution kinds are new enum handlers, not new fields everywhere.

## Move

```json
{
  "id": "ember",
  "name": "Ember",
  "type": "fire",
  "category": "special",
  "power": 40,
  "accuracy": 100,
  "pp": 25,
  "priority": 0,
  "target": "opponent",
  "effect": { "kind": "statusChance", "status": "burn", "chance": 10 }
}
```

- **`category`** = `physical` | `special` | `status`. This selects which stat pair the damage formula uses (`atk`/`def` vs `spAtk`/`spDef`) and whether it deals damage at all. Making it a field on the move — rather than deriving it from the move's type — is the modern design and keeps types independent of category.
- **`power`** 0/null for status moves. **`accuracy`** 0–100 (or `null` = never misses). **`pp`** is uses before needing a refill; track *remaining* PP on the instance, not here.
- **`priority`** breaks Speed ties in the turn order (a +1 move goes before all 0-priority moves regardless of Speed). Default 0.
- **`effect`** is a small tagged union (`{kind, ...}`). Model secondary effects as data with a `kind` discriminator so the engine has one `applyEffect(effect, context)` dispatcher rather than special-casing each move. New effect kinds = new dispatcher branches, not new move fields.

## Creature instance (runtime)

Everything mutable and per-individual lives here:

```json
{
  "instanceId": "uuid-or-counter",
  "speciesId": "emberling",
  "nickname": null,
  "level": 5,
  "exp": 135,
  "ivs": { "hp": 20, "atk": 15, "def": 8, "spAtk": 31, "spDef": 12, "spd": 25 },
  "currentHp": 19,
  "status": null,
  "moves": [
    { "moveId": "scratch", "ppRemaining": 35 },
    { "moveId": "ember", "ppRemaining": 25 }
  ]
}
```

- **`ivs`** (individual values, 0–31 per stat) are a fixed per-individual roll that makes two same-level Emberlings slightly different. Optional but cheap, and it's what makes "hunting for a good one" a thing. Omit for a simpler game.
- **Derived stats are computed, never stored.** Final HP and stats are a pure function of `baseStats`, `ivs`, and `level` — recompute on demand so they can never drift out of sync:

```
maxHp   = floor((2*base.hp  + iv.hp )  * level / 100) + level + 10
statX   = floor((2*base.statX + iv.statX) * level / 100) + 5
```

The `+10`/`+5` and the level term give HP a deliberate head start over other stats (nobody should have 3 HP at level 1). These constants are yours to tune — they set the whole game's numeric scale.

## Map + encounter table

Author the *layout* in Tiled; keep the *game-logic metadata* alongside it. A map is: visual tile layers + a collision layer + object layer (warps, NPCs, encounter zones).

```json
{
  "id": "route_1",
  "tiledSource": "route_1.tmj",
  "warps": [
    { "atTile": [12, 0], "toMap": "town_oakhollow", "toTile": [8, 15] }
  ],
  "encounterZones": {
    "tall_grass": {
      "rate": 0.10,
      "table": [
        { "speciesId": "wildtail", "weight": 40, "minLevel": 2, "maxLevel": 4 },
        { "speciesId": "sprigling", "weight": 30, "minLevel": 2, "maxLevel": 5 }
      ]
    }
  }
}
```

- **`rate`** is the per-step probability of triggering an encounter while standing in that zone type.
- **`table`** is a *weighted* list — pick by weight, not uniformly, so common creatures stay common. Weights need not sum to 100; normalize at roll time (`pick = weightedChoice(table)`).
- **`minLevel`/`maxLevel`** roll the wild instance's level, then generate a fresh instance from that species + level.

## Item

```json
{
  "id": "greatball",
  "name": "Great Ball",
  "category": "ball",
  "ballModifier": 1.5,
  "usableIn": ["battle"]
}
```

Model consumables (potions, balls) and key items with a shared `category` + category-specific fields. Balls carry a `ballModifier` straight into the capture formula. Healing items carry a `heal` amount or `curesStatus`. Same tagged-union discipline as move effects.

## Why JSON, and where it stops scaling

JSON is right for a solo/small project: human-editable, diff-friendly, no build step, loads natively in JS and Python. Its ceiling: no schema enforcement (a typo'd `moveId` fails silently at runtime), no relational integrity (nothing stops a learnset from referencing a deleted move), and it all loads into memory. Mitigations, in order of when you'll want them: (1) a validation pass on load that checks every cross-reference and fails loudly; (2) a TypeScript type or JSON Schema so the editor catches errors as you author; (3) only if you reach hundreds of species and want queries/tooling, move to SQLite. Do **not** start with a database — it is premature complexity that slows the content authoring that is the actual bottleneck.
