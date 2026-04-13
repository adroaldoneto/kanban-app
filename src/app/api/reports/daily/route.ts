import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/lib/http";
import { listTasks } from "@/lib/kanban-store";
import {
  buildDailySummary,
  renderDailyPdf,
  renderDailyPng,
  renderDailySvg,
} from "@/lib/reports";
import { requireAuthenticatedUser } from "@/lib/server-auth";

function resolveDate(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date");
  if (!dateParam) {
    return new Date().toISOString().slice(0, 10);
  }

  const date = new Date(dateParam);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const boardId = request.nextUrl.searchParams.get("boardId") ?? "default";
    const format = request.nextUrl.searchParams.get("format") ?? "json";
    const date = resolveDate(request);

    const tasks = await listTasks(user.uid, boardId);
    const summary = buildDailySummary(tasks, date);

    if (format === "pdf") {
      const pdf = await renderDailyPdf(summary);
      return new Response(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="daily-report-${date}.pdf"`,
        },
      });
    }

    if (format === "svg") {
      const svg = renderDailySvg(summary);
      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `attachment; filename="daily-report-${date}.svg"`,
        },
      });
    }

    if (format === "png") {
      const png = await renderDailyPng(summary);
      return new Response(new Uint8Array(png), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="daily-report-${date}.png"`,
        },
      });
    }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      summary,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
