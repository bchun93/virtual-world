# Virtual World · Aether

A browser creature-collector RPG: walk a tile overworld, battle wild creatures, catch them, and grow your party.

Built from the creature-RPG architecture in [`docs/creature-rpg/`](./docs/creature-rpg/) — data-driven content, a pure battle engine, and a grid overworld.

## Play

```bash
cd world
npm install
npm run dev
```

Then: **New journey → pick a starter → walk into tall grass → battle / catch**.

Controls: **Arrow keys / WASD** move · **Esc** party menu · save from the menu.

## What’s in the vertical slice

1. **Content as data** — species, moves, type chart, items, map (`world/src/content/`)
2. **Pure battle engine** — damage, types, status, capture, turn order (`world/src/game/battle/`)
3. **Overworld grid** — collision, tall-grass encounters, movement tween
4. **Progression** — XP, leveling, evolution hooks, party/box, localStorage save
5. **Tests** — `npm test` covers type effectiveness, damage, and battle capture

## Docs

| Doc | Topic |
|---|---|
| [`docs/creature-rpg/SKILL.md`](./docs/creature-rpg/SKILL.md) | Build order & architecture |
| [`docs/creature-rpg/data-schemas.md`](./docs/creature-rpg/data-schemas.md) | Engine ↔ content contract |
| [`docs/creature-rpg/battle-engine.md`](./docs/creature-rpg/battle-engine.md) | Combat rules |
| [`docs/creature-rpg/overworld.md`](./docs/creature-rpg/overworld.md) | Grid, warps, encounters |
| [`docs/creature-rpg/progression.md`](./docs/creature-rpg/progression.md) | XP, capture, save |

## Repository

**https://github.com/bchun93/virtual-world**

Deploy: pushes to `main` build `world/` via GitHub Pages (see [DEPLOY.md](./DEPLOY.md)).
