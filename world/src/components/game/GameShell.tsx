import { useGameState } from "../../game/state/GameContext";
import BattleScreen from "./BattleScreen";
import OverworldCanvas from "./OverworldCanvas";
import PartyMenu from "./PartyMenu";
import StarterSelect from "./StarterSelect";
import TitleScreen from "./TitleScreen";

export default function GameShell() {
  const { mode, lastMessage, save } = useGameState();

  if (mode === "title") return <TitleScreen />;
  if (mode === "starter") return <StarterSelect />;

  return (
    <div className="relative min-h-dvh world-gradient px-4 py-6 sm:px-8">
      <header className="mx-auto mb-4 flex max-w-4xl items-center justify-between">
        <div>
          <p className="font-display text-sm font-semibold tracking-[0.3em] text-[var(--color-horizon)] uppercase">
            Aether
          </p>
          <p className="text-sm text-[var(--color-mist-dim)]">
            {save?.player.name ?? "Traveler"} · party {save?.party.length ?? 0}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl">
        {mode === "battle" ? (
          <BattleScreen />
        ) : mode === "menu" ? (
          <PartyMenu />
        ) : (
          <OverworldCanvas />
        )}
      </div>

      {lastMessage && mode !== "battle" && (
        <p className="mx-auto mt-4 max-w-4xl rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-[var(--color-mist)]">
          {lastMessage}
        </p>
      )}
    </div>
  );
}
