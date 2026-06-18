interface ProgressBarProps {
  value: number;
  className?: string;
}

export default function ProgressBar({ value, className = "" }: ProgressBarProps) {
  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-sand-200 ${className}`}
    >
      <div
        className="h-full rounded-full bg-forest-700 transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
