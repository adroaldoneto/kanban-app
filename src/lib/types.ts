export type TaskStatus = "backlog" | "planned" | "in_progress" | "review" | "done";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
};

export type ShiftWindow = {
  id: string;
  title: string;
  team: string;
  date: string;
  startTime: string;
  endTime: string;
  slots: number;
  status: "scheduled" | "attention" | "confirmed";
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  startDate: string;
  dueDate: string;
  percentComplete: number;
  createdAt: string;
  updatedAt: string;
  labels: string[];
  linkedShiftId?: string;
  scheduleRef?: string;
  blockers?: string[];
};

export type BoardColumn = {
  id: TaskStatus;
  title: string;
  description: string;
};

export type ScheduleOverview = {
  source: "demo" | "api";
  connected: boolean;
  lastSync: string;
  shifts: ShiftWindow[];
  alerts: string[];
  integrationNotes: string[];
};

export type DailyReport = {
  date: string;
  generatedAt: string;
  completedTasks: number;
  inFlightTasks: number;
  overdueTasks: number;
  activeShiftCount: number;
  highlights: string[];
  blockers: string[];
};

export type EmailReportPayload = {
  to: string;
  subject: string;
  html: string;
  attachmentName?: string;
  attachmentDataUrl?: string;
};
