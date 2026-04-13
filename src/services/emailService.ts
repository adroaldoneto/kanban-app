import { httpsCallable } from 'firebase/functions'
import { functions, isFirebaseConfigured } from '../firebase'

interface SendReportPayload {
  to: string
  subject: string
  html: string
}

export async function sendReportByEmail(payload: SendReportPayload) {
  if (!payload.to) {
    throw new Error('Informe um e-mail de destino.')
  }

  if (!isFirebaseConfigured) {
    window.location.href = `mailto:${payload.to}?subject=${encodeURIComponent(payload.subject)}`
    return
  }

  const callable = httpsCallable<SendReportPayload, { success: boolean }>(functions, 'sendReportEmail')
  await callable(payload)
}
