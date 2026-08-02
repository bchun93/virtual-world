import { battleSummary } from "../../game/battle/engine";
import { getSpecies } from "../../game/content/catalog";
import { speciesSpriteUrl } from "../../game/content/sprites";
import { displayName } from "../../game/progression/creature";
import { useGameDispatch, useGameState } from "../../game/state/GameContext";

function HpBar({ current, max, accent }: { current: number; max: number; accent: string }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-black/40">
      <div className="h-full transition-all duration-300" style={{ width: `${pct}%`, background: accent }} />
    </div>
  );
}

export default function BattleScreen() {
  const { battle, save } = useGameState();
  const dispatch = useGameDispatch();
  if (!battle || !save) return null;

  const playerSpecies = getSpecies(battle.player.instance.speciesId);
  const foeSpecies = getSpecies(battle.opponent.instance.speciesId);
  const recent = battleSummary(battle.log.slice(-8));

  const typeColor: Record<string, string> = {
    fire: "#e08a3c",
    water: "#4aa8d8",
    nature: "#6fbf8a",
    neutral: "#c5d0d6",
  };

  return (
    <div className="animate-fade mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-white/10 bg-[rgba(7,19,28,0.88)] p-5 backdrop-blur-xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start gap-3">
            {speciesSpriteUrl(foeSpecies.id) && (
              <img
                src={speciesSpriteUrl(foeSpecies.id)!}
                alt=""
                className="h-20 w-20 shrink-0 object-contain"
                draggable={false}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs tracking-[0.2em] text-[var(--color-mist-dim)] uppercase">Wild</p>
              <h3 className="mt-1 font-display text-2xl font-bold">
                {displayName(battle.opponent.instance)}
              </h3>
              <p className="text-sm text-[var(--color-mist-dim)]">
                Lv.{battle.opponent.instance.level} · {foeSpecies.types.join("/")}
                {battle.opponent.instance.status ? ` · ${battle.opponent.instance.status}` : ""}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <HpBar
              current={battle.opponent.instance.currentHp}
              max={battle.opponent.maxHp}
              accent={typeColor[foeSpecies.types[0]] ?? "#7eb8ff"}
            />
            <p className="mt-1 text-right text-xs text-[var(--color-mist-dim)]">
              {battle.opponent.instance.currentHp}/{battle.opponent.maxHp}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start gap-3">
            {speciesSpriteUrl(playerSpecies.id) && (
              <img
                src={speciesSpriteUrl(playerSpecies.id)!}
                alt=""
                className="h-20 w-20 shrink-0 object-contain"
                draggable={false}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs tracking-[0.2em] text-[var(--color-horizon)] uppercase">
                Your party
              </p>
              <h3 className="mt-1 font-display text-2xl font-bold">
                {displayName(battle.player.instance)}
              </h3>
              <p className="text-sm text-[var(--color-mist-dim)]">
                Lv.{battle.player.instance.level} · {playerSpecies.types.join("/")}
                {battle.player.instance.status ? ` · ${battle.player.instance.status}` : ""}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <HpBar
              current={battle.player.instance.currentHp}
              max={battle.player.maxHp}
              accent={typeColor[playerSpecies.types[0]] ?? "#f2c97a"}
            />
            <p className="mt-1 text-right text-xs text-[var(--color-mist-dim)]">
              {battle.player.instance.currentHp}/{battle.player.maxHp}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-28 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-relaxed text-[var(--color-mist)]">
        {recent.length === 0 ? (
          <p>What will {displayName(battle.player.instance)} do?</p>
        ) : (
          recent.map((line, i) => <p key={`${i}-${line}`}>{line}</p>)
        )}
      </div>

      {battle.over ? (
        <button
          type="button"
          className="rounded-md bg-[var(--color-horizon)] px-5 py-3 font-display font-semibold text-[var(--color-ink)]"
          onClick={() => dispatch({ type: "END_BATTLE_ACK" })}
        >
          Continue
        </button>
      ) : (
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {battle.player.instance.moves.map((slot) => (
              <button
                key={slot.moveId}
                type="button"
                disabled={slot.ppRemaining <= 0}
                onClick={() =>
                  dispatch({
                    type: "BATTLE_ACTION",
                    action: { kind: "move", moveId: slot.moveId, actor: "player" },
                  })
                }
                className="rounded-md border border-white/15 bg-white/5 px-3 py-3 text-left transition hover:bg-white/10 disabled:opacity-40"
              >
                <div className="font-display text-sm font-semibold capitalize">
                  {slot.moveId.replaceAll("_", " ")}
                </div>
                <div className="text-xs text-[var(--color-mist-dim)]">PP {slot.ppRemaining}</div>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={(save.inventory.aetherball ?? 0) <= 0}
              onClick={() =>
                dispatch({
                  type: "BATTLE_ACTION",
                  action: { kind: "item", itemId: "aetherball", actor: "player" },
                })
              }
              className="rounded-md border border-[var(--color-tide)]/40 px-4 py-2 text-sm text-[var(--color-mist)] hover:bg-[var(--color-tide)]/15 disabled:opacity-40"
            >
              Aether Ball ×{save.inventory.aetherball ?? 0}
            </button>
            <button
              type="button"
              disabled={(save.inventory.greatball ?? 0) <= 0}
              onClick={() =>
                dispatch({
                  type: "BATTLE_ACTION",
                  action: { kind: "item", itemId: "greatball", actor: "player" },
                })
              }
              className="rounded-md border border-[var(--color-horizon)]/40 px-4 py-2 text-sm text-[var(--color-mist)] hover:bg-[var(--color-horizon)]/15 disabled:opacity-40"
            >
              Great Ball ×{save.inventory.greatball ?? 0}
            </button>
            <button
              type="button"
              disabled={(save.inventory.potion ?? 0) <= 0}
              onClick={() =>
                dispatch({
                  type: "BATTLE_ACTION",
                  action: { kind: "item", itemId: "potion", actor: "player" },
                })
              }
              className="rounded-md border border-white/20 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-40"
            >
              Potion ×{save.inventory.potion ?? 0}
            </button>
            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: "BATTLE_ACTION",
                  action: { kind: "flee", actor: "player" },
                })
              }
              className="rounded-md border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
            >
              Flee
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
