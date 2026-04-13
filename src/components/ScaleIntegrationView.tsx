import { useMemo, useState } from 'react'
import { useBoard } from '../contexts/BoardContext'
import { useAuth } from '../contexts/AuthContext'
import { convertShiftToTask, fetchShiftItems } from '../services/scheduleService'
import { ShiftItem } from '../types'

export function ScaleIntegrationView() {
  const { importTasks } = useBoard()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [shiftItems, setShiftItems] = useState<ShiftItem[]>([])
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [message, setMessage] = useState('')

  const hasScaleApi = useMemo(() => Boolean(import.meta.env.VITE_SCALE_API_URL), [])

  const handleSync = async () => {
    setLoading(true)
    setMessage('')
    try {
      const token = user?.uid === 'demo-user' ? undefined : await user?.getIdToken()
      const items = await fetchShiftItems({ startDate, endDate, token })
      setShiftItems(items)
      await importTasks(items.map(convertShiftToTask))
      setMessage(`${items.length} itens da escala importados para o Kanban.`)
    } catch (error) {
      setMessage((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel">
      <h3>Integração com sistema de escala</h3>
      <p>
        Sincronize turnos para criar cartões automáticos no Kanban. Endpoint atual:{" "}
        {hasScaleApi ? import.meta.env.VITE_SCALE_API_URL : 'modo mock (sem API configurada)'}
      </p>

      <div className="row three">
        <label>
          Data inicial
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label>
          Data final
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
        <button onClick={() => void handleSync()} disabled={loading}>
          {loading ? 'Sincronizando...' : 'Sincronizar escala'}
        </button>
      </div>

      {message && <p>{message}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID Escala</th>
              <th>Atividade</th>
              <th>Colaborador</th>
              <th>Período</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {shiftItems.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.title}</td>
                <td>{item.collaborator}</td>
                <td>
                  {item.startDate} até {item.endDate}
                </td>
                <td>{item.status}</td>
              </tr>
            ))}
            {!shiftItems.length && (
              <tr>
                <td colSpan={5}>Nenhum item sincronizado ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
