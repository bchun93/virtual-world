import { getItem, getMove, getSpecies } from "../content/catalog";
import { runCaptureChecks } from "../progression/capture";
import { cloneInstance, displayName } from "../progression/creature";
import { applyExp, expGainFromDefeat } from "../progression/experience";
import { effectiveStat, getMaxHp } from "../progression/stats";
import type {
  BattleAction,
  BattleCreatureView,
  BattleEvent,
  BattleResult,
  BattleSide,
  BattleState,
  CreatureInstance,
  Move,
  StatKey,
  StatusCondition,
} from "../types";
import { computeDamage, rollCritical, rollRandomFactor } from "./damage";
import { effectivenessLabel } from "./typeEffectiveness";

function emptyStages(): Record<Exclude<StatKey, "hp">, number> {
  return { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0 };
}

function toView(instance: CreatureInstance): BattleCreatureView {
  const species = getSpecies(instance.speciesId);
  return {
    instance: cloneInstance(instance),
    maxHp: getMaxHp(species, instance),
    stages: emptyStages(),
    sleepTurns: instance.status === "sleep" ? 2 + Math.floor(Math.random() * 2) : 0,
  };
}

export function createBattle(
  party: CreatureInstance[],
  wild: CreatureInstance,
): BattleState {
  const lead =
    party.find((c) => c.currentHp > 0) ??
    (() => {
      throw new Error("No conscious party creature");
    })();

  return {
    player: toView(lead),
    opponent: toView(wild),
    playerParty: party.map(cloneInstance),
    turn: 0,
    over: false,
    result: null,
    log: [],
    wild: true,
  };
}

function viewOf(state: BattleState, side: BattleSide): BattleCreatureView {
  return side === "player" ? state.player : state.opponent;
}

function other(side: BattleSide): BattleSide {
  return side === "player" ? "opponent" : "player";
}

function actionPriority(action: BattleAction): number {
  if (action.kind === "flee" || action.kind === "item" || action.kind === "switch") {
    return 6;
  }
  return getMove(action.moveId).priority;
}

function effectiveSpeed(state: BattleState, side: BattleSide): number {
  const view = viewOf(state, side);
  const species = getSpecies(view.instance.speciesId);
  let spd = effectiveStat(species, view.instance, "spd", view.stages.spd);
  if (view.instance.status === "paralysis") spd = Math.max(1, Math.floor(spd / 2));
  return spd;
}

function orderActions(
  state: BattleState,
  actions: BattleAction[],
  rng: () => number,
): BattleAction[] {
  return [...actions].sort((a, b) => {
    const pa = actionPriority(a);
    const pb = actionPriority(b);
    if (pa !== pb) return pb - pa;
    const sa = effectiveSpeed(state, a.actor);
    const sb = effectiveSpeed(state, b.actor);
    if (sa !== sb) return sb - sa;
    return rng() < 0.5 ? -1 : 1;
  });
}

function canAct(
  state: BattleState,
  side: BattleSide,
  events: BattleEvent[],
  rng: () => number,
): boolean {
  const view = viewOf(state, side);
  if (view.instance.currentHp <= 0) return false;
  const status = view.instance.status;
  if (status === "sleep") {
    if (view.sleepTurns <= 0) {
      view.instance.status = null;
      events.push({ type: "message", text: `${displayName(view.instance)} woke up!` });
      return true;
    }
    view.sleepTurns -= 1;
    events.push({ type: "statusSkip", side, status: "sleep" });
    return false;
  }
  if (status === "freeze") {
    if (rng() < 0.2) {
      view.instance.status = null;
      events.push({ type: "message", text: `${displayName(view.instance)} thawed out!` });
      return true;
    }
    events.push({ type: "statusSkip", side, status: "freeze" });
    return false;
  }
  if (status === "paralysis" && rng() < 0.25) {
    events.push({ type: "statusSkip", side, status: "paralysis" });
    return false;
  }
  return true;
}

function applyStatus(
  target: BattleCreatureView,
  status: Exclude<StatusCondition, null>,
  targetSide: BattleSide,
  events: BattleEvent[],
): void {
  if (target.instance.status) return;
  target.instance.status = status;
  if (status === "sleep") target.sleepTurns = 1 + Math.floor(Math.random() * 3);
  events.push({ type: "statusApplied", target: targetSide, status });
}

