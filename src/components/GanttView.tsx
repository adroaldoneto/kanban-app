import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useBoard } from '../contexts/BoardContext'

function safeDate(value: string) {
  return parseISO(value || new Date().toISOString().slice(0, 10))
}

export function GanttView() {
  const { tasks } = useBoard()

  if (!tasks.length) {
    return (
      <section className="panel">
        <h3>Gráfico Gantt Geral</h3>
        <p>Sem tarefas no momento. Crie tarefas no Kanban para visualizar a linha do tempo.</p>
      </section>
    )
  }

  const sorted = [...tasks].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const minDate = safeDate(sorted[0].startDate)
  const maxDate = sorted.reduce((max, task) => {
    const due = safeDate(task.dueDate)
    return due > max ? due : max
  }, minDate)

  const totalDays = Math.max(1, differenceInCalendarDays(maxDate, minDate) + 1)

  return (
    <section className="panel">
      <h3>Gráfico Gantt Geral</h3>
      <p>
        Visão de cronograma para todas as tarefas integradas ao quadro. Período:{" "}
        {format(minDate, 'dd/MM/yyyy', { locale: ptBR })} até{" "}
        {format(maxDate, 'dd/MM/yyyy', { locale: ptBR })}
      </p>
      <div className="gantt-list">
        {sorted.map((task) => {
          const start = safeDate(task.startDate)
          const end = safeDate(task.dueDate)
          const offset = differenceInCalendarDays(start, minDate)
          const duration = Math.max(1, differenceInCalendarDays(end, start) + 1)

          return (
            <div className="gantt-row" key={task.id}>
              <div className="gantt-label">
                <strong>{task.title}</strong>
                <small>
                  {task.assignee || 'Sem responsável'} • {task.status}
                </small>
              </div>
              <div className="gantt-track">
                <span
                  className="gantt-bar"
                  style={{
                    left: `${(offset / totalDays) * 100}%`,
                    width: `${(duration / totalDays) * 100}%`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
