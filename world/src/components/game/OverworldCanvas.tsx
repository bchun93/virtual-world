import { useEffect, useRef } from "react";
import { getMap } from "../../game/content/catalog";
import { pixelPosition } from "../../game/overworld/movement";
import { useGameDispatch, useGameState } from "../../game/state/GameContext";
import type { Direction } from "../../game/types";

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  W: "up",
  S: "down",
  A: "left",
  D: "right",
};

export default function OverworldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useGameState();
  const dispatch = useGameDispatch();
  const held = useRef<Direction | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "m" || e.key === "M") {
        e.preventDefault();
        dispatch({ type: "OPEN_MENU" });
        return;
      }
      const dir = KEY_MAP[e.key];
      if (!dir) return;
      e.preventDefault();
      held.current = dir;
      dispatch({ type: "BUFFER_DIR", dir });
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const dir = KEY_MAP[e.key];
      if (dir && held.current === dir) held.current = null;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [dispatch]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (held.current) {
        dispatch({ type: "BUFFER_DIR", dir: held.current });
      }
      dispatch({ type: "TICK", dt });
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [dispatch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state.save || !state.actor) return;
    const map = getMap(state.save.player.mapId);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { tileSize } = map;
    canvas.width = map.width * tileSize;
    canvas.height = map.height * tileSize;

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y][x];
        if (tile === 1) ctx.fillStyle = "#1a3a42";
        else if (tile === 2) ctx.fillStyle = "#2f6b45";
        else ctx.fillStyle = "#3d7a55";
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

        if (tile === 2) {
          ctx.fillStyle = "rgba(180, 230, 140, 0.25)";
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(
              x * tileSize + 6 + i * 8,
              y * tileSize + 10 + (i % 2) * 6,
              3,
              10,
            );
          }
        }
        if (tile === 1) {
          ctx.strokeStyle = "rgba(255,255,255,0.06)";
          ctx.strokeRect(x * tileSize + 0.5, y * tileSize + 0.5, tileSize - 1, tileSize - 1);
        }
      }
    }

    const pos = pixelPosition(state.actor, tileSize);
    // Player avatar
    ctx.fillStyle = "#f2c97a";
    ctx.fillRect(pos.x + 6, pos.y + 4, tileSize - 12, tileSize - 8);
    ctx.fillStyle = "#07131c";
    const face = state.actor.facing;
    const cx = pos.x + tileSize / 2;
    const cy = pos.y + tileSize / 2;
    if (face === "up") ctx.fillRect(cx - 3, cy - 8, 6, 4);
    if (face === "down") ctx.fillRect(cx - 3, cy + 4, 6, 4);
    if (face === "left") ctx.fillRect(cx - 8, cy - 3, 4, 6);
    if (face === "right") ctx.fillRect(cx + 4, cy - 3, 4, 6);
  }, [state.actor, state.save]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(7,19,28,0.55)] shadow-[inset_0_0_60px_rgba(47,158,168,0.12)]">
      <canvas ref={canvasRef} className="mx-auto block max-w-full" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-3 text-xs tracking-wide text-[var(--color-mist-dim)]">
        <span>{state.save ? getMap(state.save.player.mapId).name : ""}</span>
        <span>Arrows / WASD · Esc menu</span>
      </div>
    </div>
  );
}
