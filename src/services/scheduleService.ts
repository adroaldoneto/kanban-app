import axios from 'axios'
import { ShiftItem, TaskInput } from '../types'

interface FetchShiftParams {
  startDate: string
  endDate: string
  token?: string
}

function normalizeStatus(status: ShiftItem['status']): TaskInput['status'] {
  if (status === 'done') {
    return 'done'
  }
  if (status === 'running') {
    return 'in_progress'
  }
  return 'todo'
}

export async function fetchShiftItems(params: FetchShiftParams): Promise<ShiftItem[]> {
  const baseUrl = import.meta.env.VITE_SCALE_API_URL
  if (!baseUrl) {
    return [
      {
        id: 'shift-demo-1',
        title: 'Plantão UTI - Noite',
        collaborator: 'Fernanda',
        startDate: params.startDate,
        endDate: params.endDate,
        status: 'planned',
      },
      {
        id: 'shift-demo-2',
        title: 'Cobertura Ambulatório',
        collaborator: 'Lucas',
        startDate: params.startDate,
        endDate: params.endDate,
        status: 'running',
      },
    ]
  }

  const response = await axios.get<ShiftItem[]>(`${baseUrl}/shifts`, {
    params: { startDate: params.startDate, endDate: params.endDate },
    headers: params.token ? { Authorization: `Bearer ${params.token}` } : undefined,
  })
  return response.data
}

export function convertShiftToTask(shift: ShiftItem): TaskInput {
  return {
    title: shift.title,
    description: `Importado da escala para ${shift.collaborator}`,
    assignee: shift.collaborator,
    startDate: shift.startDate,
    dueDate: shift.endDate,
    priority: 'media',
    status: normalizeStatus(shift.status),
    shiftId: shift.id,
    source: 'escala',
  }
}
