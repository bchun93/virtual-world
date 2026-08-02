import { speciesSpriteUrl } from "../../game/content/sprites";
import { useGameDispatch, useStarters } from "../../game/state/GameContext";

const accents: Record<string, string> = {
  emberling: "#e08a3c",
  tadsplash: "#4aa8d8",
  sprigling: "#6fbf8a",
};

const blurbs: Record<string, string> = {
  emberling: "Spiky ember-fox — bold and quick to spark.",
  tadsplash: "Soft amphibian — calm waters, sharp jets.",
  sprigling: "Leafy guardian — sturdy roots, patient strikes.",
};

export default function StarterSelect() {
  const starters = useStarters();
  const dispatch = useGameDispatch();

  return (
    <section className="animate-rise mx-auto w-full max-w-5xl px-4 py-10">
      <p className="font-display text-sm font-semibold tracking-[0.3em] text-[var(--color-horizon)] uppercase">
        Aether
      </p>
      <h2 className="mt-2 font-display text-4xl font-bold tracking-tight">Choose your companion</h2>
      <p className="mt-2 max-w-xl text-[var(--color-mist-dim)]">
        Three lineages open the path — fire, water, and nature. Your first creature shapes early battles.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {starters.map((s) => {
          const sprite = speciesSpriteUrl(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => dispatch({ type: "PICK_STARTER", speciesId: s.id })}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/10"
              style={{ boxShadow: `inset 0 0 0 1px ${accents[s.id]}44` }}
            >
              <div
                className="mb-4 flex aspect-square items-center justify-center rounded-xl p-3"
                style={{
                  background: `radial-gradient(circle at 40% 30%, ${accents[s.id]}33, transparent 60%), ${accents[s.id]}14`,
                }}
              >
                {sprite ? (
                  <img
                    src={sprite}
                    alt={s.name}
                    className="h-full w-full max-h-48 object-contain drop-shadow-lg transition duration-300 group-hover:scale-105"
                    draggable={false}
                  />
                ) : (
                  <span
                    className="font-display text-5xl font-bold"
                    style={{ color: accents[s.id] }}
                  >
                    {s.name.slice(0, 1)}
                  </span>
                )}
              </div>
              <h3 className="font-display text-2xl font-bold">{s.name}</h3>
              <p className="mt-1 text-sm capitalize text-[var(--color-mist-dim)]">
                {s.types.join(" / ")}
              </p>
              <p className="mt-2 text-sm text-[var(--color-mist)]/85">{blurbs[s.id]}</p>
              <p className="mt-3 text-xs text-[var(--color-mist-dim)]">
                HP {s.baseStats.hp} · Atk {s.baseStats.atk} · SpA {s.baseStats.spAtk} · Spe{" "}
                {s.baseStats.spd}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
