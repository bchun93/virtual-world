import { zones } from "../data/zones";
import type { Zone, ZoneId } from "../types";
import Atmosphere from "./Atmosphere";
import ZonePanel from "./ZonePanel";

interface WorldMapProps {
  selectedId: ZoneId | null;
  onSelect: (zone: Zone) => void;
  onClear: () => void;
}

export default function WorldMap({ selectedId, onSelect, onClear }: WorldMapProps) {
  const selected = zones.find((z) => z.id === selectedId) ?? null;

  return (
    <section
      id="map"
      className="relative min-h-dvh overflow-hidden px-4 py-8 sm:px-8 sm:py-10"
      aria-label="Virtual world map"
    >
      <div className="absolute inset-0 world-gradient" />
      <div className="terrain-band absolute inset-x-0 bottom-0 h-[55%]" />
      <Atmosphere />

      <div className="relative z-10 mx-auto flex max-w-6xl items-end justify-between gap-4 px-2 pb-4">
        <div>
          <p className="font-display text-sm font-semibold tracking-[0.3em] text-[var(--color-horizon)] uppercase">
            Aether
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--color-mist)] sm:text-4xl">
            Choose a district
          </h2>
          <p className="mt-2 max-w-md text-[var(--color-mist-dim)]">
            Six places, one continuous world. Select a point of light to step closer.
          </p>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-4 aspect-[16/10] w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[rgba(8,24,34,0.35)] shadow-[inset_0_0_80px_rgba(47,158,168,0.12)] backdrop-blur-sm">
        <svg
          viewBox="0 0 100 62"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Map of Aether districts"
        >
          <defs>
            <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a4a55" stopOpacity="0.2" />
              <stop offset="55%" stopColor="#246055" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#2f6a4f" stopOpacity="0.65" />
            </linearGradient>
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M4 40 C 18 28, 28 24, 40 26 C 52 28, 58 18, 70 16 C 82 14, 92 22, 96 34 L 96 58 L 4 58 Z"
            fill="url(#land)"
          />
          <path
            d="M8 44 C 22 36, 34 34, 46 36 C 60 38, 68 28, 80 30 C 88 31, 93 38, 95 44"
            fill="none"
            stroke="rgba(215,231,239,0.18)"
            strokeWidth="0.35"
          />
          <path
            d="M12 52 C 30 48, 48 50, 66 46 C 78 43, 88 46, 94 50"
            fill="none"
            stroke="rgba(47,158,168,0.25)"
            strokeWidth="0.3"
          />

          {zones.map((zone) => {
            const active = zone.id === selectedId;
            return (
              <g key={zone.id} filter="url(#softGlow)">
                <circle
                  cx={zone.x}
                  cy={(zone.y / 100) * 62}
                  r={active ? zone.size * 0.55 : zone.size * 0.4}
                  fill={zone.glow}
                  className={active ? undefined : "animate-pulse-glow"}
                  opacity={active ? 0.9 : 0.55}
                />
                <circle
                  cx={zone.x}
                  cy={(zone.y / 100) * 62}
                  r={active ? 2.4 : 1.8}
                  fill={zone.accent}
                  stroke="rgba(7,19,28,0.55)"
                  strokeWidth="0.4"
                  className="cursor-pointer"
                  onClick={() => onSelect(zone)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${zone.name}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(zone);
                    }
                  }}
                />
                <text
                  x={zone.x}
                  y={(zone.y / 100) * 62 - 3.5}
                  textAnchor="middle"
                  fill="rgba(215,231,239,0.9)"
                  fontSize="2.2"
                  fontFamily="Syne, sans-serif"
                  className="pointer-events-none select-none"
                >
                  {zone.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Larger hit targets for touch */}
        {zones.map((zone) => (
          <button
            key={`${zone.id}-hit`}
            type="button"
            aria-label={`Explore ${zone.name}`}
            aria-pressed={zone.id === selectedId}
            onClick={() => onSelect(zone)}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-horizon)]"
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${Math.max(zone.size * 2.2, 44)}px`,
              height: `${Math.max(zone.size * 2.2, 44)}px`,
              background: "transparent",
            }}
          />
        ))}

        <ZonePanel zone={selected} onClose={onClear} />
      </div>
    </section>
  );
}
