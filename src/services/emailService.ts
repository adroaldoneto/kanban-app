import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const REPORT_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_REPORT_TEMPLATE_ID || '';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

export function initEmailService() {
  if (PUBLIC_KEY) {
    emailjs.init(PUBLIC_KEY);
  }
}

export async function sendReportByEmail(params: {
  toEmail: string;
  toName: string;
  subject: string;
  reportHtml: string;
  reportDate: string;
  projectName: string;
}): Promise<boolean> {
  if (!SERVICE_ID || !REPORT_TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('EmailJS não configurado. Configure VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_REPORT_TEMPLATE_ID e VITE_EMAILJS_PUBLIC_KEY.');
    throw new Error('Serviço de email não configurado. Adicione as variáveis de ambiente do EmailJS.');
  }

  try {
    await emailjs.send(SERVICE_ID, REPORT_TEMPLATE_ID, {
      to_email: params.toEmail,
      to_name: params.toName,
      subject: params.subject,
      report_content: params.reportHtml,
      report_date: params.reportDate,
      project_name: params.projectName,
    });
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(SERVICE_ID && REPORT_TEMPLATE_ID && PUBLIC_KEY);
}
