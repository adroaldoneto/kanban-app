import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/lib/http";
import { listScheduleShifts } from "@/lib/kanban-store";
import { requireAuthenticatedUser } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const startDate = request.nextUrl.searchParams.get("startDate") ?? undefined;
    const endDate = request.nextUrl.searchParams.get("endDate") ?? undefined;
    const shifts = await listScheduleShifts(user.uid, startDate, endDate);
    return NextResponse.json({ shifts });
  } catch (error) {
    return handleApiError(error);
  }
}
