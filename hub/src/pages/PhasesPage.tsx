import { Link } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import { SectionHeader } from "../components/StatsCard";
import { useTaskStore } from "../hooks/useTaskStore";
import { buildPhaseSummaries, percentComplete } from "../utils/tasks";

export default function PhasesPage() {
  const { items, overrides } = useTaskStore();
  const phases = buildPhaseSummaries(items, overrides);

  return (
    <div className="px-6 py-8 lg:px-10 lg:py-10">
      <SectionHeader
        title="Phases"
        description="Work through the business in order. Phase 0 strategic decisions should be settled before acquisition and setup work begins."
      />

      <div className="space-y-4">
        {phases.map((phase) => (
          <Link
            key={phase.number}
            to={`/phases/${phase.number}`}
            className="block rounded-2xl border border-sand-200 bg-white p-6 shadow-sm transition hover:border-forest-700/30 hover:shadow-md"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper-600">
                  Phase {phase.number}
                </p>
                <h3 className="font-display mt-2 text-2xl font-semibold text-forest-950">
                  {phase.name}
                </h3>
                <p className="mt-2 text-sm text-forest-800/60">
                  {phase.total} action items
                </p>
              </div>

              <div className="w-full max-w-sm">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-forest-800/60">Progress</span>
                  <span className="font-semibold text-forest-950">
                    {percentComplete(phase.completed, phase.total)}%
                  </span>
                </div>
                <ProgressBar
                  value={percentComplete(phase.completed, phase.total)}
                />
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-forest-800/60">
                  <span>{phase.completed} complete</span>
                  <span>{phase.inProgress} in progress</span>
                  <span>{phase.blocked} blocked</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
