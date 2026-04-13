import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { KanbanProvider } from './contexts/KanbanContext';
import LoginPage from './components/auth/LoginPage';
import Sidebar from './components/layout/Sidebar';
import KanbanBoard from './components/kanban/KanbanBoard';
import GanttChart from './components/reports/GanttChart';
import ReportsPage from './components/reports/ReportsPage';
import SettingsPage from './components/common/SettingsPage';
import { initEmailService } from './services/emailService';

initEmailService();

function AppContent() {
  const { userProfile, loading, isDemo } = useAuth();
  const [currentView, setCurrentView] = useState('board');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!userProfile && !isDemo) {
    return <LoginPage />;
  }

  return (
    <KanbanProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 flex flex-col overflow-hidden">
          {currentView === 'board' && <KanbanBoard />}
          {currentView === 'gantt' && <GanttChart />}
          {currentView === 'reports' && <ReportsPage />}
          {currentView === 'settings' && <SettingsPage />}
        </main>
      </div>
    </KanbanProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
