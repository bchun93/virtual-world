import { useStarters, useGameDispatch } from "../../game/state/GameContext";

const accents: Record<string, string> = {
  emberling: "#e08a3c",
  tadsplash: "#4aa8d8",
  sprigling: "#6fbf8a",
};

export default function StarterSelect() {
  const starters = useStarters();
  const dispatch = useGameDispatch();

  return (
    <section className="animate-rise mx-auto w-full max-w-4xl px-4 py-10">
      <p className="font-display text-sm font-semibold tracking-[0.3em] text-[var(--color-horizon)] uppercase">
        Aether
      </p>
      <h2 className="mt-2 font-display text-4xl font-bold tracking-tight">Choose your companion</h2>
      <p className="mt-2 max-w-xl text-[var(--color-mist-dim)]">
        Three lineages open the path — fire, water, and nature. Your first creature shapes early battles.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {starters.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => dispatch({ type: "PICK_STARTER", speciesId: s.id })}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/10"
            style={{ boxShadow: `inset 0 0 0 1px ${accents[s.id]}44` }}
          >
            <div
              className="mb-4 flex h-20 items-center justify-center rounded-xl"
              style={{ background: `${accents[s.id]}22` }}
            >
              <span
                className="font-display text-3xl font-bold"
                style={{ color: accents[s.id] }}
              >
                {s.name.slice(0, 1)}
              </span>
            </div>
            <h3 className="font-display text-2xl font-bold">{s.name}</h3>
            <p className="mt-1 text-sm capitalize text-[var(--color-mist-dim)]">{s.types.join(" / ")}</p>
            <p className="mt-3 text-sm text-[var(--color-mist)]/80">
              HP {s.baseStats.hp} · Atk {s.baseStats.atk} · SpA {s.baseStats.spAtk} · Spe{" "}
              {s.baseStats.spd}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
