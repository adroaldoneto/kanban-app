import type { KanbanTask } from "@/types";

export function loadTasksFromStorage(storageKey: string): KanbanTask[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as KanbanTask[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTasksToStorage(storageKey: string, tasks: KanbanTask[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(tasks));
}
