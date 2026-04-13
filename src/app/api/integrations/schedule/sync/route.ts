import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/lib/http";
import { requireAuthenticatedUser } from "@/lib/server-auth";
import { syncScheduleForUser } from "@/lib/schedule-integration";

function resolveDateRange(url: URL) {
  const now = new Date();
  const start = url.searchParams.get("startDate");
  const end = url.searchParams.get("endDate");

  const startDate = start
    ? new Date(start)
    : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const endDate = end
    ? new Date(end)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    startDate: Number.isNaN(startDate.getTime())
      ? now.toISOString()
      : startDate.toISOString(),
    endDate: Number.isNaN(endDate.getTime())
      ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : endDate.toISOString(),
  };
}

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { startDate, endDate } = resolveDateRange(request.nextUrl);
    const result = await syncScheduleForUser({
      ownerId: user.uid,
      startDate,
      endDate,
    });

    return NextResponse.json({
      message: "Integração de escala executada.",
      ...result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
