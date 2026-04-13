import { useState } from 'react';
import { Mail, Plus, Trash2, Send, CheckCircle2, AlertCircle, Settings, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sendBulkEmails, sendReportEmail } from '../utils/emailService';
import { useKanbanStore } from '../stores/kanbanStore';
import { useAuthStore } from '../stores/authStore';
import Header from '../components/layout/Header';
import toast from 'react-hot-toast';

interface Recipient {
  id: string;
  email: string;
  name: string;
}

export default function EmailPage() {
  const { tasks, activeProject } = useKanbanStore();
  const { user } = useAuthStore();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [subject, setSubject] = useState('Relatório Diário — KanFlow');
  const [message, setMessage] = useState('');
  const [sendMode, setSendMode] = useState<'daily' | 'custom'>('daily');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<{ success: string[]; failed: string[] } | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'done').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    overdue: tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length,
    rate: tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100) : 0,
  };

  const addRecipient = () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast.error('E-mail inválido.');
      return;
    }
    setRecipients([...recipients, { id: Date.now().toString(), email: newEmail.trim(), name: newName.trim() || newEmail }]);
    setNewEmail('');
    setNewName('');
  };

  const removeRecipient = (id: string) => setRecipients(recipients.filter((r) => r.id !== id));

  const buildPayload = () => ({
    from_name: user?.displayName || 'KanFlow',
    subject,
    message: sendMode === 'daily' ? buildDailyMessage() : message,
    project_name: activeProject?.name || '',
    report_date: format(new Date(), "dd/MM/yyyy 'às' HH:mm"),
    total_tasks: stats.total,
    completed_tasks: stats.done,
    in_progress_tasks: stats.inProgress,
    overdue_tasks: stats.overdue,
    completion_rate: stats.rate,
  });

  const buildDailyMessage = () => `
📋 RELATÓRIO DIÁRIO — ${activeProject?.name || 'Projeto'}
📅 ${format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}

📊 RESUMO DO PROJETO:
• Total de tarefas: ${stats.total}
• ✅ Concluídas: ${stats.done} (${stats.rate}%)
• 🔄 Em progresso: ${stats.inProgress}
• ⚠️  Atrasadas: ${stats.overdue}

Acesse o KanFlow para mais detalhes e acompanhar o progresso em tempo real.

—
KanFlow | Sistema integrado de Kanban & Escalas
  `.trim();

  const handleSend = async () => {
    if (recipients.length === 0) {
      toast.error('Adicione pelo menos um destinatário.');
      return;
    }
    setSending(true);
    setResults(null);
    try {
      const res = await sendBulkEmails(recipients, buildPayload());
      setResults(res);
      if (res.failed.length === 0) {
        toast.success(`${res.success.length} e-mail(s) enviado(s) com sucesso!`);
      } else {
        toast.error(`${res.failed.length} e-mail(s) falharam.`);
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message;
      toast.error(msg || 'Erro ao enviar e-mails.');
    } finally {
      setSending(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail.includes('@')) return toast.error('E-mail inválido.');
    setSendingTest(true);
    try {
      await sendReportEmail({
        to_email: testEmail,
        to_name: 'Teste',
        ...buildPayload(),
        message: '✅ Este é um e-mail de teste do KanFlow. Sua configuração está funcionando!',
      });
      toast.success('E-mail de teste enviado!');
    } catch (err: unknown) {
      const msg = (err as Error)?.message;
      toast.error(msg || 'Erro ao enviar e-mail de teste. Verifique a configuração do EmailJS.');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Disparar E-mails" subtitle="Envie relatórios por e-mail" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Config notice */}
        <div className="card p-4 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <Settings size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-300 mb-1">Configuração necessária</p>
              <p className="text-xs text-yellow-200/70">
                Para enviar e-mails reais, configure o{' '}
                <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" className="underline">
                  EmailJS
                </a>{' '}
                e adicione as variáveis <code className="bg-black/30 px-1 rounded">VITE_EMAILJS_*</code> ao arquivo <code className="bg-black/30 px-1 rounded">.env</code>.
              </p>
            </div>
            <button onClick={() => setShowConfig(!showConfig)} className="text-yellow-400 hover:text-yellow-300">
              <HelpCircle size={16} />
            </button>
          </div>

          {showConfig && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-yellow-200/70 font-mono bg-black/20 p-3 rounded-lg leading-relaxed">
                1. Crie uma conta em emailjs.com<br />
                2. Crie um serviço de e-mail (Gmail, Outlook, etc.)<br />
                3. Crie um template com as variáveis: {'{{to_name}}'}, {'{{message}}'}, {'{{project_name}}'}, {'{{report_date}}'}<br />
                4. Adicione ao .env:<br />
                {'   '}VITE_EMAILJS_SERVICE_ID=service_xxx<br />
                {'   '}VITE_EMAILJS_TEMPLATE_ID=template_xxx<br />
                {'   '}VITE_EMAILJS_PUBLIC_KEY=your_public_key
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="input flex-1 text-sm"
                  placeholder="E-mail para teste..."
                />
                <button onClick={handleTestEmail} disabled={sendingTest} className="btn-secondary text-sm">
                  {sendingTest ? 'Enviando...' : 'Enviar Teste'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left: compose */}
          <div className="space-y-5">
            {/* Recipients */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <Mail size={18} className="text-indigo-400" />
                Destinatários ({recipients.length})
              </h3>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="input flex-1 text-sm"
                  placeholder="Nome"
                />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
                  className="input flex-1 text-sm"
                  placeholder="email@exemplo.com"
                />
                <button onClick={addRecipient} className="btn-primary">
                  <Plus size={16} />
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {recipients.map((r) => (
                  <div key={r.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm text-gray-200">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.email}</p>
                    </div>
                    <button onClick={() => removeRecipient(r.id)} className="p-1 text-gray-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {recipients.length === 0 && (
                  <p className="text-sm text-gray-600 text-center py-4">Nenhum destinatário adicionado</p>
                )}
              </div>
            </div>

            {/* Message mode */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-200 mb-4">Conteúdo do E-mail</h3>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSendMode('daily')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${sendMode === 'daily' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                  Relatório Diário
                </button>
                <button
                  onClick={() => setSendMode('custom')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${sendMode === 'custom' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                  Mensagem Personalizada
                </button>
              </div>

              <div className="mb-3">
                <label className="label">Assunto</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input"
                />
              </div>

              {sendMode === 'custom' ? (
                <div>
                  <label className="label">Mensagem</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="input resize-none"
                    rows={6}
                    placeholder="Digite sua mensagem personalizada..."
                  />
                </div>
              ) : (
                <div className="bg-gray-800/50 rounded-lg p-4 text-xs text-gray-400 font-mono leading-relaxed whitespace-pre-wrap">
                  {buildDailyMessage()}
                </div>
              )}
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending || recipients.length === 0}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              <Send size={18} />
              {sending ? `Enviando para ${recipients.length} destinatário(s)...` : `Enviar para ${recipients.length} destinatário(s)`}
            </button>
          </div>

          {/* Right: preview & results */}
          <div className="space-y-5">
            {/* Project stats preview */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-200 mb-4">Dados do Relatório</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Projeto</span>
                  <span className="text-gray-200 font-medium">{activeProject?.name || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Data</span>
                  <span className="text-gray-200">{format(new Date(), "dd/MM/yyyy HH:mm")}</span>
                </div>
                <hr className="border-gray-800" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total de tarefas</span>
                  <span className="text-gray-200 font-bold">{stats.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Concluídas</span>
                  <span className="text-green-400 font-bold">{stats.done}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Em progresso</span>
                  <span className="text-yellow-400 font-bold">{stats.inProgress}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Atrasadas</span>
                  <span className="text-red-400 font-bold">{stats.overdue}</span>
                </div>
                <hr className="border-gray-800" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taxa de conclusão</span>
                  <span className="text-indigo-400 font-bold">{stats.rate}%</span>
                </div>
              </div>
            </div>

            {/* Send results */}
            {results && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-200 mb-4">Resultado do Envio</h3>
                {results.success.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-green-400 mb-2 text-sm font-medium">
                      <CheckCircle2 size={16} />
                      Enviados com sucesso ({results.success.length})
                    </div>
                    <div className="space-y-1">
                      {results.success.map((email) => (
                        <div key={email} className="text-xs text-gray-400 bg-green-500/5 border border-green-500/20 rounded px-3 py-1.5">
                          {email}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {results.failed.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-red-400 mb-2 text-sm font-medium">
                      <AlertCircle size={16} />
                      Falharam ({results.failed.length})
                    </div>
                    <div className="space-y-1">
                      {results.failed.map((email) => (
                        <div key={email} className="text-xs text-gray-400 bg-red-500/5 border border-red-500/20 rounded px-3 py-1.5">
                          {email}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tips */}
            <div className="card p-5 border-indigo-500/20">
              <h3 className="font-semibold text-gray-200 mb-3 flex items-center gap-2">
                <HelpCircle size={16} className="text-indigo-400" />
                Dicas de uso
              </h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5">•</span>
                  Use o <strong className="text-gray-400">Relatório Diário</strong> para enviar um resumo automático das métricas
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5">•</span>
                  Combine com a exportação de <strong className="text-gray-400">PDF</strong> na página de Relatórios para envios completos
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5">•</span>
                  Configure o <strong className="text-gray-400">EmailJS</strong> com templates personalizados com a identidade visual da empresa
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
