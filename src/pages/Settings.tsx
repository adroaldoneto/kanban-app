import { useState } from 'react'
import { useKanban } from '../contexts/KanbanContext'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Trash2, Edit3, X, FolderOpen, Info } from 'lucide-react'

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6',
]

export default function Settings() {
  const { currentUser } = useAuth()
  const { projects, currentProject, addProject, updateProject, deleteProject, setCurrentProject } = useKanban()
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [saving, setSaving] = useState(false)

  const openCreate = () => {
    setEditingProject(null)
    setName('')
    setDescription('')
    setColor(PROJECT_COLORS[0])
    setShowModal(true)
  }

  const openEdit = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    setEditingProject(projectId)
    setName(project.name)
    setDescription(project.description)
    setColor(project.color)
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !currentUser) return
    setSaving(true)

    if (editingProject) {
      await updateProject(editingProject, { name, description, color })
    } else {
      await addProject({
        name,
        description,
        color,
        ownerId: currentUser.uid,
        members: [currentUser.uid],
      })
    }

    setSaving(false)
    setShowModal(false)
  }

  const handleDelete = async (projectId: string) => {
    if (window.confirm('Tem certeza? Todos os dados deste projeto serão excluídos.')) {
      await deleteProject(projectId)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500">Gerencie seus projetos e preferências</p>
      </div>

      {/* User Info */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Informações da Conta</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
            {currentUser?.displayName?.[0] || currentUser?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-lg font-semibold">{currentUser?.displayName || 'Usuário'}</p>
            <p className="text-gray-500">{currentUser?.email}</p>
          </div>
        </div>
      </div>

      {/* Firebase Config Info */}
      <div className="card mb-6 border-blue-200 bg-blue-50">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800 mb-1">Configuração Firebase</h3>
            <p className="text-sm text-blue-700 mb-2">
              Para usar todas as funcionalidades, configure as variáveis de ambiente no arquivo <code className="bg-blue-100 px-1 rounded">.env</code>:
            </p>
            <pre className="text-xs bg-blue-100 p-3 rounded-lg text-blue-800 overflow-x-auto">
{`VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000
VITE_FIREBASE_APP_ID=1:000:web:000

# Para envio de emails (EmailJS)
VITE_EMAILJS_SERVICE_ID=service_id
VITE_EMAILJS_TEMPLATE_ID=template_id
VITE_EMAILJS_PUBLIC_KEY=public_key`}
            </pre>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Projetos</h3>
          <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus size={14} />
            Novo Projeto
          </button>
        </div>

        {projects.length > 0 ? (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                  currentProject?.id === project.id
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setCurrentProject(project)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <div>
                    <p className="font-medium">{project.name}</p>
                    {project.description && (
                      <p className="text-sm text-gray-500">{project.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      Criado em {project.createdAt ? new Date(project.createdAt).toLocaleDateString('pt-BR') : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentProject?.id === project.id && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      Ativo
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(project.id) }}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(project.id) }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h4 className="text-lg font-semibold text-gray-700 mb-2">Nenhum projeto</h4>
            <p className="text-gray-500 mb-4">Crie seu primeiro projeto para começar.</p>
            <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
              <Plus size={18} />
              Criar Projeto
            </button>
          </div>
        )}
      </div>

      {/* Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-lg">
                {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Nome do projeto"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field min-h-[80px]"
                  placeholder="Descreva o projeto..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
                <div className="flex gap-2">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Salvando...' : editingProject ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
