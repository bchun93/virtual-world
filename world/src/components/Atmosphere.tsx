import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${6 + ((i * 17) % 88)}%`,
  top: `${12 + ((i * 23) % 70)}%`,
  delay: `${(i % 7) * 0.45}s`,
  size: 2 + (i % 4),
}));

export default function Atmosphere() {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className={`absolute -left-[10%] top-[8%] h-40 w-[70%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(47,158,168,0.28),transparent_70%)] blur-2xl ${reduced ? "" : "animate-aurora"}`}
      />
      <div
        className={`absolute right-[-5%] top-[18%] h-48 w-[55%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(242,201,122,0.18),transparent_70%)] blur-3xl ${reduced ? "" : "animate-aurora"}`}
        style={reduced ? undefined : { animationDelay: "-4s" }}
      />

      <div
        className={`absolute left-[-15%] top-[22%] h-16 w-[60%] rounded-full bg-white/5 blur-xl ${reduced ? "" : "animate-drift-slow"}`}
      />
      <div
        className={`absolute right-[-20%] top-[34%] h-20 w-[65%] rounded-full bg-white/4 blur-2xl ${reduced ? "" : "animate-drift-slower"}`}
      />

      {!reduced &&
        particles.map((p) => (
          <span
            key={p.id}
            className="animate-float absolute rounded-full bg-[var(--color-mist)]"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              opacity: 0.35,
            }}
          />
        ))}
    </div>
  );
}
