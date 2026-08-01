import { useEffect, useRef } from "react";
import { getMap } from "../../game/content/catalog";
import { stepBody3D, type MoveInput } from "../../game/overworld/controller3d";
import {
  createWorldScene,
  resizeRenderer,
  updateCamera,
  type WorldScene,
} from "../../game/overworld/scene3d";
import { useGameDispatch, useGameState } from "../../game/state/GameContext";

export default function Overworld3D() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useGameState();
  const dispatch = useGameDispatch();
  const worldRef = useRef<WorldScene | null>(null);
  const inputRef = useRef<MoveInput>({ forward: 0, strafe: 0 });
  const bodyRef = useRef(state.actor?.body ?? null);
  const graceRef = useRef(state.graceSteps);
  const modeRef = useRef(state.mode);
  modeRef.current = state.mode;

  // Keep body/grace in sync when returning from battle / loading
  useEffect(() => {
    if (state.actor) bodyRef.current = { ...state.actor.body };
    graceRef.current = state.graceSteps;
  }, [state.actor, state.graceSteps, state.mode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "m" || e.key === "M") {
        e.preventDefault();
        dispatch({ type: "OPEN_MENU" });
        return;
      }
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") inputRef.current.forward = -1;
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") inputRef.current.forward = 1;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") inputRef.current.strafe = -1;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") inputRef.current.strafe = 1;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        if (inputRef.current.forward < 0) inputRef.current.forward = 0;
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        if (inputRef.current.forward > 0) inputRef.current.forward = 0;
      }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        if (inputRef.current.strafe < 0) inputRef.current.strafe = 0;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        if (inputRef.current.strafe > 0) inputRef.current.strafe = 0;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [dispatch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !state.save || !state.actor) return;

    const map = getMap(state.save.player.mapId);
    const world = createWorldScene(canvas, map);
    worldRef.current = world;
    bodyRef.current = { ...state.actor.body };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      resizeRenderer(world, rect.width, rect.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let frame = 0;
    let last = performance.now();
    let alive = true;

    const loop = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const body = bodyRef.current;
      const mode = modeRef.current;
      const canWalk = Boolean(body) && (mode === "overworld" || mode === "menu");
      if (body && canWalk) {
        const input =
          mode === "menu" ? { forward: 0, strafe: 0 } : inputRef.current;
        const stepped = stepBody3D(body, map, input, dt);
        bodyRef.current = stepped.body;

        world.player.position.set(stepped.body.x, 0, stepped.body.z);
        world.player.rotation.y = stepped.body.yaw;

        // Soft grass sway
        const t = now * 0.001;
        for (let i = 0; i < world.grass.length; i++) {
          world.grass[i].rotation.z = Math.sin(t * 2 + i) * 0.12;
        }

        updateCamera(
          world.camera,
          stepped.body.x,
          stepped.body.z,
          stepped.body.yaw,
          dt,
        );

        if (stepped.enteredTile && mode === "overworld") {
          dispatch({
            type: "ENTER_TILE",
            tileX: stepped.body.tileX,
            tileY: stepped.body.tileY,
            facing: stepped.body.facing,
            body: stepped.body,
            skipEncounter: graceRef.current > 0,
          });
        }
      }

      world.renderer.render(world.scene, world.camera);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      ro.disconnect();
      world.dispose();
      worldRef.current = null;
    };
    // Recreate when map changes or when leaving/returning from battle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.save?.player.mapId, state.mode === "battle", dispatch]);

  return (
    <div
      ref={wrapRef}
      className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#07131c] shadow-[inset_0_0_60px_rgba(47,158,168,0.12)]"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-3 text-xs tracking-wide text-[var(--color-mist-dim)]">
        <span>{state.save ? getMap(state.save.player.mapId).name : ""} · 3D</span>
        <span>WASD / Arrows · Esc menu</span>
      </div>
    </div>
  );
}
