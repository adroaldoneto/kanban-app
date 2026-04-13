import { Timestamp, FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { ApiError } from "@/lib/http";
import { Board, KanbanTask, ScheduleShift, TaskPriority, TaskStatus } from "@/lib/types";

type CreateTaskInput = {
  boardId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: string;
  dueDate?: string;
  shiftId?: string;
  shiftLabel?: string;
};

type UpdateTaskInput = Partial<Omit<CreateTaskInput, "boardId">>;

type UpsertShiftInput = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  member?: string;
  source?: "external" | "manual";
};

const DEFAULT_BOARD_NAME = "Operação";
const DEFAULT_BOARD_ID = "default";

function boardsCollection() {
  return getAdminDb().collection("boards");
}

function tasksCollection() {
  return getAdminDb().collection("tasks");
}

function shiftsCollection() {
  return getAdminDb().collection("scheduleShifts");
}

function boardDocId(ownerId: string, boardId: string) {
  return `${ownerId}__${boardId}`;
}

function taskDocId(ownerId: string, taskId: string) {
  return `${ownerId}__${taskId}`;
}

function shiftDocId(ownerId: string, shiftId: string) {
  return `${ownerId}__${shiftId}`;
}

function toIsoDate(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === "string" && value) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date().toISOString();
}

function removeUndefined<T extends Record<string, unknown>>(input: T): T {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof T] = value as T[keyof T];
    }
    return acc;
  }, {} as T);
}

function mapBoard(
  id: string,
  ownerId: string,
  data: Record<string, unknown>,
): Board {
  return {
    id,
    ownerId,
    name: (data.name as string) ?? DEFAULT_BOARD_NAME,
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
  };
}

function mapTask(
  id: string,
  ownerId: string,
  data: Record<string, unknown>,
): KanbanTask {
  return {
    id,
    ownerId,
    boardId: (data.boardId as string) ?? DEFAULT_BOARD_ID,
    title: (data.title as string) ?? "",
    description: data.description as string | undefined,
    status: (data.status as TaskStatus) ?? "todo",
    priority: (data.priority as TaskPriority) ?? "medium",
    startDate: data.startDate as string | undefined,
    dueDate: data.dueDate as string | undefined,
    shiftId: data.shiftId as string | undefined,
    shiftLabel: data.shiftLabel as string | undefined,
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
  };
}

function mapShift(
  id: string,
  ownerId: string,
  data: Record<string, unknown>,
): ScheduleShift {
  return {
    id,
    ownerId,
    title: (data.title as string) ?? "Escala",
    startAt: toIsoDate(data.startAt),
    endAt: toIsoDate(data.endAt),
    member: data.member as string | undefined,
    source: (data.source as "external" | "manual") ?? "external",
    updatedAt: toIsoDate(data.updatedAt),
  };
}

export async function ensureDefaultBoard(ownerId: string): Promise<Board> {
  const docRef = boardsCollection().doc(boardDocId(ownerId, DEFAULT_BOARD_ID));
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    await docRef.set({
      id: DEFAULT_BOARD_ID,
      ownerId,
      name: DEFAULT_BOARD_NAME,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  const freshSnapshot = await docRef.get();
  return mapBoard(
    DEFAULT_BOARD_ID,
    ownerId,
    freshSnapshot.data() as Record<string, unknown>,
  );
}

export async function listBoards(ownerId: string): Promise<Board[]> {
  const snapshot = await boardsCollection().where("ownerId", "==", ownerId).get();
  if (snapshot.empty) {
    const board = await ensureDefaultBoard(ownerId);
    return [board];
  }

  return snapshot.docs
    .map((doc) => mapBoard(doc.data().id as string, ownerId, doc.data()))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listTasks(
  ownerId: string,
  boardId: string,
): Promise<KanbanTask[]> {
  const snapshot = await tasksCollection()
    .where("ownerId", "==", ownerId)
    .where("boardId", "==", boardId)
    .get();

  return snapshot.docs
    .map((doc) => mapTask(doc.data().id as string, ownerId, doc.data()))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getTask(ownerId: string, taskId: string) {
  const snapshot = await tasksCollection().doc(taskDocId(ownerId, taskId)).get();
  if (!snapshot.exists) {
    throw new ApiError(404, "Tarefa não encontrada.");
  }

  return mapTask(taskId, ownerId, snapshot.data() as Record<string, unknown>);
}

export async function createTask(
  ownerId: string,
  input: CreateTaskInput,
): Promise<KanbanTask> {
  const id = crypto.randomUUID();
  const docRef = tasksCollection().doc(taskDocId(ownerId, id));
  await docRef.set(
    removeUndefined({
      id,
      ownerId,
      boardId: input.boardId,
      title: input.title,
      description: input.description,
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      startDate: input.startDate,
      dueDate: input.dueDate,
      shiftId: input.shiftId,
      shiftLabel: input.shiftLabel,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }),
  );

  return getTask(ownerId, id);
}

export async function updateTask(
  ownerId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<KanbanTask> {
  const docRef = tasksCollection().doc(taskDocId(ownerId, taskId));
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new ApiError(404, "Tarefa não encontrada.");
  }

  await docRef.update(
    removeUndefined({
      ...input,
      updatedAt: FieldValue.serverTimestamp(),
    }),
  );

  return getTask(ownerId, taskId);
}

export async function deleteTask(ownerId: string, taskId: string): Promise<void> {
  const docRef = tasksCollection().doc(taskDocId(ownerId, taskId));
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    return;
  }
  await docRef.delete();
}

export async function upsertScheduleShifts(
  ownerId: string,
  shifts: UpsertShiftInput[],
) {
  const batch = getAdminDb().batch();
  for (const shift of shifts) {
    const ref = shiftsCollection().doc(shiftDocId(ownerId, shift.id));
    batch.set(
      ref,
      removeUndefined({
        id: shift.id,
        ownerId,
        title: shift.title,
        startAt: shift.startAt,
        endAt: shift.endAt,
        member: shift.member,
        source: shift.source ?? "external",
        updatedAt: FieldValue.serverTimestamp(),
      }),
      { merge: true },
    );
  }

  if (shifts.length > 0) {
    await batch.commit();
  }
}

export async function listScheduleShifts(
  ownerId: string,
  startDate?: string,
  endDate?: string,
): Promise<ScheduleShift[]> {
  const snapshot = await shiftsCollection().where("ownerId", "==", ownerId).get();
  const items = snapshot.docs
    .map((doc) => mapShift(doc.data().id as string, ownerId, doc.data()))
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  if (!startDate && !endDate) {
    return items;
  }

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  return items.filter((shift) => {
    const shiftStart = new Date(shift.startAt);
    if (start && shiftStart < start) {
      return false;
    }
    if (end && shiftStart > end) {
      return false;
    }
    return true;
  });
}
