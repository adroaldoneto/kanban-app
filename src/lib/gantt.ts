import type { CardRow } from "../hooks/useBoardData";

export interface GanttRange {
  min: Date;
  max: Date;
  days: number;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getGanttRange(cards: CardRow[]): GanttRange | null {
  if (!cards.length) return null;
  let minT = Infinity;
  let maxT = -Infinity;
  for (const c of cards) {
    const a = parseISODate(c.startDate).getTime();
    const b = parseISODate(c.endDate).getTime();
    minT = Math.min(minT, a, b);
    maxT = Math.max(maxT, a, b);
  }
  const min = new Date(minT);
  const max = new Date(maxT);
  const days =
    Math.max(1, Math.ceil((maxT - minT) / (86400 * 1000)) + 1);
  return { min, max, days };
}

export function barPosition(
  start: string,
  end: string,
  range: GanttRange
): { leftPct: number; widthPct: number } {
  const t0 = range.min.getTime();
  const span = range.days * 86400 * 1000;
  const a = parseISODate(start).getTime();
  const b = parseISODate(end).getTime();
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const leftPct = ((lo - t0) / span) * 100;
  const widthPct = Math.max(2, ((hi - lo) / span) * 100 || (86400 * 1000 / span) * 100);
  return { leftPct, widthPct };
}
