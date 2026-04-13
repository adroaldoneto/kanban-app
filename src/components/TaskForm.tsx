import { FormEvent, useEffect, useState } from 'react'
import { KanbanTask, TaskInput, TaskStatus } from '../types'

interface TaskFormProps {
  initialStatus: TaskStatus
  editingTask?: KanbanTask
  onSubmit: (task: TaskInput) => Promise<void>
  onCancel?: () => void
}

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'A fazer' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'review', label: 'Revisão' },
  { value: 'done', label: 'Concluído' },
]

export function TaskForm({ initialStatus, editingTask, onSubmit, onCancel }: TaskFormProps) {
  const [form, setForm] = useState<TaskInput>({
    title: '',
    description: '',
    assignee: '',
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    priority: 'media',
    status: initialStatus,
    source: 'kanban',
  })

  useEffect(() => {
    if (!editingTask) {
      return
    }
    setForm({
      title: editingTask.title,
      description: editingTask.description,
      assignee: editingTask.assignee,
      startDate: editingTask.startDate,
      dueDate: editingTask.dueDate,
      priority: editingTask.priority,
      status: editingTask.status,
      shiftId: editingTask.shiftId,
      source: editingTask.source,
    })
  }, [editingTask])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await onSubmit(form)
    if (!editingTask) {
      setForm((current) => ({ ...current, title: '', description: '' }))
    }
  }

  return (
    <form className="task-form" onSubmit={(event) => void handleSubmit(event)}>
      <h3>{editingTask ? 'Editar tarefa' : 'Nova tarefa'}</h3>
      <label>
        Título
        <input
          required
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
        />
      </label>
      <label>
        Descrição
        <textarea
          rows={3}
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
        />
      </label>
      <label>
        Responsável
        <input
          value={form.assignee}
          onChange={(event) =>
            setForm((current) => ({ ...current, assignee: event.target.value }))
          }
        />
      </label>
      <div className="row two">
        <label>
          Início
          <input
            type="date"
            value={form.startDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, startDate: event.target.value }))
            }
          />
        </label>
        <label>
          Entrega
          <input
            type="date"
            value={form.dueDate}
            onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
          />
        </label>
      </div>
      <div className="row two">
        <label>
          Status
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({ ...current, status: event.target.value as TaskStatus }))
            }
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Prioridade
          <select
            value={form.priority}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                priority: event.target.value as TaskInput['priority'],
              }))
            }
          >
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </label>
      </div>
      <div className="row end">
        {onCancel && (
          <button type="button" className="ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit">{editingTask ? 'Salvar alterações' : 'Criar tarefa'}</button>
      </div>
    </form>
  )
}
