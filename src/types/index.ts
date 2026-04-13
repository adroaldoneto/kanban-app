export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type CardStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'

export interface KanbanCard {
  id: string
  title: string
  description: string
  status: CardStatus
  priority: Priority
  assignee: string
  assigneeEmail: string
  createdAt: string
  updatedAt: string
  dueDate: string
  startDate: string
  tags: string[]
  order: number
  projectId: string
}

export interface KanbanColumn {
  id: CardStatus
  title: string
  color: string
  cards: KanbanCard[]
}

export interface Project {
  id: string
  name: string
  description: string
  createdAt: string
  ownerId: string
  members: string[]
  color: string
}

export interface ScheduleEntry {
  id: string
  userId: string
  userName: string
  date: string
  shift: 'morning' | 'afternoon' | 'night' | 'day_off'
  projectId: string
  notes: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  avatar: string
}

export interface DailyReport {
  date: string
  totalTasks: number
  completed: number
  inProgress: number
  blocked: number
  newTasks: number
  teamProductivity: number
  highlights: string[]
}

export interface GanttTask {
  id: string
  name: string
  start: Date
  end: Date
  progress: number
  assignee: string
  color: string
  dependencies: string[]
}
