import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/lib/http";
import { listTasks } from "@/lib/kanban-store";
import {
  buildGanttItems,
  renderGanttPng,
  renderGanttSvg,
} from "@/lib/reports";
import { requireAuthenticatedUser } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const boardId = request.nextUrl.searchParams.get("boardId") ?? "default";
    const format = request.nextUrl.searchParams.get("as") ?? "json";
    const tasks = await listTasks(user.uid, boardId);
    const items = buildGanttItems(tasks);

    if (format === "svg") {
      const svg = renderGanttSvg(items);
      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": 'attachment; filename="gantt-report.svg"',
        },
      });
    }

    if (format === "png") {
      const png = await renderGanttPng(items);
      return new Response(new Uint8Array(png), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": 'attachment; filename="gantt-report.png"',
        },
      });
    }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      items,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
