"use client";

import clsx from "clsx";
import { addDays, format, parseISO } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  formatTaskDateRange,
  getShiftName,
  isTaskOverdue,
  priorityClassMap,
  sortTasksByTimeline,
  statusLabels,
  statusToneMap,
} from "@/lib/helpers";
import type { KanbanTask, ScheduleShift, TaskDraft, TaskPriority, TaskStatus } from "@/types";

interface KanbanBoardProps {
  tasks: KanbanTask[];
  shifts: ScheduleShift[];
  onAddTask: (draft: TaskDraft) => Promise<void>;
  onMoveTask: (taskId: string, status: TaskStatus) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

const columns: TaskStatus[] = ["backlog", "todo", "in_progress", "done"];

function buildInitialDraft(): TaskDraft {
  return {
    title: "",
    description: "",
    assignee: "",
    priority: "Média",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    shiftId: "",
    tags: [],
  };
}

function castPriority(value: string): TaskPriority {
  if (value === "Baixa" || value === "Média" || value === "Alta" || value === "Crítica") {
    return value;
  }

  return "Média";
}

export function KanbanBoard({ tasks, shifts, onAddTask, onMoveTask, onDeleteTask }: KanbanBoardProps) {
  const [draft, setDraft] = useState<TaskDraft>(buildInitialDraft());
  const [tagInput, setTagInput] = useState("");
  const [search, setSearch] = useState("");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeDropStatus, setActiveDropStatus] = useState<TaskStatus | null>(null);

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const normalizedSearch = search.toLowerCase();
        const matchesSearch =
          task.title.toLowerCase().includes(normalizedSearch) ||
          task.description.toLowerCase().includes(normalizedSearch) ||
          task.assignee.toLowerCase().includes(normalizedSearch);
        const matchesShift = shiftFilter === "all" ? true : task.shiftId === shiftFilter;

