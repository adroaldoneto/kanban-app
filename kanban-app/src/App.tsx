import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useKanbanStore } from './stores/kanbanStore';

import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import KanbanPage from './pages/KanbanPage';
import SchedulePage from './pages/SchedulePage';
import GanttPage from './pages/GanttPage';
import ReportsPage from './pages/ReportsPage';
import EmailPage from './pages/EmailPage';
import SettingsPage from './pages/SettingsPage';

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { init, user } = useAuthStore();
  const { subscribeProjects } = useKanbanStore();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (user) {
      const unsub = subscribeProjects(user.uid);
      return unsub;
    }
  }, [user?.uid]);

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInitializer>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid #374151',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#1f2937' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#1f2937' },
            },
          }}
        />

        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="kanban" element={<KanbanPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="gantt" element={<GanttPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="email" element={<EmailPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppInitializer>
    </BrowserRouter>
  );
}
