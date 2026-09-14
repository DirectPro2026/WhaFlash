import type { WhatsAppAdapter } from '../types';
import type { Contact as CrmContact } from '../../types/crm';

export interface ContactRepository {
  upsertContact(contact: CrmContact): void;
}

export interface SyncReport {
  discovered: number;
  synced: number;
  skippedGroups: number;
  missingContacts: number;
}

/**
 * Synchronizes the normalized WhatsApp contact surface into the local CRM.
 * It intentionally does not send CRM-only fields back to WhatsApp or any
 * external service.
 */
export async function syncWhatsAppContacts(
  adapter: WhatsAppAdapter,
  repository: ContactRepository,
): Promise<SyncReport> {
  const chats = await adapter.getChats();
  const report: SyncReport = { discovered: chats.length, synced: 0, skippedGroups: 0, missingContacts: 0 };

  for (const chat of chats) {
    if (!chat.id || chat.isGroup) {
      if (chat.isGroup) report.skippedGroups += 1;
      continue;
    }

    const contact = await adapter.getContact(chat.id);
    if (!contact) {
      report.missingContacts += 1;
      continue;
    }

    const crmContact: CrmContact = {
      id: contact.id,
      name: contact.name || chat.name,
      phone: contact.phone ?? '',
      email: contact.email,
      company: contact.company,
      notes: contact.notes,
      labels: contact.labels,
      updatedAt: Date.now(),
    };

    repository.upsertContact(crmContact);
    report.synced += 1;
  }

  return report;
}
