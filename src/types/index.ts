export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ColumnId = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  columnId: ColumnId;
  priority: Priority;
  assignee: string;
  assigneeEmail: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  startDate: string;
  tags: string[];
  order: number;
  completedAt?: string;
  estimatedHours?: number;
  projectId: string;
}

export interface KanbanColumn {
  id: ColumnId;
  title: string;
  color: string;
  icon: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  members: string[];
  color: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'manager' | 'member';
  createdAt: string;
}

export interface DailyReport {
  date: string;
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  backlogTasks: number;
  reviewTasks: number;
  tasksByAssignee: Record<string, { total: number; completed: number; inProgress: number }>;
  tasksMoved: { taskId: string; taskTitle: string; from: string; to: string; movedAt: string }[];
}

export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  assignee: string;
  priority: Priority;
  dependencies?: string[];
}

export const COLUMNS: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog', color: '#94a3b8', icon: '📋' },
  { id: 'todo', title: 'A Fazer', color: '#3b82f6', icon: '📝' },
  { id: 'in_progress', title: 'Em Progresso', color: '#f59e0b', icon: '⚡' },
  { id: 'review', title: 'Revisão', color: '#8b5cf6', icon: '🔍' },
  { id: 'done', title: 'Concluído', color: '#22c55e', icon: '✅' },
];

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Baixa', color: '#22c55e', bgColor: '#dcfce7' },
  medium: { label: 'Média', color: '#3b82f6', bgColor: '#dbeafe' },
  high: { label: 'Alta', color: '#f59e0b', bgColor: '#fef3c7' },
  urgent: { label: 'Urgente', color: '#ef4444', bgColor: '#fee2e2' },
};

export const PROJECT_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
  '#22c55e', '#06b6d4', '#6366f1', '#84cc16', '#14b8a6',
];
