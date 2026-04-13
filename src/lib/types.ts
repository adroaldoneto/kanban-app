export type ColumnId = string;

export interface ColumnDoc {
  title: string;
  order: number;
}

export interface CardDoc {
  title: string;
  description: string;
  columnId: ColumnId;
  order: number;
  /** ISO date (yyyy-mm-dd) — início planejado */
  startDate: string;
  /** ISO date (yyyy-mm-dd) — fim planejado */
  endDate: string;
  assigneeEmail?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BoardDoc {
  name: string;
  ownerUid: string;
  createdAt: number;
}

export const DEFAULT_COLUMNS: { id: string; title: string; order: number }[] =
  [
    { id: "todo", title: "A fazer", order: 0 },
    { id: "doing", title: "Em andamento", order: 1 },
    { id: "done", title: "Concluído", order: 2 },
  ];
