export type TaskStatus = "backlog" | "todo" | "in_progress" | "done";
export type TaskPriority = "Baixa" | "Média" | "Alta" | "Crítica";

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  startDate: string;
  endDate: string;
  shiftId: string;
  tags: string[];
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleShift {
  id: string;
  collaborator: string;
  role: string;
  start: string;
  end: string;
  location: string;
  status: "Confirmado" | "Cobertura" | "Aguardando";
  linkedTaskIds?: string[];
}

export interface DailyReportSummary {
  date: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  tasksDueToday: number;
  scheduledPeople: number;
  highlights: string[];
  blockers: string[];
}

export interface AuthSession {
  uid: string;
  email: string;
  displayName: string;
  mode: "demo" | "firebase";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TaskDraft {
  title: string;
  description: string;
  assignee: string;
  priority: TaskPriority;
  startDate: string;
  endDate: string;
  shiftId: string;
  tags: string[];
}

export interface BoardStats {
  totalTasks: number;
  completed: number;
  inProgress: number;
  overdue: number;
  scheduledPeople: number;
  upcomingShifts: number;
}
