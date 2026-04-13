"use client";

import { CalendarRange, ChartNoAxesGantt, ClipboardList, Mail, ShieldCheck } from "lucide-react";

import { AuthPanel } from "@/components/auth-panel";
import { DailyReport } from "@/components/daily-report";
import { GanttChart } from "@/components/gantt-chart";
import { KanbanBoard } from "@/components/kanban-board";
import { ScheduleOverview } from "@/components/schedule-overview";
import { StatCard } from "@/components/stat-card";
import { useKanbanStore } from "@/hooks/use-kanban-store";
import { scaleIntegrationChecklist } from "@/lib/schedule-adapter";

export default function HomePage() {
  const store = useKanbanStore();

  return (
    <main className="page-shell">
      <div className="page-content">
        <section className="hero">
          <div className="card hero-card">
            <div className="hero-pills">
              <span className="pill pill-primary">Kanban online</span>
              <span className="pill pill-success">Firebase Auth</span>
              <span className="pill pill-warning">Relatórios executivos</span>
            </div>

            <h1 className="hero-title">Kanban operacional com integração de escala, Gantt e relatórios diários.</h1>
            <p className="hero-subtitle">
              Esta base foi criada para cobrir o cenário que você descreveu: quadro online, autenticação pelo Firebase,
              visão geral em Gantt, exportação de relatórios em PDF ou imagem e disparo por e-mail.
            </p>

            <div className="feature-grid">
              <article className="feature-item">
                <span className="icon-badge">
                  <ClipboardList size={18} />
                </span>
                <div>
                  <h3>Fluxo Kanban completo</h3>
                  <p>Backlog, a fazer, em andamento e concluído com drag and drop e vínculo ao turno.</p>
                </div>
              </article>
              <article className="feature-item">
                <span className="icon-badge">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <h3>Autenticação com fallback</h3>
                  <p>Login Firebase quando configurado e modo demonstração enquanto o sistema original não está aqui.</p>
                </div>
              </article>
              <article className="feature-item">
                <span className="icon-badge">
                  <ChartNoAxesGantt size={18} />
                </span>
                <div>
                  <h3>Relatório geral em Gantt</h3>
                  <p>Linha do tempo consolidada por cartão, prazo, progresso e colaborador da escala.</p>
                </div>
              </article>
              <article className="feature-item">
                <span className="icon-badge">
                  <Mail size={18} />
                </span>
                <div>
                  <h3>PDF, imagem e e-mail</h3>
                  <p>Gere o relatório diário e envie para liderança, diretoria ou operação.</p>
                </div>
              </article>
            </div>
          </div>

          <AuthPanel
            firebaseReady={store.firebaseReady}
            session={store.session}
            loading={store.loading}
            authBusy={store.authBusy}
            credentials={store.credentials}
            notice={store.notice}
            onFieldChange={store.setCredential}
            onSignIn={store.signIn}
            onUseDemo={store.activateDemoMode}
            onSignOut={store.signOut}
          />
        </section>

        {store.loading ? (
          <section className="card">
            <h2 className="section-title">Inicializando ambiente</h2>
            <p className="section-description">Validando autenticação, dados locais e conexão com o Firebase.</p>
          </section>
        ) : store.session ? (
          <>
            <section className="stats-grid">
              <StatCard
                title="Cards totais"
                value={store.stats.totalTasks}
                description="Volume total controlado no quadro operacional."
                icon={<ClipboardList size={18} />}
              />
              <StatCard
                title="Concluídas"
                value={store.stats.completed}
                description="Itens já entregues e disponíveis para auditoria."
                icon={<ShieldCheck size={18} />}
                tone="success"
              />
              <StatCard
                title="Atrasadas"
                value={store.stats.overdue}
                description="Pontos que exigem ação imediata ou redistribuição da escala."
                icon={<CalendarRange size={18} />}
                tone="warning"
              />
              <StatCard
                title="Pessoas na escala"
                value={store.stats.scheduledPeople}
                description={`${store.stats.upcomingShifts} turnos monitorados na importação atual.`}
                icon={<ChartNoAxesGantt size={18} />}
              />
            </section>

            <ScheduleOverview
              shifts={store.schedule}
              notes={scaleIntegrationChecklist}
              firebaseReady={store.firebaseReady}
              sessionMode={store.session.mode}
            />

            <KanbanBoard
              tasks={store.tasks}
              shifts={store.schedule}
              onAddTask={store.addTask}
              onMoveTask={store.moveTask}
              onDeleteTask={store.deleteTask}
            />

            <GanttChart tasks={store.tasks} shifts={store.schedule} />

            <DailyReport report={store.report} tasks={store.tasks} shifts={store.schedule} />
          </>
        ) : (
          <section className="card section-stack">
            <span className="eyebrow">Pronto para integração</span>
            <h2 className="section-title">Faça login ou entre em modo demonstração</h2>
            <p className="section-description">
              O código já está preparado para receber o Firebase e o sistema de escala existentes. Enquanto isso, o
              modo demo permite validar todo o fluxo.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
