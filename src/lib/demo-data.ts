import { addDays, addHours, format, startOfDay } from "date-fns";

import type { AuthSession, KanbanTask, ScheduleShift } from "@/types";

const today = startOfDay(new Date());
const dateOnly = (date: Date) => format(date, "yyyy-MM-dd");
const stamp = (date: Date) => date.toISOString();

export const demoUser: AuthSession = {
  uid: "demo-user",
  email: "demo@kanban.local",
  displayName: "Modo demonstração",
  mode: "demo",
};

export const demoSchedule: ScheduleShift[] = [
  {
    id: "shift-ana",
    collaborator: "Ana Souza",
    role: "Enfermeira líder",
    start: stamp(addHours(today, 7)),
    end: stamp(addHours(today, 19)),
    location: "Bloco A",
    status: "Confirmado",
    linkedTaskIds: ["task-publicar-escala", "task-relatorio-diario"],
  },
  {
    id: "shift-bruno",
    collaborator: "Bruno Lima",
    role: "Técnico de enfermagem",
    start: stamp(addHours(today, 19)),
    end: stamp(addHours(addDays(today, 1), 7)),
    location: "UTI 1",
    status: "Cobertura",
    linkedTaskIds: ["task-cobertura-emergencia"],
  },
  {
    id: "shift-carla",
    collaborator: "Carla Nascimento",
    role: "Coordenadora de escala",
    start: stamp(addHours(addDays(today, 1), 8)),
    end: stamp(addHours(addDays(today, 1), 18)),
    location: "Central de Operações",
    status: "Confirmado",
    linkedTaskIds: ["task-integrar-atestados", "task-treinamento"],
  },
  {
    id: "shift-daniel",
    collaborator: "Daniel Rocha",
    role: "Analista de RH",
    start: stamp(addHours(addDays(today, 2), 9)),
    end: stamp(addHours(addDays(today, 2), 17)),
    location: "Backoffice",
    status: "Aguardando",
    linkedTaskIds: ["task-fechar-folgas"],
  },
];

export const demoTasks: KanbanTask[] = [
  {
    id: "task-publicar-escala",
    title: "Publicar escala semanal no portal",
    description:
      "Conferir alocação, plantões extras e liberar a grade da próxima semana para os gestores.",
    status: "todo",
    priority: "Alta",
    assignee: "Ana Souza",
    startDate: dateOnly(today),
    endDate: dateOnly(addDays(today, 2)),
    shiftId: "shift-ana",
    tags: ["escala", "publicação"],
    progress: 35,
    createdAt: stamp(addHours(today, -4)),
    updatedAt: stamp(addHours(today, -1)),
  },
  {
    id: "task-cobertura-emergencia",
    title: "Aprovar cobertura de emergência",
    description:
      "Fechar a substituição do plantão noturno e validar o custo adicional com a coordenação.",
    status: "in_progress",
    priority: "Crítica",
    assignee: "Bruno Lima",
    startDate: dateOnly(today),
    endDate: dateOnly(addDays(today, 1)),
    shiftId: "shift-bruno",
    tags: ["cobertura", "urgente"],
    progress: 62,
    createdAt: stamp(addHours(today, -6)),
    updatedAt: stamp(addHours(today, -1)),
  },
  {
    id: "task-relatorio-diario",
    title: "Emitir relatório diário para diretoria",
    description:
      "Consolidar indicadores de ocupação, cobertura e pendências operacionais até o fim do turno.",
    status: "backlog",
    priority: "Média",
    assignee: "Ana Souza",
    startDate: dateOnly(today),
    endDate: dateOnly(today),
    shiftId: "shift-ana",
    tags: ["relatório", "diretoria"],
    progress: 15,
    createdAt: stamp(addHours(today, -8)),
    updatedAt: stamp(addHours(today, -3)),
  },
  {
    id: "task-integrar-atestados",
    title: "Integrar atestados ao fluxo do Kanban",
    description:
      "Criar a etapa que alimenta o quadro com afastamentos confirmados para redistribuição rápida da escala.",
    status: "todo",
    priority: "Alta",
    assignee: "Carla Nascimento",
    startDate: dateOnly(addDays(today, 1)),
    endDate: dateOnly(addDays(today, 4)),
    shiftId: "shift-carla",
    tags: ["integração", "rh"],
    progress: 28,
    createdAt: stamp(addHours(today, -2)),
    updatedAt: stamp(addHours(today, -2)),
  },
  {
    id: "task-treinamento",
    title: "Treinar liderança no novo fluxo operacional",
    description:
      "Apresentar o quadro online, filtros por turno, exportação de relatórios e política de acompanhamento diário.",
    status: "done",
    priority: "Média",
    assignee: "Carla Nascimento",
    startDate: dateOnly(addDays(today, -2)),
    endDate: dateOnly(addDays(today, -1)),
    shiftId: "shift-carla",
    tags: ["adoção", "treinamento"],
    progress: 100,
    createdAt: stamp(addHours(addDays(today, -2), 8)),
    updatedAt: stamp(addHours(addDays(today, -1), 15)),
  },
  {
    id: "task-fechar-folgas",
    title: "Fechar banco de folgas compensatórias",
    description:
      "Conferir saldo, identificar conflitos e priorizar ajustes antes do fechamento do mês.",
    status: "backlog",
    priority: "Baixa",
    assignee: "Daniel Rocha",
    startDate: dateOnly(addDays(today, 2)),
    endDate: dateOnly(addDays(today, 5)),
    shiftId: "shift-daniel",
    tags: ["folgas", "financeiro"],
    progress: 12,
    createdAt: stamp(addHours(today, -7)),
    updatedAt: stamp(addHours(today, -5)),
  },
];

export const integrationChecklist = [
  "Substitua o adaptador de escala pelo endpoint real do sistema já existente.",
  "Reaproveite o mesmo projeto Firebase/Auth do sistema principal para SSO e Firestore.",
  "Mapeie cada plantão para shiftId nos cartões, permitindo visão operacional e Gantt na mesma linha do tempo.",
  "Configure SMTP ou provedor transacional para disparar os relatórios diários por e-mail com anexo de imagem.",
];
