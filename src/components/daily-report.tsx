"use client";

import { isSameDay, parseISO } from "date-fns";
import { FileDown, ImageDown, Mail } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  captureElementAsPngDataUrl,
  exportElementAsPdf,
  exportElementAsPng,
} from "@/lib/exporters";
import {
  buildReportEmailHtml,
  formatTaskDateRange,
  getShiftName,
  priorityClassMap,
  statusLabels,
} from "@/lib/helpers";
import type { DailyReportSummary, KanbanTask, ScheduleShift } from "@/types";

interface DailyReportProps {
  report: DailyReportSummary;
  tasks: KanbanTask[];
  shifts: ScheduleShift[];
}

export function DailyReport({ report, tasks, shifts }: DailyReportProps) {
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [recipient, setRecipient] = useState("gestao@empresa.com");
  const [subject, setSubject] = useState(`Relatório diário do Kanban - ${report.date}`);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSubject(`Relatório diário do Kanban - ${report.date}`);
  }, [report.date]);

  const tasksDueToday = useMemo(() => {
    return tasks.filter((task) => isSameDay(parseISO(task.endDate), parseISO(report.date)));
  }, [report.date, tasks]);

  const handleDownloadPdf = async () => {
    if (!reportRef.current) {
      return;
    }

    await exportElementAsPdf(reportRef.current, `relatorio-diario-${report.date}.pdf`);
  };

  const handleDownloadImage = async () => {
    if (!reportRef.current) {
      return;
    }

    await exportElementAsPng(reportRef.current, `relatorio-diario-${report.date}.png`);
  };

  const handleSendEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reportRef.current) {
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const imageDataUrl = await captureElementAsPngDataUrl(reportRef.current);
      const response = await fetch("/api/send-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: recipient,
          subject,
          html: buildReportEmailHtml(report, tasks),
          imageDataUrl,
          attachmentName: `relatorio-diario-${report.date}.png`,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        simulated?: boolean;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao enviar o e-mail.");
      }

      setMessage(
        payload.simulated
          ? payload.message ?? "SMTP ainda não configurado: envio simulado com sucesso."
          : payload.message ?? "Relatório enviado com sucesso por e-mail.",
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Não foi possível disparar o e-mail.";
      setMessage(detail);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="card section-stack">
      <div className="section-header">
        <div>
          <span className="eyebrow">Relatório diário</span>
          <h2 className="section-title">PDF, imagem e disparo por e-mail</h2>
          <p className="section-description">
            O painel abaixo resume a operação do dia e pode ser baixado em PDF/foto ou enviado por
            e-mail quando o SMTP estiver configurado.
          </p>
        </div>
      </div>

      <div className="split-layout report-layout">
        <div ref={reportRef} className="report-preview">
          <div className="report-preview-header">
            <div>
              <span className="eyebrow dark">Resumo executivo</span>
              <h3>Relatório diário do Kanban operacional</h3>
            </div>
            <span className="pill pill-primary">{report.date}</span>
          </div>

          <div className="metric-grid">
            <article className="metric-card">
              <span>Cards totais</span>
              <strong>{report.totalTasks}</strong>
            </article>
            <article className="metric-card">
              <span>Concluídas</span>
              <strong>{report.completedTasks}</strong>
            </article>
            <article className="metric-card">
              <span>Em andamento</span>
              <strong>{report.inProgressTasks}</strong>
            </article>
            <article className="metric-card">
              <span>Atrasadas</span>
              <strong>{report.overdueTasks}</strong>
            </article>
            <article className="metric-card">
              <span>Pessoas na escala</span>
              <strong>{report.scheduledPeople}</strong>
            </article>
          </div>

          <div className="report-columns">
            <div>
              <h4>Destaques</h4>
              <ul className="report-list">
                {report.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Bloqueios</h4>
              <ul className="report-list">
                {report.blockers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h4>Entregas previstas para hoje</h4>
            <div className="report-task-list">
              {tasksDueToday.length === 0 ? (
                <div className="empty-state light">Nenhum cartão com vencimento hoje.</div>
              ) : (
                tasksDueToday.map((task) => (
                  <article key={task.id} className="report-task-item">
                    <div className="between wrap gap-sm">
                      <strong>{task.title}</strong>
                      <span className={`tag ${priorityClassMap[task.priority]}`}>{task.priority}</span>
                    </div>
                    <p>{formatTaskDateRange(task.startDate, task.endDate)}</p>
                    <p>
                      {statusLabels[task.status]} · {getShiftName(task.shiftId, shifts)}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="stack-md">
          <div className="subcard">
            <h3 className="subcard-title">Exportações rápidas</h3>
            <div className="stack-sm">
              <button className="button full-width" type="button" onClick={() => void handleDownloadPdf()}>
                <FileDown size={16} />
                Baixar PDF
              </button>
              <button
                className="button button-secondary full-width"
                type="button"
                onClick={() => void handleDownloadImage()}
              >
                <ImageDown size={16} />
                Baixar imagem
              </button>
            </div>
          </div>

          <form className="subcard stack-sm" onSubmit={(event) => void handleSendEmail(event)}>
            <div className="between wrap gap-sm">
              <h3 className="subcard-title">Disparar por e-mail</h3>
              <span className="icon-badge">
                <Mail size={18} />
              </span>
            </div>

            <label className="field">
              <span>Destino</span>
              <input
                className="input"
                type="email"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="gestao@empresa.com"
              />
            </label>
            <label className="field">
              <span>Assunto</span>
              <input className="input" value={subject} onChange={(event) => setSubject(event.target.value)} />
            </label>

            <button className="button full-width" type="submit" disabled={sending}>
              <Mail size={16} />
              {sending ? "Enviando..." : "Enviar relatório"}
            </button>

            <p className="muted small">
              Para envio real, configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e SMTP_FROM.
              Sem isso, o endpoint responde em modo simulado.
            </p>

            {message ? <div className="notice">{message}</div> : null}
          </form>
        </div>
      </div>
    </section>
  );
}
