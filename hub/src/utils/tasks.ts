import type {
  ActionItem,
  Assignee,
  PhaseSummary,
  TaskOverride,
  TaskStatus,
} from "../types";

export function getPhaseNumber(item: ActionItem): number {
  return Number(item.phase_number);
}

export function getEffectiveStatus(
  item: ActionItem,
  overrides: Record<string, TaskOverride>,
): TaskStatus {
  return overrides[item.item_id]?.status ?? (item.status as TaskStatus);
}

export function isComplete(
  item: ActionItem,
  overrides: Record<string, TaskOverride>,
): boolean {
  const override = overrides[item.item_id];
  if (override) return override.completed;
  return item.completed === "true";
}

export function getAssignee(
  item: ActionItem,
  overrides: Record<string, TaskOverride>,
): Assignee {
  return overrides[item.item_id]?.assignee ?? "Unassigned";
}

export function getNotes(
  item: ActionItem,
  overrides: Record<string, TaskOverride>,
): string {
  return overrides[item.item_id]?.notes ?? item.notes ?? "";
}

export function groupByPhase(items: ActionItem[]) {
  const map = new Map<number, { name: string; items: ActionItem[] }>();

  for (const item of items) {
    const phaseNumber = getPhaseNumber(item);
    const existing = map.get(phaseNumber);
    if (existing) {
      existing.items.push(item);
    } else {
      map.set(phaseNumber, { name: item.phase_name, items: [item] });
    }
  }

  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([number, value]) => ({ number, ...value }));
}

export function buildPhaseSummaries(
  items: ActionItem[],
  overrides: Record<string, TaskOverride>,
): PhaseSummary[] {
  return groupByPhase(items).map(({ number, name, items: phaseItems }) => {
    let completed = 0;
    let inProgress = 0;
    let blocked = 0;

    for (const item of phaseItems) {
      const status = getEffectiveStatus(item, overrides);
      if (isComplete(item, overrides) || status === "Complete") completed += 1;
      else if (status === "In Progress") inProgress += 1;
      else if (status === "Blocked") blocked += 1;
    }

    return {
      number,
      name,
      total: phaseItems.length,
      completed,
      inProgress,
      blocked,
    };
  });
}

export function filterItems(
  items: ActionItem[],
  overrides: Record<string, TaskOverride>,
  query: {
    search?: string;
    status?: TaskStatus | "All";
    phase?: number | "All";
    assignee?: Assignee | "All";
  },
) {
  const search = query.search?.trim().toLowerCase() ?? "";

  return items.filter((item) => {
    const status = getEffectiveStatus(item, overrides);
    const assignee = getAssignee(item, overrides);
    const phaseNumber = getPhaseNumber(item);

    if (query.status && query.status !== "All" && status !== query.status) {
      return false;
    }

    if (query.phase && query.phase !== "All" && phaseNumber !== query.phase) {
      return false;
    }

    if (
      query.assignee &&
      query.assignee !== "All" &&
      assignee !== query.assignee
    ) {
      return false;
    }

    if (!search) return true;

    return (
      item.action_item.toLowerCase().includes(search) ||
      item.item_id.toLowerCase().includes(search) ||
      item.phase_name.toLowerCase().includes(search) ||
      getNotes(item, overrides).toLowerCase().includes(search)
    );
  });
}

export function percentComplete(completed: number, total: number) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
