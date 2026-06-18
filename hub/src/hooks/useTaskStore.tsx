import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import rawItems from "../data/action-items.json";
import type {
  ActionItem,
  Assignee,
  TaskOverride,
  TaskOverrides,
  TaskStatus,
} from "../types";

const STORAGE_KEY = "str-business-hub-overrides-v1";

interface TaskContextValue {
  items: ActionItem[];
  overrides: TaskOverrides;
  updateTask: (
    itemId: string,
    patch: Partial<Omit<TaskOverride, "updatedAt">>,
  ) => void;
  toggleComplete: (itemId: string) => void;
  resetAll: () => void;
}

const TaskContext = createContext<TaskContextValue | null>(null);

function loadOverrides(): TaskOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as TaskOverrides;
  } catch {
    return {};
  }
}

function saveOverrides(overrides: TaskOverrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const items = rawItems as ActionItem[];
  const [overrides, setOverrides] = useState<TaskOverrides>(() => loadOverrides());

  const persist = useCallback((next: TaskOverrides) => {
    setOverrides(next);
    saveOverrides(next);
  }, []);

  const updateTask = useCallback(
    (itemId: string, patch: Partial<Omit<TaskOverride, "updatedAt">>) => {
      persist({
        ...overrides,
        [itemId]: {
          status: patch.status ?? overrides[itemId]?.status ?? "Not Started",
          completed: patch.completed ?? overrides[itemId]?.completed ?? false,
          notes: patch.notes ?? overrides[itemId]?.notes ?? "",
          assignee: patch.assignee ?? overrides[itemId]?.assignee ?? "Unassigned",
          updatedAt: new Date().toISOString(),
        },
      });
    },
    [overrides, persist],
  );

  const toggleComplete = useCallback(
    (itemId: string) => {
      const current = overrides[itemId];
      const nextCompleted = !(current?.completed ?? false);
      updateTask(itemId, {
        completed: nextCompleted,
        status: nextCompleted ? "Complete" : "Not Started",
      });
    },
    [overrides, updateTask],
  );

  const resetAll = useCallback(() => {
    if (
      window.confirm(
        "Reset all progress, notes, and assignments? This cannot be undone.",
      )
    ) {
      persist({});
    }
  }, [persist]);

  const value = useMemo(
    () => ({ items, overrides, updateTask, toggleComplete, resetAll }),
    [items, overrides, updateTask, toggleComplete, resetAll],
  );

  return (
    <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
  );
}

export function useTaskStore() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskStore must be used within TaskProvider");
  }
  return context;
}

export function useTaskActions() {
  const { updateTask, toggleComplete } = useTaskStore();

  const setStatus = (itemId: string, status: TaskStatus) => {
    updateTask(itemId, {
      status,
      completed: status === "Complete",
    });
  };

  const setNotes = (itemId: string, notes: string) => {
    updateTask(itemId, { notes });
  };

  const setAssignee = (itemId: string, assignee: Assignee) => {
    updateTask(itemId, { assignee });
  };

  return { setStatus, setNotes, setAssignee, toggleComplete };
}
