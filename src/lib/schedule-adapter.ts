import { z } from "zod";
import { demoScheduleOverview } from "./demo-data";
import { getScheduleApiUrl } from "./env";
import type { ScheduleOverview } from "./types";

const shiftSchema = z.object({
  id: z.string(),
  title: z.string(),
  team: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  slots: z.number(),
  status: z.enum(["scheduled", "attention", "confirmed"]),
});

const scheduleSchema = z.object({
  source: z.enum(["demo", "api"]).default("api"),
  connected: z.boolean().default(true),
  lastSync: z.string(),
  shifts: z.array(shiftSchema),
  alerts: z.array(z.string()).default([]),
  integrationNotes: z.array(z.string()).default([]),
});

export async function loadScheduleOverview(): Promise<ScheduleOverview> {
  const url = getScheduleApiUrl();

  if (!url) {
    return {
      ...demoScheduleOverview,
      alerts: [...demoScheduleOverview.alerts],
    };
  }

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Falha ao carregar escala: ${response.status}`);
    }

    const parsed = scheduleSchema.parse(await response.json());
    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao consultar a escala.";
    return {
      ...demoScheduleOverview,
      alerts: [...demoScheduleOverview.alerts, message],
      integrationNotes: [
        ...demoScheduleOverview.integrationNotes,
        "Verifique CORS, autenticacao do endpoint e payload retornado pela API de escala.",
      ],
    };
  }
}