function applyMoveEffect(
  move: Move,
  userSide: BattleSide,
  state: BattleState,
  events: BattleEvent[],
  rng: () => number,
): void {
  if (!move.effect) return;
  const targetSide =
    move.target === "self" ? userSide : other(userSide);
  const target = viewOf(state, targetSide);

  if (move.effect.kind === "status") {
    applyStatus(target, move.effect.status, targetSide, events);
  } else if (move.effect.kind === "statusChance") {
    if (rng() * 100 < move.effect.chance) {
      applyStatus(target, move.effect.status, targetSide, events);
    }
  } else if (move.effect.kind === "statStage") {
    const stat = move.effect.stat;
    target.stages[stat] = Math.max(
      -6,
      Math.min(6, target.stages[stat] + move.effect.stages),
    );
    events.push({
      type: "statStage",
      target: targetSide,
      stat,
      stages: move.effect.stages,
    });
  }
}

function resolveMove(
  state: BattleState,
  actor: BattleSide,
  moveId: string,
  events: BattleEvent[],
  rng: () => number,
): void {
  const user = viewOf(state, actor);
  const target = viewOf(state, other(actor));
  const move = getMove(moveId);
  const slot = user.instance.moves.find((m) => m.moveId === moveId);
  if (!slot || slot.ppRemaining <= 0) {
    events.push({ type: "message", text: "No PP left!" });
    return;
  }
  slot.ppRemaining -= 1;

  events.push({
    type: "moveUsed",
    actor,
    moveId,
    moveName: move.name,
  });

  if (move.accuracy != null && rng() * 100 >= move.accuracy) {
    events.push({ type: "miss", actor });
    return;
  }

  if (move.category !== "status") {
    const critical = rollCritical(rng);
    const random = rollRandomFactor(rng);
    const result = computeDamage({
      attacker: user,
      defender: target,
      move,
      critical,
      random,
    });
    target.instance.currentHp = Math.max(0, target.instance.currentHp - result.damage);
    events.push({
      type: "damage",
      actor,
      target: other(actor),
      amount: result.damage,
      effectiveness: result.effectiveness,
      critical,
      remainingHp: target.instance.currentHp,
    });
    const label = effectivenessLabel(result.effectiveness);
    if (label) events.push({ type: "message", text: label });
    if (critical && result.damage > 0) {
      events.push({ type: "message", text: "A critical hit!" });
    }
  }

  applyMoveEffect(move, actor, state, events, rng);

  if (target.instance.currentHp <= 0) {
    events.push({ type: "faint", side: other(actor) });
  }
}

function endOfTurn(state: BattleState, events: BattleEvent[]): void {
  for (const side of ["player", "opponent"] as BattleSide[]) {
    const view = viewOf(state, side);
    if (view.instance.currentHp <= 0) continue;
    const status = view.instance.status;
    if (status === "burn" || status === "poison") {
      const chip = Math.max(1, Math.floor(view.maxHp / 8));
      view.instance.currentHp = Math.max(0, view.instance.currentHp - chip);
      events.push({ type: "statusChip", side, amount: chip, status });
      if (view.instance.currentHp <= 0) {
        events.push({ type: "faint", side });
      }
    }
  }
}

function syncPartyLead(state: BattleState): void {
  const idx = state.playerParty.findIndex(
    (c) => c.instanceId === state.player.instance.instanceId,
  );
  if (idx >= 0) state.playerParty[idx] = cloneInstance(state.player.instance);
}

function finish(
  state: BattleState,
  result: BattleResult,
  events: BattleEvent[],
): BattleState {
  state.over = true;
  state.result = result;
  syncPartyLead(state);

  if (result === "won" || result === "caught") {
    const gain = expGainFromDefeat(
      state.opponent.instance.speciesId,
      state.opponent.instance.level,
    );
    const leveled = applyExp(state.player.instance, gain);
    state.player.instance = leveled.instance;
    state.player.maxHp = getMaxHp(
      getSpecies(leveled.instance.speciesId),
      leveled.instance,
    );
    events.push({
      type: "expGain",
      instanceId: leveled.instance.instanceId,
      amount: gain,
      leveledTo: leveled.levelsGained > 0 ? leveled.instance.level : undefined,
    });
    if (leveled.evolvedTo) {
      events.push({
        type: "message",
        text: `It evolved into ${getSpecies(leveled.evolvedTo).name}!`,
      });
    }
    syncPartyLead(state);
  }

  events.push({ type: "battleEnd", result });
  state.log = [...state.log, ...events];
  return state;
}

