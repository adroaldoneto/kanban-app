import { HttpsError, onCall } from 'firebase-functions/v2/https'
import nodemailer from 'nodemailer'

interface SendReportPayload {
  to: string
  subject: string
  html: string
}

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Variável ${name} não configurada.`)
  }
  return value
}

export const sendReportEmail = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado.')
  }

  const payload = request.data as SendReportPayload
  if (!payload?.to || !payload.subject || !payload.html) {
    throw new HttpsError('invalid-argument', 'Payload inválido.')
  }

  const transporter = nodemailer.createTransport({
    host: requiredEnv('SMTP_HOST'),
    port: Number(requiredEnv('SMTP_PORT')),
    secure: false,
    auth: {
      user: requiredEnv('SMTP_USER'),
      pass: requiredEnv('SMTP_PASS'),
    },
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? requiredEnv('SMTP_USER'),
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  })

  return { success: true }
})
