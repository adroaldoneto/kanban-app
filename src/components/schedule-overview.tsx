import { Link2, Radar } from "lucide-react";

import { formatShiftWindow } from "@/lib/helpers";
import type { ScheduleShift } from "@/types";

interface ScheduleOverviewProps {
  shifts: ScheduleShift[];
  notes: string[];
  firebaseReady: boolean;
  sessionMode?: "demo" | "firebase";
}

export function ScheduleOverview({
  shifts,
  notes,
  firebaseReady,
  sessionMode,
}: ScheduleOverviewProps) {
  return (
    <section className="card section-stack">
      <div className="section-header">
        <div>
          <span className="eyebrow">Integração com escala</span>
          <h2 className="section-title">Conector pronto para o sistema existente</h2>
          <p className="section-description">
            Como o sistema original não está neste repositório, a tela usa dados de demonstração
            com a mesma modelagem que a integração real exigirá.
          </p>
        </div>
        <div className="button-row compact">
          <span className={`pill pill-${firebaseReady && sessionMode === "firebase" ? "success" : "warning"}`}>
            {firebaseReady && sessionMode === "firebase"
              ? "Autenticação real"
              : "Fallback de integração"}
          </span>
        </div>
      </div>

      <div className="split-layout">
        <div className="subcard">
          <div className="between wrap gap-sm">
            <h3 className="subcard-title">Escala importada</h3>
            <span className="icon-badge">
              <Radar size={18} />
            </span>
          </div>
          <div className="schedule-grid">
            {shifts.map((shift) => (
              <article key={shift.id} className="schedule-item">
                <div className="between wrap gap-sm">
                  <div>
                    <strong>{shift.collaborator}</strong>
                    <p className="muted small">{shift.role}</p>
                  </div>
                  <span
                    className={`pill pill-${
                      shift.status === "Confirmado"
                        ? "success"
                        : shift.status === "Cobertura"
                          ? "warning"
                          : "neutral"
                    }`}
                  >
                    {shift.status}
                  </span>
                </div>
                <p className="muted small">{formatShiftWindow(shift.start, shift.end)}</p>
                <p className="muted small">Local: {shift.location}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="subcard">
          <div className="between wrap gap-sm">
            <h3 className="subcard-title">Checklist de implantação</h3>
            <span className="icon-badge">
              <Link2 size={18} />
            </span>
          </div>
          <ul className="bullet-list">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
