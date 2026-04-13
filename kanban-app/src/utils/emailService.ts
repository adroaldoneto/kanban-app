import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

export interface EmailPayload {
  to_email: string;
  to_name: string;
  from_name: string;
  subject: string;
  message: string;
  project_name?: string;
  report_date?: string;
  total_tasks?: number;
  completed_tasks?: number;
  in_progress_tasks?: number;
  overdue_tasks?: number;
  completion_rate?: number;
}

export async function sendReportEmail(payload: EmailPayload): Promise<void> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    throw new Error('EmailJS não configurado. Adicione as variáveis VITE_EMAILJS_* no .env');
  }

  await emailjs.send(SERVICE_ID, TEMPLATE_ID, payload as unknown as Record<string, unknown>, PUBLIC_KEY);
}

export async function sendBulkEmails(
  recipients: Array<{ email: string; name: string }>,
  payload: Omit<EmailPayload, 'to_email' | 'to_name'>
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = [];
  const failed: string[] = [];

  for (const recipient of recipients) {
    try {
      await sendReportEmail({
        ...payload,
        to_email: recipient.email,
        to_name: recipient.name,
      });
      success.push(recipient.email);
      await new Promise((r) => setTimeout(r, 300));
    } catch {
      failed.push(recipient.email);
    }
  }

  return { success, failed };
}
