export const TASK_STATUSES = ["todo", "doing", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type Board = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type KanbanTask = {
  id: string;
  boardId: string;
  ownerId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  dueDate?: string;
  shiftId?: string;
  shiftLabel?: string;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleShift = {
  id: string;
  ownerId: string;
  title: string;
  startAt: string;
  endAt: string;
  member?: string;
  source: "external" | "manual";
  updatedAt: string;
};

export type GanttItem = {
  taskId: string;
  title: string;
  status: TaskStatus;
  startAt: string;
  endAt: string;
  progress: number;
};

export type DailySummary = {
  date: string;
  totals: {
    all: number;
    todo: number;
    doing: number;
    done: number;
  };
  tasks: KanbanTask[];
};
