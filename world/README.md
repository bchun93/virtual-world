# Aether · Creature RPG

Playable vertical slice of a creature-collector in the Aether virtual world.

## Scripts

```bash
npm install
npm run dev      # local game
npm test         # battle engine unit tests
npm run build    # production build
```

## Layout

- `src/content/` — JSON data (species, moves, types, map, items)
- `src/game/battle/` — pure combat module
- `src/game/overworld/` — grid movement + encounters
- `src/game/progression/` — stats, XP, capture
- `src/game/state/` — mode machine + save/load
- `src/components/game/` — React UI shells
