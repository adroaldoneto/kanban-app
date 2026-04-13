import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useKanban } from '../../contexts/KanbanContext';
import {
  Settings, User, Palette, Bell, Shield, Database,
  Save, Trash2, Edit2, Check, X,
} from 'lucide-react';
import { PROJECT_COLORS } from '../../types';

export default function SettingsPage() {
  const { userProfile, isDemo } = useAuth();
  const { currentProject, updateProject, deleteProject } = useKanban();
  const [editingProject, setEditingProject] = useState(false);
  const [projectName, setProjectName] = useState(currentProject?.name || '');
  const [projectDesc, setProjectDesc] = useState(currentProject?.description || '');
  const [projectColor, setProjectColor] = useState(currentProject?.color || '#3b82f6');
  const [saved, setSaved] = useState(false);

  async function handleSaveProject() {
    if (!currentProject) return;
    await updateProject(currentProject.id, {
      name: projectName,
      description: projectDesc,
      color: projectColor,
    });
    setEditingProject(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-500" />
          Configurações
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">Gerencie seu perfil e projeto</p>
      </div>

      <div className="p-6 max-w-3xl space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" /> Perfil
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Nome</label>
              <p className="font-medium text-gray-800">{userProfile?.displayName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="font-medium text-gray-800">{userProfile?.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Função</label>
              <p className="font-medium text-gray-800 capitalize">{userProfile?.role}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Modo</label>
              <p className="font-medium text-gray-800">{isDemo ? 'Demo' : 'Produção'}</p>
            </div>
          </div>
        </div>

        {currentProject && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-500" /> Projeto Atual
              </h3>
              {!editingProject ? (
                <button
                  onClick={() => {
                    setEditingProject(true);
                    setProjectName(currentProject.name);
                    setProjectDesc(currentProject.description);
                    setProjectColor(currentProject.color);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
                >
                  <Edit2 className="w-4 h-4" /> Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleSaveProject} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
                    <Save className="w-4 h-4" /> Salvar
                  </button>
                  <button onClick={() => setEditingProject(false)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition">
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                </div>
              )}
            </div>

            {saved && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" /> Projeto atualizado com sucesso!
              </div>
            )}

            {editingProject ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
                  <textarea
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cor</label>
                  <div className="flex gap-2">
                    {PROJECT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setProjectColor(color)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          projectColor === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Nome</label>
                  <p className="font-medium text-gray-800 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: currentProject.color }} />
                    {currentProject.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Membros</label>
                  <p className="font-medium text-gray-800">{currentProject.members.length} membros</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-500">Descrição</label>
                  <p className="text-gray-800">{currentProject.description || 'Sem descrição'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" /> Email & Notificações
          </h3>
          <div className="space-y-3 text-sm">
            <p className="text-gray-600">
              Para ativar o envio de relatórios por email, configure as seguintes variáveis de ambiente:
            </p>
            <div className="bg-gray-50 rounded-xl p-4 font-mono text-xs space-y-1">
              <p>VITE_EMAILJS_SERVICE_ID=seu_service_id</p>
              <p>VITE_EMAILJS_REPORT_TEMPLATE_ID=seu_template_id</p>
              <p>VITE_EMAILJS_PUBLIC_KEY=sua_public_key</p>
            </div>
            <p className="text-gray-500">
              Crie uma conta em{' '}
              <a href="https://www.emailjs.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                emailjs.com
              </a>{' '}
              e configure um template com as variáveis: to_email, to_name, subject, report_content, report_date, project_name.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-green-500" /> Firebase
          </h3>
          <div className="space-y-3 text-sm">
            <p className="text-gray-600">
              Configure o Firebase para persistir dados. Adicione as variáveis no arquivo <code className="bg-gray-100 px-1.5 py-0.5 rounded">.env</code>:
            </p>
            <div className="bg-gray-50 rounded-xl p-4 font-mono text-xs space-y-1">
              <p>VITE_FIREBASE_API_KEY=sua_api_key</p>
              <p>VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com</p>
              <p>VITE_FIREBASE_PROJECT_ID=seu_projeto</p>
              <p>VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com</p>
              <p>VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000</p>
              <p>VITE_FIREBASE_APP_ID=1:000:web:000</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
          <h3 className="font-semibold text-red-700 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" /> Zona de Perigo
          </h3>
          {currentProject && (
            <button
              onClick={() => {
                if (window.confirm(`Tem certeza que deseja excluir o projeto "${currentProject.name}"?`)) {
                  deleteProject(currentProject.id);
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition"
            >
              <Trash2 className="w-4 h-4" /> Excluir projeto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
