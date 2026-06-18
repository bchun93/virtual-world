import { useMemo, useState } from "react";
import TaskDetailPanel from "../components/TaskDetailPanel";
import TaskRow from "../components/TaskRow";
import { SectionHeader } from "../components/StatsCard";
import { useTaskStore } from "../hooks/useTaskStore";
import type { Assignee, TaskStatus } from "../types";
import { ASSIGNEES, TASK_STATUSES } from "../types";
import { filterItems, groupByPhase } from "../utils/tasks";

export default function TasksPage() {
  const { items, overrides, resetAll } = useTaskStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "All">("All");
  const [phase, setPhase] = useState<number | "All">("All");
  const [assignee, setAssignee] = useState<Assignee | "All">("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const phases = useMemo(() => groupByPhase(items), [items]);

  const filteredItems = useMemo(
    () =>
      filterItems(items, overrides, {
        search,
        status,
        phase,
        assignee,
      }),
    [items, overrides, search, status, phase, assignee],
  );

  const selectedItem =
    items.find((item) => item.item_id === selectedId) ?? null;

  return (
    <div className="px-6 py-8 lg:px-10 lg:py-10">
      <SectionHeader
        title="All Tasks"
        description="Search, filter, and update any action item across all phases."
        action={
          <button
            type="button"
            onClick={resetAll}
            className="rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-sm font-medium text-forest-800 transition hover:border-red-200 hover:bg-red-50 hover:text-red-800"
          >
            Reset progress
          </button>
        }
      />

      <div className="mb-6 grid gap-3 rounded-2xl border border-sand-200 bg-white p-4 shadow-sm lg:grid-cols-4">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tasks, notes, phases..."
          className="rounded-xl border border-sand-200 px-3 py-2.5 text-sm outline-none focus:border-forest-700 lg:col-span-2"
        />

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as TaskStatus | "All")
          }
          className="rounded-xl border border-sand-200 px-3 py-2.5 text-sm outline-none focus:border-forest-700"
        >
          <option value="All">All statuses</option>
          {TASK_STATUSES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={phase}
          onChange={(event) =>
            setPhase(
              event.target.value === "All" ? "All" : Number(event.target.value),
            )
          }
          className="rounded-xl border border-sand-200 px-3 py-2.5 text-sm outline-none focus:border-forest-700"
        >
          <option value="All">All phases</option>
          {phases.map((entry) => (
            <option key={entry.number} value={entry.number}>
              Phase {entry.number}: {entry.name}
            </option>
          ))}
        </select>

        <select
          value={assignee}
          onChange={(event) =>
            setAssignee(event.target.value as Assignee | "All")
          }
          className="rounded-xl border border-sand-200 px-3 py-2.5 text-sm outline-none focus:border-forest-700 lg:col-span-2"
        >
          <option value="All">All assignees</option>
          {ASSIGNEES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <p className="text-sm text-forest-800/60 lg:col-span-2 lg:self-center">
          Showing {filteredItems.length} of {items.length} items
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <TaskRow
              key={item.item_id}
              item={item}
              selected={selectedId === item.item_id}
              onSelect={setSelectedId}
            />
          ))}

          {filteredItems.length === 0 && (
            <div className="rounded-2xl border border-dashed border-sand-200 bg-white/70 p-10 text-center">
              <p className="font-medium text-forest-950">No tasks match your filters.</p>
              <p className="mt-2 text-sm text-forest-800/60">
                Try clearing search or changing the status filter.
              </p>
            </div>
          )}
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <TaskDetailPanel
            item={selectedItem}
            onClose={() => setSelectedId(null)}
          />
        </div>
      </div>
    </div>
  );
}
