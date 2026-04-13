import type { CardRow } from "../hooks/useBoardData";
import type { ColumnRow } from "../hooks/useBoardData";
import { barPosition, getGanttRange, parseISODate } from "../lib/gantt";
import styles from "./GanttChart.module.css";

interface Props {
  cards: CardRow[];
  columns: ColumnRow[];
}

export function GanttChart({ cards, columns }: Props) {
  const range = getGanttRange(cards);
  const colTitle = (id: string) =>
    columns.find((c) => c.id === id)?.title ?? id;

  if (!range) {
    return (
      <div className={styles.empty}>
        Adicione cartões com datas para ver o Gantt.
      </div>
    );
  }

  const monthLabels: { offset: number; label: string }[] = [];
  const cursor = new Date(range.min);
  cursor.setDate(1);
  while (cursor <= range.max) {
    const offsetDays =
      (parseISODate(
        `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-01`
      ).getTime() -
        range.min.getTime()) /
      (86400 * 1000);
    monthLabels.push({
      offset: Math.max(0, offsetDays / range.days) * 100,
      label: cursor.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      }),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <div className={styles.labelCol} />
        <div className={styles.timelineHeader}>
          {monthLabels.map((m, i) => (
            <span
              key={i}
              className={styles.monthTick}
              style={{ left: `${m.offset}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.grid}>
        <div className={styles.dayStripes} />
        {cards.map((card) => {
          const { leftPct, widthPct } = barPosition(
            card.startDate,
            card.endDate,
            range
          );
          return (
            <div key={card.id} className={styles.row}>
              <div className={styles.labelCol}>
                <span className={styles.cardTitle}>{card.title}</span>
                <span className={styles.meta}>
                  {colTitle(card.columnId)} · {card.startDate} → {card.endDate}
                </span>
              </div>
              <div className={styles.track}>
                <div
                  className={styles.bar}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  title={`${card.title}: ${card.startDate} – ${card.endDate}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
