# Progression — leveling, evolution, capture, storage, saving

The systems that turn a battle sandbox into a *collection game with a sense of growth*.

## Contents
- [Experience and leveling](#experience-and-leveling)
- [Evolution](#evolution)
- [The capture formula from first principles](#the-capture-formula-from-first-principles)
- [Party and storage](#party-and-storage)
- [Saving and loading](#saving-and-loading)

## Experience and leveling

Two questions: how much XP does a win grant, and how much does each level cost.

**XP granted for a win** scales with the defeated creature's level and its species' `baseExpYield`, so beating stronger creatures is worth more — this is what keeps grinding directed toward appropriate challenges rather than farming weaklings:

```
gain = floor(baseExpYield * defeatedLevel / 7)
```

The `/7` is a scaling knob; raise it to slow leveling, lower it to speed it. Split among participants if you support multi-creature XP.

**Cost per level** comes from a *growth curve* — total XP required to reach level `n` as a function of `n`. Different curves let some species level fast (early-game filler) and others slow (powerful late bloomers). Common curves:

- `mediumFast`: `total(n) = n³` — clean baseline, start here.
- `fast`: `0.8 · n³` — ~20% less XP overall.
- `slow`: `1.25 · n³` — ~25% more.
- `mediumSlow`: a polynomial that's cheap in the mid-levels and expensive at the extremes.

Store the *curve name* on the species and compute cost from it; don't hardcode a table. On gaining XP, loop: while `exp >= total(level+1)`, increment level, recompute derived stats, check learnset (offer/auto-learn new moves), check evolution triggers.

## Evolution

Evolution is a species swap on an instance: change `speciesId`, keep level/XP/moves/nickname, then recompute derived stats (the new base stats make it stronger). Triggers are the `{trigger, value}` records from the species schema:

- **`level`** — reached a level threshold. Checked after each level-up.
- **`item`** — a specific item used on it (evolution stones).
- **`friendship`** — a hidden affection counter crossed a threshold.
- **`trade`** — evolves when traded (only if you build trading).

Keep a single `checkEvolution(instance, trigger, context)` that dispatches on trigger kind. Let branching happen (one species → several, by condition). The genre convention is to let the player cancel an evolution; if you want that, make evolution an event the UI can veto rather than an instant mutation.

## The capture formula from first principles

Capturing is the genre's signature verb, and its math encodes a clear design intent: **reward the player for setting up the catch** (weakening HP, inflicting status, using better balls) rather than for spamming throws. The standard Gen III+ formula (cross-checked on Bulbapedia's *Catch rate* article, the Pokémon Wiki, and independent calculators — they agree on the structure and modifiers):

```
a = ((3 * maxHP - 2 * currentHP) * catchRate * ballModifier * statusModifier) / (3 * maxHP)
```

Reading each term as a design decision:

- **`(3*maxHP - 2*currentHP) / (3*maxHP)`** — the HP factor. At full HP this equals `1/3`; as `currentHP → 0` it rises toward `1`. So weakening a creature can nearly **triple** your odds. This is *why* you battle before throwing: the formula pays you for it. The `3× / 2×` weighting is what sets that full-HP floor at exactly one-third.
- **`catchRate`** — the species' innate catchability (schema field). Common creatures high, legendaries low. The single biggest determinant of difficulty per species.
- **`ballModifier`** — better balls multiply your chance (a Great-Ball-equivalent ~1.5×, an Ultra ~2×, situational balls more). This is the item-progression lever.
- **`statusModifier`** — sleep/freeze give the largest bonus (~2.5×), paralysis/poison/burn a smaller one (~1.5×), none = 1×. The most *disabling* statuses help most — thematically, a helpless target is easier to catch. This is the direct link back to the battle engine's status system.

Then **shake checks** turn `a` into a probability with drama. Compute a shake threshold `b` from `a` (the standard is `b = 65535 / sqrt(sqrt(255 / a))`, i.e. `a` mapped through a fourth root), then run up to four independent checks, each passing if `random(0, 65535) < b`. Caught only if all pass. Two things to know:

- If `a >= 255`, the catch is guaranteed (skip the checks). Cap `a` at 255.
- The shake *animation* count (0–3 wobbles before break) is just how many checks passed — cosmetic feedback, not separate logic. Passing 3 checks then failing the 4th is the classic "so close" three-wobble break.

A simpler alternative if you don't want shake drama: catch succeeds if `random(0, 255) < a`. Same `a`, less theater. Start here if you're prototyping; add shakes for polish.

## Party and storage

- **Party**: an ordered list, max `N` (genre standard 6). Only party creatures battle and gain XP. Enforce "can't release your last conscious creature" so the player is never soft-locked.
- **Storage box**: overflow. On a successful catch with a full party, the new creature goes to the box. A box is just a larger list (or list-of-lists for multiple boxes). Party↔box moves are list operations on *instances* — cheap, because instances are small and self-contained (`data-schemas.md`).

Keep party and box as plain arrays of instance objects. That plainness is deliberate: it makes the next section trivial.

## Saving and loading

Save = serialize the mutable game state to JSON; load = parse it back and rehydrate. Because species/moves/maps are *static content reconstructed from data files*, you never save them — you save only what changed:

```json
{
  "version": 1,
  "player": { "name": "...", "mapId": "route_1", "tile": [12, 8], "facing": "down" },
  "party": [ /* creature instances */ ],
  "boxes": [ [ /* instances */ ] ],
  "inventory": { "greatball": 5, "potion": 3 },
  "flags": { "beat_gym_1": true, "talked_to_elder": false },
  "seen": ["emberling", "wildtail"],
  "caught": ["wildtail"]
}
```

- **Web**: `localStorage.setItem(key, JSON.stringify(save))`. **Desktop/Python**: write the JSON to a file.
- **`version`** field: include it from day one. When you change the save shape later, you'll need to migrate old saves, and a version number is what makes that possible instead of silently corrupting them.
- **`flags`** is a generic key→bool (or key→value) store for world/quest state ("did event X happen"). A flat flag bag is far more flexible than bespoke fields per event, and quest logic reduces to reading/writing flags.
- This all works *only because* you kept the split from `data-schemas.md`: mutable instance state is small and serializable, static design data is regenerated on load. If saving feels hard, that split probably leaked — mutable and static data got tangled — and that's the thing to fix.
