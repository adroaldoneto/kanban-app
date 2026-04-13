import { ApiError } from "@/lib/http";
import { upsertScheduleShifts } from "@/lib/kanban-store";

type ExternalShift = {
  id: string | number;
  title?: string;
  name?: string;
  startAt?: string;
  endAt?: string;
  start?: string;
  end?: string;
  member?: string;
  collaborator?: string;
};

function normalizeIsoDate(value: string | undefined, fallback: Date) {
  if (!value) {
    return fallback.toISOString();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback.toISOString();
  }
  return date.toISOString();
}

export async function syncScheduleForUser(params: {
  ownerId: string;
  startDate: string;
  endDate: string;
}) {
  const baseUrl = process.env.SCHEDULE_API_BASE_URL;

  if (!baseUrl) {
    return {
      synced: 0,
      warning:
        "SCHEDULE_API_BASE_URL não configurado. A integração foi mantida pronta, mas sem endpoint remoto definido.",
    };
  }

  const url = new URL("/shifts", baseUrl);
  url.searchParams.set("start", params.startDate);
  url.searchParams.set("end", params.endDate);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const apiKey = process.env.SCHEDULE_API_KEY;
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, { method: "GET", headers, cache: "no-store" });
  if (!response.ok) {
    throw new ApiError(
      502,
      `Falha ao consultar o sistema de escala (${response.status}).`,
    );
  }

  const payload = (await response.json()) as
    | ExternalShift[]
    | { shifts?: ExternalShift[]; items?: ExternalShift[] };

  const rows = Array.isArray(payload)
    ? payload
    : payload.shifts ?? payload.items ?? [];

  const now = new Date();
  const normalized = rows.map((shift, index) => {
    const fallbackStart = new Date(now.getTime() + index * 60 * 60 * 1000);
    const fallbackEnd = new Date(fallbackStart.getTime() + 60 * 60 * 1000);
    return {
      id: String(shift.id ?? `${Date.now()}-${index}`),
      title: shift.title ?? shift.name ?? "Escala",
      startAt: normalizeIsoDate(shift.startAt ?? shift.start, fallbackStart),
      endAt: normalizeIsoDate(shift.endAt ?? shift.end, fallbackEnd),
      member: shift.member ?? shift.collaborator,
      source: "external" as const,
    };
  });

  await upsertScheduleShifts(params.ownerId, normalized);

  return {
    synced: normalized.length,
    warning: null,
  };
}
