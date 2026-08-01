interface HeroProps {
  onEnter: () => void;
}

export default function Hero({ onEnter }: HeroProps) {
  return (
    <section className="relative flex min-h-dvh flex-col justify-end px-6 pb-16 pt-10 sm:px-10 sm:pb-20 lg:px-16">
      <div className="absolute inset-0 world-gradient" />
      <div className="terrain-band absolute inset-x-0 bottom-0 h-[42%]" />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-[18%] h-px bg-gradient-to-r from-transparent via-[var(--color-horizon)]/50 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <p className="animate-rise font-display text-sm font-semibold tracking-[0.35em] text-[var(--color-horizon)] uppercase">
          Aether
        </p>
        <h1
          className="animate-rise mt-4 max-w-3xl font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-[var(--color-mist)] sm:text-6xl md:text-7xl lg:text-8xl"
          style={{ animationDelay: "0.12s" }}
        >
          A living virtual world
        </h1>
        <p
          className="animate-rise mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-mist-dim)] sm:text-xl"
          style={{ animationDelay: "0.24s" }}
        >
          Wander coasts, groves, and glass cities in a shared realm that keeps
          evolving as you explore.
        </p>
        <div className="animate-rise mt-10 flex flex-wrap gap-4" style={{ animationDelay: "0.36s" }}>
          <button
            type="button"
            onClick={onEnter}
            className="rounded-md bg-[var(--color-horizon)] px-7 py-3.5 font-display text-base font-semibold tracking-wide text-[var(--color-ink)] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-horizon)]"
          >
            Enter the world
          </button>
          <a
            href="#map"
            onClick={(e) => {
              e.preventDefault();
              onEnter();
            }}
            className="rounded-md border border-white/20 px-7 py-3.5 font-display text-base font-semibold tracking-wide text-[var(--color-mist)] transition hover:border-white/40 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60"
          >
            Explore districts
          </a>
        </div>
      </div>
    </section>
  );
}
