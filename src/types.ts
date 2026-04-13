export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'

export interface KanbanTask {
  id: string
  title: string
  description: string
  status: TaskStatus
  startDate: string
  dueDate: string
  assignee: string
  priority: 'baixa' | 'media' | 'alta'
  shiftId?: string
  source?: 'kanban' | 'escala'
  createdAt: string
  updatedAt: string
}

export interface TaskInput {
  title: string
  description: string
  status: TaskStatus
  startDate: string
  dueDate: string
  assignee: string
  priority: KanbanTask['priority']
  shiftId?: string
  source?: KanbanTask['source']
}

export interface ShiftItem {
  id: string
  title: string
  collaborator: string
  startDate: string
  endDate: string
  status: 'planned' | 'running' | 'done'
}

export interface DailyReportSummary {
  date: string
  total: number
  done: number
  delayed: number
  inProgress: number
}
