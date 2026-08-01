import type { Zone } from "../types";

interface ZonePanelProps {
  zone: Zone | null;
  onClose: () => void;
}

export default function ZonePanel({ zone, onClose }: ZonePanelProps) {
  if (!zone) return null;

  return (
    <aside
      className="animate-rise absolute inset-x-4 bottom-4 z-20 max-w-md rounded-2xl border border-white/10 bg-[rgba(7,19,28,0.82)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:left-auto"
      style={{ boxShadow: `0 0 0 1px ${zone.accent}33, 0 24px 80px rgba(0,0,0,0.45)` }}
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="font-display text-xs font-semibold tracking-[0.28em] uppercase"
            style={{ color: zone.accent }}
          >
            District
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--color-mist)]">
            {zone.name}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-mist-dim)]">{zone.tagline}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-sm text-[var(--color-mist-dim)] transition hover:bg-white/10 hover:text-[var(--color-mist)]"
          aria-label="Close district details"
        >
          Close
        </button>
      </div>
      <p className="mt-4 text-base leading-relaxed text-[var(--color-mist)]/90">
        {zone.description}
      </p>
      <div
        className="mt-5 h-1 w-16 rounded-full"
        style={{ background: zone.accent, boxShadow: `0 0 18px ${zone.glow}` }}
      />
    </aside>
  );
}
