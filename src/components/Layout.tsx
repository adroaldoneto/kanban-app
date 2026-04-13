import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV_ITEMS = [
  { label: 'Kanban', path: '/' },
  { label: 'Gantt', path: '/gantt' },
  { label: 'Relatórios', path: '/relatorios' },
  { label: 'Integração Escala', path: '/integracao' },
]

export function Layout() {
  const { user, logout, firebaseReady } = useAuth()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h2>Ops Board</h2>
          <p>Kanban online integrado com escala</p>
        </div>
        <div className="topbar-actions">
          <span>{user?.email ?? user?.displayName ?? 'Usuário'}</span>
          {!firebaseReady && <span className="badge">modo demo</span>}
          <button className="ghost" onClick={() => void logout()}>
            Sair
          </button>
        </div>
      </header>
      <nav className="tabs">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
