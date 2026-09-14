import type { ChatSummary, Contact, Label, WhatsAppProfile } from '../core/types';
import type { WhatsAppAction, WhatsAppActionPayloads, WhatsAppActionResults } from '../core/whatsapp/protocol';

export async function whatsappRequest<A extends WhatsAppAction>(
  action: A,
  payload: WhatsAppActionPayloads[A],
): Promise<WhatsAppActionResults[A]> {
  const requestId = crypto.randomUUID();
  const response = await chrome.runtime.sendMessage({ type: 'WHATSAPP_REQUEST', requestId, action, payload });
  if (!response?.ok) throw new Error(response?.error ?? 'WhatsApp request failed');
  return response.data as WhatsAppActionResults[A];
}

export const whatsappApi = {
  getRuntimeStatus: () => whatsappRequest('runtime.status', {}),
  listChats: () => whatsappRequest('chats.list', {}),
  getContact: (id: string) => whatsappRequest('contacts.get', { id }),
  markChatRead: (id: string) => whatsappRequest('chats.markRead', { id }),
  getProfile: () => whatsappRequest('profile.get', {}),
  listLabels: () => whatsappRequest('labels.list', {}),
  downloadMedia: (messageId: string) => whatsappRequest('media.download', { messageId }),
};

export type { ChatSummary, Contact, Label, WhatsAppProfile };
