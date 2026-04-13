import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { handleApiError } from "@/lib/http";
import { createTask, ensureDefaultBoard, listTasks } from "@/lib/kanban-store";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/types";

const createTaskSchema = z.object({
  boardId: z.string().min(1).default("default"),
  title: z.string().min(2, "Título precisa ter ao menos 2 caracteres."),
  description: z.string().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  shiftId: z.string().optional(),
  shiftLabel: z.string().optional(),
});

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const boardId = request.nextUrl.searchParams.get("boardId") ?? "default";
    await ensureDefaultBoard(user.uid);
    const tasks = await listTasks(user.uid, boardId);
    return NextResponse.json({ tasks });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await request.json();
    const payload = createTaskSchema.parse(body);
    await ensureDefaultBoard(user.uid);

    const task = await createTask(user.uid, payload);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
