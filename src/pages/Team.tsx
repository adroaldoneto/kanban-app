import { useState } from 'react'
import { useKanban } from '../contexts/KanbanContext'
import { UserPlus, Trash2, X, Mail, Briefcase, Users } from 'lucide-react'

export default function Team() {
  const { teamMembers, addTeamMember, deleteTeamMember, cards } = useKanban()
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await addTeamMember({
      name: name.trim(),
      email: email.trim(),
      role: role.trim(),
      avatar: '',
    })
    setName('')
    setEmail('')
    setRole('')
    setShowModal(false)
    setSaving(false)
  }

  const getMemberStats = (memberName: string) => {
    const memberCards = cards.filter((c) => c.assignee === memberName)
    const total = memberCards.length
    const done = memberCards.filter((c) => c.status === 'done').length
    const inProgress = memberCards.filter((c) => c.status === 'in_progress').length
    return { total, done, inProgress }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
          <p className="text-sm text-gray-500">{teamMembers.length} membros</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <UserPlus size={18} />
          Adicionar Membro
        </button>
      </div>

      {teamMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member) => {
            const stats = getMemberStats(member.name)
            return (
              <div key={member.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {member.name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      {member.role && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Briefcase size={12} />
                          {member.role}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTeamMember(member.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {member.email && (
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-3">
                    <Mail size={14} />
                    {member.email}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">{stats.total}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-yellow-600">{stats.inProgress}</p>
                    <p className="text-xs text-gray-500">Em Progresso</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{stats.done}</p>
                    <p className="text-xs text-gray-500">Concluídas</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum membro</h3>
          <p className="text-gray-500 mb-4">Adicione membros à equipe para gerenciar tarefas e escalas.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2">
            <UserPlus size={18} />
            Adicionar Membro
          </button>
        </div>
      )}

      {/* Add Member Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-lg">Novo Membro</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-field"
                  placeholder="Ex: Desenvolvedor, Designer..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
