import { useEffect, useState } from "react";
import type { ActionItem } from "../types";
import { ASSIGNEES, TASK_STATUSES } from "../types";
import { useTaskActions, useTaskStore } from "../hooks/useTaskStore";
import {
  getAssignee,
  getEffectiveStatus,
  getNotes,
  isComplete,
} from "../utils/tasks";
import StatusBadge from "./StatusBadge";

interface TaskDetailPanelProps {
  item: ActionItem | null;
  onClose: () => void;
}

export default function TaskDetailPanel({ item, onClose }: TaskDetailPanelProps) {
  const { overrides } = useTaskStore();
  const { setStatus, setNotes, setAssignee, toggleComplete } = useTaskActions();
  const [draftNotes, setDraftNotes] = useState("");

  useEffect(() => {
    if (item) {
      setDraftNotes(getNotes(item, overrides));
    }
  }, [item, overrides]);

  if (!item) {
    return (
      <div className="rounded-2xl border border-dashed border-sand-200 bg-white/60 p-8 text-center">
        <p className="font-display text-lg font-semibold text-forest-950">
          Select a task
        </p>
        <p className="mt-2 text-sm text-forest-800/60">
          Choose an action item to update status, assign a partner, or add notes.
        </p>
      </div>
    );
  }

  const status = getEffectiveStatus(item, overrides);
  const completed = isComplete(item, overrides);
  const assignee = getAssignee(item, overrides);

  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-forest-800/50">
            Item {item.item_id}
          </p>
          <h3 className="font-display mt-2 text-xl font-semibold leading-snug text-forest-950">
            {item.action_item}
          </h3>
          <p className="mt-2 text-sm text-forest-800/60">
            Phase {item.phase_number}: {item.phase_name}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm text-forest-800/50 hover:bg-sand-100 hover:text-forest-950"
        >
          Close
        </button>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-forest-800/50">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {TASK_STATUSES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStatus(item.item_id, option)}
                className={[
                  "rounded-full px-3 py-1.5 text-xs font-medium transition",
                  status === option
                    ? "bg-forest-900 text-white"
                    : "bg-sand-100 text-forest-800 hover:bg-sand-200",
                ].join(" ")}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <StatusBadge status={status} />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-forest-800/50">
            Assignee
          </label>
          <select
            value={assignee}
            onChange={(event) =>
              setAssignee(item.item_id, event.target.value as typeof assignee)
            }
            className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-forest-700"
          >
            {ASSIGNEES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-forest-800/50">
            Notes
          </label>
          <textarea
            value={draftNotes}
            onChange={(event) => setDraftNotes(event.target.value)}
            onBlur={() => setNotes(item.item_id, draftNotes)}
            rows={5}
            placeholder="Decisions, links, blockers, next steps..."
            className="w-full rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-forest-700"
          />
        </div>

        <button
          type="button"
          onClick={() => toggleComplete(item.item_id)}
          className={[
            "w-full rounded-xl px-4 py-3 text-sm font-semibold transition",
            completed
              ? "bg-sand-100 text-forest-800 hover:bg-sand-200"
              : "bg-forest-900 text-white hover:bg-forest-800",
          ].join(" ")}
        >
          {completed ? "Mark as not complete" : "Mark as complete"}
        </button>
      </div>
    </div>
  );
}
