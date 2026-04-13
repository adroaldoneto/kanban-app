import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthGate } from './components/AuthGate'
import { GanttView } from './components/GanttView'
import { KanbanBoard } from './components/KanbanBoard'
import { Layout } from './components/Layout'
import { ReportsView } from './components/ReportsView'
import { ScaleIntegrationView } from './components/ScaleIntegrationView'
import { BoardProvider } from './contexts/BoardContext'

function App() {
  return (
    <AuthGate>
      <BoardProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<KanbanBoard />} />
            <Route path="/gantt" element={<GanttView />} />
            <Route path="/relatorios" element={<ReportsView />} />
            <Route path="/integracao" element={<ScaleIntegrationView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BoardProvider>
    </AuthGate>
  )
}

export default App
