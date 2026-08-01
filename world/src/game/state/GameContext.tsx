import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { createBattle, runTurn } from "../battle/engine";
import { getMap, getSpecies, listStarters, validateContent } from "../content/catalog";
import { encounterZoneAt } from "../overworld/movement";
import { rollEncounter } from "../overworld/encounters";
import { createInstance, displayName } from "../progression/creature";
import { getMaxHp } from "../progression/stats";
import type {
  BattleAction,
  BattleState,
  CreatureInstance,
  Direction,
  GameMode,
  SaveData,
} from "../types";
import type { Body3D } from "../overworld/controller3d";
import {
  clearSave,
  createNewSave,
  hasSave,
  loadGame,
  saveGame,
} from "./save";
import {
  advanceMove,
  createActor,
  tryStartMove,
  type OverworldActor,
} from "../overworld/movement";

export interface GameRuntime {
  mode: GameMode;
  save: SaveData | null;
  actor: OverworldActor | null;
  battle: BattleState | null;
  bufferedInput: Direction | null;
  graceSteps: number;
  lastMessage: string | null;
  contentErrors: string[];
  hasSave: boolean;
}

type Action =
  | { type: "BOOT" }
  | { type: "NEW_GAME"; name: string }
  | { type: "CONTINUE" }
  | { type: "PICK_STARTER"; speciesId: string }
  | { type: "ENTER_OVERWORLD" }
  | { type: "BUFFER_DIR"; dir: Direction }
  | { type: "TICK"; dt: number }
  | {
      type: "ENTER_TILE";
      tileX: number;
      tileY: number;
      facing: Direction;
      body: Body3D;
      skipEncounter?: boolean;
    }
  | { type: "OPEN_MENU" }
  | { type: "CLOSE_MENU" }
  | { type: "BATTLE_ACTION"; action: BattleAction }
  | { type: "END_BATTLE_ACK" }
  | { type: "SAVE" }
  | { type: "CLEAR_SAVE" }
  | { type: "TO_TITLE" }
  | { type: "SET_MESSAGE"; text: string | null };

const initial: GameRuntime = {
  mode: "title",
  save: null,
  actor: null,
  battle: null,
  bufferedInput: null,
  graceSteps: 0,
  lastMessage: null,
  contentErrors: [],
  hasSave: false,
};

function markSeenCaught(save: SaveData, speciesId: string, caught: boolean): SaveData {
  const seen = save.seen.includes(speciesId) ? save.seen : [...save.seen, speciesId];
  const caughtList =
    caught && !save.caught.includes(speciesId)
      ? [...save.caught, speciesId]
      : save.caught;
  return { ...save, seen, caught: caughtList };
}

function startWildBattle(state: GameRuntime, wild: CreatureInstance): GameRuntime {
  if (!state.save || state.save.party.length === 0) return state;
  const battle = createBattle(state.save.party, wild);
  const save = markSeenCaught(state.save, wild.speciesId, false);
  return {
    ...state,
    mode: "battle",
    battle,
    save,
    lastMessage: `A wild ${displayName(wild)} appeared!`,
    graceSteps: 4,
  };
}

