import type { WhatsAppAdapter } from '../types';
import type { Contact as CrmContact } from '../../types/crm';

export interface ContactRepository {
  upsertContact(contact: CrmContact): void;
}

/**
 * Keeps WhatsApp transport concerns out of the CRM store.
 * Only fields already exposed by the WhatsApp adapter are synchronized.
 */
export async function syncWhatsAppContacts(
  adapter: WhatsAppAdapter,
  repository: ContactRepository,
): Promise<number> {
  const chats = await adapter.getChats();
  let synced = 0;

  for (const chat of chats) {
    if (!chat.id || chat.isGroup) continue;
    const contact = await adapter.getContact(chat.id);
    if (!contact) continue;

    repository.upsertContact({
      id: contact.id,
      name: contact.name || chat.name,
      phone: contact.phone ?? '',
      email: contact.email,
      company: contact.company,
      notes: contact.notes,
      labels: contact.labels,
      updatedAt: Date.now(),
    });
    synced += 1;
  }

  return synced;
}
