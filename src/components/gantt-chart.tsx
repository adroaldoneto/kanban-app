import clsx from "clsx";
import { eachDayOfInterval, format, isToday } from "date-fns";

import { getGanttBounds, getShiftName, getTaskSpan, statusLabels, statusToneMap } from "@/lib/helpers";
import type { KanbanTask, ScheduleShift } from "@/types";

interface GanttChartProps {
  tasks: KanbanTask[];
  shifts: ScheduleShift[];
}

export function GanttChart({ tasks, shifts }: GanttChartProps) {
  const ganttTasks = [...tasks].filter((task) => task.startDate && task.endDate);
  const bounds = getGanttBounds(ganttTasks);
  const days = eachDayOfInterval({ start: bounds.start, end: bounds.end });
  const templateColumns = `repeat(${days.length}, minmax(84px, 1fr))`;

  return (
    <section className="card section-stack">
      <div className="section-header">
        <div>
          <span className="eyebrow">Relatório geral em Gantt</span>
          <h2 className="section-title">Linha do tempo das entregas e dos turnos</h2>
          <p className="section-description">
            Cada cartão com data entra automaticamente no gráfico, permitindo enxergar dependências, prazo e impacto
            sobre a escala.
          </p>
        </div>
        <div className="button-row compact">
          <span className="pill pill-primary">{ganttTasks.length} itens planejados</span>
        </div>
      </div>

      {ganttTasks.length === 0 ? (
        <div className="empty-state">Crie cartões com datas para gerar o Gantt geral.</div>
      ) : (
        <div className="gantt-shell">
          <div className="gantt-table">
            <div />
            <div className="gantt-grid-header" style={{ gridTemplateColumns: templateColumns }}>
              {days.map((day, index) => (
                <div key={index} className={clsx("gantt-day", isToday(day) && "gantt-day-today")}>
                  <span>{format(day, "dd/MM")}</span>
                  <small>{format(day, "EEE")}</small>
                </div>
              ))}
            </div>

            {ganttTasks.map((task) => {
              const span = getTaskSpan(task, bounds.start);

              return (
                <div className="gantt-row" key={task.id}>
                  <div className="gantt-row-label">
                    <strong>{task.title}</strong>
                    <span>{task.assignee}</span>
                    <small>{getShiftName(task.shiftId, shifts)}</small>
                  </div>
                  <div className="gantt-track" style={{ gridTemplateColumns: templateColumns }}>
                    {days.map((day, index) => (
                      <div
                        key={`${task.id}-${index}`}
                        className={clsx("gantt-cell", isToday(day) && "gantt-cell-today")}
                        style={{ gridColumn: index + 1, gridRow: 1 }}
                      />
                    ))}
                    <div
                      className={clsx("gantt-bar", `gantt-bar-${statusToneMap[task.status]}`)}
                      style={{
                        gridColumn: `${span.offset + 1} / span ${span.duration}`,
                        gridRow: 1,
                      }}
                    >
                      <span className="gantt-bar-title">{task.title}</span>
                      <strong>
                        {task.progress}% · {statusLabels[task.status]}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
