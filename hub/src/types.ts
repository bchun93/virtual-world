export type TaskStatus = "Not Started" | "In Progress" | "Complete" | "Blocked";
export type Assignee = "Unassigned" | "Partner A" | "Partner B" | "Both";

export interface ActionItem {
  item_id: string;
  phase_number: string;
  phase_name: string;
  action_item: string;
  parent_item_id: string;
  status: TaskStatus;
  completed: string;
  notes: string;
}

export interface TaskOverride {
  status: TaskStatus;
  completed: boolean;
  notes: string;
  assignee: Assignee;
  updatedAt: string;
}

export interface PhaseSummary {
  number: number;
  name: string;
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
}

export type TaskOverrides = Record<string, TaskOverride>;

export const TASK_STATUSES: TaskStatus[] = [
  "Not Started",
  "In Progress",
  "Complete",
  "Blocked",
];

export const ASSIGNEES: Assignee[] = [
  "Unassigned",
  "Partner A",
  "Partner B",
  "Both",
];

export const STATUS_COLORS: Record<TaskStatus, string> = {
  "Not Started": "bg-sand-200 text-forest-800",
  "In Progress": "bg-amber-100 text-amber-900",
  Complete: "bg-emerald-100 text-emerald-900",
  Blocked: "bg-red-100 text-red-900",
};
