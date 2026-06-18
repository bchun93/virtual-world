import { Link } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import StatsCard, { SectionHeader } from "../components/StatsCard";
import { useTaskStore } from "../hooks/useTaskStore";
import {
  buildPhaseSummaries,
  getEffectiveStatus,
  isComplete,
  percentComplete,
} from "../utils/tasks";

export default function DashboardPage() {
  const { items, overrides } = useTaskStore();
  const phases = buildPhaseSummaries(items, overrides);
  const completed = items.filter((item) => isComplete(item, overrides)).length;
  const inProgress = items.filter(
    (item) => getEffectiveStatus(item, overrides) === "In Progress",
  ).length;
  const blocked = items.filter(
    (item) => getEffectiveStatus(item, overrides) === "Blocked",
  ).length;
  const nextPhase = phases.find((phase) => phase.completed < phase.total);

  return (
    <div className="px-6 py-8 lg:px-10 lg:py-10">
      <SectionHeader
        title="Dashboard"
        description="Track progress from strategy through scaling. Start with Phase 0 before moving into execution."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Total action items"
          value={items.length}
          hint="Consolidated checklist across both source lists"
        />
        <StatsCard
          label="Completed"
          value={completed}
          hint={`${percentComplete(completed, items.length)}% overall`}
          accent="success"
        />
        <StatsCard
          label="In progress"
          value={inProgress}
          accent="warning"
        />
        <StatsCard
          label="Blocked"
          value={blocked}
          accent={blocked > 0 ? "danger" : "default"}
        />
      </div>

      {nextPhase && (
        <div className="mt-8 rounded-2xl border border-forest-100 bg-forest-100/40 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-800/60">
            Recommended focus
          </p>
          <h3 className="font-display mt-2 text-2xl font-semibold text-forest-950">
            Phase {nextPhase.number}: {nextPhase.name}
          </h3>
          <p className="mt-2 text-sm text-forest-800/70">
            {nextPhase.completed} of {nextPhase.total} items complete in this phase.
          </p>
          <div className="mt-4">
            <ProgressBar
              value={percentComplete(nextPhase.completed, nextPhase.total)}
            />
          </div>
          <Link
            to={`/phases/${nextPhase.number}`}
            className="mt-5 inline-flex rounded-xl bg-forest-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-800"
          >
            Open phase
          </Link>
        </div>
      )}

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-forest-950">
            Phase overview
          </h3>
          <Link
            to="/phases"
            className="text-sm font-medium text-copper-600 hover:text-copper-500"
          >
            View all phases
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {phases.map((phase) => (
            <Link
              key={phase.number}
              to={`/phases/${phase.number}`}
              className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm transition hover:border-forest-700/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-forest-800/50">
                    Phase {phase.number}
                  </p>
                  <h4 className="mt-1 font-medium text-forest-950">{phase.name}</h4>
                </div>
                <span className="text-sm font-semibold text-forest-800">
                  {percentComplete(phase.completed, phase.total)}%
                </span>
              </div>
              <ProgressBar
                className="mt-4"
                value={percentComplete(phase.completed, phase.total)}
              />
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-forest-800/60">
                <span>{phase.completed} complete</span>
                <span>{phase.inProgress} in progress</span>
                <span>{phase.blocked} blocked</span>
                <span>{phase.total} total</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
