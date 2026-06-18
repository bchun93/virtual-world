import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import TaskDetailPanel from "../components/TaskDetailPanel";
import TaskRow from "../components/TaskRow";
import { SectionHeader } from "../components/StatsCard";
import { useTaskStore } from "../hooks/useTaskStore";
import { buildPhaseSummaries, groupByPhase, percentComplete } from "../utils/tasks";

export default function PhaseDetailPage() {
  const { phaseId } = useParams();
  const phaseNumber = Number(phaseId);
  const { items, overrides } = useTaskStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const phase = useMemo(
    () => groupByPhase(items).find((entry) => entry.number === phaseNumber),
    [items, phaseNumber],
  );

  const summary = useMemo(
    () => buildPhaseSummaries(items, overrides).find((entry) => entry.number === phaseNumber),
    [items, overrides, phaseNumber],
  );

  const selectedItem =
    phase?.items.find((item) => item.item_id === selectedId) ?? null;

  if (!phase || !summary) {
    return (
      <div className="px-6 py-10 lg:px-10">
        <p className="text-sm text-forest-800/70">Phase not found.</p>
        <Link to="/phases" className="mt-4 inline-block text-sm font-medium text-copper-600">
          Back to phases
        </Link>
      </div>
    );
  }

  const topLevelItems = phase.items.filter((item) => !item.parent_item_id);
  const subtasksByParent = phase.items.reduce<Record<string, typeof phase.items>>(
    (acc, item) => {
      if (!item.parent_item_id) return acc;
      acc[item.parent_item_id] ??= [];
      acc[item.parent_item_id].push(item);
      return acc;
    },
    {},
  );

  return (
    <div className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mb-6">
        <Link
          to="/phases"
          className="text-sm font-medium text-copper-600 hover:text-copper-500"
        >
          ← All phases
        </Link>
      </div>

      <SectionHeader
        title={`Phase ${phase.number}: ${phase.name}`}
        description={`${summary.completed} of ${summary.total} items complete in this phase.`}
      />

      <div className="mb-8 max-w-3xl">
        <ProgressBar value={percentComplete(summary.completed, summary.total)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {topLevelItems.map((item) => (
            <div key={item.item_id} className="space-y-3">
              <TaskRow
                item={item}
                selected={selectedId === item.item_id}
                onSelect={setSelectedId}
              />
              {(subtasksByParent[item.item_id] ?? []).map((subtask) => (
                <div key={subtask.item_id} className="ml-6">
                  <TaskRow
                    item={subtask}
                    selected={selectedId === subtask.item_id}
                    onSelect={setSelectedId}
                    compact
                  />
                </div>
              ))}
            </div>
          ))}
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
