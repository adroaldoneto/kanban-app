import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, UserPlus, Kanban, Eye, EyeOff, Play } from 'lucide-react';

export default function LoginPage() {
  const { login, register, loginWithGoogle, setDemoMode } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        setError('Email ou senha incorretos.');
      } else if (msg.includes('auth/email-already-in-use')) {
        setError('Este email já está em uso.');
      } else if (msg.includes('auth/weak-password')) {
        setError('A senha deve ter no mínimo 6 caracteres.');
      } else if (msg.includes('auth/invalid-email')) {
        setError('Email inválido.');
      } else {
        setError('Erro ao autenticar. Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    try {
      await loginWithGoogle();
    } catch {
      setError('Erro ao conectar com Google.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl mb-4 border border-white/20">
            <Kanban className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Kanban Pro</h1>
          <p className="text-blue-200 mt-2">Gestão inteligente de projetos e escalas</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="flex rounded-xl bg-white/10 p-1 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isLogin ? 'bg-white text-indigo-700 shadow-md' : 'text-white/80 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-1.5" /> Entrar
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !isLogin ? 'bg-white text-indigo-700 shadow-md' : 'text-white/80 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-1.5" /> Registrar
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-white/80 text-sm mb-1.5">Nome completo</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required={!isLogin}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                  placeholder="Seu nome"
                />
              </div>
            )}
            <div>
              <label className="block text-white/80 text-sm mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/50 text-xs">ou</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          <button
            onClick={() => setDemoMode(true)}
            className="w-full mt-3 py-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 text-emerald-200 font-medium rounded-xl hover:from-emerald-500/30 hover:to-teal-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Experimentar modo demo
          </button>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Kanban Pro &copy; {new Date().getFullYear()} — Integrado com Sistema de Escalas
        </p>
      </div>
    </div>
  );
}
