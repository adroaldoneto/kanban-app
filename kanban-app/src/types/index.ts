export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type UserRole = 'admin' | 'manager' | 'member';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  team?: string;
  createdAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: string;
  assigneeName?: string;
  labels: Label[];
  checklist: ChecklistItem[];
  comments: Comment[];
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  projectId: string;
  columnId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  status: TaskStatus;
  color: string;
  order: number;
  projectId: string;
  taskLimit?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  ownerId: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
}

export interface ScheduleShift {
  id: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  projectId?: string;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'absent';
}

export interface DailyReport {
  id: string;
  projectId: string;
  date: string;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  totalHours: number;
  teamMembers: number;
  highlights: string[];
  blockers: string[];
  generatedBy: string;
  generatedAt: string;
}

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}
