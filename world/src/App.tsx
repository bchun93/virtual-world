import { useState } from "react";
import Hero from "./components/Hero";
import WorldMap from "./components/WorldMap";
import type { Zone, ZoneId } from "./types";

export default function App() {
  const [entered, setEntered] = useState(false);
  const [selectedId, setSelectedId] = useState<ZoneId | null>(null);

  const enterWorld = () => {
    setEntered(true);
    requestAnimationFrame(() => {
      document.getElementById("map")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const selectZone = (zone: Zone) => {
    setSelectedId(zone.id);
    if (!entered) setEntered(true);
  };

  return (
    <main className="relative min-h-dvh">
      {!entered ? (
        <Hero onEnter={enterWorld} />
      ) : (
        <>
          <header className="animate-fade absolute top-0 right-0 left-0 z-30 flex items-center justify-between px-6 py-5 sm:px-10">
            <p className="font-display text-sm font-semibold tracking-[0.35em] text-[var(--color-horizon)] uppercase">
              Aether
            </p>
            <button
              type="button"
              onClick={() => {
                setEntered(false);
                setSelectedId(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-sm text-[var(--color-mist-dim)] transition hover:text-[var(--color-mist)]"
            >
              Back to arrival
            </button>
          </header>
          <WorldMap
            selectedId={selectedId}
            onSelect={selectZone}
            onClear={() => setSelectedId(null)}
          />
        </>
      )}
    </main>
  );
}
