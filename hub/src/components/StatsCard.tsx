import type { ReactNode } from "react";

interface StatsCardProps {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "default" | "success" | "warning" | "danger";
}

const accentStyles = {
  default: "border-sand-200 bg-white",
  success: "border-emerald-200 bg-emerald-50",
  warning: "border-amber-200 bg-amber-50",
  danger: "border-red-200 bg-red-50",
};

export default function StatsCard({
  label,
  value,
  hint,
  accent = "default",
}: StatsCardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${accentStyles[accent]}`}
    >
      <p className="text-sm text-forest-800/70">{label}</p>
      <p className="font-display mt-2 text-3xl font-semibold text-forest-950">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-forest-800/60">{hint}</p>}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-display text-3xl font-semibold text-forest-950">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-forest-800/70">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
