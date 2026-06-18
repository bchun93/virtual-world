import { Link } from "react-router-dom";
import type { ActionItem } from "../types";
import { useTaskStore } from "../hooks/useTaskStore";
import {
  getAssignee,
  getEffectiveStatus,
  getNotes,
  isComplete,
} from "../utils/tasks";
import StatusBadge from "./StatusBadge";

interface TaskRowProps {
  item: ActionItem;
  selected?: boolean;
  onSelect?: (itemId: string) => void;
  compact?: boolean;
}

export default function TaskRow({
  item,
  selected = false,
  onSelect,
  compact = false,
}: TaskRowProps) {
  const { overrides, toggleComplete } = useTaskStore();
  const status = getEffectiveStatus(item, overrides);
  const completed = isComplete(item, overrides);
  const assignee = getAssignee(item, overrides);
  const notes = getNotes(item, overrides);
  const isSubtask = Boolean(item.parent_item_id);

  return (
    <div
      className={[
        "rounded-2xl border bg-white transition",
        selected ? "border-forest-700 shadow-md" : "border-sand-200 hover:border-forest-700/30",
        compact ? "p-4" : "p-5",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => toggleComplete(item.item_id)}
          className={[
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
            completed
              ? "border-forest-700 bg-forest-700 text-white"
              : "border-sand-200 bg-white hover:border-forest-700",
          ].join(" ")}
          aria-label={completed ? "Mark incomplete" : "Mark complete"}
        >
          {completed && (
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
              <path d="M6.2 11.6 2.8 8.2l1.4-1.4 2 2 5.6-5.6 1.4 1.4z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-forest-800/50">
              {item.item_id}
            </span>
            {isSubtask && (
              <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-forest-800/60">
                Subtask of {item.parent_item_id}
              </span>
            )}
            <StatusBadge status={status} />
            {assignee !== "Unassigned" && (
              <span className="rounded-full bg-forest-100 px-2 py-0.5 text-[10px] font-medium text-forest-800">
                {assignee}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelect?.(item.item_id)}
            className="mt-2 block w-full text-left"
          >
            <p
              className={[
                "text-sm leading-relaxed",
                completed ? "text-forest-800/50 line-through" : "text-forest-950",
              ].join(" ")}
            >
              {item.action_item}
            </p>
          </button>

          {!compact && notes && (
            <p className="mt-3 rounded-xl bg-sand-50 px-3 py-2 text-xs leading-relaxed text-forest-800/70">
              {notes}
            </p>
          )}

          {!compact && (
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <Link
                to={`/phases/${item.phase_number}`}
                className="font-medium text-copper-600 hover:text-copper-500"
              >
                Phase {item.phase_number}
              </Link>
              <span className="text-forest-800/30">·</span>
              <span className="text-forest-800/60">{item.phase_name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
