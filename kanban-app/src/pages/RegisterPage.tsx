import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, FolderKanban } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function RegisterPage() {
  const { register, loading, error, clearError } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');
    if (password !== confirm) {
      setLocalError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setLocalError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    await register(email, password, name);
  };

  const displayError = error || localError;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
            <FolderKanban size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">KanFlow</h1>
          <p className="text-gray-500 mt-1 text-sm">Crie sua conta gratuitamente</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-semibold text-gray-100 mb-6">Criar nova conta</h2>

          {displayError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome completo</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input pl-9"
                  placeholder="Seu nome"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-9"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Confirmar senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input pl-9"
                  placeholder="Repita a senha"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Já tem conta?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
