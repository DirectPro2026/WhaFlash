import type { Contact } from '../../types/crm';

const columns: Array<keyof Contact> = ['id', 'name', 'phone', 'email', 'city', 'state', 'company', 'job', 'labels', 'value', 'stageId', 'notes', 'updatedAt'];

export function contactsToCsv(contacts: Contact[]): string {
  const header = columns.map((column) => escapeCsv(String(column))).join(',');
  const rows = contacts.map((contact) => columns.map((column) => {
    const value = contact[column];
    return escapeCsv(Array.isArray(value) ? value.join(' | ') : value == null ? '' : String(value));
  }).join(','));
  return `\uFEFF${[header, ...rows].join('\n')}`;
}

export function downloadContactsCsv(contacts: Contact[], filename = `whaflash-contatos-${new Date().toISOString().slice(0, 10)}.csv`): void {
  const blob = new Blob([contactsToCsv(contacts)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}
