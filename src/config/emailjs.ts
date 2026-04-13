export const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_demo',
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_demo',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'demo_key',
}
