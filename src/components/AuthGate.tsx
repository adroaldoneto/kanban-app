import { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, firebaseReady, loginWithGoogle } = useAuth()

  if (loading) {
    return (
      <main className="centered-screen">
        <p>Carregando autenticação...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="centered-screen">
        <div className="auth-card">
          <h1>Kanban + Escala</h1>
          <p>Faça login para acessar tarefas, Gantt e relatórios diários.</p>
          <button onClick={() => void loginWithGoogle()}>Entrar com Google</button>
          {!firebaseReady && (
            <small>
              Firebase não configurado: adicione variáveis VITE_FIREBASE_* para autenticação real.
            </small>
          )}
        </div>
      </main>
    )
  }

  return <>{children}</>
}
