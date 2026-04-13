import { useMemo, useState } from 'react'
import { useBoard } from '../contexts/BoardContext'
import { sendReportByEmail } from '../services/emailService'
import {
  buildReportEmailHtml,
  buildSummary,
  exportDailyPdf,
  exportElementAsImage,
} from '../services/reportService'

export function ReportsView() {
  const { tasks } = useBoard()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [recipient, setRecipient] = useState('')
  const [status, setStatus] = useState('')

  const dailyTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.startDate === selectedDate ||
          task.dueDate === selectedDate ||
          task.updatedAt.slice(0, 10) === selectedDate,
      ),
    [selectedDate, tasks],
  )

  const summary = useMemo(() => buildSummary(dailyTasks, selectedDate), [dailyTasks, selectedDate])

  const handleEmail = async () => {
    setStatus('')
    try {
      await sendReportByEmail({
        to: recipient,
        subject: `Relatório diário ${selectedDate}`,
        html: buildReportEmailHtml(dailyTasks, summary),
      })
      setStatus('Disparo de e-mail concluído.')
    } catch (error) {
      setStatus(`Falha no envio: ${(error as Error).message}`)
    }
  }

  return (
    <section className="panel">
      <h3>Relatórios Diários</h3>
      <p>Extraia relatório em PDF ou imagem e dispare por e-mail.</p>
      <div className="row three">
        <label>
          Data do relatório
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
        <button onClick={() => exportDailyPdf(dailyTasks, summary)}>Exportar PDF</button>
        <button onClick={() => void exportElementAsImage('daily-report', `relatorio-${selectedDate}.png`)}>
          Exportar foto
        </button>
      </div>

      <div id="daily-report" className="report-card">
        <h4>Resumo em {selectedDate}</h4>
        <p>
          Total: {summary.total} | Concluídas: {summary.done} | Em andamento: {summary.inProgress} |
          Atrasadas: {summary.delayed}
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tarefa</th>
                <th>Status</th>
                <th>Responsável</th>
                <th>Início</th>
                <th>Entrega</th>
              </tr>
            </thead>
            <tbody>
              {dailyTasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.status}</td>
                  <td>{task.assignee || '-'}</td>
                  <td>{task.startDate}</td>
                  <td>{task.dueDate}</td>
                </tr>
              ))}
              {!dailyTasks.length && (
                <tr>
                  <td colSpan={5}>Sem tarefas para a data selecionada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="row three">
        <label>
          E-mail de destino
          <input
            type="email"
            placeholder="gestao@empresa.com"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
          />
        </label>
        <button onClick={() => void handleEmail()}>Disparar por e-mail</button>
      </div>
      {status && <p>{status}</p>}
    </section>
  )
}