        return matchesSearch && matchesShift;
      })
      .sort(sortTasksByTimeline);
  }, [search, shiftFilter, tasks]);

  const groupedTasks = useMemo(() => {
    return columns.reduce<Record<TaskStatus, KanbanTask[]>>(
      (accumulator, column) => {
        accumulator[column] = visibleTasks.filter((task) => task.status === column);
        return accumulator;
      },
      {
        backlog: [],
        todo: [],
        in_progress: [],
        done: [],
      },
    );
  }, [visibleTasks]);

  const handleChange = (field: keyof TaskDraft, value: string) => {
    setDraft((current) => ({
      ...current,
      [field]: field === "priority" ? castPriority(value) : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim()) {
      return;
    }

    await onAddTask({
      ...draft,
      tags: tagInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });

    setDraft(buildInitialDraft());
    setTagInput("");
  };

  return (
    <section className="card section-stack">
      <div className="section-header">
        <div>
          <span className="eyebrow">Kanban online</span>
          <h2 className="section-title">Quadro operacional conectado à escala</h2>
          <p className="section-description">
            Crie cartões, vincule ao turno correspondente e arraste entre colunas para refletir o progresso
            da operação em tempo real.
          </p>
        </div>
      </div>

      <div className="kanban-layout">
        <form className="subcard form-stack" onSubmit={(event) => void handleSubmit(event)}>
          <div className="between wrap gap-sm">
            <h3 className="subcard-title">Novo cartão</h3>
            <span className="pill pill-primary">+ produtividade</span>
          </div>

          <label className="field">
            <span>Título</span>
            <input
              className="input"
              value={draft.title}
              onChange={(event) => handleChange("title", event.target.value)}
              placeholder="Ex.: Aprovar cobertura de plantão"
            />
          </label>

          <label className="field">
            <span>Descrição</span>
            <textarea
              className="textarea"
              rows={4}
              value={draft.description}
              onChange={(event) => handleChange("description", event.target.value)}
              placeholder="Detalhe o fluxo, SLA e observações do turno"
            />
          </label>

          <div className="form-grid">
            <label className="field">
              <span>Responsável</span>
              <input
                className="input"
                value={draft.assignee}
                onChange={(event) => handleChange("assignee", event.target.value)}
                placeholder="Nome do colaborador"
              />
            </label>
            <label className="field">
              <span>Prioridade</span>
              <select
                className="select"
                value={draft.priority}
                onChange={(event) => handleChange("priority", event.target.value)}
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </label>
            <label className="field">
              <span>Início</span>
              <input
                className="input"
                type="date"
                value={draft.startDate}
                onChange={(event) => handleChange("startDate", event.target.value)}
              />
            </label>
            <label className="field">
              <span>Fim</span>
              <input
                className="input"
                type="date"
                value={draft.endDate}
                onChange={(event) => handleChange("endDate", event.target.value)}
              />
            </label>
            <label className="field field-span-2">
              <span>Turno relacionado</span>
              <select className="select" value={draft.shiftId} onChange={(event) => handleChange("shiftId", event.target.value)}>
                <option value="">Sem vínculo</option>
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.collaborator} · {shift.location}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>Tags</span>
            <input
              className="input"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              placeholder="escala, cobertura, pdf"
            />
          </label>

          <button className="button full-width" type="submit">
            <Plus size={16} />
            Criar cartão
          </button>
        </form>

        <div className="board-area">
          <div className="filters-row">
            <input
              className="input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por título, descrição ou responsável"
            />
            <select className="select filter-select" value={shiftFilter} onChange={(event) => setShiftFilter(event.target.value)}>
              <option value="all">Todos os turnos</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.collaborator}
                </option>
              ))}
            </select>
          </div>

          <div className="board-grid">
            {columns.map((column) => (
              <section
                key={column}
                className={clsx("column", activeDropStatus === column && "column-active")}
                onDragOver={(event) => {
                  event.preventDefault();
                  setActiveDropStatus(column);
                }}
                onDragLeave={() => setActiveDropStatus((current) => (current === column ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  const taskId = draggedTaskId ?? event.dataTransfer.getData("text/plain");
                  if (taskId) {
                    void onMoveTask(taskId, column);
                  }
                  setDraggedTaskId(null);
                  setActiveDropStatus(null);
                }}
              >
                <div className="column-header">
                  <div>
                    <h3>{statusLabels[column]}</h3>
                    <p className="muted small">{groupedTasks[column].length} cartões</p>
                  </div>
                  <span className={`pill pill-${statusToneMap[column]}`}>{statusLabels[column]}</span>
                </div>

                <div className="column-cards">
                  {groupedTasks[column].length === 0 ? (
                    <div className="empty-state">Arraste um cartão para esta coluna.</div>
                  ) : (
                    groupedTasks[column].map((task) => (
                      <article
                        key={task.id}
                        className={clsx("task-card", isTaskOverdue(task) && "task-card-warning")}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", task.id);
                          setDraggedTaskId(task.id);
                        }}
                        onDragEnd={() => setDraggedTaskId(null)}
                      >
                        <div className="between wrap gap-sm">
                          <div>
                            <h4 className="task-title">{task.title}</h4>
                            <p className="muted small">{task.assignee}</p>
                          </div>
                          <span className={clsx("tag", priorityClassMap[task.priority])}>{task.priority}</span>
                        </div>

                        <p className="task-description">{task.description}</p>

                        <div className="task-meta">
                          <span>{formatTaskDateRange(task.startDate, task.endDate)}</span>
                          <span>{getShiftName(task.shiftId, shifts)}</span>
                        </div>

                        <div className="progress-row">
                          <div className="progress-bar">
                            <span style={{ width: `${task.progress}%` }} />
                          </div>
                          <strong>{task.progress}%</strong>
                        </div>

                        <div className="task-tags">
                          {task.tags.map((tag) => (
                            <span key={tag} className="tag tag-outline">
                              {tag}
                            </span>
                          ))}
                          {isTaskOverdue(task) ? <span className="tag tag-danger">Atrasada</span> : null}
                        </div>

                        <div className="between wrap gap-sm">
                          <span className="muted small">Atualizada {format(parseISO(task.updatedAt), "dd/MM HH:mm")}</span>
                          <button className="button button-ghost danger-inline" type="button" onClick={() => void onDeleteTask(task.id)}>
                            <Trash2 size={14} />
                            Excluir
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
