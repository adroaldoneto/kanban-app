import { useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import { useBoard } from '../contexts/BoardContext'
import type { KanbanTask, TaskStatus } from '../types'
import { TaskForm } from './TaskForm'

const COLUMNS: Array<{ status: TaskStatus; title: string }> = [
  { status: 'backlog', title: 'Backlog' },
  { status: 'todo', title: 'A fazer' },
  { status: 'in_progress', title: 'Em andamento' },
  { status: 'review', title: 'Revisão' },
  { status: 'done', title: 'Concluído' },
]

export function KanbanBoard() {
  const { tasks, createTask, updateTask, moveTask, deleteTask, loading } = useBoard()
  const [editingTask, setEditingTask] = useState<KanbanTask | undefined>()

  const grouped = useMemo(
    () =>
      COLUMNS.map((column) => ({
        ...column,
        items: tasks.filter((task) => task.status === column.status),
      })),
    [tasks],
  )

  const onDropTask = async (event: DragEvent<HTMLElement>, status: TaskStatus) => {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/plain')
    if (!taskId) {
      return
    }
    await moveTask(taskId, status)
  }

  if (loading) {
    return <p>Carregando tarefas...</p>
  }

  return (
    <section>
      <div className="header-inline">
        <div>
          <h3>Quadro Kanban</h3>
          <p>
            Arraste os cards entre colunas. Cada tarefa aceita vínculo com a escala por meio do
            campo shiftId.
          </p>
        </div>
      </div>

      {editingTask && (
        <div className="panel">
          <TaskForm
            editingTask={editingTask}
            initialStatus={editingTask.status}
            onCancel={() => setEditingTask(undefined)}
            onSubmit={async (input) => {
              await updateTask(editingTask.id, input)
              setEditingTask(undefined)
            }}
          />
        </div>
      )}

      <div className="panel">
        <TaskForm initialStatus="todo" onSubmit={createTask} />
      </div>

      <div className="kanban-grid">
        {grouped.map((column) => (
          <article
            key={column.status}
            className="column"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => void onDropTask(event, column.status)}
          >
            <header>
              <h4>{column.title}</h4>
              <span>{column.items.length}</span>
            </header>
            <div className="column-body">
              {column.items.map((task) => (
                <div
                  key={task.id}
                  className={`task-card priority-${task.priority}`}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData('text/plain', task.id)}
                >
                  <p className="task-title">{task.title}</p>
                  <p>{task.description}</p>
                  <small>
                    {task.assignee || 'Sem responsável'} • {task.startDate} até {task.dueDate}
                  </small>
                  {task.shiftId && <small>Escala: {task.shiftId}</small>}
                  <div className="row end">
                    <button className="ghost" onClick={() => setEditingTask(task)}>
                      Editar
                    </button>
                    <button className="danger" onClick={() => void deleteTask(task.id)}>
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
