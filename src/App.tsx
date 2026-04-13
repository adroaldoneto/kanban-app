import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { KanbanBoard } from "./components/KanbanBoard";
import { CardModal } from "./components/CardModal";
import { AddCardModal } from "./components/AddCardModal";
import { GanttChart } from "./components/GanttChart";
import {
  DEFAULT_BOARD_ID,
  ensureDefaultBoard,
  useBoardData,
  type CardRow,
} from "./hooks/useBoardData";
import { getFirebaseAuth, isFirebaseConfigured } from "./lib/firebase";
import {
  buildMailtoReport,
  captureElementAsPng,
  elementToPdf,
} from "./lib/exportReport";
import styles from "./App.module.css";

type Tab = "kanban" | "gantt" | "reports";

function sortInColumn(cards: CardRow[], columnId: string) {
  return cards
    .filter((c) => c.columnId === columnId)
    .sort((a, b) => a.order - b.order);
}

function App() {
  const firebaseReady = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(firebaseReady);
  const [tab, setTab] = useState<Tab>("kanban");
  const [modalCard, setModalCard] = useState<CardRow | null>(null);
  const [addColumnId, setAddColumnId] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState("");

  const ganttExportRef = useRef<HTMLDivElement>(null);
  const dailyExportRef = useRef<HTMLDivElement>(null);
  const uid = user?.uid ?? "demo-user";
  const boardId = DEFAULT_BOARD_ID;

  const {
    columns,
    cards,
    loading,
    error,
    moveCard,
    addCard,
    updateCard,
    deleteCard,
  } = useBoardData(uid, boardId, firebaseReady);

  useEffect(() => {
    if (!firebaseReady) {
      setAuthLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        void ensureDefaultBoard(u.uid, boardId);
      }
    });
  }, [firebaseReady, boardId]);

  const signInGoogle = async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOutUser = async () => {
    await signOut(getFirebaseAuth());
  };

  const dailyLines = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lines: string[] = [];
    lines.push(`Relatório diário — ${today}`);
    lines.push("");
    for (const col of [...columns].sort((a, b) => a.order - b.order)) {
      const list = sortInColumn(cards, col.id);
      lines.push(`## ${col.title} (${list.length})`);
      for (const c of list) {
        const due =
          c.endDate === today
            ? " (vence hoje)"
            : c.startDate === today
              ? " (inicia hoje)"
              : "";
        lines.push(
          `  • ${c.title} — ${c.startDate} → ${c.endDate}${due}`
        );
      }
      lines.push("");
    }
    return lines;
  }, [columns, cards]);

  const mailtoDaily = useMemo(() => {
    const to = emailTo.trim() || "destinatario@exemplo.com";
    return buildMailtoReport(
      to,
      `Kanban — relatório ${new Date().toISOString().slice(0, 10)}`,
      dailyLines
    );
  }, [dailyLines, emailTo]);

  const exportGanttPdf = useCallback(async () => {
    const el = ganttExportRef.current;
    if (!el) return;
    await elementToPdf(
      el,
      `gantt-${new Date().toISOString().slice(0, 10)}`,
      "Visão geral — gráfico de Gantt"
    );
  }, []);

  const exportGanttPng = useCallback(async () => {
    const el = ganttExportRef.current;
    if (!el) return;
    await captureElementAsPng(
      el,
      `gantt-${new Date().toISOString().slice(0, 10)}`
    );
  }, []);

  const exportDailyPdf = useCallback(async () => {
    const el = dailyExportRef.current;
    if (!el) return;
    await elementToPdf(
      el,
      `diario-${new Date().toISOString().slice(0, 10)}`,
      "Relatório diário — Kanban"
    );
  }, []);

  const exportDailyPng = useCallback(async () => {
    const el = dailyExportRef.current;
    if (!el) return;
    await captureElementAsPng(
      el,
      `diario-${new Date().toISOString().slice(0, 10)}`
    );
  }, []);

  if (firebaseReady && authLoading) {
    return <div className={styles.loading}>Carregando…</div>;
  }

  if (firebaseReady && !user) {
    return (
      <div className={styles.loginCard}>
        <h1>Kanban</h1>
        <p>
          Entre com a mesma conta Firebase usada no sistema de escala. Os
          dados do quadro ficam em{" "}
          <code style={{ fontSize: "0.8rem" }}>
            users/&lt;uid&gt;/boards/default
          </code>
          .
        </p>
        <button type="button" className={styles.btnPrimary} onClick={signInGoogle}>
          Entrar com Google
        </button>
      </div>
    );
  }

  const addColTitle =
    columns.find((c) => c.id === addColumnId)?.title ?? "";

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          Kanban <span>+ Firebase</span>
        </div>
        <nav className={styles.tabs} aria-label="Navegação principal">
          <button
            type="button"
            className={`${styles.tab} ${tab === "kanban" ? styles.tabActive : ""}`}
            onClick={() => setTab("kanban")}
          >
            Quadro
          </button>
          <button
            type="button"
            className={`${styles.tab} ${tab === "gantt" ? styles.tabActive : ""}`}
            onClick={() => setTab("gantt")}
          >
            Gantt
          </button>
          <button
            type="button"
            className={`${styles.tab} ${tab === "reports" ? styles.tabActive : ""}`}
            onClick={() => setTab("reports")}
          >
            Relatórios
          </button>
        </nav>
        <div className={styles.spacer} />
        {firebaseReady && user ? (
          <>
            <span className={styles.user}>{user.email}</span>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => void signOutUser()}
            >
              Sair
            </button>
          </>
        ) : (
          <span className={styles.user}>Modo demo (localStorage)</span>
        )}
      </header>

      <main className={styles.main}>
        {!firebaseReady ? (
          <p className={styles.panelDesc}>
            Sem variáveis <code>.env</code>: o app roda em modo demo no
            navegador. Para sincronizar com o projeto da escala, configure o
            Firebase abaixo e faça deploy.
          </p>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}
        {loading ? (
          <div className={styles.loading}>Sincronizando quadro…</div>
        ) : null}

        {tab === "kanban" && !loading ? (
          <>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Quadro Kanban</h2>
              <p className={styles.panelDesc}>
                Arraste cartões entre colunas. Use datas em cada cartão para
                alimentar o Gantt e os relatórios.
              </p>
            </div>
            <KanbanBoard
              columns={columns}
              cards={cards}
              moveCard={moveCard}
              onEditCard={(c) => setModalCard(c)}
              onAddCard={(col) => setAddColumnId(col)}
            />
          </>
        ) : null}

        {tab === "gantt" && !loading ? (
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Gráfico de Gantt</h2>
            <p className={styles.panelDesc}>
              Linha de tempo com base em início e fim de cada cartão.
            </p>
            <div ref={ganttExportRef}>
              <GanttChart cards={cards} columns={columns} />
            </div>
            <div className={styles.toolbar}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => void exportGanttPdf()}
              >
                Baixar PDF
              </button>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => void exportGanttPng()}
              >
                Baixar imagem (PNG)
              </button>
              <a
                className={styles.btnGhost}
                href={buildMailtoReport(
                  emailTo.trim() || "destinatario@exemplo.com",
                  `Gantt Kanban ${new Date().toISOString().slice(0, 10)}`,
                  [
                    "Segue o resumo do quadro (anexe o PDF ou PNG exportado acima).",
                    "",
                    ...dailyLines,
                  ]
                )}
              >
                Abrir e-mail (anexar arquivo manualmente)
              </a>
            </div>
          </div>
        ) : null}

        {tab === "reports" && !loading ? (
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Relatórios</h2>
            <p className={styles.panelDesc}>
              Relatório diário em texto; exporte como PDF ou imagem. E-mail:
              use o cliente padrão (mailto) ou, em produção, integre Firebase
              Cloud Functions + SendGrid/SES para envio automático com anexo.
            </p>
            <div className={styles.toolbar}>
              <label>
                E-mail destino
                <input
                  className={styles.inputSm}
                  type="email"
                  placeholder="gestor@empresa.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                />
              </label>
            </div>
            <div ref={dailyExportRef}>
              <div className={styles.reportBox}>
                <h3>Resumo do dia</h3>
                <div className={styles.dailySummary}>
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      fontFamily: "var(--mono)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {dailyLines.join("\n")}
                  </pre>
                  <ul>
                    {cards
                      .filter(
                        (c) =>
                          c.endDate ===
                            new Date().toISOString().slice(0, 10) ||
                          c.startDate ===
                            new Date().toISOString().slice(0, 10)
                      )
                      .map((c) => (
                        <li key={c.id}>
                          <strong>{c.title}</strong> —{" "}
                          {c.startDate ===
                          new Date().toISOString().slice(0, 10)
                            ? "inicia"
                            : "vence"}{" "}
                          hoje
                        </li>
                      ))}
                    {cards.every(
                      (c) =>
                        c.endDate !==
                          new Date().toISOString().slice(0, 10) &&
                        c.startDate !==
                          new Date().toISOString().slice(0, 10)
                    ) ? (
                      <li>Nenhum cartão com início ou fim hoje.</li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </div>
            <div className={styles.toolbar}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => void exportDailyPdf()}
              >
                PDF do relatório diário
              </button>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => void exportDailyPng()}
              >
                Imagem (PNG)
              </button>
              <a className={styles.btnGhost} href={mailtoDaily}>
                Enviar por e-mail (mailto)
              </a>
            </div>
          </div>
        ) : null}
      </main>

      <CardModal
        card={modalCard}
        open={!!modalCard}
        onClose={() => setModalCard(null)}
        onSave={(id, data) => {
          void updateCard(id, {
            title: data.title,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            assigneeEmail: data.assigneeEmail.trim()
              ? data.assigneeEmail.trim()
              : "",
          });
        }}
        onDelete={(id) => void deleteCard(id)}
      />
      <AddCardModal
        columnId={addColumnId ?? ""}
        columnTitle={addColTitle}
        open={!!addColumnId}
        onClose={() => setAddColumnId(null)}
        onCreate={(d) => void addCard(d)}
      />
    </div>
  );
}

export default App;
