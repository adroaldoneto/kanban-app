import { ShieldCheck } from "lucide-react";

import type { AuthSession, LoginCredentials } from "@/types";

interface AuthPanelProps {
  firebaseReady: boolean;
  session: AuthSession | null;
  loading: boolean;
  authBusy: boolean;
  credentials: LoginCredentials;
  notice: string | null;
  onFieldChange: (field: keyof LoginCredentials, value: string) => void;
  onSignIn: () => Promise<void>;
  onUseDemo: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export function AuthPanel({
  firebaseReady,
  session,
  loading,
  authBusy,
  credentials,
  notice,
  onFieldChange,
  onSignIn,
  onUseDemo,
  onSignOut,
}: AuthPanelProps) {
  return (
    <aside className="card auth-panel">
      <div className="section-header">
        <div>
          <span className="eyebrow">Autenticação</span>
          <h2 className="section-title">Firebase Auth + fallback demo</h2>
        </div>
        <span className="icon-badge">
          <ShieldCheck size={18} />
        </span>
      </div>

      <p className="muted">
        {firebaseReady
          ? "Use o mesmo projeto Firebase do sistema de escala para compartilhar acesso e sincronização do quadro."
          : "As credenciais do Firebase ainda não existem neste ambiente, então a aplicação entra em modo demonstração."}
      </p>

      {session ? (
        <div className="stack-md">
          <div className="subcard">
            <div className="between wrap gap-sm">
              <div>
                <div className={`pill pill-${session.mode === "firebase" ? "success" : "warning"}`}>
                  {session.mode === "firebase" ? "Sessão Firebase" : "Modo demonstração"}
                </div>
                <h3 className="subcard-title">{session.displayName}</h3>
                <p className="muted small">{session.email}</p>
              </div>
              <button className="button button-secondary" type="button" onClick={() => void onSignOut()}>
                Sair
              </button>
            </div>
          </div>

          {notice ? <div className="notice">{notice}</div> : null}
        </div>
      ) : (
        <div className="stack-md">
          <label className="field">
            <span>E-mail</span>
            <input
              className="input"
              type="email"
              value={credentials.email}
              onChange={(event) => onFieldChange("email", event.target.value)}
              placeholder="voce@empresa.com"
            />
          </label>
          <label className="field">
            <span>Senha</span>
            <input
              className="input"
              type="password"
              value={credentials.password}
              onChange={(event) => onFieldChange("password", event.target.value)}
              placeholder="Digite sua senha"
            />
          </label>
          <div className="button-row">
            <button
              className="button"
              type="button"
              disabled={!firebaseReady || authBusy || loading}
              onClick={() => void onSignIn()}
            >
              Entrar com Firebase
            </button>
            <button className="button button-secondary" type="button" disabled={authBusy} onClick={() => void onUseDemo()}>
              Entrar em modo demo
            </button>
          </div>
          {notice ? <div className="notice">{notice}</div> : null}
        </div>
      )}
    </aside>
  );
}
