import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { deleteTask, updateTask } from "@/lib/kanban-store";
import { handleApiError } from "@/lib/http";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/types";

const updateTaskSchema = z
  .object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
    shiftId: z.string().optional(),
    shiftLabel: z.string().optional(),
  })
  .strict();

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { taskId } = await context.params;
    const payload = updateTaskSchema.parse(await request.json());
    const task = await updateTask(user.uid, taskId, payload);
    return NextResponse.json({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { taskId } = await context.params;
    await deleteTask(user.uid, taskId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