function pickAiMove(state: BattleState, rng: () => number): string {
  const moves = state.opponent.instance.moves.filter((m) => m.ppRemaining > 0);
  if (moves.length === 0) return state.opponent.instance.moves[0]?.moveId ?? "tackle";
  const pick = moves[Math.floor(rng() * moves.length)];
  return pick.moveId;
}

export function chooseOpponentAction(
  state: BattleState,
  rng: () => number = Math.random,
): BattleAction {
  return { kind: "move", moveId: pickAiMove(state, rng), actor: "opponent" };
}

export function runTurn(
  state: BattleState,
  playerAction: BattleAction,
  rng: () => number = Math.random,
): BattleState {
  if (state.over) return state;
  const next: BattleState = {
    ...state,
    player: {
      ...state.player,
      instance: cloneInstance(state.player.instance),
      stages: { ...state.player.stages },
    },
    opponent: {
      ...state.opponent,
      instance: cloneInstance(state.opponent.instance),
      stages: { ...state.opponent.stages },
    },
    playerParty: state.playerParty.map(cloneInstance),
    turn: state.turn + 1,
    log: [...state.log],
  };

  const events: BattleEvent[] = [{ type: "turnStart", turn: next.turn }];
  const opponentAction =
    playerAction.kind === "flee" || playerAction.kind === "item"
      ? null
      : chooseOpponentAction(next, rng);

  if (playerAction.kind === "flee") {
    const success = rng() < 0.5;
    events.push({ type: "fled", success });
    if (success) return finish(next, "fled", events);
    // Failed flee — opponent still acts
  }

  if (playerAction.kind === "item") {
    const item = getItem(playerAction.itemId);
    if (item.category === "ball" && next.wild) {
      const { shakes, success } = runCaptureChecks(
        next.opponent.instance,
        playerAction.itemId,
        rng,
      );
      events.push({ type: "captureAttempt", shakes, success });
      if (success) return finish(next, "caught", events);
    } else if (item.category === "heal" && item.heal) {
      const heal = item.heal;
      next.player.instance.currentHp = Math.min(
        next.player.maxHp,
        next.player.instance.currentHp + heal,
      );
      events.push({
        type: "message",
        text: `Used ${item.name}. Restored HP!`,
      });
    }
  }

  const actions: BattleAction[] = [];
  if (playerAction.kind === "move") actions.push(playerAction);
  if (opponentAction) actions.push(opponentAction);

  const ordered = orderActions(next, actions, rng);
  for (const action of ordered) {
    if (next.over) break;
    const actorView = viewOf(next, action.actor);
    if (actorView.instance.currentHp <= 0) continue;
    if (!canAct(next, action.actor, events, rng)) continue;
    if (action.kind === "move") {
      resolveMove(next, action.actor, action.moveId, events, rng);
    }
  }

  endOfTurn(next, events);

  if (next.opponent.instance.currentHp <= 0) {
    return finish(next, "won", events);
  }
  if (next.player.instance.currentHp <= 0) {
    const backup = next.playerParty.find(
      (c) =>
        c.instanceId !== next.player.instance.instanceId && c.currentHp > 0,
    );
    if (!backup) return finish(next, "lost", events);
    // Auto-switch for vertical slice
    syncPartyLead(next);
    next.player = toView(backup);
    events.push({
      type: "message",
      text: `Go, ${displayName(backup)}!`,
    });
  }

  syncPartyLead(next);
  next.log = [...next.log, ...events];
  return next;
}

export function battleSummary(events: BattleEvent[]): string[] {
  return events
    .map((e) => {
      switch (e.type) {
        case "message":
          return e.text;
        case "moveUsed":
          return `${e.actor === "player" ? "You" : "Foe"} used ${e.moveName}!`;
        case "damage":
          return `Dealt ${e.amount} damage.`;
        case "miss":
          return "The attack missed!";
        case "faint":
          return e.side === "opponent" ? "The wild creature fainted!" : "Your creature fainted!";
        case "captureAttempt":
          return e.success
            ? "Gotcha! Creature caught!"
            : `The ball shook ${e.shakes} time(s)… then broke free!`;
        case "fled":
          return e.success ? "Got away safely!" : "Couldn't escape!";
        case "expGain":
          return `Gained ${e.amount} EXP${e.leveledTo ? ` — grew to Lv.${e.leveledTo}!` : "."}`;
        case "statusApplied":
          return `Status: ${e.status}.`;
        case "statusChip":
          return `Hurt by ${e.status} for ${e.amount}.`;
        default:
          return null;
      }
    })
    .filter((x): x is string => Boolean(x));
}
