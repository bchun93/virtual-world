interface HeroProps {
  onEnter: () => void;
}

export default function Hero({ onEnter }: HeroProps) {
  return (
    <section className="relative flex min-h-dvh flex-col justify-end overflow-hidden px-6 pb-14 pt-10 sm:px-10 sm:pb-16 lg:px-16">
      <div className="absolute inset-0 world-gradient" />
      <div className="terrain-band absolute inset-x-0 bottom-0 h-[48%]" />

      {/* World silhouette as the dominant visual plane */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <svg
          viewBox="0 0 100 62"
          className="absolute inset-x-0 bottom-0 h-[72%] w-full opacity-90"
          preserveAspectRatio="xMidYMax slice"
        >
          <defs>
            <linearGradient id="heroLand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a4a55" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#246055" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2f6a4f" stopOpacity="0.7" />
            </linearGradient>
            <filter id="heroGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M0 38 C 14 26, 26 22, 40 24 C 54 26, 60 16, 72 14 C 84 12, 94 20, 100 30 L 100 62 L 0 62 Z"
            fill="url(#heroLand)"
          />
          <path
            d="M6 42 C 22 34, 36 32, 50 34 C 64 36, 74 26, 86 28 C 92 29, 96 34, 100 40"
            fill="none"
            stroke="rgba(215,231,239,0.14)"
            strokeWidth="0.35"
          />
          {[
            { x: 18, y: 44, c: "#3ec6c9" },
            { x: 36, y: 36, c: "#e08a3c" },
            { x: 52, y: 22, c: "#f0d27a" },
            { x: 64, y: 30, c: "#7eb8ff" },
            { x: 80, y: 40, c: "#9fd0d8" },
            { x: 28, y: 28, c: "#6fbf8a" },
          ].map((n, i) => (
            <g key={i} filter="url(#heroGlow)">
              <circle cx={n.x} cy={n.y} r="3.2" fill={n.c} opacity="0.28" className="animate-pulse-glow" />
              <circle cx={n.x} cy={n.y} r="1.1" fill={n.c} opacity="0.85" />
            </g>
          ))}
        </svg>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-[16%] h-px bg-gradient-to-r from-transparent via-[var(--color-horizon)]/40 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <h1 className="animate-rise font-display text-6xl leading-[0.9] font-extrabold tracking-tight text-[var(--color-mist)] sm:text-7xl md:text-8xl lg:text-9xl">
          Aether
        </h1>
        <p
          className="animate-rise mt-5 max-w-2xl font-display text-2xl leading-snug font-semibold tracking-tight text-[var(--color-horizon)] sm:text-3xl md:text-4xl"
          style={{ animationDelay: "0.1s" }}
        >
          A living virtual world
        </p>
        <p
          className="animate-rise mt-4 max-w-lg text-base leading-relaxed text-[var(--color-mist-dim)] sm:text-lg"
          style={{ animationDelay: "0.2s" }}
        >
          Wander coasts, groves, and glass cities in a shared realm that keeps
          evolving as you explore.
        </p>
        <div className="animate-rise mt-9 flex flex-wrap gap-4" style={{ animationDelay: "0.32s" }}>
          <button
            type="button"
            onClick={onEnter}
            className="rounded-md bg-[var(--color-horizon)] px-7 py-3.5 font-display text-base font-semibold tracking-wide text-[var(--color-ink)] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-horizon)]"
          >
            Enter the world
          </button>
          <button
            type="button"
            onClick={onEnter}
            className="rounded-md border border-white/20 px-7 py-3.5 font-display text-base font-semibold tracking-wide text-[var(--color-mist)] transition hover:border-white/40 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60"
          >
            Explore districts
          </button>
        </div>
      </div>
    </section>
  );
}
