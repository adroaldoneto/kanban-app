import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function v4Fallback(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function formatDate(dateStr: string, fmt: string = 'dd/MM/yyyy'): string {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, fmt, { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  return formatDate(dateStr, "dd/MM/yyyy 'às' HH:mm");
}

export function daysUntil(dateStr: string): number {
  try {
    return differenceInDays(parseISO(dateStr), new Date());
  } catch {
    return 0;
  }
}

export function getDueDateColor(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return 'text-red-600 bg-red-50';
  if (days <= 2) return 'text-amber-600 bg-amber-50';
  return 'text-green-600 bg-green-50';
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function dateLocale() {
  return ptBR;
}
