import type { ChatId, ChatSummary, Contact, ContactId, Label, WhatsAppProfile } from '../types';

export type WhatsAppAction =
  | 'runtime.status'
  | 'chats.list'
  | 'contacts.get'
  | 'chats.markRead'
  | 'profile.get'
  | 'labels.list'
  | 'media.download';

export interface WhatsAppActionPayloads {
  'runtime.status': Record<string, never>;
  'chats.list': Record<string, never>;
  'contacts.get': { id: ContactId };
  'chats.markRead': { id: ChatId };
  'profile.get': Record<string, never>;
  'labels.list': Record<string, never>;
  'media.download': { messageId: string };
}

export interface WhatsAppActionResults {
  'runtime.status': { ready: boolean; provider: string };
  'chats.list': ChatSummary[];
  'contacts.get': Contact | null;
  'chats.markRead': void;
  'profile.get': WhatsAppProfile;
  'labels.list': Label[];
  'media.download': unknown;
}

export interface BridgeRequest<A extends WhatsAppAction = WhatsAppAction> {
  source: 'whaflash-modern';
  type: 'WHATSAPP_REQUEST';
  requestId: string;
  action: A;
  payload: WhatsAppActionPayloads[A];
  nonce: string;
}

export interface BridgeResponse<A extends WhatsAppAction = WhatsAppAction> {
  source: 'whaflash-modern';
  type: 'WHATSAPP_RESPONSE';
  requestId: string;
  action: A;
  nonce: string;
  result?: WhatsAppActionResults[A];
  error?: string;
}
