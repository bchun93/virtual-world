import { NavLink, Outlet } from "react-router-dom";
import { useTaskStore } from "../hooks/useTaskStore";
import {
  buildPhaseSummaries,
  isComplete,
  percentComplete,
} from "../utils/tasks";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/phases", label: "Phases" },
  { to: "/tasks", label: "All Tasks" },
];

export default function Layout() {
  const { items, overrides } = useTaskStore();
  const completed = items.filter((item) => isComplete(item, overrides)).length;
  const progress = percentComplete(completed, items.length);
  const currentPhase =
    buildPhaseSummaries(items, overrides).find(
      (phase) => phase.completed < phase.total,
    ) ?? buildPhaseSummaries(items, overrides).at(-1);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="bg-forest-900 text-white lg:sticky lg:top-0 lg:h-screen">
        <div className="border-b border-white/10 px-6 py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper-500">
            Project Hub
          </p>
          <h1 className="font-display mt-2 text-2xl font-semibold leading-tight">
            STR Business
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Ownership · Remote ops · Multi-property
          </p>
        </div>

        <nav className="px-4 py-6">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      "block rounded-xl px-4 py-3 text-sm font-medium transition",
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/10 px-6 py-6">
          <div className="flex items-end justify-between text-sm">
            <span className="text-white/70">Overall progress</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-copper-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-white/60">
            {completed} of {items.length} items complete
          </p>
          {currentPhase && (
            <p className="mt-4 text-xs leading-relaxed text-white/60">
              Current focus: Phase {currentPhase.number} — {currentPhase.name}
            </p>
          )}
        </div>
      </aside>

      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
