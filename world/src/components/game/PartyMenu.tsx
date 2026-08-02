import { getSpecies } from "../../game/content/catalog";
import { speciesSpriteUrl } from "../../game/content/sprites";
import { displayName } from "../../game/progression/creature";
import { getMaxHp } from "../../game/progression/stats";
import { useGameDispatch, useGameState } from "../../game/state/GameContext";

export default function PartyMenu() {
  const { save } = useGameState();
  const dispatch = useGameDispatch();
  if (!save) return null;

  return (
    <div className="animate-rise mx-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[rgba(7,19,28,0.9)] p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">Party & bag</h2>
        <button
          type="button"
          onClick={() => dispatch({ type: "CLOSE_MENU" })}
          className="text-sm text-[var(--color-mist-dim)] hover:text-[var(--color-mist)]"
        >
          Close
        </button>
      </div>

      <ul className="mt-4 space-y-3">
        {save.party.map((c) => {
          const species = getSpecies(c.speciesId);
          const max = getMaxHp(species, c);
          return (
            <li
              key={c.instanceId}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              {speciesSpriteUrl(c.speciesId) && (
                <img
                  src={speciesSpriteUrl(c.speciesId)!}
                  alt=""
                  className="h-14 w-14 shrink-0 object-contain"
                  draggable={false}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-lg font-semibold">{displayName(c)}</span>
                  <span className="text-sm text-[var(--color-mist-dim)]">Lv.{c.level}</span>
                </div>
                <p className="text-xs capitalize text-[var(--color-mist-dim)]">
                  {species.types.join(" / ")} · HP {Math.min(c.currentHp, max)}/{max}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
        {Object.entries(save.inventory).map(([id, count]) => (
          <div key={id} className="rounded-lg border border-white/10 bg-black/20 px-2 py-3">
            <div className="capitalize">{id}</div>
            <div className="text-[var(--color-horizon)]">×{count}</div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm text-[var(--color-mist-dim)]">
        Seen {save.seen.length} · Caught {save.caught.length}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => dispatch({ type: "SAVE" })}
          className="rounded-md bg-[var(--color-horizon)] px-4 py-2 font-display text-sm font-semibold text-[var(--color-ink)]"
        >
          Save game
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "TO_TITLE" })}
          className="rounded-md border border-white/20 px-4 py-2 text-sm"
        >
          Title screen
        </button>
      </div>
    </div>
  );
}
