import { useState } from "react";
import { useGameDispatch, useGameState } from "../../game/state/GameContext";

export default function TitleScreen() {
  const { hasSave, contentErrors } = useGameState();
  const dispatch = useGameDispatch();
  const [name, setName] = useState("Traveler");

  return (
    <section className="relative flex min-h-dvh flex-col justify-end px-6 pb-16 pt-10 sm:px-10">
      <div className="absolute inset-0 world-gradient" />
      <div className="terrain-band absolute inset-x-0 bottom-0 h-[42%]" />
      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <h1 className="animate-rise font-display text-6xl font-extrabold tracking-tight sm:text-7xl md:text-8xl">
          Aether
        </h1>
        <p
          className="animate-rise mt-4 font-display text-2xl font-semibold text-[var(--color-horizon)] sm:text-3xl"
          style={{ animationDelay: "0.1s" }}
        >
          Creature world
        </p>
        <p
          className="animate-rise mt-4 max-w-lg text-[var(--color-mist-dim)]"
          style={{ animationDelay: "0.2s" }}
        >
          Explore a 3D Meadow Edge, battle wild creatures, catch companions, and grow your party.
        </p>

        <div className="animate-rise mt-8 flex max-w-md flex-col gap-3" style={{ animationDelay: "0.3s" }}>
          <label className="text-sm text-[var(--color-mist-dim)]">
            Traveler name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-[var(--color-mist)] outline-none focus:border-[var(--color-horizon)]"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => dispatch({ type: "NEW_GAME", name })}
              className="rounded-md bg-[var(--color-horizon)] px-6 py-3 font-display font-semibold text-[var(--color-ink)]"
            >
              New journey
            </button>
            {hasSave && (
              <button
                type="button"
                onClick={() => dispatch({ type: "CONTINUE" })}
                className="rounded-md border border-white/20 px-6 py-3 font-display font-semibold"
              >
                Continue
              </button>
            )}
          </div>
        </div>

        {contentErrors.length > 0 && (
          <div className="mt-6 rounded-md border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-100">
            Content errors: {contentErrors.join("; ")}
          </div>
        )}
      </div>
    </section>
  );
}