function reducer(state: GameRuntime, action: Action): GameRuntime {
  switch (action.type) {
    case "BOOT": {
      const contentErrors = validateContent();
      return { ...state, contentErrors, hasSave: hasSave() };
    }
    case "NEW_GAME": {
      const save = createNewSave(action.name.trim() || "Traveler");
      return {
        ...state,
        mode: "starter",
        save,
        actor: null,
        battle: null,
        lastMessage: "Choose your first companion.",
      };
    }
    case "CONTINUE": {
      const save = loadGame();
      if (!save || save.party.length === 0) {
        return { ...state, lastMessage: "No valid save found." };
      }
      const [x, y] = save.player.tile;
      return {
        ...state,
        mode: "overworld",
        save,
        actor: createActor(x, y, save.player.facing),
        battle: null,
        hasSave: true,
        lastMessage: `Welcome back, ${save.player.name}.`,
      };
    }
    case "PICK_STARTER": {
      if (!state.save) return state;
      const starter = createInstance(action.speciesId, 5);
      const save: SaveData = {
        ...state.save,
        party: [starter],
        seen: [action.speciesId],
        caught: [action.speciesId],
        flags: { ...state.save.flags, chose_starter: true },
      };
      saveGame(save);
      const [x, y] = save.player.tile;
      return {
        ...state,
        mode: "overworld",
        save,
        actor: createActor(x, y, save.player.facing),
        hasSave: true,
        lastMessage: `${displayName(starter)} joined your party! Walk into the tall grass.`,
      };
    }
    case "BUFFER_DIR": {
      // Legacy 2D grid path (unused by 3D overworld)
      if (state.mode !== "overworld" || !state.actor || !state.save) return state;
      if (state.actor.isMoving) {
        return { ...state, bufferedInput: action.dir };
      }
      const map = getMap(state.save.player.mapId);
      const { actor, bumped } = tryStartMove(state.actor, map, action.dir);
      return {
        ...state,
        actor,
        bufferedInput: null,
        lastMessage: bumped ? state.lastMessage : state.lastMessage,
        save: {
          ...state.save,
          player: { ...state.save.player, facing: action.dir },
        },
      };
    }
    case "TICK": {
      // Legacy 2D grid path (unused by 3D overworld)
      if (state.mode !== "overworld" || !state.actor || !state.save) return state;
      let actor = state.actor;
      let buffered = state.bufferedInput;
      let save = state.save;
      let grace = state.graceSteps;
      let battleStart: CreatureInstance | null = null;

      const stepped = advanceMove(actor, action.dt);
      actor = stepped.actor;

      if (stepped.arrived) {
        save = {
          ...save,
          player: {
            ...save.player,
            tile: [actor.tileX, actor.tileY],
            facing: actor.facing,
          },
        };
        const map = getMap(save.player.mapId);
        const zoneId = encounterZoneAt(map, actor.tileX, actor.tileY);
        if (grace > 0) {
          grace -= 1;
        } else if (zoneId) {
          const zone = map.encounterZones[zoneId];
          if (zone) {
            battleStart = rollEncounter(zone);
          }
        }

        if (!battleStart && buffered) {
          const moved = tryStartMove(actor, map, buffered);
          actor = moved.actor;
          buffered = null;
          save = {
            ...save,
            player: { ...save.player, facing: actor.facing },
          };
        } else {
          buffered = null;
        }
      }

      if (battleStart) {
        return startWildBattle(
          { ...state, actor, save, bufferedInput: buffered, graceSteps: grace },
          battleStart,
        );
      }

      return {
        ...state,
        actor,
        save,
        bufferedInput: buffered,
        graceSteps: grace,
      };
    }
    case "ENTER_TILE": {
      if (state.mode !== "overworld" || !state.actor || !state.save) return state;
      const actor: OverworldActor = {
        ...state.actor,
        tileX: action.tileX,
        tileY: action.tileY,
        facing: action.facing,
        body: action.body,
        fromX: action.tileX,
        fromY: action.tileY,
        toX: action.tileX,
        toY: action.tileY,
        isMoving: false,
        moveProgress: 0,
      };
      const save: SaveData = {
        ...state.save,
        player: {
          ...state.save.player,
          tile: [action.tileX, action.tileY],
          facing: action.facing,
        },
      };

      let grace = state.graceSteps;
      if (grace > 0) grace -= 1;

      if (!action.skipEncounter && grace <= 0) {
        const map = getMap(save.player.mapId);
        const zoneId = encounterZoneAt(map, action.tileX, action.tileY);
        if (zoneId) {
          const zone = map.encounterZones[zoneId];
          if (zone) {
            const wild = rollEncounter(zone);
            if (wild) {
              return startWildBattle(
                { ...state, actor, save, graceSteps: grace },
                wild,
              );
            }
          }
        }
      }

      return { ...state, actor, save, graceSteps: grace };
    }
    case "OPEN_MENU":
      if (state.mode !== "overworld") return state;
      return { ...state, mode: "menu" };
    case "CLOSE_MENU":
      if (state.mode !== "menu") return state;
      return { ...state, mode: "overworld" };
    case "BATTLE_ACTION": {
      if (!state.battle || state.battle.over || !state.save) return state;
      // Spend ball/potion from inventory when used
      let save = state.save;
      if (action.action.kind === "item") {
        const count = save.inventory[action.action.itemId] ?? 0;
        if (count <= 0) {
          return { ...state, lastMessage: "None left!" };
        }
        save = {
          ...save,
          inventory: {
            ...save.inventory,
            [action.action.itemId]: count - 1,
          },
        };
      }
      const battle = runTurn(state.battle, action.action);
      return { ...state, battle, save, lastMessage: null };
    }
    case "END_BATTLE_ACK": {
      if (!state.battle || !state.save || !state.battle.over) return state;
      let save: SaveData = {
        ...state.save,
        party: state.battle.playerParty.map((c) => ({ ...c })),
      };
      // sync active
      const active = state.battle.player.instance;
      const idx = save.party.findIndex((c) => c.instanceId === active.instanceId);
      if (idx >= 0) save.party[idx] = { ...active };

      if (state.battle.result === "caught") {
        const wild = { ...state.battle.opponent.instance };
        wild.currentHp = Math.max(1, wild.currentHp);
        save = markSeenCaught(save, wild.speciesId, true);
        if (save.party.length < 6) save.party = [...save.party, wild];
        else {
          const boxes = save.boxes.map((b) => [...b]);
          boxes[0] = [...boxes[0], wild];
          save = { ...save, boxes };
        }
      }

      if (state.battle.result === "lost") {
        save = {
          ...save,
          player: { ...save.player, tile: [2, 6], facing: "down" },
          party: save.party.map((c) => ({
            ...c,
            status: null,
            currentHp: getMaxHp(getSpecies(c.speciesId), c),
          })),
        };
      }

      saveGame(save);
      const [x, y] = save.player.tile;
      return {
        ...state,
        mode: "overworld",
        save,
        battle: null,
        actor: createActor(x, y, save.player.facing),
        graceSteps: 5,
        lastMessage:
          state.battle.result === "caught"
            ? "Creature added to your collection!"
            : state.battle.result === "lost"
              ? "You blacked out… and woke at Meadow Edge."
              : state.battle.result === "won"
                ? "You won!"
                : "Returned to the meadow.",
        hasSave: true,
      };
    }
    case "SAVE": {
      if (!state.save || !state.actor) return state;
      const save: SaveData = {
        ...state.save,
        player: {
          ...state.save.player,
          tile: [state.actor.tileX, state.actor.tileY],
          facing: state.actor.facing,
        },
      };
      saveGame(save);
      return {
        ...state,
        save,
        hasSave: true,
        lastMessage: "Game saved.",
        mode: state.mode === "menu" ? "overworld" : state.mode,
      };
    }
    case "CLEAR_SAVE": {
      clearSave();
      return { ...initial, contentErrors: state.contentErrors, hasSave: false };
    }
    case "TO_TITLE": {
      if (state.save && state.actor) {
        const save: SaveData = {
          ...state.save,
          player: {
            ...state.save.player,
            tile: [state.actor.tileX, state.actor.tileY],
            facing: state.actor.facing,
          },
        };
        saveGame(save);
      }
      return {
        ...initial,
        contentErrors: state.contentErrors,
        hasSave: hasSave(),
        mode: "title",
      };
    }
    case "SET_MESSAGE":
      return { ...state, lastMessage: action.text };
    default:
      return state;
  }
}

const GameStateContext = createContext<GameRuntime>(initial);
const GameDispatchContext = createContext<Dispatch<Action>>(() => undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    dispatch({ type: "BOOT" });
  }, []);

  // Heal overflow HP after loss using proper max — fix in END_BATTLE_ACK is crude; clamp on read in UI via stats
  useEffect(() => {
    if (!state.save) return;
    // no-op placeholder for future side effects
  }, [state.save]);

  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  return useContext(GameStateContext);
}

export function useGameDispatch() {
  return useContext(GameDispatchContext);
}

export function useStarters() {
  return listStarters();
}
