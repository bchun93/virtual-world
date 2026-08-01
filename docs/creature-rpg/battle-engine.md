# Battle Engine — turn-based creature combat

Build this as a **pure module**: functions that take state and inputs and return new state, with no rendering and no framework calls. Then unit-test it before any graphics exist. The battle is where fun and bugs concentrate; isolating it as testable logic is the highest-value structural decision in the whole project.

## Contents
- [The turn loop as an event pipeline](#the-turn-loop-as-an-event-pipeline)
- [Turn order: priority then Speed](#turn-order-priority-then-speed)
- [The damage formula from first principles](#the-damage-formula-from-first-principles)
- [Worked example](#worked-example)
- [Accuracy and the miss check](#accuracy-and-the-miss-check)
- [Status conditions](#status-conditions)
- [Stat stages (buffs/debuffs)](#stat-stages-buffsdebuffs)
- [Opponent AI: start dumb](#opponent-ai-start-dumb)
- [Testing the engine](#testing-the-engine)

## The turn loop as an event pipeline

First principle: a battle turn is a **discrete sequence of resolved events**, not a physics tick. Both sides commit an action, then the engine resolves them one at a time, emitting events (damage dealt, status applied, fainted) that the UI later animates. Keep resolution and animation separate — the engine decides *what happens* and returns a list of events; the renderer decides *how it looks*. This is why the engine can be tested headless.

One turn:
1. **Collect actions.** Each side chooses: use move / switch creature / use item / flee. (Player via UI, opponent via AI.)
2. **Order the actions** (below).
3. **Resolve in order.** For each: check if the actor can act (fainted? fully paralyzed?), run accuracy, compute effect (damage or status), apply it, emit events, check for faints.
4. **End-of-turn effects.** Burn/poison chip damage, weather, etc.
5. **Check end conditions.** A side with no conscious creatures loses; a successful flee/capture ends the battle.

Return the event list from each step so the caller can replay it as animation, log it, or (in tests) assert on it.

## Turn order: priority then Speed

Why not just "fastest goes first"? Because some actions must jump the queue regardless of Speed (a quick-strike move, fleeing, switching, using an item). So order by a **two-key sort**:

1. **Action-class / move priority first.** Switches and items typically resolve before any attack; among attacks, a move's `priority` field wins (a +1 move beats all 0-priority moves).
2. **Then Speed stat**, higher first.
3. **Ties broken randomly** (a coin flip), so identical-Speed matchups aren't deterministic.

```
actions.sort(by=(-actionPriority, -effectiveSpeed, randomTiebreak))
```

Recompute `effectiveSpeed` each turn from stat stages and status (paralysis cuts Speed), because buffs applied earlier in the turn should count.

## The damage formula from first principles

Every term exists to answer a design question. Understanding *why* lets you tune deliberately instead of guessing. The standard genre formula (grounded across Bulbapedia and multiple community mechanics references — see sources below):

```
base   = ((2 * Level / 5 + 2) * Power * A / D) / 50 + 2
damage = floor(base * STAB * Type * Critical * Random)
```

Deriving each piece:

- **`Power`** — the move's intrinsic strength. The obvious lever: stronger moves hit harder. Linear so it's predictable to designers.
- **`A / D`** (attacker's Attack ÷ defender's Defense) — combat is *relative*. A big attacker into a big defender should net out near neutral; a glass cannon into paper should spike. A ratio captures "how outmatched is the defender" in one number. `A` and `D` are the physical pair for physical moves, the special pair for special moves — this is the entire mechanical reason to split stats.
- **`Level` term `(2*Level/5 + 2)`** — scales damage with the attacker's level so a level-50 creature meaningfully out-damages a level-5 one *at equal stats*. Without it, level would only matter through stats and the curve would feel flat.
- **`/50 + 2`** — normalization + a floor. The `/50` keeps numbers in a sane HP range (tens–low hundreds, not thousands) given the multiplications above; the `+2` guarantees a positive base so even a weak hit does *something* (a move that can deal 0 feels broken).
- **`STAB`** (Same-Type Attack Bonus, ×1.5 when move type matches a user type) — rewards thematic team-building: a Fire creature using Fire moves gets a bonus, nudging players toward coherent, flavorful sets rather than random grab-bags. Confirmed at 1.5× in the standard games.
- **`Type`** (type effectiveness, 0/0.25/0.5/1/2/4) — the strategic core. This is what turns battles into rock-paper-scissors matchup puzzles. Product across the defender's types (`data-schemas.md`). Highest-leverage feel lever in the game.
- **`Critical`** (×1.5) — an occasional upside swing that adds tension without dominating. Standard crit rate ~1/16 to ~1/24; crit conventionally also ignores the defender's positive Defense buffs so it can't be fully walled.
- **`Random`** ∈ [0.85, 1.0] — the same move never deals identical damage twice, which prevents battles from being perfectly pre-solvable while keeping the *range* tight (±~15%) so outcomes stay predictable enough to plan around. A common implementation picks one of 16 discrete values in that band.

Apply modifiers in a fixed order and floor to an integer at the end (some engines floor at each step; pick one convention and keep it — floor points affect exact numbers). STAB and Type both applying before the random roll is the standard ordering.

## Worked example

Level 20 Emberling (Fire) uses **Ember** (Fire, special, Power 40) against a Nature-type wild creature. First derive the stats from the formula in `data-schemas.md`: Emberling's base Special Attack is 60, so at level 20 (max IV 31) its effective SpAtk = `floor((2*60+31)*20/100) + 5 = 35`. Say the defender's effective Special Defense is also 35. Fire→Nature is ×2 on the chart. No crit; random roll = 0.9.

```
base = ((2*20/5 + 2) * 40 * 35/35) / 50 + 2
     = ((8 + 2) * 40 * 1.0) / 50 + 2
     = 400/50 + 2 = 8 + 2 = 10
STAB = 1.5 (Fire move on Fire user)
Type = 2.0 (super effective)
damage = floor(10 * 1.5 * 2.0 * 1.0 * 0.9) = floor(27) = 27
```

27 damage — a strong but non-lethal hit against a ~50-HP target. Deriving the stats first (rather than assuming them) is exactly the kind of end-to-end check that catches a mis-tuned constant: if this had come out to 3 or to 300, a scaling knob is wrong.

## Accuracy and the miss check

Before computing damage: `if random(0,100) >= move.accuracy → miss`, emit a miss event, skip damage. Keep accuracy a move property so "powerful but unreliable" is expressible. Status/paralysis can also cause a full-turn skip — resolve those *before* accuracy.

## Status conditions

Model as an enum on the instance plus a small handler table, not scattered `if`s. Core set and their design roles:

- **Burn** — chip damage end-of-turn + halves physical damage dealt. Punishes physical attackers.
- **Poison** — chip damage end-of-turn (optionally escalating). Attrition.
- **Paralysis** — cuts Speed and gives a per-turn chance to lose the turn. Tempo control.
- **Sleep** — skip turns for a random few turns; can't act. Strong, so make it wear off.
- **Freeze** — can't act until thawed (random chance per turn). Strongest, rarest.

Each is `{ onTurnEnd, onBeforeAction, statModifiers }`. This mirrors the capture math (`progression.md`), where sleep/freeze give the biggest catch bonus precisely because they most disable the target.

## Stat stages (buffs/debuffs)

Buffs shouldn't be raw multipliers (they compound explosively). The genre uses **stages** from −6 to +6; each stage maps to a multiplier via a fixed table (e.g. +1 → ×1.5, +2 → ×2, −1 → ×0.66…). Store `stage` per stat on the *battle* state (they reset when the creature leaves battle), look up the multiplier, apply to the derived stat. Bounded stages keep buff wars finite and readable.

## Opponent AI: start dumb

Resist building clever AI first — it's a rabbit hole and a random opponent is already fun enough to test the loop. Escalate only as needed:

1. **Random legal move.** Ship this first. Confidence 9/10 that it's enough to validate the whole battle system.
2. **Greedy:** score each move by expected damage (run the formula, weight by type effectiveness) and pick the max. Feels "smart" for ~20 lines.
3. **One-ply lookahead / switch logic:** consider switching on bad matchups, using status. Only if the game is combat-focused enough to justify it.

Most of the genre's perceived difficulty comes from *level and team design*, not AI cleverness — tune encounters before tuning brains.

## Testing the engine

Because it's pure, test it directly, no game running:
- Damage formula returns the hand-computed number for fixed inputs (freeze the random roll).
- Type effectiveness: super-effective > neutral > not-very-effective; immunity deals 0.
- STAB applies only on type match.
- Turn order respects priority over Speed, and Speed over ties.
- A fainted creature can't act; a poisoned one loses HP end-of-turn.
- Capture succeeds deterministically at forced-high `a`, fails at forced-low.

These tests are your regression net as you tune constants later.

---

**Sources for the mechanics above** (cross-checked): the damage formula and STAB/type multipliers are documented consistently on Bulbapedia's *Damage* article and independent community calculators (pokelistic, everycalculators, pokekipe), which agree on the `((2·Level/5+2)·Power·A/D)/50+2 × modifiers` structure, STAB 1.5×, type multipliers of 0/0.25/0.5/1/2/4, and a 0.85–1.0 random band. Treat these as the genre's *reference*, then diverge and tune for your own game's feel and balance.
