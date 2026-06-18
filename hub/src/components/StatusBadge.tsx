import type { TaskStatus } from "../types";
import { STATUS_COLORS } from "../types";

export default function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {status}
    </span>
  );
}
