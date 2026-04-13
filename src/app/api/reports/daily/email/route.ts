import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { handleApiError } from "@/lib/http";
import { listTasks } from "@/lib/kanban-store";
import { sendReportEmail } from "@/lib/mailer";
import {
  buildDailySummary,
  renderDailyPdf,
  renderDailyPng,
  renderDailySvg,
} from "@/lib/reports";
import { requireAuthenticatedUser } from "@/lib/server-auth";

const sendEmailSchema = z.object({
  boardId: z.string().default("default"),
  date: z.string().optional(),
  to: z.string().email(),
  format: z.enum(["pdf", "png", "svg"]).default("pdf"),
});

function normalizeDate(value?: string) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const payload = sendEmailSchema.parse(await request.json());
    const date = normalizeDate(payload.date);

    const tasks = await listTasks(user.uid, payload.boardId);
    const summary = buildDailySummary(tasks, date);

    let filename = `daily-report-${date}.pdf`;
    let contentType = "application/pdf";
    let content = await renderDailyPdf(summary);

    if (payload.format === "png") {
      filename = `daily-report-${date}.png`;
      contentType = "image/png";
      content = Buffer.from(await renderDailyPng(summary));
    } else if (payload.format === "svg") {
      filename = `daily-report-${date}.svg`;
      contentType = "image/svg+xml";
      content = Buffer.from(renderDailySvg(summary), "utf-8");
    }

    await sendReportEmail({
      to: payload.to,
      subject: `Relatório diário Kanban ${date}`,
      text: `Segue o relatório diário do Kanban para ${date}.`,
      filename,
      contentType,
      content,
    });

    return NextResponse.json({ message: "Relatório enviado por e-mail com sucesso." });
  } catch (error) {
    return handleApiError(error);
  }
}
