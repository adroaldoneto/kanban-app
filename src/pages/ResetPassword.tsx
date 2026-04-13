import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Kanban, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setSuccess(true)
    } catch {
      setError('Erro ao enviar email de recuperação. Verifique o endereço.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Kanban size={32} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-indigo-600">Kanban Pro</h1>
        </div>

        <div className="card p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Recuperar Senha</h2>
          <p className="text-gray-500 mb-6">Enviaremos um link para redefinir sua senha</p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
              <p className="text-green-700 font-medium mb-2">Email enviado!</p>
              <p className="text-gray-500 text-sm mb-6">
                Verifique sua caixa de entrada e siga as instruções.
              </p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                <ArrowLeft size={16} />
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>
          )}

          <p className="text-center mt-6 text-sm">
            <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-700 inline-flex items-center gap-1">
              <ArrowLeft size={14} />
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
