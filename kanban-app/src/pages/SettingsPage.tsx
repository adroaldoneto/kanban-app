import { useState } from 'react';
import { User, Shield, Bell, Palette, Key, Save } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useKanbanStore } from '../stores/kanbanStore';
import Header from '../components/layout/Header';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { activeProject, updateProject } = useKanbanStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [projectName, setProjectName] = useState(activeProject?.name || '');
  const [projectDesc, setProjectDesc] = useState(activeProject?.description || '');
  const [projectColor, setProjectColor] = useState(activeProject?.color || '#6366f1');

  const handleSaveProfile = () => {
    toast.success('Perfil salvo! (Para atualizar nome, use o Firebase Console)');
  };

  const handleSaveProject = async () => {
    if (!activeProject) return;
    await updateProject(activeProject.id, {
      name: projectName,
      description: projectDesc,
      color: projectColor,
    });
    toast.success('Projeto atualizado!');
  };

  const PROJECT_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#06b6d4',
    '#3b82f6', '#14b8a6',
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title="Configurações" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl">
        {/* Profile */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <User size={18} className="text-indigo-400" />
            Perfil do Usuário
          </h3>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
              {user?.displayName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-200">{user?.displayName}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">{user?.role}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="label">Nome de exibição</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input type="email" value={user?.email || ''} className="input opacity-50 cursor-not-allowed" readOnly />
            </div>
          </div>

          <button onClick={handleSaveProfile} className="btn-primary flex items-center gap-2 mt-4">
            <Save size={16} /> Salvar perfil
          </button>
        </div>

        {/* Project settings */}
        {activeProject && (
          <div className="card p-6">
            <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <Palette size={18} className="text-purple-400" />
              Configurações do Projeto Ativo
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label">Nome do projeto</label>
                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Descrição</label>
                <textarea value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} className="input resize-none" rows={2} />
              </div>
              <div>
                <label className="label">Cor do projeto</label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setProjectColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${projectColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button onClick={handleSaveProject} className="btn-primary flex items-center gap-2 mt-4">
              <Save size={16} /> Salvar projeto
            </button>
          </div>
        )}

        {/* Firebase info */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Key size={18} className="text-yellow-400" />
            Configuração Firebase
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Configure as variáveis de ambiente no arquivo <code className="bg-gray-800 px-1.5 py-0.5 rounded text-indigo-300">.env</code> para conectar ao seu projeto Firebase.
          </p>
          <div className="bg-gray-800/50 rounded-lg p-3 font-mono text-xs text-gray-400 space-y-1">
            <p>VITE_FIREBASE_API_KEY=<span className="text-yellow-400">sua_api_key</span></p>
            <p>VITE_FIREBASE_AUTH_DOMAIN=<span className="text-yellow-400">projeto.firebaseapp.com</span></p>
            <p>VITE_FIREBASE_PROJECT_ID=<span className="text-yellow-400">id_do_projeto</span></p>
            <p>VITE_FIREBASE_STORAGE_BUCKET=<span className="text-yellow-400">projeto.appspot.com</span></p>
            <p>VITE_FIREBASE_MESSAGING_SENDER_ID=<span className="text-yellow-400">000000000000</span></p>
            <p>VITE_FIREBASE_APP_ID=<span className="text-yellow-400">1:000:web:000</span></p>
          </div>
        </div>

        {/* Notification settings */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Bell size={18} className="text-green-400" />
            Notificações
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Tarefas atrasadas', desc: 'Notificar quando uma tarefa passar da data limite' },
              { label: 'Novas tarefas atribuídas', desc: 'Notificar quando uma tarefa for atribuída a mim' },
              { label: 'Relatório diário automático', desc: 'Receber resumo diário por e-mail às 08:00' },
            ].map(({ label, desc }, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-200">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Shield size={18} className="text-red-400" />
            Segurança
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            A autenticação é gerenciada pelo Firebase Authentication. Para redefinir a senha, use a opção "Esqueci a senha" na página de login.
          </p>
          <div className="flex gap-3">
            <button className="btn-secondary text-sm">Redefinir senha</button>
            <button className="btn-danger text-sm">Excluir conta</button>
          </div>
        </div>
      </div>
    </div>
  );
}
