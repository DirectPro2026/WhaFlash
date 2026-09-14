import type { ChatSummary, Contact, Label, WhatsAppProfile } from '../core/types';
import type { WhatsAppAction, WhatsAppActionPayloads, WhatsAppActionResults } from '../core/whatsapp/protocol';

export async function whatsappRequest<A extends WhatsAppAction>(
  action: A,
  payload: WhatsAppActionPayloads[A],
): Promise<WhatsAppActionResults[A]> {
  const requestId = crypto.randomUUID();
  const response = await chrome.runtime.sendMessage({
    type: 'WHATSAPP_REQUEST',
    requestId,
    action,
    payload,
  });

  if (!response?.ok) throw new Error(response?.error ?? 'WhatsApp request failed');
  return response.data as WhatsAppActionResults[A];
}

export const whatsappApi = {
  listChats: () => whatsappRequest('chats.list', {}) as Promise<ChatSummary[]>,
  getContact: (id: string) => whatsappRequest('contacts.get', { id }) as Promise<Contact | null>,
  markChatRead: (id: string) => whatsappRequest('chats.markRead', { id }) as Promise<void>,
  getProfile: () => whatsappRequest('profile.get', {}) as Promise<WhatsAppProfile>,
  listLabels: () => whatsappRequest('labels.list', {}) as Promise<Label[]>,
};
